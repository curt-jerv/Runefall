// ---------- Djinn tree (Mystic's 1st tree, v75) ---------------------------
// Lightning Arc (passive): once ranked, permanently overrides the DEFAULT
// Main/Strike attack (staff bolt) with a lightning bolt -- see the
// staffItem attack branch in updatePlaying() for the actual override, and
// the comment there for exactly how this differs from the v74 Main-slot
// reassignment system (this is unconditional once ranked, not something
// the player Assigns -- matching the brief: "the effect just happens").
const LIGHTNING_ARC_STUN_DUR = LIGHTNING_STUN_DUR; // reuses the existing 0.2s stun every 'lightning' staff-spell hit already applies
// Lightning Chain (passive, requires Lightning Arc): each rank lets the
// Lightning Arc bolt jump to one more nearby, not-yet-hit enemy (up to 5
// at Rank 5). No existing multi-target/bounce mechanic exists anywhere in
// the game to reuse, so this is a new, simple nearest-unhit-enemy-in-range
// chain (see the isLightningArc branch in the projectile-hit loop).
// Judgment call: each chain jump deals 75% of the PREVIOUS hit's damage
// (compounding down the chain) rather than full damage every hop, so a
// maxed 5-chain bolt can't melt an entire pack at full damage per target --
// the brief doesn't specify a falloff, so this is a deliberate balance
// choice, not a mechanic pulled from elsewhere in the codebase.
const LIGHTNING_CHAIN_RANGE = 240, LIGHTNING_CHAIN_DMG_MULT = 0.75;
function lightningArcChains(rank){ return rank>0 ? Math.max(1,Math.round(rkSpread5(rank))) : 0; }
// Nova (active): an instant AoE ring centered on the player, same
// "instant burst self-AoE, own button/cooldown" shape as Battlecry. Applies
// a new "Shock" status -- a periodic-damage DoT, same pattern as Bleed/
// Poison (e.bleedT/e.bleedDps, e.poisonT/e.poisonDps) but its own distinct
// e.shockT/e.shockDps fields so it can stack alongside either. Judgment
// call: per the brief ("each rank adds shock duration"), ONLY Shock's
// duration scales with rank -- Nova's own direct hit damage is flat,
// called out explicitly in its effect text (same "fixed, doesn't scale"
// convention Field Dress's cooldown text already established).
const NOVA_CD = 9, NOVA_RADIUS = 98;   // v311: 30% smaller
const NOVA_SHOCK_DUR_BASE = 1.5, NOVA_SHOCK_DUR_STEP = 0.5; // 1.5s at Rank1 -> 3.5s at Rank5
const NOVA_SHOCK_DPS_PCT = 0.12; // Shock ticks for 12% of Nova's own direct hit damage, per second
function novaShockDuration(rank){ return rank>0 ? NOVA_SHOCK_DUR_BASE + NOVA_SHOCK_DUR_STEP*(rank-1) : NOVA_SHOCK_DUR_BASE; }
// Tornado (active): a targeted projectile at the nearest enemy. Reworked
// (v103) from a one-shot arrow-shaped bolt into an actual slow-moving
// circular/swirling tornado that pierces through every enemy in its path
// instead of dying on the first hit, dealing tick damage at a fixed
// interval to everything it's currently overlapping the whole time it
// travels -- same "duration + repeating tick" shape Hurricane already
// uses (see HURRICANE_TICK_INTERVAL), just centered on the moving
// projectile instead of on the player. TORNADO_SPEED is 20% of its old
// value (300 -> 60, an 80% reduction) so it reads as a slow, deliberate
// funnel rather than a normal bolt; TORNADO_LIFE is raised from the old
// flat 1.6s projectile life so the tornado still travels a comparable
// distance overall despite moving far slower.
// (v121) 3s cooldown at rank 1, dropping evenly to 1s at rank 5.
function tornadoCdForRank(rank){ return Math.max(TORNADO_CD_MIN, TORNADO_CD - (TORNADO_CD-TORNADO_CD_MIN)*(Math.min(5,Math.max(1,rank))-1)/4); }
const TORNADO_CD = 3, TORNADO_CD_MIN = 1, TORNADO_R = 22, TORNADO_BASE_DMG = 18, TORNADO_SPEED = 300*0.2, TORNADO_TICK_INTERVAL = 0.6, TORNADO_LIFE = 6;
const TORNADO_HITS_PER_ENEMY = 3, TORNADO_HIT_GAP = 1/3;   // v489: no cap -- each enemy inside is hit 3 times per second
// Storm (active): a zone that follows the player for a few seconds. Per
// the brief, its ONLY mechanical effect is +20% Crit Chance for the
// player against any enemy currently inside it -- no separate damage or
// stat drain is added (the brief doesn't specify one beyond "a debuff",
// and the crit-vulnerability IS that debuff, kept deliberately simple).
// Fixed 2-minute cooldown at every rank -- same "rank affects an
// attribute, never the cooldown" pattern Field Dress already established
// (FIELD_DRESS_CD stays fixed while its regen rate scales with rank).
const STORM_CD = 120, STORM_RADIUS = 130, STORM_CRIT_BONUS = 20;
const STORM_DUR_BASE = 3, STORM_DUR_STEP = 0.75; // 3s at Rank1 -> 6s at Rank5
function stormDuration(rank){ return rank>0 ? STORM_DUR_BASE + STORM_DUR_STEP*(rank-1) : STORM_DUR_BASE; }
// True while the player's Storm zone is up AND the given target is
// currently standing inside it -- the single hook point every attack that
// wants Storm's crit bonus checks (see the isCrit rolls in updatePlaying()).
function stormCritBonus(p, target){ return 0; }   // (v152) Storm is a passive now -- its bonus lives in recalcStats
function critMultOf(p){ return 1.8 + (p.critMultBonus||0) + (p.skills ? deadeyeCritMult(p) : 0); }
const STORM_CRIT_PER_RANK = 3, STORM_CRITMULT_PER_RANK = 0;   // v489: +3% crit per rank (was 2%), no crit multiplier
const STORM_SHRED_DUR = 4;
function stormShredPct(r){ r = Math.max(1, r||1); return Math.min(0.30, 0.10 + 0.15*(Math.min(10,r)-1)/9 + 0.005*Math.max(0, r-10)); }   // -10% lightning resistance -> -25% at rank 10
// Hurricane (Djinn capstone): a persistent tick-damage AoE around the
// player for its duration, same "active duration + repeating tick" shape
// Whirlwind already uses. Slow is implemented by reusing the existing Ice
// Shot chill mechanism verbatim (e.chillT, and the chillMult that already
// multiplies every enemy movement line in the enemy-update loop) rather
// than inventing a second, parallel slow field -- functionally identical
// "half movement speed for a few seconds", just relabeled as Hurricane's
// own wind instead of ice. Each rank adds both damage (skillMult) and
// duration (up to 8s at Rank 5, per the brief).
const HURRICANE_CD = 8, HURRICANE_CD_STEP = 2/9, HURRICANE_RADIUS = 110, HURRICANE_TICK_INTERVAL = 0.3;
const HURRICANE_DUR_BASE = 4, HURRICANE_DUR_STEP = 1; // 4s at Rank1 -> 8s at Rank5
function hurricaneDuration(rank){ return rank>0 ? HURRICANE_DUR_BASE + HURRICANE_DUR_STEP*(rank-1) : HURRICANE_DUR_BASE; }
function hurricaneDefPct(r){ r = Math.max(1, r||1); return 0.10 + 0.20*(Math.min(10,r)-1)/9 + 0.01*Math.max(0, r-10); }   // v489: +10% defence -> +30% at rank 10 while it rages
function hurricaneCooldown(rank){ return HURRICANE_CD - HURRICANE_CD_STEP*(Math.max(1,rank||1)-1); }
// ---------- Elementalist tree (Mystic's 2nd tree, v76) ---------------------
// New status-effect fields introduced this batch, both generically reusable
// by any future skill (documented explicitly since a later Ranger batch's
// Frost Trap is expected to want the freeze mechanic):
//   e.burnT / e.burnDps -- an ignite/burn DoT, its own field distinct from
//     BOTH Bleed (e.bleedT/e.bleedDps) and Shock (e.shockT/e.shockDps) so
//     all three can stack/coexist independently, same reasoning Nova's
//     Shock already established for its own distinct field. NOTE: the
//     pre-existing Mystic staff's inherent 'fire' spell (see FIRE_DOT_DUR/
//     FIRE_DOT_PCT near STAFF_SPELL_INFO) already applies a burn effect by
//     reusing e.bleedT/e.bleedDps -- a historical shortcut from before Shock
//     established the "give each new DoT its own field" convention. That
//     existing behavior is left exactly as-is (out of scope here); this
//     tree's OWN burn (Fireball's direct hit, Elemental Explosions' splash
//     ailment, Pyro Torrent's channel tick) always uses the new, separate
//     e.burnT/burnDps pair instead, per the now-established convention.
//   e.frozenT -- a brand-new, GENERIC "frozen" status: while >0, an enemy
//     is fully immobilized and cannot attack, exactly like e.stunT already
//     behaves (see the merged stunT/frozenT check in the enemy-update loop
//     below) but kept as its own distinct field/name so a freeze and a stun
//     can be told apart (and independently tracked/extended) rather than
//     silently colliding on the same field. Blizzard (this tree's capstone)
//     is the only thing that sets it this batch; a later batch (Ranger's
//     Survivalist rework, Frost Trap) is expected to reuse this exact same
//     field/mechanism for its own "freezes enemies" effect.
const BURN_DPS_PCT = 0.15; // burnDps is set as this fraction of the hit damage that applied it, same shape as FIRE_DOT_PCT/POISON_DOT_PCT
// Node 1 -- Elemental Polarity: grants Fireball & Ice Bolt (2 virtual active
// skills, no tree node of their own -- see the node's own comment and
// VIRTUAL_SKILL_NAMES/ACTIVE_SKILL_REGISTRY above). Both skills' damage
// scales off Elemental Polarity's OWN rank via the standard skillMult
// curve, per the brief ("Each rank adds damage to both skills"); neither
// has an independent rank of its own. Fireball's direct hit always applies
// Burn (judgment call: matches the existing 'fire' spell's always-burns
// behavior, just on the new dedicated e.burnT/burnDps field -- see this
// section's top comment for why a separate field). Ice Bolt's direct hit
// always applies Chill, reusing e.chillT/ICE_CHILL_DUR verbatim (explicit
// brief suggestion -- "Ice Bolt... should probably chill").
const FIREBALL_BASE_DMG = 15, FIREBALL_CD = 1.2;
const ICE_BOLT_BASE_DMG = 13, ICE_BOLT_CD = 1.2;
const ELEMENTAL_BOLT_SPEED = STAFF_BOLT_SPEED;
// Staff of Fire/Ice/Lightning: +1 (rare +2) rank to Fireball / Ice Bolt / Lightning Arc.
// Skill allocated -> extra ranks on top. Skill NOT allocated -> Strike fires that skill at the staff's rank.
const STAFF_SKILL_SPELL = {fireball:'fire', iceBolt:'ice', lightningArc:'lightning', soulSap:'soul'};
function staffBonusFor(p, skillId){
  const mh = p.equipment && p.equipment.mainhand;
  if(!mh || mh.slotType!=='staff' || STAFF_SKILL_SPELL[skillId]!==(mh.spell||'fire')) return 0;
  const af = (mh.affixes||[]).find(a=>a.key==='spellPower');
  return af ? (af.value||1) : 0;
}
// v269: Fireball / Ice Bolt are real nodes now -- damage scales with the skill's own rank (skillId).
function elementalPolarityDmg(p, base, extraRank, skillId){
  const epRank = ((skillId && p.skills && effectiveRank(p,skillId)) || 0) + (extraRank||0);
  return wpnDmg(p) * swd(skillId||'fireball', epRank) * assaultDealtMult(p) * weaponDmgMult(p);
}
// ---- v269 Elementalist / Djinn rework ----
const FIREBALL_ATKCD_MULT = 0.7, FIREBALL_BALL_MULT = 0.7, FIREBALL_VOLLEY_GAP = 0.19, FIREBALL_VOLLEY_PAUSE = 0.45, FIREBALL_SPEED_MULT = 0.8, FIREBALL_SIDE_OFFSET = 9;
const ICE_BOLT_ATKCD_MULT = 1.686, ICE_BOLT_DMG_MULT = 4.05;   // v442: 1.15s base cast (was 1.23s), damage ~89% of Fireball's DPS
const PERMAFROST_ICEBOLT_SPEED = 1.25;   // v442: Ice Bolt casts 25% faster while you stand in your Permafrost
const ICE_BOLT_R = 11, ICE_BOLT_SPEED_MULT = 0.8;
// v499 Frozen Orb (Crystalline Prism turns Ice Bolt into it): a slow orb that sprays small ice bolts in a rotating spiral as it travels
// and bursts into a ring of bolts and a cold blast at the end of its range. Damage is expressed in "Ice Bolt hits".
const FROZEN_ORB_SPEED = 150, FROZEN_ORB_RANGE = 540, FROZEN_ORB_CD = 2.4, FROZEN_ORB_BOLT_GAP = 0.09, FROZEN_ORB_SPIRAL = 0.66, FROZEN_ORB_BOLT_SPEED = 300, FROZEN_ORB_BOLT_LIFE = 0.8;
const FROZEN_ORB_BOLT_DMG = 0.3, FROZEN_ORB_TOUCH_DMG = 0.2, FROZEN_ORB_TOUCH_GAP = 0.3, FROZEN_ORB_BLAST_R = 130, FROZEN_ORB_BLAST_DMG = 1.0, FROZEN_ORB_NOVA_BOLTS = 14;
function frozenOrbBolt(g, x, y, ang, dmg){
  g.projectiles.push({x, y, vx:Math.cos(ang)*FROZEN_ORB_BOLT_SPEED, vy:Math.sin(ang)*FROZEN_ORB_BOLT_SPEED, r:5, dmg, from:'player', life:FROZEN_ORB_BOLT_LIFE, color:'#bfe9ff', isArrow:true, isIceBolt:true, isOrbBolt:true});
}
function castFrozenOrb(g, p, ang, dmg){
  g.projectiles.push({x:p.x, y:p.y, vx:Math.cos(ang)*FROZEN_ORB_SPEED, vy:Math.sin(ang)*FROZEN_ORB_SPEED, r:16, dmg:0, from:'player', life:FROZEN_ORB_RANGE/FROZEN_ORB_SPEED,
    color:'#9adfff', isFrozenOrb:true, orbDmg:dmg, orbT:0, orbTouchT:0, orbA:Math.random()*6.283});
  p.frozenOrbCd = applyCdr(p, FROZEN_ORB_CD); p.frozenOrbCdMax = p.frozenOrbCd;
}
function frozenOrbTick(g, p, pr, dt){
  pr.orbT += dt; pr.orbTouchT -= dt;
  while(pr.orbT >= FROZEN_ORB_BOLT_GAP){ pr.orbT -= FROZEN_ORB_BOLT_GAP; pr.orbA += FROZEN_ORB_SPIRAL; frozenOrbBolt(g, pr.x, pr.y, pr.orbA, pr.orbDmg*FROZEN_ORB_BOLT_DMG); }
  if(pr.orbTouchT <= 0){   // the orb itself chills and nips everything it drifts through
    pr.orbTouchT = FROZEN_ORB_TOUCH_GAP;
    for(const e of g.enemies){
      if(!(e.hp>0) || dist(pr,e) >= pr.r+e.r+14) continue;
      e.hp -= applyEnemyArmor(p, e, pr.orbDmg*FROZEN_ORB_TOUCH_DMG, 0, 'cold'); e.hitT = 0.15; e.chillT = Math.max(e.chillT||0, ICE_CHILL_DUR); checkExecute(g, e);
    }
  }
}
function frozenOrbExplode(g, p, pr){
  const R = FROZEN_ORB_BLAST_R*aoeRadiusMult(p);
  for(const e of g.enemies){
    if(!(e.hp>0) || dist(pr,e) >= R+e.r) continue;
    e.hp -= applyEnemyArmor(p, e, pr.orbDmg*FROZEN_ORB_BLAST_DMG, 0, 'cold'); e.hitT = 0.15; e.chillT = Math.max(e.chillT||0, ICE_CHILL_DUR); checkExecute(g, e);
  }
  for(let k=0;k<FROZEN_ORB_NOVA_BOLTS;k++) frozenOrbBolt(g, pr.x, pr.y, pr.orbA + k/FROZEN_ORB_NOVA_BOLTS*6.283, pr.orbDmg*FROZEN_ORB_BOLT_DMG);
  g.particles.push({type:'ring', x:pr.x, y:pr.y, t:0.5, max:0.5, r:R, color:'#9adfff', exact:true});
  g.particles.push({type:'iceImpact', x:pr.x, y:pr.y, t:0.6, max:0.6, seed:Math.random()});
  g.particles.push({type:'burst', x:pr.x, y:pr.y, t:0.4, max:0.4, color:'#dff6ff'});
  try{ shakeScreen(g, 3, 0.2); }catch(e){}
}
function fireballCount(rank){ return (rank||1)>=5 ? 3 : (rank||1)>=3 ? 2 : 1; }   // v297: 2nd ball at rank 3, 3rd at rank 5
// v297: a Fireball only sometimes ignites its target: 25% + 7.5% per skill rank, much less likely on elites/brutes/heavies and bosses (big life pools)
function fireballBurnChance(p, e){
  const rk = (p.skills && effectiveRank(p,'fireball'))||0;
  let c = 0.25 + 0.075*Math.max(1,rk);
  if(e.isBoss || e.isLairBoss || e.rev || e.wlord || e.dboss || e.balrog || e.trex || e.gj || e.colossus) c *= 0.4;
  else if(isEliteOrBrute(e) || isHeavyEnemy(e)) c *= 0.6;
  return Math.min(0.9, c);
}
const HEAVY_SPELL_MULT = 1.3;   // Pyro Torrent / Blizzard / Plague / Hurricane: +30%
function polarityBonus(rank){ return rank>0 ? 0.20 + 0.0625*(rkSpread5(Math.min(MAX_EFF_RANK,rank))-1) : 0; }   // v489: +20% -> +45% at rank 10 (was 10% -> 25%)
// Call when a damaging spell is cast: returns the damage multiplier (opposite element to the previous spell) and remembers this element.
function polarityCast(p, el){
  const r = (p.skills && effectiveRank(p,'elementalPolarity')) || 0;
  let m = 1;
  if(r>0 && p.lastElem && p.lastElem!==el){ m = 1 + polarityBonus(r); if(game && game.particles) game.particles.push({type:'ring', x:p.x, y:p.y, t:0.3, max:0.3, r:36, color:el==='fire'?'#ff9a4a':'#9fe0ff'}); }
  p.lastElem = el;
  return m;
}
// Freeze: regular enemies freeze after 3 cold hits in a row, brutes/elites after 6 (shorter freeze), bosses are only chilled.
const FREEZE_HITS_NORMAL = 3, FREEZE_HITS_TOUGH = 6, FREEZE_DUR_NORMAL = 1.0, FREEZE_DUR_TOUGH = 0.6, FREEZE_COUNT_WINDOW = 5, FREEZE_IMMUNE = 1.5;
function isEliteOrBrute(e){ return !!(e.elite || e.magic || /brute/.test(e.type||'')); }
function freezeImmune(e){ return !!(isHeavyEnemy(e) || e.rev || e.lr || e.isBoss || e.isLairBoss); }
function coldHit(e, w){
  if(!e || !(e.hp>0)) return false;
  e.chillT = Math.max(e.chillT||0, ICE_CHILL_DUR);
  if(freezeImmune(e) || e.freezeImmT>0 || e.frozenT>0) return false;
  e.coldHits = (e.coldHitT>0 ? (e.coldHits||0) : 0) + (w||1);   // v489: Permafrost no longer doubles cold hits
  e.coldHitT = FREEZE_COUNT_WINDOW;
  const tough = isEliteOrBrute(e);
  if(e.coldHits >= (tough ? FREEZE_HITS_TOUGH : FREEZE_HITS_NORMAL)){
    const dur = tough ? FREEZE_DUR_TOUGH : FREEZE_DUR_NORMAL;
    e.coldHits = 0; e.coldHitT = 0; e.frozenT = Math.max(e.frozenT||0, dur); e.freezeImmT = dur + FREEZE_IMMUNE;
    if(game && game.particles){ game.particles.push({type:'ring', x:e.x, y:e.y, t:0.3, max:0.3, r:e.r+22, color:'#dff4ff'}); game.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:'#bfeaff'}); }
    return true;
  }
  return false;
}
// Self fire damage (Immolate / Flame Vortex): goes through fire resistance, ignores Ice Armor and shields, can never kill.
function selfFireDamage(g, p, amt, quiet){
  if(!(amt>0) || !(p.hp>0)) return 0;
  let d = amt*(1 - elementResist(p,'fire')/100);
  if(p.iceArmorHp>0 && d>0){ const soak = Math.min(p.iceArmorHp, d); p.iceArmorHp -= soak; d -= soak; p.iaSince = 0; if(p.iceArmorHp<=0){ p.iceArmorHp = 0; p.iceArmorT = 0; showMsg('Ice Armor broken', 0.8); } }   // v489: your own fire melts Ice Armor first
  const real = Math.max(0, Math.min(d, p.hp-1));
  p.hp -= real;
  if(!quiet){ p.hitFlash = 0.25; p.sinceHurt = 0; shakeScreen(g, 5, 0.2); }
  return real;
}
function pushEnemy(g, e, ang, dist0){
  if(isHeavyEnemy(e) || !g.room) return;
  const nx = clamp(e.x+Math.cos(ang)*dist0, e.r, g.room.w-e.r), ny = clamp(e.y+Math.sin(ang)*dist0, e.r, g.room.h-e.r);
  if(!losBlocked(g.room.obstacles||[], e.x, e.y, nx, ny)){ e.x = nx; e.y = ny; }
}
const IMMOLATE_CD = 20, IMMOLATE_SELF_PCT = 0.05, IMMOLATE_MIN_HP = 0.25, IMMOLATE_EXPLODE_R = 85, IMMOLATE_EXPLODE_PCT = 0.6;
function immolateDuration(rank){ return 6 + 1*(Math.max(1,rank)-1); }
function immolateBoost(rank){ const r = Math.max(1, rank||1); return r<=5 ? 0.5 + 0.125*(r-1) : 1.0 + 0.2*(Math.min(10,r)-5) + 0.05*Math.max(0, r-10); }   // v489: +50% / +100% at rank 5 / +200% at rank 10
const FLAME_VORTEX_CD = 14, FLAME_VORTEX_R = 75, FLAME_VORTEX_PULL = 0, FLAME_VORTEX_SELF_PCT = 0.12, FLAME_VORTEX_BLAST_MULT = 4;
function flameVortexDur(rank){ return 4 + 0.5*(Math.max(1,rank)-1); }
// v490: Pyre Heart (amber stone): while Immolate burns, a Flame Vortex swirls around you. It uses your Flame Vortex
// rank (rank 5 if you have none), follows you, never erupts, and fades when Immolate goes out. Called from update.js.
function pyreHeartTick(p){
  const on = p.immolateT>0 && uq(p,'uq_pyre');
  if(on && !p.vortex) p.vortex = {t:0, dur:1e9, tick:0, rank:effectiveRank(p,'flameVortex')||5, pol:1, r:FLAME_VORTEX_R*aoeRadiusMult(p), spin:0, pyre:true};
  else if(!on && p.vortex && p.vortex.pyre) p.vortex = null;
}
const PERMAFROST_CD = 12, PERMAFROST_R = 150, PERMAFROST_CAST_RANGE = 400, PERMAFROST_SLOW = 0.9, PERMAFROST_SPEED = 1.1;
// v489 Permafrost: enemies inside are slowed 25% (50% at rank 10) and take +20% cold damage (+50% at rank 10);
// chilled/frozen enemies that die inside shatter, hurting enemies around them. Cooldown 12s -> 8s at rank 10.
const PERMA_SHATTER_R = 85, PERMA_SHATTER_PCT = 0.12;
const r10 = (lo, hi, r)=>{ r = Math.max(1, r||1); return lo + (hi-lo)*(Math.min(10,r)-1)/9; };
function permafrostSlowPct(r){ return r10(0.25, 0.50, r); }
function permafrostColdAmp(r){ return r10(0.20, 0.50, r); }
function permafrostCd(r){ return r10(12, 8, r); }
function permafrostDur(rank){ return 6 + 1*(Math.max(1,rank)-1); }
function permafrostSpeedMult(p){ const z = p.permaZone; return (z && dist(p,z) < z.r) ? PERMAFROST_SPEED : 1; }
function iceArmorSlowPct(rank){ return Math.max(0.05, 0.10 - 0.0125*(Math.max(1,rank)-1)); }
function iceArmorSlowMult(p){ return 1; if(!(p.iceArmorHp>0)) return 1; const r = (p.skills && effectiveRank(p,'iceArmor'))||1; return 1 - iceArmorSlowPct(r); }
const NOVA_DMG_MULT = 1.8, NOVA_PUSH = 55;
const THUNDERSTEP_DIST = 170;
function thunderstepRegenBonus(rank){ return 0.30 + 0.05*(Math.max(1,rank)-1); }
const THUNDERSTEP_R = 35;   // v445: half the old 70 radius
function thunderstepCharge(g, p, x, y, rank){
  const dmg = wpnDmg(p) * swd('thunderstep', rank) * assaultDealtMult(p) * weaponDmgMult(p);
  const hit = p.tsHit || (p.tsHit = new Set());
  for(const e of g.enemies){
    if(e.hp>0 && !hit.has(e) && dist({x,y},e) < THUNDERSTEP_R+e.r){
      hit.add(e);   // v446: each enemy is touched once per dodge -> exactly 1 Charge stack (applied by the lightning hit)
      e.hp -= applyEnemyArmor(p, e, dmg, 0, 'lightning'); e.hitT = 0.15;
      checkExecute(g, e);
    }
  }
  g.particles.push({type:'tsRing', x, y, t:0.35, max:0.35, r:THUNDERSTEP_R});   // v446: simple yellow ring on the floor
}
function thunderstepDodge(g, p){
  const rank = (p.skills && effectiveRank(p,'thunderstep')) || 0;
  if(rank<=0 || !g || !g.room || !p.dodgeDir) return false;
  // v445: keep the normal dodge roll (the blink felt laggy) -- a charge goes off where you start, and another where the roll ends
  p.tsRegenT = 3; p.tsRegenBonus = thunderstepRegenBonus(rank);
  p.tsHit = new Set();
  thunderstepCharge(g, p, p.x, p.y, rank);
  p.tsLandT = Math.max(0.05, p.dodgeDur||0.25); p.tsLandRank = rank;
  return true;
}
// Node 2 -- Elemental Explosions (passive, requires Elemental Polarity):
// Fireball/Ice Bolt splash a fixed-radius, fixed-%-of-hit-damage burst onto
// OTHER nearby enemies on impact (once this is ranked at all), and each
// rank increases the % CHANCE that splash also applies the matching
// ailment (Burn for Fireball's splash, Chill for Ice Bolt's splash) to
// whoever it hits -- per the brief, only the ailment CHANCE scales with
// rank, not the splash radius or damage themselves.
const ELEMENTAL_EXPLOSION_RADIUS = 70, ELEMENTAL_EXPLOSION_SPLASH_PCT = 0.5;
const ELEMENTAL_EXPLOSION_AILMENT_CHANCE_BASE = 0.15, ELEMENTAL_EXPLOSION_AILMENT_CHANCE_STEP = 0.10; // 15% at Rank1 -> 55% at Rank5
function elementalExplosionAilmentChance(rank){ return rank>0 ? ELEMENTAL_EXPLOSION_AILMENT_CHANCE_BASE + ELEMENTAL_EXPLOSION_AILMENT_CHANCE_STEP*(rank-1) : 0; }
// Node 3 -- Fire Bomb (active): instant self-centered AoE burst, same
// "instant burst self-AoE, own button/cooldown" shape as Battlecry/Nova.
// Judgment call: pure damage only, no DoT -- unlike Nova, whose node text
// explicitly calls out "shocking all monsters", Fire Bomb's text only says
// "each rank adds damage", so no extra ailment was invented for it.
const FIRE_BOMB_CD = 8, FIRE_BOMB_RADIUS = 95;
// Node 4 -- Ice Armor (active): a temporary self-buff Damage Reduction %,
// same "X T/TMax duration + a dedicated <x>DamageReduction(p) helper folded
// into playerDamage's takenMult chain" shape Defensive Stance/Rally already
// use (see rallyDefenseReduction). Judgment call: fixed 6s duration at
// every rank (the brief only says "each rank adds defence", nothing about
// duration), % reduction scales per rank on the same diminishing-esque
// front-loaded shape Iron Skin/Riposte already use elsewhere.
// (v145) Rework: Ice Armor is now a flat damage BARRIER instead of a timed % reduction. It soaks
// damage (after armor/resist mitigation) until its pool is spent, then shatters for cold damage.
// 3 minute cooldown. Pool = (140 + 30/rank after the first) scaled +3% per level above 14.
const iceArmorCooldown = r=> Math.max(8, 30 - 15*(clamp(r||1,1,MAX_EFF_RANK)-1)/9);   // v372: 30s at Rank 1, 15s at Rank 10
const ICE_ARMOR_CD = 30, ICE_ARMOR_DUR = 9999; // no timer -- lasts until the barrier is gone
const ICE_ARMOR_ABS_BASE = 140, ICE_ARMOR_ABS_STEP = 30, ICE_ARMOR_ABS_LVL = 0.03;
const ICE_ARMOR_SHATTER_FRAC = 0.5, ICE_ARMOR_SHATTER_RADIUS = 120;
function iceArmorAbsorb(rank, level){
  if(!(rank>0)) return 0;
  return Math.round((ICE_ARMOR_ABS_BASE + ICE_ARMOR_ABS_STEP*(rank-1)) * (1 + ICE_ARMOR_ABS_LVL*Math.max(0,(level||14)-14)));
}
function iceArmorDamageReduction(p){ return 0; } // legacy (kept for the test export): no % reduction any more
// v442 Ice Armor rework: learning it reserves 25% of your mana for a standing ice barrier.
// v443: Barrier = 25% of max life at Rank 1 -> 50% at Rank 10, +1% per rank past 10 (cap 60%).
// It refills on its own after you go 5s without taking a hit (3s at Rank 10).
// The ICE ARMOR button explodes the barrier: cold damage equal to the barrier you currently hold, around you, and it freezes nearby enemies.
const ICE_ARMOR_RESERVE = 0.25, ICE_ARMOR_EXPLODE_CD = 1.0, ICE_ARMOR_EXPLODE_RADIUS = 140;
function iceArmorScale(r){ r = Math.max(1, r||1); return r<=10 ? 0.25 + 0.25*(r-1)/9 : Math.min(0.60, 0.50 + 0.01*(r-10)); }
function iceArmorRecharge(r){ r = Math.max(1, r||1); return Math.max(3, 5 - 2*(r-1)/9); }
// v454: Ice Armor (barrier + mana reservation) only works while it is assigned to a skill button
function iceArmorSlotted(p){ const ss = p && p.skillSlots; if(!ss) return false; for(const k in ss) if(ss[k]==='iceArmor') return true; return false; }
function iceArmorOn(p){ return !!(p && p.cls==='mystic' && p.skills && (effectiveRank(p,'iceArmor')||0)>0 && iceArmorSlotted(p)); }
function iceArmorSync(p){
  const on = iceArmorOn(p);
  if(on !== !!p._iaOn){ p._iaOn = on; if(!on){ p.iceArmorHp = 0; p.iceArmorT = 0; p.iceArmorMax = 0; } else p.iaSince = 99; try{ recalcStats(p); }catch(e){} }
  else if(!on && (p.mpReserved>0 || p.iceArmorHp>0)){ p.iceArmorHp = 0; p.iceArmorT = 0; try{ recalcStats(p); }catch(e){} }
}
function iceArmorBarrierMax(p, r){ return Math.round((p.maxHp||0) * iceArmorScale(r)); }
function iceArmorExplodeDmg(p, r){ return Math.max(0, p.iceArmorHp||0); }
// Node 5 -- Pyro Torrent (active, requires Fire Bomb, NOT the capstone --
// see Blizzard's comment for the capstone judgment call): a channeled
// forward cone that ticks fire damage + Burn for its duration. Judgment
// call on "channel": investigated Precise Shot's hold-to-aim mechanic
// (attackHeld/onAttackDown/onAttackUp) and found it's wired specifically
// and only to the Main/Strike button's own bindHold (not the generic
// tap-only bindBtn wiring the 3 side slots and every other active skill
// use) -- there's no existing generic "hold any assignable slot button"
// input path to hook a true press-and-hold channel into for a skill that,
// per the v74 loadout system, can be assigned to ANY of Main/1/2/3.
// Building one would mean rewiring all 4 slot buttons' input handling for
// a single skill. Simpler, in-scope choice made instead: a plain tap
// starts an extended-duration tick effect (fixed cone in the player's
// current facing direction), same "duration + repeating tick" shape
// Whirlwind/Hurricane already use -- "fire-and-forget with an extended
// active duration" per the brief's own suggested fallback. Fixed cooldown
// at every rank (rank scales damage AND duration instead, per the brief).
// (v124) Rework: a rooted 5s channel -- one long red beam that tracks the nearest enemy and grows
// stronger the longer it burns (x1 -> x2). Ranks add damage; duration is a fixed 5s.
const PYRO_TORRENT_CD = 0, PYRO_TORRENT_TICK_INTERVAL = 0.1, PYRO_RAMP_TIME = 5;
const PYRO_TORRENT_RANGE = 260, PYRO_TORRENT_HALF_ANGLE = Math.PI/4, PYRO_TORRENT_WIDTH = 24, PYRO_TORRENT_TURN = 5.5;
const PYRO_TORRENT_DUR_BASE = 5, PYRO_TORRENT_DUR_STEP = 0, PYRO_TORRENT_RAMP = 1.0, PYRO_TORRENT_TICK_MULT = 0.42;
function pyroTorrentDuration(rank){ return rank>0 ? PYRO_TORRENT_DUR_BASE + PYRO_TORRENT_DUR_STEP*(rank-1) : PYRO_TORRENT_DUR_BASE; }
// Node 6 -- Blizzard (active, requires Ice Armor, CAPSTONE -- see the
// node's own comment in MYSTIC_SKILL_TREES for the full node5-vs-node6
// judgment call). Instant self-centered AoE, same shape as Nova/Fire Bomb,
// that damages AND applies the new generic Freeze (e.frozenT) to every
// enemy it hits -- a full immobilize, not merely the Chill/slow every
// other ice effect in the game already applies (see this section's top
// comment for the field itself). Freeze duration is fixed at every rank
// (brief: "each rank adds damage" only) -- 1.2s, long enough to read as a
// real capstone-tier lockdown without being a full stunlock.
const BLIZZARD_CAST_RANGE = 460, BLIZZARD_CD = 8, BLIZZARD_RADIUS = 130, BLIZZARD_FREEZE_DUR = 1.2;
// (v147) Blizzard is a 4s ground zone: ice shards rain in at 45deg, each tick hurts + chills everything inside.
const BLIZZARD_DUR = 4, BLIZZARD_TICK = 0.25, BLIZZARD_TICK_MULT = 0.45, BLIZZARD_SHARDS_PER_TICK = 3;
// ---------- Necromancer tree (Mystic's 3rd & final tree, v78) --------------
// New mechanics this batch: a persistent player resource (p.souls, capped
// at SOUL_CAP), a 2nd/3rd companion kind reusing the Knight/Hunter follower
// system (g.followers kind:'skeleton'/'demon'), a new "flee" status
// (e.fearT) distinct from Stun/Freeze, and the first resource-COST gate on
// an active skill (see the ACTIVE_SKILL_REGISTRY entries' new optional
// .cost(p) field, used by Sacrifice/Plague below).
//
// Node 1 -- Fear (active, no prereq): a self-centered AoE that makes every
// enemy in range flee -- a brand-new mechanic (no existing "flee" AI state
// anywhere in the game to reuse), implemented as a new e.fearT field that,
// while >0, overrides an enemy's normal chase/attack/wander logic and
// instead steers it directly AWAY from the player (see the merged
// stunT/frozenT-style branch in the enemy-update loop, just below that
// one, which `continue`s the same way). Rank scales BOTH the fear duration
// AND (per the brief, explicitly, unlike most of this tree's other active
// skills) the skill's OWN cooldown -- see fearCooldown/fearDuration.
const FEAR_CD_BASE = 8, FEAR_CD_MIN = 8, FEAR_RADIUS = 105, FEAR_CAST_RANGE = 380;   // v517: a smaller ring (was 150)   // v489: 8s cooldown, cast onto a group of enemies
const FEAR_VULN_BASE = 5, FEAR_VULN_MAX = 10, FEAR_VULN_EXTRA = 3; // % extra damage taken: 5% at rank 1 -> 10% at rank 5, lasting the fear + 3s
function fearVulnPct(rank){ const r = Math.max(1, rank||1); return rank>0 ? 15 + 35*(Math.min(10,r)-1)/9 + Math.max(0, r-10) : 0; }   // v517: +15% damage taken at rank 1 -> +50% at rank 10
const FEAR_DUR_BASE = 1.5, FEAR_DUR_STEP = 0.5; // 1.5s at Rank1 -> 3.5s at Rank5
function fearCooldown(rank){
  if(rank<=0) return FEAR_CD_BASE;
  return FEAR_CD_BASE - (FEAR_CD_BASE-FEAR_CD_MIN)/4*(rank-1);
}
function fearDuration(rank){ return rank>0 ? FEAR_DUR_BASE + FEAR_DUR_STEP*(rank-1) : FEAR_DUR_BASE; }
// Node 2 -- Raise Dead (passive, no prereq): JUDGMENT CALL on the summon
// trigger -- the brief allows either "raise from corpses on enemy death"
// or "simply maintain up to N standing minions like Hunter's Wolf/Bear".
// The latter was chosen: it reuses the EXACT same companion-system
// conventions (g.followers, makeFollower/followerDmg/followerMaxHp,
// syncFollowerKind/ensureFollowers, the shared per-frame follower seek/
// attack/follow-home loop) already built for Squire/Wolf/Bear, with zero
// new state-machine code, rather than inventing a brand-new "corpse
// reanimation" trigger with its own timing/range rules the brief doesn't
// specify. A new kind:'skeleton' follower is synced to a rank-scaled count
// (reusing squireFollowerCount's exact 0/1/2/2/3/3 -> effectively 1 at
// Rank1, 2 at Rank3, 3 at Rank5 curve verbatim -- "up to 3 minions at max
// rank" matches it exactly) the same way ensureFollowers already syncs
// Wolf/Bear counts off their own skill ranks. Damage/HP scale per rank via
// the existing hunterFollowerStatMult curve, same as Wolf/Bear.
const NECRO_SKELETON_BASE_DMG = 8, NECRO_SKELETON_HP_MULT = 0.25, NECRO_SKELETON_R = 15;
// Node 3 -- Soul Sap (active, requires Fear OR Raise Dead): type:'active',
// a normal ACTIVE_SKILL_REGISTRY entry (reusing the plain atkCd/atkCdMax
// pair) explicitly Assignable to Main/1/2/3 like any other active skill --
// (v99 fix) it no longer auto-overrides the default Main/Strike attack the
// way it originally did (see the removed staffItem override branch, and
// Lightning Arc's own identical v99 fix); it now fires through its own
// wantSoulSap cast block, same as Fireball/Ice Bolt. A kill lands a soul
// (SOUL_SAP_SOULS_PER_KILL, capped at SOUL_CAP) and immediately checks the
// Demon Bind threshold (checkDemonBindThreshold) right after, so the demon
// can summon the instant souls cross 10. The visual is a white soul orb
// that flies from the killed enemy BACK to the player -- see isSoulOrb in
// the projectile-hit handler and drawProjectilesIso.
function soulSapTargets(rank){ return rank>=5 ? 3 : rank>=3 ? 2 : 1; }   // v497: 1 enemy at Rank 1, a 2nd at Rank 3, a 3rd at Rank 5
const SOUL_SAP_SPLASH_R = 170;   // v484: the two extra drains only reach enemies close to the main target
const SOUL_CAP = 50, SOUL_SAP_SOULS_PER_KILL = 3, SOUL_SAP_SOULS_PER_CAST = 1, SOUL_ORB_SPEED = 520;   // v489: +1 soul per Soul Sap attack that hits, +3 when a sapped enemy dies
const SOULSAP_MULT = 1.2;
// Node 4 -- Sacrifice (active, requires Soul Sap): the first skill in the
// game with an explicit resource COST, not just a cooldown -- see the new
// ACTIVE_SKILL_REGISTRY .cost(p) extension documented on that registry's
// own comment. Detonates every current 'skeleton' follower (Raise Dead's
// minions) in a small poison AoE at each one's own position, reusing the
// exact e.poisonT/poisonDps field pair Poison Knives already established
// (same POISON_DOT_PCT/POISON_DOT_DUR). JUDGMENT CALL: if no skeleton
// minions are currently out, the cast still consumes the 5 souls (so the
// cost gate/UI stays simple and predictable) but falls back to a single,
// smaller burst centered on the player instead of doing nothing -- see
// NECRO_SACRIFICE_FALLBACK_* below.
const NECRO_SACRIFICE_SOUL_COST = 1, SACRIFICE_CD = 0, SACRIFICE_RADIUS = 90, SACRIFICE_BASE_DMG = 20;
const NECRO_SACRIFICE_FALLBACK_RADIUS_MULT = 0.55, NECRO_SACRIFICE_FALLBACK_DMG_MULT = 0.5;
// Node 5 -- Demon Bind (passive, requires Soul Sap): auto-summons a 2nd,
// tougher companion kind ('demon') the instant the player's souls cross
// DEMON_BIND_SOUL_THRESHOLD. JUDGMENT CALL: crossing the threshold
// CONSUMES those 10 souls (rather than being a non-consuming level check),
// both because it reads naturally as "spending" 10 souls to bind a demon,
// and because it's the simplest way to stop it from re-triggering every
// single frame once souls sit at/above 10 -- combined with the "only one
// demon out at a time" gate (see checkDemonBindThreshold, which also
// refuses to re-summon while a 'demon' kind follower already exists in
// g.followers), this makes the threshold a clean one-shot event per demon.
// The demon's attacks life-leech a rank-scaled % of damage dealt, healing
// BOTH the player (p.hp) and the demon's own HP (f.hp) -- adapted from the
// Dark Crypt Vampire's own lifesteal-on-hit pattern (VAMPIRE_LIFESTEAL_PCT),
// just applied from the follower-attack side instead of the enemy side,
// and split across two recipients instead of one.
const DEMON_BIND_SOUL_THRESHOLD = 5;   // v507: 5 souls to bind (and re-bind) the demon
// ===== v268 Necromancer redesign =====
const DEATHBOLT_MULT = 0.95, DEATHBOLT_BOUNCE_MULT = 0.5, DEATHBOLT_BOUNCE_RANGE = 260, DEATHBOLT_LOW_MULT = 1.5, DEATHBOLT_LIFESTEAL = 0.08;   // v317: life steal 10% -> 8%
function deathBoltBounces(rank){ return rank>0 ? 1 + Math.ceil(rank/2) : 0; }
const SOUL_HUNGER_HP_PCT = 0.015, SOUL_HUNGER_DMG_PER_SOUL = 0.005;   // +1% damage per 2 souls = +25% at 50
function soulHungerInterval(rank){ return (1.6 - 0.2*(Math.max(1,rank)-1))/5; }   // v299: 5x as fast
function soulHungerMult(p){ const r = (p.skills && effectiveRank(p,'soulHunger'))||0; return r>0 ? 1 + SOUL_HUNGER_DMG_PER_SOUL*Math.min(SOUL_CAP,(p.souls||0)) : 1; }
const SOULSHIELD_PER_SOUL = 0.012;
// v489 Soul Shield: a chance to block per soul held (0.4% at rank 1 -> 0.7% at rank 10), instead of Defence
function soulShieldBlockPerSoul(r){ r = Math.max(1, r||1); return 0.004 + 0.003*(Math.min(10,r)-1)/9 + 0.0002*Math.max(0, r-10); }
function soulShieldBlock(p){ const r = (p && p.skills && effectiveRank(p,'soulShield'))||0; return r>0 ? Math.min(0.5, soulShieldBlockPerSoul(r)*Math.min(SOUL_CAP, p.souls||0)) : 0; }
function soulShieldFrac(rank){ return 0.40 + 0.05*(Math.max(1,rank)-1); }
// v413: Soul Shield is a free passive defence -- souls held give damage reduction, nothing is drained
// v414: ...as extra Defence Rating (so it works through the normal hit-chance curve and its floor, not as flat damage reduction):
// each soul adds a slice of an equal-level enemy's attack rating. 50 souls ~ +25% of AR at rank 1 (about 15% fewer hits land, less with good gear).
function soulShieldPerSoul(rank){ return rank>0 ? 0.005*(1+0.12*(Math.max(1,rank)-1)) : 0; }
function soulShieldDefense(p){ return 0; const r = (p && p.skills && effectiveRank(p,'soulShield'))||0; return r>0 ? enemyAttackRating(p.level)*soulShieldPerSoul(r)*Math.min(SOUL_CAP,p.souls||0) : 0; }
const SOULGATE_COST = 4, SOULGATE_CD = 20, SOULGATE_ARCHER_LIFE = 6, SOULGATE_ARCHER_CAP = 8, SOULGATE_ARCHER_BASE_DMG = 7;
function soulGateDrain(rank){ return 2 - 0.2*(Math.max(1,rank)-1); }
// v319: the gate now stays open a SET time and souls are paid per archer actually released (no archer out = no soul spent)
const SOULGATE_DUR_BASE = 8, SOULGATE_DUR_STEP = 1, SOULGATE_SOULS_PER_ARCHER = 4;   // v495: 4 souls per archer
function soulGateCooldown(rank){ return Math.max(10, SOULGATE_CD - 2*(Math.min(Math.max(1,rank),8)-1)); }   // v320: 20s at rank 1, -2s per rank, floor 10s
function soulGateDuration(rank){ return SOULGATE_DUR_BASE + SOULGATE_DUR_STEP*(Math.min(Math.max(1,rank),8)-1); }
function soulGateInterval(rank){ return 1.0 - 0.1*(Math.max(1,rank)-1); }
const FEAR_SOUL_COST = 0;   // v411: Fear costs mana only again
// v419: Soul Nova -- a flat 10 souls, or 20 mana when you hold fewer; damage grows with rank
// v489 Soul Fire (replaces Soul Nova): 5 souls + 20 mana, a big slow rolling ball of green soul-flame that bursts on impact (half physical, half poison)
const SOULFIRE_SOUL_MIN = 10, SOULFIRE_SOUL_COST = 20, SOULFIRE_BONUS = 0.2, SOULFIRE_COST_TXT = '10-20', SOULFIRE_MANA_COST = 20, SOULFIRE_CD = 6, SOULFIRE_RADIUS = 105, SOULFIRE_SPEED = 170, SOULFIRE_LIFE = 3.2, SOULFIRE_R = 15;
function soulFireExplode(g, p, pr){
  const R = pr.R || SOULFIRE_RADIUS;
  for(const e of g.enemies){
    if(e.hp>0 && dist(pr,e) < R+e.r){
      e.hp -= splitHit(p, e, pr.dmg, 0.5, 'poison'); e.hitT = 0.2;
      addPoison(e, pr.dmg*0.5*POISON_DOT_PCT, 'soulfire');
      checkExecute(g, e);
    }
  }
  shakeScreen(g, 4, 0.2);
  g.particles.push({type:'ring', x:pr.x, y:pr.y, t:0.45, max:0.45, r:R, color:'#7dff6a'});
  g.particles.push({type:'ring', x:pr.x, y:pr.y, t:0.3, max:0.3, r:R*0.6, color:'#d8ffd0'});
  g.particles.push({type:'gasBurst', thin:1, x:pr.x, y:pr.y, t:0.6, max:0.6, r:R*0.8, seed:pr.seed||0});
  for(let k=0;k<12;k++){ const an = k/12*6.283, rr = R*(0.2+Math.random()*0.6); g.particles.push({type:'burst', x:pr.x+Math.cos(an)*rr, y:pr.y+Math.sin(an)*rr, t:0.45, max:0.45, color:k%3===0?'#e6ffe0':k%2?'#5ae04a':'#2a9a3a'}); }
  for(let k=0;k<5;k++){ const an = Math.random()*6.283; g.particles.push({type:'dbWisp', x:pr.x+Math.cos(an)*R*0.4, y:pr.y+Math.sin(an)*R*0.4, t:0.7, max:0.7}); }
  try{ sfxPlay('fireHit', 0.9); }catch(err){}
}
function soulFireDmg(p, rank){ return wpnDmg(p) * swd('soulFire', rank) * soulHungerMult(p); }
const DEMON_LINK_SHARE = 0.5, DEMON_SIZE_PER_10 = 0.04, DEMON_DMG_PER_10 = 0.10;   // v507: +20% size at 50 souls (4% per 10)
function demonSoulMult(p, per){ return 1 + per*Math.min(SOUL_CAP,(p.souls||0))/10; }
function necroSkeletonCount(rank){ return rank>0 ? [0,2,2,3,4,5][Math.min(5,rank)] : 0; }
const NECRO_RESPAWN_SOULS = 1;
// v460 Raise Skeletons: passive + active. A fallen skeleton stays down until you press Raise Skeletons --
// unless you hold a soul: then one soul is spent automatically to raise it after a short delay.
const RAISE_DEAD_CD = 6;   // v489
function skelSoulRaiseDelay(rank){ return 0.5; }   // v515: a held soul raises a fallen skeleton after 0.5s (v507: 1s, was 3s)
const RAISE_DEAD_MANA_PER_SKEL = 12;
const SKEL_RECAST_DELAY = 1.5;   // v530: Sacrifice blast -> the fresh set rises 1.5s later
// raise every skeleton that is missing, crawling up out of the ground in a ring around you
function necroRaiseNow(g, p){
  const n0 = g.followers.length; ensureFollowers(g);
  const fresh = g.followers.slice(n0).filter(f=>f.kind==='skeleton');
  fresh.forEach((nf,i)=>{
    const an = i/Math.max(1,fresh.length)*6.283 + Math.random()*0.4, r = rand(55, 85);
    let x = p.x+Math.cos(an)*r, y = p.y+Math.sin(an)*r*0.8;
    if(posBlockedByObstacles(x, y, 12, g.room.obstacles)){ x = p.x; y = p.y; }
    nf.x = x; nf.y = y; nf.riseT = 0.7;
    g.particles.push({type:'burst', x, y, t:0.5, max:0.5, color:'#5a4630'});
    g.particles.push({type:'burst', x, y, t:0.4, max:0.4, color:'#a08ad0'});
  });
  if(fresh.length) try{ sfxPlay('summon', 0.8); }catch(e){}
}
function necroSkeletonLimit(p){ const r = (p && p.skills && effectiveRank(p,'raiseDead'))||0; return r>0 ? necroSkeletonCount(r) + (uq(p,'uq_necromancer') ? 2 : 0) : 0; }
function sacrificeLifePct(r){ r = Math.max(1, r||1); return 0.25 + 0.20*(Math.min(10,r)-1)/9 + 0.01*Math.max(0, r-10); }   // v489: blast = 25% -> 45% of the skeleton's max life
// v460 Meteor (Elementalist fire capstone)
const METEOR_DELAY = 0.9, METEOR_R = 125, METEOR_BURN_DUR = 4, METEOR_BURN_TICK = 0.25;
const NECRO_SKEL_SOUL_DMG = 0.25;   // v416: +25% skeleton damage at a full soul bar, scaled by souls held
const PLAGUE_DMG_BUFF = 1.3;
function necroHasSoulSkills(p){ if(!p || !p.skills) return false; for(const id of ['deathBolt','soulSap','soulHunger','soulGate','soulShield','demonBind','sacrifice','fear','raiseDead','soulFire']) if((effectiveRank(p,id)||0)>0) return true; return false; }
const NECRO_TREE_IDS = ['soulNova','soulFire','deathBolt','raiseDead','soulSap','soulHunger','soulGate','soulShield','demonBind','fear','sacrifice','plague'];
const NECRO_DEMON_BASE_DMG = 14, NECRO_DEMON_HP_MULT = 1.4, NECRO_DEMON_R = 19;   // v507: the old 50-soul size (17.25) plus 10% is now the starting size
const NECRO_DEMON_LEECH_BASE = 0.10, NECRO_DEMON_LEECH_STEP = 0.025; // 10% at Rank1 -> 20% at Rank5 (halved)
// v382: wolves life-leech too: 5% of the damage they deal at Rank 1, rising to 20% at Rank 10 (heals only the wolf)
function wolfLeechPct(rank){ return rank>0 ? 0.05 + (Math.min(10,rank)-1)*(0.15/9) : 0; }
function necroDemonLeechPct(rank){ return rank>0 ? NECRO_DEMON_LEECH_BASE + NECRO_DEMON_LEECH_STEP*(rank-1) : 0; }
// Node 6 -- Plague (active, requires Sacrifice OR Demon Bind, CAPSTONE): a
// large, ground-targeted (self-centered, left behind at the cast position
// rather than following the player -- "corrupt the ground", unlike
// Hurricane's player-following AoE) poison DoT zone. Base duration 2.5s;
// rank scales damage only (per the brief). Duration instead grows +0.1s
// per soul consumed on cast -- JUDGMENT CALL: the brief says "for every
// soul consumed" without specifying an exact consumption amount, so this
// consumes ALL currently-held souls (0 to 50) on cast, same "spend what
// you've got" shape Sacrifice's fixed 5-soul cost doesn't need to make a
// judgment call about. Max possible bonus: 50 souls x 0.1s = +5s, for a
// ~7.5s max duration cast at a full 50 souls. Unlike Sacrifice, this has
// NO hard minimum-soul gate (.cost(p) returns 0) -- it's always castable,
// even at 0 souls, just with only the 2.5s base duration.
const PLAGUE_CD = 8, PLAGUE_RADIUS = 260, PLAGUE_TICK_INTERVAL = 0.3;
const PLAGUE_DUR_BASE = 8, PLAGUE_DUR_PER_SOUL = 0;
function plagueDuration(soulsConsumed){ return PLAGUE_DUR_BASE + PLAGUE_DUR_PER_SOUL*(soulsConsumed||0); }
// Assassin tree: Poison Knives (active fan-throw + poison DoT), Execute
// (passive low-HP finisher), Vanish (active stealth: no aggro/collision).
const POISON_DOT_DUR = 3, POISON_DOT_PCT = 0.35; // poison: 35% of hit damage/sec for 3s
// v508: poison from DIFFERENT sources now stacks. Each source (a skill, gear, a trap...) keeps one stack on the enemy; a fresh hit from the
// same source refreshes its stack (keeping the stronger damage), and the enemy takes the SUM of all stacks per second. Up to 6 stacks;
// a full set is replaced weakest-first. `replace` is for sources that re-apply every tick (clouds), which simply set their stack.
const POISON_MAX_STACKS = 6;
function addPoison(e, dps, src, dur, replace){
  if(!e || !(dps>0)) return;
  const st = e.poisonStacks || (e.poisonStacks = []), d = dur || POISON_DOT_DUR;
  let s = st.find(x=>x.src===src);
  if(s){ s.dps = replace ? dps : Math.max(s.dps, dps); s.t = Math.max(s.t, d); }
  else if(st.length < POISON_MAX_STACKS) st.push({src, dps, t:d});
  else { let wi = 0; for(let i=1;i<st.length;i++) if(st[i].dps < st[wi].dps) wi = i; if(st[wi].dps < dps) st[wi] = {src, dps, t:d}; }
  poisonSync(e);
}
function poisonSync(e){
  const st = e.poisonStacks; let sum = 0, tm = 0;
  if(st) for(const s of st){ sum += s.dps; if(s.t>tm) tm = s.t; }
  e.poisonDps = sum; e.poisonT = tm;   // (the single-slot fields still drive the green tint, 'ailing' checks and the damage tick)
}
// Execute: threshold ramps linearly from 10% (rank1) to 25% (rank5).
const EXECUTE_THRESHOLD_BASE = 0.10, EXECUTE_THRESHOLD_PER_RANK = 0.0375;
function executeThreshold(rank){ return rank>0 ? EXECUTE_THRESHOLD_BASE + EXECUTE_THRESHOLD_PER_RANK*(rank-1) : 0; }
// Called right after any player-dealt hit lands on an enemy -- instantly
// finishes it off if the hit left it below the rank-scaled HP threshold.
// The normal "remove dead" pass a little later in update() then handles
// XP/loot/cleanup exactly as it would for a normal lethal hit.
function checkExecute(g, e){
  const p = g.player;
  const rank = (p.skills && effectiveRank(p,'execute')) || 0;
  if(rank<=0 || !e || e.hp<=0 || !e.maxHp) return;
  if(e.hp/e.maxHp < executeThreshold(rank)) e.hp = 0;
}
// v79: Vanish is now the Survivalist tree's capstone (continuing the exact
// same id/mechanic -- see playerVanished/pickEnemyTarget and playerDamage's
// vanishT check below, both UNCHANGED). Numbers retuned per the new spec:
// base duration 1s (was 3s), ranks scale up to 5s at Rank 5 (a flat +1s/rank
// step -- (5-1)/4 ranks), and cooldown is now a FIXED 30s at every rank
// (was a 12s cooldown that never actually scaled with rank either, so this
// is purely a bigger fixed number, not a new "fixed" behavior). v79 ALSO
// adds "dealing damage ends the effect early" -- see applyEnemyArmor's own
// comment for the single shared chokepoint that clears p.vanishT the
// instant the player's next hit lands, before its duration naturally
// expires.
const VANISH_EVA = 0.60, VANISH_EVA_DUR = 2;   // (v245) 60% evasion for 2s once Vanish ends
const VANISH_CD = 30, VANISH_BASE_DUR = 1, VANISH_RANK_STEP = 1;
// Sap (Assassin, v57): passive. Outgoing damage bonus that only applies
// while the player is at exactly full health (p.hp>=p.maxHp -- no partial
// tolerance band; regen/heals round to whole HP already, so "full" reads
// as a clean on/off gate rather than a fuzzy near-full threshold). Curve is
// hand-picked (not a plain linear step) per the request's own example
// numbers: +25% at Rank 1, easing up to +40% at Rank 5.
const SAP_DMG_BONUS = [0.25, 0.30, 0.35, 0.38, 0.40];
function sapDamageBonus(rank){ return rank>0 ? tblAt(SAP_DMG_BONUS, rank) : 0; }
function sapActive(p){ return !!(p && p.hp!=null && p.maxHp!=null && p.hp>=p.maxHp); }
function sapMult(p){
  const rank = (p && p.skills && effectiveRank(p,'sap')) || 0;
  if(rank<=0 || !sapActive(p)) return 1;
  return 1 + sapDamageBonus(rank);
}
// Evasion (Assassin skill, v57): passive dodge chance, distinct from the
// Leather armor gear stat of the same name but feeding into the exact same
// aggregate roll in evasionChance() below, so a Ranger with both sources
// gets a genuinely combined dodge rate (still capped at the existing 60%
// overall cap -- see EVASION_CAP near evasionChance -- rather than two
// separate, non-interacting dodge checks).
// v79: Survivalist's Evasion, continuing the exact same id/mechanic --
// numbers retuned per the new spec ("5% at Rank1... up to 20%"). JUDGMENT
// CALL: rather than a perfectly even linear step (which lands on an ugly
// 3.75%/rank), the cap is reached at Rank 4 (5/10/15/20/20 -- Rank 5 holds
// at the stated 20% cap rather than exceeding it), matching the "up to
// 20%" phrasing literally as a hard ceiling.
const EVASION_SKILL_PCT = [0.05, 0.10, 0.15, 0.20, 0.22, 0.24, 0.26, 0.28, 0.30, 0.32];   // v372: keeps scaling to Rank 10; total dodge still capped by EVASION_CAP
function evasionSkillChance(p){
  const rank = (p && p.skills && effectiveRank(p,'evasion')) || 0;
  return rank>0 ? EVASION_SKILL_PCT[Math.min(rank,10)-1]+Math.max(0,rank-10)*0.01 : 0;
}
// Shadow Step (Assassin skill, v57): new SHADOW button. Teleports the
// player to a safe spot directly behind the closest enemy within range
// (opposite that enemy's current facing direction, falling back to a spot
// away from the player if the enemy has no facing, with obstacle-safety
// via posBlockedByObstacles -- same helper the corner-steering AI uses),
// then immediately queues a normal basic attack against it (by clearing
// atkCd and setting wantAttack, so it rides the very next attack-code pass
// exactly like a manually-pressed Strike would, automatically retargeting
// the same nearby enemy). Cooldown ramps down from 4s at Rank 1 to 2s at Rank 5.
const SHADOW_STEP_RANGE = 320;
const SHADOW_STEP_CD = [4, 3.5, 3, 2.5, 2];
function shadowStepCooldown(rank){ return rank>0 ? tblAt(SHADOW_STEP_CD, rank) : SHADOW_STEP_CD[0]; }
function shadowStepDestination(g, target, p){
  const room = g.room;
  const eAng = (target.facing && (target.facing.x||target.facing.y)) ? Math.atan2(target.facing.y, target.facing.x) : Math.atan2(target.y-p.y, target.x-p.x);
  const backAng = eAng + Math.PI; // directly opposite the enemy's facing == "behind" it
  const behindDist = (target.r||14) + (p.r||16) + 10;
  const tryAngles = [backAng, backAng+0.6, backAng-0.6, backAng+1.2, backAng-1.2, eAng, eAng+0.6, eAng-0.6];
  for(const a of tryAngles){
    const x = clamp(target.x+Math.cos(a)*behindDist, p.r, room.w-p.r);
    const y = clamp(target.y+Math.sin(a)*behindDist, p.r, room.h-p.r);
    if(!posBlockedByObstacles(x, y, p.r, room.obstacles)) return {x, y};
  }
  return {x:p.x, y:p.y}; // nowhere clear found -- stay put rather than clip into a wall
}
