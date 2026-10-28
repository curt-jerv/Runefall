// ---------------- Overworld variety (v525) ----------------
// Story zones keep their roads, gates and landmarks, but every visit re-rolls what is around them:
//   * features -- random blocking ruins (Cemetery: mausoleums and broken plot walls; Black Marsh: sunken stone ruins)
//   * points of interest -- hidden cache chests, a shrine (a 90s blessing) and a guarded hoard (an elite champion and
//     its escort sit on a rich chest that only opens once the champion falls)
// Zones opt in through OW_POI_ZONES; enter* calls owFeatures(g) right after the room is built and owPoiRoll(g) after
// the monsters are spawned. owPoiTick runs every frame (it also counts the shrine blessing down anywhere).
const OW_POI_ZONES = {
  cursedcemetery:{ cache:[1,2], shrine:0.6, hoard:0.5, feat:'cemetery' },
  blackmarsh:    { cache:[2,3], shrine:0.7, hoard:0.7, feat:'marsh' },
  highlands:     { cache:[2,3], shrine:0.7, hoard:0.7, feat:null },   // v527
  redridge:      { cache:[2,3], shrine:0.7, hoard:0.7, feat:null },   // v527 (each half of the canyon rolls its own)
};
const OW_SHRINES = {
  fury:   { name:'Shrine of Fury',    col:'255,120,70',  icon:'\u{1F525}', desc:'+25% damage' },
  wisdom: { name:'Shrine of Wisdom',  col:'120,180,255', icon:'\u{1F4D6}', desc:'+30% experience' },
  fortune:{ name:'Shrine of Fortune', col:'255,210,80',  icon:'\u{1F4B0}', desc:'+40% magic find and gold find' },
};
const OW_SHRINE_T = 90;
function owShrineMult(p, kind){
  const s = p && p.owShrine; if(!s || !(s.t>0) || s.kind!==kind) return 1;
  return kind==='fury' ? 1.25 : kind==='wisdom' ? 1.3 : 1;
}
function owShrineFortune(p){ return (p && p.owShrine && p.owShrine.t>0 && p.owShrine.kind==='fortune') ? 40 : 0; }
// open ground for a feature or a point of interest: on the map, off obstacles and water, away from gates/waypoints/where you stand
function owSpotOk(g, room, x, y, r){
  if(x < 160 || y < 160 || x > room.w-160 || y > room.h-160) return false;
  if(posBlockedByObstacles(x, y, r, room.obstacles)) return false;
  if(g.scene==='blackmarsh'){ if(!room.dryOK || !room.dryOK(x, y, r) || bmTrailDist(x, y) < r+70) return false; }
  if(room.isMtn && room.B){   // v527: height-field zones -- flat, open ground you can actually walk to
    if(!room._owReach){ const q = g.player || room.waypoint || {x:room.w/2, y:room.h/2}; room._owReach = terrReach(room, q.x, q.y); }
    const e0 = crTileE(room, x, y);
    for(const [dx,dy] of [[0,0],[r,0],[-r,0],[0,r],[0,-r],[r*0.7,r*0.7],[-r*0.7,-r*0.7]]){
      if(!terrWalkAt(room, x+dx, y+dy) || Math.abs(crTileE(room, x+dx, y+dy)-e0) > CR_STEP) return false;
    }
    if(!terrReachNear(room, room._owReach, x, y, 10)) return false;
    for(const c of (room.camps||[]).concat(room.camp ? [room.camp] : [])) if(dist({x,y}, c) < r+500) return false;
    for(const t of (room.towers||[])) if(dist({x,y}, t) < r+300 || dist({x,y}, t.door) < r+200) return false;
  }
  if(g.scene==='cursedcemetery'){ if(cemRoadDist(x, y) < CEM_ROAD_HALFW + r + 40) return false; if(room.statue && dist({x,y}, room.statue) < r+460) return false; if(room.camp && dist({x,y}, room.camp) < r+500) return false; if(room.tomb && dist({x,y}, room.tomb) < r+200) return false; }
  for(const q of spawnSafePoints(g)) if(Math.hypot(x-q.x, y-q.y) < 380 + r) return false;
  return true;
}
function owFindSpot(g, room, r, avoid, gap){
  for(let t=0;t<500;t++){
    const x = rand(160, room.w-160), y = rand(160, room.h-160);
    if(!owSpotOk(g, room, x, y, r)) continue;
    if(avoid && avoid.some(a=>Math.hypot(x-a.x, y-a.y) < (gap||500))) continue;
    return {x, y};
  }
  return null;
}
function owFeatures(g){
  const cfg = OW_POI_ZONES[g.scene], room = g.room; if(!cfg || !room) return;
  const anchors = (room.packAnchors||[]).concat(room.landAnchors||[]);
  const placed = [];
  const blockOk = (o)=>{
    for(const a of anchors) if(a.x > o.x-90 && a.x < o.x+o.w+90 && a.y > o.y-90 && a.y < o.y+o.h+90) return false;
    for(let x=o.x; x<=o.x+o.w; x+=Math.max(20, o.w/3)) for(let y=o.y; y<=o.y+o.h; y+=Math.max(20, o.h/3)) if(!owSpotOk(g, room, x, y, 30)) return false;
    return true;
  };
  const push = (o)=>{ room.obstacles.push(o); if(room.dryObstacles) room.dryObstacles.push(o); };
  if(cfg.feat==='cemetery'){
    // 2-3 mausoleums and 2-3 broken plot walls (low, with a gap to walk through)
    for(let n=0, t=0; n<rand(2,4)|0 && t<80; t++){
      const s = owFindSpot(g, room, 90, placed, 380); if(!s) break;
      const o = {x:Math.round(s.x-60), y:Math.round(s.y-45), w:120, h:90, col:['#8a857a','#35322c','#5c584f'], hz:44, owFeat:true, mausoleum:true};
      if(!blockOk(o)) continue; push(o); placed.push(s); n++;
    }
    for(let n=0, t=0; n<rand(2,4)|0 && t<80; t++){
      const s = owFindSpot(g, room, 100, placed, 320); if(!s) break;
      const L = Math.round(rand(160, 240)), horiz = Math.random()<0.5, gapAt = rand(0.3, 0.7), gapW = 70;
      const segs = horiz ? [{x:s.x-L/2, y:s.y-8, w:L*gapAt-gapW/2, h:16}, {x:s.x-L/2+L*gapAt+gapW/2, y:s.y-8, w:L*(1-gapAt)-gapW/2, h:16}]
                         : [{x:s.x-8, y:s.y-L/2, w:16, h:L*gapAt-gapW/2}, {x:s.x-8, y:s.y-L/2+L*gapAt+gapW/2, w:16, h:L*(1-gapAt)-gapW/2}];
      const os = segs.filter(q=>q.w>20 || q.h>20).map(q=>({x:Math.round(q.x), y:Math.round(q.y), w:Math.round(q.w), h:Math.round(q.h), col:['#6e6a62','#2c2a26','#4a4740'], hz:22, owFeat:true}));
      if(!os.every(blockOk)) continue; os.forEach(push); placed.push(s); n++;
    }
  } else if(cfg.feat==='marsh'){
    // 4-6 sunken ruins: broken L-shaped stone walls half swallowed by the bog
    for(let n=0, t=0; n<rand(4,7)|0 && t<120; t++){
      const s = owFindSpot(g, room, 110, placed, 600); if(!s) break;
      const a = Math.round(rand(140, 220)), b = Math.round(rand(100, 170)), sx = Math.random()<0.5 ? 1 : -1, sy = Math.random()<0.5 ? 1 : -1, hz = Math.round(rand(26, 44));
      const col = ['#6a7262','#2a3026','#4a5244'];
      const os = [{x:s.x - (sx>0 ? 0 : a), y:s.y-9, w:a, h:18}, {x:s.x-9, y:s.y - (sy>0 ? 0 : b), w:18, h:b}].map(q=>({x:Math.round(q.x), y:Math.round(q.y), w:q.w, h:q.h, col, hz, owFeat:true, ruin:true, seed:Math.random()}));
      if(Math.random()<0.4) os[0].w = Math.round(os[0].w*0.6);   // crumbled short
      if(!os.every(blockOk)) continue; os.forEach(push); placed.push(s); n++;
    }
  }
}
function owPoiRoll(g){
  const cfg = OW_POI_ZONES[g.scene], room = g.room;
  g.owPoi = []; g.owPoiRoom = room;
  if(!cfg || !room) return;
  const taken = [];
  const nCache = cfg.cache[0] + Math.floor(Math.random()*(cfg.cache[1]-cfg.cache[0]+1));
  for(let i=0;i<nCache;i++){ const s = owFindSpot(g, room, 40, taken, 700); if(s){ g.owPoi.push({kind:'cache', x:s.x, y:s.y, r:24, opened:false}); taken.push(s); } }
  if(Math.random() < cfg.shrine){
    const s = owFindSpot(g, room, 50, taken, 700), keys = Object.keys(OW_SHRINES);
    if(s){ g.owPoi.push({kind:'shrine', x:s.x, y:s.y, r:45, sk:keys[Math.floor(Math.random()*keys.length)], used:false}); taken.push(s); }
  }
  if(Math.random() < cfg.hoard){
    const s = owFindSpot(g, room, 120, taken, 800);
    const types = g.enemies.filter(e=>e.hp>0 && specialEligible(e) && !e.herdId && !e.flying && !e.campFire && !e.stormRaptor && e.type!=='giant').map(e=>e.type);
    const type = types.length ? types[Math.floor(Math.random()*types.length)] : ({blackmarsh:'zombie', highlands:'warg', redridge:'raptor'}[g.scene] || 'skeleton');
    if(s){
      const chest = {kind:'hoard', x:s.x, y:s.y, r:26, opened:false, guards:[]};
      const boss = spawnEnemy(g, type, {x:s.x+60, y:s.y+40});
      if(boss){ makeElite(boss, pickMods(3)); boss.owHoardGuard = true; boss.homeX = boss.x; boss.homeY = boss.y; boss.aggroRange = Math.max(boss.aggroRange||200, 260); chest.guards.push(boss); }
      for(let k=0;k<3;k++){ const a = k*2.1+Math.random(), e = spawnEnemy(g, type, {x:s.x+Math.cos(a)*110, y:s.y+Math.sin(a)*90}); if(e){ e.owHoardGuard = true; e.homeX = e.x; e.homeY = e.y; chest.guards.push(e); } }
      g.owPoi.push(chest); taken.push(s);
    }
  }
}
function owLootChest(g, c, rich){
  const p = g.player, lvl = Math.max(1, monsterLevel(g)), n0 = g.loot.length;
  const drop = (rar)=> g.loot.push({type:'item', x:c.x+rand(-30,30), y:c.y+rand(26,50), r:8, item:generateItem(lvl, rar, null, null, p)});
  if(rich){ drop('rare'); drop(packRarity(lvl)); drop(packRarity(lvl)); }
  else { drop(packRarity(lvl)); if(Math.random()<0.6) drop(packRarity(lvl)); }
  g.loot.push({type:'gold', x:c.x+rand(-20,20), y:c.y+rand(26,46), r:9, amt:Math.ceil((rand(30,60)+g.depth*3)*(rich?2.5:1)*(1+clamp((p.goldFindPct||0),0,200)/100))});
  for(let i=n0;i<g.loot.length;i++) fixLootSpot(g, g.loot[i]);
  g.particles.push({type:'burst', x:c.x, y:c.y, t:0.45, max:0.45, color:'#e8c44a'});
  try{ sfxPlay('chest', 1); }catch(e){}
}
function owPoiTick(g, p, dt){
  if(p.owShrine && p.owShrine.t>0){
    p.owShrine.t -= dt;
    if(p.owShrine.t<=0){ const k = p.owShrine.kind; p.owShrine = null; if(k==='fortune') recalcStats(p); showMsg('The shrine\'s blessing fades', 2.0); }
  }
  if(!g.owPoi || g.owPoiRoom!==g.room || !g.owPoi.length) return;
  for(const c of g.owPoi){
    if(c.kind==='cache'){
      if(!c.opened && dist(p, c) < c.r + p.r + 4){ c.opened = true; owLootChest(g, c, false); showMsg('A hidden cache', 1.8); }
    } else if(c.kind==='hoard'){
      if(!c.free && c.guards.every(e=>!(e.hp>0) || !g.enemies.includes(e))){ c.free = true; showMsg('The hoard is unguarded', 2.0, '#e8c44a'); }
      if(!c.opened && dist(p, c) < c.r + p.r + 4){
        if(c.free){ c.opened = true; owLootChest(g, c, true); showMsg('A guarded hoard!', 2.2, '#e8c44a'); saveGame(); }
        else if(!(c.warnT>0)){ c.warnT = 3; showMsg('The hoard is guarded -- slay its champion first', 2.0, '#ff9a7a'); }
      }
      if(c.warnT>0) c.warnT -= dt;
    } else if(c.kind==='shrine'){
      if(!c.used && dist(p, c) < c.r + p.r + 6){
        c.used = true; const S = OW_SHRINES[c.sk];
        p.owShrine = {kind:c.sk, t:OW_SHRINE_T};
        if(c.sk==='fortune') recalcStats(p);
        showMsg(S.name+': '+S.desc+' for '+OW_SHRINE_T+'s', 3.0, 'rgb('+S.col+')');
        g.particles.push({type:'ring', x:c.x, y:c.y, t:0.6, max:0.6, r:90, color:'rgb('+S.col+')'});
        try{ sfxPlay('banner', 0.8); }catch(e){}
      }
    }
  }
}
function pushOwPoiDrawables(g, drawables){
  if(!g.owPoi || g.owPoiRoom!==g.room) return;
  for(const c of g.owPoi){
    if(c.kind==='shrine') drawables.push({depth:c.x+c.y, draw:()=>drawOwShrineIso(c, g.clock||0)});
    else drawables.push({depth:c.x+c.y, draw:()=>{ drawChestIso(c); if(c.kind==='hoard' && !c.opened) drawOwHoardGlow(c, g.clock||0); }});
  }
}
function drawOwHoardGlow(c, t){
  const iso = toIso(c.x, c.y), col = c.free ? '255,210,90' : '255,90,70', a = 0.35+0.2*Math.sin(t*3);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, 0.5);
  ctx.strokeStyle = 'rgba('+col+','+a+')'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.stroke();
  ctx.restore();
}
// a weathered standing stone with a rune that glows in the shrine's colour (dims once used)
function drawOwShrineIso(s, t){
  const iso = toIso(s.x, s.y), S = OW_SHRINES[s.sk], used = s.used, a = used ? 0.15 : 0.55+0.3*Math.sin(t*2.6);
  drawShadow(iso.x, iso.y, 39, 15);   // v548: 1.5x the stone, 2x the glow at its foot
  ctx.save(); ctx.translate(iso.x, iso.y);
  if(!used){ ctx.save(); ctx.scale(1, 0.5); const gr = ctx.createRadialGradient(0,0,6,0,0,120); gr.addColorStop(0,'rgba('+S.col+','+(a*0.5)+')'); gr.addColorStop(1,'rgba('+S.col+',0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0,0,120,0,7); ctx.fill(); ctx.restore(); }
  ctx.scale(1.5, 1.5);
  ctx.fillStyle = '#6e6a60'; ctx.strokeStyle = '#26241f'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-11, -46); ctx.lineTo(-4, -54); ctx.lineTo(9, -50); ctx.lineTo(14, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a857a'; ctx.beginPath(); ctx.moveTo(-11,-46); ctx.lineTo(-4,-54); ctx.lineTo(9,-50); ctx.lineTo(2,-44); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.shadowColor = 'rgb('+S.col+')'; ctx.shadowBlur = used ? 0 : 10; ctx.strokeStyle = 'rgba('+S.col+','+(used ? 0.3 : 0.95)+')'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(0,-40); ctx.lineTo(0,-16); ctx.moveTo(-6,-34); ctx.lineTo(6,-24); ctx.moveTo(6,-34); ctx.lineTo(-6,-24); ctx.stroke(); ctx.restore();
  ctx.restore();
}
// a small stone mausoleum: walls, a pyramid roof with a cross, and a dark sealed doorway on the front
function drawOwMausoleum(o){
  const hz = o.hz||44;
  drawBlock(o, hz, o.col[0], o.col[1], o.col[2]);
  const c0=toIso(o.x,o.y), c1=toIso(o.x+o.w,o.y), c2=toIso(o.x+o.w,o.y+o.h), c3=toIso(o.x,o.y+o.h), ap = toIso(o.x+o.w/2, o.y+o.h/2);
  const top = hz+4, peak = hz+40;
  ctx.save(); ctx.strokeStyle = 'rgba(20,18,15,0.6)'; ctx.lineWidth = 1;
  const tri = (a,b,col)=>{ ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(a.x, a.y-top); ctx.lineTo(b.x, b.y-top); ctx.lineTo(ap.x, ap.y-peak); ctx.closePath(); ctx.fill(); ctx.stroke(); };
  tri(c0, c1, '#6e6a62'); tri(c3, c0, '#5a564e'); tri(c1, c2, '#4a4740'); tri(c2, c3, '#7c776d');
  // cross on the apex
  ctx.strokeStyle = '#3a3730'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ap.x, ap.y-peak); ctx.lineTo(ap.x, ap.y-peak-18); ctx.moveTo(ap.x-6, ap.y-peak-12); ctx.lineTo(ap.x+6, ap.y-peak-12); ctx.stroke();
  // sealed doorway in the middle of the front face
  const m = {x:(c2.x+c3.x)/2, y:(c2.y+c3.y)/2};
  ctx.fillStyle = '#16140f'; ctx.beginPath(); ctx.moveTo(m.x-9, m.y-2); ctx.lineTo(m.x-9, m.y-24); ctx.quadraticCurveTo(m.x, m.y-34, m.x+9, m.y-24); ctx.lineTo(m.x+9, m.y-2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(90,120,70,0.35)'; ctx.beginPath(); ctx.ellipse(c3.x+10, c3.y-6, 14, 5, 0, 0, 7); ctx.fill();   // moss at the foot
  ctx.restore();
}
// a broken, moss-streaked stone wall sinking into the bog
function drawOwRuin(o){
  const hz = o.hz||34;
  drawBlock(o, hz, o.col[0], o.col[1], o.col[2]);
  const c0=toIso(o.x,o.y), c1=toIso(o.x+o.w,o.y), c2=toIso(o.x+o.w,o.y+o.h), c3=toIso(o.x,o.y+o.h);
  ctx.save();
  ctx.fillStyle = 'rgba(70,100,50,0.55)';
  const n = 3, sd = o.seed||0.5;
  for(let i=0;i<n;i++){ const t = (i+0.5)/n, x = c3.x+(c2.x-c3.x)*t, y = c3.y+(c2.y-c3.y)*t; ctx.beginPath(); ctx.ellipse(x, y-hz*(0.3+0.4*((sd*7+i)%1)), 6, 3+((sd*13+i)%1)*6, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = 'rgba(20,24,18,0.5)';   // a bite out of the top
  const b = 0.3+0.4*sd, bx = c0.x+(c1.x-c0.x)*b, by = c0.y+(c1.y-c0.y)*b;
  ctx.beginPath(); ctx.ellipse(bx, by-hz, 10, 5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(10,22,14,0.45)'; ctx.beginPath(); ctx.ellipse((c2.x+c3.x)/2, (c2.y+c3.y)/2+2, Math.abs(c2.x-c3.x)/2+10, 6, 0, 0, 7); ctx.fill();   // sunk in the water line
  ctx.restore();
}
