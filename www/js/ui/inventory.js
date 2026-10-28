// ---------- Inventory & Skill UI ----------
const bagBtn = document.getElementById('bagBtn');
const bagBadge = document.getElementById('bagBadge');
// (v247) Inventory + Vendor: the body is scaled down (only if needed) so the whole screen fits without scrolling.
const fitOverlays = [];
function setupFit(ovId){
  const ov = document.getElementById(ovId), card = ov && ov.querySelector('.modalCard'), hdr = card && card.querySelector('.invHeader');
  if(!card || !hdr) return;
  const wrap = document.createElement('div'); wrap.className = 'fitWrap';
  const body = document.createElement('div'); body.className = 'fitBody';
  while(hdr.nextSibling) body.appendChild(hdr.nextSibling);
  wrap.appendChild(body); card.appendChild(wrap);
  fitOverlays.push({ov, card, hdr, wrap, body});
}
const FIT_FIXED_W = {shopOverlay:960, stashOverlay:1000};   // v558: the stash also shows your worn gear
function fitScreens(){
  for(const f of fitOverlays){
    if(getComputedStyle(f.ov).display==='none') continue;
    const cs = getComputedStyle(f.card);
    const availW = f.card.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    f.body.style.transform = ''; f.body.style.width = ''; f.wrap.style.height = ''; f.body.style.marginLeft = '';
    // v407: Vendor + Stash in landscape keep a fixed two-column design width and are scaled as a whole (width AND height),
    // centred -- instead of stretching the layout, which squashed/overlapped the grids on narrower screens.
    const fw = FIT_FIXED_W[f.ov.id];
    if(fw && window.matchMedia('(min-aspect-ratio:1/1) and (min-width:640px)').matches){
      f.body.style.width = fw+'px';
      const nH = f.body.offsetHeight, aH = f.card.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - f.hdr.offsetHeight - 4;
      const k = Math.max(0.3, Math.min(1, availW/fw, nH>0 ? aH/nH : 1));
      f.body.style.marginLeft = Math.max(0, (availW - fw*k)/2)+'px';
      if(k < 0.995){ f.body.style.transform = 'scale('+k+')'; f.wrap.style.height = Math.floor(nH*k)+'px'; }
      continue;
    }
    const natH = f.body.offsetHeight, natW = availW;
    const availH = f.card.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - f.hdr.offsetHeight - 4;
    let sc = natH>0 ? Math.min(1, availH/natH) : 1;
    if(sc >= 0.995){ continue; }
    sc = Math.max(0.35, sc);
    f.body.style.width = (natW/sc)+'px';
    f.body.style.transform = 'scale('+sc+')';
    f.wrap.style.height = Math.floor(f.body.offsetHeight*sc)+'px';
  }
}
setupFit('invOverlay'); setupFit('shopOverlay'); setupFit('stashOverlay');
window.addEventListener('resize', ()=>setTimeout(fitScreens,50));
setInterval(fitScreens, 250);
const invOverlay = document.getElementById('invOverlay');
const invClose = document.getElementById('invClose');
const stashOverlay = document.getElementById('stashOverlay');
const teleportOverlay = document.getElementById('teleportOverlay');
const skillsBtn = document.getElementById('skillsBtn');
const skillsBadge = document.getElementById('skillsBadge');
const skillTreeOverlay = document.getElementById('skillTreeOverlay');
const treeClose = document.getElementById('treeClose');
const treeColsEl = document.getElementById('treeCols');
const treeTabsEl = document.getElementById('treeTabs');
const treePointsText = document.getElementById('treePointsText');

// Total resistance to one element in whole percent, capped at MAX_RESIST_PCT.
// v434 Bearer's Curse: each Templar Runestone you carry costs -15% to all resistances (can push a resistance below zero)
const RUNE_IDS = {shield:['templar_runestone','templar_runestone_awake'], sword:['frost_templar_runestone'], cross:['highward_runestone']};
const RUNE_NAMES = {shield:'Defensive Runestone', sword:'Offensive Runestone', cross:'Templar Runestone'};
function runeItemOf(p, rune){ return (p.inventory||[]).find(it=>it && RUNE_IDS[rune].indexOf(it.questId)>=0) || null; }
function isNoStashItem(it){ return isRuneItem(it) || !!(it && (it.questId==='fh_dungeon_key' || it.questId==='silver_locket')); }   // v452
function isRuneItem(it){ return !!(it && it.questId && Object.keys(RUNE_IDS).some(r=>RUNE_IDS[r].indexOf(it.questId)>=0)); }
function runesHeld(p){ let n = 0; for(const r of ['shield','sword','cross']) if(runeItemOf(p, r)) n++; return n; }
function elementResist(p, el){
  return clamp(((p[el+'ResistPct']||0)) + (p.allResistPct||0)*100 - (p.bearerCurse||0)*100, -90, maxResistPct(p));
}
// uncapped total (per-element + All Resistances), shown small under the capped number
function elementResistRaw(p, el){
  const raw = p[el+'ResistRaw']; return (raw!=null ? raw : (p[el+'ResistPct']||0)) + (p.allResistPct||0)*100 - (p.bearerCurse||0)*100;
}
// Stat screen (v180): every cell is tappable -- statInfoHtml() explains where the number comes from.
function statInfoText(key, p){
  const pc = (v)=>Math.round(v*10)/10;
  const res = (el, nm)=>{ const a = Math.round((p.allResistPct||0)*100); return 'Cuts '+nm+' damage taken. '+Math.round(elementResist(p, el))+'% (cap '+maxResistPct(p)+'%, uncapped '+Math.round(elementResistRaw(p,el))+'%)'+(a ? '; includes +'+a+'% All Resistances' : '')+'.'; };
  const typed = (nm, v)=>'+'+pc(v||0)+'% to '+nm+' damage. Adds up with Elemental % for the four elements.';
  const flatEl = ()=>{ const el = [['Fire',p.fireDmg],['Cold',p.coldDmg],['Lightning',p.lightningDmg],['Poison',p.poisonDmg]].filter(x=>(x[1]||0)>0); return el.length ? el.map(x=>'+'+Math.round(x[1])+' '+x[0]).join(', ')+' on basic attacks and weapon skills (swords and bows only, never spells).' : 'None. Swords and bows can roll flat elemental damage; it joins basic attacks and weapon skills, never spells.'; };
  const hitNow = Math.round(playerHitChance(p, (typeof game!=='undefined'&&game)?monsterLevel(game):p.level)*100);
  const T = {
    LVL: 'Level '+(p.level||1)+'. Each level adds life and a skill point.',
    HP: 'Maximum life: '+Math.round(p.maxHp)+'.',
    RES: resourceName(p)+' pool: '+Math.round((p.mpReserved>0 ? p.maxMpFull : p.maxMp)||0)+(p.mpReserved>0 ? ' ('+Math.round(p.mpReserved)+' reserved)' : '')+'. Tap the bar at the top left for how it refills.',
    SPD: 'Movement speed from gear: +'+pc(p.gearSpeedPct||0)+'% (cap +'+MOVE_SPEED_GEAR_CAP_PCT+'%).',
    DMG: 'Your weapon roll: '+Math.round(p.wpnMin||0)+'–'+Math.round(p.wpnMax||0)+(Math.round(p.wpnFlat||0)>0 ? ', +'+Math.round(p.wpnFlat)+' flat Physical on weapon attacks' : '')+'. Every attack and spell scales from it.',
    'ATK SPD': 'Attack speed: '+((p.atkSpeedTotalPct||0)>=0?'+':'')+pc(p.atkSpeedTotalPct||0)+'% (gear +'+pc(p.atkSpeedGearPct||0)+'%, gear cap 40%).',
    CRIT: 'Crit chance: '+pc(p.critChance||0)+'% (cap 75%).',
    'CRIT DMG': 'Crits deal x'+critMultOf(p).toFixed(2)+' damage (gear +'+pc(p.critDmgPct||0)+'%, gear cap 100%).',
    'PHYS %': typed('Physical', p.physDmgPct).replace(' Adds up with Elemental % for the four elements.',''),
    'FIRE %': typed('Fire', p.fireDmgPct), 'COLD %': typed('Cold', p.coldDmgPct), 'LTNG %': typed('Lightning', p.lightningDmgPct), 'PSN %': typed('Poison', p.poisonDmgPct),
    'ELEM %': '+'+pc(p.elemDmgPct||0)+'% to Fire, Cold, Lightning and Poison damage.',
    'FLAT ELEM': flatEl(),
    'ARMOR PEN': 'Ignore '+pc((p.itemArmorPenPct||0)*100)+'% of enemy armor (cap 40%).',
    AREA: '+'+pc(p.aoeRadiusPct||0)+'% area size for area skills (gear cap '+AOE_AFFIX_CAP_PCT+'%).',
    COOLDOWN: pc((p.cdrPct||0)*100)+'% shorter skill cooldowns (cap 30%).',
    'PROJ SPD': 'Projectiles fly '+pc(p.projectileSpeedPct||0)+'% faster.',
    BLEED: pc(p.bleedChancePct||0)+'% chance for each hit to cause Bleed (gear, cap 60%). A Bleed makes the enemy lose '+pc(BLEED_DPS_PCT*partBleedMult()*100)+'% of that hit\u2019s damage every second for '+BLEED_DUR+'s. Bleeds from different sources (this chance, Splinter Shot, Crippling Shot, Reave, wolves) stack, up to '+BLEED_MAX_STACKS+' at once; a new Bleed from the same source refreshes it and keeps the stronger one.',
    'AILMENT DUR': 'Your ailments last '+pc((p.statusDurPct||0)*100)+'% longer (gear cap 75%).',
    'LIGHT RADIUS': 'Your circle of light is '+pc((p.lightRadiusPct||0)*100)+'% wider (gear cap 60%).',
    'SKILL DUR': 'Your skill effects last '+pc((p.skillDurPct||0)*100)+'% longer: ailments, ground effects (Blizzard, Meteor fire, Consecrate, Plague, trap clouds), Hurricane, Tornado, Flame Vortex, banners and the Mirage decoy (gear cap 50%).',
    'VS ELITES': '+'+pc((p.dmgVsElitePct||0)*100)+'% damage to elite monsters (gear cap 5%).',
    MINION: 'Followers and minions deal +'+pc((p.followerDmgPct||0)*100)+'% damage.',
    LEECH: pc(totalLeechPct(p))+'% of damage dealt heals you (cap '+LEECH_TOTAL_CAP+'%). Full on normal monsters, less on magic, elites and bosses.',
    'LIFE/KILL': 'Life gained per kill: '+Math.round((p.lifeOnKill||0)*(1+p.level*0.1))+((p.lifeOnKillPct||0)>0 ? ' + '+pc(p.lifeOnKillPct)+'% of max life' : '')+'.',
    'MANA/KILL': resourceName(p)+' gained per kill: '+Math.round((p.manaOnKill||0)*(1+p.level*0.1))+((p.manaOnKillPct||0)>0 ? ' + '+pc(p.manaOnKillPct)+'% of max' : '')+'.',
    DEF: 'Defense '+Math.round(p.defense||0)+': enemies here land '+hitNow+'% of their swings and arrows. Telegraphed and elemental attacks ignore it.',
    HIT: 'Chance an ordinary enemy attack in this area hits you: '+hitNow+'% (floor 15%). Raise Defense to lower it.',
    BLK: 'Block chance: '+Math.round(blockChance(p)*100)+'% (needs a shield, cap 50%). A block stops the whole hit.',
    PARRY: 'Parry chance: '+Math.round(parryChance(p)*100)+'% (two-hander or dual swords with Weapon Specialization). A parry stops the whole hit.',
    EVA: 'Evasion chance: '+Math.round(evasionChance(p)*100)+'% to avoid a hit completely (cap '+Math.round(EVASION_CAP*100)+'%). It comes from Dexterity and skills like Evasion and Storm Ward. Not the same as the Dodge button, which is the roll you press yourself.',
    STR: 'Strength '+Math.round(p.strength||0)+': +'+LIFE_PER_STR+' life per point and +1% physical damage per '+STR_PER_DMG_PCT+' (now +'+Math.round(((p.strength||0)/STR_PER_DMG_PCT)*10)/10+'%). Plate, swords and shields need it. Grows by '+(CLASS_MAIN_ATTR[p.cls]==='strength'?ATTR_MAIN_PER_LV:ATTR_OTHER_PER_LV)+' a level.',
    DEX: 'Dexterity '+Math.round(p.dexterity||0)+': +'+DEF_PER_DEX+' Defense per point, +1% bow damage per '+DEX_PER_BOW_PCT+', and evasion chance (now '+Math.round((p.dexDodge||0)*10)/10+'%; full up to '+DEX_EVA_SOFT+'%, then it tapers off, max '+DEX_DODGE_CAP+'%)'+(p.cls==='ranger' ? ', and Stamina' : '')+'. Leather and bows need it. Grows by '+(CLASS_MAIN_ATTR[p.cls]==='dexterity'?ATTR_MAIN_PER_LV:ATTR_OTHER_PER_LV)+' a level.',
    INT: 'Intelligence '+Math.round(p.intelligence||0)+': +1% spell damage (fire, cold, lightning, poison) per '+INT_PER_DMG_PCT+' (now +'+Math.round(((p.intelligence||0)/INT_PER_DMG_PCT)*10)/10+'%)'+(p.cls==='mystic' ? ' and '+MANA_PER_INT+' mana per point' : '')+'. Robes and staves need it. Grows by '+(CLASS_MAIN_ATTR[p.cls]==='intelligence'?ATTR_MAIN_PER_LV:ATTR_OTHER_PER_LV)+' a level.',
    'DMG RED': 'Take '+pc((p.itemDmgReductionPct||0)*100)+'% less damage from everything (gear cap 25%).',
    REGEN: 'Regenerate '+pc((p.lifeRegenPct||0)*100)+'% of max life per second'+(p.cls==='warrior' ? ' (Warriors start with '+WARRIOR_BASE_REGEN+'%).' : '.'),
    RESREGEN: p.cls==='mystic' ? 'Mana refills by '+pc(MANA_REGEN_PCT*100)+'% of the bar every second on its own.' : 'Stamina refills by '+pc(STAMINA_REGEN_PCT*100)+'% of the bar every second on its own (more with Predator\'s Instinct).',
    THORNS: 'Monsters that hit you take '+Math.round(p.thornDamage||0)+' damage back'+((p.thornPct||0)>0 ? ', plus '+pc(p.thornPct)+'% of the hit' : '')+'.',
    FIRE: res('fire','Fire'), COLD: res('cold','Cold'), LTNG: res('lightning','Lightning'), PSN: res('poison','Poison'),
    'MAGIC FIND': '+'+pc(p.magicFindPct||0)+'% chance for magic, rare and better drops.',
    'GOLD FIND': '+'+pc(p.goldFindPct||0)+'% gold from drops.',
    'POTION STR': '+'+pc((p.potionStrPct||0)*100)+'% potion strength: health potions heal more (both the instant heal and the heal over time), and beer/coffee last longer (gear cap 75%).',
    BREACH: 'Deepest Breach floor cleared.',
    PLAYTIME: 'Time played on this character: '+fmtPlayTime(p.playTime||0, true)+'.',
    KILLS: 'Enemies this character has slain.'
  };
  if(key && key.indexOf('SLOT_')===0){ const sid = (p.skillSlots||{})[key.slice(5)]; return sid ? 'Damage from the skill on this button, before enemy armor and resistances. Shown as the typical hit or total for the current rank.' : 'Nothing is assigned to this button yet.'; }
  if(key==='MAINSKILL'){ const m = mainSkillInfo(p); return m.id==='strike' ? 'Your Strike button swings your weapon for '+m.val+' damage per hit, before enemy armor and resistances. Assign a skill to it from the skill tree.' : 'Your Strike button casts '+m.name+(m.rank>0 ? ' (rank '+m.rank+')' : '')+': '+m.val+(m.unit ? ' ('+m.unit+')' : '')+', before enemy armor and resistances. Change it from the skill tree with Assign to Button.'; }
  return T[key] || '';
}
function fmtPlayTime(sec, long){ sec = Math.floor(sec||0); const h = Math.floor(sec/3600), m = Math.floor(sec%3600/60); return long ? (h+' hour'+(h===1?'':'s')+' '+m+' minute'+(m===1?'':'s')) : (h+'h '+String(m).padStart(2,'0')+'m'); }
// v470: what the Strike (main) button currently fires, and roughly how hard it hits
function mainSkillInfo(p){ return skillInfoFor(p, (p.skillSlots && p.skillSlots.main) || 'strike'); }
// v492: the same damage line for any button (Strike, or a skill assigned to slot 1-3)
function skillInfoFor(p, id){
  let name = 'Strike', rank = 0;
  if(id!=='strike'){
    name = VIRTUAL_SKILL_NAMES[id] || id;
    try{ const TR = treesForClass(p.cls); for(const k of Object.keys(TR)) for(const n of TR[k].nodes) if(n.id===id) name = n.name; }catch(e){}
    rank = effectiveRank(p, id) || 0;
  }
  let val = '', unit = '';
  if(id==='strike' || !(rank>0)){ val = Math.round(p.wpnMin||0)+'–'+Math.round(p.wpnMax||0); unit = 'weapon damage'; }
  else if(SKILL_WD[id]){ const d = SKILL_WD[id], pc = swdPct(d.r, rank), avg = wpnDmg(p, true)*pc/100; val = '≈'+Math.round(avg); unit = Math.round(pc)+'% weapon damage'+(d.per ? ' '+d.per : ''); }
  else { const ad = skillAvgDamage(id, rank, p); if(ad){ val = '≈'+ad.v; unit = ad.unit; } else { val = '—'; unit = ''; } }
  return {id, name, rank, val, unit};
}
let skillDmgOpen = true;   // v492: the Skill Damages group under Offense (tap its heading to fold it)
function skillDmgRow(p, key, label, id){
  if(!id){ return '<div class="statCell zero sdRow" data-stat="'+key+'"><span class="msLabel">'+label+'</span><span class="msName">empty slot</span></div>'; }
  const m = skillInfoFor(p, id);
  return '<div class="statCell sdRow" data-stat="'+key+'"><span class="msLabel">'+label+'</span><span class="msName">'+m.name+(m.rank>0 ? ' <i>rank '+m.rank+'</i>' : '')+'</span><b>'+m.val+'</b>'+(m.unit ? '<small class="resRaw">'+m.unit+'</small>' : '')+'</div>';
}
function skillDmgGroup(p){
  const sl = p.skillSlots || {};
  return '<div class="sdHead" data-sdtoggle="1">Skill Damages <span class="sdArrow">'+(skillDmgOpen ? '\u25BE' : '\u25B8')+'</span></div>'+
    (skillDmgOpen ? '<div class="sdBody">'+skillDmgRow(p,'MAINSKILL','Strike', sl.main||'strike')+skillDmgRow(p,'SLOT_slot1','Skill 1', sl.slot1)+skillDmgRow(p,'SLOT_slot2','Skill 2', sl.slot2)+skillDmgRow(p,'SLOT_slot3','Skill 3', sl.slot3)+'</div>' : '');
}
function statSummaryHtml(p){
  const cell = (key, label, val, isZero, sub, cls)=>'<div class="statCell'+(isZero?' zero':'')+(cls?' '+cls:'')+'" data-stat="'+key+'">'+label+'<b>'+val+'</b>'+(sub?'<small class="resRaw">'+sub+'</small>':'')+'</div>';
  const head = (t)=>'<div class="statHead">'+t+'</div>';
  const r1 = (v)=>Math.round(v*10)/10;
  const pct = (key, label, v, signed)=>{ const z = !(Math.abs(v||0) >= 0.05); return cell(key, label, (signed && !z && (v||0)>0 ? '+' : '')+(Math.abs(v||0)<10 ? r1(v||0) : Math.round(v||0))+'%', z); };
  const num = (key, label, v)=>cell(key, label, Math.round(v||0), !(Math.round(v||0)>0));
  const blk = Math.round(blockChance(p)*100), par = Math.round(parryChance(p)*100), showParry = !hasShieldEquipped(p) && par>0;
  const hitNow = Math.round(playerHitChance(p, (typeof game!=='undefined'&&game)?monsterLevel(game):p.level)*100);
  const flatSum = (p.fireDmg||0)+(p.coldDmg||0)+(p.lightningDmg||0)+(p.poisonDmg||0);
  const resCells = ['fire','cold','lightning','poison'].map(el=>{ const k = ({fire:'FIRE',cold:'COLD',lightning:'LTNG',poison:'PSN'})[el]; return cell(k, k, Math.round(elementResist(p, el))+'%', false, '('+Math.round(elementResistRaw(p, el))+'%)', 'resCell res-'+el); }).join('');
  const rn = resourceName(p).toUpperCase();
  return (
    head('Character')+
    cell('LVL','LEVEL',(p.level||1))+
    cell('STR','STRENGTH',Math.round(p.strength||0))+
    cell('DEX','DEXTERITY',Math.round(p.dexterity||0))+
    cell('INT','INTELLIGENCE',Math.round(p.intelligence||0))+
    cell('HP','LIFE',Math.round(p.maxHp))+
    cell('RES',rn,Math.round((p.mpReserved>0 ? p.maxMpFull : p.maxMp)||0))+
    pct('SPD','MOVE SPD',p.gearSpeedPct||0,true)+
    cell('PLAYTIME','PLAY TIME',fmtPlayTime(p.playTime||0))+
    cell('KILLS','ENEMIES KILLED',(p.killCount||0).toLocaleString())+
    (p.breachReached ? cell('BREACH','BREACH',(p.breachBest||0)) : '')+
    head('Offense')+
    skillDmgGroup(p)+
    cell('DMG','WEAPON DMG',Math.round(p.wpnMin||0)+'–'+Math.round(p.wpnMax||0), false, Math.round(p.wpnFlat||0)>0 ? '+'+Math.round(p.wpnFlat)+' phys' : '')+
    pct('ATK SPD','ATK SPD',p.atkSpeedTotalPct||0,true)+
    pct('CRIT','CRIT',p.critChance||0)+
    cell('CRIT DMG','CRIT DMG','x'+critMultOf(p).toFixed(2), !((p.critDmgPct||0)>0))+
    pct('PHYS %','PHYS %',p.physDmgPct||0,true)+
    pct('ELEM %','ELEM %',p.elemDmgPct||0,true)+
    pct('FIRE %','FIRE %',p.fireDmgPct||0,true)+
    pct('COLD %','COLD %',p.coldDmgPct||0,true)+
    pct('LTNG %','LTNG %',p.lightningDmgPct||0,true)+
    pct('PSN %','PSN %',p.poisonDmgPct||0,true)+
    cell('FLAT ELEM','FLAT ELEM',flatSum>0 ? '+'+Math.round(flatSum) : '0', !(flatSum>0), flatSum>0 ? [['F',p.fireDmg],['C',p.coldDmg],['L',p.lightningDmg],['P',p.poisonDmg]].filter(x=>(x[1]||0)>0).map(x=>Math.round(x[1])+x[0]).join(' ') : '')+
    pct('ARMOR PEN','ARMOR PEN',(p.itemArmorPenPct||0)*100)+
    pct('AREA','AREA',p.aoeRadiusPct||0,true)+
    pct('COOLDOWN','COOLDOWN',(p.cdrPct||0)*100)+
    pct('PROJ SPD','PROJ SPD',p.projectileSpeedPct||0,true)+
    pct('BLEED','BLEED CHANCE',p.bleedChancePct||0)+
    pct('AILMENT DUR','AILMENT DUR',(p.statusDurPct||0)*100,true)+
    pct('SKILL DUR','SKILL DUR',(p.skillDurPct||0)*100,true)+
    pct('LIGHT RADIUS','LIGHT RADIUS',(p.lightRadiusPct||0)*100,true)+
    pct('VS ELITES','VS ELITES',(p.dmgVsElitePct||0)*100,true)+
    pct('MINION','MINION DMG',(p.followerDmgPct||0)*100,true)+
    pct('LEECH','LEECH',totalLeechPct(p))+
    cell('LIFE/KILL','LIFE/KILL',Math.round((p.lifeOnKill||0)*(1+p.level*0.1)), !((p.lifeOnKill||0)>0 || (p.lifeOnKillPct||0)>0), (p.lifeOnKillPct||0)>0 ? '+'+r1(p.lifeOnKillPct)+'% life' : '')+
    cell('MANA/KILL',rn+'/KILL',Math.round((p.manaOnKill||0)*(1+p.level*0.1)), !((p.manaOnKill||0)>0 || (p.manaOnKillPct||0)>0), (p.manaOnKillPct||0)>0 ? '+'+r1(p.manaOnKillPct)+'%' : '')+
    head('Defense')+
    cell('DEF','DEFENSE',Math.round(p.defense||0))+
    cell('HIT','ENEMY HIT',hitNow+'%')+
    (showParry ? cell('PARRY','PARRY',par+'%') : cell('BLK','BLOCK',blk>0?(blk+'%'):'0%', !(blk>0)))+
    pct('EVA','EVASION',evasionChance(p)*100)+
    pct('DMG RED','DMG RED',(p.itemDmgReductionPct||0)*100)+
    cell('REGEN','LIFE REGEN',r1((p.lifeRegenPct||0)*100)+'%/s', !((p.lifeRegenPct||0)>0))+
    (p.cls==='mystic' ? cell('RESREGEN','MANA REGEN',r1(MANA_REGEN_PCT*100)+'%/s') : p.cls==='ranger' ? cell('RESREGEN','STAMINA REGEN',r1(STAMINA_REGEN_PCT*100*(1+0.03*((p.skills&&effectiveRank(p,'steadyBreathing'))||0)))+'%/s') : '')+
    cell('THORNS','THORNS',Math.round(p.thornDamage||0), !((p.thornDamage||0)>0 || (p.thornPct||0)>0), (p.thornPct||0)>0 ? '+'+r1(p.thornPct)+'% of hit' : '')+
    '<div class="resRow4">'+resCells+'</div>'+
    head('Utility')+
    pct('MAGIC FIND','MAGIC FIND',p.magicFindPct||0,true)+
    pct('GOLD FIND','GOLD FIND',p.goldFindPct||0,true)+
    pct('POTION STR','POTION STR',(p.potionStrPct||0)*100,true)+
    (p.curseHeld>0 ? '<div style="grid-column:1/-1;color:#d0586e;background:#2a1018"><b style="color:#e0707f;display:inline;font-size:11px">Bearer’s Curse</b> −'+Math.round(p.curseHeld*100)+'% resistances in effect</div>' : '')+
    (p.curseHold>0 ? '<div style="grid-column:1/-1;color:#d0586e;background:#2a1018"><b style="color:#e0707f;display:inline;font-size:11px">Demon Hold Curse</b> −'+Math.round(p.curseHold*100)+'% resistances, permanent</div>' : '')
  );
}
// v189: tap the resource bar (top-left) for a plain explanation of Rage / Mana / Stamina
function resourceInfoHtml(p){
  if(false) return '<b>Conviction</b><br>Templars transmute Rage into <b>Conviction</b>: the same bar, burning with holy purpose. It does not refill on its own and fades while you are idle.<br><br><b>Gain Conviction</b> by Smiting (+'+SMITE_CONV+', Wrath +'+WRATH_CONV+'), landing Vengeance (+'+VENG_CONV+' per foe), planting Banners (+'+BANNER_CONV+'), standing in Consecrate, and by fighting as any warrior does.<br><br><b>Spend it</b> on Judgment ('+JUDG_COST+'). Your followers deal most of your damage, so keep them alive: Smite heals them.';
  if(p.cls==='warrior') return '<b>Rage</b><br>'+(isTemplar(p) ? '<i>As a Templar you transmute Rage into <b>Conviction</b>: the same bar, burning with holy purpose, spent on your Templar skills.</i><br><br>' : 'Templars transmute Rage into <b>Conviction</b> for their skills; it is the same bar.<br><br>')+'Rage is the fuel for your skills. It does <b>not</b> refill on its own. It drains as you cast and fades on its own, faster the longer you go without fighting.<br><br><b>Gain Rage</b> by fighting: +'+RAGE_ON_HIT+' each time you land a hit, and up to +'+RAGE_ON_HURT_MAX+' each time you get hit (the bigger the hit, the more). With <b>Riposte</b>, blocking a hit gives '+RIPOSTE_RAGE_BASE+' to '+(RIPOSTE_RAGE_BASE+RIPOSTE_RAGE_MAX_BONUS)+' Rage depending on how hard it was.<br><br>Tip: taking hits and blocking fills the bar fastest, so a Warrior who stays in the fight always has Rage to spend.';
  if(p.cls==='ranger') return '<b>Stamina</b><br>Stamina powers your big shots and traps. Basic shots -- Strike, Rapid Shot, Splinter Shot and Multi Shot volleys -- are free and each one restores '+STAMINA_ON_SHOT+' Stamina. Heavy skills (Crippling, Stun and Explosive Shot, Aimed Shot, Rain of Arrows, traps, Hunter\'s Mark) cost a set amount that rises with their rank, and have cooldowns. Stamina also refills slowly on its own (about '+(STAMINA_REGEN_PCT*100).toFixed(1)+'% per second), and the Survivalist\'s <b>Evasion</b> passive makes every dodge restore Stamina. The pool grows a little every level.';
  return '<b>Mana</b><br>Mana powers your spells. It refills slowly on its own (about '+Math.round(MANA_REGEN_PCT*100)+'% of the bar per second), you get '+Math.round(MANA_ON_KILL_PCT*100)+'% back on each kill, and your basic spells give some back on every hit..';
}
(function(){
  const box = document.createElement('div');
  box.id = 'resInfoBox';
  box.style.cssText = 'display:none;position:fixed;left:50%;top:70px;transform:translateX(-50%);width:min(340px,90vw);z-index:9000;padding:12px 14px;border-radius:10px;background:rgba(22,18,13,.97);border:1px solid #6a5a3a;color:#f0e6d0;font:600 13px/1.5 Alegreya,Georgia,serif;box-shadow:0 6px 24px rgba(0,0,0,.6);';
  document.body.appendChild(box);
  box.addEventListener('click', ()=>{ box.style.display='none'; });
  const row = document.getElementById('resRow');
  if(row){
    row.style.cursor = 'pointer'; row.style.pointerEvents = 'auto';
    row.addEventListener('click', ()=>{
      if(!game || !game.player) return;
      if(box.style.display==='block'){ box.style.display='none'; return; }
      box.innerHTML = resourceInfoHtml(game.player)+'<div style="margin-top:8px;font-size:11px;color:#a89a80">Tap to close</div>';
      box.style.display = 'block';
    });
  }
})();
// v470: stats at zero are hidden until the player taps Show all (remembered between sessions)
function applyStatsShowAll(){
  const box = document.getElementById('invStats'), btn = document.getElementById('statsShowAll'); if(!box) return;
  const all = !!(settings && settings.statsShowAll);
  box.classList.toggle('showAll', all);
  if(btn) btn.textContent = all ? 'Hide empty' : 'Show all';
  let headEl = null, any = false;
  const close = ()=>{ if(headEl) headEl.style.display = (any || all) ? '' : 'none'; };
  for(const el of Array.from(box.children)){
    if(el.classList.contains('statHead')){ close(); headEl = el; any = false; continue; }
    if(!el.classList.contains('statCell') || !el.classList.contains('zero')) any = true;
  }
  close();
}
(function(){
  const btn = document.getElementById('statsShowAll'), box = document.getElementById('invStats');
  if(btn) btn.addEventListener('click', ()=>{ settings.statsShowAll = !settings.statsShowAll; saveSettings(settings); hideStatTip(); applyStatsShowAll(); });
  if(box && window.MutationObserver) new MutationObserver(()=>applyStatsShowAll()).observe(box, {childList:true});
})();
let statTipKey = null;
function hideStatTip(){ statTipKey = null; const t = document.getElementById('statTip'); if(t) t.style.display = 'none'; document.querySelectorAll('#invStats .statCell.sel').forEach(e=>e.classList.remove('sel')); }
function toggleStatTip(cellEl){
  const key = cellEl.dataset.stat, tip = document.getElementById('statTip');
  if(statTipKey===key){ hideStatTip(); return; }
  hideStatTip();
  statTipKey = key; cellEl.classList.add('sel');
  tip.innerHTML = '<b>'+(cellEl.firstChild.textContent||key)+'</b><br>'+statInfoText(key, game.player);
  tip.style.display = 'block';
}
document.getElementById('statTip').addEventListener('click', hideStatTip);
document.getElementById('invStats').addEventListener('click', ev=>{
  if(ev.target.closest && ev.target.closest('[data-sdtoggle]')){ skillDmgOpen = !skillDmgOpen; renderInventory(); return; }   // v492: fold / unfold Skill Damages
  const c = ev.target.closest && ev.target.closest('.statCell'); if(c) toggleStatTip(c);
});

// Hand-drawn line-art icon per item category, shown in its grid cell.
// Emoji glyphs used to fill this role, but several categories (armor and
// shield in particular) rendered as the exact same glyph, and emoji fonts
// vary enough across Android WebViews that some categories were hard to
// tell apart at a glance. Plain inline SVG paths render identically
// everywhere and give every category its own unmistakable silhouette.
const CATEGORY_ICON_PATHS = {
  potion: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/>',
  helm: '<path d="M4 15c0-5 3.5-9 8-9s8 4 8 9v1H4v-1z"/><path d="M2 16h20"/><path d="M9 16v3M15 16v3"/>',
  armor: '<path d="M12 2 7 5v4l-3 2 1 9h14l1-9-3-2V5z"/><path d="M12 6v14"/>',
  amulet: '<path d="M5 3l7 7 7-7"/><circle cx="12" cy="16" r="5.5"/>',
  ring: '<circle cx="12" cy="15" r="6"/><path d="M9 8l3-5 3 5-3 3z"/>',
  boots: '<path d="M8 3h5v9l5 3v4H4v-6c0-3 1-6 4-8z"/>',
  gloves: '<path d="M7 10V6a2 2 0 0 1 4 0v3"/><path d="M11 9V4a2 2 0 0 1 4 0v6"/><path d="M15 8V5a2 2 0 0 1 4 0v9c0 4-3 7-7 7s-7-2-7-6v-4l2-2"/>',
  belt: '<rect x="2" y="10" width="20" height="4" rx="1"/><rect x="9" y="8" width="6" height="8" rx="1"/>',
  weapon1h: '<path d="M12 2v13"/><path d="M7 8h10"/><path d="M10 15h4v3h-4z"/><path d="M12 18v3"/>',
  weapon2h: '<path d="M12 1v14"/><path d="M5 7h14"/><path d="M9 15h6v4H9z"/><path d="M12 19v3"/>',
  shield: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/>',
  bow: '<path d="M6 3c6 3 6 15 0 18"/><path d="M6 3v18"/><path d="M2 12h14"/><path d="M13 9l3 3-3 3"/>',
  staff: '<path d="M12 1v20"/><circle cx="12" cy="4" r="2.5"/><path d="M8 18l4 3 4-3"/>',
};
// Runestones: a carved stone with a symbol -- shield = Defensive, cross = Templar, sword = Offensive (not yet in the game).
const RUNE_STONE = '<path d="M8 3h8l5 5v8l-5 5H8l-5-5V8z"/>';
const RUNESTONE_ICONS = {
  templar_runestone: RUNE_STONE+'<path d="M12 7l3.6 1.4v3c0 2.4-1.5 4.2-3.6 5.1-2.1-.9-3.6-2.7-3.6-5.1v-3z"/>',
  frost_templar_runestone: RUNE_STONE+'<path d="M12 5.5v9M9.5 14.5h5M12 14.5v3.5"/>',
  offensive_runestone: RUNE_STONE+'<path d="M12 5.5v9M9.5 14.5h5M12 14.5v3.5"/>',
  dragon_bolt: '<path d="M12 1.5v21"/><path d="M8.5 5L12 1.5 15.5 5"/><path d="M8 21l4-5 4 5"/><path d="M9 9.5h6M9.5 12.5h5"/>',
  highward_runestone: RUNE_STONE+'<path d="M7.5 15.5l1-6 3.5 3 3.500-3 1 6z"/>',
  obsidian_runestone: RUNE_STONE+'<path d="M9.5 8.5l5 7M14.5 8.5l-5 7M12 6.5v11"/>',
};
// (v349) Big per-type item art that fills the item's whole grid footprint (1 cell = 20 units wide/tall).
const ART_MAT = {plate:'#aab4c0', leather:'#8a5a34', robe:'#6a4a8a'};
const ART_GEM = {'Ruby Ring':'#e04a4a','Sapphire Ring':'#4a8ae0','Topaz Ring':'#e8d84a','Emerald Ring':'#4ac26a','Iron Ring':null,'Gold Amulet':'#e8c44a','Jade Amulet':'#4ac28a','Bone Amulet':'#e8e2d0','Sun Amulet':'#ff9a3a'};

// v355: hand-drawn art for every quest item (fills the item's grid footprint like the gear art does)
function questArtSvg(it){
  const q = it.questId; if(!q) return null;
  const [w,h] = itemShape(it), W = w*20, H = h*20, acc = it.color || '#ffd27a';
  const D = (id,a,b)=>'<linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+a+'"/><stop offset="1" stop-color="'+b+'"/></linearGradient>';
  const stone = (rune, glow)=>'<defs>'+D('qs','#8b8f9c','#3e424e')+'</defs>'+
    '<path d="M-13 -9 L-8 -16 L8 -17 L15 -8 L16 8 L9 16 L-8 15 L-16 6Z" fill="url(#qs)" stroke="#16181f" stroke-width="1.4" stroke-linejoin="round"/>'+
    '<path d="M-8 -16 L-3 -9 L9 -10 L8 -17M-16 6 L-7 5 L-8 15M9 16 L6 6 L16 8" fill="none" stroke="#16181f" stroke-opacity=".45" stroke-width="1"/>'+
    '<path d="M-12 -8 L-7 -14 L2 -15" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.4" stroke-linecap="round"/>'+
    '<g fill="none" stroke="'+glow+'" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" filter="url(#qg)">'+rune+'</g>';
  const glowF = '<filter id="qg" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  let g = null, tall = false;
  if(q==='minotaur_heartstone'){
    g = '<defs>'+D('qh','#ff7a6a','#7a1418')+glowF+'</defs><path d="M0 15 C-17 4 -17 -10 -8 -13 C-4 -14 0 -9 0 -9 C0 -9 4 -14 8 -13 C17 -10 17 4 0 15Z" fill="url(#qh)" stroke="#2a0608" stroke-width="1.5" filter="url(#qg)"/>'+
      '<path d="M-9 -9 L-3 -2 L-8 4M9 -9 L3 -2 L8 4M0 -9 L-3 -2 L0 6 L3 -2Z" fill="none" stroke="#2a0608" stroke-opacity=".5" stroke-width="1"/>'+
      '<path d="M-11 -8 C-9 -11 -6 -11 -5 -10" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.8" stroke-linecap="round"/>'+
      '<path d="M-14 -12 C-18 -17 -16 -20 -12 -19M14 -12 C18 -17 16 -20 12 -19" fill="none" stroke="#eadbb8" stroke-width="2" stroke-linecap="round"/>';
  } else if(q==='templar_runestone' || q==='templar_runestone_awake'){
    g = glowF+stone('<path d="M0 -10 L8 -7 V0 C8 6 4 9 0 11 C-4 9 -8 6 -8 0 V-7Z"/><path d="M0 -6 V8M-4 -1 H4" stroke-width="1.6"/>','#5fd0ff');
  } else if(q==='frost_templar_runestone'){
    g = glowF+stone('<path d="M0 -12 V6M-6 4 H6M0 6 V12"/><path d="M-2 -9 L0 -13 L2 -9" stroke-width="1.6"/>','#ff9a6a');
  } else if(q==='highward_runestone'){
    g = glowF+stone('<path d="M-8 8 L-6 -7 L0 0 L6 -7 L8 8Z"/><circle cx="0" cy="-9" r="1.6" fill="#ffe08a"/>','#ffe08a');
  } else if(q==='skill_tome'){
    g = glowF+'<defs>'+D('qt','#3a2a6a','#140a2a')+'</defs><path d="M-14 -13 H12 Q15 -13 15 -10 V13 H-11 Q-14 13 -14 10Z" fill="url(#qt)" stroke="#0c0604" stroke-width="1.4" stroke-linejoin="round"/>'+
      '<path d="M-14 10 Q-14 13 -11 13 H15" fill="none" stroke="#b48cff" stroke-width="1.2"/><path d="M0 -9 L2.5 -2 L9 -2 L4 2 L6 9 L0 5 L-6 9 L-4 2 L-9 -2 L-2.5 -2Z" fill="#b48cff" filter="url(#qg)"/>';
  } else if(q==='recipe_book'){
    g = glowF+'<defs>'+D('qb','#6a3a1a','#2a1408')+'</defs><path d="M-14 -13 H12 Q15 -13 15 -10 V13 H-11 Q-14 13 -14 10Z" fill="url(#qb)" stroke="#0c0604" stroke-width="1.4" stroke-linejoin="round"/>'+
      '<path d="M-14 10 Q-14 13 -11 13 H15" fill="none" stroke="#f2a31b" stroke-width="1.2"/><rect x="-8" y="-8" width="17" height="11" rx="1.5" fill="none" stroke="#f2a31b" stroke-width="1.2"/>'+
      '<path d="M0 -6 V1M-3.5 -2.5 H3.5" stroke="#f2a31b" stroke-width="1.5" stroke-linecap="round" filter="url(#qg)"/><path d="M-13 -4 H-11M-13 4 H-11" stroke="#f2a31b" stroke-width="1.6"/>';
  } else if(q==='ruins_map'){
    g = '<defs>'+D('qp','#f2dfa6','#c9a55a')+'</defs><path d="M-15 -11 L-10 -14 L15 -12 L16 12 L-9 14 L-16 11Z" fill="url(#qp)" stroke="#6a4a1a" stroke-width="1.3" stroke-linejoin="round"/>'+
      '<path d="M-15 -11 C-19 -9 -19 -3 -15 -1 L-16 11 C-20 9 -20 3 -16 1Z" fill="#b88a3a" stroke="#6a4a1a" stroke-width="1.1"/>'+
      '<path d="M-6 -6 C-2 -9 2 -4 6 -8 M-7 0 C-2 3 3 -2 9 2 M-5 7 H5" fill="none" stroke="#7a5a2a" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="2 2"/>'+
      '<path d="M5 -3 L11 5 M11 -3 L5 5" stroke="#b02a2a" stroke-width="2.4" stroke-linecap="round"/>';
  } else if(q==='templar_inscription'){
    g = glowF+'<defs>'+D('qt','#b9b2c8','#5a5470')+'</defs><path d="M-12 -16 H12 L14 -12 V14 L10 17 H-10 L-14 14 V-12Z" fill="url(#qt)" stroke="#1c1830" stroke-width="1.4" stroke-linejoin="round"/>'+
      '<g stroke="#2a2442" stroke-width="1.4" stroke-linecap="round" stroke-opacity=".8"><path d="M-8 -9 H8M-8 -4 H4M-8 1 H8M-8 6 H2M-8 11 H6"/></g>'+
      '<g stroke="#c8b0ff" stroke-width="1.6" stroke-linecap="round" filter="url(#qg)"><path d="M-5 -9 L-2 -9M2 -4 L5 -4M-3 1 L0 1M3 6 L6 6"/></g>';
  } else if(q==='mastodon_hoof'){
    g = '<defs>'+D('qm','#6a5a4e','#2a211c')+'</defs><path d="M-11 -2 C-13 8 -12 14 -8 15 H10 C14 15 14 9 12 3 C11 -3 8 -8 2 -8 C-5 -8 -10 -6 -11 -2Z" fill="url(#qm)" stroke="#15100c" stroke-width="1.5" stroke-linejoin="round"/>'+
      '<path d="M-6 6 C-6 10 -5 13 -4 14M0 5 V14M6 6 C6 10 6 12 7 14" stroke="#15100c" stroke-opacity=".6" stroke-width="1" fill="none"/>'+
      '<path d="M-13 -4 C-14 -9 -10 -12 -7 -13 C-5 -16 -1 -17 1 -14 C4 -17 8 -15 8 -11 C12 -10 13 -6 10 -3 C6 -5 -4 -4 -13 -4Z" fill="#f4f7fb" stroke="#8aa0b8" stroke-width="1.2"/>'+
      '<path d="M-8 -9 L-6 -5M-2 -11 L-1 -5M4 -10 L4 -5" stroke="#b8c8dc" stroke-width="1" stroke-linecap="round"/>';
  } else if(q==='electric_tentacle'){
    g = glowF+'<path d="M-12 16 C-16 6 -4 6 -6 -2 C-8 -10 4 -8 2 -14 C1 -17 5 -19 8 -16" fill="none" stroke="#1d3f8a" stroke-width="7.4" stroke-linecap="round"/>'+
      '<path d="M-12 16 C-16 6 -4 6 -6 -2 C-8 -10 4 -8 2 -14 C1 -17 5 -19 8 -16" fill="none" stroke="#4f86d8" stroke-width="5" stroke-linecap="round"/>'+
      '<g fill="#bcd8ff">'+[[-13,10],[-8,4],[-6,-3],[-2,-8],[2,-12]].map(p=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="1.5"/>').join('')+'</g>'+
      '<path d="M9 -2 L5 4 L9 4 L5 11" fill="none" stroke="#fff27a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#qg)"/><path d="M12 8 L10 11 L12 11 L10 14" fill="none" stroke="#fff27a" stroke-width="1.4" stroke-linecap="round"/>';
  } else if(q==='leviathan_scale'){
    g = glowF+'<defs>'+D('ql','#7af0cc','#0f6a62')+'</defs><path d="M0 -17 C10 -14 17 -6 15 4 C13 12 6 17 0 18 C-6 17 -13 12 -15 4 C-17 -6 -10 -14 0 -17Z" fill="url(#ql)" stroke="#06312e" stroke-width="1.5"/>'+
      '<path d="M0 -14 V14M-7 -10 C-9 0 -7 8 -4 12M7 -10 C9 0 7 8 4 12M-12 -2 H12" fill="none" stroke="#06312e" stroke-opacity=".5" stroke-width="1.1"/>'+
      '<path d="M-9 -9 C-6 -13 -2 -14 1 -13" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.8" stroke-linecap="round"/>';
  } else if(q==='fh_dungeon_key'){
    g = glowF+'<g transform="rotate(-45)"><circle cx="0" cy="-12" r="7" fill="none" stroke="#7a5a1a" stroke-width="5"/><circle cx="0" cy="-12" r="7" fill="none" stroke="#ffd27a" stroke-width="3"/>'+
      '<rect x="-2.4" y="-5" width="4.8" height="25" rx="1.4" fill="#ffd27a" stroke="#7a5a1a" stroke-width="1.2"/><path d="M2.4 9 H8 V12 H2.4M2.4 14 H6.5 V17 H2.4" fill="#ffd27a" stroke="#7a5a1a" stroke-width="1.2" stroke-linejoin="round"/>'+
      '<path d="M-4 -12 L0 -16 L4 -12 L0 -8Z" fill="#8fdcff" stroke="#1a3a5a" stroke-width=".8" filter="url(#qg)"/></g>';
  } else if(q==='molten_shell'){
    g = glowF+'<defs>'+D('qk','#5a3a30','#1a0e0c')+'</defs><path d="M-14 4 L-9 -10 L2 -17 L13 -9 L15 5 L5 16 L-8 14Z" fill="url(#qk)" stroke="#0c0605" stroke-width="1.5" stroke-linejoin="round"/>'+
      '<path d="M-9 -10 L-2 -2 L-8 14M2 -17 L-2 -2 L5 16M13 -9 L-2 -2 L-14 4" fill="none" stroke="#ff7a2a" stroke-width="2" stroke-linejoin="round" filter="url(#qg)"/>'+
      '<path d="M-6 -12 L0 -15" stroke="#fff" stroke-opacity=".35" stroke-width="1.5" stroke-linecap="round"/>';
  } else if(q==='fire_claw' || q==='thunder_claw'){
    g = glowF+'<path d="M-10 -16 C8 -16 16 -4 12 8 C10 13 5 17 -2 18 C6 12 8 4 4 -4 C0 -10 -6 -12 -10 -16Z" fill="#241816" stroke="#0a0504" stroke-width="1.5" stroke-linejoin="round"/>'+
      '<path d="M-6 -14 C6 -13 12 -4 9 6" fill="none" stroke="#ff8a3a" stroke-width="1.6" stroke-linecap="round" filter="url(#qg)"/><path d="M-12 -17 C-14 -12 -10 -9 -6 -11Z" fill="#7a4a30" stroke="#0a0504" stroke-width="1"/>';
  } else if(q==='ancient_hammer'){
    tall = true;   // 20 x 60
    g = glowF+'<defs>'+D('qa','#dfe6ee','#7e8a9a')+'</defs><rect x="8.4" y="14" width="3.4" height="42" rx="1.4" fill="#7a5230" stroke="#2a1608" stroke-width="1"/>'+
      '<path d="M8.4 22H11.8M8.4 30H11.8M8.4 38H11.8M8.4 46H11.8" stroke="#2a1608" stroke-width=".9"/>'+
      '<rect x="1.5" y="3" width="17" height="14" rx="2.4" fill="url(#qa)" stroke="#2a3340" stroke-width="1.3"/><rect x="1.5" y="9" width="17" height="2.4" fill="#d8a83a" stroke="#6a4a0a" stroke-width=".7"/>'+
      '<path d="M5 5.5l2 2-2 2M15 5.5l-2 2 2 2" fill="none" stroke="#ffb060" stroke-width="1.2" stroke-linecap="round" filter="url(#qg)"/><circle cx="10" cy="57" r="2.2" fill="#d8a83a" stroke="#6a4a0a" stroke-width=".7"/>';
  } else if(q==='dragon_bolt'){
    tall = true;   // 40 x 80
    g = glowF+'<defs><linearGradient id="qb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8d2a0"/><stop offset="1" stop-color="#8a6a3a"/></linearGradient><radialGradient id="qf" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2b0"/><stop offset="1" stop-color="#ff7a20" stop-opacity="0"/></radialGradient></defs>'+
      '<circle cx="20" cy="12" r="15" fill="url(#qf)"/>'+
      '<rect x="17.8" y="22" width="4.4" height="46" rx="1.6" fill="url(#qb)" stroke="#3a2812" stroke-width="1.1"/>'+
      '<path d="M20 2 L27 17 L22 15.5 L22 24 L18 24 L18 15.5 L13 17Z" fill="#f1e2bc" stroke="#3a2812" stroke-width="1.3" stroke-linejoin="round"/><path d="M20 5 V22" stroke="#ff9a3a" stroke-width="1.6" stroke-linecap="round" filter="url(#qg)"/>'+
      '<path d="M13 17 L8 24 L15.5 21.5M27 17 L32 24 L24.5 21.5" fill="#d8c49a" stroke="#3a2812" stroke-width="1.1" stroke-linejoin="round"/>'+
      '<rect x="16.6" y="30" width="6.8" height="3.2" rx="1" fill="#d8a83a" stroke="#6a4a0a" stroke-width=".8"/><rect x="16.6" y="36" width="6.8" height="2.4" rx="1" fill="#d8a83a" stroke="#6a4a0a" stroke-width=".8"/>'+
      '<path d="M20 58 C12 60 8 68 6 77 C12 72 17 72 20 74 C23 72 28 72 34 77 C32 68 28 60 20 58Z" fill="#d8402a" stroke="#4a1208" stroke-width="1.2" stroke-linejoin="round"/><path d="M20 62 V74M14 66 L16 73M26 66 L24 73" stroke="#ffb060" stroke-width="1" stroke-linecap="round"/>';
  } else if(q==='obsidian_runestone'){
    tall = true;   // 40 x 80
    g = glowF+'<defs><linearGradient id="qo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a3350"/><stop offset=".5" stop-color="#14111f"/><stop offset="1" stop-color="#2a2340"/></linearGradient></defs>'+
      '<path d="M6 76 L10 70 H30 L34 76Z" fill="#2a2630" stroke="#0a0810" stroke-width="1.3"/>'+
      '<path d="M20 2 L28 14 L31 70 H9 L12 14Z" fill="url(#qo)" stroke="#0a0810" stroke-width="1.5" stroke-linejoin="round"/>'+
      '<path d="M20 2 L28 14 L20 16 L12 14Z" fill="#5a4f80" fill-opacity=".7"/><path d="M14 20 L13 66" stroke="#fff" stroke-opacity=".25" stroke-width="1.6" stroke-linecap="round"/>'+
      '<g fill="none" stroke="#b48cff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#qg)"><path d="M14 28 L26 44M26 28 L14 44M20 24 V50"/><path d="M15 57 H25M17 62 H23"/></g>';
  }
  if(!g) return null;
  const body = tall ? g : '<g transform="translate('+(W/2)+' '+(H/2)+') scale('+(Math.min(W,H)/40)+')">'+g+'</g>';
  return uniqSvgIds('<svg class="bagArt" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">'+body+'</svg>');
}
// v452: every rendered copy of an item's art gets its own gradient/filter ids. With shared ids, a copy shown in the vendor or
// stash pointed at the defs of a hidden copy (the bag) and painted black.
let SVG_UID = 0;
function uniqSvgIds(str){
  if(str.indexOf('id="')<0) return str;
  const u = '_'+(++SVG_UID);
  return str.replace(/id="([A-Za-z][\w-]*)"/g, 'id="$1'+u+'"').replace(/url\(#([A-Za-z][\w-]*)\)/g, 'url(#$1'+u+')');
}
function bagArtSvg(it){
  if(it && it.questId){ const qa = questArtSvg(it); if(qa) return qa; }
  if(it && !it.questId && typeof tierArtSvg==='function'){ const ta = tierArtSvg(it); if(ta) return ta; }   // v557: tiered gear art (ui/item-art.js)
  const [w,h] = itemShape(it), W = w*20, H = h*20, acc = it.color || '#c9b6ff', st = it.slotType, bi = baseBracketIdx(it.ilvl||1);
  const steel='#cfd8e2', steelD='#6f7b8a', gold='#d8b04a', wood='#7a5230', dark='#1a1620';
  const mat = ART_MAT[it.material] || '#aab4c0';
  let g = '';
  const bn = it.baseName || '';
  if(st==='weapon2h'){
    // greatsword: broad fullered blade, winged crossguard, wrapped long grip, jewelled round pommel (clearly unlike the slim 1H sword)
    const bw = 5.5+bi*0.5;
    g = '<polygon points="20,0 '+(20+bw+1.5)+',9 '+(20+bw)+',50 '+(20-bw)+',50 '+(20-bw-1.5)+',9" fill="'+steel+'" stroke="'+steelD+'" stroke-width="1.1"/>'+
        '<polygon points="20,4 '+(20+bw*0.38)+',10 '+(20+bw*0.38)+',48 '+(20-bw*0.38)+',48 '+(20-bw*0.38)+',10" fill="'+steelD+'" fill-opacity=".55"/>'+
        '<line x1="'+(20-bw+1.6)+'" y1="12" x2="'+(20-bw+1.6)+'" y2="48" stroke="#fff" stroke-opacity=".6" stroke-width="1"/>'+
        '<path d="M3 56 Q6 49 14 50 H26 Q34 49 37 56 Q31 55 26 55 H14 Q9 55 3 56Z" fill="'+gold+'" stroke="#8a6a1a" stroke-width=".9"/>'+
        '<rect x="16.5" y="55" width="7" height="3" fill="'+gold+'" stroke="#8a6a1a" stroke-width=".7"/>'+
        '<rect x="17.6" y="58" width="4.8" height="14" rx="1.4" fill="#4a3220"/><path d="M17.6 60l4.8 2.4M17.6 64l4.8 2.4M17.6 68l4.8 2.4" stroke="#8a6a44" stroke-width=".9"/>'+
        '<circle cx="20" cy="75" r="4.4" fill="'+gold+'" stroke="#8a6a1a" stroke-width="1"/><circle cx="20" cy="75" r="1.9" fill="'+acc+'"/>'+
        '<circle cx="20" cy="52.8" r="1.6" fill="'+acc+'"/>';
  } else if(st==='weapon1h'){
    const bw = 2.5+bi*0.35;
    g = '<polygon points="10,2 '+(10+bw+0.6)+',8 '+(10+bw)+',38 '+(10-bw)+',38 '+(10-bw-0.6)+',8" fill="'+steel+'" stroke="'+steelD+'" stroke-width=".8"/>'+
        '<line x1="10" y1="7" x2="10" y2="37" stroke="'+steelD+'" stroke-width=".8"/>'+
        '<rect x="3" y="38" width="14" height="3.6" rx="1.6" fill="'+gold+'" stroke="#8a6a1a" stroke-width=".7"/>'+
        '<rect x="8.4" y="41.6" width="3.2" height="11" rx="1" fill="'+wood+'"/>'+
        '<circle cx="10" cy="55" r="2.8" fill="'+gold+'" stroke="#8a6a1a" stroke-width=".7"/>'+
        (bi>=2 ? '<circle cx="10" cy="39.8" r="1.2" fill="'+acc+'"/>' : '');
  } else if(st==='bow'){
    g = '<path d="M30 4 C6 16 6 44 30 56" fill="none" stroke="'+wood+'" stroke-width="3.2" stroke-linecap="round"/>'+
        '<path d="M30 4 C6 16 6 44 30 56" fill="none" stroke="#b07a48" stroke-width="1" stroke-linecap="round"/>'+
        '<line x1="30" y1="4" x2="30" y2="56" stroke="#e8e2d0" stroke-width=".8"/>'+
        '<rect x="8.4" y="25" width="3.4" height="10" rx="1" fill="'+acc+'" transform="rotate(-8 10 30)"/>'+
        '<line x1="12" y1="30" x2="36" y2="30" stroke="#d9cfae" stroke-width="1.2"/><polygon points="36,30 31,27.5 31,32.5" fill="'+steel+'"/><path d="M14 30l-3-3M14 30l-3 3" stroke="'+acc+'" stroke-width="1"/>';
  } else if(st==='staff'){
    const sc = ({fire:'#ff7a3d', ice:'#7ad0ff', lightning:'#e6e35a', soul:'#a06ad0'})[it.spell] || acc;
    g = '<line x1="12" y1="76" x2="27" y2="16" stroke="'+wood+'" stroke-width="3.4" stroke-linecap="round"/>'+
        '<line x1="12" y1="76" x2="27" y2="16" stroke="#a87444" stroke-width="1" stroke-linecap="round"/>'+
        '<path d="M19 17 C17 6 24 2 30 5 M34 20 C38 10 33 4 29 5" fill="none" stroke="'+gold+'" stroke-width="2" stroke-linecap="round"/>'+
        '<circle cx="28" cy="13" r="6" fill="'+sc+'" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/><circle cx="26" cy="11" r="1.8" fill="#fff" fill-opacity=".7"/>'+
        '<rect x="15" y="52" width="6" height="3" rx="1" fill="'+acc+'" transform="rotate(14 18 53)"/>';
  } else if(st==='shield'){
    g = '<path d="M20 3 L36 9 V30 C36 44 28 54 20 57 C12 54 4 44 4 30 V9 Z" fill="'+steel+'" stroke="'+steelD+'" stroke-width="1.2"/>'+
        '<path d="M20 7 L32 11.5 V30 C32 41 26 49 20 52 C14 49 8 41 8 30 V11.5 Z" fill="none" stroke="'+acc+'" stroke-width="1.6"/>'+
        '<path d="M20 12v34M10 24h20" stroke="'+steelD+'" stroke-width="1.2"/><circle cx="20" cy="24" r="4.6" fill="'+gold+'" stroke="#8a6a1a" stroke-width=".8"/>'+(bi>=3?'<circle cx="20" cy="24" r="1.8" fill="'+acc+'"/>':'');
  } else if(st==='helm'){
    const mid = it.material==='robe' ? '<path d="M8 32 C8 14 14 6 22 2 C20 12 32 14 32 32Z" fill="'+mat+'" stroke="#2a1a40" stroke-width="1"/><path d="M12 32v-8h16v8" fill="#14101a" opacity=".8"/>' :
      it.material==='leather' ? '<path d="M6 30 C6 12 13 6 20 6 C27 6 34 12 34 30Z" fill="'+mat+'" stroke="#4a2a14" stroke-width="1"/><path d="M6 24h28" stroke="#4a2a14" stroke-width="1"/><circle cx="12" cy="24" r="1" fill="'+gold+'"/><circle cx="28" cy="24" r="1" fill="'+gold+'"/>' :
      '<path d="M5 31 C5 12 12 5 20 5 C28 5 35 12 35 31 V34 H5Z" fill="'+mat+'" stroke="'+steelD+'" stroke-width="1.2"/><rect x="9" y="19" width="22" height="4" rx="1.5" fill="'+dark+'"/><path d="M20 5v14" stroke="'+steelD+'" stroke-width="1"/><path d="M20 5 C14 1 12 -1 16 0" fill="none"/><path d="M19 5 C12 -2 24 -3 21 5" fill="'+acc+'"/>';
    g = mid;
  } else if(st==='armor'){
    const dk = it.material==='plate' ? steelD : it.material==='leather' ? '#4a2a14' : '#2a1a40';
    g = '<path d="M13 5 L20 8 L27 5 L37 12 L34 25 L30 22 V55 H10 V22 L6 25 L3 12 Z" fill="'+mat+'" stroke="'+dk+'" stroke-width="1.2"/>'+
        '<path d="M20 8 V55" stroke="'+dk+'" stroke-width="1"/><path d="M10 38 H30" stroke="'+acc+'" stroke-width="2"/>'+
        (it.material==='plate' ? '<path d="M12 18 Q20 24 28 18" fill="none" stroke="'+dk+'" stroke-width="1"/><path d="M11 46h18" stroke="'+dk+'" stroke-width="1"/>' : it.material==='leather' ? '<path d="M14 14l12 0M14 30l12 0" stroke="'+dk+'" stroke-width="1" stroke-dasharray="2 2"/>' : '<path d="M14 12q6 6 12 0" fill="none" stroke="'+gold+'" stroke-width="1.2"/>')+
        '<circle cx="20" cy="38" r="2.2" fill="'+gold+'"/>';
  } else if(st==='gloves'){
    g = '<rect x="9" y="16" width="22" height="16" rx="4" fill="'+mat+'" stroke="#2a2030" stroke-width="1"/>'+
        [0,1,2,3].map(i=>'<rect x="'+(9+i*5.6)+'" y="'+(5+(i===1||i===2?-1:1))+'" width="4.6" height="'+(13+(i===1||i===2?1:0))+'" rx="2.2" fill="'+mat+'" stroke="#2a2030" stroke-width=".9"/>').join('')+
        '<path d="M9 22 Q3 20 4 14 Q6 12 9 17" fill="'+mat+'" stroke="#2a2030" stroke-width=".9"/>'+
        '<rect x="8" y="32" width="24" height="6" rx="2" fill="'+acc+'" stroke="#2a2030" stroke-width=".9"/>';
  } else if(st==='boots'){
    g = '<path d="M12 4 H25 V22 L35 27 Q37 29 37 33 V36 H6 V22 Z" fill="'+mat+'" stroke="#2a2030" stroke-width="1.2"/>'+
        '<rect x="6" y="33" width="31" height="3.4" fill="#2a2030"/><rect x="11" y="4" width="15" height="5" fill="'+acc+'" stroke="#2a2030" stroke-width=".9"/><path d="M14 14h9M14 19h9" stroke="#2a2030" stroke-width=".9"/>';
  } else if(st==='belt'){
    if(bn==='Plated Belt') g = '<rect x="1" y="5" width="38" height="10" rx="2" fill="'+steelD+'"/>'+[0,1,2,3,4].map(i=>'<rect x="'+(2+i*7.5)+'" y="6" width="6.5" height="8" rx="1.2" fill="'+steel+'" stroke="#44505e" stroke-width=".6"/>').join('')+'<rect x="15" y="3" width="10" height="14" rx="2" fill="'+gold+'" stroke="#8a6a1a" stroke-width=".8"/><rect x="18" y="7" width="4" height="6" fill="'+dark+'"/>';
    else if(bn==='Heavy Sash') g = '<path d="M1 6 H39 V14 H1Z" fill="#a33a3a" stroke="#4a1414" stroke-width="1"/><path d="M1 10 H39" stroke="#7a2020" stroke-width="1"/><path d="M17 8 L24 3 L24 17 L17 12Z M23 8 L31 4 L30 16 L23 12Z" fill="#c24a4a" stroke="#4a1414" stroke-width=".8"/><circle cx="21" cy="10" r="2.6" fill="'+gold+'"/>';
    else g = '<rect x="1" y="6" width="38" height="8" rx="1.5" fill="'+ART_MAT.leather+'" stroke="#4a2a14" stroke-width="1"/><path d="M1 8.2h38M1 11.8h38" stroke="#5a3a1e" stroke-width=".6"/>'+[0,1,2,3].map(i=>'<circle cx="'+(5+i*3.4)+'" cy="10" r=".9" fill="'+gold+'"/><circle cx="'+(28+i*3.4)+'" cy="10" r=".9" fill="'+gold+'"/>').join('')+'<rect x="15" y="3.5" width="10" height="13" rx="2" fill="'+gold+'" stroke="#8a6a1a" stroke-width=".8"/><rect x="18" y="7.5" width="4" height="5" fill="'+dark+'"/>';
  } else if(st==='ring'){
    const gem = ART_GEM[bn]; const gc = gem===undefined ? acc : gem;
    g = '<circle cx="10" cy="12.5" r="6.2" fill="none" stroke="'+(bn==='Iron Ring'?'#8b97a6':gold)+'" stroke-width="'+(bn==='Iron Ring'?3.4:2.4)+'"/>'+
        (bn==='Iron Ring' ? '<path d="M5 9l2 1M15 9l-2 1" stroke="#cfd8e2" stroke-width=".8"/>' : '<path d="M7 4.5 L10 1.8 L13 4.5 L10 8Z" fill="'+gc+'" stroke="#fff" stroke-opacity=".6" stroke-width=".6"/>');
  } else if(st==='amulet'){
    const gc = ART_GEM[bn] || acc;
    g = '<path d="M3 1 Q10 14 17 1" fill="none" stroke="'+gold+'" stroke-width="1.2"/>'+
        (bn==='Sun Amulet' ? '<g stroke="'+gc+'" stroke-width="1.1">'+[0,1,2,3,4,5,6,7].map(i=>{const a=i*Math.PI/4; return '<line x1="'+(10+Math.cos(a)*5)+'" y1="'+(13+Math.sin(a)*5)+'" x2="'+(10+Math.cos(a)*8)+'" y2="'+(13+Math.sin(a)*8)+'"/>';}).join('')+'</g>' : '')+
        '<circle cx="10" cy="13" r="'+(bn==='Sun Amulet'?4.2:5)+'" fill="'+gc+'" stroke="'+gold+'" stroke-width="1.4"/>'+
        (bn==='Bone Amulet' ? '<circle cx="8.3" cy="12.5" r="1" fill="'+dark+'"/><circle cx="11.7" cy="12.5" r="1" fill="'+dark+'"/><path d="M9 15.5h2" stroke="'+dark+'" stroke-width=".8"/>' : '<circle cx="8.6" cy="11.4" r="1.2" fill="#fff" fill-opacity=".6"/>');
  } else if(st==='potion'){
    g = '<path d="M7 3h6v6l4 9a3 3 0 0 1-2.7 4.2H5.7A3 3 0 0 1 3 18l4-9z" transform="translate(0 4) scale(1 1.3)" fill="'+acc+'" fill-opacity=".85" stroke="#e8e2d0" stroke-width="1"/><rect x="7.2" y="1" width="5.6" height="4" fill="#a87444"/>';
  } else return null;
  return uniqSvgIds('<svg class="bagArt" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">'+g+'</svg>');
}
// Grid-cell contents for one bag/stash item: big art when we have it, otherwise the old small icon + rarity label.
function bagItemHtml(it){
  const art = bagArtSvg(it);
  if(art) return art;
  return '<div><div class="bcIcon" style="color:'+it.color+'">'+categoryIconSvg(it.slotType, it)+'</div>'+
      '<div class="bcLabel" style="color:'+it.color+'">'+RARITY[it.rarity].name+'</div></div>';
}
function categoryIconSvg(slotType, item){
  const body = (item && item.questId && RUNESTONE_ICONS[item.questId]) || CATEGORY_ICON_PATHS[slotType];
  if(!body) return '?';
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+body+'</svg>';
}
// Absolute left/top/width/height for each equip slot hotspot, matching the
// #pdSlot-* CSS rules -- kept here too so a *second* paperdoll (the vendor
// screen's read-only one) can be positioned identically via inline style
// without needing a duplicate id for every slot (ids must stay unique).
const PD_SLOT_POS = {
  helm:{left:109,top:2,width:37,height:32}, amulet:{left:156,top:29,width:26,height:26},
  mainhand:{left:12,top:60,width:44,height:95}, armor:{left:96,top:53,width:63,height:70},
  offhand:{left:199,top:60,width:44,height:95}, belt:{left:92,top:128,width:71,height:19},
  gloves:{left:12,top:162,width:44,height:44}, ring1:{left:65,top:170,width:26,height:26},
  ring2:{left:165,top:170,width:26,height:26}, boots:{left:199,top:162,width:44,height:44},
};
// Renders one paperdoll's slot hotspots into containerEl. idPrefix keeps
// element ids unique across the two paperdolls (main inventory + vendor
// screen). interactive=true wires the click-to-open-item-popup handler;
// both the Inventory screen's and the vendor screen's paperdoll pass true
// so tapping equipped gear from either screen opens the popup (which has
// its own Unequip button) instead of unequipping instantly. It's still a
// valid drag-drop equip TARGET either way, since drop handling matches on
// the shared .pdSlot class regardless of this flag.
function renderPaperdollInto(containerEl, p, idPrefix, interactive){
  if(!containerEl) return;
  containerEl.querySelectorAll('.pdSlot').forEach(el=>el.remove());
  for(const slot of SLOT_DISPLAY_ORDER){
    const it = p.equipment[slot];
    const blocked = !it && slot==='offhand' && p.equipment.mainhand && p.equipment.mainhand.twoHanded;
    const label = (slot==='offhand' && it && it.slotType==='weapon1h') ? 'Off-Hand' : SLOT_LABELS[slot];
    const el = document.createElement('div');
    el.className = 'pdSlot'+(it?' filled':'')+(it && p.inactiveSlots && p.inactiveSlots[slot] ? ' pdInactive' : '');   // v563: worn without its Strength / Dexterity / Intelligence
    el.id = idPrefix+slot;
    el.dataset.slot = slot;
    const pos = PD_SLOT_POS[slot];
    if(pos){ el.style.left=pos.left+'px'; el.style.top=pos.top+'px'; el.style.width=pos.width+'px'; el.style.height=pos.height+'px'; }
    let icon = it ? (bagArtSvg(it) || categoryIconSvg(it.slotType, it)) : '';
    if(it && slot==='belt') icon = icon.replace('xMidYMid meet', 'none');   // v452: the belt stretches to fill its long, flat slot
    el.innerHTML =
      '<div class="slotLabel">'+label+'</div>'+
      (it ? '<div class="slotItem'+(bagArtSvg(it)?' slotArt':'')+'" style="color:'+it.color+'">'+icon+'</div>' : (blocked ? '<div class="slotItem" style="color:#5c5460">2H</div>' : ''));
    if(it) el.title = it.name+' — '+it.affixes.map(affixTooltipLine).join(', ');
    if(interactive && it){
      // (v124) tap = item-detail popup (with Unequip); drag = move it to the bag, the stash or the vendor.
      makeItemDraggable(el, slot, 'equipped');
    }
    containerEl.appendChild(el);
  }
  // Potion socket: one potion type at a time, stacked.
  {
    const eq = ensurePotionEq(p);
    const el = document.createElement('div');
    el.className = 'pdSlot'+(eq.n>0?' filled':'');
    el.id = idPrefix+'potion'; el.dataset.slot = 'potion';
    el.style.left='100px'; el.style.top='150px'; el.style.width='56px'; el.style.height='52px';
    el.innerHTML = '<div class="slotLabel">Belt '+eq.n+'/'+beltCapacity(p)+'</div><div class="slotItem" style="font-size:15px;opacity:'+(eq.n>0?1:0.4)+'">'+POTION_EMOJI[eq.kind]+' <span style="font-size:11px">'+eq.n+'/'+beltCapacity(p)+'</span>'+'</div>';
    el.title = 'Health potions: '+eq.n+' of '+beltCapacity(p)+' (a better belt holds more)';
    if(interactive){
      el.addEventListener('click', ()=>{
        showMsg('Health potions can only be in your belt', 1.6);
      });
    }
    containerEl.appendChild(el);
  }
}
let invTab = 'gear';
function setInvTab(t){
  invTab = t;
  document.getElementById('invTabGear').classList.toggle('active', t==='gear');
  document.getElementById('invTabParts').classList.toggle('active', t==='parts');
  document.getElementById('bagGrid').style.display = t==='gear' ? '' : 'none';
  document.getElementById('partsBag').style.display = t==='parts' ? 'block' : 'none';
  document.getElementById('bagDivider').textContent = t==='parts' ? 'Parts Bag' : dollView==='knights' ? 'Bag \u2014 drag an item onto a Knight slot, or tap it and choose Equip on Knights' : 'Bag \u2014 tap an item for stats, or drag to equip';
  { const en = document.getElementById('bagEmptyNote'); if(en) en.style.display = t==='parts' ? 'none' : ''; }   // v490: the empty-bag note belongs to the gear bag
  renderPartsBag(); renderKnightsBag();
}
function renderPartsBag(){
  const p = game.player, el = document.getElementById('partsBag');
  if(!el) return;
  // v490: the Parts bag works from the start (no witch needed); the Recipe Book sits on top
  const ids = Object.keys(p.parts||{}).sort((a,b)=>{ const [ka,ta]=a.split('_'), [kb,tb]=b.split('_'); return PART_KEYS.indexOf(ka)-PART_KEYS.indexOf(kb) || (+ta)-(+tb); });
  el.innerHTML = recipeBookHtml(p) + '<div class="rbHead" style="cursor:default;">Your Parts</div>' + (ids.length ? ids.map(id=>{
    const [k,t] = id.split('_'), d = PART_DEFS[k];
    return '<div class="partCard'+(d.unique?' uq':'')+'"><div class="pIcon">'+d.icon+'</div><div class="pMain" style="color:'+d.color+'"><b>'+partName(k,+t)+'</b> \u00d7'+p.parts[id]+'<div class="pSub">'+partDesc(k,+t)+(d.from ? ' \u2014 drops from '+d.from : '')+'</div></div></div>';
  }).join('') : '<div style="color:var(--bone-dim); font-size:12px; padding:10px;">No parts yet. Monsters sometimes drop parts (rarely before Lakeside Ruins).</div>');
}
// v490: Recipe Book -- the recipes you have discovered, with a green check mark when you hold the parts.
// Tapping the check mark loads them into the witch's cauldron (once she is freed); you still press Transmute yourself.
let recipeBookOpen = true;
function recipeBookHtml(p){
  const known = STONE_RECIPES.filter(r=>(p.recipes||{})[r.id]);
  const ready = known.filter(r=>recipePartIds(p, r)).length;
  let h = '<div class="rbHead" data-rbtoggle="1">\u{1F4D6} Recipe Book <span class="pSub">('+known.length+' / '+STONE_RECIPES.length+' known'+(ready ? ', '+ready+' ready' : '')+')</span><span style="float:right;">'+(recipeBookOpen ? '\u25B4' : '\u25BE')+'</span></div>';
  if(!recipeBookOpen) return h;
  if(!known.length) return h + '<div class="pSub" style="padding:4px 10px 8px;">No known recipes yet.</div>';
  h += '<div class="pSub" style="padding:0 4px 6px;">'+'\u2714 = you hold the parts. At the Witch\u2019s cauldron, tap the recipe in her Recipes tab to load them.'+'</div>';
  for(const r of known) h += recipeRowHtml(p, r);
  return h;
}
document.getElementById('partsBag').addEventListener('click', e=>{
  if(e.target.closest('[data-rbtoggle]')){ recipeBookOpen = !recipeBookOpen; renderPartsBag(); return; }
});
document.getElementById('invTabGear').addEventListener('click', ()=>setInvTab('gear'));
document.getElementById('invTabParts').addEventListener('click', ()=>setInvTab('parts'));
// v491: Character / Knights view of the equipment figure
let dollView = 'char';
function setDollView(v){
  dollView = v;
  document.getElementById('dollTabChar').classList.toggle('active', v==='char');
  document.getElementById('dollTabKnights').classList.toggle('active', v==='knights');
  setInvTab(invTab); renderInventory();
}
document.getElementById('dollTabChar').addEventListener('click', ()=>setDollView('char'));
document.getElementById('dollTabKnights').addEventListener('click', ()=>setDollView('knights'));
let knightPick = null;
// v489: Knights tab -- the four shared Squire slots sit on top like your own paperdoll; the normal bag stays below.
// Drag an item onto a slot or tap it and choose "Equip on Knights"; tap a filled slot to take the item back.
function knightSlotFor(it){ if(!it || (it.socketed && it.socketed.some(Boolean))) return null; const s = KNIGHT_SLOTS.find(k=>k[2]===it.slotType); return s ? s[0] : null; }
function knightEquipFromBag(p, invIdx){
  const it = p.inventory[invIdx], key = knightSlotFor(it);
  if(!key){ showMsg(it && it.socketed && it.socketed.some(Boolean) ? 'Knights cannot wear items with socketed parts' : 'Knights can only wear a helm, armor, a sword or a shield', 1.6); return false; }
  const ke = knightEq(p); p.inventory.splice(invIdx,1);
  if(ke[key]) forceAddToBag(p, ke[key]);
  ke[key] = it; knightGearChanged(); saveGame(); showMsg('Knights: '+it.name, 1.2);
  return true;
}
function renderKnightsBag(){   // v491: the tabs, and the Squires' gear bonus line under the figure (Knights view)
  const p = game.player, el = document.getElementById('knightsBag'), tabs = document.getElementById('dollTabs'); if(!el) return;
  const has = uq(p,'uq_templar');
  if(tabs) tabs.style.display = has ? '' : 'none';
  if(!has && dollView==='knights'){ dollView = 'char'; document.getElementById('dollTabChar').classList.add('active'); document.getElementById('dollTabKnights').classList.remove('active'); }
  if(dollView!=='knights'){ el.style.display = 'none'; return; }
  const kg = knightGear(p);
  el.style.display = 'block';
  el.innerHTML = '<div class="pSub" style="margin:2px 0 6px; text-align:center;">Every Squire wears this gear. Bonus: '+(kg.any ? ('+'+Math.round(kg.dmg*0.75)+' damage'+(kg.dmgPct?', +'+kg.dmgPct+'% damage':'')+', +'+Math.round(kg.hp+kg.armor*1.5)+' life'+(kg.block?', '+Math.round(kg.block)+'% block':'')) : 'none yet')+'</div>';
}
// The Knights figure: helm, armour, sword and shield in the same places as your own.
const KNIGHT_DOLL_POS = {helm:'helm', armor:'armor', weapon:'mainhand', shield:'offhand'};
function renderKnightDollInto(containerEl, p){
  containerEl.querySelectorAll('.pdSlot').forEach(el=>el.remove());
  const ke = knightEq(p);
  for(const [key,label] of KNIGHT_SLOTS){
    const it = ke[key], pos = PD_SLOT_POS[KNIGHT_DOLL_POS[key]];
    const el = document.createElement('div');
    el.className = 'pdSlot knightSlot'+(it?' filled':''); el.dataset.kslot = key;
    if(pos){ el.style.left=pos.left+'px'; el.style.top=pos.top+'px'; el.style.width=pos.width+'px'; el.style.height=pos.height+'px'; }
    const icon = it ? (bagArtSvg(it) || categoryIconSvg(it.slotType, it)) : '';
    el.innerHTML = '<div class="slotLabel">'+label+'</div>'+(it ? '<div class="slotItem'+(bagArtSvg(it)?' slotArt':'')+'" style="color:'+it.color+'">'+icon+'</div>' : '');
    el.title = it ? it.name+' \u2014 tap to take it back' : 'Knights: '+label;
    containerEl.appendChild(el);
  }
}
document.getElementById('paperdoll').addEventListener('click', (e)=>{
  const sl = e.target.closest('[data-kslot]'); if(!sl) return;
  const p = game.player, ke = knightEq(p), key = sl.dataset.kslot;
  if(ke[key]){ forceAddToBag(p, ke[key]); ke[key] = null; knightGearChanged(); saveGame(); renderInventory(); }
});
function renderInventory(){
  const p = game.player;
  renderPartsBag(); renderKnightsBag();
  if(fixBagOverlaps(p.inventory)) saveGame();
  document.getElementById('invStats').innerHTML = statSummaryHtml(p);
  { const ig = document.getElementById('invGold'); if(ig) ig.textContent = (p.gold||0).toLocaleString()+' gold'; }   // v489
  // Class + main talent tree header, top of screen (see mainTreeName above).
  const invClsName = p.cls==='ranger' ? 'Ranger' : p.cls==='mystic' ? 'Mystic' : 'Warrior';
  const invTreeName = mainTreeName(p);
  document.getElementById('invClassHeader').textContent = invTreeName ? (invClsName+' · '+invTreeName) : invClsName;

  // ---- Paperdoll: one slot hotspot per equip slot, laid out over the silhouette ----
  if(dollView==='knights' && uq(p,'uq_templar')) renderKnightDollInto(document.getElementById('paperdoll'), p);   // v491
  else renderPaperdollInto(document.getElementById('paperdoll'), p, 'pdSlot-', true);

  // ---- Grid bag: each item drawn as a WxH block at its stored (gx,gy) ----
  const gridEl = document.getElementById('bagGrid');
  gridEl.querySelectorAll('.bagCell').forEach(el=>el.remove());
  const CELL = 32;
  for(let i=0;i<p.inventory.length;i++){
    const it = p.inventory[i];
    if(it.gx==null || it.gy==null) continue; // shouldn't happen post-repackBag, but be safe
    const [w,h] = itemShape(it);
    const el = document.createElement('div');
    el.className = 'bagCell';
    el.style.left = (it.gx*CELL+1)+'px';
    el.style.top = (it.gy*CELL+1)+'px';
    el.style.width = (w*CELL-2)+'px';
    el.style.height = (h*CELL-2)+'px';
    el.style.borderColor = it.color; if(it.crimson){ el.style.boxShadow = '0 0 8px 2px rgba(142,15,38,.85), inset 0 0 8px rgba(142,15,38,.6)'; }
    el.dataset.idx = i;
    el.innerHTML =
      bagItemHtml(it);
    el.title = it.name+' — '+it.affixes.map(affixTooltipLine).join(', ');
    makeItemDraggable(el, i, 'inv');
    if(it.questId==='recipe_book') el.addEventListener('contextmenu', (ev)=>{ ev.preventDefault(); readRecipeBook(i); });
    if(it.questId==='skill_tome') el.addEventListener('contextmenu', (ev)=>{ ev.preventDefault(); readSkillTome(i); });
    gridEl.appendChild(el);
  }
  let emptyNote = document.getElementById('bagEmptyNote');
  if(p.inventory.length===0){
    if(!emptyNote){
      emptyNote = document.createElement('div');
      emptyNote.id = 'bagEmptyNote';
      emptyNote.className = 'bagEmptyNote';
      emptyNote.textContent = 'No items collected yet';
      gridEl.parentNode.insertBefore(emptyNote, gridEl.nextSibling);
      if(invTab==='parts') emptyNote.style.display = 'none';   // v490
    }
  } else if(emptyNote){
    emptyNote.remove();
  }
}

function openInventory(){
  game.modalOpen = true; try{ sfxPlay('bagOpen', 1); }catch(e){}
  bagBadge.style.display = 'none';
  renderInventory();
  invOverlay.style.display='flex';
}
function closeInventory(){
  invOverlay.style.display='none';
  document.getElementById('itemDetailOverlay').style.display = 'none';
  document.getElementById('charStatsOverlay').style.display = 'none';
  game.modalOpen = false;
}
invClose.addEventListener('click', closeInventory);

// ---- Character Stats popup (v67): the HP/BLK/SPD/DMG/RNG/ARM/EVA stat
// block used to render directly on the Inventory screen, cluttering it
// alongside the paperdoll and bag grid. It now lives in its own modal,
// opened from a "Character Stats" button at the top of Inventory --
// swaps with the Inventory screen the same way Settings/Achievements
// swap with the Menu screen (hide one, show the other; Inventory stays
// "open" the whole time as far as game.modalOpen is concerned). The
// #invStats element and statSummaryHtml()/renderInventory() wiring are
// unchanged -- only their container moved, so the existing delegated
// gold-transfer click handler on #invStats keeps working as-is.
const charStatsOverlay = document.getElementById('charStatsOverlay');
function openCharStats(){
  hideStatTip();
  document.getElementById('invStats').innerHTML = statSummaryHtml(game.player);
  invOverlay.style.display = 'none';
  charStatsOverlay.style.display = 'flex';
}
function closeCharStats(){
  hideStatTip();
  charStatsOverlay.style.display = 'none';
  invOverlay.style.display = 'flex';
}
document.getElementById('charStatsBtn').addEventListener('click', openCharStats);
document.getElementById('charStatsClose').addEventListener('click', closeCharStats);

// Tapping the GOLD stat cell in the Inventory panel sends every coin the
// character is carrying straight to the shared stash (see stashOverlay
// below) -- delegated on the container since statSummaryHtml() rebuilds
// its innerHTML on every renderInventory() call.
document.getElementById('invStats').addEventListener('click', (ev)=>{
  if(ev.target.closest('.goldCell')) transferGoldToStash();
});

// ---- Item detail popup: tapping a bag item shows its name & full stat
// list first, with context-dependent action buttons instead of acting on
// tap directly. Source contexts:
//   'inv'        -- the player's own Inventory screen: Equip + Drop
//   'shopBag'     -- the player's bag while the vendor is open: Equip + Sell
//   'vendorStock' -- an item still on the vendor's shelf: Buy only
//   'equipped'    -- a filled paperdoll slot (Inventory OR vendor screen):
//                    Unequip only. `idx` here is the equip slot key
//                    (e.g. 'mainhand'), not a bag index.
//   'stash'       -- an item sitting in the shared stash chest: Equip
//                    (straight from the chest) + Withdraw.
// Additionally, when the Stash panel is open, tapping an 'inv' item (in
// its bag mirror there) also shows a "Store in Stash" deposit button.
let pendingIdx = null;
let itemDetailSource = 'inv';
// Guards against the click-through bug where a single tap that opens this
// popup (via dragEnd's "not dragging -> treat as tap" path below) is
// immediately followed by a browser-synthesized compatibility "click"
// landing on whatever action button now sits under the same finger/cursor
// (most dangerously Sell, which would silently sell an item the player
// only meant to inspect). Every action button's click handler below
// refuses to act until ITEM_DETAIL_GUARD_MS has passed since the popup
// opened, which any stray click from the SAME originating gesture cannot
// satisfy but any genuine, deliberate follow-up tap always will.
let itemDetailOpenedAt = 0;
// 350ms was tried first but proved long enough to also swallow a fast,
// genuine follow-up tap (real players and even scripted UI tests routinely
// click Equip/Sell well under 350ms after the popup appears). The actual
// click-through bug this guards against fires its stray synthetic click
// essentially in the same event-loop turn as the popup opening (a few ms,
// not hundreds) -- 120ms comfortably covers that while leaving normal
// human/automated tap speed alone.
const ITEM_DETAIL_GUARD_MS = 120;
function openItemDetail(idx, source){
  const p = game.player;
  source = source===true ? 'shopBag' : (source || 'inv');
  const item = source==='vendorStock' ? game.town.stock[idx]
    : source==='equipped' ? p.equipment[idx]
    : source==='stash' ? stash.items[idx]
    : p.inventory[idx];
  if(!item) return;
  pendingIdx = idx;
  itemDetailSource = source;
  const nameEl = document.getElementById('itemDetailName');
  nameEl.textContent = item.unidentified ? 'Unidentified '+itemBaseName(item) : item.name;
  nameEl.style.color = item.color;
  const statsEl = document.getElementById('itemDetailStats');
  const cmpItem = source==='equipped' ? null : compareTargetFor(item, p);
  statsEl.innerHTML = itemCardHtml(item, cmpItem) + socketLineHtml(item) + (source==='vendorStock' ? '' : socketButtonsHtml(item));
  const cmpBtn = document.getElementById('itemDetailCompare');
  cmpBtn.style.display = (cmpItem && !item.unidentified) ? 'flex' : 'none';
  const useBtn = document.getElementById('itemDetailUse');
  useBtn.style.display = 'none';
  const equipBtn = document.getElementById('itemDetailEquip');
  const sellBtn = document.getElementById('itemDetailSell');
  const buyBtn = document.getElementById('itemDetailBuy');
  const dropBtn = document.getElementById('itemDetailDrop');
  const unequipBtn = document.getElementById('itemDetailUnequip');
  const withdrawBtn = document.getElementById('itemDetailWithdraw');
  const depositBtn = document.getElementById('itemDetailDeposit');
  withdrawBtn.style.display = 'none';
  depositBtn.style.display = 'none';
  if(source==='vendorStock'){
    equipBtn.style.display = 'none';
    sellBtn.style.display = 'none';
    dropBtn.style.display = 'none';
    unequipBtn.style.display = 'none';
    buyBtn.style.display = 'flex';
    document.getElementById('itemDetailBuyPrice').textContent = buyPriceFor(item)+'g';
  } else if(source==='shopBag'){
    equipBtn.style.display = 'flex';
    sellBtn.style.display = (item.slotType==='questitem' || item.unsellable) ? 'none' : 'flex'; // quest items/potions can never be sold
    dropBtn.style.display = 'none';
    unequipBtn.style.display = 'none';
    buyBtn.style.display = 'none';
    document.getElementById('itemDetailSellPrice').textContent = priceFor(item)+'g';
  } else if(source==='equipped'){
    equipBtn.style.display = 'none';
    // v419: worn gear can be sold straight from its popup while a vendor is open
    const canSellEq = shopOverlay.style.display==='flex' && !(item.slotType==='questitem' || item.unsellable);
    sellBtn.style.display = canSellEq ? 'flex' : 'none';
    if(canSellEq) document.getElementById('itemDetailSellPrice').textContent = priceFor(item)+'g';
    dropBtn.style.display = 'none';
    buyBtn.style.display = 'none';
    unequipBtn.style.display = 'flex';
  } else if(source==='stash'){
    equipBtn.style.display = 'flex';
    sellBtn.style.display = 'none';
    dropBtn.style.display = 'none';
    unequipBtn.style.display = 'none';
    buyBtn.style.display = 'none';
    withdrawBtn.style.display = 'flex';
  } else {
    equipBtn.style.display = 'flex';
    sellBtn.style.display = 'none';
    dropBtn.style.display = 'flex';
    unequipBtn.style.display = 'none';
    buyBtn.style.display = 'none';
    if(stashOverlay.style.display==='flex' && !isNoStashItem(item)) depositBtn.style.display = 'flex';
  }
  // Quest items (e.g. Ruins Map, slotType:'questitem') have no equip slot
  // to go into -- see makeRuinsMapItem's comment -- so Equip never shows
  // for one regardless of source, even though the branches above would
  // otherwise show it for a plain inv/stash/shopBag item.
  if(item.slotType==='questitem'){ equipBtn.style.display = 'none'; sellBtn.style.display = 'none'; dropBtn.style.display = 'none'; }
  if(item.questId==='silver_locket') dropBtn.style.display = 'none';   // v519: the heirloom is kept
  if((item.questId==='recipe_book' || item.questId==='skill_tome') && source==='inv'){ useBtn.style.display = 'flex'; const un0 = useBtn.querySelector('.schName'); if(un0) un0.textContent = 'Read'; }
  if(item.slotType==='potion'){
    equipBtn.style.display = 'none'; sellBtn.style.display = 'none';
    if(source==='inv'){ useBtn.style.display = 'flex'; const un = useBtn.querySelector('.schName'); if(un) un.textContent = item.slotType==='potion' ? 'Drink' : 'Use'; }
  }
  { const lb = equipBtn.querySelector('.schName'), kOn = dollView==='knights' && source==='inv' && !!knightSlotFor(item); if(lb) lb.textContent = kOn ? 'Equip on Knights' : 'Equip'; }   // v489
  document.getElementById('itemDetailOverlay').style.display = 'flex';
  itemDetailOpenedAt = performance.now();
}
function closeItemDetail(){
  document.getElementById('itemDetailOverlay').style.display = 'none';
  document.getElementById('itemCompareOverlay').style.display = 'none';
  pendingIdx = null;
  itemDetailSource = 'inv';
}
document.getElementById('itemDetailClose').addEventListener('click', ()=>{ if(performance.now()-itemDetailOpenedAt < ITEM_DETAIL_GUARD_MS*3) return; closeItemDetail(); });   // v489: the opening tap must not hit the X
function closeItemCompare(){ document.getElementById('itemCompareOverlay').style.display = 'none'; }
document.getElementById('itemCompareClose').addEventListener('click', closeItemCompare);
document.getElementById('itemCompareOverlay').addEventListener('click', e=>{ if(e.target.id==='itemCompareOverlay') closeItemCompare(); });
function openItemCompare(item){
  const p = game.player, eqIt = compareTargetFor(item, p);
  if(!item || !eqIt) return;
  const col = (it, label, other)=> '<div class="icCol"><div class="icColHead">'+label+'</div><div class="icColName" style="color:'+it.color+'">'+it.name+'</div>'+itemCardHtml(it, other)+'</div>';
  document.getElementById('itemCompareBody').innerHTML = col(eqIt, 'Equipped', null) + col(item, 'This item', eqIt);
  document.getElementById('itemCompareOverlay').style.display = 'flex';
}
document.getElementById('itemDetailCompare').addEventListener('click', ()=>{
  if(performance.now()-itemDetailOpenedAt < ITEM_DETAIL_GUARD_MS*3) return;   // v349: ignore the tap that opened the card (it landed on Compare and popped the compare screen open)
  const item = itemDetailSource==='vendorStock' ? game.town.stock[pendingIdx] : curDetailItem();
  if(item) openItemCompare(item);
});
document.getElementById('itemDetailEquip').addEventListener('click', ()=>{
  if(performance.now()-itemDetailOpenedAt < ITEM_DETAIL_GUARD_MS) return;
  if(itemDetailSource==='vendorStock') return;
  const p = game.player;
  const item = itemDetailSource==='stash' ? stash.items[pendingIdx] : p.inventory[pendingIdx];
  if(item && dollView==='knights' && itemDetailSource==='inv' && knightSlotFor(item)){ knightEquipFromBag(p, pendingIdx); closeItemDetail(); renderInventory(); return; }   // v489
  if(item){
    let _stIdx=-1;
    if(itemDetailSource==='stash'){ _stIdx=pendingIdx; stash.items.splice(pendingIdx,1); }
    const _ok = equipItem(p, item);
    if(_stIdx>=0){ if(!_ok) stash.items.splice(Math.min(_stIdx,stash.items.length),0,item); saveStash(); }
    if(_ok) showMsg(item.name, 1.2);
    closeItemDetail();
    renderInventory();
    renderShop();
    if(stashOverlay.style.display==='flex') renderStash();
    saveGame();
  }
});
document.getElementById('itemDetailWithdraw').addEventListener('click', ()=>{
  if(performance.now()-itemDetailOpenedAt < ITEM_DETAIL_GUARD_MS) return;
  if(itemDetailSource!=='stash') return;
  const item = stash.items[pendingIdx];
  if(item){
    if(!addToBag(game.player, item)){ showMsg('Bag is full', 1.2); return; }
    stash.items.splice(pendingIdx,1);
    saveStash();
    closeItemDetail();
    renderInventory();
    renderStash();
    saveGame();
  }
});
document.getElementById('itemDetailDeposit').addEventListener('click', ()=>{
  if(performance.now()-itemDetailOpenedAt < ITEM_DETAIL_GUARD_MS) return;
  if(itemDetailSource!=='inv') return;
  const p = game.player;
  const item = p.inventory[pendingIdx];
  if(isNoStashItem(item)){ showMsg('This must stay in your inventory', 1.6, '#ffd93a'); return; }
  if(item){
    const curIdx = p.inventory.indexOf(item);
    if(curIdx>=0) p.inventory.splice(curIdx,1);
    delete item.gx; delete item.gy;
    if(!addToBag({inventory:stash.items}, item)){ forceAddToBag(p, item); showMsg('Stash is full', 1.2); closeItemDetail(); renderInventory(); renderStash(); return; }
    saveStash();
    showMsg('Stored '+item.name, 1.2);
    closeItemDetail();
    renderInventory();
    renderStash();
    saveGame();
  }
});
document.getElementById('itemDetailSell').addEventListener('click', ()=>{
  // Primary defense for the "tap opens popup, then immediately auto-sells"
  // bug -- see ITEM_DETAIL_GUARD_MS above. Sell is the highest-stakes
  // button here (an accidental Equip/Drop/etc is easily undone; an
  // accidental Sell loses the item for gold the player didn't ask for),
  // so this guard matters most on this handler specifically.
  if(performance.now()-itemDetailOpenedAt < ITEM_DETAIL_GUARD_MS) return;
  const p = game.player;
  if(itemDetailSource==='equipped' && shopOverlay.style.display==='flex'){   // v419: sell worn gear
    const eq = p.equipment[pendingIdx];
    if(!eq) return;
    if(eq.slotType==='questitem' || eq.unsellable){ showMsg('This item cannot be sold', 1.4); return; }
    p.gold += priceFor(eq); p.equipment[pendingIdx] = null; recalcStats(p);
    showMsg('Sold '+eq.name, 1.2);
    closeItemDetail(); renderInventory(); renderShop(); saveGame();
    return;
  }
  if(itemDetailSource!=='shopBag') return;
  const item = p.inventory[pendingIdx];
  if(item && (item.slotType==='questitem' || item.unsellable)){ showMsg('This item cannot be sold', 1.4); return; }
  if(item){
    p.gold += priceFor(item);
    p.inventory.splice(pendingIdx,1);
    showMsg('Sold '+item.name, 1.2);
    closeItemDetail();
    renderShop();
    saveGame();
  }
});
document.getElementById('itemDetailDrop').addEventListener('click', ()=>{
  if(performance.now()-itemDetailOpenedAt < ITEM_DETAIL_GUARD_MS) return;
  if(itemDetailSource!=='inv') return;
  const p = game.player;
  const item = p.inventory[pendingIdx];
  if(item){
    p.inventory.splice(pendingIdx,1);
    // Spawn the exact item (same rolled stats/rarity/name) as retrievable
    // ground loot at the player's current position, using the same g.loot
    // ground-item system the dungeon/forest use -- works in every scene,
    // including Town, where it previously just vanished from inventory.
    const g = game;
    if(g && g.loot){
      // dropGrace briefly blocks the walk-over pickup check below (both here
      // and in the dungeon/forest loop) so an item dropped right at your
      // feet doesn't get instantly re-picked-up on the very next frame,
      // before you've had a chance to step away or see it land.
      g.loot.push({type:'item', x:p.x+rand(-14,14), y:p.y+rand(-14,14), r:8, item, dropGrace:0.8, playerDropped:true});
    }
    showMsg('Dropped '+item.name, 1.0);
    closeItemDetail();
    renderInventory();
    saveGame();
  }
});
document.getElementById('itemDetailUse').addEventListener('click', ()=>{
  if(performance.now()-itemDetailOpenedAt < ITEM_DETAIL_GUARD_MS) return;
  if(itemDetailSource!=='inv') return;
  const p = game.player;
  const item = p.inventory[pendingIdx];
  if(item && item.questId==='recipe_book'){ readRecipeBook(pendingIdx); return; }
  if(item && item.questId==='skill_tome'){ readSkillTome(pendingIdx); return; }
  if(!item || item.slotType!=='potion') return;
  if(usePotion(p, item)){
    p.inventory.splice(pendingIdx,1);
    closeItemDetail();
    if(typeof renderInventory==='function') try{ renderInventory(); }catch(e){}
    saveGame();
  }
});
document.getElementById('itemDetailBuy').addEventListener('click', ()=>{
  if(performance.now()-itemDetailOpenedAt < ITEM_DETAIL_GUARD_MS) return;
  if(itemDetailSource!=='vendorStock') return;
  const it = game.town.stock[pendingIdx];
  if(!it) return;
  const price = buyPriceFor(it);
  if(game.player.gold < price) return;
  if(isHealthPotion(it) && ensurePotionEq(game.player).n >= beltCapacity(game.player)){ showMsg('Belt is full', 1.4); return; }   // v478: bought potions go straight to the belt
  game.player.gold -= price;
  forceAddToBag(game.player, it);
  if(game.openVendor==='bar' && it.slotType==='potion' && it.potionKind==='health') game.town.stock[pendingIdx] = makePotionItem(it.potionKind);   // v464: never runs out
  else game.town.stock.splice(pendingIdx,1);
  if(it.unidentified){ it.unidentified = false; delete it.fixedPrice; }
  if(game.openVendor==='bar') syncBarStock();
  const bought = it.slotType==='potion' ? false : tryAutoEquip(game.player, it);
  showMsg(bought ? 'Equipped: '+it.name : it.name, 1.2);
  closeItemDetail();
  renderShop();
  saveGame();
});
document.getElementById('itemDetailUnequip').addEventListener('click', ()=>{
  if(performance.now()-itemDetailOpenedAt < ITEM_DETAIL_GUARD_MS) return;
  if(itemDetailSource!=='equipped') return;
  const p = game.player;
  const slot = pendingIdx;
  if(p.equipment[slot]){
    unequipSlot(p, slot);
    closeItemDetail();
    renderInventory();
    if(shopOverlay.style.display==='flex') renderShop();
    saveGame();
  }
});
bagBtn.addEventListener('click', ()=>{
  if(!game || !game.started || game.over) return;
  if(game.modalOpen) return;
  openInventory();
});

// ---- Drag & drop: every bag/shop item cell can be picked up (pointerdown),
// dragged (pointermove), and dropped (pointerup) -- following the same raw
// pointer-event convention the joystick/attack buttons already use, so it
// works consistently with mouse or touch. A short move under DRAG_THRESHOLD
// is treated as a tap and opens the item-detail popup instead of a drag.
// Drop targets: a paperdoll equip slot (equips), or the vendor's stock grid
// while the shop is open (sells). Anywhere else: snap back, no-op.
let dragSt = null;
const DRAG_THRESHOLD = 10;
function makeItemDraggable(el, idx, source){
  el.addEventListener('pointerdown', (ev)=>{
    if(ev.button!=null && ev.button!==0) return;
    dragSt = {idx, source, el, startX:ev.clientX, startY:ev.clientY, dragging:false, ghost:null};
    try{ el.setPointerCapture(ev.pointerId); }catch(err){}
    ev.preventDefault();
  });
}
function dragMove(ev){
  if(!dragSt) return;
  const dx = ev.clientX-dragSt.startX, dy = ev.clientY-dragSt.startY;
  if(!dragSt.dragging && Math.hypot(dx,dy) > DRAG_THRESHOLD){
    dragSt.dragging = true;
    const rect = dragSt.el.getBoundingClientRect();
    const ghost = dragSt.el.cloneNode(true);
    ghost.style.position = 'fixed';
    ghost.style.left = rect.left+'px'; ghost.style.top = rect.top+'px';
    ghost.style.width = rect.width+'px'; ghost.style.height = rect.height+'px';
    ghost.style.margin = '0'; ghost.style.pointerEvents = 'none'; ghost.style.zIndex = '999';
    ghost.style.opacity = '0.9'; ghost.style.transform = 'scale(1.08)';
    ghost.id = 'dragGhost';
    document.body.appendChild(ghost);
    dragSt.ghost = ghost;
    dragSt.ghostOffX = ev.clientX-rect.left;
    dragSt.ghostOffY = ev.clientY-rect.top;
    dragSt.el.style.opacity = '0.25';
  }
  if(dragSt.dragging && dragSt.ghost){
    dragSt.ghost.style.left = (ev.clientX-dragSt.ghostOffX)+'px';
    dragSt.ghost.style.top = (ev.clientY-dragSt.ghostOffY)+'px';
  }
}
function dragEnd(ev){
  if(!dragSt) return;
  const st = dragSt; dragSt = null;
  if(st.ghost) st.ghost.remove();
  st.el.style.opacity = '';
  if(!st.dragging){
    if(socketMode() && (st.source==='shopBag' || st.source==='equipped' || st.source==='inv')){
      const pp = game.player, sit = st.source==='equipped' ? pp.equipment[st.idx] : pp.inventory[st.idx];
      if(sit){ socketBenchSet(sit); return; }
    }
    openItemDetail(st.idx, st.source==='shopBag' ? 'shopBag' : (st.source==='stash' ? 'stash' : (st.source==='equipped' ? 'equipped' : 'inv')));
    return;
  }
  const p = game.player;
  const item = st.source==='stash' ? stash.items[st.idx] : (st.source==='equipped' ? p.equipment[st.idx] : p.inventory[st.idx]);
  if(!item) return;
  const target = document.elementFromPoint(ev.clientX, ev.clientY);
  if(socketMode() && target && target.closest && target.closest('#socketBench')){ socketBenchSet(item); return; }
  { const kEl = target && target.closest ? target.closest('[data-kslot]') : null;   // v489: drop onto a Knight slot
    if(kEl && st.source==='inv'){ knightEquipFromBag(p, st.idx); renderInventory(); return; } }
  const slotEl = target && target.closest ? target.closest('.pdSlot') : null;
  const overStock = target && target.closest ? target.closest('#shopStock') : null;
  const overStashGrid = target && target.closest ? target.closest('#stashGrid') : null;
  const overStashBagGrid = target && target.closest ? target.closest('#stashBagGrid') : null;
  const shopIsOpen = shopOverlay.style.display === 'flex';
  const stashIsOpen = stashOverlay.style.display === 'flex';
  const CELL = 32;
  // Grid cell under the dragged item's TOP-LEFT corner (not the raw pointer), snapped to the nearest square.
  const dropCell = (rect, w, h)=>{
    const cs = rect.width>0 ? rect.width/BAG_COLS : CELL;   // (v247) cell size in screen px -- the screens can be scaled to fit
    const left = st.source==='equipped' ? ev.clientX - (w*cs)/2 : ev.clientX - (st.ghostOffX||0);
    const top  = st.source==='equipped' ? ev.clientY - (h*cs)/2 : ev.clientY - (st.ghostOffY||0);
    return {gx: clamp(Math.round((left-rect.left)/cs), 0, BAG_COLS-w), gy: clamp(Math.round((top-rect.top)/cs), 0, BAG_ROWS-h)};
  };
  const refreshAll = ()=>{ renderInventory(); if(shopIsOpen) renderShop(); if(stashIsOpen) renderStash(); saveGame(); };
  const overlapsAt = (list, it, gx, gy, w, h)=> list.filter(o=>{ if(o===it || o.gx==null) return false; const [ow,oh]=itemShape(o); return gx < o.gx+ow && gx+w > o.gx && gy < o.gy+oh && gy+h > o.gy; });
  if(st.source==='equipped'){
    // Dragging worn gear out of the paperdoll: onto a bag grid (unequip), the vendor (sell) or the stash.
    const slotKey = st.idx;
    const bagGridEl = target && target.closest ? target.closest('#bagGrid, #shopBag, #stashBagGrid') : null;
    const [ew,eh] = itemShape(item);
    if(bagGridEl){
      const {gx,gy} = dropCell(bagGridEl.getBoundingClientRect(), ew, eh);
      p.equipment[slotKey] = null; recalcStats(p);
      if(overlapsAt(p.inventory, item, gx, gy, ew, eh).length===0){ item.gx=gx; item.gy=gy; p.inventory.push(item); }
      else { delete item.gx; delete item.gy; forceAddToBag(p, item); }
      showMsg('Unequipped '+item.name, 1.0);
      refreshAll();
    } else if(overStock && shopIsOpen){
      if(item.slotType==='questitem' || item.unsellable){ showMsg('This item cannot be sold', 1.4); return; }
      p.equipment[slotKey] = null; recalcStats(p);
      p.gold += priceFor(item);
      showMsg('Sold '+item.name, 1.2);
      refreshAll();
    } else if(overStashGrid && stashIsOpen){
      const {gx,gy} = dropCell(overStashGrid.getBoundingClientRect(), ew, eh);
      p.equipment[slotKey] = null; recalcStats(p);
      if(overlapsAt(stash.items, item, gx, gy, ew, eh).length===0){ item.gx=gx; item.gy=gy; stash.items.push(item); }
      else { delete item.gx; delete item.gy; if(!addToBag({inventory:stash.items}, item)){ item.gx=0; item.gy=0; stash.items.push(item); } }
      saveStash();
      showMsg('Stored '+item.name, 1.0);
      refreshAll();
    }
    return;
  }
  if(slotEl && slotEl.dataset.slot==='potion'){
    if(item.slotType!=='potion'){ showMsg('Only potions can be socketed here', 1.2); return; }
    if(st.source==='stash'){ stash.items.splice(st.idx,1); saveStash(); p.inventory.push(item); }
    socketPotion(p, item);
    renderInventory();
    if(shopIsOpen) renderShop();
    if(stashIsOpen) renderStash();
    saveGame();
  } else if(slotEl){
    let _ok2;
    if(st.source==='stash'){ stash.items.splice(st.idx,1); _ok2=equipItem(p, item); if(!_ok2) stash.items.splice(Math.min(st.idx,stash.items.length),0,item); saveStash(); }
    else _ok2=equipItem(p, item);
    renderInventory();
    if(shopIsOpen) renderShop();
    if(stashIsOpen) renderStash();
    saveGame();
  } else if(overStock && shopIsOpen && st.source!=='stash'){
    if(item.slotType==='questitem' || item.unsellable){ showMsg('This item cannot be sold', 1.4); return; }
    p.gold += priceFor(item);
    const curIdx = p.inventory.indexOf(item);
    if(curIdx>=0) p.inventory.splice(curIdx,1);
    showMsg('Sold '+item.name, 1.2);
    renderShop();
    renderInventory();
    saveGame();
  } else if(overStashGrid && stashIsOpen && st.source!=='stash' && isNoStashItem(item)){
    showMsg('This must stay in your inventory', 1.6, '#ffd93a');
  } else if(overStashGrid && stashIsOpen && st.source!=='stash'){
    // Deposit: dragged from the player's bag onto the Stash's own grid.
    const curIdx = p.inventory.indexOf(item);
    if(curIdx>=0) p.inventory.splice(curIdx,1);
    const rect = overStashGrid.getBoundingClientRect();
    const [w,h] = itemShape(item);
    const _dc = dropCell(rect, w, h);
    let gx = _dc.gx, gy = _dc.gy;
    const overlapping = stash.items.filter(it=>{
      const [ow,oh] = itemShape(it);
      return gx < it.gx+ow && gx+w > it.gx && gy < it.gy+oh && gy+h > it.gy;
    });
    if(overlapping.length===0){ item.gx=gx; item.gy=gy; stash.items.push(item); }
    else { delete item.gx; delete item.gy; if(!addToBag({inventory:stash.items}, item)){ forceAddToBag(p, item); showMsg('Stash is full', 1.2); renderInventory(); renderStash(); return; } }
    saveStash();
    showMsg('Stored '+item.name, 1.0);
    renderInventory();
    renderStash();
    saveGame();
  } else if(overStashBagGrid && stashIsOpen && st.source==='stash'){
    // Withdraw: dragged from the Stash grid onto the player's own bag mirror.
    const rect = overStashBagGrid.getBoundingClientRect();
    const [w,h] = itemShape(item);
    const _dc = dropCell(rect, w, h);
    let gx = _dc.gx, gy = _dc.gy;
    const overlapping = p.inventory.filter(it=>{
      const [ow,oh] = itemShape(it);
      return gx < it.gx+ow && gx+w > it.gx && gy < it.gy+oh && gy+h > it.gy;
    });
    const curIdx = stash.items.indexOf(item);
    if(curIdx>=0) stash.items.splice(curIdx,1);
    if(overlapping.length===0){ item.gx=gx; item.gy=gy; p.inventory.push(item); }
    else { delete item.gx; delete item.gy; if(!addToBag(p, item)){ addToBag({inventory:stash.items}, item); showMsg('Bag is full', 1.2); renderInventory(); renderStash(); return; } }
    saveStash();
    renderInventory();
    renderStash();
    saveGame();
  } else {
    // Repositioning within the SAME grid the item came from -- either the
    // player's own bag (Inventory screen's #bagGrid, the vendor's "Your
    // Bag" #shopBag, or the Stash panel's bag mirror #stashBagGrid), or
    // the Stash's own grid #stashGrid. Landing on an existing item of the
    // same shape swaps the two; empty space just moves it; anything
    // messier (overlapping multiple/mismatched items) is a no-op and the
    // next render snaps it back.
    const ownStashGridEl = st.source==='stash' ? (target && target.closest ? target.closest('#stashGrid') : null) : null;
    const ownGridEl = st.source!=='stash' ? (target && target.closest ? target.closest('#bagGrid, #shopBag, #stashBagGrid') : null) : null;
    if(ownStashGridEl){
      const rect = ownStashGridEl.getBoundingClientRect();
      const [w,h] = itemShape(item);
      const _dc = dropCell(rect, w, h);
      let gx = _dc.gx, gy = _dc.gy;
      const overlapping = stash.items.filter(it=>{
        if(it===item) return false;
        const [ow,oh] = itemShape(it);
        return gx < it.gx+ow && gx+w > it.gx && gy < it.gy+oh && gy+h > it.gy;
      });
      if(overlapping.length===0){
        item.gx = gx; item.gy = gy;
        saveStash(); renderStash();
      } else if(overlapping.length===1){
        const other = overlapping[0];
        const [ow,oh] = itemShape(other);
        if(ow===w && oh===h){
          const ox=other.gx, oy=other.gy;
          other.gx = item.gx; other.gy = item.gy;
          item.gx = ox; item.gy = oy;
          saveStash(); renderStash();
        }
      }
    } else if(ownGridEl){
      const rect = ownGridEl.getBoundingClientRect();
      const [w,h] = itemShape(item);
      const _dc = dropCell(rect, w, h);
      let gx = _dc.gx, gy = _dc.gy;
      const overlapping = p.inventory.filter(it=>{
        if(it===item) return false;
        const [ow,oh] = itemShape(it);
        return gx < it.gx+ow && gx+w > it.gx && gy < it.gy+oh && gy+h > it.gy;
      });
      if(overlapping.length===0){
        item.gx = gx; item.gy = gy;
        renderInventory();
        if(shopIsOpen) renderShop();
        if(stashIsOpen) renderStash();
        saveGame();
      } else if(overlapping.length===1){
        const other = overlapping[0];
        const [ow,oh] = itemShape(other);
        if(ow===w && oh===h){
          const ox=other.gx, oy=other.gy;
          other.gx = item.gx; other.gy = item.gy;
          item.gx = ox; item.gy = oy;
          renderInventory();
          if(shopIsOpen) renderShop();
          if(stashIsOpen) renderStash();
          saveGame();
        }
      }
    }
  }
  // any other drop target: no-op -- the next render puts the item back
}
document.addEventListener('pointermove', dragMove);
document.addEventListener('pointerup', dragEnd);
document.addEventListener('pointercancel', dragEnd);

