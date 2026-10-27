// v487: each simulation step gets fresh obstacle grids (see obsGrid)
function update(dt){ OBS_FRAME++; OBS_IN_UPDATE = true; try{ updateStep(dt); } finally { OBS_IN_UPDATE = false; } }
function updateStep(dt){
  const g = game, p = g.player, room = g.room;
  try{ dungeonPersist(g); }catch(err){}
  if(showBigMsg._hold && g.scene!=='darkcrypt') bigMsgRelease();   // v536: a held crypt banner goes when you leave
  if(p.wellRestedT>0) wellRestedTick(p, dt);
  try{ wmMark(g, p); }catch(err){}
  try{ achTick(g, dt); }catch(err){}
  if(g.scene==='town'){ g._spawnRoom = null; updateTown(dt); return; }
  if(g.modalOpen) return; // frozen while a menu (skill pick / inventory) is open
  if(g._spawnRoom!==g.room){ g._spawnRoom = g.room; g.regionSpawn = {x:p.x, y:p.y}; clearSkillEffects(g, p); try{ rollSpecialMonsters(g); }catch(err){} } // where you entered this region (respawn point)

  if(p.atkCd>0) p.atkCd-=dt*(1+bloodlustAtkSpeedBonus(p)+rampageSpeed(p)+((p.apexStacks>0 && uq(p,'uq_crater')) ? 0.04*p.apexStacks : 0));
  // v190 leech token bucket + Warrior out-of-combat regen
  { const cap = p.maxHp*LEECH_BUDGET_PCT_PER_S; p.leechTok = Math.min(cap, (p.leechTok==null?cap:p.leechTok) + cap*dt); }
  p.sinceHurt = (p.sinceHurt==null ? 99 : p.sinceHurt) + dt;
  // (v288) the Warrior's passive out-of-combat life regeneration is gone
  { const rn = runesHeld(p); if(rn !== p._runeCnt){ const prev = p._runeCnt; p._runeCnt = rn; recalcStats(p); if(prev!=null && rn>prev){ const nr = ['shield','sword','cross'].find(r=>runeItemOf(p,r) && !(p._runeSeen||{})[r]) || ['shield','sword','cross'].find(r=>runeItemOf(p,r)); showMsg(RUNE_NAMES[nr]+' acquired', 3.0, '#e8c44a'); } p._runeSeen = {}; for(const r of ['shield','sword','cross']) if(runeItemOf(p,r)) p._runeSeen[r] = true; } }
  if(p.movementStopT>0) p.movementStopT-=dt;
  if(p.stunT>0){ p.stunT -= dt; p.movementStopT = Math.max(p.movementStopT||0, 0.05); wantDodge = false; wantAttack = false; }   // v331: Mastodon stomp stun
  if(p.riposteT>0) p.riposteT-=dt; // perfect-dodge damage bonus (v104)
  // v83 Holy/Regeneration (+Life Regen %, of max HP per second): a plain
  // per-frame heal-over-time tick, only while alive and below max HP.
  if(p.lifeRegenPct>0 && p.hp>0 && p.hp<p.maxHp){
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp*p.lifeRegenPct*dt);
  }
  if(p.windT>0) p.windT -= dt;   // v361 Wind Stone buff timer
  if(p.partB && p.partB.sp && p.partB.sp.burn && p.hp>0 && game && game.enemies){   // v361 Infernal Heart aura
    p._burnT = (p._burnT||0) - dt;
    if(p._burnT<=0){
      p._burnT = 0.5;
      for(const o of game.enemies){ if(!o || o.hp<=0 || o.passive || o.invulnT>0) continue; if(Math.hypot(o.x-p.x, o.y-p.y) > 120+o.r) continue;
        const bd = Math.max(1, o.maxHp*((o.isBoss||o.isLairBoss||o.colossus||o.rev||o.gj||o.trex||o.lr)?0.0015:0.01)*(1-enemyResist(o,'fire')));
        o.hp -= bd; dotAdd(o, bd, '#ff8a3a'); }
      game.particles.push({type:'burst', x:p.x, y:p.y, t:0.3, max:0.3, color:'#ff7a2a'});
    }
  }
  // Dodge charge regen (v79, Finesse): dodgeCd counts down toward
  // restoring the NEXT charge, only while below the current max charge
  // count (dodgeMaxCharges -- 1 normally, 2 once Finesse is ranked). Once
  // it hits 0, a charge is restored; if still below max after that, the
  // timer immediately restarts for the following charge. Without Finesse
  // this collapses back to the exact same single-charge behavior the old
  // plain dodgeCd gate always had.
  if(p.dodgeCharges==null) p.dodgeCharges = 1; // safety net for saves from before v79
  const dodgeMaxCh = dodgeMaxCharges(p);
  if(p.dodgeCharges < dodgeMaxCh){
    if(p.dodgeCd>0) p.dodgeCd -= dt;
    if(p.dodgeCd<=0){
      p.dodgeCharges = Math.min(dodgeMaxCh, p.dodgeCharges+1);
      p.dodgeCd = p.dodgeCharges < dodgeMaxCh ? finesseDodgeCooldown(p) : 0;
    }
  }
  if(p.shieldBashCd>0) p.shieldBashCd-=dt;
  if(p.shieldThrowCd>0) p.shieldThrowCd-=dt;
  if(p.fieldDressCd>0) p.fieldDressCd-=dt;
  if(p.preciseShotCd>0) p.preciseShotCd-=dt;
  // v79 batch cooldowns.
  if(p.survivalFieldDressCd>0) p.survivalFieldDressCd-=dt;
  if(p.trapGcd>0) p.trapGcd-=dt;
  if(p.poisonTrapCd>0) p.poisonTrapCd-=dt;
  if(p.frostTrapCd>0) p.frostTrapCd-=dt;
  if(p.rainOfArrowsCd>0) p.rainOfArrowsCd-=dt;
  if(p.guardianCd>0) p.guardianCd-=dt;
  juggernautTick(g, p, dt);
  if(p.guardianT>0){
    p.guardianT-=dt;
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp*GUARDIAN_REGEN_PER_SEC_PCT*dt);
  }
  if(p.whirlwindCd>0) p.whirlwindCd-=dt;
  if(p.leapCd>0) p.leapCd-=dt;
  if(p.unbreakCd>0) p.unbreakCd-=dt;
  if(p.unbreakT>0 && !(p.bulwarkT>0)) p.unbreakT-=dt;
  warriorV266Tick(g, p, dt);
  necroV268Tick(g, p, dt);
  if(p.battlecryCd>0) p.battlecryCd-=dt;
  if(p.assaultCd>0) p.assaultCd-=dt;
  if(p.assaultT>0){ p.assaultT-=dt; if(p.assaultT<=0){ p.assaultT=0; assaultFinisher(g, p); } }
  // Block chance is now a passive check on every incoming hit (see
  // playerDamage) rather than something you hold a button down for --
  // Slam is purely an active Shield Bash trigger, no passive block tied to it.
  p.blocking = (effectiveRank(p,'shieldBash')||0)>0 && hasShieldEquipped(p) && !p.dodging;
  if(p.invuln>0) p.invuln-=dt;
  if(p.hitFlash>0) p.hitFlash-=dt;
  if(p.atkAnimT>0) p.atkAnimT-=dt;
  if(p.furyHandT>0) p.furyHandT-=dt;
  if(p.bashAnimT>0) p.bashAnimT-=dt; if(p.vengAnimT>0) p.vengAnimT-=dt; if(p.throwAnimT>0) p.throwAnimT-=dt;
  if(p.furyQ && p.furyQ.length) processFuryQueue(g, p, dt);
  if(p.cleaveT>0) p.cleaveT-=dt;   // v200: was only ticking in Town, so the swing never ended in the field
  if(p.castAnimT>0) p.castAnimT-=dt;
  castFxWatch(g, p);   // v517: cast pose for every spell, buff and shout
  if(p.webSlowT>0){ p.webSlowT-=dt; if(p.webSlowT<0) p.webSlowT=0; }
  if(g.levelUpFlash>0) g.levelUpFlash-=dt;
  if(g.msgT>0) g.msgT-=dt;
  p.animT += dt;
  g.clock = (g.clock||0) + dt;

  // Field Dress (Hunter): stand still to channel HP regen. Checked here,
  // before dodge/movement runs, so a movement input this same frame both
  // cancels the channel AND still moves the player normally afterward
  // (falling through to the movement block below once fieldDressing is
  // cleared) -- there's no "stuck for a frame" gap.
  if(wantFieldDress){
    wantFieldDress = false;
    const fdRank = effectiveRank(p,'fieldDress')||0;
    if(fdRank>0){
      if(p.fieldDressing){ p.fieldDressing = false; }
      else if(p.hp < p.maxHp && p.fieldDressCd<=0){
        p.fieldDressing = true;
        // Fixed 2-minute cooldown at every rank (v64) -- rank only affects
        // the regen rate above, never this cooldown. Starts ticking the
        // instant the channel begins, same as it would even if cancelled
        // early by moving.
        p.fieldDressCd = applyCdr(p, p.fieldDressCdMax);
        // "Reveal yourself": cancel any active Vanish stealth immediately.
        p.vanishT = 0;
        showMsg('Field Dress...', 0.7);
      }
    }
  }
  if(p.fieldDressing){
    const mv0 = screenDirToWorld(joyVec.x, joyVec.y);
    if(mv0.x!==0 || mv0.y!==0){
      p.fieldDressing = false; // moving cancels the channel immediately
    } else {
      const fdRate = fieldDressRegenRate(effectiveRank(p,'fieldDress')||0);
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp*fdRate*dt);
      if(p.hp >= p.maxHp) p.fieldDressing = false; // full HP auto-ends it
    }
  }

  // Field Dress (Survivalist, v79): a brand-new node/id (survivalFieldDress)
  // -- NOT the Hunter tree's 'fieldDress' above, which stays completely
  // untouched. Same "stand still to channel" shape as the Hunter version,
  // but its OWN separate state (p.fieldDressing2/p.survivalFieldDressCd) so
  // the two can never interfere, and a DIFFERENT cooldown model: rank both
  // speeds up regen AND shortens the cooldown (see survFieldDressCooldown).
  if(wantSurvivalFieldDress){
    wantSurvivalFieldDress = false;
    const sfdRank = effectiveRank(p,'survivalFieldDress')||0;
    if(sfdRank>0){
      if(p.survivalFieldDressCd<=0 && !p.fieldDressing2){
        p.fieldDressing2 = true; p.fieldDressT = SURV_FIELD_DRESS_DUR; p.fieldDressFx = 0;
        p.webSlowT = 0; p.selfBurnT = 0; p.bleedT = 0; p.poisonT = 0; p.burnT = 0; p.chillT = 0;   // v267: the bandage cleanses slows and ailments
        p.survivalFieldDressCdMax = applyCdr(p, survFieldDressCooldown(sfdRank));
        p.survivalFieldDressCd = p.survivalFieldDressCdMax;
        showMsg('Field Dress', 0.7, '#7ad07a');
        g.particles.push({type:'ring', x:p.x, y:p.y, t:0.5, max:0.5, r:40, color:'#7ad07a'});
      }
    }
  }
  if(p.dodgeRegenT>0){   // v267 Field Dress passive: regen after every dodge
    p.dodgeRegenT -= dt; p.hp = Math.min(p.maxHp, p.hp + p.maxHp*(p.dodgeRegenRate||0)*dt);
    if(p.dodgeRegenT<=0){ p.dodgeRegenT = 0; p.dodgeRegenRate = 0; }
  }
  if(p.fieldDressing2){
    const sfdRate = survFieldDressRegenRate(effectiveRank(p,'survivalFieldDress')||0);
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp*sfdRate*dt);
    if(g.followers) for(const f of g.followers){ if(f.hp>0 && f.maxHp) f.hp = Math.min(f.maxHp, f.hp + f.maxHp*sfdRate*0.5*dt); }
    p.fieldDressT -= dt; p.fieldDressFx = (p.fieldDressFx||0) - dt;
    if(p.fieldDressFx<=0){ p.fieldDressFx = 0.4; g.particles.push({type:'burst', x:p.x+(Math.random()-0.5)*16, y:p.y+(Math.random()-0.5)*16, t:0.35, max:0.35, color:'#7ad07a'}); }
    if(p.fieldDressT<=0) p.fieldDressing2 = false;
  }

  // (v120) While Whirlwind is spinning: no dodge and no other attack skills
  // (Strike, Slam, Throw...) and, as of v203, no other skills at all (except Dodge, which cancels the spin).
  if(p.juggT>0 || p.juggWindT>0){ wantDodge=false; wantAttack=false; wantShieldBash=false; wantThrow=false; wantLeap=false; wantUnbreak=false; wantGuardian=false; wantBattlecry=false; wantAssault=false; wantRally=false; wantStance=false; wantBulwark=false; wantBloodrage=false; wantWhirlwind=false; }   // v342: Juggernaut -- nothing but running
  if(p.whirlwindT>0 && wantDodge){ p.whirlwindT = 0; }   // v205: dodging cancels Whirlwind
  else if(p.whirlwindT>0){ wantDodge=false; wantAttack=false; wantShieldBash=false; wantThrow=false; wantLeap=false; wantUnbreak=false; wantGuardian=false; wantBattlecry=false; wantAssault=false; wantRally=false; wantStance=false; }   // v203: nothing else while spinning (tap Whirlwind again to stop)
  if(p.fieldDressing){
    // Standing still to channel -- no dodge, no movement this frame.
    wantDodge = false;
    p.moving = false;
  } else {
    // dodge (v79: consumes a charge instead of a plain cooldown gate --
    // see the dodgeCharges regen block above)
    if(wantDodge && p.dodgeCharges>0 && !p.dodging){
      const wd0 = screenDirToWorld(joyVec.x, joyVec.y);
      let dx=wd0.x, dy=wd0.y;
      if(dx===0&&dy===0){ dx=p.facing.x; dy=p.facing.y; }
      const d=Math.hypot(dx,dy)||1;
      p.dodgeDir = {x:dx/d, y:dy/d};
    if(p.cls==='ranger'){ gainResource(p, evasionDodgeStamina(p)); survDodgeRegenStart(p); }
      try{ mirageOnDodge(g, p); }catch(e){}
      p.dodging = true; p.dodgeT = p.dodgeDur; if(p.partB && p.partB.sp && p.partB.sp.windroll) p.windT = 3;
      p.dodgeCharges -= 1;
      if(((p.skills && effectiveRank(p,'opportunist'))||0)>0) p.oppT = OPPORTUNIST_DUR;
      p.dodgeCdMax = applyCdr(p, finesseDodgeCooldown(p));
      if(p.dodgeCd<=0) p.dodgeCd = p.dodgeCdMax; // start the regen timer for the just-spent charge
      p.invuln = p.dodgeDur + 0.05; if(p.cls==='mystic'){ thunderstepDodge(game, p); windrunnerDodge(p); }
      p.movementStopT = 0; // (v105) a dodge roll always cancels the cast/attack movement stop
    }
    wantDodge=false;

    if(p.dodging){
      p.dodgeT -= dt;
      const spd = p.speed*3.1;
      // v91 fix: the dash used to apply its whole per-frame displacement in
      // one lump (spd*dt can be 10-15px+ at the dash's 3.1x speed
      // multiplier), then only resolved wall/obstacle collision AFTER the
      // move landed via pushOutOfRect's post-hoc nearest-edge push-out.
      // Once the dash's single-frame step was bigger than a wall's
      // thickness, the player's post-move center could end up on or past
      // the FAR side of the wall rect, so pushOutOfRect (which just clamps
      // to the rect and pushes out toward whichever edge is nearest) could
      // shove the player fully through instead of back out the entry
      // side -- classic tunneling. Fix: sub-step the dash's displacement
      // into small (<=4px) increments and resolve collision (room bounds +
      // every obstacle rect) after EACH increment, same as normal
      // movement's collision resolution, just called more than once per
      // frame. Each individual step is now far smaller than any wall's
      // thickness, so the player is only ever slightly inside a rect when
      // pushOutOfRect runs, and it always pushes back out the side the
      // player actually entered from -- the dash now stops/slides at the
      // wall like ordinary movement instead of clipping through it, while
      // still covering the same total distance (same speed/duration feel)
      // when nothing blocks it.
      const totalDx = p.dodgeDir.x*spd*dt, totalDy = p.dodgeDir.y*spd*dt;
      const totalDist = Math.hypot(totalDx, totalDy);
      const DODGE_SUBSTEP_MAX = 4; // px; well under wall thickness & player r
      const steps = Math.max(1, Math.ceil(totalDist/DODGE_SUBSTEP_MAX));
      const stepDx = totalDx/steps, stepDy = totalDy/steps;
      for(let dsi=0; dsi<steps; dsi++){
        p.x += stepDx; p.y += stepDy;
        p.x = clamp(p.x, p.r, room.w-p.r);
        p.y = clamp(p.y, p.r, room.h-p.r);
        pushOutOfObstacles(p, room.obstacles);
      }
      p.moving = true;
      if(p.dodgeT<=0) p.dodging=false;
    } else if(p.movementStopT>0){
      // (v105) Casting/attacking plants the player briefly -- movementStopT
      // was previously only honored by the Town movement path, so it never
      // actually did anything in combat. See applyCastMovementStop.
      p.moving = false;
    } else {
      let mv = screenDirToWorld(joyVec.x, joyVec.y);
      if(p.juggT>0){   // v342: Juggernaut never stops -- steer with the stick, otherwise keep charging the way you were going
        p.juggUserSteer = (mv.x!==0||mv.y!==0);
        if(p.juggUserSteer){ const jd=Math.hypot(mv.x,mv.y)||1; p.juggDir = {x:mv.x/jd, y:mv.y/jd}; }
        else mv = p.juggDir || p.facing;
        p.juggPX = p.x; p.juggPY = p.y;
      }
      if(mv.x!==0||mv.y!==0){
        const webMult = (p.juggT>0 ? JUGG_SPEED*(1 + JUGG_SPEED_PER_SEC*(p.juggClock||0)) : 1) * (p.webSlowT>0 ? 0.45 : 1) * whirlSlowMult(p) * (p.bulwarkT>0 ? BULWARK_SLOW : 1) * iceArmorSlowMult(p) * permafrostSpeedMult(p) * (p.chillT>0 ? PLAYER_CHILL_MULT : 1);
        p.x += mv.x*p.speed*webMult*dt;
        p.y += mv.y*p.speed*webMult*dt;
        if(p.juggT>0) p.juggExp = Math.hypot(mv.x,mv.y)*p.speed*webMult*dt;
        const md=Math.hypot(mv.x,mv.y)||1;
        p.facing = {x:mv.x/md, y:mv.y/md};
        p.faceSign = screenFacingSign(p.facing.x,p.facing.y);
        p.moving = true;
      } else {
        p.moving = false;
      }
    }
  }
  // v453: monsters are solid -- you can't walk through them (dodging, Leap and Juggernaut still pass through)
  if(!p.dodging && !(p.juggT>0) && !(p.leapT>0) && !(p.shadowStepT>0)){
    for(const e of g.enemies){
      if(!(e.hp>0) || e.dead || e.submerged || e.burrowed || e.hidden || e.isAlly) continue;
      const dx = p.x-e.x, dy = p.y-e.y, rr = p.r + (e.r||12)*0.9, d2 = dx*dx+dy*dy;
      if(d2 < rr*rr && d2 > 0.0001){ const d = Math.sqrt(d2), push = rr-d; p.x += dx/d*push; p.y += dy/d*push; }
    }
  }
  p.x = clamp(p.x, p.r, room.w-p.r);
  p.y = clamp(p.y, p.r, room.h-p.r);
  pushOutOfObstacles(p, room.obstacles);
  // v344: Juggernaut hits a wall / rock / pool edge -> slide off it instead of grinding against it
  if(p.juggT>0 && p.juggPX!==undefined){
    const moved = Math.hypot(p.x-p.juggPX, p.y-p.juggPY);
    if(moved < 0.45*(p.juggExp||1)){ p.juggBlockT = (p.juggBlockT||0) + dt; } else p.juggBlockT = 0;
    if(p.juggBlockT>0.06 && !p.juggUserSteer){
      const cur = Math.atan2((p.juggDir||p.facing).y, (p.juggDir||p.facing).x);
      for(const off of [1.05,-1.05,1.75,-1.75,2.45,-2.45,3.14]){
        const a = cur+off, tx = p.x+Math.cos(a)*34, ty = p.y+Math.sin(a)*34;
        if(tx>p.r+4 && ty>p.r+4 && tx<room.w-p.r-4 && ty<room.h-p.r-4 && !posBlockedByObstacles(tx,ty,p.r,room.obstacles)){ p.juggDir = {x:Math.cos(a), y:Math.sin(a)}; break; }
      }
      p.juggBlockT = 0;
    }
  } else if(p.juggBlockT) p.juggBlockT = 0;

  // (v105) snapshot every active skill's cooldown before this frame's attack
  // + skill blocks run; applyCastMovementStop below compares against it to
  // detect which skills were actually cast this frame.
  const castCdSnap = snapshotSkillCds(p);
  gateResourceWants(p);

  // attack
  const isBow = !!(p.equipment.mainhand && p.equipment.mainhand.slotType==='bow');
  const staffItem = (p.equipment.mainhand && p.equipment.mainhand.slotType==='staff') ? p.equipment.mainhand : null;
  if(wantAttack && p.atkCd<=0 && !preciseShotActive(p)){
    p.atkCd = p.atkCdMax;
    // Melee range bump: base reach 62->74 (~20%), a modest bump to feel
    // more forgiving without turning Strike into a ranged attack; the
    // target-acquisition radius just below is bumped proportionally.
    // v195: two-handers out-reach one-handers/Fury; Cleave out-reaches them all (target acquisition follows the reach)
    const twoHM = !!(p.equipment.mainhand && p.equipment.mainhand.twoHanded && !isBow && !staffItem);
    const cleaveNow = twoHM && (effectiveRank(p,'cleave')||0)>0;
    const reachExtra = twoHM ? TWOHAND_REACH_BONUS + (cleaveNow ? CLEAVE_RANGE_BONUS : 0) : 0;   // every two-hander out-reaches a one-hander; Cleave adds on top
    const reach = 58 + (twoHM ? TWOHAND_REACH_BONUS : 0) + (p.weaponReachBonus||0);   // v193: -10%; v520: another -13% (base Strike AoE was too big)
    const target = (isBow||staffItem||p.cls==='mystic') ? nearestEnemyOnScreen(g, p, BOW_RANGE+(p.weaponReachBonus||0)) : nearestEnemy(g, p, 68+reachExtra*0.9+(p.weaponReachBonus||0));
    let ang;
    if(target){ ang = Math.atan2(target.y-p.y, target.x-p.x); }
    else { ang = Math.atan2(p.facing.y,p.facing.x); const pcc = (PC.lmb||PC.strikeKey) ? pcCursorWorld() : null; if(pcc && (Math.abs(pcc.x-p.x)>3 || Math.abs(pcc.y-p.y)>3)) ang = Math.atan2(pcc.y-p.y, pcc.x-p.x); }
    p.facing = {x:Math.cos(ang), y:Math.sin(ang)};
    p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
    p.atkAnimT = 0.22; p.atkAnimMax = 0.22;
    if(uq(p,'uq_crater') && !(p.crStompCd>0)) crStomp(g, p, ang);   // v387 Crater Stomp
    let dmg = wpnDmg(p);
    // Storm (Djinn, v75): +20% Crit Chance against whatever's currently
    // inside the player's Storm zone -- hooked in here since this is the
    // shared crit roll every basic-attack weapon type (staff/bow/melee)
    // below already reads.
    const isCrit = Math.random()*100 < (p.critChance||0) + (p.rallyT>0 ? RALLY_CRIT_BONUS : 0) + (isBow ? arrowEyeCritBonus(p) : 0) + stormCritBonus(p, target);
    if(isCrit) dmg *= critMultOf(p);
    dmg *= assaultDealtMult(p) * weaponDmgMult(p);
    lastHitCrit = isCrit; // styles damage numbers for this swing's melee hits (reset below)
    if(staffItem || (p.cls==='mystic' && !isBow)){
      // (v99 fix) Lightning Arc and Soul Sap USED to unconditionally
      // override this default staff bolt once ranked -- neither does
      // anymore (see each skill's own ACTIVE_SKILL_REGISTRY entry and its
      // independent wantLightningArc/wantSoulSap cast block below): they're
      // now normal Main/1/2/3-assignable active skills with zero side
      // effect on the base Strike attack, so this branch always just fires
      // the Mystic's plain default spell bolt, same as before either skill
      // ever existed.
      const spell = (staffItem && staffItem.spell) || 'fire';
      const stN = staffItem ? staffBonusFor(p, spell==='fire'?'fireball':spell==='ice'?'iceBolt':'lightningArc') : 0;
      const skillAllocated = spell==='lightning' ? ((p.skills&&p.skills.lightningArc)||0)>0 : ((p.skills&&(spell==='fire'?p.skills.fireball:p.skills.iceBolt))||0)>0;
      if(false && stN>0 && !skillAllocated){   // v454: Strike is always the plain arcane bolt now -- a staff's spell power only boosts the skill once you learn it
        // Skill not allocated: Strike casts the staff's skill as if it were allocated at the staff's rank.
        if(spell==='lightning') castLightningArcBolt(g, p, stN);
        else {
          const isF = spell==='fire';
          const sd = elementalPolarityDmg(p, isF?FIREBALL_BASE_DMG:ICE_BOLT_BASE_DMG, stN, isF?'fireball':'iceBolt') * (isCrit?critMultOf(p):1);
          g.projectiles.push({x:p.x, y:p.y, vx:Math.cos(ang)*ELEMENTAL_BOLT_SPEED, vy:Math.sin(ang)*ELEMENTAL_BOLT_SPEED,
            r:7, dmg:sd, from:'player', life:1.4, color:isF?'#ff7a3d':'#7ad0ff', isArrow:true, crit:isCrit, isFireball:isF, isIceBolt:!isF});
        }
      } else   // v454: Strike is a plain purple arcane bolt for every Mystic (no element, no ailment)
      g.projectiles.push({x:p.x, y:p.y, vx:Math.cos(ang)*STAFF_BOLT_SPEED*projectileSpeedMult(p), vy:Math.sin(ang)*STAFF_BOLT_SPEED*projectileSpeedMult(p),
        r:6, dmg, from:'player', life:1.4, color:'#b57bff', isArrow:true, isArcaneBolt:true, crit:isCrit});
    } else if(isBow){
      if(p.cls==='ranger') gainResource(p, STAMINA_ON_SHOT);
      // Ranger basic attack: one arrow (v495: Multi Shot is its own button now and no longer changes Strike)
      g.projectiles.push({x:p.x, y:p.y, vx:Math.cos(ang)*BOW_ARROW_SPEED*projectileSpeedMult(p), vy:Math.sin(ang)*BOW_ARROW_SPEED*projectileSpeedMult(p),
        r:5, dmg, from:'player', life:1.4, color:'#e8c44a', isArrow:true, crit:isCrit});
    } else {
      // Cleave (Berserker, v56): while wielding a two-handed weapon AND
      // ranked, the basic Strike auto-becomes the wide-arc Cleave sweep
      // instead of a normal single-target swing -- the exact same
      // gear-conditional-swap pattern Fury already uses below for dual
      // one-handed swords (no separate button/cooldown for either; both
      // just ride the shared Strike cooldown). Equipping a twoHanded
      // mainhand always empties/blocks the offhand slot (see the `blocked`
      // check in the equip-item code), so a character can never have BOTH
      // a two-handed weapon AND two one-handed swords equipped at once --
      // Cleave and Fury are mutually exclusive purely by gear state, and
      // checking cleaveOn first is just a formality, not a real race.
      const cleaveRank = effectiveRank(p,'cleave')||0;
      const cleaveOn = cleaveRank>0 && !!(p.equipment.mainhand && p.equipment.mainhand.twoHanded) && (p.mp||0) >= CLEAVE_RAGE_COST;
      if(cleaveOn){
        p.mp = Math.max(0, (p.mp||0) - CLEAVE_RAGE_COST);
        const cMult = swd('cleave', cleaveRank);
        const reach2 = (67 + TWOHAND_REACH_BONUS + CLEAVE_RANGE_BONUS + (p.weaponReachBonus||0)) * aoeRadiusMult(p);
        const baseDmg = wpnDmg(p);
        const cleaveDmg = baseDmg * cMult * assaultDealtMult(p) * weaponDmgMult(p) * offensiveStanceDmgMult(p);
        const cleavePen = CLEAVE_ARMORPEN_PER_RANK * cleaveRank; // +5%/rank armor pen, folded into applyEnemyArmor
        p.atkAnimT = 0.24; p.cleaveT = 0.34; p.cleaveMax = 0.34; p.cleaveAng = ang;
        for(const e of g.enemies){
          const d = dist(p,e);
          if(d < reach2+e.r){
            const eang = Math.atan2(e.y-p.y, e.x-p.x);
            let diff = Math.abs(eang-ang);
            if(diff>Math.PI) diff = 2*Math.PI-diff;
            if(diff < CLEAVE_HALF_ANGLE){
              e.hp -= applyEnemyArmor(p, e, cleaveDmg, cleavePen); e.hitT = 0.15;
              staggerEnemy(e, STAGGER_DUR);
              checkExecute(g, e);
              applyOffensiveStanceBleed(p, e, cleaveDmg);
              const kb=10; e.x += Math.cos(eang)*kb; e.y += Math.sin(eang)*kb;
            }
          }
        }
        p.cleaveReach = reach2;
      } else {
        // Fury (Berserker, v55): while dual-wielding two one-handed swords AND
        // ranked, the basic Strike becomes a quick 3-hit combo instead of a
        // single swing -- each hit independently re-checks range/arc (so it
        // can land on different/moving enemies) and its own damage is scaled
        // up per rank via skillMult, same curve every other ranked skill uses.
        const furyRank = effectiveRank(p,'fury')||0;
        const furyOn = furyRank>0 && furyDualSwordsEquipped(p) && (p.mp||0) >= FURY_RAGE_COST;
        if(furyOn){
          p.mp = Math.max(0, (p.mp||0) - FURY_RAGE_COST);
          // v208 Fury: three quick, separate sword hits ("boom boom boom") -- each resolved on its own beat with its own
          // slash, its own crit roll and damage roll (so three different numbers), instead of all landing at once
          const gap = Math.min(0.1, (p.atkCdMax||0.5)/3.6);
          p.furyQ = [];
          for(let hi=0; hi<FURY_HITS; hi++) p.furyQ.push({t:hi*gap, idx:hi, gap, rank:furyRank});
        }
        const hits = furyOn ? 0 : 1;
        const hitDmg = furyOn ? dmg*skillMult(furyRank) : dmg;
        for(let hi=0; hi<hits; hi++){
          const hitAng = furyOn ? ang + (hi-(hits-1)/2)*FURY_HIT_ANGLE_SPREAD : ang;
          for(const e of g.enemies){
            const d = dist(p,e);
            if(d < reach+e.r){
              const eang = Math.atan2(e.y-p.y, e.x-p.x);
              let diff = Math.abs(eang-hitAng);
              if(diff>Math.PI) diff = 2*Math.PI-diff;
              if(diff < 0.7){   // v520: narrower swing (was 0.95)
                e.hp -= applyEnemyArmor(p, e, hitDmg); e.hitT = 0.15;
                staggerEnemy(e, STAGGER_DUR);
                if(isCrit) hitStop(g, 0.04);
                checkExecute(g, e);
                applyOffensiveStanceBleed(p, e, hitDmg);
                const kb=8; e.x += Math.cos(eang)*kb; e.y += Math.sin(eang)*kb;
              }
            }
          }
          const slashDist = 32+(p.weaponReachBonus||0)*0.3;
          // v373: a Mystic striking without a staff throws a little arcane burst instead of a sword slash
          g.particles.push({type:p.cls==='mystic' ? 'arcaneStrike' : 'slash', x:p.x+Math.cos(hitAng)*slashDist, y:p.y+Math.sin(hitAng)*slashDist, ang:hitAng, t:p.cls==='mystic'?0.24:0.16, max:p.cls==='mystic'?0.24:0.16, crit:isCrit});
        }
      }
    }
  }
  wantAttack=false;
  lastHitCrit = false;

  // shield bash / Slam (Defender skill): a plain active trigger on its own
  // cooldown that strikes like a Strike attack, aimed the same directional
  // way -- not a full-circle AoE. No passive block is tied to this button;
  // block chance (see blockChance()) is a separate passive check.
  if(wantShieldBash){
    wantShieldBash=false;
    const hasShield = !!(p.equipment.offhand && p.equipment.offhand.slotType==='shield');
    const bashRank = effectiveRank(p,'shieldBash')||0;
    if(hasShield && bashRank>0 && !p.dodging && p.atkCd<=0){
      p.movementStopT = 0.1;
      const mult = swd('shieldBash', bashRank);
      p.atkCd = p.atkCdMax;   // v342: back on the shared swing timer -- same speed as Strike, Smite, Vengeance, Fury and Cleave
      const reach = (62 + (p.weaponReachBonus||0)) * aoeRadiusMult(p);
      let slamHits = 0;
      const target = nearestEnemy(g, p, 70+(p.weaponReachBonus||0));
      const ang = target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y,p.facing.x);
      p.facing = {x:Math.cos(ang), y:Math.sin(ang)};
      p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
      p.atkAnimT = 0.22; p.bashAnimT = 0.3; p.bashAnimMax = 0.3;
      // v454: Rank 1 hits exactly like Strike (same base, weapon damage and crit roll); ranks add +5% each
      const slamCrit = Math.random()*100 < (p.critChance||0) + (p.rallyT>0 ? RALLY_CRIT_BONUS : 0);
      const baseDmg = wpnDmg(p);
      const dmg = baseDmg * mult * assaultDealtMult(p) * weaponDmgMult(p) * (slamCrit ? critMultOf(p) : 1);
      lastHitCrit = slamCrit;
      for(const e of g.enemies){
        const d = dist(p,e);
        if(d < reach+e.r){
          const eang = Math.atan2(e.y-p.y, e.x-p.x);
          let diff = Math.abs(eang-ang);
          if(diff>Math.PI) diff = 2*Math.PI-diff;
          if(diff < 0.95){
            e.hp -= applyEnemyArmor(p, e, dmg); e.hitT = 0.15;
            staggerEnemy(e, STAGGER_DUR); // (v105) flinch, same as a melee Strike -- runs after the stun below ends
            slamHits++;   // v374: no guaranteed stun any more; only the stun-chance roll below can stun
            checkExecute(g, e);
            // Shield Bash applies a short stun on every rank; at Rank 5
            // (its mastery rank) that becomes a much longer Knockdown.
            // (v106 fix) the stun is a CHANCE per hit (shieldStunChance), not guaranteed.
            if(Math.random() < slamStunChance(bashRank)){
              const stunDur = shieldBashStunDuration(bashRank);
              e.stunT = Math.max(e.stunT||0, stunDur);
              e.knockdown = bashRank>=SHIELD_BASH_KNOCKDOWN_RANK;
            }
            const kb=10; e.x += Math.cos(eang)*kb; e.y += Math.sin(eang)*kb;
          }
        }
      }
      lastHitCrit = false;
      if(slamHits>0) gainResource(p, Math.min(slamHits, SLAM_RAGE_TARGETS)*(SLAM_RAGE_PER_TARGET + SLAM_RAGE_STEP*(bashRank-1)));   // v266: Slam GENERATES Rage
      g.particles.push({type:'wave', x:p.x, y:p.y, ang, arc:0.95, reach, t:0.22, max:0.22, c1:'190,210,235', c2:'255,255,255'});
    }
  }

  // shield throw (Defender skill): thrown shield damages+stuns then returns
  if(wantThrow){
    wantThrow=false;
    const hasShield = !!(p.equipment.offhand && p.equipment.offhand.slotType==='shield');
    const throwRank = effectiveRank(p,'shieldThrow')||0;
    if(throwRank>0 && hasShield && p.shieldThrowCd<=0 && !g.shieldThrow){
      p.movementStopT = 0.2;
      const mult = skillMult(throwRank);
      const stunDur = 1 + 0.25*(throwRank-1);
      const target = nearestEnemy(g, p, SHIELD_THROW_RANGE);
      const ang = target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y,p.facing.x);
      p.facing = {x:Math.cos(ang), y:Math.sin(ang)}; p.faceSign = screenFacingSign(p.facing.x, p.facing.y); p.throwAnimT = 0.3;
      const speed = SHIELD_THROW_SPEED;
      g.shieldThrow = {
        x:p.x, y:p.y, vx:Math.cos(ang)*speed, vy:Math.sin(ang)*speed, r:12,
        phase:'out', dist:0, maxDist:SHIELD_THROW_RANGE, hasHit:false,
        dmg: wpnDmg(p) * swd('shieldThrow', throwRank) * assaultDealtMult(p),   // v352 +20%, v367 doubled again: 2.4x on every rank
        stunDur, stunChance: shieldStunChance(throwRank), chainsLeft: shieldThrowMaxChains(throwRank), hitEnemies: [],
      };
      p.shieldThrowCdMax = applyCdr(p, effectiveShieldThrowCooldown(throwRank));
      p.shieldThrowCd = p.shieldThrowCdMax;
    }
  }
  if(g.shieldThrow){
    const st = g.shieldThrow;
    if(st.phase==='out'){
      const stepX=st.vx*dt, stepY=st.vy*dt;
      st.x+=stepX; st.y+=stepY; st.dist += Math.hypot(stepX,stepY);
      let justHit = false;
      for(const e of g.enemies){
        if(st.hitEnemies.indexOf(e)>=0) continue;
        if(dist(st,e) < st.r+e.r){
          e.hp -= applyEnemyArmor(p, e, st.dmg); e.hitT = 0.15;
          if(Math.random() < (st.stunChance||0)) e.stunT = st.stunDur; // (v106 fix) chance, not guaranteed
          checkExecute(g, e);
          st.hasHit = true; st.hitEnemies.push(e); justHit = true;
          g.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:'#cdd8e6'});
          break;
        }
      }
      if(justHit){
        if(st.chainsLeft>0){
          // bounce to another nearby, not-yet-hit enemy instead of returning
          const next = nearestEnemy(g, st, SHIELD_CHAIN_RANGE, st.hitEnemies);
          if(next){
            const ang2 = Math.atan2(next.y-st.y, next.x-st.x);
            const speed2 = SHIELD_THROW_SPEED;
            st.vx = Math.cos(ang2)*speed2; st.vy = Math.sin(ang2)*speed2;
            st.dist = 0; st.chainsLeft--;
          } else {
            st.phase = 'returning';
          }
        } else {
          st.phase = 'returning';
        }
      } else if(st.dist>=st.maxDist){
        st.phase='returning';
      }
    } else {
      const ang = Math.atan2(p.y-st.y, p.x-st.x);
      st.x += Math.cos(ang)*SHIELD_THROW_RETURN_SPEED*dt; st.y += Math.sin(ang)*SHIELD_THROW_RETURN_SPEED*dt;
      if(dist(st,p) < 20) g.shieldThrow = null;
    }
  }

  // Juggernaut (Defender capstone, v342): roar, fill Rage, then charge nonstop while the Rage drains.
  if(wantGuardian){
    wantGuardian=false;
    const gRank = effectiveRank(p,'guardian')||0;
    if(gRank>0 && p.guardianCd<=0 && !(p.juggT>0) && !(p.juggWindT>0) && !p.dodging){
      p.guardianCdMax = applyCdr(p, GUARDIAN_CD); p.guardianCd = p.guardianCdMax;
      p.juggRank = gRank; p.juggWindT = JUGG_WIND; p.juggRingT = 0; p.movementStopT = JUGG_WIND;
      showMsg('JUGGERNAUT!', 0.9);
      g.particles.push({type:'burst', x:p.x, y:p.y, t:0.5, max:0.5, color:'#ff9a70'});
      shakeScreen(g, 4, 0.3);
    }
  }

  // trap (Hunter capstone): plant a one-shot trap at your feet. The first
  // enemy to walk into it is rooted in place and takes damage. Cooldown is
  // in the same ballpark as Guardian/Assault.
  if(p.trapCd>0) p.trapCd -= dt;
  if(wantTrap){
    wantTrap=false;
    const tRank = effectiveRank(p,'trap')||0;
    if(tRank>0 && p.trapCd<=0){
      const dmg = wpnDmg(p) * swd('trap', tRank);
      const rootDur = TRAP_ROOT_DURATION + TRAP_ROOT_STEP*(tRank-1);
      if(!g.traps) g.traps = [];
      g.traps.push({x:p.x, y:p.y, r:TRAP_RADIUS, dmg, rootDur, life:TRAP_LIFETIME});
      p.trapCd = applyCdr(p, p.trapCdMax);
      showMsg('Trap set!', 0.8);
      g.particles.push({type:'burst', x:p.x, y:p.y, t:0.3, max:0.3, color:'#8a6a2a'});
    }
  }
  // Pack Tactics (Hunter skill, requires Summon Wolf): new PACK button.
  // Every current wolf/bear-kind follower instantly snaps to the player's
  // current target and lands one bonus-damage attack against it, then
  // resumes its normal AI on the very next frame (no persistent state
  // needed -- the jump+hit both happen in this same block).
  if(p.packTacticsCd>0) p.packTacticsCd -= dt;
  if(wantPackTactics){
    wantPackTactics=false;
    const ptRank = effectiveRank(p,'packTactics')||0;
    if(ptRank>0 && p.packTacticsCd<=0){
      const target = nearestEnemy(g, p, BOW_RANGE+(p.weaponReachBonus||0));
      if(target && g.followers && g.followers.length){
        const packFollowers = g.followers.filter(f=>f.kind==='wolf'||f.kind==='bear');
        if(packFollowers.length){
          p.packTacticsCdMax = applyCdr(p, packTacticsCooldown(ptRank));
          p.packTacticsCd = p.packTacticsCdMax;
          const dmgMult = packTacticsDmgMult(ptRank);
          packFollowers.forEach((f,i)=>{
            if(f.leap) return;
            const jumpAng = (Math.atan2(f.y-target.y, f.x-target.x)) + (i-(packFollowers.length-1)/2)*0.7;
            f.leap = {t:0, dur:AMBUSH_LEAP_T, sx:f.x, sy:f.y, ang:jumpAng, target, mult:dmgMult, tx:target.x, ty:target.y, d:dist(f,target)};
            f.atkCd = FOLLOWER_ATK_CD; f.animT = 0; f.recallDash = 0;
            g.particles.push({type:'burst', x:f.x, y:f.y, t:0.2, max:0.2, color: f.kind==='bear' ? '#8a6a2a' : '#b4293f'});
          });
          showMsg('Ambush!', 0.7);
        }
      }
    }
  }

  if(g.traps && g.traps.length){
    for(let ti=g.traps.length-1; ti>=0; ti--){
      const tr = g.traps[ti];
      tr.life -= dt;
      let consumed = false;
      for(const e of g.enemies){
        if(dist(e,tr) < tr.r+e.r){
          e.hp -= applyEnemyArmor(p, e, tr.dmg);
          e.hitT = 0.15;
          checkExecute(g, e);
          e.trapRootT = Math.max(e.trapRootT||0, tr.rootDur);
          g.particles.push({type:'burst', x:tr.x, y:tr.y, t:0.3, max:0.3, color:'#8a6a2a'});
          consumed = true;
          break;
        }
      }
      if(consumed || tr.life<=0) g.traps.splice(ti,1);
    }
  }

  // Shadow Step (Assassin skill): teleport behind the closest enemy in
  // range and immediately trigger a basic attack. The attack itself is not
  // duplicated here -- clearing atkCd and setting wantAttack just lets the
  // normal attack code above (which already re-picks nearestEnemy from the
  // player's current position every time it fires) land on the very next
  // update() pass, now that the player is standing right behind the target.
  if(p.shadowStepCd>0) p.shadowStepCd -= dt;
  if(wantShadowStep){
    wantShadowStep=false;
    const ssRank = effectiveRank(p,'shadowStep')||0;
    if(ssRank>0 && p.shadowStepCd<=0){
      const target = nearestEnemy(g, p, SHADOW_STEP_RANGE);
      if(target){
        const dest = shadowStepDestination(g, target, p);
        p.x = dest.x; p.y = dest.y;
        const ang = Math.atan2(target.y-p.y, target.x-p.x);
        p.facing = {x:Math.cos(ang), y:Math.sin(ang)};
        p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
        p.shadowStepCdMax = applyCdr(p, shadowStepCooldown(ssRank));
        p.shadowStepCd = p.shadowStepCdMax;
        p.atkCd = 0;
        wantAttack = true;
        showMsg('Shadow Step!', 0.6);
        g.particles.push({type:'burst', x:p.x, y:p.y, t:0.3, max:0.3, color:'#b48ce8'});
      }
    }
  }

  // Rapid Shot (Marksman skill, v79 rework): new RAPID button. Fires 3
  // arrows one after another (a timed burst, RAPID_SHOT_INTERVAL apart) at
  // whatever the bow basic attack would target -- distinct from Multi
  // Shot's simultaneous spread. The burst plays out over the following
  // few frames via p.rapidShotBurst rather than all landing on one
  // update() pass. v79: the burst now also carries `target` (the enemy
  // locked in at throw time) and `hitsOnTarget` (a running count of how
  // many of THIS burst's arrows have connected with that exact same
  // enemy) so the collision handler can tell whether the 3rd arrow should
  // get its armor-pen bonus -- see the isRapidShot branch above.
  if(p.rapidShotCd>0) p.rapidShotCd -= dt;
  if(wantRapidShot){
    wantRapidShot=false;
    const rsRank = effectiveRank(p,'rapidShot')||0;
    if(rsRank>0 && isBow && p.atkCd<=0 && !p.rapidShotBurst && !p.dodging){   // v489: a free basic shot on the Strike timer
      const target = nearestEnemy(g, p, BOW_RANGE+(p.weaponReachBonus||0));
      const ang = target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y, p.facing.x);
      p.facing = {x:Math.cos(ang), y:Math.sin(ang)};
      p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
      p.atkCd = p.atkCdMax*RAPID_SHOT_ATKCD_MULT; p.atkAnimT = 0.2;
      gainResource(p, STAMINA_ON_SHOT);
      p.rapidShotBurst = {left:RAPID_SHOT_COUNT, timer:0, ang, rank:rsRank, target:target||null, hitsOnTarget:0};
    }
  }
  if(p.rapidShotBurst){
    const b = p.rapidShotBurst;
    b.timer -= dt;
    if(b.timer<=0){
      b.timer += RAPID_SHOT_INTERVAL;
      const arrowIdx = RAPID_SHOT_COUNT - b.left + 1; // 1st/2nd/3rd arrow of this burst
      const rsDmg = wpnDmg(p) * swd('rapidShot', b.rank) * assaultDealtMult(p) * weaponDmgMult(p);
      const rsCrit = Math.random()*100 < (p.critChance||0) + (p.rallyT>0 ? RALLY_CRIT_BONUS : 0) + arrowEyeCritBonus(p);
      const ffR = effectiveRank(p,'favouredFoe')||0, ffPierce = arrowIdx===RAPID_SHOT_COUNT && ffR>0 && Math.random() < favouredFoePierce(ffR);   // v454 Favoured Foe
      g.projectiles.push({x:p.x, y:p.y, vx:Math.cos(b.ang)*BOW_ARROW_SPEED*projectileSpeedMult(p), vy:Math.sin(b.ang)*BOW_ARROW_SPEED*projectileSpeedMult(p),
        r:5, dmg:rsCrit?rsDmg*critMultOf(p):rsDmg, from:'player', life:1.4, color:ffPierce?'#ffe08a':'#e8c44a', isArrow:true, crit:rsCrit,
        isRapidShot:true, rsBurst:b, rsArrowIdx:arrowIdx, pierceLeft:ffPierce?8:0, pierceNoFall:ffPierce});
      b.left--;
      if(b.left<=0) p.rapidShotBurst = null;
    }
  }

  // Crippling Shot (Hunter skill): new CRIPPLE button. Fires a single
  // bow shot that applies Bleed on hit (reusing e.bleedT/e.bleedDps, the
  // same DoT mechanism Offensive Stance and the Wolf companion use), with
  // both its own hit damage and its Bleed's damage-per-second scaling
  // per rank. Fixed cooldown -- ranks don't shorten it, per its design.
  // v267: Crippling Shot / Stun Shot now ride the Strike cooldown (p.atkCd) like a normal shot: no cooldown of their own,
  // a Stamina cost instead (6% / 8%), and each one refunds the usual 3% a basic shot does.
  if(p.cripplingShotCd>0) p.cripplingShotCd -= dt;
  if(p.stunShotCd>0) p.stunShotCd -= dt;
  if(p.explosiveShotCd>0) p.explosiveShotCd -= dt;
  if(wantCripplingShot){
    const csRank = effectiveRank(p,'cripplingShot')||0;
    if(csRank>0 && p.atkCd>0 && p.atkCd<0.25 && !(p.cripplingShotCd>0)){ /* buffer the press until Strike is ready */ }
    else {
      wantCripplingShot=false;
      if(csRank>0 && p.atkCd<=0 && !p.dodging && !(p.cripplingShotCd>0) && resourceAffordable(p,'cripplingShot')){
        const target = nearestEnemy(g, p, BOW_RANGE+(p.weaponReachBonus||0));
        const ang = target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y, p.facing.x);
        p.facing = {x:Math.cos(ang), y:Math.sin(ang)};
        p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
        p.atkAnimT = 0.2;
        p.atkCd = p.atkCdMax;
        p.cripplingShotCdMax = applyCdr(p, CRIPPLING_SHOT_CD); p.cripplingShotCd = p.cripplingShotCdMax;
        const csDmg = wpnDmg(p) * swd('cripplingShot', csRank) * assaultDealtMult(p) * weaponDmgMult(p);
        g.projectiles.push({x:p.x, y:p.y, vx:Math.cos(ang)*BOW_ARROW_SPEED*projectileSpeedMult(p), vy:Math.sin(ang)*BOW_ARROW_SPEED*projectileSpeedMult(p),
          r:5, dmg:csDmg, from:'player', life:1.4, color:'#b4293f', isArrow:true, isCripplingShot:true, bleedPct:cripplingShotBleedPct(csRank)});
      }
    }
  }
  if(wantMultiShot){   // v495 Multi Shot: a free basic shot like Splinter and Rapid Shot -- a fan of arrows that refills Stamina
    const msRank = effectiveRank(p,'multiShot')||0;
    if(msRank>0 && p.atkCd>0 && p.atkCd<0.25){ /* buffer the press until Strike is ready */ }
    else {
      wantMultiShot=false;
      if(msRank>0 && isBow && p.atkCd<=0 && !p.dodging){
        const target = nearestEnemyOnScreen(g, p, BOW_RANGE+(p.weaponReachBonus||0));
        const ang = target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y, p.facing.x);
        p.facing = {x:Math.cos(ang), y:Math.sin(ang)}; p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
        p.atkAnimT = 0.22; p.atkAnimMax = 0.22; p.atkCd = p.atkCdMax;
        gainResource(p, STAMINA_ON_SHOT);
        const msCrit = Math.random()*100 < (p.critChance||0) + (p.rallyT>0 ? RALLY_CRIT_BONUS : 0) + arrowEyeCritBonus(p);
        const msDmg = wpnDmg(p) * MARKSMAN_DMG_TUNE * assaultDealtMult(p) * weaponDmgMult(p) * (msCrit ? critMultOf(p) : 1);
        const count = multiShotCount(msRank);
        for(let k=0;k<count;k++){
          const kAng = ang + (k-(count-1)/2) * (MULTI_SHOT_SPREAD/(count-1));
          g.projectiles.push({x:p.x, y:p.y, vx:Math.cos(kAng)*BOW_ARROW_SPEED*projectileSpeedMult(p), vy:Math.sin(kAng)*BOW_ARROW_SPEED*projectileSpeedMult(p),
            r:5, dmg:msDmg, from:'player', life:1.4, color:'#e8c44a', isArrow:true, crit:msCrit});
        }
      }
    }
  }
  if(wantSplinterShot){
    const spRank = effectiveRank(p,'splinterShot')||0;
    if(spRank>0 && p.atkCd>0 && p.atkCd<0.25){ /* buffer the press until Strike is ready */ }
    else {
      wantSplinterShot=false;
      if(spRank>0 && isBow && p.atkCd<=0 && !p.dodging){
        const target = nearestEnemyOnScreen(g, p, BOW_RANGE+(p.weaponReachBonus||0));
        const ang = target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y, p.facing.x);
        p.facing = {x:Math.cos(ang), y:Math.sin(ang)}; p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
        p.atkAnimT = 0.2; p.atkCd = p.atkCdMax;
        gainResource(p, STAMINA_ON_SHOT);   // v489: free basic shot
        const spCrit = Math.random()*100 < (p.critChance||0) + (p.rallyT>0 ? RALLY_CRIT_BONUS : 0) + arrowEyeCritBonus(p);
        const spDmg = wpnDmg(p) * swd('splinterShot', spRank) * assaultDealtMult(p) * weaponDmgMult(p) * (spCrit ? critMultOf(p) : 1);
        g.projectiles.push({x:p.x, y:p.y, vx:Math.cos(ang)*BOW_ARROW_SPEED*projectileSpeedMult(p), vy:Math.sin(ang)*BOW_ARROW_SPEED*projectileSpeedMult(p),
          r:5, dmg:spDmg, from:'player', life:1.4, color:'#d8b25a', isArrow:true, crit:spCrit, isSplinter:true});
      }
    }
  }
  if(wantExplosiveShot){
    const xsRank = effectiveRank(p,'explosiveShot')||0;
    if(xsRank>0 && p.atkCd>0 && p.atkCd<0.25){ /* buffer the press until Strike is ready */ }
    else {
      wantExplosiveShot=false;
      if(xsRank>0 && isBow && p.atkCd<=0 && !p.dodging && !(p.explosiveShotCd>0) && resourceAffordable(p,'explosiveShot')){
        const target = nearestEnemyOnScreen(g, p, BOW_RANGE+(p.weaponReachBonus||0));
        const ang = target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y, p.facing.x);
        p.facing = {x:Math.cos(ang), y:Math.sin(ang)}; p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
        p.atkAnimT = 0.2; p.atkCd = p.atkCdMax;
        p.explosiveShotCdMax = applyCdr(p, EXPLOSIVE_SHOT_CD); p.explosiveShotCd = p.explosiveShotCdMax;
        const xsCrit = Math.random()*100 < (p.critChance||0) + (p.rallyT>0 ? RALLY_CRIT_BONUS : 0) + arrowEyeCritBonus(p);
        const xsDmg = wpnDmg(p) * swd('explosiveShot', xsRank) * assaultDealtMult(p) * weaponDmgMult(p) * (xsCrit ? critMultOf(p) : 1);
        g.projectiles.push({x:p.x, y:p.y, vx:Math.cos(ang)*BOW_ARROW_SPEED*projectileSpeedMult(p), vy:Math.sin(ang)*BOW_ARROW_SPEED*projectileSpeedMult(p),
          r:5, dmg:xsDmg, from:'player', life:1.4, color:'#ff7a2a', isArrow:true, crit:xsCrit, isExplosiveShot:true, burnDur:expShotBurnDur(xsRank), blastK:swdX('explosiveShot',xsRank)/swd('explosiveShot',xsRank)});
      }
    }
  }
  if(wantStunShot){
    const ssRank2 = effectiveRank(p,'stunShot')||0;
    if(ssRank2>0 && p.atkCd>0 && p.atkCd<0.25 && !(p.stunShotCd>0)){ /* buffer */ }
    else {
      wantStunShot=false;
      if(ssRank2>0 && p.atkCd<=0 && !p.dodging && !(p.stunShotCd>0) && resourceAffordable(p,'stunShot')){
        const target = nearestEnemy(g, p, BOW_RANGE+(p.weaponReachBonus||0));
        const ang = target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y, p.facing.x);
        p.facing = {x:Math.cos(ang), y:Math.sin(ang)};
        p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
        p.atkAnimT = 0.2;
        p.atkCd = p.atkCdMax;
        p.stunShotCdMax = applyCdr(p, STUN_SHOT_CD); p.stunShotCd = p.stunShotCdMax;
        const stDmg = wpnDmg(p) * swd('stunShot', ssRank2) * assaultDealtMult(p) * weaponDmgMult(p);
        g.projectiles.push({x:p.x, y:p.y, vx:Math.cos(ang)*BOW_ARROW_SPEED*projectileSpeedMult(p), vy:Math.sin(ang)*BOW_ARROW_SPEED*projectileSpeedMult(p),
          r:5, dmg:stDmg, from:'player', life:1.4, color:'#f0d078', isArrow:true, isStunShot:true, stunDur:stunShotStunDuration(ssRank2), stunChance:stunShotStunChance(ssRank2)});
      }
    }
  }

  // ---- v227 Ranger redesign: Aimed Shot, Hunter's Mark, Beast Fury ----
  if(p.aimedShotCd>0) p.aimedShotCd -= dt;
  if(wantAimedShot){
    wantAimedShot=false;
    const asRank = effectiveRank(p,'aimedShot')||0;
    if(asRank>0 && isBow && p.aimedShotCd<=0){
      const target = nearestEnemy(g, p, BOW_RANGE+(p.weaponReachBonus||0));
      const ang = holdAimShotDir ? Math.atan2(holdAimShotDir.y, holdAimShotDir.x) : (target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y, p.facing.x));
      holdAimShotDir = null;
      p.facing = {x:Math.cos(ang), y:Math.sin(ang)};
      p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
      p.atkAnimT = 0.25; p.atkAnimMax = 0.25;
      const asFull = aimShotFull; aimShotFull = true;   // v267: held aim = 3x..4x, a quick tap = 1.5x
      p.aimedShotCdMax = applyCdr(p, AIMED_SHOT_CD); p.aimedShotCd = p.aimedShotCdMax;
      const asCrit = Math.random()*100 < (p.critChance||0) + (p.rallyT>0 ? RALLY_CRIT_BONUS : 0) + arrowEyeCritBonus(p) + (asFull ? AIMED_SHOT_CRIT_BONUS : 0);
      let asDmg = wpnDmg(p) * (asFull ? swd('aimedShot', asRank) : SKILL_WD.aimedShot.tap/100) * assaultDealtMult(p) * weaponDmgMult(p);
      if(asCrit) asDmg *= critMultOf(p);
      g.projectiles.push({x:p.x, y:p.y, vx:Math.cos(ang)*BOW_ARROW_SPEED*(asFull?1.25:1.05)*projectileSpeedMult(p), vy:Math.sin(ang)*BOW_ARROW_SPEED*(asFull?1.25:1.05)*projectileSpeedMult(p),
        r:asFull?6:5, dmg:asDmg, from:'player', life:1.4, color:asFull?'#ff9a3a':'#ffd9a0', isArrow:true, crit:asCrit, isAimedShot:true, pierceLeft:asFull?aimedShotPierce(asRank)-1:0});
      showMsg(asFull ? 'Aimed Shot!' : 'Quick Shot', 0.6);
    }
  }
  if(p.huntersMarkCd>0) p.huntersMarkCd -= dt;
  if(wantHuntersMark){
    wantHuntersMark=false;
    const hmRank = effectiveRank(p,'huntersMark')||0;
    if(hmRank>0 && p.huntersMarkCd<=0){
      const target = nearestEnemy(g, p, BOW_RANGE+(p.weaponReachBonus||0)+60);
      if(target){
        for(const e2 of g.enemies){ if(e2!==target && e2.markT>0) e2.markT = 0; }
        target.markT = HMARK_DUR + (hmRank-1); target.markBonus = HMARK_BONUS + HMARK_BONUS_STEP*(hmRank-1);
        p.huntersMarkCdMax = applyCdr(p, HMARK_CD); p.huntersMarkCd = p.huntersMarkCdMax;
        const ang = Math.atan2(target.y-p.y, target.x-p.x);
        p.facing = {x:Math.cos(ang), y:Math.sin(ang)}; p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
        p.atkAnimT = 0.2;
        g.particles.push({type:'ring', x:target.x, y:target.y, t:0.4, max:0.4, r:target.r+22, color:'#ff4a4a'});
        showMsg("Hunter's Mark!", 0.6);
      }
    }
  }
  if(p.beastFuryCd>0) p.beastFuryCd -= dt;
  if(p.beastFuryT>0){ p.beastFuryT -= dt; if(p.beastFuryT<0) p.beastFuryT = 0; }
  if(p.oppT>0) p.oppT -= dt;
  if(wantBeastFury){
    wantBeastFury=false;
    const bfRank = effectiveRank(p,'beastFury')||0;
    if(bfRank>0 && p.beastFuryCd<=0){
      p.beastFuryCdMax = applyCdr(p, BEAST_FURY_CD); p.beastFuryCd = p.beastFuryCdMax;
      p.beastFuryT = BEAST_FURY_DUR + (bfRank-1); p.beastFuryRank = bfRank;
      // v455: every bear lets out a roar -- nearby enemies (not bosses) are forced to attack it for a few seconds
      if(g.followers) for(const f of g.followers){
        if(f.kind!=='bear' || !(f.hp>0)) continue;
        const until = (g.clock||0) + bearRoarDur(bfRank);
        for(const e of g.enemies){ if(e.hp>0 && !isHeavyEnemy(e) && !e.isBoss && !e.isLairBoss && dist(e,f) < BEAR_ROAR_R){ e.tauntBy = f; e.tauntUntil = until; e.engaged = true; e.aggroed = true; } }
        g.particles.push({type:'ring', x:f.x, y:f.y, t:0.5, max:0.5, r:BEAR_ROAR_R, color:'#d9a45a'});
        g.particles.push({type:'ring', x:f.x, y:f.y, t:0.35, max:0.35, r:BEAR_ROAR_R*0.6, color:'#f0c070'});
        try{ sfxPlay('bossRoar', 0.5); }catch(e){}
      }
      showMsg('Beast Fury!', 0.8);
      g.particles.push({type:'burst', x:p.x, y:p.y, t:0.4, max:0.4, color:'#e0502a'});
      if(g.followers) for(const f of g.followers) g.particles.push({type:'burst', x:f.x, y:f.y, t:0.4, max:0.4, color:'#e0502a'});
    }
  }

  // Summon Wolf (Hunter skill, v80: reworked from passive auto-summon to
  // Recall (Hunter skill, v80, brand-new): calls every current follower
  // back to the player's side (same "snap to player" idea Rally already
  // uses) and grants the PLAYER a temporary damage buff (recallDmgMult,
  // folded into weaponDmgMult) plus a life-regen-over-time buff (ticked
  // just below, same %/s-of-max-HP shape Field Dress's regen uses).
  if(p.recallCd>0) p.recallCd -= dt;
  if(wantRecall){
    wantRecall=false;
    const rcRank = effectiveRank(p,'recall')||0;
    if(rcRank>0 && p.recallCd<=0){
      p.recallCd = applyCdr(p, p.recallCdMax);
      p.recallT = RECALL_BUFF_DUR;
      p.recallDmgBonusVal = recallDmgBonus(rcRank);
      p.recallRegenPctVal = recallRegenPct(rcRank);
      if(g.followers) for(const f of g.followers){ if(f.kind==='cat') continue; f.leap = null; f.leapZ = 0; f.recallDash = RECALL_DASH_T; f.shieldHp = f.maxHp*recallShieldPct(rcRank); f.shieldT = RECALL_BUFF_DUR; }
      p.recallShield = p.maxHp*recallPlayerShieldPct(rcRank); p.recallShieldT = RECALL_BUFF_DUR;
      showMsg('Recall!', 0.8);
      g.particles.push({type:'ring', x:p.x, y:p.y, t:0.4, max:0.4, r:120, color:'#7dd45a'});
      g.particles.push({type:'burst', x:p.x, y:p.y, t:0.4, max:0.4, color:'#7dd45a'});
    }
  }
  // Recall's buff window: ticks down, and while active, regenerates the
  // player's HP at the cast's cached rank-scaled rate -- same
  // Math.min(maxHp, ...) clamp pattern Field Dress's own regen tick uses.
  if(p.recallShieldT>0){ p.recallShieldT -= dt; if(p.recallShieldT<=0){ p.recallShieldT = 0; p.recallShield = 0; } }
  if(p.recallT>0){
    p.recallT -= dt; if(p.recallT<0) p.recallT=0;
    if((p.recallRegenPctVal||0)>0) p.hp = Math.min(p.maxHp, p.hp + p.maxHp*p.recallRegenPctVal*dt);
  }

  // v452: holding STRIKE (touch or left mouse) keeps attacking / casting the Main-slot attack
  if(attackHeld && !combatActionsBlocked() && !holdAimOn && !(p.pyroTorrentT>0)){
    const main = (p.skillSlots && p.skillSlots.main) || 'strike';
    if(main==='strike'){ if(!preciseShotActive(p) && !(p.atkCd>0)) wantAttack = true; }
    else if(HOLD_REPEAT_MAIN[main] && !(p.atkCd>0) && !(p.fbQueue && p.fbQueue.length)){ const en = ACTIVE_SKILL_REGISTRY[main]; if(en && (!en.cost || (p.souls||0) >= en.cost(p))) en.trigger(); }
  }
  // Precise Shot (Marksman capstone, reworked v64): once ranked (bow
  // equipped), the STRIKE button permanently changes from tap-fire into a
  // press-and-hold aim -- attackHeld (set by the btnAttack bindHold wiring
  // below) drives an aiming state here rather than firing wantAttack
  // immediately (see preciseShotActive()'s gate on the plain-attack block
  // above, which keeps this from double-firing a normal shot at the same
  // time). No fixed draw/aim-time any more: holding just shows the red aim
  // line (drawAimLineIso) and steers it off the movement stick, exactly
  // like Shield Throw/every other stick-aimed directional skill; RELEASING
  // fires in whatever direction was last aimed, gated only by its own
  // cooldown (same cooldown as the character's regular bow shot at Rank 1,
  // see preciseShotCooldown above).
  if(preciseShotActive(p)){
    if(attackHeld){
      if(!p.aiming){ p.aiming = true; p.aimDir = {x:p.facing.x, y:p.facing.y}; }
      const mv = screenDirToWorld(joyVec.x, joyVec.y);
      if(mv.x!==0 || mv.y!==0){
        const md = Math.hypot(mv.x,mv.y)||1;
        p.aimDir = {x:mv.x/md, y:mv.y/md};
        p.facing = {x:p.aimDir.x, y:p.aimDir.y};
        p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
      }
    } else if(p.aiming){
      // Released -- fire now (if off cooldown) in the last-aimed direction.
      p.aiming = false;
      if(p.preciseShotCd<=0){
        const ang = Math.atan2(p.aimDir.y, p.aimDir.x);
        let psDmg = (wpnDmg(p)) * PRECISE_SHOT_DMG_MULT;
        const psCrit = Math.random()*100 < (p.critChance||0) + (p.rallyT>0 ? RALLY_CRIT_BONUS : 0) + arrowEyeCritBonus(p);
        if(psCrit) psDmg *= critMultOf(p);
        psDmg *= assaultDealtMult(p) * weaponDmgMult(p);
        g.projectiles.push({x:p.x, y:p.y, vx:Math.cos(ang)*BOW_ARROW_SPEED*projectileSpeedMult(p), vy:Math.sin(ang)*BOW_ARROW_SPEED*projectileSpeedMult(p),
          r:6, dmg:psDmg, from:'player', life:1.4, color:'#ffd27a', isArrow:true, crit:psCrit});
        p.atkAnimT = 0.22;
        showMsg('Precise Shot!', 0.6);
        const psRank = effectiveRank(p,'preciseShot')||0;
        const tsRank = effectiveRank(p,'steadyBreathing')||0;
        p.preciseShotCdMax = applyCdr(p, preciseShotCooldown(psRank, p.atkCdMax, tsRank));
        p.preciseShotCd = p.preciseShotCdMax;
      }
    }
  } else if(p.aiming){
    p.aiming = false;
  }

  // Vanish (Survivalist capstone, v63 fix, v79 renamed/retuned): fade from
  // sight for a few seconds. Bug fixed in v63: this used to freeze EVERY
  // enemy in place for its duration. Now it only makes the player an
  // invalid target (see pickEnemyTarget's playerVanished check) and still
  // can't be damaged as a backstop (see playerDamage's vanishT check) --
  // enemies keep fighting normally, just against whatever they can still
  // validly target (a taunting/attacking/closest follower, per the new
  // targeting priority). v79 PRESERVES all of that untouched -- only the
  // numbers changed (VANISH_BASE_DUR/RANK_STEP/CD above) plus one new
  // behavior: dealing damage now ends Vanish immediately (see
  // applyEnemyArmor's own vanishT-clear comment) rather than only ever
  // expiring on its own timer.
  if(p.mirageCd>0) p.mirageCd -= dt;
  if(g.mirage){ g.mirage.t -= dt; if(g.mirage.t<=0) g.mirage = null; }
  if(p.vanishCd>0) p.vanishCd -= dt;
  if(p.vanishT>0){ p.vanishT -= dt; if(p.vanishT<0) p.vanishT = 0; }
  if(p.vanishWas && !(p.vanishT>0)){ p.vanishEvaT = VANISH_EVA_DUR; showMsg('Evasive!', 0.6, '#b8a8ff'); }
  p.vanishWas = p.vanishT>0;
  if(p.vanishEvaT>0) p.vanishEvaT -= dt;
  if(wantVanish){
    wantVanish=false;
    const vRank = effectiveRank(p,'vanish')||0;
    if(vRank>0 && p.vanishCd<=0){
      p.vanishT = VANISH_BASE_DUR + VANISH_RANK_STEP*(vRank-1);
      p.vanishCd = applyCdr(p, p.vanishCdMax);
      p.poisonTrapCd = 0; p.frostTrapCd = 0; p.explosiveTrapCd = 0;
      showMsg('Vanish!', 0.8);
      g.particles.push({type:'burst', x:p.x, y:p.y, t:0.4, max:0.4, color:'#8a7ad0'});
    }
  }

  // Poison Trap / Frost Trap (Survivalist, v79): throw a trap toward the
  // nearest enemy (or straight ahead if none in range); it lands there and
  // detonates after a fixed SURV_TRAP_FUSE (0.5s) -- tracked in
  // g.thrownTraps, a small pending-detonation queue distinct from Hunter's
  // own g.traps (planted-at-your-feet, walk-into-it) mechanic above.
  if(!g.thrownTraps) g.thrownTraps = [];
  if(wantPoisonTrap){
    wantPoisonTrap=false;
    const ptRank = effectiveRank(p,'poisonTrap')||0;
    if(ptRank>0 && p.poisonTrapCd<=0 && p.trapGcd>0){ wantPoisonTrap = true; }   // another trap just landed: queue this press for the next frame
    if(ptRank>0 && p.poisonTrapCd<=0 && !(p.trapGcd>0)){ p.trapGcd = trapGcdFor(p);
      const target = nearestEnemyOnScreen(g, p, BOW_RANGE+(p.weaponReachBonus||0));
      const _tp = snapTrapPos(g, p, target ? target.x : p.x+p.facing.x*140, target ? target.y : p.y+p.facing.y*140), tx = _tp.x, ty = _tp.y;   // v239: never plant a trap inside a wall
      p.poisonTrapCdMax = applyCdr(p, poisonTrapCooldown(ptRank)*trapCdMult(p));
      p.poisonTrapCd = p.poisonTrapCdMax;
      placeSurvTrap(g, {kind:'poison', x:tx, y:ty, r:SURV_TRAP_RADIUS*aoeRadiusMult(p)*trapRadiusMult(p), fuse:SURV_TRAP_FUSE, rank:ptRank, armed:false, life:SURV_TRAP_LIFE});
      showMsg('Poison Trap!', 0.6);
      g.particles.push({type:'burst', x:tx, y:ty, t:0.2, max:0.2, color:'#7dd45a'});
    }
  }
  if(wantFrostTrap){
    wantFrostTrap=false;
    const ftRank = effectiveRank(p,'frostTrap')||0;
    if(ftRank>0 && p.frostTrapCd<=0 && p.trapGcd>0){ wantFrostTrap = true; }   // another trap just landed: queue this press for the next frame
    if(ftRank>0 && p.frostTrapCd<=0 && !(p.trapGcd>0)){ p.trapGcd = trapGcdFor(p);
      const target = nearestEnemyOnScreen(g, p, BOW_RANGE+(p.weaponReachBonus||0));
      const _tp = snapTrapPos(g, p, target ? target.x : p.x+p.facing.x*140, target ? target.y : p.y+p.facing.y*140), tx = _tp.x, ty = _tp.y;   // v239: never plant a trap inside a wall
      p.frostTrapCdMax = applyCdr(p, FROST_TRAP_CD*trapCdMult(p));
      p.frostTrapCd = p.frostTrapCdMax;
      placeSurvTrap(g, {kind:'frost', x:tx, y:ty, r:SURV_TRAP_RADIUS*aoeRadiusMult(p)*trapRadiusMult(p), fuse:SURV_TRAP_FUSE, rank:ftRank, armed:false, life:SURV_TRAP_LIFE});
      showMsg('Frost Trap!', 0.6);
      g.particles.push({type:'burst', x:tx, y:ty, t:0.2, max:0.2, color:'#7ad0ff'});
    }
  }
  if(p.explosiveTrapCd>0) p.explosiveTrapCd -= dt;
  if(wantExplosiveTrap){
    wantExplosiveTrap=false;
    const etRank = effectiveRank(p,'explosiveTrap')||0;
    if(etRank>0 && p.explosiveTrapCd<=0 && p.trapGcd>0){ wantExplosiveTrap = true; }   // another trap just landed: queue this press for the next frame
    if(etRank>0 && p.explosiveTrapCd<=0 && !(p.trapGcd>0)){ p.trapGcd = trapGcdFor(p);
      const target = nearestEnemyOnScreen(g, p, BOW_RANGE+(p.weaponReachBonus||0));
      const _tp = snapTrapPos(g, p, target ? target.x : p.x+p.facing.x*140, target ? target.y : p.y+p.facing.y*140), tx = _tp.x, ty = _tp.y;   // v239: never plant a trap inside a wall
      p.explosiveTrapCdMax = applyCdr(p, 6*trapCdMult(p));
      p.explosiveTrapCd = p.explosiveTrapCdMax;
      placeSurvTrap(g, {kind:'explosive', x:tx, y:ty, r:SURV_TRAP_RADIUS*0.85*aoeRadiusMult(p)*trapRadiusMult(p), fuse:SURV_TRAP_FUSE, rank:etRank, armed:false, life:SURV_TRAP_LIFE});
      showMsg('Explosive Trap!', 0.6);
      g.particles.push({type:'burst', x:tx, y:ty, t:0.2, max:0.2, color:'#ff8a3a'});
    }
  }
  if(g.thrownTraps.length){
    for(let tti=g.thrownTraps.length-1; tti>=0; tti--){
      const tt = g.thrownTraps[tti];
      // (v124) Traps stay exactly where they land: they arm after the fuse, then sit on the ground
      // until an enemy walks close, then detonate (or fizzle out after SURV_TRAP_LIFE seconds).
      g.particles.push({type:'trapmark', x:tt.x, y:tt.y, t:0.06, max:0.06, color:tt.kind==='poison'?'#7dd45a':tt.kind==='explosive'?'#ff8a3a':'#7ad0ff', armed:tt.armed});
      if(!tt.armed){ tt.fuse -= dt; if(tt.fuse<=0) tt.armed = true; continue; }
      tt.life -= dt;
      if(tt.life<=0){ g.thrownTraps.splice(tti,1); continue; }
      let tripped = false;
      for(const e of g.enemies){ if(dist(tt,e) < tt.r*SURV_TRAP_TRIGGER + e.r){ tripped = true; break; } }
      if(tripped){
        if(tt.kind==='poison'){
          // Detonation: leaves a lingering DoT cloud (same {x,y,t,max,tick}
          // shape Plague's p.plagueZone already uses) rather than a single
          // instant tick -- "releasing a large poison cloud dealing damage
          // OVER TIME". Only one Survivalist poison cloud is tracked at a
          // time (a fresh throw simply replaces/refreshes it), matching
          // Plague's own single-zone-per-player convention.
          const dmg = wpnDmg(p) * swd('poisonTrap', tt.rank) * trapDmgMult(p);
          (p.survPoisonClouds || (p.survPoisonClouds = [])).push({x:tt.x, y:tt.y, t:0, max:skDur(p, POISON_TRAP_CLOUD_DUR), tick:0, dmg, r:tt.r});
          g.particles.push({type:'ring', x:tt.x, y:tt.y, t:0.5, max:0.5, r:tt.r, color:'#7dd45a'});
          g.particles.push({type:'gasBurst', x:tt.x, y:tt.y, t:0.7, max:0.7, r:tt.r, seed:Math.random()*6});
        } else if(tt.kind==='explosive'){
          const exDmg = wpnDmg(p) * swd('explosiveTrap', tt.rank) * trapDmgMult(p) * assaultDealtMult(p);
          for(const e of g.enemies){
            if(dist(tt,e) < tt.r+e.r){
              e.hp -= applyEnemyArmor(p, e, exDmg, 0, 'fire'); e.hitT = 0.15;
              e.burnT = Math.max(e.burnT||0, FIRE_DOT_DUR); e.burnDps = Math.max(e.burnDps||0, exDmg*BURN_DPS_PCT);
              checkExecute(g, e);
            }
          }
          g.particles.push({type:'ring', x:tt.x, y:tt.y, t:0.45, max:0.45, r:tt.r, color:'#ff8a3a'});
          g.particles.push({type:'burst', x:tt.x, y:tt.y, t:0.35, max:0.35, color:'#ffb060'});
          // v499: same little explosion circles as Explosive Shot, spread over the trap's radius
          for(let k=0;k<10;k++){ const an = k/10*6.283+Math.random()*0.4, rr = tt.r*(0.25+Math.random()*0.6); g.particles.push({type:'burst', x:tt.x+Math.cos(an)*rr, y:tt.y+Math.sin(an)*rr, t:0.3, max:0.3, color:k%2?'#ff7a2a':'#ffd070'}); }
          shakeScreen(g, 3, 0.15); try{ sfxPlay('fire', 0.8); }catch(err){}
        } else {
          // Frost Trap: a single instant AoE pulse -- freeze (e.frozenT,
          // the same generic full-immobilize field Blizzard uses) every
          // enemy in radius for a brief rank-scaled duration, then Chill
          // (e.chillT) afterward so they're slowed once the freeze lifts.
          const freezeDur = skDur(p, frostTrapFreezeDuration(tt.rank)), chillDur = skDur(p, frostTrapChillDuration(tt.rank));
          const frDmg = wpnDmg(p) * swd('frostTrap', tt.rank) * trapDmgMult(p);   // v237: the burst of cold also hurts
          for(const e of g.enemies){
            if(dist(tt,e) < tt.r+e.r){
              // v540: freeze (shorter on elites/brutes, none on bosses/heavy or a monster still immune from its last freeze), then a rank-scaled chill
              let fz = 0;
              if(!freezeImmune(e) && !(e.freezeImmT>0)){ fz = freezeDur*(isEliteOrBrute(e) ? FROST_TRAP_TOUGH : 1); e.frozenT = Math.max(e.frozenT||0, fz); e.freezeImmT = fz + FREEZE_IMMUNE; e.coldHits = 0; e.coldHitT = 0; }
              e.chillT = Math.max(e.chillT||0, fz + chillDur*((e.isBoss || e.isLairBoss) ? 0.5 : 1));
              e.hp -= applyEnemyArmor(p, e, frDmg, 0, 'cold'); e.hitT = 0.15;
              g.particles.push({type:'iceImpact', x:e.x, y:e.y, t:0.42, max:0.42, seed:Math.random()});
              checkExecute(g, e);
            }
          }
          g.particles.push({type:'iceImpact', x:tt.x, y:tt.y, t:0.5, max:0.5, seed:Math.random()});
          g.particles.push({type:'ring', x:tt.x, y:tt.y, t:0.35, max:0.35, r:tt.r, color:'#a9e4ff'});
        }
        g.thrownTraps.splice(tti,1);
      }
    }
  }
  if(p.survPoisonClouds && p.survPoisonClouds.length){
    for(let ci=p.survPoisonClouds.length-1; ci>=0; ci--){
      const pc = p.survPoisonClouds[ci];
      pc.t += dt;
      pc.tick -= dt;
      if(pc.tick<=0){
        pc.tick += POISON_TRAP_TICK_INTERVAL;
        for(const e of g.enemies){
          if(dist(pc,e) < (pc.r||SURV_TRAP_RADIUS)+e.r){
            const cm = cloudStayMult(g, e, POISON_TRAP_TICK_INTERVAL);
            addPoison(e, pc.dmg*cm, 'trap', POISON_TRAP_TICK_INTERVAL+0.15, true);
          }
        }
      }
      g.particles.push({type:'gasCloud', x:pc.x, y:pc.y, t:0.06, max:0.06, r:(pc.r||SURV_TRAP_RADIUS), f:Math.min(1, pc.t/0.5, (pc.max-pc.t)/0.9), seed:(ci*1.7)});
      if(pc.t >= pc.max) p.survPoisonClouds.splice(ci,1);
    }
  }

  // Rain of Arrows (Marksman's new v79 capstone): shoot an arrow to the
  // sky, then after a short delay it rains down as an AoE burst centered
  // on the nearest enemy's position (an "in an area" hit, not a
  // self-centered blast). Fixed 12s cooldown at every rank; only damage
  // scales with rank.
  if(wantRainOfArrows){
    wantRainOfArrows=false;
    const roaRank = effectiveRank(p,'rainOfArrows')||0;
    if(roaRank>0 && p.rainOfArrowsCd<=0){
      const target = nearestEnemy(g, p, BOW_RANGE+(p.weaponReachBonus||0)*2);
      const tx = target ? target.x : p.x+p.facing.x*160, ty = target ? target.y : p.y+p.facing.y*160;
      p.rainOfArrowsCdMax = applyCdr(p, RAIN_OF_ARROWS_CD);
      p.rainOfArrowsCd = p.rainOfArrowsCdMax;
      p.rainOfArrowsPending = {x:tx, y:ty, fuse:RAIN_OF_ARROWS_DELAY, el:0, vi:0, rank:roaRank, r:RAIN_OF_ARROWS_RADIUS*aoeRadiusMult(p), skyT:ROA_SKY_DELAY};
      // v454: the ranger looses one arrow straight up; the rain begins ROA_SKY_DELAY later
      p.atkAnimT = 0.3; p.atkAnimMax = 0.3; p.skyShotT = 0.3;
      g.particles.push({type:'skyArrow', x:p.x, y:p.y, t:0.45, max:0.45});
      showMsg('Rain of Arrows!', 0.6);
    }
  }
  if(p.skyShotT>0) p.skyShotT -= dt;
  if(p.rainOfArrowsPending && p.rainOfArrowsPending.skyT>0){
    const rp = p.rainOfArrowsPending;
    rp.skyT -= dt;
    if(rp.skyT<=0){
      rp.skyT = 0;
      const arrows = []; for(let i=0;i<34;i++){ const a0 = Math.random()*Math.PI*2, rr = Math.sqrt(Math.random())*0.95; arrows.push({ox:Math.cos(a0)*rr, oy:Math.sin(a0)*rr, tl:0.12+Math.random()*(RAIN_OF_ARROWS_DELAY-0.2), sl:(Math.random()-0.5)*0.5}); }
      g.particles.push({type:'roaFx', x:rp.x, y:rp.y, r:rp.r, t:RAIN_OF_ARROWS_DELAY+0.6, max:RAIN_OF_ARROWS_DELAY+0.6, arrows});
    }
  } else if(p.rainOfArrowsPending){
    const rp = p.rainOfArrowsPending;
    rp.fuse -= dt; rp.el += dt;
    while(rp.vi < RAIN_OF_ARROWS_VOLLEYS.length && rp.el >= RAIN_OF_ARROWS_VOLLEYS[rp.vi]){
      rp.vi++;
      const dmg = wpnDmg(p) * swd('rainOfArrows', rp.rank) * assaultDealtMult(p) * weaponDmgMult(p);
      for(const e of g.enemies){
        if(e.hp>0 && dist(rp,e) < rp.r+e.r){
          e.hp -= applyEnemyArmor(p, e, dmg); e.hitT = 0.12;
          checkExecute(g, e);
        }
      }
      g.particles.push({type:'ring', x:rp.x, y:rp.y, t:0.3, max:0.3, r:rp.r*0.9, color:'#e8c44a'});
    }
    if(rp.fuse<=0) p.rainOfArrowsPending = null;
  }

  // leap (Berserker, v187): spring at the nearest enemy (or forward), invulnerable in the air, crush + stun on landing
  if(wantLeap){
    wantLeap=false;
    const lRank = effectiveRank(p,'leap')||0;
    if(lRank>0 && p.leapCd<=0 && p.leapT<=0){
      const tg = nearestEnemyOnScreen(g, p, LEAP_RANGE);   // v205: on-screen targets only
      let ang, dd;
      if(tg){ ang = Math.atan2(tg.y-p.y, tg.x-p.x); dd = Math.max(40, Math.hypot(tg.x-p.x, tg.y-p.y) - (tg.r+p.r+6)); }
      else { ang = Math.atan2(p.facing.y, p.facing.x); dd = LEAP_BLIND; }
      p.leapDir = {x:Math.cos(ang), y:Math.sin(ang)}; p.leapDistLeft = dd; p.leapSpd = dd/LEAP_TIME;
      p.leapT = LEAP_TIME; p.leapRank = lRank; p.leapTarget = tg || null;   // v489: the charge follows its target (it used to fly to where the enemy stood and often whiffed)
      p.facing = {x:p.leapDir.x, y:p.leapDir.y}; p.faceSign = screenFacingSign(p.facing.x,p.facing.y);
      p.invuln = Math.max(p.invuln||0, LEAP_TIME+0.05);
      p.leapCdMax = leapCdForRank(lRank); p.leapCd = applyCdr(p, p.leapCdMax);
      showMsg('Charge!', 0.5);
      if(p.cls==='warrior') gainResource(p, (p.maxMp||100)*LEAP_RAGE_GAIN_PCT);
    }
  }
  if(p.leapT>0){
    p.leapT -= dt; p.movementStopT = Math.max(p.movementStopT||0, 0.06);
    const lt = p.leapTarget;
    if(lt && lt.hp>0 && p.leapT>0){   // steer at the target's current spot, arriving just in front of it
      const dx = lt.x-p.x, dy = lt.y-p.y, dd = Math.hypot(dx,dy) - (lt.r+p.r+6);
      if(dd > 0){ p.leapDir = {x:dx/(dd+lt.r+p.r+6), y:dy/(dd+lt.r+p.r+6)}; p.leapDistLeft = dd; p.leapSpd = Math.max(p.leapSpd, dd/Math.max(0.05, p.leapT)); }
      else p.leapDistLeft = 0;
    }
    const mvd = Math.min(p.leapDistLeft, p.leapSpd*dt), steps = Math.max(1, Math.ceil(mvd/4)), sd = mvd/steps;
    for(let i=0;i<steps;i++){
      p.x += p.leapDir.x*sd; p.y += p.leapDir.y*sd;
      p.x = clamp(p.x, p.r, room.w-p.r); p.y = clamp(p.y, p.r, room.h-p.r);
      pushOutOfObstacles(p, room.obstacles);
    }
    p.leapDistLeft -= mvd; p.moving = true;
    g.particles.push({type:'burst', x:p.x, y:p.y, t:0.25, max:0.25, color:'#e8c890'});
    if(p.leapT<=0){
      p.leapT = 0;
      const lr = p.leapRank||1, rad = LEAP_RADIUS*aoeRadiusMult(p);
      const ld = wpnDmg(p) * swd('leap', lr) * assaultDealtMult(p) * weaponDmgMult(p);
      const lt2 = p.leapTarget; p.leapTarget = null;
      for(const e of g.enemies){
        if(e.hp>0 && (dist(p,e) < rad+e.r || (e===lt2 && dist(p,e) < rad+e.r+40))){   // the charged target is always hit if the charge reached it
          e.hp -= applyEnemyArmor(p, e, ld); e.hitT = 0.2; checkExecute(g, e);
          if(!e.isBoss && !e.isLairBoss && !e.gj && !e.trex) e.stunT = Math.max(e.stunT||0, LEAP_STUN_BASE + LEAP_STUN_STEP*(lr-1));
        }
      }
      g.particles.push({type:'ring', x:p.x, y:p.y, t:0.4, max:0.4, r:rad, color:'#e2b46a'});
      g.particles.push({type:'burst', x:p.x, y:p.y, t:0.4, max:0.4, color:'#e8c890'});
      shakeScreen(g, 5, 0.25);
    }
  }
  // unbreakable (Berserker, v187): a brief damage-reduction roar
  if(wantUnbreak){
    wantUnbreak=false;
    const uRank = effectiveRank(p,'unbreakable')||0;
    if(uRank>0 && p.unbreakCd<=0){
      p.unbreakRank = uRank; p.unbreakT = unbreakDur(uRank);
      p.unbreakCdMax = UNBREAK_CD; p.unbreakCd = applyCdr(p, UNBREAK_CD);
      showMsg('Unbreakable!', 0.8);
      g.particles.push({type:'ring', x:p.x, y:p.y, t:0.5, max:0.5, r:110, color:'#e8c05a'});
      g.particles.push({type:'burst', x:p.x, y:p.y, t:0.5, max:0.5, color:'#f4d27a'});
    }
  }
  // whirlwind (Berserker skill): tap to spin in place, striking everything
  // nearby on a fast repeating tick. Ranks only extend the spin duration.
  if(wantWhirlwind){
    wantWhirlwind=false;
    const wRank = effectiveRank(p,'whirlwind')||0;
    if(wRank>0 && p.whirlwindT>0){ p.whirlwindT = 0; }
    else if(wRank>0 && p.whirlwindCd<=0 && p.whirlwindT<=0){
      p.movementStopT = 0.1;
      p.whirlwindT = 999;   // v195: no duration -- it spins until Rage runs out (or you tap it again)
      p.whirlwindTick = 0; p.whirlwindElapsed = 0;
      p.whirlwindCd = applyCdr(p, p.whirlwindCdMax);
      showMsg('Whirlwind!', 0.6);
    }
  }
  if(p.whirlwindT>0){
    p.whirlwindT -= dt; p.whirlwindElapsed = (p.whirlwindElapsed||0) + dt;
    p.whirlwindTick -= dt; p.whirlAng = (p.whirlAng||0) + dt*24*whirlSpeed(p);
    // v193: 10 Rage to start (see RESOURCE_SKILLS), then a steady drain; the spin ends when the Rage runs out
    if(p.cls==='warrior'){ p.mp = Math.max(0, (p.mp||0) - whirlDrain(p)*dt); if(p.mp<=0){ p.whirlwindT = 0; showMsg('Out of Rage', 0.8); } }
    if(p.whirlwindTick<=0){
      p.whirlwindTick += WHIRLWIND_TICK_INTERVAL / whirlSpeed(p);
      const reach = (WHIRLWIND_REACH + (p.weaponReachBonus||0)) * aoeRadiusMult(p);   // v204: base AoE -15%
      const tickDmg = wpnDmg(p) * swd('whirlwind', effectiveRank(p,'whirlwind')) * assaultDealtMult(p) * weaponDmgMult(p);   // v372: x2 (Rank 1) to x3.5 (Rank 10)
      for(const e of g.enemies){
        if(dist(p,e) < reach+e.r){
          e.hp -= applyEnemyArmor(p, e, tickDmg); e.hitT = 0.15;
          checkExecute(g, e);
          const eang = Math.atan2(e.y-p.y, e.x-p.x), kb=6;
          e.x += Math.cos(eang)*kb; e.y += Math.sin(eang)*kb;
        }
      }
      g.particles.push({type:'ring', x:p.x, y:p.y, t:0.3, max:0.3, r:reach, color:'#e2703a'});
    }
    if(p.whirlwindT<0) p.whirlwindT = 0;
  }

  // assault (Berserker skill): glowing rage -- damage dealt AND taken both
  // climb over the duration, and damage you take is reflected onto the attacker.
  if(wantAssault){
    wantAssault=false;
    const aRank = effectiveRank(p,'assault')||0;
    if(aRank>0 && p.assaultCd<=0 && p.assaultT<=0){
      p.movementStopT = 0.1;
      p.assaultDurMax = ASSAULT_BASE_DUR + ASSAULT_RANK_STEP*(aRank-1);
      p.assaultT = p.assaultDurMax;
      p.assaultCd = applyCdr(p, p.assaultCdMax);
      gainResource(p, p.maxMp);   // v216: Rage is filled on use
      showMsg('Assault! Rage full', 1.0);
      g.particles.push({type:'burst', x:p.x, y:p.y, t:0.5, max:0.5, color:'#e2382f'}); g.particles.push({type:'rageCast', x:p.x, y:p.y, t:0.7, max:0.7});
    }
  }

  // stance cycling (Knight skill: Commander) -- switches all followers between
  // Attack and Guard. A short cooldown stops spam-toggling.
  if(p.stanceCd>0) p.stanceCd -= dt;
  if(wantStance){
    wantStance=false;
    if((effectiveRank(p,'squire')||0)>0 && p.stanceCd<=0){
      const curIdx = STANCES.indexOf(g.followerStance);
      g.followerStance = STANCES[(curIdx+1)%STANCES.length];
      const stanceLabel = {attack:'Attack', guard:'Guard'}[g.followerStance];
      for(const f of g.followers){ f.stance = g.followerStance; }
      p.stanceCd = 0.5;
      showMsg('Stance: '+stanceLabel, 0.8);
      updateStanceButtonLabel();
    }
  }

  // War Cry (Berserker, v266; id kept as 'battlecry'): stuns nearby foes briefly, leaves them taking more
  // damage from everything, and gives you Rage.
  if(p.battlecryCd>0) p.battlecryCd -= dt;
  if(wantBattlecry){
    wantBattlecry=false;
    const bRank = effectiveRank(p,'battlecry')||0;
    if(bRank>0 && p.battlecryCd<=0){
      p.battlecryCd = applyCdr(p, p.battlecryCdMax);
      const fearDur = WARCRY_FEAR + WARCRY_FEAR_STEP*(bRank-1);   // v454: foes flee in terror instead of being stunned
      const vuln = WARCRY_VULN + WARCRY_VULN_STEP*(bRank-1);
      const dur = WARCRY_DUR + WARCRY_DUR_STEP*(bRank-1);
      const R = WARCRY_RADIUS*aoeRadiusMult(p);
      for(const e of g.enemies){
        if(e.hp>0 && dist(p,e) < R+e.r){
          if(!isHeavyEnemy(e)){ e.fearT = Math.max(e.fearT||0, fearDur); e.engaged = false; e.windT = 0; }
          e.warCryT = dur; e.warCryPct = vuln;
        }
      }
      gainResource(p, WARCRY_RAGE);
      showMsg('War Cry!', 0.8);
      g.particles.push({type:'ring', x:p.x, y:p.y, t:0.4, max:0.4, r:R, color:'#ff8a4a'});
      g.particles.push({type:'burst', x:p.x, y:p.y, t:0.4, max:0.4, color:'#ff8a4a'});
    }
  }

  // Rally / "Rallying Cry" (Templar capstone): war cry that snaps followers
  // back to the player, resurrects any that have fallen, stuns nearby
  // enemies with a shield-slam, heals followers, and grants EVERYONE --
  // player included -- a flat crit chance boost AND a temporary Defense
  // buff for a short window. Stun/heal/duration/defense scale with rank.
  if(p.rallyCd>0) p.rallyCd -= dt;
  if(p.rallyT>0){ p.rallyT -= dt; if(p.rallyT<0) p.rallyT=0; }
  if(p.battlecryT>0){ p.battlecryT -= dt; if(p.battlecryT<=0){ p.battlecryT = 0; recalcStats(p); } }
  if(wantRally){
    wantRally=false;
    const rRank = effectiveRank(p,'rally')||0;
    if(rRank>0 && p.rallyCd<=0){
      p.rallyCd = applyCdr(p, p.rallyCdMax);
      const stunDur = RALLY_STUN_BASE + RALLY_STUN_RANK_STEP*(rRank-1);
      const healPct = RALLY_HEAL_PCT_BASE + RALLY_HEAL_PCT_RANK_STEP*(rRank-1);
      p.rallyDurMax = RALLY_BUFF_BASE_DUR + RALLY_BUFF_RANK_STEP*(rRank-1);
      p.rallyT = p.rallyDurMax;
      // resurrect any fallen followers immediately, rather than waiting on
      // their normal respawn timer
      const squireRank = effectiveRank(p,'squire')||0;
      const wantedFollowers = squireFollowerCount(squireRank);
      while(g.followers.length < wantedFollowers){
        const nf = makeFollower(p, g.followers.length);
        nf.x = p.x; nf.y = p.y;
        g.followers.push(nf);
      }
      g.followerRespawnCd = 0;
      for(const f of g.followers){
        f.x = p.x; f.y = p.y;
        f.hp = Math.min(f.maxHp, f.hp + f.maxHp*healPct);
      }
      showMsg('Rally!', 1.0);
      g.particles.push({type:'ring', x:p.x, y:p.y, t:0.4, max:0.4, r:RALLY_RANGE, color:'#e8c44a'});
      g.particles.push({type:'burst', x:p.x, y:p.y, t:0.5, max:0.5, color:'#e8c44a'});
    }
  }

  // ===== v266 warrior casts =====
  // Smite / Wrath (Templar): a piercing holy bolt. Rides the basic-attack cooldown, so it can be the Main skill.
  if(wantSmite){
    wantSmite=false;
    const smRank = effectiveRank(p,'smite')||0;
    if(smRank>0 && p.atkCd<=0){ p.atkCd = p.atkCdMax; castSmite(g, p, smRank); }
  }
  // Vengeance (Templar): melee cone of holy fire (half fire, half physical) that empowers followers.
  if(wantVengeance){
    wantVengeance=false;
    const vRank = effectiveRank(p,'vengeance')||0;
    if(vRank>0 && !p.dodging && p.atkCd<=0){
      p.movementStopT = 0.1;
      p.atkCd = p.atkCdMax;   // (v288) same speed as Strike, no cooldown of its own
      const target = nearestEnemy(g, p, VENG_REACH+10+(p.weaponReachBonus||0));
      const ang = target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y,p.facing.x);
      p.facing = {x:Math.cos(ang), y:Math.sin(ang)}; p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
      p.atkAnimT = 0.22; p.atkAnimMax = 0.22; p.vengAnimT = 0.3; p.vengAnimMax = 0.3;
      const reach = (VENG_REACH + (p.weaponReachBonus||0)) * aoeRadiusMult(p);
      let dmg = wpnDmg(p) * swd('vengeance', vRank) * assaultDealtMult(p) * weaponDmgMult(p);
      if(p.maxMp>0 && (p.mp||0) > p.maxMp*VENG_OVERFLOW_AT){ p.mp = Math.max(0, p.mp - VENG_OVERFLOW_COST); dmg *= 1 + VENG_OVERFLOW_DMG; }   // v325: above 80% full, Vengeance burns 5 Rage for +5% damage
      let hits = 0;
      const swR = (p.skills && effectiveRank(p,'sacredWeapon'))||0;   // v455 Sacred Weapon
      let sacred = false;
      if(swR>0){ p.vengCount = Math.min(SACRED_EVERY+1, (p.vengCount||0) + 1); if(p.vengCount > SACRED_EVERY && (p.mp||0) >= SACRED_COST){ p.vengCount = 0; p.mp -= SACRED_COST; sacred = true; dmg *= 1 + sacredBonus(swR); } }   // v489: the empowered 4th swing burns 10 Conviction (it waits for it)
      for(const e of g.enemies){
        if(e.hp<=0) continue;
        const d = dist(p,e);
        if(d < reach+e.r){
          const eang = Math.atan2(e.y-p.y, e.x-p.x);
          let diff = Math.abs(eang-ang); if(diff>Math.PI) diff = 2*Math.PI-diff;
          if(diff < VENG_ARC){
            e.hp -= splitHit(p, e, dmg, 0.5, 'fire'); e.hitT = 0.15;
            if(sacred){ e.burnT = Math.max(e.burnT||0, SACRED_BURN_DUR); e.burnDps = Math.max(e.burnDps||0, dmg*SACRED_BURN_PCT); g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#fff0a0'}); }
            checkExecute(g, e);
            hits++;
            g.particles.push({type:'burst', x:e.x, y:e.y, t:0.25, max:0.25, color:'#ff9a3a'});
          }
        }
      }
      if(hits>0) gainResource(p, Math.min(hits,3)*VENG_CONV);
      if(g.followers) for(const f of g.followers){ f.vengeT = VENG_BUFF_DUR; f.vengeRank = vRank; }
      g.particles.push({type:'wave', x:p.x, y:p.y, ang, arc:VENG_ARC, reach, t:0.3, max:0.3, c1:'255,110,40', c2:'255,230,150'});
      if(sacred){ g.particles.push({type:'wave', x:p.x, y:p.y, ang, arc:VENG_ARC*1.1, reach:reach*1.12, t:0.42, max:0.42, c1:'255,200,80', c2:'255,255,220'}); shakeScreen(g, 3, 0.12); }
    }
  }
  // v454 Reave (Berserker): a basic attack -- one weapon hit like Strike that leaves the target bleeding. Rides the swing timer.
  if(wantReave){
    wantReave=false;
    const rvRank = effectiveRank(p,'reave')||0;
    if(rvRank>0 && !p.dodging && p.atkCd<=0){
      p.atkCd = p.atkCdMax; p.movementStopT = 0.1;
      const twoH = !!(p.equipment.mainhand && p.equipment.mainhand.twoHanded);
      const reach = 67 + (twoH ? TWOHAND_REACH_BONUS : 0) + (p.weaponReachBonus||0);
      const target = nearestEnemy(g, p, 76 + (twoH ? TWOHAND_REACH_BONUS*0.9 : 0) + (p.weaponReachBonus||0));
      let ang;
      if(target) ang = Math.atan2(target.y-p.y, target.x-p.x);
      else { ang = Math.atan2(p.facing.y,p.facing.x); const pcc = (PC.lmb||PC.strikeKey) ? pcCursorWorld() : null; if(pcc && (Math.abs(pcc.x-p.x)>3 || Math.abs(pcc.y-p.y)>3)) ang = Math.atan2(pcc.y-p.y, pcc.x-p.x); }
      p.facing = {x:Math.cos(ang), y:Math.sin(ang)}; p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
      p.atkAnimT = 0.22; p.atkAnimMax = 0.22;
      const isCrit = Math.random()*100 < (p.critChance||0) + (p.rallyT>0 ? RALLY_CRIT_BONUS : 0);
      const dmg = wpnDmg(p) * swd('reave', rvRank) * (isCrit ? critMultOf(p) : 1) * assaultDealtMult(p) * weaponDmgMult(p);
      lastHitCrit = isCrit;
      for(const e of g.enemies){
        if(e.hp<=0 || dist(p,e) >= reach+e.r) continue;
        const eang = Math.atan2(e.y-p.y, e.x-p.x);
        let diff = Math.abs(eang-ang); if(diff>Math.PI) diff = 2*Math.PI-diff;
        if(diff < 0.95){
          e.hp -= applyEnemyArmor(p, e, dmg); e.hitT = 0.15;
          staggerEnemy(e, STAGGER_DUR);
          if(isCrit) hitStop(g, 0.04);
          checkExecute(g, e);
          addBleed(e, dmg*reaveBleedPct(rvRank)*partBleedMult(), 'reave', REAVE_BLEED_DUR);
          g.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:'#c0262b'});
          const kb=8; e.x += Math.cos(eang)*kb; e.y += Math.sin(eang)*kb;
        }
      }
      lastHitCrit = false;
      const slashDist = 32+(p.weaponReachBonus||0)*0.3;
      g.particles.push({type:'slash', x:p.x+Math.cos(ang)*slashDist, y:p.y+Math.sin(ang)*slashDist, ang, t:0.18, max:0.18, crit:isCrit});
    }
  }
  // Banner (Templar): plant a standard; alternates War <-> Aegis. Only one stands at a time.
  if(wantBanner){
    wantBanner=false;
    const bnRank = effectiveRank(p,'banner')||0;
    if(bnRank>0 && !(p.bannerCd>0)) placeBanner(g, p, bnRank);
  }
  // Consecrate (Templar): holy ground.
  if(wantConsecrate){
    wantConsecrate=false;
    const csRank = effectiveRank(p,'consecrate')||0;
    if(csRank>0 && !(p.consecrateCd>0)) castConsecrate(g, p, csRank);
  }
  // Judgment (Templar capstone): spends Conviction, holy pillars from the sky.
  if(wantJudgment){
    wantJudgment=false;
    const jdRank = effectiveRank(p,'judgment')||0;
    if(jdRank>0 && !(p.judgmentCd>0)) castJudgment(g, p, jdRank);
  }
  // Bulwark (Defender): hold the line. Tap again to release early.
  if(wantBulwark){
    wantBulwark=false;
    const buRank = effectiveRank(p,'bulwark')||0;
    if(buRank>0){
      if(p.bulwarkT>0){ bulwarkRelease(g, p); }
      else if(!(p.bulwarkCd>0)){
        p.bulwarkT = BULWARK_DUR + BULWARK_DUR_STEP*(buRank-1); p.bulwarkStore = 0;
        p.bulwarkCdMax = applyCdr(p, BULWARK_CD); p.bulwarkCd = p.bulwarkCdMax;
        p.unbreakRank = 1; p.unbreakT = p.bulwarkT;
        spendResource(p,'bulwark');
        showMsg('Bulwark!', 0.8);
        g.particles.push({type:'ring', x:p.x, y:p.y, t:0.5, max:0.5, r:110, color:'#c3c8d2'});
      }
    }
  }
  if(wantSeismic){ wantSeismic=false; const rk = effectiveRank(p,'seismicSlam')||0; if(rk>0 && !(p.seismicCd>0) && resourceAffordable(p,'seismicSlam')){ castSeismicSlam(g, p, rk); spendResource(p,'seismicSlam'); } }
  if(wantMirror){ wantMirror=false; const mk = effectiveRank(p,'mirrorSteel')||0;   // v492 Mirror of Steel
    if(mk>0 && !hasShieldEquipped(p)){ showMsg('Mirror of Steel needs a shield', 0.9); }
    else if(mk>0 && !(p.mirrorCd>0) && !(p.mirrorT>0) && resourceAffordable(p,'mirrorSteel')){
      p.mirrorT = mirrorDur(mk); p.mirrorCdMax = applyCdr(p, mirrorCd(mk)); p.mirrorCd = p.mirrorCdMax;
      spendResource(p,'mirrorSteel'); showMsg('Mirror of Steel!', 0.8);
      g.particles.push({type:'ring', x:p.x, y:p.y, t:0.5, max:0.5, r:70, color:'#dfe9f5'});
    } }
  if(wantAnchor){ wantAnchor=false; const ak = effectiveRank(p,'seismicAnchor')||0;   // v492 Seismic Anchor
    if(ak>0 && !hasShieldEquipped(p)){ showMsg('Seismic Anchor needs a shield', 0.9); }
    else if(ak>0 && !(p.anchorCd>0) && !(p.anchorPendT>0) && resourceAffordable(p,'seismicAnchor')){ castSeismicAnchor(g, p, ak); spendResource(p,'seismicAnchor'); } }
  // Bloodrage (Berserker): pay life for Rage and damage.
  if(wantBloodrage){
    wantBloodrage=false;
    const brRank = effectiveRank(p,'bloodrage')||0;
    if(brRank>0 && !(p.bloodrageCd>0)){
      if(p.hp > p.maxHp*BLOODRAGE_MIN_HP){
        p.hp -= p.hp*BLOODRAGE_COST_PCT;
        p.bloodrageCdMax = applyCdr(p, BLOODRAGE_CD); p.bloodrageCd = p.bloodrageCdMax;
        p.bloodrageT = BLOODRAGE_DUR + BLOODRAGE_DUR_STEP*(brRank-1);
        gainResource(p, BLOODRAGE_RAGE);
        showMsg('Bloodrage!', 0.8);
        g.particles.push({type:'burst', x:p.x, y:p.y, t:0.5, max:0.5, color:'#c0281c'}); g.particles.push({type:'rageCast', x:p.x, y:p.y, t:0.7, max:0.7});
      } else { showMsg('Too wounded', 0.8); }
    }
  }

  // Nova (Djinn, v75): instant AoE ring around the player -- deals a flat
  // (non-rank-scaling, see NOVA_CD's comment) direct hit to every enemy in
  // range and applies Shock (e.shockT/e.shockDps), whose duration is the
  // one thing rank actually scales. Own button/cooldown, same "instant
  // burst self-AoE" shape as Battlecry.
  if(p.aoeGcd>0) p.aoeGcd -= dt;
  if(p.novaCd>0) p.novaCd -= dt;
  // v466 Stormcall
  if(p.stormcallCd>0) p.stormcallCd -= dt;
  if(wantStormcall){
    wantStormcall = false;
    const scR = effectiveRank(p,'stormcall')||0;
    if(scR>0 && !(p.stormcallCd>0)){ p.stormcallCdMax = applyCdr(p, STORMCALL_CD); p.stormcallCd = p.stormcallCdMax; castStormcall(g, p, scR); }
  }
  updateStormcalls(g, p, dt);
  if(wantNova){
    wantNova=false;
    const nRank = effectiveRank(p,'nova')||0;
    if(nRank>0 && p.novaCd<=0 && !(p.aoeGcd>0)){
      p.movementStopT = 0.2;
      p.novaCd = applyCdr(p, p.novaCdMax); p.aoeGcd = AOE_GCD;
      const nSt = staticConsume(p), nWm = windConsume(p, 'nova');
      const novaBase = wpnDmg(p), novaDmg = novaBase*swd('nova', nRank)*nSt.mult*nWm;   // v313: hits add a Charge (no old Shock); ranks add damage
      const novaR = NOVA_RADIUS*aoeRadiusMult(p)*nSt.rad;
      for(const e of g.enemies){
        if(dist(p,e) < novaR+e.r){
          e.hp -= applyEnemyArmor(p, e, novaDmg, 0, "lightning"); e.hitT = 0.15;
          if(nSt.charge) lightningCharge(g, e, 0, 'enemy');
          if(!isHeavyEnemy(e)) pushEnemy(g, e, Math.atan2(e.y-p.y, e.x-p.x), NOVA_PUSH);   // v454: no stun -- the lightning hit adds a Charge
          checkExecute(g, e);
        }
      }
      showMsg('Nova!', 0.7);
      g.particles.push({type:'novaRing', x:p.x, y:p.y, t:0.42, max:0.42, r:novaR, seed:Math.random()*100});
    }
  }

  // Tornado (Djinn, v75; reworked v103): a slow-moving, piercing, circular
  // swirl projectile fired at the nearest enemy -- ranks scale its
  // per-tick damage via the standard skillMult curve. Unlike a normal
  // bolt it never dies on contact (see the pr.isTornado pierce branch in
  // the projectile-update loop below) and deals tickDmg repeatedly, on
  // TORNADO_TICK_INTERVAL, to every enemy currently overlapping it as it
  // travels -- not isArrow anymore, since it's drawn as its own circular
  // swirl (see drawProjectilesIso's isTornado branch), not an arrow.
  if(p.tornadoCd>0) p.tornadoCd -= dt;
  if(wantTornado){
    wantTornado=false;
    const tRank = effectiveRank(p,'tornado')||0;
    if(tRank>0 && p.tornadoCd<=0){
      p.movementStopT = 0.2;
      const target = nearestEnemy(g, p, STAFF_RANGE+(p.weaponReachBonus||0));
      const ang = target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y, p.facing.x);
      p.facing = {x:Math.cos(ang), y:Math.sin(ang)};
      p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
      p.atkAnimT = 0.2;
      p.tornadoCdMax = tornadoCdForRank(tRank);
      p.tornadoCd = applyCdr(p, p.tornadoCdMax);
      const tSt = staticConsume(p);
      const tDmg = wpnDmg(p) * swd('tornado', tRank) * assaultDealtMult(p) * weaponDmgMult(p) * tSt.mult;
      g.projectiles.push({x:p.x, y:p.y, vx:Math.cos(ang)*TORNADO_SPEED, vy:Math.sin(ang)*TORNADO_SPEED,
        r:TORNADO_R*tSt.rad, hitR:TORNADO_R*0.85*tSt.rad, dmg:tDmg, from:'player', life:skDur(p, TORNADO_LIFE), color:tSt.on ? '#e8f8ff' : '#c8e0e8', isTornado:true, tickT:0, staticCharge:tSt.charge});   // v316: hit radius shrunk 15% to match the v311 visual
      showMsg('Tornado!', 0.6);
    }
  }

  // Storm (Djinn, v75): a zone that follows the player (it's just a radius
  // check off the player's own live position each frame, so it always
  // "follows" without needing its own x/y state) for a duration that
  // scales with rank; its only mechanical effect is +Crit Chance against
  // whatever's inside it (see stormCritBonus, read from the shared crit
  // roll in the attack code above). Fixed 2-minute cooldown at every rank.
  // (v152) Storm is now a passive (crit chance/multiplier in recalcStats); its little cloud is drawn above the player.

  // Hurricane (Djinn capstone, v75): persistent tick-damage + slow AoE
  // around the player for its (rank-scaled) duration -- same "duration +
  // repeating tick" shape Whirlwind already uses. Slow reuses e.chillT
  // verbatim (see its own top comment for why).
  if(p.hurricaneCd>0) p.hurricaneCd -= dt;
  if(wantHurricane){
    wantHurricane=false;
    const hRank = effectiveRank(p,'hurricane')||0;
    if(hRank>0 && p.hurricaneCd<=0 && !(p.aoeGcd>0)){   // v489: may be recast while still raging -- it restarts its duration
      p.aoeGcd = AOE_GCD;
      p.movementStopT = 0.2;
      p.hurricaneDurMax = skDur(p, hurricaneDuration(hRank));
      p.hurricaneT = p.hurricaneDurMax;
      p.hurricaneTick = 0;
      p.hurricaneCdMax = hurricaneCooldown(hRank);
      p.hurricaneCd = applyCdr(p, p.hurricaneCdMax);
      recalcStats(p);   // v489: Hurricane's defence bonus
      showMsg('Hurricane!', 0.8);
    }
  }
  if(p.hurricaneT>0){
    p.hurricaneT -= dt;
    p.hurricaneTick -= dt;
    const hRank = effectiveRank(p,'hurricane')||0;
    if(p.hurricaneTick<=0){
      p.hurricaneTick += HURRICANE_TICK_INTERVAL;
      const hDmg = wpnDmg(p) * swd('hurricane', hRank) * assaultDealtMult(p) * weaponDmgMult(p);
      for(const e of g.enemies){
        if(dist(p,e) < HURRICANE_RADIUS*aoeRadiusMult(p)+e.r){
          e.hp -= applyEnemyArmor(p, e, hDmg); e.hitT = 0.15;
          e.chillT = Math.max(e.chillT||0, HURRICANE_TICK_INTERVAL+0.15);
          checkExecute(g, e);
        }
      }
    }
    if(p.hurricaneT<=0){ p.hurricaneT = 0; recalcStats(p); }
  }

  // Fireball / Ice Bolt (Elementalist, v76): the 2 virtual active skills
  // Elemental Polarity unlocks -- plain single-target projectiles, same
  // shape as Tornado, but each carries its own elemental flag (isFireball/
  // isIceBolt) so the projectile-hit loop can apply the right direct-hit
  // ailment and, once Elemental Explosions is ranked, splash damage +
  // chance-ailment onto nearby enemies (see that branch below).
  if(p.fireballCd>0) p.fireballCd -= dt;
  if(wantFireball){
    wantFireball=false;
    const fbRank = effectiveRank(p,'fireball')||0;
    if(fbRank>0 && p.atkCd<=0 && !(p.fbQueue && p.fbQueue.length)){
      const target = nearestEnemy(g, p, STAFF_RANGE+(p.weaponReachBonus||0));
      const ang = target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y, p.facing.x);
      p.facing = {x:Math.cos(ang), y:Math.sin(ang)};
      p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
      p.atkAnimT = 0.2;
      p.atkCd = p.atkCdMax*FIREBALL_ATKCD_MULT;
      const pol = polarityCast(p, 'fire');
      const n = fireballCount(fbRank);
      const bdmg = elementalPolarityDmg(p, FIREBALL_BASE_DMG, 0, 'fireball') * pol;
      p.fbQueue = p.fbQueue || [];
      for(let k=0;k<n;k++) p.fbQueue.push({t:k*FIREBALL_VOLLEY_GAP, ang, off:(k%2===0?-1:1)*FIREBALL_SIDE_OFFSET, dmg:bdmg});
      p.atkCd = Math.max(p.atkCd, (n-1)*FIREBALL_VOLLEY_GAP + FIREBALL_VOLLEY_PAUSE);   // v310: a short beat after each volley (3 balls, pause, 3 balls)
    }
  }
  if(p.fbQueue && p.fbQueue.length){
    for(const q of p.fbQueue) q.t -= dt;
    while(p.fbQueue.length && p.fbQueue[0].t<=0){
      const q = p.fbQueue.shift();
      const px = p.x - Math.sin(q.ang)*q.off, py = p.y + Math.cos(q.ang)*q.off;
      g.projectiles.push({x:px, y:py, vx:Math.cos(q.ang)*ELEMENTAL_BOLT_SPEED*FIREBALL_SPEED_MULT, vy:Math.sin(q.ang)*ELEMENTAL_BOLT_SPEED*FIREBALL_SPEED_MULT,   // v489: 20% slower
        r:7, dmg:q.dmg, from:'player', life:1.4/FIREBALL_SPEED_MULT, color:'#ff7a3d', isArrow:true, isFireball:true, manaReward:'fireball'});
      p.atkAnimT = 0.2;
    }
  }
  if(p.iceBoltCd>0) p.iceBoltCd -= dt;
  if(p.frozenOrbCd>0) p.frozenOrbCd -= dt;
  if(wantIceBolt){
    wantIceBolt=false;
    const ibRank = effectiveRank(p,'iceBolt')||0;
    const orbMode = uq(p,'uq_elementalist');   // v499 Crystalline Prism: Ice Bolt becomes Frozen Orb
    if(ibRank>0 && p.atkCd<=0 && !(orbMode && p.frozenOrbCd>0)){
      const target = nearestEnemy(g, p, STAFF_RANGE+(p.weaponReachBonus||0));
      const ang = target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y, p.facing.x);
      p.facing = {x:Math.cos(ang), y:Math.sin(ang)};
      p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
      p.atkAnimT = 0.3;
      p.atkCd = p.atkCdMax*ICE_BOLT_ATKCD_MULT / (p.permaZone && dist(p,p.permaZone) < p.permaZone.r ? PERMAFROST_ICEBOLT_SPEED : 1);
      const pol = polarityCast(p, 'cold');
      const dmg = elementalPolarityDmg(p, ICE_BOLT_BASE_DMG, 0, 'iceBolt') * pol;
      if(orbMode){ castFrozenOrb(g, p, ang, dmg); showMsg('Frozen Orb!', 0.7); }
      else {
        g.projectiles.push({x:p.x, y:p.y, vx:Math.cos(ang)*ELEMENTAL_BOLT_SPEED*ICE_BOLT_SPEED_MULT, vy:Math.sin(ang)*ELEMENTAL_BOLT_SPEED*ICE_BOLT_SPEED_MULT,
          r:ICE_BOLT_R, dmg, from:'player', life:1.8, color:'#7ad0ff', isArrow:true, isIceBolt:true, manaReward:'iceBolt'});
        showMsg('Ice Bolt!', 0.6);
      }
    }
  }

  // Lightning Arc (Djinn, v99 fix): now a normal independent active skill,
  // same shape as Fireball/Ice Bolt directly above -- no longer an
  // unconditional override of the default Main/Strike attack (see the
  // removed staffItem override branch). Reuses the shared atkCd/atkCdMax
  // pair (its own ACTIVE_SKILL_REGISTRY entry reads the same pair), so it
  // shares Strike's cooldown cadence exactly as it always effectively did.
  if(wantLightningArc){
    wantLightningArc=false;
    const laRank = effectiveRank(p,'lightningArc')||0;
    if(laRank>0 && p.atkCd<=0){
      p.atkCd = p.atkCdMax;
      castLightningArcBolt(g, p, laRank, true);
    }
  }

  // Soul Sap (Necromancer, v99 fix): now a normal independent active
  // skill, same shape as Lightning Arc directly above -- no longer an
  // unconditional override of the default Main/Strike attack. A kill
  // lands exactly 1 soul (see the isSoulSap hit-handler's e.hp<=0 check)
  // and spawns the white soul-orb visual flying back to the player.
  // Death Bolt (Necromancer, v268): a dark bolt that bounces between enemies. At 50% life or below it hits harder and steals life.
  if(wantDeathBolt){
    wantDeathBolt=false;
    const dbRank = effectiveRank(p,'deathBolt')||0;
    if(dbRank>0 && p.atkCd<=0){
      const target = nearestEnemy(g, p, STAFF_RANGE+(p.weaponReachBonus||0));
      const ang = target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y, p.facing.x);
      p.atkCd = p.atkCdMax;
      p.facing = {x:Math.cos(ang), y:Math.sin(ang)}; p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
      p.atkAnimT = 0.22;
      const low = p.hp <= p.maxHp*0.5;
      const dbCrit = Math.random()*100 < (p.critChance||0) + (p.rallyT>0 ? RALLY_CRIT_BONUS : 0) + stormCritBonus(p, target);
      let dbDmg = wpnDmg(p) * swd('deathBolt', dbRank);
      if(dbCrit) dbDmg *= critMultOf(p);
      dbDmg *= assaultDealtMult(p) * weaponDmgMult(p) * (low ? DEATHBOLT_LOW_MULT : 1);
      g.projectiles.push({x:p.x, y:p.y, vx:Math.cos(ang)*STAFF_BOLT_SPEED*projectileSpeedMult(p), vy:Math.sin(ang)*STAFF_BOLT_SPEED*projectileSpeedMult(p),
        r:7, dmg:dbDmg, from:'player', life:1.4, color:low?'#d03a78':'#8a4ae0', isArrow:true, crit:dbCrit, isDeathBolt:true,
        bouncesLeft:deathBoltBounces(dbRank), lifeSteal:low?DEATHBOLT_LIFESTEAL:0, hitIds:[]});
    }
  }
  // Soul Gate (Necromancer, v268): a portal that drains souls and sends out weak skeletal archers until the souls run out.
  if(p.soulGateCd>0 && !g.soulGate) p.soulGateCd -= dt;
  if(wantSoulGate){
    wantSoulGate=false;
    const sgRank = effectiveRank(p,'soulGate')||0;
    if(sgRank>0 && !g.soulGate && p.soulGateCd<=0 && (p.souls||0)>=SOULGATE_COST){
      p.soulGateCdMax = applyCdr(p, soulGateCooldown(sgRank)); p.soulGateCd = p.soulGateCdMax;
      const tgt = nearestEnemyOnScreen(g, p, 420);
      const gx = tgt ? p.x + (tgt.x-p.x)*0.45 : p.x + p.facing.x*110, gy = tgt ? p.y + (tgt.y-p.y)*0.45 : p.y + p.facing.y*110;
      g.soulGate = {x:gx, y:gy, t:0, spawnT:0.4, dur:soulGateDuration(sgRank), rank:sgRank};
      g.gateArchers = g.gateArchers || [];
      showMsg('Soul Gate!', 0.9);
      g.particles.push({type:'ring', x:gx, y:gy, t:0.5, max:0.5, r:90, color:'#a06ad0'});
    }
  }
  if(wantSoulSap){
    wantSoulSap=false;
    const ssRank = effectiveRank(p,'soulSap')||0;   // v460: Staff of Souls
    const ssTarget = ssRank>0 ? nearestEnemy(g, p, STAFF_RANGE+(p.weaponReachBonus||0)) : null;
    const ssTargets = []; if(ssTarget){ ssTargets.push(ssTarget); for(let k=1;k<soulSapTargets(ssRank);k++){ const t2 = nearestEnemy(g, ssTarget, SOUL_SAP_SPLASH_R, ssTargets); if(!t2 || !enemyOnScreen(g,t2)) break; ssTargets.push(t2); } }   // v497: rank 1 hits one enemy, rank 3 two, rank 5 three -- all on screen
    // (v106) Soul Sap is a targeted, instant drain: it needs an enemy in range
    // (no target = no cast, cooldown untouched). No outbound projectile -- a
    // white soul orb simply flies from the enemy back to the player.
    if(ssRank>0 && p.atkCd<=0 && ssTarget){
      p.atkCd = p.atkCdMax;
      const target = ssTarget;
      const ang = Math.atan2(target.y-p.y, target.x-p.x);
      p.facing = {x:Math.cos(ang), y:Math.sin(ang)};
      p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
      p.atkAnimT = 0.22;
      if(p.cls==='mystic') gainResource(p, p.maxMp*MANA_ON_HIT_PCT.soulSap);
      p.souls = Math.min(SOUL_CAP, (p.souls||0) + SOUL_SAP_SOULS_PER_CAST); checkDemonBindThreshold && checkDemonBindThreshold(g, p);   // v489: every Soul Sap attack makes a soul
      for(let ti=0; ti<ssTargets.length; ti++){ const target = ssTargets[ti];   // v417: nearest takes full damage, the other two 50%
      const isCrit = Math.random()*100 < (p.critChance||0) + (p.rallyT>0 ? RALLY_CRIT_BONUS : 0) + stormCritBonus(p, target);
      let dmg = wpnDmg(p);
      if(isCrit) dmg *= critMultOf(p);
      dmg *= assaultDealtMult(p) * weaponDmgMult(p) * swd('soulSap', ssRank) * (ti===0 ? 1 : 0.5);   // v318/v417: nearest full, extra targets half
      lastHitCrit = isCrit;
      target.hp -= applyEnemyArmor(p, target, dmg, 0, 'poison'); target.hitT = 0.15;   // v489: poison damage
      lastHitCrit = false;
      checkExecute(g, target);
      g.particles.push({type:'burst', x:target.x, y:target.y, t:0.22, max:0.22, color:'#7dd45a'});
      // a kill lands exactly 1 soul (same rule as before the rework)
      target.sapMarked = true;   // a soul is collected when this enemy dies (from any source)
      const orbAng = Math.atan2(p.y-target.y, p.x-target.x);
      g.projectiles.push({x:target.x, y:target.y, vx:Math.cos(orbAng)*SOUL_ORB_SPEED, vy:Math.sin(orbAng)*SOUL_ORB_SPEED,
        r:5, dmg:0, from:'player', life:1.2, color:'#ffffff', isSoulOrb:true});
      }
    }
  }

  // Ice Armor (Elementalist, v76): temporary self-buff Damage Reduction --
  // see iceArmorDamageReduction, hooked into playerDamage's takenMult chain.
  if(p.iceArmorCd>0) p.iceArmorCd -= dt;
  if(wantIceArmor){
    wantIceArmor=false;
    const iaRank = iceArmorOn(p) ? (effectiveRank(p,'iceArmor')||0) : 0;
    if(iaRank>0 && p.iceArmorCd<=0){
      if(p.iceArmorHp>0){ p.iceArmorCdMax = ICE_ARMOR_EXPLODE_CD; p.iceArmorCd = ICE_ARMOR_EXPLODE_CD; shatterIceArmor(g, p); }
      else showMsg('Ice Armor is recharging', 0.9, '#9ad0ff');
    }
  }
  iceArmorSync(p);
  { const iaRank = iceArmorOn(p) ? ((p.skills && effectiveRank(p,'iceArmor'))||0) : 0;   // v442: standing barrier, refills after a quiet spell (v454: only while slotted)
    if(iaRank>0){
      const mx = iceArmorBarrierMax(p, iaRank);
      if(p.iceArmorMax !== mx){ p.iceArmorMax = mx; if(p.iceArmorHp>mx) p.iceArmorHp = mx; }
      p.iaSince = (p.iaSince==null ? 99 : p.iaSince) + dt;
      if(p.iaSince >= iceArmorRecharge(iaRank) && p.iceArmorHp < mx){
        const was = p.iceArmorHp||0; p.iceArmorHp = Math.min(mx, was + mx*dt*2);
        if(was<=0) g.particles.push({type:'burst', x:p.x, y:p.y, t:0.4, max:0.4, color:'#7ad0ff'});
      }
      p.iceArmorT = p.iceArmorHp>0 ? ICE_ARMOR_DUR : 0;
    } else if(p.iceArmorHp>0 || p.iceArmorT>0){ p.iceArmorHp = 0; p.iceArmorT = 0; }
  }

  // Pyro Torrent (Elementalist, v76): a fixed forward cone that ticks fire
  // damage + Burn for a rank-scaled duration -- see this skill's own
  // comment above for the "channel" judgment call.
  if(p.pyroTorrentCd>0 && !(p.pyroTorrentT>0)) p.pyroTorrentCd -= dt;   // cooldown starts once the channel has ended
  if(wantPyroTorrent){
    wantPyroTorrent=false;
    const ptRank = effectiveRank(p,'pyroTorrent')||0;
    if(p.pyroTorrentT>0){ p.pyroTorrentT = 0; }   // v489: press again to stop (no duration limit, no cooldown)
    else if(ptRank>0){
      const target = nearestEnemy(g, p, PYRO_TORRENT_RANGE);
      const ang = target ? Math.atan2(target.y-p.y, target.x-p.x) : Math.atan2(p.facing.y, p.facing.x);
      p.facing = {x:Math.cos(ang), y:Math.sin(ang)};
      p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
      p.pyroTorrentAng = ang; p.pyroPol = polarityCast(p,'fire');
      p.pyroTorrentDurMax = 1e9; p.pyroTorrentT = 1e9; p.pyroTorrentElapsed = 0;
      p.pyroTorrentTick = 0;
      p.pyroTorrentCd = 0;
      showMsg('Pyro Torrent!', 0.8);
    }
  }
  if(p.pyroTorrentT>0){
    p.pyroTorrentElapsed = (p.pyroTorrentElapsed||0) + dt;
    p.pyroTorrentTick -= dt;
    { const cps = resCost(p,'pyroTorrent'); p.mp = Math.max(0,(p.mp||0) - cps*dt); if(p.mp<=0.01 && p.cls==='mystic'){ p.pyroTorrentT = 0; showMsg('Out of mana', 0.8); } }
    setAimStickVisible(p.pyroTorrentT>0);
    if(p.dodging){ p.pyroTorrentT = 0; }
    else {
      p.movementStopT = Math.max(p.movementStopT||0, 0.12); // channelled in place
      const ptRank = effectiveRank(p,'pyroTorrent')||0;
      const frac = clamp((p.pyroTorrentElapsed||0)/PYRO_RAMP_TIME, 0, 1);   // v489: ramps over the first 5s of channelling
      let ang = p.pyroTorrentAng!=null ? p.pyroTorrentAng : Math.atan2(p.facing.y,p.facing.x);
      let tgt = nearestEnemy(g, p, PYRO_TORRENT_RANGE);
      let manualAim = false;
      if(aimActive && (aimVec.x||aimVec.y)){   // (v147) stick overrides auto-tracking
        const w = screenDirToWorld(aimVec.x, aimVec.y);
        ang = Math.atan2(w.y, w.x); p.pyroTorrentAng = ang; manualAim = true; tgt = null;
      } else { const pcc = pcCursorWorld(); if(pcc){ ang = Math.atan2(pcc.y-p.y, pcc.x-p.x); p.pyroTorrentAng = ang; manualAim = true; tgt = null; } }   // v315: mouse aims the beam
      if(tgt){
        const want = Math.atan2(tgt.y-p.y, tgt.x-p.x);
        let da = want-ang; while(da>Math.PI) da-=2*Math.PI; while(da<-Math.PI) da+=2*Math.PI;
        const step = PYRO_TORRENT_TURN*dt;
        ang += Math.abs(da)<=step ? da : Math.sign(da)*step;
        p.pyroTorrentAng = ang;
      }
      const ca = Math.cos(ang), sa = Math.sin(ang);
      p.facing = {x:ca, y:sa}; p.faceSign = screenFacingSign(ca, sa);
      let beamLen = PYRO_TORRENT_RANGE;   // (v147) walls stop the beam
      for(let L=24; L<=PYRO_TORRENT_RANGE; L+=24){ if(losBlocked(room.obstacles, p.x,p.y, p.x+ca*L, p.y+sa*L)){ beamLen = L-24; break; } }
      g.particles.push({type:'beam', x:p.x, y:p.y, x2:p.x+ca*beamLen, y2:p.y+sa*beamLen, t:0.09, max:0.09, w:10+frac*9});
      if(p.pyroTorrentTick<=0){
        p.pyroTorrentTick += PYRO_TORRENT_TICK_INTERVAL;
        const tickDmg = wpnDmg(p) * swd('pyroTorrent', ptRank) * assaultDealtMult(p) * weaponDmgMult(p) * (1 + PYRO_TORRENT_RAMP*frac) * (p.pyroPol||1);
        for(const e of g.enemies){
          const dx = e.x-p.x, dy = e.y-p.y;
          const along = dx*ca + dy*sa, perp = Math.abs(-dx*sa + dy*ca);
          if(along > -10 && along < beamLen+e.r && hasLOS(g,p,e) && perp < PYRO_TORRENT_WIDTH+e.r){
            e.hp -= applyEnemyArmor(p, e, tickDmg, 0, "fire"); e.hitT = 0.15;
            e.burnT = Math.max(e.burnT||0, PYRO_TORRENT_TICK_INTERVAL+0.4);
            e.burnDps = Math.max(e.burnDps||0, tickDmg*BURN_DPS_PCT*3);
            if(Math.random()<0.5) g.particles.push({type:'burst', x:e.x, y:e.y, t:0.22, max:0.22, color:Math.random()<0.5?'#ff7a3d':'#ffd24a'});
            checkExecute(g, e);
          }
        }
      }
    }
    if(p.pyroTorrentT<0) p.pyroTorrentT = 0;
  }
  if(!(p.pyroTorrentT>0) && aimzone.style.display!=='none') setAimStickVisible(false);

  // Blizzard (Elementalist capstone, v76): instant self-centered AoE that
  // damages and applies the new generic Freeze (e.frozenT) -- see this
  // skill's own comment above.
  if(p.blizzardCd>0) p.blizzardCd -= dt;
  if(wantBlizzard){
    wantBlizzard=false;
    const bzRank = effectiveRank(p,'blizzard')||0;
    if(bzRank>0 && p.blizzardCd<=0) p.movementStopT = 0.2;
    if(bzRank>0 && p.blizzardCd<=0){
      p.blizzardCdMax = applyCdr(p, BLIZZARD_CD);
      p.blizzardCd = p.blizzardCdMax;
      // (v155) lands on an enemy: the one in reach (with line of sight) that has the most other enemies around it;
      // with nobody in reach it lands ahead of you instead of on you.
      const bzR = BLIZZARD_RADIUS*aoeRadiusMult(p);
      let bzPos = null, bzScore = -1, bzD = 1e9;
      for(const en of g.enemies){
        if(en.hp<=0) continue;
        const dd = dist(p,en);
        if(dd > BLIZZARD_CAST_RANGE || !hasLOS(g,p,en) || !enemyOnScreen(g,en)) continue;
        let sc = 0; for(const o of g.enemies) if(o.hp>0 && dist(o,en) < bzR && enemyOnScreen(g,o)) sc++;
        if(sc>bzScore || (sc===bzScore && dd<bzD)){ bzScore=sc; bzD=dd; bzPos={x:en.x,y:en.y}; }
      }
      if(!bzPos){
        const fa = Math.atan2(p.facing.y, p.facing.x);
        bzPos = {x:clamp(p.x+Math.cos(fa)*200, 40, g.room.w-40), y:clamp(p.y+Math.sin(fa)*200, 40, g.room.h-40)};
      }
      p.blizzardZone = {x:bzPos.x, y:bzPos.y, t:0, tick:0, rank:bzRank, r:bzR, pol:polarityCast(p,'cold'), hit:new Map()};
      showMsg('Blizzard!', 0.9);
    }
  }
  if(p.blizzardZone){
    const bz = p.blizzardZone;
    bz.t += dt; bz.tick -= dt;
    // persistent blue ground circle at the cast spot
    g.particles.push({type:'frostzone', x:bz.x, y:bz.y, t:0.06, max:0.06, r:bz.r});
    if(bz.tick<=0){
      bz.tick += BLIZZARD_TICK;
      const dmg = wpnDmg(p) * swd('blizzard', bz.rank) * assaultDealtMult(p) * weaponDmgMult(p) * (bz.pol||1);
      for(const e of g.enemies){
        if(dist(bz,e) < bz.r+e.r){
          e.hp -= applyEnemyArmor(p, e, dmg, 0, "cold"); e.hitT = 0.15;
          e.chillT = Math.max(e.chillT||0, BLIZZARD_TICK+0.6);
          if(bz.t - (bz.hit.get(e)||-9) >= 1){ bz.hit.set(e, bz.t); coldHit(e, 1); }
          checkExecute(g, e);
        }
      }
      for(let i=0;i<BLIZZARD_SHARDS_PER_TICK;i++){
        const a2 = Math.random()*Math.PI*2, rr = Math.sqrt(Math.random())*bz.r*0.78;
        g.particles.push({type:'iceshard', x:bz.x+Math.cos(a2)*rr, y:bz.y+Math.sin(a2)*rr, t:0.5, max:0.5, fall:0.32});
      }
    }
    if(bz.t >= skDur(p, BLIZZARD_DUR)) p.blizzardZone = null;
  }

  // ---------- v269: Immolate / Flame Vortex / Permafrost ----------
  if(p.immolateCd>0) p.immolateCd -= dt;
  if(wantImmolate){
    wantImmolate=false;
    const imR = effectiveRank(p,'immolate')||0;
    if(p.immolateT>0){ p.immolateT = 0; showMsg('The flames die down', 0.8); }   // v304: press again to extinguish
    else if(imR>0 && !(p.immolateCd>0) && p.hp <= p.maxHp*IMMOLATE_MIN_HP){ showMsg('Too weak to Immolate (needs over '+Math.round(IMMOLATE_MIN_HP*100)+'% life)', 1.2); }   // v481
    else if(imR>0 && !(p.immolateCd>0)){
      p.immolateDurMax = 1e9; p.immolateT = 1e9;   // v489: no duration -- burns until pressed again or you drop to 25% life
      p.immolatePol = polarityCast(p,'fire');   // v489: fire cast for Elemental Polarity (v490: was hidden behind the comment above)
      p.immolateCdMax = applyCdr(p, IMMOLATE_CD); p.immolateCd = p.immolateCdMax;
      showMsg('Immolate!', 0.9);
      g.particles.push({type:'ring', x:p.x, y:p.y, t:0.5, max:0.5, r:90, color:'#ff7a3d'});
      g.particles.push({type:'burst', x:p.x, y:p.y, t:0.4, max:0.4, color:'#ff5a1a'});
    }
  }
  if(p.immolateT>0){
    p.immolateT -= dt;
    if(p.hp <= p.maxHp*IMMOLATE_MIN_HP){ p.immolateT = 0; showMsg('The flames die down', 0.8); }
    else {
      selfFireDamage(g, p, p.maxHp*IMMOLATE_SELF_PCT*dt, true);
      if(Math.random()<dt*14) g.particles.push({type:'burst', x:p.x+rand(-10,10), y:p.y+rand(-10,10), t:0.28, max:0.28, color:Math.random()<0.5?'#ff7a3d':'#ffc040'});
    }
    if(p.immolateT<0) p.immolateT = 0;
  }
  if(p.flameVortexCd>0) p.flameVortexCd -= dt;
  if(wantFlameVortex){
    wantFlameVortex=false;
    const fvR = effectiveRank(p,'flameVortex')||0;
    if(fvR>0 && !(p.flameVortexCd>0) && !p.vortex){
      p.flameVortexCdMax = applyCdr(p, FLAME_VORTEX_CD); p.flameVortexCd = p.flameVortexCdMax;
      p.vortex = {t:0, dur:skDur(p, flameVortexDur(fvR)), tick:0, rank:fvR, pol:polarityCast(p,'fire'), r:FLAME_VORTEX_R*aoeRadiusMult(p), spin:0};
      showMsg('Flame Vortex!', 0.9);
    }
  }
  pyreHeartTick(p);   // v490: Pyre Heart keeps a Flame Vortex going while Immolate burns
  if(p.vortex){
    const v = p.vortex;
    v.t += dt; v.tick -= dt; v.spin += dt*5.5;
    g.particles.push({type:'vortex', x:p.x, y:p.y, t:0.06, max:0.06, r:v.r, spin:v.spin, prog:v.t/v.dur});
    const base = wpnDmg(p) * swd('flameVortex', v.rank) * assaultDealtMult(p) * weaponDmgMult(p) * v.pol;
    for(const e of g.enemies){
      if(!(e.hp>0)) continue;
      const dd = dist(p,e);
      if(FLAME_VORTEX_PULL>0 && dd < v.r+e.r && dd > 34 && !isHeavyEnemy(e) && !(e.frozenT>0)){   // v304: no longer drags enemies in
        const a2 = Math.atan2(p.y-e.y, p.x-e.x), pull = FLAME_VORTEX_PULL*dt;
        pushEnemy(g, e, a2, pull);
        pushEnemy(g, e, a2+Math.PI/2, pull*0.6);
      }
    }
    if(v.tick<=0){
      v.tick += 0.25;
      for(const e of g.enemies){
        if(e.hp>0 && dist(p,e) < v.r+e.r){
          const td = base;
          e.hp -= applyEnemyArmor(p, e, td, 0, 'fire'); e.hitT = 0.15;
          e.burnT = Math.max(e.burnT||0, FIRE_DOT_DUR); e.burnDps = Math.max(e.burnDps||0, td*BURN_DPS_PCT*2);
          checkExecute(g, e);
        }
      }
    }
    if(v.t >= v.dur){
      const blast = base*swdX('flameVortex', v.rank)/swd('flameVortex', v.rank);
      for(const e of g.enemies){
        if(e.hp>0 && dist(p,e) < v.r+e.r){
          e.hp -= applyEnemyArmor(p, e, blast, 0, 'fire'); e.hitT = 0.15;
          e.burnT = Math.max(e.burnT||0, FIRE_DOT_DUR); e.burnDps = Math.max(e.burnDps||0, blast*BURN_DPS_PCT);
          checkExecute(g, e);
        }
      }
      selfFireDamage(g, p, p.maxHp*FLAME_VORTEX_SELF_PCT, false);
      g.particles.push({type:'ring', x:p.x, y:p.y, t:0.5, max:0.5, r:v.r*1.2, color:'#ff7a3d'});
      g.particles.push({type:'burst', x:p.x, y:p.y, t:0.5, max:0.5, color:'#ff5a1a'});
      g.particles.push({type:'fireImpact', x:p.x, y:p.y, t:0.6, max:0.6, seed:Math.random()});
      showMsg('Vortex erupts!', 0.8);
      p.vortex = null;
    }
  }
  if(p.permafrostCd>0) p.permafrostCd -= dt;
  if(wantPermafrost){
    wantPermafrost=false;
    const pfR = effectiveRank(p,'permafrost')||0;
    if(pfR>0 && !(p.permafrostCd>0)){
      p.permafrostCdMax = applyCdr(p, permafrostCd(pfR)); p.permafrostCd = p.permafrostCdMax;
      const tg = nearestEnemyOnScreen(g, p, PERMAFROST_CAST_RANGE);
      let zx, zy;
      if(tg && hasLOS(g,p,tg)){ zx = tg.x; zy = tg.y; }
      else { const fa = Math.atan2(p.facing.y, p.facing.x); zx = clamp(p.x+Math.cos(fa)*160, 40, g.room.w-40); zy = clamp(p.y+Math.sin(fa)*160, 40, g.room.h-40); }
      p.permaZone = {x:zx, y:zy, t:0, dur:permafrostDur(pfR), r:PERMAFROST_R*aoeRadiusMult(p), rank:pfR, pol:polarityCast(p,'cold')};   // v489: cold cast for Elemental Polarity
      showMsg('Permafrost!', 0.9);
      g.particles.push({type:'ring', x:zx, y:zy, t:0.5, max:0.5, r:p.permaZone.r, color:'#4f82c8'});
    }
  }
  if(p.permaZone){
    const z = p.permaZone;
    z.t += dt;
    g.particles.push({type:'frostzone', x:z.x, y:z.y, t:0.06, max:0.06, r:z.r, perma:1, prog:z.t/z.dur});
    for(const e of g.enemies){
      if(e.hp>0 && dist(z,e) < z.r+e.r){
        e.permaT = 0.25; e.permaSlow = permafrostSlowPct(z.rank); e.permaAmp = permafrostColdAmp(z.rank);
      }
    }
    if(z.t >= z.dur) p.permaZone = null;
  }

  // ---------- Necromancer tree (v78) ----------------------------------
  // Fear: instant self-centered AoE, same "instant burst self-AoE, own
  // button/cooldown" shape as Nova/Fire Bomb -- but instead of a direct
  // hit, it applies the new e.fearT status (see the enemy-update loop's
  // own comment on that field) to everyone in range. No direct damage at
  // all, per the brief (a pure crowd-control skill).
  if(p.fearCd>0) p.fearCd -= dt;
  if(wantFear){
    wantFear=false;
    const frRank = effectiveRank(p,'fear')||0;
    if(frRank>0 && p.fearCd<=0){
      p.fearCdMax = applyCdr(p, fearCooldown(frRank));
      p.fearCd = p.fearCdMax;
      const dur = fearDuration(frRank), R = FEAR_RADIUS*aoeRadiusMult(p);
      const at = pickAoeSpot(g, p, R, FEAR_CAST_RANGE);   // v489: cast onto the biggest group in range
      for(const e of g.enemies){
        if(e.hp>0 && dist(at,e) < R+e.r){
          e.fearVulnT = dur + FEAR_VULN_EXTRA; e.fearVulnPct = fearVulnPct(frRank);   // every enemy hit is cursed (bosses too)
          if(!(e.isBoss||e.isLairBoss||e.lr||e.rev||e.lvBoss||e.mastodon||e.prot||e.bossName)) e.fearT = Math.max(e.fearT||0, dur);   // bosses do not flee
          g.particles.push({type:'burst', x:e.x, y:e.y, t:0.45, max:0.45, color:'#b07ae0'});
        }
      }
      showMsg('Fear!', 0.8);
      g.particles.push({type:'ring', x:at.x, y:at.y, t:0.55, max:0.55, r:R, color:'#b07ae0'});
      g.particles.push({type:'ring', x:at.x, y:at.y, t:0.4, max:0.4, r:R*0.55, color:'#e0c8ff'});
      g.particles.push({type:'gasBurst', thin:1, x:at.x, y:at.y, t:0.7, max:0.7, r:R*0.9, seed:Math.random()*6, color:'#6a3a90'});
      for(let k=0;k<10;k++){ const an = k/10*6.283; g.particles.push({type:'dbWisp', x:at.x+Math.cos(an)*R*0.6, y:at.y+Math.sin(an)*R*0.6, t:0.6, max:0.6}); }
    }
  }

  // v460 Raise Skeletons (active): raise every skeleton that is down or waiting on a soul, right now
  if(p.raiseDeadCd>0) p.raiseDeadCd -= dt;
  if(wantRaiseDead){
    wantRaiseDead = false;
    const rdR = effectiveRank(p,'raiseDead')||0;
    if(rdR>0 && !(p.raiseDeadCd>0)){
      // v489: recasting blows up every skeleton still standing (a Sacrifice burst) and raises a full fresh set
      let blown = 0;
      for(let k=g.followers.length-1;k>=0;k--){ const f = g.followers[k]; if(f.kind!=='skeleton') continue; g.followers.splice(k,1); necroSkeletonDeath(g, f, true); blown++; }
      p.skelDown = 0; if(g.followerPending) g.followerPending = g.followerPending.filter(x=>x.kind!=='skeleton');
      // v530: after the Sacrifice blast the new set claws out of the earth around you 1.5s later
      if(blown){ p.skelHold = 1; g.skelRaiseT = SKEL_RECAST_DELAY; for(let k=0;k<6;k++){ const an = k*1.05; g.particles.push({type:'burst', x:p.x+Math.cos(an)*70, y:p.y+Math.sin(an)*55, t:0.5, max:0.5, color:'#5a4630'}); } }
      else necroRaiseNow(g, p);
      p.raiseDeadCdMax = applyCdr(p, RAISE_DEAD_CD); p.raiseDeadCd = p.raiseDeadCdMax;
      g.particles.push({type:'ring', x:p.x, y:p.y, t:0.4, max:0.4, r:70, color:'#a08ad0'});
      showMsg('Rise!', 0.7);
    }
  }
  if(g.skelRaiseT>0){ g.skelRaiseT -= dt; if(g.skelRaiseT<=0){ p.skelHold = 0; necroRaiseNow(g, p); } }
  else if(p.skelHold) p.skelHold = 0;   // (a reload mid-wait never leaves them held)

  // v460 Meteor: lands on the thickest group in range after a moment, then leaves burning ground
  if(p.meteorCd>0) p.meteorCd -= dt;
  if(wantMeteor){
    wantMeteor = false;
    const mr = effectiveRank(p,'meteor')||0;
    if(mr>0 && !(p.meteorCd>0)){
      p.meteorCdMax = applyCdr(p, BLIZZARD_CD); p.meteorCd = p.meteorCdMax;
      p.movementStopT = Math.max(p.movementStopT||0, 0.2);
      const R = METEOR_R*aoeRadiusMult(p);
      let pos = null, best = -1, bd = 1e9;
      for(const en of g.enemies){
        if(!(en.hp>0)) continue; const dd = dist(p,en);
        if(dd > BLIZZARD_CAST_RANGE || !hasLOS(g,p,en) || !enemyOnScreen(g,en)) continue;
        let sc = 0; for(const o of g.enemies) if(o.hp>0 && dist(o,en) < R) sc++;
        if(sc>best || (sc===best && dd<bd)){ best = sc; bd = dd; pos = {x:en.x, y:en.y}; }
      }
      if(!pos){ const fa = Math.atan2(p.facing.y, p.facing.x); pos = {x:clamp(p.x+Math.cos(fa)*200, 40, g.room.w-40), y:clamp(p.y+Math.sin(fa)*200, 40, g.room.h-40)}; }
      (p.meteorFx || (p.meteorFx = [])).push({x:pos.x, y:pos.y, t:0, rank:mr, r:R, pol:polarityCast(p,'fire'), landed:false, tick:0, seed:Math.random()*100});
      showMsg('Meteor!', 0.9);
    }
  }
  if(p.meteorFx && p.meteorFx.length){
    for(let i=p.meteorFx.length-1;i>=0;i--){
      const m = p.meteorFx[i]; m.t += dt;
      if(!m.landed){
        g.particles.push({type:'meteorMark', x:m.x, y:m.y, t:0.05, max:0.05, r:m.r, prog:Math.min(1, m.t/METEOR_DELAY)});
        g.particles.push({type:'meteorFall', x:m.x, y:m.y, t:0.05, max:0.05, prog:Math.min(1, m.t/METEOR_DELAY), seed:m.seed});
        if(m.t >= METEOR_DELAY){
          m.landed = true; m.t = 0;
          m.base = wpnDmg(p) * assaultDealtMult(p) * weaponDmgMult(p) * (m.pol||1);
          const hit = m.base * swd('meteor', m.rank);
          for(const e of g.enemies){
            if(!(e.hp>0)) continue; const d = dist(m,e);
            if(d < m.r+e.r){ const edge = 1 - 0.35*Math.min(1, d/m.r); e.hp -= applyEnemyArmor(p, e, hit*edge, 0, 'fire'); e.hitT = 0.2; checkExecute(g, e); }
          }
          shakeScreen(g, 7, 0.35);
          g.particles.push({type:'ring', x:m.x, y:m.y, t:0.45, max:0.45, r:m.r*1.1, color:'#ffb050'});
          for(let k=0;k<10;k++){ const an = k/10*6.283, rr = m.r*(0.25+Math.random()*0.5); g.particles.push({type:'burst', x:m.x+Math.cos(an)*rr, y:m.y+Math.sin(an)*rr, t:0.45, max:0.45, color:k%2?'#ff7a2a':'#ffd060'}); }
          try{ sfxPlay('fireHit', 1); sfxPlay('thunder', 0.45); }catch(err){}
        }
      } else {
        const BR = m.r*0.9;
        g.particles.push({type:'burnzone', x:m.x, y:m.y, t:0.05, max:0.05, r:BR, prog:m.t/skDur(p, METEOR_BURN_DUR), seed:m.seed});
        m.tick -= dt;
        if(m.tick <= 0){
          m.tick += METEOR_BURN_TICK;
          const dps = m.base * swdX('meteor', m.rank);   // the burn tick applies the fire % mods
          for(const e of g.enemies){ if(e.hp>0 && dist(m,e) < BR+e.r){ e.burnT = Math.max(e.burnT||0, METEOR_BURN_TICK+0.4); e.burnDps = Math.max(e.burnDps||0, dps); } }
        }
        if(m.t >= skDur(p, METEOR_BURN_DUR)) p.meteorFx.splice(i,1);
      }
    }
  }

  // v489 Soul Fire: 5 souls + 20 mana -- a big, slow ball of green soul-flame that bursts on impact (see soulFireExplode)
  if(p.soulFireCd>0) p.soulFireCd -= dt;
  if(wantSoulFire){
    wantSoulFire=false;
    const sfRank = effectiveRank(p,'soulFire')||0;
    if(sfRank>0 && p.soulFireCd<=0){
      if((p.souls||0) < SOULFIRE_SOUL_MIN){ if(!(p.resMsgT>0)){ p.resMsgT = 0.9; showMsg('Not enough souls ('+SOULFIRE_SOUL_MIN+' needed)', 0.9); } }
      else if((p.mp||0) < SOULFIRE_MANA_COST){ noResourceMsg(p); }
      else {
        const sfSpent = Math.min(SOULFIRE_SOUL_COST, Math.floor(p.souls||0));   // v507: 10 to 20 souls; the full 20 adds 20% damage
        const dmg = soulFireDmg(p, sfRank) * (1 + SOULFIRE_BONUS*(sfSpent-SOULFIRE_SOUL_MIN)/(SOULFIRE_SOUL_COST-SOULFIRE_SOUL_MIN));   // (with the souls still held, so Soul Hunger counts them)
        p.souls -= sfSpent; p.mp = Math.max(0, (p.mp||0) - SOULFIRE_MANA_COST);
        p.soulFireCdMax = applyCdr(p, SOULFIRE_CD); p.soulFireCd = p.soulFireCdMax;
        const tg = nearestEnemyOnScreen(g, p, 520);
        const ang = tg ? Math.atan2(tg.y-p.y, tg.x-p.x) : Math.atan2(p.facing.y, p.facing.x);
        p.facing = {x:Math.cos(ang), y:Math.sin(ang)}; p.faceSign = screenFacingSign(p.facing.x, p.facing.y); p.atkAnimT = 0.3;
        g.projectiles.push({x:p.x+Math.cos(ang)*20, y:p.y+Math.sin(ang)*20, vx:Math.cos(ang)*SOULFIRE_SPEED*projectileSpeedMult(p), vy:Math.sin(ang)*SOULFIRE_SPEED*projectileSpeedMult(p),
          r:SOULFIRE_R, dmg, from:'player', life:SOULFIRE_LIFE, isSoulFire:true, seed:Math.random()*10, R:SOULFIRE_RADIUS*aoeRadiusMult(p)});
        showMsg('Soul Fire!', 0.7);
      }
    }
  }

  // Plague (capstone, requires Sacrifice OR Demon Bind): a large, ground-
  // targeted (left behind at the cast position) poison DoT zone -- see
  // this skill's own top comment for the "consumes ALL current souls on
  // cast, +0.1s duration per soul" judgment call.
  if(p.plagueCd>0 && !p.plagueZone) p.plagueCd -= dt;   // cooldown starts once the zone has ended
  if(wantPlague){
    wantPlague=false;
    const plRank = effectiveRank(p,'plague')||0;
    if(plRank>0 && p.plagueCd<=0){
      p.plagueCd = applyCdr(p, p.plagueCdMax);
      const soulsConsumed = 0;   // Plague no longer uses souls
      p.plagueZone = {x:p.x, y:p.y, t:0, max:skDur(p, plagueDuration(soulsConsumed)), tick:0, rank:plRank, r:PLAGUE_RADIUS*aoeRadiusMult(p)};
      showMsg('Plague!', 0.9);
      g.particles.push({type:'ring', x:p.x, y:p.y, t:0.5, max:0.5, r:PLAGUE_RADIUS*aoeRadiusMult(p), color:'#3f6a2a'});
      g.particles.push({type:'gasBurst', thin:1, x:p.x, y:p.y, t:0.8, max:0.8, r:PLAGUE_RADIUS*aoeRadiusMult(p), seed:Math.random()*6});
    }
  }
  if(p.plagueZone){
    const pz = p.plagueZone;
    pz.t += dt; pz.tick -= dt;
    if(pz.tick<=0){
      pz.tick += PLAGUE_TICK_INTERVAL;
      const tickDmg = wpnDmg(p) * swd('plague', pz.rank);
      for(const e of g.enemies){
        if(dist(pz,e) < (pz.r||PLAGUE_RADIUS)+e.r){
          const cm = cloudStayMult(g, e, PLAGUE_TICK_INTERVAL);
          addPoison(e, tickDmg*cm, 'plague', PLAGUE_TICK_INTERVAL+0.15, true);
        }
      }

      // Judgment call: no persistent ground-tile sprite for the zone
      // (the game's per-scene drawable lists don't have an existing hook
      // for a lingering AoE decal the way g.traps does) -- a periodic ring
      // + burst particle, re-emitted every tick at the zone's fixed
      // position, reads clearly enough as "a corrupted patch of ground"
      // without needing new render-list plumbing across all 8 scenes.
    }
    g.particles.push({type:'gasCloud', thin:1, x:pz.x, y:pz.y, t:0.06, max:0.06, r:(pz.r||PLAGUE_RADIUS), f:Math.max(0,Math.min(1, pz.t/0.5, (pz.max-pz.t)/0.9)), seed:3.3});
    if(pz.t >= pz.max) p.plagueZone = null;
  }

  // (v105) any attack/skill cast this frame plants the player for a moment.
  applyCastMovementStop(p, castCdSnap);
  applyResourceCosts(p, castCdSnap);

  // enemies
  for(const e of g.enemies){
    if(e.markT>0){ e.markT -= dt; g.particles.push({type:'zone', subtle:true, x:e.x, y:e.y, t:0.06, max:0.06, r:e.r+8, color:'#ff4a4a'}); }
    if(e.wraith){ updateWraith(g, e, dt); continue; }
    e.animT += dt;
    if(e.hitT>0) e.hitT-=dt;
    if(e.atkCd>0) e.atkCd-=dt;
    if(e.atkAnimT>0) e.atkAnimT-=dt;
    if(e.regen && e.hp>0 && e.hp<e.maxHp) e.hp = Math.min(e.maxHp, e.hp + e.maxHp*0.02*dt);
    if(e.fearVulnT>0) e.fearVulnT -= dt;
    if(e.warCryT>0) e.warCryT -= dt;
    if(e.rev || e.lr || e.gj || e.trex || e.colossus){ e.stunT=0; e.frozenT=0; e.fearT=0; e.staggerT=0; e.trapRootT=0; } // immune to crowd control
    const sdm = 1/(1+((g.player&&g.player.statusDurPct)||0)+((g.player&&g.player.skillDurPct)||0));   // v440 Status Duration % (+ v489 Skill Duration %)
    // Bleed (Commander Attack stance): ticks even through a stun.
    if(e.bleedStacks && e.bleedStacks.length){   // v519: one stack per source, all summed (like poison)
      for(let bi=e.bleedStacks.length-1; bi>=0; bi--){ e.bleedStacks[bi].t -= dt*sdm; if(e.bleedStacks[bi].t<=0) e.bleedStacks.splice(bi,1); }
      bleedSync(e);
    } else if(e.bleedT>0){ e.bleedT = 0; e.bleedDps = 0; }
    if(e.bleedT>0){
      { const bdt = e.bleedDps*dt*dotPctMult(null); e.hp -= bdt; dotAdd(e, bdt, '#e0566b'); }
      if(Math.random()<0.15) g.particles.push({type:'burst', x:e.x, y:e.y, t:0.2, max:0.2, color:'#b4293f'});
    }
    // Poison DoT (v508: one stack per source, all summed): its own field, so it coexists with Bleed.
    if(e.poisonStacks && e.poisonStacks.length){
      for(let pi=e.poisonStacks.length-1; pi>=0; pi--){ e.poisonStacks[pi].t -= dt*sdm; if(e.poisonStacks[pi].t<=0) e.poisonStacks.splice(pi,1); }
      poisonSync(e);
    } else if(e.poisonT>0){ e.poisonT = 0; e.poisonDps = 0; }
    if(e.poisonT>0){
      e.hp -= e.poisonDps*dt*dotPctMult('poison')*(1-enemyResist(e,"poison")); dotAdd(e, e.poisonDps*dt*dotPctMult('poison')*(1-enemyResist(e,"poison")), '#8fe05a');
      if(Math.random()<0.15) g.particles.push({type:'burst', x:e.x, y:e.y, t:0.2, max:0.2, color:'#7dd45a'});
    }
    // Nova's Shock (Djinn, v75) DoT: distinct field from Bleed/Poison so
    // all three can stack/coexist, same pattern as Poison Knives above.
    if(e.shockT>0 || e.shockDps>0){ e.shockT = 0; e.shockDps = 0; }   // v454: the old yellow shock DoT is gone
    if(e.shockT>0){
      e.shockT -= dt*sdm;
      e.hp -= e.shockDps*dt*dotPctMult('lightning')*(1-enemyResist(e,"lightning")); dotAdd(e, e.shockDps*dt*dotPctMult('lightning')*(1-enemyResist(e,"lightning")), '#f2ee6a');
      if(Math.random()<0.15) g.particles.push({type:'burst', x:e.x, y:e.y, t:0.2, max:0.2, color:'#e6e35a'});
    }
    // Elementalist's Burn (v76) DoT: its own distinct field from Bleed/
    // Poison/Shock so all four can stack/coexist -- see this tree's own
    // top comment for why a new field was added instead of reusing the
    // pre-existing (Bleed-based) staff-spell burn.
    if(e.burnT>0){
      e.burnT -= dt*sdm;
      e.hp -= e.burnDps*dt*dotPctMult('fire')*(1-enemyResist(e,"fire")); dotAdd(e, e.burnDps*dt*dotPctMult('fire')*(1-enemyResist(e,"fire")), '#ff9a4a');
      if(Math.random()<0.15) g.particles.push({type:'burst', x:e.x, y:e.y, t:0.2, max:0.2, color:'#ff7a3d'});
    }
    dotFlush(g, e, dt); chargeTick(e, dt);
    // Ice Shot chill: slows movement for a few seconds, ticks even through a stun.
    // Hurricane (Djinn, v75) reuses this exact same field/mechanic for its
    // own slow -- see HURRICANE_TICK_INTERVAL's comment for why.
    if(e.chillT>0){ e.chillT -= dt*sdm; if(e.chillT<0) e.chillT=0; }
    // Aggro-swap window (see markAttacked/pickEnemyTarget): counts down
    // whether or not it's currently being used as this enemy's target.
    if(e.lastAttackedT>0){ e.lastAttackedT -= dt; if(e.lastAttackedT<0) e.lastAttackedT=0; }
    if(e.permaT>0) e.permaT -= dt; if(e.permaArmedT>0) e.permaArmedT -= dt; if(e.permaCool>0) e.permaCool -= dt;
    if(e.coldHitT>0) e.coldHitT -= dt; if(e.freezeImmT>0) e.freezeImmT -= dt;
    if(e.elderBuffT>0){ e.elderBuffT -= dt; if(e.elderBuffT<=0){ e.elderBuffT = 0; e.dmg /= 1.25; e.speed /= 1.15; } }
    if(e.anchorT>0){ e.anchorT -= dt; if(e.anchorT<=0){ e.anchorT = 0; e.anchorSlow = 0; } }   // v492 Seismic Anchor slow fades
    const chillMult = (e.chillT>0 ? 0.5 : 1) * (e.permaT>0 ? 1-(e.permaSlow||0.25) : 1) * anchorSlowMult(e);   // v489: Permafrost slows 25-50%
    // Blizzard's Freeze (e.frozenT, v76): a brand-new, GENERIC full
    // immobilize -- merged into the same branch as Stun (both fully stop
    // movement/attacks via `continue`) so either one ticks down correctly
    // even while the other is also active, rather than only decrementing
    // whichever field's own `if` happens to run first. Kept as its own
    // field (not just reusing e.stunT) so Freeze and Stun can be told
    // apart/extended independently -- see this tree's own top comment
    // for why, and for the note that a later Ranger batch (Frost Trap) is
    // expected to reuse this exact mechanism for its own freeze effect.
    // v453: a wind-up whose AI branch didn't run last frame (target walked out of aggro/leash) is cancelled instead of freezing mid-telegraph
    if((e.boarChargeState==='wind' || ((e.type==='bear'||e.type==='ram') && e.chargeState==='wind') || e.zChargeState==='wind') && (g.clock||0) - (e._aiT||0) > 0.25){ if(e.boarChargeState==='wind') e.boarChargeState='idle'; if(e.chargeState==='wind') e.chargeState='idle'; if(e.zChargeState==='wind') e.zChargeState='idle'; e.windT = 0; }
    if(e.stunT>0 || e.frozenT>0){
      if(e.stunT>0){ e.stunT-=dt; if(e.stunT<0) e.stunT=0; }
      if(e.blindT>0) e.blindT -= dt;
      if(e.frozenT>0){ e.frozenT-=dt; if(e.frozenT<0) e.frozenT=0; }
      e.windT=0; e.moving=false; if(e.chargeState==='wind' || e.chargeState==='charging') e.chargeState='idle'; if(e.boarChargeState==='wind' || e.boarChargeState==='charging') e.boarChargeState='idle'; if(e.zChargeState==='wind' || e.zChargeState==='charging') e.zChargeState='idle'; if(e.chargeT>0) e.chargeT = 0; continue;
    }
    // Stagger (v104): a melee Strike makes normal enemies flinch -- frozen
    // in place and their wind-up cancelled (the swing's cooldown is still
    // spent) -- followed by a short immunity window so they can't be
    // stun-locked. Bosses/lair bosses never get staggered.
    if(e.staggerImmuneT>0) e.staggerImmuneT -= dt;
    if(e.staggerT>0){
      e.staggerT -= dt; e.windT = 0; e.moving = false; if(e.chargeState==='wind') e.chargeState='idle'; if(e.boarChargeState==='wind') e.boarChargeState='idle'; if(e.zChargeState==='wind') e.zChargeState='idle';
      if(e.staggerT<=0){ e.staggerT = 0; e.staggerImmuneT = STAGGER_IMMUNE; }
      continue;
    }
    if(e.trapRootT>0){ e.trapRootT-=dt; e.windT=0; e.moving=false; continue; }
    // Fear (Necromancer, v78): a brand-new "flee" status -- while e.fearT
    // is >0, this completely overrides the enemy's normal chase/attack/
    // wander logic (including the Forest/Mountain Pass pack-aggro branch
    // just below, and every per-type melee/ranged/charge branch further
    // down) with a simple "move directly away from the player" behavior,
    // then `continue`s past all of that for the frame -- same
    // "self-contained override, doesn't touch every enemy type's own
    // branch" approach Stun/Freeze/Root above already use. No attacks are
    // ever made while feared. Existing DoTs (bleed/poison/shock/burn)
    // still ticked earlier in this same loop, so a feared enemy can still
    // be worn down by damage-over-time while it runs.
    // (v252) floor 10: goblins and trolls that chase you onto the bridge lose their nerve at the middle and bolt back
    if(room.bridge && !e.balrog && !e.balAdd && !(e.fearT>0) && (e.type==='goblin' || e.type==='goblinarcher' || e.type==='cavetroll') && e.x < room.bridge.midX && e.x > room.bridge.x0){
      e.fearT = 3.0; e.engaged = false;
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:'#ff6a3a'});
    }
    if(e.fearT>0){
      e.fearT -= dt; if(e.fearT<0) e.fearT = 0;
      const awayAng = Math.atan2(e.y-p.y, e.x-p.x);
      const ang = steerAngleTo(e, e.x+Math.cos(awayAng)*120, e.y+Math.sin(awayAng)*120, room.obstacles);
      e.facing = {x:Math.cos(awayAng), y:Math.sin(awayAng)};
      e.faceSign = screenFacingSign(e.facing.x, e.facing.y);
      e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt;
      e.moving = true;
      e.x = clamp(e.x, e.r, room.w-e.r);
      e.y = clamp(e.y, e.r, room.h-e.r);
      pushOutOfObstacles(e, (e.swimmer&&room.dryObstacles||room.obstacles));
      continue;
    }
    // Monsters (boss included) should only engage -- chase, attack, or start
    // a new boss-slam telegraph -- while they're actually within the visible
    // screen. A small margin keeps them from freezing dead at the exact edge.
    const onScreen = isOnScreen(g, e, 90);
    // v520: a telegraph / roll / leap that has begun always finishes, even if the player walks away (no frozen circles)
    const midAct = e.tState==='tele' || e.tState==='swing' || e.tState==='air' || e.tState==='lash' || e.tState==='pull' || e.lungeState==='tele' || e.lungeState==='lunge' || (e.dwc && e.cState && e.cState!=='chase') || (e.mastodon && (e.mSt==='avaPhase' || (e.mRocks && e.mRocks.length>0)));
    // Forest (and Mountain Pass) packs hold their ground until the player
    // wanders close, rather than beelining in on sight the way dungeon
    // enemies do -- and give up the chase (going back to idle) if it
    // strays too far from its pack spot.
    if(!e.gj && !e.harpyQueen && (g.scene==='forest' || g.scene==='rivervalley' || g.scene==='mountainpass' || g.scene==='highlands' || g.scene==='icyzone' || g.scene==='frosthold' || g.scene==='redridge' || g.scene==='redcrater' || g.scene==='blackmarsh')){
      if(e.herdId && e.hp<e.maxHp){ (g._herdAlarm||(g._herdAlarm={}))[e.herdId] = true; }
      // v403: a pack wakes as one -- when any member is hurt or aggroed, its packmates join in (alarm lasts 0.6s, refreshed while any is aggroed)
      if(e.packId && (e.aggroed || e.hp<e.maxHp)) (g._packAlarm||(g._packAlarm={}))[e.packId] = g.clock||0;
      if(!e.aggroed){
        if(e.hp<e.maxHp || (e.herdId && g._herdAlarm && g._herdAlarm[e.herdId]) || (e.packId && g._packAlarm && g._packAlarm[e.packId]!=null && (g.clock||0)-g._packAlarm[e.packId] < 0.6) || (dist(e,p) < (e.aggroRange||220) && enemyLOS(g,e,p))){
          e.aggroed = true;
        } else {
          e.wanderCd = (e.wanderCd||0) - dt;
          if(!e.wanderTarget || e.wanderCd<=0){
            const r = e.wanderRadius||55;
            e.wanderTarget = {x:e.homeX+rand(-r,r), y:e.homeY+rand(-r,r)};
            e.wanderCd = rand(2.5,5);
          }
          const wd = dist(e, e.wanderTarget);
          e.moving = false;
          if(wd>6){
            const ang = Math.atan2(e.wanderTarget.y-e.y, e.wanderTarget.x-e.x);
            e.x += Math.cos(ang)*e.speed*0.35*chillMult*dt; e.y += Math.sin(ang)*e.speed*0.35*chillMult*dt;
            e.facing = {x:Math.cos(ang), y:Math.sin(ang)};
            e.faceSign = screenFacingSign(e.facing.x, e.facing.y);
            e.moving = true;
          }
          e.x = clamp(e.x, e.r, room.w-e.r);
          e.y = clamp(e.y, e.r, room.h-e.r);
          pushOutOfObstacles(e, (e.swimmer&&room.dryObstacles||room.obstacles));
          continue;
        }
      } else {
        // lost sight of the player behind walls for a while (or strayed too far): give up
        if(enemyLOS(g,e,p)) e._noLosT = 0; else e._noLosT = (e._noLosT||0)+dt;
        if(!midAct && (e._noLosT>4 || dist(e,{x:e.homeX,y:e.homeY}) > (e.leashRange||400))){
          e.aggroed = false; e.wanderTarget = null; e._noLosT = 0;
        }
      }
    }
    // v329: the drowned (Lakeside Ruins event) wade straight across the water to the scholar; they only turn on you once you are close
    if(e.ruinsZ && g.lake && g.lake.event && g.lake.event.active && !(e.lastAttackedT>0) && dist(e,p) > 190){
      const sc = g.lake.scholarSpot;
      if(dist(e,sc) > 60){
        const ang = steerAngleTo(e, sc.x, sc.y, room.dryObstacles||room.obstacles);
        e.facing = {x:Math.cos(ang), y:Math.sin(ang)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y);
        e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt; e.moving = true;
      } else e.moving = false;
      e.x = clamp(e.x, e.r, room.w-e.r); e.y = clamp(e.y, e.r, room.h-e.r);
      pushOutOfObstacles(e, (room.dryObstacles||room.obstacles));
      continue;
    }
    const target = pickEnemyTarget(g, e); // taunting follower > whoever's attacking it > closest -- see pickEnemyTarget
    if(!target){
      // Nothing valid to target (e.g. the player is Vanished and no
      // follower is out) -- the monster just has nothing to do, rather
      // than the old "freeze the whole enemy" Vanish behavior.
      e.moving = false;
      continue;
    }
    const isFollowerTarget = target !== p;
    const d = dist(e,target);
    // v295: bosses stay rooted in their chamber until the player is close AND in clear sight (or the boss has been hurt) -- no attacks through walls
    if((e.isBoss||e.isLairBoss||e.rev||e.lr||e.gj||e.trex||e.balrog||e.colossus||e.harpyQueen||e.wlord||e.dboss||e.lvBoss) && !e.bossWoke && !(e.aggroRange>=99999)){
      if(e.hp<e.maxHp || (dist(e,p) < BOSS_WAKE_R && enemyLOS(g,e,p))) e.bossWoke = true;
      else { e.moving = false; continue; }
    }
    if(e.rev){ if(onScreen || e.rvState!=='chase') updateRevenant(g, e, dt, target, d, isFollowerTarget, chillMult, room); continue; }
    if(e.lr){ updateLightningRaptor(g, e, dt, target, d, isFollowerTarget, chillMult, room); continue; }
    if(e.gj){ updateGojira(g, e, dt, target, d, isFollowerTarget, chillMult, room); continue; }
    if(e.trex){ updateTrex(g, e, dt, target, d, isFollowerTarget, chillMult, room); continue; }
    if(e.balrog){ if(onScreen || e.bState!=='chase') updateBalrog(g, e, dt, target, d, isFollowerTarget, chillMult, room); continue; }
    if(e.colossus){ updateColossus(g, e, dt, target, d, isFollowerTarget, chillMult, room); continue; }
    if(e.harpyQueen){ updateHarpyQueen(g, e, dt, target, d, isFollowerTarget, chillMult, room); continue; }
    if(e.wlord){ updateWraithLord(g, e, dt, target, d, isFollowerTarget, chillMult, room); continue; }
    if(e.dboss){ updateDemonBoss(g, e, dt, target, d, isFollowerTarget, chillMult, room); continue; }
    if(e.prot){ if(onScreen || e.prState!=='chase') updateProtector(g, e, dt, target, d, isFollowerTarget, chillMult, room); continue; }
    // (v147) Engagement distance: outside the hold-your-ground zones, enemies wait until you are close
    // (and in clear sight) or until they are hurt; they give up after ~4s without a line of sight.
    if(!(g.scene==='forest'||g.scene==='mountainpass'||g.scene==='highlands'||g.scene==='icyzone'||g.scene==='frosthold'||g.scene==='redridge'||g.scene==='redcrater'||g.scene==='blackmarsh') && !e.isBoss && !e.isLairBoss && e.type!=='leviathan' && !e.minerSwarm){
      if(e.packId && (e.engaged || e.hp<e.maxHp)) (g._packAlarm||(g._packAlarm={}))[e.packId] = g.clock||0;   // v403: packs wake together
      if(!e.engaged){
        if(e.hp<e.maxHp || (e.packId && g._packAlarm && g._packAlarm[e.packId]!=null && (g.clock||0)-g._packAlarm[e.packId] < 0.6) || (d < ENGAGE_R && enemyLOS(g,e,target))) e.engaged = true;
        else { e.moving = false; continue; }
      } else {
        if(enemyLOS(g,e,target)) e._noLosT = 0; else e._noLosT = (e._noLosT||0)+dt;
        if(!midAct && e._noLosT>(navRoomOn(room) ? 9 : 4)){ e.engaged = false; e._noLosT = 0; e.moving = false; continue; }
      }
    }
    const fAng = Math.atan2(target.y-e.y, target.x-e.x);
    e.facing = {x:Math.cos(fAng), y:Math.sin(fAng)};
    e.faceSign = screenFacingSign(e.facing.x, e.facing.y);

    // Leviathans (Kraken, Marsh/Pool Leviathans, Breach pools): every one runs its own boss state machine
    if(e.type==='leviathan'){ updateLeviathanBoss(g, e, dt, target, d, room); continue; }

    // Boss slam: an independent, ground-targeted AoE on its own cooldown --
    // telegraphed half a second early with a red ring, then it hits anyone
    // (player or follower) standing in the ring when it lands.
    if(e.isBoss){
      if(e.slamState==='telegraph'){
        e.slamTelegraphT -= dt;
        if(e.slamTelegraphT<=0){
          const slamDmg = teleDmg(e, BOSS_SLAM_DMG_MULT);
          if(dist(p, e.slamPos) < BOSS_SLAM_RADIUS+p.r) playerDamage(g, slamDmg, e);
          if(g.followers) for(const f of g.followers){
            if(dist(f, e.slamPos) < BOSS_SLAM_RADIUS+f.r) applyFollowerDamage(g, f, slamDmg, e);
          }
          g.particles.push({type:'burst', x:e.slamPos.x, y:e.slamPos.y, t:0.35, max:0.35, color:'#ff6a3a'});
          e.slamState = 'idle';
          e.slamCd = BOSS_SLAM_CD;
        }
      } else {
        e.slamCd -= dt;
        // Only START a new slam telegraph while the boss is on-screen -- a
        // telegraph already in progress still resolves above regardless,
        // since it's a short 0.5s window and cancelling it mid-flight would
        // just be extra bookkeeping for no real benefit.
        if(e.slamCd<=0 && onScreen){
          e.slamState = 'telegraph';
          e.slamTelegraphT = BOSS_SLAM_TELEGRAPH;
          e.slamPos = {x:target.x, y:target.y};
        }
      }
    }
    e.moving = false;
    if(!onScreen && !e.minerSwarm && !midAct){
      // Off-screen: don't chase or attack. Wait until back in view.
      continue;
    }
    // v167: Frosthold axe throwers get angry when cornered -- inside ~90px they drop the
    // throwing kit and chop with melee for a few seconds instead of backing away.
    if(e.type==='fhaxe'){
      if(d < e.r+target.r+90) e.rageT = Math.max(e.rageT||0, 3.5);
      else if(e.rageT>0) e.rageT -= dt;
    }
    if(e.type==='fhaxe' && e.rageT>0){
      const reach = e.r+target.r+2;
      updateStuckTracking(e, dt);
      if(tickEnemyWindup(g, e, target, isFollowerTarget, reach, dt)){
        // mid swing
      } else if(d>reach){
        const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
        e.x += Math.cos(ang)*e.speed*1.1*chillMult*dt; e.y += Math.sin(ang)*e.speed*1.1*chillMult*dt;
        e.moving = true;
      } else if(e.atkCd<=0){
        beginEnemyMelee(e);
      }
    } else if(e.type==='archer' || e.type==='spider' || e.type==='banditarcher' || e.type==='skeletonarcher' || e.type==='goblinarcher' || e.type==='fhaxe' || e.type==='coilsentry' || e.type==='cultist'){
      updateStuckTracking(e, dt);
      if(e.type==='cultist') cultistSummon(g, e, target, d, dt);
      const _sx = e.x, _sy = e.y;
      if(d < e.preferRange-20){
        // (v122) backing away is slower than chasing, so melee can close the gap
        const ang=Math.atan2(e.y-target.y,e.x-target.x);
        e.x += Math.cos(ang)*e.speed*0.55*chillMult*dt; e.y += Math.sin(ang)*e.speed*0.55*chillMult*dt;
        e.moving = true;
      } else if(d > e.preferRange+20 && !(e.type==='spider' && !e.giant && !e.brood && !e.chaser && e.homeX!=null && dist(e,{x:e.homeX,y:e.homeY}) > 80)){   // v486: spiders hold their ground near where they spawned
        const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
        e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt;
        e.moving = true;
      }
      // v272: ranged enemies need a moment of clear sight before the first shot (no instant shots when you round a corner)
      const canSeeT = d < (e.type==='skeletonarcher'?336:420) && enemyLOS(g,e,target);
      if(canSeeT) e.losT = (e.losT||0) + dt; else e.losT = 0;
      // v490: ...and must stand still for a moment before loosing (no shooting on the run)
      e._stillT = (Math.abs(e.x-_sx) + Math.abs(e.y-_sy) > 0.01) ? 0 : (e._stillT||0) + dt;
      if(canSeeT && e.atkCd<=0 && e.losT >= RANGED_AIM_DELAY && e._stillT >= RANGED_STILL_T){
        e.atkCd = e.atkCdMax * (e.type==='skeletonarcher' ? 0.9+Math.random()*0.5 : 1);   // (v245) skeleton archers: -20% range, de-synced volleys
        e.atkAnimT = 0.22;
        const ang=Math.atan2(target.y-e.y,target.x-e.x);
        if(e.type==='spider' && e.giant){
          // v427 cloister weaver: web fan / venom glob / web nova, plus a brood of spiderlings
          e.gN = (e.gN||0)+1; const gm = e.gN%3;
          if(gm===1){ for(let k=-2;k<=2;k++){ const a2 = ang+k*0.26; g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(a2)*200,vy:Math.sin(a2)*200,r:7,dmg:e.dmg*0.7,from:'enemy',life:2.2,color:'#8fd05a',srcEnemy:e,targetRef:target,isWeb:true}); } }
          else if(gm===2){ g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(ang)*230,vy:Math.sin(ang)*230,r:12,dmg:e.dmg*1.5,from:'enemy',life:2.4,color:'#b8ff4a',srcEnemy:e,targetRef:target}); }
          else { for(let k=0;k<10;k++){ const a2 = Math.PI*2*k/10; g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(a2)*170,vy:Math.sin(a2)*170,r:7,dmg:e.dmg*0.6,from:'enemy',life:1.8,color:'#8fd05a',srcEnemy:e,targetRef:target,isWeb:true}); } shakeScreen(g, 2, 0.12); }
          e.broodT = (e.broodT===undefined ? 5 : e.broodT) - 1;
          if(e.broodT<=0){ e.broodT = 5; const br = g.enemies.filter(x=>x.brood && x.hp>0).length; if(br<6) for(let k=0;k<2;k++){ const sp = spawnEnemy(g, 'spider', {x:e.x+rand(-40,40), y:e.y+rand(-40,40)}); if(sp){ sp.brood = true; sp.noReward = true; sp.aggroRange = 700; sp.speed = rand(75,95); sp.atkCdMax = 1.8; } } }
        } else if(e.type==='spider'){
          // a slow-moving web bolt that slows whatever it hits, instead of an arrow
          g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(ang)*190,vy:Math.sin(ang)*190,r:7,dmg:e.dmg,from:'enemy',life:2.2,color:'#8fd05a',srcEnemy:e,targetRef:target,isWeb:true});
        } else if(e.type==='coilsentry'){
          const ec = ({fire:'#ff8a3a', lightning:'#8fd8ff', poison:'#8fe05a', cold:'#bfeaff'})[e.dmgType||'lightning'];
          g.projectiles.push({x:e.x,y:e.y-10,vx:Math.cos(ang)*270,vy:Math.sin(ang)*270,r:7,dmg:e.dmg*1.05,from:'enemy',life:2.2,color:ec,srcEnemy:e,targetRef:target});
        } else if(e.type==='cultist' && inShadowKeep(g)){
          fireDeathBolt(g, e, ang, target, e.dmg);
        } else if(e.type==='cultist'){
          g.projectiles.push({x:e.x,y:e.y-8,vx:Math.cos(ang)*240,vy:Math.sin(ang)*240,r:7,dmg:e.dmg,from:'enemy',life:2.2,color:'#d03040',srcEnemy:e,targetRef:target});
        } else if(e.type==='fhaxe'){
          g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(ang)*230,vy:Math.sin(ang)*230,r:8,dmg:e.dmg*1.15,from:'enemy',life:2.2,color:'#c9d4e0',srcEnemy:e,targetRef:target,isAxe:true,spin:0});
        } else {
          g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(ang)*260,vy:Math.sin(ang)*260,r:6,dmg:e.dmg,from:'enemy',life:2,color:'#d8d8d8',isArrow:true,srcEnemy:e,targetRef:target});
        }
      }
    } else if(e.type==='alligator'){
      // Alligator (Black Marsh): swimmer ambusher -- lurks submerged, telegraphs a lunge lane, snaps in melee.
      const reach = e.r+target.r+2;
      const inW = !!(room.waterAt && room.waterAt(e.x,e.y));
      const sm = (inW?1.6:0.8)*chillMult;
      const obs = room.dryObstacles || room.obstacles;
      updateStuckTracking(e, dt);
      e.sub = inW && d > 130 && e.lungeState==='idle';
      if(e.lungeState==='tele'){
        e.lungeT -= dt; e.moving = false; e.atkAnimT = 0.1; e.sub = false;
        if(e.lungeT<=0){ e.lungeState='lunge'; e.lungeT=0.4; e.lungeHit=false; }
      } else if(e.lungeState==='lunge'){
        e.lungeT -= dt; e.sub = false;
        e.x += Math.cos(e.lungeDir)*400*dt; e.y += Math.sin(e.lungeDir)*400*dt; e.moving = true;
        if(!e.lungeHit && dist(e,target) < e.r+target.r+8){
          e.lungeHit = true;
          const lungeDmg = teleDmg(e, 0.75);   // v456: halved
          if(isFollowerTarget) applyFollowerDamage(g, target, lungeDmg, e);
          else playerDamage(g, lungeDmg, e);
          g.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:'#8fd06a'});
        }
        if(e.lungeT<=0){ e.lungeState='idle'; e.atkCd = e.atkCdMax*0.7; }
      } else {
        e.lungeCd -= dt;
        if(e.lungeCd<=0 && d<320 && d>e.r+target.r+40 && enemyLOS(g,e,target)){
          e.lungeState='tele'; e.lungeT=0.45; e.lungeCd=4+Math.random()*1.5; e.windT=0; e.sub=false;
          e.lungeDir = Math.atan2(target.y-e.y, target.x-e.x);
        } else if(tickEnemyWindup(g, e, target, isFollowerTarget, reach, dt)){
          // mid jaw-snap
        } else if(d>reach){
          const ang = steerAngleTo(e, target.x, target.y, obs);
          e.x += Math.cos(ang)*e.speed*sm*dt; e.y += Math.sin(ang)*e.speed*sm*dt;
          e.moving = true;
        } else if(e.atkCd<=0){
          beginEnemyMelee(e);
        }
      }
    } else if(e.type==='anaconda'){
      // Anaconda (Black Marsh): fast poison swimmer; its bite slows the player (playerDamage).
      const reach = e.r+target.r+2;
      const inW = !!(room.waterAt && room.waterAt(e.x,e.y));
      const sm = (inW?1.3:0.8)*chillMult;
      const obs = room.dryObstacles || room.obstacles;
      updateStuckTracking(e, dt);
      e.sub = inW && d > 110;
      if(tickEnemyWindup(g, e, target, isFollowerTarget, reach, dt)){
        e.sub = false;
      } else if(d>reach){
        const ang = steerAngleTo(e, target.x, target.y, obs);
        e.x += Math.cos(ang)*e.speed*sm*dt; e.y += Math.sin(ang)*e.speed*sm*dt;
        e.moving = true;
      } else if(e.atkCd<=0){
        beginEnemyMelee(e); e.sub = false;
      }
    } else if(e.type==='giantoad'){
      // Giant Toad (Black Marsh): land hopper; telegraphed leap that splashes poison on landing.
      const reach = e.r+target.r+2;
      updateStuckTracking(e, dt);
      if(e.tState==='tele'){
        e.tT -= dt; e.moving = false; e.atkAnimT = 0.1;
        if(e.tT<=0){ e.tState='air'; e.tT=0.38; e.tFrom={x:e.x,y:e.y}; }
      } else if(e.tState==='air'){
        e.tT -= dt;
        const k = 1-clamp(e.tT/0.38,0,1);
        e.x = e.tFrom.x+(e.tPt.x-e.tFrom.x)*k; e.y = e.tFrom.y+(e.tPt.y-e.tFrom.y)*k;
        e.hop = Math.sin(k*Math.PI)*48; e.moving = true;
        if(e.tT<=0){
          e.tState='idle'; e.hop=0; e.atkCd = e.atkCdMax*0.8;
          const R = TOAD_SPLASH_R, dm = teleDmg(e, 1.4);
          if(dist(p,e) < R+p.r) playerDamage(g, dm, e);
          if(g.followers) for(const f of g.followers) if(dist(f,e) < R+f.r) applyFollowerDamage(g, f, dm, e);
          g.particles.push({type:'ring', x:e.x, y:e.y, t:0.45, max:0.45, r:R, color:'#8fe65a'});
          g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#7dd45a'});
        }
      } else {
        e.tCd -= dt;
        if(e.tCd<=0 && d<300 && d>110 && enemyLOS(g,e,target)){
          let tp = {x:target.x, y:target.y};
          if(room.waterAt && room.waterAt(tp.x,tp.y) && room.nearestDry) tp = room.nearestDry(tp.x,tp.y);
          e.tPt = tp; e.tState='tele'; e.tT=0.6; e.tCd=4.5+Math.random()*2; e.windT=0;
        } else if(tickEnemyWindup(g, e, target, isFollowerTarget, reach, dt)){
          // mid tongue-lash
        } else if(d>reach){
          const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
          e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt;
          e.moving = true;
        } else if(e.atkCd<=0){
          beginEnemyMelee(e);
        }
      }
    } else if(e.dwc){
      updateDwConstruct(g, e, dt, target, d, isFollowerTarget, chillMult, room);
    } else if(e.fhCmd){
      if(!e.cEnraged && e.hp < e.maxHp*0.25){ e.cEnraged = true; showMsg('The Commander is enraged!', 2.0, '#ff6a4a'); g.particles.push({type:'ring', x:e.x, y:e.y, t:0.6, max:0.6, r:120, color:'#ff5a3a'}); shakeScreen(g, 5, 0.3); }
      updateFhCommander(g, e, dt*(e.cEnraged ? 2 : 1), target, d, isFollowerTarget, chillMult, room);   // v456: enraged = moves and attacks twice as fast
    } else if(e.type==='fhturret'){
      updateFhTurret(g, e, dt, target, d);
    } else if(e.type==='windigo'){
      updateWindigo(g, e, dt, target, d, isFollowerTarget, chillMult, room);
    } else if(e.type==='lavabeetle'){
      updateLavaBeetle(g, e, dt, target, d, isFollowerTarget, chillMult, room);
    } else if(e.type==='vulture'){
      updateFireBat(g, e, dt, target, d, isFollowerTarget, chillMult, room);
    } else if(e.type==='shadowcultist' || e.type==='cinderfiend'){
      updateCultist(g, e, dt, target, d, isFollowerTarget, chillMult, room);
    } else if(e.type==='harpy' || e.type==='wraithling'){
      updateHarpy(g, e, dt, target, d, isFollowerTarget, chillMult, room);
    } else if(e.type==='harpyqueen'){
      updateHarpyQueen(g, e, dt, target, d, isFollowerTarget, chillMult, room);
    } else if(e.type==='firebat' || e.type==='roc'){
      updateFireBat(g, e, dt, target, d, isFollowerTarget, chillMult, room);
      if(e.type==='roc'){ e.hop = 36 + Math.sin(e.animT*2.6)*7; if(!e._rocR){ e._rocR = true; e.fR = 230 + Math.random()*110; } }
    } else if(e.type==='fhcleric'){
      fhClericAI(g, e, dt, target, d, isFollowerTarget, chillMult, room);
    } else if(e.type==='banditking'){
      updateBanditKing(g, e, dt, target, d, isFollowerTarget, chillMult, room);
    } else if(e.hw){
      hwKnightAI(g, e, dt, target, d, isFollowerTarget, chillMult, room);
    } else if(e.type==='trollelder'){
      updateTrollElder(g, e, dt, target, d, isFollowerTarget, chillMult, room);
    } else if(e.type==='cavetroll' || e.type==='fhtemplar' || e.type==='magmagolem' || e.type==='gearguard' || e.type==='fallengolem' || e.type==='poisonwalker' || e.type==='brimstonebrute' || e.type==='giant' || e.type==='mtroll'){
      // Cave Troll (Abandoned Mine) / Frosthold Champion (same telegraphed smash): plods after you, and every few seconds raises its club for a telegraphed
      // ground smash aimed where you were standing -- step out of the ring before it lands.
      const reach = e.r+target.r+4;
      updateStuckTracking(e, dt);
      if(e.type==='giant' && giantWarcry(g, e, d, dt)){
        // v484: roaring before it charges in
      } else if(e.tState==='tele'){
        e.tT -= dt; e.moving = false; e.atkAnimT = 0.1;
        if(e.tT<=0){
          const R = e.slamR||TROLL_SLAM_R, dm = teleDmg(e, 1.5);
          if(dist(p,e.tPt) < R) playerDamage(g, dm, e);
          if(g.followers) for(const f of g.followers) if(dist(f,e.tPt) < R) applyFollowerDamage(g, f, dm, e);
          g.particles.push({type:'ring', x:e.tPt.x, y:e.tPt.y, t:0.45, max:0.45, r:R, color:'#d9a066'});
          g.particles.push({type:'burst', x:e.tPt.x, y:e.tPt.y, t:0.4, max:0.4, color:'#b8a078'});
          shakeScreen(g, 4, 0.15);
          e.tState='idle'; e.atkCd = e.atkCdMax*0.7; e.tSwingT = 0.3;
        }
      } else {
        e.tCd -= dt; if(e.tSwingT>0) e.tSwingT -= dt;
        if(e.tCd<=0 && d < (e.slamR ? e.slamR+120 : TROLL_SLAM_TRIGGER) && enemyLOS(g,e,target)){
          // v520: the smash lands close to the troll (club reach), not wherever the player happens to stand
          const reachD = e.r + (e.slamR||TROLL_SLAM_R) * 0.6 + 8, k = d>reachD ? reachD/d : 1;
          e.tState='tele'; e.tT=TROLL_SLAM_TELE; e.tCd=4+Math.random()*2; e.tPt={x:e.x+(target.x-e.x)*k,y:e.y+(target.y-e.y)*k}; e.windT=0;
        } else if(tickEnemyWindup(g, e, target, isFollowerTarget, reach, dt)){
          // mid club swing
        } else if(d>reach){
          const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
          e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt;
          e.moving = true;
        } else if(e.atkCd<=0){
          beginEnemyMelee(e);
        }
      }
    } else if(e.type==='armordon'){
      // Reflective Armordon (Redridge): slow armoured brute. Its plates bounce part of each hit back (see
      // applyEnemyArmor); it rears its club tail (telegraphed ring) then whips it round in a full circle.
      if(e.reflectCd>0) e.reflectCd -= dt;
      if(e.reflectFlashT>0) e.reflectFlashT -= dt;
      const reach = e.r+target.r+4;
      updateStuckTracking(e, dt);
      if(e.tState==='tele'){
        e.tT -= dt; e.moving = false; e.atkAnimT = 0.1;
        if(e.tT<=0){ e.tState='swing'; e.tT=0.3; e.tHit=false; }
      } else if(e.tState==='swing'){
        e.tT -= dt; e.moving = false;
        if(!e.tHit){
          e.tHit = true;
          const R = ARMORDON_TAIL_R, dm = teleDmg(e, 1.0);
          if(dist(p,e) < R+p.r) playerDamage(g, dm, e);
          if(g.followers) for(const f of g.followers) if(dist(f,e) < R+f.r) applyFollowerDamage(g, f, dm, e);
          g.particles.push({type:'ring', x:e.x, y:e.y, t:0.45, max:0.45, r:R, color:'#e8a060'});
          g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#d9a066'});
        }
        if(e.tT<=0){ e.tState='idle'; e.atkCd = e.atkCdMax*0.8; }
      } else {
        e.tCd -= dt;
        if(e.tCd<=0 && d < ARMORDON_TAIL_R+target.r-15 && enemyLOS(g,e,target)){
          e.tState='tele'; e.tT=0.75; e.tCd=3.5+Math.random()*1.5; e.windT=0;
        } else if(tickEnemyWindup(g, e, target, isFollowerTarget, reach, dt)){
          // mid head-butt
        } else if(d>reach){
          const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
          e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt;
          e.moving = true;
        } else if(e.atkCd<=0){
          beginEnemyMelee(e);
        }
      }
    } else if(e.type==='crawler'){
      // Canyon crawler: telegraphed tongue lash along a locked lane; a hit drags the victim in for a bite.
      const reach = e.r+target.r+2;
      updateStuckTracking(e, dt);
      if(e.tState==='tele'){
        e.tT -= dt; e.moving = false; e.atkAnimT = 0.1;
        e.facing = {x:Math.cos(e.tDir), y:Math.sin(e.tDir)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y);
        if(e.tT<=0){ e.tState='lash'; e.tT=0.2; e.tHit=false; }
      } else if(e.tState==='lash'){
        e.tT -= dt; e.moving = false; e.atkAnimT = 0.1;
        if(!e.tHit){
          e.tHit = true;
          const ca = Math.cos(e.tDir), sa = Math.sin(e.tDir);
          const victims = [p].concat(g.followers||[]);
          for(const tg of victims){
            if(!(tg.hp>0)) continue;
            const rx = tg.x-e.x, ry = tg.y-e.y, along = rx*ca+ry*sa, perp = Math.abs(-rx*sa+ry*ca);
            if(along>0 && along<CRAWLER_TONGUE_LEN+tg.r && perp<CRAWLER_TONGUE_HW+tg.r*0.5){
              if(tg===p && (p.dodging || p.invuln>0 || p.vanishT>0)) continue;   // rolled clear of the lash
              e.tGrab = tg; break;
            }
          }
          if(e.tGrab){
            const dm = teleDmg(e, 0.6);
            if(e.tGrab===p) playerDamage(g, dm, e); else applyFollowerDamage(g, e.tGrab, dm, e);
            e.tState = 'pull'; e.tT = 0.45;
            g.particles.push({type:'burst', x:e.tGrab.x, y:e.tGrab.y, t:0.25, max:0.25, color:'#e8808a'});
          }
        }
        if(e.tState==='lash' && e.tT<=0){ e.tState='idle'; e.tGrab=null; e.atkCd = Math.max(e.atkCd, 0.5); }
      } else if(e.tState==='pull'){
        e.tT -= dt; e.moving = false; e.atkAnimT = 0.1;
        const tg = e.tGrab;
        if(tg && tg.hp>0){
          const dd = dist(tg,e), stopD = e.r+tg.r+6;
          if(dd>stopD){
            const aa = Math.atan2(e.y-tg.y, e.x-tg.x), step = Math.min(dd-stopD, CRAWLER_PULL_SPEED*dt);
            const nx = tg.x+Math.cos(aa)*step, ny = tg.y+Math.sin(aa)*step;
            if(!posBlockedByObstacles(nx, ny, tg.r, room.obstacles)){ tg.x = nx; tg.y = ny; } else e.tT = 0;
          } else e.tT = 0;
        } else e.tT = 0;
        if(e.tT<=0){ e.tState='idle'; e.tGrab=null; e.atkCd = 0; }
      } else {
        e.tCd -= dt;
        // v490: a pack takes turns -- only one tongue at a time nearby, at most two per pack in a few seconds
        const tongueBusy = ()=>{ let n = 0; const now = g.clock||0; for(const o of g.enemies){ if(o===e || o.type!=='crawler' || !(o.hp>0) || dist(o,e) > 700) continue; if(o.tState==='tele'||o.tState==='lash'||o.tState==='pull') return true; if(now - (o.tLastT||-99) < 4) n++; } return n>=2; };
        if(e.tCd<=0 && d<CRAWLER_TONGUE_LEN-40 && d>e.r+target.r+70 && enemyLOS(g,e,target) && !tongueBusy()){
          e.tDir = Math.atan2(target.y-e.y, target.x-e.x); e.tState='tele'; e.tT=CRAWLER_TONGUE_WIND; e.tCd=rand(7,11); e.windT=0; e.tLastT = g.clock||0;
        } else if(tickEnemyWindup(g, e, target, isFollowerTarget, reach, dt)){
          // mid bite
        } else if(d>reach){
          const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
          e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt;
          e.moving = true;
        } else if(e.atkCd<=0){
          beginEnemyMelee(e);
        }
      }
    } else if(e.type==='raptor'){
      // Jumping Raptor (Redridge): fast pack hunter; telegraphed pounce onto your position, then bites.
      const reach = e.r+target.r+2;
      updateStuckTracking(e, dt);
      if(e.tState==='tele'){
        e.tT -= dt; e.moving = false; e.atkAnimT = 0.1;
        if(e.tT<=0){ e.tState='air'; e.tT=0.3; e.tFrom={x:e.x,y:e.y}; }
      } else if(e.tState==='air'){
        e.tT -= dt;
        const k = 1-clamp(e.tT/0.3,0,1);
        e.x = e.tFrom.x+(e.tPt.x-e.tFrom.x)*k; e.y = e.tFrom.y+(e.tPt.y-e.tFrom.y)*k;
        e.hop = Math.sin(k*Math.PI)*42; e.moving = true;
        if(e.tT<=0){
          e.tState='idle'; e.hop=0; e.atkCd = e.atkCdMax*0.6;
          const R = RAPTOR_LEAP_R, dm = teleDmg(e, 1.3);
          if(dist(p,e) < R+p.r) playerDamage(g, dm, e);
          if(g.followers) for(const f of g.followers) if(dist(f,e) < R+f.r) applyFollowerDamage(g, f, dm, e);
          g.particles.push({type:'ring', x:e.x, y:e.y, t:0.35, max:0.35, r:R, color:'#e8b060'});
          g.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:'#d9a066'});
        }
      } else if(!isFollowerTarget && wolfCircle(g, e, target, d, dt, chillMult, room)){
        e.tCd -= dt;   // v482: raptors circle too
      } else {
        e.tCd -= dt;
        if(e.tCd<=0 && d<RAPTOR_LEAP_RANGE && d>110 && enemyLOS(g,e,target)){
          e.tPt = {x:target.x, y:target.y}; e.tState='tele'; e.tT=RAPTOR_TELE_T; e.tCd=3+Math.random()*2; e.windT=0;   // v490: a longer crouch before the leap
        } else if(tickEnemyWindup(g, e, target, isFollowerTarget, reach, dt)){
          // mid bite
        } else if(d>reach){
          const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
          e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt;
          e.moving = true;
        } else if(e.atkCd<=0){
          beginEnemyMelee(e);
        }
      }
    } else if(e.type==='sandsnake'){
      // Sand Snake (Redridge): fast poison biter that travels half-buried until it is close; bite slows you.
      const reach = e.r+target.r+2;
      updateStuckTracking(e, dt);
      e.burrow = d > 120;
      if(tickEnemyWindup(g, e, target, isFollowerTarget, reach, dt)){
        e.burrow = false;
      } else if(d>reach){
        const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
        e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt;
        e.moving = true;
      } else if(e.atkCd<=0){
        beginEnemyMelee(e); e.burrow = false;
      }
    } else if(e.type==='stormsnake'){
      // Storm Snake (Sunken Depths): fast biter that also spits a slow lightning spark from range.
      const reach = e.r+target.r+2;
      updateStuckTracking(e, dt);
      e.sparkCd -= dt;
      if(e.sparkT>0){
        e.sparkT -= dt; e.moving = false; e.atkAnimT = 0.1;
        if(e.sparkT<=0){
          const ang = Math.atan2(target.y-e.y, target.x-e.x);
          g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(ang)*230,vy:Math.sin(ang)*230,r:8,dmg:e.dmg*0.9,from:'enemy',life:2.2,color:'#8fd8ff',srcEnemy:e,targetRef:target});
        }
      } else if(tickEnemyWindup(g, e, target, isFollowerTarget, reach, dt)){
        // mid bite
      } else if(d>reach){
        if(e.sparkCd<=0 && d>(e.squid?40:150) && d<(e.squid?460:340) && enemyLOS(g,e,target)){ e.sparkT = 0.45; e.sparkCd = (e.squid?2.2:3.5)+Math.random()*2; e.moving = false; }
        else if(e.squid && !e.eel){
          // v456: squids crawl over land too -- quick in the water, slower on the rocks
          const wat = room.waterAt, inW = wat && wat(e.x,e.y);
          const ang = steerAngleTo(e, target.x, target.y, room.dryObstacles || room.obstacles), sp = e.speed*(inW ? 1.6 : 1.0)*chillMult*dt;
          const nx = e.x+Math.cos(ang)*sp, ny = e.y+Math.sin(ang)*sp;
          if(!posBlockedByObstacles(nx, ny, e.r*0.6, room.dryObstacles || room.obstacles) && (!room.floorMask || mineOpenAt(room,nx,ny))){ e.x = nx; e.y = ny; e.moving = true; } else e.moving = false;
        }
        else if(e.eel){
          // v330: water-bound -- glides through the water toward you but never leaves it
          const obs = room.dryObstacles || room.obstacles;
          updateStuckTracking(e, dt);
          const ang = steerAngleTo(e, target.x, target.y, obs), sp = e.speed*1.6*chillMult*dt;
          const nx = e.x+Math.cos(ang)*sp, ny = e.y+Math.sin(ang)*sp, wat = room.waterAt;
          if(!wat || wat(nx,ny)){ e.x = nx; e.y = ny; e.moving = true; }
          else if(wat(nx,e.y)){ e.x = nx; e.moving = true; }
          else if(wat(e.x,ny)){ e.y = ny; e.moving = true; }
          else e.moving = false;
        }
        else { const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
          e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt; e.moving = true; }
      } else if(e.atkCd<=0){
        beginEnemyMelee(e);
      }
    } else if(e.type==='poisonplant'){
      // Poison Plant (Black Marsh): rooted; spits poison balls at range, lashes anyone standing next to it.
      e.moving = false;
      const reach = e.r+target.r+30;
      if(e.spitT>0){
        e.spitT -= dt;
        if(e.spitT<=0){
          const ang = Math.atan2(target.y-e.y, target.x-e.x);
          g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(ang)*200,vy:Math.sin(ang)*200,r:9,dmg:e.dmg,from:'enemy',life:2.2,color:'#7dd45a',srcEnemy:e,targetRef:target,isPoisonBall:true});
        }
      } else if(tickEnemyWindup(g, e, target, isFollowerTarget, reach, dt)){
        // mid vine-lash
      } else if(d<reach){
        if(e.atkCd<=0) beginEnemyMelee(e);
      } else if(d<380 && e.atkCd<=0 && enemyLOS(g,e,target)){
        e.spitT = 0.4; e.atkCd = e.atkCdMax; e.atkAnimT = 0.4;
      }
    } else if(e.type==='boar'){
      // Wild Boars (Withered Crossroads): a fast hit-and-run charger -- see
      // BOAR_CHARGE_* above. Unlike the bear/frozen zombie charges, a
      // landed hit also knocks the target straight back away from the
      // boar (BOAR_KNOCKBACK_DIST) -- see the knockback param threaded
      // through playerDamage()/applyFollowerDamage() below.
      const meleeRangePad = 2;
      updateStuckTracking(e, dt); e._aiT = g.clock||0;
      if(e.boarChargeState==='charging'){
        e.boarChargeT -= dt;
        e.x += Math.cos(e.boarChargeDir)*e.speed*BOAR_CHARGE_SPEED_MULT*dt;
        e.y += Math.sin(e.boarChargeDir)*e.speed*BOAR_CHARGE_SPEED_MULT*dt;
        e.moving = true;
        if(!e.boarChargeHit && dist(e,target) < e.r+target.r+8){
          e.boarChargeHit = true;
          const chargeDmg = teleDmg(e, BOAR_CHARGE_DMG_MULT);
          const kb = null; // knockback removed (buggy)
          if(isFollowerTarget) applyFollowerDamage(g, target, chargeDmg, e);
          else playerDamage(g, chargeDmg, e, kb);
          g.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:'#c9a86a'});
        }
        if(e.boarChargeT<=0){
          e.boarChargeState = 'idle';
          e.atkCd = e.atkCdMax*0.6;
        }
      } else if(e.boarChargeState==='wind'){
        // v192: the boar stops, lowers its head and scrapes the ground; the lane locks when the wind-up starts
        e.boarWindT -= dt; e.moving = false;
        if(e.boarWindT<=0){ e.boarChargeState = 'charging'; e.boarChargeT = BOAR_CHARGE_DUR; e.boarChargeHit = false; e.moving = true; }
      } else {
        e.boarChargeCd -= dt;
        if(e.boarChargeCd<=0 && d < BOAR_CHARGE_RANGE && d > e.r+target.r+meleeRangePad+20 && enemyLOS(g,e,target)){
          e.boarChargeState = 'wind'; e.boarWindT = BOAR_CHARGE_WIND; e.boarChargeHit = false; e.windT = 0;
          e.boarChargeDir = Math.atan2(target.y-e.y, target.x-e.x);
          e.boarChargeCd = BOAR_CHARGE_CD;
          e.moving = false;
          g.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:'#e0b070'});
        } else if(tickEnemyWindup(g, e, target, isFollowerTarget, e.r+target.r+meleeRangePad, dt)){
          // mid wind-up (boar's basic bite) -- resolved inside tickEnemyWindup
        } else if(d>e.r+target.r+meleeRangePad){
          const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
          e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt;
          e.moving = true;
        } else if(e.atkCd<=0){
          beginEnemyMelee(e);
        }
      }
    } else if(e.mastodon){
      updateMastodon(g, e, dt, target, d, isFollowerTarget, chillMult, room);
    } else if(e.type==='bear' || e.type==='ram'){
      // Bears: same melee chase/attack as any other brute-type enemy, plus
      // a periodic burst-dash charge on its own cooldown (see BEAR_CHARGE_*).
      const meleeRangePad = 2 + BEAR_REACH_BONUS;
      updateStuckTracking(e, dt); e._aiT = g.clock||0;
      if(e.chargeState==='charging'){
        e.chargeT -= dt;
        e.x += Math.cos(e.chargeDir)*e.speed*BEAR_CHARGE_SPEED_MULT*(e.type==='ram'?2.1:1)*dt;
        e.y += Math.sin(e.chargeDir)*e.speed*BEAR_CHARGE_SPEED_MULT*(e.type==='ram'?2.1:1)*dt;
        e.moving = true;
        if(!e.chargeHit && dist(e,target) < e.r+target.r+8+BEAR_CHARGE_HIT_BONUS){
          e.chargeHit = true;
          const chargeDmg = teleDmg(e, BEAR_CHARGE_DMG_MULT);
          if(isFollowerTarget) applyFollowerDamage(g, target, chargeDmg, e);
          else playerDamage(g, chargeDmg, e, e.type==='ram' ? {x:Math.cos(e.chargeDir)*85, y:Math.sin(e.chargeDir)*85} : null);   // v459: rams bowl you over
          g.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:'#c98a4a'});
        }
        if(e.chargeT<=0){
          e.chargeState = 'idle';
          e.atkCd = e.atkCdMax*0.6; // brief recovery lock before it can melee-attack again
        }
      } else if(e.chargeState==='wind'){
        // v191: the bear stops and paws the ground; the charge lane is locked at the START of the wind-up, so sidestepping dodges it
        e.chargeWindT -= dt; e.moving = false;
        if(e.chargeWindT<=0){ e.chargeState = 'charging'; e.chargeT = BEAR_CHARGE_DUR; e.chargeHit = false; e.moving = true; }
      } else {
        e.chargeCd -= dt;
        if(e.chargeCd<=0 && d < (e.type==='ram' ? 300 : BEAR_CHARGE_RANGE) && d > e.r+target.r+meleeRangePad+20 && enemyLOS(g,e,target)){   // v490: rams charge from 300, not off screen
          e.chargeState = 'wind'; e.chargeWindT = BEAR_CHARGE_WIND; e.chargeHit = false; e.windT = 0;
          e.chargeDir = Math.atan2(target.y-e.y, target.x-e.x);
          e.chargeCd = BEAR_CHARGE_CD;
          e.moving = false;
          g.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:'#e0b070'});
        } else if(tickEnemyWindup(g, e, target, isFollowerTarget, e.r+target.r+meleeRangePad, dt)){
          // mid wind-up (claw swipe) -- the shared telegraph is drawn in drawEnemyTells
        } else if(e.type==='ram' && !isFollowerTarget && wolfCircle(g, e, target, d, dt, chillMult, room)){
          // v490: rams hold off and circle while a herd-mate is already butting you
        } else if(d>e.r+target.r+meleeRangePad){
          const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
          e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt;
          e.moving = true;
        } else if(e.atkCd<=0){
          beginEnemyMelee(e);
        }
      }
    } else if(e.type==='frozenzombie'){
      // Frozen zombies: a slow shamble most of the time (see the low base
      // speed rolled in spawnEnemy), but on its own cooldown it locks onto
      // the target's current spot and bursts into a fast charge -- same
      // telegraph-free dash-then-recover shape as the bear's charge above,
      // just its own constants (see ZOMBIE_CHARGE_*).
      const meleeRangePad = 2;
      updateStuckTracking(e, dt); e._aiT = g.clock||0;
      if(e.zChargeState==='wind'){
        // v332: the zombie stops and rocks back; the lane is locked at the start of the wind-up so you can sidestep it
        e.zChargeWindT -= dt; e.moving = false; e.atkAnimT = 0.1;
        if(e.zChargeWindT<=0){ e.zChargeState = 'charging'; e.zChargeT = ZOMBIE_CHARGE_DUR; e.zChargeHit = false; e.moving = true; }
      } else if(e.zChargeState==='charging'){
        e.zChargeT -= dt;
        e.x += Math.cos(e.zChargeDir)*e.speed*ZOMBIE_CHARGE_SPEED_MULT*dt;
        e.y += Math.sin(e.zChargeDir)*e.speed*ZOMBIE_CHARGE_SPEED_MULT*dt;
        e.moving = true;
        if(!e.zChargeHit && dist(e,target) < e.r+target.r+8){
          e.zChargeHit = true;
          const chargeDmg = teleDmg(e, ZOMBIE_CHARGE_DMG_MULT);
          if(isFollowerTarget) applyFollowerDamage(g, target, chargeDmg, e);
          else playerDamage(g, chargeDmg, e);
          g.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:'#9fe6f5'});
        }
        if(e.zChargeT<=0){
          e.zChargeState = 'idle';
          e.atkCd = e.atkCdMax*0.6;
        }
      } else {
        e.zChargeCd -= dt;
        if(e.zChargeCd<=0 && d < ZOMBIE_CHARGE_RANGE && d > e.r+target.r+meleeRangePad+20 && enemyLOS(g,e,target)){
          e.zChargeState = 'wind'; e.zChargeWindT = ZOMBIE_CHARGE_WIND; e.zChargeHit = false; e.windT = 0;
          e.zChargeDir = Math.atan2(target.y-e.y, target.x-e.x);
          e.zChargeCd = ZOMBIE_CHARGE_CD;
          e.moving = false;
        } else if(tickEnemyWindup(g, e, target, isFollowerTarget, e.r+target.r+meleeRangePad, dt)){
          // mid wind-up (zombie's basic swing)
        } else if(d>e.r+target.r+meleeRangePad){
          const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
          e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt;
          e.moving = true;
        } else if(e.atkCd<=0){
          beginEnemyMelee(e);
        }
      }
    } else {
      // The boss reads as much bigger than its old hitbox (its visual scale
      // was tuned down separately), so its regular melee attack -- not the
      // separately-gated AoE slam -- gets its own tighter engage range,
      // rather than reusing the generic (slightly padded) melee range that
      // let it looked like it was hitting from too far away.
      const meleeRangePad = e.isBoss ? -8 : 2;
      updateStuckTracking(e, dt);
      if(tickEnemyWindup(g, e, target, isFollowerTarget, e.r+target.r+meleeRangePad, dt)){
        // mid wind-up (generic melee: grunts, skeletons, bosses' basic swing, ...)
      } else if(PACK_CIRCLE[e.type] && !isFollowerTarget && !e.bkCrew && wolfCircle(g, e, target, d, dt, chillMult, room)){
        // v481: pack circling -- holding off while a packmate is already biting
      } else if(d>e.r+target.r+meleeRangePad){
        const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
        e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt;
        e.moving = true;
      } else if(e.atkCd<=0){
        beginEnemyMelee(e);
      }
    }
    e.x = clamp(e.x, e.r, room.w-e.r);
    e.y = clamp(e.y, e.r, room.h-e.r);
    if(!e.flying) pushOutOfObstacles(e, (e.swimmer&&room.dryObstacles||room.obstacles));
  }

  updateFollowersAI(g, dt);

  // enemy separation (light)
  separateEnemies(g.enemies);   // v487: grid-based, same push as before

  if(g.boltFx) updateBoltFx(g, dt);
  if(g.flashT>0) g.flashT = Math.max(0, g.flashT-dt*1.4);
  // remove dead
  // v489 Permafrost shatter: chilled or frozen enemies that die inside the zone burst, hurting their neighbours
  if(p.permaZone) for(let si=0; si<g.enemies.length; si++){ const e = g.enemies[si];
    if(e.hp<=0 && !e._shattered && e.permaT>0 && (e.chillT>0 || e.frozenT>0)){
      e._shattered = true;
      const sd = Math.min((e.maxHp||0)*PERMA_SHATTER_PCT, wpnDmg(p,true)*6);
      for(const o of g.enemies){ if(o!==e && o.hp>0 && dist(o,e) < PERMA_SHATTER_R+o.r){ o.hp -= applyEnemyArmor(p, o, sd, 0, 'cold'); o.hitT = 0.15; coldHit(o, 1); } }
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.35, max:0.35, r:PERMA_SHATTER_R, color:'#bfeaff'}); g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#e6f8ff'});
    } }
  for(const we of g.enemies){ if(we.wraith && we.wrImmune) we.hp = we.wrLockHp; else if(we.wlord && we.wlImmune) we.hp = we.wlLockHp; }   // v225: the shadow form cannot be hurt
  for(let i=g.enemies.length-1;i>=0;i--){
    if(g.enemies[i].hp<=0){
      if(g.enemies[i].wraith) wraithDefeated(g, g.enemies[i]);
      if(g.enemies[i].markT>0 && ((g.player.skills && effectiveRank(g.player,'markedPrey'))||0)>=BASE_MAX_RANK){
        // v267: at max rank the mark jumps to the nearest enemy when its target dies
        const dead = g.enemies[i]; let best = null, bd = MARKED_PREY_JUMP_RANGE;
        for(const o of g.enemies){ if(o===dead || o.hp<=0 || o.markT>0) continue; const dd = dist(o,dead); if(dd<bd){ bd = dd; best = o; } }
        if(best){ best.markT = Math.max(dead.markT, 4); best.markBonus = dead.markBonus; g.particles.push({type:'ring', x:best.x, y:best.y, t:0.4, max:0.4, r:best.r+22, color:'#ff4a4a'}); }
      }
      if(g.enemies[i].markT>0 && ((g.player.skills && effectiveRank(g.player,'markedPrey'))||0)>0){ g.player.huntersMarkCd = 0; g.particles.push({type:'ring', x:g.enemies[i].x, y:g.enemies[i].y, t:0.35, max:0.35, r:40, color:'#ff5a5a'}); }
      if(g.enemies[i].noReward){ g.enemies.splice(i,1); continue; }
      try{ moraleBreak(g, g.enemies[i]); }catch(e){}
      // v62: flag a boss/lair-boss death separately from a full floor
      // clear -- see the portal-spawn reliability fix using g.bossKilled
      // further down in update().
      if(g.enemies[i].isBoss || g.enemies[i].isLairBoss) g.bossKilled = true;
      try{ bossRecipeDrop(g, g.enemies[i]); }catch(err){}   // v464
      { const rk = bossRekillFlag(g.enemies[i]); if(rk && p[rk]) bossRekillRare(g, g.enemies[i]); }
      if(g.enemies[i].bkBoss && g.tower) g.tower.bkDeath = {x:g.enemies[i].x, y:g.enemies[i].y};   // v490: the Bandit King's chest and portal appear where he fell   // v489: re-killed bosses drop a rare instead of their quest item
      if(g.enemies[i].mastodon && !g.enemies[i].brBoss) huntBossKilled('hunt_mastodon');
      if(g.enemies[i].minotaur && !g.enemies[i].brBoss) huntBossKilled('hunt_minotaur');
      if(g.enemies[i].defiler) defilerSlain(g, g.enemies[i]);
      if(!g.enemies[i].brBoss){ if(g.enemies[i].kraken) huntBossKilled('hunt_kraken'); else if(g.enemies[i].lvBoss) huntBossKilled('hunt_leviathan'); }
      if(g.enemies[i].lr){ bossMsg('The Flame Raptor is slain','Its fire dies in the den', 3.4); }
      if(g.enemies[i].gj && !g.enemies[i].brBoss) gojiraSlain(g.enemies[i]);
      if(g.enemies[i].harpyQueen) harpyQueenSlain(g, g.enemies[i]);
      if(g.enemies[i].wlord && !g.enemies[i].brBoss) wraithLordSlain(g, g.enemies[i]);
      if(g.enemies[i].dboss) demonBossSlain(g, g.enemies[i]);
      if(g.enemies[i].balrog && g.enemies[i].brBoss) demonBossSlain(g, g.enemies[i]);
      if(g.enemies[i].prot) protectorKilled();
      try{ achOnKill(g, g.enemies[i]); }catch(err){}
      if(g.enemies[i].campEnemy) bridgeCampKilled(g.enemies[i]);
      if(g.enemies[i].roadEv) try{ roadEvKilled(g, g.enemies[i]); }catch(err){}
      if(g.enemies[i].fhCmd && !g.enemies[i].brBoss) fhCommanderSlain(g, g.enemies[i]);
      if(g.enemies[i].brBoss && !g.enemies[i].dboss && !g.enemies[i].balrog){ for(const x of g.enemies) if(x.fhTurret || x.cAdd){ x.hp = 0; x.noReward = true; } demonBossSlain(g, g.enemies[i]); }
      if(g.enemies[i].dwc) dwConstructSlain(g, g.enemies[i]);
      if(g.enemies[i].colossus) colossusSlain(g.enemies[i]);
      if(g.enemies[i].type==='magmagolem') golemDeath(g, g.enemies[i]);
      if(g.enemies[i].type==='poisonwalker') walkerDeath(g, g.enemies[i]);
      if(g.enemies[i].sapMarked && !g.enemies[i].soulTaken){ g.enemies[i].soulTaken = true; p.souls = Math.min(SOUL_CAP, (p.souls||0) + SOUL_SAP_SOULS_PER_KILL); checkDemonBindThreshold(g); }
      if(g.enemies[i].deathNova) specialDeathNova(g, g.enemies[i]);
      if(isGlobeBoss(g.enemies[i]) && !g.enemies[i]._globeDead){ g.enemies[i]._globeDead = true; dropGlobes(g, g.enemies[i], 2); }
      if(g.enemies[i].ftMapCarrier && !p.ftMapFound){ p.ftMapFound = true; showMsg('Forgotten Tower map found \u2014 every floor is now charted', 3.4, '#e8c44a'); saveGame(); }   // v490
      if(g.enemies[i].hwMapCarrier && !p.hwMapFound){ p.hwMapFound = true; showMsg('Highward map found — every floor is now charted', 3.4, '#e8c44a'); saveGame(); }
      if(g.enemies[i].mapBrute && room.subzone==='keep'){ p.keepMaps = p.keepMaps || {}; if(!p.keepMaps[room.kpArea]){ p.keepMaps[room.kpArea] = true; showMsg('Floor map found \u2014 this floor is now charted', 3.4, '#e8c44a'); saveGame(); } }
      if((room.floorRects || room.maze) && room.subzone!=='highward' && !room.mapFound && g.enemies[i].mapCarrier){ room.mapFound = true; showMsg('Dungeon map found', 2.8, '#e8c44a'); }
      { const dp = (g.enemies[i].swimmer && room.nearestDry) ? room.nearestDry(g.enemies[i].x, g.enemies[i].y) : g.enemies[i];
        dropLoot(g, dp.x, dp.y, g.enemies[i].type, g.enemies[i].isLairBoss, g.enemies[i]);
        partsMaybeDrop(g, g.enemies[i]);
        if(uq(g.player,'uq_crater')){ g.player.apexStacks = Math.min(5,(g.player.apexStacks||0)+1); g.player.apexT = 6; } }
      { const ml0 = g.enemies[i].ml || g.depth; gainXp(g, Math.max(1, Math.round(xpForKill(ml0, !!(g.enemies[i].isBoss||g.enemies[i].isLairBoss)) * (g.enemies[i].elite ? XP_ELITE_MULT : g.enemies[i].magic ? XP_MAGIC_MULT : 1) * (g.enemies[i].xpMul||1) * ((g.enemies[i].isBoss||g.enemies[i].isLairBoss) ? 1 : (g.enemies[i].hpXp||1)) * xpLevelMult(g.player.level, ml0)))); }
      if(g.player.cls==='mystic') gainResource(g.player, g.player.maxMp*MANA_ON_KILL_PCT);
      if(g.player.lifeOnKill>0 && g.player.hp>0) g.player.hp = Math.min(g.player.maxHp, g.player.hp + g.player.lifeOnKill*(1+g.player.level*0.1));
      if(g.player.manaOnKill>0) gainResource(g.player, g.player.manaOnKill*(1+g.player.level*0.1));
      if(g.player.lifeOnKillPct>0 && g.player.hp>0) g.player.hp = Math.min(g.player.maxHp, g.player.hp + g.player.maxHp*g.player.lifeOnKillPct/100);
      if(g.player.manaOnKillPct>0) gainResource(g.player, (g.player.maxMp||0)*g.player.manaOnKillPct/100);
      g.particles.push({type:'burst', x:g.enemies[i].x, y:g.enemies[i].y, t:0.3, max:0.3, color:g.enemies[i].color});
      // Combat feel (v104): kills land with a tiny freeze + shake -- bigger for bosses.
      const bigKill = !!(g.enemies[i].isBoss || g.enemies[i].isLairBoss);
      hitStop(g, bigKill ? 0.12 : 0.04);
      shakeScreen(g, bigKill ? 8 : 2.5, bigKill ? 0.3 : 0.12);
      // Remember where the LAST enemy on this floor died -- the portal down
      // spawns near here once the floor clears, instead of always at the
      // far end of the map in the dedicated exit room.
      g.lastKillPos = {x:g.enemies[i].x, y:g.enemies[i].y};
      // Assault (Berserker, v55): every kill landed while the rage buff is
      // up extends its remaining time (and its ramp denominator alongside
      // it -- see ASSAULT_KILL_EXTEND_* above for why both move together).
      if(g.player.assaultT>0){
        const aRank = effectiveRank(g.player,'assault')||0;
        if(aRank>0){
          const ext = assaultKillExtend(aRank);
          g.player.assaultT += ext;
          g.player.assaultDurMax += ext;
        }
      }
      if(rk266(g.player,'rampage')>0){ g.player.rampageStacks = Math.min(RAMPAGE_MAX, (g.player.rampageStacks||0)+1); g.player.rampageT = RAMPAGE_WINDOW; }
      if(g.player.assaultT>0 && g.player.assaultCd>0) g.player.assaultCd = Math.max(0, g.player.assaultCd - ASSAULT_KILL_CDR);
      if(g.player.cls==='warrior'){
        const ke = g.enemies[i], big = ke.isBoss || ke.isLairBoss || ke.elite;
        g.player.hp = Math.min(g.player.maxHp, g.player.hp + g.player.maxHp*(big ? WARRIOR_BIG_KILL_HEAL : WARRIOR_KILL_HEAL));
      }
      g.enemies.splice(i,1);
    }
  }

  // projectiles
  for(let i=g.projectiles.length-1;i>=0;i--){
    const pr = g.projectiles[i];
    pr.x+=pr.vx*dt; pr.y+=pr.vy*dt; pr.life-=dt;
    let dead = pr.life<=0 || pr.x<0||pr.y<0||pr.x>room.w||pr.y>room.h;
    for(const o of room.obstacles){
      // Lakeside Ruins' water rects (o.isWater) block foot movement (see
      // pushOutOfRect below) but NOT projectiles -- an arrow/spell bolt
      // (or a Leviathan's own poison ball) skips right over water the same
      // way it would over any other non-solid ground, which is what lets
      // a Leviathan sitting in the water be damaged by ranged attacks at
      // all despite being unreachable on foot.
      if(o.isWater || o.isProp) continue;
      if(circleRectCollide(pr.x,pr.y,pr.r,o.x,o.y,o.w,o.h)){ dead=true; break; }
    }
    if(dead && pr.isFrozenOrb && !pr.burst){ pr.burst = true; frozenOrbExplode(g, p, pr); }
    if(!dead){
      if(pr.isFrozenOrb){ frozenOrbTick(g, p, pr, dt); }
      else if(pr.isSoulOrb){
        // Soul Sap's soul-orb visual (v99 fix): purely cosmetic -- flies
        // from the just-killed enemy back to the player, deals no damage
        // and never collides with enemies/the player's hurtbox, so it
        // can't be mistaken for an incoming attack. Just fades out once it
        // reaches the player (or its short life runs out).
        // (v106) homes in on the player, like Shield Throw's return leg, so a
        // moving caster still gets the orb back.
        const oa = Math.atan2(p.y-pr.y, p.x-pr.x), os = Math.hypot(pr.vx,pr.vy) || SOUL_ORB_SPEED;
        pr.vx = Math.cos(oa)*os; pr.vy = Math.sin(oa)*os;
        if(dist(pr,p) < pr.r+p.r) dead = true;
      } else if(pr.isSoulFire){
        for(const e of g.enemies){ if(e.hp>0 && dist(pr,e) < pr.r+e.r){ dead = true; break; } }
      } else if(pr.isTornado){
        // Tornado (v103 rework): pierces every enemy in its path instead
        // of dying on the first hit (dead is never set true here, so the
        // normal life/bounds/obstacle checks above are the only things
        // that end it), and deals tick damage on a fixed interval to
        // every enemy it's currently overlapping -- same "duration +
        // repeating tick" shape Hurricane's own AoE uses (see
        // HURRICANE_TICK_INTERVAL), just centered on the moving
        // projectile instead of on the player, so it can tick multiple
        // enemies at once and keep ticking the same enemies as long as
        // it's still overlapping them while it travels through.
        // v454: per-enemy timer -- an enemy is hit when the funnel reaches it, then every TORNADO_HIT_GAP while
        // it stays inside, up to TORNADO_HITS_PER_ENEMY times per tornado (a full pass lands all 3).
        if(!pr.tHits) pr.tHits = new Map();
        for(const e of g.enemies){
          if(!(e.hp>0)) continue;
          let rec = pr.tHits.get(e);
          if(rec && rec.cd>0) rec.cd -= dt;
          if(dist(pr,e) >= (pr.hitR||pr.r)+e.r) continue;
          if(!rec){ rec = {n:0, cd:0}; pr.tHits.set(e, rec); }
          if(rec.cd>0) continue;
          rec.n++; rec.cd = TORNADO_HIT_GAP;
          e.hp -= applyEnemyArmor(p, e, pr.dmg); e.hitT = 0.15;
          if(pr.staticCharge) lightningCharge(g, e, 0, 'enemy');
          g.particles.push({type:'burst', x:e.x, y:e.y, t:0.22, max:0.22, color:'#dfeef2'});
          checkExecute(g, e);
        }
      } else if(pr.from==='player'){
        for(const e of g.enemies){
          // A chained Lightning Arc bolt is spawned AT the position of the
          // enemy that just got hit (see the isLightningArc branch below),
          // so without this guard it would immediately re-collide with
          // that same still-alive enemy (distance 0) before ever reaching
          // its actual next target -- skip anything this same bolt (or an
          // earlier hop of it) already hit.
          if((pr.isLightningArc||pr.isDeathBolt) && pr.hitIds && pr.hitIds.indexOf(e)>=0) continue;
          if(pr.pierceHit && pr.pierceHit.indexOf(e)>=0) continue;
          if(dist(pr,e) < pr.r+e.r){
            // Rapid Shot (v79 rework): the 3rd/final arrow of a burst gets
            // a rank-scaled armor-pen bonus ONLY if the same enemy already
            // took both of the burst's first 2 arrows -- checked BEFORE
            // this hit's own hitsOnTarget increment below, so "2 prior
            // hits on this exact target" is required, not "3 total".
            let rsExtraPen = 0;
            if(pr.isRapidShot && pr.rsBurst && pr.rsBurst.target===e && pr.rsArrowIdx===RAPID_SHOT_COUNT && (pr.rsBurst.hitsOnTarget||0)>=RAPID_SHOT_COUNT-1){
              rsExtraPen = RAPID_SHOT_ARMORPEN_PER_RANK * (pr.rsBurst.rank||0);
            }
            lastHitCrit = !!pr.crit;
            if(pr.isArrow && !pr.isArcaneBolt && !pr.spell && !pr.isDeathBolt) e._arrowT = g.clock||0;   // v456: arrow-hit sound
            e.hp-=applyEnemyArmor(p, e, pr.isArrow ? pr.dmg*longshotMult(p,e) : pr.dmg, rsExtraPen, projElement(pr)); e.hitT=0.15;
            if(pr.isExplosiveShot){ explosiveShotBlast(g, p, pr, e.x, e.y); }   // v455
            if(pr.isSplinter){ if(Math.random() < splinterBleedChance(p)){ addBleed(e, pr.dmg*BLEED_DPS_PCT*partBleedMult(), 'splinter', BLEED_DUR); } if(!pr.isSplit) splinterBurst(g, p, pr, e); }   // v454 Splinter Shot
            if(pr.pierceLeft>0){ pr.pierceLeft--; (pr.pierceHit||(pr.pierceHit=[])).push(e); if(!pr.pierceNoFall) pr.dmg*=AIMED_SHOT_FALLOFF; } else if(quiverPierce(p, pr)){ (pr.pierceHit||(pr.pierceHit=[])).push(e); } else dead=true;   // v499 Phantom Quiver
            lastHitCrit = false;
            if(pr.isRapidShot && pr.rsBurst && pr.rsBurst.target===e) pr.rsBurst.hitsOnTarget = (pr.rsBurst.hitsOnTarget||0)+1;
            g.particles.push({type:'burst', x:e.x, y:e.y, t:0.22, max:0.22, color:pr.crit?'#ffe27a':(pr.isArcaneBolt?'#c89bff':pr.spell==='fire'?'#ff7a3d':pr.spell==='ice'?'#7ad0ff':pr.spell==='lightning'?'#e6e35a':pr.isLightningArc?'#e6e35a':pr.isFireball?'#ff7a3d':pr.isIceBolt?'#7ad0ff':pr.isSoulSap?'#a06ad0':'#e8c44a')});
            if(pr.spell==='fire'){ e.burnT = Math.max(e.burnT||0, FIRE_DOT_DUR); e.burnDps = Math.max(e.burnDps||0, pr.dmg*FIRE_DOT_PCT); }
            else if(pr.spell==='ice'){ e.chillT = Math.max(e.chillT||0, ICE_CHILL_DUR); }
            else if(pr.spell==='lightning'){ /* v456: lightning adds a Charge (via applyEnemyArmor), no stun */ }
            else if(pr.isCripplingShot){ addBleed(e, pr.dmg*(pr.bleedPct||0), 'crippling', CRIPPLING_SHOT_BLEED_DUR); }
            else if(pr.isStunShot){ if(Math.random() < (pr.stunChance!=null ? pr.stunChance : 1) && !(e.stunT>0)){ e.stunT = Math.max(e.stunT||0, pr.stunDur||0); g.particles.push({type:'ring', x:e.x, y:e.y, t:0.3, max:0.3, r:e.r+16, color:'#f0d078'}); showMsg('Stunned!', 0.4); } }
            else if(pr.isLightningArc){
              // Lightning Chain (Djinn, v75): jump to the nearest enemy
              // that hasn't already been hit by this same bolt (pr.hitIds),
              // within LIGHTNING_CHAIN_RANGE of the enemy just struck, as
              // long as chainsLeft (set from the Lightning Chain rank) is
              // still > 0. Each hop is a brand-new projectile spawned from
              // the just-hit enemy's position, carrying one fewer chain
              // and LIGHTNING_CHAIN_DMG_MULT less damage than the hop that
              // spawned it (see the const's comment for why).
              // (v106) Lightning Arc is now an instant bolt cast (see the
              // wantLightningArc block) and no longer stuns; this projectile
              // branch is legacy and no longer spawned.
              if(pr.chainsLeft>0){
                const hitSoFar = (pr.hitIds||[]).concat([e]);
                const nextTarget = nearestEnemy(g, e, LIGHTNING_CHAIN_RANGE, hitSoFar);
                if(nextTarget){
                  const cAng = Math.atan2(nextTarget.y-e.y, nextTarget.x-e.x);
                  g.projectiles.push({x:e.x, y:e.y, vx:Math.cos(cAng)*STAFF_BOLT_SPEED, vy:Math.sin(cAng)*STAFF_BOLT_SPEED,
                    r:6, dmg:pr.dmg*LIGHTNING_CHAIN_DMG_MULT, from:'player', life:1.4, color:STAFF_SPELL_INFO.lightning.color,
                    crit:pr.crit, isLightningArc:true, chainsLeft:pr.chainsLeft-1, hitIds:hitSoFar});
                }
              }
            }
            else if(pr.isDeathBolt){
              // Death Bolt (v268): bounce to the nearest enemy not yet hit, a little weaker each time; life steal when cast at <=50% life
              const dbHit = (pr.hitIds||[]).concat([e]);
              if(!(pr.hitIds && pr.hitIds.length) && p.cls==='mystic') gainResource(p, p.maxMp*MANA_ON_HIT_PCT.deathBolt);
              if(pr.lifeSteal>0){ const heal = pr.dmg*pr.lifeSteal; p.hp = Math.min(p.maxHp, p.hp + heal); g.particles.push({type:'burst', x:p.x, y:p.y, t:0.25, max:0.25, color:'#d03a78'}); }
              g.particles.push({type:'burst', x:e.x, y:e.y, t:0.25, max:0.25, color:pr.color});
              if(pr.bouncesLeft>0){
                const nx = nearestEnemy(g, e, DEATHBOLT_BOUNCE_RANGE, dbHit);
                if(nx){
                  const bAng = Math.atan2(nx.y-e.y, nx.x-e.x);
                  g.projectiles.push({x:e.x, y:e.y, vx:Math.cos(bAng)*STAFF_BOLT_SPEED, vy:Math.sin(bAng)*STAFF_BOLT_SPEED, r:7, dmg:pr.dmg*DEATHBOLT_BOUNCE_MULT,
                    from:'player', life:1.0, color:pr.color, isArrow:true, crit:pr.crit, isDeathBolt:true, bouncesLeft:pr.bouncesLeft-1, lifeSteal:pr.lifeSteal, hitIds:dbHit});
                }
              }
            }
            else if(pr.isSoulSap){
              // Soul Sap (v99 fix): souls are collected on a KILL only --
              // not on every connecting hit, and not more than 1 per kill
              // (e.hp<=0 here means THIS hit is what finished the enemy off;
              // the actual removal/loot/xp happens in the separate "remove
              // dead" sweep elsewhere in update(), this just detects it a
              // frame early to award the soul at the moment of the kill).
              // Immediately checks whether that just pushed the player's
              // souls across the Demon Bind threshold -- see
              // checkDemonBindThreshold's own comment -- and spawns the
              // white soul-orb visual flying from the dead enemy back to
              // the player (isSoulOrb, handled separately in the
              // projectile-movement loop above and in drawProjectilesIso).
              if(e.hp<=0){
                p.souls = Math.min(SOUL_CAP, (p.souls||0) + SOUL_SAP_SOULS_PER_KILL);
                checkDemonBindThreshold(g);
                const orbAng = Math.atan2(p.y-e.y, p.x-e.x);
                g.projectiles.push({x:e.x, y:e.y, vx:Math.cos(orbAng)*SOUL_ORB_SPEED, vy:Math.sin(orbAng)*SOUL_ORB_SPEED,
                  r:5, dmg:0, from:'player', life:1.2, color:'#ffffff', isSoulOrb:true});
              }
            }
            else if(pr.isOrbBolt){ e.chillT = Math.max(e.chillT||0, ICE_CHILL_DUR); }   // v499: Frozen Orb bolts only chill
            else if(pr.isFireball || pr.isIceBolt){
              g.particles.push({type:pr.isFireball?'fireImpact':'iceImpact', x:e.x, y:e.y, t:0.42, max:0.42, seed:Math.random()});
              if(pr.manaReward && p.cls==='mystic') gainResource(p, p.maxMp*(MANA_ON_HIT_PCT[pr.manaReward]||0));
              // Elemental Polarity (Elementalist, v76): the direct hit
              // always applies its own elemental ailment to the primary
              // target -- Burn (new e.burnT/burnDps field) for Fireball,
              // Chill (reused e.chillT) for Ice Bolt, per this skill's own
              // comment above.
              if(pr.isFireball){ if(Math.random() < fireballBurnChance(p, e)){ e.burnT = Math.max(e.burnT||0, FIRE_DOT_DUR); e.burnDps = Math.max(e.burnDps||0, pr.dmg*BURN_DPS_PCT); } }
              else { e.chillT = Math.max(e.chillT||0, ICE_CHILL_DUR); coldHit(e, 1); }
              if(pr.isFireball && p.immolateT>0){   // v269 Immolate: fireballs explode on impact
                const exR = IMMOLATE_EXPLODE_R*aoeRadiusMult(p);
                for(const e2 of g.enemies){
                  if(e2===e || !(e2.hp>0)) continue;
                  if(dist(e,e2) < exR+e2.r){
                    const xd = pr.dmg*IMMOLATE_EXPLODE_PCT;
                    e2.hp -= applyEnemyArmor(p, e2, xd, 0, 'fire'); e2.hitT = 0.15;
                    e2.burnT = Math.max(e2.burnT||0, FIRE_DOT_DUR); e2.burnDps = Math.max(e2.burnDps||0, xd*BURN_DPS_PCT);
                    checkExecute(g, e2);
                  }
                }
                g.particles.push({type:'ring', x:e.x, y:e.y, t:0.3, max:0.3, r:exR, color:'#ffb040'});
                g.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:'#ff5a1a'});
              }
              if(elemMasteryRank(p) >= EM_BLAST_RANK){   // v481 Elemental Mastery rank 5+: fireballs and ice bolts burst on impact
                const bR = EM_BLAST_R*aoeRadiusMult(p), bd = pr.dmg*emBlastPct(elemMasteryRank(p)), el = pr.isFireball ? 'fire' : 'cold';
                for(const e2 of g.enemies){
                  if(e2===e || !(e2.hp>0)) continue;
                  if(dist(e,e2) < bR+e2.r){
                    e2.hp -= applyEnemyArmor(p, e2, bd, 0, el); e2.hitT = 0.15;
                    if(pr.isFireball){ e2.burnT = Math.max(e2.burnT||0, FIRE_DOT_DUR*0.5); e2.burnDps = Math.max(e2.burnDps||0, bd*BURN_DPS_PCT); }
                    else { e2.chillT = Math.max(e2.chillT||0, ICE_CHILL_DUR); }
                    checkExecute(g, e2);
                  }
                }
                g.particles.push({type:'ring', x:e.x, y:e.y, t:0.32, max:0.32, r:bR, color:pr.isFireball?'#ff9a4a':'#9adfff'});
                g.particles.push({type:pr.isFireball?'fireImpact':'iceImpact', x:e.x, y:e.y, t:0.5, max:0.5, seed:Math.random()});
              }
              // Elemental Explosions (node 2, v76): once ranked, splash a
              // fixed % of the hit's damage onto OTHER nearby enemies, with
              // a rank-scaling % chance to also apply the matching ailment
              // to each one splashed -- see elementalExplosionAilmentChance.
              const eeRank = (p.skills && effectiveRank(p,'elementalExplosions')) || 0;
              if(eeRank>0){
                const ailChance = elementalExplosionAilmentChance(eeRank);
                const splashDmg = pr.dmg*ELEMENTAL_EXPLOSION_SPLASH_PCT;
                for(const e2 of g.enemies){
                  if(e2===e) continue;
                  if(dist(e,e2) < ELEMENTAL_EXPLOSION_RADIUS+e2.r){
                    e2.hp -= applyEnemyArmor(p, e2, splashDmg, 0, projElement(pr)); e2.hitT = 0.15;
                    if(Math.random()<ailChance){
                      if(pr.isFireball){ e2.burnT = Math.max(e2.burnT||0, FIRE_DOT_DUR); e2.burnDps = Math.max(e2.burnDps||0, splashDmg*BURN_DPS_PCT); }
                      else { e2.chillT = Math.max(e2.chillT||0, ICE_CHILL_DUR); }
                    }
                    checkExecute(g, e2);
                  }
                }
                g.particles.push({type:'ring', x:e.x, y:e.y, t:0.25, max:0.25, r:ELEMENTAL_EXPLOSION_RADIUS, color:pr.isFireball?'#ff7a3d':'#7ad0ff'});
              }
            }
            checkExecute(g, e);
            if(dead) break;
          }
        }
      } else {
        const tgt = pr.targetRef || p;
        if(pr.homing && tgt.hp>0){ const ha = Math.atan2(tgt.y-pr.y, tgt.x-pr.x), hs = Math.hypot(pr.vx,pr.vy); pr.vx = Math.cos(ha)*hs; pr.vy = Math.sin(ha)*hs; }
        if(pr.isDeathBolt && Math.random()<0.4) g.particles.push({type:'dbWisp', x:pr.x+rand(-4,4), y:pr.y+rand(-4,4), t:0.35, max:0.35});
        if(dist(pr,tgt) < pr.r+tgt.r){
          if(pr.isDeathBolt){ deathBoltLeap(g, pr, tgt); g.particles.push({type:'burst', x:tgt.x, y:tgt.y, t:0.25, max:0.25, color:'#6a1a8a'}); }
          if(tgt===p){
            playerDamage(g,pr.dmg,pr.srcEnemy,null,true);
            // v83 Slippery (boots prefix, cannot be slowed): gates the
            // player's one existing slow effect (spider-web webSlowT).
            if(pr.isWeb && !p.slowImmune) p.webSlowT = 1.6; // webbed: movement speed cut for a moment
          }
          else applyFollowerDamage(g, tgt, pr.dmg, pr.srcEnemy);
          dead=true;
        }
      }
    }
    if(dead && pr.isSoulFire && !pr.burst){ pr.burst = true; soulFireExplode(g, p, pr); }
    if(dead) g.projectiles.splice(i,1);
  }

  try{ owPoiTick(g, p, dt); }catch(err){}   // v525 overworld caches / shrines / hoards
  try{ roadEvTick(g, p, dt); }catch(err){}   // v529 road encounters
  // loot pickup
  try{ bossGlobeTick(g); }catch(err){}
  lootHoverName(g, p);
  for(let i=g.loot.length-1;i>=0;i--){
    const l = g.loot[i];
    if(l.dropGrace>0){ l.dropGrace-=dt; continue; }
    if(lootIsManual(l)) continue;
    if(dist(l,p) < l.r+p.r+6){
      if(l.type==='potion'){ p.hp = Math.min(p.maxHp, p.hp+p.maxHp*0.3); showMsg('+Health', 0.6); g.loot.splice(i,1); }
      else if(l.type==='gold'){ p.gold += l.amt; goldPop(g, l.x, l.y, l.amt); g.loot.splice(i,1); }
      else if(l.type==='item'){
        if(addToBag(p, l.item)){
          const eq = tryAutoEquip(p, l.item);
          showMsg(eq ? 'Equipped: '+l.item.name : l.item.name, 1.5);
          bagPulse(); g.loot.splice(i,1);
        }
        else { if(!(p._fullMsgT>0)){ showMsg(fullMsgFor(l.item), 1.0); p._fullMsgT = 1.2; } } // leave it on the ground until there's room
      }
      else g.loot.splice(i,1);
    }
  }

  // v453: a mapped floor with no big monster (e.g. deeper Frosthold Dungeon floors) marks its two toughest monsters as map carriers
  if(g.room && g.room.floorRects && !g.room.mapFound && !g.room._mcChecked && g.room.subzone!=='highward' && g.enemies.length){
    g.room._mcChecked = true;
    try{ placeMapHolder(g); }catch(err){}   // v474
    if(!g.room.deep && !(g.tower && g.tower.deep) && !g.enemies.some(e=>e.hp>0 && e.mapCarrier)){ g.enemies.filter(e=>e.hp>0 && !e.isGuard && !e.isBoss && !e.isLairBoss).sort((a,b)=>(b.maxHp||0)-(a.maxHp||0)).slice(0,1).forEach(e=>{ e.mapCarrier = true; e.mapHolder = true; }); }
  }
  // particles
  for(let i=g.particles.length-1;i>=0;i--){
    g.particles[i].t-=dt;
    if(g.particles[i].t<=0) g.particles.splice(i,1);
  }
  // v487: in a huge fight the oldest sparks/rings go first once there are too many (Low quality keeps fewer)
  { const cap = gfxLevel===0 ? 220 : 450;
    if(g.particles.length > cap){ let over = g.particles.length - cap; g.particles = g.particles.filter(pt=>{ if(over>0 && (pt.type==='burst' || pt.type==='ring')){ over--; return false; } return true; }); } }

  if(g.scene==='forest'){
    // Forest: not floor-based, so no portal/chest -- a standing population
    // of monsters and two fixed gates (back to Town, onward to the Mine)
    // you walk up to and interact with. v62: the population no longer
    // respawns on a standing timer while the player stays in the zone --
    // it's fully re-seeded by enterForest() only on zone entry now, so
    // clearing it out means it stays cleared until you leave and come back.
    updatePortalChoice(false);
    const nearTownGate = dist(p, g.forest.townGate) < g.forest.townGate.r + p.r + 22;
    const nearMountainGate = false;
    const nearSpiderLairGate = dist(p, g.forest.spiderLairGate) < g.forest.spiderLairGate.r + p.r + 22;
    const nearBearCaveGate = dist(p, g.forest.bearCaveGate) < g.forest.bearCaveGate.r + p.r + 22;
    const nearSunGate = dist(p, g.forest.sunGate) < g.forest.sunGate.r + p.r + 22;
    updateInteractPrompt(nearTownGate ? 'toTown' : nearMountainGate ? 'toMountainPass' : nearSpiderLairGate ? 'toSpiderLair' : nearBearCaveGate ? 'toBearCave' : nearSunGate ? 'toRiverValley' : null);
    if(forestCheckHunters(g)) updateInteractPrompt('rescueHunter');
    // Town Guard NPCs (Sept 2026 patch): stationed at the Forest's own
    // townGate -- see makeTownGuards()/updateTownGuards()'s own comments.
    updateTownGuards(g, dt);
  } else if(g.scene==='mountainpass' && g.mtn && g.mtn.isCliff){
    updateCliffside(g, dt);
  } else if(g.scene==='mountainpass'){
    // Mountain Pass: same open-zone shape as the Forest -- no portal/chest,
    // two edge gates (back to the Forest, onward into the Mountain Depths).
    // v62: same change as the Forest above -- population is only re-seeded
    // on zone entry (enterMountainPass()), no more standing respawn timer.
    updatePortalChoice(false);
    crEnforce(g, p);
    const nearForestGate = dist(p, g.mtn.forestGate) < g.mtn.forestGate.r + p.r + 22;
    const nearMineGate = dist(p, g.mtn.mineGate) < g.mtn.mineGate.r + p.r + 22;
    const nearMtnWaypoint = dist(p, g.mtn.waypoint) < g.mtn.waypoint.r + p.r + 24;
    const nearSummitGate = dist(p, g.mtn.summitGate) < g.mtn.summitGate.r + p.r + 22;
    const nearFrostGate = dist(p, g.mtn.frostGate) < g.mtn.frostGate.r + p.r + 22;
    updateInteractPrompt(nearForestGate ? 'toForestFromMountain' : nearMineGate ? 'toMountainDepths' : nearFrostGate ? (snowWallOpen(p) ? 'toFrosthold' : 'snowWall') : nearSummitGate ? 'toIcySummit' : nearMtnWaypoint ? 'waypointMtn' : null);
  } else if(g.scene==='redridge'){
    updatePortalChoice(false);
    const rr = g.rr;
    crEnforce(g, p);
    let rrKind = null;
    for(const gt of rr.gates){ if(dist(p, gt) < gt.r + p.r + 22){ rrKind = gt.act; break; } }
    if(rrKind==='redridgeEastSealed' && rrBeaconCount(p)>=3) rrKind = 'redridgeBridgeOpen';
    if(!rrKind && rr.camp && dist(p, rr.camp) < rr.camp.r + p.r + 30) rrKind = 'wayfarer';
    if(!rrKind){ for(const tw of rr.towers){ if(dist(p, tw.door) < tw.door.r + p.r + 22){ rrKind = 'rrTower'; g._rrTowerNear = tw; break; } } }
    if(rr.waypoint && dist(p, rr.waypoint) < rr.waypoint.r + p.r + 24){ if(!rrKind) rrKind = 'waypointRedridge'; }
    updateInteractPrompt(rrKind);
  } else if(g.scene==='highlands'){
    updatePortalChoice(false);
    crEnforce(g, p);
    updateHighlandsWeather(g, dt);
    let hk = null;
    for(const gt of g.hl.gates){ if(dist(p, gt) < gt.r + p.r + 22){ hk = gt.act; break; } }
    if(dist(p, g.hl.waypoint) < g.hl.waypoint.r + p.r + 24){ if(!hk) hk = 'waypointHighlands'; }
    updateInteractPrompt(hk);
  } else if(g.scene==='redcrater'){
    updatePortalChoice(false);
    const R = g.crater;
    crEnforce(g, p);
    let crKind = null;
    for(const gt of R.gates){ if(dist(p, gt) < gt.r + p.r + 22){ crKind = gt.act; break; } }
    if(!crKind && dist(p, R.runeSpot) < R.runeSpot.r + p.r + 34){
      if(!p.gojiraSlain) crKind = 'obsidianSealed'; else if(obsidianRuneAvailable(p)) crKind = 'takeObsidianRune';
    }
    updateInteractPrompt(crKind);
  } else if(g.scene==='frosthold'){
    updatePortalChoice(false);
    let fhKind = null;
    for(const gt of g.fh.gates){ if(dist(p, gt) < gt.r + p.r + 22){ fhKind = gt.act; break; } }
    if(dist(p, g.fh.waypoint) < g.fh.waypoint.r + p.r + 24){ if(!fhKind) fhKind = 'waypointFrosthold'; }
    if(fhKind==='toFhDungeon' && !fhDungeonUnlocked(p)) fhKind = hasFhKeyItem(p) ? 'fhDungeonKeyhole' : 'fhDungeonLocked';
    if(fhKind==='toRedridge' && !redridgeWallOpen(p)) fhKind = 'redridgeWall';
    updateInteractPrompt(fhKind);
  } else if(g.scene==='icyzone'){
    updatePortalChoice(false);
    const iz = g.iz;
    let izKind = null;
    for(const gt of iz.gates){ if(dist(p, gt) < gt.r + p.r + 22){ izKind = gt.act; break; } }
    if(iz.waypoint && dist(p, iz.waypoint) < iz.waypoint.r + p.r + 24){
      if(!izKind) izKind = 'waypointIcy';
    }
    if(iz.altar && (p.shrineStage||0)<3 && !izKind && dist(p, iz.altar) < iz.altar.r + p.r + 26){
      const sst = p.shrineStage||0;
      izKind = sst>=2 ? 'shrineAltar' : (sst===0 && findRunestone(p)) ? 'shrineInsert' : 'shrineSealed';
    }
    if(iz.kind==='shrine' && iz.altar && (p.shrineStage||0)>=3 && !izKind){   // v490: a portal home once the runestone is awakened
      iz.homePortal = iz.homePortal || {x:iz.altar.x, y:iz.altar.y+170, r:26};
      if(dist(p, iz.homePortal) < iz.homePortal.r + p.r + 22) izKind = 'shrineToTown';
    }
    if(iz.kind==='shrine' && iz.protectorsSpawned && !iz.protectorsDown && !g.enemies.some(e=>e.prot && e.hp>0)){
      iz.protectorsDown = true;
      p.shrineStage = Math.max(p.shrineStage||0, 2);
      showBigMsg('Return to the altar.', '', 3.0);
      saveGame();
    }
    if(iz.avalancheT>0){
      iz.avalancheT -= dt;
      if(iz.avalancheT<=0) showMsg('It looks like the avalanche revealed the western gate of Frosthold Keep.', 5.0, '#cfe8ff');
    }
    updateInteractPrompt(izKind);
    // Icy Summit: bitter cold -- flat 1 HP per second, ignores cold resistance.
    if(iz.cold && !g.over && p.hp>0){
      p.hp -= Math.max(COLD_DPS, (p.maxHp||0)*COLD_DPS_PCT)*dt;   // ignores cold resist (v490: scales with life now)
      g.coldT = (g.coldT||0) + dt;
      if(p.hp<=0){ p.hp=0; endGame(g); }
    }
    // v523: once you step into the Mastodon's hall, dying brings you back just outside its tunnel
    if(iz.bossHall && iz.hallDoorOut){ const bh = iz.bossHall, dx = (p.x-bh.x)/bh.rx, dy = (p.y-bh.y)/bh.ry; if(dx*dx+dy*dy < 0.8) iz.entrySpawn = {x:iz.hallDoorOut.x, y:iz.hallDoorOut.y}; }
    // Cellar: once the Mastodon falls, a chest appears where it stood.
    if(iz.kind==='cellar' && g.bossKilled && !iz.chestSpot) iz.chestSpot = {x:iz.bossSpot.x, y:iz.bossSpot.y+60, r:24, opened:false};
    if(iz.chestSpot && !iz.chestSpot.opened && dist(p, iz.chestSpot) < iz.chestSpot.r + p.r){
      iz.chestSpot.opened = true;
      const item = classRewardItem(p, Math.max(p.level, iz.depth), 'reward');
      forceAddToBag(p, item);
      const amt = Math.ceil(rand(120,220) + iz.depth*8); p.gold += amt;
      showMsg((iz.kind==='cellar'?'Mastodon hoard: ':'Shrine offering: ')+item.name+' + '+amt+' gold', 3.0);
      g.particles.push({type:'burst', x:iz.chestSpot.x, y:iz.chestSpot.y, t:0.5, max:0.5, color:'#9ad8ff'});
      bagPulse();
      saveGame();
    }
  } else if(g.scene==='rivervalley' && g.rv){
    // River Valley (v233): open zone like the Forest -- north gate to the Dark Forest, south gate to
    // Withered Crossroads, a waypoint north of the bridge, and the Minotaur Cave in the north-east corner.
    updatePortalChoice(false);
    const rv = g.rv;
    const nearN = dist(p, rv.northGate) < rv.northGate.r + p.r + 22;
    const nearS = dist(p, rv.southGate) < rv.southGate.r + p.r + 22;
    const nearC = dist(p, rv.caveGate) < rv.caveGate.r + p.r + 22;
    const nearW = dist(p, rv.waypoint) < rv.waypoint.r + p.r + 24;
    updateInteractPrompt(nearN ? 'toForestFromRiver' : nearS ? 'toSunlitPlainsFromRiver' : nearC ? 'toMinotaurCave' : nearW ? 'waypointRiver' : null);
  } else if(g.scene==='sunlitplains'){
    // Withered Crossroads: same open-zone shape as the Forest/Mountain Pass --
    // no portal/chest, one edge gate back to the Forest, plus its own
    // permanent waypoint. v70: the west reserved exit spot is now a real
    // gate into Lighthouse Tower (see makeSunlitPlains' westGate). v71:
    // the east reserved exit spot is now a real gate into Lakeside Ruins
    // (see makeSunlitPlains' eastGate). v72: the south reserved exit spot
    // is now a real gate into Cursed Cemetery (see makeSunlitPlains'
    // southGate) -- all three of the crossroad's non-Forest ends are now wired up.
    updatePortalChoice(false);
    const nearForestGate = dist(p, g.sun.forestGate) < g.sun.forestGate.r + p.r + 22;
    const nearSunWaypoint = dist(p, g.sun.waypoint) < g.sun.waypoint.r + p.r + 24;
    const nearWestGate = dist(p, g.sun.westGate) < g.sun.westGate.r + p.r + 22;
    const nearEastGate = dist(p, g.sun.eastGate) < g.sun.eastGate.r + p.r + 22;
    const nearSouthGate = dist(p, g.sun.southGate) < g.sun.southGate.r + p.r + 22;
    updateInteractPrompt(nearForestGate ? 'toForestFromSunlit' : nearSunWaypoint ? 'waypointSun' : nearWestGate ? 'toLighthouseTower' : nearEastGate ? 'toLakesideRuins' : nearSouthGate ? 'toCursedCemetery' : null);
  } else if(g.scene==='lighthouse' && g.tower && g.tower.deep){
    updateDeep(g, dt);
  } else if(g.scene==='lighthouse' && g.tower && g.tower.subzone==='highward'){
    updateHighward(g, dt);
  } else if(g.scene==='lighthouse' && g.tower && g.tower.subzone==='keep'){
    updateKeep(g, dt);
  } else if(g.scene==='lighthouse' && g.tower && g.tower.subzone==='rrtower'){
    updateRRTower(g, dt);
  } else if(g.scene==='lighthouse' && g.tower && g.tower.subzone==='cellar'){
    updatePortalChoice(false); updateInteractPrompt(null); updateRoadCellar(g, dt);
  } else if(g.scene==='lighthouse' && g.tower && g.tower.subzone){
    updateSubZone(g, dt);
  } else if(g.scene==='lighthouse' && g.tower && g.tower.fht){
    // Frosthold Tower (v167): permanent stairs both ways; floor 5 chest appears once every Templar is down.
    updatePortalChoice(false);
    const t = g.tower;
    if(g.fhtStore) g.fhtStore[t.floor] = g.enemies;
    let fkind = null;
    if(dist(p, t.entrance) < t.entrance.r + p.r + 22) fkind = t.floor===1 ? 'fhtToKeep' : 'fhtDown';
    else if(t.stairs && dist(p, t.stairs) < t.stairs.r + p.r + 22) fkind = 'fhtUp';
    updateInteractPrompt(fkind);
    if(t.floor===4 && !p.fhtRuneTaken && !g.chest && !g.enemies.some(x=>x.isFhtTemplar && x.hp>0)){
      g.chest = {x:t.chestSpot.x, y:t.chestSpot.y, r:24, opened:false, templar:true};
      showMsg('The Frosthold Champions have fallen — a chest appears', 3.0);
    }
    if(t.cmdFloor && p.fhCmdSlain && !p.fhCmdLooted && !g.chest && !g.enemies.some(x=>x.fhCmd && x.hp>0)) g.chest = {x:t.chestSpot.x, y:t.chestSpot.y, r:24, opened:false, cmd:true};
    if(g.chest && !g.chest.opened && g.chest.templar && dist(g.chest,p) < g.chest.r+p.r) openTemplarChest(g);
    if(g.chest && !g.chest.opened && g.chest.cmd && dist(g.chest,p) < g.chest.r+p.r+10) openCmdChest(g);
    if(t.clearPortal && dist(p, t.clearPortal) < t.clearPortal.r + p.r + 22){ fkind = 'fhtPortalKeep'; updateInteractPrompt(fkind); }
  } else if(g.scene==='lighthouse'){
    // Lighthouse Tower (v70): small, fixed floors with PERMANENT stairs --
    // unlike the Mine's dynamic post-clear portal, the stairs/entrance/
    // waypoint here are always present, fixed trigger points, same
    // "walk up, see an interact prompt" mechanism every other zone gate
    // uses, just checked directly rather than through the generic
    // portal-after-clear flow the Mine/Spider Lair/Bear Cave share below.
    updatePortalChoice(false);
    const t = g.tower;
    if(t.ft){ if(g.ftStore) g.ftStore[g.lighthouseFloor] = g.enemies; }
    else if(g.lhStore) g.lhStore[g.lighthouseFloor] = g.enemies;
    let lhKind = null;
    if(t.floor===1 && dist(p, t.entrance) < t.entrance.r + p.r + 22) lhKind = t.ft ? 'toMarshFromTower' : 'toSunlitPlainsFromLighthouse';
    else if(t.floor>1 && dist(p, t.entrance) < t.entrance.r + p.r + 22) lhKind = 'lighthouseStairsDown';
    else if(t.stairs && dist(p, t.stairs) < t.stairs.r + p.r + 22) lhKind = 'lighthouseStairsUp';
    if(t.maze && t.stairs && !t.stairsSeen && dist(p, t.stairs) < 520) t.stairsSeen = true;
    else if(t.waypoint && dist(p, t.waypoint) < t.waypoint.r + p.r + 24){ if(t.ft){ lhKind = 'waypointForgottenTower'; } else { lhKind = 'waypointLighthouse1'; } }
    // v94 (quest feature): the rooftop's beacon starts off (p.lighthouseBeaconOn
    // false) -- while it's off, walking up to it shows the same small
    // interact-button prompt every other interactable (stash/vendor/
    // waypoint) uses, letting the player turn it on (turnOnBeacon). Once
    // on, it's just a lit landmark again, no further prompt.
    if(t.rooftop && t.beacon && !p.lighthouseBeaconOn && dist(p, t.beacon) < t.beacon.r + p.r + 24) lhKind = 'beacon';
    // The rooftop's own one-time clear portal (spawned below once floor 5
    // is cleared) back to Withered Crossroads, at the tower's entrance point --
    // reuses the exact same enterSunlitPlains('lighthouse') landing spot
    // floor 1's own entrance gate already uses.
    if(t.clearPortal && dist(p, t.clearPortal) < t.clearPortal.r + p.r + 22) lhKind = (t.ft || t.clearPortal.toTown) ? (t.clearPortal.toTown ? 'toTownFromTower' : t.clearPortal.toWitch ? 'toWitchCamp' : 'toMarshFromTower') : 'lighthouseClearPortal';
    if(t.ft && t.witch && dist(p, t.witch) < t.witch.r + p.r + 34) lhKind = 'talkWitchTower';
    updateInteractPrompt(lhKind);
    // v94: once floor 5 (the rooftop) is fully cleared of bandits, spawn a
    // one-time portal near the beacon back to Withered Crossroads -- the
    // rooftop's own waypoint used to serve this role; now it's gone (see
    // makeLighthouseFloor's comment) so this is the sole way back down
    // once the fight is over, short of dying. Also flips
    // p.lighthouseFloor5Cleared, which -- together with p.lighthouseBeaconOn
    // -- is exactly what the Barkeeper's Light the Way quest waits on.
    // v237: floors 1-4 never spawn a portal (stairs only). The rooftop's portal appears only once the
    // floor is clear AND the beacon is lit, tucked in the far corner so nobody walks into it by accident.
    if(!t.clearPortal && g.enemies.length===0 && !t.ft && t.rooftop && t.beacon && p.lighthouseBeaconOn){   // v536: only once the beacon is lit, and it leads out to the Crossroads at the tower's door
      const at = {x:t.beacon.x - 30, y:t.beacon.y + 20};
      t.clearPortal = fixLootSpot(g, {x:clamp(at.x + 110, 60, t.w-60), y:clamp(at.y + 50, 60, t.h-60), r:24});
      showMsg('A portal to the Withered Crossroads opens.', 2.6, '#9fd8ff');
    }
    if(t.rooftop && !t.ft && g.enemies.length===0){
      if(!p.lighthouseChestLooted && !g.chest){ const at = t.bkDeath || {x:t.beacon.x + 70, y:t.beacon.y + 60}; g.chest = fixLootSpot(g, {x:clamp(at.x, 60, t.w-60), y:clamp(at.y, 60, t.h-60), r:20, opened:false}); }
      if(!p.lighthouseFloor5Cleared){
        p.lighthouseFloor5Cleared = true;
        saveGame();
        checkLightTheWayQuest();
      }
    }
    // Rooftop reward chest, same pickup logic the Mine/Spider Lair/Bear
    // Cave's own chest uses (see the generic chest-open block below) --
    // duplicated here rather than shared since this branch intentionally
    // skips that whole portal/chest-spawn flow.
    if(g.chest && !g.chest.opened && dist(g.chest,p) < g.chest.r+p.r){
      g.chest.opened = true; p.lighthouseChestLooted = true; saveGame();
      if(Math.random() < 0.7){
        const item = generateItem(p.level, p.level < 6 ? 'common' : 'reward');
        forceAddToBag(p, item);
        const chestEq = tryAutoEquip(p, item);
        showMsg(chestEq ? 'Chest: '+item.name+' (Equipped)' : 'Chest: '+item.name, 1.7);
      } else {
        const amt = Math.ceil(rand(15,28)+g.depth*2);
        p.gold += amt;
        showMsg('Chest: '+amt+' gold', 1.7);
      }
      g.particles.push({type:'burst', x:g.chest.x, y:g.chest.y, t:0.4, max:0.4, color:'#e8c44a'});
      bagPulse();
    }
  } else if(g.scene==='lakesideruins'){
    // Lakeside Ruins (v71): same open-zone shape as Withered Crossroads -- no
    // portal, one edge gate back to Withered Crossroads, its own waypoint, plus
    // a one-off reward chest at the island's Stonehenge (a judgment-call
    // payoff for making the trip across the bridge, using the exact same
    // 70%-item/30%-gold logic the Lighthouse Tower rooftop chest above
    // uses -- duplicated here for the same reason: this open zone has no
    // generic portal/chest-spawn flow to hook into).
    updatePortalChoice(false);
    const nearSunlitGate = dist(p, g.lake.sunlitGate) < g.lake.sunlitGate.r + p.r + 22;
    const nearLakeWaypoint = !g.lake.waypoint.off && dist(p, g.lake.waypoint) < g.lake.waypoint.r + p.r + 24;
    const nearRuinsSpot = dist(p, g.lake.ruinsSpot) < g.lake.ruinsSpot.r + p.r + 22;
    const ruinsKind = nearRuinsSpot ? (p.ruinsEntranceOpen ? 'toAncientRuins' : (canStudyRuins(p) ? 'studyRuins' : null)) : null;
    const ev = g.lake.event, evActive = !!(ev && ev.active);
    const nearScholarR = !!p.scholarMeet && !p.ruinsEntranceOpen && !evActive && dist(p, g.lake.scholarSpot) < 70;
    updateRuinsEvent(g, dt);
    updateInteractPrompt(nearSunlitGate ? 'toSunlitPlainsFromLakeside' : nearScholarR ? 'scholarRuins' : nearLakeWaypoint ? 'waypointLakeside' : ruinsKind);
    if(g.chest && !g.chest.opened && dist(g.chest,p) < g.chest.r+p.r){
      g.chest.opened = true;
      if(Math.random() < 0.7){
        const item = generateItem(p.level, p.level < 6 ? 'common' : 'reward');
        forceAddToBag(p, item);
        const chestEq = tryAutoEquip(p, item);
        showMsg(chestEq ? 'Chest: '+item.name+' (Equipped)' : 'Chest: '+item.name, 1.7);
      } else {
        const amt = Math.ceil(rand(15,28)+g.depth*2);
        p.gold += amt;
        showMsg('Chest: '+amt+' gold', 1.7);
      }
      g.particles.push({type:'burst', x:g.chest.x, y:g.chest.y, t:0.4, max:0.4, color:'#e8c44a'});
      bagPulse();
    }
  } else if(g.scene==='blackmarsh'){
    updatePortalChoice(false);
    const bm = g.bm;
    const nearW = dist(p, bm.westGate) < bm.westGate.r + p.r + 22;
    const nearE = dist(p, bm.eastGate) < bm.eastGate.r + p.r + 22;
    const nearWp = dist(p, bm.waypoint) < bm.waypoint.r + p.r + 24;
    const nearC = dist(p, bm.cauldron) < bm.cauldron.r + p.r + 34;
    const cq = getQuest(p,'witch_find');
    const cauldronUsable = p.witchRescued || (cq && cq.status==='active');
    const nearP = dist(p, bm.poolGate) < bm.poolGate.r + p.r + 22;
    const nearH = bm.highGate && dist(p, bm.highGate) < bm.highGate.r + p.r + 22;
    updateInteractPrompt(nearH ? 'toHighlands' : nearW ? 'marshCaveBlocked' : nearE ? 'toForgottenTower' : nearP ? 'toMarshPool' : nearC ? 'marshCauldron' : nearWp ? 'waypointMarsh' : null);
  } else if(g.scene==='cursedcemetery'){
    // Cursed Cemetery (v72): same open-zone shape as every other
    // overworld zone -- no genRoom() portal/chest, one edge gate back to
    // Withered Crossroads, its own waypoint, plus the sealed tomb landmark this
    // zone is built around.
    updatePortalChoice(false);
    const nearSunlitGate = dist(p, g.cem.sunlitGate) < g.cem.sunlitGate.r + p.r + 22;
    const nearCemWaypoint = !!g.cem.waypoint && dist(p, g.cem.waypoint) < g.cem.waypoint.r + p.r + 24;
    const nearTomb = dist(p, g.cem.tomb) < g.cem.tomb.r + p.r + 26;
    const nearStatue = !p.cemeteryCleared && !(g.cem.evt && g.cem.evt.stage>0) && dist(p, g.cem.statue) < g.cem.statue.r + p.r + 30;
    const nearRobber = (g.cem.graverobbers||[]).some(r=>dist(p,r) < 70);   // v532: their camp is just inside the gate
    updateInteractPrompt(nearSunlitGate ? 'toSunlitPlainsFromCemetery' : nearCemWaypoint ? 'waypointCemetery' : nearTomb ? (p.cemeteryCleared ? 'toDarkCrypt' : 'tombSealed') : nearStatue ? 'cemStatue' : nearRobber ? 'talkGraverobbers' : null);
    // v299: the crypt no longer opens by clearing the whole graveyard -- touch the Grave Statue, survive its waves, and the way opens.
    { const st = g.cem.statue; pushOutOfRect(p, {x:st.x-st.r*0.6, y:st.y-st.r*0.6, w:st.r*1.2, h:st.r*1.2}); }
    updateCemeteryEvent(g, p, dt);
  } else if(g.scene==='darkcrypt'){
    // Dark Crypt (v73): a fixed corridor dungeon -- no genRoom() portal/
    // exit-room-unlock flow (this is a one-off destination, not an endless
    // dungeon), just the entry/exit gate, a waypoint near it, and the
    // permanent vampire-guarded chest at the far end. See
    // makeDarkCrypt()/enterDarkCrypt() above.
    updatePortalChoice(false);
    const nearCemeteryGate = dist(p, g.crypt.cemeteryGate) < g.crypt.cemeteryGate.r + p.r + 22;
    const nearCryptWaypoint = dist(p, g.crypt.waypoint) < g.crypt.waypoint.r + p.r + 24;
    // (v120) once the chest is looted a portal appears beside it, leading back to the cemetery
    if(g.crypt.bossDone && p.defilerSlain && !p.inscriptionTaken) bigMsgHold('Inspect the opened tomb', ''); else bigMsgRelease();   // v536
    if(g.crypt.bossDone && p.inscriptionTaken && !g.crypt.returnPortal){   // v326: the portal only opens once the sarcophagus has been searched for the Templar Inscription
      g.crypt.returnPortal = {x:g.crypt.chestSpot.x+70, y:g.crypt.chestSpot.y, r:26};
    }
    const nearReturnPortal = !!(g.crypt.returnPortal && dist(p, g.crypt.returnPortal) < g.crypt.returnPortal.r + p.r + 22);
    const tm = g.crypt.tomb;
    const nearTomb = g.crypt.bossDone && (()=>{ const R = tm.rect; const dx = Math.max(R.x-p.x, 0, p.x-(R.x+R.w)), dy = Math.max(R.y-p.y, 0, p.y-(R.y+R.h)); return Math.hypot(dx,dy) < p.r+40; })();
    const hd = g.crypt.hallDoor, td = g.crypt.tombDoor;
    const nearHallDoor = dist(p, hd) < hd.r + p.r + 20, nearTombDoor = dist(p, td) < td.r + p.r + 20;
    updateInteractPrompt((nearCemeteryGate || nearReturnPortal) ? 'toCursedCemeteryFromCrypt' : nearHallDoor ? 'toDefilerTomb' : nearTombDoor ? 'fromDefilerTomb' : nearCryptWaypoint ? 'waypointDarkCrypt' : nearTomb ? 'inspectTomb' : null);
    if(p.darkCryptChestLooted && tm.state==='closed') tm.state = 'open';   // already emptied on an earlier visit
    if(!g.crypt.bossSpawned && (!p.defilerSlain || p.inscriptionTaken)){   // v275: stepping into the Defiler's Tomb wakes the possessed graverobber
      const TR = g.crypt.tombRoom;
      if(p.x>TR.x && p.x<TR.x+TR.w && p.y>TR.y && p.y<TR.y+TR.h-170){ g.crypt.bossSpawned = true; spawnDefiler(g); }   // v310: wakes a few steps inside, not on the doorstep
    }
    { const df = g.enemies.find(x=>x.defiler && x.hp>0);
      if(df){
        const f = df.hp/df.maxHp, ph = f<0.33 ? 2 : f<0.66 ? 1 : 0;
        if(ph>df.dfPhase){
          df.dfPhase = ph;
          for(let i=0;i<4;i++){ const a = i*1.5708; const sk = spawnEnemy(g, 'skeleton', {x:df.x+Math.cos(a)*100, y:df.y+Math.sin(a)*100}); if(sk) sk.noReward = true; }
          g.particles.push({type:'ring', x:df.x, y:df.y, t:0.7, max:0.7, r:210, color:'#9a6aff'});
          showMsg('The dead claw up from the floor...', 1.8, '#b9a8ff');
        }
      } }
    if(tm.state==='opening'){
      tm.t -= dt;
      if(Math.random()<0.4) g.particles.push({type:'burst', x:tm.x+rand(-90,90), y:tm.y+rand(-40,40), t:0.4, max:0.4, color:'#7a5cff'});
      if(tm.t<=0){
        tm.state = 'open';
        const w = spawnEnemy(g, 'wraith', {x:tm.x, y:tm.rect.y+tm.rect.h+70});
        if(w){ initWraith(w); w.wrLockHp = w.hp; }
        bossMsg('The Wraith Lord', '\u201CFinally... I will unleash hell upon the world.\u201D', 4.6);
        shakeScreen(g, 7, 0.6);
      }
    }
    if(g.crypt.wraithDone && !g.crypt.chestShown){
      g.crypt.chestDelay -= dt;
      if(g.crypt.chestDelay<=0){
        g.crypt.chestShown = true;
        g.particles.push({type:'burst', x:g.crypt.chestSpot.x, y:g.crypt.chestSpot.y, t:0.6, max:0.6, color:'#e8c44a'});
        g.particles.push({type:'ring', x:g.crypt.chestSpot.x, y:g.crypt.chestSpot.y, t:0.7, max:0.7, r:120, color:'#e8c44a'});
        showMsg('A chest appears...', 2.0, '#e8c44a');
      }
    }
    // The permanent Ruins Map chest: same walk-up-and-it-opens convention
    // every other chest in the game uses (Lakeside Ruins/Lighthouse Tower
    // rooftop, the generic Mine/Spider-Lair/Bear-Cave chest below), except
    // the "already looted" state is a PLAYER-level flag (p.darkCryptChestLooted)
    // rather than a per-visit g.chest.opened -- since g.crypt (and any
    // g.chest on it) is rebuilt fresh every time enterDarkCrypt() runs, a
    // per-visit flag would let the chest be looted again on every
    // re-entry. This makes it a true one-time-ever reward, same
    // permanence pattern as p.cemeteryCleared/p.checkpointDepth.
    // v516: dead-end chests -- the same loot a magic monster pack drops, a few items and some gold
    for(const sc of (g.crypt.sideChests||[])){
      if(sc.opened || dist(p, sc) > sc.r + p.r) continue;
      sc.opened = true;
      const lvl = Math.max(1, monsterLevel(g)), n0 = g.loot.length;
      for(let k=0;k<2;k++) g.loot.push({type:'item', x:sc.x+rand(-26,26), y:sc.y+rand(26,46), r:8, item:generateItem(lvl, packRarity(lvl), null, null, p)});
      if(Math.random()<0.5) g.loot.push({type:'item', x:sc.x+rand(-26,26), y:sc.y+rand(26,46), r:8, item:generateItem(lvl, packRarity(lvl), null, null, p)});
      g.loot.push({type:'gold', x:sc.x+rand(-20,20), y:sc.y+rand(26,46), r:9, amt:Math.ceil((rand(30,60)+g.depth*3)*(1+clamp((p.goldFindPct||0),0,200)/100))});
      for(let i=n0;i<g.loot.length;i++) fixLootSpot(g, g.loot[i]);
      g.particles.push({type:'burst', x:sc.x, y:sc.y, t:0.4, max:0.4, color:'#e8c44a'});
      showMsg('A forgotten chest', 1.8);
      if(sc.locket){ forceAddToBag(p, makeSilverLocketItem()); silverLocketFound(p); showBigMsg('You found a silver locket!', 'Return it to Mirelle in Mistfall.', 3.2); bagPulse(); saveGame(); }   // v519
    }
    if(!p.darkCryptChestLooted && g.crypt.chestShown && dist(p, g.crypt.chestSpot) < g.crypt.chestSpot.r + p.r){
      p.darkCryptChestLooted = true;
      const item = classRewardItem(p, Math.max(p.level, 19), 'reward');   // v483: the Ruins Map / Hidden Secrets quest is gone
      forceAddToBag(p, item); p.gold += 200;
      showMsg('Chest: '+item.name+' + 200 gold', 2.4);
      g.particles.push({type:'burst', x:g.crypt.chestSpot.x, y:g.crypt.chestSpot.y, t:0.4, max:0.4, color:'#e8c44a'});
      bagPulse();
      saveGame();
    }
  } else if(g.scene==='ancientruins' && g.ruins && g.ruins.fhd){
    updatePortalChoice(false);
    const R = g.ruins;
    const nearE = dist(p, R.entrance) < R.entrance.r + p.r + 22;
    const nearDn = R.stairsDown && dist(p, R.stairsDown) < R.stairsDown.r + p.r + 22;
    const nearRP = !!(R.returnPortal && dist(p, R.returnPortal) < R.returnPortal.r + p.r + 22);
    const nearHusk = !!(R.husk && !R.husk.taken && dist(p, R.husk) < R.husk.r + p.r + 34);
    const nearFW = !!(R.waypoint && dist(p, R.waypoint) < R.waypoint.r + p.r + 24);
    updateFhdHazards(g, dt);
    updateInteractPrompt(nearHusk ? 'takeRunestone2' : nearFW ? 'waypointFhd' : nearE ? (R.floor===1 ? 'fhdToKeep' : 'fhdUp') : nearRP ? 'fhdPortalKeep' : nearDn ? 'fhdDown' : null);
  } else if(g.scene==='ancientruins'){
    updatePortalChoice(false);
    const R = g.ruins;
    const nearEntrance = dist(p, R.entrance) < R.entrance.r + p.r + 22;
    const nearRW = R.waypoint && dist(p, R.waypoint) < R.waypoint.r + p.r + 24;
    const nearDown = R.stairsDown && dist(p, R.stairsDown) < R.stairsDown.r + p.r + 22;
    // v413: the stairway to the Flooded Temple opens only once the Templar Revenant is dead (older saves that already reached the temple or looted the chest keep it)
    if(g.bossKilled && !p.ruinsWarlordSlain){ p.ruinsWarlordSlain = true; }
    if(R.chestSpot && !R.templeStairs && (g.bossKilled || p.ruinsWarlordSlain || p.ancientRuinsChestLooted || p.reachedAncientRuins)){
      R.templeStairs = {x:R.chestSpot.x-30, y:R.chestSpot.y, r:30};
      if(g.bossKilled && !p.reachedAncientRuins) showMsg('The way opens...', 2.4, '#9fd8ff');
    }
    // v327: no return portal after the boss -- the way out is the stairs/entrance
    const nearRPortal = !!(R.returnPortal && dist(p, R.returnPortal) < R.returnPortal.r + p.r + 22);
    const nearTemple = !!(R.templeStairs && dist(p, R.templeStairs) < R.templeStairs.r + p.r + 22);
    updateInteractPrompt(nearEntrance ? (R.floor===1 ? 'toLakesideFromRuins' : 'ruinsUp') : nearRPortal ? 'toTownFromRuins' : nearTemple ? 'toFloodedTemple' : nearRW ? 'waypointAncientRuins' : nearDown ? 'ruinsDown' : null);
  } else if(g.scene==='raptorlair'){
    updatePortalChoice(false);
    const R = g.rlair;
    const nearEntrance = dist(p, R.entrance) < R.entrance.r + p.r + 22;
    const nearDown = R.stairsDown && dist(p, R.stairsDown) < R.stairsDown.r + p.r + 22;
    if(R.floor===2 && g.bossKilled && !R.returnPortal){
      const kp = g.lastKillPos || R.bossSpot;
      R.returnPortal = {x:kp.x, y:kp.y, r:26};
    }
    const nearRP = !!(R.returnPortal && dist(p, R.returnPortal) < R.returnPortal.r + p.r + 22);
    updateInteractPrompt(nearEntrance ? (R.floor===1 ? 'toRedridgeFromLair' : 'lairUp') : nearRP ? 'toRedridgeFromLair' : nearDown ? 'lairDown' : null);
  } else if(g.scene==='tavern'){
    // Tavern interior: a fixed, contained interior, same "no portal/chest
    // flow, just fixed trigger points" treatment as the Lighthouse Tower's
    // own branch above -- no enemies, no combat, just the exit door and
    // (ground floor only) the stairs up/down between the two rooms.
    updatePortalChoice(false);
    const tv = g.tavern;
    let tvKind = null;
    if(tv.level==='main'){
      if(dist(p, tv.exit) < tv.exit.r + p.r + 22) tvKind = 'toTownFromTavern';
      else if(dist(p, tv.stairsUp) < tv.stairsUp.r + p.r + 22) tvKind = 'tavernStairsUp';
      else if(dist(p, tv.barkeeperSpot) < 100) tvKind = 'barShop';
      else if(dist(p, tv.bard) < 20 + p.r + 34) tvKind = 'bardShop';
      else if(dist(p, tv.gambler) < 20 + p.r + 34) tvKind = 'gamblerShop';
      else if(scholarInTavern(p) && dist(p, tv.scholar) < 20 + p.r + 34) tvKind = 'scholarTalk';
    } else {
      if(dist(p, tv.stairsDown) < tv.stairsDown.r + p.r + 22) tvKind = 'tavernStairsDown';
      else if(tv.beds.some(b=> dist(p,{x:b.x+b.w/2, y:b.y+b.h/2}) < 70)) tvKind = 'tavernLogout';
    }
    updateInteractPrompt(tvKind);
  } else {
    // Spider Lair / Bear Cave: check whether the player has walked up to
    // that zone's trapped hunter, same rule as the Forest's own marker.
    // v186: the entrance always works -- retreat out of the lair at any time
    if((g.scene==='spiderlair' || g.scene==='bearcave' || g.scene==='minotaurcave') && g.room && g.room.entranceSpawn) updateInteractPrompt((dist(p, g.room.entranceSpawn) < 75 || (g.portal && dist(p, g.portal) < g.portal.r+p.r+22)) ? 'lairExit' : null);
    if(g.scene==='spiderlair'){ if(checkQuestHunterAt(g, g.spiderLairHunter, 'foundSpider')) updateInteractPrompt('rescueHunter'); }
    else if(g.scene==='bearcave'){ if(checkQuestHunterAt(g, g.bearCaveHunter, 'foundBear')) updateInteractPrompt('rescueHunter'); }
    // portal + chest (spawn together once the room is cleared).
    // v62: on a boss floor this used to wait for g.enemies.length===0 --
    // ALL enemies dead, not just the boss -- but a straggler escort (e.g. a
    // kiting archer that ends up cornered somewhere hard to reach) could
    // stay alive indefinitely and the portal would then just never appear,
    // even though the boss itself was long dead. g.bossKilled (set in the
    // "remove dead" pass below, the moment a boss/lair-boss enemy is
    // spliced out) now lets a boss floor's portal spawn reliably the
    // instant the boss dies, regardless of any escorts still wandering
    // the floor; non-boss floors are unaffected and still wait for a full
    // clear.
    const lairDone = (g.scene==='spiderlair' || g.scene==='bearcave' || g.scene==='minotaurcave') && g.bossKilled;   // v226: the lair boss alone opens the way out
    // v476: in the Spider Lair and Bear Cave the way out only opens once the trapped hunter has been freed
    const hunterWaiting = (g.scene==='spiderlair' && g.spiderLairHunter && !g.spiderLairHunter.found) || (g.scene==='bearcave' && g.bearCaveHunter && !g.bearCaveHunter.found);
    if(!g.portal && !hunterWaiting && (g.enemies.length===0 || lairDone || (isBossFloor(g.depth) && g.bossKilled))){
      const clearOfObstacles = (x,y,pad)=> room.obstacles.every(o=>!circleRectCollide(x,y,pad,o.x,o.y,o.w,o.h));
      const insideFloorRect = (x,y)=> !room.floorRects || room.floorRects.some(r=> x>r.x+30 && x<r.x+r.w-30 && y>r.y+30 && y<r.y+r.h-30);
      let px=null, py=null;
      if(g.lastKillPos){
        // The stairs down spawn near wherever the last enemy on this floor
        // was killed, rather than always in the far-off dedicated exit
        // room -- a small random offset, retried until it lands clear of
        // walls and still inside a floor tile (not clipped into rock).
        let ktries=0, kx,ky;
        do{
          const ang = Math.random()*Math.PI*2, rad = rand(60,100);
          kx = g.lastKillPos.x + Math.cos(ang)*rad;
          ky = g.lastKillPos.y + Math.sin(ang)*rad;
          ktries++;
        } while((!clearOfObstacles(kx,ky,32) || !insideFloorRect(kx,ky)) && ktries<20);
        if(clearOfObstacles(kx,ky,32) && insideFloorRect(kx,ky)){ px=kx; py=ky; }
      }
      if(px==null){
        // fall back to the old behavior: non-dungeon floors, or the rare
        // case no valid spot was found near the last kill
        if(room.exitRoom){
          // multi-room dungeon floor: the stairs down always sit in the
          // dedicated final room, not just anywhere in the middle of the map
          px = room.exitRoom.x+room.exitRoom.w/2; py = room.exitRoom.y+room.exitRoom.h/2;
        } else {
          let ptries=0;
          do{ px=rand(room.w*0.3,room.w*0.7); py=rand(room.h*0.3,room.h*0.7); ptries++; }
          while(!clearOfObstacles(px,py,50) && ptries<30);
        }
      }
      g.portal = {x:px, y:py, r:26, t:0};
      // v62: on a boss floor, place the chest close to the portal (was
      // "anywhere in a room, at least 120px away" with no upper bound --
      // it could land clear across the map) so the player doesn't have to
      // go exploring to find both after the boss fight. A ring around the
      // portal (70-150px out) is tried first; the old room-scattered logic
      // is kept only as a fallback for the rare case nothing in that ring
      // is clear of obstacles/inside a floor tile.
      let cx=null,cy=null,tries=0;
      do{
        const cang = Math.random()*Math.PI*2, crad = rand(70,150);
        cx = g.portal.x + Math.cos(cang)*crad;
        cy = g.portal.y + Math.sin(cang)*crad;
        tries++;
      } while((!clearOfObstacles(cx,cy,40) || !insideFloorRect(cx,cy)) && tries<30);
      if(cx==null || !clearOfObstacles(cx,cy,40) || !insideFloorRect(cx,cy)){
        tries=0;
        if(room.rooms && room.rooms.length){
          const cRoom = room.rooms[Math.floor(Math.random()*room.rooms.length)];
          do{ cx=rand(cRoom.x+40,cRoom.x+cRoom.w-40); cy=rand(cRoom.y+40,cRoom.y+cRoom.h-40); tries++; }
          while(dist({x:cx,y:cy},g.portal) < 120 && tries<30);
        } else {
          do{ cx=rand(room.w*0.2,room.w*0.8); cy=rand(room.h*0.2,room.h*0.8); tries++; }
          while((dist({x:cx,y:cy},g.portal) < 120 || !clearOfObstacles(cx,cy,40)) && tries<30);
        }
      }
      g.chest = {x:cx, y:cy, r:20, opened:false};
      if(g.scene==='minotaurcave') g.chest.minotaur = true;
      g.portalIsBoss = isBossFloor(g.depth) || lairDone;
      if(g.portalIsBoss){
        if(g.scene==='dungeon'){
          // defeating a boss permanently unlocks this checkpoint: the mine entrance
          // will start here from now on, even after a death or a trip back to Town.
          if(g.depth+1 > p.checkpointDepth){ p.checkpointDepth = g.depth+1; }
          saveGame();
          showMsg('Boss defeated! Checkpoint reached.', 1.8);
        } else {
          // Spider Lair / Bear Cave: a one-off zone, not a checkpoint --
          // clearing it just opens the way back to the Forest.
          showMsg('The lair falls quiet...', 1.8);
        }
      } else {
        showMsg('The way opens...', 1.4);
      }
    }
    if(g.chest && !g.chest.opened && dist(g.chest,p) < g.chest.r+p.r){
      g.chest.opened = true;
      if(g.chest.minotaur){ openMinotaurChest(g); g.particles.push({type:'burst', x:g.chest.x, y:g.chest.y, t:0.5, max:0.5, color:'#e8c44a'}); }
      else {
      // Chests used to always contain an item; now there's a chance it's
      // just a solid pile of gold instead, so gear doesn't pile up quite
      // as fast from clearing every single level.
      if(Math.random() < 0.7){
        const item = generateItem(p.level, p.level < 6 ? 'common' : 'reward');
        forceAddToBag(p, item);
        const chestEq = tryAutoEquip(p, item);
        showMsg(chestEq ? 'Chest: '+item.name+' (Equipped)' : 'Chest: '+item.name, 1.7);
      } else {
        const amt = Math.ceil(rand(15,28)+g.depth*2);
        p.gold += amt;
        showMsg('Chest: '+amt+' gold', 1.7);
      }
      g.particles.push({type:'burst', x:g.chest.x, y:g.chest.y, t:0.4, max:0.4, color:'#e8c44a'});
      bagPulse();
      }
    }
    if(g.portal){
      g.portal.t += dt;
      // v237: lair/cave exits use the one regular interact prompt (see 'lairExit' above), not the old endless-dungeon plaques
      updatePortalChoice((g.scene==='spiderlair'||g.scene==='bearcave'||g.scene==='minotaurcave') ? false : dist(g.portal,p) < g.portal.r+p.r+14);
    } else {
      updatePortalChoice(false);
    }
  }

  // camera (iso space, follows player)
  const pIso = toIso(p.x, p.y);
  g.camera.x = pIso.x - W/2;
  g.camera.y = pIso.y - camPlayerY();

  // HUD DOM
  document.getElementById('hpfill').style.width = clamp(p.hp/p.maxHp*100,0,100)+'%';
  document.getElementById('mpfill').style.width = clamp(p.mp/p.maxMp*100,0,100)+'%';
  updateIceArmorHud(p);
  updateResourceHud(p);
  updatePotionButton(p);
  document.getElementById('xpfill').style.width = clamp(p.xp/p.xpNext*100,0,100)+'%';
  document.getElementById('hudLevel').textContent = 'Lv. '+(p.level||1);
  updateHudNums(p);
  document.getElementById('goldNum').textContent = p.gold; updateZoneHud();
  updateSoulsHud(p); updateAreaHud();

  const cdFn=(el,cur,max)=>{ el.style.transform = 'translateY('+(clamp(cur/max,0,1)*100)+'%)'; };
  if(preciseShotActive(p)) cdFn(document.querySelector('#btnAttack .cd'), Math.max(0,p.preciseShotCd), p.preciseShotCdMax||BASE_ATK_CD);
  else cdFn(document.querySelector('#btnAttack .cd'), Math.max(0,p.atkCd), p.atkCdMax);
  // v79: Dodge's button only shows a cooldown sweep once ALL charges are
  // spent (>=1 charge available reads as "ready", same as the old
  // single-charge button always did) -- with Finesse's 2nd charge, the
  // button stays fully bright/usable after the first dodge.
  cdFn(document.querySelector('#btnDodge .cd'), p.dodgeCharges>0 ? 0 : Math.max(0,p.dodgeCd), p.dodgeCdMax||DODGE_CD_BASE);
  cdFn(document.querySelector('#btnSlam .cd'), Math.max(0,p.atkCd), p.atkCdMax||BASE_ATK_CD);
  cdFn(document.querySelector('#btnThrow .cd'), Math.max(0,p.shieldThrowCd), p.shieldThrowCdMax);
  cdFn(document.querySelector('#btnGuardian .cd'), Math.max(0,p.guardianCd), p.guardianCdMax);
  cdFn(document.querySelector('#btnWhirlwind .cd'), Math.max(0,p.whirlwindCd), p.whirlwindCdMax);
  cdFn(document.querySelector('#btnBattlecry .cd'), Math.max(0,p.battlecryCd), p.battlecryCdMax);
  cdFn(document.querySelector('#btnAssault .cd'), Math.max(0,p.assaultCd), p.assaultCdMax);
  cdFn(document.querySelector('#btnRally .cd'), Math.max(0,p.rallyCd), p.rallyCdMax);
  cdFn(document.querySelector('#btnTrap .cd'), Math.max(0,p.trapCd), p.trapCdMax);
  cdFn(document.querySelector('#btnShadowStep .cd'), Math.max(0,p.shadowStepCd), p.shadowStepCdMax);
  cdFn(document.querySelector('#btnVanish .cd'), Math.max(0,p.vanishCd), p.vanishCdMax);
  cdFn(document.querySelector('#btnRapidShot .cd'), Math.max(0,p.rapidShotCd), p.rapidShotCdMax);
  cdFn(document.querySelector('#btnCripplingShot .cd'), Math.max(0,p.cripplingShotCd), p.cripplingShotCdMax);
  cdFn(document.querySelector('#btnStunShot .cd'), Math.max(0,p.stunShotCd), p.stunShotCdMax);
  cdFn(document.querySelector('#btnPackTactics .cd'), Math.max(0,p.packTacticsCd), p.packTacticsCdMax);
  cdFn(document.querySelector('#btnFieldDress .cd'), Math.max(0,p.fieldDressCd), p.fieldDressCdMax);
  const fieldDressBtn = document.getElementById('btnFieldDress');
  if(fieldDressBtn) fieldDressBtn.classList.toggle('channelActive', !!p.fieldDressing);
  updateSkillSlotButtonsUI();
}

function bagPulse(){ bagBadge.style.display='flex'; }
// Necromancer (v78): souls HUD counter -- shown only once Soul Sap has a
// rank (before that, the player has no way to gain or spend souls, so the
// counter would just be dead UI clutter). Called from both the Town and
// dungeon/forest per-frame HUD-DOM blocks below.
const soulsWrapEl = document.getElementById('soulsWrap');
const areaLvlEl = {style:{}, textContent:''};
// v172: top strip shows the region's name and level (gold now lives in the bag/stash screens only)
let zoneHudSig = '';
function updateZoneHud(){
  const g = game, el = document.getElementById('zoneText');
  if(!el) return;
  let txt = '';
  if(g && g.started){
    const nm = zoneDisplayName().replace(/\s*\(Lv\. *\d+\)/,'').replace(' \u2014 Floor ',' F').replace(' \u2014 Level ',' L');
    txt = (g.scene==='town'||g.scene==='tavern'||!(g.depth>0)) ? nm : nm+' \u00B7 Lv '+g.depth;
  }
  if(txt!==zoneHudSig){ zoneHudSig = txt; el.textContent = txt; }
}
function updateAreaHud(){
  const g = game;
  if(!g || !g.started || g.scene==='town' || g.scene==='tavern' || !(g.depth>0)){ areaLvlEl.style.display = 'none'; return; }
  areaLvlEl.style.display = 'none';
}
function updateSoulsHud(p){
  if(!p || !p.skills || !['soulSap','soulHunger'].some(id=>(p.skills[id]||0)>0)){ soulsWrapEl.style.display = 'none'; return; }   // v442: counter only with a soul-gathering skill
  soulsWrapEl.style.display = 'flex';
  document.getElementById('soulsNum').textContent = p.souls||0;
  document.getElementById('soulsMax').textContent = SOUL_CAP;
}

