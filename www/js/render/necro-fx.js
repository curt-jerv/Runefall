// v489 Necromancer art: Soul Fire ball, the Fear curse mark, Soul Shield lights and the bound (summoned) demon.
function drawSoulFireIso(pr, iso){
  const ck = (game&&game.clock)||0, R = pr.r*1.5, cy = iso.y - 20, sd = pr.seed||0;
  const ang = Math.atan2(pr.vy*ISO_KY + pr.vx*ISO_KY, (pr.vx - pr.vy)*ISO_KX);   // travel direction on screen
  ctx.save();
  ctx.fillStyle = 'rgba(40,160,60,0.22)'; ctx.beginPath(); ctx.ellipse(iso.x, iso.y, R*1.3, R*0.55, 0, 0, 7); ctx.fill();   // glow on the ground
  const halo = ctx.createRadialGradient(iso.x, cy, R*0.3, iso.x, cy, R*2.3);
  halo.addColorStop(0, 'rgba(150,255,120,0.55)'); halo.addColorStop(1, 'rgba(40,160,60,0)');
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(iso.x, cy, R*2.3, 0, 7); ctx.fill();
  // flame tongues streaming behind the ball
  const bx = -Math.cos(ang), by = -Math.sin(ang);
  for(let k=0;k<5;k++){
    const w = Math.sin(ck*9 + k*1.7 + sd)*R*0.35, len = R*(1.6 + 0.5*Math.sin(ck*6+k)), off = (k-2)*R*0.28;
    const px = -by*off, py = bx*off;
    ctx.fillStyle = k%2 ? 'rgba(90,230,80,0.55)' : 'rgba(40,170,60,0.5)';
    ctx.beginPath(); ctx.moveTo(iso.x+px-by*R*0.3, cy+py+bx*R*0.3);
    ctx.quadraticCurveTo(iso.x+px+bx*len*0.6-by*w, cy+py+by*len*0.6+bx*w, iso.x+px+bx*len, cy+py+by*len-R*0.3);
    ctx.quadraticCurveTo(iso.x+px+bx*len*0.5+by*w, cy+py+by*len*0.5-bx*w, iso.x+px+by*R*0.3, cy+py-bx*R*0.3);
    ctx.closePath(); ctx.fill();
  }
  // the ball: a dark core wrapped in green fire
  const core = ctx.createRadialGradient(iso.x-R*0.3, cy-R*0.3, R*0.1, iso.x, cy, R);
  core.addColorStop(0, '#e8ffd8'); core.addColorStop(0.35, '#7af25a'); core.addColorStop(0.8, '#1e8a34'); core.addColorStop(1, '#0c3a18');
  ctx.fillStyle = core; ctx.beginPath(); ctx.arc(iso.x, cy, R, 0, 7); ctx.fill();
  // trapped souls: small pale faces swirling inside
  for(let k=0;k<3;k++){
    const a = ck*2.2 + k*2.094 + sd, fx = iso.x + Math.cos(a)*R*0.45, fy = cy + Math.sin(a)*R*0.3;
    ctx.globalAlpha = 0.55 + 0.25*Math.sin(ck*5+k);
    ctx.fillStyle = '#f2ffee'; ctx.beginPath(); ctx.ellipse(fx, fy, R*0.2, R*0.24, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#123a1a'; ctx.beginPath(); ctx.arc(fx-R*0.07, fy-R*0.04, R*0.045, 0, 7); ctx.arc(fx+R*0.07, fy-R*0.04, R*0.045, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(fx, fy+R*0.1, R*0.05, R*0.07, 0, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // licks of flame around the rim
  ctx.strokeStyle = 'rgba(200,255,170,0.7)'; ctx.lineWidth = 1.6;
  for(let k=0;k<6;k++){ const a = k/6*6.283 + ck*3, f = 1.1 + 0.25*Math.sin(ck*11+k*2); ctx.beginPath(); ctx.moveTo(iso.x+Math.cos(a)*R*0.9, cy+Math.sin(a)*R*0.9); ctx.lineTo(iso.x+Math.cos(a+0.2)*R*f, cy+Math.sin(a+0.2)*R*f - R*0.25); ctx.stroke(); }
  ctx.restore();
}
// a purple wavy line floating over every cursed (Fear) enemy
function drawFearMark(e){
  const iso = toIso(e.x, e.y), ck = (game&&game.clock)||0, s = Math.max(0.8, Math.min(2, (e.r||14)/14));
  const y0 = iso.y - (e.r||14)*3.6 - 14*s, w = 12*s;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for(const [lw, col] of [[4.5*s, 'rgba(40,10,60,0.75)'], [2.2*s, '#c58aff']]){
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
    for(let k=0;k<=16;k++){ const u = k/16, x = iso.x - w + u*w*2, y = y0 + Math.sin(u*Math.PI*3 + ck*7)*3*s; k ? ctx.lineTo(x,y) : ctx.moveTo(x,y); }
    ctx.stroke();
  }
  ctx.restore();
}
// Soul Shield: small white lights circling the player, one for every 5 souls held (up to 10)
// v492: one small white orb per 10 souls, circling the feet (cheap: plain discs, no per-frame gradients)
function drawSoulShieldOrbs(p, clock){
  const n = Math.min(5, Math.floor(Math.min(SOUL_CAP, p.souls||0)/10)); if(n<=0) return;
  const iso = toIso(p.x, p.y), rx = 17, ry = 7;
  ctx.save(); ctx.fillStyle = '#ffffff';
  for(let k=0;k<n;k++){
    const a = clock*1.1 + k/n*6.283, x = iso.x + Math.cos(a)*rx, y = iso.y - 3 + Math.sin(a)*ry;
    const front = Math.sin(a) > 0;
    ctx.globalAlpha = front ? 0.9 : 0.45;
    ctx.beginPath(); ctx.arc(x, y, front ? 2.2 : 1.6, 0, 6.283); ctx.fill();
  }
  ctx.restore();
}
// The bound demon (Demon Bind): a heavier, tankier brute than the wild demons -- pot belly, hunched shoulders,
// small horned head, thick arms and a broken shackle on each wrist.
function drawBoundDemonIso(iso, s, face, t, o){
  o = o || {}; const fl = !!o.flash, moving = !!o.moving, atk = !!o.atk;
  const C = c=> fl ? '#ffffff' : c;
  const dark = '#2a0d0c', mid = '#6a1c16', light = '#a3392a', belly = '#b8673c', ember = '#ff8a3a';
  const ph = moving ? t*8 : 0, walk = moving ? Math.sin(ph) : 0, bob = moving ? Math.abs(Math.sin(ph))*1.4 : Math.sin(t*1.8)*0.8;
  drawShadow(iso.x, iso.y, 15*s, 6*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const ol = fl ? '#fff' : dark;
  // thick stubby legs with cloven hooves
  for(const sd of [-1,1]){
    const sw = walk*sd*2.6, hx = sd*5.5;
    ctx.strokeStyle = C(mid); ctx.lineWidth = 6.5; ctx.beginPath(); ctx.moveTo(hx, -14-bob); ctx.lineTo(hx+sw+1, -3); ctx.stroke();
    ctx.fillStyle = C('#1a0806'); ctx.beginPath(); ctx.ellipse(hx+sw+1.5, -1.2, 4.2, 2.2, 0, 0, 7); ctx.fill();
  }
  // back arm (behind the body)
  const swing = atk ? 1 : 0;
  ctx.strokeStyle = C(dark); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-8,-26-bob); ctx.quadraticCurveTo(-14,-20-bob,-12,-11-bob); ctx.stroke();
  // round heavy body
  let gr = ctx.createRadialGradient(-3,-26-bob,2,0,-19-bob,15); gr.addColorStop(0, light); gr.addColorStop(0.7, mid); gr.addColorStop(1, dark);
  ctx.fillStyle = fl ? '#fff' : gr; ctx.strokeStyle = ol; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.ellipse(0, -19-bob, 12.5, 11, 0, 0, 7); ctx.fill(); ctx.stroke();
  // pot belly
  ctx.fillStyle = C(belly); ctx.beginPath(); ctx.ellipse(3, -15.5-bob, 7.5, 6.5, 0, 0, 7); ctx.fill();
  if(!fl){
    ctx.strokeStyle = 'rgba(60,20,10,0.5)'; ctx.lineWidth = 0.9; for(const yy of [-18,-15,-12]){ ctx.beginPath(); ctx.moveTo(-1,yy-bob); ctx.quadraticCurveTo(3,yy+1.2-bob,8,yy-bob); ctx.stroke(); }
    // glowing ember cracks
    ctx.strokeStyle = ember; ctx.globalAlpha = 0.55 + 0.3*Math.sin(t*4); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-8,-24-bob); ctx.lineTo(-5,-20-bob); ctx.lineTo(-7,-16-bob); ctx.moveTo(-3,-28-bob); ctx.lineTo(0,-25-bob); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // hunched shoulders
  ctx.fillStyle = C(mid); ctx.strokeStyle = ol; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.ellipse(-1, -27.5-bob, 11, 5, -0.08, 0, 7); ctx.fill(); ctx.stroke();
  // small head set low and forward, swept-back horns, tusks, burning eyes
  const hx = 6, hy = -29.5-bob;
  ctx.fillStyle = C(light); ctx.beginPath(); ctx.ellipse(hx, hy, 5.2, 4.6, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = C('#d9c7a0'); ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(hx-2,hy-3.5); ctx.quadraticCurveTo(hx-7,hy-9,hx-11,hy-6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx+2,hy-3.8); ctx.quadraticCurveTo(hx+1,hy-10,hx-3,hy-11); ctx.stroke();
  ctx.fillStyle = C('#efe2c0'); ctx.beginPath(); ctx.moveTo(hx+2.5,hy+2); ctx.lineTo(hx+3.6,hy-0.8); ctx.lineTo(hx+4.6,hy+2.2); ctx.closePath(); ctx.fill();
  if(!fl){ ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.arc(hx+2.6, hy-1.2, 1.1, 0, 7); ctx.arc(hx+0.2, hy-1.4, 0.9, 0, 7); ctx.fill(); }
  // front arm: hangs low, swings forward to strike
  const fx = atk ? 15 : 11 + walk*1.5, fy = atk ? -30-bob : -11-bob;
  ctx.strokeStyle = C(mid); ctx.lineWidth = 6.5; ctx.beginPath(); ctx.moveTo(7,-25-bob); ctx.quadraticCurveTo(13, atk ? -30-bob : -20-bob, fx, fy); ctx.stroke();
  ctx.fillStyle = C(dark); ctx.beginPath(); ctx.arc(fx, fy, 3.6, 0, 7); ctx.fill();
  ctx.strokeStyle = C('#e8dcc0'); ctx.lineWidth = 1.1; for(let k=-1;k<=1;k++){ ctx.beginPath(); ctx.moveTo(fx+1.5, fy+k*1.6); ctx.lineTo(fx+4.6, fy+k*2.2+1); ctx.stroke(); }
  // broken shackles
  if(!fl){ ctx.strokeStyle = '#8a8a90'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(fx-2.5, fy-0.5, 2.6, 3.2, 0.4, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx-3.5, fy+2.5); ctx.lineTo(fx-5, fy+5); ctx.lineTo(fx-4, fy+7); ctx.stroke(); }
  ctx.restore();
}
