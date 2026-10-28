// ---------- v74: generalized active-skill loadout system ----------------
// Every ACTIVE skill already in the game fires through the exact same
// uniform pattern: a `want<Skill>` flag this update()-loop reads once and
// clears, plus a `p.<skill>Cd` / `p.<skill>CdMax` cooldown pair the same
// loop already advances and the old dedicated button already displayed
// (see the cdFn(...) calls in update()). This registry is the SINGLE place
// that maps a skill-tree node id to that existing trigger + cooldown pair,
// so the new Main/1/2/3 buttons can fire ANY already-allocated active skill
// generically -- without touching a single line of that skill's own
// cooldown/effect logic, which stays exactly where it already lived.
// A later batch adding a brand-new active skill (Fireball, say) needs only
// one more entry here (its own trigger + cd getter, same shape as any
// below) plus `type:'active'` on its skill-tree node -- nothing about the
// slot UI itself, openSkillAssignMenu, or updateSkillSlotButtonsUI changes.
// oldBtnId names the LEGACY dedicated button (if any) that already existed
// for this skill pre-v74; updateSkillSlotButtonsUI hides that old button
// whenever the skill is currently claimed by one of the 4 new slots, so
// the two input paths for the same skill never both show on screen -- but
// until the player actually assigns it, the old button keeps working
// exactly as it always did (nothing here changes default behavior).
// Simple blade+hilt icon for the baseline Strike attack, matching the
// currentColor/viewBox convention every skill-tree node icon already uses
// (skillNodeIconSvg) -- shown on the Main button only once it's been
// reassigned away from Strike itself (see updateSkillSlotButtonsUI), so a
// player can tell at a glance which skill Main currently fires.
const STRIKE_ICON_SVG = '<svg class="treeNodeIconSvg" viewBox="-8 -8 56 56">'+
  '<path d="M6 34 L28 12" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"></path>'+
  '<path d="M28 12 L36 4 L40 8 L32 16 Z" fill="currentColor"></path>'+
  '<path d="M4 30 L10 36 L6 40 L0 34 Z" fill="currentColor" opacity="0.7"></path>'+
  '</svg>';
// Shows whichever is longer: the skill's own cooldown or the shared one.
function aoeGcdCd(p, cur, max){ const g = p.aoeGcd||0; return g>cur ? {cur:g, max:AOE_GCD} : {cur, max}; }
const ACTIVE_SKILL_REGISTRY = {
  strike:        { oldBtnId:null,             trigger(){ if(!(game && game.player && preciseShotActive(game.player))) wantAttack = true; },
                   getCd(p){ return preciseShotActive(p) ? {cur:p.preciseShotCd, max:p.preciseShotCdMax||BASE_ATK_CD} : {cur:p.atkCd, max:p.atkCdMax}; } },
  shieldBash:    { oldBtnId:'btnSlam',         trigger(){ wantShieldBash=true; },    getCd(p){ return {cur:p.atkCd, max:p.atkCdMax}; } },
  shieldThrow:   { oldBtnId:'btnThrow',        trigger(){ wantThrow=true; },         getCd(p){ return {cur:p.shieldThrowCd, max:p.shieldThrowCdMax}; } },
  guardian:      { oldBtnId:'btnGuardian',     trigger(){ wantGuardian=true; },      getCd(p){ return {cur:p.guardianCd, max:p.guardianCdMax}; } },
  whirlwind:     { oldBtnId:'btnWhirlwind',    trigger(){ wantWhirlwind=true; },     getCd(p){ return {cur:p.whirlwindCd, max:p.whirlwindCdMax}; } },
  battlecry:     { oldBtnId:'btnBattlecry',    trigger(){ wantBattlecry=true; },     getCd(p){ return {cur:p.battlecryCd, max:p.battlecryCdMax}; } },
  leap:          { oldBtnId:null,              trigger(){ wantLeap=true; },          getCd(p){ return {cur:p.leapCd||0, max:p.leapCdMax||LEAP_CD}; } },
  // v266 warrior redesign
  smite:         { oldBtnId:null, trigger(){ wantSmite=true; },      getCd(p){ return {cur:p.atkCd, max:p.atkCdMax}; } },
  vengeance:     { oldBtnId:null, trigger(){ wantVengeance=true; },  getCd(p){ return {cur:p.atkCd, max:p.atkCdMax}; } },
  reave:         { oldBtnId:null, trigger(){ wantReave=true; },      getCd(p){ return {cur:p.atkCd, max:p.atkCdMax}; } },
  banner:        { oldBtnId:null, trigger(){ wantBanner=true; },     getCd(p){ return {cur:p.bannerCd||0, max:p.bannerCdMax||BANNER_CD}; } },
  consecrate:    { oldBtnId:null, trigger(){ wantConsecrate=true; }, getCd(p){ return {cur:p.consecrateCd||0, max:p.consecrateCdMax||CONS_CD}; } },
  judgment:      { oldBtnId:null, trigger(){ wantJudgment=true; },   getCd(p){ return {cur:p.judgmentCd||0, max:p.judgmentCdMax||JUDG_CD}; } },
  bulwark:       { oldBtnId:null, trigger(){ wantBulwark=true; },    getCd(p){ return {cur:p.bulwarkCd||0, max:p.bulwarkCdMax||BULWARK_CD}; } },
  seismicSlam:   { oldBtnId:null, trigger(){ wantSeismic=true; },    getCd(p){ return {cur:p.seismicCd||0, max:p.seismicCdMax||SEISMIC_CD}; } },
  mirrorSteel:   { oldBtnId:null, trigger(){ wantMirror=true; },     getCd(p){ return {cur:p.mirrorCd||0, max:p.mirrorCdMax||MIRROR_CD_MAX}; } },
  seismicAnchor: { oldBtnId:null, trigger(){ wantAnchor=true; },     getCd(p){ return {cur:p.anchorCd||0, max:p.anchorCdMax||ANCHOR_CD_MAX}; } },
  bloodrage:     { oldBtnId:null, trigger(){ wantBloodrage=true; },  getCd(p){ return {cur:p.bloodrageCd||0, max:p.bloodrageCdMax||BLOODRAGE_CD}; } },
  assault:       { oldBtnId:'btnAssault',      trigger(){ wantAssault=true; },       getCd(p){ return {cur:p.assaultCd, max:p.assaultCdMax}; } },
  commander:     { oldBtnId:'btnStance',       trigger(){ wantStance=true; },        getCd(p){ return {cur:p.stanceCd||0, max:0.5}; } },
  rally:         { oldBtnId:'btnRally',        trigger(){ wantRally=true; },         getCd(p){ return {cur:p.rallyCd, max:p.rallyCdMax}; } },
  shadowStep:    { oldBtnId:'btnShadowStep',   trigger(){ wantShadowStep=true; },    getCd(p){ return {cur:p.shadowStepCd, max:p.shadowStepCdMax}; } },
  vanish:        { oldBtnId:'btnVanish',       trigger(){ wantVanish=true; },        getCd(p){ return {cur:p.vanishCd, max:p.vanishCdMax}; } },
  rapidShot:     { oldBtnId:'btnRapidShot',    trigger(){ wantRapidShot=true; },     getCd(p){ return {cur:p.atkCd, max:p.atkCdMax}; } },   // v489: a basic shot now
  splinterShot:  { oldBtnId:null, trigger(){ wantSplinterShot=true; }, getCd(p){ return {cur:p.atkCd, max:p.atkCdMax}; } },
  multiShot:     { oldBtnId:null, trigger(){ wantMultiShot=true; },    getCd(p){ return {cur:p.atkCd, max:p.atkCdMax}; } },   // v495
  cripplingShot: { oldBtnId:'btnCripplingShot',trigger(){ wantCripplingShot=true; }, getCd(p){ return {cur:p.cripplingShotCd, max:p.cripplingShotCdMax}; } },
  explosiveShot: { oldBtnId:null, trigger(){ wantExplosiveShot=true; }, getCd(p){ return {cur:p.explosiveShotCd||0, max:p.explosiveShotCdMax||EXPLOSIVE_SHOT_CD}; } },
  stunShot:      { oldBtnId:'btnStunShot',     trigger(){ wantStunShot=true; },      getCd(p){ return {cur:p.stunShotCd, max:p.stunShotCdMax}; } },
  packTactics:   { oldBtnId:'btnPackTactics',  trigger(){ wantPackTactics=true; },   getCd(p){ return {cur:p.packTacticsCd, max:p.packTacticsCdMax}; } },
  fieldDress:    { oldBtnId:'btnFieldDress',   trigger(){ wantFieldDress=true; },    getCd(p){ return {cur:p.fieldDressCd, max:p.fieldDressCdMax}; } },
  // Djinn tree (v75): brand-new active skills with no pre-existing
  // dedicated button, so oldBtnId is null for all 4 -- they're only ever
  // triggered via the Main/1/2/3 slot system (see updateSkillSlotButtonsUI's
  // oldBtnId-hide step, which is a no-op here since there's nothing to
  // hide). Exactly the "one more registry entry, nothing else changes"
  // pattern this registry's own top comment already promised for a
  // brand-new active skill.
  nova:          { oldBtnId:null,              trigger(){ wantNova=true; },          getCd(p){ return aoeGcdCd(p, p.novaCd, p.novaCdMax); } },
  tornado:       { oldBtnId:null,              trigger(){ wantTornado=true; },       getCd(p){ return {cur:p.tornadoCd, max:p.tornadoCdMax}; } },
  hurricane:     { oldBtnId:null,              trigger(){ wantHurricane=true; },     getCd(p){ return aoeGcdCd(p, p.hurricaneCd, p.hurricaneCdMax); } },
  // Elementalist tree (v76): same "brand-new active skill, one more
  // registry entry, nothing else changes" pattern as Djinn's 4 above.
  // fireball/iceBolt are the 2 VIRTUAL skills Elemental Polarity unlocks
  // (see that node's comment + VIRTUAL_SKILL_NAMES) -- they still plug into
  // this exact same registry shape as any real tree-node active skill.
  fireball:      { oldBtnId:null,              trigger(){ wantFireball=true; },      getCd(p){ return {cur:p.atkCd, max:p.atkCdMax}; } },
  iceBolt:       { oldBtnId:null,              trigger(){ wantIceBolt=true; },       getCd(p){ return (typeof uq==='function' && uq(p,'uq_elementalist')) ? {cur:Math.max(p.atkCd||0, p.frozenOrbCd||0), max:Math.max(p.atkCdMax||0, p.frozenOrbCdMax||FROZEN_ORB_CD)} : {cur:p.atkCd, max:p.atkCdMax}; } },   // v499: Frozen Orb has its own cooldown
  iceArmor:      { oldBtnId:null,              trigger(){ wantIceArmor=true; },      getCd(p){ return {cur:p.iceArmorCd, max:p.iceArmorCdMax}; } },
  pyroTorrent:   { oldBtnId:null,              trigger(){ wantPyroTorrent=true; },   getCd(p){ return {cur:p.pyroTorrentCd, max:p.pyroTorrentCdMax}; } },
  blizzard:      { oldBtnId:null,              trigger(){ wantBlizzard=true; },      getCd(p){ return {cur:p.blizzardCd, max:p.blizzardCdMax}; } },
  immolate:      { oldBtnId:null,              trigger(){ wantImmolate=true; },      getCd(p){ return {cur:p.immolateCd||0, max:p.immolateCdMax||IMMOLATE_CD}; } },
  flameVortex:   { oldBtnId:null,              trigger(){ wantFlameVortex=true; },   getCd(p){ return {cur:p.flameVortexCd||0, max:p.flameVortexCdMax||FLAME_VORTEX_CD}; } },
  permafrost:    { oldBtnId:null,              trigger(){ wantPermafrost=true; },    getCd(p){ return {cur:p.permafrostCd||0, max:p.permafrostCdMax||PERMAFROST_CD}; } },
  // Necromancer tree (v78): same "brand-new active skill, one more entry"
  // pattern as Djinn/Elementalist above. Soul Sap reuses the plain basic-
  // attack cooldown pair (it shares Strike's cadence, same as before) but
  // (v99 fix) is no longer the basic attack itself -- it fires through
  // its own wantSoulSap flag/cast block (see updatePlaying()), completely
  // independent of whatever Main is currently assigned to, so it behaves
  // like any other normal assignable active skill with zero side effect
  // on the base Strike attack. Djinn's Lightning Arc got the identical
  // v99 fix right below it, for the same reason (see its own comment).
  // Sacrifice and Plague are the first 2 entries to carry the new,
  // OPTIONAL `.cost(p)` field -- a function returning how many souls a
  // trigger requires. Every entry without a `.cost` field (everything
  // above) is implicitly free, exactly as before -- this is purely
  // additive, no existing entry's shape changed. `.cost` is consulted in
  // exactly 2 places, both BEFORE `.trigger()` is ever called: here in
  // triggerSkillSlot (the 3 side slots) and in onAttackDown (the Main
  // slot) -- so an unaffordable cast never even sets its `want<Skill>`
  // flag. The update()-loop block that actually resolves each `want<Skill>`
  // flag (where the cooldown gate already lives) ALSO independently
  // re-checks and deducts the cost at the moment of a successful cast, as
  // defense-in-depth against any future caller that might set a want-flag
  // directly. A later batch adding another soul-costing (or any other
  // resource-costing) active skill needs only its own `.cost(p)` function
  // here, same shape as Sacrifice/Plague's -- nothing else about the
  // registry, the slot buttons, or triggerSkillSlot/onAttackDown changes.
  soulFire:      { oldBtnId:null,              trigger(){ wantSoulFire=true; }, getCd(p){ return {cur:p.soulFireCd, max:p.soulFireCdMax}; } },   // v489: 5 souls + 20 mana
  raiseDead:     { oldBtnId:null, trigger(){ wantRaiseDead=true; }, getCd(p){ return {cur:p.raiseDeadCd||0, max:p.raiseDeadCdMax||RAISE_DEAD_CD}; } },
  stormcall:     { oldBtnId:null, trigger(){ wantStormcall=true; }, getCd(p){ return {cur:p.stormcallCd||0, max:p.stormcallCdMax||STORMCALL_CD}; } },
  meteor:        { oldBtnId:null, trigger(){ wantMeteor=true; }, getCd(p){ return {cur:p.meteorCd||0, max:p.meteorCdMax||BLIZZARD_CD}; } },
  fear:          { oldBtnId:null,              trigger(){ wantFear=true; },          getCd(p){ return {cur:p.fearCd, max:p.fearCdMax}; },
                   cost(){ return FEAR_SOUL_COST; } },
  soulSap:       { oldBtnId:null,              trigger(){ wantSoulSap=true; },
                   getCd(p){ return {cur:p.atkCd, max:p.atkCdMax}; } },
  // Lightning Arc (Djinn, v75 originally, v99 fix): was type:'passive' with
  // no registry entry at all (an automatic, unconditional override of the
  // default Main/Strike attack, un-assignable like Soul Sap used to be --
  // see the removed staffItem override branch in updatePlaying()). Now a
  // normal type:'active' entry, same reused-atkCd-cadence shape as Soul
  // Sap directly above, firing through its own independent cast block.
  lightningArc:  { oldBtnId:null,              trigger(){ wantLightningArc=true; },
                   getCd(p){ return {cur:p.atkCd, max:p.atkCdMax}; } },
  deathBolt:     { oldBtnId:null,              trigger(){ wantDeathBolt=true; },     getCd(p){ return {cur:p.atkCd, max:p.atkCdMax}; } },
  soulGate:      { oldBtnId:null,              trigger(){ wantSoulGate=true; },      getCd(p){ return {cur:p.soulGateCd, max:p.soulGateCdMax}; },
                   cost(){ return SOULGATE_COST; } },
  plague:        { oldBtnId:null,              trigger(){ wantPlague=true; },        getCd(p){ return {cur:p.plagueCd, max:p.plagueCdMax}; },
                   cost(){ return 0; } }, // no hard minimum -- consumes whatever souls you have, see Plague's own comment
  // v79 batch: Survivalist tree (Ranger's Assassin tree, renamed/reworked --
  // see the tree's own top comment) + Marksman's new Rain of Arrows
  // capstone. All 4 new actives are oldBtnId:null, Main/1/2/3-slot-only,
  // same as every post-v74 new active skill (Djinn/Elementalist/
  // Necromancer). Vanish and Evasion are NOT re-listed here -- they're
  // continuing/reworked versions of the same ids that were already in the
  // registry (vanish) or need no registry entry at all (evasion is
  // passive), so their existing entries/mechanics carry over unchanged in
  // shape, just with updated numbers (see their own const/function
  // comments below).
  survivalFieldDress: { oldBtnId:null,          trigger(){ wantSurvivalFieldDress=true; }, getCd(p){ return {cur:p.survivalFieldDressCd, max:p.survivalFieldDressCdMax}; } },
  poisonTrap:    { oldBtnId:null,              trigger(){ wantPoisonTrap=true; },    getCd(p){ return {cur:p.poisonTrapCd, max:p.poisonTrapCdMax}; } },
  frostTrap:     { oldBtnId:null,              trigger(){ wantFrostTrap=true; },     getCd(p){ return {cur:p.frostTrapCd, max:p.frostTrapCdMax}; } },
  aimedShot:     { oldBtnId:null, trigger(){ wantAimedShot=true; },     getCd(p){ return {cur:p.aimedShotCd, max:p.aimedShotCdMax}; } },
  beastFury:     { oldBtnId:null, trigger(){ wantBeastFury=true; },     getCd(p){ return {cur:p.beastFuryCd, max:p.beastFuryCdMax}; } },
  huntersMark:   { oldBtnId:null, trigger(){ wantHuntersMark=true; },   getCd(p){ return {cur:p.huntersMarkCd, max:p.huntersMarkCdMax}; } },
  explosiveTrap: { oldBtnId:null, trigger(){ wantExplosiveTrap=true; }, getCd(p){ return {cur:p.explosiveTrapCd, max:p.explosiveTrapCdMax}; } },
  rainOfArrows:  { oldBtnId:'btnRainOfArrows', trigger(){ wantRainOfArrows=true; },  getCd(p){ return {cur:p.rainOfArrowsCd, max:p.rainOfArrowsCdMax}; } },
  // v80 batch: Hunter tree rework. Recall is a brand-new active skill.
  // Summon Wolf and Summon Bear are both passive-only (no registry entries,
  // so they never appear in the Assign menu) -- they auto-summon based on rank
  // with no player triggering required, unlike previous versions.
  recall:        { oldBtnId:'btnRecall',      trigger(){ wantRecall=true; },        getCd(p){ return {cur:p.recallCd, max:p.recallCdMax}; } },
};
// v517: every spell, buff and shout plays the player's cast pose (staff / arm raised) and a ring of its colour when it goes on cooldown.
// Watched from the cooldown jump so each skill's own cast code stays untouched. Basic shots and melee skills have their own animations.
const CAST_FX_SKILLS = {
  fear:'#c89bff', raiseDead:'#8fe6c8', soulGate:'#8fe6c8', plague:'#8dff6a', soulFire:'#ff9a4a',
  nova:'#9adfff', tornado:'#cfd8e8', hurricane:'#cfd8e8', iceArmor:'#9adfff', pyroTorrent:'#ff9a4a', blizzard:'#9adfff',
  immolate:'#ff9a4a', flameVortex:'#ff9a4a', permafrost:'#9adfff', stormcall:'#9adfff', meteor:'#ff9a4a',
  battlecry:'#ffd070', banner:'#ffd070', commander:'#ffd070', rally:'#ffd070', guardian:'#cfe0ff', bulwark:'#cfe0ff', mirrorSteel:'#cfe0ff',
  consecrate:'#ffe9a0', judgment:'#ffe9a0', bloodrage:'#ff6a5a', seismicAnchor:'#cfe0ff',
  packTactics:'#9ad88a', fieldDress:'#9ad88a', survivalFieldDress:'#9ad88a', huntersMark:'#e8c25a', beastFury:'#ffb05a', recall:'#9ad88a', vanish:'#bfc8d8', shadowStep:'#bfc8d8'
};
function playerCastFx(g, p, color){
  p.castAnimT = 0.3;
  g.particles.push({type:'ring', x:p.x, y:p.y, t:0.4, max:0.4, r:36, color});
  g.particles.push({type:'burst', x:p.x, y:p.y, t:0.3, max:0.3, color});
}
function castFxWatch(g, p){
  const mem = p._cfx || (p._cfx = {});
  for(const id in CAST_FX_SKILLS){
    const def = ACTIVE_SKILL_REGISTRY[id]; if(!def) continue;
    let cd = 0; try{ cd = +(def.getCd(p).cur)||0; }catch(e){}
    const prev = mem[id]||0; mem[id] = cd;
    if(cd > prev + 0.25 && (effectiveRank(p,id)||0)>0 && !(p.castAnimT>0.12)) playerCastFx(g, p, CAST_FX_SKILLS[id]);
  }
}

// no other skill or attack can be started while Pyro Torrent is channelling (the aim pad takes Strike's place)
for(const id in ACTIVE_SKILL_REGISTRY){
  if(id==='pyroTorrent') continue;
  const ent = ACTIVE_SKILL_REGISTRY[id], t0 = ent.trigger;
  ent.trigger = function(){ if(game && game.player && game.player.pyroTorrentT>0) return; return t0.apply(this, arguments); };
}
// Skill ids that ARE flagged type:'active' but are deliberately excluded
// from the generic assignable pool -- see the comment on preciseShot's
// node definition for why. Elementalist's elementalPolarity (v76) joins it
// for a different reason: it isn't itself a triggerable skill -- ranking it
// up unlocks 2 brand-new VIRTUAL active skills (fireball/iceBolt, see
// VIRTUAL_SKILL_NAMES and the ACTIVE_SKILL_REGISTRY entries below) that get
// their own Assign buttons directly from elementalPolarity's own popup
// (see openSkillNodePopup's elementalPolarity special-case) instead of the
// normal single Assign button this exclusion list suppresses.
const ASSIGN_EXCLUDE_IDS = [];
// Elementalist's Fireball/Ice Bolt (v76) are "virtual" active skills: they
// have no skill-tree node of their own (see elementalPolarity's node
// comment) so nodeDisplayName's normal tree lookup would just fall back to
// printing their raw id -- this small map gives them a proper display name
// everywhere a skill label is shown (Assign menu, Main/slot buttons' tap
// targets via skillAssignLabelFor, etc), same as any tree node's own .name.
const VIRTUAL_SKILL_NAMES = { fireball:'Fireball', iceBolt:'Ice Bolt' };
function activeSkillRank(p, skillId){
  if(skillId==='strike') return 1;
  // Fireball/Ice Bolt (v76): not their own tree node -- their "rank" for
  // gating purposes (assignability, the triggerSkillSlot safety net) is
  // simply whether Elemental Polarity itself has been ranked at all, per
  // the brief ("each rank adds damage to both skills" -- i.e. Elemental
  // Polarity's OWN rank is what both skills scale off of and exist under).
  return Math.max((p.skills && p.skills[skillId]) || 0, (p.skills && STAFF_SKILL_SPELL[skillId]) ? (effectiveRank(p, skillId)||0) : 0);   // v476: a staff-granted skill counts
}
// Every active, currently-ranked-up (rank>=1) skill this player's class can
// allocate, plus the always-available baseline Strike -- i.e. exactly the
// set of skills the Assign menu is allowed to offer a button for. v76:
// also injects the 2 virtual Elementalist skills once Elemental Polarity
// has at least 1 rank, per the brief's explicit instruction to extend this
// function for them (even though the actual live Assign flow reaches them
// through elementalPolarity's own popup rather than this list -- kept
// correct/complete here for consistency and for any future generic
// "browse all my skills" UI that reads from it).
function assignableSkillsForPlayer(p){
  const TREES = treesForClass(p.cls);
  const list = [{id:'strike', name:'Strike'}];
  for(const key of Object.keys(TREES)){
    for(const node of TREES[key].nodes){
      if(node.type==='active' && ASSIGN_EXCLUDE_IDS.indexOf(node.id)<0 && ((p.skills[node.id]||0)>=1 || effectiveRank(p,node.id)>=1)){
        list.push({id:node.id, name:node.name});
      }
    }
  }
  return list;
}
function skillSlotIconHtml(skillId){
  if(!skillId) return '';
  if(skillId==='strike') return STRIKE_ICON_SVG;
  return skillNodeIconSvg(skillId);
}
function triggerSkillSlot(slotKey){
  if(!game || !game.player || !game.player.skillSlots) return;
  const skillId = game.player.skillSlots[slotKey];
  if(!skillId) return;
  // v86: same non-combat-context gate as onAttackDown/Dodge above --
  // only shown once there's actually an assigned skill to short-circuit
  // (an empty slot button was already a silent no-op everywhere, no
  // change needed there).
  if(combatActionsBlocked()){ showMsg('I cannot do that here', 1.2); return; }
  const entry = ACTIVE_SKILL_REGISTRY[skillId];
  if(!entry) return;
  if(activeSkillRank(game.player, skillId) < 1) return; // safety net only
  if(entry.cost && (game.player.souls||0) < entry.cost(game.player)) return; // v78 resource-cost gate
  entry.trigger();
}
// (v124) Class resource. p.mp/p.maxMp is Mana (Mystic), Rage (Warrior) or Stamina (Ranger).
//  - Rotation skills (listed below) cost resource and only keep a short minimum cooldown.
//  - Event skills (buffs, summons, panic buttons, channels, big AoE) stay cooldown-only and are not listed.
//  - Strike never costs anything. A Mystic out of mana falls back to a plain Strike.
const RESOURCE_NAME = {mystic:'Mana', warrior:'Rage', ranger:'Stamina'};
const RESOURCE_SKILLS = {
  // (v146) Mystic basic spells now cost more per rank (step); the big Mystic skills cost mana too (no minCd: their own cooldowns stand).
  // (v152) Lightning Arc / Fireball / Ice Bolt / Soul Sap no longer cost mana -- they REWARD it on hit (MANA_ON_HIT_PCT).
  // Everything else costs a lot more, against a much smaller pool.
  // v562: the four big spells (Hurricane, Meteor, Blizzard, Plague) cost 95 mana at rank 1 (v563: +8% a rank, like every Mana/Stamina skill)
  plague:{cost:95}, soulGate:{cost:40}, immolate:{cost:35}, flameVortex:{cost:45}, permafrost:{cost:21, step:-1.8},
  nova:{cost:26}, tornado:{cost:35}, hurricane:{cost:95}, iceArmor:{cost:0}, pyroTorrent:{cost:20}, blizzard:{cost:95}, meteor:{cost:95}, stormcall:{cost:32}, raiseDead:{cost:12}, fear:{cost:25},  /* pyroTorrent cost is PER SECOND while channelling */
  shieldThrow:{cost:25, minCd:1.0}, bulwark:{cost:30}, mirrorSteel:{cost:25, step:-10/9}, seismicSlam:{cost:25}, seismicAnchor:{cost:25, step:-10/9}, whirlwind:{cost:15, minCd:1.0}, unbreakable:{cost:0, minCd:8},
  // v489 Ranger: flat Stamina costs that grow with rank (basic shots -- Strike, Rapid Shot, Splinter Shot, Multi Shot -- are free and refill Stamina)
  cripplingShot:{cost:24, step:1.2}, stunShot:{cost:31.2, step:1.44}, explosiveShot:{cost:36, step:1.8}, aimedShot:{cost:40, step:2}, rainOfArrows:{cost:50, step:2.5}, huntersMark:{cost:20, step:0.5}, explosiveTrap:{cost:42, step:1.2}, poisonTrap:{cost:24, step:0.96}, frostTrap:{cost:24, step:0.96},   // v545: traps and the Hunter's special shots cost 20% more
  fieldDress:{cost:30}, survivalFieldDress:{cost:30},   // v545: Field Dress costs 30 Stamina
  packTactics:{cost:20}, recall:{cost:20}, beastFury:{cost:20},   // v499: Ambush, Recall and Beast Fury cost 20 Stamina each
};
const ATKCD_SKILLS = {lightningArc:1, soulSap:1, fireball:1, iceBolt:1, deathBolt:1};   // these ride the basic-attack cooldown
const RAGE_DECAY_BASE = 3, RAGE_DECAY_MAX = 24, RAGE_DECAY_GRACE = 3, RAGE_DECAY_ACCEL = 3.6;   // v295: Rage fades 3x as fast
const RAGE_MAX = 100, RAGE_ON_HIT = 4, RAGE_ON_HURT_MAX = 10, RAGE_HIT_INTERVAL = 0.12;
const STAMINA_BASE = 100, STAMINA_PER_LEVEL = 2, STAMINA_REGEN_PCT = 0.025;
const STAMINA_ON_SHOT = 5;   // v489: flat Stamina per basic shot / volley (was 3% of the pool)
// v489: dodging no longer refills Stamina by itself -- the Survivalist's Evasion passive adds it (15 at rank 1 -> 42 at rank 10)
function evasionDodgeStamina(p){ const r = (p && p.skills && effectiveRank(p,'evasion'))||0; return r>0 ? 15 + 3*(Math.min(10,r)-1) + Math.max(0, r-10) : 0; }
const RANGER_COST_PCT_OLD = {explosiveShot:0.16, splinterShot:0.08, rapidShot:0.30, aimedShot:0.33, rainOfArrows:0.40, cripplingShot:0.06, stunShot:0.08, huntersMark:0.12, explosiveTrap:0.22, poisonTrap:0.14, frostTrap:0.14};   // v267: bigger bills, refilled by dodging + shooting
const WARRIOR_BASE_REGEN = 0.4;   // v479: % of max life per second
const MANA_REGEN_PCT = 0.02, MANA_ON_KILL_PCT = 0.03, MANA_POTION_PCT = 0.6;
const MANA_ON_HIT_PCT = {lightningArc:0.04, fireball:0.03, iceBolt:0.08, soulSap:0.05, deathBolt:0.05};   // % of max mana per hit   // % of max mana per hit
const WARRIOR_DMG_MULT = 1.25;
function resourceName(p){ return RESOURCE_NAME[p.cls]||'Mana'; }
// Cost of a skill for this player: base + per-rank step, and Mystic costs grow 2% per level past 20 so a bigger pool doesn't trivialise them.
const COST_PER_RANK = 0.08;   // v563: x1.72 at rank 10 (about how much mana / Stamina grows from a skill's first rank to its tenth)
let _rageSkillIds = null;
function isRageSkill(id){ if(!_rageSkillIds){ _rageSkillIds = new Set(); for(const k in SKILL_TREES) for(const n of SKILL_TREES[k].nodes) _rageSkillIds.add(n.id); } return _rageSkillIds.has(id); }
function resCost(p,id,rankOverride){
  const r = RESOURCE_SKILLS[id]; if(!r) return 0;
  let c = r.cost;
  if(id==='raiseDead' && p && p.skills) return RAISE_DEAD_MANA_PER_SKEL * Math.max(1, necroSkeletonLimit(p));   // v489: 12 mana per skeleton raised
  const rk = rankOverride!=null ? rankOverride : ((p&&p.skills&&effectiveRank(p,id))||0);
  // v563: Mana and Stamina costs grow with the skill's rank, as the pools grow with Intelligence / Dexterity (never with character level);
  // Rage stays a fixed 100, so Rage skills keep their own small rank steps
  if(isRageSkill(id)){ if(r.step) c += r.step*Math.max(0,rk-1); }
  else c *= 1 + COST_PER_RANK*Math.max(0, rk-1);
  if(p && WR_SKILLS[id] && (p.windReady || p._wrCostWin>0)) c *= 0.5;   // v466 Windrunner
  if(p && p.cls==='ranger' && p.skills){ const ts=effectiveRank(p,'steadyBreathing')||0; if(ts>0) c *= 1 - 0.05*Math.min(10,ts); }   // v497: Steady Breathing is its own Marksman node
  return Math.round(c);
}
function resourceAffordable(p,id){ const r=RESOURCE_SKILLS[id]; return !r || (p.mp||0) >= resCost(p,id); }
function spendResource(p,id){ const r=RESOURCE_SKILLS[id]; if(r){ const c=resCost(p,id); p.mp = Math.max(0,(p.mp||0)-c);
  // v190: Warriors recover life as they spend Rage; Iron Skin ranks make it stronger (Defender sustain loop)
  if(p.cls==='warrior' && p.hp>0 && p.maxHp){ const ir=(p.skills && effectiveRank(p,'ironSkin'))||0; p.hp = Math.min(p.maxHp, p.hp + p.maxHp*(c/10)*(RAGE_HEAL_PER_10 + RAGE_HEAL_PER_10_IRONSKIN*ir)); } } }
const CLEAVE_RAGE_PER_HIT = 0, FURY_RAGE_PER_SWING = 0;   // v454: Cleave/Fury now SPEND Rage instead
const CLEAVE_RAGE_COST = 5, FURY_RAGE_COST = 5;   // v454: per swing; with less Rage, Strike is a plain swing
function gainResource(p,amt){ if(p && p.cls==='warrior' && (p.whirlwindT>0 || p.juggT>0)) return;   // v342: no Rage while Juggernaut burns it down
 
  if(p && p.cls==='warrior' && amt>0) amt *= wsRageMult(p);   // v338
  if(p && p.cls==='warrior' && p._inWar && amt>0) amt *= 1 + bannerWarRage(p);   // v323: Standard of War -> a little faster Rage/Conviction   // v203: no Rage generation while Whirlwind is spinning
  if(p && p.maxMp>0){ p.mp = Math.min(p.maxMp,(p.mp||0)+amt); if(p.cls==='warrior' && amt>0) p.rageIdleT = 0; } }
function noResourceMsg(p, id){ if(!(p.resMsgT>0)){ p.resMsgT = 0.9; const nm = (p.cls==='warrior' && id && TEMPLAR_IDS_V2.includes(id)) ? 'conviction' : resourceName(p).toLowerCase(); showMsg('Not enough '+nm, 0.8); } }   // v489: Templar skills say Conviction
// Drops a cast the player can't afford (before its cast block runs); a Mystic falls back to Strike.
function gateResourceWants(p){
  if(wantLightningArc){ if(!resourceAffordable(p,'lightningArc')){ wantLightningArc=false; noResourceMsg(p); if(!preciseShotActive(p)) wantAttack=true; } else if(p.atkCd<=0) spendResource(p,'lightningArc'); }
  if(wantDeathBolt){ if(!resourceAffordable(p,'deathBolt')){ wantDeathBolt=false; noResourceMsg(p); if(!preciseShotActive(p)) wantAttack=true; } else if(p.atkCd<=0) spendResource(p,'deathBolt'); }
  if(wantSoulGate && !resourceAffordable(p,'soulGate')){ wantSoulGate=false; noResourceMsg(p); }
  if(wantSoulSap){ if(!resourceAffordable(p,'soulSap')){ wantSoulSap=false; noResourceMsg(p); if(!preciseShotActive(p)) wantAttack=true; } else if(p.atkCd<=0) spendResource(p,'soulSap'); }
  if(wantFireball){ if(!resourceAffordable(p,'fireball')){ wantFireball=false; noResourceMsg(p); if(!preciseShotActive(p)) wantAttack=true; } else if(p.atkCd<=0) spendResource(p,'fireball'); }
  if(wantIceBolt){ if(!resourceAffordable(p,'iceBolt')){ wantIceBolt=false; noResourceMsg(p); if(!preciseShotActive(p)) wantAttack=true; } else if(p.atkCd<=0) spendResource(p,'iceBolt'); }
  if(wantPlague && !resourceAffordable(p,'plague')){ wantPlague=false; noResourceMsg(p); }
  if(wantNova && !resourceAffordable(p,'nova')){ wantNova=false; noResourceMsg(p); }
  if(wantHurricane && !resourceAffordable(p,'hurricane')){ wantHurricane=false; noResourceMsg(p); }
  if(wantTornado && !resourceAffordable(p,'tornado')){ wantTornado=false; noResourceMsg(p); }
  if(wantFear && !resourceAffordable(p,'fear')){ wantFear=false; noResourceMsg(p); }
  if(wantIceArmor && !resourceAffordable(p,'iceArmor')){ wantIceArmor=false; noResourceMsg(p); }
  if(wantPyroTorrent && !resourceAffordable(p,'pyroTorrent')){ wantPyroTorrent=false; noResourceMsg(p); }
  if(wantBlizzard && !resourceAffordable(p,'blizzard')){ wantBlizzard=false; noResourceMsg(p); }
  if(wantMeteor && !resourceAffordable(p,'meteor')){ wantMeteor=false; noResourceMsg(p); }
  if(wantStormcall && !resourceAffordable(p,'stormcall')){ wantStormcall=false; noResourceMsg(p); }
  if(wantRaiseDead && !resourceAffordable(p,'raiseDead')){ wantRaiseDead=false; noResourceMsg(p); }
  if(wantImmolate && !(p.immolateT>0) && !resourceAffordable(p,'immolate')){ wantImmolate=false; noResourceMsg(p); }
  if(wantFlameVortex && !resourceAffordable(p,'flameVortex')){ wantFlameVortex=false; noResourceMsg(p); }
  if(wantPermafrost && !resourceAffordable(p,'permafrost')){ wantPermafrost=false; noResourceMsg(p); }
  if(wantShieldBash && !resourceAffordable(p,'shieldBash')){ wantShieldBash=false; noResourceMsg(p); }
  if(wantThrow && !resourceAffordable(p,'shieldThrow')){ wantThrow=false; noResourceMsg(p); }
  if(wantWhirlwind && !resourceAffordable(p,'whirlwind')){ wantWhirlwind=false; noResourceMsg(p); }
  if(wantMirror && !(p.mirrorT>0) && !(p.mirrorCd>0) && !resourceAffordable(p,'mirrorSteel')){ wantMirror=false; noResourceMsg(p); }   // v492
  if(wantAnchor && !(p.anchorPendT>0) && !(p.anchorCd>0) && !resourceAffordable(p,'seismicAnchor')){ wantAnchor=false; noResourceMsg(p); }
  if(wantBulwark && !(p.bulwarkT>0) && !(p.bulwarkCd>0) && !resourceAffordable(p,'bulwark')){ wantBulwark=false; noResourceMsg(p); }   // v337: Bulwark costs Rage (tapping again to release is free)
  if(wantLeap && !resourceAffordable(p,'leap')){ wantLeap=false; noResourceMsg(p); }
  if(wantUnbreak && !resourceAffordable(p,'unbreakable')){ wantUnbreak=false; noResourceMsg(p); }
  if(wantRapidShot && !resourceAffordable(p,'rapidShot')){ wantRapidShot=false; noResourceMsg(p); }
  if(wantSplinterShot && !resourceAffordable(p,'splinterShot')){ wantSplinterShot=false; noResourceMsg(p); }
  if(wantCripplingShot && !resourceAffordable(p,'cripplingShot')){ wantCripplingShot=false; noResourceMsg(p); }
  if(wantExplosiveShot && !resourceAffordable(p,'explosiveShot')){ wantExplosiveShot=false; noResourceMsg(p); }
  if(wantStunShot && !resourceAffordable(p,'stunShot')){ wantStunShot=false; noResourceMsg(p); }
  if(wantAimedShot && !resourceAffordable(p,'aimedShot')){ wantAimedShot=false; noResourceMsg(p); }
  if(wantHuntersMark && !resourceAffordable(p,'huntersMark')){ wantHuntersMark=false; noResourceMsg(p); }
  if(wantExplosiveTrap && !resourceAffordable(p,'explosiveTrap')){ wantExplosiveTrap=false; noResourceMsg(p); }
  if(wantPoisonTrap && !resourceAffordable(p,'poisonTrap')){ wantPoisonTrap=false; noResourceMsg(p); }
  if(wantFrostTrap && !resourceAffordable(p,'frostTrap')){ wantFrostTrap=false; noResourceMsg(p); }
  if(typeof wantFieldDress!=='undefined' && wantFieldDress && !resourceAffordable(p,'fieldDress')){ wantFieldDress=false; noResourceMsg(p); }   // v545
  if(typeof wantSurvivalFieldDress!=='undefined' && wantSurvivalFieldDress && !resourceAffordable(p,'survivalFieldDress')){ wantSurvivalFieldDress=false; noResourceMsg(p); }
}
// After the cast blocks: a skill whose own cooldown just rose was cast -> spend its cost, and cap
// its cooldown at the short rotation cooldown.
function applyResourceCosts(p, snap){
  for(const id in RESOURCE_SKILLS){
    if(ATKCD_SKILLS[id] || id==='pyroTorrent') continue;   // Pyro Torrent drains per second while channelling
    const key = id+'Cd';
    if(p[key]==null) continue;
    if(p[key] > Math.max(0,snap[id]||0)+1e-4){   // snap can be slightly negative (cd overshoot) -> clamped 0 must not read as a cast
      spendResource(p,id);
      const mc = RESOURCE_SKILLS[id].minCd;
      if(mc!=null && p[key] > mc) p[key] = mc;
    }
  }
}
function tickResource(p, dt){
  if(p && p.cls==='mystic' && game){ try{ windrunnerTick(game, p, dt); }catch(e){} }
  if(p.resMsgT>0) p.resMsgT -= dt;
  if(p.tsRegenT>0) p.tsRegenT -= dt;
  if(p.rageGainCd>0) p.rageGainCd -= dt;
  chargeTick(p, dt);
  if(!(p.maxMp>0)) return;
  if(p.cls==='warrior'){
    // v192 Rage decay: -1/s while fighting; once nothing has fed Rage for RAGE_DECAY_GRACE seconds it bleeds off faster and faster
    p.rageIdleT = (p.rageIdleT==null ? 0 : p.rageIdleT) + dt;
    if(p.mp>0 && !(p.juggT>0)){   // v342: Juggernaut has its own drain
      const rate = RAGE_DECAY_BASE + Math.min(RAGE_DECAY_MAX-RAGE_DECAY_BASE, Math.max(0, p.rageIdleT-RAGE_DECAY_GRACE)*RAGE_DECAY_ACCEL);
      const lostRage = Math.min(p.mp, rate*dt);
      p.mp = Math.max(0, p.mp - rate*dt);
      // v344: Blood Harvest -- Rage that fades while you are out of combat comes back as life
      if(p.rageIdleT > RAGE_DECAY_GRACE && p.hp>0 && p.hp<p.maxHp && p.maxMp>0){
        const bhr = (p.skills && effectiveRank(p,'bloodlust')) || 0;   // v459: Blood Harvest folded into Bloodlust
        if(bhr>0) p.bhPool = Math.min(p.maxHp, (p.bhPool||0) + (lostRage/p.maxMp)*p.maxHp*bloodHarvestRecovery(bhr));   // v480: becomes life regeneration (see tickBuffs)
      }
    }
  }
  else if(p.cls==='mystic') gainResource(p, p.maxMp*MANA_REGEN_PCT*dt*(p.tsRegenT>0 ? 1+(p.tsRegenBonus||0.3) : 1));
  else if(p.cls==='ranger'){ if(p.deadeyeGainCd>0) p.deadeyeGainCd -= dt; gainResource(p, p.maxMp*STAMINA_REGEN_PCT*dt*(1+0.03*((p.skills&&effectiveRank(p,'steadyBreathing'))||0))*(p.coffeeT>0 ? 2 : 1)); /* v545: coffee doubles Stamina regen */ }
}
// (v244) Aimed Shot: press-and-hold its slot button to raise an aim pad under the thumb
// (same pad as Pyro Torrent), drag to aim, release to fire. A quick tap still auto-targets.
let aimShotFull=true, holdAimT0=0; let holdAimOn=false, holdAimId=null, holdAimSlot=null, holdAimT=0, holdAimMouse=false, holdAimShotDir=null, holdAimEl=null, holdAimStart={x:0,y:0}, holdAimCommit=false;
function aimedHoldReady(slotKey){
  const p = game && game.player; if(!p || !p.skillSlots || combatActionsBlocked()) return false;
  const mh = p.equipment && p.equipment.mainhand;
  return p.skillSlots[slotKey]==='aimedShot' && (effectiveRank(p,'aimedShot')||0)>0 && !!(mh && mh.slotType==='bow') && p.aimedShotCd<=0 && resourceAffordable(p,'aimedShot');
}
function holdAimBegin(slotKey, el, id, x, y){
  if(!aimedHoldReady(slotKey)) return false;
  const r = el.getBoundingClientRect();
  holdAimT0 = (typeof performance!=='undefined' ? performance.now() : Date.now()); holdAimOn=true; holdAimId=id; holdAimSlot=slotKey; holdAimEl=el; holdAimStart={x,y}; holdAimCommit=false;
  aimActive=true; aimId=id; aimCenter={x:r.left+r.width/2, y:r.top+r.height/2}; aimVec={x:0,y:0};
  aimbase.style.display='none';   // v453: no pad -- the aim line on the ground shows where you're aiming
  game.player.aimShotHold = true; game.player.aimLoadT0 = holdAimT0; game.player.aimDir = {x:game.player.facing.x, y:game.player.facing.y};
  holdAimMove(x,y);
  return true;
}
function holdAimMove(x,y){
  if(!holdAimOn) return;
  // a tap (finger wobble under ~20px) never counts as manual aiming -- it auto-targets the nearest enemy
  if(!holdAimCommit){ if(Math.hypot(x-holdAimStart.x, y-holdAimStart.y) < 20){ aimVec={x:0,y:0}; return; } holdAimCommit = true; }
  aimMove(x,y);
  const p = game.player;
  if(aimVec.x||aimVec.y){
    const w = screenDirToWorld(aimVec.x, aimVec.y), d = Math.hypot(w.x,w.y)||1;
    p.aimDir = {x:w.x/d, y:w.y/d}; p.facing = {x:p.aimDir.x, y:p.aimDir.y}; p.faceSign = screenFacingSign(p.facing.x, p.facing.y);
  }
}
function holdAimEnd(fire){
  if(!holdAimOn) return;
  const p = game && game.player, had = holdAimCommit && (aimVec.x||aimVec.y);
  holdAimOn=false; holdAimId=null; holdAimSlot=null; holdAimEl=null; aimEnd();
  if(p){ p.aimShotHold=false; if(fire){ holdAimShotDir = had ? {x:p.aimDir.x, y:p.aimDir.y} : null; aimShotFull = ((typeof performance!=='undefined' ? performance.now() : Date.now()) - holdAimT0 >= AIMED_HOLD_MS);   /* v545: full power only once the draw has loaded */ wantAimedShot=true; } }
}
function bindSlotBtn(el, slotKey){
  const isPyro = ()=>{ const p = game && game.player; return !!(p && p.skillSlots && p.skillSlots[slotKey]==='pyroTorrent'); };
  el.addEventListener('touchstart', e=>{ e.preventDefault(); const t=e.changedTouches[0]; if(holdAimBegin(slotKey, el, t.identifier, t.clientX, t.clientY)) return; const wasCh = !!(game.player && game.player.pyroTorrentT>0); if(!(isPyro() && wasCh)) triggerSkillSlot(slotKey); if(isPyro()) dragAimBegin(el, t.identifier); }, {passive:false});
  el.addEventListener('touchmove', e=>{ if(holdAimOn){ e.preventDefault(); for(const t of e.changedTouches) if(t.identifier===holdAimId) holdAimMove(t.clientX,t.clientY); return; } if(dragAimEl===el){ e.preventDefault(); for(const t of e.changedTouches) if(t.identifier===aimId) aimMove(t.clientX,t.clientY); } }, {passive:false});
  el.addEventListener('touchend', e=>{ if(holdAimOn){ e.preventDefault(); for(const t of e.changedTouches) if(t.identifier===holdAimId) holdAimEnd(true); return; } if(dragAimEl===el){ for(const t of e.changedTouches) if(t.identifier===aimId) dragAimEnd(); } }, {passive:false});
  el.addEventListener('touchcancel', ()=>{ holdAimEnd(false); if(dragAimEl===el) dragAimEnd(); });
  el.addEventListener('mousedown', e=>{ e.preventDefault(); if(holdAimBegin(slotKey, el, 'm', e.clientX, e.clientY)) holdAimMouse=true; else triggerSkillSlot(slotKey); });
}
window.addEventListener('mousemove', e=>{ if(holdAimMouse) holdAimMove(e.clientX,e.clientY); });
window.addEventListener('mouseup', ()=>{ if(holdAimMouse){ holdAimMouse=false; holdAimEnd(true); } });
bindSlotBtn(document.getElementById('btnSlot1'), 'slot1');
bindSlotBtn(document.getElementById('btnSlot2'), 'slot2');
bindSlotBtn(document.getElementById('btnSlot3'), 'slot3');
// Per-frame visuals for the 4 assignable buttons: icon (or empty/dashed),
// cooldown sweep (same cdFn convention as every other button), and the
// legacy-button hide/show handoff described above the registry. Called
// once per frame from update()'s existing HUD-DOM block.
function updateSkillSlotButtonsUI(){
  if(!game || !game.player || !game.player.skillSlots) return;
  const p = game.player;
  updateSkillButtonsVisibility(); // first, restore every legacy button to its normal rank-based show/hide
  const cdFn=(el,cur,max)=>{ if(el) el.style.transform = 'translateY('+(clamp(max>0?cur/max:0,0,1)*100)+'%)'; };
  const mainBtn = document.getElementById('btnAttack');
  const mainSkill = p.skillSlots.main || 'strike';
  const mainIconEl = mainBtn.querySelector('.slotIcon');
  const mainLbl = mainBtn.querySelector('.lbl');
  if(mainSkill==='strike'){
    mainIconEl.style.display = 'none'; mainIconEl.innerHTML = '';
    mainLbl.style.display = '';
  } else {
    mainIconEl.innerHTML = skillSlotIconHtml(mainSkill);
    mainIconEl.style.display = 'flex';
    mainLbl.style.display = 'none';
    const entry = ACTIVE_SKILL_REGISTRY[mainSkill];
    if(entry){ const cd = entry.getCd(p); cdFn(mainBtn.querySelector('.cd'), Math.max(0,cd.cur), cd.max||1); }
  }
  ['slot1','slot2','slot3'].forEach(slotKey=>{
    const btn = document.getElementById('btnSlot'+slotKey.slice(-1));
    if(!btn) return;
    const skillId = p.skillSlots[slotKey];
    const iconEl = btn.querySelector('.slotIcon');
    btn.classList.toggle('slotEmpty', !skillId);
    if(skillId){
      iconEl.innerHTML = skillSlotIconHtml(skillId);
      iconEl.style.display = 'flex';
      const entry = ACTIVE_SKILL_REGISTRY[skillId];
      const cd = entry ? entry.getCd(p) : {cur:0,max:1};
      cdFn(btn.querySelector('.cd'), Math.max(0,cd.cur), cd.max||1);
    } else {
      iconEl.innerHTML = ''; iconEl.style.display = 'none';
      cdFn(btn.querySelector('.cd'), 0, 1);
    }
  });
  // Hide the legacy dedicated button for any skill currently claimed by one
  // of the 4 slots above, so the same skill never shows two live buttons.
  const assignedIds = [p.skillSlots.main, p.skillSlots.slot1, p.skillSlots.slot2, p.skillSlots.slot3];
  for(const skillId of assignedIds){
    if(!skillId || skillId==='strike') continue;
    const entry = ACTIVE_SKILL_REGISTRY[skillId];
    if(entry && entry.oldBtnId){
      const oldBtn = document.getElementById(entry.oldBtnId);
      if(oldBtn) oldBtn.style.display = 'none';
    }
  }
  // v79: a generic "channeling" glow for any assignable skill with an
  // active stand-still channel, mirroring the old dedicated btnFieldDress
  // channelActive toggle -- written as a small flag lookup so it covers
  // whichever of Main/1/2/3 the skill happens to be assigned to (only
  // survivalFieldDress uses this today, but any future channel-type skill
  // just adds itself to this map, no new code elsewhere).
  const channelFlags = { survivalFieldDress: !!p.fieldDressing2 };
  [['main', mainBtn, mainSkill]].concat(['slot1','slot2','slot3'].map(k=>[k, document.getElementById('btnSlot'+k.slice(-1)), p.skillSlots[k]])).forEach(([,btn,skillId])=>{
    if(btn) btn.classList.toggle('channelActive', !!channelFlags[skillId]);
  });
}
// Slam (Shield Bash active): a plain tap-to-trigger button on a cooldown,
// same pattern as Throw/Guardian/etc -- no more hold-to-block behavior.
bindBtn(document.getElementById('btnSlam'), ()=>wantShieldBash=true);

