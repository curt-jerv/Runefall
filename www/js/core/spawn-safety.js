// v490: no monsters camped on top of waypoints, entrances, stairs or gates. After every zone change, any ordinary monster
// standing within SPAWN_SAFE_R of one of those spots (or of where you arrived) is moved out to open ground nearby.
// Bosses, event/quest monsters and guards are left where they are.
const SPAWN_SAFE_R = 330;
function spawnSafePoints(g){
  const R = g.room || {}, pts = [];
  const add = o=>{ if(o && typeof o.x==='number' && typeof o.y==='number' && !o.off) pts.push(o); };
  add(R.waypoint); add(R.entrance); add(R.entranceSpot); add(R.entrySpawn); add(R.stairs); add(R.stairsDown); add(R.rrUp); add(R.hwUp); add(R.hwDown);
  for(const k of ['gates','eastGates','ladders']) if(Array.isArray(R[k])) R[k].forEach(add);
  if(g.player) add({x:g.player.x, y:g.player.y});
  return pts;
}
function spawnSafeKeep(e){
  return !!(e.isBoss || e.isLairBoss || e.bossName || e.bkBoss || e.prot || e.ftGuard || e.hwGuardian || e.hwSentry || e.cemEvt || e.ruinsZ || e.minerSwarm
    || e.campEnemy || e.campChief || e.cAdd || e.colAdd || e.speed===0 || e.noReward || e.swimmer || e.lvBoss || e.type==='leviathan');
}
function clearSpawnArea(g){
  if(!g || !g.enemies || !g.enemies.length || g.scene==='town' || g.scene==='tavern') return;
  const pts = spawnSafePoints(g); if(!pts.length) return;
  const bad = (x,y,e)=> (g.room && g.room.floorMask && !mineOpenAt(g.room, x, y)) || (typeof lootSpotBad==='function' ? lootSpotBad(g, x, y) : false) || posBlockedByObstacles(x, y, e.r||14, (g.room && g.room.obstacles)||[]) || pts.some(q=>Math.hypot(x-q.x, y-q.y) < SPAWN_SAFE_R);
  for(const e of g.enemies){
    if(!(e.hp>0) || spawnSafeKeep(e)) continue;
    const near = pts.find(q=>Math.hypot(e.x-q.x, e.y-q.y) < SPAWN_SAFE_R); if(!near) continue;
    const a0 = Math.atan2(e.y-near.y, e.x-near.x) || Math.random()*6.28;
    let moved = false;
    for(let r=SPAWN_SAFE_R+20; r<=SPAWN_SAFE_R+420 && !moved; r+=40) for(let k=0;k<12;k++){
      const a = a0 + (k%2 ? 1 : -1)*Math.ceil(k/2)*0.45, x = near.x + Math.cos(a)*r, y = near.y + Math.sin(a)*r;
      if(!bad(x, y, e)){ e.x = x; e.y = y; e.homeX = x; e.homeY = y; moved = true; break; }
    }
  }
}
(function wrapEnterForSpawnSafety(){
  const names = Object.keys(window).filter(n=>/^enter[A-Z]\w*$/.test(n) && typeof window[n]==='function');
  for(const n of names){
    const orig = window[n];
    window[n] = function(...args){ const r = orig.apply(this, args); try{ clearSpawnArea(game); }catch(e){} return r; };
  }
})();
