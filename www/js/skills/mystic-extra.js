// ---- v466 Djinn: Static Buildup, Stormcall, Windrunner ----
const STATIC_MAX = 8, STATIC_GAP = 0.15;
const STORMCALL_CD = 4, STORMCALL_DELAY = 0.7, STORMCALL_R = 95, STORMCALL_RANGE = 440, STORMCALL_CHAIN_R = 230, STORMCALL_CHAIN_MULT = 0.5;
const WR_SKILLS = {lightningArc:1, nova:1, stormcall:1};
function staticRank(p){ return (p && p.cls==='mystic' && p.skills && effectiveRank(p,'staticBuildup')) || 0; }
function staticEmpowerMult(r){ return 1.4 + 0.05*(Math.max(1,r)-1); }
// a lightning hit builds a Static stack (one per STATIC_GAP, so a big Nova doesn't fill the bar in one go)
function staticOnLightningHit(p){
  const r = staticRank(p); if(r<=0) return;
  const now = (game && game.clock) || 0;
  if(now - (p._staticT||-9) < STATIC_GAP) return;
  p._staticT = now;
  if((p.staticStacks||0) < STATIC_MAX){ p.staticStacks = (p.staticStacks||0) + 1; if(p.staticStacks>=STATIC_MAX && game) game.particles.push({type:'ring', x:p.x, y:p.y, t:0.4, max:0.4, r:46, color:'#bfefff'}); }
}
// v481: Static also feeds Lightning Arc -- each stack adds Arc damage, and a full bar adds extra chains (stacks are NOT spent)
function staticArcPerStack(r){ return 0.03 + 0.005*(Math.max(1,r)-1); }
function staticArcChains(r){ return r>=5 ? 2 : 1; }
function staticArcBonus(p){
  const r = staticRank(p), n = p.staticStacks||0;
  if(r<=0) return {mult:1, chains:0};
  return {mult:1 + n*staticArcPerStack(r), chains: n>=STATIC_MAX ? staticArcChains(r) : 0};
}
// spend a full bar on Nova / Tornado / Stormcall: returns {mult, rad, charge} (or a plain result when not empowered)
const STATIC_STUN_DUR = 0.8, STATIC_STUN_WINDOW = 1.2;   // v489: the release's lightning hits within 1.2s stun normal enemies for 0.8s
function staticConsume(p){
  const r = staticRank(p);
  if(r<=0 || (p.staticStacks||0) < STATIC_MAX) return {mult:1, rad:1, charge:false, on:false};
  p.staticStacks = 0;
  if(game){ game.particles.push({type:'ring', x:p.x, y:p.y, t:0.45, max:0.45, r:90, color:'#ffffff'}); p.staticStunUntil = (game.clock||0) + STATIC_STUN_WINDOW; }   // v489: lightning hits from this release stun briefly
  return {mult:staticEmpowerMult(r), rad:1.3, charge:true, on:true};
}
function windRank(p){ return (p && p.cls==='mystic' && p.skills && effectiveRank(p,'windrunner')) || 0; }
function windDistNeeded(r){ return Math.max(380, 700 - 35*(Math.max(1,r)-1)); }
const WR_REGEN_RAMP = 5;
function windRegenPct(r){ r = Math.max(1, r||1); return 0.005 + 0.045*(Math.min(10,r)-1)/9 + 0.002*Math.max(0, r-10); }   // +0.5% max mana/s at rank 1 -> +5%/s at rank 10, after 5s of moving
function windDmgBonus(r){ return 0.25 + 0.03*(Math.max(1,r)-1); }
// called once per frame for the player
function windrunnerTick(g, p, dt){
  if(p._wrCostWin>0) p._wrCostWin -= dt;
  const r = windRank(p);
  const px = p._wrx, py = p._wry; p._wrx = p.x; p._wry = p.y;
  if(r<=0){ p.windReady = false; p.windDist = 0; p._wrMoveT = 0; return; }
  { const md = px!=null ? Math.hypot(p.x-px, p.y-py) : 0;   // v489: moving builds extra mana regeneration over 5s; stopping resets it
    p._wrMoveT = (md > 0.3 && md < 60) ? Math.min(WR_REGEN_RAMP, (p._wrMoveT||0) + dt) : 0;
    if(p._wrMoveT>0) gainResource(p, p.maxMp * windRegenPct(r) * (p._wrMoveT/WR_REGEN_RAMP) * dt); }
  if(px!=null && !p.windReady){
    const d = Math.hypot(p.x-px, p.y-py);
    if(d < 60) p.windDist = (p.windDist||0) + d;   // ignore teleports
    if(p.windDist >= windDistNeeded(r)){ p.windDist = 0; p.windReady = true; g.particles.push({type:'ring', x:p.x, y:p.y, t:0.4, max:0.4, r:40, color:'#d8f4ff'}); }
  }
  // at rank 5+, dodging through an enemy Charges it
  if(r>=5 && p.dodging && g.enemies){
    if(!p._wrHit) p._wrHit = new Set();
    for(const e of g.enemies){ if(e.hp>0 && !p._wrHit.has(e) && dist(p,e) < p.r + e.r + 6){ p._wrHit.add(e); lightningCharge(g, e, 0, 'enemy'); g.particles.push({type:'burst', x:e.x, y:e.y, t:0.25, max:0.25, color:'#bfefff'}); } }
  } else if(!p.dodging && p._wrHit) p._wrHit = null;
}
function windrunnerDodge(p){ if(windRank(p)>0 && !p.windReady) p.windDist = (p.windDist||0) + 200; }
// spend the stored energy on a lightning skill: returns the damage multiplier
function windConsume(p, id){
  if(!WR_SKILLS[id] || !p.windReady) return 1;
  p.windReady = false; p._wrCostWin = 0.1;
  return 1 + windDmgBonus(windRank(p));
}
function pickAoeSpot(g, p, R, range){
  let pos = null, best = -1, bd = 1e9;
  for(const en of g.enemies){
    if(!(en.hp>0)) continue; const dd = dist(p,en);
    if(dd > range || !hasLOS(g,p,en) || !enemyOnScreen(g,en)) continue;
    let sc = 0; for(const o of g.enemies) if(o.hp>0 && dist(o,en) < R) sc++;
    if(sc>best || (sc===best && dd<bd)){ best = sc; bd = dd; pos = {x:en.x, y:en.y}; }
  }
  if(!pos){ const fa = Math.atan2(p.facing.y, p.facing.x); pos = {x:clamp(p.x+Math.cos(fa)*200, 40, g.room.w-40), y:clamp(p.y+Math.sin(fa)*200, 40, g.room.h-40)}; }
  return pos;
}
function castStormcall(g, p, rank){
  const st = staticConsume(p), wm = windConsume(p, 'stormcall');
  const R = STORMCALL_R*aoeRadiusMult(p)*st.rad;
  const pos = pickAoeSpot(g, p, R, STORMCALL_RANGE);
  (p.stormcalls || (p.stormcalls = [])).push({x:pos.x, y:pos.y, t:0, r:R, rank, mult:st.mult*wm, emp:st.on});
  p.castAnimT = 0.3; p.movementStopT = Math.max(p.movementStopT||0, 0.15);
}
function updateStormcalls(g, p, dt){
  if(!p.stormcalls || !p.stormcalls.length) return;
  for(let i=p.stormcalls.length-1;i>=0;i--){
    const s = p.stormcalls[i]; s.t += dt;
    if(s.t < STORMCALL_DELAY){ g.particles.push({type:'stormMark', x:s.x, y:s.y, t:0.05, max:0.05, r:s.r, prog:s.t/STORMCALL_DELAY, emp:s.emp}); continue; }
    p.stormcalls.splice(i,1);
    const dmg = wpnDmg(p) * swd('stormcall', s.rank) * assaultDealtMult(p) * weaponDmgMult(p) * s.mult;
    const chainN = 2 + (s.rank>=5 ? 1 : 0) + (s.rank>=10 ? 1 : 0);
    const hit = [];
    for(const e of g.enemies){
      if(!(e.hp>0) || dist(s,e) > s.r+e.r) continue;
      const wasCharged = (e.charges||0) > 0 || s.emp;
      e.hp -= applyEnemyArmor(p, e, dmg, 0, 'lightning'); e.hitT = 0.2;
      if(s.emp) lightningCharge(g, e, 0, 'enemy');
      hit.push(e); checkExecute(g, e);
      if(wasCharged){   // a Charged target conducts the strike onward
        let from = e; const done = new Set(hit);
        for(let k=0;k<chainN;k++){
          const nx = nearestEnemy(g, from, STORMCALL_CHAIN_R, Array.from(done)); if(!nx) break;
          done.add(nx);
          nx.hp -= applyEnemyArmor(p, nx, dmg*STORMCALL_CHAIN_MULT, 0, 'lightning'); nx.hitT = 0.15; checkExecute(g, nx);
          g.particles.push({type:'bolt', x:from.x, y:from.y, x2:nx.x, y2:nx.y, t:0.25, max:0.25});
          from = nx;
        }
      }
    }
    g.particles.push({type:'skybolt', x:s.x, y:s.y, t:0.32, max:0.32, seed:Math.random()*100, emp:s.emp});
    g.particles.push({type:'ring', x:s.x, y:s.y, t:0.4, max:0.4, r:s.r, color:s.emp ? '#ffffff' : '#9fe8ff'});
    shakeScreen(g, s.emp ? 5 : 3, 0.18);
    try{ sfxPlay('thunder', s.emp ? 0.6 : 0.4); }catch(err){}
  }
}
function drawDjinnFx(p, iso, s){
  const ck = (game && game.clock) || 0;
  const n = p.staticStacks||0, full = n >= STATIC_MAX;
  ctx.save(); ctx.lineCap = 'round';
  if(n>0){
    for(let i=0;i<n;i++){
      const an = ck*(full?3.2:1.8) + i*6.283/STATIC_MAX, x = iso.x + Math.cos(an)*20*s, y = iso.y - 26*s + Math.sin(an)*8*s;
      ctx.strokeStyle = full ? '#ffffff' : '#9fe8ff'; ctx.lineWidth = full ? 1.6 : 1.2; ctx.globalAlpha = full ? 0.95 : 0.75;
      const j = Math.sin(ck*35+i)*1.5;
      ctx.beginPath(); ctx.moveTo(x-2*s, y-3*s); ctx.lineTo(x+1*s+j*0.3, y); ctx.lineTo(x-1*s, y+0.5*s); ctx.lineTo(x+2*s, y+3.5*s); ctx.stroke();
    }
    if(full){ ctx.globalAlpha = 0.25+0.2*Math.sin(ck*25); ctx.strokeStyle = '#bfefff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(iso.x, iso.y-26*s, 24*s, 12*s, 0, 0, 7); ctx.stroke(); }
  }
  if(p.windReady){
    ctx.globalAlpha = 0.7; ctx.strokeStyle = '#d8f4ff'; ctx.lineWidth = 1.6;
    for(let i=0;i<3;i++){ const a0 = ck*5 + i*2.1; ctx.beginPath(); ctx.ellipse(iso.x, iso.y-3, 15*s, 6*s, 0, a0, a0+1.6); ctx.stroke(); }
  }
  ctx.restore();
}
// ---- v474 Pursuit: once you have been running for a second, chasing monsters stride out to match your speed ----
// (replaces v462's gradual speed-up). Running away buys distance only if you were already ahead; stop and they settle back.
const PURSUIT_RUN_DELAY = 1.0, PURSUIT_EASE = 4;
function playerRunTime(g){
  const p = g.player; if(!p) return 0;
  const ck = g.clock||0;
  if(p._runStamp!==ck){
    const dt = Math.max(0, ck - (p._runStamp==null ? ck : p._runStamp)); p._runStamp = ck;
    const mv = (p._rx==null) ? 0 : Math.hypot(p.x-p._rx, p.y-p._ry); p._rx = p.x; p._ry = p.y;
    if(dt>0 && mv > (p.speed||BASE_SPEED)*dt*0.5 && mv < (p.speed||BASE_SPEED)*dt*3) p._runT = (p._runT||0) + dt;   // walking, not dodging or teleporting
    else if(dt>0) p._runT = 0;
  }
  return p._runT||0;
}
// v481: wolves circle -- when a packmate is already in melee with you, an incoming wolf pulls up at a short distance,
// pauses, then slinks sideways for about a second before it darts in too. Once per approach.
const WOLF_CIRCLE_R = 120;
const PACK_CIRCLE = {wolf:'wolf', goblin:'goblin', raptor:'raptor', bandit:'bandit', banditbrute:'bandit', fhdwarf:'dwarf', fhbrute:'dwarf', warg:'warg', hellhound:'hound', ram:'ram'};   // v482 (v490: + wargs, hell hounds, rams)
function wolfCircle(g, e, target, d, dt, chillMult, room){
  if(d > 420) e._wcDone = false;
  if(e._wcT > 0){
    e._wcT -= dt;
    const ang = Math.atan2(e.y-target.y, e.x-target.x);
    if(e._wcT > e._wcMax - 0.25){ e.moving = false; return true; }   // the pause
    const want = WOLF_CIRCLE_R, radial = clamp((want - d)/40, -1, 1);
    const ta = ang + e._wcDir*Math.PI/2;
    let vx = Math.cos(ta) + Math.cos(ang)*radial*0.8, vy = Math.sin(ta) + Math.sin(ang)*radial*0.8; const vl = Math.hypot(vx,vy)||1;
    const sp = e.speed*0.55*chillMult;
    e.x += vx/vl*sp*dt; e.y += vy/vl*sp*dt; e.moving = true;
    pushOutOfObstacles(e, (room.obstacles||[]));
    return true;
  }
  if(e._wcDone || d > 175 || d < e.r+target.r+30) return false;
  let biting = false;
  const grp = PACK_CIRCLE[e.type];
  for(const w of g.enemies){ if(w===e || PACK_CIRCLE[w.type]!==grp || !(w.hp>0)) continue; if(dist(w,target) <= w.r+target.r+14){ biting = true; break; } }
  if(!biting) return false;
  e._wcDone = true; e._wcMax = e._wcT = rand(0.95, 1.3); e._wcDir = Math.random()<0.5 ? -1 : 1;
  e.moving = false; return true;
}
// v484: Barren Highlands giants -- about one engagement in four, a giant stops and bellows a war cry first
// (+20% damage and +15% speed for 8s once it lands).
function giantWarcry(g, e, d, dt){
  if(e.wcBuffT>0){ e.wcBuffT -= dt; if(e.wcBuffT<=0){ e.dmg = e.wcBaseDmg; e.speed = e.wcBaseSpd; } }
  if(d > 700) e._wcRolled = false;
  if(e.wcryT>0){
    e.wcryT -= dt; e.moving = false; e.atkAnimT = 0.14;
    if(Math.random()<dt*10) g.particles.push({type:'ring', x:e.x, y:e.y, t:0.35, max:0.35, r:40+Math.random()*40, color:'#e0a060'});
    if(e.wcryT<=0){
      if(!(e.wcBuffT>0)){ e.wcBaseDmg = e.dmg; e.wcBaseSpd = e.speed; e.dmg *= 1.2; e.speed *= 1.15; }
      e.wcBuffT = 8;
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.55, max:0.55, r:150, color:'#ff9a50'});
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#ffb070'});
      shakeScreen(g, 4, 0.3);
    }
    return true;
  }
  if(!e._wcRolled && d < 420){
    e._wcRolled = true;
    if(Math.random() < 0.25){ e.wcryT = 1.15; e.moving = false; try{ sfxPlay('bossRoar', 0.35); }catch(err){} return true; }
  }
  return false;
}
function pursuitMult(g, e, dt){
  const p = g.player;
  const px0 = e._pqx, py0 = e._pqy; e._pqx = e.x; e._pqy = e.y;
  if(!p || !(p.hp>0) || e.preferRange || e.state==='kite' || !(e.speed>0) || e.passive || e.swimmer || isHeavyEnemy(e) || e.bkBoss || e.hwGuardian || e.type==='firebat' || e.type==='roc' || e.type==='harpy' || e.type==='wraithling' || e.hw==='mendicant' || e.type==='fhcleric'){ e._pursT = 0; return 1; }
  const dd = dist(e,p), reach = e.r + p.r + 34;
  let chasing = false;
  if(px0!=null && e.moving && dd > reach && dd < 650){
    const mx = e.x-px0, my = e.y-py0, ml = Math.hypot(mx,my);
    if(ml > 0.05) chasing = (mx*(p.x-e.x) + my*(p.y-e.y)) / (ml*dd) > 0.5;
  }
  const target = (chasing && playerRunTime(g) >= PURSUIT_RUN_DELAY) ? Math.max(1, (p.speed||BASE_SPEED)/e.speed) : 1;
  e._pursK = (e._pursK||1) + (target - (e._pursK||1))*Math.min(1, dt*PURSUIT_EASE);
  if(e._pursK > 1.15 && Math.random() < dt*7) g.particles.push({type:'burst', x:e.x+rand(-6,6), y:e.y+e.r*0.4, t:0.25, max:0.25, color:'#bdb6a8'});
  return e._pursK;
}
