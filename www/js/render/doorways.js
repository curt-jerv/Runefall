// ---- (v162) notable zone doorways: ice cave mouth, keep gatehouse, cursed tower door, ice crag walls ----
function drawIceCaveIso(pos, clock){
  const iso = toIso(pos.x, pos.y), t = clock||0;
  drawShadow(iso.x, iso.y+6, 84, 24);
  ctx.save(); ctx.translate(iso.x, iso.y+4);
  // rock mass
  const rg = ctx.createLinearGradient(0,-120,0,6); rg.addColorStop(0,'#aebdca'); rg.addColorStop(0.5,'#6f7f8e'); rg.addColorStop(1,'#39444f');
  ctx.fillStyle = rg; ctx.strokeStyle='#232b33'; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.moveTo(-86,4); ctx.lineTo(-78,-42); ctx.lineTo(-56,-74); ctx.lineTo(-38,-70); ctx.lineTo(-22,-112); ctx.lineTo(4,-96); ctx.lineTo(26,-118); ctx.lineTo(48,-84); ctx.lineTo(70,-70); ctx.lineTo(84,-30); ctx.lineTo(88,4); ctx.closePath(); ctx.fill(); ctx.stroke();
  // snow cap
  ctx.fillStyle='#f2f8fc';
  ctx.beginPath(); ctx.moveTo(-56,-74); ctx.lineTo(-38,-70); ctx.lineTo(-22,-112); ctx.lineTo(4,-96); ctx.lineTo(26,-118); ctx.lineTo(48,-84); ctx.lineTo(30,-78); ctx.lineTo(8,-88); ctx.lineTo(-14,-84); ctx.lineTo(-30,-62); ctx.closePath(); ctx.fill();
  // dark mouth
  const mg = ctx.createRadialGradient(0,-26,4,0,-26,40); mg.addColorStop(0,'#02040a'); mg.addColorStop(0.7,'#0a121c'); mg.addColorStop(1,'#1c2836');
  ctx.fillStyle = mg;
  ctx.beginPath(); ctx.moveTo(-30,4); ctx.lineTo(-32,-30); ctx.quadraticCurveTo(-26,-64,0,-66); ctx.quadraticCurveTo(26,-64,32,-30); ctx.lineTo(30,4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#141c25'; ctx.lineWidth=2; ctx.stroke();
  // cold glow deep inside
  const p = 0.55+0.25*Math.sin(t*2.2);
  const gl = ctx.createRadialGradient(0,-24,1,0,-24,26); gl.addColorStop(0,'rgba(150,215,255,'+(0.5*p)+')'); gl.addColorStop(1,'rgba(150,215,255,0)');
  ctx.fillStyle=gl; ctx.beginPath(); ctx.ellipse(0,-24,24,32,0,0,7); ctx.fill();
  // icicles
  ctx.fillStyle='#dff2ff';
  for(let i=-3;i<=3;i++){ const x=i*8, top=-64+Math.abs(i)*7, len=10+((i*7)&7); ctx.beginPath(); ctx.moveTo(x-3,top); ctx.lineTo(x+3,top); ctx.lineTo(x,top+len); ctx.closePath(); ctx.fill(); }
  // ice crystals flanking
  for(const sx of [-58,58]){ ctx.fillStyle='rgba(170,225,255,0.85)'; ctx.strokeStyle='#5f8fb0'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(sx-6,2); ctx.lineTo(sx-3,-26); ctx.lineTo(sx+2,2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx+2,2); ctx.lineTo(sx+8,-38); ctx.lineTo(sx+13,2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
function drawKeepGateIso(pos, clock){
  const iso = toIso(pos.x, pos.y), t = clock||0;
  drawShadow(iso.x, iso.y+6, 92, 26);
  ctx.save(); ctx.translate(iso.x, iso.y+4);
  const stone = ctx.createLinearGradient(0,-130,0,4); stone.addColorStop(0,'#7c8794'); stone.addColorStop(1,'#3c444e');
  // connecting wall + arch
  ctx.fillStyle = stone; ctx.strokeStyle='#1f252c'; ctx.lineWidth=1.5;
  ctx.fillRect(-50,-70,100,74); ctx.strokeRect(-50,-70,100,74);
  // towers
  for(const sx of [-64,64]){
    ctx.fillStyle = stone; ctx.fillRect(sx-22,-124,44,128); ctx.strokeRect(sx-22,-124,44,128);
    ctx.fillStyle='#4a5560'; for(let i=0;i<4;i++){ ctx.fillRect(sx-22+i*12,-134,8,10); ctx.strokeRect(sx-22+i*12,-134,8,10); }
    ctx.fillStyle='#0b0f14'; ctx.fillRect(sx-4,-98,8,20); // arrow slit
    ctx.fillStyle='#f2f8fc'; ctx.fillRect(sx-22,-126,44,4); // snow
  }
  // arch opening + portcullis
  ctx.fillStyle='#06090e';
  ctx.beginPath(); ctx.moveTo(-26,4); ctx.lineTo(-26,-42); ctx.quadraticCurveTo(0,-84,26,-42); ctx.lineTo(26,4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#1c232b'; ctx.lineWidth=2; ctx.stroke();
  ctx.strokeStyle='#3a434d'; ctx.lineWidth=2.5;
  for(let x=-18;x<=18;x+=9){ ctx.beginPath(); ctx.moveTo(x,-60+Math.abs(x)*0.5); ctx.lineTo(x,-22); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-24,-38); ctx.lineTo(24,-38); ctx.stroke();
  // torches + banner
  for(const sx of [-30,30]){ const fl=4+Math.sin(t*9+sx)*1.2;
    ctx.fillStyle='#e2703a'; ctx.beginPath(); ctx.arc(sx,-62,fl,0,7); ctx.fill();
    ctx.fillStyle='rgba(226,112,58,0.3)'; ctx.beginPath(); ctx.arc(sx,-62,11,0,7); ctx.fill(); }
  ctx.fillStyle='#7a1f2a'; ctx.beginPath(); ctx.moveTo(-9,-118); ctx.lineTo(9,-118); ctx.lineTo(9,-88); ctx.lineTo(0,-96); ctx.lineTo(-9,-88); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawTowerDoorIso(pos, clock){
  const iso = toIso(pos.x, pos.y), t = clock||0;
  drawShadow(iso.x, iso.y+6, 80, 25);
  ctx.save(); ctx.translate(iso.x, iso.y+4); ctx.scale(1.25, 1.25);   // v456: 25% bigger
  const stone = ctx.createLinearGradient(-40,0,40,0); stone.addColorStop(0,'#3d4a44'); stone.addColorStop(0.5,'#55645c'); stone.addColorStop(1,'#2a342f');
  ctx.fillStyle=stone; ctx.strokeStyle='#141a17'; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.moveTo(-42,4); ctx.lineTo(-38,-150); ctx.lineTo(-30,-158); ctx.lineTo(-14,-150); ctx.lineTo(0,-166); ctx.lineTo(16,-150); ctx.lineTo(32,-158); ctx.lineTo(40,-148); ctx.lineTo(44,4); ctx.closePath(); ctx.fill(); ctx.stroke();
  // brick lines
  ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=1;
  for(let y=-140;y<0;y+=16){ ctx.beginPath(); ctx.moveTo(-40,y); ctx.lineTo(42,y); ctx.stroke(); }
  // huge doorway
  ctx.fillStyle='#04070a'; ctx.beginPath(); ctx.moveTo(-18,4); ctx.lineTo(-18,-46); ctx.quadraticCurveTo(0,-76,18,-46); ctx.lineTo(18,4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#0e1310'; ctx.lineWidth=2.5; ctx.stroke();
  const p = 0.6+0.3*Math.sin(t*2.6);
  const gl = ctx.createRadialGradient(0,-26,1,0,-26,22); gl.addColorStop(0,'rgba(120,255,150,'+(0.45*p)+')'); gl.addColorStop(1,'rgba(120,255,150,0)');
  ctx.fillStyle=gl; ctx.beginPath(); ctx.ellipse(0,-26,20,30,0,0,7); ctx.fill();
  // glowing windows
  ctx.fillStyle='rgba(140,255,170,'+(0.55+0.3*Math.sin(t*3))+')';
  for(const [x,y] of [[-8,-96],[10,-118],[-6,-138]]){ ctx.fillRect(x-3,y-6,6,12); }
  // moss + vines
  ctx.strokeStyle='#3c6a3a'; ctx.lineWidth=2;
  for(const x of [-34,-22,26,36]){ ctx.beginPath(); ctx.moveTo(x,-120); ctx.quadraticCurveTo(x+4,-70,x-2,-20); ctx.stroke(); }
  ctx.restore();
}
function drawIceCragIso(c){
  const iso = toIso(c.x, c.y), s = c.s||1, h = (c.h||70)*s;
  drawShadow(iso.x, iso.y+2, 22*s, 8*s);
  ctx.save(); ctx.translate(iso.x, iso.y+2);
  const w = 20*s;
  ctx.fillStyle='#5d6c7b'; ctx.strokeStyle='#26303a'; ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.moveTo(-w,0); ctx.lineTo(-w*0.7,-h*0.55); ctx.lineTo(-w*0.2,-h); ctx.lineTo(w*0.35,-h*0.62); ctx.lineTo(w,0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#8fa3b5'; ctx.beginPath(); ctx.moveTo(-w*0.2,-h); ctx.lineTo(w*0.35,-h*0.62); ctx.lineTo(w,0); ctx.lineTo(w*0.1,0); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#f2f8fc'; ctx.beginPath(); ctx.moveTo(-w*0.7,-h*0.55); ctx.lineTo(-w*0.2,-h); ctx.lineTo(w*0.35,-h*0.62); ctx.lineTo(-w*0.1,-h*0.66); ctx.closePath(); ctx.fill();
  ctx.restore();
}
// Fades a tall sprite while the player stands behind it, so the character is never hidden by gate/tower art
function fadeWhenBehind(gp, halfW, height, fn){
  const p = game && game.player;
  ctx.save();
  if(p){
    const pi = toIso(p.x,p.y), gi = toIso(gp.x,gp.y);
    const behind = (p.x+p.y) < (gp.x+gp.y) + 10 && !(Math.abs(p.x-gp.x)<150 && p.x < gp.x);   // standing in front of the door is fine
    if(behind && Math.abs(pi.x-gi.x) < halfW && pi.y < gi.y+6 && pi.y > gi.y-height-30) ctx.globalAlpha = 0.28;
  }
  fn(); ctx.restore();
}
// Frosthold Tower: a tall stone tower that clearly goes up, with balconies, a lit belfry and a frost-crystal crown
function drawFrostholdTowerIso(gt, clock, part){
  const iso = toIso(gt.x, gt.y), t = clock||0;
  if(part!=='upper') drawShadow(iso.x, iso.y+8, 96, 28);
  ctx.save(); ctx.translate(iso.x, iso.y+4);
  // v365: the door/base always sits behind the player; the upper tower draws in front when the player is behind it
  if(part==='lower'){ ctx.beginPath(); ctx.rect(-400,-190,800,400); ctx.clip(); }
  else if(part==='upper'){ ctx.beginPath(); ctx.rect(-400,-1000,800,810); ctx.clip(); }
  const ol = '#12171d';
  const shaft = (x0,x1,y0,y1,c0,c1)=>{ const g2 = ctx.createLinearGradient(x0,0,x1,0); g2.addColorStop(0,c0); g2.addColorStop(0.55,c1); g2.addColorStop(1,'#2c333c'); ctx.fillStyle=g2; ctx.fillRect(x0,y0,x1-x0,y1-y0); ctx.strokeStyle=ol; ctx.lineWidth=1.6; ctx.strokeRect(x0,y0,x1-x0,y1-y0); };
  const courses = (x0,x1,y0,y1,step)=>{ ctx.strokeStyle='rgba(8,12,16,0.3)'; ctx.lineWidth=1; for(let y=y0+step;y<y1;y+=step){ ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x1,y); ctx.stroke(); } };
  const snowCap = (x0,x1,y)=>{ ctx.fillStyle='#f4f9fd'; ctx.fillRect(x0-2,y-3,x1-x0+4,6); };
  const slit = (x,y,glow)=>{ ctx.fillStyle='#070a0e'; ctx.beginPath(); ctx.moveTo(x-4,y+16); ctx.lineTo(x-4,y+4); ctx.quadraticCurveTo(x,y-5,x+4,y+4); ctx.lineTo(x+4,y+16); ctx.closePath(); ctx.fill();
    if(glow){ const fl=0.7+0.3*Math.sin(t*2.6+x+y); ctx.fillStyle='rgba(140,215,255,'+(0.75*fl)+')'; ctx.beginPath(); ctx.moveTo(x-2.5,y+14); ctx.lineTo(x-2.5,y+5); ctx.quadraticCurveTo(x,y-1,x+2.5,y+5); ctx.lineTo(x+2.5,y+14); ctx.closePath(); ctx.fill(); } };
  // plinth with steps
  ctx.fillStyle='#4a525c'; ctx.beginPath(); ctx.moveTo(-86,4); ctx.lineTo(-78,-14); ctx.lineTo(78,-14); ctx.lineTo(86,4); ctx.closePath(); ctx.fill(); ctx.strokeStyle=ol; ctx.stroke();
  ctx.fillStyle='#5a636e'; ctx.fillRect(-70,-26,140,12); ctx.strokeRect(-70,-26,140,12);
  // lower shaft + door
  shaft(-62,62,-190,-26,'#8a95a3','#6b7683'); courses(-62,62,-190,-26,18);
  for(const bx of [-62,50]){ ctx.fillStyle='#59626d'; ctx.fillRect(bx-4,-190,16,164); ctx.strokeRect(bx-4,-190,16,164); }   // buttresses
  ctx.fillStyle='#04070a'; ctx.beginPath(); ctx.moveTo(-24,-26); ctx.lineTo(-24,-82); ctx.quadraticCurveTo(0,-118,24,-82); ctx.lineTo(24,-26); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#2c343d'; ctx.lineWidth=4; ctx.stroke();
  const pg = 0.6+0.3*Math.sin(t*2.2), dg = ctx.createRadialGradient(0,-56,2,0,-56,38); dg.addColorStop(0,'rgba(150,225,255,'+(0.6*pg)+')'); dg.addColorStop(1,'rgba(150,225,255,0)');
  ctx.fillStyle=dg; ctx.beginPath(); ctx.ellipse(0,-56,34,48,0,0,7); ctx.fill();
  ctx.strokeStyle='#2a323b'; ctx.lineWidth=2.4; for(let x=-14;x<=14;x+=9){ ctx.beginPath(); ctx.moveTo(x,-26); ctx.lineTo(x,-92+Math.abs(x)*0.6); ctx.stroke(); }
  for(const sx of [-40,40]){ const fl=5+Math.sin(t*9+sx)*1.3; ctx.fillStyle='rgba(120,200,255,0.3)'; ctx.beginPath(); ctx.arc(sx,-76,14,0,7); ctx.fill(); ctx.fillStyle='#8fd8ff'; ctx.beginPath(); ctx.arc(sx,-76,fl,0,7); ctx.fill(); }
  slit(-38,-150,true); slit(38,-150,true);
  // first balcony
  shaft(-74,74,-206,-190,'#7c8794','#5f6975'); for(let x=-74;x<70;x+=24){ ctx.fillStyle='#4f5863'; ctx.fillRect(x,-216,14,10); ctx.strokeRect(x,-216,14,10); } snowCap(-74,74,-206);
  // middle shaft (narrower)
  shaft(-50,50,-340,-206,'#8f9aa8','#6f7a87'); courses(-50,50,-340,-206,18);
  slit(0,-300,true); slit(-26,-250,true); slit(26,-250,true); slit(0,-230,false);
  // second balcony
  shaft(-62,62,-356,-340,'#7c8794','#5f6975'); for(let x=-62;x<58;x+=22){ ctx.fillStyle='#4f5863'; ctx.fillRect(x,-366,13,10); ctx.strokeRect(x,-366,13,10); } snowCap(-62,62,-356);
  // upper shaft
  shaft(-38,38,-470,-356,'#97a2b0','#75808d'); courses(-38,38,-470,-356,18);
  slit(0,-440,true); slit(0,-396,true);
  // belfry with open arches and a glowing lantern
  shaft(-46,46,-520,-470,'#808b98','#626c78');
  for(const bx of [-24,0,24]){ ctx.fillStyle='#04070a'; ctx.beginPath(); ctx.moveTo(bx-8,-474); ctx.lineTo(bx-8,-498); ctx.quadraticCurveTo(bx,-512,bx+8,-498); ctx.lineTo(bx+8,-474); ctx.closePath(); ctx.fill(); }
  const lg = ctx.createRadialGradient(0,-488,2,0,-488,52); lg.addColorStop(0,'rgba(160,225,255,'+(0.55+0.25*Math.sin(t*3))+')'); lg.addColorStop(1,'rgba(160,225,255,0)');
  ctx.fillStyle=lg; ctx.beginPath(); ctx.arc(0,-488,52,0,7); ctx.fill();
  // conical roof, snow, crystal
  ctx.fillStyle='#27425e'; ctx.beginPath(); ctx.moveTo(-58,-520); ctx.lineTo(0,-620); ctx.lineTo(58,-520); ctx.closePath(); ctx.fill(); ctx.strokeStyle=ol; ctx.lineWidth=1.6; ctx.stroke();
  ctx.fillStyle='#f4f9fd'; ctx.beginPath(); ctx.moveTo(-34,-562); ctx.lineTo(0,-620); ctx.lineTo(34,-562); ctx.lineTo(18,-568); ctx.lineTo(0,-554); ctx.lineTo(-18,-568); ctx.closePath(); ctx.fill();
  const cp = 0.7+0.3*Math.sin(t*2.4); ctx.fillStyle='rgba(150,225,255,'+(0.35*cp)+')'; ctx.beginPath(); ctx.arc(0,-642,26,0,7); ctx.fill();
  ctx.fillStyle='#bfeaff'; ctx.strokeStyle='#4a86a8'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(0,-668); ctx.lineTo(8,-644); ctx.lineTo(0,-620); ctx.lineTo(-8,-644); ctx.closePath(); ctx.fill(); ctx.stroke();
  // banners down the shaft
  for(const bx of [-44,44]){ ctx.fillStyle='#7a1f2a'; ctx.beginPath(); ctx.moveTo(bx-7,-330); ctx.lineTo(bx+7,-330); ctx.lineTo(bx+7,-268); ctx.lineTo(bx,-280); ctx.lineTo(bx-7,-268); ctx.closePath(); ctx.fill(); }
  // mist wrapping the lower tower
  const mg = ctx.createRadialGradient(0,0,6,0,0,100); mg.addColorStop(0,'rgba(210,228,245,0.3)'); mg.addColorStop(1,'rgba(210,228,245,0)');
  ctx.fillStyle=mg; ctx.beginPath(); ctx.ellipse(0,0,100,26,0,0,7); ctx.fill();
  ctx.restore();
}
// Frosthold Dungeon: a stair sinking into a frozen crypt door, chained and sealed
function drawFhDungeonIso(gt, clock){
  const iso = toIso(gt.x, gt.y), t = clock||0;
  drawShadow(iso.x, iso.y+8, 90, 26);
  ctx.save(); ctx.translate(iso.x, iso.y+4);
  const ol = '#10151a';
  // earth mound / stone facade
  const fg = ctx.createLinearGradient(0,-150,0,0); fg.addColorStop(0,'#7e8a98'); fg.addColorStop(1,'#39414b');
  ctx.fillStyle=fg; ctx.strokeStyle=ol; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.moveTo(-92,4); ctx.lineTo(-92,-96); ctx.lineTo(-70,-124); ctx.lineTo(70,-124); ctx.lineTo(92,-96); ctx.lineTo(92,4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(8,12,16,0.3)'; ctx.lineWidth=1; for(let y=-108;y<0;y+=16){ ctx.beginPath(); ctx.moveTo(-90,y); ctx.lineTo(90,y); ctx.stroke(); }
  ctx.fillStyle='#f4f9fd'; ctx.beginPath(); ctx.moveTo(-96,-92); ctx.lineTo(-72,-128); ctx.lineTo(72,-128); ctx.lineTo(96,-92); ctx.lineTo(70,-100); ctx.lineTo(40,-92); ctx.lineTo(0,-102); ctx.lineTo(-40,-92); ctx.lineTo(-70,-100); ctx.closePath(); ctx.fill();
  // pillars flanking the arch
  for(const sx of [-58,58]){ ctx.fillStyle='#5b6571'; ctx.fillRect(sx-12,-110,24,114); ctx.strokeStyle=ol; ctx.lineWidth=1.4; ctx.strokeRect(sx-12,-110,24,114); ctx.fillStyle='#6d7783'; ctx.fillRect(sx-16,-116,32,10); ctx.strokeRect(sx-16,-116,32,10); }
  // arch + descending steps
  ctx.fillStyle='#03060a'; ctx.beginPath(); ctx.moveTo(-40,4); ctx.lineTo(-40,-62); ctx.quadraticCurveTo(0,-112,40,-62); ctx.lineTo(40,4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#59626d'; ctx.lineWidth=5; ctx.stroke();
  for(let i=0;i<4;i++){ ctx.fillStyle=['#46505b','#38414b','#2a323b','#1d242c'][i]; const w=40-i*5; ctx.fillRect(-w,-2-i*8,w*2,8); }
  // iron-banded doors, chain and padlock
  ctx.fillStyle='#2d2620'; ctx.beginPath(); ctx.moveTo(-34,-30); ctx.lineTo(-34,-62); ctx.quadraticCurveTo(0,-102,34,-62); ctx.lineTo(34,-30); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#14100d'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,-98); ctx.lineTo(0,-30); ctx.stroke();
  ctx.strokeStyle='#59626d'; ctx.lineWidth=3; for(const y of [-44,-62,-80]){ ctx.beginPath(); ctx.moveTo(-34,y); ctx.lineTo(34,y); ctx.stroke(); }
  ctx.strokeStyle='#8a96a3'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-36,-70); ctx.lineTo(36,-50); ctx.moveTo(-36,-50); ctx.lineTo(36,-70); ctx.stroke();
  ctx.fillStyle='#b8a05a'; ctx.strokeStyle='#4d3f18'; ctx.lineWidth=1.4; ctx.fillRect(-8,-66,16,14); ctx.strokeRect(-8,-66,16,14); ctx.beginPath(); ctx.arc(0,-66,6,Math.PI,0); ctx.stroke();
  // frost glow leaking from the seams
  const gp = 0.55+0.3*Math.sin(t*2.1), gg = ctx.createRadialGradient(0,-48,2,0,-48,60); gg.addColorStop(0,'rgba(130,210,255,'+(0.4*gp)+')'); gg.addColorStop(1,'rgba(130,210,255,0)');
  ctx.fillStyle=gg; ctx.beginPath(); ctx.ellipse(0,-48,60,56,0,0,7); ctx.fill();
  // skull keystone + blue braziers
  ctx.fillStyle='#d9dde0'; ctx.strokeStyle='#2a2f34'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.ellipse(0,-104,9,10,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#151a1f'; ctx.fillRect(-5,-107,3.5,4); ctx.fillRect(1.5,-107,3.5,4);
  for(const sx of [-76,76]){ const fl=6+Math.sin(t*8+sx)*1.5; ctx.fillStyle='#3b434d'; ctx.fillRect(sx-3,-28,6,28); ctx.beginPath(); ctx.moveTo(sx-10,-32); ctx.lineTo(sx+10,-32); ctx.lineTo(sx+6,-24); ctx.lineTo(sx-6,-24); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(120,200,255,0.3)'; ctx.beginPath(); ctx.arc(sx,-40,18,0,7); ctx.fill(); ctx.fillStyle='#8fd8ff'; ctx.beginPath(); ctx.moveTo(sx-5,-32); ctx.quadraticCurveTo(sx-3,-34-fl,sx,-38-fl*1.4); ctx.quadraticCurveTo(sx+3,-34-fl,sx+5,-32); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function drawGateArtIso(gt, clock, part){
  if(gt.art==='cave') drawIceCaveIso(gt, clock);
  else if(gt.art==='keep') drawKeepGateIso(gt, clock);
  else if(gt.art==='tower') drawTowerDoorIso(gt, clock);
  else if(gt.art==='ftower') drawFrostholdTowerIso(gt, clock, part);
  else if(gt.art==='fhdungeon') drawFhDungeonIso(gt, clock);
  else drawRuinsGateIso(gt, clock);
}
// A small hanging wooden sign on a post -- used for the Tavern's
// "Tavern, Closed"/"Tavern" exterior sign. No existing sign/plaque
// sprite pattern to reuse (drawEdgeLabelIso above is just floating text,
// no post/plank), so this is a small new one: a post + a wood plank with
// 1-2 lines of text painted on it.
function drawSignIso(pos, lines){
  const iso = toIso(pos.x, pos.y);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle = '#3a2c1c';
  ctx.fillRect(-2, -30, 4, 34);
  ctx.strokeStyle = '#1c140c'; ctx.lineWidth = 1; ctx.strokeRect(-2,-30,4,34);
  const plankW = 74, plankH = lines.length>1 ? 6+12*lines.length : 20;
  const plankGrad = ctx.createLinearGradient(-plankW/2,-30-plankH,plankW/2,-30);
  plankGrad.addColorStop(0,'#6b4a2e'); plankGrad.addColorStop(1,'#4a3220');
  ctx.fillStyle = plankGrad;
  roundRect(-plankW/2, -30-plankH, plankW, plankH, 3); ctx.fill();
  ctx.strokeStyle = '#231a10'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.font = "bold 10px Cinzel, Georgia, 'Times New Roman', serif";
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8d8b8';
  lines.forEach((ln,i)=>{
    ctx.fillText(ln, 0, -30-plankH+14+i*12);
  });
  ctx.restore();
}
// v193: redesigned lair entrances (no more tall beacon totems -- roads lead you there now).
// Bear Cave: a mossy rock hill with a dark den mouth, claw-scored stone, bones and worn earth.
function drawBearDenIso(pos, clock){
  const iso = toIso(pos.x, pos.y), t = clock||0;
  drawShadow(iso.x, iso.y+6, 84, 26);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle = 'rgba(40,30,20,0.9)'; ctx.beginPath(); ctx.ellipse(0,8,92,30,0,0,7); ctx.fill();
  ctx.fillStyle = 'rgba(58,44,28,0.85)'; ctx.beginPath(); ctx.ellipse(-4,10,64,20,0,0,7); ctx.fill();
  ctx.fillStyle = 'rgba(18,12,8,0.55)';
  for(let i=0;i<5;i++){ const px=-40+i*24, py=24+(i%2)*6; ctx.beginPath(); ctx.ellipse(px,py,5.5,3.4,0,0,7); ctx.fill(); for(let k=-1;k<=1;k++){ ctx.beginPath(); ctx.ellipse(px+k*4.2,py-5,1.7,1.3,0,0,7); ctx.fill(); } }
  const rg = ctx.createLinearGradient(-74,-96,74,4); rg.addColorStop(0,'#6f675a'); rg.addColorStop(0.6,'#4a443a'); rg.addColorStop(1,'#2b2620');
  ctx.fillStyle = rg; ctx.strokeStyle = '#15120d'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-76,6); ctx.lineTo(-74,-28); ctx.lineTo(-54,-60); ctx.lineTo(-28,-84); ctx.lineTo(6,-96); ctx.lineTo(40,-84); ctx.lineTo(64,-54); ctx.lineTo(76,-22); ctx.lineTo(78,6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.4;
  for(const [x1,y1,x2,y2] of [[-60,-30,-40,-46],[40,-66,58,-40],[-20,-84,-6,-70],[52,-24,68,-30],[-66,-8,-46,-16]]){ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
  ctx.fillStyle = 'rgba(60,102,46,0.92)';
  ctx.beginPath(); ctx.moveTo(-54,-60); ctx.lineTo(-28,-84); ctx.lineTo(6,-96); ctx.lineTo(40,-84); ctx.lineTo(64,-54); ctx.lineTo(44,-62); ctx.lineTo(10,-74); ctx.lineTo(-24,-66); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(60,102,46,0.7)'; ctx.beginPath(); ctx.ellipse(-62,-16,10,5,0.3,0,7); ctx.fill(); ctx.beginPath(); ctx.ellipse(66,-8,9,4,-0.2,0,7); ctx.fill();
  // den mouth
  ctx.fillStyle = '#040302';
  ctx.beginPath(); ctx.moveTo(-34,6); ctx.lineTo(-36,-24); ctx.quadraticCurveTo(-32,-60,0,-62); ctx.quadraticCurveTo(32,-60,36,-24); ctx.lineTo(34,6); ctx.closePath(); ctx.fill();
  const flick = 0.75+0.25*Math.sin(t*5.3)*Math.sin(t*2.1);
  const dg = ctx.createRadialGradient(0,-14,2,0,-14,30); dg.addColorStop(0,'rgba(200,100,40,'+(0.16*flick)+')'); dg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle = dg; ctx.beginPath(); ctx.ellipse(0,-14,30,34,0,0,7); ctx.fill();
  ctx.strokeStyle = '#1e1a14'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-36,-24); ctx.quadraticCurveTo(-32,-60,0,-62); ctx.quadraticCurveTo(32,-60,36,-24); ctx.stroke();
  // hanging roots
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2;
  for(const rx of [-22,-8,10,24]){ ctx.beginPath(); ctx.moveTo(rx,-60+Math.abs(rx)*0.1); ctx.quadraticCurveTo(rx+3,-48,rx-2,-38-Math.abs(rx)*0.2); ctx.stroke(); }
  // claw gouges
  ctx.strokeStyle = 'rgba(10,8,6,0.75)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(46+i*5,-56+i*1); ctx.lineTo(54+i*5,-16); ctx.stroke(); }
  // skull + bones + fur
  ctx.fillStyle = '#d9d1bb'; ctx.beginPath(); ctx.ellipse(-46,10,8,6,0,0,7); ctx.fill(); ctx.fillStyle = '#1a1410'; ctx.beginPath(); ctx.arc(-49,9,1.6,0,7); ctx.arc(-43,9,1.6,0,7); ctx.fill();
  ctx.strokeStyle = '#d9d1bb'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-40,4); ctx.lineTo(-24,14); ctx.moveTo(38,14); ctx.lineTo(56,8); ctx.stroke();
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.4; for(const fx of [-38,-34,40,44]){ ctx.beginPath(); ctx.moveTo(fx,-20); ctx.lineTo(fx+2,-10); ctx.stroke(); }
  // flanking boulders
  for(const [bx,by,br] of [[-66,4,14],[70,6,12]]){ const bg = ctx.createLinearGradient(bx-br,by-br,bx+br,by+br); bg.addColorStop(0,'#726a5c'); bg.addColorStop(1,'#312c25'); ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(bx,by-br*0.5,br*1.2,br*0.8,0,0,7); ctx.fill(); ctx.strokeStyle='#17140f'; ctx.lineWidth=1.2; ctx.stroke(); }
  ctx.restore();
}
// Spider Lair: a sunken hole in cracked earth, framed by two dead twisted trees and draped in thick web sheets, with egg cocoons.
function drawSpiderNestIso(pos, clock){
  const iso = toIso(pos.x, pos.y), t = clock||0;
  drawShadow(iso.x, iso.y+6, 80, 24);
  ctx.save(); ctx.translate(iso.x, iso.y);
  // cracked, web-covered ground
  ctx.fillStyle = 'rgba(24,18,32,0.92)'; ctx.beginPath(); ctx.ellipse(0,6,96,32,0,0,7); ctx.fill();
  ctx.strokeStyle = 'rgba(225,218,240,0.34)'; ctx.lineWidth = 1;
  for(let i=0;i<10;i++){ const a = i/10*Math.PI*2; ctx.beginPath(); ctx.moveTo(0,6); ctx.lineTo(Math.cos(a)*96,6+Math.sin(a)*32); ctx.stroke(); }
  for(let r=0.3;r<=1;r+=0.23){ ctx.beginPath(); for(let i=0;i<=10;i++){ const a = i/10*Math.PI*2, k = r*(0.92+0.08*Math.sin(i*2.3)); const px = Math.cos(a)*96*k, py = 6+Math.sin(a)*32*k; i?ctx.lineTo(px,py):ctx.moveTo(px,py); } ctx.stroke(); }
  // the pit
  const pit = ctx.createRadialGradient(0,2,2,0,2,44); pit.addColorStop(0,'#000'); pit.addColorStop(0.7,'#0b0712'); pit.addColorStop(1,'#241a30');
  ctx.fillStyle = pit; ctx.beginPath(); ctx.ellipse(0,2,46,17,0,0,7); ctx.fill();
  ctx.strokeStyle = '#120c1a'; ctx.lineWidth = 2.4; ctx.stroke();
  const pulse = 0.55+0.45*Math.sin(t*2.6);
  const gl = ctx.createRadialGradient(0,0,1,0,0,26); gl.addColorStop(0,'rgba(140,90,210,'+(0.32*pulse)+')'); gl.addColorStop(1,'rgba(40,10,70,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.ellipse(0,0,26,12,0,0,7); ctx.fill();
  // two dead trees leaning over the hole
  const tree = (sx,dir)=>{
    ctx.strokeStyle = '#2a2320'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx,4); ctx.quadraticCurveTo(sx+dir*6,-46,sx-dir*18,-92); ctx.stroke();
    ctx.strokeStyle = '#3d342e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx+dir*1,2); ctx.quadraticCurveTo(sx+dir*8,-44,sx-dir*17,-90); ctx.stroke();
    ctx.strokeStyle = '#2a2320'; ctx.lineWidth = 2.4;
    for(const [bx,by,ex,ey] of [[-0.2,-50,dir*-26,-72],[0.1,-66,dir*10,-96],[-0.4,-80,dir*-38,-98]]){ ctx.beginPath(); ctx.moveTo(sx+dir*4,by); ctx.lineTo(sx+ex,ey); ctx.stroke(); }
  };
  tree(-58,1); tree(58,-1);
  // web sheet strung between the trunks over the mouth
  ctx.strokeStyle = 'rgba(232,226,246,0.6)'; ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(210,200,235,0.07)';
  ctx.beginPath(); ctx.moveTo(-72,-92); ctx.quadraticCurveTo(0,-52,72,-92); ctx.lineTo(56,-18); ctx.quadraticCurveTo(0,-4,-56,-18); ctx.closePath(); ctx.fill(); ctx.stroke();
  for(let i=1;i<6;i++){ const f = i/6; ctx.beginPath(); ctx.moveTo(-72+144*f,-92+(f*(1-f))*160*0.0-20*Math.sin(f*Math.PI)*0); ctx.quadraticCurveTo(0+(f-0.5)*30,-40,-56+112*f,-16); ctx.stroke(); }
  for(let r=1;r<=3;r++){ ctx.beginPath(); ctx.moveTo(-70+r*4,-90+r*16); ctx.quadraticCurveTo(0,-52+r*12,70-r*4,-90+r*16); ctx.stroke(); }
  // egg cocoons hanging from the trunks
  const cocoon = (cx,cy,s)=>{ ctx.strokeStyle='rgba(225,218,240,0.6)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx,cy-16*s); ctx.lineTo(cx,cy-6*s); ctx.stroke();
    ctx.fillStyle='#d8d2c6'; ctx.beginPath(); ctx.ellipse(cx,cy,5*s,9*s,0,0,7); ctx.fill(); ctx.strokeStyle='rgba(90,80,100,0.5)'; ctx.stroke();
    ctx.strokeStyle='rgba(90,80,100,0.5)'; for(let k=-1;k<=1;k++){ ctx.beginPath(); ctx.moveTo(cx-4*s,cy+k*4*s); ctx.lineTo(cx+4*s,cy+k*4*s-1); ctx.stroke(); }
    const g2=0.3+0.3*Math.sin(t*2+cx); ctx.fillStyle='rgba(150,240,150,'+g2*0.25+')'; ctx.beginPath(); ctx.ellipse(cx,cy,7*s,11*s,0,0,7); ctx.fill(); };
  cocoon(-50,-40,1); cocoon(-40,-26,0.8); cocoon(52,-46,1); cocoon(44,-30,0.85); cocoon(-66,-56,0.7);
  // two small spiders patrolling the web
  for(let i=0;i<2;i++){ const a = t*0.6+i*3.1, sx = Math.cos(a)*40, sy = -34+Math.sin(a*1.3)*12; ctx.strokeStyle='#120c16'; ctx.lineWidth=1.2; for(let k=-2;k<=2;k++){ if(!k) continue; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx+k*4,sy-3+Math.abs(k)); ctx.lineTo(sx+k*6,sy+3); ctx.stroke(); } ctx.fillStyle='#1a1220'; ctx.beginPath(); ctx.ellipse(sx,sy,3.6,2.8,0,0,7); ctx.fill(); }
  ctx.restore();
}
// Spider Lair entrance in the Forest -- a dark rock crevice draped with
// web strands, distinct from the Mine's stone-archway stairway.
function drawWebCaveIso(pos, clock){
  const iso = toIso(pos.x, pos.y);
  const t = clock||0;
  drawShadow(iso.x, iso.y+4, 40, 14);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle='#241a2e';
  ctx.beginPath(); ctx.ellipse(0,-16,34,40,0,0,Math.PI,true); ctx.fill();
  const pitGrad = ctx.createRadialGradient(0,-14,2,0,-14,26);
  pitGrad.addColorStop(0,'#0e0814'); pitGrad.addColorStop(1,'#000');
  ctx.fillStyle = pitGrad;
  ctx.beginPath(); ctx.ellipse(0,-14,24,30,0,0,Math.PI,true); ctx.fill();
  // web strands across the mouth
  ctx.strokeStyle='rgba(220,210,235,0.5)'; ctx.lineWidth=1;
  for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*11,-46); ctx.lineTo(i*7,4); ctx.stroke(); }
  for(let r=8;r<=30;r+=8){
    ctx.beginPath();
    for(let a=0;a<=8;a++){ const ang=Math.PI*(a/8); const px=Math.cos(ang)*r, py=-14-Math.sin(ang)*r*1.1; a===0?ctx.moveTo(px,py):ctx.lineTo(px,py); }
    ctx.stroke();
  }
  const pulse = 1+Math.sin(t*3)*0.15;
  const glow = ctx.createRadialGradient(0,-14,1,0,-14,12*pulse);
  glow.addColorStop(0,'rgba(160,90,220,0.45)'); glow.addColorStop(1,'rgba(60,20,90,0)');
  ctx.fillStyle=glow;
  ctx.beginPath(); ctx.ellipse(0,-14,12*pulse,7*pulse,0,0,7); ctx.fill();
  ctx.restore();
}
// Bear Cave entrance in the Forest -- a rough earthen den mouth, with claw
// marks scored into the rock and a scatter of bones outside.
function drawDenCaveIso(pos, clock){
  const iso = toIso(pos.x, pos.y);
  const t = clock||0;
  drawShadow(iso.x, iso.y+4, 42, 15);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle='#3a2a1c';
  ctx.beginPath(); ctx.ellipse(0,-14,36,38,0,0,Math.PI,true); ctx.fill();
  const pitGrad = ctx.createRadialGradient(0,-12,2,0,-12,26);
  pitGrad.addColorStop(0,'#100a06'); pitGrad.addColorStop(1,'#000');
  ctx.fillStyle = pitGrad;
  ctx.beginPath(); ctx.ellipse(0,-12,24,28,0,0,Math.PI,true); ctx.fill();
  // claw marks either side of the mouth
  ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=2; ctx.lineCap='round';
  for(const side of [-1,1]){
    for(let i=0;i<3;i++){
      ctx.beginPath(); ctx.moveTo(side*(20+i*2),-40); ctx.lineTo(side*(26+i*2),-6); ctx.stroke();
    }
  }
  // bones scattered outside the mouth
  ctx.fillStyle='#d8d0bc';
  ctx.save(); ctx.translate(-14,10); ctx.rotate(0.4); ctx.fillRect(-9,-2,18,4); ctx.beginPath(); ctx.arc(-9,0,3,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(9,0,3,0,7); ctx.fill(); ctx.restore();
  const flick = 0.7+Math.sin(t*6)*0.15;
  const glow = ctx.createRadialGradient(0,-10,1,0,-10,10*flick);
  glow.addColorStop(0,'rgba(255,140,60,0.3)'); glow.addColorStop(1,'rgba(120,40,10,0)');
  ctx.fillStyle=glow;
  ctx.beginPath(); ctx.ellipse(0,-10,10*flick,6*flick,0,0,7); ctx.fill();
  ctx.restore();
}
// v87: "findable from a distance" landmark totems for all 3 Dark Forest
// gates -- added per the user's direct feedback that spiderLairGate and
// the (relocated) sunGate were impossible to spot while exploring the huge
// 5400x3800 zone. drawWebCaveIso/drawDenCaveIso above are ground-level cave
// mouths that only read at close range, about the same height as a tree
// (~50-56px). These three totems are each drawn ADDITIONALLY at the same
// gate position, standing roughly TWICE that tall (~110-130px, modeled
// after drawLighthouseBeaconIso's tall-pole-plus-glow silhouette, which is
// this game's own precedent for "reads as prominent from a distance" --
// its 96px pole + pulsing 34px-radius glow is exactly the shape being
// reused here) so their glowing tops clear the forest canopy and stand out
// sharply against the tree-line while scanning the screen mid-explore.
//
// Spider Lair: a totem of lashed bones draped in thick web streamers,
// topped by a sickly purple-white glow -- thematically dark/creepy,
// matching drawWebCaveIso's own purple palette.
function drawSpiderTotemIso(pos, clock){
  const iso = toIso(pos.x, pos.y);
  const t = clock||0;
  drawShadow(iso.x, iso.y+4, 26, 10);
  ctx.save(); ctx.translate(iso.x, iso.y);
  const poleH = 108;
  // a stack of lashed bones forming the pole, rather than a plain post
  ctx.fillStyle = '#c9c0aa';
  for(let i=0;i<5;i++){
    const by = -10 - i*(poleH/5);
    ctx.save(); ctx.translate(0, by); ctx.rotate(i%2===0 ? 0.12 : -0.12);
    ctx.fillRect(-10, -3, 20, 6);
    ctx.beginPath(); ctx.arc(-10,0,3.4,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(10,0,3.4,0,7); ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=1;
  // a thin central spine tying the bones together
  ctx.strokeStyle='#4a4038'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(0,4); ctx.lineTo(0,-10-poleH); ctx.stroke();
  // draped web streamers hanging off the top third
  ctx.strokeStyle='rgba(220,210,235,0.55)'; ctx.lineWidth=1;
  for(const dx of [-16,-6,6,16]){
    const topY = -10-poleH*0.82;
    ctx.beginPath();
    ctx.moveTo(dx*0.3, topY);
    ctx.quadraticCurveTo(dx*1.4, topY+poleH*0.35, dx*0.6, topY+poleH*0.6);
    ctx.stroke();
  }
  // a carved spider-skull marker near the top
  const skullY = -10-poleH*0.92;
  ctx.fillStyle = '#e8e0d0';
  ctx.beginPath(); ctx.arc(0, skullY, 9, 0, 7); ctx.fill();
  ctx.fillStyle = '#1a1420';
  ctx.beginPath(); ctx.arc(-3, skullY-1, 1.8, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(3, skullY-1, 1.8, 0, 7); ctx.fill();
  // pulsing sickly glow at the very top, the long-distance "beacon" part
  const pulse = 1+Math.sin(t*2.4)*0.22;
  const glow = ctx.createRadialGradient(0,skullY-6,2,0,skullY-6,32*pulse);
  glow.addColorStop(0,'rgba(190,120,255,0.75)'); glow.addColorStop(0.5,'rgba(140,70,210,0.35)'); glow.addColorStop(1,'rgba(60,20,90,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, skullY-6, 32*pulse, 0, 7); ctx.fill();
  ctx.restore();
}
// Bear Cave: a tall carved wooden totem with a bear-hide banner and deep
// claw gouges, topped by a warm amber glow -- thematically feral, matching
// drawDenCaveIso's own amber/orange palette.
function drawBearTotemIso(pos, clock){
  const iso = toIso(pos.x, pos.y);
  const t = clock||0;
  drawShadow(iso.x, iso.y+4, 28, 11);
  ctx.save(); ctx.translate(iso.x, iso.y);
  const poleH = 106;
  const poleGrad = ctx.createLinearGradient(-8,0,8,0);
  poleGrad.addColorStop(0,'#6a4a2c'); poleGrad.addColorStop(1,'#3a2814');
  ctx.fillStyle = poleGrad;
  roundRect(-7, -6-poleH, 14, poleH+6, 3); ctx.fill();
  ctx.strokeStyle='#1c1208'; ctx.lineWidth=1.3; ctx.stroke();
  // deep claw gouges scored into the wood, top to bottom
  ctx.strokeStyle='rgba(0,0,0,0.55)'; ctx.lineWidth=2; ctx.lineCap='round';
  for(const side of [-1,1]){
    for(let i=0;i<4;i++){
      const gy = -14 - i*(poleH/4.4);
      ctx.beginPath(); ctx.moveTo(side*2, gy); ctx.lineTo(side*5.5, gy-22); ctx.stroke();
    }
  }
  // a hide banner hanging partway up, fluttering slightly
  const flutter = Math.sin(t*1.6)*4;
  ctx.fillStyle = '#8a6a44';
  ctx.beginPath();
  ctx.moveTo(-7, -poleH*0.42); ctx.lineTo(-30+flutter, -poleH*0.5); ctx.lineTo(-28+flutter, -poleH*0.28); ctx.lineTo(-7, -poleH*0.24);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#241a10'; ctx.lineWidth=1; ctx.stroke();
  // a carved bear-skull marker near the top
  const skullY = -10-poleH*0.94;
  ctx.fillStyle = '#e8ddc4';
  ctx.beginPath(); ctx.ellipse(0, skullY, 10, 8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#1c1208';
  ctx.beginPath(); ctx.arc(-3.5, skullY-1, 1.8, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(3.5, skullY-1, 1.8, 0, 7); ctx.fill();
  // pulsing warm amber glow at the very top, the long-distance "beacon" part
  const pulse = 1+Math.sin(t*2.8)*0.2;
  const glow = ctx.createRadialGradient(0,skullY-6,2,0,skullY-6,30*pulse);
  glow.addColorStop(0,'rgba(255,170,90,0.75)'); glow.addColorStop(0.5,'rgba(220,110,40,0.35)'); glow.addColorStop(1,'rgba(120,40,10,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, skullY-6, 30*pulse, 0, 7); ctx.fill();
  ctx.restore();
}
// Withered Crossroads gate (the Forest's south-edge exit, v87): a tall carved
// stone signpost topped with a radiant golden sun disc + rays -- the
// brightest/warmest of the three totems, thematically fitting an exit into
// open sunlit grassland, and the most visually distinct against the dark
// forest canopy from a distance.
// v229: the Withered Crossroads exit -- a mossy ruined stone archway where the forest canopy breaks open onto golden light
// (replaces the old pole-and-beacon totem).
function drawSunArchIso(pos, clock){
  const iso = toIso(pos.x, pos.y), t = clock||0;
  // warm light pooling on the ground in front of the arch
  ctx.save(); ctx.translate(iso.x, iso.y);
  const pool = ctx.createRadialGradient(0,-6,4,0,-6,150);
  pool.addColorStop(0,'rgba(255,226,140,0.42)'); pool.addColorStop(0.55,'rgba(255,200,100,0.16)'); pool.addColorStop(1,'rgba(255,190,80,0)');
  ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(0,-4,160,54,0,0,7); ctx.fill();
  drawShadow(-44, 6, 22, 8); drawShadow(44, 6, 22, 8);
  const H0 = 112, PX = 46, PW = 22;
  // the bright opening between the pillars: sky-gold light with a soft gradient
  const op = ctx.createLinearGradient(0,-H0,0,0);
  op.addColorStop(0,'#fff0b8'); op.addColorStop(0.6,'#ffd97a'); op.addColorStop(1,'#f2b860');
  ctx.fillStyle = op;
  ctx.beginPath(); ctx.moveTo(-PX+PW/2,0); ctx.lineTo(-PX+PW/2,-H0+26); ctx.quadraticCurveTo(0,-H0-14,PX-PW/2,-H0+26); ctx.lineTo(PX-PW/2,0); ctx.closePath(); ctx.fill();
  // distant grass/hill silhouette seen through the arch
  ctx.fillStyle = 'rgba(150,170,70,0.75)'; ctx.beginPath(); ctx.moveTo(-PX+PW/2,0); ctx.quadraticCurveTo(-14,-22,0,-14); ctx.quadraticCurveTo(16,-26,PX-PW/2,-6); ctx.lineTo(PX-PW/2,0); ctx.closePath(); ctx.fill();
  // pillars
  for(const sx of [-1,1]){
    const px = sx*PX - PW/2;
    const pg = ctx.createLinearGradient(px,0,px+PW,0); pg.addColorStop(0,'#8a8474'); pg.addColorStop(1,'#544e42');
    ctx.fillStyle = pg; ctx.strokeStyle = '#1c1812'; ctx.lineWidth = 1.6;
    roundRect(px, -H0+18, PW, H0-18, 3); ctx.fill(); ctx.stroke();
    // base block + capital
    ctx.fillStyle = '#6b6558'; roundRect(px-4, -10, PW+8, 12, 2); ctx.fill(); ctx.stroke();
    roundRect(px-3, -H0+12, PW+6, 10, 2); ctx.fill(); ctx.stroke();
    // stone courses
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
    for(let i=1;i<6;i++){ const by = -H0+18 + (H0-28)*(i/6); ctx.beginPath(); ctx.moveTo(px,by); ctx.lineTo(px+PW,by); ctx.stroke(); }
    // moss creeping up from the base
    ctx.fillStyle = 'rgba(86,132,54,0.85)';
    ctx.beginPath(); ctx.moveTo(px,-8); ctx.lineTo(px,-44); ctx.quadraticCurveTo(px+8,-36,px+PW*0.6,-52); ctx.lineTo(px+PW,-30); ctx.lineTo(px+PW,-8); ctx.closePath(); ctx.fill();
  }
  // curved lintel stones over the top
  ctx.strokeStyle = '#1c1812'; ctx.lineWidth = 1.6;
  const lg = ctx.createLinearGradient(0,-H0-16,0,-H0+28); lg.addColorStop(0,'#9a9484'); lg.addColorStop(1,'#5a5446');
  ctx.fillStyle = lg;
  ctx.beginPath(); ctx.moveTo(-PX-PW/2-2,-H0+22); ctx.quadraticCurveTo(-PX-PW/2,-H0-6,0,-H0-20); ctx.quadraticCurveTo(PX+PW/2,-H0-6,PX+PW/2+2,-H0+22);
  ctx.lineTo(PX-PW/2,-H0+26); ctx.quadraticCurveTo(0,-H0-14,-PX+PW/2,-H0+26); ctx.closePath(); ctx.fill(); ctx.stroke();
  // keystone
  ctx.fillStyle = '#b0a994'; ctx.beginPath(); ctx.moveTo(-8,-H0-17); ctx.lineTo(8,-H0-17); ctx.lineTo(6,-H0+4); ctx.lineTo(-6,-H0+4); ctx.closePath(); ctx.fill(); ctx.stroke();
  // carved sun on the keystone
  ctx.strokeStyle = '#e8c44a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0,-H0-7,3,0,7); ctx.stroke();
  for(let i=0;i<8;i++){ const a=i*Math.PI/4; ctx.beginPath(); ctx.moveTo(Math.cos(a)*4.6,-H0-7+Math.sin(a)*4.6); ctx.lineTo(Math.cos(a)*6.6,-H0-7+Math.sin(a)*6.6); ctx.stroke(); }
  // ivy hanging from the lintel and pillars, swaying a little
  ctx.strokeStyle = 'rgba(60,110,44,0.95)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  for(const [vx,len] of [[-36,30],[-22,18],[-8,10],[14,14],[28,26],[40,38]]){
    const sw = Math.sin(t*1.1+vx)*2;
    ctx.beginPath(); ctx.moveTo(vx,-H0+22-Math.abs(vx)*0.12); ctx.quadraticCurveTo(vx+sw,-H0+22+len*0.6,vx+sw*1.6,-H0+22+len); ctx.stroke();
    ctx.fillStyle = 'rgba(96,150,60,0.95)'; ctx.beginPath(); ctx.ellipse(vx+sw*1.6,-H0+22+len,3.4,2.2,0.5,0,7); ctx.fill();
  }
  // wildflowers at the base
  for(const [fx,fy,fc] of [[-64,4,'#ffd84a'],[-56,8,'#fff2b0'],[-72,9,'#ffd84a'],[60,6,'#ffd84a'],[70,9,'#fff2b0'],[54,10,'#ffb35a']]){
    ctx.fillStyle = 'rgba(70,120,46,0.9)'; ctx.fillRect(fx-0.8,fy-5,1.6,6);
    ctx.fillStyle = fc; ctx.beginPath(); ctx.arc(fx,fy-6,2.6,0,7); ctx.fill();
  }
  // light shafts spilling out of the opening, and drifting motes
  ctx.globalCompositeOperation = 'lighter';
  for(let i=0;i<3;i++){
    const al = 0.10 + 0.05*Math.sin(t*0.9+i*2.1), x0 = -28+i*28;
    const rg = ctx.createLinearGradient(x0,-H0+10,x0+30,30);
    rg.addColorStop(0,'rgba(255,230,150,'+(al*1.6).toFixed(3)+')'); rg.addColorStop(1,'rgba(255,210,110,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(x0-10,-H0+10); ctx.lineTo(x0+10,-H0+10); ctx.lineTo(x0+58,34); ctx.lineTo(x0+8,34); ctx.closePath(); ctx.fill();
  }
  for(let i=0;i<12;i++){
    const ph = t*0.35 + i*0.61, mx = Math.sin(ph*1.7+i)*58, my = -((ph*26 + i*19) % 120) + 14;
    ctx.fillStyle = 'rgba(255,240,170,'+(0.25+0.3*Math.abs(Math.sin(ph*3+i))).toFixed(3)+')';
    ctx.beginPath(); ctx.arc(mx,my,1.6,0,7); ctx.fill();
  }
  ctx.restore();
}
function drawSunTotemIso(pos, clock){
  const iso = toIso(pos.x, pos.y);
  const t = clock||0;
  drawShadow(iso.x, iso.y+4, 30, 12);
  ctx.save(); ctx.translate(iso.x, iso.y);
  const poleH = 118;
  const poleGrad = ctx.createLinearGradient(-9,0,9,0);
  poleGrad.addColorStop(0,'#8a8074'); poleGrad.addColorStop(1,'#4a4238');
  ctx.fillStyle = poleGrad;
  roundRect(-8, -8-poleH, 16, poleH+8, 4); ctx.fill();
  ctx.strokeStyle='#201c16'; ctx.lineWidth=1.4; ctx.stroke();
  // carved horizontal banding, reading as worked stone rather than a bare post
  ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1;
  for(let i=1;i<5;i++){ const by=-8-poleH*(i/5); ctx.beginPath(); ctx.moveTo(-8,by); ctx.lineTo(8,by); ctx.stroke(); }
  // a small crossbar/plinth near the top the sun disc sits above
  ctx.fillStyle = '#6a6258';
  roundRect(-20, -6-poleH*0.98, 40, 10, 3); ctx.fill();
  ctx.strokeStyle='#201c16'; ctx.lineWidth=1.2; ctx.stroke();
  // the radiant sun disc + rays, the long-distance "beacon" part -- biggest
  // and brightest of the three totem glows, fitting the "leads to open
  // sunlit plains" theme.
  const diskY = -14-poleH;
  const pulse = 1+Math.sin(t*2.2)*0.16;
  const rayLen = 26*pulse;
  ctx.save();
  ctx.translate(0, diskY);
  ctx.rotate(t*0.3);
  ctx.strokeStyle = 'rgba(255,224,140,0.8)'; ctx.lineWidth = 3; ctx.lineCap='round';
  for(let i=0;i<8;i++){
    const ang = (Math.PI*2)*(i/8);
    ctx.beginPath(); ctx.moveTo(Math.cos(ang)*14, Math.sin(ang)*14); ctx.lineTo(Math.cos(ang)*rayLen, Math.sin(ang)*rayLen); ctx.stroke();
  }
  ctx.restore();
  const glow = ctx.createRadialGradient(0,diskY,2,0,diskY,38*pulse);
  glow.addColorStop(0,'rgba(255,244,210,0.95)'); glow.addColorStop(0.45,'rgba(255,196,90,0.5)'); glow.addColorStop(1,'rgba(255,150,40,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, diskY, 38*pulse, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff3cc';
  ctx.beginPath(); ctx.arc(0, diskY, 10, 0, 7); ctx.fill();
  ctx.strokeStyle = '#e8c44a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, diskY, 10, 0, 7); ctx.stroke();
  ctx.restore();
}
// Lighthouse Tower entrance in Withered Crossroads (v70): a small stone doorway
// with a warm, pulsing lantern above it -- a low-key foreshadowing of the
// much bigger beacon waiting at the top of the tower (drawLighthouseBeaconIso).
// Big striped lighthouse rising behind the Withered Crossroads west gate; the door at its base is the exit.
function drawLighthouseTowerIso(pos, clock){
  const iso = toIso(pos.x, pos.y);
  const t = clock||0;
  drawShadow(iso.x, iso.y+6, 78, 26);
  ctx.save(); ctx.translate(iso.x, iso.y);
  const H=330, bw=62, tw=36;
  // stone plinth
  ctx.fillStyle='#4a4650'; ctx.beginPath(); ctx.moveTo(-bw-14,4); ctx.lineTo(bw+14,4); ctx.lineTo(bw+8,-16); ctx.lineTo(-bw-8,-16); ctx.closePath(); ctx.fill();
  // tapered striped body
  const bands=6;
  for(let i=0;i<bands;i++){
    const y0=-16-(H-16)*i/bands, y1=-16-(H-16)*(i+1)/bands;
    const w0=bw-(bw-tw)*i/bands, w1=bw-(bw-tw)*(i+1)/bands;
    ctx.fillStyle = i%2===0 ? '#d9d4c7' : '#b8483f';
    ctx.beginPath(); ctx.moveTo(-w0,y0); ctx.lineTo(w0,y0); ctx.lineTo(w1,y1); ctx.lineTo(-w1,y1); ctx.closePath(); ctx.fill();
  }
  // shading on right half
  ctx.fillStyle='rgba(20,15,30,0.28)';
  ctx.beginPath(); ctx.moveTo(8,-16); ctx.lineTo(bw,-16); ctx.lineTo(tw,-H); ctx.lineTo(4,-H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#2a2430'; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.moveTo(-bw,-16); ctx.lineTo(-tw,-H); ctx.moveTo(bw,-16); ctx.lineTo(tw,-H); ctx.stroke();
  // small windows
  ctx.fillStyle='#1b1626';
  for(let i=1;i<4;i++){ const y=-16-(H-16)*i/4.4; roundRect(-4,y-9,8,16,3); ctx.fill(); }
  // door
  ctx.fillStyle='#2b2018'; ctx.beginPath(); ctx.moveTo(-17,-16); ctx.lineTo(-17,-46); ctx.arc(0,-46,17,Math.PI,0); ctx.lineTo(17,-16); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#e0d8c4'; ctx.lineWidth=2.4; ctx.stroke();
  ctx.fillStyle='#0d0a12'; ctx.beginPath(); ctx.moveTo(-12,-16); ctx.lineTo(-12,-45); ctx.arc(0,-45,12,Math.PI,0); ctx.lineTo(12,-16); ctx.closePath(); ctx.fill();
  // gallery
  ctx.fillStyle='#3a3540'; roundRect(-tw-12,-H-8,(tw+12)*2,10,3); ctx.fill();
  ctx.strokeStyle='#221e28'; ctx.lineWidth=1.2; ctx.stroke();
  // lantern room + glow
  const pulse=0.75+Math.sin(t*2.4)*0.25;
  const glow=ctx.createRadialGradient(0,-H-30,2,0,-H-30,90*pulse);
  glow.addColorStop(0,'rgba(255,230,150,0.75)'); glow.addColorStop(1,'rgba(255,200,90,0)');
  ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(0,-H-30,90*pulse,0,7); ctx.fill();
  ctx.fillStyle='rgba(255,236,170,0.95)'; roundRect(-18,-H-46,36,38,4); ctx.fill();
  ctx.strokeStyle='#2a2430'; ctx.lineWidth=2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-H-46); ctx.lineTo(0,-H-8); ctx.stroke();
  // roof
  ctx.fillStyle='#8a3a34'; ctx.beginPath(); ctx.moveTo(-24,-H-46); ctx.lineTo(0,-H-72); ctx.lineTo(24,-H-46); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawLighthouseDoorIso(pos, clock){
  const iso = toIso(pos.x, pos.y);
  const t = clock||0;
  drawShadow(iso.x, iso.y+4, 30, 12);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle='#5a5460';
  roundRect(-20,-52,40,52,4); ctx.fill();
  ctx.strokeStyle='#221e28'; ctx.lineWidth=1.4; ctx.stroke();
  ctx.fillStyle='#0d0a12';
  roundRect(-13,-44,26,44,3); ctx.fill();
  const pulse = 0.7+Math.sin(t*3)*0.25;
  ctx.save();
  const glow = ctx.createRadialGradient(0,-58,1,0,-58,14*pulse);
  glow.addColorStop(0,'rgba(255,220,140,0.9)'); glow.addColorStop(1,'rgba(255,180,80,0)');
  ctx.fillStyle=glow;
  ctx.beginPath(); ctx.arc(0,-58,14*pulse,0,7); ctx.fill();
  ctx.restore();
  ctx.fillStyle='#e8c44a';
  ctx.beginPath(); ctx.arc(0,-58,4,0,7); ctx.fill();
  ctx.restore();
}
// Lakeside Ruins gate (v71): a crumbling stone archway, used both at
// Withered Crossroads' east gate and Lakeside Ruins' own west entrance -- same
// "one shared gate art reused at both ends of the connection" convention
// drawLighthouseDoorIso already follows for the Withered Crossroads/Lighthouse
// Tower connection.
const _gate2xSeen = new WeakSet();
function drawRuinsGateIso(pos, clock){   // v419: every zone gate is drawn twice as big
  const q = toIso(pos.x, pos.y);
  _gate2xSeen.add(pos);
  ctx.save(); ctx.translate(q.x, q.y); ctx.scale(2,2); ctx.translate(-q.x, -q.y);
  try{ drawRuinsGateIso0(pos, clock); } finally { ctx.restore(); }
}
// v456: the grand ruined temple gateway between Withered Crossroads and Lakeside Ruins
function drawLakesideGateIso(pos, clock){
  const iso = toIso(pos.x, pos.y), t = clock||0, S = 1.7;
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(S,S);
  // cracked flagstone platform + steps
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0,4,96,30,0,0,7); ctx.fill();
  for(let i=0;i<3;i++){ ctx.fillStyle = ['#4a4840','#555249','#5f5c52'][i]; ctx.beginPath(); ctx.ellipse(0,2-i*2.5,86-i*12,26-i*4,0,0,7); ctx.fill(); }
  ctx.strokeStyle = 'rgba(20,18,14,0.45)'; ctx.lineWidth = 1;
  for(const [a,b,c,d] of [[-50,-4,-20,8],[-10,-12,14,4],[24,-8,52,6],[-62,2,-40,-10],[36,10,60,-2]]){ ctx.beginPath(); ctx.moveTo(a,b); ctx.lineTo(c,d); ctx.stroke(); }
  // mist and cold light filling the doorway
  const pulse = 0.75 + 0.25*Math.sin(t*1.6);
  const mg = ctx.createLinearGradient(0,-112,0,0); mg.addColorStop(0,'rgba(120,200,190,0)'); mg.addColorStop(0.5,'rgba(120,200,190,'+(0.22*pulse).toFixed(3)+')'); mg.addColorStop(1,'rgba(170,220,210,'+(0.38*pulse).toFixed(3)+')');
  ctx.fillStyle = mg; ctx.fillRect(-34,-112,68,112);
  // fluted columns: left one whole, right one snapped off
  const column = (cx, h, broken)=>{
    ctx.fillStyle = '#3c3a33'; ctx.fillRect(cx-15,-10,30,10);                        // plinth
    ctx.fillStyle = '#58554b'; ctx.fillRect(cx-13,-16,26,7);
    const cg = ctx.createLinearGradient(cx-11,0,cx+11,0); cg.addColorStop(0,'#8a8676'); cg.addColorStop(0.5,'#6c695c'); cg.addColorStop(1,'#3f3d35');
    ctx.fillStyle = cg; ctx.strokeStyle = '#1e1c17'; ctx.lineWidth = 1.2;
    if(broken){ ctx.beginPath(); ctx.moveTo(cx-11,-16); ctx.lineTo(cx-11,-h+6); ctx.lineTo(cx-5,-h-4); ctx.lineTo(cx-1,-h+3); ctx.lineTo(cx+4,-h-7); ctx.lineTo(cx+11,-h+1); ctx.lineTo(cx+11,-16); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { ctx.fillRect(cx-11,-h,22,h-16); ctx.strokeRect(cx-11,-h,22,h-16); ctx.fillStyle = '#6a675a'; ctx.fillRect(cx-15,-h-8,30,9); ctx.strokeRect(cx-15,-h-8,30,9); }
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1;
    for(const fx of [-6,-1,4]){ ctx.beginPath(); ctx.moveTo(cx+fx,-18); ctx.lineTo(cx+fx,-h+(broken?8:2)); ctx.stroke(); }
    // moss and a glowing rune band
    ctx.fillStyle = 'rgba(64,92,46,0.9)'; ctx.beginPath(); ctx.moveTo(cx-11,-16); ctx.lineTo(cx-11,-46); ctx.quadraticCurveTo(cx-2,-38,cx+5,-52); ctx.lineTo(cx+11,-30); ctx.lineTo(cx+11,-16); ctx.closePath(); ctx.fill();
    const ra = 0.45 + 0.35*Math.sin(t*2.2 + cx);
    ctx.save(); ctx.strokeStyle = 'rgba(140,240,225,'+ra.toFixed(2)+')'; ctx.lineWidth = 1.3;
    for(let k=0;k<3;k++){ const ry = -64 - k*9; ctx.beginPath(); ctx.moveTo(cx-5,ry); ctx.lineTo(cx-1,ry-4); ctx.lineTo(cx+3,ry); ctx.lineTo(cx+6,ry-3); ctx.stroke(); }
    ctx.restore();
  };
  column(-44, 124, false);
  column(44, 86, true);
  // the architrave: still on the left capital, cracked through and slumped onto the broken column
  ctx.save(); ctx.translate(-44,-132); ctx.rotate(0.27);
  const bg = ctx.createLinearGradient(0,-8,0,14); bg.addColorStop(0,'#8a8676'); bg.addColorStop(1,'#4a473e');
  ctx.fillStyle = bg; ctx.strokeStyle = '#1e1c17'; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(-18,-6); ctx.lineTo(52,-6); ctx.lineTo(56,4); ctx.lineTo(50,14); ctx.lineTo(-18,14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(58,-4); ctx.lineTo(98,-4); ctx.lineTo(98,14); ctx.lineTo(54,14); ctx.lineTo(60,4); ctx.closePath(); ctx.fill(); ctx.stroke();
  const ra = 0.5 + 0.4*Math.sin(t*1.8);
  ctx.save(); ctx.fillStyle = 'rgba(150,245,230,'+ra.toFixed(2)+')';
  for(let k=0;k<7;k++){ const rx = -8 + k*14 + (k>3?4:0); ctx.fillRect(rx,2,2,6); ctx.fillRect(rx-2,4,6,2); }
  ctx.restore();
  // hanging chain lantern with a cold flame
  const sw = Math.sin(t*1.3)*3;
  ctx.strokeStyle = '#2a2824'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(40,14); ctx.lineTo(40+sw,40); ctx.stroke();
  ctx.fillStyle = '#2e2c26'; ctx.fillRect(36+sw,40,8,11);
  const lg = ctx.createRadialGradient(40+sw,46,1,40+sw,46,18); lg.addColorStop(0,'rgba(160,250,235,0.85)'); lg.addColorStop(1,'rgba(120,220,210,0)');
  ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(40+sw,46,18,0,7); ctx.fill();
  // ivy hanging from the beam
  ctx.strokeStyle = 'rgba(58,92,40,0.95)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for(const [vx,len] of [[-10,26],[6,14],[22,34],[70,20],[86,30]]){ const w2 = Math.sin(t*1.1+vx)*2; ctx.beginPath(); ctx.moveTo(vx,12); ctx.quadraticCurveTo(vx+w2,12+len*0.6,vx+w2*1.6,12+len); ctx.stroke(); }
  ctx.restore();
  // a fallen drum of column in front, rubble, reeds
  ctx.fillStyle = '#5c594e'; ctx.strokeStyle = '#1e1c17'; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.ellipse(66,6,20,9,0.2,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6e6b5e'; ctx.beginPath(); ctx.ellipse(80,9,8,9,0.2,0,7); ctx.fill(); ctx.stroke();
  for(const [rx,ry,rr] of [[-70,6,5],[-60,10,3.5],[30,12,4],[-24,14,3],[54,-6,3.5]]){ ctx.fillStyle = '#4a4740'; ctx.beginPath(); ctx.ellipse(rx,ry,rr,rr*0.6,0,0,7); ctx.fill(); }
  ctx.strokeStyle = '#4a5e30'; ctx.lineWidth = 1.4;
  for(const rx of [-82,-78,-74,86,90]){ ctx.beginPath(); ctx.moveTo(rx,8); ctx.quadraticCurveTo(rx+2,-6,rx+(rx<0?-3:3),-16); ctx.stroke(); }
  // drifting motes in the doorway
  for(let i=0;i<9;i++){ const ph = t*0.3 + i*0.7, mx = Math.sin(ph*1.6+i)*26, my = -((ph*22 + i*17) % 100) - 4;
    ctx.fillStyle = 'rgba(170,250,235,'+(0.2+0.3*Math.abs(Math.sin(ph*3+i))).toFixed(2)+')'; ctx.beginPath(); ctx.arc(mx,my,1.3,0,7); ctx.fill(); }
  ctx.restore();
}
// v456: ruined walls, braziers and banners flanking the sun arch on the River Valley side
function drawSunArchFlank(pos, side, clock){
  const wx = pos.x + side*170, wy = pos.y - 10;
  drawBlock({x:wx-(side<0?150:0), y:wy-10, w:150, h:18}, 30, '#8a8474', '#3e392f', '#5e584a');
  drawBlock({x:wx+(side<0?-200:150), y:wy-8, w:50, h:16}, 14, '#7a7464', '#3a352c', '#544e42');
  const io = toIso(wx-(side<0?75:-75), wy); ctx.fillStyle = 'rgba(70,110,46,0.8)'; ctx.beginPath(); ctx.ellipse(io.x, io.y-26, 22, 5, 0, 0, 7); ctx.fill();
}
function drawRuinsGateIso0(pos, clock){
  const iso = toIso(pos.x, pos.y);
  const t = clock||0;
  drawShadow(iso.x, iso.y+4, 34, 13);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle='#6b6a5e';
  roundRect(-24,-50,14,50,3); ctx.fill();
  roundRect(10,-50,14,50,3); ctx.fill();
  ctx.strokeStyle='#2e2c24'; ctx.lineWidth=1.3;
  ctx.strokeRect(-24,-50,14,50); ctx.strokeRect(10,-50,14,50);
  // a broken lintel across the top -- deliberately uneven/gapped to read
  // as ruined rather than an intact doorway
  ctx.fillStyle='#5c5b50';
  ctx.beginPath(); ctx.moveTo(-24,-50); ctx.lineTo(24,-50); ctx.lineTo(18,-40); ctx.lineTo(-4,-38); ctx.lineTo(-18,-42); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#2e2c24'; ctx.lineWidth=1; ctx.stroke();
  // a faint cold glow through the gap, echoing the lake beyond
  const pulse = 0.6+Math.sin(t*2.4)*0.2;
  ctx.save();
  const glow = ctx.createRadialGradient(0,-24,1,0,-24,16*pulse);
  glow.addColorStop(0,'rgba(140,220,210,0.35)'); glow.addColorStop(1,'rgba(140,220,210,0)');
  ctx.fillStyle=glow;
  ctx.beginPath(); ctx.ellipse(0,-24,16*pulse,20*pulse,0,0,7); ctx.fill();
  ctx.restore();
  ctx.restore();
}
// Lighthouse Tower rooftop centerpiece (v70): a tall stone plinth topped by
// a big beacon lamp, with a slowly rotating pair of light beams and a
// pulsing glowing core -- the "big light feature object" the rooftop's
// boss floor is built around, and the tower's namesake landmark. Modeled
// loosely on the Mine-stairway/Blacksmith-forge landmark pattern (a fixed
// static prop, animated purely via clock-driven sin/rotate).
// v94 (quest feature): now takes an `on` flag -- off (the default state on
// first arrival at floor 5, p.lighthouseBeaconOn false) skips the rotating
// beams and the glow entirely and paints the lamp housing a plain dead
// grey, so it clearly reads as unlit; on (after turnOnBeacon()) is the
// exact original always-lit look this function used to have unconditionally.
function drawLighthouseBeaconIso(pos, clock, on){
  const iso = toIso(pos.x, pos.y);
  const t = clock||0;
  drawShadow(iso.x, iso.y+6, 52, 20);
  ctx.save(); ctx.translate(iso.x, iso.y);
  const plinthGrad = ctx.createLinearGradient(-40,-24,40,4);
  plinthGrad.addColorStop(0,'#6a6270'); plinthGrad.addColorStop(1,'#302a38');
  ctx.fillStyle = plinthGrad;
  ctx.beginPath(); ctx.ellipse(0,-4,42,20,0,0,7); ctx.fill();
  ctx.strokeStyle='#1c1822'; ctx.lineWidth=1.6; ctx.stroke();
  ctx.fillStyle='#403a48';
  ctx.beginPath(); ctx.ellipse(0,-14,30,15,0,0,7); ctx.fill();
  const poleH = 96;
  ctx.fillStyle='#4a4250';
  roundRect(-6,-14-poleH,12,poleH,3); ctx.fill();
  ctx.strokeStyle='#1c1822'; ctx.lineWidth=1.2; ctx.strokeRect(-6,-14-poleH,12,poleH);
  const lampY = -14-poleH;
  if(on){
    // slowly rotating beam pair, sweeping like a real lighthouse
    ctx.save();
    ctx.translate(0, lampY);
    ctx.rotate(t*0.6);
    const beamGrad = ctx.createLinearGradient(-160,0,160,0);
    beamGrad.addColorStop(0,'rgba(255,230,160,0)'); beamGrad.addColorStop(0.5,'rgba(255,230,160,0.22)'); beamGrad.addColorStop(1,'rgba(255,230,160,0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-170,-26); ctx.lineTo(-170,26); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(170,-26); ctx.lineTo(170,26); ctx.closePath(); ctx.fill();
    ctx.restore();
    const pulse = 1+Math.sin(t*3)*0.15;
    const glowGrad = ctx.createRadialGradient(0,lampY,2,0,lampY,34*pulse);
    glowGrad.addColorStop(0,'rgba(255,244,210,0.95)'); glowGrad.addColorStop(0.4,'rgba(255,210,120,0.5)'); glowGrad.addColorStop(1,'rgba(255,180,80,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath(); ctx.arc(0,lampY,34*pulse,0,7); ctx.fill();
  }
  ctx.fillStyle= on ? '#3a3440' : '#28242c';
  roundRect(-13,lampY-9,26,18,4); ctx.fill();
  ctx.strokeStyle='#1c1822'; ctx.lineWidth=1.2; ctx.stroke();
  ctx.fillStyle= on ? '#fff6dc' : '#5a5460';
  ctx.beginPath(); ctx.arc(0,lampY,7,0,7); ctx.fill();
  ctx.restore();
}
function drawGateIso(gate, label, style){
  const wood = style==='wood';
  const iso = toIso(gate.x, gate.y);
  drawShadow(iso.x, iso.y, 20, 9);
  ctx.save(); ctx.translate(iso.x, iso.y);
  const pillarGrad = ctx.createLinearGradient(0,-64,0,4);
  if(wood){ pillarGrad.addColorStop(0,'#7a5636'); pillarGrad.addColorStop(1,'#3a2818'); }
  else { pillarGrad.addColorStop(0,'#4a4048'); pillarGrad.addColorStop(1,'#241c22'); }
  ctx.fillStyle = pillarGrad;
  ctx.fillRect(-22,-64,8,68);
  ctx.fillRect(14,-64,8,68);
  ctx.strokeStyle='#141014'; ctx.lineWidth=1.2;
  ctx.strokeRect(-22,-64,8,68); ctx.strokeRect(14,-64,8,68);
  // arch
  ctx.beginPath();
  ctx.moveTo(-22,-64); ctx.quadraticCurveTo(0,-92, 22,-64);
  ctx.lineTo(14,-64); ctx.quadraticCurveTo(0,-80,-14,-64);
  ctx.closePath();
  ctx.fillStyle = wood ? '#5a3e26' : '#3a3038'; ctx.fill(); ctx.stroke();
  if(wood){
    // simple crossbeam planks instead of torches for a plain wooden gate
    ctx.strokeStyle='#2a1c10'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(-22,-40); ctx.lineTo(22,-40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-22,-16); ctx.lineTo(22,-16); ctx.stroke();
  } else {
    // torches
    for(const side of [-1,1]){
      ctx.save(); ctx.translate(side*18, -68);
      ctx.fillStyle = '#e2703a';
      ctx.beginPath(); ctx.arc(0,0,4+Math.sin(Date.now()/90+side)*1.2,0,7); ctx.fill();
      ctx.fillStyle='rgba(226,112,58,0.35)';
      ctx.beginPath(); ctx.arc(0,0,9,0,7); ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
  // label
  ctx.save();
  ctx.font = "bold 13px Cinzel, Georgia, 'Times New Roman', serif";
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8c44a';
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
  ctx.fillText(label||'MINE', iso.x, iso.y-96);
  ctx.restore();
}
// A simple bed prop for the Tavern's upstairs room -- a low wooden frame
// block (reusing drawBlock, same as the bar counter) topped with a
// blanket/pillow, purely decorative furniture.
function drawBedIso(bed){
  drawBlock(bed, 16, '#5a4632','#2e2216','#3a2c1c');
  const c0 = toIso(bed.x+bed.w*0.15, bed.y+bed.h*0.2);
  ctx.save();
  ctx.fillStyle = '#8a3a3a';
  ctx.beginPath(); ctx.ellipse(c0.x, c0.y-19, bed.w*0.55, bed.h*0.5, 0, 0, 7); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath(); ctx.ellipse(c0.x-bed.w*0.32, c0.y-20, bed.w*0.2, bed.h*0.28, 0, 0, 7); ctx.fill();
  ctx.restore();
}
// A small tavern table -- same drawBlock-based prop pattern as
// drawBedIso/the bar counter, just a flat plain wood top with no extra
// decoration on top (kept simple/decorative per the brief).
function drawTableIso(table){
  drawBlock(table, 18, '#7a5a38','#3a2a18','#4a3420');
}
function drawChestIso(chest){
  const iso = toIso(chest.x,chest.y);
  drawShadow(iso.x, iso.y, 14, 7);
  ctx.save(); ctx.translate(iso.x, iso.y-6);
  const bodyGrad = ctx.createLinearGradient(-14,-6,14,8);
  if(chest.opened){ bodyGrad.addColorStop(0,'#5a4326'); bodyGrad.addColorStop(1,'#2e2113'); }
  else { bodyGrad.addColorStop(0,'#8a6a38'); bodyGrad.addColorStop(1,'#5a4326'); }
  ctx.fillStyle = bodyGrad;
  roundRect(-14,-6,28,14,3); ctx.fill();
  ctx.strokeStyle='#231a0e'; ctx.lineWidth=1.4; ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(-14,1); ctx.lineTo(14,1); ctx.stroke();

  ctx.save();
  if(chest.opened){ ctx.translate(-14,-6); ctx.rotate(-1.9); }
  else { ctx.translate(-14,-6); }
  const lidGrad = ctx.createLinearGradient(0,-10,28,0);
  if(chest.opened){ lidGrad.addColorStop(0,'#3a2c18'); lidGrad.addColorStop(1,'#231a0e'); }
  else { lidGrad.addColorStop(0,'#d9b25c'); lidGrad.addColorStop(1,'#a8863a'); }
  ctx.fillStyle = lidGrad;
  roundRect(0,-10,28,10,3); ctx.fill();
  ctx.strokeStyle='#231a0e'; ctx.lineWidth=1.2; ctx.stroke();
  ctx.restore();

  if(!chest.opened){
    ctx.save();
    ctx.shadowColor='#ffe27a'; ctx.shadowBlur=6;
    ctx.fillStyle='#ffe27a';
    ctx.beginPath(); ctx.arc(0,-2,3,0,7); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
// v546: small potion bottle lying on the ground (round flask, neck, cork, glass shine)
function drawGroundPotion(col, clock){
  ctx.save();
  ctx.shadowColor = col; ctx.shadowBlur = 6 + Math.sin(clock*4)*2;
  ctx.fillStyle = 'rgba(210,225,235,0.55)'; ctx.fillRect(-2.5,-11,5,5);
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0,0,6.5,0,7); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(1.5,1.5,5,0,7); ctx.fill();
  ctx.strokeStyle = 'rgba(230,240,250,0.8)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(0,0,6.5,0,7); ctx.stroke();
  ctx.strokeRect(-2.5,-11,5,5);
  ctx.fillStyle = '#8a5a30'; ctx.fillRect(-2,-14,4,3.5);
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(-2.4,-2.2,1.4,2.4,-0.5,0,7); ctx.fill();
  ctx.restore();
}
function drawLootIso(l, clock){
  const iso = toIso(l.x,l.y);
  const bounce = Math.sin(clock*4 + l.x*0.1)*2;
  drawShadow(iso.x, iso.y, 9, 4.5);
  ctx.save(); ctx.translate(iso.x, iso.y - 6 + bounce);
  if(l.type==='potion'){
    ctx.fillStyle='#e0455f'; roundRect(-4,-7,8,12,2); ctx.fill();
    ctx.fillStyle='#7a2030'; ctx.fillRect(-2,-9,4,3);
  } else if(l.type==='item' && l.item && l.item.slotType==='potion'){
    drawGroundPotion(l.item.color||'#e2384f', clock);   // v546: a little bottle, not a gem
  } else if(l.type==='item'){
    const glow = 0.5+Math.sin(clock*5)*0.25;
    ctx.save();
    ctx.shadowColor = l.item.color; ctx.shadowBlur = 8+glow*4;
    ctx.fillStyle = l.item.color;
    ctx.beginPath(); ctx.moveTo(0,-9); ctx.lineTo(6,0); ctx.lineTo(0,9); ctx.lineTo(-6,0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=1; ctx.stroke();
    ctx.restore();
  } else if(l.deathCoin){
    // big glowing coin marking where you died
    const pulse = 0.5+0.5*Math.sin(clock*3);
    ctx.save(); ctx.translate(0,-14);
    const gl = ctx.createRadialGradient(0,0,4,0,0,46); gl.addColorStop(0,'rgba(255,220,90,'+(0.35+0.25*pulse)+')'); gl.addColorStop(1,'rgba(255,200,60,0)');
    ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(0,0,46,0,7); ctx.fill();
    ctx.scale(Math.abs(Math.cos(clock*1.6))*0.6+0.4, 1);
    const cg = ctx.createLinearGradient(-16,-16,16,16); cg.addColorStop(0,'#fff3a8'); cg.addColorStop(0.5,'#f0c030'); cg.addColorStop(1,'#a8781a');
    ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(0,0,16,0,7); ctx.fill();
    ctx.strokeStyle='#6a4a10'; ctx.lineWidth=2.5; ctx.stroke();
    ctx.strokeStyle='rgba(120,80,10,0.8)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(0,0,10.5,0,7); ctx.stroke();
    ctx.fillStyle='#7a5410'; ctx.font='bold 13px Alegreya,Georgia,serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('$',0,1);
    ctx.restore();
  } else {
    ctx.fillStyle='#e8c44a';
    ctx.beginPath(); ctx.arc(0,-3,6,0,7); ctx.fill();
    ctx.strokeStyle='#a8863a'; ctx.lineWidth=1.2; ctx.stroke();
  }
  ctx.restore();
}
// v536: a small "OPEN" board hanging under the tavern sign once the tavern is open again
function drawOpenPlaqueIso(pos, clock){
  const iso = toIso(pos.x, pos.y), sw = Math.sin((clock||0)*1.6)*0.05;
  ctx.save(); ctx.translate(iso.x, iso.y-30); ctx.rotate(sw);
  ctx.strokeStyle = '#2a2016'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-12, 7); ctx.moveTo(14, 0); ctx.lineTo(12, 7); ctx.stroke();
  const g = ctx.createLinearGradient(0, 7, 0, 25); g.addColorStop(0, '#7a5634'); g.addColorStop(1, '#4e3420');
  ctx.fillStyle = g; roundRect(-22, 7, 44, 18, 3); ctx.fill(); ctx.strokeStyle = '#1e150c'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.font = "bold 11px Cinzel, Georgia, 'Times New Roman', serif"; ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(255,200,90,0.9)'; ctx.shadowBlur = 6; ctx.fillStyle = '#ffd77a'; ctx.fillText('OPEN', 0, 20);
  ctx.restore();
}
