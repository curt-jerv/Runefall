// ---- Minotaur (boss sprite): hulking bull-headed brute with a great axe; reuses the bear charge/swipe AI ----
function drawMinotaurIso(e){
  const iso = toIso(e.x,e.y);
  const face = e.faceSign||1, t = e.animT||0, moving = e.moving, flash = e.hitT>0;
  const s = e.r/30;
  drawShadow(iso.x, iso.y, 34*s, 12*s);
  ctx.save();
  ctx.translate(iso.x, iso.y);
  ctx.scale(face*s, s);
  const swF = e.windT>0 ? clamp(1 - e.windT/(e.windMax||0.5), 0, 1) : 0;
  const chF = e.chargeState==='wind' ? clamp(1 - e.chargeWindT/BEAR_CHARGE_WIND, 0, 1) : 0;
  const charging = e.chargeState==='charging';
  if(chF>0) ctx.translate(Math.sin(((game&&game.clock)||0)*70)*1.6*chF, 2*chF);
  const walk = moving ? Math.sin(t*6) : 0, bob = moving ? Math.abs(Math.sin(t*6))*2.4 : Math.sin(t*2)*0.9;
  const fur = flash?HIT_FLASH:'#6a4026', furL = flash?HIT_FLASH:'#8a5a38', furD = '#2a180e', skin = flash?HIT_FLASH:'#9a6a46';
  const lean = charging ? 0.25 : chF*0.18;
  // legs (digitigrade, hooved)
  ctx.strokeStyle = furD; ctx.lineCap = 'round';
  for(const [hx,ph] of [[-7,1],[7,-1]]){
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(hx,-28+bob); ctx.lineTo(hx+walk*ph*5-2,-14); ctx.lineTo(hx+walk*ph*6,-2); ctx.stroke();
    ctx.fillStyle = '#15100c'; ctx.beginPath(); ctx.ellipse(hx+walk*ph*6+1,0,6,3,0,0,7); ctx.fill();
  }
  ctx.save(); ctx.translate(0,-30+bob); ctx.rotate(lean); ctx.translate(0,30-bob);
  // torso -- broad chest, small waist
  const tg = ctx.createLinearGradient(-20,-66,20,-26); tg.addColorStop(0,furL); tg.addColorStop(1,fur);
  ctx.fillStyle = flash ? HIT_FLASH : tg; ctx.strokeStyle = furD; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(-14,-30+bob); ctx.quadraticCurveTo(-26,-46+bob,-20,-64+bob); ctx.quadraticCurveTo(0,-72+bob,20,-64+bob); ctx.quadraticCurveTo(26,-46+bob,14,-30+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,0.22)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(0,-62+bob); ctx.lineTo(0,-38+bob); ctx.moveTo(-9,-52+bob); ctx.quadraticCurveTo(-3,-48+bob,0,-50+bob); ctx.moveTo(9,-52+bob); ctx.quadraticCurveTo(3,-48+bob,0,-50+bob); ctx.stroke();
  // belt + loincloth
  ctx.fillStyle = flash?HIT_FLASH:'#3a2a1c'; ctx.fillRect(-15,-34+bob,30,6);
  ctx.fillStyle = flash?HIT_FLASH:'#b89a52'; ctx.fillRect(-3,-35+bob,6,8);
  ctx.fillStyle = flash?HIT_FLASH:'#5a3a2a'; ctx.beginPath(); ctx.moveTo(-12,-28+bob); ctx.lineTo(12,-28+bob); ctx.lineTo(8,-16+bob); ctx.lineTo(-8,-16+bob); ctx.closePath(); ctx.fill();
  // back arm
  ctx.strokeStyle = skin; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-18,-58+bob); ctx.lineTo(-26,-44+bob); ctx.lineTo(-20,-32+bob+walk*2); ctx.stroke();
  // axe + front arm (raises for the swipe)
  const aUp = swF*1.0, hx = 24, hy = -44+bob - aUp*22;
  ctx.strokeStyle = skin; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(17,-60+bob); ctx.lineTo(hx-2,hy+10); ctx.lineTo(hx,hy); ctx.stroke();
  ctx.save(); ctx.translate(hx,hy); ctx.rotate(-0.5 - aUp*1.1);
  ctx.strokeStyle='#4a3420'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(-2,22); ctx.lineTo(2,-44); ctx.stroke();
  ctx.fillStyle = flash?HIT_FLASH:'#8a9098'; ctx.strokeStyle='#22262a'; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.moveTo(2,-42); ctx.quadraticCurveTo(26,-50,28,-28); ctx.quadraticCurveTo(14,-30,2,-22); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2,-42); ctx.quadraticCurveTo(-18,-46,-18,-30); ctx.quadraticCurveTo(-8,-30,2,-24); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  // head: bull skull, nose ring, great horns
  const hdY = -70+bob + chF*6, hdX = 10 + (charging?6:0) + chF*4;
  ctx.fillStyle = flash?HIT_FLASH:furL; ctx.strokeStyle = furD; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(hdX,hdY,12,11,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = flash?HIT_FLASH:'#c59a78'; ctx.beginPath(); ctx.ellipse(hdX+10,hdY+5,8,6,0.1,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#1a100a'; ctx.beginPath(); ctx.arc(hdX+14,hdY+4,1.6,0,7); ctx.arc(hdX+9,hdY+6.5,1.3,0,7); ctx.fill();
  ctx.strokeStyle='#d8b84a'; ctx.lineWidth=1.8; ctx.beginPath(); ctx.arc(hdX+12,hdY+10,3.4,0.2,Math.PI-0.2); ctx.stroke();
  ctx.fillStyle = flash?HIT_FLASH:fur; ctx.strokeStyle=furD; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.ellipse(hdX-9,hdY-2,4.5,3,-0.5,0,7); ctx.fill(); ctx.stroke();
  // horns
  ctx.fillStyle = flash?HIT_FLASH:'#e6dcc0'; ctx.strokeStyle='#4a3e28'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(hdX-4,hdY-8); ctx.quadraticCurveTo(hdX-18,hdY-14,hdX-16,hdY-30); ctx.quadraticCurveTo(hdX-9,hdY-18,hdX+1,hdY-10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hdX+5,hdY-8); ctx.quadraticCurveTo(hdX+22,hdY-12,hdX+26,hdY-28); ctx.quadraticCurveTo(hdX+14,hdY-18,hdX+1,hdY-9); ctx.closePath(); ctx.fill(); ctx.stroke();
  const eg = (swF>0||chF>0||charging) ? '#ff2a1a' : '#ff8a3a';
  ctx.save(); ctx.shadowColor=eg; ctx.shadowBlur=6; ctx.fillStyle=eg; ctx.beginPath(); ctx.arc(hdX+6,hdY-2,2.2+(swF+chF)*1.2,0,7); ctx.fill(); ctx.restore();
  ctx.restore();
  ctx.restore();
  drawHpBar(iso, 92*s, e.r, e.hp, e.maxHp);
}
// Minotaur Cave entrance: a horned-skull lintel over a dark mouth in a rocky mound, lit by two braziers
function drawMinotaurCaveIso(pos, clock){
  const iso = toIso(pos.x, pos.y), t = clock||0;
  drawShadow(iso.x, iso.y+6, 84, 26);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle = 'rgba(30,26,30,0.9)'; ctx.beginPath(); ctx.ellipse(0,8,94,30,0,0,7); ctx.fill();
  const rg = ctx.createLinearGradient(-74,-96,74,4); rg.addColorStop(0,'#7a7880'); rg.addColorStop(0.6,'#4c4a52'); rg.addColorStop(1,'#2a282e');
  ctx.fillStyle = rg; ctx.strokeStyle = '#141216'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-78,6); ctx.lineTo(-76,-30); ctx.lineTo(-56,-64); ctx.lineTo(-28,-88); ctx.lineTo(6,-100); ctx.lineTo(40,-88); ctx.lineTo(66,-58); ctx.lineTo(78,-22); ctx.lineTo(80,6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.4;
  for(const [x1,y1,x2,y2] of [[-62,-30,-42,-48],[42,-68,60,-42],[-22,-88,-8,-72],[54,-24,70,-30]]){ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
  ctx.fillStyle = 'rgba(70,110,52,0.85)'; ctx.beginPath(); ctx.moveTo(-56,-64); ctx.lineTo(-28,-88); ctx.lineTo(6,-100); ctx.lineTo(40,-88); ctx.lineTo(66,-58); ctx.lineTo(44,-66); ctx.lineTo(10,-78); ctx.lineTo(-24,-70); ctx.closePath(); ctx.fill();
  // mouth
  ctx.fillStyle = '#040304';
  ctx.beginPath(); ctx.moveTo(-32,6); ctx.lineTo(-34,-22); ctx.quadraticCurveTo(-30,-56,0,-58); ctx.quadraticCurveTo(30,-56,34,-22); ctx.lineTo(32,6); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#1a1816'; ctx.lineWidth = 3; ctx.stroke();
  // bull skull above the mouth
  ctx.fillStyle = '#e8dfc6'; ctx.strokeStyle='#3a3020'; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.ellipse(0,-70,12,10,0,0,7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0,-62,7,6,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#120c08'; ctx.beginPath(); ctx.ellipse(-5,-72,2.8,3.2,0,0,7); ctx.ellipse(5,-72,2.8,3.2,0,0,7); ctx.fill(); ctx.beginPath(); ctx.ellipse(-2.5,-61,1.3,1.8,0,0,7); ctx.ellipse(2.5,-61,1.3,1.8,0,0,7); ctx.fill();
  ctx.fillStyle='#e8dfc6'; ctx.strokeStyle='#3a3020';
  for(const sx of [-1,1]){ ctx.beginPath(); ctx.moveTo(sx*9,-76); ctx.quadraticCurveTo(sx*34,-76,sx*40,-100); ctx.quadraticCurveTo(sx*26,-86,sx*6,-68); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // braziers
  for(const bx of [-54,54]){
    const fl = 0.75+0.25*Math.sin(t*8+bx);
    ctx.strokeStyle='#2a2018'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(bx,8); ctx.lineTo(bx,-18); ctx.stroke();
    ctx.fillStyle='#3a3026'; ctx.beginPath(); ctx.moveTo(bx-8,-18); ctx.lineTo(bx+8,-18); ctx.lineTo(bx+5,-10); ctx.lineTo(bx-5,-10); ctx.closePath(); ctx.fill();
    const gl = ctx.createRadialGradient(bx,-26,2,bx,-26,36); gl.addColorStop(0,'rgba(255,160,60,'+(0.4*fl)+')'); gl.addColorStop(1,'rgba(255,120,40,0)');
    ctx.fillStyle=gl; ctx.beginPath(); ctx.ellipse(bx,-26,38,30,0,0,7); ctx.fill();
    ctx.fillStyle='#e8541a'; ctx.beginPath(); ctx.moveTo(bx-6,-18); ctx.quadraticCurveTo(bx-5,-30*fl,bx,-38*fl); ctx.quadraticCurveTo(bx+6,-28*fl,bx+6,-18); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ffc94a'; ctx.beginPath(); ctx.moveTo(bx-3,-18); ctx.quadraticCurveTo(bx-2,-24*fl,bx,-28*fl); ctx.quadraticCurveTo(bx+3,-22*fl,bx+3,-18); ctx.closePath(); ctx.fill();
  }
  // hoofprints + bones
  ctx.fillStyle='rgba(10,8,6,0.5)'; for(let i=0;i<4;i++){ const px=-34+i*22, py=22+(i%2)*6; ctx.beginPath(); ctx.ellipse(px,py,4.4,3,0,0,7); ctx.fill(); ctx.beginPath(); ctx.ellipse(px+5,py,4.4,3,0,0,7); ctx.fill(); }
  ctx.strokeStyle='#d9d1bb'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-40,4); ctx.lineTo(-24,14); ctx.moveTo(40,14); ctx.lineTo(58,8); ctx.stroke();
  ctx.restore();
}

// category is passed in so rings/amulets can be excluded from ever rolling
// Common -- their rarity pool is just Magic/Rare, re-normalized from the
// same underlying weights every other slot uses at this character level.
//
// v82: takes the character's CURRENT LEVEL (not depth) -- depth no longer
// factors into item generation at all (it's untouched everywhere else,
// e.g. monster scaling). The ramp shape (common-only below a threshold,
// then rising rare/magic odds) is unchanged, just re-based from depth
// onto character level, per the task's "character-level-dependent
// equivalent" instruction.
// v83: optional 3rd arg `magicFindPct` (from the dropping player's item
// Magic Find % total, see recalcStats' p.magicFindPct) biases the roll
// toward Magic/Rare -- applied as a straight percentage-point boost to
// both the magic and rare bands before the common/no-common split below,
// capped so a heavily-geared character can't push Common's share to zero.
function pickRarity(charLevel, category, magicFindPct){
  // (v345) smooth curves: Rare is a real find (~1% at L6, ~6% at L20, 14% cap at L40), Magic ramps gently.
  const noCommon = category==='ring' || category==='amulet';
  const mf = clamp((magicFindPct||0)/100, 0, 0.5);
  const L = Math.max(1, charLevel||1);
  const rareChance = L < 8 ? 0 : clamp(0.005 + 0.0011*(L-7), 0, 0.045) + mf*0.05;   // v429 balance: rares were ~14% of all drops at L40; now ~3.5%
  const magicChance = clamp(0.06 + 0.008*(L-1), 0.06, 0.32) + mf*0.35;
  if(noCommon){
    if(Math.random() < rareChance*0.8) return 'rare';   // jewellery: never Common, Rare still rare
    return 'magic';
  }
  const r = Math.random();
  if(r < rareChance) return 'rare';
  if(r < rareChance+magicChance) return 'magic';
  return 'common';
}
// (v345) Rarity for special sources. Elites/bosses/packs: Magic at worst, Rare chance climbs with level.
function eliteRarity(L){ return Math.random() < clamp(0.04 + 0.005*(L-4), 0.04, 0.22) ? 'rare' : 'magic'; }
// v489: every boss can be fought again. The saved flag that says its quest item was already earned also marks a re-kill,
// which drops a guaranteed rare in place of that quest item.
function bossRekillFlag(e){
  if(!e || e.brBoss) return null;
  return e.kraken ? 'krakenSlain' : e.lvBoss ? 'leviathanSlain' : e.colossus ? 'colossusSlain' : e.mastodon ? 'partMastodon' : e.minotaur ? 'heartstoneTaken'
    : e.fhCmd ? 'fhCmdLooted' : e.dwc ? 'fhDungeonDone' : e.defiler ? 'inscriptionTaken' : null;
}
function bossRekillRare(g, at){
  const p = g.player, it = classRewardItem(p, Math.max(p.level, monsterLevel(g)), 'rare');
  g.loot.push({type:'item', x:at.x+rand(-14,14), y:at.y+rand(-14,14), r:8, item:it});
}
function bossRarity(L){ return Math.random() < clamp(0.15 + 0.012*(L-5), 0.15, 0.40) ? 'rare' : 'magic'; }
function packRarity(L){ return Math.random() < clamp(0.02 + 0.003*L, 0.02, 0.10) ? 'rare' : 'magic'; }
// Chests/quest rewards: Rare chance scales with level (0 at L8 and below, 75% cap); otherwise a guaranteed 2-mod Magic.
function rewardRarity(L){ return Math.random() < clamp((L-8)*0.02, 0, 0.5) ? 'rare' : 'magic'; }

