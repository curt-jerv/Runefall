// ---------------- Magic packs & Elites (v156) ----------------
// Diablo 2 "champion/unique" + Path of Exile "magic/rare" style variety, rolled once when a region is entered:
//   Magic pack -- 5 neighbouring monsters sharing the SAME mods, glowing BLUE. Tougher, better drops.
//   Elite      -- one monster with a random generated name, ~25% larger, glowing YELLOW, 2-3 mods.
const SPECIAL_MODS = {
  fast:      {name:'Fast',                apply(e){ e.speed*=1.3; e.atkCdMax*=0.8; }},
  strong:    {name:'Strong',              apply(e){ e.dmg*=1.4; }},
  fireEnch:  {name:'Fire Enchanted',      grp:'ele', apply(e){ e.dmgType='fire'; e.deathNova='fire'; }},
  coldEnch:  {name:'Cold Enchanted',      grp:'ele', apply(e){ e.dmgType='cold'; e.deathNova='cold'; e.chillHit=true; }},
  lightEnch: {name:'Lightning Enchanted', grp:'ele', apply(e){ e.dmgType='lightning'; e.deathNova='lightning'; }},
  stoneSkin: {name:'Stone Skin',          apply(e){ e.armor=(e.armor||0)*1.5+12; }},
  regen:     {name:'Regenerating',        apply(e){ e.regen=true; }},
  vampiric:  {name:'Vampiric',            apply(e){ e.vamp=true; }},
  shielded:  {name:'Shielded',            apply(e){ e.shieldHp=e.maxHp*0.45; e.shieldMax=e.shieldHp; }},
  manaBurn:  {name:'Mana Burn',           apply(e){ e.manaBurn=true; }},
  spiked:    {name:'Spiked',              apply(e){ e.reflect=true; e.reflectCd=0; }},
};
const SPECIAL_ZONES = {   // chance a region rolls magic packs / elites (not every region: no Forest, Lighthouse, boss lairs' bosses)
  forest:{pack:0.4, elite:0}, sunlitplains:{pack:0.45, elite:0.4}, cursedcemetery:{pack:0.5, elite:0.45}, lakesideruins:{pack:0.5, elite:0.45},
  blackmarsh:{pack:0.55, elite:0.5}, mountainpass:{pack:0.55, elite:0.5}, icyzone:{pack:0.5, elite:0.45},
  frosthold:{pack:0.6, elite:0.55}, redridge:{pack:0.65, elite:0.6}, redcrater:{pack:0.7, elite:0.65},
  dungeon:{pack:0.4, elite:0.5, guarantee:true}, spiderlair:{pack:0.35, elite:0}, bearcave:{pack:0.35, elite:0}, rivervalley:{pack:0.3, elite:0}, minotaurcave:{pack:0.3, elite:0},
  darkcrypt:{pack:0.5, elite:0.5, guarantee:true}, ancientruins:{pack:0.55, elite:0.55, guarantee:true}, raptorlair:{pack:0.5, elite:0.5, guarantee:true},
};
const ELITE_PRE = ['Gor','Vrek','Mal','Skar','Thra','Uzg','Kor','Bel','Drak','Zul','Nar','Hesh','Ghar','Ysk'];
const ELITE_MID = ['ak','oth','ug','ith','ar','un','esh','or'];
const ELITE_TITLE = ['the Sundering','Bonegrinder','the Relentless','Skullsplitter','the Cruel','Ashbringer','Gloomfang','the Unyielding','Stormcaller','Doomhide','the Ravenous','Ironjaw'];
function eliteName(){ const r = a=>a[Math.floor(Math.random()*a.length)]; return r(ELITE_PRE)+r(ELITE_MID)+' '+r(ELITE_TITLE); }
function specialEligible(e){
  return e.hp>0 && !(e.isBoss||e.isLairBoss||e.bkBoss||e.prot||e.lr||e.lrAdd||e.rev||e.rvAdd||e.lvBoss||e.mastodon||e.type==='leviathan'||e.speed===0||e.elite||e.magic||e.campChief||e.isFhtTemplar||e.type==='fhtemplar'||e.balrog);
}
function pickMods(n){
  const keys = shuffle(Object.keys(SPECIAL_MODS)), out = []; let ele = false;
  for(const k of keys){ if(out.length>=n) break; const m = SPECIAL_MODS[k]; if(m.grp==='ele'){ if(ele) continue; ele = true; } out.push(k); }
  return out;
}
function applyMods(e, mods){
  e.specialMods = mods.slice();
  for(const k of mods) SPECIAL_MODS[k].apply(e);
  e.modLabel = mods.map(k=>SPECIAL_MODS[k].name).join(' · ');
}
function makeMagic(e, mods){
  e.magic = true; e.maxHp = Math.round(e.maxHp*1.7); e.hp = e.maxHp; e.dmg *= 1.15;
  applyMods(e, mods);
}
function makeElite(e, mods){
  e.elite = true; e.eliteName = eliteName(); e.r = Math.round(e.r*1.25);
  e.maxHp = Math.round(e.maxHp*3.2); e.hp = e.maxHp; e.dmg *= 1.25;
  applyMods(e, mods);
}
// v169: multi-floor dungeons (Mine, Frosthold Tower, Lighthouse, Forgotten Tower, Ancient Ruins, Raptor Lair)
// roll ONE magic pack and ONE elite for the whole dungeon -- each lands on a random non-boss floor.
function multiFloorInfo(g){
  const rg = (a,b)=>{ const o=[]; for(let i=a;i<=b;i++) o.push(i); return o; };
  if(g.scene==='lighthouse' && g.tower){
    const t = g.tower;
    if(t.subzone) return null;
    if(t.deep) return {key:'deep', floor:g.lighthouseFloor, floors:[1,2]};
    if(t.fht) return {key:'fht', floor:g.lighthouseFloor, floors:rg(1,FHT_FLOORS-1)};
    return {key:t.ft?'ft':'lh', floor:g.lighthouseFloor, floors:rg(1,LIGHTHOUSE_FLOOR_COUNT-1)};
  }
  if(g.scene==='ancientruins' && g.ruins) return g.ruins.fhd ? {key:'fhd', floor:g.ruins.floor, floors:rg(1,FHD_FLOORS-1)} : {key:'ruins', floor:g.ruins.floor, floors:rg(1,1)};
  if(g.scene==='raptorlair' && g.rlair) return {key:'rlair', floor:g.rlair.floor, floors:[1]};
  return null;
}
// v176: a dungeon's floors keep their monsters/loot/layout while you stay inside it (going up/down stairs
// or respawning to a checkpoint floor never refills a floor). Leaving the dungeon entirely wipes the stores.
function clearDungeonStore(g, key){
  if(key==='fht') g.fhtStore = null;
  else if(key==='ft') g.ftStore = null;
  else if(key==='lh') g.lhStore = null;
  else if(g.dStore) g.dStore[key] = null;
}
function dungeonPersist(g){
  if(!g || !g.started) return;
  if(g.scene==='lighthouse' && g.tower && g.tower.subzone==='temple') return;   // the temple belongs to the ruins dungeon
  const mf = multiFloorInfo(g), key = mf ? mf.key : null;
  if(g._dpKey && g._dpKey!==key) clearDungeonStore(g, g._dpKey);
  g._dpKey = key;
  if(key==='ruins' || key==='rlair' || key==='fhd'){
    const R = (key==='ruins' || key==='fhd') ? g.ruins : g.rlair;
    if(!R) return;
    g.dStore = g.dStore || {}; g.dStore[key] = g.dStore[key] || {};
    g.dStore[key][R.floor] = {room:R, enemies:g.enemies, loot:g.loot, bossKilled:g.bossKilled, chest:g.chest};
  }
}
function dungeonStoreGet(g, key, floor){ return g.dStore && g.dStore[key] && g.dStore[key][floor] || null; }
// v219: dungeon floors are topped up to ~20 monsters per million px of walkable floor, in packs of 3-5 of the
// floor's own monster types, away from the entrance and boss rooms (Bear Cave / Forgotten Tower were ~4/Mpx).
const DUNGEON_DENSITY_TARGET = 20;
const DENSIFY_SCENES = {lighthouse:1, spiderlair:1, bearcave:1, minotaurcave:1, darkcrypt:1, raptorlair:1};
// v474: the Bear Cave holds fewer bears, in looser packs of 3-5 that keep well apart from each other
const DENSIFY_TUNE = {bearcave:{density:7, spread:95, gap:560}, spiderlair:{density:20, spread:60, gap:300, pack:3}};   // v480: spiders in many packs of exactly 3
function densifyDungeon(g){
  const room = g.room;
  if(!room || !DENSIFY_SCENES[g.scene] || g.enemies._dense || room.bossFloor) return;
  g.enemies._dense = true;
  const rects = (room.floorRects && room.floorRects.length) ? room.floorRects : [{x:0, y:0, w:room.w, h:room.h}];
  let area = 0; for(const r of rects) area += r.w*r.h;
  const tune = DENSIFY_TUNE[g.scene] || {}, packCenters = [];
  const target = Math.round(area/1e6*(tune.density||DUNGEON_DENSITY_TARGET));
  const pool = g.enemies.filter(specialEligible);
  if(!pool.length || g.enemies.length>=target) return;
  const p = g.player, bosses = g.enemies.filter(e=>e.isBoss||e.isLairBoss||e.balrog||e.bkBoss);
  const ex = room.exitRoom;
  const okPt = (x,y)=>{
    if(dist({x,y}, p) < 360) return false;
    if(room.obstacles && posBlockedByObstacles(x, y, 26, room.obstacles)) return false;
    if(ex && x>ex.x-40 && x<ex.x+ex.w+40 && y>ex.y-40 && y<ex.y+ex.h+40) return false;
    for(const b of bosses) if(dist({x,y}, b) < 420) return false;
    if(tune.gap) for(const c of packCenters) if(dist({x,y}, c) < tune.gap) return false;
    return true;
  };
  let guard = 0;
  while(g.enemies.length<target && guard++<600){
    const type = pool[Math.floor(Math.random()*pool.length)].type;
    let r = null, tries = 0, cx = 0, cy = 0;
    do{
      r = rects[Math.floor(Math.random()*rects.length)];
      const mg = tune.density ? 45 : 70;   // v480: tuned caves can use their narrower chambers too
      cx = r.x + mg + Math.random()*Math.max(1, r.w-2*mg); cy = r.y + mg + Math.random()*Math.max(1, r.h-2*mg);
      tries++;
    } while(tries<30 && (r.w<2*(tune.density ? 45 : 70) || r.h<2*(tune.density ? 45 : 70) || !okPt(cx,cy)));
    if(tries>=30) continue;
    packCenters.push({x:cx, y:cy});
    const n = tune.pack ? tune.pack : tune.density ? 3 + Math.floor(Math.random()*3) : Math.min(3 + Math.floor(Math.random()*3), target-g.enemies.length + 2);
    const sp = tune.spread || 55;
    for(let k=0;k<n;k++){
      const px = clamp(cx+rand(-sp,sp), r.x+30, r.x+r.w-30), py = clamp(cy+rand(-sp,sp), r.y+30, r.y+r.h-30);
      if(room.obstacles && posBlockedByObstacles(px, py, 18, room.obstacles)) continue;
      const ne = spawnEnemy(g, type, {x:px, y:py});
      if(ne && g.scene==='bearcave') ne.dmg *= BEAR_CAVE_DMG_MULT;   // v474: pack bears hit like the rest of the cave's bears
    }
  }
}
function rollSpecialMonsters(g){
  try{ densifyDungeon(g); }catch(err){}
  const mf = multiFloorInfo(g);
  if(!mf){ g._specialKey = null; }
  const cfg = mf ? {pack:1, elite:1} : SPECIAL_ZONES[g.scene];
  if(!cfg) return;
  if(g.enemies._sp) return;            // this floor's roster was already rolled (cached floors re-enter here)
  let onlyPack = null, onlyElite = null;
  if(mf){
    if(g._specialKey!==mf.key){          // a fresh trip into this dungeon: plan it once
      g._specialKey = mf.key;
      const pick = ()=>mf.floors[Math.floor(Math.random()*mf.floors.length)];
      g._specialPlan = {pack:pick(), elite:pick()};
    }
    onlyPack = (g._specialPlan.pack===mf.floor); onlyElite = (g._specialPlan.elite===mf.floor);
    if(!onlyPack && !onlyElite){ g.enemies._sp = true; return; }
  }
  if(g.scene==='dungeon' && g.depth<3) { if(!cfg.guarantee) return; }
  const pool = g.enemies.filter(specialEligible);
  if(pool.length<(mf?4:8)) return;
  g.enemies._sp = true;
  let nPacks = mf ? (onlyPack?1:0) : (Math.random()<cfg.pack ? 1 + (Math.random()<0.35?1:0) : 0);
  let nElite = mf ? (onlyElite?1:0) : (Math.random()<cfg.elite ? 1 + (Math.random()<0.3?1:0) : 0);
  if(cfg.guarantee && nElite<1 && !mf) nElite = 1;
  const modCount = g.depth>=30 ? 2 : 1;
  for(let i=0;i<nPacks;i++){
    const seeds = g.enemies.filter(specialEligible);
    if(!seeds.length) break;
    const seed = seeds[Math.floor(Math.random()*seeds.length)];
    const near = seeds.filter(o=>o!==seed).sort((a,b)=>dist(a,seed)-dist(b,seed)).filter(o=>dist(o,seed)<420).slice(0,4);
    const members = [seed].concat(near);
    if(members.length<3) continue;
    const mods = pickMods(modCount);
    for(const m of members) makeMagic(m, mods);
  }
  for(let i=0;i<nElite;i++){
    const c = g.enemies.filter(specialEligible);
    if(!c.length) break;
    makeElite(c[Math.floor(Math.random()*c.length)], pickMods(g.depth>=35 ? 3 : 2));
  }
}
// v474: a Map Bearer not far from the way in -- a tougher monster ringed in gold who carries the floor's map.
// In the Minotaur Cave it is a skeleton brute. v476: on every floor that needs a map, and only the bearer drops it.
const MAP_BEARER_SKIP = {firebat:1, coilsentry:1, keepbat:1, roc:1, harpy:1};   // flyers and turrets don't carry maps
function placeMapHolder(g){
  const room = g.room;
  if(room.subzone==='highward' || room.subzone==='keep' || room.deep || (g.tower && g.tower.deep) || g.enemies.some(e=>e.mapHolder || e.mapCarrier)) return;   // (the Mountain Depths are always charted)   // v476: every floor that needs a map has one bearer
  const ent = room.entranceSpawn || {x:g.player.x, y:g.player.y};
  const rects = room.floorRects.filter(r=>r.w>=120 && r.h>=120);
  const spotNear = (lo, hi)=>{
    for(let t=0;t<400;t++){
      const r = rects[Math.floor(Math.random()*rects.length)]; if(!r) break;
      const x = r.x+50+Math.random()*(r.w-100), y = r.y+50+Math.random()*(r.h-100), d = Math.hypot(x-ent.x, y-ent.y);
      if(d<lo || d>hi) continue;
      if(room.obstacles && posBlockedByObstacles(x, y, 26, room.obstacles)) continue;
      if(room.exitRoom && x>room.exitRoom.x && x<room.exitRoom.x+room.exitRoom.w && y>room.exitRoom.y && y<room.exitRoom.y+room.exitRoom.h) continue;
      return {x, y};
    }
    return null;
  };
  let e = null;
  if(g.scene==='minotaurcave'){
    const pos = spotNear(380, 760) || spotNear(300, 1200);
    if(pos) e = spawnEnemy(g, 'skeletonbrute', pos);
  } else {
    const cand = g.enemies.filter(o=>specialEligible(o) && !o.isGuard && !MAP_BEARER_SKIP[o.type]).map(o=>({o, d:Math.hypot(o.x-ent.x, o.y-ent.y)})).filter(c=>c.d>=320 && c.d<=1300).sort((a,b)=>Math.abs(a.d-650)-Math.abs(b.d-650));
    if(cand.length) e = cand[0].o;
    else { const pos = spotNear(380, 900), pool = g.enemies.filter(specialEligible); if(pos && pool.length) e = spawnEnemy(g, pool[0].type, pos); }
  }
  if(!e) return;
  e.mapHolder = true; e.mapCarrier = true;
  e.hp = Math.round(e.hp*2); e.maxHp = Math.round(e.maxHp*2); e.r = Math.round(e.r*1.12); e.xpMul = Math.max(e.xpMul||1, 2.5);
}
function isBigMonster(e){
  return !!(e.isBoss||e.isLairBoss||e.elite||e.magic||/brute/.test(e.type)||['bear','treant','armordon','alligator','vampire','boss','cavetroll','fhtemplar','giant','mtroll','trollelder'].indexOf(e.type)>=0);
}
function specialDeathNova(g, e){
  const R = 95, dm = e.dmg*0.7, col = e.deathNova==='fire' ? '#ff8a3a' : e.deathNova==='cold' ? '#8fd8ff' : '#bfe8ff';
  if(dist(g.player,e) < R+g.player.r) playerDamage(g, dm, e);
  if(g.followers) for(const f of g.followers) if(dist(f,e) < R+f.r) applyFollowerDamage(g, f, dm, e);
  g.particles.push({type:'ring', x:e.x, y:e.y, t:0.45, max:0.45, r:R, color:col});
  g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:col});
}
// draws the glow, the sprite and the name plate for elites / magic-pack members
function drawMarkX(e){
  if(!(e.markT>0) || e.hp<=0) return;
  const iso = toIso(e.x,e.y);
  const y = (_hpBarTopY!=null ? _hpBarTopY : iso.y - 60*(e.r/18)) - 8 - (e.elite||e.magic ? 14 : 0);
  const bob = Math.sin(((game&&game.clock)||0)*6)*1.5;
  ctx.save(); ctx.translate(iso.x, y+bob); ctx.lineCap='round';
  ctx.strokeStyle='rgba(0,0,0,0.65)'; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(-6,-6); ctx.lineTo(6,6); ctx.moveTo(6,-6); ctx.lineTo(-6,6); ctx.stroke();
  ctx.strokeStyle='#ff3a3a'; ctx.lineWidth=3.5; ctx.beginPath(); ctx.moveTo(-6,-6); ctx.lineTo(6,6); ctx.moveTo(6,-6); ctx.lineTo(-6,6); ctx.stroke();
  ctx.restore();
}
function drawEnemyStatusWrap(e){
  _hpBarTopY = null;
  drawWithStatus(e, ()=>drawEnemyIsoBase(e), !isHeavyEnemy(e) && e.hp>0);
  // v419 safety net: any living monster whose sprite didn't draw its own life bar gets a standard one
  if(_hpBarTopY==null && e.hp>0 && e.maxHp>0 && !e.invulnerable && !e.submerged && !e.burrowed && !e.underground && !e.hidden && !e.buried && !e.dormant && !e.cloaked && !_suppressHpBar){
    const fi = toIso(e.x, e.y);
    drawHpBar(fi, 26 + (e.r||14)*1.7, e.r||14, e.hp, e.maxHp);
  }
}
// v315 perf: elite/magic glow used a fresh radial gradient + a canvas shadowBlur on the whole sprite + shadowBlur text for
// EVERY special monster EVERY frame (shadowBlur is by far the costliest 2D-canvas op, worst on phones). The ground glow is now a
// cached pre-rendered sprite, the sprite blur is gone (replaced by a thin ground ring) and plates use a cheap outline.
const _specGlow = {};
function specGlowSprite(col){
  let c = _specGlow[col]; if(c) return c;
  c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), gr = x.createRadialGradient(64,64,3,64,64,62);
  gr.addColorStop(0,'rgba('+col+',0.65)'); gr.addColorStop(0.55,'rgba('+col+',0.25)'); gr.addColorStop(1,'rgba('+col+',0)');
  x.fillStyle = gr; x.fillRect(0,0,128,128);
  return (_specGlow[col] = c);
}
function drawEnemyIso(e){
  if(e.bkHold && e.hp>0){ const mi = toIso(e.x,e.y), pu = 0.5+0.5*Math.sin(((game&&game.clock)||0)*2.5); ctx.save(); ctx.strokeStyle = 'rgba(240,200,110,'+(0.35+0.25*pu)+')'; ctx.fillStyle = 'rgba(240,200,110,'+(0.06+0.05*pu)+')'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(mi.x, mi.y-34, e.r+18, e.r+44, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }   // v480: untouchable behind the beacon
  if(e.mapCarrier && e.hp>0){ const mi = toIso(e.x,e.y), pu = 0.5+0.5*Math.sin(((game&&game.clock)||0)*3); ctx.save(); ctx.strokeStyle = 'rgba(240,200,80,'+(0.55+0.35*pu)+')'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(mi.x, mi.y+2, e.r+12, (e.r+12)*0.4, 0, 0, 7); ctx.stroke(); ctx.restore(); }   // v453: this monster carries the floor map
  if(!(e.elite||e.magic)){ _hpBarTopY = null; drawEnemyStatusWrap(e); drawMarkX(e); return; }
  const iso = toIso(e.x,e.y), t = e.animT||0, col = e.elite ? '255,214,64' : '90,160,255';
  const pulse = 0.75+0.25*Math.sin(t*3), R = e.r*(e.elite?2.6:2.1);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1,0.5);
  ctx.globalAlpha = pulse; ctx.drawImage(specGlowSprite(col), -R, -R, R*2, R*2);
  ctx.globalAlpha = 0.5*pulse; ctx.strokeStyle = 'rgb('+col+')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0,R*0.55,0,7); ctx.stroke();
  ctx.restore();
  _hpBarTopY = null;
  drawEnemyStatusWrap(e);
  ctx.save(); ctx.textAlign='center'; ctx.lineJoin='round'; ctx.strokeStyle='rgba(0,0,0,0.85)'; ctx.lineWidth=3;
  // v237: name plates always sit ABOVE the hp bar (bottom line baseline = 5px over the bar), never over it
  const ly = (_hpBarTopY!=null ? Math.min(_hpBarTopY - 5, iso.y - 66*(e.r/18) + 8) : iso.y - 66*(e.r/18) + 6) - (e.elite ? 12 : 0);
  if(e.elite){ ctx.font='bold 12px Alegreya,Georgia, serif'; ctx.strokeText(e.eliteName, iso.x, ly); ctx.fillStyle='#ffd83a'; ctx.fillText(e.eliteName, iso.x, ly); ctx.font='10px system-ui'; ctx.strokeText(e.modLabel, iso.x, ly+12); ctx.fillStyle='#f0e2a0'; ctx.fillText(e.modLabel, iso.x, ly+12); }
  else { ctx.font='10px system-ui'; ctx.strokeText(e.modLabel, iso.x, ly); ctx.fillStyle='#9cc6ff'; ctx.fillText(e.modLabel, iso.x, ly); }
  if(e.shieldHp>0){ ctx.strokeStyle='rgba(150,220,255,0.7)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(iso.x, iso.y-e.r*1.2, e.r*1.3, e.r*1.6, 0, 0, 7); ctx.stroke(); }
  ctx.restore();
  drawMarkX(e);
}
// Every scene's enemy draw goes through here so wind-up tells and boss telegraphs show everywhere.
function pushEnemyDrawables(drawables, e){
  if(e.hp>0 && SECTION_SCENES[game.scene] && sectionVis(game) && secEnemyHidden(e)) return;
  if(e.hp>0 && losShadowScene(game) && losEnemyHidden(game, e)) return;   // (v245) nothing shows through walls in the dark
  if((e.type==='alligator'&&e.lungeState==='tele')||(e.type==='giantoad'&&e.tState==='tele')) drawables.push({depth:e.x+e.y-2, draw:()=>drawMarshTelegraph(e)});
  if(e.type==='crawler' && (e.tState==='tele'||e.tState==='lash'||e.tState==='pull')) drawables.push({depth:e.x+e.y-2, draw:()=>drawCrawlerTongue(e)});
  if(e.hw) drawables.push({depth:-100000+e.x*0.001, draw:()=>drawHwTelegraph(e)});
  if(e.bkBoss) drawables.push({depth:-100000+e.x*0.001, draw:()=>drawBanditKingTelegraph(e)});
  if(e.type==='fhcleric') drawables.push({depth:-100000+e.x*0.001, draw:()=>drawFhClericFx(e)});
  else if(!e.hw && e._healFx>0) drawables.push({depth:-100000+e.x*0.001, draw:()=>drawHwStatusFx(e)});
  if(e.lr) drawables.push({depth:e.x+e.y-2, draw:()=>drawLightningRaptorTelegraph(e)});
  if(e.gj) drawables.push({depth:-100000+e.x*0.001, draw:()=>drawGojiraTelegraph(e)});
  if(e.trex) drawables.push({depth:-100000+e.x*0.001, draw:()=>drawTrexTelegraph(e)});
  if(e.balrog) drawables.push({depth:e.x+e.y-2, draw:()=>drawBalrogTelegraph(e)});
  if(e.fhCmd) drawables.push({depth:e.x+e.y-2, draw:()=>drawFhCmdTelegraph(e)});
  if(e.dwc) drawables.push({depth:-100000+e.x*0.001, draw:()=>drawDwTelegraph(e)});
  if(e.mastodon) drawables.push({depth:-100000+e.x*0.001, draw:()=>drawMstTelegraph(e)});
  if((e.type==='cavetroll'||e.type==='fhtemplar'||e.type==='magmagolem'||e.type==='gearguard'||e.type==='fallengolem'||e.type==='poisonwalker'||e.type==='brimstonebrute'||e.type==='giant'||e.type==='mtroll') && e.tState==='tele') drawables.push({depth:e.x+e.y-2, draw:()=>drawTrollTelegraph(e)});
  if(e.type==='lavabeetle' && e.tState==='tele' && e.tPt) drawables.push({depth:e.x+e.y-2, draw:()=>drawBeetleTelegraph(e)});
  if(e.colossus) drawables.push({depth:-100000+e.x*0.001, draw:()=>drawColossusTelegraph(e)});
  if(e.harpyQueen && !isCliff(game)) drawables.push({depth:-100000+e.x*0.001, draw:()=>drawQueenTelegraph(e)});
  if((e.type==='armordon'&&(e.tState==='tele'||e.tState==='swing'))||(e.type==='raptor'&&e.tState==='tele')) drawables.push({depth:e.x+e.y-2, draw:()=>drawRedridgeTelegraph(e)});
  if(e.rev && (e.rvZones.length || e.rvState==='slamTele' || e.rvState==='raise')) drawables.push({depth:e.x+e.y-2, draw:()=>drawRevenantTelegraph(e)});
  if(e.wraith && /Tele$/.test(e.wrState||'')) drawables.push({depth:e.x+e.y-2, draw:()=>drawWraithTelegraph(e)});
  if(e.lvBoss && (e.lvState==='surgeTele'||e.lvState==='emergeTele'||(e.krStrikes&&e.krStrikes.length))) drawables.push({depth:e.x+e.y-2, draw:()=>drawLeviathanTelegraph(e)});
  if(e.prot && protHasTelegraph(e)) drawables.push({depth:e.x+e.y-2, draw:()=>drawProtectorTelegraph(e)});
  if(e.windT>0) drawables.push({depth:e.x+e.y-1, draw:()=>drawEnemyTell(e)});
  if((e.type==='bear'||e.type==='ram') && e.chargeState==='wind') drawables.push({depth:e.x+e.y-1, draw:()=>drawBearChargeLane(e)});
  if(e.type==='frozenzombie' && e.zChargeState==='wind') drawables.push({depth:e.x+e.y-1, draw:()=>drawBearChargeLane(e)});
  if(e.type==='boar' && e.boarChargeState==='wind') drawables.push({depth:e.x+e.y-1, draw:()=>drawBearChargeLane(e)});
  // v315: ordinary monsters well off-screen are not drawn at all (big ones and bosses keep their own bounds)
  if(e.r<=30 && !(e.isBoss||e.isLairBoss||e.elite) && !isPointOnScreen(game, e.x, e.y, 150)) return;
  drawables.push({depth:e.x+e.y, draw:()=>drawEnemyIso(e)});
}
