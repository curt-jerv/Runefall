// Generic small building: a walled box with a simple pitched roof, used for
// both the blacksmith's forge and any purely decorative structures in town.
// ---------- Mistfall town art pass (v384): a small harbour town, Diablo-2-style muted timber and slate ----------
const TOWN_SHORE_X = 420, TOWN_SHORE_Y = 760;
const TOWN_PIER = {x:20, y:960, w:400, h:124};
function townWaterAt(x,y){ return x < TOWN_SHORE_X && y > TOWN_SHORE_Y; }
function townPathAt(T, x, y){ if(!T || !T.paths) return false; for(const r of T.paths){ if(x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h) return true; } return false; }
const TP = {
  wood:['#8a6a44','#33251a','#5a4228'], darkwood:['#6a4e32','#2a1d12','#47331f'], stone:['#7a7c86','#2a2c34','#4a4c58'],
  hay:['#c9a850','#6a5528','#9a7e38'], crate:['#9a7a4c','#3a2a18','#6a5030'], iron:['#4a4c56','#17181e','#2c2e38'],
};
function tpBox(x,y,w,h,hz,pal,lift){
  if(lift){ ctx.save(); ctx.translate(0,-lift); drawBlock({x:x-w/2,y:y-h/2,w,h}, hz, pal[0], pal[1], pal[2]); ctx.restore(); }
  else drawBlock({x:x-w/2,y:y-h/2,w,h}, hz, pal[0], pal[1], pal[2]);
}
function drawTownProp(pr, t){
  if(pr.s && pr.s!==1 && !pr._in){
    const io = toIso(pr.x, pr.y); ctx.save(); ctx.translate(io.x, io.y); ctx.scale(pr.s, pr.s); ctx.translate(-io.x, -io.y);
    pr._in = true; try{ drawTownProp(pr, t); } finally { pr._in = false; ctx.restore(); }
    return;
  }
  const iso = toIso(pr.x, pr.y), k = pr.k;
  switch(k){
    case 'barrel': {
      ctx.save(); ctx.translate(iso.x, iso.y); drawShadow(0,0,11,5);
      const g = ctx.createLinearGradient(-8,0,8,0); g.addColorStop(0,'#5a3c22'); g.addColorStop(0.45,'#8a6038'); g.addColorStop(1,'#3e2814');
      ctx.fillStyle = g; ctx.strokeStyle = '#1e1208'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-7,-1); ctx.quadraticCurveTo(-10,-9,-7,-17); ctx.lineTo(7,-17); ctx.quadraticCurveTo(10,-9,7,-1); ctx.quadraticCurveTo(0,4,-7,-1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = pr.open ? '#2a3a46' : '#6a4a2c'; ctx.beginPath(); ctx.ellipse(0,-17,7,3.2,0,0,7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#2a2c34'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0,-5,8.4,2.6,0,0.1,Math.PI-0.1); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0,-13,8.4,2.6,0,0.1,Math.PI-0.1); ctx.stroke();
      ctx.restore(); break; }
    case 'crate': { drawShadow(iso.x, iso.y, 14, 6); tpBox(pr.x,pr.y,18,18,15,TP.crate);
      const c = toIso(pr.x, pr.y+9); ctx.strokeStyle='rgba(30,18,8,0.7)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(c.x-9,c.y-14); ctx.lineTo(c.x+9,c.y-1); ctx.moveTo(c.x-9,c.y-1); ctx.lineTo(c.x+9,c.y-14); ctx.stroke(); break; }
    case 'bigcrate': { drawShadow(iso.x, iso.y, 20, 8); tpBox(pr.x,pr.y,28,24,20,TP.crate); tpBox(pr.x+3,pr.y-2,14,14,12,TP.darkwood,20); break; }
    case 'sack': { ctx.save(); ctx.translate(iso.x, iso.y); drawShadow(0,0,10,4);
      ctx.fillStyle = pr.c||'#b4a078'; ctx.strokeStyle='#3a2e1a'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(-8,0); ctx.quadraticCurveTo(-11,-10,-4,-14); ctx.lineTo(-2,-18); ctx.lineTo(2,-18); ctx.lineTo(4,-14); ctx.quadraticCurveTo(11,-10,8,0); ctx.quadraticCurveTo(0,4,-8,0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle='#5a4a2a'; ctx.beginPath(); ctx.moveTo(-3,-14); ctx.lineTo(3,-14); ctx.stroke(); ctx.restore(); break; }
    case 'hay': { drawShadow(iso.x, iso.y, 17, 7); tpBox(pr.x,pr.y,22,16,13,TP.hay);
      ctx.strokeStyle='rgba(90,66,20,0.7)'; ctx.lineWidth=1; const c=toIso(pr.x,pr.y+8); ctx.beginPath(); ctx.moveTo(c.x-10,c.y-9); ctx.lineTo(c.x+10,c.y+2); ctx.moveTo(c.x-10,c.y-4); ctx.lineTo(c.x+10,c.y+7); ctx.stroke(); break; }
    case 'woodpile': { drawShadow(iso.x, iso.y, 22, 8);
      ctx.save(); ctx.translate(iso.x, iso.y);
      for(let row=0;row<3;row++){ for(let i=0;i<4-row;i++){ const lx = -15+row*5+i*10, ly = -4-row*8;
        ctx.fillStyle='#6a4a2c'; ctx.beginPath(); ctx.ellipse(lx,ly,5,4.6,0,0,7); ctx.fill(); ctx.strokeStyle='#241608'; ctx.lineWidth=1; ctx.stroke();
        ctx.fillStyle='#c4a070'; ctx.beginPath(); ctx.ellipse(lx,ly,3,2.8,0,0,7); ctx.fill(); ctx.strokeStyle='rgba(90,60,30,0.7)'; ctx.beginPath(); ctx.arc(lx,ly,1.4,0,7); ctx.stroke(); } }
      ctx.restore(); break; }
    case 'lantern': {
      ctx.save(); ctx.translate(iso.x, iso.y); drawShadow(0,0,6,3);
      ctx.fillStyle='#2a2420'; ctx.fillRect(-1.6,-46,3.2,46); ctx.fillRect(-4,-4,8,4);
      ctx.fillStyle='#1c1814'; ctx.fillRect(-1,-50,12,2.4);
      const fl = 2.6+Math.sin(t*8+pr.x*0.3)*0.7, lit = pr.lit!==false;
      ctx.fillStyle='#3a2e22'; ctx.strokeStyle='#14100c'; ctx.lineWidth=1; ctx.beginPath(); ctx.rect(5,-50,9,12); ctx.fill(); ctx.stroke();
      if(lit){ ctx.fillStyle='rgba(255,196,100,0.9)'; ctx.fillRect(6.5,-48,6,8); ctx.fillStyle='#fff0b8'; ctx.beginPath(); ctx.arc(9.5,-44,fl*0.7,0,7); ctx.fill(); }
      ctx.fillStyle='#14100c'; ctx.beginPath(); ctx.moveTo(4,-50); ctx.lineTo(9.5,-55); ctx.lineTo(15,-50); ctx.closePath(); ctx.fill();
      ctx.restore(); break; }
    case 'pierpost': { ctx.save(); ctx.translate(iso.x, iso.y); drawShadow(0,0,5,2.5);
      ctx.fillStyle='#4a3420'; ctx.strokeStyle='#1a1108'; ctx.lineWidth=1; ctx.fillRect(-3,-22,6,22); ctx.strokeRect(-3,-22,6,22);
      ctx.fillStyle='#6a4c2c'; ctx.beginPath(); ctx.ellipse(0,-22,3.4,1.6,0,0,7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle='#b49a68'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(0,-17,3.6,0.3,Math.PI-0.3); ctx.stroke(); ctx.restore(); break; }
    case 'stall': {
      drawShadow(iso.x, iso.y, 36, 13);
      for(const [dx,dy] of [[-27,-14],[27,-14],[-27,14],[27,14]]) tpBox(pr.x+dx,pr.y+dy,3,3,44,TP.darkwood);
      tpBox(pr.x,pr.y+8,52,12,13,TP.wood);
      const goods = pr.goods||0, c = toIso(pr.x, pr.y+8);
      for(let i=0;i<5;i++){ const gx = c.x-20+i*10;
        if(goods===0){ ctx.fillStyle = ['#c0392b','#d8a020','#7aa030','#b05030','#d8a020'][i]; ctx.beginPath(); ctx.arc(gx,c.y-15,3.4,0,7); ctx.fill(); }
        else if(goods===1){ ctx.fillStyle = ['#8a8a96','#aab0bc','#6a6a78','#aab0bc','#8a8a96'][i]; ctx.fillRect(gx-2.5,c.y-21,5,8); }
        else { ctx.fillStyle = ['#6a3a8a','#8a5a2a','#2a6a6a','#8a3a3a','#4a6a2a'][i]; ctx.fillRect(gx-3,c.y-18,6,5); } }
      ctx.save(); ctx.translate(0,-44);
      const cols = pr.awn || ['#8a2a2a','#d0c4a8'];
      for(let i=0;i<6;i++){
        const a=toIso(pr.x-30+i*10, pr.y-16), b=toIso(pr.x-20+i*10, pr.y-16), c2=toIso(pr.x-20+i*10, pr.y+16), d=toIso(pr.x-30+i*10, pr.y+16);
        ctx.fillStyle = cols[i%2]; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.lineTo(c2.x,c2.y); ctx.lineTo(d.x,d.y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(c2.x,c2.y); ctx.lineTo(c2.x,c2.y+6); ctx.lineTo(d.x,d.y+6); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle='rgba(0,0,0,0.45)'; ctx.lineWidth=1; const e1=toIso(pr.x-30,pr.y-16), e2=toIso(pr.x+30,pr.y-16), e3=toIso(pr.x+30,pr.y+16), e4=toIso(pr.x-30,pr.y+16);
      ctx.beginPath(); ctx.moveTo(e1.x,e1.y); ctx.lineTo(e2.x,e2.y); ctx.lineTo(e3.x,e3.y); ctx.lineTo(e4.x,e4.y); ctx.closePath(); ctx.stroke();
      ctx.restore(); break; }
    case 'cart': { drawShadow(iso.x, iso.y, 30, 11);
      ctx.save(); ctx.translate(iso.x, iso.y);
      ctx.strokeStyle='#4a3420'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-40,10); ctx.lineTo(-18,-4); ctx.moveTo(-34,16); ctx.lineTo(-14,2); ctx.stroke();
      ctx.restore();
      tpBox(pr.x,pr.y,44,26,12,TP.wood);
      { const a=toIso(pr.x-18,pr.y-8), b=toIso(pr.x+18,pr.y-8), c=toIso(pr.x+18,pr.y+8), d=toIso(pr.x-18,pr.y+8);
        ctx.fillStyle='#b8984a'; ctx.beginPath(); ctx.moveTo(a.x,a.y-17); ctx.quadraticCurveTo((a.x+b.x)/2,a.y-28,b.x,b.y-17); ctx.lineTo(c.x,c.y-12); ctx.lineTo(d.x,d.y-12); ctx.closePath(); ctx.fill(); ctx.strokeStyle='rgba(60,40,10,0.6)'; ctx.lineWidth=1; ctx.stroke(); }
      ctx.save(); ctx.translate(iso.x, iso.y);
      for(const [wx2,wy2] of [[-6,13],[20,10]]){ ctx.fillStyle='#2e2014'; ctx.strokeStyle='#120c06'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(wx2,wy2-3,3.6,9,0,0,7); ctx.fill(); ctx.stroke();
        ctx.strokeStyle='#6a4c2c'; ctx.beginPath(); ctx.moveTo(wx2,wy2-11); ctx.lineTo(wx2,wy2+5); ctx.moveTo(wx2-3,wy2-3); ctx.lineTo(wx2+3,wy2-3); ctx.stroke(); }
      ctx.restore(); break; }
    case 'bench': { drawShadow(iso.x, iso.y, 20, 7);
      const ax = pr.axis==='y';
      const w = ax?10:36, h = ax?36:10;
      tpBox(pr.x-(ax?0:13),pr.y-(ax?13:0),ax?8:4,ax?4:8,8,TP.darkwood); tpBox(pr.x+(ax?0:13),pr.y+(ax?13:0),ax?8:4,ax?4:8,8,TP.darkwood);
      tpBox(pr.x,pr.y,w,h,3,TP.wood,8); break; }
    case 'board': { drawShadow(iso.x, iso.y, 22, 8);
      tpBox(pr.x-14,pr.y,4,4,42,TP.darkwood); tpBox(pr.x+14,pr.y,4,4,42,TP.darkwood);
      tpBox(pr.x,pr.y,34,3,22,TP.wood,18);
      const c = toIso(pr.x, pr.y+2);
      for(const [dx,dy,w,h,col] of [[-11,-30,9,11,'#e8dcb8'],[0,-33,8,10,'#d8c898'],[10,-29,9,12,'#e8dcb8'],[-3,-22,7,7,'#c8b888']]){ ctx.fillStyle=col; ctx.fillRect(c.x+dx,c.y+dy+4,w,h); ctx.strokeStyle='rgba(60,40,10,0.5)'; ctx.strokeRect(c.x+dx,c.y+dy+4,w,h); }
      break; }
    case 'fence': { const ax = pr.axis==='y', n = Math.round(pr.len/22);
      for(let i=0;i<=n;i++){ const px = pr.x+(ax?0:i*22), py = pr.y+(ax?i*22:0); tpBox(px,py,4,4,26,TP.darkwood); }
      for(const lf of [10,19]){ ctx.save(); ctx.translate(0,-lf); drawBlock({x:pr.x-(ax?1.2:0),y:pr.y-(ax?0:1.2),w:ax?2.4:pr.len,h:ax?pr.len:2.4}, 3, TP.wood[0], TP.wood[1], TP.wood[2]); ctx.restore(); }
      break; }
    case 'tanframe': { // wooden frame with a stretched hide being scraped/tanned
      drawShadow(iso.x, iso.y, 24, 8); ctx.save(); ctx.translate(iso.x, iso.y);
      ctx.strokeStyle='#3a2a18'; ctx.lineWidth=3.2; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(-22,2); ctx.lineTo(-18,-46); ctx.moveTo(22,2); ctx.lineTo(18,-46); ctx.moveTo(-20,-44); ctx.lineTo(20,-44); ctx.moveTo(-21,-6); ctx.lineTo(21,-6); ctx.stroke();
      const hg=ctx.createLinearGradient(-16,-40,16,-8); hg.addColorStop(0,pr.c1||'#a0784a'); hg.addColorStop(1,pr.c2||'#6e4e30');
      ctx.fillStyle=hg; ctx.strokeStyle='#2a1a0c'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(-16,-40); ctx.lineTo(-7,-42); ctx.lineTo(0,-38); ctx.lineTo(8,-42); ctx.lineTo(16,-40); ctx.lineTo(13,-30); ctx.lineTo(17,-22); ctx.lineTo(12,-12); ctx.lineTo(16,-9); ctx.lineTo(-15,-9); ctx.lineTo(-12,-18); ctx.lineTo(-17,-28); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle='rgba(30,16,6,0.55)'; ctx.lineWidth=1; ctx.setLineDash([2,3]); ctx.beginPath(); ctx.moveTo(-12,-34); ctx.lineTo(10,-16); ctx.moveTo(-8,-38); ctx.lineTo(12,-24); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle='#d8cdb0'; ctx.lineWidth=1; for(const [a,b] of [[-16,-40],[16,-40],[-15,-9],[16,-9],[-17,-28],[17,-22]]){ ctx.beginPath(); ctx.moveTo(a,b); ctx.lineTo(a+(a<0?-4:4),b); ctx.stroke(); }
      ctx.restore(); break; }
    case 'pelts': { // drying line with hanging pelts between two poles
      const L = pr.len||90, ax = pr.axis==='y';
      drawShadow(iso.x, iso.y, 18, 6);
      tpBox(pr.x,pr.y,4,4,38,TP.darkwood); tpBox(pr.x+(ax?0:L),pr.y+(ax?L:0),4,4,38,TP.darkwood);
      ctx.save(); ctx.translate(0,-34); drawBlock({x:pr.x-(ax?1:0),y:pr.y-(ax?0:1),w:ax?2:L,h:ax?L:2}, 2, TP.darkwood[0], TP.darkwood[1], TP.darkwood[2]); ctx.restore();
      const n = Math.max(2, Math.floor(L/26)), cs=['#8a6a44','#5a4630','#a08a66','#6a5238','#7a5a3a'];
      for(let i=0;i<n;i++){ const f=(i+0.5)/n, q=toIso(pr.x+(ax?0:L*f), pr.y+(ax?L*f:0)); const sw=Math.sin(t*1.4+i*1.7)*1.2;
        ctx.fillStyle=cs[i%cs.length]; ctx.strokeStyle='#2a1a0c'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(q.x-7,q.y-34); ctx.lineTo(q.x+7,q.y-34); ctx.lineTo(q.x+9+sw,q.y-22); ctx.lineTo(q.x+5+sw,q.y-14); ctx.lineTo(q.x+8+sw,q.y-7); ctx.lineTo(q.x+sw,q.y-4); ctx.lineTo(q.x-7+sw,q.y-8); ctx.lineTo(q.x-5+sw,q.y-16); ctx.lineTo(q.x-9+sw,q.y-24); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      break; }
    case 'hidepile': { drawShadow(iso.x, iso.y, 18, 7); ctx.save(); ctx.translate(iso.x, iso.y);
      const cs=['#7a5a38','#5a4430','#9a7e58','#6a4e34']; for(let i=0;i<4;i++){ const w=22-i*2.5, y=-i*4;
        ctx.fillStyle=cs[i]; ctx.strokeStyle='#241608'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse((i%2?3:-2),y-3,w,6,0.1*(i%2?1:-1),0,7); ctx.fill(); ctx.stroke(); }
      ctx.restore(); break; }
    case 'stump': { drawShadow(iso.x, iso.y, 14, 5); ctx.save(); ctx.translate(iso.x, iso.y);
      ctx.fillStyle='#4a3420'; ctx.strokeStyle='#1e1208'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-11,0); ctx.lineTo(-10,-14); ctx.lineTo(10,-14); ctx.lineTo(11,0); ctx.quadraticCurveTo(0,5,-11,0); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#b89468'; ctx.beginPath(); ctx.ellipse(0,-14,10,4.4,0,0,7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle='rgba(90,60,30,0.7)'; ctx.beginPath(); ctx.ellipse(0,-14,5,2.2,0,0,7); ctx.stroke();
      if(pr.knife){ ctx.strokeStyle='#c8ccd4'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(-2,-15); ctx.lineTo(6,-21); ctx.stroke(); ctx.strokeStyle='#5a3a1a'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(6,-21); ctx.lineTo(9,-23); ctx.stroke(); }
      ctx.restore(); break; }
    case 'spit': { // roasting spit by the fire
      drawShadow(iso.x, iso.y, 26, 8); ctx.save(); ctx.translate(iso.x, iso.y);
      ctx.strokeStyle='#2a1d12'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-22,2); ctx.lineTo(-22,-24); ctx.lineTo(-27,-28); ctx.moveTo(-22,-24); ctx.lineTo(-17,-28); ctx.moveTo(22,2); ctx.lineTo(22,-24); ctx.lineTo(17,-28); ctx.moveTo(22,-24); ctx.lineTo(27,-28); ctx.stroke();
      ctx.strokeStyle='#7a5a38'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(-26,-25); ctx.lineTo(26,-25); ctx.stroke();
      ctx.fillStyle='#8a4a2a'; ctx.strokeStyle='#2a1208'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(0,-25,13,6.5,0,0,7); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#b4683a'; ctx.beginPath(); ctx.ellipse(-3,-27,7,2.6,0,0,7); ctx.fill();
      ctx.restore(); break; }
    case 'antlers': { // trophy pole: skull + antlers
      drawShadow(iso.x, iso.y, 10, 4); ctx.save(); ctx.translate(iso.x, iso.y);
      ctx.strokeStyle='#3a2a18'; ctx.lineWidth=3.4; ctx.beginPath(); ctx.moveTo(0,2); ctx.lineTo(0,-40); ctx.stroke();
      ctx.strokeStyle='#d8cdb0'; ctx.lineWidth=2; ctx.lineCap='round';
      for(const sx of [-1,1]){ ctx.beginPath(); ctx.moveTo(sx*3,-40); ctx.quadraticCurveTo(sx*12,-44,sx*13,-56); ctx.moveTo(sx*9,-46); ctx.lineTo(sx*15,-47); ctx.moveTo(sx*12,-51); ctx.lineTo(sx*8,-58); ctx.stroke(); }
      ctx.fillStyle='#d8cdb0'; ctx.strokeStyle='#4a4030'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-5,-38); ctx.quadraticCurveTo(-6,-46,0,-47); ctx.quadraticCurveTo(6,-46,5,-38); ctx.lineTo(2,-32); ctx.lineTo(-2,-32); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#17120c'; ctx.fillRect(-3.4,-42,2.4,3); ctx.fillRect(1,-42,2.4,3);
      ctx.restore(); break; }
    case 'trough': { drawShadow(iso.x, iso.y, 26, 9); tpBox(pr.x,pr.y,42,16,11,TP.wood);
      const a=toIso(pr.x-18,pr.y-5), b=toIso(pr.x+18,pr.y-5), c=toIso(pr.x+18,pr.y+5), d=toIso(pr.x-18,pr.y+5);
      ctx.fillStyle='#27495a'; ctx.beginPath(); ctx.moveTo(a.x,a.y-11); ctx.lineTo(b.x,b.y-11); ctx.lineTo(c.x,c.y-11); ctx.lineTo(d.x,d.y-11); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(160,200,220,0.25)'; ctx.fillRect(iso.x-8,iso.y-14+Math.sin(t*2)*0.6,12,1.6); break; }
    case 'rack': { drawShadow(iso.x, iso.y, 20, 7);
      tpBox(pr.x-16,pr.y,4,4,36,TP.darkwood); tpBox(pr.x+16,pr.y,4,4,36,TP.darkwood); tpBox(pr.x,pr.y,36,3,3,TP.darkwood,26); tpBox(pr.x,pr.y,36,3,3,TP.darkwood,10);
      ctx.save(); ctx.translate(iso.x, iso.y+1);
      const cols=['#b8c0cc','#a8b0bc','#c8ccd4','#9aa2ae'];
      for(let i=0;i<4;i++){ const x0=-12+i*8; ctx.strokeStyle=cols[i]; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(x0,-6); ctx.lineTo(x0+2,-30); ctx.stroke(); ctx.strokeStyle='#5a3a1a'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x0-3,-9); ctx.lineTo(x0+5,-9); ctx.stroke(); }
      ctx.restore(); break; }
    case 'grind': { drawShadow(iso.x, iso.y, 16, 6); ctx.save(); ctx.translate(iso.x, iso.y);
      ctx.strokeStyle='#3a2a18'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-10,0); ctx.lineTo(-6,-16); ctx.moveTo(10,0); ctx.lineTo(6,-16); ctx.moveTo(-6,-16); ctx.lineTo(6,-16); ctx.stroke();
      ctx.fillStyle='#8a8a94'; ctx.strokeStyle='#2a2a32'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.ellipse(0,-17,10,10,0,0,7); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#5a5a64'; ctx.beginPath(); ctx.arc(0,-17,3,0,7); ctx.fill();
      ctx.strokeStyle='rgba(255,170,70,'+(0.4+0.3*Math.sin(t*9))+')'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(8,-12); ctx.lineTo(14,-8); ctx.moveTo(9,-9); ctx.lineTo(13,-4); ctx.stroke();
      ctx.restore(); break; }
    case 'coal': { drawShadow(iso.x, iso.y, 16, 6); tpBox(pr.x,pr.y,24,18,9,TP.darkwood);
      ctx.save(); ctx.translate(iso.x, iso.y-9); ctx.fillStyle='#17171c'; for(const [dx,dy,r] of [[-6,-3,4],[2,-5,5],[7,0,3.4],[-1,1,3.8]]){ ctx.beginPath(); ctx.arc(dx,dy,r,0,7); ctx.fill(); }
      ctx.fillStyle='rgba(255,120,40,0.7)'; ctx.fillRect(1,-5,2,2); ctx.restore(); break; }
    case 'fishcrate': { drawShadow(iso.x, iso.y, 14, 6); tpBox(pr.x,pr.y,20,16,10,TP.wood);
      ctx.save(); ctx.translate(iso.x, iso.y-10); for(const [dx,dy] of [[-5,-1],[1,-2],[6,0],[-1,2]]){ ctx.fillStyle='#9ab4c4'; ctx.beginPath(); ctx.ellipse(dx,dy,4.4,1.8,-0.3,0,7); ctx.fill(); ctx.fillStyle='#6a8498'; ctx.beginPath(); ctx.moveTo(dx+4,dy); ctx.lineTo(dx+7,dy-2); ctx.lineTo(dx+7,dy+2); ctx.closePath(); ctx.fill(); }
      ctx.restore(); break; }
    case 'netrack': { drawShadow(iso.x, iso.y, 26, 8);
      tpBox(pr.x-20,pr.y,4,4,38,TP.darkwood); tpBox(pr.x+20,pr.y,4,4,38,TP.darkwood); tpBox(pr.x,pr.y,40,3,3,TP.darkwood,36);
      ctx.save(); ctx.translate(iso.x, iso.y); ctx.strokeStyle='rgba(120,150,130,0.75)'; ctx.lineWidth=1;
      ctx.beginPath(); for(let i=-18;i<=18;i+=6){ ctx.moveTo(i,-35); ctx.quadraticCurveTo(i+2,-22,i-1,-8); } for(let j=0;j<4;j++){ const yy=-33+j*7; ctx.moveTo(-18,yy); ctx.quadraticCurveTo(0,yy+4,18,yy); } ctx.stroke(); ctx.restore(); break; }
    case 'rope': { ctx.save(); ctx.translate(iso.x, iso.y); drawShadow(0,0,9,4);
      for(let i=0;i<3;i++){ ctx.strokeStyle=i%2?'#a88c58':'#c4a86c'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.ellipse(0,-i*2.2-1,7-i*0.8,3.2,0,0,7); ctx.stroke(); }
      ctx.restore(); break; }
    case 'anchor': { ctx.save(); ctx.translate(iso.x, iso.y); drawShadow(0,0,12,5);
      ctx.strokeStyle='#5a5e6a'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(0,-26); ctx.lineTo(0,-2); ctx.moveTo(-9,-20); ctx.lineTo(9,-20); ctx.moveTo(-10,-6); ctx.quadraticCurveTo(0,6,10,-6); ctx.stroke();
      ctx.beginPath(); ctx.arc(0,-29,3,0,7); ctx.stroke(); ctx.restore(); break; }
    case 'bush': { ctx.save(); ctx.translate(iso.x, iso.y); drawShadow(0,0,13,5);
      for(const [dx,dy,r,c] of [[-7,-6,8,'#183a24'],[6,-7,9,'#1f4a2c'],[0,-12,8,'#26573a']]){ ctx.fillStyle=c; ctx.beginPath(); ctx.arc(dx,dy,r,0,7); ctx.fill(); }
      if(pr.flowers){ for(const [dx,dy,c] of [[-6,-10,'#d8c8e8'],[5,-13,'#e8d070'],[1,-5,'#e89aa8']]){ ctx.fillStyle=c; ctx.beginPath(); ctx.arc(dx,dy,1.6,0,7); ctx.fill(); } }
      ctx.restore(); break; }
    case 'reeds': { ctx.save(); ctx.translate(iso.x, iso.y); ctx.strokeStyle='#4a6a3a'; ctx.lineWidth=1.4; ctx.lineCap='round';
      for(let i=-3;i<=3;i++){ ctx.beginPath(); ctx.moveTo(i*2.4,0); ctx.quadraticCurveTo(i*2.8+Math.sin(t*1.5+i)*1.4,-12,i*3.4,-22-((i*7)%5)); ctx.stroke(); }
      ctx.fillStyle='#6a4a2c'; for(const i of [-2,1,3]){ ctx.fillRect(i*2.6-1,-27+((i*5)%4),2,6); } ctx.restore(); break; }
    case 'rock': { ctx.save(); ctx.translate(iso.x, iso.y); drawShadow(0,0,11,4);
      ctx.fillStyle='#5a5c66'; ctx.strokeStyle='#22242c'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(-6,-8); ctx.lineTo(2,-11); ctx.lineTo(9,-5); ctx.lineTo(8,0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(-6,-8); ctx.lineTo(2,-11); ctx.lineTo(0,-6); ctx.closePath(); ctx.fill(); ctx.restore(); break; }
    case 'scarecrow': { ctx.save(); ctx.translate(iso.x, iso.y); drawShadow(0,0,8,3);
      ctx.strokeStyle='#4a3420'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-34); ctx.moveTo(-14,-24); ctx.lineTo(14,-24); ctx.stroke();
      ctx.fillStyle='#6a5a3a'; ctx.beginPath(); ctx.moveTo(-6,-26); ctx.lineTo(6,-26); ctx.lineTo(7,-12); ctx.lineTo(-7,-12); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#c8b070'; ctx.beginPath(); ctx.arc(0,-38,5,0,7); ctx.fill(); ctx.fillStyle='#3a2a1a'; ctx.fillRect(-7,-44,14,3); ctx.fillRect(-4,-50,8,6); ctx.restore(); break; }
  }
}
// Moored fishing boat: appears once the lighthouse beacon has been relit. Purely cosmetic.
function drawTownBoat(bt, t){
  const iso = toIso(bt.x, bt.y), bob = Math.sin(t*1.3)*1.4, roll = Math.sin(t*0.9)*0.5, S = bt.s||1;
  const P = (u,v,z)=>({x:iso.x+(u-v)*ISO_KX, y:iso.y+(u+v)*ISO_KY - (z||0) + bob + u*roll*0.04});
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(S,S); ctx.translate(-iso.x, -iso.y);
  // water ripples around the hull
  for(let i=0;i<2;i++){ const ph=(t*0.45+i*0.5)%1; ctx.strokeStyle='rgba(150,190,205,'+(0.28*(1-ph))+')'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.ellipse(iso.x,iso.y+2,64+ph*16,22+ph*6,0,0,7); ctx.stroke(); }
  ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(iso.x,iso.y+4,56,17,0,0,7); ctx.fill();
  const hull = [[-52,0],[-38,-15],[28,-17],[58,0],[28,17],[-38,15]];
  const lo = hull.map(p=>P(p[0]*0.9,p[1]*0.8,-2)), up = hull.map(p=>P(p[0],p[1],8));
  ctx.lineJoin='round';
  for(let i=0;i<hull.length;i++){ const j=(i+1)%hull.length;
    ctx.fillStyle = i<3 ? '#3c2616' : '#53381f'; ctx.strokeStyle='#150c06'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(lo[i].x,lo[i].y); ctx.lineTo(lo[j].x,lo[j].y); ctx.lineTo(up[j].x,up[j].y); ctx.lineTo(up[i].x,up[i].y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle='#6a4a2a'; ctx.beginPath(); up.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.closePath(); ctx.fill(); ctx.stroke();
  const inner = hull.map(p=>P(p[0]*0.84,p[1]*0.72,6));
  ctx.fillStyle='#2a1a0e'; ctx.beginPath(); inner.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(20,10,4,0.55)'; ctx.lineWidth=1; for(let u=-30;u<=30;u+=15){ const a=P(u,-11,6), b=P(u,11,6); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
  ctx.strokeStyle='#b8984a'; ctx.lineWidth=1.4; ctx.beginPath(); up.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.closePath(); ctx.stroke();
  // crates and a coil of rope on deck
  { const a=P(-26,-4,10); ctx.fillStyle='#8a6a40'; ctx.fillRect(a.x-6,a.y-8,12,9); ctx.strokeStyle='#2a1a0a'; ctx.strokeRect(a.x-6,a.y-8,12,9);
    const b=P(-10,6,8); ctx.strokeStyle='#c4a86c'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(b.x,b.y-1,6,2.6,0,0,7); ctx.stroke(); }
  // mast, furled sail on the boom, rigging and a hanging lantern
  const m0 = P(4,0,8), m1 = P(4,0,74);
  ctx.strokeStyle='#4a3220'; ctx.lineWidth=3.6; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(m0.x,m0.y); ctx.lineTo(m1.x,m1.y); ctx.stroke();
  const b0 = P(-30,0,38), b1 = P(22,0,38);
  ctx.strokeStyle='#5a4028'; ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(b0.x,b0.y); ctx.lineTo(b1.x,b1.y); ctx.stroke();
  ctx.strokeStyle='#d6ccb2'; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(b0.x+3,b0.y+2); ctx.lineTo(b1.x-3,b1.y+2); ctx.stroke();
  ctx.strokeStyle='#8a7a5a'; ctx.lineWidth=1; for(let i=0;i<5;i++){ const q=P(-26+i*10,0,38); ctx.beginPath(); ctx.moveTo(q.x,q.y-1); ctx.lineTo(q.x,q.y+5); ctx.stroke(); }
  ctx.strokeStyle='rgba(60,44,28,0.9)'; ctx.lineWidth=1; for(const [u,v] of [[-40,-10],[44,0],[-40,10]]){ const q=P(u,v,9); ctx.beginPath(); ctx.moveTo(m1.x,m1.y); ctx.lineTo(q.x,q.y); ctx.stroke(); }
  ctx.fillStyle='#8a2a2a'; ctx.beginPath(); ctx.moveTo(m1.x,m1.y); ctx.lineTo(m1.x+16,m1.y+4+Math.sin(t*3)*1.2); ctx.lineTo(m1.x,m1.y+9); ctx.closePath(); ctx.fill();
  const lp = P(22,0,30), fl = 2.4+Math.sin(t*8)*0.6;
  ctx.fillStyle='#2a2018'; ctx.fillRect(lp.x-3.5,lp.y-4,7,9); ctx.fillStyle='rgba(255,200,110,0.95)'; ctx.fillRect(lp.x-2.5,lp.y-3,5,7); ctx.fillStyle='#fff0b8'; ctx.beginPath(); ctx.arc(lp.x,lp.y,fl*0.55,0,7); ctx.fill();
  // mooring lines to the pier
  ctx.strokeStyle='#b49a68'; ctx.lineWidth=1.4; for(const [u,v,px,py] of [[-28,-15,bt.x-100,TOWN_PIER.y+TOWN_PIER.h-4],[24,-16,bt.x+60,TOWN_PIER.y+TOWN_PIER.h-4]]){ const a=P(u,v,8), bw=toIso(px,py), b={x:iso.x+(bw.x-iso.x)/S, y:iso.y+(bw.y-iso.y)/S}; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2+7,b.x,b.y-10); ctx.stroke(); }
  ctx.restore();
}
function drawTownDock(g, room){
  const T = g.town; if(!T) return; const t = g.clock||0;
  const kc = ['#6a6c78','#24262e','#3e404c'];
  drawBlock({x:TOWN_SHORE_X-6,y:TOWN_SHORE_Y-4,w:12,h:TOWN_PIER.y-(TOWN_SHORE_Y-4)}, 12, kc[0],kc[1],kc[2]);
  drawBlock({x:TOWN_SHORE_X-6,y:TOWN_PIER.y+TOWN_PIER.h,w:12,h:room.h-(TOWN_PIER.y+TOWN_PIER.h)}, 12, kc[0],kc[1],kc[2]);
  drawBlock({x:-10,y:TOWN_SHORE_Y-4,w:TOWN_SHORE_X+4,h:12}, 12, kc[0],kc[1],kc[2]);
  // the pier deck
  const P = TOWN_PIER;
  drawBlock({x:P.x,y:P.y,w:P.w,h:P.h}, 12, '#7b5b3a', '#2e2012', '#523a22');
  ctx.save(); ctx.translate(0,-12);
  for(let x=P.x+8;x<P.x+P.w;x+=20){ const a=toIso(x,P.y), b=toIso(x,P.y+P.h); ctx.strokeStyle='rgba(30,18,8,0.55)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
  for(const yy of [P.y+4, P.y+P.h-4]){ const a=toIso(P.x,yy), b=toIso(P.x+P.w,yy); ctx.strokeStyle='#4a3420'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
  for(let x=P.x+14;x<P.x+P.w;x+=60){ const a=toIso(x,P.y+P.h/2); ctx.fillStyle='rgba(255,230,180,0.07)'; ctx.fillRect(a.x-12,a.y-2,24,4); }
  ctx.restore();
}
// Half-timber / slate detailing for Mistfall's houses (b.style==='town'): stone footing, timber frame, shingles, lit windows, door, sign
function drawTownBuildingDetails(b){
  const hz = b.hz, t = (game && game.clock) || 0, lit = b.lit !== false;
  const c1=toIso(b.x+b.w,b.y), c2=toIso(b.x+b.w,b.y+b.h), c3=toIso(b.x,b.y+b.h);
  const peakIso = toIso(b.x+b.w/2, b.y+b.h/2), peak = {x:peakIso.x, y:peakIso.y-hz-b.roofH};
  const F=(u,h)=>({x:c3.x+(c2.x-c3.x)*u, y:c3.y+(c2.y-c3.y)*u-h});
  const R=(u,h)=>({x:c2.x+(c1.x-c2.x)*u, y:c2.y+(c1.y-c2.y)*u-h});
  const quad=(a,bb,c,d)=>{ ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(bb.x,bb.y); ctx.lineTo(c.x,c.y); ctx.lineTo(d.x,d.y); ctx.closePath(); };
  const line=(a,bb)=>{ ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(bb.x,bb.y); ctx.stroke(); };
  const baseH = hz*0.24;
  ctx.save(); ctx.lineJoin='round'; ctx.lineCap='round';
  // plaster between the timbers, stone footing below
  ctx.fillStyle='rgba(222,206,176,0.19)'; quad(F(0,baseH),F(1,baseH),F(1,hz),F(0,hz)); ctx.fill();
  ctx.fillStyle='rgba(222,206,176,0.08)'; quad(R(0,baseH),R(1,baseH),R(1,hz),R(0,hz)); ctx.fill();
  ctx.fillStyle='#585a64'; quad(F(0,0),F(1,0),F(1,baseH),F(0,baseH)); ctx.fill();
  ctx.fillStyle='#32343c'; quad(R(0,0),R(1,0),R(1,baseH),R(0,baseH)); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.38)'; ctx.lineWidth=1;
  for(const face of [F,R]){ line(face(0,baseH*0.5),face(1,baseH*0.5)); const n = face===F ? Math.max(4,Math.round(b.w/16)) : Math.max(4,Math.round(b.h/16)); for(let i=1;i<n;i++){ const u=i/n; line(face(u,i%2?0:baseH*0.5), face(u,i%2?baseH*0.5:baseH)); } }
  // timber frame
  ctx.strokeStyle='#241810'; ctx.lineWidth=2.4;
  for(const u of [0,0.34,0.66,1]) line(F(u,baseH),F(u,hz));
  for(const u of [0,0.5,1]) line(R(u,baseH),R(u,hz));
  for(const h of [baseH, hz*0.97]){ line(F(0,h),F(1,h)); line(R(0,h),R(1,h)); }
  ctx.lineWidth=1.8; line(F(0,baseH),F(0.34,hz*0.97)); line(F(1,baseH),F(0.66,hz*0.97)); line(R(0,baseH),R(0.5,hz*0.97)); line(R(1,baseH),R(0.5,hz*0.97));
  // windows
  const win = (face,u,w)=>{
    const a=face(u-w,hz*0.46), bb=face(u+w,hz*0.46), c=face(u+w,hz*0.84), d=face(u-w,hz*0.84);
    ctx.fillStyle = lit ? 'rgba(255,198,112,0.62)' : 'rgba(40,52,66,0.8)'; quad(a,bb,c,d); ctx.fill();
    ctx.strokeStyle='#1c1208'; ctx.lineWidth=1.6; quad(a,bb,c,d); ctx.stroke();
    ctx.lineWidth=1; line(face(u,hz*0.46),face(u,hz*0.84)); line(face(u-w,hz*0.65),face(u+w,hz*0.65));
    ctx.fillStyle=b.shutter||'#3a2a1e';
    const s1=face(u-w-0.045,hz*0.46), s2=face(u-w,hz*0.46), s3=face(u-w,hz*0.84), s4=face(u-w-0.045,hz*0.84); quad(s1,s2,s3,s4); ctx.fill();
    const q1=face(u+w,hz*0.46), q2=face(u+w+0.045,hz*0.46), q3=face(u+w+0.045,hz*0.84), q4=face(u+w,hz*0.84); quad(q1,q2,q3,q4); ctx.fill();
    if(lit){ ctx.fillStyle='rgba(255,190,100,0.12)'; const g=face(u,hz*0.4); ctx.beginPath(); ctx.ellipse(g.x,g.y+6,16,6,0,0,7); ctx.fill(); }
  };
  if(b.window!==false){
    if(b.door){ win(F,0.19,0.07); win(F,0.81,0.07); if(b.w>150){ win(F,0.075,0.04); win(F,0.925,0.04); } } else { win(F,0.3,0.08); win(F,0.7,0.08); }
    win(R,0.5,0.08); if(b.h>130){ win(R,0.2,0.06); win(R,0.8,0.06); }
  }
  // furnace mouth glowing on the right wall (the forge)
  if(b.furnace){
    const fl = 0.75+0.25*Math.sin(t*9)*Math.sin(t*5.3);
    const a=R(0.34,baseH), bb=R(0.66,baseH), c=R(0.66,baseH+hz*0.4), d=R(0.34,baseH+hz*0.4);
    ctx.fillStyle='#1a1214'; quad(R(0.3,baseH-1),R(0.7,baseH-1),R(0.7,baseH+hz*0.46),R(0.3,baseH+hz*0.46)); ctx.fill();
    const gr = ctx.createLinearGradient(0,a.y,0,d.y); gr.addColorStop(0,'rgba(255,190,70,'+fl+')'); gr.addColorStop(1,'rgba(220,70,20,'+fl+')');
    ctx.fillStyle=gr; quad(a,bb,c,d); ctx.fill();
    ctx.strokeStyle='#3a3a44'; ctx.lineWidth=2; quad(R(0.3,baseH-1),R(0.7,baseH-1),R(0.7,baseH+hz*0.46),R(0.3,baseH+hz*0.46)); ctx.stroke();
    ctx.fillStyle='rgba(255,140,50,0.14)'; const g0=R(0.5,baseH); ctx.beginPath(); ctx.ellipse(g0.x+8,g0.y+10,34,12,0,0,7); ctx.fill();
  }
  // door with frame, planks and a lantern beside it
  if(b.door){
    const dw = b.w>200 ? 0.07 : 0.1, dh = hz*0.64;
    ctx.fillStyle='#4a4a54'; quad(F(0.5-dw-0.02,0),F(0.5+dw+0.02,0),F(0.5+dw+0.02,dh+3),F(0.5-dw-0.02,dh+3)); ctx.fill();
    ctx.fillStyle='#3a2414'; quad(F(0.5-dw,0),F(0.5+dw,0),F(0.5+dw,dh),F(0.5-dw,dh)); ctx.fill();
    ctx.strokeStyle='#150c06'; ctx.lineWidth=1.4; quad(F(0.5-dw,0),F(0.5+dw,0),F(0.5+dw,dh),F(0.5-dw,dh)); ctx.stroke();
    ctx.strokeStyle='rgba(10,6,2,0.6)'; ctx.lineWidth=1; for(const u of [-0.5,0,0.5]) line(F(0.5+dw*u,0),F(0.5+dw*u,dh));
    ctx.strokeStyle='#2a2c34'; ctx.lineWidth=2; line(F(0.5-dw,dh*0.25),F(0.5+dw,dh*0.25)); line(F(0.5-dw,dh*0.75),F(0.5+dw,dh*0.75));
    const hd=F(0.5+dw*0.55,dh*0.5); ctx.fillStyle='#d8b25a'; ctx.beginPath(); ctx.arc(hd.x,hd.y,1.6,0,7); ctx.fill();
    ctx.fillStyle='rgba(255,190,90,0.3)'; const sp=F(0.5,0); ctx.fillRect(sp.x-7,sp.y-1,14,2);
    const lp = F(0.5+dw+0.07, dh*0.95);
    ctx.strokeStyle='#241c14'; ctx.lineWidth=1.6; line(F(0.5+dw+0.07,dh*0.7), lp);
    ctx.fillStyle='#2a2018'; ctx.fillRect(lp.x-3,lp.y-8,6,8);
    if(lit){ ctx.fillStyle='rgba(255,200,110,0.95)'; ctx.fillRect(lp.x-2,lp.y-7,4,6); ctx.fillStyle='rgba(255,190,90,0.14)'; ctx.beginPath(); ctx.arc(lp.x,lp.y-4,16,0,7); ctx.fill(); }
  }
  // roof: shingle rows and ridge
  ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1;
  const rA={x:c1.x,y:c1.y-hz}, rB={x:c2.x,y:c2.y-hz}, rC={x:c3.x,y:c3.y-hz}, lp2=(p,q,u)=>({x:p.x+(q.x-p.x)*u, y:p.y+(q.y-p.y)*u});
  for(let i=1;i<=5;i++){ const u=i/6; const a=lp2(rA,peak,u), bb=lp2(rB,peak,u), c=lp2(rC,peak,u); line(a,bb); line(bb,c);
    const nA = Math.max(2,Math.round(Math.hypot(bb.x-a.x,bb.y-a.y)/9)); for(let k=0;k<nA;k++){ const p=lp2(a,bb,(k+0.5)/nA); line(p,{x:p.x,y:p.y-5}); }
    const nC = Math.max(2,Math.round(Math.hypot(c.x-bb.x,c.y-bb.y)/9)); for(let k=0;k<nC;k++){ const p=lp2(bb,c,(k+(i%2?0.5:0.1))/nC); line(p,{x:p.x,y:p.y-5}); } }
  ctx.strokeStyle='rgba(255,240,210,0.16)'; ctx.lineWidth=1.4; line(rB,rC); line(rA,rB);
  ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=2; line(rA,peak); line(rB,peak); line(rC,peak);
  // hanging sign
  if(b.sign){
    const p0=F(0.88,hz*0.78);
    ctx.strokeStyle='#241c14'; ctx.lineWidth=2; line(p0,{x:p0.x+13,y:p0.y});
    ctx.strokeStyle='#4a3a28'; ctx.lineWidth=1; line({x:p0.x+4,y:p0.y},{x:p0.x+4,y:p0.y+4}); line({x:p0.x+12,y:p0.y},{x:p0.x+12,y:p0.y+4});
    ctx.fillStyle='#5a3c22'; ctx.strokeStyle='#1c1208'; ctx.lineWidth=1; ctx.fillRect(p0.x+1,p0.y+4,14,12); ctx.strokeRect(p0.x+1,p0.y+4,14,12);
    const cx=p0.x+8, cy=p0.y+10; ctx.strokeStyle='#e8d098'; ctx.fillStyle='#e8d098'; ctx.lineWidth=1.6;
    if(b.sign==='hammer'){ ctx.beginPath(); ctx.moveTo(cx-3,cy+4); ctx.lineTo(cx+3,cy-3); ctx.stroke(); ctx.fillRect(cx-1,cy-6,6,3); }
    else if(b.sign==='mug'){ ctx.fillRect(cx-4,cy-4,6,8); ctx.beginPath(); ctx.arc(cx+3,cy,2.4,-1.4,1.4); ctx.stroke(); }
    else if(b.sign==='fish'){ ctx.beginPath(); ctx.ellipse(cx-1,cy,4.4,2.4,0,0,7); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx+3,cy); ctx.lineTo(cx+6,cy-3); ctx.lineTo(cx+6,cy+3); ctx.closePath(); ctx.fill(); }
    else if(b.sign==='sack'){ ctx.beginPath(); ctx.arc(cx,cy+1,4.4,0,7); ctx.fill(); ctx.fillRect(cx-1.5,cy-6,3,3); }
    else if(b.sign==='book'){ ctx.fillRect(cx-5,cy-4,10,8); ctx.strokeStyle='#5a3c22'; line({x:cx,y:cy-4},{x:cx,y:cy+4}); }
  }
  if(b.cross){ ctx.strokeStyle='#cfc8b4'; ctx.lineWidth=2.4; line({x:peak.x,y:peak.y-16},{x:peak.x,y:peak.y+2}); line({x:peak.x-6,y:peak.y-10},{x:peak.x+6,y:peak.y-10}); }
  ctx.restore();
}
function drawTownSmoke(x,y,t,seed){
  ctx.save();
  for(let i=0;i<3;i++){ const ph=(t*0.3+i*0.33+(seed||0)*0.17)%1; ctx.fillStyle='rgba(196,194,200,'+(0.3*(1-ph))+')'; ctx.beginPath(); ctx.arc(x+Math.sin(ph*6+(seed||0))*3.5, y-ph*34, 3+ph*6, 0, 7); ctx.fill(); }
  ctx.restore();
}

function drawTownWater(room, cam){
  const t = (game&&game.clock)||0;
  const pts = [[TOWN_SHORE_X,TOWN_SHORE_Y],[TOWN_SHORE_X,1700],[-1700,1700],[-1700,TOWN_SHORE_Y]].map(p=>toIso(p[0],p[1]));
  if(FLOOR_PASS!==2){ ctx.fillStyle = '#0f2b35'; ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.closePath(); ctx.fill(); }
  for(let wy=TOWN_SHORE_Y+14; wy<room.h+500; wy+=34){
    for(let wx=TOWN_SHORE_X-22; wx>-600; wx-=44){
      const io = toIso(wx,wy), sx = io.x-cam.x, sy = io.y-cam.y;
      if(sx<-60 || sx>W+60 || sy<-40 || sy>H+40) continue;
      const gx = Math.floor(wx/44), gy = Math.floor(wy/34), h = (((gx*73856093)^(gy*19349663))>>>0)%100;
      const s1 = Math.sin(t*1.5+gx*0.9+gy*0.6);
      if(h<45 && FLOOR_PASS!==2){ ctx.fillStyle = (h%2) ? 'rgba(18,56,68,0.55)' : 'rgba(8,30,38,0.5)'; drawDiamond(io.x,io.y,22*ISO_KX*1.6,22*ISO_KY*1.6); }
      if(h%3!==0 && FLOOR_PASS!==1){ ctx.strokeStyle = 'rgba(150,196,210,'+(0.10+0.08*s1)+')'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(io.x-11,io.y+s1*1.5); ctx.quadraticCurveTo(io.x,io.y-3+s1*1.5,io.x+11,io.y+s1*1.5); ctx.stroke(); }
    }
  }
  // foam along the quay
  if(FLOOR_PASS===1) return;
  const a = toIso(TOWN_SHORE_X-3,TOWN_SHORE_Y), b = toIso(TOWN_SHORE_X-3,room.h), c = toIso(-20,TOWN_SHORE_Y+3);
  ctx.strokeStyle = 'rgba(190,220,230,'+(0.22+0.1*Math.sin(t*1.8))+')'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.moveTo(a.x,a.y); ctx.lineTo(c.x,c.y); ctx.stroke();
}

function drawBuildingIso(b){
  const hz = b.hz;
  drawBlock({x:b.x,y:b.y,w:b.w,h:b.h}, hz, b.wallTop, b.wallRight, b.wallFront);
  const c1=toIso(b.x+b.w,b.y), c2=toIso(b.x+b.w,b.y+b.h), c3=toIso(b.x,b.y+b.h);
  const peakIso = toIso(b.x+b.w/2, b.y+b.h/2);
  const peak = {x:peakIso.x, y:peakIso.y-hz-b.roofH};
  ctx.fillStyle = b.roofRight;
  ctx.beginPath(); ctx.moveTo(c1.x,c1.y-hz); ctx.lineTo(c2.x,c2.y-hz); ctx.lineTo(peak.x,peak.y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle = b.roofFront;
  ctx.beginPath(); ctx.moveTo(c2.x,c2.y-hz); ctx.lineTo(c3.x,c3.y-hz); ctx.lineTo(peak.x,peak.y); ctx.closePath(); ctx.fill();
  ctx.stroke();
  if(b.style==='town') drawTownBuildingDetails(b);
  if(b.chimney){
    const chIso = toIso(b.x+b.w*0.74, b.y+b.h*0.24);
    const chH=17, chBase = chIso.y-hz-b.roofH*0.62;
    ctx.fillStyle='#5a4a44';
    ctx.fillRect(chIso.x-4, chBase-chH, 8, chH);
    ctx.strokeStyle='#241c18'; ctx.lineWidth=1; ctx.strokeRect(chIso.x-4, chBase-chH, 8, chH);
    if(b.style==='town' && b.smoke!==false) drawTownSmoke(chIso.x, chBase-chH, (game&&game.clock)||0, b.x);
  }
  if(b.door && b.style!=='town'){
    const doorIso = toIso(b.x+b.w*0.5, b.y+b.h);
    const dw=13, dh=19;
    ctx.fillStyle='#2a1c12';
    roundRect(doorIso.x-dw/2, doorIso.y-dh, dw, dh, 2); ctx.fill();
    ctx.strokeStyle='#140d08'; ctx.lineWidth=1; ctx.stroke();
  }
  if(b.window && b.style!=='town'){
    const winIso = toIso(b.x+b.w*0.2, b.y+b.h);
    ctx.fillStyle='rgba(230,170,90,0.42)';
    roundRect(winIso.x-6, winIso.y-hz*0.6, 12, 12, 2); ctx.fill();
    ctx.strokeStyle='#241c18'; ctx.lineWidth=1; ctx.strokeRect(winIso.x-6, winIso.y-hz*0.6, 12, 12);
  }
}
function drawPortalIso(pr, clock){
  const iso = toIso(pr.x,pr.y);
  const pulse = 1+Math.sin(clock*4)*0.1;
  const rad = pr.r*pulse*ISO_KX;
  ctx.save(); ctx.translate(iso.x,iso.y); ctx.scale(1, ISO_KY/ISO_KX);
  const grad = ctx.createRadialGradient(0,0,2,0,0,rad);
  grad.addColorStop(0,'#d3b4ff'); grad.addColorStop(1,'rgba(90,50,150,0)');
  ctx.fillStyle=grad;
  ctx.beginPath(); ctx.arc(0,0,rad,0,7); ctx.fill();
  ctx.restore();
}
// A dungeon floor's stairs down, replacing the old flat swirling portal --
// steps actually descending into darkness with a pulsing purple glow rising
// from the pit, matching the "way opens" moment once the floor is cleared.
// v170: real staircases. Up = a flight of stone steps climbing away from the viewer between two low
// side walls; Down = a rimmed stairwell whose steps sink into the dark. Used everywhere stairs appear.
// v173: small wooden props for the Tavern interior -- a plain exit door and a short wooden stair.
function drawTavernDoorIso(pos, clock){
  const iso = toIso(pos.x, pos.y);
  drawShadow(iso.x, iso.y+4, 22, 7);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.lineJoin = 'round';
  // frame
  ctx.fillStyle = '#4a3019'; ctx.strokeStyle = '#1c1209'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.rect(-18,-52,36,54); ctx.fill(); ctx.stroke();
  // door leaf
  const dg = ctx.createLinearGradient(-14,0,14,0); dg.addColorStop(0,'#8a5a30'); dg.addColorStop(1,'#6c4424');
  ctx.fillStyle = dg; ctx.beginPath(); ctx.rect(-14,-47,28,49); ctx.fill(); ctx.stroke();
  // planks
  ctx.strokeStyle = 'rgba(30,18,8,0.7)'; ctx.lineWidth = 1;
  ctx.beginPath(); for(const x of [-7,0,7]){ ctx.moveTo(x,-47); ctx.lineTo(x,2); } ctx.stroke();
  // iron straps + handle
  ctx.fillStyle = '#2b2d33'; ctx.fillRect(-14,-38,28,3); ctx.fillRect(-14,-14,28,3);
  ctx.fillStyle = '#d8b25a'; ctx.beginPath(); ctx.arc(8,-22,2.2,0,7); ctx.fill();
  // warm light spilling under the door
  ctx.fillStyle = 'rgba(255,190,90,0.35)'; ctx.fillRect(-13,1,26,3);
  ctx.restore();
}
function drawTavernStairsIso(pos, clock){
  const iso = toIso(pos.x, pos.y);
  drawShadow(iso.x, iso.y+4, 24, 7);
  ctx.save(); ctx.translate(iso.x, iso.y);
  const N = 5, rise = 5, run = 5, w = 30, y0 = 6;
  const topY = y0 - N*run - N*rise;
  ctx.strokeStyle = '#1c1209'; ctx.lineWidth = 1;
  // side stringers
  for(const sx of [-1,1]){
    ctx.fillStyle = '#5a3b1e';
    ctx.beginPath(); ctx.moveTo(sx*w/2,y0); ctx.lineTo(sx*(w/2+3),y0+2); ctx.lineTo(sx*(w/2+3),topY-1); ctx.lineTo(sx*w/2,topY-3); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  for(let k=N-1;k>=0;k--){
    const z = (k+1)*rise, yF = y0 - k*run;
    ctx.fillStyle = 'rgb('+(150-k*6)+','+(104-k*4)+','+(62-k*3)+')'; ctx.fillRect(-w/2, yF-z-run, w, run);
    ctx.fillStyle = 'rgb('+(100-k*4)+','+(66-k*3)+','+(38-k*2)+')'; ctx.fillRect(-w/2, yF-z, w, rise);
    ctx.strokeRect(-w/2, yF-z-run, w, run+rise);
  }
  // handrail
  ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(w/2+3,y0-4); ctx.lineTo(w/2+3,y0-16); ctx.lineTo(w/2+3,topY-10); ctx.stroke();
  ctx.restore();
}
function drawStairsUpIso(pos, clock){
  const iso = toIso(pos.x, pos.y), t = clock||0;
  drawShadow(iso.x, iso.y+6, 34, 11);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1.3,1.3);
  const N = 6, rise = 6, run = 6, w = 44, y0 = 9;
  const topY = y0 - N*run - N*rise;
  // side walls (stone stringers following the flight)
  for(const sx of [-1,1]){
    const x0 = sx*(w/2), x1 = sx*(w/2+6);
    ctx.fillStyle = sx<0 ? '#4a4540' : '#3a3632'; ctx.strokeStyle = '#181512'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y0+3); ctx.lineTo(x1,topY-2); ctx.lineTo(x0,topY-5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = sx<0 ? '#6b655c' : '#575148';
    ctx.beginPath(); ctx.moveTo(x0,topY-5); ctx.lineTo(x1,topY-2); ctx.lineTo(x1-sx*2,topY-6); ctx.lineTo(x0-sx*2,topY-9); ctx.closePath(); ctx.fill();
  }
  // treads + risers, back (highest) first so the front steps overlap
  for(let k=N-1;k>=0;k--){
    const z = (k+1)*rise, yF = y0 - k*run;
    const tShade = 108 - k*4, rShade = 70 - k*3;
    ctx.fillStyle = 'rgb('+tShade+','+(tShade-5)+','+(tShade-12)+')';
    ctx.fillRect(-w/2, yF-z-run, w, run);
    ctx.fillStyle = 'rgb('+rShade+','+(rShade-4)+','+(rShade-10)+')';
    ctx.fillRect(-w/2, yF-z, w, rise);
    ctx.fillStyle = 'rgba(255,240,210,0.16)'; ctx.fillRect(-w/2, yF-z-run, w, 1.2);
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 0.9; ctx.strokeRect(-w/2, yF-z-run, w, run+rise);
  }
  // the flight disappears into a dark doorway at the top
  const dg = ctx.createLinearGradient(0,topY-14,0,topY+6); dg.addColorStop(0,'rgba(6,4,8,0.95)'); dg.addColorStop(1,'rgba(6,4,8,0)');
  ctx.fillStyle = dg; ctx.fillRect(-w/2, topY-14, w, 20);
  // wall torch beside the stairs
  const fl = 3+Math.sin(t*8);
  ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-w/2-8,-30,3,10);
  ctx.fillStyle = '#e2703a'; ctx.beginPath(); ctx.arc(-w/2-6.5,-33,fl,0,7); ctx.fill();
  ctx.fillStyle = 'rgba(226,112,58,0.25)'; ctx.beginPath(); ctx.arc(-w/2-6.5,-33,11,0,7); ctx.fill();
  ctx.restore();
}
function drawStairsDownIso(pr, clock){
  const iso = toIso(pr.x, pr.y);
  drawShadow(iso.x, iso.y+6, 32, 10);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1.3,1.3);
  const w = 46;
  // stone rim around the stairwell
  ctx.fillStyle = '#6b655c'; ctx.strokeStyle = '#181512'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.rect(-w/2-6,-34,w+12,42); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#857e73'; ctx.fillRect(-w/2-6,-34,w+12,3);
  // the opening
  ctx.fillStyle = '#050407'; ctx.fillRect(-w/2,-29,w,34);
  // treads sinking away: each is lower, narrower and darker
  const N = 6;
  for(let k=0;k<N;k++){
    const f = k/(N-1), ty = 2 - k*5, tw = w*(1-f*0.34), sh = Math.round(112 - f*88);
    ctx.fillStyle = 'rgb('+sh+','+(sh-4)+','+(sh-10)+')';
    ctx.fillRect(-tw/2, ty-4, tw, 4);
    ctx.fillStyle = 'rgba(0,0,0,'+(0.25+f*0.4)+')'; ctx.fillRect(-tw/2, ty-1, tw, 1.4);
  }
  // inner side walls fall into shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.moveTo(-w/2,-29); ctx.lineTo(-w/2+7,-19); ctx.lineTo(-w/2+7,-2); ctx.lineTo(-w/2,5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(w/2,-29); ctx.lineTo(w/2-7,-19); ctx.lineTo(w/2-7,-2); ctx.lineTo(w/2,5); ctx.closePath(); ctx.fill();
  // darkness swallows the far end
  const dg = ctx.createLinearGradient(0,4,0,-29); dg.addColorStop(0,'rgba(0,0,0,0)'); dg.addColorStop(1,'rgba(0,0,0,0.85)');
  ctx.fillStyle = dg; ctx.fillRect(-w/2,-29,w,34);
  ctx.restore();
}
// Town's standing portal back down to the Mine, at whatever depth the
// player has unlocked as a checkpoint -- a blue swirl (vs. the Mine's own
// purple descend portal) so it reads as a distinct, permanent shortcut
// rather than a level-clear reward.
function drawBluePortalIso(pr, clock){
  const iso = toIso(pr.x,pr.y);
  const pulse = 1+Math.sin(clock*4)*0.12;
  const rad = pr.r*pulse*ISO_KX;
  drawShadow(iso.x, iso.y, pr.r*0.9, 10);
  ctx.save(); ctx.translate(iso.x,iso.y); ctx.scale(1, ISO_KY/ISO_KX);
  const grad = ctx.createRadialGradient(0,0,2,0,0,rad);
  grad.addColorStop(0,'#dff2ff'); grad.addColorStop(0.5,'#5b9cff'); grad.addColorStop(1,'rgba(20,50,120,0)');
  ctx.fillStyle=grad;
  ctx.beginPath(); ctx.arc(0,0,rad,0,7); ctx.fill();
  // a couple of slow-spinning rings for a bit more life than a flat glow
  ctx.strokeStyle = 'rgba(220,240,255,0.55)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(0,0, rad*0.62, rad*0.62, clock*1.4, 0, 4.6); ctx.stroke();
  ctx.strokeStyle = 'rgba(160,200,255,0.4)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(0,0, rad*0.38, rad*0.38, -clock*1.9, 0, 4.2); ctx.stroke();
  ctx.restore();
}
// v490: which save flag belongs to the waypoint in the zone the player is standing in (null = Town's, always lit).
// Same flags the teleport menu discovers by (see WAYPOINT_FLAG_BY_FROM in ui/town-menus.js).
function currentWaypointFlag(){
  const g = game, s = g && g.scene, t = g && g.tower;
  if(!s || s==='town') return null;
  if(s==='mountainpass') return g.mtn && g.mtn.isCliff ? 'reachedCliffWp' : 'reachedMountainPass';
  if(s==='ancientruins') return g.ruins && g.ruins.fhd ? 'reachedFhdWp' : 'reachedAncientRuins';
  if(s==='lighthouse'){
    if(!t) return null;
    if(t.deep) return 'reachedDeepWp';
    if(t.subzone==='temple') return 'reachedAncientRuins';
    if(t.subzone==='highward') return 'reachedHighwardWp';
    if(t.subzone==='keep') return t.kpArea===8 ? 'reachedRingWp' : t.kpArea===7 ? 'reachedHoldWp' : 'reachedKeepWp';
    return t.ft ? 'reachedForgottenTower' : 'reachedLighthouseTower';
  }
  return {redridge:'reachedRedridge', highlands:'reachedHighlands', frosthold:'reachedFrostholdWp', icyzone:'reachedIcySummit', rivervalley:'reachedRiverValley',
    sunlitplains:'reachedSunlitPlains', lakesideruins:'reachedLakesideRuins', blackmarsh:'reachedBlackMarsh', cursedcemetery:'reachedCursedCemetery', darkcrypt:'reachedDarkCrypt'}[s] || null;
}
// v490: true once this zone's waypoint has been used (interacted with) -- it then draws lit instead of dim
function waypointLit(){ const f = currentWaypointFlag(); return !f || !!(game.player && game.player[f]); }
// Every waypoint sits on a small stone pedestal. v490: before it's been used it only gives off a dim,
// slow blue-grey shimmer; once the player interacts with it (discoverWaypoint) it lights up: bright swirl, halo, motes.
function drawWaypointIso(pr, clock, unlocked){
  const iso = toIso(pr.x, pr.y), t = clock||0;
  drawShadow(iso.x, iso.y, pr.r*1.15, 10);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle = '#3a3440';
  ctx.beginPath(); ctx.ellipse(0, 5, pr.r*1.15, pr.r*0.5, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = unlocked ? '#545a72' : '#4c4656';
  ctx.beginPath(); ctx.ellipse(0, 2, pr.r*0.85, pr.r*0.36, 0, 0, 7); ctx.fill();
  if(unlocked){   // v490: glowing rim on the pedestal
    ctx.strokeStyle = 'rgba(140,200,255,'+(0.55+0.2*Math.sin(t*3))+')'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(0, 2, pr.r*0.85, pr.r*0.36, 0, 0, 7); ctx.stroke();
  }
  ctx.restore();
  if(unlocked){
    // soft halo behind the swirl, the swirl itself, then a few motes rising off it
    ctx.save(); ctx.translate(iso.x, iso.y-4); ctx.scale(1, ISO_KY/ISO_KX);
    const hr = pr.r*ISO_KX*1.9, hg = ctx.createRadialGradient(0,0,2,0,0,hr);
    hg.addColorStop(0,'rgba(150,210,255,'+(0.38+0.08*Math.sin(t*2.4))+')'); hg.addColorStop(1,'rgba(60,120,255,0)');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0,0,hr,0,7); ctx.fill();
    ctx.restore();
    drawBluePortalIso(pr, t);
    ctx.save(); ctx.translate(iso.x, iso.y);
    for(let i=0;i<4;i++){ const ph = (t*0.6+i*0.25)%1, a = i*1.7+t*0.8;
      ctx.fillStyle = 'rgba(200,235,255,'+(0.8*(1-ph))+')';
      ctx.beginPath(); ctx.arc(Math.cos(a)*pr.r*0.7, Math.sin(a)*pr.r*0.25 - ph*34, 1.6, 0, 7); ctx.fill(); }
    ctx.restore();
  } else {
    // dim: a faint, slowly breathing blue-grey glow and one lazy ring, no swirl
    const br = 0.5+0.5*Math.sin(t*1.2);
    ctx.save(); ctx.translate(iso.x, iso.y-6); ctx.scale(1, ISO_KY/ISO_KX);
    const R0 = pr.r*ISO_KX*0.75, grad = ctx.createRadialGradient(0,0,1,0,0,R0);
    grad.addColorStop(0,'rgba(110,130,170,'+(0.45+0.15*br)+')'); grad.addColorStop(1,'rgba(40,44,60,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0,0,R0,0,7); ctx.fill();
    ctx.strokeStyle = 'rgba(120,150,200,'+(0.18+0.1*br)+')'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(0,0, R0*0.6, R0*0.6, t*0.4, 0, 4.2); ctx.stroke();
    ctx.restore();
  }
}
// The Mine entrance in Town: a stone staircase descending into a dark tunnel
// mouth, with a faint blue glow drifting up from below (echoing the old
// portal's color) instead of a flat swirling disc.
// v169: the Abandoned Mine's real entrance -- a timber-framed tunnel mouth cut into a rock face, with
// rails running out of the dark, hanging lanterns, rubble and a pickaxe.
// (named for its old mine look; since v532 it is a natural cave mouth, used for every cave entrance)
function drawMineEntranceIso(pos, clock){
  const iso = toIso(pos.x, pos.y), t = clock||0;
  drawShadow(iso.x, iso.y+6, 70, 14);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.lineJoin = 'round';
  // rock face
  const rg = ctx.createLinearGradient(0,-98,0,4); rg.addColorStop(0,'#6d6660'); rg.addColorStop(1,'#3a3531');
  ctx.fillStyle = rg; ctx.strokeStyle = '#1d1a18'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-74,6); ctx.lineTo(-68,-34); ctx.lineTo(-48,-70); ctx.lineTo(-22,-92); ctx.lineTo(8,-98); ctx.lineTo(38,-84); ctx.lineTo(62,-56); ctx.lineTo(72,-22); ctx.lineTo(76,6); ctx.closePath(); ctx.fill(); ctx.stroke();
  // lit facets
  ctx.fillStyle = 'rgba(200,190,175,0.16)';
  ctx.beginPath(); ctx.moveTo(-48,-70); ctx.lineTo(-22,-92); ctx.lineTo(8,-98); ctx.lineTo(-4,-60); ctx.lineTo(-40,-48); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.moveTo(38,-84); ctx.lineTo(62,-56); ctx.lineTo(76,6); ctx.lineTo(44,6); ctx.lineTo(36,-40); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(20,16,14,0.7)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-56,-20); ctx.lineTo(-44,-44); ctx.moveTo(48,-30); ctx.lineTo(56,-12); ctx.moveTo(-14,-86); ctx.lineTo(-6,-66); ctx.stroke();
  // v532: a natural cave mouth -- a ragged dark opening in the rock, no timbers, lamps or rails
  const tg = ctx.createRadialGradient(0,-22,4,0,-22,46); tg.addColorStop(0,'#000'); tg.addColorStop(0.7,'#07060a'); tg.addColorStop(1,'#16131a');
  ctx.fillStyle = tg;
  ctx.beginPath(); ctx.moveTo(-36,5); ctx.lineTo(-38,-14); ctx.quadraticCurveTo(-40,-36,-26,-50); ctx.lineTo(-14,-58); ctx.quadraticCurveTo(-2,-66,10,-60);
  ctx.lineTo(24,-52); ctx.quadraticCurveTo(38,-40,36,-18); ctx.lineTo(39,5); ctx.closePath(); ctx.fill();
  // rock lip round the opening, lit along the top edge
  ctx.strokeStyle = 'rgba(160,150,138,0.45)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-38,-14); ctx.quadraticCurveTo(-40,-36,-26,-50); ctx.lineTo(-14,-58); ctx.quadraticCurveTo(-2,-66,10,-60); ctx.lineTo(24,-52); ctx.quadraticCurveTo(38,-40,36,-18); ctx.stroke();
  // teeth of rock hanging over the mouth
  ctx.fillStyle = '#4a443f';
  for(const [sx,sw,sl] of [[-22,7,13],[-8,5,9],[6,8,15],[20,6,10]]){ ctx.beginPath(); ctx.moveTo(sx-sw,-54+Math.abs(sx)*0.12); ctx.lineTo(sx+sw,-54+Math.abs(sx)*0.12); ctx.lineTo(sx+1,-54+sl+Math.abs(sx)*0.12); ctx.closePath(); ctx.fill(); }
  // moss and roots trailing over the lip
  ctx.strokeStyle = 'rgba(70,96,52,0.8)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  for(const [mx,ml] of [[-30,16],[-16,10],[14,18],[28,12]]){ ctx.beginPath(); ctx.moveTo(mx,-50); ctx.quadraticCurveTo(mx+3,-50+ml*0.5,mx-1,-50+ml); ctx.stroke(); }
  ctx.fillStyle = 'rgba(70,96,52,0.6)'; ctx.beginPath(); ctx.ellipse(-44,-58,14,6,-0.5,0,7); ctx.fill(); ctx.beginPath(); ctx.ellipse(40,-50,12,5,0.6,0,7); ctx.fill();
  // a cold draught: a faint drift of mist at the threshold
  const mist = 0.10 + 0.05*Math.sin(t*1.6);
  ctx.fillStyle = 'rgba(190,200,210,'+mist+')'; ctx.beginPath(); ctx.ellipse(0,0,30,6,0,0,7); ctx.fill();
  // fallen rocks and scree spilling out of the cave
  ctx.fillStyle = '#58524b'; ctx.strokeStyle = '#1d1a18'; ctx.lineWidth = 1;
  for(const [rx,ry,rr] of [[-56,8,8],[-46,12,5],[52,10,9],[62,6,5],[-34,16,4],[28,14,5],[40,18,3],[-20,20,3]]){ ctx.beginPath(); ctx.ellipse(rx,ry,rr,rr*0.65,0,0,7); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
function drawBlacksmithIso(b, clock){
  const iso = toIso(b.x, b.y);
  const t = clock||0;

  // the forge -- a large stone-and-timber shop building standing behind the stall
  const fx=b.x-95, fy=b.y-175, fw=190, fh=130, fhz=72, froofH=50;
  drawBuildingIso({
    x:fx, y:fy, w:fw, h:fh, hz:fhz, roofH:froofH,
    wallTop:'#6a5646', wallRight:'#362a20', wallFront:'#48392a',
    roofRight:'#5a2c22', roofFront:'#78392a',
    chimney:true, door:true, window:true, style:'town', sign:'hammer', furnace:true, smoke:false, shutter:'#2c2622',
  });
  // chimney smoke -- a few soft rising puffs
  const chIso = toIso(fx+fw*0.74, fy+fh*0.24);
  const chTop = chIso.y-fhz-froofH*0.62-17;
  ctx.save();
  for(let i=0;i<3;i++){
    const phase = (t*0.35 + i*0.33) % 1;
    const py = chTop - phase*30;
    const alpha = 0.32*(1-phase);
    const r = 3.5+phase*5;
    ctx.fillStyle = 'rgba(200,196,190,'+alpha+')';
    ctx.beginPath(); ctx.arc(chIso.x + Math.sin(phase*6)*3, py, r, 0, 7); ctx.fill();
  }
  ctx.restore();

  drawShadow(iso.x, iso.y, 24, 11);
  // stall counter
  ctx.save(); ctx.translate(iso.x, iso.y);
  const counterGrad = ctx.createLinearGradient(-22,-14,22,10);
  counterGrad.addColorStop(0,'#6b4a2e'); counterGrad.addColorStop(1,'#3a2818');
  ctx.fillStyle = counterGrad;
  ctx.beginPath(); ctx.moveTo(-22,0); ctx.lineTo(0,-13); ctx.lineTo(22,0); ctx.lineTo(0,13); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#1c1310'; ctx.lineWidth=1.4; ctx.stroke();
  // anvil on the counter
  ctx.fillStyle='#2a2a30';
  ctx.beginPath(); ctx.ellipse(0,-6,8,4,0,0,7); ctx.fill();
  ctx.fillStyle='#4a4a54';
  ctx.beginPath(); ctx.ellipse(0,-8,5,2.6,0,0,7); ctx.fill();
  ctx.restore();

  // the blacksmith NPC -- standing beside the anvil, hammer in hand
  const bob = Math.sin(t*3)*1;
  ctx.save(); ctx.translate(iso.x-13, iso.y-1+bob);
  // legs
  ctx.fillStyle='#3a2e22';
  ctx.fillRect(-7,-3,5,15); ctx.fillRect(2,-3,5,15);
  // boots
  ctx.fillStyle='#241a12';
  roundRect(-8,10,7,6,2); ctx.fill(); roundRect(1,10,7,6,2); ctx.fill();
  // torso (heavyset, leather apron over a tunic)
  const torsoGrad = ctx.createLinearGradient(-10,-29,10,-3);
  torsoGrad.addColorStop(0,'#8a6a4a'); torsoGrad.addColorStop(1,'#4a3624');
  ctx.fillStyle = torsoGrad;
  roundRect(-10,-29,20,27,5); ctx.fill();
  ctx.strokeStyle='#2a1e14'; ctx.lineWidth=1.2; ctx.stroke();
  // apron
  ctx.fillStyle='#5a3a28';
  roundRect(-7,-17,14,19,2); ctx.fill();
  ctx.strokeStyle='#2a1c12'; ctx.lineWidth=1; ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(-7,-9); ctx.lineTo(7,-9); ctx.stroke(); // apron strap line
  // left arm, resting on the counter
  ctx.strokeStyle='#8a6a4a'; ctx.lineCap='round'; ctx.lineWidth=6;
  ctx.beginPath(); ctx.moveTo(-9,-21); ctx.lineTo(-16,-7); ctx.stroke();
  ctx.fillStyle='#c9a074'; ctx.beginPath(); ctx.arc(-16,-6,3.2,0,7); ctx.fill(); // hand
  // right arm swinging a hammer down onto the anvil
  const swing = Math.sin(t*2.6)*0.35;
  ctx.save();
  ctx.translate(9,-21);
  ctx.rotate(swing);
  ctx.strokeStyle='#8a6a4a'; ctx.lineWidth=6;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(9,11); ctx.stroke();
  ctx.translate(9,11);
  ctx.fillStyle='#3a3238'; ctx.fillRect(-2,0,4,11); // handle
  ctx.fillStyle='#5a5a62'; ctx.fillRect(-4,-4,15,7); // hammer head
  ctx.strokeStyle='#232228'; ctx.lineWidth=1; ctx.strokeRect(-4,-4,15,7);
  ctx.restore();
  // head
  ctx.fillStyle='#c9a074';
  ctx.beginPath(); ctx.arc(0,-34,7.5,0,7); ctx.fill();
  ctx.strokeStyle='#3a2a1c'; ctx.lineWidth=1; ctx.stroke();
  // hair (back/top of the head)
  ctx.fillStyle='#5a4a3a';
  ctx.beginPath(); ctx.arc(0,-37.5,7.6,3.5,6.05); ctx.fill();
  // beard
  ctx.fillStyle='#8a8078';
  ctx.beginPath(); ctx.arc(0,-29,5.6,0.15,2.99); ctx.fill();
  ctx.restore();
}
// v86: item 6 of the UI/UX overhaul -- the Old Man's "!" is now gated on
// whether he actually has anything quest-relevant to offer right now,
// instead of always drawing unconditionally. Shown when: the hunters quest
// hasn't been offered/accepted yet (nothing accepted -> he can still OFFER
// it), OR it's complete and the one-time reward hasn't been claimed yet
// (see talkToQuestGiver's q.rewarded gate). NOT shown while the quest is
// active-in-progress (talking to him then is just flavor progress text,
// "X/3 found so far" -- nothing NEW to offer) or once it's complete AND
// already rewarded (nothing left to say beyond a repeat thank-you line).
function questGiverHasIndicator(p){
  const q = getQuest(p, QUEST_FIND_HUNTERS.id);
  if(npcHasMark(p,'oldman')) return true;
  if(!q) return true; // quest not yet offered/accepted -- available to give
  if(q.status==='complete' && !q.rewarded) return true; // reward waiting to be claimed
  if(q.status!=='complete' && !q.omTalked) return true;   // v486: started by finding a hunter first -- he has something to tell you
  const bq = getQuest(p, QUEST_BRIDGE.id);   // v456: the bandit-bridge quest -- on offer, or its reward waiting
  if(bq && bq.status==='complete' && !bq.rewarded) return true;   // v486: the bridge reward can be claimed at any time
  if(q.status==='complete' && q.rewarded && !bq && !p.bridgeCleared) return true;
  return false;
}
// Same "!" rule as the Old Man above, applied to the Barkeeper: shown
// whenever Light the Way hasn't been offered/accepted yet. Unlike the
// hunters quest there's no separate reward to claim on top of completion
// (see talkToBarkeeper), so no rewarded-but-unclaimed case here.
function barkeeperHasIndicator(p){
  const q = getQuest(p, QUEST_LIGHT_THE_WAY.id);
  return !q || (q.status==='active' && q.stage==='return');
}
// The exterior sign's text: closed until Light the Way is complete, then
// reads simply "Tavern" -- the tavern door itself only opens once this
// flips too (see updateTown's nearTavernDoor gate).
function tavernIsOpen(p){
  const q = getQuest(p, QUEST_LIGHT_THE_WAY.id);
  return !!q && (q.status==='complete' || (q.status==='active' && q.stage==='return'));
}
function tavernSignLines(p){
  return tavernIsOpen(p) ? ['TAVERN'] : ['TAVERN,','CLOSED'];
}
// A second old-man NPC standing near the road, with a bobbing exclamation
// mark overhead marking him as someone you can talk to about quests --
// ONLY drawn when questGiverHasIndicator(p) says he currently does (v86).
function drawQuestNpcIso(npc, clock, showIndicator){
  const iso = toIso(npc.x, npc.y);
  const t = clock||0;
  const bob = Math.sin(t*2.4)*1;
  drawShadow(iso.x, iso.y, 13, 6);
  ctx.save(); ctx.translate(iso.x, iso.y+bob);
  // legs
  ctx.fillStyle='#4a4438';
  ctx.fillRect(-6,-2,5,14); ctx.fillRect(1,-2,5,14);
  ctx.fillStyle='#241e18'; roundRect(-7,10,7,5,2); ctx.fill(); roundRect(1,10,7,5,2); ctx.fill();
  // robe/torso -- a simple weathered tunic
  const torsoGrad = ctx.createLinearGradient(-9,-27,9,-2);
  torsoGrad.addColorStop(0,'#7a7060'); torsoGrad.addColorStop(1,'#463f34');
  ctx.fillStyle = torsoGrad;
  roundRect(-9,-27,18,25,5); ctx.fill();
  ctx.strokeStyle='#2a251c'; ctx.lineWidth=1.2; ctx.stroke();
  // a walking staff in one hand
  ctx.strokeStyle='#4a3420'; ctx.lineWidth=2.4; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(10,-24); ctx.lineTo(13,6); ctx.stroke();
  // head
  ctx.fillStyle='#c9a074';
  ctx.beginPath(); ctx.arc(0,-32,7,0,7); ctx.fill();
  ctx.strokeStyle='#3a2a1c'; ctx.lineWidth=1; ctx.stroke();
  // long white beard
  ctx.fillStyle='#d8d4c8';
  ctx.beginPath(); ctx.moveTo(-5,-30); ctx.quadraticCurveTo(0,-14,5,-30); ctx.quadraticCurveTo(0,-24,-5,-30); ctx.closePath(); ctx.fill();
  // bald head with a fringe of white hair
  ctx.fillStyle='#d8d4c8';
  ctx.beginPath(); ctx.arc(0,-35.5,7.1,2.9,6.5); ctx.fill();
  ctx.restore();

  // floating exclamation mark quest indicator, bobbing above his head --
  // v86: only drawn when showIndicator is true (see questGiverHasIndicator).
  if(showIndicator){
    const excY = iso.y-56+Math.sin(t*3)*3;
    ctx.save();
    ctx.font = "bold 20px Cinzel, Georgia, 'Times New Roman', serif";
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd93a';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3;
    ctx.strokeText('!', iso.x, excY);
    ctx.fillText('!', iso.x, excY);
    ctx.restore();
  }
}
// v198: the Barkeeper proper -- a stout, mustached publican in a white shirt with rolled sleeves, a dark vest,
// a long apron, a rag over one shoulder and a tankard in hand.
function drawBarkeeperIso(npc, clock, showIndicator){
  const iso = toIso(npc.x, npc.y), t = clock||0, bob = Math.sin(t*2.4)*1;
  drawShadow(iso.x, iso.y, 14, 6);
  ctx.save(); ctx.translate(iso.x, iso.y+bob);
  ctx.lineJoin = 'round';
  // legs + boots
  ctx.fillStyle='#2a2630'; ctx.fillRect(-6,-2,5,13); ctx.fillRect(1,-2,5,13);
  ctx.fillStyle='#17130f'; roundRect(-7,9,7,5,2); ctx.fill(); roundRect(1,9,7,5,2); ctx.fill();
  // white shirt body (stout)
  ctx.fillStyle='#d8d2c4'; roundRect(-11,-28,22,27,6); ctx.fill();
  ctx.strokeStyle='#2a251c'; ctx.lineWidth=1.2; ctx.stroke();
  // dark vest
  ctx.fillStyle='#4a2a26'; ctx.beginPath(); ctx.moveTo(-10,-27); ctx.lineTo(-3,-27); ctx.lineTo(0,-8); ctx.lineTo(-10,-8); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(10,-27); ctx.lineTo(3,-27); ctx.lineTo(0,-8); ctx.lineTo(10,-8); ctx.closePath(); ctx.fill();
  // long apron
  ctx.fillStyle='#e8e4d8'; roundRect(-8,-14,16,20,2); ctx.fill(); ctx.strokeStyle='#5a5448'; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle='rgba(120,100,70,0.35)'; ctx.fillRect(-5,-6,10,2);   // stains
  ctx.strokeStyle='#5a5448'; ctx.beginPath(); ctx.moveTo(-8,-13); ctx.lineTo(8,-13); ctx.stroke();
  // rag over the shoulder
  ctx.fillStyle='#b8b2a0'; ctx.beginPath(); ctx.moveTo(-10,-27); ctx.lineTo(-4,-28); ctx.lineTo(-8,-14); ctx.lineTo(-12,-15); ctx.closePath(); ctx.fill();
  // rolled-sleeve forearms; the right hand holds a tankard
  ctx.fillStyle='#c9a074'; ctx.fillRect(-14,-16,4,9); ctx.fillRect(10,-18,4,8);
  const mug = Math.sin(t*1.3)*1;
  ctx.fillStyle='#8a5a2a'; roundRect(12,-24+mug,8,10,1.5); ctx.fill(); ctx.strokeStyle='#2a1a0c'; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle='#f0e6c8'; ctx.fillRect(12,-25+mug,8,3);   // foam
  ctx.strokeStyle='#2a1a0c'; ctx.beginPath(); ctx.arc(21,-19+mug,2.6,-1.4,1.4); ctx.stroke();
  // head, ruddy cheeks
  ctx.fillStyle='#d2a57a'; ctx.beginPath(); ctx.arc(0,-34,7.5,0,7); ctx.fill(); ctx.strokeStyle='#3a2a1c'; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle='rgba(200,90,80,0.35)'; ctx.beginPath(); ctx.arc(-4.5,-32,2,0,7); ctx.arc(4.5,-32,2,0,7); ctx.fill();
  // thinning hair + big handlebar mustache
  ctx.fillStyle='#3a2a1e'; ctx.beginPath(); ctx.arc(0,-36,7.6,3.3,6.1); ctx.fill();
  ctx.fillStyle='#4a3424'; ctx.beginPath(); ctx.moveTo(0,-32); ctx.quadraticCurveTo(-5,-29,-9,-32); ctx.quadraticCurveTo(-5,-27,0,-30); ctx.quadraticCurveTo(5,-27,9,-32); ctx.quadraticCurveTo(5,-29,0,-32); ctx.fill();
  ctx.restore();
  if(showIndicator){
    const excY = iso.y-58+Math.sin(t*3)*3;
    ctx.save(); ctx.font = "bold 20px Cinzel, Georgia, 'Times New Roman', serif"; ctx.textAlign='center';
    ctx.fillStyle='#ffd93a'; ctx.strokeStyle='rgba(0,0,0,0.7)'; ctx.lineWidth=3;
    ctx.strokeText('!', iso.x, excY); ctx.fillText('!', iso.x, excY); ctx.restore();
  }
}
// A missing hunter, waiting to be found (Old Man's quest) -- a simple
// huddled figure with a bobbing "?" marker overhead, distinct from the
// Old Man's own "!" so the two read differently at a glance. Reused as-is
// for the two dungeon-bound hunters (beside the Spider Lair boss, and at
// the end of the Bear Cave); pass rescued=true for the version that
// stands by the Town bonfire once the quest is complete -- same rig,
// no "?" marker, a calm idle bob instead.
// v240: the tavern's Bard -- feathered cap, parti-coloured tunic, striped hose, strumming a lute, drifting music notes
function drawBardIso(b, clock){
  const iso = toIso(b.x, b.y), t = clock||0, bob = Math.sin(t*2.6)*1;
  drawShadow(iso.x, iso.y, 14, 6);
  ctx.save(); ctx.translate(iso.x, iso.y+bob); ctx.scale(1.12,1.12);
  ctx.fillStyle='#7a2a5a';   // short cape behind
  ctx.beginPath(); ctx.moveTo(-7,-30); ctx.lineTo(-11,-10+Math.sin(t*2)*0.8); ctx.lineTo(3,-12); ctx.lineTo(6,-30); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#d8a020'; roundRect(-6,-14,5,12,2); ctx.fill();   // striped hose
  ctx.fillStyle='#2a8a8a'; roundRect(1,-14,5,12,2); ctx.fill();
  ctx.fillStyle='#d8a020'; ctx.fillRect(-6,-9,5,2.4); ctx.fillStyle='#2a8a8a'; ctx.fillRect(1,-9,5,2.4);
  ctx.fillStyle='#3a1e10';   // pointed boots
  ctx.beginPath(); ctx.moveTo(-7,-5); ctx.lineTo(-0.5,-5); ctx.lineTo(-0.5,0); ctx.lineTo(-10,0); ctx.quadraticCurveTo(-9,-3,-7,-5); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0.5,-5); ctx.lineTo(7,-5); ctx.quadraticCurveTo(10,-2,11,0); ctx.lineTo(0.5,0); ctx.closePath(); ctx.fill();
  const tg = ctx.createLinearGradient(-7,-31,7,-12); tg.addColorStop(0,'#2a8a8a'); tg.addColorStop(0.5,'#2a8a8a'); tg.addColorStop(0.5,'#8a3a9a'); tg.addColorStop(1,'#8a3a9a');
  ctx.fillStyle=tg; roundRect(-7.5,-31,15,19,4); ctx.fill(); ctx.strokeStyle='#1c1026'; ctx.lineWidth=1.1; ctx.stroke();   // parti-coloured tunic
  ctx.fillStyle='#e8c44a'; ctx.fillRect(-7.5,-20,15,2.4);   // belt
  ctx.fillStyle='#e8c44a'; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.arc(-5+i*3.4,-12.4,1,0,7); ctx.fill(); }   // dagged hem dots
  // lute across the body
  ctx.save(); ctx.translate(2,-18); ctx.rotate(-0.55);
  ctx.strokeStyle='#5a3416'; ctx.lineWidth=2.4; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(6,0); ctx.lineTo(23,-1); ctx.stroke();   // neck
  ctx.fillStyle='#5a3416'; ctx.beginPath(); ctx.moveTo(22,-2.5); ctx.lineTo(27,-5); ctx.lineTo(26,-0.5); ctx.closePath(); ctx.fill();   // bent headstock
  const lg = ctx.createRadialGradient(-2,-2,1,0,0,11); lg.addColorStop(0,'#c98a4a'); lg.addColorStop(1,'#7a4420');
  ctx.fillStyle=lg; ctx.beginPath(); ctx.ellipse(0,0,10,7.2,0,0,7); ctx.fill(); ctx.strokeStyle='#3a2010'; ctx.lineWidth=1; ctx.stroke();   // round body
  ctx.fillStyle='#1c1008'; ctx.beginPath(); ctx.arc(1,0,2.6,0,7); ctx.fill();   // sound hole
  ctx.strokeStyle='rgba(240,230,200,0.8)'; ctx.lineWidth=0.5; for(const dy of [-1,0,1]){ ctx.beginPath(); ctx.moveTo(5,dy*0.8); ctx.lineTo(25,dy*0.5-1.5); ctx.stroke(); }
  ctx.restore();
  const strum = Math.sin(t*7)*2;   // strumming hand on the body, fretting hand on the neck
  ctx.fillStyle='#8a3a9a'; ctx.beginPath(); ctx.moveTo(6,-30); ctx.lineTo(7+strum*0.4,-19); ctx.lineTo(4+strum*0.4,-17); ctx.lineTo(3,-28); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#d9a87a'; ctx.beginPath(); ctx.arc(5.5+strum*0.5,-16+strum*0.4,1.9,0,7); ctx.fill();
  ctx.fillStyle='#2a8a8a'; ctx.beginPath(); ctx.moveTo(-6,-30); ctx.lineTo(3,-26); ctx.lineTo(13,-31); ctx.lineTo(12,-28.5); ctx.lineTo(3,-23.5); ctx.lineTo(-5,-27); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#d9a87a'; ctx.beginPath(); ctx.arc(12.6,-30,1.9,0,7); ctx.fill();
  ctx.fillStyle='#d9a87a'; ctx.beginPath(); ctx.arc(0,-36,5.4,0,7); ctx.fill();   // head
  ctx.fillStyle='#1a120c'; ctx.fillRect(-2.6,-37,1.5,1.5); ctx.fillRect(1.2,-37,1.5,1.5);
  ctx.strokeStyle='#9a4a2a'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.arc(0,-34.3,2.4,0.2,Math.PI-0.2); ctx.stroke();   // smile
  ctx.fillStyle='#3a1a4a'; ctx.beginPath(); ctx.moveTo(-6.4,-38); ctx.quadraticCurveTo(-5,-46,1,-45); ctx.quadraticCurveTo(6,-45,6.4,-38); ctx.quadraticCurveTo(0,-41.6,-6.4,-38); ctx.fill();   // cap
  ctx.fillStyle='#c83a3a'; ctx.beginPath(); ctx.moveTo(2,-44.5); ctx.quadraticCurveTo(10,-55,16,-46); ctx.quadraticCurveTo(10,-49,3.5,-42.5); ctx.closePath(); ctx.fill();   // long feather
  ctx.strokeStyle='#8a1a1a'; ctx.lineWidth=0.7; ctx.beginPath(); ctx.moveTo(2.5,-44); ctx.quadraticCurveTo(9,-51,15,-46.5); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.font = "bold 12px Cinzel, Georgia, serif"; ctx.textAlign='center'; ctx.fillStyle='#f0d078'; ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.lineWidth=2;
  for(let i=0;i<2;i++){   // floating notes
    const u = (t*0.45+i*0.5)%1, nx = iso.x+16+i*12+Math.sin(u*6+i)*4, ny = iso.y-46-u*30;
    ctx.globalAlpha = Math.sin(u*Math.PI); ctx.strokeText(i?'♫':'♪', nx, ny); ctx.fillText(i?'♫':'♪', nx, ny);
  }
  ctx.restore();
}
// v240: the tavern's Gambler -- black wide-brim hat, waistcoat and watch chain, fanned cards in one hand, a coin flipping over the other
function drawGamblerIso(gm, clock){
  const iso = toIso(gm.x, gm.y), t = clock||0, bob = Math.sin(t*2)*0.8;
  drawShadow(iso.x, iso.y, 14, 6);
  ctx.save(); ctx.translate(iso.x, iso.y+bob); ctx.scale(1.12,1.12);
  ctx.fillStyle='#1c1a22'; roundRect(-6,-14,5,12,2); ctx.fill(); roundRect(1,-14,5,12,2); ctx.fill();   // trousers
  ctx.fillStyle='#0c0a0c'; roundRect(-7,-4.5,6.5,4.5,2); ctx.fill(); roundRect(0.5,-4.5,6.5,4.5,2); ctx.fill();
  ctx.fillStyle='#1c1a22'; ctx.beginPath(); ctx.moveTo(-7.5,-14); ctx.lineTo(-9.5,-4); ctx.lineTo(-6,-14); ctx.closePath(); ctx.fill();   // coat-tail
  ctx.fillStyle='#e8e2d0'; roundRect(-7.5,-31,15,19,4); ctx.fill(); ctx.strokeStyle='#2a2418'; ctx.lineWidth=1; ctx.stroke();   // shirt
  ctx.fillStyle='#2c6a3c'; ctx.beginPath(); ctx.moveTo(-7.5,-30); ctx.lineTo(-2.5,-30); ctx.lineTo(0,-22); ctx.lineTo(2.5,-30); ctx.lineTo(7.5,-30); ctx.lineTo(7,-13); ctx.lineTo(-7,-13); ctx.closePath(); ctx.fill();   // green waistcoat
  ctx.strokeStyle='#0e2a16'; ctx.lineWidth=0.9; ctx.stroke();
  ctx.fillStyle='#d8b84a'; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(0,-21+i*3.2,0.9,0,7); ctx.fill(); }   // buttons
  ctx.strokeStyle='#d8b84a'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(-5,-19); ctx.quadraticCurveTo(-1,-15.5,3.5,-19); ctx.stroke();   // watch chain
  ctx.fillStyle='#b02a2a'; ctx.beginPath(); ctx.moveTo(0,-30); ctx.lineTo(-3.4,-32); ctx.lineTo(-3.4,-28.4); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(0,-30); ctx.lineTo(3.4,-32); ctx.lineTo(3.4,-28.4); ctx.closePath(); ctx.fill();   // bow tie
  ctx.fillStyle='#1c1a22';   // sleeves, sleeve garters
  ctx.beginPath(); ctx.moveTo(-7.5,-30); ctx.lineTo(-11,-19); ctx.lineTo(-8,-18); ctx.lineTo(-5,-28); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6,-30); ctx.lineTo(13,-26); ctx.lineTo(12,-23); ctx.lineTo(5,-27); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#b02a2a'; ctx.fillRect(-10.2,-23,3,1.6);
  ctx.fillStyle='#d9a87a'; ctx.beginPath(); ctx.arc(-9.6,-17.4,1.8,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(13,-24,1.9,0,7); ctx.fill();
  // fanned cards in the right hand
  ctx.save(); ctx.translate(14,-26);
  for(let i=0;i<4;i++){
    ctx.save(); ctx.rotate(-0.7+i*0.32); ctx.fillStyle='#f4f0e0'; ctx.strokeStyle='#3a3020'; ctx.lineWidth=0.6; roundRect(-2.6,-11,5.2,10,1); ctx.fill(); ctx.stroke();
    ctx.fillStyle = i%2 ? '#1c1a22' : '#b02a2a'; ctx.fillRect(-1.2,-9.2,2.4,2.4); ctx.restore();
  }
  ctx.restore();
  // coin flipping over the left hand
  const u = (t*0.9)%1, cy = -17-Math.sin(u*Math.PI)*15, cw = Math.abs(Math.cos(u*Math.PI*6))*2.6+0.4;
  ctx.fillStyle='#f0c83a'; ctx.strokeStyle='#8a6a10'; ctx.lineWidth=0.7; ctx.beginPath(); ctx.ellipse(-9.6, cy-3, cw, 2.6, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#d9a87a'; ctx.beginPath(); ctx.arc(0,-36,5.4,0,7); ctx.fill();   // head
  ctx.fillStyle='#1a120c'; ctx.fillRect(-2.8,-37,1.6,1.3); ctx.fillRect(1.2,-37,1.6,1.3);
  ctx.fillStyle='#2a1a10'; ctx.beginPath(); ctx.moveTo(-4.2,-33.2); ctx.quadraticCurveTo(0,-35.6,4.2,-33.2); ctx.quadraticCurveTo(0,-32,-4.2,-33.2); ctx.fill();   // moustache
  ctx.strokeStyle='#d8b84a'; ctx.lineWidth=1.1; ctx.beginPath(); ctx.moveTo(3.4,-31.8); ctx.lineTo(3.6,-31.4); ctx.stroke();   // gold tooth glint
  ctx.fillStyle='#14121a'; ctx.beginPath(); ctx.ellipse(0,-40,10.5,2.6,0,0,7); ctx.fill();   // wide brim
  ctx.beginPath(); ctx.moveTo(-5.6,-40); ctx.lineTo(-5,-48); ctx.quadraticCurveTo(0,-50,5,-48); ctx.lineTo(5.6,-40); ctx.closePath(); ctx.fill();   // crown
  ctx.fillStyle='#b02a2a'; ctx.fillRect(-5.6,-43,11.2,2.4);   // hat band
  ctx.restore();
}
function drawHunterIso(h, clock, rescued, plain){
  const iso = toIso(h.x, h.y);
  const t = clock||0;
  const bob = Math.sin(t*2.2)*1;
  drawShadow(iso.x, iso.y, plain ? 12 : 14, 6);
  ctx.save(); ctx.translate(iso.x, iso.y+bob);
  if(plain){   // the tavern's bard / gambler keep the simple villager look
    ctx.fillStyle = '#5a4028';
    roundRect(-8,-22,16,20,4); ctx.fill();
    ctx.strokeStyle='#241a10'; ctx.lineWidth=1.2; ctx.stroke();
    ctx.fillStyle='#c9a074';
    ctx.beginPath(); ctx.arc(0,-26,6,0,7); ctx.fill();
  } else {
    // v239: an actual woodsman -- hooded forest-green cloak, leather jerkin, belt + pouch, quiver on the back, longbow in hand
    ctx.scale(1.12, 1.12);
    ctx.save(); ctx.translate(-6,-26); ctx.rotate(-0.35);   // quiver + arrow feathers
    ctx.fillStyle='#4a2e16'; roundRect(-3,-2,6,17,2); ctx.fill();
    ctx.fillStyle='#d8d0b0'; for(const dx of [-1.8,0,1.8]) ctx.fillRect(dx-0.5,-7,1,6);
    ctx.fillStyle='#a8452e'; for(const dx of [-1.8,0,1.8]) ctx.fillRect(dx-0.5,-8,1,2);
    ctx.restore();
    ctx.fillStyle='#2e4a2a';   // cloak hanging behind
    ctx.beginPath(); ctx.moveTo(-8,-30); ctx.lineTo(-11.5,-5+Math.sin(t*2)*0.8); ctx.lineTo(8,-4); ctx.lineTo(7.5,-30); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#1a2a18'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle='#4a3c26'; roundRect(-6,-14,5,12,2); ctx.fill(); roundRect(1,-14,5,12,2); ctx.fill();   // legs
    ctx.fillStyle='#2a1c10'; roundRect(-7,-5,6.5,5,2); ctx.fill(); roundRect(0.5,-5,6.5,5,2); ctx.fill();   // boots
    ctx.fillStyle='#6a5030'; roundRect(-7.5,-31,15,19,4); ctx.fill(); ctx.strokeStyle='#2a1c10'; ctx.lineWidth=1.1; ctx.stroke();   // leather jerkin
    ctx.strokeStyle='#3a2a16'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(0,-29); ctx.lineTo(0,-20); ctx.stroke();
    for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-1.6,-28+i*3); ctx.lineTo(1.6,-26.6+i*3); ctx.stroke(); }
    ctx.fillStyle='#2a1c10'; ctx.fillRect(-7.5,-19,15,3);   // belt, buckle and pouch
    ctx.fillStyle='#c9a25a'; ctx.fillRect(-1.6,-19,3.2,3);
    ctx.fillStyle='#5a3c20'; roundRect(3.5,-18,5,6,1.5); ctx.fill();
    ctx.fillStyle='#3e5e34';   // far arm (tunic sleeve) resting at the side
    ctx.beginPath(); ctx.moveTo(-7.5,-30); ctx.lineTo(-11,-18); ctx.lineTo(-8,-17); ctx.lineTo(-5,-28); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#c9a074'; ctx.beginPath(); ctx.arc(-9.6,-16.5,1.8,0,7); ctx.fill();
    ctx.fillStyle='#3e5e34';   // near arm reaching forward to the bow grip
    ctx.beginPath(); ctx.moveTo(6,-30); ctx.lineTo(13,-24); ctx.lineTo(12,-21.5); ctx.lineTo(5,-26); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#6a4220'; ctx.lineWidth=2.2; ctx.lineCap='round';   // longbow
    ctx.beginPath(); ctx.arc(9,-23,17,-1.0,1.0); ctx.stroke();
    ctx.strokeStyle='#e8e0c8'; ctx.lineWidth=0.7;
    ctx.beginPath(); ctx.moveTo(9+Math.cos(-1.0)*17, -23+Math.sin(-1.0)*17); ctx.lineTo(9+Math.cos(1.0)*17, -23+Math.sin(1.0)*17); ctx.stroke();
    ctx.fillStyle='#c9a074'; ctx.beginPath(); ctx.arc(12.6,-22.6,1.9,0,7); ctx.fill();
    ctx.fillStyle='#3a6a30';   // shoulder mantle
    ctx.beginPath(); ctx.ellipse(0,-31,9.5,3.6,0,0,7); ctx.fill(); ctx.strokeStyle='#1a2a18'; ctx.lineWidth=0.9; ctx.stroke();
    ctx.fillStyle='#c9a074'; ctx.beginPath(); ctx.arc(0,-36,5.2,0,7); ctx.fill();   // face
    ctx.fillStyle='#4a3020'; ctx.beginPath(); ctx.arc(0,-34.6,5.2,0.15,Math.PI-0.15); ctx.fill();   // beard
    ctx.fillStyle='#c9a074'; ctx.beginPath(); ctx.arc(0,-36.6,3.6,0,Math.PI); ctx.fill();
    ctx.fillStyle='#1a120c'; ctx.fillRect(-2.6,-37.4,1.5,1.5); ctx.fillRect(1.1,-37.4,1.5,1.5);
    ctx.fillStyle='#355a2c';   // hood
    ctx.beginPath(); ctx.moveTo(-7.4,-32.5); ctx.quadraticCurveTo(-9,-48,0,-48.5); ctx.quadraticCurveTo(9,-48,7.4,-32.5); ctx.lineTo(4.6,-35); ctx.quadraticCurveTo(0,-41.5,-4.6,-35); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#1a2a18'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle='#b0462e'; ctx.beginPath(); ctx.moveTo(3,-46.5); ctx.quadraticCurveTo(9,-52,11,-44); ctx.quadraticCurveTo(7,-47,3,-44.5); ctx.closePath(); ctx.fill();   // hat feather
  }
  ctx.restore();
  if(!rescued){
    const qY = iso.y-46+Math.sin(t*3)*3;
    ctx.save();
    ctx.font = "bold 18px Cinzel, Georgia, 'Times New Roman', serif";
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7ad0ff';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3;
    ctx.strokeText('?', iso.x, qY);
    ctx.fillText('?', iso.x, qY);
    ctx.restore();
  }
}
// A simple round stone well, roofed like a small wishing-well -- the old
// man's neighbor in Town. Interacting with it opens the character/gear
// panel (a "look at your reflection" flavor beat).
function drawWellIso(w, clock){
  const iso = toIso(w.x, w.y);
  const t = clock||0;
  drawShadow(iso.x, iso.y+4, w.r*1.3, 11);
  ctx.save(); ctx.translate(iso.x, iso.y);
  // stone ring
  const ringGrad = ctx.createLinearGradient(-20,-10,20,10);
  ringGrad.addColorStop(0,'#6a707c'); ringGrad.addColorStop(1,'#30343e');
  ctx.fillStyle = ringGrad;
  ctx.beginPath(); ctx.ellipse(0,0,20,11,0,0,7); ctx.fill();
  ctx.strokeStyle='#26221c'; ctx.lineWidth=1.4; ctx.stroke();
  // dark water inside, with a faint pulsing "reflection" glimmer
  const pulse = 0.5+Math.sin(t*1.6)*0.15;
  ctx.fillStyle='#0c1218';
  ctx.beginPath(); ctx.ellipse(0,-1,14,7.5,0,0,7); ctx.fill();
  ctx.fillStyle='rgba(150,190,255,'+(0.18+pulse*0.14)+')';
  ctx.beginPath(); ctx.ellipse(0,-1,8,4,0,0,7); ctx.fill();
  // two support posts + peaked little roof
  ctx.strokeStyle='#2c2a30'; ctx.lineWidth=3.4; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-15,-4); ctx.lineTo(-15,-34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(15,-4); ctx.lineTo(15,-34); ctx.stroke();
  ctx.fillStyle='#262c3a';
  ctx.beginPath(); ctx.moveTo(-19,-34); ctx.lineTo(0,-46); ctx.lineTo(19,-34); ctx.lineTo(13,-32); ctx.lineTo(0,-40); ctx.lineTo(-13,-32); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#241a10'; ctx.lineWidth=1; ctx.stroke();
  // a little bucket hanging from a crossbeam
  ctx.strokeStyle='#241a10'; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.moveTo(0,-30); ctx.lineTo(0,-14); ctx.stroke();
  ctx.fillStyle='#6b5a3e';
  ctx.beginPath(); ctx.moveTo(-4,-14); ctx.lineTo(4,-14); ctx.lineTo(3,-8); ctx.lineTo(-3,-8); ctx.closePath(); ctx.fill();
  ctx.restore();
}
// A simple A-frame canvas travelers' tent near Town's edge.
function drawTentIso(tent){
  const iso = toIso(tent.x, tent.y);
  drawShadow(iso.x, iso.y+6, 34, 13);
  ctx.save(); ctx.translate(iso.x, iso.y);
  // right (shaded) canvas face
  const rGrad = ctx.createLinearGradient(0,-40,26,6);
  rGrad.addColorStop(0,'#3e4644'); rGrad.addColorStop(1,'#1c2222');
  ctx.fillStyle = rGrad;
  ctx.beginPath(); ctx.moveTo(0,-40); ctx.lineTo(28,4); ctx.lineTo(6,10); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#20150c'; ctx.lineWidth=1.2; ctx.stroke();
  // left (lit) canvas face
  const lGrad = ctx.createLinearGradient(0,-40,-26,6);
  lGrad.addColorStop(0,'#5a6662'); lGrad.addColorStop(1,'#2c3634');
  ctx.fillStyle = lGrad;
  ctx.beginPath(); ctx.moveTo(0,-40); ctx.lineTo(-28,4); ctx.lineTo(-6,10); ctx.closePath(); ctx.fill();
  ctx.stroke();
  // entrance flap triangle (darker, at front)
  ctx.fillStyle='#1a120b';
  ctx.beginPath(); ctx.moveTo(0,-26); ctx.lineTo(6,10); ctx.lineTo(-6,10); ctx.closePath(); ctx.fill();
  // ridge pole poking out at the peak
  ctx.strokeStyle='#3a2a18'; ctx.lineWidth=2; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(0,-40); ctx.lineTo(0,-46); ctx.stroke();
  ctx.restore();
}
// A small ring-of-stones bonfire pit with a simple animated flame, using
// the same flicker technique as the dungeon stairway torches.
function drawBonfireIso(b, clock){
  const iso = toIso(b.x, b.y);
  const t = clock||0;
  drawShadow(iso.x, iso.y+3, b.r*1.4, 8);
  ctx.save(); ctx.translate(iso.x, iso.y);
  // ring of stones
  ctx.fillStyle='#5a564e';
  for(let i=0;i<8;i++){
    const ang = i/8*Math.PI*2;
    const sx = Math.cos(ang)*16, sy = Math.sin(ang)*7;
    ctx.beginPath(); ctx.ellipse(sx,sy,4,3,0,0,7); ctx.fill();
  }
  ctx.strokeStyle='#221e18'; ctx.lineWidth=1; ctx.stroke();
  // embers/logs
  ctx.fillStyle='#2a1c10';
  ctx.beginPath(); ctx.ellipse(0,1,9,4,0.3,0,7); ctx.fill();
  // flickering flame
  const flick = 5+Math.sin(t*9)*1.4+Math.sin(t*17)*0.6;
  const fGrad = ctx.createRadialGradient(0,-3,0.5,0,-3,flick*2.1);
  fGrad.addColorStop(0,'#ffe9a8'); fGrad.addColorStop(0.45,'#f0a03a'); fGrad.addColorStop(1,'rgba(200,60,20,0)');
  ctx.fillStyle = fGrad;
  ctx.beginPath(); ctx.arc(0,-3,flick*2.1,0,7); ctx.fill();
  ctx.fillStyle='#ffd23a';
  ctx.beginPath(); ctx.ellipse(0,-2-flick*0.4,flick*0.55,flick,0,0,7); ctx.fill();
  ctx.restore();
}
// style 'stone' (default) is the torch-lit dungeon-style archway used for the
// Mine entrance; style 'wood' is a plain timber gate used for Town <-> Forest.
// Zone transitions sit at the map's own edge now (a gap in the fence or
// treeline), so all that's drawn there is a floating name, not a gate prop.
// v392: the Mistfall cat -- sits on a little cushion and turns to face the player; she vanishes once she is your companion
function townCatVisible(){ return !(settings.catOwned && settings.catCompanion); }
function drawTownCatIso(c, t, pl){
  const iso = toIso(c.x,c.y), pi = toIso(pl.x,pl.y), face = pi.x < iso.x ? -1 : 1, s = 1.02;
  drawShadow(iso.x, iso.y, 16*s, 6*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  const fl='#e8a458', fd='#c07830', sh='#3a2414', sw = Math.sin(t*1.7), blink = ((t+1.3)%4.4) > 4.2, twitch = ((t%7) > 6.8) ? 2 : 0;
  ctx.fillStyle='#7a3040'; ctx.strokeStyle='#3a1520'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(0,1,12,4.6,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#9a4a5a'; ctx.beginPath(); ctx.ellipse(0,-0.5,10,3.4,0,0,7); ctx.fill();
  ctx.strokeStyle=fd; ctx.lineWidth=2.8; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-6,-2); ctx.quadraticCurveTo(-14,1+sw*0.6,-8,4); ctx.quadraticCurveTo(0,6,7,3+sw*1.2); ctx.stroke();
  const bg = ctx.createLinearGradient(-7,-17,7,0); bg.addColorStop(0,fl); bg.addColorStop(1,fd);
  ctx.fillStyle=bg; ctx.strokeStyle=sh; ctx.lineWidth=0.9;
  ctx.beginPath(); ctx.moveTo(-6.5,-1); ctx.quadraticCurveTo(-9,-11,-2,-16); ctx.lineTo(3.5,-16); ctx.quadraticCurveTo(7,-9,6,-1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#f4dcb0'; ctx.beginPath(); ctx.ellipse(3.2,-8,2.4,5.2,0.1,0,7); ctx.fill();
  ctx.fillStyle=fl; ctx.beginPath(); ctx.ellipse(4,-1.6,2.2,3,0,0,7); ctx.fill(); ctx.stroke();
  const hx=1.5, hy=-21;
  ctx.fillStyle=fl; ctx.beginPath(); ctx.ellipse(hx,hy,5.8,5,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle=fd; ctx.beginPath(); ctx.moveTo(hx-4.6,hy-2); ctx.lineTo(hx-4,hy-8.5-twitch*0.4); ctx.lineTo(hx-0.8,hy-3.6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx+1.2,hy-3.6); ctx.lineTo(hx+4.4,hy-8.2); ctx.lineTo(hx+5.4,hy-2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle=sh; ctx.fillStyle=sh; ctx.lineWidth=1;
  if(blink){ ctx.beginPath(); ctx.moveTo(hx+0.4,hy-0.4); ctx.lineTo(hx+2.4,hy-0.4); ctx.moveTo(hx+3.6,hy-0.4); ctx.lineTo(hx+5.2,hy-0.4); ctx.stroke(); }
  else { ctx.beginPath(); ctx.ellipse(hx+1.5,hy-0.6,1,1.4,0,0,7); ctx.ellipse(hx+4.4,hy-0.6,1,1.4,0,0,7); ctx.fill(); }
  ctx.fillStyle='#e88a8a'; ctx.beginPath(); ctx.arc(hx+3.2,hy+1.8,0.9,0,7); ctx.fill();
  ctx.strokeStyle='rgba(60,36,20,0.7)'; ctx.lineWidth=0.6; ctx.beginPath(); ctx.moveTo(hx+5,hy+1.4); ctx.lineTo(hx+9,hy+0.4); ctx.moveTo(hx+5,hy+2.4); ctx.lineTo(hx+9,hy+3); ctx.stroke();
  ctx.restore();
}
function drawEdgeLabelIso(pos, label, dy){
  const iso = toIso(pos.x, pos.y);
  ctx.save();
  ctx.font = "bold 13px Cinzel, Georgia, 'Times New Roman', serif";
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8c44a';
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
  ctx.fillText(label, iso.x, iso.y-(dy||30)-(_gate2xSeen.has(pos) ? 52 : 0));
  ctx.restore();
}

