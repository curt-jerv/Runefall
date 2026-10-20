// ---- Redridge monsters (v153) ----
function drawArmordonIso(e){
  const iso = toIso(e.x,e.y), face=e.faceSign||1, t=e.animT||0, flash=e.hitT>0, s=e.r/26;
  const tele = e.tState==='tele', swing = e.tState==='swing';
  const refl = e.reflectFlashT>0, ready = !(e.reflectCd>0);
  drawShadow(iso.x, iso.y, 40*s, 13*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  const skin = flash?'#fff':'#8a5a3a', dark = flash?'#fff':'#4e2f1c';
  const plate = flash?'#fff':(refl?'#fff3b0':'#b98a5c');
  const stride = e.moving ? Math.sin(t*7)*4 : 0;
  // legs
  ctx.strokeStyle=dark; ctx.lineWidth=7; ctx.lineCap='round';
  for(const [lx,ph] of [[-16,0],[-6,Math.PI],[8,Math.PI],[18,0]]){
    const off = Math.sin(t*7+ph)*(e.moving?4:0);
    ctx.beginPath(); ctx.moveTo(lx,-10); ctx.lineTo(lx+off*0.5,-2); ctx.stroke();
  }
  // tail: heavy, ends in a bony club. Rears back when telegraphing, whips around when swinging.
  let ta = 0.25 + Math.sin(t*2)*0.08;
  if(tele) ta = -0.9 - (1-clamp(e.tT/0.75,0,1))*0.5 + Math.sin(t*30)*0.05;
  else if(swing) ta = -1.4 + (1-clamp(e.tT/0.3,0,1))*2.9;
  const px=-22, py=-16, L=46;
  const tx = px - Math.cos(ta)*L, ty = py + Math.sin(ta)*L*0.6 + (tele?-12:0);
  ctx.strokeStyle=skin; ctx.lineWidth=9;
  ctx.beginPath(); ctx.moveTo(px,py); ctx.quadraticCurveTo((px+tx)/2, py-4, tx, ty); ctx.stroke();
  ctx.fillStyle=plate; ctx.strokeStyle='#2a1608'; ctx.lineWidth=1.3;
  ctx.beginPath(); ctx.ellipse(tx,ty,10,8,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle=dark; for(const a of [-1,0,1]){ ctx.beginPath(); ctx.moveTo(tx+a*5-2,ty-6); ctx.lineTo(tx+a*5,ty-13); ctx.lineTo(tx+a*5+2,ty-6); ctx.closePath(); ctx.fill(); }
  // body
  ctx.fillStyle=skin; ctx.beginPath(); ctx.ellipse(0,-20,27,17,0,0,7); ctx.fill(); ctx.stroke();
  // armour plates
  for(let i=0;i<5;i++){
    const ax=-18+i*9, ay=-33+Math.abs(i-2)*1.6;
    ctx.fillStyle=plate; ctx.beginPath(); ctx.ellipse(ax,ay,6.5,5,0,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle=dark; ctx.beginPath(); ctx.moveTo(ax-2.2,ay-3.5); ctx.lineTo(ax,ay-8.5); ctx.lineTo(ax+2.2,ay-3.5); ctx.closePath(); ctx.fill();
  }
  // metallic gleam sweeping the plates while reflect is ready
  if(ready && !flash){
    const gx = -20 + ((t*22)%50);
    ctx.fillStyle='rgba(255,246,200,0.55)'; ctx.beginPath(); ctx.ellipse(gx,-33,3,6,0.4,0,7); ctx.fill();
  }
  if(refl){ ctx.strokeStyle='rgba(255,240,170,0.9)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,-22,34,22,0,0,7); ctx.stroke(); }
  // head: low, beaked, with brow horns
  ctx.fillStyle=skin; ctx.beginPath(); ctx.ellipse(27,-15,11,8,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle=plate; ctx.beginPath(); ctx.moveTo(30,-10); ctx.lineTo(40,-9); ctx.lineTo(31,-5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle=dark; ctx.beginPath(); ctx.moveTo(24,-21); ctx.lineTo(20,-29); ctx.lineTo(28,-22); ctx.closePath(); ctx.fill();
  ctx.fillStyle=(tele||swing)?'#ff4a2a':'#f0d060'; ctx.beginPath(); ctx.arc(30,-17,2,0,7); ctx.fill();
  ctx.restore();
  drawHpBar(iso, 54*s, e.r*1.3, e.hp, e.maxHp);
}
function drawRaptorIso(e, pal){
  pal = pal || {};
  const iso = toIso(e.x,e.y), face=e.faceSign||1, t=e.animT||0, flash=e.hitT>0, s=e.r/14;
  const air = e.tState==='air', tele = e.tState==='tele', hop = e.hop||0;
  drawShadow(iso.x, iso.y, (20-hop*0.2)*s, 7*s);
  ctx.save(); ctx.translate(iso.x, iso.y-hop); ctx.scale(face*s, s*(tele?0.85:1));
  const skin = flash?'#fff':(pal.skin||'#a8622e'), dark = flash?'#fff':(pal.dark||'#5a2f14'), belly = flash?'#fff':(pal.belly||'#e0b27a');
  const run = e.moving && !air ? Math.sin(t*14) : 0;
  // legs
  ctx.strokeStyle=dark; ctx.lineWidth=3.6; ctx.lineCap='round'; ctx.lineJoin='round';
  const l1 = air ? 5 : run*6, l2 = air ? 8 : -run*6;
  ctx.beginPath(); ctx.moveTo(-2,-10); ctx.lineTo(-5+l1,-4); ctx.lineTo(-2+l1,0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3,-10); ctx.lineTo(6+l2,-4); ctx.lineTo(9+l2,0); ctx.stroke();
  // tail
  ctx.strokeStyle=skin; ctx.lineWidth=5;
  ctx.beginPath(); ctx.moveTo(-10,-15); ctx.quadraticCurveTo(-22,-17+Math.sin(t*6)*2,-32,-12+(air?-6:0)); ctx.stroke();
  // body, leaning forward
  ctx.fillStyle=skin; ctx.beginPath(); ctx.ellipse(0,-16,13,8,-0.25,0,7); ctx.fill();
  ctx.strokeStyle='#2a1408'; ctx.lineWidth=1.1; ctx.stroke();
  ctx.fillStyle=belly; ctx.beginPath(); ctx.ellipse(2,-13,9,3.2,-0.25,0,Math.PI); ctx.fill();
  // stripes
  ctx.strokeStyle=dark; ctx.lineWidth=1.4;
  for(const sx of [-6,-1,4]){ ctx.beginPath(); ctx.moveTo(sx,-23); ctx.lineTo(sx+1,-17); ctx.stroke(); }
  // small arms with claws (extended forward mid-leap)
  ctx.strokeStyle=dark; ctx.lineWidth=2.4;
  ctx.beginPath(); ctx.moveTo(9,-14); ctx.lineTo(air?18:14,air?-16:-10); ctx.stroke();
  // neck + head
  ctx.strokeStyle=skin; ctx.lineWidth=6;
  ctx.beginPath(); ctx.moveTo(9,-20); ctx.lineTo(14,-27); ctx.stroke();
  ctx.fillStyle=skin; ctx.beginPath(); ctx.ellipse(18,-28,7,4.2,-0.15,0,7); ctx.fill();
  ctx.strokeStyle='#2a1408'; ctx.lineWidth=1; ctx.stroke();
  const jaw = (air||tele)?3.5:Math.max(0,Math.sin(t*4))*1.2;
  ctx.fillStyle=belly; ctx.beginPath(); ctx.moveTo(14,-26); ctx.lineTo(25,-26+jaw); ctx.lineTo(14,-24); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#fff'; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(19+i*2,-26); ctx.lineTo(19.8+i*2,-24.5+jaw*0.6); ctx.lineTo(20.6+i*2,-26); ctx.fill(); }
  ctx.fillStyle=(tele||air)?(pal.eyeA||'#ff3a2a'):(pal.eyeB||'#f4d040'); ctx.beginPath(); ctx.arc(19,-30,1.7,0,7); ctx.fill();
  ctx.restore();
  drawHpBar(iso, 34*s, e.r, e.hp, e.maxHp);
}
function drawSandSnakeIso(e){
  const iso = toIso(e.x,e.y), face=e.faceSign||1, t=e.animT||0, flash=e.hitT>0, s=e.r/12;
  const bur = !!e.burrow, N = 11, amp = e.moving?5:2.5, spd = e.moving?11:3;
  if(!bur) drawShadow(iso.x, iso.y, 20*s, 6*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  if(bur){
    // half-buried: a dust ridge with only the back showing
    ctx.fillStyle='rgba(120,70,40,0.55)'; ctx.beginPath(); ctx.ellipse(-4,2,24,6,0,0,7); ctx.fill();
    ctx.fillStyle='rgba(230,190,130,0.7)';
    for(let i=0;i<4;i++){ const px=8-i*8+Math.sin(t*10+i)*1.5; ctx.beginPath(); ctx.ellipse(px,-1-((i+1)%2)*1.6,4.2,2.2,0,0,7); ctx.fill(); }
  } else {
    const pos = (i)=>({x:18-i*3.6, y:-7+Math.sin(t*spd-i*0.8)*amp});
    for(let i=N-1;i>=0;i--){
      const q=pos(i), rad=4.6-i*0.26;
      ctx.fillStyle = flash?'#fff':(i%2?'#c9a45a':'#b8924a');
      ctx.beginPath(); ctx.ellipse(q.x,q.y,rad,rad*0.95,0,0,7); ctx.fill();
      if(i%2===0 && !flash){ ctx.fillStyle='#6a4a20'; ctx.beginPath(); ctx.moveTo(q.x-2.6,q.y-rad*0.4); ctx.lineTo(q.x,q.y-rad*0.95); ctx.lineTo(q.x+2.6,q.y-rad*0.4); ctx.lineTo(q.x,q.y+rad*0.1); ctx.closePath(); ctx.fill(); }
    }
    // rattle tail tip
    const tl = pos(N-1); ctx.fillStyle = flash?'#fff':'#e8d8a8'; ctx.beginPath(); ctx.ellipse(tl.x-4,tl.y,2.6,1.8,0,0,7); ctx.fill();
    const hd = pos(0), rear = e.atkAnimT>0;
    ctx.fillStyle = flash?'#fff':'#d2ad60';
    ctx.beginPath(); ctx.ellipse(hd.x+3,hd.y-(rear?3:0),6.4,4.2,0,0,7); ctx.fill();
    ctx.strokeStyle='#4a3010'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle='#d03a20'; ctx.beginPath(); ctx.arc(hd.x+4,hd.y-2-(rear?3:0),1.4,0,7); ctx.fill();
    if(rear || (Math.floor(t*2.4)%3===0)){
      ctx.strokeStyle='#d0304a'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(hd.x+9,hd.y-(rear?3:0)); ctx.lineTo(hd.x+14,hd.y-(rear?3:0)); ctx.lineTo(hd.x+16.5,hd.y-1.5-(rear?3:0)); ctx.moveTo(hd.x+14,hd.y-(rear?3:0)); ctx.lineTo(hd.x+16.5,hd.y+1.5-(rear?3:0)); ctx.stroke();
    }
  }
  ctx.restore();
  if(!bur) drawHpBar(iso, 22*s, e.r, e.hp, e.maxHp);
}
// telegraphs: armordon tail-sweep ring, raptor landing circle
function drawRedridgeTelegraph(e){
  ctx.save();
  if(e.type==='armordon' && (e.tState==='tele' || e.tState==='swing')){
    const swing = e.tState==='swing';
    const frac = swing ? 1 : clamp(1-e.tT/0.75,0,1), iso = toIso(e.x,e.y);
    ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    const R = (ARMORDON_TAIL_R+14)*ISO_KX*Math.SQRT2;
    ctx.strokeStyle='rgba(255,110,50,'+(swing?1:(0.5+frac*0.5))+')'; ctx.lineWidth=swing?4:2.5;
    ctx.beginPath(); ctx.arc(0,0,R,0,7); ctx.stroke();
    ctx.fillStyle='rgba(255,90,40,'+(swing?0.35:(0.08+frac*0.24))+')';
    ctx.beginPath(); ctx.arc(0,0,swing?R:R*frac,0,7); ctx.fill();
  } else if(e.type==='raptor' && e.tState==='tele' && e.tPt){
    const frac = clamp(1-e.tT/0.4,0,1), iso = toIso(e.tPt.x,e.tPt.y);
    ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle='rgba(255,170,70,'+(0.5+frac*0.5)+')'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(0,0,(RAPTOR_LEAP_R+14)*ISO_KX*Math.SQRT2,0,7); ctx.stroke();
    ctx.fillStyle='rgba(255,150,60,'+(0.10+frac*0.28)+')';
    ctx.beginPath(); ctx.arc(0,0,(RAPTOR_LEAP_R+14)*ISO_KX*Math.SQRT2*frac,0,7); ctx.fill();
  }
  ctx.restore();
}
// telegraphs for the marsh's gator lunge lane and toad landing zone
function drawMarshTelegraph(e){
  ctx.save();
  if(e.type==='alligator' && e.lungeState==='tele'){
    const frac = clamp(1-e.lungeT/0.45,0,1), L=170, hw=e.r;
    const ca=Math.cos(e.lungeDir), sa=Math.sin(e.lungeDir);
    const pts=[[0,-hw],[L,-hw],[L,hw],[0,hw]].map(([u,v])=>toIso(e.x+ca*u-sa*v, e.y+sa*u+ca*v));
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); for(let i=1;i<4;i++) ctx.lineTo(pts[i].x,pts[i].y); ctx.closePath();
    ctx.fillStyle='rgba(230,60,40,'+(0.12+frac*0.28)+')'; ctx.fill();
    ctx.strokeStyle='rgba(255,90,60,'+(0.5+frac*0.5)+')'; ctx.lineWidth=2; ctx.stroke();
  } else if(e.type==='giantoad' && e.tState==='tele' && e.tPt){
    const frac = clamp(1-e.tT/0.6,0,1), iso = toIso(e.tPt.x,e.tPt.y);
    ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle='rgba(140,240,90,'+(0.5+frac*0.5)+')'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(0,0,TOAD_SPLASH_R*ISO_KX,0,7); ctx.stroke();
    ctx.fillStyle='rgba(140,240,90,'+(0.10+frac*0.28)+')';
    ctx.beginPath(); ctx.arc(0,0,TOAD_SPLASH_R*ISO_KX*frac,0,7); ctx.fill();
  }
  ctx.restore();
}

function drawEnemyIsoBase(e){
  if(e.wraith){ drawWraithIso(e); return; }
  if(e.minotaur){ drawMinotaurIso(e); return; }
  if(e.mastodon) drawMastodonIso(e);
  else if(e.rev) drawRevenantIso(e);
  else if(e.prot) drawProtectorIso(e);
  else if(e.wraith) drawWraithIso(e);
  else if(e.type==='fhdwarf' || e.type==='fhbrute' || e.type==='fhaxe' || e.type==='fhcleric') drawFrostholdIso(e);
  else if(e.hw) drawHwKnightIso(e);
  else if(e.type==='fhtemplar') (e.fhCmd ? drawFhCommanderIso(e) : drawTemplarIso(e));
  else if(e.type==='cultist') drawCultistIso(e);
  else if(e.type==='fhturret') drawTurretIso(e);
  else if(e.type==='cogcrawler' || e.type==='gearguard' || e.type==='coilsentry') drawConstructIso(e);
  else if(e.type==='dwconstruct') drawDwConstructIso(e);
  else if(e.type==='spider') drawSpiderIso(e);
  else if(e.type==='wolf') drawWolfIso(e);
  else if(e.type==='giant'){ drawElderBuffAura(e); drawGiantIso(e); }
  else if(e.type==='warg'){ drawElderBuffAura(e); drawWargIso(e); }
  else if(e.type==='roc') drawRocIso(e);
  else if(e.type==='ram') drawRamIso(e);
  else if(e.type==='mtroll') drawMtTrollIso(e);
  else if(e.type==='trollelder') drawTrollElderIso(e);
  else if(e.type==='bear') drawBearIso(e);
  else if(e.type==='treant') drawTreantIso(e);
  else if(e.type==='boar') drawBoarIso(e);
  else if(e.type==='boss') drawBossDemon(e);
  else if(e.type==='balrog') drawBalrogIso(e);
  else if(e.type==='leviathan') (e.kraken ? drawKrakenIso(e) : drawLeviathanIso(e));
  else if(e.type==='alligator') drawGatorIso(e);
  else if(e.type==='tortuga') drawTortugaIso(e);
  else if(e.type==='anaconda') drawAnacondaIso(e);
  else if(e.type==='giantoad') drawToadIso(e);
  else if(e.type==='poisonplant') drawPoisonPlantIso(e);
  else if(e.type==='armordon') drawArmordonIso(e);
  else if(e.type==='lightningraptor') drawLightningRaptorIso(e);
  else if(e.type==='gojira') drawGojiraIso(e);
  else if(e.type==='trex') drawTrexIso(e);
  else if(e.type==='raptor' && e.stormRaptor){ drawRaptorIso(e, STORM_RAPTOR_PAL); drawStormRaptorFx(e); }
  else if(e.type==='raptor') drawRaptorIso(e, e.fireRaptor ? {skin:'#c4501e', dark:'#5a1a08', belly:'#ffd48a', eyeA:'#ffe', eyeB:'#fc6'} : undefined);
  else if(e.type==='sandsnake') drawSandSnakeIso(e);
  else if(e.type==='crawler') drawCrawlerIso(e);
  else if(e.type==='buffalo') drawBuffaloIso(e);
  else if(e.type==='stormsnake') (e.squid ? drawSquidIso(e) : e.eel ? drawEelIso(e) : drawStormSnakeIso(e));
  else if(e.type==='lavabeetle') drawLavaBeetleIso(e);
  else if(CLF_TYPES[e.type]) drawCliffMonsterIso(e);
  else if(KP_TYPES[e.type]) drawKeepMonsterIso(e);
  else if(e.type==='firebat') drawFireBatIso(e);
  else if(e.type==='magmagolem') drawMagmaGolemIso(e);
  else if(e.type==='magmacrawler') drawMagmaCrawlerIso(e);
  else if(e.type==='colossus') drawColossusIso(e);
  else if(e.type==='zombie' || e.type==='frozenzombie') drawZombieEnemy(e);
  else drawDemon(e);
}
// Leviathan (Lakeside Ruins, v71): a serpent that lives in the water --
// while inactive (player far away, see the e.type==='leviathan' branch in
// update()) it's drawn as barely more than a submerged ripple/fin, then
// rises into a proper coiled sea-serpent silhouette (a humped body arcing
// out of the water, a snake-like head with glowing eyes) once active. Not
// built on the humanoid drawDemon rig at all -- like the Spider, it gets
// its own shape since nothing about it reads as bipedal.
function drawLeviathanIso(e){
  const iso = toIso(e.x,e.y);
  const t = e.animT||0, flash = e.hitT>0;
  const boss = !!e.lvBoss;
  const s = boss ? e.r/24 : e.r/34;
  if(!e.active || e.sub){
    // submerged: faint ripples on the surface
    ctx.save(); ctx.translate(iso.x, iso.y);
    ctx.globalAlpha = 0.4 + Math.sin(t*1.5)*0.1;
    ctx.strokeStyle = '#bfe8dc'; ctx.lineWidth = 1.4;
    for(let i=0;i<2;i++){ ctx.beginPath(); ctx.ellipse(0, 4, (18+i*14+Math.sin(t*1.2+i)*3)*(boss?2.2:1.4), (7+i*5)*(boss?2.2:1.4), 0, 0, 7); ctx.stroke(); }
    if(e.sub){ ctx.globalAlpha=0.25; ctx.fillStyle='#0a1a16'; ctx.beginPath(); ctx.ellipse(0,6,60,20,0,0,7); ctx.fill(); }
    ctx.restore();
    return;
  }
  const face = e.faceSign||1;
  const exposed = e.exposedT>0, tele = (e.lvState==='volleyTele'||e.lvState==='surgeTele'||e.lvState==='emergeTele');
  const jaw = (e.atkAnimT>0 || tele) ? 1 : 0.15;
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s, s);
  // water: layered wake rings
  ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle='#bfe8dc';
  ctx.beginPath(); ctx.ellipse(0, 16, 62, 17, 0, 0, 7); ctx.fill();
  ctx.globalAlpha = 0.5; ctx.strokeStyle='#e8fff6'; ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.ellipse(0, 16, 70+Math.sin(t*2)*4, 20+Math.sin(t*2)*1.2, 0, 0, 7); ctx.stroke();
  ctx.restore();
  // body: five arching humps, rippling
  const humps = [];
  for(let i=0;i<5;i++){
    const hx = -face*(10+i*17) + 6*face*0;   // body trails behind the head
    const arch = Math.sin((i+0.5)/5*Math.PI)*16;
    const hy = -arch + Math.sin(t*2.4 + i*0.9)*3;
    humps.push([hx, hy, 13-i*0.9]);
  }
  for(let i=humps.length-1;i>=0;i--){
    const [hx,hy,hr] = humps[i];
    const g2 = ctx.createLinearGradient(hx-hr,hy-hr,hx+hr,hy+hr);
    g2.addColorStop(0, exposed?'#c9e86a':'#3e8a86'); g2.addColorStop(0.6,'#1f4a55'); g2.addColorStop(1,'#152a44');
    ctx.fillStyle = flash ? HIT_FLASH : g2;
    ctx.beginPath(); ctx.ellipse(hx, hy, hr, hr*0.72, 0, 0, 7); ctx.fill();
    ctx.strokeStyle='#0a1a22'; ctx.lineWidth=1.2; ctx.stroke();
    // belly stripe glow
    ctx.fillStyle='rgba(160,255,180,0.5)'; ctx.beginPath(); ctx.ellipse(hx, hy+hr*0.35, hr*0.7, hr*0.16, 0, 0, 7); ctx.fill();
    // dorsal spike
    ctx.fillStyle = flash ? HIT_FLASH : '#8a4fd0';
    ctx.beginPath(); ctx.moveTo(hx-4,hy-hr*0.6); ctx.lineTo(hx,hy-hr-9); ctx.lineTo(hx+4,hy-hr*0.6); ctx.closePath(); ctx.fill();
  }
  // tail fluke
  const tx = -face*(10+5*17), ty = -2+Math.sin(t*3)*4;
  ctx.fillStyle = flash ? HIT_FLASH : '#8a4fd0';
  ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(tx-face*12,ty-10); ctx.lineTo(tx-face*8,ty); ctx.lineTo(tx-face*12,ty+9); ctx.closePath(); ctx.fill();
  // neck + head, rearing above the water
  const nx = face*18, ny = -30+Math.sin(t*2.2)*2.5;
  ctx.strokeStyle = flash ? HIT_FLASH : '#2b6a6a'; ctx.lineWidth = 12; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(humps[0][0], humps[0][1]-4); ctx.quadraticCurveTo(face*4, -34, nx, ny); ctx.stroke();
  // crest fan
  ctx.fillStyle = flash ? HIT_FLASH : '#8a4fd0';
  for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(nx-face*2, ny-6); ctx.lineTo(nx-face*(12+Math.abs(i)*-2), ny-14+i*8-6); ctx.lineTo(nx-face*4, ny-2+i*3); ctx.closePath(); ctx.fill(); }
  // skull + jaws
  ctx.fillStyle = flash ? HIT_FLASH : '#2e7a72';
  ctx.beginPath(); ctx.ellipse(nx+face*6, ny-2, 14, 8, 0, 0, 7); ctx.fill(); ctx.strokeStyle='#0a1a22'; ctx.lineWidth=1.2; ctx.stroke();
  ctx.fillStyle = flash ? HIT_FLASH : '#1f5a58';
  ctx.beginPath(); ctx.ellipse(nx+face*7, ny+3+jaw*6, 12, 4.5, face*jaw*0.25, 0, 7); ctx.fill(); ctx.stroke();
  // fangs
  ctx.fillStyle='#f4f0d8';
  for(const fx of [0,5,10]){ ctx.beginPath(); ctx.moveTo(nx+face*(6+fx),ny+2); ctx.lineTo(nx+face*(8+fx),ny+2+3+jaw*6); ctx.lineTo(nx+face*(10+fx),ny+2); ctx.closePath(); ctx.fill(); }
  // glowing eye + poison glow in the maw when telegraphing
  ctx.save(); ctx.shadowColor='#c8ff5a'; ctx.shadowBlur=8; ctx.fillStyle='#c8ff5a';
  ctx.beginPath(); ctx.arc(nx+face*10, ny-5, 2.4, 0, 7); ctx.fill(); ctx.restore();
  if(tele){ ctx.save(); ctx.globalAlpha=0.6+Math.sin(t*20)*0.3; ctx.fillStyle='#7dd45a'; ctx.shadowColor='#7dd45a'; ctx.shadowBlur=12;
    ctx.beginPath(); ctx.arc(nx+face*16, ny+4, 5, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.restore();
  if(boss){
    drawHpBar(iso, 92*s, e.r*1.7, e.hp, e.maxHp);
    ctx.save(); ctx.font="bold 11px Alegreya,Georgia, serif"; ctx.textAlign='center'; ctx.fillStyle=exposed?'#d7ff7a':'#9fe8c0'; ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=4;
    ctx.fillText(e.bossName+(exposed?'  — EXPOSED':''), iso.x, iso.y-92*s-8); ctx.restore();
  } else drawHpBar(iso, 60*s, e.r*0.6, e.hp, e.maxHp);
}
// The Kraken (Lakeside Ruins boss, lightning): a bulbous storm-blue mantle with six thrashing tentacles
// and arcs of electricity crawling between the tips. Reuses the bridge leviathan's state machine.
function drawKrakenIso(e){
  const iso = toIso(e.x,e.y);
  const t = e.animT||0, flash = e.hitT>0, s = e.r/36;
  if(!e.active || e.sub){
    ctx.save(); ctx.translate(iso.x, iso.y);
    ctx.globalAlpha = 0.4 + Math.sin(t*1.5)*0.1; ctx.strokeStyle = '#bfe0ff'; ctx.lineWidth = 1.4;
    for(let i=0;i<2;i++){ ctx.beginPath(); ctx.ellipse(0, 4, (18+i*14+Math.sin(t*1.2+i)*3)*2.2, (7+i*5)*2.2, 0, 0, 7); ctx.stroke(); }
    if(e.sub){ ctx.globalAlpha=0.25; ctx.fillStyle='#0a1024'; ctx.beginPath(); ctx.ellipse(0,6,60,20,0,0,7); ctx.fill(); }
    ctx.restore();
    return;
  }
  const exposed = e.exposedT>0, tele = (e.lvState==='volleyTele'||e.lvState==='surgeTele'||e.lvState==='emergeTele'||(e.krStrikes&&e.krStrikes.length>0));
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s, s);
  // wake rings
  ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle='#bfe0ff';
  ctx.beginPath(); ctx.ellipse(0, 16, 66, 18, 0, 0, 7); ctx.fill();
  ctx.globalAlpha = 0.5; ctx.strokeStyle='#e8f4ff'; ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.ellipse(0, 16, 74+Math.sin(t*2)*4, 21+Math.sin(t*2)*1.2, 0, 0, 7); ctx.stroke();
  ctx.restore();
  // six tentacles, swaying; raised while telegraphing
  const tips = [];
  for(let i=0;i<6;i++){
    const a = (i/5-0.5)*2.4, base = {x:Math.sin(a)*26, y:6};
    const lift = tele ? 1.5 : 1, sw = Math.sin(t*2.2+i*1.3);
    const tip = {x:Math.sin(a)*(58+sw*8), y:-18*lift-Math.cos(a)*22+sw*6};
    const mid = {x:Math.sin(a)*(46+sw*10), y:-4-14*lift+sw*4};
    ctx.strokeStyle = flash ? HIT_FLASH : (exposed ? '#a8c8ff' : '#3a4c9c'); ctx.lineWidth = 9; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.quadraticCurveTo(mid.x, mid.y-8, tip.x, tip.y); ctx.stroke();
    ctx.strokeStyle = flash ? HIT_FLASH : '#6a7ee0'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(base.x, base.y-1); ctx.quadraticCurveTo(mid.x, mid.y-9, tip.x, tip.y); ctx.stroke();
    tips.push(tip);
  }
  // mantle
  const g2 = ctx.createLinearGradient(-30,-70,30,10);
  g2.addColorStop(0, exposed?'#b6ceff':'#5666c8'); g2.addColorStop(0.6,'#2a3478'); g2.addColorStop(1,'#141a44');
  ctx.fillStyle = flash ? HIT_FLASH : g2;
  ctx.beginPath(); ctx.ellipse(0, -30, 30, 38, 0, 0, 7); ctx.fill(); ctx.strokeStyle='#0a0e26'; ctx.lineWidth=1.4; ctx.stroke();
  ctx.fillStyle='rgba(150,190,255,0.35)'; ctx.beginPath(); ctx.ellipse(-8, -46, 9, 16, -0.4, 0, 7); ctx.fill();
  // eyes
  const eyeCol = tele ? '#ffffff' : '#9fe0ff';
  ctx.save(); ctx.shadowColor='#8fd0ff'; ctx.shadowBlur=10; ctx.fillStyle=eyeCol;
  for(const ex of [-11,11]){ ctx.beginPath(); ctx.ellipse(ex, -22, 4.5, 3.2, 0, 0, 7); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle='#0a0e26'; for(const ex of [-11,11]){ ctx.beginPath(); ctx.ellipse(ex, -22, 1.4, 3, 0, 0, 7); ctx.fill(); }
  // electric arcs between tentacle tips and over the mantle
  const seed = Math.floor(t*12);
  ctx.strokeStyle='rgba(215,240,255,0.9)'; ctx.lineWidth=1.3; ctx.lineJoin='round';
  for(let i=0;i<tips.length-1;i++){
    if(((seed+i)%3)===0) continue;
    let a = tips[i], b = tips[i+1];
    ctx.beginPath(); ctx.moveTo(a.x, a.y);
    for(let k=1;k<4;k++){ const u=k/4; ctx.lineTo(a.x+(b.x-a.x)*u+(((seed*7+i*13+k*5)%9)-4), a.y+(b.y-a.y)*u+(((seed*11+i*7+k*3)%9)-4)-6); }
    ctx.lineTo(b.x,b.y); ctx.stroke();
  }
  if(tele){ ctx.save(); ctx.globalAlpha=0.35+Math.sin(t*20)*0.15; ctx.fillStyle='#cfe8ff'; ctx.beginPath(); ctx.ellipse(0,-30,34,42,0,0,7); ctx.fill(); ctx.restore(); }
  ctx.restore();
  drawHpBar(iso, 92*s, e.r*1.7, e.hp, e.maxHp);
  ctx.save(); ctx.font="bold 11px Alegreya,Georgia, serif"; ctx.textAlign='center'; ctx.fillStyle=exposed?'#d8ecff':'#9fd8ff'; ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=4;
  ctx.fillText(e.bossName+(exposed?'  — OVERCHARGED':''), iso.x, iso.y-92*s-8); ctx.restore();
}
// The boss demon gets its own dedicated rig instead of sharing the generic
// grunt/archer template -- a towering, broad-shouldered horned brute in the
// Diablo/Balrog mold: thick armored hide, curling ram horns, a mane of
// living fire licking off its shoulders and back, glowing molten cracks
// across its chest, and heavy clawed legs that visibly stride when it moves.
function drawBossDemon(e){
  const iso = toIso(e.x,e.y);
  const face = e.faceSign||1, t = e.animT||0;
  const moving = e.moving, atk = e.atkAnimT||0, flash = e.hitT>0;
  // Scaled down from the original 1.55x -- the boss was reading roughly 50%
  // too big on screen relative to its actual (unchanged) hitbox radius.
  const s = e.r/16*0.95;
  const torsoW=34, torsoH=40, legLen=24, headR=13;

  drawShadow(iso.x, iso.y, (torsoW+10)*s*0.9, (torsoW*0.4)*s);

  // pulsing hellfire aura, unmistakable at a glance
  ctx.save();
  const auraR = (torsoW+26)*s*(1+Math.sin(t*3)*0.07);
  const grd = ctx.createRadialGradient(iso.x, iso.y, auraR*0.12, iso.x, iso.y, auraR);
  grd.addColorStop(0, 'rgba(255,90,20,0.4)');
  grd.addColorStop(1, 'rgba(255,90,20,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(iso.x, iso.y, auraR, 0, 7); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(iso.x, iso.y);
  ctx.scale(face*s, s);

  const walk = moving ? Math.sin(t*7) : 0;
  const bob = moving ? Math.abs(Math.sin(t*7))*2.2 : Math.sin(t*2)*1.2;
  const legSwing = walk*9;
  const baseY = -legLen + bob;

  // fiery whip-like tail lashing behind
  const tailWag = Math.sin(t*3)*10;
  ctx.strokeStyle = flash ? HIT_FLASH : '#c8401c';
  ctx.lineWidth = 4; ctx.lineCap='round';
  ctx.beginPath();
  ctx.moveTo(-torsoW*0.2, baseY-torsoH*0.15);
  ctx.quadraticCurveTo(-torsoW*0.9+tailWag, baseY+8, -torsoW*1.3+tailWag*1.4, baseY-6);
  ctx.stroke();

  // massive clawed legs -- thick, digitigrade, visibly striding
  for(const side of [-1,1]){
    const sw = side<0 ? legSwing : -legSwing;
    ctx.fillStyle = flash ? HIT_FLASH : '#1c1210';
    roundRect(side*torsoW*0.28-4, baseY-legLen-sw*0.15, 8, legLen+sw*0.15, 3); ctx.fill();
    ctx.strokeStyle='#0a0605'; ctx.lineWidth=1; ctx.stroke();
    // clawed foot
    ctx.fillStyle = '#0e0808';
    ctx.beginPath(); ctx.moveTo(side*torsoW*0.28-6, baseY+1); ctx.lineTo(side*torsoW*0.28+2, baseY+1); ctx.lineTo(side*torsoW*0.28-2, baseY+7); ctx.closePath(); ctx.fill();
  }

  // molten-cracked hide torso -- broad, armored, Diablo-plate silhouette
  let torsoFill;
  if(flash){ torsoFill='#ffffff'; }
  else {
    const tg = ctx.createLinearGradient(-torsoW/2, baseY-torsoH, torsoW/2, baseY);
    tg.addColorStop(0, '#7a2a18'); tg.addColorStop(0.55,'#3a120a'); tg.addColorStop(1, '#1a0704');
    torsoFill = tg;
  }
  ctx.fillStyle = torsoFill;
  roundRect(-torsoW/2, baseY-torsoH, torsoW, torsoH, torsoW*0.24); ctx.fill();
  ctx.strokeStyle='#0e0503'; ctx.lineWidth=1.6; ctx.stroke();
  if(!flash){
    // glowing molten cracks across the chest
    ctx.strokeStyle = 'rgba(255,150,40,'+(0.5+Math.sin(t*4)*0.2)+')';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-torsoW*0.28,baseY-torsoH*0.75); ctx.lineTo(-torsoW*0.05,baseY-torsoH*0.45); ctx.lineTo(-torsoW*0.2,baseY-torsoH*0.15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(torsoW*0.22,baseY-torsoH*0.8); ctx.lineTo(torsoW*0.08,baseY-torsoH*0.5); ctx.lineTo(torsoW*0.26,baseY-torsoH*0.2); ctx.stroke();
  }

  // shoulder manes of living fire
  for(const side of [-1,1]){
    const flick = 0.85+Math.sin(t*10+side*2)*0.25;
    const fx = side*torsoW*0.52, fy = baseY-torsoH*0.88;
    const fg = ctx.createRadialGradient(fx,fy,1,fx,fy,10*flick);
    fg.addColorStop(0,'#ffe08a'); fg.addColorStop(0.5,'#ff7a2a'); fg.addColorStop(1,'rgba(200,40,10,0)');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(fx,fy,10*flick,0,7); ctx.fill();
  }

  // huge arms ending in claws, one raised when attacking or mid-slam-telegraph
  const reach = atk>0 ? 10 : (e.slamState==='telegraph' ? 14 : 0);
  for(const side of [-1,1]){
    const armY = baseY-torsoH*0.74;
    ctx.fillStyle = flash ? HIT_FLASH : '#2a1410';
    ctx.beginPath();
    ctx.moveTo(side*torsoW/2, armY);
    ctx.lineTo(side*(torsoW/2+9+reach), armY-(side<0?reach*0.4:  -reach*0.4)+9);
    ctx.lineTo(side*(torsoW/2+5+reach), armY+13);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#0e0503'; ctx.lineWidth=1; ctx.stroke();
    // claws
    ctx.fillStyle = '#0e0808';
    for(let c=-1;c<=1;c++){
      ctx.beginPath();
      ctx.moveTo(side*(torsoW/2+5+reach)+c*3, armY+11);
      ctx.lineTo(side*(torsoW/2+5+reach)+c*3+side*3, armY+18);
      ctx.lineTo(side*(torsoW/2+5+reach)+c*3+side, armY+11);
      ctx.closePath(); ctx.fill();
    }
  }

  // head: broad brow, sunken glowing eyes, heavy jaw, and long curling ram horns
  const headY = baseY-torsoH-headR*0.55;
  ctx.fillStyle = flash ? HIT_FLASH : '#241210';
  ctx.beginPath(); ctx.arc(0, headY, headR, 0.1, Math.PI-0.1); ctx.fill();
  ctx.fillStyle = flash ? HIT_FLASH : '#150a08';
  roundRect(-headR*0.75, headY-2, headR*1.5, headR*0.9, 3); ctx.fill(); // heavy jaw

  // curling ram horns sweeping back from the brow
  for(const side of [-1,1]){
    ctx.strokeStyle = flash ? HIT_FLASH : '#3a2418';
    ctx.lineWidth = 4.5; ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(side*headR*0.6, headY-headR*0.6);
    ctx.quadraticCurveTo(side*(headR*1.8), headY-headR*1.5, side*(headR*1.3), headY-headR*2.3);
    ctx.stroke();
    ctx.strokeStyle = flash ? HIT_FLASH : '#1c110a'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(side*headR*0.6, headY-headR*0.6);
    ctx.quadraticCurveTo(side*(headR*1.8), headY-headR*1.5, side*(headR*1.3), headY-headR*2.3);
    ctx.stroke();
  }

  // glowing molten eyes
  ctx.fillStyle = '#ffdd44';
  ctx.shadowColor = '#ff9020'; ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.ellipse(-headR*0.34, headY-1, 2.6, 1.8, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(headR*0.34, headY-1, 2.6, 1.8, 0, 0, 7); ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}

