const stCost = (id, r)=> resCost((game&&game.player&&game.player.cls==='ranger') ? game.player : {cls:'ranger'}, id, Math.max(1,r||1))+' Stamina';   // v489: flat ranger costs
// Row-gating (v64): on top of each node's own reqLevel, the tree's ROW it
// sits in (row is 0-indexed in the node config, but read here as "row 1..4"
// the way the task described it) imposes its own character-level floor --
// row 1 (row:0) is open from level 1 same as before, row 2 (row:1) needs
// level 7+, row 3 (row:2) needs level 14+, row 4 (row:3, capstone row on
// every tree that has one) needs level 28+. The two floors combine as a
// simple max -- whichever is higher wins -- so a node's own reqLevel is
// never weakened by this, only ever potentially raised.
// v219: ONE requirement ladder for every class and tree -- purely by row (the node's own reqLevel is ignored)
const SKILL_ROW_LEVEL_REQ = [1, 7, 14, 21, 28, 35];
function nodeLevelReq(node){
  if(node.capstone) return CAPSTONE_LEVEL_REQ;   // v304: every capstone unlocks at Lv.28
  return SKILL_ROW_LEVEL_REQ[Math.min(node.row||0, SKILL_ROW_LEVEL_REQ.length-1)] || 1;
}
// v304: ranks 6-10 are "mastery ranks", gated by character level.
function masteryReqLevel(nextRank){ return MASTERY_LEVEL_REQ[nextRank] || 0; }
// Necromancer (v78): node.prereq is an AND list by default -- every id
// must be ranked -- exactly the check Marksman's Precise Shot
// (prereq:['arrowEye','trueShot']) already relies on. A node can instead
// opt into OR semantics (only ONE of its prereq ids needs to be ranked)
// by setting node.prereqMode:'or' -- Necromancer's Soul Sap and Plague are
// the only 2 nodes in the game that do this so far. Every other node
// (including every existing capstone) leaves prereqMode unset and gets the
// exact same AND check as before -- this is purely additive, nothing about
// the default path changed. Both canRankUp (the actual gate) and every UI
// "Requires ..." string (treeNodeHtml/openSkillNodePopup) go through this
// one shared helper, so the gate and the displayed text can never disagree.
function prereqSatisfied(p, node){
  const prereq = node.prereq || [];
  if(prereq.length===0) return true;
  if(node.prereqMode==='or') return prereq.some(id=>(p.skills[id]||0) >= 1);
  return prereq.every(id=>(p.skills[id]||0) >= 1);
}
function prereqReqText(TREES, node){
  const prereq = node.prereq || [];
  const joiner = node.prereqMode==='or' ? ' or ' : ' &amp; ';
  return 'Requires '+prereq.map(id=>nodeDisplayName(TREES,id)).join(joiner);
}
function canRankUp(p, treeKey, idx){
  const TREES = treesForClass(p.cls);
  const node = TREES[treeKey].nodes[idx];
  if(!node) return false;
  const rank = p.skills[node.id]||0;
  if(rank>=MAX_SKILL_RANK) return false;
  if(rank>=BASE_MAX_RANK && p.level < masteryReqLevel(rank+1)) return false;
  if(rank===0){
    if(p.level < nodeLevelReq(node)) return false;
    if(!prereqSatisfied(p, node)) return false;
    // Cross-tree capstone exclusivity: a class's trees can each end in one
    // capstone node, but only ONE of those, across all of that class's
    // trees combined, can ever be ranked up by a given character.
    if(capstoneBlocks(p, node)) return false;
  }
  return (p.skillPoints||0) > 0;
}

// (v121) Text pass: the rank-0 blue text of many skills now says exactly what
// each rank adds. Rank>0 lines are left to nodeEffectText's own branches
// unless overridden here.
const SKILL_R0_TEXT = {
  ironSkin: ()=>'Passive: harden your body. Each rank: more Defense (+'+fmtNum(IRON_SKIN_DEFENSE_PCT_BY_RANK[1]*100)+'% up to +'+fmtNum(IRON_SKIN_DEFENSE_PCT_BY_RANK[5]*100)+'%), damage reduction ('+fmtNum(IRON_SKIN_DR_BY_RANK[1]*100)+'% up to '+fmtNum(IRON_SKIN_DR_BY_RANK[5]*100)+'%) and, with a shield equipped, +2% Block Chance. Rank 5 also grants +4% max life.',
  shieldBash: ()=>'Unlocks the SLAM button: damage, a brief stagger, and a chance to stun. Each rank: +5% damage & speed, longer stun, higher stun chance. Rank 5 knocks enemies down.',
  shieldThrow: ()=>'Hurl your shield through several enemies. Each rank: +5% damage, longer stun, higher stun chance (2% up to 10% at Rank 10), +1 chain and a slightly shorter cooldown.',
  guardian: ()=>'Roar and fill your Rage, then charge nonstop while it drains ('+juggDrain(1)+'/s). Enemies you run through take double Slam damage and are knocked back; +'+Math.round(juggDef(1)*100)+'% defence. Cooldown '+GUARDIAN_CD+'s.',
  whirlwind: ()=>'Costs '+RESOURCE_SKILLS.whirlwind.cost+' Rage to start, then '+WHIRLWIND_RAGE_DRAIN+' Rage per second that grows by '+WHIRLWIND_DRAIN_RAMP+' more every second you keep spinning. Spin as long as you have Rage (tap again to stop), hitting every enemy around you for double damage every '+WHIRLWIND_TICK_INTERVAL+'s (scaled by AoE). Attack Speed makes the blade spin faster and hit more often, so your on-hit effects (life leech, bleed) trigger more often too. Each rank: -'+WHIRLWIND_DRAIN_STEP+' Rage/s off the starting drain (10/s at Rank 5). You cannot attack or use other skills while spinning, and you gain no Rage. Dodge cancels the spin. Spinning slows your movement by 10% (5% at Rank 10). Cooldown '+WHIRLWIND_CD+'s.',
  leap: ()=>'Charge up to '+LEAP_RANGE+' at the nearest enemy, invulnerable while charging. On impact you crush the ground, damaging and stunning everything nearby. Costs no Rage -- it GENERATES '+Math.round(LEAP_RAGE_GAIN_PCT*100)+'% of your max Rage. Cooldown '+LEAP_CD+'s. Each rank: +damage, +0.1s stun.',
  unbreakable: ()=>'Roar defiance: take '+Math.round(UNBREAK_DR*100)+'% less damage from everything for '+UNBREAK_DUR+'s. Costs no Rage. Cooldown '+UNBREAK_CD+'s. Each rank: +'+Math.round(UNBREAK_DR_STEP*100)+'% reduction and +'+UNBREAK_DUR_STEP+'s.',
  assault: ()=>'Fills your Rage on use, then rages for '+ASSAULT_BASE_DUR+'s: dealt damage ramps up to +'+Math.round(ASSAULT_DEALT_MAX*100)+'% (and damage taken too), with life leech. Each kill extends it. Each rank: +'+ASSAULT_RANK_STEP+'s duration and longer kill extensions. Cooldown '+ASSAULT_CD+'s.',
  squire: ()=>'Summons a squire follower. A 2nd squire joins at Rank 3 and a 3rd at Rank 5. Squire ranks raise follower life (Offensive Stance raises their damage).',
  offensiveStance: ()=>'Passive: your followers deal +10% damage per rank (up to +50% at Rank 5).',
  commander: ()=>'Unlocks the follower stance switch (assign it to a skill slot): Attack or Guard. Each rank: +10% follower max HP.',
  templarDefensiveStance: ()=>'Passive: followers gain more life, armor and elemental resists with every rank, and Guard-stance followers taunt enemies.',
  battlecry: ()=>'New BATTLECRY button: stun enemies within '+BATTLECRY_RADIUS+' (scaled by AoE) and buff damage and crit chance for you and your followers. Each rank: longer stun, stronger buff, longer duration.',
  rally: ()=>'New RALLY button: re-summon your followers beside you, heal them, and raise block chance and defence for you and them. Each rank: bigger heal, stronger defence, longer buff. Cooldown '+RALLY_CD+'s.',
  survivalFieldDress: ()=>'Bandage yourself: heal '+Math.round(SURV_FIELD_DRESS_REGEN_BASE*100)+'% max HP per second for '+SURV_FIELD_DRESS_DUR+'s while still moving; companions heal half. Each rank: +1% per second and the cooldown drops 3s ('+SURV_FIELD_DRESS_CD_BASE+'s at Rank 1, '+SURV_FIELD_DRESS_CD_MIN+'s at Rank 5).',
  evasion: ()=>'Passive: +5% chance to fully dodge a hit at Rank 1, +2% more per rank after Rank 4 (+32% at Rank 10). Stacks with Dexterity from gear (cap 60%). Every dodge also restores '+evasionDodgeStamina({skills:{evasion:1}})+' Stamina (up to '+evasionDodgeStamina({skills:{evasion:10}})+' at Rank 10).',
  frostTrap: ()=>'Lay a trap that stays where it lands. When an enemy steps near it, it freezes everything in a wide area, then chills them. Up to 3 traps at once. Each rank: +0.2s freeze, +0.5s chill. Elites and brutes are frozen for less; bosses are only chilled.',
  vanish: ()=>'Become untargetable for 1s; dealing damage ends it early. Each rank: +1s duration. Cooldown 30s.',
  stunShot: ()=>'New STUN button (requires Crippling Shot): a heavy shot that stuns on hit. Each rank: +5% damage and +0.075s stun. Cooldown 6s.',
  companionBear: ()=>'Summons a bear companion, your hardest-hitting follower. Each rank after the first: +15% bear damage & HP.',
  companionWolf: ()=>'Passive: a wolf fights at your side and its attacks cause Bleed. It respawns 5s after falling (down to 3s at Rank 5). Each rank after the first: +15% wolf damage & HP. Its hits life-leech 5% of damage dealt at Rank 1, up to 20% at Rank 10 (heals only the wolf). A second wolf joins at Rank 5.',
  lightningArc: ()=>'Shoots an instant lightning bolt at your target. Assign it to Main/1/2/3 like any active skill. Each rank: +5% damage.',
  nova: ()=>'New NOVA button (requires Lightning Chain): a lightning ring around you that adds a Charge to every monster it touches. Each rank: +5% damage. Cooldown 9s. Shares a '+AOE_GCD+'s cooldown with Fire Bomb and Hurricane.',
  tornado: ()=>'New TORNADO button (requires Thunderstep): a double-sized tornado that pierces every enemy in its path. Each rank: +5% damage and a shorter cooldown (3s at Rank 1 down to 1s at Rank 10).',
  storm: ()=>'Passive (requires Tornado): a small storm cloud hangs over you, permanently adding Crit Chance. Your critical hits lower the target\'s lightning resistance by 10% (25% at rank 10) for '+STORM_SHRED_DUR+'s.',
  hurricane: ()=>'Capstone (requires Storm). New HURRICANE button: conjure a hurricane around you that damages and slows every enemy inside for 4s at Rank 1. Each rank: +5% damage and +1s duration (11s at Rank 10). Cooldown 15s at Rank 1, down to 10s at Rank 5. While it rages you gain +10% defence (+30% at Rank 10). Casting it again while it is still raging restarts it. Shares a '+AOE_GCD+'s cooldown with Nova and Fire Bomb.',
  iceArmor: ()=>'Reserves 25% of your mana for a standing ice barrier (a share of your max life) that soaks damage and refills on its own. The ICE ARMOR button explodes it for cold damage equal to the barrier and freezes nearby enemies. Each rank: +30 barrier. Cooldown 180s.',
  fireBomb: ()=>'New FIREBOMB button: explode in a burst of fire around you (scaled by AoE). Each rank: +5% damage. Cooldown 8s. Shares a '+AOE_GCD+'s cooldown with Nova and Hurricane.',
  sacrifice: ()=>'Passive: when one of your skeletons dies it bursts in poison, burning up to 1 soul (more with ranks) for a bigger blast. Each rank: +5% damage.',
  soulSap: ()=>'Fires a bolt that pulls the soul out of an enemy it kills (up to 50 souls held; see the counter, top right). Assign it to Main/1/2/3. Each rank: +5% damage, and +1% damage for every soul held. Requires Fear OR Raise Dead.',
};
// (v147) Average damage per hit/tick for the damaging skills, from the caster's real stats
// (before enemy armor/resists; crit chance folded in as x1.8 on crits). Returns {v, unit} or null.
function skillAvgDamage(id, rank, p){
  if(!p || !(rank>0) || !p.skills) return null;
  const lv = p.level||1, W = wpnDmg(p, true);
  const mult = skillMult(rank);
  const gen = (assaultDealtMult(p)||1) * (weaponDmgMult(p)||1);
  const critX = 1 + Math.min(1,(p.critChance||0)/100)*0.8;
  let v = null, unit = 'per hit';
  switch(id){
    case 'fireball': v = elementalPolarityDmg(p, FIREBALL_BASE_DMG, rank-(effectiveRank(p,'fireball')||0), 'fireball') * FIREBALL_BALL_MULT; unit = 'per ball'; break;
    case 'iceBolt': v = elementalPolarityDmg(p, ICE_BOLT_BASE_DMG, rank-(effectiveRank(p,'iceBolt')||0), 'iceBolt') * ICE_BOLT_DMG_MULT; break;
    case 'flameVortex': v = (W*dmgK(12,1.5,0.5)) * mult * gen * 0.5; unit = 'per tick, blast x'+(FLAME_VORTEX_BLAST_MULT*2)+' of that'; break;
    case 'lightningArc': v = (W*dmgK(12,2.2,1)) * mult * gen * critX; break;
    case 'nova': v = (W*dmgK(16,1.6,0.6)) * NOVA_DMG_MULT * mult; break;
    case 'blizzard': v = (W*dmgK(24,2.2,0.6)) * mult * gen * BLIZZARD_TICK_MULT * HEAVY_SPELL_MULT; unit = 'per tick, every '+BLIZZARD_TICK+'s'; break;
    case 'pyroTorrent': v = (W*dmgK(9,1.3,0.4)) * mult * gen * PYRO_TORRENT_TICK_MULT * (1+PYRO_TORRENT_RAMP*0.5) * HEAVY_SPELL_MULT / PYRO_TORRENT_TICK_INTERVAL; unit = 'per second'; break;
    case 'shieldBash': v = (W*dmgK(12,2.2,1)) * mult * critX; break;
    case 'soulFire': v = soulFireDmg(p, rank); unit = 'to each enemy'; break;
    case 'plague': v = (W*dmgK(10,1.2,0)) * mult * PLAGUE_DMG_BUFF; unit = 'poison per tick'; break;
    case 'deathBolt': v = (W*dmgK(12,2.2,1)) * DEATHBOLT_MULT * mult * gen * critX; break;
    case 'sacrifice': v = SACRIFICE_BASE_DMG * mult; unit = 'per minion'; break;
  }
  if(v==null || !isFinite(v)) return null;
  return {v:Math.round(v), unit};
}
// v371: tooltip tidy-up. Strips the cost text written into individual skill strings (the generic cost span below shows it once),
// fixes stale numbers and replaces awkward wording.
const TIDY_R0 = {
  shieldThrow:'Hurl your shield through the enemy ranks; it chains between enemies and flies back to you. Each rank: +5% damage, longer stun, higher stun chance (2% up to 10% at Rank 10), +1 chain and a slightly shorter cooldown.',
  cleave:'Passive (needs a two-handed sword): Strike becomes Cleave, a 90-degree sweep in front of you for 2.75x weapon damage at Rank 1, up to 5x at Rank 10. Slightly longer reach than one-handed weapons.',
  whirlwind:'Spin and hit every enemy around you every 0.25s (scaled by AoE) for 2x damage at Rank 1, rising to 3.5x at Rank 10. Rage drains while you spin: the starting rate falls from 15/s at Rank 1 to 5/s at Rank 10 and grows by 5/s for every second you keep spinning. Tap again to stop. You cannot attack or use other skills and you gain no Rage while spinning; Dodge cancels it. Attack Speed spins faster and triggers on-hit effects (life leech, bleed) more often. Slows your movement 10% (5% at Rank 10). Cooldown 7s.',
  weaponsSpecialist:'Two-handed swords deal +30% damage. Unlocks the Longsword line (Longsword, Greatsword, Demonblade) and dual-wielding. Each rank adds two-hander damage and armor penetration, dual-wield attack speed, Rage generation, and a parry chance equal to half your Block Chance.',
  bannerWar:null
};
const TIDY_REPL = {
  shieldBash:[[/It costs no Rage: it GENERATES it, /,'Costs no Rage; it generates Rage instead: ']],
  hurricane:[[/Cooldown 15s at Rank 1, down to 10s at Rank 5\./,'Cooldown 8s at Rank 1, down to 6s at Rank 10.']],
  pyroTorrent:[[/ Costs mana per second\./,'']],
  fear:[[/ Costs mana\./,'']],
  plague:[[/ Costs mana, no souls\. Cooldown starts when it ends\./,' Cooldown starts when the zone ends.'],[/Tick dmg ~\d+ \(every [\d.]+s, base, scales with level\) &middot; /,'']],
  sacrifice:[[/Burst dmg ~\d+ \(\+50% per soul burned, up to (\d+) souls?\)/,'+50% burst damage per soul burned (up to $1)']],
  rainOfArrows:[[/Dmg ~(\d+) \(base, scales with level\/gear\)/,'Damage ~$1 total over 3 volleys'],[/ &middot; total over 3 volleys/,''],[/ Each rank increases damage\. 6 second cooldown\./,' Each rank increases damage. Cooldown 6s.']],
  leap:[[/Charge up to (\d+) at/,'Charge up to $1 units at'],[/Costs no Rage -- it GENERATES/,'Costs no Rage; generates']],
  battlecry:[[/within (\d+) \(bosses/,'within $1 units (bosses']],
  banner:[[/Standards alternate with every cast, and a new one replaces the last:&bull;/,'Each cast alternates between two standards and a new one replaces the last. &bull;'],[/&bull;/g,' &bull; '],[/second\.(?:<br\s*\/?>)?\s*Gives/,'second.<br>Gives']],
  assault:[[/^Fills Rage on use/,'Fills Rage on use · Damage ramps to +50% (damage taken too) · Cooldown 20s'],[/ &middot; /,' &middot; ']],
  weaponsSpecialist:[[/ \(on top of the base \+30%\)/,' (plus base +30%)'],[/Two-hander \/ dual-wield: (\+\d+%) Rage generation \(on every Strike, Cleave and Fury hit\)/,'Rage gain $1 (Strike, Cleave, Fury)'],[/Parry: half your Block Chance \((\d+)% now\) as a chance to parry, while using a two-hander or dual swords/,'Parry chance: $1% (half your Block Chance; two-hander or dual swords)']]
};
function tidySkillText(node, rank, t, isNext){
  const id = node.id;
  if(rank===0 && TIDY_R0[id]) t = TIDY_R0[id];
  (TIDY_REPL[id]||[]).forEach(([a,b])=>{ t = t.replace(a,b); });
  if(id==='shieldThrow') t = t.replace(/Dmg \+(\d+)%/, (m,n)=>'Damage x'+fmtNum(1+(+n)/100));
  if(id==='whirlwind' && rank>0){ t = t.replace(/Hits every/, 'Damage x'+fmtNum(whirlDmgMult(rank))+' per hit &middot; Hits every'); t += ' &middot; Cooldown 7s'; }
  t = t.replace(/(Damage|Dmg):? \+(\d+)%/g, (m,w,n)=>'Damage x'+fmtNum(1+(+n)/100)).replace(/ \(fixed\)/g,'');
  const rs = RESOURCE_SKILLS[id];
  if(rs && rs.cost>0){
    t = t.replace(/(?:\s*&middot;\s*)?Costs? (\d+)% (Rage|Stamina|Mana) \(refunds (\d+)%\)/, ' &middot; Refunds $3% $2 on hit')
         .replace(/(?:\s*&middot;\s*)?Costs? \d+%? (?:Rage|Stamina|Mana)\b(?! to start)/g, '')
         .replace(/\s*Costs? \d+% of your Stamina\./,'').replace(/\s*Costs Stamina\./,'')
         .replace(/ Costs 30 Rage\./,'').replace(/, but it costs 33% of your Stamina\./,'.').replace(/; costs 6% Stamina and refunds 3% like a basic shot\./,'; refunds 3% Stamina on hit like a basic shot.').replace(/\.\s+\./g,'.');
  }
  t = t.replace(/(Dmg\/HP|Combo damage per hit): \+(\d+)%/g, (m,w,n)=>w+': x'+fmtNum(1+(+n)/100)).replace(/\(\+(\d+)%\)/, (m,n)=>'(x'+fmtNum(1+(+n)/100)+')');
  // v372: show the next rank's multiplier next to the current one, e.g. "Damage x1 (next rank x1.05)"
  if(!isNext && rank>=1 && rank<MAX_SKILL_RANK){
    const RX = /((?:[Dd]amage|Dmg\/HP|per hit):? ?)x([\d.]+)|\(x([\d.]+)\)/;
    const m1 = RX.exec(t);
    if(m1){
      let nt = ''; try{ nt = tidySkillText(node, rank+1, nodeEffectTextBase(node, rank+1), true); }catch(e){}
      const m2 = RX.exec(nt);
      const cur = m1[2]||m1[3], nxt = m2 && (m2[2]||m2[3]);
      if(nxt && nxt!==cur){ t = t.slice(0, m1.index+m1[0].length) + ' <span style="opacity:.7">(next rank x'+nxt+')</span>' + t.slice(m1.index+m1[0].length); }
    }
  }
  if((id==='packTactics'||id==='recall'||id==='beastFury') && !/Stamina/.test(t)) t += ' &middot; Costs '+resCost((game&&game.player)||{cls:'ranger'}, id)+' Stamina';   // v499
  return t;
}
// v458: every damaging skill's tooltip leads with its weapon-damage % and damage type(s)
const DMG_TYPE_COLOR = {physical:'#e6d6b8', fire:'#ff9a4a', cold:'#8fd8ff', lightning:'#f2e66a', poison:'#8fe05a'};
function dmgTypeName(t){ return '<span style="color:'+(DMG_TYPE_COLOR[t]||'#fff')+'">'+t.charAt(0).toUpperCase()+t.slice(1)+'</span>'; }
function wdHeader(id, rank){
  const d = SKILL_WD[id]; if(!d) return '';
  const pl = (typeof game!=='undefined' && game && game.player) || null;
  const types = d.split ? dmgTypeName(d.t)+' + '+dmgTypeName(d.split.t)+' ('+Math.round((1-d.split.f)*100)+'/'+Math.round(d.split.f*100)+')' : dmgTypeName(d.t);
  const pctAt = (arr,r)=>Math.round(swdPct(arr, r));
  let h = '<div style="margin-bottom:3px">';
  if(rank>0){
    const pc = pctAt(d.r, rank);
    h += '<b style="color:#ffcf8a">'+pc+'% Weapon Damage</b> as '+types+' <span style="color:#b9ad92">'+d.per+'</span>';
    if(pl && pl.wpnMax>0) h += ' <span style="color:#b9ad92">(\u2248'+Math.round(wpnDmg(pl,true)*pc/100)+' with your weapon)</span>';
    if(d.x) h += '<br><b style="color:#ffcf8a">'+pctAt(d.x.r, rank)+'% Weapon Damage</b> as '+dmgTypeName(d.x.t)+' <span style="color:#b9ad92">'+d.x.n+'</span>';
  } else {
    h += '<b style="color:#ffcf8a">'+d.r[0]+'% \u2192 '+d.r[1]+'% Weapon Damage</b> (Rank 1 \u2192 10) as '+types+' <span style="color:#b9ad92">'+d.per+'</span>';
    if(d.x) h += '<br><b style="color:#ffcf8a">'+d.x.r[0]+'%'+(d.x.r[1]!==d.x.r[0] ? ' \u2192 '+d.x.r[1]+'%' : '')+' Weapon Damage</b> as '+dmgTypeName(d.x.t)+' <span style="color:#b9ad92">'+d.x.n+'</span>';
  }
  h += '<br><span style="color:#9d937c;font-size:0.92em">'+(d.c==='spell' ? 'Spell: scales from your weapon roll; flat weapon damage never applies.' : 'Weapon skill: flat damage on your sword or bow joins it.')+' Matching +% damage mods apply.</span></div>';
  return h;
}
const OLD_DMG_PHRASES = [
  [/Fire blast dmg ~\d+ \([^)]*\)( plus burning)? &middot; /,''], [/Cold burst dmg ~\d+ &middot; /,''],   // v477: stale numbers beside the live weapon-damage line
  [/ \(100% weapon damage, like Strike\)/,''], [/Each rank: \+5% damage/g,'Each rank: more damage'], [/takes 2x your Shield Slam damage/,'gets trampled'],
  [/ for 1\.5x Slam damage/,''], [/ for [\d.]+x weapon damage at Rank 1, up to [\d.]+x at Rank 10/,''], [/ for 2x damage at Rank 1, rising to 3\.5x at Rank 10/,''],
  [/ for 1x weapon damage, like Strike,/,''], [/Damage is \d+% of a normal hit, rising to \d+% at Rank 10\.\s*/,''], [/Damage x2 at Rank 1 rising to x3 at Rank 10\.\s*/,''],
  [/Explosion: \d+% of the hit as fire, radius/,'Explosion radius'], [/ for 3x damage \(up to [\d.]+x at Rank 10\)/,''], [/fires a 1\.5x snap shot/,'fires a weaker snap shot'],
  [/each ball \d+% of a full hit, /,''], [/Heavy bolt: about [\d.]+x a normal hit, but slower to cast/,'Heavy bolt, slower to cast'], [/\s*\+30% damage\./,''],
];
function stripOldDmgText(t){
  t = t.split('&middot;').filter(seg=>!/^\s*(Tick damage|Damage|Dmg|Base damage|Combo damage|Cleave damage|Counter-strike|Bolt damage|Hit damage|Cloud tick dmg|Held:|Tap:|explosion \d|\d+(\.\d+)?x weapon damage)/i.test(seg.replace(/<[^>]+>/g,''))).join('&middot;').replace(/^\s*&middot;\s*/,'').replace(/\s*&middot;\s*$/,'');
  for(const [re, to] of OLD_DMG_PHRASES) t = t.replace(re, to);
  return t;
}
// v477: numbers for skills whose damage isn't a weapon-damage line -- companions, minions, Multi Shot, Ambush.
// Shown before you invest too (previewed at Rank 1), so every damaging skill shows what it will do.
const PREVIEW_PETS = {companionWolf:'wolf', companionBear:'bear', raiseDead:'skeleton', demonBind:'demon', squire:'knight'};
function withRank(p, id, r, fn){ const old = p.skills[id]; p.skills[id] = r; try{ return fn(); } finally { p.skills[id] = old; } }
function skillPreviewExtra(node, rank){
  const p = (typeof game!=='undefined' && game && game.player) || null; if(!p || !p.skills) return '';
  const r = Math.max(1, rank||0), lead = rank>0 ? '' : 'At Rank 1: ';
  const pet = PREVIEW_PETS[node.id];
  if(pet){
    return withRank(p, node.id, r, ()=>{ const f = {kind:pet}; const d = followerDmg(p, f), hp = followerMaxHp(p, f);
      return lead+'≈'+Math.round(d)+' damage per hit, ≈'+Math.round(hp)+' life each'+(pet==='demon' ? ' (grows with souls held)' : ''); });
  }
  if(node.id==='packTactics'){
    const k = (p.skills.companionBear>0) ? 'bear' : 'wolf', src = k==='bear' ? 'companionBear' : 'companionWolf';
    const base = withRank(p, src, Math.max(1, p.skills[src]||0), ()=>followerDmg(p, {kind:k}));
    return lead+'landing hit ≈'+Math.round(base*1.5)+' with your '+k;
  }
  if(node.id==='ironSkin') return 'Standing your ground: +10% Defence for every second you stand still, up to +50% after 5s (moving or dodging resets it)';
  if(node.id==='multiShot'){
    const per = wpnDmg(p, true)*MARKSMAN_DMG_TUNE*bowExpertDmgMult(p);
    return lead+multiShotCount(r)+' arrows, each 50% of a normal shot (≈'+Math.round(per)+' with your weapon), up to '+Math.round(multiShotCount(r)*50)+'% on one close target';
  }
  return '';
}
function nodeEffectText(node, rank){
  let t = tidySkillText(node, rank, nodeEffectTextBase(node, rank));
  if(SKILL_WD[node.id]) t = wdHeader(node.id, rank) + stripOldDmgText(t);
  else try{
    const pl0 = (typeof game!=='undefined' && game && game.player) || null;
    const ad = skillAvgDamage(node.id, rank, pl0);
    if(ad) t += ' <span class="resCost" style="color:#ffb27a">&middot; Avg damage: '+ad.v+' '+ad.unit+'</span>';
  }catch(e){}
  try{ const ex = skillPreviewExtra(node, rank); if(ex) t += ' <span class="resCost" style="color:#ffb27a">&middot; '+ex+'</span>'; }catch(e){}
  if(MANA_ON_HIT_PCT[node.id] && (typeof game!=='undefined' && game && game.player && game.player.cls==='mystic' || true)){
    const pl2 = (typeof game!=='undefined' && game && game.player) || null;
    const gain = pl2 && pl2.maxMp ? Math.round(pl2.maxMp*MANA_ON_HIT_PCT[node.id]) : null;
    t += ' <span class="resCost" style="color:#7ea8ff">&middot; Restores '+Math.round(MANA_ON_HIT_PCT[node.id]*100)+'% Mana per hit'+(gain?(' (~'+gain+')'):'')+'</span>';
  }
  const rs = RESOURCE_SKILLS[node.id];
  if(rs && rs.cost>0){
    const cls = (typeof game!=='undefined' && game && game.player && game.player.cls) || ({mystic:'mystic'})[node.id] || 'mystic';
    const nm = RESOURCE_NAME[(typeof game!=='undefined' && game && game.player && game.player.cls) || 'mystic'] || 'Mana';   // v303: was a hard-coded id list that missed Immolate, Flame Vortex, Permafrost, Soul Gate...
    const pl = (typeof game!=='undefined' && game && game.player) || null;
    const costSfx = node.id==='pyroTorrent' ? ' per second' : node.id==='whirlwind' ? ' to start' : '';
    t += ' <span class="resCost">&middot; Costs '+resCost(pl, node.id, Math.max(1,rank||1))+' '+nm+costSfx+'</span>';
  } else if(node.type==='active' && !/\bCosts?\b|GENERATES|[Gg]enerates|Conviction|Refunds|[Ss]pend/.test(t)){
    t += ' <span class="resCost">&middot; No cost</span>';
  }
  return t;
}
const RV227_TEXT = {
  aimedShot:(r)=> r===0 ? 'Active: a full-draw shot with +'+AIMED_SHOT_CRIT_BONUS+'% crit chance. It pierces '+aimedShotPierce(1)+' enemies (one more every 2 ranks), each hit weaker than the last.' : 'Dmg x'+fmtNum(AIMED_SHOT_DMG_MULT*skillMult(r))+' of a normal arrow &middot; Pierces '+aimedShotPierce(r)+' enemies (-'+Math.round((1-AIMED_SHOT_FALLOFF)*100)+'% per enemy) &middot; +'+AIMED_SHOT_CRIT_BONUS+'% crit chance',
  longshot:(r)=> r===0 ? 'Passive: arrows deal +5% damage per rank to targets farther than '+LONGSHOT_DIST+' away (up to +'+Math.round(LONGSHOT_PER_RANK*10*100)+'% at Rank 10).' : '+'+Math.round(LONGSHOT_PER_RANK*r*100)+'% arrow damage against distant targets (over '+LONGSHOT_DIST+')',
  deadeye:(r)=> r===0 ? 'Passive: critical hits deal +8% more damage per rank and restore 1% of your max Stamina per rank each time you crit.' : 'Crit damage +'+Math.round(DEADEYE_CRITMULT_PER_RANK*r*100)+'% &middot; Each crit restores '+r+'% max Stamina',
  trueShot:(r)=> r===0 ? 'Passive: your Ranger skills cost 5% less Stamina per rank and Stamina regenerates 3% faster per rank.' : 'Stamina costs -'+(5*r)+'% &middot; Stamina regeneration +'+(3*r)+'%',
  rainOfArrows:(r)=> r===0 ? 'Active (requires Deadeye). Shoot an arrow to the sky which shatters and rains down many arrows in an area. Each rank increases damage. 6 second cooldown.' : 'Dmg ~'+Math.round(RAIN_OF_ARROWS_BASE_DMG*skillMult(r))+' (base, scales with level/gear) &middot; Radius '+RAIN_OF_ARROWS_RADIUS+' &middot; Cooldown '+RAIN_OF_ARROWS_CD+'s (fixed) &middot; total over 3 volleys',
  huntersBond:(r)=> r===0 ? 'Passive: your Wolf and Bear deal +6% damage and have +8% life per rank.' : 'Wolf & Bear: +'+Math.round(BOND_DMG_PER_RANK*r*100)+'% damage, +'+Math.round(BOND_HP_PER_RANK*r*100)+'% life',
  beastFury:(r)=> r===0 ? 'Active (requires Hunter\'s Bond): for 8s your companions deal +50% damage and attack 25% faster, and you deal +15% damage. 20s cooldown.' : 'Duration '+(BEAST_FURY_DUR+r-1)+'s &middot; Companions +50% damage, 25% faster attacks &middot; You +15% damage &middot; Cooldown '+BEAST_FURY_CD+'s',
  huntersMark:(r)=> r===0 ? 'Active: mark the nearest enemy for 8s. You and your companions deal +15% more damage to it. One mark at a time.' : 'Mark lasts '+(HMARK_DUR+r-1)+'s &middot; Marked enemy takes +'+Math.round((HMARK_BONUS+HMARK_BONUS_STEP*(r-1))*100)+'% damage from you and your pets &middot; Cooldown '+HMARK_CD+'s',
  markedPrey:(r)=> r===0 ? 'Passive: marked enemies take +6% more damage per rank from you and your pets, and killing a marked enemy resets Hunter\'s Mark.' : 'Marked enemies: +'+Math.round(MARKED_PREY_PER_RANK*r*100)+'% more damage &middot; Killing a marked enemy resets Hunter\'s Mark',
  explosiveTrap:(r)=> r===0 ? 'Active: throw a trap that arms after a moment and detonates in a fire blast when enemies come near, igniting them. Costs Stamina.' : 'Fire blast dmg ~'+Math.round(EXPLOSIVE_TRAP_BASE_DMG*skillMult(r))+' (base, scales with level/gear) plus burning &middot; Cooldown '+trapCdText(6),
  trapMastery:(r)=> r===0 ? 'Passive: Poison and Explosive Traps deal +8% damage per rank, all traps have +6% radius per rank, and all three traps recharge 5% faster per rank.' : 'Trap damage +'+Math.round(TRAP_MASTERY_DMG*r*100)+'% &middot; Radius +'+Math.round(TRAP_MASTERY_RADIUS*r*100)+'% &middot; Trap cooldowns -'+Math.round(TRAP_MASTERY_CD*r*100)+'%',
  survivalInstinct:(r)=> r===0 ? 'Passive: +5% max life and +2% movement speed per rank. +15% damage with ailments at rank 1, up to +50% at rank 10 (against enemies that are bleeding, poisoned, burning, chilled, frozen, charged or stunned).'
    : 'Max life +'+Math.round(INSTINCT_HP_PER_RANK*r*100)+'% &middot; Move speed +'+Math.round(INSTINCT_SPEED_PER_RANK*r*100)+'% &middot; +'+Math.round(predInstinctPct(r)*100)+'% damage vs ailing enemies',
  opportunist:(r)=> r===0 ? 'Passive: after you dodge, deal +5% more damage per rank for 3 seconds.' : 'After a dodge: +'+Math.round(OPPORTUNIST_PER_RANK*r*100)+'% damage for '+OPPORTUNIST_DUR+'s',
};
const RV266_TEXT = {
  shieldBash:(r)=> r===0 ? 'Unlocks the SLAM button: a shield blow in a cone (100% weapon damage, like Strike) that has a chance to stun. It costs no Rage: it GENERATES it, +'+SLAM_RAGE_PER_TARGET+' per foe hit (up to '+SLAM_RAGE_TARGETS+' foes). Same speed as Strike. Each rank: +5% damage, +'+SLAM_RAGE_STEP+' Rage per foe, higher stun chance (2% at Rank 1 up to 25% at Rank 10).'
    : 'Damage: +'+Math.round((skillMult(r)-1)*100)+'% &middot; Rage gained: +'+(SLAM_RAGE_PER_TARGET+SLAM_RAGE_STEP*(r-1))+' per foe (up to '+SLAM_RAGE_TARGETS+') &middot; '+Math.round(slamStunChance(r)*100)+'% chance of a '+fmtNum(shieldBashStunDuration(r))+'s stun',
  unbreakable:(r)=> r===0 ? 'Passive: pain feeds you (+20% Rage from hits taken per rank). Below '+Math.round(UNBREAK_LOW_HP*100)+'% life you take '+Math.round(UNBREAK_LOW_DR*100)+'% less damage (+'+Math.round(UNBREAK_LOW_DR_STEP*100)+'% per rank). A killing blow leaves you at 20% life instead, once every '+UNBREAK_SAVE_CD+'s (shorter per rank).'
    : 'Rage from hits taken: +'+Math.round(UNBREAK_HURT_RAGE*r*100)+'% &middot; Below '+Math.round(UNBREAK_LOW_HP*100)+'% life: '+Math.round((UNBREAK_LOW_DR+UNBREAK_LOW_DR_STEP*(r-1))*100)+'% less damage &middot; Survive a killing blow every '+(UNBREAK_SAVE_CD-UNBREAK_SAVE_STEP*(r-1))+'s',
  bulwark:(r)=> r===0 ? 'Active: for '+BULWARK_DUR+'s your armor rises '+Math.round((BULWARK_ARMOR-1)*100)+'% and your speed falls 50%. Every point of damage you take is stored and released as a knockback shockwave when it ends (tap again to release early). Costs '+resCost(null,'bulwark')+' Rage. Cooldown '+BULWARK_CD+'s. Each rank: +'+BULWARK_DUR_STEP+'s.'
    : 'Duration '+fmtNum(BULWARK_DUR+BULWARK_DUR_STEP*(r-1))+'s &middot; Armor +'+Math.round((BULWARK_ARMOR-1)*100)+'% &middot; Speed -50% &middot; Cost '+resCost(null,'bulwark')+' Rage &middot; Releases '+Math.round(BULWARK_REL*100)+'% of stored damage as a shockwave &middot; Cooldown '+BULWARK_CD+'s',
  guardian:(r)=> r===0 ? 'Capstone: let out a war cry, fill your Rage meter and charge. You cannot stop moving until the Rage runs out ('+juggDrain(1)+' Rage per second), but you steer freely. Every enemy you run into takes '+JUGG_DMG_MULT+'x your Shield Slam damage and is knocked back, and your defence rises '+Math.round(juggDef(1)*100)+'%. You cannot attack or use skills while charging. You also speed up 1% every second, and when the Rage runs out you erupt in a burst for '+JUGG_BURST_MULT+'x Slam damage (the speed ramp and burst do not scale with rank). Cooldown '+GUARDIAN_CD+'s. Each rank: less Rage lost per second (down to 10), more damage and defence.'
    : 'Rage loss: '+fmtNum(juggDrain(r))+'/s &middot; Damage: '+fmtNum(juggDmgMult(r))+'x Slam &middot; Defence +'+Math.round(juggDef(r)*100)+'% &middot; Cooldown '+GUARDIAN_CD+'s',
  weaponsSpecialist:(r)=> r===0 ? 'Two-handed swords already deal +'+Math.round((TWOHAND_BASE_DMG_MULT-1)*100)+'% damage. This unlocks the Longsword line (Longsword &rarr; Greatsword &rarr; Demonblade) with bonus damage and armor penetration per rank, and dual-wielding with bonus attack speed.'
    : 'Two-hander: +'+Math.round(GREATSWORD_DMG_PER_RANK*r*100)+'% damage (on top of the base +'+Math.round((TWOHAND_BASE_DMG_MULT-1)*100)+'%), '+Math.round(Math.min(1,GREATSWORD_ARMORPEN_PER_RANK*r)*100)+'% armor pen &middot; Dual-wield: +'+Math.round(DUAL_WIELD_ATKSPD_PER_RANK*r*100)+'% attack speed &middot; Two-hander / dual-wield: +'+(wsRagePct(r)*100).toFixed(1).replace(/\.0$/,'')+'% Rage generation (on every Strike, Cleave and Fury hit) &middot; Parry: half your Block Chance ('+Math.round(100*(game&&game.player?parryChanceBase(game.player):0.05))+'% now) as a chance to parry, while using a two-hander or dual swords',
  bloodHarvest:(r)=> r===0 ? 'Passive: enemies drop more health globes (+'+Math.round(BLOOD_HARVEST_PER_RANK*100)+'% per rank, +20% at Rank 10). Rage that fades out of combat is returned as life.' : 'Health globe drops: +'+Math.round(BLOOD_HARVEST_PER_RANK*r*100)+'% &middot; Faded Rage heals '+Math.round(bloodHarvestRecovery(r)*100)+'% of its value as life out of combat',
  reave:(r)=> r===0 ? 'Active basic attack: a single blow for 1x weapon damage, like Strike, that makes the target bleed for '+Math.round(reaveBleedPct(1)*REAVE_BLEED_DUR*100)+'% of the hit over '+REAVE_BLEED_DUR+'s. Same speed as Strike, no cooldown, builds Rage. Each rank: a stronger bleed.'
    : '1x weapon damage &middot; Bleed: '+Math.round(reaveBleedPct(r)*REAVE_BLEED_DUR*100)+'% of the hit over '+REAVE_BLEED_DUR+'s &middot; Same speed as Strike',
  battlecry:(r)=> r===0 ? 'Active: a terrifying roar. Enemies within '+WARCRY_RADIUS+' flee from you for '+WARCRY_FEAR+'s (bosses resist), take +'+Math.round(WARCRY_VULN*100)+'% damage for '+WARCRY_DUR+'s, and you gain '+WARCRY_RAGE+' Rage. Cooldown '+BATTLECRY_CD+'s. Each rank: they flee longer, and the curse is stronger and longer.'
    : 'Enemies flee for '+fmtNum(WARCRY_FEAR+WARCRY_FEAR_STEP*(r-1))+'s &middot; Enemies take +'+Math.round((WARCRY_VULN+WARCRY_VULN_STEP*(r-1))*100)+'% damage for '+fmtNum(WARCRY_DUR+WARCRY_DUR_STEP*(r-1))+'s &middot; +'+WARCRY_RAGE+' Rage &middot; Cooldown '+BATTLECRY_CD+'s',
  bloodrage:(r)=> r===0 ? 'Active: spend '+Math.round(BLOODRAGE_COST_PCT*100)+'% of your current life (not below '+Math.round(BLOODRAGE_MIN_HP*100)+'% life) for +'+BLOODRAGE_RAGE+' Rage and +'+Math.round(BLOODRAGE_DMG*100)+'% damage for '+BLOODRAGE_DUR+'s. Cooldown '+BLOODRAGE_CD+'s. Each rank: stronger and longer.'
    : '+'+Math.round((BLOODRAGE_DMG+BLOODRAGE_DMG_STEP*(r-1))*100)+'% damage for '+fmtNum(BLOODRAGE_DUR+BLOODRAGE_DUR_STEP*(r-1))+'s &middot; +'+BLOODRAGE_RAGE+' Rage &middot; Costs '+Math.round(BLOODRAGE_COST_PCT*100)+'% of current life &middot; Cooldown '+BLOODRAGE_CD+'s',
  rampage:(r)=> r===0 ? 'Passive: each kill adds a stack of attack speed (up to '+RAMPAGE_MAX+' stacks, fading after '+RAMPAGE_WINDOW+'s without a kill). You also deal more damage the more Rage you carry: +'+Math.round(rampagePerStack(1)*100)+'% at a full bar, shrinking with the bar (+1% at a tenth of it). Each rank strengthens both.'
    : '+'+(rampageSpeedPerStack(r)*100).toFixed(1)+'% attack speed per stack (up to +'+Math.round(rampageSpeedPerStack(r)*RAMPAGE_MAX*100)+'%) &middot; +'+Math.round(rampagePerStack(r)*100)+'% damage at full Rage (scales down with the bar)',
  assault:(r)=> r===0 ? 'Capstone: fills your Rage on use, then rages for '+ASSAULT_BASE_DUR+'s: dealt damage ramps up to +'+Math.round(ASSAULT_DEALT_MAX*100)+'% (and damage taken too), with life leech and reflected damage. Each kill extends it and trims '+ASSAULT_KILL_CDR+'s off its cooldown, so you can chain it across packs. When it ends, all your remaining Rage explodes in a shockwave. Cooldown '+ASSAULT_CD+'s.'
    : 'Fills Rage on use &middot; Duration: '+fmtNum(ASSAULT_BASE_DUR+ASSAULT_RANK_STEP*(r-1))+'s &middot; +'+fmtNum(assaultKillExtend(r))+'s and -'+ASSAULT_KILL_CDR+'s cooldown per kill &middot; Ends in a Rage Burst',
  squire:(r)=> r===0 ? 'Summons a squire to fight beside you (2nd at Rank 3, 3rd at Rank 5). Each rank: +15% follower damage and +10% follower life. Your followers hit x'+TEMPLAR_FOLLOWER_BASE+' harder.'
    : squireFollowerCount(r)+' follower'+(squireFollowerCount(r)===1?'':'s')+' &middot; Follower damage: +'+Math.round(COMMANDER_DMG_PER_RANK*r*100)+'% (Commander bonus x'+TEMPLAR_FOLLOWER_BASE+') &middot; Follower life: '+knightLifeAtRank(game.player,r)+' each &middot; Re-summon: '+fmtNum(followerRespawnTime(game.player,'knight',r))+'s',
  smite:(r)=> r===0 ? 'Active (Main attack): a bolt of holy light flies up to '+SMITE_RANGE+' and strikes the first foe in its path, healing followers it passes through. Damage is 85% of a normal hit, rising to 138% at Rank 10. Every '+WRATH_EVERY+'rd cast is Wrath: a wider, stronger bolt that also bursts in a small area on impact, with a bigger heal. Builds Conviction (Rage).'
    : 'Damage '+Math.round(smiteRankMult(r)*100)+'% &middot; Heals followers '+Math.round(SMITE_HEAL*(1+0.1*(r-1))*100)+'% (Wrath '+Math.round(WRATH_HEAL*(1+0.1*(r-1))*100)+'%) &middot; Wrath x'+WRATH_MULT+' damage &middot; Conviction +'+SMITE_CONV+' (Wrath +'+WRATH_CONV+')',
  vengeance:(r)=> r===0 ? 'Active: a melee cone of holy fire (half fire, half physical). Your followers deal more damage and crit more for '+VENG_BUFF_DUR+'s. Attacks as fast as Strike, no cooldown. Builds Conviction (Rage). While your bar is over '+Math.round(VENG_OVERFLOW_AT*100)+'% full it burns '+VENG_OVERFLOW_COST+' Conviction to deal +'+Math.round(VENG_OVERFLOW_DMG*100)+'% damage.'
    : 'Damage +'+Math.round((skillMult(r)-1)*100)+'% &middot; Followers +'+Math.round((VENG_FDMG+VENG_FDMG_STEP*(r-1))*100)+'% damage, +'+(VENG_FCRIT+VENG_FCRIT_STEP*(r-1))+'% crit for '+VENG_BUFF_DUR+'s &middot; Conviction +'+VENG_CONV+' per foe &middot; Strike speed, no cooldown &middot; Over '+Math.round(VENG_OVERFLOW_AT*100)+'% Conviction: spends '+VENG_OVERFLOW_COST+' for +'+Math.round(VENG_OVERFLOW_DMG*100)+'% damage',
  banner:(r)=> r===0 ? 'Active: plant a <b>Battle Standard</b> for '+BANNER_DUR+'s. You and your followers standing in it get its bonus. Standards alternate with every cast, and a new one replaces the last:<br>&bull; <b>War</b> (red): +10% damage and +5% crit chance.<br>&bull; <b>Aegis</b> (blue): +5% Defence, 5% less damage taken and 1% max life regenerated per second.<br>Gives '+BANNER_CONV+' Conviction. Cooldown '+BANNER_CD+'s. Each rank: +2s duration, War +2% damage and +1% crit, Aegis +5% Defence and +0.2% life regen. Standard of War and Standard of Aegis strengthen each type further.'
    : (()=>{ const sk = Object.assign({}, (game.player&&game.player.skills)||{}, {banner:r}), bp = {skills:sk}; return 'Lasts '+bannerDur(r)+'s &middot; War: +'+Math.round(bannerWarDmg(bp)*100)+'% damage, +'+bannerWarCrit(bp)+'% crit &middot; Aegis: +'+bannerAegisDef(bp)+'% Defence, -'+Math.round(bannerAegisDr(bp)*100)+'% damage taken, +'+(bannerAegisRegen(bp)*100).toFixed(1)+'% life/s &middot; Next: '+(((game.player&&game.player.bannerNext)||'war')==='war'?'War':'Aegis')+' &middot; Cooldown '+BANNER_CD+'s'; })(),
  bannerWar:(r)=> r===0 ? 'Passive: strengthens the <b>War</b> half of your Battle Standard, which gives you and your followers +10% damage, +5% crit chance and +6% Rage/Conviction gain. Each rank: +3% damage, +2% crit and +1% Rage gain.'
    : 'War standard: +'+Math.round(bannerWarDmg({skills:{bannerWar:r}})*100)+'% damage, +'+bannerWarCrit({skills:{bannerWar:r}})+'% crit, +'+Math.round(bannerWarRage({skills:{bannerWar:r}})*100)+'% Rage/Conviction gain',
  bannerAegis:(r)=> r===0 ? 'Passive: strengthens the <b>Aegis</b> half of your Battle Standard, which gives you and your followers 5% less damage taken (on top of its Defence and life regeneration). Each rank: +1% reduction and +0.3% regeneration.'
    : 'Aegis standard: '+Math.round(bannerAegisDr({skills:{bannerAegis:r}})*100)+'% less damage taken, +'+(bannerAegisRegen({skills:{bannerAegis:r}})*100).toFixed(1)+'% life per second',
  consecrate:(r)=> r===0 ? 'Active: sanctify the ground for '+CONS_DUR+'s. Enemies in it burn (half fire, half physical). You regenerate and gain Conviction while standing in it, and followers in it deal +20% damage. Costs '+CONS_COST+' Conviction. Cooldown '+CONS_CD+'s.'
    : 'Lasts '+fmtNum(CONS_DUR+0.5*(r-1))+'s &middot; Damage +'+Math.round((skillMult(r)-1)*100)+'% &middot; Followers +'+Math.round((0.2+0.04*(r-1))*100)+'% damage &middot; Cooldown '+CONS_CD+'s',
  judgment:(r)=> r===0 ? 'Capstone: spends '+JUDG_COST+' Conviction to mark up to 4 enemies; after a short warning, pillars of holy fire crash down on each (half fire, half physical) and stun them, and blind survivors for '+JUDG_BLIND_DUR+'s (half their attacks miss). Damage x2 at Rank 1 rising to x3 at Rank 10. Cooldown '+JUDG_CD+'s. Each rank: more damage and more pillars.'
    : (3+Math.ceil(r/2))+' pillars &middot; Damage x'+fmtNum(judgmentMult(r))+' &middot; Blinds '+JUDG_BLIND_DUR+'s &middot; Costs '+JUDG_COST+' Conviction &middot; Cooldown '+JUDG_CD+'s',
};
const RV267_TEXT = {
  cripplingShot:(r)=> r===0 ? 'Active: fire a barbed arrow that hits hard and leaves a bleeding wound. Its Stamina cost rises with rank; '+CRIPPLING_SHOT_CD+'s cooldown.' : 'Dmg x'+fmtNum(swd('cripplingShot',r))+' weapon damage &middot; Bleed '+Math.round(cripplingShotBleedPct(r)*100)+'%/s for '+CRIPPLING_SHOT_BLEED_DUR+'s &middot; Cooldown '+CRIPPLING_SHOT_CD+'s &middot; Costs '+stCost('cripplingShot',r),
  stunShot:(r)=> r===0 ? 'Active: a heavy arrow that hits hard with a chance to stun. Its Stamina cost rises with rank; '+STUN_SHOT_CD+'s cooldown. Stun chance rises each rank (up to '+Math.round(stunShotStunChance(10)*100)+'% at Rank 10).' : 'Dmg x'+fmtNum(swd('stunShot',r))+' weapon damage &middot; '+Math.round(stunShotStunChance(r)*100)+'% chance to stun for '+fmtNum(stunShotStunDuration(r))+'s &middot; Cooldown '+STUN_SHOT_CD+'s &middot; Costs '+stCost('stunShot',r),
  aimedShot:(r)=> r===0 ? 'Capstone (requires Deadeye). Press and HOLD to aim a full-draw shot for '+aimedShotMult(1,true)+'x damage (up to '+aimedShotMult(10,true)+'x at Rank 10) with +'+AIMED_SHOT_CRIT_BONUS+'% crit chance, piercing '+aimedShotPierce(1)+' enemies. A quick tap fires a '+AIMED_TAP_MULT+'x snap shot instead. Its Stamina cost rises with rank; '+AIMED_SHOT_CD+'s cooldown.' : 'Held: '+fmtNum(aimedShotMult(r,true))+'x &middot; Tap: '+AIMED_TAP_MULT+'x &middot; Pierces '+aimedShotPierce(r)+' enemies (-'+Math.round((1-AIMED_SHOT_FALLOFF)*100)+'% per enemy, held shot only) &middot; +'+AIMED_SHOT_CRIT_BONUS+'% crit (held) &middot; Cooldown '+AIMED_SHOT_CD+'s &middot; Costs '+stCost('aimedShot',r),
  packTactics:(r)=> r===0 ? 'Active (requires Summon Wolf): your wolves and bear leap from where they stand onto your target in a short arc, then land a bonus attack that also slashes nearby enemies.' : 'Landing hit: +'+Math.round((packTacticsDmgMult(r)-1)*100)+'% dmg &middot; Charge '+AMBUSH_LEAP_T+'s &middot; Cooldown '+fmtNum(packTacticsCooldown(r))+'s',
  recall:(r)=> r===0 ? 'Active: your companions dash back to your side with a short shield, and you gain a damage boost, life regeneration and a small shield for a few seconds.' : 'Companions dash to you with a shield ('+Math.round(recallShieldPct(r)*100)+'% of their life) &middot; You: +'+Math.round(recallDmgBonus(r)*100)+'% dmg, '+Math.round(recallRegenPct(r)*100)+'%/s life regen and a '+Math.round(recallPlayerShieldPct(r)*100)+'% life shield for '+RECALL_BUFF_DUR+'s &middot; Cooldown '+RECALL_CD+'s',
  survivalFieldDress:(r)=> r===0 ? 'Passive: every dodge heals '+Math.round(SFD_DODGE_PCT_BASE*1000)/10+'% of your max life over '+SFD_DODGE_DUR+'s (more each rank). Active: slap on a field bandage to heal '+Math.round(survFieldDressRegenRate(1)*100*SURV_FIELD_DRESS_DUR)+'% of max life over '+SURV_FIELD_DRESS_DUR+'s while you keep moving, cleansing slows and ailments; companions heal for half.' : 'Dodge: heal '+Math.round(sfdDodgePct(r)*1000)/10+'% max life over '+SFD_DODGE_DUR+'s &middot; Bandage: '+Math.round(survFieldDressRegenRate(r)*100)+'%/s for '+SURV_FIELD_DRESS_DUR+'s ('+Math.round(survFieldDressRegenRate(r)*100*SURV_FIELD_DRESS_DUR)+'% total), cleanses slows &amp; ailments, companions heal half &middot; Cooldown '+fmtNum(survFieldDressCooldown(r))+'s',
  markedPrey:(r)=> r===0 ? 'Passive: marked enemies take +6% more damage per rank from you and your pets, and killing a marked enemy resets Hunter\'s Mark. At Rank 5 the Mark also jumps to the nearest enemy when its target dies.' : 'Marked enemies: +'+Math.round(MARKED_PREY_PER_RANK*r*100)+'% more damage &middot; Killing a marked enemy resets Hunter\'s Mark'+(r>=BASE_MAX_RANK ? ' &middot; The Mark jumps to a nearby enemy when its target dies' : ' &middot; Rank 5: the Mark jumps to a nearby enemy'),
  companionWolf:(r)=> r===0 ? 'Passive: a wolf fights at your side; its slashing attacks cut several enemies and cause Bleed. Respawns 5s after falling. A second wolf joins at Rank 5, and at max rank wolves deal +10% damage.' : (r>=5?'2 wolves':'1 wolf')+' beside you &middot; Dmg/HP: +'+Math.round((hunterFollowerStatMult(r)-1)*100)+'% (HP -10% base) &middot; Life leech '+Math.round(wolfLeechPct(r)*100)+'% (heals the wolf) &middot; Slash hits up to 3 enemies'+(r>=BASE_MAX_RANK ? ' &middot; +10% damage at max rank' : '')+' &middot; Respawns '+fmtNum(followerRespawnTime(game.player,'wolf',r))+'s after falling',
  companionBear:(r)=> r===0 ? 'Passive: a bear joins you. Its swipes cut up to 4 enemies at once. At max rank it deals +10% damage.' : 'Bear companion &middot; Dmg/HP: +'+Math.round((hunterFollowerStatMult(r)-1)*100)+'% (HP -10% base) &middot; Swipe hits up to 4 enemies'+(r>=BASE_MAX_RANK ? ' &middot; +10% damage at max rank' : ''),
};
const RV268_TEXT = {
  deathBolt:(r)=> r===0 ? 'Active, Main attack: a dark bolt that bounces between enemies ('+deathBoltBounces(1)+' bounces, more with rank), losing '+Math.round((1-DEATHBOLT_BOUNCE_MULT)*100)+'% damage each bounce. At 50% life or below it deals +'+Math.round((DEATHBOLT_LOW_MULT-1)*100)+'% damage and steals '+Math.round(DEATHBOLT_LIFESTEAL*100)+'% of it as life. Does not make souls. Assign it to Main/1/2/3.' : 'Damage x'+fmtNum(skillMult(r))+' &middot; '+deathBoltBounces(r)+' bounces (-'+Math.round((1-DEATHBOLT_BOUNCE_MULT)*100)+'% each) &middot; At 50% life or below: +'+Math.round((DEATHBOLT_LOW_MULT-1)*100)+'% damage and '+Math.round(DEATHBOLT_LIFESTEAL*100)+'% life steal',
  raiseDead:(r)=> r===0 ? 'Passive: raise skeletons that fight for you. They are fragile and die quickly, but a fallen skeleton rises again after '+fmtNum(necroSkeletonRespawn(1))+'s (down to '+fmtNum(necroSkeletonRespawn(5))+'s at rank 5 and '+fmtNum(necroSkeletonRespawn(10))+'s at rank 10). The souls you hold make them hit harder, up to +'+Math.round(NECRO_SKEL_SOUL_DMG*100)+'% at '+SOUL_CAP+' souls. Each rank adds damage, life and more skeletons (up to '+necroSkeletonCount(5)+').' : necroSkeletonCount(r)+' skeletons &middot; Dmg/HP: +'+Math.round((hunterFollowerStatMult(r)-1)*100)+'% &middot; Respawn: '+fmtNum(necroSkeletonRespawn(r))+'s &middot; +'+Math.round(NECRO_SKEL_SOUL_DMG*100)+'% damage at '+SOUL_CAP+' souls held (scales with souls)'+(r>=BASE_MAX_RANK ? ' &middot; +10% damage at max rank' : ''),
  soulSap:(r)=> r===0 ? 'Active, Main attack: drains the nearest enemy on screen. A 2nd enemy standing close to it is drained too at Rank 3 and a 3rd at Rank 5 (the main target takes full damage, the others half). You gain a soul only when an enemy it hit dies (up to '+SOUL_CAP+' held, see the counter top-right). Assign it to Main/1/2/3.' : 'Damage: x'+fmtNum(skillMult(r))+' on the nearest'+(soulSapTargets(r)>1 ? ', half on '+(soulSapTargets(r)-1)+' more' : '')+' &middot; Hits '+soulSapTargets(r)+' target'+(soulSapTargets(r)>1?'s':'')+' &middot; +'+SOUL_SAP_SOULS_PER_KILL+' soul when a drained enemy dies (cap '+SOUL_CAP+')',
  soulHunger:(r)=> r===0 ? 'Passive: while above 50% life you burn '+(SOUL_HUNGER_HP_PCT*100)+'% max life per soul to make souls, stopping at 50%. You cannot regenerate above 50% life. Every 2 souls held gives +1% damage (up to +25% at '+SOUL_CAP+'). Each rank makes souls come faster.' : 'A soul every '+fmtNum(soulHungerInterval(r))+'s while above 50% life (costs '+(SOUL_HUNGER_HP_PCT*100)+'% max life each) &middot; +1% damage per 2 souls held',
  soulGate:(r)=> r===0 ? 'Active: open a gate for '+soulGateDuration(1)+'s that sends out weak skeletal archers, each costing '+SOULGATE_SOULS_PER_ARCHER+' souls as it comes out (nothing is spent while the archer limit is reached). Needs '+SOULGATE_COST+' souls and mana to open. Cooldown '+soulGateCooldown(1)+'s, shorter with rank.' : 'Open for '+soulGateDuration(r)+'s &middot; '+SOULGATE_SOULS_PER_ARCHER+' souls per archer &middot; An archer every '+fmtNum(soulGateInterval(r))+'s (each lasts '+SOULGATE_ARCHER_LIFE+'s) &middot; Archer damage x'+fmtNum(skillMult(r))+' &middot; Cooldown '+soulGateCooldown(r)+'s (after it closes)',
  soulShield:(r)=> r===0 ? 'Passive: the souls you hold harden you, adding Defence so enemy blows miss more often. No souls are spent. Each rank adds more per soul.' : '+'+fmtNum(soulShieldPerSoul(r)*100)+'% of an equal-level enemy\u2019s attack rating as Defence per soul held (up to +'+Math.round(soulShieldPerSoul(r)*SOUL_CAP*100)+'% at '+SOUL_CAP+' souls) &middot; Costs no souls',
  soulFire:(r)=> r===0 ? 'Active: burst your souls outward, damaging and slowing every enemy around you. Costs '+SOULFIRE_SOUL_COST+' souls, or '+SOULFIRE_MANA_COST+' mana if you hold fewer. Each rank adds damage.' : 'Damage ~'+Math.round(soulFireDmg(game&&game.player?game.player:{level:1},r))+' &middot; Radius '+SOULFIRE_RADIUS+' &middot; Slows '+fmtNum(SOULFIRE_CHILL)+'s &middot; Cooldown '+SOULFIRE_CD+'s &middot; Costs '+SOULFIRE_SOUL_COST+' souls, or '+SOULFIRE_MANA_COST+' mana',
  fear:(r)=> r===0 ? 'Active: make every enemy around you flee in terror, and they take extra damage while afraid. Costs mana.' : 'Fear duration: '+fmtNum(fearDuration(r))+'s &middot; Feared enemies take +'+fmtNum(fearVulnPct(r))+'% damage &middot; Radius '+FEAR_RADIUS+' &middot; Cooldown '+fmtNum(fearCooldown(r))+'s &middot; Costs '+FEAR_SOUL_COST+' souls',
  sacrifice:(r)=> r===0 ? 'Passive: when one of your skeletons dies it bursts in poison, burning up to '+(1+Math.floor(1/2))+' soul(s) for a bigger blast. The poison is applied to whoever the burst hits, and nothing is left on the ground.' : 'Burst dmg ~'+Math.round((SACRIFICE_BASE_DMG)*skillMult(r))+' (+50% per soul burned, up to '+(1+Math.floor(r/2))+' souls) &middot; Radius '+SACRIFICE_RADIUS+' &middot; Poisons what it hits',
  demonBind:(r)=> r===0 ? 'Passive: collecting '+DEMON_BIND_SOUL_THRESHOLD+' souls binds a demon that leeches life. It grows 4% and hits 10% harder for every 10 souls you hold. Its leech heals you and itself.' : 'Summons at '+DEMON_BIND_SOUL_THRESHOLD+' souls &middot; Life leech '+Math.round(necroDemonLeechPct(r)*100)+'% &middot; +5% size and +10% damage per 10 souls held &middot; Leeches life to you and itself'+(r>=BASE_MAX_RANK ? ' &middot; +10% damage at max rank' : ''),
  plague:(r)=> r===0 ? 'Capstone (requires Sacrifice OR Demon Bind). Corrupt the ground with a large poison zone for '+fmtNum(PLAGUE_DUR_BASE)+'s. Costs mana, no souls. Cooldown starts when it ends.' : 'Tick dmg ~'+Math.round(10*skillMult(r)*PLAGUE_DMG_BUFF)+' (every '+PLAGUE_TICK_INTERVAL+'s, base, scales with level) &middot; Radius '+PLAGUE_RADIUS+' &middot; Duration '+fmtNum(PLAGUE_DUR_BASE)+'s &middot; Cooldown '+PLAGUE_CD+'s',
};
const _pc = (v)=>Math.round(v*100)+'%';
const RV269_TEXT = {
  fireball:(r)=> r===0 ? 'Active, Main attack: fast fire balls that sometimes set the target alight. Casts quickly and never roots you. A 2nd ball unlocks at rank 3 and a 3rd at rank 5, fired in a spaced left/right volley. Restores mana per hit.' : 'Balls per cast: '+fireballCount(r)+' &middot; each ball '+_pc(FIREBALL_BALL_MULT)+' of a full hit, '+Math.round((0.25+0.075*Math.max(1,r))*100)+'% Burn chance (lower vs elites and bosses) &middot; fires '+_pc(1-FIREBALL_ATKCD_MULT)+' faster than Strike. Assign it to Main/1/2/3.',
  iceBolt:(r)=> r===0 ? 'Active, Main attack: a big, slow, heavy bolt of ice. It chills; '+FREEZE_HITS_NORMAL+' cold hits in a row FREEZE a regular enemy for a moment ('+FREEZE_HITS_TOUGH+' for brutes and elites, shorter freeze, bosses are only chilled). Assign it to Main/1/2/3.' : 'Heavy bolt: about '+fmtNum(ICE_BOLT_DMG_MULT)+'x a normal hit, but slower to cast &middot; '+FREEZE_HITS_NORMAL+' hits freeze regular enemies, '+FREEZE_HITS_TOUGH+' freeze brutes/elites. Each rank adds damage.',
  elementalPolarity:(r)=> r===0 ? 'Passive: if your next damaging spell is the OPPOSITE element of your last one (fire after ice, ice after fire), it deals +'+Math.round(polarityBonus(1)*100)+'% damage (up to +'+Math.round(polarityBonus(10)*100)+'% at rank 10).' : 'Opposite-element spell bonus: +'+Math.round(polarityBonus(r)*100)+'% damage.',
  immolate:(r)=> r===0 ? 'Active: set yourself on fire. You deal +'+Math.round(immolateBoost(1)*100)+'% more damage (+'+Math.round(immolateBoost(5)*100)+'% at rank 5, +'+Math.round(immolateBoost(10)*100)+'% at rank 10) and your Fireballs explode on impact, but you burn for '+fmtNum(IMMOLATE_SELF_PCT*100)+'% of your max life per second (reduced by fire resistance; your Ice Armor soaks it first; never kills you). It burns until you press it again or fall to '+Math.round(IMMOLATE_MIN_HP*100)+'% life.' : 'No duration limit &middot; +'+Math.round(immolateBoost(r)*100)+'% damage dealt &middot; Ends at '+Math.round(IMMOLATE_MIN_HP*100)+'% life &middot; Fireballs explode for '+Math.round(IMMOLATE_EXPLODE_PCT*100)+'% damage around the target &middot; Self-burn '+Math.round(IMMOLATE_SELF_PCT*100)+'% max life/s &middot; Cooldown '+IMMOLATE_CD+'s',
  flameVortex:(r)=> r===0 ? 'Active: a spiralling ring of fire that follows you, burns everything inside it. When it ends it EXPLODES, hurting enemies and you ('+Math.round(FLAME_VORTEX_SELF_PCT*100)+'% max life, cut by fire resistance). Bosses are not pulled.' : 'Lasts '+fmtNum(flameVortexDur(r))+'s &middot; radius '+FLAME_VORTEX_R+' &middot; explosion '+FLAME_VORTEX_BLAST_MULT+'x a tick &middot; self-damage '+Math.round(FLAME_VORTEX_SELF_PCT*100)+'% max life &middot; Cooldown '+FLAME_VORTEX_CD+'s',
  permafrost:(r)=> r===0 ? 'Active: freeze a large patch of ground. Enemies inside are slowed 25% (50% at rank 10) and take +20% cold damage (+50% at rank 10). Chilled or frozen enemies that die inside shatter, hurting enemies around them. Standing inside, you move 10% faster and your Ice Bolt casts '+Math.round((PERMAFROST_ICEBOLT_SPEED-1)*100)+'% faster. Cooldown 12s, down to 8s at rank 10.' : 'Lasts '+permafrostDur(r)+'s &middot; radius '+PERMAFROST_R+' &middot; enemies -'+Math.round(permafrostSlowPct(r)*100)+'% speed, +'+Math.round(permafrostColdAmp(r)*100)+'% cold damage taken &middot; chilled/frozen kills shatter &middot; you +10% speed, Ice Bolt '+Math.round((PERMAFROST_ICEBOLT_SPEED-1)*100)+'% faster &middot; Cooldown '+fmtNum(permafrostCd(r))+'s',
  iceArmor:(r)=> r===0 ? 'Put Ice Armor on a skill button to use it. While it is there, it reserves 25% of your mana to keep a barrier of ice around you that soaks incoming damage. The barrier holds 25% of your max life (50% at Rank 10) and refills on its own once you go 5 seconds without being hit (3 seconds at Rank 10). Press the ICE ARMOR button to explode it: a cold blast around you that deals the barrier you are holding as damage and FREEZES nearby enemies (bosses are only chilled), then the barrier recharges.' : 'Barrier: '+Math.round(iceArmorScale(r)*100)+'% of your max life ('+iceArmorBarrierMax((game&&game.player)||{maxHp:0}, r)+') &middot; Recharges after '+fmtNum(iceArmorRecharge(r))+'s without being hit &middot; Explosion: the barrier you hold, as cold damage; freezes nearby enemies &middot; Reserves 25% mana',
  pyroTorrent:(r)=> r===0 ? 'Channel a torrent of fire that pierces every enemy in its path, burning them. Costs mana per second. Keeps going until you press it again, run out of mana or dodge; no cooldown. You can walk while channelling, 40% slower.' : 'Channels until stopped &middot; hits every enemy along the beam &middot; ramps up to double damage over '+PYRO_RAMP_TIME+'s &middot; no cooldown',
  blizzard:(r)=> r===0 ? 'Capstone (requires Permafrost). Call down a blizzard of ice shards on a large area. Chills everything inside and counts toward freezing. +30% damage.' : 'Ice shards for '+BLIZZARD_DUR+'s over a radius of '+BLIZZARD_RADIUS+' &middot; damage +30% &middot; chills, freezes after repeated hits',
  nova:(r)=> r===0 ? 'Active: a ring of lightning bursts from you. Adds a Charge and shoves non-boss enemies back a little.' : 'Damage 180% of a basic nova (+'+Math.round((skillMult(r)-1)*100)+'%) &middot; +1 Charge &middot; knocks regular enemies back (bosses and heavy enemies stay put) &middot; Radius '+NOVA_RADIUS+' &middot; Cooldown '+NOVA_CD+'s',
  tornado:(r)=> r===0 ? 'Active: hurl a big, slow, piercing tornado at your enemy. It hits every enemy inside it 3 times per second for as long as they stay in it. Each rank adds damage.' : 'Hit damage x'+fmtNum(skillMult(r))+' &middot; 3 hits per second on each enemy inside &middot; Pierces &middot; Cooldown '+fmtNum(tornadoCdForRank(r))+'s',
  thunderstep:(r)=> r===0 ? 'Passive: your dodge crackles with lightning. A small electric charge goes off where your dodge starts and where it ends, and your mana regenerates 30% faster (65% at Rank 10) for 3s. Uses your normal dodge cooldown.' : 'Charge (radius '+THUNDERSTEP_R+') at both ends of your dodge &middot; +'+Math.round(thunderstepRegenBonus(r)*100)+'% mana regeneration for 3s',
};
const RV454_TEXT = {
  splinterShot:(r)=> r===0 ? 'Basic shot (free, refills '+STAMINA_ON_SHOT+' Stamina): one arrow that splits into '+SPLINTER_SPLITS+' arrows on impact, flying at up to '+SPLINTER_SPLITS+' other enemies nearby for '+Math.round(SPLINTER_SPLIT_PCT*100)+'% of the hit. '+Math.round(SPLINTER_BLEED*100)+'% chance to cause Bleed. Fires at your Strike speed. Each rank: more damage.'
    : 'Damage x'+fmtNum(skillMult(r))+' &middot; Splits into '+SPLINTER_SPLITS+' arrows for '+Math.round(splinterSplitPct((game&&game.player)||{})*100)+'% of the hit &middot; Bleed chance '+Math.round(splinterBleedChance((game&&game.player)||{})*100)+'% &middot; Free, refills '+STAMINA_ON_SHOT+' Stamina',
  splinteredWounds:(r)=> r===0 ? 'Passive: Splinter Shot gets +4% Bleed chance per rank (up to 50%), and its split arrows deal +3% more of the main hit per rank (70% up to 100% at Rank 10).'
    : 'Splinter Shot Bleed chance: '+Math.round(Math.min(0.6, SPLINTER_BLEED+0.04*r)*100)+'% &middot; Split arrows: '+Math.round((SPLINTER_SPLIT_PCT+0.03*Math.min(10,r))*100)+'% of the main hit',
  favouredFoe:(r)=> r===0 ? 'Passive: the final arrow of Rapid Shot has a '+Math.round(favouredFoePierce(1)*100)+'% chance to pierce through every enemy in its path (up to '+Math.round(favouredFoePierce(10)*100)+'% at Rank 10), and you gain +5% Critical Chance with a bow (up to +25%).'
    : 'Final Rapid Shot arrow pierces: '+Math.round(favouredFoePierce(r)*100)+'% chance &middot; +'+fmtNum(tblAt(ARROW_EYE_CRIT_PCT, r))+'% Crit Chance (bow only)',
  steadyBreathing:(r)=> r===0 ? 'Passive: steady breathing keeps your strength up. Your Ranger skills cost 5% less Stamina per rank and Stamina regenerates 3% faster per rank.'
    : 'Stamina costs -'+(5*Math.min(10,r))+'% &middot; Stamina regeneration +'+(3*r)+'%',
  deadeye:(r)=> r===0 ? 'Passive: critical hits deal +8% more damage per rank and restore 1% of your max Stamina per rank. Your arrows also deal +5% damage per rank to targets farther than '+LONGSHOT_DIST+' away.'
    : 'Crit damage +'+Math.round(DEADEYE_CRITMULT_PER_RANK*r*100)+'% &middot; Each crit restores '+r+'% max Stamina &middot; +'+Math.round(LONGSHOT_PER_RANK*r*100)+'% arrow damage against distant targets (over '+LONGSHOT_DIST+')',
  rainOfArrows:(r)=> r===0 ? 'Capstone (requires Deadeye). Loose an arrow into the sky; half a second later it shatters and rains down arrows on an area. Each rank increases damage. '+RAIN_OF_ARROWS_CD+' second cooldown.'
    : 'Dmg ~'+Math.round(RAIN_OF_ARROWS_BASE_DMG*skillMult(r))+' (base, scales with level/gear) total over 3 volleys &middot; Radius '+RAIN_OF_ARROWS_RADIUS+' &middot; Cooldown '+RAIN_OF_ARROWS_CD+'s (fixed)',
  trapMastery:(r)=> r===0 ? 'Passive: Poison and Explosive Traps deal +8% damage per rank, all traps have +6% radius per rank, and you throw traps '+Math.round(TRAP_MASTERY_THROW*100)+'% faster per rank.'
    : 'Trap damage +'+Math.round(TRAP_MASTERY_DMG*r*100)+'% &middot; Radius +'+Math.round(TRAP_MASTERY_RADIUS*r*100)+'% &middot; Time between throws '+fmtNum(Math.round(TRAP_GCD*(1-TRAP_MASTERY_THROW*Math.min(10,r))*100)/100)+'s (base '+TRAP_GCD+'s)',
  mirage:(r)=> r===0 ? 'Passive: when you dodge, a mirage of you stays where you started. Nearby enemies (not bosses) attack it instead of you until it fades after '+mirageDur(1)+'s ('+mirageDur(10)+'s at Rank 10). Once every '+mirageCd(1)+'s ('+mirageCd(10)+'s at Rank 10).'
    : 'Mirage lasts '+fmtNum(Math.round(mirageDur(r)*10)/10)+'s &middot; Once every '+fmtNum(Math.round(mirageCd(r)*10)/10)+'s',
  sacredWeapon:(r)=> r===0 ? 'Passive: after 3 normal Vengeance attacks, your next Vengeance spends '+SACRED_COST+' Conviction to be empowered: +'+Math.round(sacredBonus(1)*100)+'% damage (up to +'+Math.round(sacredBonus(10)*100)+'% at Rank 10) and it sets every enemy it hits burning ('+Math.round(SACRED_BURN_PCT*SACRED_BURN_DUR*100)+'% of the hit over '+SACRED_BURN_DUR+'s).'
    : 'Every 4th Vengeance ('+SACRED_COST+' Conviction): +'+Math.round(sacredBonus(r)*100)+'% damage and burns all enemies hit ('+Math.round(SACRED_BURN_PCT*SACRED_BURN_DUR*100)+'% of the hit over '+SACRED_BURN_DUR+'s)',
  auraOfRetribution:(r)=> r===0 ? 'Passive: enemies that hit you take '+Math.round(retributionPct(1)*100)+'% of the damage they dealt (up to '+Math.round(retributionPct(10)*100)+'% at Rank 10).'
    : 'Attackers take '+Math.round(retributionPct(r)*100)+'% of the damage they deal to you',
  explosiveShot:(r)=> r===0 ? 'Active: a heavy fiery arrow that explodes on impact, dealing fire damage to everything in a small area and setting them burning for '+expShotBurnDur(1)+'s. Its Stamina cost rises with rank; '+EXPLOSIVE_SHOT_CD+'s cooldown. Each rank: more damage and a longer burn.'
    : 'Damage x'+fmtNum(skillMult(r))+' &middot; Explosion: '+Math.round(EXPSHOT_BLAST*100)+'% of the hit as fire, radius '+EXPSHOT_R+' &middot; Burns '+fmtNum(Math.round(expShotBurnDur(r)*100)/100)+'s &middot; Cooldown '+EXPLOSIVE_SHOT_CD+'s &middot; Costs '+stCost('explosiveShot',r),
  beastFury:(r)=> r===0 ? 'Active (requires Hunter\'s Bond): for '+BEAST_FURY_DUR+'s your companions deal +50% damage and attack 25% faster, and you deal +15% damage. Your bear roars, forcing nearby enemies to attack it for '+bearRoarDur(1)+'s, and your wolves\' bleeds hit 50% harder. '+BEAST_FURY_CD+'s cooldown.'
    : 'Duration '+(BEAST_FURY_DUR+r-1)+'s &middot; Companions +50% damage, 25% faster attacks &middot; You +15% damage &middot; Bear roar taunts for '+fmtNum(bearRoarDur(r))+'s &middot; Wolf bleed +'+Math.round((1.5+0.05*(Math.min(10,r)-1)-1)*100)+'% &middot; Cooldown '+BEAST_FURY_CD+'s',
};
const V459_TEXT = {
  elementalMastery:(r)=> r===0 ? 'Passive: your fire and cold damage is '+Math.round(elemMasteryDmgAt(1)*100)+'% stronger and ignores '+Math.round(elemMasteryPenAt(1)*100)+'% of enemy fire and cold resistance. Each rank: +3% damage and +1% resistance pierced. Rank '+EM_BLAST_RANK+': Fireball and Ice Bolt explode on hit, dealing '+Math.round(emBlastPct(EM_BLAST_RANK)*100)+'% of the hit to enemies around the target (fire burns, ice chills).'
    : 'Fire and cold damage +'+Math.round(elemMasteryDmgAt(r)*100)+'% &middot; Pierces '+Math.round(elemMasteryPenAt(r)*100)+'% of enemy fire and cold resistance &middot; '+(r>=EM_BLAST_RANK ? 'Fireball / Ice Bolt explode on hit for '+Math.round(emBlastPct(r)*100)+'% damage nearby' : 'Rank '+EM_BLAST_RANK+': Fireball / Ice Bolt explode on hit for '+Math.round(emBlastPct(EM_BLAST_RANK)*100)+'% damage nearby'),
  staticBuildup:(r)=> r===0 ? 'Passive: every lightning hit builds a Static stack (up to '+STATIC_MAX+'; sparks circle you). Each stack gives Lightning Arc +'+Math.round(staticArcPerStack(1)*1000)/10+'% damage, and at full stacks your next Lightning Arc, Nova, Tornado or Stormcall releases the bar: it is empowered for x'+staticEmpowerMult(1).toFixed(2)+' damage and Charges what it hits -- an empowered Arc also chains to '+staticArcChains(1)+' more enemy (2 at rank 5), and Nova, Tornado and Stormcall grow 30% bigger. Enemies the release hits are briefly stunned ('+STATIC_STUN_DUR+'s; not bosses). Each rank adds damage.'
    : 'Stacks: '+STATIC_MAX+' &middot; Lightning Arc +'+Math.round(staticArcPerStack(r)*1000)/10+'% damage per stack (+'+Math.round(staticArcPerStack(r)*STATIC_MAX*100)+'% full), +'+staticArcChains(r)+' chain'+(staticArcChains(r)>1?'s':'')+' on release'+(r<5?' (2 at rank 5)':'')+' &middot; Full bar is released by your next Arc / Nova / Tornado / Stormcall: x'+staticEmpowerMult(r).toFixed(2)+' damage, Charges and stuns ('+STATIC_STUN_DUR+'s) every target (Arc: extra chains; others: +30% size)',
  stormcall:(r)=> r===0 ? 'Active: mark the thickest group of enemies in range; '+STORMCALL_DELAY+'s later lightning strikes the circle, damaging and Charging everything inside. A strike on an already Charged enemy chains on to more enemies nearby at half damage. Cooldown '+STORMCALL_CD+'s.'
    : 'Radius '+STORMCALL_R+' &middot; Strikes after '+STORMCALL_DELAY+'s &middot; Chains to '+(2+(r>=5?1:0)+(r>=10?1:0))+' more from Charged targets (50%) &middot; Cooldown '+STORMCALL_CD+'s',
  windrunner:(r)=> r===0 ? 'Passive: moving builds storm energy (dodges count extra). After '+windDistNeeded(1)+' paces your next Lightning Arc, Nova or Stormcall costs half the mana and deals +'+Math.round(windDmgBonus(1)*100)+'% damage. From rank 5, dodging through an enemy Charges it. Moving also builds mana regeneration: up to +'+(windRegenPct(1)*100).toFixed(1)+'% of your mana per second after 5s on the move (+'+Math.round(windRegenPct(10)*100)+'% at rank 10); stopping resets it.'
    : 'Energy after '+windDistNeeded(r)+' paces &middot; Next lightning spell: half cost, +'+Math.round(windDmgBonus(r)*100)+'% damage'+(r>=5 ? ' &middot; Dodging through enemies Charges them' : ' &middot; Rank 5: dodging through enemies Charges them') + ' &middot; Moving: up to +'+(windRegenPct(r)*100).toFixed(1)+'% mana/s (builds over 5s)',
  raiseDead:(r)=> r===0 ? 'Passive and active: raise skeletons that fight for you (more with rank, up to '+necroSkeletonCount(5)+'). A fallen skeleton stays down until you cast Raise Skeletons, unless you hold a soul: then a soul is spent automatically to raise it again after a short delay. The souls you hold make them hit harder, up to +'+Math.round(NECRO_SKEL_SOUL_DMG*100)+'% at '+SOUL_CAP+' souls. Cooldown '+RAISE_DEAD_CD+'s.'
    : necroSkeletonCount(r)+' skeletons &middot; Dmg/HP: +'+Math.round((hunterFollowerStatMult(r)-1)*100)+'% &middot; With a soul held: raised again after '+fmtNum(Math.round(skelSoulRaiseDelay(r)*10)/10)+'s for 1 soul &middot; Cast to raise every fallen skeleton at once &middot; Cooldown '+RAISE_DEAD_CD+'s',
  meteor:(r)=> r===0 ? 'Capstone: call down a huge meteor on the thickest group of enemies in range. It lands after '+METEOR_DELAY+'s, crushing everything in a wide circle, and leaves the ground burning for '+METEOR_BURN_DUR+'s. Cooldown '+BLIZZARD_CD+'s.'
    : 'Lands after '+METEOR_DELAY+'s &middot; Radius '+METEOR_R+' &middot; Burning ground '+METEOR_BURN_DUR+'s &middot; Cooldown '+BLIZZARD_CD+'s',
  mirrorSteel:(r)=> r===0 ? 'Active (needs a shield): for '+fmtNum(mirrorDur(1))+'s every blow you take, melee or ranged, is reflected back at its source for its full damage. You heal for '+Math.round(MIRROR_HEAL*100)+'% of what you reflected. Costs '+RESOURCE_SKILLS.mirrorSteel.cost+' Rage. Cooldown '+fmtNum(mirrorCd(1))+'s.'
    : 'Duration '+fmtNum(mirrorDur(r))+'s &middot; Reflects 100% &middot; Heals '+Math.round(MIRROR_HEAL*100)+'% of reflected &middot; Costs '+resCost(null,'mirrorSteel')+' Rage &middot; Cooldown '+fmtNum(mirrorCd(r))+'s',
  seismicAnchor:(r)=> r===0 ? 'Active (needs a shield): after '+ANCHOR_DELAY+'s the ground tears open at your feet. Enemies within 6 metres are dragged to the epicentre, their casting is broken and they are slowed by '+Math.round(ANCHOR_SLOW*100)+'% (fading over '+ANCHOR_SLOW_DUR+'s). Costs '+RESOURCE_SKILLS.seismicAnchor.cost+' Rage. Cooldown '+fmtNum(anchorCd(1))+'s.'
    : 'Slow '+Math.round(ANCHOR_SLOW*100)+'% fading over '+ANCHOR_SLOW_DUR+'s (stacks) &middot; Pulls within 6 metres &middot; Costs '+resCost(null,'seismicAnchor')+' Rage &middot; Cooldown '+fmtNum(anchorCd(r))+'s',
};
// v489 Necromancer redesign tooltips (checked before every older text table)
const V489_TEXT = {
  soulSap:(r)=> r===0 ? 'Active, Main attack: drains the nearest enemy on screen (a 2nd close to it at Rank 3, a 3rd at Rank 5; the main target takes full damage, the others half). Deals poison damage, so poison gear boosts it. Every Soul Sap attack that hits gives you '+SOUL_SAP_SOULS_PER_CAST+' soul, and an enemy it hit gives '+SOUL_SAP_SOULS_PER_KILL+' more when it dies (up to '+SOUL_CAP+' held).' : 'Poison damage: nearest full'+(soulSapTargets(r)>1 ? ', '+(soulSapTargets(r)-1)+' more at half' : '')+' &middot; Hits '+soulSapTargets(r)+' target'+(soulSapTargets(r)>1?'s':'')+' &middot; +'+SOUL_SAP_SOULS_PER_CAST+' soul per attack, +'+SOUL_SAP_SOULS_PER_KILL+' when a sapped enemy dies (cap '+SOUL_CAP+')',
  soulShield:(r)=> r===0 ? 'Passive: the souls you hold float at your feet as small white orbs and give you a chance to block hits: '+(soulShieldBlockPerSoul(1)*100).toFixed(1)+'% per soul held ('+(soulShieldBlockPerSoul(10)*100).toFixed(1)+'% at rank 10), up to 50%. No souls are spent.' : (soulShieldBlockPerSoul(r)*100).toFixed(2)+'% block per soul held (up to '+Math.round(Math.min(0.5,soulShieldBlockPerSoul(r)*SOUL_CAP)*100)+'% at '+SOUL_CAP+' souls) &middot; Costs no souls',
  raiseDead:(r)=> r===0 ? 'Active: raise skeletons that fight for you (more with rank, up to '+necroSkeletonCount(5)+'). Their damage and life grow with this skill\'s rank, and the souls you hold make them hit up to +'+Math.round(NECRO_SKEL_SOUL_DMG*100)+'% harder. A fallen skeleton rises again after 3s by using up 1 held soul; with no souls it stays down until you cast again. Casting again blows up the skeletons still standing (with Sacrifice) and raises a full fresh set. Costs '+RAISE_DEAD_MANA_PER_SKEL+' mana per skeleton, '+RAISE_DEAD_CD+'s cooldown.'
    : necroSkeletonCount(r)+' skeletons &middot; Damage and life +'+Math.round((hunterFollowerStatMult(r)-1)*100)+'% from rank &middot; Up to +'+Math.round(NECRO_SKEL_SOUL_DMG*100)+'% damage from souls held &middot; A fallen one rises after 3s for 1 soul &middot; Recast: explode and re-raise &middot; '+RAISE_DEAD_MANA_PER_SKEL+' mana per skeleton &middot; Cooldown '+RAISE_DEAD_CD+'s',
  sacrifice:(r)=> r===0 ? 'Passive: when one of your skeletons dies (or you recast Raise Skeletons) it bursts in poison. The blast deals '+Math.round(sacrificeLifePct(1)*100)+'% of the skeleton\'s max life ('+Math.round(sacrificeLifePct(10)*100)+'% at rank 10) and poisons what it hits. Costs no souls.' : 'Blast: '+Math.round(sacrificeLifePct(r)*100)+'% of the skeleton\'s max life as poison &middot; Radius '+SACRIFICE_RADIUS+' &middot; Poisons what it hits &middot; No souls',
  fear:(r)=> r===0 ? 'Active: curse the biggest group of enemies in range. They flee in terror (bosses stand their ground) and take +'+Math.round(fearVulnPct(1))+'% damage ('+Math.round(fearVulnPct(10))+'% at rank 10) while cursed; a purple mark floats over them.' : 'Flee '+fmtNum(fearDuration(r))+'s &middot; +'+Math.round(fearVulnPct(r))+'% damage taken for '+fmtNum(fearDuration(r)+FEAR_VULN_EXTRA)+'s (bosses too) &middot; Radius '+FEAR_RADIUS+' &middot; Cooldown '+fmtNum(fearCooldown(r))+'s',
  soulFire:(r)=> r===0 ? 'Active: hurl a big, slow, rolling ball of green soul-flame. It bursts on the first enemy it reaches, hitting everything around for half physical, half poison damage. Costs '+SOULFIRE_COST_TXT+' souls (20% more damage at 20) and '+SOULFIRE_MANA_COST+' mana, '+SOULFIRE_CD+'s cooldown.' : 'Burst radius '+SOULFIRE_RADIUS+' &middot; Half physical, half poison &middot; More damage with souls held (Soul Hunger) &middot; Cooldown '+SOULFIRE_CD+'s &middot; Costs '+SOULFIRE_COST_TXT+' souls (+20% damage at 20) + '+SOULFIRE_MANA_COST+' mana',
  demonBind:(r)=> r===0 ? 'Passive: collecting '+DEMON_BIND_SOUL_THRESHOLD+' souls binds a hulking demon to your service. Its damage and life grow with this skill\'s rank, and it hits 10% harder (and grows 4%) for every 10 souls you hold. It leeches life with every hit, healing you and itself.' : 'Damage and life +'+Math.round((hunterFollowerStatMult(r)-1)*100)+'% from rank &middot; +10% damage per 10 souls held (up to +'+Math.round(DEMON_DMG_PER_10*SOUL_CAP/10*100)+'%) &middot; Life leech '+Math.round(necroDemonLeechPct(r)*100)+'% (heals you and the demon)'+(r>=BASE_MAX_RANK ? ' &middot; +10% damage at max rank' : ''),
  plague:(r)=> r===0 ? 'Capstone (requires Demon Bind). Corrupt the ground with a large poison zone for '+fmtNum(PLAGUE_DUR_BASE)+'s. Costs mana, no souls. Cooldown starts when it ends.' : 'Radius '+PLAGUE_RADIUS+' &middot; Duration '+fmtNum(PLAGUE_DUR_BASE)+'s &middot; Cooldown '+PLAGUE_CD+'s (after it ends)',
};
function nodeEffectTextBase(node, rank){
  if(V489_TEXT[node.id]) return V489_TEXT[node.id](rank);
  if(V459_TEXT[node.id]) return V459_TEXT[node.id](rank);
  const mult = skillMult(rank);
  if(RV454_TEXT[node.id]) return RV454_TEXT[node.id](rank);
  if(RV269_TEXT[node.id]) return RV269_TEXT[node.id](rank);
  if(RV268_TEXT[node.id]) return RV268_TEXT[node.id](rank);
  if(RV267_TEXT[node.id]) return RV267_TEXT[node.id](rank);
  if(RV266_TEXT[node.id]) return RV266_TEXT[node.id](rank);
  if(RV227_TEXT[node.id]) return RV227_TEXT[node.id](rank);
  if(rank===0 && SKILL_R0_TEXT[node.id]) return SKILL_R0_TEXT[node.id]();
  if(node.id==='ironSkin'){
    if(rank===0) return 'Passive: +Defense, +Damage Reduction, +All Resists (5% at rank 1, 20% at rank 5), and +Block Chance with a shield. Rank 5: +4% max life and +1% max resistance.';
    const rkT = Math.min(rank, BASE_MAX_RANK);
    const defPct = Math.round(IRON_SKIN_DEFENSE_PCT_BY_RANK[rkT]*100);
    return 'Defense: +'+defPct+'% &middot; Damage reduction: '+Math.round(IRON_SKIN_DR_BY_RANK[rkT]*100)+'% &middot; Block: +'+Math.round(IRON_SKIN_BLOCK_PER_RANK*rank*100)+'% (shield) &middot; Resists: +'+fmtNum(IRON_SKIN_RESIST_BY_RANK[rkT])+'%'+(rank>=BASE_MAX_RANK ? ' &middot; Max life +4% &middot; Max resist +1%' : '');
  }
  if(node.id==='riposte'){
    if(rank===0) return 'Passive (requires Iron Skin): raises Block Chance. Every block gives Rage (more for a bigger hit) and counter-strikes the attacker. Also works with Parry: with a two-hander or dual swords, Riposte raises your Parry chance and every successful parry counter-strikes and grants Rage too.';
    const blk = Math.round(Math.min(BLOCK_CHANCE_CAP, BLOCK_CHANCE_BASE + RIPOSTE_BLOCK_PER_RANK*rank)*100);
    return 'Block chance: '+blk+'% (cap '+Math.round(BLOCK_CHANCE_CAP*100)+'%) &middot; Counter-strike x'+fmtNum(mult)+' &middot; Rage per block: '+RIPOSTE_RAGE_BASE+' to '+(RIPOSTE_RAGE_BASE+RIPOSTE_RAGE_MAX_BONUS)+' (scales with the hit) &middot; Works with Parry (counter-strike and Rage on every parry)';
  }
  if(node.id==='shieldBash'){
    const stun = shieldBashStunDuration(rank);
    const isKnockdown = rank>=SHIELD_BASH_KNOCKDOWN_RANK;
    return rank===0 ? 'Unlocks the SLAM button. Slam deals damage, briefly staggers foes, and has a chance to stun; a full Knockdown at Rank 5.' : ('Damage & speed: +'+Math.round((mult-1)*100)+'% &middot; '+(isKnockdown ? ('Knockdown: '+fmtNum(stun)+'s') : ('Stun: '+fmtNum(stun)+'s'))+' &middot; '+Math.round(slamStunChance(rank)*100)+'% chance on hit');
  }
  if(node.id==='shieldThrow'){
    const stun = rank>0 ? 1 + 0.25*(rank-1) : 1;
    const chains = shieldThrowMaxChains(rank);
    const cd = effectiveShieldThrowCooldown(rank||1);
    return rank===0 ? ('Chance to stun on hit: 2% at Rank 1, up to 10% at Rank 10 (1s stun at Rank 1, up to 2s at Rank 5). Cooldown 1s, decreasing further per rank (floored by how long the shield takes to fly out and return, ~'+fmtNum(shieldThrowTravelTime())+'s).') : ('Stun '+fmtNum(stun)+'s ('+Math.round(shieldStunChance(rank)*100)+'% chance) &middot; Dmg +'+Math.round((mult*2.4-1)*100)+'% &middot; Cooldown '+fmtNum(cd)+'s'+(chains>0 ? (' &middot; '+chains+' chain'+(chains>1?'s':'')) : ''));
  }
  if(node.id==='guardian'){
    return rank===0 ? ('Rank 1: lose '+juggDrain(1)+' Rage/s, '+JUGG_DMG_MULT+'x Slam damage, +'+Math.round(juggDef(1)*100)+'% defence.') : ('Rage loss '+fmtNum(juggDrain(rank))+'/s &middot; '+fmtNum(juggDmgMult(rank))+'x Slam &middot; Defence +'+Math.round(juggDef(rank)*100)+'%');
  }
  if(node.id==='weaponsSpecialist'){
    if(rank===0) return 'Unlocks the Longsword line (Longsword &rarr; Greatsword &rarr; Demonblade) & dual-wielding.';
    const gsDmg = Math.round(GREATSWORD_DMG_PER_RANK*rank*100);
    const gsPen = Math.round(Math.min(1, GREATSWORD_ARMORPEN_PER_RANK*rank)*100);
    const dwSpd = Math.round(DUAL_WIELD_ATKSPD_PER_RANK*rank*100);
    return 'Longsword line: +'+gsDmg+'% dmg, '+gsPen+'% armor pen &middot; Dual-wield: +'+dwSpd+'% attack speed &middot; Two-hander / dual-wield: +'+(wsRagePct(rank)*100).toFixed(1).replace(/\.0$/,'')+'% Rage &middot; Parry: '+Math.round(100*(game&&game.player?parryChanceBase(game.player):0.05))+'% (half your Block Chance, two-hander or dual swords)';
  }
  if(node.id==='bloodlust'){
    if(rank===0) return 'Passive: heal for a % of the damage you deal. Below 50% life you are Bloodied: leech x'+BLOODLUST_BLOODIED_LEECH_MULT+' and faster attacks. Out of combat, the Rage that drains away is turned into life regeneration ('+Math.round(bloodHarvestRecovery(1)*100)+'% of it at rank 1), and enemies drop more health potions (+'+Math.round(BLOOD_HARVEST_PER_RANK*100)+'% per rank).';
    const lp = BLOODLUST_LEECH_BASE+BLOODLUST_LEECH_STEP*(rank-1);
    return 'Life leech '+lp+'% &middot; Bloodied (below 50% life): '+Math.round(lp*BLOODLUST_BLOODIED_LEECH_MULT*10)/10+'% leech, +'+Math.round((BLOODLUST_BLOODIED_AS_BASE+BLOODLUST_BLOODIED_AS_STEP*(rank-1))*1000)/10+'% attack speed. Stacks with gear leech (total cap '+LEECH_TOTAL_CAP+'%). &middot; Health potion drops +'+Math.round(BLOOD_HARVEST_PER_RANK*rank*100)+'% &middot; Rage that fades out of battle returns '+Math.round(bloodHarvestRecovery(rank)*100)+'% as life regeneration.';
  }
  if(node.id==='whirlwind'){
    const dr = Math.max(5, WHIRLWIND_RAGE_DRAIN - WHIRLWIND_DRAIN_STEP*Math.max(0,rank-1));
    const spd = (typeof game!=='undefined' && game && game.player) ? whirlSpeed(game.player) : 1;
    return rank===0 ? ('Spins until your Rage runs out ('+WHIRLWIND_RAGE_DRAIN+'/s at Rank 1, rising '+WHIRLWIND_DRAIN_RAMP+'/s every second). Double damage; Attack Speed spins faster and hits more often.') : ('Starting Rage drain: '+fmtNum(dr)+'/s, rising '+WHIRLWIND_DRAIN_RAMP+'/s every second &middot; Hits every '+fmtNum(Math.round(WHIRLWIND_TICK_INTERVAL/spd*100)/100)+'s with your Attack Speed (x'+fmtNum(Math.round(spd*100)/100)+' spin)');
  }
  if(node.id==='cleave'){
    if(rank===0) return 'Passive (requires a two-handed sword): Strike becomes Cleave, a sideways sword swing in front of you only (about 90 degrees) for 2.75x weapon damage at Rank 1, up to 5x at Rank 10 (single-target damage per second roughly matches Fury). Uses the two-hander reach (+'+TWOHAND_REACH_BONUS+' over one-handed weapons). Each Cleave costs '+CLEAVE_RAGE_COST+' Rage; with less, you swing a plain Strike.';
    const pen = Math.round(CLEAVE_ARMORPEN_PER_RANK*rank*100);
    return 'Cleave damage: x'+fmtNum(Math.round(cleaveMult(rank)*100)/100)+' weapon damage &middot; Armor pen: +'+pen+'% (while wielding a two-handed weapon) &middot; Costs '+CLEAVE_RAGE_COST+' Rage per swing (a plain Strike when you have less)';
  }
  if(node.id==='fury'){
    if(rank===0) return 'Passive (requires two one-handed swords): Strike becomes a 3-hit combo. Each combo costs '+FURY_RAGE_COST+' Rage; with less, you swing a plain Strike.';
    const comboDmg = Math.round((skillMult(rank)-1)*100);
    const spd = Math.round(FURY_ATKSPD_PER_RANK*rank*100);
    return 'Combo damage per hit: +'+comboDmg+'% &middot; Attack speed: +'+spd+'% (while dual-wielding swords) &middot; Costs '+FURY_RAGE_COST+' Rage per combo';
  }
  if(node.id==='leap'){
    return rank===0 ? 'Unlocks a CHARGE skill.' : ('Damage x'+fmtNum(mult)+' &middot; Stun '+fmtNum(LEAP_STUN_BASE+LEAP_STUN_STEP*(rank-1))+'s &middot; Cooldown '+fmtNum(leapCdForRank(rank))+'s');
  }
  if(node.id==='unbreakable'){
    return rank===0 ? 'Unlocks UNBREAKABLE.' : ('Damage taken -'+Math.round(unbreakDr(rank)*100)+'% for '+fmtNum(unbreakDur(rank))+'s');
  }
  if(node.id==='assault'){
    const dur = rank>0 ? ASSAULT_BASE_DUR + ASSAULT_RANK_STEP*(rank-1) : ASSAULT_BASE_DUR;
    const ext = assaultKillExtend(rank||1);
    return rank===0 ? ('Rage fills on use. '+ASSAULT_BASE_DUR+'s at Rank 1 (+'+ASSAULT_RANK_STEP+'s per rank). Each kill while active extends it.') : ('Fills Rage on use &middot; Duration: '+fmtNum(dur)+'s &middot; +'+fmtNum(ext)+'s per kill');
  }
  if(node.id==='squire'){
    if(rank===0) return 'Summons a follower to fight at your side. Life at your level: '+knightLifeAtRank(game.player,1)+' each at Rank 1.';
    const followers = squireFollowerCount(rank);
    const bonus = Math.round((squireStatMult(rank)-1)*100);
    return 'Squire life: '+knightLifeAtRank(game.player,rank)+' each (at your level)'+(bonus>0 ? (' &middot; +'+bonus+'% from rank') : '')+' &middot; '+followers+' follower'+(followers===1?'':'s')+' active &middot; Re-summon after falling: '+fmtNum(followerRespawnTime(game.player,'knight',rank))+'s';
  }
  if(node.id==='commander'){
    if(rank===0) return 'Unlocks the follower stance switch (assign it to a skill slot): Attack or Guard.';
    const hpBonus = Math.round((commanderHpMult(rank)-1)*100);
    return 'Follower max HP: +'+hpBonus+'% ';
  }
  if(node.id==='offensiveStance'){
    if(rank===0) return 'Passive: raises the damage of your followers at every rank.';
    return 'Follower damage: +'+Math.round(OFFENSIVE_STANCE_FOLLOWER_DMG_PER_RANK*rank*100)+'%';
  }
  if(node.id==='templarDefensiveStance'){
    if(rank===0) return 'Passive: raises your followers\' life and defence at every rank, and lets Guard-stance followers Taunt.';
    return 'Follower life: +'+Math.round(GUARD_STANCE_HP_PER_RANK*rank*100)+'% &middot; Follower armor: +'+Math.round(Math.min(0.5,GUARD_STANCE_DEF_PER_RANK*rank)*100)+'% &middot; Follower resists: +'+Math.round(guardStanceResist({skills:{templarDefensiveStance:rank}, cls:'warrior'})*100)+'% &middot; Guard-stance followers Taunt';
  }
  if(node.id==='battlecry'){
    if(rank===0) return 'New BATTLECRY button: a warcry that stuns nearby enemies and briefly buffs damage & crit chance for you and your followers.';
    const stun = BATTLECRY_STUN_BASE + BATTLECRY_STUN_RANK_STEP*(rank-1);
    const critBonus = BATTLECRY_CRIT_BONUS_BASE + BATTLECRY_CRIT_BONUS_RANK_STEP*(rank-1);
    const buffDur = BATTLECRY_BUFF_BASE_DUR + BATTLECRY_BUFF_RANK_STEP*(rank-1);
    return 'Stun '+fmtNum(stun)+'s &middot; You & followers: +'+Math.round((battlecryDmgMult({skills:{battlecry:rank}})-1)*100)+'% damage, +'+critBonus+'% crit for '+fmtNum(buffDur)+'s &middot; Cooldown '+BATTLECRY_CD+'s';
  }
  if(node.id==='rally'){
    if(rank===0) return 'New RALLY button: re-summon your followers beside you, heal them, and raise block chance & defence for you and your followers.';
    const stun = RALLY_STUN_BASE + RALLY_STUN_RANK_STEP*(rank-1);
    const healPct = Math.round((RALLY_HEAL_PCT_BASE + RALLY_HEAL_PCT_RANK_STEP*(rank-1))*100);
    const buffDur = RALLY_BUFF_BASE_DUR + RALLY_BUFF_RANK_STEP*(rank-1);
    const defBonus = Math.round((RALLY_DEF_REDUCTION_BASE + RALLY_DEF_REDUCTION_RANK_STEP*(rank-1))*100);
    return 'Re-summon followers beside you &middot; Heal '+healPct+'% &middot; +'+Math.round(RALLY_BLOCK_BONUS*100)+'% block chance & -'+defBonus+'% dmg taken (you and followers) for '+fmtNum(buffDur)+'s';
  }
  if(node.id==='companionWolf'){
    if(rank===0) return 'New WOLF button: summon a wolf companion to fight at your side; its attacks apply Bleed. A second wolf joins at Rank 5.';
    const bonus = Math.round((hunterFollowerStatMult(rank)-1)*100);
    const count = rank>=5 ? 2 : 1;
    return (count>1?'2 wolves':'1 wolf')+' fighting beside you'+(bonus>0 ? (' &middot; Dmg/HP: +'+bonus+'%') : '')+' &middot; Life leech '+Math.round(wolfLeechPct(rank)*100)+'% (heals the wolf) &middot; Respawns '+fmtNum(followerRespawnTime(game.player,'wolf',rank))+'s after falling';
  }
  if(node.id==='recall'){
    if(rank===0) return 'New RECALL button: call your companions to your side. Grants you increased damage and life Regen for a brief period.';
    const dmgBonus = Math.round(recallDmgBonus(rank)*100);
    const regenPct = Math.round(recallRegenPct(rank)*100);
    return 'Companions recalled &middot; +'+dmgBonus+'% dmg & '+regenPct+'%/s HP Regen for '+RECALL_BUFF_DUR+'s &middot; Cooldown '+RECALL_CD+'s';
  }
  if(node.id==='companionBear'){
    if(rank===0) return 'Summons a smaller sprite of a forest bear -- your hardest-hitting follower.';
    const bonus = Math.round((hunterFollowerStatMult(rank)-1)*100);
    return 'Bear companion active'+(bonus>0 ? (' &middot; Dmg/HP: +'+bonus+'%') : '');
  }
  if(node.id==='trap'){
    if(rank===0) return 'New TRAP button: plant a trap that roots & damages the first monster to step on it.';
    const dmg = Math.round((TRAP_BASE_DMG)*mult);
    const dur = TRAP_ROOT_DURATION + TRAP_ROOT_STEP*(rank-1);
    return 'Root '+fmtNum(dur)+'s &middot; Dmg ~'+dmg+' &middot; Cooldown '+TRAP_CD+'s';
  }
  if(node.id==='cripplingShot'){
    if(rank===0) return 'New CRIPPLE button: fire a shot that applies Bleed.';
    const dmg = Math.round(CRIPPLING_SHOT_BASE_DMG*mult);
    const bleedPct = Math.round(cripplingShotBleedPct(rank)*100);
    return 'Dmg ~'+dmg+' &middot; Bleed '+bleedPct+'%/s for '+CRIPPLING_SHOT_BLEED_DUR+'s &middot; Cooldown '+CRIPPLING_SHOT_CD+'s';
  }
  if(node.id==='stunShot'){
    if(rank===0) return 'New STUN button (requires Crippling Shot): a heavier shot that stuns on hit.';
    const dmg = Math.round(STUN_SHOT_BASE_DMG*mult);
    const stun = stunShotStunDuration(rank);
    return 'Dmg ~'+dmg+' &middot; Stun '+fmtNum(stun)+'s &middot; Cooldown '+STUN_SHOT_CD+'s';
  }
  if(node.id==='packTactics'){
    if(rank===0) return 'New PACK button (requires Summon Wolf): your companions jump to your target for a bonus attack.';
    const cd = packTacticsCooldown(rank);
    const bonus = Math.round((packTacticsDmgMult(rank)-1)*100);
    return 'Bonus attack: +'+bonus+'% dmg &middot; Cooldown '+fmtNum(cd)+'s';
  }
  if(node.id==='fieldDress'){
    if(rank===0) return 'New DRESS button: stand still to regenerate health; moving cancels it. Fixed 2 minute cooldown at every rank.';
    const pct = Math.round(fieldDressRegenRate(rank)*100);
    return 'Regen '+pct+'%/s of max HP while channeling &middot; cancels on movement or at full HP &middot; Cooldown '+FIELD_DRESS_CD+'s (fixed, does not shrink with rank)';
  }
  if(node.id==='sap'){
    if(rank===0) return 'Passive: bonus damage while you\'re at full health.';
    const pct = Math.round(sapDamageBonus(rank)*100);
    return '+'+pct+'% damage while at full HP';
  }
  if(node.id==='evasion'){
    if(rank===0) return 'Passive: chance to fully dodge an incoming hit, stacking with Evasion from gear Dexterity.';
    const pct = Math.round((EVASION_SKILL_PCT[Math.min(rank,10)-1]+Math.max(0,rank-10)*0.01)*100);
    return 'Dodge chance: +'+pct+'% (combines with Evasion from gear Dexterity, cap '+Math.round(EVASION_CAP*100)+'%)';
  }
  if(node.id==='execute'){
    const pct = Math.round(executeThreshold(rank)*100);
    return rank===0 ? 'Instantly finishes enemies below 10% HP at Rank 1.' : ('Finishes enemies below '+pct+'% HP');
  }
  if(node.id==='shadowStep'){
    if(rank===0) return 'New SHADOW button: teleport behind the closest enemy & attack.';
    const cd = shadowStepCooldown(rank);
    return 'Teleport range '+SHADOW_STEP_RANGE+' &middot; Cooldown '+fmtNum(cd)+'s';
  }
  if(node.id==='vanish'){
    const dur = rank>0 ? VANISH_BASE_DUR + VANISH_RANK_STEP*(rank-1) : VANISH_BASE_DUR;
    return rank===0 ? ('Become untargetable for '+VANISH_BASE_DUR+'s. Dealing damage ends the effect early. When it ends you gain 60% evasion for 2s.') : ('Duration: '+fmtNum(dur)+'s (ends early if you deal damage) &middot; Cooldown '+VANISH_CD+'s (fixed)');
  }
  if(node.id==='survivalFieldDress'){
    if(rank===0) return 'Slap on a field bandage: heal 16% of max HP over 4 seconds while you keep moving and fighting; your companions heal for half. Each rank heals more and shortens the cooldown (30s down to 18s).';
    const pct = Math.round(survFieldDressRegenRate(rank)*100);
    const cd = survFieldDressCooldown(rank);
    return 'Heals '+pct+'%/s of max HP for '+SURV_FIELD_DRESS_DUR+'s ('+(pct*SURV_FIELD_DRESS_DUR)+'% total) &middot; keeps working while you move &middot; companions heal half &middot; Cooldown '+fmtNum(cd)+'s';
  }
  if(node.id==='poisonTrap'){
    if(rank===0) return 'Throw a poison trap at an enemy; after .5s it releases a large poison cloud dealing damage over time.';
    const cd = poisonTrapCooldown(rank);
    return 'Cloud tick dmg x'+fmtNum(mult)+' (every '+POISON_TRAP_TICK_INTERVAL+'s for '+POISON_TRAP_CLOUD_DUR+'s) &middot; Radius '+SURV_TRAP_RADIUS+' &middot; Fuse '+SURV_TRAP_FUSE+'s &middot; Cooldown '+trapCdText(cd);
  }
  if(node.id==='frostTrap'){
    if(rank===0) return 'Throw a frost trap at an enemy; after .5s it bursts with cold, damaging and freezing all enemies nearby briefly, then slows them.';
    const freezeDur = frostTrapFreezeDuration(rank);
    return 'Cold burst dmg ~'+Math.round(10*mult)+' &middot; Freeze: '+fmtNum(freezeDur)+'s (elites '+fmtNum(freezeDur*FROST_TRAP_TOUGH)+'s) &middot; Slow (Chill) after: '+fmtNum(frostTrapChillDuration(rank))+'s &middot; Radius '+SURV_TRAP_RADIUS+' &middot; Fuse '+SURV_TRAP_FUSE+'s &middot; Cooldown '+trapCdText(FROST_TRAP_CD);
  }
  if(node.id==='finesse'){
    if(rank===0) return 'Passive (requires Evasion): gain a 2nd Dodge charge before its cooldown is triggered. Each rank shortens Dodge\'s cooldown by 0.1s up to Rank 5, then 0.03s per rank (0.40s at Rank 10).';
    const cd = finesseDodgeCooldown({skills:{finesse:rank}});
    return '2 Dodge charges &middot; Dodge cooldown: '+fmtNum(cd)+'s (base '+fmtNum(DODGE_CD_BASE)+'s)';
  }
  if(node.id==='bowExpert'){
    if(rank===0) return 'Passive: increases damage dealt with a bow, from +5% up to +20%.';
    return '+'+fmtNum(tblAt(BOW_EXPERT_DMG_PCT, rank))+'% bow damage';
  }
  if(node.id==='rapidShot'){
    if(rank===0) return 'Basic shot (free, refills '+STAMINA_ON_SHOT+' Stamina): fire 3 arrows in quick succession on your Strike timer. If all 3 hit the same enemy, the final arrow gets armor penetration.';
    const pen = Math.round(RAPID_SHOT_ARMORPEN_PER_RANK*rank*100);
    return 'Dmg x'+fmtNum(swd('rapidShot',rank))+' weapon damage per arrow &middot; Final-arrow armor pen (same target only): '+pen+'% &middot; Free, refills '+STAMINA_ON_SHOT+' Stamina';
  }
  if(node.id==='multiShot'){
    if(rank===0) return 'Basic shot (free, refills '+STAMINA_ON_SHOT+' Stamina): loose a fan of '+multiShotCount(1)+' arrows at once, each '+Math.round(MARKSMAN_DMG_TUNE*100)+'% of a normal shot. Your Strike stays a single arrow.';
    const count = multiShotCount(rank);
    return 'Fires '+count+' arrows in a fan, each '+Math.round(MARKSMAN_DMG_TUNE*100)+'% weapon damage &middot; Free, refills '+STAMINA_ON_SHOT+' Stamina'+(rank>=5?' &middot; Max rank bonus: 5-arrow spread':'');
  }
  if(node.id==='arrowEye'){
    if(rank===0) return 'Passive: increases Critical Chance while a bow is equipped, from +5% up to +25%.';
    return '+'+fmtNum(tblAt(ARROW_EYE_CRIT_PCT, rank))+'% Crit Chance (bow only)';
  }
  if(node.id==='trueShot'){
    if(rank===0) return 'Passive: increases Aim Speed, shortening Precise Shot\'s cooldown.';
    return 'Aim Speed +'+Math.round(TRUE_SHOT_AIMSPD_PER_RANK*rank*100)+'% &middot; Precise Shot cooldown further reduced';
  }
  if(node.id==='preciseShot'){
    if(rank===0) return 'Hold STRIKE to aim (steer with the movement stick, just like Shield Throw), release to fire for 3x damage. Cooldown matches your regular shot.';
    const cd = preciseShotCooldownMult(rank);
    return 'Damage x'+PRECISE_SHOT_DMG_MULT+' &middot; Cooldown: '+Math.round(cd*100)+'% of your regular shot cooldown (before Steady Breath)';
  }
  if(node.id==='rainOfArrows'){
    if(rank===0) return 'Capstone (requires Precise Shot). Shoot an arrow to the sky which shatters and rains down many arrows in an area. Each rank increases damage. 6 second cooldown.';
    const dmg = Math.round(RAIN_OF_ARROWS_BASE_DMG*mult*RAIN_OF_ARROWS_TOTAL_MULT);
    return 'Dmg ~'+dmg+' (base, scales with level/gear) &middot; Radius '+RAIN_OF_ARROWS_RADIUS+' &middot; Cooldown '+RAIN_OF_ARROWS_CD+'s (fixed) &middot; total over 3 volleys';
  }
  if(node.id==='lightningArc'){
    if(rank===0) return 'Active: shoots an instant lightning bolt at your target. Assign it to Main/1/2/3 like any other active skill. Each rank adds damage.';
    return 'Bolt damage: x'+fmtNum(mult)+' &middot; Assign to a button to use it';
  }
  if(node.id==='lightningChain'){
    if(rank===0) return 'Passive (requires Lightning Arc): the lightning bolt can jump to another nearby enemy. Each rank adds +1 chain, up to 5.';
    const chains = lightningArcChains(rank);
    return 'Chains: '+chains+' &middot; Each jump: '+Math.round(LIGHTNING_CHAIN_DMG_MULT*100)+'% of the previous hit\'s damage &middot; Chain range '+LIGHTNING_CHAIN_RANGE;
  }
  if(node.id==='nova'){
    if(rank===0) return 'New NOVA button (requires Lightning Chain): a lightning ring around you that adds a Charge to every monster it touches.';
    return 'Damage +'+Math.round((skillMult(rank)-1)*100)+'% &middot; +1 Charge per hit &middot; Radius '+NOVA_RADIUS+' &middot; Cooldown '+NOVA_CD+'s';
  }
  if(node.id==='tornado'){
    if(rank===0) return 'New TORNADO button (requires Thunderstep): hurl a tornado at the nearest enemy. Each rank adds damage.';
    return 'Damage x'+fmtNum(mult)+' &middot; Size x2 &middot; Cooldown '+fmtNum(tornadoCdForRank(rank))+'s';
  }
  if(node.id==='storm'){
    if(rank===0) return 'Passive (requires Tornado): a small storm cloud hangs over you, permanently sharpening your strikes. Each rank adds a little Crit Chance and Crit Multiplier.';
    return '+'+fmtNum(STORM_CRIT_PER_RANK*rank)+'% Crit Chance &middot; Critical hits lower the target\'s lightning resistance by '+Math.round(stormShredPct(rank)*100)+'% for '+STORM_SHRED_DUR+'s (always active)';
  }
  if(node.id==='hurricane'){
    if(rank===0) return 'Capstone (requires Storm). New HURRICANE button: conjure a hurricane around you that damages & slows every enemy inside. Each rank adds damage and duration, up to '+(HURRICANE_DUR_BASE+HURRICANE_DUR_STEP*4)+'s at max rank.';
    const dur = hurricaneDuration(rank);
    return 'Tick damage x'+fmtNum(mult)+' (every '+HURRICANE_TICK_INTERVAL+'s) &middot; Duration: '+fmtNum(dur)+'s &middot; Slows enemies inside &middot; +'+Math.round(hurricaneDefPct(rank)*100)+'% defence while it rages (recast restarts it) &middot; Radius '+HURRICANE_RADIUS+' &middot; Cooldown '+fmtNum(hurricaneCooldown(rank))+'s';
  }
  if(node.id==='elementalPolarity'){
    if(rank===0) return 'Unlocks 2 new skills: Fireball (fire bolt, applies Burn, explodes on impact) & Ice Bolt (ice bolt, applies Chill, explodes on impact) -- assign them from this popup once ranked. Each rank adds damage to both.';
    return 'Fireball dmg ~'+Math.round(elementalPolarityDmg({level:1,dmgBonus:0,skills:{elementalPolarity:rank}},FIREBALL_BASE_DMG))+' &middot; Ice Bolt dmg ~'+Math.round(elementalPolarityDmg({level:1,dmgBonus:0,skills:{elementalPolarity:rank}},ICE_BOLT_BASE_DMG))+' (at Lv.1, scales with level/gear) &middot; Damage x'+fmtNum(mult)+' &middot; No cooldown of their own (same speed as Strike)';
  }
  if(node.id==='elementalExplosions'){
    if(rank===0) return 'Passive (requires Elemental Polarity): Fireball & Ice Bolt splash '+Math.round(ELEMENTAL_EXPLOSION_SPLASH_PCT*100)+'% damage to nearby enemies on impact. Each rank adds chance to also apply their ailment (Burn/Chill) to those enemies.';
    const chance = Math.round(elementalExplosionAilmentChance(rank)*100);
    return 'Splash dmg '+Math.round(ELEMENTAL_EXPLOSION_SPLASH_PCT*100)+'% &middot; Splash radius '+ELEMENTAL_EXPLOSION_RADIUS+' &middot; Ailment chance on splashed enemies: '+chance+'%';
  }
  if(node.id==='fireBomb'){
    if(rank===0) return 'New FIREBOMB button: explode in a small area of fire around yourself. Each rank adds damage.';
    const dmg = Math.round(18*mult);
    return 'Dmg ~'+dmg+' (base, scales with level/gear) &middot; Radius '+FIRE_BOMB_RADIUS+' &middot; Cooldown '+FIRE_BOMB_CD+'s';
  }
  if(node.id==='iceArmor'){
    if(rank===0) return 'While on a skill button: reserves 25% of your mana for a standing ice barrier (25% of max life, 50% at Rank 10) that soaks damage and refills after 5s without being hit (3s at Rank 10). The ICE ARMOR button explodes it: cold damage equal to the barrier you hold, and it freezes nearby enemies.';
    const pp = (game&&game.player)||{maxHp:0, level:1};
    return 'Barrier: '+Math.round(iceArmorScale(rank)*100)+'% of max life ('+iceArmorBarrierMax(pp, rank)+') &middot; Recharge: '+fmtNum(iceArmorRecharge(rank))+'s without being hit &middot; Explosion: the barrier you hold (up to '+iceArmorBarrierMax(pp, rank)+') as cold damage in radius '+ICE_ARMOR_EXPLODE_RADIUS+', freezes enemies &middot; Reserves 25% mana';
  }
  if(node.id==='pyroTorrent'){
    if(rank===0) return 'Channel a searing beam of fire for '+PYRO_TORRENT_DUR_BASE+'s, rooted in place. The beam tracks the nearest enemy, burns everything along it, and grows stronger the longer it holds. Each rank adds damage.';
    const dur = pyroTorrentDuration(rank);
    return 'Beam damage x'+fmtNum(mult)+' (ramps up to x'+fmtNum(1+PYRO_TORRENT_RAMP)+' over the channel) &middot; Duration: '+fmtNum(dur)+'s, rooted &middot; Applies Burn &middot; Range '+PYRO_TORRENT_RANGE+' &middot; Cooldown '+PYRO_TORRENT_CD+'s';
  }
  if(node.id==='blizzard'){
    if(rank===0) return 'Capstone (requires Ice Armor). New BLIZZARD button: call down a 4s ice storm on the enemies near you (it lands on the thickest group in range), damaging and chilling everything inside. Each rank adds damage.';
    return 'Ice rains down on the marked circle for '+BLIZZARD_DUR+'s, hitting every '+BLIZZARD_TICK+'s and chilling &middot; Radius '+BLIZZARD_RADIUS+' &middot; Cooldown '+BLIZZARD_CD+'s';
  }
  if(node.id==='soulFire'){
    if(rank===0) return 'New SOUL NOVA button: burst your souls outward, damaging and slowing every enemy around you. Costs '+SOULFIRE_SOUL_COST+' souls, or '+SOULFIRE_MANA_COST+' mana if you hold fewer. Each rank adds damage.';
    return 'Damage ~'+Math.round(soulFireDmg(game.player, rank))+' (more with souls held) &middot; Radius '+SOULFIRE_RADIUS+' &middot; Slows '+fmtNum(SOULFIRE_CHILL)+'s &middot; Cooldown '+SOULFIRE_CD+'s &middot; Costs '+SOULFIRE_SOUL_COST+' souls, or '+SOULFIRE_MANA_COST+' mana';
  }
  if(node.id==='fear'){
    if(rank===0) return 'New FEAR button: make every enemy around you flee in terror. Feared enemies also take +'+Math.round(fearVulnPct(1))+'% damage (up to +'+Math.round(fearVulnPct(10))+'% at Rank 10). Each rank adds fear duration and damage taken, and reduces cooldown. Costs double mana.';
    const dur = fearDuration(rank);
    const cd = fearCooldown(rank);
    return 'Fear duration: '+fmtNum(dur)+'s &middot; Feared enemies take +'+fmtNum(fearVulnPct(rank))+'% damage (for '+fmtNum(dur+FEAR_VULN_EXTRA)+'s) &middot; Radius '+FEAR_RADIUS+' &middot; Cooldown '+fmtNum(cd)+'s';
  }
  if(node.id==='raiseDead'){
    if(rank===0) return 'Passive: raise skeleton minions to fight for you. Each rank adds damage, minion life, and up to 3 minions at max rank.';
    const count = squireFollowerCount(rank);
    const bonus = Math.round((hunterFollowerStatMult(rank)-1)*100);
    return count+' skeleton'+(count>1?'s':'')+' active'+(bonus>0 ? (' &middot; Dmg/HP: +'+bonus+'%') : '');
  }
  if(node.id==='soulSap'){
    if(rank===0) return 'Active: fires a bolt that pulls the soul out of an enemy it kills (up to '+SOUL_CAP+' souls held at once -- see the soul counter, top-right). Assign it to Main/1/2/3 like any other active skill. Each rank adds damage. Requires Fear OR Raise Dead.';
    return 'Bolt damage: x'+fmtNum(mult)+' &middot; +'+SOUL_SAP_SOULS_PER_KILL+' soul per kill (cap '+SOUL_CAP+') &middot; Assign to a button to use it';
  }
  if(node.id==='sacrifice'){
    if(rank===0) return 'Passive (requires Raise Dead): a dying skeleton bursts in poison. Burns souls for a bigger blast. Each rank adds damage.';
    const dmg = Math.round((SACRIFICE_BASE_DMG)*mult);
    return 'Burst dmg ~'+dmg+' (+50% per soul burned, up to '+(1+Math.floor(rank/2))+') &middot; Poison '+Math.round(POISON_DOT_PCT*100)+'%/s for '+POISON_DOT_DUR+'s &middot; Radius '+SACRIFICE_RADIUS+' &middot; Passive';
  }
  if(node.id==='demonBind'){
    if(rank===0) return 'Passive (requires Soul Sap): collecting '+DEMON_BIND_SOUL_THRESHOLD+' souls automatically summons a demon that life-leeches, healing both you and it. Each rank adds damage and % life leech.';
    const leech = Math.round(necroDemonLeechPct(rank)*100);
    return 'Summons at '+DEMON_BIND_SOUL_THRESHOLD+' souls (consumed on summon) &middot; Life leech: '+leech+'% (heals you & the demon)';
  }
  if(node.id==='plague'){
    if(rank===0) return 'Capstone (requires Sacrifice OR Demon Bind). New PLAGUE button: corrupt the ground with a large poison zone. Each rank adds damage. Lasts '+fmtNum(PLAGUE_DUR_BASE)+'s. Costs mana, no souls. Cooldown starts when it ends.';
    const dmg = Math.round(10*mult);
    return 'Tick dmg ~'+dmg+' (every '+PLAGUE_TICK_INTERVAL+'s, base, scales with level) &middot; Radius '+PLAGUE_RADIUS+' &middot; Duration '+fmtNum(PLAGUE_DUR_BASE)+'s &middot; Cooldown '+PLAGUE_CD+'s (starts after it ends)';
  }
  return '';
}

// v209: every skill is slot-only -- the legacy per-skill buttons are never shown; skills are used from Main/1/2/3.
function updateSkillButtonsVisibility(){
  if(!game) return;
  const p = game.player;
  document.getElementById('btnSlam').style.display = 'none';
  document.getElementById('btnThrow').style.display = 'none';
  document.getElementById('btnGuardian').style.display = 'none';
  document.getElementById('btnWhirlwind').style.display = 'none';   // v208: Whirlwind lives on a skill slot only
  document.getElementById('btnBattlecry').style.display = 'none';
  document.getElementById('btnAssault').style.display = 'none';
  document.getElementById('btnStance').style.display = 'none';   // v206: Commander's stance switch lives on a skill slot only
  document.getElementById('btnRally').style.display = 'none';
  document.getElementById('btnTrap').style.display = 'none';
  document.getElementById('btnShadowStep').style.display = 'none';
  document.getElementById('btnVanish').style.display = 'none';
  document.getElementById('btnRapidShot').style.display = 'none';
  document.getElementById('btnCripplingShot').style.display = 'none';
  document.getElementById('btnStunShot').style.display = 'none';
  document.getElementById('btnPackTactics').style.display = 'none';
  document.getElementById('btnFieldDress').style.display = 'none';
  document.getElementById('btnRainOfArrows').style.display = 'none';
  document.getElementById('btnRecall').style.display = 'none';
  updateStanceButtonLabel();
}
// The STANCE button's label always shows the follower stance it will switch
// TO next isn't right -- it should reflect the CURRENT stance, so the player
// can tell what their followers are doing right now.
function updateStanceButtonLabel(){
  if(!game) return;
  const label = {attack:'ATTACK', guard:'GUARD'}[game.followerStance] || 'STANCE';
  const el = document.querySelector('#btnStance .lbl');
  if(el) el.textContent = label;
}

// Which tree "tab" is currently open per class, so switching class doesn't
// lose the other class's place, and Warrior's 3 trees (Defender/Berserker/
// Templar) share one pool of skill points, spendable from whichever tab is
// open -- same for Ranger's/Mystic's own 3-tree sets.
const treeTabByClass = {};
function activeTreeTabKey(p){
  const keys = Object.keys(treesForClass(p.cls));
  if(!treeTabByClass[p.cls] || keys.indexOf(treeTabByClass[p.cls])<0) treeTabByClass[p.cls] = keys[0];
  return treeTabByClass[p.cls];
}
function nodeDisplayName(TREES, nodeId){
  // v76: Fireball/Ice Bolt are virtual skills with no tree node of their
  // own (see VIRTUAL_SKILL_NAMES) -- checked first so they get a proper
  // display name instead of falling through to the raw id below.
  if(VIRTUAL_SKILL_NAMES[nodeId]) return VIRTUAL_SKILL_NAMES[nodeId];
  for(const key of Object.keys(TREES)){
    const found = TREES[key].nodes.find(n=>n.id===nodeId);
    if(found) return found.name;
  }
  return nodeId;
}
function treeNodeHtml(p, TREES, treeKey, idx){
  const tree = TREES[treeKey];
  const node = tree.nodes[idx];
  const rank = p.skills[node.id]||0;
  const lockedByPrereq = rank===0 && !prereqSatisfied(p, node);
  const capstoneLocked = rank===0 && capstoneBlocks(p, node);
  const available = canRankUp(p, treeKey, idx);
  const maxed = rank>=MAX_SKILL_RANK;
  let cls = 'treeNode ' + (maxed ? 'unlocked' : rank>0 ? 'unlocked' : available ? 'available' : 'locked');
  let reqText;
  if(maxed) reqText = 'Rank 10/10 (Max)';
  else if(rank>=BASE_MAX_RANK && p.level<masteryReqLevel(rank+1)) reqText = 'Mastery '+(rank-BASE_MAX_RANK)+'/5 &mdash; next needs Lv.'+masteryReqLevel(rank+1);
  else if(rank>0) reqText = 'Rank '+rank+'/10 &mdash; tap to rank up';
  else if(capstoneLocked) reqText = 'Capstone already chosen elsewhere';
  else if(lockedByPrereq) reqText = 'Requires Lv.'+nodeLevelReq(node)+' &middot; '+prereqReqText(TREES, node).replace(/^Requires /,'');
  else reqText = 'Requires Lv.'+nodeLevelReq(node);
  const style = (tree.layout==='shield' || tree.layout==='sword' || tree.layout==='cross' || tree.layout==='cascade') ? (' style="grid-column:'+(node.col+1)+';grid-row:'+(node.row+1)+';"') : '';
  return '<div class="'+cls+'" data-tree="'+treeKey+'" data-idx="'+idx+'" data-nodeid="'+node.id+'"'+style+'>'+
    (node.capstone ? '<div class="treeNodeName">&#9733; '+node.name+(rank>0?' &middot; Rank '+rank+'/10':'')+'</div>' : '<div class="treeNodeName">'+node.name+(rank>0?' &middot; Rank '+rank+'/10':'')+'</div>')+
    '<div class="treeNodeDesc">'+node.desc+'</div>'+
    '<div class="treeNodeEffect">'+nodeEffectText(node, rank)+'</div>'+
    '<div class="treeNodeReq">'+reqText+'</div>'+
  '</div>';
}
// Defender tab: icon-only node rendering (all other trees keep the classic
// always-visible full-text node from treeNodeHtml above). Clicking an icon
// opens the skillNodePopup instead of ranking up directly, so the tab reads
// as a clean row of shield icons rather than a wall of text.
const SHIELD_ICON_PATH = 'M20 3 L33 8.5 L33 18 C33 28 26.5 34.5 20 37 C13.5 34.5 7 28 7 18 L7 8.5 Z';
// Berserker tab (v55): a stylized sword silhouette -- blade, crossguard,
// grip and pommel -- used as the base icon shape for every Berserker node,
// same idea as SHIELD_ICON_PATH above but for the sword-shaped tree.
const SWORD_ICON_PATH = 'M18 2 L22 2 L22 23 L28 23 L28 28 L22 28 L22 34 L18 34 L18 28 L12 28 L12 23 L18 23 Z';
const BERSERKER_NODE_IDS = ['reave','leap','weaponsSpecialist','bloodlust','whirlwind','cleave','fury','assault','battlecry','bloodHarvest','bloodrage','rampage'];
function swordSkillNodeIconSvg(nodeId){
  let extra = '';
  if(nodeId==='weaponsSpecialist'){
    // blade tip with small gleam lines, reading as "the blade itself" (the unlock)
    extra = '<path d="'+SWORD_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>'+
      '<line x1="20" y1="-4" x2="20" y2="0" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>'+
      '<line x1="14" y1="-1" x2="17" y2="3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></line>'+
      '<line x1="26" y1="-1" x2="23" y2="3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></line>';
  } else if(nodeId==='leap'){
    // sword with a big upward arc and landing burst
    extra = '<path d="'+SWORD_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+
      '<path d="M2 30 Q20 -8 38 30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="4 3"></path>'+
      '<path d="M32 26 L38 30 L31 33" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>';
  } else if(nodeId==='unbreakable'){
    // sword inside a bracing ring
    extra = '<circle cx="20" cy="18" r="16" fill="currentColor" opacity="0.15"></circle>'+
      '<path d="'+SWORD_ICON_PATH+'" fill="currentColor" opacity="0.4"></path>'+
      '<path d="M6 10 L20 4 L34 10 L34 22 Q34 32 20 36 Q6 32 6 22 Z" fill="none" stroke="currentColor" stroke-width="2"></path>';
  } else if(nodeId==='bloodlust'){
    // sword plus a blood droplet on the blade
    extra = '<path d="'+SWORD_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+
      '<path d="M20 10 C23 14 23 17 20 17 C17 17 17 14 20 10 Z" fill="currentColor"></path>';
  } else if(nodeId==='whirlwind'){
    // sword plus a circular motion arc around it (spin-in-place)
    extra = '<path d="'+SWORD_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+
      '<circle cx="20" cy="18" r="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="5 5"></circle>';
  } else if(nodeId==='cleave'){
    // sword plus a wide sweeping slash arc off to one side
    extra = '<path d="'+SWORD_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+
      '<path d="M2 8 A24 24 0 0 0 2 28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></path>';
  } else if(nodeId==='fury'){
    // two crossed swords, for dual-wielding
    extra = '<g transform="translate(20,18) rotate(-22) translate(-20,-18)"><path d="'+SWORD_ICON_PATH+'" fill="currentColor" opacity="0.45"></path></g>'+
      '<g transform="translate(20,18) rotate(22) translate(-20,-18)"><path d="'+SWORD_ICON_PATH+'" fill="currentColor" opacity="0.45"></path></g>';
  } else if(nodeId==='assault'){
    // ornate capstone sword -- bigger, with a rage-flame aura behind it
    extra = '<circle cx="20" cy="18" r="15" fill="currentColor" opacity="0.15"></circle>'+
      '<path d="'+SWORD_ICON_PATH+'" fill="currentColor" opacity="0.4"></path>'+
      '<circle cx="20" cy="18" r="4" fill="none" stroke="currentColor" stroke-width="1.6"></circle>';
  } else if(nodeId==='battlecry'){
    // sword with sound arcs
    extra = '<path d="'+SWORD_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+
      '<path d="M2 12 Q-4 18 2 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></path>'+
      '<path d="M38 12 Q44 18 38 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></path>'+
      '<path d="M-2 8 Q-10 18 -2 28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.6"></path>'+
      '<path d="M42 8 Q50 18 42 28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.6"></path>';
  } else if(nodeId==='bloodHarvest'){
    // sword with a droplet and a small orb (the health globe)
    extra = '<path d="'+SWORD_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+
      '<path d="M8 6 C11 10 11 13 8 13 C5 13 5 10 8 6 Z" fill="currentColor"></path>'+
      '<circle cx="31" cy="30" r="5" fill="currentColor" opacity="0.8"></circle>';
  } else if(nodeId==='bloodrage'){
    // sword with a jagged flame
    extra = '<path d="'+SWORD_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+
      '<path d="M20 2 C26 10 30 14 26 22 C24 18 22 18 20 22 C18 18 16 18 14 22 C10 14 16 10 20 2 Z" fill="currentColor" opacity="0.75"></path>';
  } else if(nodeId==='rampage'){
    // sword with stacked chevrons
    extra = '<path d="'+SWORD_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+
      '<path d="M6 30 L14 24 L22 30 M6 22 L14 16 L22 22 M6 14 L14 8 L22 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(9,2)"></path>';
  } else {
    extra = '<path d="'+SWORD_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>';
  }
  return '<svg class="treeNodeIconSvg" viewBox="-8 -8 56 56"><path d="'+SWORD_ICON_PATH+'" fill="none" stroke="currentColor" stroke-width="2"></path>'+extra+'</svg>';
}
// Templar tab (v56): a plain heraldic cross silhouette, same base-icon-shape
// idea as SHIELD_ICON_PATH/SWORD_ICON_PATH above, used for every node in
// the new cross-shaped Templar tree.
const CROSS_ICON_PATH = 'M15 2 L25 2 L25 12 L35 12 L35 22 L25 22 L25 36 L15 36 L15 22 L5 22 L5 12 L15 12 Z';
const TEMPLAR_NODE_IDS = ['squire','smite','vengeance','banner','bannerWar','bannerAegis','consecrate','judgment'];
function templarSkillNodeIconSvg(nodeId){
  const C = '<path d="'+CROSS_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>';
  let extra = '';
  if(nodeId==='squire'){
    extra = C + '<circle cx="9" cy="30" r="3" fill="currentColor"></circle><circle cx="31" cy="30" r="3" fill="currentColor"></circle>';
  } else if(nodeId==='smite'){
    // a bolt of light streaking off the cross
    extra = C + '<path d="M30 2 L22 16 L28 16 L20 34 L24 20 L18 20 Z" fill="currentColor"></path>';
  } else if(nodeId==='vengeance'){
    // cross with a flame
    extra = C + '<path d="M20 4 C26 12 29 16 25 24 C23 20 21 20 20 24 C19 20 17 20 15 24 C11 16 16 12 20 4 Z" fill="currentColor" opacity="0.8"></path>';
  } else if(nodeId==='banner'){
    // pole with a flag
    extra = C + '<line x1="14" y1="2" x2="14" y2="36" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></line><path d="M14 4 L32 9 L14 16 Z" fill="currentColor"></path>';
  } else if(nodeId==='bannerWar'){
    extra = C + '<line x1="14" y1="2" x2="14" y2="36" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></line><path d="M14 4 L32 9 L14 16 Z" fill="currentColor"></path><path d="M22 24 L34 36 M34 24 L22 36" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></path>';
  } else if(nodeId==='bannerAegis'){
    extra = C + '<line x1="14" y1="2" x2="14" y2="36" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></line><path d="M14 4 L32 9 L14 16 Z" fill="currentColor"></path><path d="M20 22 L34 22 L34 30 Q34 35 27 38 Q20 35 20 30 Z" fill="none" stroke="currentColor" stroke-width="2"></path>';
  } else if(nodeId==='consecrate'){
    // cross standing in a ring of holy ground
    extra = C + '<ellipse cx="20" cy="32" rx="18" ry="6" fill="none" stroke="currentColor" stroke-width="2"></ellipse><ellipse cx="20" cy="32" rx="10" ry="3" fill="currentColor" opacity="0.35"></ellipse>';
  } else if(nodeId==='judgment'){
    // capstone: pillars of light from above
    extra = '<circle cx="20" cy="18" r="15" fill="currentColor" opacity="0.15"></circle>' + C +
      '<line x1="9" y1="-6" x2="9" y2="8" stroke="currentColor" stroke-width="3" stroke-linecap="round"></line><line x1="20" y1="-8" x2="20" y2="6" stroke="currentColor" stroke-width="3" stroke-linecap="round"></line><line x1="31" y1="-6" x2="31" y2="8" stroke="currentColor" stroke-width="3" stroke-linecap="round"></line>';
  } else {
    extra = C;
  }
  return '<svg class="treeNodeIconSvg" viewBox="-8 -8 56 56"><path d="'+CROSS_ICON_PATH+'" fill="none" stroke="currentColor" stroke-width="2"></path>'+extra+'</svg>';
}
// Survivalist tab (v57, renamed/re-themed v79): a plain dagger silhouette,
// same base-icon-shape idea as SHIELD_ICON_PATH/SWORD_ICON_PATH/
// CROSS_ICON_PATH above, used for every node in the tree (Field Dress
// standalone; Poison Trap->Frost Trap and Evasion->Finesse->Vanish as its
// two descending chains). Kept the dagger base shape even though the new
// node set leans more "ranger survival kit" than "rogue" -- it's still a
// generic enough silhouette, and swapping the base shape purely for
// vibes would be a bigger, riskier change than this batch's scope calls
// for; only accents were retuned per-node below.
const DAGGER_ICON_PATH = 'M20 2 L23 2 L23 20 L20 26 L17 20 L17 2 Z M12 26 L28 26 L28 30 L12 30 Z M17 30 L23 30 L21 37 L19 37 Z';
const SURVIVALIST_NODE_IDS = ['survivalFieldDress','poisonTrap','evasion','frostTrap','finesse','vanish','explosiveTrap','trapMastery','survivalInstinct','opportunist'];
function survivalistSkillNodeIconSvg(nodeId){
  let extra = '';
  if(nodeId==='survivalFieldDress'){
    // dagger plus a small medical cross, for the self-heal channel
    extra = '<path d="'+DAGGER_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+
      '<path d="M17 -2 L23 -2 L23 2 L27 2 L27 8 L23 8 L23 12 L17 12 L17 8 L13 8 L13 2 L17 2 Z" fill="#7ad07a"></path>';
  } else if(nodeId==='poisonTrap'){
    // dagger plus a drop of poison off the tip (reuses the old Poison
    // Knives accent -- same "thrown poison" visual language)
    extra = '<path d="'+DAGGER_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>'+
      '<path d="M20 -2 C23 2 23 5 20 5 C17 5 17 2 20 -2 Z" fill="#7dd45a"></path>';
  } else if(nodeId==='evasion'){
    // dagger with motion/blur lines to one side, reading as a dodge-step
    extra = '<path d="'+DAGGER_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+
      '<line x1="2" y1="12" x2="10" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.7"></line>'+
      '<line x1="0" y1="19" x2="9" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.7"></line>'+
      '<line x1="2" y1="26" x2="10" y2="26" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.7"></line>';
  } else if(nodeId==='frostTrap'){
    // dagger plus a small snowflake accent, for the freeze/slow trap
    extra = '<path d="'+DAGGER_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>'+
      '<g stroke="#a9e4ff" stroke-width="1.6" stroke-linecap="round" opacity="0.85">'+
      '<line x1="20" y1="-4" x2="20" y2="6"></line><line x1="15" y1="-2" x2="25" y2="4"></line><line x1="25" y1="-2" x2="15" y2="4"></line></g>';
  } else if(nodeId==='finesse'){
    // two ghosted daggers, one faded behind, reading as a spare/2nd charge
    // (reuses the old Shadow Step "blink" accent -- same "a 2nd copy of
    // something exists" visual language, apt for a 2nd dodge charge)
    extra = '<g transform="translate(-7,3) scale(0.7)" transform-origin="20 18" opacity="0.3"><path d="'+DAGGER_ICON_PATH+'" fill="currentColor"></path></g>'+
      '<path d="'+DAGGER_ICON_PATH+'" fill="currentColor" opacity="0.45"></path>';
  } else if(nodeId==='explosiveTrap'){
    extra = '<path d="'+DAGGER_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+
      '<path d="M20 -6 L23 2 L31 0 L25 6 L31 12 L23 10 L20 18 L17 10 L9 12 L15 6 L9 0 L17 2 Z" fill="#ff8a3a"></path>';
  } else if(nodeId==='trapMastery'){
    extra = '<path d="'+DAGGER_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+
      '<circle cx="20" cy="18" r="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="4 3" opacity="0.8"></circle>'+
      '<path d="M20 4 L22 9 L28 9 L23 13 L25 19 L20 15 L15 19 L17 13 L12 9 L18 9 Z" fill="#ffd27a"></path>';
  } else if(nodeId==='survivalInstinct'){
    extra = '<path d="'+DAGGER_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+
      '<path d="M20 30 C6 20 8 8 15 8 C18 8 20 11 20 11 C20 11 22 8 25 8 C32 8 34 20 20 30 Z" fill="#e0586a" opacity="0.9"></path>';
  } else if(nodeId==='opportunist'){
    extra = '<path d="'+DAGGER_ICON_PATH+'" fill="currentColor" opacity="0.4"></path>'+
      '<path d="M4 30 Q14 14 34 10" fill="none" stroke="#ffd27a" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="3 3"></path>'+
      '<path d="M34 10 L27 9 L30 15 Z" fill="#ffd27a"></path>';
  } else if(nodeId==='vanish'){
    // ornate capstone dagger -- bigger, fading into a soft shadow aura
    extra = '<circle cx="20" cy="18" r="15" fill="currentColor" opacity="0.15"></circle>'+
      '<path d="'+DAGGER_ICON_PATH+'" fill="currentColor" opacity="0.4"></path>';
  } else {
    extra = '<path d="'+DAGGER_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>';
  }
  return '<svg class="treeNodeIconSvg" viewBox="-8 -8 56 56"><path d="'+DAGGER_ICON_PATH+'" fill="none" stroke="currentColor" stroke-width="2"></path>'+extra+'</svg>';
}
// Marksman tab (v58): a bow-and-arrow silhouette, same base-icon-shape idea
// as the other trees' icon sets -- every node draws the same bow arc + string,
// then adds its own accent (see each branch below).
const BOW_ICON_ARC = 'M15 3 C27 3 34 11 34 19 C34 27 27 35 15 35';
const MARKSMAN_NODE_IDS = ['bowExpert','rapidShot','multiShot','arrowEye','trueShot','preciseShot','rainOfArrows','aimedShot','longshot','deadeye'];
function marksmanSkillNodeIconSvg(nodeId){
  const bowBase = '<path d="'+BOW_ICON_ARC+'" fill="none" stroke="currentColor" stroke-width="2" opacity="0.9"></path>'+
    '<line x1="15" y1="3" x2="15" y2="35" stroke="currentColor" stroke-width="1.3" opacity="0.6"></line>';
  const arrow = (x1,y1,x2,y2)=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>'+
    '<path d="M'+x2+' '+y2+' L'+(x2-5)+' '+(y2-3.5)+' L'+(x2-5)+' '+(y2+3.5)+' Z" fill="currentColor"></path>';
  let extra = '';
  if(nodeId==='bowExpert'){
    // bow + single bold arrow with a damage glow behind it
    extra = '<circle cx="20" cy="19" r="15" fill="currentColor" opacity="0.15"></circle>'+arrow(7,19,29,19);
  } else if(nodeId==='rapidShot'){
    // bow + three arrows stacked, reading as a rapid sequential burst
    extra = arrow(6,12,26,12)+arrow(6,19,28,19)+arrow(6,26,26,26);
  } else if(nodeId==='multiShot'){
    // bow + three arrows fanned outward from one nock point
    extra = [-16,0,16].map(deg=>'<g transform="rotate('+deg+' 15 19)">'+arrow(7,19,29,19)+'</g>').join('');
  } else if(nodeId==='arrowEye'){
    // bow + arrow through a dashed reticle, for the crit-chance eye
    extra = arrow(7,19,27,19)+
      '<circle cx="27" cy="19" r="7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="3 3"></circle>';
  } else if(nodeId==='trueShot'){
    // bow + arrow with speed/motion lines trailing behind, for aim speed
    extra = arrow(9,19,29,19)+
      '<line x1="2" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.6"></line>'+
      '<line x1="0" y1="19" x2="8" y2="19" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.6"></line>'+
      '<line x1="2" y1="26" x2="9" y2="26" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.6"></line>';
  } else if(nodeId==='preciseShot'){
    // bigger glow behind a single red-tipped aimed arrow -- v79: kept this
    // ornate treatment even though it's no longer the tree's capstone
    // (see the tree's own top comment), it's still a strong late-tier node.
    extra = '<circle cx="20" cy="19" r="15" fill="currentColor" opacity="0.15"></circle>'+
      '<line x1="6" y1="19" x2="34" y2="19" stroke="#e2384f" stroke-width="2" stroke-linecap="round"></line>'+
      '<path d="M34 19 L27 14.5 L27 23.5 Z" fill="#e2384f"></path>';
  } else if(nodeId==='aimedShot'){
    extra = '<circle cx="20" cy="19" r="14" fill="currentColor" opacity="0.12"></circle>'+
      '<line x1="5" y1="19" x2="36" y2="19" stroke="#ff9a3a" stroke-width="2.4" stroke-linecap="round"></line>'+
      '<path d="M37 19 L29 14 L29 24 Z" fill="#ff9a3a"></path>'+
      '<circle cx="22" cy="19" r="3.5" fill="none" stroke="currentColor" stroke-width="1.4"></circle><circle cx="30" cy="19" r="3.5" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.6"></circle>';
  } else if(nodeId==='longshot'){
    extra = arrow(6,19,30,19)+
      '<path d="M8 28 L14 28 M17 28 L25 28 M28 28 L36 28" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.6"></path>'+
      '<path d="M8 9 L36 9" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 3" opacity="0.5"></path>';
  } else if(nodeId==='deadeye'){
    extra = '<circle cx="24" cy="19" r="10" fill="none" stroke="#e2384f" stroke-width="1.8"></circle>'+
      '<line x1="24" y1="5" x2="24" y2="33" stroke="#e2384f" stroke-width="1.4"></line><line x1="10" y1="19" x2="38" y2="19" stroke="#e2384f" stroke-width="1.4"></line>'+
      '<circle cx="24" cy="19" r="2.2" fill="#e2384f"></circle>';
  } else if(nodeId==='rainOfArrows'){
    // ornate NEW capstone -- several small arrows falling from above onto a glow
    extra = '<circle cx="20" cy="22" r="15" fill="currentColor" opacity="0.18"></circle>'+
      [-8,4,16].map(x=>'<line x1="'+x+'" y1="-4" x2="'+(x+4)+'" y2="10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>'+
        '<path d="M'+(x+4)+' 10 L'+(x)+' 6 L'+(x+8)+' 6 Z" fill="currentColor"></path>').join('');
  } else {
    extra = arrow(7,19,29,19);
  }
  return '<svg class="treeNodeIconSvg" viewBox="-8 -8 56 56">'+bowBase+extra+'</svg>';
}
// Hunter tab (v59): a paw-print silhouette (a pad + 4 toes), same
// base-icon-shape idea as the other trees' icon sets -- every node draws
// the same paw, then adds its own accent (see each branch below).
const HUNTER_NODE_IDS = ['cripplingShot','companionWolf','stunShot','packTactics','recall','companionBear','huntersBond','beastFury','huntersMark','markedPrey'];
function pawShapes(opacity, outline){
  const attrs = outline ? ' fill="none" stroke="currentColor" stroke-width="2"' : ' fill="currentColor" opacity="'+opacity+'"';
  let s = '<ellipse cx="20" cy="26" rx="9" ry="7"'+attrs+'></ellipse>';
  [[10,15,3.6],[17,8,3.8],[24,8,3.8],[31,15,3.6]].forEach(t=>{
    s += '<circle cx="'+t[0]+'" cy="'+t[1]+'" r="'+t[2]+'"'+attrs+'></circle>';
  });
  return s;
}
function hunterSkillNodeIconSvg(nodeId){
  const pawOutline = pawShapes(0, true);
  let extra = '';
  if(nodeId==='cripplingShot'){
    // paw + a small red bleed droplet, same droplet shape Poison Knives
    // uses for its own DoT, just recolored for Bleed.
    extra = pawShapes(0.35,false)+'<path d="M20 -2 C23 2 23 5 20 5 C17 5 17 2 20 -2 Z" fill="#b4293f"></path>';
  } else if(nodeId==='stunShot'){
    // paw + a small lightning-bolt accent for the stun
    extra = pawShapes(0.35,false)+'<path d="M22 1 L13 16 L18 16 L15 31 L27 13 L20 13 Z" fill="#f0d078"></path>';
  } else if(nodeId==='companionWolf'){
    // paw + a second, smaller ghosted paw behind it -- reads as "a pack",
    // and doubles up visually once Rank 5 grants the actual second wolf.
    extra = '<g transform="translate(-6,4) scale(0.65)" transform-origin="20 20" opacity="0.3">'+pawShapes(0.6,false)+'</g>'+pawShapes(0.4,false);
  } else if(nodeId==='packTactics'){
    // paw + a dashed arcing jump-arrow, for the leap-to-target attack
    extra = pawShapes(0.3,false)+'<path d="M6 30 Q20 4 34 30" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"></path>';
  } else if(nodeId==='huntersBond'){
    extra = pawShapes(0.3,false)+'<path d="M20 34 C8 26 9 16 14 16 C17 16 20 19 20 19 C20 19 23 16 26 16 C31 16 32 26 20 34 Z" fill="#e0586a" opacity="0.9"></path>';
  } else if(nodeId==='beastFury'){
    extra = pawShapes(0.3,false)+'<path d="M8 4 L14 16 M20 0 L20 14 M32 4 L26 16" stroke="#e0502a" stroke-width="2.4" stroke-linecap="round"></path>';
  } else if(nodeId==='huntersMark'){
    extra = pawShapes(0.3,false)+'<circle cx="20" cy="18" r="13" fill="none" stroke="#ff4a4a" stroke-width="2"></circle><line x1="20" y1="2" x2="20" y2="34" stroke="#ff4a4a" stroke-width="1.6"></line><line x1="4" y1="18" x2="36" y2="18" stroke="#ff4a4a" stroke-width="1.6"></line>';
  } else if(nodeId==='markedPrey'){
    extra = pawShapes(0.3,false)+'<circle cx="20" cy="18" r="10" fill="none" stroke="#ff4a4a" stroke-width="1.8"></circle><path d="M14 12 L26 24 M26 12 L14 24" stroke="#ff4a4a" stroke-width="2.4" stroke-linecap="round"></path>';
  } else if(nodeId==='recall'){
    // paw + a small circular "gather in" arrow, for the call-companions-back effect
    extra = pawShapes(0.3,false)+'<path d="M20 6 A13 13 0 1 1 8.5 24" fill="none" stroke="#7dd45a" stroke-width="2.2" stroke-linecap="round"></path>'+
      '<path d="M20 1 L20 11 L14 6 Z" fill="#7dd45a"></path>';
  } else if(nodeId==='companionBear'){
    // ornate capstone paw -- bigger, with a glow behind it
    extra = '<circle cx="20" cy="19" r="16" fill="currentColor" opacity="0.15"></circle>'+pawShapes(0.45,false);
  } else if(nodeId==='fieldDress'){
    // paw + a small green healer's cross -- kept for backward-compat only;
    // 'fieldDress' is no longer in HUNTER_NODE_IDS/this tree's node list
    // (see the tree's v80 top comment), so this branch is unreachable from
    // normal play, same "leave the old code in place" retirement pattern.
    extra = pawShapes(0.3,false)+'<path d="M17 13 L23 13 L23 19 L29 19 L29 25 L23 25 L23 31 L17 31 L17 25 L11 25 L11 19 L17 19 Z" fill="#7dd45a" opacity="0.85"></path>';
  } else {
    extra = pawShapes(0.35,false);
  }
  return '<svg class="treeNodeIconSvg" viewBox="-8 -8 56 56">'+pawOutline+extra+'</svg>';
}
// Djinn tab (Mystic's 1st tree, v75): a lightning-bolt silhouette, same
// base-icon-shape idea as every other tree's icon set -- every node draws
// the same bolt, then adds its own accent (see each branch below).
const LIGHTNING_ICON_PATH = 'M23 2 L9 21 L18 21 L14 38 L31 17 L20 17 Z';
const DJINN_NODE_IDS = ['lightningArc','lightningChain','nova','tornado','storm','hurricane','thunderstep','staticBuildup','stormcall','windrunner'];
function djinnSkillNodeIconSvg(nodeId){
  let extra = '';
  if(nodeId==='thunderstep'){
    extra = '<path d="'+LIGHTNING_ICON_PATH+'" fill="currentColor" opacity="0.35"></path><path d="M3 31 L15 31 M3 31 L8 27 M3 31 L8 35" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path><circle cx="34" cy="31" r="4" fill="none" stroke="currentColor" stroke-width="1.6"></circle>';
  } else
  if(nodeId==='lightningArc'){
    // plain solid bolt with a small radiating glow (the basic-attack override)
    extra = '<circle cx="20" cy="19" r="14" fill="currentColor" opacity="0.15"></circle>'+
      '<path d="'+LIGHTNING_ICON_PATH+'" fill="currentColor" opacity="0.4"></path>';
  } else if(nodeId==='lightningChain'){
    // bolt plus a second, smaller ghosted bolt beside it, linked by a dashed arc -- the chain jump
    extra = '<path d="'+LIGHTNING_ICON_PATH+'" fill="currentColor" opacity="0.4"></path>'+
      '<g transform="translate(14,2) scale(0.55)" opacity="0.55"><path d="'+LIGHTNING_ICON_PATH+'" fill="currentColor"></path></g>'+
      '<path d="M26 10 Q34 16 30 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 3"></path>';
  } else if(nodeId==='nova'){
    // bolt inside a dashed expanding ring -- the AoE nova pulse
    extra = '<path d="'+LIGHTNING_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>'+
      '<circle cx="20" cy="19" r="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="4 4"></circle>';
  } else if(nodeId==='tornado'){
    // bolt plus a small funnel/swirl motif beside it
    extra = '<path d="'+LIGHTNING_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+
      '<path d="M4 6 C4 6 34 6 34 10 C34 13 12 12 12 16 C12 19 28 18 28 22 C28 25 16 24 16 28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>';
  } else if(nodeId==='storm'){
    // bolt beneath a small storm-cloud shape
    extra = '<path d="'+LIGHTNING_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>'+
      '<path d="M8 8 C6 4 12 0 16 3 C18 0 26 0 27 5 C32 4 33 11 28 11 L9 11 C4 11 5 6 8 8 Z" fill="currentColor" opacity="0.55"></path>';
  } else if(nodeId==='hurricane'){
    // ornate capstone bolt -- bigger, with a bigger glow and encircling swirl
    extra = '<circle cx="20" cy="19" r="16" fill="currentColor" opacity="0.18"></circle>'+
      '<path d="'+LIGHTNING_ICON_PATH+'" fill="currentColor" opacity="0.45"></path>'+
      '<circle cx="20" cy="19" r="15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 5"></circle>';
  } else {
    extra = '<path d="'+LIGHTNING_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>';
  }
  return '<svg class="treeNodeIconSvg" viewBox="-8 -8 56 56"><path d="'+LIGHTNING_ICON_PATH+'" fill="none" stroke="currentColor" stroke-width="2"></path>'+extra+'</svg>';
}
// Elementalist tab (Mystic's 2nd tree, v76): a flame silhouette (base
// shape every node draws) paired with an ice-shard/snowflake accent that
// varies per node -- same "one base shape + per-node accent" idea Djinn's
// bolt icon set already established, just with 2 base motifs (fire+ice)
// instead of 1, to read as this tree's dual fire/ice theme at a glance.
const FLAME_ICON_PATH = 'M20 3 C11 13 7 21 7 28 C7 34.6 12.9 40 20 40 C27.1 40 33 34.6 33 28 C33 21 29 13 20 3 Z';
function iceShardSvg(cx, cy, scale, opacity){
  // a simple 6-point snowflake/shard, built from 3 crossing lines with
  // small side-ticks -- cheap to draw, reads clearly as "ice" at icon size.
  let s = '<g transform="translate('+cx+','+cy+') scale('+scale+')" opacity="'+opacity+'">';
  for(let i=0;i<3;i++){
    const a = i*Math.PI/3;
    const x1=Math.cos(a)*9, y1=Math.sin(a)*9, x2=-x1, y2=-y1;
    s += '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>';
  }
  s += '</g>';
  return s;
}
const ELEMENTALIST_NODE_IDS = ['elementalMastery','elementalPolarity','elementalExplosions','iceArmor','pyroTorrent','blizzard','fireball','iceBolt','immolate','flameVortex','permafrost','meteor'];
function elementalistSkillNodeIconSvg(nodeId){
  if(nodeId==='fireball' || nodeId==='iceBolt') return virtualSkillIconSvg(nodeId);
  let extra = '';
  if(nodeId==='immolate'){
    extra = '<path d="'+FLAME_ICON_PATH+'" fill="currentColor" opacity="0.4"></path><path d="M6 38 Q2 28 8 20 M34 38 Q38 28 32 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.7"></path>';
  } else if(nodeId==='flameVortex'){
    extra = '<path d="'+FLAME_ICON_PATH+'" fill="currentColor" opacity="0.3"></path><path d="M20 20 m0 0 q6 -2 8 4 q2 8 -8 10 q-14 2 -16 -10 q-2 -14 14 -16 q16 -2 20 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.8"></path>';
  } else if(nodeId==='permafrost'){
    extra = iceShardSvg(20, 17, 1.3, 0.6)+'<ellipse cx="20" cy="35" rx="17" ry="5" fill="currentColor" opacity="0.3"></ellipse><ellipse cx="20" cy="35" rx="17" ry="5" fill="none" stroke="currentColor" stroke-width="1.6"></ellipse>';
  } else
  if(nodeId==='elementalPolarity'){
    // half-flame, half-ice-shard -- the "polarity" between the 2 skills it grants
    extra = '<path d="'+FLAME_ICON_PATH+'" fill="currentColor" opacity="0.3" clip-path="inset(0 20px 0 0)"></path>'+
      iceShardSvg(28, 22, 1, 0.55);
  } else if(nodeId==='elementalExplosions'){
    // flame with small radiating burst ticks -- the splash-explosion
    extra = '<path d="'+FLAME_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>'+
      [0,60,120,180,240,300].map(a=>{
        const rad=a*Math.PI/180, r1=17, r2=23;
        const x1=20+Math.cos(rad)*r1, y1=20+Math.sin(rad)*r1, x2=20+Math.cos(rad)*r2, y2=20+Math.sin(rad)*r2;
        return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.6"></line>';
      }).join('');
  } else if(nodeId==='fireBomb'){
    // flame inside a dashed expanding ring -- self-centered burst, same motif Nova's ring uses
    extra = '<path d="'+FLAME_ICON_PATH+'" fill="currentColor" opacity="0.4"></path>'+
      '<circle cx="20" cy="22" r="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="4 4"></circle>';
  } else if(nodeId==='iceArmor'){
    // ice shard centered inside a plain hex/shield outline -- protective, defensive read
    extra = '<path d="M20 4 L34 12 L34 28 L20 36 L6 28 L6 12 Z" fill="currentColor" opacity="0.22"></path>'+
      iceShardSvg(20, 20, 1.3, 0.6);
  } else if(nodeId==='pyroTorrent'){
    // flame with parallel forward-streaming lines -- a channeled beam/torrent
    extra = '<path d="'+FLAME_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+
      '<line x1="26" y1="12" x2="37" y2="8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>'+
      '<line x1="28" y1="20" x2="39" y2="20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>'+
      '<line x1="26" y1="28" x2="37" y2="32" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>';
  } else if(nodeId==='blizzard'){
    // ornate capstone -- bigger ice shard with a glow + encircling swirl, mirroring Hurricane's capstone treatment
    extra = '<circle cx="20" cy="20" r="16" fill="currentColor" opacity="0.18"></circle>'+
      iceShardSvg(20, 20, 1.6, 0.55)+
      '<circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 5"></circle>';
  } else {
    extra = '<path d="'+FLAME_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>';
  }
  return '<svg class="treeNodeIconSvg" viewBox="-8 -8 56 56"><path d="'+FLAME_ICON_PATH+'" fill="none" stroke="currentColor" stroke-width="2"></path>'+extra+'</svg>';
}
// Fireball/Ice Bolt (v76): the 2 virtual active skills, used only for the
// Main/slot button icon once assigned (see skillSlotIconHtml) -- simpler,
// single-motif icons since they never appear as a tree-node icon.
function virtualSkillIconSvg(skillId){
  if(skillId==='iceBolt') return '<svg class="treeNodeIconSvg" viewBox="-8 -8 56 56"><path d="'+FLAME_ICON_PATH.replace(/20 3/,'20 3')+'" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"></path>'+iceShardSvg(20,22,1.5,0.85)+'</svg>';
  // fireball
  return '<svg class="treeNodeIconSvg" viewBox="-8 -8 56 56"><path d="'+FLAME_ICON_PATH+'" fill="currentColor" opacity="0.75" stroke="currentColor" stroke-width="1.4"></path></svg>';
}
// Necromancer tab (Mystic's 3rd tree, v78): a plain skull silhouette (base
// shape every node draws), same "one base shape + per-node accent" idea
// Djinn's bolt/Elementalist's flame icon sets already established.
const SKULL_ICON_PATH = 'M20 4 C29 4 35 11 35 20 C35 26 31 30 31 35 L31 40 L9 40 L9 35 C9 30 5 26 5 20 C5 11 11 4 20 4 Z';
function skullEyesSvg(){
  return '<circle cx="14" cy="19" r="3.6" fill="currentColor" opacity="0.85"></circle><circle cx="26" cy="19" r="3.6" fill="currentColor" opacity="0.85"></circle>';
}
const NECROMANCER_NODE_IDS = ['soulFire','fear','raiseDead','soulSap','sacrifice','demonBind','plague','deathBolt','soulGate','soulHunger','soulShield'];
function necromancerSkillNodeIconSvg(nodeId){
  let extra = '';
  if(nodeId==='soulFire'){
    // skull ringed by an outward burst
    extra = '<path d="'+SKULL_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>'+skullEyesSvg()+'<circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="1.8" opacity="0.8"></circle><circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 3" opacity="0.6"></circle>';
  } else if(nodeId==='fear'){
    // skull with wavy "recoiling" lines fleeing off either side
    extra = '<path d="'+SKULL_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+skullEyesSvg()+
      '<path d="M2 12 Q-4 20 2 28 M38 12 Q44 20 38 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.6"></path>';
  } else if(nodeId==='raiseDead'){
    // skull with a second, smaller ghosted skull behind it -- reads as "a pack of minions"
    extra = '<path d="'+SKULL_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>'+skullEyesSvg()+
      '<g transform="translate(-8,6) scale(0.55)" opacity="0.35"><path d="'+SKULL_ICON_PATH+'" fill="currentColor"></path></g>';
  } else if(nodeId==='soulSap'){
    // skull inside a dashed drifting-inward ring -- souls being drawn in
    extra = '<path d="'+SKULL_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+skullEyesSvg()+
      '<circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 4" opacity="0.7"></circle>';
  } else if(nodeId==='deathBolt'){
    extra = '<path d="'+SKULL_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+skullEyesSvg()+'<path d="M2 30 L14 24 L10 20 L28 10 L24 17 L36 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>';
  } else if(nodeId==='soulGate'){
    extra = '<path d="'+SKULL_ICON_PATH+'" fill="currentColor" opacity="0.25"></path><ellipse cx="20" cy="20" rx="9" ry="15" fill="none" stroke="currentColor" stroke-width="2.4"></ellipse><ellipse cx="20" cy="20" rx="4" ry="9" fill="currentColor" opacity="0.5"></ellipse>';
  } else if(nodeId==='soulHunger'){
    extra = '<path d="'+SKULL_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+skullEyesSvg()+'<path d="M12 28 Q20 36 28 28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path><path d="M20 2 Q25 9 20 12 Q15 9 20 2 Z" fill="currentColor"></path>';
  } else if(nodeId==='soulShield'){
    extra = '<path d="'+SKULL_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>'+skullEyesSvg()+'<path d="M20 2 L35 8 L35 20 Q35 31 20 38 Q5 31 5 20 L5 8 Z" fill="none" stroke="currentColor" stroke-width="2" opacity="0.8"></path>';
  } else if(nodeId==='sacrifice'){
    // skull with radiating burst ticks -- the minion detonation
    extra = '<path d="'+SKULL_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>'+skullEyesSvg()+
      [0,72,144,216,288].map(a=>{ const rad=a*Math.PI/180, r1=17, r2=23; const x1=20+Math.cos(rad)*r1, y1=20+Math.sin(rad)*r1, x2=20+Math.cos(rad)*r2, y2=20+Math.sin(rad)*r2;
        return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.6"></line>'; }).join('');
  } else if(nodeId==='demonBind'){
    // skull with small horns and glowing red eyes -- the demon
    extra = '<path d="'+SKULL_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>'+
      '<circle cx="14" cy="19" r="3.6" fill="#b4293f"></circle><circle cx="26" cy="19" r="3.6" fill="#b4293f"></circle>'+
      '<path d="M11 6 L15 12 M29 6 L25 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>';
  } else if(nodeId==='plague'){
    // ornate capstone -- bigger skull with a glow + encircling swirl, mirroring Hurricane/Blizzard's capstone treatment
    extra = '<circle cx="20" cy="20" r="16" fill="currentColor" opacity="0.18"></circle>'+
      '<path d="'+SKULL_ICON_PATH+'" fill="currentColor" opacity="0.45"></path>'+skullEyesSvg()+
      '<circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 5"></circle>';
  } else {
    extra = '<path d="'+SKULL_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>'+skullEyesSvg();
  }
  return '<svg class="treeNodeIconSvg" viewBox="-8 -8 56 56"><path d="'+SKULL_ICON_PATH+'" fill="none" stroke="currentColor" stroke-width="2"></path>'+extra+'</svg>';
}
// v272: one unique hand-drawn glyph per skill (all classes)
const V459_ICONS = {
  elementalMastery:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 30 C8 24 10 16 16 11 C16 17 19 19 21 19 C19 14 22 9 26 6 C26 13 31 16 31 23 C31 28 27 32 22 33"/><path d="M24 33 L24 22 M19.5 24.5 L28.5 30.5 M28.5 24.5 L19.5 30.5" stroke-width="1.8"/><circle cx="24" cy="27.5" r="1.3" fill="currentColor"/></g>',
  staticBuildup:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="20" cy="20" r="13" stroke-dasharray="3 4"/><path d="M22 9 L15 21 L21 21 L17 31" /><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="33" cy="27" r="1.5" fill="currentColor"/></g>',
  stormcall:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12 Q8 5 16 6 Q19 1 26 4 Q34 4 33 12 Z" fill="currentColor" fill-opacity="0.3"/><path d="M21 12 L16 22 L22 22 L18 32"/><ellipse cx="18" cy="35" rx="10" ry="3"/></g>',
  windrunner:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14 H22 Q28 14 28 9 Q28 5 24 5"/><path d="M4 21 H30 Q36 21 36 27 Q36 32 31 32"/><path d="M8 28 H18"/><path d="M27 12 L23 20 L28 20 L25 27" stroke-width="1.8"/></g>',
  meteor:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="25" cy="25" r="8" fill="currentColor" fill-opacity="0.35"/><path d="M19 19 L5 5 M22 16 L12 4 M16 22 L4 12"/><path d="M22 23 l3 -2 l2 3"/><path d="M6 36 Q20 30 36 36"/></g>',
  mirrorSteel:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 6 L26 6 L26 18 Q26 26 20 30 Q14 26 14 18 Z"/><path d="M20 10 L20 26" opacity="0.6"/><path d="M4 16 L10 16 M30 16 L36 16" /></g>',
  seismicAnchor:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4 L20 22"/><circle cx="20" cy="26" r="4"/><path d="M6 34 Q20 26 34 34"/><path d="M2 38 Q20 30 38 38" opacity="0.6"/></g>',
};
const UNIQUE_SKILL_ICONS = {"ironSkin":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 28 L6 18 L12 9 L24 6 L33 13 L34 26 L27 33 L14 33Z\" fill=\"currentColor\" fill-opacity=\"0.3\" /><path d=\"M12 9 L17 17 L6 18 M17 17 L24 6 M17 17 L22 25 L34 26 M22 25 L14 33\" /><\/g>","unbreakable":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 34 C6 24 5 14 11 10 C15 7 19 9 20 13 C21 9 25 7 29 10 C35 14 34 24 20 34Z\" fill=\"currentColor\" fill-opacity=\"0.3\" /><path d=\"M20 13 L17 19 L22 23 L19 29\" /><\/g>","shieldBash":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M16 10 A10 10 0 1 0 16 30 A10 10 0 1 0 16 10Z\" fill=\"currentColor\" fill-opacity=\"0.3\" /><circle cx=\"16\" cy=\"20\" r=\"3.5\" fill=\"currentColor\" fill-opacity=\"0.6\"/><path d=\"M30 11 L36 8 M31 20 H38 M30 29 L36 32\" /><\/g>","riposte":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 35 L27 13 M8 25 L16 33 M5 35 L3 37\" /><circle cx=\"4\" cy=\"36\" r=\"1.5\" fill=\"currentColor\" fill-opacity=\"1\"/><path d=\"M31 3 L32.5 7.5 L37 9 L32.5 10.5 L31 15 L29.5 10.5 L25 9 L29.5 7.5Z\" fill=\"currentColor\" fill-opacity=\"0.6\" /><path d=\"M22 36 Q35 35 36 22\" /><path d=\"M33 24 L36 21 L39 24\" /><\/g>","shieldThrow":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 35 Q5 14 21 11\" stroke-dasharray=\"3 3.5\"/><path d=\"M17 7 L22 11 L18 16\" /><path d=\"M29 6 A8 8 0 1 0 29 22 A8 8 0 1 0 29 6Z\" fill=\"currentColor\" fill-opacity=\"0.3\" /><circle cx=\"29\" cy=\"14\" r=\"3\"/><path d=\"M36 28 Q38 34 30 36\" opacity=\"0.6\"/><\/g>","bulwark":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M11 33 V13 H15 V8 H19 V13 H21 V8 H25 V13 H29 V33Z\" fill=\"currentColor\" fill-opacity=\"0.3\" /><path d=\"M11 13 H29 M16 24 H24 M20 24 V33\" /><path d=\"M6 16 Q3 22 6 28 M34 16 Q37 22 34 28 M2 12 Q-2 22 2 32 M38 12 Q42 22 38 32\" opacity=\"0.7\"/><path d=\"M3 36 H37\" /><\/g>","guardian":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 15 L25 20 L20 25 L15 20Z\" fill=\"currentColor\" fill-opacity=\"0.5\" /><path d=\"M5 5 L13 13 M5 5 H5 M5 5 V10 M5 5 H10\" /><path d=\"M35 5 L27 13 M35 5 V10 M35 5 H30\" /><path d=\"M20 36 V28 M15 32 L20 37 L25 32\" /><path d=\"M4 33 L12 25 M4 33 V28 M4 33 H9\" opacity=\"0.7\"/><path d=\"M36 33 L28 25 M36 33 V28 M36 33 H31\" opacity=\"0.7\"/><\/g>","leap":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 20 H29\" /><path d=\"M29 14 L38 20 L29 26Z\" fill=\"currentColor\" fill-opacity=\"0.5\" /><circle cx=\"11\" cy=\"20\" r=\"4\" fill=\"currentColor\" fill-opacity=\"0.3\"/><path d=\"M6 10 H18 M3 30 H15 M20 9 H27\" opacity=\"0.8\"/><\/g>","weaponsSpecialist":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 2 L23 7 V26 H17 V7Z\" fill=\"currentColor\" fill-opacity=\"0.3\" /><path d=\"M12 26 H28 M20 26 V33\" /><circle cx=\"20\" cy=\"35.5\" r=\"1.8\" fill=\"currentColor\" fill-opacity=\"1\"/><path d=\"M20 34 L8 12 M5 15 L11 10\" opacity=\"0.65\"/><path d=\"M20 34 L32 12 M29 10 L35 15\" opacity=\"0.65\"/><\/g>","rampage":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M11 24 C9 12 31 12 29 24 C29 27 27 27 26 28 L26 33 H14 V28 C13 27 11 27 11 24Z\" fill=\"currentColor\" fill-opacity=\"0.3\" /><circle cx=\"16\" cy=\"22\" r=\"2.6\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"24\" cy=\"22\" r=\"2.6\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M18 33 V29 M22 33 V29\" /><path d=\"M13 8 L20 3 L27 8\" /><\/g>","battlecry":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 16 H13 L26 8 V32 L13 24 H5Z\" fill=\"currentColor\" fill-opacity=\"0.3\" /><path d=\"M30 14 Q34 20 30 26 M33 9 Q40 20 33 31\" /><\/g>","bloodlust":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 11 Q20 22 35 11\" /><path d=\"M9 15 L15 18 L12 30Z\" fill=\"currentColor\" fill-opacity=\"0.8\" /><path d=\"M31 15 L25 18 L28 30Z\" fill=\"currentColor\" fill-opacity=\"0.8\" /><path d=\"M20 22 C23 26 24 28 24 30 C24 33 22 35 20 35 C18 35 16 33 16 30 C16 28 17 26 20 22Z\" fill=\"currentColor\" fill-opacity=\"0.4\" /><\/g>","bloodHarvest":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M16 14 A9 9 0 1 0 16 32 A9 9 0 1 0 16 14Z\" fill=\"currentColor\" fill-opacity=\"0.35\" /><path d=\"M11 21 Q12 17 16 17\" /><circle cx=\"31\" cy=\"12\" r=\"4\" fill=\"currentColor\" fill-opacity=\"0.5\"/><circle cx=\"29\" cy=\"28\" r=\"3\" fill=\"currentColor\" fill-opacity=\"0.5\"/><path d=\"M31 3 V6 M12 4 V8\" opacity=\"0.6\"/><path d=\"M30 20 V23\" opacity=\"0.6\"/><\/g>","whirlwind":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><g transform=\"rotate(0 20 20)\"><path d=\"M20 5 A15 15 0 0 1 34 14\"/><path d=\"M29 12 L35 14.5 L36 8\"/><\/g><g transform=\"rotate(60 20 20)\"><path d=\"M20 12 A8 8 0 0 1 27 16\" opacity=\"0.6\"/><\/g><g transform=\"rotate(120 20 20)\"><path d=\"M20 5 A15 15 0 0 1 34 14\"/><path d=\"M29 12 L35 14.5 L36 8\"/><\/g><g transform=\"rotate(180 20 20)\"><path d=\"M20 12 A8 8 0 0 1 27 16\" opacity=\"0.6\"/><\/g><g transform=\"rotate(240 20 20)\"><path d=\"M20 5 A15 15 0 0 1 34 14\"/><path d=\"M29 12 L35 14.5 L36 8\"/><\/g><g transform=\"rotate(300 20 20)\"><path d=\"M20 12 A8 8 0 0 1 27 16\" opacity=\"0.6\"/><\/g><circle cx=\"20\" cy=\"20\" r=\"2.5\" fill=\"currentColor\" fill-opacity=\"1\"/><\/g>","cleave":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 26 Q20 -4 37 26 Q20 12 3 26Z\" fill=\"currentColor\" fill-opacity=\"0.4\" /><circle cx=\"9\" cy=\"33\" r=\"2.2\" fill=\"currentColor\" fill-opacity=\"0.8\"/><circle cx=\"20\" cy=\"34\" r=\"2.2\" fill=\"currentColor\" fill-opacity=\"0.8\"/><circle cx=\"31\" cy=\"33\" r=\"2.2\" fill=\"currentColor\" fill-opacity=\"0.8\"/><\/g>","fury":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M22 4 Q26 20 12 36 Q18 20 22 4Z\" fill=\"currentColor\" stroke=\"none\" fill-opacity=\"0.6\" transform=\"translate(-9 0)\"/><path d=\"M22 4 Q26 20 12 36 Q18 20 22 4Z\" fill=\"currentColor\" stroke=\"none\" fill-opacity=\"1\" transform=\"translate(0 0)\"/><path d=\"M22 4 Q26 20 12 36 Q18 20 22 4Z\" fill=\"currentColor\" stroke=\"none\" fill-opacity=\"0.6\" transform=\"translate(9 0)\"/><path d=\"M6 8 L9 5 M34 33 L37 30\" opacity=\"0.6\"/><\/g>","bloodrage":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15 17 C21 25 25 29 25 32 C25 36 21 38 17 38 C13 38 9 36 9 32 C9 29 12 25 15 17Z\" fill=\"currentColor\" fill-opacity=\"0.4\" /><path d=\"M35 4 L19 22 M26 6 L33 13\" /><path d=\"M5 8 L9 12 M3 16 H8\" opacity=\"0.6\"/><\/g>","assault":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10 26 V21 C10 10 30 10 30 21 V26Z\" fill=\"currentColor\" fill-opacity=\"0.3\" /><path d=\"M10 26 H30 M20 26 V34 M15 21 H25\" /><path d=\"M10 17 C3 17 2 9 6 4 M30 17 C37 17 38 9 34 4\" /><\/g>","smite":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M24 3 L10 23 H19 L15 37 L31 15 H21Z\" fill=\"currentColor\" fill-opacity=\"0.4\" /><path d=\"M33 5 L36 2 M5 8 L2 6 M5 32 L2 34\" opacity=\"0.7\"/><\/g>","squire":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"20\" cy=\"12\" r=\"5.5\" fill=\"currentColor\" fill-opacity=\"0.3\"/><path d=\"M10 36 Q10 22 20 22 Q30 22 30 36Z\" /><circle cx=\"7\" cy=\"19\" r=\"3.5\" fill=\"currentColor\" fill-opacity=\"0.5\"/><path d=\"M2 34 Q2 25 7 25\" /><circle cx=\"33\" cy=\"19\" r=\"3.5\" fill=\"currentColor\" fill-opacity=\"0.5\"/><path d=\"M38 34 Q38 25 33 25\" /><\/g>","vengeance":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 3 C22 10 30 14 30 24 C30 31 25 36 20 36 C15 36 10 31 10 24 C10 19 13 16 15 12 C16 16 18 17 18 17 C18 12 18 8 20 3Z\" fill=\"currentColor\" fill-opacity=\"0.3\" /><path d=\"M20 20 C22 24 25 25 25 29 C25 32 23 33 20 33 C17 33 15 32 15 29 C15 26 18 25 20 20Z\" fill=\"currentColor\" fill-opacity=\"0.7\" /><\/g>","banner":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M11 4 V36 M5 36 H17\" /><path d=\"M11 6 L33 13 L11 20Z\" fill=\"currentColor\" fill-opacity=\"0.4\" /><\/g>","bannerWar":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 8 V37\" /><path d=\"M8 2 L11 7 H5Z\" /><path d=\"M8 10 H35 L30 15 L35 20 L30 25 L33 32 H8Z\" fill=\"currentColor\" fill-opacity=\"0.35\" /><path d=\"M15 15 L26 27 M26 15 L15 27\" /><\/g>","bannerAegis":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 6 H35 M5 3 V9 M35 3 V9\" /><path d=\"M10 6 V22 Q10 31 20 36 Q30 31 30 22 V6Z\" fill=\"currentColor\" fill-opacity=\"0.3\" /><path d=\"M20 13 V27 M13 20 H27\" /><\/g>","consecrate":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 31 A15 6 0 1 0 35 31 A15 6 0 1 0 5 31Z\" /><path d=\"M12 31 A8 3 0 1 0 28 31 A8 3 0 1 0 12 31Z\" fill=\"currentColor\" fill-opacity=\"0.4\" /><path d=\"M20 4 V27 M13 11 H27\" /><path d=\"M12 6 L10 3 M28 6 L30 3\" opacity=\"0.6\"/><\/g>","judgment":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 2 H11 L13 32 H3 Z\" fill=\"currentColor\" fill-opacity=\"0.35\" /><path d=\"M17 2 H23 L25 32 H15 Z\" fill=\"currentColor\" fill-opacity=\"0.35\" /><path d=\"M29 2 H35 L37 32 H27 Z\" fill=\"currentColor\" fill-opacity=\"0.35\" /><path d=\"M2 36 H38\" /><path d=\"M5 35 L3 31 M20 35 V32 M35 35 L37 31\" opacity=\"0.7\"/><\/g>","poisonTrap":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 34H35\"/><path d=\"M6 34Q8 22 20 22Q32 22 34 34\"/><path d=\"M9 34L12 28L15 34L18 28L21 34L24 28L27 34L30 28L33 34\" stroke-width=\"1.8\"/><\/g><path d=\"M6 34Q8 22 20 22Q32 22 34 34Z\" fill=\"currentColor\" fill-opacity=\"0.25\" stroke=\"none\" /><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M13 18Q10 14 13 10Q16 6 13 3\"/><path d=\"M27 18Q24 14 27 10Q30 6 27 3\"/><\/g><path d=\"M20 5C17 9 16 12 20 15C24 12 23 9 20 5Z\" fill=\"currentColor\" fill-opacity=\"0.6\" stroke=\"none\" />","frostTrap":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 34H35\"/><path d=\"M6 34Q8 22 20 22Q32 22 34 34\"/><path d=\"M9 34L12 28L15 34L18 28L21 34L24 28L27 34L30 28L33 34\" stroke-width=\"1.8\"/><\/g><path d=\"M6 34Q8 22 20 22Q32 22 34 34Z\" fill=\"currentColor\" fill-opacity=\"0.25\" stroke=\"none\" /><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M11.0 12.0L29.0 12.0\"/><path d=\"M15.5 4.2L24.5 19.8\"/><path d=\"M24.5 4.2L15.5 19.8\"/><path d=\"M25.5 12.0L27.8 10.1\" stroke-width=\"1.6\"/><path d=\"M25.5 12.0L27.8 13.9\" stroke-width=\"1.6\"/><path d=\"M22.8 16.8L25.6 17.8\" stroke-width=\"1.6\"/><path d=\"M22.8 16.8L22.2 19.7\" stroke-width=\"1.6\"/><path d=\"M17.2 16.8L17.8 19.7\" stroke-width=\"1.6\"/><path d=\"M17.2 16.8L14.4 17.8\" stroke-width=\"1.6\"/><path d=\"M14.5 12.0L12.2 13.9\" stroke-width=\"1.6\"/><path d=\"M14.5 12.0L12.2 10.1\" stroke-width=\"1.6\"/><path d=\"M17.2 7.2L14.4 6.2\" stroke-width=\"1.6\"/><path d=\"M17.2 7.2L17.8 4.3\" stroke-width=\"1.6\"/><path d=\"M22.8 7.2L22.2 4.3\" stroke-width=\"1.6\"/><path d=\"M22.8 7.2L25.6 6.2\" stroke-width=\"1.6\"/><\/g>","explosiveTrap":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 34H35\"/><path d=\"M6 34Q8 22 20 22Q32 22 34 34\"/><path d=\"M9 34L12 28L15 34L18 28L21 34L24 28L27 34L30 28L33 34\" stroke-width=\"1.8\"/><\/g><path d=\"M6 34Q8 22 20 22Q32 22 34 34Z\" fill=\"currentColor\" fill-opacity=\"0.25\" stroke=\"none\" /><path d=\"M20.0 2.0L21.7 6.8L26.4 4.6L24.2 9.3L29.0 11.0L24.2 12.7L26.4 17.4L21.7 15.2L20.0 20.0L18.3 15.2L13.6 17.4L15.8 12.7L11.0 11.0L15.8 9.3L13.6 4.6L18.3 6.8Z\" fill=\"currentColor\" fill-opacity=\"0.4\" stroke=\"none\" /><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20.0 2.0L21.7 6.8L26.4 4.6L24.2 9.3L29.0 11.0L24.2 12.7L26.4 17.4L21.7 15.2L20.0 20.0L18.3 15.2L13.6 17.4L15.8 12.7L11.0 11.0L15.8 9.3L13.6 4.6L18.3 6.8Z\"/><\/g>","survivalFieldDress":"<path d=\"M14 10A8 8 0 1 0 14 26A8 8 0 1 0 14 10Z\" fill=\"currentColor\" fill-opacity=\"0.3\" stroke=\"none\" /><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"14\" cy=\"18\" r=\"8\"/><circle cx=\"14\" cy=\"18\" r=\"3\"/><path d=\"M14 26H33V33H12Q8 33 8 29\"/><path d=\"M26 29.5H31M28.5 27V32\" stroke-width=\"1.8\"/><\/g>","evasion":"<path d=\"M24 11A5 6.5 0 1 0 24 24A5 6.5 0 1 0 24 11Z\" fill=\"currentColor\" fill-opacity=\"0.35\" stroke=\"none\" /><path d=\"M23 26A3.6 4 0 1 0 23 34A3.6 4 0 1 0 23 26Z\" fill=\"currentColor\" fill-opacity=\"0.35\" stroke=\"none\" /><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><ellipse cx=\"25\" cy=\"17.5\" rx=\"5\" ry=\"6.5\"/><ellipse cx=\"24\" cy=\"30\" rx=\"3.6\" ry=\"4\"/><path d=\"M4 14H13\"/><path d=\"M3 21Q9 18 12 22\"/><path d=\"M5 29H12\"/><\/g><circle cx=\"21\" cy=\"7.5\" r=\"1.8\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/><circle cx=\"26\" cy=\"6\" r=\"1.8\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/><circle cx=\"30\" cy=\"8.5\" r=\"1.7\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/>","survivalInstinct":"<path d=\"M17 32C5 24 5 11 12 11C15 11 17 13 17 15C17 13 19 11 22 11C29 11 29 24 17 32Z\" fill=\"currentColor\" fill-opacity=\"0.35\" stroke=\"none\" /><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17 32C5 24 5 11 12 11C15 11 17 13 17 15C17 13 19 11 22 11C29 11 29 24 17 32Z\"/><path d=\"M30 14L35 20L30 26\"/><path d=\"M26 17L29 20L26 23\" stroke-width=\"1.8\"/><\/g>","finesse":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M27 8A13 13 0 1 0 33 24\"/><path d=\"M26 25L33 26L33 18\"/><\/g><circle cx=\"20\" cy=\"20\" r=\"3.5\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/><path d=\"M20 6A14 14 0 0 1 34 20\" fill=\"currentColor\" fill-opacity=\"0\" stroke=\"none\" />","opportunist":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 34C10 34 10 25 17 25C21 25 23 26 24 27\"/><path d=\"M19 30L25 28L22 22\"/><\/g><path d=\"M29 2L31.8 9.2L39 12L31.8 14.8L29 22L26.2 14.8L19 12L26.2 9.2Z\" fill=\"currentColor\" fill-opacity=\"0.9\" stroke=\"none\" /><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 8L12 14\" stroke-width=\"1.8\"/><\/g>","trapMastery":"<path d=\"M20 8A9 9 0 1 0 20 26A9 9 0 1 0 20 8Z\" fill=\"currentColor\" fill-opacity=\"0.3\" stroke=\"none\" /><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M28.8 20.6L32.0 22.0\" stroke-width=\"3.6\"/><path d=\"M23.6 25.8L25.0 29.0\" stroke-width=\"3.6\"/><path d=\"M16.4 25.8L15.0 29.0\" stroke-width=\"3.6\"/><path d=\"M11.2 20.6L8.0 22.0\" stroke-width=\"3.6\"/><path d=\"M11.2 13.4L8.0 12.0\" stroke-width=\"3.6\"/><path d=\"M16.4 8.2L15.0 5.0\" stroke-width=\"3.6\"/><path d=\"M23.6 8.2L25.0 5.0\" stroke-width=\"3.6\"/><path d=\"M28.8 13.4L32.0 12.0\" stroke-width=\"3.6\"/><circle cx=\"20\" cy=\"17\" r=\"9.5\"/><circle cx=\"20\" cy=\"17\" r=\"3.5\"/><path d=\"M6 37L10 32L14 37L18 32L22 37L26 32L30 37L34 32\" stroke-width=\"1.8\"/><\/g>","vanish":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"20\" cy=\"9\" r=\"5\"/><path d=\"M10 25Q10 15 20 15Q30 15 30 25\"/><path d=\"M10 25V28M30 25V28M16 28V30\" stroke-dasharray=\"2 3.2\"/><\/g><path d=\"M20 4A5 5 0 1 0 20 14A5 5 0 1 0 20 4Z\" fill=\"currentColor\" fill-opacity=\"0.3\" stroke=\"none\" /><path d=\"M10 25Q10 15 20 15Q30 15 30 25Z\" fill=\"currentColor\" fill-opacity=\"0.3\" stroke=\"none\" /><circle cx=\"10\" cy=\"34\" r=\"2.4\" fill=\"currentColor\" fill-opacity=\"0.5\" stroke=\"none\"/><circle cx=\"18\" cy=\"36\" r=\"2\" fill=\"currentColor\" fill-opacity=\"0.4\" stroke=\"none\"/><circle cx=\"26\" cy=\"33\" r=\"2.6\" fill=\"currentColor\" fill-opacity=\"0.5\" stroke=\"none\"/><circle cx=\"33\" cy=\"37\" r=\"1.8\" fill=\"currentColor\" fill-opacity=\"0.4\" stroke=\"none\"/><circle cx=\"14\" cy=\"31\" r=\"1.6\" fill=\"currentColor\" fill-opacity=\"0.6\" stroke=\"none\"/>","bowExpert":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 5Q36 20 14 35\"/><path d=\"M14 5V35\" stroke-width=\"1.4\"/><path d=\"M5.0 20.0L24.0 20.0\"/><path d=\"M30.0 20.0L24.0 23.3L24.0 16.7Z\" fill=\"currentColor\"/><path d=\"M5.0 20.0L2.0 23.0\"/><path d=\"M5.0 20.0L2.0 17.0\"/><\/g><path d=\"M31 3L32.4 6.6L36 8L32.4 9.4L31 13L29.6 9.4L26 8L29.6 6.6Z\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\" />","arrowEye":"<path d=\"M3 20Q20 6 37 20Q20 34 3 20Z\" fill=\"currentColor\" fill-opacity=\"0.2\" stroke=\"none\" /><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 20Q20 6 37 20Q20 34 3 20Z\"/><circle cx=\"20\" cy=\"20\" r=\"5.5\"/><path d=\"M20 3V9M20 31V37\" /><path d=\"M5 20H10M30 20H35\" stroke-width=\"0\"/><\/g><circle cx=\"20\" cy=\"20\" r=\"2.2\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/>","rapidShot":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.0 10.0L24.0 10.0\"/><path d=\"M29.0 10.0L24.0 12.8L24.0 7.2Z\" fill=\"currentColor\"/><path d=\"M3.0 10.0L0.0 13.0\"/><path d=\"M3.0 10.0L0.0 7.0\"/><path d=\"M9.0 20.0L30.0 20.0\"/><path d=\"M35.0 20.0L30.0 22.8L30.0 17.2Z\" fill=\"currentColor\"/><path d=\"M9.0 20.0L6.0 23.0\"/><path d=\"M9.0 20.0L6.0 17.0\"/><path d=\"M3.0 30.0L24.0 30.0\"/><path d=\"M29.0 30.0L24.0 32.8L24.0 27.2Z\" fill=\"currentColor\"/><path d=\"M3.0 30.0L0.0 33.0\"/><path d=\"M3.0 30.0L0.0 27.0\"/><path d=\"M32 8H37M35 31H38\" stroke-width=\"1.6\" opacity=\"0.5\"/><\/g>","trueShot":"<path d=\"M17 13C8 12 5 25 7 32C9 35 15 33 17 29Z\" fill=\"currentColor\" fill-opacity=\"0.35\" stroke=\"none\" /><path d=\"M23 13C32 12 35 25 33 32C31 35 25 33 23 29Z\" fill=\"currentColor\" fill-opacity=\"0.35\" stroke=\"none\" /><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17 13C8 12 5 25 7 32C9 35 15 33 17 29Z\"/><path d=\"M23 13C32 12 35 25 33 32C31 35 25 33 23 29Z\"/><path d=\"M20 4V17M20 17Q18 20 16 22M20 17Q22 20 24 22\"/><\/g>","multiShot":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20.0 36.0L5.1 17.0\"/><path d=\"M2.0 13.0L7.2 15.3L2.9 18.7Z\" fill=\"currentColor\"/><path d=\"M20.0 36.0L12.0 12.5\"/><path d=\"M10.4 7.8L14.6 11.7L9.4 13.4Z\" fill=\"currentColor\"/><path d=\"M20.0 36.0L20.0 11.0\"/><path d=\"M20.0 6.0L22.8 11.0L17.2 11.0Z\" fill=\"currentColor\"/><path d=\"M20.0 36.0L28.0 12.5\"/><path d=\"M29.6 7.8L30.6 13.4L25.4 11.7Z\" fill=\"currentColor\"/><path d=\"M20.0 36.0L34.9 17.0\"/><path d=\"M38.0 13.0L37.1 18.7L32.8 15.3Z\" fill=\"currentColor\"/><\/g><circle cx=\"20\" cy=\"36\" r=\"2.2\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/>","aimedShot":"<circle cx=\"13.6\" cy=\"25.6\" r=\"4.5\" fill=\"currentColor\" fill-opacity=\"0.3\" stroke=\"none\"/><circle cx=\"21.6\" cy=\"18.6\" r=\"4.5\" fill=\"currentColor\" fill-opacity=\"0.3\" stroke=\"none\"/><circle cx=\"29.6\" cy=\"11.6\" r=\"4.5\" fill=\"currentColor\" fill-opacity=\"0.3\" stroke=\"none\"/><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"13.6\" cy=\"25.6\" r=\"4.5\"/><circle cx=\"21.6\" cy=\"18.6\" r=\"4.5\"/><circle cx=\"29.6\" cy=\"11.6\" r=\"4.5\"/><path d=\"M4.0 35.0L30.8 10.7\"/><path d=\"M36.0 6.0L33.4 13.6L28.2 7.8Z\" fill=\"currentColor\"/><path d=\"M4.0 35.0L3.8 39.2\"/><path d=\"M4.0 35.0L-0.2 34.8\"/><\/g>","longshot":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3.0 14.0L20.0 14.0\"/><path d=\"M26.0 14.0L20.0 17.3L20.0 10.7Z\" fill=\"currentColor\"/><path d=\"M3.0 14.0L0.0 17.0\"/><path d=\"M3.0 14.0L0.0 11.0\"/><circle cx=\"32\" cy=\"14\" r=\"5\"/><path d=\"M4 32H37M4 29V35M13 30.5V33.5M22 29V35M30 30.5V33.5M37 29V35\" stroke-width=\"1.8\"/><\/g><circle cx=\"32\" cy=\"14\" r=\"1.8\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/>","deadeye":"<circle cx=\"20\" cy=\"20\" r=\"7\" fill=\"currentColor\" fill-opacity=\"0.25\" stroke=\"none\"/><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M30.5 20.0L35.0 20.0\"/><path d=\"M27.4 27.4L30.6 30.6\"/><path d=\"M20.0 30.5L20.0 35.0\"/><path d=\"M12.6 27.4L9.4 30.6\"/><path d=\"M9.5 20.0L5.0 20.0\"/><path d=\"M12.6 12.6L9.4 9.4\"/><path d=\"M20.0 9.5L20.0 5.0\"/><path d=\"M27.4 12.6L30.6 9.4\"/><circle cx=\"20\" cy=\"20\" r=\"7\"/><\/g><circle cx=\"20\" cy=\"20\" r=\"3\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/>","rainOfArrows":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9.0 3.0L11.6 14.2\"/><path d=\"M13.0 20.0L8.4 14.9L14.8 13.4Z\" fill=\"currentColor\"/><path d=\"M20.0 5.0L22.8 18.1\"/><path d=\"M24.0 24.0L19.5 18.8L26.0 17.4Z\" fill=\"currentColor\"/><path d=\"M31.0 3.0L32.2 12.1\"/><path d=\"M33.0 18.0L28.9 12.5L35.5 11.6Z\" fill=\"currentColor\"/><path d=\"M3 35H37\"/><path d=\"M11 31L9 28M25 33L28 30\" stroke-width=\"1.8\"/><\/g>","cripplingShot":"<path d=\"M20 29L11 11L20 15L29 11Z\" fill=\"currentColor\" fill-opacity=\"0.4\" stroke=\"none\" /><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 29L11 11L20 15L29 11Z\"/><path d=\"M20 15V2\"/><path d=\"M11 11L8 17M29 11L32 17\"/><\/g><path d=\"M20 31C18 34 17.5 36 20 37.5C22.5 36 22 34 20 31Z\" fill=\"currentColor\" fill-opacity=\"0.9\" stroke=\"none\" /><circle cx=\"10\" cy=\"26\" r=\"1.8\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/><circle cx=\"30\" cy=\"25\" r=\"1.8\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/><circle cx=\"7\" cy=\"34\" r=\"1.4\" fill=\"currentColor\" fill-opacity=\"0.6\" stroke=\"none\"/>","companionWolf":"<path d=\"M8 5L15 12H25L32 5L34 21C34 28 27 34 20 37C13 34 6 28 6 21Z\" fill=\"currentColor\" fill-opacity=\"0.2\" stroke=\"none\" /><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 5L15 12H25L32 5L34 21C34 28 27 34 20 37C13 34 6 28 6 21Z\"/><path d=\"M11 19L17 22M29 19L23 22\"/><path d=\"M20 24V29\"/><\/g><path d=\"M16 28H24L20 33Z\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\" />","companionBear":"<path d=\"M20 10A12 12 0 1 0 20 34A12 12 0 1 0 20 10Z\" fill=\"currentColor\" fill-opacity=\"0.2\" stroke=\"none\" /><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"10\" cy=\"9\" r=\"4.5\"/><circle cx=\"30\" cy=\"9\" r=\"4.5\"/><circle cx=\"20\" cy=\"22\" r=\"12\"/><ellipse cx=\"20\" cy=\"27\" rx=\"5.5\" ry=\"4.2\"/><\/g><circle cx=\"14\" cy=\"19\" r=\"1.9\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/><circle cx=\"26\" cy=\"19\" r=\"1.9\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/><path d=\"M17.5 25H22.5L20 28Z\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\" />","huntersBond":"<path d=\"M14 22A6.5 5.5 0 1 0 14 33A6.5 5.5 0 1 0 14 22Z\" fill=\"currentColor\" fill-opacity=\"0.4\" stroke=\"none\" /><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><ellipse cx=\"14\" cy=\"27.5\" rx=\"6.5\" ry=\"5.5\"/><\/g><circle cx=\"6\" cy=\"19\" r=\"2.3\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/><circle cx=\"11\" cy=\"13.5\" r=\"2.3\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/><circle cx=\"18\" cy=\"13.5\" r=\"2.3\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/><circle cx=\"23\" cy=\"19\" r=\"2.3\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/><path d=\"M30 27C22 22 22 14 27 14C29 14 30 15 30 17C30 15 31 14 33 14C38 14 38 22 30 27Z\" fill=\"currentColor\" fill-opacity=\"0.8\" stroke=\"none\" />","stunShot":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><ellipse cx=\"20\" cy=\"9\" rx=\"13\" ry=\"4.5\" stroke-width=\"1.6\" stroke-dasharray=\"1 0\"/><path d=\"M3.0 31.0L29.0 31.0\"/><path d=\"M29.0 31.0L29.0 31.0L29.0 31.0Z\" fill=\"currentColor\"/><path d=\"M3.0 31.0L0.0 34.0\"/><path d=\"M3.0 31.0L0.0 28.0\"/><circle cx=\"31\" cy=\"31\" r=\"5\"/><\/g><circle cx=\"31\" cy=\"31\" r=\"5\" fill=\"currentColor\" fill-opacity=\"0.4\" stroke=\"none\"/><path d=\"M10 5.5L10.98 8.02L13.5 9L10.98 9.98L10 12.5L9.02 9.98L6.5 9L9.02 8.02Z\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\" /><path d=\"M30 4.5L30.98 7.02L33.5 8L30.98 8.98L30 11.5L29.02 8.98L26.5 8L29.02 7.02Z\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\" /><path d=\"M20 10.0L20.98 12.52L23.5 13.5L20.98 14.48L20 17.0L19.02 14.48L16.5 13.5L19.02 12.52Z\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\" />","packTactics":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 30Q10 4 26 22\"/><path d=\"M20 22L27 24L26 17\"/><path d=\"M29 31L35 37M35 31L29 37M32 28V40\" stroke-width=\"0\"/><path d=\"M33 26L36 22M34 32H38M31 35L34 39\" stroke-width=\"1.8\"/><\/g><path d=\"M31 26L32.4 29.6L36 31L32.4 32.4L31 36L29.6 32.4L26 31L29.6 29.6Z\" fill=\"currentColor\" fill-opacity=\"0.9\" stroke=\"none\" /><path d=\"M6 33L12 33\" fill=\"currentColor\" fill-opacity=\"0\" stroke=\"none\" />","beastFury":"<path d=\"M9 4Q17 18 11 36L7 36Q12 18 7 6Z\" fill=\"currentColor\" fill-opacity=\"0.8\" stroke=\"none\" /><path d=\"M20 3Q28 18 22 37L18 37Q23 18 18 5Z\" fill=\"currentColor\" fill-opacity=\"0.8\" stroke=\"none\" /><path d=\"M31 4Q39 18 33 36L29 36Q34 18 29 6Z\" fill=\"currentColor\" fill-opacity=\"0.8\" stroke=\"none\" />","huntersMark":"<path d=\"M13 5H27L20 14Z\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\" /><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 24V18H13M33 24V18H27M7 30V36H13M33 30V36H27\"/><circle cx=\"20\" cy=\"24\" r=\"4\"/><path d=\"M12 36Q12 30 20 30Q28 30 28 36\" stroke-width=\"0\"/><\/g><path d=\"M13 36Q13 30 20 30Q27 30 27 36Z\" fill=\"currentColor\" fill-opacity=\"0.5\" stroke=\"none\" />","markedPrey":"<path d=\"M9 17C9 9 14 5 20 5C26 5 31 9 31 17C31 21 29 22 28 24V30H12V24C11 22 9 21 9 17Z\" fill=\"currentColor\" fill-opacity=\"0.25\" stroke=\"none\" /><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 17C9 9 14 5 20 5C26 5 31 9 31 17C31 21 29 22 28 24V30H12V24C11 22 9 21 9 17Z\"/><path d=\"M16 30V26M20 30V26M24 30V26\" stroke-width=\"1.6\"/><path d=\"M13 14L18 19M18 14L13 19M22 14L27 19M27 14L22 19\" stroke-width=\"1.8\"/><\/g><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 35L12 38M36 35L28 38\" stroke-width=\"0\"/><\/g><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 20V22\" stroke-width=\"0\"/><\/g>","recall":"<path d=\"M26 18A8 8 0 1 0 26 34A8 8 0 1 0 26 18Z\" fill=\"currentColor\" fill-opacity=\"0.35\" stroke=\"none\" /><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"26\" cy=\"26\" r=\"8\"/><path d=\"M19 20L5 22V28L18 30\"/><path d=\"M33 7Q33 15 25 15\"/><path d=\"M28 10L24 15L29 19\" /><path d=\"M11 12Q11 6 20 6\" stroke-width=\"1.8\"/><\/g><circle cx=\"27\" cy=\"26\" r=\"2\" fill=\"currentColor\" fill-opacity=\"1\" stroke=\"none\"/>","lightningArc":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><path d=\"M4 36L12 28\"/><path d=\"M12 28L19 24L16 19L25 15L22 11L29 8\"/><circle cx=\"33\" cy=\"6\" r=\"3.5\" fill=\"currentColor\" fill-opacity=\"0.4\"/><path d=\"M7 25L10 27M13 34L15 31\"/><\/g>","lightningChain":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><circle cx=\"8\" cy=\"31\" r=\"4\" fill=\"currentColor\" fill-opacity=\"0.4\"/><circle cx=\"20\" cy=\"9\" r=\"4\" fill=\"currentColor\" fill-opacity=\"0.4\"/><circle cx=\"32\" cy=\"31\" r=\"4\" fill=\"currentColor\" fill-opacity=\"0.4\"/><path d=\"M10 27L16 22L13 18L18 13\"/><path d=\"M22 13L27 18L24 22L30 27\"/><\/g>","nova":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><circle cx=\"20\" cy=\"20\" r=\"4.5\" fill=\"currentColor\" fill-opacity=\"0.45\"/><path d=\"M29.0 20.0L37.0 20.0M26.4 26.4L32.0 32.0M20.0 29.0L20.0 37.0M13.6 26.4L8.0 32.0M11.0 20.0L3.0 20.0M13.6 13.6L8.0 8.0M20.0 11.0L20.0 3.0M26.4 13.6L32.0 8.0\"/><circle cx=\"20\" cy=\"20\" r=\"9\"/><\/g>","tornado":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><path d=\"M5 7H35L26 33H21L19 33H14Z\" fill=\"currentColor\" fill-opacity=\"0.25\"/><path d=\"M5 7H35M9 14H31M12 20H27M15 26H25\"/><path d=\"M20 33L23 37\"/><circle cx=\"36\" cy=\"18\" r=\"1.2\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"4\" cy=\"15\" r=\"1.2\" fill=\"currentColor\" stroke=\"none\"/><\/g>","thunderstep":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><path d=\"M13 5H21V16L30 21V28H13Z\" fill=\"currentColor\" fill-opacity=\"0.3\"/><path d=\"M19 8L16 15H20L17.5 22\"/><path d=\"M4 35H36\" stroke-dasharray=\"3 4\"/><circle cx=\"5\" cy=\"35\" r=\"2\" fill=\"currentColor\" fill-opacity=\"0.6\"/><circle cx=\"35\" cy=\"35\" r=\"2\" fill=\"currentColor\" fill-opacity=\"0.6\"/><\/g>","storm":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><path d=\"M10 20a5 5 0 0 1 1-9.8a8 8 0 0 1 15.5-1a5.5 5.5 0 0 1 2.5 10.8Z\" fill=\"currentColor\" fill-opacity=\"0.3\"/><path d=\"M21 23L16 31H22L18 38\"/><path d=\"M28 26L26 31M10 26L8 31\"/><\/g>","hurricane":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><circle cx=\"20\" cy=\"20\" r=\"17.5\" fill=\"currentColor\" fill-opacity=\"0.18\"/><path d=\"M25.0 20.0L25.2 21.1L25.2 22.3L24.8 23.5L24.2 24.7L23.3 25.7L22.1 26.6L20.8 27.2L19.2 27.6L17.6 27.5L15.9 27.1L14.3 26.4L12.8 25.2L11.6 23.8L10.7 22.0L10.1 20.0L10.0 17.9L10.4 15.7L11.2 13.6L12.5 11.7L14.3 10.0L16.3 8.8L18.7 7.9L21.3 7.6L24.0 7.8L26.6 8.6L29.0 10.0L31.1 11.9L32.9 14.3L34.1 17.0L34.7 20.0L34.7 23.1L34.1 26.3L32.7 29.2L30.7 31.9L28.2 34.2L25.2 35.9L21.8 36.9L18.2 37.2L14.5 36.8\"/><path d=\"M15.0 20.0L14.8 18.9L14.8 17.7L15.2 16.5L15.8 15.3L16.7 14.3L17.9 13.4L19.2 12.8L20.8 12.4L22.4 12.5L24.1 12.9L25.7 13.6L27.2 14.8L28.4 16.2L29.3 18.0L29.9 20.0L30.0 22.1L29.6 24.3L28.8 26.4L27.5 28.3L25.7 30.0L23.7 31.2L21.3 32.1L18.7 32.4L16.0 32.2L13.4 31.4L11.0 30.0L8.9 28.1L7.1 25.7L5.9 23.0L5.3 20.0L5.3 16.9L5.9 13.7L7.3 10.8L9.3 8.1L11.8 5.8L14.8 4.1L18.2 3.1L21.8 2.8L25.5 3.2\"/><circle cx=\"20\" cy=\"20\" r=\"2.8\" fill=\"currentColor\" fill-opacity=\"0.5\"/><\/g>","fireball":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><circle cx=\"26\" cy=\"26\" r=\"8\" fill=\"currentColor\" fill-opacity=\"0.35\"/><path d=\"M20 20C16 14 12 10 6 6M18 27C13 24 9 23 4 24M26 18C26 13 24 9 19 4\"/><circle cx=\"26\" cy=\"26\" r=\"3\" fill=\"currentColor\" stroke=\"none\"/><\/g>","iceBolt":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"rotate(-45 20 20)\"><path d=\"M37 20L28 15.5H8L3 20L8 24.5H28Z\" fill=\"currentColor\" fill-opacity=\"0.3\"/><path d=\"M28 15.5V24.5M6 20H37M8 15.5L5 11M8 24.5L5 29\"/><\/g>","elementalPolarity":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><circle cx=\"20\" cy=\"20\" r=\"16\"/><path d=\"M20 4C30 12 10 28 20 36A16 16 0 0 1 20 4Z\" fill=\"currentColor\" fill-opacity=\"0.3\"/><path d=\"M13 25C9 22 12 18 13 14C15 17 18 18 17 22C17 24 15 25 13 25Z\"/><path d=\"M28 16V24M24.5 18L31.5 22M24.5 22L31.5 18\"/><\/g>","immolate":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><path d=\"M20 2C22 9 33 12 33 25C33 32 27 38 20 38C13 38 7 32 7 25C7 17 12 15 13 9C16 11 17 12 18 12C18 8 19 5 20 2Z\" fill=\"currentColor\" fill-opacity=\"0.3\"/><circle cx=\"20\" cy=\"17\" r=\"3.2\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M14 33V26Q14 22 20 22Q26 22 26 26V33\" fill=\"currentColor\" stroke=\"none\"/><\/g>","elementalExplosions":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><path d=\"M20.0 3.0L24.0 13.1L34.7 11.5L28.0 20.0L34.7 28.5L24.0 26.9L20.0 37.0L16.0 26.9L5.3 28.5L12.0 20.0L5.3 11.5L16.0 13.1Z\" fill=\"currentColor\" fill-opacity=\"0.3\"/><circle cx=\"20\" cy=\"20\" r=\"3\" fill=\"currentColor\" stroke=\"none\"/><\/g>","iceArmor":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><path d=\"M9 7L16 5Q20 9 24 5L31 7L35 14L29 17V34H11V17L5 14Z\" fill=\"currentColor\" fill-opacity=\"0.3\"/><path d=\"M20 15L24 22L20 29L16 22Z\" fill=\"currentColor\" fill-opacity=\"0.4\"/><path d=\"M20 15V29M16 22H24\"/><\/g>","flameVortex":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><g transform=\"rotate(0 20 20) translate(20 7)\"><path d=\"M-5 3C-2 3 -1 -2 3 -5C3 -2 6 0 5 3C4 6 -3 6 -5 3Z\" fill=\"currentColor\" fill-opacity=\"0.4\"/><\/g><g transform=\"rotate(72 20 20) translate(20 7)\"><path d=\"M-5 3C-2 3 -1 -2 3 -5C3 -2 6 0 5 3C4 6 -3 6 -5 3Z\" fill=\"currentColor\" fill-opacity=\"0.4\"/><\/g><g transform=\"rotate(144 20 20) translate(20 7)\"><path d=\"M-5 3C-2 3 -1 -2 3 -5C3 -2 6 0 5 3C4 6 -3 6 -5 3Z\" fill=\"currentColor\" fill-opacity=\"0.4\"/><\/g><g transform=\"rotate(216 20 20) translate(20 7)\"><path d=\"M-5 3C-2 3 -1 -2 3 -5C3 -2 6 0 5 3C4 6 -3 6 -5 3Z\" fill=\"currentColor\" fill-opacity=\"0.4\"/><\/g><g transform=\"rotate(288 20 20) translate(20 7)\"><path d=\"M-5 3C-2 3 -1 -2 3 -5C3 -2 6 0 5 3C4 6 -3 6 -5 3Z\" fill=\"currentColor\" fill-opacity=\"0.4\"/><\/g><circle cx=\"20\" cy=\"20\" r=\"3\" fill=\"currentColor\" stroke=\"none\"/><\/g>","permafrost":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><path d=\"M20 4V18M14.8 7L25.2 15M14.8 15L25.2 7\"/><ellipse cx=\"20\" cy=\"30\" rx=\"16\" ry=\"6.5\" fill=\"currentColor\" fill-opacity=\".3\"/><path d=\"M9 29L11 21L14 28M26 29L29 22L31 29\" fill=\"currentColor\" fill-opacity=\"0.4\"/><path d=\"M16 32L20 29L24 33\"/><\/g>","pyroTorrent":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><path d=\"M3 16H8V24H3Z\" fill=\"currentColor\" fill-opacity=\"0.5\"/><path d=\"M8 17C16 16 22 10 34 7C30 12 36 15 33 20C36 25 30 28 34 33C22 30 16 24 8 23Z\" fill=\"currentColor\" fill-opacity=\"0.35\"/><path d=\"M12 20H26\"/><\/g>","blizzard":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"rotate(12 20 20)\"><path d=\"M10 6L13 12L10 24L7 12Z\" fill=\"currentColor\" fill-opacity=\"0.35\"/><path d=\"M21 12L24 18L21 32L18 18Z\" fill=\"currentColor\" fill-opacity=\"0.35\"/><path d=\"M31 5L34 11L31 22L28 11Z\" fill=\"currentColor\" fill-opacity=\"0.35\"/><circle cx=\"15\" cy=\"29\" r=\"1.4\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"29\" cy=\"31\" r=\"1.4\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"6\" cy=\"27\" r=\"1.4\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"35\" cy=\"26\" r=\"1.4\" fill=\"currentColor\" stroke=\"none\"/><\/g>","deathBolt":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><path d=\"M21 15A7 7 0 0 1 34 15V19H31V22H24V19H21Z\" fill=\"currentColor\" fill-opacity=\"0.3\"/><circle cx=\"25\" cy=\"15\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"30\" cy=\"15\" r=\"1.6\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M4 36L11 30L9 26L17 21\"/><path d=\"M5 27L8 25M12 37L14 35\"/><\/g>","raiseDead":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><path d=\"M3 35H37\"/><path d=\"M16 35V29M24 35V29\"/><ellipse cx=\"20\" cy=\"26\" rx=\"6.5\" ry=\"4\" fill=\"currentColor\" fill-opacity=\".3\"/><path d=\"M14.5 24L10 11M18 22L16 7M22 22L24 7M25.5 24L30 11M13.5 28L6 24\"/><\/g>","soulSap":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><path d=\"M20 3C24 8 24 12 20 15C16 12 16 8 20 3Z\" fill=\"currentColor\" fill-opacity=\"0.35\"/><path d=\"M7 7C9 18 15 22 17.5 26M33 7C31 18 25 22 22.5 26\"/><circle cx=\"20\" cy=\"31\" r=\"5\" fill=\"currentColor\" fill-opacity=\"0.4\"/><path d=\"M20 18V24\"/><\/g>","soulHunger":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><path d=\"M20 31C7 22 6 10 13 8C16 7 19 9 20 12C21 9 24 7 27 8C34 10 33 22 20 31Z\" fill=\"currentColor\" fill-opacity=\"0.3\"/><path d=\"M20 31V34\"/><path d=\"M20 35C22 37 22 38 20 39C18 38 18 37 20 35Z\" fill=\"currentColor\" stroke=\"none\"/><\/g>","soulGate":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><path d=\"M7 36V18A13 13 0 0 1 33 18V36\"/><path d=\"M11 36V19A9 9 0 0 1 29 19V36Z\" fill=\"currentColor\" fill-opacity=\"0.3\"/><path d=\"M17 17Q27 25 17 33M17 17V33\"/><path d=\"M12 25H26M23 22L26 25L23 28\"/><path d=\"M4 36H36\"/><\/g>","soulShield":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><ellipse cx=\"20\" cy=\"20\" rx=\"17\" ry=\"7\" transform=\"rotate(-26 20 20)\" stroke-opacity=\".5\"/><path d=\"M20 6L31 10V20C31 28 26 33 20 36C14 33 9 28 9 20V10Z\" fill=\"currentColor\" fill-opacity=\"0.3\"/><circle cx=\"4.5\" cy=\"25.1\" r=\"2.8\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"35.5\" cy=\"14.9\" r=\"2.8\" fill=\"currentColor\" stroke=\"none\"/><\/g>","demonBind":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><path d=\"M12 17C5 16 5 8 9 4M28 17C35 16 35 8 31 4\"/><path d=\"M11 16Q20 12 29 16L27 27Q20 33 13 27Z\" fill=\"currentColor\" fill-opacity=\"0.3\"/><path d=\"M14 21L18 22.5M26 21L22 22.5\"/><circle cx=\"20\" cy=\"36\" r=\"3.5\"/><\/g>","fear":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><circle cx=\"20\" cy=\"21\" r=\"14.5\" fill=\"currentColor\" fill-opacity=\"0.2\"/><path d=\"M9 12Q12 8 16 10M31 12Q28 8 24 10\"/><circle cx=\"14.5\" cy=\"18\" r=\"3.6\"/><circle cx=\"25.5\" cy=\"18\" r=\"3.6\"/><circle cx=\"14.5\" cy=\"18\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"25.5\" cy=\"18\" r=\"1.1\" fill=\"currentColor\" stroke=\"none\"/><ellipse cx=\"20\" cy=\"29\" rx=\"3.5\" ry=\"4.5\" fill=\"currentColor\" fill-opacity=\".5\"/><\/g>","sacrifice":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><path d=\"M20 5V35\"/><path d=\"M20 11Q10 11 9 18M20 11Q30 11 31 18\"/><path d=\"M20 18Q10 18 9 25M20 18Q30 18 31 25\"/><path d=\"M20 25Q10 25 9 32M20 25Q30 25 31 32\"/><path d=\"M3 5L7 9M37 5L33 9M3 35L7 31M37 35L33 31\"/><\/g>","plague":"<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" ><path d=\"M10 11V4H22V11M6 11H26\"/><circle cx=\"16\" cy=\"20\" r=\"8.5\" fill=\"currentColor\" fill-opacity=\"0.25\"/><circle cx=\"15\" cy=\"19\" r=\"3\"/><circle cx=\"15\" cy=\"19\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/><path d=\"M23 18C31 18 37 23 37 31C30 29 25 27 22 24Z\" fill=\"currentColor\" fill-opacity=\"0.4\"/><circle cx=\"7\" cy=\"32\" r=\"2.5\" fill=\"currentColor\" fill-opacity=\"0.4\"/><circle cx=\"14\" cy=\"35\" r=\"2\" fill=\"currentColor\" fill-opacity=\"0.4\"/><circle cx=\"5\" cy=\"25\" r=\"1.6\" fill=\"currentColor\" fill-opacity=\"0.4\"/><\/g>"};
Object.assign(UNIQUE_SKILL_ICONS, {"reave": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 33 L27 8 Q32 4 34 9 Q30 12 30 15 L12 36 Z\" fill=\"currentColor\" fill-opacity=\"0.3\"/><path d=\"M5 30 L13 37\"/><path d=\"M30 24 C32 27 32.5 29 32.5 30 C32.5 32 31.3 33 30 33 C28.7 33 27.5 32 27.5 30 C27.5 29 28 27 30 24Z\" fill=\"currentColor\" fill-opacity=\"0.8\"/><path d=\"M36 30 C37 32 37.3 33 37.3 33.6 C37.3 34.8 36.6 35.4 36 35.4 C35.4 35.4 34.7 34.8 34.7 33.6 C34.7 33 35 32 36 30Z\" fill=\"currentColor\" fill-opacity=\"0.8\"/><\/g>", "splinterShot": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 30 L17 20\"/><path d=\"M3 30 L2 26 M3 30 L7 31\"/><circle cx=\"19\" cy=\"19\" r=\"3\" fill=\"currentColor\" fill-opacity=\"0.6\"/><path d=\"M22 17 L34 6\"/><path d=\"M36 4 L35.5 9.5 L31 8Z\" fill=\"currentColor\"/><path d=\"M23 19 L37 19\"/><path d=\"M39 19 L34 21.5 L34 16.5Z\" fill=\"currentColor\"/><path d=\"M22 21 L33 32\"/><path d=\"M35 34 L29.6 33 L33 29.4Z\" fill=\"currentColor\"/><\/g>", "splinteredWounds": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 8 L16 18 M15 4 L20 16 M24 6 L22 17\" /><path d=\"M20 20 C25 26 27 29 27 31.5 C27 35 23.8 37 20 37 C16.2 37 13 35 13 31.5 C13 29 15 26 20 20Z\" fill=\"currentColor\" fill-opacity=\"0.45\"/><\/g>", "favouredFoe": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"20\" cy=\"20\" r=\"11\"/><circle cx=\"20\" cy=\"20\" r=\"4\" fill=\"currentColor\" fill-opacity=\"0.5\"/><path d=\"M20 4 V9 M20 31 V36 M4 20 H9 M31 20 H36\"/><path d=\"M4 34 L36 6\" stroke-width=\"1.6\"/><path d=\"M38 4 L37 10 L32 8Z\" fill=\"currentColor\"/><\/g>", "steadyBreathing": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 20 Q20 6 37 20 Q20 34 3 20Z\" fill=\"currentColor\" fill-opacity=\"0.18\"/><path d=\"M20 12 Q24 20 20 28 Q16 20 20 12Z\" fill=\"currentColor\" fill-opacity=\"0.8\"/><path d=\"M8 33 L13 27 M13 36 L18 29 M18 38 L23 31\" stroke-width=\"1.8\"/><\/g>", "mirage": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"26\" cy=\"9\" r=\"4\" fill=\"currentColor\" fill-opacity=\"0.6\"/><path d=\"M26 14 L26 26 M26 18 L20 22 M26 18 L32 22 M26 26 L22 36 M26 26 L30 36\"/><g opacity=\"0.4\" stroke-dasharray=\"2.5 2.5\"><circle cx=\"12\" cy=\"11\" r=\"4\"/><path d=\"M12 16 L12 28 M12 20 L6 24 M12 20 L18 24 M12 28 L8 37 M12 28 L16 37\"/><\/g><\/g>"});   // v454 new skills
Object.assign(UNIQUE_SKILL_ICONS, {   // v455
  sacredWeapon:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4 L23 9 L23 26 L17 26 L17 9 Z" fill="currentColor" fill-opacity="0.35"/><path d="M11 26 H29 M20 26 V34 M17 36 H23"/><path d="M8 10 L4 7 M32 10 L36 7 M6 18 H2 M34 18 H38 M9 26 L5 28 M31 26 L35 28" stroke-width="1.6"/></g>',
  auraOfRetribution:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 5 L31 9 V18 C31 26 26 31 20 34 C14 31 9 26 9 18 V9 Z" fill="currentColor" fill-opacity="0.25"/><path d="M20 12 V27 M14 17 H26"/><path d="M5 30 Q3 20 7 12 M35 30 Q37 20 33 12" stroke-width="1.6"/><path d="M4 14 L7 12 L8 15 M36 14 L33 12 L32 15" stroke-width="1.6"/></g>',
  explosiveShot:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 34 L20 18"/><path d="M4 34 L3 30 M4 34 L8 35"/><path d="M27 4 L29 10 L35 8 L31 13 L37 17 L30 18 L31 25 L26 20 L22 25 L22 18 L16 16 L22 13 L19 7 L25 10 Z" fill="currentColor" fill-opacity="0.45"/></g>'
});
function skillNodeIconSvg(nodeId){
  if(!UNIQUE_SKILL_ICONS[nodeId] && V459_ICONS[nodeId]) UNIQUE_SKILL_ICONS[nodeId] = V459_ICONS[nodeId];
  if(UNIQUE_SKILL_ICONS[nodeId]) return '<svg class="treeNodeIconSvg" viewBox="-3 -3 46 46" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">'+UNIQUE_SKILL_ICONS[nodeId]+'</svg>';
  if(BERSERKER_NODE_IDS.indexOf(nodeId)>=0) return swordSkillNodeIconSvg(nodeId);
  if(TEMPLAR_NODE_IDS.indexOf(nodeId)>=0) return templarSkillNodeIconSvg(nodeId);
  if(SURVIVALIST_NODE_IDS.indexOf(nodeId)>=0) return survivalistSkillNodeIconSvg(nodeId);
  if(MARKSMAN_NODE_IDS.indexOf(nodeId)>=0) return marksmanSkillNodeIconSvg(nodeId);
  if(HUNTER_NODE_IDS.indexOf(nodeId)>=0) return hunterSkillNodeIconSvg(nodeId);
  if(DJINN_NODE_IDS.indexOf(nodeId)>=0) return djinnSkillNodeIconSvg(nodeId);
  if(ELEMENTALIST_NODE_IDS.indexOf(nodeId)>=0) return elementalistSkillNodeIconSvg(nodeId);
  if(NECROMANCER_NODE_IDS.indexOf(nodeId)>=0) return necromancerSkillNodeIconSvg(nodeId);
  if(nodeId==='fireball' || nodeId==='iceBolt') return virtualSkillIconSvg(nodeId);
  let extra = '';
  if(nodeId==='ironSkin'){
    // plain solid shield / armor plate
    extra = '<path d="'+SHIELD_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>';
  } else if(nodeId==='unbreakable'){
    // shield with a soft glow/aura behind it
    extra = '<circle cx="20" cy="19" r="15" fill="currentColor" opacity="0.18"></circle>'+
            '<path d="'+SHIELD_ICON_PATH+'" fill="currentColor" opacity="0.3"></path>';
  } else if(nodeId==='shieldBash'){
    // shield with a small burst/explosion around it
    extra = '<path d="'+SHIELD_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>'+
      [0,45,90,135,180,225,270,315].map(a=>{
        const r1=19, r2=26, rad=a*Math.PI/180;
        const x1=20+Math.cos(rad)*r1, y1=19+Math.sin(rad)*r1;
        const x2=20+Math.cos(rad)*r2, y2=19+Math.sin(rad)*r2;
        return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></line>';
      }).join('');
  } else if(nodeId==='riposte'){
    // shield with a small reinforcing up-arrow / brace
    extra = '<path d="'+SHIELD_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>'+
      '<path d="M20 11 L26 19 L22 19 L22 27 L18 27 L18 19 L14 19 Z" fill="currentColor"></path>';
  } else if(nodeId==='shieldThrow'){
    // smaller shield offset to one side with motion lines beside it, as if thrown
    extra = '<g transform="translate(-4,0) scale(0.75)" transform-origin="20 19"><path d="'+SHIELD_ICON_PATH+'" fill="currentColor" opacity="0.35"></path></g>'+
      '<line x1="27" y1="10" x2="35" y2="7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></line>'+
      '<line x1="28" y1="19" x2="37" y2="19" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></line>'+
      '<line x1="27" y1="28" x2="35" y2="31" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></line>';
  } else if(nodeId==='guardian'){
    // ornate capstone shield -- bigger, with a small crown/star motif on top
    extra = '<path d="'+SHIELD_ICON_PATH+'" fill="currentColor" opacity="0.4"></path>'+
      '<path d="M14 8 L17 13 L20 6 L23 13 L26 8 L25 14 L15 14 Z" fill="currentColor"></path>'+
      '<circle cx="20" cy="21" r="4" fill="none" stroke="currentColor" stroke-width="1.6"></circle>';
  } else if(nodeId==='bulwark'){
    // heavy shield planted on the ground with shockwave arcs
    extra = '<path d="'+SHIELD_ICON_PATH+'" fill="currentColor" opacity="0.45"></path>'+
      '<path d="M0 34 Q20 44 40 34" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></path>'+
      '<path d="M-6 30 Q20 48 46 30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.6"></path>'+
      '<rect x="13" y="12" width="14" height="4" fill="currentColor"></rect>';
  } else {
    extra = '<path d="'+SHIELD_ICON_PATH+'" fill="currentColor" opacity="0.35"></path>';
  }
  // Extra margin around the 0-40 shield shape so decorations like Shield
  // Bash's burst can extend clearly outside the shield outline without
  // being clipped by the viewBox.
  return '<svg class="treeNodeIconSvg" viewBox="-8 -8 56 56"><path d="'+SHIELD_ICON_PATH+'" fill="none" stroke="currentColor" stroke-width="2"></path>'+extra+'</svg>';
}
function treeNodeIconHtml(p, TREES, treeKey, idx){
  const tree = TREES[treeKey];
  const node = tree.nodes[idx];
  const rank = p.skills[node.id]||0;
  const gb = gearSkillBonus(p, node.id);
  const available = canRankUp(p, treeKey, idx);
  const maxed = rank>=MAX_SKILL_RANK;
  let cls = 'treeNode iconNode ' + (maxed ? 'unlocked' : rank>0 ? 'unlocked' : available ? 'available' : gb>0 ? 'unlocked' : 'locked');   // v469: a staff-granted skill lights up
  const style = (tree.layout==='shield' || tree.layout==='sword' || tree.layout==='cross' || tree.layout==='cascade') ? (' style="grid-column:'+(node.col+1)+';grid-row:'+(node.row+1)+';"') : '';
  return '<div class="'+cls+'" data-tree="'+treeKey+'" data-idx="'+idx+'" data-nodeid="'+node.id+'"'+style+'>'+
    skillNodeIconSvg(node.id)+
    '<div class="treeNodeIconLabel">'+node.name+((rank>0||gb>0)?' '+rank+'/10'+(gb>0?' <span class="gearBonus">(+'+gb+')</span>':''):'')+'</div>'+
  '</div>';
}
const skillNodePopupOverlay = document.getElementById('skillNodePopupOverlay');
const skillNodePopupCard = document.getElementById('skillNodePopupCard');
function rankUpNode(treeKey, idx){
  if(!canRankUp(game.player, treeKey, idx)) return false;
  const node = treesForClass(game.player.cls)[treeKey].nodes[idx];
  game.player.skills[node.id] = (game.player.skills[node.id]||0) + 1;
  game.player.skillPoints = Math.max(0,(game.player.skillPoints||0)-1);
  if((node.id==='squire' || node.id==='companionWolf' || node.id==='companionBear' || node.id==='raiseDead') && (game.scene==='dungeon' || game.scene==='forest' || game.scene==='mountainpass' || game.scene==='highlands' || game.scene==='icyzone' || game.scene==='frosthold' || game.scene==='redridge' || game.scene==='redcrater')){
    ensureFollowers(game);
  }
  if(node.id==='smite' && game.player.skillSlots && game.player.skillSlots.main==='strike'){ game.player.skillSlots.main = 'smite'; try{ updateSkillSlotButtonsUI(); }catch(e){} }
  updateSkillButtonsVisibility();
  saveGame();
  return true;
}
function openSkillNodePopup(treeKey, idx){
  const p = game.player;
  const TREES = treesForClass(p.cls);
  const node = TREES[treeKey].nodes[idx];
  const rank = p.skills[node.id]||0;
  const gb = gearSkillBonus(p, node.id);
  const available = canRankUp(p, treeKey, idx);
  const maxed = rank>=MAX_SKILL_RANK;
  const lockedByPrereq = rank===0 && !prereqSatisfied(p, node);
  // v87: Multiple capstone allocation -- allow simultaneous allocation of
  // different capstone skills. Removed the previous restriction that locked
  // capstone nodes if ANY capstone had already been ranked, so now multiple
  // capstones can be active on the same character simultaneously.
  const capstoneLocked = false; // Capstones are no longer mutually exclusive
  let reqText;
  if(maxed) reqText = 'Rank 10/10 (Max)';
  else if(rank>=BASE_MAX_RANK && p.level<masteryReqLevel(rank+1)) reqText = 'Rank '+rank+'/10 &mdash; <span style="color:#e8c25a">Mastery rank '+(rank+1)+' unlocks at Lv.'+masteryReqLevel(rank+1)+'</span>';
  else if(rank>0) reqText = 'Rank '+rank+'/10';
  else if(capstoneLocked) reqText = 'Capstone already chosen elsewhere';
  else if(lockedByPrereq) reqText = 'Requires Lv.'+nodeLevelReq(node)+' &middot; '+prereqReqText(TREES, node).replace(/^Requires /,'');
  else reqText = 'Requires Lv.'+nodeLevelReq(node);
  document.getElementById('skillNodePopupIcon').innerHTML = skillNodeIconSvg(node.id);
  document.getElementById('skillNodePopupName').textContent = (node.capstone?'★ ':'')+node.name+((rank>0||gb>0)?' · Rank '+(rank+gb)+'/10'+(gb>0?' (+'+gb+' from equipment)':''):'');
  // node.desc is plain text, but nodeEffectText/reqText carry HTML entities
  // (&middot; etc, same as the old always-visible node text used) -- innerHTML
  // renders those correctly instead of showing the literal entity text.
  document.getElementById('skillNodePopupDesc').innerHTML = '<b style="color:'+(node.type==='active'?'#e8b04a':'#8fc0e8')+';letter-spacing:.06em;font-size:10px">'+(node.type==='active'?'ACTIVE SKILL':'PASSIVE SKILL')+'</b><br>'+node.desc;
  document.getElementById('skillNodePopupEffect').innerHTML = nodeEffectText(node, rank+gb);
  document.getElementById('skillNodePopupReq').innerHTML = reqText;
  const allocateBtn = document.getElementById('skillNodePopupAllocate');
  allocateBtn.style.display = available ? 'block' : 'none';
  allocateBtn.onclick = ()=>{
    if(rankUpNode(treeKey, idx)){
      renderSkillTree();
      openSkillNodePopup(treeKey, idx);
    }
  };
  // v74: Assign -- only for active skills the player has actually put at
  // least 1 rank into (an unranked active skill has nothing to trigger
  // yet), and never for preciseShot (see ASSIGN_EXCLUDE_IDS). Passives
  // never show this button at all.
  const assignBtn = document.getElementById('skillNodePopupAssign');
  // v76: Elemental Polarity gets its own pair of "Assign Fireball" /
  // "Assign Ice Bolt" buttons instead of the normal single Assign button
  // (it's in ASSIGN_EXCLUDE_IDS, so the block below always hides that one
  // for it) -- see the node's own comment for why it has no trigger of its
  // own. Both virtual skills open the exact same generic
  // openSkillAssignMenu(skillId) sub-menu any real active skill uses.
  const fireballBtn = document.getElementById('skillNodePopupAssignFireball');
  const iceBoltBtn = document.getElementById('skillNodePopupAssignIceBolt');
  if(false){
    fireballBtn.style.display = 'block';
    fireballBtn.onclick = ()=> openSkillAssignMenu('fireball');
    iceBoltBtn.style.display = 'block';
    iceBoltBtn.onclick = ()=> openSkillAssignMenu('iceBolt');
  } else {
    fireballBtn.style.display = 'none';
    iceBoltBtn.style.display = 'none';
  }
  if(node.type==='active' && ASSIGN_EXCLUDE_IDS.indexOf(node.id)<0 && (rank>=1 || effectiveRank(game.player,node.id)>=1)){
    assignBtn.style.display = 'block';
    assignBtn.onclick = ()=> openSkillAssignMenu(node.id);
  } else {
    assignBtn.style.display = 'none';
  }
  skillNodePopupOverlay.style.display = 'flex';
}
function closeSkillNodePopup(){
  skillNodePopupOverlay.style.display = 'none';
}
document.getElementById('skillNodePopupClose').addEventListener('click', closeSkillNodePopup);
// Clicking the dimmed overlay itself (not the card) also dismisses the
// popup -- standard modal-dismiss-on-outside-click, same idea used nowhere
// else in the UI yet, so this establishes the convention for future popups.
skillNodePopupOverlay.addEventListener('click', (ev)=>{
  if(ev.target===skillNodePopupOverlay) closeSkillNodePopup();
});

// ---------- v74: Assign-to-slot sub-menu ----------------------------------
// Opened from the skill-info popup's Assign button above. Lets the player
// choose which of the 4 assignable buttons (Main/1/2/3 -- Dodge is fixed
// and never offered here) the chosen skill goes to; picking one replaces
// whatever was there before (that old occupant just becomes unassigned,
// still selectable again later -- nothing about the skill itself is lost).
const skillAssignOverlay = document.getElementById('skillAssignOverlay');
let skillAssignPendingId = null;
const SKILL_ASSIGN_SLOT_KEYS = ['main','slot1','slot2','slot3'];
function skillAssignLabelFor(skillId){
  if(!skillId) return '(empty)';
  if(skillId==='strike') return 'Strike';
  return nodeDisplayName(treesForClass(game.player.cls), skillId);
}
function openSkillAssignMenu(skillId){
  // v87: Prevent invalid skill IDs from being assigned. Only allow skills
  // that are actual active skills with at least 1 rank, preventing bugs
  // where incorrect skills might be assigned to buttons.
  const p = game.player;
  if(!skillId) return; // reject null/undefined
  if(skillId!=='strike' && activeSkillRank(p, skillId)<1) return; // only ranked active skills (or strike always available)
  skillAssignPendingId = skillId;
  document.getElementById('skillAssignSub').textContent = 'Put "'+skillAssignLabelFor(skillId)+'" on which button?';
  SKILL_ASSIGN_SLOT_KEYS.forEach(slotKey=>{
    const curEl = document.getElementById('skillAssign'+slotKey.charAt(0).toUpperCase()+slotKey.slice(1)+'Cur');
    const occupant = p.skillSlots[slotKey];
    curEl.textContent = occupant ? ('Currently: '+skillAssignLabelFor(occupant)) : 'Currently: empty';
  });
  skillAssignOverlay.style.display = 'flex';
}
function closeSkillAssignMenu(){
  skillAssignOverlay.style.display = 'none';
  skillAssignPendingId = null;
}
function assignSkillToSlot(slotKey){
  if(!skillAssignPendingId || !game || !game.player) return;
  // v87: Skill button allocation fixes -- validate that only predefined
  // slots are allowed (restrict to main/slot1/slot2/slot3, no dynamic new
  // buttons are ever created). This prevents any edge cases where skills
  // might be assigned to undefined slots or new buttons created.
  if(!SKILL_ASSIGN_SLOT_KEYS.includes(slotKey)) return; // reject invalid slots
  const p = game.player;
  if(!p.skillSlots) p.skillSlots = {main:'strike', slot1:null, slot2:null, slot3:null};
  // A skill can only occupy one button at a time -- if it's already
  // assigned elsewhere, clear that old slot (Main falls back to Strike,
  // 1/2/3 just go empty) rather than letting it sit in two places.
  for(const k of SKILL_ASSIGN_SLOT_KEYS){
    if(p.skillSlots[k]===skillAssignPendingId) p.skillSlots[k] = (k==='main' ? 'strike' : null);
  }
  p.skillSlots[slotKey] = skillAssignPendingId;
  saveGame();
  showMsg(skillAssignLabelFor(skillAssignPendingId)+' assigned!', 0.9);
  closeSkillAssignMenu();
  closeSkillNodePopup();
}
document.getElementById('skillAssignMain').addEventListener('click', ()=>assignSkillToSlot('main'));
document.getElementById('skillAssignSlot1').addEventListener('click', ()=>assignSkillToSlot('slot1'));
document.getElementById('skillAssignSlot2').addEventListener('click', ()=>assignSkillToSlot('slot2'));
document.getElementById('skillAssignSlot3').addEventListener('click', ()=>assignSkillToSlot('slot3'));
document.getElementById('skillAssignCancel').addEventListener('click', closeSkillAssignMenu);
skillAssignOverlay.addEventListener('click', (ev)=>{
  if(ev.target===skillAssignOverlay) closeSkillAssignMenu();
});

function drawShieldConnectors(tree){
  const wrap = document.getElementById('treeShieldWrap');
  const svg = document.getElementById('treeShieldLines');
  if(!wrap || !svg) return;
  const wrapRect = wrap.getBoundingClientRect();
  svg.setAttribute('viewBox', '0 0 '+wrapRect.width+' '+wrapRect.height);
  // Defender/Survivalist/Marksman/Hunter ('shield' layout) keep the original
  // straight point-to-point line for every connector below, unchanged.
  // Berserker ('sword') and Templar ('cross') instead route any connector
  // whose two nodes share neither a row nor a column as an orthogonal
  // elbow (two right-angle segments) instead of a direct diagonal -- a
  // straight diagonal reads fine for a simple two-node link, but once a
  // node has 2+ children (or parents) at different columns, a bundle of
  // diagonals converging on/fanning from one point reads as an arrowhead,
  // not the T-shape/cross those two trees are meant to look like. The bend
  // point is placed on whichever end's row is shared by other sibling
  // nodes (the tree's horizontal crossbar row), so the elbow's horizontal
  // segment lands exactly on that row instead of cutting across it.
  const useElbow = (tree.layout==='sword' || tree.layout==='cross') && !tree.straight;
  let rowYCounts = null;
  if(useElbow){
    rowYCounts = {};
    tree.nodes.forEach(n=>{
      const el = wrap.querySelector('.treeNode[data-nodeid="'+n.id+'"]');
      if(!el) return;
      const r = el.getBoundingClientRect();
      const y = Math.round(r.top+r.height/2-wrapRect.top);
      rowYCounts[y] = (rowYCounts[y]||0)+1;
    });
  }
  let linesHtml = '';
  tree.nodes.forEach(node=>{
    (node.prereq||[]).forEach(reqId=>{
      const fromEl = wrap.querySelector('.treeNode[data-nodeid="'+reqId+'"]');
      const toEl = wrap.querySelector('.treeNode[data-nodeid="'+node.id+'"]');
      if(!fromEl || !toEl) return;
      const fr = fromEl.getBoundingClientRect(), tr = toEl.getBoundingClientRect();
      const lit = (((game.player.skills||{})[reqId]||0)>0) ? 'lit' : '';
      const x1 = fr.left+fr.width/2-wrapRect.left, y1 = fr.top+fr.height/2-wrapRect.top;
      const x2 = tr.left+tr.width/2-wrapRect.left, y2 = tr.top+tr.height/2-wrapRect.top;
      if(useElbow && Math.round(x1)!==Math.round(x2) && Math.round(y1)!==Math.round(y2)){
        const parentRowShared = (rowYCounts[Math.round(y1)]||0) > 1;
        const bx = parentRowShared ? x2 : x1;
        const by = parentRowShared ? y1 : y2;
        linesHtml += '<polyline class="'+lit+'" points="'+x1+','+y1+' '+bx+','+by+' '+x2+','+y2+'"></polyline>';
      } else {
        linesHtml += '<line class="'+lit+'" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'"></line>';
      }
    });
  });
  // Decorative (non-prerequisite) links, e.g. Defender's top row.
  (tree.links||[]).forEach(([aId,bId])=>{
    const aEl = wrap.querySelector('.treeNode[data-nodeid="'+aId+'"]');
    const bEl = wrap.querySelector('.treeNode[data-nodeid="'+bId+'"]');
    if(!aEl || !bEl) return;
    const ar = aEl.getBoundingClientRect(), br = bEl.getBoundingClientRect();
    const lit = (((game.player.skills||{})[aId]||0)>0 && ((game.player.skills||{})[bId]||0)>0) ? 'lit' : '';
    linesHtml += '<line class="'+lit+'" x1="'+(ar.left+ar.width/2-wrapRect.left)+'" y1="'+(ar.top+ar.height/2-wrapRect.top)+'" x2="'+(br.left+br.width/2-wrapRect.left)+'" y2="'+(br.top+br.height/2-wrapRect.top)+'"></line>';
  });
  svg.innerHTML = linesHtml;
}
function renderSkillTree(){
  const p = game.player;
  const TREES = treesForClass(p.cls);
  const keys = Object.keys(TREES);
  const activeKey = activeTreeTabKey(p);
  const tree = TREES[activeKey];
  treePointsText.textContent = (p.skillPoints>0) ? (p.skillPoints+' point'+(p.skillPoints>1?'s':'')+' available') : 'No points available';
  (function(){
    const mi = document.getElementById('masteryInfo'); if(!mi) return;
    const g1 = MASTERY_LEVEL_REQ[6], g2 = MASTERY_LEVEL_REQ[9];
    if(p.level < g1){ mi.style.display = 'none'; mi.innerHTML = ''; return; }   // v307: hidden until Lv.40
    mi.style.display = 'block';
    const pip = (lv,txt)=>'<span class="mPip'+(p.level>=lv?' on':'')+'"><b>'+txt+'</b> &middot; Lv.'+lv+(p.level>=lv?' &#10003;':'')+'</span>';
    mi.innerHTML = '<button type="button" class="mBtn" id="masteryBtn">&#9733; Mastery ranks '+(window.__masteryOpen?'&#9652;':'&#9662;')+'</button>'+
      (window.__masteryOpen ? '<div class="mSub">Ranks 1&ndash;5 are normal. Mastery ranks go beyond that, each adding +5% power, and unlock in two steps. They use the same skill points as everything else, so deepening a skill means not learning another.</div><div class="mPips">'+pip(g1,'Ranks 6&ndash;8')+pip(g2,'Ranks 9&ndash;10')+'</div>' : '');
    document.getElementById('masteryBtn').onclick = ()=>{ window.__masteryOpen = !window.__masteryOpen; renderSkillTree(); };
  })();
  treeTabsEl.innerHTML = keys.map(k=>'<div class="treeTabBtn'+(k===activeKey?' active':'')+'" data-tab="'+k+'">'+TREES[k].name+'</div>').join('');
  treeTabsEl.querySelectorAll('.treeTabBtn').forEach(el=>{
    el.addEventListener('click', ()=>{
      treeTabByClass[p.cls] = el.dataset.tab;
      renderSkillTree();
    });
  });
  if(tree.nodes.length===0){
    treeColsEl.innerHTML = '<div class="treeCol"><div class="treeComingSoon">Coming<br>Soon</div></div>';
  } else if(tree.layout==='shield' || tree.layout==='sword' || tree.layout==='cross' || tree.layout==='cascade'){
    // Defender/Berserker: icon-only nodes -- click an icon to pop up its info
    // instead of showing full text inline (see treeNodeIconHtml /
    // openSkillNodePopup). Berserker reuses the exact same wrap/lines/click
    // machinery as Defender's shield layout, just with a 5-column grid
    // (treeSwordGrid) instead of Defender's 3-column one, so its 6 nodes can
    // read as a sword silhouette (blade / crossguard / pommel) instead of a
    // shield (see .treeSwordGrid CSS and each node's row/col above).
    const nodesHtml = tree.nodes.map((node,idx)=>treeNodeIconHtml(p, TREES, activeKey, idx)).join('');
    // Djinn ('cascade') reuses Berserker's 5-column sword grid verbatim --
    // it needs the same wide column count to lay out its diagonal cascade
    // + branch, and drawShieldConnectors already draws it with plain
    // straight lines (not sword/cross's elbow routing), which is exactly
    // the "/" diagonal look the tree wants. No new CSS class needed.
    const gridClass = (tree.layout==='sword' || tree.layout==='cascade') ? 'treeSwordGrid' : 'treeShieldGrid';
    treeColsEl.innerHTML = '<div class="treeShieldWrap" id="treeShieldWrap">'+
      '<svg class="treeShieldLines" id="treeShieldLines"></svg>'+
      '<div class="'+gridClass+'">'+nodesHtml+'</div>'+
    '</div>';
    drawShieldConnectors(tree);
    treeColsEl.querySelectorAll('.treeNode.iconNode').forEach(el=>{
      el.addEventListener('click', ()=>{
        openSkillNodePopup(el.dataset.tree, parseInt(el.dataset.idx,10));
      });
    });
  } else {
    const nodesHtml = tree.nodes.map((node,idx)=>treeNodeHtml(p, TREES, activeKey, idx)).join('<div class="treeConnector"></div>');
    treeColsEl.innerHTML = '<div class="treeCol">'+nodesHtml+'</div>';
    treeColsEl.querySelectorAll('.treeNode.available').forEach(el=>{
      el.addEventListener('click', ()=>{
        const treeKey = el.dataset.tree, idx = parseInt(el.dataset.idx,10);
        if(rankUpNode(treeKey, idx)) renderSkillTree();
      });
    });
  }
}

function openSkillTree(){
  game.modalOpen = true; try{ sfxPlay('bookOpen', 1); }catch(e){}
  skillsBadge.style.display = 'none';
  skillTreeOverlay.style.display = 'flex';   // v314: show first so the connector lines can be measured
  renderSkillTree();
}
function closeSkillTree(){
  try{ if(skillTreeOverlay.style.display!=='none') sfxPlay('bookClose', 1); }catch(e){}
  skillTreeOverlay.style.display = 'none';
  game.modalOpen = false;
}
treeClose.addEventListener('click', closeSkillTree);
skillsBtn.addEventListener('click', ()=>{
  if(!game || !game.started || game.over) return;
  if(game.modalOpen) return;
  openSkillTree();
});

