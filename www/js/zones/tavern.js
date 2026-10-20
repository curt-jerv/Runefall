// ---------------- Tavern interior (quest feature) ----------------
// A small, simple interior zone reached from Town's Tavern door only once
// the Barkeeper's quest (Light the Way) is complete -- see updateTown's
// nearTavernDoor gate. No prior "building interior" zone existed anywhere
// in the game to copy wholesale, so this reuses the closest fit: the
// Lighthouse Tower's own "small, fully walled, fixed-size room" shape
// (drawFloor/drawWalls, no floorRects, g.enemies always empty) rather
// than inventing a new rendering path. Two rooms (ground floor + an
// upstairs with beds) are modeled as g.tavern.level toggling between
// 'main'/'upstairs', exactly like g.lighthouseFloor toggles which of the
// Tower's 5 floors is current -- one shared g.tavern object, one of two
// fixed layouts active at a time, switched via the stairs trigger.
const TAVERN_INT_W = 640, TAVERN_INT_H = 480;
function makeTavernInterior(){
  const w = TAVERN_INT_W, h = TAVERN_INT_H;
  // Ground floor: entrance/exit near the bottom, bar counter along the
  // top-left, bard and gambler scattered around the room, stairs up in
  // the top-right corner.
  const exit = {x:w/2, y:h-50, r:30};
  const barCounter = {x:70, y:70, w:150, h:50};
  // Stood behind the counter's own back (north) edge -- outside its
  // footprint entirely, rather than inside/on top of it -- so the normal
  // x+y depth sort already paints him correctly (he's genuinely further
  // from the camera than the counter, the same rule every other npc/prop
  // in the room follows) instead of needing a one-off z-order hack.
  const barkeeperSpot = {x:145, y:48};
  const bard = {x:380, y:120};
  const gambler = {x:460, y:320};
  // A small table beside the gambler, reusing the same drawBlock-based
  // prop pattern as the bar counter/beds (see drawTableIso).
  const gamblerTable = {x:gambler.x-64, y:gambler.y-14, w:44, h:34};
  const stairsUp = {x:w-70, y:70, r:26};
  // Upstairs: a smaller room, just a landing with a couple of beds and
  // the stairs back down in the same corner they were reached from.
  const bedW=54, bedH=30;
  const beds = [ {x:80,y:80,w:bedW,h:bedH}, {x:80,y:160,w:bedW,h:bedH}, {x:w-80-bedW,y:h-140,w:bedW,h:bedH} ];
  const stairsDown = {x:w-70, y:70, r:26};
  return { w, h,
    // isFurniture: true -- excluded from the generic obstacle-block
    // render loop (see the `o.isWater` exclusion it already had) since
    // the bar counter gets its own distinct drawBlock call below; without
    // this it was being painted a SECOND time as a plain stone wall
    // block, right on top of (and hiding) the barkeeper standing near it.
    obstacles:[{x:barCounter.x,y:barCounter.y,w:barCounter.w,h:barCounter.h, isFurniture:true}],
    level:'main', exit, barCounter, barkeeperSpot, bard, gambler, scholar:{x:250,y:250,id:5,robe:'#2c4a78',long:true,tool:'book'}, gamblerTable, stairsUp, beds, stairsDown };
}
function enterTavern(){
  const g = game;
  g.scene = 'tavern';
  g.tavern = makeTavernInterior();
  g.tavern.level = 'main';
  // (tavern vendors now restock on the shared 3h clock, see vendorRestockCheck)
  g.room = g.tavern;
  g.player.x = g.tavern.exit.x; g.player.y = g.tavern.exit.y - 50;
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  showMsg('The Tavern', 1.4);
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}
// Ground floor <-> upstairs -- same fixed room, just swaps room.obstacles/
// the set of props drawn (see the g.scene==='tavern' render branch) and
// repositions the player beside whichever stairs they just used, same
// "arrive next to the landmark you came from" convention as every other
// transition in the game.
function tavernGoUpstairs(){
  const g = game;
  if(!g.tavern || g.tavern.level!=='main') return;
  g.tavern.level = 'upstairs';
  g.tavern.obstacles = g.tavern.beds.map(b=>({x:b.x,y:b.y,w:b.w,h:b.h}));
  g.player.x = g.tavern.stairsDown.x; g.player.y = g.tavern.stairsDown.y + 46;
  showMsg('Upstairs', 1.2);
  updateInteractPrompt(null);
}
function tavernGoDownstairs(){
  const g = game;
  if(!g.tavern || g.tavern.level!=='upstairs') return;
  g.tavern.level = 'main';
  g.tavern.obstacles = [{x:g.tavern.barCounter.x,y:g.tavern.barCounter.y,w:g.tavern.barCounter.w,h:g.tavern.barCounter.h}];
  g.player.x = g.tavern.stairsUp.x; g.player.y = g.tavern.stairsUp.y + 46;
  showMsg('The Tavern', 1.2);
  updateInteractPrompt(null);
}

