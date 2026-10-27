// World Map is a placeholder for this batch -- same "Coming Soon" toast
// treatment the Cat Companion/Expanded Stash features used before they
// were actually built out.
// ---- v275: Defiler's Tomb, graverobbers, scholar ----
const QUEST_GRAVEROBBERS = {
  id:'graverobbers_friend', name:"The Missing Graverobber",
  desc:"Three graverobbers camped just inside the Cursed Cemetery gate lost a companion in a hidden chamber beyond the Dark Crypt's great hall. Find him.",
  descDone:"The Defiler is dead. Return to the graverobbers camped just inside the Cursed Cemetery gate.",
  total:1,
};
function makeTemplarInscriptionItem(){
  return { id:'it'+Math.random().toString(36).slice(2,9), slotType:'questitem', rarity:'rare',
    name:'Templar Inscription', affixes:[], color:'#c8b0ff', questId:'templar_inscription', unsellable:true,
    questDesc:'A rubbing of the old Templar inscription carved inside the empty sarcophagus. A scholar might be able to read it. Quest item -- cannot be sold.' };
}
// v410: repair for saves that spent the inscription before the ruins were open: hand it back (and let the deciphering be retried)
function ruinsInscriptionRepair(p){
  if(!p || p.ruinsEntranceOpen) return;
  if(!(p.defilerSlain || p.inscriptionTaken)) return;
  if(p.ruinsEvent===2) p.ruinsEvent = 1;
  if(!hasInscription(p)){ p.inscriptionTaken = true; forceAddToBag(p, makeTemplarInscriptionItem()); showMsg('The Templar Inscription has been returned to your pack.', 3.2, '#c8b0ff'); }
}
function hasInscription(p){ return (p.inventory||[]).some(it=>it && it.questId==='templar_inscription'); }
function spawnDefiler(g){
  const TR = g.crypt.tombRoom;
  const e = spawnEnemy(g, 'bandit', {x:TR.x+TR.w/2, y:TR.y+TR.h*0.55});   // v310: mid-room, well clear of the door
  if(!e) return;
  e.defiler = true; e.possessed = true; e.isLairBoss = true; e.bossName = 'The Possessed Graverobber'; e.engaged = true;
  e.r = Math.round(e.r*1.1); e.baseR = e.r; e.maxHp = Math.round(e.maxHp*14); e.hp = e.maxHp; e.dmg *= 1.5; e.speed *= 1.0;
  e.atkCdMax = 1.9;   // v310: slower, heavier swings
  e.dfPhase = 0; e.aggroRange = 99999; e.leashRange = 99999;
  showMsg('“You’re all going to die.”', 2.6, '#c8b8ff');
  shakeScreen(g, 5, 0.5);
}
function defilerSlain(g, e){
  const p = g.player;
  if(g.crypt){ g.crypt.bossDone = true; }
  for(const x of g.enemies) if(x.noReward) x.hp = 0;
  if(p.defilerSlain && p.inscriptionTaken){ bossMsg('THE GRAVEROBBER FALLS', 'The possession breaks once more', 3.2); return; }   // v489: a re-kill
  p.defilerSlain = true;
  // v536: 'Inspect the opened tomb' stays up until the sarcophagus is searched (bigMsgHold in the crypt branch of update)
  const q = getQuest(p, QUEST_GRAVEROBBERS.id);
  if(q && q.status==='active'){ q.desc = QUEST_GRAVEROBBERS.descDone; q.progress = q.total; }
  npcMark(p, 'graverobbers', true);
  updateQuestBadge(); saveGame();
}
function drawPossessedAura(e, clock){
  const q = toIso(e.x, e.y), pulse = 0.5+0.5*Math.sin(clock*4), r = e.r*2.8;
  ctx.save(); ctx.translate(q.x, q.y); ctx.scale(1, 0.5); ctx.globalCompositeOperation = 'lighter';
  const gr = ctx.createRadialGradient(0,0,2,0,0,r); gr.addColorStop(0,'rgba(150,90,255,0.75)'); gr.addColorStop(1,'rgba(150,90,255,0)');
  ctx.globalAlpha = 0.5+0.3*pulse; ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0,0,r,0,7); ctx.fill(); ctx.restore();
}
function inspectSarcophagus(){
  const p = game.player;
  if(!p.inscriptionTaken){
    p.inscriptionTaken = true; forceAddToBag(p, makeTemplarInscriptionItem()); bagPulse();
    if(!getQuest(p, 'scholar_templar') && !p.scholarMeet){ if(!p.quests) p.quests = []; p.quests.push({id:'scholar_templar', name:'Templar Research', desc:'You found an inscription in a Templar crypt. Corwin the Scholar in the Tavern may be able to read it.', status:'active', progress:0, total:1}); npcMark(p, 'scholar', true); updateQuestBadge(); }   // v456
    showNpcText('The Sarcophagus', 'The lid was shoved aside from the inside. The stone is scored with deep claw marks and the Templar seal on its rim is shattered outward -- whatever slept here did not stay dead. It crawled its way out very recently. Carved into the inner wall is an inscription, still legible. You take a rubbing.', 'Take the rubbing');
    showMsg('Obtained: Templar Inscription', 2.6, '#c8b0ff'); saveGame();
    setTimeout(()=>{ try{ showBigMsg('Return to the graverobbers', '', 4.0, true); }catch(err){} }, 400);   // v490
  } else showNpcText('The Sarcophagus', 'Empty. The Templar seal is broken outward -- something escaped.', 'Close');
}
function graverobbersMark(p){ const q = getQuest(p, QUEST_GRAVEROBBERS.id); return !q ? !p.defilerSlain : (q.status==='active' && !!p.defilerSlain); }
// v532: the graverobbers camp just inside the Cursed Cemetery gate, round a small fire
function makeGraverobbers(camp){
  return [ {x:camp.x-60, y:camp.y-34, id:0, robe:'#4a3a2a', hood:'#2a2018', tool:'shovel'},
           {x:camp.x+52, y:camp.y-48, id:1, robe:'#34423a', hood:'#1c2a22', tool:'lantern'},
           {x:camp.x-14, y:camp.y+52, id:2, robe:'#463a52', hood:'#241c2c', tool:'shovel'} ];
}
function talkGraverobbers(){
  const p = game.player, q = getQuest(p, QUEST_GRAVEROBBERS.id);
  npcMark(p, 'graverobbers', false);
  if(!q){
    if(p.defilerSlain){ showNpcText('Graverobbers', '"You went into the Defiler\'s Tomb? Then... that was our friend, wasn\'t it. The thing wearing his face. It is dead? He can finally rest. Thank you."', 'Close'); return; }
    showNpcText('Graverobbers', '"Psst. Our friend went down into a hidden tomb below the Dark Crypt and never came back. Will you find him?"', 'Accept', ()=>{
      if(!p.quests) p.quests = [];
      if(!getQuest(p, QUEST_GRAVEROBBERS.id)) p.quests.push({id:QUEST_GRAVEROBBERS.id, name:QUEST_GRAVEROBBERS.name, desc:QUEST_GRAVEROBBERS.desc, status:'active', progress:0, total:QUEST_GRAVEROBBERS.total});
      showMsg('Quest accepted: '+QUEST_GRAVEROBBERS.name, 1.8); updateQuestBadge(); saveGame();
    });
  } else if(q.status==='active' && p.defilerSlain){
    showNpcText('Graverobbers', '"You found him... and it was not him anymore. Gods. Take this -- it is all we have left from a hundred bad nights."', 'Take reward', ()=>{
      const item = classRewardItem(p, Math.max(p.level, 18), 'reward');
      if(!giveRewardIfRoom(p, [item])) return;   // v492
      q.status = 'complete'; q.rewarded = true; q.progress = q.total; q.desc = 'You ended the Defiler. The graverobbers are grateful.';
      p.gold += 150; gainXp(game, Math.round(xpForKill(18, true)*1.5));
      showMsg('Quest complete: '+QUEST_GRAVEROBBERS.name+' — '+item.name+' + 150 gold', 3.2);
      bagPulse(); updateQuestBadge(); saveGame();
    });
  } else if(q.status==='active'){
    showNpcText('Graverobbers', '"The tomb is past the great hall, through the north wall of the Dark Crypt. Find our friend. Please."', 'Close');
  } else showNpcText('Graverobbers', '"We are thinking of going straight. Maybe. Stay safe out there."', 'Close');
}
function scholarInTavern(p){ return tavernIsOpen(p) && !p.scholarLeft; }
function scholarMark(p){ return !p.scholarMet || (!!p.fhDungeonDone && !p.scholarWarnedRR) || hasInscription(p) || (!!p.scholarMeet && !p.scholarRead && !!findRunestone(p)) || ((p.shrineStage||0)>=3 && !p.scholarEast); }
// ---- v284: the Last Wayfarer (Redridge Canyon camp) ----
function talkWayfarer(){
  const p = game.player;
  if(!p.wayfarerMet){
    showNpcText('The Last Wayfarer', '"Another living face. That fortress above is Highward -- its sky-bridge is the only way across. Light the three old watchtower beacons and it will hold. I’ll mark them on your map."', 'I’ll light them', ()=>{
      p.wayfarerMet = true;
      { const q = addQuestOnce(p, 'rr_towers', 'The Three Beacons', 'Light the three Templar watchtower beacons in Redridge Canyon.', 3); q.progress = Math.max(q.progress||0, rrBeaconCount(p)); }   // v490: counts beacons already lit
      npcMark(p, 'wayfarer', false);
      showMsg('New quest: The Three Beacons', 3.0); updateQuestBadge(); saveGame();
    });
  } else if(rrBeaconCount(p)>=3 && getQuest(p,'rr_towers') && getQuest(p,'rr_towers').rewarded===false){
    showNpcText('The Last Wayfarer', '"The bridge is whole. Take this -- you have earned it."', 'Accept', ()=>{
      const q = getQuest(p,'rr_towers');
      const it = classRewardItem(p, Math.max(p.level, game.depth||RR_DEPTH), 'reward');
      if(!giveRewardIfRoom(p, [it])) return;   // v492: keeps asking until there is room
      q.rewarded = true; tryAutoEquip(p, it);
      p.gold += 500; gainXp(game, 400 + (game.depth||RR_DEPTH)*20);
      npcMark(p, 'wayfarer', false);
      showMsg('Reward: '+it.name+' + 500 gold', 3.0); bagPulse(); updateQuestBadge(); saveGame();
    });
  } else if(rrBeaconCount(p)>0 && rrBeaconCount(p)<3){
    showNpcText('The Last Wayfarer', '"'+rrBeaconCount(p)+' of 3 burn. The towers stand east and south of here. Each span of the bridge wakes with its beacon."', 'Close');
  } else if(rrBeaconCount(p)>=3){
    showNpcText('The Last Wayfarer', '"The bridge is whole. Cross it, if you dare. Highward\u2019s keepers will not welcome you."', 'Close');
  } else showNpcText('The Last Wayfarer', '"Three towers, three beacons. Mind the lizards, and leave the buffalo be."', 'Close');
}
function talkScholar(){
  const p = game.player;
  updateQuestBadge();   // v514: keep The Scholar's Theory in step with the runestone you carry
  if(hasInscription(p) && !p.scholarMeet){
    showNpcText('Corwin the Scholar', '"A Templar crypt inscription... yes! Meet me at the Lakeside Ruins. I will wait at the entrance."', 'Give him the rubbing', ()=>{
      // v410: he only reads it -- you keep the inscription until the ruins are actually open
      p.scholarLeft = true; p.scholarMeet = true;
      p.ruinsEvent = 0;
      const q1 = getQuest(p, 'scholar_templar'); if(q1){ q1.status = 'complete'; q1.rewarded = true; q1.progress = q1.total; q1.desc = 'Corwin read the inscription.'; }
      if(!getQuest(p, 'scholar_ruins')) p.quests.push({id:'scholar_ruins', name:"The Scholar's Theory", desc:'Meet Corwin the Scholar at the Lakeside Ruins, on the island in the middle of the lake.', status:'active', progress:0, total:1});
      npcMark(p, 'scholar', false);
      showMsg('New quest: The Scholar\'s Theory', 3.0); updateQuestBadge(); saveGame();
    });
  } else if((p.shrineStage||0)>=3 && !p.scholarEast){
    showNpcText('Corwin the Scholar', '"You did it. The Runestone is activated, and it seems to be pulling east. Perhaps Frosthold can answer some questions. Go and explore the newly revealed keep. Be wary -- the dwarves are friendly to none."', 'To Frosthold', ()=>{
      p.scholarEast = true;
      { const sq = getQuest(p, 'shrine_stone'); if(sq){ sq.status='complete'; sq.rewarded=true; sq.progress=sq.total; sq.desc='The mountain judged you worthy, and Corwin read the awakened runestone.'; } }   // v456: completes here
      if(!getQuest(p, 'frost_east')) p.quests.push({id:'frost_east', name:'The Stone Draws East', desc:'The awakened runestone pulls east. The avalanche revealed the western gate of Frosthold Keep -- climb the Frosthold Tower and see what the dwarves guard.', status:'active', progress:0, total:1});
      npcMark(p, 'scholar', false);
      showMsg('New quest: The Stone Draws East', 3.0); updateQuestBadge(); saveGame();
    });
  } else if(p.hwRuneTaken && !p.scholarThirdRead){   // v490: the third runestone
    showNpcText('Corwin the Scholar', '"So the legends seem true. When the world needs it, these stones come alive, to hold back some unknown evil of the world. If it\'s as you say, that the Shadow Keep is occupied again, that must be the answer. Good luck, adventurer."', 'Close', ()=>{
      p.scholarThirdRead = true; p.scholarWarnedRR = true; npcMark(p, 'scholar', false); saveGame();
    });
  } else if(p.fhDungeonDone && !p.scholarWarnedRR){   // v490: the second runestone
    showNpcText('Corwin the Scholar', '"Amazing -- it seems the shrine in the mountain activated this runestone as well. The ancient Highward fortress, built into the side of Redridge Canyon, can tell us more about what these runestones are."', 'Close', ()=>{
      p.scholarWarnedRR = true; npcMark(p, 'scholar', false); saveGame();
    });
  } else if(p.fhDungeonKey && !p.fhDungeonDone && !p.scholarKeyTalk){   // v490: after the Commander's key
    showNpcText('Corwin the Scholar', '"So it seems the dwarves might have a runestone of their own, locked away in their dungeon. Descend through their fortress and recover it. Perhaps it will reveal more secrets about their purpose."', 'Close', ()=>{
      p.scholarKeyTalk = true; npcMark(p, 'scholar', false); saveGame();
    });
  } else if(p.scholarMeet){
    const rs = findRunestone(p);
    if(rs && !p.scholarRead){
      showNpcText('Corwin the Scholar', '"The runestone has a cryptic message: \u2018From stone to stone, the Mountain will judge its bearer.\u2019 There is an ancient altar atop the mountain summit -- the legends say it empowers the runestones. Continue through the Black Marsh and the Highlands to the Mountain Pass to find the way. Good luck, adventurer."', 'Continue', ()=>{
        { const si = classRewardItem(p, Math.max(p.level||1, 23), 'reward'); if(!giveRewardIfRoom(p, [si])) return; p.gold += 300; }   // v492: asks again until there is room
        p.scholarRead = true; bagPulse();
        const q = getQuest(p, 'scholar_ruins'); if(q){ q.status = 'complete'; q.rewarded = true; q.progress = q.total; q.desc = 'You found the first runestone below the lake.'; }
        if(!getQuest(p, 'shrine_stone')) p.quests.push({id:'shrine_stone', name:'The Mountain Judges', desc:'\u2018From stone to stone, the Mountain will judge its bearer.\u2019 Find the ancient altar atop the mountain summit: through the Black Marsh and the Barren Highlands to the Mountain Pass, then up.', status:'active', progress:0, total:1});
        npcMark(p, 'scholar', false);
        showMsg('New quest: The Mountain Judges (+ class gear and 300 gold)', 3.0); updateQuestBadge(); saveGame();
      });
    } else if(p.scholarRead && (p.shrineStage||0)>=3) showNpcText('Corwin the Scholar', '"The stone pulls east. Climb the Frosthold Tower and see what the dwarves guard."', 'Close');
    else if(p.scholarRead) showNpcText('Corwin the Scholar', '"There is an ancient altar atop the mountain summit. Continue through the Black Marsh and the Highlands to the Mountain Pass to find the way."', 'Close');
    else showNpcText('Corwin the Scholar', '"Descend through the ancient ruins and share any findings with me."', 'Close');
  } else if(!p.scholarMet){
    showNpcText('Corwin the Scholar', '"I\'m here to study the Lakeside Ruins. If you find anything that could help my research, please let me know."', 'Close', ()=>{
      p.scholarMet = true; saveGame();   // v456: no quest yet -- Templar Research starts when you find the Crypt Inscription
    });
  } else if(false){
    showNpcText('Corwin the Scholar', '', 'Accept', ()=>{
      if(!p.quests) p.quests = [];
      if(!getQuest(p, 'scholar_templar')) p.quests.push({id:'scholar_templar', name:'Templar Research', desc:'Corwin the Scholar in the Tavern wants an inscription from a Templar crypt. The graverobbers at the Cursed Cemetery speak of a hidden tomb below the Dark Crypt.', status:'active', progress:0, total:1});
      showMsg('New quest: Templar Research', 2.6); updateQuestBadge(); saveGame();
    });
  } else showNpcText('Corwin the Scholar', '"I\'m here to study the Lakeside Ruins. If you find anything that could help my research, please let me know."', 'Close');
}
// generic townsperson art (graverobbers, scholar): hood or hat, robe, one handheld prop
// v519: The Silver Locket. Mirelle arrives on the ship (she stands about the dock once the tavern re-opens). State lives in the quest itself:
// none = not met, active + progress 0 = searching the Dark Crypt, active + progress 1 = locket found, complete = done.
const LOCKET_QUEST = 'silver_locket';
function locketWomanMark(p){ const q = getQuest(p, LOCKET_QUEST); return !q || (q.status==='active' && q.progress>=q.total); }
function silverLocketFound(p){
  const q = getQuest(p, LOCKET_QUEST); if(!q || q.status!=='active') return;
  q.progress = q.total; q.desc = 'You found the silver locket in the Dark Crypt. Return it to Mirelle in Mistfall.';
  updateQuestBadge();
}
// v520: Mirelle keeps the locket -- take it from the body, the bag or the stash
function takeSilverLocket(p){
  const isL = it=>it && it.questId==='silver_locket';
  for(const k of Object.keys(p.equipment||{})) if(isL(p.equipment[k])) p.equipment[k] = null;
  if(p.inventory) for(let i=p.inventory.length-1;i>=0;i--) if(isL(p.inventory[i])) p.inventory.splice(i,1);
  try{ if(typeof recalcStats==='function') recalcStats(p); }catch(e){}
  try{ renderInventory(); }catch(e){}
}
function talkLocketWoman(){
  const p = game.player, q = getQuest(p, LOCKET_QUEST);
  if(!q){
    showNpcText('Mirelle', '"I came in on the evening ship. My family lies in the Dark Crypt, and my grandmother\'s silver locket was buried with them -- it is all I have left of her. Please, search the crypt\'s side chambers for it."', 'I will look for it', ()=>{
      addQuestOnce(p, LOCKET_QUEST, 'The Silver Locket', "Search the Dark Crypt for Mirelle's silver locket.", 1);
      npcMark(p, 'mirelle', false);
      showMsg('New quest: The Silver Locket', 3.0); updateQuestBadge(); saveGame();
    });
  } else if(q.status==='active' && q.progress>=q.total){
    showNpcText('Mirelle', '"That is her locket... the flower is still inside. Thank you, truly. I will keep it close to my heart. And here: my grandfather had this old tome, I can\'t learn anything from it. Please, take it."', 'Thank you', ()=>{
      const tome = makeSkillTomeItem(); tome.questDesc = "Mirelle's grandfather's old tome. Read it (Use, or right-click) to gain +1 skill point.";
      if(!giveRewardIfRoom(p, [tome])) return;
      takeSilverLocket(p);
      q.status = 'complete'; q.rewarded = true; q.desc = 'You returned the silver locket to Mirelle. She gave you her grandfather\'s tome.';
      p.gold += 250; showMsg('Quest complete: The Silver Locket (+250 gold, Tome of Skill)', 3.4); try{ bagPulse(); }catch(e){} updateQuestBadge(); saveGame();
    });
  } else if(q.status==='active'){
    showNpcText('Mirelle', '"Any sign of the locket? It is in the Dark Crypt, in one of the quiet side chambers. Be careful down there."', 'Close');
  } else {
    showNpcText('Mirelle', '"The ship leaves with the tide, but I think I will stay a while. Thank you again."', 'Close');
  }
}
function drawSimpleNpcIso(n, clock, o){
  o = o || {};
  const iso = toIso(n.x, n.y), t = clock||0, bob = Math.sin(t*2+(n.id||0)*1.7)*0.8;
  drawShadow(iso.x, iso.y, 14, 6);
  ctx.save(); ctx.translate(iso.x, iso.y+bob); ctx.scale(1.12,1.12);
  ctx.fillStyle = '#2a2418'; roundRect(-6,-14,5,12,2); ctx.fill(); roundRect(1,-14,5,12,2); ctx.fill();
  ctx.fillStyle = '#14100a'; roundRect(-7,-4.5,6.5,4.5,2); ctx.fill(); roundRect(0.5,-4.5,6.5,4.5,2); ctx.fill();
  ctx.fillStyle = n.robe||'#4a3a2a'; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1;
  if(n.long){ ctx.beginPath(); ctx.moveTo(-7.5,-31); ctx.lineTo(7.5,-31); ctx.lineTo(10,-3); ctx.lineTo(-10,-3); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else { roundRect(-7.5,-31,15,20,4); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#d2a57a'; ctx.beginPath(); ctx.arc(0,-36,5.6,0,7); ctx.fill();
  if(n.hood){ ctx.fillStyle = n.hood; ctx.beginPath(); ctx.arc(0,-37,6.6,3.14,6.28); ctx.lineTo(6.6,-31); ctx.lineTo(-6.6,-31); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.ellipse(0,-35,4,3.6,0,0,7); ctx.fill(); ctx.fillStyle = '#d2a57a'; ctx.beginPath(); ctx.arc(0,-34.4,3,0,3.14); ctx.fill(); }
  else if(n.hat==='captain'){   // v490: grey beard, peaked navy cap with a gold band, brass buttons
    ctx.fillStyle = '#b8b4aa'; ctx.beginPath(); ctx.moveTo(-5,-36); ctx.quadraticCurveTo(0,-26,5,-36); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1a120c'; ctx.fillRect(-2.6,-38,1.4,1.4); ctx.fillRect(1.2,-38,1.4,1.4);
    ctx.fillStyle = '#1c2236'; ctx.beginPath(); ctx.ellipse(0,-41,7,3.2,0,3.14,6.28); ctx.fill(); ctx.fillRect(-6,-42,12,2.6);
    ctx.fillStyle = '#d8b04a'; ctx.fillRect(-6,-40.2,12,1.2);
    ctx.fillStyle = '#10141f'; ctx.beginPath(); ctx.ellipse(1.5,-39.2,6.5,1.6,0,0,7); ctx.fill();
    ctx.fillStyle = '#d8b04a'; for(const by of [-27,-22,-17]){ ctx.beginPath(); ctx.arc(0,by,0.9,0,7); ctx.fill(); }
  }
  else { ctx.fillStyle = '#d8d4c8'; ctx.beginPath(); ctx.arc(0,-38,5.8,3.3,6.1); ctx.fill(); ctx.fillStyle = '#1a120c'; ctx.fillRect(-2.6,-37,1.4,1.4); ctx.fillRect(1.2,-37,1.4,1.4); ctx.strokeStyle = '#2a2418'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(-2,-36.4,2,0,7); ctx.arc(2,-36.4,2,0,7); ctx.stroke(); }
  if(n.tool==='shovel'){ ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(11,-34); ctx.lineTo(12,-1); ctx.stroke(); ctx.fillStyle = '#8a8f98'; ctx.beginPath(); ctx.moveTo(9,-3); ctx.lineTo(15,-3); ctx.lineTo(14,3); ctx.lineTo(10,3); ctx.closePath(); ctx.fill(); }
  else if(n.tool==='lantern'){ const fl = 0.7+0.3*Math.sin(t*9+n.id); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(11,-26); ctx.lineTo(11,-20); ctx.stroke(); ctx.fillStyle = 'rgba(255,190,90,'+fl+')'; roundRect(8,-20,6,7,1.5); ctx.fill(); ctx.strokeStyle = '#3a2a1a'; ctx.stroke(); }
  else if(n.tool==='book'){ ctx.fillStyle = '#6a2a2a'; roundRect(7,-24,9,7,1); ctx.fill(); ctx.fillStyle = '#e8dcc4'; ctx.fillRect(8.4,-23,6.4,5); }
  ctx.restore();
  if(o.mark) drawQuestMarkIso(n.x, n.y, t, 62);
}
// ---- v276: Lakeside deciphering defence + Flooded Temple ----
const RUINS_EVENT_T = 60, RUINS_EVENT_MAX_ENEMIES = 30;   // v456: 60s (was 120)
function talkScholarRuins(){
  const p = game.player;
  if(!p.ruinsEvent){
    showNpcText('Corwin the Scholar', '"The ring is a lock. Stand at the center stone and I will decipher it -- it will take some time. Stay close."', 'Understood', ()=>{
      p.ruinsEvent = 1; showMsg('Step to the center stone to begin deciphering.', 3.0, '#9fd8ff'); updateQuestBadge(); saveGame();
    });
  } else showNpcText('Corwin the Scholar', '\"The center stone, whenever you are ready. I will start the moment you do.\"', 'Close');
}
function startRuinsEvent(g){
  const p = g.player;
  p.ruinsEvent = 2;
  g.lake.event = {active:true, t:RUINS_EVENT_T, spawnT:1.2, slowed:false, warned:false, spawned:0};
  showBigMsg('THE STONES STIR', 'Stay by Corwin', 3.6);
  shakeScreen(g, 5, 0.8);
  g.particles.push({type:'ring', x:g.lake.ruinsSpot.x, y:g.lake.ruinsSpot.y, t:0.9, max:0.9, r:200, color:'#3ad4ff'});
}
function spawnRuinsZombie(g){
  const hx = LAKE_ISLAND_HX, hy = LAKE_ISLAND_HY, side = Math.floor(Math.random()*4);
  let x, y;
  if(side===0){ x = LAKE_CX + rand(-hx+40, hx-40); y = LAKE_CY - hy - 14; }
  else if(side===1){ x = LAKE_CX + rand(-hx+40, hx-40); y = LAKE_CY + hy + 14; }
  else if(side===2){ x = LAKE_CX - hx - 14; y = LAKE_CY + (Math.random()<0.5?-1:1)*rand(170, hy-20); }
  else { x = LAKE_CX + hx + 14; y = LAKE_CY + (Math.random()<0.5?-1:1)*rand(170, hy-20); }
  const e = spawnEnemy(g, 'zombie', {x, y});
  if(e){ e.ruinsZ = true; e.swimmer = true; e.aggroRange = 99999; e.leashRange = 99999; g.particles.push({type:'ring', x, y, t:0.5, max:0.5, r:50, color:'#7fd0ff'}); g.particles.push({type:'burst', x, y, t:0.4, max:0.4, color:'#7fd0ff'}); }
}
function updateRuinsEvent(g, dt){
  const ev = g.lake && g.lake.event; if(!ev || !ev.active) return;
  const sc = g.lake.scholarSpot;
  let near = 0, alive = 0;
  for(const e of g.enemies){ if(e.ruinsZ && e.hp>0){ alive++; if(dist(e, sc) < 85) near++; } }
  ev.slowed = near>0;
  if(ev.slowed && !ev.warned){ ev.warned = true; showMsg('Corwin is under attack! The deciphering slows.', 2.6, '#ff5a4a'); }
  if(!ev.slowed) ev.warned = false;
  const rate = Math.max(0.65, 1 - 0.05*near);   // v413: attackers at the scholar only slow the deciphering a little
  ev.t -= dt*rate; ev.spawnT -= dt;
  const prog = 1 - ev.t/RUINS_EVENT_T;
  if(ev.spawnT<=0 && alive<18 && (ev.spawned||0) < RUINS_EVENT_MAX_ENEMIES){   // v413: 30 attackers in total, then no more come
    ev.spawnT = 1.5 - prog*0.7 + Math.random()*0.5;
    const n = Math.min(prog>0.5 && Math.random()<0.5 ? 2 : 1, RUINS_EVENT_MAX_ENEMIES - (ev.spawned||0));
    for(let i=0;i<n;i++){ spawnRuinsZombie(g); ev.spawned = (ev.spawned||0)+1; }
  }
  if(g.player.hp<=0){ ev.active = false; if(g.player.ruinsEvent===2) g.player.ruinsEvent = 1; }   // v410: dying just means starting over at the center stone
  // v456: after the horde, three skeleton brutes come last -- the stones open once they fall
  if(ev.t<=10 && !ev.brutes){
    ev.brutes = true;
    for(let i=0;i<3;i++){ const a = i*2.09+0.4, x = sc.x+Math.cos(a)*230, y = sc.y+Math.sin(a)*230; const b = spawnEnemy(g, 'skeletonbrute', {x, y}); if(b){ b.ruinsZ = true; b.ruinsBrute = true; b.aggroRange = 99999; b.leashRange = 99999; g.particles.push({type:'ring', x, y, t:0.5, max:0.5, r:60, color:'#9fd8ff'}); } }
    showMsg('Skeleton brutes rise from the lake!', 2.6, '#9fd8ff');
  }
  if(ev.t<=0){ ev.t = 0; if(!g.enemies.some(e=>e.ruinsBrute && e.hp>0)) finishRuinsEvent(g); }
}
function finishRuinsEvent(g){
  const p = g.player, ev = g.lake.event;
  ev.active = false; p.ruinsEvent = 3; p.ruinsEntranceOpen = true; p.scholarLeft = false;
  { const ii = p.inventory.findIndex(it=>it && it.questId==='templar_inscription'); if(ii>=0) p.inventory.splice(ii,1); }   // v410: the inscription is spent only now
  for(const e of g.enemies) if(e.ruinsZ){ e.hp = 0; e.noReward = true; }
  showBigMsg('THE STONES OPEN', 'A stairway descends into the ruins', 4.6);
  shakeScreen(g, 8, 2.4);
  g.flashT = 1.2;
  g.particles.push({type:'burst', x:g.lake.ruinsSpot.x, y:g.lake.ruinsSpot.y, t:0.7, max:0.7, color:'#3ad4ff'});
  g.particles.push({type:'ring', x:g.lake.ruinsSpot.x, y:g.lake.ruinsSpot.y, t:0.8, max:0.8, r:260, color:'#3ad4ff'});
  const q = getQuest(p, 'scholar_ruins'); if(q) q.desc = 'Descend through the ancient ruins and share any findings with Corwin.';
  updateQuestBadge(); saveGame();
  showNpcText('Corwin the Scholar', '"At last, I\'ve opened it! I\'m only a researcher, but you descend to the bottom of that place and bring me anything of interest."', 'Continue');
}
function drawRuinsEventHud(g){
  const ev = g.lake.event, frac = clamp(1 - ev.t/RUINS_EVENT_T, 0, 1), bw = Math.min(W-40, 340), x0 = (W-bw)/2, y0 = hudBottomPx()+34;
  ctx.save();
  ctx.fillStyle = 'rgba(8,16,26,0.72)'; ctx.fillRect(x0-6, y0-18, bw+12, 40);
  ctx.font = "bold 12px Cinzel, Georgia, serif"; ctx.textAlign = 'center'; ctx.fillStyle = ev.slowed ? '#ff4a3a' : '#9fe0ff';
  const left = Math.max(0, Math.ceil(ev.t));
  ctx.fillText((ev.slowed ? 'CORWIN UNDER ATTACK  —  SLOWED  —  ' : 'DECIPHERING THE STONES  —  ')+Math.floor(left/60)+':'+String(left%60).padStart(2,'0'), W/2, y0-3);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x0, y0+4, bw, 9);
  ctx.fillStyle = ev.slowed ? '#e8703a' : '#3ad4ff'; ctx.fillRect(x0, y0+4, bw*frac, 9);
  ctx.restore();
}
function spawnSquid(g, pos){
  const e = spawnEnemy(g, 'stormsnake', pos); if(!e) return null;
  e.squid = true; e.swimmer = true; e.speed = rand(70,82); e.r = 16; e.maxHp = Math.round(e.maxHp*2); e.hp = e.maxHp; e.dmg *= 1.15; e.sparkCd = rand(0.4,2);
  e.aggroRange = 480; e.leashRange = 800; e.wanderRadius = 0; e.armor = 2;
  return e;
}
const TEMPLE_W = 4600, TEMPLE_H = 2600, TEMPLE_DEPTH = 25;
// v490: the Flooded Temple is no longer one straight line of halls. Each visit it is a new warren of flooded chambers
// (a 4x3 grid with a few cells left as solid rock) joined by winding passages: a random spanning tree plus a couple of
// loops. You arrive on the west side; the stair down waits in one of the chambers furthest from the entrance.
// The layout keeps its seed while you go down to the Sunken Depths and back (see enterFloodedTemple).
function templeReachable(R, blocked, from, targets){
  const m = R.floorMask, C = m.cols, CELL = m.CELL, seen = new Uint8Array(C*m.rows);
  const open = (ix,iy)=> ix>=0 && iy>=0 && ix<C && iy<m.rows && m.data[iy*C+ix] && !blocked(ix*CELL+CELL/2, iy*CELL+CELL/2);
  const s = Math.floor(from.y/CELL)*C + Math.floor(from.x/CELL); if(s<0 || s>=seen.length) return false;
  const q = [s]; seen[s] = 1;
  for(let h=0; h<q.length; h++){ const i = q[h], x = i%C, y = (i/C)|0; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx = x+dx, ny = y+dy; if(!open(nx,ny)) continue; const j = ny*C+nx; if(!seen[j]){ seen[j] = 1; q.push(j); } } }
  return targets.every(t=>seen[Math.floor(t.y/CELL)*C + Math.floor(t.x/CELL)]);
}
function makeFloodedTemple(){
  const w = TEMPLE_W, h = TEMPLE_H, g = game;
  const seed = (g && g.templeSeed) || (1 + Math.floor(Math.random()*1e9)), rnd = subSeeded(seed), saveRand = Math.random;
  Math.random = rnd;
  let room, waypoint = null;
  try{
    const COLS = 4, ROWS = 3, cw = w/COLS, ch = h/ROWS, ri = (a,b)=>a+Math.floor(rnd()*(b-a+1));
    const entRow = ri(0, ROWS-1), entId = entRow*COLS;
    const nb = i=>{ const c = i%COLS, r = (i/COLS)|0, o = []; if(c>0) o.push(i-1); if(c<COLS-1) o.push(i+1); if(r>0) o.push(i-COLS); if(r<ROWS-1) o.push(i+COLS); return o; };
    // leave 2-3 cells as solid rock, as long as the rest stays connected
    const keep = new Set(Array.from({length:COLS*ROWS}, (_,i)=>i));
    const connected = ()=>{ const seen = new Set([entId]), q = [entId]; while(q.length){ const i = q.pop(); for(const n of nb(i)) if(keep.has(n) && !seen.has(n)){ seen.add(n); q.push(n); } } return seen.size===keep.size; };
    for(let k=0, t=0, drop=ri(2,3); k<drop && t<60; t++){ const i = ri(0, COLS*ROWS-1); if(i===entId || !keep.has(i)) continue; keep.delete(i); if(connected()) k++; else keep.add(i); }
    const ids = [entId, ...[...keep].filter(i=>i!==entId)];
    const idx = new Map(ids.map((id,k)=>[id,k]));
    const chs = ids.map(id=>{
      const c = id%COLS, r = (id/COLS)|0, ent = id===entId;
      const rx = ent ? 230 : 250 + rnd()*90, ry = ent ? 200 : 205 + rnd()*70;
      const x = clamp((c+0.5)*cw + (rnd()-0.5)*260, rx+160, w-rx-160), y = clamp((r+0.5)*ch + (rnd()-0.5)*200, ry+160, h-ry-160);
      return {x:ent ? Math.max(rx+170, x-120) : x, y, rx, ry, cell:id};
    });
    // passages: a random spanning tree over neighbouring cells, then two extra loops
    const links = [], linked = new Set(), lk = (a,b)=>Math.min(a,b)+'-'+Math.max(a,b);
    { const seen = new Set([entId]), stack = [entId];
      while(stack.length){ const cur = stack[stack.length-1], nx = nb(cur).filter(n=>keep.has(n) && !seen.has(n)); if(!nx.length){ stack.pop(); continue; } const n = nx[ri(0,nx.length-1)]; seen.add(n); stack.push(n); links.push([idx.get(cur), idx.get(n)]); linked.add(lk(cur,n)); } }
    for(let k=0, t=0; k<2 && t<60; t++){ const a = ids[ri(0,ids.length-1)], ns = nb(a).filter(n=>keep.has(n)), b = ns[ri(0, Math.max(0,ns.length-1))]; if(b==null || linked.has(lk(a,b))) continue; linked.add(lk(a,b)); links.push([idx.get(a), idx.get(b)]); k++; }
    // the stair down: a chamber at (or next to) the greatest passage distance from the entrance
    const depth = new Array(chs.length).fill(-1); depth[0] = 0;
    { const q = [0]; while(q.length){ const i = q.shift(); for(const [a,b] of links){ const o = a===i ? b : b===i ? a : -1; if(o>=0 && depth[o]<0){ depth[o] = depth[i]+1; q.push(o); } } } }
    const maxD = Math.max(...depth), far = chs.map((_,i)=>i).filter(i=>i>0 && depth[i]>=Math.max(1, maxD-1));
    const sIdx = far[ri(0, far.length-1)];
    const mains = chs.map((_,i)=>i).filter(i=>i>0);
    const R = organicCaveBuild({kind:'temple', w, h, chambers:chs, links, tunnelR:100, entranceIdx:0, exitIdx:sIdx, mainIdx:mains});
    const ent = chs[0], sc = chs[sIdx];
    const openAround = (x,y,m)=> mineOpenAt(R,x,y) && mineOpenAt(R,x+m,y) && mineOpenAt(R,x-m,y) && mineOpenAt(R,x,y+m) && mineOpenAt(R,x,y-m);
    const entrance = {x:ent.x-ent.rx*0.55, y:ent.y, r:34};
    for(let k=0.55; k>0.1 && !openAround(entrance.x, entrance.y, 60); k-=0.08) entrance.x = ent.x-ent.rx*k;
    for(const [ox,oy] of [[60,-0.55],[60,0.55],[140,-0.4],[140,0.4],[0,-0.45],[0,0.45]]){ const x = ent.x+ox, y = ent.y+oy*ent.ry; if(openAround(x,y,55)){ waypoint = {x, y, r:22}; break; } }
    if(!waypoint) waypoint = {x:ent.x+80, y:ent.y-90, r:22};
    const stairsDown = {x:sc.x+40, y:sc.y, r:30};
    // flooded pools in the chambers (never on the entrance, waypoint or stair), each kept only if every chamber stays reachable
    const pools = [], targets = [entrance, waypoint, stairsDown, ...chs.map(c=>({x:c.x, y:c.y}))];
    const wetAt = (x,y,m)=> pools.some(q=>x>q.x-m && x<q.x+q.w+m && y>q.y-m && y<q.y+q.h+m);
    for(let i=1;i<chs.length;i++){
      const c = chs[i], n = i===sIdx ? 1 : 2;
      for(let k=0;k<n;k++){
        const a = rnd()*6.28, pw = Math.round(c.rx*(0.42+rnd()*0.25)), ph = Math.round(c.ry*(0.36+rnd()*0.22));
        const cx = c.x+Math.cos(a)*c.rx*0.45, cy = c.y+Math.sin(a)*c.ry*0.45, q = {x:Math.round(cx-pw/2), y:Math.round(cy-ph/2), w:pw, h:ph};
        let ok = true;
        for(let yy=q.y-30; yy<=q.y+q.h+30 && ok; yy+=25) for(let xx=q.x-30; xx<=q.x+q.w+30; xx+=25) if(!mineOpenAt(R,xx,yy)){ ok = false; break; }
        if(!ok || pools.some(o=>q.x<o.x+o.w+80 && q.x+q.w>o.x-80 && q.y<o.y+o.h+80 && q.y+q.h>o.y-80)) continue;
        if([stairsDown, waypoint, entrance].some(t=>t.x>q.x-110 && t.x<q.x+q.w+110 && t.y>q.y-110 && t.y<q.y+q.h+110)) continue;
        pools.push(q);
        if(!templeReachable(R, (x,y)=>wetAt(x,y,22), {x:entrance.x+90, y:entrance.y}, targets)) pools.pop();
      }
    }
    for(const q of pools) R.obstacles.push({x:q.x, y:q.y, w:q.w, h:q.h, isWater:true});
    // columns, statues and braziers dress the chambers
    const blockedAt = (x,y,m)=> wetAt(x,y,m) || R.obstacles.some(o=>!o.organic && !o.isWater && x>o.x-m && x<o.x+o.w+m && y>o.y-m && y<o.y+o.h+m);
    const nearKey = (x,y,d)=> [entrance, waypoint, stairsDown].some(t=>Math.hypot(x-t.x, y-t.y) < d);
    const statues = [], braziers = [];
    for(let i=0;i<chs.length;i++){
      const c = chs[i];
      if(i>0 && c.rx>=285){
        for(const [fx,fy] of [[-0.5,-0.42],[0.5,-0.42],[-0.5,0.42],[0.5,0.42]]){
          if(rnd()<0.35) continue;
          const x = c.x+fx*c.rx, y = c.y+fy*c.ry, sz = 50;
          if(!openAround(x,y,70) || blockedAt(x,y,70) || nearKey(x,y,140)) continue;
          const o = {x:Math.round(x-sz/2), y:Math.round(y-sz/2), w:sz, h:sz, col:['#a7b3ab','#4f5a55','#76827b'], hz:96, templeCol:true};
          R.obstacles.push(o);
          const cols = R.obstacles.filter(q=>q.templeCol);
          if(!templeReachable(R, (px,py)=>wetAt(px,py,22) || cols.some(q=>px>q.x-22 && px<q.x+q.w+22 && py>q.y-22 && py<q.y+q.h+22), {x:entrance.x+90, y:entrance.y}, targets)) R.obstacles.pop();
        }
      }
      for(let t=0;t<8;t++){
        const a = rnd()*6.28, x = c.x+Math.cos(a)*c.rx*0.6, y = c.y+Math.sin(a)*c.ry*0.6;
        if(!openAround(x,y,50) || blockedAt(x,y,40) || nearKey(x,y,120)) continue;
        statues.push({x, y}); R.obstacles.push({x:x-18, y:y-14, w:36, h:28, isProp:true}); break;
      }
    }
    for(const c of [ent, sc]) for(const s of [-1,1]){ const x = c.x+(c===ent?150:-110), y = c.y+s*95; if(mineOpenAt(R,x,y) && !blockedAt(x,y,20)) braziers.push({x, y}); }
    let altar = {x:sc.x+40, y:sc.y-Math.min(150, sc.ry*0.55)};
    if(!openAround(altar.x, altar.y, 60) || blockedAt(altar.x, altar.y, 60)) altar = {x:sc.x+40, y:sc.y+Math.min(150, sc.ry*0.55)};
    if(openAround(altar.x, altar.y, 60) && !blockedAt(altar.x, altar.y, 60)) R.obstacles.push({x:altar.x-44, y:altar.y-26, w:88, h:52, isProp:true});
    Object.assign(R, { subzone:'temple', entrance, entranceSide:'left', entranceSpot:{x:entrance.x+90, y:entrance.y}, stairsDown, pools, rocks:[], name:'Flooded Temple',
      wallPal:['#5f6e68','#26302d','#3a4743'], pal:['#3e4a46','#36423e','#47554f','#303b37'], templeDeco:{statues, braziers, altar}, templeSeed:seed });
    room = R;
  } finally { Math.random = saveRand; }
  subFinish(room);
  room.waypoint = waypoint;   // v283: Ancient Ruins waypoint, just inside the temple
  room.chestSpot = null;
  return room;
}
function drawTempleStatueIso(st){
  const iso = toIso(st.x, st.y);
  drawShadow(iso.x, iso.y, 20, 8);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle = '#4c5853'; ctx.strokeStyle = '#1a201e'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-16,0); ctx.lineTo(-16,-12); ctx.lineTo(16,-12); ctx.lineTo(16,0); ctx.closePath(); ctx.fill(); ctx.stroke();   // plinth
  ctx.fillStyle = '#7d8a84';
  ctx.beginPath(); ctx.moveTo(-9,-12); ctx.lineTo(-11,-46); ctx.quadraticCurveTo(0,-54,11,-46); ctx.lineTo(9,-12); ctx.closePath(); ctx.fill(); ctx.stroke();   // robed figure
  ctx.beginPath(); ctx.arc(0,-55,6.5,0,7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#5e6b65'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-9,-36); ctx.lineTo(0,-30); ctx.lineTo(9,-36); ctx.stroke();   // hands at prayer
  ctx.fillStyle = 'rgba(80,140,90,0.55)'; ctx.beginPath(); ctx.ellipse(-4,-20,5,9,0.3,0,7); ctx.fill();   // moss
  ctx.restore();
}
function drawTempleBrazierIso(b, clock){
  const iso = toIso(b.x, b.y), t = clock||0;
  drawShadow(iso.x, iso.y, 12, 5);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle = '#3a3f3c'; ctx.fillRect(-2.5,-26,5,26); ctx.fillStyle = '#5a605c'; ctx.beginPath(); ctx.ellipse(0,-27,11,4.5,0,0,7); ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  const fl = 0.7+0.3*Math.sin(t*9+b.x);
  const gr = ctx.createRadialGradient(0,-34,1,0,-34,34); gr.addColorStop(0,'rgba(120,220,210,'+(0.6*fl)+')'); gr.addColorStop(1,'rgba(40,120,120,0)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0,-34,34,0,7); ctx.fill();
  ctx.fillStyle = 'rgba(180,255,240,'+(0.8*fl)+')'; ctx.beginPath(); ctx.moveTo(-6,-28); ctx.quadraticCurveTo(0,-46-6*fl,6,-28); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawTempleAltarIso(a){
  const iso = toIso(a.x, a.y);
  drawShadow(iso.x, iso.y, 46, 16);
  ctx.save(); ctx.translate(iso.x, iso.y);
  for(let k=0;k<3;k++){ ctx.fillStyle = ['#38423e','#44504b','#525f59'][k]; ctx.beginPath(); ctx.ellipse(0, -k*5, 60-k*14, 24-k*6, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#6c7a73'; ctx.strokeStyle = '#1a201e'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-22,-14); ctx.lineTo(-22,-36); ctx.lineTo(22,-36); ctx.lineTo(22,-14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#c9b56a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0,-34); ctx.lineTo(0,-18); ctx.moveTo(-7,-28); ctx.lineTo(7,-28); ctx.stroke();
  ctx.restore();
}
function spawnFloodedTemple(g){
  // v490: packs land on open cave floor (the temple is a cave-style floor mask now, not one open box)
  const room = g.room, av = [{x:room.entrance.x, y:room.entrance.y, r:380}];
  const okAt = (pt)=> mineOpenAt(room,pt.x,pt.y) && !subWaterAt(room,pt.x,pt.y) && !posBlockedByObstacles(pt.x,pt.y,18,room.obstacles);
  for(let i=0;i<16;i++){
    const c = deepMineSpot(room, av, 80); if(!c) continue;
    for(let k=0;k<3+Math.floor(Math.random()*2);k++){ const pt = {x:c.x+rand(-70,70), y:c.y+rand(-70,70)}; if(okAt(pt)) spawnEnemy(g, 'zombie', pt); }
  }
  for(const q of room.pools){ if(Math.random()<0.5){ const sp2 = subWaterSpot(room, q); if(sp2) spawnEel(g, sp2); } }   // v456: eels in the flooded halls
  for(const q of room.pools){
    for(let k=0;k<2;k++){ const sp = subWaterSpot(room, q); if(sp) spawnSquid(g, sp); }
  }
  if(room.pools.length) for(let i=0;i<3;i++){ const q = room.pools[(i*2)%room.pools.length], sp = subWaterSpot(room, q); if(sp) spawnEnemy(g, 'alligator', sp); }
}

