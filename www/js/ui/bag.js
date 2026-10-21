// ---------- Grid-shaped bag (Diablo-2-style: each item takes a WxH footprint) ----------
const BAG_COLS = 10, BAG_ROWS = 6;
const ITEM_SHAPE = {
  helm:[2,2], armor:[2,3], amulet:[1,1], ring:[1,1], boots:[2,2], gloves:[2,2], belt:[2,1],
  weapon1h:[1,3], weapon2h:[2,4], shield:[2,3], bow:[2,3], staff:[2,4], potion:[1,2],
};
function itemShape(item){ return item.shape || ITEM_SHAPE[item.slotType] || [1,1]; }
function bagOccupancy(inventory, excludeItem){
  const grid = [];
  for(let r=0;r<BAG_ROWS;r++) grid.push(new Array(BAG_COLS).fill(false));
  for(const it of inventory){
    if(it===excludeItem || it.gx==null || it.gy==null) continue;
    const [w,h] = itemShape(it);
    for(let ry=it.gy; ry<it.gy+h; ry++) for(let rx=it.gx; rx<it.gx+w; rx++){
      if(ry>=0 && ry<BAG_ROWS && rx>=0 && rx<BAG_COLS) grid[ry][rx] = true;
    }
  }
  return grid;
}
// First-fit scan (top-left to bottom-right) for a free rectangular spot --
// simple and predictable, same idea classic loot-grid games use.
function findBagSpot(inventory, shape, excludeItem){
  const [w,h] = shape;
  if(w>BAG_COLS || h>BAG_ROWS) return null;
  const grid = bagOccupancy(inventory, excludeItem);
  for(let gy=0; gy<=BAG_ROWS-h; gy++){
    for(let gx=0; gx<=BAG_COLS-w; gx++){
      let ok = true;
      for(let ry=gy; ry<gy+h && ok; ry++){
        for(let rx=gx; rx<gx+w; rx++){ if(grid[ry][rx]){ ok=false; break; } }
      }
      if(ok) return {gx,gy};
    }
  }
  return null;
}
// Adds an item to the bag at the first grid spot it fits in. Returns false
// (and leaves the item untouched/unadded) if the bag has no room for its shape.
function addToBag(p, item){
  if(tryStackPotion(p, item)) return true;
  if(isHealthPotion(item) && p.equipment) return false;   // v478: never into the bag
  const spot = findBagSpot(p.inventory, itemShape(item));
  if(!spot) return false;
  item.gx = spot.gx; item.gy = spot.gy;
  p.inventory.push(item);
  return true;
}
// Same, but for cases where losing the item would be worse than an ugly
// overlap (a chest reward, a shop purchase, gear bumped by an equip swap):
// falls back to placing it at the top-left corner, visually overlapping,
// rather than ever discarding gear the player already owns.
// v193: overflow drops are laid out on rings around the player, never on top of other loot
function lootOverflowSpot(g, p){
  let best = null, bestD = -1;
  for(let i=0;i<40;i++){
    const a = Math.random()*Math.PI*2, r = 34 + Math.floor(i/8)*16;
    const x = clamp(p.x+Math.cos(a)*r, 12, (g.room?g.room.w:1e9)-12), y = clamp(p.y+Math.sin(a)*r, 12, (g.room?g.room.h:1e9)-12);
    let md = 1e9; for(const l of g.loot){ if(l.type==='item'){ const d = Math.hypot(l.x-x, l.y-y); if(d<md) md = d; } }
    if(md>=30) return {x,y};
    if(md>bestD){ bestD = md; best = {x,y}; }
  }
  return best || {x:p.x, y:p.y};
}
function forceAddToBag(p, item){
  if(addToBag(p, item)) return true;
  if(isHealthPotion(item) && p.equipment){ if(dropPotionsAtFeet(p, 1)) showMsg('Belt is full -- the potion is at your feet', 1.6); return false; }
  // (v124) No free spot: defragment (biggest items first) and retry, so fragmentation never causes a
  // false "full". If it truly cannot fit, the item is dropped at the player's feet -- items never overlap.
  const all = p.inventory.concat([item]).sort((a,b)=>{ const sa=itemShape(a), sb=itemShape(b); return sb[0]*sb[1]-sa[0]*sa[1]; });
  const tmp = [];
  let ok = true;
  for(const it of all){
    const spot = findBagSpot(tmp, itemShape(it));
    if(!spot){ ok = false; break; }
    tmp.push({it, gx:spot.gx, gy:spot.gy});
    // findBagSpot reads gx/gy off the objects it is given, so give it lightweight stand-ins
    tmp[tmp.length-1].slotType = it.slotType; tmp[tmp.length-1].shape = itemShape(it); tmp[tmp.length-1].gx = spot.gx; tmp[tmp.length-1].gy = spot.gy;
  }
  if(ok){
    for(const t of tmp){ t.it.gx = t.gx; t.it.gy = t.gy; }
    if(p.inventory.indexOf(item)<0) p.inventory.push(item);
    return true;
  }
  if(typeof game!=='undefined' && game && game.player===p && game.loot){
    delete item.gx; delete item.gy;
    const sp = lootOverflowSpot(game, p);
    game.loot.push({type:'item', x:sp.x, y:sp.y, r:8, item, dropGrace:1.2, playerDropped:true});
    showMsg('Bag full \u2014 dropped '+item.name, 1.6);
    return false;
  }
  item.gx = 0; item.gy = 0;
  p.inventory.push(item);
  return false;
}
// v493: would these items fit if the bag were tidied (biggest first, like forceAddToBag)? Changes nothing.
function bagCanFit(p, items){
  const all = p.inventory.concat(items.filter(it=>it && !isHealthPotion(it))).sort((a,b)=>{ const sa=itemShape(a), sb=itemShape(b); return sb[0]*sb[1]-sa[0]*sa[1]; });
  const tmp = [];
  for(const it of all){
    const shape = itemShape(it), spot = findBagSpot(tmp, shape);
    if(!spot) return false;
    tmp.push({slotType:it.slotType, shape, gx:spot.gx, gy:spot.gy});
  }
  return true;
}
// v493: an NPC's quest reward only goes in when the whole reward fits; otherwise nothing is given and the NPC offers it again later
function giveRewardIfRoom(p, items){
  items = items.filter(Boolean);
  if(!bagCanFit(p, items)){ showMsg("You don't have the space for this reward. Make room and come back.", 3.2, '#ff9a7a'); return false; }
  for(const it of items) forceAddToBag(p, it);
  return true;
}
// Repairs any overlapping items (e.g. from older saves) by re-packing the whole bag.
function fixBagOverlaps(inv){
  let bad = false;
  for(let i=0;i<inv.length && !bad;i++){
    const a = inv[i]; if(a.gx==null) continue;
    const [aw,ah] = itemShape(a);
    for(let j=i+1;j<inv.length;j++){
      const b = inv[j]; if(b.gx==null) continue;
      const [bw,bh] = itemShape(b);
      if(a.gx < b.gx+bw && a.gx+aw > b.gx && a.gy < b.gy+bh && a.gy+ah > b.gy){ bad = true; break; }
    }
  }
  if(!bad) return false;
  const items = inv.slice().sort((a,b)=>{ const sa=itemShape(a), sb=itemShape(b); return sb[0]*sb[1]-sa[0]*sa[1]; });
  inv.length = 0;
  const holder = {inventory:inv};
  for(const it of items){ delete it.gx; delete it.gy; if(!addToBag(holder, it)){ it.gx=0; it.gy=0; inv.push(it); } }
  return true;
}
// Re-derives every item's grid position from scratch, in array order. Used
// once on load for saves from before the grid bag existed (items with no
// gx/gy yet), and safe to call any time as a general defragment.
function repackBag(p){
  const items = p.inventory.slice();
  p.inventory.length = 0;
  for(const it of items){
    delete it.gx; delete it.gy;
    forceAddToBag(p, it);
  }
}

// A two-handed weapon (Greatsword/Longsword/Demonblade -- item.twoHanded)
// or a Bow/Staff is conceptually held in BOTH hands, even though it's only
// ever stored in the mainhand slot -- offhand is left literally null for
// these. Anything that needs to know whether the off-hand is "really"
// free (a Shield trying to auto-equip, most notably -- see the v66 bugfix
// in tryAutoEquip below) must check this instead of just
// `!p.equipment.offhand`.
function occupiesOffhand(mainhandItem){
  return !!(mainhandItem && (mainhandItem.twoHanded || mainhandItem.slotType==='bow' || mainhandItem.slotType==='staff'));
}

function equipItem(p, item){
  const ok = equipItemRaw(p, item);
  if(ok && item && item.slotType==='staff' && p && p.cls==='mystic' && p.skillSlots){   // v484: a new staff's spell goes straight onto the Strike button
    const sid = Object.keys(STAFF_SKILL_SPELL).find(k=>STAFF_SKILL_SPELL[k]===(item.spell||'fire'));
    const cur = p.skillSlots.main;
    // v489: only fills an empty Strike button (plain Strike), or one holding a staff spell you can no longer cast
    const curDead = !!(cur && STAFF_SKILL_SPELL[cur] && !(p.skills && p.skills[cur]>0) && !(typeof staffBonusFor==='function' && staffBonusFor(p, cur)>0));
    if(sid && sid!==cur && (cur==='strike' || !cur || curDead) && (typeof staffBonusFor!=='function' || staffBonusFor(p, sid)>0 || (p.skills&&p.skills[sid]>0))){
      for(const k of ['slot1','slot2','slot3']) if(p.skillSlots[k]===sid) p.skillSlots[k] = null;
      p.skillSlots.main = sid;
      try{ if(game && game.started && p===game.player){ updateSkillSlotButtonsUI(); showMsg('Strike button: '+((typeof skillNodeName==='function' && skillNodeName(sid)) || sid.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase())), 1.6); } }catch(e){}
    }
  }
  if(ok && item){ try{ sfxPlay(/^(weapon1h|weapon2h|bow|staff)$/.test(item.slotType) ? 'equipWeapon' : /^(ring|amulet)$/.test(item.slotType) ? 'equipJewel' : /^(armor|helm|shield|gloves|boots)$/.test(item.slotType) ? 'equipArmor' : 'equip', 1); }catch(e){} }   // v448
  return ok;
}
function equipItemRaw(p, item){
  const hasWeaponsSpec = !!(p.skills && effectiveRank(p,'weaponsSpecialist')>0);
  // Staves are Mystic-only -- their spellcasting (and dedicated wooden-staff
  // sprite) only makes sense on that class; other classes just get the
  // usual melee weapon rig with no way to cast, so equipping one is blocked.
  // Bows are Ranger-only, and the two-handed sword line (Longsword/
  // Greatsword/Demonblade, slotType weapon2h) is Warrior-only -- these are
  // the 3 strictly single-class weapon types (v66). All 3 share the same
  // generic "I cannot use this" toast (reusing the existing yellow
  // showMsg() toast, same one used for e.g. "Healed!" at the well) rather
  // than a bespoke sentence each.
  if(item.slotType==='staff' && p.cls!=='mystic'){
    showMsg('I cannot use this', 1.3);
    return false;
  }
  if(item.slotType==='bow' && p.cls!=='ranger'){
    showMsg('I cannot use this', 1.3);
    return false;
  }
  if(item.slotType==='weapon2h' && p.cls!=='warrior'){
    showMsg('I cannot use this', 1.3);
    return false;
  }
  // Greatswords are further locked behind the Weapons Specialist skill --
  // until then a Warrior is a single sword-and-shield fighter. This is a
  // separate, more specific reason than plain class ineligibility above,
  // so it keeps its own descriptive message.
  if(item.slotType==='weapon2h' && !hasWeaponsSpec){
    showMsg('Requires Weapon Specialization', 1.3);
    return false;
  }
  // Weight-class armor ACCESS matrix (v66, replaces the old strict 1:1
  // MATERIAL_FOR_CLASS lock): Mystic can only wear Robe; Ranger can wear
  // Robe or Leather; Warrior can wear any of Robe/Leather/Plate. Items
  // generated before this update have no .material and are grandfathered
  // in (no check applied to them).
  if((item.slotType==='helm' || item.slotType==='armor' || item.slotType==='gloves' || item.slotType==='boots') && item.material){
    if(!canEquipArmorMaterial(p.cls, item.material)){
      showMsg('I cannot use this', 1.3);
      return false;
    }
  }
  // Tiered gear (Field Plate/Full Plate, Scalehide/Demonhide, Adept/Arcanist robes,
  // Hunter/Recurve Bow, etc) requires a matching character level -- items
  // generated before this update have no .levelReq (undefined) and are
  // grandfathered in (no check applied to them).
  if(item.levelReq && item.levelReq>1 && p.level < item.levelReq){
    showMsg('Requires Level '+item.levelReq, 1.4);
    return false;
  }

  let targetSlot;
  if(item.slotType==='ring'){
    targetSlot = !p.equipment.ring1 ? 'ring1' : (!p.equipment.ring2 ? 'ring2' : 'ring1');
  } else if(item.slotType==='weapon1h'){
    if(!p.equipment.mainhand){
      targetSlot = 'mainhand';
    } else if(hasWeaponsSpec && p.equipment.mainhand.slotType==='weapon1h' &&
               (!p.equipment.offhand || p.equipment.offhand.slotType==='shield')){
      // Weapons Specialist: dual-wield a second sword in the off-hand,
      // bumping any shield there back to the bag.
      if(p.equipment.offhand) forceAddToBag(p, p.equipment.offhand);
      p.equipment.offhand = null;
      targetSlot = 'offhand';
    } else {
      targetSlot = 'mainhand';
    }
  } else if(item.slotType==='weapon2h' || item.slotType==='bow' || item.slotType==='staff'){
    targetSlot = 'mainhand';
  } else if(item.slotType==='shield'){
    targetSlot = 'offhand';
  } else {
    targetSlot = item.slotType;
  }

  // a greatsword or bow needs both hands: bump whatever's in the off-hand back to the bag
  if((item.slotType==='weapon2h' || item.slotType==='bow' || item.slotType==='staff') && p.equipment.offhand){
    forceAddToBag(p, p.equipment.offhand);
    p.equipment.offhand = null;
  }
  // a shield needs a free off-hand: bump a two-handed weapon or bow back to the bag.
  // This is a DELIBERATE manual equip (the player dragged/tapped to equip
  // this shield), so unlike tryAutoEquip below, it's allowed to swap the
  // 2h weapon out rather than silently refusing -- consistent with every
  // other "equip this, bump whatever was there" case in this function.
  if(item.slotType==='shield' && p.equipment.mainhand && occupiesOffhand(p.equipment.mainhand)){
    forceAddToBag(p, p.equipment.mainhand);
    p.equipment.mainhand = null;
  }

  const old = p.equipment[targetSlot];
  p.equipment[targetSlot] = item;
  const idx = p.inventory.indexOf(item);
  if(idx>=0) p.inventory.splice(idx,1);
  if(old) forceAddToBag(p, old);
  recalcStats(p);
  return true;
}

function unequipSlot(p, slot){
  const it = p.equipment[slot];
  if(!it) return;
  p.equipment[slot] = null;
  forceAddToBag(p, it);
  recalcStats(p);
}

// Auto-equip on find/buy: called right after an item lands in the bag from
// loot pickup, a chest, or a shop purchase. Only fills a slot that's
// currently EMPTY -- never swaps out gear that's already worn, even if the
// new item is strictly better (that comparison is left to the player).
// Re-checks the exact same class/material/weapon-spec restrictions
// equipItem() enforces, silently declining (no showMsg) rather than
// surfacing a "can't wear this" message during ordinary pickup/purchase.
// Returns true if it equipped the item, false if it left it in the bag.
function tryAutoEquip(p, item){
  if(!item || !item.slotType) return false;
  const hasWeaponsSpec = !!(p.skills && effectiveRank(p,'weaponsSpecialist')>0);
  if(item.slotType==='weapon2h' && (p.cls!=='warrior' || !hasWeaponsSpec)) return false;
  if(item.slotType==='staff' && p.cls!=='mystic') return false;
  if(item.slotType==='bow' && p.cls!=='ranger') return false;
  if((item.slotType==='helm' || item.slotType==='armor' || item.slotType==='gloves' || item.slotType==='boots') && item.material){
    if(!canEquipArmorMaterial(p.cls, item.material)) return false;
  }
  if(item.levelReq && item.levelReq>1 && p.level < item.levelReq) return false;
  let targetSlot = null;
  if(item.slotType==='ring'){
    targetSlot = !p.equipment.ring1 ? 'ring1' : (!p.equipment.ring2 ? 'ring2' : null);
  } else if(item.slotType==='weapon1h'){
    if(!p.equipment.mainhand) targetSlot = 'mainhand';
    else if(hasWeaponsSpec && p.equipment.mainhand.slotType==='weapon1h' && !p.equipment.offhand) targetSlot = 'offhand';
  } else if(item.slotType==='weapon2h' || item.slotType==='bow' || item.slotType==='staff'){
    // needs both hands free -- if the off-hand is occupied this would have
    // to bump something, which isn't "an empty slot" anymore, so skip it.
    if(!p.equipment.mainhand && !p.equipment.offhand) targetSlot = 'mainhand';
  } else if(item.slotType==='shield'){
    // v66 bugfix: a Bow/Staff/2h-sword equipped in the mainhand occupies
    // the off-hand too, conceptually (see occupiesOffhand()), even though
    // p.equipment.offhand is left null for them. Auto-equip must NOT treat
    // that null as "the off-hand is empty" -- doing so used to silently
    // equip a picked-up Shield right into "offhand" alongside the 2h
    // weapon, which then made equipItem()'s own bump-the-2h-weapon-out
    // logic fire and rip the 2h weapon back into the bag as an unwanted
    // side effect of ordinary loot pickup. Auto-equip should only ever
    // fill a GENUINELY empty off-hand (nothing in mainhand, or a 1-handed
    // weapon in mainhand) -- never bump anything, that's for a deliberate
    // manual equip (see equipItem's own shield-vs-2h-weapon bump above).
    if(!p.equipment.offhand && !occupiesOffhand(p.equipment.mainhand)) targetSlot = 'offhand';
  } else if(EQUIP_SLOTS.indexOf(item.slotType)>=0){
    targetSlot = item.slotType;
  }   // v453: quest items, parts and potions are never 'equipped' (a Molten Shell Fragment used to vanish into a fake slot)
  if(!targetSlot || p.equipment[targetSlot]) return false;
  equipItem(p, item);
  return true;
}

const BASE_ATK_CD = 0.657;   // v454: 6% slower than v401's 0.62.   // v401: was 0.46. D2 reference: Amazon bow 13 frames (0.52s), Barbarian 1h sword 15 frames (0.60s), both locked in place for the whole swing. Gear Attack Speed (cap 40%) brings it back down.

// Each "+N to <Spell>" point on an equipped staff adds this much flat
// damage to the Mystic's basic attack -- a Rare staff's +2 hits noticeably
// harder, "like a higher level attack tied to the staff" per design.
const SPELL_POWER_DMG_PER_POINT = 14;
function recalcStats(p){
  // v82: the rollable "Range"/"Reach" affix (key:'range') has been REMOVED
  // -- there is no longer an `af.key==='range'` branch here, so even an
  // OLD save's item that still has a stored 'range' affix (from before
  // this update) contributes nothing; its stored value/label just sits
  // there inert, still visible in that item's tooltip (tooltips render
  // generically off whatever's stored) but mechanically dead. No new item
  // can roll it (removed from AFFIX_POOL -- see there for the full note).
  // `addWeaponReach` below is now ONLY the innate two-handed-weapon reach
  // bonus a couple lines down (+14) -- an unrelated base combat mechanic,
  // not itemization, so it's kept and just renamed off the old
  // old `addRange`/`p.rangeBonus` names to make that separation explicit.
  let addHp=0, addMp=0, addSpeed=0, addDmg=0, addWeaponReach=0, addCrit=0, addArmor=0, addDexterity=0;
  // v83: accumulators for the new full affix pool (equipment batch 2/3) --
  // see EQUIP_AFFIXES for the per-category prefix/suffix lists that roll
  // these keys, and the block right after this aggregation loop for how
  // each one gets folded into an actual player stat.
  let addFireDmg=0, addColdDmg=0, addLightningDmg=0, addPoisonDmg=0;
  let addAtkSpeedPct=0, addLifeLeechPct=0, addBleedChancePct=0;
  let addMagicFindPct=0, addGoldFindPct=0, addArmorPenPct=0, addThornDamage=0;
  let addDmgReductionPct=0, addBlockChancePct=0, addDefensePct=0;
  let addFireResistPct=0, addColdResistPct=0, addLightningResistPct=0, addPoisonResistPct=0, addAllResistPct=0;
  let addLightRad=0, addSkillDur=0, addStatusDur=0, addDmgVsElite=0, addPotionStr=0, addLifeOnKill=0, addManaOnKill=0, addCritDmg=0, addFollowerDmgPct=0, addLifeRegenPct=0, addMoveSpeedPct=0, addDefenceFlat=0;
  let addGlobalCdrPct=0, addProjectileSpeedPct=0, addAoeRadiusPct=0, addDmgPct=0;
  let wMin = 0, wMax = 0, addPhysPct=0, addElemPct=0, addFirePct=0, addColdPct=0, addLightPct=0, addPoisPct=0;   // v457
  let addSlowImmune=false, addFreezeImmune=false;
  // "+N to skills" aggregation (see effectiveRank near treesForClass) --
  // starts every tree at 0; skillTree/skillGroup/allSkills affixes below
  // add into one, several, or (Masterful) every tree at once.
  const skillBonusByTree = {};
  const ALL_TREE_KEYS = ['defender','berserker','templar','survivalist','marksman','hunter','djinn','elementalist','necromancer'];
  ALL_TREE_KEYS.forEach(k=>{ skillBonusByTree[k]=0; });
  const eq = p.equipment || {};
  for(const slot of EQUIP_SLOTS){
    const it = eq[slot];
    if(!it) continue;
    migrateItemAffixes(it); // (v105) retired evasion/defence keys -> dexterity/armor
    const isWpnSlot = (slot==='mainhand'||slot==='offhand') && !!FLAT_ELEM_WEAPON[it.slotType];
    for(const af of it.affixes){
      if(af.key==='wpnDmg'){ if(slot==='mainhand'){ wMin = af.min; wMax = af.max; } }
      else if(af.key==='physDmgPct') addPhysPct+=af.value;
      else if(af.key==='elemDmgPct') addElemPct+=af.value;
      else if(af.key==='fireDmgPct') addFirePct+=af.value;
      else if(af.key==='coldDmgPct') addColdPct+=af.value;
      else if(af.key==='lightningDmgPct') addLightPct+=af.value;
      else if(af.key==='poisonDmgPct') addPoisPct+=af.value;
      else if((af.key==='dmg' || /^(fire|cold|lightning|poison)Dmg$/.test(af.key)) && !isWpnSlot){}   // v457: flat damage only counts from swords and bows
      else if(af.key==='hp') addHp+=af.value;
      else if(af.key==='dmg') addDmg+=af.value;
      else if(af.key==='speed') addSpeed+=af.value;
      else if(af.key==='armor') addArmor+=af.value;
      else if(af.key==='mp') addMp+=af.value;
      else if(af.key==='crit' || af.key==='critChance') addCrit+=af.value;
      else if(af.key==='dexterity') addDexterity+=af.value;
      else if(af.key==='spellPower'){}   // v457: the staff's +rank only; its damage now comes from the staff's own range
      else if(af.key==='fireDmg') addFireDmg+=af.value;
      else if(af.key==='coldDmg') addColdDmg+=af.value;
      else if(af.key==='lightningDmg') addLightningDmg+=af.value;
      else if(af.key==='poisonDmg') addPoisonDmg+=af.value;
      else if(af.key==='atkSpeedPct') addAtkSpeedPct+=af.value;
      else if(af.key==='lifeLeechPct') addLifeLeechPct+=af.value;
      else if(af.key==='bleedChancePct') addBleedChancePct+=af.value;
      else if(af.key==='magicFindPct') addMagicFindPct+=af.value;
      else if(af.key==='goldFindPct') addGoldFindPct+=af.value;
      else if(af.key==='armorPenPct') addArmorPenPct+=af.value;
      else if(af.key==='thornDamage') addThornDamage+=af.value;
      else if(af.key==='dmgReductionPct') addDmgReductionPct+=af.value;
      else if(af.key==='defensePct') addDefensePct+=af.value;
      else if(af.key==='blockChancePct') addBlockChancePct+=af.value;
      else if(af.key==='fireResistPct') addFireResistPct+=af.value;
      else if(af.key==='coldResistPct') addColdResistPct+=af.value;
      else if(af.key==='lightningResistPct') addLightningResistPct+=af.value;
      else if(af.key==='poisonResistPct') addPoisonResistPct+=af.value;
      else if(af.key==='allResistPct') addAllResistPct+=af.value;
      else if(af.key==='followerDmgPct') addFollowerDmgPct+=af.value;
      else if(af.key==='statusDurPct') addStatusDur+=af.value;
      else if(af.key==='skillDurPct') addSkillDur+=af.value;
      else if(af.key==='lightRadiusPct') addLightRad+=af.value;
      else if(af.key==='dmgVsElitePct') addDmgVsElite+=af.value;
      else if(af.key==='potionStrengthPct') addPotionStr+=af.value;
      else if(af.key==='lifeOnKill') addLifeOnKill+=af.value;
      else if(af.key==='manaOnKill') addManaOnKill+=af.value;
      else if(af.key==='critDmgPct') addCritDmg+=af.value;
      else if(af.key==='lifeRegenPct') addLifeRegenPct+=af.value;
      else if(af.key==='moveSpeedPct') addMoveSpeedPct+=af.value;
      else if(af.key==='defenceFlat') addDefenceFlat+=af.value;
      else if(af.key==='globalCdrPct') addGlobalCdrPct+=af.value;
      else if(af.key==='projectileSpeedPct') addProjectileSpeedPct+=af.value;
      else if(af.key==='aoeRadiusPct') addAoeRadiusPct+=af.value;
      else if(af.key==='dmgPct') addElemPct+=af.value;   // legacy
      else if(af.key==='slowImmune') addSlowImmune=true;
      else if(af.key==='freezeImmune') addFreezeImmune=true;
      if(af.skillTree){ skillBonusByTree[af.skillTree] = (skillBonusByTree[af.skillTree]||0) + af.value; }
      else if(af.skillGroup){ af.skillGroup.forEach(tk=>{ skillBonusByTree[tk] = (skillBonusByTree[tk]||0) + af.value; }); }
      else if(af.allSkills){ ALL_TREE_KEYS.forEach(tk=>{ skillBonusByTree[tk] = (skillBonusByTree[tk]||0) + af.value; }); }
    }
  }
  // (v119) Gear skill bonus is capped at +1 per tree no matter how many
  // "+1 skills" items are worn (raise SKILL_BONUS_GEAR_CAP to loosen).
  const capped = [];
  // v438: no cap on gear +skills any more -- they are simply rare. Skill formulas keep scaling up to MAX_EFF_RANK.
  p.skillBonusByTree = skillBonusByTree;
  // a greatsword swings slower but reaches further than a one-handed weapon;
  // dual-wielding (Weapons Specialist) speeds attacks up instead, scaling with rank.
  // The two effects are independent -- only one can apply, since you can't have
  // both a greatsword and a second sword equipped at once.
  const mh = eq.mainhand, offhWpn = eq.offhand;
  const dualWield = !!(mh && mh.slotType==='weapon1h' && offhWpn && offhWpn.slotType==='weapon1h');
  const wpnSpecRank = (p.skills && effectiveRank(p,'weaponsSpecialist')) || 0;
  let atkSpeedMod = 1.0;
  if(mh && mh.twoHanded){
    atkSpeedMod = 1.10;   // v401: staff casting (was 1.32 on the faster 0.46 base)
    if(((p.skills && effectiveRank(p,'cleave'))||0)>0) atkSpeedMod *= CLEAVE_ATKSPD_PENALTY;
    addWeaponReach += 14;
  } else if(dualWield && wpnSpecRank>0){
    atkSpeedMod *= (1 - wpnSpecRank*DUAL_WIELD_ATKSPD_PER_RANK);
    // Fury (Berserker, v55): extra attack-speed bonus on top of the plain
    // dual-wield bonus above, only while Fury's own precondition (both
    // hands holding a one-handed sword) is met.
    const furyRank = (p.skills && effectiveRank(p,'fury')) || 0;
    if(furyRank>0) atkSpeedMod *= (1 - furyRank*FURY_ATKSPD_PER_RANK);
  }
  // Defensive Stance (Defender): small attack-speed cost while a shield is
  // actually equipped and the passive is ranked -- the balance cost for its
  // damage-reduction/block-efficiency bonus.
  // A shield equipped grants a flat attack-speed bonus on its own (in place
  // of the block chance it used to passively grant with no Shield Bash rank).
  if(hasShieldEquipped(p)) atkSpeedMod *= (1 - SHIELD_ATKSPD_BONUS_PCT);
  // Multi Shot (Marksman): bow attack speed +4%/rank, up to +20% at Rank5.
  // v83: item-derived Attack Speed % (Cunning prefix/suffix, several
  // categories) -- folded in as one more multiplicative discount on the
  // attack cooldown, same shape every other atkSpeedMod source above uses.
  { const _asp = addAtkSpeedPct + (partBonuses(p).atkspd||0); if(_asp>0) atkSpeedMod *= (1 - clamp(_asp,0,40)/100); }
  const pb = partBonuses(p); p.partB = pb;
  let newMaxHp = 100 + p.level * (p.cls==='warrior' ? WARRIOR_HP_PER_LEVEL : HP_PER_LEVEL) + addHp;
  if(p.cls==='warrior') newMaxHp = Math.round(newMaxHp*WARRIOR_HP_MULT);
  if(pb.hp) newMaxHp = Math.round(newMaxHp*(1+pb.hp/100));
  { const si=(p.skills && effectiveRank(p,'survivalInstinct'))||0; if(si>0) newMaxHp = Math.round(newMaxHp*(1+INSTINCT_HP_PER_RANK*si)); }
  if(((p.skills && effectiveRank(p,'ironSkin'))||0) >= BASE_MAX_RANK) newMaxHp = Math.round(newMaxHp*(1+IRON_SKIN_RANK5_LIFE));
  if(p.coffeeT>0) newMaxHp = Math.max(1, Math.round(newMaxHp*COFFEE_HP_MULT));
  const newMaxMp = Math.round((p.cls==='warrior' ? RAGE_MAX + addMp : p.cls==='ranger' ? STAMINA_BASE + (p.level-1)*STAMINA_PER_LEVEL + addMp : BASE_MAXMP + (p.level-1)*MP_PER_LEVEL + addMp) * (1 + (pb.mana||0)/100));
  const hpDiff = newMaxHp - (p.maxHp==null ? newMaxHp : p.maxHp);
  p.maxHp = newMaxHp;
  p.hp = (p.hp==null) ? newMaxHp : clamp(p.hp + Math.max(0,hpDiff), 0, p.maxHp);
  const mpDiff = newMaxMp - (p.maxMp==null ? newMaxMp : p.maxMp);
  p.maxMpFull = newMaxMp;
  const iaRes = iceArmorOn(p) ? Math.round(newMaxMp*ICE_ARMOR_RESERVE) : 0;   // v454: only while Ice Armor is on a skill button   // v442: Ice Armor reserves 25% of mana
  p.mpReserved = iaRes;
  p.maxMp = newMaxMp - iaRes;
  p.mp = (p.mp==null) ? p.maxMp : clamp(p.mp + Math.max(0,mpDiff), 0, p.maxMp);
  // v83 Powerful (staff prefix, +damage%): there's no single centralized
  // "final damage" function this codebase routes every hit through (each
  // attack/skill computes its own `dmg` inline off p.dmgBonus), so rather
  // than touch dozens of call sites, +damage% is approximated ONCE here as
  // an equivalent flat addition to dmgBonus, scaled off the equipped
  // weapon's own innate base-damage roll (its 'dmg' or 'spellPower->dmg'
  // affix) -- e.g. +20% on a 30-base-damage staff adds +6 flat dmgBonus.
  // Documented judgment call: this is an approximation (a true %
  // multiplier would also scale skill-mult'd hits proportionally more),
  // chosen because it's auditable, needs no new plumbing, and Powerful
  // only exists on staves, which all share one 'dmg'-or-'spellPower'
  // innate affix to scale from.
  // v457: weapon damage range (bare hands if nothing is held) + matching percentage bonuses
  if(!(wMax>0)){ const L = p.level||1; wMin = Math.round(4 + 1.0*L); wMax = Math.round(8 + 1.6*L); }
  p.wpnMin = wMin; p.wpnMax = wMax;
  p.physDmgPct = addPhysPct + pb.physpct; p.elemDmgPct = addElemPct + pb.elempct;
  p.fireDmgPct = addFirePct + pb.firepct; p.coldDmgPct = addColdPct + pb.coldpct; p.lightningDmgPct = addLightPct + pb.lightpct; p.poisonDmgPct = addPoisPct + pb.poisonpct;
  // v83 elemental flat damage (Flaming/Chilling/Lightning/Poisoning
  // prefixes, staff Fire/Ice/Lightning/Poison suffixes): this game has no
  // per-hit elemental damage TYPE system on the monster side yet (no
  // resistance-by-type on any enemy) -- rather than build that whole new
  // combat-typing layer as part of an item-pool batch, elemental damage
  // affixes fold straight into the same flat p.dmgBonus every other +Damage
  // source already uses (documented judgment call; p.fireDmg/coldDmg/
  // lightningDmg/poisonDmg are still tracked individually below purely for
  // tooltip/summary display and future use).
  // v437: elemental gear damage is no longer folded into dmgBonus -- it is dealt as its own typed hit (see gearElemHit)
  p.fireDmg = addFireDmg; p.coldDmg = addColdDmg; p.lightningDmg = addLightningDmg; p.poisonDmg = addPoisonDmg;
  // v83 Quick (boots prefix, +Move Speed): capped at 30% of BASE_SPEED
  // total from items, per spec ("30% max").
  // (v106) ALL gear-based move speed (Quick % plus any legacy flat 'speed'
  // affix) shares one hard cap of +30% of BASE_SPEED.
  const gearSpeed = clamp(addSpeed + BASE_SPEED*(addMoveSpeedPct/100), 0, BASE_SPEED*(MOVE_SPEED_GEAR_CAP_PCT/100));
  p.speed = (BASE_SPEED + gearSpeed) * (1 + pb.speed/100) * (1 + INSTINCT_SPEED_PER_RANK*((p.skills && effectiveRank(p,'survivalInstinct'))||0));
  p.gearSpeedPct = gearSpeed/BASE_SPEED*100;
  if(p.beerT>0) addDmg += BEER_DMG_BONUS;
  if(p.coffeeT>0) p.speed *= COFFEE_MOVE_MULT;
  p.dmgBonus = addDmg;   // flat Physical damage to weapon attacks (+ Ale)
  p.wpnFlat = p.cls==='mystic' ? (p.beerT>0 ? BEER_DMG_BONUS : 0) : addDmg;   // spells never take flat weapon damage
  p.weaponReachBonus = addWeaponReach;
  if(p.skillSlots) for(const k of Object.keys(p.skillSlots)) if(p.skillSlots[k]==='storm') p.skillSlots[k] = null;   // Storm is passive now
  const stormRk = (p.skills && effectiveRank(p,'storm')) || 0;
  p.critChance = Math.min(75, clamp(addCrit, 0, 75) + pb.crit + (p.battlecryT>0 ? (p.battlecryCritBonus||0) : 0) + (p.bannerCritNow||0) + stormRk*STORM_CRIT_PER_RANK);
  p.critMultBonus = stormRk*STORM_CRITMULT_PER_RANK + clamp(addCritDmg,0,100)/100;
  if(p.skills && p.souls>0 && !['soulSap','soulHunger'].some(id=>(p.skills[id]||0)>0)) p.souls = 0;   // v441: no soul-gathering skill = no stored souls (clears leftovers after a respec)
  // v83 Sturdy (belt prefix / ring-amulet suffix, +Defence): a separate
  // named stat from Warding's own flat +Armor, but this codebase's only
  // incoming-damage mitigation stat is the single flat p.armor subtraction
  // in playerDamage -- rather than invent and thread a second, parallel
  // "Defence" mitigation formula through combat for one stat, Defence is
  // folded additively into the same p.armor total (documented judgment
  // call: mechanically identical to Armor, just a differently-named source
  // for flavor/tooltip purposes -- p.defenceFlat below still records the
  // raw item total separately for anything that wants to display it apart
  // from Warding's contribution).
  p.defenceFlat = addDefenceFlat;
  p.defense = (addArmor + addDefenceFlat + addDexterity*DEF_PER_DEX + (p.cls==='warrior' ? (WARRIOR_BASE_ARMOR + WARRIOR_ARMOR_PER_LEVEL*p.level)*DEF_SCALE : 0)) * (1 + addDefensePct/100) * (1 + ironSkinDefensePct(p)) * (p.beerT>0 ? BEER_ARMOR_MULT : 1) * (1 + pb.def/100) * (1 + (p.bannerDefNow||0)/100) * (p.hurricaneT>0 ? 1 + hurricaneDefPct((p.skills && effectiveRank(p,'hurricane'))||1) : 1);   // v489 Hurricane
  p.armor = p.defense/DEF_SCALE;   // old-scale value, still used by skills that add armor to their damage
  // v83 Studded (+Thorns): flat damage reflected onto an attacker whenever
  // the player is actually hit (not blocked/dodged) -- see playerDamage.
  p.thornDamage = addThornDamage + ((pb.sp && pb.sp.thorns) ? Math.round(6 + p.level*2) : 0); p.thornPct = pb.thorns||0;   // v465: Brimstone Ash reflects a % of each hit
  // v83 Sturdy (shield prefix, +Damage Reduction %) / Grand (+Block Chance
  // %): folded into playerDamage's takenMult and blockChance() respectively.
  p.itemDmgReductionPct = clamp(addDmgReductionPct + pb.dmgred, 0, 25)/100;   // v438: gear DR cap 25% (rolls are small), total cap 50%
  p.itemBlockChancePct = clamp(addBlockChancePct + pb.block, 0, 30)/100;
  // v83 resistances -- tracked per-element for tooltip/future use, but (see
  // the elemental-damage note above) no monster attack in this game is
  // currently TYPED by element, so only the aggregate "Elemental
  // Attunement" (allResistPct) has an actual mechanical effect right now:
  // it folds into playerDamage's takenMult as a generic incoming-damage
  // reduction, the same slot every other %-damage-reduction source already
  // uses. Per-element resists remain inert until a future batch gives
  // monster attacks their own element tags to check against them.
  // (v123) per-element resists are capped at MAX_RESIST_PCT (75)
  if(p.purpleDrunk){ addFireResistPct+=20; addColdResistPct+=20; addLightningResistPct+=20; addPoisonResistPct+=20; } // v166 witch's purple potion
  { const isr = ironSkinResistPct(p); addFireResistPct+=isr; addColdResistPct+=isr; addLightningResistPct+=isr; addPoisonResistPct+=isr; }   // v206 Iron Skin
  addColdResistPct+=pb.coldres; addFireResistPct+=pb.fireres; addPoisonResistPct+=pb.poisres; addLightningResistPct+=pb.lightres;   // v356 part resists
  const capRes = maxResistPct(p); p.maxResistPct = capRes;
  // uncapped totals are kept for the stat screen's "(122%)" readout
  p.fireResistRaw = addFireResistPct; p.coldResistRaw = addColdResistPct; p.lightningResistRaw = addLightningResistPct; p.poisonResistRaw = addPoisonResistPct;
  p.fireResistPct = clamp(addFireResistPct, 0, capRes); p.coldResistPct = clamp(addColdResistPct, 0, capRes);
  p.lightningResistPct = clamp(addLightningResistPct, 0, capRes); p.poisonResistPct = clamp(addPoisonResistPct, 0, capRes);
  p.allResistPct = clamp(addAllResistPct + pb.allres, 0, 75)/100;
  p.curseHeld = runesHeld(p)*0.15; p.curseHold = ['shield','sword','cross'].filter(r=>(p.runesPlaced||{})[r]).length*0.15;   // v441: Bearer's Curse while carried, permanent Demon Hold Curse once set in the altars
  p.bearerCurse = p.curseHeld + p.curseHold;
  // v83 Vampire (+Life Leech %) / Bloodletting (+Bleed Chance %) / Crushing
  // (+Armor Pen %): all 3 hook into applyEnemyArmor, the single shared
  // chokepoint essentially every player-dealt hit already routes through
  // (Strike, every active skill, DoT ticks -- see its own doc comment).
  p.lifeLeechPct = clamp(addLifeLeechPct, 0, 30) + pb.leech;
  p.bleedChancePct = clamp(addBleedChancePct, 0, 60) + (pb.bleedch||0);
  p.itemArmorPenPct = clamp(addArmorPenPct, 0, 40)/100 + pb.pen/100;
  // v83 Luck/Lucky (+Magic Find %) and Riches/Rich (+Gold Find %): hook
  // into pickRarity (via generateItem's optional player arg) and dropLoot's
  // gold amounts respectively.
  p.magicFindPct = clamp(addMagicFindPct + pb.mf + (p.wellRestedT>0 ? 5 : 0), 0, 100);   // v399: Well Rested +5% Magic Find
  p.goldFindPct = clamp(addGoldFindPct + pb.gold, 0, 100);
  // v83 Commanding (+Follower Damage %): hooks into followerDmg().
  p.followerDmgPct = (clamp(addFollowerDmgPct, 0, 60) + pb.minion)/100;
  p.statusDurPct = (clamp(addStatusDur, 0, 75) + pb.ailment)/100; p.skillDurPct = clamp(addSkillDur, 0, 50)/100; p.lightRadiusPct = clamp(addLightRad, 0, 60)/100;   // v489 / v492
  p.dmgVsElitePct = (clamp(addDmgVsElite, 0, 5) + pb.elite)/100; p.potionStrPct = (clamp(addPotionStr, 0, 75) + pb.potion)/100;   // v490: was hidden behind the comment above
  p.lifeOnKill = addLifeOnKill; p.manaOnKill = addManaOnKill; p.lifeOnKillPct = pb.lok||0; p.manaOnKillPct = pb.mok||0;   // v465: parts give % of max
  p.critDmgPct = clamp(addCritDmg, 0, 100) + pb.critdmg;   // v490: was hidden behind the comment above
  // v83 Holy/Regeneration (+Life Regen %, of max HP per second): ticked in
  // the main player-update loop (see the v83 hook there).
  p.lifeRegenPct = clamp(addLifeRegenPct + pb.regen + (p.wellRestedT>0 ? WELL_RESTED_REGEN : 0) + (p.cls==='warrior' ? WARRIOR_BASE_REGEN : 0), 0, 4)/100;   // v479: Warriors have a small base regen   // v399: Well Rested life regen
  // v83 Attuned (+Global Cooldown Reduction %, staff): read by applyCdr(),
  // wrapped around every active-skill cooldown assignment in the file.
  p.cdrPct = clamp(addGlobalCdrPct + pb.cdr, 0, 30)/100;
  // v83 Deadly (+Projectile Speed %) / Concentrated (+Area of Effect %,
  // staff): read by aoeRadiusMult()/projectileSpeedMult() below, applied at
  // Nova/Hurricane/Fire Bomb/Blizzard's radius checks and staff-bolt/arrow
  // projectile creation respectively.
  p.aoeRadiusPct = clamp(addAoeRadiusPct + pb.aoe, 0, AOE_AFFIX_CAP_PCT);
  p.projectileSpeedPct = clamp(addProjectileSpeedPct, 0, 40) + pb.proj;
  // v83 Slippery (cannot be slowed) / Melting (cannot be frozen): simple
  // binary immunity flags. Slippery gates the player's one existing slow
  // effect (spider-web webSlowT). No player-side FREEZE mechanic currently
  // exists in this game at all (only enemies get frozen, via e.frozenT) --
  // freezeImmune is stored and ready for whenever a future batch adds one,
  // but has nothing to actually immunize against yet; documented here
  // rather than silently doing nothing with no explanation.
  p.slowImmune = addSlowImmune;
  p.freezeImmune = addFreezeImmune;
  // Evasion is a % chance to fully avoid an incoming hit (see playerDamage);
  // capped so a heavily-geared Ranger can't approach total invincibility.
  // v83 Agility (+Dodge Chance %) stacks additively into this SAME
  // aggregate -- it's just another source of the identical "fully avoid
  // the hit" roll gear-based Evasion already grants, per spec ("+dodge%").
  // (v105) gear Evasion % is gone -- gear rolls Dexterity, and every 10
  // Dexterity on gear = +1% Evasion (dodge).
  p.dexterity = addDexterity;
  p.evasion = Math.min(60, dexEvasionPct(addDexterity, (typeof game!=='undefined' && game) ? monsterLevel(game) : p.level) + pb.eva); p.evaPb = pb.eva||0;
  if(p.coffeeT>0) atkSpeedMod *= COFFEE_ATKSPD_MULT;
  p.atkCdMax = BASE_ATK_CD * atkSpeedMod;
  p.atkSpeedTotalPct = (1/Math.max(0.05,atkSpeedMod) - 1)*100; p.atkSpeedGearPct = clamp(addAtkSpeedPct + (partBonuses(p).atkspd||0), 0, 40);
}
// v83: wraps a computed cooldown-seconds value with the player's item-based
// Global Cooldown Reduction (Attuned, staff prefix) -- e.g. applyCdr(p, 10)
// with 20% CDR returns 8. Called at every active-skill cooldown assignment
// in the file (search for its call sites) so "global" really does mean
// every active skill, not just the basic Strike attack (which already gets
// its own attack-speed handling in recalcStats above, unaffected by this).
function applyCdr(p, cdSeconds){ return cdSeconds * (1 - ((p&&p.cdrPct)||0)); }
// v83: Concentrated (staff prefix, +Area of Effect %) -- multiplies an AoE
// skill's radius. Applied at Nova/Hurricane/Fire Bomb/Blizzard's radius
// checks (the 4 AoE skills the spec explicitly named).
function aoeRadiusMult(p){ return 1 + clamp((p&&p.aoeRadiusPct)||0, 0, AOE_AFFIX_CAP_PCT)/100; }
// v83: Deadly (staff prefix, +Projectile Speed %) -- multiplies a
// projectile's travel speed at creation time.
function projectileSpeedMult(p){ return 1 + clamp((p&&p.projectileSpeedPct)||0, 0, 60)/100; }
// Total dodge chance combines the gear-based Evasion stat (Leather armor's
// innate roll, aggregated into p.evasion by recalcStats above) with the
// Survivalist's Evasion SKILL (evasionSkillChance) into ONE aggregate roll --
// not two separate, non-interacting dodge checks -- capped at the same 60%
// overall ceiling that already applied to gear-only evasion, so stacking
// both sources can't approach total invincibility.
const EVASION_CAP = 0.6;
// (v250) Evasion from Dex is a diminishing ratio against the area's monster level (like D2 defence vs attack rating).
function dexEvasionPct(dex, ml){ const d = Math.max(0, dex||0); return Math.min(45, Math.round(1000*d/(d + 25*Math.max(1,ml||1) + 100))/10); }
function gearEvasionNow(p){ return Math.min(60, (p.evaPb||0)); }   // v346: Dexterity now feeds Defense instead
function evasionChance(p){ const base = clamp(gearEvasionNow(p)/100 + evasionSkillChance(p), 0, EVASION_CAP); return (p.vanishEvaT>0 && typeof VANISH_EVA!=='undefined') ? Math.max(base, VANISH_EVA) : base; }

