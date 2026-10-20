// ---------- v193 scenery: road grids, forest props, decor ----------
// Roads are stored as a per-tile flag grid (same tile lattice the ground renderers use), so any zone can ask
// "is this tile road?" cheaply while drawing, and generators can keep trees/props/packs off it.
const ROAD_TS = 46;
function makeRoadGrid(w,h,polys){
  const GM = GROUND_MARGIN;
  const cols = Math.ceil((w+2*GM)/ROAD_TS)+2, rows = Math.ceil((h+2*GM)/ROAD_TS)+2;
  const g = new Uint8Array(cols*rows);
  for(const pl of polys){
    for(let i=0;i<pl.pts.length-1;i++){
      const a = pl.pts[i], b = pl.pts[i+1];
      const len = Math.hypot(b.x-a.x,b.y-a.y), n = Math.max(1,Math.ceil(len/16));
      for(let k=0;k<=n;k++){
        const x = a.x+(b.x-a.x)*k/n, y = a.y+(b.y-a.y)*k/n;
        const c0 = Math.floor((x-pl.hw+GM)/ROAD_TS)-1, c1 = Math.ceil((x+pl.hw+GM)/ROAD_TS)+1;
        const r0 = Math.floor((y-pl.hw+GM)/ROAD_TS)-1, r1 = Math.ceil((y+pl.hw+GM)/ROAD_TS)+1;
        for(let r=r0;r<=r1;r++) for(let c=c0;c<=c1;c++){
          if(c<0||r<0||c>=cols||r>=rows) continue;
          if(Math.hypot(c*ROAD_TS-GM-x, r*ROAD_TS-GM-y) <= pl.hw) g[r*cols+c] = 1;
        }
      }
    }
  }
  return {g, cols, rows};
}
function roadTileAt(rg, wx, wy){
  if(!rg) return false;
  const c = Math.round((wx+GROUND_MARGIN)/ROAD_TS), r = Math.round((wy+GROUND_MARGIN)/ROAD_TS);
  if(c<0||r<0||c>=rg.cols||r>=rg.rows) return false;
  return rg.g[r*rg.cols+c]===1;
}
function roadNearGrid(rg, x, y, m){
  if(!rg) return false;
  for(let yy=y-m; yy<=y+m; yy+=ROAD_TS*0.7) for(let xx=x-m; xx<=x+m; xx+=ROAD_TS*0.7) if(roadTileAt(rg,xx,yy)) return true;
  return false;
}
function distToPolyline(pts, x, y){
  let best = 1e9, bp = null;
  for(let i=0;i<pts.length-1;i++){
    const a = pts[i], b = pts[i+1], dx = b.x-a.x, dy = b.y-a.y, l2 = dx*dx+dy*dy||1;
    const t = clamp(((x-a.x)*dx+(y-a.y)*dy)/l2, 0, 1), px = a.x+dx*t, py = a.y+dy*t, d = Math.hypot(x-px,y-py);
    if(d<best){ best = d; bp = {x:px,y:py}; }
  }
  return {d:best, p:bp};
}
// Superellipse outline (ponds): points in world space
function pondOutline(o, n){
  const cx = o.x+o.w/2, cy = o.y+o.h/2, pts = [];
  for(let i=0;i<n;i++){
    const a = i/n*Math.PI*2, c = Math.cos(a), s = Math.sin(a);
    const k = 1/Math.pow(Math.pow(Math.abs(c),3.2)+Math.pow(Math.abs(s),3.2), 1/3.2);
    pts.push({x:cx+c*k*o.w/2*(1+0.06*Math.sin(a*3+o.seed)), y:cy+s*k*o.h/2*(1+0.06*Math.cos(a*2+o.seed))});
  }
  return pts;
}
function drawPondIso(o, clock){
  const t = clock||0, pts = pondOutline(o, 28);
  const cx = o.x+o.w/2, cy = o.y+o.h/2, ci = toIso(cx,cy);
  const path = (scale)=>{ ctx.beginPath(); pts.forEach((q,i)=>{ const p = toIso(cx+(q.x-cx)*scale, cy+(q.y-cy)*scale); i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y); }); ctx.closePath(); };
  ctx.save();
  if(FLOOR_PASS!==2){   // v487: static bank + water (baked); ripples and pads below stay live
  path(1.14); ctx.fillStyle = o.sun ? '#8a7a4a' : '#1c2a1a'; ctx.fill();          // muddy bank
  path(1.05); ctx.fillStyle = o.sun ? '#b9b07a' : '#2c3a26'; ctx.fill();
  path(1); const gr = ctx.createRadialGradient(ci.x,ci.y,4,ci.x,ci.y,Math.max(o.w,o.h)*0.5);
  if(o.sun){ gr.addColorStop(0,'#5fa8c8'); gr.addColorStop(1,'#3d7f9e'); } else { gr.addColorStop(0,'#1a4650'); gr.addColorStop(1,'#0c2229'); }
  ctx.fillStyle = gr; ctx.fill();
  ctx.strokeStyle = o.sun ? 'rgba(220,245,255,0.5)' : 'rgba(150,210,200,0.25)'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  if(FLOOR_PASS===1){ ctx.restore(); return; }
  // ripples + lily pads
  ctx.lineWidth = 1;
  for(let i=0;i<3;i++){
    const ph = (t*0.35 + i/3 + o.seed*0.1)%1, rx = o.w*0.28*ph, ry = o.h*0.28*ph;
    const px = cx+Math.cos(o.seed+i*2.1)*o.w*0.18, py = cy+Math.sin(o.seed*1.3+i*1.7)*o.h*0.18, pi = toIso(px,py);
    ctx.strokeStyle = 'rgba(200,240,240,'+(0.32*(1-ph))+')';
    ctx.beginPath(); ctx.ellipse(pi.x,pi.y,rx*ISO_KX*1.2,ry*ISO_KY*1.2,0,0,7); ctx.stroke();
  }
  for(const lp of (o.lilies||[])){
    const p = toIso(cx+lp.dx*o.w/2, cy+lp.dy*o.h/2);
    ctx.fillStyle = lp.f ? '#f4b8d0' : '#2f7a3a';
    ctx.beginPath(); ctx.ellipse(p.x,p.y,7*lp.s,3.6*lp.s,0,0,7); ctx.fill();
    if(!lp.f){ ctx.strokeStyle = '#1a4a24'; ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x+6*lp.s,p.y-1); ctx.stroke(); }
  }
  ctx.restore();
}
function drawReedsAtPond(o){
  for(const r of (o.reeds||[])){
    const p = toIso(r.x, r.y);
    ctx.strokeStyle = o.sun ? '#6a8a3a' : '#3f5a2a'; ctx.lineWidth = 1.8; ctx.lineCap='round';
    for(let k=-1;k<=1;k++){ ctx.beginPath(); ctx.moveTo(p.x+k*3,p.y); ctx.lineTo(p.x+k*4+r.lean,p.y-16*r.s); ctx.stroke(); }
    ctx.fillStyle = '#5a3a1c'; ctx.beginPath(); ctx.ellipse(p.x+r.lean,p.y-16*r.s,1.8,4,0,0,7); ctx.fill();
  }
}
function makePondProps(x,y,w,h,sun){
  const o = {x,y,w,h,isProp:true,kind:'pond',sun:!!sun,seed:Math.random()*6.28,lilies:[],reeds:[]};
  for(let i=0;i<7;i++) o.lilies.push({dx:rand(-0.7,0.7)*0.7, dy:rand(-0.7,0.7)*0.7, s:rand(0.7,1.3), f:Math.random()<0.25});
  const cx = x+w/2, cy = y+h/2;
  for(let i=0;i<9;i++){ const a = rand(0,Math.PI*2); o.reeds.push({x:cx+Math.cos(a)*w*0.54, y:cy+Math.sin(a)*h*0.54, s:rand(0.8,1.4), lean:rand(-3,3)}); }
  return o;
}
function drawLogIso(o){
  const long = o.w>=o.h, th = Math.min(o.w,o.h), cx = o.x+o.w/2, cy = o.y+o.h/2;
  const a = long ? toIso(o.x+th*0.4, cy) : toIso(cx, o.y+th*0.4);
  const b = long ? toIso(o.x+o.w-th*0.4, cy) : toIso(cx, o.y+o.h-th*0.4);
  const R = th*0.5, mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
  drawShadow(mx, my+2, Math.abs(a.x-b.x)/2+R*0.9, Math.abs(a.y-b.y)/2+R*0.55);
  ctx.save(); ctx.lineCap = 'round';
  const lift = R*0.75;
  ctx.strokeStyle = '#25190f'; ctx.lineWidth = R*1.7;
  ctx.beginPath(); ctx.moveTo(a.x,a.y-lift); ctx.lineTo(b.x,b.y-lift); ctx.stroke();
  ctx.strokeStyle = '#4b3524'; ctx.lineWidth = R*1.4;
  ctx.beginPath(); ctx.moveTo(a.x,a.y-lift); ctx.lineTo(b.x,b.y-lift); ctx.stroke();
  ctx.strokeStyle = '#6a4d33'; ctx.lineWidth = R*0.45;
  ctx.beginPath(); ctx.moveTo(a.x,a.y-lift-R*0.35); ctx.lineTo(b.x,b.y-lift-R*0.35); ctx.stroke();
  // moss patches + bark ribs
  ctx.strokeStyle = 'rgba(70,120,50,0.75)'; ctx.lineWidth = R*0.5;
  for(const f of [0.25,0.6,0.82]){ ctx.beginPath(); ctx.moveTo(a.x+(b.x-a.x)*f, a.y+(b.y-a.y)*f-lift-R*0.3); ctx.lineTo(a.x+(b.x-a.x)*(f+0.1), a.y+(b.y-a.y)*(f+0.1)-lift-R*0.3); ctx.stroke(); }
  // cut end rings
  const e = (o.seed>0.5) ? a : b;
  ctx.fillStyle = '#8a6a48'; ctx.beginPath(); ctx.ellipse(e.x,e.y-lift,R*0.62,R*0.78,0,0,7); ctx.fill();
  ctx.strokeStyle = '#4b3524'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(e.x,e.y-lift,R*0.35,R*0.46,0,0,7); ctx.stroke();
  ctx.restore();
}
function drawBigTreeIso(o){
  const iso = toIso(o.x+o.w/2, o.y+o.h/2), s = o.s||1;
  drawShadow(iso.x, iso.y, 38*s, 15*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s,s);
  // roots + trunk
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath(); ctx.moveTo(-16,2); ctx.quadraticCurveTo(-9,-10,-8,-40); ctx.lineTo(8,-40); ctx.quadraticCurveTo(9,-10,17,2); ctx.quadraticCurveTo(0,-4,-16,2); ctx.fill();
  ctx.strokeStyle = '#150e08'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(i*4,-2); ctx.lineTo(i*3,-38); ctx.stroke(); }
  // layered canopy
  const tiers = [[64,-40,-104],[54,-72,-130],[42,-98,-152],[28,-120,-172]];
  tiers.forEach((tr,i)=>{
    const w = tr[0], base = tr[1], top = tr[2];
    const gr = ctx.createLinearGradient(-w/2,top,w/2,base);
    gr.addColorStop(0,'#2e5a38'); gr.addColorStop(0.55,'#1c3f27'); gr.addColorStop(1,'#0f2a1a');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0,top); ctx.lineTo(-w/2,base); ctx.lineTo(-w*0.2,base+6); ctx.lineTo(0,base+2); ctx.lineTo(w*0.2,base+6); ctx.lineTo(w/2,base); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.stroke();
  });
  // hanging moss
  ctx.strokeStyle = 'rgba(120,160,90,0.55)'; ctx.lineWidth = 1.3;
  for(const mx of [-24,-10,8,22]){ ctx.beginPath(); ctx.moveTo(mx,-56); ctx.quadraticCurveTo(mx+3,-44,mx-1,-34); ctx.stroke(); }
  ctx.restore();
}
function drawForestBoulderIso(o){
  const iso = toIso(o.x+o.w/2, o.y+o.h/2), s = o.s||1;
  drawShadow(iso.x, iso.y+2, 34*s, 12*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s,s);
  const gr = ctx.createLinearGradient(-26,-40,24,4); gr.addColorStop(0,'#77746a'); gr.addColorStop(1,'#3a3832');
  ctx.fillStyle = gr; ctx.strokeStyle = '#1e1c18'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-28,0); ctx.lineTo(-30,-16); ctx.lineTo(-18,-34); ctx.lineTo(4,-42); ctx.lineTo(24,-30); ctx.lineTo(30,-10); ctx.lineTo(24,2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.moveTo(-6,-40); ctx.lineTo(-2,-20); ctx.lineTo(8,-4); ctx.stroke();
  ctx.fillStyle = 'rgba(70,120,55,0.85)';
  ctx.beginPath(); ctx.moveTo(-18,-34); ctx.lineTo(4,-42); ctx.lineTo(24,-30); ctx.lineTo(14,-27); ctx.lineTo(2,-32); ctx.lineTo(-12,-24); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawPropIso(o, clock){
  if(o.kind==='log') drawLogIso(o);
  else if(o.kind==='bigtree') drawBigTreeIso(o);
  else if(o.kind==='boulder') drawForestBoulderIso(o);
  else if(o.kind==='pond') drawReedsAtPond(o);
  else if(o.kind==='haystack') drawHaystackIso(o);
  else if(o.kind==='column') drawRuinColumnIso(o);
  else if(o.kind==='wallruin') drawRuinWallIso(o);
  else if(o.kind==='windmillbase') drawDecorIso({k:'windmill',x:o.x+o.w/2,y:o.y+o.h/2}, clock);
}
// ---- non-colliding decor (culled at draw time) ----
function drawDecorIso(d, clock){
  const iso = toIso(d.x, d.y), t = clock||0, s = d.s||1;
  ctx.save(); ctx.translate(iso.x, iso.y);
  switch(d.k){
    case 'fern': {
      ctx.strokeStyle = d.dark ? '#2a5a34' : '#4c8a3a'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      for(let i=-3;i<=3;i++){ ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(i*5*s,-10*s,i*8*s,-4*s+Math.abs(i)*2); ctx.stroke(); }
      break; }
    case 'mushroom': {
      const glow = 0.5+0.5*Math.sin(t*1.6+d.x);
      for(let i=0;i<3;i++){
        const mx = (i-1)*7*s, my = -(i%2)*3, r = (4+(i%2)*2)*s;
        ctx.fillStyle = '#d8d0b8'; ctx.fillRect(mx-1,my-r,2,r);
        ctx.fillStyle = d.c||'#8a5aa8'; ctx.beginPath(); ctx.ellipse(mx,my-r,r,r*0.6,0,Math.PI,0); ctx.fill();
        if(d.glow){ ctx.fillStyle = 'rgba(190,140,255,'+(0.18+0.18*glow)+')'; ctx.beginPath(); ctx.ellipse(mx,my-r,r*2.2,r*1.2,0,0,7); ctx.fill(); }
      }
      break; }
    case 'stump': {
      ctx.fillStyle = '#3a281a'; ctx.fillRect(-7*s,-9*s,14*s,9*s);
      ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.ellipse(0,-9*s,7*s,3.2*s,0,0,7); ctx.fill();
      ctx.strokeStyle = '#4a3220'; ctx.beginPath(); ctx.ellipse(0,-9*s,3.5*s,1.6*s,0,0,7); ctx.stroke();
      break; }
    case 'bones': {
      ctx.fillStyle = '#c9c1a8'; ctx.rotate(d.r||0); ctx.fillRect(-9,-2,18,3.4);
      ctx.beginPath(); ctx.arc(-9,-0.5,2.6,0,7); ctx.arc(9,-0.5,2.6,0,7); ctx.fill();
      break; }
    case 'flowers': {
      for(let i=0;i<d.n;i++){
        const fx = Math.cos(i*2.4+d.x)*d.r*(0.3+0.7*((i*37)%10)/10), fy = Math.sin(i*2.4+d.x)*d.r*0.5*(0.3+0.7*((i*17)%10)/10);
        ctx.strokeStyle = '#3d7a2c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(fx,fy); ctx.lineTo(fx,fy-6); ctx.stroke();
        ctx.fillStyle = d.cols[i%d.cols.length]; ctx.beginPath(); ctx.arc(fx,fy-7,2.2,0,7); ctx.fill();
        ctx.fillStyle = '#fff3a0'; ctx.fillRect(fx-0.5,fy-7.5,1,1);
      }
      break; }
    case 'bush': {
      ctx.fillStyle = '#2f6a34'; ctx.beginPath(); ctx.ellipse(0,-7*s,13*s,9*s,0,0,7); ctx.fill();
      ctx.fillStyle = '#3f8442'; ctx.beginPath(); ctx.ellipse(-4*s,-10*s,8*s,6*s,0,0,7); ctx.fill();
      if(d.berries){ ctx.fillStyle = '#c8384a'; for(let i=0;i<5;i++){ ctx.beginPath(); ctx.arc(Math.cos(i*1.9)*8*s,-8*s+Math.sin(i*2.7)*4*s,1.6,0,7); ctx.fill(); } }
      break; }
    case 'fence': {
      ctx.strokeStyle = '#6a4c2c'; ctx.lineWidth = 2.4; ctx.lineCap='round';
      const dx = d.horiz ? 22 : 0, dy = d.horiz ? 0 : 22, a = toIso(d.x, d.y), b = toIso(d.x+(d.horiz?46:0), d.y+(d.horiz?0:46));
      ctx.translate(-iso.x, -iso.y);
      for(const q of [a,b]){ ctx.beginPath(); ctx.moveTo(q.x,q.y); ctx.lineTo(q.x,q.y-16); ctx.stroke(); }
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x,a.y-12); ctx.lineTo(b.x,b.y-12); ctx.moveTo(a.x,a.y-6); ctx.lineTo(b.x,b.y-6); ctx.stroke();
      break; }
    case 'scarecrow': {
      ctx.strokeStyle = '#6a4c2c'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-34); ctx.moveTo(-14,-24); ctx.lineTo(14,-24); ctx.stroke();
      ctx.fillStyle = '#b89a52'; ctx.beginPath(); ctx.arc(0,-38,6,0,7); ctx.fill();
      ctx.fillStyle = '#7a3a2a'; ctx.beginPath(); ctx.moveTo(-9,-42); ctx.lineTo(9,-42); ctx.lineTo(0,-54); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8a6a3a'; ctx.fillRect(-5,-30,10,12);
      ctx.fillStyle = '#111'; ctx.fillRect(-2.5,-39,1.4,1.4); ctx.fillRect(1.2,-39,1.4,1.4);
      break; }
    case 'cairn': {
      ctx.fillStyle = '#8a8880'; for(let i=0;i<4;i++){ const w = 16-i*3.4; ctx.beginPath(); ctx.ellipse(0,-i*5-3,w/2,3.2,0,0,7); ctx.fill(); ctx.strokeStyle='#4a4842'; ctx.lineWidth=0.8; ctx.stroke(); }
      break; }
    case 'wagon': {
      ctx.rotate(0.15); ctx.fillStyle = '#5a3f26'; ctx.fillRect(-22,-16,44,14); ctx.strokeStyle = '#2a1c10'; ctx.lineWidth = 1.2; ctx.strokeRect(-22,-16,44,14);
      ctx.strokeStyle = '#3a2814'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-14,-2,8,0,7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-14,-10); ctx.lineTo(-14,6); ctx.moveTo(-22,-2); ctx.lineTo(-6,-2); ctx.stroke();
      ctx.fillStyle = '#c9b070'; ctx.beginPath(); ctx.ellipse(6,-17,10,4,0,0,7); ctx.fill();
      break; }
    case 'windmill': {
      drawShadow(0,4,44,16);
      ctx.fillStyle = '#8a7a62'; ctx.beginPath(); ctx.moveTo(-26,0); ctx.lineTo(-16,-84); ctx.lineTo(16,-84); ctx.lineTo(26,0); ctx.closePath(); ctx.fill(); ctx.strokeStyle='#3a3226'; ctx.lineWidth=1.4; ctx.stroke();
      ctx.fillStyle = '#5a3a26'; ctx.beginPath(); ctx.moveTo(-22,-84); ctx.lineTo(0,-108); ctx.lineTo(22,-84); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2a1c12'; ctx.fillRect(-6,-22,12,22);
      ctx.save(); ctx.translate(0,-84); ctx.rotate(t*0.5); ctx.strokeStyle='#4a3220'; ctx.lineWidth=3;
      for(let i=0;i<4;i++){ ctx.rotate(Math.PI/2); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-54); ctx.stroke(); ctx.fillStyle='rgba(230,215,180,0.85)'; ctx.fillRect(-7,-54,14,26); }
      ctx.restore();
      break; }
    case 'reed': {
      ctx.strokeStyle = d.c||'#6a8a3a'; ctx.lineWidth = 1.8; ctx.lineCap='round';
      for(let k=-2;k<=2;k++){ ctx.beginPath(); ctx.moveTo(k*3,0); ctx.lineTo(k*4+(k%2?2:-2),-18*s); ctx.stroke(); ctx.fillStyle='#5a3a1c'; ctx.beginPath(); ctx.ellipse(k*4+(k%2?2:-2),-18*s,1.8,4,0,0,7); ctx.fill(); }
      break; }
    case 'lily': {
      ctx.fillStyle = '#2f7a3a'; ctx.beginPath(); ctx.ellipse(0,0,8*s,3.8*s,0,0,7); ctx.fill();
      if(d.f){ ctx.fillStyle='#f4b8d0'; ctx.beginPath(); ctx.arc(1,-1,2.2,0,7); ctx.fill(); }
      break; }
    case 'columnfall': {
      ctx.rotate(d.r||0.4); ctx.fillStyle='#a8a498'; ctx.fillRect(-26,-8,52,12); ctx.strokeStyle='#4a4840'; ctx.lineWidth=1; ctx.strokeRect(-26,-8,52,12);
      ctx.fillStyle='#8a877c'; ctx.beginPath(); ctx.ellipse(-26,-2,4,6,0,0,7); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.25)'; for(let i=-18;i<=18;i+=9){ ctx.beginPath(); ctx.moveTo(i,-8); ctx.lineTo(i,4); ctx.stroke(); }
      break; }
    case 'rune': {
      const p = 0.4+0.35*Math.sin(t*1.8+d.x*0.01);
      ctx.strokeStyle='rgba(120,220,255,'+p+')'; ctx.lineWidth=1.6; ctx.shadowColor='#7fe0ff'; ctx.shadowBlur=8;
      ctx.beginPath(); ctx.ellipse(0,0,18*s,8*s,0,0,7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8*s,0); ctx.lineTo(0,-4*s); ctx.lineTo(8*s,0); ctx.lineTo(0,4*s); ctx.closePath(); ctx.stroke();
      break; }
    case 'statue': {
      drawShadow(0,3,16,6);
      ctx.fillStyle='#9a978c'; ctx.fillRect(-10,-8,20,8); ctx.fillRect(-6,-34,12,28);
      if(!d.broken){ ctx.beginPath(); ctx.arc(0,-40,6,0,7); ctx.fill(); } else { ctx.fillStyle='#8a877c'; ctx.fillRect(-6,-34,12,4); }
      ctx.fillStyle='rgba(90,140,80,0.6)'; ctx.fillRect(-6,-16,4,10);
      ctx.strokeStyle='#4a4840'; ctx.lineWidth=1; ctx.strokeRect(-6,-34,12,28);
      break; }
    case 'driftwood': {
      ctx.rotate(d.r||0); ctx.strokeStyle='#6a5a48'; ctx.lineWidth=4; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(-18,0); ctx.quadraticCurveTo(0,-6,18,-1); ctx.stroke();
      ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-4,-3); ctx.lineTo(-8,-10); ctx.stroke();
      break; }
    case 'dock': {
      ctx.translate(-iso.x,-iso.y);
      for(let i=0;i<7;i++){ const a = toIso(d.x+i*22, d.y-14), b = toIso(d.x+i*22, d.y+14); ctx.strokeStyle = i%2?'#6a4c2c':'#5a3f26'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(a.x,a.y-5); ctx.lineTo(b.x,b.y-5); ctx.stroke(); }
      for(const yy of [-14,14]) for(const xx of [0,132]){ const q = toIso(d.x+xx, d.y+yy); ctx.strokeStyle='#3a2814'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(q.x,q.y); ctx.lineTo(q.x,q.y-14); ctx.stroke(); }
      break; }
    case 'mistpatch': {
      const a = 0.10+0.05*Math.sin(t*0.5+d.x*0.003);
      ctx.translate(0,-6); ctx.scale(1,0.32); const mg = ctx.createRadialGradient(0,0,0,0,0,d.r);   // v456: soft-edged
      mg.addColorStop(0,'rgba(190,205,200,'+(a*1.2).toFixed(3)+')'); mg.addColorStop(0.6,'rgba(190,205,200,'+(a*0.6).toFixed(3)+')'); mg.addColorStop(1,'rgba(190,205,200,0)');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(0,0,d.r,0,7); ctx.fill();
      break; }
  }
  ctx.restore();
}
function drawHaystackIso(o){
  const iso = toIso(o.x+o.w/2, o.y+o.h/2);
  drawShadow(iso.x, iso.y+2, 26, 10);
  ctx.save(); ctx.translate(iso.x, iso.y);
  const gr = ctx.createLinearGradient(-20,-34,20,0); gr.addColorStop(0,'#e0c467'); gr.addColorStop(1,'#a8863a');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-22,0); ctx.quadraticCurveTo(-24,-30,0,-38); ctx.quadraticCurveTo(24,-30,22,0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(90,60,20,0.5)'; ctx.lineWidth = 1; for(let i=-14;i<=14;i+=7){ ctx.beginPath(); ctx.moveTo(i,-4); ctx.lineTo(i*0.6,-32); ctx.stroke(); }
  ctx.restore();
}
function drawRuinColumnIso(o){
  const iso = toIso(o.x+o.w/2, o.y+o.h/2), h = o.tall||60;
  drawShadow(iso.x, iso.y+2, 20, 8);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle = '#7c796e'; ctx.fillRect(-13,-8,26,8);
  const gr = ctx.createLinearGradient(-9,0,9,0); gr.addColorStop(0,'#c6c2b4'); gr.addColorStop(1,'#8a877a');
  ctx.fillStyle = gr; ctx.fillRect(-8,-h,16,h-8);
  ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=1; for(const x of [-3,3]){ ctx.beginPath(); ctx.moveTo(x,-8); ctx.lineTo(x,-h); ctx.stroke(); }
  if(o.broken){ ctx.fillStyle='#6a675c'; ctx.beginPath(); ctx.moveTo(-8,-h); ctx.lineTo(-2,-h-8); ctx.lineTo(3,-h-2); ctx.lineTo(8,-h-9); ctx.lineTo(8,-h); ctx.closePath(); ctx.fill(); }
  else { ctx.fillStyle='#9a978a'; ctx.fillRect(-12,-h-6,24,7); }
  ctx.fillStyle='rgba(80,130,70,0.6)'; ctx.fillRect(-8,-22,7,14);
  ctx.restore();
}
function drawRuinWallIso(o){
  drawBlock(o, o.tall||34, '#8a877a','#4e4c44','#66645a');
}
