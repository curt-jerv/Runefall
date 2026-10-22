// ---------------- Road encounters (v529) ----------------
// At most ONE of these per visit to the Withered Crossroads, River Valley or Lakeside Ruins (caches and shrines are
// separate and can still appear):
//   caravan  -- an abandoned caravan by the road; searching it raises the dead around it, or bandits close in from
//               off-screen. When they are all dead a chest appears at the wagon.            (Crossroads, River Valley)
//   scarecrow-- a scarecrow standing in a field; touch it and it walks -- a mini boss. Chest when it falls. (Crossroads)
//   herd     -- a feral herd of rams led by a Black Ram (a rare + a Beast Horn when he dies).     (Crossroads)
//   cellar   -- an old worn house with a cellar door: a small cellar of skeletons and zombies, chest when cleared. (Crossroads)
//   carrion  -- a dead horse and a broken wagon on the road, vultures feasting. Kill them all for a rare. (all three)
//   merchant -- Orrin Thistlewick, a wandering peddler with a cart, selling good rares. Very rare.       (all three)
// The encounter lives in g.roadEv (g.roadEvRoom = the room it belongs to). roadEvRoll runs after a zone's monsters spawn.
const ROAD_EV_ZONES = {
  sunlitplains: { chance:0.8,  kinds:{caravan:3, scarecrow:2, herd:2, cellar:2, carrion:2} },
  rivervalley:  { chance:0.6,  kinds:{caravan:3, carrion:2} },
  lakesideruins:{ chance:0.4,  kinds:{carrion:1} },
};
const ROAD_MERCHANT_CHANCE = 0.035;
const ROAD_MERCHANT_NAME = 'Orrin Thistlewick';
const ROAD_EV_LABELS = {roadCaravan:'Search the Caravan', roadScarecrow:'Touch the Scarecrow', roadMerchant:'Talk to '+ROAD_MERCHANT_NAME, roadCellar:'Open the Cellar Door', cellarExit:'Climb Out'};
const ROAD_EV_ICONS = {roadCaravan:'\u{1F50D}', roadScarecrow:'✋', roadMerchant:'\u{1F4B0}', roadCellar:'\u{1F6AA}', cellarExit:'\u{1FA9C}'};
function roadEvLabels(){ if(typeof INTERACT_LABELS!=='undefined' && !INTERACT_LABELS.roadCaravan){ Object.assign(INTERACT_LABELS, ROAD_EV_LABELS); Object.assign(INTERACT_ICONS, ROAD_EV_ICONS); } }

// ---- where things go ----
function roadEvRoadDist(g, x, y){
  if(g.scene==='sunlitplains') return sunRoadNear(g.room, x, y).d;
  if(g.scene==='rivervalley') return rvRoadDist(x, y);
  if(g.scene==='lakesideruins') return Math.abs(y-LAKE_CY);
  return 1e9;
}
function roadEvSpotOk(g, x, y, r){
  const room = g.room;
  if(x < 200 || y < 200 || x > room.w-200 || y > room.h-200) return false;
  if(posBlockedByObstacles(x, y, r, room.obstacles)) return false;
  if(g.scene==='rivervalley' && (rvWaterNear(x, y, r+60) || rvTrailDist(x, y) < r+60)) return false;
  if(g.scene==='lakesideruins' && (lakeWaterAt(x, y) || lakeWaterAt(x+r, y) || lakeWaterAt(x-r, y) || lakeWaterAt(x, y+r) || lakeWaterAt(x, y-r) || lakeOnIsland(x, y))) return false;
  for(const q of spawnSafePoints(g)) if(Math.hypot(x-q.x, y-q.y) < 520 + r) return false;
  if(g.owPoi) for(const c of g.owPoi) if(dist({x,y}, c) < 400) return false;
  return true;
}
// a spot just off the road (the road itself stays clear)
function roadEvRoadSpot(g, r){
  for(let t=0; t<400; t++){
    let q = null;
    if(g.scene==='sunlitplains'){ const rd = g.room.roads[Math.floor(Math.random()*g.room.roads.length)]; q = rd[Math.floor(rand(0.3, 0.85)*rd.length)]; }
    else if(g.scene==='rivervalley'){ q = rvRoadPt(rand(0.06, 0.94)); if(Math.abs(q.y-RV_CY) < 800) continue; }
    else if(g.scene==='lakesideruins'){ const west = Math.random()<0.6; q = {x: west ? rand(500, LAKE_WATER_X-250) : rand(LAKE_WATER_X+LAKE_WATER_W+250, LAKE_W-500), y:LAKE_CY}; }
    if(!q) return null;
    const a = Math.random()*Math.PI*2, off = 60 + r + rand(10, 50);
    const x = q.x + Math.cos(a)*off, y = q.y + Math.sin(a)*off;
    if(roadEvRoadDist(g, x, y) < 50 + r*0.7) continue;
    if(!roadEvSpotOk(g, x, y, r)) continue;
    return {x, y, road:{x:q.x, y:q.y}};
  }
  return null;
}
// a spot out in one of the Crossroads' four quadrants, well away from every road
function roadEvFieldSpot(g, r){
  const qx = Math.random()<0.5 ? 0 : 1, qy = Math.random()<0.5 ? 0 : 1, room = g.room;
  for(let t=0; t<500; t++){
    const x = rand(qx ? SUN_CX+250 : 300, qx ? room.w-300 : SUN_CX-250), y = rand(qy ? SUN_CY+250 : 300, qy ? room.h-300 : SUN_CY-250);
    if(roadEvRoadDist(g, x, y) < 260 + r) continue;
    if(!roadEvSpotOk(g, x, y, r)) continue;
    return {x, y};
  }
  return null;
}
function roadEvClearAround(g, s, R){ g.enemies = g.enemies.filter(e=>e.roadEv || spawnSafeKeep(e) || Math.hypot(e.x-s.x, e.y-s.y) > R); }

// ---- the roll ----
function roadEvRoll(g){
  g.roadEv = null; g.roadEvRoom = g.room;
  const cfg = ROAD_EV_ZONES[g.scene]; if(!cfg || !g.room) return;
  let kind = null;
  if(Math.random() < ROAD_MERCHANT_CHANCE) kind = 'merchant';
  else if(Math.random() < cfg.chance){
    const ks = Object.keys(cfg.kinds), tot = ks.reduce((a,k)=>a+cfg.kinds[k], 0);
    let r = Math.random()*tot; for(const k of ks){ r -= cfg.kinds[k]; if(r <= 0){ kind = k; break; } }
  }
  if(window.__roadEvForce) kind = window.__roadEvForce;
  if(!kind) return;
  const field = kind==='scarecrow' || kind==='herd' || kind==='cellar';
  const s = field ? roadEvFieldSpot(g, kind==='cellar' ? 130 : 90) : roadEvRoadSpot(g, kind==='merchant' ? 70 : 80);
  if(!s) return;
  const ev = {kind, x:s.x, y:s.y, road:s.road||null, state:'idle', mobs:[], seed:Math.random()};
  if(s.road){ ev.flip = s.x < s.road.x; }
  roadEvClearAround(g, ev, kind==='herd' ? 700 : 520);
  if(kind==='caravan'){ ev.wagon = {x:ev.x-50, y:ev.y-28, w:100, h:56}; }
  else if(kind==='scarecrow'){ ev.r = 26; }
  else if(kind==='cellar'){ ev.house = {x:ev.x-80, y:ev.y-70, w:160, h:120}; ev.door = {x:ev.x+10, y:ev.y+92, r:30}; }
  else if(kind==='carrion'){
    ev.wagon = {x:ev.x+40, y:ev.y-60, w:90, h:50};
    const n = 5 + Math.floor(Math.random()*3);
    for(let i=0;i<n;i++){ const a = i/n*6.283, e = spawnEnemy(g, 'vulture', {x:ev.x+Math.cos(a)*70, y:ev.y+Math.sin(a)*50}); if(e){ e.roadEv = true; e.homeX = ev.x; e.homeY = ev.y; e.wanderRadius = 70; e.aggroRange = 230; ev.mobs.push(e); } }
  } else if(kind==='herd'){
    const n = 5 + Math.floor(Math.random()*2);
    for(let i=0;i<=n;i++){
      const a = i/(n+1)*6.283 + Math.random()*0.4, black = i===0;
      const e = spawnEnemy(g, 'ram', {x:ev.x+(black ? 0 : Math.cos(a)*rand(110,190)), y:ev.y+(black ? 0 : Math.sin(a)*rand(90,150))}); if(!e) continue;
      // tuned for the Crossroads: ordinary rams soften to about a bandit brute, the Black Ram is a clear step up
      e.maxHp = e.hp = Math.round(e.maxHp*(black ? 0.95 : 0.5)); e.dmg *= black ? 0.95 : 0.7; e.armor = black ? 8 : 5;
      e.roadEv = true; e.feral = true; e.aggroRange = 210; e.leashRange = 620; e.wanderRadius = 120; e.homeX = e.x; e.homeY = e.y;
      if(black){ e.blackRam = true; e.r = Math.round(e.r*1.18); e.speed *= 1.08; e.name = 'Black Ram'; ev.boss = e; }
      ev.mobs.push(e);
    }
  } else if(kind==='merchant'){
    const lvl = Math.max(g.player.level, g.depth) + 3, cats = ['helm','armor','gloves','boots','belt','ring','amulet','weapon1h','weapon2h','shield','bow','staff'];
    ev.stock = [];
    for(let i=0;i<6;i++){
      // the best of three rolls, so his wares are reliably good
      let best = null;
      for(let k=0;k<3;k++){ const it = generateItem(lvl, 'rare', i<2 ? null : cats[Math.floor(Math.random()*cats.length)], null, g.player); if(!best || (it.affixes||[]).length > (best.affixes||[]).length) best = it; }
      best.fixedPrice = Math.round((1200 + lvl*60)*rand(0.9, 1.2)/10)*10;   // dearer than the smith, cheaper than gambling blind
      ev.stock.push(best);
    }
    ev.npc = {x:ev.x, y:ev.y, id:31, robe:'#5a4a7a', hood:'#3a2e52', long:true, tool:'lantern'};
    ev.cart = {x:ev.x+70, y:ev.y-50};
  }
  g.roadEv = ev;
}

// ---- interaction ----
function roadEvKind(g){
  roadEvLabels();
  const ev = g.roadEv, p = g.player;
  if(g.scene==='lighthouse' && g.tower && g.tower.subzone==='cellar') return dist(p, g.tower.entrance) < g.tower.entrance.r + p.r + 22 ? 'cellarExit' : null;
  if(!ev || g.roadEvRoom!==g.room) return null;
  const near = (o, r)=>Math.hypot(p.x-o.x, p.y-o.y) < r + p.r;
  if(ev.kind==='caravan' && ev.state==='idle' && near(ev, 90)) return 'roadCaravan';
  if(ev.kind==='scarecrow' && ev.state==='idle' && near(ev, 70)) return 'roadScarecrow';
  if(ev.kind==='merchant' && near(ev, 70)) return 'roadMerchant';
  if(ev.kind==='cellar' && ev.state!=='done' && near(ev.door, 50)) return 'roadCellar';
  return null;
}
function roadEvInteract(kind){
  const g = game, ev = g.roadEv, p = g.player;
  if(kind==='cellarExit'){ roadCellarExit(); return; }
  if(!ev) return;
  if(kind==='roadCaravan' && ev.state==='idle'){
    ev.state = 'fight';
    if(Math.random() < 0.5){
      ev.wave = 'undead';
      showMsg('The ground splits open around the caravan -- the dead rise!', 2.6, '#c8b8ff');
      const n = 7 + Math.floor(Math.random()*3);
      for(let i=0;i<n;i++){
        const a = i/n*6.283 + Math.random()*0.5, r = rand(150, 260);
        let x = ev.x+Math.cos(a)*r, y = ev.y+Math.sin(a)*r*0.8;
        if(posBlockedByObstacles(x, y, 18, g.room.obstacles)){ x = ev.x+Math.cos(a)*120; y = ev.y+Math.sin(a)*100; }
        const type = i===0 ? 'skeletonbrute' : i%3===1 ? 'skeletonarcher' : i%2 ? 'zombie' : 'skeleton';
        const e = spawnEnemy(g, type, {x, y}); if(!e) continue;
        e.roadEv = true; e.aggroed = true; e.aggroRange = 900; e.leashRange = 1400; e.stunT = 0.9;   // a moment to claw out of the earth
        ev.mobs.push(e);
        g.particles.push({type:'burst', x, y, t:0.6, max:0.6, color:'#6a5a40'});
      }
    } else {
      ev.wave = 'bandits';
      showMsg('"That cargo is ours!" -- bandits close in from every side!', 2.6, '#ffb07a');
      const n = 6 + Math.floor(Math.random()*3);
      for(let i=0;i<n;i++){
        const a = i/n*6.283 + Math.random()*0.4;
        let s = null;
        for(let k=0;k<30 && !s;k++){ const r = rand(620, 820), x = p.x+Math.cos(a+k*0.2)*r, y = p.y+Math.sin(a+k*0.2)*r; if(x>80 && y>80 && x<g.room.w-80 && y<g.room.h-80 && !posBlockedByObstacles(x, y, 18, g.room.obstacles) && !(g.scene==='rivervalley' && rvWaterAt(x,y))) s = {x, y}; }
        if(!s) s = {x:ev.x+Math.cos(a)*300, y:ev.y+Math.sin(a)*300};
        const type = i===0 ? 'banditbrute' : i%3===1 ? 'banditarcher' : 'bandit';
        const e = spawnEnemy(g, type, s); if(!e) continue;
        e.roadEv = true; e.aggroed = true; e.aggroRange = 1500; e.leashRange = 2200;
        ev.mobs.push(e);
      }
    }
    try{ sfxPlay('banner', 0.7); }catch(e){}
  } else if(kind==='roadScarecrow' && ev.state==='idle'){
    ev.state = 'fight';
    const e = spawnEnemy(g, 'skeletonbrute', {x:ev.x, y:ev.y}); if(!e) return;
    makeElite(e, pickMods(2));
    e.eliteName = 'The Walking Scarecrow'; e.scarecrowBoss = true; e.roadEv = true;
    e.armor = 6; e.speed = 82; e.r = 24;
    e.aggroed = true; e.aggroRange = 900; e.leashRange = 1600; e.crowCd = 4; e.stunT = 1.0;
    ev.boss = e; ev.mobs.push(e);
    showMsg('Straw rustles... the scarecrow tears itself off its pole!', 2.6, '#e8c44a');
    g.particles.push({type:'ring', x:ev.x, y:ev.y, t:0.6, max:0.6, r:80, color:'#c9a050'});
    try{ sfxPlay('banner', 0.7); }catch(e){}
  } else if(kind==='roadMerchant'){
    showNpcText(ROAD_MERCHANT_NAME+', the Wandering Peddler', '"Ah, a traveller! Mind the cart -- the left wheel bites. I walk every road between here and the sea, and I only carry what\'s worth the weight. Have a look."', 'Browse wares', ()=>openShop('peddler'));
  } else if(kind==='roadCellar' && ev.state!=='done'){
    enterRoadCellar();
  }
}
// the scarecrow mini boss calls crows to its side every few seconds
function roadScarecrowTick(g, e, dt){
  if(!(e.hp>0) || !e.aggroed) return;
  e.crowCd -= dt;
  if(e.crowCd <= 0){
    e.crowCd = 7;
    const live = g.enemies.filter(x=>x.scareCrow && x.hp>0).length;
    for(let i=0;i<Math.min(2, 4-live);i++){
      const c = spawnEnemy(g, 'vulture', {x:e.x+rand(-40,40), y:e.y+rand(-40,40)}); if(!c) continue;
      c.scareCrow = true; c.roadEv = true; c.r = 10; c.maxHp = c.hp = Math.round(c.maxHp*0.55); c.dmg *= 0.6; c.aggroed = true; c.aggroRange = 900; c.noReward = true; c.name = 'Crow';
    }
    showMsg('Crows burst from the scarecrow\'s coat!', 1.6, '#c9a050');
  }
}
function roadEvKilled(g, e){
  const ev = g.roadEv;
  if(e.blackRam){
    const lvl = Math.max(1, monsterLevel(g));
    g.loot.push(fixLootSpot(g, {type:'item', x:e.x+rand(-20,20), y:e.y+rand(10,30), r:8, item:generateItem(lvl, 'rare', null, null, g.player)}));
    addPart(g.player, 'boartusk', 1); showPartToast('Harvested: '+PART_DEFS.boartusk.name+'  ('+partDesc('boartusk',1)+')', PART_DEFS.boartusk.color);
    showMsg('The Black Ram falls -- the herd scatters', 2.2, '#e8c44a');
    for(const x of g.enemies) if(x.feral && x!==e && x.hp>0){ x.aggroed = false; x.aggroRange = 1; }   // the rest lose their nerve
  }
  if(e.scarecrowBoss) for(const x of g.enemies) if(x.scareCrow && x.hp>0){ x.hp = 0; x.noReward = true; }
  if(ev && ev.kind==='carrion' && ev.mobs.includes(e)) ev.lastKill = {x:e.x, y:e.y};
}

// ---- every frame ----
function roadEvTick(g, p, dt){
  const ev = g.roadEv; if(!ev || g.roadEvRoom!==g.room) return;
  const allDown = ()=>ev.mobs.every(e=>!(e.hp>0) || !g.enemies.includes(e));
  if(ev.wagon) pushOutOfRect(p, ev.wagon);
  if(ev.house) pushOutOfRect(p, ev.house);
  if(ev.kind==='merchant' && Math.hypot(p.x-ev.cart.x, p.y-ev.cart.y) < 50+p.r){ const a = Math.atan2(p.y-ev.cart.y, p.x-ev.cart.x); p.x = ev.cart.x+Math.cos(a)*(50+p.r); p.y = ev.cart.y+Math.sin(a)*(50+p.r); }
  if(ev.boss && ev.boss.scarecrowBoss) roadScarecrowTick(g, ev.boss, dt);
  if((ev.kind==='caravan' || ev.kind==='scarecrow') && ev.state==='fight' && allDown()){
    ev.state = 'won';
    ev.chest = {x:ev.kind==='caravan' ? ev.x : ev.boss ? ev.boss.x : ev.x, y:(ev.kind==='caravan' ? ev.y+60 : (ev.boss ? ev.boss.y : ev.y)), r:24, opened:false};
    fixLootSpot(g, ev.chest);
    showMsg(ev.kind==='caravan' ? 'The road falls quiet. A strongbox lies in the wagon.' : 'The scarecrow collapses into straw -- something glints inside.', 2.6, '#e8c44a');
    g.particles.push({type:'ring', x:ev.chest.x, y:ev.chest.y, t:0.6, max:0.6, r:70, color:'#e8c44a'});
  }
  if(ev.kind==='carrion' && ev.state==='idle' && ev.mobs.length && allDown()){
    ev.state = 'done';
    const lvl = Math.max(1, monsterLevel(g));
    g.loot.push(fixLootSpot(g, {type:'item', x:ev.x+rand(-20,20), y:ev.y+rand(20,40), r:8, item:generateItem(lvl, 'rare', null, null, p)}));
    showMsg('The last vulture falls. Something was tangled in the harness...', 2.6, '#e8c44a');
    g.particles.push({type:'burst', x:ev.x, y:ev.y, t:0.5, max:0.5, color:'#e8c44a'});
  }
  if(ev.chest && !ev.chest.opened && dist(p, ev.chest) < ev.chest.r + p.r + 4){
    ev.chest.opened = true; owLootChest(g, ev.chest, true); saveGame();
  }
}

// ---- the Sealed Cellar (a small sub-zone under the old house) ----
function makeRoadCellar(){
  const w = 1250, h = 900, cy = h/2, obstacles = [];
  const entrance = {x:80, y:cy, r:34};
  // barrels, crates and two support pillars
  const put = (x,y,ww,hh)=>obstacles.push({x:Math.round(x), y:Math.round(y), w:ww, h:hh});
  put(w*0.42-25, cy-200, 50, 50); put(w*0.42-25, cy+150, 50, 50);
  for(let i=0;i<6;i++){ const x = rand(320, w-160), y = rand(110, h-150), s = rand(36, 52); if(Math.hypot(x-entrance.x, y-entrance.y) < 260) continue; if(obstacles.some(o=>x+s>o.x-40 && x<o.x+o.w+40 && y+s>o.y-40 && y<o.y+o.h+40)) continue; put(x, y, s, s); }
  const room = {w, h, obstacles, subzone:'cellar', entrance, entranceSide:'left', entranceSpot:{x:entrance.x+90, y:cy}, rocks:[], name:'The Sealed Cellar',
    pal:['#3e352c','#2e2720','#453b30','#342c24'], wallPal:['#5a4e40','#2a221a','#40362a'], noOre:true, chestSpot:{x:w-180, y:cy}};
  subFinish(room);
  room.waypoint = null; room.stairsDown = null;
  return room;
}
function spawnRoadCellar(g){
  const room = g.room, n = 9 + Math.floor(Math.random()*4);
  for(let i=0;i<n;i++){
    let x = 0, y = 0;
    for(let k=0;k<40;k++){ x = rand(400, room.w-120); y = rand(110, room.h-110); if(!posBlockedByObstacles(x, y, 20, room.obstacles)) break; }
    const type = i===0 ? 'skeletonbrute' : i%3===0 ? 'skeletonarcher' : i%2 ? 'zombie' : 'skeleton';
    const e = spawnEnemy(g, type, {x, y}); if(e){ e.roadEv = true; e.cellarMob = true; e.aggroRange = 320; }
  }
}
function enterRoadCellar(){
  const g = game, ev = g.roadEv;
  g._cellarReturn = null;
  if(ev && ev.kind==='cellar' && g.scene==='sunlitplains') g._cellarReturn = {scene:g.scene, room:g.room, sun:g.sun, enemies:g.enemies, loot:g.loot, ev, owPoi:g.owPoi, owPoiRoom:g.owPoiRoom, depth:g.depth, x:ev ? ev.door.x : g.player.x, y:ev ? ev.door.y+50 : g.player.y};
  enterSubZone('cellar', {});
}
function roadCellarExit(){
  const g = game, R = g._cellarReturn, p = g.player;
  if(!R || !R.room){ enterSunlitPlains(); return; }
  g._cellarReturn = null;
  g.scene = R.scene; g.room = R.room; g.sun = R.sun; g.tower = null; g.depth = R.depth;
  g.enemies = R.enemies.filter(e=>e.hp>0); g.loot = R.loot; g.owPoi = R.owPoi; g.owPoiRoom = R.owPoiRoom; g.roadEv = R.ev; g.roadEvRoom = R.room;
  g.projectiles = []; g.portal = null; g.chest = null; g.traps = []; g.shieldThrow = null;
  p.x = R.x; p.y = R.y; p.crX = undefined;
  for(const f of (g.followers||[])){ f.x = p.x; f.y = p.y; }
  showMsg('Withered Crossroads', 1.4);
  updateInteractPrompt(null);
  saveGame();
}
function updateRoadCellar(g, dt){
  const t = g.tower, p = g.player, R = g._cellarReturn, ev = R && R.ev;
  if(!t.cleared && !g.enemies.some(e=>e.hp>0 && e.cellarMob)){
    t.cleared = true;
    if(ev) ev.state = 'done';
    g.chest = {x:t.chestSpot.x, y:t.chestSpot.y, r:24, opened:false};
    fixLootSpot(g, g.chest);
    showMsg('The cellar falls silent. An old chest sits against the far wall.', 2.6, '#e8c44a');
  }
  if(g.chest && !g.chest.opened && dist(p, g.chest) < g.chest.r + p.r + 4){ g.chest.opened = true; owLootChest(g, g.chest, true); saveGame(); }
}

// ---- drawing ----
function pushRoadEvDrawables(g, drawables){
  const ev = g.roadEv;
  if(g.scene==='lighthouse' && g.tower && g.tower.subzone==='cellar'){ if(g.chest) drawables.push({depth:g.chest.x+g.chest.y, draw:()=>drawChestIso(g.chest)}); return; }
  if(!ev || g.roadEvRoom!==g.room) return;
  const cl = g.clock||0;
  if(ev.kind==='caravan'){
    drawables.push({depth:ev.x+ev.y, draw:()=>{ drawRvWagon({x:ev.wagon.x, y:ev.wagon.y, w:ev.wagon.w, h:ev.wagon.h, flip:ev.flip, seed:ev.seed}); drawRoadCrates(ev); }});
    if(ev.state==='idle') drawables.push({depth:ev.x+ev.y+1, draw:()=>drawEdgeLabelIso(ev, 'ABANDONED CARAVAN', 70)});
  } else if(ev.kind==='scarecrow'){
    if(ev.state==='idle') drawables.push({depth:ev.x+ev.y, draw:()=>drawWalkingScarecrowIso({x:ev.x, y:ev.y, r:24, animT:0, idle:true, faceSign:1})});
    else drawables.push({depth:ev.x+ev.y-5, draw:()=>drawScarecrowPole(ev)});
  } else if(ev.kind==='cellar'){
    drawables.push({depth:ev.x+ev.y+60, draw:()=>drawOldHouseIso(ev, ev.state==='done')});
    drawables.push({depth:ev.door.x+ev.door.y+2, draw:()=>drawEdgeLabelIso(ev.door, ev.state==='done' ? 'EMPTY CELLAR' : 'SEALED CELLAR', 40)});
  } else if(ev.kind==='carrion'){
    drawables.push({depth:ev.x+ev.y-3, draw:()=>drawDeadHorseIso(ev)});
    drawables.push({depth:ev.wagon.x+ev.wagon.y+60, draw:()=>drawRvWagon({x:ev.wagon.x, y:ev.wagon.y, w:ev.wagon.w, h:ev.wagon.h, flip:!ev.flip, seed:ev.seed})});
  } else if(ev.kind==='merchant'){
    drawables.push({depth:ev.cart.x+ev.cart.y, draw:()=>drawPeddlerCartIso(ev.cart, cl)});
    drawables.push({depth:ev.x+ev.y, draw:()=>{ drawPeddlerPack(ev.npc); drawSimpleNpcIso(ev.npc, cl, {mark:true}); }});
    drawables.push({depth:ev.x+ev.y+1, draw:()=>drawEdgeLabelIso(ev, ROAD_MERCHANT_NAME.toUpperCase(), 76)});
  }
  if(ev.chest) drawables.push({depth:ev.chest.x+ev.chest.y, draw:()=>drawChestIso(ev.chest)});
}
function drawRoadCrates(ev){
  const io = toIso(ev.x-70, ev.y+40), io2 = toIso(ev.x+60, ev.y+55);
  ctx.save();
  for(const [q, s] of [[io, 1], [io2, 0.8]]){
    drawShadow(q.x, q.y, 14*s, 5*s);
    ctx.fillStyle = '#7a5a34'; ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 1;
    ctx.fillRect(q.x-10*s, q.y-16*s, 20*s, 16*s); ctx.strokeRect(q.x-10*s, q.y-16*s, 20*s, 16*s);
    ctx.beginPath(); ctx.moveTo(q.x-10*s, q.y-16*s); ctx.lineTo(q.x+10*s, q.y); ctx.stroke();
  }
  // a spilled sack
  const sq = toIso(ev.x+20, ev.y+70); ctx.fillStyle = '#b8a070'; ctx.beginPath(); ctx.ellipse(sq.x, sq.y-4, 12, 6, 0.3, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(220,200,140,0.8)'; for(let i=0;i<5;i++){ ctx.beginPath(); ctx.arc(sq.x+12+i*3, sq.y-1+(i%2), 1.4, 0, 7); ctx.fill(); }
  ctx.restore();
}
function drawScarecrowPole(ev){
  const io = toIso(ev.x, ev.y);
  ctx.save(); ctx.strokeStyle = '#5a3e22'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(io.x, io.y); ctx.lineTo(io.x+3, io.y-56); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(io.x-20, io.y-44); ctx.lineTo(io.x+24, io.y-40); ctx.stroke();
  ctx.fillStyle = 'rgba(200,170,90,0.8)'; for(let i=0;i<9;i++){ const a = i*0.7; ctx.fillRect(io.x+Math.cos(a)*16, io.y+Math.sin(a)*6, 6, 1.4); }
  ctx.restore();
}
// the scarecrow, both standing still on its pole and walking as the mini boss
function drawWalkingScarecrowIso(e){
  const iso = toIso(e.x, e.y), t = e.animT||0, flash = e.hitT>0, idle = !!e.idle, s = (e.r||24)/24;
  const walk = !idle && e.moving ? Math.sin(t*7) : 0, atk = e.atkAnimT>0 ? 1 : 0;
  drawShadow(iso.x, iso.y, 24*s, 8*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale((e.faceSign||1)*s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const STRAW = flash ? '#fff' : '#d8b860', COAT = flash ? '#fff' : '#5a3e2a', COAT2 = flash ? '#eee' : '#3e2a1c', SACK = flash ? '#fff' : '#c8b088', HAT = flash ? '#fff' : '#3a2a1a';
  if(idle){ ctx.strokeStyle = '#5a3e22'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-30); ctx.stroke(); }
  else {   // stick legs, stiff and lurching
    ctx.strokeStyle = '#5a3e22'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-4,-30); ctx.lineTo(-6+walk*7,0); ctx.moveTo(4,-30); ctx.lineTo(6-walk*7,0); ctx.stroke();
    ctx.strokeStyle = STRAW; ctx.lineWidth = 1.2; for(const lx of [-6+walk*7, 6-walk*7]){ ctx.beginPath(); ctx.moveTo(lx,-2); ctx.lineTo(lx-3,2); ctx.moveTo(lx,-2); ctx.lineTo(lx+3,2); ctx.stroke(); }
  }
  const sway = idle ? Math.sin((game.clock||0)*1.2+e.x)*1.5 : walk*2;
  ctx.translate(sway, 0);
  // tattered coat
  ctx.fillStyle = COAT; ctx.beginPath(); ctx.moveTo(-14,-58); ctx.lineTo(14,-58); ctx.lineTo(16,-28); ctx.lineTo(10,-24); ctx.lineTo(6,-30); ctx.lineTo(0,-23); ctx.lineTo(-6,-30); ctx.lineTo(-11,-24); ctx.lineTo(-16,-28); ctx.closePath(); ctx.fill();
  ctx.fillStyle = COAT2; ctx.fillRect(-2,-58,4,30);
  ctx.fillStyle = flash ? '#fff' : '#8a3a2a'; ctx.fillRect(4,-48,6,6);   // a patch
  // arms out along the crossbar, straw at the cuffs; one swings when it attacks
  const armA = atk ? -0.9 : idle ? 0 : walk*0.25;
  ctx.strokeStyle = COAT; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-12,-54); ctx.lineTo(-28,-52+(idle?0:6)); ctx.stroke();
  ctx.save(); ctx.translate(12,-54); ctx.rotate(armA); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(17,2); ctx.stroke();
  ctx.strokeStyle = STRAW; ctx.lineWidth = 1.3; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(17,2); ctx.lineTo(24,-2+i*2.5); ctx.stroke(); }
  if(!idle){ ctx.strokeStyle = flash ? '#fff' : '#9aa0a8'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(20,-26); ctx.quadraticCurveTo(10,-34,0,-30); ctx.stroke(); }   // a rusty sickle
  ctx.restore();
  ctx.strokeStyle = STRAW; ctx.lineWidth = 1.3; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(-28,-52+(idle?0:6)); ctx.lineTo(-35,-56+i*2.5+(idle?0:6)); ctx.stroke(); }
  // sack head, stitched grin, glowing eyes once awake
  ctx.fillStyle = SACK; ctx.beginPath(); ctx.ellipse(0,-67,10,11,0,0,7); ctx.fill();
  ctx.strokeStyle = 'rgba(60,40,20,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-6,-62); for(let i=0;i<6;i++) ctx.lineTo(-6+i*2.4+1.2, -62+(i%2?2:0)); ctx.stroke();
  if(idle){ ctx.fillStyle = '#2a1a10'; ctx.fillRect(-5,-70,3,3); ctx.fillRect(2,-70,3,3); }
  else { ctx.fillStyle = flash ? '#fff' : '#ff9a2a'; ctx.shadowColor = '#ff7a1a'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(-3.5,-69,2.2,0,7); ctx.arc(3.5,-69,2.2,0,7); ctx.fill(); ctx.shadowBlur = 0; }
  // floppy hat
  ctx.fillStyle = HAT; ctx.beginPath(); ctx.ellipse(0,-76,16,4,0.08,0,7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-8,-77); ctx.quadraticCurveTo(-4,-94,6,-90); ctx.lineTo(8,-77); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = STRAW; ctx.lineWidth = 1.2; for(let i=0;i<5;i++){ ctx.beginPath(); ctx.moveTo(-9+i*4,-76); ctx.lineTo(-11+i*4.5,-70); ctx.stroke(); }
  ctx.restore();
  if(!idle) drawHpBar(iso, 44*s, e.r, e.hp, e.maxHp);
}
function drawOldHouseIso(ev, open){
  const H = ev.house, hz = 54;
  drawBlock(H, hz, '#6a5440', '#2e2218', '#4a3a2a');
  const c0 = toIso(H.x, H.y), c1 = toIso(H.x+H.w, H.y), c2 = toIso(H.x+H.w, H.y+H.h), c3 = toIso(H.x, H.y+H.h);
  ctx.save(); ctx.strokeStyle = 'rgba(20,14,8,0.6)'; ctx.lineWidth = 1;
  // a sagging, half-fallen roof
  const rp = toIso(H.x+H.w/2, H.y+H.h/2), ridgeA = {x:(c0.x+c3.x)/2, y:(c0.y+c3.y)/2-hz-46}, ridgeB = {x:(c1.x+c2.x)/2, y:(c1.y+c2.y)/2-hz-40};
  ctx.fillStyle = '#4a3020'; ctx.beginPath(); ctx.moveTo(c3.x, c3.y-hz); ctx.lineTo(c2.x, c2.y-hz); ctx.lineTo(ridgeB.x, ridgeB.y); ctx.lineTo(ridgeA.x, ridgeA.y); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a2416'; ctx.beginPath(); ctx.moveTo(c2.x, c2.y-hz); ctx.lineTo(c1.x, c1.y-hz); ctx.lineTo(ridgeB.x, ridgeB.y); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#16100a'; ctx.beginPath(); ctx.moveTo(rp.x-4, rp.y-hz-38); ctx.lineTo(rp.x+22, rp.y-hz-30); ctx.lineTo(rp.x+14, rp.y-hz-18); ctx.lineTo(rp.x-8, rp.y-hz-24); ctx.closePath(); ctx.fill();   // a hole in the roof
  // boarded window + a dark doorway on the front face
  const f = (u,v)=>({x:c3.x+(c2.x-c3.x)*u, y:c3.y+(c2.y-c3.y)*u - hz*v});
  const w0 = f(0.2,0.75), w1 = f(0.38,0.75), w2 = f(0.38,0.4), w3 = f(0.2,0.4);
  ctx.fillStyle = '#1a120a'; ctx.beginPath(); ctx.moveTo(w0.x,w0.y); ctx.lineTo(w1.x,w1.y); ctx.lineTo(w2.x,w2.y); ctx.lineTo(w3.x,w3.y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#7a6040'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(w0.x,w0.y+2); ctx.lineTo(w2.x,w2.y-2); ctx.moveTo(w1.x,w1.y+2); ctx.lineTo(w3.x,w3.y-2); ctx.stroke();
  const d0 = f(0.6,0), d1 = f(0.76,0), d2 = f(0.76,0.62), d3 = f(0.6,0.62);
  ctx.fillStyle = '#120c06'; ctx.beginPath(); ctx.moveTo(d0.x,d0.y); ctx.lineTo(d1.x,d1.y); ctx.lineTo(d2.x,d2.y); ctx.lineTo(d3.x,d3.y); ctx.closePath(); ctx.fill();
  ctx.restore();
  // the slanted cellar door against the front wall
  const dc = toIso(ev.door.x, ev.door.y);
  ctx.save(); ctx.translate(dc.x, dc.y);
  drawShadow(0, 4, 30, 10);
  ctx.fillStyle = open ? '#140e08' : '#5a3e24'; ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-26,-4); ctx.lineTo(6,-20); ctx.lineTo(30,-10); ctx.lineTo(-2,6); ctx.closePath(); ctx.fill(); ctx.stroke();
  if(!open){
    ctx.strokeStyle = 'rgba(30,18,8,0.7)'; ctx.lineWidth = 1; for(let k=1;k<4;k++){ ctx.beginPath(); ctx.moveTo(-26+k*8, -4-k*4); ctx.lineTo(-2+k*8, 6-k*4); ctx.stroke(); }
    ctx.strokeStyle = '#8a8478'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-12,-2); ctx.lineTo(16,-14); ctx.stroke();   // an iron bar
    ctx.fillStyle = '#6a6458'; ctx.beginPath(); ctx.arc(2,-8,3,0,7); ctx.fill();
  } else {
    ctx.fillStyle = '#5a3e24'; ctx.beginPath(); ctx.moveTo(-26,-4); ctx.lineTo(-30,-34); ctx.lineTo(2,-50); ctx.lineTo(6,-20); ctx.closePath(); ctx.fill(); ctx.stroke();   // flung open
  }
  ctx.restore();
}
function drawDeadHorseIso(ev){
  const io = toIso(ev.x, ev.y), f = ev.flip ? -1 : 1;
  drawShadow(io.x, io.y, 40, 12);
  ctx.save(); ctx.translate(io.x, io.y); ctx.scale(f, 1); ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(90,20,14,0.45)'; ctx.beginPath(); ctx.ellipse(4, 2, 40, 12, 0, 0, 7); ctx.fill();   // blood in the dust
  ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-14,-8); ctx.lineTo(-30,-2); ctx.moveTo(-6,-6); ctx.lineTo(-20,6); ctx.moveTo(14,-8); ctx.lineTo(30,-14); ctx.moveTo(20,-4); ctx.lineTo(34,2); ctx.stroke();   // stiff legs
  ctx.fillStyle = '#6a4630'; ctx.beginPath(); ctx.ellipse(2,-12,26,11,0.05,0,7); ctx.fill();
  ctx.fillStyle = '#7a5038'; ctx.beginPath(); ctx.ellipse(0,-16,20,6,0.05,0,7); ctx.fill();
  ctx.fillStyle = '#d8ccb8'; for(let i=0;i<4;i++){ ctx.fillRect(-6+i*5,-18,2,8); }   // exposed ribs
  ctx.fillStyle = '#5a3a26'; ctx.beginPath(); ctx.ellipse(-30,-8,10,6,-0.4,0,7); ctx.fill();   // head on the ground
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-20,-16); ctx.quadraticCurveTo(-16,-24,-8,-22); ctx.stroke();   // mane
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-24,-10); ctx.lineTo(24,-26); ctx.stroke();   // harness strap
  ctx.restore();
}
function drawPeddlerCartIso(c, t){
  const io = toIso(c.x, c.y);
  drawShadow(io.x, io.y, 46, 14);
  ctx.save(); ctx.translate(io.x, io.y); ctx.lineJoin = 'round';
  ctx.strokeStyle = '#3a2716'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(16,-8,11,13,0,0,7); ctx.stroke();
  ctx.fillStyle = '#7a5434'; ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-30,-14); ctx.lineTo(20,-30); ctx.lineTo(32,-22); ctx.lineTo(-18,-6); ctx.closePath(); ctx.fill(); ctx.stroke();
  // stacked wares under a striped awning
  const cols = ['#a83a2a','#3a6a9a','#c8a040','#5a8a4a'];
  for(let i=0;i<4;i++){ ctx.fillStyle = cols[i]; ctx.fillRect(-20+i*11, -30-i*3, 10, 10); }
  ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.moveTo(-26,-34); ctx.lineTo(24,-50); ctx.lineTo(28,-42); ctx.lineTo(-22,-26); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#a83a2a'; for(let i=0;i<5;i++){ const u = i/5; ctx.beginPath(); ctx.moveTo(-26+u*50, -34-u*16); ctx.lineTo(-26+(u+0.1)*50, -34-(u+0.1)*16); ctx.lineTo(-22+(u+0.1)*50, -26-(u+0.1)*16); ctx.lineTo(-22+u*50, -26-u*16); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18,-6); ctx.lineTo(-44,2); ctx.moveTo(-14,-10); ctx.lineTo(-40,-2); ctx.stroke();   // handles
  ctx.strokeStyle = '#3a2716'; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.ellipse(-8,0,12,14,0,0,7); ctx.stroke();
  // a little hanging lantern
  const sw = Math.sin(t*2)*2; ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(26,-44); ctx.lineTo(28+sw,-34); ctx.stroke();
  ctx.fillStyle = '#ffcf70'; ctx.shadowColor = '#ffb040'; ctx.shadowBlur = 10; ctx.fillRect(25+sw,-34,6,7); ctx.shadowBlur = 0;
  ctx.restore();
}
function drawPeddlerPack(n){
  const io = toIso(n.x, n.y);
  ctx.save(); ctx.translate(io.x+4, io.y-2); ctx.lineJoin = 'round';
  // an enormous rucksack on his back, heaped with a bedroll, pots and a rolled rug
  ctx.fillStyle = '#6a4a2a'; ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-17,-22); ctx.quadraticCurveTo(-21,-50,-12,-62); ctx.lineTo(12,-62); ctx.quadraticCurveTo(21,-50,17,-22); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5a3a1e'; ctx.fillRect(-19,-44,6,12); ctx.strokeRect(-19,-44,6,12); ctx.fillRect(13,-44,6,12); ctx.strokeRect(13,-44,6,12);   // side pouches
  ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14,-40); ctx.lineTo(14,-40); ctx.stroke();   // strap
  ctx.fillStyle = '#7a8a5a'; ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0,-66,17,6,0,0,7); ctx.fill(); ctx.stroke();   // bedroll
  ctx.fillStyle = '#8a3a2a'; ctx.beginPath(); ctx.ellipse(-4,-75,12,5,0.25,0,7); ctx.fill(); ctx.stroke();   // rug
  ctx.fillStyle = '#9a9488'; ctx.beginPath(); ctx.arc(9,-79,5,0,7); ctx.fill(); ctx.stroke();                // a pot
  ctx.fillStyle = '#b07a3a'; ctx.beginPath(); ctx.arc(-11,-83,3.5,0,7); ctx.fill(); ctx.stroke();            // a pan
  ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(14,-60); ctx.lineTo(20,-92); ctx.stroke();   // a walking-staff tip
  ctx.restore();
}
