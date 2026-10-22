// ---- v250: dedicated undead rig for Skeleton / Skeleton Archer / Skeletal Brute (no more horned demon body) ----
// v329: Zombies -- hunched, arms stretched straight out in front, shambling. One rig, three looks:
//   'zombie' = sickly green poison zombie, 'frozenzombie' = frost-rimed cold charger, drowned = waterlogged lake dweller (ruins event / Black Marsh)
function drawZombieEnemy(e){
  const iso = toIso(e.x,e.y), face = e.faceSign||1, t = e.animT||0;
  const moving = e.moving, atk = e.atkAnimT||0, flash = e.hitT>0;
  const kind = e.type==='frozenzombie' ? 'frozen' : (e.ruinsZ || e.drowned || (game && game.scene==='blackmarsh')) ? 'drowned' : 'poison';
  const PAL = {
    poison:  {skin:'#86a252', shade:'#4c612b', cloth:'#6a5236', clothD:'#33271a', eye:'#e2f56a', acc:'#a6d63a'},
    frozen:  {skin:'#bfe0ea', shade:'#6c98ab', cloth:'#55656f', clothD:'#27343d', eye:'#c4f6ff', acc:'#eaffff'},
    drowned: {skin:'#78a39b', shade:'#3d6360', cloth:'#35514a', clothD:'#18302b', eye:'#b4f4ec', acc:'#7fd0ff'},
  }[kind];
  const DARK = flash ? '#fff' : '#12100c';
  const SK = flash ? '#fff' : PAL.skin, SH = flash ? '#fff' : PAL.shade, CL = flash ? '#fff' : PAL.cloth, CD = flash ? '#fff' : PAL.clothD;
  const s = e.r/16*1.3, legLen = 13, torsoH = 17, torsoW = 12.5, headR = 6.4;   // v452: zombies stand ~90% of the player's height
  drawShadow(iso.x, iso.y, (torsoW+9)*s*0.9, torsoW*0.4*s);
  ctx.save();
  ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const walk = moving ? Math.sin(t*7.5) : 0;                               // slow, heavy shamble
  const bob = moving ? Math.abs(Math.sin(t*7.5))*1.4 : Math.sin(t*1.7)*0.7;
  const thrust = atk>0 ? clamp(atk/0.25,0,1) : 0;                         // arms lunge forward on a swing
  const lean = 0.2 + 0.06*thrust + (moving ? 0.04 : 0);
  const hipY = -legLen + bob;
  const L = (x1,y1,x2,y2,w,col)=>{
    ctx.strokeStyle = DARK; ctx.lineWidth = w+1.5; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  };
  // shoulder + head positions follow the forward lean
  const shX = Math.sin(lean)*torsoH + 1.5, shY = hipY - Math.cos(lean)*torsoH + 2.5;
  const hdX = Math.sin(lean)*(torsoH+headR*0.9) + 3.5, hdY = hipY - Math.cos(lean)*(torsoH+headR*0.9) + 1;
  // arm: both stretched out ahead, hands hanging limp at the end
  const arm = (back)=>{
    const ph = back ? 1.6 : 0, sway = Math.sin(t*(moving?7.5:2.2)+ph)*(moving?1.4:0.8);
    const lift = -1.2 - thrust*3.5 + sway, reach = 11.5 + thrust*6;
    const sx = shX - (back?3:0), sy = shY + (back?1.4:0);
    const ex = sx + reach*0.52, ey = sy + 1.4 + sway*0.6;
    const hx = ex + reach*0.56, hy = ey + lift*0.4 + 1.2;
    const col = back ? SH : SK;
    L(sx, sy, ex, ey, 3.5, back ? SH : CL);          // sleeve (upper arm)
    L(ex, ey, hx, hy, 3.0, col);                      // bare forearm
    // ragged cuff + hand with hooked fingers
    ctx.fillStyle = back ? CD : CL; ctx.beginPath(); ctx.moveTo(ex-2,ey-2); ctx.lineTo(ex+2.5,ey-1.5); ctx.lineTo(ex+1,ey+3.8); ctx.lineTo(ex-1,ey+2); ctx.lineTo(ex-3,ey+3.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col; ctx.strokeStyle = DARK; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(hx+0.5, hy, 2.3, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = flash ? '#fff' : (kind==='frozen' ? '#d8f4fb' : '#2a2a1c'); ctx.lineWidth = 1;
    for(let f=-1;f<=1;f++){ ctx.beginPath(); ctx.moveTo(hx+1.8, hy+f*1.2); ctx.lineTo(hx+4.8, hy+f*1.7+1.1); ctx.stroke(); }
    if(!back && !flash){
      if(kind==='frozen'){ ctx.fillStyle='rgba(226,250,255,0.9)'; for(const [ix,iy,il] of [[ex+1,ey+2.5,4.5],[ex+5,ey+2,3.2],[hx-3,hy+2.4,3.8]]){ ctx.beginPath(); ctx.moveTo(ix-1,iy); ctx.lineTo(ix+1,iy); ctx.lineTo(ix,iy+il); ctx.closePath(); ctx.fill(); } }
      if(kind==='drowned'){ ctx.strokeStyle='#2f6a3a'; ctx.lineWidth=1.3; ctx.beginPath(); ctx.moveTo(ex+1,ey+2); ctx.quadraticCurveTo(ex-1+sway,ey+7,ex+2,ey+11); ctx.moveTo(ex+4,ey+2); ctx.quadraticCurveTo(ex+5-sway,ey+6,ex+3,ey+9); ctx.stroke(); }
      if(kind==='poison'){ ctx.fillStyle='rgba(166,214,58,0.9)'; const dr = (t*1.6)%1; ctx.beginPath(); ctx.arc(hx+1, hy+3+dr*7, 1.1*(1-dr*0.5), 0, 7); ctx.fill(); }
    }
  };
  arm(true);
  // legs: stiff, dragging
  for(const sd of [-1,1]){
    const ph = sd*walk, hx = sd*torsoW*0.2 + 1, fx = hx + ph*4.6, fy = moving ? -Math.max(0,ph)*2.2 : 0;
    const kx = (hx+fx)/2 + 1.6, ky = (hipY+fy)/2 + 0.6;
    L(hx, hipY, kx, ky, 3.7, sd<0 ? CD : CL); L(kx, ky, fx, fy-1, 3.1, sd<0 ? CD : CL);
    ctx.fillStyle = flash ? '#fff' : '#2a2018'; ctx.strokeStyle = DARK; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.ellipse(fx+1.8, fy-0.4, 3.6, 1.7, 0, 0, 7); ctx.fill(); ctx.stroke();
    if(kind==='poison' || sd>0){ ctx.fillStyle = SK; ctx.fillRect(kx-1, ky+0.5, 2.2, 2.4); }   // bare shin showing through the rags
  }
  // torso (leaning)
  ctx.save(); ctx.translate(1, hipY); ctx.rotate(lean);
  const tg = ctx.createLinearGradient(-torsoW/2,-torsoH,torsoW/2,0); tg.addColorStop(0, flash ? '#fff' : CL); tg.addColorStop(1, flash ? '#fff' : CD);
  ctx.fillStyle = tg; ctx.strokeStyle = DARK; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-torsoW*0.5,-torsoH); ctx.lineTo(torsoW*0.5,-torsoH+0.5); ctx.lineTo(torsoW*0.46,-2);
  ctx.lineTo(torsoW*0.3,1.5); ctx.lineTo(torsoW*0.1,-1.5); ctx.lineTo(-torsoW*0.1,2.2); ctx.lineTo(-torsoW*0.3,-0.5); ctx.lineTo(-torsoW*0.48,1.2); ctx.closePath(); ctx.fill(); ctx.stroke();
  if(!flash){
    // torn-open chest: skin + ribs showing
    ctx.fillStyle = SK; ctx.beginPath(); ctx.moveTo(-1,-torsoH+3); ctx.lineTo(torsoW*0.32,-torsoH+5); ctx.lineTo(torsoW*0.22,-torsoH*0.45); ctx.lineTo(-2.5,-torsoH*0.55); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = SH; ctx.lineWidth = 1; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-1.5,-torsoH+6+i*3.2); ctx.quadraticCurveTo(torsoW*0.12,-torsoH+8+i*3.2,torsoW*0.3,-torsoH+6+i*3.2); ctx.stroke(); }
    if(kind==='frozen'){ ctx.strokeStyle='rgba(196,246,255,0.9)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-torsoW*0.3,-torsoH+1); ctx.lineTo(-torsoW*0.12,-torsoH*0.62); ctx.lineTo(-torsoW*0.26,-torsoH*0.3); ctx.stroke();
      ctx.fillStyle='rgba(234,255,255,0.95)'; for(const [fx2,fy2,fh] of [[-torsoW*0.45,-torsoH-1,5],[-torsoW*0.1,-torsoH-0.5,4]]){ ctx.beginPath(); ctx.moveTo(fx2-2,fy2+1); ctx.lineTo(fx2,fy2-fh); ctx.lineTo(fx2+2,fy2+1); ctx.closePath(); ctx.fill(); } }
    if(kind==='drowned'){ ctx.strokeStyle='#2f6a3a'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(-torsoW*0.4,-torsoH); ctx.quadraticCurveTo(-torsoW*0.7+Math.sin(t*3),-torsoH*0.5,-torsoW*0.4,1); ctx.moveTo(torsoW*0.1,-torsoH+1); ctx.quadraticCurveTo(torsoW*0.3,-torsoH*0.5,torsoW*0.15,-1); ctx.stroke(); }
    if(kind==='poison'){ ctx.fillStyle = PAL.acc; for(const [px,py] of [[torsoW*0.15,-torsoH*0.7],[-torsoW*0.3,-torsoH*0.35],[torsoW*0.3,-torsoH*0.3]]){ ctx.beginPath(); ctx.arc(px,py,1.3,0,7); ctx.fill(); } }
    // belt rope
    ctx.strokeStyle = '#4a3a22'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-torsoW*0.47,-3.5); ctx.lineTo(torsoW*0.47,-3.5); ctx.stroke();
  }
  ctx.restore();
  // head: drooped forward, slack jaw, patchy hair
  const droop = 0.25 + (moving ? 0.05*Math.sin(t*7.5) : 0.04*Math.sin(t*1.7));
  ctx.save(); ctx.translate(hdX, hdY); ctx.rotate(droop);
  const hg = ctx.createRadialGradient(-headR*0.3,-headR*0.35,1,0,0,headR*1.3); hg.addColorStop(0, flash ? '#fff' : SK); hg.addColorStop(1, flash ? '#fff' : SH);
  // jaw hanging open
  ctx.fillStyle = flash ? '#fff' : SH; ctx.strokeStyle = DARK; ctx.lineWidth = 1;
  const jaw = 1.4 + (thrust>0 ? 2.6*thrust : 0.7*Math.abs(Math.sin(t*1.7)));
  ctx.beginPath(); ctx.ellipse(headR*0.2, headR*0.78+jaw, headR*0.62, headR*0.36, 0.1, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = flash ? '#fff' : '#2a0e0e'; ctx.beginPath(); ctx.ellipse(headR*0.18, headR*0.55+jaw*0.5, headR*0.44, headR*0.3+jaw*0.3, 0, 0, 7); ctx.fill();
  ctx.fillStyle = hg; ctx.strokeStyle = DARK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0,0,headR,headR*1.04,0,0,7); ctx.fill(); ctx.stroke();
  if(!flash){
    // hair scraps / frost cap / weed
    if(kind==='frozen'){ ctx.fillStyle='rgba(234,255,255,0.95)'; ctx.beginPath(); ctx.arc(-headR*0.15,-headR*0.25,headR*0.98,Math.PI*1.05,Math.PI*1.95); ctx.lineTo(headR*0.6,-headR*0.45); ctx.closePath(); ctx.fill(); }
    else if(kind==='drowned'){ ctx.strokeStyle='#2f6a3a'; ctx.lineWidth=1.6; for(const dx of [-0.5,0,0.45]){ ctx.beginPath(); ctx.moveTo(headR*dx,-headR*0.9); ctx.quadraticCurveTo(headR*dx-2+Math.sin(t*2+dx*5)*1.2,-headR*0.2,headR*dx-1.5,headR*0.9); ctx.stroke(); } }
    else { ctx.strokeStyle='#2c2416'; ctx.lineWidth=1.2; for(const dx of [-0.55,-0.15,0.3]){ ctx.beginPath(); ctx.moveTo(headR*dx,-headR*0.95); ctx.lineTo(headR*dx-1.5,-headR*0.45); ctx.stroke(); } }
    // sunken, glowing eyes
    ctx.fillStyle = '#0c0a08'; for(const [ex2,er] of [[-headR*0.15,headR*0.3],[headR*0.5,headR*0.26]]){ ctx.beginPath(); ctx.ellipse(ex2,-headR*0.05,er,er*1.15,0,0,7); ctx.fill(); }
    ctx.save(); ctx.shadowColor = PAL.eye; ctx.shadowBlur = 4; ctx.fillStyle = PAL.eye;
    for(const ex2 of [-headR*0.15, headR*0.5]){ ctx.beginPath(); ctx.arc(ex2+0.5,-headR*0.03,1.25,0,7); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
  e._eye = {x:iso.x + hdX*face*s, y:iso.y + (hdY)*s, dx:headR*0.3*s, r:Math.max(1.4,1.4*s), c:PAL.eye};
  arm(false);
  // drowned: drips falling off the body
  if(kind==='drowned' && !flash){
    ctx.fillStyle = 'rgba(127,208,255,0.85)';
    for(let i=0;i<3;i++){ const ph = (t*1.3 + i*0.37)%1; ctx.beginPath(); ctx.ellipse(-2+i*5, hipY-torsoH*0.5+ph*(torsoH*0.9+legLen*0.5), 0.9, 1.5, 0, 0, 7); ctx.fill(); }
  }
  if(kind==='frozen' && !flash && moving){ ctx.fillStyle='rgba(226,250,255,0.5)'; for(let i=0;i<2;i++){ const ph=(t*1.1+i*0.5)%1; ctx.beginPath(); ctx.arc(hdX+5+ph*8, hdY+2-ph*5, 1.4*(1-ph), 0, 7); ctx.fill(); } }
  ctx.restore();
  drawHpBar(iso, (legLen+torsoH+headR*2)*s+8, e.r, e.hp, e.maxHp);
}
function drawSkeletonEnemyRaw(e){
  const iso = toIso(e.x,e.y), kind = e.type, face = e.faceSign||1, t = e.animT||0;
  const moving = e.moving, atk = e.atkAnimT||0, flash = e.hitT>0;
  const isArcher = kind==='skeletonarcher', isBrute = kind==='skeletonbrute';
  const KS = isBrute && !!(game && game.room && game.room.subzone==='keep');   // v452: the black-and-red brute is Shadow Keep only
  const P = isBrute ? (KS ? {s:e.r/16*1.25*1.15, legLen:16, torsoH:23, torsoW:19, headR:8.5, bone:'#3a2d31', shade:'#1c1316', dark:'#050102'} : {s:e.r/16*1.25*1.15, legLen:16, torsoH:23, torsoW:19, headR:8.5, bone:'#e2dcc4', shade:'#b8ac90', dark:'#3a3428'})
          : isArcher ? {s:e.r/16*1.05*1.25, legLen:13, torsoH:15, torsoW:12, headR:6, bone:'#d6d5b6', shade:'#8c9074', dark:'#262a1e'}
          : {s:e.r/16*1.10, legLen:14, torsoH:17, torsoW:14, headR:7, bone:'#ebe4cf', shade:'#a39982', dark:'#352f25'};
  if(e.mini) P.s *= 0.72;
  const s = P.s, legLen = P.legLen, torsoH = P.torsoH, torsoW = P.torsoW, headR = P.headR;
  const BONE = flash ? '#ffffff' : P.bone, SHADE = flash ? '#ffffff' : P.shade, DARK = flash ? '#ffffff' : P.dark;
  const eyeC = KS ? '#ff3020' : '#3ad4ff';
  drawShadow(iso.x, iso.y, (torsoW+8)*s*0.9, torsoW*0.38*s);
  ctx.save();
  ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const cyc = isBrute ? 7 : 10;
  const walk = moving ? Math.sin(t*cyc) : 0;
  const bob = moving ? Math.abs(Math.sin(t*cyc))*1.6 : Math.sin(t*2.2)*0.8;
  const hipY = -legLen + bob;
  const shY = hipY - torsoH*0.92, R = torsoW*0.5;
  const B = (x1,y1,x2,y2,w,col)=>{
    ctx.strokeStyle = DARK; ctx.lineWidth = w+1.6; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    ctx.strokeStyle = col||BONE; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  };
  const J = (x,y,r)=>{ ctx.fillStyle = BONE; ctx.strokeStyle = DARK; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill(); ctx.stroke(); };
  const limbW = isBrute ? 3.4 : 2.6;
  const swing = atk>0 ? clamp(atk/0.25,0,1) : 0;

  // tattered cloak behind an archer + quiver
  if(isArcher){
    ctx.fillStyle = flash ? '#fff' : '#3a4430'; ctx.strokeStyle = DARK; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(-R-1, shY); ctx.lineTo(R+1, shY);
    ctx.lineTo(R+3, hipY+4); ctx.lineTo(R-1, hipY+8); ctx.lineTo(R-3, hipY+3); ctx.lineTo(0, hipY+9); ctx.lineTo(-R+3, hipY+3); ctx.lineTo(-R-1, hipY+8); ctx.lineTo(-R-3, hipY+4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : '#5a3f26'; roundRect(-R-3.5, shY-1, 4.5, torsoH*0.6, 1.6); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = flash ? '#fff' : '#d8d0b0'; ctx.lineWidth = 1;
    for(const ax of [-R-2.8,-R-1.6,-R-0.4]){ ctx.beginPath(); ctx.moveTo(ax, shY-1); ctx.lineTo(ax-0.6, shY-5); ctx.stroke(); }
  }
  // legs (back leg first)
  for(const sd of [-1,1]){
    const ph = sd*walk, hx = sd*torsoW*0.24, fx = hx + ph*5, fy = moving ? -Math.max(0,ph)*2.6 : 0;
    const kx = (hx+fx)/2 + 2.4, ky = (hipY+fy)/2;
    B(hx, hipY, kx, ky, limbW); B(kx, ky, fx, fy, limbW*0.85); B(fx, fy, fx+3.6, fy, limbW*0.7);
    J(kx, ky, limbW*0.62);
  }
  // pelvis
  ctx.fillStyle = BONE; ctx.strokeStyle = DARK; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(0, hipY-1, torsoW*0.4, 3.4, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = DARK; ctx.beginPath(); ctx.ellipse(0, hipY-0.5, 1.6, 1.1, 0, 0, 7); ctx.fill();
  // rib cavity, ribs, spine
  const cy = hipY - torsoH*0.56;
  ctx.fillStyle = flash ? '#fff' : '#120e0a'; ctx.strokeStyle = DARK; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(0, cy, torsoW*0.46, torsoH*0.4, 0, 0, 7); ctx.fill();
  for(let i=0;i<4;i++){
    const ry = hipY - torsoH*(0.34+i*0.15), w = torsoW*(0.44 - Math.abs(i-1.4)*0.04);
    ctx.strokeStyle = DARK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-w, ry); ctx.quadraticCurveTo(0, ry+2.6, w, ry); ctx.stroke();
    ctx.strokeStyle = BONE; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-w, ry); ctx.quadraticCurveTo(0, ry+2.6, w, ry); ctx.stroke();
  }
  for(let i=0;i<6;i++){ J(0, hipY-2 - i*(torsoH*0.9-2)/5, 1.35); }
  ctx.strokeStyle = DARK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-torsoW*0.46, cy-torsoH*0.1); ctx.quadraticCurveTo(-torsoW*0.5, cy+torsoH*0.1, -torsoW*0.3, cy+torsoH*0.38); ctx.stroke();
  // brute: belt + rusted chest plate scrap
  if(isBrute){
    ctx.fillStyle = flash ? '#fff' : '#4a3626'; ctx.strokeStyle = DARK; ctx.lineWidth = 1;
    ctx.fillRect(-torsoW*0.42, hipY-torsoH*0.2, torsoW*0.84, 3.2); ctx.strokeRect(-torsoW*0.42, hipY-torsoH*0.2, torsoW*0.84, 3.2);
    ctx.fillStyle = flash ? '#fff' : (KS ? '#6a1a1a' : '#8a7a5a'); ctx.beginPath(); ctx.arc(0, hipY-torsoH*0.2+1.6, 2.3, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : (KS ? '#5a1418' : '#5e5244');
    ctx.beginPath(); ctx.moveTo(-torsoW*0.4, hipY-torsoH*0.5); ctx.lineTo(torsoW*0.4, hipY-torsoH*0.55); ctx.lineTo(torsoW*0.3, hipY-torsoH*0.8); ctx.lineTo(-torsoW*0.3, hipY-torsoH*0.78); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = flash ? '#fff' : '#8f4a2a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-torsoW*0.2, hipY-torsoH*0.62); ctx.lineTo(torsoW*0.1, hipY-torsoH*0.7); ctx.stroke();
  } else if(!isArcher){
    ctx.fillStyle = flash ? '#fff' : '#5a4630'; ctx.strokeStyle = DARK; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-3, hipY); ctx.lineTo(5, hipY); ctx.lineTo(4, hipY+7+walk); ctx.lineTo(1, hipY+5); ctx.lineTo(-2, hipY+8-walk); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // clavicles + neck
  B(-R, shY, R, shY, 2.2);
  const hy = shY - headR*0.95;
  B(0, shY, 0, hy+headR*0.55, 1.8);

  // back arm (left) -- shield (skeleton), bare fist (brute), idle (archer)
  {
    const hx = -R - 3 - walk*2, hyd = shY + torsoH*0.58, ex = -R - 2.4, ey = shY + torsoH*0.28;
    B(-R, shY, ex, ey, limbW*0.9); B(ex, ey, hx, hyd, limbW*0.8); J(ex, ey, limbW*0.55); J(hx, hyd, limbW*0.6);
    if(kind==='skeleton'){
      ctx.fillStyle = flash ? '#fff' : '#6b4a2a'; ctx.strokeStyle = DARK; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.arc(hx-1.5, hyd-3.5, 6.4, 0.25, 6.0); ctx.lineTo(hx-1.5, hyd-3.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = flash ? '#fff' : '#6a1a1a'; ctx.beginPath(); ctx.arc(hx-1.5, hyd-3.5, 1.9, 0, 7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = flash ? '#fff' : '#3a2814'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(hx-5, hyd-6); ctx.lineTo(hx+2, hyd-1); ctx.stroke();
    }
  }
  // right (weapon) arm
  {
    const dir = (a)=>({x:Math.sin(a), y:-Math.cos(a)});
    if(isArcher){
      const hx = R + 8 + swing*1.5, hyd = shY + 4, ex = R + 4, ey = shY + 5;
      B(R, shY, ex, ey, limbW*0.9); B(ex, ey, hx, hyd, limbW*0.8); J(hx, hyd, limbW*0.6);
      ctx.strokeStyle = flash ? '#fff' : '#5a3f26'; ctx.lineWidth = 1.9; ctx.beginPath(); ctx.arc(hx-4.5, hyd, 9, -1.15, 1.15); ctx.stroke();
      const bx = hx-4.5+9*Math.cos(1.15), by1 = hyd-9*Math.sin(1.15), by2 = hyd+9*Math.sin(1.15);
      ctx.strokeStyle = flash ? '#fff' : '#d8d0b0'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(bx, by1); ctx.lineTo(bx-(swing>0?4:0)-0.5, hyd); ctx.lineTo(bx, by2); ctx.stroke();
      if(swing>0){ ctx.strokeStyle = flash ? '#fff' : '#cfc8a8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx-4, hyd); ctx.lineTo(hx+7, hyd); ctx.stroke(); }
    } else if(isBrute){
      const a = atk>0 ? (2.3 - swing*3.0) : (0.35 + walk*0.08), d = dir(a);
      const gx = R + 3, gy = shY + torsoH*0.42;
      const hx2 = gx + d.x*7, hy2 = gy + d.y*7;
      // haft + axe head
      const tx = gx + d.x*30, ty = gy + d.y*30, bxp = gx - d.x*6, byp = gy - d.y*6;
      B(bxp, byp, tx, ty, 2.4, flash?'#fff':'#5a4028');
      const px = -d.y, py = d.x;
      ctx.fillStyle = flash ? '#fff' : (KS ? '#7a2020' : '#8a8c94'); ctx.strokeStyle = DARK; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tx - d.x*2, ty - d.y*2);
      ctx.quadraticCurveTo(tx + px*13 + d.x*3, ty + py*13 + d.y*3, tx + px*5 + d.x*11, ty + py*5 + d.y*11);
      ctx.lineTo(tx + d.x*5, ty + d.y*5);
      ctx.lineTo(tx - px*3 + d.x*2, ty - py*3 + d.y*2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = flash ? '#fff' : '#8f4a2a'; ctx.beginPath(); ctx.arc(tx + px*6 + d.x*3, ty + py*6 + d.y*3, 1.2, 0, 7); ctx.fill();
      // both arms to the haft
      const ex = R + 5, ey = shY + torsoH*0.25;
      B(R, shY, ex, ey, limbW); B(ex, ey, gx, gy, limbW*0.9); J(gx, gy, limbW*0.65); J(ex, ey, limbW*0.6);
      const lx = hx2, ly = hy2, lex = -R*0.2, ley = shY + torsoH*0.3;
      B(-R, shY, lex, ley, limbW*0.8); B(lex, ley, lx, ly, limbW*0.75); J(lx, ly, limbW*0.55);
    } else {
      const hx = R + 4 + swing*3, hyd = shY + 8 - swing*14, ex = R + 5, ey = shY + 4 - swing*5;
      B(R, shY, ex, ey, limbW*0.9); B(ex, ey, hx, hyd, limbW*0.8); J(ex, ey, limbW*0.55); J(hx, hyd, limbW*0.6);
      const a = atk>0 ? (2.1 - swing*2.6) : (0.5 + walk*0.1), d = dir(a), px = -d.y, py = d.x;
      const bl = 14;
      ctx.fillStyle = flash ? '#fff' : '#8f857a'; ctx.strokeStyle = DARK; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(hx + px*1.1, hyd + py*1.1);
      ctx.lineTo(hx + d.x*bl + px*1.1, hyd + d.y*bl + py*1.1); ctx.lineTo(hx + d.x*(bl+3), hyd + d.y*(bl+3));
      ctx.lineTo(hx + d.x*bl - px*1.1, hyd + d.y*bl - py*1.1); ctx.lineTo(hx - px*1.1, hyd - py*1.1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = flash ? '#fff' : '#8a6a3a'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(hx - px*3.4, hyd - py*3.4); ctx.lineTo(hx + px*3.4, hyd + py*3.4); ctx.stroke();
      ctx.strokeStyle = flash ? '#fff' : '#7a4a22'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(hx + d.x*5 + px*0.2, hyd + d.y*5); ctx.lineTo(hx + d.x*8 + px*0.2, hyd + d.y*8); ctx.stroke();
    }
  }
  // pauldrons (brute)
  if(isBrute){
    for(const sd of [-1,1]){
      ctx.fillStyle = flash ? '#fff' : (KS ? '#5a1418' : '#6a5e4c'); ctx.strokeStyle = DARK; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(sd*(R+0.5), shY-0.5, 6.2, 4.2, sd*0.3, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = flash ? '#fff' : (KS ? '#a02a24' : '#9a8e76'); ctx.beginPath(); ctx.moveTo(sd*(R+2), shY-3); ctx.lineTo(sd*(R+4), shY-9); ctx.lineTo(sd*(R-1), shY-4); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  // skull: jaw first, then cranium
  const jawOpen = swing>0 ? 2.2*swing : (moving ? 0.5+Math.abs(walk)*0.4 : 0.4);
  ctx.fillStyle = BONE; ctx.strokeStyle = DARK; ctx.lineWidth = 1.1;
  roundRect(-headR*0.55, hy+headR*0.45+jawOpen, headR*1.1, headR*0.62, 2.2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = DARK; ctx.lineWidth = 0.8;
  for(const tx of [-0.28,0,0.28]){ ctx.beginPath(); ctx.moveTo(headR*tx, hy+headR*0.5+jawOpen); ctx.lineTo(headR*tx, hy+headR*0.85+jawOpen); ctx.stroke(); }
  let cg;
  if(flash) cg = '#ffffff'; else { cg = ctx.createRadialGradient(-headR*0.3, hy-headR*0.35, 1, 0, hy, headR*1.25); cg.addColorStop(0, P.bone); cg.addColorStop(1, P.shade); }
  ctx.fillStyle = cg; ctx.strokeStyle = DARK; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(0, hy, headR*0.98, headR*1.02, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = flash ? '#fff' : BONE; roundRect(-headR*0.62, hy+headR*0.3, headR*1.24, headR*0.42, 2); ctx.fill();
  ctx.strokeStyle = DARK; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(headR*0.3, hy-headR*0.98); ctx.lineTo(headR*0.12, hy-headR*0.55); ctx.lineTo(headR*0.34, hy-headR*0.3); ctx.stroke();
  // sockets, nose, eye glow
  ctx.fillStyle = flash ? '#fff' : '#080604';
  for(const sd of [-1,1]){ ctx.beginPath(); ctx.ellipse(sd*headR*0.4, hy+headR*0.02, headR*0.27, headR*0.32, sd*0.15, 0, 7); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(0, hy+headR*0.2); ctx.lineTo(-headR*0.12, hy+headR*0.5); ctx.lineTo(headR*0.12, hy+headR*0.5); ctx.closePath(); ctx.fill();
  e._eye = {x:iso.x, y:iso.y+hy*s, dx:headR*0.4*s, r:Math.max(1.6,1.6*s), c:eyeC};
  ctx.save(); ctx.shadowColor = eyeC; ctx.shadowBlur = 6; ctx.fillStyle = eyeC;
  for(const sd of [-1,1]){ ctx.beginPath(); ctx.arc(sd*headR*0.4, hy+headR*0.03, 1.5, 0, 7); ctx.fill(); }
  ctx.restore();
  // headgear
  if(isBrute){
    ctx.fillStyle = flash ? '#fff' : '#5a1418'; ctx.strokeStyle = DARK; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(0, hy-headR*0.05, headR*1.12, Math.PI, 0); ctx.lineTo(headR*1.12, hy-headR*0.2); ctx.lineTo(-headR*1.12, hy-headR*0.2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : '#7a2020'; ctx.fillRect(-headR*0.15, hy-headR*1.2, headR*0.3, headR*1.0);
    ctx.fillStyle = flash ? '#fff' : '#1a0a0a'; ctx.fillRect(-1, hy-headR*0.2, 2, headR*0.6);
    ctx.fillStyle = flash ? '#fff' : '#a02a24'; for(const sd of [-1,1]){ ctx.beginPath(); ctx.arc(sd*headR*0.8, hy-headR*0.35, 0.9, 0, 7); ctx.fill(); }
  } else if(isArcher){
    ctx.fillStyle = flash ? '#fff' : '#3a4430'; ctx.strokeStyle = DARK; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-headR*1.15, hy+headR*0.45);
    ctx.quadraticCurveTo(-headR*1.3, hy-headR*1.8, 0, hy-headR*1.55);
    ctx.quadraticCurveTo(headR*1.3, hy-headR*1.8, headR*1.15, hy+headR*0.45);
    ctx.quadraticCurveTo(headR*0.85, hy-headR*0.45, 0, hy-headR*0.5);
    ctx.quadraticCurveTo(-headR*0.85, hy-headR*0.45, -headR*1.15, hy+headR*0.45);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
  e._hpTop = (legLen+torsoH+headR*2)*s+8;
  drawHpBar(iso, e._hpTop, e.r, e.hp, e.maxHp);
}
// v501: skeletons (and the Necromancer's skeletons and Soul Gate archers) are pre-drawn into small sprites, one per walk/attack
// frame (12 walk, 8 idle and 5 attack steps), then stamped each frame -- ~50 canvas calls per skeleton become one drawImage.
// A hit flash draws the full vector version. Sprites are rebuilt per resolution; the cache keeps the newest SKEL_CACHE_MAX.
const SKEL_CACHE = new Map(), SKEL_CACHE_MAX = 110, SKEL_CW = 128, SKEL_OX = 64, SKEL_OY = 100;
function drawSkeletonEnemy(e){
  const sc = ctx.getTransform();
  if(e.hitT>0 || window.__noSpriteCache || sc.b || sc.c || Math.abs(sc.a-sc.d)>1e-6) return drawSkeletonEnemyRaw(e);
  const kind = e.type, moving = !!e.moving, atk = e.atkAnimT||0, t = e.animT||0, TWO = Math.PI*2;
  const cyc = kind==='skeletonbrute' ? 7 : 10, rate = moving ? cyc : 2.2, N = moving ? 12 : 8;
  const idx = Math.floor((((t*rate)%TWO)+TWO)%TWO/TWO*N);
  const ab = atk>0 ? 1+Math.round(clamp(atk/0.25,0,1)*4) : 0;
  const KS = kind==='skeletonbrute' && !!(game && game.room && game.room.subzone==='keep');
  const key = kind+'|'+(KS?1:0)+'|'+(e.mini?1:0)+'|'+(moving?1:0)+idx+'|'+ab+'|'+Math.round(e.r*2)+'|'+Math.round(sc.a*50);
  let en = SKEL_CACHE.get(key);
  if(en){ SKEL_CACHE.delete(key); SKEL_CACHE.set(key, en); }
  else {
    const px = Math.round(SKEL_CW*sc.a);
    const c = document.createElement('canvas'); c.width = px; c.height = px;
    const cc = c.getContext('2d');
    const fake = {type:kind, x:0, y:0, r:e.r, faceSign:1, animT:(idx+0.5)/N*TWO/rate, moving, atkAnimT:ab ? Math.max(0.001,(ab-1)/4*0.25) : 0, hitT:0, mini:e.mini, hp:1, maxHp:1};
    const i0 = toIso(0,0);
    cc.setTransform(sc.a,0,0,sc.a,(SKEL_OX-i0.x)*sc.a,(SKEL_OY-i0.y)*sc.a);
    const sCtx = ctx, sSup = _suppressHpBar;
    ctx = cc; _suppressHpBar = true;
    try{ drawSkeletonEnemyRaw(fake); } finally { ctx = sCtx; _suppressHpBar = sSup; }
    en = {c, eye:fake._eye, eyeDY:fake._eye.y - i0.y, hpTop:fake._hpTop};
    SKEL_CACHE.set(key, en);
    if(SKEL_CACHE.size > SKEL_CACHE_MAX) SKEL_CACHE.delete(SKEL_CACHE.keys().next().value);
  }
  const iso = toIso(e.x, e.y);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(e.faceSign||1, 1); ctx.drawImage(en.c, -SKEL_OX, -SKEL_OY, SKEL_CW, SKEL_CW); ctx.restore();
  e._eye = {x:iso.x, y:iso.y+en.eyeDY, dx:en.eye.dx, r:en.eye.r, c:en.eye.c};
  drawHpBar(iso, en.hpTop, e.r, e.hp, e.maxHp);
}
// v353: goblins -- bigger, fatter stocky little guys with real legs, boots, a pot belly and a crude blade / shortbow
function drawGoblinEnemy(e){
  const iso = toIso(e.x,e.y), kind = e.type, face = e.faceSign||1, t = e.animT||0, moving = e.moving, atk = e.atkAnimT||0, flash = e.hitT>0;
  const arch = kind==='goblinarcher';
  const s = e.r/16*(arch?1.62:1.6);
  const torsoW = arch?17:21, torsoH = arch?13:15, legLen = arch?8:9, headR = arch?7:7.8;
  const F = (c)=>flash ? '#fff' : c;
  const skin = arch?'#8fb44a':'#7aa83a', skinD = arch?'#4a6a22':'#3c5a1c', skinL = arch?'#b6d56a':'#a4cf5c', cloth = arch?'#6a5a2a':'#6a4a26', clothD = '#2a1c0e', boot = '#2a1c10', eye = '#ffe14a';
  drawShadow(iso.x, iso.y, (torsoW+8)*s*0.95, torsoW*0.42*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  const walk = moving ? Math.sin(t*12) : 0, bob = moving ? Math.abs(Math.sin(t*12))*1.6 : Math.sin(t*2.4)*0.6;
  const swing = walk*4, baseY = -legLen + bob;
  const armY = baseY - torsoH*0.7, reach = atk>0 ? 7 : 0;
  if(arch){   // quiver on the back
    ctx.save(); ctx.translate(-torsoW*0.32, baseY-torsoH*0.85); ctx.rotate(-0.4);
    ctx.fillStyle = F('#4a2e16'); roundRect(-3,-2,6,torsoH*0.9,2); ctx.fill();
    ctx.fillStyle = F('#d8d0b0'); for(const dx of [-2,0,2]) ctx.fillRect(dx-0.4,-6,0.9,5);
    ctx.restore();
  }
  // short thick legs + big flat boots
  for(const side of [-1,1]){
    const lift = side>0 ? -swing*0.4 : swing*0.4;
    ctx.fillStyle = F(skinD); roundRect(side*torsoW*0.26-3.8, baseY-1+lift*0.2, 7.6, legLen+1-lift*0.2, 3); ctx.fill();
    ctx.strokeStyle='#1c2c0c'; ctx.lineWidth=0.9; ctx.stroke();
    ctx.fillStyle = F(boot); ctx.beginPath(); ctx.ellipse(side*torsoW*0.26+1.4, -1.8+lift*0.3, 5.6, 2.8, 0, 0, 7); ctx.fill();
  }
  // fat round belly torso
  const tg = ctx.createLinearGradient(-torsoW/2, baseY-torsoH, torsoW/2, baseY);
  tg.addColorStop(0, skinL); tg.addColorStop(1, skinD);
  ctx.fillStyle = flash ? '#fff' : tg;
  ctx.beginPath(); ctx.ellipse(0, baseY-torsoH*0.5, torsoW/2, torsoH*0.62, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = skinD; ctx.lineWidth = 1.3; ctx.stroke();
  // belly highlight + leather vest + rope belt + loincloth
  ctx.fillStyle = flash ? '#fff' : 'rgba(210,235,150,0.22)'; ctx.beginPath(); ctx.ellipse(1.5, baseY-torsoH*0.38, torsoW*0.22, torsoH*0.26, 0, 0, 7); ctx.fill();
  ctx.fillStyle = F(cloth); ctx.beginPath(); ctx.moveTo(-torsoW*0.44, baseY-torsoH*0.98); ctx.lineTo(-torsoW*0.1, baseY-torsoH*0.98); ctx.lineTo(-torsoW*0.04, baseY-torsoH*0.3); ctx.lineTo(-torsoW*0.4, baseY-torsoH*0.24); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(torsoW*0.44, baseY-torsoH*0.98); ctx.lineTo(torsoW*0.1, baseY-torsoH*0.98); ctx.lineTo(torsoW*0.04, baseY-torsoH*0.3); ctx.lineTo(torsoW*0.4, baseY-torsoH*0.24); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = F(clothD); ctx.lineWidth=0.8; ctx.stroke();
  ctx.fillStyle = F('#8a6a3a'); ctx.fillRect(-torsoW*0.5, baseY-torsoH*0.3, torsoW, 2.6);
  ctx.fillStyle = F(cloth); ctx.beginPath(); ctx.moveTo(-5, baseY-torsoH*0.2); ctx.lineTo(5, baseY-torsoH*0.2); ctx.lineTo(3.4, baseY+legLen*0.55); ctx.lineTo(-3.4, baseY+legLen*0.55); ctx.closePath(); ctx.fill(); ctx.strokeStyle=F(clothD); ctx.stroke();
  // far arm
  ctx.fillStyle = F(skin); ctx.beginPath(); ctx.moveTo(-torsoW/2+1, armY-2); ctx.lineTo(-torsoW/2-6, armY+7); ctx.lineTo(-torsoW/2-2.5, armY+10); ctx.lineTo(-torsoW/2+3, armY+4); ctx.closePath(); ctx.fill(); ctx.strokeStyle=skinD; ctx.lineWidth=0.9; ctx.stroke();
  ctx.fillStyle = F(skinD); ctx.beginPath(); ctx.arc(-torsoW/2-4.4, armY+9.4, 2.4, 0, 7); ctx.fill();
  // near (weapon) arm
  const hx = torsoW/2+4+reach, hy = armY+9;
  ctx.fillStyle = F(skin); ctx.beginPath(); ctx.moveTo(torsoW/2-1, armY-2); ctx.lineTo(hx+2, hy-3); ctx.lineTo(hx-1.5, hy+1.6); ctx.lineTo(torsoW/2-3, armY+5); ctx.closePath(); ctx.fill(); ctx.strokeStyle=skinD; ctx.lineWidth=0.9; ctx.stroke();
  ctx.fillStyle = F(skinD); ctx.beginPath(); ctx.arc(hx, hy, 2.5, 0, 7); ctx.fill();
  // head: big, wide, pointed ears, warty nose
  const headY = baseY-torsoH-headR*0.4;
  ctx.fillStyle = F(skinL);
  for(const sd of [-1,1]){
    ctx.beginPath(); ctx.moveTo(sd*headR*0.85, headY-headR*0.1); ctx.lineTo(sd*headR*2.3, headY-headR*0.95+Math.sin(t*3)*0.5); ctx.lineTo(sd*headR*0.95, headY+headR*0.45); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=skinD; ctx.lineWidth=0.9; ctx.stroke();
  }
  const hg = ctx.createRadialGradient(-headR*0.3, headY-headR*0.3, 1, 0, headY, headR*1.3); hg.addColorStop(0, skinL); hg.addColorStop(1, skin);
  ctx.fillStyle = flash ? '#fff' : hg; ctx.beginPath(); ctx.ellipse(0, headY, headR*1.08, headR*0.95, 0, 0, 7); ctx.fill(); ctx.strokeStyle=skinD; ctx.lineWidth=1.2; ctx.stroke();
  ctx.fillStyle = F(skinD); ctx.beginPath(); ctx.arc(0, headY+headR*0.18, headR*0.2, 0, 7); ctx.fill();   // nose
  // eyes under a heavy brow
  e._eye = {x:iso.x, y:iso.y+headY*s, dx:headR*0.4*s, r:Math.max(1.6,1.8*s), c:eye};
  ctx.save(); ctx.shadowColor=eye; ctx.shadowBlur=5; ctx.fillStyle=eye;
  ctx.beginPath(); ctx.arc(-headR*0.4, headY-headR*0.2, 1.7, 0, 7); ctx.arc(headR*0.4, headY-headR*0.2, 1.7, 0, 7); ctx.fill(); ctx.restore();
  ctx.strokeStyle = F(skinD); ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(-headR*0.8, headY-headR*0.55); ctx.lineTo(-headR*0.1, headY-headR*0.3); ctx.moveTo(headR*0.8, headY-headR*0.55); ctx.lineTo(headR*0.1, headY-headR*0.3); ctx.stroke();
  // snaggle-toothed grin
  ctx.fillStyle = F('#1c2a0c'); ctx.beginPath(); ctx.ellipse(0, headY+headR*0.58, headR*0.5, headR*0.22, 0, 0, 7); ctx.fill();
  ctx.fillStyle = F('#f2ecd8'); for(const dx of [-0.34,0.3]){ ctx.beginPath(); ctx.moveTo(headR*dx-1,headY+headR*0.45); ctx.lineTo(headR*dx+1,headY+headR*0.45); ctx.lineTo(headR*dx,headY+headR*0.86); ctx.closePath(); ctx.fill(); }
  // scrap cap / topknot
  if(!arch){ ctx.fillStyle = F('#5a3e22'); ctx.beginPath(); ctx.arc(0, headY-headR*0.35, headR*1.02, Math.PI*1.08, Math.PI*1.92); ctx.closePath(); ctx.fill(); ctx.strokeStyle='#2a1c0e'; ctx.lineWidth=0.9; ctx.stroke(); }
  else { ctx.fillStyle = F('#4a5228'); ctx.beginPath(); ctx.moveTo(-headR*1.05, headY+headR*0.1); ctx.quadraticCurveTo(-headR*1.2, headY-headR*1.5, 0, headY-headR*1.4); ctx.quadraticCurveTo(headR*1.2, headY-headR*1.5, headR*1.05, headY+headR*0.1); ctx.quadraticCurveTo(0, headY-headR*0.7, -headR*1.05, headY+headR*0.1); ctx.fill(); ctx.strokeStyle='#22280f'; ctx.lineWidth=0.9; ctx.stroke(); }
  // weapon
  if(arch){
    ctx.save(); ctx.translate(hx+1, hy-1);
    ctx.strokeStyle = F('#5a3a1a'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(2, 0, 9, -1.25, 1.25); ctx.stroke();
    ctx.strokeStyle = F('#e8e0c8'); ctx.lineWidth = 0.7; const bx = 2+Math.cos(1.25)*9, by = Math.sin(1.25)*9;
    ctx.beginPath(); ctx.moveTo(bx, -by); ctx.lineTo(atk>0 ? bx-4 : bx, 0); ctx.lineTo(bx, by); ctx.stroke();
    ctx.restore();
  } else {
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(atk>0 ? 0.9 : -0.5);
    ctx.fillStyle = F('#4a3220'); ctx.fillRect(-1.6, -1, 3.2, 7);
    ctx.fillStyle = F('#8a6a3a'); ctx.fillRect(-4.6, -2.8, 9.2, 2.2);
    ctx.fillStyle = F('#b9bcc2'); ctx.beginPath(); ctx.moveTo(-2.2,-2.8); ctx.lineTo(2.6,-2.8); ctx.lineTo(3.2,-17); ctx.lineTo(-0.6,-20); ctx.lineTo(-2.6,-14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=0.9; ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  drawHpBar(iso, (legLen+torsoH+headR*2+8)*s, e.r, e.hp, e.maxHp);
}
// v353: cave trolls -- ~10% smaller, hulking and hunched on proper thick legs with feet, hide kilt, knobbly shoulders and a spiked club
function drawCaveTrollEnemy(e){
  const iso = toIso(e.x,e.y), face = e.faceSign||1, t = e.animT||0, moving = e.moving, atk = e.atkAnimT||0, flash = e.hitT>0;
  const s = e.r/16*0.9;
  const torsoW = 28, torsoH = 26, legLen = 17, headR = 8.6;
  const F = (c)=>flash ? '#fff' : c;
  const skin = '#7a7a62', skinL = '#a8a890', skinD = '#3a3a2c', moss = '#5a7a3a', hide = '#5a4028', hideD = '#2a1c10', eye = '#ff9a3a';
  drawShadow(iso.x, iso.y, (torsoW+10)*s*0.95, torsoW*0.4*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  const walk = moving ? Math.sin(t*6) : 0, bob = moving ? Math.abs(Math.sin(t*6))*2.2 : Math.sin(t*1.8)*1;
  const swing = walk*5, baseY = -legLen + bob;
  const armY = baseY - torsoH*0.82, reach = atk>0 ? 8 : 0;
  const tele = e.tState==='tele';
  // thick legs: thigh, knee, shin, big feet with toes
  for(const side of [-1,1]){
    const lift = side>0 ? -swing : swing;
    const lx = side*torsoW*0.28;
    const lg = ctx.createLinearGradient(lx-5,baseY,lx+5,0); lg.addColorStop(0, skinL); lg.addColorStop(1, skinD);
    ctx.fillStyle = flash ? '#fff' : lg; roundRect(lx-5.4, baseY-2+lift*0.15, 10.8, legLen+2-lift*0.15, 4); ctx.fill();
    ctx.strokeStyle = skinD; ctx.lineWidth = 1.1; ctx.stroke();
    ctx.fillStyle = F(skin); ctx.beginPath(); ctx.arc(lx, baseY+legLen*0.42+lift*0.1, 3.2, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = F(skinD); ctx.beginPath(); ctx.ellipse(lx+2, -2+lift*0.2, 8, 3.8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = F('#d8d2b8'); for(const k of [-1,0,1]){ ctx.beginPath(); ctx.arc(lx+8.6, -2.4+lift*0.2+k*1.9, 1, 0, 7); ctx.fill(); }
  }
  // hulking torso: broad hunched shoulders, big belly
  const tg = ctx.createLinearGradient(-torsoW/2, baseY-torsoH, torsoW/2, baseY);
  tg.addColorStop(0, skinL); tg.addColorStop(0.6, skin); tg.addColorStop(1, skinD);
  ctx.fillStyle = flash ? '#fff' : tg;
  ctx.beginPath(); ctx.moveTo(-torsoW*0.56, baseY-torsoH*0.86); ctx.quadraticCurveTo(0, baseY-torsoH*1.2, torsoW*0.56, baseY-torsoH*0.86);
  ctx.quadraticCurveTo(torsoW*0.6, baseY-torsoH*0.2, torsoW*0.4, baseY+2); ctx.lineTo(-torsoW*0.4, baseY+2); ctx.quadraticCurveTo(-torsoW*0.6, baseY-torsoH*0.2, -torsoW*0.56, baseY-torsoH*0.86); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = skinD; ctx.lineWidth = 1.5; ctx.stroke();
  // belly, scars and moss
  ctx.fillStyle = flash ? '#fff' : 'rgba(200,200,170,0.18)'; ctx.beginPath(); ctx.ellipse(2, baseY-torsoH*0.4, torsoW*0.26, torsoH*0.26, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(40,40,30,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-torsoW*0.2, baseY-torsoH*0.8); ctx.lineTo(-torsoW*0.05, baseY-torsoH*0.55); ctx.moveTo(torsoW*0.12, baseY-torsoH*0.7); ctx.lineTo(torsoW*0.22, baseY-torsoH*0.5); ctx.stroke();
  ctx.fillStyle = F(moss); for(const [mx,my,mr] of [[-0.3,0.22,3],[0.34,0.5,2.4],[-0.1,0.9,2.6]]){ ctx.beginPath(); ctx.ellipse(mx*torsoW, baseY-torsoH*my, mr*1.4, mr, 0, 0, 7); ctx.fill(); }
  // hide kilt + rope belt
  ctx.fillStyle = F(hide); ctx.beginPath(); ctx.moveTo(-torsoW*0.46, baseY-torsoH*0.2); ctx.lineTo(torsoW*0.46, baseY-torsoH*0.2); ctx.lineTo(torsoW*0.38, baseY+legLen*0.5); ctx.lineTo(torsoW*0.12, baseY+legLen*0.36); ctx.lineTo(-torsoW*0.12, baseY+legLen*0.5); ctx.lineTo(-torsoW*0.38, baseY+legLen*0.38); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = F(hideD); ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = F('#8a6a3a'); ctx.fillRect(-torsoW*0.48, baseY-torsoH*0.26, torsoW*0.96, 3.4);
  ctx.fillStyle = F('#d8d2b8'); ctx.beginPath(); ctx.arc(0, baseY-torsoH*0.26+1.7, 2.2, 0, 7); ctx.fill();   // skull-ish bone trinket
  // knobbly shoulders
  for(const sd of [-1,1]){
    const sg = ctx.createRadialGradient(sd*torsoW*0.5-1, baseY-torsoH*0.95-2, 1, sd*torsoW*0.5, baseY-torsoH*0.92, 8); sg.addColorStop(0, skinL); sg.addColorStop(1, skinD);
    ctx.fillStyle = flash ? '#fff' : sg; ctx.beginPath(); ctx.arc(sd*torsoW*0.52, baseY-torsoH*0.92, 7.4, 0, 7); ctx.fill(); ctx.strokeStyle=skinD; ctx.lineWidth=1.1; ctx.stroke();
    ctx.fillStyle = F('#3a3a2c'); ctx.beginPath(); ctx.moveTo(sd*torsoW*0.46, baseY-torsoH*1.02); ctx.lineTo(sd*torsoW*0.56, baseY-torsoH*1.26); ctx.lineTo(sd*torsoW*0.62, baseY-torsoH*1.0); ctx.closePath(); ctx.fill();
  }
  // far arm: long and heavy, knuckles near the knee
  ctx.fillStyle = F(skin); ctx.beginPath(); ctx.moveTo(-torsoW*0.5, armY); ctx.lineTo(-torsoW*0.5-9, armY+12); ctx.lineTo(-torsoW*0.5-4.4, armY+17); ctx.lineTo(-torsoW*0.5+3.6, armY+6); ctx.closePath(); ctx.fill(); ctx.strokeStyle=skinD; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle = F(skinD); ctx.beginPath(); ctx.arc(-torsoW*0.5-6.8, armY+16.4, 4, 0, 7); ctx.fill();
  // head: small and low between the shoulders, heavy brow, jutting jaw, tusks
  const headY = baseY-torsoH*1.02-headR*0.35;
  const hg = ctx.createRadialGradient(-headR*0.3, headY-headR*0.3, 1, 0, headY, headR*1.3); hg.addColorStop(0, skinL); hg.addColorStop(1, skin);
  ctx.fillStyle = flash ? '#fff' : hg; ctx.beginPath(); ctx.ellipse(0, headY, headR*1.05, headR*0.95, 0, 0, 7); ctx.fill(); ctx.strokeStyle=skinD; ctx.lineWidth=1.3; ctx.stroke();
  ctx.fillStyle = F(skin); ctx.beginPath(); ctx.ellipse(0, headY+headR*0.62, headR*0.82, headR*0.46, 0, 0, 7); ctx.fill(); ctx.stroke();   // jutting jaw
  ctx.fillStyle = F(skinD); ctx.beginPath(); ctx.moveTo(-headR*0.2, headY+headR*0.1); ctx.lineTo(0, headY+headR*0.5); ctx.lineTo(headR*0.2, headY+headR*0.1); ctx.closePath(); ctx.fill();
  for(const sd of [-1,1]){ ctx.fillStyle = F('#f2ecd8'); ctx.beginPath(); ctx.moveTo(sd*headR*0.42, headY+headR*0.5); ctx.lineTo(sd*headR*0.6, headY+headR*1.2); ctx.lineTo(sd*headR*0.2, headY+headR*0.62); ctx.closePath(); ctx.fill(); ctx.strokeStyle='#8a8470'; ctx.lineWidth=0.6; ctx.stroke(); }
  e._eye = {x:iso.x, y:iso.y+headY*s, dx:headR*0.4*s, r:Math.max(1.6,1.8*s), c:eye};
  ctx.save(); ctx.shadowColor=eye; ctx.shadowBlur=6; ctx.fillStyle=eye;
  ctx.beginPath(); ctx.arc(-headR*0.4, headY-headR*0.12, 1.7, 0, 7); ctx.arc(headR*0.4, headY-headR*0.12, 1.7, 0, 7); ctx.fill(); ctx.restore();
  ctx.strokeStyle = F(skinD); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-headR*0.85, headY-headR*0.5); ctx.lineTo(-headR*0.1, headY-headR*0.25); ctx.moveTo(headR*0.85, headY-headR*0.5); ctx.lineTo(headR*0.1, headY-headR*0.25); ctx.stroke();
  ctx.fillStyle = F(skinD); for(const sd of [-1,1]){ ctx.beginPath(); ctx.moveTo(sd*headR*0.95, headY-headR*0.1); ctx.lineTo(sd*headR*1.6, headY-headR*0.4); ctx.lineTo(sd*headR*0.98, headY+headR*0.3); ctx.closePath(); ctx.fill(); }   // ears
  // near arm + spiked club (lifts on the smash telegraph)
  // v520: smash swing -- club winds back overhead during the telegraph, then slams down toward the marked spot just before impact
  let raise = atk>0 ? -8 : 0;
  if(tele){ const f = clamp(1-e.tT/TROLL_SLAM_TELE,0,1); raise = f<0.72 ? -18-(f/0.72)*100 : -118+Math.pow((f-0.72)/0.28,2)*168; }
  else if(e.tSwingT>0) raise = 50*clamp(e.tSwingT/0.3,0,1)-4;
  const hx = torsoW*0.5+8+reach+(tele||e.tSwingT>0 ? 4 : 0), hy = armY+15+raise*0.13;
  ctx.fillStyle = F(skin); ctx.beginPath(); ctx.moveTo(torsoW*0.5, armY); ctx.lineTo(hx+3, hy-6); ctx.lineTo(hx-2, hy+1); ctx.lineTo(torsoW*0.5-3.6, armY+7); ctx.closePath(); ctx.fill(); ctx.strokeStyle=skinD; ctx.lineWidth=1; ctx.stroke();
  ctx.save(); ctx.translate(hx, hy);
  ctx.rotate((raise*Math.PI)/180-0.3);
  ctx.fillStyle = F('#5a4028'); ctx.beginPath(); ctx.moveTo(-2.2,5); ctx.lineTo(2.2,5); ctx.lineTo(4.4,-26); ctx.lineTo(-3.4,-26); ctx.closePath(); ctx.fill(); ctx.strokeStyle='#221608'; ctx.lineWidth=0.9; ctx.stroke();
  ctx.fillStyle = F('#4a3420'); ctx.beginPath(); ctx.ellipse(0,-31,7.6,11,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = F('#b9bcc2'); for(const [px,py] of [[-7,-34],[7,-34],[-6,-26],[6,-27],[0,-42]]){ ctx.beginPath(); ctx.moveTo(px-1.4,py); ctx.lineTo(px*1.35,py-(py<-40?4:2.4)); ctx.lineTo(px+1.4,py+2); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = F(skinD); ctx.beginPath(); ctx.arc(hx, hy, 4.4, 0, 7); ctx.fill();   // fist over the grip
  ctx.restore();
  drawHpBar(iso, (legLen+torsoH+headR*2+12)*s, e.r, e.hp, e.maxHp);
}
function drawDemon(e){
  const iso = toIso(e.x,e.y);
  const kind = e.type, face = e.faceSign||1, t = e.animT||0;
  const moving = e.moving, atk = e.atkAnimT||0, flash = e.hitT>0;
  if(e.defiler){ drawDefiler(e); return; }
  if(!e.isGuard && (kind==='bandit' || kind==='banditarcher' || kind==='banditbrute' || kind==='banditking')){ drawBandit(e); return; }
  if(kind==='goblin' || kind==='goblinarcher'){ drawGoblinEnemy(e); return; }
  if(kind==='cavetroll'){ drawCaveTrollEnemy(e); return; }
  if(kind==='skeleton' || kind==='skeletonarcher' || kind==='skeletonbrute'){ if(e.mapBrute && !e.mapCarrier){ const mi = toIso(e.x,e.y), pu = 0.5+0.5*Math.sin(((game&&game.clock)||0)*3); ctx.strokeStyle = 'rgba(240,200,80,'+(0.55+0.35*pu)+')'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(mi.x, mi.y+2, 26, 10, 0, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(240,200,80,0.9)'; ctx.font = 'bold 13px Cinzel, Georgia'; ctx.textAlign = 'center'; ctx.fillText('\u2726', mi.x, mi.y-e.r*3.4-8); } drawSkeletonEnemy(e); return; }
  if(kind==='archer' && !e.isGuard){ drawFloatDemon(iso, e.r/13, face, t, 'archer', {flash, moving, atk:atk>0, bow:true}); drawHpBar(iso, 52*(e.r/13), e.r, e.hp, e.maxHp); return; }

  let s, lightColor, bodyColor, darkColor, hornColor, eyeColor, hoverAmp, legLen, torsoW, torsoH, headR;
  if(kind==='grunt'){ s=e.r/16; lightColor='#c1445a'; bodyColor='#9c2f3e'; darkColor='#4e1620'; hornColor='#221016'; eyeColor='#ffd23a'; hoverAmp=0; legLen=14; torsoW=15; torsoH=18; headR=7; }
  else if(kind==='archer'){ s=e.r/16*1.08; lightColor='#8064c4'; bodyColor='#5a3f8a'; darkColor='#33235a'; hornColor='#1c1228'; eyeColor='#9ad6ff'; hoverAmp=4; legLen=8; torsoW=11; torsoH=15; headR=6; }
  else if(kind==='boss'){ s=e.r/16*1.15; lightColor='#ff6a4a'; bodyColor='#8a1f14'; darkColor='#2a0a06'; hornColor='#150402'; eyeColor='#ffdd44'; hoverAmp=0; legLen=19; torsoW=27; torsoH=32; headR=10.5; }
  else if(kind==='wolf'){ s=e.r/16*0.85; lightColor='#b8b4a8'; bodyColor='#6e6a60'; darkColor='#302e28'; hornColor='#1c1a16'; eyeColor='#ffd23a'; hoverAmp=0; legLen=15; torsoW=13; torsoH=15; headR=6.5; }
  else if(kind==='bear'){ s=e.r/16*1.0; lightColor='#a07a48'; bodyColor='#5a3f24'; darkColor='#2a1c10'; hornColor='#160e08'; eyeColor='#ff6a3a'; hoverAmp=0; legLen=18; torsoW=25; torsoH=29; headR=10; }
  else if(kind==='frozenzombie'){ s=e.r/16*0.95; lightColor='#cdeaf2'; bodyColor='#7fb8c9'; darkColor='#33505a'; hornColor='#1c2e34'; eyeColor='#baf1ff'; hoverAmp=0; legLen=15; torsoW=17; torsoH=19; headR=7.5; }
  // Bandits/Bandit Archers (Withered Crossroads, v69): a humanoid raider look,
  // deliberately given a warm leather/tan palette with plain human-skin
  // heads and dark hooded "horns" -- clearly distinct in color/style from
  // every demon (red/purple), the icy Frozen Zombie, and the furred
  // Wolf/Bear, while still reusing this same shared humanoid rig.
  else if(kind==='bandit'){ s=e.r/16; lightColor='#c9a25a'; bodyColor='#8a6a3a'; darkColor='#4a3620'; hornColor='#241c14'; eyeColor='#e8d8b8'; hoverAmp=0; legLen=14; torsoW=15; torsoH=18; headR=7; }
  else if(kind==='banditarcher'){ s=e.r/16*1.05; lightColor='#d8b878'; bodyColor='#b8925a'; darkColor='#5a4326'; hornColor='#2e2214'; eyeColor='#e8d8b8'; hoverAmp=3; legLen=8; torsoW=11; torsoH=15; headR=6; }
  // Bandit Brute (Lighthouse Tower rooftop, v70): a visibly bulkier bandit --
  // scaled up ~25% over a regular Bandit with a much wider/taller torso and
  // bigger head, and a darker, redder leather-and-bronze palette so it
  // reads as a distinct heavy variant at a glance rather than just a
  // recolor.
  else if(kind==='banditbrute'){ s=e.r/16*1.25; lightColor='#c46a4a'; bodyColor='#8a3a26'; darkColor='#3a1810'; hornColor='#1c0c08'; eyeColor='#ffb85a'; hoverAmp=0; legLen=16; torsoW=20; torsoH=23; headR=8.5; }
  // Skeleton (Lakeside Ruins, v71): the game's first undead melee type --
  // see spawnEnemy's 'skeleton' branch for its reusable stat formula. A
  // bone-white/off-white palette with dim gray-brown shading and a cold
  // glowing-socket eye color, clearly distinct from every fleshy humanoid
  // (Bandit's tan leather, the demons' red/purple) sharing this rig.
  else if(kind==='skeleton'){ s=e.r/16; lightColor='#f0ead6'; bodyColor='#d8cdb8'; darkColor='#8a8078'; hornColor='#5a5248'; eyeColor='#3ad4ff'; hoverAmp=0; legLen=14; torsoW=14; torsoH=17; headR=7; }
  // Zombie Skeleton Archer (Cursed Cemetery, v72): the Skeleton's shared
  // bone-white rig, given the same hover/thin-limb archer proportions as
  // Bandit Archer, with a sicklier, grayer-green cast to its bone color
  // (bodyColor/darkColor) so it reads as a rotting undead archer at a
  // glance rather than a plain recolored Bandit Archer.
  else if(kind==='skeletonarcher'){ s=e.r/16*1.05; lightColor='#dcd8ba'; bodyColor='#b8bc98'; darkColor='#5e6250'; hornColor='#3a3c30'; eyeColor='#3ad4ff'; hoverAmp=3; legLen=8; torsoW=11; torsoH=15; headR=6; }
  // Skeletal Brute (Cursed Cemetery, v72): a bulkier skeleton -- the same
  // ~25% size-up treatment Bandit Brute gets over Bandit, kept in the
  // Skeleton's bone-white family but darkened/dirtied so it reads as an
  // older, heavier set of bones rather than a plain scaled-up Skeleton.
  else if(kind==='skeletonbrute'){ s=e.r/16*1.25; lightColor='#e2dcc4'; bodyColor='#b8ac90'; darkColor='#5e5648'; hornColor='#2e2820'; eyeColor='#3ad4ff'; hoverAmp=0; legLen=16; torsoW=20; torsoH=23; headR=8.5; }
  // Zombie (Dark Crypt, v73): a plain shambling undead -- a sickly rotting
  // green-gray palette, clearly distinct from Skeleton's bone-white and
  // Frozen Zombie's icy blue-white, with a dull yellow-green eye glow
  // (its own base eyeColor -- the additional bright RED eye-glow every
  // Dark Crypt monster gets is a separate darkness-overlay effect, see
  // render()'s g.scene==='darkcrypt' branch, not this palette).
  else if(kind==='zombie'){ s=e.r/16*0.95; lightColor='#8a9a5a'; bodyColor='#556b34'; darkColor='#26301a'; hornColor='#141a0e'; eyeColor='#c8e068'; hoverAmp=0; legLen=13; torsoW=17; torsoH=19; headR=7.5; }
  // Vampire (Dark Crypt, v73): the 5-strong pack guarding the final chest --
  // a dark cloak/cape silhouette (deep near-black purple-red) over pale
  // skin, with its own naturally blood-red eye glow (on top of the same
  // darkness-overlay red eye-dot every Dark Crypt monster gets).
  else if(kind==='vampire'){ s=e.r/16*1.05; lightColor='#e8d8c8'; bodyColor='#2a1420'; darkColor='#120810'; hornColor='#0a0408'; eyeColor='#ff2a3a'; hoverAmp=0; legLen=15; torsoW=16; torsoH=20; headR=7; }
  else if(kind==='goblin'){ s=e.r/16*0.95; lightColor='#a4cf5c'; bodyColor='#6e9a36'; darkColor='#2f4818'; hornColor='#4a3a22'; eyeColor='#ffe14a'; hoverAmp=0; legLen=11; torsoW=12; torsoH=14; headR=6.5; }
  else if(kind==='goblinarcher'){ s=e.r/16*1.0; lightColor='#b6d56a'; bodyColor='#7ea23c'; darkColor='#34501a'; hornColor='#4a3a22'; eyeColor='#ffe14a'; hoverAmp=0; legLen=10; torsoW=11; torsoH=14; headR=6.2; }
  else if(kind==='cavetroll'){ s=e.r/16*1.0; lightColor='#a3a38c'; bodyColor='#70705c'; darkColor='#34342a'; hornColor='#2a281e'; eyeColor='#ff9a3a'; hoverAmp=0; legLen=17; torsoW=28; torsoH=30; headR=9.5; }
  else { s=e.r/16*0.9; lightColor='#9c3f68'; bodyColor='#6b2545'; darkColor='#3a0f24'; hornColor='#170812'; eyeColor='#ff6a3a'; hoverAmp=0; legLen=17; torsoW=23; torsoH=27; headR=9; }

  drawShadow(iso.x, iso.y, (torsoW+6)*s*0.9, (torsoW*0.38)*s);

  if(kind==='boss'){
    // a menacing pulsing aura to make the demon boss unmistakable at a glance
    ctx.save();
    const auraR = (torsoW+20)*s*(1+Math.sin(t*3)*0.06);
    const grd = ctx.createRadialGradient(iso.x, iso.y, auraR*0.15, iso.x, iso.y, auraR);
    grd.addColorStop(0, 'rgba(255,70,40,0.35)');
    grd.addColorStop(1, 'rgba(255,70,40,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(iso.x, iso.y, auraR, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(iso.x, iso.y);
  ctx.scale(face*s, s);

  const cyc = kind==='brute'?6:11;
  const walk = moving ? Math.sin(t*cyc) : 0;
  const bob = kind==='archer' ? (Math.sin(t*4)*hoverAmp - hoverAmp) : (moving ? Math.abs(Math.sin(t*cyc))*2 : Math.sin(t*2.2)*1);
  const legSwing = walk*6;
  const baseY = -legLen + bob;

  if(kind!=='archer'){
    ctx.fillStyle=darkColor;
    roundRect(-torsoW*0.32-3, baseY-legLen-legSwing*0.1, 6, legLen+legSwing*0.1, 2); ctx.fill();
    roundRect(torsoW*0.32-3, baseY-legLen+legSwing*0.1, 6, legLen-legSwing*0.1, 2); ctx.fill();
  } else {
    const flap = Math.sin(t*13)*4;
    const wingGradL = ctx.createLinearGradient(-torsoW*1.7, baseY-torsoH*0.9, -torsoW*0.4, baseY-torsoH*0.4);
    wingGradL.addColorStop(0,'rgba(120,90,180,0.3)'); wingGradL.addColorStop(1, darkColor);
    ctx.fillStyle=wingGradL;
    ctx.beginPath();
    ctx.moveTo(-torsoW*0.4, baseY-torsoH*0.6);
    ctx.quadraticCurveTo(-torsoW*1.7, baseY-torsoH*0.9+flap, -torsoW*1.2, baseY-torsoH*0.1);
    ctx.quadraticCurveTo(-torsoW*0.7,baseY-torsoH*0.3,-torsoW*0.4,baseY-torsoH*0.5);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=0.8; ctx.stroke();

    const wingGradR = ctx.createLinearGradient(torsoW*1.7, baseY-torsoH*0.9, torsoW*0.4, baseY-torsoH*0.4);
    wingGradR.addColorStop(0,'rgba(120,90,180,0.3)'); wingGradR.addColorStop(1, darkColor);
    ctx.fillStyle=wingGradR;
    ctx.beginPath();
    ctx.moveTo(torsoW*0.4, baseY-torsoH*0.6);
    ctx.quadraticCurveTo(torsoW*1.7, baseY-torsoH*0.9-flap, torsoW*1.2, baseY-torsoH*0.1);
    ctx.quadraticCurveTo(torsoW*0.7,baseY-torsoH*0.3,torsoW*0.4,baseY-torsoH*0.5);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=0.8; ctx.stroke();
  }

  let torsoFill;
  if(flash){ torsoFill=(e.isLairBoss||e.isBoss)?HIT_FLASH:'#ffffff'; }
  else {
    const tg = ctx.createLinearGradient(-torsoW/2, baseY-torsoH, torsoW/2, baseY);
    tg.addColorStop(0, lightColor); tg.addColorStop(1, darkColor);
    torsoFill = tg;
  }
  ctx.fillStyle = torsoFill;
  roundRect(-torsoW/2, baseY-torsoH, torsoW, torsoH, torsoW*0.32); ctx.fill();
  ctx.strokeStyle=darkColor; ctx.lineWidth=1.3; ctx.stroke();

  const armY = baseY-torsoH*0.72;
  const reach = atk>0 ? 7 : 0;
  ctx.fillStyle = flash ? ((e.isLairBoss||e.isBoss)?HIT_FLASH:'#fff') : darkColor;
  ctx.beginPath(); ctx.moveTo(-torsoW/2, armY); ctx.lineTo(-torsoW/2-7-reach, armY+8); ctx.lineTo(-torsoW/2-4-reach, armY+11); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(torsoW/2, armY); ctx.lineTo(torsoW/2+7+reach, armY+8); ctx.lineTo(torsoW/2+4+reach, armY+11); ctx.closePath(); ctx.fill();

  if(kind==='archer'){
    ctx.strokeStyle='#20142f'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.arc(torsoW/2+6+reach, armY+9, 5, -1,1); ctx.stroke();
  }

  const headY = baseY-torsoH-headR*0.55;
  let headFill;
  if(flash){ headFill=(e.isLairBoss||e.isBoss)?HIT_FLASH:'#ffffff'; }
  else {
    const hg = ctx.createRadialGradient(-headR*0.3, headY-headR*0.3, 1, 0, headY, headR*1.3);
    hg.addColorStop(0, lightColor); hg.addColorStop(1, darkColor);
    headFill = hg;
  }
  ctx.fillStyle = headFill;
  ctx.beginPath(); ctx.arc(0, headY, headR, 0,7); ctx.fill();
  ctx.strokeStyle=darkColor; ctx.lineWidth=1.2; ctx.stroke();

  ctx.fillStyle=hornColor;
  ctx.beginPath();
  ctx.moveTo(-headR*0.6,headY-headR*0.6);
  ctx.quadraticCurveTo(-headR*1.6,headY-headR*1.35, -headR*1.25,headY-headR*1.95);
  ctx.quadraticCurveTo(-headR*0.65,headY-headR*1.25, -headR*0.15,headY-headR*0.9);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(headR*0.6,headY-headR*0.6);
  ctx.quadraticCurveTo(headR*1.6,headY-headR*1.35, headR*1.25,headY-headR*1.95);
  ctx.quadraticCurveTo(headR*0.65,headY-headR*1.25, headR*0.15,headY-headR*0.9);
  ctx.closePath(); ctx.fill();

  e._eye = {x:iso.x, y:iso.y+headY*s, dx:headR*0.35*s, r:Math.max(1.6,1.8*s), c:eyeColor};
  ctx.save();
  ctx.shadowColor=eyeColor; ctx.shadowBlur=6;
  ctx.fillStyle=eyeColor;
  ctx.beginPath(); ctx.arc(-headR*0.35, headY, 1.8,0,7); ctx.fill();
  ctx.beginPath(); ctx.arc(headR*0.35, headY, 1.8,0,7); ctx.fill();
  ctx.restore();

  // snarling mouth with fangs
  ctx.fillStyle=darkColor;
  ctx.beginPath(); ctx.ellipse(0, headY+headR*0.5, headR*0.4, headR*0.22, 0, 0, 7); ctx.fill();
  ctx.fillStyle='#f2ecd8';
  ctx.beginPath(); ctx.moveTo(-headR*0.22,headY+headR*0.4); ctx.lineTo(-headR*0.12,headY+headR*0.4); ctx.lineTo(-headR*0.17,headY+headR*0.66); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(headR*0.22,headY+headR*0.4); ctx.lineTo(headR*0.12,headY+headR*0.4); ctx.lineTo(headR*0.17,headY+headR*0.66); ctx.closePath(); ctx.fill();

  // clawed fingertips at the end of each arm
  ctx.fillStyle=hornColor;
  const clawLX=-torsoW/2-4-reach, clawLY=armY+11, clawRX=torsoW/2+4+reach, clawRY=armY+11;
  for(const dxp of [-1.6,0,1.6]){
    ctx.beginPath(); ctx.moveTo(clawLX+dxp,clawLY); ctx.lineTo(clawLX+dxp-0.8,clawLY+3.4); ctx.lineTo(clawLX+dxp+0.8,clawLY+1); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(clawRX+dxp,clawRY); ctx.lineTo(clawRX+dxp-0.8,clawRY+1); ctx.lineTo(clawRX+dxp+0.8,clawRY+3.4); ctx.closePath(); ctx.fill();
  }

  // per-type flourishes
  if(kind==='brute' || kind==='bear'){
    // molten cracks across the chest
    ctx.save();
    ctx.shadowColor='#ff8a3a'; ctx.shadowBlur=4;
    ctx.strokeStyle='rgba(255,138,58,0.85)'; ctx.lineWidth=1.1;
    ctx.beginPath();
    ctx.moveTo(-torsoW*0.18, baseY-torsoH*0.75); ctx.lineTo(-torsoW*0.04, baseY-torsoH*0.5); ctx.lineTo(-torsoW*0.14, baseY-torsoH*0.22);
    ctx.moveTo(torsoW*0.1, baseY-torsoH*0.82); ctx.lineTo(torsoW*0.2, baseY-torsoH*0.55);
    ctx.stroke();
    ctx.restore();
    // lower tusks
    ctx.fillStyle='#f2ecd8';
    ctx.beginPath(); ctx.moveTo(-headR*0.5,headY+headR*0.55); ctx.lineTo(-headR*0.62,headY+headR*0.95); ctx.lineTo(-headR*0.32,headY+headR*0.62); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(headR*0.5,headY+headR*0.55); ctx.lineTo(headR*0.62,headY+headR*0.95); ctx.lineTo(headR*0.32,headY+headR*0.62); ctx.closePath(); ctx.fill();
    // shoulder spikes
    ctx.fillStyle=hornColor;
    for(const sideSign of [-1,1]){
      ctx.beginPath();
      ctx.moveTo(sideSign*torsoW*0.36, baseY-torsoH*0.94);
      ctx.lineTo(sideSign*torsoW*0.56, baseY-torsoH*1.22);
      ctx.lineTo(sideSign*torsoW*0.22, baseY-torsoH*0.98);
      ctx.closePath(); ctx.fill();
    }
  } else if(kind==='archer'){
    // quiver on the back + a faint rune glow on the bow arm
    ctx.fillStyle=darkColor;
    roundRect(torsoW*0.1, baseY-torsoH*1.05, torsoW*0.28, torsoH*0.5, 2); ctx.fill();
    ctx.strokeStyle=lightColor; ctx.lineWidth=0.8; ctx.stroke();
    ctx.save();
    ctx.shadowColor=eyeColor; ctx.shadowBlur=5;
    ctx.strokeStyle=eyeColor; ctx.lineWidth=0.8; ctx.globalAlpha=0.7;
    ctx.beginPath(); ctx.arc(torsoW/2+6+reach, armY+9, 5, -1,1); ctx.stroke();
    ctx.restore();
  } else if(kind==='boss'){
    // massive crown of horns and glowing chest fissures befitting a floor guardian
    ctx.save();
    ctx.shadowColor='#ff5a2a'; ctx.shadowBlur=6;
    ctx.strokeStyle='rgba(255,120,40,0.9)'; ctx.lineWidth=1.6;
    ctx.beginPath();
    ctx.moveTo(-torsoW*0.22, baseY-torsoH*0.82); ctx.lineTo(-torsoW*0.02, baseY-torsoH*0.5); ctx.lineTo(-torsoW*0.18, baseY-torsoH*0.18);
    ctx.moveTo(torsoW*0.14, baseY-torsoH*0.88); ctx.lineTo(torsoW*0.26, baseY-torsoH*0.55); ctx.lineTo(torsoW*0.1, baseY-torsoH*0.25);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle=hornColor;
    for(const sideSign of [-1,1]){
      ctx.beginPath();
      ctx.moveTo(sideSign*headR*0.55, headY-headR*0.75);
      ctx.quadraticCurveTo(sideSign*headR*2.1, headY-headR*1.7, sideSign*headR*1.55, headY-headR*2.7);
      ctx.quadraticCurveTo(sideSign*headR*0.85, headY-headR*1.55, sideSign*headR*0.2, headY-headR*1.05);
      ctx.closePath(); ctx.fill();
    }
  } else if(kind==='goblin' || kind==='goblinarcher'){
    // big pointed ears + a crude blade / shortbow
    ctx.fillStyle=lightColor;
    for(const sd of [-1,1]){
      ctx.beginPath(); ctx.moveTo(sd*headR*0.9,headY-headR*0.1); ctx.lineTo(sd*headR*2.2,headY-headR*0.9); ctx.lineTo(sd*headR*1.0,headY+headR*0.4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle=darkColor; ctx.lineWidth=0.8; ctx.stroke();
    }
    if(kind==='goblin'){
      ctx.fillStyle='#b9bcc2'; ctx.beginPath(); ctx.moveTo(clawRX,clawRY); ctx.lineTo(clawRX+9,clawRY-3); ctx.lineTo(clawRX+9,clawRY+5); ctx.lineTo(clawRX,clawRY+4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=0.8; ctx.stroke();
    } else {
      ctx.strokeStyle='#4a3218'; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.arc(torsoW/2+6+reach, armY+9, 6, -1.2,1.2); ctx.stroke();
      ctx.strokeStyle='#e8e0c8'; ctx.lineWidth=0.7;
      ctx.beginPath(); ctx.moveTo(torsoW/2+6+reach+2.5, armY+9-5.4); ctx.lineTo(torsoW/2+6+reach+2.5, armY+9+5.4); ctx.stroke();
      ctx.fillStyle=darkColor; roundRect(torsoW*0.1, baseY-torsoH*1.05, torsoW*0.28, torsoH*0.5, 2); ctx.fill();
    }
  } else if(kind==='cavetroll'){
    // hulking: tusks, hunched shoulder knobs and a big knotted club
    ctx.fillStyle='#f2ecd8';
    ctx.beginPath(); ctx.moveTo(-headR*0.5,headY+headR*0.55); ctx.lineTo(-headR*0.7,headY+headR*1.05); ctx.lineTo(-headR*0.3,headY+headR*0.62); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(headR*0.5,headY+headR*0.55); ctx.lineTo(headR*0.7,headY+headR*1.05); ctx.lineTo(headR*0.3,headY+headR*0.62); ctx.closePath(); ctx.fill();
    ctx.fillStyle=bodyColor;
    for(const sd of [-1,1]){ ctx.beginPath(); ctx.arc(sd*torsoW*0.5, baseY-torsoH*0.92, 6, 0, 7); ctx.fill(); ctx.strokeStyle=darkColor; ctx.lineWidth=1; ctx.stroke(); }
    ctx.save(); ctx.translate(clawRX+2, clawRY);
    const raise = (e.tState==='tele') ? -18 : (atk>0 ? -8 : 0);
    ctx.rotate((raise*Math.PI)/180-0.3);
    ctx.fillStyle='#5a4028'; ctx.beginPath(); ctx.moveTo(-2,4); ctx.lineTo(2,4); ctx.lineTo(4,-26); ctx.lineTo(-3,-26); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#4a3420'; ctx.beginPath(); ctx.ellipse(0,-30,7,10,0,0,7); ctx.fill(); ctx.strokeStyle='#221608'; ctx.lineWidth=1; ctx.stroke();
    ctx.restore();
  } else if(kind==='wolf'){
    // lean and feral -- no extra strapping, just the pointed ears from the horn shapes above
  } else if(kind==='frozenzombie'){
    // icy frost cracks across the chest (the molten-crack shape above, in
    // a cold palette) and a few tatters of ragged clothing hanging off the shoulders
    ctx.save();
    ctx.shadowColor='#baf1ff'; ctx.shadowBlur=4;
    ctx.strokeStyle='rgba(186,241,255,0.85)'; ctx.lineWidth=1.1;
    ctx.beginPath();
    ctx.moveTo(-torsoW*0.18, baseY-torsoH*0.75); ctx.lineTo(-torsoW*0.04, baseY-torsoH*0.5); ctx.lineTo(-torsoW*0.14, baseY-torsoH*0.22);
    ctx.moveTo(torsoW*0.1, baseY-torsoH*0.82); ctx.lineTo(torsoW*0.2, baseY-torsoH*0.55);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle='#48606a';
    for(const sideSign of [-1,1]){
      ctx.beginPath();
      ctx.moveTo(sideSign*torsoW*0.32, baseY-torsoH*0.9);
      ctx.lineTo(sideSign*torsoW*0.5, baseY-torsoH*0.55);
      ctx.lineTo(sideSign*torsoW*0.2, baseY-torsoH*0.68);
      ctx.closePath(); ctx.fill();
    }
  } else if(kind==='banditbrute'){
    // a bulkier bandit: heavier shoulder pauldrons (the brute/bear's
    // spike silhouette, recolored to the bandit leather/bronze palette
    // rather than a demon's molten look) plus a big cleaver blade at its
    // weapon hand instead of bare claws -- the "bigger weapon" visual
    // callout the brief asks for.
    ctx.fillStyle=hornColor;
    for(const sideSign of [-1,1]){
      ctx.beginPath();
      ctx.moveTo(sideSign*torsoW*0.36, baseY-torsoH*0.94);
      ctx.lineTo(sideSign*torsoW*0.6, baseY-torsoH*1.18);
      ctx.lineTo(sideSign*torsoW*0.22, baseY-torsoH*0.98);
      ctx.closePath(); ctx.fill();
    }
    ctx.save();
    ctx.fillStyle='#9aa0a8';
    ctx.beginPath();
    ctx.moveTo(clawRX, clawRY);
    ctx.lineTo(clawRX+14, clawRY-4);
    ctx.lineTo(clawRX+14, clawRY+10);
    ctx.lineTo(clawRX, clawRY+8);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=1; ctx.stroke();
    ctx.restore();
  } else if(kind==='skeleton' || kind==='skeletonarcher'){
    // Rib-cage lines across the chest -- a skeletal silhouette callout
    // distinct from the molten-crack/frost-crack "damage lines" other
    // types use in this same flourish slot, plus visible dark eye sockets
    // (drawn over the normal eye-glow dots above) for the classic
    // hollow-skull look. Shared as-is by the Zombie Skeleton Archer (v72)
    // since it reuses the exact Skeleton rig/torso proportions for its
    // upper body.
    ctx.save();
    ctx.strokeStyle = darkColor; ctx.lineWidth = 1;
    for(let ri=0; ri<3; ri++){
      const ry = baseY - torsoH*(0.28+ri*0.22);
      ctx.beginPath(); ctx.moveTo(-torsoW*0.34, ry); ctx.lineTo(torsoW*0.34, ry); ctx.stroke();
    }
    ctx.restore();
    if(kind==='skeletonarcher'){
      // quiver + bow glow, same visual callout Bandit Archer/the dungeon
      // Archer get in this slot, layered over the rib-cage lines above.
      ctx.fillStyle=darkColor;
      roundRect(torsoW*0.1, baseY-torsoH*1.05, torsoW*0.28, torsoH*0.5, 2); ctx.fill();
      ctx.strokeStyle=lightColor; ctx.lineWidth=0.8; ctx.stroke();
      ctx.save();
      ctx.shadowColor=eyeColor; ctx.shadowBlur=5;
      ctx.strokeStyle=eyeColor; ctx.lineWidth=0.8; ctx.globalAlpha=0.7;
      ctx.beginPath(); ctx.arc(torsoW/2+6+reach, armY+9, 5, -1,1); ctx.stroke();
      ctx.restore();
    }
  } else if(kind==='skeletonbrute'){
    // Skeletal Brute (v72): rib-cage lines (same callout as the regular
    // Skeleton, scaled to its bigger torso) plus heavier bone-spur
    // shoulder spikes and a big two-handed bone greataxe in its weapon
    // hand instead of bare claws -- the "bigger bones/bigger weapon"
    // visual the brief asks for, mirroring how Bandit Brute gets a
    // cleaver in this same flourish slot.
    ctx.save();
    ctx.strokeStyle = darkColor; ctx.lineWidth = 1.3;
    for(let ri=0; ri<3; ri++){
      const ry = baseY - torsoH*(0.28+ri*0.22);
      ctx.beginPath(); ctx.moveTo(-torsoW*0.36, ry); ctx.lineTo(torsoW*0.36, ry); ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle=hornColor;
    for(const sideSign of [-1,1]){
      ctx.beginPath();
      ctx.moveTo(sideSign*torsoW*0.36, baseY-torsoH*0.94);
      ctx.lineTo(sideSign*torsoW*0.58, baseY-torsoH*1.2);
      ctx.lineTo(sideSign*torsoW*0.22, baseY-torsoH*0.98);
      ctx.closePath(); ctx.fill();
    }
    ctx.save();
    ctx.fillStyle='#c8c2b0';
    ctx.beginPath();
    ctx.moveTo(clawRX, clawRY-6);
    ctx.lineTo(clawRX+16, clawRY-12);
    ctx.lineTo(clawRX+19, clawRY-2);
    ctx.lineTo(clawRX+4, clawRY+10);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle=darkColor; ctx.lineWidth=1; ctx.stroke();
    ctx.restore();
  } else {
    // grunt: a simple banded chest strap
    ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(-torsoW/2,baseY-torsoH*0.6); ctx.lineTo(torsoW/2,baseY-torsoH*0.35); ctx.stroke();
  }

  ctx.restore();

  drawHpBar(iso, legLen+torsoH+headR*2+10, e.r, e.hp, e.maxHp);
}

// Spiders don't fit the humanoid demon rig, so they get their own low,
// many-legged silhouette with glowing eyes.
function drawSpiderIso(e){
  const iso = toIso(e.x,e.y);
  const t = e.animT||0, flash = e.hitT>0, moving = e.moving;
  const s = e.r/13;
  drawShadow(iso.x, iso.y, 16*s, 7*s);
  ctx.save();
  ctx.translate(iso.x, iso.y);
  ctx.scale(s, s);
  const bob = moving ? Math.abs(Math.sin(t*10))*1.5 : Math.sin(t*2)*0.5;
  const bodyY = -6+bob;
  ctx.strokeStyle = flash ? '#fff' : '#241a2e';
  ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  for(let i=0;i<4;i++){
    const legPhase = moving ? Math.sin(t*10 + i*1.4)*5 : 0;
    const baseAngle = -0.9 + i*0.6;
    for(const side of [-1,1]){
      const ang = side<0 ? Math.PI-baseAngle : baseAngle;
      const kx = Math.cos(ang)*13, ky = Math.sin(ang)*5+bodyY+3+legPhase*0.2;
      const ex = Math.cos(ang)*20, ey = Math.sin(ang)*3+bodyY+8+legPhase;
      ctx.beginPath(); ctx.moveTo(0,bodyY); ctx.lineTo(kx,ky); ctx.lineTo(ex,ey); ctx.stroke();
    }
  }
  let bodyFill;
  if(flash){ bodyFill='#fff'; }
  else {
    const bg = ctx.createRadialGradient(-3,bodyY-4,1,0,bodyY,13);
    bg.addColorStop(0,'#5a4470'); bg.addColorStop(1,'#241a30');
    bodyFill = bg;
  }
  ctx.fillStyle = bodyFill;
  ctx.beginPath(); ctx.ellipse(0,bodyY,10,7.5,0,0,7); ctx.fill();
  ctx.strokeStyle='#140e1c'; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle = bodyFill;
  ctx.beginPath(); ctx.ellipse(11,bodyY+1,5.5,4.2,0,0,7); ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.shadowColor='#ff3a3a'; ctx.shadowBlur=5;
  ctx.fillStyle='#ff3a3a';
  ctx.beginPath(); ctx.arc(14,bodyY-1,1.4,0,7); ctx.fill();
  ctx.beginPath(); ctx.arc(14,bodyY+3,1.4,0,7); ctx.fill();
  ctx.restore();
  ctx.restore();
  drawHpBar(iso, 26, e.r, e.hp, e.maxHp);
}

// A lean, four-legged wolf in profile -- flips with facing like everything
// else, but reads as an actual animal instead of the bipedal demon rig.
function drawWolfIso(e){
  const iso = toIso(e.x,e.y);
  const face = e.faceSign||1, t = e.animT||0, moving = e.moving, flash = e.hitT>0;
  const s = e.r/14;
  drawShadow(iso.x, iso.y, 22*s, 8*s);
  ctx.save();
  ctx.translate(iso.x, iso.y);
  ctx.scale(face*s, s);
  const walk = moving ? Math.sin(t*12) : 0;
  const bob = moving ? Math.abs(Math.sin(t*12))*1.5 : Math.sin(t*2)*0.5;
  const bodyY = -14+bob;
  const furLight = flash?'#fff':'#b8b4a8', furDark = flash?'#fff':'#6e6a60', furShadow='#302e28';
  const legA = walk*7, legB = -walk*7;
  ctx.strokeStyle = furShadow; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-11,bodyY+2); ctx.lineTo(-11+legA*0.3, bodyY+12+Math.abs(legA)*0.15); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-5,bodyY+3); ctx.lineTo(-5+legB*0.3, bodyY+13+Math.abs(legB)*0.15); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9,bodyY+2); ctx.lineTo(9+legB*0.3, bodyY+12+Math.abs(legB)*0.15); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(15,bodyY+3); ctx.lineTo(15+legA*0.3, bodyY+13+Math.abs(legA)*0.15); ctx.stroke();
  // tail
  ctx.strokeStyle = furDark; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-14,bodyY-4); ctx.quadraticCurveTo(-23,bodyY-9,-21,bodyY-17); ctx.stroke();
  // body
  let bodyFill;
  if(flash){ bodyFill='#fff'; }
  else {
    const bg = ctx.createLinearGradient(-14,bodyY-8,14,bodyY+4);
    bg.addColorStop(0, furLight); bg.addColorStop(1, furDark);
    bodyFill = bg;
  }
  ctx.fillStyle = bodyFill;
  ctx.beginPath(); ctx.ellipse(0, bodyY-3, 15, 7, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = furShadow; ctx.lineWidth = 1.2; ctx.stroke();
  // head + snout
  const headX=18, headY=bodyY-8;
  ctx.fillStyle = flash?'#fff':furLight;
  ctx.beginPath(); ctx.ellipse(headX, headY, 6.5, 5.5, 0,0,7); ctx.fill();
  ctx.strokeStyle=furShadow; ctx.lineWidth=1; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headX+5,headY+1); ctx.lineTo(headX+13,headY+2); ctx.lineTo(headX+5,headY+4); ctx.closePath(); ctx.fill(); ctx.stroke();
  // ears
  ctx.fillStyle = furShadow;
  ctx.beginPath(); ctx.moveTo(headX-3,headY-4); ctx.lineTo(headX-1,headY-11); ctx.lineTo(headX+2,headY-4); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(headX+2,headY-4); ctx.lineTo(headX+5,headY-10); ctx.lineTo(headX+6,headY-3); ctx.closePath(); ctx.fill();
  // glowing eye
  ctx.save(); ctx.shadowColor='#ffd23a'; ctx.shadowBlur=5; ctx.fillStyle='#ffd23a';
  ctx.beginPath(); ctx.arc(headX+3,headY-1,1.3,0,7); ctx.fill(); ctx.restore();
  ctx.restore();
  drawHpBar(iso, 30*s, e.r, e.hp, e.maxHp);
}

// Cat Companion (v81, Support submenu): same profile-and-flip quadruped
// technique as drawWolfIso above, at a much smaller scale and a warm
// orange/cream tabby palette instead of the wolf's grey. No HP bar --
// it's a non-combat pet (pickEnemyTarget excludes it from being attacked
// in the first place, see its own comment), so a health readout would
// just be visual noise no one needs to act on.
function drawCatIso(e){
  const iso = toIso(e.x,e.y);
  const face = e.faceSign||1, t = e.animT||0, moving = e.moving, flash = e.hitT>0;
  const s = e.r/10;
  drawShadow(iso.x, iso.y, 13*s, 5*s);
  ctx.save();
  ctx.translate(iso.x, iso.y);
  ctx.scale(face*s, s);
  const walk = moving ? Math.sin(t*14) : 0;
  const bob = moving ? Math.abs(Math.sin(t*14))*1.3 : Math.sin(t*2.4)*0.5;
  const bodyY = -8+bob;
  const furLight = flash?'#fff':'#e8a458', furDark = flash?'#fff':'#c07830', furShadow='#3a2414';
  const legA = walk*4.5, legB = -walk*4.5;
  ctx.strokeStyle = furShadow; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-7,bodyY+1); ctx.lineTo(-7+legA*0.3, bodyY+8+Math.abs(legA)*0.12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-3,bodyY+2); ctx.lineTo(-3+legB*0.3, bodyY+9+Math.abs(legB)*0.12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6,bodyY+1); ctx.lineTo(6+legB*0.3, bodyY+8+Math.abs(legB)*0.12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10,bodyY+2); ctx.lineTo(10+legA*0.3, bodyY+9+Math.abs(legA)*0.12); ctx.stroke();
  // tail -- a cat's tail curls up, not down like the wolf's
  ctx.strokeStyle = furDark; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-9,bodyY-2); ctx.quadraticCurveTo(-16,bodyY-3,-15,bodyY-12); ctx.stroke();
  // body
  let bodyFill;
  if(flash){ bodyFill='#fff'; }
  else {
    const bg = ctx.createLinearGradient(-9,bodyY-5,9,bodyY+3);
    bg.addColorStop(0, furLight); bg.addColorStop(1, furDark);
    bodyFill = bg;
  }
  ctx.fillStyle = bodyFill;
  ctx.beginPath(); ctx.ellipse(0, bodyY-2, 9.5, 4.5, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = furShadow; ctx.lineWidth = 0.9; ctx.stroke();
  // head
  const headX=11, headY=bodyY-5;
  ctx.fillStyle = flash?'#fff':furLight;
  ctx.beginPath(); ctx.ellipse(headX, headY, 4.6, 4, 0,0,7); ctx.fill();
  ctx.strokeStyle=furShadow; ctx.lineWidth=0.8; ctx.stroke();
  // tiny triangular ears
  ctx.fillStyle = furDark;
  ctx.beginPath(); ctx.moveTo(headX-2.5,headY-2.5); ctx.lineTo(headX-2,headY-6.5); ctx.lineTo(headX+0.5,headY-2.8); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(headX+1,headY-2.8); ctx.lineTo(headX+3,headY-6); ctx.lineTo(headX+3.8,headY-2.2); ctx.closePath(); ctx.fill();
  // cute closed-eye/whisker dot face
  ctx.fillStyle = furShadow;
  ctx.beginPath(); ctx.arc(headX+2, headY, 0.9, 0, 7); ctx.fill();
  ctx.restore();
}

// Wild Boar (Withered Crossroads, v69): same profile-and-flip quadruped approach
// as the wolf above, given a stockier rounder body, short stubby legs, a
// curled tail, and a pair of small tusks instead of the wolf's lean frame
// and glowing eye -- a distinct silhouette at a glance despite reusing the
// same drawing technique.
function drawBoarIso(e){
  const iso = toIso(e.x,e.y);
  const face = e.faceSign||1, t = e.animT||0, moving = e.moving, flash = e.hitT>0;
  const charging = e.boarChargeState==='charging';
  const s = e.r/14;
  drawShadow(iso.x, iso.y, 22*s, 8*s);
  ctx.save();
  ctx.translate(iso.x, iso.y);
  ctx.scale(face*s, s);
  // v192 wind-ups: charge = crouch, shake and paw the ground with head lowered; bite = short rear-back lunge pose
  const bwF = e.boarChargeState==='wind' ? clamp(1 - e.boarWindT/BOAR_CHARGE_WIND, 0, 1) : 0;
  const biF = e.windT>0 ? clamp(1 - e.windT/(e.windMax||0.4), 0, 1) : 0;
  if(bwF>0){ ctx.translate(Math.sin(((game&&game.clock)||0)*70)*1.3*bwF, 2.5*bwF); ctx.translate(14,-6); ctx.rotate(0.2*bwF); ctx.translate(-14,6); }
  if(biF>0){ ctx.translate(-5*biF,0); ctx.translate(-8,-4); ctx.rotate(-0.3*biF); ctx.translate(8,4); }
  // a faster leg cycle while mid-charge, reading as a dead sprint
  const cyc = charging ? 20 : 10;
  const walk = moving ? Math.sin(t*cyc) : 0;
  const bob = moving ? Math.abs(Math.sin(t*cyc))*1.6 : Math.sin(t*2)*0.5;
  const bodyY = -12+bob;
  const hideLight = flash?'#fff':'#8a6b4a', hideDark = flash?'#fff':'#4a3620', hideShadow='#241c12';
  const legA = walk*6, legB = -walk*6;
  ctx.strokeStyle = hideShadow; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-10,bodyY+3); ctx.lineTo(-10+legA*0.3, bodyY+11+Math.abs(legA)*0.15); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-4,bodyY+4); ctx.lineTo(-4+legB*0.3, bodyY+12+Math.abs(legB)*0.15); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8,bodyY+3); ctx.lineTo(8+legB*0.3, bodyY+11+Math.abs(legB)*0.15); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(13,bodyY+4); ctx.lineTo(13+legA*0.3, bodyY+12+Math.abs(legA)*0.15); ctx.stroke();
  // small curled tail
  ctx.strokeStyle = hideDark; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-13,bodyY-2); ctx.quadraticCurveTo(-18,bodyY-6,-15,bodyY-9); ctx.stroke();
  // a bristly ridge along the spine when charging -- a quick telegraph cue
  if(charging){
    ctx.strokeStyle = '#2e2214'; ctx.lineWidth = 1.6; ctx.lineCap='round';
    for(const dx of [-6,-1,4,9]){ ctx.beginPath(); ctx.moveTo(dx,bodyY-8); ctx.lineTo(dx,bodyY-12); ctx.stroke(); }
  }
  // stocky round body
  let bodyFill;
  if(flash){ bodyFill='#fff'; }
  else {
    const bg = ctx.createLinearGradient(-13,bodyY-9,13,bodyY+5);
    bg.addColorStop(0, hideLight); bg.addColorStop(1, hideDark);
    bodyFill = bg;
  }
  ctx.fillStyle = bodyFill;
  ctx.beginPath(); ctx.ellipse(0, bodyY-3, 14, 8, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = hideShadow; ctx.lineWidth = 1.2; ctx.stroke();
  // head + snout
  const headX=16, headY=bodyY-6;
  ctx.fillStyle = flash?'#fff':hideLight;
  ctx.beginPath(); ctx.ellipse(headX, headY, 6, 5, 0,0,7); ctx.fill();
  ctx.strokeStyle=hideShadow; ctx.lineWidth=1; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headX+4,headY+1); ctx.lineTo(headX+11,headY+2); ctx.lineTo(headX+4,headY+4); ctx.closePath(); ctx.fill(); ctx.stroke();
  // small ears
  ctx.fillStyle = hideShadow;
  ctx.beginPath(); ctx.moveTo(headX-3,headY-3); ctx.lineTo(headX-2,headY-8); ctx.lineTo(headX+1,headY-3); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(headX+2,headY-3); ctx.lineTo(headX+4,headY-7); ctx.lineTo(headX+5,headY-2); ctx.closePath(); ctx.fill();
  // tusks
  ctx.fillStyle='#f2ecd8';
  ctx.beginPath(); ctx.moveTo(headX+9,headY+2); ctx.lineTo(headX+13,headY+1); ctx.lineTo(headX+9,headY+4); ctx.closePath(); ctx.fill();
  // small dark eye
  ctx.fillStyle='#1c1410';
  ctx.beginPath(); ctx.arc(headX+2,headY-1,1.2,0,7); ctx.fill();
  ctx.restore();
  drawHpBar(iso, 28*s, e.r, e.hp, e.maxHp);
}

// A bulky brown bear, also on all fours -- same profile-and-flip approach
// as the wolf, scaled up with rounder proportions and a shoulder hump.
function drawBearIso(e){
  const iso = toIso(e.x,e.y);
  const face = e.faceSign||1, t = e.animT||0, moving = e.moving, flash = e.hitT>0;
  const s = e.sizeMult ? (HUNTER_BEAR_R/16)*e.sizeMult : e.r/16;   // v267: companion bear grows 5% per level (cap 2x), hitbox grows slower
  drawShadow(iso.x, iso.y, 30*s, 11*s);
  ctx.save();
  ctx.translate(iso.x, iso.y);
  ctx.scale(face*s, s);
  // v191 wind-ups: claw swipe = the bear rears back on its hind legs; charge = it crouches, shakes and paws the ground
  const swF = e.windT>0 ? clamp(1 - e.windT/(e.windMax||0.5), 0, 1) : 0;
  const chF = e.chargeState==='wind' ? clamp(1 - e.chargeWindT/BEAR_CHARGE_WIND, 0, 1) : 0;
  if(swF>0){ ctx.translate(-14,-4); ctx.rotate(-0.55*swF); ctx.translate(14,4); }
  if(chF>0){ ctx.translate(Math.sin(((game&&game.clock)||0)*70)*1.6*chF, 3*chF); ctx.translate(20,-10); ctx.rotate(0.14*chF); ctx.translate(-20,10); }
  const walk = moving ? Math.sin(t*7) : 0;
  const bob = moving ? Math.abs(Math.sin(t*7))*2 : Math.sin(t*2)*0.8;
  const bodyY = -18+bob;
  // Mountain Pass's winter-white polar bear reuses this exact rig/AI --
  // only the coat palette changes, via a cosmetic e.variant flag set on
  // spawn (see spawnMountainPassPack). Anything without that flag (wild
  // Forest/Bear Cave bears, and the Hunter's tamed bear companion, which
  // also renders through this function) keeps the normal brown coloring.
  const polar = e.variant==='polar';
  const furLight = flash?'#fff':(polar?'#eef4f8':'#a07a48'), furDark = flash?'#fff':(polar?'#c3d3dc':'#5a3f24'), furShadow = polar?'#93a8b4':'#2a1c10';
  const snoutColor = flash?'#fff':(polar?'#dce8ee':'#c9a074');
  const eyeGlow = (swF>0||chF>0) ? '#ff2a1a' : (polar ? '#5ad1ff' : '#ff6a3a');
  const legA = walk*6, legB = -walk*6;
  ctx.strokeStyle = furShadow; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-15,bodyY+4); ctx.lineTo(-15+legA*0.25,bodyY+18+Math.abs(legA)*0.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-5,bodyY+5); ctx.lineTo(-5+legB*0.25,bodyY+19+Math.abs(legB)*0.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12,bodyY+4); ctx.lineTo(12+legB*0.25,bodyY+18+Math.abs(legB)*0.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(21,bodyY+5); ctx.lineTo(21+legA*0.25,bodyY+19+Math.abs(legA)*0.1); ctx.stroke();
  // body -- big and rounded, with a shoulder hump
  let bodyFill;
  if(flash){ bodyFill='#fff'; }
  else {
    const bg = ctx.createLinearGradient(-20,bodyY-14,20,bodyY+6);
    bg.addColorStop(0,furLight); bg.addColorStop(1,furDark);
    bodyFill = bg;
  }
  ctx.fillStyle = bodyFill;
  ctx.beginPath(); ctx.ellipse(0,bodyY-4,22,11,0,0,7); ctx.fill();
  ctx.strokeStyle=furShadow; ctx.lineWidth=1.6; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-6,bodyY-14,9,6,0,0,7); ctx.fill(); ctx.stroke();
  // head + snout
  const headX=24, headY=bodyY-10;
  ctx.fillStyle = flash?'#fff':furLight;
  ctx.beginPath(); ctx.ellipse(headX,headY,9,7.5,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = snoutColor;
  ctx.beginPath(); ctx.ellipse(headX+8,headY+2,5,3.6,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#241a12'; ctx.beginPath(); ctx.arc(headX+12,headY+2,1.4,0,7); ctx.fill();
  // rounded ears
  ctx.fillStyle=furDark;
  ctx.beginPath(); ctx.arc(headX-5,headY-7,3.4,0,7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(headX+3,headY-8,3.4,0,7); ctx.fill(); ctx.stroke();
  // eye
  ctx.save(); ctx.shadowColor=eyeGlow; ctx.shadowBlur=5; ctx.fillStyle=eyeGlow;
  ctx.beginPath(); ctx.arc(headX+5,headY-1,1.6+(swF+chF)*1.2,0,7); ctx.fill(); ctx.restore();
  // raised front paw with claws while rearing up
  if(swF>0){
    ctx.strokeStyle = furShadow; ctx.lineWidth = 6; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(14,bodyY-2); ctx.lineTo(24+swF*4,bodyY-16-swF*10); ctx.stroke();
    ctx.strokeStyle = '#f2e6c8'; ctx.lineWidth = 1.6;
    for(let k=-1;k<=1;k++){ ctx.beginPath(); ctx.moveTo(24+swF*4+k*3,bodyY-16-swF*10); ctx.lineTo(27+swF*4+k*4,bodyY-22-swF*10); ctx.stroke(); }
  }
  ctx.restore();
  drawHpBar(iso, 46*s, e.r, e.hp, e.maxHp);
}

// Treant (v68): a walking tree -- a thick bark trunk for a body, gnarled
// root-like legs, twisting branch "arms", and a leafy canopy for a head
// with a pair of glowing hollow eyes, drawn as its own canvas rig (same
// convention as drawWolfIso/drawSpiderIso/drawBearIso) so it reads at a
// glance as something distinct from any existing Forest enemy.
function drawTreantIso(e){
  // v456 redesign: an ancient, hunched tree-giant -- root feet, a twisting bark torso with a carved face and
  // ember eyes, mossy shoulders, a crown of gnarled branches and two long limbs that rise and slam down
  const iso = toIso(e.x,e.y);
  const face = e.faceSign||1, t = e.animT||0, moving = e.moving, flash = e.hitT>0;
  const s = e.r/16*0.9;
  const wind = e.windT>0 ? 1 : 0;
  const atk = (!wind && e.atkAnimT>0) ? clamp(e.atkAnimT/0.15,0,1) : 0;
  const walk = moving ? Math.sin(t*2.6) : 0, br = Math.sin(t*1.2);
  const C = flash ? {b1:'#fff',b2:'#f4f4f4',b3:'#ddd',m1:'#fff',m2:'#eee',l1:'#fff',l2:'#eee'}
                  : {b1:'#7a654c',b2:'#4f3f2e',b3:'#2a2019',m1:'#5d7a3a',m2:'#3d5626',l1:'#5a7a36',l2:'#3c5824'};
  drawShadow(iso.x, iso.y, 36*s, 13*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // thick root legs, splaying into gnarled root toes
  for(const sd of [-1,1]){
    const st = sd*walk, fx = sd*13 + st*6, fy = st<0 ? st*5 : 0;
    ctx.fillStyle = C.b2; ctx.strokeStyle = '#1a120c'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(sd*9-8,-36); ctx.lineTo(sd*9+8,-36); ctx.quadraticCurveTo((sd*9+fx)/2+10, -17, fx+8, fy); ctx.lineTo(fx-8, fy); ctx.quadraticCurveTo((sd*9+fx)/2-10, -17, sd*9-8,-36); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = C.b3; ctx.lineWidth = 3.6;
    for(const k of [-1,0,1]){ ctx.beginPath(); ctx.moveTo(fx+k*3, fy-1); ctx.quadraticCurveTo(fx+k*8, fy+2, fx+k*14, fy+1+Math.abs(k)*2); ctx.stroke(); }
  }
  // back limb (drawn behind the trunk)
  const limb = (sd)=>{
    const idle = 1.25 + (moving ? sd*walk*0.28 : br*0.05);
    const a = wind ? -1.05 : atk>0 ? idle + (0.45-idle)*atk : idle;
    const ang = sd>0 ? a : Math.PI - a;
    const bx = sd*15, by = -76;
    const ex = bx + Math.cos(ang)*24, ey = by + Math.sin(ang)*24;
    const ang2 = ang + (sd>0 ? 0.55 : -0.55)*(wind ? -1 : 1);
    const hx = ex + Math.cos(ang2)*22, hy = ey + Math.sin(ang2)*22;
    ctx.strokeStyle = C.b3; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(ex,ey); ctx.lineTo(hx,hy); ctx.stroke();
    ctx.strokeStyle = C.b2; ctx.lineWidth = 6.5; ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(ex,ey); ctx.lineTo(hx,hy); ctx.stroke();
    ctx.strokeStyle = C.b3; ctx.lineWidth = 2.2;
    for(const k of [-0.5,0,0.5]){ const ca = ang2 + k; ctx.beginPath(); ctx.moveTo(hx,hy); ctx.quadraticCurveTo(hx+Math.cos(ca)*6, hy+Math.sin(ca)*6, hx+Math.cos(ca+0.3*sd)*12, hy+Math.sin(ca+0.3*sd)*12); ctx.stroke(); }
    ctx.fillStyle = C.l2; ctx.beginPath(); ctx.ellipse(ex, ey-2, 5, 3, 0, 0, 7); ctx.fill();   // leaf tuft on the elbow
  };
  limb(-1);
  // trunk torso, hunched and twisting
  const tilt = -0.06 + br*0.02 - atk*0.2 + wind*0.08;
  ctx.save(); ctx.translate(0,-32); ctx.rotate(tilt);
  let bf = C.b1;
  if(!flash){ bf = ctx.createLinearGradient(-20,0,20,0); bf.addColorStop(0,C.b1); bf.addColorStop(0.55,C.b2); bf.addColorStop(1,C.b3); }
  ctx.fillStyle = bf; ctx.strokeStyle = '#1a120c'; ctx.lineWidth = 1.6;
  // a real trunk: broad at the base, narrowing into hunched shoulders
  ctx.beginPath(); ctx.moveTo(-18,6); ctx.bezierCurveTo(-21,-12,-15,-30,-15,-46); ctx.quadraticCurveTo(-6,-56,2,-54); ctx.quadraticCurveTo(12,-55,16,-46); ctx.bezierCurveTo(16,-30,22,-12,18,6); ctx.quadraticCurveTo(0,10,-18,6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(20,12,6,0.5)'; ctx.lineWidth = 1.3;
  for(const [x0,x1] of [[-13,-10],[-5,-4],[4,5],[12,11]]){ ctx.beginPath(); ctx.moveTo(x0,4); ctx.quadraticCurveTo((x0+x1)/2+(x0<0?-2:2),-22,x1,-48); ctx.stroke(); }
  // a burl on the belly
  if(!flash){ ctx.fillStyle = C.b2; ctx.beginPath(); ctx.ellipse(7,-10,6,5,0.3,0,7); ctx.fill(); ctx.strokeStyle = 'rgba(20,12,6,0.6)'; ctx.beginPath(); ctx.ellipse(7,-10,3,2.4,0.3,0,7); ctx.stroke(); }
  // deep-set eyes with an ember glow (hotter while winding up) under a heavy, split brow; a hollow, jagged maw
  const ey = -38;
  ctx.fillStyle = '#0d0805'; ctx.beginPath(); ctx.ellipse(-6,ey,4,3,-0.3,0,7); ctx.fill(); ctx.beginPath(); ctx.ellipse(6,ey,4,3,0.3,0,7); ctx.fill();
  if(!flash){ ctx.save(); for(const ex of [-6,6]){ const eg = ctx.createRadialGradient(ex,ey,0,ex,ey,7); eg.addColorStop(0, wind ? 'rgba(255,110,40,0.55)' : 'rgba(255,190,90,0.45)'); eg.addColorStop(1,'rgba(255,150,60,0)'); ctx.fillStyle = eg; ctx.fillRect(ex-7,ey-7,14,14); } ctx.fillStyle = wind ? '#ff7a3a' : '#ffd070';
    ctx.beginPath(); ctx.ellipse(-6,ey+0.5,2,1.3,-0.3,0,7); ctx.fill(); ctx.beginPath(); ctx.ellipse(6,ey+0.5,2,1.3,0.3,0,7); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = C.b1; ctx.strokeStyle = '#1a120c'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-13,ey-6); ctx.quadraticCurveTo(-6,ey-9,-1,ey-3); ctx.lineTo(-3,ey-2); ctx.quadraticCurveTo(-8,ey-5,-13,ey-3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(13,ey-6); ctx.quadraticCurveTo(6,ey-9,1,ey-3); ctx.lineTo(3,ey-2); ctx.quadraticCurveTo(8,ey-5,13,ey-3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#0d0805'; const mo = 2 + wind*3 + atk*2;
  ctx.beginPath(); ctx.moveTo(-6,-27); ctx.lineTo(-3,-29); ctx.lineTo(0,-27); ctx.lineTo(3,-29); ctx.lineTo(6,-27); ctx.lineTo(4,-25+mo); ctx.lineTo(1,-26+mo*1.2); ctx.lineTo(-2,-24+mo); ctx.lineTo(-5,-25+mo*0.8); ctx.closePath(); ctx.fill();
  // moss over the shoulders, hanging strands
  ctx.fillStyle = C.m2; ctx.beginPath(); ctx.ellipse(-13,-48,9,5,0.4,0,7); ctx.fill(); ctx.beginPath(); ctx.ellipse(13,-49,9,5,-0.4,0,7); ctx.fill();
  ctx.strokeStyle = C.m1; ctx.lineWidth = 1.4;
  for(const mx of [-19,-14,-9,10,15,20]){ const sw = Math.sin(t*1.5+mx)*1.5; ctx.beginPath(); ctx.moveTo(mx,-46); ctx.quadraticCurveTo(mx+sw,-38,mx+sw*1.5,-32-(Math.abs(mx)%3)*3); ctx.stroke(); }
  // crown of gnarled branches with leaf clusters
  ctx.strokeStyle = C.b2;
  for(const [x0,y0,x1,y1,lw] of [[-16,-48,-30,-72,3.6],[-6,-52,-10,-80,3],[6,-52,13,-82,3],[16,-48,32,-68,3.6],[-10,-64,-22,-88,2],[10,-66,24,-90,2]]){
    ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.quadraticCurveTo((x0+x1)/2+(x1>0?-5:5),(y0+y1)/2,x1+Math.sin(t*0.9+x1)*1.2,y1); ctx.stroke();
  }
  for(const [lx,ly,rx,ry,c] of [[-30,-72,11,7,C.l2],[-11,-82,12,7,C.l1],[13,-84,12,7,C.l2],[31,-68,10,6,C.l1],[-22,-89,8,5,C.l1],[24,-91,8,5,C.l2],[1,-74,13,8,C.l1]]){
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(lx+Math.sin(t*0.8+lx)*1.2,ly,rx,ry,0,0,7); ctx.fill();
  }
  ctx.restore();
  limb(1);
  if(atk>0.3 && !flash){ ctx.strokeStyle = 'rgba(200,170,110,'+(0.5*atk).toFixed(2)+')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(30,-4,22,7,0,0,7); ctx.stroke(); }   // ground-shock where the limb lands
  ctx.restore();
  drawHpBar(iso, 100*s, e.r, e.hp, e.maxHp);
}

