// ---------- Game State ----------
let game = null;
// Pass a saved-progress object (from loadSavedGame()) to resume a character
// instead of rolling a fresh one. Loaded characters always resume in Town.
function newGame(saved, cls){
  const player = {
    cls: cls || 'warrior',
    saveId: (saved && saved.id) || genSaveId(),
    x:0,y:0,r:16,facing:{x:0,y:-1},
    hp:null,maxHp:null,mp:null,maxMp:null,
    level:1, xp:0, xpNext:92, gold:0,
    atkCd:0, atkCdMax:0.46,
    dodgeCd:0, dodgeCdMax:DODGE_CD_BASE,
    // v79 (Finesse): dodgeCharges is a small charge counter -- 1 normally,
    // 2 once Finesse has any rank (see dodgeMaxCharges). Starts full.
    dodgeCharges:1,
    dodging:false, dodgeT:0, dodgeDur:0.24, dodgeDir:{x:0,y:0},
    blocking:false,
    invuln:0, hitFlash:0,
    animT:0, moving:false, faceSign:1, atkAnimT:0, castAnimT:0, movementStopT:0,
    skillPoints:0, skills:{leap:0,soulFire:0,  unbreakable:0, ironSkin:0, shieldBash:0, riposte:0, shieldThrow:0, guardian:0, weaponsSpecialist:0, bloodlust:0, whirlwind:0, cleave:0, fury:0, assault:0, squire:0, commander:0, rally:0, offensiveStance:0, templarDefensiveStance:0, battlecry:0, companionWolf:0, companionBear:0, trap:0, sap:0, evasion:0, execute:0, shadowStep:0, vanish:0, bowExpert:0, rapidShot:0, multiShot:0, arrowEye:0, trueShot:0, preciseShot:0, cripplingShot:0, stunShot:0, packTactics:0, fieldDress:0, lightningArc:0, lightningChain:0, nova:0, tornado:0, storm:0, hurricane:0, elementalPolarity:0, fireball:0, iceBolt:0, immolate:0, flameVortex:0, permafrost:0, thunderstep:0, elementalExplosions:0, fireBomb:0, iceArmor:0, pyroTorrent:0, blizzard:0, fear:0, raiseDead:0, soulSap:0, sacrifice:0, demonBind:0, plague:0, survivalFieldDress:0, aimedShot:0, longshot:0, deadeye:0, huntersBond:0, beastFury:0, huntersMark:0, markedPrey:0, explosiveTrap:0, trapMastery:0, survivalInstinct:0, opportunist:0, poisonTrap:0, frostTrap:0, finesse:0, rainOfArrows:0, recall:0},
    // v74: which active skill fires from each of the 4 generic buttons --
    // Main defaults to the basic Strike attack (same as the pre-v74 behavior
    // of the STRIKE button); 1/2/3 default unassigned. Dodge is intentionally
    // NOT part of this map -- it's permanent/fixed, never reassignable.
    skillSlots:{main:'strike', slot1:null, slot2:null, slot3:null},
    checkpointDepth:1, deaths:0,
    // Set the first time enterMountainPass() runs; combined with
    // checkpointDepth>1 (already the Mine-portal-in-town unlock condition),
    // this gates the permanent Town waypoint's Teleport option -- see
    // makeTown()'s waypoint landmark and updateTown()'s nearWaypoint check.
    reachedMountainPass:false,
    reachedIcySummit:false,
    reachedRedridge:false, reachedFrostholdWp:false, reachedCrater:false, gojiraSlain:false, obsidianTaken:false, dragonboltGiven:false, hunterRuneRewarded:false, runeforgeUnlocked:false,
    shrineBlessed:false,
    shrineStage:0, scholarEast:false, fhCmdSlain:false, fhCmdLooted:false, constructSlain:false, heartstoneDone:false, witchPotionStarted:false, frostholdUnlocked:false, snowWallOpen:false, heartstoneTaken:false, defilerSlain:false, inscriptionTaken:false, scholarMet:false, scholarMeet:false, scholarLeft:false, ruinsEvent:0, scholarRead:false, fhDungeonKey:false, fhDungeonOpen:false, fhDungeonDone:false, redridgeWallOpen:false, npcMarks:{},
    // Set the first time enterSunlitPlains() runs -- same role as
    // reachedMountainPass above, but for the Withered Crossroads Teleport option
    // (see openTeleportMenu). Kept as a separate flag rather than reusing
    // reachedMountainPass since the two zones are reached independently
    // (different branches off the Dark Forest).
    reachedSunlitPlains:false,
    reachedRiverValley:false, bridgeCleared:false, bridgeChiefDead:false,
    // Set the first time enterLighthouseTower() runs on floor 1, and
    // separately on first reaching the rooftop (floor 5) -- each gates its
    // own "Lighthouse Tower Level 1"/"Level 5" Teleport option, same
    // pattern as reachedSunlitPlains above.
    reachedLighthouseTower:false,
    reachedLighthouseTowerTop:false,
    // Set the first time enterLakesideRuins() runs -- same role as
    // reachedSunlitPlains/reachedLighthouseTower above, for the Lakeside
    // Ruins Teleport option.
    reachedLakesideRuins:false,
    reachedBlackMarsh:false, reachedForgottenTower:false,
    // Set the first time enterCursedCemetery() runs -- same role as
    // reachedSunlitPlains/reachedLakesideRuins above, for the Cursed
    // Cemetery Teleport option.
    reachedCursedCemetery:false,
    // v72: set once, permanently, the first time ALL enemies in Cursed
    // Cemetery are cleared in a single visit -- see the zone's own
    // g.scene==='cursedcemetery' branch in update(). This is the "one-time
    // event" the brief asks for: once true, the tomb entrance landmark is
    // drawn unlocked/open and becomes interactable (see g.cem.tomb) for
    // every future visit and save/reload, exactly like p.checkpointDepth
    // permanently unlocking a Mine checkpoint.
    cemeteryCleared:false,
    // v73: Dark Crypt (batch 6). reachedDarkCrypt mirrors reachedCursedCemetery
    // above -- set the first time enterDarkCrypt() runs, gating the Dark
    // Crypt Teleport option. darkCryptChestLooted is the PERMANENT one-shot
    // flag for the Ruins Map chest at the far end -- once true the chest is
    // drawn already-open and can never be looted again, exactly like
    // cemeteryCleared above is a permanent one-time flip rather than
    // per-visit g.chest state (which resets every time a zone is re-entered).
    reachedDarkCrypt:false, darkCryptCp:false,
    darkCryptChestLooted:false,
    reachedAncientRuins:false, ruinsEntranceOpen:false, ancientRuinsChestLooted:false, sunkenChestLooted:false, poolChestLooted:false, heartChestLooted:false, colossusSlain:false,
    barStock:null, barRestockAt:0, vendorRestockAt:0, beerT:0, coffeeT:0,
    reachedMineWp:false, reachedFhdWp:false, reachedHighwardWp:false, reachedDeepWp:false, reachedCliffWp:false, reachedKeepWp:false, reachedHoldWp:false, sleptAt:0, sleptBed:0, wellRestedT:0, breachReached:false, reachedRingWp:false, breachBest:0, breachClears:0, wraithLordSlain:false, breachContained:false, runesPlaced:{}, wlRework427:true, wlReset435:true, skGateOpen:false, keepLore:{}, keepMaps:{}, tpBeacons:[], harpyQueenSlain:false, harpyTalonTaken:false, highwardSlain:false, hwCrossing:false, hwRuneTaken:false, hwSwitchOn:false, hwMapFound:false, wayfarerMet:false, scholarWarnedRR:false, scholarThirdRead:false, scholarKeyTalk:false, rrBeacons:{}, mineDeepest:0, balrogSlain:false, hammerTaken:false, smithSockets:false, socketUses:0, ftMapFound:false,
    shieldBashCd:0, shieldBashCdMax:BASE_ATK_CD,
    shieldThrowCd:0, shieldThrowCdMax:SHIELD_THROW_CD,
    guardianCd:0, guardianCdMax:GUARDIAN_CD, guardianT:0,
    whirlwindCd:0, whirlwindCdMax:WHIRLWIND_CD, whirlwindT:0, whirlwindTick:0,
    leapCd:0, leapCdMax:LEAP_CD, leapT:0, unbreakCd:0, unbreakCdMax:UNBREAK_CD, unbreakT:0, unbreakRank:1,
    battlecryCd:0, battlecryCdMax:BATTLECRY_CD,
    vengeanceCd:0, vengeanceCdMax:VENG_CD, bannerCd:0, bannerCdMax:BANNER_CD, consecrateCd:0, consecrateCdMax:CONS_CD, judgmentCd:0, judgmentCdMax:JUDG_CD, bulwarkCd:0, bulwarkCdMax:BULWARK_CD, bloodrageCd:0, bloodrageCdMax:BLOODRAGE_CD, bulwarkT:0, bulwarkStore:0, bloodrageT:0, rampageStacks:0, rampageT:0, bannerNext:'war',
    assaultCd:0, assaultCdMax:ASSAULT_CD, assaultT:0, assaultDurMax:0,
    stanceCd:0,
    rallyCd:0, rallyCdMax:RALLY_CD, rallyT:0, rallyDurMax:0,
    trapCd:0, trapCdMax:TRAP_CD,
    shadowStepCd:0, shadowStepCdMax:SHADOW_STEP_CD[0],
    vanishCd:0, vanishCdMax:VANISH_CD, vanishT:0,
    rapidShotCd:0, rapidShotCdMax:RAPID_SHOT_CD, rapidShotBurst:null,
    cripplingShotCd:0, cripplingShotCdMax:CRIPPLING_SHOT_CD,
    stunShotCd:0, stunShotCdMax:STUN_SHOT_CD,
    aimedShotCd:0, aimedShotCdMax:AIMED_SHOT_CD, beastFuryCd:0, beastFuryCdMax:BEAST_FURY_CD, beastFuryT:0, huntersMarkCd:0, huntersMarkCdMax:HMARK_CD, explosiveTrapCd:0, explosiveTrapCdMax:6, oppT:0, deadeyeGainCd:0,
    packTacticsCd:0, packTacticsCdMax:PACK_TACTICS_CD,
    fieldDressing:false, fieldDressCd:0, fieldDressCdMax:FIELD_DRESS_CD,
    // v79 batch: Survivalist's Field Dress, Poison Trap, Frost Trap, and
    // Marksman's Rain of Arrows.
    fieldDressing2:false, survivalFieldDressCd:0, survivalFieldDressCdMax:SURV_FIELD_DRESS_CD_BASE,
    poisonTrapCd:0, poisonTrapCdMax:POISON_TRAP_CD, survPoisonCloud:null,
    frostTrapCd:0, frostTrapCdMax:FROST_TRAP_CD,
    rainOfArrowsCd:0, rainOfArrowsCdMax:RAIN_OF_ARROWS_CD, rainOfArrowsPending:null,
    // v80 batch: Hunter tree rework -- Summon Wolf (now passive, auto-summoned;
    // p.companionRespawnCd tracks the 5-second respawn timer after a wolf/bear falls).
    // Recall skill: p.recallT is the temporary dmg/regen buff window; p.recallDmgBonusVal/
    // p.recallRegenPctVal cache that cast's rank-scaled buff strength.
    companionRespawnCd:0,
    recallCd:0, recallCdMax:RECALL_CD, recallT:0, recallDmgBonusVal:0, recallRegenPctVal:0,
    aiming:false, aimT:0, aimDir:{x:0,y:-1},
    // Djinn tree (Mystic, v75): Nova/Tornado/Storm/Hurricane cooldown +
    // active-duration state, same field-pair convention every other
    // active skill above already uses (X Cd/CdMax, plus X T/TMax for the
    // ones with an ongoing duration).
    novaCd:0, novaCdMax:NOVA_CD,
    tornadoCd:0, tornadoCdMax:TORNADO_CD,
    stormCd:0, stormCdMax:STORM_CD, stormT:0, stormDurMax:0,
    hurricaneCd:0, hurricaneCdMax:HURRICANE_CD, hurricaneT:0, hurricaneDurMax:0, hurricaneTick:0,
    // Elementalist tree (Mystic, v76): Fireball/Ice Bolt (the 2 virtual
    // skills Elemental Polarity grants) plus Fire Bomb/Ice Armor/Pyro
    // Torrent/Blizzard cooldown + active-duration state, same field-pair
    // convention as Djinn's above.
    fireballCd:0, fireballCdMax:FIREBALL_CD,
    iceBoltCd:0, iceBoltCdMax:ICE_BOLT_CD,
    fireBombCd:0, fireBombCdMax:FIRE_BOMB_CD,
    immolateCd:0, immolateCdMax:IMMOLATE_CD, immolateT:0, flameVortexCd:0, flameVortexCdMax:FLAME_VORTEX_CD, permafrostCd:0, permafrostCdMax:PERMAFROST_CD, iceArmorCd:0, iceArmorCdMax:ICE_ARMOR_CD, iceArmorT:0, iceArmorHp:0, iceArmorMax:0,
    stormcallCd:0, stormcallCdMax:STORMCALL_CD, staticStacks:0, windDist:0, windReady:false, stormcalls:[],
    meteorCd:0, meteorCdMax:BLIZZARD_CD, meteorFx:[], raiseDeadCd:0, raiseDeadCdMax:RAISE_DEAD_CD, skelDown:0,
    pyroTorrentCd:0, pyroTorrentCdMax:PYRO_TORRENT_CD, pyroTorrentT:0, pyroTorrentDurMax:0, pyroTorrentTick:0, pyroTorrentAng:0,
    blizzardCd:0, blizzardCdMax:BLIZZARD_CD,
    // Necromancer tree (Mystic, v78): souls -- a new persistent player
    // resource, capped at SOUL_CAP, saved/loaded exactly like gold (see
    // saveGame/newGame's `saved.souls` restore below) -- plus Fear/
    // Sacrifice/Plague's own cooldown state, same field-pair convention
    // as every other active skill above.
    souls:0,
    fearCd:0, fearCdMax:FEAR_CD_BASE, soulFireCd:0, soulFireCdMax:SOULFIRE_CD,
    plagueCd:0, plagueCdMax:PLAGUE_CD, plagueZone:null, soulGateCd:0, soulGateCdMax:SOULGATE_CD, hungerT:0,
    preciseShotCd:0, preciseShotCdMax:BASE_ATK_CD,
    equipment:{helm:null,armor:null,amulet:null,ring1:null,ring2:null,boots:null,gloves:null,belt:null,mainhand:null,offhand:null},
    inventory:[],
    quests:[],
    dmgBonus:0, weaponReachBonus:0, critChance:0, armor:0, evasion:0, speed:BASE_SPEED,
  };
  if(saved){
    player.level = saved.level||1;
    player.xp = saved.xp||0;
    player.xpNext = xpForLevel(player.level);
    if(!saved.xpCurve3 && player.level>28){ const oldNext = 92*Math.pow(1.2, player.level-1); player.xp = Math.floor(clamp((saved.xp||0)/oldNext,0,0.999)*player.xpNext); }   // v433: keep your % progress when the XP curve changed
    player.gold = saved.gold||0;
    player.souls = clamp(saved.souls||0, 0, SOUL_CAP);
    player.skillPoints = saved.skillPoints||0;
    if(saved.skills && saved.skills.fortify!=null){ if(saved.skills.riposte==null) saved.skills.riposte = saved.skills.fortify; delete saved.skills.fortify; }   // v369: Fortify was renamed Riposte
    if(saved.skills) Object.assign(player.skills, saved.skills);
    // v227 Ranger redesign: old Ranger builds get every skill point back once (the trees changed)
    if((saved.cls||cls)==='ranger' && !saved.rangerV227){
      let refund = 0; for(const k in player.skills){ refund += player.skills[k]||0; player.skills[k] = 0; }
      player.skillPoints = (player.skillPoints||0) + refund;
      saved.skillSlots = {main:'strike', slot1:null, slot2:null, slot3:null};
      player.rangerRespecced = refund>0;
    }
    if(player.skills.defensiveStance){ player.skillPoints = (player.skillPoints||0) + player.skills.defensiveStance; }   // v189: Defensive Stance was merged into Iron Skin -- refund its points
    delete player.skills.defensiveStance;
    if(saved.skillSlots) Object.assign(player.skillSlots, saved.skillSlots);
    // v266 warrior redesign: Defender and Templar changed completely -- refund those points once
    if((saved.cls||cls)==='warrior' && !saved.warriorV266){
      let rf = 0; for(const k of OLD_WARRIOR_REFUND_IDS){ rf += player.skills[k]||0; player.skills[k] = 0; }
      player.skillPoints = (player.skillPoints||0) + rf;
      for(const sk of Object.keys(player.skillSlots)) if(OLD_WARRIOR_REFUND_IDS.indexOf(player.skillSlots[sk])>=0) player.skillSlots[sk] = (sk==='main' ? 'strike' : null);
      player.warriorRespecced = rf>0;
    }
    // v267 Ranger rework: every Ranger tree changed -- refund all points once
    if((saved.cls||cls)==='ranger' && !saved.rangerV267){
      let rf2 = 0; for(const tk of Object.keys(RANGER_SKILL_TREES)) for(const nd of RANGER_SKILL_TREES[tk].nodes){ rf2 += player.skills[nd.id]||0; player.skills[nd.id] = 0; }
      player.skillPoints = (player.skillPoints||0) + rf2;
      player.skillSlots = {main:'strike', slot1:null, slot2:null, slot3:null};
      player.rangerRespecced = rf2>0;
    }
    // v268 Necromancer rework: refund necromancer points once
    if((saved.cls||cls)==='mystic' && !saved.mysticV268){
      let rf3 = 0; for(const k of NECRO_TREE_IDS){ rf3 += player.skills[k]||0; player.skills[k] = 0; }
      player.skillPoints = (player.skillPoints||0) + rf3;
      for(const sk of Object.keys(player.skillSlots)) if(NECRO_TREE_IDS.indexOf(player.skillSlots[sk])>=0) player.skillSlots[sk] = (sk==='main' ? 'strike' : null);
    }
    // v269 Elementalist + Djinn rework: refund both trees once
    if((saved.cls||cls)==='mystic' && !saved.mysticV269){
      let rf4 = 0; const ids4 = ELEMENTALIST_NODE_IDS.concat(DJINN_NODE_IDS);
      for(const k of ids4){ rf4 += player.skills[k]||0; player.skills[k] = 0; }
      player.skillPoints = (player.skillPoints||0) + rf4;
      for(const sk of Object.keys(player.skillSlots)) if(ids4.indexOf(player.skillSlots[sk])>=0) player.skillSlots[sk] = (sk==='main' ? 'strike' : null);
    }
    // v270: Fire Bomb was removed -- refund its points once
    if(!saved.mysticV270){
      const fbPts = player.skills.fireBomb||0;
      if(fbPts>0){ player.skillPoints = (player.skillPoints||0) + fbPts; player.skills.fireBomb = 0; }
      for(const sk of Object.keys(player.skillSlots)) if(player.skillSlots[sk]==='fireBomb') player.skillSlots[sk] = (sk==='main' ? 'strike' : null);
    }
    // v454: Berserker (Bloodlust removed, Reave added), Marksman and Survivalist were rearranged -- refund those trees once
    if(!saved.skillsV454){
      const c454 = saved.cls||cls;
      const ids454 = c454==='warrior' ? BERSERKER_IDS_V2.concat(['bloodlust'])
        : c454==='ranger' ? RANGER_SKILL_TREES.marksman.nodes.map(n=>n.id).concat(RANGER_SKILL_TREES.survivalist.nodes.map(n=>n.id), V454_RANGER_REMOVED)
        : [];
      let rf5 = 0; for(const k of ids454){ rf5 += player.skills[k]||0; player.skills[k] = 0; }
      if(rf5>0){
        player.skillPoints = (player.skillPoints||0) + rf5;
        for(const sk of Object.keys(player.skillSlots)) if(ids454.indexOf(player.skillSlots[sk])>=0) player.skillSlots[sk] = (sk==='main' ? 'strike' : null);
        player.respec454 = true;
        setTimeout(()=>{ try{ showMsg('Skill trees were updated -- '+rf5+' skill points refunded', 5, '#ffd27a'); }catch(e){} }, 1500);
      }
    }
    // v455: Bloodrage and Marked Prey removed, Hunter's Mark moved, Templar tree rearranged -- refund those once
    if(!saved.skillsV455){
      const c455 = saved.cls||cls;
      const ids455 = c455==='warrior' ? ['bloodrage'].concat(TEMPLAR_IDS_V2) : c455==='ranger' ? ['markedPrey','huntersMark'] : [];
      let rf6 = 0; for(const k of ids455){ rf6 += player.skills[k]||0; player.skills[k] = 0; }
      if(rf6>0){
        player.skillPoints = (player.skillPoints||0) + rf6;
        for(const sk of Object.keys(player.skillSlots)) if(ids455.indexOf(player.skillSlots[sk])>=0) player.skillSlots[sk] = (sk==='main' ? 'strike' : null);
        setTimeout(()=>{ try{ showMsg('Skill trees were updated -- '+rf6+' skill points refunded', 5, '#ffd27a'); }catch(e){} }, 1800);
      }
    }
    // v459: all three Warrior trees rearranged (Charge/Reave, Blood Harvest merged, Templar swap, new Defender skills) -- refund once
    if(!saved.skillsV459 && (saved.cls||cls)==='warrior'){
      const ids459 = BERSERKER_IDS_V2.concat(TEMPLAR_IDS_V2, DEFENDER_IDS_V2);
      let rf7 = 0; for(const k of ids459){ rf7 += player.skills[k]||0; player.skills[k] = 0; }
      if(rf7>0){
        player.skillPoints = (player.skillPoints||0) + rf7;
        for(const sk of Object.keys(player.skillSlots)) if(ids459.indexOf(player.skillSlots[sk])>=0) player.skillSlots[sk] = (sk==='main' ? 'strike' : null);
        setTimeout(()=>{ try{ showMsg('Warrior skill trees were updated -- '+rf7+' skill points refunded', 5, '#ffd27a'); }catch(e){} }, 2100);
      }
    }
    // v460: War Cry, Death Bolt, Elemental Explosions and Flame Vortex removed; Hunter/Survivalist rows moved; Raise Skeletons and Pyro Torrent changed -- refund those once
    if(!saved.skillsV460){
      const c460 = saved.cls||cls;
      const ids460 = c460==='warrior' ? ['battlecry'] : c460==='ranger' ? ['survivalInstinct','explosiveShot','huntersMark','recall','companionBear'] : c460==='mystic' ? ['deathBolt','elementalExplosions','flameVortex','pyroTorrent'] : [];
      let rf8 = 0; for(const k of ids460){ rf8 += player.skills[k]||0; player.skills[k] = 0; }
      if(rf8>0){
        player.skillPoints = (player.skillPoints||0) + rf8;
        for(const sk of Object.keys(player.skillSlots)) if(ids460.indexOf(player.skillSlots[sk])>=0) player.skillSlots[sk] = (sk==='main' ? 'strike' : null);
        setTimeout(()=>{ try{ showMsg('Skill trees were updated -- '+rf8+' skill points refunded', 5, '#ffd27a'); }catch(e){} }, 2400);
      }
    }
    // v466: the Djinn tree was rebuilt as a lightning bolt (new skills, new rows) -- refund it once
    if(!saved.skillsV466 && (saved.cls||cls)==='mystic'){
      let rf9 = 0; for(const k of DJINN_NODE_IDS){ rf9 += player.skills[k]||0; player.skills[k] = 0; }
      if(rf9>0){
        player.skillPoints = (player.skillPoints||0) + rf9;
        for(const sk of Object.keys(player.skillSlots)) if(DJINN_NODE_IDS.indexOf(player.skillSlots[sk])>=0) player.skillSlots[sk] = (sk==='main' ? 'strike' : null);
        setTimeout(()=>{ try{ showMsg('The Djinn tree was rebuilt -- '+rf9+' skill points refunded', 5, '#ffd27a'); }catch(e){} }, 2600);
      }
    }
    if(!saved.skillsV475 && (saved.cls||cls)==='mystic'){   // v475: Djinn and Necromancer layouts changed
      const ids = DJINN_NODE_IDS.concat(NECROMANCER_NODE_IDS); let rf = 0;
      for(const k of ids){ rf += player.skills[k]||0; player.skills[k] = 0; }
      if(rf>0){
        player.skillPoints = (player.skillPoints||0) + rf;
        for(const sk of Object.keys(player.skillSlots)) if(ids.indexOf(player.skillSlots[sk])>=0) player.skillSlots[sk] = (sk==='main' ? 'strike' : null);
        setTimeout(()=>{ try{ showMsg('The Djinn and Necromancer trees were rearranged -- '+rf+' skill points refunded', 5, '#ffd27a'); }catch(e){} }, 2800);
      }
    }
    if(saved.skillsV475 && !saved.skillsV476 && (saved.cls||cls)==='mystic'){   // v476: Soul Hunger / Soul Shield links changed
      let rf = 0; for(const k of NECROMANCER_NODE_IDS){ rf += player.skills[k]||0; player.skills[k] = 0; }
      if(rf>0){
        player.skillPoints = (player.skillPoints||0) + rf;
        for(const sk of Object.keys(player.skillSlots)) if(NECROMANCER_NODE_IDS.indexOf(player.skillSlots[sk])>=0) player.skillSlots[sk] = (sk==='main' ? 'strike' : null);
        setTimeout(()=>{ try{ showMsg('The Necromancer tree was rearranged -- '+rf+' skill points refunded', 5, '#ffd27a'); }catch(e){} }, 2800);
      }
    }
    if(!saved.skillsV477 && (saved.cls||cls)==='ranger'){   // v477: Marksman and Hunter rows changed
      const ids = Object.keys(RANGER_SKILL_TREES).filter(k=>k==='marksman'||k==='hunter').reduce((a,k)=>a.concat(RANGER_SKILL_TREES[k].nodes.map(n=>n.id)), []);
      let rf = 0; for(const k of ids){ rf += player.skills[k]||0; player.skills[k] = 0; }
      if(rf>0){
        player.skillPoints = (player.skillPoints||0) + rf;
        for(const sk of Object.keys(player.skillSlots)) if(ids.indexOf(player.skillSlots[sk])>=0) player.skillSlots[sk] = (sk==='main' ? 'strike' : null);
        setTimeout(()=>{ try{ showMsg('The Marksman and Hunter trees were rearranged -- '+rf+' skill points refunded', 5, '#ffd27a'); }catch(e){} }, 2800);
        try{ ensureFollowers(game); }catch(e){}
      }
    }
    if(!saved.skillsV480 && (saved.cls||cls)==='warrior'){   // v480: Commander and Battle Standard swapped places
      const ids = SKILL_TREES.templar.nodes.map(n=>n.id); let rf = 0;
      for(const k of ids){ rf += player.skills[k]||0; player.skills[k] = 0; }
      if(rf>0){
        player.skillPoints = (player.skillPoints||0) + rf;
        for(const sk of Object.keys(player.skillSlots)) if(ids.indexOf(player.skillSlots[sk])>=0) player.skillSlots[sk] = (sk==='main' ? 'strike' : null);
        setTimeout(()=>{ try{ showMsg('The Templar tree was rearranged -- '+rf+' skill points refunded', 5, '#ffd27a'); }catch(e){} }, 2800);
      }
    }
    try{ player.quests = (player.quests||[]).filter(q=>!(q && q.id==='hidden_secrets')); player.inventory = (player.inventory||[]).filter(it=>!(it && it.questId==='ruins_map')); }catch(e){}   // v483
    try{ for(const q of (player.quests||[])) if(q && q.id==='light_the_way' && typeof q.desc==='string') q.desc = q.desc.replace('(through the Dark Forest)', '(through River Valley)'); }catch(e){}   // v481
    if(!saved.skillsV489){   // v489: Necromancer redesigned (Soul Fire replaces Soul Nova) and Hunter's Bond / Beast Fury moved
      const c0 = saved.cls||cls, ids = c0==='mystic' ? NECRO_TREE_IDS.filter(k=>k!=='deathBolt') : c0==='ranger' ? ['huntersBond','beastFury','huntersMark'] : [];
      let rf = 0;
      for(const k of ids){ rf += player.skills[k]||0; player.skills[k] = 0; }
      if(rf>0){
        player.skillPoints = (player.skillPoints||0) + rf;
        for(const sk of Object.keys(player.skillSlots)) if(ids.indexOf(player.skillSlots[sk])>=0) player.skillSlots[sk] = (sk==='main' ? 'strike' : null);
        setTimeout(()=>{ try{ showMsg((c0==='mystic' ? 'The Necromancer' : 'The Hunter')+' tree was rearranged -- '+rf+' skill points refunded', 5, '#ffd27a'); }catch(e){} }, 2800);
      }
    }
    if(!saved.skillsV492 && (saved.cls||cls)==='warrior'){   // v492: Reckoning and Immovable removed (Mirror of Steel and Seismic Anchor take their places)
      const ids492 = ['reckoning','immovable'];
      let rf9 = 0; for(const k of ids492){ rf9 += player.skills[k]||0; player.skills[k] = 0; }
      if(rf9>0){
        player.skillPoints = (player.skillPoints||0) + rf9;
        for(const sk of Object.keys(player.skillSlots)) if(ids492.indexOf(player.skillSlots[sk])>=0) player.skillSlots[sk] = null;
        setTimeout(()=>{ try{ showMsg('Warrior Defender was reworked -- '+rf9+' skill points refunded', 5, '#ffd27a'); }catch(e){} }, 3000);
      }
    }
    // v497: the Marksman's Predator's Instinct became Steady Breathing (new id, same ranks); its ailment-damage half now lives on the Survivalist's node
    if((player.skills.predatorsInstinct||0)>0 && !((player.skills.steadyBreathing||0)>0)) player.skills.steadyBreathing = player.skills.predatorsInstinct;
    delete player.skills.predatorsInstinct;
    if(!saved.skillsV497){   // v497 (also covers v495): refund any Defender / Marksman / Survivalist / Necromancer node whose prereq or level no longer fits
      const lvl = saved.level||player.level||1, nodes = [[SKILL_TREES,'defender'],[RANGER_SKILL_TREES,'marksman'],[RANGER_SKILL_TREES,'survivalist'],[MYSTIC_SKILL_TREES,'necromancer']].flatMap(([T,k])=>(T && T[k] && T[k].nodes)||[]);
      let rf495 = 0, changed = true;
      while(changed){ changed = false;
        for(const n of nodes){
          const r = player.skills[n.id]||0; if(r<=0) continue;
          const pre = n.prereq||[], ok = !pre.length || (n.prereqMode==='or' ? pre.some(id=>(player.skills[id]||0)>=1) : pre.every(id=>(player.skills[id]||0)>=1));
          if(ok && (n.reqLevel||1) <= lvl) continue;
          rf495 += r; player.skills[n.id] = 0; changed = true;
          for(const sk of Object.keys(player.skillSlots)) if(player.skillSlots[sk]===n.id) player.skillSlots[sk] = (sk==='main' ? 'strike' : null);
        }
      }
      if(rf495>0){ player.skillPoints = (player.skillPoints||0) + rf495; setTimeout(()=>{ try{ showMsg('Skill trees were rearranged -- '+rf495+' skill points refunded', 5, '#ffd27a'); }catch(e){} }, 3200); }
    }
    if(!saved.skillsV545 && (saved.cls||cls)==='ranger'){   // v545: Explosive Trap is now a capstone -- refund it (and Trap Mastery) if another tree's capstone is already ranked
      const other = ['rainOfArrows','aimedShot'].concat(((RANGER_SKILL_TREES.hunter||{}).nodes||[]).filter(n=>n.capstone).map(n=>n.id)).some(id=>(player.skills[id]||0)>0);
      if(other && (player.skills.explosiveTrap||0)>0){
        let rf = 0; for(const id of ['explosiveTrap','trapMastery']){ rf += player.skills[id]||0; player.skills[id] = 0; for(const sk of Object.keys(player.skillSlots||{})) if(player.skillSlots[sk]===id) player.skillSlots[sk] = (sk==='main' ? 'strike' : null); }
        if(rf>0){ player.skillPoints = (player.skillPoints||0) + rf; setTimeout(()=>{ try{ showMsg('Explosive Trap is now a capstone -- '+rf+' skill points refunded', 5, '#ffd27a'); }catch(e){} }, 3400); }
      }
    }
    if(!saved.skillsV481 && (saved.cls||cls)==='mystic'){   // v481: Windrunner / Tornado / Storm moved
      const ids = DJINN_NODE_IDS; let rf = 0;
      for(const k of ids){ rf += player.skills[k]||0; player.skills[k] = 0; }
      if(rf>0){
        player.skillPoints = (player.skillPoints||0) + rf;
        for(const sk of Object.keys(player.skillSlots)) if(ids.indexOf(player.skillSlots[sk])>=0 && !(player._staffSkill===player.skillSlots[sk])) player.skillSlots[sk] = (sk==='main' ? 'strike' : null);
        setTimeout(()=>{ try{ showMsg('The Djinn tree was rearranged -- '+rf+' skill points refunded', 5, '#ffd27a'); }catch(e){} }, 2800);
      }
    }
    player.checkpointDepth = saved.checkpointDepth||1; player.deaths = saved.deaths||0;
    player.reachedMountainPass = !!saved.reachedMountainPass;
    player.reachedIcySummit = !!saved.reachedIcySummit;
    player.reachedRedridge = !!saved.reachedRedridge; player.reachedFrostholdWp = !!saved.reachedFrostholdWp; player.reachedCrater = !!saved.reachedCrater; player.gojiraSlain = !!saved.gojiraSlain; player.obsidianTaken = !!saved.obsidianTaken; player.dragonboltGiven = !!saved.dragonboltGiven; player.hunterRuneRewarded = !!saved.hunterRuneRewarded; player.runeforgeUnlocked = !!saved.runeforgeUnlocked;
    player.partLeviathan = !!saved.partLeviathan; player.partMastodon = !!saved.partMastodon; player.recipeBoss = saved.recipeBoss||{}; player.playTime = saved.playTime||0; player.killCount = saved.killCount||0; player.partThunder = !!saved.partThunder; player.partKraken = !!saved.partKraken; player.witchRescued = !!saved.witchRescued;
    player.witchBrewed = !!saved.witchBrewed; player.partsHarvest = !!saved.partsHarvest; player.witchRareGiven = saved.witchRareGiven==null ? !!saved.partsHarvest : !!saved.witchRareGiven;   /* v493: older saves already got the gift */ player.recipeBookTaken = !!saved.recipeBookTaken; player.recipeBookRead = !!saved.recipeBookRead; player.knightEquip = saved.knightEquip||null; player.parts = saved.parts||{}; player.recipes = saved.recipes||{}; player.witchStock = saved.witchStock||null; player.fhtRuneTaken = !!saved.fhtRuneTaken; player.purpleDrunk = !!saved.purpleDrunk;
    player.shrineBlessed = !!saved.shrineBlessed; player.forestHunterPos = saved.forestHunterPos||null; player.leviathanSlain = !!saved.leviathanSlain; player.krakenSlain = !!saved.krakenSlain; player.wmSeen = saved.wmSeen||{};
    player.shrineStage = saved.shrineStage||0; player.scholarEast = !!saved.scholarEast; player.fhCmdSlain = !!saved.fhCmdSlain; player.fhCmdLooted = !!saved.fhCmdLooted; player.constructSlain = !!saved.constructSlain; player.heartstoneDone = !!saved.heartstoneDone; player.witchPotionStarted = !!saved.witchPotionStarted;
    player.frostholdUnlocked = !!saved.frostholdUnlocked; player.snowWallOpen = !!saved.snowWallOpen; player.heartstoneTaken = !!saved.heartstoneTaken; player.defilerSlain = !!saved.defilerSlain; player.inscriptionTaken = !!saved.inscriptionTaken; player.scholarMet = !!saved.scholarMet; player.scholarMeet = !!saved.scholarMeet; player.scholarLeft = !!saved.scholarLeft; player.ruinsEvent = saved.ruinsEvent||0; player.scholarRead = !!saved.scholarRead; player.fhDungeonKey = !!saved.fhDungeonKey; player.fhDungeonOpen = !!saved.fhDungeonOpen; player.fhDungeonDone = !!saved.fhDungeonDone; player.redridgeWallOpen = !!saved.redridgeWallOpen; player.npcMarks = saved.npcMarks||{};
    player.reachedSunlitPlains = !!saved.reachedSunlitPlains;
    player.reachedRiverValley = !!saved.reachedRiverValley; player.bridgeCleared = !!saved.bridgeCleared; player.bridgeChiefDead = !!saved.bridgeChiefDead;
    player.reachedLighthouseTower = !!saved.reachedLighthouseTower;
    player.reachedLighthouseTowerTop = !!saved.reachedLighthouseTowerTop;
    player.reachedLakesideRuins = !!saved.reachedLakesideRuins;
    player.reachedBlackMarsh = !!saved.reachedBlackMarsh; player.reachedHighlands = !!saved.reachedHighlands;
    player.reachedForgottenTower = !!saved.reachedForgottenTower;
    player.reachedCursedCemetery = !!saved.reachedCursedCemetery;
    player.cemeteryCleared = !!saved.cemeteryCleared;
    player.reachedDarkCrypt = !!saved.reachedDarkCrypt; player.darkCryptCp = !!saved.darkCryptCp;
    player.darkCryptChestLooted = !!saved.darkCryptChestLooted;
    player.reachedAncientRuins = !!saved.reachedAncientRuins;
    player.ruinsEntranceOpen = !!saved.ruinsEntranceOpen;
    player.ancientRuinsChestLooted = !!saved.ancientRuinsChestLooted; player.ruinsWarlordSlain = !!saved.ruinsWarlordSlain; player.sunkenChestLooted = !!saved.sunkenChestLooted; player.poolChestLooted = !!saved.poolChestLooted; player.heartChestLooted = !!saved.heartChestLooted; player.colossusSlain = !!saved.colossusSlain;
    player.barStock = Array.isArray(saved.barStock) ? saved.barStock : null;
    player.potionSlot = saved.potionSlot || 'health';
    if(saved.potionEq && POTION_DEFS[saved.potionEq.kind]) player.potionEq = {kind:saved.potionEq.kind, n:Math.max(0,saved.potionEq.n|0)};
    player.barRestockAt = saved.barRestockAt||0; player.vendorRestockAt = saved.vendorRestockAt||0;
    player.beerT = saved.beerT||0; player.coffeeT = saved.coffeeT||0;
    player.lighthouseFloor5Cleared = !!saved.lighthouseFloor5Cleared;
    player.lighthouseBeaconOn = !!saved.lighthouseBeaconOn;
    player.lighthouseChestLooted = !!saved.lighthouseChestLooted;
    player.minerQ = saved.minerQ||0; player.sunkenChest2Looted = !!saved.sunkenChest2Looted; player.reachedMineWp = !!saved.reachedMineWp; player.reachedFhdWp = !!saved.reachedFhdWp; player.reachedHighwardWp = !!saved.reachedHighwardWp; player.reachedDeepWp = !!saved.reachedDeepWp; player.reachedCliffWp = !!saved.reachedCliffWp; player.reachedKeepWp = !!saved.reachedKeepWp; player.reachedHoldWp = !!saved.reachedHoldWp; player.sleptAt = saved.sleptAt||0; player.sleptBed = saved.sleptBed||0; player.wellRestedT = saved.wellRestedT||0; player.breachReached = !!saved.breachReached; player.reachedRingWp = !!saved.reachedRingWp; player.breachBest = saved.breachBest||0; player.breachClears = saved.breachClears||0; player.wraithLordSlain = !!saved.wraithLordSlain; player.breachContained = !!saved.breachContained; player.runesPlaced = Object.assign({}, saved.runesPlaced||{}); player.wlSkillReward = !!saved.wlSkillReward || !!saved.wraithLordSlain; if(!saved.wlRework427 || !saved.wlReset435){ player.wraithLordSlain = false; player.breachContained = false; } player.wlRework427 = true; player.wlReset435 = true;
    if(!saved.wlReset435){ player._rpOld = Object.assign({}, saved.runesPlaced||{}); player.runesPlaced = {}; } if(player.breachContained && !(player.runesPlaced.shield && player.runesPlaced.sword && player.runesPlaced.cross)) player.runesPlaced = {shield:true,sword:true,cross:true}; if(!player.wraithLordSlain){ player.breachContained = false; } player.skGateOpen = !!saved.skGateOpen; player.keepLore = saved.keepLore||{}; player.keepMaps = saved.keepMaps||{}; player.tpBeacons = saved.tpBeacons||[]; player.harpyQueenSlain = !!saved.harpyQueenSlain; player.harpyTalonTaken = !!saved.harpyTalonTaken; player.highwardSlain = !!saved.highwardSlain; player.hwCrossing = !!saved.hwCrossing; player.hwRuneTaken = saved.hwRuneTaken!==undefined ? !!saved.hwRuneTaken : !!saved.highwardSlain; player.hwSwitchOn = saved.hwSwitchOn!==undefined ? !!saved.hwSwitchOn : !!saved.highwardSlain; player.hwMapFound = !!saved.hwMapFound; player.wayfarerMet = !!saved.wayfarerMet; player.scholarWarnedRR = !!saved.scholarWarnedRR; player.scholarThirdRead = !!saved.scholarThirdRead; player.scholarKeyTalk = !!saved.scholarKeyTalk; player.rrBeacons = saved.rrBeacons||{}; player.mineDeepest = saved.mineDeepest||0; player.balrogSlain = !!saved.balrogSlain; player.hammerTaken = !!saved.hammerTaken; player.smithSockets = !!saved.smithSockets; player.socketUses = saved.socketUses||0; player.ftMapFound = !!saved.ftMapFound;
    player.cls = saved.cls || 'warrior';
    player.quests = Array.isArray(saved.quests) ? saved.quests : [];
  }
  recalcStats(player);
  if(saved && saved.equipment){
    // restore gear directly rather than through equipItem(), which applies
    // pickup-time gating (e.g. Weapons Specialist) that doesn't apply to
    // gear the character already legitimately had equipped.
    player.equipment = saved.equipment;
    player.inventory = saved.inventory || [];
    // v263: the Flame Raptor hunt and its Fire Claw are gone -- the 4th witch part is now the Colossus' Molten Shell Fragment
    player.quests = (player.quests||[]).filter(q=>!(q && (q.id==='hunt_raptor' || q.id==='legend_summit')));
    player.inventory = player.inventory.filter(it=>!(it && it.questId==='fire_claw'));
    { const mg = stripManaPotions(player.inventory); if(mg>0) player.gold = (player.gold||0) + mg; }   // v490: mana potions are gone -- sold for half price
    // v453: rescue items that loot pickup wrongly 'equipped' into a non-gear slot (e.g. the Molten Shell Fragment)
    if(player.equipment){ for(const k of Object.keys(player.equipment)){ if(EQUIP_SLOTS.indexOf(k)<0 && player.equipment[k]){ const it = player.equipment[k]; delete player.equipment[k]; delete it.gx; delete it.gy; forceAddToBag(player, it); } } }
    // v452: the Frosthold dungeon now only opens through the key-turning sequence. Old saves that already used the key
    // (before that flag existed) stay open; a key that is merely sitting in the stash does not count.
    if(player.fhDungeonKey && !player.fhDungeonOpen && !player.fhDungeonDone && !player.inventory.some(it=>it && it.questId==='fh_dungeon_key')){
      let inStash = false; try{ const st = loadStash(); inStash = (st.tabs||[]).some(tab=>tab.some(it=>it && it.questId==='fh_dungeon_key')); }catch(e){}
      if(!inStash) player.fhDungeonOpen = true;
    }
    if(player._rpOld){ const _rp = player._rpOld; delete player._rpOld; const _has = (...ids)=> player.inventory.some(i=>i && ids.includes(i.questId));
      if(!_has('templar_runestone','templar_runestone_awake') && (_rp.shield || saved.breachContained || saved.sunkenChestTaken!==undefined)) forceAddToBag(player, makeTemplarRunestoneItem());
      if(!_has('frost_templar_runestone') && (_rp.sword || saved.breachContained || saved.fhtRuneTaken)) forceAddToBag(player, makeFrostRunestoneItem());
      if(!_has('highward_runestone') && (_rp.cross || saved.breachContained)) forceAddToBag(player, makeHighwardRunestoneItem()); }
    if(!player.witchBrewed && !player.colossusSlain) player.partThunder = false;
    player.inventory.forEach(migrateItemAffixes); // (v105) retired evasion/defence keys
    // older saves predate the grid bag and have no gx/gy on their items
    // (or on a fresh character with a fresh empty array, this is a no-op)
    repackBag(player);
    recalcStats(player);
  } else if(player.cls==='ranger'){
    player.potionEq = {kind:'health', n:1}; player.beltV478 = true;   // v478: every hero starts with one health potion in hand
    // the ranger starts equipped with a basic bow, no shield needed
    equipItem(player, generateItem(1, 'common', 'bow'));
  } else if(player.cls==='mystic'){
    player.potionEq = {kind:'health', n:1}; player.beltV478 = true;
    // the mystic starts equipped with a basic staff, no shield needed
    equipItem(player, generateItem(1, 'common', 'staff'));
    // v476: the starting staff's spell goes straight onto the Strike button
    { const mh = player.equipment.mainhand; const sid = mh && Object.keys(STAFF_SKILL_SPELL).find(k=>STAFF_SKILL_SPELL[k]===(mh.spell||'fire'));
      if(sid && staffBonusFor(player, sid)>0) player.skillSlots.main = sid; }
  } else {
    player.potionEq = {kind:'health', n:1}; player.beltV478 = true;
    // the warrior starts equipped with a basic sword and shield
    equipItem(player, generateItem(1, 'common', 'weapon1h'));
    equipItem(player, generateItem(1, 'common', 'shield'));
  }
  player.hp = player.maxHp; player.mp = player.maxMp;
  return {
    scene:'town',
    depth:1,
    player,
    room:null,
    town:null,
    enemies:[],
    projectiles:[],
    loot:[],
    particles:[],
    portal:null,
    chest:null,
    shieldThrow:null,
    followers:[], followerStance:'attack', followerRespawnCd:0, traps:[],
    portalIsBoss:false,
    bossKilled:false,
    camera:{x:0,y:0},
    msgT:0, msgText:'',
    over:false,
    started:false,
    levelUpFlash:0,
    modalOpen:false,
  };
}

// An L-shaped tunnel of the given width connecting two points -- a
// horizontal leg at the first point's height, then a vertical leg at the
// second point's position, so any two rooms end up connected however
// they're scattered relative to each other.
function tunnelRects(ax, ay, bx, by, width){
  const hx0 = Math.min(ax,bx), hx1 = Math.max(ax,bx);
  const vy0 = Math.min(ay,by), vy1 = Math.max(ay,by);
  return [
    {x:hx0-width/2, y:ay-width/2, w:(hx1-hx0)+width, h:width},
    {x:bx-width/2, y:vy0-width/2, w:width, h:(vy1-vy0)+width},
  ];
}
function rectsOverlap(a,b,pad){
  pad = pad||0;
  return a.x-pad < b.x+b.w && a.x+a.w+pad > b.x && a.y-pad < b.y+b.h && a.y+a.h+pad > b.y;
}
function rectCenter(r){ return {x:r.x+r.w/2, y:r.y+r.h/2}; }
// Each Mine floor is now a proper randomly-generated dungeon: an entrance
// stairwell, three separate rooms scattered across a much bigger map and
// linked by tunnels, and a final room holding the stairs down to the next
// floor. Walls are "carved" by leaving everything outside the rooms/tunnels
// as unlit rock (rendered as wall blocks only where they border a walkable
// area, so the dark void beyond reads as unexplored cave rather than a
// floating-island edge).
function genRoom(depth){
  // Rooms and corridors widened ~55-65% over the original v40 layout (bigger
  // main rooms to fight in, and tunnels wide enough that a follower/monster
  // pack doesn't bottleneck at a doorway) -- the overall map bounding box
  // grows to match so rooms still have room to be placed without crowding
  // or blowing out the room-placement retry loop below.
  const size = 2050 + Math.min(depth*30, 900);
  const ENTRANCE_SIZE = 200, EXIT_SIZE = 220, ROOM_MIN = 380, ROOM_MAX = 540, CORR_W = 165;

  const entranceRoom = {x:80, y:rand(80, size-80-ENTRANCE_SIZE), w:ENTRANCE_SIZE, h:ENTRANCE_SIZE};
  const exitRoom = {x:size-80-EXIT_SIZE, y:rand(80, size-80-EXIT_SIZE), w:EXIT_SIZE, h:EXIT_SIZE};

  const mainRooms = [];
  let guard = 0;
  while(mainRooms.length < 3 && guard < 800){
    guard++;
    const w = rand(ROOM_MIN, ROOM_MAX), h = rand(ROOM_MIN, ROOM_MAX);
    const r = {x:rand(60, size-60-w), y:rand(60, size-60-h), w, h};
    if(rectsOverlap(r, entranceRoom, 160) || rectsOverlap(r, exitRoom, 160)) continue;
    if(mainRooms.some(o=>rectsOverlap(r, o, 130))) continue;
    mainRooms.push(r);
  }
  // fall back to simple placeholder rooms if the random placement above
  // somehow couldn't find 3 clear spots (extremely unlikely, but keeps the
  // floor always generable)
  while(mainRooms.length < 3){
    const idx = mainRooms.length;
    mainRooms.push({x:size*0.3+idx*260, y:size*0.4+idx*180, w:400, h:400});
  }
  // visit the rooms in the order that keeps the connecting tunnels short --
  // nearest-neighbor chain starting from the entrance, ending at the exit
  const chain = [];
  const pool = mainRooms.slice();
  let cur = entranceRoom;
  while(pool.length){
    pool.sort((a,b)=> dist(rectCenter(cur), rectCenter(a)) - dist(rectCenter(cur), rectCenter(b)));
    const next = pool.shift();
    chain.push(next);
    cur = next;
  }

  const floorRects = [entranceRoom, exitRoom, ...mainRooms];
  const sequence = [entranceRoom, ...chain, exitRoom];
  for(let i=0;i<sequence.length-1;i++){
    const a = rectCenter(sequence[i]), b = rectCenter(sequence[i+1]);
    floorRects.push(...tunnelRects(a.x, a.y, b.x, b.y, CORR_W));
  }

  // Carve walls: a coarse grid over the whole floor, keeping only the wall
  // cells that actually border a walkable (floor) cell -- deep rock beyond
  // that boundary is left undrawn (just the dark cave background).
  const CELL = 50;
  const cols = Math.ceil(size/CELL), rows = Math.ceil(size/CELL);
  const isFloor = new Uint8Array(cols*rows);
  const insideAny = (x,y)=> floorRects.some(r=> x>r.x+6 && x<r.x+r.w-6 && y>r.y+6 && y<r.y+r.h-6);
  for(let iy=0; iy<rows; iy++){
    for(let ix=0; ix<cols; ix++){
      const cx = ix*CELL+CELL/2, cy = iy*CELL+CELL/2;
      if(insideAny(cx,cy)) isFloor[iy*cols+ix] = 1;
    }
  }
  const obstacles = [];
  for(let iy=0; iy<rows; iy++){
    for(let ix=0; ix<cols; ix++){
      if(isFloor[iy*cols+ix]) continue;
      let bordersFloor = false;
      for(let dy=-1; dy<=1 && !bordersFloor; dy++){
        for(let dx=-1; dx<=1; dx++){
          const nx=ix+dx, ny=iy+dy;
          if(nx<0||ny<0||nx>=cols||ny>=rows) continue;
          if(isFloor[ny*cols+nx]){ bordersFloor = true; break; }
        }
      }
      if(bordersFloor){
        obstacles.push({x:ix*CELL, y:iy*CELL, w:CELL, h:CELL, mazeWall:true});
      }
    }
  }

  return {
    w:size, h:size, obstacles, floorRects,
    entranceRoom, exitRoom, rooms:mainRooms,
    entranceSpawn: rectCenter(entranceRoom),
  };
}

// Boss floors mark the dungeon's checkpoint rhythm: every 5th floor
// (5, 10, 15, 20...) is guarded by a demon boss instead of a regular wave.
function isBossFloor(depth){ return depth % 5 === 0; }

function spawnWave(g){
  const depth = g.depth;
  // v62: mine floors felt sparsely populated -- base count raised 3->5 and
  // the per-depth scaling raised 1.15->1.6, roughly a 65-70% density bump
  // across the range of floors. Boss floors (escorts = normalFloorCount*2
  // below) scale up proportionally along with it.
  const normalFloorCount = 5 + Math.floor(depth*1.6);
  if(isBossFloor(depth)){
    // Boss floors used to feel sparser than a regular floor (just a couple
    // escorts). Now they roughly double a normal floor's monster density,
    // on top of the boss itself -- a portion guards the boss in the final
    // room, the rest is spread across the main rooms like a normal floor's
    // population would be.
    const escorts = normalFloorCount * 2;
    const guardRoom = g.room.exitRoom;
    const guardCount = Math.ceil(escorts*0.4);
    for(let i=0;i<escorts;i++){
      const pos = (i<guardCount && guardRoom) ? {x:rand(guardRoom.x+45,guardRoom.x+guardRoom.w-45), y:rand(guardRoom.y+45,guardRoom.y+guardRoom.h-45)} : undefined;
      spawnEnemy(g, Math.random()<0.5 ? 'archer' : 'grunt', pos);
    }
    spawnEnemy(g, 'boss');
    showMsg('A demon boss awakens...', 1.8);
    return;
  }
  const count = normalFloorCount;
  for(let i=0;i<count;i++){
    let type = 'grunt';
    const roll = Math.random();
    if(depth>=3 && roll<0.22) type='brute';
    else if(depth>=2 && roll<0.5) type='archer';
    spawnEnemy(g, type);
  }
}

function spawnEnemy(g, type, pos){
  const room = g.room;
  let x,y;
  if(pos){
    // a fixed spot (e.g. a Forest pack anchor) rather than a random position
    x = clamp(pos.x, 40, room.w-40); y = clamp(pos.y, 40, room.h-40);
  } else if(room.rooms && room.rooms.length){
    // Multi-room dungeon floor: the boss (and its escorts) guard the final
    // room by the stairs down; everything else is spread across the three
    // main rooms rather than one single space.
    const targetRoom = type==='boss' ? room.exitRoom : room.rooms[Math.floor(Math.random()*room.rooms.length)];
    const pad = 45;
    x = rand(targetRoom.x+pad, targetRoom.x+targetRoom.w-pad);
    y = rand(targetRoom.y+pad, targetRoom.y+targetRoom.h-pad);
  } else {
    const minDist = type==='boss' ? 220 : 160;
    let tries=0;
    do{
      x = rand(50, room.w-50); y = rand(50, room.h-50);
      tries++;
    } while(dist({x,y},{x:room.w/2,y:room.h/2}) < minDist && tries<20);
  }
  const depth = g.depth;
  let e;
  if(WILDLIFE_TYPES[type]){ e = wildlifeStats(type, x, y, depth); }   // v550: Thornback / Hookbeak / Exiled Plague Doctor (monsters/wildlife.js)
  else if(type==='grunt'){
    e = {type,x,y,r:15,hp:22+depth*4,maxHp:22+depth*4,speed:rand(85,105),dmg:7+depth*1.6,
         atkCd:0,atkCdMax:0.9,color:'#b4293f',state:'chase',hitT:0};
  } else if(type==='archer'){
    e = {type,x,y,r:13,hp:14+depth*3,maxHp:14+depth*3,speed:rand(70,85),dmg:5+depth*1.3,
         atkCd:rand(0,1),atkCdMax:1.6,color:'#5b8cff',state:'kite',hitT:0,preferRange:130};
  } else if(type==='boss'){
    // demon bosses hit hard and soak a lot of damage -- a real gate on progress.
    // Sized a clear step above a brute/bear, but not the screen-filling giant
    // the old r:34 (plus a 1.5x draw multiplier) used to render as.
    e = {type,x,y,r:24,hp:260+depth*30,maxHp:260+depth*30,speed:rand(52,62)*1.25,dmg:11+depth*1.7,
         atkCd:0,atkCdMax:1.0,color:'#e0433a',state:'chase',hitT:0,armor:6,isBoss:true,
         slamCd:BOSS_SLAM_CD, slamState:'idle', slamTelegraphT:0, slamPos:null};
  } else if(type==='brute'){
    // brutes have thick hide (armor) that only a Greatsword's penetration can bite through
    e = {type,x,y,r:21,hp:55+depth*7,maxHp:55+depth*7,speed:rand(48,58),dmg:13+depth*2.2,
         atkCd:0,atkCdMax:1.1,color:'#8a3fae',state:'chase',hitT:0,armor:10};
  } else if(type==='wolf'){
    // Forest: a fast, lightly-built pack hunter -- lower hp than a grunt but quicker
    e = {type,x,y,r:14,hp:18+depth*3.5,maxHp:18+depth*3.5,speed:rand(130,155),dmg:8+depth*1.7,
         atkCd:0,atkCdMax:0.8,color:'#8a8a92',state:'chase',hitT:0};
  } else if(type==='spider'){
    // Forest: skitters and keeps its distance, spitting webs that slow the player on hit
    e = {type,x,y,r:13,hp:15+depth*3,maxHp:15+depth*3,speed:rand(24,32),dmg:6+depth*1.4,
         atkCd:rand(0.5,2),atkCdMax:3.0,color:'#4a3a5a',state:'kite',hitT:0,preferRange:110};   /* v486: barely moves, spits webs less often */
  } else if(type==='bear'){
    // Forest: a brute-equivalent heavy hitter with thick hide -- move speed
    // bumped 10% over the base roll below. Damage trimmed slightly (12%)
    // relative to a brute's identical base formula -- see BEAR_DMG_MULT.
    e = {type,x,y,r:22,hp:55+depth*7,maxHp:55+depth*7,speed:rand(46,56)*BEAR_SPEED_MULT,dmg:(13+depth*2.2)*BEAR_DMG_MULT,
         atkCd:0,atkCdMax:1.1,color:'#6b4a2e',state:'chase',hitT:0,armor:10,
         chargeCd:rand(0.5,BEAR_CHARGE_CD), chargeState:'idle', chargeT:0, chargeDir:0, chargeHit:false};
  } else if(type==='treant'){
    // Forest (v68): a walking tree -- the slowest enemy in the game (even
    // under a frozen zombie's shamble), hits harder per swing than anything
    // short of a boss, and is the tankiest non-boss enemy (highest armor,
    // highest hp of the regular Forest roster) to sell "big lumbering tree"
    // as a real threat you don't want to facetank, while being easy to
    // simply outrun if you'd rather not fight it. No charge/ranged attack --
    // plain melee chase/attack (see the generic 'else' branch in update()),
    // just a slow one that hits very hard on a long cooldown.
    e = {type,x,y,r:24,hp:100+depth*12,maxHp:100+depth*12,speed:rand(30,38)*TREANT_SPEED_MULT,dmg:(22+depth*3.2)*TREANT_DMG_MULT,
         atkCd:0,atkCdMax:1.6,color:'#4a6b3a',state:'chase',hitT:0,armor:14};
  } else if(type==='frozenzombie'){
    // Mountain Pass: a slow shambling chaser -- well under half a grunt's
    // speed -- that closes the gap with a sudden fast charge instead (see
    // ZOMBIE_CHARGE_* and the e.type==='frozenzombie' branch in update()).
    e = {type,x,y,r:16,hp:50+depth*6,maxHp:50+depth*6,speed:rand(38,46),dmg:10+depth*1.8,
         atkCd:0,atkCdMax:1.1,color:'#9fd3e0',state:'chase',hitT:0,armor:4,
         zChargeCd:rand(0.5,ZOMBIE_CHARGE_CD), zChargeState:'idle', zChargeT:0, zChargeDir:0, zChargeHit:false};
  } else if(type==='bandit'){
    // Withered Crossroads (v69): a humanoid melee raider -- Withered Crossroads sits
    // one step past the Dark Forest in the overworld progression (it's
    // reached BY WAY OF the Forest, via the new north exit), so a bandit is
    // tuned as a modest step up over the Forest's wolf/grunt baseline
    // rather than a lateral reskin: noticeably more hp than a wolf
    // (18+depth*3.5) and a bit more than a grunt (22+depth*4), plus a small
    // armor value neither of those baseline Forest enemies has, on grunt-
    // like attack pacing. Melee-only -- no special branch in update(), so
    // it uses the same generic chase/attack path any plain melee enemy
    // without a dedicated branch falls into.
    e = {type,x,y,r:15,hp:30+depth*4.4,maxHp:30+depth*4.4,speed:rand(95,115),dmg:9+depth*1.8,
         atkCd:0,atkCdMax:0.9,color:'#8a6a3a',state:'chase',hitT:0,armor:4};
  } else if(type==='banditarcher'){
    // Withered Crossroads (v69): the ranged counterpart to the Bandit above,
    // reusing the game's existing kite-and-shoot ranged-enemy pattern
    // (the same e.type==='archer'||'spider' branch in update() drives its
    // AI and arrow-projectile firing -- see that branch). Clearly lower hp
    // than a melee Bandit (matching how the Forest's own archer sits below
    // its grunt) and a slightly longer preferred standoff range than the
    // dungeon Archer's 190, fitting Withered Crossroads' much more open terrain.
    e = {type,x,y,r:13,hp:18+depth*3.2,maxHp:18+depth*3.2,speed:rand(75,90),dmg:7+depth*1.6,
         atkCd:rand(0,1),atkCdMax:1.6,color:'#b8925a',state:'kite',hitT:0,preferRange:140};
  } else if(type==='banditbrute'){
    // Lighthouse Tower rooftop (v70): a heavier bandit variant introduced
    // as that floor's "boss floor" heavy hitter -- a clear step up over a
    // regular Bandit (hp 30+depth*4.4/dmg 9+depth*1.8) in both hp and
    // damage, moving noticeably slower in exchange (the same big-melee-
    // hitter tradeoff the demon Brute/Bear archetype uses), but tuned
    // well under that full demon-Brute/Bear tier (55+depth*7 hp,
    // 13+depth*2.2 dmg, armor 10) so it reads as a tough mid-tier heavy
    // bandit rather than a second boss. Melee-only, no special branch in
    // update() -- same generic chase/attack path as the regular Bandit.
    e = {type,x,y,r:17,hp:65+depth*7,maxHp:65+depth*7,speed:rand(55,68),dmg:15+depth*2.3,   /* v545: a little smaller (was 19) */ 
         atkCd:0,atkCdMax:1.15,color:'#6a3424',state:'chase',hitT:0,armor:8};
  } else if(type==='skeleton'){
    // Lakeside Ruins (v71) -- REUSABLE BASE TYPE: the game's first undead
    // melee enemy. Future batches (Cursed Cemetery/Dark Crypt, batches 5/6)
    // should reuse this exact type:'skeleton' via spawnEnemy(g,'skeleton',pos)
    // rather than defining a new one -- its stat formula, aggro/leash
    // tuning (see the e.aggroRange assignment below) and its
    // kind==='skeleton' visual (drawDemon's palette table + rib-cage
    // flourish) are all self-contained here.
    // Stat formula: modeled directly on Bandit's own tier (hp:30+depth*4.4,
    // dmg:9+depth*1.8, armor:4) since a Skeleton is meant to read as an
    // undead equivalent of that same "modest step up over a wolf/grunt
    // baseline" mid-tier melee slot -- bumped slightly (+2 base hp, +0.2
    // hp/depth, +2 armor) to account for bone being tougher than leather,
    // and given a shambling gait (rand(80,98) vs Bandit's rand(95,115))
    // so it doesn't just play like a reskinned Bandit.
    e = {type,x,y,r:15,hp:32+depth*4.6,maxHp:32+depth*4.6,speed:rand(80,98),dmg:9+depth*1.8,
         atkCd:0,atkCdMax:0.95,color:'#d8cdb8',state:'chase',hitT:0,armor:6};
  } else if(type==='skeletonarcher'){
    // Cursed Cemetery (v72): the ranged counterpart to the Skeleton above,
    // built the exact same way Bandit Archer relates to Bandit -- reusing
    // the game's existing kite-and-shoot ranged-enemy pattern (added to the
    // e.type==='archer'||'spider'||'banditarcher' branch in update(), see
    // that branch) rather than a new AI system. Clearly lower hp than a
    // melee Skeleton (matching how Bandit Archer sits below Bandit), a
    // similar preferRange to Bandit Archer's 210 (same open-terrain
    // standoff distance), and damage in the same modest ranged-tier band.
    e = {type,x,y,r:13,hp:20+depth*3.3,maxHp:20+depth*3.3,speed:rand(78,92),dmg:7+depth*1.6,
         atkCd:rand(0,2.2),atkCdMax:1.6,color:'#c9c0a8',state:'kite',hitT:0,preferRange:112};
  } else if(type==='wraith'){
    // v225: the Dark Crypt boss (The Wraith Lord) -- scaled from the area level
    e = {type,x,y,r:26,hp:1000+depth*120,maxHp:1000+depth*120,speed:118,dmg:11+depth*1.7,
         atkCd:0,atkCdMax:1.0,color:'#2a1f3a',state:'chase',hitT:0,armor:8};
  } else if(type==='imp'){
    e = {type,x,y,r:11,hp:20+depth*2.6,maxHp:20+depth*2.6,speed:rand(135,158),dmg:9+depth*1.7,
         atkCd:0,atkCdMax:0.9,color:'#a02818',state:'chase',hitT:0,armor:0};
  } else if(type==='hellhound'){
    e = {type,x,y,r:19,hp:28+depth*3.4,maxHp:28+depth*3.4,speed:rand(150,175),dmg:11+depth*2.0,
         atkCd:0,atkCdMax:0.85,color:'#5a2218',state:'chase',hitT:0,armor:2};
  } else if(type==='cinderfiend'){
    e = {type,x,y,r:14,hp:30+depth*3.6,maxHp:30+depth*3.6,speed:rand(78,92),dmg:10+depth*2.0,
         atkCd:0,atkCdMax:1.4,color:'#3a1030',state:'chase',hitT:0,armor:2};
  } else if(type==='brimstonebrute'){
    e = {type,x,y,r:28,hp:160+depth*19,maxHp:160+depth*19,speed:rand(52,60),dmg:(19+depth*2.8)*0.9,
         atkCd:0,atkCdMax:1.5,color:'#4a3028',state:'chase',hitT:0,armor:14,tState:'idle',tT:0,tCd:rand(1.5,4),tPt:null};
  } else if(type==='demonboss'){
    e = {type,x,y,r:40,hp:(110+depth*12)*22,maxHp:(110+depth*12)*22,speed:130,dmg:(16+depth*2.6)*0.62,
         atkCd:0,atkCdMax:1.3,color:'#5a2218',state:'chase',hitT:0,armor:14};
  } else if(type==='wraithlord'){
    e = {type,x,y,r:34,hp:(110+depth*12)*24,maxHp:(110+depth*12)*24,speed:112,dmg:(16+depth*2.6)*0.62,
         atkCd:0,atkCdMax:1.3,color:'#2a1f3a',state:'chase',hitT:0,armor:16};
  } else if(type==='skeletonbrute'){
    // Cursed Cemetery (v72): a heavier skeleton variant, built the exact
    // same way Bandit Brute relates to Bandit -- a clear step up over a
    // regular Skeleton (hp 32+depth*4.6/dmg 9+depth*1.8) in both hp and
    // damage, moving noticeably slower in exchange, tuned in the same
    // "tough mid-tier heavy" band as Bandit Brute rather than a full boss.
    e = {type,x,y,r:14,hp:68+depth*7.2,maxHp:68+depth*7.2,speed:rand(52,64),dmg:15+depth*2.4,
         atkCd:0,atkCdMax:1.2,color:'#8a8078',state:'chase',hitT:0,armor:9};
  } else if(type==='zombie'){
    // Dark Crypt (v73) -- general-population melee type: adapted from
    // Frozen Zombie's shape (same slow shambling base speed, well under
    // half a grunt's) but with the frost theming and burst-charge attack
    // stripped out entirely, since a plain "shambling zombie" reads fine
    // as a threat on the strength of being slow-but-tanky in a corridor
    // crawl, without needing a gap-closing mechanic. No special branch in
    // update() -- same generic chase/attack path any plain melee enemy
    // without a dedicated branch falls into (see Skeleton/Bandit above).
    // Tuned as a near-twin of the base Skeleton (hp 32+depth*4.6,
    // dmg 9+depth*1.8, armor 6) -- a bit more hp, a bit less armor (rotting
    // flesh vs. bone), and clearly the slowest of Dark Crypt's three
    // general-population types (Skeleton rand(80,98), Spider rand(75,95)).
    e = {type,x,y,r:16,hp:36+depth*5,maxHp:36+depth*5,speed:rand(40,50),dmg:10+depth*1.9,
         atkCd:0,atkCdMax:1.15,color:'#5a6b45',state:'chase',hitT:0,armor:3};
  } else if(type==='vampire'){
    // Dark Crypt (v73) -- the fixed 5-strong pack guarding the chest at the
    // dungeon's far end. Notably FASTER than any other enemy in the game
    // (well above even Withered Crossroads' Wild Boar's rand(150,175) charge-
    // archetype base speed) and built around aggressive melee pressure
    // rather than a special attack -- no special branch in update() (same
    // generic chase/attack path as Skeleton/Bandit/Zombie above) drives it,
    // but every hit it LANDS also heals it (see playerDamage's
    // e.type==='vampire' lifesteal branch, VAMPIRE_LIFESTEAL_PCT). Tuned
    // clearly above the zone's general population in both hp and damage
    // (a five-strong pack of these is meant to read as the dungeon's real
    // final obstacle), with a touch of armor.
    e = {type,x,y,r:15,hp:60+depth*7,maxHp:60+depth*7,speed:rand(165,195),dmg:12+depth*2.1,
         atkCd:0,atkCdMax:0.85,color:'#3a1424',state:'chase',hitT:0,armor:5};
  } else if(type==='leviathan'){
    // Lakeside Ruins (v71): a serpent that lives IN the water and can only
    // be fought at range -- see the dedicated e.type==='leviathan' branch
    // in update() for its hidden/pop-up/ranged-only behavior (gated on
    // oneScreenDist(), same "roughly one viewport away" threshold the
    // follower teleport-back failsafe uses), and the isWater-obstacle skip
    // in the projectile/obstacle collision check that lets ranged attacks
    // (both the player's and this enemy's own poison-ball projectiles)
    // freely cross the water that blocks ordinary foot movement. speed:0
    // -- it never leaves its spot in the water, so it's never pushed out
    // by the water's own movement-blocking collision the way a land enemy
    // would be. Tuned as a tanky pure-ranged threat: more hp than a Bandit
    // Brute (it can never be meleed, so it doesn't need to be squishy to
    // stay balanced) but modest, archer-like per-hit damage.
    e = {type,x,y,r:100,hp:(70+depth*8)*3,maxHp:(70+depth*8)*3,speed:0,dmg:10+depth*1.7,
         atkCd:rand(0,1),atkCdMax:2.0,color:'#3a6a5a',state:'lurk',hitT:0,armor:2,active:false};
  } else if(type==='fhdwarf'){
    // Frosthold Dwarf (v129): a stocky armoured keep guard -- slower than a grunt but well plated.
    e = {type,x,y,r:14,hp:28+depth*5,maxHp:28+depth*5,speed:rand(74,88),dmg:9+depth*1.9,
         atkCd:0,atkCdMax:1.0,color:'#6f8fb0',state:'chase',hitT:0,armor:8};
  } else if(type==='fhcleric'){
    // v462 Frosthold Cleric: robed dwarf priest -- mends nearby defenders, lays healing runes, throws frost bolts
    e = {type,x,y,r:14,hp:26+depth*4.2,maxHp:26+depth*4.2,speed:rand(35,41),dmg:8+depth*1.6,   /* v545: dwarf-sized, half the old pace */ 
         atkCd:rand(0.5,1.5),atkCdMax:2.0,color:'#cfe0ee',state:'chase',hitT:0,armor:4};
  } else if(type==='fhaxe'){
    // Frosthold Axe Thrower (v165): lighter-armoured dwarf that kites and hurls axes from range.
    e = {type,x,y,r:13,hp:22+depth*4.2,maxHp:22+depth*4.2,speed:rand(72,86),dmg:10+depth*2.0,
         atkCd:rand(0,1.5),atkCdMax:2.0,color:'#8fa4bb',state:'kite',hitT:0,armor:4,preferRange:210};
  } else if(type==='fhbrute'){
    // Frosthold Brute (v129): a hulking hammer-wielding dwarf champion -- slow, heavy-hitting, thick plate.
    e = {type,x,y,r:22,hp:70+depth*9,maxHp:70+depth*9,speed:rand(48,58),dmg:15+depth*2.6,
         atkCd:0,atkCdMax:1.3,color:'#54697d',state:'chase',hitT:0,armor:14};
  } else if(type==='alligator'){
    // Black Marsh (v144): swimmer ambusher -- lurks submerged, telegraphed lunge lane + jaw snap.
    e = {type,x,y,r:20,hp:62+depth*7.5,maxHp:62+depth*7.5,speed:rand(70,82),dmg:13+depth*2.2,
         atkCd:0,atkCdMax:1.3,color:'#4a6a34',state:'chase',hitT:0,armor:8,swimmer:true,
         lungeState:'idle',lungeT:0,lungeCd:rand(1,4),lungeDir:0,lungeHit:false};
  } else if(type==='tortuga'){
    // Lakeside Ruins (v215): lake-bank turtle -- slow, heavily shelled, bites hard up close.
    e = {type,x,y,r:17,hp:70+depth*8,maxHp:70+depth*8,speed:rand(52,62),dmg:10+depth*1.9,
         atkCd:0,atkCdMax:1.4,color:'#6f8a4a',state:'chase',hitT:0,armor:18};
  } else if(type==='anaconda'){
    // Black Marsh (v144): fast poison swimmer; its bite coils and slows you (see playerDamage).
    e = {type,x,y,r:16,hp:36+depth*4.2,maxHp:36+depth*4.2,speed:rand(120,138),dmg:8+depth*1.7,
         atkCd:0,atkCdMax:1.0,color:'#55652a',state:'chase',hitT:0,armor:2,swimmer:true};
  } else if(type==='giantoad'){
    // Black Marsh (v144): land-only hopper; telegraphed leap that splashes poison where it lands.
    e = {type,x,y,r:20,hp:52+depth*6,maxHp:52+depth*6,speed:rand(58,68),dmg:11+depth*2,
         atkCd:0,atkCdMax:1.2,color:'#6a7a34',state:'chase',hitT:0,armor:4,
         tState:'idle',tT:0,tCd:rand(1.5,4),tPt:null,hop:0};
  } else if(type==='poisonplant'){
    // Black Marsh (v144): rooted spitter -- lobs poison balls, lashes anyone who stands next to it.
    e = {type,x,y,r:14,hp:30+depth*4,maxHp:30+depth*4,speed:0,dmg:9+depth*1.6,
         atkCd:rand(0.5,2),atkCdMax:2.4,color:'#6a2f7a',state:'chase',hitT:0,armor:0,spitT:0};
  } else if(type==='armordon'){
    // Redridge Canyon (v153): slow armoured dino; reflects part of every hit, telegraphed tail sweep.
    e = {type,x,y,r:36,hp:90+depth*10,maxHp:90+depth*10,speed:rand(44,54),dmg:(14+depth*2.4)*0.8,
         atkCd:0,atkCdMax:1.4,color:'#8a5a3a',state:'chase',hitT:0,armor:16,reflect:true,reflectCd:0,reflectFlashT:0,
         tState:'idle',tT:0,tCd:rand(2,4),tHit:false};
  } else if(type==='crawler'){
    // Canyon crawler (v284): a bear-sized green lizard. Its tongue lashes out along a locked lane and drags you in.
    e = {type,x,y,r:21,hp:58+depth*7,maxHp:58+depth*7,speed:rand(62,74),dmg:(11+depth*2)*0.95,
         atkCd:0,atkCdMax:1.3,color:'#5c9a3a',state:'chase',hitT:0,armor:6,
         tState:'idle',tT:0,tCd:rand(1.5,4),tDir:0,tHit:false,tGrab:null};
  } else if(type==='buffalo'){
    // Canyon buffalo (v284): passive herd animal; fights back hard once hurt.
    e = {type,x,y,r:29,hp:72+depth*8,maxHp:72+depth*8,speed:rand(58,68),dmg:(12+depth*2.1)*0.9,
         atkCd:0,atkCdMax:1.5,color:'#4a3424',state:'chase',hitT:0,armor:8,passive:true};
  } else if(type==='raptor'){
    // Redridge Canyon (v153): fast pack hunter with a telegraphed pounce.
    e = {type,x,y,r:22,hp:34+depth*4,maxHp:34+depth*4,speed:rand(125,145),dmg:9+depth*1.8,
         atkCd:0,atkCdMax:0.9,color:'#a8622e',state:'chase',hitT:0,armor:2,
         tState:'idle',tT:0,tCd:rand(0.2,1.2),tPt:null,hop:0};
  } else if(type==='sandsnake'){
    // Redridge Canyon (v153): fast poison biter, half-buried until close; bite slows.
    e = {type,x,y,r:13,hp:26+depth*3.2,maxHp:26+depth*3.2,speed:rand(135,155),dmg:7+depth*1.5,
         atkCd:0,atkCdMax:0.9,color:'#c9a45a',state:'chase',hitT:0,armor:0,burrow:false};
  } else if(type==='stormsnake'){
    // Sunken Depths (v262): quick lightning snake; shocking bite plus a slow spark bolt at range.
    e = {type,x,y,r:13,hp:30+depth*3.6,maxHp:30+depth*3.6,speed:rand(125,145),dmg:8+depth*1.7,
         atkCd:rand(0,1),atkCdMax:1.0,color:'#4aa8d8',state:'chase',hitT:0,armor:2,sparkCd:rand(1.5,4),sparkT:0};
  } else if(type==='goblin'){
    // Abandoned Mine (v164): swarming, quick, fragile melee.
    e = {type,x,y,r:12,hp:24+depth*3.4,maxHp:24+depth*3.4,speed:rand(118,138),dmg:8+depth*1.6,
         atkCd:0,atkCdMax:0.8,color:'#78a83a',state:'chase',hitT:0,armor:2};
  } else if(type==='goblinarcher'){
    e = {type,x,y,r:11,hp:16+depth*2.6,maxHp:16+depth*2.6,speed:rand(80,95),dmg:7+depth*1.5,
         atkCd:rand(0,1),atkCdMax:1.5,color:'#9ab84a',state:'kite',hitT:0,preferRange:150};
  } else if(type==='fhtemplar'){
    // Frosthold Tower floor 5 (v167): heavily plated paladin guardian. Very tanky, slow, telegraphed holy smite.
    e = {type,x,y,r:25,hp:(150+depth*16)*1.8,maxHp:(150+depth*16)*1.8,speed:rand(48,56),dmg:(20+depth*2.6)*0.9,
         atkCd:0,atkCdMax:1.35,color:'#e8e2c8',state:'chase',hitT:0,armor:34,tState:'idle',tT:0,tCd:rand(2,4),tPt:null};
  } else if(type==='hwsentinel'){
    // v420 Highward: Rustguard Sentinel -- hammer and shield, plods up and smashes the ground.
    e = {type,x,y,r:20,hp:110+depth*12,maxHp:110+depth*12,speed:rand(62,72),dmg:15+depth*2.3,
         atkCd:0,atkCdMax:1.25,color:'#a8602e',state:'chase',hitT:0,armor:20,tState:'idle',tT:0,tCd:rand(2,4),tPt:null,hw:'sentinel',slamR:50,slamTele:1.0};
  } else if(type==='hwwarden'){
    // Gilded Warden: a heavy maul-bearer that raises a tower shield (takes 70% less) and slams a wide ring.
    e = {type,x,y,r:23,hp:210+depth*20,maxHp:210+depth*20,speed:rand(44,52),dmg:20+depth*2.8,
         atkCd:0,atkCdMax:1.6,color:'#c9a24a',state:'chase',hitT:0,armor:32,tState:'idle',tT:0,tCd:rand(3,5),tPt:null,hw:'warden',slamR:82,slamTele:1.3,shieldCd:rand(4,7),shieldUp:0};
  } else if(type==='hwvanguard'){
    // Bronze Vanguard: a quick, lightly armoured knight that lunges across the gap with its shield up.
    e = {type,x,y,r:20,hp:90+depth*10,maxHp:90+depth*10,speed:rand(95,108),dmg:13+depth*2.1,
         atkCd:0,atkCdMax:0.95,color:'#96643a',state:'chase',hitT:0,armor:12,tState:'idle',tT:0,tCd:rand(2,4),tPt:null,hw:'vanguard',slamR:40,slamTele:0.7,chargeCd:rand(2,5),chWind:0,chargeT:0};
  } else if(type==='hwmendicant'){
    // v461 Highward Mendicant: a robed templar priest who mends everyone around it and now and then calls down a big burst heal
    e = {type,x,y,r:15,hp:62+depth*7,maxHp:62+depth*7,speed:rand(84,96),dmg:9+depth*1.5,
         atkCd:rand(0.5,1.5),atkCdMax:1.9,color:'#e8dcc0',state:'chase',hitT:0,armor:6,hw:'mendicant'};
  } else if(type==='hwbulwark'){
    // v461 Highward Bulwark: tower shield -- blocks from the front, wards its allies, bashes you back
    e = {type,x,y,r:21,hp:175+depth*17,maxHp:175+depth*17,speed:rand(46,54),dmg:16+depth*2.4,
         atkCd:0,atkCdMax:1.5,color:'#8a8478',state:'chase',hitT:0,armor:30,hw:'bulwark',heavy:true};
  } else if(type==='hwduelist'){
    // v461 Highward Duelist: twin short swords, fast combos, sidesteps your attacks
    e = {type,x,y,r:15,hp:52+depth*5.5,maxHp:52+depth*5.5,speed:rand(132,148),dmg:8+depth*1.25,
         atkCd:rand(0,0.5),atkCdMax:0.42,color:'#c4783a',state:'chase',hitT:0,armor:6,hw:'duelist'};
  } else if(type==='banditking'){
    // v461 The Bandit King: Lighthouse Tower rooftop boss
    e = {type,x,y,r:27,hp:(65+depth*7)*9,   /* v545: a little smaller (was 30) */ maxHp:(65+depth*7)*9,speed:rand(84,90),dmg:(15+depth*2.3)*1.1,
         atkCd:0,atkCdMax:1.0,color:'#a8282a',state:'chase',hitT:0,armor:14,bkBoss:true,heavy:true,bossName:'The Bandit King',eliteName:'The Bandit King',xpMul:8};
  } else if(type==='hwguardian'){
    // The Highward Ancient Warden: towering gold-rust champion. Slams, raises a shield wall, rains hammers, calls its garrison.
    e = {type,x,y,r:46,hp:(520+depth*60)*1.6,maxHp:(520+depth*60)*1.6,speed:rand(56,62),dmg:(26+depth*3.2),
         atkCd:0,atkCdMax:1.5,color:'#ecc45a',state:'chase',hitT:0,armor:36,tState:'idle',tT:0,tCd:rand(2,3),tPt:null,hw:'guardian',slamR:140,slamTele:1.4,shieldCd:9,shieldUp:0,rainCd:7,rainQ:[],callPhase:0};
  } else if(type==='cultist'){
    // v419: Redridge watchtower cultist -- a black-robed caster that bolts you from range and keeps raising skeletons
    e = {type,x,y,r:15,hp:70+depth*8,maxHp:70+depth*8,speed:rand(80,92),dmg:(10+depth*1.9),
         atkCd:rand(0.5,1.5),atkCdMax:1.5,color:'#1a1218',state:'chase',hitT:0,armor:2,preferRange:290,sumCd:rand(3,6)};
  } else if(type==='cogcrawler'){
    // Frosthold Dungeon: skittering brass construct, fast and fragile.
    e = {type,x,y,r:13,hp:42+depth*5.2,maxHp:42+depth*5.2,speed:rand(125,145),dmg:9+depth*1.7,
         atkCd:0,atkCdMax:0.8,color:'#b08a50',state:'chase',hitT:0,armor:8};
  } else if(type==='gearguard'){
    // Frosthold Dungeon: slow clanking guardian with a telegraphed ground slam (same smash routine as the trolls).
    e = {type,x,y,r:27,hp:(130+depth*15)*1.1,maxHp:(130+depth*15)*1.1,speed:rand(48,58),dmg:(21+depth*2.8)*0.9,
         atkCd:0,atkCdMax:1.5,color:'#a89060',state:'chase',hitT:0,armor:26,tState:'idle',tT:0,tCd:rand(1.5,4),tPt:null};
  } else if(type==='coilsentry'){
    // Frosthold Dungeon: walking coil that kites and throws bolts.
    e = {type,x,y,r:14,hp:30+depth*3.6,maxHp:30+depth*3.6,speed:rand(70,85),dmg:8+depth*1.7,
         atkCd:rand(0,1),atkCdMax:1.7,color:'#7fb8d8',state:'kite',hitT:0,preferRange:210,armor:6};
  } else if(type==='dwconstruct'){
    // Frosthold Dungeon boss: the Ancient Dwarven Construct.
    e = {type,x,y,r:86,hp:(150+depth*16)*1.8*5.5,   /* v452: 25% smaller (was r:115; sprite scales with r) */maxHp:(150+depth*16)*1.8*5.5,speed:62,dmg:(26+depth*3.0)*0.8,
         atkCd:0,atkCdMax:1.4,color:'#c8a050',state:'chase',hitT:0,armor:30};
  } else if(type==='fhturret'){
    // Frosthold Commander's dwarven turret: stationary, throws fireballs.
    e = {type,x,y,r:19,hp:70+depth*8,maxHp:70+depth*8,speed:0,dmg:(14+depth*2.0)*0.9,
         atkCd:0,atkCdMax:2.0,color:'#c8a050',state:'chase',hitT:0,armor:18,fbT:0,fbCd:rand(0.6,2.4)};
  } else if(type==='cavetroll'){
    // Abandoned Mine (v164): slow, tanky, hits like a truck; telegraphed club smash.
    e = {type,x,y,r:27,hp:120+depth*14,maxHp:120+depth*14,speed:rand(46,56),dmg:(19+depth*2.8)*0.85,
         atkCd:0,atkCdMax:1.5,color:'#7a7a64',state:'chase',hitT:0,armor:14,tState:'idle',tT:0,tCd:rand(1.5,4),tPt:null};
  } else if(type==='lavabeetle'){
    // Ember Caverns (v263): beetle-headed hominid -- claws, fireball, telegraphed leap.
    e = {type,x,y,r:15,hp:36+depth*4.4,maxHp:36+depth*4.4,speed:rand(100,118),dmg:10+depth*1.9,
         atkCd:0,atkCdMax:1.0,color:'#c4501e',state:'chase',hitT:0,armor:8,
         tState:'idle',tT:0,tCd:rand(1,3),tPt:null,hop:0,fbT:0,fbCd:rand(0.2,1.8)};
  } else if(type==='windigo'){
    // v520 Ice Windigo: upright frost beast -- claws (50% physical / 50% cold) and a ranged Frost Breath (100% cold)
    e = {type,x,y,r:25,hp:70+depth*9,maxHp:70+depth*9,speed:rand(98,112),dmg:12+depth*2.2,
         atkCd:0,atkCdMax:1.1,color:'#dbe9f0',state:'chase',hitT:0,armor:8,fbT:0,fbCd:rand(0.5,2.5)};
  } else if(type==='wraithling'){
    e = {type,x,y,r:14,physRes:0.5,hp:24+depth*3,maxHp:24+depth*3,speed:rand(130,150),dmg:9+depth*1.7,
         atkCd:0,atkCdMax:1.0,color:'#3a2a5a',state:'chase',hitT:0,armor:0,flying:true,fState:'orbit',fCd:rand(1,3),fT:0,hop:16,fbT:rand(1,3)};
  } else if(type==='poisonwalker'){
    // v427: Poisoned Walker -- a big bloated undead; slams like a troll, and bursts in a poison cloud (plus 3 snakes) when it dies
    e = {type,x,y,r:32,hp:150+depth*17,maxHp:150+depth*17,speed:rand(50,58),dmg:(19+depth*2.8)*0.9,
         atkCd:0,atkCdMax:1.5,color:'#5f7a3a',state:'chase',hitT:0,armor:8,tState:'idle',tT:0,tCd:rand(1.5,4),tPt:null,dmgType:'poison'};
  } else if(type==='poisonsnake'){
    e = {type,x,y,r:9,hp:14+depth*1.8,maxHp:14+depth*1.8,speed:rand(150,175),dmg:6+depth*1.3,
         atkCd:0,atkCdMax:0.8,color:'#6aa83a',state:'chase',hitT:0,armor:0,dmgType:'poison'};
  } else if(type==='shadowcultist'){
    e = {type,x,y,r:17.5,hp:30+depth*4,maxHp:30+depth*4,speed:rand(76,90),dmg:9+depth*1.8,
         atkCd:0,atkCdMax:1.2,color:'#2c1c40',state:'kite',hitT:0,armor:2,preferRange:230};
  } else if(type==='shadowghoul'){
    // Cliffside Ascent (v290): fast, hunched night-stalker.
    e = {type,x,y,r:15.4,hp:28+depth*4.2,maxHp:28+depth*4.2,speed:rand(118,135),dmg:9+depth*1.8,
         atkCd:0,atkCdMax:0.85,color:'#4a3a66',state:'chase',hitT:0,armor:4};
  } else if(type==='risendead'){
    e = {type,x,y,r:17.6,hp:40+depth*5.5,maxHp:40+depth*5.5,speed:rand(62,74),dmg:11+depth*2.0,
         atkCd:0,atkCdMax:1.15,color:'#8a9078',state:'chase',hitT:0,armor:8};
  } else if(type==='fallengolem'){
    e = {type,x,y,r:27,hp:130+depth*15,maxHp:130+depth*15,speed:rand(44,52),dmg:(19+depth*2.8)*0.85,
         atkCd:0,atkCdMax:1.5,color:'#59606c',state:'chase',hitT:0,armor:20,tState:'idle',tT:0,tCd:rand(1.5,4),tPt:null};
  } else if(type==='vulture'){
    e = {type,x,y,r:13.2,hp:20+depth*2.6,maxHp:20+depth*2.6,speed:rand(150,175),dmg:8+depth*1.6,
         atkCd:0,atkCdMax:1.0,color:'#2a2430',state:'chase',hitT:0,armor:0,flying:true,fState:'orbit',fCd:rand(1,3),fT:0,hop:16};
  } else if(type==='harpy'){
    e = {type,x,y,r:13,hp:30+depth*3.4,maxHp:30+depth*3.4,speed:rand(140,165),dmg:10+depth*1.9,
         atkCd:0,atkCdMax:1.0,color:'#bdb6c6',state:'chase',hitT:0,armor:2,flying:true,fState:'orbit',fCd:rand(1,3),fT:0,hop:16,fbT:rand(1,3)};
  } else if(type==='harpyqueen'){
    e = {type,x,y,r:HQ_R,hp:(110+depth*12)*14,maxHp:(110+depth*12)*14,speed:125,dmg:(16+depth*2.6)*0.6,
         atkCd:0,atkCdMax:1.2,color:'#bdb6c6',state:'chase',hitT:0,armor:12,flying:true,hop:22};
  } else if(type==='giant'){
    // v459 Barren Highlands: a towering hill giant -- slow, enormous, devastating telegraphed slams
    e = {type,x,y,r:40,hp:260+depth*30,maxHp:260+depth*30,speed:rand(30,36),dmg:(28+depth*3.8)*0.85,
         atkCd:0,atkCdMax:2.2,color:'#8a7a62',state:'chase',hitT:0,armor:20,tState:'idle',tT:0,tCd:rand(2,4),tPt:null,slamR:95,heavy:true};
  } else if(type==='warg'){
    e = {type,x,y,r:18,hp:34+depth*4.6,maxHp:34+depth*4.6,speed:rand(160,170),   /* v545: about the player's pace (170) */ dmg:11+depth*2.1,
         atkCd:0,atkCdMax:0.75,color:'#4a4440',state:'chase',hitT:0,armor:4};
  } else if(type==='roc'){
    e = {type,x,y,r:22,hp:46+depth*5,maxHp:46+depth*5,speed:rand(160,180),dmg:12+depth*2.2,
         atkCd:0,atkCdMax:1.2,color:'#6a5440',state:'chase',hitT:0,armor:2,flying:true,fState:'orbit',fCd:rand(1,3),fT:0,hop:34};
  } else if(type==='ram'){
    e = {type,x,y,r:21,hp:70+depth*8,maxHp:70+depth*8,speed:rand(72,84),dmg:14+depth*2.4,
         atkCd:0,atkCdMax:1.2,color:'#cfc6b2',state:'chase',hitT:0,armor:10,
         chargeCd:rand(0.5,3), chargeState:'idle', chargeT:0, chargeDir:0, chargeHit:false};
  } else if(type==='mtroll'){
    e = {type,x,y,r:26,hp:120+depth*14,maxHp:120+depth*14,speed:rand(46,56),dmg:(19+depth*2.8)*0.85,
         atkCd:0,atkCdMax:1.5,color:'#6e7a5a',state:'chase',hitT:0,armor:12,tState:'idle',tT:0,tCd:rand(1.5,4),tPt:null};
  } else if(type==='trollelder'){
    e = {type,x,y,r:24,hp:110+depth*12,maxHp:110+depth*12,speed:rand(54,62),dmg:(12+depth*2)*0.8,
         atkCd:0,atkCdMax:1.6,color:'#5e6a52',state:'chase',hitT:0,armor:8,elderCd:rand(1.5,3)};
  } else if(type==='firebat'){
    // Ember Caverns (v263): flying; circles and dives. Ignores obstacles/lava.
    e = {type,x,y,r:11,hp:18+depth*2.4,maxHp:18+depth*2.4,speed:rand(150,175),dmg:7+depth*1.5,
         atkCd:0,atkCdMax:1.0,color:'#d8641e',state:'chase',hitT:0,armor:0,flying:true,fState:'orbit',fCd:rand(1,3),fT:0,hop:16};
  } else if(type==='magmagolem'){
    // Ember Caverns (v263): stone-and-fire brute (troll-style smash); explodes when it dies (see golemDeath).
    e = {type,x,y,r:26,hp:130+depth*15,maxHp:130+depth*15,speed:rand(44,54),dmg:(19+depth*2.8)*0.9,
         atkCd:0,atkCdMax:1.5,color:'#7a4a3a',state:'chase',hitT:0,armor:18,tState:'idle',tT:0,tCd:rand(1.5,4),tPt:null};
  } else if(type==='magmacrawler'){
    // Heart of the Mountain (v263): tiny lava lizards that pour out of the Colossus' cracks.
    e = {type,x,y,r:10,hp:14+depth*1.8,maxHp:14+depth*1.8,speed:rand(120,140),dmg:6+depth*1.2,
         atkCd:0,atkCdMax:0.9,color:'#d0501a',state:'chase',hitT:0,armor:0};
  } else if(type==='colossus'){
    // Heart of the Mountain boss (v263): see updateColossus.
    e = {type,x,y,r:118,hp:(110+depth*12)*26,maxHp:(110+depth*12)*26,speed:78,dmg:(16+depth*2.6)*0.68,
         atkCd:0,atkCdMax:1.6,color:'#c4501e',state:'chase',hitT:0,armor:26};
  } else if(type==='balrog'){
    // Abandoned Mine floor 10 boss (v164): see updateBalrog.
    e = {type,x,y,r:40,hp:(130+depth*14)*9,maxHp:(130+depth*14)*9,speed:88,dmg:(18+depth*2.8)*0.6,
         atkCd:0,atkCdMax:1.3,color:'#e0502a',state:'chase',hitT:0,armor:12};
  } else if(type==='trex'){
    // Rex, the Crater King (v184): replaces Gojira in the crater once she is slain. See updateTrex.
    e = {type,x,y,r:78,hp:(110+depth*12)*10,maxHp:(110+depth*12)*10,speed:125,dmg:(16+depth*2.6)*0.6,
         atkCd:0,atkCdMax:1.3,color:'#5a6b2a',state:'chase',hitT:0,armor:14,tState:'idle',tT:0,tCd:99,tPt:null,hop:0};
  } else if(type==='gojira'){
    // Redridge Crater boss (v177): see updateGojira.
    e = {type,x,y,r:105,hp:(110+depth*12)*24,maxHp:(110+depth*12)*24,speed:118,dmg:(16+depth*2.6)*0.62,
         atkCd:0,atkCdMax:1.5,color:'#7a2418',state:'chase',hitT:0,armor:18,tState:'idle',tT:0,tCd:99,tPt:null,hop:0};
  } else if(type==='lightningraptor'){
    // Raptor Lair boss (v154): see updateLightningRaptor.
    e = {type,x,y,r:60,hp:(110+depth*12)*8,maxHp:(110+depth*12)*8,speed:112,dmg:(16+depth*2.6)*0.55*1.25,
         atkCd:0,atkCdMax:1.1,color:'#3a64b8',state:'chase',hitT:0,armor:10,tState:'idle',tT:0,tCd:99,tPt:null,hop:0};
  } else if(type==='boar'){
    // Withered Crossroads (v69): a fast "hit and run" archetype -- low-medium hp,
    // clearly the fastest base move speed of any Withered Crossroads (or Forest)
    // enemy, built entirely around its long-range charge (see BOAR_CHARGE_*
    // above and the e.type==='boar' branch in update()) rather than a
    // strong standing melee attack; its regular (non-charge) hit is
    // deliberately the weakest of the zone's three enemy types.
    e = {type,x,y,r:16,hp:24+depth*3.2,maxHp:24+depth*3.2,speed:rand(105,125),dmg:7+depth*1.5,
         atkCd:0,atkCdMax:1.0,color:'#6b4a3a',state:'chase',hitT:0,armor:0,
         boarChargeCd:rand(0.5,BOAR_CHARGE_CD), boarChargeState:'idle', boarChargeT:0, boarChargeDir:0, boarChargeHit:false};
  } else {
    e = {type,x,y,r:21,hp:55+depth*7,maxHp:55+depth*7,speed:rand(48,58),dmg:13+depth*2.2,
         atkCd:0,atkCdMax:1.1,color:'#8a3fae',state:'chase',hitT:0,armor:10};
  }
  e.ml = monsterLevel(g);
  { const ref = 55 + depth*7; e.hpXp = clamp(Math.sqrt(e.hp/ref), 1, 3); }   // v490: tougher (bigger-life) monsters give more XP -- brutes, treants, giants, trolls
  // v538: area-level scaling -- the type's own formula only sets its size relative to a standard monster; life comes from monStdLife(ML)
  e.hp = Math.max(1, Math.round(e.hp/oldStdLife(depth)*monStdLife(e.ml)*(g.scene==='frosthold' ? FROSTHOLD_LIFE_MULT/(e.ml>=LATE_LIFE_LV ? LATE_LIFE_MULT : 1) : 1))); e.maxHp = e.hp;   // v560: Frosthold Keep +15% only (the tower/dungeon beyond get +25% via monStdLife)
  // v228: Dark Forest / Bear Cave bears are softer (smaller life bonus, thinner hide)
  if(type==='bear' && (g.scene==='forest' || g.scene==='bearcave')){ e.hp = Math.round(e.hp*0.65); e.maxHp = e.hp; e.armor = Math.min(e.armor||0, 5); }
  e.dmg = e.dmg/oldStdDmg(depth)*monStdDmg(e.ml);   // v538: damage likewise from monStdDmg(ML)
  // v515: no under-level softening at all -- a zone's monsters keep their full strength (v490 had 1%/level, v237 4%/level); the over-level taper in monsterLevel() is unchanged
  if(type==='colossus'){   // v354: no over-level scaling for the Colossus (monster level pinned to the area), and its base damage is cut ~40%
    const mlc = Math.min(e.ml, g.depth||e.ml);
    e.hp = Math.round(e.hp*monStdLife(mlc)/monStdLife(e.ml)); e.maxHp = e.hp;
    e.dmg *= monStdDmg(mlc)/monStdDmg(e.ml)*0.6; e.ml = mlc;
  }
  e.dmgType = ENEMY_DMG_TYPE[type] || 'normal';
  // v484: split hits -- half physical, half an element (resists only cut the elemental half)
  e.dmgSplit = ENEMY_DMG_SPLIT[type] || null;
  if(e.dmgSplit && e.dmgType===e.dmgSplit) e.dmgType = 'normal';
  if(game && game.scene==='blackmarsh' && (e.dmgType==='normal' || e.dmgType==='poison')){ e.dmgType = 'normal'; e.dmgSplit = 'poison'; }
  Object.assign(e, {animT:Math.random()*10, facing:{x:0,y:1}, faceSign:1, moving:false, atkAnimT:0, stunT:0,
    // "home" spot + aggro/leash tuning -- only acted on in the Forest (see
    // update()), so this is harmless for dungeon enemies, which always engage
    homeX:x, homeY:y, aggroed:false, wanderTarget:null, wanderCd:rand(0,2)});
  if(WILDLIFE_TYPES[type]) wildlifeAggro(e);
  if(type==='wolf'){ e.aggroRange=230; e.leashRange=420; e.wanderRadius=60; }
  else if(type==='spider'){ e.aggroRange=210; e.leashRange=380; e.wanderRadius=50; }
  else if(type==='bear'){ e.aggroRange=190; e.leashRange=380; e.wanderRadius=45; }
  else if(type==='treant'){ e.aggroRange=180; e.leashRange=360; e.wanderRadius=35; }
  else if(type==='frozenzombie'){ e.aggroRange=170; e.leashRange=340; e.wanderRadius=40; }
  else if(type==='fhdwarf' || type==='fhcleric'){ e.aggroRange=250; e.leashRange=500; e.wanderRadius=45; }
  else if(type==='fhaxe'){ e.aggroRange=270; e.leashRange=500; e.wanderRadius=45; }
  else if(type==='fhbrute'){ e.aggroRange=230; e.leashRange=480; e.wanderRadius=35; }
  else if(type==='bandit'){ e.aggroRange=220; e.leashRange=420; e.wanderRadius=55; }
  else if(type==='banditarcher'){ e.aggroRange=230; e.leashRange=420; e.wanderRadius=55; }
  else if(type==='banditbrute'){ e.aggroRange=210; e.leashRange=400; e.wanderRadius=50; }
  else if(type==='skeleton'){ e.aggroRange=210; e.leashRange=400; e.wanderRadius=50; }
  else if(type==='skeletonarcher'){ e.aggroRange=184; e.leashRange=420; e.wanderRadius=55; }
  else if(type==='skeletonbrute'){ e.aggroRange=210; e.leashRange=400; e.wanderRadius=50; }
  else if(type==='wraith'){ e.aggroRange=99999; e.leashRange=99999; e.wanderRadius=0; }
  else if(type==='leviathan'){ e.aggroRange=99999; e.leashRange=99999; e.wanderRadius=0; }
  else if(type==='boar'){ e.aggroRange=210; e.leashRange=440; e.wanderRadius=60; }
  else if(type==='zombie'){ e.aggroRange=170; e.leashRange=340; e.wanderRadius=40; }
  else if(type==='vampire'){ e.aggroRange=260; e.leashRange=500; e.wanderRadius=50; }
  else if(type==='alligator'){ e.aggroRange=240; e.leashRange=480; e.wanderRadius=90; }
  else if(type==='tortuga'){ e.aggroRange=200; e.leashRange=400; e.wanderRadius=70; }
  else if(type==='anaconda'){ e.aggroRange=230; e.leashRange=480; e.wanderRadius=90; }
  else if(type==='giantoad'){ e.aggroRange=210; e.leashRange=420; e.wanderRadius=50; }
  else if(type==='poisonplant'){ e.aggroRange=360; e.leashRange=520; e.wanderRadius=0; }
  else if(type==='lightningraptor'){ e.aggroRange=500; e.leashRange=99999; e.wanderRadius=0; }
  else if(type==='trex'){ e.aggroRange=520; e.leashRange=99999; e.wanderRadius=0; }
  else if(type==='gojira'){ e.aggroRange=900; e.leashRange=99999; e.wanderRadius=0; }
  else if(type==='armordon'){ e.aggroRange=200; e.leashRange=420; e.wanderRadius=40; }
  else if(type==='raptor'){ e.aggroRange=250; e.leashRange=480; e.wanderRadius=70; }
  else if(type==='crawler'){ e.aggroRange=470; e.leashRange=700; e.wanderRadius=60; }
  else if(type==='buffalo'){ e.aggroRange=1; e.leashRange=650; e.wanderRadius=120; }
  else if(type==='stormsnake'){ e.aggroRange=230; e.leashRange=480; e.wanderRadius=70; }
  else if(type==='sandsnake'){ e.aggroRange=200; e.leashRange=420; e.wanderRadius=60; }
  else if(type==='goblin'){ e.aggroRange=240; e.leashRange=440; e.wanderRadius=60; }
  else if(type==='goblinarcher'){ e.aggroRange=260; e.leashRange=440; e.wanderRadius=60; }
  else if(type==='fhtemplar'){ e.aggroRange=260; e.leashRange=99999; e.wanderRadius=0; }
  else if(type==='hwsentinel' || type==='hwwarden' || type==='hwvanguard' || type==='hwmendicant' || type==='hwbulwark' || type==='hwduelist'){ e.aggroRange=300; e.leashRange=99999; e.wanderRadius=0; }
  else if(type==='banditking'){ e.aggroRange=480; e.leashRange=99999; e.wanderRadius=0; }
  else if(type==='hwguardian'){ e.aggroRange=700; e.leashRange=99999; e.wanderRadius=0; }
  else if(type==='cultist'){ e.aggroRange=300; e.leashRange=520; e.wanderRadius=40; }
  else if(type==='fhturret'){ e.aggroRange=1200; e.leashRange=99999; e.wanderRadius=0; }
  else if(type==='cogcrawler'){ e.aggroRange=240; e.leashRange=440; e.wanderRadius=60; }
  else if(type==='gearguard'){ e.aggroRange=220; e.leashRange=420; e.wanderRadius=40; }
  else if(type==='coilsentry'){ e.aggroRange=260; e.leashRange=440; e.wanderRadius=40; }
  else if(type==='dwconstruct'){ e.aggroRange=800; e.leashRange=99999; e.wanderRadius=0; }
  else if(type==='cavetroll'){ e.aggroRange=220; e.leashRange=420; e.wanderRadius=40; }
  else if(type==='balrog'){ e.aggroRange=600; e.leashRange=99999; e.wanderRadius=0; }
  else if(type==='lavabeetle'){ e.aggroRange=240; e.leashRange=440; e.wanderRadius=60; }
  else if(type==='wraithling'){ e.aggroRange=360; e.leashRange=560; e.wanderRadius=80; }
  else if(type==='poisonwalker'){ e.aggroRange=230; e.leashRange=420; e.wanderRadius=40; }
  else if(type==='poisonsnake'){ e.aggroRange=400; e.leashRange=700; e.wanderRadius=40; }
  else if(type==='shadowcultist'){ e.aggroRange=360; e.leashRange=520; e.wanderRadius=50; }
  else if(type==='shadowghoul'){ e.aggroRange=300; e.leashRange=520; e.wanderRadius=70; }
  else if(type==='risendead'){ e.aggroRange=240; e.leashRange=440; e.wanderRadius=60; }
  else if(type==='fallengolem'){ e.aggroRange=230; e.leashRange=420; e.wanderRadius=40; }
  else if(type==='vulture'){ e.aggroRange=360; e.leashRange=560; e.wanderRadius=100; }
  else if(type==='harpy'){ e.aggroRange=380; e.leashRange=600; e.wanderRadius=100; }
  else if(type==='harpyqueen'){ e.aggroRange=99999; e.leashRange=99999; e.wanderRadius=0; }
  else if(type==='wraithlord' || type==='demonboss'){ e.aggroRange=99999; e.leashRange=99999; e.wanderRadius=0; }
  else if(type==='brimstonebrute'){ e.aggroRange=500; e.leashRange=900; e.wanderRadius=40; }
  else if(type==='hellhound' || type==='cinderfiend'){ e.aggroRange=520; e.leashRange=900; e.wanderRadius=40; }
  else if(type==='firebat'){ e.aggroRange=280; e.leashRange=480; e.wanderRadius=80; }
  else if(type==='giant'){ e.aggroRange=260; e.leashRange=560; e.wanderRadius=160; }
  else if(type==='windigo'){ e.aggroRange=330; e.leashRange=560; e.wanderRadius=70; }
  else if(type==='warg'){ e.aggroRange=270; e.leashRange=480; e.wanderRadius=80; }
  else if(type==='roc'){ e.aggroRange=300; e.leashRange=560; e.wanderRadius=140; }
  else if(type==='ram'){ e.aggroRange=200; e.leashRange=460; e.wanderRadius=90; }
  else if(type==='mtroll' || type==='trollelder'){ e.aggroRange=240; e.leashRange=440; e.wanderRadius=30; }
  else if(type==='magmagolem'){ e.aggroRange=220; e.leashRange=420; e.wanderRadius=40; }
  else if(type==='magmacrawler'){ e.aggroRange=200; e.leashRange=400; e.wanderRadius=40; }
  else if(type==='colossus'){ e.aggroRange=99999; e.leashRange=99999; e.wanderRadius=0; }
  else { e.aggroRange=200; e.leashRange=400; e.wanderRadius=50; }
  e.aggroRange = Math.round(e.aggroRange*0.72); // (v147) shorter engagement distance overall
  // v456 tuning
  if(/brute/.test(type)){ e.atkCdMax *= 0.75; e.meleeBonus = 14; }                         // brutes: bigger swing area, faster normal swings
  if(type==='skeleton' || type==='skeletonarcher' || type==='bandit' || type==='banditarcher' || type==='goblin' || type==='goblinarcher') e.speed *= 1.5;
  if(type==='cavetroll'){ e.speed *= 2; e.meleeBonus = 26; e.meleeSplash = true; }           // troll club hits everything in a wider circle
  if(type==='zombie') e.speed *= 1.07;
  // v491: the risen dead shamble (D2 feel) -- skeletons ~44% of your speed, their archers a little quicker, goblins clearly faster than both
  if(type==='skeleton') e.speed *= 0.56;
  if(type==='skeletonarcher') e.speed *= 0.7;
  if(type==='goblin' || type==='goblinarcher') e.speed *= 0.575;
  // v490 tuning: bandits slower; trolls 10% smaller
  if(type==='bandit' || type==='banditarcher') e.speed *= 0.8;
  if(type==='cavetroll' || type==='mtroll' || type==='trollelder'){ e.r = Math.round(e.r*0.9); if(e.baseR) e.baseR = e.r; }
  if(type==='mtroll'){ e.speed *= 1.6; e.meleeBonus = 22; e.meleeSplash = true; }
  if(type==='giant'){ e.meleeBonus = 34; e.meleeSplash = true; }
  if(type==='treant'){ e.meleeBonus = 22; e.meleeSplash = true; }   // v456: a sweeping branch slam
  if(g.scene==='forest') e.dmg *= 0.9;   // v476: the Dark Forest hits 10% softer
  g.enemies.push(e);
  return e;
}

function startGame(saved, cls){
  game = newGame(saved, cls);
  game.scene = 'town';
  game.town = makeTown(game.player.level);
  game.room = game.town;
  game.player.x = game.town.spawn.x; game.player.y = game.town.spawn.y;
  game.started = true;
  document.getElementById('start').style.display='none';
  document.getElementById('overlay').style.display='none';
  document.getElementById('classSelect').style.display='none';
  skillTreeOverlay.style.display='none';
  invOverlay.style.display='none';
  document.getElementById('charStatsOverlay').style.display='none';
  shopOverlay.style.display='none';
  questGiverOverlay.style.display='none';
  questLogOverlay.style.display='none';
  stashOverlay.style.display='none';
  teleportOverlay.style.display='none';
  bagBadge.style.display='none';
  skillsBadge.style.display='none';
  updateSkillButtonsVisibility();
  updateQuestBadge();
  document.getElementById('buttons').style.display = 'none';
  // v86: shown (not hidden) in Town -- see goToTown's matching comment.
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
  ensureFollowers(game); // v86: sync any already-ranked companions right away on (re)load
  checkLightTheWayQuest(); // beacon already lit from before? complete the quest
  try{ ruinsInscriptionRepair(game.player); }catch(err){}
  showMsg(saved ? 'Welcome back' : 'Welcome to Mistfall', 1.4);
  try{ recalcStats(game.player); wellRestedUi(); applyBedWake(); }catch(err){ console.error('bedWake', err); }
  lastT = performance.now();
  requestAnimationFrame(loop);
  if(!saved) saveGame(); // establish a save right away for a brand-new character too
}

