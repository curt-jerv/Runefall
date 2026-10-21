// ============================================================================
// ---- v83: full prefix/suffix affix pool + item-naming (equipment batch 2/3)
// ============================================================================
// Every equipment category now has its OWN prefix list and suffix list
// (replacing v82's single flat AFFIX_POOL shared by everything). Each entry:
//   word   -- the prefix/suffix word used in the item's generated NAME
//             (e.g. 'Flaming', 'Wrath') -- see itemDisplayName() below.
//   key    -- the stat key aggregated by recalcStats (several entries
//             across categories intentionally reuse the same key, e.g.
//             'critChance' -- that's fine, they just add together).
//   label  -- the stat's human-readable tooltip label (generic renderer,
//             same '+<value> <label>' format every item tooltip already
//             uses -- see the itemDetailStats/.title code that reads
//             it.affixes).
//   tier3Only -- reuses the EXISTING affixEligibleForTier()/v82 gate: only
//             eligible on Tier 3 gear (ilvl 51+ bracket), EXCEPT on staves,
//             which are exempt (see affixEligibleForTier). Set on every
//             "+1 to skills"-style affix below EXCEPT the staff ones,
//             which are deliberately left unset since staves are already
//             unconditionally exempt from the gate either way.
//   skillTree / skillGroup / allSkills -- which effectiveRank() bucket(s)
//             this "+1 to skills" affix feeds (see the v83 section right
//             above treesForClass). Exactly one of these three is set on
//             any affix that grants a skill-rank bonus; value is ALWAYS
//             forced to 1 per instance regardless of the item's rolled
//             tier/ilvl (a "+1 to skills" affix always reads literally as
//             +1 -- see generateItem's v83 section, which overrides
//             rollAffixModifierValue's normal numeric output to exactly 1
//             for these three flag types; multiple such items simply stack
//             additively through effectiveRank/p.skillBonusByTree).
//   gate   -- 'rangerArmor': Diablo-2-style "+Dodge%" (Agility) is only
//             meant to roll on gear a Ranger could actually wear. Only
//             Helm/Armor currently carry a `.material` weight-class field
//             (see ARMOR_ACCESS_MATRIX/canEquipArmorMaterial) -- Boots/
//             Belt/Gloves have no material/weight-class system at all yet
//             (any class can equip any boots/belt/gloves, full stop), so
//             there is nothing to gate on those slots: the judgment call
//             is that 'rangerArmor' EXCLUDES material==='plate' wherever a
//             material exists (Helm), and is always eligible wherever no
//             material concept exists yet (Boots/Belt) -- see
//             affixEligibleForItem() below, which is the actual check.
// These 3 arrays are the actual per-class-family tree groupings, declared
// here (ahead of EQUIP_AFFIXES's use of them in the ring/amulet "+1 to all
// X-class skills" entries below) since const declarations in this IIFE
// aren't hoisted the way function declarations are. SKILL_TREE_CLASS_GROUP
// (declared later, right before treesForClass/effectiveRank) reuses these
// SAME array objects -- see its own comment -- so there is exactly one
// source of truth for each grouping, just referenced from two places.
const SKILL_TREE_CLASS_GROUP_KEY_MYSTIC = ['djinn','elementalist','necromancer'];
const SKILL_TREE_CLASS_GROUP_KEY_WARRIOR = ['defender','berserker','templar'];
const SKILL_TREE_CLASS_GROUP_KEY_RANGER = ['survivalist','marksman','hunter'];
const EQUIP_AFFIXES = {
  weapon1h: {
    prefixes: [
      {word:'Honed',      key:'physDmgPct', label:'Physical Damage %'},
      {word:'Precise',    key:'critChance', label:'Crit Chance %'},
      {word:'Flaming',    key:'fireDmg',     label:'Fire Damage to Weapon Attacks'},
      {word:'Chilling',   key:'coldDmg',     label:'Cold Damage to Weapon Attacks'},
      {word:'Lightning',  key:'lightningDmg',label:'Lightning Damage to Weapon Attacks'},
      {word:'Poisoning',  key:'poisonDmg',   label:'Poison Damage to Weapon Attacks'},
      {word:'Concentrated',key:'aoeRadiusPct', label:'Area of Effect %'},
      {word:"Berserker's",key:'skillTree',   label:'Berserker Skills', skillTree:'berserker', tier3Only:true},
    ],
    suffixes: [
      {word:'Wrath',       key:'dmg',            label:'Physical Damage to Weapon Attacks'},
      {word:'the Elements',key:'elemDmgPct',     label:'Elemental Damage %'},
      {word:'Embers',      key:'fireDmgPct',     label:'Fire Damage %'},
      {word:'Frost',       key:'coldDmgPct',     label:'Cold Damage %'},
      {word:'Storms',      key:'lightningDmgPct',label:'Lightning Damage %'},
      {word:'Venom',       key:'poisonDmgPct',   label:'Poison Damage %'},
      {word:'Cunning',     key:'atkSpeedPct',     label:'Attack Speed %'},
      {word:'Vampire',     key:'lifeLeechPct',    label:'Life Leech %'},
      {word:'Bloodletting',key:'bleedChancePct',  label:'Bleed Chance %'},
      {word:'Luck',        key:'magicFindPct',    label:'Magic Find %'},
      {word:'Riches',      key:'goldFindPct',     label:'Gold Find %'},
      {word:'The Templar', key:'skillTree',       label:'Templar Skills', skillTree:'templar', tier3Only:true},
    ],
  },
  weapon2h: {
    prefixes: [
      {word:'Honed',      key:'physDmgPct', label:'Physical Damage %'},
      {word:'Precise',    key:'critChance', label:'Crit Chance %'},
      {word:'Flame',      key:'fireDmg',     label:'Fire Damage to Weapon Attacks'},
      {word:'Chilling',   key:'coldDmg',     label:'Cold Damage to Weapon Attacks'},
      {word:'Lightning',  key:'lightningDmg',label:'Lightning Damage to Weapon Attacks'},
      {word:'Poisoning',  key:'poisonDmg',   label:'Poison Damage to Weapon Attacks'},
      {word:'Crushing',   key:'armorPenPct', label:'Armor Penetration %'},
      {word:'Concentrated',key:'aoeRadiusPct', label:'Area of Effect %'},
      {word:"Berserker's",key:'skillTree',   label:'Berserker Skills', skillTree:'berserker', tier3Only:true},
    ],
    suffixes: [
      {word:'Wrath',       key:'dmg',            label:'Physical Damage to Weapon Attacks'},
      {word:'the Elements',key:'elemDmgPct',     label:'Elemental Damage %'},
      {word:'Embers',      key:'fireDmgPct',     label:'Fire Damage %'},
      {word:'Frost',       key:'coldDmgPct',     label:'Cold Damage %'},
      {word:'Storms',      key:'lightningDmgPct',label:'Lightning Damage %'},
      {word:'Venom',       key:'poisonDmgPct',   label:'Poison Damage %'},
      {word:'Cunning',     key:'atkSpeedPct',     label:'Attack Speed %'},
      {word:'Vampire',     key:'lifeLeechPct',    label:'Life Leech %'},
      {word:'Bloodletting',key:'bleedChancePct',  label:'Bleed Chance %'},
      {word:'Luck',        key:'magicFindPct',    label:'Magic Find %'},
      {word:'Riches',      key:'goldFindPct',     label:'Gold Find %'},
      {word:'Destruction', key:'critChance',      label:'Crit Chance %'},
    ],
  },
  bow: {
    prefixes: [
      {word:'Honed',      key:'physDmgPct', label:'Physical Damage %'},
      {word:'Cunning',    key:'atkSpeedPct', label:'Attack Speed %'},
      {word:'Precise',    key:'critChance',  label:'Crit Chance %'},
      {word:'Flaming',    key:'fireDmg',     label:'Fire Damage to Weapon Attacks'},
      {word:'Chilling',   key:'coldDmg',     label:'Cold Damage to Weapon Attacks'},
      {word:'Lightning',  key:'lightningDmg',label:'Lightning Damage to Weapon Attacks'},
      {word:'Poisoning',  key:'poisonDmg',   label:'Poison Damage to Weapon Attacks'},
      {word:'Concentrated',key:'aoeRadiusPct', label:'Area of Effect %'},
      {word:'Masterful',  key:'skillTree',   label:'Marksman Skills', skillTree:'marksman', tier3Only:true},
    ],
    suffixes: [
      {word:'Wrath',       key:'dmg',            label:'Physical Damage to Weapon Attacks'},
      {word:'the Elements',key:'elemDmgPct',     label:'Elemental Damage %'},
      {word:'Embers',      key:'fireDmgPct',     label:'Fire Damage %'},
      {word:'Frost',       key:'coldDmgPct',     label:'Cold Damage %'},
      {word:'Storms',      key:'lightningDmgPct',label:'Lightning Damage %'},
      {word:'Venom',       key:'poisonDmgPct',   label:'Poison Damage %'},
      {word:'Cunning',     key:'atkSpeedPct',     label:'Attack Speed %'},
      {word:'Vampire',     key:'lifeLeechPct',    label:'Life Leech %'},
      {word:'Bloodletting',key:'bleedChancePct',  label:'Bleed Chance %'},
      {word:'Luck',        key:'magicFindPct',    label:'Magic Find %'},
      {word:'Riches',      key:'goldFindPct',     label:'Gold Find %'},
      {word:'Nature',      key:'skillTree',       label:'Hunter Skills', skillTree:'hunter', tier3Only:true},
    ],
  },
  shield: {
    prefixes: [
      {word:"Guardian's", key:'skillTree',   label:'Defender Skills', skillTree:'defender', tier3Only:true},
      {word:'Lucky',      key:'magicFindPct',label:'Magic Find %'},
      {word:'Rich',       key:'goldFindPct', label:'Gold Find %'},
      {word:'Studded',    key:'thornDamage', label:'Thorns'},
      {word:'Sturdy',     key:'dmgReductionPct', label:'Damage Reduction %'},
      {word:'Grand',      key:'blockChancePct',  label:'Block Chance %'},
    ],
    suffixes: [
      {word:'Warding',    key:'defensePct',       label:'Defense %'},
      {word:'Dousing',    key:'fireResistPct',     label:'Fire Resist %'},
      {word:'Warmth',     key:'coldResistPct',     label:'Cold Resist %'},
      {word:'Grounding',  key:'lightningResistPct',label:'Lightning Resist %'},
      {word:'Antivenom',  key:'poisonResistPct',   label:'Poison Resist %'},
      {word:'The Templar',key:'skillTree',         label:'Templar Skills', skillTree:'templar', tier3Only:true},
    ],
  },
  gloves: {
    prefixes: [
      {word:'Precise',   key:'critChance',  label:'Crit Chance %'},
      {word:'Flaming',   key:'fireDmgPct',      label:'Fire Damage %'},
      {word:'Chilling',  key:'coldDmgPct',      label:'Cold Damage %'},
      {word:'Lightning', key:'lightningDmgPct', label:'Lightning Damage %'},
      {word:'Poisoning', key:'poisonDmgPct',    label:'Poison Damage %'},
      {word:'Honed',     key:'physDmgPct',      label:'Physical Damage %'},
      {word:'Cunning',   key:'atkSpeedPct',  label:'Attack Speed %'},
    ],
    suffixes: [
      {word:'Warding',   key:'defensePct',       label:'Defense %'},
      {word:'Dousing',   key:'fireResistPct',     label:'Fire Resist %'},
      {word:'Warmth',    key:'coldResistPct',     label:'Cold Resist %'},
      {word:'Grounding', key:'lightningResistPct',label:'Lightning Resist %'},
      {word:'Antivenom', key:'poisonResistPct',   label:'Poison Resist %'},
      {word:'Vitality',  key:'hp',                label:'Health'},
    ],
  },
  // Helm's pool is also reused verbatim for chest Armor -- see the
  // EQUIP_AFFIXES.armor alias assigned right after this object. The user's
  // spec only spelled out a Helm list (no separate chest-Armor list); since
  // Helm and Armor already share one material/tier system end-to-end
  // (ARMOR_TIER_NAME, INNATE_STAT-by-material, canEquipArmorMaterial) it's
  // the natural judgment call to give them the same affix pool too, rather
  // than leaving chest Armor on the old flat pool or inventing a new list
  // the spec never asked for.
  helm: {
    prefixes: [
      {word:'Lucky',     key:'magicFindPct',  label:'Magic Find %'},
      {word:'Rich',      key:'goldFindPct',   label:'Gold Find %'},
      {word:'Studded',   key:'thornDamage',   label:'Thorns'},
      {word:'Vital',     key:'hp',            label:'Health'},
      {word:'Commanding',key:'followerDmgPct',label:'Minion Damage %'},
      {word:'Holy',      key:'lifeRegenPct',  label:'Life Regen %'},
    ],
    suffixes: [
      {word:'Warding',   key:'defensePct',       label:'Defense %'},
      {word:'Agility',   key:'dexterity',         label:'Dexterity', gate:'rangerArmor'},
      {word:'Dousing',   key:'fireResistPct',      label:'Fire Resist %'},
      {word:'Warmth',    key:'coldResistPct',      label:'Cold Resist %'},
      {word:'Grounding', key:'lightningResistPct', label:'Lightning Resist %'},
      {word:'Antivenom', key:'poisonResistPct',    label:'Poison Resist %'},
    ],
  },
  boots: {
    prefixes: [
      {word:'Quick',     key:'moveSpeedPct',  label:'Move Speed %'},
      {word:'Lucky',     key:'magicFindPct',  label:'Magic Find %'},
      {word:'Rich',      key:'goldFindPct',   label:'Gold Find %'},
      {word:'Studded',   key:'thornDamage',   label:'Thorns'},
      {word:'Vital',     key:'hp',            label:'Health'},
      {word:'Holy',      key:'lifeRegenPct',  label:'Life Regen %'},
      {word:'Slippery',  key:'slowImmune',    label:'Cannot Be Slowed'},
    ],
    suffixes: [
      {word:'Warding',   key:'defensePct',       label:'Defense %'},
      {word:'Agility',   key:'dexterity',         label:'Dexterity', gate:'rangerArmor'},
      {word:'Dousing',   key:'fireResistPct',      label:'Fire Resist %'},
      {word:'Warmth',    key:'coldResistPct',      label:'Cold Resist %'},
      {word:'Grounding', key:'lightningResistPct', label:'Lightning Resist %'},
      {word:'Antivenom', key:'poisonResistPct',    label:'Poison Resist %'},
      {word:'Melting',   key:'freezeImmune',       label:'Cannot Be Frozen'},
    ],
  },
  belt: {
    prefixes: [
      {word:'Lucky',   key:'magicFindPct', label:'Magic Find %'},
      {word:'Rich',    key:'goldFindPct',  label:'Gold Find %'},
      {word:'Studded', key:'thornDamage',  label:'Thorns'},
      {word:'Vital',   key:'hp',           label:'Health'},
      {word:'Holy',    key:'lifeRegenPct', label:'Life Regen %'},
    ],
    suffixes: [
      {word:'Agility',   key:'dexterity',         label:'Dexterity', gate:'rangerArmor'},
      {word:'Dousing',   key:'fireResistPct',      label:'Fire Resist %'},
      {word:'Warmth',    key:'coldResistPct',      label:'Cold Resist %'},
      {word:'Grounding', key:'lightningResistPct', label:'Lightning Resist %'},
      {word:'Antivenom', key:'poisonResistPct',    label:'Poison Resist %'},
    ],
  },
  staff: {
    prefixes: [
      {word:'Powerful',    key:'elemDmgPct',        label:'Elemental Damage %'},
      {word:'Honed',       key:'physDmgPct',        label:'Physical Damage %'},
      {word:'Cunning',     key:'atkSpeedPct',        label:'Attack Speed %'},
      {word:'Attuned',     key:'globalCdrPct',       label:'Cooldown Reduction %'},
      {word:'Deadly',      key:'projectileSpeedPct', label:'Projectile Speed %'},
      {word:'Concentrated',key:'aoeRadiusPct',       label:'Area of Effect %'},
      {word:'Precise',     key:'critChance',         label:'Crit Chance %'},
      // Staves are UNCONDITIONALLY exempt from the tier3Only gate (see
      // affixEligibleForTier) -- tier3Only is deliberately left unset on
      // every staff skill-affix below rather than set-but-irrelevant, so
      // it's visually obvious at a glance that none of them are gated.
      {word:"Elementalist's", key:'skillTree', label:'Elementalist Skills', skillTree:'elementalist'},
    ],
    suffixes: [
      {word:'Fire',      key:'fireDmgPct',      label:'Fire Damage %'},
      {word:'Ice',       key:'coldDmgPct',      label:'Cold Damage %'},
      {word:'Lightning', key:'lightningDmgPct', label:'Lightning Damage %'},
      {word:'Poison',    key:'poisonDmgPct',    label:'Poison Damage %'},
      {word:'The Dead',  key:'skillTree',    label:'Necromancer Skills', skillTree:'necromancer'},
      {word:'The Sky',   key:'skillTree',    label:'Djinn Skills',       skillTree:'djinn'},
    ],
  },
  // Ring's pool is also reused verbatim for Amulet -- see the
  // EQUIP_AFFIXES.amulet alias below. The spec explicitly covers "Rings
  // and Amulets" together as one combined list.
  ring: {
    prefixes: [
      {word:'Precise',      key:'critChance',  label:'Crit Chance %'},
      {word:'Flaming',      key:'fireDmgPct',      label:'Fire Damage %'},
      {word:'Chilling',     key:'coldDmgPct',      label:'Cold Damage %'},
      {word:'Lightning',    key:'lightningDmgPct', label:'Lightning Damage %'},
      {word:'Poisoning',    key:'poisonDmgPct',    label:'Poison Damage %'},
      {word:'Honed',        key:'physDmgPct',      label:'Physical Damage %'},
      {word:'Prismatic',    key:'elemDmgPct',      label:'Elemental Damage %'},
      {word:'Masterful',    key:'allSkills',   label:'All Skills',        allSkills:true, tier3Only:true},
      {word:'Dying',        key:'skillTree',    label:'Necromancer Skills',skillTree:'necromancer', tier3Only:true},
      {word:"Conduit's",    key:'skillTree',    label:'Djinn Skills',      skillTree:'djinn', tier3Only:true},
      {word:"Elementalist's",key:'skillTree',   label:'Elementalist Skills',skillTree:'elementalist', tier3Only:true},
      {word:"Mystic's",     key:'skillGroup',   label:'Mystic Skills',     skillGroup:SKILL_TREE_CLASS_GROUP_KEY_MYSTIC, tier3Only:true},
      {word:"Guardian's",   key:'skillTree',    label:'Defender Skills',   skillTree:'defender', tier3Only:true},
      {word:"Berserker's",  key:'skillTree',    label:'Berserker Skills',  skillTree:'berserker', tier3Only:true},
      {word:"Warrior's",    key:'skillGroup',   label:'Warrior Skills',    skillGroup:SKILL_TREE_CLASS_GROUP_KEY_WARRIOR, tier3Only:true},
      {word:"Survivalist's",key:'skillTree',    label:'Survivalist Skills',skillTree:'survivalist', tier3Only:true},
      {word:'Marksman',     key:'skillTree',    label:'Marksman Skills',   skillTree:'marksman', tier3Only:true},
      {word:"Hunter's",     key:'skillTree',    label:'Hunter Skills',     skillTree:'hunter', tier3Only:true},
      {word:"Ranger's",     key:'skillGroup',   label:'Ranger Skills',     skillGroup:SKILL_TREE_CLASS_GROUP_KEY_RANGER, tier3Only:true},
    ],
    suffixes: [
      {word:'Lucky',       key:'magicFindPct',    label:'Magic Find %'},
      {word:'Rich',        key:'goldFindPct',     label:'Gold Find %'},
      {word:'Studded',     key:'thornDamage',     label:'Thorns'},
      {word:'Vitality',    key:'hp',               label:'Health'},
      {word:'Regeneration',key:'lifeRegenPct',    label:'Life Regen %'},
      {word:'Dousing',     key:'fireResistPct',     label:'Fire Resist %'},
      {word:'Warmth',      key:'coldResistPct',     label:'Cold Resist %'},
      {word:'Grounding',   key:'lightningResistPct',label:'Lightning Resist %'},
      {word:'Antivenom',   key:'poisonResistPct',   label:'Poison Resist %'},
      {word:'Elemental Attunement', key:'allResistPct', label:'All Resistances %'},
    ],
  },
};
// v440 new gear mods
{ const CD={word:'Ruin',key:'critDmgPct',label:'Crit Damage %'}, SD={word:'Lingering',key:'statusDurPct',label:'Ailment Duration %'},
        VE={word:'Slaying',key:'dmgVsElitePct',label:'Damage vs Elites %',minIlvl:50}, LK={word:'Bloodthirst',key:'lifeOnKill',label:'Life on Kill'},
        MK={word:'Siphoning',key:'manaOnKill',label:'Mana on Kill'}, PS={word:'Alchemy',key:'potionStrengthPct',label:'Potion Strength %'};
  const P=o=>Object.assign({},o);
  ['weapon1h','weapon2h','bow','staff'].forEach(c=>{ const q=EQUIP_AFFIXES[c]; q.suffixes.push(P(CD), P(SD), P(LK)); q.prefixes.push(P(VE)); });
  EQUIP_AFFIXES.staff.suffixes.push(P(MK));
  ['ring','gloves'].forEach(c=>{ EQUIP_AFFIXES[c].suffixes.push(P(LK)); EQUIP_AFFIXES[c].prefixes.push(P(VE)); });
  EQUIP_AFFIXES.ring.suffixes.push(P(SD), P(PS));
  EQUIP_AFFIXES.belt.suffixes.push(P(PS));
  // v489: Skill Duration % -- ailments, ground effects, buffs, summons and decoys all last longer
  const DU={word:'Persistence',key:'skillDurPct',label:'Skill Duration %'};
  ['weapon1h','weapon2h','bow','staff','ring','helm'].forEach(c=>EQUIP_AFFIXES[c].suffixes.push(P(DU)));
  // v492: +Light Radius (Diablo 2 style): a bigger circle of light around you, on helms, rings and amulets
  const LR={word:'Lantern',key:'lightRadiusPct',label:'Light Radius %'};
  ['helm','ring'].forEach(c=>EQUIP_AFFIXES[c].suffixes.push(P(LR)));
}
EQUIP_AFFIXES.amulet = EQUIP_AFFIXES.ring;
EQUIP_AFFIXES.armor = EQUIP_AFFIXES.helm;
// Tags every entry in every category's prefixes/suffixes arrays with
// slot:'prefix'|'suffix' in place, so generateItem/itemDisplayName can tell
// which naming slot a chosen affix came from without threading that
// information through separately. Run once, immediately.
(function tagAffixSlots(){
  const seen = new Set();
  Object.keys(EQUIP_AFFIXES).forEach(cat=>{
    const pool = EQUIP_AFFIXES[cat];
    if(seen.has(pool)) return; // helm/armor and ring/amulet alias the SAME array objects -- tag once
    seen.add(pool);
    pool.prefixes.forEach(a=>{ a.slot='prefix'; });
    pool.suffixes.forEach(a=>{ a.slot='suffix'; });
  });
})();
// Bug fix (post-v97): a small number of affix pool entries are BINARY
// yes/no effects -- you either have the immunity or you don't -- rather
// than a scalable numeric bonus. Melting (boots suffix, freezeImmune) and
// Slippery (boots prefix, slowImmune) are the only two of these in the
// pool right now. Before this fix they were still routed through
// rollAffixModifierValue like every ordinary numeric stat (only the
// skillTree/skillGroup/allSkills "+X skills" affixes were special-cased to
// a flat, non-numeric value -- see rollExtraAffixes below), so they rolled
// a real number (e.g. 11, 34...) that then got prepended to the tooltip
// as "+11 Cannot Be Frozen" -- a value that means nothing for a flag that
// is simply on or off. BOOLEAN_AFFIX_KEYS + isBooleanAffixKey() let both
// the roll (rollExtraAffixes) and every tooltip/display site
// (affixTooltipLine) treat these the same way skill-bonus affixes already
// are: no numeric roll, no "+N" prefix, just the flat label text.
const BOOLEAN_AFFIX_KEYS = new Set(['freezeImmune','slowImmune']);
function isBooleanAffixKey(key){ return BOOLEAN_AFFIX_KEYS.has(key); }
// Shared formatter for one affix's tooltip/detail-popup line -- used by
// every place an item's stat list is rendered (paperdoll slot titles, bag/
// stash/vendor grid cell titles, the item-detail popup). Numeric affixes
// still show "+<value> <label>" exactly as before; boolean affixes (see
// isBooleanAffixKey above) show just the label, with no rolled number.
function pipsText(mt){ if(!mt) return ''; let t=''; for(let i=1;i<=5;i++) t += i<=mt ? '\u25CF' : '\u25CB'; return t; }
function affixText(a){
  if(a.key==='wpnDmg') return a.min+'\u2013'+a.max+' Damage';
  if(isBooleanAffixKey(a.key)) return a.label;
  if(a.doubledFrom!=null){
    const o = fmtNum(a.doubledFrom), v2 = fmtNum(a.value);
    if(a.key==='spellPower') return '+'+o+' to '+a.label+' (+'+v2+')';
    if(/%/.test(a.label)) return '+'+o+'% '+a.label.replace(/\s*%\s*/g,' ').trim()+' (+'+v2+'%)';
    return '+'+o+' '+a.label+' (+'+v2+')';
  }
  const v = fmtNum(a.value);
  if(a.key==='spellPower') return '+'+v+' to '+a.label;
  if(/%/.test(a.label)) return '+'+v+'% '+a.label.replace(/\s*%\s*/g,' ').trim();
  return '+'+v+' '+a.label;
}
function affixTooltipLine(a){
  return affixText(a)+(a.mt ? ' '+pipsText(a.mt) : '');
}
const AFFIX_GROUP_OF = (()=>{
  const m = {};
  ['wpnDmg','physDmgPct','elemDmgPct','fireDmgPct','coldDmgPct','lightningDmgPct','poisonDmgPct','dmg','dmgPct','fireDmg','coldDmg','lightningDmg','poisonDmg','critChance','crit','atkSpeedPct','armorPenPct','lifeLeechPct','bleedChancePct','aoeRadiusPct','projectileSpeedPct','followerDmgPct','thornDamage','critDmgPct','statusDurPct','dmgVsElitePct','lifeOnKill','manaOnKill'].forEach(k=>m[k]='offense');
  ['armor','defenceFlat','defensePct','hp','lifeRegenPct','fireResistPct','coldResistPct','lightningResistPct','poisonResistPct','allResistPct','blockChancePct','dmgReductionPct','dexterity'].forEach(k=>m[k]='defense');
  ['magicFindPct','goldFindPct','potionStrengthPct','skillDurPct','lightRadiusPct','moveSpeedPct','globalCdrPct','slowImmune','freezeImmune','speed','mp'].forEach(k=>m[k]='utility');
  return m;
})();
const AFFIX_GROUP_COLOR = {skills:'#d9b8ff', offense:'#f2b48c', defense:'#9cc4ff', utility:'#9ee6b0'};
const AFFIX_GROUP_ORDER = ['skills','offense','defense','utility'];
function affixGroup(a){
  if(a.skillTree||a.skillGroup||a.allSkills||a.key==='spellPower') return 'skills';
  return AFFIX_GROUP_OF[a.key] || 'utility';
}
function itemBaseAffix(item){
  const af = item.affixes||[];
  const b = af.find(a=>a.base);
  if(b) return b;
  const first = af[0];
  if(first && ((first.key==='dmg' && (item.slotType==='weapon1h'||item.slotType==='weapon2h'||item.slotType==='bow')) || (first.key==='armor' && (item.slotType==='shield'||item.slotType==='helm'||item.slotType==='armor'||item.slotType==='gloves'||item.slotType==='boots')))) return first;
  return null;
}
function itemSubtitle(item){
  return RARITY[item.rarity].name+' \u00B7 '+itemBaseName(item)+(item.ilvl ? ' \u00B7 Item Level '+item.ilvl : '');
}
function deltaHtml(nv, ov){
  if(typeof nv!=='number' || typeof ov!=='number') return '';
  const d = Math.round((nv-ov)*100)/100;
  if(d===0) return '<span class="icEq">=</span>';
  return d>0 ? '<span class="icUp">\u25B2 '+fmtNum(d)+'</span>' : '<span class="icDown">\u25BC '+fmtNum(-d)+'</span>';
}
// Which equipped item an inventory/vendor item would replace (null if none / same item)
function compareTargetFor(item, p){
  if(!item || !p || !p.equipment || item.slotType==='questitem' || item.slotType==='potion') return null;
  const eq = p.equipment; let t = null;
  if(item.slotType==='ring') t = eq.ring1 || eq.ring2;
  else if(item.slotType==='weapon1h' || item.slotType==='weapon2h' || item.slotType==='bow' || item.slotType==='staff') t = eq.mainhand;
  else if(item.slotType==='shield') t = eq.offhand;
  else t = eq[item.slotType];
  return (t && t!==item) ? t : null;
}
// The readable item card: subtitle, requirements, big base stat with a divider under it, grouped mods with quality pips.
// `other` (optional) is the item to diff against: shared stats get a green up / red down delta.
function itemCardHtml(item, other){
  migrateItemAffixes(item); if(other) migrateItemAffixes(other);
  if(item.slotType==='questitem' || item.slotType==='potion'){
    const isRune = item.questId && Object.keys(RUNE_IDS).some(r=>RUNE_IDS[r].indexOf(item.questId)>=0);
    return '<div>'+(item.questDesc||'')+'</div>' + (isRune ? '<div style="margin-top:8px;color:#d0586e"><b>Bearer\u2019s Curse</b><br>\u221215% to all resistances while you carry this runestone.</div>' : '');
  }
  let h = '<div class="icSub" style="color:'+item.color+'">'+itemSubtitle(item)+'</div>';
  const rc = itemClassRestriction(item);
  if(rc) h += '<div class="icReq" style="color:#e8a24a">('+rc+' Only)</div>';
  if(item.levelReq && item.levelReq>1 && !item.unidentified) h += '<div class="icReq" style="color:#e8c44a">Requires Lv.'+item.levelReq+'</div>';
  if(item.forgeDoubled) h += '<div class="icReq" style="color:#7fe07f">(doubled)</div>';
  if(item.crimson) h += '<div class="icReq" style="color:#d4344f">Obsidian-forged &middot; crimson</div>';
  if(item.unidentified) return h+'<div style="color:#b8a878;">Unidentified &mdash; its modifiers are revealed when you buy it.</div>';
  let base = itemBaseAffix(item), oBase = other ? itemBaseAffix(other) : null;
  if(!base && (item.slotType==='belt'||item.slotType==='ring'||item.slotType==='amulet')){ base = item.affixes.find(a=>a.implicit) || null; oBase = (other && base) ? other.affixes.find(a=>a.implicit && a.key===base.key) || null : null; }
  const rest = item.affixes.filter(a=>a!==base);
  const imps = rest.filter(a=>a.implicit), mods = rest.filter(a=>!a.implicit);
  const oMap = {}; if(other) for(const a of other.affixes) oMap[affixUniqueKey(a)] = a;
  if(base){
    h += '<div class="icBase"><span class="icBaseVal">'+(base.key==='wpnDmg' ? base.min+'\u2013'+base.max : fmtNum(base.value)+(/%/.test(base.label)?'%':''))+'</span><span class="icBaseLbl">'+base.label.replace(/\s*%\s*/g,' ').trim()+'</span>'+(oBase && oBase.key===base.key ? deltaHtml(base.value, oBase.value) : '')+'</div>';
  }
  for(const a of imps){
    const o = oMap[affixUniqueKey(a)];
    h += '<div class="icImp">'+affixText(a)+(o && !isBooleanAffixKey(a.key) ? deltaHtml(a.value, o.value) : '')+'</div>';
  }
  if(base || imps.length) h += '<div class="icDiv"></div>';
  const groups = {skills:[], offense:[], defense:[], utility:[]};
  for(const a of mods) groups[affixGroup(a)].push(a);
  for(const g of AFFIX_GROUP_ORDER){
    for(const a of groups[g]){
      const o = oMap[affixUniqueKey(a)];
      h += '<div class="icMod" style="color:'+AFFIX_GROUP_COLOR[g]+'"><span>'+affixText(a)+(o && !isBooleanAffixKey(a.key) ? deltaHtml(a.value, o.value) : '')+'</span><span class="icPips">'+pipsText(a.mt)+'</span></div>';
    }
  }
  if(!mods.length && !base && !imps.length) h += '<div style="color:#8d8672">No modifiers</div>';
  return h;
}
// Full eligibility check for one candidate affix on a specific item: the
// existing v82 tier3Only/staff gate (affixEligibleForTier), PLUS the new
// v83 'rangerArmor' gate (Agility/+Dodge% -- see the EQUIP_AFFIXES doc
// comment above for the judgment call on which slots that gate applies to).
function affixEligibleForItem(affix, itemTier, category, material){
  if(!affixEligibleForTier(affix, itemTier, category)) return false;
  if(affix.gate==='rangerArmor' && material==='plate') return false;
  return true;
}
// Builds an item's display name from its base type name + the FIRST rolled
// prefix and FIRST rolled suffix among its actual affixes (an item can have
// more total modifiers than that -- e.g. a Tier 3 rare with 6 -- but only
// ever shows 1 of each in its name, per spec). Final template, reconciling
// the two worked examples in the spec ("Flaming Magic Sword of Wrath" and
// "Precise Rare Ring of Elemental Attunement"):
//     [Prefix] [Rarity] [BaseName] of [Suffix]
// -- this covers BOTH examples exactly: the sword example's "Magic" IS the
// rarity word (RARITY.magic.name), not a separate tier insert, so a plain
// "[Rarity] [BaseName]" core (already what v82's naming did) with a
// prefix/suffix wrapped around it satisfies both at once; no separate
// tier-name token is ever inserted. Fallbacks when only one side rolled:
// prefix-only -> "[Prefix] [Rarity] [BaseName]"; suffix-only (unchanged
// from v82's existing behavior) -> "[Rarity] [BaseName] of [Suffix]";
// neither -> plain "[Rarity] [BaseName]" (this is also exactly what a
// Common item, which never rolls an extra affix beyond its innate stat,
// always looks like).
// (v345) D2/PoE style: Common = base name; Magic = "Prefix Base of Suffix"; Rare = generated name (base shown on the card).
function itemDisplayName(rarityName, baseName, prefixWord, suffixWord, category){
  if(rarityName==='Rare') return makeRareName(category);
  if(rarityName==='Common') return baseName;
  let n = prefixWord ? (prefixWord+' '+baseName) : baseName;
  if(suffixWord) n += ' of '+suffixWord;
  return n;
}

const BASE_MAXHP = 100, BASE_MAXMP = 40, BASE_SPEED = 170;
const AOE_GCD = 3; // (v122) Nova, Fire Bomb and Hurricane share this cooldown
const MAX_RESIST_PCT = 75;
const HP_PER_LEVEL = 10, WARRIOR_HP_PER_LEVEL = 11, MP_PER_LEVEL = 4;

