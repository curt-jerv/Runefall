// ---- v166: monster elemental resistance (Diablo 2 style) -------------
// Elemental hits ignore Defence/armor and are cut by the target's resist %
// for that element (normal damage is the only thing armor mitigates).
// Default: an element monster resists its own element by 25%. Extra rules
// below cover the named cases (cold: Frosthold dwarves/brutes/axemen,
// Mastodon, frozen zombies; fire: raptors; poison: everything in the Black
// Marsh; lightning: Kraken via its dmgType).
const ENEMY_BASE_RESIST = 25;
const ENEMY_RESIST_TYPES = { fhtemplar:{cold:25}, fhdwarf:{cold:25}, fhcleric:{cold:25}, fhbrute:{cold:25}, fhaxe:{cold:25}, frozenzombie:{cold:25}, raptor:{fire:25}, lightningraptor:{fire:25}, balrog:{fire:25}, gojira:{fire:40} };
function enemyResist(e, el){
  if(!el || !e) return 0;
  let r = (e.dmgType===el) ? ENEMY_BASE_RESIST : 0;
  const t = ENEMY_RESIST_TYPES[e.type]; if(t && t[el]!=null) r = Math.max(r, t[el]);
  if(e.mastodon && el==='cold') r = Math.max(r, ENEMY_BASE_RESIST);
  if(el==='poison' && typeof game!=='undefined' && game && (game.scene==='blackmarsh' || (game.scene==='lighthouse' && game.room && game.room.subzone==='pool'))) r = Math.max(r, ENEMY_BASE_RESIST);
  if(el==='lightning' && e.stormShredUntil && typeof game!=='undefined' && game && (game.clock||0) < e.stormShredUntil) r -= (e.stormShred||0)*100;   // v489: Storm crits
  return r/100;
}
// resistance left after the player's penetration; penetration can't push it below 0, but a shred (negative) still counts
function resAfterPen(e, el, p){ const r = enemyResist(e, el); return r > 0 ? Math.max(0, r - elemMasteryPen(p, el)) : r; }
function projElement(pr){
  if(pr.isFireball || pr.spell==='fire') return 'fire';
  if(pr.isIceBolt || pr.spell==='ice') return 'cold';
  if(pr.isLightningArc || pr.spell==='lightning') return 'lightning';
  if(pr.isPoisonKnife) return 'poison';
  return null;
}
// ---------- Charged (lightning ailment, v298) ----------
// Every lightning hit a creature takes adds 1 charge. At 3 charges its NEXT lightning hit does +15% damage and arcs 60% of that
// damage to everything of its own side nearby (enemies for enemies; you + followers for you). Charges fade after 6s without a lightning hit.
const CHARGE_MAX = 3, CHARGE_BONUS = 0.15, CHARGE_SPREAD = 0.6, CHARGE_R = 150, CHARGE_DECAY = 6;
function lightningCharge(g, tgt, dmg, team){
  if(!tgt || !g) return dmg;
  if((tgt.charges||0) < CHARGE_MAX){ tgt.charges = (tgt.charges||0)+1; tgt.chgT = CHARGE_DECAY; return dmg; }
  tgt.charges = 0; tgt.chgT = 0;
  const out = dmg*(1+CHARGE_BONUS);
  const list = team==='enemy' ? g.enemies : [g.player].concat(g.followers||[]);
  g.particles.push({type:'ring', x:tgt.x, y:tgt.y, t:0.35, max:0.35, r:CHARGE_R, color:'#9fe8ff'});
  for(const o of list){
    if(!o || o===tgt || !(o.hp>0) || dist(tgt,o) > CHARGE_R+(o.r||0)) continue;
    const d = out*CHARGE_SPREAD*(team==='enemy' ? (1-enemyResist(o,'lightning')) : 1);
    o.hp -= d; o.hitT = 0.15;
    g.particles.push({type:'burst', x:o.x, y:o.y, t:0.25, max:0.25, color:'#9fe8ff'});
    if(team==='enemy') spawnDmgNumber(g, o, d, false, {col:'#9fe8ff'});
  }
  return out;
}
function chargeTick(e, dt){ if(e.charges>0){ e.chgT = (e.chgT||0) - dt; if(e.chgT<=0){ e.charges = 0; e.chgT = 0; } } }
function drawChargeFx(ent, iso){
  const n = ent.charges|0; if(n<=0) return;
  const ck = (game&&game.clock)||0, sc = Math.max(0.8, Math.min(2.2,(ent.r||16)/16)), full = n>=CHARGE_MAX;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for(let i=0;i<n;i++){
    const an = ck*(full?4.5:2.6) + i*(6.283/3), rx = 13*sc, ry = 6*sc, cx = iso.x+Math.cos(an)*rx, cy = iso.y-16*sc+Math.sin(an)*ry*0.8-6*sc;
    const j = Math.sin(ck*40+i*3)*2;
    ctx.globalAlpha = full ? 0.95 : 0.8; ctx.strokeStyle = full ? '#ffffff' : '#bfefff'; ctx.lineWidth = full ? 1.6 : 1.2;
    ctx.beginPath(); ctx.moveTo(cx-3*sc, cy-3*sc); ctx.lineTo(cx+1.5*sc+j*0.3, cy-0.5*sc); ctx.lineTo(cx-1*sc, cy+0.5*sc); ctx.lineTo(cx+3*sc, cy+4*sc); ctx.stroke();
  }
  if(full){ ctx.globalAlpha = 0.35+0.25*Math.sin(ck*30); ctx.strokeStyle = '#8fd8ff'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(iso.x, iso.y-2, 16*sc, 7*sc, 0, 0, 7); ctx.stroke(); }
  ctx.restore();
}
// v437: gear elemental damage (+Fire/Cold/Lightning/Poison Damage) rides on every player hit as a flat typed bonus: it ignores armor, is cut by the
// target's resist to that element, and each 20 points of an element gives a 5% chance per hit to inflict that element's ailment.
// v457 damage model: a weapon roll is the base of every attack and spell; skills multiply it
// ===== v458 skill damage table =====
// Every damaging skill deals a percentage of your WEAPON damage roll (r: [Rank 1 %, Rank 10 %], linear, and it keeps
// climbing past Rank 10 at the same step). No skill adds flat damage. t = damage type (decides which +% mods apply),
// c = weapon skill (flat sword/bow elemental damage joins it) or spell (never).  split = part of the hit dealt as a 2nd type.
// x = a secondary part (blast, burst...) with its own % of weapon damage.
// v477: every skill that replaces Strike hits at least ~10% harder than Strike at Rank 1 (none of your attacks gets weaker by learning one)
const SKILL_WD = {
  // --- Warrior ---
  fury:         {t:'physical', c:'weapon', r:[68,98],   per:'per strike (3 strikes)'},
  assault:      {t:'physical', c:'weapon', r:[78,112],  per:'per 20 Rage spent (Rage Burst)'},
  shieldBash:   {t:'physical', c:'weapon', r:[105,147], per:'per hit'},
  seismicSlam:  {t:'physical', c:'weapon', r:[140,220], per:'per enemy around you'},
  guardian:     {t:'physical', c:'weapon', r:[230,440], per:'per trample hit', x:{n:'final burst', t:'physical', r:[145,145]}},
  cleave:       {t:'physical', c:'weapon', r:[310,540], per:'per swing'},
  shieldThrow:  {t:'physical', c:'weapon', r:[180,265], per:'per hit'},
  leap:         {t:'physical', c:'weapon', r:[120,175], per:'on landing'},   // v489: was 80-115%
  whirlwind:    {t:'physical', c:'weapon', r:[124,215], per:'per spin tick'},
  riposte:      {t:'physical', c:'weapon', r:[50,75],   per:'per counter-strike'},
  reave:        {t:'physical', c:'weapon', r:[106,128], per:'per hit (plus Bleed)'},
  vengeance:    {t:'physical', c:'weapon', r:[106,152],  per:'per hit', split:{t:'fire', f:0.5}},
  smite:        {t:'physical', c:'weapon', r:[105,150],  per:'per bolt (Wrath x1.9)', split:{t:'fire', f:0.5}},
  judgment:     {t:'physical', c:'weapon', r:[240,355], per:'per pillar', split:{t:'fire', f:0.5}},
  consecrate:   {t:'physical', c:'weapon', r:[46,67],   per:'per tick', split:{t:'fire', f:0.5}},
  // --- Ranger ---
  trap:         {t:'physical', c:'weapon', r:[43,62],   per:'when sprung'},
  poisonKnives: {t:'poison',   c:'weapon', r:[70,102],  per:'per knife (plus Poison)'},
  rapidShot:    {t:'physical', c:'weapon', r:[60,85],   per:'per arrow (3 arrows)'},   // v489: free basic shot now
  splinterShot: {t:'physical', c:'weapon', r:[90,130],  per:'per arrow (splinters 70%)'},   // v489: free basic shot now
  cripplingShot:{t:'physical', c:'weapon', r:[180,260], per:'per arrow (plus Bleed)'},   // v489: big boost, costs more + cooldown
  explosiveShot:{t:'physical', c:'weapon', r:[150,215], per:'arrow hit', x:{n:'blast', t:'fire', r:[95,140]}},
  stunShot:     {t:'physical', c:'weapon', r:[200,290], per:'per arrow'},
  aimedShot:    {t:'physical', c:'weapon', r:[340,600], per:'held shot (a quick tap: 145%)', tap:145},
  rainOfArrows: {t:'physical', c:'weapon', r:[260,380], per:'per volley (3 volleys)'},
  poisonTrap:   {t:'poison',   c:'weapon', r:[41,59],   per:'per second in the cloud, rising up to +150% the longer a foe stays in it'},
  frostTrap:    {t:'cold',     c:'weapon', r:[41,59],   per:'burst'},
  explosiveTrap:{t:'fire',     c:'weapon', r:[490,710], per:'explosion (plus Burn)'},
  // --- Mystic ---
  lightningArc: {t:'lightning',c:'spell',  r:[105,152],  per:'per hit'},
  fireball:     {t:'fire',     c:'spell',  r:[72,104],   per:'per ball'},
  iceBolt:      {t:'cold',     c:'spell',  r:[370,535], per:'per bolt'},
  nova:         {t:'lightning',c:'spell',  r:[145,210], per:'per enemy'},   // v489: slightly stronger, cheaper
  thunderstep:  {t:'lightning',c:'spell',  r:[50,72],   per:'per charge'},
  tornado:      {t:'physical', c:'spell',  r:[97,140],  per:'per hit'},
  hurricane:    {t:'physical', c:'spell',  r:[93,135],  per:'per tick'},
  pyroTorrent:  {t:'fire',     c:'spell',  r:[28,42],   per:'per tick (ramps to x2)'},
  blizzard:     {t:'cold',     c:'spell',  r:[54,79],   per:'per tick'},
  stormcall:    {t:'lightning',c:'spell',  r:[270,400], per:'strike (Charged targets chain it on at 50%)'},
  meteor:       {t:'fire',     c:'spell',  r:[620,900], per:'impact (less at the edge)', x:{n:'burning ground, per second', t:'fire', r:[60,88]}},
  flameVortex:  {t:'fire',     c:'spell',  r:[31,46],   per:'per tick', x:{n:'final blast', t:'fire', r:[250,365]}},
  plague:       {t:'poison',   c:'spell',  r:[47,68],   per:'per second, rising up to +150% the longer a foe stays in it'},
  soulSap:      {t:'poison',   c:'spell',  r:[105,153], per:'per hit (extra targets 50%)'},   // v489: poison
  deathBolt:    {t:'physical', c:'spell',  r:[92,134],  per:'per bolt (x1.5 below half life)'},
  soulFire:     {t:'physical', c:'spell',  r:[230,330], per:'explosion, half physical / half poison', split:{t:'poison', f:0.5}},   // v489
  // v489: sacrifice is life-based now (sacrificeLifePct), not weapon damage
};
function swdPct(arr, rank){ const r = Math.max(1, rank||1); return arr[0] + (arr[1]-arr[0])/9*(r-1); }
function swd(id, rank){ const d = SKILL_WD[id]; return d ? swdPct(d.r, rank)/100 : 1; }
function swdX(id, rank){ const d = SKILL_WD[id]; return (d && d.x) ? swdPct(d.x.r, rank)/100 : 0; }
// one hit split between two damage types (the flat weapon element joins only the first part)
// v470: armor only applies to the physical share (a 50/50 hit meets half the armor), and the hit shows ONE number, not two
function splitHit(p, e, dmg, frac, el2, pen){
  const wasN = p._splitNum; p._splitNum = {sum:0, crit:false};
  p._armorScale = 1-frac;
  let a = 0, b = 0;
  try{ a = applyEnemyArmor(p, e, dmg*(1-frac), pen||0); } finally { p._armorScale = 0; }
  const was = p._elemBusy; p._elemBusy = true;
  try{ b = applyEnemyArmor(p, e, dmg*frac, 0, el2); } finally { p._elemBusy = was; }
  const acc = p._splitNum; p._splitNum = wasN;
  if(acc.sum>0 || !(a+b>0)) spawnDmgNumber(game, e, acc.sum, acc.crit);
  return a + b;
}
function dotPctMult(el){ const p = game && game.player; return p ? typedPctMult(p, el) : 1; }
function dmgK(a, b, c){ return (a + 30*b + 45*(c||0))/123; }   // each skill keeps its old strength relative to a basic hit
function wpnDmg(p, avg){
  let lo = p.wpnMin, hi = p.wpnMax;
  if(!(hi>0)){ const L = p.level||1; lo = 4 + 1.0*L; hi = 8 + 1.6*L; }
  return (avg ? (lo+hi)/2 : lo + Math.random()*(hi-lo)) + (p.wpnFlat||0);
}
// matching % bonuses, added together then applied once: physical hits get Physical %, an element gets its own % plus Elemental %
function typedPctMult(p, el){
  if(!el) return 1 + (p.physDmgPct||0)/100;
  return 1 + ((p[el+'DmgPct']||0) + (p.elemDmgPct||0))/100 + elemMasteryDmg(p, el);
}
// v475 Elemental Mastery (Elementalist, Lv.21): fire and cold hit harder and pierce enemy fire/cold resistance
function elemMasteryRank(p){ return (p && p.cls==='mystic' && p.skills && effectiveRank(p,'elementalMastery')) || 0; }
function elemMasteryDmgAt(r){ return r>0 ? 0.10 + 0.03*(Math.min(10,r)-1) + 0.015*Math.max(0,r-10) : 0; }
function elemMasteryPenAt(r){ return r>0 ? 0.05 + 0.01*(Math.min(10,r)-1) + 0.005*Math.max(0,r-10) : 0; }
function elemMasteryDmg(p, el){ return (el==='fire' || el==='cold') ? elemMasteryDmgAt(elemMasteryRank(p)) : 0; }
const EM_BLAST_RANK = 5, EM_BLAST_R = 75;
function emBlastPct(r){ return r>=EM_BLAST_RANK ? 0.40 + 0.03*(Math.min(10,r)-EM_BLAST_RANK) + 0.015*Math.max(0,r-10) : 0; }
function elemMasteryPen(p, el){ return (el==='fire' || el==='cold') ? elemMasteryPenAt(elemMasteryRank(p)) : 0; }
// flat elemental damage from a sword or bow joins weapon attacks and weapon skills -- never pure spells
function flatElemActive(p){
  const mh = p.equipment && p.equipment.mainhand;
  return !!(mh && FLAT_ELEM_WEAPON[mh.slotType]) && p.cls!=='mystic' && !p._spellHit;
}
function gearElemHit(p, e, mainEl){
  let sum = 0;
  if(!flatElemActive(p)) return 0;
  for(const el of ['fire','cold','lightning','poison']){
    const v = p[el+'Dmg'] || 0; if(v<=0) continue;
    let d = Math.max(1, v*typedPctMult(p, el)*dmgVar()*(1-enemyResist(e, el)));
    if(el==='lightning' && mainEl!=='lightning') d = lightningCharge(game, e, d, 'enemy');
    sum += d;
    if(Math.random() < Math.min(0.75, 0.05*Math.floor(v/20))){
      if(el==='fire'){ e.burnT = Math.max(e.burnT||0, FIRE_DOT_DUR); e.burnDps = Math.max(e.burnDps||0, v*BURN_DPS_PCT*2); }
      else if(el==='cold'){ coldHit(e, 1); }
      else if(el==='lightning'){ if((e.charges||0) < CHARGE_MAX) e.charges = (e.charges||0)+1; e.chgT = CHARGE_DECAY; }   // v454: Charged replaces the old shock DoT
      else { e.poisonT = Math.max(e.poisonT||0, POISON_DOT_DUR); e.poisonDps = Math.max(e.poisonDps||0, v*POISON_DOT_PCT); }
      if(game && game.particles) game.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:({fire:'#ff9a4a',cold:'#9fe0ff',lightning:'#f2ee6a',poison:'#8fe05a'})[el]});
    }
  }
  return sum;
}
function applyEnemyArmor(p, e, dmg, extraPen, el){
  if(e.invulnT>0){ spawnDmgNumber(game, e, 0, false); return 0; }
  if(el==='fire') e.coldHits = 0;   // a fire hit breaks a cold streak
  dmg *= dmgVar();
  dmg *= typedPctMult(p, el);   // v457: +% Physical / +% <Element> / +% Elemental
  if(el==='cold' && e.permaT>0) dmg *= 1 + (e.permaAmp||0);   // v489: Permafrost cold vulnerability
  if(e.shieldUp>0) dmg *= 0.3;   // v420: Highward shield wall
  if(e.hw || e.wardUntil) dmg *= hwGuardMult(p, e, dmg);   // v461 Bulwark: frontal block + ward
  if(e.exposedT>0) dmg *= 1.25;
  if(e.elite && p.dmgVsElitePct>0) dmg *= 1 + p.dmgVsElitePct;
  if(e.bleedT>0 && p.partB && p.partB.sp && p.partB.sp.bleedbonus) dmg *= 1.25;   // v361 Predator's Stone
  if(p.cls==='ranger' && enemyAiling(e)){ const pir = (p.skills && effectiveRank(p,'predatorsInstinct'))||0; if(pir>0) dmg *= 1 + predInstinctPct(pir); }   // v454 Predator's Instinct
  if(e.colossus) dmg *= e.colWeak>0 ? 1.4 : (e.cPhase===3 ? 1.0 : e.cPhase===2 ? 0.55 : 0.8);   // v263: shell soaks damage unless a weak point is exposed
  if(e.fearVulnT>0) dmg *= 1 + (e.fearVulnPct||0)/100;
  if(e.markT>0) dmg *= huntMarkMult(p, e);
  if(e.warCryT>0) dmg *= 1 + (e.warCryPct||WARCRY_VULN);
  if(p.cls==='warrior'){ dmg *= WARRIOR_DMG_MULT; if(commanderBargain(p)) dmg *= TEMPLAR_PLAYER_DMG; if(p._inWar) dmg *= 1 + bannerWarDmg(p); dmg *= 1 + rampageBonus(p); }
  if(p.cls==='warrior' && !(p.rageGainCd>0)){ p.rageGainCd = RAGE_HIT_INTERVAL; gainResource(p, RAGE_ON_HIT); }
  const armor = el ? 0 : (e.armor||0);
  let final = dmg;
  if(el){ final = Math.max(1, dmg*(1-resAfterPen(e, el, p))); if(el==='lightning'){ final = lightningCharge(game, e, final, 'enemy'); staticOnLightningHit(p); } }
  else if(armor>0){
    const mh = p.equipment && p.equipment.mainhand;
    const rank = (p.skills && effectiveRank(p,'weaponsSpecialist')) || 0;
    let pen = extraPen||0;
    if(mh && mh.twoHanded && rank>0) pen += GREATSWORD_ARMORPEN_PER_RANK*rank;
    // v83 Crushing (2H sword prefix, +Armor Penetration %) -- stacks
    // additively with Greatsword's own innate pen, same clamp-to-100%.
    pen += (p.itemArmorPenPct||0);
    pen = Math.min(1, pen);
    final = Math.max(1, dmg - armor*(1-pen)*(p._armorScale>0 ? p._armorScale : 1));
  }
  if(!el && e.physRes) final = Math.max(1, final*(1-e.physRes));   // v427: ethereal ghouls shrug off half of all physical damage
  if(!p._elemBusy && final>0) final += gearElemHit(p, e, el);
  if(e.shieldHp>0){ const ab = Math.min(e.shieldHp, final); e.shieldHp -= ab; final -= ab; if(e.shieldHp<=0 && game) game.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:'#9fdcff'}); }
  // v63: every player hit that lands through this shared chokepoint marks
  // the target as "currently being attacked by the player" for monster
  // targeting purposes -- see markAttacked/pickEnemyTarget.
  markAttacked(e, p);
  if(p.cls==='mystic' && game){
    const clk = game.clock||0;
    if(lastHitCrit){ const sr = (p.skills && effectiveRank(p,'storm'))||0; if(sr>0){ e.stormShred = stormShredPct(sr); e.stormShredUntil = clk + STORM_SHRED_DUR; } }   // v489 Storm: crits lower lightning resistance
    if(el==='lightning' && p.staticStunUntil > clk && !isHeavyEnemy(e) && !e.isBoss && !e.isLairBoss){ e.stunT = Math.max(e.stunT||0, STATIC_STUN_DUR); }   // v489: a released Static Buildup stuns what it hits
  }
  if(lastHitCrit && p.cls==='ranger' && !(p.deadeyeGainCd>0)){ const dr=(p.skills && effectiveRank(p,'deadeye'))||0; if(dr>0){ gainResource(p, p.maxMp*DEADEYE_STAMINA_PER_RANK*dr); p.deadeyeGainCd = 0.12; } }
  // Combat feel (v104): floating damage number at the shared chokepoint
  // every direct player hit already passes through (DoT ticks don't).
  if(p._splitNum){ p._splitNum.sum += final; p._splitNum.crit = p._splitNum.crit || lastHitCrit; } else spawnDmgNumber(game, e, final, lastHitCrit);
  // v83 Vampire (+Life Leech %): heals the player for a fraction of every
  // point of damage they deal, through this SAME shared chokepoint every
  // player-dealt hit already routes through (Strike, active skills, DoT
  // ticks) -- same technique Assault's leech just below already uses.
  {
    const lp = Math.min(LEECH_TOTAL_CAP, (p.lifeLeechPct||0) + bloodlustLeechPct(p) + (p.assaultT>0 ? ASSAULT_LEECH_PCT*100 : 0));
    leechHeal(p, final*leechTargetMult(e), lp);
  }
  { const sp = p.partB && p.partB.sp;   // v361 cauldron stone procs
    if(sp){
      if(sp.healhit && p.hp>0 && Math.random()<0.08){ p.hp = Math.min(p.maxHp, p.hp + p.maxHp*0.04); game.particles.push({type:'burst', x:p.x, y:p.y, t:0.3, max:0.3, color:'#ff6a9a'}); }
      if(sp.poisonhit){ e.poisonT = Math.max(e.poisonT||0, POISON_DOT_DUR); e.poisonDps = Math.max(e.poisonDps||0, final*POISON_DOT_PCT*0.6); }
      if(sp.chain && !p._chainBusy && Math.random()<0.10){
        p._chainBusy = true;
        let from = e, hit = 0; const done = [e];
        for(let c=0;c<3;c++){
          let best = null, bd = 260;
          for(const o of game.enemies){ if(!o || o.hp<=0 || done.includes(o) || o.invulnT>0) continue; const dd = Math.hypot(o.x-from.x, o.y-from.y); if(dd<bd){ bd = dd; best = o; } }
          if(!best) break;
          done.push(best); const cd = Math.max(1, final*0.6*(1-enemyResist(best,'lightning')));
          best.hp -= cd; spawnDmgNumber(game, best, cd, false); markAttacked(best, p);
          game.particles.push({type:'burst', x:best.x, y:best.y, t:0.25, max:0.25, color:'#bfe8ff'});
          from = best; hit++;
        }
        p._chainBusy = false;
      }
    }
  }
  // v83 Bloodletting (+Bleed Chance %): reuses the EXISTING generic
  // e.bleedT/e.bleedDps DoT mechanism verbatim (same fields Offensive
  // Stance/Poison Knives/Crippling Shot/fire bolts already write into --
  // see BLEED_DPS_PCT/BLEED_DUR), rather than inventing a second bleed
  // system.
  if(p.bleedChancePct>0 && Math.random()*100 < p.bleedChancePct){
    e.bleedDps = Math.max(e.bleedDps||0, final*BLEED_DPS_PCT*partBleedMult());
    e.bleedT = Math.max(e.bleedT||0, BLEED_DUR);
  }
  // Assault (Berserker capstone): while its rage buff is active, leech a slice
  // of every point of damage the player deals back as health.
  // (Assault's leech is folded into the shared leech budget above, v190.)
  // Vanish (Survivalist capstone, v79): "dealing damage ends the effect".
  // applyEnemyArmor is the one shared chokepoint every player-dealt hit
  // already routes through (see the v63 markAttacked comment just above),
  // so this is the single correct place to detect "the player dealt
  // damage" for Vanish's own early-cancel -- covers every damage source
  // (Strike, every active skill, DoT ticks, follower-adjacent skills that
  // still route through here) with no per-skill wiring needed.
  if(p.vanishT>0) p.vanishT = 0;
  // Reflective Armordon (v153): plates bounce a share of the hit back at the attacker (cooldown + cap so
  // rapid ticks and big hits are not punishing).
  if(e.reflect && !(e.reflectCd>0) && final>1 && p.hp>0 && !game.over){
    e.reflectCd = ARMORDON_REFLECT_CD; e.reflectFlashT = 0.25;
    const rd = Math.min(final*ARMORDON_REFLECT_PCT, p.maxHp*ARMORDON_REFLECT_CAP_PCT);
    playerDamage(game, rd, e);
    game.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:'#ffe9a0'});
  }
  return final;
}
// Legacy helper retained for compatibility: returns the first tree (of the
// player's class) that has any rank spent in it at all. It is no longer
// used to gate rank-ups (trees now share one open pool of skill points --
// see committedCapstone below for the one piece of cross-tree exclusivity
// that still applies: only one capstone/mastery skill per class).
function committedTreeKey(p){
  const TREES = treesForClass(p.cls);
  for(const treeKey of Object.keys(TREES)){
    const tree = TREES[treeKey];
    if(tree.nodes.length===0) continue;
    for(const node of tree.nodes){
      if((p.skills[node.id]||0) > 0) return treeKey;
    }
  }
  return null;
}
// Every tree (across all 6, Warrior/Ranger/Mystic combined) can end in one
// capstone/mastery node (flagged node.capstone===true -- v64: ALL 6 trees'
// capstones now carry this flag, not just Warrior's, so this is a single
// GLOBAL capstone slot per character, not a per-class one). Once a
// character has ranked ANY capstone, the capstone node in every OTHER
// tree locks, even if its own individual prerequisites would otherwise be
// satisfied -- until a respec clears all skill ranks back to 0. In
// practice treesForClass(p.cls) only ever returns that one character's own
// class's 3 trees (a character is locked to one class for its whole
// build), so scanning "every tree of this class" and scanning "every tree
// globally" are the same set of nodes for any given character -- this is
// the single unified slot the whole game shares, just naturally scoped by
// the fact nobody can multiclass.
// (v128) Nodes sharing a capstoneShare tag (Elementalist's Pyro Torrent + Blizzard, equally ranked)
// don't block each other; any other capstone still does.
function capstoneBlocks(p, node){
  if(!node.capstone) return false;
  const c = committedCapstone(p);
  if(!c || c===node.id) return false;
  let cn = null;
  const TREES = treesForClass(p.cls);
  for(const k of Object.keys(TREES)) for(const n of TREES[k].nodes) if(n.id===c) cn = n;
  return !(node.capstoneShare && cn && cn.capstoneShare===node.capstoneShare);
}
function committedCapstone(p){
  const TREES = treesForClass(p.cls);
  for(const treeKey of Object.keys(TREES)){
    for(const node of TREES[treeKey].nodes){
      if(node.capstone && (p.skills[node.id]||0) > 0) return node.id;
    }
  }
  return null;
}

