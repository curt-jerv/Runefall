// ---------------- Barren Highlands monsters (v459) ----------------
// Troll Elder: hangs back behind its tribe; every few seconds it raises its totem staff, healing every ally nearby
// (12% life) and whipping them into a frenzy for 6s (+25% damage, +15% speed). Clubs you if you get close.
function updateTrollElder(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  updateStuckTracking(e, dt);
  e.elderCd = (e.elderCd||0) - dt;
  if(e.elderCastT>0){
    e.elderCastT -= dt; e.moving = false; e.atkAnimT = 0.1;
    if(e.elderCastT<=0) trollElderPulse(g, e);
    return;
  }
  if(e.elderCd<=0){
    const needs = g.enemies.some(o=>o!==e && o.hp>0 && dist(o,e)<300 && (o.hp<o.maxHp*0.97 || !(o.elderBuffT>0)) && (o.aggroed || o.hp<o.maxHp));
    if(needs){ e.elderCastT = 0.75; e.elderCd = 4.5 + Math.random()*1.5; g.particles.push({type:'ring', x:e.x, y:e.y, t:0.75, max:0.75, r:70, color:'#9fe07a'}); try{ sfxPlay('heal', 0.5); }catch(err){} return; }
  }
  const reach = e.r+target.r+6;
  if(tickEnemyWindup(g, e, target, isFollowerTarget, reach, dt)) return;
  if(d <= reach){ e.moving = false; if(e.atkCd<=0) beginEnemyMelee(e); return; }
  const want = 190;
  let ang = null;
  if(d > want+50) ang = steerAngleTo(e, target.x, target.y, room.obstacles);
  else if(d < want-70) ang = Math.atan2(e.y-target.y, e.x-target.x);
  if(ang!=null){
    const nx = e.x + Math.cos(ang)*e.speed*chillMult*dt, ny = e.y + Math.sin(ang)*e.speed*chillMult*dt;
    if(!posBlockedByObstacles(nx, ny, e.r*0.6, room.obstacles)){ e.x = nx; e.y = ny; e.moving = true; } else e.moving = false;
  } else e.moving = false;
  const fa = Math.atan2(target.y-e.y, target.x-e.x); e.facing = {x:Math.cos(fa), y:Math.sin(fa)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y);
}
function trollElderPulse(g, e){
  for(const o of g.enemies){
    if(!(o.hp>0) || dist(o,e) > 300) continue;
    o.hp = Math.min(o.maxHp, o.hp + o.maxHp*0.12);
    if(!(o.elderBuffT>0)){ o.dmg *= 1.25; o.speed *= 1.15; }
    o.elderBuffT = 6;
    g.particles.push({type:'burst', x:o.x, y:o.y-10, t:0.5, max:0.5, color:'#9fe07a'});
  }
  g.particles.push({type:'ring', x:e.x, y:e.y, t:0.6, max:0.6, r:300, color:'#7fd060'});
}
function drawElderBuffAura(e){
  if(!(e.elderBuffT>0)) return;
  const iso = toIso(e.x,e.y), a = 0.25 + 0.12*Math.sin((game.clock||0)*8 + e.x);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, 0.45);
  const rg = ctx.createRadialGradient(0,0,e.r*0.4,0,0,e.r*1.7); rg.addColorStop(0,'rgba(255,110,50,'+a.toFixed(2)+')'); rg.addColorStop(1,'rgba(255,80,30,0)');
  ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0,0,e.r*1.7,0,7); ctx.fill(); ctx.restore();
}
// Hill Giant: towering, slow; raises a stone-headed club overhead (telegraphed ring) and smashes the ground
function drawGiantIso(e){
  const iso = toIso(e.x,e.y), face = e.faceSign||1, t = e.animT||0, flash = e.hitT>0, s = e.r/40;
  const tele = e.tState==='tele', wind = e.windT>0, walk = e.moving ? Math.sin(t*3.2) : 0, br = Math.sin(t*1.3);
  const SK = flash?'#fff':'#b29a7e', SKD = flash?'#eee':'#806a54', HIDE = flash?'#fff':'#5e4a34', HIDED = flash?'#ddd':'#3e2e20', HAIR = flash?'#fff':'#6a5038';
  drawShadow(iso.x, iso.y, 46*s, 16*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s*1.25, s*1.25); ctx.lineJoin='round'; ctx.lineCap='round';
  // legs
  for(const sd of [-1,1]){ const st = sd*walk*7; ctx.fillStyle = SKD; ctx.beginPath(); ctx.moveTo(sd*6-8,-50); ctx.lineTo(sd*6+8,-50); ctx.lineTo(sd*10+st+9,-4); ctx.lineTo(sd*10+st-9,-4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = HIDED; ctx.beginPath(); ctx.ellipse(sd*10+st, -3, 12, 5, 0, 0, 7); ctx.fill(); }
  const armUp = tele ? -2.6 : wind ? -1.7 : 0.25 + walk*0.15;
  const arm = (sd, back)=>{
    const sx = sd*20, sy = -96 + br;
    const a = sd>0 ? armUp : 0.4 - walk*0.15;
    const ex = sx + Math.sin(a)*30*sd*(sd>0?1:0.6) + (sd<0?-6:0), ey = sy + Math.cos(a)*30;
    const hx = ex + Math.sin(a)*26*(sd>0?1:0.5), hy = ey + Math.cos(a)*26;
    ctx.strokeStyle = back ? SKD : SK; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.lineTo(hx,hy); ctx.stroke();
    if(sd>0){ // the club: a tree-trunk haft with a lashed boulder head
      const ca = Math.atan2(hy-ey, hx-ex), L = 64;
      const cx = hx + Math.cos(ca)*L, cy = hy + Math.sin(ca)*L;
      ctx.strokeStyle = flash?'#fff':'#4a3420'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(hx-Math.cos(ca)*8, hy-Math.sin(ca)*8); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.fillStyle = flash?'#fff':'#7a7a78'; ctx.strokeStyle = '#2e2e30'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy, 17, 14, ca, 0, 7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = flash?'#fff':'#5a4228'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx-Math.cos(ca)*14, cy-Math.sin(ca)*14-6); ctx.lineTo(cx-Math.cos(ca)*14, cy-Math.sin(ca)*14+6); ctx.stroke();
    }
    ctx.fillStyle = back ? SKD : SK; ctx.beginPath(); ctx.arc(hx,hy,7,0,7); ctx.fill();
  };
  arm(-1, true);
  // torso: barrel chest and belly, hide kilt and a fur mantle
  const tg = ctx.createLinearGradient(-26,-110,26,-40); tg.addColorStop(0,SK); tg.addColorStop(1,SKD);
  ctx.fillStyle = flash?'#fff':tg; ctx.beginPath(); ctx.moveTo(-24,-46); ctx.bezierCurveTo(-34,-70,-30,-100,-18,-106); ctx.lineTo(18,-106); ctx.bezierCurveTo(32,-100,36,-70,24,-46); ctx.closePath(); ctx.fill();
  ctx.fillStyle = HIDE; ctx.beginPath(); ctx.moveTo(-26,-56); ctx.lineTo(26,-56); ctx.lineTo(22,-30); ctx.lineTo(10,-36); ctx.lineTo(0,-28); ctx.lineTo(-12,-36); ctx.lineTo(-22,-30); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = HIDED; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-26,-56); ctx.lineTo(26,-56); ctx.stroke();
  ctx.fillStyle = HAIR; ctx.beginPath(); ctx.ellipse(0,-104,30,10,0,0,7); ctx.fill();
  ctx.strokeStyle = 'rgba(60,40,28,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-6,-92); ctx.quadraticCurveTo(0,-84,6,-92); ctx.stroke();
  // head: small for the body, heavy brow, wild beard
  ctx.fillStyle = SK; ctx.beginPath(); ctx.ellipse(0,-120,11,13,0,0,7); ctx.fill();
  ctx.fillStyle = HAIR; ctx.beginPath(); ctx.moveTo(-11,-116); ctx.quadraticCurveTo(-10,-96,0,-94); ctx.quadraticCurveTo(10,-96,11,-116); ctx.quadraticCurveTo(0,-108,-11,-116); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,-131,11,5,0,0,7); ctx.fill();
  ctx.fillStyle = '#1e1410'; ctx.fillRect(2,-123,4,2); ctx.fillRect(-5,-123,3,2);
  ctx.strokeStyle = SKD; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-7,-126); ctx.lineTo(8,-125); ctx.stroke();
  arm(1, false);
  ctx.restore();
  drawHpBar(iso, 175*s, e.r, e.hp, e.maxHp);
}
// Warg: a huge, dark, shaggy wolf with a bristling mane and burning eyes
function drawWargIso(e){
  const iso = toIso(e.x,e.y), face = e.faceSign||1, t = e.animT||0, flash = e.hitT>0, s = e.r/18;
  const run = e.moving ? Math.sin(t*14) : 0, bob = e.moving ? Math.abs(Math.sin(t*14))*2 : Math.sin(t*2)*0.6, atk = e.windT>0 || e.atkAnimT>0;
  const wh = e.variant==='white';   // v499: white wargs of the Mountain Pass
  const F = flash?'#fff':wh?'#e4e6ee':'#3a3634', FL = flash?'#fff':wh?'#f8f9fc':'#5a5450', FD = flash?'#ddd':wh?'#aeb4c4':'#1e1c1c';
  drawShadow(iso.x, iso.y, 28*s, 9*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s); ctx.lineCap='round'; ctx.lineJoin='round';
  const by = -22 + bob;
  // legs
  ctx.strokeStyle = FD; ctx.lineWidth = 5;
  for(const [lx,ph] of [[-16,0],[-9,Math.PI],[12,Math.PI*0.5],[19,Math.PI*1.5]]){ const sw = Math.sin(t*14+ph)*(e.moving?7:0); ctx.beginPath(); ctx.moveTo(lx, by+6); ctx.lineTo(lx+sw, -2); ctx.stroke(); }
  // tail
  ctx.strokeStyle = F; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-22, by-2); ctx.quadraticCurveTo(-34, by-8+run*3, -40, by+4); ctx.stroke();
  // body
  const gr = ctx.createLinearGradient(0, by-14, 0, by+12); gr.addColorStop(0, FL); gr.addColorStop(1, F);
  ctx.fillStyle = flash?'#fff':gr; ctx.beginPath(); ctx.ellipse(0, by, 25, 12, -0.05, 0, 7); ctx.fill();
  // bristling mane
  ctx.fillStyle = FD; ctx.beginPath(); ctx.moveTo(4, by-10); for(let i=0;i<7;i++){ ctx.lineTo(8+i*3, by-18-((i%2)*6)); ctx.lineTo(10+i*3, by-10); } ctx.lineTo(24, by+2); ctx.lineTo(6, by+4); ctx.closePath(); ctx.fill();
  // head
  const hx = 28 + (atk?5:0), hy = by-8 + (atk?2:0);
  ctx.fillStyle = F; ctx.beginPath(); ctx.ellipse(hx, hy, 10, 8, 0.15, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(hx+4, hy-3); ctx.lineTo(hx+19, hy+1); ctx.lineTo(hx+17, hy+6); ctx.lineTo(hx+4, hy+6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = FD; ctx.beginPath(); ctx.moveTo(hx-5,hy-6); ctx.lineTo(hx-3,hy-16); ctx.lineTo(hx+2,hy-7); ctx.closePath(); ctx.fill();
  if(atk){ ctx.fillStyle = '#5a1010'; ctx.beginPath(); ctx.moveTo(hx+6,hy+4); ctx.lineTo(hx+18,hy+4); ctx.lineTo(hx+14,hy+10); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#eee'; ctx.fillRect(hx+9,hy+3,2,3); ctx.fillRect(hx+14,hy+3,2,3); }
  ctx.fillStyle = flash?'#fff':'#ff5a2a'; ctx.beginPath(); ctx.arc(hx+5, hy-2, 1.8, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,90,40,0.35)'; ctx.beginPath(); ctx.arc(hx+5, hy-2, 4, 0, 7); ctx.fill();
  ctx.restore();
  drawHpBar(iso, 44*s, e.r, e.hp, e.maxHp);
}
// Roc: a vast raptor-bird gliding high, wings beating slow until it folds them to dive
function drawRocIso(e){
  const iso = toIso(e.x,e.y), t = e.animT||0, face = e.faceSign||1, flash = e.hitT>0, s = e.r/22, hop = e.hop||34;
  const tele = e.fState==='tele', dive = e.fState==='dive';
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(iso.x, iso.y, 30*s, 10*s, 0, 0, 7); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(iso.x, iso.y-hop-10); ctx.scale(face*s, s); ctx.lineJoin='round'; ctx.lineCap='round';
  const flap = dive ? -0.9 : tele ? Math.sin(t*14)*0.6 : Math.sin(t*4.2);
  const B = flash?'#fff':'#5a4632', BD = flash?'#ddd':'#3a2c20', BL = flash?'#fff':'#8a6e4e', HEAD = flash?'#fff':'#d8cdb4';
  for(const sd of [-1,1]){   // wings: long fingered primaries
    const lift = flap*16, span = dive ? 22 : 48;
    ctx.fillStyle = sd<0 ? BD : B;
    ctx.beginPath(); ctx.moveTo(-4, -2);
    ctx.quadraticCurveTo(-span*0.5, sd*6 - 20 - lift, -span, sd*10 - 10 - lift*1.4);
    for(let f=0; f<4; f++) ctx.lineTo(-span + f*7, sd*10 - 2 - lift*1.2 + f*3);
    ctx.quadraticCurveTo(-12, 6, -2, 4); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.scale(-1,1); ctx.fillStyle = sd<0 ? BD : B;
    ctx.beginPath(); ctx.moveTo(-4, -2); ctx.quadraticCurveTo(-span*0.5, sd*6 - 20 - lift, -span, sd*10 - 10 - lift*1.4);
    for(let f=0; f<4; f++) ctx.lineTo(-span + f*7, sd*10 - 2 - lift*1.2 + f*3);
    ctx.quadraticCurveTo(-12, 6, -2, 4); ctx.closePath(); ctx.fill(); ctx.restore();
    break;
  }
  // body + tail fan
  ctx.fillStyle = B; ctx.beginPath(); ctx.ellipse(0, 0, 16, 8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = BD; ctx.beginPath(); ctx.moveTo(-14,-2); ctx.lineTo(-28,-6); ctx.lineTo(-30,2); ctx.lineTo(-28,8); ctx.lineTo(-14,4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = BL; ctx.beginPath(); ctx.ellipse(2, 3, 10, 4, 0, 0, 7); ctx.fill();
  // pale head and hooked beak
  ctx.fillStyle = HEAD; ctx.beginPath(); ctx.ellipse(16, -4, 7, 6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = flash?'#fff':'#e0a83a'; ctx.beginPath(); ctx.moveTo(21,-6); ctx.lineTo(29,-3); ctx.quadraticCurveTo(28,1,24,1); ctx.lineTo(21,-1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.arc(18,-6,1.4,0,7); ctx.fill();
  if(dive){ ctx.strokeStyle = flash?'#fff':'#e0a83a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4,6); ctx.lineTo(10,14); ctx.moveTo(-2,6); ctx.lineTo(2,15); ctx.stroke(); }   // talons out
  ctx.restore();
  drawHpBar({x:iso.x, y:iso.y-hop}, 30*s, e.r, e.hp, e.maxHp);
}
// Mountain Ram: a shaggy giant ram with great curled horns; lowers its head and charges, bowling you over
function drawRamIso(e){
  const iso = toIso(e.x,e.y), face = e.faceSign||1, t = e.animT||0, flash = e.hitT>0, s = e.r/21;
  const wind = e.chargeState==='wind', charging = e.chargeState==='charging';
  const trot = e.moving ? Math.sin(t*(charging?18:9)) : 0, graze = !e.aggroed && !e.moving && Math.sin(t*0.7+e.x)>0.2;
  const WO = flash?'#fff':'#cdc4ae', WOD = flash?'#eee':'#9a907a', FACE = flash?'#fff':'#3a302a', HORN = flash?'#fff':'#a8946c', HORND = flash?'#ddd':'#6a5a40';
  drawShadow(iso.x, iso.y, 30*s, 10*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s); ctx.lineJoin='round'; ctx.lineCap='round';
  if(wind){ ctx.translate(Math.sin(t*40)*1.2, 0); }
  ctx.strokeStyle = FACE; ctx.lineWidth = 4.5;
  for(const [lx,ph] of [[-15,0],[-8,Math.PI],[11,Math.PI*0.5],[17,Math.PI*1.5]]){ const sw = Math.sin(t*(charging?18:9)+ph)*(e.moving?6:0); ctx.beginPath(); ctx.moveTo(lx,-14); ctx.lineTo(lx+sw,-1); ctx.stroke(); }
  // woolly body (lumpy outline)
  ctx.fillStyle = WOD; ctx.beginPath(); ctx.ellipse(0,-22,27,15,0,0,7); ctx.fill();
  ctx.fillStyle = WO; for(const [bx,by,r] of [[-14,-28,10],[-2,-32,11],[11,-29,10],[-18,-18,8],[18,-20,8],[2,-20,12]]){ ctx.beginPath(); ctx.arc(bx,by,r,0,7); ctx.fill(); }
  // head: low when grazing or charging
  const low = (graze||charging||wind) ? 12 : 0, hx = 26, hy = -30 + low;
  ctx.fillStyle = FACE; ctx.beginPath(); ctx.ellipse(hx, hy, 8, 9, 0.3, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(hx+3,hy+2); ctx.lineTo(hx+12,hy+7); ctx.lineTo(hx+5,hy+10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = WO; ctx.beginPath(); ctx.arc(hx-4, hy-6, 6, 0, 7); ctx.fill();
  // great curled horn
  ctx.strokeStyle = HORND; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(hx-2, hy-2, 9, -2.6, 1.6); ctx.stroke();
  ctx.strokeStyle = HORN; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.arc(hx-2, hy-2, 9, -2.6, 1.6); ctx.stroke();
  ctx.strokeStyle = 'rgba(60,48,32,0.6)'; ctx.lineWidth = 1; for(let a=-2.4; a<1.5; a+=0.5){ ctx.beginPath(); ctx.moveTo(hx-2+Math.cos(a)*6, hy-2+Math.sin(a)*6); ctx.lineTo(hx-2+Math.cos(a)*12, hy-2+Math.sin(a)*12); ctx.stroke(); }
  ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.arc(hx+3, hy-3, 1.4, 0, 7); ctx.fill();
  if(charging){ ctx.fillStyle = 'rgba(180,160,120,0.45)'; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(-26-i*9, -3-Math.random()*4, 4+i*2, 0, 7); ctx.fill(); } }   // kicked-up dust
  ctx.restore();
  drawHpBar(iso, 52*s, e.r, e.hp, e.maxHp);
}
// Mountain Troll: grey-green, hunched, tusked brute with a spiked bone club and tribal paint
function drawMtTrollIso(e){
  const iso = toIso(e.x,e.y), face = e.faceSign||1, t = e.animT||0, flash = e.hitT>0, s = e.r/26;
  const tele = e.tState==='tele', wind = e.windT>0, atk = e.atkAnimT>0, walk = e.moving ? Math.sin(t*5) : 0;
  const huddle = !e.aggroed && e.campFire && !e.moving;
  const SK = flash?'#fff':'#6e7a5e', SKD = flash?'#eee':'#4a5440', FUR = flash?'#fff':'#6a5232', PAINT = '#b03a2a';
  drawElderBuffAura(e);
  drawShadow(iso.x, iso.y, 30*s, 10*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s); ctx.lineJoin='round'; ctx.lineCap='round';
  const sit = huddle ? 10 : 0;
  // legs
  for(const sd of [-1,1]){ const st = sd*walk*6; ctx.strokeStyle = SKD; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(sd*7,-30+sit); ctx.lineTo(sd*9+st,-4); ctx.stroke(); ctx.fillStyle = SKD; ctx.beginPath(); ctx.ellipse(sd*10+st,-3,7,3.4,0,0,7); ctx.fill(); }
  // torso: hunched forward
  const tg = ctx.createLinearGradient(-20,-70,20,-26); tg.addColorStop(0,SK); tg.addColorStop(1,SKD);
  ctx.fillStyle = flash?'#fff':tg; ctx.beginPath(); ctx.moveTo(-16,-28+sit); ctx.bezierCurveTo(-26,-46,-22,-66,-6,-72+sit*0.5); ctx.bezierCurveTo(14,-74,26,-58,18,-28+sit); ctx.closePath(); ctx.fill();
  ctx.fillStyle = FUR; ctx.beginPath(); ctx.moveTo(-17,-34+sit); ctx.lineTo(18,-34+sit); ctx.lineTo(14,-18+sit); ctx.lineTo(4,-22+sit); ctx.lineTo(-6,-16+sit); ctx.lineTo(-15,-20+sit); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = PAINT; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-10,-58); ctx.lineTo(-2,-50); ctx.lineTo(-10,-42); ctx.moveTo(6,-60); ctx.lineTo(12,-52); ctx.stroke();
  // head: forward-slung, tusks, a crest of hair
  const hx = 12, hy = -70+sit*0.6;
  ctx.fillStyle = SK; ctx.beginPath(); ctx.ellipse(hx, hy, 10, 9, 0.2, 0, 7); ctx.fill();
  ctx.fillStyle = flash?'#fff':'#2a2620'; ctx.beginPath(); ctx.moveTo(hx-8,hy-6); for(let i=0;i<5;i++){ ctx.lineTo(hx-6+i*3, hy-14-(i%2)*3); ctx.lineTo(hx-4+i*3, hy-8); } ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#efe6cc'; ctx.beginPath(); ctx.moveTo(hx+5,hy+4); ctx.lineTo(hx+8,hy-3); ctx.lineTo(hx+9,hy+5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = flash?'#fff':'#f0c040'; ctx.beginPath(); ctx.arc(hx+5,hy-3,1.6,0,7); ctx.fill();
  ctx.strokeStyle = PAINT; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx-2,hy-1); ctx.lineTo(hx+8,hy+1); ctx.stroke();
  // club arm
  const armA = tele ? -2.5 : wind ? -1.6 : atk ? 0.9 : huddle ? 1.3 : 0.5 + walk*0.2;
  const sx = 14, sy = -60+sit, ex = sx + Math.sin(armA)*20, ey = sy + Math.cos(armA)*20, hx2 = ex + Math.sin(armA)*16, hy2 = ey + Math.cos(armA)*16;
  ctx.strokeStyle = SK; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.lineTo(hx2,hy2); ctx.stroke();
  const ca = armA - Math.PI/2*(tele||wind?1:-0.2), L = 40;
  const cx2 = hx2 + Math.cos(ca)*L*(face>0?1:1), cy2 = hy2 - Math.sin(ca)*L;
  ctx.strokeStyle = flash?'#fff':'#d8ccb0'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hx2, hy2); ctx.lineTo(cx2, cy2); ctx.stroke();
  ctx.fillStyle = flash?'#fff':'#e4d8bc'; ctx.beginPath(); ctx.ellipse(cx2, cy2, 9, 7, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#3a3226'; ctx.lineWidth = 2; for(const [a1,a2] of [[-6,-9],[6,-8],[0,-11]]){ ctx.beginPath(); ctx.moveTo(cx2+a1*0.6, cy2+a2*0.4); ctx.lineTo(cx2+a1, cy2+a2); ctx.stroke(); }
  ctx.restore();
  drawHpBar(iso, 92*s, e.r, e.hp, e.maxHp);
}
// Troll Elder: stooped, grey-bearded, wrapped in hides, leaning on a skull-topped totem staff that glows when it chants
function drawTrollElderIso(e){
  const iso = toIso(e.x,e.y), face = e.faceSign||1, t = e.animT||0, flash = e.hitT>0, s = e.r/24;
  const cast = e.elderCastT>0, walk = e.moving ? Math.sin(t*4) : 0;
  const SK = flash?'#fff':'#7a8466', SKD = flash?'#eee':'#55603e', ROBE = flash?'#fff':'#5a4430', ROBED = flash?'#ddd':'#3a2a1c', BEARD = flash?'#fff':'#c8c4b0';
  drawElderBuffAura(e);
  drawShadow(iso.x, iso.y, 26*s, 9*s);
  if(cast){ ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1,0.45); const rg = ctx.createRadialGradient(0,0,4,0,0,90); rg.addColorStop(0,'rgba(140,240,110,0.45)'); rg.addColorStop(1,'rgba(120,220,90,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0,0,90,0,7); ctx.fill(); ctx.restore(); }
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s); ctx.lineJoin='round'; ctx.lineCap='round';
  for(const sd of [-1,1]){ ctx.strokeStyle = SKD; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(sd*6,-24); ctx.lineTo(sd*7+sd*walk*4,-3); ctx.stroke(); }
  // hide robe
  ctx.fillStyle = ROBE; ctx.beginPath(); ctx.moveTo(-18,-6); ctx.lineTo(-14,-60); ctx.quadraticCurveTo(0,-70,14,-60); ctx.lineTo(18,-6); ctx.lineTo(8,-10); ctx.lineTo(0,-4); ctx.lineTo(-8,-10); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = ROBED; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-8,-56); ctx.lineTo(-10,-12); ctx.moveTo(6,-56); ctx.lineTo(8,-12); ctx.stroke();
  ctx.fillStyle = '#e0d6c0'; for(let i=0;i<5;i++){ ctx.beginPath(); ctx.arc(-10+i*5, -58+Math.abs(i-2)*1.5, 2, 0, 7); ctx.fill(); }   // bone necklace
  // head, stooped forward, long braided beard
  const hx = 9, hy = -70;
  ctx.fillStyle = SK; ctx.beginPath(); ctx.ellipse(hx, hy, 9, 8, 0.2, 0, 7); ctx.fill();
  ctx.fillStyle = BEARD; ctx.beginPath(); ctx.moveTo(hx-4,hy+2); ctx.quadraticCurveTo(hx+2,hy+22,hx+4,hy+30); ctx.quadraticCurveTo(hx+8,hy+18,hx+9,hy+2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = flash?'#fff':(cast?'#a8ff80':'#e8d070'); ctx.beginPath(); ctx.arc(hx+4,hy-2,1.6,0,7); ctx.fill();
  ctx.fillStyle = '#efe6cc'; ctx.beginPath(); ctx.moveTo(hx+5,hy+3); ctx.lineTo(hx+7,hy-2); ctx.lineTo(hx+8,hy+4); ctx.closePath(); ctx.fill();
  // totem staff, raised when chanting
  const lift = cast ? -18 : 0, sx = 20, top = -96 + lift;
  ctx.strokeStyle = flash?'#fff':'#4a3420'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx, -2+lift); ctx.lineTo(sx-2, top); ctx.stroke();
  ctx.strokeStyle = SK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(10,-58); ctx.lineTo(sx-1, -52+lift); ctx.stroke();
  ctx.fillStyle = '#e8e0cc'; ctx.beginPath(); ctx.ellipse(sx-2, top-6, 7, 7, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.arc(sx-4, top-7, 1.6, 0, 7); ctx.arc(sx+1, top-7, 1.6, 0, 7); ctx.fill();
  ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 1.2; for(const fx of [-6,0,6]){ ctx.beginPath(); ctx.moveTo(sx-2, top); ctx.lineTo(sx-2+fx, top+14+Math.sin(t*3+fx)*2); ctx.stroke(); }   // dangling feathers
  if(cast){ const gl = ctx.createRadialGradient(sx-2, top-6, 1, sx-2, top-6, 26); gl.addColorStop(0,'rgba(170,255,120,0.9)'); gl.addColorStop(1,'rgba(120,230,80,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(sx-2, top-6, 26, 0, 7); ctx.fill(); }
  ctx.restore();
  drawHpBar(iso, 100*s, e.r, e.hp, e.maxHp);
}
