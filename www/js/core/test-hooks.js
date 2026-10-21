window.__enter = {enterAncientRuins, enterBearCave, enterBlackMarsh, enterCliffside, enterCursedCemetery, enterDarkCrypt, enterDeep, enterFhDungeon, enterFhTower, enterFloodedTemple, enterForest, enterForgottenTower, enterFrosthold, enterHighlands, enterHighward, enterIcyZone, enterKeep, enterLakesideRuins, enterLighthouseTower, enterMarshPool, enterMinotaurCave, enterMountainPass, enterRRTower, enterRaptorLair, enterRedCrater, enterRedridge, enterRiverValley, enterSpiderLair, enterSunkenDepths, enterSunlitPlains, zoneDisplayName};
window.__test = { spawnSquid, spawnEel, classResistRewardItem, makeSkillTomeItem, readSkillTome, witchGiveRecipes, castLightningArcBolt, staticArcBonus, spawnShrineProtectors, achLoad, achTick: (dt)=>achTick(game, dt), renderAchievements, openAchievements, audMoodFor: ()=>audMoodFor(game), ironStillMult: (p)=>ironStillMult(p), enterHighward, enterHighlands, enterLakesideRuins, enterCursedCemeteryX: (o)=>enterCursedCemetery(o), runeforgeDo, forgeDoubleItem, forgeAddSkillImplicit, openShop, itemCardHtml, renderInventory, affixText, enterRiverValley, enterCursedCemetery, ruinsInscriptionRepair, placeFhKey, brBossKind, brCheckpoint, enterBreach, breachFloorCleared, brReach, audPeak: ()=>{ const a=AUD.analyser, d=new Float32Array(a.fftSize); a.getFloatTimeDomainData(d); let m=0; for(const x of d) m=Math.max(m,Math.abs(x)); return m; }, sfxPlay: (n,v)=>sfxPlay(n,v), audInit: ()=>audInit(), audState: ()=>AUD.ctx&&AUD.ctx.state,
  questArtSvg, drawFhCommanderIso,
  uq, knightGear, knightEq, renderKnightsBag, STONE_RECIPES, PART_DEFS, SIG_DROPS, addPart, makeRecipeBookItem, readRecipeBook, placeSurvTrap, partBonuses, recalcStats, playerDamage, ensureFollowers, renderInventory, forceAddToBag, followerDmg, makeResistRewardRing, huntBossKilled, HUNTER_QUESTS, openSubChest, wraithLordSlain, witchCauldronInteract, openHunterDialogue, talkScholar, makeAwakenedRuneItem,
  enterSunlitPlains,
  bagArtSvg, renderInventory, forceAddToBag,
  playerHitChance, enemyAttackRating, playerDamage, monsterLevel, spawnEnemy, openInventory, openCharStats, openSettings, openQuestLog, openSkillTree, openStash, openMenu, makeFollower, AUD, SFX, MOODS, audInit, audSetMood, sfxPlay, audioFrame, audPump,
  generateItem, pickRarity, rewardRarity, eliteRarity, bossRarity, packRarity, openItemDetail, itemCardHtml, openItemCompare, makeRareName, migrateItemAffixes, compareTargetFor, equipItem,
  PC, pcFrame, pcCursorWorld, getKeybinds, KEYBIND_DEFAULTS, uiOpen,
  nodeEffectText, EQUIP_AFFIXES, PCT_AFFIX_ROLL, IMPLICIT_FORMULA, SKILL_TREE_CLASS_GROUP, enterKeep, makeKeep, readKeepLore, placeRunestones, gainXp, spawnWraithLord, keepLoreProgress, hasAllRunestones, enterCliffside, makeCliffside, updateCliffside, spawnHarpyQueen, enterHighward, startGame, newGame, necroV268Tick, necroSkeletonDeath, soulHungerMult, deathBoltBounces, necroSkeletonCount, aimedShotMult, stunShotStunChance, survDodgeRegenStart, packSlash, ambushLand, bearSizeMult, followerMaxHp, applyFollowerDamage, updateFollowersAI, resCost, isTemplar, followerDmg, castSmite, placeBanner, castConsecrate, castJudgment, castSmite, bulwarkRelease, bannerOf, inBanner, templarFollowerMult, weaponDmgMult, playerDamage, treesForClass, SKILL_TREES, warriorV266Tick, assaultFinisher, rampageBonus, bloodrageMult, unbreakableLowDr, skillAvgDamage, nodeEffectText,
  getGame: ()=>game, musProbe: (k)=>{ const b=AUD.mus[k]; if(!b) return null; const d=b.getChannelData(0); return {len:b.length, s1000:Array.from(d.slice(1000,1004)), tail:Array.from(d.slice(d.length-4))}; }, sndDebug: ()=>({ok:AUD.ok, loaded:Object.keys(AUD.buf||{}).length, bank:Object.keys(SND_BANK).length, mus:Object.keys(AUD.mus||{}), mood:AUD.moodName, musDur:Object.fromEntries(Object.entries(AUD.mus||{}).map(([k,b])=>[k,b.duration]))}), talkMiner, startMinerSwarm, makeMinerRing, mineFlowTarget, mineBfs, gainResource, enterTavern, tavernGoUpstairs, applyEnemyArmor, enemyResist, enterFhTower, fhtStairsUp, fhtStairsDown, openTemplarChest, witchCauldronInteract, usePotion, makePotionItem, makeLeviathanScaleItem, makeMastodonHoofItem, makeElectricTentacleItem, makeMoltenShellItem, closeNpcText, huntBossKilled, openItemDetail, openBlacksmithMenu, openShop, socketBenchSet, smithState, hasHammer, updateBalrog, initBalrog, respawnInRegion, showBigMsg, migrateItemAffixes, PCT_AFFIX_ROLL, nearestDroppedItem, pickupNearbyDropped, spawnMarshLeviathan, spawnLeviathanBoss, enterSunkenDepths, enterMarshPool, enterDeep, deepStairsDown, deepStairsUp, spawnDeepFloor, initColossus, updateColossus, colossusSlain, makeDeepFloor, HEART_AX0, HEART_AX1, HEART_CX, HEART_CY, enterBlackMarsh, SUNK_CY, POOL_CX, POOL_CY,
  completeWraithQuest, openTemplarChest, QUEST_WRAITH, getQuest,
  enterForest, enterMountainPass, enterIcyZone, makeIcyZone, enterFrosthold, makeFrosthold, enterRedridge, makeRedridge, enterHighward, makeHighward, spawnHighward, takeHwRunestone, pullHwSwitch, hwGuardianDown, hwAltarReady, hwSwitchReady, enterRRTower, rrGoFloor, lightRRBeacon, posBlockedByObstacles, bossRecipeDrop, socketCost, partBonuses, refreshBarStock, makePotionItem, PART_DROPS, SIG_DROPS, STONE_RECIPES, lightRRBeacon, rrBeaconCount, enterRedCrater, makeRedCrater, crElevAt, crEnforce, crTileE, spawnGojira, spawnTrex, throwDragonBolt, dragonBoltAvailable, makeDragonBoltItem, makeObsidianRuneItem, takeObsidianRune, giveRuneToSmith, gojiraChainStage, claimGojiraChain, runeforgeDo, runeforgeOutcomes, obsidianRuneAvailable, openShop, updateGojira, rollSpecialMonsters, makeElite, makeMagic, pickMods, applyMods, isBigMonster, renderWorldMap, updateHudNums, enterRaptorLair, makeRaptorLairFloor, openRuneMenu, runeConfirm, enterSpiderLair, enterBearCave, enterDarkCrypt,
  nextDepth, spawnEnemy, spawnForestPack, spawnMountainPassPack,
  isBossFloor, goToTownSafe, goToTownFromBoss,
  // v63 combat-rebalance batch: exposed for regression testing.
  blockChance, hasShieldEquipped, defensiveStanceActive,
  ironSkinDefensePct, ironSkinDamageReduction,
  pickEnemyTarget, markAttacked, applyEnemyArmor, gainXp, recalcStats,
  BLOCK_CHANCE_BASE, BLOCK_CHANCE_CAP, RIPOSTE_BLOCK_PER_RANK,
  DEFENSIVE_STANCE_BLOCK_PER_RANK, IRON_SKIN_DEFENSE_PCT_BY_RANK,
  IRON_SKIN_RANK5_DAMAGE_REDUCTION, CLEAVE_HALF_ANGLE, CLEAVE_ARMORPEN_PER_RANK,
  // v64 batch: exposed for regression testing.
  canRankUp, nodeLevelReq, committedCapstone, characterLabel, capstoneTreeName,
  treesForClass, SKILL_TREES, RANGER_SKILL_TREES, MYSTIC_SKILL_TREES,
  fieldDressRegenRate, FIELD_DRESS_CD, preciseShotActive, preciseShotCooldown,
  preciseShotCooldownMult, nodeEffectText, rankUpNode,
  // v65 batch: exposed for regression testing of the hunter-rescue quest rework.
  crStomp, getQuest, makeHunterRewardRing, xpForLevel, xpForKill, enterLakesideRuins, enterAncientRuins, spawnEnemy, addPart, partsMaybeDrop, PART_DEFS, openWitchParts, witchCauldronInteract, recalcStats, QUEST_FIND_HUNTERS, QUEST_MASTODON, QUEST_LEVIATHAN, huntBossKilled, claimShrineBlessing, spawnProtector, huntMastodonKilled, checkQuestHunterAt, ensureHuntersQuestStarted,
  spawnQuestHunters, spawnSpiderLairWave, spawnBearCaveWave, HUNTER_RESCUE_HINT,
  // v66 batch: exposed for regression testing of the armor access matrix,
  // class-locked-weapon toasts, the shield/2h-weapon auto-equip fix, and
  // the Town Mine-portal removal / waypoint consolidation.
  equipItem, unequipSlot, tryAutoEquip, generateItem, priceFor, buyPriceFor, forceAddToBag,
  canEquipArmorMaterial, ARMOR_ACCESS_MATRIX, itemClassRestriction,
  occupiesOffhand, goToTown, openTeleportMenu,
  // v67 batch: exposed for regression testing of the vendor sell
  // click-through guard, the new Character Stats popup, and the
  // follower catch-up-speed / teleport-back-distance changes.
  openItemDetail, closeItemDetail, getItemDetailOpenedAt:()=>itemDetailOpenedAt,
  ITEM_DETAIL_GUARD_MS, statSummaryHtml,
  openCharStats, closeCharStats,
  oneScreenDist, FOLLOWER_STUCK_TELEPORT_TIME,
  FOLLOWER_CATCHUP_MULT_MIN, FOLLOWER_CATCHUP_MULT_MAX,
  FOLLOWER_ATTACK_LEASH_RANGE, FOLLOWER_FOLLOW_DIST,
  // v68 batch: exposed for regression testing of the Dark Forest expansion
  // (bigger zone, ~10x monster count, repositioned cave entrances, Treant).
  makeForest, FOREST_W, FOREST_H, FOREST_PACK_ANCHOR_TARGET,
  FOREST_PACK_TEMPLATES, forestPackSize, drawTreantIso,
  // v69 batch: exposed for regression testing of the new Withered Crossroads
  // zone (Dark Forest's new north exit, the "+"-shaped crossroad, its
  // waypoint/teleport wiring, and the Bandit/Bandit Archer/Wild Boar
  // enemies -- including the boar's long-range charge + knockback).
  makeSunlitPlains, enterSunlitPlains, SUN_W, SUN_H, SUN_CX, SUN_CY,
  SUNLIT_SOUTH_EXIT_SPOT, SUNLIT_WEST_EXIT_SPOT, SUNLIT_EAST_EXIT_SPOT,
  SUNLIT_PACK_ANCHOR_TARGET, SUNLIT_PACK_COUNT, SUNLIT_PACK_TEMPLATES,
  spawnSunlitPack, drawBoarIso, BOAR_CHARGE_RANGE, BOAR_CHARGE_CD,
  BOAR_KNOCKBACK_DIST, BEAR_CHARGE_RANGE, ZOMBIE_CHARGE_RANGE, staggerEnemy, pickEnemyTarget, gainResource, wsRageMult,
  playerDamage, recalcStats, usePotionSlot, steerAngleTo, rankUpNode, canRankUp, toIso, monsterLevel,
  stepSim:(dt)=>{ if(game && game.started && !game.over){ tickBuffs(dt); update(dt); } }, setSimPause:(v)=>{ window.__simPause = !!v; },
  // test hooks (headless bots): drive the joystick and buttons
  setJoy:(x,y)=>{ joyVec={x,y}; }, press:(k)=>{ if(k==='attack') wantAttack=true; else if(k==='dodge') wantDodge=true; else if(k==='slot1') triggerSkillSlot('slot1'); else if(k==='slot2') triggerSkillSlot('slot2'); else if(k==='slot3') triggerSkillSlot('slot3'); else if(k==='potion') usePotionSlot(); },
  // v70 batch: exposed for regression testing of Lighthouse Tower (the
  // Withered Crossroads west gate, the 5 fixed ascending floors with permanent
  // alternating-side stairs, its two waypoints, the Bandit Brute enemy,
  // and the rooftop beacon/chest).
  makeLighthouseFloor, enterLighthouseTower, lighthouseAscend,
  spawnLighthouseFloor, lighthouseEntranceSide, lighthouseStairsSide,
  LIGHTHOUSE_FLOOR_COUNT, LIGHTHOUSE_W, LIGHTHOUSE_H,
  LIGHTHOUSE_ROOFTOP_W, LIGHTHOUSE_ROOFTOP_H,
  drawLighthouseBeaconIso, drawLighthouseDoorIso,
  // v71 batch: exposed for regression testing of Lakeside Ruins (the
  // Withered Crossroads east gate, the water/bridge/island collision geometry,
  // the new Skeleton/Leviathan enemy types, and the island Stonehenge).
  makeLakesideRuins, enterLakesideRuins, spawnLakesidePack, makeBlackMarsh, enterBlackMarsh, BM_W, BM_H, bmRiverY, bmWaterAt, drawRegionDarkening,
  LAKE_W, LAKE_H, LAKE_CX, LAKE_CY, LAKE_ROAD_HALFW,
  LAKE_WATER_X, LAKE_WATER_W, LAKE_WATER_Y0, LAKE_WATER_Y1, LAKE_ISLAND_R,
  LAKE_PACK_ANCHOR_TARGET, LAKE_PACK_COUNT, LAKE_LEVIATHAN_COUNT,
  lakeOnRoad, lakeOnIsland, drawLakesideStoneIso, drawRuinsGateIso,
  // v72 batch: exposed for regression testing of Cursed Cemetery (the
  // Withered Crossroads south gate, the half-area zone sizing, the Skeleton/
  // Zombie Skeleton Archer/Spider/Skeletal Brute spawn pool, the dead
  // tree/grave scatter, the zone-clear -> tomb-unlock trigger, and the
  // Dark Crypt stub it leads to).
  makeCursedCemetery, enterCursedCemetery, spawnCemeteryPack,
  CEM_W, CEM_H, CEM_CX, CEM_ROAD_HALFW, CEMETERY_ENTRANCE_SPOT, CEM_TOMB_SPOT,
  CEM_PACK_ANCHOR_TARGET, CEM_PACK_COUNT, CEM_PACK_TEMPLATES,
  cemOnRoad, drawDeadTreeIso, drawGraveIso, drawTombIso, drawCemeteryFloor,
  // v73 batch: exposed for regression testing of the real Dark Crypt
  // dungeon (the fixed corridor layout, the general Skeleton/Zombie/Spider
  // population, the fixed 5-Vampire pack + lifesteal, the permanent Ruins
  // Map chest, the near-entrance waypoint, and the darkness overlay).
  makeDarkCrypt, enterDarkCrypt, DARKCRYPT_W, DARKCRYPT_H,
  spawnDarkCryptPopulation, darkCryptLights, darkCryptCarveObstacles,
  makeRuinsMapItem, VAMPIRE_LIFESTEAL_PCT,
  DARKCRYPT_PLAYER_LIGHT_R, DARKCRYPT_TORCH_LIGHT_R, DARKCRYPT_EYE_DOT_R,
  // v74 batch: exposed for regression testing of the generalized
  // active-skill loadout system (Main/1/2/3 assignable buttons, the
  // permanent Dodge button, the skill-tree Assign menu, and skillSlots
  // persistence).
  ACTIVE_SKILL_REGISTRY, ASSIGN_EXCLUDE_IDS, assignableSkillsForPlayer,
  activeSkillRank, triggerSkillSlot, updateSkillSlotButtonsUI,
  openSkillAssignMenu, closeSkillAssignMenu, assignSkillToSlot,
  getSkillAssignPendingId: ()=>skillAssignPendingId,
  // v75 batch: exposed for regression testing of the Djinn tree (Mystic's
  // 1st tree -- Lightning Arc's automatic main-attack override, Lightning
  // Chain, Nova's Shock DoT, Tornado, Storm's crit synergy, and Hurricane).
  MYSTIC_SKILL_TREES, lightningArcChains, novaShockDuration, stormDuration,
  stormCritBonus, critMultOf, hurricaneDuration, skillMult, DJINN_NODE_IDS,
  LIGHTNING_CHAIN_RANGE, LIGHTNING_CHAIN_DMG_MULT, LIGHTNING_ARC_STUN_DUR,
  NOVA_CD, NOVA_RADIUS, NOVA_SHOCK_DPS_PCT, TORNADO_CD, TORNADO_BASE_DMG,
  // v103: Tornado rework -- exposed for regression testing of its slower
  // speed, tick-damage interval and pierce (see the pr.isTornado branches).
  TORNADO_SPEED, TORNADO_TICK_INTERVAL, TORNADO_LIFE,
  STORM_CD, STORM_RADIUS, STORM_CRIT_BONUS, HURRICANE_CD, hurricaneCooldown, HURRICANE_RADIUS,
  // v76 batch: exposed for regression testing of the Elementalist tree
  // (Mystic's 2nd tree -- Elemental Polarity's virtual Fireball/Ice Bolt
  // skills, Elemental Explosions' splash+ailment-chance, Fire Bomb, Ice
  // Armor's temporary Damage Reduction, Pyro Torrent's channel-cone, and
  // Blizzard's capstone Freeze).
  ELEMENTALIST_NODE_IDS, VIRTUAL_SKILL_NAMES, enemyStatusEl, applyStatusToPlayer, applyStatusToFollower, tickPlayerStatuses, followerStatusTick, drawWithStatus, coldHit, polarityCast, polarityBonus, fireballCount, selfFireDamage, thunderstepDodge, immolateBoost, iceArmorSlowPct, iceArmorSlowMult, permafrostSpeedMult, isEliteOrBrute, NOVA_DMG_MULT, HEAVY_SPELL_MULT,
  elementalPolarityDmg, elementalExplosionAilmentChance, iceArmorDamageReduction, iceArmorAbsorb, shatterIceArmor,
  pyroTorrentDuration, FIREBALL_BASE_DMG, ICE_BOLT_BASE_DMG, FIREBALL_CD, ICE_BOLT_CD,
  ELEMENTAL_EXPLOSION_RADIUS, ELEMENTAL_EXPLOSION_SPLASH_PCT,
  FIRE_BOMB_CD, FIRE_BOMB_RADIUS, ICE_ARMOR_CD, ICE_ARMOR_DUR,
  PYRO_TORRENT_CD, PYRO_TORRENT_RANGE, PYRO_TORRENT_HALF_ANGLE,
  BLIZZARD_CD, BLIZZARD_RADIUS, BLIZZARD_FREEZE_DUR, BURN_DPS_PCT,
  // v78 batch: exposed for regression testing of the Necromancer tree
  // (Mystic's 3rd & final tree -- Fear's flee AI override, Raise Dead's
  // skeleton minions, Soul Sap's main-attack override + soul resource,
  // Sacrifice's soul-cost gate, Demon Bind's threshold-summon + lifesteal,
  // Plague's soul-consumption duration scaling, and the new
  // node.prereqMode:'or' OR-gating mechanism).
  NECROMANCER_NODE_IDS, prereqSatisfied, prereqReqText,
  fearCooldown, fearDuration, FEAR_CD_BASE, FEAR_CD_MIN, FEAR_RADIUS,
  snapTrapPos, trapSpotOpen, followerRespawnTime, initWraith, dungeonRespawn,
  NECRO_SKELETON_BASE_DMG, NECRO_SKELETON_HP_MULT, SOUL_CAP, SOUL_SAP_SOULS_PER_KILL, SOUL_ORB_SPEED, NECRO_SKELETON_RESPAWN_TIME, FOLLOWER_RESPAWN_TIME,
  NECRO_SACRIFICE_SOUL_COST, SACRIFICE_CD, SACRIFICE_RADIUS, SACRIFICE_BASE_DMG,
  DEMON_BIND_SOUL_THRESHOLD, NECRO_DEMON_BASE_DMG, NECRO_DEMON_HP_MULT,
  necroDemonLeechPct, checkDemonBindThreshold,
  PLAGUE_CD, PLAGUE_RADIUS, PLAGUE_TICK_INTERVAL, PLAGUE_DUR_BASE, PLAGUE_DUR_PER_SOUL,
  plagueDuration, ensureFollowers, followerDmg, followerMaxHp, makeFollower, squireFollowerCount,
  // v79 batch: exposed for regression testing of the Survivalist tree
  // (Ranger's renamed/reworked Assassin tree -- Field Dress moved+reworked,
  // Poison Trap/Frost Trap's thrown-delayed-detonation mechanic, Evasion's
  // retuned numbers, Finesse's Dodge-charge system, Vanish's retuned
  // numbers + damage-ends-effect) and the Marksman tweaks (Rapid Shot's
  // same-target armor-pen rework, the new Rain of Arrows capstone).
  RANGER_SKILL_TREES, SURVIVALIST_NODE_IDS, MARKSMAN_NODE_IDS,
  survFieldDressRegenRate, survFieldDressCooldown, SURV_FIELD_DRESS_CD_BASE, SURV_FIELD_DRESS_CD_MIN,
  poisonTrapCooldown, POISON_TRAP_CD, POISON_TRAP_CLOUD_DUR, POISON_TRAP_TICK_INTERVAL,
  frostTrapFreezeDuration, FROST_TRAP_CD, FROST_TRAP_FREEZE_BASE, FROST_TRAP_FREEZE_STEP,
  SURV_TRAP_FUSE, SURV_TRAP_RADIUS,
  EVASION_SKILL_PCT, evasionSkillChance, EVASION_CAP,
  DODGE_CD_BASE, finesseDodgeCooldown, dodgeMaxCharges, FINESSE_DODGE_CD_STEP, FINESSE_DODGE_CD_MIN,
  VANISH_CD, VANISH_BASE_DUR, VANISH_RANK_STEP,
  RAPID_SHOT_ARMORPEN_PER_RANK, RAIN_OF_ARROWS_CD, RAIN_OF_ARROWS_RADIUS, RAIN_OF_ARROWS_BASE_DMG, RAIN_OF_ARROWS_DELAY,
  // v80 batch: exposed for regression testing of the Hunter tree rework
  // (new layout/Recall node, Summon Wolf active conversion, Summon Bear
  // staying passive, old Hunter Field Dress retirement).
  HUNTER_NODE_IDS, HUNTER_WOLF_SUMMON_CD, RECALL_CD, RECALL_BUFF_DUR,
  RECALL_DMG_BONUS_BASE, RECALL_DMG_BONUS_STEP, RECALL_REGEN_PCT_BASE, RECALL_REGEN_PCT_STEP,
  recallDmgBonus, recallRegenPct, recallDmgMult, weaponDmgMult,
  // v81 batch: exposed for regression testing of the Menu rework (Settings
  // / Support / Log Out / Exit Game top level + Achievements kept), the
  // new Support submenu's Cat Companion (auto-loot follower) and Expanded
  // Stash (4-tab chest) toggles, and the Exit Game native/web handling.
  getSettings: ()=>settings, MOOD_DBG, MOOD_PROFILES, beltCapacity, isGlobeBoss, bossGlobeTick, saveSettings, openSupport, closeSupport,
  openStash, closeStash, renderStashTabs, getStash: ()=>stash, saveStash,
  getStashActiveTab: ()=>stashActiveTab,
  setStashActiveTab: (i)=>{ stashActiveTab=i; syncStashItemsView(); },
  syncStashItemsView, STASH_TAB_COUNT,
  isNativeApp, exitGameClient, CAT_LOOT_SEEK_RANGE, CAT_R, drawCatIso,
  // v82 batch: exposed for regression testing of the level-based item
  // generation overhaul (equipment batch 1/3) -- new item-level jitter/
  // tier-assignment/modifier-value formula, the rare-item tier-dependent
  // stat-count caps, the tier3Only affix gate, and the Range/Reach affix
  // removal (see the big v82 comment block above LEATHER_EVASION_BASE).
  rollItemLevel, itemTierForItemLevel, itemTierLevelReq, rollAffixModifierValue,
  ITEM_TIER_LEVEL_BRACKETS, ITEM_TIER_MULT, ITEM_TIER_BASE_RANGE,
  RARE_STAT_CAP_BY_TIER, affixEligibleForTier, pickRarity, RARITY,
  // v83 batch: exposed for regression testing of the full prefix/suffix
  // affix pool + item-naming system + "+N to skills" effective-rank
  // mechanism (equipment batch 2/3) -- see the big v83 comment blocks
  // above treesForClass (effectiveRank/NODE_ID_TO_TREE/SKILL_TREE_CLASS_
  // GROUP) and above the old AFFIX_POOL's former location (EQUIP_AFFIXES/
  // itemDisplayName/rollExtraAffixes/affixEligibleForItem).
  EQUIP_AFFIXES, itemDisplayName, pickNamingAffixes, rollExtraAffixes,
  affixEligibleForItem, effectiveRank, NODE_ID_TO_TREE, SKILL_TREE_CLASS_GROUP,
  applyCdr, aoeRadiusMult, projectileSpeedMult,
  // v84 batch: exposed for regression testing of the final equipment
  // base-type tier-name overhaul (equipment batch 3/3) -- the new
  // Warrior/Ranger/Mystic weight-class armor name tables (now also
  // covering Gloves/Boots), the new tier-only weapon/belt name tables
  // (Shield/1H-Sword/Staff/Belt), and itemBaseName's updated lookup.
  ARMOR_TIER_NAME, ARMOR_BASE_NAMES, BOW_TIER_NAME, WEAPON2H_TIER_NAME, WEAPON1H_TIER_NAME,
  SHIELD_TIER_NAME, STAFF_TIER_NAME, BELT_TIER_NAME, MATERIAL_BASE_NAME,
  itemBaseName,
  // v85 batch: exposed for regression testing of the UI overhaul batch 1
  // (fullscreen Skill Tree/Inventory/Stash/Vendor panels, the vendor
  // layout tightening, the top-right map-icon/Region-Map/World-Map-
  // placeholder HUD replacement, and the XP-bar relocation).
  openRegionMap, closeRegionMap, renderRegionMap, zoneDisplayName,
  ZONE_LANDMARKS, statSummaryHtml,
  // v86 batch: exposed for regression testing of the UI/UX overhaul batch 2
  // (dismissable completed quests, followers accompanying the player in
  // Town, the "I cannot do that here" non-combat skill-button gate, the
  // interact-bar -> small-circular-button-above-Dodge swap, the Hunter
  // vendor, the quest-giver "!" gating, and the behind-wall fade effect).
  updateFollowersAI, ensureFollowers, combatActionsBlocked, triggerSkillSlot,
  questGiverHasIndicator, drawQuestNpcIso, snowWallOpen, fhDungeonUnlocked, redridgeWallOpen, collectGlows, startRuinsEvent, finishRuinsEvent, updateRuinsEvent, enterFloodedTemple, spawnSquid, enterFhDungeon, makeFhdFloor, takeRunestone2, hunterCurrent, hunterHasMark, startWitchQuest, ensureHeartstoneQuest, witchPartsHeld, huntBossKilled, dwConstructSlain, initDwConstruct, insertShrineRunestone, claimShrineBlessing, fhCommanderSlain, openCmdChest, makeAwakenedRuneItem, updateFhCommander, npcMark, npcHasMark, spawnDefiler, defilerSlain, talkGraverobbers, talkScholar, inspectSarcophagus, makeTemplarInscriptionItem, drawQuestMarkIso, WM_NODES, WM_EDGES, wmCurrent, renderWorldMap,
  genHunterShopStock, openShop, closeShop, makeTown,
  openHunterDialogue, closeHunterDialogue,
  INTERACT_ICONS, INTERACT_LABELS, updateInteractPrompt,
  renderQuestLog, QUEST_FIND_HUNTERS,
  HUNTER_ARMOR_CATEGORIES, addToBag, findBagSpot, itemShape, genBardShopStock, genGamblerStock, genShopStock, refreshBarStock, usePotion, makePotionItem, tickBuffs,
  // v87 batch: exposed for regression testing of the sunGate relocation
  // (Forest's north edge -> south edge, to connect to Withered Crossroads'
  // unchanged north-edge forestGate) and the 3 new findable-from-a-
  // distance landmark totems (drawSpiderTotemIso/drawBearTotemIso/
  // drawSunTotemIso) added at each Forest gate.
  drawSpiderTotemIso, drawBearTotemIso, drawSunTotemIso,
  drawWebCaveIso, drawDenCaveIso,
  // v88 batch: exposed for regression testing of the dynamic per-zone
  // monster-level scaling (v90: renamed effectiveDepth->zoneMonsterLevel/
  // ZONE_DEPTH_LEVEL_K->MONSTER_LEVEL_STEP_K, identical formula/output --
  // see the v90 comment block above zoneMonsterLevel's definition),
  // applied to Dark Forest/Withered Crossroads/Mountain Pass/Lakeside Ruins/
  // Cursed Cemetery/Spider Lair/Bear Cave/Dark Crypt -- Abandoned Mine and
  // Lighthouse Tower are untouched) and the item modifier-value formula
  // rework (baseStatAtLevel/ITEM_TIER_ROLL_RANGE, plugged into the
  // existing rollAffixModifierValue signature).
  zoneMonsterLevel, MONSTER_LEVEL_STEP_K,
  // v90: kept as aliases pointing at the same function/constant, purely so
  // any external test script still written against the old v88 names
  // keeps working unmodified -- zero behavioral difference either way.
  effectiveDepth: zoneMonsterLevel, ZONE_DEPTH_LEVEL_K: MONSTER_LEVEL_STEP_K,
  baseStatAtLevel, ITEM_TIER_ROLL_RANGE,
  ITEM_BASE_STAT_A, ITEM_BASE_STAT_B,
  // Sept 2026 patch: exposed for regression testing of the Town Guard
  // NPCs (stationary Bandit-Archer-skinned defenders flanking the Forest's
  // townGate), the Dark Forest/Withered Crossroads Region Map schematics, and
  // the doubled Hunter Wolf/Bear/Templar Squire base HP.
  makeTownGuards, updateTownGuards, GUARD_ATTACK_RANGE, GUARD_ATK_CD_MAX,
  GUARD_DMG, GUARD_ARROW_SPEED, GUARD_FLANK_OFFSET,
  plotRegionMapPoints, HUNTER_COMPANION_HP_BASE_MULT,
  getProjectiles: ()=>game.projectiles, shieldStunChance, snapshotSkillCds,
  hasLOS, wmLabelRects, cleaveMult, skillMult, enterForgottenTower, witchCauldronInteract, witchTowerInteract, hunterScaleStage, openHunterDialogue, makeForgottenTowerFloor, makeAncientRuinsFloor, enterAncientRuins, enterLakesideRuins, enterDarkCrypt, makeRuinsMapItem, makeTemplarRunestoneItem, logOutToTitle, stepSim:(dt)=>{ tickBuffs(dt); update(dt); }, ensureFollowers, ACTIVE_SKILL_REGISTRY, canRankUp, rankUpNode, dropLoot, pickRarity, elementResist, gainXp, aoeRadiusMult, applyCdr, nodeEffectText, treesForClass, forceAddToBag, talkToQuestGiver, studyLakesideRuins, canStudyRuins, getQuest, startHiddenSecretsQuest, hasRuinsMap, getWorld: ()=>game,
  // v94 batch: exposed for regression testing of the Tavern quest feature
  // (the doubled Tavern building + Barkeeper NPC/sign in Town, the Light
  // the Way quest, the Tavern interior zone, and the Lighthouse Tower
  // floor-5 rework -- waypoint removal, the post-clear portal, and the
  // beacon's on/off state).
  QUEST_LIGHT_THE_WAY, talkToBarkeeper, checkLightTheWayQuest,
  makeTavernInterior, enterTavern, tavernGoUpstairs, tavernGoDownstairs,
  goToTownFromTavern, turnOnBeacon, TAVERN_X, TAVERN_Y, TAVERN_W, TAVERN_H,
  barkeeperHasIndicator, tavernSignLines,
  makePotionItem, ensurePotionEq, usePotionSlot, socketPotion, unsocketPotions, talkToBarkeeper, checkLightTheWayQuest, characterLabel, turnOnBeacon,
  // Version 102: exposed for regression testing of the top-left HUD level
  // readout (#hudLevel) and the Inventory screen's class/main-talent-tree
  // header (mainTreeName).
  mainTreeName, openInventory, closeInventory, renderInventory,
  // v233: River Valley + Minotaur Cave
  enterRiverValley, enterMinotaurCave, makeRiverValley, rvWaterAt, rvRiverY, rvRiverHW, rvRoadX, RV_BX, RV_CAMP_TOTAL, QUEST_BRIDGE, bridgeCampKilled, openMinotaurChest,
};
