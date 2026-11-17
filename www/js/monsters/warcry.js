// v570: monster war cries (the Minotaur and the Bandit Chief). The monster plants its feet, throws its head back and bellows:
// a slow, readable wind-up with shock rings rolling out. Ticked from the enemy loop in core/update.js (enemyWarcryTick),
// drawn from drawEnemyStatusWrap in monsters/elites.js (drawEnemyWarcry).
//   Minotaur  -- cries the moment it reveals itself (wakes); when the cry ends it is back to full life and moves and attacks 20% faster.
//   Bandit Chief -- waits WC_CHIEF_DELAY seconds into the fight first; the cry spurs every bandit near him (+20% damage) and himself.
const WC_MINO_T = 2.6, WC_CHIEF_T = 2.2, WC_CHIEF_DELAY = 6, WC_CHIEF_R = 520;
function enemyWarcryTick(g, e, dt, target, d){
  if(e.wcT>0){
    e.wcT -= dt; e.moving = false; e.windT = 0; e.atkAnimT = 0;
    e.wcRingT = (e.wcRingT||0) - dt;
    if(e.wcRingT<=0){ e.wcRingT = 0.55; g.particles.push({type:'ring', x:e.x, y:e.y, t:0.7, max:0.7, r:e.r*4.5, color:e.minotaur ? '#e8b070' : '#f0d070'}); shakeScreen(g, 3, 0.25); }
    if(e.wcT<=0){ e.wcT = 0; e.wcDone = true; warcryFinish(g, e); }
    return true;
  }
  if(e.wcDone || e.hp<=0) return false;
  if(e.minotaur){
    if(e.bossWoke || e.hp<e.maxHp){ warcryStart(g, e, WC_MINO_T); return true; }
    return false;
  }
  if(e.campChief){
    if((e.aggroed || e.engaged || e.hp<e.maxHp) && d < 600) e.wcDelay = (e.wcDelay||0) + dt;
    if(e.wcDelay >= WC_CHIEF_DELAY && !(e.windT>0)){ warcryStart(g, e, WC_CHIEF_T); return true; }
  }
  return false;
}
function warcryStart(g, e, T){
  e.wcT = T; e.wcMax = T; e.wcRingT = 0.35;
  try{ sfxPlay('bossRoar', 0.8); }catch(err){}
  showMsg(e.minotaur ? 'The Minotaur bellows a war cry!' : 'The Bandit Chief roars a war cry!', 1.6, '#ffb070');
}
function warcryFinish(g, e){
  if(e.minotaur){
    e.hp = e.maxHp;
    e.speed *= 1.2; e.atkCdMax /= 1.2; e.baseAtkCd = e.atkCdMax;
    showMsg('The Minotaur is enraged!', 1.4, '#ff8a5a');
  } else if(e.campChief){
    e.speed *= 1.1; e.dmg *= 1.15;
    for(const o of g.enemies) if(o!==e && o.hp>0 && !o.wcSpurred && (o.campEnemy || /bandit/.test(o.type||'')) && dist(o, e) < WC_CHIEF_R){ o.wcSpurred = true; o.dmg *= 1.2; o.aggroed = true; o.engaged = true; }
  }
}
function drawEnemyWarcry(e){
  if(!(e.wcT>0)) return;
  const k = clamp(1 - e.wcT/(e.wcMax||1), 0, 1), q = toIso(e.x, e.y), pul = 0.5+0.5*Math.sin(k*Math.PI*8);
  ctx.save(); ctx.translate(q.x, q.y); ctx.scale(1, ISO_KY/ISO_KX);
  ctx.strokeStyle = 'rgba(255,190,110,'+(0.25+0.35*pul)+')'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, e.r*(1.6+0.5*pul), 0, 7); ctx.stroke();
  ctx.restore();
}
