// ---------- Items & Progression ----------
const EQUIP_SLOTS = ['helm','armor','amulet','ring1','ring2','boots','gloves','belt','mainhand','offhand'];
const SLOT_DISPLAY_ORDER = ['mainhand','offhand','helm','armor','amulet','gloves','ring1','ring2','belt','boots'];
const SLOT_LABELS = {helm:'Helm', armor:'Armor', amulet:'Amulet', ring1:'Ring', ring2:'Ring', boots:'Boots', gloves:'Gloves', belt:'Belt', mainhand:'Weapon', offhand:'Shield'};
const ITEM_CATEGORIES = ['helm','armor','amulet','ring','boots','gloves','belt','weapon1h','weapon2h','shield','bow','staff'];
const ITEM_CAT_WEIGHT = {ring:0.5, amulet:0.5};   // v463: jewelry drops half as often as other gear
function pickItemCategory(){ let tot = 0; for(const c of ITEM_CATEGORIES) tot += ITEM_CAT_WEIGHT[c]||1; let r = Math.random()*tot; for(const c of ITEM_CATEGORIES){ r -= ITEM_CAT_WEIGHT[c]||1; if(r<=0) return c; } return ITEM_CATEGORIES[0]; }
const ITEM_BASE_NAME = {helm:'Helm', armor:'Plate', amulet:'Amulet', ring:'Ring', boots:'Boots', gloves:'Gauntlets', belt:'Belt', weapon1h:'Sword', weapon2h:'Greatsword', shield:'Shield', bow:'Bow', staff:'Staff', questitem:'Quest Item', potion:'Potion'};

// Armor "material" -- Helm and Armor (body) items now roll one of three
// materials, each tied to a class: Plate (Warrior, most defense), Leathers
// (Ranger, middling defense + an innate evasion/dodge stat), and Robes
// (Mystic, least defense). A class can only equip its own material -- see
// the check in equipItem(). Weapons/shields/amulets/rings etc are unaffected.
const ARMOR_MATERIALS = ['plate','leather','robe'];
// v84: added gloves/boots fallback entries (used only for a pre-v84 saved
// item that somehow has a .material but no .tier -- see itemBaseName; in
// practice every item has carried a .tier since v82, so this path is
// effectively legacy-only, same as the pre-existing helm/armor entries).
const MATERIAL_BASE_NAME = {
  plate:   {helm:'Helm',         armor:'Plate',         gloves:'Gauntlets',      boots:'Boots'},
  leather: {helm:'Leather Helm', armor:'Leather Armor', gloves:'Leather Gloves', boots:'Leather Boots'},
  robe:    {helm:'Hood',         armor:'Robes',         gloves:'Gloves',         boots:'Shoes'},
};
// Guaranteed innate Armor value per material/slot, before rarity mult & depth
// scaling -- Plate > Leather > Robe, same ordering on both helm and armor.
const MATERIAL_ARMOR_BASE = {
  plate:   {helm:6, armor:10, gloves:4, boots:4},
  leather: {helm:4, armor:7,  gloves:3, boots:3},
  robe:    {helm:2, armor:4,  gloves:1, boots:1},
};
// (v105/v106) Armor rework: Helm/Armor/Gloves/Boots all carry an IMPLICIT
// Armor stat (see generateItem). Armor is FLAT mitigation per hit with a
// random +/-ARMOR_SPREAD variance (see playerDamage) -- a brief v105 trial of
// "10 Armor = 1% damage reduction" was too strong and was reverted. Only
// these armor pieces (and the Shield's own innate Armor) can carry Armor --
// weapons, rings, amulets and belts never roll it (see
// NO_ARMOR_AFFIX_CATEGORIES/rollExtraAffixes).
const ARMOR_SPREAD = 5;   // legacy, unused since v346
// (v346) Defense replaces flat armor: it lowers the CHANCE an enemy attack lands (Diablo 2 style), never the damage of a hit that lands.
const DEF_SCALE = 9;                 // item Defense numbers are 9x the old armor numbers; p.armor keeps the old scale for skills that scale off it
const DEF_AR_BASE = 330, DEF_AR_PER_ML = 9;   // enemy Attack Rating by monster level
const DEF_HIT_MIN = 0.25, DEF_HIT_MAX = 0.90;
const DEF_PER_DEX = 1.5;               // each Dexterity point adds Defense
function enemyAttackRating(ml){ return DEF_AR_BASE + DEF_AR_PER_ML*Math.max(1, ml||1); }
const IRON_STILL_PER_S = 0.10, IRON_STILL_MAX = 5;
function ironStillMult(p){ return (p && p.cls==='warrior' && p.skills && (p.skills.ironSkin||0)>0 && p.stillT>0) ? 1 + IRON_STILL_PER_S*Math.floor(Math.min(IRON_STILL_MAX, p.stillT)) : 1; }
function effectiveDefense(p){ return ironStillMult(p)*((p.defense||0) + soulShieldDefense(p))*(p.bulwarkT>0 ? BULWARK_ARMOR : 1)*(immovableActive(p) ? 1+immovableArmor(effectiveRank(p,'immovable')||1) : 1)*(p.juggT>0 ? 1+juggDef(p.juggRank||1) : 1); }
function playerHitChance(p, ml){ const ar = enemyAttackRating(ml), d = effectiveDefense(p); return clamp(ar/(ar+d), DEF_HIT_MIN, DEF_HIT_MAX); }
const RARITY_ARMOR_MULT = {common:1.0, magic:1.2, rare:1.5}, RARITY_RESIST_MULT = {common:1.0, magic:1.0, rare:1.25};
const MAGIC_SINGLE_MOD_CHANCE = 0.25;
// (v120) Area-of-Effect % from gear is capped at +30% total; it enlarges every
// skill tagged AoE (Whirlwind, Cleave, Battlecry, Shield Bash, Nova, Storm,
// Hurricane, Fire Bomb, Blizzard, Fear, Plague, Poison/Frost Trap, Rain of Arrows).
const AOE_AFFIX_CAP_PCT = 30;
function atkSpeedAffixRoll(tier){ return tier>=3 ? Math.round(rand(8,12)) : tier===2 ? Math.round(rand(5,8)) : Math.round(rand(3,5)); }
function lifeRegenAffixRoll(tier){ const r = tier>=3 ? rand(0.8,1.4) : tier===2 ? rand(0.5,0.9) : rand(0.3,0.6); return Math.round(r*10)/10; }
function aoeAffixRoll(tier){ return tier>=3 ? Math.round(rand(12,18)) : tier===2 ? Math.round(rand(8,12)) : Math.round(rand(4,8)); }
const ARMOR_AFFIX_KEYS = {armor:1, defenceFlat:1};
const NO_ARMOR_AFFIX_CATEGORIES = {weapon1h:1, weapon2h:1, bow:1, staff:1, ring:1, amulet:1, belt:1};
// (v105) Evasion % on gear is gone: gear now rolls Dexterity instead, and
// every 10 Dexterity on gear = +1% Evasion (see recalcStats).
const DEX_PER_EVASION_PCT = 10;
// (v106) Movement speed comes ONLY from boots (the Quick prefix), with a
// fixed value per item tier: T1 15%, T2 20-25%, T3 30%. Total gear move
// speed is also hard-capped at 30% (see recalcStats).
const MOVE_SPEED_TIER_MAX = {1:15, 2:25, 3:30}, MOVE_SPEED_GEAR_CAP_PCT = 30;
function bootsMoveSpeedForTier(tier){
  if(tier>=3) return 30;
  if(tier===2) return 20 + Math.floor(Math.random()*6); // 20..25
  return 15;
}
// Old items in saves may still carry the retired affix keys -- renamed in
// place (values kept) so they keep working under the new systems.
const ARMOR_ITEM_SCALE = 0.15;
function migrateItemAffixes(it){
  if(!it || !it.affixes) return;
  if(it.questId==='templar_runestone_awake' && it.name!=='Defensive Runestone'){ it.name='Defensive Runestone'; it.color='#5fd0ff'; it.questDesc='A rune-carved stone marked with a shield, judged and awakened by the mountain. It hums, and seems to tug toward the east. Quest item -- cannot be sold.'; }
  if(it.questId==='templar_runestone' && it.name!=='Defensive Runestone'){ it.name='Defensive Runestone'; it.questDesc='A rune-carved stone marked with a shield, taken from the chest beneath the lake. A scholar may know what it is for. Quest item -- cannot be sold.'; }
  if(it.questId==='frost_templar_runestone' && it.name!=='Offensive Runestone'){ it.name='Offensive Runestone'; it.color='#ff9a6a'; it.questDesc='A rune-carved stone marked with a sword, taken from the Ancient Dwarven Construct beneath Frosthold. A matching hum answers from somewhere far to the east. Quest item -- cannot be sold.'; }
  if(it.questId==='thunder_claw'){ it.questId='fire_claw'; it.name='Fire Claw'; it.color='#ff8a3a'; it.questDesc='A blackened talon that still smoulders. Quest item -- cannot be sold.'; }
  if(!it.nameV3 && it.slotType!=='questitem' && it.slotType!=='potion' && !it.questId){
    it.nameV3 = true;
    if(typeof it.name==='string' && /\b(Common|Magic|Rare)\s/.test(it.name)){
      if(it.rarity==='rare'){ it.baseName = itemBaseName(it); it.name = makeRareName(it.slotType); }
      else it.name = it.name.replace(/\b(Common|Magic|Rare)\s+/, '');
    }
  }
  // (v120) "Sturdy" (Defence/Damage Reduction) is gone from rings and amulets,
  // and armor never rolls on weapons/rings/amulets/belts: strip legacy copies.
  if(NO_ARMOR_AFFIX_CATEGORIES[it.slotType]){
    const isJewel = it.slotType==='ring' || it.slotType==='amulet';
    it.affixes = it.affixes.filter(af=>af.implicit || !(ARMOR_AFFIX_KEYS[af.key] || af.word==='Sturdy' || (isJewel && af.key==='dmgReductionPct')));
    if(isJewel && typeof it.name==='string') it.name = it.name.replace(/\bSturdy\s+/g,'').replace(/\s+of Sturdy\b/g,'');
  }
  for(const af of it.affixes){ if(af.key==='aoeRadiusPct' && af.value>18) af.value=18; }
  for(const af of it.affixes){ if(af.key==='statusDurPct') af.label = 'Ailment Duration %'; if(af.key==='followerDmgPct') af.label = 'Minion Damage %'; }   // v452 renames
  // (v157) clamp legacy percent rolls to their tier's new max; single resist <= 25 per piece
  for(const af of it.affixes){
    const tr = PCT_AFFIX_ROLL[af.key];
    if(tr && typeof af.value==='number' && !af.implicit){
      const mx = tr[Math.min(3,Math.max(1,it.tier||1))-1][1] * (/ResistPct$/.test(af.key) && af.key!=='allResistPct' && it.rarity==='rare' ? 1.25 : 1) * (af.mt ? 1.3 : 1);
      const cap = /ResistPct$/.test(af.key) ? Math.min(af.key==='allResistPct'?12:MAX_SINGLE_RESIST_PER_ITEM, Math.round(mx)) : mx;
      if(af.value>cap) af.value = Math.round(cap);
    }
  }
  if(!it.dmgV457 && it.slotType && it.slotType!=='questitem' && it.slotType!=='potion'){
    it.dmgV457 = true;
    const cat = it.slotType, flatOk = !!FLAT_ELEM_WEAPON[cat];
    if(WPN_SHAPE[cat] && !it.affixes.some(a=>a.key==='wpnDmg')){
      const bi = it.affixes.findIndex(a=>a.key==='dmg' && (a.base || (!a.word && !a.implicit)));
      if(bi>=0 && cat!=='staff') it.affixes.splice(bi,1);
      it.affixes.unshift(weaponDamageAffix(cat, it.ilvl || it.levelReq || 1));
    }
    for(const af of it.affixes){
      if(/^(fire|cold|lightning|poison)Dmg$/.test(af.key)){
        const nm = af.key.replace('Dmg','').replace(/^./,c=>c.toUpperCase());
        if(flatOk) af.label = nm+' Damage to Weapon Attacks';
        else { af.key = af.key+'Pct'; af.label = nm+' Damage %'; af.value = pctRollByMt(af.key, af.mt || Math.min(5, (it.tier||1)*2-1)); }
      } else if(af.key==='dmg' && !af.base){
        if(flatOk) af.label = 'Physical Damage to Weapon Attacks';
        else { af.key = 'physDmgPct'; af.label = 'Physical Damage %'; af.value = af.implicit ? Math.max(1, Math.round(Math.min(18, 4+0.15*(it.ilvl||1)))) : pctRollByMt('physDmgPct', af.mt || Math.min(5, (it.tier||1)*2-1)); }
      } else if(af.key==='dmgPct'){ af.key = 'elemDmgPct'; af.label = 'Elemental Damage %'; }
    }
    if(typeof it.name==='string' && it.affixes.some(a=>a.key==='physDmgPct' && a.implicit) && it.baseName==='Iron Ring'){}   // name stays
  }
  if(!it.dmgV458){ it.dmgV458 = true; for(const af of it.affixes){ if(af.key==='wpnDmg' && it.dmgV457 && !af.v458){ af.v458 = true; af.min = Math.max(1, Math.round(af.min*0.88)); af.max = Math.max(af.min+1, Math.round(af.max*0.88)); af.value = Math.round((af.min+af.max)/2); } } }
  if(!it.flatDmgScaled){
    it.flatDmgScaled = true;
    for(const af of it.affixes){ if(FLAT_DMG_KEYS[af.key] && typeof af.value==='number') af.value = Math.max(1, Math.round(af.value*FLAT_DMG_AFFIX_SCALE)); }
  }
  if(!it.armorScaled){
    it.armorScaled = true;
    for(const af of it.affixes){
      if(af.key==='armor' || af.key==='defenceFlat') af.value = Math.max(1, Math.round(af.value*ARMOR_ITEM_SCALE));
    }
  }
  if(!it.defV4){
    it.defV4 = true;
    for(const af of it.affixes){ if(af.key==='armor' || af.key==='defenceFlat') af.value = Math.max(1, Math.round(af.value*DEF_SCALE)); }
  }
  for(const af of it.affixes){ if(af.key==='armor') af.label = 'Defense'; }
  if(!it.reqV2 && it.slotType!=='questitem' && it.slotType!=='potion'){
    it.reqV2 = true;
    // legacy dupes: leather's innate Dex plus an Agility Dex -> keep the stronger one only
    const dx = it.affixes.filter(a=>a.key==='dexterity' || a.key==='evasion' || a.key==='dodgeChancePct');
    if(dx.length>1){ dx.sort((a,b)=>(b.value||0)-(a.value||0)); for(let i=1;i<dx.length;i++) it.affixes.splice(it.affixes.indexOf(dx[i]),1); }
    const legacyMt = [1,2,3][Math.min(3,Math.max(1,it.tier||1))-1];
    for(const af of it.affixes){
      if(!af.mt && typeof af.value==='number' && !af.skillTree && !af.skillGroup && !af.allSkills && !isBooleanAffixKey(af.key)) af.mt = legacyMt;
    }
    if(!it.ilvl) it.ilvl = [10,38,60][Math.min(3,Math.max(1,it.tier||1))-1];
    if(it.levelReq!==undefined){ const nr = computeLevelReq(it); it.levelReq = it.levelReq>0 ? Math.min(it.levelReq, nr) : nr; }
  }
  for(const af of it.affixes){
    if(af.key==='evasion' || af.key==='dodgeChancePct'){ af.key='dexterity'; af.label='Dexterity'; }
    else if(af.key==='defenceFlat'){ af.key='armor'; af.label='Defense'; }
    else if(af.key==='moveSpeedPct'){ // older boots may exceed their tier's fixed value
      const mx = MOVE_SPEED_TIER_MAX[it.tier||1] || MOVE_SPEED_GEAR_CAP_PCT;
      if(af.value>mx) af.value = mx;
    }
  }
}
// Kept as each class's "native" material (used for flavor/reward-table
// purposes, e.g. grantQuestRewardItem picking a sensible drop) -- but as
// of v66 this is NO LONGER the equip-eligibility check. See
// ARMOR_ACCESS_MATRIX below for that.
const MATERIAL_FOR_CLASS = {warrior:'plate', ranger:'leather', mystic:'robe'};
const MATERIAL_CLASS_NAME = {warrior:'Warrior', ranger:'Ranger', mystic:'Mystic'};
// ---- Weight-class ACCESS matrix (v66) -------------------------------------
// Replaces the old strict 1:1 MATERIAL_FOR_CLASS equip lock. Armor access is
// now additive by how much weight a class can carry, not a single exclusive
// material: Mystic can only wear Robes (Light); Ranger can wear Robes AND
// Leather (Light + Medium); Warrior can wear all three (Light + Medium +
// Heavy). A class can never be equipped in something LIGHTER-only than
// another class can't also wear -- Warrior is a strict superset of Ranger,
// which is a strict superset of Mystic.
const ARMOR_ACCESS_MATRIX = {
  mystic:  ['robe'],
  ranger:  ['leather'],   // (v147) strict: one material per class
  warrior: ['plate'],
};
function canEquipArmorMaterial(cls, material){
  const allowed = ARMOR_ACCESS_MATRIX[cls];
  return allowed ? allowed.indexOf(material)>=0 : true;
}
// Leather armor always rolls an innate Evasion stat (a % chance to fully
// avoid an incoming hit, see evasionChance()/playerDamage()) on top of its
// Armor stat and any other rolled affixes.
// (v105) Leather now rolls an innate Dexterity stat instead of Evasion %.
const LEATHER_EVASION_BASE = 4; // legacy constant, unused

// ============================================================================
// ---- v82: Level-based item generation overhaul (equipment batch 1/3) -----
// ============================================================================
// DEPTH no longer factors into item/equipment generation AT ALL (it still
// drives monster difficulty elsewhere -- untouched). Every item now rolls
// an internal "item level" (ilvl) off the character's CURRENT LEVEL at the
// moment it drops -- see rollItemLevel() -- which then determines both the
// item's TIER and its stat VALUES. ilvl is purely an internal calculation
// value: it is never shown to the player anywhere (no tooltip, no UI --
// only itemTierForItemLevel()'s resulting 1/2/3 tier and the rolled stat
// numbers themselves are ever surfaced).
//
// Unified item-level tier brackets (replaces the old per-category
// ARMOR_TIER_LEVELS(25/50) / BOW_TIER_LEVELS(35/50) / WEAPON2H_TIER_LEVELS
// (25/50) thresholds -- every equipment type now shares ONE tier system):
//   Tier 1: ilvl 0-25   (ilvl 0 has no "tier 0" -- floors into Tier 1)
//   Tier 2: ilvl 26-50
//   Tier 3: ilvl 51-80
// Character-level brackets for equipping each tier are the SAME numbers
// (Tier 1 = char lvl 1-25, Tier 2 = 26-50, Tier 3 = 51-80), so a dropped
// item's levelReq is just its own tier's bracket floor (Tier 2 -> req 26,
// Tier 3 -> req 51) -- see itemTierLevelReq() below. Batches 2-3 (full new
// affix pool + per-class tier display names) build directly on these.
const ITEM_TIER_LEVEL_BRACKETS = {1:{min:1,max:25}, 2:{min:26,max:50}, 3:{min:51,max:80}};
function itemTierForItemLevel(ilvl){
  const lvl = Math.max(0, ilvl||0);
  if(lvl>=51) return 3;
  if(lvl>=26) return 2;
  return 1; // covers ilvl 0-25, including the ilvl=0 edge case
}
function itemTierLevelReq(tier){ return ITEM_TIER_LEVEL_BRACKETS[tier] ? ITEM_TIER_LEVEL_BRACKETS[tier].min : 1; }
// Judgment call on the ilvl jitter distribution: a uniform random INTEGER
// across [max(0, charLevel-5), charLevel+5]. The spec explicitly allows
// either a flat [0, charLevel+5] roll or something "weighted toward the
// character's actual level" -- a flat [0, charLevel+5] roll was rejected
// because at high character level (e.g. 60) it would make a near-worthless
// ilvl-2 drop just as likely as one near the character's own level, which
// feels bad moment-to-moment. This [charLevel-5, charLevel+5] window still
// genuinely reaches both extremes the spec calls for (ilvl 0 whenever
// charLevel<=5, and charLevel+5 always), while staying centered on the
// character's own level the rest of the time.
// (v250) Diablo-2 rule: item level = the level of whatever dropped it (monster / area level), no jitter.
function rollItemLevel(charLevel){
  return Math.max(1, Math.floor(charLevel||1));
}
// (v250) D2-style equip requirement: base type req (by base tier) vs the highest affix level on the item.
const BASE_REQ_BY_TIER = {1:1, 2:18, 3:36};
function modReqLevel(a, cat){
  if(a.mt) return MOD_TIER_REQ[a.mt-1]||1;
  if(a.skillTree||a.skillGroup||a.allSkills) return SKILL_AFFIX_MIN_ILVL;
  return 0;
}
// (v391) D2-style: the base type (its item-level bracket) sets the equip requirement. Items made before this keep the old tier requirement.
const BASE_REQ_BY_BRACKET = [1, 10, 22, 36, 54];
function computeLevelReq(it){
  let r = (it.bracket!==undefined && BASE_REQ_BY_BRACKET[it.bracket]!==undefined) ? BASE_REQ_BY_BRACKET[it.bracket] : (BASE_REQ_BY_TIER[it.tier||1]||1);
  for(const a of (it.affixes||[])) r = Math.max(r, modReqLevel(a, it.slotType));
  return r;
}
// (v250) D2-style fixed value ranges per mod tier: item level only decides which mod tiers CAN roll.
function modLevelRange(mt){ const lo = MOD_TIER_REQ[mt-1]||1, hi = (MOD_TIER_REQ[mt]||81)-1; return [lo,hi]; }
function flatRollByMt(mt){
  const r = modLevelRange(mt);
  return Math.max(1, Math.round(rand(baseStatAtLevel(r[0]), baseStatAtLevel(r[1])*1.35)));
}
function pctRollByMt(key, mt){
  const t = PCT_AFFIX_ROLL[key]; const k = (mt-1)/4;
  const lo = t[0][0] + (t[2][0]-t[0][0])*k, hi = t[0][1] + (t[2][1]-t[0][1])*k;
  return Math.max(1, Math.round(rand(lo, hi)));
}
function tierFromMt(mt){ return mt<=2 ? 1 : mt<=4 ? 2 : 3; }
// Old tier stat multiplier/base-range tables -- no longer used by
// rollAffixModifierValue as of v88 (see its new "percent-of-curve" formula
// below), but left defined/exported unchanged since other code (and the
// window.__test export list) still references them and nothing about
// these two tables themselves was asked to change.
const ITEM_TIER_MULT = {1:1.0, 2:1.35, 3:1.55};
const ITEM_TIER_BASE_RANGE = {1:[3,6], 2:[8,12], 3:[15,20]};
// ---- v88: modifier-value formula rework ("percent-of-curve" model) ------
// REPLACES the old flat-additive formula
// (baseAffixValue[3-20] + (1+ilvl/100)*ITEM_TIER_MULT) entirely, per the
// user's playtesting feedback that early-game item values didn't track
// monster difficulty. New formula:
//   modifierValue = round( baseStatAtLevel(ilvl) * randomRoll(tierLow, tierHigh) )
//
// baseStatAtLevel(level) is a NEW growth curve, deliberately built on the
// SAME underlying scale as the monster HP/DMG growth driving spawnEnemy
// (see zoneMonsterLevel()/MONSTER_LEVEL_STEP_K above) and the player's own
// BASE_MAXHP/HP_PER_LEVEL and Strike-damage (12+level*2.2+dmgBonus)
// curves, so a rolled affix value stays meaningfully impactful whether it
// drops at character level 3 or level 70 -- gear power and monster
// toughness move together at every level. Coefficients (ITEM_BASE_STAT_A/
// B) were derived and then calibrated with an actual Node TTK/TTL
// simulation against the real formulas above (see README "Version 88" for
// the full derivation and the measured numbers at checkpoints
// 1/10/25/40/60/80) -- NOT invented arbitrarily.
//
// ilvl (not raw character level) is passed in here, unchanged from the old
// signature -- ilvl is already rolled tightly around the character's
// current level (see rollItemLevel's [charLevel-5, charLevel+5] jitter),
// so using it directly as baseStatAtLevel()'s level input keeps this a
// safe drop-in replacement: every existing call site (rollExtraAffixes,
// the main generateItem pipeline, the staff/weapon innate-stat rolls,
// etc.) already calls rollAffixModifierValue(itemTier, ilvl) and needs no
// changes at all.
const ITEM_BASE_STAT_A = 3, ITEM_BASE_STAT_B = 1.15;
function baseStatAtLevel(level){
  return ITEM_BASE_STAT_A + ITEM_BASE_STAT_B*Math.max(0, level||0);
}
// Per-tier RANDOM MULTIPLIER range (replaces the old flat additive
// ITEM_TIER_BASE_RANGE) -- preserves the old formula's roll-to-roll
// randomness (same affix/tier/ilvl items are still not identical, per the
// user's explicit "so items are not easily duplicated" requirement) while
// keeping the mean roll tracking baseStatAtLevel()'s monster-difficulty-
// matched curve. Exactly the spread the user specified as a starting
// point (0.8-1.1 / 1.1-1.4 / 1.4-1.8) -- calibration testing didn't surface
// a reason to widen or narrow it, so it's used as given.
const ITEM_TIER_ROLL_RANGE = {1:[0.8,1.1], 2:[1.1,1.4], 3:[1.4,1.8]};
// (v157) Percent-type mods no longer ride the level-scaled curve (which let one mod roll 100%+
// at high level). Each has fixed per-tier [min,max] ranges; flat damage mods are scaled down.
const PCT_AFFIX_ROLL = {
  fireResistPct:[[5,10],[10,17],[17,25]], coldResistPct:[[5,10],[10,17],[17,25]],
  lightningResistPct:[[5,10],[10,17],[17,25]], poisonResistPct:[[5,10],[10,17],[17,25]],
  allResistPct:[[3,5],[5,8],[8,12]],
  critChance:[[2,3],[3,5],[5,8]],
  magicFindPct:[[5,10],[10,18],[18,28]], goldFindPct:[[5,10],[10,18],[18,28]],
  dmgPct:[[4,8],[8,14],[14,20]],
  physDmgPct:[[5,10],[10,16],[16,24]], elemDmgPct:[[4,8],[8,12],[12,18]],   // v457 percentage damage mods
  fireDmgPct:[[6,12],[12,20],[20,30]], coldDmgPct:[[6,12],[12,20],[20,30]], lightningDmgPct:[[6,12],[12,20],[20,30]], poisonDmgPct:[[6,12],[12,20],[20,30]],
  globalCdrPct:[[2,3],[3,4],[4,6]],
  lifeLeechPct:[[1,2],[2,3],[3,4]],
  bleedChancePct:[[4,8],[8,12],[12,18]],
  armorPenPct:[[3,5],[5,8],[8,11]],
  dmgReductionPct:[[1,1],[1,2],[2,2]],
  blockChancePct:[[2,4],[4,6],[6,9]],
  followerDmgPct:[[5,10],[10,16],[16,24]],
  statusDurPct:[[8,14],[14,22],[22,32]],
  skillDurPct:[[6,10],[10,16],[16,24]],   // v489
  dmgVsElitePct:[[1,2],[2,3],[3,5]],
  potionStrengthPct:[[10,15],[15,25],[25,40]],
  lifeOnKill:[[2,4],[4,7],[7,11]],
  manaOnKill:[[1,2],[2,3],[3,5]],
  critDmgPct:[[8,14],[14,22],[22,32]],
  projectileSpeedPct:[[5,10],[10,15],[15,22]],
  defensePct:[[5,9],[9,14],[14,20]]
};
const MAX_SINGLE_RESIST_PER_ITEM = 25;
const FLAT_DMG_AFFIX_SCALE = 0.65;   // dmg / fire / cold / lightning / poison / thorns flat rolls
const FLAT_DMG_KEYS = {dmg:1, fireDmg:1, coldDmg:1, lightningDmg:1, poisonDmg:1, thornDamage:1};
function pctAffixRoll(key, tier){
  const r = PCT_AFFIX_ROLL[key][Math.min(3,Math.max(1,tier||1))-1];
  return Math.round(rand(r[0], r[1]));
}
function rollAffixModifierValue(itemTier, ilvl){
  const range = ITEM_TIER_ROLL_RANGE[itemTier] || ITEM_TIER_ROLL_RANGE[1];
  const mult = rand(range[0], range[1]);
  return Math.max(1, Math.round(baseStatAtLevel(ilvl) * mult));
}
// Rare-item modifier-COUNT cap, now tier-dependent (replaces the old flat
// RARITY.rare.statCount===3 rule for every rare item regardless of tier).
// Common/Magic counts are left as their existing simple fixed values
// (1/2 respectively, from RARITY.common/magic.statCount below) -- the spec
// only explicitly calls out new caps for Rare, and scaling Common/Magic
// too risked flooding low-tier items with more stats than the new
// tier-1 base-value range (3-6) was balanced around.
const RARE_STAT_CAP_BY_TIER = {1:3, 2:4, 3:6};
// Reusable gate for "+1 to skills"-style affixes (v83 is the batch that
// actually populates EQUIP_AFFIXES with entries flagged `tier3Only:true`
// -- see that block further down): any affix flagged tier3Only is eligible to roll ONLY
// on Tier 3 equipment (char level 51+ bracket) -- EXCEPT on staves, whose
// existing "+1/+2 to <Spell>" innate mechanic (see the staff branch of
// generateItem, spellPower affix) is untouched by this gate and stays
// available at every tier, exactly as before.
function affixEligibleForTier(affix, itemTier, category){
  return true;   // v219: '+skills' mods are gated by item level 30 (SKILL_AFFIX_MIN_ILVL) in rollExtraAffixes instead of tier 3
}

// ---- Weight classes & level-gated armor tiers (v54; renamed v84) ---------
// Each armor material is now formally labeled a "weight class" for display
// purposes (Warrior/Plate=Heavy, Ranger/Leather=Medium, Mystic/Robe=Light --
// the underlying material strings and MATERIAL_FOR_CLASS mapping are
// unchanged everywhere else in the code, this is purely a label lookup).
const MATERIAL_WEIGHT_CLASS = {plate:'Heavy', leather:'Medium', robe:'Light'};
// Every material now has 3 named tiers instead of one flat name, gated by
// item level (the "depth"/ilvl generateItem is called with): ilvl 1-24 is
// tier 1, 25-49 is tier 2 (also requires character level 25 to equip), and
// 50+ is tier 3 (requires character level 50).
//
// v84 (equipment overhaul batch 3/3): the tier-name STRINGS below are the
// user's new final naming scheme, replacing v54's old Scale Mail/Breastplate/
// Full Plate (plate), Leather/Bear Hide/Demon Hide (leather) and Cloth
// Robes/Silk Robes/Arcane Vestments (robe) names -- but the KEYING/SHAPE of
// this table (ARMOR_TIER_NAME[material][tier][slotType]) is left exactly as
// it was, per spec, so nothing downstream (itemBaseName/generateItem) needs
// restructuring, only these string values. IMPORTANT wiring note the spec
// called out explicitly: this table is keyed by MATERIAL/weight-class, NOT
// by the wearing character's own class -- since v66's ARMOR_ACCESS_MATRIX
// made armor access an additive matrix (Warrior can wear all 3 weight
// classes, Ranger 2, Mystic 1), a Warrior in Robe-weight armor sees these
// same "Mystic-table" names and a Ranger in Plate-weight armor (nothing
// stops a Warrior-only item ending up in a Ranger's bag as loot, though
// only a Warrior could actually equip it) would see the "Warrior-table"
// names -- this was already how the OLD table worked (verified: the old
// code's lookup was ARMOR_TIER_NAME[item.material][...], never keyed off
// p.cls anywhere), so this batch only swaps the string content, preserving
// that convention exactly.
//
// v84 ALSO extends this table to the Gloves and Boots slots, which had NO
// tiered/weight-class name at all before this batch (see the doc note on
// isWeightNamedSlot in generateItem for the judgment call on how their
// `.material` is now assigned -- for NAMING/display purposes only, with
// zero effect on stat rolls, exactly as before this batch).
const ARMOR_TIER_NAME = {
  plate:   {1:{helm:'Battle Helm',     armor:'Breastplate', gloves:'Gauntlets',       boots:'War Boots'},
            2:{helm:'Warrior Casque',  armor:'Field Plate',  gloves:'Chainmail Grips', boots:'Plate Greaves'},
            3:{helm:'Grand Crown',     armor:'Full Plate',   gloves:"King's Grasp",    boots:'Gore Riders'}},
  leather: {1:{helm:'Leather Cap',     armor:'Leather Armor',   gloves:'Leather Gloves',   boots:'Leather Boots'},
            2:{helm:'Scalehide Hood',  armor:'Scalehide Armor', gloves:'Scalehide Gloves', boots:'Scalehide Boots'},
            3:{helm:"Falcon's Visor",  armor:'Demonhide Armor', gloves:'Demonhide Grips',  boots:'Demonhide Boots'}},
  robe:    {1:{helm:'Adept Focus',     armor:'Cloth Robes',  gloves:'Cloth Gloves', boots:'Cloth Shoes'},
            2:{helm:'Magi Mask',       armor:'Adept Robes',  gloves:'Silk Mitts',   boots:'Silk Shoes'},
            3:{helm:"Arcanist's Diadem",armor:"Arcanist's Vestment", gloves:"Arcanist's Grasp", boots:"Traveler's Treads"}},
};
// v82: per-tier stat multiplier now comes from the single shared
// ITEM_TIER_MULT table (see above) -- ARMOR_TIER_STAT_MULT removed.

// ---- Ranger Bow: same idea, now sharing the SAME unified tier brackets as
// everything else (v82 removed the old bow-specific "tier 2 at 35" rule).
// v84: renamed Tier 2 "Hunter Bow" -> "Hunter's Bow" per the final naming
// spec (Tier 1/3 unchanged).
const BOW_TIER_NAME = {1:'Simple Bow', 2:"Hunter's Bow", 3:'Recurve Bow'};

// ---- Greatsword (weapon2h): same tiering pattern, v55 ----------------------
// The two-handed weapon slot ("Greatsword") now gets the same 3-tier,
// level-gated treatment as armor/bow, in service of the Berserker tree's new
// Weapon Specialization skill ("unlocks Longsword use"). v84: Tier 3 renamed
// "Demonsword" -> "Demonblade" per the final naming spec (also updated in
// every other place that string appeared -- flavor text, comments).
const WEAPON2H_TIER_NAME = {1:'Longsword', 2:'Greatsword', 3:'Demonblade'};
// v82: WEAPON2H_TIER_LEVELS/WEAPON2H_TIER_STAT_MULT removed -- weapon2h now
// shares the unified ITEM_TIER_LEVEL_BRACKETS/ITEM_TIER_MULT like armor/bow.

// ---- v84: new tier-name tables for the 3 remaining Warrior-only weapon
// slots (Shield, 1-Handed Sword) plus Staff (Mystic) and Belt. These 4 slot
// types had NO tiered name at all before this batch (flat ITEM_BASE_NAME
// strings regardless of ilvl/tier -- Sword/Shield/Staff -- see generateItem's
// hardcoded 'Staff' baseName for the staff branch). Shield/1H-Sword/Staff
// are weapon-type slots, so -- like Bow/weapon2h above -- they are tiered by
// TIER ONLY, with no material/weight-class dimension (weapons are not part
// of the ARMOR_ACCESS_MATRIX). Belt is likewise tier-only, but per spec its
// names are the SAME regardless of which class equips it (it was never
// material/class-flavored to begin with -- no MATERIAL_BASE_NAME.belt entry
// exists either), so it uses this same flat tier-only shape.
const WEAPON1H_TIER_NAME = {1:'Simple Sword', 2:'Knight Sword', 3:'Conquer Sword'};
const SHIELD_TIER_NAME = {1:'Buckler', 2:'Kite Shield', 3:'Crown Shield'};
const STAFF_TIER_NAME = {1:'Simple Staff', 2:"Adept's Occulus", 3:'Arcanist Puzzle'};
const BELT_TIER_NAME = {1:'Sash', 2:'Belt', 3:'Heavy Belt'};

function itemBaseName(item){
  if(item.baseName) return item.baseName;
  if((item.slotType==='helm'||item.slotType==='armor'||item.slotType==='gloves'||item.slotType==='boots') && item.material){
    if(item.tier && ARMOR_TIER_NAME[item.material]) return ARMOR_TIER_NAME[item.material][item.tier][item.slotType];
    return MATERIAL_BASE_NAME[item.material][item.slotType];
  }
  if(item.slotType==='bow' && item.tier) return BOW_TIER_NAME[item.tier];
  if(item.slotType==='weapon2h' && item.tier) return WEAPON2H_TIER_NAME[item.tier];
  if(item.slotType==='weapon1h' && item.tier) return WEAPON1H_TIER_NAME[item.tier];
  if(item.slotType==='shield' && item.tier) return SHIELD_TIER_NAME[item.tier];
  if(item.slotType==='staff' && item.tier) return STAFF_TIER_NAME[item.tier];
  if(item.slotType==='belt' && item.tier) return BELT_TIER_NAME[item.tier];
  return ITEM_BASE_NAME[item.slotType];
}
// Which class (display name), if any, is allowed to equip this item --
// used by the item-detail tooltip to show a "(Warrior Only)" style line.
// v66: armor is NO LONGER strictly single-class (see ARMOR_ACCESS_MATRIX --
// a class's access is now a broader weight-class matrix, so a flat "(X
// Only)" label on armor would be misleading and has been removed). This
// now covers ONLY the 3 class-locked WEAPON types, which remain strictly
// single-class: Staff (Mystic), Bow (Ranger), and the two-handed sword
// line -- Longsword/Greatsword/Demonblade, slotType weapon2h -- (Warrior).
function itemClassRestriction(item){
  if(item.slotType==='staff') return 'Mystic';
  if(item.slotType==='bow') return 'Ranger';
  if(item.slotType==='weapon2h') return 'Warrior';
  if((item.slotType==='helm'||item.slotType==='armor'||item.slotType==='gloves'||item.slotType==='boots') && item.material) return MATERIAL_CLASS_NAME[Object.keys(MATERIAL_FOR_CLASS).find(k=>MATERIAL_FOR_CLASS[k]===item.material)]||null;
  return null;
}

// ---- (v345) Base types: continuous names by item level, base stats that scale with item level ----
const BASE_BRACKETS = [1,12,25,40,60];   // v393: re-spaced for the level-80 cap
const BASE_TYPE_NAMES = {
  weapon1h: ['Short Sword','Gladius','Broadsword','Knight Sword','Conquer Sword'],
  weapon2h: ['Longsword','Bastard Sword','Claymore','Greatsword','Demonblade'],
  bow:      ['Short Bow',"Hunter's Bow",'Longbow','Recurve Bow','War Bow'],
  shield:   ['Buckler','Round Shield','Kite Shield','Tower Shield','Crown Shield'],
  belt:     ['Sash','Leather Belt','Plated Belt','Heavy Belt','War Belt'],
  staff:    ['Gnarled Staff',"Adept's Occulus",'Sage Staff','Arcanist Puzzle','Archmage Staff'],
};
// (v390) Armor now uses the same 5 item-level brackets as weapons (1 / 10 / 20 / 35 / 50)
const ARMOR_BASE_NAMES = {
  plate:   {helm:['Battle Helm','Barbute','Warrior Casque','Great Helm','Grand Crown'],
            armor:['Breastplate','Cuirass','Field Plate','Gothic Plate','Full Plate'],
            gloves:['Gauntlets','Studded Gauntlets','Chainmail Grips','Plated Gauntlets',"King's Grasp"],
            boots:['War Boots','Iron Boots','Plate Greaves','Warlord Greaves','Gore Riders']},
  leather: {helm:['Leather Cap',"Hunter's Hood",'Scalehide Hood',"Ranger's Cowl","Falcon's Visor"],
            armor:['Leather Armor','Studded Leather','Scalehide Armor','Wyrmhide Armor','Demonhide Armor'],
            gloves:['Leather Gloves','Studded Gloves','Scalehide Gloves','Wyrmhide Gloves','Demonhide Grips'],
            boots:['Leather Boots','Studded Boots','Scalehide Boots','Wyrmhide Boots','Demonhide Boots']},
  robe:    {helm:['Adept Focus','Initiate Circlet','Magi Mask','Sage Circlet',"Arcanist's Diadem"],
            armor:['Cloth Robes','Linen Robes','Adept Robes','Sage Vestment',"Arcanist's Vestment"],
            gloves:['Cloth Gloves','Linen Gloves','Silk Mitts','Sage Mitts',"Arcanist's Grasp"],
            boots:['Cloth Shoes','Linen Shoes','Silk Shoes','Sage Slippers',"Traveler's Treads"]},
};
function baseBracketIdx(ilvl){ let k=0; for(let i=0;i<BASE_BRACKETS.length;i++) if(ilvl>=BASE_BRACKETS[i]) k=i; return k; }
const ARMOR_SLOT_WEIGHT = {armor:1.4, helm:0.5, gloves:0.3, boots:0.3, shield:0.75};
const ARMOR_MATERIAL_WEIGHT = {plate:1.15, leather:0.7, robe:0.4};
// Flat base stat of an item at a given item level (before the +-10% roll). Rarity never changes it.
// (v391) a base type's stats are mostly set by its bracket: only half of the growth inside a bracket counts
// v457: every weapon carries a damage RANGE (min-max). Its average stands in for what the old
// "12 + 2.2 per level + weapon damage" base used to be, so a weapon of your level hits about as hard as before.
// One-handers are tight and steady, two-handers wide and swingy, bows in between, staves wide but topping out lower.
const WPN_SHAPE = {weapon1h:{a:14, b:2.86, spread:0.15}, weapon2h:{a:16.7, b:3.56, spread:0.40}, bow:{a:15, b:3.04, spread:0.25}, staff:{a:21, b:2.02, spread:0.35}};   // v458: -12%
const FLAT_ELEM_WEAPON = {weapon1h:1, weapon2h:1, bow:1};   // only these can roll flat damage
function weaponDamageAffix(cat, ilvl){
  const sh = WPN_SHAPE[cat]; if(!sh) return null;
  const L = Math.max(1, ilvl||1), avg = (sh.a + sh.b*L)*rand(0.92,1.08);
  const min = Math.max(1, Math.round(avg*(1-sh.spread))), max = Math.max(min+1, Math.round(avg*(1+sh.spread)));
  return {key:'wpnDmg', label:'Damage', min, max, value:Math.round((min+max)/2), base:true, v458:true};
}
function baseStatValue(category, material, ilvl){
  const L0 = Math.max(1, ilvl||1), fl = BASE_BRACKETS[baseBracketIdx(L0)];
  const L = fl + 0.5*(L0 - fl);
  const wpn = 4 + 1.05*L, arm = (2 + 0.3*L)*DEF_SCALE;
  let v = 0;
  if(category==='weapon1h') v = wpn;
  else if(category==='weapon2h') v = wpn*1.75;
  else if(category==='bow') v = wpn*1.2;
  else if(category==='shield') v = arm*ARMOR_SLOT_WEIGHT.shield;
  else if(ARMOR_SLOT_WEIGHT[category]) v = arm*ARMOR_SLOT_WEIGHT[category]*(ARMOR_MATERIAL_WEIGHT[material]||1);
  return Math.max(1, Math.round(v*rand(0.9,1.1)));
}
// (v346) Base-type implicits: every slot has one. Values scale with item level (+-12% roll); mods roll on top.
const ELEM_RES_IMPLICIT = (key,label)=>({key, label, f:L=>Math.min(MAX_SINGLE_RESIST_PER_ITEM, 8+0.25*L)});
const IMPLICIT_FORMULA = {
  armor:{label:'Defense', f:L=>(2+0.15*L)*DEF_SCALE},
  dexterity:{label:'Dexterity', f:L=>4+0.6*L},
  hp:{label:'Health', f:L=>10+1.6*L},
  mp:{label:'Mana', f:L=>5+0.5*L},
  dmg:{label:'Damage', f:L=>2+0.5*L},
  physDmgPct:{label:'Physical Damage %', f:L=>Math.min(18, 4+0.15*L)},
  fireResistPct:{label:'Fire Resist %', f:L=>Math.min(MAX_SINGLE_RESIST_PER_ITEM, 8+0.25*L)},
  coldResistPct:{label:'Cold Resist %', f:L=>Math.min(MAX_SINGLE_RESIST_PER_ITEM, 8+0.25*L)},
  lightningResistPct:{label:'Lightning Resist %', f:L=>Math.min(MAX_SINGLE_RESIST_PER_ITEM, 8+0.25*L)},
  poisonResistPct:{label:'Poison Resist %', f:L=>Math.min(MAX_SINGLE_RESIST_PER_ITEM, 8+0.25*L)},
  allResistPct:{label:'All Resist %', f:L=>Math.min(12, 2+0.12*L)},
  goldFindPct:{label:'Gold Find %', f:L=>8+0.5*L},
  magicFindPct:{label:'Magic Find %', f:L=>5+0.3*L},
  lifeRegenPct:{label:'Life Regen %', f:L=>0.3+0.02*L, dec:1},
  atkSpeedPct:{label:'Attack Speed %', f:L=>3+0.06*L},
  moveSpeedPct:{label:'Move Speed %', f:L=>2+0.05*L},
  projectileSpeedPct:{label:'Projectile Speed %', f:L=>6+0.2*L},
};
const BELT_VARIANTS = [{name:'Plated Belt', key:'armor'}, {name:'Leather Belt', key:'dexterity'}, {name:'Heavy Sash', key:'hp'}];
const RING_VARIANTS = [{name:'Iron Ring', key:'physDmgPct'}, {name:'Ruby Ring', key:'fireResistPct'}, {name:'Sapphire Ring', key:'coldResistPct'}, {name:'Topaz Ring', key:'lightningResistPct'}, {name:'Emerald Ring', key:'poisonResistPct'}];
const AMULET_VARIANTS = [{name:'Gold Amulet', key:'goldFindPct'}, {name:'Jade Amulet', key:'magicFindPct'}, {name:'Bone Amulet', key:'lifeRegenPct'}, {name:'Sun Amulet', key:'hp'}];
const VARIANT_TABLE = {belt:BELT_VARIANTS, ring:RING_VARIANTS, amulet:AMULET_VARIANTS};
const BOOT_MS_RANGE = [[2,5],[4,7],[5,9],[6,11],[7,13]];   // v489: T1..T5 boot move speed
const FIXED_IMPLICIT_KEY = {gloves:'atkSpeedPct', boots:'moveSpeedPct', bow:'projectileSpeedPct', staff:'mp'};
// Returns {affix, variantName} for categories handled by the formula table (everything except the 3 old pct implicits)
function rollFormulaImplicit(category, material, ilvl){
  let key = null, variantName = null;
  if(VARIANT_TABLE[category]){ const v = VARIANT_TABLE[category][Math.floor(Math.random()*VARIANT_TABLE[category].length)]; key = v.key; variantName = v.name; }
  else if(category==='helm') key = material==='robe' ? 'mp' : 'hp';
  else key = FIXED_IMPLICIT_KEY[category];
  if(!key) return null;
  const d = IMPLICIT_FORMULA[key];
  if(key==='moveSpeedPct' && category==='boots'){   // v489: boots roll a set range per item-level tier (T1 2-5% ... T5 7-13%)
    let ti = 0; for(let i=0;i<MOD_TIER_REQ.length;i++) if((ilvl||1)>=MOD_TIER_REQ[i]) ti = i;
    const [lo,hi] = BOOT_MS_RANGE[ti];
    return {affix:{key, label:d.label, value:lo+Math.floor(Math.random()*(hi-lo+1)), implicit:true}, variantName};
  }
  let v = d.f(Math.max(1, ilvl||1))*rand(0.88,1.12);
  v = d.dec ? Math.max(0.1, Math.round(v*10)/10) : Math.max(1, Math.round(v));
  return {affix:{key, label:d.label, value:v, implicit:true}, variantName};
}
// Rare names: "Adjective Noun", the noun chosen by slot
const RARE_ADJ = ['Doom','Grim','Storm','Blood','Rune','Shadow','Iron','Ember','Frost','Wrath','Dread','Soul','Bone','Night','Thunder','Viper','Raven','Wyrm','Gloom','Cinder','Ash','Gale','Venom','Oath','Skull','Spite','Hollow','Mourn'];
const RARE_NOUN = {
  weapon1h:['Bite','Fang','Edge','Cleaver','Bane','Reaver','Song','Sting'],
  weapon2h:['Cleaver','Bane','Reaver','Splitter','Brand','Cleave','Maul'],
  bow:['Wind','Sting','Thorn','Song','Flight','Arc'],
  staff:['Spire','Rod','Bough','Focus','Wand','Beacon'],
  shield:['Wall','Ward','Bastion','Aegis','Bulwark','Guard'],
  helm:['Crown','Brow','Visage','Cowl','Horn','Gaze'],
  armor:['Shell','Carapace','Hide','Plate','Mantle','Bulwark'],
  gloves:['Grip','Fist','Talon','Clutch','Hold'],
  boots:['Stride','Tread','Track','Step','Greaves'],
  belt:['Cinch','Girdle','Coil','Bind','Clasp'],
  ring:['Loop','Band','Seal','Coil','Turn'],
  amulet:['Eye','Heart','Charm','Locket','Pendant'],
};
function makeRareName(category){
  const nn = RARE_NOUN[category] || ['Relic'];
  return RARE_ADJ[Math.floor(Math.random()*RARE_ADJ.length)]+' '+nn[Math.floor(Math.random()*nn.length)];
}
// Skill-bonus mods: nothing below item level 30; +1 at 30, +2 at 40, +3 at 50
function skillValueForIlvl(ilvl){ return ilvl>=65 ? 2 : 1; }   // v429: +3 removed, +2 only at very high item level

// Weapons/shields always roll a guaranteed innate stat (their "reason to exist"),
// on top of the usual rarity-based random affixes.
const INNATE_STAT = {
  weapon1h: {key:'dmg',   label:'Damage', suffix:'of Wrath', base:10},
  weapon2h: {key:'dmg',   label:'Damage', suffix:'of Ruin',  base:24},
  shield:   {key:'armor', label:'Defense',  suffix:'of Wards', base:9},
  bow:      {key:'dmg',   label:'Damage', suffix:'of the Hawk', base:13},
  staff:    {key:'dmg',   label:'Damage', suffix:'of Embers', base:16},
};

// v82: rdef.mult is no longer read by the modifier-value formula (see
// rollAffixModifierValue above -- rarity now only controls modifier
// COUNT, via statCount below / RARE_STAT_CAP_BY_TIER for rare). Left in
// place, unused, rather than removed, since other code doesn't read it
// either and deleting the field isn't necessary to satisfy the rework.
const RARITY = {
  common: {name:'Common', color:'#9aa0a8', statCount:1, mult:1.0},
  magic:  {name:'Magic',  color:'#5b8cff', statCount:2, mult:1.4},
  rare:   {name:'Rare',   color:'#e8c44a', statCount:3, mult:1.9},
};

// v82: the "Range"/"Reach" affix (key:'range') has been REMOVED per design
// -- it no longer rolls on any newly-generated item and its old
// aggregation branch has been removed from recalcStats, so a leftover
// 'range' affix stored on an item from an OLD save is simply inert dead
// data now. See recalcStats and the weaponReachBonus rename for the full
// removal writeup. It is NOT reintroduced anywhere in the v83 pool below.
//
// Evasion: not part of the general random affix pool (it's an innate
// Leather-only stat, always appended -- see generateItem), but declared
// here so its label is available in one place for both item generation
// and any UI that wants to describe the stat by key.
const EVASION_AFFIX_LABEL = 'Evasion %';

