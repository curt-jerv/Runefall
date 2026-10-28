// ---------------- Redridge Crater (v177) ----------------
// A huge circular crater cut into three terraces (top rim, mid rim, scorched floor). Height is a per-tile field:
// tiers are flat, cliffs are impassable lips, and four ramps blend one tier into the next. Everything that is
// projected goes through toIso(), which subtracts crElevAt(), so units, shadows and effects follow the ground.
const CR_W = 6000, CR_H = 6000, CR_TS = 50, CR_DEPTH = 45, /* v489: was 52 */ CR_CX = 3000, CR_CY = 3000;
const CR_R_FLOOR = 1000, CR_R_MID = 1850, CR_R_TOP = 2650, CR_WALL_THICK = 340, CR_GATE_HALF = 230;
const CR_ELEV = [0, 70, 140], CR_WALL_ELEV = 250, CR_STEP = 22;
const CR_RAMP_LEN = 300, CR_RAMP_HALF = 150;
const CR_RAMPS = [
  {B:CR_R_MID,   ang:0.35,            lo:1, hi:2},
  {B:CR_R_MID,   ang:Math.PI+0.35,    lo:1, hi:2},
  {B:CR_R_FLOOR, ang:2.17,            lo:0, hi:1},
  {B:CR_R_FLOOR, ang:-0.97,           lo:0, hi:1},
];
function crAngDiff(a,b){ let d=a-b; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; return d; }
function crTileInfo(x,y){
  const dx = x-CR_CX, dy = y-CR_CY, r = Math.hypot(dx,dy), a = Math.atan2(dy,dx);
  if(r >= CR_R_TOP){
    if(Math.abs(dx) < CR_GATE_HALF && dy > 0) return {e:CR_ELEV[2], k:2};
    return r >= CR_R_TOP+CR_WALL_THICK ? {e:CR_WALL_ELEV, k:4} : {e:CR_WALL_ELEV, k:3};
  }
  let k = r<CR_R_FLOOR ? 0 : r<CR_R_MID ? 1 : 2, e = CR_ELEV[k];
  for(const rp of CR_RAMPS){
    if(Math.abs(r-rp.B) < CR_RAMP_LEN/2 && Math.abs(crAngDiff(a,rp.ang))*r < CR_RAMP_HALF){
      const t = (r-(rp.B-CR_RAMP_LEN/2))/CR_RAMP_LEN;
      e = CR_ELEV[rp.lo] + (CR_ELEV[rp.hi]-CR_ELEV[rp.lo])*t; k = t<0.5 ? rp.lo : rp.hi; break;
    }
  }
  return {e,k};
}
function makeRedCrater(){
  const TS = CR_TS, cols = CR_W/TS, rows = CR_H/TS, N = cols*rows;
  const E = new Float32Array(N), K = new Uint8Array(N), B = new Uint8Array(N);
  for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){
    const inf = crTileInfo((ix+0.5)*TS, (iy+0.5)*TS), i = iy*cols+ix;
    E[i] = inf.e; K[i] = inf.k;
  }
  const nbs = [[1,0],[-1,0],[0,1],[0,-1]];
  for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){
    const i = iy*cols+ix;
    if(K[i]>=3){ B[i] = 1; continue; }
    for(const [dx,dy] of nbs){
      const nx = ix+dx, ny = iy+dy;
      if(nx<0||ny<0||nx>=cols||ny>=rows) continue;
      const j = ny*cols+nx;
      if(K[j]<3 && E[i]-E[j] > CR_STEP){ B[i] = 1; break; }
    }
  }
  // corner heights per tile (average of the connected tiles that share the corner)
  const CH = new Float32Array(N*4);
  for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){
    const i = iy*cols+ix, own = E[i];
    for(let k=0;k<4;k++){
      const cx = (k===1||k===2) ? 1 : 0, cy = k>=2 ? 1 : 0;
      let sum = 0, n = 0;
      for(let ddy=cy-1; ddy<=cy; ddy++) for(let ddx=cx-1; ddx<=cx; ddx++){
        const nx = ix+ddx, ny = iy+ddy;
        if(nx<0||ny<0||nx>=cols||ny>=rows) continue;
        const j = ny*cols+nx;
        if(Math.abs(E[j]-own) <= CR_STEP){ sum += E[j]; n++; }
      }
      CH[i*4+k] = n ? sum/n : own;
    }
  }
  // blocked tiles -> merged rects
  const obstacles = []; let open = {};
  for(let iy=0; iy<=rows; iy++){
    const now = {};
    let ix = 0;
    while(iy<rows && ix<cols){
      if(!B[iy*cols+ix]){ ix++; continue; }
      let j = ix; while(j+1<cols && B[iy*cols+j+1]) j++;
      const key = ix+'-'+j;
      if(open[key]){ open[key].h += TS; now[key] = open[key]; }
      else { const r = {x:ix*TS, y:iy*TS, w:(j-ix+1)*TS, h:TS, isKeep:true}; obstacles.push(r); now[key] = r; }
      ix = j+1;
    }
    open = now;
  }
  const walk = (x,y)=>{ const ix=Math.floor(x/TS), iy=Math.floor(y/TS); if(ix<0||iy<0||ix>=cols||iy>=rows) return false; const i=iy*cols+ix; return !B[i] && K[i]<3 && Math.abs(CH[i*4]-CH[i*4+2])<8; };
  // pack anchors: flat, unblocked ground on the two upper terraces, away from the entrance
  const anchors = []; let tries = 0;
  while(anchors.length<34 && tries<20000){
    tries++;
    const a = Math.random()*Math.PI*2, r = rand(CR_R_FLOOR+180, CR_R_TOP-160);
    const x = CR_CX+Math.cos(a)*r, y = CR_CY+Math.sin(a)*r;
    if(!walk(x,y) || !walk(x+70,y) || !walk(x-70,y) || !walk(x,y+70) || !walk(x,y-70)) continue;
    if(dist({x,y},{x:CR_CX,y:CR_H-300}) < 700) continue;
    if(anchors.some(q=>dist(q,{x,y})<330)) continue;
    anchors.push({x,y});
  }
  const deco = []; tries = 0;
  while(deco.length<420 && tries<6000){
    tries++;
    const x = rand(80,CR_W-80), y = rand(80,CR_H-80);
    if(!walk(x,y)) continue;
    const rr = Math.hypot(x-CR_CX,y-CR_CY);
    const q = Math.random();
    deco.push({x,y,s:rand(0.7,1.5),k: rr<CR_R_FLOOR ? (q<0.55?'rock':q<0.8?'vent':'bones') : (q<0.5?'rock':q<0.75?'cactus':'bones')});
  }
  const gates = [{id:'redridge', x:CR_CX, y:CR_H-70, r:70, label:'REDRIDGE CANYON', act:'toRedridgeFromCrater', art:true, big:1.7}];
  return { w:CR_W, h:CR_H, depth:CR_DEPTH, name:'Redridge Crater', obstacles, cols, rows, E, K, B, CH, gates, deco, packAnchors:anchors,
    runeSpot:{x:CR_CX, y:CR_CY, r:44}, bossSpot:{x:CR_CX+220, y:CR_CY-160} };
}
// height-field zones: the crater and (v250) the Mountain Pass share one terrain engine
function terrR(g){ return !g ? null : g.scene==='redcrater' ? g.crater : (g.scene==='redridge' && g.rr && g.rr.E) ? g.rr : (g.scene==='mountainpass' && g.mtn && g.mtn.E) ? g.mtn : (g.scene==='highlands' && g.hl && g.hl.E) ? g.hl : null; }
function crElevAt(x,y){
  const R = terrR(game); if(!R) return 0;
  const TS = R.ts || CR_TS;
  let ix = Math.floor(x/TS), iy = Math.floor(y/TS);
  ix = ix<0?0:ix>=R.cols?R.cols-1:ix; iy = iy<0?0:iy>=R.rows?R.rows-1:iy;
  const u = clamp(x/TS-ix,0,1), v = clamp(y/TS-iy,0,1), b = (iy*R.cols+ix)*4, c = R.CH;
  return (c[b]*(1-u)+c[b+1]*u)*(1-v) + (c[b+3]*(1-u)+c[b+2]*u)*v;
}
// v182: terrain may only be climbed or descended on the ramps -- a step onto a tile more than CR_STEP higher/lower is refused
function crTileE(R,x,y){ const TS = R.ts || CR_TS; const ix = clamp(Math.floor(x/TS),0,R.cols-1), iy = clamp(Math.floor(y/TS),0,R.rows-1); return R.E[iy*R.cols+ix]; }
function crEnforce(g, p){
  const R = terrR(g); if(!R) return;
  if(p.crX===undefined){ p.crX = p.x; p.crY = p.y; return; }
  const e0 = crTileE(R,p.crX,p.crY);
  const ok = (x,y)=> Math.abs(crTileE(R,x,y)-e0) <= CR_STEP+1;
  if(!ok(p.x,p.y)){
    if(ok(p.x,p.crY)) p.y = p.crY; else if(ok(p.crX,p.y)) p.x = p.crX; else { p.x = p.crX; p.y = p.crY; }
  }
  p.crX = p.x; p.crY = p.y;
}
function crColor(e, h, k, f){
  let r,g,b;
  if(k>=3){ r=78; g=38; b=28; }
  else {
    const t = clamp(e/140,0,1);
    if(t<0.5){ const u=t*2; r=58+(128-58)*u; g=38+(68-38)*u; b=34+(44-34)*u; }
    else { const u=(t-0.5)*2; r=128+(190-128)*u; g=68+(108-68)*u; b=44+(68-44)*u; }
  }
  const j = (0.93+h*0.14)*(f||1);
  return 'rgb('+Math.round(r*j)+','+Math.round(g*j)+','+Math.round(b*j)+')';
}
function drawCraterTerrain(R, cam){
  const TS = R.ts || CR_TS, cols = R.cols, rows = R.rows, CH = R.CH, E = R.E, K = R.K;
  const WD = R.wallDrop || 250, colF = R.colorFn || ((RR,ii,hh,kk,ff)=>crColor(RR.E[ii],hh,kk,ff));
  const cx0 = cam.x, cy0 = cam.y, edgeSegs = [];
  ctx.lineWidth = 1; ctx.lineJoin = 'round';
  for(let ix=0; ix<cols; ix++){
    for(let iy=0; iy<rows; iy++){
      const i = iy*cols+ix, k = K[i]; if(k===4) continue;
      const fx = ((ix+0.5)*TS-(iy+0.5)*TS)*ISO_KX, fy = ((ix+0.5)*TS+(iy+0.5)*TS)*ISO_KY;
      if(fx-cx0<-100 || fx-cx0>W+100 || fy-cy0<-150 || fy-cy0-260>H+100) continue;
      const b = i*4;
      const X0 = (ix*TS-iy*TS)*ISO_KX,           Y0 = (ix*TS+iy*TS)*ISO_KY-CH[b];
      const X1 = ((ix+1)*TS-iy*TS)*ISO_KX,       Y1 = ((ix+1)*TS+iy*TS)*ISO_KY-CH[b+1];
      const X2 = ((ix+1)*TS-(iy+1)*TS)*ISO_KX,   Y2 = ((ix+1)*TS+(iy+1)*TS)*ISO_KY-CH[b+2];
      const X3 = (ix*TS-(iy+1)*TS)*ISO_KX,       Y3 = (ix*TS+(iy+1)*TS)*ISO_KY-CH[b+3];
      const h = tileHash(ix,iy);
      // faces toward the camera (+x and +y sides)
      if(ix+1<cols){
        const j = i+1, kb = K[j];
        const n0 = kb===4 ? CH[b+1]-WD : CH[j*4], n3 = kb===4 ? CH[b+2]-WD : CH[j*4+3];
        if(CH[b+1] > n0+0.5 || CH[b+2] > n3+0.5){
          ctx.fillStyle = colF(R, i, h, k, 0.52); ctx.strokeStyle = ctx.fillStyle;
          ctx.beginPath(); ctx.moveTo(X1,Y1); ctx.lineTo(X2,Y2); ctx.lineTo(X2,Y2+(CH[b+2]-n3)); ctx.lineTo(X1,Y1+(CH[b+1]-n0)); ctx.closePath(); ctx.fill(); ctx.stroke();
          if(CH[b+1]-n0 > 30){ ctx.strokeStyle='rgba(30,10,6,0.35)'; ctx.beginPath(); const m=(CH[b+1]-n0)*0.5; ctx.moveTo(X1,Y1+m); ctx.lineTo(X2,Y2+(CH[b+2]-n3)*0.5); ctx.stroke(); }
        }
      }
      if(iy+1<rows){
        const j = i+cols, kb = K[j];
        const n0 = kb===4 ? CH[b+3]-WD : CH[j*4], n1 = kb===4 ? CH[b+2]-WD : CH[j*4+1];
        if(CH[b+3] > n0+0.5 || CH[b+2] > n1+0.5){
          ctx.fillStyle = colF(R, i, h, k, 0.72); ctx.strokeStyle = ctx.fillStyle;
          ctx.beginPath(); ctx.moveTo(X3,Y3); ctx.lineTo(X2,Y2); ctx.lineTo(X2,Y2+(CH[b+2]-n1)); ctx.lineTo(X3,Y3+(CH[b+3]-n0)); ctx.closePath(); ctx.fill(); ctx.stroke();
          if(CH[b+3]-n0 > 30){ ctx.strokeStyle='rgba(30,10,6,0.3)'; ctx.beginPath(); ctx.moveTo(X3,Y3+(CH[b+3]-n0)*0.5); ctx.lineTo(X2,Y2+(CH[b+2]-n1)*0.5); ctx.stroke(); }
        }
      }
      // top surface
      ctx.fillStyle = colF(R, i, h, k); ctx.strokeStyle = ctx.fillStyle;
      ctx.beginPath(); ctx.moveTo(X0,Y0); ctx.lineTo(X1,Y1); ctx.lineTo(X2,Y2); ctx.lineTo(X3,Y3); ctx.closePath(); ctx.fill(); ctx.stroke();
      const slope = (CH[b+1]+CH[b+2]-CH[b]-CH[b+3])*0.5;
      if(Math.abs(slope) > 1){ ctx.fillStyle = slope>0 ? 'rgba(0,0,0,0.16)' : 'rgba(255,220,170,0.12)'; ctx.fill(); }
      // v516: bold edge lines along every cliff lip you cannot cross (tiles blocked by a height step), so a ledge facing away from the screen still shows
      if(R.edgeLines && k<3 && !R.B[i]){
        const Bm = R.B;
        if(ix+1<cols && Bm[i+1] && K[i+1]<3) edgeSegs.push(X1,Y1,X2,Y2);
        if(ix>0 && Bm[i-1] && K[i-1]<3) edgeSegs.push(X0,Y0,X3,Y3);
        if(iy+1<rows && Bm[i+cols] && K[i+cols]<3) edgeSegs.push(X3,Y3,X2,Y2);
        if(iy>0 && Bm[i-cols] && K[i-cols]<3) edgeSegs.push(X0,Y0,X1,Y1);
      }
      if(!R.isMtn && k===0 && h>0.9){ ctx.strokeStyle='rgba(255,120,40,0.55)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo((X0+X3)/2,(Y0+Y3)/2); ctx.lineTo((X1+X2)/2+2,(Y1+Y2)/2-1); ctx.lineTo((X1+X3)/2,(Y1+Y3)/2+3); ctx.stroke(); ctx.lineWidth=1; }
    }
  }
  if(edgeSegs.length){   // v548: the cliff lips are lined with boulders (was a bold line), drawn after every tile so no neighbour paints over them
    const pal = R.edgeRockPal || ['#6e665c','#8f887c','#3a342e'];
    const rocks = [];
    for(let q=0;q<edgeSegs.length;q+=4){
      const x0 = edgeSegs[q], y0 = edgeSegs[q+1], x1 = edgeSegs[q+2], y1 = edgeSegs[q+3];
      for(const t0 of [0.22, 0.7]){
        const hh = Math.abs(Math.sin(x0*12.9898 + y0*78.233 + t0*37.7)*43758.5453)%1, t = t0 + (hh-0.5)*0.18;
        rocks.push([x0+(x1-x0)*t, y0+(y1-y0)*t, 7 + hh*8, hh]);
      }
    }
    rocks.sort((a,b)=>a[1]-b[1]);
    for(const [x,y,s,hh] of rocks){
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(x+2, y+2, s*1.15, s*0.55, 0, 0, 7); ctx.fill();
      ctx.fillStyle = pal[2]; ctx.beginPath();
      ctx.moveTo(x-s, y); ctx.lineTo(x-s*0.75, y-s*0.75); ctx.lineTo(x-s*0.1, y-s*(0.95+hh*0.3)); ctx.lineTo(x+s*0.7, y-s*0.7); ctx.lineTo(x+s, y-s*0.05); ctx.lineTo(x+s*0.5, y+s*0.35); ctx.lineTo(x-s*0.6, y+s*0.32); ctx.closePath(); ctx.fill();
      ctx.fillStyle = pal[0]; ctx.beginPath();
      ctx.moveTo(x-s*0.8, y-s*0.1); ctx.lineTo(x-s*0.65, y-s*0.7); ctx.lineTo(x-s*0.1, y-s*(0.88+hh*0.3)); ctx.lineTo(x+s*0.6, y-s*0.62); ctx.lineTo(x+s*0.75, y-s*0.15); ctx.lineTo(x, y+s*0.1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = pal[1]; ctx.beginPath(); ctx.moveTo(x-s*0.55, y-s*0.6); ctx.lineTo(x-s*0.1, y-s*(0.82+hh*0.3)); ctx.lineTo(x+s*0.35, y-s*0.62); ctx.lineTo(x-s*0.1, y-s*0.45); ctx.closePath(); ctx.fill();
    }
  }
}

function drawCraterDeco(d){
  if(d.k==='vent'){
    const iso = toIso(d.x,d.y), t = (game.clock||0)*3+d.x;
    ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(d.s,d.s);
    drawShadow(0,0,16,6);
    ctx.fillStyle='#2a1410'; ctx.beginPath(); ctx.ellipse(0,-2,13,6,0,0,7); ctx.fill();
    const gl = ctx.createRadialGradient(0,-4,1,0,-4,16+Math.sin(t)*3);
    gl.addColorStop(0,'rgba(255,190,80,0.95)'); gl.addColorStop(1,'rgba(255,90,20,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0,-4,18,0,7); ctx.fill();
    ctx.restore();
  } else drawRedDecoIso(d);
}
function enterRedCrater(){
  const g = game, p = g.player;
  g.scene = 'redcrater';
  g.crater = makeRedCrater();
  g.room = g.crater;
  g.depth = CR_DEPTH;
  p.reachedCrater = true;
  p.x = CR_CX; p.y = CR_H-260; p.crX = undefined;
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  g.bossKilled = false; g.boltFx = null;
  for(const a of breatheAnchors(g.crater.packAnchors, {gap:380, cell:1100})) spawnRedridgePack(g, a, RR_PACKS[Math.floor(Math.random()*RR_PACKS.length)], true);
  { const ob = g.crater.obstacles; g.enemies = g.enemies.filter(e=>!ob.some(o=>e.x>o.x-e.r && e.x<o.x+o.w+e.r && e.y>o.y-e.r && e.y<o.y+o.h+e.r)); }
  if(!p.gojiraSlain) spawnGojira(g); else spawnTrex(g);
  showMsg('Redridge Crater', 2.2);
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = p.x; f.y = p.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}

