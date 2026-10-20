// ---------------- Minotaur Cave (v233) ----------------
function enterMinotaurCave(){
  const g = game;
  g.scene = 'minotaurcave';
  g.depth = 7;   // v483: was 6
  { // v274: the lair is now a maze of bone halls (same generator as the Ancient Ruins), guarded by skeletons
    const R = makeAncientRuinsFloor(ANCIENT_RUINS_FLOORS, {N:10});
    R.stairsDown = null; R.chestSpot = null; R.waypoint = null; R.kind = 'minotaur';
    R.entranceSpawn = {x:R.entrance.x, y:R.entrance.y, r:30};
    g.room = R;
  }
  g.player.x = g.room.entranceSpawn.x + 34; g.player.y = g.room.entranceSpawn.y - 46;
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null; g.bossKilled=false;
  showMsg('The Minotaur Cave', 1.4);
  spawnMinotaurCaveWave(g);
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}
function spawnMinotaurCaveWave(g){
  const guardRoom = g.room.exitRoom;
  for(let i=0;i<3;i++){
    spawnEnemy(g, 'skeletonbrute', {x:rand(guardRoom.x+60,guardRoom.x+guardRoom.w-60), y:rand(guardRoom.y+60,guardRoom.y+guardRoom.h-60)});
  }
  const bossPos = {x:guardRoom.x+guardRoom.w/2, y:guardRoom.y+guardRoom.h/2};
  const boss = spawnEnemy(g, 'bear', bossPos);
  boss.minotaur = true; boss.isLairBoss = true; boss.bossName = 'The Minotaur';
  boss.r = Math.round(boss.r*1.5); boss.baseR = boss.r;
  boss.hp = Math.round(boss.hp*4.2); boss.maxHp = boss.hp;
  boss.dmg *= 1.5; boss.armor = Math.min(boss.armor||0, 6);
  boss.speed *= 1.05;
  // packs of skeletons through the maze (area level scales with the lair's depth)
  const types = RUINS_MONSTERS_BY_FLOOR[1];
  for(let i=0;i<30;i++){
    const type = types[Math.floor(Math.random()*types.length)];
    const lead = spawnEnemy(g, type);
    const n = 2 + Math.floor(Math.random()*3);
    for(let k=1;k<n;k++){ const a = Math.random()*Math.PI*2, d = 28 + Math.random()*32; spawnEnemy(g, type, {x:lead.x+Math.cos(a)*d, y:lead.y+Math.sin(a)*d}); }
  }
  showMsg('A horned beast bellows in the dark...', 1.8);
}
// Minotaur chest: 1 rare weapon for the player's class + 1 magic ring or amulet.
function makeMinotaurHeartstoneItem(){
  return { id:'it'+Math.random().toString(36).slice(2,9), slotType:'questitem', rarity:'rare',
    name:"Minotaur Heartstone", affixes:[], color:'#e0504a', questId:'minotaur_heartstone', unsellable:true,
    questDesc:'A dark red stone that beats faintly, like a second heart, cut from the Minotaur. Quest item -- cannot be sold.' };
}
function openMinotaurChest(g){
  const p = g.player;
  if(!p.heartstoneTaken && !(p.inventory||[]).some(it=>it && it.questId==='minotaur_heartstone')){
    p.heartstoneTaken = true; forceAddToBag(p, makeMinotaurHeartstoneItem());
    showMsg('Obtained: Minotaur Heartstone', 2.6, '#ff8a7a');
    try{ ensureHeartstoneQuest(p); }catch(_){}
  }
  const cat = p.cls==='ranger' ? 'bow' : p.cls==='mystic' ? 'staff' : 'weapon1h';
  const wpn = generateItem(Math.max(1,p.level||1), 'reward', cat, null, p);
  const jewel = generateItem(Math.max(1,p.level||1), 'magic', Math.random()<0.5 ? 'ring' : 'amulet', null, p);
  let eqW = false;
  forceAddToBag(p, wpn); eqW = tryAutoEquip(p, wpn);
  forceAddToBag(p, jewel); const eqJ = tryAutoEquip(p, jewel);
  showMsg('Minotaur’s Hoard: '+wpn.name+' + '+jewel.name, 3.2);
  bagPulse(); saveGame();
}

