// ---------------- River Valley (v233) ----------------
// New early-game region between the Dark Forest and the Withered Crossroads. A river born at a waterfall
// under the west cliffs flows east across the middle of the map, widening into the plains. The road
// runs from the Forest (north gate) south across an old plank bridge into the Withered Crossroads (south
// gate). Bandits hold the bridge (clear the camp = "Clear the Old Bridge"). Forest thins to meadow
// from north to south. The Minotaur Cave is tucked into the north-east corner.
const RV_W = 4400, RV_H = 3600, RV_CY = 1800, RV_BX = 2200;
const RV_SLICE = 40, RV_BRIDGE_HW = 80, RV_CLIFF_W = 280, RV_ROAD_HW = 46, RV_CLIFF_H = 120;
const RV_CAMP_TOTAL = 13, RV_PACK_COUNT = 34;
function rvRiverY(x){ return RV_CY + 170*Math.sin((x-RV_BX)/640) + 60*Math.sin((x-RV_BX)/210); }
function rvRiverHW(x){ const t = clamp((x-RV_CLIFF_W)/(RV_W-RV_CLIFF_W),0,1); return 62 + 150*Math.pow(t,1.15); }
function rvWaterAt(x,y){
  const cx = Math.floor(x/RV_SLICE)*RV_SLICE + RV_SLICE/2;
  if(cx < RV_CLIFF_W || Math.abs(cx-RV_BX) < RV_BRIDGE_HW) return false;
  return Math.abs(y - rvRiverY(cx)) < rvRiverHW(cx);
}
function rvWaterRects(){
  const out = [];
  for(let x0=Math.ceil(RV_CLIFF_W/RV_SLICE)*RV_SLICE; x0<RV_W; x0+=RV_SLICE){
    const cx = x0+RV_SLICE/2; if(Math.abs(cx-RV_BX) < RV_BRIDGE_HW) continue;
    const c = rvRiverY(cx), hw = rvRiverHW(cx);
    out.push({x:x0, y:c-hw, w:RV_SLICE, h:2*hw, isWater:true});
  }
  return out;
}
function rvRoadX(y){
  const dy = Math.abs(y-RV_CY);
  const env = clamp(Math.min(y, RV_H-y)/500,0,1) * clamp(dy/380,0,1);
  return RV_BX + 170*Math.sin((y-RV_CY)/520)*env;
}
function rvOnRoad(x,y,m){ return Math.abs(x-rvRoadX(y)) < RV_ROAD_HW+(m||0); }
function rvBlend(y){ const t = clamp((y-(RV_CY-900))/1700,0,1); return t*t*(3-2*t); }   // 0 = forest floor, 1 = open plains
function rvWaterNear(x,y,m){
  for(const d of [[0,0],[m,0],[-m,0],[0,m],[0,-m],[m,m],[-m,-m],[m,-m],[-m,m]]) if(rvWaterAt(x+d[0],y+d[1])) return true;
  return false;
}
function rvBridgeRect(){ const c = rvRiverY(RV_BX), hw = rvRiverHW(RV_BX); return {x:RV_BX-RV_BRIDGE_HW, y:c-hw-34, w:RV_BRIDGE_HW*2, h:hw*2+68}; }
function makeRiverValley(){
  const w = RV_W, h = RV_H;
  const northGate = {x:RV_BX, y:16, r:34}, southGate = {x:RV_BX, y:h-16, r:34};
  const caveGate = {x:w-380, y:440, r:34};
  const waypoint = {x:rvRoadX(760)+150, y:760, r:22};
  const bridge = rvBridgeRect();
  const bridgeC = {x:RV_BX, y:rvRiverY(RV_BX)};
  const obstacles = rvWaterRects();
  obstacles.push({x:-400, y:-400, w:400+RV_CLIFF_W, h:h+800, isCliff:true});
  const waterfall = {x:RV_CLIFF_W, y:rvRiverY(RV_CLIFF_W+20), hw:rvRiverHW(RV_CLIFF_W+20)};
  const gates = [northGate, southGate, caveGate, waypoint];
  const campZone = (x,y)=>Math.abs(y-bridgeC.y) < 640 && Math.abs(x-RV_BX) < 640;

  // ---- bandit camp around both ends of the bridge ----
  const campDecor = [];
  const nBank = bridgeC.y - rvRiverHW(RV_BX) - 70, sBank = bridgeC.y + rvRiverHW(RV_BX) + 70;
  const okCamp = (x,y,m)=>!rvWaterNear(x,y,m) && !rvOnRoad(x,y,m+8);
  const place = (x,y,m)=>{ for(let k=0;k<14;k++){ if(okCamp(x,y,m)) return {x,y}; y += (y<bridgeC.y ? -28 : 28); x += (x<RV_BX ? -10 : 10); } return {x,y}; };
  const tentSpots = [[-270,-70,1],[285,-140,-1],[-340,-250,1],[340,-300,-1],   // north bank
                     [-280,70,-1],[300,120,1],[-360,250,-1],[330,300,1]];    // south bank
  tentSpots.forEach(([dx,dy],i)=>{
    const north = i<4, y0 = (north ? nBank : sBank) + dy;
    const pt = place(rvRoadX(y0)+dx, y0, 80);
    obstacles.push({x:pt.x-34, y:pt.y-22, w:68, h:44, isProp:true, kind:'rvtent', dir:(dx<0?1:-1), tint:i%3});
  });
  [[-150,-40,0],[165,-90,1],[-170,70,0],[180,100,1]].forEach(([dx,dy],i)=>{
    const north = i<2, y0 = (north ? nBank : sBank) + dy;
    const pt = place(rvRoadX(y0)+dx, y0, 60);
    campDecor.push({k:'campfire', x:pt.x, y:pt.y});
  });
  for(let i=0;i<16;i++){
    const north = i<8, y0 = north ? nBank + rand(-320,20) : sBank + rand(-20,320);
    const x0 = rvRoadX(y0) + rand(-380,380);
    if(Math.abs(x0-RV_BX) < 120 && Math.abs(y0-bridgeC.y) < rvRiverHW(RV_BX)+80) continue;
    const pt = place(x0,y0,50);
    campDecor.push({k: i%3===0 ? 'crate' : 'barrel', x:pt.x, y:pt.y, s:rand(0.9,1.15)});
  }
  for(const [y0,sg] of [[nBank-200,-1],[sBank+200,1]]){
    for(const side of [-1,1]){
      campDecor.push({k:'banner', x:rvRoadX(y0)+side*(RV_ROAD_HW+26), y:y0});
      // a sharpened-stake barricade on each verge, the road itself left open
      const bx = rvRoadX(y0+sg*40) + (side<0 ? -(RV_ROAD_HW+10+110) : RV_ROAD_HW+10);
      obstacles.push({x:bx, y:y0+sg*40, w:110, h:22, isProp:true, kind:'rvbarricade'});
    }
  }
  const campAnchors = {
    north:{x:RV_BX-20, y:nBank-110},
    south:{x:RV_BX+20, y:sBank+110},
  };

  // ---- scenery ----
  const trees = [], rocks = [], grassTufts = [], decor = [];
  const tsz = ()=>rand(0.95,1.4);
  const nearObs = (x,y,m)=>obstacles.some(o=>o.isProp && x>o.x-m && x<o.x+o.w+m && y>o.y-m && y<o.y+o.h+m);
  // zone edge: dark treeline in the north, rocks in the open south, the east bank trees fade with the plains
  for(let x=RV_CLIFF_W+70; x<w-40; x+=70){
    if(Math.abs(x-northGate.x) > 80) trees.push({x, y:36, dark:true, s:tsz()});
    if(Math.abs(x-southGate.x) > 150) rocks.push({x, y:h-44, s:rand(0.8,1.4)});
  }
  for(let y=90; y<h-90; y+=80){
    if(rvWaterNear(w-40, y, 90)) continue;
    if(dist({x:w-36,y},caveGate) < 160) continue;
    if(rvBlend(y) < 0.5) trees.push({x:w-36, y, dark:rvBlend(y)<0.3, s:tsz()});
    else rocks.push({x:w-44, y, s:rand(0.8,1.3)});
  }
  const gapOk = (x,y,m)=>!rvWaterNear(x,y,m) && !rvOnRoad(x,y,m) && gates.every(gt=>dist({x,y},gt)>(gt===caveGate?330:150)) && !campZone(x,y) && x>RV_CLIFF_W+70 && !nearObs(x,y,30);
  // collidable big props: big trees/logs in the north, boulders scattered
  const boxOk = (x,y,ww,hh,m)=>[[x,y],[x+ww,y],[x,y+hh],[x+ww,y+hh],[x+ww/2,y+hh/2]].every(pt=>gapOk(pt[0],pt[1],m));
  for(let i=0,n=0;i<900 && n<26;i++){
    const x=rand(RV_CLIFF_W+120,w-160), y=rand(140,RV_CY-250);
    if(Math.random() > (1-rvBlend(y))) continue;
    if(boxOk(x-16,y-16,32,32,60)){ obstacles.push({x:x-16,y:y-16,w:32,h:32,isProp:true,kind:'bigtree',s:rand(0.95,1.35)}); n++; }
  }
  for(let i=0,n=0;i<500 && n<16;i++){
    const len=rand(120,200), horiz=Math.random()<0.5, x=rand(RV_CLIFF_W+120,w-300), y=rand(140,h-300);
    if(Math.random() > (1-rvBlend(y))*0.9+0.08) continue;
    if(boxOk(x,y,horiz?len:26,horiz?26:len,50)){ obstacles.push({x,y,w:horiz?len:26,h:horiz?26:len,isProp:true,kind:'log',seed:Math.random()}); n++; }
  }
  for(let i=0,n=0;i<600 && n<18;i++){
    const x=rand(RV_CLIFF_W+140,w-200), y=rand(200,h-200);
    if(boxOk(x,y,46,38,60)){ obstacles.push({x,y,w:46,h:38,isProp:true,kind:'boulder',s:rand(0.85,1.25)}); n++; }
  }
  // walk-through trees: dense + dark in the north, thinning to a few lone trees on the meadow
  for(let i=0;i<620;i++){
    const x=rand(RV_CLIFF_W+60,w-70), y=rand(70,h-90), bl=rvBlend(y);
    if(Math.random() > Math.max(0.05, (1-bl)*1.05)) continue;
    if(rvWaterNear(x,y,50) || rvOnRoad(x,y,55) || campZone(x,y) || nearObs(x,y,26)) continue;
    if(gates.some(gt=>dist({x,y},gt)<(gt===caveGate?300:110))) continue;
    trees.push({x, y, dark:bl<0.32, s:tsz()*(bl>0.6?0.92:1)});
  }
  const dOk = (x,y)=>!rvWaterNear(x,y,14) && !rvOnRoad(x,y,16) && !nearObs(x,y,10) && x>RV_CLIFF_W+30;
  for(let i=0;i<620;i++){ const x=rand(RV_CLIFF_W+40,w-60), y=rand(60,h-60), bl=rvBlend(y); if(Math.random()>(1-bl)*0.9) continue; if(dOk(x,y)) decor.push({k:'fern', x, y, s:rand(0.8,1.4), dark:bl<0.45}); }
  for(let i=0;i<120;i++){ const x=rand(RV_CLIFF_W+40,w-60), y=rand(60,RV_CY-200), bl=rvBlend(y); if(Math.random()>(1-bl)) continue; if(dOk(x,y)) decor.push({k:'mushroom', x, y, s:rand(0.8,1.3), glow:bl<0.25&&Math.random()<0.5, c:['#8a5aa8','#5a8aa8','#a85a5a'][i%3]}); }
  for(let i=0;i<40;i++){ const x=rand(RV_CLIFF_W+40,w-60), y=rand(60,RV_CY-150); if(dOk(x,y)) decor.push({k:'stump', x, y, s:rand(0.9,1.4)}); }
  const palettes = [['#f4d03a','#ffffff','#f49ac1'],['#7aa8ff','#ffffff','#c9a0ff'],['#ff7a5a','#ffd27a','#ffffff'],['#f49ac1','#ffffff','#ffd2e6']];
  for(let i=0;i<260;i++){ const x=rand(RV_CLIFF_W+40,w-60), y=rand(RV_CY-500,h-60), bl=rvBlend(y); if(Math.random()>bl) continue; if(dOk(x,y)) decor.push({k:'flowers', x, y, n:Math.floor(rand(6,13)), r:rand(28,58), cols:palettes[i%4]}); }
  for(let i=0;i<160;i++){ const x=rand(RV_CLIFF_W+40,w-60), y=rand(RV_CY-700,h-60), bl=rvBlend(y); if(Math.random()>bl*0.9+0.05) continue; if(dOk(x,y)) decor.push({k:'bush', x, y, s:rand(0.8,1.4), berries:Math.random()<0.4}); }
  for(let i=0;i<10;i++){ const x=rand(RV_CLIFF_W+60,w-80), y=rand(RV_CY+300,h-100); if(dOk(x,y) && !campZone(x,y)) decor.push({k:'cairn', x, y}); }
  for(let i=0;i<90;i++){ const x=rand(RV_CLIFF_W+40,w-60), y=rand(RV_CY-200,h-80), bl=rvBlend(y); if(Math.random()>bl) continue; if(dOk(x,y) && !campZone(x,y)) rocks.push({x, y, s:rand(0.6,1.2)}); }
  for(let i=0;i<300;i++){ const x=rand(RV_CLIFF_W+30,w-50), y=rand(50,h-50), bl=rvBlend(y); if(Math.random()>0.2+bl*0.8) continue; if(dOk(x,y)) grassTufts.push({x, y, s:rand(0.7,1.2)}); }
  // the river: lily pads, reeds on the banks, a little driftwood
  for(let i=0;i<260;i++){ const x=rand(RV_CLIFF_W+60,w), y=rand(1100,2500); if(rvWaterAt(x,y) && rvWaterAt(x+30,y) && rvWaterAt(x-30,y)) decor.push({k:'lily', x, y, s:rand(0.7,1.2), f:Math.random()<0.2}); }
  for(let i=0;i<500;i++){ const x=rand(RV_CLIFF_W+40,w-40), y=rand(1100,2500); if(!rvWaterAt(x,y) && !rvOnRoad(x,y,0) && !(Math.abs(x-RV_BX)<RV_BRIDGE_HW+30) && (rvWaterAt(x+44,y)||rvWaterAt(x-44,y)||rvWaterAt(x,y+44)||rvWaterAt(x,y-44))) decor.push({k:'reed', x, y, s:rand(0.8,1.3), c:rvBlend(y)<0.4?'#3f6a3a':'#6a8a3a'}); }
  for(let i=0;i<16;i++){ const x=rand(RV_CLIFF_W+60,w-40), y=rand(1100,2500); if(!rvWaterAt(x,y) && !rvOnRoad(x,y,0) && (rvWaterAt(x+50,y)||rvWaterAt(x,y+50)||rvWaterAt(x,y-50))) decor.push({k:'driftwood', x, y, r:rand(-0.4,0.4)}); }
  // boulders piled at the foot of the cliff (leaving the waterfall pool open)
  for(let y=120; y<h-100; y+=150){
    if(Math.abs(y-waterfall.y) < waterfall.hw+60) continue;
    rocks.push({x:RV_CLIFF_W+rand(18,70), y:y+rand(-30,30), s:rand(1.1,1.7)});
  }
  for(const d of campDecor) decor.push(d);

  // ---- pack anchors ----
  const packAnchors = [];
  for(let tries=0; packAnchors.length<70 && tries<8000; tries++){
    const x=rand(RV_CLIFF_W+140,w-140), y=rand(140,h-140);
    if(rvOnRoad(x,y,110) || rvWaterNear(x,y,90) || campZone(x,y)) continue;
    if(gates.some(gt=>dist({x,y},gt)<(gt===caveGate?340:260))) continue;
    if(nearObs(x,y,50)) continue;
    if(packAnchors.some(a=>dist(a,{x,y})<300)) continue;
    packAnchors.push({x,y});
  }
  return { w, h, obstacles, decor, trees, rocks, grassTufts, northGate, southGate, caveGate, waypoint, bridge, bridgeC, waterfall,
    campAnchors, packAnchors, waterAt:rvWaterAt };
}
const RV_NORTH_PACKS = [ {type:'wolf',countMin:2,countMax:4}, {type:'wolf',countMin:1,countMax:3}, {type:'spider',countMin:1,countMax:3}, {type:'boar',countMin:1,countMax:2} ];
const RV_SOUTH_PACKS = [ {type:'bandit',countMin:2,countMax:3}, {type:'banditarcher',countMin:1,countMax:2}, {type:'boar',countMin:1,countMax:3}, {type:'wolf',countMin:1,countMax:3} ];
function spawnRiverValleyPack(g, anchor){
  const pool = anchor.y < RV_CY ? RV_NORTH_PACKS : RV_SOUTH_PACKS;
  const t = pool[Math.floor(Math.random()*pool.length)];
  const n = forestPackSize(t), spread = 90 + n*16;
  for(let i=0;i<n;i++){
    for(let k=0;k<8;k++){
      const x = anchor.x+rand(-spread,spread), y = anchor.y+rand(-spread,spread);
      if(!rvWaterNear(x,y,24)){ spawnEnemy(g, t.type, {x,y}); break; }
    }
  }
}
// ---- The Old Bridge quest ----
const QUEST_BRIDGE = {
  id:'river_bridge', name:'Clear the Old Bridge',
  desc:"Bandits have seized the old bridge in the River Valley, south of the Dark Forest -- the only road to the Withered Crossroads. Clear out their camp.",
  descDone:"The bandits are driven off and the old bridge is open again. Return to the Old Man for your reward.",
  total:RV_CAMP_TOTAL,
};
function bridgeCampKilled(e){
  const p = game.player;
  if(p.bridgeCleared) return;
  if(!p.quests) p.quests = [];
  let q = getQuest(p, QUEST_BRIDGE.id);
  if(!q){
    q = {id:QUEST_BRIDGE.id, name:QUEST_BRIDGE.name, desc:QUEST_BRIDGE.desc, status:'active', progress:0, total:QUEST_BRIDGE.total};
    p.quests.push(q);
    showMsg('Quest started: '+QUEST_BRIDGE.name, 2.0);
  }
  if(q.status!=='active') return;
  if(e && e.campChief) p.bridgeChiefDead = true;
  q.progress = Math.min(q.total, q.progress+1);
  if(q.progress>=q.total) completeBridgeQuest(q);
  else showMsg('Bandit camp: '+q.progress+'/'+q.total, 1.6);
  updateQuestBadge(); saveGame();
}
function completeBridgeQuest(q){
  const g = game, p = g.player;
  p.bridgeCleared = true;
  q.status = 'complete'; q.progress = q.total; q.desc = QUEST_BRIDGE.descDone; q.rewarded = false;   // v239: the reward is handed over by the Old Man
  showMsg('The old bridge is clear \u2014 return to the Old Man in Mistfall.', 3.4);
  updateQuestBadge(); saveGame();
}
// v239: turn-in at the Old Man: a Health Potion + XP that grows the further below the River Valley's
// level band (top = level 7) you are, so an under-levelled character can catch up before Withered Crossroads.
function grantBridgeReward(p, q){
  const bi = classRewardItem(p, Math.max(p.level||1, 6), 'magic');
  if(!giveRewardIfRoom(p, [bi])) return;   // v493: the Old Man offers it again once there is room
  q.rewarded = true;
  const gap = Math.max(0, 7 - (p.level||1)), mult = Math.min(1.6, 0.25 + 0.3*gap);
  const xp = Math.round((p.xpNext||100)*mult);
  p.gold += 80; bagPulse();
  gainXp(game, xp);
  showMsg('"You cleared the bridge! Take this for the road." '+bi.name+' + 80 gold, +'+xp+' XP', 3.6);
  updateQuestBadge(); saveGame();
}
function spawnRiverValleyCamp(g){
  const p = g.player, rv = g.rv;
  if(p.bridgeCleared) return;
  const q = getQuest(p, QUEST_BRIDGE.id);
  if(q && q.status==='complete') return;
  let remaining = q ? q.total - q.progress : RV_CAMP_TOTAL;
  // fixed roster: chief first, then brutes, archers, bandits -- split between the two banks
  const roster = [];
  if(!p.bridgeChiefDead) roster.push('chief');
  roster.push('banditbrute','banditbrute','banditarcher','banditarcher','banditarcher','banditarcher','bandit','bandit','bandit','bandit','bandit','bandit');
  const list = roster.slice(0, Math.max(0, remaining));
  list.forEach((kind,i)=>{
    const north = (kind==='chief') ? true : (i%2===0);
    const a = north ? rv.campAnchors.north : rv.campAnchors.south;
    let pos = null;
    for(let k=0;k<20 && !pos;k++){
      const x = a.x+rand(-300,300), y = a.y+rand(-150,150);
      if(!rvWaterNear(x,y,30) && !rv.obstacles.some(o=>!o.isWater && x>o.x-14 && x<o.x+o.w+14 && y>o.y-14 && y<o.y+o.h+14)) pos = {x,y};
    }
    if(!pos) pos = {x:a.x, y:a.y};
    const e = spawnEnemy(g, kind==='chief' ? 'banditbrute' : kind, pos);
    if(!e) return;
    e.campEnemy = true; e.aggroRange = Math.round(300*0.72); e.wanderRadius = 40;
    if(kind==='chief'){
      e.campChief = true; e.bossName = 'Bandit Chief';
      e.r = Math.round(e.r*1.25); e.hp = Math.round(e.hp*2.4); e.maxHp = e.hp; e.dmg *= 1.3;
      e.baseR = e.r;
    }
  });
}
function enterRiverValley(from){
  const g = game;
  g.scene = 'rivervalley';
  g.rv = makeRiverValley();
  g.room = g.rv;
  g.depth = 6;   // v483: was 5
  const rv = g.rv;
  if(from==='sunlitplains'){ g.player.x = rv.southGate.x; g.player.y = rv.southGate.y - 120; }
  else if(from==='minotaurcave'){ g.player.x = rv.caveGate.x - 20; g.player.y = rv.caveGate.y + 110; }
  else if(from==='waypoint'){ g.player.x = rv.waypoint.x; g.player.y = rv.waypoint.y + 40; }
  else { g.player.x = rv.northGate.x; g.player.y = rv.northGate.y + 120; }
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  showMsg('The River Valley', 1.4);
  const anchors = shuffle(breatheAnchors(rv.packAnchors, {gap:380}));
  for(let i=0;i<Math.min(RV_PACK_COUNT, anchors.length);i++) spawnRiverValleyPack(g, anchors[i]);
  spawnRiverValleyCamp(g);
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}

