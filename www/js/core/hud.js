function updateTown(dt){
  if(game.player && (game.player.pyroTorrentT>0 || game.player.blizzardZone)) clearSkillEffects(game, game.player);
  const g = game, p = g.player, room = g.room;
  if(p) p.skelDown = 0;   // v460: fallen skeletons are back on their feet in town
  if(g.flashT>0) g.flashT = Math.max(0, g.flashT-dt*1.4);   // v425: the white flash never faded in town (haze overlay)
  if(g.levelUpFlash>0) g.levelUpFlash -= dt;   // v453: level-up glow (and other screen effects) also fade in town
  if(g.modalOpen) return;
  for(let i=g.particles.length-1;i>=0;i--){ g.particles[i].t -= dt; if(g.particles[i].t<=0) g.particles.splice(i,1); }   // v447: town never aged particles, so dodge rings etc. lingered forever
  p.animT += dt;
  if(p.hitFlash>0) p.hitFlash-=dt;
  if(p.atkAnimT>0) p.atkAnimT-=dt;
  if(p.furyHandT>0) p.furyHandT-=dt;
  if(p.bashAnimT>0) p.bashAnimT-=dt; if(p.vengAnimT>0) p.vengAnimT-=dt; if(p.throwAnimT>0) p.throwAnimT-=dt;
  if(p.cleaveT>0) p.cleaveT-=dt;
  if(p.movementStopT>0) p.movementStopT-=dt; // was never ticked in Town -> stuck-in-place bug after dying mid-cast
  if(g.msgT>0) g.msgT-=dt;
  g.clock = (g.clock||0) + dt;

  // Dodge charge regen + dash trigger/physics -- Town is the ONE zone
  // Dodge actually works in (see the #btnDodge input-handler gate), so
  // this mirrors the general combat update's dodge block (charge regen,
  // trigger, and the v91 sub-stepped dash movement that fixed dashing
  // through walls) rather than sharing that code directly, since Town's
  // plain-movement path below is otherwise much simpler than the combat
  // path's (no attack/skill/enemy handling belongs here).
  if(p.dodgeCharges==null) p.dodgeCharges = 1; // safety net for saves from before v79
  { const el = document.querySelector('#btnDodge .cd'); if(el) el.style.transform = 'translateY('+(clamp((p.dodgeCharges>0 ? 0 : Math.max(0,p.dodgeCd))/(p.dodgeCdMax||DODGE_CD_BASE),0,1)*100)+'%)'; }   // v480: dodge recharge shows in town too
  try{ updatePotionButton(p); }catch(e){}
  const dodgeMaxCh = dodgeMaxCharges(p);
  if(p.dodgeCharges < dodgeMaxCh){
    if(p.dodgeCd>0) p.dodgeCd -= dt;
    if(p.dodgeCd<=0){
      p.dodgeCharges = Math.min(dodgeMaxCh, p.dodgeCharges+1);
      p.dodgeCd = p.dodgeCharges < dodgeMaxCh ? finesseDodgeCooldown(p) : 0;
    }
  }
  if(p.invuln>0) p.invuln-=dt;
  if(wantDodge && p.dodgeCharges>0 && !p.dodging){
    const wd0 = screenDirToWorld(joyVec.x, joyVec.y);
    let dx=wd0.x, dy=wd0.y;
    if(dx===0&&dy===0){ dx=p.facing.x; dy=p.facing.y; }
    const d=Math.hypot(dx,dy)||1;
    p.dodgeDir = {x:dx/d, y:dy/d};
    if(p.cls==='ranger'){ gainResource(p, evasionDodgeStamina(p)); survDodgeRegenStart(p); }
    p.dodging = true; p.dodgeT = p.dodgeDur; if(p.partB && p.partB.sp && p.partB.sp.windroll) p.windT = 3;
    p.dodgeCharges -= 1;
    p.dodgeCdMax = applyCdr(p, finesseDodgeCooldown(p));
    if(p.dodgeCd<=0) p.dodgeCd = p.dodgeCdMax;
    p.invuln = p.dodgeDur + 0.05; if(p.cls==='mystic'){ thunderstepDodge(game, p); windrunnerDodge(p); }
  }
  wantDodge = false;

  if(p.dodging){
    p.dodgeT -= dt;
    const spd = p.speed*3.1;
    const totalDx = p.dodgeDir.x*spd*dt, totalDy = p.dodgeDir.y*spd*dt;
    const totalDist = Math.hypot(totalDx, totalDy);
    const TOWN_DODGE_SUBSTEP_MAX = 4; // same value as the combat path's DODGE_SUBSTEP_MAX (v91 anti-tunneling fix)
    const steps = Math.max(1, Math.ceil(totalDist/TOWN_DODGE_SUBSTEP_MAX));
    const stepDx = totalDx/steps, stepDy = totalDy/steps;
    for(let dsi=0; dsi<steps; dsi++){
      p.x += stepDx; p.y += stepDy;
      p.x = clamp(p.x, p.r, room.w-p.r);
      p.y = clamp(p.y, p.r, room.h-p.r);
      pushOutOfObstacles(p, room.obstacles);
    }
    p.moving = true;
    if(p.dodgeT<=0) p.dodging=false;
  } else if(p.movementStopT <= 0){
    const mv = screenDirToWorld(joyVec.x, joyVec.y);
    if(mv.x!==0||mv.y!==0){
      p.x += mv.x*p.speed*dt;
      p.y += mv.y*p.speed*dt;
      const md=Math.hypot(mv.x,mv.y)||1;
      p.facing = {x:mv.x/md, y:mv.y/md};
      p.faceSign = screenFacingSign(p.facing.x,p.facing.y);
      p.moving = true;
    } else {
      p.moving = false;
    }
  } else {
    p.moving = false;
  }
  p.x = clamp(p.x, p.r, room.w-p.r);
  p.y = clamp(p.y, p.r, room.h-p.r);
  pushOutOfObstacles(p, room.obstacles);

  // v86: followers now accompany the player in Town too (see
  // updateFollowersAI's own top comment for why this is safe -- Town's
  // g.enemies is always empty, so combat branches are inert no-ops and
  // followers just idle-follow at their home spot behind the player).
  updateFollowersAI(g, dt);

  const nearRuneforge = !!p.runeforgeUnlocked && dist(p, g.town.runeforge) < g.town.runeforge.r + p.r + 26;
  const nearShop = dist(p, g.town.blacksmith) < g.town.blacksmith.r + p.r + 26 && !(nearRuneforge && dist(p, g.town.runeforge) < dist(p, g.town.blacksmith));
  const nearGate = dist(p, g.town.gate) < g.town.gate.r + p.r + 22;
  const nearQuestGiver = dist(p, g.town.questGiver) < g.town.questGiver.r + p.r + 24;
  const nearWell = dist(p, g.town.well) < g.town.well.r + p.r + 24;
  const huntersQuest = getQuest(p, QUEST_FIND_HUNTERS.id);
  const bonfireHunterHome = !!(huntersQuest && huntersQuest.status==='complete');
  const nearBonfireHunter = bonfireHunterHome && dist(p, g.town.bonfire) < g.town.bonfire.r + p.r + 30;
  // v66: the standalone Mine portal landmark is gone -- the Town waypoint
  // (below) is now the sole fast-travel route to the Abandoned Mine, its
  // Teleport menu already offers "Abandoned Mine" as a destination.
  const nearWaypoint = dist(p, g.town.waypoint) < g.town.waypoint.r + p.r + 24;
  const nearStashChest = dist(p, g.town.stashChest) < g.town.stashChest.r + p.r + 24;
  const nearCat = townCatVisible() && dist(p, g.town.cat) < g.town.cat.r + p.r + 24;
  const tipNpc = nearTownTipNpc(g); g._tipNpcNear = tipNpc;   // v490: townsfolk / ship captain
  // Waypoint rework: Town's own waypoint is NEVER locked -- it's always
  // available/selectable as a fast-travel hub, unlike every other zone's
  // waypoint (which must be discovered by walking up to it first -- see
  // discoverWaypoint). The old waypointUnlocked gate (reachedMountainPass
  // && checkpointDepth>1) only ever controlled Town's OWN interactability;
  // the Abandoned Mine's Teleport option is still separately gated on
  // checkpointDepth>1 in openTeleportMenu's teleportMineBtn, unaffected.
  const tavernQuestDone = tavernIsOpen(p);   // v198: opens (and the barkeeper goes inside) the moment the beacon is lit
  // Once Light the Way is complete the barkeeper has moved inside to work
  // the bar (see makeTavernInterior's barkeeperSpot) -- he's narratively
  // the same one NPC, so he's no longer present/interactable out here.
  const nearBarkeeper = !tavernQuestDone && dist(p, g.town.barkeeper) < g.town.barkeeper.r + p.r + 24;
  const nearTavernDoor = dist(p, g.town.tavernDoor) < g.town.tavernDoor.r + p.r + 20;
  updateInteractPrompt(nearRuneforge && !nearShop ? 'runeforge' : nearShop ? 'shop' : nearGate ? 'toForest' : nearWell ? 'well' : nearStashChest ? 'stash' : nearCat ? 'townCat' : tipNpc ? tipNpc.kind : nearWaypoint ? 'waypoint' : nearBonfireHunter ? 'bonfireHunter' : nearBarkeeper ? 'barkeeper' : nearTavernDoor ? (tavernQuestDone ? 'toTavern' : 'tavernLocked') : nearQuestGiver ? 'quest' : null);

  const pIso = toIso(p.x, p.y);
  g.camera.x = pIso.x - W/2;
  g.camera.y = pIso.y - camPlayerY();

  lootHoverName(g, p);
  // loot pickup -- same walk-over mechanic the dungeon/forest use, so an
  // item dropped in town (see itemDetailDrop) can be walked back over to
  // retrieve it exactly as dropped (identical rolled stats/rarity/name).
  for(let i=g.loot.length-1;i>=0;i--){
    const l = g.loot[i];
    if(l.dropGrace>0){ l.dropGrace-=dt; continue; }
    if(lootIsManual(l)) continue;
    if(dist(l,p) < l.r+p.r+6){
      if(l.type==='item'){
        if(addToBag(p, l.item)){
          const eq = tryAutoEquip(p, l.item);
          showMsg(eq ? 'Equipped: '+l.item.name : l.item.name, 1.2);
          bagPulse(); g.loot.splice(i,1);
        } else { showMsg(fullMsgFor(l.item), 1.0); }
      } else g.loot.splice(i,1);
    }
  }

  document.getElementById('hpfill').style.width = clamp(p.hp/p.maxHp*100,0,100)+'%';
  updateIceArmorHud(p);
  document.getElementById('xpfill').style.width = clamp(p.xp/p.xpNext*100,0,100)+'%';
  updateResourceHud(p); updatePotionButton(p);
  document.getElementById('hudLevel').textContent = 'Lv. '+(p.level||1);
  updateHudNums(p);
  updateSoulsHud(p); updateAreaHud();
  document.getElementById('goldNum').textContent = p.gold; updateZoneHud();
  skillsBadge.textContent = p.skillPoints > 0 ? p.skillPoints : '!';
  updateQuestBadge();
}

// HUD numbers + the boss health bar (top of screen while engaged with a big boss)
// v443: mana bar keeps its full length with the reserved 25% greyed out on the right; the ice layer over the
// health bar shows how full the Ice Armor barrier is (its own fullness, not a share of life) and vanishes when it is empty.
function updateIceArmorHud(p){
  try{ iceArmorSync(p); }catch(e){}
  const mf = document.getElementById('mpfill'), mr = document.getElementById('mpres'), ia = document.getElementById('iafill');
  const full = (p.mpReserved>0 && p.maxMpFull>0) ? p.maxMpFull : 0;
  if(mf && full) mf.style.width = clamp((p.mp||0)/full*100, 0, 100)+'%';
  if(mr){ const w = full ? (p.mpReserved/full*100).toFixed(1)+'%' : '0%'; if(mr.style.width!==w) mr.style.width = w; const d = full ? 'block' : 'none'; if(mr.style.display!==d) mr.style.display = d; }
  if(ia){ const fr = (p.iceArmorMax>0 && p.iceArmorHp>0) ? clamp(p.iceArmorHp/p.iceArmorMax, 0, 1) : 0; const w = (fr*100).toFixed(1)+'%'; if(ia.style.width!==w) ia.style.width = w; }
}
// v489: the bottom dock's globes and XP bar mirror the (hidden) top bars
function updateDockHud(p){
  const st = (id, prop, v)=>{ const el = document.getElementById(id); if(el && el.style[prop]!==v) el.style[prop] = v; };
  const tx = (id, v)=>{ const el = document.getElementById(id); if(el && el.textContent!==v) el.textContent = v; };
  st('hpGlobeFill', 'height', clamp(p.hp/Math.max(1,p.maxHp)*100,0,100).toFixed(1)+'%');
  const full = (p.mpReserved>0 && p.maxMpFull>0) ? p.maxMpFull : p.maxMp;
  st('resGlobeFill', 'height', clamp((p.mp||0)/Math.max(1,full)*100,0,100).toFixed(1)+'%');
  st('resGlobeRes', 'height', (p.mpReserved>0 && full ? p.mpReserved/full*100 : 0).toFixed(1)+'%');
  st('hpGlobeIce', 'height', ((p.iceArmorMax>0 && p.iceArmorHp>0) ? clamp(p.iceArmorHp/p.iceArmorMax,0,1)*100 : 0).toFixed(1)+'%');
  const rf = document.getElementById('resGlobeFill'); if(rf && rf.dataset.res!==p.cls) rf.dataset.res = p.cls;
  tx('hpGlobeNum', Math.ceil(Math.max(0,p.hp))+'');
  tx('hpGlobeIa', (p.iceArmorMax>0 && p.iceArmorHp>0) ? Math.ceil(p.iceArmorHp)+'' : '');   // v546: Ice Armor left, under the life number
  tx('resGlobeNum', Math.floor(p.mp||0)+'');
  { const tb = document.getElementById('tpBtn'), off = !townPortalAllowed(game); if(tb && tb.classList.contains('off')!==off) tb.classList.toggle('off', off); }   // v546: dimmed in town
  st('dockXpFill', 'width', clamp(p.xp/p.xpNext*100,0,100).toFixed(1)+'%');
  { const xt = document.getElementById('dockXpTxt'); const html = '<b class="dLv">Lv '+(p.level||1)+'</b> \u00b7 '+Math.floor(clamp(p.xp/p.xpNext,0,1)*100)+'%'; if(xt && xt.dataset.h!==html){ xt.dataset.h = html; xt.innerHTML = html; } }   // v492: the level is the big gold number
  // the skill-point flag always shows the real number of unspent points (it used to keep an old count outside town)
  if(typeof skillsBadge!=='undefined' && skillsBadge){ const n = p.skillPoints||0; const t = n>0 ? String(n) : '!'; if(skillsBadge.textContent!==t) skillsBadge.textContent = t; if(n<=0 && skillsBadge.style.display!=='none') skillsBadge.style.display = 'none'; }
}
function updateHudNums(p){
  updateBoltBtn();
  try{ updateDockHud(p); }catch(e){}
  const set = (id, txt)=>{ const el = document.getElementById(id); if(el && el.textContent!==txt) el.textContent = txt; };
  set('hpnum', Math.ceil(Math.max(0,p.hp))+' / '+Math.round(p.maxHp));
  set('mpnum', Math.floor(p.mp||0)+' / '+Math.round((p.mpReserved>0 ? p.maxMpFull : p.maxMp)||0));
  set('xpnum', Math.floor(clamp(p.xp/p.xpNext,0,1)*100)+'%');
  const bar = document.getElementById('bossBar'), g = game;
  let boss = null, bd = 1e9;
  if(g && g.enemies && g._bossBarReset){ g._bossBarReset = false; for(const e of g.enemies){ e._barOn = false; e._barHp = e.hp; } }
  if(g && g.enemies && g.scene!=='town'){
    for(const e of g.enemies){
      if(e.hp<=0 || !(e.isBoss||e.isLairBoss||e.lr||e.rev||e.lvBoss||e.mastodon||e.bkBoss||e.hwGuardian)) continue;   // v490: + the Highward Warden
      if(e.lvBoss && !e.active) continue;
      if(e.wlState==='intro' && e.wlAlpha!=null && e.wlAlpha<0.85) continue;   // v435: the Wraith Lord's bar waits until he has appeared
      const d = dist(e,p);
      // v474: the bar only appears once the fight is on -- the boss has been hurt (by anyone) or has attacked you or a follower
      if(e._barHp==null) e._barHp = e.hp;
      if(e.hp < e._barHp - 0.01) e._barOn = true;
      e._barHp = e.hp;
      const engaged = !!e._barOn;
      if(d<900 && engaged && d<bd){ bd = d; boss = e; }
    }
  }
  if(!boss){ window.__bossBarBottom = 0; if(bar.style.display!=='none') bar.style.display = 'none'; return; }
  bar.style.display = 'block';
  { /* v507: under the whole top HUD (region name, souls, buffs), never over it */ const ts = document.getElementById('topWrap') || document.getElementById('topStrip'); if(ts){ const bt = Math.round(ts.getBoundingClientRect().bottom + 2); if(bar.dataset.t!==String(bt)){ bar.dataset.t = bt; bar.style.top = bt+'px'; } } window.__bossBarBottom = bar.getBoundingClientRect().bottom; }
  set('bossName', boss.bossName || (boss.type==='boss' ? 'Demon Lord' : 'Guardian'));
  { const great = !!(boss.lvBoss || boss.mastodon || boss.colossus || boss.gj), nm = document.getElementById('bossName'); if(nm.classList.contains('quiet')===great) nm.classList.toggle('quiet', !great); }   // v316: gold name only for the great beasts, like the banner
  document.getElementById('bossFill').style.width = clamp(boss.hp/boss.maxHp*100,0,100)+'%';
  set('bossNum', Math.ceil(boss.hp)+' / '+Math.round(boss.maxHp));
}
let resHudSig = '';
function updateResourceHud(p){
  const sig = p.cls;   // (v288) Templars use the same Rage bar; Conviction is just Rage transmuted
  if(sig===resHudSig) return;
  resHudSig = sig;
  const lbl = document.getElementById('resLabel'), fill = document.getElementById('mpfill');
  if(!lbl || !fill) return;
  lbl.textContent = ({mystic:'MP', warrior:'RG', warriorT:'CV', ranger:'ST'})[sig] || 'MP';
  fill.dataset.res = sig;   // v474: colours live in the stylesheet (Mana blue, Rage ember, Stamina amber)
}
function castLightningArcBolt(g, p, laRank, reward){
  const target = nearestEnemy(g, p, STAFF_RANGE+(p.weaponReachBonus||0));
  const ang = target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y, p.facing.x);
  p.facing = {x:Math.cos(ang), y:Math.sin(ang)};
  p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
  p.atkAnimT = 0.22;
  const isCrit = Math.random()*100 < (p.critChance||0) + (p.rallyT>0 ? RALLY_CRIT_BONUS : 0) + stormCritBonus(p, target);
  let dmg = wpnDmg(p);
  if(isCrit) dmg *= critMultOf(p);
  const sab = staticArcBonus(p);
  if(sab.chains>0){ const em = staticConsume(p); sab.mult *= em.mult; sab.released = true; }   // v482: a full bar is released by Lightning Arc too
  dmg *= assaultDealtMult(p) * weaponDmgMult(p) * swd('lightningArc', laRank) * (reward ? windConsume(p, 'lightningArc') : 1) * sab.mult;
  const chains = lightningArcChains(effectiveRank(p,'lightningChain')||0) + (uq(p,'uq_djinn') ? 3 : 0) + sab.chains;
  // (v106) Instant lightning: a jagged bolt is drawn from the caster to
  // the target (and on to each chained enemy) and damage lands at once --
  // no travelling projectile, and no stun anymore.
  let from = {x:p.x, y:p.y};
  if(!target){
    // nothing in range: the bolt still crackles out along your facing, harmlessly
    g.particles.push({type:'bolt', x:from.x, y:from.y, x2:p.x+Math.cos(ang)*STAFF_RANGE*0.7, y2:p.y+Math.sin(ang)*STAFF_RANGE*0.7, t:0.2, max:0.2});
  } else {
    const hitIds = [];
    if(reward && p.cls==='mystic') gainResource(p, p.maxMp*MANA_ON_HIT_PCT.lightningArc);
    let cur = target, hopDmg = dmg;
    for(let hop=0; cur && hop<=chains; hop++){
      lastHitCrit = isCrit && hop===0;
      cur.hp -= applyEnemyArmor(p, cur, hopDmg, 0, "lightning"); cur.hitT = 0.15;
      lastHitCrit = false;
      checkExecute(g, cur);
      g.particles.push({type:'bolt', x:from.x, y:from.y, x2:cur.x, y2:cur.y, t:0.22, max:0.22});
      g.particles.push({type:'burst', x:cur.x, y:cur.y, t:0.22, max:0.22, color:sab.released?'#ffffff':'#e6e35a'});
      if(sab.released){ g.particles.push({type:'ring', x:cur.x, y:cur.y, t:0.3, max:0.3, r:34, color:'#bfefff'}); cur.charges = CHARGE_MAX; cur.chgT = CHARGE_DECAY; }
      hitIds.push(cur);
      from = {x:cur.x, y:cur.y};
      hopDmg *= LIGHTNING_CHAIN_DMG_MULT;
      cur = hop<chains ? nearestEnemy(g, cur, LIGHTNING_CHAIN_RANGE, hitIds) : null;
    }
  }
}
