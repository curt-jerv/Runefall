// ---------- Survivalist tree (v79): 4 brand-new mechanics -----------------
// Field Dress (survivalFieldDress): moved here fresh from the Hunter tree
// per the brief's explicit "moved from the hunter tree to here" note --
// this is a NEW node/id, NOT a rename of Hunter's existing 'fieldDress'
// (its implementation is left completely untouched -- v80 removed it
// from the Hunter tree's own allocatable node list, same backward-compat-
// preserving retirement pattern as every other retired node id in this
// file, but every bit of its code/button/registry entry/p.skills field
// still works exactly as before for a save with points already in it).
// Reuses the same "stand still to channel" mechanic
// shape as the old Hunter version (see p.fieldDressing2/wantSurvivalFieldDress
// in updatePlaying()), but with a DIFFERENT, EXPLICITLY-REQUESTED cooldown
// model: here each rank BOTH increases regen speed AND reduces cooldown
// (the old Hunter version's cooldown was deliberately fixed/rank-immune --
// this is the opposite design, on purpose, per the brief's own contrast).
// JUDGMENT CALL: regen rate curve reuses the old Hunter version's exact
// 10%/s -> 15%/s numbers (no reason to invent new ones); cooldown starts at
// the requested 120s (Rank 1) and steps down 15s/rank to a 60s floor at
// Rank 5 (a round, sizable-but-not-trivial reduction -- half the base CD
// at max rank -- documented here since the brief only said "use judgment").
// (v244) REDESIGN: Field Dress is now a mobile bandage -- heals over 4s while you keep moving/fighting, companions get half
const SURV_FIELD_DRESS_REGEN_BASE = 0.08, SURV_FIELD_DRESS_REGEN_STEP = 0.02, SURV_FIELD_DRESS_DUR = 4;   // v474: doubled (8%/s at Rank 1) // 4%/s at Rank1 -> 8%/s at Rank5 for 4s (16% -> 32%)
function survFieldDressRegenRate(rank){ return rank>0 ? SURV_FIELD_DRESS_REGEN_BASE + SURV_FIELD_DRESS_REGEN_STEP*(rank-1) : 0; }
const SURV_FIELD_DRESS_CD_BASE = 30, SURV_FIELD_DRESS_CD_MIN = 18, SURV_FIELD_DRESS_CD_STEP = 3; // 30s at Rank1 -> 18s at Rank5
function survFieldDressCooldown(rank){
  if(rank<=0) return SURV_FIELD_DRESS_CD_BASE;
  return Math.max(SURV_FIELD_DRESS_CD_MIN, SURV_FIELD_DRESS_CD_BASE - SURV_FIELD_DRESS_CD_STEP*(rank-1));
}
// Poison Trap / Frost Trap: a brand-new "thrown, delayed-detonation" trap
// mechanic -- distinct from Hunter's existing g.traps (planted at your own
// feet, waits for an enemy to WALK into it). These are instead thrown AT
// the nearest enemy (or straight ahead if none in range), land there, and
// after a fixed 0.5s fuse detonate ONCE against every enemy within radius
// of the landing spot (not a "first one to touch it" single-consume trap).
// Tracked in g.thrownTraps -- a small array of {kind:'poison'|'frost', x, y,
// r, fuse, rank, dmg} pending objects, resolved each frame in updatePlaying()
// once fuse<=0. Poison Trap's detonation additionally spawns a lingering
// DoT cloud (p.survPoisonCloud, same {x,y,t,max,tick} shape Plague's own
// p.plagueZone already uses) rather than a single instant tick, matching
// "releasing a large poison cloud dealing damage OVER TIME" -- Frost Trap's
// detonation is a single instant AoE pulse instead (freeze doesn't linger).
const SURV_TRAP_FUSE = 0.5, SURV_TRAP_RADIUS = 110, SURV_TRAP_LIFE = 20, SURV_TRAP_MAX = 3, SURV_TRAP_TRIGGER = 0.6;
// Poison Trap: JUDGMENT CALL -- "damage dealing speed" is read as the
// trap's own cooldown (how fast you can throw another one), since the
// brief already covers the cloud's tick damage under "adds damage over
// time" separately. Cooldown ramps 8s (Rank1) -> 5s (Rank5), same shape as
// Rapid Shot/Poison Knives' own CD curves. Cloud lingers 3s after
// detonation, ticking every 0.5s (6 ticks total at max uptime).
const POISON_TRAP_CD = 6, POISON_TRAP_CD_MIN = 6, TRAP_GCD = 0.6;   // v454: a little longer between throws (was 0.4)   // (v245) all three traps: 8s at every rank + a 0.1s shared lockout
const POISON_TRAP_CLOUD_DUR = 3, POISON_TRAP_TICK_INTERVAL = 0.5;
function poisonTrapCooldown(rank){
  if(rank<=0) return POISON_TRAP_CD;
  return POISON_TRAP_CD;   // (v245) same flat cooldown at every rank, like Frost/Explosive
}
// Frost Trap: fixed cooldown at every rank (the brief only calls out
// "each rank adds freeze duration", nothing about cooldown -- same "rank
// affects an attribute, never the cooldown" pattern Field Dress/Storm
// already established elsewhere in this file). Freeze (e.frozenT) starts
// at a very brief 0.1s (per spec) and ramps up +0.1s/rank to 0.5s at Rank
// 5; the follow-up Chill (e.chillT) slow reuses ICE_CHILL_DUR verbatim and
// does NOT scale with rank, exactly as the brief specifies ("not the slow
// duration").
const FROST_TRAP_CD = 6;
const FROST_TRAP_FREEZE_BASE = 0.1, FROST_TRAP_FREEZE_STEP = 0.1; // 0.1s at Rank1 -> 0.5s at Rank5
function frostTrapFreezeDuration(rank){ return rank>0 ? FROST_TRAP_FREEZE_BASE + FROST_TRAP_FREEZE_STEP*(rank-1) : FROST_TRAP_FREEZE_BASE; }
// Finesse (passive, requires Evasion): a brand-new "extra charge" mechanic
// for Dodge -- no skill in the game had multiple charges-before-cooldown
// before this, so Dodge's own cooldown gate is generalized into a small
// charge counter (p.dodgeCharges, max 1 normally / 2 with Finesse ranked)
// instead of the old plain "cur<=0" single-slot check -- see the dodge
// block in updatePlaying() for the actual charge-consume/regen logic.
// DODGE_CD_BASE names the 1.05s base cooldown that was previously just an
// inline literal on p.dodgeCdMax's init. Each Finesse rank reduces the
// regen cooldown between charges by a flat 0.1s (per the brief), down to a
// 0.55s floor at Rank 5 (roughly half the base -- sensible relative to the
// 1.05s base, not so low it trivializes the cooldown entirely).
const DODGE_CD_BASE = 1.55;   // v456: +0.5s (was 1.05)
const FINESSE_DODGE_CD_STEP = 0.1, FINESSE_DODGE_CD_MIN = 0.90;
function finesseDodgeCooldown(p){
  const rank = (p && p.skills && effectiveRank(p,'finesse')) || 0;
  if(rank<=0) return DODGE_CD_BASE;
  return Math.max(FINESSE_DODGE_CD_MIN, rank<=5 ? DODGE_CD_BASE - FINESSE_DODGE_CD_STEP*rank : DODGE_CD_BASE - FINESSE_DODGE_CD_STEP*5 - 0.03*(rank-5));   // v372: -0.1s per rank to Rank 5, then -0.03s (0.40s at Rank 10)
}
function dodgeMaxCharges(p){
  return (p && p.skills && effectiveRank(p,'finesse')>0) ? 2 : 1;
}
// Marksman tree (Ranger's 2nd tree, v58): Bow Expert (passive bow-damage%),
// Rapid Shot (new button, sequential 3-arrow burst), Multi Shot (passive that
// turns the plain bow attack into a simultaneous 3/5-arrow spread + attack
// speed), Arrow Eye (passive bow-only crit%), True Shot (passive aim-speed,
// only matters for Precise Shot), Precise Shot (capstone: hold STRIKE to aim
// a 3x-damage shot, requires BOTH Arrow Eye and True Shot -- canRankUp's
// existing prereq loop already treats node.prereq as an AND list, same as
// Berserker's Assault capstone (prereq:['cleave','fury']), so no engine
// change is needed for this dual-gate).
// Bow Expert: +5% bow damage at Rank1 up to +20% at Rank5 (5/9/13/16/20, a
// rounder-number curve rather than perfectly even quarters).
const BOW_EXPERT_DMG_PCT = [5, 9, 13, 16, 20];
const MARKSMAN_DMG_TUNE = 0.5;
function bowExpertDmgMult(p){
  const mh = p && p.equipment && p.equipment.mainhand;
  if(!(mh && mh.slotType==='bow')) return 1;
  const rank = (p.skills && effectiveRank(p,'bowExpert')) || 0;
  // v227: the Multi Shot tuning now lives on the basic-attack arrows only (see the multiShot fan below)
  if(rank<=0) return 1;
  return 1 + tblAt(BOW_EXPERT_DMG_PCT, rank)/100;
}
// ---- v227 Ranger redesign helpers ----
const AIMED_SHOT_DMG_MULT = 2.2, AIMED_SHOT_CRIT_BONUS = 15, AIMED_SHOT_FALLOFF = 0.8, AIMED_SHOT_CD = 2.5;   // v489: a real cooldown again (was a 0.4s lockout)
const AIMED_HELD_MULT_BASE = 3, AIMED_HELD_MULT_STEP = 0.25, AIMED_TAP_MULT = 1.5, AIMED_HOLD_MS = 280;   // v267: hold = 3x..4x, tap = 1.5x
function aimedShotMult(rank, full){ return full===false ? AIMED_TAP_MULT : AIMED_HELD_MULT_BASE + AIMED_HELD_MULT_STEP*(Math.max(1,rank)-1); }
function aimedShotPierce(rank){ return 3 + Math.floor((Math.max(1,rank)-1)/2); }
const LONGSHOT_DIST = 220, LONGSHOT_PER_RANK = 0.05;
function longshotMult(p, e){ const r = (p.skills && effectiveRank(p,'deadeye'))||0; /* v454: Longshot is part of Deadeye */ return (r>0 && dist(p,e)>LONGSHOT_DIST) ? 1+LONGSHOT_PER_RANK*r : 1; }
const DEADEYE_CRITMULT_PER_RANK = 0.08, DEADEYE_STAMINA_PER_RANK = 0.01;
function deadeyeCritMult(p){ return ((p.skills && effectiveRank(p,'deadeye'))||0) * DEADEYE_CRITMULT_PER_RANK; }
const HMARK_CD = 7, HMARK_DUR = 8, HMARK_BONUS = 0.15, HMARK_BONUS_STEP = 0.03, MARKED_PREY_PER_RANK = 0.06;
function huntMarkMult(p, e){
  if(!(e && e.markT>0)) return 1;
  return 1 + (e.markBonus||HMARK_BONUS) + MARKED_PREY_PER_RANK*((p.skills && effectiveRank(p,'markedPrey'))||0);
}
const BEAR_ROAR_R = 240;
function bearRoarDur(r){ r = Math.max(1, r||1); return 3 + 0.25*(Math.min(10,r)-1); }   // v455
function wolfFuryBleed(p){ return (p && p.beastFuryT>0) ? 1.5 + 0.05*(Math.min(10, p.beastFuryRank||1)-1) : 1; }   // v455: +50% wolf bleed during Beast Fury (+95% at Rank 10)
const BEAST_FURY_CD = 16, BEAST_FURY_DUR = 8, BEAST_FURY_PET_DMG = 1.5, BEAST_FURY_PLAYER_DMG = 1.15, BEAST_FURY_PET_ATK = 0.75;
const BOND_DMG_PER_RANK = 0.06, BOND_HP_PER_RANK = 0.08;
const EXPLOSIVE_TRAP_BASE_DMG = 240, TRAP_MASTERY_DMG = 0.08, TRAP_MASTERY_RADIUS = 0.06, TRAP_MASTERY_CD = 0.05;
function trapMasteryRank(p){ return (p.skills && effectiveRank(p,'trapMastery'))||0; }
function trapDmgMult(p){ return 1 + TRAP_MASTERY_DMG*trapMasteryRank(p); }
function trapRadiusMult(p){ return 1 + TRAP_MASTERY_RADIUS*trapMasteryRank(p); }
function trapCdText(base){ const p = (typeof game!=='undefined' && game && game.player) ? game.player : null; const m = p ? trapCdMult(p) : 1; const v = Math.round(base*m*10)/10; return v+'s'+(m<1 ? ' (base '+base+'s, Trap Mastery applied)' : ''); }
function trapCdMult(p){ return 1; }   // v454: Trap Mastery no longer shortens cooldowns -- it speeds up throwing instead
const TRAP_MASTERY_THROW = 0.04;
function trapGcdFor(p){ return TRAP_GCD * (1 - TRAP_MASTERY_THROW*Math.min(10, trapMasteryRank(p))); }
const INSTINCT_HP_PER_RANK = 0.05, INSTINCT_SPEED_PER_RANK = 0.02, OPPORTUNIST_PER_RANK = 0.05, OPPORTUNIST_DUR = 3;
// Rapid Shot: new RAPID button -- fires 3 arrows sequentially (a fast burst,
// not a simultaneous spread like Multi Shot) at whatever the bow's basic
// attack would currently target. Ranks scale each arrow's damage via the
// same skillMult curve every ranked skill uses, and shrink the cooldown
// from 7s at Rank1 down to 4s at Rank5.
const RAPID_SHOT_CD = 5, RAPID_SHOT_CD_MIN = 3, RAPID_SHOT_ATKCD_MULT = 1.6;   // v489: Rapid Shot rides the Strike timer (a 3-arrow burst takes 1.6 Strikes)
const RAPID_SHOT_COUNT = 3, RAPID_SHOT_INTERVAL = 0.12;
function rapidShotCooldown(rank){
  if(rank<=0) return RAPID_SHOT_CD;
  return RAPID_SHOT_CD - (RAPID_SHOT_CD-RAPID_SHOT_CD_MIN)/4*(rank-1);
}
// v79 rework: Rapid Shot now tracks whether all 3 arrows of one burst land
// on the SAME enemy (see p.rapidShotBurst.targetHits / the isRapidShot
// branch in the projectile-hit loop) -- if so, the 3rd/final arrow gets a
// rank-scaled armor-penetration bonus, reusing the EXACT same mechanism
// Cleave already uses (applyEnemyArmor's `extraPen` param) for consistency
// with the game's one existing armor-pen convention, rather than inventing
// a second one. Same +5%/rank curve as Cleave, up to +25% at Rank 5.
const RAPID_SHOT_ARMORPEN_PER_RANK = 0.05;
// ---- v454 Marksman additions ----
function favouredFoePierce(r){ r = Math.max(1, r||1); return Math.min(0.75, 0.25 + 0.5*(r-1)/9); }   // final Rapid Shot arrow pierces: 25% -> 75%
function predInstinctPct(r){ r = r||0; return r<=0 ? 0 : r<=10 ? 0.10 + 0.20*(r-1)/9 : Math.min(0.40, 0.30 + 0.01*(r-10)); }
function enemyAiling(e){ return !!(e && (e.bleedT>0 || e.poisonT>0 || e.burnT>0 || e.chillT>0 || e.frozenT>0 || e.stunT>0 || e.charges>0 || e.trapRootT>0 || e.fearT>0)); }
const EXPSHOT_R = 62, EXPSHOT_BLAST = 0.6;   // v455 Explosive Shot: blast radius, blast damage as a share of the arrow hit
function expShotBurnDur(r){ r = Math.max(1, r||1); return 2 + 0.3*(Math.min(10,r)-1) + 0.05*Math.max(0,r-10); }   // 2s -> 4.7s
function explosiveShotBlast(g, p, pr, x, y){
  const R = EXPSHOT_R*aoeRadiusMult(p), bd = pr.dmg*(pr.blastK||EXPSHOT_BLAST);
  for(const e of g.enemies){
    if(!(e.hp>0) || dist({x,y},e) >= R+e.r) continue;
    e.hp -= applyEnemyArmor(p, e, bd, 0, 'fire'); e.hitT = 0.15;
    e.burnT = Math.max(e.burnT||0, pr.burnDur||2); e.burnDps = Math.max(e.burnDps||0, pr.dmg*BURN_DPS_PCT);
    checkExecute(g, e);
  }
  g.particles.push({type:'ring', x, y, t:0.4, max:0.4, r:R, color:'#ff8a3a'});
  g.particles.push({type:'burst', x, y, t:0.35, max:0.35, color:'#ffb060'});
  for(let k=0;k<7;k++){ const an = k/7*6.283+Math.random()*0.4, rr = R*(0.3+Math.random()*0.5); g.particles.push({type:'burst', x:x+Math.cos(an)*rr, y:y+Math.sin(an)*rr, t:0.3, max:0.3, color:k%2?'#ff7a2a':'#ffd070'}); }
  shakeScreen(g, 2, 0.1); try{ sfxPlay('fire', 0.8); }catch(e){}
}
const SPLINTER_SPLITS = 3, SPLINTER_SPLIT_PCT = 0.70, SPLINTER_RANGE = 260, SPLINTER_BLEED = 0.10;
function splinteredWoundsRank(p){ return (p && p.skills && effectiveRank(p,'splinteredWounds'))||0; }
function splinterSplitPct(p){ return SPLINTER_SPLIT_PCT + 0.03*Math.min(10, splinteredWoundsRank(p)); }   // 70% -> 100% at Rank 10
function splinterBleedChance(p){ return Math.min(0.6, SPLINTER_BLEED + 0.04*splinteredWoundsRank(p)); }   // 10% -> 50% at Rank 10
function splinterBurst(g, p, pr, e){
  const others = g.enemies.filter(o=>o!==e && o.hp>0 && dist(o,e) < SPLINTER_RANGE).sort((a,b)=>dist(a,e)-dist(b,e)).slice(0, SPLINTER_SPLITS);
  const baseAng = Math.atan2(pr.vy, pr.vx), sp = BOW_ARROW_SPEED*projectileSpeedMult(p);
  for(let i=0;i<SPLINTER_SPLITS;i++){
    const o = others[i], an = o ? Math.atan2(o.y-e.y, o.x-e.x) : baseAng + (i-1)*0.6;
    g.projectiles.push({x:e.x, y:e.y, vx:Math.cos(an)*sp, vy:Math.sin(an)*sp, r:4, dmg:pr.dmg*splinterSplitPct(p), from:'player', life:0.65,
      color:'#d8b25a', isArrow:true, crit:pr.crit, isSplinter:true, isSplit:true, pierceHit:[e]});
  }
  g.particles.push({type:'burst', x:e.x, y:e.y, t:0.25, max:0.25, color:'#f0d890'});
}
// Multi Shot: turns the Ranger's plain bow basic attack into 3 arrows fired
// at once in a small fan (distinct from Rapid Shot's sequential burst).
// Attack speed climbs +4%/rank (up to +20% at Rank5, folded into
// recalcStats' atkSpeedMod), and Rank 5 specifically bumps the shot count
// from 3 to 5 -- the same "extra bonus that only kicks in at max rank"
// pattern Shield Bash's Rank-5 knockdown already established.
const MULTI_SHOT_SPREAD = 0.4; // total fan spread, radians
const MULTI_SHOT_ATKSPD_PER_RANK = 0.04;
function multiShotCount(rank){ return rank>=5 ? 5 : 3; }   // v499: Phantom Quiver no longer adds arrows (it makes projectiles pierce)
// v499 Phantom Quiver: every player projectile rolls ONCE for a 50% chance to pass through the enemies it hits (shots that detonate or bounce keep their own rules)
function quiverPierce(p, pr){
  if(!uq(p,'uq_marksman') || pr.isExplosiveShot || pr.isSplinter || pr.isDeathBolt || pr.isLightningArc || pr.isFrozenOrb) return false;
  if(pr._pq===undefined) pr._pq = Math.random() < 0.5;
  return pr._pq;
}
// Arrow Eye: +5% Crit Chance at Rank1 up to +25% at Rank5, bow-only -- the
// game's crit roll (p.critChance, see recalcStats/isCrit) is otherwise a
// single generic stat with no weapon-type split, so this is the first
// weapon-specific crit source: it's added on top of p.critChance only in
// the isBow branch of each attack roll, and only while a bow is equipped.
const ARROW_EYE_CRIT_PCT = [5, 10, 15, 20, 25];
function arrowEyeCritBonus(p){
  const mh = p && p.equipment && p.equipment.mainhand;
  if(!(mh && mh.slotType==='bow')) return 0;
  const rank = (p.skills && effectiveRank(p,'favouredFoe')) || 0;   // v454: Arrow Eye's crit lives on in Favoured Foe
  return rank>0 ? tblAt(ARROW_EYE_CRIT_PCT, rank) : 0;
}
// True Shot: passive Aim Speed -- only meaningful to Precise Shot below.
// +8% per rank, up to +40% at Rank5, multiplying down Precise Shot's aim
// hold duration on top of Precise Shot's own per-rank duration.
const TRUE_SHOT_AIMSPD_PER_RANK = 0.08;
function trueShotAimSpeedMult(rank){ return rank>0 ? Math.max(0.2, 1 - TRUE_SHOT_AIMSPD_PER_RANK*rank) : 1; }
// Precise Shot (Marksman capstone, reworked v64): permanently swaps the
// STRIKE button's behavior (once ranked, bow equipped) from an instant
// tap-fire into a press-and-HOLD aim, exactly like steering the movement
// joystick -- see the btnAttack bindHold wiring and the "Precise Shot"
// block in updatePlaying() for the actual state machine. There is no
// fixed aim-time any more (the old "hold N seconds, then auto-fire" timer
// is gone): holding shows the red aim line (drawAimLineIso), dragging the
// movement stick steers it exactly the way it always did, and RELEASING
// fires immediately in whatever direction was last aimed. Its cooldown
// now matches the character's regular bow shot cooldown (BASE_ATK_CD,
// scaled by attack speed the same way p.atkCdMax is -- see p.preciseShotCd
// wiring) rather than a separate draw-time gate; True Shot no longer has
// an aim timer to shorten, so its Aim Speed bonus now shortens THIS
// cooldown instead (see preciseShotCooldown below).
const PRECISE_SHOT_DMG_MULT = 3;
// Rank only trims the cooldown a little further, same shape every other
// ranked active on this tree uses (flat per-rank cut, floored at rank 5) --
// Rank 1 is exactly the basic shot's own cooldown, per spec.
const PRECISE_SHOT_CD_MULT_MIN = 0.8; // rank5 floor: -20% off the base shot cooldown
function preciseShotCooldownMult(rank){
  if(rank<=0) return 1;
  return 1 - (1-PRECISE_SHOT_CD_MULT_MIN)/4*(rank-1);
}
// baseCd: the character's current basic-shot cooldown (p.atkCdMax), so this
// always tracks attack-speed gear/buffs the same way the regular shot does.
function preciseShotCooldown(rank, baseCd, trueShotRank){
  const tsMult = trueShotAimSpeedMult(trueShotRank||0);
  return Math.max(0.15, baseCd * preciseShotCooldownMult(rank) * tsMult);
}
function preciseShotActive(p){
  const mh = p && p.equipment && p.equipment.mainhand;
  return !!(p && (effectiveRank(p,'preciseShot')||0)>0 && mh && mh.slotType==='bow');
}
// Rain of Arrows (Marksman's new v79 capstone, requires Precise Shot): shoot
// an arrow straight up, then after a short "arcing up and shattering" delay
// it rains down as a burst of arrows in an area -- mechanically, a single
// targeted-area instant AoE hit (like Fire Bomb/Blizzard) landing on the
// nearest enemy's position, rather than a self-centered blast, matching "in
// an area" (not "around yourself"). Fixed 12s cooldown at every rank (per
// spec, does not shrink) -- only damage scales with rank, via the standard
// skillMult curve every other ranked active already uses.
const ROA_SKY_DELAY = 0.5;   // v454
const RAIN_OF_ARROWS_CD = 6, RAIN_OF_ARROWS_RADIUS = 130, RAIN_OF_ARROWS_DELAY = 0.9;   // v251: 8s cooldown, 0.9s barrage
const RAIN_OF_ARROWS_TOTAL_MULT = 7.2;   // v256: same total damage as a full Blizzard (0.45 x 16 ticks)
const RAIN_OF_ARROWS_BASE_DMG = 24, RAIN_OF_ARROWS_VOLLEYS = [0.35, 0.62, 0.9];   // v251: +~18% damage, dealt in three volleys
// Weapons Specialist gives two independent, weapon-dependent effects that both
// scale with rank: a Greatsword hits harder and ignores enemy armor, while
// dual-wielding two swords attacks faster. Neither affects the other weapon style.
const GREATSWORD_DMG_PER_RANK = 0.08;      // v266: +12% weapon damage per rank, up to +60% at rank 5 (on top of the flat two-hander bonus)
const GREATSWORD_ARMORPEN_PER_RANK = 0.15; // ignore +15% of enemy armor per rank, up to 75% at rank 5
const WS_RAGE_BASE = 0.05, WS_RAGE_STEP = 0.0125;   // v339: Weapon Specialization -- two-hander / dual-wield generate Rage faster: +5% at rank 1 up to +10% at rank 5
function wsRagePct(rk){ rk = rkSpread5(Math.min(MAX_EFF_RANK, rk||0)); return rk>0 ? WS_RAGE_BASE + WS_RAGE_STEP*(rk-1) : 0; }
function wsRageMult(p){
  if(!p || p.cls!=='warrior' || !p.equipment) return 1;
  const rk = rkSpread5(Math.min(MAX_EFF_RANK, (p.skills && effectiveRank(p,'weaponsSpecialist')) || 0)); if(rk<=0) return 1;
  const mh = p.equipment.mainhand, oh = p.equipment.offhand;
  const two = !!(mh && mh.twoHanded), dual = !!(mh && mh.slotType==='weapon1h' && oh && oh.slotType==='weapon1h');
  return (two || dual) ? 1 + wsRagePct(rk) : 1;
}
const DUAL_WIELD_ATKSPD_PER_RANK = 0.03;   // +3% attack speed per rank while dual-wielding, up to +15% at rank 5
const WHIRLWIND_RAGE_DRAIN = 15, WHIRLWIND_BASE_DUR = 3, WHIRLWIND_RANK_STEP = 0.5, WHIRLWIND_DRAIN_STEP = 10/9, WHIRLWIND_DRAIN_RAMP = 5, WHIRLWIND_REACH = 49, WHIRLWIND_CD = 7, WHIRLWIND_TICK_INTERVAL = 0.25;
// v216: Assault buff -- fills Rage on use, much longer duration, 20s cooldown
const ASSAULT_BASE_DUR = 6, ASSAULT_RANK_STEP = 1.0, ASSAULT_CD = 20;
// v216: every telegraphed enemy attack hits much harder (Kraken excluded -- separately tuned); 
const TELE_DMG_MULT = 2;
// v490: telegraphed hits from normal (non-boss) monsters are 25% softer, the heavy hitters 40%, and none of them can take more
// than half your life in one blow (before armour). Bosses keep their full telegraph damage.
const TELE_HEAVY = {alligator:1, giantoad:1, toad:1, cavetroll:1, mtroll:1, trollelder:1, raptor:1, ram:1};
function teleIsBoss(e){ return !!(e && (e.isBoss||e.isLairBoss||e.bossName||e.bkBoss||e.prot||e.hwGuardian||e.brBoss)); }
function teleDmg(e, mult){
  let d = e.dmg*mult*TELE_DMG_MULT;
  if(teleIsBoss(e)) return d;
  d *= TELE_HEAVY[e.type] ? 0.6 : 0.75;
  const p = typeof game!=='undefined' && game && game.player;
  return p && p.maxHp>0 ? Math.min(d, p.maxHp*0.5) : d;
}
// v187 Warrior survivability: built-ins + two new Berserker actives (Leap, Unbreakable)
const WARRIOR_HP_MULT = 1.2, WARRIOR_BASE_ARMOR = 2, WARRIOR_ARMOR_PER_LEVEL = 0.4;
const WARRIOR_KILL_HEAL = 0.03, WARRIOR_BIG_KILL_HEAL = 0.08;
const SURROUND_RADIUS = 120, SURROUND_MIN = 3, SURROUND_DR_PER = 0.03, SURROUND_DR_MAX = 0.12;   // v430: warrior surround DR halved
// v208: spinning slows you 10% at rank 1, easing to 5% at rank 5
function whirlSlowMult(p){
  if(!(p.whirlwindT>0)) return 1;
  const r = rkSpread5(clamp((p.skills&&effectiveRank(p,'whirlwind'))||1, 1, MAX_EFF_RANK));
  return 1 - (0.10 - 0.0125*(r-1));
}
function whirlSpeed(p){ return clamp(BASE_ATK_CD/Math.max(0.05, p.atkCdMax||BASE_ATK_CD), 0.6, 2.6); }   // v355: Attack Speed spins the blade faster, so it ticks (and procs leech/bleed/etc.) more often
function whirlDmgMult(r){ return 2 + 1.5*(clamp(r||1,1,MAX_EFF_RANK)-1)/(MAX_SKILL_RANK-1); }   // v372: x2 at Rank 1 up to x3.5 at Rank 10
function whirlDrain(p){ const r=Math.max(1,(p.skills&&effectiveRank(p,'whirlwind'))||1); return Math.max(5, WHIRLWIND_RAGE_DRAIN - WHIRLWIND_DRAIN_STEP*(r-1)) + WHIRLWIND_DRAIN_RAMP*(p.whirlwindElapsed||0); }   // v204: starts at 15/s (10/s at max rank) and climbs 5/s every second
const LEAP_CD = 8, LEAP_CD_STEP = 0, LEAP_RAGE_GAIN_PCT = 0.20, LEAP_RANGE = 460, LEAP_BLIND = 260, LEAP_TIME = 0.32, LEAP_RADIUS = 70, LEAP_STUN_BASE = 0.8, LEAP_STUN_STEP = 0.1;
const UNBREAK_DUR = 4, UNBREAK_DUR_STEP = 0.5, UNBREAK_DR = 0.35, UNBREAK_DR_STEP = 0.03, UNBREAK_CD = 8;   // v217: free, 8s cooldown, 4s -> 6s at max rank
function leapCdForRank(rank){ return LEAP_CD; }
function unbreakDr(rank){ return Math.min(0.6, UNBREAK_DR + UNBREAK_DR_STEP*(Math.max(1,rank)-1)); }
function unbreakDur(rank){ return UNBREAK_DUR + UNBREAK_DUR_STEP*(Math.max(1,rank)-1); }
const ASSAULT_DEALT_MAX = 0.35, ASSAULT_TAKEN_MAX = 0.5; // ramp from +0% to +50% over the duration
// Assault (v55): every monster killed while the rage buff is active extends
// its remaining time -- base +0.2s per kill at Rank 1, growing per rank.
// Both the countdown AND the ramp's own denominator (assaultDurMax) are
// extended together, so the damage-dealt/taken ramp keeps reading as "how
// far through the (now longer) buff am I", instead of the ramp appearing to
// reset when a kill pushes assaultT past the original duration.
const ASSAULT_KILL_EXTEND_BASE = 0.2, ASSAULT_KILL_EXTEND_STEP = 0.05; // +0.2s at rank1, +0.4s at rank5
function assaultKillExtend(rank){ return rank>0 ? ASSAULT_KILL_EXTEND_BASE + ASSAULT_KILL_EXTEND_STEP*(rank-1) : 0; }
// Bloodlust (Berserker, v55): passive. Outgoing damage bonus scales with how
// much life is currently missing (0% missing = no bonus; the closer to
// death, the bigger the hit), and the scaling itself grows with rank -- at
// Rank 5, being at 0 HP (100% missing) would be worth +30% damage.
// v190 Bloodlust redesign: a leech + comeback passive instead of "damage per missing life".
// Leech: rank-scaled % of damage dealt heals you. Bloodied (below 50% life): leech x1.75 and you swing faster.
// All leech (gear + Bloodlust + Assault) shares one cap and a per-hit / per-second heal budget so it scales
// with gear and late-game damage without making anyone unkillable.
const BLOODLUST_LEECH_BASE = 4, BLOODLUST_LEECH_STEP = 2, BLOODLUST_BLOODIED_AT = 0.5, BLOODLUST_BLOODIED_LEECH_MULT = 1.75;
const BLOODLUST_BLOODIED_AS_BASE = 0.10, BLOODLUST_BLOODIED_AS_STEP = 0.025;
const LEECH_TOTAL_CAP = 50, LEECH_HIT_CAP_PCT = 0.025, LEECH_BUDGET_PCT_PER_S = 0.08;
const OOC_REGEN_PCT = 0.015, OOC_REGEN_DELAY = 4, RAGE_HEAL_PER_10 = 0.006, RAGE_HEAL_PER_10_IRONSKIN = 0.002;
function bloodlustRank(p){ return (p.skills && effectiveRank(p,'bloodlust')) || 0; }
function bloodlustBloodied(p){ return bloodlustRank(p)>0 && p.maxHp>0 && p.hp/p.maxHp < BLOODLUST_BLOODIED_AT; }
function bloodlustLeechPct(p){
  const r = bloodlustRank(p); if(r<=0) return 0;
  return (BLOODLUST_LEECH_BASE + BLOODLUST_LEECH_STEP*(r-1)) * (bloodlustBloodied(p) ? BLOODLUST_BLOODIED_LEECH_MULT : 1);
}
function bloodlustAtkSpeedBonus(p){
  const r = bloodlustRank(p); if(r<=0 || !bloodlustBloodied(p)) return 0;
  return BLOODLUST_BLOODIED_AS_BASE + BLOODLUST_BLOODIED_AS_STEP*(r-1);
}
function bloodlustMult(p){ return 1; }
// v332: the number the Character screen shows -- gear leech + Bloodlust (+ Assault while it is up), capped like the real heal
function totalLeechPct(p){ return Math.min(LEECH_TOTAL_CAP, (p.lifeLeechPct||0) + bloodlustLeechPct(p) + (p.assaultT>0 ? ASSAULT_LEECH_PCT*100 : 0)); }
// Leech heal: per-hit cap (% of max life) plus a token bucket (% of max life per second) so gear + huge late-game hits stay bounded.
// v438: how much of your leech works on a target: full on normal monsters, 75% on magic, 50% on elites, 25% on bosses
function leechTargetMult(e){
  if(!e) return 1;
  if(e.isBoss||e.isLairBoss||e.brBoss||e.lr||e.rev||e.colossus||e.gj||e.lvBoss||e.mastodon||e.wlord||e.dboss||e.balrog||e.trex||e.prot) return 0.25;
  if(e.elite) return 0.5;
  if(e.magic) return 0.75;
  return 1;
}
function leechHeal(p, dmg, pct){
  if(!(pct>0) || !(dmg>0) || !p.maxHp || p.hp<=0) return;
  let h = Math.min(dmg*pct/100, p.maxHp*LEECH_HIT_CAP_PCT);
  if(p.leechTok==null) p.leechTok = p.maxHp*LEECH_BUDGET_PCT_PER_S;
  h = Math.min(h, p.leechTok); if(h<=0) return;
  p.leechTok -= h;
  p.hp = Math.min(p.maxHp, p.hp + h);
}
// Cleave (Berserker, v56, arc fixed to exactly 180 deg + armor pen added
// in v63): passive, only live while a two-handed weapon is equipped --
// exactly Fury's gear-conditional-swap pattern, just for the opposite
// weapon style (was a standalone CLEAVE button with its own cooldown
// through v55; see furyDualSwordsEquipped below for the mirror case). A
// wide-arc melee sweep with meaningfully more range than a normal Strike
// (reach+62 base) hitting only the 180-degree half-circle in front of the
// character (Strike's cone half-angle is 0.95 rad; Cleave's half-angle is
// exactly pi/2, i.e. a full 180-degree arc centered on the attack
// direction -- not a full 360-degree circle, and not Whirlwind's full
// 360-degree spin either). Damage scales per rank via the standard
// skillMult curve, same as Shield Bash/Shield Throw; each rank also adds
// +5% armor penetration against whatever it hits (see
// CLEAVE_ARMORPEN_PER_RANK, threaded through applyEnemyArmor's extraPen).
const TWOHAND_REACH_BONUS = 10, CLEAVE_RANGE_BONUS = 0, CLEAVE_HALF_ANGLE = 0.78;   // v194: ~120 deg swing in front only, not a half/full circle
const CLEAVE_ATKSPD_PENALTY = 1.6;   // v419: Cleave is a slow, heavy swing again (x1.6 time between swings) -- each hit lands big
const cleaveMult = r=>r>0 ? 3.0 + 0.25*(r-1) : 1;   // v367: tuned so single-target Cleave DPS ~= Fury DPS at every rank (2.75x at rank 1 up to 5x at rank 10)
const CLEAVE_ARMORPEN_PER_RANK = 0.05; // +5% armor pen per rank, up to 25% at rank 5
// Fury (Berserker, v55): passive, only live while BOTH hands hold a
// one-handed sword. Turns the basic Strike into a quick 3-hit combo -- each
// of the 3 hits independently checks range/arc against every enemy, same as
// a normal Strike would once. Damage-per-hit and the extra attack-speed
// bonus (stacked on top of the existing dual-wield bonus) both scale per rank.
const FURY_HITS = 3, FURY_ATKSPD_PER_RANK = 0.02, FURY_HIT_DMG_TUNE = 0.7;   // v419: Fury hits were out-damaging every other class
const FURY_HIT_ANGLE_SPREAD = 0.22; // small angle offset between the 3 combo hits, purely visual
function furyDualSwordsEquipped(p){
  const eq = p.equipment || {};
  return !!(eq.mainhand && eq.mainhand.slotType==='weapon1h' && eq.offhand && eq.offhand.slotType==='weapon1h');
}
// v208: resolves the queued Fury hits one at a time
function processFuryQueue(g, p, dt){
  const q = p.furyQ;
  for(let i=0;i<q.length;i++) q[i].t -= dt;
  while(q.length && q[0].t<=0){
    const h = q.shift();
    if(!furyActive(p) || p.dodging || p.whirlwindT>0){ q.length = 0; break; }
    const target = nearestEnemy(g, p, 76 + (p.weaponReachBonus||0));
    const base = target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y, p.facing.x);
    const off = h.idx===0 ? -0.32 : h.idx===1 ? 0.32 : 0;          // swing in from one side, back from the other, then straight on
    const hitAng = base + off;
    p.facing = {x:Math.cos(base), y:Math.sin(base)}; p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
    p.atkAnimT = h.gap*1.5; p.atkAnimMax = h.gap*1.5;
    p.furyHand = h.idx===1 ? 'off' : 'main'; p.furyHandT = h.gap*1.6;   // v419: hits alternate main-hand / off-hand / main-hand for the sprite
    const isCrit = Math.random()*100 < (p.critChance||0) + (p.rallyT>0 ? RALLY_CRIT_BONUS : 0);
    let dmg = (wpnDmg(p)) * (0.88 + Math.random()*0.24);   // per-hit roll, so each number differs
    if(isCrit) dmg *= critMultOf(p);
    dmg *= assaultDealtMult(p) * weaponDmgMult(p) * swd('fury', h.rank);
    const reach = 67 + (p.weaponReachBonus||0);
    lastHitCrit = isCrit;
    for(const e of g.enemies){
      if(dist(p,e) < reach+e.r){
        const eang = Math.atan2(e.y-p.y, e.x-p.x);
        let diff = Math.abs(eang-hitAng); if(diff>Math.PI) diff = 2*Math.PI-diff;
        if(diff < 0.95){
          e.hp -= applyEnemyArmor(p, e, dmg); e.hitT = 0.15;
          staggerEnemy(e, STAGGER_DUR);
          if(isCrit) hitStop(g, 0.04);
          checkExecute(g, e);
          applyOffensiveStanceBleed(p, e, dmg);
          const kb=5; e.x += Math.cos(eang)*kb; e.y += Math.sin(eang)*kb;
        }
      }
    }
    lastHitCrit = false;
    const slashDist = 32+(p.weaponReachBonus||0)*0.3;
    g.particles.push({type:'slash', x:p.x+Math.cos(hitAng)*slashDist, y:p.y+Math.sin(hitAng)*slashDist, ang:hitAng, t:0.16, max:0.16, crit:isCrit});
  }
}
function furyActive(p){ return ((p.skills && effectiveRank(p,'fury'))||0)>0 && furyDualSwordsEquipped(p); }
// Knight tree: Squire summons follower(s), Commander gives them stances (Attack/Guard).
const FOLLOWER_BASE_DMG = 9, FOLLOWER_ATK_CD = 0.75, FOLLOWER_ATK_REACH = 50; // was 42 -- melee range bump, kept proportional to the player's own basic-melee reach bump below
// Patch (Sept 2026): base/per-level HP doubled (110->220, 10->20) per user
// request ("double the base value health for ... templar squires") -- this
// is the sole consumer of these two constants (see followerMaxHp's Squire
// branch), so doubling them directly is safe and keeps the doubling in
// effect at every player level, not just a flat one-time bump.
const FOLLOWER_BASE_HP = 90, FOLLOWER_HP_PER_LEVEL = 14;   // v214: 120/16 -> 90/14 (Squire was far too tanky)
// // v186: trimmed from 220/20 -- the Squire was tanking whole early zones
const FOLLOWER_FOLLOW_DIST = 55; // Attack stance: idle follow distance behind the Knight
const TAUNT_RANGE = 170;
const FOLLOWER_RESPAWN_TIME = 10; // a fallen follower rejoins after this many seconds, not just on level clear
// v211: a fallen Squire knight is re-summoned after 10s; Commander ranks shorten that to 5s at rank 5. Squire life -10%.
const KNIGHT_RESPAWN_MIN = 5, SQUIRE_HP_MULT = 0.9;
function knightRespawnTime(p){
  const r = clamp((p && p.skills && effectiveRank(p,'squire')) || 0, 0, 5);
  return r>0 ? FOLLOWER_RESPAWN_TIME - (FOLLOWER_RESPAWN_TIME-KNIGHT_RESPAWN_MIN)*(r-1)/4 : FOLLOWER_RESPAWN_TIME;
}
// Necromancer's Raise Dead skeleton minion (v99 fix): noticeably faster
// than the shared FOLLOWER_RESPAWN_TIME every other companion kind
// (Squire/Wolf/Bear) uses -- undead should reknit quickly, not sit on the
// same 10s timer as a living companion. Scoped to skeleton-kind respawns
// only (see the respawn-cd assignment below), so Knight/Wolf/Bear are
// completely unaffected.
const NECRO_SKELETON_RESPAWN_TIME = 3, NECRO_SKELETON_RESPAWN_FREE = 10;   // v319: 3s for 1 soul, or 10s free when you have none
// v239: EVERY fallen follower (knight, wolf, bear, skeleton) waits before it rejoins: 5s at rank 1 of its own skill (Squire / Wolf /
// Bear / Raise Dead), easing to 3s at rank 5. (Before this, knights came
// back instantly -- ensureFollowers topped them up every frame.) Timers live in g.followerPending.
// v416: skeletons return after 10s at rank 1, 5s at rank 5, 3s at rank 10 (straight lines between), no soul cost
function necroSkeletonRespawn(rank){ const r = clamp(rank||1, 1, MAX_EFF_RANK); return r<=5 ? 10 - 5*(r-1)/4 : Math.max(1.5, 5 - 2*(r-5)/5); }
function followerRespawnTime(p, kind, rankOverride){
  const id = kind==='wolf' ? 'companionWolf' : kind==='bear' ? 'companionBear' : kind==='skeleton' ? 'raiseDead' : 'squire';
  if(kind==='skeleton') return necroSkeletonRespawn(rankOverride!=null ? rankOverride : ((p && p.skills && effectiveRank(p,id))||1));
  const r = clamp(rankOverride!=null ? rankOverride : ((p && p.skills && effectiveRank(p,id))||1), 1, 5);
  return 5 - 0.5*(r-1);   // rank 1 = 5s ... rank 5 = 3s
}
function followerPendingCount(g, kind){ return g.followerPending ? g.followerPending.filter(x=>x.kind===kind).length : 0; }
// Squire: ranks 1/3/5 each add a follower (up to 3 total); ranks 2/4 instead
// boost every follower's damage and health. Kept as small lookup functions
// (rather than the generic linear skillMult curve used elsewhere) so the
// follower count and the stat bonus can be read off independently, from a
// single source of truth used everywhere follower count/stats matter.
function squireFollowerCount(rank){
  if(rank<=0) return 0;
  if(rank>=5) return 3;
  if(rank>=3) return 2;
  return 1;
}
function squireStatMult(rank){
  if(rank>=4) return 1.15;   // v214: was 1.3 / 1.15
  if(rank>=2) return 1.08;
  return 1.0;
}
// Formation offsets (radians, relative to the direction opposite the
// player's facing) for however many followers currently exist -- computed
// fresh from each follower's LIVE position in g.followers rather than a
// value stored on the follower object, so a fallen-and-respawned follower
// can never end up sharing another's spot (see the home-position code below).
const FOLLOWER_FORMATION_ANGLES = { 1:[0], 2:[-0.9,0.9], 3:[-1.15,0,1.15] };
function followerHomeAngle(formationIdx, total){
  const angles = FOLLOWER_FORMATION_ANGLES[total] || FOLLOWER_FORMATION_ANGLES[3];
  return angles[formationIdx]!=null ? angles[formationIdx] : 0;
}
// Commander (v56 redesign) is a single 5-rank skill that unlocks the STANCE
// toggle (Attack/Guard) at Rank 1 -- the toggle mechanic itself doesn't
// scale with rank any more. Through v55, additional Commander ranks used to
// also scale Attack-stance damage and Guard-stance block chance/damage
// reduction; that rank-scaling has been removed and replaced with a single
// effect: every additional rank increases every follower's max HP instead
// (see followerMaxHp below, which multiplies by commanderHpMult).
// Guard-stance follower Taunt is no longer tied to Commander at all -- it's
// gated behind the new Guard Stance (templarDefensiveStance) skill instead.
const COMMANDER_HP_PER_RANK = 0.10; // +10% follower max HP per Commander rank
function commanderHpMult(rank){ return rank>0 ? 1 + COMMANDER_HP_PER_RANK*rank : 1; }
// Offensive Stance (Templar, v56): passive. While ranked, the PLAYER's own
// attacks (Strike, and its Cleave/Fury basic-attack variants) apply a Bleed
// DoT to whatever they hit, reusing the same e.bleedT/e.bleedDps mechanism
// every other Bleed source in the game already shares (Wolf companion,
// Commander's Attack-stance followers, Poison Knives, staff fire bolts).
// Both the bleed's own DPS and a flat direct-damage bonus scale per rank.
const OFFENSIVE_STANCE_DMG_PER_RANK = 0.05;       // +5% player attack damage per rank
const OFFENSIVE_STANCE_BLEED_BASE_PCT = 0.20;     // Rank 1: bleed ticks for 20% of the hit's damage/sec...
const OFFENSIVE_STANCE_BLEED_STEP_PER_RANK = 0.06; // ...+6%/sec per additional rank, for BLEED_DUR seconds
// (v120) Offensive Stance now ONLY raises follower damage per rank -- no bleed
// (on followers or the player) and no bonus to the player's own hits.
const OFFENSIVE_STANCE_FOLLOWER_DMG_PER_RANK = 0.10;
function offensiveStanceDmgMult(p){ return 1; } // player hits unaffected (kept for existing call sites)
function offensiveStanceFollowerDmgMult(p){
  const rank = (p && p.skills && effectiveRank(p,'offensiveStance')) || 0;
  return rank>0 ? 1 + OFFENSIVE_STANCE_FOLLOWER_DMG_PER_RANK*rank : 1;
}
function applyOffensiveStanceBleed(p, e, hitDmg){ /* removed in v120 */ }
// (v120) Guard Stance (Templar "defensive stance"): each rank raises followers' max life and defence.
const GUARD_STANCE_HP_PER_RANK = 0.10, GUARD_STANCE_DEF_PER_RANK = 0.04, GUARD_STANCE_RESIST_PER_RANK = 0.08;
function guardStanceResist(p){ const r = (p && p.skills && effectiveRank(p,'templarDefensiveStance')) || 0; return Math.min(0.75, GUARD_STANCE_RESIST_PER_RANK*r); }
function guardStanceHpMult(p){ const r = (p && p.skills && effectiveRank(p,'templarDefensiveStance')) || 0; return 1 + GUARD_STANCE_HP_PER_RANK*r; }
function guardStanceDefense(p){ const r = (p && p.skills && effectiveRank(p,'templarDefensiveStance')) || 0; return Math.min(0.5, GUARD_STANCE_DEF_PER_RANK*r); }
// Guard Stance (Templar, v56 -- internal id templarDefensiveStance, kept
// distinct from the unrelated Defender "Defensive Stance" skill that
// already exists id-wise as `defensiveStance`; displayed as "Guard Stance"
// to avoid any UI confusion between the two). Passive: gates whether a
// Guard-stance follower actually taunts at all -- below Rank 1, being in
// Guard stance is purely a positioning choice with no aggro-pulling effect.
function guardStanceTauntUnlocked(p){ return ((p && p.skills && effectiveRank(p,'templarDefensiveStance')) || 0) > 0; }
const FOLLOWER_ATTACK_SEEK_RANGE = 260;   // Attack stance: how far a follower will hunt for a target, from ITS OWN position
// Attack stance also leashes to the player -- a follower won't engage (or
// will break off from) any target farther than this from the Knight/Hunter,
// so followers can no longer wander off past the edge of the screen chasing
// a fleeing or spread-out enemy.
const FOLLOWER_ATTACK_LEASH_RANGE = 300;
const FOLLOWER_GUARD_ENGAGE_RANGE = 170;  // Guard stance: a follower only engages an enemy within this range of the PLAYER
const FOLLOWER_WANDER_RADIUS = 130;      // (v120) how far followers roam around a stationary player
const FOLLOWER_GUARD_FOLLOW_DIST = 30;    // Guard stance: idle follow distance behind the Knight (tighter than Attack's FOLLOWER_FOLLOW_DIST)
const CAT_LOOT_SEEK_RANGE = 320; // Cat Companion (v81): how far from the PLAYER (not the cat) it'll consider a loot drop worth fetching
const BLEED_DPS_PCT = 0.25; // Attack-stance follower hits apply Bleed: this fraction of the hit's damage, per second...
const BLEED_DUR = 3;        // ...for this many seconds
// A follower that's fallen far behind (chasing something off-screen, or
// wedged behind dungeon geometry) breaks off and teleports back to the
// player rather than staying lost for the rest of the floor.
// v67: this used to be a flat 560 world-unit constant, which in practice
// meant a follower had to fall a genuinely huge distance behind (well
// past being merely off-screen) before the failsafe ever kicked in.
// oneScreenDist() below computes a "roughly one screen's distance" world
// threshold instead, live from the current viewport, so a follower that's
// actually scrolled off the visible play area gets rescued promptly
// rather than needing to be lost far beyond that.
function oneScreenDist(){
  // World-space and screen-space units are roughly the same order of
  // magnitude in this game (BASE_SPEED=170 world-units/sec against a
  // ~390-800px viewport), so the live viewport's own smaller dimension
  // (width, on this portrait-oriented mobile layout -- the tighter,
  // more restrictive of the two axes) is used directly as a reasonable,
  // dynamically-updating (works across resize/rotation) approximation
  // of "one screen's distance" in world units, without needing to fully
  // invert the isometric projection's (ISO_KX/ISO_KY) directional skew
  // for an exact figure that would vary by movement angle anyway.
  return Math.min(W, H) || 390;
}
const FOLLOWER_STUCK_TELEPORT_TIME = 1.0; // was 2.5s -- teleport-back now fires much sooner once past oneScreenDist()
// Catch-up speed multipliers (applied to BASE_SPEED) for a follower
// heading back toward its "home" spot behind the player. Previously a
// flat 1x (in leash range) / 1.25x (beyond leash, "returning") -- since
// the player can also move at BASE_SPEED (or faster with buffs), a
// follower moving at the SAME speed as the player can never actually
// close a gap once it opens up, only just barely keep from falling
// further behind. These are meaningfully higher, and scale up further
// still with how far behind the follower currently is (see catchUpMult
// below), so a trailing follower reliably regains ground under normal
// movement instead of drifting toward the teleport threshold.
const FOLLOWER_CATCHUP_MULT_MIN = 1.3;
const FOLLOWER_CATCHUP_MULT_MAX = 2.4;
const STANCES = ['attack','guard'];
// Rally / "Rallying Cry" (Templar capstone, id kept as 'rally' for save
// compatibility -- only its display name and effects changed in v56):
// snaps followers back to the Knight, resurrects any that have fallen,
// stuns nearby enemies with a shield-slam, heals followers, and grants
// EVERYONE -- the Knight included -- a flat Critical Hit Chance boost
// PLUS (new in v56) a rank-scaled temporary Defense buff (damage
// reduction), for a short window. Rank investment strengthens the stun,
// heal, buff duration, AND now the defense buff's own strength (the crit
// bonus itself stays a fixed amount, not rank-scaled, same as before).
const RALLY_CD = 16;
const RALLY_RANGE = 160;              // enemies within this range of the Knight get stunned
const RALLY_STUN_BASE = 0.8, RALLY_STUN_RANK_STEP = 0.2;      // stun duration
const RALLY_HEAL_PCT_BASE = 0.25, RALLY_HEAL_PCT_RANK_STEP = 0.05; // % of follower max HP healed
const RALLY_CRIT_BONUS = 0; // (v120) Rally no longer grants crit; it grants block chance + defence
const RALLY_BLOCK_BONUS = 0.20; // +20% block chance for you and your followers while the buff is up
const RALLY_CRIT_MULT = 1.8;
const RALLY_BUFF_BASE_DUR = 4, RALLY_BUFF_RANK_STEP = 0.6;    // crit/defense-buff duration
// Rallying Cry's new Defense buff: while p.rallyT is active, both the
// player and all followers take reduced damage -- a straight percentage
// reduction applied alongside (multiplicatively with) any other damage
// reduction already in play (Defensive Stance, Assault's taken-ramp, etc).
const RALLY_DEF_REDUCTION_BASE = 0.15, RALLY_DEF_REDUCTION_RANK_STEP = 0.03; // 15% at rank1, up to 27% at rank5
function rallyDefenseReduction(p){
  const rank = (p && p.skills && effectiveRank(p,'rally')) || 0;
  if(rank<=0 || !(p.rallyT>0)) return 0;
  return RALLY_DEF_REDUCTION_BASE + RALLY_DEF_REDUCTION_RANK_STEP*(rank-1);
}
// Battlecry (Templar, v56): an active BATTLECRY button (own cooldown, same
// convention as Guardian/Assault/Trap) that stuns every enemy in a small
// area centered on the player -- reusing the plain e.stunT field every
// other stun source already uses -- with a circular visual pulse marking
// the exact area (reuses the 'ring' particle type Cleave/Rally already
// draw with, just at Battlecry's own radius/color). It also grants every
// current follower a temporary bonus Crit Chance buff (f.battlecryCritT/
// f.battlecryCritBonus, rolled independently in followerDmg above).
const BATTLECRY_CD = 20, BATTLECRY_RADIUS = 150;
const BATTLECRY_STUN_BASE = 0.6, BATTLECRY_STUN_RANK_STEP = 0.15;
const BATTLECRY_CRIT_BONUS_BASE = 15, BATTLECRY_CRIT_BONUS_RANK_STEP = 5; // flat % crit chance for followers
const BATTLECRY_CRIT_MULT = 1.8;
const BATTLECRY_BUFF_BASE_DUR = 4, BATTLECRY_BUFF_RANK_STEP = 0.5;
// (v120) Battlecry also buffs the PLAYER: bonus damage + crit chance (same crit as followers) for the buff window.
const BATTLECRY_DMG_BASE = 0.15, BATTLECRY_DMG_RANK_STEP = 0.05;
function battlecryDmgMult(p){
  const rank = (p && p.skills && effectiveRank(p,'battlecry')) || 0;
  return rank>0 ? 1 + BATTLECRY_DMG_BASE + BATTLECRY_DMG_RANK_STEP*(rank-1) : 1;
}
// Follower's own damage: base + a slice of player level, scaled by Squire rank,
// with an Attack-stance bonus from Commander rank.
// Follower damage: Knight followers (kind:'knight', the default) scale off
// Squire/Commander/Rally as before. Hunter's Animal Companions (kind:'wolf'
// or 'bear') are a Ranger-only skill line, so they're checked first and use
// their own rank scaling entirely -- squire/commander/rally ids simply won't
// exist on a Ranger's p.skills, but checking f.kind first keeps the two
// systems clearly separate regardless.
// v267: wolves and bears slash in an arc -- their hit also cuts the enemies next to the target.
function packSlash(g, p, f, primary, mult){
  const R = f.kind==='bear' ? PACK_SLASH_R_BEAR : PACK_SLASH_R_WOLF, maxExtra = f.kind==='bear' ? 3 : 2;
  const ang = Math.atan2(primary.y-f.y, primary.x-f.x);
  g.particles.push({type:'slash', x:f.x+Math.cos(ang)*28, y:f.y+Math.sin(ang)*28, ang, t:0.18, max:0.18, crit:false, color:f.kind==='bear' ? '#d9a45a' : '#e8d8d0'});
  let n = 0;
  for(const e of g.enemies){
    if(n>=maxExtra) break;
    if(e===primary || e.hp<=0) continue;
    if(dist(e,primary) > R + e.r) continue;
    const d2 = Math.max(1, followerDmg(p, f)*mult*huntMarkMult(p, e) - (e.armor||0));
    e.hp -= d2; e.hitT = 0.15; markAttacked(e, f); spawnDmgNumber(g, e, d2, false, {follower:1, col:'#9fd0ff'}); checkExecute(g, e);
    g.particles.push({type:'burst', x:e.x, y:e.y, t:0.2, max:0.2, color:f.kind==='bear' ? '#d9a45a' : '#e8d8d0'});
    n++;
  }
  return n;
}
function ambushLand(g, p, f, target, mult){
  const dmg = Math.max(1, followerDmg(p, f)*mult*huntMarkMult(p, target) - (target.armor||0));
  target.hp -= dmg; target.hitT = 0.15; spawnDmgNumber(g, target, dmg, false, {follower:1, col:'#9fd0ff'});
  markAttacked(target, f);
  if(f.kind==='wolf'){
    target.bleedDps = Math.max(target.bleedDps||0, dmg*BLEED_DPS_PCT*partBleedMult()*wolfFuryBleed(p));
    target.bleedT = Math.max(target.bleedT||0, BLEED_DUR);
  }
  g.particles.push({type:'burst', x:target.x, y:target.y, t:0.3, max:0.3, color: f.kind==='bear' ? '#8a6a2a' : '#b4293f'});
  packSlash(g, p, f, target, PACK_SLASH_MULT);
  checkExecute(g, target);
}
function followerDmg(p, f){
  // v83 Commanding (helm prefix, +Follower Damage %): a flat multiplier on
  // every follower type this function computes damage for, applied at
  // every return point below.
  const fdMult = (1 + ((p&&p.followerDmgPct)||0)) * (p&&p.beastFuryT>0 ? BEAST_FURY_PET_DMG : 1);
  if(f.kind==='wolf' || f.kind==='bear'){
    const skillId = f.kind==='wolf' ? 'companionWolf' : 'companionBear';
    const rank = (p.skills && effectiveRank(p,skillId)) || 0;
    const base = f.kind==='wolf' ? HUNTER_WOLF_BASE_DMG : HUNTER_BEAR_BASE_DMG;
    return (base + p.level*1.1) * hunterFollowerStatMult(rank) * fdMult * (1 + BOND_DMG_PER_RANK*((p.skills && effectiveRank(p,'huntersBond'))||0)) * (rank>=BASE_MAX_RANK ? SUMMON_MAX_RANK_DMG : 1);
  }
  // Necromancer (v78): skeleton (Raise Dead) & demon (Demon Bind) minions
  // reuse this exact same per-rank stat curve (hunterFollowerStatMult) as
  // Wolf/Bear -- see this tree's own top comment for why.
  if(f.kind==='skeleton'){
    const rank = (p.skills && effectiveRank(p,'raiseDead')) || 0;
    return (NECRO_SKELETON_BASE_DMG + p.level*1.0) * hunterFollowerStatMult(rank) * fdMult * (1 + NECRO_SKEL_SOUL_DMG*Math.min(SOUL_CAP,p.souls||0)/SOUL_CAP) * (rank>=BASE_MAX_RANK ? SUMMON_MAX_RANK_DMG : 1);
  }
  if(f.kind==='demon'){
    const rank = (p.skills && effectiveRank(p,'demonBind')) || 0;
    return (NECRO_DEMON_BASE_DMG + p.level*1.4) * hunterFollowerStatMult(rank) * fdMult * demonSoulMult(p, DEMON_DMG_PER_10) * (rank>=BASE_MAX_RANK ? SUMMON_MAX_RANK_DMG : 1);
  }
  const squireRank = (p.skills && effectiveRank(p,'squire')) || 0;
  let dmg = (FOLLOWER_BASE_DMG + p.level*1.1) * offensiveStanceFollowerDmgMult(p) * templarFollowerMult(p, f); // (v124) Squire ranks add life only; damage comes from Offensive Stance
  // Rally/Rallying Cry: while the post-rally buff window is active, followers
  // get a flat chance (same for everyone, not rank-scaled) to land a
  // bonus-damage crit.
  const rallyRank = (p.skills && effectiveRank(p,'rally')) || 0;
  if(rallyRank>0 && p.rallyT>0){
    if(Math.random()*100 < RALLY_CRIT_BONUS) dmg *= RALLY_CRIT_MULT;
  }
  // Battlecry (Templar, v56): a separate, shorter-lived crit-chance buff on
  // this specific follower, granted by the Battlecry active skill. Rolled
  // independently of the Rally crit roll above -- a follower could in
  // theory have both buffs up at once, each with its own independent roll.
  if((f.battlecryCritT||0) > 0 && (f.battlecryCritBonus||0) > 0){
    if(Math.random()*100 < f.battlecryCritBonus) dmg *= BATTLECRY_CRIT_MULT;
  }
  if((f.battlecryCritT||0) > 0) dmg *= battlecryDmgMult(p);
  if((f.kind||'knight')==='knight'){ const kg = knightGear(p); if(kg.dmg || kg.dmgPct) dmg = (dmg + kg.dmg*0.75) * (1 + kg.dmgPct/100); }   // v383 Knighthood
  return dmg * fdMult;
}
// A follower's current max HP, recomputed fresh from level/rank -- used both
// when first summoning one (makeFollower) and when re-syncing existing
// followers' HP after a level-up or floor transition.
// (v124) Minion life keeps pace with enemy scaling: a baseline that grows with level at every rank,
// plus a bonus at MAX rank (a build that fully commits to minions).
const KNIGHT_HP_SCALE_SHARE = 0.2, MINION_HP_SCALE_SHARE = 0.45, MINION_MAX_RANK_HP_BONUS = 1.2;
function minionHpScale(p, f){
  const id = f.kind==='wolf' ? 'companionWolf' : f.kind==='bear' ? 'companionBear' : f.kind==='skeleton' ? 'raiseDead' : f.kind==='demon' ? 'demonBind' : f.kind==='cat' ? null : 'squire';
  const knight = (id==='squire');
  let m = 1 + (mlHpMult(p.level)-1)*(knight ? KNIGHT_HP_SCALE_SHARE : MINION_HP_SCALE_SHARE);   // v214: knights scale far more gently with level
  const rank = id ? ((p.skills && effectiveRank(p,id)) || 0) : 0;
  if(id==='companionWolf' || id==='companionBear') m *= 1 + BOND_HP_PER_RANK*((p.skills && effectiveRank(p,'huntersBond'))||0);
  if(rank >= BASE_MAX_RANK && !knight) m *= MINION_MAX_RANK_HP_BONUS;
  if(p.krakenSlain && f.kind!=='cat') m *= 1.5;   // v456: after the first Runestone, minions are much sturdier   // v214: no max-rank life multiplier for Squire
  return m;
}
// v213: a knight's max life for a given Squire rank at the player's current level (same maths as followerMaxHp) -- for tooltips
function knightLifeAtRank(p, rank){
  const cmd = (p.skills && effectiveRank(p,'squire')) || 0;
  const sc = 1 + (mlHpMult(p.level)-1)*KNIGHT_HP_SCALE_SHARE;
  return Math.round(Math.round((FOLLOWER_BASE_HP + FOLLOWER_HP_PER_LEVEL*p.level) * SQUIRE_HP_MULT * squireStatMult(rank) * commanderHpMult(cmd) * guardStanceHpMult(p)) * sc);
}
function socketChance(L){ return L<20 ? 0 : L<=30 ? 0.10 + 0.015*(L-20) : Math.min(0.32, 0.25 + 0.0025*(L-30)); }   // v456
function followerMaxHp(p, f){ return Math.round(followerMaxHpBase(p, f) * minionHpScale(p, f)); }
function followerMaxHpBase(p, f){
  if(f.kind==='wolf' || f.kind==='bear'){
    const skillId = f.kind==='wolf' ? 'companionWolf' : 'companionBear';
    const rank = (p.skills && effectiveRank(p,skillId)) || 0;
    // Patch (Sept 2026): HUNTER_COMPANION_HP_BASE_MULT doubles this base for
    // both companion kinds -- see its own comment above for why it's a
    // separate multiplier here rather than a change to the shared constants.
    const base = (HUNTER_FOLLOWER_BASE_HP + HUNTER_FOLLOWER_HP_PER_LEVEL*p.level) * HUNTER_COMPANION_HP_BASE_MULT;
    if(f.kind==='bear') return Math.round(base * HUNTER_BEAR_HP_MULT * hunterBearHpMult(rank) * SUMMON_HP_MULT);
    return Math.round(base * hunterFollowerStatMult(rank) * SUMMON_HP_MULT);
  }
  if(f.kind==='skeleton'){
    const rank = (p.skills && effectiveRank(p,'raiseDead')) || 0;
    const base = HUNTER_FOLLOWER_BASE_HP + HUNTER_FOLLOWER_HP_PER_LEVEL*p.level;
    return Math.round(base * NECRO_SKELETON_HP_MULT * hunterFollowerStatMult(rank));
  }
  if(f.kind==='demon'){
    const rank = (p.skills && effectiveRank(p,'demonBind')) || 0;
    const base = HUNTER_FOLLOWER_BASE_HP + HUNTER_FOLLOWER_HP_PER_LEVEL*p.level;
    return Math.round(base * NECRO_DEMON_HP_MULT * hunterFollowerStatMult(rank));
  }
  const squireRank = (p.skills && effectiveRank(p,'squire')) || 0;
  const cmdRank = (p.skills && effectiveRank(p,'squire')) || 0;
  const kgH = knightGear(p);
  return Math.round((FOLLOWER_BASE_HP + FOLLOWER_HP_PER_LEVEL*p.level) * SQUIRE_HP_MULT * squireStatMult(squireRank) * commanderHpMult(cmdRank) * guardStanceHpMult(p)) + Math.round(kgH.hp + kgH.armor*1.5);
}
function makeFollower(p, idx, kind){
  kind = kind || 'knight';
  const r = kind==='wolf' ? HUNTER_WOLF_R : kind==='bear' ? HUNTER_BEAR_R : kind==='skeleton' ? NECRO_SKELETON_R : kind==='demon' ? NECRO_DEMON_R : kind==='cat' ? CAT_R : 13;
  const f = {
    idx, kind, type:(kind==='skeleton' ? 'skeleton' : undefined), x:p.x, y:p.y, r, hp:1, maxHp:1, battlecryCritT:0, battlecryCritBonus:0,
    stance: (game && game.followerStance) || 'attack', hitT:0, animT:0, facing:{x:1,y:0}, faceSign:1, moving:false,
    atkCd:0, taunting:false,
  };
  f.hp = f.maxHp = followerMaxHp(p, f);
  return f;
}
// Adds/removes followers of one specific kind ('knight'/'wolf'/'bear') so the
// three follower systems (Squire, Animal Companion: Wolf, Animal Companion:
// Bear) can each be synced to their own wanted count without disturbing the
// other kinds already present in the shared g.followers array.
function syncFollowerKind(g, kind, wanted){
  const p = g.player;
  if(!g.followers) g.followers = [];
  let have = g.followers.filter(f=>(f.kind||'knight')===kind).length;
  while(have < wanted){ g.followers.push(makeFollower(p, g.followers.length, kind)); have++; }
  if(have > wanted){
    let toRemove = have - wanted;
    for(let i=g.followers.length-1; i>=0 && toRemove>0; i--){
      if((g.followers[i].kind||'knight')===kind){ g.followers.splice(i,1); toRemove--; }
    }
  }
}
// Spawns/trims g.followers to match how many Squire rank currently grants (0-3),
// plus one Wolf and/or one Bear companion once those Hunter skills are ranked.
function ensureFollowers(g){
  const p = g.player;
  if(!g.followers) g.followers = [];
  const _fresh = g.followers.length===0 && p._fSnap && p._fSnap.length && p._fSnapRoom!==g.room;   // v453: only after an actual zone change, never on a plain respawn   // v409: a zone change just wiped the list -- restore life values afterwards
  const squireRank = (p.skills && effectiveRank(p,'squire')) || 0;
  syncFollowerKind(g, 'knight', Math.max(0, squireFollowerCount(squireRank) - followerPendingCount(g,'knight')));
  // Summon Wolf (v59, converted back to passive in latest update): auto-summoned
  // whenever ranked, with a second wolf joining at Rank 5. A fallen wolf respawns
  // after a short delay (see wolfRespawnCd handling in update()) rather than staying
  // gone until level clear. Unlike the shared FOLLOWER_RESPAWN_TIME, wolves respawn
  // on their own 5-second timer per this skill's mechanics.
  const wolfRank = (p.skills && effectiveRank(p,'companionWolf')) || 0;
  const wolfWanted = wolfRank>0 ? (wolfRank>=5 ? 2 : 1) : 0;
  syncFollowerKind(g, 'wolf', Math.max(0, wolfWanted - followerPendingCount(g,'wolf')));
  const bearRank = (p.skills && effectiveRank(p,'companionBear')) || 0;
  syncFollowerKind(g, 'bear', Math.max(0, (bearRank>0 ? (uq(p,'uq_hunter') ? 2 : 1) : 0) - followerPendingCount(g,'bear')));
  // Necromancer (v78): Raise Dead maintains up to N standing skeleton
  // minions, synced off its own rank the same way Wolf/Bear are synced
  // off theirs -- see this tree's Raise Dead comment for the "standing
  // minions vs. corpse reanimation" judgment call. squireFollowerCount's
  // curve (1 at Rank1/2, 2 at Rank3/4, 3 at Rank5) already matches "up to
  // 3 minions at max rank" exactly, so it's reused verbatim.
  const raiseDeadRank = (p.skills && effectiveRank(p,'raiseDead')) || 0;
  syncFollowerKind(g, 'skeleton', Math.max(0, necroSkeletonCount(raiseDeadRank) + (raiseDeadRank>0 && uq(p,'uq_necromancer') ? 2 : 0) - followerPendingCount(g,'skeleton') - (p.skelDown||0)));
  // Cat Companion (v81): NOT a skill -- purely the account-wide Support
  // submenu toggle (settings.catCompanion), so unlike every other kind
  // above this doesn't read p.skills at all. Synced here the same way so
  // it appears/disappears on the next scene load, and also called
  // directly from the toggle's own click handler so it takes effect
  // immediately without waiting for one.
  syncFollowerKind(g, 'cat', (settings.catCompanion && settings.catOwned) ? 1 : 0);
  if(_fresh){
    const snap = p._fSnap.map(x=>x);
    const take = k => { const i = snap.findIndex(x=>x.kind===k); return i>=0 ? snap.splice(i,1)[0] : null; };
    for(const f of g.followers){ const sn = take(f.kind||'knight'); if(sn && sn.maxHp>0 && f.maxHp>0) f.hp = clamp(Math.round(sn.hp/sn.maxHp*f.maxHp), 1, f.maxHp); }
    // the bound demon (never auto-synced) comes along too, with the life it had, at no soul cost
    const dn = take('demon');
    if(dn && ((p.skills && effectiveRank(p,'demonBind'))||0)>0 && !g.followers.some(f=>f.kind==='demon')){
      const nf = makeFollower(p, g.followers.length, 'demon'); nf.x = p.x; nf.y = p.y;
      if(dn.maxHp>0 && nf.maxHp>0) nf.hp = clamp(Math.round(dn.hp/dn.maxHp*nf.maxHp), 1, nf.maxHp);
      g.followers.push(nf);
    }
  }
  // Demon Bind's demon is deliberately NOT synced here -- it's summoned
  // on-demand when the player's souls cross the 10-soul threshold (see
  // checkDemonBindThreshold) and only ever removed when it dies or is
  // Sacrificed, never auto-trimmed/regrown by a rank change the way the
  // other companion kinds above are (so a respec or a rank change never
  // yanks an already-summoned demon away mid-fight).
}
// Demon Bind (Necromancer, v78): called every time Soul Sap generates
// souls, right after the soul count is updated -- the cleanest point to
// detect the threshold-crossing without a separate per-frame poll. Once
// Demon Bind has a rank AND souls are at/above the threshold AND no demon
// is currently out, consumes DEMON_BIND_SOUL_THRESHOLD souls and summons
// one -- see this skill's own top comment for why crossing the threshold
// consumes the souls (prevents instant re-trigger spam) and why only one
// demon can ever be out at a time.
function checkDemonBindThreshold(g){
  const p = g.player;
  const rank = (p.skills && effectiveRank(p,'demonBind')) || 0;
  if(rank<=0) return;
  if((p.souls||0) < DEMON_BIND_SOUL_THRESHOLD) return;
  if(!g.followers) g.followers = [];
  if(g.followers.some(f=>f.kind==='demon')) return;
  p.souls -= DEMON_BIND_SOUL_THRESHOLD;
  const nf = makeFollower(p, g.followers.length, 'demon');
  nf.x = p.x; nf.y = p.y;
  g.followers.push(nf);
  showMsg('A demon rises to serve you!', 1.2);
  g.particles.push({type:'burst', x:p.x, y:p.y, t:0.4, max:0.4, color:'#b4293f'});
}
// Monster targeting (v63 rework), in this exact priority order:
//   1. A taunting follower within TAUNT_RANGE (e.g. the Hunter's Bear, or
//      a Templar follower in Guard Stance once Guard Stance is ranked) --
//      always wins, no matter who's hitting this monster or how close
//      anyone else is.
//   2. Whoever is CURRENTLY, ACTIVELY attacking this monster (player or a
//      follower) gets attacked back -- an aggro-swap onto whoever's
//      actually hitting it. "Currently" is tracked via a short rolling
//      window (e.markAttacked/e.lastAttackedT, set at every damage source
//      -- see markAttacked below) rather than a single last-hit flag, so
//      it reads as "still fighting me" for as long as the hits keep
//      landing, and lapses back to tier 3 a couple seconds after they stop.
//   3. Otherwise, the CLOSEST valid target -- the player, or any follower
//      (this is the fix for the old bug where monsters only ever
//      considered the player here, never a follower).
// Vanish (see VANISH_* below) works by simply making the player an invalid
// candidate everywhere in here for its duration -- it does NOT freeze
// enemies; they just fall through to tier 2/3 like normal, which usually
// means a follower that's fighting them, or the nearest follower. If
// nothing is valid at all (vanished with no followers out), this returns
// null and the caller treats the monster as having nothing to do.
const ATTACKER_AGGRO_WINDOW = 2.5; // how long a monster keeps "aggro-swap" priority on whoever just hit it
function markAttacked(e, attacker){
  if(!e || !attacker) return;
  e.lastAttacker = attacker;
  e.lastAttackedT = ATTACKER_AGGRO_WINDOW;
}
// v454 Mirage (Survivalist): a dodge leaves an image of you where it started; nearby enemies go after it until it fades
function mirageDur(r){ r = Math.max(1, r||1); return Math.min(7, 3 + 3*(r-1)/9); }
function mirageCd(r){ r = Math.max(1, r||1); return Math.max(9, 15 - 5*(r-1)/9); }
const MIRAGE_PULL = 420;
function mirageOnDodge(g, p){
  const r = (p.skills && effectiveRank(p,'mirage'))||0;
  if(r<=0 || p.mirageCd>0 || !g || !g.room) return;
  p.mirageCd = mirageCd(r);
  const d = skDur(p, mirageDur(r));
  g.mirage = {x:p.x, y:p.y, r:p.r||14, hp:1, maxHp:1, kind:'mirage', t:d, max:d, facing:{x:p.facing.x, y:p.facing.y}, faceSign:p.faceSign||1, born:(g.clock||0)};
  g.particles.push({type:'burst', x:p.x, y:p.y, t:0.35, max:0.35, color:'#cfe6ff'});
}
// v456: when a bandit or goblin dies, each nearby bandit/goblin (never brutes) may flee for a moment (v476: bandits 25%, goblins 50%)
const MORALE_TYPES = {bandit:1, banditarcher:1, goblin:1, goblinarcher:1};
function moraleBreak(g, dead){
  if(!MORALE_TYPES[dead.type]) return;
  for(const o of g.enemies){
    if(o===dead || !(o.hp>0) || !MORALE_TYPES[o.type] || o.elite || dist(o,dead) > 380) continue;
    if(Math.random() < (/^bandit/.test(o.type) ? 0.25 : 0.5)){ o.fearT = Math.max(o.fearT||0, 2 + Math.random()); o.windT = 0; g.particles.push({type:'burst', x:o.x, y:o.y-10, t:0.3, max:0.3, color:'#ffe08a'}); }
  }
}
function pickEnemyTarget(g, e){
  const p = g.player;
  if(e.tauntBy && (g.clock||0) < (e.tauntUntil||0) && e.tauntBy.hp>0 && g.followers && g.followers.includes(e.tauntBy)) return e.tauntBy;   // v455 bear roar
  if(g.mirage && g.mirage.t>0 && !(e.isBoss || e.isLairBoss || isHeavyEnemy(e)) && dist(e, g.mirage) < MIRAGE_PULL) return g.mirage;
  const playerVanished = p.vanishT>0;
  // Tier 0 (v338): Guardian taunt -- every non-boss enemy inside the ring has to attack you while it lasts.
  if(p.guardianT>0 && !playerVanished && p.hp>0 && !(e.isBoss || e.isLairBoss) && dist(e,p) < GUARDIAN_PULL_R*aoeRadiusMult(p)+e.r) return p;
  // Tier 1: a taunting follower in range.
  if(g.followers && g.followers.length && !(e.isBoss || e.isLairBoss)){
    let best = null, bestD = Infinity;
    for(const f of g.followers){
      if(!f.taunting) continue;
      const d = dist(e, f);
      if(d < TAUNT_RANGE && d < bestD){ bestD = d; best = f; }
    }
    if(best) return best;
  }
  // v490 threat: enemies go for the CLOSEST ally (you or a follower). Damage builds threat on whoever dealt it (fading over a few
  // seconds); someone else only pulls the monster off its closest target with a lot more threat -- about a quarter of its life.
  const th = threatTick(g, e);
  const cands = [];
  if(!playerVanished && p.hp>0) cands.push(p);
  if(g.followers) for(const f of g.followers){ if(f.kind!=='cat' && f.hp>0) cands.push(f); }
  if(!cands.length) return null;
  let closest = null, cd = Infinity;
  for(const c of cands){ const d = dist(e,c) + ((c===p ? enemyLOS(g,e,c) : hasLOS(g,e,c)) ? 0 : 500); if(d < cd){ cd = d; closest = c; } }
  // stick with the current target unless the new closest is clearly closer (no ping-ponging between two allies)
  if(e._tgt && e._tgt!==closest && cands.includes(e._tgt) && dist(e,e._tgt) < cd + 70) closest = e._tgt;
  const base = th.get(closest)||0, need = Math.max(25, (e.maxHp||100)*THREAT_STEAL_FRAC);
  let best = closest, bt = base + need;
  for(const c of cands){ const v = th.get(c)||0; if(c!==closest && v >= bt){ bt = v; best = c; } }
  e._tgt = best;
  return best;
}
const THREAT_STEAL_FRAC = 0.25, THREAT_FADE = 4;   // v490: extra threat needed (share of the monster's life) / fade time in seconds
function threatTick(g, e){
  const th = e.threat || (e.threat = new Map()), now = g.clock||0;
  const dt = Math.max(0, now - (e._thT==null ? now : e._thT)); e._thT = now;
  if(dt>0){ const k = Math.exp(-dt/THREAT_FADE); for(const [c,v] of th){ const nv = v*k; if(nv < 1 || !(c.hp>0)) th.delete(c); else th.set(c, nv); } }
  if(e._thHp==null) e._thHp = e.hp;
  const lost = e._thHp - e.hp; e._thHp = e.hp;
  if(lost>0 && e.lastAttacker && (e.lastAttackedT||0)>0) th.set(e.lastAttacker, (th.get(e.lastAttacker)||0) + lost);
  return th;
}
