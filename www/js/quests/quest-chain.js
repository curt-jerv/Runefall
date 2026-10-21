// ---- v273 quest-chain foundation ----
// Progression gates. (Transitional: the legacy flags still open them until the new encounters replace those events.)
function snowWallOpen(p){ return !!(p && p.snowWallOpen); }
function hasFhKeyItem(p){ return !!(p && (p.inventory||[]).some(it=>it.questId==='fh_dungeon_key')); }
// v402: the key is spent at the door. Once placed (p.fhDungeonOpen) the door stays open forever.
// Older saves that already hold fhDungeonKey but no key item (or have cleared the dungeon) count as open.
function fhDungeonUnlocked(p){ return !!(p && (p.fhDungeonOpen || p.fhDungeonDone)); }   // v452: only the key-turning sequence (placeFhKey) opens it -- having the key elsewhere no longer counts
function placeFhKey(){
  const p = game.player;
  showNpcText('The Great Door', 'A heavy dwarven lock is set into the door. The Commander\'s key fits it exactly. Once turned, it cannot be taken back.', 'Place the Key', ()=>{
    const it = (p.inventory||[]).find(i=>i.questId==='fh_dungeon_key'); if(!it) return;
    p.inventory.splice(p.inventory.indexOf(it), 1);
    p.fhDungeonOpen = true;
    shakeScreen(game, 4, 0.5);
    showMsg('The key turns and crumbles. The great door grinds open -- for good.', 3.4, '#ffd27a');
    bagPulse(); saveGame();
  });
}
function redridgeWallOpen(p){ return !!(p && p.redridgeWallOpen); }
// NPC quest markers: a '!' shows over an NPC whenever their quest state has changed; talking to them clears it.
function npcMark(p, id, on){ if(!p) return; if(!p.npcMarks) p.npcMarks = {}; p.npcMarks[id] = (on===undefined) ? true : !!on; }
function npcHasMark(p, id){ return !!(p && p.npcMarks && p.npcMarks[id]); }
// Interactables the player currently needs to use glow softly. Per-scene rules live here; later content pushes into g.extraGlows.
function collectGlows(g, p){
  const out = [];
  if(!g || !p) return out;
  if(g.extraGlows) for(const x of g.extraGlows) out.push(x);
  if(g.scene==='icyzone' && g.iz && g.iz.altar && ((g.iz.protectorsDown && (p.shrineStage||0)<3) || ((p.shrineStage||0)===0 && findRunestone(p)))) out.push({x:g.iz.altar.x, y:g.iz.altar.y, c:'#9fe0ff', r:54});
  if(g.scene==='frosthold' && g.fh){
    const d = g.fh.gates.find(q=>q.id==='dungeon');
    if(d && fhDungeonUnlocked(p) && !p.fhDungeonDone) out.push({x:d.x, y:d.y, c:'#ffd27a', r:70});
  }
  if(g.scene==='lighthouse' && g.tower && g.tower.subzone==='highward'){ const t = g.tower; if(t.altar && hwAltarReady(p)) out.push({x:t.altar.x, y:t.altar.y, c:'#ffe08a', r:70}); if(t.hwSwitch && hwSwitchReady(p)) out.push({x:t.hwSwitch.x, y:t.hwSwitch.y, c:'#ffd060', r:56}); }
  if(g.scene==='darkcrypt' && g.crypt && g.crypt.bossDone && !p.inscriptionTaken && g.crypt.tomb) out.push({x:g.crypt.tomb.x, y:g.crypt.tomb.y+90, c:'#c8b0ff', r:70});
  if(g.scene==='lakesideruins' && g.lake && p.scholarMeet && !p.ruinsEntranceOpen && !(g.lake.event && g.lake.event.active)){
    if(!p.ruinsEvent) out.push({x:g.lake.scholarSpot.x, y:g.lake.scholarSpot.y, c:'#ffd27a', r:60});
    else if(p.ruinsEvent===1) out.push({x:g.lake.ruinsSpot.x, y:g.lake.ruinsSpot.y, c:'#3ad4ff', r:90});
  }
  if(g.scene==='ancientruins' && g.ruins && g.ruins.husk && !g.ruins.husk.taken) out.push({x:g.ruins.husk.x, y:g.ruins.husk.y, c:'#9fe4ff', r:90});
  if(g.scene==='ancientruins' && g.ruins && g.ruins.templeStairs) out.push({x:g.ruins.templeStairs.x, y:g.ruins.templeStairs.y, c:'#3ad4ff', r:70});
  if(g.scene==='lighthouse' && g.tower && g.tower.subzone==='temple' && g.tower.stairsDown) out.push({x:g.tower.stairsDown.x, y:g.tower.stairsDown.y, c:'#3ad4ff', r:70});
  return out;
}
function drawGlowIso(gl, clock){
  const q = toIso(gl.x, gl.y), pulse = 0.5+0.5*Math.sin(clock*2.4), r = (gl.r||46)*(0.92+0.1*pulse);
  ctx.save(); ctx.translate(q.x, q.y); ctx.scale(1, 0.5); ctx.globalCompositeOperation = 'lighter';
  const gr = ctx.createRadialGradient(0,0,2,0,0,r); gr.addColorStop(0, gl.c||'#ffd27a'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.28+0.22*pulse; ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0,0,r,0,7); ctx.fill();
  ctx.restore();
}
function drawQuestMarkIso(x, y, t, dy){
  const q = toIso(x, y), ey = q.y-(dy||60)+Math.sin(t*3)*3;
  ctx.save(); ctx.font = "bold 20px Cinzel, Georgia, 'Times New Roman', serif"; ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd93a'; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3;
  ctx.strokeText('!', q.x, ey); ctx.fillText('!', q.x, ey); ctx.restore();
}
function drawSnowWallIso(pos){
  const q = toIso(pos.x, pos.y);
  ctx.save(); ctx.translate(q.x, q.y-6);
  const lumps = [[-74,2,62,30],[-34,-2,70,40],[16,0,74,44],[62,4,60,32],[-54,-26,58,34],[0,-34,70,42],[48,-28,54,32],[-18,-58,60,34],[26,-60,48,28],[0,-82,44,24]];
  for(const [lx,ly,rx,ry] of lumps){
    const gr = ctx.createLinearGradient(0,ly-ry,0,ly+ry); gr.addColorStop(0,'#f4f9ff'); gr.addColorStop(0.6,'#cfe0f0'); gr.addColorStop(1,'#8fa8c4');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(lx, ly, rx, ry, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(90,120,160,0.45)'; ctx.lineWidth = 1.2; ctx.stroke();
  }
  ctx.restore();
}
function drawDwarfWallIso(pos, clock){
  const q = toIso(pos.x, pos.y), pulse = 0.5+0.5*Math.sin(clock*1.8);
  ctx.save(); ctx.translate(q.x, q.y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 6, 78, 20, 0, 0, 7); ctx.fill();
  const gr = ctx.createLinearGradient(-60,-170,60,0); gr.addColorStop(0,'#5a5f68'); gr.addColorStop(0.5,'#3a3e46'); gr.addColorStop(1,'#24272d');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-70,2); ctx.lineTo(-70,-150); ctx.lineTo(-48,-174); ctx.lineTo(48,-174); ctx.lineTo(70,-150); ctx.lineTo(70,2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,170,70,'+(0.45+0.4*pulse)+')'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-46,-20); ctx.lineTo(-46,-120); ctx.lineTo(-18,-140); ctx.lineTo(18,-140); ctx.lineTo(46,-120); ctx.lineTo(46,-20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-140); ctx.lineTo(0,-30); ctx.moveTo(-46,-80); ctx.lineTo(46,-80); ctx.stroke();
  ctx.fillStyle = 'rgba(255,190,90,'+(0.5+0.4*pulse)+')'; ctx.beginPath(); ctx.arc(0,-80,9,0,7); ctx.fill();
  ctx.fillStyle = '#9a9fa8'; for(const [rx,ry] of [[-60,-140],[60,-140],[-60,-10],[60,-10]]){ ctx.beginPath(); ctx.arc(rx,ry,3.5,0,7); ctx.fill(); }
  ctx.restore();
}
// v449: redrawn north-up -- the mountains (Icy Summit, Frosthold, Redridge, Cliffside, Shadow Keep) to the north,
// the lowlands (River Valley, Withered Crossroads, Cursed Cemetery, Lakeside, Black Marsh) to the south, matching each zone's gates.
const WM_NODES = {
  town:{x:9,y:52,t:'Mistfall',l:'',up:1}, forest:{x:26,y:50,t:'Dark Forest',l:'1'},
  river:{x:30,y:66,t:'River Valley',l:'6',f:'reachedRiverValley',dir:'l'}, sunlit:{x:44,y:78,t:'Withered Crossroads',l:'8',f:'reachedSunlitPlains',up:1},
  lighthouse:{x:25,y:85,t:'Lighthouse Tower',l:'9-15',f:'reachedLighthouseTower'}, cemetery:{x:48,y:96,t:'Cursed Cemetery',l:'17',f:'reachedCursedCemetery',dir:'r'},
  lakeside:{x:66,y:78,t:'Lakeside Ruins',l:'21',f:'reachedLakesideRuins'}, marsh:{x:90,y:80,t:'Black Marsh',l:'28',f:'reachedBlackMarsh'}, highlands:{x:62,y:54,t:'Barren Highlands',l:'32',f:'reachedHighlands'},
  pass:{x:36,y:34,t:'Mountain Pass',l:'33',f:'reachedMountainPass',dir:'l'}, summit:{x:36,y:15,t:'Icy Summit',l:'35',f:'reachedIcySummit',dir:'l'}, shrine:{x:54,y:10,t:'Mountain Top Shrine',l:'37',dir:'r'},
  frosthold:{x:58,y:33,t:'Frosthold Keep',l:'39',f:'frostholdUnlocked',up:1}, redridge:{x:82,y:36,t:'Redridge Canyon',l:'42',f:'reachedRedridge'}, highward:{x:90,y:19,t:'Highward Fortress',l:'46-50',f:'reachedHighwardWp',dir:'l'},
  cliffside:{x:102,y:24,t:'Cliffside Ascent',l:'55',f:'reachedCliffWp'}, keep:{x:117,y:13,t:'Shadow Keep',l:'61-69',f:'reachedKeepWp'},
};
const WM_EDGES = [['town','forest'],['forest','river'],['river','sunlit'],['sunlit','lighthouse'],['sunlit','cemetery'],['sunlit','lakeside'],['lakeside','marsh'],['marsh','highlands'],['highlands','pass'],['pass','summit'],['pass','frosthold'],['summit','shrine'],['frosthold','redridge'],['redridge','highward'],['highward','cliffside'],['cliffside','keep']];
function wmCurrent(){
  const g = game; if(!g) return null;
  // dungeons resolve to the overworld zone they are entered from
  const t = g.tower;
  const m = {town:'town',tavern:'town',forest:'forest',spiderlair:'forest',bearcave:'forest',rivervalley:'river',minotaurcave:'river',sunlitplains:'sunlit',
    lighthouse:(t&&t.deep)?'pass':(t&&t.subzone)?((t.subzone==='sunken'||t.subzone==='temple')?'lakeside':t.subzone==='highward'?'highward':t.subzone==='rrtower'?'redridge':'marsh'):(t&&t.fht)?'frosthold':(t&&t.ft)?'marsh':'lighthouse',
    cursedcemetery:'cemetery',darkcrypt:'cemetery',lakesideruins:'lakeside',ancientruins:'lakeside',blackmarsh:'marsh',highlands:'highlands',mountainpass:'pass',frosthold:'frosthold',redridge:'redridge',redcrater:'redridge',raptorlair:'redridge'};
  if(g.scene==='ancientruins' && g.ruins && g.ruins.fhd) return 'frosthold';
  if(g.scene==='dungeon') return null;
  if(g.scene==='icyzone') return g.iz && g.iz.kind==='shrine' ? 'shrine' : 'summit';
  if(isCliff(g)) return 'cliffside';
  if(g.scene==='lighthouse' && g.tower && g.tower.subzone==='keep') return 'keep';
  return m[g.scene] || null;
}
// (v248) every zone you've actually been inside lights up on the world map, whatever its waypoint flags say
function wmMark(g, p){ if(!g || !p) return; if(p.fhtRuneTaken){ (p.wmSeen||(p.wmSeen={})).fhtower = true; } if(p.lighthouseBeaconOn || p.lighthouseFloor5Cleared){ (p.wmSeen||(p.wmSeen={})).lighthouse = true; } if(p.witchRescued){ (p.wmSeen||(p.wmSeen={})).tower = true; } const c = wmCurrent(); if(c){ if(!p.wmSeen) p.wmSeen = {}; if(!p.wmSeen[c]) p.wmSeen[c] = true; if(c==='frosthold' && !p.wmSeen.frosthold) p.wmSeen.frosthold = true; } }
function wmRand(seed){ let t = seed>>>0; return ()=>((t = (t*1664525 + 1013904223)>>>0)/4294967296); }
const WM_BIOME = {highlands:'#7a7058', town:'#8a7a52', forest:'#2c5a34', river:'#4a7a56', sunlit:'#b9a85a', lighthouse:'#6a7482', cemetery:'#4a4658', lakeside:'#4a7e78', marsh:'#3a5e52', pass:'#6c6a72', summit:'#c9d5e6', shrine:'#c9d5e6', frosthold:'#8fa2bc', redridge:'#a8553a', highward:'#7c7a74', cliffside:'#6e6258', keep:'#3e2c40'};
let wmAnim = 0, wmLand = null, wmLandKey = '';
const wmLabelRects = [];
const WM_OFS = 7, WM_OFY = 6;
// The painted continent (land, biomes, details) -- cached per size; fog / glow / roads / labels are drawn on top each open.
function wmPaintLand(CW, CH, sc, dpr){
  const key = CW+'x'+CH+'@'+dpr; if(wmLand && wmLandKey===key) return wmLand;
  const mk = ()=>{ const c = document.createElement('canvas'); c.width = CW*dpr; c.height = CH*dpr; const x = c.getContext('2d'); x.scale(dpr*sc, dpr*sc); return [c,x]; };
  const [oc, o] = mk(), [lc, l] = mk();
  const VW = CW/sc, VH = CH/sc, rnd = wmRand(4242);
  // ocean
  const og = o.createLinearGradient(0,0,0,VH); og.addColorStop(0,'#10162a'); og.addColorStop(1,'#0b1020'); o.fillStyle = og; o.fillRect(0,0,VW,VH);
  o.strokeStyle = 'rgba(120,160,210,.07)'; o.lineWidth = 0.18;
  for(let i=0;i<150;i++){ const x = rnd()*VW, y = rnd()*VH, r = 1+rnd()*2; o.beginPath(); o.arc(x,y,r,Math.PI*1.1,Math.PI*1.9); o.stroke(); }
  // land blobs (everything below is drawn WM_OFS to the right so the western coast isn't cut by the frame)
  o.translate(WM_OFS,WM_OFY); l.translate(WM_OFS,WM_OFY);
  // v460: one continuous continent -- the only coastline is the west coast (Mistfall's harbour, the Lighthouse cape); land runs off the other three edges
  const coastPts = [[-8,5],[6,7.5],[20,8.5],[34,4.5],[44,1.5],[52,0.4],[60,2],[68,6.5],[76,13],[82,19.5],[87,20.5],[93,15],[100,10.5],[106,9],[118,9]];
  const coastX = y=>{ let i=0; while(i<coastPts.length-2 && coastPts[i+1][0]<y) i++; const [y0,x0]=coastPts[i], [y1,x1]=coastPts[i+1]; const t=Math.max(0,Math.min(1,(y-y0)/(y1-y0))), u=t*t*(3-2*t); return x0+(x1-x0)*u + Math.sin(y*0.9)*0.55 + Math.sin(y*2.3+1)*0.3; };
  // v489: an eastern coastline too -- the sea lies beyond Shadow Keep
  const eastX = y=>126 + y*0.06 + Math.sin(y*0.7+2)*1.6 + Math.sin(y*1.9)*0.5;
  const landPath = (ctx, off)=>{ ctx.beginPath(); ctx.moveTo(coastX(-WM_OFY-2)-off, -WM_OFY-2); for(let y=-WM_OFY-2; y<=VH; y+=0.5) ctx.lineTo(coastX(y)-off, y); for(let y=VH; y>=-WM_OFY-2; y-=0.5) ctx.lineTo(eastX(y)+off, y); ctx.closePath(); };
  o.fillStyle = 'rgba(70,110,160,.10)'; landPath(o, 7); o.fill();
  o.fillStyle = 'rgba(70,110,160,.16)'; landPath(o, 3.6); o.fill();
  o.strokeStyle = 'rgba(150,190,230,.22)'; o.lineWidth = 0.25; for(const d of [1.6,2.8]){ o.beginPath(); for(let y=-WM_OFY-2; y<=VH; y+=0.5){ const x = coastX(y)-d-Math.sin(y*1.7)*0.3; if(y===-WM_OFY-2) o.moveTo(x,y); else o.lineTo(x,y); } o.stroke(); o.beginPath(); for(let y=-WM_OFY-2; y<=VH; y+=0.5){ const x = eastX(y)+d+Math.sin(y*1.7)*0.3; if(y===-WM_OFY-2) o.moveTo(x,y); else o.lineTo(x,y); } o.stroke(); }
  l.fillStyle = '#b8a8d4'; landPath(l, 0.55); l.fill();
  l.fillStyle = '#566344'; landPath(l, 0); l.fill();
  l.globalCompositeOperation = 'source-atop';
  // biome field: every point of land takes the colour of its nearest region, softly blended, with a wobbly border
  { const FW = Math.ceil(VW), FH = Math.ceil(VH), fc = document.createElement('canvas'); fc.width = FW; fc.height = FH; const fx = fc.getContext('2d'), im = fx.createImageData(FW, FH);
    const ids = Object.keys(WM_NODES), cols = ids.map(id=>{ const h = WM_BIOME[id]; return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]; });
    for(let py=0; py<FH; py++) for(let px=0; px<FW; px++){
      const X = px-WM_OFS+0.5, Y = py-WM_OFY+0.5, nz = Math.sin(X*0.31+Y*0.17)*2.2 + Math.sin(X*0.11-Y*0.29+2)*2.6 + Math.sin(X*0.73+Y*0.61)*0.8;
      let r=0,g2=0,b=0,ws=0;
      for(let k=0;k<ids.length;k++){ const n = WM_NODES[ids[k]], d = Math.max(1, Math.hypot(X-n.x, Y-n.y) + nz*(k%2?1:-1)*0.6), w = 1/(d*d*d*d); r += cols[k][0]*w; g2 += cols[k][1]*w; b += cols[k][2]*w; ws += w; }
      const o4 = (py*FW+px)*4; im.data[o4] = r/ws; im.data[o4+1] = g2/ws; im.data[o4+2] = b/ws; im.data[o4+3] = 255;
    }
    fx.putImageData(im, 0, 0); l.imageSmoothingEnabled = true; l.drawImage(fc, -WM_OFS, -WM_OFY, FW, FH); }
  const nearestId = (x,y)=>{ let best=null, bd=1e9; for(const id in WM_NODES){ const n = WM_NODES[id], d = Math.hypot(x-n.x,y-n.y); if(d<bd){ bd=d; best=id; } } return [best,bd]; };
  // speckle texture
  for(let i=0;i<900;i++){ l.fillStyle = rnd()<0.5 ? 'rgba(0,0,0,.07)' : 'rgba(255,255,255,.05)'; l.fillRect(rnd()*VW, rnd()*VH, 0.5+rnd()*0.8, 0.5+rnd()*0.8); }
  const near = (id, rad, cnt, fn, seed)=>{ const n = WM_NODES[id], r = wmRand(seed); for(let i=0;i<cnt;i++){ const an = r()*6.28, dd = Math.sqrt(r())*rad; fn(n.x+Math.cos(an)*dd, n.y+Math.sin(an)*dd, r); } };
  // forest: pines
  const pine = (x,y,sz)=>{ l.fillStyle = '#1d3d24'; l.beginPath(); l.moveTo(x,y-sz*1.6); l.lineTo(x-sz*0.75,y); l.lineTo(x+sz*0.75,y); l.fill(); l.fillStyle = '#26502e'; l.beginPath(); l.moveTo(x,y-sz*1.6); l.lineTo(x-sz*0.75,y); l.lineTo(x,y); l.fill(); };
  near('forest',11,60,(x,y,r)=>pine(x,y,0.9+r()*0.7),11);
  near('river',5,8,(x,y,r)=>pine(x,y,0.8+r()*0.5),12); near('town',16,12,(x,y,r)=>pine(x,y,0.8+r()*0.4),13);
  // sunlit plains: golden tufts
  l.strokeStyle = '#d6c36a'; l.lineWidth = 0.22; near('sunlit',13,70,(x,y)=>{ l.beginPath(); l.moveTo(x-0.5,y); l.lineTo(x-0.7,y-0.9); l.moveTo(x,y); l.lineTo(x,y-1.1); l.moveTo(x+0.5,y); l.lineTo(x+0.7,y-0.9); l.stroke(); },21);
  // river + lake
  l.strokeStyle = '#2f6ba3'; l.lineCap = 'round'; l.lineWidth = 1.5; l.beginPath(); l.moveTo(20,56); l.bezierCurveTo(28,58,24,64,32,68); l.bezierCurveTo(40,72,30,82,36,90); l.bezierCurveTo(39,95,30,99,20,98); l.bezierCurveTo(15,97.6,12,99,9,100); l.stroke();
  l.strokeStyle = '#6fb0e0'; l.lineWidth = 0.4; l.stroke();
  const lake = (cx,cy,rx,ry)=>{ l.fillStyle = '#2f6ba3'; l.beginPath(); l.ellipse(cx,cy,rx,ry,-0.2,0,7); l.fill(); l.strokeStyle = '#7fb8e6'; l.lineWidth = 0.35; l.stroke(); l.strokeStyle = 'rgba(255,255,255,.25)'; l.lineWidth = 0.2; l.beginPath(); l.ellipse(cx-1,cy-0.4,rx*0.6,ry*0.4,-0.2,0.2,2.6); l.stroke(); };
  lake(68,82,8,4.4); l.fillStyle = '#7a735f'; l.beginPath(); l.ellipse(68,82,1.9,1.3,0,0,7); l.fill();   // the ruin island
  // marsh: ponds + reeds
  near('marsh',11,6,(x,y,r)=>{ l.fillStyle = '#2f5a62'; l.beginPath(); l.ellipse(x,y,1.5+r()*2,0.8+r()*1.0,0,0,7); l.fill(); },31);
  l.strokeStyle = '#8fb078'; l.lineWidth = 0.2; near('marsh',12,50,(x,y)=>{ l.beginPath(); l.moveTo(x,y); l.lineTo(x-0.2,y-1.3); l.moveTo(x+0.4,y); l.lineTo(x+0.5,y-1.1); l.stroke(); },32);
  // cemetery: crosses
  l.fillStyle = '#b9b4c4'; near('cemetery',7,16,(x,y)=>{ l.fillRect(x-0.15,y-1,0.3,1.3); l.fillRect(x-0.5,y-0.6,1,0.28); },41);
  // mountains
  const peak = (x,y,sz,snow)=>{ l.fillStyle = '#4e4a58'; l.beginPath(); l.moveTo(x,y-sz*1.5); l.lineTo(x+sz*0.95,y); l.lineTo(x-sz*0.95,y); l.fill(); l.fillStyle = '#7b7787'; l.beginPath(); l.moveTo(x,y-sz*1.5); l.lineTo(x-sz*0.95,y); l.lineTo(x-sz*0.1,y); l.fill();
    if(snow){ l.fillStyle = '#eef3fa'; l.beginPath(); l.moveTo(x,y-sz*1.5); l.lineTo(x+sz*0.38,y-sz*0.82); l.lineTo(x+sz*0.05,y-sz*0.95); l.lineTo(x-sz*0.2,y-sz*0.75); l.lineTo(x-sz*0.38,y-sz*0.82); l.fill(); } };
  near('pass',12,22,(x,y,r)=>peak(x,y,1.5+r()*1.4,false),51);
  near('summit',9,18,(x,y,r)=>peak(x,y,1.6+r()*1.6,true),52);
  near('shrine',8,12,(x,y,r)=>peak(x,y,1.5+r()*1.4,true),53);
  near('frosthold',9,14,(x,y,r)=>peak(x,y,1.4+r()*1.2,true),54);
  // v460: fill the open country between regions with each region's own scenery (kept clear of the markers and labels)
  { const r = wmRand(777), tuft = (x,y)=>{ l.strokeStyle = '#d6c36a'; l.lineWidth = 0.22; l.beginPath(); l.moveTo(x-0.5,y); l.lineTo(x-0.7,y-0.9); l.moveTo(x,y); l.lineTo(x,y-1.1); l.moveTo(x+0.5,y); l.lineTo(x+0.7,y-0.9); l.stroke(); };
    const hill = (x,y,sz)=>{ l.fillStyle = '#5f5644'; l.beginPath(); l.ellipse(x,y,sz*1.6,sz*0.8,0,Math.PI,0); l.fill(); l.fillStyle = '#8a7e62'; l.beginPath(); l.ellipse(x-sz*0.3,y,sz*0.9,sz*0.55,0,Math.PI,0); l.fill(); };
    for(let i=0;i<1500;i++){ const x = -WM_OFS + r()*VW, y = -WM_OFY + r()*VH, sz = r(); if(x < coastX(y)+2.5 || x > eastX(y)-2.5) continue;
      const [id, d] = nearestId(x,y); if(d < 8.5) continue; let busy = false; for(const [a,b] of WM_EDGES){ const A = WM_NODES[a], B = WM_NODES[b], vx = B.x-A.x, vy = B.y-A.y, t = Math.max(0,Math.min(1,((x-A.x)*vx+(y-A.y)*vy)/(vx*vx+vy*vy))); if(Math.hypot(A.x+vx*t-x, A.y+vy*t-y) < 2.6){ busy = true; break; } } if(busy) continue;
      if(id==='forest'||id==='town'||id==='river'||id==='lakeside'){ if(r()<0.75) pine(x,y,0.8+sz*0.6); }
      else if(id==='pass'||id==='cliffside'||id==='highward'){ if(r()<0.55) peak(x,y,1.3+sz*1.3,false); }
      else if(id==='summit'||id==='shrine'||id==='frosthold'){ if(r()<0.55) peak(x,y,1.3+sz*1.4,true); }
      else if(id==='sunlit'){ if(r()<0.6) tuft(x,y); }
      else if(id==='highlands'){ if(r()<0.35) hill(x,y,0.8+sz*0.9); else if(r()<0.15) peak(x,y,1+sz,false); }
      else if(id==='redridge'){ if(r()<0.35){ const w = 1.4+sz*1.8, h = 0.8+r()*1.2; l.fillStyle = '#7a3524'; l.fillRect(x-w/2,y-h,w,h+0.5); l.fillStyle = '#c4694a'; l.fillRect(x-w/2,y-h,w,0.5); } }
      else if(id==='marsh'){ if(r()<0.5){ l.strokeStyle = '#8fb078'; l.lineWidth = 0.2; l.beginPath(); l.moveTo(x,y); l.lineTo(x-0.2,y-1.3); l.moveTo(x+0.4,y); l.lineTo(x+0.5,y-1.1); l.stroke(); } else if(r()<0.12){ l.fillStyle = '#2f5a62'; l.beginPath(); l.ellipse(x,y,1.4+sz*1.5,0.7+sz*0.7,0,0,7); l.fill(); } }
      else if(id==='keep'){ if(r()<0.45){ l.fillStyle = '#2a1e2c'; l.beginPath(); l.moveTo(x,y-2-sz*1.6); l.lineTo(x+1.3,y); l.lineTo(x-1.3,y); l.fill(); } }
      else if(id==='cemetery'){ if(r()<0.4){ l.fillStyle = '#2e3a2a'; l.beginPath(); l.arc(x,y-0.6,0.8+sz*0.5,0,7); l.fill(); } }
    }
    near('highlands',11,14,(x,y,rr)=>hill(x,y,0.9+rr()*0.8),71);
    // Mistfall harbour: a little pier and boats
    l.globalCompositeOperation = 'source-over'; l.fillStyle = '#6a5038'; l.fillRect(coastX(52)-3.6, 51.6, 4.4, 0.6);
    for(const [bx,by] of [[coastX(49)-1.5,49.2],[coastX(56)-2.4,56.5]]){ l.fillStyle = '#4a3424'; l.beginPath(); l.moveTo(bx-1.1,by); l.lineTo(bx+1.1,by); l.lineTo(bx+0.7,by+0.6); l.lineTo(bx-0.7,by+0.6); l.fill(); l.fillStyle = '#d8d2c0'; l.beginPath(); l.moveTo(bx,by-1.8); l.lineTo(bx,by-0.1); l.lineTo(bx+0.9,by-0.2); l.fill(); }
    l.globalCompositeOperation = 'source-atop';
  }
  // redridge: red mesas + canyon cracks
  near('redridge',13,18,(x,y,r)=>{ const w = 1.6+r()*2, h = 1+r()*1.4; l.fillStyle = '#7a3524'; l.fillRect(x-w/2,y-h,w,h+0.5); l.fillStyle = '#c4694a'; l.fillRect(x-w/2,y-h,w,0.5); },61);
  l.strokeStyle = '#4a1d14'; l.lineWidth = 0.35; l.beginPath(); l.moveTo(70,36); l.bezierCurveTo(75,40,79,34,85,39); l.bezierCurveTo(88,42,91,39,93,41); l.stroke();
  // cliffside: grey crags; shadow keep: dark peaks around a black fortress
  near('cliffside',10,16,(x,y,r)=>peak(x,y,1.5+r()*1.5,false),62);
  near('keep',9,10,(x,y,r)=>{ l.fillStyle = '#2a1e2c'; l.beginPath(); l.moveTo(x,y-2.4-r()*1.6); l.lineTo(x+1.4,y); l.lineTo(x-1.4,y); l.fill(); },63);
  // settlements / landmarks
  const house = (x,y)=>{ l.fillStyle = '#3a2c22'; l.fillRect(x-0.9,y-0.8,1.8,1.4); l.fillStyle = '#b5543a'; l.beginPath(); l.moveTo(x-1.2,y-0.8); l.lineTo(x,y-1.9); l.lineTo(x+1.2,y-0.8); l.fill(); };
  house(10,51); house(12.6,52.2); house(14,49.8); house(10.8,48.4); house(8.4,53.4);
  const keep = (x,y)=>{ l.fillStyle = '#4a4f62'; l.fillRect(x-2.2,y-1.6,4.4,2.8); for(let i=0;i<4;i++) l.fillRect(x-2.2+i*1.25,y-2.2,0.8,0.7); l.fillStyle = '#2a2d3a'; l.fillRect(x-0.45,y-0.2,0.9,1.4); };
  keep(58,29.6);
  l.fillStyle = '#1c141e'; l.fillRect(114.6,8.6,4.8,3.4); for(let i=0;i<3;i++){ l.fillRect(114.4+i*2,7.2,1,1.6); } l.fillStyle = '#c0303a'; l.fillRect(116.6,10.4,0.8,1.6);   // Shadow Keep
  l.fillStyle = '#e9e4da'; l.fillRect(24.2,79.2,1.6,3.4); l.fillStyle = '#c0453a'; l.fillRect(24.2,80.2,1.6,0.7); l.fillStyle = '#ffd98a'; l.fillRect(24.3,78.6,1.4,0.8);
  l.globalCompositeOperation = 'source-over';
  o.setTransform(1,0,0,1,0,0); o.drawImage(lc,0,0);
  wmLand = oc; wmLandKey = key; return oc;
}
function renderWorldMap(){
  const g = game, p = g.player, box = document.getElementById('regionMapCanvas');
  document.getElementById('regionMapTitle').textContent = 'World Map';
  box.classList.remove('genericMode'); box.style.aspectRatio = ''; box.innerHTML = '';
  cancelAnimationFrame(wmAnim);
  const cur = wmCurrent();
  wmMark(g, p);
  const seen = id=>{ const n = WM_NODES[id]; return id==='town' || !!(p.wmSeen && p.wmSeen[id]) || !!(n.f && n.f!=='frostholdUnlocked' && p[n.f]); };
  const nbr = id=>WM_EDGES.some(([a,b])=>(a===id&&seen(b))||(b===id&&seen(a)));
  const fit = mapFit(box), VW = 150, VH = 110, sc = Math.min(fit.W/VW, fit.H/VH), CW = Math.floor(VW*sc), CH = Math.floor(VH*sc), dpr = fit.dpr;
  const cv = document.createElement('canvas'); cv.width = CW*dpr; cv.height = CH*dpr; cv.style.width = CW+'px'; cv.style.height = CH+'px'; box.appendChild(cv);
  const land = wmPaintLand(CW, CH, sc, dpr);
  // static layer = land + roads + fog/glow + nodes + labels
  const st = document.createElement('canvas'); st.width = CW*dpr; st.height = CH*dpr; const c = st.getContext('2d');
  c.filter = 'sepia(.35) saturate(.72) brightness(.86) contrast(1.08)'; c.drawImage(land,0,0); c.filter = 'none';   // v481: D2 grade
  c.save(); c.scale(dpr*sc, dpr*sc); c.translate(WM_OFS,WM_OFY);
  for(const [a,b] of WM_EDGES){ const A = WM_NODES[a], B = WM_NODES[b], on = seen(a)&&seen(b), d = Math.hypot(B.x-A.x,B.y-A.y), mx = (A.x+B.x)/2 - (B.y-A.y)/d*2.2, my = (A.y+B.y)/2 + (B.x-A.x)/d*2.2;
    c.lineCap = 'round'; c.setLineDash([1.6,1.3]);
    c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = on?1.1:0.8; c.beginPath(); c.moveTo(A.x,A.y); c.quadraticCurveTo(mx,my,B.x,B.y); c.stroke();
    c.strokeStyle = on ? '#f0d890' : 'rgba(160,140,100,.6)'; c.lineWidth = on?0.6:0.4; c.stroke(); }
  c.setLineDash([]);
  for(const id in WM_NODES){ const n = WM_NODES[id];
    if(seen(id)){ const gr = c.createRadialGradient(n.x,n.y,0,n.x,n.y,17); gr.addColorStop(0,'rgba(255,214,140,.34)'); gr.addColorStop(1,'rgba(255,214,140,0)'); c.globalCompositeOperation = 'screen'; c.fillStyle = gr; c.beginPath(); c.arc(n.x,n.y,17,0,7); c.fill(); c.globalCompositeOperation = 'source-over'; }
    else { const gr = c.createRadialGradient(n.x,n.y,2,n.x,n.y,17); gr.addColorStop(0,'rgba(8,6,4,.80)'); gr.addColorStop(0.65,'rgba(8,6,4,.68)'); gr.addColorStop(1,'rgba(8,6,4,0)'); c.fillStyle = gr; c.beginPath(); c.arc(n.x,n.y,17,0,7); c.fill(); } }
  c.restore();
  // frame
  c.restore(); mapFinish(st, dpr);
  // markers + labels in pixel space
  c.save(); c.scale(dpr,dpr);
  const fs = Math.max(9, Math.min(20, sc*2.5)), mr = Math.max(6, sc*1.35);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const txt = (t,x,y,col,f)=>{ c.font = f; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.9)'; c.lineJoin = 'round'; c.strokeText(t,x,y); c.fillStyle = col; c.fillText(t,x,y); };
  const pos = {}; wmLabelRects.length = 0;
  for(const id in WM_NODES){ const n = WM_NODES[id], X = (n.x+WM_OFS)*sc, Y = (n.y+WM_OFY)*sc, on = seen(id), known = on || nbr(id); pos[id] = {X,Y};
    c.beginPath(); c.arc(X,Y,known?mr:mr*0.6,0,7);
    if(on){ c.fillStyle = '#e8c44a'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#000'; c.stroke(); }
    else if(known){ c.fillStyle = '#3a3024'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#9c7f4a'; c.stroke(); }
    else { c.fillStyle = '#211b14'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#5a4a34'; c.stroke(); }
    const sideDir = n.dir==='l' ? -1 : n.dir==='r' ? 1 : 0, dir = n.up ? -1 : 1, nameCol = on?'#f4ead2':'#b8a888', lvCol = on?'#ffd870':'#a89a6a', nameF = 'bold '+fs+'px Alegreya,Georgia,serif', lvF = 'bold '+Math.round(fs*0.9)+'px system-ui';
    const put = (t,x,y,col,f,al)=>{ c.textAlign = al; c.font = f; const wd = c.measureText(t).width; wmLabelRects.push({id,t,x0:al==='left'?x:al==='right'?x-wd:x-wd/2, x1:al==='left'?x+wd:al==='right'?x:x+wd/2, y0:y-parseInt(f.replace(/\D*(\d+)px.*/,'$1'))*0.5, y1:y+parseInt(f.replace(/\D*(\d+)px.*/,'$1'))*0.5}); txt(t,x,y,col,f); };
    if(!known){ put('?', X, Y + dir*(mr+fs*0.6), '#7d705a', 'bold '+fs+'px Alegreya,Georgia,serif','center'); continue; }
    if(sideDir){ const al = sideDir>0 ? 'left' : 'right', tx = X + sideDir*(mr+6); put(n.t, tx, Y - fs*0.55, nameCol, nameF, al); if(n.l) put('Lv '+n.l, tx, Y + fs*0.6, lvCol, lvF, al); }
    else { const y1 = Y + dir*(mr+fs*0.85), y2 = y1 + dir*fs*1.1; if(n.up){ put(n.t, X, y2, nameCol, nameF,'center'); if(n.l) put('Lv '+n.l, X, y1, lvCol, lvF,'center'); } else { put(n.t, X, y1, nameCol, nameF,'center'); if(n.l) put('Lv '+n.l, X, y2, lvCol, lvF,'center'); } }
  }
  c.textAlign = 'center';
  // compass
  const cx = CW-sc*7, cy = CH-sc*8; c.strokeStyle = '#9c7f4a'; c.fillStyle = '#9c7f4a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx,cy-sc*3); c.lineTo(cx+sc*0.7,cy); c.lineTo(cx,cy+sc*3); c.lineTo(cx-sc*0.7,cy); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(cx-sc*2.2,cy); c.lineTo(cx+sc*2.2,cy); c.stroke(); txt('N',cx,cy-sc*3.9,'#e8dcc4','bold '+Math.round(fs*0.9)+'px Alegreya,Georgia,serif');
  c.restore();
  const cx2 = cv.getContext('2d');
  const here = cur && pos[cur], hn = cur && WM_NODES[cur];
  const draw = (ts)=>{
    cx2.setTransform(1,0,0,1,0,0); cx2.drawImage(st,0,0);
    if(here){ cx2.save(); cx2.scale(dpr,dpr); const ph = (ts||0)/1000, pu = (Math.sin(ph*3.2)+1)/2, X = here.X, Y = here.Y;
      cx2.strokeStyle = 'rgba(143,224,106,'+(0.85-pu*0.6)+')'; cx2.lineWidth = 3; cx2.beginPath(); cx2.arc(X,Y,mr+4+pu*mr*1.4,0,7); cx2.stroke();
      cx2.fillStyle = '#8fe06a'; cx2.beginPath(); cx2.arc(X,Y,mr+2,0,7); cx2.fill(); cx2.lineWidth = 2.5; cx2.strokeStyle = '#fff'; cx2.stroke();
      cx2.fillStyle = '#ff7a3d'; cx2.beginPath(); cx2.arc(X,Y,mr*0.5,0,7); cx2.fill();
      const f2 = Math.max(12, Math.min(22, sc*2.7)), dir = hn.up ? 1 : -1, ty = Y + dir*(mr+f2*1.5) + (hn.up?0:0);
      cx2.font = 'bold '+f2+'px system-ui'; cx2.textAlign = 'center'; cx2.textBaseline = 'middle'; cx2.lineWidth = 5; cx2.strokeStyle = 'rgba(0,0,0,.92)'; cx2.lineJoin = 'round'; cx2.strokeText('▼ YOU ARE HERE', X, ty); cx2.fillStyle = '#9af07a'; cx2.fillText('▼ YOU ARE HERE', X, ty);
      cx2.restore(); }
  };
  draw(0);
  if(here){ const loop = ts=>{ if(!worldMapShown || regionMapOverlay.style.display!=='flex' || !cv.isConnected) return; draw(ts); wmAnim = requestAnimationFrame(loop); }; wmAnim = requestAnimationFrame(loop); }
}
let worldMapShown = false;
window.addEventListener('resize', ()=>{ if(regionMapOverlay.style.display==='flex'){ if(worldMapShown) renderWorldMap(); else renderRegionMap(); } });
document.getElementById('worldMapBtn').addEventListener('click', ()=>{
  worldMapShown = !worldMapShown;
  if(worldMapShown) renderWorldMap(); else { cancelAnimationFrame(wmAnim); renderRegionMap(); }
  document.querySelector('#worldMapBtn .schName').textContent = worldMapShown ? 'Region Map' : 'World Map';
});
// Moves ALL of the active character's gold into the shared stash in one
// tap, zeroing p.gold -- so it survives that character dying. The reverse
// (tap the stash's own gold total) sends it all back to whichever
// character currently has the stash open.
function transferGoldToStash(){
  const p = game.player;
  if(!p || p.gold<=0){ showMsg('No gold to store', 1.0); return; }
  const amt = p.gold;
  stash.gold = (stash.gold||0) + amt;
  p.gold = 0;
  saveStash();
  saveGame();
  showMsg('Stored '+amt+'g in the stash', 1.6);
  renderInventory();
  if(stashOverlay.style.display==='flex') renderStash();
}
function transferGoldFromStash(){
  const amt = stash.gold||0;
  if(amt<=0){ showMsg('Stash is empty', 1.0); return; }
  game.player.gold += amt;
  stash.gold = 0;
  saveStash();
  saveGame();
  renderStash();
  renderInventory();
}
document.getElementById('stashGoldCell').addEventListener('click', transferGoldFromStash);
document.getElementById('bagGoldCell').addEventListener('click', transferGoldToStash);

