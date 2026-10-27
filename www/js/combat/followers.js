// v86: follower AI (movement toward/away from the player, combat
// engagement, anti-stacking separation, and respawn-on-death upkeep) --
// extracted verbatim from update()'s own per-frame block into its own
// function so it can ALSO be called from updateTown() (see that function),
// letting companions (Squire/Knight, Wolf, Bear, Raise Dead skeletons, Cat
// Companion, Demon Bind) accompany the player in Town instead of just
// vanishing there (Town used to hard-reset g.followers=[] on every entry and
// never call any follower-update code at all -- see goToTown()'s own v86
// comment). Safe to run unchanged in Town: g.enemies is always empty there
// (goToTown()/startGame() both set it to []), so every "seek nearby enemy"
// branch below simply finds nothing and falls through to the idle
// follow-the-player behavior -- no separate Town-specific combat gate is
// needed, followers just naturally never fight in Town.
function updateFollowersAI(g, dt){
  const p = g.player, room = g.room;
  // followers (Knight tree): seek nearby enemies, attack on cooldown, obey stance.
  // Attack stance hunts aggressively (measured from the follower's own position,
  // not gated to the Knight's side) and its hits apply Bleed. Guard stance only
  // engages what's near the Knight and sticks much closer when idle.
  if(g.followers && g.followers.length){
    for(const f of g.followers){
      if(f.hitT>0) f.hitT-=dt;
      if(followerStatusTick(g, f, dt)) continue;
      if(f.atkCd>0) f.atkCd-=dt;
      if(f.battlecryCritT>0){ f.battlecryCritT-=dt; if(f.battlecryCritT<0) f.battlecryCritT=0; }
      f.animT += dt;
      if(f.shieldT>0){ f.shieldT -= dt; if(f.shieldT<=0){ f.shieldT = 0; f.shieldHp = 0; } }
      if(f.kind==='bear'){ const bsm = bearSizeMult(p); f.sizeMult = bsm; f.r = HUNTER_BEAR_R*(1+(bsm-1)*BEAR_HITBOX_SHARE); }
      // v267 Ambush: a short arcing leap onto the target, landing the bonus hit at the end
      if(f.leap){
        const L = f.leap; L.t += dt;
        const k = Math.min(1, L.t/L.dur), tg = L.target;
        const alive = tg && tg.hp>0 && g.enemies.indexOf(tg)>=0;
        const cx = alive ? tg.x : L.tx, cy = alive ? tg.y : L.ty;
        const off = (alive ? tg.r : 10) + f.r + 2;
        const ex = cx + Math.cos(L.ang)*off, ey = cy + Math.sin(L.ang)*off;
        f.x = clamp(L.sx + (ex-L.sx)*k, f.r, room.w-f.r); f.y = clamp(L.sy + (ey-L.sy)*k, f.r, room.h-f.r);
        f.leapZ = Math.sin(k*Math.PI) * (28 + Math.min(40, L.d*0.12));
        f.moving = true;
        const fa = Math.atan2(cy-f.y, cx-f.x); f.facing = {x:Math.cos(fa), y:Math.sin(fa)}; f.faceSign = screenFacingSign(f.facing.x, f.facing.y);
        if(k>=1){ f.leap = null; f.leapZ = 0; f.atkCd = Math.max(f.atkCd, 0.3); if(alive) ambushLand(g, p, f, tg, L.mult); }
        continue;
      }
      // v267 Recall: companions dash back to you (no teleport) with a short shield
      if(f.recallDash>0){
        f.recallDash -= dt;
        const dd = dist(f,p), stopD = p.r + f.r + 26;
        if(dd > stopD){
          const a = Math.atan2(p.y-f.y, p.x-f.x), step = Math.min(dd-stopD+8, RECALL_DASH_SPEED*dt);
          f.x += Math.cos(a)*step; f.y += Math.sin(a)*step; f.moving = true;
          f.facing = {x:Math.cos(a), y:Math.sin(a)}; f.faceSign = screenFacingSign(f.facing.x, f.facing.y);
          g.particles.push({type:'burst', x:f.x, y:f.y, t:0.18, max:0.18, color:'#7dd45a'});
        } else f.recallDash = 0;
        if(f.recallDash<=0 && dist(f,p) > 320){ const ta = Math.random()*Math.PI*2; f.x = p.x + Math.cos(ta)*(p.r+f.r+14); f.y = p.y + Math.sin(ta)*(p.r+f.r+14); }
        continue;
      }
      // Bear companions are dedicated taunt units -- they draw aggro
      // whenever they're out. Knight followers in Guard stance only taunt
      // once Guard Stance (templarDefensiveStance) has actually been ranked.
      f.taunting = f.kind==='bear' ? true : (f.stance==='guard' && guardStanceTauntUnlocked(p));
      updateStuckTracking(f, dt);
      // Teleport-back failsafe: a follower that's been a long way from the
      // player, or visibly wedged in place, for more than a few seconds
      // snaps back to their side instead of staying lost off-screen.
      const distToPlayer = dist(f,p);
      if(distToPlayer > oneScreenDist() || (f._isStuck && !f._fighting)){
        f._farStuckT = (f._farStuckT||0) + dt;
      } else {
        f._farStuckT = 0;
      }
      if(f._farStuckT > FOLLOWER_STUCK_TELEPORT_TIME){
        const ta = Math.random()*Math.PI*2;
        f.x = p.x + Math.cos(ta)*(p.r+f.r+10);
        f.y = p.y + Math.sin(ta)*(p.r+f.r+10);
        f._farStuckT = 0; f._isStuck=false; f._stuckPos=null;
      }
      // Cat Companion (v81): a non-combat follower entirely -- it never
      // enters the enemy-seeking/attack code below at all. Instead it
      // seeks the nearest uncollected ground drop (g.loot) within
      // CAT_LOOT_SEEK_RANGE of the PLAYER (not the cat itself, so it
      // doesn't wander off fetching something from a room the player has
      // already left behind), beelines to it, and on arrival runs the
      // EXACT SAME pickup branch the walk-over "loot pickup" pass further
      // down this same update() uses for potion/gold/item -- including
      // leaving an item on the ground (and just moving on to the next
      // nearest drop next frame) if addToBag() reports the bag is full,
      // same as a manual walk-over pickup already does. With nothing to
      // fetch it just idles at a home spot behind the player, reusing the
      // same idle-follow/catch-up code every other follower kind uses.
      if(f.kind==='cat'){
        let nearestLoot=null, nearestLootD=Infinity;
        if(g.loot) for(const l of g.loot){
          if(l.dropGrace>0) continue; // still in its can't-be-picked-up-yet grace window
          // v87: Cat Companion refinement -- don't pick up player-dropped items
          // or health globes (potions). Cat only picks up naturally-dropped gold.
          if(lootIsManual(l)) continue; // skip player-dropped / manual-pickup items
          if(l.type==='potion') continue; // skip health globes
          if(dist(l,p) > CAT_LOOT_SEEK_RANGE) continue;
          const dl = dist(l,f);
          if(dl < nearestLootD){ nearestLootD = dl; nearestLoot = l; }
        }
        let catMoved = false;
        if(nearestLoot){
          const reach = nearestLoot.r + f.r + 6;
          if(nearestLootD > reach){
            const ang = steerAngleTo(f, nearestLoot.x, nearestLoot.y, room.obstacles);
            f.x += Math.cos(ang)*BASE_SPEED*1.1*dt; f.y += Math.sin(ang)*BASE_SPEED*1.1*dt;
            catMoved = true;
            const fAng2 = Math.atan2(nearestLoot.y-f.y, nearestLoot.x-f.x);
            f.facing = {x:Math.cos(fAng2), y:Math.sin(fAng2)};
            f.faceSign = screenFacingSign(f.facing.x, f.facing.y);
          } else {
            const li = g.loot.indexOf(nearestLoot);
            if(li>=0){
              const l = nearestLoot;
              if(l.type==='potion'){ p.hp = Math.min(p.maxHp, p.hp+p.maxHp*0.3); showMsg('+Health', 0.6); g.loot.splice(li,1); }
              else if(l.type==='gold'){ p.gold += l.amt; goldPop(g, l.x, l.y, l.amt); g.loot.splice(li,1); }
              else if(l.type==='item'){
                { const took = lootTake(p, l.item); if(took){   // v548: a full bag no longer stops an item you can wear right away
                  const eq = took==='equipped';
                  showMsg(eq ? 'Equipped: '+l.item.name : l.item.name, 1.5);
                  bagPulse(); g.loot.splice(li,1);
                } }
                // Bag full: same as a manual walk-over -- leave it on the
                // ground. The cat just tries the next-nearest drop instead
                // of getting stuck looping on this one.
              }
              else g.loot.splice(li,1);
            }
          }
        } else {
          const homeAng = followerHomeAngle(g.followers.indexOf(f), g.followers.length);
          const hx = p.x + Math.cos((Math.atan2(p.facing.y,p.facing.x))+Math.PI+homeAng)*FOLLOWER_FOLLOW_DIST;
          const hy = p.y + Math.sin((Math.atan2(p.facing.y,p.facing.x))+Math.PI+homeAng)*FOLLOWER_FOLLOW_DIST;
          const dh = Math.hypot(hx-f.x, hy-f.y);
          if(dh > 8){
            const returning = distToPlayer > FOLLOWER_ATTACK_LEASH_RANGE;
            const ang = returning ? Math.atan2(hy-f.y, hx-f.x) : steerAngleTo(f, hx, hy, room.obstacles);
            const catchUpT = clamp(dh/oneScreenDist(), 0, 1);
            const catchUpMult = FOLLOWER_CATCHUP_MULT_MIN + (FOLLOWER_CATCHUP_MULT_MAX-FOLLOWER_CATCHUP_MULT_MIN)*catchUpT;
            const spd = BASE_SPEED * catchUpMult * (f.chillT>0 ? PLAYER_CHILL_MULT : 1);
            f.x += Math.cos(ang)*spd*dt; f.y += Math.sin(ang)*spd*dt;
            catMoved = true;
          }
        }
        f.moving = catMoved;
        f.x = clamp(f.x, f.r, room.w-f.r);
        f.y = clamp(f.y, f.r, room.h-f.r);
        pushOutOfObstacles(f, room.obstacles);
        continue;
      }
      // Attack: hunt anything within seek range of the FOLLOWER itself.
      // Guard: only engage an enemy within engage range of the PLAYER.
      let nearest=null, nearestD=Infinity;
      for(const e of g.enemies){
        if(f.stance==='guard'){
          if(dist(e,p) > FOLLOWER_GUARD_ENGAGE_RANGE) continue;
        } else {
          if(dist(e,f) > FOLLOWER_ATTACK_SEEK_RANGE) continue;
          if(dist(e,p) > FOLLOWER_ATTACK_LEASH_RANGE) continue;
        }
        const de = dist(e,f);
        if(de < nearestD && hasLOS(g,f,e)){ nearestD = de; nearest = e; }
      }
      // Re-check every frame, not just at initial acquisition: if the
      // follower itself has drifted (chasing, or pushed by collision) past
      // the leash range from the player, break off even if the target
      // enemy is still technically within leash of the player's position --
      // this is what was letting followers keep fighting off-screen.
      if(nearest && distToPlayer > FOLLOWER_ATTACK_LEASH_RANGE) nearest = null;
      let moved = false;
      f._fighting = !!(nearest && nearestD <= FOLLOWER_ATK_REACH+nearest.r+14); // standing still to fight isn't being stuck
      if(nearest){
        if(nearestD > FOLLOWER_ATK_REACH){
          const ang = steerAngleTo(f, nearest.x, nearest.y, room.obstacles);
          f.x += Math.cos(ang)*BASE_SPEED*0.95*dt; f.y += Math.sin(ang)*BASE_SPEED*0.95*dt;
          moved = true;
        }
        const fAng2 = Math.atan2(nearest.y-f.y, nearest.x-f.x);
        f.facing = {x:Math.cos(fAng2), y:Math.sin(fAng2)};
        f.faceSign = screenFacingSign(f.facing.x, f.facing.y);
        if(nearestD <= FOLLOWER_ATK_REACH+nearest.r && f.atkCd<=0){
          f.atkCd = FOLLOWER_ATK_CD * (p.beastFuryT>0 ? BEAST_FURY_PET_ATK : 1);
          f.animT = 0;
          const dmg = Math.max(1, followerDmg(p, f)*huntMarkMult(p, nearest) - (nearest.armor||0));
          nearest.hp -= dmg; nearest.hitT = 0.15; spawnDmgNumber(g, nearest, dmg, false, {follower:1, col:'#9fd0ff'});
          markAttacked(nearest, f);
          if(f.kind==='wolf' || f.kind==='bear') packSlash(g, p, f, nearest, PACK_SLASH_MULT);
          if(f.kind==='wolf'){
            // Wolf companion hits apply Bleed unconditionally (this is its
            // signature attack), with the same red-cloud tick visual used
            // for every other Bleed source in the game.
            addBleed(nearest, dmg*BLEED_DPS_PCT*partBleedMult()*wolfFuryBleed(p), 'wolf', BLEED_DUR);
            g.particles.push({type:'burst', x:nearest.x, y:nearest.y, t:0.3, max:0.3, color:'#b4293f'});
            { const wlh = dmg * wolfLeechPct((p.skills && effectiveRank(p,'companionWolf')) || 0);
              if(wlh>0){ f.hp = Math.min(f.maxHp, f.hp + wlh); } }
          } else if(f.kind==='demon'){
            // Demon Bind (Necromancer, v78): the demon's hits life-leech a
            // rank-scaled % of the damage it just dealt, healing BOTH the
            // player (p.hp) AND the demon's own HP (f.hp) -- adapted from
            // the Dark Crypt Vampire's own lifesteal-on-hit pattern, split
            // across 2 recipients instead of 1 (see this skill's own top
            // comment).
            const dbRank = (p.skills && effectiveRank(p,'demonBind')) || 0;
            const healed = dmg * necroDemonLeechPct(dbRank);
            if(healed>0){
              p.hp = Math.min(p.maxHp, p.hp + healed);
              f.hp = Math.min(f.maxHp, f.hp + healed);
              g.particles.push({type:'burst', x:nearest.x, y:nearest.y, t:0.25, max:0.25, color:'#b4293f'});
            }
          } else if(f.kind==='skeleton'){
            // Skeleton (Raise Dead) minions: a plain hit, no extra effect
            // of their own -- their own specialty is Sacrifice, not an
            // on-hit ailment.
          } else if(f.stance==='attack'){
            // Offensive Stance (Templar, v56): once ranked, Squire/Knight-kind
            // followers' own attacks also apply Bleed, scaling in strength
            // with Offensive Stance's rank (same formula as the player's own
            // Offensive-Stance-boosted hits). Commander no longer has any
            // bearing on this -- its rank-up effect is follower max HP only.
            applyOffensiveStanceBleed(p, nearest, dmg);
          }
        }
      } else {
        // no target: drift back to a home spot behind the player. The angle
        // is computed from this follower's LIVE position in g.followers (not
        // its stored .idx), which used to go stale after a death+respawn and
        // could leave two followers sharing the same spot, looking like only
        // one was present. Guard stance sticks much closer than Attack.
        const followDist = f.stance==='guard' ? FOLLOWER_GUARD_FOLLOW_DIST : FOLLOWER_FOLLOW_DIST;
        const homeAng = followerHomeAngle(g.followers.indexOf(f), g.followers.length);
        let hx = p.x + Math.cos((Math.atan2(p.facing.y,p.facing.x))+Math.PI+homeAng)*followDist;
        let hy = p.y + Math.sin((Math.atan2(p.facing.y,p.facing.x))+Math.PI+homeAng)*followDist;
        // (v120) While the player stands still, followers mill about randomly in an
        // area around them -- including in front -- instead of standing in a line.
        const wandering = !p.moving && distToPlayer < FOLLOWER_WANDER_RADIUS*2.5;
        if(wandering){
          f.wanderT = (f.wanderT||0) - dt;
          if(!f.wanderOff || f.wanderT<=0){
            f.wanderT = rand(1.2, 3.4);
            if(Math.random()<0.3 && f.wanderOff){ f.wanderOff = {x:f.x-p.x, y:f.y-p.y}; } // pause where it is
            else {
              const wa = Math.random()*Math.PI*2, wr = rand(30, f.stance==='guard' ? FOLLOWER_WANDER_RADIUS*0.55 : FOLLOWER_WANDER_RADIUS);
              f.wanderOff = {x:Math.cos(wa)*wr, y:Math.sin(wa)*wr};
            }
          }
          hx = p.x + f.wanderOff.x; hy = p.y + f.wanderOff.y;
        } else { f.wanderOff = null; }
        const dh = Math.hypot(hx-f.x, hy-f.y);
        if(wandering && dh > 8){
          const wang = steerAngleTo(f, hx, hy, room.obstacles);
          f.x += Math.cos(wang)*BASE_SPEED*0.5*dt; f.y += Math.sin(wang)*BASE_SPEED*0.5*dt;
          f.facing = {x:Math.cos(wang), y:Math.sin(wang)}; f.faceSign = screenFacingSign(f.facing.x, f.facing.y);
          moved = true;
        } else if(dh > 8 && !wandering){
          // Disengaging from far away (well beyond leash range): beeline
          // straight back to the player, a bit faster, rather than picking
          // a careful path -- the priority is closing the gap, not combat
          // positioning. Close to home, use the normal obstacle steering.
          const returning = distToPlayer > FOLLOWER_ATTACK_LEASH_RANGE;
          const ang = returning ? Math.atan2(hy-f.y, hx-f.x) : steerAngleTo(f, hx, hy, room.obstacles);
          // Catch-up speed scales with how far behind the follower
          // currently is (dh, distance to its home spot), from
          // FOLLOWER_CATCHUP_MULT_MIN right as it starts trailing up to
          // FOLLOWER_CATCHUP_MULT_MAX as it approaches oneScreenDist() --
          // see those constants' comments for why a flat multiplier
          // wasn't enough to reliably keep pace with the player.
          const catchUpT = clamp(dh/oneScreenDist(), 0, 1);
          const catchUpMult = FOLLOWER_CATCHUP_MULT_MIN + (FOLLOWER_CATCHUP_MULT_MAX-FOLLOWER_CATCHUP_MULT_MIN)*catchUpT;
          const spd = BASE_SPEED * catchUpMult * (f.chillT>0 ? PLAYER_CHILL_MULT : 1);
          f.x += Math.cos(ang)*spd*dt; f.y += Math.sin(ang)*spd*dt;
          moved = true;
        }
      }
      f.moving = moved;
      f.x = clamp(f.x, f.r, room.w-f.r);
      f.y = clamp(f.y, f.r, room.h-f.r);
      pushOutOfObstacles(f, room.obstacles);
    }
    // Keep followers from stacking on top of each other (or the player) --
    // their sprites would otherwise fully overlap and hide one another.
    for(let i=0;i<g.followers.length;i++){
      const f = g.followers[i];
      const dp = dist(f,p);
      const minDp = f.r+p.r+4;
      if(dp>0.001 && dp<minDp){
        const ang = Math.atan2(f.y-p.y, f.x-p.x);
        const push = minDp-dp;
        f.x += Math.cos(ang)*push; f.y += Math.sin(ang)*push;
      }
      for(let j=i+1;j<g.followers.length;j++){
        const f2 = g.followers[j];
        const d2 = dist(f,f2);
        const minD = f.r+f2.r+4;
        if(d2 < minD){
          const ang = d2>0.001 ? Math.atan2(f2.y-f.y, f2.x-f.x) : Math.random()*Math.PI*2;
          const push = (minD-d2)/2;
          f.x -= Math.cos(ang)*push; f.y -= Math.sin(ang)*push;
          f2.x += Math.cos(ang)*push; f2.y += Math.sin(ang)*push;
        }
      }
      f.x = clamp(f.x, f.r, room.w-f.r);
      f.y = clamp(f.y, f.r, room.h-f.r);
    }
  }

  // A fallen follower rejoins on its own after FOLLOWER_RESPAWN_TIME, so a
  // multi-follower Squire always works back up to full strength mid-level
  // instead of staying down a minion until the level is cleared.
  // Wolves and bears have their own shorter 5-second respawn timer.
  if(g.followerPending && g.followerPending.length){
    let back = false;
    for(let i=g.followerPending.length-1;i>=0;i--){
      g.followerPending[i].t -= dt;
      if(g.followerPending[i].t<=0){
        const pe = g.followerPending[i];
        g.followerPending.splice(i,1); back = true;
        if(pe.soul){   // v460: a held soul raises it; with none left it stays down until you cast Raise Skeletons
          if((p.souls||0) >= NECRO_RESPAWN_SOULS){ p.souls -= NECRO_RESPAWN_SOULS; g.particles.push({type:'burst', x:p.x, y:p.y, t:0.35, max:0.35, color:'#a06ad0'}); }
          else p.skelDown = (p.skelDown||0) + 1;
        }
      }
    }
    if(back){ const n0 = g.followers.length; ensureFollowers(g); for(let k=n0;k<g.followers.length;k++){ const nf = g.followers[k]; nf.x = p.x; nf.y = p.y; if(nf.kind==='skeleton') nf.riseT = 0.7; g.particles.push({type:'burst', x:p.x, y:p.y, t:0.35, max:0.35, color:'#cfe8ff'}); } }
  }
  // v530: a skeleton left down for want of a soul rises as soon as you hold one again (it used to wait for a recast)
  if((p.skelDown||0) > 0 && !p.skelHold && (p.souls||0) >= NECRO_RESPAWN_SOULS && !followerPendingCount(g, 'skeleton')){
    p.skelDown--; (g.followerPending || (g.followerPending = [])).push({kind:'skeleton', t:skelSoulRaiseDelay(), soul:true});
  }
  for(const f of g.followers) if(f.riseT>0) f.riseT -= dt;
  if(p.companionRespawnCd>0) p.companionRespawnCd -= dt;
  if(p.companionRespawnCd<=0) ensureFollowers(g);
  {
    const squireRank = effectiveRank(p,'squire')||0;
    const wolfRank = effectiveRank(p,'companionWolf')||0;
    const bearRank = effectiveRank(p,'companionBear')||0;
    // Necromancer (v78): Raise Dead's standing skeleton minions rejoin the
    // same way a fallen Knight/Wolf/Bear does -- demon is deliberately NOT
    // included here (see ensureFollowers' own comment: it never
    // auto-respawns, only re-summons on its own soul-threshold trigger).
    const raiseDeadRank = effectiveRank(p,'raiseDead')||0;
    const wantedKnight = squireFollowerCount(squireRank);
    // v80+: Summon Wolf is now passive -- wolves auto-spawn based on rank
    // with a 5-second respawn timer when they fall (handled separately above).
    const wantedWolf = wolfRank>0 ? (wolfRank>=5 ? 2 : 1) : 0;
    const wantedBear = bearRank>0 ? 1 : 0;
    const wantedSkeleton = raiseDeadRank>0 ? squireFollowerCount(raiseDeadRank) : 0;
    const wantedFollowers = wantedKnight + wantedWolf + wantedBear + wantedSkeleton;
    if(false && g.followers.length < wantedFollowers){   // v239: superseded by g.followerPending timers
      if(g.followerRespawnCd>0) g.followerRespawnCd -= dt;
      else {
        const haveKnight = g.followers.filter(f=>(f.kind||'knight')==='knight').length;
        const haveWolf = g.followers.filter(f=>f.kind==='wolf').length;
        const haveBear = g.followers.filter(f=>f.kind==='bear').length;
        let kind = 'knight';
        if(haveKnight >= wantedKnight){
          if(haveWolf < wantedWolf) kind = 'wolf';
          else if(haveBear < wantedBear) kind = 'bear';
          else kind = 'skeleton';
        }
        const nf = makeFollower(p, g.followers.length, kind);
        nf.x = p.x; nf.y = p.y;
        g.followers.push(nf);
        if(g.followers.length < wantedFollowers) g.followerRespawnCd = (kind==='skeleton') ? followerRespawnTime(p,'skeleton') : (kind==='knight' ? knightRespawnTime(p) : FOLLOWER_RESPAWN_TIME);
      }
    } else {
      g.followerRespawnCd = 0;
    }
  }
}

