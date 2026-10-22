// ---------------- Dragon Bolt, Obsidian Obelisk, Runeforge (v177) ----------------
function hasItemQ(p, qid){ return (p.inventory||[]).some(it=>it && it.questId===qid); }
function makeDragonBoltItem(){
  return { id:'it'+Math.random().toString(36).slice(2,9), slotType:'questitem', rarity:'rare', shape:[2,4],
    name:'Dragon Bolt', affixes:[], color:'#ffb347', questId:'dragon_bolt', unsellable:true,
    questDesc:'A javelin of dragon-bone and star-iron, humming with old fire. Hurl it at Gojira once she falls below 10% life -- it will end her. Quest item -- cannot be sold.' };
}
function makeObsidianRuneItem(){
  return { id:'it'+Math.random().toString(36).slice(2,9), slotType:'questitem', rarity:'rare', shape:[2,4],
    name:'Obsidian Obelisk', affixes:[], color:'#b48cff', questId:'obsidian_runestone', unsellable:true,
    questDesc:'A tall shard of black glass, cold to the touch, its runes still glowing with dragon fire. Someone in town could use this. Quest item -- cannot be sold.' };
}
function huntsAllDone(p){
  return HUNTER_QUESTS.every(d=>{ const q = getQuest(p, d.Q.id); return q && q.status==='complete'; });
}
function gojiraQuest(p){ return addQuestOnce(p, 'slay_gojira', 'Gojira, the Crater Dragon', 'Slay Gojira in Redridge Crater. When she falls below 10% life, hurl the Dragon Bolt.', 1); }
// 'bolt' = the Hunter hands over the Dragon Bolt; 'reward' = the Hunter thanks you for the Obsidian Obelisk
function gojiraChainStage(p){
  if(p.obsidianTaken && !p.hunterRuneRewarded) return 'reward';
  if(!p.gojiraSlain && huntsAllDone(p) && (p.reachedRedridge || (p.wmSeen && p.wmSeen.redridge)) && !hasItemQ(p,'dragon_bolt')) return 'bolt';   // v456: only once Redridge Canyon is reached
  return null;
}
const HUNTER_BOLT_TEXT = '"Four beasts felled. One remains: Gojira, the dragon of Redridge Crater. Take this Dragon Bolt -- throw it once she is under a tenth of her life."';
const HUNTER_RUNE_TEXT = '"You slew Gojira! Two skill points are yours."';
function claimGojiraChain(p, stage){
  if(stage==='bolt'){
    if(!giveRewardIfRoom(p, [makeDragonBoltItem()])) return;   // v493
    p.dragonboltGiven = true;
    gojiraQuest(p);
    showMsg('Dragon Bolt obtained — hurl it when Gojira is below 10% life', 3.2);
    bagPulse(); updateQuestBadge(); saveGame();
  } else if(stage==='reward'){
    p.hunterRuneRewarded = true;
    p.skillPoints = (p.skillPoints||0) + 2;
    const q = getQuest(p, 'slay_gojira');
    if(q && q.status==='active') q.desc = 'Garrick the Hunter thanks you. Someone in town could use the Obsidian Obelisk.';
    showMsg('+2 Skill Points', 3.0);
    try{ if(typeof updateSkillPointsUi==='function') updateSkillPointsUi(); }catch(e){}
    updateQuestBadge(); saveGame();
  }
}
function obsidianRuneAvailable(p){ return !!p.gojiraSlain && !p.obsidianTaken && !p.runeforgeUnlocked; }
function takeObsidianRune(){
  const g = game, p = g.player;
  if(!p.gojiraSlain){ showMsg('The Obsidian Obelisk is guarded -- Gojira still lives.', 2.4, '#ff9a6a'); return; }
  if(!obsidianRuneAvailable(p)) return;
  forceAddToBag(p, makeObsidianRuneItem());
  p.obsidianTaken = true;
  const q = getQuest(p, 'slay_gojira');
  if(q && q.status==='active') q.desc = 'You hold the Obsidian Obelisk. Someone in town could use this.';
  showMsg('Obsidian Obelisk obtained — someone in town could use this', 3.2);
  bagPulse(); updateQuestBadge(); saveGame();
}
// Blacksmith: hand over the runestone -> the Runeforge anvil appears beside him
const SMITH_RUNE_TEXT = '"Obsidian and old runes... give it here. I will set it into a forge of its own. It is not a gentle fire -- the runes choose the fate of whatever you lay on it."';
function giveRuneToSmith(){
  const p = game.player;
  p.inventory = p.inventory.filter(it=>!(it && it.questId==='obsidian_runestone'));
  p.runeforgeUnlocked = true;
  const q = getQuest(p, 'slay_gojira');
  if(q){ q.status = 'complete'; q.rewarded = true; q.progress = q.total; q.desc = 'Brom set the Obsidian Obelisk into an Obsidian Forge beside his forge.'; }
  gainXp(game, Math.round(xpForKill(44, true)*3));
  showMsg('Obsidian Forge unlocked — it now stands by Brom', 3.2);
  updateQuestBadge(); bagPulse(); saveGame();
}
// ---- the Runeforge ----
function runeforgeEligible(it){ return !!(it && it.slotType!=='questitem' && it.slotType!=='potion' && it.affixes && (it.runeforged||0)<2); }
function runeforgeOutcomes(it){
  const o = [];
  if(!it || !it.forgeDoubled) o.push('double');
  if(!it || (isSocketable(it) && (it.sockets||0)<4)) o.push('socket');
  o.push('skill');
  return o;   // plus a flat 25% chance to destroy (handled in runeforgeDo)
}
function forgeDoubleItem(it){
  let n = 0;
  for(const a of it.affixes){
    if(a.implicit || a.base || a===itemBaseAffix(it) || a.doubledFrom!=null || typeof a.value!=='number' || isBooleanAffixKey(a.key) || a.skillTree || a.skillGroup || a.allSkills) continue;
    a.doubledFrom = a.value; a.value = Math.round(a.value*2*100)/100; n++;
  }
  it.forgeDoubled = true;
  return n;
}
function forgeAddSkillImplicit(it){
  let ex = it.affixes.find(a=>a.forgeSkill);
  if(ex){ ex.value += 1; return ex; }
  ex = {key:'allSkills', label:'All Skills', allSkills:true, value:1, implicit:true, forgeSkill:true};
  let last = -1; it.affixes.forEach((a,i)=>{ if(a.implicit) last = i; });
  if(last<0){ const b = itemBaseAffix(it); last = b ? it.affixes.indexOf(b) : -1; }
  it.affixes.splice(last+1, 0, ex);
  return ex;
}
function forgeFloatText(txt, col){
  const bench = document.getElementById('socketBench'); if(!bench) return;
  if(getComputedStyle(bench).position==='static') bench.style.position = 'relative';
  const d = document.createElement('div');
  d.textContent = txt;
  d.style.cssText = 'position:absolute;left:50%;top:6px;transform:translate(-50%,0);font-weight:800;font-size:18px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;pointer-events:none;z-index:9;text-shadow:0 0 8px '+col+',0 2px 3px #000;color:'+col;
  bench.appendChild(d);
  try{ d.animate([{transform:'translate(-50%,0)',opacity:0},{transform:'translate(-50%,-14px)',opacity:1,offset:.2},{transform:'translate(-50%,-44px)',opacity:1,offset:.75},{transform:'translate(-50%,-64px)',opacity:0}], {duration:2600, easing:'ease-out'}); }catch(e){}
  setTimeout(()=>{ if(d.parentNode) d.parentNode.removeChild(d); }, 2650);
}
function renderRuneforgePanel(){
  const p = game.player;
  let it = game.socketItem;
  if(it && p.inventory.indexOf(it)<0 && !Object.keys(p.equipment||{}).some(k=>p.equipment[k]===it)){ it = game.socketItem = null; }
  const bench = document.getElementById('socketBench');
  bench.classList.toggle('hasItem', !!it);
  document.getElementById('socketBenchEmpty').style.display = it ? 'none' : '';
  const holder = document.getElementById('socketBenchItem');
  if(it){
    const n = it.sockets||0; let dots = '';
    if(isSocketable(it)) for(let i=0;i<Math.max(MAX_SOCKETS,n);i++) dots += '<span class="sockDot'+(i<n?' on':'')+'"></span>';
    holder.innerHTML =
      '<div style="color:'+it.color+'; font-weight:700; font-size:14px;">'+it.name+'</div>'+
      '<div style="font-size:11px; letter-spacing:.04em; text-transform:uppercase; margin-bottom:6px;">'+itemSubtitle(it)+'</div>'+
      it.affixes.map(a=>'<div>'+affixTooltipLine(a)+'</div>').join('')+
      (dots ? '<div class="sockRow">'+dots+'</div>' : '');
  } else holder.innerHTML = '';
  const outs = it ? runeforgeOutcomes(it) : ['double','socket','skill'];
  const pct = Math.round(75/outs.length);
  const NM = {double:['Double enchanted — mod values doubled','#7fe07f'], socket:['Four sockets','#c9b6ff'], skill:['+1 to all skills (second implicit)','#7fd0ff']};
  let h = game.forgeMsg ? '<div style="margin-bottom:8px;padding:6px 8px;border:1px solid rgba(255,200,120,.5);border-radius:6px;background:rgba(80,30,10,.5);color:#ffe2a0;">'+game.forgeMsg+'</div>' : '';
  h += 'The obsidian chooses one fate:<br>' + outs.map(k=>'<span style="color:'+NM[k][1]+'">'+pct+'% '+NM[k][0]+'</span>').join('<br>') + '<br><span style="color:#ff8a6a">25% The item is destroyed</span>';
  if(it) h += '<div style="font-size:11px;opacity:.85;margin-top:4px;">Forged '+(it.runeforged||0)+' / 2 times. After the second forge the item burns crimson.</div>';
  document.getElementById('socketInfo').innerHTML = h;
  const armed = it && game.forgeArm && game.forgeArm.item===it && performance.now()-game.forgeArm.t<5000;
  const btn = document.getElementById('socketDoBtn');
  btn.textContent = armed ? 'Tap again — 25% to destroy!' : 'Obsidian Forge — Free';
  btn.style.opacity = it ? '1' : '0.45';
}
function runeforgeDo(){
  const g = game, p = g.player, it = g.socketItem;
  if(!it){ showMsg('Place an item on the anvil first', 1.6, '#ffd93a'); return; }
  if(!g.forgeArm || g.forgeArm.item!==it || performance.now()-g.forgeArm.t>5000){
    g.forgeArm = {item:it, t:performance.now()}; renderRuneforgePanel();
    setTimeout(()=>{ if(g.openVendor==='runeforge' && shopOverlay.style.display==='flex') renderRuneforgePanel(); }, 5100);
    return;
  }
  g.forgeArm = null;
  if((it.runeforged||0)>=2){ showMsg('This item has already been through the forge twice', 1.8, '#ffd93a'); return; }
  const outs = runeforgeOutcomes(it);
  const pick = Math.random()<0.25 ? 'destroy' : outs[Math.floor(Math.random()*outs.length)];
  let msg = '', col = '#ffe2a0', floatTxt = '';
  if(pick==='socket'){
    it.sockets = 4; msg = 'The obsidian burns a <b>fourth socket</b> into '+it.name+'!'; col = '#c9b6ff'; floatTxt = 'Four sockets';
  } else if(pick==='double'){
    const n = forgeDoubleItem(it);
    msg = n ? 'The obsidian doubles the power of '+it.name+'\'s mods!' : 'The obsidian flares, but there were no mods to double.'; col = '#7fe07f'; floatTxt = 'Double enchanted';
  } else if(pick==='skill'){
    forgeAddSkillImplicit(it);
    msg = 'A second implicit binds to '+it.name+': <b>+1 to all skills</b>'; col = '#7fd0ff'; floatTxt = '+1 all skills';
  } else {
    const nm = it.name;
    const bi = p.inventory.indexOf(it); if(bi>=0) p.inventory.splice(bi,1);
    for(const k of Object.keys(p.equipment||{})) if(p.equipment[k]===it) p.equipment[k] = null;
    g.socketItem = null;
    msg = nm+' shatters into glowing ash...'; col = '#ff8a6a'; floatTxt = 'Destroyed';
    try{ achFlag('obsidianLoss'); }catch(e){}   // v489
  }
  if(pick!=='destroy'){
    it.runeforged = (it.runeforged||0)+1;
    if(it.runeforged>=2){ it.color = '#8e0f26'; it.crimson = true; msg += '<br><span style="color:#d4344f">The item now burns crimson — it can be forged no more.</span>'; }
  }
  g.forgeMsg = msg;
  try{ recalcStats(p); }catch(e){}
  g.flashT = Math.max(g.flashT||0, pick==='destroy' ? 0.25 : 0.4);
  shakeScreen(g, pick==='destroy' ? 8 : 4, 0.25);
  showMsg(floatTxt, 2.0, col);
  try{ if(typeof renderInventory==='function') renderInventory(); }catch(e){}
  saveGame(); renderShop();
  forgeFloatText(floatTxt, pick==='destroy' ? '#ff8a6a' : col);
}
function drawRuneforgeAnvilIso(a, clock){
  const iso = toIso(a.x, a.y), t = clock||0;
  drawShadow(iso.x, iso.y, 44, 15);
  ctx.save(); ctx.translate(iso.x, iso.y);
  const gl = ctx.createRadialGradient(0,-18,2,0,-18,60);
  gl.addColorStop(0,'rgba(190,120,255,'+(0.28+0.12*Math.sin(t*2.2))+')'); gl.addColorStop(1,'rgba(190,120,255,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0,-18,60,0,7); ctx.fill();
  // plinth
  ctx.fillStyle = '#0e0912'; ctx.strokeStyle = '#3a2848'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-22,0); ctx.lineTo(-16,-12); ctx.lineTo(16,-12); ctx.lineTo(22,0); ctx.lineTo(0,9); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1c1226'; ctx.beginPath(); ctx.moveTo(0,9); ctx.lineTo(22,0); ctx.lineTo(16,-12); ctx.lineTo(0,-6); ctx.closePath(); ctx.fill();
  // waist
  ctx.fillStyle = '#150d1c'; ctx.beginPath(); ctx.moveTo(-10,-12); ctx.lineTo(-7,-24); ctx.lineTo(7,-24); ctx.lineTo(10,-12); ctx.closePath(); ctx.fill(); ctx.stroke();
  // face + horn
  ctx.fillStyle = '#241634'; ctx.strokeStyle = '#4a3560';
  ctx.beginPath(); ctx.moveTo(-30,-26); ctx.lineTo(-20,-34); ctx.lineTo(20,-34); ctx.lineTo(28,-28); ctx.lineTo(36,-30); ctx.lineTo(24,-24); ctx.lineTo(12,-22); ctx.lineTo(-24,-22); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.beginPath(); ctx.moveTo(-20,-34); ctx.lineTo(20,-34); ctx.lineTo(18,-31); ctx.lineTo(-18,-31); ctx.closePath(); ctx.fill();
  // glowing runes
  const gw = 0.6+0.35*Math.sin(t*2.6);
  ctx.strokeStyle = 'rgba(220,160,255,'+gw+')'; ctx.lineWidth = 1.8; ctx.shadowColor = 'rgba(200,120,255,0.95)'; ctx.shadowBlur = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-14,-29); ctx.lineTo(-9,-31); ctx.lineTo(-9,-25); ctx.moveTo(-3,-31); ctx.lineTo(3,-27); ctx.lineTo(-3,-24); ctx.moveTo(9,-31); ctx.lineTo(9,-24); ctx.moveTo(14,-30); ctx.lineTo(19,-27); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-3,-20); ctx.lineTo(3,-16); ctx.moveTo(3,-20); ctx.lineTo(-3,-16); ctx.stroke();
  ctx.restore();
}

function drawFrostholdFloor(room, cam){
  const TS = 46, Wl = room.wall, In = room.inner, cy = room.h/2, CZ = room.causeway, WA = room.approach;
  const tcx = (In.x0+In.x1)/2;
  for(let wx=-GROUND_MARGIN; wx<=room.w+GROUND_MARGIN; wx+=TS){
    for(let wy=-GROUND_MARGIN; wy<=room.h+GROUND_MARGIN; wy+=TS){
      const iso = toIso(wx,wy);
      const sx = iso.x - cam.x, sy = iso.y - cam.y;
      if(sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      const checker = (((Math.floor(wx/TS)+Math.floor(wy/TS))%2)+2)%2;
      const inside = wx>Wl.x0 && wx<Wl.x1 && wy>Wl.y0 && wy<Wl.y1;
      const court = wx>In.x0 && wx<In.x1 && wy>In.y0 && wy<In.y1;
      const eastF = wx > Wl.x1 ? clamp((wx-Wl.x1)/(room.w-Wl.x1),0,1) : 0;
      const onLane = Math.abs(wy-cy) < 70;
      const road = (onLane && (wx < Wl.x0+40 || wx > Wl.x1-40 || (wx > In.x1-90 && wx < In.x1+420))) || (court && Math.hypot(wx-tcx, wy-cy) < 300);
      const ring = inside && !court && ((wx < In.x0-80 || wx > In.x1+80) ? (Math.abs(wx-(wx<In.x0?(Wl.x0+In.x0)/2:(Wl.x1+In.x1)/2)) < 70) : (Math.abs(wy-(wy<In.y0?(Wl.y0+In.y0)/2:(Wl.y1+In.y1)/2)) < 70));   // a paved lane round the ring
      if(eastF>0){
        // snow melts into red canyon dirt toward Redridge
        const hs = ((Math.floor(wx/TS)*73856093) ^ (Math.floor(wy/TS)*19349663)) & 7;
        const a = road ? (checker?[180,191,202]:[165,177,189]) : (checker?[230,238,245]:[214,226,236]);
        const b = road ? (checker?[238,208,158]:[226,194,142]) : (hs===0?[160,92,58]:checker?[186,120,76]:[174,108,66]);
        const f = clamp(eastF*1.5-0.15,0,1) * (hs<3 && eastF<0.6 ? 0.6 : 1);
        ctx.fillStyle = 'rgb('+Math.round(a[0]+(b[0]-a[0])*f)+','+Math.round(a[1]+(b[1]-a[1])*f)+','+Math.round(a[2]+(b[2]-a[2])*f)+')';
      }
      else if(court) ctx.fillStyle = road ? (checker ? '#c4cdd6' : '#b6c0cb') : (checker ? '#9aa4b1' : '#8e98a5');
      else if(road) ctx.fillStyle = checker ? '#b4bfca' : '#a5b1bd';
      else if(ring) ctx.fillStyle = checker ? '#929cab' : '#858f9d';
      else if(inside) ctx.fillStyle = checker ? '#8993a0' : '#7c8794';
      else ctx.fillStyle = checker ? '#e6eef5' : '#d6e2ec';
      drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
    }
  }
}
function drawKeepChunk(c){
  const hz = c.hz;
  let top='#98a2ae', right='#4a535e', front='#6a7480';
  if(c.kind==='tower'){ top='#8892a0'; right='#3f4853'; front='#5c6672'; }
  else if(c.kind==='house'){ top='#7a6a5c'; right='#3a2f26'; front='#54463a'; }
  else if(c.kind==='pillar'){ top='#b3bcc6'; right='#59626d'; front='#7a8490'; }
  else if(c.kind==='barricade'){ top='#7b5a3a'; right='#3a2816'; front='#5a4026'; }
  drawBlock(c, hz, top, right, front);
  const c0=toIso(c.x,c.y), c1=toIso(c.x+c.w,c.y), c2=toIso(c.x+c.w,c.y+c.h), c3=toIso(c.x,c.y+c.h);
  // stone course lines on the front faces
  if(c.kind==='wall' || c.kind==='tower' || c.kind==='pillar'){
    ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=1;
    for(let k=1;k*24<hz;k++){ const yy=k*24;
      ctx.beginPath(); ctx.moveTo(c3.x,c3.y-yy); ctx.lineTo(c2.x,c2.y-yy); ctx.lineTo(c1.x,c1.y-yy); ctx.stroke(); }
  }
  // crenellations on wall/tower tops
  if(c.kind==='wall' || c.kind==='tower'){
    ctx.fillStyle = '#b8c2cd';
    const alongX = c.w>=c.h, n = Math.max(1, Math.round((alongX?c.w:c.h)/40));
    for(let i=0;i<n;i+=2){
      const f0=(i+0.15)/n, f1=(i+0.85)/n;
      const a = alongX ? toIso(c.x+c.w*f0, c.y+c.h) : toIso(c.x+c.w, c.y+c.h*f0);
      const b = alongX ? toIso(c.x+c.w*f1, c.y+c.h) : toIso(c.x+c.w, c.y+c.h*f1);
      ctx.beginPath(); ctx.moveTo(a.x,a.y-hz); ctx.lineTo(b.x,b.y-hz); ctx.lineTo(b.x,b.y-hz-9); ctx.lineTo(a.x,a.y-hz-9); ctx.closePath(); ctx.fill();
    }
  }
  // windows on the front face of towers and the keep
  if(c.kind==='tower' && c.w>=120){
    ctx.fillStyle='#10161d';
    const wa = toIso(c.x+c.w*0.5, c.y+c.h);
    ctx.fillRect(wa.x-3, wa.y-hz*0.6, 6, 16);
  }
  // roofs: tall ice-blue pyramid on towers, low timber-and-snow roof on barracks
  if(c.kind==='tower' || c.kind==='house'){
    const ap = toIso(c.x+c.w/2, c.y+c.h/2), rh = c.kind==='tower' ? 70 : 32;
    const tips = [c0,c1,c2,c3];
    const cols = c.kind==='tower' ? ['#2f5a80','#3f6f98','#5a8fb8','#4a7ea8'] : ['#4a3a2c','#5a4636','#e6eef5','#d0dde8'];
    for(const idx of [0,1,2,3]){
      const a = tips[idx], b = tips[(idx+1)%4];
      ctx.fillStyle = cols[idx];
      ctx.beginPath(); ctx.moveTo(a.x,a.y-hz); ctx.lineTo(b.x,b.y-hz); ctx.lineTo(ap.x,ap.y-hz-rh); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1; ctx.stroke();
    }
  }
  // snow cap on barricades / pillars
  if(c.kind==='barricade' || c.kind==='pillar'){
    ctx.fillStyle='rgba(240,246,250,0.85)';
    const a = toIso(c.x,c.y), b = toIso(c.x+c.w,c.y), d = toIso(c.x+c.w,c.y+c.h), e2 = toIso(c.x,c.y+c.h);
    ctx.beginPath(); ctx.moveTo(a.x,a.y-hz); ctx.lineTo(b.x,b.y-hz); ctx.lineTo(d.x,d.y-hz); ctx.lineTo(e2.x,e2.y-hz); ctx.closePath(); ctx.fill();
  }
}
// Frosthold Dwarf / Brute: steel-and-frost plate, horned helm, white braided beard; dwarf = axe + round shield, brute = warhammer.
function drawFrostholdIso(e){
  const brute = e.type==='fhbrute', cleric = e.type==='fhcleric';
  const iso = toIso(e.x,e.y);
  const face = e.faceSign||1, t = e.animT||0, moving = e.moving, flash = e.hitT>0;
  const s = brute ? e.r/15 : e.r/12.5;
  const swing = e.atkAnimT>0 ? clamp(e.atkAnimT/0.3,0,1) : 0;
  drawShadow(iso.x, iso.y, (brute?20:14)*s, (brute?7.5:5.5)*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  const walk = moving ? Math.sin(t*9) : 0, bob = moving ? Math.abs(Math.sin(t*9))*1.5 : Math.sin(t*2)*0.6;
  const armorA = flash?'#fff':(cleric?'#e4eef6':brute?'#7c8fa3':'#a4bad2'), armorB = flash?'#fff':(cleric?'#7d9ab8':brute?'#3e4d5c':'#4d6784');
  const skin = flash?'#fff':'#d9a98a', beard = flash?'#fff':'#eef2f8';
  const bw = brute ? 13 : 10;
  // legs (the cleric wears a long robe instead)
  if(cleric){
    const rg = ctx.createLinearGradient(0,-14+bob,0,1); rg.addColorStop(0,armorA); rg.addColorStop(1,armorB);
    ctx.fillStyle = rg; ctx.strokeStyle='#1c2430'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(-bw,-14+bob); ctx.lineTo(-bw-2-walk*1.2,1); ctx.lineTo(bw+2-walk*1.2,1); ctx.lineTo(bw,-14+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash?'#fff':'#c8a24a'; ctx.fillRect(-1.5,-12+bob,3,12);
    ctx.fillStyle = flash?'#fff':'#6fb8e8'; ctx.fillRect(-bw-2-walk*1.2,-1,bw*2+4,2);
  } else {
  ctx.fillStyle = flash?'#fff':'#3a3f4a';
  roundRect(-bw*0.55,-9-walk*1.2, 5.5, 9+walk*1.2, 2); ctx.fill();
  roundRect(bw*0.55-5.5,-9+walk*1.2, 5.5, 9-walk*1.2, 2); ctx.fill();
  }
  // torso
  const tg = ctx.createLinearGradient(-bw,-24+bob,bw,-8+bob); tg.addColorStop(0,armorA); tg.addColorStop(1,armorB);
  ctx.fillStyle = tg; ctx.strokeStyle='#1c2430'; ctx.lineWidth=1.2;
  roundRect(-bw,-23+bob, bw*2, 15, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = flash?'#fff':'#c8a24a'; ctx.fillRect(-bw,-11+bob, bw*2, 2.5);
  // fur mantle
  ctx.fillStyle = flash?'#fff':'#e8eef4';
  ctx.beginPath(); ctx.ellipse(0,-23+bob, bw+2, 3.5, 0, 0, 7); ctx.fill();
  // shoulder plates (brute: spiked)
  ctx.fillStyle = armorB;
  for(const sx of (cleric ? [] : [-1,1])){
    ctx.beginPath(); ctx.ellipse(sx*(bw+1),-22+bob, 4.5, 4, 0, 0, 7); ctx.fill(); ctx.stroke();
    if(brute){ ctx.fillStyle = flash?'#fff':'#c9d2dc'; ctx.beginPath(); ctx.moveTo(sx*(bw+1)-2,-25+bob); ctx.lineTo(sx*(bw+1),-32+bob); ctx.lineTo(sx*(bw+1)+2,-25+bob); ctx.closePath(); ctx.fill(); ctx.fillStyle = armorB; }
  }
  // head, beard, helm
  const hy = -29+bob, hr = brute ? 7.5 : 6.5;
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0,hy,hr,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = beard;
  ctx.beginPath(); ctx.moveTo(-hr,hy+1); ctx.quadraticCurveTo(-hr-1,hy+15,0,hy+17); ctx.quadraticCurveTo(hr+1,hy+15,hr,hy+1); ctx.quadraticCurveTo(0,hy+6,-hr,hy+1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='#8fa0b4'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-3,hy+8); ctx.lineTo(-3,hy+15); ctx.moveTo(3,hy+8); ctx.lineTo(3,hy+15); ctx.stroke();
  ctx.strokeStyle='#1c2430'; ctx.lineWidth=1.2;
  if(cleric){   // tall white mitre with gold trim and a blue frost gem
    ctx.fillStyle = flash?'#fff':'#eef4fa';
    ctx.beginPath(); ctx.moveTo(-hr-0.5,hy-1); ctx.lineTo(-hr+1,hy-10); ctx.quadraticCurveTo(0,hy-19,hr-1,hy-10); ctx.lineTo(hr+0.5,hy-1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = flash?'#fff':'#c8a24a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-hr,hy-2); ctx.lineTo(hr,hy-2); ctx.moveTo(0,hy-2); ctx.lineTo(0,hy-14); ctx.stroke();
    ctx.fillStyle = flash?'#fff':'#7fd8ff'; ctx.beginPath(); ctx.arc(0,hy-8,1.8,0,7); ctx.fill();
  } else {
  ctx.fillStyle = flash?'#fff':'#8fa4bb';
  ctx.beginPath(); ctx.arc(0,hy-1,hr+0.8,Math.PI,0); ctx.fill(); ctx.stroke();
  ctx.fillRect(-1,hy-1,2,6);   // nose guard
  // horns
  ctx.strokeStyle = flash?'#fff':'#eee6cc'; ctx.lineWidth = brute?3:2.4; ctx.lineCap='round';
  for(const sx of [-1,1]){ ctx.beginPath(); ctx.moveTo(sx*(hr-0.5),hy-3); ctx.quadraticCurveTo(sx*(hr+6),hy-4,sx*(hr+4),hy-12); ctx.stroke(); }
  }
  ctx.strokeStyle='#1c2430'; ctx.lineWidth=1.2;
  // eyes
  ctx.fillStyle = '#7fe0ff'; ctx.fillRect(1,hy+1,2,1.6); ctx.fillRect(-3,hy+1,2,1.6);
  // off-hand shield (dwarf only)
  if(e.type==='fhaxe'){
    // spare throwing axe in the off hand instead of a shield
    ctx.save(); ctx.translate(-bw-3,-17+bob); ctx.rotate(-0.5+ (e.atkAnimT>0?-0.9:0));
    ctx.strokeStyle = flash?'#fff':'#5a3f24'; ctx.lineWidth=2.2; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(0,5); ctx.lineTo(0,-13); ctx.stroke();
    ctx.fillStyle = flash?'#fff':'#dfe9f3'; ctx.strokeStyle='#1c2430'; ctx.lineWidth=1.1;
    ctx.beginPath(); ctx.moveTo(0,-12); ctx.quadraticCurveTo(-9,-15,-8,-6); ctx.lineTo(0,-8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  } else if(!brute && !cleric){
    ctx.fillStyle = flash?'#fff':'#5a86b0'; ctx.strokeStyle='#1c2430';
    ctx.beginPath(); ctx.ellipse(-bw-3,-15+bob, 5.5, 8, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash?'#fff':'#dfe9f3'; ctx.beginPath(); ctx.arc(-bw-3,-15+bob, 2.2, 0, 7); ctx.fill();
  }
  if(cleric){   // a tall staff crowned with a glowing frost crystal
    const lift = (e.runeCast>0 || e.castAnimT>0) ? -6 : 0;
    ctx.save(); ctx.translate(bw+2,-16+bob+lift);
    ctx.strokeStyle = flash?'#fff':'#5a3f24'; ctx.lineWidth = 2.4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(0,16-lift); ctx.lineTo(0,-24); ctx.stroke();
    ctx.fillStyle = flash?'#fff':'#c8a24a'; ctx.fillRect(-3,-25,6,2);
    const glow = 0.6+0.3*Math.sin((game.clock||0)*4) + (e.runeCast>0 ? 0.4 : 0);
    ctx.save(); ctx.globalCompositeOperation='lighter'; const cg = ctx.createRadialGradient(0,-31,1,0,-31,14); cg.addColorStop(0,'rgba(170,230,255,'+Math.min(1,glow)*0.7+')'); cg.addColorStop(1,'rgba(120,200,255,0)'); ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0,-31,14,0,7); ctx.fill(); ctx.restore();
    ctx.fillStyle = flash?'#fff':'#bfeaff'; ctx.strokeStyle='#2a5a80'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,-38); ctx.lineTo(3.5,-31); ctx.lineTo(0,-25); ctx.lineTo(-3.5,-31); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // free hand raised in blessing while casting
    if(e.runeCast>0 || e.castAnimT>0){ ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(-bw-2,-26+bob,2.4,0,7); ctx.fill(); }
    ctx.restore();
    drawHpBar(iso, 46*s*0.9, e.r*1.1, e.hp, e.maxHp);
    return;
  }
  // weapon arm
  ctx.save(); ctx.translate(bw+1,-20+bob); ctx.rotate(swing>0 ? (1-swing)*2.2-0.8 : -0.25+walk*0.15);
  ctx.strokeStyle = flash?'#fff':'#5a3f24'; ctx.lineWidth = brute?3.2:2.6; ctx.lineCap='round';
  const len = brute ? 22 : 16;
  ctx.beginPath(); ctx.moveTo(0,4); ctx.lineTo(0,-len); ctx.stroke();
  ctx.fillStyle = flash?'#fff':'#c9d4e0'; ctx.strokeStyle='#1c2430'; ctx.lineWidth=1.2;
  if(brute){ ctx.fillRect(-6,-len-6,12,9); ctx.strokeRect(-6,-len-6,12,9); ctx.fillStyle='#8fa4bb'; ctx.fillRect(-7.5,-len-4,3,5); ctx.fillRect(4.5,-len-4,3,5); }
  else { ctx.beginPath(); ctx.moveTo(0,-len+2); ctx.quadraticCurveTo(9,-len-2,7,-len-9); ctx.lineTo(0,-len-4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  ctx.restore();
  drawHpBar(iso, (brute?46:38)*s*0.9, e.r*1.1, e.hp, e.maxHp);
}

// Icy Summit / Mountain Top Shrine / Icy Cellar (v125) -- see makeIcyZone.
function enterIcyZone(kind, from, opts){
  opts = opts || {};
  const g = game;
  g.scene = 'icyzone';
  g.iz = makeIcyZone(kind);
  g.room = g.iz;
  g.depth = g.iz.depth;
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  g.bossKilled = false;
  const iz = g.iz, p = g.player;
  const gate = id => iz.gates.find(gt=>gt.id===id);
  if(opts.atWaypoint && iz.waypoint){ p.x = iz.waypoint.x; p.y = iz.waypoint.y + 45; }
  else if(iz.entranceSpot){ p.x = iz.entranceSpot.x; p.y = iz.entranceSpot.y; iz.entrySpawn = {x:p.x, y:p.y}; }   // v523: the cave cellar
  else {
    const gt = (kind==='summit') ? gate(from==='shrine'?'shrine':from==='cellar'?'cellar':'pass') : iz.gates[0];
    const dx = gt.x < 100 ? 130 : gt.x > iz.w-100 ? -130 : 0;
    const dy = gt.y < 100 ? 130 : gt.y > iz.h-100 ? -130 : 0;
    p.x = gt.x + dx; p.y = gt.y + dy;
  }
  const anchors = shuffle(iz.packAnchors.slice());
  const tpl = ICY_PACKS[kind];
  for(let i=0;i<anchors.length;i++) spawnIcyPack(g, anchors[i], tpl[i%tpl.length]);
  if(kind==='shrine'){
    // (v127) two Protectors guard the altar: a Defender and a Berserker
    const sst = p.shrineStage||0;
    if(sst===1){
      spawnShrineProtectors(g, iz);
      iz.protectorsSpawned = true;
      showMsg('The protectors rise again -- finish the trial.', 2.6);
    } else if(sst===2){ iz.protectorsDown = true; }
  }
  if(kind==='cellar'){
    const boss = spawnEnemy(g, 'bear', {x:iz.bossSpot.x, y:iz.bossSpot.y});
    boss.r = Math.round(boss.r*MASTODON_R_MULT);
    boss.hp = Math.round(boss.hp*MASTODON_HP_MULT); boss.maxHp = boss.hp;
    boss.dmg = boss.dmg*MASTODON_DMG_MULT*0.8;   // v333: -20% across the board
    boss.armor = (boss.armor||0) + 6;
    boss.isLairBoss = true; boss.bossName = 'Woolly Mastodon'; boss.mastodon = true; boss.dmgType = 'normal'; boss.dmgSplit = 'cold'; boss.dmg *= 1.1;   /* v484: half cold, +10% */
    boss.aggroRange = 520; boss.leashRange = (iz.bossHall ? iz.bossHall.rx+200 : 900); boss.wanderRadius = 20;   // v523: it stays in its hall
  }
  if(kind==='summit'){ showMsg('Icy Summit — the freezing wind bites (1 cold/sec)', 2.4); }
  else if(kind==='cellar') showMsg('Icy Cellar — something huge stirs...', 2.2);
  else showMsg('Mountain Top Shrine', 1.6);
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = p.x; f.y = p.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}

// Withered Crossroads (v69) sits off the Dark Forest's new north exit -- an
// open, sparse grassland zone, structurally a sibling of the Forest/
// Mountain Pass (standing population, no genRoom() floors). Its own
// permanent waypoint sits at the crossroad center; the south/west/east
// ends of its crossroad are reserved, currently-inert future zone exits
// (see SUNLIT_*_EXIT_SPOT and README "Version 69").
function enterSunlitPlains(from){
  const g = game;
  g.scene = 'sunlitplains';
  // Waypoint rework: reachedSunlitPlains is no longer set on mere zone
  // entry -- it's now set when the player walks up to this zone's own
  // waypoint marker (see the nearSunWaypoint proximity check in update(),
  // which calls discoverWaypoint).
  g.sun = makeSunlitPlains();
  g.sun.graverobbers = makeGraverobbers(g.sun);
  g.room = g.sun;
  // Fixed area level (static difficulty)
  g.depth = 10;   // v529: Lv 10 (v230: 8)
  // v70: arriving back from Lighthouse Tower (via its floor-1 entrance
  // gate, or the Teleport menu landing here) lands the player just east of
  // the west gate, mirroring how every other zone transition lands you
  // beside the gate you came from -- only this specific origin uses the
  // west gate; every other caller (Forest gate, Town/Mountain-Pass
  // Teleport) keeps the original forestGate spawn unchanged.
  // v71: arriving back from Lakeside Ruins (via its own west entrance
  // gate) lands the player just west of the east gate, same "beside the
  // gate you came from" convention.
  // v72: arriving back from Cursed Cemetery (via its own north entrance
  // gate) lands the player just north of the south gate, same convention.
  if(from==='lighthouse'){
    g.player.x = g.sun.westGate.x + 110; g.player.y = g.sun.westGate.y;
  } else if(from==='lakeside'){
    g.player.x = g.sun.eastGate.x - 110; g.player.y = g.sun.eastGate.y;
  } else if(from==='cemetery'){
    g.player.x = g.sun.southGate.x; g.player.y = g.sun.southGate.y - 110;
  } else if(from==='waypoint'){
    // Waypoint rework: arriving via the Teleport menu lands the player AT
    // this zone's own waypoint marker, not the generic Forest-gate
    // entrance -- see openTeleportMenu's teleportSunlitBtn.
    g.player.x = g.sun.waypoint.x; g.player.y = g.sun.waypoint.y + 40;
  } else {
    g.player.x = g.sun.forestGate.x; g.player.y = g.sun.forestGate.y + 120;
  }
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  showMsg('Withered Crossroads', 1.4);
  // Same pack-anchor/pool-density approach as the Dark Forest's own
  // post-v68 population (see SUNLIT_PACK_ANCHOR_TARGET/SUNLIT_PACK_COUNT).
  const anchors = shuffle(breatheAnchors(g.sun.packAnchors, {gap:400}));
  const count = Math.min(SUNLIT_PACK_COUNT, anchors.length);
  for(let i=0;i<count;i++){
    spawnSunlitPack(g, anchors[i]);
  }
  // v350: hard clearance -- no monster starts within 420 of the entrance gates, the waypoint or where you arrive
  { const keep = [g.sun.forestGate, g.sun.waypoint, g.sun.westGate, g.sun.eastGate, g.sun.southGate, g.player];
    g.enemies = g.enemies.filter(e=>keep.every(k=>dist(e,k) >= 420)); }
  roadEvRoll(g);   // v529: one random road encounter
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}

