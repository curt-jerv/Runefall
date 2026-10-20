// ---------------- Shrine Protectors (v127) ----------------
// Two warrior-skinned guardians of the Mountain Top Shrine, each tuned like a
// Warrior subclass and using the matching skills:
//   Defender  -- tank: Shield Bash (telegraphed stun+knockback), Shield Throw, and
//                Guardian (invulnerable at 66% / 33% HP -- swap to the other protector).
//   Berserker -- 2H: Bloodlust (attacks faster the lower its HP), Whirlwind (telegraphed spin,
//                then a vulnerable recovery), Assault frenzy at 40% HP.
// v482: the protectors are rebuilt on the current Warrior trees, and a Templar joins them:
//   Defender  -- Shield Slam (front stun), Shield Throw, Seismic Slam (telegraphed ground ring, chills),
//                Bulwark at 66% / 33% (cannot be hurt for 3s, then releases the blows it soaked as a shockwave).
//   Berserker -- Leap (marks your spot, then crashes down), Whirlwind, Bloodlust (faster and leeching as it bleeds),
//                Assault frenzy at 40%.
//   Templar   -- Smite (holy bolt, every third is a Wrath), Consecrate (holy ground that burns you and mends the
//                protectors standing in it), Judgment (pillars of holy fire around you) once below 60%.
const PROT_HP_MULT = {defender:4.6, berserker:3.6, templar:3.4}, PROT_DMG_MULT = {defender:0.85, berserker:1.0, templar:0.9};
const PROT_BASH_TELE = 0.7, PROT_BASH_R = 125, PROT_THROW_TELE = 0.5, PROT_GUARD_DUR = 3.0, PROT_GUARD_AT = [0.66, 0.33];
const PROT_SEIS_TELE = 0.95, PROT_SEIS_R = 175, PROT_BULWARK_R = 190;
const PROT_WW_TELE = 0.8, PROT_WW_DUR = 2.2, PROT_WW_R = 105, PROT_WW_TICK = 0.35, PROT_WW_TICK_MULT = 0.3, PROT_WW_REC = 1.1, PROT_RAGE_DUR = 8;
const PROT_LEAP_TELE = 0.6, PROT_LEAP_AIR = 0.45, PROT_LEAP_R = 95;
const PROT_SMITE_TELE = 0.45, PROT_CONS_R = 125, PROT_CONS_DUR = 6, PROT_JUDG_DELAY = 1.05, PROT_JUDG_R = 62;
const PROT_NAME = {defender:'Defender of the Summit', berserker:'Berserker of the Summit', templar:'Templar of the Summit'};
const PROT_COL = {defender:'120,180,255', berserker:'255,110,80', templar:'255,214,120'};
const PROT_CREST = {defender:'#3a6aa8', berserker:null, templar:'#f0e6c8'}, PROT_SHIELD = {defender:['#3a64a0','#16284a'], templar:['#f2ead2','#a89868']};
const PROT_CAPE = {defender:['#3f6a9a','#132438','#16243a','#0a1220'], berserker:null, templar:['#ece2c4','#7a6a44','#4a4028','#201a0e']};
function spawnShrineProtectors(g, iz){
  spawnProtector(g, 'defender',  {x:iz.altar.x-230, y:iz.altar.y-150});
  spawnProtector(g, 'templar',   {x:iz.altar.x-270, y:iz.altar.y});
  spawnProtector(g, 'berserker', {x:iz.altar.x-230, y:iz.altar.y+150});
}
function spawnProtector(g, kind, pos){
  const e = spawnEnemy(g, 'brute', pos);
  e.prot = kind; e.bossName = PROT_NAME[kind]; e.isLairBoss = true;
  e.r = 24; e.baseR = 24;
  e.hp = Math.round(e.hp*PROT_HP_MULT[kind]); e.maxHp = e.hp;
  e.dmg = e.dmg*PROT_DMG_MULT[kind]; e.baseDmg = e.dmg;
  if(kind==='defender'){
    e.armor = 26; e.speed = 62; e.atkCdMax = 1.3;
    e.eq = {mainhand:{slotType:'weapon1h'}, offhand:{slotType:'shield'}};
  } else if(kind==='templar'){
    e.armor = 16; e.speed = 66; e.atkCdMax = 1.2; e.smiteN = 0; e.judgCd = 3;
    e.eq = {mainhand:{slotType:'weapon1h'}, offhand:{slotType:'shield'}};
  } else {
    e.armor = 8; e.speed = 84; e.atkCdMax = 1.0;
    e.eq = {mainhand:{slotType:'weapon2h', twoHanded:true}};
  }
  e.baseAtkCd = e.atkCdMax;
  e.prState = 'chase'; e.prT = 0; e.prCd = rand(2,3.5); e.guardsDone = 0; e.rageDone = false; e.rageT = 0; e.invulnT = 0; e.prCd2 = rand(4,6);
  e.aggroRange = 380; e.leashRange = 800; e.wanderRadius = 25;
  return e;
}
function protHitArea(g, e, cx, cy, R, mult, kbAway, chill){
  const p = g.player;
  if(dist({x:cx,y:cy}, p) < R + p.r){
    playerDamage(g, teleDmg(e, mult), e, null);
    if(chill && !p.slowImmune) p.chillT = Math.max(p.chillT||0, 1.6);
  }
  if(g.followers) for(const f of g.followers) if(dist({x:cx,y:cy}, f) < R + f.r) applyFollowerDamage(g, f, e.dmg*mult, e);
}
function protHasTelegraph(e){
  return e.prState==='bashTele' || e.prState==='wwTele' || e.prState==='spin' || e.prState==='seisTele' || e.prState==='leapTele' || e.prState==='leaping' || e.prState==='guard' || !!e.consZone || !!(e.judg && e.judg.length);
}
function updateProtector(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  const p = g.player;
  const face = (ang)=>{ e.facing = {x:Math.cos(ang), y:Math.sin(ang)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); };
  e.moving = false;
  if(e.invulnT>0){ e.invulnT -= dt; if(e.hp<e.guardHp){ e.bwStored = (e.bwStored||0) + (e.guardHp - e.hp); e.hp = e.guardHp; } }
  // --- Defender: Bulwark at 66% / 33%
  if(e.prot==='defender' && e.prState!=='guard' && e.guardsDone<PROT_GUARD_AT.length && e.hp/e.maxHp <= PROT_GUARD_AT[e.guardsDone]){
    e.guardsDone++; e.prState='guard'; e.prT=PROT_GUARD_DUR; e.invulnT=PROT_GUARD_DUR; e.guardHp=e.hp; e.windT=0; e.bwStored = 0;
    g.particles.push({type:'ring', x:e.x, y:e.y, t:0.6, max:0.6, r:70, color:'#9cc8ff'});
    showMsg('The Defender raises Bulwark -- every blow you land will be thrown back. Fight the others!', 2.4);
  }
  // --- Berserker: Bloodlust + Assault
  if(e.prot==='berserker'){
    if(!e.rageDone && e.hp/e.maxHp <= 0.4){ e.rageDone = true; e.rageT = PROT_RAGE_DUR; showMsg('The Berserker enters Assault!', 1.8); }
    if(e.rageT>0) e.rageT -= dt;
    e.atkCdMax = e.baseAtkCd*(1 - 0.4*(1-e.hp/e.maxHp))*(e.rageT>0?0.8:1);
    e.dmg = e.baseDmg*(e.rageT>0?1.35:1);
    if(e._hp0!=null && p.hp < e._hp0 && p.lastHitBy===e) e.hp = Math.min(e.maxHp, e.hp + (e._hp0-p.hp)*0.25);   // Bloodlust leech
    e._hp0 = p.hp;
  }
  // --- Templar: Consecrate ground and Judgment pillars tick on their own
  if(e.consZone){
    const z = e.consZone; z.t -= dt; z.tick -= dt;
    if(z.tick<=0){ z.tick = 0.5;
      if(dist(z, p) < z.r + p.r) playerDamage(g, e.dmg*0.22, e, null);
      for(const o of g.enemies) if(o.prot && o.hp>0 && dist(z,o) < z.r) o.hp = Math.min(o.maxHp, o.hp + o.maxHp*0.006);
    }
    if(z.t<=0) e.consZone = null;
  }
  if(e.judg && e.judg.length){
    for(const j of e.judg){ j.t -= dt; if(j.t<=0 && !j.done){ j.done = true; protHitArea(g, e, j.x, j.y, PROT_JUDG_R, 0.65, 0);
      g.particles.push({type:'skybolt', x:j.x, y:j.y, t:0.32, max:0.32, seed:Math.random()*100, emp:true});
      g.particles.push({type:'ring', x:j.x, y:j.y, t:0.35, max:0.35, r:PROT_JUDG_R, color:'#ffe08a'}); } }
    e.judg = e.judg.filter(j=>!j.done || j.t > -0.3);
  }
  const spd = e.speed*chillMult*(e.rageT>0?1.25:1);
  const approach = (tx, ty, mult)=>{
    const ang = steerAngleTo(e, tx, ty, room.obstacles);
    e.x += Math.cos(ang)*spd*mult*dt; e.y += Math.sin(ang)*spd*mult*dt; e.moving = true; face(ang);
  };
  const st = e.prState;
  if(st==='chase'){
    e.prCd -= dt; e.prCd2 -= dt;
    if(tickEnemyWindup(g, e, target, isFollowerTarget, e.r+target.r+2, dt)) return;
    if(e.prot==='templar'){
      e.judgCd -= dt;
      if(e.hp/e.maxHp <= 0.6 && e.judgCd<=0 && d < 520){
        e.judgCd = 9; const n = 4; e.judg = [{x:target.x, y:target.y, t:PROT_JUDG_DELAY}];
        for(let i=1;i<n;i++){ const a = rand(0,7), r = rand(70,150); e.judg.push({x:target.x+Math.cos(a)*r, y:target.y+Math.sin(a)*r, t:PROT_JUDG_DELAY+i*0.18}); }
        showMsg('Judgment!', 1.0, '#ffe08a'); e.prState='recover'; e.prT=0.6; return;
      }
      if(e.prCd2<=0 && !e.consZone && d < 260){ e.consZone = {x:e.x, y:e.y, r:PROT_CONS_R, t:PROT_CONS_DUR, tick:0.3}; e.prCd2 = 11;
        g.particles.push({type:'ring', x:e.x, y:e.y, t:0.5, max:0.5, r:PROT_CONS_R, color:'#ffd27a'}); e.prState='recover'; e.prT=0.5; return; }
      if(e.prCd<=0 && d > 110 && d < 560){ e.prState='smiteTele'; e.prT=PROT_SMITE_TELE; e.windT=0; face(Math.atan2(target.y-e.y, target.x-e.x)); return; }
      if(d > 200) approach(target.x, target.y, 1);   // a caster: it closes in, but is happy to fight at range
      else if(d > e.r+target.r+2){ if(e.prCd>1.2) approach(target.x, target.y, 1); }
      else if(e.atkCd<=0) beginEnemyMelee(e);
      return;
    }
    if(e.prot==='defender' && e.prCd2<=0 && d < 150){ e.prState='seisTele'; e.prT=PROT_SEIS_TELE; e.windT=0; e.prCd2 = rand(7,9); return; }
    if(e.prot==='berserker' && e.prCd2<=0 && d > 150 && d < 460){ e.prState='leapTele'; e.prT=PROT_LEAP_TELE; e.leapTo = {x:target.x, y:target.y}; e.leapFrom = {x:e.x, y:e.y}; e.prCd2 = rand(6,8); face(Math.atan2(target.y-e.y, target.x-e.x)); return; }
    if(e.prCd<=0){
      if(e.prot==='defender'){
        if(d < 115){ e.prState='bashTele'; e.prT=PROT_BASH_TELE; e.windT=0; }
        else if(d > 190 && d < 520){ e.prState='throwTele'; e.prT=PROT_THROW_TELE; e.windT=0; face(Math.atan2(target.y-e.y, target.x-e.x)); }
      } else if(d < 380){ e.prState='wwTele'; e.prT=PROT_WW_TELE; e.windT=0; }
      if(e.prState!=='chase') return;
    }
    if(d > e.r+target.r+2) approach(target.x, target.y, 1);
    else if(e.atkCd<=0) beginEnemyMelee(e);
  } else if(st==='bashTele'){
    e.prT -= dt; e.atkAnimT = 0.1;
    if(e.prT<=0){
      protHitArea(g, e, e.x, e.y, PROT_BASH_R, 0.9, 110);
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.4, max:0.4, r:PROT_BASH_R, color:'#cfd8e6'});
      e.prState='recover'; e.prT=0.8; e.prCd=4.5;
    }
  } else if(st==='seisTele'){
    e.prT -= dt; e.atkAnimT = 0.1;
    if(e.prT<=0){
      protHitArea(g, e, e.x, e.y, PROT_SEIS_R, 0.75, 0, true);
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.5, max:0.5, r:PROT_SEIS_R, color:'#bcd6ff'});
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#9cc8ff'});
      shakeScreen(g, 6, 0.3);
      e.prState='recover'; e.prT=0.9; e.prCd=Math.max(e.prCd, 1.5);
    }
  } else if(st==='throwTele'){
    e.prT -= dt; e.atkAnimT = 0.1;
    if(e.prT<=0){
      const ang = Math.atan2(target.y-e.y, target.x-e.x);
      g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(ang)*300,vy:Math.sin(ang)*300,r:10,dmg:e.dmg*0.85,from:'enemy',life:1.8,color:'#dfe6f2',srcEnemy:e,targetRef:target});
      e.prState='recover'; e.prT=0.6; e.prCd=4;
    }
  } else if(st==='smiteTele'){
    e.prT -= dt; e.castAnimT = 0.2; e.atkAnimT = 0.1;
    if(e.prT<=0){
      e.smiteN = (e.smiteN||0) + 1; const wrath = e.smiteN % 3 === 0;
      const ang = Math.atan2(target.y-e.y, target.x-e.x), sp = wrath ? 330 : 400;
      g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,r:wrath?14:9,dmg:e.dmg*(wrath?1.6:0.9),from:'enemy',life:2.0,color:wrath?'#fff2b0':'#ffd870',srcEnemy:e,targetRef:target});
      if(wrath) showMsg('Wrath!', 0.8, '#ffe08a');
      e.prState='recover'; e.prT=0.5; e.prCd=rand(2.6,3.4);
    }
  } else if(st==='guard'){
    e.prT -= dt; e.atkAnimT = 0.1;
    if(e.prT<=0){
      // Bulwark releases: a shockwave whose power grows with what it soaked (capped)
      const mult = 0.6 + Math.min(1.2, (e.bwStored||0)/Math.max(1, e.maxHp)*6);
      protHitArea(g, e, e.x, e.y, PROT_BULWARK_R, mult, 0);
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.55, max:0.55, r:PROT_BULWARK_R, color:'#9cc8ff'});
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.4, max:0.4, r:PROT_BULWARK_R*0.6, color:'#ffffff'});
      shakeScreen(g, 8, 0.35);
      e.prState='chase'; e.prCd=1.5; e.bwStored = 0;
    }
  } else if(st==='wwTele'){
    e.prT -= dt; e.atkAnimT = 0.1;
    if(e.prT<=0){ e.prState='spin'; e.prT=PROT_WW_DUR; e.wwTick=0; }
  } else if(st==='spin'){
    e.prT -= dt; e.wwTick -= dt;
    approach(target.x, target.y, 0.7);
    e.atkAnimT = 0.15;
    if(e.wwTick<=0){
      e.wwTick = PROT_WW_TICK;
      protHitArea(g, e, e.x, e.y, PROT_WW_R, PROT_WW_TICK_MULT, 0);
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.25, max:0.25, color:'#e8eef6'});
    }
    if(e.prT<=0){ e.prState='recover'; e.prT=PROT_WW_REC; e.prCd=(e.rageT>0?6:8); }
  } else if(st==='leapTele'){
    e.prT -= dt; e.atkAnimT = 0.1;
    if(e.prT<=0){ e.prState='leaping'; e.prT=PROT_LEAP_AIR; }
  } else if(st==='leaping'){
    e.prT -= dt; const f = clamp(1 - e.prT/PROT_LEAP_AIR, 0, 1);
    e.x = e.leapFrom.x + (e.leapTo.x-e.leapFrom.x)*f; e.y = e.leapFrom.y + (e.leapTo.y-e.leapFrom.y)*f;
    e.liftZ = Math.sin(f*Math.PI)*60; e.moving = true;
    if(e.prT<=0){
      e.liftZ = 0;
      protHitArea(g, e, e.x, e.y, PROT_LEAP_R, 1.1, 0);
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.45, max:0.45, r:PROT_LEAP_R, color:'#ffb080'});
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.35, max:0.35, color:'#ff7a50'});
      shakeScreen(g, 7, 0.3);
      e.prState='recover'; e.prT=0.7; e.prCd=Math.max(e.prCd, 1.2);
    }
  } else { // recover
    e.prT -= dt;
    if(e.prT<=0) e.prState='chase';
  }
  e.x = clamp(e.x, e.r, room.w-e.r); e.y = clamp(e.y, e.r, room.h-e.r);
}
function protRing(x, y, R, frac, col, fill){
  const iso = toIso(x,y);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
  ctx.strokeStyle='rgba('+col+','+(0.5+frac*0.5)+')'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.arc(0,0,R*ISO_KX,0,7); ctx.stroke();
  ctx.fillStyle='rgba('+col+','+(0.10+frac*0.22)+')';
  ctx.beginPath(); ctx.arc(0,0,R*ISO_KX*(fill?1:frac),0,7); ctx.fill();
  ctx.restore();
}
function drawProtectorTelegraph(e){
  if(e.consZone){ const z = e.consZone, pul = 0.5+0.5*Math.sin(((game&&game.clock)||0)*5);
    const iso = toIso(z.x,z.y); ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    const gr = ctx.createRadialGradient(0,0,0,0,0,z.r*ISO_KX); gr.addColorStop(0,'rgba(255,220,130,'+(0.20+0.08*pul)+')'); gr.addColorStop(1,'rgba(255,190,80,0.04)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0,0,z.r*ISO_KX,0,7); ctx.fill();
    ctx.strokeStyle='rgba(255,226,140,'+(0.55+0.3*pul)+')'; ctx.lineWidth=2; ctx.setLineDash([8,6]); ctx.beginPath(); ctx.arc(0,0,z.r*ISO_KX,0,7); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore(); }
  if(e.judg) for(const j of e.judg) if(!j.done) protRing(j.x, j.y, PROT_JUDG_R, clamp(1-j.t/PROT_JUDG_DELAY,0,1), '255,224,138');
  if(e.prState==='bashTele') protRing(e.x, e.y, PROT_BASH_R, clamp(1-e.prT/PROT_BASH_TELE,0,1), '120,180,255');
  else if(e.prState==='seisTele') protRing(e.x, e.y, PROT_SEIS_R, clamp(1-e.prT/PROT_SEIS_TELE,0,1), '150,200,255');
  else if(e.prState==='guard') protRing(e.x, e.y, PROT_BULWARK_R, clamp(1-e.prT/PROT_GUARD_DUR,0,1), '150,200,255');
  else if(e.prState==='wwTele') protRing(e.x, e.y, PROT_WW_R, clamp(1-e.prT/PROT_WW_TELE,0,1), '255,90,60');
  else if(e.prState==='spin') protRing(e.x, e.y, PROT_WW_R, 1, '255,90,60', true);
  else if(e.prState==='leapTele') protRing(e.leapTo.x, e.leapTo.y, PROT_LEAP_R, clamp(1-e.prT/PROT_LEAP_TELE,0,1)*0.6, '255,120,70');
  else if(e.prState==='leaping') protRing(e.leapTo.x, e.leapTo.y, PROT_LEAP_R, 0.6+0.4*clamp(1-e.prT/PROT_LEAP_AIR,0,1), '255,120,70');
}
// Drawn with the player's own Warrior rig (drawWarrior) fed a proxy of the enemy.
function drawProtectorIso(e){
  const iso = toIso(e.x,e.y);
  const col = PROT_COL[e.prot] || '255,110,80';
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
  ctx.strokeStyle='rgba('+col+',0.55)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,e.r*1.25,0,7); ctx.stroke();
  if(e.prot==='templar'){ ctx.setLineDash([5,5]); ctx.strokeStyle='rgba(255,214,120,0.35)'; ctx.beginPath(); ctx.arc(0,0,e.r*1.75,0,7); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
  const lift = e.liftZ||0;
  const pv = {x:e.x - lift*0.5, y:e.y - lift*0.5, r:e.r*0.95, faceSign:e.faceSign||1, animT:e.animT||0, moving:e.moving, atkAnimT:Math.min(e.atkAnimT||0,0.22), castAnimT:e.castAnimT||0,
    hitFlash:e.hitT>0?0.2:0, equipment:e.eq, blocking:(e.prState==='guard'||e.prState==='bashTele'||e.prState==='throwTele'||e.prState==='seisTele'),
    guardianT:e.invulnT>0?1:0, assaultT:e.rageT>0?e.rageT:0, assaultDurMax:PROT_RAGE_DUR, dodging:false, invuln:0, iceArmorT:0, vanishT:0, lookBody:3, lookHelm:3, capeT:PROT_CAPE[e.prot]||null, crestC:PROT_CREST[e.prot]||null, shieldT:PROT_SHIELD[e.prot]||null, noShadow:lift>4};
  if(e.castAnimT>0) e.castAnimT = Math.max(0, e.castAnimT - 1/60);
  drawWarrior(pv);
  const s = e.r/16;
  drawHpBar(iso, 50*s, e.r*1.6, e.hp, e.maxHp);
  ctx.save(); ctx.font="bold 11px Alegreya,Georgia, serif"; ctx.textAlign='center'; ctx.fillStyle='rgb('+col+')'; ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=4;
  ctx.fillText(e.bossName, iso.x, iso.y-50*s-8); ctx.restore();
}

