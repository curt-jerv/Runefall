// ---------- Town & Blacksmith ----------
// (v250) Sell value scales gently with item level, rarity and mod tiers, with a modest hard ceiling per rarity.
const SELL_BASE = {common:6, magic:16, rare:44}, SELL_CAP = {common:45, magic:130, rare:380};
function basePriceFor(item){   // (v250) the vendors' buy prices are still built on this
  const r = item.rarity||'common', il = item.ilvl || ({1:10,2:38,3:60}[item.tier||1]||10);
  let v = (SELL_BASE[r]||6) * (1 + il*0.06);
  for(const a of (item.affixes||[])) if(!a.implicit && typeof a.value==='number') v += 2.5*(a.mt||1);
  return Math.max(1, Math.min(SELL_CAP[r]||45, Math.round(v)));
}
// v489: selling pays more -- rares and jewelry especially, and the gap grows with item level
const SELL2_BASE = {common:6, magic:18, rare:62}, SELL2_CAP = {common:80, magic:300, rare:1400};
function priceFor(item){
  const r = item.rarity||'common', il = item.ilvl || ({1:10,2:38,3:60}[item.tier||1]||10);
  let v = (SELL2_BASE[r]||6) * (1 + il*0.09);
  for(const a of (item.affixes||[])) if(!a.implicit && typeof a.value==='number') v += 3.5*(a.mt||1);
  if(item.slotType==='ring' || item.slotType==='amulet') v *= 1.5;
  return Math.max(1, Math.min(SELL2_CAP[r]||80, Math.round(v)));
}
function buyPriceFor(item){ return item.fixedPrice || Math.round(basePriceFor(item)*2.5); }
// (v120) The Blacksmith now sells ONLY Warrior gear: plate armor plus swords,
// greatswords and shields. Stock is keyed off the player's level like the other vendors.
const SMITH_ARMOR_CATEGORIES = ['helm','armor','gloves','boots'];
const SMITH_WEAPON_CATEGORIES = ['weapon1h','weapon2h','shield'];
function rollVendorRarity(){
  const r = Math.random();
  return r<0.55 ? 'common' : r<0.88 ? 'magic' : 'rare';
}
// (v155) gear vendors: L1-9 sell 1 magic, L10-29 sell 2 magic, L30-39 sell 3 magic + 1 rare, L40+ sell 3 magic + 2 rares; the rest is common.
function vendorRarityPlan(lvl, n){
  const magic = lvl>=30 ? 3 : lvl>=10 ? 2 : 1, rare = lvl>=40 ? 2 : lvl>=30 ? 1 : 0;
  const plan = [];
  for(let i=0;i<rare;i++) plan.push('rare');
  for(let i=0;i<magic;i++) plan.push('magic');
  while(plan.length<n) plan.push('common');
  plan.length = n;
  return shuffle(plan);
}
function genShopStock(charLevel){
  const lvl = charLevel||1, stock = [], plan = vendorRarityPlan(lvl, 6);
  for(let i=0;i<6;i++){
    const rarity = plan[i];
    if(Math.random()<0.5){
      stock.push(generateItem(lvl, rarity, SMITH_WEAPON_CATEGORIES[Math.floor(Math.random()*SMITH_WEAPON_CATEGORIES.length)]));
    } else {
      stock.push(generateItem(lvl, rarity, SMITH_ARMOR_CATEGORIES[Math.floor(Math.random()*SMITH_ARMOR_CATEGORIES.length)], 'plate'));
    }
  }
  return stock;
}
// The Bard (in the Tavern) sells random cloth (robe) armor, like the blacksmith does for plate.
function genBardShopStock(charLevel){
  const stock = [], plan = vendorRarityPlan(charLevel||1, 5);
  for(let i=0;i<5;i++){
    stock.push(generateItem(charLevel||1, plan[i], SMITH_ARMOR_CATEGORIES[Math.floor(Math.random()*SMITH_ARMOR_CATEGORIES.length)], 'robe'));
  }
  return stock;
}
// The Gambler sells UNIDENTIFIED rare gear at 1000-2000g each; mods stay hidden until bought.
const GAMBLER_CATEGORIES = ['helm','armor','gloves','boots','belt','ring','amulet','weapon1h','weapon2h','shield','bow','staff'];
function genGamblerStock(charLevel){
  const stock = [];
  for(let i=0;i<6;i++){
    const cat = GAMBLER_CATEGORIES[Math.floor(Math.random()*GAMBLER_CATEGORIES.length)];
    const it = generateItem(charLevel||1, 'rare', cat);
    it.unidentified = true;
    it.fixedPrice = Math.round(rand(1000,2000)/10)*10;
    stock.push(it);
  }
  return stock;
}
// ---- Bartender potions/drinks (v120): 1000g each, limited stock, restocks every 3h (v182: all vendors) ----
const BAR_POTION_PRICE = 250;   // v464: health potions are always in stock (v490: mana potions removed)
const BAR_PRICE = 1000, BAR_RESTOCK_MS = 60*60*1000, BUFF_DURATION_S = 300;
const BEER_DMG_BONUS = 20, BEER_ARMOR_MULT = 0.6;
const COFFEE_ATKSPD_MULT = 0.8 /* attack cooldown x0.8 = +20% attack speed */, COFFEE_MOVE_MULT = 1.2, COFFEE_HP_MULT = 0.5;
const POTION_DEFS = {
  health: {name:'Health Potion', color:'#e2384f', desc:'Single use. Instantly restores your health to full.'},
  beer:   {name:'Beer', color:'#e8a83a', desc:'Single use. For 5 minutes: +20 damage, -40% armor.'},
  coffee: {name:'Coffee', color:'#a8794a', desc:'Single use. For 5 minutes: +20% attack speed, +20% movement speed, -50% total HP.'},
  purple: {name:"Witch's Purple Potion", color:'#a24bd8', desc:'Brewed by the Black Marsh witch from four monster parts. Drink to permanently gain +20% Fire, Cold, Lightning and Poison resistance.'},
};
// ---------- Monster parts (v215) ----------
const PART_TIER_PCT = [0,5,10,15], PART_TIER_PREFIX = ['','','Greater ','Perfect '];
const PART_DEFS = {
  demonheart:{name:'Demon Heart',  icon:'\u{1FAC0}', color:'#d23a4a', stat:'leech', label:'Life Leech',        from:'Hellhounds, demon lords and the Balrog (Shadow Keep and beyond)'},
  demoneye:  {name:'Demon Eye',    icon:'\u{1F441}', color:'#e8a03a', stat:'crit',  label:'Crit Chance',       from:'Imps, Cinderfiends and demon lords (Shadow Keep and beyond)'},
  demonhorn: {name:'Demon Horn',   icon:'\u{1F608}', color:'#b04a8a', stat:'hp',    label:'Max HP',            from:'Brimstone Brutes, demon lords and the Balrog (Shadow Keep and beyond)'},
  bearclaw:  {name:'Bear Claw',    icon:'\u{1F43B}', color:'#b08a5a', stat:'dmg',   label:'Damage',            from:'Bears'},
  wolfpelt:  {name:'Wolf Pelt',    icon:'\u{1F43A}', color:'#9aa4b4', stat:'def',   label:'Defense',           from:'Wolves and Wargs'},
  spiderleg: {name:'Spider Leg',   icon:'\u{1F577}', color:'#7a5aa8', stat:'speed', label:'Move Speed',        from:'Spiders'},
  boartusk:  {name:'Beast Horn',   /* v499: was Boar Tusk (rams drop it too) */ icon:'\u{1F402}', color:'#d8c8a0', stat:'pen',   label:'Armor Penetration', from:'Boars and Rams'},
  snakeskin: {name:'Snake Skin',   icon:'\u{1F40D}', color:'#6aa84a', stat:'eva',   label:'Evasion',           from:'Snakes'},
  alligatortooth:{name:'Alligator Tooth', icon:'\u{1F40A}', color:'#88b04a', stat:'bleed', label:'Bleed Damage', from:'Alligators'},
  raptorclaw:{name:'Redridge Raptor Claw', icon:'\u{1F996}', color:'#e0602a', stat:'mf', label:'Magic Find', from:'Redridge Raptors'},
  tortugashell:{name:'Tortuga Shell', icon:'\u{1F422}', color:'#5a9a6a', stat:'coldres', label:'Cold Resist', from:'Tortugas and Frozen Zombies'},
  harpytalon:{name:'Harpy Queen Talon', icon:'\u{1FAB6}', color:'#c8b8f0', stat:'bleedch', label:'Chance to Bleed', from:'The Brood Mother (Harpy\'s Nest) \u2014 10% drop', sig:true},
  stormclaw: {name:'Storm Claw', icon:'\u26A1', color:'#6ab8ff', stat:'atkspd', label:'Attack Speed', from:'The Storm Raptor (Redridge Canyon)'},
  lavacarapace:{name:'Lava Beetle Carapace', icon:'\u{1FAB2}', color:'#e8602a', stat:'fireres', label:'Fire Resist', from:'Lava Beetles and Magma Crawlers'},
  rottenflesh:{name:'Rotting Flesh', icon:'\u{1F9DF}', color:'#8aa86a', stat:'poisres', label:'Poison Resist', from:'Zombies, Giant Toads, Poison Walkers and Poison Plants'},
  trollhide: {name:'Troll Hide', icon:'\u{1FAA8}', color:'#8a8a6a', stat:'regen', label:'Life Regen', scale:0.1, from:'Cave Trolls, Mountain Trolls and Troll Elders'},
  goblinear: {name:'Goblin Ear', icon:'\u{1F442}', color:'#a8c84a', stat:'gold', label:'Gold Find', from:'Goblins'},
  firewing:  {name:'Bat Wing',   /* v490: was Ember Wing */ icon:'\u{1F987}', color:'#ff7a2a', stat:'aoe', label:'Area Size', from:'Fire Bats'},
  scalehide: {name:'Crawler Scale Hide', icon:'\u{1F98E}', color:'#5c9a3a', stat:'lightres', label:'Lightning Resist', from:'Canyon Crawlers'},
  harpyfeather:{name:'Avian Feather',   /* v490: was Harpy Feather */ icon:'\u{1FAB6}', color:'#d8c8ff', stat:'cdr', label:'Cooldown Reduction', from:'Harpies and Rocs'},
  buffalohide:{name:'Buffalo Hide', icon:'\u{1F9AC}', color:'#8a6a4a', stat:'block', label:'Block Chance', from:'Canyon Buffalo'},
  armordonplate:{name:'Armordon Plate', icon:'\u{1F6E1}', color:'#b08a5a', stat:'dmgred', label:'Damage Reduction', scale:0.6, from:'Armordons and Giants'},
  demonicstone:{name:'Demonic Stone', icon:'\u{1F52E}', color:'#d23a6a', stone:true, quest:true, mods:{leech:6,hp:8}, sp:'healhit', desc:'+6% Life Leech, +8% Max HP. 8% chance on hit to heal 4% of your max HP.'},
  predatorstone:{name:"Predator's Stone", icon:'\u{1F43E}', color:'#c8905a', stone:true, quest:true, mods:{dmg:10,pen:10}, sp:'bleedbonus', desc:'+10% Damage, +10% Armor Penetration. +25% damage to bleeding enemies.'},
  venomstone:{name:'Venomous Stone', icon:'\u2620', color:'#7ad84a', stone:true, quest:true, mods:{poisres:20,eva:8}, sp:'poisonhit', desc:'+20% Poison Resist, +8% Evasion. Your hits poison enemies.'},
  stormstone:{name:'Stormbringer', icon:'\u{1F329}', color:'#6ab8ff', stone:true, quest:true, mods:{atkspd:8,lightres:20}, sp:'chain', desc:'+8% Attack Speed, +20% Lightning Resist. 10% chance on hit to chain lightning to 3 nearby enemies.'},
  infernalstone:{name:'Infernal Heart', icon:'\u{1F525}', color:'#ff6a2a', stone:true, quest:true, mods:{fireres:25,hp:5}, sp:'burn', desc:'+25% Fire Resist, +5% Max HP. A burning aura scorches nearby enemies.'},
  gildedstone:{name:'Gilded Ear', icon:'\u{1FA99}', color:'#f0c040', stone:true, quest:true, mods:{gold:30,mf:20}, desc:'+30% Gold Find, +20% Magic Find.'},
  juggstone:{name:'Juggernaut Stone', icon:'\u{1FAA8}', color:'#a8a890', stone:true, quest:true, mods:{hp:10,regen:0.5,dmgred:5}, desc:'+10% Max HP, +0.5% Life Regen, +5% Damage Reduction.'},
  reptilestone:{name:'Reptile Stone', icon:'\u{1F98E}', color:'#6aa84a', stone:true, quest:true, mods:{bleed:25,coldres:15}, sp:'thorns', desc:'+25% Bleed Damage, +15% Cold Resist. Reflects damage back at enemies that hit you (Thorns).'},
  windstone:{name:'Wind Stone', icon:'\u{1F32A}', color:'#bfe8ff', stone:true, quest:true, mods:{speed:10,eva:5}, sp:'windroll', desc:'+10% Move Speed, +5% Evasion. Dodge-rolling grants +20% damage for 3 seconds.'},
  // v499: four modest everyday stones from early and mid-game parts (for levelling)
  veteranstone:{name:"Veteran's Stone", icon:'\u{1F396}', color:'#d8c870', stone:true, quest:true, mods:{dmg:6}, desc:'+6% Damage.'},
  wayfarerstone:{name:"Wayfarer's Stone", icon:'\u{1F45F}', color:'#8ac4d8', stone:true, quest:true, mods:{speed:6,eva:4}, desc:'+6% Move Speed, +4% Evasion.'},
  ironhidestone:{name:'Ironhide Stone', icon:'\u{1F9F1}', color:'#a08060', stone:true, quest:true, mods:{hp:8,def:8}, desc:'+8% Max HP, +8% Defense.'},
  scavengerstone:{name:"Scavenger's Stone", icon:'\u{1F9B4}', color:'#c8b890', stone:true, quest:true, mods:{lok:0.5,mok:0.5}, desc:'Each kill restores 0.5% of your max Life and 0.5% of your max Mana / Rage / Stamina.'},
  banditdirk:{name:"Bandit's Dirk", icon:'\u{1F5E1}', color:'#c8a070', stat:'critdmg', label:'Crit Damage', scale:2, from:'Bandits'},
  bonedust:{name:'Bone Dust', icon:'\u{1F9B4}', color:'#e8e0c8', stat:'mok', label:'of max Mana / Rage / Stamina on Kill', scale:0.2, from:'Skeletons'},
  cultcharm:{name:"Cultist's Charm", icon:'\u{1F4FF}', color:'#c04050', stat:'ailment', label:'Ailment Duration', scale:2, from:'Cultists and Shadow Cultists'},
  ectoplasm:{name:'Grave Ectoplasm', icon:'\u{1F9EA}', color:'#8ad8c0', stat:'lok', label:'of max Life on Kill', scale:0.1, from:'Wraiths, Wraithlings, Shadow Ghouls, the Risen Dead and Vampires'},
  highwardcrest:{name:'Highward Crest', icon:'\u{1F3F5}', color:'#e8c44a', stat:'elite', label:'Damage vs Elites', scale:0.6, from:'Highward knights'},
  dwarfrune:{name:'Dwarven Rune Shard', icon:'\u16B1', color:'#9fd0ff', stat:'allres', label:'All Resistances', scale:0.6, from:'Frosthold dwarves'},
  brimstoneash:{name:'Brimstone Ash', icon:'\u{1F311}', color:'#b0603a', stat:'thorns', label:'of enemy hit damage reflected (Thorns)', scale:2, from:'Pit demons (grunts, brutes, archers and their lords)'},
  rextooth:{name:"Crater King's Tooth", icon:'\u{1F9B7}', color:'#e8d8c0', stat:'physpct', label:'Physical Damage', from:'Rex, the Crater King \u2014 5% drop', sig:true, scale:2},
  flameclaw:{name:'Flame Raptor Claw', icon:'\u{1F525}', color:'#ff6a2a', stat:'firepct', label:'Fire Damage', from:'The Flame Raptor \u2014 15% drop', sig:true, scale:2},
  minotaurheart:{name:'Minotaur Heartstone', icon:'\u{1FAC0}', color:'#e0504a', stat:'hp', label:'Max HP', from:'The Minotaur (witch-cut)', quest:true},
  // ---- Signature parts (v383): the rare ingredients of the nine unique amber stones ----
  golemcore:{name:'Golem Core', icon:'⚙', color:'#9aa0a8', stat:'maxres', label:'Max Resistances', scale:0.2, from:'Golems and Constructs', sig:true},
  hellhoundfang:{name:'Hellhound Fang', icon:'\u{1F9B7}', color:'#ff5a3a', stat:'elempct', label:'Elemental Damage', from:'Hellhounds and Brimstone Brutes', sig:true, scale:1.5},
  knightsigil:{name:"Knight's Sigil", icon:'⚜', color:'#c8d0e8', stat:'minion', label:'Minion Damage', from:'Frosthold Templars and Skeleton Brutes', sig:true, scale:2},
  coilspring:{name:'Coil Spring', icon:'\u{1F300}', color:'#c8a050', stat:'proj', label:'Projectile Speed', from:'Coil Sentries and Cog Crawlers', sig:true, scale:2},
  vultureeye:{name:'Vulture Eye', icon:'\u{1F985}', color:'#d8b060', stat:'poisonpct', label:'Poison Damage', from:'Vultures and Skeleton/Bandit Archers', sig:true, scale:2},
  heartwood:{name:'Primal Heartwood', icon:'\u{1F333}', color:'#6a9a4a', stat:'potion', label:'Potion Strength', from:'Treants and Bears', sig:true, scale:3},
  tempestglass:{name:'Tempest Glass', icon:'⌛', color:'#7ad8ff', stat:'lightpct', label:'Lightning Damage', from:'Sand Snakes, Storm Snakes and Vultures', sig:true, scale:2},
  prismcinder:{name:'Prismatic Cinder', icon:'\u{1F48E}', color:'#ff8a4a', stat:'mana', label:'Max Mana / Rage / Stamina', from:'Magma Golems, Magma Crawlers and Cinderfiends', sig:true, scale:1},
  wraithessence:{name:'Wraith Essence', icon:'\u{1F47B}', color:'#a8a0e8', stat:'coldpct', label:'Cold Damage', from:'Wraiths, Shadow Ghouls and the Risen Dead', sig:true, scale:2},
  // ---- The nine unique stones (amber, permanent once socketed, forged only from Perfect parts) ----
  uqdefender:{name:'Undying Bastion', icon:'\u{1F6E1}', color:'#f2a31b', stone:true, unique:true, quest:true, mods:{hp:10,dmgred:5}, sp:'uq_defender', desc:'+10% Max HP, +5% Damage Reduction. Last Stand: once every 90s a killing blow instead leaves you at 40% life, invulnerable for 3 seconds.'},
  uqberserker:{name:'Heart of Wrath', icon:'\u{1FA78}', color:'#f2a31b', stone:true, unique:true, quest:true, mods:{dmg:30,leech:5}, sp:'uq_berserker', desc:'+30% Damage, +5% Life Leech. Fury Unbound: while below 40% life you deal +50% damage.'},
  uqtemplar:{name:'Seal of Knighthood', icon:'⚜', color:'#f2a31b', stone:true, unique:true, quest:true, mods:{hp:8,block:5}, sp:'uq_templar', desc:'+8% Max HP, +5% Block Chance. Knighthood: your Squires can wear a helm, armor, sword and shield. Manage them in the Knights tab of your inventory; every knight shares the same gear.'},
  uqsurvivalist:{name:'Snare of Echoes', icon:'\u{1FAA4}', color:'#f2a31b', stone:true, unique:true, quest:true, mods:{eva:8,cdr:8}, sp:'uq_survivalist', desc:'+8% Evasion, +8% Cooldown Reduction. Twin Snares: every trap you throw is echoed by a second trap of the same kind beside it.'},
  uqmarksman:{name:'Phantom Quiver', icon:'\u{1F3F9}', color:'#f2a31b', stone:true, unique:true, quest:true, mods:{crit:8,atkspd:6}, sp:'uq_marksman', desc:'+8% Crit Chance, +6% Attack Speed. Ghost Volley: every projectile you fire has a 50% chance to pierce through enemies.'},
  uqhunter:{name:'Totem of the Great Bear', icon:'\u{1F43B}', color:'#f2a31b', stone:true, unique:true, quest:true, mods:{hp:8,dmg:6}, sp:'uq_hunter', desc:'+8% Max HP, +6% Damage. Pack Alpha: summons 1 additional Bear companion (requires Summon Bear).'},
  uqdjinn:{name:'Eye of the Tempest', icon:'\u{1F300}', color:'#f2a31b', stone:true, unique:true, quest:true, mods:{lightpct:30,lightres:25}, sp:'uq_djinn', desc:'+30% Lightning Damage, +25% Lightning Resist. Stormcaller: Lightning Arc chains to 3 additional enemies.'},
  uqelementalist:{name:'Crystalline Prism', icon:'\u{1F52E}', color:'#f2a31b', stone:true, unique:true, quest:true, mods:{coldpct:30,coldres:15}, sp:'uq_elementalist', desc:'+30% Cold Damage, +15% Cold Resist. Turns Ice Bolt into Frozen Orb.'},
  uqcrater:{name:"Crown of the Crater King", icon:'\u{1F451}', color:'#f2a31b', stone:true, unique:true, quest:true, mods:{dmg:8,hp:6}, sp:'uq_crater', desc:'+8% Damage, +6% Max HP. Crater Stomp: every 8s your next attack stamps a T-Rex foot, crushing enemies in a wide circle for 150% weapon damage. Apex Hunger: each kill grants a stack (max 5, lasts 6s) of +4% attack speed and +3% damage.'},
  // v490: Pyre Heart -- Immolate also wreathes you in a Flame Vortex
  uqpyre:{name:'Pyre Heart', icon:'\u{1F525}', color:'#f2a31b', stone:true, unique:true, quest:true, mods:{firepct:30,fireres:15}, sp:'uq_pyre', desc:'+30% Fire Damage, +15% Fire Resist. Pyre Heart: while Immolate burns, a Flame Vortex swirls around you.'},
  uqnecromancer:{name:"Lich's Phylactery", icon:'\u{1F480}', color:'#f2a31b', stone:true, unique:true, quest:true, mods:{cdr:8,hp:6}, sp:'uq_necromancer', desc:'+8% Cooldown Reduction, +6% Max HP. Legion: Raise Dead raises 2 additional skeleton minions.'},
};
const PART_KEYS = Object.keys(PART_DEFS);
const PART_DEMON = ['demonheart','demoneye','demonhorn'];
// v464: one part per enemy family; demon parts only from the true demons of Shadow Keep and beyond
const PART_DROPS = {
  grunt:['brimstoneash'], brute:['brimstoneash'], archer:['brimstoneash'], boss:['brimstoneash'],
  hellhound:['demonheart'], imp:['demoneye'], cinderfiend:['demoneye'], brimstonebrute:['demonhorn'], demonboss:PART_DEMON, balrog:['demonheart','demonhorn'],
  bear:['bearclaw'], wolf:['wolfpelt'], warg:['wolfpelt'], spider:['spiderleg'], boar:['boartusk'], ram:['boartusk'],
  anaconda:['snakeskin'], poisonsnake:['snakeskin'], stormsnake:['snakeskin'], sandsnake:['snakeskin'],
  alligator:['alligatortooth'], raptor:['raptorclaw'], tortuga:['tortugashell'], frozenzombie:['tortugashell'],
  lavabeetle:['lavacarapace'], magmacrawler:['lavacarapace'], zombie:['rottenflesh'], poisonwalker:['rottenflesh'], poisonplant:['rottenflesh'], giantoad:['rottenflesh'],
  cavetroll:['trollhide'], mtroll:['trollhide'], trollelder:['trollhide'], goblin:['goblinear'], goblinarcher:['goblinear'],
  bandit:['banditdirk'], banditarcher:['banditdirk'], banditbrute:['banditdirk'],
  firebat:['firewing'], crawler:['scalehide'], harpy:['harpyfeather'], roc:['harpyfeather'], buffalo:['buffalohide'], armordon:['armordonplate'], giant:['armordonplate'],
  skeleton:['bonedust'], skeletonarcher:['bonedust'], skeletonbrute:['bonedust'], cultist:['cultcharm'], shadowcultist:['cultcharm'],
  wraith:['ectoplasm'], wraithling:['ectoplasm'], shadowghoul:['ectoplasm'], risendead:['ectoplasm'], vampire:['ectoplasm'],
  hwsentinel:['highwardcrest'], hwwarden:['highwardcrest'], hwvanguard:['highwardcrest'], hwmendicant:['highwardcrest'], hwbulwark:['highwardcrest'], hwduelist:['highwardcrest'],
  fhdwarf:['dwarfrune'], fhaxe:['dwarfrune'], fhbrute:['dwarfrune'], fhcleric:['dwarfrune'] };
// ---------- Cauldron recipes (v361): three parts in, one Stone out; order and tier do not matter ----------
const STONE_RECIPES = [
  {id:'demonic',   stone:'demonicstone',  parts:['demonheart','demoneye','demonhorn'],        hint:'Three gifts torn from the Pit\'s own spawn.'},
  {id:'predator',  stone:'predatorstone', parts:['bearclaw','wolfpelt','boartusk'],            hint:'The claw, the pelt and the horn of the hunt.'},
  {id:'venom',     stone:'venomstone',    parts:['snakeskin','spiderleg','rottenflesh'],       hint:'Slither, creep and rot.'},
  {id:'storm',     stone:'stormstone',    parts:['stormclaw','harpyfeather','spiderleg'],      hint:'Feather, fang and thunder on the wing.'},
  {id:'infernal',  stone:'infernalstone', parts:['lavacarapace','firewing','demonhorn'],       hint:'Shell and wing of the fire-things, bound by a damned horn.'},
  {id:'gilded',    stone:'gildedstone',   parts:['goblinear','goblinear','goblinear'],         hint:'Greed has many ears.'},
  {id:'jugg',      stone:'juggstone',     parts:['trollhide','buffalohide','armordonplate'],   hint:'Hide, hide and plate: whatever refuses to fall.'},
  {id:'reptile',   stone:'reptilestone',  parts:['alligatortooth','scalehide','tortugashell'], hint:'Tooth and scale of those who lurk.'},
  {id:'wind',      stone:'windstone',     parts:['harpyfeather','raptorclaw','wolfpelt'],      hint:'Swift on the wing, swift on the claw, swift on the paw.'},
  // v499: everyday recipes for the early and middle game (every ingredient drops before the Redridge zones)
  {id:'veteran',   stone:'veteranstone',   parts:['banditdirk','goblinear','bonedust'],  hint:'A bandit\'s blade, a goblin\'s trophy and the bones of the fallen: the spoils of every skirmish.'},
  {id:'wayfarer',  stone:'wayfarerstone',  parts:['wolfpelt','spiderleg','banditdirk'],  hint:'Light feet: a hound\'s pelt, a spider\'s leg and a thief\'s knife.'},
  {id:'ironhide',  stone:'ironhidestone',  parts:['bearclaw','trollhide','bonedust'],    hint:'The bear\'s claw, the troll\'s hide and the bone of what they killed: tougher than the road.'},
  {id:'scavenger', stone:'scavengerstone', parts:['rottenflesh','bonedust','goblinear'], hint:'Rot, bone and a goblin\'s greed: take what the dead leave behind.'},
  // v383: unique amber stones. Every part must be PERFECT (tier 3).
  {id:'uq_defender',    stone:'uqdefender',    perfect:true, parts:['golemcore','armordonplate','trollhide'],       hint:'Stone heart, iron plate and troll hide: the wall that will not fall.'},
  {id:'uq_berserker',   stone:'uqberserker',   perfect:true, parts:['hellhoundfang','demonheart','boartusk'],       hint:'The fang of a hellhound, a demon\'s heart and a horn that never tires of charging.'},
  {id:'uq_templar',     stone:'uqtemplar',     perfect:true, parts:['knightsigil','harpyfeather','wolfpelt'],       hint:'A knight\'s sigil, a feather of grace and the pelt of a loyal hound.'},
  {id:'uq_survivalist', stone:'uqsurvivalist', perfect:true, parts:['coilspring','spiderleg','snakeskin'],          hint:'A clockwork spring, a spider\'s cunning and a serpent\'s patience.'},
  {id:'uq_marksman',    stone:'uqmarksman',    perfect:true, parts:['vultureeye','demoneye','stormclaw'],           hint:'Eyes that never miss, and a claw that strikes like lightning.'},
  {id:'uq_hunter',      stone:'uqhunter',      perfect:true, parts:['heartwood','bearclaw','raptorclaw'],           hint:'The living heart of the forest, the great bear\'s claw and the raptor\'s hunger.'},
  {id:'uq_djinn',       stone:'uqdjinn',       perfect:true, parts:['tempestglass','stormclaw','scalehide'],        hint:'Glass from the heart of a storm, bound with thunder and scale.'},
  {id:'uq_elementalist',stone:'uqelementalist',perfect:true, parts:['prismcinder','lavacarapace','tortugashell'],   hint:'Fire and frost, held together by a prism of cinders.'},
  {id:'uq_crater',      stone:'uqcrater',      parts:['rextooth','flameclaw','harpytalon'],           hint:'The king\'s tooth, the fire-raptor\'s claw and the queen\'s talon: whatever hunts from above, below, and the flame between.'},
  {id:'uq_pyre',        stone:'uqpyre',        perfect:true, parts:['hellhoundfang','firewing','lavacarapace'],    hint:'The hound\'s burning fang, a bat\'s ember wing and a beetle\'s molten shell: a heart that feeds the pyre.'},   // v490
  {id:'uq_necromancer', stone:'uqnecromancer', perfect:true, parts:['wraithessence','rottenflesh','demoneye'],      hint:'The essence of the restless dead, rotted flesh and an eye that sees beyond the grave.'},
];
// v383: where the signature parts come from (rolled in addition to the normal part drop)
const SIG_DROPS = { fallengolem:['golemcore'], magmagolem:['golemcore','prismcinder'], dwconstruct:['golemcore'], gearguard:['golemcore'], colossus:['golemcore'],
  hellhound:['hellhoundfang'], brimstonebrute:['hellhoundfang'], fhtemplar:['knightsigil'], skeletonbrute:['knightsigil'],
  coilsentry:['coilspring'], cogcrawler:['coilspring'], vulture:['vultureeye','tempestglass'], skeletonarcher:['vultureeye'], banditarcher:['vultureeye'],
  treant:['heartwood'], bear:['heartwood'], sandsnake:['tempestglass'], stormsnake:['tempestglass'], magmacrawler:['prismcinder'], cinderfiend:['prismcinder'],
  wraith:['wraithessence'], wraithling:['wraithessence'], shadowghoul:['wraithessence'], risendead:['wraithessence'], shadowcultist:['wraithessence'] };
const SIG_CHANCE = {normal:0.06, magic:0.15, rare:0.35};
// ---- Knighthood (Seal of Knighthood): shared gear for every Squire ----
const KNIGHT_SLOTS = [['helm','Helm','helm'],['armor','Armor','armor'],['weapon','Sword','weapon1h'],['shield','Shield','shield']];
function knightEq(p){ if(!p.knightEquip) p.knightEquip = {helm:null,armor:null,weapon:null,shield:null}; return p.knightEquip; }
function knightGear(p){
  const out = {dmg:0,dmgPct:0,armor:0,hp:0,block:0,dr:0,any:false};
  if(!p || !p.knightEquip || !uq(p,'uq_templar')) return out;
  for(const sl of KNIGHT_SLOTS){
    const it = p.knightEquip[sl[0]]; if(!it) continue; out.any = true;
    migrateItemAffixes(it);
    for(const af of (it.affixes||[])){
      const v = +af.value||0;
      if(af.key==='wpnDmg') out.dmg += ((af.min||0)+(af.max||0))/2*0.3; else if(af.key==='dmg') out.dmg += v; else if(af.key==='dmgPct' || af.key==='physDmgPct') out.dmgPct += v;
      else if(af.key==='armor' || af.key==='defenceFlat') out.armor += v; else if(af.key==='hp') out.hp += v;
      else if(af.key==='blockChancePct') out.block += v; else if(af.key==='dmgReductionPct') out.dr += v;
    }
  }
  return out;
}
function knightGearDr(p){ const kg = knightGear(p); if(!kg.any) return 0; return Math.min(0.6, kg.armor/(kg.armor + 250 + 15*(p.level||1)) + kg.dr/100); }
function knightGearChanged(){
  const g = game, p = g.player; if(!g.followers) return;
  for(const f of g.followers){ if((f.kind||'knight')!=='knight') continue; const r = f.maxHp>0 ? f.hp/f.maxHp : 1; f.maxHp = followerMaxHp(p, f); f.hp = Math.max(1, f.maxHp*r); }
}
function uq(p, key){ return !!(p && p.partB && p.partB.sp && p.partB.sp[key]); }
const recipeKey = a=>a.slice().sort().join('+');
const RECIPE_BY_KEY = {}; for(const r of STONE_RECIPES) RECIPE_BY_KEY[recipeKey(r.parts)] = r;
const recipeOverlap = (keys, r)=>{ const pool = r.parts.slice(); let n = 0; for(const k of keys){ const i = pool.indexOf(k); if(i>=0){ pool.splice(i,1); n++; } } return n; };
const PART_CHANCE = {normal:0.10, magic:0.25, rare:0.50};
const PARTS_FULL_DEPTH = 21, PARTS_EARLY_MULT = 0.2;   // v490: zones before Lakeside Ruins (level < 21) drop parts at 1/5 the rate
const PART_SHOP_PRICE = 600, PART_SHOP_SLOTS = 3, PART_SELL_PRICE = [0,150,450,1350];
const partId = (k,t)=>k+'_'+t;
const partName = (k,t)=>PART_DEFS[k].quest ? PART_DEFS[k].name : PART_TIER_PREFIX[t]+PART_DEFS[k].name;
const PART_SHOP_KEYS = PART_KEYS.filter(k=>!PART_DEFS[k].quest && !PART_DEFS[k].sig);
const partVal = (k,t)=>Math.round(PART_TIER_PCT[t]*(PART_DEFS[k].scale||1)*10)/10;
const partDesc = (k,t)=>PART_DEFS[k].stone ? PART_DEFS[k].desc + (PART_DEFS[k].unique ? ' UNIQUE: needs character level 40 to socket and cannot be removed once socketed. Only 1 single unique stone can be equipped at a time.' : '') : '+'+partVal(k,t)+(PART_DEFS[k].flat ? ' ' : '% ')+PART_DEFS[k].label+(PART_DEFS[k].flat ? ' (grows with level)' : '');
function addPart(p,k,t,n){ if(!p.parts) p.parts = {}; const id = partId(k,t||1); p.parts[id] = (p.parts[id]||0)+(n||1); }
function takePart(p,k,t,n){ n = n||1; const id = partId(k,t); if(!p.parts || (p.parts[id]||0)<n) return false; p.parts[id]-=n; if(p.parts[id]<=0) delete p.parts[id]; return true; }
function partBonuses(p){
  const b = {leech:0,crit:0,hp:0,dmg:0,def:0,speed:0,pen:0,eva:0,bleed:0,bleedch:0,sp:{},atkspd:0,aoe:0,mf:0,dmgred:0,block:0,cdr:0,coldres:0,fireres:0,poisres:0,regen:0,gold:0,lightres:0,
    xp:0,critdmg:0,physpct:0,firepct:0,coldpct:0,lightpct:0,poisonpct:0,elempct:0,mok:0,lok:0,ailment:0,elite:0,allres:0,thorns:0,minion:0,proj:0,potion:0,maxres:0,mana:0};
  let uniqueUsed = false;   // v383: only ONE unique stone is active at a time
  const stoneSeen = {};   // v490: each stone type counts once across all worn gear
  for(const it of Object.values(p.equipment||{})){
    if(!it || !it.socketed) continue;
    for(const id of it.socketed){ if(!id) continue; const [k,t] = id.split('_'); const d = PART_DEFS[k]; if(!d) continue; if(d.stone){ if(stoneSeen[k]) continue; stoneSeen[k] = true; } if(d.unique){ if(uniqueUsed) continue; uniqueUsed = true; } if(d.stone){ for(const mk in d.mods) b[mk] = (b[mk]||0) + d.mods[mk]; if(d.sp) b.sp[d.sp] = true; } else b[d.stat] += partVal(k,+t)||0; }
  }
  return b;
}
function partBleedMult(){ const p = game.player; return 1 + (((p&&p.partB&&p.partB.bleed)||0)/100); }
let _partToastT = 0;
function showPartToast(text, color){ showMsg(text, 3.2, color || '#e8dcc4'); }   // v492: monster parts use the same top-centre line as item pick-ups (no box)
function partsMaybeDrop(g, en){
  const p = g.player;
  if(!p || !en) return;   // v490: parts drop from the very start (no witch needed)
  const rare = (g.depth||0) < PARTS_FULL_DEPTH ? PARTS_EARLY_MULT : 1;   // v490: very rare before Lakeside Ruins
  // v387: signature boss parts, repeatable at fixed chances (Rex 5%, Brood Mother 10%, Flame Raptor 15%)
  { const bp = en.trex ? ['rextooth',0.05] : en.harpyQueen ? ['harpytalon',0.10] : en.lr ? ['flameclaw',0.15] : en.stormRaptor ? ['stormclaw',0.5] : null;
    if(bp && Math.random() < bp[1]*rare){ addPart(p,bp[0],1); showPartToast('Harvested: '+PART_DEFS[bp[0]].name+'  ('+partDesc(bp[0],1)+')', PART_DEFS[bp[0]].color); } }
  const pool = PART_DROPS[en.type], sigPool = SIG_DROPS[en.type];
  if(!pool && !sigPool) return;
  const tierKey = (en.elite || en.isBoss || en.isLairBoss) ? 'rare' : en.magic ? 'magic' : 'normal';
  let k = null;
  if(pool && Math.random() < PART_CHANCE[tierKey]*rare) k = pool[Math.floor(Math.random()*pool.length)];
  else if(sigPool && Math.random() < SIG_CHANCE[tierKey]*rare) k = sigPool[Math.floor(Math.random()*sigPool.length)];
  if(!k) return;
  addPart(p,k,1);
  showPartToast('Harvested: '+PART_DEFS[k].name+'  ('+partDesc(k,1)+')', PART_DEFS[k].color);
  saveGame();
  if(document.getElementById('invOverlay').style.display==='flex') try{ renderInventory(); }catch(e){}
}
const BAR_STOCK_KINDS = ['health','health','beer','beer','coffee','coffee'];   // v490: no mana potions
function makePotionItem(kind){
  const d = POTION_DEFS[kind];
  return {id:'it'+Math.random().toString(36).slice(2,9), slotType:'potion', potionKind:kind, rarity:'magic', name:d.name,
    affixes:[], color:d.color, questDesc:d.desc+(kind==='health' ? ' Always in stock.' : ''), unsellable:true, fixedPrice:kind==='health' ? BAR_POTION_PRICE : BAR_PRICE};
}
function refreshBarStock(p){
  if(!Array.isArray(p.barStock) || !p.barRestockAt || Date.now() >= p.barRestockAt){
    p.barStock = BAR_STOCK_KINDS.slice();
    p.barRestockAt = Date.now() + BAR_RESTOCK_MS;
  }
  p.barStock = ['health'].concat((p.barStock||[]).filter(k=>k!=='health' && k!=='mana' && POTION_DEFS[k]));   // one bottomless entry; v490: mana potions are gone
  return p.barStock.map(makePotionItem);
}
function syncBarStock(){
  const p = game.player;
  p.barStock = game.town.stock.map(it=>it.potionKind);
  saveGame();
}
function usePotion(p, item){
  const kind = item.potionKind;
  const _hp0 = p.hp, _mp0 = p.mp; setTimeout(()=>{ try{ if(p.hp>_hp0 || p.mp>_mp0) sfxPlay('potion',1); }catch(e){} }, 0);
  if(kind==='health'){
    if(p.hp>=p.maxHp){ showMsg("I don't need this now", 1.3, '#ffd93a'); return false; }
    // v478: 10% at once, then 50% over 4s; Potion Strength gear makes both bigger. 10s between potions.
    const ps = 1 + (p.potionStrPct||0);
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp*POTION_INSTANT*ps);
    p.potHotT = POTION_HOT_DUR; p.potHotRate = POTION_HOT*ps/POTION_HOT_DUR;
    p.potionCd = POTION_CD;
    if(game && game.particles) game.particles.push({type:'ring', x:p.x, y:p.y, t:0.45, max:0.45, r:34, color:'#e05a5a'});
  } else if(kind==='beer'){
    try{ setTimeout(()=>sfxPlay('burp', 1), 700); }catch(e){}
    p.beerT = BUFF_DURATION_S*(1+(p.potionStrPct||0)); recalcStats(p); showMsg('Beer: +20 damage, -40% armor (5 min)', 2.0);
  } else if(kind==='purple'){
    if(p.purpleDrunk){ showMsg('You already feel the potion\'s protection', 1.6, '#ffd93a'); return false; }
    p.purpleDrunk = true; recalcStats(p); showMsg('+20% to all four resistances -- permanently!', 3.0, '#c98bff');
  } else if(kind==='coffee'){
    p.coffeeT = BUFF_DURATION_S*(1+(p.potionStrPct||0)); recalcStats(p); showMsg('Coffee: faster, but frail (5 min)', 2.0);
  }
  return true;
}
function tickBuffs(dt){
  const p = game.player;
  if(!p) return;
  tickResource(p, dt);
  tickPlayerStatuses(p, dt);
  if(p.uqCd>0) p.uqCd -= dt;
  if(p.tsLandT>0){ p.tsLandT -= dt; if(p.tsLandT<=0){ p.tsLandT = 0; try{ thunderstepCharge(game, p, p.x, p.y, p.tsLandRank||1); }catch(e){} } }
  if(p.potRegenT>0){ p.potRegenT -= dt; if(p.hp>0) p.hp = Math.min(p.maxHp, p.hp + p.maxHp*0.10*dt); }
  if(p.potionCd>0) p.potionCd -= dt;
  // v480 Blood Harvest: faded Rage flows back as regeneration over a few seconds
  if(p.bhPool>0){ const h = Math.min(p.bhPool, Math.max(p.bhPool*dt/3, p.maxHp*0.004*dt)); p.bhPool -= h; if(p.hp>0) p.hp = Math.min(p.maxHp, p.hp + h); if(p.hp>=p.maxHp) p.bhPool = 0; }
  // v480 Iron Skin: standing your ground hardens you -- +10% Defence for every second you stand still, up to +50% after 5s
  { const mv = (p._stx==null) ? 0 : Math.hypot(p.x-p._stx, p.y-p._sty); p._stx = p.x; p._sty = p.y;
    if(mv > 0.5 || p.dodging) p.stillT = 0; else p.stillT = Math.min(IRON_STILL_MAX, (p.stillT||0) + dt); }
  if(p._fullMsgT>0) p._fullMsgT -= dt;
  if(p.potHotT>0){ const st = Math.min(dt, p.potHotT); p.potHotT -= dt; if(p.hp>0) p.hp = Math.min(p.maxHp, p.hp + p.maxHp*(p.potHotRate||0)*st); }
  if(p.crStompCd>0) p.crStompCd -= dt;
  if(p.apexT>0){ p.apexT -= dt; if(p.apexT<=0){ p.apexT = 0; p.apexStacks = 0; } }
  if(p.apexStacks>0 && !uq(p,'uq_crater')){ p.apexStacks = 0; p.apexT = 0; }
  let changed = false, prevHp = p.hp;
  if(p.beerT>0){ p.beerT -= dt; if(p.beerT<=0){ p.beerT = 0; changed = true; showMsg('Beer wore off', 1.2); } }
  if(p.coffeeT>0){ p.coffeeT -= dt; if(p.coffeeT<=0){ p.coffeeT = 0; changed = true; showMsg('Coffee wore off', 1.2); } }
  if(changed){ recalcStats(p); p.hp = Math.min(prevHp, p.maxHp); }
  updateBuffBar(p);
}
let buffBarSig = '', buffTipKey = null;
document.getElementById('buffBar').addEventListener('click', (ev)=>{
  const ic = ev.target.closest && ev.target.closest('.buffIcon'); if(!ic) return;
  const tipEl = document.getElementById('buffTip'); if(!tipEl) return;
  if(buffTipKey===ic.dataset.k){ buffTipKey = null; tipEl.style.display = 'none'; return; }
  buffTipKey = ic.dataset.k; tipEl.style.display = 'block'; tipEl.textContent = ic.title || '';
  updateBuffBar(game.player);
});
function updateBuffBar(p){
  const el = document.getElementById('buffBar');
  if(!el) return;
  const items = [];
  if(p.beerT>0) items.push({k:'beer', icon:'\u{1F37A}', t:p.beerT, tip:'Beer: +20 damage, -40% armor'});
  if(p.coffeeT>0) items.push({k:'coffee', icon:'\u2615', t:p.coffeeT, tip:'Coffee: +20% attack speed, +20% move speed, -50% HP'});
  if(p.unbreakT>0) items.push({k:'unbreak', icon:'\u{1F6E1}\uFE0F', t:p.unbreakT, tip:'Unbreakable: '+Math.round(unbreakDr(p.unbreakRank||1)*100)+'% less damage taken'});
  if(p.rampageStacks>0) items.push({k:'rampage', icon:'\u{1F4A2}', t:p.rampageT, tip:'Rampage x'+p.rampageStacks+': +'+Math.round(rampageSpeed(p)*100)+'% attack speed'});
  if(p.bloodrageT>0) items.push({k:'bloodrage', icon:'\u{1FA78}', t:p.bloodrageT, tip:'Bloodrage: +'+Math.round((bloodrageMult(p)-1)*100)+'% damage'});
  if(p.bulwarkT>0) items.push({k:'bulwark', icon:'\u{1F6E1}\uFE0F', t:p.bulwarkT, tip:'Bulwark: +75% armor, -50% speed. Stored damage: '+Math.round(p.bulwarkStore||0)});
  if(p._inWar) items.push({k:'bnwar', icon:'\u2694\uFE0F', t:(game.banner&&game.banner.t)||0, tip:'Standard of War: more damage and crit for you and your followers'});
  if(p.inAegis) items.push({k:'bnaeg', icon:'\u{1F3F0}', t:(game.banner&&game.banner.t)||0, tip:'Standard of Aegis: less damage taken and life regeneration'});
  if(p.apexStacks>0) items.push({k:'apex', icon:'\u{1F9B4}', t:p.apexT, tip:'Apex Hunger x'+p.apexStacks+': +'+(p.apexStacks*4)+'% attack speed, +'+(p.apexStacks*3)+'% damage'});
  if(p.wellRestedT>0 && game && game.started && !game.over) items.push({k:'rested', icon:'\u{1F319}', t:p.wellRestedT, tip:'Well Rested: +5% Magic Find, +'+WELL_RESTED_REGEN+'% life regeneration per second'});   // v452: Well Rested lives in the buff row too
  if(ironStillMult(p)>1) items.push({k:'ironstill', icon:'\u{1F6E1}\uFE0F', label:'+'+Math.round((ironStillMult(p)-1)*100)+'%', t:0, tip:'Iron Skin: standing your ground, +'+Math.round((ironStillMult(p)-1)*100)+'% Defence (up to +50%)'});
  if(p.bhPool>1) items.push({k:'bharvest', icon:'\u{1FA78}', label:'regen', t:0, tip:'Blood Harvest: faded Rage returning as life'});
  if(p.assaultT>0) items.push({k:'assault', icon:'\u{1F525}', t:p.assaultT, tip:'Assault: bonus damage and life leech, but you take more damage as it ramps'});
  // v491: the beast lairs' zone hazards show in the buff row too
  { const g = game, st = g && g.tower && g.scene==='lighthouse' ? g.tower : null;
    if(st && st.subzone==='sunken') items.push({k:'zstatic', icon:'\u26A1', label:'\u00d7'+SUNKEN_STATIC_STACKS, t:0, tip:'Static \u00d7'+SUNKEN_STATIC_STACKS+': the depths crackle -- you take lightning damage over time (lightning resistance helps)'});
    if(st && st.subzone==='pool') items.push({k:'zpoison', icon:'\u2620\uFE0F', label:'', t:0, tip:'Toxic water: poison damage over time (poison resistance helps)'});
    if(st && st.deep && st.bossFloor) items.push({k:'zheat', icon:'\u{1F525}', label:'', t:0, tip:'Scorching heat: fire damage over time (fire resistance helps)'});
    if(g && g.scene==='icyzone' && g.iz && g.iz.cold) items.push({k:'zcold', icon:'\u2744\uFE0F', label:'', t:0, tip:'Bitter cold: you lose life over time'}); }
  const sig = items.map(i=>i.k).join(',');
  if(sig!==buffBarSig){
    buffBarSig = sig;
    el.innerHTML = items.map(i=>'<div class="buffIcon" data-k="'+i.k+'" title="'+i.tip+'"><span>'+i.icon+'</span><b></b></div>').join('');
  }
  const tipEl = document.getElementById('buffTip');
  if(tipEl && buffTipKey){
    const it = items.find(x=>x.k===buffTipKey);
    if(!it){ buffTipKey = null; tipEl.style.display = 'none'; }
    else if(it.label!=null) tipEl.textContent = it.tip;
    else { const sec = Math.ceil(it.t); tipEl.textContent = it.tip+' \u2014 '+Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')+' left'; }
  }
  for(const i of items){
    const b = el.querySelector('[data-k="'+i.k+'"] b');
    if(b){ const sec = Math.ceil(i.t); b.textContent = i.label!=null ? i.label : i.k==='rested' ? fmtRestTime(i.t) : Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0'); }
  }
}
// v86: item 5 of the UI/UX overhaul -- the Hunter's own vendor stock,
// Ranger-class equipment only. Unlike the Blacksmith's flat level-1
// genShopStock() above, this DOES key off the player's current character
// level (charLevel), passed in from makeTown() -- generateItem() already
// internally rolls each item's ilvl within [charLevel-5, charLevel+5] (see
// rollItemLevel()'s own doc comment), so simply passing the player's real
// current level through gives exactly the "+/-5 level window around the
// player's current level" the brief calls for, reusing the SAME
// rollItemLevel/itemTierForItemLevel/EQUIP_AFFIXES-driven system every
// other item in the game (drops, the Blacksmith's own stock) already goes
// through -- no separate generation path.
// Category selection: 'bow' (Ranger's weapon) plus every slot that ISN'T
// gated to a specific weapon-type-only class (helm/armor/gloves/boots,
// forced to 'robe' or 'leather' material per ARMOR_ACCESS_MATRIX.ranger --
// NEVER 'plate' -- so nothing Ranger-inappropriate rolls) and the
// material-agnostic accessory slots (belt/ring/amulet) any class can wear.
// weapon1h/weapon2h/shield/staff are deliberately excluded -- those are
// Warrior/Mystic gear, not Ranger's.
const HUNTER_ARMOR_CATEGORIES = ['helm','armor','gloves','boots'];
// (v120) The Hunter sells ONLY Ranger gear: bows and leather armor.
function genHunterShopStock(charLevel){
  const stock = [], plan = vendorRarityPlan(charLevel||1, 6);
  for(let i=0;i<6;i++){
    const rarity = plan[i];
    if(Math.random() < 0.4) stock.push(generateItem(charLevel, rarity, 'bow'));
    else stock.push(generateItem(charLevel, rarity, HUNTER_ARMOR_CATEGORIES[Math.floor(Math.random()*HUNTER_ARMOR_CATEGORIES.length)], 'leather'));
  }
  return stock;
}
// Town is laid out as one wide central road (running the full width, at
// ROAD_Y) with every building and NPC pushed out to the edges above/below
// it, rather than clustered in the middle of the square.
const TOWN_ROAD_Y = 450;
// Tavern (quest feature): the old decorative "upper house" building that
// used to stand at x:640,y:60 in decoBuildings (the only decoBuildings
// entry on the same north side of the road as the Blacksmith) is now a
// real, functional building -- moved in a bit to sit genuinely beside the
// Blacksmith's forge (which spans x:145-295,y:20-124), doubled in
// footprint (150x100 -> 300x200, with wallHeight/roofHeight scaled up to
// match), and given real collision (pushed into t.obstacles below) since
// decoBuildings never blocked movement. A barkeeper NPC stands just
// outside its door, and a "Tavern, Closed" sign hangs beside it until the
// barkeeper's quest (QUEST_LIGHT_THE_WAY) is completed -- see
// talkToBarkeeper/checkLightTheWayQuest and the tavern-interior zone
// (makeTavern/enterTavern) further down.
const TAVERN_X = 430, TAVERN_Y = 40, TAVERN_W = 300, TAVERN_H = 200;
const TAVERN_HZ = 80, TAVERN_ROOFH = 56;
function makeTown(charLevel){
  // Door sits at the building's bottom-center, matching drawBuildingIso's
  // own door-placement math (b.x+b.w*0.5, b.y+b.h) exactly.
  // Nudged 18px past the building's own bottom edge (not sitting exactly
  // ON it) -- standing right on the collision rect's boundary would get
  // the player immediately shoved back out by pushOutOfRect before the
  // door's own proximity check ever had a chance to fire.
  const tavernDoor = {x: TAVERN_X+TAVERN_W*0.5, y: TAVERN_Y+TAVERN_H+18, r:30};
  const t = {
    w:1800, h:1300,
    // The tavern building itself is the one Town obstacle that actually
    // blocks movement (see the collision comment above) -- every other
    // building/prop in Town (Blacksmith forge, decoBuildings, well, etc.)
    // has never had collision, so this is additive, not a behavior change
    // for anything else.
    obstacles:[{x:TAVERN_X, y:TAVERN_Y, w:TAVERN_W, h:TAVERN_H}],
    roadY:TOWN_ROAD_Y,
    blacksmith:{x:220, y:190, r:24},
    runeforge:{x:345, y:235, r:22},
    tavern:{x:TAVERN_X, y:TAVERN_Y, w:TAVERN_W, h:TAVERN_H, hz:TAVERN_HZ, roofH:TAVERN_ROOFH,
      wallTop:'#4c4f5e', wallRight:'#1a1c26', wallFront:'#2a2c38',
      roofRight:'#1c2233', roofFront:'#2a3350', door:true, window:true, style:'town', chimney:true, sign:'mug', shutter:'#2a1e16'},
    tavernDoor,
    // The barkeeper stands just outside the door, a few steps to the side.
    // Nudged far enough from the door (76px) that the two interact
    // prompts (nearBarkeeper vs. nearTavernDoor, each with a fairly
    // generous ~58-64px trigger radius) don't overlap right at the door
    // itself -- a player standing on the door should always get the
    // door's own prompt, not the Barkeeper's.
    barkeeper:{x: tavernDoor.x+70, y: tavernDoor.y+28, r:20},
    // The "Tavern, Closed"/"Tavern" sign, planted beside the door.
    tavernSign:{x: tavernDoor.x-52, y: tavernDoor.y-6},
    // the exit sits right at the map's edge (a gap in the perimeter fence)
    // rather than a standalone gate structure planted mid-square
    gate:{x:1792, y:TOWN_ROAD_Y, r:36},
    // the old man, standing near the middle of the square with a quest
    // marker over his head, and a stone well nearby. Nudged 40px left/
    // 10px up from the well (was x:660,y:470, crowding/overlapping it)
    // so the two landmarks read as visually distinct while he's still
    // right next to it.
    questGiver:{x:620, y:460, r:20},
    // a simple stone well beside the old man -- interacting with it opens
    // the character/paperdoll panel (a "check yourself out" flavor beat)
    well:{x:726, y:486, r:22},
    // a traveler's tent + bonfire pit near the edge of town; once the
    // Old Man's 3 missing hunters are all rescued, one of them stands
    // by the fire for good
    tent:{x:1560, y:190},
    bonfire:{x:1470, y:250, r:18},
    // A permanent waypoint, always present in Town from the very first
    // visit -- unlike the bonfire hunter, it's always drawn/interactable,
    // but its Teleport option only opens once the player has reached
    // Mountain Pass AND unlocked a Mine checkpoint beyond depth 1 (see
    // updateTown()'s waypointUnlocked check). Reuses the old swirling
    // blue-portal art (drawBluePortalIso). Dormant/grey until unlocked,
    // pulsing blue once it is. As of v66 this is the SOLE fast-travel
    // route to the Abandoned Mine -- the old standalone "Mine portal"
    // stairway landmark that used to stand elsewhere in Town has been
    // removed; its Teleport menu (openTeleportMenu) already offered
    // "Abandoned Mine" as a destination, so nothing else needed to change
    // to keep the Mine reachable.
    waypoint:{x:900, y:620, r:22},
    // A shared chest, visible from the start, whose contents live outside
    // any single character's save (see the dc_stash_v1 localStorage key)
    // so gold and gear survive a character's death or a switch to a
    // different save slot.
    stashChest:{x:585, y:556, r:18},   // v490: moved to the west (screen-left) edge of the well plaza
    cat:{x:162, y:558, r:14},   // v392: the Support cat
    // v490: once the tavern re-opens (tavernIsOpen) two townsfolk stand about the square and the ship's captain
    // waits on the dock; talking to any of them gives a random tip (talkTownTip)
    tipNpcs:[
      {id:1, x:905, y:332, r:18, kind:'townsfolk', name:'Townswoman', robe:'#5a3a4a', hood:'#3a2a34', long:true},
      {id:2, x:1156, y:272, r:18, kind:'townsfolk', name:'Townsman', robe:'#3e4a3a', tool:'lantern'},   // v507: stands in front of the timber house door (next to the hunter's camp)
      {id:3, x:172, y:1022, r:18, kind:'dockCaptain', name:'Ship Captain', robe:'#26304a', hat:'captain'},
    ],
    spawn:{x:160, y:TOWN_ROAD_Y},
    // v86: `stock` is now the CURRENTLY OPEN vendor's stock array --
    // openVendorShop() points it at whichever of the two backing arrays
    // below the player is trading with (defaults to the Blacksmith's, so
    // every pre-existing reference to game.town.stock -- renderShop,
    // packStockGrid, the buy/sell handlers -- keeps working unmodified).
    blacksmithStock: genShopStock(charLevel||1),
    hunterStock: genHunterShopStock(charLevel||1),
    stock: null,
    // purely decorative outdoor scenery -- a scatter of larger buildings
    // ringing the edges of the much bigger square, plus perimeter trees
    decoBuildings:[
      // deco house (south-east of the well)
      {x:1000, y:860, w:200, h:140, hz:64, roofH:48,
       wallTop:'#4e4a54', wallRight:'#1e1b24', wallFront:'#2e2a36',
       roofRight:'#231f2c', roofFront:'#342e42', door:true, window:true, style:'town', chimney:true, sign:'book'},
      // chapel (north, east of the tavern)
      {x:800, y:60, w:190, h:170, hz:74, roofH:70, wallTop:'#5e606a', wallRight:'#20222a', wallFront:'#383a44',
       roofRight:'#262c3c', roofFront:'#38425c', door:true, window:true, style:'town', cross:true, shutter:'#2a2e3a'},
      // timber house
      {x:1060, y:90, w:190, h:140, hz:64, roofH:50, wallTop:'#6a5646', wallRight:'#2e2418', wallFront:'#4a3a2a',
       roofRight:'#55291f', roofFront:'#743626', door:true, window:true, style:'town', chimney:true},
      // warehouse (south, below the well)
      {x:600, y:690, w:200, h:150, hz:62, roofH:44, wallTop:'#5a544a', wallRight:'#24201a', wallFront:'#3e3a32',
       roofRight:'#352c22', roofFront:'#4a3e30', door:true, window:true, style:'town', sign:'sack', shutter:'#2a2a2a'},
      // fisherman's cottage by the docks (turf roof)
      {x:560, y:930, w:180, h:130, hz:60, roofH:48, wallTop:'#58564a', wallRight:'#22221c', wallFront:'#46443a',
       roofRight:'#2a382a', roofFront:'#3a4f36', door:true, window:true, style:'town', chimney:true, sign:'fish', shutter:'#2e4a3a'},
      // east houses
      {x:1100, y:580, w:190, h:150, hz:64, roofH:50, wallTop:'#62564a', wallRight:'#2a2018', wallFront:'#483a2e',
       roofRight:'#432a3a', roofFront:'#5c3a50', door:true, window:true, style:'town', chimney:true},
      {x:1450, y:590, w:190, h:150, hz:64, roofH:50, wallTop:'#5a5448', wallRight:'#26201a', wallFront:'#42382c',
       roofRight:'#2e3a46', roofFront:'#3e5060', door:true, window:true, style:'town', chimney:true, sign:'mug'},
    ],
    paths:[ {x:190,y:140,w:60,h:310}, {x:555,y:240,w:50,h:210}, {x:870,y:230,w:50,h:220}, {x:1130,y:230,w:50,h:220}, {x:330,y:510,w:40,h:100}, {x:880,y:510,w:50,h:110},
            {x:470,y:510,w:60,h:540}, {x:420,y:995,w:110,h:70}, {x:675,y:840,w:50,h:70}, {x:1170,y:730,w:50,h:60}, {x:1525,y:740,w:50,h:60}, {x:560,y:510,w:50,h:140}, {x:1115,y:510,w:50,h:70}, {x:1475,y:510,w:50,h:80} ],
    boat:{x:190, y:1172, s:3.6},
    props:[],
    trees:[
      {x:60,y:60}, {x:1750,y:60}, {x:1750,y:1250}, {x:60,y:300}, {x:60,y:560}, {x:1750,y:250}, {x:1750,y:640}, {x:1750,y:820}, {x:1750,y:1000}, {x:1750,y:1160},
      {x:700,y:1250}, {x:900,y:1250}, {x:1100,y:1240}, {x:1300,y:1250}, {x:1500,y:1250}, {x:1330,y:60}, {x:1500,y:60}, {x:1650,y:60}, {x:1650,y:310}, {x:1330,y:340},
      {x:560,y:880}, {x:850,y:1140}, {x:1280,y:880}, {x:1380,y:820}, {x:470,y:1180},
    ],
  };
  t.trees = t.trees.filter(tr=>!townWaterAt(tr.x,tr.y));   // v384: keep trees out of the bay
  for(const db of t.decoBuildings) t.obstacles.push({x:db.x, y:db.y, w:db.w, h:db.h, isProp:true});
  t.obstacles.push({x:-100,y:TOWN_SHORE_Y,w:TOWN_SHORE_X+100,h:TOWN_PIER.y-TOWN_SHORE_Y, isProp:true, isWater:true});
  t.obstacles.push({x:-100,y:TOWN_PIER.y+TOWN_PIER.h,w:TOWN_SHORE_X+100,h:600, isProp:true, isWater:true});
  t.obstacles.push({x:-100,y:TOWN_PIER.y,w:TOWN_PIER.x+100,h:TOWN_PIER.h, isProp:true, isWater:true});
  { const P = (k,x,y,o)=>t.props.push(Object.assign({k,x,y},o||{}));
    [300,520,760,1000,1240,1480,1720].forEach(x=>P('lantern',x,378)); [420,640,980,1180,1420,1660].forEach(x=>P('lantern',x,524));
    // dock: bigger posts, lamps, cargo and nets
    for(let x=TOWN_PIER.x+30; x<TOWN_PIER.x+TOWN_PIER.w; x+=92){ P('pierpost',x,TOWN_PIER.y+4,{s:2}); P('pierpost',x,TOWN_PIER.y+TOWN_PIER.h-4,{s:2}); }
    P('lantern',TOWN_SHORE_X-12,TOWN_PIER.y+6,{s:1.8}); P('lantern',TOWN_SHORE_X-12,TOWN_PIER.y+TOWN_PIER.h-6,{s:1.8}); P('lantern',TOWN_PIER.x+16,TOWN_PIER.y+TOWN_PIER.h/2,{s:1.8});
    P('bigcrate',330,1000,{s:2}); P('bigcrate',360,1008,{s:2}); P('barrel',385,1060,{s:2}); P('barrel',250,1064,{s:2}); P('fishcrate',200,1000,{s:2}); P('fishcrate',236,1004,{s:2});
    P('netrack',130,1060,{s:2}); P('rope',70,1000,{s:2}); P('rope',300,1062,{s:2}); P('anchor',462,1090,{s:2}); P('barrel',440,980,{s:1.6});
    for(let y=TOWN_SHORE_Y+30; y<TOWN_PIER.y-10; y+=46) P('reeds',TOWN_SHORE_X-10,y,{s:1.5});
    for(let y=TOWN_PIER.y+TOWN_PIER.h+30; y<1230; y+=60) P('reeds',TOWN_SHORE_X-10,y,{s:1.5});
    for(let x=60; x<TOWN_SHORE_X-30; x+=70) P('reeds',x,TOWN_SHORE_Y+10,{s:1.5});
    // hunter's camp: tanning yard behind the tent, spit + stumps by the fire
    P('tanframe',1538,118,{s:1.3});   // v490: two of the three tanning racks removed
    P('pelts',1610,150,{len:96}); P('pelts',1440,150,{len:70,axis:'y'});
    P('hidepile',1520,196); P('hidepile',1636,196,{}); P('stump',1500,176,{knife:true}); P('stump',1608,214); P('stump',1450,276); P('stump',1496,298);
    P('spit',1470,210,{s:1.1}); P('antlers',1640,170,{s:1.2}); P('woodpile',1420,230); P('barrel',1646,222); P('crate',1662,238); P('sack',1520,226,{c:'#8a7a58'});
    // blacksmith yard
    P('barrel',122,190); P('barrel',138,206); P('rack',172,190); P('grind',268,190); P('coal',290,172); P('trough',250,222); P('crate',108,230); P('sack',128,168,{c:'#8a7a5a'});
    // tavern frontage
    P('barrel',468,262); P('barrel',484,274); P('crate',702,266); P('bench',508,300,{axis:'x'}); P('bench',690,300,{axis:'x'}); P('board',548,370);
    // v490: the market stalls are gone; a couple of barrels are all that's left of the market row
    P('barrel',1124,360); P('barrel',1140,350,{open:true});
    // well plaza and stash (v490: benches by the well removed; the stash sits on the plaza's west edge)
    P('barrel',806,470); P('crate',818,486);
    P('barrel',562,590); P('crate',548,566);
    // waypoint, east yard, cart
    P('rock',860,664); P('rock',934,672); P('bush',878,590,{flowers:true}); P('cart',1040,540); P('hay',1004,548); P('hay',1022,560);
    P('woodpile',1020,236); P('woodpile',1030,262); P('barrel',1030,200); P('bush',780,236,{flowers:true}); P('bush',1272,210,{flowers:true});
    P('barrel',1312,640); P('woodpile',1100,768); P('bush',1086,744,{flowers:true});
    P('barrel',1670,650); P('woodpile',1450,768); P('bush',1436,744,{flowers:true});
    // paddock
    P('fence',1400,900,{len:280,axis:'x'}); P('fence',1400,900,{len:200,axis:'y'}); P('fence',1680,900,{len:200,axis:'y'}); P('fence',1400,1100,{len:280,axis:'x'});
    P('hay',1440,950); P('hay',1500,960); P('hay',1560,950); P('scarecrow',1620,1010); P('barrel',1720,1010);
    // warehouse yard
    P('bigcrate',620,876); P('bigcrate',660,886); P('barrel',770,872); P('barrel',786,884); P('sack',730,888);
    // cottage
    P('barrel',545,950); P('woodpile',780,1010); P('bush',560,1090,{flowers:true}); P('bush',1210,880,{flowers:true}); P('rock',460,1230);
  }
  // a forest ringing the town beyond its walls
  t.outerTrees = [];
  { let seed = 7; const rnd = ()=>{ seed = (seed*16807)%2147483647; return seed/2147483647; };
    const put = (x,y)=>{ const dead = rnd()<0.14; t.outerTrees.push({x, y, s:1.45+rnd()*0.9, dark:true, dead}); };
    for(let row=0; row<5; row++){ const off = 70+row*70;
      for(let x=-380; x<t.w+380; x+=64+rnd()*30) put(x+rnd()*20, -off-rnd()*30);                                       // north
      for(let y=0; y<TOWN_SHORE_Y-10; y+=64+rnd()*30) put(-off-rnd()*30, y+rnd()*20);                                  // west
      for(let y=-60; y<t.h+380; y+=64+rnd()*30){ if(Math.abs(y-TOWN_ROAD_Y) < 130) continue; put(t.w+off+rnd()*30, y+rnd()*20); }   // east, leaving the gate road open
      for(let x=TOWN_SHORE_X+30; x<t.w+380; x+=64+rnd()*30) put(x+rnd()*20, t.h+off+rnd()*30);                         // south
    }
    t.outerTrees.sort((a,b)=>(a.x+a.y)-(b.x+b.y)); }
  t.trees.forEach((tr,i)=>{ tr.dark = true; tr.s = 0.9+((i*37)%5)*0.08; if(i%3===1) tr.dead = true; });   // v196: gloomy pines and bare dead trees
  t.stock = t.blacksmithStock; // default open vendor is the Blacksmith
  return t;
}

// Between Town and the endless Mine: a large open woodland whose two exits
// sit at the map's own edges (a gap in the treeline), rather than standalone
// gate structures. The two exits are offset to different heights on their
// edges, so the dirt trail connecting them winds rather than running dead
// straight across. Roaming wolves and web-slinging spiders gather in
// spread-out packs off the beaten path -- they hold their ground until the
// player wanders close, rather than beelining in on sight. The Forest's
// single bear (see FOREST_BEAR_* below) is spawned separately, fixed near
// the Bear Cave entrance, not as one of these roaming packs.
// v62: the standing population no longer respawns on a timer while the
// player stays in the zone -- see enterForest()/the removed forest-respawn
// block in update() -- it's re-seeded fresh only on zone entry now.
const FOREST_ENEMY_TYPES = ['wolf','wolf','spider'];
// Packs are grouped by monster type rather than mixed -- a wolf pack or a
// spider pack, each spawned as a cluster of that one type around an anchor
// point. v62: pack size is now randomized small (1-5, was a fixed 5) with
// MORE packs spawned overall (see enterForest()) so the Forest reads as
// more populated but less clumped into a couple of tight blobs.
// v68: added a rarer 'treant' template (see spawnEnemy's 'treant' branch) --
// weighted at 1-in-5 by simply appearing once in this random-pick array
// alongside two wolf and two spider entries, so it doesn't dominate the
// population the way an equal 1-in-3 split would. Its own per-pack range is
// narrower (1-2, not 1-5) since a lumbering, hard-hitting tree is meant to
// show up in small numbers, not swarm like wolves/spiders.
const FOREST_PACK_TEMPLATES = [
  { type:'wolf',   countMin:1, countMax:5 },
  { type:'wolf',   countMin:1, countMax:5 },
  { type:'wolf',   countMin:2, countMax:6 },
  { type:'wolf',   countMin:2, countMax:6 },
  { type:'spider', countMin:1, countMax:5 },
  { type:'spider', countMin:1, countMax:5 },
  { type:'bear',   countMin:1, countMax:2 },   // v228: replaces the treant
];
// The Forest's one and only bear: fixed near the Bear Cave gate rather than
// roaming in a pack (see item 1 of the v62 batch) -- a small random offset
// off the gate so it doesn't sit exactly on top of the entrance trigger.
const FOREST_BEAR_OFFSET = 130;
// v68 "Dark Forest expansion" batch: the zone's overall footprint is scaled
// up ~10x in AREA (not 10x per side, which would be unplayably huge) to
// make room for the ~10x monster-count increase below at a similar-to-
// slightly-higher density than before, rather than just clumping 10x more
// enemies into the old-sized map. sqrt(10)=3.16 per dimension gets area
// scaling as close to a clean 10x as possible: old 1700x1200 (2.04M sq px)
// -> new 5400x3800 (20.52M sq px), a 10.06x area increase. See
// FOREST_PACK_ANCHOR_TARGET/FOREST_PACK_COUNT below for the matching ~10x
// monster-count scale-up, and README "Version 68" for the full writeup.
const FOREST_W = 5400, FOREST_H = 3800;
// How many pack anchors to try to place (was a flat 14 in the old 1700x1200
// map). Scaled by the same ~10x area factor so anchor DENSITY -- and thus
// how spread-out/clumped packs feel -- stays the same as before, just
// spread across a much bigger map instead of getting denser.
const FOREST_PACK_ANCHOR_TARGET = 140;
// Town Guard NPCs (Sept 2026 patch): two stationary archers posted just
// outside Town's own gate, flanking the townGate on the Dark Forest side
// (the Forest and Town are separate scenes/rooms -- see g.scene -- and
// Town's own g.enemies is always empty by design, per updateTown()'s
// comment, so a guard planted inside Town would never have anything to
// shoot at; placing them on the Forest side of the shared gate, a short
// distance inside the treeline, is what actually lets them "shoot monsters
// that wander within range" as asked, while still reading as guarding the
// town's doorstep). Visually reuses the existing Bandit Archer body rig
// (drawDemon's kind==='banditarcher' palette) as the closest existing
// leather-and-bow "ranger" skin already in the game -- there's no separate
// player-facing Ranger sprite distinct from the Hunter class's UI icon.
// Damage/range/fire-rate are set as a fraction of a real archer enemy's
// own numbers (banditarcher: dmg 7+depth*1.6, preferRange 210, atkCdMax
// 1.6, 260 arrow speed) -- enough to meaningfully help clear the doorstep
// without one-shotting anything.
const GUARD_ATTACK_RANGE = 320;
const GUARD_ATK_CD_MAX = 1.1;
const GUARD_DMG = 16;
const GUARD_ARROW_SPEED = 300;
const GUARD_FLANK_OFFSET = 80; // distance either side of the gate, along the treeline
// v490: Mistfall townsfolk and the ship's captain share these tips (a random one each time you talk to them)
const TOWN_TIPS = [
  "If you try and remove a perfect quality part from an item, it's gunna get damaged.",
  "You know, bigger belts allow more potions.",
  "Check the character stat page to learn more about yourself.",
  "Legend has it, those runestones have a special purpose.",
  "Only the right type of added damage works with the right attacks. Fire equipment damage for fire attacks, for example.",
  "Don't forget to interact with a waypoint to return to it later.",
  "Check your dungeon map page to figure out where to go, if you've found it, that is.",
  "There are plenty of ways to use monster parts, try different combinations!",
  "Don't forget to have proper resistance gear for certain enemies.",
  "Sleeping at a bed in the tavern will make you a well rested adventurer!",
  "You can't remove perfect parts from your gear without damaging it, ya know.",
];
let lastTownTip = -1;
// the tip-givers standing in town right now (none until the tavern re-opens and the ship is back)
function townTipNpcs(g){ return (g && g.town && g.town.tipNpcs && g.player && tavernIsOpen(g.player)) ? g.town.tipNpcs : []; }
function nearTownTipNpc(g){ const p = g.player; let best = null, bd = 1e9; for(const n of townTipNpcs(g)){ const d = dist(p, n); if(d < n.r + p.r + 24 && d < bd){ bd = d; best = n; } } return best; }
function talkTownTip(n){
  if(!n) return;
  let i = Math.floor(Math.random()*TOWN_TIPS.length);
  if(i===lastTownTip) i = (i+1+Math.floor(Math.random()*(TOWN_TIPS.length-1)))%TOWN_TIPS.length;
  lastTownTip = i;
  showNpcText(n.name, '"'+TOWN_TIPS[i]+'"', 'Close');
}
function makeTownGuards(gate){
  // Guards sit just inside the Forest from the gate (small +x nudge off the
  // west-edge gate) and are offset north/south from it along the treeline --
  // "standing on either side of the town entrance" per the request.
  return [
    {x:gate.x+60, y:gate.y-GUARD_FLANK_OFFSET, r:13, type:'banditarcher', isGuard:true,
     hp:99999, maxHp:99999, invulnerable:true, faceSign:1, animT:rand(0,10), atkAnimT:0, hitT:0, moving:false, atkCd:rand(0,GUARD_ATK_CD_MAX)},
    {x:gate.x+60, y:gate.y+GUARD_FLANK_OFFSET, r:13, type:'banditarcher', isGuard:true,
     hp:99999, maxHp:99999, invulnerable:true, faceSign:1, animT:rand(0,10), atkAnimT:0, hitT:0, moving:false, atkCd:rand(0,GUARD_ATK_CD_MAX)},
  ];
}
// Scans g.enemies for the nearest hostile within GUARD_ATTACK_RANGE of a
// guard and fires a plain arrow projectile at it -- reuses the exact same
// enemy-damaging projectile mechanism the player's own Bow/archer enemies
// use (from:'player' is what the projectile-update loop's damage branch
// checks to know it should hurt g.enemies -- see the "projectiles" loop in
// update()), just sourced from a fixed guard position instead of the player
// or a follower.
function updateTownGuards(g, dt){
  if(!g.forest || !g.forest.guards) return;
  for(const gd of g.forest.guards){
    gd.animT = (gd.animT||0) + dt;
    if(gd.atkCd>0) gd.atkCd -= dt;
    if(gd.atkAnimT>0) gd.atkAnimT -= dt;
    let best=null, bestD=GUARD_ATTACK_RANGE;
    for(const e of g.enemies){
      if(e.hp<=0) continue;
      const dd = dist(gd, e);
      if(dd<bestD){ bestD=dd; best=e; }
    }
    if(best){
      gd.faceSign = (best.x>=gd.x) ? 1 : -1;
      if(gd.atkCd<=0){
        gd.atkCd = GUARD_ATK_CD_MAX;
        gd.atkAnimT = 0.22;
        const ang = Math.atan2(best.y-gd.y, best.x-gd.x);
        g.projectiles.push({x:gd.x, y:gd.y, vx:Math.cos(ang)*GUARD_ARROW_SPEED, vy:Math.sin(ang)*GUARD_ARROW_SPEED,
          r:6, dmg:GUARD_DMG, from:'player', life:1.4, color:'#dff0f8', isArrow:true});
      }
    }
  }
}
