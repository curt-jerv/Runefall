// ---------- Skill Tree ----------
// Three columns of abilities. Only Defender has skills so far; Berserker and
// Commander are placeholder columns coming later. Points are shared across
// all three trees and each column unlocks top-to-bottom.
// Warrior "Defender" tree is laid out to visually read as a shield: a wide
// top row of 3 nodes, a narrower middle row of 2 nodes, and a single
// capstone node at the bottom point. row/col (0-indexed) drive the CSS
// grid placement in renderSkillTree; prereq lists the node id(s) (by id,
// not tree position) that must be rank>=1 before this node can be started.
const SKILL_TREES = {
  defender: { name:'Defender', layout:'sword', straight:true, links:[['ironSkin','unbreakable'],['unbreakable','shieldBash']], nodes:[
    {id:'ironSkin',        name:'Iron Skin',        type:'passive', reqLevel:1, row:0, col:0, prereq:[], desc:'Your skin hardens like stone, turning aside blows that would fell lesser warriors.'},
    {id:'unbreakable',     name:'Unbreakable',      type:'passive', reqLevel:4, row:0, col:2, prereq:[], desc:'Pain feeds you, and when you are nearly dead you simply refuse to fall.'},
    {id:'shieldBash',      name:'Shield Slam',      type:'active', reqLevel:1, row:0, col:4, prereq:[], desc:'Slam your shield into the foes in front of you, knocking them down and feeding your rage.'},
    {id:'riposte',         name:'Riposte',          type:'passive', reqLevel:3, row:1, col:0, prereq:['ironSkin'],   desc:'Steel your resolve, turning near-misses into solid blocks.'},
    {id:'shieldThrow',     name:'Shield Throw',     type:'active', reqLevel:5, row:1, col:4, prereq:['shieldBash'], desc:'Hurl your shield to strike a foe, then let it return to your hand.'},
    {id:'seismicSlam',     name:'Seismic Slam',     type:'active', reqLevel:7, row:2, col:4, prereq:['shieldThrow'], desc:'Slam the ground with your shield, damaging and stunning nearby enemies. Elites and bosses are slowed instead of stunned.'},
    {id:'mirrorSteel',      name:'Mirror of Steel',  type:'active', reqLevel:7, row:2, col:0, prereq:['riposte'], desc:'Raise your shield to turn every blow back on its source: for a few seconds you reflect 100% of incoming melee and ranged damage, and heal for half of what you reflected.'},
    {id:'bulwark',         name:'Bulwark',          type:'active', reqLevel:9, row:3, col:1, prereq:['mirrorSteel'], desc:'Plant your feet and soak up the blows, then release them all in one thundering shockwave.'},
    {id:'seismicAnchor',    name:'Seismic Anchor',   type:'active', reqLevel:9, row:3, col:3, prereq:['seismicSlam'], desc:'Plant your shield and after a short delay tear the ground open: enemies within 6 metres are dragged to the epicentre, their casting is broken and they are slowed by 70% (fading over 3s).'},
    {id:'guardian',        name:'Juggernaut',       type:'active', reqLevel:12, row:4, col:2, prereq:['bulwark','seismicAnchor'], prereqMode:'or', capstone:true, desc:'Roar, fill your Rage and charge unstoppable, flattening everything in your path until the Rage runs dry.'},
  ]},
  // Berserker tree is laid out (v55, column-aligned in v60) to visually read
  // as a sword: a 3-node blade running straight down the spine (Weapon
  // Specialization at the tip, Bloodlust, then the blade-meets-crossguard
  // junction node, all sharing the same column so the connector between
  // them is a clean straight vertical line -- v55 originally offset Weapon
  // Specialization one column left of the spine, which drew as a diagonal
  // "arrow" into Bloodlust and looked broken, so v60 aligned it), a
  // crossguard row of 3 (Cleave / that same junction node, Whirlwind /
  // Fury) and a single pommel/capstone node (Assault) at the bottom point.
  // Same row/col grid-placement convention as Defender's shield layout,
  // just a 5-column grid instead of 3 (see .treeSwordGrid). The
  // Cleave/Fury -> Assault connectors are drawn as an orthogonal T-shape,
  // not a direct diagonal -- see drawShieldConnectors()'s elbow-routing
  // for the 'sword'/'cross' layouts.
  berserker: { name:'Berserker', layout:'sword', straight:true, nodes:[
    {id:'leap',              name:'Charge',               type:'active', reqLevel:2, row:1, col:1, prereq:['reave'],
      desc:'Charge across the battlefield and crash into your foes.'},
    {id:'rampage',           name:'Rampage',              type:'passive', reqLevel:4, row:1, col:3, prereq:['reave'],
      desc:'Every kill feeds the slaughter: you strike faster while the bodies keep falling, and you hit harder the more Rage you carry.'},
    {id:'reave',             name:'Reave',                type:'active', reqLevel:1, row:0, col:2, prereq:[],
      desc:'A vicious, tearing blow that leaves the wound bleeding.'},
    {id:'weaponsSpecialist', name:'Weapon Specialization', type:'passive', reqLevel:2, row:1, col:2, prereq:['reave'],
      desc:'Master heavier blades, learning to wield greatswords and twin swords alike.'},
    {id:'bloodlust',         name:'Bloodlust',            type:'passive', reqLevel:3, row:2, col:2, prereq:['weaponsSpecialist'],
      desc:'Drink deep of every wound you deal. Life leech, and below half life you turn Bloodied: leech surges and you strike faster. Your victims bleed life for you: more health potions, and Rage that fades out of battle returns as life regeneration.'},
    {id:'cleave',            name:'Cleave',               type:'passive', reqLevel:7, row:3, col:0, prereq:['whirlwind'],
      desc:'Sweep a heavy blade through the enemy ranks in one wide arc.'},
    {id:'whirlwind',         name:'Whirlwind',            type:'active', reqLevel:5, row:3, col:2, prereq:['bloodlust'],
      desc:'Become a whirling storm of steel, cutting down all who stand too close.'},
    {id:'fury',              name:'Fury',                 type:'passive', reqLevel:7, row:3, col:4, prereq:['whirlwind'],
      desc:'Dance between twin blades in a relentless flurry of strikes.'},
    {id:'assault',           name:'Assault',              type:'active', reqLevel:10, row:4, col:2, prereq:['whirlwind'], capstone:true,
      desc:'Fly into a berserker rage, thriving on pain dealt and pain endured, and end it in a burst of spent rage.'},
  ]},
  // Templar tree (v56) is laid out to visually read as a cross: Squire at
  // the top, a crossbar row of Offensive Stance / Commander / Guard Stance,
  // then Battlecry and the Rallying Cry capstone running down the shaft
  // below Commander. Same row/col grid-placement convention as Defender's
  // shield and Berserker's sword (see .treeShieldGrid CSS, reused here --
  // a cross fits the same 3-column grid, just with a 4th and 5th row).
  // v455 Templar layout (5-column grid):  Vengeance / Sacred Weapon + Aura of Retribution / Smite, Battle Standard, Commander /
  // Standard of War, Consecrate, Standard of Aegis / Judgment
  templar: { name:'Templar', layout:'sword', straight:true, links:[['sacredWeapon','auraOfRetribution']], nodes:[   // v480: Commander and Battle Standard swapped
    {id:'vengeance',    name:'Vengeance',    type:'active', reqLevel:1,  row:0, col:2, prereq:[],
      desc:'Strike with holy fire, driving your followers into a righteous frenzy.'},
    {id:'sacredWeapon', name:'Sacred Weapon', type:'passive', reqLevel:7, row:1, col:1, prereq:['vengeance'],
      desc:'Your blade is consecrated: every fourth Vengeance erupts in holy flame.'},
    {id:'auraOfRetribution', name:'Aura of Retribution', type:'passive', reqLevel:7, row:1, col:3, prereq:['vengeance'],
      desc:'Those who strike you are struck in turn by your faith.'},
    {id:'smite',        name:'Smite',        type:'active', reqLevel:14, row:2, col:0, prereq:['sacredWeapon'],
      desc:'Hurl a bolt of holy light that strikes the first foe and mends allies. Every third cast is a mighty Wrath.'},
    {id:'banner',       name:'Battle Standard', type:'active', reqLevel:21, row:3, col:2, prereq:['squire'],
      desc:'Plant a battle standard that bolsters you and your followers. Each one alternates between War (damage) and Aegis (defence).'},
    {id:'squire',       name:'Commander',    type:'passive', reqLevel:14, row:2, col:2, prereq:['smite','consecrate','sacredWeapon','auraOfRetribution'], prereqMode:'or',   // v489: diagonal links from Sacred Weapon / Aura
      desc:'Call squires to fight at your side and command them to greater strength. Most of your damage comes from them.'},
    {id:'bannerWar',    name:'Standard of War',   type:'passive', reqLevel:21, row:3, col:0, prereq:['banner'],
      desc:'War standards rouse you and your followers to greater damage and critical strikes.'},
    {id:'consecrate',   name:'Consecrate',   type:'active', reqLevel:14, row:2, col:4, prereq:['auraOfRetribution'],
      desc:'Sanctify the ground beneath you, burning foes and empowering your followers.'},
    {id:'bannerAegis',  name:'Standard of Aegis', type:'passive', reqLevel:21, row:3, col:4, prereq:['banner'],
      desc:'Aegis standards shield and mend you and your followers.'},
    {id:'judgment',     name:'Judgment',     type:'active', reqLevel:28, row:4, col:2, prereq:['banner'], capstone:true,
      desc:'Call down pillars of holy fire from the sky upon your foes.'},
  ]},
};
// The Ranger gets its own set of three trees instead of the Warrior's --
// all "Coming Soon" placeholders for now, same treatment the Warrior's
// trees got before they had skills in them.
// Survivalist tree (v79 -- RENAMED + fully reworked from the old
// "Assassin" tree; see this file's v79 changelog comment near
// ACTIVE_SKILL_REGISTRY for the full rename rationale). Key: assassin ->
// survivalist. Name: 'Assassin' -> 'Survivalist'. Old node ids poisonKnives/
// sap/execute/shadowStep are RETIRED from this tree the same way Trap was
// retired from Hunter in v59 -- their mechanic code, buttons, registry
// entries and p.skills fields are all left exactly as-is (for any already-
// saved character with old points in them) but none of the 4 is an
// allocatable node here anymore. 'evasion' and 'vanish' are CONTINUED (same
// ids, same underlying mechanism), just repositioned and re-tuned per this
// tree's new numbers -- see EVASION_SKILL_PCT/VANISH_* below.
// Layout (still the 3-column 'shield' grid, same shape the old Assassin
// tree already used -- top row of 3 independent nodes, a 2-node chain
// under the middle one, a 3-node chain under the right one):
//   Field Dress   Poison Trap   Evasion
//                      |           |
//                 Frost Trap    Finesse
//                                   |
//                                 Vanish (capstone)
// Field Dress (col0) has no prereq and nothing built on it -- a standalone
// entry point, same role Poison Knives had before. Poison Trap->Frost Trap
// is the middle column's 2-node chain. Evasion->Finesse->Vanish is the
// right column's 3-node chain, Vanish now explicitly capstone:true (single
// global capstone slot, same as every other tree -- see committedCapstone).
const RANGER_SKILL_TREES = {
  survivalist: { name:'Survivalist', layout:'shield', nodes:[
    {id:'poisonTrap',   name:'Poison Trap',  type:'active', reqLevel:1, row:0, col:0, prereq:[],
      desc:'Lay a venomous trap that blankets the area in toxic fumes.'},
    {id:'survivalFieldDress', name:'Field Dress', type:'active', reqLevel:1, row:0, col:1, prereq:[],
      desc:'Bind your wounds on the move, and patch up your companions too.'},
    {id:'evasion',      name:'Evasion',      type:'passive', reqLevel:1, row:0, col:2, prereq:[],
      desc:'Move like smoke, slipping past blows meant to end you.'},
    {id:'frostTrap',    name:'Frost Trap',   type:'active', reqLevel:7, row:1, col:0, prereq:['poisonTrap'],
      desc:'Set a trap of biting frost to root and chill your enemies.'},
    {id:'survivalInstinct', name:"Predator's Instinct", type:'passive', reqLevel:21, row:3, col:1, prereq:['survivalFieldDress'],
      desc:'Years in the wild have toughened your body, quickened your step and taught you where wounded prey is weakest.'},
    {id:'finesse',      name:'Finesse',      type:'passive', reqLevel:7, row:1, col:2, prereq:['evasion'],
      desc:'Refine your reflexes until dodging becomes second nature.'},
    {id:'explosiveTrap', name:'Explosive Trap', type:'active', reqLevel:28, row:4, col:0, prereq:['frostTrap'],
      desc:'Bury a charge that detonates in a burst of fire when enemies step close.'},
    {id:'opportunist',  name:'Opportunist',  type:'passive', reqLevel:21, row:3, col:2, prereq:['finesse'],
      desc:'Every dodge opens a window to punish the enemy that missed you.'},
    {id:'trapMastery',  name:'Trap Mastery', type:'passive', reqLevel:28, row:4, col:1, prereq:['explosiveTrap'],
      desc:'Your traps hit harder, reach farther, and you throw them faster.'},
    {id:'mirage',       name:'Mirage',       type:'passive', reqLevel:28, row:4, col:2, prereq:['opportunist'], capstone:true,
      desc:'Every dodge leaves a mirage of you behind to draw the enemy away.'},
  ] },
  // Marksman tree (v58, v79 tweak): mostly unchanged this batch. Two
  // changes only -- (1) Rapid Shot's text/mechanic reworked (same node
  // id/position, see rapidShotBurst below for the same-target armor-pen
  // tracking), and (2) a brand-new capstone, Rain of Arrows, added at
  // row4/col1 under Precise Shot. v79 JUDGMENT CALL on the OLD capstone
  // (Precise Shot): the brief calls for a "new capstone skill", read as a
  // replacement, but Precise Shot's mechanic (a permanent hold-to-aim
  // TRANSFORM of the STRIKE button -- see its own ASSIGN_EXCLUDE_IDS note)
  // is unusual enough, and still a perfectly strong node, that deleting it
  // outright would lose real content for no reason -- so its `capstone:true`
  // flag is simply STRIPPED (it stays exactly where it was, row3/col1, as
  // a freely-rankable non-capstone active) and Rain of Arrows becomes the
  // tree's new sole capstone one row further down, prereq:['preciseShot'].
  // This exactly mirrors the Hunter-tree Trap-retirement precedent (keep
  // working code in place, just change what's flagged/reachable) rather
  // than reworking Precise Shot's own mechanic, which was out of scope.
  marksman: { name:'Marksman', layout:'shield', nodes:[
    {id:'bowExpert',  name:'Bow Expert',  type:'passive', reqLevel:1,  row:0, col:1, prereq:[],
      desc:'Master the bow until every arrow flies true.'},
    // v495 layout:  Rapid Shot | Multi Shot | Splinter Shot  /  Favoured Foe | Predator's Instinct | Splintered Wounds
    //               Deadeye (middle)  /  Rain of Arrows (bottom-left) and Aimed Shot (bottom-right), both hanging off Deadeye
    {id:'rapidShot',  name:'Rapid Shot',  type:'active', reqLevel:7,  row:1, col:0, prereq:['bowExpert'],
      desc:'Loose a rapid volley of arrows before the enemy can react.'},
    {id:'multiShot',  name:'Multi Shot',  type:'active', reqLevel:7, row:1, col:1, prereq:['bowExpert'],
      desc:'Split your aim and loose a fan of arrows in a single motion.'},
    {id:'splinterShot', name:'Splinter Shot', type:'active', reqLevel:7, row:1, col:2, prereq:['bowExpert'],
      desc:'An arrow that bursts on impact, its splinters seeking out the foes nearby.'},
    {id:'favouredFoe', name:'Favoured Foe', type:'passive', reqLevel:14, row:2, col:0, prereq:['rapidShot'],
      desc:'Your eye finds the weak spot: sharper criticals, and the last arrow of a volley may punch clean through.'},
    {id:'steadyBreathing', name:'Steady Breathing', type:'passive', reqLevel:14, row:2, col:1, prereq:['multiShot'],
      desc:'Steady breathing keeps your strength up for the chase: your skills cost less Stamina and it comes back faster.'},
    {id:'splinteredWounds', name:'Splintered Wounds', type:'passive', reqLevel:14, row:2, col:2, prereq:['splinterShot'],
      desc:'Barbed splinters tear deeper and bleed the wounded.'},
    {id:'deadeye',    name:'Deadeye',     type:'passive', reqLevel:21, row:3, col:1, prereq:['steadyBreathing'],
      desc:'Critical hits hit harder and invigorate you, and distant targets fall all the same.'},
    {id:'rainOfArrows',name:'Rain of Arrows',type:'active', reqLevel:28, row:4, col:0, prereq:['deadeye'], capstone:true, capstoneShare:'marksman',
      desc:'Loose an arrow into the sky and call down a rain of arrows on the battlefield.'},
    {id:'aimedShot',  name:'Aimed Shot',  type:'active', reqLevel:28,  row:4, col:2, prereq:['deadeye'], capstone:true, capstoneShare:'marksman',
      desc:'Draw fully and loose a shot that punches through a line of enemies.'},
  ] },
  // Hunter tree (v59, fully re-laid-out in v80) reproduces the brief's own
  // ASCII diagram on the same 3-column row/col 'shield' grid every other
  // Ranger tree already uses:
  //   Crippling Shot (col0,row0)   Summon Wolf (col1,row0)
  //          |                            |
  //   Stun Shot (col0,row1)        Pack Tactics (col1,row1)
  //                                        |
  //                                 Recall (col1,row2)
  //                                        |
  //                              Summon Bear (col1,row3, capstone)
  // Crippling Shot -> Stun Shot (col0) is a 2-node DEAD-END branch with no
  // prereq off it, no child below it -- exactly the same "standalone
  // branch off the grid" technique Survivalist's Field Dress (v79) and
  // the pre-v80 Hunter tree's own Field Dress both used for a childless
  // node, just extended one row since Stun Shot itself has a prereq
  // (Crippling Shot) even though nothing chains off Stun Shot in turn.
  // Summon Wolf -> Pack Tactics -> Recall -> Summon Bear (col1) is the
  // tree's main spine and single capstone column, matching the diagram's
  // "node 5 continues down from node 4's column, not node 3's" note.
  // Summon Wolf (v80): reworked from a passive auto-summon-on-rank skill
  // into a real ACTIVE, WOLF-button-triggered (re)summon -- see
  // ACTIVE_SKILL_REGISTRY's companionWolf entry and the wantSummonWolf
  // handler below. It still reuses the exact same companionWolf id and
  // the pre-existing wolf-companion follower mechanics (makeFollower/
  // followerDmg/followerMaxHp/the per-frame follower AI), only the
  // ACTIVATION MODEL (trigger+cooldown instead of ensureFollowers'
  // automatic per-rank sync) changed -- see ensureFollowers' own comment.
  // Summon Bear stays exactly as it already was: PASSIVE, no registry
  // entry, auto-summoned via ensureFollowers once ranked (unchanged) --
  // and it was ALREADY this tree's capstone pre-v80, so this is a
  // continuation/retune of the existing capstone, not a reassignment,
  // just moved one row down to make room for Recall.
  // JUDGMENT CALL: SKILL_ROW_LEVEL_REQ (near canRankUp/nodeLevelReq) forces
  // a MINIMUM required level per row regardless of a node's own reqLevel
  // ([1,7,14,28] for rows 0-3) -- since the diagram genuinely needs a 4th
  // row (Recall at row2, Summon Bear now at row3) to fit Recall between
  // Pack Tactics and the capstone, Summon Bear's effective level
  // requirement rises from 14 (its old row2 spot) to 28 (matching every
  // other 4-row-deep tree's capstone, e.g. Djinn's Hurricane) -- each
  // node's own reqLevel field below is set to match that real effective
  // number rather than leaving a misleadingly-lower raw value in place.
  // Field Dress is RETIRED from this tree in this rework (its mechanic,
  // button, registry entry, cooldown state and p.skills field are all
  // left completely intact for any already-saved character with points
  // in the OLD Hunter fieldDress node -- see this file's fieldDress-
  // related code/comments, all untouched) -- it now lives exclusively as
  // Survivalist's own 'survivalFieldDress' node (v79). This is the exact
  // same "leave old implementation code in place, just drop it from the
  // tree's own node list" precedent v79 used to retire poisonKnives/sap/
  // execute/shadowStep from Survivalist, itself inherited from how Trap
  // was retired from this very tree back in v59.
  hunter: { name:'Hunter', layout:'shield', nodes:[
    {id:'cripplingShot', name:'Crippling Shot', type:'active', reqLevel:1,  row:0, col:0, prereq:[],
      desc:'Loose a barbed arrow that leaves a festering wound.'},
    {id:'companionWolf', name:'Summon Wolf',    type:'passive', reqLevel:7,  row:1, col:1, prereq:[],
      desc:'A loyal wolf hunts at your side. Respawns after 5 seconds if fallen.'},
    {id:'huntersBond',   name:"Hunter's Bond",  type:'passive', reqLevel:7,  row:1, col:2, prereq:['companionWolf'],   // v489: beside Summon Wolf, linked to it
      desc:'The bond with your companions makes them fiercer and sturdier.'},
    {id:'stunShot',      name:'Stun Shot',      type:'active', reqLevel:7,  row:1, col:0, prereq:['cripplingShot'],
      desc:'Fire a heavy arrow that rattles a foe senseless.'},
    {id:'packTactics',   name:'Ambush',          type:'active', reqLevel:14, row:2, col:1, prereq:['companionWolf'],
      desc:'Send your companions leaping onto your target for a savage ambush.'},
    {id:'beastFury',     name:'Beast Fury',     type:'active', reqLevel:14, row:2, col:2, prereq:['huntersBond'],   // v489: one row down
      desc:'Drive your companions into a frenzy, fighting alongside them.'},
    {id:'explosiveShot', name:'Explosive Shot', type:'active', reqLevel:21, row:3, col:0, prereq:['stunShot'],
      desc:'A fire-tipped arrow that bursts into flame on impact.'},
    {id:'huntersMark',   name:"Hunter's Mark",  type:'active', reqLevel:21, row:3, col:2, prereq:['beastFury'],
      desc:'Mark a target; you and your pack deal more damage to it.'},
    {id:'recall',        name:'Recall',         type:'active', reqLevel:21, row:3, col:1, prereq:['packTactics'],
      desc:'Call your companions back to your side, emboldened for the fight ahead.'},
    {id:'companionBear', name:'Summon Bear',    type:'passive', reqLevel:28, row:4, col:1, prereq:['recall'], capstone:true,
      desc:'Summon a powerful bear to guard you and draw enemy attacks.'},
  ] },
};
// Mystic's 3 trees (v75/v76/v77): the design's ONLY 3 Mystic trees are
// Djinn, Elementalist, Necromancer -- an earlier pre-v75 placeholder
// naming scheme was fully reconciled away by v75/v76 and its old names
// are gone from this codebase (v77 was a naming-cleanup pass that
// confirmed no trace of them remained anywhere user-visible or in code).
// THIS IS THE CANONICAL KEY SET a later batch must build against:
// MYSTIC_SKILL_TREES.djinn (filled, v75) / .elementalist (filled, v76 --
// see ELEMENTALIST nodes below) / .necromancer (empty stub, fill in a
// later batch) -- do not rename any existing key or introduce a 4th key.
// Tab order follows object key order (see renderSkillTree's
// Object.keys(TREES) usage), so Djinn is the first, leftmost tab
// (Mystic's 1st tree), Elementalist second (2nd tree).
const MYSTIC_SKILL_TREES = {
  // v466: Djinn laid out as a lightning bolt -- it slants down to the left, juts right through the middle, then drops to the Hurricane tip
  djinn: { name:'Djinn', layout:'sword', straight:true, links:[['lightningArc','staticBuildup'],['lightningChain','nova'],['windrunner','thunderstep'],['thunderstep','stormcall'],['tornado','storm']], nodes:[
    // v475 layout: Lightning Arc + Static Buildup on top; Lightning Chain under Arc, Nova under Static; then Tornado | Thunderstep | Stormcall
    {id:'lightningArc', name:'Lightning Arc', type:'active', reqLevel:1, row:0, col:3, prereq:[],
      desc:'Loose a crackling arc of lightning at your foes.'},
    {id:'staticBuildup', name:'Static Buildup', type:'passive', reqLevel:1, row:0, col:4, prereq:['lightningArc'],
      desc:'Every lightning hit builds static. Each stack makes Lightning Arc hit harder, and a full bar is released by your next Lightning Arc, Nova, Tornado or Stormcall as an empowered strike.'},
    {id:'lightningChain', name:'Lightning Chain', type:'passive', reqLevel:7, row:1, col:2, prereq:['lightningArc'],
      desc:'Let your lightning leap from enemy to enemy.'},
    {id:'nova', name:'Nova', type:'active', reqLevel:7, row:1, col:3, prereq:['staticBuildup'],
      desc:'Unleash a ring of lightning that charges everything it touches.'},
    {id:'tornado', name:'Tornado', type:'active', reqLevel:21, row:3, col:1, prereq:['windrunner'],
      desc:'Hurl a howling tornado at your enemy.'},
    {id:'thunderstep', name:'Thunderstep', type:'passive', reqLevel:14, row:2, col:2, prereq:['lightningChain'],
      desc:'Your dodge becomes a blink of lightning, and your mana flows faster after it.'},
    {id:'stormcall', name:'Stormcall', type:'active', reqLevel:14, row:2, col:3, prereq:['nova'],
      desc:'Mark the ground, then call a bolt of lightning down onto it. Charged enemies conduct the strike to their neighbours.'},
    {id:'storm', name:'Storm', type:'passive', reqLevel:21, row:3, col:2, prereq:['thunderstep'],
      desc:'A small storm gathers above you, sharpening your strikes.'},
    {id:'windrunner', name:'Windrunner', type:'passive', reqLevel:14, row:2, col:1, prereq:['thunderstep'],
      desc:'Moving quickly gathers storm energy for your next lightning spell.'},
    {id:'hurricane', name:'Hurricane', type:'active', reqLevel:28, row:4, col:0, prereq:['tornado','storm'], prereqMode:'or', capstone:true,
      desc:'Conjure a raging hurricane that batters and slows everything nearby.'},
  ] },
  // Elementalist (Mystic's 2nd tree, v76): a fire/ice tree shaped as a
  // 1-2-2-2 diamond funnel per the brief's own ASCII diagram (single top
  // node -> 1 node -> branches into 2 -> each of THOSE continues straight
  // down into its own leaf, so the two bottom nodes are parallel/
  // independent end-points, not a single converging capstone row).
  // Judgment call on layout: reuses layout:'shield' (Defender's existing
  // 3-column icon grid + straight-line connectors, see treeNodeIconHtml/
  // renderSkillTree/drawShieldConnectors) rather than 'cascade' (Djinn's
  // 5-column diagonal-sword grid). Defender's shield shape narrows from a
  // wide top to a single bottom point -- the opposite of what's wanted
  // here -- but the underlying grid is just node.row/node.col placement on
  // a plain 3-column grid with straight point-to-point connector lines, so
  // it reproduces THIS tree's actual diamond funnel exactly: row0 col1
  // (node 1, centered) -> row1 col1 (node 2, centered) -> row2 col0/col2
  // (nodes 3/4, the branch) -> row3 col0/col2 (nodes 5/6, straight down
  // from 3/4 respectively, reading as two parallel columns side by side).
  // No new CSS class or connector-routing logic was needed -- 'shield' is
  // simply a more literal fit for THIS tree's shape than 'cascade' is.
  elementalist: { name:'Elementalist', layout:'shield', nodes:[
    // v269 redo: fire is fast and dangerous (self-damage), cold is slow and heavy and freezes.
    {id:'fireball', name:'Fireball', type:'active', reqLevel:1, row:0, col:0, prereq:[],
      desc:'Hurl quick balls of fire. Each rank adds another ball, up to three.'},
    {id:'iceBolt', name:'Ice Bolt', type:'active', reqLevel:1, row:0, col:2, prereq:[],
      desc:'Hurl a big, slow, heavy bolt of ice that chills and freezes.'},
    {id:'elementalPolarity', name:'Elemental Polarity', type:'passive', reqLevel:3, row:1, col:1, prereq:['fireball','iceBolt'],
      desc:'Follow fire with ice, or ice with fire, for bonus damage.'},
    {id:'immolate', name:'Immolate', type:'active', reqLevel:3, row:1, col:0, prereq:['fireball'],
      desc:'Set yourself ablaze: hit harder and make fireballs explode, at the cost of your own life.'},
    {id:'iceArmor', name:'Ice Armor', type:'active', reqLevel:3, row:1, col:2, prereq:['iceBolt'],
      desc:'Encase yourself in a shell of protective ice.'},
    {id:'permafrost', name:'Permafrost', type:'active', reqLevel:14, row:2, col:2, prereq:['iceArmor'],
      desc:'Freeze the ground: foes inside are slowed and frozen by the next hit, and you move faster.'},
    {id:'pyroTorrent', name:'Pyro Torrent', type:'active', reqLevel:14, row:2, col:0, prereq:['immolate'],
      desc:'Channel a searing torrent of fire through every enemy in its path.'},
    {id:'elementalMastery', name:'Elemental Mastery', type:'passive', reqLevel:21, row:3, col:1, prereq:['elementalPolarity'],
      desc:'Master fire and ice: your fire and cold spells hit harder and burn through enemy resistances. At rank 5, Fireball and Ice Bolt explode on hit.'},
    {id:'meteor', name:'Meteor', type:'active', reqLevel:28, row:4, col:0, prereq:['pyroTorrent'], capstone:true, capstoneShare:'elementalist',
      desc:'Call a burning meteor down from the sky. It crashes into your enemies after a moment and leaves the ground ablaze.'},
    {id:'blizzard', name:'Blizzard', type:'active', reqLevel:28, row:4, col:2, prereq:['permafrost'], capstone:true, capstoneShare:'elementalist',
      desc:'Call down a freezing blizzard of ice shards.'},
  ] },
  // Necromancer (Mystic's 3rd & final tree, v78): a soul/summon tree shaped
  // as an hourglass/diamond per the brief's own ASCII diagram -- nodes 1
  // (Fear) & 2 (Raise Dead) are BOTH independent top-row starting points
  // (no prereq), converging into node 3 (Soul Sap, requires EITHER 1 OR
  // 2), which branches into node 4 (Sacrifice) & node 5 (Demon Bind, each
  // simply requires node 3 -- ordinary single-id AND-gating), reconverging
  // into node 6 (Plague, capstone, requires EITHER 4 OR 5). Reuses
  // layout:'shield' exactly like Elementalist -- row0 col0/col2 (1/2) ->
  // row1 col1 (3) -> row2 col0/col2 (4/5) -> row3 col1 (6) reproduces the
  // diamond with plain row/col placement, no new CSS/connector code needed.
  // OR-gating (nodes 3 & 6): see prereqSatisfied/prereqReqText below (the
  // node.prereqMode:'or' opt-in flag) for exactly how this coexists with
  // every existing AND-gated node, Precise Shot included, unchanged.
  // v489 Necromancer layout: Soul Sap / Soul Shield / Raise Skeletons; Fear / Soul Hunger / Sacrifice;
  // Soul Fire / Demon Bind / Soul Gate; Plague. Fear -> Soul Fire, Sacrifice -> Soul Gate, both -> Demon Bind -> Plague.
  necromancer: { name:'Necromancer', layout:'shield', nodes:[
    {id:'soulSap', name:'Soul Sap', type:'active', reqLevel:1, row:0, col:0, prereq:[],
      desc:'Drain the life and soul from your enemies with a venomous touch.'},
    {id:'soulShield', name:'Soul Shield', type:'passive', reqLevel:1, row:0, col:1, prereq:[],
      desc:'The souls you hold circle you and turn aside blows, giving you a chance to block.'},
    {id:'raiseDead', name:'Raise Skeletons', type:'active', reqLevel:1, row:0, col:2, prereq:[],
      desc:'Raise skeletons to fight for you. Cast again to blow up the ones standing and raise a fresh set.'},
    {id:'fear', name:'Fear', type:'active', reqLevel:7, row:1, col:0, prereq:['soulSap'],
      desc:'Curse a group of enemies with dread: they flee, and take more damage while the curse lasts.'},
    {id:'soulHunger', name:'Soul Hunger', type:'passive', reqLevel:14, row:2, col:1, prereq:['soulShield'],
      desc:'Bleed your own life into a growing store of souls, and grow stronger for every soul you hold.'},
    {id:'sacrifice', name:'Sacrifice', type:'passive', reqLevel:7, row:1, col:2, prereq:['raiseDead'],
      desc:'Your fallen skeletons burst in poison, the blast as strong as the life they had.'},
    {id:'soulFire', name:'Soul Fire', type:'active', reqLevel:21, row:3, col:0, prereq:['fear'],
      desc:'Hurl a great rolling ball of green soul-flame that bursts on impact.'},
    {id:'demonBind', name:'Demon Bind', type:'passive', reqLevel:21, row:3, col:1, prereq:['soulFire','soulGate'], prereqMode:'or',
      desc:'Bind a hulking demon to your service. It grows stronger with every soul you hold.'},
    {id:'soulGate', name:'Soul Gate', type:'active', reqLevel:14, row:2, col:2, prereq:['sacrifice'],
      desc:'Tear open a gate that feeds on your souls and spits out skeletal archers.'},
    {id:'plague', name:'Plague', type:'active', reqLevel:28, row:4, col:1, prereq:['demonBind'], capstone:true,
      desc:'Corrupt the earth itself with a spreading plague.'},
  ] },
};
function treesForClass(cls){ return cls==='ranger' ? RANGER_SKILL_TREES : cls==='mystic' ? MYSTIC_SKILL_TREES : SKILL_TREES; }
const SKILL_DESC_OVERRIDES = {"ironSkin": "Your skin hardens like stone, turning aside blows that would fell lesser warriors.", "shieldBash": "Slam your shield into a foe hard enough to rattle their skull.", "shieldThrow": "Hurl your shield through the enemy ranks and let it fly back to your hand.", "guardian": "Roar, fill your Rage and charge unstoppable, flattening everything in your path until the Rage runs dry.", "whirlwind": "Become a whirling storm of steel, cutting down everything that stands too close.", "assault": "Fly into a berserker rage, growing deadlier and more reckless as the fight goes on.", "squire": "Call loyal squires to stand and fight at your side.", "offensiveStance": "Drive your followers into a frenzy so they strike harder with every blow.", "commander": "Command your followers to charge into the fray or hold the line beside you, and toughen them for the fight.", "templarDefensiveStance": "Train your followers to stand firm, drawing enemy eyes away from you.", "battlecry": "Let loose a thunderous war cry that stuns the foes around you and sends you and your followers into a fury.", "rally": "Raise your shield and call your followers back to your side, healing and steeling them.", "companionBear": "A great bear joins you -- the hardest-hitting companion in the wild.", "companionWolf": "A loyal wolf hunts at your side. Respawns after 5 seconds if fallen.", "stunShot": "Fire a heavy arrow that rattles a foe senseless.", "tornado": "Hurl a huge, howling tornado that tears through every enemy in its path."};
const V454_RANGER_REMOVED = ['arrowEye','trueShot','longshot','vanish'];
const SKILL_DESC_V454 = {
  sacredWeapon:'Your blade is consecrated: every fourth Vengeance erupts in holy flame.',
  auraOfRetribution:'Those who strike you are struck in turn by your faith.',
  explosiveShot:'A fire-tipped arrow that bursts into flame on impact.',
  beastFury:'Drive your companions into a frenzy: your bear roars a challenge and your wolves tear deeper.',
  trapMastery:'Your traps hit harder, reach farther, and you throw them faster.',
  deadeye:'Critical hits hit harder and invigorate you, and distant targets fall all the same.',
  rainOfArrows:'Loose an arrow into the sky and call down a rain of arrows on the battlefield.',
  battlecry:'A terrifying roar that sends the foes around you fleeing and leaves them open to every blow.',
  reave:'A vicious, tearing blow that leaves the wound bleeding.'
};
const SKILL_DESC_V266 = {"shieldBash":"Slam your shield into the foes in front of you, with a chance to stun them, and feed your rage.","guardian":"Roar, fill your Rage and charge unstoppable, flattening everything in your path until the Rage runs dry.","assault":"Fly into a berserker rage, thriving on pain dealt and pain endured, and end it in a burst of spent rage.","squire":"Call squires to fight at your side and command them to greater strength. Most of your damage comes from them.","battlecry":"A roar that stuns the foes around you and leaves them open to every blow.","bannerWar":"War standards rouse you and your followers to greater damage and critical strikes.","bannerAegis":"Aegis standards shield and mend you and your followers."};
[SKILL_TREES, RANGER_SKILL_TREES, MYSTIC_SKILL_TREES].forEach(ts=>{ for(const k of Object.keys(ts)) for(const n of ts[k].nodes){ if(SKILL_DESC_OVERRIDES[n.id]) n.desc = SKILL_DESC_OVERRIDES[n.id]; if(SKILL_DESC_V266[n.id]) n.desc = SKILL_DESC_V266[n.id]; if(SKILL_DESC_V454[n.id]) n.desc = SKILL_DESC_V454[n.id]; } });

// ============================================================================
// ---- v83: "+N to skills" equipment mechanism -- tree/class-group lookups -
// ============================================================================
// Groups the 9 skill trees into their 3 class families, for the "+1 to all
// <Class>-class skills" ring/amulet affixes (Warrior's/Ranger's/Mystic's --
// see EQUIP_AFFIXES below). Matches treesForClass's own SKILL_TREES/
// RANGER_SKILL_TREES/MYSTIC_SKILL_TREES groupings exactly.
// Reuses the exact same array objects EQUIP_AFFIXES.ring's "+1 to all
// X-class skills" entries (Warrior's/Ranger's/Mystic's) already point at
// (see SKILL_TREE_CLASS_GROUP_KEY_* just above EQUIP_AFFIXES) -- one
// source of truth for each grouping.
const SKILL_TREE_CLASS_GROUP = {
  warrior: SKILL_TREE_CLASS_GROUP_KEY_WARRIOR,
  ranger:  SKILL_TREE_CLASS_GROUP_KEY_RANGER,
  mystic:  SKILL_TREE_CLASS_GROUP_KEY_MYSTIC,
};
// Every individual node id -> which tree it belongs to, built once from the
// 3 tree tables above. Used by effectiveRank() (see below) to know which
// tree's item-derived skill bonus applies to a given node id.
const NODE_ID_TO_TREE = {};
[SKILL_TREES, RANGER_SKILL_TREES, MYSTIC_SKILL_TREES].forEach(treeSet=>{
  Object.keys(treeSet).forEach(treeKey=>{
    treeSet[treeKey].nodes.forEach(node=>{ NODE_ID_TO_TREE[node.id] = treeKey; });
  });
});
// Reads a skill node's EFFECTIVE rank -- the actual invested rank
// (p.skills[nodeId]) plus any "+N to skills" bonus contributed by currently
// equipped gear for that node's tree (aggregated into p.skillBonusByTree by
// recalcStats -- see the v83 section there). This is the single mechanism
// every "+1 to X skills"-style affix (Berserker's, Warrior's, Masterful,
// Mystic's, etc -- see EQUIP_AFFIXES) plugs into: it does NOT touch
// p.skills itself (the player's actually-invested points), so unequipping
// the item instantly (next recalcStats) drops the bonus back out with no
// separate bookkeeping needed.
//
// Judgment call: the bonus only applies once the player has invested at
// least 1 real point in that node (actual rank > 0) -- gear enhances an
// already-chosen skill, it does not by itself unlock/grant access to a
// skill the player never allocated (matching the classic "+skills" gear
// convention from the genre this game is drawing on, and avoiding a much
// larger side-mechanism to let a 0-point active skill be assigned to a
// button/used at all). A node at actual rank 0 always reads as rank 0
// through this helper, regardless of how much +skill gear is worn.
//
// Every one of the ~118 existing `p.skills.<id>` rank-reads used for
// COMBAT/EFFECT calculations throughout the file has been switched to call
// this helper instead (see the v83 "effectiveRank rollout" note near the
// bottom of the file for the exact scope of that swap). The much smaller
// set of `p.skills[id]` bracket-notation reads (skill-tree UI rendering,
// prereq-satisfied checks, "does this node have any points" latches) is
// left reading the ACTUAL rank on purpose -- prereq-gating and the tree UI
// should reflect what the player really invested, not a temporary item
// bonus that disappears the moment they unequip something.
function effectiveRank(p, nodeId){
  const actual = (p.skills && p.skills[nodeId]) || 0;
  // v469: a staff's "+N to <spell>" grants that skill even unallocated, so it can be tried before spending a point
  const staff = (STAFF_SKILL_SPELL[nodeId] && p.equipment) ? staffBonusFor(p,nodeId) : 0;
  if(actual<=0) return staff;
  const tree = NODE_ID_TO_TREE[nodeId];
  const bonus = (tree && p.skillBonusByTree) ? (p.skillBonusByTree[tree]||0) : 0;
  return actual + bonus + staff;
}
const MAX_SKILL_RANK = 10, BASE_MAX_RANK = 5, SKILL_RANK_STEP = 0.05;
const MASTERY_LEVEL_REQ = {6:40, 7:40, 8:40, 9:60, 10:60};   // v306: two gates -- ranks 6-8 at Lv.40, ranks 9-10 at Lv.60
const CAPSTONE_LEVEL_REQ = 28;
const MAX_EFF_RANK = 25;   // v420: gear +skills may push ranks well past 10; formulas keep scaling to here
const SKILL_BONUS_GEAR_CAP = 5;   // v420: cap removed (display + scaling handle stacked +skills)   // v219: up to +3 from gear (mods roll from item level 30)
function gearSkillBonus(p, nodeId){
  const actual = (p.skills && p.skills[nodeId]) || 0;
  return effectiveRank(p,nodeId) - actual;   // v469: includes the staff's +N (effectiveRank folds it in)
}
const SHIELD_THROW_CD = 0.95, SHIELD_THROW_CD_MIN = 0.55, SHIELD_THROW_RANGE = 320, GUARDIAN_DUR = 3, GUARDIAN_CD = 30;
// Shield Throw chaining: ranks 2-5 each add one extra bounce to another nearby
// enemy before the shield returns (rank 1 hits only its first target).
const SHIELD_CHAIN_RANGE = 200; // how close another un-hit enemy must be to get chained to
function shieldThrowMaxChains(rank){ return Math.floor(Math.max(0, rank-1)+1e-9); }
// Shield Throw's outbound and return travel speeds (also used by the live
// g.shieldThrow projectile below) -- named constants so the travel-time
// floor below can be computed from the same numbers.
const SHIELD_THROW_SPEED = 680, SHIELD_THROW_RETURN_SPEED = 860;   // v342: throw and recovery ~20% faster
// Shield Throw cooldown: 1s nominal at Rank 1, decreasing further each rank
// down to a 0.6s nominal floor at Rank 5 -- see effectiveShieldThrowCooldown
// below, which additionally clamps this to however long a full throw-and-return
// cycle actually takes, so a new throw can never be queued before the old
// shield has physically made it back to your hand.
function shieldThrowCooldown(rank){
  if(rank<=0) return SHIELD_THROW_CD;
  return SHIELD_THROW_CD - (SHIELD_THROW_CD-SHIELD_THROW_CD_MIN)/4*(rank-1);
}
// Worst-case full out-and-back travel time for the shield projectile at max
// range (it can return sooner if it hits something before maxDist, so this
// is a safe upper-bound floor, not a live per-throw measurement).
function shieldThrowTravelTime(){
  return SHIELD_THROW_RANGE/SHIELD_THROW_SPEED + SHIELD_THROW_RANGE/SHIELD_THROW_RETURN_SPEED;
}
function effectiveShieldThrowCooldown(rank){
  return Math.max(shieldThrowCooldown(rank), shieldThrowTravelTime());
}
// Guardian: while the immunity buff is up, also regenerate health quickly.
const GUARDIAN_REGEN_PER_SEC_PCT = 0.10; // 10% of max HP per second while Guardian is active
// Assault: while the rage buff is up, a fraction of all damage the player deals is leeched back as health.
const ASSAULT_LEECH_PCT = 0.05;
function hasShieldEquipped(p){ return !!(p && p.equipment && p.equipment.offhand && p.equipment.offhand.slotType==='shield'); }
// Block (v63 rework): simply having a shield equipped now grants a flat 10%
// base Block Chance on its own -- no Shield Bash rank is required any more.
// Shield Bash itself no longer contributes any block chance at all (it's
// purely its stun/knockdown active ability now, see shieldBashStunDuration
// below). Riposte (requires Iron Skin) and Defensive Stance (requires a
// shield equipped) are the only two passives that can push it higher.
// Cap: the old cap (0.50) was reachable from Riposte alone (25% base +
// 25% from 5 ranks of Riposte). The new max achievable, with the lower
// 10% base plus full investment in BOTH Riposte (+25% at rank 5) AND
// Defensive Stance (+25% at rank 5, shield required), is 60% -- higher
// than before if left uncapped. We keep the 0.50 cap: it still comfortably
// bounds block chance, and unlike before, hitting it now requires a shield
// equipped AND maxing two separate passives rather than one, so the cap
// still reads as a real, deliberately-chosen ceiling rather than a rounding
// formality. (Judgment call: the task's "base + Defensive Stance" framing
// didn't call out Riposte for removal, so its existing block contribution
// was kept rather than leaving a whole skill node with zero effect.)
const BLOCK_CHANCE_BASE = 0.10, BLOCK_CHANCE_CAP = 0.50;
// Riposte (Defender, requires Iron Skin): passive, adds extra Block Chance
// per rank on top of the shield-equipped base, capped at BLOCK_CHANCE_CAP overall.
const RIPOSTE_BLOCK_PER_RANK = 0.05, RIPOSTE_RAGE_BASE = 4, RIPOSTE_RAGE_MAX_BONUS = 14;
// Defensive Stance (Defender): +5% Block Chance per rank, only while a
// shield is equipped -- folded into the same overall blockChance() total
// (and its cap) as the base and Riposte, rather than being added on top
// uncapped the way it used to be.
const DEFENSIVE_STANCE_BLOCK_PER_RANK = 0.05;
// v367 Weapon Specialization parry: with a two-hander or dual swords, 50% of the Block Chance you would have becomes a Parry chance
function parryChance(p){
  if(!p || p.cls!=='warrior' || !p.equipment || !((p.skills && effectiveRank(p,'weaponsSpecialist'))||0)) return 0;
  const mh = p.equipment.mainhand, oh = p.equipment.offhand;
  const two = !!(mh && mh.twoHanded), dual = !!(mh && mh.slotType==='weapon1h' && oh && oh.slotType==='weapon1h');
  if(!two && !dual) return 0;
  return parryChanceBase(p);
}
function parryChanceBase(p){
  const riposteRank = (p.skills && effectiveRank(p,'riposte')) || 0, stanceRank = (p.skills && effectiveRank(p,'ironSkin')) || 0;
  return 0.5 * Math.min(BLOCK_CHANCE_CAP, BLOCK_CHANCE_BASE + RIPOSTE_BLOCK_PER_RANK*riposteRank + IRON_SKIN_BLOCK_PER_RANK*stanceRank + ((p&&p.itemBlockChancePct)||0));
}
function blockChance(p){
  if(!hasShieldEquipped(p)) return (p.rallyT>0 ? RALLY_BLOCK_BONUS : 0);
  const riposteRank = (p.skills && effectiveRank(p,'riposte')) || 0;
  const stanceRank = (p.skills && effectiveRank(p,'ironSkin')) || 0;
  // v83: Grand (shield prefix, +Block Chance %) folds in here, capped by
  // the same overall BLOCK_CHANCE_CAP as every other source.
  const total = BLOCK_CHANCE_BASE + RIPOSTE_BLOCK_PER_RANK*riposteRank + IRON_SKIN_BLOCK_PER_RANK*stanceRank + ((p&&p.itemBlockChancePct)||0) + (p.rallyT>0 ? RALLY_BLOCK_BONUS : 0);
  return Math.min(BLOCK_CHANCE_CAP, total);
}
// Shield (Defender): merely having a shield equipped -- independent of any
// skill rank -- grants a modest flat damage and attack-speed bonus on top
// of the 10% base block chance above.
const SHIELD_DMG_BONUS_PCT = 0.10, SHIELD_ATKSPD_BONUS_PCT = 0.08;
// Iron Skin (Defender, v63 rework): +% total Defense/Armor per rank, on a
// deliberately diminishing curve so 5 ranks land on exactly +25% (not the
// +50% a flat 10%/rank would imply) -- Rank 1 is still exactly +10%, each
// rank afterward adds progressively less (+6%, +4%, +3%, +2%), same
// "front-loaded" shape Riposte/Bloodlust/etc. already use elsewhere.
// This is a MULTIPLIER on the character's gear-derived Armor stat (the flat
// subtraction in playerDamage), not a flat add like the pre-v63 version --
// "Defense" here means the armor stat itself, kept distinct from the flat,
// percentage-of-incoming-damage "Damage Reduction" stat that Defensive
// Stance/Rally/Assault's ramp use (see takenMult in playerDamage). At Rank
// 5 specifically, Iron Skin ALSO grants a flat +5% Damage Reduction -- a
// separate stat in that other (takenMult) category, stacking with it.
const IRON_SKIN_DEFENSE_PCT_BY_RANK = [0, 0.10, 0.16, 0.20, 0.23, 0.25];
const IRON_SKIN_RANK5_DAMAGE_REDUCTION = 0; // v189: replaced by a life bonus
const IRON_SKIN_DR_BY_RANK = [0, 0.02, 0.03, 0.04, 0.06, 0.08], IRON_SKIN_BLOCK_PER_RANK = 0.02, IRON_SKIN_RANK5_LIFE = 0.04, DMG_REDUCTION_CAP = 0.50;   // v438: total damage reduction cap 20% -> 50%, with much smaller gear rolls
function ironSkinDrAt(r){ r = clamp(r||0, 0, MAX_EFF_RANK); return r<=BASE_MAX_RANK ? (IRON_SKIN_DR_BY_RANK[r] || 0) : IRON_SKIN_DR_BY_RANK[BASE_MAX_RANK] + 0.008*(r-BASE_MAX_RANK); }
function ironSkinDefensePct(p){
  const rank = clamp((p.skills && effectiveRank(p,'ironSkin')) || 0, 0, MAX_EFF_RANK);
  return rank<=BASE_MAX_RANK ? (IRON_SKIN_DEFENSE_PCT_BY_RANK[rank] || 0) : IRON_SKIN_DEFENSE_PCT_BY_RANK[BASE_MAX_RANK] + 0.01*(rank-BASE_MAX_RANK);   // v438: keeps scaling past rank 5
}
// v206: Iron Skin also grants base resistance to every element: 5% at rank 1 up to 20% at max rank, and at max rank
// it raises the resist cap by 1% (76% instead of 75%).
const IRON_SKIN_RESIST_BY_RANK = [0, 5, 8.75, 12.5, 16.25, 20];
function ironSkinResistPct(p){
  const rank = clamp((p.skills && effectiveRank(p,'ironSkin')) || 0, 0, MAX_EFF_RANK);
  return rank<=BASE_MAX_RANK ? (IRON_SKIN_RESIST_BY_RANK[rank] || 0) : IRON_SKIN_RESIST_BY_RANK[BASE_MAX_RANK] + 1.5*(rank-BASE_MAX_RANK);
}
function maxResistPct(p){
  return MAX_RESIST_PCT + (((p && p.skills && effectiveRank(p,'ironSkin'))||0) >= BASE_MAX_RANK ? 1 : 0) + ((p && p.partB && p.partB.maxres)||0);
}
function ironSkinDamageReduction(p){
  const rank = (p.skills && effectiveRank(p,'ironSkin')) || 0;
  return rank>=BASE_MAX_RANK ? IRON_SKIN_RANK5_DAMAGE_REDUCTION : 0;
}
// Defensive Stance (Defender): passive, only while a shield is equipped --
// increases Damage Reduction (a % of incoming damage, see takenMult in
// playerDamage) and now Block Chance directly (folded into blockChance()
// above), at the cost of a small flat attack-speed penalty while the
// shield/stance combo is active, so it isn't a pure upside next to the
// other passives.
const DEFENSIVE_STANCE_DR_PER_RANK = 0.05;        // extra % damage reduction per rank, while shield equipped
const DEFENSIVE_STANCE_ATKSPD_PENALTY = 0.08;     // flat -8% attack speed while active (documented balance cost)
function defensiveStanceActive(p){
  const rank = (p.skills && effectiveRank(p,'ironSkin')) || 0;
  if(rank<=0) return false;
  return !!(p.equipment && p.equipment.offhand && p.equipment.offhand.slotType==='shield');
}
function defensiveStanceDamageReduction(p){
  if(!defensiveStanceActive(p)) return 0;
  return ironSkinDrAt(effectiveRank(p,'ironSkin')||0);
}
// Shield Bash: a short stun on every rank, upgraded to a much longer
// knockdown once the skill hits Rank 5 (its max rank / mastery point).
const SHIELD_BASH_STUN_BASE = 0.4, SHIELD_BASH_STUN_STEP = 0.15, SHIELD_BASH_KNOCKDOWN_STUN = 1.5, SHIELD_BASH_KNOCKDOWN_RANK = 5;
function shieldBashStunDuration(rank){
  if(rank>=SHIELD_BASH_KNOCKDOWN_RANK) return SHIELD_BASH_KNOCKDOWN_STUN;
  return SHIELD_BASH_STUN_BASE + SHIELD_BASH_STUN_STEP*Math.max(0,rank-1);
}
// Shield Bash / Shield Throw: the stun itself is no longer guaranteed --
// each hit only has a CHANCE to stun, starting low at Rank 1 and scaling
// up to a moderate chance at Rank 5 (mastery). Same linear rank-1..rank-5
// interpolation shape used elsewhere (e.g. shieldThrowCooldown above).
const SHIELD_STUN_CHANCE_BASE = 0.02, SHIELD_STUN_CHANCE_MAX = 0.10;
// v375: Shield Slam has its own stun chance: 2% at Rank 1 rising evenly to 25% at Rank 10 (Shield Throw keeps shieldStunChance, 2% to 10%)
function slamStunChance(rank){ return rank>0 ? Math.min(0.6, 0.02 + 0.23*(Math.min(MAX_EFF_RANK,Math.max(1,rank))-1)/(MAX_SKILL_RANK-1)) : 0; }
function shieldStunChance(rank){
  if(rank<=0) return 0;
  // (v106 fix) linear Rank 1 -> Rank 5 interpolation. The old expression had
  // an operator-precedence slip that always fell through to the base chance,
  // and nothing actually called this function, so stuns were guaranteed.
  return SHIELD_STUN_CHANCE_BASE + (SHIELD_STUN_CHANCE_MAX-SHIELD_STUN_CHANCE_BASE)*(Math.min(rank,5)-1)/4;
}
// Ranger basic attack: a bow fires an arrow at range instead of a melee swing.
const BOW_RANGE = 340, BOW_ARROW_SPEED = 480;
const STAFF_RANGE = 320, STAFF_BOLT_SPEED = 420;
// Mystic staff spells: each staff rolls one of these three inherent to itself.
const STAFF_SPELLS = ['fire','ice','lightning','soul'];
const STAFF_SPELL_INFO = {
  fire:       {label:'Fireball',      color:'#ff7a3d', desc:'Fire projectile that burns for extra damage over time.'},
  ice:        {label:'Ice Bolt',      color:'#7ad0ff', desc:'Cold projectile that chills, slowing the enemy.'},
  lightning:  {label:'Lightning Arc', color:'#e6e35a', desc:'Bolt of lightning that briefly stuns an enemy.'},
  soul:       {label:'Soul Sap',      color:'#a06ad0', desc:'Drains the souls of your enemies.'},
};
function skDur(p, d){ return d*(1+((p && p.skillDurPct)||0)); }   // v489: the Skill Duration % mod
const FIRE_DOT_DUR = 2.5, FIRE_DOT_PCT = 0.15; // burn: 15% of hit damage per second for 2.5s
const ICE_CHILL_DUR = 2.5; // chill: 50% move speed for 2.5s (see chillMult in the enemy update loop)
const LIGHTNING_STUN_DUR = 0.2;
// Every monster's health and damage is scaled up from its base numbers below,
// applied once, uniformly, in spawnEnemy. This used to be a flat +10% for
// both (ENEMY_BUFF_MULT). Requested change: monster HP doubled and damage
// +50%, relative to how the game actually played with that old +10% pass --
// so the new multipliers are 2x and 1.5x of the old 1.10, not of the raw
// base stat blocks above.
const ENEMY_HP_MULT = 2.2;
const ENEMY_DMG_MULT = 1.65;
// (v124) Hybrid monster scaling. Every area has a level (g.depth). Monster level (ML) is the
// character's level clamped into that area's band [area, area+AREA_LEVEL_BAND]: an under-levelled
// character faces the area's floor, an over-levelled one stops out-scaling it (so old areas get
// easy and give little XP). Enemy hp/damage then scale with ML on top of the per-type formulas.
const AREA_LEVEL_BAND = 6, AREA_LEVEL_BAND_EARLY = 2;
function monsterLevel(g){
  const pl = (g.player && g.player.level) || 1, d = g.depth || 1;
  // v379: full scaling up to 5 levels above the zone, then it drops off heavily (a quarter of a level per extra character level, never more than +1 beyond the 5)
  // v490: tapers much sooner -- an over-levelled character pulls monsters up only half a level per level (max +3 within 5 levels,
  // then +0.1 per extra level, never past +4), so old zones really do get easier. Under-levelled: monsters stay at the zone's level.
  const full = d<10 ? AREA_LEVEL_BAND_EARLY : 5;
  if(pl <= d) return d;
  const over = pl - d;
  return Math.round(d + Math.min(over, full)*0.6 + Math.min(1, Math.max(0, over-full)*0.1));
}
function mlHpMult(ml){ return 1 + 0.09*ml + 0.0016*ml*ml; }
// v228: enemy life grows more gently at low monster level (75% at ML1, full by ML13); minions still use mlHpMult
function mlEnemyHpMult(ml){ const base = mlHpMult(ml); return ml>=13 ? base : base*(0.75 + 0.25*Math.max(0,(ml-1)/12)); }
function mlDmgMult(ml){ return 1 + 0.012*ml; }
// v538: area-level scaling. One life curve and one damage curve by monster level, built from what a same-level character
// is expected to have: PAR_LIFE = typical life (base + a few life rolls), PAR_HIT = a typical weapon hit. Each monster
// type keeps its own size relative to the old standard formula (life 55+7*lvl, damage 13+2.2*lvl) -- so trolls, golems
// and brutes still hit harder and soak more -- but the level growth comes only from these curves.
// An average normal monster (about 0.8 of standard) hits for ~9% of PAR_LIFE and takes ~4-10 par hits to kill.
function parLife(l){ return 120 + 15*l; }
function parHit(l){ return 15 + 3.7*l; }
const MON_DMG_PAR = 0.1125;                         // standard monster hit = 11.25% of par life (x0.8 for an average normal = 9%)
function monStdDmg(ml){ return MON_DMG_PAR*parLife(Math.max(1, ml)); }
function monStdLife(ml){ const l = Math.max(1, ml); return parHit(l)*(4.5 + 0.1*l)/0.7; }
function oldStdLife(d){ return 55 + 7*Math.max(1, d||1); }
function oldStdDmg(d){ return 13 + 2.2*Math.max(1, d||1); }
// traps and hazards written in the old numbers keep the same share of a standard monster's hit
function hazardScale(d){ return monStdDmg(d)/(oldStdDmg(d)*ENEMY_DMG_MULT*mlDmgMult(d)); }
