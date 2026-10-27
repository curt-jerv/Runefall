// ============================================================================
// v266 WARRIOR REDESIGN -- Berserker / Defender / Templar
//  * Berserker: Blood Harvest (globes), War Cry (stun + vulnerable), Bloodrage, Rampage, Assault finisher
//  * Defender: Shield Slam generates Rage, Unbreakable is a passive safety net, Bulwark (hold + shockwave),
//    Guardian (pull + reflect). Two-handers hit harder.
//  * Templar: Rage becomes Conviction. Smite/Wrath, Vengeance, Banners (one at a time, War <-> Aegis),
//    Consecrate, Judgment. Most of a Templar's damage comes from followers.
// ============================================================================
const TEMPLAR_IDS_V2 = ['squire','smite','vengeance','banner','bannerWar','bannerAegis','consecrate','judgment','sacredWeapon','auraOfRetribution'];
const DEFENDER_IDS_V2 = ['ironSkin','unbreakable','shieldBash','riposte','shieldThrow','mirrorSteel','seismicSlam','seismicAnchor','bulwark','guardian'];
const BERSERKER_IDS_V2 = ['reave','leap','weaponsSpecialist','bloodlust','bloodHarvest','battlecry','bloodrage','rampage','whirlwind','cleave','fury','assault'];
const OLD_WARRIOR_REFUND_IDS = ['ironSkin','unbreakable','shieldBash','riposte','shieldThrow','guardian','squire','offensiveStance','commander','templarDefensiveStance','battlecry','rally'];
const ISO_SQ2 = Math.SQRT2;
function skillRanksSum(p, ids){ let n = 0; if(p && p.skills) for(const id of ids) n += p.skills[id]||0; return n; }
// A warrior is "a Templar" when most of their points sit in the Templar tree.
function isTemplar(p){
  if(!p || p.cls!=='warrior') return false;
  const t = skillRanksSum(p, TEMPLAR_IDS_V2);
  return t>0 && t >= skillRanksSum(p, DEFENDER_IDS_V2) + skillRanksSum(p, BERSERKER_IDS_V2);
}
function isHeavyEnemy(e){ return !!(e.heavy || e.isBoss || e.isLairBoss || e.colossus || e.gj || e.trex || e.balrog || e.mastodon || e.kraken || e.lvBoss || e.prot); }
const rk266 = (p,id)=> (p && p.skills && effectiveRank(p,id)) || 0;

// ---------- Two-handers ----------
const TWOHAND_BASE_DMG_MULT = 1.15;   // every warrior two-hander (Longsword/Greatsword/Demonblade) hits 30% harder, before Weapon Specialization

// ---------- Berserker ----------
const BLOOD_HARVEST_PER_RANK = 0.04;   // v478: +4% more health potion drops per rank
function bloodHarvestRecovery(r){ return 0.10 + 0.025*(rkSpread5(Math.min(MAX_EFF_RANK,r))-1); }   // v344: fraction of faded Rage (as % of max life) returned out of combat: 10% at rank 1 -> 20% at rank 5
function bloodHarvestMult(p){ return 1 + BLOOD_HARVEST_PER_RANK*rk266(p,'bloodlust'); }
const REAVE_BLEED_DUR = 4;
function reaveBleedPct(r){ r = Math.max(1, r||1); return 0.15 + 0.025*(r-1); }   // bleed per second, as a share of the hit (60% total over 4s at Rank 1, 150% at Rank 10)
const WARCRY_RADIUS = 230, WARCRY_STUN = 0.8, WARCRY_STUN_STEP = 0.1, WARCRY_FEAR = 2, WARCRY_FEAR_STEP = 0.25, WARCRY_VULN = 0.10, WARCRY_VULN_STEP = 0.01, WARCRY_DUR = 6, WARCRY_DUR_STEP = 0.5, WARCRY_RAGE = 20;
const BLOODRAGE_COST_PCT = 0.10, BLOODRAGE_MIN_HP = 0.25, BLOODRAGE_RAGE = 60, BLOODRAGE_DMG = 0.20, BLOODRAGE_DMG_STEP = 0.02, BLOODRAGE_DUR = 6, BLOODRAGE_DUR_STEP = 0.5, BLOODRAGE_CD = 25;
function bloodrageMult(p){ if(!(p && p.bloodrageT>0)) return 1; return 1 + BLOODRAGE_DMG + BLOODRAGE_DMG_STEP*(Math.max(1,rk266(p,'bloodrage'))-1); }
// v324: Rampage -- kill stacks give attack speed (unchanged) AND bonus damage that scales with how full your Rage bar is (10% at a full bar at rank 1, 1% at a tenth of it)
function rampagePerStack(rank){ return 0.08 + 0.02*rank; }   // max bonus at a full Rage bar
const RAMPAGE_MAX = 10, RAMPAGE_WINDOW = 5;
function rampageSpeedPerStack(rank){ return 0.02 + 0.005*rkTop8(rank); }   // attack speed per kill stack
function rampageSpeed(p){ const r = rk266(p,'rampage'); if(r<=0 || !(p.rampageStacks>0)) return 0; return p.rampageStacks*rampageSpeedPerStack(r); }
function rampageBonus(p){ const r = rk266(p,'rampage'); if(r<=0 || !(p.maxMp>0)) return 0; return rampagePerStack(r) * Math.max(0, Math.min(1, (p.mp||0)/p.maxMp)); }
const ASSAULT_KILL_CDR = 0.7;
function assaultFinisher(g, p){
  const rank = rk266(p,'assault'); const rage = p.mp||0;
  if(rank<=0 || rage < 20) return;
  const R = 175*aoeRadiusMult(p);
  const dmg = wpnDmg(p) * swd('assault', rank) * (rage/20) * weaponDmgMult(p);
  for(const e of g.enemies){
    if(e.hp>0 && dist(p,e) < R+e.r){
      e.hp -= applyEnemyArmor(p, e, dmg); e.hitT = 0.15; checkExecute(g, e);
      const a = Math.atan2(e.y-p.y, e.x-p.x); if(!isHeavyEnemy(e)){ e.x += Math.cos(a)*30; e.y += Math.sin(a)*30; }
    }
  }
  p.mp = 0;
  showMsg('Rage Burst!', 0.9);
  shakeScreen(g, 6, 0.25);
  g.particles.push({type:'ring', x:p.x, y:p.y, t:0.45, max:0.45, r:R, color:'#e2382f'});
  g.particles.push({type:'burst', x:p.x, y:p.y, t:0.5, max:0.5, color:'#e2382f'});
}

// ---------- Defender ----------
const SLAM_RAGE_PER_TARGET = 3, SLAM_RAGE_STEP = 0.5,  SLAM_RAGE_TARGETS = 3, SLAM_KNOCK = 0.4, SLAM_DMG_MULT = 1.2;
const UNBREAK_LOW_HP = 0.35, UNBREAK_LOW_DR = 0.12, UNBREAK_LOW_DR_STEP = 0.03, UNBREAK_HURT_RAGE = 0.2, UNBREAK_SAVE_CD = 65, UNBREAK_SAVE_STEP = 6;
function unbreakableLowDr(p){
  const r = rk266(p,'unbreakable'); if(r<=0 || !(p.maxHp>0) || p.hp/p.maxHp >= UNBREAK_LOW_HP) return 0;
  return UNBREAK_LOW_DR + UNBREAK_LOW_DR_STEP*(r-1);
}
function unbreakableSave(g, p){
  const r = rk266(p,'unbreakable');
  if(r<=0 || p.unbreakSaveCd>0) return false;
  p.hp = Math.max(1, p.maxHp*0.2); p.invuln = Math.max(p.invuln||0, 1.5);
  p.unbreakSaveCd = UNBREAK_SAVE_CD - UNBREAK_SAVE_STEP*(r-1);
  showBigMsg('UNBREAKABLE', 'You refuse to fall', 1.8);
  g.particles.push({type:'ring', x:p.x, y:p.y, t:0.6, max:0.6, r:150, color:'#e8c05a'});
  g.particles.push({type:'burst', x:p.x, y:p.y, t:0.6, max:0.6, color:'#f4d27a'});
  return true;
}
// ---- v492 Defender: Mirror of Steel, Seismic Slam, Seismic Anchor (Reckoning and Immovable removed) ----
const SEISMIC_CD = 8, SEISMIC_R = 150;
const MIRROR_DUR_MIN = 2.5, MIRROR_DUR_MAX = 4, MIRROR_CD_MIN = 8, MIRROR_CD_MAX = 12, MIRROR_HEAL = 0.5;   // ranks 1 -> 10
const ANCHOR_CD_MIN = 6, ANCHOR_CD_MAX = 10, ANCHOR_DELAY = 1, ANCHOR_R = 150, ANCHOR_SLOW = 0.7, ANCHOR_SLOW_DUR = 3, ANCHOR_SLOW_CAP = 0.9;   // ANCHOR_R = 6 metres
function seismicStunDur(r){ return 1.0 + 0.06*(Math.max(1,r)-1); }
function defRankSpread(r){ return (Math.min(10,Math.max(1,r||1)) - 1)/9; }   // 0 at rank 1, 1 at rank 10
function mirrorDur(r){ return MIRROR_DUR_MIN + (MIRROR_DUR_MAX-MIRROR_DUR_MIN)*defRankSpread(r); }
function mirrorCd(r){ return MIRROR_CD_MAX + (MIRROR_CD_MIN-MIRROR_CD_MAX)*defRankSpread(r); }
function anchorCd(r){ return ANCHOR_CD_MAX + (ANCHOR_CD_MIN-ANCHOR_CD_MAX)*defRankSpread(r); }
function mirrorActive(p){ return !!(p && p.mirrorT>0); }
// enemies slowed by Seismic Anchor: the slow is at its peak and fades to nothing over ANCHOR_SLOW_DUR
function anchorSlowMult(e){ return e.anchorT>0 ? 1 - e.anchorSlow*clamp(e.anchorT/ANCHOR_SLOW_DUR, 0, 1) : 1; }
function castSeismicSlam(g, p, rank){
  if(!hasShieldEquipped(p)){ showMsg('Seismic Slam needs a shield', 0.9); return; }
  const R = SEISMIC_R*aoeRadiusMult(p), dmg = wpnDmg(p) * swd('seismicSlam', rank) * assaultDealtMult(p) * weaponDmgMult(p);
  for(const e of g.enemies){
    if(!(e.hp>0) || dist(p,e) > R+e.r) continue;
    e.hp -= applyEnemyArmor(p, e, dmg); e.hitT = 0.15; checkExecute(g, e);
    if(e.elite || e.isBoss || e.isLairBoss || isHeavyEnemy(e)) e.chillT = Math.max(e.chillT||0, 2.5);
    else { e.stunT = Math.max(e.stunT||0, seismicStunDur(rank)); e.windT = 0; }
  }
  p.seismicCdMax = applyCdr(p, SEISMIC_CD); p.seismicCd = p.seismicCdMax;
  p.bashAnimT = 0.35; p.bashAnimMax = 0.35;
  g.particles.push({type:'ring', x:p.x, y:p.y, t:0.5, max:0.5, r:R, color:'#c9a06a', exact:true});
  for(let k=0;k<10;k++){ const a = k/10*6.283; g.particles.push({type:'burst', x:p.x+Math.cos(a)*R*0.7, y:p.y+Math.sin(a)*R*0.7, t:0.4, max:0.4, color:'#a88a5a'}); }
  shakeScreen(g, 7, 0.3);
  showMsg('Seismic Slam!', 0.8);
}
// Seismic Anchor: a short delay, then the ground tears open where you stand
function castSeismicAnchor(g, p, rank){
  p.anchorPendT = ANCHOR_DELAY; p.anchorX = p.x; p.anchorY = p.y;
  p.bashAnimT = 0.3; p.bashAnimMax = 0.3;
  g.particles.push({type:'ring', x:p.x, y:p.y, t:ANCHOR_DELAY, max:ANCHOR_DELAY, r:ANCHOR_R*aoeRadiusMult(p)*0.4, color:'#c9a06a'});
  showMsg('Seismic Anchor...', 0.8);
}
function seismicAnchorResolve(g, p){
  const R = ANCHOR_R*aoeRadiusMult(p), rank = effectiveRank(p,'seismicAnchor')||1;
  for(const e of g.enemies){
    if(!(e.hp>0) || dist({x:p.anchorX,y:p.anchorY}, e) > R+e.r) continue;
    e.windT = 0;   // casting is broken
    if(!(e.isBoss || e.isLairBoss || isHeavyEnemy(e))){   // dragged in to the epicentre
      const a = Math.atan2(e.y-p.anchorY, e.x-p.anchorX), to = p.r + e.r + 4;
      e.x = p.anchorX + Math.cos(a)*to; e.y = p.anchorY + Math.sin(a)*to;
    }
    const cur = e.anchorT>0 ? e.anchorSlow*clamp(e.anchorT/ANCHOR_SLOW_DUR,0,1) : 0;   // stacking: adds on what is left
    e.anchorSlow = Math.min(ANCHOR_SLOW_CAP, cur + ANCHOR_SLOW); e.anchorT = ANCHOR_SLOW_DUR;
    e.hitT = Math.max(e.hitT||0, 0.1);
  }
  p.anchorCdMax = applyCdr(p, anchorCd(rank)); p.anchorCd = p.anchorCdMax;
  shakeScreen(g, 6, 0.3);
  g.particles.push({type:'ring', x:p.anchorX, y:p.anchorY, t:0.5, max:0.5, r:R, color:'#c9a06a', exact:true});
  for(let k=0;k<10;k++){ const a = k/10*6.283; g.particles.push({type:'burst', x:p.anchorX+Math.cos(a)*R*0.7, y:p.anchorY+Math.sin(a)*R*0.7, t:0.4, max:0.4, color:'#a88a5a'}); }
  showMsg('Seismic Anchor!', 0.8);
}
const BULWARK_DUR = 6, BULWARK_DUR_STEP = 0.5, BULWARK_CD = 18, BULWARK_SLOW = 0.5, BULWARK_ARMOR = 1.75, BULWARK_R = 172.5, BULWARK_REL = 0.8;
function bulwarkRelease(g, p){
  const stored = p.bulwarkStore||0;
  p.bulwarkT = 0; p.bulwarkStore = 0; p.unbreakT = 0;
  const R = BULWARK_R*aoeRadiusMult(p);
  const dmg = (10 + p.level*2 + (p.armor||0)*0.5) + stored*BULWARK_REL;
  const push = 90 + Math.min(170, stored/Math.max(1,p.maxHp)*600);
  for(const e of g.enemies){
    if(e.hp>0 && dist(p,e) < R+e.r){
      e.hp -= applyEnemyArmor(p, e, dmg); e.hitT = 0.15; checkExecute(g, e);
      if(!isHeavyEnemy(e)){
        const a = Math.atan2(e.y-p.y, e.x-p.x); e.x += Math.cos(a)*push; e.y += Math.sin(a)*push;
        e.stunT = Math.max(e.stunT||0, 0.5);
      }
    }
  }
  shakeScreen(g, 7, 0.3);
  g.particles.push({type:'ring', x:p.x, y:p.y, t:0.55, max:0.55, r:R, color:'#c3c8d2', exact:true});   // v337: gray ring grows out to the true blast radius
  g.particles.push({type:'burst', x:p.x, y:p.y, t:0.5, max:0.5, color:'#d8dce4'});
  showMsg('Bulwark released', 0.8);
}
// ---- v342: Juggernaut (replaces Guardian). Warcry, fill Rage, then run nonstop while the Rage drains. ----
const JUGG_WIND = 0.7, JUGG_SCALE = 1.05, JUGG_SPEED = 1.25, JUGG_HIT_GAP = 0.5, JUGG_KB = 45, JUGG_DMG_MULT = 2, JUGG_SPEED_PER_SEC = 0.01, JUGG_BURST_R = 170, JUGG_BURST_MULT = 1.5;   // ramp + burst are flat: no rank scaling
function juggDrain(r){ return Math.max(10, 15 - 1.25*(rkSpread5(Math.min(r||1,MAX_EFF_RANK))-1)); }   // Rage lost per second: 15 at rank 1 -> 10 at rank 5
function juggDef(r){ return 0.5 + 0.05*((r||1)-1); }                                        // +50% defence, +5% per rank
function juggDmgMult(r){ return JUGG_DMG_MULT*(1 + 0.1*((r||1)-1)); }                       // 2x Slam damage, +10% per rank
function juggEnd(g, p){
  p.juggT = 0; p.juggWindT = 0; p.juggTrail = null; p.mp = Math.max(0, p.mp||0);
  // final burst: 1.5x Slam damage around you, same at every rank
  const bd = wpnDmg(p) * swdX('guardian', p.juggRank||1) * assaultDealtMult(p);
  const R = JUGG_BURST_R*aoeRadiusMult(p);
  for(const e of g.enemies){
    if(e.hp>0 && dist(p,e) < R+e.r){
      e.hp -= applyEnemyArmor(p, e, bd); e.hitT = 0.15; checkExecute(g, e);
      if(!isHeavyEnemy(e)){ const a = Math.atan2(e.y-p.y, e.x-p.x); e.x += Math.cos(a)*60; e.y += Math.sin(a)*60; }
    }
  }
  shakeScreen(g, 6, 0.3);
  g.particles.push({type:'ring', x:p.x, y:p.y, t:0.55, max:0.55, r:R, color:'#ff9a60', exact:true});
  g.particles.push({type:'burst', x:p.x, y:p.y, t:0.5, max:0.5, color:'#ffb080'});
  showMsg('Juggernaut ends', 0.8);
}
function juggernautTick(g, p, dt){
  const rank = p.juggRank||1;
  if(p.juggWindT>0){
    p.juggWindT -= dt; p.movementStopT = Math.max(p.movementStopT||0, 0.05); p.moving = false;
    p.juggRingT = (p.juggRingT||0) - dt;
    if(p.juggRingT<=0){ p.juggRingT = 0.22; g.particles.push({type:'ring', x:p.x, y:p.y, t:0.5, max:0.5, r:150, color:'#ff7a50', exact:true}); }
    if(p.juggWindT<=0){
      p.juggWindT = 0; p.juggT = 1; p.movementStopT = 0;
      p.mp = p.maxMp||100; p.juggClock = 0; p.juggRun = (p.juggRun||0)+1; p.juggTrail = [];
      p.juggDir = {x:p.facing.x, y:p.facing.y};
      shakeScreen(g, 5, 0.3);
      g.particles.push({type:'burst', x:p.x, y:p.y, t:0.5, max:0.5, color:'#ffb080'});
    }
    return;
  }
  if(!(p.juggT>0)) return;
  p.juggClock = (p.juggClock||0) + dt;
  p.mp = Math.max(0, (p.mp||0) - juggDrain(rank)*dt);
  const trail = p.juggTrail || (p.juggTrail = []);
  trail.push({x:p.x, y:p.y, t:p.juggClock}); while(trail.length>14) trail.shift();
  const dmg = wpnDmg(p) * swd('guardian', rank) * assaultDealtMult(p);
  const dir = p.juggDir || p.facing;
  for(const e of g.enemies){
    if(!(e.hp>0)) continue;
    if(e._juggRun!==p.juggRun){ e._juggRun = p.juggRun; e._juggAt = -9; }   // v352: per-run hit timer (the clock restarts each run; a stale value used to block hits on bosses)
    if(dist(p,e) < p.r + e.r + 10 && p.juggClock - e._juggAt > JUGG_HIT_GAP){
      e._juggAt = p.juggClock;
      e.hp -= applyEnemyArmor(p, e, dmg); e.hitT = 0.15; checkExecute(g, e);
      if(!isHeavyEnemy(e)){ const a = Math.atan2(e.y-p.y, e.x-p.x); e.x += Math.cos(a)*JUGG_KB; e.y += Math.sin(a)*JUGG_KB; }
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.25, max:0.25, color:'#ffd0a0'});
    }
  }
  if(p.mp<=0) juggEnd(g, p);
}
const GUARDIAN_PULL_R = 360, GUARDIAN_TAKEN = 0.4, GUARDIAN_DUR_V2 = 4;

// ---------- Templar ----------
const TEMPLAR_PLAYER_DMG = 0.5;        // v470: with Commander, your own hits are lighter...
// v496: the Templar's own hits are no longer reduced while commanding followers (TEMPLAR_PLAYER_DMG / commanderBargain are unused)
function commanderBargain(p){ return !!(p && p.cls==='warrior' && p.skills && (p.skills.squire||0)>0); }
const TEMPLAR_FOLLOWER_BASE = 1.7;     // ...because their followers hit much harder
const COMMANDER_DMG_PER_RANK = 0.15;
const SMITE_RANGE = 360, SMITE_SPEED = 560, SMITE_R = 14, SMITE_PEN = 0.25, SMITE_HEAL = 0.08, WRATH_HEAL = 0.16, WRATH_MULT = 1.9, SMITE_CONV = 5, WRATH_CONV = 14, WRATH_EVERY = 3, WRATH_AOE_R = 95, WRATH_AOE_MULT = 0.6;
function smiteRankMult(rank){ return rank>0 ? 0.85 + 0.075*(rank-1) : 0.85; }   // 85% of a normal hit at rank 1, 115% at rank 5
const SACRED_EVERY = 3, SACRED_BURN_DUR = 3, SACRED_BURN_PCT = 0.4, SACRED_COST = 10;   // v489: costs 10 Conviction, burn doubled (was 20%/s)   // v455 Sacred Weapon: after 3 Vengeances, the 4th is empowered
function sacredBonus(r){ r = Math.max(1, r||1); return 0.5 + 0.1*(Math.min(10,r)-1) + 0.02*Math.max(0,r-10); }   // +50% damage -> +140% at Rank 10
const RETRIB_BASE = 0.10, RETRIB_MAX = 0.50;
function retributionPct(r){ r = r||0; return r<=0 ? 0 : Math.min(0.6, RETRIB_BASE + (RETRIB_MAX-RETRIB_BASE)*(Math.min(10,r)-1)/9 + 0.01*Math.max(0,r-10)); }
const VENG_OVERFLOW_AT = 0.8, VENG_OVERFLOW_COST = 5, VENG_OVERFLOW_DMG = 0.05;
const VENG_CD = 4, VENG_REACH = 74, VENG_ARC = 0.55, VENG_CONV = 9, VENG_BUFF_DUR = 3, VENG_FDMG = 0.20, VENG_FDMG_STEP = 0.04, VENG_FCRIT = 15, VENG_FCRIT_STEP = 2;
const BANNER_DUR = 30, BANNER_R = 130, BANNER_CD = 6, BANNER_CONV = 15;
const bannerDur = r=> BANNER_DUR + 2*(Math.max(1,r||1)-1);
const CONS_R = 130, CONS_DUR = 8, CONS_CD = 12, CONS_TICK = 0.5, CONS_CONV = 3, CONS_COST = 30;
const JUDG_COST = 60, JUDG_CD = 15, JUDG_TELE = 0.9, JUDG_R = 85, JUDG_RANGE = 460;
const FOLLOWER_CRIT_MULT = 1.6;
function bannerRk(p){ return Math.max(0, rk266(p,'banner')-1); }   // v328: Battle Standard ranks past the first strengthen BOTH standards
function bannerWarDmg(p){ return 0.10 + 0.03*rk266(p,'bannerWar') + 0.02*bannerRk(p); }
function bannerWarCrit(p){ return 5 + 2*rk266(p,'bannerWar') + 1*bannerRk(p); }
function bannerWarRage(p){ return 0.05 + 0.01*rk266(p,'bannerWar'); }   // v323: slightly faster Rage/Conviction gain inside the War standard
function bannerAegisDr(p){ return Math.min(0.5, 0.05 + 0.01*rk266(p,'bannerAegis')); }   // v328: toned down (was 10% +3%/rank)
function bannerAegisDef(p){ return 5 + 5*bannerRk(p); }   // % Defence while standing in the Aegis standard (Battle Standard ranks scale this)
function bannerAegisRegen(p){ return 0.010 + 0.003*rk266(p,'bannerAegis') + 0.002*bannerRk(p); }
function bannerOf(g){ const b = g && g.banner; return (b && b.room===g.room && b.t>0) ? b : null; }
function inBanner(g, ent, type){ const b = bannerOf(g); return !!b && b.type===type && dist(ent,b) < b.r; }
// Per-hit damage multiplier for a Squire follower (includes its own crit roll).
function templarFollowerMult(p, f){
  let m = 1;
  if(rk266(p,'squire')>0) m *= TEMPLAR_FOLLOWER_BASE * (1 + COMMANDER_DMG_PER_RANK*rk266(p,'squire'));   // v470: Commander's bargain (was any Templar)
  const g = game;
  let crit = 0;
  if(g && inBanner(g, f, 'war')){ m *= 1 + bannerWarDmg(p); crit += bannerWarCrit(p); }
  if(f.vengeT>0){ const vr = f.vengeRank||1; m *= 1 + VENG_FDMG + VENG_FDMG_STEP*(vr-1); crit += VENG_FCRIT + VENG_FCRIT_STEP*(vr-1); }
  if(f.consT>0){ m *= 1.2 + 0.04*(Math.max(1,rk266(p,'consecrate'))-1); }
  if(crit>0 && Math.random()*100 < crit) m *= FOLLOWER_CRIT_MULT;
  return m;
}
function persistFx(g, obj, fx){
  if(!fx) return;
  fx.t = fx.max;
  if(g.particles.indexOf(fx)<0) g.particles.push(fx);
}
function castSmite(g, p, rank){
  const target = nearestEnemy(g, p, SMITE_RANGE);
  const ang = target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y, p.facing.x);
  p.facing = {x:Math.cos(ang), y:Math.sin(ang)};
  p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
  p.atkAnimT = 0.22; p.atkAnimMax = 0.22;
  p.smiteN = (p.smiteN||0) + 1;
  const wrath = (p.smiteN % WRATH_EVERY)===0;
  const isCrit = Math.random()*100 < (p.critChance||0);
  let dmg = wpnDmg(p) * swd('smite', rank) * assaultDealtMult(p) * weaponDmgMult(p) * (wrath ? WRATH_MULT : 1);
  if(isCrit) dmg *= critMultOf(p);
  (g.smites || (g.smites = [])).push({x:p.x+Math.cos(ang)*18, y:p.y+Math.sin(ang)*18, vx:Math.cos(ang)*SMITE_SPEED, vy:Math.sin(ang)*SMITE_SPEED,
    dist:0, max:SMITE_RANGE + (wrath?80:0), r:wrath?26:SMITE_R, dmg, crit:isCrit, wrath, hits:[], healed:[], conv:false, rank, room:g.room});
  if(wrath){ showMsg('Wrath!', 0.5); }
}
function updateSmites(g, dt){
  const list = g.smites; if(!list || !list.length) return;
  const p = g.player;
  for(let i=list.length-1;i>=0;i--){
    const s = list[i];
    if(s.room!==g.room){ list.splice(i,1); continue; }
    const sx = s.vx*dt, sy = s.vy*dt;
    s.x += sx; s.y += sy; s.dist += Math.hypot(sx,sy);
    g.particles.push({type:'smiteFx', x:s.x, y:s.y, t:0.22, max:0.22, wrath:s.wrath});
    for(const e of g.enemies){
      if(e.hp<=0 || s.hits.indexOf(e)>=0) continue;
      if(dist(s,e) < s.r+e.r){
        s.hits.push(e);
        lastHitCrit = s.crit;
        e.hp -= splitHit(p, e, s.dmg, 0.5, 'fire', SMITE_PEN); e.hitT = 0.15;
        lastHitCrit = false;
        checkExecute(g, e);
        g.particles.push({type:'burst', x:e.x, y:e.y, t:0.25, max:0.25, color:'#ffe9a0'});
        if(!s.conv){ s.conv = true; gainResource(p, s.wrath ? WRATH_CONV : SMITE_CONV); }
        if(s.wrath){   // Wrath bursts: a small blast around the struck foe
          const aoeR = WRATH_AOE_R * aoeRadiusMult(p);
          for(const o of g.enemies){
            if(o===e || o.hp<=0 || dist(o,e) > aoeR+o.r) continue;
            o.hp -= splitHit(p, o, s.dmg*WRATH_AOE_MULT, 0.5, 'fire', SMITE_PEN); o.hitT = 0.15; checkExecute(g, o);
            g.particles.push({type:'burst', x:o.x, y:o.y, t:0.25, max:0.25, color:'#ffe9a0'});
          }
          g.particles.push({type:'ring', x:e.x, y:e.y, t:0.3, max:0.3, r:aoeR, color:'#ffe9a0'});
        }
        s.dist = s.max;   // the bolt stops at the first foe it hits
        break;
      }
    }
    if(g.followers) for(const f of g.followers){
      if(s.healed.indexOf(f)>=0) continue;
      if(dist(s,f) < s.r+f.r+8){
        s.healed.push(f);
        f.hp = Math.min(f.maxHp, f.hp + f.maxHp*(s.wrath ? WRATH_HEAL : SMITE_HEAL)*(1+0.1*(s.rank-1)));
        g.particles.push({type:'burst', x:f.x, y:f.y, t:0.3, max:0.3, color:'#9af0a8'});
      }
    }
    if(s.dist >= s.max) list.splice(i,1);
  }
}
function placeBanner(g, p, rank){
  const type = p.bannerNext || 'war';
  const old = g.banner; if(old && old.fx) old.fx.t = 0;
  const dur = skDur(p, bannerDur(rank));
  const r = BANNER_R * aoeRadiusMult(p);   // v324: same size as Consecrate
  g.banner = {x:p.x, y:p.y, type, t:dur, tMax:dur, r, room:g.room, fx:{type:'bannerFx', x:p.x, y:p.y, t:1, max:1, r, btype:type}};
  g.particles.push(g.banner.fx);
  p.bannerNext = type==='war' ? 'aegis' : 'war';
  p.bannerCdMax = applyCdr(p, BANNER_CD); p.bannerCd = p.bannerCdMax;
  gainResource(p, BANNER_CONV);
  showMsg(type==='war' ? 'Standard of War' : 'Standard of Aegis', 1.0, type==='war' ? '#ff9a7a' : '#9fd0ff');
  g.particles.push({type:'burst', x:p.x, y:p.y, t:0.4, max:0.4, color:type==='war' ? '#e2503a' : '#6fb4ff'});
}
function castConsecrate(g, p, rank){
  if((p.mp||0) < CONS_COST){ noResourceMsg(p, 'consecrate'); return false; }
  p.mp = Math.max(0, p.mp - CONS_COST);
  const old = g.consecrate; if(old && old.fx) old.fx.t = 0;
  const r = CONS_R * aoeRadiusMult(p);
  g.consecrate = {x:p.x, y:p.y, r, t:skDur(p, CONS_DUR + 0.5*(rank-1)), tick:0, rank, room:g.room, fx:{type:'consecrateFx', x:p.x, y:p.y, t:1, max:1, r}};
  g.particles.push(g.consecrate.fx);
  p.consecrateCdMax = applyCdr(p, CONS_CD); p.consecrateCd = p.consecrateCdMax;
  showMsg('Consecrate', 0.8, '#ffe9a0');
  return true;
}
const JUDG_BLIND_DUR = 3, JUDG_BLIND_MISS = 0.5;   // v419: pillars blind foes -- 50% of their attacks miss for 3s
const judgmentMult = r=> r>0 ? 2 + (Math.min(MAX_EFF_RANK,r)-1)/(MAX_SKILL_RANK-1) : 1;   // v419: 2x at rank 1 up to 3x at rank 10
function castJudgment(g, p, rank){
  if((p.mp||0) < JUDG_COST){ noResourceMsg(p, 'judgment'); return false; }
  const cand = g.enemies.filter(e=>e.hp>0 && dist(p,e) < JUDG_RANGE);
  if(!cand.length) return false;
  cand.sort((a,b)=> ((isHeavyEnemy(a)?0:a.elite?1:2) - (isHeavyEnemy(b)?0:b.elite?1:2)) || (dist(p,a)-dist(p,b)));
  const n = 3 + Math.ceil(rank/2);
  const dmg = wpnDmg(p) * swd('judgment', rank) * assaultDealtMult(p) * weaponDmgMult(p);
  const R = JUDG_R * aoeRadiusMult(p);
  const list = g.judgments || (g.judgments = []);
  for(const e of cand.slice(0, n)) list.push({x:e.x, y:e.y, t:JUDG_TELE, tMax:JUDG_TELE, r:R, dmg, room:g.room});
  p.mp = Math.max(0, p.mp - JUDG_COST);
  p.judgmentCdMax = applyCdr(p, JUDG_CD); p.judgmentCd = p.judgmentCdMax;
  showBigMsg('JUDGMENT', '', 1.2);
  return true;
}
function updateJudgments(g, dt){
  const list = g.judgments; if(!list || !list.length) return;
  const p = g.player;
  for(let i=list.length-1;i>=0;i--){
    const j = list[i];
    if(j.room!==g.room){ list.splice(i,1); continue; }
    j.t -= dt;
    if(j.t > 0){ g.particles.push({type:'judgeTele', x:j.x, y:j.y, t:0.05, max:0.05, r:j.r, frac:1-j.t/j.tMax}); continue; }
    for(const e of g.enemies){
      if(e.hp>0 && dist(j,e) < j.r+e.r){
        e.hp -= splitHit(p, e, j.dmg, 0.5, 'fire'); e.hitT = 0.15;
        if(!isHeavyEnemy(e)) e.stunT = Math.max(e.stunT||0, 0.6);
        e.blindT = JUDG_BLIND_DUR;
        checkExecute(g, e);
      }
    }
    g.particles.push({type:'judgePillar', x:j.x, y:j.y, t:0.45, max:0.45, r:j.r});
    shakeScreen(g, 4, 0.15);
    list.splice(i,1);
  }
}
// Per-frame upkeep for every v266 warrior mechanic (cooldowns, banners, zones, timers).
// v268 Necromancer per-frame systems: Soul Hunger, Soul Gate + its archers, and Demon Bind scaling.
function necroV268Tick(g, p, dt){
  if(p.cls!=='mystic') return;
  // v409: summon whenever Demon Bind is ranked, souls >= threshold and no demon is out -- not only when the soul count changes
  // (re-summons wait 3s after a demon is gone, so a dying demon doesn't instantly eat 10 more souls)
  if(g.followers && g.followers.some(f=>f.kind==='demon')) p._demonGone = 0;
  else if((p._demonGone = (p._demonGone||0) + dt) > 3) checkDemonBindThreshold(g);
  const hunger = (p.skills && effectiveRank(p,'soulHunger'))||0;
  // v299: with Soul Hunger you cannot regenerate above 50% life (gradual regen only; big instant heals still work)
  if(hunger>0 && p.hp>0){
    const lim = p.maxHp*0.5, prev = p._hpPrev;
    if(prev!=null && p.hp > prev && (p.hp-prev) < p.maxHp*0.06){
      const cap = Math.max(prev, lim);
      if(p.hp > cap){ p.hp = cap; if(!p._hungerMsgShown && cap>=lim-0.01 && prev>=lim-1){ p._hungerMsgShown = true; showMsg('Cannot regen above 50% life', 1.2); } }
    }
  }
  if(p._hungerMsgT>0) p._hungerMsgT -= dt;
  if(hunger>0 && p.hp > p.maxHp*0.5 + 1 && (p.souls||0) < SOUL_CAP){
    p.hungerT = (p.hungerT||0) + dt;
    const iv = soulHungerInterval(hunger);
    if(p.hungerT >= iv){
      p.hungerT -= iv;
      const cost = p.maxHp*SOUL_HUNGER_HP_PCT;
      if(p.hp - cost >= p.maxHp*0.5){
        p.hp -= cost; p.souls = Math.min(SOUL_CAP, (p.souls||0)+1);
        g.particles.push({type:'burst', x:p.x, y:p.y, t:0.25, max:0.25, color:'#a06ad0'});
        checkDemonBindThreshold(g);
      }
    }
  } else p.hungerT = 0;
  p._hpPrev = p.hp;
  // Soul Gate
  const gt = g.soulGate;
  if(gt){
    gt.t += dt;
    gt.spawnT -= dt;
    if(gt.spawnT<=0 && (g.gateArchers||[]).length < SOULGATE_ARCHER_CAP && (p.souls||0)>=SOULGATE_SOULS_PER_ARCHER){
      gt.spawnT += soulGateInterval(gt.rank);
      p.souls -= SOULGATE_SOULS_PER_ARCHER;   // v319: souls are spent only when an archer actually comes out
      const a0 = Math.random()*Math.PI*2, d0 = 34 + Math.random()*40;
      g.gateArchers.push({type:'skeletonarcher', x:gt.x+Math.cos(a0)*d0, y:gt.y+Math.sin(a0)*d0, r:14, hp:1, maxHp:1, hitT:0, animT:Math.random()*3, faceSign:1, moving:false, atkAnimT:0, life:SOULGATE_ARCHER_LIFE, cd:0.4, rank:gt.rank});
      g.particles.push({type:'burst', x:gt.x, y:gt.y, t:0.25, max:0.25, color:'#a06ad0'});
    } else if(gt.spawnT<=0) gt.spawnT = 0.2;
    if(gt.t >= gt.dur){ g.soulGate = null; showMsg('The gate closes', 1); g.particles.push({type:'ring', x:gt.x, y:gt.y, t:0.4, max:0.4, r:70, color:'#6a3aa0'}); }
  }
  if(g.gateArchers && g.gateArchers.length){
    for(let i=g.gateArchers.length-1;i>=0;i--){
      const a = g.gateArchers[i];
      a.life -= dt; a.animT += dt; a.cd -= dt;
      if(a.atkAnimT>0) a.atkAnimT -= dt;
      if(a.life<=0){ g.particles.push({type:'burst', x:a.x, y:a.y, t:0.25, max:0.25, color:'#a06ad0'}); g.gateArchers.splice(i,1); continue; }
      const tg = nearestEnemy(g, a, 380);
      if(tg){
        const ang = Math.atan2(tg.y-a.y, tg.x-a.x); a.faceSign = screenFacingSign(Math.cos(ang), Math.sin(ang));
        if(a.cd<=0){
          a.cd = 0.9; a.atkAnimT = 0.3;
          const dmg = (SOULGATE_ARCHER_BASE_DMG + p.level*1.0) * skillMult(a.rank) * assaultDealtMult(p) * (1 + (p.followerDmgPct||0));   // minions keep their own scaling
          g.projectiles.push({x:a.x, y:a.y, vx:Math.cos(ang)*BOW_ARROW_SPEED*0.9, vy:Math.sin(ang)*BOW_ARROW_SPEED*0.9, r:5, dmg, from:'player', life:1.2, color:'#cdb6f0', isArrow:true});
        }
      }
    }
  }
  // Demon Bind: grows with the souls you hold
  if(g.followers) for(const f of g.followers){ if(f.kind==='demon'){ f.r = NECRO_DEMON_R * demonSoulMult(p, DEMON_SIZE_PER_10); } }
}
function warriorV266Tick(g, p, dt){
  if(p.vengeanceCd>0) p.vengeanceCd -= dt;
  if(p.bannerCd>0) p.bannerCd -= dt;
  if(p.consecrateCd>0) p.consecrateCd -= dt;
  if(p.judgmentCd>0) p.judgmentCd -= dt;
  if(p.bulwarkCd>0) p.bulwarkCd -= dt;
  if(p.seismicCd>0) p.seismicCd -= dt;
  if(p.mirrorCd>0) p.mirrorCd -= dt;
  if(p.mirrorT>0) p.mirrorT -= dt;   // v492 Mirror of Steel: reflecting while it lasts
  if(p.anchorCd>0) p.anchorCd -= dt;
  if(p.anchorPendT>0){ p.anchorPendT -= dt; if(p.anchorPendT<=0){ p.anchorPendT = 0; seismicAnchorResolve(g, p); } }
  if(p.bloodrageCd>0) p.bloodrageCd -= dt;
  if(p.unbreakSaveCd>0) p.unbreakSaveCd -= dt;
  if(p.rampageT>0){ p.rampageT -= dt; if(p.rampageT<=0){ p.rampageT = 0; p.rampageStacks = 0; } }
  if(p.bloodrageT>0){ p.bloodrageT -= dt; if(p.bloodrageT<0) p.bloodrageT = 0; }
  if(p.bulwarkT>0){
    p.bulwarkT -= dt; p.unbreakT = p.bulwarkT; p.unbreakRank = 1;
    if(p.bulwarkT<=0) bulwarkRelease(g, p);
  }
  if(g.followers) for(const f of g.followers){
    if(f.vengeT>0) f.vengeT -= dt;
    if(f.consT>0) f.consT -= dt;
  }
  // ---- banner ----
  let b = g.banner;
  if(b && (b.room!==g.room || b.t<=0)){ if(b.fx) b.fx.t = 0; g.banner = b = null; }
  let inWar = false, inAeg = false;
  if(b){
    b.t -= dt;
    if(b.t<=0){ if(b.fx) b.fx.t = 0; g.banner = null; }
    else {
      persistFx(g, b, b.fx);
      inWar = b.type==='war' && dist(p,b) < b.r;
      inAeg = b.type==='aegis' && dist(p,b) < b.r;
      if(b.type==='aegis'){
        const reg = bannerAegisRegen(p);
        if(inAeg && p.hp>0 && p.hp<p.maxHp) p.hp = Math.min(p.maxHp, p.hp + p.maxHp*reg*dt);
        if(g.followers) for(const f of g.followers) if(dist(f,b) < b.r && f.hp<f.maxHp) f.hp = Math.min(f.maxHp, f.hp + f.maxHp*reg*dt);
      }
    }
  }
  p.inAegis = inAeg;
  if(inAeg !== !!p._inAegArmor){ p._inAegArmor = inAeg; p.bannerDefNow = inAeg ? bannerAegisDef(p) : 0; recalcStats(p); }
  if(inWar !== !!p._inWar){ p._inWar = inWar; p.bannerCritNow = inWar ? bannerWarCrit(p) : 0; recalcStats(p); }
  // ---- consecrate ----
  const c = g.consecrate;
  if(c){
    if(c.room!==g.room || c.t<=0){ if(c.fx) c.fx.t = 0; g.consecrate = null; }
    else {
      c.t -= dt; persistFx(g, c, c.fx);
      const pin = dist(p,c) < c.r;
      if(g.followers) for(const f of g.followers) if(dist(f,c) < c.r) f.consT = 0.3;
      if(pin && p.hp>0 && p.hp<p.maxHp) p.hp = Math.min(p.maxHp, p.hp + p.maxHp*0.015*dt);
      c.tick -= dt;
      if(c.tick<=0){
        c.tick += CONS_TICK;
        const dmg = wpnDmg(p) * swd('consecrate', c.rank) * weaponDmgMult(p) * assaultDealtMult(p);
        for(const e of g.enemies){
          if(e.hp>0 && dist(e,c) < c.r+e.r){
            e.hp -= splitHit(p, e, dmg, 0.5, 'fire'); e.hitT = 0.12;
            checkExecute(g, e);
          }
        }
        if(pin) gainResource(p, CONS_CONV);
      }
    }
  }
  updateSmites(g, dt);
  updateJudgments(g, dt);
}
// v268 Sacrifice (passive): a dying skeleton bursts, burning souls for a bigger blast, and poisons what it hits.
function necroSkeletonDeath(g, f, recast){
  const p = g.player, sRank = (p.skills && effectiveRank(p,'sacrifice'))||0;
  if(sRank<=0){ if(recast) g.particles.push({type:'burst', x:f.x, y:f.y, t:0.35, max:0.35, color:'#cfc6b0'}); return; }
  // v489: no souls spent -- the burst is as strong as the skeleton's life (its max life, 25% -> 45% with rank), boosted by minion damage %
  const dmg = (f.maxHp||0) * sacrificeLifePct(sRank) * (1 + ((p.followerDmgPct)||0));
  const radius = SACRIFICE_RADIUS * aoeRadiusMult(p);
  for(const e of g.enemies){
    if(e.hp<=0) continue;
    if(dist(f,e) < radius+e.r){
      e.hp -= applyEnemyArmor(p, e, dmg, 0, 'poison'); e.hitT = 0.15;   // v474: poison damage
      addPoison(e, dmg*POISON_DOT_PCT, 'sacrifice');
      checkExecute(g, e);
    }
  }
  g.particles.push({type:'ring', x:f.x, y:f.y, t:0.35, max:0.35, r:radius, color:'#7dd45a'});
  g.particles.push({type:'burst', x:f.x, y:f.y, t:0.3, max:0.3, color:'#284018'});
  // v320: no lingering poison cloud -- it is one burst that leaves the poison ailment on whoever it hit
}
function applyFollowerDamage(g, f, amt, srcEnemy){
  if(srcEnemy) srcEnemy._barOn = true;
  if(f && f.kind==='mirage'){ if(f.hitT!=null) f.hitT = 0.12; return; }   // v454: a Mirage soaks hits and never falls
  if(f && f.kind==='cat') return;   // v453: the cat companion is a pet, not a combatant -- it can't be hurt (it was dying and printing 'follower fallen')
  amt *= dmgVar();
  // Commander's old Guard-stance block-chance/damage-reduction rank scaling
  // was removed in the v56 redesign (Commander ranks now only grow follower
  // max HP, see commanderHpMult) -- the only damage reduction a follower
  // gets here now is Rallying Cry's temporary Defense buff, while it's up.
  const fType = (srcEnemy && srcEnemy.dmgType) || 'normal';
  // normal hits: Guard Stance armor; elemental hits: Guard Stance resists
  let dmg = amt * (1 - rallyDefenseReduction(g.player)) * (fType==='normal' ? (1 - guardStanceDefense(g.player)) : (1 - guardStanceResist(g.player)));
  if(g.player.guardianT>0) return;   // v266: Guardian shields your followers completely
  if((f.kind||'knight')==='knight'){   // v383 Knighthood gear: armor, block
    const kg = knightGear(g.player);
    if(kg.any){
      if(Math.random() < Math.min(0.4, kg.block/100)){ g.particles.push({type:'burst', x:f.x, y:f.y, t:0.2, max:0.2, color:'#cdd8e6'}); return; }
      if(fType==='normal') dmg *= (1 - knightGearDr(g.player));
    }
  }
  if(inBanner(g, f, 'aegis')) dmg *= (1 - bannerAegisDr(g.player)) / (1 + bannerAegisDef(g.player)/100);
  if(g.player.rallyT>0 && Math.random() < RALLY_BLOCK_BONUS){ g.particles.push({type:'burst', x:f.x, y:f.y, t:0.2, max:0.2, color:'#cdd8e6'}); return; }
  if(f.shieldHp>0){
    const ab = Math.min(f.shieldHp, dmg); f.shieldHp -= ab; dmg -= ab;
    g.particles.push({type:'burst', x:f.x, y:f.y, t:0.2, max:0.2, color:'#9fe07a'});
    if(dmg<=0.5) return;
  }
  // v413: Demon Bind no longer shares life -- the demon takes its own damage; its leech heals you
  f.hp -= dmg;
  f.hitT = 0.15;
  if(srcEnemy && f.hp>0) applyStatusToFollower(f, srcEnemy, dmg);
  if(f.hp <= 0){
    const i = g.followers.indexOf(f);
    if(i>=0) g.followers.splice(i,1);
    if(f.kind==='skeleton') necroSkeletonDeath(g, f);
    if(g.player && !g.followers.some(x=>x.hp>0)) g.player._fSnap = [];   // v453: the zone-change life snapshot must not be applied to a respawn (it came back at ~1 HP)
    showMsg(/^(wolf|bear|hawk|boar|raptor|cat|pet)/.test(f.kind||'') || (g.player && g.player.cls==='ranger') ? 'Your companion was slain' : 'Your follower has fallen', 1.2);
    // it will rejoin on its own after a short delay, rather than staying gone
    // until the level is cleared -- see the respawn check in update().
    // Wolves and bears use their own shorter 5-second respawn timer; others use the standard timer.
    if(f.kind==='skeleton' && g.player){
      const pl = g.player;
      if((pl.souls||0) >= NECRO_RESPAWN_SOULS) (g.followerPending || (g.followerPending = [])).push({kind:'skeleton', t:skelSoulRaiseDelay(effectiveRank(pl,'raiseDead')||1), soul:true});
      else pl.skelDown = (pl.skelDown||0) + 1;   // stays down until Raise Skeletons is cast
    } else if(f.kind!=='cat' && f.kind!=='demon'){
      (g.followerPending || (g.followerPending = [])).push({kind:(f.kind||'knight'), t:followerRespawnTime(g.player, f.kind||'knight')});
    }
  }
}
// v304: per-rank helper formulas were tuned for ranks 1-5 (+gear up to 8); mastery ranks must not push cooldowns negative or chances over 100%.
const HELPER_RANK_CAP = 8;
// v374: ranks 6-10 keep scaling. rkTop8 leaves ranks 1-5 alone and spreads 6-10 over the old rank 5-8 range, so rank 10 lands on the old max.
// rkSpread5 is for formulas that reached their floor/ceiling at Rank 5: it spreads Ranks 1-10 across that range so every rank still adds something.
const rkTop8 = r=> r<=5 ? r : 5 + (r-5)*0.6;
const rkSpread5 = r=> r<=1 ? r : 1 + (r-1)*4/9;
const tblAt = (arr, r)=>{ const x = (Math.max(1,Math.min(MAX_EFF_RANK,r))-1)*(arr.length-1)/(MAX_SKILL_RANK-1), i = Math.floor(x), f = x-i; const n = arr.length-1; if(i>=n){ const last = arr[n], step = n>0 ? arr[n]-arr[n-1] : 0; return last + step*(x-n)*0.6; } return arr[i]+(arr[i+1]-arr[i])*f; };   // v438: keeps climbing (at 60% of the last step) past rank 10
shieldThrowCooldown = (f=>(r,...a)=>f((r==null||r!==r)?r:rkSpread5(r),...a))(shieldThrowCooldown);
shieldBashStunDuration = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(shieldBashStunDuration);
shieldStunChance = (f=>(r,...a)=>f((r==null||r!==r)?r:rkSpread5(r),...a))(shieldStunChance);
hunterBearHpMult = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(hunterBearHpMult);
hunterFollowerStatMult = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(hunterFollowerStatMult);
cripplingShotBleedPct = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(cripplingShotBleedPct);
stunShotStunChance = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(stunShotStunChance);
stunShotStunDuration = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(stunShotStunDuration);
packTacticsCooldown = (f=>(r,...a)=>f((r==null||r!==r)?r:rkSpread5(r),...a))(packTacticsCooldown);
packTacticsDmgMult = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(packTacticsDmgMult);
recallShieldPct = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(recallShieldPct);
recallPlayerShieldPct = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(recallPlayerShieldPct);
sfdDodgePct = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(sfdDodgePct);
recallDmgBonus = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(recallDmgBonus);
recallRegenPct = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(recallRegenPct);
fieldDressRegenRate = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(fieldDressRegenRate);
novaShockDuration = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(novaShockDuration);
tornadoCdForRank = (f=>(r,...a)=>f((r==null||r!==r)?r:rkSpread5(r),...a))(tornadoCdForRank);
stormDuration = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(stormDuration);
hurricaneDuration = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(hurricaneDuration);
immolateDuration = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(immolateDuration);
// v489: immolateBoost uses its own rank curve (no rkTop8 squeeze)
flameVortexDur = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(flameVortexDur);
permafrostDur = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(permafrostDur);
iceArmorSlowPct = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(iceArmorSlowPct);
thunderstepRegenBonus = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(thunderstepRegenBonus);
elementalExplosionAilmentChance = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(elementalExplosionAilmentChance);
// v489: fearVulnPct has its own rank curve
fearCooldown = (f=>(r,...a)=>f((r==null||r!==r)?r:rkSpread5(r),...a))(fearCooldown);
fearDuration = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(fearDuration);
deathBoltBounces = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(deathBoltBounces);
soulHungerInterval = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(soulHungerInterval);
soulShieldFrac = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(soulShieldFrac);
soulGateDrain = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(soulGateDrain);
soulGateInterval = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(soulGateInterval);
necroDemonLeechPct = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(necroDemonLeechPct);
executeThreshold = (f=>(r,...a)=>f((r==null||r!==r)?r:rkSpread5(r),...a))(executeThreshold);
survFieldDressRegenRate = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(survFieldDressRegenRate);
frostTrapFreezeDuration = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(frostTrapFreezeDuration);
frostTrapChillDuration = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(frostTrapChillDuration);
aimedShotPierce = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(aimedShotPierce);
rapidShotCooldown = (f=>(r,...a)=>f((r==null||r!==r)?r:rkSpread5(r),...a))(rapidShotCooldown);
preciseShotCooldownMult = (f=>(r,...a)=>f((r==null||r!==r)?r:rkSpread5(r),...a))(preciseShotCooldownMult);
unbreakDr = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(unbreakDr);
unbreakDur = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(unbreakDur);
assaultKillExtend = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(assaultKillExtend);
commanderHpMult = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(commanderHpMult);
rampagePerStack = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(rampagePerStack);
smiteRankMult = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(smiteRankMult);
shieldThrowMaxChains = (f=>(r,...a)=>f((r==null||r!==r)?r:rkTop8(r),...a))(shieldThrowMaxChains);
function skillMult(rank){ return rank>0 ? 1 + SKILL_RANK_STEP*(rank-1) : 1; }
function fmtNum(n){ return (Math.round(n*100)/100).toString(); }
// 1 while Assault isn't active; ramps from 1 up to 1+ASSAULT_DEALT_MAX over its duration.
// (v104) Also folds in the perfect-dodge "riposte" bonus (p.riposteT) --
// this is the shared multiplier nearly every player damage formula already
// uses, so one hook here covers Strike and all active skills.
function assaultDealtMult(p){
  const rip = (p.riposteT>0 ? RIPOSTE_DMG_MULT : 1) * (p.battlecryT>0 ? battlecryDmgMult(p) : 1) * bloodrageMult(p);
  if(!(p.assaultT>0)) return rip;
  const durMax = p.assaultDurMax||1;
  const frac = clamp(1 - p.assaultT/durMax, 0, 1);
  return rip*(1 + ASSAULT_DEALT_MAX*frac);
}
// Weapons Specialist: a Greatsword deals bonus damage that scales with rank.
// Dual-wielding gets its attack-speed bonus separately, inside recalcStats.
// v387 Crown of the Crater King: a T-Rex foot stamps down ahead of you and crushes everything beneath it
const CR_STOMP_CD = 8, CR_STOMP_R = 150, CR_STOMP_MULT = 1.5;
function crStomp(g, p, ang){
  p.crStompCd = CR_STOMP_CD;
  const R = CR_STOMP_R * aoeRadiusMult(p);
  const cx = p.x + Math.cos(ang)*R*0.7, cy = p.y + Math.sin(ang)*R*0.7;
  const dmg = (wpnDmg(p)) * weaponDmgMult(p) * CR_STOMP_MULT;
  for(const e of g.enemies){
    if(e.hp<=0) continue;
    if(dist({x:cx,y:cy}, e) < R + e.r){ e.hp -= applyEnemyArmor(p, e, dmg); e.hitT = 0.15; checkExecute(g, e); g.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:'#ff4a3a'}); }
  }
  g.particles.push({type:'rexfoot', x:cx, y:cy, ang, r:R, t:1.0, max:1.0});
  g.particles.push({type:'ring', x:cx, y:cy, t:0.45, max:0.45, r:R, color:'#ff5a4a'});
  shakeScreen(g, 6, 0.3);
}
function weaponDmgMult(p){
  const mh = p.equipment && p.equipment.mainhand;
  const rank = (p.skills && effectiveRank(p,'weaponsSpecialist')) || 0;
  let mult = 1;
  if(mh && mh.twoHanded && p.cls==='warrior' && mh.slotType==='weapon2h') mult *= TWOHAND_BASE_DMG_MULT;   // v266
  if(mh && mh.twoHanded && rank>0) mult *= 1 + GREATSWORD_DMG_PER_RANK*rank;
  if(hasShieldEquipped(p)) mult *= (1 + SHIELD_DMG_BONUS_PCT);
  mult *= bloodlustMult(p);
  mult *= sapMult(p);
  mult *= bowExpertDmgMult(p);
  mult *= recallDmgMult(p);
  mult *= soulHungerMult(p);
  if(p.immolateT>0) mult *= 1 + immolateBoost((p.skills && effectiveRank(p,'immolate'))||1);
  if(p.beastFuryT>0) mult *= BEAST_FURY_PLAYER_DMG;
  if(p.oppT>0) mult *= 1 + OPPORTUNIST_PER_RANK*((p.skills && effectiveRank(p,'opportunist'))||0);
  mult *= 1 + (((p.partB&&p.partB.dmg)||0)/100);
  if(p.windT>0) mult *= 1.2;   // v361 Wind Stone
  if(uq(p,'uq_berserker') && p.hp < p.maxHp*0.4) mult *= 1.5;   // v383 Heart of Wrath
  if(p.apexStacks>0 && uq(p,'uq_crater')) mult *= 1 + 0.03*p.apexStacks;   // v387 Apex Hunger
  return mult;
}
// Greatsword armor penetration: ignores a rank-scaled fraction of the
// target's armor. Has no effect on any other weapon, or against unarmored foes.
// extraPen (optional): an additional flat armor-pen fraction from another
// source (currently just Cleave, +5%/rank -- see CLEAVE_ARMORPEN_PER_RANK),
// stacked additively with Greatsword's own pen before the combined total
// is clamped to 100%.
// Damage variance: every hit rolls +/- 5% so numbers never repeat exactly.
const DMG_VARIANCE = 0.05;
function dmgVar(){ return 1 + (Math.random()*2-1)*DMG_VARIANCE; }
