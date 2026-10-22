// ---------------- Cursed Cemetery (v72) ----------------
// Fifth of the 6-batch "new area" sequence, reached from Withered Crossroads'
// own reserved south exit (SUNLIT_SOUTH_EXIT_SPOT/g.sun.southGate) -- the
// player arrives at this zone's own NORTH edge, continuing straight south
// along the Dark Forest -> Withered Crossroads -> Cursed Cemetery line.
//
// Size: shrunk to HALF ITS PREVIOUS SIZE (Sept 2026 patch) -- read as half
// each linear dimension (CEM_W/CEM_H both halved, so the zone's total
// area is a quarter of what it was), per an explicit request to make this
// zone smaller. The previous footprint (3800 x 2700, itself "half the
// area of Withered Crossroads" per the original v72 batch's own judgment call)
// is now halved again to 1900 x 1350, keeping the exact same aspect
// ratio. Every fixed landmark below (entrance, tomb, waypoint, road) is
// expressed relative to CEM_W/CEM_H/CEM_CX so it repositions itself
// automatically; the handful of absolute-pixel margins, exclusion radii
// and minimum-spacing values that AREN'T naturally proportional (the
// offLimits distances, the pack-anchor placement margins, etc., all listed
// below) are explicitly halved too so the zone keeps the same relative
// "breathing room" feel at its new smaller size instead of those fixed
// margins suddenly eating up a much bigger fraction of the map. The pack
// anchor target/count are cut to a quarter (matching the quartered area)
// rather than just halved again, so packs stay spread out instead of
// overcrowding a zone with 4x less room.
//
// Structurally this is the same open, standing-population zone shape as
// the Forest/Mountain Pass/Withered Crossroads/Lakeside Ruins (no genRoom()
// floors) -- a single straight road/path runs from the north entrance
// down to the sealed tomb entrance at the zone's south end, with graves
// and dead trees scattered off the path rather than a crossroad (there's
// nothing past this zone yet except the Dark Crypt stub the tomb itself
// leads to, so a crossroad shape isn't needed).
const CEM_W = 1900, CEM_H = 1350;
const CEM_CX = CEM_W/2;
const CEM_ROAD_HALFW = 46; // same visual road width as Withered Crossroads' crossroad
const CEMETERY_ENTRANCE_SPOT = {x:CEM_CX, y:16};
// The sealed tomb entrance -- a fixed landmark near the zone's south end,
// present from the very first visit (see the brief: "VISUALLY PRESENT...
// FROM THE START") but not interactable until p.cemeteryCleared flips true
// (see enterCursedCemetery's per-frame clear-check and drawTombIso's
// locked/unlocked visual states). Offset from the south edge halved (220
// -> 110) along with the zone's own halved dimensions, above.
const CEM_TOMB_SPOT = {x:CEM_CX, y:CEM_H-110};
function cemOnRoad(x,y){ return Math.abs(x-CEM_CX) < CEM_ROAD_HALFW; }
// A quarter of Withered Crossroads' own anchor target/pack count, matching this
// zone's quartered-area footprint (half x half) -- deliberately NOT the
// same density as Withered Crossroads (which would badly overcrowd a zone this
// much smaller); this keeps the same "spread out, not clumped" spacing
// rule (see the (now-halved) minimum anchor-to-anchor spacing below,
// proportionally scaled from every other zone's pack-anchor placement)
// just with proportionally fewer anchors.
const CEM_PACK_ANCHOR_TARGET = Math.round(SUNLIT_PACK_ANCHOR_TARGET/8);
const CEM_PACK_COUNT = Math.round(SUNLIT_PACK_COUNT/8);
const CEM_PACK_TEMPLATES = [
  // Skeleton: the exact reusable base type from Lakeside Ruins (v71),
  // simply added to this zone's spawn pool -- no changes to the type itself.
  { type:'skeleton', countMin:2, countMax:4 },
  { type:'skeleton', countMin:1, countMax:3 },
  // Zombie Skeleton Archer (new, v72): ranged skeleton variant -- see
  // spawnEnemy's 'skeletonarcher' branch.
  { type:'skeletonarcher', countMin:1, countMax:2 },
  // Spider: the exact existing Forest/Spider-Lair/Lakeside-Ruins 'spider'
  // type, just added to this zone's spawn pool -- no new type.
  { type:'spider', countMin:1, countMax:2 },
  // Skeletal Brute (new, v72): heavier skeleton variant -- a single,
  // smaller-count template (max 1 per pack) so it reads as an occasional
  // tough encounter rather than a common pack member, mirroring how
  // Lighthouse Tower only introduces Bandit Brute on its denser boss floor.
  { type:'skeletonbrute', countMin:1, countMax:1 },
];
function makeCursedCemetery(){
  const w=CEM_W, h=CEM_H;
  const sunlitGate = {x:CEMETERY_ENTRANCE_SPOT.x, y:CEMETERY_ENTRANCE_SPOT.y, r:34};
  const tomb = {x:CEM_TOMB_SPOT.x, y:CEM_TOMB_SPOT.y, r:40};
  const statue = {x:CEM_CX, y:CEM_H*0.5, r:34};   // v299: the Grave Statue in the middle of the cemetery

  // Exclusion radii halved (240/260 -> 120/130) along with the zone's own
  // halved dimensions above, so the gate/tomb keep the same relative
  // clearance instead of that fixed clearance eating a much bigger share
  // of the now-smaller map.
  function offLimits(x,y){
    return cemOnRoad(x,y) || dist({x,y},sunlitGate) < 120 || dist({x,y},tomb) < 130 || dist({x,y},statue) < 95;
  }

  // Dead trees (bare, gnarled -- see drawDeadTreeIso) and tombstones/graves
  // (see drawGraveIso), scattered at a graveyard-appropriate density: many
  // more graves than trees, since "filled with old graves and tombstones"
  // is the zone's defining visual per the brief, with the dead trees as a
  // sparser atmospheric accent (roughly Withered Crossroads' own rock-scatter
  // density, scaled to this zone's smaller footprint). Margins halved and
  // counts cut to a quarter, matching the zone's halved dimensions/
  // quartered area, so density-per-area stays the same as before the resize.
  const deadTrees = [];
  for(let i=0;i<10;i++){
    const x = rand(35, w-35), y = rand(35, h-35);
    if(offLimits(x,y)) continue;
    deadTrees.push({x, y, s:rand(0.75,1.3)});
  }
  const graves = [];
  for(let i=0;i<33;i++){
    const x = rand(25, w-25), y = rand(25, h-25);
    if(offLimits(x,y)) continue;
    graves.push({x, y, s:rand(0.75,1.15), rot:rand(-0.12,0.12), cross:Math.random()<0.5});
  }

  // A dedicated permanent waypoint, same shared mechanism/art as every
  // other zone's -- nudged off the road, roughly midway between the
  // entrance and the tomb. Offset from the road halved (260 -> 130) along
  // with the zone's own halved width.
  const waypoint = {x:CEM_CX+130, y:h*0.5, r:22};

  const packAnchors = [];
  let tries=0;
  while(packAnchors.length < CEM_PACK_ANCHOR_TARGET && tries<6000){
    tries++;
    // Margin/exclusion/spacing all halved (110/200/280 -> 55/100/140)
    // along with the zone's own halved dimensions above.
    const x = rand(55, w-55), y = rand(55, h-55);
    if(offLimits(x,y)) continue;
    if(dist({x,y},waypoint) < 100) continue;
    if(packAnchors.some(a=>dist(a,{x,y}) < 140)) continue;
    packAnchors.push({x,y});
  }

  // Zone-edge boundary markers (Sept 2026 patch): a ring of tombstones
  // (drawGraveIso, the exact same prop as the interior grave scatter
  // above) walking this zone's outer edge, so the shrunken playable
  // area's border reads clearly. Pushed into the same `graves` array/
  // render pass as the interior scatter, so no new drawing code is
  // needed. Gaps are left at the north entrance gate and around the tomb
  // (which already sits close to the south edge at this zone's new
  // smaller size) so neither gets crowded or blocked.
  for(const bp of zoneBorderPoints(w, h, 25, 110, [
    {x:sunlitGate.x, y:sunlitGate.y, r:130},
    {x:tomb.x, y:tomb.y, r:170},
  ])){
    graves.push({x:bp.x, y:bp.y, s:rand(0.8,1.1), rot:rand(-0.12,0.12), cross:Math.random()<0.5});
  }

  return { w, h, obstacles:[], sunlitGate, tomb, statue, deadTrees, graves, waypoint, packAnchors,
    entranceSpot:CEMETERY_ENTRANCE_SPOT };
}
// ---------- Grave Statue event (v299) ----------
// Touch the statue: "None shall pass". Three waves of skeletons claw out of the graves, then a final pack of 5 Skeletal Brutes; clear them and the Dark Crypt opens.
const CEM_MULT = 5;   // v309: 5x as many monsters, arriving 5x as fast
const CEM_WAVES = [ {skeleton:6}, {skeleton:7, skeletonarcher:2}, {skeleton:8, skeletonarcher:3}, {skeletonbrute:5} ];
function cemeterySpawnFromGraves(g, type, n){
  const st = g.cem.statue;
  for(let i=0;i<n;i++){
    // v309: they claw up in a ring close around the statue instead of from the far graves
    const a = rand(0, Math.PI*2), rr = rand(170, 420);   // v490: spread wider
    const sp = {x:clamp(st.x+Math.cos(a)*rr, 40, g.cem.w-40), y:clamp(st.y+Math.sin(a)*rr*0.8, 40, g.cem.h-40)};
    const e = spawnEnemy(g, type, sp);
    if(!e) continue;
    e.engaged = true; e.aggroed = true; e.cemEvt = true; e.aggroRange = 2000; e.leashRange = 99999; e.stunT = Math.max(e.stunT||0, 0.5);
    g.particles.push({type:'burst', x:e.x, y:e.y, t:0.45, max:0.45, color:'#7a6a58'});
    g.particles.push({type:'ring', x:e.x, y:e.y, t:0.4, max:0.4, r:34, color:'#6a5a48'});
  }
}
// v453 rework: 5-7 risen dead every 5 seconds for 20 seconds, then 3 skeleton brutes burst out beside the crypt entrance.
// When every one of them is dead, the crypt opens.
const CEM_BATCH_EVERY = 5, CEM_BATCH_TIME = 40, CEM_BRUTES = 3;   // v490: twice the waves (8 over 40s), each about half the size
function startCemeteryEvent(g){
  g.cem.evt = {stage:1, t:0, nextBatch:0, brutes:false};
  showBigMsg('None shall pass', '', 3.4, true);
  shakeScreen(g, 5, 0.5);
  g.particles.push({type:'ring', x:g.cem.statue.x, y:g.cem.statue.y, t:0.7, max:0.7, r:240, color:'#9a4aff'});
}
function updateCemeteryEvent(g, p, dt){
  const ev = g.cem.evt; if(!ev || ev.stage<=0 || p.cemeteryCleared) return;
  if(ev.t==null){ ev.t = 0; ev.nextBatch = 0; ev.brutes = false; }   // an event started by an older version
  ev.t += dt;
  if(ev.t < CEM_BATCH_TIME){
    if(ev.t >= ev.nextBatch){
      const n = 3 + Math.floor(Math.random()*2), arch = Math.floor(n/3);
      cemeterySpawnFromGraves(g, 'skeleton', n-arch); cemeterySpawnFromGraves(g, 'skeletonarcher', arch);
      ev.nextBatch += CEM_BATCH_EVERY;
      showMsg('The dead rise...', 1.6, '#c8b0ff');
    }
    return;
  }
  if(!ev.brutes){
    ev.brutes = true;
    const tb = g.cem.tomb;
    for(let i=0;i<CEM_BRUTES;i++){
      const a = Math.PI*0.5 + (i-1)*0.7, sp = {x:clamp(tb.x+Math.cos(a)*150, 40, g.cem.w-40), y:clamp(tb.y+Math.sin(a)*150, 40, g.cem.h-40)};
      const e = spawnEnemy(g, 'skeletonbrute', sp); if(!e) continue;
      e.engaged = true; e.aggroed = true; e.cemEvt = true; e.aggroRange = 2000; e.leashRange = 99999; e.stunT = Math.max(e.stunT||0, 0.6);
      g.particles.push({type:'burst', x:sp.x, y:sp.y, t:0.6, max:0.6, color:'#9a8a78'});
    }
    showMsg('Brutes guard the crypt entrance', 2.4, '#c8b0ff'); shakeScreen(g, 4, 0.4);
    return;
  }
  if(g.enemies.some(e=>e.cemEvt && e.hp>0)) return;
  ev.stage = 0;
  p.cemeteryCleared = true; saveGame();
  showBigMsg('The way opens', '', 3.2); shakeScreen(g, 6, 0.6);
  g.particles.push({type:'ring', x:g.cem.tomb.x, y:g.cem.tomb.y, t:0.8, max:0.8, r:200, color:'#ffe9a0'});
}
function drawGraveStatueIso(st, clock, active, done){
  const iso = toIso(st.x, st.y), cx = iso.x, cy = iso.y;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx+6, cy+6, 46, 20, 0, 0, 7); ctx.fill();
  // stepped plinth (two iso slabs)
  function slab(w, y0, hgt, top, left, right){
    const dy = w*0.5;
    ctx.fillStyle = left; ctx.beginPath(); ctx.moveTo(cx-w, y0-hgt); ctx.lineTo(cx, y0-hgt+dy); ctx.lineTo(cx, y0+dy); ctx.lineTo(cx-w, y0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = right; ctx.beginPath(); ctx.moveTo(cx+w, y0-hgt); ctx.lineTo(cx, y0-hgt+dy); ctx.lineTo(cx, y0+dy); ctx.lineTo(cx+w, y0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = top; ctx.beginPath(); ctx.moveTo(cx, y0-hgt-dy); ctx.lineTo(cx+w, y0-hgt); ctx.lineTo(cx, y0-hgt+dy); ctx.lineTo(cx-w, y0-hgt); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1; ctx.stroke();
  }
  slab(46, cy+4, 10, '#8c8f98', '#5d6068', '#46484f');
  slab(32, cy-6, 14, '#9a9da6', '#666971', '#4c4e56');
  const by = cy-20;   // base of the cross
  // cross: tall shaft + arms with a lit left face and dark right face
  function bar(x0, y0, w, hgt){
    ctx.fillStyle = '#a9acb4'; ctx.fillRect(x0, y0, w*0.55, hgt);
    ctx.fillStyle = '#6a6d76'; ctx.fillRect(x0+w*0.55, y0, w*0.45, hgt);
    ctx.strokeStyle = 'rgba(10,10,16,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(x0, y0, w, hgt);
  }
  bar(cx-7, by-96, 14, 96);          // shaft
  bar(cx-30, by-74, 60, 13);         // arms
  ctx.fillStyle = '#b9bcc4'; ctx.beginPath(); ctx.moveTo(cx-7, by-96); ctx.lineTo(cx, by-102); ctx.lineTo(cx+7, by-96); ctx.closePath(); ctx.fill(); ctx.stroke();
  // weathering: cracks and moss
  ctx.strokeStyle = 'rgba(20,20,28,0.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx-3, by-90); ctx.lineTo(cx-1, by-80); ctx.lineTo(cx-4, by-70); ctx.moveTo(cx+18, by-72); ctx.lineTo(cx+20, by-65); ctx.stroke();
  ctx.fillStyle = 'rgba(70,110,60,0.55)'; ctx.beginPath(); ctx.ellipse(cx-4, by-6, 9, 5, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+22, by-62, 5, 3, 0, 0, 7); ctx.fill();
  // skull carved on the shaft
  ctx.fillStyle = '#2c2c34'; ctx.beginPath(); ctx.arc(cx-1, by-46, 5, 0, 7); ctx.fill();
  ctx.fillStyle = '#d4d6dc'; ctx.fillRect(cx-3.5, by-47.5, 2, 2.4); ctx.fillRect(cx+0.5, by-47.5, 2, 2.4);
  // aura: slow violet pulse while waiting, hard pulse during the event, gone once the crypt is open
  if(!done){
    const k = active ? 0.5+0.5*Math.sin(clock*9) : 0.5+0.5*Math.sin(clock*2.2);
    const gr = ctx.createRadialGradient(cx, by-60, 2, cx, by-60, 70);
    gr.addColorStop(0, 'rgba(160,90,255,'+(0.22+0.3*k*(active?1.4:0.8))+')'); gr.addColorStop(1, 'rgba(120,60,200,0)');
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, by-60, 70, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function spawnCemeteryPack(g, anchor, template){
  const t = template || CEM_PACK_TEMPLATES[Math.floor(Math.random()*CEM_PACK_TEMPLATES.length)];
  const n = forestPackSize(t);
  const spread = 90 + n*16;
  for(let i=0;i<n;i++){
    spawnEnemy(g, t.type, {x:anchor.x+rand(-spread,spread), y:anchor.y+rand(-spread,spread)});
  }
}
function enterCursedCemetery(from){
  const g = game;
  g.scene = 'cursedcemetery';
  // Waypoint rework: reachedCursedCemetery is no longer set on mere zone
  // entry -- it's now set when the player walks up to this zone's own
  // waypoint marker (see the nearCemWaypoint proximity check in update(),
  // which calls discoverWaypoint).
  g.cem = makeCursedCemetery();
  g.cem.waypoint = null;   // v453: the Cursed Cemetery has no waypoint any more
  g.room = g.cem;
  // Fixed area level (static difficulty)
  g.depth = 17;
  if(from==='crypt'){
    // Arrives just north of the tomb, same "beside the gate you came from"
    // convention -- the Dark Crypt's own return gate leads back out beside
    // the tomb it's entered through, not all the way back at the north
    // entrance.
    g.player.x = g.cem.tomb.x; g.player.y = g.cem.tomb.y - 90;
  } else if(from==='waypoint'){
    // Waypoint rework: arriving via the Teleport menu lands the player AT
    // this zone's own waypoint marker -- see openTeleportMenu's
    // teleportCursedCemeteryBtn.
    g.player.x = g.cem.sunlitGate.x; g.player.y = g.cem.sunlitGate.y + 120;
  } else {
    // Arrives just south of the north entrance gate, same convention.
    g.player.x = g.cem.sunlitGate.x; g.player.y = g.cem.sunlitGate.y + 120;
  }
  owFeatures(g);   // v525: random mausoleums and broken plot walls
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  showMsg('Cursed Cemetery', 1.4);
  // Same pack-anchor/pool-density approach as every other overworld zone,
  // just scaled to this zone's own (half-area) CEM_PACK_ANCHOR_TARGET/
  // CEM_PACK_COUNT above -- skipped entirely once the zone has already
  // been cleared once (p.cemeteryCleared), so a returning player doesn't
  // have to fight through a freshly-repopulated graveyard just to reach
  // the now-unlocked tomb.
  if(!g.player.cemeteryCleared){
    const anchors = shuffle(g.cem.packAnchors.slice());
    const count = Math.min(CEM_PACK_COUNT, anchors.length);
    for(let i=0;i<count;i++){
      spawnCemeteryPack(g, anchors[i]);
    }
  }
  owPoiRoll(g);   // v525: caches, a shrine, a guarded hoard
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}

