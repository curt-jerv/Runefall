// Damage types: normal (armor + evasion), fire, cold, lightning, poison (resists). Unlisted = normal.
// Rule: an element monster deals its own element's damage.
// ---- v271 elemental statuses on the player and followers ----
// Fire hits Burn, cold hits Chill (slow), poison hits Poison (damage over time). Statuses come from the attacker's damage type,
// plus a few types that hit physically but carry an ailment (crocodiles poison; polar bears chill).
const STATUS_EXTRA = { poisonwalker:'poison', poisonsnake:'poison', alligator:'poison', frozenzombie:'cold', fhdwarf:'cold', fhcleric:'cold', fhaxe:'cold', fhbrute:'cold', fhtemplar:'cold' };
const PSTAT_BURN_DUR = 3, PSTAT_BURN_PCT = 0.12, PSTAT_POISON_DUR = 5, PSTAT_POISON_PCT = 0.08, PSTAT_CHILL_DUR = 2.5, PLAYER_CHILL_MULT = 0.7;
function enemyStatusEl(e){
  if(!e) return null;
  const d = e.dmgType;
  if(d==='fire' || d==='cold' || d==='poison') return d;
  if(e.dmgSplit==='fire' || e.dmgSplit==='cold' || e.dmgSplit==='poison') return e.dmgSplit;
  if(e.variant==='polar') return 'cold';
  return STATUS_EXTRA[e.type] || null;
}
// v365: cold resist makes chill less likely and shorter, but never impossible: 100% chance at 0 resist down to 20% at max resist
function coldChillFrac(p){ const cap = (typeof maxResistPct==='function' ? maxResistPct(p) : 75) || 75; return clamp(elementResist(p,'cold')/cap, 0, 1); }
function coldChillChance(p){ return 1 - 0.8*coldChillFrac(p); }
function applyStatusToPlayer(p, src, base){
  const el = enemyStatusEl(src); if(!el || !(base>0)) return;
  const raw = (src.dmgType===el || src.dmgSplit===el) ? 1 : (1 - elementResist(p, el)/100);   // elemental hits were already cut by resist
  const dps = base*raw;
  if(el==='fire'){ if(p.immolateT>0) return; p.burnT = Math.max(p.burnT||0, PSTAT_BURN_DUR); p.burnDps = Math.max(p.burnDps||0, dps*PSTAT_BURN_PCT); }
  else if(el==='poison'){ p.poisonT = Math.max(p.poisonT||0, PSTAT_POISON_DUR); p.poisonDps = Math.max(p.poisonDps||0, dps*PSTAT_POISON_PCT); }
  else if(el==='cold'){ if(!p.slowImmune && p._chillOk!==false) p.chillT = Math.max(p.chillT||0, PSTAT_CHILL_DUR*(1-0.5*coldChillFrac(p))); }
}
function applyStatusToFollower(f, src, dmg){
  const el = enemyStatusEl(src); if(!el || !(dmg>0)) return;
  if(el==='fire'){ f.burnT = Math.max(f.burnT||0, PSTAT_BURN_DUR); f.burnDps = Math.max(f.burnDps||0, dmg*PSTAT_BURN_PCT); }
  else if(el==='poison'){ f.poisonT = Math.max(f.poisonT||0, PSTAT_POISON_DUR); f.poisonDps = Math.max(f.poisonDps||0, dmg*PSTAT_POISON_PCT); }
  else if(el==='cold'){ f.chillT = Math.max(f.chillT||0, PSTAT_CHILL_DUR); }
}
function tickPlayerStatuses(p, dt){
  if(p.chillT>0){ p.chillT -= dt; if(p.chillT<0) p.chillT = 0; }
  let dot = 0;
  if(p.burnT>0){ p.burnT -= dt; dot += p.burnDps||0; if(p.burnT<=0){ p.burnT = 0; p.burnDps = 0; } }
  if(p.poisonT>0){ p.poisonT -= dt; dot += p.poisonDps||0; if(p.poisonT<=0){ p.poisonT = 0; p.poisonDps = 0; } }
  if(dot>0 && p.hp>0 && game && !game.over){
    p.hp -= dot*dt;
    if(p.hp<=0){ if(!unbreakableSave(game, p)){ p.hp = 0; endGame(game); } }
  }
}
// returns true if the follower died from the tick (and was removed)
function followerStatusTick(g, f, dt){
  if(f.chillT>0){ f.chillT -= dt; if(f.chillT<0) f.chillT = 0; }
  const bt = f.burnT>0, pt = f.poisonT>0;
  if(!bt && !pt) return false;
  if(bt) f.burnT -= dt; if(pt) f.poisonT -= dt;
  f.dotAcc = (f.dotAcc||0) + dt;
  if(f.dotAcc >= 0.5){
    const dps = (bt ? (f.burnDps||0) : 0) + (pt ? (f.poisonDps||0) : 0);
    f.dotAcc = 0;
    applyFollowerDamage(g, f, dps*0.5, null);
    if(g.followers.indexOf(f)<0) return true;
  }
  return false;
}
// Tint + flames. Tints (blue chill / green poison) are composited onto an offscreen copy of the sprite so only the body is coloured.
let _statusOff = null, _statusDepth = 0, _hpQueue = null;
// v487: tinted monsters rotate through a few scratch canvases (re-using one canvas for every monster stalls phone GPUs);
// on Low quality they skip the scratch canvas and get a coloured ring at their feet instead
// (only the first few per frame get the full tint -- High 24, Medium 10 -- the rest get the ring too)
const _statusPool = []; let _statusIx = 0, _statusUsed = 0;
function drawStatusRing(ent, chill){
  const io = toIso(ent.x, ent.y), r = ent.r||14;
  ctx.save(); ctx.globalAlpha = 0.6; ctx.strokeStyle = chill ? '#4aa8ff' : '#4fe04a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(io.x, io.y, r*1.3, r*0.6, 0, 0, 7); ctx.stroke(); ctx.restore();
}
function drawBurnFx(ent, iso){
  // v296: every burning creature gets the same subtle look as the player: a few small licks of flame, no glow (scaled a little by size)
  const ck = (game&&game.clock)||0;
  ctx.save();
  const sc = Math.max(0.8, Math.min(2.2, (ent.r||16)/16));
  const n = sc>1.6 ? 4 : 3, spread = 7*Math.max(1, sc*0.8), seed = (ent.x||0)*0.011;
  for(let i=0;i<n;i++){
    const u = (ck*1.5+i/n+seed)%1, bx = iso.x+(i-(n-1)/2)*spread+Math.sin(ck*8+i*2.1)*1.6*sc, by = iso.y-14*sc-(i===1?8:0)*sc-u*16*sc;
    const h = (1-u*0.55)*11*sc, wd = (1-u)*3.6*sc+0.8;
    ctx.globalAlpha = Math.min(0.95, 1.2*(1-u));
    ctx.fillStyle = u<0.35 ? '#ff3a1a' : u<0.7 ? '#ff7a26' : '#ffb84a';
    ctx.beginPath(); ctx.moveTo(bx,by-h); ctx.quadraticCurveTo(bx+wd,by-h*0.3,bx,by); ctx.quadraticCurveTo(bx-wd,by-h*0.3,bx,by-h); ctx.fill();
  }
  ctx.restore();
}
function drawWithStatus(ent, drawFn, allowTint){
  const chill = ent.chillT>0, poison = ent.poisonT>0, burn = ent.burnT>0 || ent.immolateT>0;
  if(!(allowTint && (chill||poison)) || _statusDepth>0 || _statusUsed >= (gfxLevel===2 ? 24 : gfxLevel===1 ? 10 : 0)){ drawFn(); if(_statusDepth===0){ if(allowTint && (chill||poison)) drawStatusRing(ent, chill); if(burn) drawBurnFx(ent, toIso(ent.x, ent.y)); if(ent.charges>0) drawChargeFx(ent, toIso(ent.x, ent.y)); } return; }
  const iso = toIso(ent.x, ent.y), r = ent.r||14;
  const bw = r*5+110, bh = r*7+120, bx = iso.x-bw/2, by = iso.y-bh+40;
  const m = ctx.getTransform(), sx = Math.abs(m.a)||1, sy = Math.abs(m.d)||1;
  const pw = Math.ceil(bw*sx), ph = Math.ceil(bh*sy);
  _statusUsed++; _statusIx = (_statusIx+1) % 6;
  _statusOff = _statusPool[_statusIx] || (_statusPool[_statusIx] = document.createElement('canvas'));
  if(_statusOff.width<pw || _statusOff.height<ph){ _statusOff.width = Math.max(_statusOff.width,pw); _statusOff.height = Math.max(_statusOff.height,ph); }
  const octx = _statusOff.getContext('2d');
  octx.setTransform(1,0,0,1,0,0); octx.globalCompositeOperation = 'source-over'; octx.globalAlpha = 1; octx.clearRect(0,0,_statusOff.width,_statusOff.height);
  octx.setTransform(sx,0,0,sy,-bx*sx,-by*sy);
  const mainCtx = ctx; _statusDepth++; _hpQueue = [];
  const q = _hpQueue;
  ctx = octx;
  try{ drawFn(); } finally { ctx = mainCtx; _statusDepth--; _hpQueue = null; }
  octx.save(); octx.setTransform(sx,0,0,sy,-bx*sx,-by*sy); octx.globalCompositeOperation = 'source-atop';
  if(chill){ octx.globalAlpha = 0.5; octx.fillStyle = '#4aa8ff'; octx.fillRect(bx,by,bw,bh); }
  if(poison){ octx.globalAlpha = 0.5; octx.fillStyle = '#4fe04a'; octx.fillRect(bx,by,bw,bh); }
  octx.restore();
  ctx.drawImage(_statusOff, 0, 0, pw, ph, bx, by, pw/sx, ph/sy);
  for(const a of q) drawHpBar(a[0],a[1],a[2],a[3],a[4]);
  if(burn) drawBurnFx(ent, iso);
  if(ent.charges>0) drawChargeFx(ent, iso);
}
const RANGED_AIM_DELAY = 0.9, RANGED_STILL_T = 0.55;   // v490: RANGED_STILL_T = seconds stood still before a shot   // seconds of clear line of sight before an archer/spider may fire
const ENEMY_DMG_SPLIT = { fhdwarf:'cold', fhbrute:'cold', fhaxe:'cold', fhcleric:'cold', fhtemplar:'cold', raptor:'fire', firebat:'fire' };   // v484
const ENEMY_DMG_TYPE = { shadowghoul:'lightning', zombie:'poison', leviathan:'poison', anaconda:'poison', stormsnake:'lightning', giantoad:'poison', poisonplant:'poison', sandsnake:'poison', lightningraptor:'fire', balrog:'fire', gojira:'fire', lavabeetle:'fire', firebat:'fire', magmacrawler:'fire', colossus:'fire' };
// XP curve: gentler than before, and a kill's XP is a fixed slice of the ML's level-up cost.
function xpForLevel(L){ const base = L<=28 ? 92*Math.pow(1.20, L-1) : 92*Math.pow(1.20, 27)*Math.pow(1.09, L-28); return Math.floor(base * (L>=3 && L<=14 ? 1.1 : 1)); }   // v492: levels 3-14 need 10% more xp   // v433: Diablo 2 shape -- ~20%/level early, then ~9%/level from level 28 on
// v219 pace: kills to level at on-level monsters = 40 + 3*level (was 14 + 0.5*level), bosses worth more,
// and XP falls steeply once the character is more than 3 levels above the monster (x0.72 per extra level, floor 3%).
const XP_KILLS_A = 40, XP_KILLS_B = 3, XP_BOSS_MULT = 15, XP_ELITE_MULT = 5, XP_MAGIC_MULT = 2.5;
const XP_KILLS_GROWTH = 1.05;   // v433: kills needed per level grow 5% per monster level past 15 (L40 ~290, L60 ~770, L80 ~2000 kills per level)
function xpKillsPerLevel(ml){ return ml<=15 ? Math.round(20.7 + 4.29*ml) : Math.round(85*Math.pow(XP_KILLS_GROWTH, ml-15)); }   // v230: a quicker early game (25 kills at ML1, same as before from ML15)
const XP_GLOBAL_MULT = 1.10, XP_UNDER_BONUS = 0.15, XP_UNDER_CAP = 5;   // v237: +10% XP overall; +15% per level the monster is above you (max +75%)
function xpForKill(ml, boss){ const base = xpForLevel(ml) / xpKillsPerLevel(ml) * XP_GLOBAL_MULT; return Math.max(1, Math.round(base * (boss ? XP_BOSS_MULT : 1))); }
function xpLevelMult(playerLevel, ml){ const diff = (playerLevel||1) - (ml||1); if(diff<0) return (ml||1) >= 30 ? 1 : 1 + XP_UNDER_BONUS*Math.min(-diff, XP_UNDER_CAP);   // v433: no under-level catch-up bonus in level 30+ zones
  if(diff<=3) return 1; return Math.max(0.03, Math.pow(0.72, diff-3));   // v289: harsh past a 3-level grace (x0.72 per level over: 72%, 52%, 37%, 27%, 19% ... floor 3%)
}
// ---- v88 (reframed v90): direct character-level monster scaling --------
// Several overworld/lair zones (Dark Forest, Sunlit Plains, Mountain Pass,
// Lakeside Ruins, Cursed Cemetery, Spider Lair, Bear Cave, Dark Crypt) used
// to assign g.depth a FIXED constant on entry, decoupled from the
// character's level -- meaning monster difficulty in those zones never
// moved, so a zone visited well past its intended level became trivial
// (or, visited too early, crushingly hard). v88 fixed that by computing
// g.depth from the player's level via an effectiveDepth() helper.
//
// v90: per the user's design call ("depth" is a vestigial concept for
// these 8 zones now that the game is mostly overworld, not a dungeon-
// crawl about going deeper -- both item power and monster scaling should
// just key off character level directly), the old effectiveDepth() name
// is retired in favor of zoneMonsterLevel() below: SAME exact formula,
// SAME numeric output at every level (verified with a Node comparison
// script across levels 1-90 for every zone baseline -- see README
// "Version 90"), just named/commented as a direct "what monster level
// should this zone use for a character at this level" question instead of
// an artificial "depth" one. g.depth ITSELF is intentionally still
// populated with this value (not removed or renamed) -- other systems
// (loot gold-pile scaling, XP-on-kill scaling, isBossFloor() floor-guard
// detection, the death screen's "Depth" readout, genRoom() sizing for the
// Spider Lair/Bear Cave) all still read g.depth and were NOT audited/
// touched here, so keeping the field itself is the low-risk choice: it
// changes nothing for any of those call sites, only how the number
// flowing INTO g.depth for these 8 zones is computed and talked about.
// The Abandoned Mine and Lighthouse Tower are completely untouched -- they
// still set g.depth from their own genuine floor/checkpoint progression
// (see enterMine/enterLighthouseTower), never from this function.
//
// MONSTER_LEVEL_STEP_K (was ZONE_DEPTH_LEVEL_K): calibrated (see the Node
// TTK/TTL simulation in README "Version 88") against the real spawnEnemy
// stat formulas, the real player HP/level curve
// (BASE_MAXHP+HP_PER_LEVEL*level) and the real Strike damage formula
// (12+level*2.2+dmgBonus, with dmgBonus driven by the baseStatAtLevel()-
// based item formula below) so that a same-level-geared character kills a
// representative same-zone enemy in roughly 2-3 hits and is never
// one-or-two-shot in return, at checkpoints 1/10/25/40/60/80. K=5 -> the
// monster level driving these zones climbs by 1 every 5 character levels.
const MONSTER_LEVEL_STEP_K = 5;
// Only recomputed at zone-ENTRY (see enterForest/enterSunlitPlains/etc.),
// not continuously -- a player can only level up while standing in one of
// these zones by killing things in it already, and re-entering (or simply
// returning from Town) picks up any level gained since; per-frame
// recomputation would be needless overhead for a value that only actually
// needs to change readied for the player's NEXT encounter, not their
// current one.
//
// zoneMonsterLevel(charLevel, zoneBaseline): the direct, level-driven
// replacement for the old effectiveDepth(charLevel, baseDepth) -- same two
// params, same body, same return value at every input; only the name and
// the framing changed (a zone's monster level is now understood as a
// function of character level with a per-zone floor, not as a "depth"
// that happens to be derived from level).
function zoneMonsterLevel(charLevel, zoneBaseline){
  const lvl = Math.max(1, Math.floor(charLevel||1));
  return Math.max(zoneBaseline, 1 + Math.floor(lvl/MONSTER_LEVEL_STEP_K));
}
// The Spider Lair and Bear Cave bosses reuse the regular spider/bear draw
// rigs (drawSpiderIso/drawBearIso) at a larger scale rather than a new
// custom rig -- an "upscaled sprite" boss, stats boosted on top of the
// normal per-type spawnEnemy stats (which already include the multipliers above).
const SPIDER_BOSS_HP_MULT = 6;
const SPIDER_BOSS_DMG_MULT = 2.2;
const SPIDER_BOSS_R_MULT = 2.4;
const BEAR_BOSS_HP_MULT = 5, BEAR_CAVE_DMG_MULT = 0.81;
const BEAR_BOSS_DMG_MULT = 2;
const BEAR_BOSS_R_MULT = 1.7;
// Boss demon: a ground-targeted AoE slam on its own timer, independent of
// its regular melee attack. A red warning ring shows exactly where it will
// land half a second before it actually hits.
const BOSS_SLAM_CD = 3, BOSS_SLAM_TELEGRAPH = 0.5, BOSS_SLAM_RADIUS = 95, BOSS_SLAM_DMG_MULT = 1.25;
// Bears (wild Forest/Bear Cave ones, not the Hunter's bear companion): a
// periodic burst-dash charge attack on its own cooldown, similar in spirit
// to the boss's slam but simpler -- no telegraph ring, just a fast, fixed-
// direction dash that deals bonus damage on the first overlap it lands.
// v62: charge trigger range doubled (260 -> 520) so bears can kick off
// their dash from much farther away instead of only once the player is
// nearly on top of them.
const BEAR_CHARGE_WIND = 0.45, BEAR_SWIPE_WIND = 0.36, BEAR_CHARGE_CD = 2.4, BEAR_CHARGE_DUR = 0.35, BEAR_CHARGE_SPEED_MULT = 4.0, BEAR_CHARGE_DMG_MULT = 1.4, BEAR_CHARGE_RANGE = 560;
const BEAR_REACH_BONUS = 22, BEAR_CHARGE_HIT_BONUS = 16, BEAR_SPEED_MULT = 1.38;   // v281: faster, bigger telegraphed hits
// Bears hit slightly softer than their base formula (matched a brute's) used
// to imply -- a modest 12% cut, applied once in spawnEnemy before the global
// ENEMY_DMG_MULT multiplier. v62: cut an additional 10% off of that (0.88 ->
// 0.792, rounded to 0.79) per the "reduce all bear damage 10%" request --
// this flows through the charge attack too, since chargeDmg = e.dmg *
// BEAR_CHARGE_DMG_MULT reads the already-reduced e.dmg, and through the
// Bear Cave boss, whose dmg is BEAR_BOSS_DMG_MULT applied on top of this
// same already-reduced base.
const BEAR_DMG_MULT = 0.79;
// Treants (Forest): rebalance -- their old base speed (rand(30,38)) was
// slower than even a frozen zombie's shamble, and their damage was the
// highest of any non-boss enemy. Speed bumped ~40% so they move at a
// normal-ish pace instead of standing nearly still, and damage cut ~30%
// to compensate, same "cut applied once in spawnEnemy before the global
// ENEMY_DMG_MULT multiplier" pattern as BEAR_DMG_MULT above.
const TREANT_SPEED_MULT = 1.40, TREANT_DMG_MULT = 0.70;
// Frozen zombies (Mountain Pass): a slow, shambling chaser most of the
// time, but on its own cooldown it locks onto the target's current spot
// and bursts into a startlingly fast charge -- same telegraph-free
// dash-then-recover shape as the bear's charge above, just tuned with its
// own constants (higher speed multiplier, since its base chase speed is
// so low the dash needs to close distance fast to read as a real threat).
const ZOMBIE_CHARGE_CD = 3, ZOMBIE_CHARGE_DUR = 0.375, ZOMBIE_CHARGE_SPEED_MULT = 5.5, ZOMBIE_CHARGE_DMG_MULT = 0.9, ZOMBIE_CHARGE_WIND = 0.3, ZOMBIE_CHARGE_RANGE = 240;
// Wild Boars (Sunlit Plains, v69): a fast "hit and run" charger, same
// telegraph-free dash-then-recover shape as the bear/frozen zombie charges
// above, but deliberately given a much LONGER trigger range than either
// (760 vs. the bear's 520 and the zombie's 240) per the brief's explicit
// "long-range charge" call-out -- a boar can be seen lining up its charge
// from well off across the open plains before it ever gets close. Uniquely
// among the game's charge attacks, a landed boar charge also knocks the
// player straight back away from the boar (see BOAR_KNOCKBACK_DIST and the
// e.type==='boar' branch in update()/playerDamage()).
const BOAR_CHARGE_WIND = 0.35, BOAR_BITE_WIND = 0.4, BOAR_CHARGE_CD = 4, BOAR_CHARGE_DUR = 0.45, BOAR_CHARGE_SPEED_MULT = 4.2, BOAR_CHARGE_DMG_MULT = 1.3, BOAR_CHARGE_RANGE = 760;
const BOAR_KNOCKBACK_DIST = 150;
// Dark Crypt (v73): Vampire life-drain -- see playerDamage's
// e.type==='vampire' branch. Judgment call: 75%, the midpoint of the
// brief's suggested 50-100% lifesteal range.
const VAMPIRE_LIFESTEAL_PCT = 0.75;
// Hunter tree: Animal Companion (Wolf/Bear) followers, and a ground Trap.
const HUNTER_FOLLOWER_BASE_HP = 90, HUNTER_FOLLOWER_HP_PER_LEVEL = 9;
// Patch (Sept 2026): doubled Summon Wolf/Summon Bear base HP per user request
// ("double the base value health for hunter wolf, bear"). Applied as its own
// multiplier on top of HUNTER_FOLLOWER_BASE_HP/HUNTER_FOLLOWER_HP_PER_LEVEL,
// rather than doubling those two constants directly, because Necromancer's
// skeleton/demon minions (see followerMaxHp's f.kind==='skeleton'/'demon'
// branches below) ALSO derive their base from those same two constants and
// were not part of this request -- this multiplier only applies inside the
// f.kind==='wolf'||'bear' branch, so Necromancer minions are unaffected.
// Doubling the coefficient (rather than adding a flat number) means the
// doubling holds at every player level, not just a one-time amount.
const HUNTER_COMPANION_HP_BASE_MULT = 2;
// Bear companions are the dedicated taunt/tank -- double the shared HP base
// and scale noticeably steeper per rank than the wolf's HP does.
const HUNTER_BEAR_HP_MULT = 2;
function hunterBearHpMult(rank){ return rank>0 ? 1 + 0.32*(rank-1) : 1; }
const HUNTER_WOLF_BASE_DMG = 10, HUNTER_BEAR_BASE_DMG = 16;
const HUNTER_WOLF_R = 14, HUNTER_BEAR_R = 18; // bear companion is smaller than a real Forest bear (r:22)
const CAT_R = 10; // Cat Companion (v81, Support submenu toggle) -- smaller than every other follower kind
function hunterFollowerStatMult(rank){ return rank>0 ? 1 + 0.15*(rank-1) : 1; }
const TRAP_CD = 10, TRAP_RADIUS = 40, TRAP_LIFETIME = 15;
const TRAP_BASE_DMG = 18, TRAP_ROOT_DURATION = 2, TRAP_ROOT_STEP = 0.15;
// Hunter tree rework (v59): Crippling Shot / Stun Shot (two new dedicated
// ranged attack buttons), Summon Wolf gains a 2nd wolf at Rank 5, Pack
// Tactics (a jump-attack trigger for wolf/bear followers), Summon Bear
// repositioned as the capstone, and Field Dress (a stand-still HP-regen
// channel that cancels on movement and reveals the player out of stealth).
const CRIPPLING_SHOT_CD = 3, EXPLOSIVE_SHOT_CD = 3, CRIPPLING_SHOT_BASE_DMG = 10;
const CRIPPLING_SHOT_BLEED_PCT_BASE = 0.30, CRIPPLING_SHOT_BLEED_PCT_STEP = 0.075; // 30%/s at Rank1 -> 60%/s at Rank5
const CRIPPLING_SHOT_BLEED_DUR = 4;
function cripplingShotBleedPct(rank){ return rank>0 ? CRIPPLING_SHOT_BLEED_PCT_BASE + CRIPPLING_SHOT_BLEED_PCT_STEP*(rank-1) : 0; }
const STUN_SHOT_CD = 4, STUN_SHOT_BASE_DMG = 20;
const STUN_SHOT_STUN_BASE = 0.4, STUN_SHOT_STUN_STEP = 0.1; // v267: 0.4s at Rank1 -> 0.8s at Rank5 (but only a chance to land, see below)
const STUN_SHOT_CHANCE_BASE = 0.08, STUN_SHOT_CHANCE_STEP = 0.03; // 8% at Rank1 -> 20% at Rank5: no stun-locking
function stunShotStunChance(rank){ return rank>0 ? STUN_SHOT_CHANCE_BASE + STUN_SHOT_CHANCE_STEP*(rank-1) : 0; }
function stunShotStunDuration(rank){ return rank>0 ? STUN_SHOT_STUN_BASE + STUN_SHOT_STUN_STEP*(rank-1) : 0; }
const PACK_TACTICS_CD = 4, PACK_TACTICS_CD_MIN = 2;
const PACK_TACTICS_DMG_MULT_BASE = 1.5, PACK_TACTICS_DMG_MULT_STEP = 0.15; // extra multiplier on top of a follower's normal hit
function packTacticsCooldown(rank){
  if(rank<=0) return PACK_TACTICS_CD;
  return PACK_TACTICS_CD - (PACK_TACTICS_CD-PACK_TACTICS_CD_MIN)/4*(rank-1);
}
function packTacticsDmgMult(rank){ return rank>0 ? PACK_TACTICS_DMG_MULT_BASE + PACK_TACTICS_DMG_MULT_STEP*(rank-1) : 0; }
// v267 Ambush (was Pack Tactics): companions leap at the target in a short arc instead of teleporting.
const AMBUSH_LEAP_T = 0.35, PACK_SLASH_MULT = 0.6, PACK_SLASH_R_WOLF = 58, PACK_SLASH_R_BEAR = 78;
const SUMMON_MAX_RANK_DMG = 1.10, SUMMON_HP_MULT = 0.90;   // v267: +10% dmg at max rank, -10% HP at every rank
const BEAR_SIZE_PER_LEVEL = 0.05, BEAR_SIZE_CAP = 2, BEAR_HITBOX_SHARE = 0.4;
// v452: the summoned bear is 75% of a wild bear's size at Rank 1, growing linearly to 125% at max rank (Rank 10). Wild bear r = 22.
function bearSizeMult(p){ const rk = clamp(((p && p.skills && effectiveRank(p,'companionBear'))||1), 1, 10); return (22/HUNTER_BEAR_R) * (0.75 + 0.5*(rk-1)/9); }
const RECALL_DASH_T = 0.7, RECALL_DASH_SPEED = 1500, RECALL_SHIELD_BASE = 0.30, RECALL_SHIELD_STEP = 0.05, RECALL_PLAYER_SHIELD_BASE = 0.10, RECALL_PLAYER_SHIELD_STEP = 0.03;
function recallShieldPct(rank){ return rank>0 ? RECALL_SHIELD_BASE + RECALL_SHIELD_STEP*(rank-1) : 0; }
function recallPlayerShieldPct(rank){ return rank>0 ? RECALL_PLAYER_SHIELD_BASE + RECALL_PLAYER_SHIELD_STEP*(rank-1) : 0; }
// v267 Field Dress passive: every dodge heals a slice of max life over 3s (on top of the bandage active).
const SFD_DODGE_PCT_BASE = 0.02, SFD_DODGE_PCT_STEP = 0.005, SFD_DODGE_DUR = 3;
function sfdDodgePct(rank){ return rank>0 ? SFD_DODGE_PCT_BASE + SFD_DODGE_PCT_STEP*(rank-1) : 0; }
function survDodgeRegenStart(p){
  const r = (p.skills && effectiveRank(p,'survivalFieldDress'))||0;
  if(r>0){ p.dodgeRegenT = SFD_DODGE_DUR; p.dodgeRegenRate = sfdDodgePct(r)/SFD_DODGE_DUR; }
}
// v474: poison clouds (Poison Trap, Plague) bite harder the longer a monster stays inside: +30% per second, up to +150%
const CLOUD_RAMP_PER_S = 0.30, CLOUD_RAMP_MAX = 1.5;
function cloudStayMult(g, e, interval){
  const now = (g && g.clock)||0;
  if(e._cloudSeen==null || now - e._cloudSeen > interval*2.5) e._cloudStay = 0;
  e._cloudSeen = now;
  const m = 1 + Math.min(CLOUD_RAMP_MAX, CLOUD_RAMP_PER_S*(e._cloudStay||0));
  e._cloudStay = (e._cloudStay||0) + interval;
  return m;
}
const MARKED_PREY_JUMP_RANGE = 300;
// Summon Wolf (v80): reworked from a passive auto-summon (any rank>0 kept
// a wolf perpetually out, see ensureFollowers) into a real active WOLF
// button -- casting it (re)summons the wolf(s) at full HP next to the
// player and starts a fixed cooldown. The cooldown itself does NOT scale
// with rank (only damage/life do, per the brief's "each rank adds damage,
// and companion total life") -- a flat, modest cooldown just stops the
// button being spammed, same idea as Crippling/Stun Shot's own fixed CDs.
const HUNTER_WOLF_SUMMON_CD = 15;
// Recall (v80, brand-new Hunter skill, no pre-existing mechanic to reuse):
// teleports every current follower back to the player's side (the same
// "snap to player" idea Rally already uses for its own followers) AND
// grants the PLAYER a temporary damage buff (feeds into weaponDmgMult,
// the same shared multiplier chokepoint Bloodlust/Sap/Bow Expert already
// go through) plus a life-regen-over-time buff (ticked in updatePlaying,
// same "%/s of max HP" shape Field Dress's own regen already uses).
// JUDGMENT CALL: the buff's own duration is a fixed 6s at every rank (the
// brief only calls out rank scaling the dmg% and regen% themselves, not
// duration) and the skill's cooldown is a fixed 25s (long enough that the
// 6s buff window can't be kept up continuously).
const RECALL_CD = 25;
const RECALL_BUFF_DUR = 6;
const RECALL_DMG_BONUS_BASE = 0.10, RECALL_DMG_BONUS_STEP = 0.05; // +10% dmg at Rank1 -> +30% at Rank5
const RECALL_REGEN_PCT_BASE = 0.02, RECALL_REGEN_PCT_STEP = 0.01; // 2%/s of max HP at Rank1 -> 6%/s at Rank5
function recallDmgBonus(rank){ return rank>0 ? RECALL_DMG_BONUS_BASE + RECALL_DMG_BONUS_STEP*(rank-1) : 0; }
function recallRegenPct(rank){ return rank>0 ? RECALL_REGEN_PCT_BASE + RECALL_REGEN_PCT_STEP*(rank-1) : 0; }
// 1 while Recall's buff isn't active; the flat rank-scaled multiplier
// while it is -- reused directly inside weaponDmgMult below.
function recallDmgMult(p){
  return (p && p.recallT>0) ? 1 + (p.recallDmgBonusVal||0) : 1;
}
const FIELD_DRESS_REGEN_BASE = 0.10, FIELD_DRESS_REGEN_STEP = 0.0125; // 10%/s at Rank1 -> 15%/s at Rank5
function fieldDressRegenRate(rank){ return rank>0 ? FIELD_DRESS_REGEN_BASE + FIELD_DRESS_REGEN_STEP*(rank-1) : 0; }
// Field Dress cooldown (v64): a FIXED 2-minute cooldown at every rank --
// unlike every other ranked active on this tree, rank does not touch the
// cooldown at all here, only the regen rate above. Cooldown starts ticking
// the moment the channel is triggered (whether it completes to full HP or
// is cancelled early by moving), same "starts on activation" convention
// Vanish/Whirlwind/etc use for their own cooldowns.
const FIELD_DRESS_CD = 120;
