// ---------- Quests ----------
// A single quest for now: the old man's 3 missing hunters, scattered
// somewhere reachable in the Forest. Talking to him with it not yet
// accepted opens the Accept/Leave dialogue; declining leaves nothing
// recorded, so he can be talked to again later for the same offer.
const QUEST_FIND_HUNTERS = {
  id:'find_hunters', name:'The Missing Hunters',
  desc:"Our hunting party hasn't returned. Please find them.",
  total:3,
};
// (v164) The Blacksmith's quest, offered once the 3 hunters are rescued.
const QUEST_HAMMER = {
  id:'smith_hammer', name:'The Myth of the Ancient Hammer',
  desc:"The Frosthold Commander carried an Ancient Smithing Hammer. Bring it to the Blacksmith.",
  descReturn:"You found an ancient smithing hammer. I wonder if our blacksmith can put it to good use.",
  descDone:"The Blacksmith can now socket your weapons and armor.",
  total:1,
};
// The Tavern's Barkeeper quest: bandits hold Lighthouse Tower and the
// beacon's dark, so no ship can dock and he can't open up. Completion is
// hooked directly into the same beacon-on flag Lighthouse Tower's floor 5
// sets (see turnOnBeacon/checkLightTheWayQuest) plus a floor-5-cleared
// flag (p.lighthouseFloor5Cleared, set the moment the rooftop's clear
// portal spawns) -- both must be true, matching "clear the tower AND turn
// on the beacon" from the brief.
const QUEST_LIGHT_THE_WAY = {
  id:'light_the_way', name:'Light the Way',
  desc:"Bandits hold Lighthouse Tower and its beacon is dark -- no ship can dock without it. The tower stands on the west edge of Sunlit Plains (through River Valley). Climb to the rooftop and light the beacon.",
  descReturn:"The beacon is lit. Return to the Barkeeper in Mistfall.",
  total:1,
};
function getQuest(p, id){ return p.quests ? p.quests.find(q=>q.id===id) : null; }
// (v127) The Old Man's "Legend of the Summit": defeat both Mountain Top Shrine protectors, then pray at the shrine.
// (v259) Offered by the Old Man once the Witch is rescued: the Wraith Lord is loose, the Frosthold runestone is the answer.
const QUEST_WRAITH = {
  id:'wraith_rune', name:'The Wraith Lord Unleashed',
  desc:"You accidentally released the Wraith Lord from its crypt. The Frosthold dwarves keep a special runestone at the top of their tower. Climb Frosthold Tower, retrieve it, and we can use it against the Wraith Lord.",
  descDone:"You took the runestone from the top of Frosthold Tower.",
  total:1,
};
function completeWraithQuest(){
  const p = game.player, q = getQuest(p, QUEST_WRAITH.id);
  if(q && q.status==='active'){
    q.status = 'complete'; q.progress = q.total; q.desc = QUEST_WRAITH.descDone; q.rewarded = true;
    gainXp(game, Math.round(xpForKill(42, true)*2));
    showMsg('Quest complete: '+QUEST_WRAITH.name, 3.0);
    updateQuestBadge(); saveGame();
  }
}
function protectorKilled(){ /* v351: the Legend of the Summit quest is gone; the protectors are tracked by the shrine itself */ }
function makeAwakenedRuneItem(){
  return { id:'it'+Math.random().toString(36).slice(2,9), slotType:'questitem', rarity:'rare',
    name:'Defensive Runestone', affixes:[], color:'#5fd0ff', questId:'templar_runestone_awake', unsellable:true,
    questDesc:'A rune-carved stone marked with a shield, judged and awakened by the mountain. It hums, and seems to tug toward the east. Quest item -- cannot be sold.' };
}
function insertShrineRunestone(){
  const p = game.player, g = game;
  if((p.shrineStage||0)!==0) return;
  const it = findRunestone(p); if(!it) return;
  p.inventory.splice(p.inventory.indexOf(it), 1);
  p.shrineStage = 1;
  const iz = g.iz;
  spawnShrineProtectors(g, iz);
  iz.protectorsSpawned = true; iz.protectorsDown = false;
  g.particles.push({type:'burst', x:iz.altar.x, y:iz.altar.y, t:0.8, max:0.8, color:'#9fe0ff'});
  g.particles.push({type:'ring', x:iz.altar.x, y:iz.altar.y, t:0.7, max:0.7, r:150, color:'#9fe0ff'});
  shakeScreen(g, 5, 0.6);
  showBigMsg('THE MOUNTAIN JUDGES', 'The dormant protectors awaken', 3.2);
  updateQuestBadge(); saveGame();
}
function claimShrineBlessing(){
  const p = game.player, g = game;
  if((p.shrineStage||0)>=3) return;
  p.shrineStage = 3; p.shrineBlessed = true;
  p.skillPoints = (p.skillPoints||0) + 2;
  forceAddToBag(p, makeAwakenedRuneItem());
  const q = getQuest(p, 'shrine_stone');
  if(q){ q.progress=q.total; q.desc='The mountain judged you worthy and awakened the runestone. Show it to the scholar.'; }   // v456: completed by the scholar
  p.snowWallOpen = true;
  npcMark(p, 'scholar', true);
  showBigMsg('The Mountain judges you worthy.', 'Received +2 skill points.', 3.6);
  if(g.iz && g.iz.altar){ g.particles.push({type:'burst', x:g.iz.altar.x, y:g.iz.altar.y, t:0.8, max:0.8, color:'#9fe0ff'}); g.iz.avalancheT = 3.2; }
  shakeScreen(g, 7, 3.0);
  bagPulse(); updateQuestBadge(); saveGame();
}
// ---- "Hidden Secrets" (v120): begins when the Ruins Map is taken from the Dark
// Crypt chest. Stages: toOldMan -> toRuins -> explore -> complete.
const QUEST_HIDDEN_SECRETS = { id:'hidden_secrets', name:'Hidden Secrets', total:3 };
const HIDDEN_SECRETS_DESC = {
  toOldMan:"You found a Ruins Map in the Dark Crypt. Bring it to the Old Man.",
  toRuins:"The Old Man says the map points to the Lakeside Ruins. Take the Ruins Map to the ancient stones on the island at the lake's center.",
  explore:"Descend to the bottom (level 5) of the Ancient Ruins beneath Lakeside Ruins and open the chest.",
  complete:"You found the Defensive Runestone. Take it to the sealed gate at the end of the Mountain Pass road (Frosthold Keep).",
};
function setHiddenSecretsStage(q, stage){
  q.stage = stage;
  q.desc = HIDDEN_SECRETS_DESC[stage];
  q.progress = {toOldMan:0, toRuins:1, explore:2, complete:3}[stage];
  if(stage==='complete') q.status = 'complete';
  updateQuestBadge();
}
function hasRuinsMap(p){ return (p.inventory||[]).some(it=>it.questId==='ruins_map'); }
function startHiddenSecretsQuest(p){
  if(!p.quests) p.quests = [];
  if(getQuest(p, QUEST_HIDDEN_SECRETS.id)) return;
  const q = {id:QUEST_HIDDEN_SECRETS.id, name:QUEST_HIDDEN_SECRETS.name, desc:'', status:'active', progress:0, total:QUEST_HIDDEN_SECRETS.total, stage:'toOldMan'};
  p.quests.push(q);
  setHiddenSecretsStage(q, 'toOldMan');
  showMsg('New quest: Hidden Secrets', 2.0);
}
// Old Man turn-in: returns true if it handled the conversation.
function hiddenSecretsOldMan(p){
  if(hasRuinsMap(p) && !getQuest(p, QUEST_HIDDEN_SECRETS.id)) startHiddenSecretsQuest(p); // map from before this quest existed
  const q = getQuest(p, QUEST_HIDDEN_SECRETS.id);
  if(!q || q.status==='complete') return false;
  if(q.stage==='toOldMan' && hasRuinsMap(p)){
    setHiddenSecretsStage(q, 'toRuins');
    showMsg('"A map of the ruins... Take it to the Lakeside Ruins, to the ancient stones on the island. Something is buried there."', 4.2);
    saveGame();
    return true;
  }
  if(q.stage==='toOldMan'){ showMsg('"Did you lose the map? It must be in the crypt\'s chest."', 2.4); return true; }
  if(q.stage==='toRuins'){ showMsg('"Take the map to the Lakeside Ruins -- the ancient stones on the island."', 2.6); return true; }
  return false;
}
// Lakeside Ruins island: using the map on the ancient stones opens the entrance.
function canStudyRuins(p){
  return !!(p.scholarMeet && p.ruinsEvent===1 && !p.ruinsEntranceOpen);
}
function studyLakesideRuins(){
  const p = game.player, g = game;
  if(!canStudyRuins(p)) return;
  startRuinsEvent(g);
}
// The town well: a free, repeatable full heal (HP and MP) -- no panel opens,
// just a quick dip and a toast confirming it happened.
function drinkFromWell(){
  const p = game.player;
  // Show a menu with well options: drink to heal, or reset skills
  game.modalOpen = true;
  wellOverlay.style.display = 'flex';
}
function drinkWellHeal(){
  const p = game.player;
  if(p.hp>=p.maxHp && p.mp>=p.maxMp){
    showMsg('Already at full health', 1.2);
    closeWellMenu();
    return;
  }
  p.hp = p.maxHp; p.mp = p.maxMp;
  showMsg('Healed!', 1.4);
  closeWellMenu();
}
function closeWellMenu(){
  wellOverlay.style.display = 'none';
  game.modalOpen = false;
}
// Lighthouse Tower rooftop beacon (v94, quest feature): turns the beacon
// from off to on -- a persistent, account/character-save flag (see
// saveGame/newGame's restore below), same "one-time state flip, saved
// right away" pattern as p.cemeteryCleared/p.reachedDarkCrypt. Hooks
// straight into checkLightTheWayQuest so the Barkeeper's quest completes
// the instant this AND the floor-5-cleared flag are both true.
function turnOnBeacon(){
  const p = game.player;
  if(p.lighthouseBeaconOn) return;
  p.lighthouseBeaconOn = true;
  showMsg('The beacon is lit. Return to the barkeeper.', 3.0);
  updateInteractPrompt(null);
  saveGame();
  checkLightTheWayQuest();
}
// One-time reward once the hunters quest is complete: a class-appropriate
// magic-rarity weapon (Ranger->bow, Mystic->staff, Warrior->sword/greatsword/
// shield picked at random), generated through the normal item system so it
// behaves like any other drop -- auto-equipped if the matching slot is open,
// otherwise dropped straight into the bag.
// v204: the Old Man's thank-you is now a RARE RING: one guaranteed Lightning Resist mod (20%) plus 2 random others
// (useful against the Kraken's lightning), built through the normal item system.
// (v351) A Rare ring built around one guaranteed 20% resist: the matching gem ring's implicit is set to 20, plus 2 random mods.
function makeResistRewardRing(p, resKey, variantName, word){
  let item = null;
  for(let tries=0; tries<60; tries++){
    const it = generateItem(Math.max(1, p.level||1), 'rare', 'ring');
    if(it.baseName!==variantName && tries<59) continue;
    const imp = it.affixes.find(a=>a.implicit);
    const mods = it.affixes.filter(a=>!a.implicit && a.key!==resKey && a.key!=='allResistPct');
    if(mods.length>=2 || tries===59){
      item = it; item.baseName = variantName;
      const implicit = imp && imp.key===resKey ? imp : {key:resKey, label:IMPLICIT_FORMULA[resKey].label, value:20, implicit:true};
      implicit.value = 20;
      item.affixes = [implicit].concat(mods.slice(0,2));
      break;
    }
  }
  item.name = makeRareName('ring'); item.nameV3 = true;
  return item;
}
// v456: a reward piece that fits the player's class -- its weapon type, or armor of its own material
function classRewardItem(p, lvl, rarity){
  const armorCat = ['helm','armor','gloves','boots'][Math.floor(Math.random()*4)];
  const mat = p.cls==='ranger' ? 'leather' : p.cls==='mystic' ? 'robe' : 'plate';
  const wpn = p.cls==='ranger' ? 'bow' : p.cls==='mystic' ? 'staff' : (Math.random()<0.5 ? 'weapon2h' : 'weapon1h');
  let it = null;
  try{ it = Math.random()<0.5 ? generateItem(lvl, rarity, wpn, null, p) : generateItem(lvl, rarity, armorCat, mat, p); }catch(e){}
  if(!it || (it.material && it.material!==mat)) it = generateItem(lvl, rarity, wpn, null, p);
  return it;
}
// v483: class gear (armor of your own material) with a guaranteed resistance, aimed at the NEXT hunt's damage type
const RES_LABEL = {fireResistPct:'Fire Resist %', coldResistPct:'Cold Resist %', lightningResistPct:'Lightning Resist %', poisonResistPct:'Poison Resist %'};
function classResistRewardItem(p, lvl, resKey, rarity){
  const mat = p.cls==='ranger' ? 'leather' : p.cls==='mystic' ? 'robe' : 'plate';
  let it = null;
  for(let i=0;i<12 && !it;i++){ try{ const c = generateItem(lvl, rarity||'rare', ['helm','armor','gloves','boots'][Math.floor(Math.random()*4)], mat, p); if(c && (!c.material || c.material===mat)) it = c; }catch(e){} }
  if(!it) return classRewardItem(p, lvl, rarity||'rare');
  const val = Math.round(Math.min(30, 18 + lvl*0.2));
  const afs = it.affixes || (it.affixes = []);
  const ex = afs.find(a=>a.key===resKey && !a.implicit);
  if(ex){ ex.value = Math.max(ex.value||0, val); }
  else {
    const free = afs.filter(a=>!a.implicit && a.key!==resKey);
    const tmpl = free.length ? free[free.length-1] : null;
    const af = Object.assign({}, tmpl||{}, {key:resKey, label:RES_LABEL[resKey], value:val}); delete af.word; delete af.tier;
    if(tmpl && free.length>=4) afs[afs.indexOf(tmpl)] = af; else afs.push(af);
  }
  try{ migrateItemAffixes(it); }catch(e){}
  return it;
}
// v483: a Tome of Skill -- read it (Use, or right-click) for +1 skill point
function makeSkillTomeItem(){
  return { id:'it'+Math.random().toString(36).slice(2,9), slotType:'questitem', rarity:'rare', shape:[2,2],
    name:'Tome of Skill', affixes:[], color:'#b48cff', questId:'skill_tome', unsellable:true,
    questDesc:'A heavy, rune-bound tome. Read it (Use, or right-click) to gain +1 skill point.' };
}
function readSkillTome(idx){
  const p = game.player, it = p.inventory[idx];
  if(!it || it.questId!=='skill_tome') return false;
  p.inventory.splice(idx,1);
  p.skillPoints = (p.skillPoints||0) + 1;
  showMsg('You read the Tome of Skill: +1 Skill Point', 3.4, '#b48cff');
  try{ sfxPlay('banner', 0.8); }catch(e){}
  try{ if(typeof updateSkillPointsUi==='function') updateSkillPointsUi(); }catch(e){}
  closeItemDetail(); try{ renderInventory(); }catch(e){}
  saveGame(); return true;
}
// v483: the freed witch teaches three cauldron recipes
function witchGiveRecipes(p){
  if(p.witchRecipesGiven) return; p.witchRecipesGiven = true;
  if(!p.recipes) p.recipes = {};
  const unknown = STONE_RECIPES.filter(r=>!p.recipes[r.id]); const got = [];
  for(let i=0;i<3 && unknown.length;i++){ const r = unknown.splice(Math.floor(Math.random()*unknown.length),1)[0]; p.recipes[r.id] = true; got.push(PART_DEFS[r.stone].name); }
  if(got.length) setTimeout(()=>{ showMsg('The witch teaches you '+got.length+' cauldron recipe'+(got.length>1?'s':'')+': '+got.join(', '), 5.0, '#f2a31b'); }, 1400);
}
function makeHunterRewardRing(p){ return makeResistRewardRing(p, 'lightningResistPct', 'Topaz Ring', 'Grounding'); }
function grantQuestRewardItem(p){
  const item = makeHunterRewardRing(p);
  const equipped = tryAutoEquip(p, item);
  if(!equipped && !giveRewardIfRoom(p, [item])) return false;   // v493: asks again until there is room
  bagPulse();
  showMsg('"You\'ve done so much for us -- please, take this ring." Received: '+item.name, 2.8);
  saveGame();
  return true;
}
function leviathanSlain(p){
  if(p.leviathanSlain || p.partLeviathan) return true;
  const lq = getQuest(p, 'hunt_leviathan');
  return !!((lq && (lq.killed || lq.status==='complete')) || getQuest(p,'show_scale') || getQuest(p,'witch_find'));
}
function talkToQuestGiver(){
  const p = game.player;
  const q = getQuest(p, QUEST_FIND_HUNTERS.id);
  { const bq0 = getQuest(p, QUEST_BRIDGE.id); if(bq0 && bq0.status==='complete' && !bq0.rewarded){ grantBridgeReward(p, bq0); return; } }   // v486: turn in the bridge any time
  if(q && q.status==='complete'){
    if(!q.rewarded){
      if(grantQuestRewardItem(p)) q.rewarded = true;
    } else if(!getQuest(p, QUEST_BRIDGE.id) && !p.bridgeCleared){
      pendingQuestGiver = 'oldmanBridge';
      questGiverNameEl.textContent = 'Old Man';
      questGiverTextEl.textContent = '"Bandits have seized the old bridge in the River Valley, south of the Dark Forest. It is the only road to the Sunlit Plains. Drive them out of their camp and the way will be safe again. Will you clear it?"';
      openQuestGiverDialogue();
    } else {
      const wq = getQuest(p, QUEST_WRAITH.id);
      if(false && p.witchRescued){   // v234: the mountain shrine legend waits until the witch is rescued
        pendingQuestGiver = 'oldmanLegend';
        questGiverNameEl.textContent = 'Old Man';
        questGiverTextEl.textContent = '"There is an old legend -- a shrine atop the mountain, north of the Mountain Pass, guarded by three protectors: a shield-bearer, a berserker and a templar. Defeat them and the shrine will grant you a great boon. Will you ascend?"';
        openQuestGiverDialogue();
      } else if(false && !wq && p.witchRescued && p.shrineBlessed && p.ancientRuinsChestLooted){   // v261: offered only after the summit shrine has blessed you AND the Ancient Ruins runestone is collected
        pendingQuestGiver = 'oldmanWraith';
        questGiverNameEl.textContent = 'Old Man';
        questGiverTextEl.textContent = '"So... you accidentally released the Wraith Lord from its crypt. Foolish, but what is done is done. The Frosthold dwarves keep a special runestone at the top of their tower. Retrieve it, and we can use it against the Wraith Lord. Will you climb Frosthold Tower?"';
        openQuestGiverDialogue();
      } else if(wq && wq.status==='active'){
        showMsg('"The runestone is held at the top of Frosthold Tower. Bring it down and we can face the Wraith Lord."', 3.4);
      } else {
        { const bq = getQuest(p, QUEST_BRIDGE.id); showMsg(bq && bq.status==='active' ? '"The bandits still hold the old bridge ('+bq.progress+'/'+bq.total+')."' : '"Be careful out there."', 2.8); }   // v456: no more respec here (the well still offers it)
      }
    }
  } else if(q){
    { const left = huntersStatusList(p, q).filter(h=>!h.found).map(h=>h.clue).join('. ');
      const nf = huntersStatusList(p, q).filter(h=>h.found).length; const intro = q.omTalked ? '' : (nf>0 ? 'You found '+(nf>1?'some':'one')+' of our hunters! Please, find the others. ' : 'Please, find our missing hunters. ');
      q.omTalked = true; showMsg('"'+intro+'Check: '+left+'."', 4.4); updateQuestBadge(); saveGame(); }
  } else {
    pendingQuestGiver = 'oldman';
    questGiverNameEl.textContent = 'Old Man';
    questGiverTextEl.textContent = '"' + QUEST_FIND_HUNTERS.desc + '"';
    openQuestGiverDialogue();
  }
}
// The Barkeeper's own version of talkToQuestGiver above -- same
// not-yet-offered/active/complete shape, reusing the exact same dialogue
// overlay+Accept/Leave infrastructure (see pendingQuestGiver below), just
// pointed at QUEST_LIGHT_THE_WAY instead of QUEST_FIND_HUNTERS. No
// separate reward item on completion (the reward IS the Tavern opening --
// see checkLightTheWayQuest/the sign+door unlocking once it's complete).
function talkToBarkeeper(){
  const p = game.player;
  checkLightTheWayQuest();
  const q = getQuest(p, QUEST_LIGHT_THE_WAY.id);
  if(q && q.status==='active' && q.stage==='return'){
    const rk = p.cls==='warrior' ? 'beer' : 'coffee';   // v490: no mana potions; the Mystic gets coffee
    const li = classRewardItem(p, Math.max(p.level||1, 15), 'reward');   // v483: class gear instead of a Health Potion
    if(!giveRewardIfRoom(p, [makePotionItem(rk), li])) return;   // v493: the quest stays open until there is room
    q.status = 'complete'; q.progress = q.total; p.gold += 200;
    showMsg('Quest complete: '+QUEST_LIGHT_THE_WAY.name+' \u2014 '+li.name+', a free '+POTION_DEFS[rk].name+' and 200 gold!', 3.6);
    updateQuestBadge(); bagPulse(); saveGame();
  } else if(q && q.status==='complete'){
    showMsg('"Thank you, traveler -- the beacon\'s lit and the Tavern is finally open!"', 2.4);
  } else if(q){
    showMsg('"Please -- climb to the top of the Lighthouse and light the beacon."', 2.4);
  } else {
    pendingQuestGiver = 'barkeeper';
    questGiverNameEl.textContent = 'Barkeeper';
    questGiverTextEl.textContent = '"' + QUEST_LIGHT_THE_WAY.desc + '"';
    openQuestGiverDialogue();
  }
}
const questGiverOverlay = document.getElementById('questGiverOverlay');
const questGiverNameEl = questGiverOverlay.querySelector('h2');
const questGiverTextEl = document.getElementById('questGiverText');
// Which NPC opened the (shared) dialogue overlay -- read by the Accept
// button handler below to decide which quest object to push.
let pendingQuestGiver = 'oldman';
function openQuestGiverDialogue(){
  game.modalOpen = true;
  questGiverOverlay.style.display = 'flex';
}
function closeQuestGiverDialogue(){
  questGiverOverlay.style.display = 'none';
  game.modalOpen = false;
}
document.getElementById('questGiverClose').addEventListener('click', closeQuestGiverDialogue);
document.getElementById('questLeaveBtn').addEventListener('click', closeQuestGiverDialogue);
document.getElementById('questAcceptBtn').addEventListener('click', ()=>{
  const p = game.player;
  if(!p.quests) p.quests = [];
  if(pendingQuestGiver==='barkeeper'){
    if(!getQuest(p, QUEST_LIGHT_THE_WAY.id)){
      p.quests.push({id:QUEST_LIGHT_THE_WAY.id, name:QUEST_LIGHT_THE_WAY.name, desc:QUEST_LIGHT_THE_WAY.desc, status:'active', progress:0, total:QUEST_LIGHT_THE_WAY.total});
      showMsg('Quest accepted: '+QUEST_LIGHT_THE_WAY.name, 1.6);
      checkLightTheWayQuest();
      updateQuestBadge();
      saveGame();
    }
  } else if(pendingQuestGiver==='oldmanBridge'){
    if(!getQuest(p, QUEST_BRIDGE.id) && !p.bridgeCleared){
      p.quests.push({id:QUEST_BRIDGE.id, name:QUEST_BRIDGE.name, desc:QUEST_BRIDGE.desc, status:'active', progress:0, total:QUEST_BRIDGE.total});
      showMsg('Quest accepted: '+QUEST_BRIDGE.name, 1.6);
      updateQuestBadge();
      saveGame();
    }
  } else if(pendingQuestGiver==='oldmanWraith'){
    if(!getQuest(p, QUEST_WRAITH.id)){
      p.quests.push({id:QUEST_WRAITH.id, name:QUEST_WRAITH.name, desc:QUEST_WRAITH.desc, status:'active', progress:0, total:QUEST_WRAITH.total});
      showMsg('Quest accepted: '+QUEST_WRAITH.name, 1.6);
      updateQuestBadge();
      if(p.fhtRuneTaken) completeWraithQuest(); else saveGame();
    }
  } else if(!getQuest(p, QUEST_FIND_HUNTERS.id)){
    // Each of the 3 hunters lives in a fixed location now (one randomly
    // placed in the Dark Forest, one beside the Spider Lair boss, one at
    // the end of the Bear Cave) rather than 3 interchangeable Forest spots
    // -- foundForest/foundSpider/foundBear track each independently so
    // progress only ever moves forward, no matter what order they're found in.
    p.quests.push({id:QUEST_FIND_HUNTERS.id, name:QUEST_FIND_HUNTERS.name, desc:QUEST_FIND_HUNTERS.desc, status:'active', progress:0, total:QUEST_FIND_HUNTERS.total, foundForest:false, foundSpider:false, foundBear:false, omTalked:true});
    showMsg('Quest accepted: '+QUEST_FIND_HUNTERS.name, 1.6);
    updateQuestBadge();
    saveGame();
  }
  closeQuestGiverDialogue();
});
// Completion check for Light the Way -- called whenever either half of
// its condition can newly become true (turnOnBeacon, and the rooftop
// clear-portal spawn in update()'s lighthouse branch), so it completes
// the instant BOTH the beacon is on and floor 5 is cleared, regardless of
// which happens first.
function checkLightTheWayQuest(){
  const p = game.player;
  let q = getQuest(p, QUEST_LIGHT_THE_WAY.id);
  // v402: cleared the tower without ever accepting? Skip the accept -- the quest appears ready to turn in,
  // the tavern opens and the Barkeeper is already behind the bar.
  if(!q && p.lighthouseBeaconOn){
    if(!p.quests) p.quests = [];
    q = {id:QUEST_LIGHT_THE_WAY.id, name:QUEST_LIGHT_THE_WAY.name, desc:QUEST_LIGHT_THE_WAY.descReturn, status:'active', progress:QUEST_LIGHT_THE_WAY.total, total:QUEST_LIGHT_THE_WAY.total, stage:'return'};
    p.quests.push(q);
    showMsg('The beacon is lit. Return to the barkeeper.', 3.0);
    updateQuestBadge(); saveGame();
    return;
  }
  if(q && q.status==='active' && p.lighthouseBeaconOn && q.stage!=='return'){
    // beacon lit: the quest now waits for the turn-in
    q.stage = 'return'; q.progress = q.total;
    q.desc = QUEST_LIGHT_THE_WAY.descReturn;
    showMsg('The beacon is lit. Return to the barkeeper.', 3.0);
    updateQuestBadge();
    saveGame();
  }
}

// v86: item 5 of the UI/UX overhaul -- the rescued Hunter NPC (bonfire, in
// Town) now offers Talk/Shop. Talk keeps the exact original thank-you line
// this NPC has always said; Shop opens the same vendor-buy screen the
// Blacksmith uses, pointed at the Hunter's own Ranger-only stock (see
// openShop('hunter')/genHunterShopStock).
const hunterOverlay = document.getElementById('hunterOverlay');
// (v128, reordered v210) The Hunter's quest chain: Kraken, Leviathan, Woolly Mastodon, Flame Raptor, then Dragon Bolt / Gojira.
const QUEST_LEVIATHAN = {
  id:'hunt_leviathan', name:'The Poisoned Pool',
  desc:"Something vast stirs in the poisoned pools of the Black Marsh, creeping ever closer to Mistfall. Hunt it down before it reaches the town. Its venom is deadly -- gear that resists poison will keep you standing.",
  descDone:"The Leviathan is dead. Return to the Hunter for your reward.",
  total:1,
};
const QUEST_MASTODON = {
  id:'hunt_mastodon', name:'The Icy Cellar',
  desc:"Enormous tracks lead into the Icy Cellar, west of the Icy Summit above the Mountain Pass. Follow them.",
  descDone:"The Woolly Mastodon is dead. Return to the Hunter for your reward.",
  total:1,
};
const QUEST_KRAKEN = {
  id:'hunt_kraken', name:'Hunt the Kraken',
  desc:"Something with crackling tentacles lives in the flooded caves beneath the Lakeside Ruins. Descend through the Ancient Ruins and the Flooded Temple beneath Lakeside Ruins to reach the Sunken Depths. Hunt the Kraken at the far end of its bridge.",
  descDone:"The Kraken is dead. Return to the Hunter for your reward.",
  total:1,
};
const QUEST_COLOSSUS = {
  id:'hunt_colossus', name:'The Heart of the Mountain',
  desc:"The ground trembles beneath the Mountain Pass. At its south end a switchback road leads down to the Mountain Depths and the Ember Caverns, and the tremors come from deeper still. Find the source and bring back proof.",
  descDone:"The Molten Colossus is dead. Return to the Hunter for your reward.",
  total:1,
};
// v263 chain order: 1) Kraken, 2) Leviathan, 3) Woolly Mastodon, 4) Molten Colossus -- then the Dragon Bolt and Gojira.
const MINO_NO_HUNTER = 'I hold a unique item. Perhaps I can find someone who knows what to do with it.';
function huntQuestDesc(p, q){   // v486: until the Hunter is back in Mistfall, a finished hunt doesn't point at him
  if(q && q.desc===MINO_NO_HUNTER){ const hq = getQuest(p, QUEST_FIND_HUNTERS.id); if(hq && hq.status==='complete') return 'The quarry is dead. Return to the Hunter by the Mistfall bonfire.'; }
  return q ? q.desc : '';
}
const QUEST_MINOTAUR = {
  id:'hunt_minotaur', name:'Hunt the Minotaur',
  desc:"A minotaur has made its lair in the Minotaur Cave, a maze of bone halls beside the River Valley road. Hunt it down and bring back what you find.",
  descDone:"The Minotaur is dead. Return to the Hunter.",
  total:1,
};
const HUNTER_QUESTS = [
  { Q:QUEST_MINOTAUR, lvl:8, gold:150, xp:1.5, resNext:'lightningResistPct',
    offer:'"You saved us. Hunt the minotaur in the Minotaur Cave, beside the River Valley road?"',
    remind:'"The minotaur waits in the great hall at the far end of the cave."',
    done:'"A Heartstone... a witch in the Black Marsh may know what to do with it."' },
  { Q:QUEST_KRAKEN, lvl:24, gold:250, xp:1.5, ring:'poison', resNext:'poisonResistPct',
    offer:'"Something with crackling tentacles lives in the flooded caves beneath the Lakeside Ruins. Hunt it?"',
    remind:'"The Kraken lurks in the Sunken Depths, beneath the Lakeside Ruins."',
    done:'"You killed the Kraken! Take this ring -- it will keep the poison off you."' },
  { Q:QUEST_LEVIATHAN, lvl:28, gold:350, xp:1.5, resNext:'coldResistPct',
    offer:'"Since you defeated that Kraken, you should be able to take out a monster from the marsh pools in Black Marsh. Its poison eats through anything -- wear gear that resists poison. Please destroy it before it comes any closer to our town. Good luck!"',
    remind:'"The beast lurks in the marsh pools of the Black Marsh. Wear gear that resists poison."',
    done:'"You slew the Leviathan?! Take this -- you\'ve earned it."' },
  { Q:QUEST_MASTODON, lvl:34, gold:600, xp:2, resNext:'fireResistPct',
    offer:'"Great tracks in the snow, leading to the Icy Cellar west of the Icy Summit. Will you follow them?"',
    remind:'"The tracks lead to the Icy Cellar, west of the Icy Summit."',
    done:'"You slew it?! Take this -- you\'ve earned it."' },
  { Q:QUEST_COLOSSUS, lvl:35, gold:1000, xp:2, rareGear:true, resNext:'fireResistPct', tome:true,
    offer:'"The ground shakes at night. Something is stirring deep beneath the Mountain Pass -- take the southern road down, past the Ember Caverns. Bring me proof of what you find."',
    remind:'"Down the Mountain Pass’ southern road, past the Ember Caverns. Deeper than that."',
    done:'"You brought down the Molten Colossus?! A fragment of its shell... Take these -- you have more than earned them."' },
];
const HUNT_TROPHY = {
  hunt_leviathan:['leviathan_scale', makeLeviathanScaleItem], hunt_mastodon:['mastodon_hoof', makeMastodonHoofItem],
  hunt_kraken:['electric_tentacle', makeElectricTentacleItem], hunt_colossus:['molten_shell', makeMoltenShellItem],
};
const HUNT_PART_FLAG = {hunt_kraken:'partKraken', hunt_colossus:'partThunder'};
function hunterCurrent(p){
  for(const def of HUNTER_QUESTS){ const q = getQuest(p, def.Q.id); if(q && q.status==='active') return {def, q}; }
  for(const def of HUNTER_QUESTS){ if(!getQuest(p, def.Q.id)){ if(def.Q.id!=='hunt_minotaur' && !p.krakenSlain) return null; return {def, q:null}; } }
  return null;
}
// '!' over the Hunter whenever he has something to offer or pay out
function hunterHasMark(p){
  const cur = hunterCurrent(p);
  if(cur && (!cur.q || cur.q.killed)) return true;
  try{ if(gojiraChainStage(p)) return true; }catch(_){}
  return false;
}
function startWitchQuest(p){
  if(p.witchRescued){ ensureHeartstoneQuest(p); return; }
  if(!getQuest(p, 'witch_find')){
    addQuestOnce(p, 'witch_find', 'The Witch of the Black Marsh', 'Find the witch at her cauldron, near the Black Marsh entrance.', 1);
    showMsg('New quest: The Witch of the Black Marsh', 3.0);
  }
}
function hasQItem(p, id){ return (p.inventory||[]).some(it=>it && it.questId===id); }
function ensureHeartstoneQuest(p){
  if(p.witchRescued && !p.heartstoneDone && hasQItem(p,'minotaur_heartstone') && !getQuest(p,'witch_heartstone')){
    addQuestOnce(p, 'witch_heartstone', "The Witch's Appraisal", 'Show the Heartstone to the witch at her cauldron.', 1);
    showMsg('New quest: The Witch\u2019s Appraisal', 3.0);
  }
}
// (v147) Boss trophies: one single-unit quest item each (kept for later quests).
function makeMastodonHoofItem(){
  return { id:'it'+Math.random().toString(36).slice(2,9), slotType:'questitem', rarity:'rare',
    name:"Mastodon's Hoof", affixes:[], color:'#cfe6ff', questId:'mastodon_hoof', unsellable:true,
    questDesc:'A massive, frost-rimed hoof torn from the Woolly Mastodon. Quest item -- cannot be sold.' };
}
function makeElectricTentacleItem(){
  return { id:'it'+Math.random().toString(36).slice(2,9), slotType:'questitem', rarity:'rare',
    name:'Electric Tentacle', affixes:[], color:'#7fb8ff', questId:'electric_tentacle', unsellable:true,
    questDesc:'A severed tentacle that still crackles with blue sparks. Quest item -- cannot be sold.' };
}
function makeLeviathanScaleItem(){
  return { id:'it'+Math.random().toString(36).slice(2,9), slotType:'questitem', rarity:'rare',
    name:"Leviathan's Scale", affixes:[], color:'#3fd6b0', questId:'leviathan_scale', unsellable:true,
    questDesc:'A dinner-plate-sized scale that still glistens with lake water. Quest item -- cannot be sold.' };
}
function partFlagSet(p, qid){ return !!(qid==='leviathan_scale' ? p.partLeviathan : qid==='mastodon_hoof' ? p.partMastodon : qid==='molten_shell' ? p.partThunder : qid==='electric_tentacle' ? p.partKraken : false); }
function setPartFlag(p, qid){ if(qid==='leviathan_scale') p.partLeviathan = true; else if(qid==='mastodon_hoof') p.partMastodon = true; else if(qid==='molten_shell') p.partThunder = true; else if(qid==='electric_tentacle') p.partKraken = true; }
function grantBossTrophy(qid, mk){
  const p = game.player;
  if(p.witchBrewed) return;
  if(partFlagSet(p, qid) && !(p.inventory||[]).some(it=>it && it.questId===qid)) return;   // v489: a boss trophy never drops twice (a rare drops instead)
  setPartFlag(p, qid);
  if((p.inventory||[]).some(it=>it && it.questId===qid)) { updatePartsQuest(p); return; }
  forceAddToBag(p, mk());
  setPartFlag(p, qid);
  updatePartsQuest(p);
  showMsg('Obtained: '+(qid==='mastodon_hoof' ? "Mastodon's Hoof" : qid==='molten_shell' ? 'Molten Shell Fragment' : qid==='electric_tentacle' ? 'Electric Tentacle' : "Leviathan's Scale"), 2.6);
}
// (v149) The Witch questline. Scale pickup starts 'show the Hunter'; the Hunter points you to the
// Black Marsh witch; her cauldron reveals she is missing; the Forgotten Tower holds her captive.
const npcOverlay = document.getElementById('npcOverlay');
let npcDialogCb = null;
function showNpcText(title, text, btnLabel, cb){
  document.getElementById('npcTitle').textContent = title;
  document.getElementById('npcText').textContent = text;
  document.getElementById('npcBtn').textContent = btnLabel || 'Continue';
  npcDialogCb = cb || null;
  game.modalOpen = true;
  npcOverlay.style.display = 'flex';
}
function closeNpcText(run){
  npcOverlay.style.display = 'none';
  game.modalOpen = false;
  const cb = npcDialogCb; npcDialogCb = null;
  if(run && cb) cb();
}
document.getElementById('npcClose').addEventListener('click', ()=>closeNpcText(false));
document.getElementById('npcBtn').addEventListener('click', ()=>closeNpcText(true));
function addQuestOnce(p, id, name, desc, total){
  if(!p.quests) p.quests = [];
  let q = getQuest(p, id);
  if(!q){ q = {id, name, desc, status:'active', progress:0, total:total||1}; p.quests.push(q); }
  return q;
}
// Monster parts for the witch's recipe: 4 in total. Leviathan's Scale and Mastodon's Hoof are 1 each.
const WITCH_PARTS_TOTAL = 4;
const WITCH_RECIPE_DESC = 'The witch could brew a special potion from the rarest parts of the great beasts. Hunt them down and bring her what you find.';
function witchPartsHeld(p){ return (p.partLeviathan?1:0) + (p.partMastodon?1:0) + (p.partThunder?1:0) + (p.partKraken?1:0); }
function updatePartsQuest(p){
  const q = getQuest(p, 'witch_parts');
  if(!q) return;
  q.total = WITCH_PARTS_TOTAL; q.progress = Math.min(WITCH_PARTS_TOTAL, witchPartsHeld(p));
  if(q.status==='active' && /Electric Tentacle|you have it/.test(q.desc||'')) q.desc = WITCH_RECIPE_DESC;   // v456: no part list in the log
}
// (moved here from zones/raptor-lair.js: it is needed while this file loads)
function makeMoltenShellItem(){
  return { id:'it'+Math.random().toString(36).slice(2,9), slotType:'questitem', rarity:'rare',
    name:'Molten Shell Fragment', affixes:[], color:'#ff7a2a', questId:'molten_shell', unsellable:true,
    questDesc:'A jagged shard of the Molten Colossus\' shell, still glowing with ember-red cracks. Quest item -- cannot be sold.' };
}
