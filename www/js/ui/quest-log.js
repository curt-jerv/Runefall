// ---------- Skill Respec ----------
const respecOverlay = document.getElementById('respecOverlay');
function openRespecDialog(){
  game.modalOpen = true;
  respecOverlay.style.display = 'flex';
}
function closeRespecDialog(){
  respecOverlay.style.display = 'none';
  game.modalOpen = false;
}
function respecSkills(){
  const p = game.player;
  if(!p.skills) p.skills = {};
  // Calculate total skill points spent before resetting
  let totalPointsSpent = 0;
  for(const skillId in p.skills){
    totalPointsSpent += p.skills[skillId];
  }
  // Reset all skill ranks to 0
  for(const skillId in p.skills){
    p.skills[skillId] = 0;
  }
  // Clear assigned active skills. (v106 fix) This used to clear
  // p.mainSkill/p.activeSlot1-3, which nothing reads -- the real Main/1/2/3
  // assignments live in p.skillSlots, so a respec left stale, unusable
  // skills sitting on the buttons.
  p.skillSlots = {main:'strike', slot1:null, slot2:null, slot3:null};
  p.mainSkill = null;
  p.activeSlot1 = null;
  p.activeSlot2 = null;
  p.activeSlot3 = null;
  // Refund all spent points
  p.skillPoints = (p.skillPoints || 0) + totalPointsSpent;
  showMsg('Skills reset! All skill points refunded.', 2.0);
  recalcStats(p);
  updateSkillButtonsVisibility();
  updateSkillSlotButtonsUI();
  saveGame();
  updateQuestBadge();
  closeRespecDialog();
}
document.getElementById('respecClose').addEventListener('click', closeRespecDialog);
document.getElementById('respecCancelBtn').addEventListener('click', closeRespecDialog);
document.getElementById('respecConfirmBtn').addEventListener('click', respecSkills);

// Well menu for healing and skill reset
const wellOverlay = document.getElementById('wellOverlay');
document.getElementById('wellClose').addEventListener('click', closeWellMenu);
document.getElementById('wellHealBtn').addEventListener('click', drinkWellHeal);
document.getElementById('wellRespecBtn').addEventListener('click', ()=>{
  closeWellMenu();
  openRespecDialog();
});

// ---------- Quest Log ----------
const questBtn = document.getElementById('questBtn');
const questLogOverlay = document.getElementById('questLogOverlay');
const questLogClose = document.getElementById('questLogClose');
// v86: item 1 of the UI/UX overhaul -- completed quests can now be
// dismissed off the visible Quest Log list. JUDGMENT CALL: a manual
// dismiss ("X") button on completed entries, rather than auto-hiding a
// quest the moment it completes -- a player who just finished a quest
// probably WANTS to see that confirmation ("-- Complete") at least once,
// rather than having it silently disappear from the list out from under
// them. Purely cosmetic: dismissing sets a new `q.dismissedFromList` flag
// on the quest's own record (NOT a delete, and NOT touching `status`/
// `progress`/`rewarded`) so completion state and any reward already
// granted (see talkToQuestGiver's `q.rewarded` gate) are completely
// unaffected -- a dismissed quest's rewards were already granted before it
// could ever be dismissed, and this list is purely a display filter over
// the same p.quests array every other quest-state check still reads.
// v281: the log has two tabs. A quest moves to Completed once it is finished AND its final reward has been
// handed over; nothing needs dismissing any more and finished quests stay readable.
let questLogTab = 'active';
function questIsDone(q){ return q.status==='complete' && (q.rewarded===true || (q.rewarded===undefined && q.id!=='find_hunters')); }
function renderQuestLog(){
  const p = game.player;
  updateQuestBadge();
  const list = document.getElementById('questLogList');
  const allQuests = p.quests || [];
  document.querySelectorAll('#questTabs .treeTabBtn').forEach(el=>{
    el.classList.toggle('active', el.dataset.qtab===questLogTab);
    el.onclick = ()=>{ questLogTab = el.dataset.qtab; renderQuestLog(); };
  });
  const quests = allQuests.filter(q=> questLogTab==='completed' ? questIsDone(q) : !questIsDone(q));
  if(quests.length===0){
    list.innerHTML = '<p class="modalSub">'+(questLogTab==='completed' ? 'No completed quests yet.' : (allQuests.length===0 ? 'No quests accepted yet.' : 'No active quests.'))+'</p>';
    return;
  }
  list.innerHTML = quests.map(q=>{
    const fin = q.status==='complete';
    return '<div class="skillChoice" style="cursor:default; position:relative;">'+
      '<div><div class="schName">'+q.name+(fin?(questIsDone(q)?' &mdash; Complete':' &mdash; Reward waiting'):'')+'</div>'+
      '<div class="schDesc">'+(q.id==='light_the_way'&&q.status==='active'?(q.stage==='return'?QUEST_LIGHT_THE_WAY.descReturn:QUEST_LIGHT_THE_WAY.desc):huntQuestDesc(p,q))+'</div>'+
      ((q.id==='hidden_secrets'||q.id==='light_the_way'||q.id==='find_hunters')?'':'<div class="schDesc">Progress: '+q.progress+'/'+q.total+'</div>')+
      (q.id==='find_hunters' ? huntersStatusList(p, q).filter(h=>!h.found).map(h=>'<div class="schDesc" style="margin-top:4px; color:#e8c44a">\u2022 '+h.clue+'</div>').join('') : '')+'</div>'+
    '</div>';
  }).join('');
}
function openQuestLog(){
  if(!game || !game.started || game.over) return;
  if(game.modalOpen) return;
  try{ sfxPlay('bookOpen', 1); }catch(e){}
  game.modalOpen = true;
  questLogTab = 'active';
  renderQuestLog();
  questLogOverlay.style.display = 'flex';
}
function closeQuestLog(){
  questLogOverlay.style.display = 'none';
  game.modalOpen = false;
}
questBtn.addEventListener('click', openQuestLog);
questLogClose.addEventListener('click', closeQuestLog);
function updateQuestBadge(){
  const badge = document.getElementById('questBadge');
  const p = game && game.player;
  // v514: holding the Defensive Runestone completes The Scholar's Theory (1/1) -- go back and show it to the scholar
  if(p){ const sr = getQuest(p, 'scholar_ruins'); if(sr && sr.status==='active' && typeof findRunestone==='function' && findRunestone(p)){ sr.progress = sr.total; sr.desc = 'You found the Defensive Runestone below the lake. Return to the scholar.'; } }
  // v282: Hidden Secrets (the Ruins Map) had no end -- it now completes once you have reached the Ancient Ruins waypoint
  if(p){ const hs = getQuest(p, 'hidden_secrets'); if(hs && hs.status==='active' && hs.stage!=='toOldMan' && (p.reachedAncientRuins || p.ruinsEntranceOpen)){ hs.status='complete'; hs.rewarded=true; hs.progress=hs.total; hs.desc='You found what the map pointed to: the Ancient Ruins.'; } }
  const active = p && (p.quests||[]).some(q=>q.status==='active');
  badge.style.display = active ? 'flex' : 'none';
}

// ---------- Portal choice (Return to Town / Continue to Next Level) ----------
let portalNear = false;
const portalChoiceEl = document.getElementById('portalChoice');
const btnPortalTownEl = document.getElementById('btnPortalTown');
const btnPortalNextEl = document.getElementById('btnPortalNext');
function updatePortalChoice(near){
  if(near===portalNear) return;
  portalNear = near;
  portalChoiceEl.style.display = near ? 'flex' : 'none';
  // Return to Town is only offered on a boss-floor clear -- push past a boss
  // and you're committed until the next one, five floors later.
  btnPortalTownEl.style.display = (near && game && game.portalIsBoss) ? 'block' : 'none';
  // Spider Lair / Bear Cave are one-off zones, not endless depths -- both
  // choices just lead back out to the Forest, so the buttons say so.
  const inLairZone = near && game && (game.scene==='spiderlair' || game.scene==='bearcave' || game.scene==='minotaurcave');
  const lairBack = (game && game.scene==='minotaurcave') ? 'Return to the River Valley' : 'Return to the Forest';
  btnPortalNextEl.textContent = inLairZone ? lairBack : 'Continue to Next Level';
  btnPortalTownEl.textContent = inLairZone ? lairBack : 'Return to Mistfall';
}
bindBtn(document.getElementById('btnPortalNext'), ()=>{
  if(!portalNear) return;
  updatePortalChoice(false);
  // Spider Lair / Bear Cave are single-floor zones, not endless depths --
  // stepping through either's portal heads back to the Forest instead,
  // landing beside that same zone's own entrance gate.
  if(game.scene==='minotaurcave') enterRiverValley('minotaurcave');
  else if(game.scene==='spiderlair' || game.scene==='bearcave') enterForest(game.scene);
  else nextDepth();
});
bindBtn(btnPortalTownEl, ()=>{
  if(!portalNear || !game.portalIsBoss) return;
  updatePortalChoice(false);
  if(game.scene==='minotaurcave') enterRiverValley('minotaurcave');
  else if(game.scene==='spiderlair' || game.scene==='bearcave') enterForest(game.scene);
  else goToTownFromBoss();
});

