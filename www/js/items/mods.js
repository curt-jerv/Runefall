// v82: first argument is now the character's CURRENT LEVEL at the moment
// of the drop (every caller was updated accordingly -- see the callers'
// comments). Depth plays no role anywhere in this function any more.
// v83: rolls up to `count` extra random affixes for one item from its
// category's combined prefix+suffix pool (EQUIP_AFFIXES[category]),
// applying both the tier3Only/staff gate and the new rangerArmor gate
// (affixEligibleForItem), and excluding any pool entry that shares a key
// with the item's own innate stat (so e.g. a shield's innate Armor value
// never rolls a redundant second "Armor" line from the Warding suffix
// alongside it -- same exclusion v82 already did against the old flat
// pool). Each returned affix carries `word`/`slot` (for itemDisplayName)
// plus whatever skillTree/skillGroup/allSkills/tier3Only flag the pool
// entry itself has. "+skills"-style affixes (skillTree/skillGroup/
// allSkills set) ALWAYS roll their value as exactly 1, ignoring
// rollAffixModifierValue's normal tiered-numeric output -- see the
// EQUIP_AFFIXES doc comment for why.
// v89: no-duplicate-affix guarantee. `.key` alone is NOT always a unique
// identifier for a pool entry's underlying effect -- two independent
// judgment-call findings drove affixUniqueKey() below:
//   1) Several categories have a real cross-list collision where a prefix
//      and a suffix grant the SAME stat under different words, e.g.
//      weapon2h's prefix "Precise" and suffix "Destruction" both carry
//      key:'critChance', and bow's prefix "Cunning" and suffix "Cunning"
//      both carry key:'atkSpeedPct'. The old shuffle-then-slice(0,count)
//      selection below could pick both, stacking the same modifier twice
//      on one item -- exactly the bug this batch fixes.
//   2) Conversely, every skillTree/skillGroup/allSkills "+X skills" affix
//      (see ring's long prefix list) shares the literal generic key
//      'skillTree' or 'skillGroup' across many textually-DIFFERENT bonuses
//      (Berserker's Skills vs Templar's Skills vs Djinn Skills, etc.) --
//      those are genuinely distinct modifiers and must NOT be deduped
//      against each other just because `.key` matches; the real identity
//      for these is key+specific tree/group. affixUniqueKey composes that.
// Selection is now a walk over the shuffled/filtered pool that skips any
// entry whose unique key was already claimed for this item (innate's key
// pre-seeds the exclusion the same way the old innateKey filter did, since
// innate stats never carry skillTree/skillGroup), stopping at `count`
// picks. If the eligible pool runs out before reaching `count` (possible
// for narrow tier3Only/rangerArmor-gated pools), it simply returns however
// many unique affixes it found -- no crash, no infinite loop. Nothing else
// about rarity-based stat COUNT, the tier-based value formula, tier3Only
// gating, or the rangerArmor gate changes; this only adds the "no
// duplicate effect within one item" constraint on top of the existing
// selection.
// ---- v219 mod pool rules ----
const MOD_TIER_REQ = [1, 13, 26, 38, 60], MOD_TIER_SCALE = [0.7, 0.85, 1.0, 1.15, 1.3];   // T1..T5: item level required, value scale
function rollModTier(ilvl){
  let max = 0; for(let i=0;i<MOD_TIER_REQ.length;i++) if(ilvl>=MOD_TIER_REQ[i]) max = i;
  const w = []; let tot = 0;
  for(let i=0;i<=max;i++){ const x = i===max ? 3 : i===max-1 ? 2 : 1; w.push(x); tot += x; }
  let r = Math.random()*tot; for(let i=0;i<=max;i++){ r -= w[i]; if(r<=0) return i+1; }
  return max+1;
}
const AFFIX_WEIGHT = {magicFindPct:0.4, goldFindPct:0.4, thornDamage:0.5, lifeRegenPct:0.6, slowImmune:0.4, freezeImmune:0.4, skill:0.07};
const MF_GF_SLOTS = {ring:1, amulet:1, gloves:1, boots:1};
const AFFIX_FAMILY = {fireDmgPct:'elemPct', coldDmgPct:'elemPct', lightningDmgPct:'elemPct', poisonDmgPct:'elemPct', fireDmg:'elem', coldDmg:'elem', lightningDmg:'elem', poisonDmg:'elem', fireResistPct:'res', coldResistPct:'res', lightningResistPct:'res', poisonResistPct:'res'};
const FAMILY_CAP = {elem:1, elemPct:1, res:2};
const SKILL_AFFIX_MIN_ILVL = 36, RARE_MAX_PER_SIDE = 3;
const RARE_MOD_COUNT_BY_TIER = {1:[4,4], 2:[4,5], 3:[5,6]};
const IMPLICIT_BY_CAT = {weapon1h:{key:'critChance', label:'Crit Chance %'}, weapon2h:{key:'armorPenPct', label:'Armor Penetration %'}, shield:{key:'blockChancePct', label:'Block Chance %'}};
function affixUniqueKey(a){
  if(a.skillTree) return a.key+':tree:'+a.skillTree;
  if(a.skillGroup) return a.key+':group:'+a.skillGroup.join(',');
  return a.key;
}
function rollExtraAffixes(category, itemTier, ilvl, material, innateKey, count, rarity){
  return rollExtraAffixesRaw(category, itemTier, ilvl, material, innateKey, count, rarity);
}
function rollExtraAffixesRaw(category, itemTier, ilvl, material, innateKey, count, rarity){
  if(count<=0) return [];
  const catPool = EQUIP_AFFIXES[category];
  if(!catPool) return [];
  // (v119) skill-tree mods only roll for trees of the player's own class
  // (rings/amulets carry every class's trees). Unknown class = no restriction.
  const ownCls = (typeof game!=='undefined' && game && game.player && game.player.cls) || null;
  const ownTrees = ownCls ? SKILL_TREE_CLASS_GROUP[ownCls] : null;
  const combined = catPool.prefixes.concat(catPool.suffixes)
    .filter(a=>!(Array.isArray(innateKey) ? innateKey.indexOf(a.key)>=0 : a.key===innateKey))
    .filter(a=>{
      if(!ownTrees || category==='staff') return true;
      if(a.skillTree) return ownTrees.indexOf(a.skillTree)>=0;
      if(a.skillGroup) return a.skillGroup===ownTrees;
      return true;
    })
    // (v105) weapons, rings, amulets and belts can never roll Armor/Defence
    .filter(a=>!(NO_ARMOR_AFFIX_CATEGORIES[category] && ARMOR_AFFIX_KEYS[a.key]))
    .filter(a=>affixEligibleForItem(a, itemTier, category, material));
  // v219 Diablo-2-style rolling: weighted picks, prefix/suffix caps (magic 1+1, rare max 3+3), families, item-level gates
  const usedKeys = new Set();
  const chosen = [];
  const sideCap = rarity==='rare' ? RARE_MAX_PER_SIDE : (count>=2 ? 1 : 1);
  const sideCnt = {prefix:0, suffix:0}, famCnt = {};
  let pool = combined.filter(a=>{
    if((a.skillTree||a.skillGroup||a.allSkills) && ilvl<SKILL_AFFIX_MIN_ILVL) return false;
    if((a.key==='magicFindPct'||a.key==='goldFindPct') && !MF_GF_SLOTS[category]) return false;
    if(a.minIlvl && ilvl<a.minIlvl) return false;
    return true;
  });
  const weightOf = a=> a.key==='skillDurPct' ? 0.5 : a.key==='statusDurPct' ? (category==='staff' ? 2.5 : 0.5) : a.key==='dmgVsElitePct' ? 0.25 : a.key==='critDmgPct' ? 0.7 : (a.key==='lifeOnKill'||a.key==='manaOnKill'||a.key==='potionStrengthPct') ? 0.6 : (a.skillTree||a.skillGroup||a.allSkills) ? AFFIX_WEIGHT.skill : (AFFIX_WEIGHT[a.key]!=null ? AFFIX_WEIGHT[a.key] : 1);
  while(chosen.length<count){
    const cands = pool.filter(a=>{
      if(usedKeys.has(affixUniqueKey(a))) return false;
      if((sideCnt[a.slot]||0) >= sideCap) return false;
      const fam = AFFIX_FAMILY[a.key];
      if(fam && (famCnt[fam]||0) >= FAMILY_CAP[fam]) return false;
      if((category==='ring'||category==='amulet') && (a.skillTree||a.skillGroup||a.allSkills) && chosen.some(c=>c.skillTree||c.skillGroup||c.allSkills)) return false;   // v440: one +skill mod max on rings/amulets
      return true;
    });
    if(!cands.length) break;
    let tot = 0; for(const a of cands) tot += weightOf(a);
    let r = Math.random()*tot, pick = cands[cands.length-1];
    for(const a of cands){ r -= weightOf(a); if(r<=0){ pick = a; break; } }
    usedKeys.add(affixUniqueKey(pick)); sideCnt[pick.slot] = (sideCnt[pick.slot]||0)+1;
    const fam = AFFIX_FAMILY[pick.key]; if(fam) famCnt[fam] = (famCnt[fam]||0)+1;
    chosen.push(pick);
  }
  return chosen.map(a=>{
    const noTier = !!(a.skillTree||a.skillGroup||a.allSkills||isBooleanAffixKey(a.key));
    const mt = noTier ? undefined : rollModTier(ilvl), it3 = noTier ? itemTier : tierFromMt(mt);
    return {
    key:a.key, label:a.label, word:a.word, slot:a.slot, mt,
    skillTree:a.skillTree, skillGroup:a.skillGroup, allSkills:a.allSkills,
    // Bug fix (post-v97): boolean/binary affixes (freezeImmune, slowImmune
    // -- see isBooleanAffixKey/BOOLEAN_AFFIX_KEYS above) are flat flags,
    // not a scalable number, so they get the same non-numeric value:1
    // treatment as the "+X skills" affixes just above, instead of rolling
    // through rollAffixModifierValue like an ordinary stat.
    value: (a.skillTree||a.skillGroup||a.allSkills) ? skillValueForIlvl(ilvl) : isBooleanAffixKey(a.key) ? 1
           : (a.key==='moveSpeedPct' ? bootsMoveSpeedForTier(it3) : a.key==='aoeRadiusPct' ? aoeAffixRoll(it3) : a.key==='atkSpeedPct' ? atkSpeedAffixRoll(it3) : a.key==='lifeRegenPct' ? lifeRegenAffixRoll(it3) : PCT_AFFIX_ROLL[a.key] ? pctRollByMt(a.key, mt) : FLAT_DMG_KEYS[a.key] ? Math.max(1, Math.round(flatRollByMt(mt)*FLAT_DMG_AFFIX_SCALE)) : (a.key==='armor'||a.key==='defenceFlat') ? Math.max(1, Math.round(flatRollByMt(mt)*ARMOR_ITEM_SCALE*DEF_SCALE)) : flatRollByMt(mt))
  };});
}
// Picks the FIRST rolled prefix and FIRST rolled suffix (in roll order) out
// of a list of affixes for naming purposes -- see itemDisplayName's own
// doc comment just above it for the "only 1 of each shown, however many
// total modifiers the item has" rule.
function pickNamingAffixes(affixes){
  return { prefix: affixes.find(a=>a.slot==='prefix'), suffix: affixes.find(a=>a.slot==='suffix') };
}

// v83: optional 5th arg `dropPlayer` -- when passed, its item Magic Find %
// total (recalcStats' p.magicFindPct) biases an UNFORCED rarity roll (see
// pickRarity). Backward compatible: every pre-existing call site that
// doesn't pass it behaves exactly as before (magicFindPct defaults to 0).
// (v118) Armor is now a flat per-hit subtraction, so item armor values are
// scaled down by ARMOR_ITEM_SCALE (revert: set to 1). Wrapper keeps every
// call site unchanged.
function generateItem(...args){ const it = generateItemRaw(...args); migrateItemAffixes(it);
  // v362: a rare chance for gear to drop with sockets (max 2), from level 30 up
  if(it && (args[0]||0)>=20 && SOCKETABLE[it.slotType] && !(it.sockets>0) && Math.random()<socketChance(args[0]||0)){ it.sockets = Math.random()<0.2 ? 2 : 1; it.socketed = []; }
  return it; }
function generateItemRaw(charLevel, forcedRarity, forcedCategory, forcedMaterial, dropPlayer){
  const category = forcedCategory || pickItemCategory();
  let forceTwoMods = false;
  if(forcedRarity==='reward'){ forcedRarity = rewardRarity(charLevel); forceTwoMods = forcedRarity==='magic'; }
  let rarity = forcedRarity || pickRarity(charLevel, category, dropPlayer && dropPlayer.magicFindPct);
  // Safety net: rings/amulets can never end up Common, even if a caller
  // forces 'common' explicitly (e.g. shop restock, a chest reward table).
  if((category==='ring' || category==='amulet') && rarity==='common') rarity = 'magic';
  const rdef = RARITY[rarity];

  // ---- v82: roll this item's internal item level + tier ONCE, up front,
  // shared by every category below (staves included) -- see
  // rollItemLevel/itemTierForItemLevel/itemTierLevelReq/
  // rollAffixModifierValue near the top of the file. `ilvl` is NEVER
  // exposed to the player; only the resulting tier (1/2/3) and the
  // rolled stat numbers are ever shown. ----
  const ilvl = rollItemLevel(charLevel);
  const itemTier = itemTierForItemLevel(ilvl);
  // Rare's modifier-count cap is tier-dependent (see RARE_STAT_CAP_BY_TIER);
  // Common/Magic keep their existing flat RARITY.statCount (1/2). v83:
  // Rings/Amulets follow this SAME tier-based system as every other slot
  // (judgment call -- see the ring/amulet doc note near RARE_STAT_CAP_BY_TIER
  // usage below) rather than a bespoke "always up to 6" special case; a
  // Tier 3 rare ring/amulet naturally lands on 6, which is exactly the cap
  // the spec's "up to 6 total modifiers" language called for.
  const statCount = rarity==='rare' ? RARE_STAT_CAP_BY_TIER[itemTier] : rdef.statCount;
  // v219: rares roll 4-6 EXTRA mods (on top of the base's own stats), by tier: T1 4, T2 4-5, T3 5-6
  const rareExtra = rarity==='rare' ? (()=>{ const r = RARE_MOD_COUNT_BY_TIER[itemTier]||[4,4]; return r[0] + (Math.random()<0.3 ? (r[1]-r[0]) : 0); })() : 0;  // v221: top mod count only 30%
  // (v120) Magic items roll 2 mods (1 prefix + 1 suffix) most of the time, but
  // sometimes only 1. Implicit stats (armor/damage/spell) are on top of these.
  const magicMods = rarity==='magic' ? ((!forceTwoMods && Math.random()<MAGIC_SINGLE_MOD_CHANCE) ? 1 : 2) : null;

  // ---- Staves: always exactly one of the 3 named elemental variants. ----
  // Common staves show ONLY their "+1 to <Spell>" stat. Magic/Rare staves
  // show that stat (Rare at +2, "a higher level attack") PLUS the normal
  // rarity-based random affixes every other item type rolls. The "+1/+2
  // to Spell" mechanic is intentionally NOT gated by itemTier or the
  // tier3Only rule (see affixEligibleForTier) -- staves keep it at every
  // tier, per design.
  if(category==='staff'){
    const spell = STAFF_SPELLS[Math.floor(Math.random()*STAFF_SPELLS.length)];
    const spellInfo = STAFF_SPELL_INFO[spell];
    const spellPowerTier = (rarity==='rare' && ilvl>=35) ? 2 : 1;   // v345: +2 only from item level 35
    let affixes = [weaponDamageAffix('staff', ilvl), {key:'spellPower', spell, label:spellInfo.label, value:spellPowerTier}];
    const sImp = rollFormulaImplicit('staff', null, ilvl); if(sImp) affixes.push(sImp.affix);   // v346: staff implicit +Mana
    if(rarity!=='common'){
      const extraCount = magicMods!==null ? magicMods : (rarity==='rare' ? rareExtra : Math.max(0, statCount-1));
      affixes = affixes.concat(rollExtraAffixes('staff', itemTier, ilvl, null, 'mp', extraCount, rarity));
    }
    // v83: a staff's display-name SUFFIX slot stays the item's existing
    // "of <Spell>" identity (its defining feature) rather than switching
    // to the new suffix pool's word -- see EQUIP_AFFIXES.staff's doc note.
    // Only the new PREFIX pool (Powerful/Cunning/Attuned/Deadly/
    // Concentrated/Precise/Elementalist's) composes with it, e.g.
    // "Powerful Rare Staff of Fire". The staff suffix-pool entries
    // (Fire/Ice/Lightning/Poison/The Dead/The Sky) still roll normally as
    // ordinary stat affixes above (elemental damage or a Necromancer/Djinn
    // skill bonus) and show in the tooltip -- they just never occupy the
    // name's "of X" slot, since that's always the spell.
    const { prefix } = pickNamingAffixes(affixes);
    // v84: baseName is now STAFF_TIER_NAME[itemTier] (Simple Staff/Adept's
    // Occulus/Arcanist Puzzle) instead of the old hardcoded flat 'Staff' --
    // the "of <Spell>" suffix slot is untouched, still always the spell.
    const staffBaseName = BASE_TYPE_NAMES.staff[baseBracketIdx(ilvl)];
    const name = itemDisplayName(rdef.name, staffBaseName, prefix && prefix.word, null, 'staff') + (rarity==='rare' ? '' : ' of ' + spellInfo.label);
    const sOut = {
      id:'it'+Math.random().toString(36).slice(2,9), slotType:'staff', rarity, name, baseName:staffBaseName, nameV3:true, flatDmgScaled:true, armorScaled:true, defV4:true, affixes, color:rdef.color,
      twoHanded:true, spell,
      tier: itemTier, ilvl, reqV2:true, bracket: baseBracketIdx(ilvl),
      levelReq: 0,
    };
    sOut.levelReq = computeLevelReq(sOut);
    return sOut;
  }

  // ---- Helm/Armor: roll a material (Plate/Leather/Robe), each with its
  // own guaranteed innate Armor value (Plate>Leather>Robe) and, for
  // Leather, an extra guaranteed Evasion stat. ----
  const isArmorSlot = category==='helm' || category==='armor';
  // v84: Gloves/Boots now ALSO roll a `.material` -- but ONLY so their
  // display name can pull the correct weight-class row out of the (now
  // extended) ARMOR_TIER_NAME table below, e.g. a Leather-weight boot shows
  // "Scalehide Boots" the same way a Leather-weight Armor piece shows
  // "Scalehide Armor". Deliberate judgment call: every OTHER use of
  // `material` in this function (the guaranteed innate Armor-stat override,
  // and the guaranteed Leather Evasion affix push, both a few lines below)
  // stays gated to `isArmorSlot` (Helm/Armor only, unchanged from before
  // this batch) via isWeightNamedSlot being a separate, wider flag -- so
  // Gloves/Boots gain ONLY a cosmetic weight-class-flavored name from this
  // change, with zero effect on their stat rolls, affix pool eligibility,
  // or the rangerArmor gate (rollExtraAffixes below is still passed `null`
  // for Gloves/Boots, exactly as before -- see EQUIP_AFFIXES's doc note on
  // why 'rangerArmor' treats "no material concept" as always-eligible).
  // This keeps the batch's promise that nothing beyond name-table content
  // changes for every OTHER piece of downstream logic.
  const isWeightNamedSlot = isArmorSlot || category==='gloves' || category==='boots';
  const material = isWeightNamedSlot ? (forcedMaterial || ARMOR_MATERIALS[Math.floor(Math.random()*ARMOR_MATERIALS.length)]) : null;

  let innate = INNATE_STAT[category];
  // (v105) Gloves and Boots now carry an implicit Armor stat too, same as
  // Helm/Armor (every material-carrying armor piece).
  if(material && isWeightNamedSlot){
    innate = {key:'armor', label:'Defense'};
  }
  let affixes = [];
  if(innate){
    // v345: D2-style flat base stat that scales with item level; rarity never changes it
    if(WPN_SHAPE[category]) affixes.push(weaponDamageAffix(category, ilvl));   // v457: weapons get a damage range
    else affixes.push({ key:innate.key, label:innate.label, value: baseStatValue(category, material, ilvl), base:true });
  }
  const extraCount = magicMods!==null ? magicMods : (rarity==='rare' ? rareExtra : (innate ? Math.max(0, statCount-1) : statCount));
  // v219: base implicit stat (sword crit, greatsword armor pen, shield block) -- tagged, not a rolled mod
  const implicitDef = IMPLICIT_BY_CAT[category];
  if(implicitDef){ const mmt = rollModTier(ilvl); affixes.push({key:implicitDef.key, label:implicitDef.label, value:Math.max(1, Math.round(pctRollByMt(implicitDef.key, mmt)*1.4)), mt:mmt, implicit:true}); }
  const fImp = implicitDef ? null : rollFormulaImplicit(category, material, ilvl);
  if(fImp) affixes.push(fImp.affix);
  const leatherInnateDex = false;   // v348: leather no longer carries an innate Dexterity implicit
  affixes = affixes.concat(rollExtraAffixes(category, itemTier, ilvl, isArmorSlot ? material : null, [innate ? innate.key : null, implicitDef ? implicitDef.key : null, fImp ? fImp.affix.key : null, leatherInnateDex ? 'dexterity' : null], extraCount, rarity));
  if(leatherInnateDex){
    // (v105) innate Dexterity replaces the old innate Evasion %; (v250) tiered, and the Agility suffix can no longer double it
    const dmt = rollModTier(ilvl);
    affixes.push({ key:'dexterity', label:'Dexterity', mt:dmt, value: flatRollByMt(dmt), implicit:true });
  }
  // v84: baseName lookup extended with the 4 new tier-only weapon/belt
  // tables (WEAPON1H_TIER_NAME/SHIELD_TIER_NAME/BELT_TIER_NAME) -- Bow and
  // weapon2h's own branches are unchanged (their tables' CONTENT was
  // updated, not their wiring). The `material` branch now also naturally
  // covers Gloves/Boots since they roll a material above.
  let baseName;
  if(material) baseName = ARMOR_BASE_NAMES[material][category][baseBracketIdx(ilvl)];
  else if(fImp && fImp.variantName) baseName = fImp.variantName;
  else if(BASE_TYPE_NAMES[category]) baseName = BASE_TYPE_NAMES[category][baseBracketIdx(ilvl)];
  else baseName = ITEM_BASE_NAME[category];
  // (v124) Rarity affects defenses: higher-rarity gear rolls more armor and stronger resists.
  const defMult = RARITY_ARMOR_MULT[rarity] || 1, resMult = RARITY_RESIST_MULT[rarity] || 1;
  for(const af of affixes){
    if(/ResistPct$/.test(af.key)) af.value = Math.min(af.key==='allResistPct' ? 12 : MAX_SINGLE_RESIST_PER_ITEM, Math.max(1, Math.round(af.value*resMult)));
  }
  const { prefix, suffix } = pickNamingAffixes(affixes);
  const name = itemDisplayName(rdef.name, baseName, prefix && prefix.word, suffix && suffix.word, category);
  const out = {
    id:'it'+Math.random().toString(36).slice(2,9), slotType:category, rarity, name, baseName, nameV3:true, flatDmgScaled:true, armorScaled:true, defV4:true, affixes, color:rdef.color,
    twoHanded: category==='weapon2h',
    material,
    tier: itemTier, ilvl, reqV2:true, bracket: baseBracketIdx(ilvl),
    levelReq: 0,
  };
  out.levelReq = computeLevelReq(out);
  return out;
}

// Dark Crypt (v73): "Ruins Map" -- a quest item, not a piece of gear. This
// game has no dedicated quest-item inventory/tab (the one existing quest
// reward, the Hunter quest's class weapon via grantQuestRewardItem, is just
// an ordinary equippable item generated through generateItem() above), so
// Ruins Map is built the same way every other item is (id/name/rarity/
// color/affixes, so it drops into the same grid bag via forceAddToBag with
// no special-casing there) but with slotType:'questitem' -- a slot that
// has no equip target (see tryAutoEquip/equipItem's final "else" branches,
// which only assign a targetSlot equal to the item's own slotType; there is
// no p.equipment.questitem, so it always simply fails to equip) -- and an
// empty affixes array, since it carries no combat stats. openItemDetail()
// hides the Equip button specifically for slotType==='questitem' so a
// curious tap can't shove it into that dead equipment key and make it
// disappear from the bag. No further quest logic reads this item yet --
// per the brief, it only needs to be obtainable and visible in the
// inventory; a future batch can wire an actual quest to it.
function makeTemplarRunestoneItem(){
  return {
    id:'it'+Math.random().toString(36).slice(2,9), slotType:'questitem', rarity:'rare',
    name:'Defensive Runestone', affixes:[], color:'#5fd0ff', questId:'templar_runestone', unsellable:true,
    questDesc:'A rune-carved stone marked with a shield, taken from the chest beneath the lake. A scholar may know what it is for. Quest item -- cannot be sold.',
  };
}
// v383: the Recipe Book, found after purging Breach floor 20: read it to learn every cauldron recipe
function makeRecipeBookItem(){
  return {
    id:'it'+Math.random().toString(36).slice(2,9), slotType:'questitem', rarity:'rare', shape:[2,2],
    name:'Recipe Book', affixes:[], color:'#f2a31b', questId:'recipe_book', unsellable:true,
    questDesc:'A charred, iron-bound tome of the witch\'s craft, found where the Breach was purged. Read it (Use, or right-click) to learn every cauldron recipe.',
  };
}
// v464: the great bosses each teach one random cauldron recipe the first time they fall (v490: the Wraith Lord too, no longer all of them)
const BOSS_RECIPE_BOSSES = [
  ['stormraptor', e=>e.stormRaptor, 'the Storm Raptor'], ['mastodon', e=>e.mastodon, 'the Mastodon'], ['colossus', e=>e.colossus, 'the Molten Colossus'],
  ['commander', e=>e.fhCmd, 'the Frosthold Commander'], ['construct', e=>e.type==='dwconstruct', 'the Ancient Dwarven Construct'],
  ['warden', e=>e.hwGuardian, 'the Ancient Warden'], ['gojira', e=>e.gj, 'Gojira'], ['flameraptor', e=>e.lr && !e.stormRaptor, 'the Flame Raptor'],
  ['wraithlord', e=>e.wlord || e.type==='wraithlord', 'the Wraith Lord']];   // v490: one recipe, like every other boss
function bossRecipeDrop(g, e){
  const p = g.player; if(!p || !e) return;
  p.recipeBoss = p.recipeBoss || {}; if(!p.recipes) p.recipes = {};
  const unknown = STONE_RECIPES.filter(r=>!p.recipes[r.id]);
  // v490: every boss (the Wraith Lord too) teaches exactly ONE recipe, the first time it falls
  const hit = BOSS_RECIPE_BOSSES.find(b=>b[1](e)); if(!hit || p.recipeBoss[hit[0]]) return;
  p.recipeBoss[hit[0]] = true;
  if(!unknown.length){ saveGame(); return; }
  const r = unknown[Math.floor(Math.random()*unknown.length)]; p.recipes[r.id] = true;
  const sd = PART_DEFS[r.stone];
  setTimeout(()=>{ showMsg('Recipe found on '+hit[2]+': '+sd.name, 4.0, '#f2a31b'); showPartToast('Recipe: '+sd.name+' = '+r.parts.map(k=>PART_DEFS[k].name).join(' + '), sd.color); }, 1200);
  saveGame();
}
function readRecipeBook(idx){
  const p = game.player, it = p.inventory[idx];
  if(!it || it.questId!=='recipe_book') return false;
  if(!p.recipes) p.recipes = {};
  for(const r of STONE_RECIPES) p.recipes[r.id] = true;
  p.inventory.splice(idx,1); p.recipeBookRead = true;
  showMsg('You study the Recipe Book. Every cauldron recipe is now known to you.', 4.0, '#f2a31b');
  try{ sfxPlay('banner', 0.8); }catch(e){}
  closeItemDetail(); try{ renderInventory(); }catch(e){}
  saveGame(); return true;
}
function makeRuinsMapItem(){
  return {
    id:'it'+Math.random().toString(36).slice(2,9), slotType:'questitem', rarity:'rare',
    name:'Ruins Map', affixes:[], color:'#e8c44a', questId:'ruins_map', unsellable:true,
    questDesc:'A hand-drawn map marking ruins somewhere beyond the crypt. Quest item -- cannot be sold.',
  };
}

