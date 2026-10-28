// v546: Town Portal. The PORTAL button on the HUD bar sends you to Mistfall from anywhere outside town and leaves a
// blue portal by the town square. Stepping back through it puts you in the SAME zone instance, at the same spot:
// the whole game state of that zone (room, monsters, loot, dungeon stores, trip seeds) is kept aside in g.tpReturn
// and put back as it was. Taking any other way out of town (waypoint, gate) closes the portal.
const TP_KEEP = new Set(['player','followers','followerStance','followerRespawnCd','camera','msgT','msgText','msgColor','msgPos','over','started',
  'levelUpFlash','modalOpen','clock','particles','projectiles','roadEvSeen','_hoverLoot','_glowLR','_glowK','_enterDepth','_famCalled','town','tpReturn',
  'banner','consecrate','judgments','soulGate','gateArchers','thrownTraps','mirage','traps','shieldThrow','tpCast']);
function townPortalAllowed(g){ return !!(g && g.started && !g.over && g.player && g.scene!=='town' && g.scene!=='tavern'); }
// v548: the portal takes TP_CAST_T seconds to open (a blue bar fills under you); moving, dodging or dying breaks it
const TP_CAST_T = 2;
function townPortalCast(){
  const g = game, p = g && g.player;
  if(!g || !g.started || g.over || !p) return;
  if(g.scene==='town' || g.scene==='tavern'){ showMsg('You are already in Mistfall', 1.2); return; }
  if(g.tpCast) return;
  g.tpCast = {t:0, x:p.x, y:p.y};
  try{ sfxPlay('whoosh', 0.6); }catch(e){}
}
function tpCastTick(g, dt){
  const c = g.tpCast, p = g.player; if(!c) return;
  if(g.over || !p || g.scene==='town' || g.scene==='tavern'){ g.tpCast = null; return; }
  if(Math.hypot(p.x-c.x, p.y-c.y) > 8 || p.dodging){ g.tpCast = null; showMsg('The portal fades', 1.0, '#9ad0ff'); return; }
  c.t += dt;
  if(Math.random() < dt*14) g.particles.push({type:'burst', x:p.x+rand(-26,26), y:p.y+rand(-14,14), t:0.4, max:0.4, color:'#6ab8ff'});
  if(c.t >= TP_CAST_T){ g.tpCast = null; townPortalGo(); }
}
function drawTpCastBar(g){
  const c = g.tpCast, p = g.player; if(!c || !p) return;
  const iso = toIso(p.x, p.y), w = 54, h = 7, k = clamp(c.t/TP_CAST_T, 0, 1);
  ctx.save(); ctx.translate(iso.x - w/2, iso.y + 16);
  ctx.fillStyle = 'rgba(0,0,0,0.75)'; roundRect(-2, -2, w+4, h+4, 4); ctx.fill();
  const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9ad8ff'); gr.addColorStop(1, '#2a6ad8');
  ctx.fillStyle = gr; roundRect(0, 0, w*k, h, 3); ctx.fill();
  ctx.strokeStyle = 'rgba(160,210,255,0.8)'; ctx.lineWidth = 1; roundRect(-1, -1, w+2, h+2, 3.5); ctx.stroke();
  ctx.restore();
}
function townPortalGo(){
  const g = game, p = g && g.player;
  if(!g || !g.started || g.over || !p || g.scene==='town' || g.scene==='tavern') return;
  const snap = {};
  for(const k of Object.keys(g)) if(!TP_KEEP.has(k)) snap[k] = g[k];
  const R = {g:snap, x:p.x, y:p.y, name:(typeof zoneDisplayName==='function' ? zoneDisplayName() : 'the wilds'), resume:(typeof resumeEnter!=='undefined' ? resumeEnter : null)};
  g.particles.push({type:'ring', x:p.x, y:p.y, t:0.5, max:0.5, r:70, color:'#6ab8ff'});
  try{ sfxPlay('whoosh', 1); }catch(e){}
  goToTown({wipeGold:false});
  g.tpReturn = R;
  const t = g.town; R.pos = {x:t.spawn.x + 70, y:t.spawn.y - 30};
  if(posBlockedByObstacles(R.pos.x, R.pos.y, 30, t.obstacles||[])) R.pos = {x:t.spawn.x, y:t.spawn.y - 60};
  p.x = R.pos.x - 60; p.y = R.pos.y + 40;
  for(const f of (g.followers||[])){ f.x = p.x; f.y = p.y; }
  showMsg('A portal back to '+R.name+' hangs in the air', 2.0, '#9ad0ff');
}
function townPortalReturn(){
  const g = game, R = g.tpReturn, p = g.player;
  if(!R || g.scene!=='town') return;
  g.tpReturn = null;
  clearSkillEffects(g, p); joyEnd(); mouseDown = false;
  for(const k in R.g) g[k] = R.g[k];
  g.projectiles = []; g.particles = [];
  p.x = R.x; p.y = R.y; p.crX = undefined; p.invuln = Math.max(p.invuln||0, 1.5);
  p.dodging = false; p.dodgeT = 0; p.movementStopT = 0;
  g.followers = []; ensureFollowers(g);
  for(const f of g.followers){ f.x = p.x; f.y = p.y; }
  if(typeof resumeEnter!=='undefined') resumeEnter = R.resume;
  g.particles.push({type:'ring', x:p.x, y:p.y, t:0.5, max:0.5, r:70, color:'#6ab8ff'});
  try{ sfxPlay('whoosh', 1); }catch(e){}
  document.getElementById('overlay').style.display = 'none';
  updateInteractPrompt(null);
  showMsg(R.name, 1.4);
  saveGame();
}
function tpKind(g){
  const R = g.tpReturn, p = g.player;
  if(!R || g.scene!=='town' || !R.pos) return null;
  return Math.hypot(p.x-R.pos.x, p.y-R.pos.y) < 70 + p.r ? 'tpReturn' : null;
}
function tpLabels(){ if(typeof INTERACT_LABELS!=='undefined'){ const R = game && game.tpReturn; INTERACT_LABELS.tpReturn = 'Return to '+((R && R.name)||'the portal'); INTERACT_ICONS.tpReturn = '\u{1F300}'; } }
// a standing blue portal, like the old town portals of the genre
function drawTownPortalIso(pos, clock){
  const iso = toIso(pos.x, pos.y);
  ctx.save(); ctx.translate(iso.x, iso.y);
  const gl = ctx.createRadialGradient(0, 0, 4, 0, 0, 60); gl.addColorStop(0, 'rgba(110,180,255,0.45)'); gl.addColorStop(1, 'rgba(60,120,255,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.ellipse(0, 0, 60, 26, 0, 0, 7); ctx.fill();
  const h = 78, w = 30, cy = -h/2 - 4;
  ctx.shadowColor = '#5ab0ff'; ctx.shadowBlur = 18;
  const bg = ctx.createRadialGradient(0, cy, 3, 0, cy, h/2); bg.addColorStop(0, '#e8f6ff'); bg.addColorStop(0.35, '#6ab8ff'); bg.addColorStop(1, '#1a3a9a');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(0, cy, w, h/2, 0, 0, 7); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(220,240,255,0.55)'; ctx.lineWidth = 1.6;
  for(let i=0;i<3;i++){ const a = clock*2.4 + i*2.09; ctx.beginPath(); ctx.ellipse(0, cy, w*(0.35+0.2*i), h/2*(0.35+0.2*i), 0, a, a+2.2); ctx.stroke(); }
  ctx.strokeStyle = '#9ad0ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, cy, w, h/2, 0, 0, 7); ctx.stroke();
  ctx.restore();
}
function pushTownPortalDrawables(g, drawables){
  if(g.tpCast && g.player) drawables.push({depth:g.player.x+g.player.y+0.6, draw:()=>drawTpCastBar(g)});
  const R = g.tpReturn;
  if(!R || g.scene!=='town' || !R.pos) return;
  drawables.push({depth:R.pos.x+R.pos.y, draw:()=>drawTownPortalIso(R.pos, g.clock||0)});
  drawables.push({depth:R.pos.x+R.pos.y+0.5, draw:()=>drawEdgeLabelIso(R.pos, R.name.toUpperCase(), 96)});
}
document.getElementById('tpBtn').addEventListener('click', townPortalCast);
