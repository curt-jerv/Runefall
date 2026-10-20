// ---------- Render ----------
function render(){
  _statusUsed = 0;   // v487: tint budget (drawWithStatus)
  if(game && game.started && game.scene==='town'){
    // a dusk sky behind the outdoor town square, visible past the fence line
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0, '#2a2440'); skyGrad.addColorStop(1, '#4a3a3a');
    ctx.fillStyle = skyGrad;
  } else if(game && game.started && game.scene==='forest'){
    // a dim green forest canopy overhead
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0, '#132318'); skyGrad.addColorStop(1, '#1c2e1a');
    ctx.fillStyle = skyGrad;
  } else if(game && game.started && game.scene==='redridge'){
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0, '#3a1a16'); skyGrad.addColorStop(1, '#e6a468');
    ctx.fillStyle = skyGrad;
  } else if(game && game.started && game.scene==='highlands'){
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0, '#3a4452'); skyGrad.addColorStop(1, '#7c8896');
    ctx.fillStyle = skyGrad;
  } else if(game && game.started && game.scene==='redcrater'){
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0, '#220a0a'); skyGrad.addColorStop(1, '#7a3a22');
    ctx.fillStyle = skyGrad;
  } else if(game && game.started && game.scene==='frosthold'){
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0, '#222c39'); skyGrad.addColorStop(1, '#a9bbcb');
    ctx.fillStyle = skyGrad;
  } else if(game && game.started && game.scene==='icyzone'){
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    if(game.iz && game.iz.kind==='cellar'){ skyGrad.addColorStop(0,'#05080d'); skyGrad.addColorStop(1,'#12202c'); }
    else if(game.iz && game.iz.kind==='shrine'){ skyGrad.addColorStop(0,'#1c2740'); skyGrad.addColorStop(1,'#a9bdd6'); }
    else { skyGrad.addColorStop(0,'#2d3d4c'); skyGrad.addColorStop(1,'#dbe8f0'); }
    ctx.fillStyle = skyGrad;
  } else if(game && game.started && game.scene==='mountainpass' && game.mtn && game.mtn.isCliff){
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0,'#05080f'); skyGrad.addColorStop(0.42,'#1a2434'); skyGrad.addColorStop(0.46,'#0d1824'); skyGrad.addColorStop(1,'#050b13');
    ctx.fillStyle = skyGrad;
  } else if(game && game.started && game.scene==='mountainpass'){
    // a pale, overcast winter sky over the rocky pass
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    const dk = clamp(((game.player&&game.player.y)||0)-3800, 0, 1800)/1800;   // (v263) the descent: the void beyond the walls goes dark
    const mixH = (a,b)=>{ const pa=[1,3,5].map(i=>parseInt(a.substr(i,2),16)), pb=[1,3,5].map(i=>parseInt(b.substr(i,2),16)); return 'rgb('+pa.map((v,i)=>Math.round(v+(pb[i]-v)*dk)).join(',')+')'; };
    skyGrad.addColorStop(0, mixH('#3a4a56','#0e0c14')); skyGrad.addColorStop(1, mixH('#c7d6de','#1c1a24'));
    ctx.fillStyle = skyGrad;
  } else if(game && game.started && game.scene==='dungeon'){
    // a dark, earthy void beyond the mine's torchlight
    ctx.fillStyle = '#0f0a06';
  } else if(game && game.started && game.scene==='lighthouse' && game.room && game.room.subzone==='pool'){
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0, '#16261f'); skyGrad.addColorStop(1, '#4a5c44');
    ctx.fillStyle = skyGrad;
  } else if(game && game.started && game.scene==='lighthouse'){
    // a warm dusk sky glimpsed through the tower's high windows
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0, '#241a30'); skyGrad.addColorStop(1, '#3a2a2c');
    ctx.fillStyle = skyGrad;
  } else if(game && game.started && game.scene==='lakesideruins'){
    // a hazy, humid sky over the lake -- cooler and mistier than Sunlit
    // Plains' bright open-grassland sky, fitting a lakeside-ruins mood.
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0, '#3a5a5e'); skyGrad.addColorStop(1, '#7a9ea0');
    ctx.fillStyle = skyGrad;
  } else if(game && game.started && game.scene==='rivervalley'){
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0, '#1c3426'); skyGrad.addColorStop(1, '#7fa870');
    ctx.fillStyle = skyGrad;
  } else if(game && game.started && game.scene==='blackmarsh'){
    // Black Marsh: a sickly, murky green haze
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0, '#16261f'); skyGrad.addColorStop(1, '#4a5c44');
    ctx.fillStyle = skyGrad;
  } else if(game && game.started && game.scene==='cursedcemetery'){
    // Cursed Cemetery (v72): a dark blue-gray/purple NIGHT sky, deliberately
    // the moodiest/darkest of any outdoor zone's sky gradient -- the
    // brief's "simple dark-toned zone" ask, without the full radius-limited
    // vision mechanic (that belongs to the Dark Crypt dungeon, batch 6).
    // Kept lighter at the horizon than at the top so the ground plane
    // (drawCemeteryFloor) still reads clearly rather than going pitch black.
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0, '#0e0d20'); skyGrad.addColorStop(1, '#2a2440');
    ctx.fillStyle = skyGrad;
  } else {
    ctx.fillStyle = '#0a0806';
  }
  ctx.fillRect(0,0,W,H);
  try{ applyMoodCss(game); }catch(e){}
  if(!game || !game.started) return;
  const g=game, p=g.player, room=g.room, cam=g.camera;
  ctx.save();
  // Combat feel (v104): screen shake -- a small random offset that fades out.
  let shX=0, shY=0;
  if(g.shakeT>0){
    const sm = (g.shakeMag||0)*Math.min(1, g.shakeT/0.15);
    shX = (Math.random()*2-1)*sm; shY = (Math.random()*2-1)*sm;
  }
  ctx.translate(-cam.x+shX, -cam.y+shY);

  moodFloorBegin();   // v470
  if(g.scene==='town'){
    cachedFloor(room, cam, c=>drawTownFloor(room, c), c=>drawTownFloor(room, c));   // v487: live pass = harbour ripples
    drawTownPerimeter(room);
    drawTownDock(g, room);
  } else if(g.scene==='forest'){
    const fl = c=>{ drawForestFloor(room, c); drawTownPreviewFloor(g, c); };   // v456: Mistfall visible beyond the west edge
    cachedFloor(room, cam, fl, fl);
    // no walls -- the tree line along the edges is the natural boundary
  } else if(g.scene==='redridge'){
    cachedFloor(g.rr, cam, c=>drawCraterTerrain(g.rr, c));
  } else if(g.scene==='highlands'){
    cachedFloor(g.hl, cam, c=>drawCraterTerrain(g.hl, c));
  } else if(g.scene==='redcrater'){
    cachedFloor(g.crater, cam, c=>drawCraterTerrain(g.crater, c));
  } else if(g.scene==='frosthold'){
    cachedFloor(room, cam, c=>drawFrostholdFloor(room, c));
  } else if(g.scene==='icyzone'){
    cachedFloor(room, cam, c=>drawIcyZoneFloor(room, c));
  } else if(g.scene==='mountainpass'){
    if(g.mtn.isCliff && !g.mtn.nest) drawCliffSea(g, cam);
    cachedFloor(g.mtn, cam, c=>drawCraterTerrain(g.mtn, c));
    if(g.mtn.isCliff && !g.mtn.nest) drawCliffSurf(g, cam);
    // no walls here either -- same open-edge boundary as the Forest
  } else if(g.scene==='rivervalley'){
    cachedFloor(room, cam, c=>drawRiverValleyFloor(room, c), c=>drawRiverValleyFloor(room, c));
  } else if(g.scene==='sunlitplains'){
    cachedFloor(room, cam, c=>drawSunlitPlainsFloor(room, c), c=>drawSunlitPlainsFloor(room, c));
    // no walls -- same open-edge boundary as the Forest/Mountain Pass
  } else if(g.scene==='lakesideruins'){
    cachedFloor(room, cam, c=>drawLakesideRuinsFloor(room, c), c=>drawLakesideRuinsFloor(room, c));
    // no walls -- same open-edge boundary as every other overworld zone;
    // the lake's water obstacles provide their own visual boundary instead.
  } else if(g.scene==='blackmarsh'){
    cachedFloor(room, cam, c=>drawBlackMarshFloor(room, c), c=>drawBlackMarshFloor(room, c));
  } else if(g.scene==='cursedcemetery'){
    cachedFloor(room, cam, c=>drawCemeteryFloor(room, c));
    // no walls -- same open-edge boundary as every other overworld zone
  } else if(g.scene==='darkcrypt'){
    // v72 stub: reuses the Mine's own stonework floor/wall renderer, same
    // "small, fully walled contained interior" treatment Lighthouse
    // Tower's floors already get below -- appropriate for a crypt
    // interior, and zero new rendering code needed for this placeholder.
    cachedFloor(room, cam, c=>drawFloor(room, c));
    drawWalls(room);
  } else if(g.scene==='lighthouse'){
    // Reuses the Mine's own stonework floor/wall renderer -- fits a tower
    // interior just as well as a mine tunnel, and each small fixed floor
    // here (no floorRects) paints its entire w x h box, walled in on all
    // four sides, giving the "contained tower interior" feel the brief
    // calls for.
    if(room.deep){ drawDeepFloor(room, cam); }
    else if(room.subzone==='keep'){ if(room.hell) drawHellFloor(room, cam); else { drawSubFloor(room, cam); drawKeepWalls(room); } }
    else if(room.subzone){ drawSubFloor(room, cam); if(room.subzone==='sunken' || room.subzone==='temple' || room.subzone==='rrtower') drawWalls(room); }
    else {
    cachedFloor(room, cam, c=>drawFloor(room, c));
    drawWalls(room);
    }
  } else {
    cachedFloor(room, cam, c=>drawFloor(room, c));
    if(!room.organic) drawWalls(room);
  }

  moodFloor = false; drawGroundGrime(g, cam);   // v470
  const drawables = [];
  // Lakeside Ruins' water rects (o.isWater) are excluded here -- they're
  // rendered as part of the ground tiling itself (drawLakesideRuinsFloor),
  // not as a stone/dungeon-wall block like every other obstacle.
  // v86: item 7 -- .occluder/.wx/.wy tag these as candidates for the
  // behind-wall fade pass below (right before drawables.sort()).
  // v490: obstacles wholly off screen are skipped (organic caves have 500+ wall cells; drawing them all cost ~15ms a frame on phones)
  const obCull = !(g.scene==='redcrater' || g.scene==='mountainpass' || g.scene==='redridge' || g.scene==='highlands'), obX0 = cam.x-240, obX1 = cam.x+W+240, obY0 = cam.y-120, obY1 = cam.y+H+260;
  for(const o of room.obstacles){ if(o.isWater || o.isFurniture || o.isKeep || o.isProp || o.isCliff || o.bogVoid) continue;
    if(obCull && o.w!=null){ const ixL = (o.x-o.y-o.h)*ISO_KX, ixR = (o.x+o.w-o.y)*ISO_KX, iyT = (o.x+o.y)*ISO_KY, iyB = (o.x+o.w+o.y+o.h)*ISO_KY; if(ixR < obX0 || ixL > obX1 || iyB < obY0 || iyT > obY1) continue; }
    drawables.push({depth:(o.x+o.w/2)+(o.y+o.h/2), occluder:!o.bone, wx:o.x+o.w/2, wy:o.y+o.h/2, draw:()=>(
    o.bone ? drawBoneBarricade(o)
    : o.woodBarricade ? drawWoodBarricadeIso(o)
    : o.organic ? drawOrganicWall(o)
    : o.mazeWall
      ? (room.wallPal ? drawBlock(o, 52, room.wallPal[0], room.wallPal[1], room.wallPal[2]) : drawBlock(o, 52, '#463c30','#221c14','#302819'))
      : (o.col ? (drawBlock(o, o.hz||34, o.col[0], o.col[1], o.col[2]), o.skull && drawPillarSkulls(o)) : drawBlock(o, 26, '#5a4c3a','#2a2216','#3a3020'))
  )}); }
  if(g.scene==='town'){
    if(g.town){
      if(g.town.trees) for(const tr of g.town.trees) drawables.push({depth:tr.x+tr.y, draw:()=>(tr.dead ? drawDeadTreeIso(tr) : drawTreeIso(tr))});
      if(g.town.decoBuildings) for(const db of g.town.decoBuildings) drawables.push({depth:(db.x+db.w/2)+(db.y+db.h/2), occluder:true, wx:db.x+db.w/2, wy:db.y+db.h/2, draw:()=>drawBuildingIso(db)});
      {
        const tb = g.town.tavern;
        drawables.push({depth:(tb.x+tb.w/2)+(tb.y+tb.h/2), occluder:true, wx:tb.x+tb.w/2, wy:tb.y+tb.h/2, draw:()=>drawBuildingIso(tb)});
        drawables.push({depth:g.town.tavernSign.x+g.town.tavernSign.y, draw:()=>drawSignIso(g.town.tavernSign, tavernSignLines(p))});
        // Once the quest is complete he's moved inside to work the bar --
        // see the Tavern-interior draw block's barkeeperSpot -- so his
        // outdoor spot is no longer drawn (one barkeeper, not two).
        if(!tavernIsOpen(p)){
          drawables.push({depth:g.town.barkeeper.x+g.town.barkeeper.y, draw:()=>drawBarkeeperIso(g.town.barkeeper, g.clock||0, barkeeperHasIndicator(p))});
        }
      }
      drawables.push({depth:g.town.blacksmith.x+g.town.blacksmith.y, draw:()=>drawBlacksmithIso(g.town.blacksmith, g.clock||0)});
      if(p.runeforgeUnlocked){
        drawables.push({depth:g.town.runeforge.x+g.town.runeforge.y, draw:()=>drawRuneforgeAnvilIso(g.town.runeforge, g.clock||0)});
        drawables.push({depth:g.town.runeforge.x+g.town.runeforge.y+1, draw:()=>drawEdgeLabelIso(g.town.runeforge, 'OBSIDIAN FORGE', 70)});
      }
      drawables.push({depth:g.town.questGiver.x+g.town.questGiver.y, draw:()=>drawQuestNpcIso(g.town.questGiver, g.clock||0, questGiverHasIndicator(p))});
      drawables.push({depth:g.town.well.x+g.town.well.y, draw:()=>drawWellIso(g.town.well, g.clock||0)});
      drawables.push({depth:g.town.tent.x+g.town.tent.y, draw:()=>drawTentIso(g.town.tent)});
      drawables.push({depth:g.town.bonfire.x+g.town.bonfire.y, draw:()=>drawBonfireIso(g.town.bonfire, g.clock||0)});
      {
        const hq = getQuest(g.player, QUEST_FIND_HUNTERS.id);
        if(hq && hq.status==='complete'){
          const bh = {x:g.town.bonfire.x+26, y:g.town.bonfire.y+14};
          drawables.push({depth:bh.x+bh.y, draw:()=>{ drawHunterIso(bh, g.clock||0, true); if(hunterHasMark(g.player)) drawQuestMarkIso(bh.x, bh.y, g.clock||0, 62); }});
        }
      }
      drawables.push({depth:g.town.gate.x+g.town.gate.y, draw:()=>drawEdgeLabelIso(g.town.gate, 'FOREST')});
      for(const sgn of [-1,1]){ const gp = {x:room.w-6, y:(room.roadY||170)+sgn*56-(sgn<0?14:0)}; drawables.push({depth:gp.x+gp.y+14, draw:()=>drawGatePillarIso(gp, g.clock||0)}); }
      {
        // Waypoint rework: Town's waypoint is always drawn in its
        // "unlocked/lit" state -- see updateTown's matching comment.
        drawables.push({depth:g.town.waypoint.x+g.town.waypoint.y-1, draw:()=>drawWaypointIso(g.town.waypoint, g.clock||0, true)});
        drawables.push({depth:g.town.waypoint.x+g.town.waypoint.y, draw:()=>drawEdgeLabelIso(g.town.waypoint, 'WAYPOINT')});
      }
      drawables.push({depth:g.town.stashChest.x+g.town.stashChest.y-1, draw:()=>drawChestIso(g.town.stashChest)});
      drawables.push({depth:g.town.stashChest.x+g.town.stashChest.y, draw:()=>drawEdgeLabelIso(g.town.stashChest, 'STASH')});
      if(townCatVisible()){ const tc = g.town.cat; drawables.push({depth:tc.x+tc.y, draw:()=>drawTownCatIso(tc, g.clock||0, p)}); drawables.push({depth:tc.x+tc.y+1, draw:()=>drawEdgeLabelIso(tc, 'SUPPORT', 34)}); }
      if(g.town.outerTrees) for(const tr of g.town.outerTrees){ const io = toIso(tr.x,tr.y); if(io.x>cam.x-160 && io.x<cam.x+W+160 && io.y>cam.y-300 && io.y<cam.y+H+200) drawables.push({depth:tr.x+tr.y, draw:()=>(tr.dead ? drawDeadTreeIso(tr) : drawTreeIso(tr))}); }
      if(g.town.props) for(const pr of g.town.props) drawables.push({depth:pr.x+pr.y+(pr.k==='fence'?pr.len/2:0), draw:()=>drawTownProp(pr, g.clock||0)});
      drawables.push({depth:500+930, draw:()=>drawSignIso({x:500,y:930}, ['DOCKS'])});
      for(const tn of townTipNpcs(g)) drawables.push({depth:tn.x+tn.y, draw:()=>drawSimpleNpcIso(tn, g.clock||0)});   // v490
      if(tavernIsOpen(p) && g.town.boat){ const bt = g.town.boat; drawables.push({depth:bt.x+bt.y, draw:()=>drawTownBoat(bt, g.clock||0)}); }
      if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)});
      pushNecroDrawables(g, drawables);
    }
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
  } else if(g.scene==='forest'){
    if(g.forest){
      const visF = (x,y)=>{ const i=toIso(x,y); return i.x>cam.x-220 && i.x<cam.x+W+220 && i.y>cam.y-330 && i.y<cam.y+H+240; };
      if(g.forest.trees) for(const tr of g.forest.trees) if(visF(tr.x,tr.y)) drawables.push({depth:tr.x+tr.y, draw:()=>drawTreeIso(tr)});
      for(const o of g.forest.obstacles){ if(!o.isProp || o.noDraw) continue; const cx=o.x+o.w/2, cy=o.y+o.h/2; if(visF(cx,cy)) drawables.push({depth:cx+cy, draw:()=>drawPropIso(o, g.clock||0)}); }
      if(g.forest.decor) for(const d of g.forest.decor) if(visF(d.x,d.y)) drawables.push({depth:d.x+d.y-2, draw:()=>drawDecorIso(d, g.clock||0)});
      drawables.push({depth:g.forest.townGate.x+g.forest.townGate.y, draw:()=>drawEdgeLabelIso(g.forest.townGate, 'MISTFALL')});
      try{ pushTownPreviewDrawables(g, cam, drawables); }catch(err){}
      drawables.push({depth:g.forest.spiderLairGate.x+g.forest.spiderLairGate.y, draw:()=>drawSpiderNestIso(g.forest.spiderLairGate, g.clock||0)});
      // v87: a tall bone-and-web totem alongside the ground-level cave
      // mouth above -- see drawSpiderTotemIso's comment for why this was
      // added (findable-from-a-distance landmark fix). Same depth+2 offset
      // convention as the label below so it draws after the cave mouth but
      // the label still draws on top of both.
      drawables.push({depth:g.forest.spiderLairGate.x+g.forest.spiderLairGate.y+2, draw:()=>drawEdgeLabelIso(g.forest.spiderLairGate, 'SPIDER LAIR')});
      drawables.push({depth:g.forest.bearCaveGate.x+g.forest.bearCaveGate.y, draw:()=>drawBearDenIso(g.forest.bearCaveGate, g.clock||0)});
      // v87: tall claw-marked totem, same "landmark alongside the ground-
      // level cave mouth" treatment as the Spider Lair above.
      drawables.push({depth:g.forest.bearCaveGate.x+g.forest.bearCaveGate.y+2, draw:()=>drawEdgeLabelIso(g.forest.bearCaveGate, 'BEAR CAVE')});
      // v87: sunGate previously had NO visual at all (not even a label) --
      // it was relocated from the Forest's top edge to its bottom edge, and
      // now gets both a tall sunlit totem landmark and its own edge label,
      // matching every other gate in this zone.
      // v236: subtle -- just a wayside signpost where the forest road opens toward the river (the big sun arch now marks the River Valley's south gate)
      drawables.push({depth:g.forest.sunGate.x+g.forest.sunGate.y, draw:()=>drawEdgeLabelIso(g.forest.sunGate, 'RIVER VALLEY')});
      if(g.forest.hunters) for(const h of g.forest.hunters){ if(!h.found) drawables.push({depth:h.x+h.y, draw:()=>drawHunterIso(h, g.clock||0)}); }
      // Town Guard NPCs (Sept 2026 patch) -- drawn via the shared humanoid
      // rig (drawDemon reads only x/y/r/type/faceSign/animT/moving/hitT/
      // atkAnimT/hp/maxHp, all of which a guard object also carries).
      if(g.forest.guards) for(const gd of g.forest.guards) drawables.push({depth:gd.x+gd.y, draw:()=>drawGuardIso(gd)});
    }
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='mountainpass' && g.mtn && g.mtn.isCliff){
    pushCliffDrawables(g, drawables, cam);
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='mountainpass'){
    if(g.mtn){
      { const vis = (x,y)=>{ const i=toIso(x,y); return i.x>cam.x-160 && i.x<cam.x+W+160 && i.y>cam.y-260 && i.y<cam.y+H+200; };
        for(const dd of g.mtn.deco) if(vis(dd.x,dd.y)) drawables.push({depth:dd.x+dd.y, draw:()=>drawMtnDeco(dd)}); }
      drawables.push({depth:g.mtn.forestGate.x+g.mtn.forestGate.y, draw:()=>drawEdgeLabelIso(g.mtn.forestGate, 'BARREN HIGHLANDS')});
      drawables.push({depth:g.mtn.summitGate.x+g.mtn.summitGate.y-1, draw:()=>drawIceCaveIso(g.mtn.summitGate, g.clock||0)});
      drawables.push({depth:g.mtn.summitGate.x+g.mtn.summitGate.y, draw:()=>drawEdgeLabelIso(g.mtn.summitGate, 'ICY SUMMIT', 130)});
      drawables.push({depth:-1e6, draw:()=>{ const q=toIso(g.mtn.frostGate.x,g.mtn.frostGate.y); ctx.save(); ctx.translate(q.x,q.y); ctx.scale(0.5,0.5); ctx.translate(-q.x,-q.y); drawFrostholdBackdrop(g.mtn.frostGate, g.clock||0); ctx.restore(); }});
      drawables.push({depth:g.mtn.frostGate.x+g.mtn.frostGate.y-1-1e5, draw:()=>fadeWhenBehind(g.mtn.frostGate, 0, 0, ()=>{ const q=toIso(g.mtn.frostGate.x,g.mtn.frostGate.y); ctx.save(); ctx.translate(q.x,q.y); ctx.scale(0.65,0.65); ctx.translate(-q.x,-q.y); drawKeepGateIso(g.mtn.frostGate, g.clock||0); ctx.restore(); })});
      drawables.push({depth:g.mtn.frostGate.x+g.mtn.frostGate.y, draw:()=>drawEdgeLabelIso(g.mtn.frostGate, 'FROSTHOLD KEEP', 90)});
      if(!snowWallOpen(g.player)) drawables.push({depth:g.mtn.frostGate.x+g.mtn.frostGate.y+0.5-1e5, draw:()=>drawSnowWallIso(g.mtn.frostGate)});
      drawables.push({depth:g.mtn.mineGate.x+g.mtn.mineGate.y-1, draw:()=>drawMineEntranceIso(g.mtn.mineGate, g.clock||0)});
      drawables.push({depth:g.mtn.mineGate.x+g.mtn.mineGate.y, draw:()=>drawEdgeLabelIso(g.mtn.mineGate, 'MOUNTAIN DEPTHS', 130)});
      // Mountain Pass's own dedicated waypoint -- always lit/pulsing (see
      // makeMountainPass()'s comment), same art as Town's.
      drawables.push({depth:g.mtn.waypoint.x+g.mtn.waypoint.y-1, draw:()=>drawWaypointIso(g.mtn.waypoint, g.clock||0, waypointLit())});
      drawables.push({depth:g.mtn.waypoint.x+g.mtn.waypoint.y, draw:()=>drawEdgeLabelIso(g.mtn.waypoint, 'WAYPOINT')});
    }
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='redridge'){
    const rr = g.rr;
    if(rr){
      for(const d of rr.deco){ const io = toIso(d.x,d.y); if(io.x>cam.x-160 && io.x<cam.x+W+160 && io.y>cam.y-260 && io.y<cam.y+H+200) drawables.push({depth:d.x+d.y, draw:()=>drawRedDecoIso(d)}); }
      for(const gt of rr.gates){
        if(gt.art) drawables.push({depth:gt.x+gt.y+(gt.big?120:0)-(gt.art==='keep'?1e5:0), draw:()=>{ if(gt.big){ const io = toIso(gt.x,gt.y); ctx.save(); ctx.translate(io.x,io.y); ctx.scale(gt.big,gt.big); ctx.translate(-io.x,-io.y); drawGateArtIso(gt, g.clock||0); if(gt.id==='bridge') drawGoldPortal(io.x, io.y-50, 24, 47, g.clock||0, rrBeaconCount(g.player)>=3); ctx.restore(); } else drawGateArtIso(gt, g.clock||0); }});
        drawables.push({depth:gt.x+gt.y+(gt.big?121:1), draw:()=>drawEdgeLabelIso(gt, gt.label, gt.labelH!=null ? gt.labelH : gt.big ? 30+70*(gt.big-1)+(typeof gt.art==='string'?80:0) : (typeof gt.art==='string'?150:30))});
      }
      if(rr.waypoint){ drawables.push({depth:rr.waypoint.x+rr.waypoint.y-1, draw:()=>drawWaypointIso(rr.waypoint, g.clock||0, waypointLit())});
      drawables.push({depth:rr.waypoint.x+rr.waypoint.y, draw:()=>drawEdgeLabelIso(rr.waypoint, 'WAYPOINT')}); }
      if(rr.camp) drawables.push({depth:rr.camp.x+rr.camp.y-200, draw:()=>drawRRCamp(rr.camp, g.clock||0)});
      if(rr.camp){ const wf = {x:rr.camp.x, y:rr.camp.y, id:7, robe:'#6a5a3a', hood:'#4a3a28', long:true, tool:'lantern'};
        drawables.push({depth:wf.x+wf.y, draw:()=>drawSimpleNpcIso(wf, g.clock||0, {mark: npcHasMark(g.player,'wayfarer') || !g.player.wayfarerMet})}); }
      for(const tw of rr.towers){
        drawables.push({depth:tw.x+tw.y+60, draw:()=>drawRRWatchtower(tw, g.clock||0, !!(g.player.rrBeacons && g.player.rrBeacons[tw.id]))});
        drawables.push({depth:tw.door.x+tw.door.y+1, draw:()=>drawEdgeLabelIso(tw.door, 'WATCHTOWER '+tw.id, 20)});
      }
      drawables.push({depth:1e7, draw:()=>drawRRSkyline(rr, g.clock||0)});
    }
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='highlands'){
    const R = g.hl;
    if(R){
      const vis = (x,y)=>{ const i=toIso(x,y); return i.x>cam.x-220 && i.x<cam.x+W+220 && i.y>cam.y-320 && i.y<cam.y+H+220; };
      const clk = g.clock||0;
      for(const d of R.deco) if(vis(d.x,d.y)) drawables.push({depth:d.x+d.y+(d.k==='arch'?60:d.k==='ruintower'?40:0), occluder:(d.k==='ruintower'||d.k==='arch'), wx:d.x, wy:d.y, draw:()=>drawHlDecoIso(d, clk)});
      for(const gt of R.gates){
        drawables.push({depth:gt.x+gt.y+120, draw:()=>{ const io = toIso(gt.x,gt.y); ctx.save(); ctx.translate(io.x,io.y); ctx.scale(gt.big,gt.big); ctx.translate(-io.x,-io.y); drawGateArtIso(gt, clk); ctx.restore(); }});
        drawables.push({depth:gt.x+gt.y+121, draw:()=>drawEdgeLabelIso(gt, gt.label, gt.labelH||80)});
      }
      drawables.push({depth:R.waypoint.x+R.waypoint.y-1, draw:()=>drawWaypointIso(R.waypoint, clk, waypointLit())});
      drawables.push({depth:R.waypoint.x+R.waypoint.y, draw:()=>drawEdgeLabelIso(R.waypoint, 'WAYPOINT')});
    }
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='redcrater'){
    const R = g.crater;
    if(R){
      const vis = (x,y)=>{ const i=toIso(x,y); return i.x>cam.x-160 && i.x<cam.x+W+160 && i.y>cam.y-260 && i.y<cam.y+H+200; };
      for(const d of R.deco) if(vis(d.x,d.y)) drawables.push({depth:d.x+d.y, draw:()=>drawCraterDeco(d)});
      for(const gt of R.gates){
        drawables.push({depth:gt.x+gt.y+(gt.big?120:0), draw:()=>{ const io = toIso(gt.x,gt.y); ctx.save(); ctx.translate(io.x,io.y); ctx.scale(gt.big,gt.big); ctx.translate(-io.x,-io.y); drawGateArtIso(gt, g.clock||0); ctx.restore(); }});
        drawables.push({depth:gt.x+gt.y+121, draw:()=>drawEdgeLabelIso(gt, gt.label, 30+70*(gt.big-1))});
      }
      if(!p.obsidianTaken) drawables.push({depth:R.runeSpot.x+R.runeSpot.y, draw:()=>drawObsidianRuneIso(R.runeSpot, !!p.gojiraSlain, !obsidianRuneAvailable(p), g.clock||0)});
      if(!p.obsidianTaken) drawables.push({depth:R.runeSpot.x+R.runeSpot.y+1, draw:()=>drawEdgeLabelIso(R.runeSpot, 'OBSIDIAN OBELISK', 120)});
    }
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
    if(g.boltFx) drawables.push({depth:1e9, draw:()=>drawBoltFx(g)});
  } else if(g.scene==='frosthold'){
    const fh = g.fh;
    if(fh){
      for(const rk of fh.rocks) drawables.push({depth:rk.x+rk.y, draw:()=>drawRockIso(rk)});
      if(fh.eastDeco) for(const d of fh.eastDeco) drawables.push({depth:d.x+d.y, draw:()=>drawRedDecoIso(d)});
      for(const c of fh.chunks){
        const cxm = c.x+c.w/2, cym = c.y+c.h/2, io = toIso(cxm, cym);
        const sx = io.x - cam.x, sy = io.y - cam.y;
        if(sx < -420 || sx > W+420 || sy < -520 || sy > H+380) continue;
        drawables.push({depth:cxm+cym, occluder:true, wx:cxm, wy:cym, rect:c, hz:c.hz||0, draw:()=>drawKeepChunk(c)});
      }
      for(const gt of fh.gates){
        const dz = gt.dz||0;
        if(gt.art==='ftower'){
          drawables.push({depth:gt.x+gt.y+dz-1e5, draw:()=>drawGateArtIso(gt, g.clock||0, 'lower')});
          drawables.push({depth:gt.x+gt.y+dz, draw:()=>fadeWhenBehind(gt, 90, 700, ()=>drawGateArtIso(gt, g.clock||0, 'upper'))});
        } else
        if(gt.art) drawables.push({depth:gt.x+gt.y+dz-1e5, draw:()=>fadeWhenBehind(gt, 0, 0, ()=>{ if(gt.big){ const io = toIso(gt.x,gt.y); ctx.save(); ctx.translate(io.x,io.y); ctx.scale(gt.big,gt.big); ctx.translate(-io.x,-io.y); drawGateArtIso(gt, g.clock||0); ctx.restore(); } else drawGateArtIso(gt, g.clock||0); })});
        if(gt.id==='pass') drawables.push({depth:-1e6, draw:()=>drawFrostholdBackdrop(gt, g.clock||0, true)});
        if(gt.act==='toRedridge' && !redridgeWallOpen(g.player)) drawables.push({depth:gt.x+gt.y+dz+0.5, draw:()=>drawDwarfWallIso(gt, g.clock||0)});
        drawables.push({depth:gt.x+gt.y+dz+1, draw:()=>drawEdgeLabelIso(gt, gt.label, gt.labelH!=null ? gt.labelH : gt.big ? 30+70*(gt.big-1)+(typeof gt.art==='string'?80:0) : (typeof gt.art==='string'?150:30))});
      }
      drawables.push({depth:fh.waypoint.x+fh.waypoint.y-1, draw:()=>drawWaypointIso(fh.waypoint, g.clock||0, waypointLit())});
      drawables.push({depth:fh.waypoint.x+fh.waypoint.y, draw:()=>drawEdgeLabelIso(fh.waypoint, 'WAYPOINT')});
    }
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='icyzone'){
    const iz = g.iz;
    if(iz){
      for(const rk of iz.rocks) drawables.push({depth:rk.x+rk.y, draw:()=>drawRockIso(rk)});
      for(const gt of iz.gates){
        if(gt.art) drawables.push({depth:gt.x+gt.y-1e5, draw:()=>drawGateArtIso(gt, g.clock||0)});
        drawables.push({depth:gt.x+gt.y+1, draw:()=>drawEdgeLabelIso(gt, gt.label, 130)});
      }
      for(const c of (iz.crags||[])) drawables.push({depth:c.x+c.y, draw:()=>drawIceCragIso(c)});
      if(iz.waypoint){
        drawables.push({depth:iz.waypoint.x+iz.waypoint.y-1, draw:()=>drawWaypointIso(iz.waypoint, g.clock||0, waypointLit())});
        drawables.push({depth:iz.waypoint.x+iz.waypoint.y, draw:()=>drawEdgeLabelIso(iz.waypoint, 'WAYPOINT')});
      }
      if(iz.altar){
        drawables.push({depth:iz.altar.x+iz.altar.y, draw:()=>drawShrineAltarIso(iz.altar, g.clock||0)});
        drawables.push({depth:iz.altar.x+iz.altar.y+1, draw:()=>drawEdgeLabelIso(iz.altar, 'SHRINE')});
        if(iz.homePortal){ const hp = iz.homePortal; drawables.push({depth:hp.x+hp.y-1, draw:()=>drawBluePortalIso(hp, g.clock||0)}); drawables.push({depth:hp.x+hp.y, draw:()=>drawEdgeLabelIso(hp, 'MISTFALL')}); }   // v490
      }
      if(iz.chestSpot) drawables.push({depth:iz.chestSpot.x+iz.chestSpot.y, draw:()=>drawChestIso(iz.chestSpot)});
    }
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='rivervalley'){
    if(g.rv){
      const rv = g.rv, clkR = g.clock||0;
      const visR = (x,y)=>{ const i=toIso(x,y); return i.x>cam.x-260 && i.x<cam.x+W+260 && i.y>cam.y-360 && i.y<cam.y+H+260; };
      if(rv.rocks) for(const rk of rv.rocks) if(visR(rk.x,rk.y)) drawables.push({depth:rk.x+rk.y, draw:()=>drawPlainsRockIso(rk)});
      if(rv.grassTufts) for(const gt of rv.grassTufts) if(visR(gt.x,gt.y)) drawables.push({depth:gt.x+gt.y, draw:()=>drawGrassTuftIso(gt)});
      for(const tr of rv.trees) if(visR(tr.x,tr.y)) drawables.push({depth:tr.x+tr.y, draw:()=>drawTreeIso(tr)});
      for(const o of rv.obstacles){ if(!o.isProp) continue; const cx=o.x+o.w/2, cy=o.y+o.h/2; if(visR(cx,cy)) drawables.push({depth:cx+cy, draw:()=>drawRvProp(o, clkR)}); }
      for(const d of rv.decor) if(visR(d.x,d.y)) drawables.push({depth:d.x+d.y-(d.k==='lily'?4:2), draw:()=>{ if(RV_DECOR_KINDS[d.k]) drawRvDecor(d, clkR); else drawDecorIso(d, clkR); }});
      drawables.push({depth:rv.northGate.x+rv.northGate.y, draw:()=>drawEdgeLabelIso(rv.northGate, 'DARK FOREST')});
      drawables.push({depth:rv.southGate.x+rv.southGate.y, draw:()=>drawSunArchIso(rv.southGate, clkR)});
      for(const sd of [-1,1]){
        const sg = rv.southGate;
        drawables.push({depth:sg.x+sd*170+sg.y-10+(sd<0?-75:75), draw:()=>drawSunArchFlank(sg, sd, clkR)});
        const bz = {k:'brazier', x:sg.x+sd*95, y:sg.y-60, s:1.3}; drawables.push({depth:bz.x+bz.y, draw:()=>drawMtnDeco(bz)});
        const bn = {k:'banner', x:sg.x+sd*140, y:sg.y-80, s:1.2}; drawables.push({depth:bn.x+bn.y, draw:()=>drawMtnDeco(bn)});
      }
      drawables.push({depth:rv.southGate.x+rv.southGate.y+1, draw:()=>drawEdgeLabelIso(rv.southGate, 'SUNLIT PLAINS')});
      drawables.push({depth:rv.caveGate.x+rv.caveGate.y, draw:()=>drawMinotaurCaveIso(rv.caveGate, clkR)});
      drawables.push({depth:rv.caveGate.x+rv.caveGate.y+2, draw:()=>drawEdgeLabelIso(rv.caveGate, 'MINOTAUR CAVE')});
      drawables.push({depth:rv.waypoint.x+rv.waypoint.y-1, draw:()=>drawWaypointIso(rv.waypoint, clkR, waypointLit())});
      drawables.push({depth:rv.waypoint.x+rv.waypoint.y, draw:()=>drawEdgeLabelIso(rv.waypoint, 'WAYPOINT')});
    }
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='sunlitplains'){
    if(g.sun){
      if(g.sun.rocks) for(const rk of g.sun.rocks) drawables.push({depth:rk.x+rk.y, draw:()=>drawPlainsRockIso(rk)});
      if(g.sun.grassTufts) for(const gt of g.sun.grassTufts) drawables.push({depth:gt.x+gt.y, draw:()=>drawGrassTuftIso(gt)});
      {
        const visS = (x,y)=>{ const i=toIso(x,y); return i.x>cam.x-260 && i.x<cam.x+W+260 && i.y>cam.y-330 && i.y<cam.y+H+240; };
        for(const o of g.sun.obstacles){ if(!o.isProp) continue; const cx=o.x+o.w/2, cy=o.y+o.h/2; if(visS(cx,cy)) drawables.push({depth:cx+cy, draw:()=>drawPropIso(o, g.clock||0)}); }
        if(g.sun.decor) for(const d of g.sun.decor) if(visS(d.x,d.y)) drawables.push({depth:d.x+d.y-2, draw:()=>drawDecorIso(d, g.clock||0)});
      }
      drawables.push({depth:g.sun.forestGate.x+g.sun.forestGate.y, draw:()=>drawEdgeLabelIso(g.sun.forestGate, 'RIVER VALLEY')});
      // Sunlit Plains' own dedicated waypoint -- always lit/pulsing, same
      // shared art/mechanism as Town's and Mountain Pass's.
      drawables.push({depth:g.sun.waypoint.x+g.sun.waypoint.y-1, draw:()=>drawWaypointIso(g.sun.waypoint, g.clock||0, waypointLit())});
      drawables.push({depth:g.sun.waypoint.x+g.sun.waypoint.y, draw:()=>drawEdgeLabelIso(g.sun.waypoint, 'WAYPOINT')});
      // v70: the west reserved exit is now the Lighthouse Tower gate.
      drawables.push({depth:g.sun.westGate.x+g.sun.westGate.y, draw:()=>drawLighthouseTowerIso(g.sun.westGate, g.clock||0)});
      drawables.push({depth:g.sun.westGate.x+g.sun.westGate.y+1, draw:()=>drawEdgeLabelIso(g.sun.westGate, 'LIGHTHOUSE TOWER')});
      // v71: the east reserved exit is now the Lakeside Ruins gate.
      drawables.push({depth:g.sun.eastGate.x+g.sun.eastGate.y, draw:()=>drawLakesideGateIso(g.sun.eastGate, g.clock||0)});
      drawables.push({depth:g.sun.eastGate.x+g.sun.eastGate.y+1, draw:()=>drawEdgeLabelIso(g.sun.eastGate, 'LAKESIDE RUINS')});
      // v72: the south reserved exit is now the Cursed Cemetery gate --
      // reuses the same crumbling-stone-archway art as the Lakeside Ruins
      // gate (both are "ruined stone" thresholds into a darker zone).
      drawables.push({depth:g.sun.southGate.x+g.sun.southGate.y, draw:()=>drawRuinsGateIso(g.sun.southGate, g.clock||0)});
      drawables.push({depth:g.sun.southGate.x+g.sun.southGate.y+1, draw:()=>drawEdgeLabelIso(g.sun.southGate, 'CURSED CEMETERY')});
      if(g.sun.graverobbers){ const gm = graverobbersMark(g.player); g.sun.graverobbers.forEach((r,i)=>drawables.push({depth:r.x+r.y, draw:()=>drawSimpleNpcIso(r, g.clock||0, {mark: gm && i===0})})); }
    }
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='lakesideruins'){
    if(g.lake){
      const visL = (x,y)=>{ const i=toIso(x,y); return i.x>cam.x-260 && i.x<cam.x+W+260 && i.y>cam.y-330 && i.y<cam.y+H+240; };
      if(g.lake.rocks) for(const rk of g.lake.rocks) drawables.push({depth:rk.x+rk.y, draw:()=>drawPlainsRockIso(rk)});
      if(g.lake.grassTufts) for(const gt of g.lake.grassTufts) if(visL(gt.x,gt.y)) drawables.push({depth:gt.x+gt.y, draw:()=>drawGrassTuftIso(gt)});
      {
        for(const o of g.lake.obstacles){ if(!o.isProp || o.noDraw) continue; const cx=o.x+o.w/2, cy=o.y+o.h/2; if(visL(cx,cy)) drawables.push({depth:cx+cy, occluder:true, wx:cx, wy:cy, draw:()=>drawPropIso(o, g.clock||0)}); }
        if(g.lake.decor) for(const d of g.lake.decor) if(visL(d.x,d.y)) drawables.push({depth:d.x+d.y-(d.k==='lily'||d.k==='mistpatch'||d.k==='rune'?4:2), draw:()=>drawDecorIso(d, g.clock||0)});
      }
      // Zone-edge boundary marker trees -- see makeLakesideRuins' trees comment.
      if(g.lake.trees) for(const tr of g.lake.trees){ if(!visL(tr.x,tr.y)) continue; drawables.push({depth:tr.x+tr.y, draw:()=>(tr.dead ? drawDeadTreeIso(tr) : drawTreeIso(tr))}); }
      // The island's Stonehenge -- a fixed ring of standing stones, purely
      // decorative/atmospheric (see makeLakesideRuins' islandStones).
      if(g.lake.islandStones) for(const st of g.lake.islandStones) drawables.push({depth:st.x+st.y, draw:()=>drawLakesideStoneIso(st)});
      if(g.lake.ruinsSpot){
        const rs = g.lake.ruinsSpot;
        if(g.player.ruinsEntranceOpen){
          drawables.push({depth:rs.x+rs.y, draw:()=>drawTombIso(rs, g.clock||0, true, 'ruins')});
          drawables.push({depth:rs.x+rs.y+1, draw:()=>drawEdgeLabelIso(rs, 'ANCIENT RUINS')});
        } else {
          drawables.push({depth:rs.x+rs.y-1, draw:()=>drawRuinsSlabIso(rs, g.clock||0, canStudyRuins(g.player))});
        }
      }
      if(g.player.scholarMeet && !g.player.ruinsEntranceOpen){
        const ss = g.lake.scholarSpot;
        drawables.push({depth:ss.x+ss.y, draw:()=>drawSimpleNpcIso(ss, g.clock||0, {mark: !g.player.ruinsEvent})});
      }
      drawables.push({depth:g.lake.sunlitGate.x+g.lake.sunlitGate.y, draw:()=>drawLakesideGateIso(g.lake.sunlitGate, g.clock||0)});
      drawables.push({depth:g.lake.sunlitGate.x+g.lake.sunlitGate.y+1, draw:()=>drawEdgeLabelIso(g.lake.sunlitGate, 'SUNLIT PLAINS')});
      drawables.push({depth:g.lake.marshGate.x+g.lake.marshGate.y, draw:()=>drawRuinsGateIso(g.lake.marshGate, g.clock||0)});
      drawables.push({depth:g.lake.marshGate.x+g.lake.marshGate.y+1, draw:()=>drawEdgeLabelIso(g.lake.marshGate, 'BLACK MARSH')});
      if(!g.lake.waypoint.off){
        drawables.push({depth:g.lake.waypoint.x+g.lake.waypoint.y-1, draw:()=>drawWaypointIso(g.lake.waypoint, g.clock||0, waypointLit())});
        drawables.push({depth:g.lake.waypoint.x+g.lake.waypoint.y, draw:()=>drawEdgeLabelIso(g.lake.waypoint, 'WAYPOINT')});
      }
    }
    if(g.chest) drawables.push({depth:g.chest.x+g.chest.y, draw:()=>drawChestIso(g.chest)});
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='blackmarsh'){
    if(g.bm){
      const bm = g.bm;
      const vis = (x,y)=>{ const i=toIso(x,y); return i.x>cam.x-160 && i.x<cam.x+W+160 && i.y>cam.y-220 && i.y<cam.y+H+160; };
      for(const r of bm.reeds) if(vis(r.x,r.y)) drawables.push({depth:r.x+r.y, draw:()=>drawReedsIso(r)});
      for(const tr of bm.trees) if(vis(tr.x,tr.y)) drawables.push({depth:tr.x+tr.y, draw:()=>drawSwampTreeIso(tr)});
      drawables.push({depth:bm.house.x+bm.house.y, draw:()=>drawWitchHouseIso(bm.house)});
      drawables.push({depth:bm.cauldron.x+bm.cauldron.y, draw:()=>drawCauldronIso(bm.cauldron)});
      if(g.player.witchRescued){ const wn = {x:bm.cauldron.x+44, y:bm.cauldron.y+18}; drawables.push({depth:wn.x+wn.y, draw:()=>drawWitchIso(wn, g.clock||0, true)}); }
      drawables.push({depth:bm.westGate.x+bm.westGate.y, draw:()=>drawRuinsGateIso(bm.westGate, g.clock||0)});
      drawables.push({depth:bm.westGate.x+bm.westGate.y+1, draw:()=>drawEdgeLabelIso(bm.westGate, 'LAKESIDE RUINS')});
      if(bm.highGate){ drawables.push({depth:bm.highGate.x+bm.highGate.y, draw:()=>drawRuinsGateIso(bm.highGate, g.clock||0)}); drawables.push({depth:bm.highGate.x+bm.highGate.y+1, draw:()=>drawEdgeLabelIso(bm.highGate, 'BARREN HIGHLANDS')}); }
      drawables.push({depth:bm.eastGate.x+bm.eastGate.y, draw:()=>drawTowerDoorIso(bm.eastGate, g.clock||0)});
      drawables.push({depth:bm.eastGate.x+bm.eastGate.y+1, draw:()=>drawEdgeLabelIso(bm.eastGate, 'FORGOTTEN TOWER', 180)});
      drawables.push({depth:bm.poolGate.x+bm.poolGate.y, draw:()=>drawSinkholeGateIso(bm.poolGate, g.clock||0)});
      drawables.push({depth:bm.poolGate.x+bm.poolGate.y+1, draw:()=>drawEdgeLabelIso(bm.poolGate, 'MARSH POOL')});
      drawables.push({depth:bm.waypoint.x+bm.waypoint.y-1, draw:()=>drawWaypointIso(bm.waypoint, g.clock||0, waypointLit())});
      drawables.push({depth:bm.waypoint.x+bm.waypoint.y, draw:()=>drawEdgeLabelIso(bm.waypoint, 'WAYPOINT')});
    }
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='cursedcemetery'){
    if(g.cem){
      if(g.cem.deadTrees) for(const dt of g.cem.deadTrees) drawables.push({depth:dt.x+dt.y, draw:()=>drawDeadTreeIso(dt)});
      if(g.cem.graves) for(const gr of g.cem.graves) drawables.push({depth:gr.x+gr.y, draw:()=>drawGraveIso(gr)});
      drawables.push({depth:g.cem.sunlitGate.x+g.cem.sunlitGate.y, draw:()=>drawRuinsGateIso(g.cem.sunlitGate, g.clock||0)});
      drawables.push({depth:g.cem.sunlitGate.x+g.cem.sunlitGate.y+1, draw:()=>drawEdgeLabelIso(g.cem.sunlitGate, 'SUNLIT PLAINS')});
      if(g.cem.waypoint){ drawables.push({depth:g.cem.waypoint.x+g.cem.waypoint.y-1, draw:()=>drawWaypointIso(g.cem.waypoint, g.clock||0, waypointLit())});
      drawables.push({depth:g.cem.waypoint.x+g.cem.waypoint.y, draw:()=>drawEdgeLabelIso(g.cem.waypoint, 'WAYPOINT')}); }
      // The sealed tomb -- visually present from the very first visit,
      // its locked/unlocked visual state driven purely by p.cemeteryCleared
      // (see drawTombIso).
      drawables.push({depth:g.cem.statue.x+g.cem.statue.y+30, draw:()=>drawGraveStatueIso(g.cem.statue, g.clock||0, !!(g.cem.evt && g.cem.evt.stage>0), !!g.player.cemeteryCleared)});
      drawables.push({depth:g.cem.tomb.x+g.cem.tomb.y, draw:()=>drawTombIso(g.cem.tomb, g.clock||0, !!g.player.cemeteryCleared)});
      drawables.push({depth:g.cem.tomb.x+g.cem.tomb.y+1, draw:()=>drawEdgeLabelIso(g.cem.tomb, g.player.cemeteryCleared ? 'DARK CRYPT' : 'SEALED TOMB')});
    }
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='darkcrypt'){
    // v73: the real dungeon -- entry/exit gate (also drawn as a plain
    // stairs-up "you arrived here" fixture, same convention every Mine/
    // Spider-Lair/Bear-Cave/Lighthouse-Tower entrance uses), its own
    // waypoint, the ambient torch light-sources lining the corridors
    // (reusing the Mine's own drawMineSupport timber-and-torch fixture),
    // the permanent chest (only drawn once it hasn't been looted yet --
    // once p.darkCryptChestLooted flips, it simply vanishes rather than
    // being drawn "open", matching how every other one-shot pickup in this
    // game disappears once collected), and the usual enemies/loot/
    // followers/traps. The scene-wide darkness/fog-of-war overlay and each
    // living enemy's glowing-red-eye hint are handled separately, as a
    // screen-space post-process AFTER this whole isometric world is drawn
    // -- see the g.scene==='darkcrypt' block right after ctx.restore()
    // below.
    if(g.crypt){
      if(g.crypt.lights) for(const lt of g.crypt.lights) drawables.push({depth:lt.x+lt.y, draw:()=>drawMineSupport(lt.x, lt.y, 58)});
      drawables.push({depth:g.crypt.cemeteryGate.x+g.crypt.cemeteryGate.y-1, draw:()=>drawStairsUpIso(g.crypt.cemeteryGate, g.clock||0)});
      drawables.push({depth:g.crypt.cemeteryGate.x+g.crypt.cemeteryGate.y, draw:()=>drawEdgeLabelIso(g.crypt.cemeteryGate, 'CURSED CEMETERY')});
      for(const dr of [g.crypt.hallDoor, g.crypt.tombDoor]) drawables.push({depth:dr.x+dr.y-1, draw:()=>drawTombDoorIso(dr, g.clock||0)});
      drawables.push({depth:g.crypt.waypoint.x+g.crypt.waypoint.y-1, draw:()=>drawWaypointIso(g.crypt.waypoint, g.clock||0, waypointLit())});
      drawables.push({depth:g.crypt.waypoint.x+g.crypt.waypoint.y, draw:()=>drawEdgeLabelIso(g.crypt.waypoint, 'WAYPOINT')});
      if(g.crypt.returnPortal){
        const rp = g.crypt.returnPortal;
        drawables.push({depth:rp.x+rp.y-1, draw:()=>drawBluePortalIso(rp, g.clock||0)});
        drawables.push({depth:rp.x+rp.y, draw:()=>drawEdgeLabelIso(rp, 'CURSED CEMETERY')});
      }
      if(!g.player.darkCryptChestLooted && g.crypt.chestShown){
        drawables.push({depth:g.crypt.chestSpot.x+g.crypt.chestSpot.y, draw:()=>drawChestIso(g.crypt.chestSpot)});
      }
      if(g.crypt.tomb) drawables.push({depth:g.crypt.tomb.x+g.crypt.tomb.y+40, draw:()=>drawCryptTomb(g.crypt.tomb, g.clock||0)});
      for(const pe of g.enemies) if(pe.possessed && pe.hp>0) drawables.push({depth:pe.x+pe.y-1, draw:()=>drawPossessedAura(pe, g.clock||0)});
    }
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='ancientruins' && g.ruins && g.ruins.fhd){
    const R = g.ruins;
    drawables.push({depth:R.entrance.x+R.entrance.y-1, draw:()=>drawStairsUpIso(R.entrance, g.clock||0)});
    drawables.push({depth:R.entrance.x+R.entrance.y, draw:()=>drawEdgeLabelIso(R.entrance, R.floor===1 ? 'FROSTHOLD KEEP' : 'STAIRS UP')});
    if(R.waypoint){
      drawables.push({depth:R.waypoint.x+R.waypoint.y-1, draw:()=>drawWaypointIso(R.waypoint, g.clock||0, waypointLit())});
      drawables.push({depth:R.waypoint.x+R.waypoint.y, draw:()=>drawEdgeLabelIso(R.waypoint, 'WAYPOINT')});
    }
    if(R.stairsDown){
      drawables.push({depth:R.stairsDown.x+R.stairsDown.y-1, draw:()=>drawStairsDownIso(R.stairsDown, g.clock||0)});
      drawables.push({depth:R.stairsDown.x+R.stairsDown.y, draw:()=>drawEdgeLabelIso(R.stairsDown, 'STAIRS DOWN')});
    }
    if(R.returnPortal){
      drawables.push({depth:R.returnPortal.x+R.returnPortal.y-1, draw:()=>drawBluePortalIso(R.returnPortal, g.clock||0)});
      drawables.push({depth:R.returnPortal.x+R.returnPortal.y, draw:()=>drawEdgeLabelIso(R.returnPortal, 'FROSTHOLD KEEP')});
    }
    drawables.push({depth:-99998, draw:()=>drawFhdFx(R, g.clock||0)});
    if(R.husk) drawables.push({depth:R.husk.x+R.husk.y, draw:()=>drawDwConstructIso({x:R.husk.x, y:R.husk.y, r:115, dead:true, animT:0, hitT:0})});
    if(R.husk && !R.husk.taken){ drawables.push({depth:R.husk.x+R.husk.y+2, draw:()=>drawRunestoneBeacon(R.husk, g.clock||0)}); drawables.push({depth:R.husk.x+R.husk.y+3, draw:()=>drawEdgeLabelIso(R.husk, 'RUNESTONE', 250)}); }
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='ancientruins'){
    const R = g.ruins;
    if(R){
      if(R.floor===1){
        drawables.push({depth:R.entrance.x+R.entrance.y-1, draw:()=>drawStairsUpIso(R.entrance, g.clock||0)});
        drawables.push({depth:R.entrance.x+R.entrance.y, draw:()=>drawEdgeLabelIso(R.entrance, 'LAKESIDE RUINS')});
      } else {
        drawables.push({depth:R.entrance.x+R.entrance.y-1, draw:()=>drawStairsUpIso(R.entrance, g.clock||0)});
        drawables.push({depth:R.entrance.x+R.entrance.y, draw:()=>drawEdgeLabelIso(R.entrance, 'STAIRS UP')});
      }
      if(R.stairsDown){
        drawables.push({depth:R.stairsDown.x+R.stairsDown.y-1, draw:()=>drawStairsDownIso(R.stairsDown, g.clock||0)});
        drawables.push({depth:R.stairsDown.x+R.stairsDown.y, draw:()=>drawEdgeLabelIso(R.stairsDown, 'STAIRS DOWN')});
      }
      if(R.waypoint){
        drawables.push({depth:R.waypoint.x+R.waypoint.y-1, draw:()=>drawWaypointIso(R.waypoint, g.clock||0, waypointLit())});
        drawables.push({depth:R.waypoint.x+R.waypoint.y, draw:()=>drawEdgeLabelIso(R.waypoint, 'WAYPOINT')});
      }
      if(R.returnPortal){
        drawables.push({depth:R.returnPortal.x+R.returnPortal.y-1, draw:()=>drawBluePortalIso(R.returnPortal, g.clock||0)});
        drawables.push({depth:R.returnPortal.x+R.returnPortal.y, draw:()=>drawEdgeLabelIso(R.returnPortal, 'LAKESIDE RUINS')});
      }
      if(R.templeStairs){ drawables.push({depth:R.templeStairs.x+R.templeStairs.y-1, draw:()=>drawStairsDownIso(R.templeStairs, g.clock||0)}); drawables.push({depth:R.templeStairs.x+R.templeStairs.y, draw:()=>drawEdgeLabelIso(R.templeStairs, 'FLOODED TEMPLE')}); }
    }
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='raptorlair'){
    const R = g.rlair;
    if(R){
      drawables.push({depth:R.entrance.x+R.entrance.y-1, draw:()=>drawStairsUpIso(R.entrance, g.clock||0)});
      drawables.push({depth:R.entrance.x+R.entrance.y, draw:()=>drawEdgeLabelIso(R.entrance, R.floor===1?'REDRIDGE CANYON':'STAIRS UP')});
      if(R.stairsDown){
        drawables.push({depth:R.stairsDown.x+R.stairsDown.y-1, draw:()=>drawStairsDownIso(R.stairsDown, g.clock||0)});
        drawables.push({depth:R.stairsDown.x+R.stairsDown.y, draw:()=>drawEdgeLabelIso(R.stairsDown, 'STAIRS DOWN')});
      }
      if(R.returnPortal){
        drawables.push({depth:R.returnPortal.x+R.returnPortal.y-1, draw:()=>drawBluePortalIso(R.returnPortal, g.clock||0)});
        drawables.push({depth:R.returnPortal.x+R.returnPortal.y, draw:()=>drawEdgeLabelIso(R.returnPortal, 'REDRIDGE CANYON')});
      }
      const lrBoss = g.enemies.find(x=>x.lr);
      for(const rod of (R.rods||[])) drawables.push({depth:rod.x+rod.y, draw:()=>drawLightningRodIso(rod, lrBoss, g.clock||0)});
    }
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='lighthouse' && g.tower && g.tower.deep){
    const t = g.tower;
    if(t.floor===1){
      drawables.push({depth:t.entrance.x+t.entrance.y, draw:()=>drawMineEntranceIso(t.entrance, g.clock||0)});
      drawables.push({depth:t.entrance.x+t.entrance.y+1, draw:()=>drawEdgeLabelIso(t.entrance, 'MOUNTAIN PASS')});
      if(t.camp){
        const cp = t.camp, ck = g.clock||0;
        drawables.push({depth:cp.x-100+cp.y-70, draw:()=>drawMinerTent(cp.x-100, cp.y-70, '#7a6648')});
        drawables.push({depth:cp.x+105+cp.y-84, draw:()=>drawMinerTent(cp.x+105, cp.y-84, '#5a6a5a')});
        drawables.push({depth:cp.x+cp.y-1, draw:()=>drawMinerFire(cp.x, cp.y, ck)});
        drawables.push({depth:cp.x-140+cp.y+30, draw:()=>drawMinerCrate(cp.x-140, cp.y+30, '#6a4e30')});
        drawables.push({depth:cp.x-118+cp.y+46, draw:()=>drawMinerCrate(cp.x-118, cp.y+46, '#5a4228')});
      }
      if(g.miners) for(const m of g.miners) drawables.push({depth:m.x+m.y, draw:()=>drawSimpleNpcIso(m, g.clock||0, {mark: m.foreman && !g.minerRun && ((g.player.minerQ||0)===0 || (g.player.minerQ||0)===2)})});
    } else {
      drawables.push({depth:t.entrance.x+t.entrance.y-1, draw:()=>drawStairsUpIso(t.entrance, g.clock||0)});
      drawables.push({depth:t.entrance.x+t.entrance.y, draw:()=>drawEdgeLabelIso(t.entrance, 'STAIRS UP')});
    }
    if(t.stairs){
      drawables.push({depth:t.stairs.x+t.stairs.y-1, draw:()=>drawStairsDownIso(t.stairs, g.clock||0)});
      drawables.push({depth:t.stairs.x+t.stairs.y, draw:()=>drawEdgeLabelIso(t.stairs, 'STAIRS DOWN')});
    }
    if(t.clearPortal){
      drawables.push({depth:t.clearPortal.x+t.clearPortal.y-1, draw:()=>drawBluePortalIso(t.clearPortal, g.clock||0)});
      drawables.push({depth:t.clearPortal.x+t.clearPortal.y, draw:()=>drawEdgeLabelIso(t.clearPortal, 'MISTFALL')});
    }
    if(t.waypoint){ drawables.push({depth:t.waypoint.x+t.waypoint.y-1, draw:()=>drawWaypointIso(t.waypoint, g.clock||0, waypointLit())}); drawables.push({depth:t.waypoint.x+t.waypoint.y, draw:()=>drawEdgeLabelIso(t.waypoint, 'WAYPOINT')}); }   // v489: Ember Caverns
    drawables.push({depth:-99999, draw:()=>drawBlasts(g)});
    if(g.chest) drawables.push({depth:g.chest.x+g.chest.y, draw:()=>drawChestIso(g.chest)});
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='lighthouse' && g.tower && g.tower.subzone){
    const t = g.tower, vis = (x,y)=>{ const i=toIso(x,y); return i.x>cam.x-200 && i.x<cam.x+W+200 && i.y>cam.y-260 && i.y<cam.y+H+200; };
    if(t.rocks) for(const rk of t.rocks) if(vis(rk.x,rk.y)) drawables.push({depth:rk.x+rk.y, draw:()=>drawPlainsRockIso(rk)});
    if(t.crystals) for(const c of t.crystals) if(vis(c.x,c.y)) drawables.push({depth:c.x+c.y, draw:()=>drawGrottoCrystalIso(c, g.clock||0)});
    if(t.horde) for(const hd of t.horde) if(vis(hd.x,hd.y)) drawables.push({depth:hd.x+hd.y-2, draw:()=>drawGoldHordeIso(hd)});
    if(t.extraChest && vis(t.extraChest.x,t.extraChest.y)) drawables.push({depth:t.extraChest.x+t.extraChest.y, draw:()=>drawChestIso(t.extraChest)});
    if(t.reeds) for(const r of t.reeds) if(vis(r.x,r.y)) drawables.push({depth:r.x+r.y, draw:()=>drawReedsIso(r)});
    if(t.trees) for(const tr of t.trees) if(vis(tr.x,tr.y)) drawables.push({depth:tr.x+tr.y, draw:()=>drawSwampTreeIso(tr)});
    const postLos = (g._postLos = []), ePush = (t.subzone==='highward') ? postLos : drawables;   // v425: Highward gates/portals/labels draw in front of the LOS shadow
    ePush.push({depth:t.entrance.x+t.entrance.y, draw:()=>drawSubEntranceIso(t, g.clock||0)});
    ePush.push({depth:t.entrance.x+t.entrance.y+1, draw:()=>drawEdgeLabelIso(t.entrance, t.subzone==='sunken' ? 'FLOODED TEMPLE' : t.subzone==='temple' ? 'ANCIENT RUINS' : t.subzone==='rrtower' ? ((t.rrFloor||1)>1 ? 'STAIRS DOWN' : 'LEAVE TOWER') : t.subzone==='highward' ? (t.hwFloor===1 ? 'REDRIDGE CANYON' : 'STAIRS DOWN') : t.subzone==='keep' ? (KP_ENT_LBL[t.kpArea]||'BACK') : 'BLACK MARSH', (t.subzone==='highward' && t.hwFloor===1) ? 132 : undefined)});
    if(t.templeDeco){
      for(const st of t.templeDeco.statues) if(vis(st.x,st.y)) drawables.push({depth:st.x+st.y, draw:()=>drawTempleStatueIso(st)});
      for(const b of t.templeDeco.braziers) if(vis(b.x,b.y)) drawables.push({depth:b.x+b.y, draw:()=>drawTempleBrazierIso(b, g.clock||0)});
      if(vis(t.templeDeco.altar.x, t.templeDeco.altar.y)) drawables.push({depth:t.templeDeco.altar.x+t.templeDeco.altar.y, draw:()=>drawTempleAltarIso(t.templeDeco.altar)});
    }
    if(t.waypoint && t.subzone==='temple'){ drawables.push({depth:t.waypoint.x+t.waypoint.y-1, draw:()=>drawWaypointIso(t.waypoint, g.clock||0, waypointLit())}); drawables.push({depth:t.waypoint.x+t.waypoint.y, draw:()=>drawEdgeLabelIso(t.waypoint, 'WAYPOINT')}); }
    if(t.subzone==='highward'){
      if(t.waypoint){ drawables.push({depth:t.waypoint.x+t.waypoint.y-1, draw:()=>drawWaypointIso(t.waypoint, g.clock||0, waypointLit())}); drawables.push({depth:t.waypoint.x+t.waypoint.y, draw:()=>drawEdgeLabelIso(t.waypoint, 'WAYPOINT')}); }
      if(t.hwUp){ drawables.push({depth:t.hwUp.x+t.hwUp.y-1, draw:()=>drawStairsUpIso(t.hwUp, g.clock||0)}); drawables.push({depth:t.hwUp.x+t.hwUp.y, draw:()=>drawEdgeLabelIso(t.hwUp, 'STAIRS UP')}); }
      if(t.hwDeco) for(const dc of t.hwDeco) if(vis(dc.x,dc.y)) drawables.push({depth:dc.x+dc.y, draw:()=>(dc.type==='brazier' ? drawHwBrazier(dc, g.clock||0) : dc.type==='statue' ? drawHwStatueIso(dc) : drawHwCrossIso(dc))});
      if(t.chests) for(const c of t.chests) if(vis(c.x,c.y)) drawables.push({depth:c.x+c.y, draw:()=>drawChestIso(c)});
      if(t.altar){ drawables.push({depth:t.altar.x+t.altar.y, draw:()=>drawHwAltarIso(t.altar, hwAltarReady(g.player), !!g.player.hwRuneTaken, g.clock||0)}); drawables.push({depth:t.altar.x+t.altar.y+1, draw:()=>drawEdgeLabelIso(t.altar, g.player.hwRuneTaken?'EMPTY ALTAR':'ALTAR OF THE RUNESTONE', 112)}); }
      if(t.hwReturn && g.player.hwSwitchOn){ const rp = t.hwReturn; postLos.push({depth:rp.x+rp.y, draw:()=>{ const io = toIso(rp.x,rp.y); drawShadow(io.x, io.y, 40, 14); ctx.save(); ctx.translate(io.x, io.y); drawGoldPortal(0,-46,30,52,g.clock||0,true); ctx.restore(); }}); postLos.push({depth:rp.x+rp.y+1, draw:()=>drawEdgeLabelIso(rp, 'PORTAL TO FLOOR 1', 120)}); }
      if(t.hwSwitch){ drawables.push({depth:t.hwSwitch.x+t.hwSwitch.y, draw:()=>drawHwSwitchIso(t.hwSwitch, !!g.player.hwSwitchOn, hwSwitchReady(g.player), g.clock||0)}); drawables.push({depth:t.hwSwitch.x+t.hwSwitch.y+1, draw:()=>drawEdgeLabelIso(t.hwSwitch, 'GATE SWITCH', 70)}); }
      if(t.eastGates) for(const gt of t.eastGates){ const open = !!g.player.hwSwitchOn; postLos.push({depth:gt.x+gt.y, draw:()=>drawHwGateIso(gt, open, g.clock||0)}); postLos.push({depth:gt.x+gt.y+1, draw:()=>drawEdgeLabelIso(gt, open?'EAST PORTAL':'SEALED', 132)}); }
    }
    if(t.subzone==='keep'){
      if(t.waypoint){ drawables.push({depth:t.waypoint.x+t.waypoint.y-1, draw:()=>drawWaypointIso(t.waypoint, g.clock||0, waypointLit())}); drawables.push({depth:t.waypoint.x+t.waypoint.y, draw:()=>drawEdgeLabelIso(t.waypoint, 'WAYPOINT')}); }
      if(t.kpArea===7 && t.breach && g.player.breachContained && (g.holdShrinkV||0)>0.9){ drawables.push({depth:t.breach.x+t.breach.y-1, draw:()=>drawHellPortal(t.breach, g.clock||0)}); drawables.push({depth:t.breach.x+t.breach.y, draw:()=>drawEdgeLabelIso(t.breach, 'THE BREACH', 112)}); }
      if(t.exitPending && !t.exitDoor){ drawables.push({depth:t.exitPending.x+t.exitPending.y-1, draw:()=>{ ctx.save(); ctx.globalAlpha = 0.3; drawHellPortal(t.exitPending, g.clock||0); ctx.restore(); }}); drawables.push({depth:t.exitPending.x+t.exitPending.y, draw:()=>drawEdgeLabelIso(t.exitPending, 'SEALED — SLAY THE GUARDIANS', 112)}); }
      if(t.exitDoor){ drawables.push({depth:t.exitDoor.x+t.exitDoor.y-1, draw:()=>(t.hell ? drawHellPortal(t.exitDoor, g.clock||0) : drawKeepDoor(t.exitDoor, g.clock||0))}); drawables.push({depth:t.exitDoor.x+t.exitDoor.y, draw:()=>drawEdgeLabelIso(t.exitDoor, (KP_EXIT_LBL[t.kpArea]||'ONWARD'), 112)}); }
      if(t.clearPortal){ drawables.push({depth:t.clearPortal.x+t.clearPortal.y-1, draw:()=>drawBluePortalIso(t.clearPortal, g.clock||0)}); drawables.push({depth:t.clearPortal.x+t.clearPortal.y, draw:()=>drawEdgeLabelIso(t.clearPortal, 'MISTFALL')}); }
      if(t.holdStairs){ drawables.push({depth:t.holdStairs.x+t.holdStairs.y-1, draw:()=>drawStairsDownIso(t.holdStairs, g.clock||0)}); drawables.push({depth:t.holdStairs.x+t.holdStairs.y, draw:()=>drawEdgeLabelIso(t.holdStairs, (t.beacons && !t.beacons.every(b=>b.lit)) ? 'SEALED \u2014 LIGHT THE BEACONS' : 'DEMON HOLD', 80)}); }
      for(const e of g.enemies) if(e.wlord || e.dboss) drawables.push({depth:-100000+e.x*0.001, draw:()=>drawWlTelegraph(e)});
      for(const e of g.enemies) if(e.balrog && e.brBoss) drawables.push({depth:-100000+e.x*0.001, draw:()=>drawBalrogTelegraph(e)});
      if(t.beacons) for(const bc of t.beacons) if(vis(bc.x,bc.y)){ drawables.push({depth:bc.x+bc.y, draw:()=>drawRRBeaconIso(bc, g.clock||0, bc.lit)}); drawables.push({depth:bc.x+bc.y+1, draw:()=>drawEdgeLabelIso(bc, bc.lit?'BEACON LIT':'BEACON')}); }
      for(const pr of t.props) if(vis(pr.x,pr.y)) drawables.push({depth:pr.x+pr.y+(pr.kind==='sigil'||pr.kind==='breach'||pr.kind==='carpet'?-500:0)+((pr.kind==='pew'||pr.kind==='machine'||KP_BLK[pr.kind])?(pr.w+pr.h)/2:0), draw:()=>drawKeepProp(pr, g.clock||0)});
    }
    if(t.subzone==='rrtower'){
      const lit = !!(g.player.rrBeacons && g.player.rrBeacons[t.rrId]);
      if(t.rrBeacon){ drawables.push({depth:t.rrBeacon.x+t.rrBeacon.y, draw:()=>drawRRBeaconIso(t.rrBeacon, g.clock||0, lit)});
      drawables.push({depth:t.rrBeacon.x+t.rrBeacon.y+1, draw:()=>drawEdgeLabelIso(t.rrBeacon, lit?'BEACON LIT':'BEACON')}); }
      if(t.exitPortal){ const ep = t.exitPortal; drawables.push({depth:ep.x+ep.y-1, draw:()=>drawBluePortalIso(ep, g.clock||0)}); drawables.push({depth:ep.x+ep.y, draw:()=>drawEdgeLabelIso(ep, 'REDRIDGE CANYON')}); }   // v490
      if(t.rrUp){ drawables.push({depth:t.rrUp.x+t.rrUp.y-1, draw:()=>drawStairsUpIso(t.rrUp, g.clock||0)}); drawables.push({depth:t.rrUp.x+t.rrUp.y+1, draw:()=>drawEdgeLabelIso(t.rrUp, 'STAIRS UP · FLOOR '+((t.rrFloor||1)+1))}); }
      for(const v of t.vents) if(vis(v.x,v.y)) drawables.push({depth:v.x+v.y-2, draw:()=>drawRRVentIso(v, g.clock||0)});
      for(const l of t.ladders) if(vis(l.x,l.y)) drawables.push({depth:l.x+l.y, draw:()=>drawRRLadderIso(l)});
      for(const pr of t.props) if(vis(pr.x,pr.y)) drawables.push({depth:pr.x+pr.y, draw:()=>drawRRTowerProp(pr)});
    }
    if(t.stairsDown){ drawables.push({depth:t.stairsDown.x+t.stairsDown.y-1, draw:()=>drawStairsDownIso(t.stairsDown, g.clock||0)}); drawables.push({depth:t.stairsDown.x+t.stairsDown.y, draw:()=>drawEdgeLabelIso(t.stairsDown, 'SUNKEN DEPTHS')}); }
    if(t.clearPortal){
      drawables.push({depth:t.clearPortal.x+t.clearPortal.y-1, draw:()=>drawBluePortalIso(t.clearPortal, g.clock||0)});
      drawables.push({depth:t.clearPortal.x+t.clearPortal.y, draw:()=>drawEdgeLabelIso(t.clearPortal, 'MISTFALL')});
    }
    if(g.chest) drawables.push({depth:g.chest.x+g.chest.y, draw:()=>drawChestIso(g.chest)});
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='lighthouse' && g.tower && g.tower.fht){
    const t = g.tower;
    if(t.floor===1){
      drawables.push({depth:t.entrance.x+t.entrance.y, draw:()=>drawLighthouseDoorIso(t.entrance, g.clock||0)});
      drawables.push({depth:t.entrance.x+t.entrance.y+1, draw:()=>drawEdgeLabelIso(t.entrance, 'FROSTHOLD KEEP')});
    } else {
      drawables.push({depth:t.entrance.x+t.entrance.y-1, draw:()=>drawStairsUpIso(t.entrance, g.clock||0)});
      drawables.push({depth:t.entrance.x+t.entrance.y, draw:()=>drawEdgeLabelIso(t.entrance, 'STAIRS DOWN')});
    }
    if(t.stairs){
      drawables.push({depth:t.stairs.x+t.stairs.y-1, draw:()=>drawStairsDownIso(t.stairs, g.clock||0)});
      drawables.push({depth:t.stairs.x+t.stairs.y, draw:()=>drawEdgeLabelIso(t.stairs, 'STAIRS UP')});
    }
    if(t.clearPortal){   // v490: the Commander's way out was never drawn in the tower
      drawables.push({depth:t.clearPortal.x+t.clearPortal.y-1, draw:()=>drawBluePortalIso(t.clearPortal, g.clock||0)});
      drawables.push({depth:t.clearPortal.x+t.clearPortal.y, draw:()=>drawEdgeLabelIso(t.clearPortal, 'FROSTHOLD KEEP')});
    }
    if(g.chest) drawables.push({depth:g.chest.x+g.chest.y, draw:()=>drawChestIso(g.chest)});
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='lighthouse'){
    const t = g.tower;
    if(t){
      if(t.floor===1){
        // Floor 1's entrance doubles as the gate back to Sunlit Plains,
        // same "the arrival gate is also the exit" convention every other
        // zone-transition gate follows.
        drawables.push({depth:t.entrance.x+t.entrance.y, draw:()=>drawLighthouseDoorIso(t.entrance, g.clock||0)});
        drawables.push({depth:t.entrance.x+t.entrance.y+1, draw:()=>drawEdgeLabelIso(t.entrance, t.ft ? 'BLACK MARSH' : 'SUNLIT PLAINS')});
      } else {
        // Floors 2-5: a purely decorative stairway-up marks where the
        // player arrived, same non-interactive fixture drawStairsUpIso
        // already draws at every Mine/Spider-Lair/Bear-Cave entrance.
        drawables.push({depth:t.entrance.x+t.entrance.y-1, draw:()=>drawStairsUpIso(t.entrance, g.clock||0)});
        drawables.push({depth:t.entrance.x+t.entrance.y, draw:()=>drawEdgeLabelIso(t.entrance, 'STAIRS DOWN')});
      }
      if(t.stairs){
        // Floors 1-4's PERMANENT stairs up to the next floor -- fixed at
        // the same spot every time this floor is (re)entered, unlike the
        // Mine's stairs-down, which only appear once the floor is cleared.
        drawables.push({depth:t.stairs.x+t.stairs.y-1, draw:()=>drawStairsDownIso(t.stairs, g.clock||0)});
        drawables.push({depth:t.stairs.x+t.stairs.y, draw:()=>drawEdgeLabelIso(t.stairs, 'STAIRS UP')});
      }
      if(t.witch) drawables.push({depth:t.witch.x+t.witch.y, draw:()=>drawWitchIso(t.witch, g.clock||0, !game.enemies.some(e=>e.hp>0 && e.ftGuard))});
      if(t.beacon){
        // The rooftop's big light-feature centerpiece.
        drawables.push({depth:t.beacon.x+t.beacon.y, draw:()=>drawLighthouseBeaconIso(t.beacon, g.clock||0, !!g.player.lighthouseBeaconOn)});
      }
      if(t.waypoint){
        drawables.push({depth:t.waypoint.x+t.waypoint.y-1, draw:()=>drawWaypointIso(t.waypoint, g.clock||0, waypointLit())});
        drawables.push({depth:t.waypoint.x+t.waypoint.y, draw:()=>drawEdgeLabelIso(t.waypoint, 'WAYPOINT')});
      }
      if(t.clearPortal){
        // The rooftop's one-time post-clear portal back to Sunlit Plains --
        // reuses the same swirling blue-portal art Town's own permanent
        // waypoint uses once unlocked.
        drawables.push({depth:t.clearPortal.x+t.clearPortal.y-1, draw:()=>drawBluePortalIso(t.clearPortal, g.clock||0)});
        drawables.push({depth:t.clearPortal.x+t.clearPortal.y, draw:()=>drawEdgeLabelIso(t.clearPortal, t.fht ? 'FROSTHOLD KEEP' : (t.ft) ? (t.clearPortal.toTown ? 'MISTFALL' : 'BLACK MARSH') : 'SUNLIT PLAINS')});
      }
    }
    if(g.chest) drawables.push({depth:g.chest.x+g.chest.y, draw:()=>drawChestIso(g.chest)});
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies) pushEnemyDrawables(drawables, e);
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  } else if(g.scene==='tavern'){
    const tv = g.tavern;
    if(tv){
      if(tv.level==='main'){
        // Depth uses the counter's CENTER (matching the bed/obstacle
        // occluder pattern below), not just its near corner -- so it
        // sorts consistently against the barkeeper/other props sharing
        // this room instead of a one-off formula.
        drawables.push({depth:(tv.barCounter.x+tv.barCounter.w/2)+(tv.barCounter.y+tv.barCounter.h/2), occluder:true, wx:tv.barCounter.x+tv.barCounter.w/2, wy:tv.barCounter.y+tv.barCounter.h/2, draw:()=>drawBlock(tv.barCounter, 30, '#6b4a2e','#3a2818','#4a3220')});
        // The Barkeeper now stands behind his own counter -- reuses the
        // same NPC rig as his outdoor spot (and the Old Man's), simple
        // recolor/reuse per the brief, just repositioned indoors. His spot
        // sits north of (outside) the counter's footprint, so the normal
        // x+y depth sort already draws him behind it, in the clear, with
        // no special-cased z-order needed.
        drawables.push({depth:tv.barkeeperSpot.x+tv.barkeeperSpot.y, draw:()=>drawBarkeeperIso(tv.barkeeperSpot, g.clock||0, barkeeperHasIndicator(game.player))});
        // Bard and Gambler: purely decorative, reusing the same generic
        // humanoid rig -- no quest/vendor function, matching the brief's
        // "simple/decorative is fine" allowance.
        drawables.push({depth:tv.bard.x+tv.bard.y, draw:()=>drawBardIso(tv.bard, g.clock||0)});
        drawables.push({depth:tv.gambler.x+tv.gambler.y, draw:()=>drawGamblerIso(tv.gambler, g.clock||0)});
        if(scholarInTavern(g.player)) drawables.push({depth:tv.scholar.x+tv.scholar.y, draw:()=>drawSimpleNpcIso(tv.scholar, g.clock||0, {mark:scholarMark(g.player)})});
        // A small table beside the gambler -- same drawBlock-based prop
        // pattern as the bar counter/beds, occluder-tagged the same way.
        drawables.push({depth:(tv.gamblerTable.x+tv.gamblerTable.w/2)+(tv.gamblerTable.y+tv.gamblerTable.h/2), occluder:true, wx:tv.gamblerTable.x+tv.gamblerTable.w/2, wy:tv.gamblerTable.y+tv.gamblerTable.h/2, draw:()=>drawTableIso(tv.gamblerTable)});
        drawables.push({depth:tv.stairsUp.x+tv.stairsUp.y-1, draw:()=>drawTavernStairsIso(tv.stairsUp, g.clock||0)});
        drawables.push({depth:tv.stairsUp.x+tv.stairsUp.y, draw:()=>drawEdgeLabelIso(tv.stairsUp, 'UPSTAIRS', 80)});
        drawables.push({depth:tv.exit.x+tv.exit.y-1, draw:()=>drawTavernDoorIso(tv.exit, g.clock||0)});
        drawables.push({depth:tv.exit.x+tv.exit.y, draw:()=>drawEdgeLabelIso(tv.exit, 'MISTFALL', 80)});
      } else {
        for(const bed of tv.beds) drawables.push({depth:(bed.x+bed.w/2)+(bed.y+bed.h/2), occluder:true, wx:bed.x+bed.w/2, wy:bed.y+bed.h/2, draw:()=>drawBedIso(bed)});
        drawables.push({depth:tv.stairsDown.x+tv.stairsDown.y-1, draw:()=>drawTavernStairsIso(tv.stairsDown, g.clock||0)});
        drawables.push({depth:tv.stairsDown.x+tv.stairsDown.y, draw:()=>drawEdgeLabelIso(tv.stairsDown, 'DOWNSTAIRS', 80)});
      }
    }
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
  } else {
    const lairScene = (g.scene==='spiderlair'||g.scene==='bearcave'||g.scene==='minotaurcave');
    if(room.entranceSpawn) drawables.push({depth:room.entranceSpawn.x+room.entranceSpawn.y-1, draw:()=> drawStairsUpIso(room.entranceSpawn, g.clock||0)});   // v474: lairs climb back out by stairs, like every other dungeon
    if(room.entranceSpawn && (g.scene==='spiderlair'||g.scene==='bearcave'||g.scene==='minotaurcave')) drawables.push({depth:room.entranceSpawn.x+room.entranceSpawn.y, draw:()=>drawEdgeLabelIso(room.entranceSpawn, 'EXIT', 70)});
    if(g.portal && lairScene){
      drawables.push({depth:g.portal.x+g.portal.y-1, draw:()=>drawBluePortalIso(g.portal, g.clock||0)});
      drawables.push({depth:g.portal.x+g.portal.y, draw:()=>drawEdgeLabelIso(g.portal, 'EXIT', 70)});
    } else if(g.portal) drawables.push({depth:g.portal.x+g.portal.y-1, draw:()=>drawStairsDownIso(g.portal, g.clock||0)});
    if(g.scene==='spiderlair' && g.spiderLairHunter && !g.spiderLairHunter.found){
      const h = g.spiderLairHunter;
      drawables.push({depth:h.x+h.y, draw:()=>drawHunterIso(h, g.clock||0)});
    }
    if(g.scene==='bearcave' && g.bearCaveHunter && !g.bearCaveHunter.found){
      const h = g.bearCaveHunter;
      drawables.push({depth:h.x+h.y, draw:()=>drawHunterIso(h, g.clock||0)});
    }
    if(g.chest) drawables.push({depth:g.chest.x+g.chest.y, draw:()=>drawChestIso(g.chest)});
    for(const l of g.loot) drawables.push({depth:l.x+l.y-1, draw:()=>drawLootIso(l, g.clock||0)});
    for(const e of g.enemies){
      if(e.isBoss && e.slamState==='telegraph'){
        drawables.push({depth:e.slamPos.x+e.slamPos.y-1, draw:()=>drawSlamRingIso(e.slamPos, e.slamTelegraphT)});
      }
      if(e.rev && (e.rvZones.length || e.rvState==='slamTele' || e.rvState==='raise')) drawables.push({depth:e.x+e.y-2, draw:()=>drawRevenantTelegraph(e)});
      if(e.windT>0) drawables.push({depth:e.x+e.y-1, draw:()=>drawEnemyTell(e)});
  if((e.type==='bear'||e.type==='ram') && e.chargeState==='wind') drawables.push({depth:e.x+e.y-1, draw:()=>drawBearChargeLane(e)});
  if(e.type==='frozenzombie' && e.zChargeState==='wind') drawables.push({depth:e.x+e.y-1, draw:()=>drawBearChargeLane(e)});
  if(e.type==='boar' && e.boarChargeState==='wind') drawables.push({depth:e.x+e.y-1, draw:()=>drawBearChargeLane(e)});
      drawables.push({depth:e.x+e.y, draw:()=>drawEnemyIso(e)});
    }
    if(g.followers) for(const f of g.followers) drawables.push({depth:f.x+f.y, draw:()=>drawFollowerIso(f)}); pushNecroDrawables(g, drawables);
    if(g.traps) for(const tr of g.traps) drawables.push({depth:tr.x+tr.y-1, draw:()=>drawTrapIso(tr)});
    if(g.shieldThrow) drawables.push({depth:g.shieldThrow.x+g.shieldThrow.y, draw:()=>drawShieldThrowIso(g.shieldThrow)});
  }
  const playerDepth = p.x+p.y;
  if(p.hurricaneT>0){
    drawables.push({depth:playerDepth-90, draw:()=>drawHurricaneIso(p, g.clock||0, false)});
    drawables.push({depth:playerDepth+90, draw:()=>drawHurricaneIso(p, g.clock||0, true)});
  }
  drawables.push({depth:playerDepth, draw:()=>drawWithStatus(p, ()=>(p.cls==='ranger' ? drawRanger(p) : p.cls==='mystic' ? drawMystic(p) : drawWarrior(p)), true)});
  if(g.mirage && p.cls==='ranger'){ const m = g.mirage; drawables.push({depth:m.x+m.y, draw:()=>{
    const k = Math.min(1, m.t/0.4, ((g.clock||0)-m.born)/0.15+0.2);
    const ghost = Object.assign(Object.create(p), {x:m.x, y:m.y, facing:m.facing, faceSign:m.faceSign, dodging:false, moving:false, atkAnimT:0, castAnimT:0, hitFlash:0, vanishT:0, chillT:0, poisonT:0, burnT:0, charges:0, mirageAlpha:0.42*k});
    ctx.save(); try{ ctx.filter = 'saturate(0.35) brightness(1.35)'; }catch(e){} drawRanger(ghost); ctx.restore();
  }}); }
  if(p.skills && effectiveRank(p,'storm')>0) drawables.push({depth:playerDepth+2000, draw:()=>drawStormCloudIso(p, g.clock||0)});
  if(p.cls==='mystic' && (p.souls||0)>0 && p.skills && effectiveRank(p,'soulShield')>0) drawables.push({depth:playerDepth+0.5, draw:()=>drawSoulShieldOrbs(p, g.clock||0)});   // v489
  // ---- v86: item 7, behind-wall fade -----------------------------------
  // The painter's-algorithm depth sort just below is ALREADY what makes a
  // wall/building visually occlude the player when the player walks behind
  // it (any drawable with a higher x+y depth than the player simply paints
  // over them, no special-casing needed for that part). What was missing
  // is fading THAT SPECIFIC occluder once it's doing so, so the player
  // sprite doesn't just fully disappear.
  // APPROACH (documented, since this is the most open-ended item in the
  // batch): rather than a full screen-space bounding-box/point-in-polygon
  // hit test against every wall's actual drawn silhouette (accurate, but a
  // lot of geometry to duplicate out of drawBlock/drawBuildingIso just for
  // this), this uses a cheaper two-part proximity heuristic on the SAME
  // depth/iso-projection values the render loop already computes:
  //   1. depth gate: the occluder only counts if it draws AFTER the player
  //      (occluder.depth > playerDepth, i.e. the sort below will paint it
  //      on top) AND its depth is within OCCLUDE_DEPTH_WINDOW world-units
  //      of the player's own -- this is what keeps the effect scoped to a
  //      "middle-sized area of NEARBY obstructing objects" per the brief,
  //      rather than fading every wall in the room regardless of distance
  //      (a wall on the far side of a dungeon floor, well ahead of the
  //      player in depth order, is deliberately left fully opaque).
  //   2. screen gate: the occluder's iso screen-space X must land within
  //      OCCLUDE_SCREEN_X_RANGE px of the player's own iso screen X -- an
  //      object that's "ahead" in depth but off to the side (out of the
  //      player's actual screen column) doesn't visually cover the player
  //      even though it draws later, so it's left alone.
  // Together these approximate "is this specific object currently
  // standing between the camera and the player" closely enough for a
  // top-down isometric camera without needing per-object silhouette math,
  // and only ever touch the object actually doing the occluding (each
  // occluder is faded independently) -- never the whole scene.
  const FHB = (g.scene==='frosthold') || (g.scene==='lighthouse' && g.room && g.room.fht);   // v355: Frosthold walls fade over a much wider area (they were hiding enemies and items)
  const OCCLUDE_DEPTH_WINDOW = FHB ? 520 : 220;
  const OCCLUDE_SCREEN_X_RANGE = FHB ? 300 : 130;
  const OCCLUDE_ALPHA = FHB ? 0.3 : 0.38;
  const playerIsoPt = toIso(p.x, p.y);
  for(const d of drawables){
    if(!d.occluder) continue;
    if(d.depth <= playerDepth) continue;
    // v355: long walls are tested from their nearest point to the player, not their middle
    const owx = d.rect ? clamp(p.x, d.rect.x, d.rect.x+d.rect.w) : d.wx, owy = d.rect ? clamp(p.y, d.rect.y, d.rect.y+d.rect.h) : d.wy;
    if((d.rect ? owx+owy : d.depth) - playerDepth > OCCLUDE_DEPTH_WINDOW + (d.ext||0)*0.5 + (d.hz||0)) continue;
    const oIso = toIso(owx, owy);
    if(Math.abs(oIso.x - playerIsoPt.x) > OCCLUDE_SCREEN_X_RANGE + (d.ext||0)*0.6) continue;
    const originalDraw = d.draw;
    d.draw = function(){ ctx.save(); ctx.globalAlpha = OCCLUDE_ALPHA; originalDraw(); ctx.restore(); };
  }
  for(const gl of collectGlows(g, g.player)) drawables.push({depth:gl.x+gl.y-0.5, draw:()=>drawGlowIso(gl, g.clock||0)});
  drawRetribAura(g.player);
  drawBulwarkRing(g.player);
  drawJuggFx(g.player);
  drawParticlesIso(g.particles, 'ground');   // v323: banner + consecrate sit on the floor, under everyone
  if(g.banner && g.banner.fx) drawables.push({depth:g.banner.x+g.banner.y, draw:()=>drawParticlesIso([g.banner.fx], 'pole')});
  drawables.sort((a,b)=>a.depth-b.depth);
  moodSoftStroke = moodOn() && !moodLow() && !MOOD_DBG.noSoft;   // v470: soft outlines while the world and characters are drawn
  try{ for(const d of drawables) d.draw(); } finally { moodSoftStroke = false; }
  drawMoodGrade(g);   // v470: grade the world before spells, projectiles and numbers go on top

  drawProjectilesIso(g.projectiles);
  drawParticlesIso(g.particles);
  drawAimLineIso(p);

  ctx.restore();

  // v168: no fisheye warp anywhere -- dungeons stay flat; darkness comes from the vignette ring below
  drawSectionMask(g);
  if(losShadowScene(g)) drawLosShadow(g);
  if(g.wlFlashT>0) drawWhiteFlash(g);
  if(g.blackFx) drawBlackCover(g);
  if(g._postLos && g._postLos.length && g.scene==='lighthouse' && g.tower && g.tower.subzone==='highward'){
    ctx.save(); ctx.translate(-cam.x+shX, -cam.y+shY);
    g._postLos.sort((a,b)=>a.depth-b.depth); for(const d of g._postLos) d.draw();
    ctx.restore();
  }
  if(g.scene==='darkcrypt') drawDarkCryptOverlay(g, DARKCRYPT_PLAYER_LIGHT_R, true);
  else if(isUndergroundScene(g)){ const hrt = g.scene==='lighthouse' && g.room && g.room.deep===3; drawDarkCryptOverlay(g, UNDERGROUND_LIGHT_R*(hrt && heartEllD(g.player.x,g.player.y)<1.1 ? 1.45 : 1), false, hrt ? '#1c0503' : null); }
  else if(wlDarkFight(g)) drawDarkCryptOverlay(g, UNDERGROUND_LIGHT_R*0.9, false);   // v434: darkness closes in during the Wraith Lord fight (10% tighter than the caves)
  if(g.enemies && g.enemies.some(x=>x.dwc && (x.cState==='laser' || x.cState==='flatten'))){ ctx.save(); ctx.translate(-cam.x+shX, -cam.y+shY); for(const x of g.enemies) if(x.dwc) drawDwBeam(x); ctx.restore(); }   // v490: Construct's Furnace Beam glows over the dark
  else if(g.scene==='lighthouse' && !(g.room && g.room.subzone==='pool') && !kpOutdoor(g)) drawDungeonVignette(g);
  if(g.scene==='lighthouse' && g.room && g.room.bridge) drawBridgeGlow(g);
  drawRegionDarkening(g);
  if(isCliff(g) || kpOutdoor(g)) drawCliffStorm(g);
  if(g.scene==='icyzone' && g.iz && g.iz.cold) drawIcyOverlay(g);
  if(g.scene==='lighthouse' && g.room && g.room.subzone==='pool' && !g.over) drawPoolOverlay(g);
  if(g.scene==='lakesideruins' && g.lake && g.lake.event && g.lake.event.active) drawRuinsEventHud(g);
  if(g.scene==='lighthouse' && g.room && (g.room.deep>=2 || g.room.hell)) drawEmberOverlay(g);

  if(g.flashT>0){ ctx.fillStyle = 'rgba(255,250,235,'+Math.min(1,g.flashT)+')'; ctx.fillRect(0,0,W,H); }
  if(g.levelUpFlash>0){
    ctx.fillStyle = 'rgba(240,208,120,'+ (g.levelUpFlash*0.35) +')';
    ctx.fillRect(0,0,W,H);
  }

  drawFilmGrain(g);   // v470
  const msgEl = document.getElementById('msg');
  if(g.msgT>0){ msgEl.style.opacity = clamp(g.msgT,0,1); msgEl.textContent = g.msgText; msgEl.style.color = g.msgColor || ''; msgEl.style.top = Math.round(hudTextAnchor(true))+'px'; msgEl.style.transform = ''; }   // v441: every message line sits at the top under the HUD (and under a banner if one is up), never over the character
  else { msgEl.style.opacity = 0; }
}

