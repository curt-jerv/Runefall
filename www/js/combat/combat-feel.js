// ---------- Cast movement stop (v105) ----------
// Casting/attacking briefly roots the player (p.movementStopT, honored by the
// combat movement path). Detected generically, with no per-skill edits: every
// ACTIVE_SKILL_REGISTRY entry exposes its cooldown via getCd(), and a cast
// always pushes that cooldown UP (it otherwise only counts down), so comparing
// a before/after snapshot around the attack + skill blocks catches every cast.
//   - Basic attack (Strike / Soul Sap / Lightning Arc, which all ride atkCd):
//     0.5s for Ranger and Mystic; none for Warrior (its Strike/Cleave/Fury
//     are exempt).
//   - Every other active skill: 0.3s -- EXCEPT the exempt Warrior skills
//     below (Shield Bash / Whirlwind / Guardian / Assault keep their own 0.1s
//     set inline), plus toggles/channels where a root makes no sense
//     (Commander's stance toggle, both Field Dress channels).
const MOVE_STOP_SKILL = 0.2, MOVE_STOP_RANGED_ATTACK = 0.2;
const MOVE_LOCK_RANGED_FRAC = 0.7, MOVE_LOCK_MELEE_FRAC = 0.5;   // v401: share of the attack cooldown spent rooted (D2 roots you for the whole animation)
const MOVE_STOP_ATTACK_IDS = {strike:1, soulSap:1, lightningArc:1, deathBolt:1};
const MOVE_STOP_EXEMPT = {fireball:1, immolate:1, flameVortex:1, leap:1, unbreakable:1, shieldBash:1, whirlwind:1, guardian:1, assault:1, commander:1, fieldDress:1, survivalFieldDress:1};
function snapshotSkillCds(p){
  const snap = {};
  for(const id in ACTIVE_SKILL_REGISTRY){
    const c = ACTIVE_SKILL_REGISTRY[id].getCd(p);
    snap[id] = (c && c.cur) || 0;
  }
  return snap;
}
function applyCastMovementStop(p, snap){
  const ranged = p.cls==='ranger' || p.cls==='mystic';
  for(const id in snap){
    if(MOVE_STOP_EXEMPT[id]) continue;
    const c = ACTIVE_SKILL_REGISTRY[id].getCd(p);
    if(!c || !((c.cur||0) > snap[id] + 1e-4)) continue; // cooldown didn't go up -> not cast this frame
    const dur = MOVE_STOP_ATTACK_IDS[id] ? clamp((p.atkCdMax||0.5)*(ranged ? MOVE_LOCK_RANGED_FRAC : MOVE_LOCK_MELEE_FRAC), 0.1, 0.5) : MOVE_STOP_SKILL;   // v401: basic attacks root you for a share of the swing, so Attack Speed gear shortens it too
    if(dur > (p.movementStopT||0)) p.movementStopT = dur;
  }
}

// ---------- Combat feel pass (v104) ----------
// Three problems this addresses (see the design notes in the changelog):
//  1. Enemy melee dealt damage the instant it reached you -- no tell, so
//     dodging/spacing could never be a deliberate decision. Now every basic
//     melee swing has a short wind-up (e.windT) that resolves only if you're
//     still in reach and not mid-dodge-roll.
//  2. Player hits had no weight -- no numbers, no hit-stop, no shake. Now
//     hits show damage numbers, kills/hurts get a tiny freeze + screen shake.
//  3. Enemies ignored being hit, so combat was a pure DPS race. Now a melee
//     Strike staggers (freezes + cancels the wind-up of) normal enemies,
//     with a short immunity so they can't be stun-locked, and a perfect
//     dodge (roll through a wind-up) grants a brief damage bonus.
const ENEMY_WINDUP_MIN = 0.22, ENEMY_WINDUP_MAX = 0.4, ENEMY_WINDUP_FRAC = 0.35; // windup = atkCdMax*frac, clamped
const ENEMY_WINDUP_REACH_SLACK = 10;   // extra px of reach at resolve time (so a 1-px step doesn't fully whiff)
const STAGGER_WIND_CUTOFF = 0.5; const STAGGER_CHANCE = 0.6;
const STAGGER_DUR = 0.18, STAGGER_IMMUNE = 1.5;
const RIPOSTE_DUR = 1.5, RIPOSTE_DMG_MULT = 1.3; // perfect-dodge damage bonus
let lastHitCrit = false; // set around crit-capable hits so damage numbers can style crits
function spawnDmgNumber(g, e, amt, crit, opt){
  if(!g || !g.particles || g.particles.length>250) return;
  if(settings.damageNumbers===false) return; // Settings > Damage Numbers toggle
  if(opt && opt.dot && settings.dotNumbers===false) return;        // Settings > Damage over time numbers
  if(opt && opt.follower && settings.followerNumbers===false) return; // Settings > Follower damage numbers
  g.particles.push({type:'num', x:e.x+rand(-8,8)+(opt&&opt.dx||0), y:e.y, t:0.7, max:0.7, text:String(Math.max(1,Math.round(amt))), crit:!!crit, small:!!opt, col:opt&&opt.col});
}
// v298: damage-over-time ticks are summed per colour and shown as one small number every half second
function dotAdd(e, amt, col){ if(!(amt>0)) return; const a = e._dotAcc || (e._dotAcc = {}); a[col] = (a[col]||0) + amt; }
function dotFlush(g, e, dt){
  if(!e._dotAcc) return;
  e._dotT = (e._dotT||0) + dt; if(e._dotT < 0.5) return;
  e._dotT = 0; const a = e._dotAcc; e._dotAcc = null;
  let k = 0; for(const col in a){ if(a[col]>=0.5) spawnDmgNumber(g, e, a[col], false, {dot:1, col, dx:(k++)*14-6}); }
}
function shakeScreen(g, mag, dur){
  if(!g) return;
  if(mag >= (g.shakeMag||0) || !(g.shakeT>0)){ g.shakeMag = mag; }
  g.shakeT = Math.max(g.shakeT||0, dur);
}
function hitStop(g, dur){ if(g) g.hitStopT = Math.max(g.hitStopT||0, dur); }
// Normal enemies flinch; bosses, lair bosses and stationary Leviathans don't.
function staggerEnemy(e, dur){
  if(!e || e.isBoss || e.isLairBoss || e.speed===0) return;
  if(e.staggerImmuneT>0 || e.staggerT>0) return;
  // v334: a hit only interrupts the FIRST half of a wind-up; once the swing/charge is past halfway it lands anyway
  if(e.windT>0 && e.windMax>0 && e.windT < e.windMax*STAGGER_WIND_CUTOFF) return;
  if(e.chargeState==='wind' && e.chargeWindT < BEAR_CHARGE_WIND*STAGGER_WIND_CUTOFF) return;
  if(e.boarChargeState==='wind' && e.boarWindT < BOAR_CHARGE_WIND*STAGGER_WIND_CUTOFF) return;
  if(e.zChargeState==='wind' && e.zChargeWindT < ZOMBIE_CHARGE_WIND*STAGGER_WIND_CUTOFF) return;
  if(Math.random() >= STAGGER_CHANCE) return;   // v335: 60% chance to interrupt
  e.staggerT = dur;
}
function beginEnemyMelee(e){
  e.atkCd = e.atkCdMax;
  e.windMax = e.type==='bear' ? BEAR_SWIPE_WIND : e.type==='boar' ? BOAR_BITE_WIND : clamp(e.atkCdMax*ENEMY_WINDUP_FRAC, ENEMY_WINDUP_MIN, ENEMY_WINDUP_MAX);   // bears rear up (v191)
  e.windT = e.windMax;
  e.atkAnimT = e.windMax + 0.15;
}
// Returns true while the enemy is mid-wind-up (caller skips its chase/attack
// logic for the frame). On resolve the hit lands only if the target is still
// within reach; rolling through it (p.dodging) is a "perfect dodge".
function tickEnemyWindup(g, e, target, isFollowerTarget, reach, dt){
  if(!(e.windT>0)) return false;
  e.windT -= dt; e.moving = false;
  if(e.windT<=0){
    e.windT = 0;
    reach += (e.meleeBonus||0);
    if(e.meleeSplash){   // v456 cave troll: the swing lands on everyone inside its circle
      const R = e.r + 24 + (e.meleeBonus||0), p = g.player;
      if(dist(e,p) <= R + p.r*0.5 && !(p.dodging)) playerDamage(g, e.dmg, e, null, true);
      if(g.followers) for(const f of g.followers) if(f.kind!=='cat' && dist(e,f) <= R + (f.r||12)*0.5) applyFollowerDamage(g, f, e.dmg, e);
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.3, max:0.3, r:R, color:'#c9a070'});
      return true;
    }
    if(dist(e,target) <= reach + ENEMY_WINDUP_REACH_SLACK && hasLOS(g,e,target)){
      if(isFollowerTarget) applyFollowerDamage(g, target, e.dmg, e);
      else {
        const p = g.player;
        const rolling = !!p.dodging;
        playerDamage(g, e.dmg, e, null, true);
        if(rolling){
          p.riposteT = RIPOSTE_DUR;
          showMsg('Perfect Dodge!', 0.7);
          g.particles.push({type:'ring', x:p.x, y:p.y, t:0.3, max:0.3, r:40, color:'#ffe27a'});
        }
      }
    }
  }
  return true;
}

// knockback (v69, Wild Boar charge): an optional {x,y} displacement vector
// applied to the player's position when a hit actually lands (not on a
// block/dodge/invuln no-op) -- no such displacement mechanic existed
// before this, so it's a simple direct position offset, clamped back into
// the room's bounds the same way normal movement already is.
function playerDamage(g, amt, srcEnemy, knockback, canMiss){
  const p=g.player;
  if(srcEnemy) srcEnemy._barOn = true;   // v474: a boss's health bar appears once it attacks
  p.lastHitBy = srcEnemy||null;
  amt *= dmgVar();
  if(p.invuln>0 || p.dodging || p.vanishT>0) return;
  p.sinceHurt = 0;
  // Block roll: base (shield equipped) + Riposte + Defensive Stance, all
  // folded into blockChance()'s own overall cap (see its definition).
  if((p.blocking || p.rallyT>0) && Math.random()<blockChance(p)){
    showMsg('Blocked!', 0.5);
    g.particles.push({type:'burst', x:p.x, y:p.y, t:0.25, max:0.25, color:'#cdd8e6'});
    if(((p.skills && effectiveRank(p,'reckoning'))||0) > 0) p.reckonStore = Math.min(p.maxHp*RECKON_STORE_CAP, (p.reckonStore||0) + amt);   // v459 Reckoning stores the blocked force
    // v189 Riposte: a block feeds Rage and counter-strikes the attacker
    const fRank = (p.skills && effectiveRank(p,'riposte')) || 0;
    if(fRank>0){
      if(p.cls==='warrior') gainResource(p, RIPOSTE_RAGE_BASE + clamp(amt/Math.max(1,p.maxHp)*60, 0, RIPOSTE_RAGE_MAX_BONUS));   // bigger blocked hit = more Rage
      if(srcEnemy && srcEnemy.hp>0 && dist(p,srcEnemy) < srcEnemy.r+p.r+140){
        const cd = wpnDmg(p) * swd('riposte', fRank) * weaponDmgMult(p);
        srcEnemy.hp -= applyEnemyArmor(p, srcEnemy, cd); srcEnemy.hitT = 0.15;
        if(!srcEnemy.isBoss && !srcEnemy.isLairBoss && !srcEnemy.gj && !srcEnemy.trex) staggerEnemy(srcEnemy, STAGGER_DUR);
        g.particles.push({type:'burst', x:srcEnemy.x, y:srcEnemy.y, t:0.2, max:0.2, color:'#ffe9b0'});
      }
    }
    return;
  }
  { const sb = soulShieldBlock(p);   // v489 Soul Shield: the souls you hold turn blows aside
    if(sb>0 && Math.random()<sb){ showMsg('Blocked!', 0.5); g.particles.push({type:'burst', x:p.x, y:p.y-18, t:0.25, max:0.25, color:'#f4f0ff'}); return; } }
  { const pc = parryChance(p);
    if(pc>0 && Math.random()<pc){
      showMsg('Parried!', 0.5);
      p.riposteT = RIPOSTE_DUR;
      g.particles.push({type:'burst', x:p.x, y:p.y, t:0.25, max:0.25, color:'#ffe27a'});
      // v419: Riposte also works with Parry -- a parry counter-strikes and feeds Rage just like a shield block
      { const fRank = (p.skills && effectiveRank(p,'riposte')) || 0;
        if(fRank>0){
          gainResource(p, RIPOSTE_RAGE_BASE + clamp(amt/Math.max(1,p.maxHp)*60, 0, RIPOSTE_RAGE_MAX_BONUS));
          if(srcEnemy && srcEnemy.hp>0 && dist(p,srcEnemy) < srcEnemy.r+p.r+140){
            const cd = wpnDmg(p) * swd('riposte', fRank) * weaponDmgMult(p);
            srcEnemy.hp -= applyEnemyArmor(p, srcEnemy, cd); srcEnemy.hitT = 0.15;
            if(!srcEnemy.isBoss && !srcEnemy.isLairBoss && !srcEnemy.gj && !srcEnemy.trex) staggerEnemy(srcEnemy, STAGGER_DUR);
            g.particles.push({type:'burst', x:srcEnemy.x, y:srcEnemy.y, t:0.2, max:0.2, color:'#ffe9b0'});
          }
        } }
      return;
    } }
  if(Math.random()<evasionChance(p)){
    showMsg('Dodged!', 0.5);
    g.particles.push({type:'burst', x:p.x, y:p.y, t:0.25, max:0.25, color:'#9ae6b4'});
    return;
  }
  // v346 Defense: ordinary (non-telegraphed, non-elemental) enemy swings and arrows must first hit; Defense lowers that chance
  if(canMiss && srcEnemy && (!srcEnemy.dmgType || srcEnemy.dmgType==='normal') && (Math.random() >= playerHitChance(p, monsterLevel(g)) || (srcEnemy.blindT>0 && Math.random() < JUDG_BLIND_MISS))){
    showMsg('Miss!', 0.5);
    g.particles.push({type:'burst', x:p.x, y:p.y, t:0.2, max:0.2, color:'#c9d4e0'});
    return;
  }
  if(knockback && g.room && !immovableActive(p)){
    p.x = clamp(p.x+knockback.x, p.r, g.room.w-p.r);
    p.y = clamp(p.y+knockback.y, p.r, g.room.h-p.r);
  }
  // Assault (Berserker skill): damage taken also ramps up over the duration
  let takenMult = 1;
  if(p.assaultT>0){
    const durMax = p.assaultDurMax||1;
    const frac = clamp(1 - p.assaultT/durMax, 0, 1);
    takenMult = 1 + ASSAULT_TAKEN_MAX*frac;
  }
  // Defensive Stance: extra flat Damage Reduction while a shield is equipped.
  takenMult *= (1 - defensiveStanceDamageReduction(p));
  // Iron Skin Rank 5: flat +5% Damage Reduction, a separate stat from the
  // Armor/Defense % it grants at every rank (see ironSkinDefensePct, which
  // scales p.armor instead, in recalcStats).
  takenMult *= (1 - ironSkinDamageReduction(p));
  // v187 Warrior: Unbreakable roar, plus a built-in bonus for fighting while surrounded
  takenMult *= (1 - unbreakableLowDr(p));   // v266: Unbreakable passive (below 35% life)
  if(p.inAegis) takenMult *= (1 - bannerAegisDr(p));
  // v431: the warrior surround damage-reduction bonus was removed
  // Rallying Cry (Templar capstone): temporary Defense buff, while active.
  takenMult *= (1 - rallyDefenseReduction(p));
  // v83 Sturdy (shield prefix, +Damage Reduction %) and Elemental
  // Attunement (ring/amulet suffix, +All Resistances %) -- both fold into
  // this same takenMult chain as one more multiplicative reduction, same
  // slot every existing %-damage-reduction source above already uses.
  takenMult *= (1 - (p.itemDmgReductionPct||0));
  takenMult = Math.max(takenMult, 1 - DMG_REDUCTION_CAP);   // total damage reduction is capped at 50%
  if(p.guardianT>0) takenMult *= GUARDIAN_TAKEN;   // v266: Guardian
  // (v124) Damage types: normal hits are stopped by armor (Defence Rating) + evasion/block; elemental
  // hits (fire/cold/lightning/poison) ignore armor and are reduced by that element's resist (max 75%).
  const dtype = (srcEnemy && srcEnemy.dmgType) || 'normal';
  const isElemental = dtype!=='normal';
  const dsplit = srcEnemy && srcEnemy.dmgSplit;
  if(dsplit){ const a = isElemental ? (1 - elementResist(p, dtype)/100) : 1; takenMult *= 0.5*a + 0.5*(1 - elementResist(p, dsplit)/100); }   // v484: 50/50 split
  else if(isElemental) takenMult *= (1 - elementResist(p, dtype)/100);
  const isPoison = dtype==='poison';
  // v346: Defense no longer subtracts damage -- it only decides whether the hit lands (see above)
  let reduced = Math.max(1, Math.round(amt * takenMult));
  if(dtype==='lightning') reduced = Math.max(1, Math.round(lightningCharge(g, p, reduced, 'player')));
  const dotBase = reduced;
  // Ice Armor barrier soaks the hit (whatever type) until spent; overflow carries through.
  if(reduced>0) p.iaSince = 0;   // v442: any landed hit restarts the Ice Armor recharge timer
  if(p.iceArmorHp>0){
    const soak = Math.min(p.iceArmorHp, reduced);
    p.iceArmorHp -= soak; reduced -= soak;
    g.particles.push({type:'burst', x:p.x, y:p.y, t:0.2, max:0.2, color:'#bfeaff'});
    if(p.iceArmorHp<=0){ p.iceArmorHp = 0; p.iceArmorT = 0; g.particles.push({type:'burst', x:p.x, y:p.y, t:0.4, max:0.4, color:'#e6f8ff'}); showMsg('Ice Armor broken', 0.8); }
  }
  if(p.recallShield>0 && reduced>0){   // v267 Recall: a short absorb shield
    const rsk = Math.min(p.recallShield, reduced); p.recallShield -= rsk; reduced -= rsk;
    g.particles.push({type:'burst', x:p.x, y:p.y, t:0.2, max:0.2, color:'#9fe07a'});
  }
  if(uq(p,'uq_defender') && !(p.uqCd>0) && p.hp - reduced <= 0){   // v383 Undying Bastion: Last Stand
    p.hp = Math.max(1, Math.ceil(p.maxHp*0.4)); p.invuln = Math.max(p.invuln||0, 3); p.uqCd = 90; p.hitFlash = 0.25;
    showMsg('Last Stand!', 1.6, '#f2a31b'); sfxPlay('banner', 0.8);
    g.particles.push({type:'ring', x:p.x, y:p.y, t:0.6, max:0.6, r:110, color:'#f2a31b'}); g.particles.push({type:'burst', x:p.x, y:p.y, t:0.5, max:0.5, color:'#ffd27a'});
    return;
  }
  p.hp -= reduced;
  if(p.bulwarkT>0) p.bulwarkStore = (p.bulwarkStore||0) + reduced;   // v266: Bulwark stores the damage
  if(p.guardianT>0 && srcEnemy && srcEnemy.hp>0 && srcEnemy.hp!==undefined){ srcEnemy.hp -= amt*0.6 + (p.armor||0)*0.8; srcEnemy.hitT = 0.15; g.particles.push({type:'burst', x:srcEnemy.x, y:srcEnemy.y, t:0.25, max:0.25, color:'#f0d078'}); }
  if(p.cls==='warrior') gainResource(p, Math.min(RAGE_ON_HURT_MAX, 2 + reduced/Math.max(1,p.maxHp)*40) * (1 + UNBREAK_HURT_RAGE*rk266(p,'unbreakable')));
  p.hitFlash = 0.25;
  if(isPoison) g.particles.push({type:'burst', x:p.x, y:p.y, t:0.3, max:0.3, color:'#7dd45a'});
  // Combat feel (v104): taking a hit shakes the screen and briefly freezes
  // the action, scaled a little by how big the hit was relative to max HP.
  const hurtFrac = clamp(reduced/Math.max(1,p.maxHp), 0, 0.5);
  shakeScreen(g, 3 + hurtFrac*14, 0.2);
  hitStop(g, 0.04 + hurtFrac*0.1);
  // Dark Crypt Vampire (v73): life-drain -- every point of damage a Vampire
  // actually lands on the player heals it for VAMPIRE_LIFESTEAL_PCT of that
  // amount (judgment call: 75%, the middle of the brief's suggested
  // 50-100% range -- high enough to feel like a real "don't let this fight
  // drag on" threat without being a literally unkillable full-heal-per-hit
  // sponge). Capped at maxHp like any other heal.
  if(srcEnemy && srcEnemy.type==='vampire'){
    srcEnemy.hp = Math.min(srcEnemy.maxHp, srcEnemy.hp + reduced*VAMPIRE_LIFESTEAL_PCT);
  }
  if(srcEnemy && srcEnemy.vamp) srcEnemy.hp = Math.min(srcEnemy.maxHp, srcEnemy.hp + reduced*0.6);
  p._chillOk = srcEnemy ? (Math.random() < coldChillChance(p)) : true;   // v365: one chill roll per hit, shared by Cold Enchanted and other cold attackers
  if(srcEnemy && srcEnemy.chillHit && !p.slowImmune && p._chillOk) p.webSlowT = Math.max(p.webSlowT||0, 1.0*(1-0.5*coldChillFrac(p)));
  if(srcEnemy) applyStatusToPlayer(p, srcEnemy, dotBase);
  if(srcEnemy && srcEnemy.manaBurn && p.cls==='mystic') p.mp = Math.max(0, (p.mp||0) - (p.maxMp||0)*0.08);
  // Black Marsh Anaconda: its coiling bite slows movement briefly (same slow as spider webs).
  if(srcEnemy && (srcEnemy.type==='anaconda' || srcEnemy.type==='sandsnake') && !p.slowImmune) p.webSlowT = Math.max(p.webSlowT||0, 1.3);
  // v455 Aura of Retribution: an attacker takes a share of the damage it just dealt
  if(srcEnemy && srcEnemy.hp>0 && p.cls==='warrior'){
    const arR = (p.skills && effectiveRank(p,'auraOfRetribution'))||0;
    if(arR>0){
      const back = Math.max(1, Math.round(amt*retributionPct(arR)));
      srcEnemy.hp -= back; srcEnemy.hitT = 0.15;
      try{ spawnDmgNumber(g, srcEnemy, back, false, {col:'#ffe08a', small:1}); }catch(e){}
      g.particles.push({type:'burst', x:srcEnemy.x, y:srcEnemy.y, t:0.25, max:0.25, color:'#ffd56a'});
    }
  }
  // ...and every point of damage taken is reflected straight back onto the attacker.
  if(p.assaultT>0 && srcEnemy){
    srcEnemy.hp -= reduced;
    srcEnemy.hitT = 0.15;
    g.particles.push({type:'burst', x:srcEnemy.x, y:srcEnemy.y, t:0.25, max:0.25, color:'#e2382f'});
  }
  // v83 Studded (+Thorns): a brand-new reflect-damage-on-being-hit
  // mechanic (none existed before this) -- a flat amount of damage is
  // reflected onto whatever actually landed the hit, independent of
  // Assault's own separate (and much larger) full-damage reflection just
  // above. Only fires when there's an actual attacker to reflect onto
  // (srcEnemy is null for some non-enemy damage sources, e.g. environmental
  // hazards) and the hit wasn't already blocked/dodged (this code only
  // runs once those early-return checks above have already passed).
  if((p.thornDamage>0 || p.thornPct>0) && srcEnemy){
    srcEnemy.hp -= (p.thornDamage||0) + (p.thornPct>0 ? amt*p.thornPct/100 : 0);
    srcEnemy.hitT = 0.15;
    g.particles.push({type:'burst', x:srcEnemy.x, y:srcEnemy.y, t:0.2, max:0.2, color:'#9a6a4a'});
  }
  if(p.hp<=0){ if(!unbreakableSave(g, p)){ p.hp=0; endGame(g); } }
}

function shatterIceArmor(g, p){
  const r = (p.skills && effectiveRank(p,'iceArmor'))||1;
  const dmg = iceArmorExplodeDmg(p, r);   // read BEFORE the barrier is emptied
  p.iceArmorHp = 0; p.iceArmorT = 0; p.iaSince = 0;
  const R = ICE_ARMOR_EXPLODE_RADIUS*aoeRadiusMult(p);
  for(const e of g.enemies){
    if(e.hp>0 && dist(p,e) < R+e.r){
      e.hp -= applyEnemyArmor(p, e, dmg, 0, "cold"); e.hitT = 0.15; e.chillT = Math.max(e.chillT||0, 2.5);
      coldHit(e, 12);   // freezes anything that can be frozen (elites/brutes included); bosses are chilled
      checkExecute(g, e);
    }
  }
  showMsg('Ice Armor explodes!', 0.9);
  g.particles.push({type:'iceBlast', x:p.x, y:p.y, t:0.75, max:0.75, r:R, seed:Math.random()*100});
  try{ sfxPlay('ice', 1); }catch(e){}
  g.particles.push({type:'ring', x:p.x, y:p.y, t:0.45, max:0.45, r:R, color:'#bfeaff'});
  g.particles.push({type:'burst', x:p.x, y:p.y, t:0.5, max:0.5, color:'#e6f8ff'});
}

// (v147) Drop any channelled/ground skill effects (Pyro Torrent beam, Blizzard/Plague zones, aim stick).
function clearSkillEffects(g, p){
  if(p){ p.pyroTorrentT = 0; p.meteorFx = []; p.stormcalls = []; p.blizzardZone = null; p.vortex = null; p.permaZone = null; p.fbQueue = []; p.plagueZone = null; g.soulGate = null; g.gateArchers = []; p.hurricaneT = 0; p.survPoisonClouds = []; p.survPoisonCloud = null; p.fieldDressing2 = false; p.vanishEvaT = 0; p.aimShotHold = false; p.trapGcd = 0; }
  if(g){ g.thrownTraps = []; g.traps = []; g.mirage = null; }
  if(g && g.particles) g.particles = g.particles.filter(pt=>pt.type!=='beam' && pt.type!=='zone' && pt.type!=='iceshard' && pt.type!=='frostzone' && pt.type!=='vortex');
  try{ setAimStickVisible(false); }catch(e){}
}
function endGame(g){
  clearSkillEffects(g, g.player);
  if(!g.over){
    g.player.deaths = (g.player.deaths||0) + 1;
    try{ localStorage.setItem('rf_deaths', String(window.__rfDeathsTotal()+1)); }catch(e){}
    try{ showTotalDeaths(); }catch(e){}
    try{ saveGame(); }catch(e){}
  }
  g.over = true;
  document.getElementById('deadDepth').textContent = g.player.deaths;
  document.getElementById('deadLevel').textContent = g.player.level;
  document.getElementById('deadGold').textContent = g.player.gold;
  document.getElementById('deadBest').textContent = 'Total deaths (all characters): '+window.__rfDeathsTotal();
  document.getElementById('overlay').style.display='flex';
}

// Shared "head back to Town" logic. Dying wipes gold (returnToTown); choosing
// it voluntarily from a cleared level's portal keeps everything (goToTownSafe).
function goToTown(opts){
  opts = opts || {};
  const g = game, p = g.player;
  g.over = false; clearSkillEffects(g, p);
  joyEnd(); mouseDown=false;
  g.scene = 'town';
  g.town = makeTown(p.level);
  g.room = g.town;
  if(opts.wipeGold) p.gold = 0;
  // Dying still fully revives you on the way back to town -- that's the
  // respawn mechanic. Any other return to town (from the Forest, or from
  // a boss-floor portal) no longer auto-heals; healing now only happens
  // at the well/fountain.
  if(opts.wipeGold){ p.hp = p.maxHp; p.mp = (p.cls==='warrior' ? 0 : p.maxMp); resetCooldownsOnDeath(p); }   // v205: a Warrior's Rage resets to zero on death
  if(opts.nearMinePortal){
    // Returning from a boss-floor clear: land beside the Town waypoint --
    // as of v66 it's the sole way back down to the Mine (the old
    // standalone Mine portal landmark this used to land beside was
    // removed), same treatment as the nearWaypoint case just below.
    p.x = g.town.waypoint.x; p.y = g.town.waypoint.y + 40;
  } else if(opts.nearForestGate){
    // Coming back from the Dark Forest: land beside the gate that leads
    // back out to it, not the original login/first-visit spawn point.
    p.x = g.town.gate.x - 60; p.y = g.town.gate.y;
  } else if(opts.nearWaypoint){
    // Teleporting in via the Mountain Pass waypoint: land beside Town's
    // own waypoint, the same "arrive next to the matching landmark"
    // treatment the other entry points above get.
    p.x = g.town.waypoint.x; p.y = g.town.waypoint.y + 40;
  } else if(opts.nearTavernDoor){
    // Coming back out of the Tavern interior: land just below its own
    // door, same "arrive next to the door you came from" convention.
    p.x = g.town.tavernDoor.x; p.y = g.town.tavernDoor.y + 40;
  } else {
    p.x = g.town.spawn.x; p.y = g.town.spawn.y;
  }
  p.dodging = false; p.dodgeT = 0; p.invuln = 0; p.hitFlash = 0; p.movementStopT = 0;
  p.blocking = false; p.guardianT = 0; p.juggT = 0; p.juggWindT = 0;
  p.whirlwindT = 0; p.whirlwindCd = 0; p.assaultT = 0; p.assaultCd = 0; p.leapT = 0; p.leapCd = 0; p.unbreakT = 0; p.unbreakCd = 0;
  p.rallyT = 0; p.rallyCd = 0;
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  // v86: used to hard-clear g.followers=[] and never rebuild it in Town --
  // that's WHY companions used to vanish the moment the player stepped
  // through the Town gate (see updateFollowersAI's new Town-support
  // comment). Now reset+rebuild fresh, exactly like every other zone
  // transition (Forest/Mountain Pass/dungeon floors, etc.) already does --
  // ensureFollowers respawns each currently-ranked/summoned companion kind
  // right at the player's side.
  g.followers = [];
  ensureFollowers(g);
  document.getElementById('overlay').style.display='none';
  document.getElementById('buttons').style.display = 'none';
  // v86: the active-skill loadout cluster (Main/Slot1/2/3 + Dodge) now
  // stays VISIBLE in Town too, instead of being hidden -- pressing one is
  // functionally inert there (see triggerSkillSlot/onAttackDown/the Dodge
  // handler's new "I cannot do that here" gate), so hiding the buttons
  // entirely is no longer necessary and would just look like a bug (the
  // buttons disappearing) rather than a deliberate "can't fight here" cue.
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
  updatePortalChoice(false);
  showMsg('Back in Mistfall', 1.4);
  saveGame();
}
// Death sends you back to Town with your level and gear intact -- only
// your gold is wiped. This is the only death/respawn path now; a truly
// fresh character is only created from the class-select screen.
// (v147) Dying resets every cooldown, whichever respawn you pick.
function resetCooldownsOnDeath(p){
  for(const k of Object.keys(p)){ if(/Cd$/.test(k) && typeof p[k]==='number') p[k] = 0; }
  p.aoeGcd = 0; p.atkCd = 0; p.dodgeCd = 0;
  try{ p.dodgeCharges = dodgeMaxCharges(p); }catch(e){}
  p.iceArmorHp = 0; p.iceArmorT = 0; p.iaSince = 99; clearSkillEffects(game, p);
  p.webSlowT = 0; p.movementStopT = 0;
  // v447: no ailment survives a respawn
  for(const k of ['burnT','burnDps','poisonT','poisonDps','chillT','bleedT','bleedDps','selfBurnT','_burnT','stunT','frozenT','charges','chgT','shockT','shockDps']) if(p[k]) p[k] = 0;
}
function returnToTown(){ goToTown({wipeGold:true}); }
// (v147) Respawn where you died: the region is NOT refreshed (enemies, and any boss's health, stay as they were).
// You come back at the spot you entered the region, with full HP/mana, a few seconds of protection, and the same
// gold penalty as dying always had.
// v172: inside a dungeon, "respawn in region" returns you to the nearest reached waypoint of that dungeon,
// or just inside the dungeon's entrance when none has been reached (or the waypoint lies deeper than you).
function dungeonRespawn(g, p){
  g._bossBarReset = true;
  const mf = multiFloorInfo(g);
  const isCrypt = g.scene==='darkcrypt';
  if(!mf && !isCrypt) return;
  const cur = mf ? mf.floor : 1;
  if(isCrypt){
    // v310: dying in the Defiler's Tomb (or mid-fight with the Defiler / Wraith Lord) brings you back just outside the tomb door
    { const TR = g.crypt && g.crypt.tombRoom;
      const dp = g._deathPos || p;
      const inTomb = !!(TR && dp.x>TR.x && dp.x<TR.x+TR.w && dp.y>TR.y && dp.y<TR.y+TR.h);
      if(g.crypt && g.crypt.hallDoor && (inTomb || g.enemies.some(e=>(e.defiler||e.wraith) && e.hp>0))){ p.x = g.crypt.hallDoor.x; p.y = g.crypt.hallDoor.y + 85; return; } }
    if(p.reachedDarkCrypt && g.room && g.room.waypoint){ p.x = g.room.waypoint.x; p.y = g.room.waypoint.y + 45; } return; }
  if(mf.key==='rlair' && cur===2 && g.rlair && g.rlair.entrance){   // v490: wake just inside the Ember Den, and the Flame Raptor goes back to the middle of its arena, calm again
    const R = g.rlair; p.x = R.entrance.x + 70; p.y = R.entrance.y;
    for(const e of g.enemies) if(e.lr && e.hp>0){ e.x = R.bossSpot.x - 380; e.y = R.bossSpot.y; e.lrAwake = false; e.lrCalm = true; e.lastAttackedT = 0; e.lrState = 'chase'; e.lrT = 0; e.lrCd = 2.0; e.windT = 0; e.moving = false; }
    g.projectiles = []; return;
  }
  let wpFloor = 0;
  if(mf.key==='lh' && p.reachedLighthouseTower) wpFloor = 1;
  else if(mf.key==='ruins' && p.reachedAncientRuins) wpFloor = 2;
  const useWp = wpFloor>0 && cur>=wpFloor;
  let target = useWp ? wpFloor : 1;
  if(mf.key==='fht'){   // v355: dying in the Frosthold Tower puts you back on the floor below (the Commander's room -> floor 4)
    target = Math.max(1, cur-1);
    if(target!==cur && g.fhtStore){ for(const e of g.enemies) if(e.fhCmd){ e.cState='chase'; e.cT=0; e.windT=0; e.moving=false; } g.fhtStore[cur] = g.enemies; }
  }
  let byStairs = false;
  if((mf.key==='lh' || mf.key==='ft') && cur>1){ target = cur-1; byStairs = true; }   // v453: die on a tower floor -> wake on the floor below, right by the stairs up to it
  if(target===cur){
    const room = g.room;
    if(useWp && room.waypoint){ p.x = room.waypoint.x; p.y = room.waypoint.y + 40; }
    else if(room.entrance && (mf.key==='fht'||mf.key==='lh'||mf.key==='ft')){ p.x = room.entrance.x + (room.entrance.x < room.w/2 ? 70 : -70); p.y = room.entrance.y; }
    return;
  }
  const wp = useWp ? {atWaypoint:true} : undefined;
  if(mf.key==='fht') enterFhTower(target, {fromBelow:true});
  else if(mf.key==='lh') enterLighthouseTower(target, byStairs ? {fromAbove:true} : wp);
  else if(mf.key==='ft') enterForgottenTower(target, byStairs ? {fromAbove:true} : undefined);
  else if(mf.key==='ruins') enterAncientRuins(target, wp);
  else if(mf.key==='rlair') enterRaptorLair(target);
}
function respawnInRegion(){
  const g = game, p = g.player;
  g._bossBarReset = true;   // v474: back from the dead, boss bars hide again until the fight resumes
  g.over = false;
  joyEnd(); mouseDown = false;
  // (v163) the gold you lose stays behind as a big coin where you fell -- walk over it to take it back
  const inBreach = !!(g.scene==='lighthouse' && g.tower && g.tower.subzone==='keep' && g.tower.kpArea===9);
  if(p.gold>0 && !inBreach){ g.loot = (g.loot||[]).filter(l=>!l.deathCoin); g.loot.push({type:'gold', x:p.x, y:p.y, r:26, amt:p.gold, deathCoin:true, dropGrace:0}); }
  if(!inBreach) p.gold = 0;
  p.hp = p.maxHp; p.mp = (p.cls==='warrior' ? 0 : p.maxMp);   // v205: Rage resets to zero on death
  resetCooldownsOnDeath(p);
  p.dodging = false; p.dodgeT = 0; p.invuln = 3; p.hitFlash = 0;
  p.blocking = false; p.guardianT = 0; p.juggT = 0; p.juggWindT = 0; p.whirlwindT = 0; p.assaultT = 0; p.rallyT = 0; p.vanishT = 0; p.vanishEvaT = 0; p.vanishWas = false; p.leapT = 0; p.unbreakT = 0;
  if(inBreach){   // v398: the Breach throws you back to the start of this five-floor stretch (your gold is safe)
    g.projectiles = []; g.particles = []; document.getElementById('overlay').style.display = 'none';
    const f = brCheckpoint(p); enterKeep(9, {bf:f, seed:(Date.now()%100000)});
    showMsg('The breach spits you back out. Floor '+f, 2.6, '#ff9a6a');
    return;
  }
  // v172: a boss you die to keeps its progress -- but never more than half its life is ever taken back for you
  for(const e of g.enemies){
    if(e.hp>0 && !e.colossus && (e.isBoss||e.isLairBoss||e.lr||e.rev||e.lvBoss||e.mastodon||e.prot||e.balrog||e.bkBoss||e.type==='boss') && e.hp < e.maxHp*0.5) e.hp = e.maxHp*0.5;
  }
  // v352: the Molten Colossus keeps the damage you dealt when you die to it -- it only resets its position, attacks and arena
  for(const e of g.enemies) if(e.colossus && e.hp>0){
    const keepArmor = e.armorBase;
    e.hitT = 0; e.x = HEART_CX+260; e.y = HEART_CY; e.r = e.baseR||e.r;
    initColossus(e); e.armorBase = keepArmor||0; e.armor = e.armorBase;
    const fr = e.hp/e.maxHp;
    e.cPhase = fr<0.33 ? 3 : fr<0.66 ? 2 : 1;
    e.cCata = fr<0.05 ? 2 : fr<0.12 ? 1 : 0;
    if(g.room) g.room.lavaInset = 0;
  }
  if(g.room && g.room.deep===3) g.enemies = g.enemies.filter(x=>!x.colAdd);
  // v490: dying mid-trial at the Mountain Top Shrine resets it -- the Protectors sink back and the runestone returns to you
  if(g.scene==='icyzone' && g.iz && g.iz.kind==='shrine' && (p.shrineStage||0)===1){
    g.enemies = g.enemies.filter(e=>!e.prot); g.iz.protectorsSpawned = false; g.iz.protectorsDown = false; p.shrineStage = 0;
    if(!findRunestone(p)) forceAddToBag(p, makeTemplarRunestoneItem());
    setTimeout(()=>{ try{ showMsg('The Protectors sink back into the stone. Place the runestone at the shrine to try again.', 4.0, '#9fe0ff'); }catch(e){} }, 600);
    saveGame();
  }
  let sp = (g.room && g.room.entrySpawn) || g.regionSpawn || (g.room && g.room.entranceSpot) || {x:p.x, y:p.y};
  if(g.room && g.room.w && (sp.x<0 || sp.y<0 || sp.x>g.room.w || sp.y>g.room.h)) sp = g.room.entranceSpot || {x:p.x, y:p.y};   // v283: never respawn off the map
  g._deathPos = {x:p.x, y:p.y};
  p.x = sp.x; p.y = sp.y; p.crX = undefined;   // v281: terrain-step tracking must forget the death spot or the height-field zones snap you back to it
  if(g.scene==='darkcrypt' || multiFloorInfo(g)){ try{ dungeonRespawn(g, p); }catch(err){ console.error('dungeonRespawn', err); } }   // v321: Dark Crypt -- boss fight / tomb deaths come back just outside the boss door, otherwise at the waypoint (this was never wired in before)
  g.projectiles = g.projectiles.filter(pr=>pr.from==='player'); g.particles = [];
  g.followers = []; ensureFollowers(g);
  for(const f of g.followers){ f.x = p.x; f.y = p.y; }
  document.getElementById('overlay').style.display = 'none';
  showMsg('You return to the fight', 1.4);
}
// Voluntarily heading back to Town from a cleared level's portal keeps
// everything, gold included.
function goToTownSafe(){ goToTown({wipeGold:false}); }
// Same as goToTownSafe, but used for the boss-floor "Return to Town" choice
// specifically, so the player lands next to the Mine return portal.
function goToTownFromBoss(){ goToTown({wipeGold:false, nearMinePortal:true}); }
// Used for the Dark Forest's own gate back to Town, so the player lands
// beside that gate rather than the original login spawn point.
function goToTownFromForest(){ goToTown({wipeGold:false, nearForestGate:true}); }
// Used for the Tavern interior's own return trigger, so the player lands
// beside the Tavern's door rather than the original login spawn point --
// exact same convention as goToTownFromForest above.
function goToTownFromTavern(){ goToTown({wipeGold:false, nearTavernDoor:true}); }

