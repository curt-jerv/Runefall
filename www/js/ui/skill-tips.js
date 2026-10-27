// v561: one tooltip layout for every skill.
//   desc  - a short, thematic line (shown under the skill name)
//   fx    - what the skill does, in a sentence or two (no numbers that change with rank)
//   per   - what one "Damage" line is counted per (the % comes from SKILL_WD); x = label of a second damage part
//   stats - [label, r=>value] lines that may change with rank: not learned shows Rank 1 -> Rank 10,
//           learned shows the current value and "(next rank: ...)" when the next rank changes it
//   cd    - r=>seconds; cost - r=>text (default: the skill's Rage/Stamina/Mana cost from RESOURCE_SKILLS)
const tipP = ()=> (typeof game!=='undefined' && game && game.player) || null;
const tipPct = v=> fmtNum(Math.round(v*1000)/10)+'%';
const tipS = v=> fmtNum(Math.round(v*100)/100)+'s';
const tipPet = (id, kind, what)=> r=>{ const p = tipP(); if(!p || !p.skills) return '';
  return withRank(p, id, r, ()=>{ const f = {kind}; return what==='hp' ? '≈'+Math.round(followerMaxHp(p, f)) : '≈'+Math.round(followerDmg(p, f))+' per hit'; }); };
const tipFree = 'None';
const tipShot = ()=>'None (refills '+STAMINA_ON_SHOT+' Stamina)';

const SKILL_TIPS = {
  // ===================== WARRIOR: Defender =====================
  ironSkin:{ desc:'Your skin hardens like stone, turning aside blows that would fell lesser warriors.',
    fx:'Standing still also hardens you: +'+Math.round(IRON_STILL_PER_S*100)+'% Defence for every second you stand your ground, up to +'+Math.round(IRON_STILL_PER_S*IRON_STILL_MAX*100)+'%. Rank 5 also gives +4% max life and +1% max resistance.',
    stats:[['Defence', r=>'+'+tipPct(IRON_SKIN_DEFENSE_PCT_BY_RANK[Math.min(r,BASE_MAX_RANK)])], ['Damage reduction', r=>tipPct(IRON_SKIN_DR_BY_RANK[Math.min(r,BASE_MAX_RANK)])],
      ['Block chance (shield)', r=>'+'+tipPct(IRON_SKIN_BLOCK_PER_RANK*r)], ['All resistances', r=>'+'+fmtNum(r<=BASE_MAX_RANK ? IRON_SKIN_RESIST_BY_RANK[r] : IRON_SKIN_RESIST_BY_RANK[BASE_MAX_RANK]+1.5*(r-BASE_MAX_RANK))+'%']] },
  unbreakable:{ desc:'Pain feeds you, and when you are nearly dead you simply refuse to fall.',
    fx:'Taking hits builds extra Rage. Below '+Math.round(UNBREAK_LOW_HP*100)+'% life you take less damage, and a killing blow leaves you at 20% life instead.',
    stats:[['Rage from hits taken', r=>'+'+Math.round(UNBREAK_HURT_RAGE*r*100)+'%'], ['Damage taken below '+Math.round(UNBREAK_LOW_HP*100)+'% life', r=>'-'+tipPct(UNBREAK_LOW_DR+UNBREAK_LOW_DR_STEP*(r-1))],
      ['Survive a killing blow', r=>'once every '+tipS(Math.max(5, UNBREAK_SAVE_CD-UNBREAK_SAVE_STEP*(r-1)))]] },
  shieldBash:{ desc:'Slam your shield into the foes in front of you.', fx:'A shield blow in a cone in front of you that may stun. It costs nothing and builds Rage for every foe it hits (up to '+SLAM_RAGE_TARGETS+').', per:'per enemy hit',
    stats:[['Rage per foe hit', r=>'+'+fmtNum(SLAM_RAGE_PER_TARGET+SLAM_RAGE_STEP*(r-1))], ['Stun', r=>Math.round(slamStunChance(r)*100)+'% chance, '+tipS(shieldBashStunDuration(r))]], cost:()=>tipFree },
  riposte:{ desc:'Turn near-misses into solid blocks and answer every one with steel.', fx:'Raises your Block Chance (cap '+Math.round(BLOCK_CHANCE_CAP*100)+'%). Every block (or parry, with a two-hander or twin swords) gives Rage and strikes back at the attacker.', per:'per counter-strike',
    stats:[['Block chance', r=>Math.round(Math.min(BLOCK_CHANCE_CAP, BLOCK_CHANCE_BASE+RIPOSTE_BLOCK_PER_RANK*r)*100)+'%'], ['Rage per block', ()=>RIPOSTE_RAGE_BASE+' to '+(RIPOSTE_RAGE_BASE+RIPOSTE_RAGE_MAX_BONUS)+' (bigger hits give more)']] },
  shieldThrow:{ desc:'Hurl your shield through the enemy ranks and let it fly back to your hand.', fx:'Your shield flies out, bounces between enemies and returns to you. Each hit may stun.', per:'per hit',
    stats:[['Bounces', r=>String(shieldThrowMaxChains(r))], ['Stun', r=>Math.round(shieldStunChance(r)*100)+'% chance, '+tipS(1+0.25*(r-1))]], cd:r=>effectiveShieldThrowCooldown(r) },
  seismicSlam:{ desc:'Slam the earth with your shield and stagger everything around you.', fx:'Needs a shield. Hits every enemy around you and stuns them; elites and bosses are slowed instead.', per:'per enemy',
    stats:[['Stun', r=>tipS(seismicStunDur(r))], ['Radius', ()=>String(SEISMIC_R)]], cd:()=>SEISMIC_CD },
  mirrorSteel:{ desc:'Raise your shield and turn every blow back on its source.', fx:'Needs a shield. Every hit you take, melee or ranged, is reflected back for its full damage, and you heal for '+Math.round(MIRROR_HEAL*100)+'% of what you reflect.',
    stats:[['Duration', r=>tipS(mirrorDur(r))]], cd:r=>mirrorCd(r) },
  bulwark:{ desc:'Plant your feet, soak up the blows, then release them in one thundering shockwave.', fx:'Your armor rises and you slow down. Damage you take is stored and released as a knockback shockwave when it ends (tap again to release early).',
    stats:[['Duration', r=>tipS(BULWARK_DUR+BULWARK_DUR_STEP*(r-1))], ['Armor', ()=>'+'+Math.round((BULWARK_ARMOR-1)*100)+'%'], ['Speed', ()=>'-'+Math.round(BULWARK_SLOW*100)+'%'], ['Shockwave', ()=>Math.round(BULWARK_REL*100)+'% of the damage stored']], cd:()=>BULWARK_CD },
  seismicAnchor:{ desc:'Tear the ground open and drag your foes into the rift.', fx:'Needs a shield. After '+ANCHOR_DELAY+'s, enemies within 6 metres are pulled to you, their casting is broken and they are slowed (fading over '+ANCHOR_SLOW_DUR+'s).',
    stats:[['Slow', ()=>Math.round(ANCHOR_SLOW*100)+'%']], cd:r=>anchorCd(r) },
  guardian:{ desc:'Roar, fill your Rage and charge unstoppable until the Rage runs dry.', fx:'Fills your Rage, then you charge nonstop (you steer, but cannot attack or use skills) until it runs out, trampling and knocking back everything in your way. When the Rage is gone you erupt in a final burst.', per:'per trample hit', x:'final burst',
    stats:[['Rage lost per second', r=>fmtNum(juggDrain(r))], ['Defence while charging', r=>'+'+Math.round(juggDef(r)*100)+'%']], cd:()=>GUARDIAN_CD, cost:()=>tipFree },
  // ===================== WARRIOR: Berserker =====================
  reave:{ desc:'A vicious, tearing blow that leaves the wound bleeding.', fx:'A single blow that makes the target bleed for '+REAVE_BLEED_DUR+'s. No cooldown; builds Rage.', per:'per hit',
    stats:[['Bleed (of the hit)', r=>Math.round(reaveBleedPct(r)*REAVE_BLEED_DUR*100)+'%']], cost:()=>tipFree },
  leap:{ desc:'Charge across the battlefield and crash into your foes.', fx:'Charge up to '+LEAP_RANGE+' at the nearest enemy, untouchable on the way, then crush the ground and stun everything around you. Gives '+Math.round(LEAP_RAGE_GAIN_PCT*100)+'% of your max Rage.', per:'on landing',
    stats:[['Stun', r=>tipS(LEAP_STUN_BASE+LEAP_STUN_STEP*(r-1))]], cd:r=>leapCdForRank(r), cost:()=>tipFree },
  rampage:{ desc:'Every kill feeds the slaughter.', fx:'Each kill adds a stack of attack speed (up to '+RAMPAGE_MAX+', lost after '+RAMPAGE_WINDOW+'s without a kill). You also hit harder the more Rage you carry.',
    stats:[['Attack speed per stack', r=>'+'+fmtNum(Math.round(rampageSpeedPerStack(r)*1000)/10)+'%'], ['Damage at full Rage', r=>'+'+Math.round(rampagePerStack(r)*100)+'%']] },
  weaponsSpecialist:{ desc:'Master heavier blades, learning to wield greatswords and twin swords alike.', fx:'Lets you wield the Longsword line (Longsword, Greatsword, Demonblade; two-handers already hit +'+Math.round((TWOHAND_BASE_DMG_MULT-1)*100)+'% harder) and two swords at once. With either, half your Block Chance becomes a chance to parry.',
    stats:[['Two-hander damage', r=>'+'+Math.round(GREATSWORD_DMG_PER_RANK*r*100)+'%'], ['Two-hander armor pierce', r=>Math.round(Math.min(1,GREATSWORD_ARMORPEN_PER_RANK*r)*100)+'%'],
      ['Dual-wield attack speed', r=>'+'+Math.round(DUAL_WIELD_ATKSPD_PER_RANK*r*100)+'%'], ['Rage gained', r=>'+'+fmtNum(Math.round(wsRagePct(r)*1000)/10)+'%']] },
  bloodlust:{ desc:'Drink deep of every wound you deal.', fx:'You heal for part of the damage you deal. Below '+Math.round(BLOODLUST_BLOODIED_AT*100)+'% life you are Bloodied: x'+BLOODLUST_BLOODIED_LEECH_MULT+' leech and faster attacks. Out of combat, fading Rage turns into life, and enemies drop more health potions.',
    stats:[['Life leech', r=>(BLOODLUST_LEECH_BASE+BLOODLUST_LEECH_STEP*(r-1))+'%'], ['Bloodied attack speed', r=>'+'+fmtNum(Math.round((BLOODLUST_BLOODIED_AS_BASE+BLOODLUST_BLOODIED_AS_STEP*(r-1))*1000)/10)+'%'],
      ['Health potion drops', r=>'+'+Math.round(BLOOD_HARVEST_PER_RANK*r*100)+'%'], ['Fading Rage returned as life', r=>Math.round(bloodHarvestRecovery(r)*100)+'%']] },
  cleave:{ desc:'Sweep a heavy blade through the enemy ranks in one wide arc.', fx:'Needs a two-handed sword. Your Strike becomes Cleave, a slow, heavy sweep in front of you. With less than '+CLEAVE_RAGE_COST+' Rage you swing a plain Strike.', per:'per swing',
    stats:[['Armor pierce', r=>'+'+Math.round(CLEAVE_ARMORPEN_PER_RANK*r*100)+'%']], cost:()=>CLEAVE_RAGE_COST+' Rage per swing' },
  fury:{ desc:'Dance between twin blades in a relentless flurry of strikes.', fx:'Needs two one-handed swords. Your Strike becomes a '+FURY_HITS+'-hit combo. With less than '+FURY_RAGE_COST+' Rage you swing a plain Strike.', per:'per strike ('+FURY_HITS+' strikes)',
    stats:[['Attack speed', r=>'+'+Math.round(FURY_ATKSPD_PER_RANK*r*100)+'%']], cost:()=>FURY_RAGE_COST+' Rage per combo' },
  whirlwind:{ desc:'Become a whirling storm of steel.', fx:'Spin and hit every enemy around you every '+WHIRLWIND_TICK_INTERVAL+'s until your Rage runs out or you tap again. The Rage drain grows by '+WHIRLWIND_DRAIN_RAMP+'/s every second. Attack Speed spins you faster. You cannot attack, use skills or gain Rage while spinning; Dodge stops it.', per:'per hit',
    stats:[['Starting Rage drain', r=>fmtNum(Math.max(5, Math.round((WHIRLWIND_RAGE_DRAIN-WHIRLWIND_DRAIN_STEP*(r-1))*10)/10))+'/s'], ['Movement while spinning', r=>'-'+(r>=10?5:10)+'%']], cd:()=>WHIRLWIND_CD, cost:r=>resCost(tipP(),'whirlwind',r)+' Rage to start' },
  assault:{ desc:'Fly into a berserker rage and end it in a burst of spent fury.', fx:'Fills your Rage, then for a while your damage ramps up to +'+Math.round(ASSAULT_DEALT_MAX*100)+'% (and the damage you take up to +'+Math.round(ASSAULT_TAKEN_MAX*100)+'%), with life leech. Each kill extends it and takes '+ASSAULT_KILL_CDR+'s off its cooldown. When it ends, your remaining Rage explodes.', per:'per 20 Rage spent in the final burst',
    stats:[['Duration', r=>tipS(ASSAULT_BASE_DUR+ASSAULT_RANK_STEP*(r-1))], ['Extra time per kill', r=>tipS(assaultKillExtend(r))]], cd:()=>ASSAULT_CD, cost:()=>tipFree },
  // ===================== WARRIOR: Templar =====================
  vengeance:{ desc:'Strike with holy fire and drive your followers into a righteous frenzy.', fx:'A cone of holy fire in front of you that also makes your followers hit harder for '+VENG_BUFF_DUR+'s. No cooldown; builds '+VENG_CONV+' Conviction per foe. Over '+Math.round(VENG_OVERFLOW_AT*100)+'% Conviction it spends '+VENG_OVERFLOW_COST+' for +'+Math.round(VENG_OVERFLOW_DMG*100)+'% damage.', per:'per hit',
    stats:[['Followers', r=>'+'+Math.round((VENG_FDMG+VENG_FDMG_STEP*(r-1))*100)+'% damage, +'+(VENG_FCRIT+VENG_FCRIT_STEP*(r-1))+'% crit']], cost:()=>tipFree },
  sacredWeapon:{ desc:'Your blade is consecrated: every fourth Vengeance erupts in holy flame.', fx:'After '+SACRED_EVERY+' Vengeance attacks, the next one spends '+SACRED_COST+' Conviction to hit harder and set everything it hits burning ('+Math.round(SACRED_BURN_PCT*SACRED_BURN_DUR*100)+'% of the hit over '+SACRED_BURN_DUR+'s).',
    stats:[['Empowered damage', r=>'+'+Math.round(sacredBonus(r)*100)+'%']] },
  auraOfRetribution:{ desc:'Those who strike you are struck in turn by your faith.', fx:'Enemies that hit you take back part of the damage they dealt.',
    stats:[['Damage returned', r=>Math.round(retributionPct(r)*100)+'%']] },
  smite:{ desc:'Hurl a bolt of holy light that strikes the first foe and mends your allies.', fx:'The bolt flies up to '+SMITE_RANGE+', hits the first foe and heals followers it passes. Every '+WRATH_EVERY+'rd cast is Wrath: a wider bolt for x'+WRATH_MULT+' damage that bursts on impact. Builds '+SMITE_CONV+' Conviction ('+WRATH_CONV+' for Wrath).', per:'per bolt',
    stats:[['Follower heal', r=>Math.round(SMITE_HEAL*(1+0.1*(r-1))*100)+'% (Wrath '+Math.round(WRATH_HEAL*(1+0.1*(r-1))*100)+'%)']], cost:()=>tipFree },
  squire:{ desc:'Call squires to fight at your side. Most of your damage comes from them.', fx:'Squires fight beside you (a 2nd from Rank 3, a 3rd from Rank 5) and come back after falling. Your followers hit x'+TEMPLAR_FOLLOWER_BASE+' harder than other classes\' followers.',
    stats:[['Squires', r=>String(squireFollowerCount(r))], ['Squire damage', tipPet('squire','knight','dmg')], ['Squire life', tipPet('squire','knight','hp')], ['Back after falling', r=>tipS(followerRespawnTime(tipP()||{},'knight',r))]] },
  consecrate:{ desc:'Sanctify the ground beneath you, burning foes and empowering your followers.', fx:'Holy ground burns enemies in it. While you stand in it you regenerate and gain Conviction, and followers in it hit harder.', per:'per tick',
    stats:[['Duration', r=>tipS(CONS_DUR+0.5*(r-1))], ['Follower damage', r=>'+'+Math.round((0.2+0.04*(r-1))*100)+'%']], cd:()=>CONS_CD, cost:()=>CONS_COST+' Conviction' },
  banner:{ desc:'Plant a battle standard that rallies you and your followers.', fx:'Plant a standard; you and your followers inside it get its bonus. Casts alternate between War (red: damage, crit) and Aegis (blue: Defence, less damage taken, life regeneration). Gives '+BANNER_CONV+' Conviction.',
    stats:[['Duration', r=>bannerDur(r)+'s'], ['War', r=>{ const bp = {skills:Object.assign({}, ((tipP()||{}).skills)||{}, {banner:r})}; return '+'+Math.round(bannerWarDmg(bp)*100)+'% damage, +'+bannerWarCrit(bp)+'% crit'; }],
      ['Aegis', r=>{ const bp = {skills:Object.assign({}, ((tipP()||{}).skills)||{}, {banner:r})}; return '+'+bannerAegisDef(bp)+'% Defence, -'+Math.round(bannerAegisDr(bp)*100)+'% damage taken, +'+(bannerAegisRegen(bp)*100).toFixed(1)+'% life/s'; }]], cd:()=>BANNER_CD, cost:()=>tipFree },
  bannerWar:{ desc:'War standards rouse you and your followers to greater damage.', fx:'Strengthens the War half of your Battle Standard.',
    stats:[['War standard', r=>'+'+Math.round(bannerWarDmg({skills:{bannerWar:r}})*100)+'% damage, +'+bannerWarCrit({skills:{bannerWar:r}})+'% crit, +'+Math.round(bannerWarRage({skills:{bannerWar:r}})*100)+'% Conviction gained']] },
  bannerAegis:{ desc:'Aegis standards shield and mend you and your followers.', fx:'Strengthens the Aegis half of your Battle Standard.',
    stats:[['Aegis standard', r=>'-'+Math.round(bannerAegisDr({skills:{bannerAegis:r}})*100)+'% damage taken, +'+(bannerAegisRegen({skills:{bannerAegis:r}})*100).toFixed(1)+'% life/s']] },
  judgment:{ desc:'Call down pillars of holy fire upon your foes.', fx:'Marks enemies; after a short warning, a pillar of holy fire crashes down on each, stunning them and blinding survivors for '+JUDG_BLIND_DUR+'s (half their attacks miss).', per:'per pillar',
    stats:[['Pillars', r=>String(3+Math.ceil(r/2))]], cd:()=>JUDG_CD, cost:()=>JUDG_COST+' Conviction' },
  // ===================== RANGER: Survivalist =====================
  poisonTrap:{ desc:'Lay a venomous trap that blankets the area in toxic fumes.', fx:'Throw a trap that bursts into a poison cloud after '+SURV_TRAP_FUSE+'s. The poison grows up to +150% stronger the longer a foe stays inside.', per:'per second in the cloud',
    stats:[['Radius', ()=>String(SURV_TRAP_RADIUS)]], cd:r=>poisonTrapCooldown(r) },
  survivalFieldDress:{ desc:'Bind your wounds on the move, and patch up your companions too.', fx:'Bandage yourself over '+SURV_FIELD_DRESS_DUR+'s while you keep moving and fighting, cleansing slows and ailments; companions heal half as much. Every dodge also heals you a little over '+SFD_DODGE_DUR+'s.',
    stats:[['Bandage heals (of max life)', r=>Math.round(survFieldDressRegenRate(r)*100*SURV_FIELD_DRESS_DUR)+'%'], ['Each dodge heals (of max life)', r=>fmtNum(Math.round(sfdDodgePct(r)*1000)/10)+'%']], cd:r=>survFieldDressCooldown(r) },
  evasion:{ desc:'Move like smoke, slipping past blows meant to end you.', fx:'A chance to fully dodge a hit (stacks with the dodge from Dexterity, cap '+Math.round(EVASION_CAP*100)+'%). Every dodge also restores Stamina.',
    stats:[['Dodge chance', r=>'+'+Math.round((EVASION_SKILL_PCT[Math.min(r,10)-1]+Math.max(0,r-10)*0.01)*100)+'%'], ['Stamina per dodge', r=>String(evasionDodgeStamina({skills:{evasion:r}}))]] },
  frostTrap:{ desc:'Set a trap of biting frost to lock your enemies in place.', fx:'Lay up to 3 traps. When an enemy steps near one it freezes everything around it, then chills them. Elites and brutes freeze for less; bosses are only chilled.', per:'burst',
    stats:[['Freeze', r=>tipS(frostTrapFreezeDuration(r))], ['Chill after', r=>tipS(frostTrapChillDuration(r))], ['Radius', ()=>String(SURV_TRAP_RADIUS)]], cd:()=>FROST_TRAP_CD },
  survivalInstinct:{ desc:'Years in the wild have toughened your body and sharpened your killing instinct.', fx:'More life and speed, and more damage against enemies suffering an ailment (bleeding, poisoned, burning, chilled, frozen, charged or stunned).',
    stats:[['Max life', r=>'+'+Math.round(INSTINCT_HP_PER_RANK*r*100)+'%'], ['Movement speed', r=>'+'+Math.round(INSTINCT_SPEED_PER_RANK*r*100)+'%'], ['Damage vs ailing enemies', r=>'+'+Math.round(predInstinctPct(r)*100)+'%']] },
  finesse:{ desc:'Refine your reflexes until dodging becomes second nature.', fx:'You get a second Dodge charge, and Dodge recharges faster (normally '+tipS(DODGE_CD_BASE)+').',
    stats:[['Dodge cooldown', r=>tipS(finesseDodgeCooldown({skills:{finesse:r}}))]] },
  opportunist:{ desc:'Every dodge opens a window to punish the enemy that missed you.', fx:'After you dodge, you deal more damage for '+OPPORTUNIST_DUR+'s.',
    stats:[['Damage after a dodge', r=>'+'+Math.round(OPPORTUNIST_PER_RANK*r*100)+'%']] },
  trapMastery:{ desc:'Your traps hit harder, reach farther, and you throw them faster.', fx:'Poison and Explosive Traps hit harder, every trap covers more ground, and you throw traps faster.',
    stats:[['Trap damage', r=>'+'+Math.round(TRAP_MASTERY_DMG*r*100)+'%'], ['Trap radius', r=>'+'+Math.round(TRAP_MASTERY_RADIUS*r*100)+'%'], ['Time between throws', r=>tipS(Math.round(TRAP_GCD*(1-TRAP_MASTERY_THROW*Math.min(10,r))*100)/100)]] },
  explosiveTrap:{ desc:'Bury a charge that bursts into flame when enemies step close.', fx:'Throw a trap that arms after a moment and explodes when enemies come near, setting them burning.', per:'explosion',
    cd:()=>6 },
  mirage:{ desc:'Every dodge leaves a mirage behind to draw the enemy away.', fx:'When you dodge, a mirage of you stays where you started. Nearby enemies (not bosses) attack it instead of you until it fades.',
    stats:[['Mirage lasts', r=>tipS(Math.round(mirageDur(r)*10)/10)], ['Once every', r=>tipS(Math.round(mirageCd(r)*10)/10)]] },
  // ===================== RANGER: Marksman =====================
  bowExpert:{ desc:'Master the bow until every arrow flies true.', fx:'Your bow hits harder.',
    stats:[['Bow damage', r=>'+'+Math.round(tblAt(BOW_EXPERT_DMG_PCT, r))+'%']] },
  rapidShot:{ desc:'Loose a rapid volley before the enemy can react.', fx:'Fire 3 arrows in quick succession. If all 3 hit the same enemy, the last one pierces armor.', per:'per arrow',
    stats:[['Last-arrow armor pierce', r=>Math.round(RAPID_SHOT_ARMORPEN_PER_RANK*r*100)+'%']], cost:tipShot },
  multiShot:{ desc:'Split your aim and loose a fan of arrows in a single motion.', fx:'Loose a fan of '+multiShotCount(1)+' arrows at once ('+multiShotCount(5)+' from Rank 5).', per:'per arrow',
    stats:[['Arrows', r=>String(multiShotCount(r))]], cost:tipShot },
  splinterShot:{ desc:'An arrow that bursts on impact, its splinters seeking out the foes nearby.', fx:'An arrow that splits on impact into '+SPLINTER_SPLITS+' splinters, flying at other enemies nearby. May cause Bleed.', per:'per arrow',
    stats:[['Splinters', ()=>Math.round(splinterSplitPct((tipP())||{})*100)+'% of the hit each'], ['Bleed chance', ()=>Math.round(splinterBleedChance((tipP())||{})*100)+'%']], cost:tipShot },
  favouredFoe:{ desc:'Your eye finds the weak spot.', fx:'The last arrow of Rapid Shot may pierce through every enemy in its path, and you crit more often with a bow.',
    stats:[['Last Rapid Shot arrow pierces', r=>Math.round(favouredFoePierce(r)*100)+'% chance'], ['Crit chance (bow)', r=>'+'+Math.round(tblAt(ARROW_EYE_CRIT_PCT, r))+'%']] },
  steadyBreathing:{ desc:'Steady breathing keeps your strength up for the chase.', fx:'Your skills cost less Stamina and it comes back faster.',
    stats:[['Stamina costs', r=>'-'+(5*Math.min(10,r))+'%'], ['Stamina regeneration', r=>'+'+(3*r)+'%']] },
  splinteredWounds:{ desc:'Barbed splinters tear deeper and bleed the wounded.', fx:'Splinter Shot bleeds more often and its splinters hit harder.',
    stats:[['Splinter Shot bleed chance', r=>Math.round(Math.min(0.6, SPLINTER_BLEED+0.04*r)*100)+'%'], ['Splinters', r=>Math.round((SPLINTER_SPLIT_PCT+0.03*Math.min(10,r))*100)+'% of the hit']] },
  deadeye:{ desc:'Your criticals strike deeper, and distance is no shelter.', fx:'Critical hits hit harder and restore Stamina, and your arrows hit harder against targets more than '+LONGSHOT_DIST+' away.',
    stats:[['Crit damage', r=>'+'+Math.round(DEADEYE_CRITMULT_PER_RANK*r*100)+'%'], ['Stamina per crit', r=>r+'% of max'], ['Damage vs distant targets', r=>'+'+Math.round(LONGSHOT_PER_RANK*r*100)+'%']] },
  rainOfArrows:{ desc:'Call down a rain of arrows on the battlefield.', fx:'Loose an arrow into the sky; half a second later it shatters into 3 volleys of arrows over an area.', per:'per volley',
    stats:[['Radius', ()=>String(RAIN_OF_ARROWS_RADIUS)]], cd:()=>RAIN_OF_ARROWS_CD },
  aimedShot:{ desc:'Draw fully and loose a shot that punches through a line of enemies.', fx:'Hold to draw for '+fmtNum(AIMED_HOLD_MS/1000)+'s, then release a full-power shot with +'+AIMED_SHOT_CRIT_BONUS+'% crit chance that pierces enemies (each one weaker by '+Math.round((1-AIMED_SHOT_FALLOFF)*100)+'%). A quick tap fires a weaker snap shot ('+(SKILL_WD.aimedShot.tap||145)+'% weapon damage).', per:'full draw',
    stats:[['Pierces', r=>aimedShotPierce(r)+' enemies']], cd:r=>aimedShotCooldown(r) },
  // ===================== RANGER: Hunter =====================
  cripplingShot:{ desc:'Loose a barbed arrow that leaves a festering wound.', fx:'A heavy barbed arrow that leaves the target bleeding for '+CRIPPLING_SHOT_BLEED_DUR+'s.', per:'per arrow',
    stats:[['Bleed per second (of the hit)', r=>Math.round(cripplingShotBleedPct(r)*100)+'%']], cd:()=>CRIPPLING_SHOT_CD },
  companionWolf:{ desc:'A loyal wolf hunts at your side.', fx:'A wolf fights beside you (a second one joins at Rank 5); its slashes cut up to 3 enemies and cause Bleed, and it heals itself as it bites. It comes back after falling.',
    stats:[['Wolves', r=>String(r>=5?2:1)], ['Wolf damage', tipPet('companionWolf','wolf','dmg')], ['Wolf life', tipPet('companionWolf','wolf','hp')], ['Life leech', r=>Math.round(wolfLeechPct(r)*100)+'%'], ['Back after falling', r=>tipS(followerRespawnTime(tipP()||{},'wolf',r))]] },
  huntersBond:{ desc:'The bond with your companions makes them fiercer and sturdier.', fx:'Your wolves and bear hit harder and have more life.',
    stats:[['Companion damage', r=>'+'+Math.round(BOND_DMG_PER_RANK*r*100)+'%'], ['Companion life', r=>'+'+Math.round(BOND_HP_PER_RANK*r*100)+'%']] },
  stunShot:{ desc:'Fire a heavy arrow that rattles a foe senseless.', fx:'A heavy arrow that may stun.', per:'per arrow',
    stats:[['Stun', r=>Math.round(stunShotStunChance(r)*100)+'% chance, '+tipS(stunShotStunDuration(r))]], cd:()=>STUN_SHOT_CD },
  packTactics:{ desc:'Send your companions leaping onto your target for a savage ambush.', fx:'Your wolves and bear leap onto your target and land a bonus attack that also slashes the enemies around it.',
    stats:[['Landing hit', r=>'+'+Math.round((packTacticsDmgMult(r)-1)*100)+'% damage']], cd:r=>packTacticsCooldown(r) },
  beastFury:{ desc:'Drive your companions into a frenzy.', fx:'Your companions deal +50% damage and attack 25% faster, and you deal +15% damage. Your bear roars, forcing nearby enemies to attack it, and your wolves\' bleeds hit harder.',
    stats:[['Duration', r=>tipS(BEAST_FURY_DUR+r-1)], ['Bear taunt', r=>tipS(bearRoarDur(r))], ['Wolf bleed', r=>'+'+Math.round((0.5+0.05*(Math.min(10,r)-1))*100)+'%']], cd:()=>BEAST_FURY_CD },
  explosiveShot:{ desc:'A fire-tipped arrow that bursts into flame on impact.', fx:'An arrow that explodes on impact, burning everything in a small area.', per:'arrow hit', x:'fire blast',
    stats:[['Burn', r=>tipS(Math.round(expShotBurnDur(r)*100)/100)], ['Blast radius', ()=>String(EXPSHOT_R)]], cd:()=>EXPLOSIVE_SHOT_CD },
  huntersMark:{ desc:'Mark your prey for the pack.', fx:'Mark the nearest enemy. You and your companions deal more damage to it. One mark at a time.',
    stats:[['Duration', r=>tipS(HMARK_DUR+r-1)], ['Damage the target takes', r=>'+'+Math.round((HMARK_BONUS+HMARK_BONUS_STEP*(r-1))*100)+'%']], cd:()=>HMARK_CD },
  recall:{ desc:'Call your companions back to your side, emboldened for the fight ahead.', fx:'Your companions dash back to you behind a shield, and for '+RECALL_BUFF_DUR+'s you gain damage, life regeneration and a small shield.',
    stats:[['Companion shield (of their life)', r=>Math.round(recallShieldPct(r)*100)+'%'], ['Your damage', r=>'+'+Math.round(recallDmgBonus(r)*100)+'%'], ['Your life regeneration', r=>Math.round(recallRegenPct(r)*100)+'%/s'], ['Your shield (of your life)', r=>Math.round(recallPlayerShieldPct(r)*100)+'%']], cd:()=>RECALL_CD },
  companionBear:{ desc:'A great bear joins you, the hardest-hitting companion in the wild.', fx:'A bear fights beside you; its swipes cut up to 4 enemies at once.',
    stats:[['Bear damage', tipPet('companionBear','bear','dmg')], ['Bear life', tipPet('companionBear','bear','hp')]] },
  // ===================== MYSTIC: Djinn =====================
  lightningArc:{ desc:'Loose a crackling arc of lightning at your foes.', fx:'An instant bolt of lightning at your target.', per:'per hit' },
  staticBuildup:{ desc:'Every lightning hit builds static, waiting to be unleashed.', fx:'Lightning hits build Static (up to '+STATIC_MAX+' stacks); each stack makes Lightning Arc hit harder. A full bar empowers your next Lightning Arc, Nova, Tornado or Stormcall: it Charges and briefly stuns ('+STATIC_STUN_DUR+'s, not bosses) what it hits, an Arc chains further and the others grow 30% bigger.',
    stats:[['Lightning Arc per stack', r=>'+'+fmtNum(Math.round(staticArcPerStack(r)*1000)/10)+'%'], ['Empowered damage', r=>'x'+staticEmpowerMult(r).toFixed(2)], ['Empowered Arc chains', r=>'+'+staticArcChains(r)]] },
  lightningChain:{ desc:'Let your lightning leap from foe to foe.', fx:'Lightning Arc jumps to nearby enemies; each jump deals '+Math.round(LIGHTNING_CHAIN_DMG_MULT*100)+'% of the previous hit.',
    stats:[['Jumps', r=>String(lightningArcChains(r))]] },
  nova:{ desc:'Unleash a ring of lightning that charges everything it touches.', fx:'A ring of lightning bursts from you, Charging every enemy it touches and pushing ordinary enemies back.', per:'per enemy',
    stats:[['Radius', ()=>String(NOVA_RADIUS)]], cd:()=>NOVA_CD },
  thunderstep:{ desc:'Your dodge becomes a blink of lightning.', fx:'A burst of lightning goes off where your dodge starts and where it ends, and your mana flows faster for 3s after.', per:'per burst',
    stats:[['Mana regeneration after a dodge', r=>'+'+Math.round(thunderstepRegenBonus(r)*100)+'%']] },
  tornado:{ desc:'Hurl a huge, howling tornado that tears through every enemy in its path.', fx:'A big, slow tornado that passes through enemies, hitting each one inside it 3 times a second.', per:'per hit',
    cd:r=>tornadoCdForRank(r) },
  stormcall:{ desc:'Call a bolt of lightning down from the heavens.', fx:'Marks the thickest group of enemies; '+STORMCALL_DELAY+'s later lightning strikes the circle, Charging everything inside. A strike on an already Charged enemy leaps to more enemies nearby at half damage.', per:'per strike',
    stats:[['Leaps from Charged enemies', r=>String(2+(r>=5?1:0)+(r>=10?1:0))], ['Radius', ()=>String(STORMCALL_R)]], cd:()=>STORMCALL_CD },
  storm:{ desc:'A small storm gathers above you, sharpening your strikes.', fx:'A storm cloud hangs over you. Your critical hits lower the target\'s lightning resistance for '+STORM_SHRED_DUR+'s.',
    stats:[['Crit chance', r=>'+'+fmtNum(STORM_CRIT_PER_RANK*r)+'%'], ['Lightning resistance lowered', r=>Math.round(stormShredPct(r)*100)+'%']] },
  windrunner:{ desc:'Moving quickly gathers storm energy for your next lightning spell.', fx:'Moving builds storm energy (dodges count extra); when it is full your next Lightning Arc, Nova or Stormcall costs half the mana and hits harder. Moving also builds mana regeneration over 5s; stopping resets it. From Rank 5, dodging through an enemy Charges it.',
    stats:[['Distance to fill', r=>windDistNeeded(r)+' paces'], ['Empowered damage', r=>'+'+Math.round(windDmgBonus(r)*100)+'%'], ['Mana while moving', r=>'+'+(windRegenPct(r)*100).toFixed(1)+'%/s']] },
  hurricane:{ desc:'Conjure a raging hurricane that batters and slows everything nearby.', fx:'A hurricane rages around you, hitting and slowing every enemy inside. While it rages you gain Defence. Casting again restarts it.', per:'per hit',
    stats:[['Duration', r=>tipS(hurricaneDuration(r))], ['Defence', r=>'+'+Math.round(hurricaneDefPct(r)*100)+'%'], ['Radius', ()=>String(HURRICANE_RADIUS)]], cd:r=>hurricaneCooldown(r) },
  // ===================== MYSTIC: Elementalist =====================
  fireball:{ desc:'Hurl quick balls of fire.', fx:'Fast balls of fire that may set the target burning (less often elites and bosses; a 2nd ball from Rank 3, a 3rd from Rank 5). Casts quickly and never roots you.', per:'per ball',
    stats:[['Balls per cast', r=>String(fireballCount(r))], ['Burn chance', r=>Math.round(Math.min(1,0.25+0.075*r)*100)+'%']], cost:()=>tipFree },
  iceBolt:{ desc:'Hurl a heavy bolt of ice that chills and freezes.', fx:'A big, slow bolt of ice that chills. '+FREEZE_HITS_NORMAL+' cold hits in a row freeze an ordinary enemy ('+FREEZE_HITS_TOUGH+' for brutes and elites; bosses are only chilled).', per:'per bolt', cost:()=>tipFree },
  elementalPolarity:{ desc:'Follow fire with ice, or ice with fire.', fx:'A spell of the opposite element to your last one (fire after ice, ice after fire) hits harder.',
    stats:[['Bonus damage', r=>'+'+Math.round(polarityBonus(r)*100)+'%']] },
  immolate:{ desc:'Set yourself ablaze, trading your own life for raw power.', fx:'You burn for '+fmtNum(IMMOLATE_SELF_PCT*100)+'% of your max life per second (less with fire resistance, never fatal) but hit far harder, and your Fireballs explode for '+Math.round(IMMOLATE_EXPLODE_PCT*100)+'% damage around the target. Burns until you press it again or fall to '+Math.round(IMMOLATE_MIN_HP*100)+'% life.',
    stats:[['Damage dealt', r=>'+'+Math.round(immolateBoost(r)*100)+'%']], cd:()=>IMMOLATE_CD },
  iceArmor:{ desc:'Encase yourself in a shell of protective ice.', fx:'While on a skill button it keeps 25% of your mana to hold a barrier of ice that soaks damage and refills when you are not hit. Press it to shatter the barrier: cold damage equal to what it holds, freezing nearby enemies (bosses are only chilled).',
    stats:[['Barrier', r=>Math.round(iceArmorScale(r)*100)+'% of max life'], ['Refills after you go unhit for', r=>tipS(iceArmorRecharge(r))]], cost:()=>'25% of your mana kept aside' },
  permafrost:{ desc:'Freeze the ground beneath your foes.', fx:'Enemies on the frozen ground are slowed and take more cold damage; chilled or frozen ones that die there shatter, hurting those nearby. Standing on it you move 10% faster and cast Ice Bolt '+Math.round((PERMAFROST_ICEBOLT_SPEED-1)*100)+'% faster.',
    stats:[['Duration', r=>tipS(permafrostDur(r))], ['Enemy slow', r=>Math.round(permafrostSlowPct(r)*100)+'%'], ['Cold damage taken', r=>'+'+Math.round(permafrostColdAmp(r)*100)+'%'], ['Radius', ()=>String(PERMAFROST_R)]], cd:r=>permafrostCd(r) },
  pyroTorrent:{ desc:'Channel a searing torrent of fire through every enemy in its path.', fx:'A beam of fire that burns every enemy along it and doubles in strength over '+PYRO_RAMP_TIME+'s. It lasts until you press it again, run out of mana or dodge. You can walk while channelling, slower.', per:'per tick',
    cost:r=>resCost(tipP(),'pyroTorrent',r)+' Mana per second' },
  elementalMastery:{ desc:'Master fire and ice.', fx:'Your fire and cold damage hits harder and pierces enemy resistance. From Rank '+EM_BLAST_RANK+', Fireball and Ice Bolt explode on hit (fire burns, ice chills).',
    stats:[['Fire and cold damage', r=>'+'+Math.round(elemMasteryDmgAt(r)*100)+'%'], ['Resistance pierced', r=>Math.round(elemMasteryPenAt(r)*100)+'%'], ['Explosion (of the hit)', r=> r>=EM_BLAST_RANK ? Math.round(emBlastPct(r)*100)+'%' : 'none']] },
  meteor:{ desc:'Call a burning meteor down from the sky.', fx:'A meteor falls on the thickest group of enemies '+METEOR_DELAY+'s later, crushing everything in a wide circle (less at the edge) and leaving the ground burning for '+METEOR_BURN_DUR+'s.', per:'impact', x:'burning ground, per second',
    stats:[['Radius', ()=>String(METEOR_R)]], cd:()=>BLIZZARD_CD },
  blizzard:{ desc:'Call down a freezing blizzard of ice shards.', fx:'Ice shards rain on the thickest group of enemies, chilling them; repeated hits freeze.', per:'per tick',
    stats:[['Duration', ()=>tipS(BLIZZARD_DUR)], ['Radius', ()=>String(BLIZZARD_RADIUS)]], cd:()=>BLIZZARD_CD },
  // ===================== MYSTIC: Necromancer =====================
  soulSap:{ desc:'Drain the life and soul from your enemies with a venomous touch.', fx:'Drains the nearest enemy. Every hit gives you '+SOUL_SAP_SOULS_PER_CAST+' soul and a drained enemy gives '+SOUL_SAP_SOULS_PER_KILL+' more when it dies (up to '+SOUL_CAP+').', per:'per hit (extra targets half)',
    stats:[['Targets', r=>String(soulSapTargets(r))]], cost:()=>tipFree },
  soulShield:{ desc:'The souls you hold circle you and turn aside blows.', fx:'Each soul you hold gives a chance to block hits (up to 50%). No souls are spent.',
    stats:[['Block per soul', r=>(soulShieldBlockPerSoul(r)*100).toFixed(2)+'%'], ['Block at '+SOUL_CAP+' souls', r=>Math.round(Math.min(0.5,soulShieldBlockPerSoul(r)*SOUL_CAP)*100)+'%']] },
  raiseDead:{ desc:'Raise the dead to fight for you.', fx:'Raise skeletons: one per rank, up to '+necroSkeletonCount(5)+'. A fallen skeleton rises again '+tipS(3)+' later for 1 soul; with no souls it stays down until you cast again. Casting again blows up the ones standing and raises a fresh set.',
    stats:[['Skeletons', r=>String(necroSkeletonCount(r))], ['Skeleton damage', tipPet('raiseDead','skeleton','dmg')], ['Skeleton life', tipPet('raiseDead','skeleton','hp')]],
    cd:()=>RAISE_DEAD_CD, cost:r=>RAISE_DEAD_MANA_PER_SKEL+' Mana per skeleton' },
  fear:{ desc:'Curse your foes with dread.', fx:'Curse the biggest group of enemies in range: they flee in terror (bosses stand their ground) and take more damage while cursed.',
    stats:[['Flee', r=>tipS(fearDuration(r))], ['Damage taken', r=>'+'+Math.round(fearVulnPct(r))+'%'], ['Curse lasts', r=>tipS(fearDuration(r)+FEAR_VULN_EXTRA)], ['Radius', ()=>String(FEAR_RADIUS)]], cd:r=>fearCooldown(r) },
  sacrifice:{ desc:'Your fallen skeletons burst in poison.', fx:'When a skeleton dies (or you recast Raise Skeletons) it bursts, poisoning everything around it. No souls are spent.',
    stats:[['Blast (of the skeleton\'s life)', r=>Math.round(sacrificeLifePct(r)*100)+'%'], ['Radius', ()=>String(SACRIFICE_RADIUS)]] },
  soulHunger:{ desc:'Bleed your own life into a growing store of souls.', fx:'Above 50% life you burn '+(SOUL_HUNGER_HP_PCT*100)+'% of your max life to make each soul, and cannot regenerate above 50%. Every 2 souls you hold give +1% damage (+25% at '+SOUL_CAP+').',
    stats:[['A soul every', r=>tipS(soulHungerInterval(r))]] },
  soulFire:{ desc:'Hurl a great rolling ball of green soul-flame.', fx:'A big, slow ball of soul-flame that bursts on the first enemy it reaches, hitting everything around for half physical, half poison damage. Spending 20 souls adds +20% damage.', per:'per burst',
    stats:[['Radius', ()=>String(SOULFIRE_RADIUS)]], cd:()=>SOULFIRE_CD, cost:()=>SOULFIRE_COST_TXT+' souls + '+SOULFIRE_MANA_COST+' Mana' },
  demonBind:{ desc:'Bind a hulking demon to your service.', fx:'Holding '+DEMON_BIND_SOUL_THRESHOLD+' souls binds a demon that fights for you. It hits 10% harder and grows for every 10 souls you hold, and its hits heal you and itself.',
    stats:[['Demon damage', tipPet('demonBind','demon','dmg')], ['Demon life', tipPet('demonBind','demon','hp')], ['Life leech', r=>Math.round(necroDemonLeechPct(r)*100)+'%']] },
  soulGate:{ desc:'Tear open a gate that spits out skeletal archers.', fx:'A gate opens and sends out skeletal archers, each costing '+SOULGATE_SOULS_PER_ARCHER+' souls as it comes out and lasting '+SOULGATE_ARCHER_LIFE+'s. The cooldown starts when it closes.',
    stats:[['Open for', r=>tipS(soulGateDuration(r))], ['An archer every', r=>tipS(soulGateInterval(r))], ['Archer damage', r=>'x'+fmtNum(skillMult(r))]], cd:r=>soulGateCooldown(r) },
  plague:{ desc:'Corrupt the earth itself with a spreading plague.', fx:'A large poison zone that grows up to +150% stronger the longer a foe stays in it. The cooldown starts when it ends.', per:'per second',
    stats:[['Duration', ()=>tipS(PLAGUE_DUR_BASE)], ['Radius', ()=>String(PLAGUE_RADIUS)]], cd:()=>PLAGUE_CD },
};

// ---- layout ----
function tipRow(label, val){ return '<div class="tipRow"><span class="tipLab">'+label+':</span> '+val+'</div>'; }
function tipNext(v){ return ' <span class="tipNext">(next rank: '+v+')</span>'; }
function tipScaled(fn, rank){
  if(rank<=0){ const a = String(fn(1)), b = String(fn(MAX_SKILL_RANK)); return a===b ? a : a+' &rarr; '+b; }
  const v = String(fn(rank));
  if(rank < MAX_SKILL_RANK){ const n = String(fn(rank+1)); if(n!==v) return v+tipNext(n); }
  return v;
}
function tipDmgRow(id, T, rank){
  const d = SKILL_WD[id]; if(!d) return '';
  const p = tipP();
  const types = d.split ? dmgTypeName(d.t)+' + '+dmgTypeName(d.split.t) : dmgTypeName(d.t);
  const one = (arr, type, per)=>{
    const pc = r=>Math.round(swdPct(arr, r))+'%';
    if(rank<=0){ const a = pc(1), b = pc(MAX_SKILL_RANK); return (a===b ? a : a+' &rarr; '+b)+' weapon damage as '+type+', '+per; }
    let v = pc(rank)+' weapon damage as '+type+', '+per;
    if(p && p.wpnMax>0) v += ' (&asymp;'+Math.round(wpnDmg(p,true)*swdPct(arr, rank)/100)+')';
    if(rank < MAX_SKILL_RANK && pc(rank+1)!==pc(rank)) v += tipNext(pc(rank+1));
    return v;
  };
  let h = tipRow('Damage', one(d.r, types, T.per||d.per));
  if(d.x) h += tipRow('Damage', one(d.x.r, dmgTypeName(d.x.t), T.x||d.x.n));
  return h;
}
function tipCostRow(node, T, rank){
  const parts = [];
  const rs = RESOURCE_SKILLS[node.id], p = tipP();
  if(T.cost) parts.push(tipScaled(T.cost, rank));
  else if(rs && rs.cost>0){ const nm = RESOURCE_NAME[(p&&p.cls)||'mystic'] || 'Mana'; parts.push(tipScaled(r=>resCost(p, node.id, r)+' '+nm, rank)); }
  else if(node.type==='active') parts.push(tipFree);
  if(MANA_ON_HIT_PCT[node.id]) parts.push('restores '+Math.round(MANA_ON_HIT_PCT[node.id]*100)+'% Mana per hit');
  let h = parts.length ? tipRow('Cost', parts.join(' &middot; ')) : '';
  if(T.cd) h += tipRow('Cooldown', tipScaled(r=>tipS(T.cd(r)), rank));
  return h;
}
function skillTipHtml(node, rank){
  const T = SKILL_TIPS[node.id]; if(!T) return null;
  let h = '';
  if(T.fx) h += '<div class="tipFx">'+(typeof T.fx==='function' ? T.fx(Math.max(1,rank)) : T.fx)+'</div>';
  h += tipDmgRow(node.id, T, rank);
  for(const [lab, fn] of (T.stats||[])) h += tipRow(lab, tipScaled(fn, rank));
  h += tipCostRow(node, T, rank);
  return h;
}
// short thematic descriptions replace the old ones
[SKILL_TREES, RANGER_SKILL_TREES, MYSTIC_SKILL_TREES].forEach(ts=>{ for(const k of Object.keys(ts)) for(const n of ts[k].nodes){ if(SKILL_TIPS[n.id] && SKILL_TIPS[n.id].desc) n.desc = SKILL_TIPS[n.id].desc; } });
