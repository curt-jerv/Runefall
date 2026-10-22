// ================= Shadow Keep (v291, Stage B) =================
// The Templars' castle above the Hold: Entrance Hall (1) -> Cloister (2, open to the storm, waypoint) -> Temple (3).
// Runs on the 'lighthouse' sub-zone rig like Highward (room.subzone = 'keep', room.kpArea = 1..3).
const KP_NAMES = ['Shadow Keep — Entrance Hall','Shadow Keep — Cloister','Shadow Keep — Temple','','','','The Demon Hold','Templar Containment Ring','The Breach'];
const DEM_PAL = {wp:['#4c3a4a','#1e1420','#2e2230'], fl:['#302630','#281e28','#3a2e3a','#2c2230']}, HOLD_PAL = {wp:['#52343a','#1c0e12','#2e1a20'], fl:['#2c1e22','#221418','#382a2e','#281c20']}, RING_PAL = {wp:['#5a5e72','#22242e','#363a4a'], fl:['#3a3c48','#30323e','#444654','#363844']};
const KP_EXIT_LBL = {1:'CLOISTER',2:'TEMPLE',3:'DEMON HOLD',7:'THE RING',9:'NEXT FLOOR'}, KP_ENT_LBL = {1:'CLIFFSIDE ASCENT',2:'ENTRANCE HALL',3:'CLOISTER',7:'TEMPLE',8:'DEMON HOLD'};
const KP_W = [5000,3200,5400,3000,3200,3100,2800,2000,2900], KP_H = [3100,2200,3200,1700,2000,1800,2000,1600,2000], KP_DEPTH = [61,63,65,65,66,67,68,68,69];
const KP_TYPES = {wraithling:1, poisonwalker:1, poisonsnake:1, shadowcultist:1, imp:1, wraithlord:1, hellhound:1, cinderfiend:1, brimstonebrute:1, demonboss:1};
const KP_LORE_TARGET = 8;
const KP_LORE = {
  hall_roll:{title:'Bronze Roll of Commanders', text:'A bronze roll of the Keep’s commanders, name after name down the ages. The last is cut out of the metal with a chisel, so deeply the wall behind is scarred. Someone has scratched beside it: “He was the best of us.”'},
  hall_mural:{title:'Mural — The Muster', text:'A faded mural: rank on rank of armored Templars kneeling before a commander whose sword is raised against a sky of black stars. Beneath it, in worn script: “We hold the Hold. Not for glory, but so that nothing below ever walks above.”'},
  hall_armory:{title:'Armory Ledger', text:'“Wards re-lit at dusk. Blades blessed. The Commander refused rest again; he stands vigil over the Hold’s seal every night. He says he can hear it.”\n\nThe next page is torn out.'},
  hall_barracks:{title:'A Soldier’s Last Entry', text:'“The Commander does not sleep. His armor is cold to the touch and his eyes do not catch the lamplight. We were told to wait for orders. No one has given an order in three days.”'},
  hall_chapel:{title:'Memorial Slab', text:'“Here lie those who held the gate the night the Commander turned.”\n\nDozens of names are carved below. Every one is dated the same night.'},
  cl_records:{title:'Templar Records', text:'Water-stained records, in a clerk’s hand:\n\n“The power beneath the Hold answered him. He called it the last ward; it called him by his name. By the third night he could no longer be told from it. We could not kill him — steel passed through him as through smoke.”\n\nThe Wraith Lord was a Templar commander, corrupted by the Demon Hold.'},
  cl_inscription:{title:'Inscription at the Statue', text:'Carved beneath a statue with no face:\n\n“The commander would not lay down his blade. So we bound his name beneath the dead.”'},
  cl_mural:{title:'Mural — The Binding', text:'A mural of the Binding: Templars chain a tall armored figure while a shaft of dark light waits below. Beneath, a sarcophagus under seven wards and a long stair: the Defiler’s Tomb, sealed under the Dark Crypt.'},
  cl_graves:{title:'The Cloister Graves', text:'Rows upon rows of graves. Every stone carries a Templar’s name and the same epitaph: “He did not die. He was taken.”'},
  cl_cell1:{title:'Scratched Into a Cell Wall', text:'“They put Brother Halvard here for saying the Commander was still alive in the tomb. Brother Halvard was right.”'},
  cl_cell2:{title:'A Ledger Left in a Cell', text:'“The Defiler’s Tomb was sealed with his name. Names can be unsaid. A thief with a pry bar need only say the right words — or none at all.”'},
  cl_sanct:{title:'The Desecrated Sanctuary', text:'The altar has been overturned and carved over with demon sigils. Fresh wax, old blood. A torn page in the dust:\n\n“The grave robber broke the seal. The essence is free. He has come home to finish what the Hold began.”'},
  tp_wards:{title:'Overwritten Wards', text:'Old Templar ward-marks line the nave, each overwritten by a demon glyph, carved deep and recently. The glyphs do not oppose the wards. They invert them.'},
  tp_tome:{title:'A Cultist’s Liturgy', text:'“Three to bind, three to loose. The Commander speaks through the stones, and beneath the stones the Door answers. It opens at the ninth bell.”'},
  tp_mural:{title:'Cracked Mural', text:'Three bearers stand at three sockets. Beneath them, in newer paint, a door is opening outward.'},
  tp_altar:{title:'The Sanctum Altar', text:'Three sockets in the altar: a shield, a sword, a cross.\n\nThe Wraith Lord has been using the awakened Runestones to reverse the ritual that bound the Hold. The ritual is already mostly complete. Below, the Demon Hold is opening.\n\nYour path is clear: descend into the Demon Hold and stop him.'},
  dg_wards:{title:'A Severed Ward-Pylon', text:'The Templar ward-pylons along this passage were not worn down. They were cut through, cleanly, at the base, by someone who knew exactly where each one was weakest.'},
  dg_cells:{title:'Scratched Into a Cell Door', text:'“The wraiths do not guard the prisoners. There are no prisoners. They guard what lies beneath the cells.”'},
  dg_crypt:{title:'Defiled Crypt Plaque', text:'“Rest them. Do not wake them. Do not let them be woken.”\n\nThe plaque has been struck from the wall and the sarcophagi beneath it stand open. The Templar dead walk the Keep now.'},
  dg_chains:{title:'The Chains', text:'Heavy chains run down the tunnel into the dark, every link inscribed with a ward. They were forged to hold something in. Now every ward on them has been inverted, and the chains pull the other way: they are carrying something up.'},
  dg_machine:{title:'Ritual Machinery', text:'Templar engineers built this machine to draw the Hold’s dark power into the earth and bind it there. Someone has turned every gear about. It no longer binds. It pours, and the breach beyond is wider for every turn.'},
  dg_late:{title:'The Last Entry', text:'A Templar’s hand, shaking: “If you are reading this, the Door is already open. We were too few. Go down. The old altar still stands in the Hold. Do not let the stones fall into his hands, and do not let him finish.”'},
  hd_gate:{title:'Inscription Over the Hold Gate', text:'“Here the Templars held the dark, and here they fell. Let whoever follows hold it better.”'},
  hd_altar:{title:'The Templar Altar', text:'A stone altar at the mouth of the Hold, three sockets worn smooth: the shield that guards, the sword that strikes, the cross that binds. A Templar has scratched into its base:\n\n“The dark cannot be destroyed. So we gave it one door to leave by, and we sat down in front of it. If the Door opens, the three stones go here. Then it can only open one way.”'},
};
function kpOutdoor(g){ return !!(g && g.scene==='lighthouse' && g.tower && g.tower.subzone==='keep' && g.tower.kpArea===2); }
function hasAllRunestones(p){
  const h = id=>hasQItem(p,id);
  return !!p.skGateOpen || ((h('templar_runestone')||h('templar_runestone_awake')) && h('frost_templar_runestone') && h('highward_runestone'));
}
function stormTick(g, dt){
  g.stormT = (g.stormT===undefined ? rand(4,9) : g.stormT) - dt;
  if(g.stormT<=0){ g.stormFlash = 1; g.stormFlash2 = Math.random()<0.5 ? 0.45 : 0; g.stormT = rand(7,17); g.boltX = rand(0.12,0.88); }
  g.stormFlash = Math.max(0, (g.stormFlash||0) - dt*2.4);
  if(g.stormFlash2>0){ g.stormFlash2 = Math.max(0, g.stormFlash2 - dt*1.2); if(g.stormFlash<=0.02 && g.stormFlash2>0.2){ g.stormFlash = 0.7; g.stormFlash2 = 0; } }
}
// ================= v427: castle interiors (BSP rooms with doors), hell floors, giant spiders =================
function makeGiantSpider(e){
  e.giant = true; e.r = 27; e.hp = e.maxHp = Math.round(e.maxHp*5.5); e.dmg *= 1.35; e.armor = 4; e.atkCdMax = 2.2; e.preferRange = 150;
  e.speed = rand(68,85); e.dmgType = 'poison'; e.color = '#3a2a4a';   // v486: keeps its old speed (regular spiders are now near-stationary)
  return e;
}
function kpBsp(rnd, X0, Y0, X1, Y1, o){
  const MINW = o.minW||440, MINH = o.minH||420, MAXL = o.maxL||780, T = 46, DOOR = o.door||176, CLR = o.clr||210, cy = o.cy;
  const leaves = [], splits = [];
  const rec = (x0,y0,x1,y1,depth)=>{
    const W = x1-x0, H = y1-y0, canV = W>=MINW*2, canH = H>=MINH*2;
    const want = (canV||canH) && (W>MAXL || H>MAXL || (depth<4 && rnd()<0.62));
    if(!want){ leaves.push({x0,y0,x1,y1}); return; }
    let vertical = (canV && !canH) ? true : (canH && !canV) ? false : (W/H>1.15 ? true : H/W>1.15 ? false : rnd()<0.5);
    if(!vertical){
      let c = Math.round((y0+H*(0.36+rnd()*0.28))/10)*10;
      const touch = (x0<=X0+1) || (x1>=X1-1);
      if(touch && Math.abs(c-cy)<CLR){
        const up = cy-CLR, dn = cy+CLR, okUp = up>=y0+MINH, okDn = dn<=y1-MINH;
        if(okUp && (!okDn || rnd()<0.5)) c = up; else if(okDn) c = dn; else if(canV) vertical = true; else { leaves.push({x0,y0,x1,y1}); return; }
      }
      if(!vertical){
        c = clamp(c, y0+MINH, y1-MINH);
        splits.push({vert:false, c, a:x0, b:x1, x0,y0,x1,y1});
        rec(x0,y0,x1,c,depth+1); rec(x0,c,x1,y1,depth+1); return;
      }
    }
    const c = clamp(Math.round((x0+W*(0.36+rnd()*0.28))/10)*10, x0+MINW, x1-MINW);
    splits.push({vert:true, c, a:y0, b:y1, x0,y0,x1,y1});
    rec(x0,y0,c,y1,depth+1); rec(c,y0,x1,y1,depth+1);
  };
  rec(X0,Y0,X1,Y1,0);
  for(const s of splits){
    const lo = s.a+DOOR/2+T, hi = s.b-DOOR/2-T, abut = [];
    for(const q of splits){
      if(q===s || q.vert===s.vert) continue;
      if(s.vert ? ((q.x0===s.c||q.x1===s.c) && q.c>s.a && q.c<s.b) : ((q.y0===s.c||q.y1===s.c) && q.c>s.a && q.c<s.b)) abut.push(q.c);
    }
    const bad = p=>abut.some(v=>Math.abs(v-p) < DOOR/2+T/2+26);
    const cand = []; for(let p=lo; p<=hi; p+=20) if(!bad(p)) cand.push(p);
    let d1;
    if(cand.length) d1 = cand[Math.floor(rnd()*cand.length)];
    else { let best = (lo+hi)/2, bd = -1; for(let p=lo; p<=hi; p+=10){ const md = abut.reduce((m,v)=>Math.min(m,Math.abs(v-p)),1e9); if(md>bd){ bd = md; best = p; } } d1 = best; }
    s.doors = [d1];
    if(hi-lo>620){ const c2 = cand.filter(p=>Math.abs(p-d1)>380); if(c2.length) s.doors.push(c2[Math.floor(rnd()*c2.length)]); }
    if(hi-lo>1500 && s.doors.length===2){ const c3 = cand.filter(p=>Math.abs(p-s.doors[0])>380 && Math.abs(p-s.doors[1])>380); if(c3.length) s.doors.push(c3[Math.floor(rnd()*c3.length)]); }
  }
  for(const l of leaves){ l.w = l.x1-l.x0; l.h = l.y1-l.y0; l.cx = (l.x0+l.x1)/2; l.cy = (l.y0+l.y1)/2; l.theme = null; }
  return {leaves, splits, DOOR, T};
}
function kpThemes(leaves, startPt, endPt, hallName, list, endTheme){
  const inL = (l,p)=>p.x>l.x0&&p.x<l.x1&&p.y>l.y0&&p.y<l.y1;
  const st = leaves.find(l=>inL(l,startPt)), en = leaves.find(l=>inL(l,endPt));
  if(st) st.theme = 'gate';
  if(en && en!==st) en.theme = endTheme;
  const rest = leaves.filter(l=>!l.theme).sort((a,b)=>b.w*b.h-a.w*a.h);
  if(rest[0]) rest[0].theme = hallName;
  let k = 0; for(let i=1;i<rest.length;i++) rest[i].theme = list[k++ % list.length];
  return leaves;
}
const KP_BLK = {pew:[16,'#4a3a2c','#241a12','#32261c'], bunk:[22,'#6a5238','#2a1e12','#46341f'], table:[28,'#5a4630','#241a10','#3c2e1e'], rack:[46,'#5e5c68','#24232c','#3e3c48'], sarcoph:[36,'#6a6678','#2a2833','#464256'], barrel:[34,'#5a3e22','#22160a','#3e2a16']};
const KP_FLOOR_TINT = {hall:'rgba(150,40,60,0.30)', nave:'rgba(70,60,140,0.30)', barracks:'rgba(120,84,48,0.26)', armory:'rgba(90,92,110,0.30)', chapel:'rgba(70,90,150,0.28)', mess:'rgba(130,90,40,0.26)', chamber:'rgba(60,50,80,0.24)',
  crypt:'rgba(40,90,70,0.28)', scriptorium:'rgba(120,70,130,0.26)', vestry:'rgba(90,70,60,0.26)', gate:'rgba(110,80,50,0.20)', vestibule:'rgba(110,80,50,0.20)', gatehouse:'rgba(110,80,50,0.20)', narthex:'rgba(110,80,50,0.20)', sanctum:'rgba(160,30,60,0.34)', library:'rgba(110,70,40,0.28)', guardroom:'rgba(100,100,120,0.28)', courtyard:'rgba(50,100,70,0.22)', shrine:'rgba(150,120,50,0.26)'};
// sprinkles extra monsters over a zone table: more skeleton brutes, ethereal ghouls, watchtower cultists and bats
function kpEnrich(a, zones, rnd){
  const ORG = {spider:1, giantspider:1, keepbat:1, poisonwalker:1, poisonsnake:1}, UND = {skeleton:1, skeletonarcher:1, skeletonbrute:1, wraithling:1, cultist:1, shadowcultist:1};
  for(const z of zones){
    z.packs = z.packs.map(pk=>{
      pk = pk.slice();
      if(z.mapBrute) return pk;
      // never mix the families in one pack: the organic dead keep to themselves, the undead keep company with their cultists
      const no = pk.filter(t=>ORG[t]).length, nu = pk.filter(t=>UND[t]).length;
      if(no && nu) pk = pk.filter(t=> nu>=no ? !ORG[t] : !UND[t]);
      const add = (t,n)=>{ for(let i=0;i<n;i++) pk.push(t); };
      if(pk.some(t=>ORG[t])){
        if(rnd()<0.7) add('keepbat',2); if(rnd()<0.5) add('spider',1+(rnd()<0.4?1:0)); if(rnd()<0.45) add('poisonwalker',1); if(a>=2 && rnd()<0.28) add('giantspider',1);
      } else if(pk.some(t=>UND[t])){
        if(rnd()<0.6) add('skeleton',1+(rnd()<0.5?1:0)); if(rnd()<0.36) add('skeletonbrute',1); if(rnd()<0.6) add('wraithling',1+(rnd()<0.4?1:0)); if(rnd()<0.12 && !pk.includes('cultist')) add('cultist',1); if(rnd()<0.3) add('skeletonarcher',1); if(a>=3 && rnd()<0.34) add('shadowcultist',1);
      }
      return pk.slice(0, 13);
    });
  }
  return zones;
}
function kpHellGen(rnd, w, h, cy, o){
  const TS = 46, cols = Math.ceil(w/TS)+1, rows = Math.ceil(h/TS)+1, M = new Uint8Array(cols*rows), AR = o.boss ? 1 : Math.max(1, w*h/6.4e6);   // v506: bigger lava floors get proportionally more chambers, islands and room to wander
  const seedN = rnd()*500;
  const hsh = (a,b)=>{ const n = Math.sin(a*127.1+b*311.7+seedN)*43758.5453; return n-Math.floor(n); };
  const vn = (x,y)=>{ const xi = Math.floor(x), yi = Math.floor(y), xf = x-xi, yf = y-yi, sx = xf*xf*(3-2*xf), sy = yf*yf*(3-2*yf); return (hsh(xi,yi)*(1-sx)+hsh(xi+1,yi)*sx)*(1-sy)+(hsh(xi,yi+1)*(1-sx)+hsh(xi+1,yi+1)*sx)*sy; };
  const carve = (px,py,rad,wob)=>{
    const R = rad*1.5, ix0 = Math.max(1,Math.floor((px-R)/TS)), ix1 = Math.min(cols-2,Math.ceil((px+R)/TS)), iy0 = Math.max(1,Math.floor((py-R)/TS)), iy1 = Math.min(rows-2,Math.ceil((py+R)/TS));
    const wb = wob==null ? 0.4 : wob;
    for(let iy=iy0; iy<=iy1; iy++) for(let ix=ix0; ix<=ix1; ix++){
      const wx = ix*TS, wy = iy*TS, d = Math.hypot(wx-px, wy-py), lim = rad*((1-wb*0.5)+wb*vn(wx/170, wy/170));
      if(d<lim) M[iy*cols+ix] = 1;
    }
  };
  // the main road: a long S-curve from the entrance to the exit
  const pts = [], n = 9+Math.floor(rnd()*3), amp = Math.min(h/2-330, 400*Math.sqrt(AR)), ph = rnd()*6.28;
  for(let i=0;i<=n;i++){ pts.push({x:130+(w-260)*i/n, y:clamp(cy+Math.sin(i*0.95+ph)*amp*(0.45+0.55*rnd()), 330, h-330)}); }
  pts[0].y = cy; pts[n].y = cy;
  if(o.boss){ let bi = 0, bd = 1e9; for(let i=0;i<=n;i++){ const d = Math.abs(pts[i].x-o.cx); if(d<bd){ bd = d; bi = i; } } pts[bi].y = cy; }
  const path = [];
  for(let i=0;i<n;i++){
    const a = pts[i], b = pts[i+1], L = Math.hypot(b.x-a.x,b.y-a.y), steps = Math.max(2,Math.ceil(L/36));
    for(let s=0;s<=steps;s++){
      const t = s/steps, te = (1-Math.cos(Math.PI*t))/2, px = a.x+(b.x-a.x)*t, py = a.y+(b.y-a.y)*te;
      const t2 = Math.min(1,(s+1)/steps), te2 = (1-Math.cos(Math.PI*t2))/2, qx = a.x+(b.x-a.x)*t2, qy = a.y+(b.y-a.y)*te2;
      let tx = qx-px, ty = qy-py; const tl = Math.hypot(tx,ty)||1; tx /= tl; ty /= tl;
      path.push({x:px, y:py, tx, ty});
      carve(px, py, 130+36*vn(px/230,py/230), 0.4);
    }
  }
  // chambers and side lobes
  const nCh = Math.round((5+Math.floor(rnd()*3)+(o.tier>>1))*AR);
  for(let k=0;k<nCh;k++){
    const q = path[Math.floor(rnd()*path.length)]; if(q.x<420 || q.x>w-420) continue;
    const side = rnd()<0.5 ? -1 : 1, off = 190+rnd()*260, rad = 150+rnd()*130, px = q.x + (-q.ty)*side*off, py = clamp(q.y + q.tx*side*off, 260, h-260);
    for(let s=0; s<=1.0001; s+=0.12) carve(q.x+(px-q.x)*s, q.y+(py-q.y)*s, 96, 0.3);
    carve(px, py, rad, 0.55);
  }
  carve(w*0.34, clamp(path[Math.floor(path.length*0.34)].y + (rnd()<0.5?-1:1)*160, 330, h-330), 250+rnd()*70, 0.5);
  carve(w*0.7, clamp(path[Math.floor(path.length*0.7)].y + (rnd()<0.5?-1:1)*160, 330, h-330), 250+rnd()*70, 0.5);
  if(AR>1.4) for(const fx of [0.17,0.52,0.86]) carve(w*fx, clamp(path[Math.floor(path.length*fx)].y + (rnd()<0.5?-1:1)*(160+rnd()*160), 330, h-330), 230+rnd()*80, 0.5);
  carve(150, cy, 175, 0.2); carve(w-150, cy, 175, 0.2); carve(w-330, cy-190, 160, 0.3);
  if(o.boss) carve(o.cx, cy, 640, 0.25);
  // crust islands out in the lava (decor only) -- value 2
  const near = (ix,iy,r)=>{ for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){ const nx = ix+dx, ny = iy+dy; if(nx>=0&&ny>=0&&nx<cols&&ny<rows&&M[ny*cols+nx]===1) return true; } return false; };
  const nIsl = Math.round((34+Math.floor(rnd()*14))*AR);
  for(let k=0;k<nIsl*6 && k<400*AR;k++){
    const ix = 2+Math.floor(rnd()*(cols-4)), iy = 2+Math.floor(rnd()*(rows-4));
    if(M[iy*cols+ix]!==0 || near(ix,iy,2) || !near(ix,iy,7)) continue;
    const rr = rnd()<0.3 ? 2 : 1;
    for(let dy=-rr;dy<=rr;dy++) for(let dx=-rr;dx<=rr;dx++){ if(dx*dx+dy*dy>rr*rr+0.5) continue; const nx = ix+dx, ny = iy+dy; if(nx>0&&ny>0&&nx<cols-1&&ny<rows-1&&M[ny*cols+nx]===0 && !near(nx,ny,2)) M[ny*cols+nx] = 2; }
  }
  // distance from walkable ground (Chebyshev, capped) -- the lava band that becomes solid obstacle rects
  const D = new Uint8Array(cols*rows).fill(9);
  for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){
    if(M[iy*cols+ix]!==1) continue;
    for(let dy=-3;dy<=3;dy++) for(let dx=-3;dx<=3;dx++){
      const nx = ix+dx, ny = iy+dy; if(nx<0||ny<0||nx>=cols||ny>=rows) continue;
      const k = ny*cols+nx; if(M[k]===1) continue;
      const dd = Math.max(Math.abs(dx),Math.abs(dy)); if(dd<D[k]) D[k] = dd;
    }
  }
  const rects = []; let open = {};
  for(let iy=0; iy<=rows; iy++){
    const now = {}; let ix = 0;
    while(iy<rows && ix<cols){
      const isOb = c=>M[iy*cols+c]!==1 && D[iy*cols+c]<=2;
      if(!isOb(ix)){ ix++; continue; }
      let j = ix; while(j+1<cols && isOb(j+1)) j++;
      const key = ix+'-'+j;
      if(open[key]){ open[key].h += TS; now[key] = open[key]; }
      else { const r = {x:ix*TS-TS/2, y:iy*TS-TS/2, w:(j-ix+1)*TS, h:TS, isWater:true, isLava:true}; rects.push(r); now[key] = r; }
      ix = j+1;
    }
    open = now;
  }
  // bone barricades dividing the terrain (each with a wide gap) + a few free-standing bone walls
  const posts = [], centers = [], onGround = (x,y)=>{ const ix = Math.round(x/TS), iy = Math.round(y/TS); return ix>0&&iy>0&&ix<cols-1&&iy<rows-1&&(M[iy*cols+ix]===1 || near(ix,iy,1)); };
  if(!o.noBars){
    const nB = Math.round((4+Math.floor(rnd()*3))*Math.sqrt(AR));
    const cand = path.filter(q=>q.x>560 && q.x<w-560 && (!o.boss || Math.hypot(q.x-o.cx,q.y-cy)>780));
    for(let k=0;k<nB*4 && centers.length<nB && cand.length;k++){
      const q = cand[Math.floor(rnd()*cand.length)];
      if(centers.some(c=>Math.hypot(c.x-q.x,c.y-q.y)<560)) continue;
      centers.push({x:q.x,y:q.y});
      const nx = -q.ty, ny = q.tx, half = 270, gapC = (rnd()-0.5)*150, GAP = 210;
      for(let s=-half; s<=half; s+=42){ if(Math.abs(s-gapC) < GAP/2) continue; const px = q.x+nx*s, py = q.y+ny*s; if(onGround(px,py)) posts.push({x:Math.round(px), y:Math.round(py)}); }
    }
  }
  // anchors for monster packs: well inside the ground
  const inner = (ix,iy)=>{ for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++){ const nx = ix+dx, ny = iy+dy; if(nx<0||ny<0||nx>=cols||ny>=rows||M[ny*cols+nx]!==1) return false; } return true; };
  const cells = [];
  for(let iy=2; iy<rows-2; iy++) for(let ix=2; ix<cols-2; ix++) if(M[iy*cols+ix]===1 && inner(ix,iy)) cells.push({x:ix*TS, y:iy*TS});
  for(let i=cells.length-1;i>0;i--){ const j = Math.floor(rnd()*(i+1)); [cells[i],cells[j]] = [cells[j],cells[i]]; }
  const anchors = [];
  for(const c of cells){
    if(anchors.length>=44) break;
    if(Math.hypot(c.x-170,c.y-cy)<560 || Math.hypot(c.x-(w-170),c.y-cy)<300) continue;
    if(o.boss && Math.hypot(c.x-o.cx,c.y-cy)<760) continue;
    if(anchors.some(q=>Math.hypot(q.x-c.x,q.y-c.y)<250)) continue;
    if(posts.some(q=>Math.hypot(q.x-c.x,q.y-c.y)<120)) continue;
    anchors.push(c);
  }
  const deco = [];
  for(let k=0;k<26 && cells.length;k++){ const c = cells[Math.floor(rnd()*cells.length)]; if(Math.hypot(c.x-170,c.y-cy)<260) continue; deco.push({kind:rnd()<0.62?'bones':'rift', x:c.x+rnd()*30-15, y:c.y+rnd()*30-15}); }
  return {data:{cols, rows, TS, M, D}, rects, posts, anchors, deco};
}
function drawHellFloor(room, cam){
  const hl = room.hell, TS = hl.TS, cols = hl.cols, rows = hl.rows, M = hl.M, D = hl.D, clk = (game&&game.clock)||0;
  const at = (ix,iy)=> (ix<0||iy<0||ix>=cols||iy>=rows) ? 0 : M[iy*cols+ix];
  const PAD = 16;
  const cx0 = Math.floor((game.player.x)/TS)-30, cx1 = cx0+60, cy0 = Math.floor((game.player.y)/TS)-30, cy1 = cy0+60;
  for(let iy=Math.max(-PAD,cy0); iy<Math.min(rows+PAD,cy1); iy++){
    for(let ix=Math.max(-PAD,cx0); ix<Math.min(cols+PAD,cx1); ix++){
      const wx = ix*TS, wy = iy*TS, iso = toIso(wx,wy), sx = iso.x-cam.x, sy = iso.y-cam.y;
      if(sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      const m = at(ix,iy), hh = tileHash(ix,iy), checker = ((ix+iy)%2+2)%2;
      if(m===1){
        const edge = !at(ix+1,iy)||!at(ix-1,iy)||!at(ix,iy+1)||!at(ix,iy-1);
        ctx.fillStyle = hh>0.9 ? '#1a100e' : hh>0.5 ? (checker?'#3a2420':'#34201c') : (checker?'#2e1c19':'#2a1916');
        drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
        if(edge){ ctx.fillStyle = 'rgba(255,100,28,'+(0.16+0.08*Math.sin(clk*2+hh*30))+')'; drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY); }
        else if(hh>0.86 && hh<0.93){
          ctx.strokeStyle = 'rgba(255,120,40,'+(0.4+0.25*Math.sin(clk*1.6+hh*40))+')'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(iso.x-14, iso.y-2); ctx.lineTo(iso.x-3, iso.y+3); ctx.lineTo(iso.x+5, iso.y-1); ctx.lineTo(iso.x+16, iso.y+4); ctx.stroke();
        }
      } else {
        const dd = (ix<0||iy<0||ix>=cols||iy>=rows) ? 9 : D[iy*cols+ix];
        const shim = (Math.floor((wx+wy)/TS*0.5 + clk*0.8) % 2 + 2) % 2;
        ctx.fillStyle = dd<=1 ? ((checker^shim)?'#ff7a22':'#f0661a') : dd<=3 ? ((checker^shim)?'#e2561a':'#cc4710') : ((checker^shim)?'#b8380c':'#a52f09');
        drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
        if(hh>0.78){ ctx.fillStyle = 'rgba(255,214,100,'+(0.32+0.3*Math.sin(clk*2.2+hh*50))+')'; ctx.beginPath(); ctx.ellipse(iso.x+(hh-0.9)*140, iso.y, 8, 3, 0, 0, 7); ctx.fill(); }
        if(m===2){
          ctx.fillStyle = '#241614'; drawDiamond(iso.x, iso.y-3, TS*ISO_KX*0.92, TS*ISO_KY*0.92);
          ctx.fillStyle = hh>0.5 ? '#3a2824' : '#322220'; drawDiamond(iso.x, iso.y-8, TS*ISO_KX*0.82, TS*ISO_KY*0.82);
          if(hh>0.6){ ctx.strokeStyle = 'rgba(255,110,40,0.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(iso.x-8, iso.y-8); ctx.lineTo(iso.x, iso.y-5); ctx.lineTo(iso.x+9, iso.y-9); ctx.stroke(); }
        }
      }
    }
  }
}
function drawWoodBarricadeIso(o){
  const cx = o.x+o.w/2, cy = o.y+o.h/2, iso = toIso(cx,cy), hh = tileHash(Math.round(cx/7), Math.round(cy/7));
  drawShadow(iso.x, iso.y+2, 34, 10);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.lineCap = 'round';
  // sharpened stakes leaning outward, lashed to two cross rails
  for(let k=-3;k<=3;k++){ const x = k*8, ht = 40 + ((k*13+Math.round(hh*10))%9)*2;
    ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x,2); ctx.lineTo(x-5,-ht); ctx.stroke();
    ctx.strokeStyle = '#7a5530'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x,2); ctx.lineTo(x-5,-ht); ctx.stroke();
    ctx.fillStyle = '#c9a070'; ctx.beginPath(); ctx.moveTo(x-7,-ht+2); ctx.lineTo(x-5,-ht-7); ctx.lineTo(x-3,-ht+2); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = '#5a3c1c'; ctx.lineWidth = 4.5;
  for(const ry of [-12,-27]){ ctx.beginPath(); ctx.moveTo(-30,ry); ctx.lineTo(28,ry-3); ctx.stroke(); }
  ctx.strokeStyle = '#b89a6a'; ctx.lineWidth = 1; for(let k=-3;k<=3;k+=2){ ctx.beginPath(); ctx.moveTo(k*8-2,-14); ctx.lineTo(k*8+2,-9); ctx.stroke(); }
  ctx.restore();
}
function drawBoneBarricade(o){
  const cx = o.x+o.w/2, cy = o.y+o.h/2, iso = toIso(cx,cy), hh = tileHash(Math.round(cx/7), Math.round(cy/7));
  const ht = 58 + hh*34, lean = (hh-0.5)*10;
  drawShadow(iso.x, iso.y+2, 26, 9);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-12,0); ctx.lineTo(-12+lean,-ht); ctx.moveTo(11,-2); ctx.lineTo(11-lean,-ht*0.86); ctx.moveTo(0,2); ctx.lineTo(lean*0.4,-ht*1.08); ctx.stroke();
  ctx.strokeStyle = '#d8ceae'; ctx.lineWidth = 4.6; ctx.beginPath(); ctx.moveTo(-12,0); ctx.lineTo(-12+lean,-ht); ctx.moveTo(11,-2); ctx.lineTo(11-lean,-ht*0.86); ctx.moveTo(0,2); ctx.lineTo(lean*0.4,-ht*1.08); ctx.stroke();
  ctx.fillStyle = '#e6dcbc'; for(const [bx,by] of [[-12+lean,-ht],[11-lean,-ht*0.86],[lean*0.4,-ht*1.08]]){ ctx.beginPath(); ctx.arc(bx-2,by,3.2,0,7); ctx.arc(bx+2,by,3.2,0,7); ctx.fill(); }
  ctx.strokeStyle = '#b9ae8c'; ctx.lineWidth = 2.4; for(let i=0;i<3;i++){ const ry = -12-i*13; ctx.beginPath(); ctx.moveTo(-14,ry); ctx.quadraticCurveTo(0,ry-8,14,ry); ctx.stroke(); }
  if(hh>0.45){   // a skull on a spike
    ctx.fillStyle = '#ebe2c4'; ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(lean*0.4, -ht*1.08-9, 7.5, 8, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a0a06'; ctx.beginPath(); ctx.arc(lean*0.4-3, -ht*1.08-9, 2, 0, 7); ctx.arc(lean*0.4+3, -ht*1.08-9, 2, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,90,30,0.85)'; ctx.beginPath(); ctx.arc(lean*0.4-3, -ht*1.08-9, 0.9, 0, 7); ctx.arc(lean*0.4+3, -ht*1.08-9, 0.9, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function drawHellPortal(pos, clock, big){
  const iso = toIso(pos.x,pos.y), t = clock||0, pul = 0.5+0.5*Math.sin(t*2.4);
  drawShadow(iso.x, iso.y+4, 54, 16);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.save(); ctx.scale(1, ISO_KY/ISO_KX);
  const g1 = ctx.createRadialGradient(0,0,4,0,0,120); g1.addColorStop(0,'rgba(255,170,90,'+(0.55+0.25*pul)+')'); g1.addColorStop(0.45,'rgba(255,50,20,'+(0.4+0.15*pul)+')'); g1.addColorStop(1,'rgba(120,0,0,0)');
  ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(0,0,120,0,7); ctx.fill();
  ctx.restore();
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#1c0a0a'; ctx.strokeStyle = '#0a0404'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-44,2); ctx.lineTo(-44,-64); ctx.quadraticCurveTo(-44,-112,0,-114); ctx.quadraticCurveTo(44,-112,44,-64); ctx.lineTo(44,2); ctx.closePath(); ctx.fill(); ctx.stroke();
  const ig = ctx.createLinearGradient(0,-104,0,0); ig.addColorStop(0,'rgba(255,230,160,0.95)'); ig.addColorStop(0.5,'rgba(255,90,30,0.95)'); ig.addColorStop(1,'rgba(150,10,10,0.95)');
  ctx.fillStyle = ig; ctx.beginPath(); ctx.moveTo(-32,0); ctx.lineTo(-32,-62); ctx.quadraticCurveTo(-32,-98,0,-100); ctx.quadraticCurveTo(32,-98,32,-62); ctx.lineTo(32,0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,240,190,0.7)'; ctx.lineWidth = 1.8; for(let i=0;i<5;i++){ const ox = (i-2)*11; ctx.beginPath(); ctx.moveTo(ox,-8); ctx.quadraticCurveTo(ox+9*Math.sin(t*2.5+i),-50,ox*0.7,-92+Math.sin(t*3+i)*4); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,200,120,0.9)'; for(let i=0;i<8;i++){ const ph = (t*0.6+i*0.13)%1; ctx.globalAlpha = 1-ph; ctx.beginPath(); ctx.arc(Math.sin(i*2.1+t)*28, -ph*110, 2.2, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#3a2420'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-44,2); ctx.lineTo(-44,-64); ctx.quadraticCurveTo(-44,-112,0,-114); ctx.quadraticCurveTo(44,-112,44,-64); ctx.lineTo(44,2); ctx.stroke();
  ctx.fillStyle = '#e6dcbc'; ctx.beginPath(); ctx.ellipse(0,-120,8,9,0,0,7); ctx.fill(); ctx.fillStyle = '#2a0a06'; ctx.beginPath(); ctx.arc(-3,-121,2,0,7); ctx.arc(3,-121,2,0,7); ctx.fill();
  ctx.restore();
}
function makeKeep(a, kopts){
  if(!(kopts&&kopts.seed)){ const tb = tripSeed('keep'); if(game._kpTrip!==tb){ game._kpTrip = tb; game.kpStore = {}; } }   // a new trip: the remembered monsters belong to the old halls
  const rnd = subSeeded(9300+a*71+((kopts&&kopts.bf)||0)*131+((kopts&&kopts.seed)||tripSeed('keep')));   // v525: the Keep's halls change every trip
  let w = KP_W[a-1], h = KP_H[a-1];
  if(a===9 && !brBossKind((kopts&&kopts.bf)||0)){ w = 4400 + 100*Math.floor(rnd()*9); h = 2600 + 100*Math.floor(rnd()*6); }   // v398: generated floors vary in size (v506: about the size of the Keep's entrance hall)
  else if(a===9 && BR_THEME_KINDS[brBossKind((kopts&&kopts.bf)||0)]){ w = 4900 + 100*Math.floor(rnd()*3); h = 3000 + 100*Math.floor(rnd()*2); }   // v505: themed boss floors are about the size of the Keep's entrance hall
  const cy = Math.round(h/2), T = 46, ob = [], props = [], lore = [];
  const wH = (x0,x1,y,gaps)=>{ let xs = x0; for(const [g0,g1] of (gaps||[]).slice().sort((p,q)=>p[0]-q[0])){ if(g0>xs) ob.push({x:xs, y:y-T/2, w:g0-xs, h:T, mazeWall:true}); xs = g1; } if(x1>xs) ob.push({x:xs, y:y-T/2, w:x1-xs, h:T, mazeWall:true}); };
  const wV = (x,y0,y1,gaps)=>{ let ys = y0; for(const [g0,g1] of (gaps||[]).slice().sort((p,q)=>p[0]-q[0])){ if(g0>ys) ob.push({x:x-T/2, y:ys, w:T, h:g0-ys, mazeWall:true}); ys = g1; } if(y1>ys) ob.push({x:x-T/2, y:ys, w:T, h:y1-ys, mazeWall:true}); };
  const pillar = (x,y,s,skull)=>ob.push({x:Math.round(x-(s||50)/2), y:Math.round(y-(s||50)/2), w:s||50, h:s||50, col:['#5e5a72','#24222e','#3c384c'], hz:78, skull:!!skull});
  const prop = (kind,x,y,extra)=>{ const o = Object.assign({kind,x,y}, extra||{}); props.push(o); return o; };
  const L = (id,kind,x,y)=>{ const o = prop(kind,x,y,{id}); lore.push({x,y,r:36,id}); return o; };
  const entrance = {x:70, y:cy, r:36};
  let beacons = null, exitDoor = null, exitPending = null, altars = null, pentagram = null, waypoint = null, holdStairs = null, zones = [], ring = null, breach = null, bossPos = null, palSet = null, bossKindOut = null, hellOut = null, themedOut = null;
  const floors = [];
  const blk = (kind,x,y,bw,bh)=>{ const o = {x:Math.round(x), y:Math.round(y), w:bw, h:bh, isProp:true}; ob.push(o); prop(kind,o.x,o.y,{w:bw,h:bh}); };
  const kpBuildWalls = (bsp)=>{
    for(const sp of bsp.splits){
      const gaps = sp.doors.map(d=>[d-bsp.DOOR/2, d+bsp.DOOR/2]);
      if(sp.vert) wV(sp.c, sp.a, sp.b, gaps); else wH(sp.a, sp.b, sp.c, gaps);
      for(const d of sp.doors){
        const q = bsp.DOOR/2+24;
        if(sp.vert){ prop('brazier', sp.c-46, d-q, {s:0.9}); prop('brazier', sp.c+46, d+q, {s:0.9}); }
        else { prop('brazier', d-q, sp.c-46, {s:0.9}); prop('brazier', d+q, sp.c+46, {s:0.9}); }
      }
    }
  };
  const furnishLeaf = (l)=>{
    const lw = l.w, lh = l.h, horiz = lw>=lh, x0 = l.x0, x1 = l.x1, y0 = l.y0, y1 = l.y1, mx = l.cx, my = l.cy, th = l.theme, short = Math.min(lw,lh);
    floors.push({x0:x0+23, y0:y0+23, x1:x1-23, y1:y1-23, col:KP_FLOOR_TINT[th]||'rgba(60,50,80,0.24)'});
    const corners = (i)=>{ prop('brazier',x0+i,y0+i,{s:1}); prop('brazier',x1-i,y0+i,{s:1}); prop('brazier',x0+i,y1-i,{s:1}); prop('brazier',x1-i,y1-i,{s:1}); };
    if(th==='gate' || th==='gatehouse' || th==='narthex' || th==='vestibule'){
      prop('brazier',x0+110,y0+110,{s:1}); prop('brazier',x0+110,y1-110,{s:1}); if(lw>520){ prop('brazier',x1-110,y0+110,{s:1}); prop('brazier',x1-110,y1-110,{s:1}); }
      prop('banner', mx, y0+30); prop('banner', mx, y1-30);
    } else if(th==='hall'){
      prop('carpet', mx, my, horiz ? {w:lw-110, h:170, col:'#5a1426'} : {w:170, h:lh-110, col:'#5a1426'});
      if(short>=520){
        if(horiz){ for(let x=x0+210; x<=x1-190; x+=260){ pillar(x, y0+lh*0.25, 52); pillar(x, y1-lh*0.25, 52); } for(let x=x0+210; x<x1-190; x+=520){ prop('banner',x,y0+30); prop('banner',x,y1-30); } }
        else { for(let y=y0+210; y<=y1-190; y+=260){ pillar(x0+lw*0.25, y, 52); pillar(x1-lw*0.25, y, 52); } for(let y=y0+210; y<y1-190; y+=520){ prop('banner',x0+30,y); prop('banner',x1-30,y); } }
      }
      corners(120);
    } else if(th==='nave'){
      prop('carpet', mx, my, horiz ? {w:lw-110, h:190, col:'#26265a'} : {w:190, h:lh-110, col:'#26265a'});
      if(short>=560){
        if(horiz){ for(let i=0, x=x0+190; x<=x1-190; i++, x+=100){ if(i%4===3) continue; blk('pew',x,my-100-130,34,130); blk('pew',x,my+100,34,130); } }
        else { for(let i=0, y=y0+190; y<=y1-190; i++, y+=100){ if(i%4===3) continue; blk('pew',mx-100-130,y,130,34); blk('pew',mx+100,y,130,34); } }
      }
      corners(110);
    } else if(th==='barracks'){
      const two = short>=560;
      if(horiz){ for(let x=x0+190; x<=x1-300; x+=200){ blk('bunk',x,y0+150,120,52); if(two) blk('bunk',x,y1-202,120,52); } }
      else { for(let y=y0+190; y<=y1-300; y+=200){ blk('bunk',x0+150,y,52,120); if(two) blk('bunk',x1-202,y,52,120); } }
      corners(100); prop('banner', mx, y0+30);
    } else if(th==='armory'){
      const two = short>=520;
      if(horiz){ for(let x=x0+200; x<=x1-260; x+=230){ blk('rack',x,y0+120,130,34); if(two) blk('rack',x,y1-154,130,34); } }
      else { for(let y=y0+200; y<=y1-260; y+=230){ blk('rack',x0+120,y,34,130); if(two) blk('rack',x1-154,y,34,130); } }
      corners(100);
    } else if(th==='chapel'){
      const two = lw>=760;
      for(let y=y0+170; y<=y1-215; y+=80){ if(two){ blk('pew',mx-90-150,y,150,34); blk('pew',mx+90,y,150,34); } else blk('pew',mx-75,y,150,34); }
      prop('sigil', mx, y0+90, {r:110, cl:'200,170,80', cl2:'80,60,20'}); prop('altar', mx, y0+90);
      corners(100);
    } else if(th==='mess'){
      for(let x=x0+190; x<=x1-300; x+=250) for(let y=y0+170; y<=y1-250; y+=190) blk('table',x,y,150,70);
      corners(100);
    } else if(th==='crypt'){
      for(let i=0;i<Math.floor(lw*lh/52000);i++) prop('grave', x0+130+rnd()*(lw-260), y0+130+rnd()*(lh-260), {s:0.9+rnd()*0.5});
      if(horiz){ for(let x=x0+200; x<=x1-300; x+=250) blk('sarcoph',x,my-28,130,56); } else { for(let y=y0+200; y<=y1-300; y+=250) blk('sarcoph',mx-28,y,56,130); }
      corners(100);
    } else if(th==='scriptorium'){
      for(let x=x0+190; x<=x1-300; x+=240){ blk('table',x,y0+160,150,70); if(short>=520) blk('table',x,y1-230,150,70); }
      corners(100);
    } else if(th==='library'){
      if(horiz){ for(let x=x0+170; x<=x1-230; x+=170){ blk('rack',x,y0+110,120,34); if(short>=520) blk('rack',x,y1-144,120,34); } blk('table',mx-75,my-35,150,70); }
      else { for(let y=y0+170; y<=y1-230; y+=170){ blk('rack',x0+110,y,34,120); if(short>=520) blk('rack',x1-144,y,34,120); } blk('table',mx-35,my-75,70,150); }
      corners(100);
    } else if(th==='guardroom'){
      blk('table',mx-75,my-35,150,70); blk('rack',x0+110,y0+110,130,34); if(lw>=520) blk('rack',x1-240,y1-144,130,34); blk('barrel',x1-190,y0+120,48,48);
      corners(95); prop('banner', mx, y0+30);
    } else if(th==='courtyard'){
      prop('fountain', mx, my); prop('sigil', mx, my, {r:Math.min(150,short*0.3)});
      for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]) pillar(mx+dx*Math.min(lw*0.32,260), my+dy*Math.min(lh*0.32,200), 48);
      for(let i=0;i<4;i++) prop('bones', x0+140+rnd()*(lw-280), y0+140+rnd()*(lh-280), {s:1});
      corners(100);
    } else if(th==='shrine'){
      prop('sigil', mx, my, {r:Math.min(130,short*0.28)}); prop('altar', mx, my);
      for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) prop('brazier', mx+dx*150, my+dy*130, {s:1});
      corners(100);
    } else if(th==='vestry'){
      blk('barrel',x0+150,y0+150,48,48); blk('barrel',x0+210,y0+150,48,48); blk('barrel',x1-198,y1-198,48,48); blk('barrel',x1-258,y1-198,48,48);
      if(lw>=520) blk('rack',mx-65,y0+120,130,34);
      corners(100);
    } else {
      corners(110);
      if(short>=520){ pillar(mx-110,my-90,48); pillar(mx+110,my+90,48); }
      for(let i=0;i<3;i++) prop('bones', x0+140+rnd()*(lw-280), y0+140+rnd()*(lh-280), {s:1});
    }
  };
  const placeLore = (leaves, map, leftover)=>{
    const left = [];
    const at = (l, id, kind)=>{
      if(kind==='mural') L(id, 'mural', l.cx+rnd()*160-80, l.y0+34);
      else if(l.theme==='chapel') L(id, kind, l.cx, l.y1-110);
      else L(id, kind, l.cx, l.cy);
    };
    for(const [th, id, kind] of map){ const l = leaves.find(q=>q.theme===th && (kind==='mural' || !q.loreUsed)); if(l){ at(l,id,kind); if(kind!=='mural') l.loreUsed = true; } else left.push([id,kind]); }
    const spare = leaves.filter(q=>!q.loreUsed && q.theme!=='gate' && q.theme!=='hall' && q.theme!=='nave');
    for(const [id,kind] of left){ const l = spare.shift() || leaves[0]; at(l,id,kind); l.loreUsed = true; }
  };
  const ORG_TH = {crypt:1, vestry:1, courtyard:1, chamber:0.5};
  const packsFor = (area, th)=>{
    if(th==='gate' || th==='narthex') return null;
    // v436: two families -- the undead (skeletons, ghouls, cultists) and the organic dead (spiders, bats, poisoned walkers) -- never mixed in one pack
    const organic = rnd() < (ORG_TH[th]!=null ? ORG_TH[th]*0.85 : 0.12);
    const pk = [];
    const add = (t,n)=>{ for(let i=0;i<n;i++) pk.push(t); };
    if(organic){ add('spider',1+(rnd()<0.6?1:0)); add('keepbat',2+Math.floor(rnd()*3)); add('poisonwalker',1+(rnd()<0.5?1:0)); if(area>=2 && rnd()<0.4) add('giantspider',1); }
    else if(th==='gatehouse' || th==='vestibule'){ add('skeleton',2); add('skeletonarcher',1); add('wraithling',1); add('skeletonbrute',1); if(area>=3) add('shadowcultist',1); else if(rnd()<0.5) add('cultist',1); }
    else { add('skeleton',2+Math.floor(rnd()*2)); add('skeletonarcher',1+(rnd()<0.5?1:0)); add('wraithling',1+Math.floor(rnd()*2)); if(rnd()<0.55) add('cultist',1); if(rnd()<0.5) add('skeletonbrute',1); if(area>=3){ add('shadowcultist',1+(rnd()<0.5?1:0)); } }
    return pk;
  };
  const castleZones = (area, leaves)=>{
    let eliteGiven = false;
    for(const l of leaves){
      if(!packsFor(area, l.theme)) continue;
      const el = (l.theme==='hall' || l.theme==='nave') || (!eliteGiven && l.w*l.h>380000 && l.theme!=='gatehouse');
      if(el && l.theme!=='hall' && l.theme!=='nave') eliteGiven = true;
      const nPk = clamp(Math.round(l.w*l.h/330000), 1, 3), packs = []; for(let i=0;i<nPk;i++) packs.push(packsFor(area, l.theme));
      zones.push({rect:[l.x0+120, l.x1-120, l.y0+120, l.y1-120], packs, elite:el});
    }
    // v436: three marked brutes per floor; slaying any one of them charts the floor
    const cand = leaves.filter(l=>l.theme!=='gate').slice(); const picked = [];
    for(let i=cand.length-1;i>0;i--){ const j2 = Math.floor(rnd()*(i+1)); [cand[i],cand[j2]] = [cand[j2],cand[i]]; }
    for(const l of cand){ if(picked.length>=3) break; if(picked.some(q=>Math.hypot(q.cx-l.cx,q.cy-l.cy)<1100)) continue; picked.push(l); }
    for(const l of picked) zones.push({rect:[l.cx-90, l.cx+90, l.cy-90, l.cy+90], packs:[['skeletonbrute']], mapBrute:true});
  };
  let castleGrid = null;
  const castleTry = (build, endPt)=>{
    let bsp = null;
    for(let tr=0; tr<24; tr++){
      ob.length = 0; props.length = 0; lore.length = 0; floors.length = 0; zones.length = 0;
      bsp = build();
      const C = 30, pad = 17, cols = Math.ceil(w/C), rows = Math.ceil(h/C), blk = new Uint8Array(cols*rows), seen = new Uint8Array(cols*rows);
      for(const o of ob){ const x0 = Math.max(0,Math.floor((o.x-pad)/C)), x1 = Math.min(cols-1,Math.floor((o.x+o.w+pad)/C)), y0 = Math.max(0,Math.floor((o.y-pad)/C)), y1 = Math.min(rows-1,Math.floor((o.y+o.h+pad)/C)); for(let yy=y0; yy<=y1; yy++) for(let xx=x0; xx<=x1; xx++) blk[yy*cols+xx] = 1; }
      const s0 = Math.floor(cy/C)*cols+Math.floor((entrance.x+100)/C); blk[s0] = 0; seen[s0] = 1; const st = [s0];
      while(st.length){ const c = st.pop(), cx = c%cols, cyy = (c-cx)/cols; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx = cx+dx, ny = cyy+dy; if(nx<1||ny<1||nx>=cols-1||ny>=rows-1) continue; const n = ny*cols+nx; if(seen[n]||blk[n]) continue; seen[n] = 1; st.push(n); } }
      const ep = typeof endPt==='function' ? endPt() : endPt;
      const gr = {ok: !!seen[Math.floor(ep.y/C)*cols+Math.floor(ep.x/C)], grid:{C, cols, seen}};
      const leafOk = l=>{ let tot = 0, ok = 0; for(let yy=Math.floor((l.y0+70)/C); yy<=Math.floor((l.y1-70)/C); yy++) for(let xx=Math.floor((l.x0+70)/C); xx<=Math.floor((l.x1-70)/C); xx++){ if(blk[yy*cols+xx]) continue; tot++; if(seen[yy*cols+xx]) ok++; } return tot===0 || ok >= tot*0.9; };
      castleGrid = gr.grid;
      if(gr.ok && bsp.leaves.every(leafOk)) break;
    }
    return bsp;
  };
  if(a===1){
    exitDoor = {x:w-70, y:cy, r:38};
    const bsp = castleTry(()=>{
      const b = kpBsp(rnd, 0, 0, w, h, {cy, clr:215, minW:430, minH:420, maxL:980});
      kpBuildWalls(b);
      // v436: the way on to the Cloister is a long march away, never straight across from the gate
      const eastL = b.leaves.filter(l=>l.x1>=w-1 && l.w>=430), farL = eastL.filter(l=>Math.abs(l.cy-cy)>=650), pickL = farL.length ? farL : eastL;
      const exL = pickL[Math.floor(rnd()*pickL.length)];
      exitDoor = {x:w-70, y:Math.round(exL.cy/10)*10, r:38};
      kpThemes(b.leaves, {x:170,y:cy}, {x:w-170,y:exitDoor.y}, 'hall', ['barracks','armory','chapel','mess','library','guardroom','courtyard','chamber','barracks','shrine','armory','chamber','mess','guardroom'], 'gatehouse');
      for(const l of b.leaves) furnishLeaf(l);
      placeLore(b.leaves, [['hall','hall_roll','slab'],['hall','hall_mural','mural'],['armory','hall_armory','tome'],['barracks','hall_barracks','tome'],['chapel','hall_chapel','slab']]);
      return b;
    }, ()=>exitDoor);
    castleZones(1, bsp.leaves);
  } else if(a===2){
    exitDoor = {x:w-70, y:cy, r:38};
    const X0 = 1000, X1 = 2200, Y0 = 700, Y1 = 1500;
    for(let x=X0; x<=X1; x+=120){ if(x>1480 && x<1720) continue; pillar(x,Y0,44); pillar(x,Y1,44); }
    for(let y=Y0+120; y<Y1; y+=120){ if(y>980 && y<1220) continue; pillar(X0,y,44); pillar(X1,y,44); }
    // prison cells along the north wall
    wH(500,2660,140); const cellGaps = []; for(let x=500; x<2660; x+=360) cellGaps.push([x+115,x+245]);
    wH(500,2660,520,cellGaps); for(let x=500; x<=2660; x+=360) wV(x,140,520);
    // the desecrated sanctuary to the south
    wH(1100,2100,1750,[[1500,1700]]); wV(1100,1750,2150); wV(2100,1750,2150); wH(1100,2100,2150);
    waypoint = {x:1600, y:1100, r:22};
    prop('fountain',1440,1000);
    L('cl_records','tome',2050,840); L('cl_inscription','slab',1130,1100); L('cl_mural','mural',1600,620); L('cl_graves','slab',640,1100);
    L('cl_cell1','slab',1040,310); L('cl_cell2','slab',2120,310); L('cl_sanct','slab',1600,1960);
    prop('sigil',1600,1990,{r:120});
    for(let i=0;i<46;i++){ const x = rnd()<0.5 ? 160+rnd()*760 : 2300+rnd()*760, y = 620+rnd()*1000; if(ob.some(o=>x>o.x-30&&x<o.x+o.w+30&&y>o.y-30&&y<o.y+o.h+30)) continue; prop('grave',x,y,{s:0.9+rnd()*0.5}); }
    for(const [x,y] of [[960,700],[2240,700],[960,1500],[2240,1500],[320,620],[320,1580],[2880,620],[2880,1580],[1600,580],[1600,1620]]) prop('brazier',x,y,{s:1});
    for(let i=0;i<14;i++){ const x = 200+rnd()*2800, y = 560+rnd()*1100; if(ob.some(o=>x>o.x-30&&x<o.x+o.w+30&&y>o.y-30&&y<o.y+o.h+30)) continue; prop('bones',x,y,{s:1}); }
    zones = [
      {rect:[520,1000,200,500], packs:[['skeleton','wraithling']]}, {rect:[1600,2300,200,500], packs:[['skeletonarcher','skeleton']]},
      {rect:[200,900,560,1640], packs:[['skeleton','skeleton','skeletonarcher'],['skeletonbrute','skeleton','wraithling'],['skeleton','skeleton','skeleton']], elite:true},
      {rect:[2300,3000,560,1640], packs:[['skeleton','skeleton','skeletonarcher'],['skeletonbrute','wraithling','wraithling'],['poisonwalker']]},
      {rect:[1040,2160,740,1460], packs:[['poisonwalker','wraithling'],['poisonwalker','skeleton','skeleton']]},
      {rect:[1150,2050,1790,2110], packs:[['skeletonbrute','skeletonbrute','wraithling','wraithling']]},
      {rect:[500,2700,560,690], packs:[['skeleton','skeleton','skeletonarcher']]},
    ];
    zones.push({rect:[260,840,700,1500], packs:[['skeletonbrute']], mapBrute:true}, {rect:[2360,2940,700,1500], packs:[['skeletonbrute']], mapBrute:true}, {rect:[1200,2000,1800,2060], packs:[['skeletonbrute']], mapBrute:true});
    zones.push({rect:[220,880,600,1600], packs:[['giantspider','skeleton','skeleton']]}, {rect:[2320,2980,600,1600], packs:[['giantspider','giantspider'],['giantspider','wraithling']]}, {rect:[1100,2100,780,1460], packs:[['giantspider','keepbat','keepbat']]}, {rect:[560,2700,1620,2080], packs:[['giantspider','skeletonarcher','wraithling']]});
  } else if(a===3){
    holdStairs = {x:w-90, y:cy, r:40};
    const AX = w-750;
    const bsp = castleTry(()=>{
      const b = kpBsp(rnd, 0, 0, AX, h, {cy, clr:215, minW:420, minH:420, maxL:980});
      kpBuildWalls(b);
      wV(AX, 0, h, [[cy-112, cy+112]]);
      prop('brazier', AX-46, cy-112-28, {s:0.9}); prop('brazier', AX+46, cy+112+28, {s:0.9});
      kpThemes(b.leaves, {x:170,y:cy}, {x:AX-170,y:cy}, 'nave', ['chapel','crypt','scriptorium','library','shrine','vestry','crypt','guardroom','courtyard','scriptorium','chamber','chapel','crypt','shrine'], 'vestibule');
      for(const l of b.leaves) furnishLeaf(l);
      placeLore(b.leaves, [['gate','tp_wards','slab'],['scriptorium','tp_tome','tome'],['nave','tp_mural','mural']]);
      return b;
    }, {x:AX-170,y:cy});
    castleZones(3, bsp.leaves);
    // v436: three beacons -- one by the gate, two hidden in far rooms behind cultist guards -- must all burn before the stairs unlock
    { const freePt = (l)=>{ for(let i=0;i<80;i++){ const x = l.x0+150+rnd()*(l.w-300), y = l.y0+150+rnd()*(l.h-300); if(ob.some(o=>x>o.x-80&&x<o.x+o.w+80&&y>o.y-80&&y<o.y+o.h+80)) continue; if(props.some(q=>Math.hypot(q.x-x,q.y-y)<100)) continue; return {x:Math.round(x), y:Math.round(y)}; } return {x:l.cx, y:l.cy}; };
      const stL = bsp.leaves.find(l=>l.theme==='gate'), pool = bsp.leaves.filter(l=>l.theme!=='gate' && l.theme!=='vestibule' && l.w>=520 && l.h>=480);
      for(let i=pool.length-1;i>0;i--){ const j2 = Math.floor(rnd()*(i+1)); [pool[i],pool[j2]] = [pool[j2],pool[i]]; }
      const bl = [stL||bsp.leaves[0]];
      for(const l of pool){ if(bl.length>=3) break; if(bl.every(q=>Math.hypot(q.cx-l.cx,q.cy-l.cy)>1500)) bl.push(l); }
      for(const l of pool){ if(bl.length>=3) break; if(!bl.includes(l)) bl.push(l); }
      beacons = bl.map((l,i)=>{ const pt = i===0 ? {x:Math.round(Math.min(l.x1-200, 420)), y:cy-170} : freePt(l); return {x:pt.x, y:pt.y, r:34, i, lit:false}; });
      beacons.forEach((bc,i)=>{ if(i>0) zones.push({rect:[bc.x-170, bc.x+170, bc.y-150, bc.y+150], packs:[['cultist','shadowcultist','shadowcultist','skeleton','skeleton','wraithling','wraithling'],['cultist','skeleton','skeletonbrute','wraithling']], elite:true}); });
    }
    // the sanctum: the old containment altar in the apse
    const SX = AX+390;
    floors.push({x0:AX+23, y0:23, x1:w-23, y1:h-23, col:KP_FLOOR_TINT.sanctum});
    prop('sigil',SX,cy,{r:170});
    L('tp_altar','altar',SX,cy);
    prop('socket',SX-90,cy-140,{rune:'shield'}); prop('socket',SX-90,cy+140,{rune:'sword'}); prop('socket',SX+140,cy,{rune:'cross'});
    for(const [x,y] of [[AX+130,330],[AX+130,h-330],[AX+610,330],[AX+610,h-330],[SX,300],[SX,h-300],[AX+130,cy-700],[AX+130,cy+700],[AX+610,cy-700],[AX+610,cy+700]]) prop('pylon',x,y);
    for(const [x,y] of [[AX+80,190],[AX+80,h-190],[AX+650,190],[AX+650,h-190],[AX+80,cy-450],[AX+80,cy+450],[AX+650,cy-450],[AX+650,cy+450]]) prop('brazier',x,y,{s:1.1});
    zones.push({rect:[AX+80,AX+610,380,h-380], packs:[['shadowcultist','shadowcultist','shadowcultist','poisonwalker'],['shadowcultist','shadowcultist','wraithling','wraithling'],['shadowcultist','shadowcultist','giantspider'],['shadowcultist','skeletonbrute','cultist']], elite:true});
  }
  if(a>=7){
    exitDoor = null;
    if(a===7){
      palSet = HOLD_PAL;
      waypoint = {x:340, y:cy, r:22};
      const C = {x:1950, y:cy};
      for(let i=0;i<8;i++){ const an = Math.PI*2*i/8+0.39; pillar(C.x+Math.cos(an)*560, C.y+Math.sin(an)*470, 56, true); }
      for(let x=760; x<=1360; x+=200){ pillar(x,560,50,true); pillar(x,1440,50,true); }
      prop('sigil',C.x,C.y,{r:330});
      prop('breach',C.x+150,C.y,{r:150,big:true,hold:true});
      breach = {x:C.x+150, y:C.y, r:150}; bossPos = {x:C.x-60, y:C.y};
      // v434: three runestone altars stand around the red pentagram; the stones are set here after the Wraith Lord falls
      const AL = {x:1300, y:cy};
      altars = [];
      [['shield',135],['cross',270],['sword',225]].forEach(([rune,deg])=>{ const an = deg*Math.PI/180, ax = Math.round(C.x+Math.cos(an)*470), ay = Math.round(C.y+Math.sin(an)*470);
        altars.push({x:ax, y:ay, r:44, rune}); ob.push({x:ax-24, y:ay-24, w:48, h:48, isProp:true}); prop('runealtar', ax, ay, {rune}); });
      pentagram = {x:C.x, y:C.y, r:200};
      for(const [x,y] of [[160,700],[160,1300],[560,420],[560,1580],[1500,420],[1500,1580],[2400,420],[2400,1580],[2700,700],[2700,1300]]) prop('brazier',x,y,{s:1});
      for(const [x,y] of [[640,260],[1280,260],[640,1740],[1280,1740],[1900,200],[1900,1800]]) prop('banner',x,y);
      for(const x of [900,1500]) prop('chains',x,800), prop('chains',x,1200);
      for(let i=0;i<10;i++){ const x = 500+rnd()*1900, y = 300+rnd()*1400; if(ob.some(o=>x>o.x-40&&x<o.x+o.w+40&&y>o.y-40&&y<o.y+o.h+40)) continue; if(Math.hypot(x-AL.x,y-AL.y)<260) continue; prop('bones',x,y,{s:1}); }
      L('hd_gate','slab',640,780); L('hd_altar','slab',AL.x-170,AL.y+20);
      zones = [
        {rect:[760,1400,700,1300], packs:[['poisonwalker'],['imp','imp','imp','wraithling','wraithling'],['skeletonbrute','skeletonbrute','wraithling']]},
        {rect:[500,1100,300,560], packs:[['skeleton','skeletonarcher','imp','imp']]}, {rect:[500,1100,1440,1700], packs:[['skeleton','skeletonarcher','imp','imp']]},
      ];
    }
  else if(a===9){
    const bf = (kopts&&kopts.bf)||1, tier = Math.min(4,Math.ceil(bf/5)), bossKind = brBossKind(bf);
    palSet = BR_PALS[(Math.ceil(bf/5)-1)%4]; exitDoor = null;
    const CX = 1650;
    if(bossKind && BR_THEME_KINDS[bossKind]){   // v505: themed boss floor
      const T = brThemedFloor(rnd, bf, bossKind, w, h);
      ob.length = 0; for(const r of T.ob) ob.push(r);
      zones = T.zones; bossPos = T.bossPos; exitPending = T.exitPending; palSet = T.pal; bossKindOut = bossKind; themedOut = T;
    } else {
    // v427: the floor of hell -- lava all round, an organic walkable road of scorched stone, crust islands, bone barricades, no walls
    let hell = null;
    for(let tr=0; tr<24; tr++){   // (v506: the bigger floors need more tries to roll a road that joins the entrance to the exit)
      hell = kpHellGen(rnd, w, h, cy, {boss:!!bossKind, cx:CX, tier, noBars:tr>=4, bf});
      ob.length = 0; for(const r of hell.rects) ob.push(r); for(const q of hell.posts) ob.push({x:q.x-28, y:q.y-28, w:56, h:56, bone:true});
      if(brGridOk(ob, w, h, {x:170,y:cy}, {x:w-170,y:cy}).ok) break;
    }
    hellOut = hell.data;
    if(bossKind){
      prop('sigil',CX,cy,{r:360}); prop('breach',CX+230,cy,{r:130,big:true}); bossPos = {x:CX-60, y:cy};
    }
    for(const d of hell.deco) prop(d.kind, d.x, d.y, {s:1});
    const deep = Math.max(0, bf-20), nPacks = bossKind ? 10 : Math.min(60, Math.round(Math.min(32, 16+Math.floor(bf/2))*w*h/6.4e6));
    const anchors = hell.anchors.slice();
    for(let i=0;i<nPacks && anchors.length;i++){
      const an = anchors.splice(Math.floor(rnd()*anchors.length), 1)[0];
      const idx = BR_TIER_PACKS[tier-1]; let pk = BR_PACKS[idx[Math.floor(rnd()*idx.length)]].slice();
      for(let k=0;k<1+Math.floor(rnd()*2);k++) pk.push(pk[Math.floor(rnd()*pk.length)]);
      for(let k=0;k<Math.floor(deep/8) && pk.length<9;k++) pk.push(pk[pk.length-1]);
      zones.push({rect:[an.x-14, an.x+14, an.y-14, an.y+14], packs:[pk], elite:(tier>=2 && i===0 && !bossKind) || (tier>=2 && i%8===5) || (tier>=4 && i<=1+Math.floor(deep/10))});
    }
    // v434: the way down sits at the end of the road (inside the skull on boss floors) and opens when its guardians fall -- no more hunting stragglers
    if(bossKind){ exitPending = {x:CX+230, y:cy, r:60}; }
    else {
      exitPending = {x:w-170, y:cy, r:38};
      const idx2 = BR_TIER_PACKS[tier-1]; let gp = BR_PACKS[idx2[Math.floor(rnd()*idx2.length)]].slice();
      while(gp.length<6) gp.push(gp[Math.floor(rnd()*gp.length)]);
      zones.push({rect:[exitPending.x-400, exitPending.x-170, cy-160, cy+160], packs:[gp], elite:true, gate:true});
    }
    bossKindOut = bossKind || null;
    }
  }
  }
  if(a<=7) kpEnrich(a, zones, rnd);
  const room = { w, h, obstacles:ob, subzone:'keep', kpArea:a, hell:hellOut, altars, pentagram, exitPending, kpFloors:floors, ring, breach, bossPos, bossKind:bossKindOut, bf:(kopts&&kopts.bf)||0, entrance, entranceSide:'left', entranceSpot:{x:entrance.x+100, y:entrance.y},
    exitDoor, waypoint, holdStairs, beacons, props, lore, zones, rocks:[], name:KP_NAMES[a-1], boltX:0.5, noOre:true,
    wallPal:(palSet||{}).wp||['#4a4658','#1e1c28','#2e2b3a'], pal:(palSet||{}).fl||['#34323c','#2a2830','#3c3a46','#2e2c36'] };
  if(themedOut){ room.floorRects = themedOut.floorRects; room.theme = bossKindOut; room.themeArena = themedOut.arena; room.themePool = themedOut.pool; room.heartGeo = themedOut.heartGeo; room.mapFound = true; room.reachFrom = {x:170, y:cy}; }
  if(castleGrid) room.reachGrid = castleGrid;
  subFinish(room);
  room.waypoint = waypoint; room.stairsDown = null;
  if(a===9) room.name = 'The Breach — Floor '+room.bf;
  if(a===9){
    if(room.bossKind==='fhcmd') room.turretSpots = [{x:1650-520,y:cy-330},{x:1650-520,y:cy+330},{x:1650+420,y:cy-380},{x:1650+420,y:cy+380}];
    room.reachGrid = themedOut ? null : brGridOk(ob, w, h, {x:170,y:cy}, {x:w-170,y:cy}).grid;   // (themed floors are joined by construction)
  }
  return room;
}
function spawnKeep(g){
  const room = g.room, p = g.player;
  const av = [{x:room.entrance.x,y:room.entrance.y,r:380}];
  if(room.exitDoor) av.push({x:room.exitDoor.x,y:room.exitDoor.y,r:220});
  if(room.waypoint) av.push({x:room.waypoint.x,y:room.waypoint.y,r:300});
  if(room.holdStairs) av.push({x:room.holdStairs.x,y:room.holdStairs.y,r:200});
  // v503: the floor's Map Bearer is the marked brute nearest the way in
  { let bz = null, bd = 1e9; for(const z of room.zones){ if(!z.mapBrute) continue; const d = Math.hypot((z.rect[0]+z.rect[1])/2-room.entrance.x, (z.rect[2]+z.rect[3])/2-room.entrance.y); if(d<bd){ bd = d; bz = z; } } room._mbZone = bz; }
  for(const z of room.zones){
    let first = true;
    for(const types of z.packs){
      let c = subFreeSpot(room, z.rect[0], z.rect[1], z.rect[2], z.rect[3], av); if(!c) continue;
      if(room.reachGrid){ for(let k=0;k<40 && c && !brReach(room.reachGrid,c.x,c.y);k++) c = subFreeSpot(room, z.rect[0], z.rect[1], z.rect[2], z.rect[3], av); if(!c || !brReach(room.reachGrid,c.x,c.y)) continue; }
      for(const t0 of types){
        const vsp = String(t0).split(':'), t = vsp[0], vr = vsp[1] || null;   // v505: 'bear:polar' = a bear of the polar variety
        let pos = subFreeSpot(room, c.x-90, c.x+90, c.y-90, c.y+90, null, 20) || c;
        if(room.reachGrid && !brReach(room.reachGrid,pos.x,pos.y)) pos = c;
        let e;
        if(t==='keepbat'){ e = spawnEnemy(g, 'firebat', pos); if(e){ e.reg = true; e.color = '#4a3c56'; } }
        else if(t==='giantspider'){ e = spawnEnemy(g, 'spider', pos); if(e) makeGiantSpider(e); }
        else if(t==='squid'){ e = spawnSquid(g, pos); }
        else e = spawnEnemy(g, t, pos);
        if(e && t==='cultist') raiseCultGuard(g, e, 4, false);
        if(e && z.mapBrute && z===room._mbZone && t==='skeletonbrute' && !types._mb && !room._mbPlaced){ types._mb = true; room._mbPlaced = true; e.mapBrute = true; e.mapCarrier = true; e.mapHolder = true; e.hp = Math.round(e.hp*2); e.maxHp = Math.round(e.maxHp*2); }
        if(e && vr) e.variant = vr;
        if(e && room.kpArea===9) brScaleEnemy(e, room.bf);
        if(e && z.elite && first){ first = false; makeElite(e, pickMods(2)); }
        else if(e && z.gate){ makeElite(e, pickMods(1)); }
        if(e && z.gate){ e.gatePack = true; room.gateN = (room.gateN||0)+1; }
      }
    }
  }
  if(room.kpArea<=3 && room._mbZone && !room._mbPlaced){   // v503: the marked brute's spot was blocked -- the nearest skeleton brute carries the map instead
    let be = null, bd = 1e9; for(const e of g.enemies){ if(e.type!=='skeletonbrute' || e.hp<=0) continue; const d = Math.hypot(e.x-room.entrance.x, e.y-room.entrance.y); if(d<bd){ bd = d; be = e; } }
    if(be){ room._mbPlaced = true; be.mapBrute = true; be.mapCarrier = true; be.mapHolder = true; be.hp = Math.round(be.hp*2); be.maxHp = Math.round(be.maxHp*2); } }
  if(room.theme==='kraken' && room.themePool){   // electric eels in the great pool
    const P = room.themePool;
    for(let i=0;i<3;i++){ const an = i*2.1+0.4, pt = {x:P.cx+Math.cos(an)*P.rx*0.6, y:P.cy+Math.sin(an)*P.ry*0.6}; const e = spawnEel(g, pt); if(e){ e.brEel = true; brScaleEnemy(e, room.bf); } }
  }
  // v434: on the Demon Hold floor the Wraith Lord appears only once you stand in the red pentagram (see updateKeep)
  if(room.kpArea===9 && room.bossKind && room.bossPos) spawnBreachBoss(g, room.bossKind, room.bossPos);
}
function kpStoreSave(g){ if(g.scene==='lighthouse' && g.tower && g.tower.subzone==='keep' && g.tower.kpArea<7){ g.kpStore = g.kpStore || {}; g.kpStore[g.tower.kpArea] = g.enemies; } }
function enterKeep(area, opts){
  opts = opts || {};
  if(area===8 || (area>=4 && area<=6)) area = 7;
  const g = game, p = g.player;
  kpStoreSave(g);
  { const cq = getQuest(p, 'clf_ascent'); if(cq && cq.status==='active'){ cq.status='complete'; cq.rewarded=true; cq.progress=cq.total; cq.desc='You reached the gate of Shadow Keep.'; p.gold += 700; gainXp(g, 1200); setTimeout(()=>{ try{ showMsg('Quest complete: The Cliffside Ascent \u2014 +700 gold', 3.0); updateQuestBadge(); }catch(e){} }, 600); } }   // v482: this quest never completed before
  g.scene = 'lighthouse'; g.lighthouseFloor = area;
  g.tower = makeKeep(area, opts); g.room = g.tower; g.mtn = null;
  g.depth = area===9 ? breachDepth(opts.bf||1) : KP_DEPTH[area-1];
  const t = g.tower;
  if(t.beacons){ const tb = p.tpBeacons || []; t.beacons.forEach((b,i)=>{ b.lit = !!tb[i]; });
    // v490: the Temple beacons get their own quest entry so the tracker shows them
    const n = t.beacons.filter(x=>x.lit).length;
    if(n<3){ const q = addQuestOnce(p, 'sk_beacons', 'The Temple Beacons', 'Light the three beacons in the Temple to unlock the Demon Hold.', 3); q.progress = n; updateQuestBadge(); } }
  if(opts.from==='next' && (t.exitDoor||t.holdStairs)){ const ex = t.exitDoor||t.holdStairs; p.x = ex.x-110; p.y = ex.y; }
  else if(opts.from==='wp' && t.waypoint){ p.x = t.waypoint.x; p.y = t.waypoint.y+55; }
  else if(opts.from==='breach' && t.breach){ p.x = t.breach.x; p.y = t.breach.y+140; }
  else { p.x = t.entranceSpot.x; p.y = t.entranceSpot.y; }
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null; g.bossKilled=false;
  g.kpStore = g.kpStore || {};
  if(area<7 && g.kpStore[area]) g.enemies = g.kpStore[area].filter(e=>e.hp>0); else spawnKeep(g);
  g.stormT = rand(3,8); g.stormFlash = 0; g.stormFlash2 = 0;
  g.holdRupt = (p.wraithLordSlain || p.breachContained || area===9) ? 1 : 0; g.holdRuptV = g.holdRupt;
  showMsg(t.name+'  (Lv. '+g.depth+')', 2.2);
  g._kpBig = null;
  if(area===7){ g._kpBig = {t:2.9, area:7, a:'THE DEMON HOLD', b:(p.breachContained ? 'The breach is bound to a single portal' : p.wraithLordSlain ? 'Contain the breach' : 'The breach is open'), d:3.4}; }
  if(area===9){ g._kpBig = {t:2.6, area:9, a:'THE BREACH — FLOOR '+t.bf, b:(t.bossKind ? BR_BOSS_NAME[t.bossKind] : 'Purge them before they escape'), d:3.0}; ensureBreachQuest(p); }
  if(!getQuest(p,'sk_main')){ addQuestOnce(p, 'sk_main', 'The Wraith Lord’s Return', 'Shadow Keep has fallen to the Wraith Lord. Learn what he was.', 3); }
  if(!getQuest(p,'sk_records')){ addQuestOnce(p, 'sk_records', 'The Keep Remembers', 'Read the records, murals and graves of Shadow Keep.', KP_LORE_TARGET); }
  updateQuestBadge();
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = p.x; f.y = p.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
  saveGame();
}
function lightKeepBeacon(b){
  const g = game, p = g.player, t = g.tower; if(!b || !t.beacons) return;
  p.tpBeacons = p.tpBeacons || [false,false,false];
  if(b.lit){ showMsg('The beacon already burns  ('+t.beacons.filter(x=>x.lit).length+'/3)', 2.6, '#ffcf7a'); return; }
  b.lit = true; p.tpBeacons[b.i] = true;
  const n = t.beacons.filter(x=>x.lit).length;
  try{ sfxPlay('banner', 0.5); }catch(e){}
  for(let k=0;k<14;k++) g.particles.push({type:'burst', x:b.x+rand(-26,26), y:b.y+rand(-26,26), t:0.6, max:0.6, color:'#ffb040'});
  { const q = addQuestOnce(p, 'sk_beacons', 'The Temple Beacons', 'Light the three beacons in the Temple to unlock the Demon Hold.', 3); q.progress = n;   // v490
    if(n>=3){ q.status = 'complete'; q.rewarded = true; q.desc = 'All three beacons burn. The way to the Demon Hold is open.'; } else q.desc = 'Light the three beacons in the Temple to unlock the Demon Hold ('+n+'/3 lit).'; updateQuestBadge(); }
  showMsg(n>=3 ? 'The way is open  (3/3)' : 'Light the beacons to open the way  ('+n+'/3)', 4.6, '#ffcf7a');
  saveGame();
}
function readKeepLore(l){
  const g = game, p = g.player, d = l && KP_LORE[l.id]; if(!d) return;
  p.keepLore = p.keepLore || {};
  const first = !p.keepLore[l.id]; p.keepLore[l.id] = true;
  showNpcText(d.title, d.text, 'Close');
  if(first) keepLoreProgress(g);
  saveGame();
}
function keepLoreProgress(g){
  const p = g.player, kl = p.keepLore || {};
  const rq = getQuest(p,'sk_records');
  if(rq && rq.status==='active'){
    rq.progress = Math.min(rq.total, Object.keys(kl).length);
    if(rq.progress>=rq.total){ rq.status='complete'; rq.rewarded=true; rq.desc='You pieced together the fall of the Keep.'; p.gold += 900; gainXp(g, 2200 + g.depth*30); showMsg('Quest complete: The Keep Remembers', 3.2, '#e8c44a'); }
  }
  const mq = getQuest(p,'sk_main');
  if(mq && mq.status==='active'){
    if(kl.tp_altar){ mq.progress = Math.max(mq.progress,2); mq.desc = 'The Wraith Lord is using the awakened Runestones to reverse the old binding, and the ritual is nearly done. Descend into the Demon Hold and stop him.'; }
    else if(kl.cl_records){ mq.progress = Math.max(mq.progress,1); mq.desc = 'The Wraith Lord was a Templar commander, corrupted by the Hold and bound beneath the Dark Crypt. A thief freed him; he has come home to finish a ritual. Find where it is being carried out.'; }
  }
  updateQuestBadge();
}
function updateKeep(g, dt){
  const p = g.player, t = g.tower, a = t.kpArea;
  updatePortalChoice(false);
  if(g._kpBig){ g._kpBig.t -= dt; if(g._kpBig.t<=0){ const bm = g._kpBig; g._kpBig = null; if(a===bm.area) showBigMsg(bm.a, bm.b, bm.d); } }
  if(g.wlFlashT>0) g.wlFlashT = Math.max(0, g.wlFlashT - dt);
  if(a===7){
    // v434: the Wraith Lord waits in the dark until someone stands in the red pentagram
    if(!p.wraithLordSlain && !t.wlTriggered && t.pentagram && dist(p, t.pentagram) < t.pentagram.r){
      t.wlTriggered = true; g.blackFx = {t:0, spawned:false};
    }
    if(g.blackFx){
      g.blackFx.t += dt;
      if(!g.blackFx.spawned && g.blackFx.t>=0.3 && t.bossPos){
        g.blackFx.spawned = true;
        const e = spawnWraithLord(g, t.bossPos);
        if(e){ e.wlState = 'intro'; e.wlT = 2.6; e.invulnT = 2.6; e.guardHp = e.hp; e.wlAlpha = 0; e.aggroed = true; e.engaged = true; shakeScreen(g, 4, 0.8); }
      }
      if(g.blackFx.t>1.5) g.blackFx = null;
    }
    const shT = p.breachContained ? 1 : 0; g.holdShrinkV = (g.holdShrinkV==null ? shT : g.holdShrinkV) + (shT-(g.holdShrinkV==null?shT:g.holdShrinkV))*Math.min(1, dt*1.1);
  }
  if(a===2) stormTick(g, dt);
  g.holdRuptV = (g.holdRuptV||0) + ((g.holdRupt||0)-(g.holdRuptV||0))*Math.min(1, dt*0.9);
  if(a===9 && !t.cleared){
    if(g.enemies.length>0) t.started = true;
    if(t.started){
      // v434: boss floors open when the boss falls; ordinary floors when the elite guard beside the portal is dead
      const open = t.bossKind ? !g.enemies.some(e=>e.brBoss && e.hp>0) : (t.gateN>0 ? !g.enemies.some(e=>e.gatePack && e.hp>0) : !g.enemies.some(e=>e.hp>0 && !e.noReward));
      if(open) breachFloorCleared(g);
    }
  }
  let k = null;
  const nr = (q,pad)=>q && dist(p,q) < q.r + p.r + (pad||22);
  if(nr(t.entrance)) k = a===1 ? 'keepToCliff' : 'keepPrev';
  else if(t.clearPortal && nr(t.clearPortal)) k = 'breachToTown';
  else if(nr(t.exitDoor)) k = 'keepNext';
  else if(t.beacons && t.beacons.some(b=>nr(b,12))){ g._beaconNear = t.beacons.find(b=>nr(b,12)); k = 'keepBeacon'; }
  else if(t.holdStairs && nr(t.holdStairs)) k = 'keepStairs';
  else if(t.waypoint && dist(p,t.waypoint) < t.waypoint.r + p.r + 24){ k = a===8 ? 'waypointRing' : a===7 ? 'waypointHold' : 'waypointKeep'; }
  else if(t.altars && p.wraithLordSlain && !p.breachContained && t.altars.some(x=>!(p.runesPlaced||{})[x.rune] && nr(x))){ g._altarNear = t.altars.find(x=>!(p.runesPlaced||{})[x.rune] && nr(x)); k = 'runeAltar'; }
  else if(t.breach && p.breachContained && a===7 && dist(p,t.breach) < (((g.holdShrinkV||0)>0.5) ? 50 : t.breach.r) + p.r + 26){ k = 'breachEnter'; p.breachReached = true; }
  else { for(const l of t.lore){ if(dist(p,l) < l.r + p.r + 16){ k = 'keepLore'; g._keepLoreNear = l; break; } } }
  updateInteractPrompt(k);
}
// ---- Shadow Keep monsters ----
function updateCultist(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  e.moving = false;
  const ang = Math.atan2(target.y-e.y, target.x-e.x);
  e.facing = {x:Math.cos(ang), y:Math.sin(ang)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y);
  let mv = 0; if(d>270) mv = 1; else if(d<150) mv = -1;
  if(mv){
    const tx = e.x+Math.cos(ang)*mv*80, ty = e.y+Math.sin(ang)*mv*80, a2 = steerAngleTo(e, tx, ty, room.obstacles);
    e.x += Math.cos(a2)*e.speed*chillMult*dt; e.y += Math.sin(a2)*e.speed*chillMult*dt; e.moving = true;
  } else { const sa = ang + Math.PI/2*(e.strafe||(e.strafe=Math.random()<0.5?-1:1)); e.x += Math.cos(sa)*e.speed*0.4*chillMult*dt; e.y += Math.sin(sa)*e.speed*0.4*chillMult*dt; e.moving = true; }
  if(inShadowKeep(g)) cultPortalTick(g, e, target, d, dt);   // v499
  e.cCd = (e.cCd===undefined ? rand(0.6,2) : e.cCd) - dt;
  if(e.cCd<=0 && d<480 && enemyLOS(g,e,target)){
    e.cCd = rand(2.0,3.0); e.atkAnimT = 0.3; e.cN = (e.cN||0)+1;
    const n = e.cN%3===0 ? 3 : 1;
    if(e.type==='shadowcultist' && inShadowKeep(g)){ for(let i=0;i<n;i++) fireDeathBolt(g, e, ang + (i-(n-1)/2)*0.22, target, e.dmg*0.95); return; }
    for(let i=0;i<n;i++){ const a3 = ang + (i-(n-1)/2)*0.22; g.projectiles.push({x:e.x,y:e.y-8,vx:Math.cos(a3)*270,vy:Math.sin(a3)*270,r:9,dmg:e.dmg*0.95,from:'enemy',life:2.2,color:(e.type==='cinderfiend'?'#ff8a3a':'#9a50ff'),srcEnemy:e,targetRef:target}); }
  }
}
// v469: Shadow Keep cultists cast the Necromancer's Death Bolt -- a dark bolt that leaps between you and your
// followers, hungrier the closer the caster is to death (up to +60% damage at low life)
function inShadowKeep(g){ return !!(g && g.scene==='lighthouse' && g.tower && g.tower.subzone==='keep'); }
const DEATHBOLT_JUMPS = 2, DEATHBOLT_JUMP_R = 240, DEATHBOLT_JUMP_MULT = 0.7, DEATHBOLT_SPEED = 250;
function deathBoltHunger(e){ return 1 + 0.6*Math.max(0, 1 - (e.hp||0)/Math.max(1, e.maxHp||e.hp||1)); }
function fireDeathBolt(g, e, ang, target, dmgBase){
  g.projectiles.push({x:e.x, y:e.y-8, vx:Math.cos(ang)*DEATHBOLT_SPEED, vy:Math.sin(ang)*DEATHBOLT_SPEED, r:9, dmg:dmgBase*deathBoltHunger(e),
    from:'enemy', life:2.4, color:'#3a0a4a', isDeathBolt:true, jumps:DEATHBOLT_JUMPS, srcEnemy:e, targetRef:target});
}
function deathBoltLeap(g, pr, hitT){
  if(!(pr.jumps>0)) return;
  const done = (pr.dbHit || []).concat([hitT]);
  const p = g.player, cands = [];
  if(p && p.hp>0) cands.push(p);
  for(const f of (g.followers||[])) if(f && f.hp>0) cands.push(f);
  let best = null, bd = DEATHBOLT_JUMP_R;
  for(const c of cands){ if(done.indexOf(c)>=0) continue; const d = dist(c, hitT); if(d < bd){ bd = d; best = c; } }
  if(!best) return;
  const ang = Math.atan2(best.y-hitT.y, best.x-hitT.x);
  g.projectiles.push({x:hitT.x, y:hitT.y, vx:Math.cos(ang)*DEATHBOLT_SPEED*1.3, vy:Math.sin(ang)*DEATHBOLT_SPEED*1.3, r:7, dmg:pr.dmg*DEATHBOLT_JUMP_MULT,
    from:'enemy', life:1.4, color:'#3a0a4a', isDeathBolt:true, homing:true, jumps:pr.jumps-1, dbHit:done, srcEnemy:pr.srcEnemy, targetRef:best});
  g.particles.push({type:'deathLink', x:hitT.x, y:hitT.y, x2:best.x, y2:best.y, t:0.3, max:0.3});
}
function drawPoisonWalkerIso(e){
  const iso = toIso(e.x,e.y), t = e.animT||0, face = e.faceSign||1, flash = e.hitT>0, s = e.r/30;
  const tele = e.tState==='tele', wind = e.windT>0 || e.atkAnimT>0;
  const walk = e.moving ? Math.sin(t*3.0) : 0, bob = e.moving ? Math.abs(walk)*2.2 : Math.sin(t*1.2)*1.2, pul = 0.5+0.5*Math.sin(t*3.4);
  drawShadow(iso.x, iso.y, 36*s, 12*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s); ctx.lineJoin='round'; ctx.lineCap='round'; ctx.strokeStyle='#0e1608'; ctx.lineWidth=1.5;
  const skin = flash?'#fff':'#6c8a44', skinL = flash?'#fff':'#8aab58', skinD = flash?'#fff':'#3a4e24', rag = flash?'#fff':'#3a3022', bone = flash?'#fff':'#d8d6b8';
  // toxic haze at the feet
  const hz = ctx.createRadialGradient(0,-4,2,0,-4,50); hz.addColorStop(0,'rgba(140,230,80,'+(0.22+0.1*pul)+')'); hz.addColorStop(1,'rgba(140,230,80,0)'); ctx.fillStyle = hz; ctx.beginPath(); ctx.ellipse(0,-4,50,22,0,0,7); ctx.fill();
  // legs: thick, ragged trousers
  for(const sd of [-1,1]){ const sw = walk*sd*4; ctx.fillStyle = skinD; ctx.fillRect(sd*12-8+sw*0.4,-30,16,30); ctx.strokeRect(sd*12-8+sw*0.4,-30,16,30); ctx.fillStyle = rag; ctx.beginPath(); ctx.moveTo(sd*12-10+sw*0.4,-34); ctx.lineTo(sd*12+10+sw*0.4,-34); ctx.lineTo(sd*12+8+sw*0.4,-16); ctx.lineTo(sd*12+3+sw*0.4,-12); ctx.lineTo(sd*12-3+sw*0.4,-18); ctx.lineTo(sd*12-9+sw*0.4,-13); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // bloated, hunched torso
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(0,-56-bob,31,29,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = skinL; ctx.beginPath(); ctx.ellipse(-8,-66-bob,16,13,0.3,0,7); ctx.fill();
  // exposed ribs and a split in the belly
  ctx.strokeStyle = bone; ctx.lineWidth = 2; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-22,-72+i*8-bob); ctx.quadraticCurveTo(-12,-68+i*8-bob,-4,-72+i*8-bob); ctx.stroke(); }
  ctx.strokeStyle = '#1c2a10'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(6,-76-bob); ctx.lineTo(10,-64-bob); ctx.lineTo(4,-54-bob); ctx.lineTo(12,-44-bob); ctx.stroke();
  // glowing poison sacs
  for(const [sx,sy,sr] of [[14,-52,8],[-16,-46,6.5],[2,-38,5.5],[20,-66,5]]){ const gg = ctx.createRadialGradient(sx,sy-bob,1,sx,sy-bob,sr+5); gg.addColorStop(0,'rgba(210,255,120,'+(0.8+0.2*pul)+')'); gg.addColorStop(1,'rgba(120,200,60,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(sx,sy-bob,sr+5,0,7); ctx.fill(); ctx.fillStyle = flash?'#fff':'#b6e86a'; ctx.strokeStyle='#1c2a10'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(sx,sy-bob,sr,0,7); ctx.fill(); ctx.stroke(); }
  // arms: long, hanging; one hauled up to smash
  const rise = tele||wind ? -34 : walk*5;
  ctx.strokeStyle = '#0e1608'; ctx.fillStyle = skin; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(24,-72-bob); ctx.lineTo(40,-40+rise-bob); ctx.lineTo(48,-38+rise-bob); ctx.lineTo(32,-76-bob); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-24,-72-bob); ctx.lineTo(-42,-34-bob); ctx.lineTo(-34,-30-bob); ctx.lineTo(-18,-70-bob); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = skinD; ctx.beginPath(); ctx.arc(46,-36+rise-bob,7,0,7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(-39,-30-bob,6,0,7); ctx.fill(); ctx.stroke();
  // head: small, sunken, jaw hanging
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(-2,-92-bob,11,12,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a0e0a'; ctx.beginPath(); ctx.ellipse(-2,-86-bob,5.5,6+ (wind?2:0),0,0,7); ctx.fill();
  ctx.fillStyle = tele ? '#ff5a3a' : '#e8ff6a'; ctx.beginPath(); ctx.arc(-6,-95-bob,2.2,0,7); ctx.arc(2,-95-bob,2.2,0,7); ctx.fill();
  ctx.fillStyle = 'rgba(150,230,70,0.8)'; ctx.fillRect(-3,-82-bob,2,6+Math.sin(t*5)*2);
  ctx.restore();
  // drifting spores
  ctx.save(); ctx.fillStyle = 'rgba(170,240,90,0.55)'; for(let i=0;i<5;i++){ const ph = (t*0.7+i*0.37)%1; ctx.beginPath(); ctx.arc(iso.x+Math.sin(i*2.3+t)*26*s, iso.y-30*s-ph*70*s, (2.4-ph*1.6)*s, 0, 7); ctx.fill(); } ctx.restore();
  drawHpBar(iso, 108*s, e.r, e.hp, e.maxHp);
}
function drawPoisonSnakeIso(e){
  const iso = toIso(e.x,e.y), t = e.animT||0, face = e.faceSign||1, flash = e.hitT>0, s = e.r/9, atk = e.atkAnimT>0;
  drawShadow(iso.x, iso.y, 12*s, 4*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s); ctx.lineJoin='round'; ctx.lineCap='round';
  const sp = e.moving ? 11 : 3, pts = [];
  for(let i=0;i<9;i++){ pts.push([-i*3.6 + 6, -4 - Math.sin(t*sp - i*0.9)*3.2*(0.4+i*0.1) - (atk && i<3 ? 6-i*2 : 0)]); }
  for(const [w,col] of [[7.5,'#0e1608'],[5.6,flash?'#fff':'#5e9a34']]){
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((q,i)=>{ if(i) ctx.lineTo(q[0],q[1]); else ctx.moveTo(q[0],q[1]); }); ctx.stroke();
    if(w<7){ w; }
  }
  ctx.strokeStyle = flash?'#fff':'#c8e860'; ctx.lineWidth = 1.2; ctx.beginPath(); for(let i=1;i<9;i+=2){ ctx.moveTo(pts[i][0]-1,pts[i][1]-2.5); ctx.lineTo(pts[i][0]+1,pts[i][1]+2.5); } ctx.stroke();
  ctx.fillStyle = flash?'#fff':'#4e8a2c'; ctx.strokeStyle = '#0e1608'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(pts[0][0]+3,pts[0][1],4.4,3.4,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffec4a'; ctx.beginPath(); ctx.arc(pts[0][0]+4,pts[0][1]-1.4,1,0,7); ctx.fill();
  if(atk || Math.sin(t*6)>0.7){ ctx.strokeStyle = '#e03030'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(pts[0][0]+7,pts[0][1]); ctx.lineTo(pts[0][0]+11,pts[0][1]-1); ctx.moveTo(pts[0][0]+7,pts[0][1]); ctx.lineTo(pts[0][0]+11,pts[0][1]+1.4); ctx.stroke(); }
  ctx.restore();
  drawHpBar(iso, 24*s, e.r, e.hp, e.maxHp);
}
function drawKeepMonsterIso(e){
  const iso = toIso(e.x,e.y), t = e.animT||0, face = e.faceSign||1, flash = e.hitT>0, tp = e.type;
  if(tp==='imp'){
    drawFloatDemon(iso, 0.7, face, t, 'imp', {flash, moving:e.moving, atk:e.atkAnimT>0});
    drawHpBar(iso, 50, e.r, e.hp, e.maxHp);
    return;
  }
  if(tp==='imp_old'){
    const walk = e.moving ? Math.sin(t*9) : 0, bob = e.moving ? Math.abs(walk)*1.6 : Math.sin(t*2)*0.8, atk = e.atkAnimT>0;
    drawShadow(iso.x, iso.y, 9, 3.4);
    ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face, 1); ctx.lineJoin='round'; ctx.lineCap='round'; ctx.strokeStyle='#2a0806'; ctx.lineWidth=1;
    ctx.fillStyle = flash?'#fff':'#a82a1a';
    ctx.fillRect(-4+walk*2,-7,3,7); ctx.fillRect(1-walk*2,-7,3,7);
    ctx.beginPath(); ctx.ellipse(0,-13-bob,6.5,7.5,0,0,7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,-24-bob,5.2,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash?'#fff':'#5a1008'; ctx.beginPath(); ctx.moveTo(-4,-27-bob); ctx.lineTo(-7,-34-bob); ctx.lineTo(-1.5,-28-bob); ctx.moveTo(4,-27-bob); ctx.lineTo(7,-34-bob); ctx.lineTo(1.5,-28-bob); ctx.fill();
    ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(-1.8,-24.5-bob,1,0,7); ctx.arc(2.2,-24.5-bob,1,0,7); ctx.fill();
    ctx.strokeStyle = flash?'#fff':'#a82a1a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(5,-15-bob); ctx.lineTo(atk?13:10,atk?-18-bob:-8-bob); ctx.moveTo(-5,-15-bob); ctx.lineTo(-10,-9-bob); ctx.moveTo(-5,-9); ctx.quadraticCurveTo(-14,-6,-12,-14); ctx.stroke();
    ctx.restore();
    drawHpBar(iso, 40, e.r, e.hp, e.maxHp);
    return;
  }
  if(tp==='wraithlord'){ drawWraithLordIso(e); return; }
  if(tp==='hellhound' || tp==='cinderfiend' || tp==='brimstonebrute' || tp==='demonboss'){ drawDemonIso(e); return; }
  if(tp==='wraithling'){
    const hop = (e.hop||16)+4, s = 1.25;
    drawShadow(iso.x, iso.y, 8*s, 3*s);
    ctx.save(); ctx.translate(iso.x, iso.y-hop-8); ctx.scale(face*s, s);
    const al = flash ? 1 : 0.72+0.15*Math.sin(t*5);
    ctx.globalAlpha = al;
    const gl = ctx.createRadialGradient(0,-2,1,0,-2,24); gl.addColorStop(0,'rgba(150,100,255,0.35)'); gl.addColorStop(1,'rgba(150,100,255,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0,-2,24,0,7); ctx.fill();
    ctx.fillStyle = flash?'#fff':'#3a2a5a'; ctx.strokeStyle = '#150e24'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-6,-10); ctx.quadraticCurveTo(0,-18,6,-10); ctx.quadraticCurveTo(9,0,5,8); ctx.lineTo(3,16+Math.sin(t*7)*2); ctx.lineTo(0,9); ctx.lineTo(-3,17+Math.sin(t*7+1)*2); ctx.lineTo(-5,8); ctx.quadraticCurveTo(-9,0,-6,-10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0a0612'; ctx.beginPath(); ctx.ellipse(0,-8,4,4.4,0,0,7); ctx.fill();
    ctx.fillStyle = e.fState==='tele' ? '#ff5a3a' : '#c8a0ff'; ctx.beginPath(); ctx.arc(-1.8,-8,1.2,0,7); ctx.arc(2,-8,1.2,0,7); ctx.fill();
    ctx.strokeStyle = 'rgba(80,50,130,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(5,-2); ctx.lineTo(11,2); ctx.moveTo(-5,-2); ctx.lineTo(-11,3); ctx.stroke();
    ctx.restore();
    drawHpBar(iso, 38*s+hop, e.r, e.hp, e.maxHp);
    return;
  }
  if(tp==='poisonsnake'){ drawPoisonSnakeIso(e); return; }
  if(tp==='poisonwalker'){ drawPoisonWalkerIso(e); return; }
  if(false){
    const s = e.r/30, tele = e.tState==='tele', wind = e.windT>0 || e.atkAnimT>0;
    const walk = e.moving ? Math.sin(t*3.2) : 0, bob = e.moving ? Math.abs(walk)*2.4 : Math.sin(t*1.2)*1.2;
    drawShadow(iso.x, iso.y, 34*s, 11*s);
    ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s); ctx.lineJoin='round'; ctx.lineCap='round'; ctx.strokeStyle='#120e10'; ctx.lineWidth=1.4;
    const flesh = flash?'#fff':'#7a6a62', fleshL = flash?'#fff':'#9a8a7e', fleshD = flash?'#fff':'#463a38', bone = '#d8d2bc';
    // legs: two thick stumps and a stray limb
    ctx.fillStyle = fleshD; ctx.fillRect(-18+walk*3,-24,13,24); ctx.strokeRect(-18+walk*3,-24,13,24); ctx.fillRect(5-walk*3,-24,13,24); ctx.strokeRect(5-walk*3,-24,13,24);
    // mass of fused bodies
    ctx.fillStyle = flesh; ctx.beginPath(); ctx.ellipse(0,-46-bob,30,26,0,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = fleshL; ctx.beginPath(); ctx.ellipse(-10,-54-bob,15,12,0.3,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = fleshD; ctx.beginPath(); ctx.ellipse(14,-38-bob,13,11,-0.2,0,7); ctx.fill(); ctx.stroke();
    // stitches and bone
    ctx.strokeStyle = '#2a1e1c'; ctx.lineWidth = 1.2; for(let i=0;i<5;i++){ ctx.beginPath(); ctx.moveTo(-18+i*8,-62-bob); ctx.lineTo(-18+i*8+3,-52-bob); ctx.stroke(); }
    ctx.strokeStyle = bone; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(18,-60-bob); ctx.lineTo(30,-76-bob); ctx.moveTo(-26,-44-bob); ctx.lineTo(-38,-54-bob); ctx.stroke();
    // arms: many hands, one raised to smash
    const rise = tele||wind ? -26 : walk*5;
    ctx.strokeStyle = '#120e10'; ctx.lineWidth = 1.4; ctx.fillStyle = fleshL;
    ctx.beginPath(); ctx.moveTo(24,-50-bob); ctx.lineTo(38,-32+rise-bob); ctx.lineTo(44,-30+rise-bob); ctx.lineTo(30,-46-bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-24,-50-bob); ctx.lineTo(-40,-30-bob); ctx.lineTo(-34,-28-bob); ctx.lineTo(-20,-44-bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(41,-30+rise-bob,6,0,7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(-37,-28-bob,5,0,7); ctx.fill(); ctx.stroke();
    // two small mismatched heads
    ctx.fillStyle = fleshL; ctx.beginPath(); ctx.ellipse(-4,-74-bob,9,10,0,0,7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(12,-68-bob,6,7,0,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = tele ? '#ff5a3a' : '#e8c070'; ctx.beginPath(); ctx.arc(-1,-75-bob,1.5,0,7); ctx.arc(-7,-74-bob,1.2,0,7); ctx.arc(14,-69-bob,1.2,0,7); ctx.fill();
    ctx.restore();
    drawHpBar(iso, 102*s, e.r, e.hp, e.maxHp);
    return;
  }
  // shadow cultist
  const walk = e.moving ? Math.sin(t*6) : 0, bob = e.moving ? Math.abs(walk)*1.4 : Math.sin(t*1.5)*0.8, cast = e.atkAnimT>0;
  drawShadow(iso.x, iso.y, 15, 5.2);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*1.25, 1.25); ctx.lineJoin='round'; ctx.lineCap='round';
  ctx.fillStyle = flash?'#fff':'#1d1428'; ctx.strokeStyle = '#08040e'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(-6,-26-bob); ctx.quadraticCurveTo(0,-34-bob,6,-26-bob); ctx.lineTo(8,0); ctx.lineTo(3,-3+walk*1.5); ctx.lineTo(-3,-1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = flash?'#fff':'#2c1c40'; ctx.beginPath(); ctx.moveTo(-6,-26-bob); ctx.quadraticCurveTo(0,-40-bob,6,-26-bob); ctx.quadraticCurveTo(0,-24-bob,-6,-26-bob); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#05020a'; ctx.beginPath(); ctx.ellipse(0,-29-bob,3.6,4,0,0,7); ctx.fill();
  ctx.fillStyle = '#c860ff'; ctx.beginPath(); ctx.arc(-1.4,-29.5-bob,1,0,7); ctx.arc(1.8,-29.5-bob,1,0,7); ctx.fill();
  ctx.strokeStyle = '#2c1c40'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(4,-22-bob); ctx.lineTo(10,cast?-30-bob:-18-bob); ctx.stroke();
  if(cast){ const gl = ctx.createRadialGradient(11,-31-bob,1,11,-31-bob,13); gl.addColorStop(0,'rgba(190,110,255,0.9)'); gl.addColorStop(1,'rgba(150,60,255,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(11,-31-bob,13,0,7); ctx.fill(); }
  else { ctx.fillStyle = '#9a50ff'; ctx.beginPath(); ctx.arc(10,-19-bob,2.4,0,7); ctx.fill(); }
  ctx.fillStyle = '#c8a050'; ctx.fillRect(-7,-14-bob,14,2);   // rope belt
  ctx.restore();
  drawHpBar(iso, 58, e.r, e.hp, e.maxHp);
}
// ---- Shadow Keep Dungeon, Demon Hold & the Wraith Lord (Stage C) ----
// ---- The Breach: endgame, 20 replayable floors (Stage D) ----
const LEVEL_CAP = 80;
const BR_BOSS = {5:'houndlord', 10:'cinderqueen', 15:'warden', 20:'tyrant'};
const BR_BOSS_NAME = {houndlord:'Gorefang, Hound-Lord of the Breach', cinderqueen:'Vexara, the Cinder Matriarch', warden:'The Brimstone Warden', tyrant:'The Ember Tyrant',
  fhcmd:'The Frosthold Commander, Returned', wraithlord:'The Wraith Lord, Bound to the Breach', trex:'Rex, the Crater King', gojira:'Gojira, Wrath of the Crater',
  minotaur:'The Minotaur, Returned', revenant:'The Templar Revenant, Returned', mastodon:'The Woolly Mastodon, Returned', leviathan:'The Marsh Leviathan, Returned', colossus:'The Molten Colossus, Returned', kraken:'The Kraken, Returned'};
// v398: endless Breach. Floors 5/10/15/20 keep the four demon lords; from floor 25 a boss from the campaign (or a returning demon lord) guards every fifth floor.
const BR_BOSS_POOL = ['houndlord','cinderqueen','warden','tyrant','fhcmd','wraithlord','trex','gojira'];
function brHash(n){ let x = Math.imul(n|0, 2654435761)>>>0; x ^= x>>>13; x = Math.imul(x, 1274126177)>>>0; return (x ^ (x>>>16))>>>0; }
const _brBossMemo = {};
function brBossKind(bf){
  if(!bf || bf%5) return null;   // only every fifth floor has a boss; the others open when their elite pack falls
  if(bf<=20) return BR_BOSS[bf];
  return brFloorTheme(bf);       // v505/v506: floors 25, 30, 35... are the themed boss floors
}
// v505: after the Ember Tyrant the Breach never ends. Every fifth floor from 25 is one of six themed boss floors, in shuffled cycles
// (no two the same in a row); fixed by the floor number, so a floor is always the same for every character.
const BR_THEME_LIST = ['minotaur','revenant','mastodon','leviathan','colossus','kraken'];
const BR_THEME_KINDS = {minotaur:1, revenant:1, mastodon:1, leviathan:1, colossus:1, kraken:1};
const _brSched = [];
function brFloorTheme(bf){
  if(bf<=20 || bf%5) return null;
  const i = bf/5-5;
  while(_brSched.length<=i){
    const cyc = (_brSched._c = (_brSched._c||0)+1), bag = BR_THEME_LIST.slice();
    for(let k=bag.length-1;k>0;k--){ const j = brHash(cyc*131+k*17) % (k+1); const t = bag[k]; bag[k] = bag[j]; bag[j] = t; }
    if(_brSched.length && bag[0]===_brSched[_brSched.length-1]) bag.push(bag.shift());
    for(const t of bag) _brSched.push(t);
  }
  return _brSched[i];
}
// beyond floor 20 every floor multiplies monster life and damage (monster level itself stays capped at 80)
function brScaleEnemy(e, bf){ if(!e || bf<=20) return e; const n = bf-20; e.hp = e.maxHp = Math.round(e.maxHp*Math.pow(1.07,n)); e.dmg *= Math.pow(1.045,n); return e; }
function brCheckpoint(p){ let f = p.breachBest||0; while(f>0 && !brBossKind(f)) f--; return f+1; }   // the floor after the last boss you slew (floors 5, 10, 15, 20, then every themed boss floor)
// coarse-grid flood fill: can the player walk from a to b, and which cells are reachable at all (used to keep every spawn reachable)
function brGridOk(ob, w, h, a, b){
  const C = 60, cols = Math.ceil(w/C), rows = Math.ceil(h/C), blk = new Uint8Array(cols*rows), seen = new Uint8Array(cols*rows);
  for(const o of ob){
    const x0 = Math.max(0,Math.floor((o.x-26)/C)), x1 = Math.min(cols-1,Math.floor((o.x+o.w+26)/C)), y0 = Math.max(0,Math.floor((o.y-26)/C)), y1 = Math.min(rows-1,Math.floor((o.y+o.h+26)/C));
    for(let yy=y0; yy<=y1; yy++) for(let xx=x0; xx<=x1; xx++) blk[yy*cols+xx] = 1;
  }
  const st = [Math.floor(a.y/C)*cols+Math.floor(a.x/C)]; seen[st[0]] = 1; blk[st[0]] = 0;
  while(st.length){ const c = st.pop(), cx = c%cols, cy = (c-cx)/cols; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx = cx+dx, ny = cy+dy; if(nx<1||ny<1||nx>=cols-1||ny>=rows-1) continue; const n = ny*cols+nx; if(seen[n]||blk[n]) continue; seen[n] = 1; st.push(n); } }
  return {ok: !!seen[Math.floor(b.y/C)*cols+Math.floor(b.x/C)], grid:{C, cols, seen}};
}
function brReach(grid, x, y){ if(!grid) return true; const cx = Math.floor(x/grid.C), cy = Math.floor(y/grid.C); return !!grid.seen[cy*grid.cols+cx]; }
const BR_PALS = [HOLD_PAL, {wp:['#5a3a30','#201210','#38241e'], fl:['#2e1e1a','#241612','#3a2a24','#2a1c18']}, {wp:['#5a2a3a','#1e0c14','#3a1a26'], fl:['#2a1620','#20101a','#361e2a','#26141e']}, {wp:['#3a1a1a','#120606','#2a1010'], fl:['#241010','#1a0a0a','#321818','#201010']}];
function breachDepth(f){ return clamp(68+Math.ceil(f*0.75), 69, 83); }
const BR_PACKS = [['imp','imp','imp'],['hellhound','hellhound','hellhound'],['imp','imp','hellhound','hellhound'],['cinderfiend','imp','imp'],['cinderfiend','cinderfiend','hellhound'],['brimstonebrute','imp','imp'],['brimstonebrute','cinderfiend'],['hellhound','hellhound','hellhound','hellhound','imp'],['brimstonebrute','brimstonebrute']];
const BR_TIER_PACKS = [[0,1,2],[1,2,3,4],[3,4,5,6,7],[4,5,6,7,8]];
// ---- v505: themed Breach boss floors (22+): a rooms-and-tunnels lair of the theme, ending in the boss's arena ----
const BR_THEME_PAL = {
  minotaur:{wp:['#6a6254','#2a2418','#4a4234'], fl:['#2a2620','#221e18','#322c24','#2a251e']},
  revenant:{wp:['#4a5468','#1c2230','#303a4c'], fl:['#22283a','#1a2030','#2a3248','#202638']},
  mastodon:{wp:['#5a7084','#26384a','#40586c'], fl:['#34424d','#2c3842','#3e4c58','#323f4a']},
  leviathan:{wp:['#3a4a2e','#141c10','#2a3a22'], fl:['#2a3a24','#20301c','#344630','#2c3c26']},
  colossus:{wp:['#4a2216','#1a0a05','#321610'], fl:['#241410','#1c100c','#2e1c14','#22140e']},
  kraken:{wp:['#3a6074','#16293a','#2a4a5e'], fl:['#2e4a58','#264050','#38586a','#2c4656']}
};
const BR_THEME_PACKS = {
  minotaur:[['skeleton','skeleton','skeletonarcher'],['skeletonbrute','skeleton','skeleton'],['skeletonbrute','skeletonbrute'],['skeleton','skeleton','skeleton','skeletonarcher']],
  revenant:[['skeleton','skeletonarcher','skeleton','skeletonbrute'],['spider','spider','spider'],['skeletonbrute','skeletonarcher','skeleton'],['skeleton','skeleton','spider']],
  mastodon:[['frozenzombie','frozenzombie','frozenzombie'],['bear:polar','bear:polar'],['warg:white','warg:white','warg:white'],['frozenzombie','frozenzombie','warg:white']],
  leviathan:[['giantoad','giantoad'],['zombie','zombie','zombie'],['poisonplant','poisonplant','zombie'],['giantoad','zombie','zombie']],
  colossus:[['lavabeetle','lavabeetle','lavabeetle'],['firebat','firebat','firebat'],['magmagolem','lavabeetle'],['magmacrawler','magmacrawler','magmacrawler']],
  kraken:[['stormsnake','stormsnake','stormsnake'],['stormsnake','stormsnake'],['squid','squid','squid'],['stormsnake','squid','squid']]
};
function brThemedFloor(rnd, bf, kind, w, h){
  const cy = Math.round(h/2), CORR = 150, ri = (a,b)=>Math.round(a+rnd()*(b-a));
  const colossus = kind==='colossus', pool = kind==='leviathan' || kind==='kraken';
  const aw = colossus ? 1950 : 1500, ah = colossus ? 1104 : 1300;
  const arena = {x:w-aw-120, y:cy-Math.round(ah/2), w:aw, h:ah}, startRect = {x:20, y:cy-220, w:620, h:440};
  const COLS = 3, ROWS = 3, gx0 = startRect.x+startRect.w+170, gx1 = arena.x-170, gy0 = 170, gy1 = h-170, cw = (gx1-gx0)/COLS, chh = (gy1-gy0)/ROWS;
  const rooms = [], forceL = ri(0,ROWS-1), forceR = ri(0,ROWS-1);
  for(let cyi=0; cyi<ROWS; cyi++) for(let cxi=0; cxi<COLS; cxi++){
    if(!((cxi===0 && cyi===forceL) || (cxi===COLS-1 && cyi===forceR)) && rnd()<0.2) continue;
    const rw = ri(400, Math.min(680, cw-90)), rh = ri(360, Math.min(600, chh-70));
    rooms.push({x:Math.round(gx0+cxi*cw+40+rnd()*(cw-rw-80)), y:Math.round(gy0+cyi*chh+30+rnd()*(chh-rh-60)), w:rw, h:rh, cxi, cyi});
  }
  const cen = rooms.map(rectCenter), edges = [], have = new Set(), key = (a,b)=> a<b ? a+','+b : b+','+a;
  const link = (a,b)=>{ if(have.has(key(a,b))) return false; have.add(key(a,b)); edges.push([a,b]); return true; };
  const pairs = [];
  for(let a=0;a<rooms.length;a++) for(let b=a+1;b<rooms.length;b++){ const d = dist(cen[a],cen[b]); pairs.push({a,b,d,k:d*(0.8+rnd()*0.45)}); }
  pairs.sort((x,y)=>x.k-y.k);
  const par = rooms.map((_,i)=>i), find = i=> par[i]===i ? i : (par[i]=find(par[i]));
  for(const pr of pairs){ const ra = find(pr.a), rb = find(pr.b); if(ra!==rb){ par[ra] = rb; link(pr.a, pr.b); } }
  for(const pr of pairs){ if(edges.length >= rooms.length+1) break; if(pr.d<1700 && rnd()<0.14) link(pr.a, pr.b); }
  const nearest = (pt, idx)=>{ let bi = idx[0], bd = 1e9; for(const i of idx){ const d = dist(pt, cen[i]); if(d<bd){ bd = d; bi = i; } } return bi; };
  const left = rooms.map((r,i)=>r.cxi===0 ? i : -1).filter(i=>i>=0), right = rooms.map((r,i)=>r.cxi===COLS-1 ? i : -1).filter(i=>i>=0);
  const inRoom = nearest(rectCenter(startRect), left), outRoom = nearest(rectCenter(arena), right);
  const floorRects = [startRect, ...rooms, arena];
  const tun = (a,b)=>{ floorRects.push(...(rnd()<0.5 ? tunnelRects(b.x,b.y,a.x,a.y,CORR) : tunnelRects(a.x,a.y,b.x,b.y,CORR))); };
  for(const [a,b] of edges) tun(cen[a], cen[b]);
  tun(rectCenter(startRect), cen[inRoom]);
  { const door = {x:arena.x-100, y:cy}; tun(cen[outRoom], door); floorRects.push(...tunnelRects(door.x, door.y, arena.x+arena.w/2, cy, CORR)); }   // into the arena along its middle line
  const ob = darkCryptCarveObstacles(floorRects, w, h);
  const ac = rectCenter(arena), out = {w, h, ob, floorRects, rooms, arena, startRect, zones:[], pool:null, heartGeo:null, pal:BR_THEME_PAL[kind]};
  if(colossus){   // the bowl is round: the corners of its rectangle are walled off
    const RX = aw/2, RY = ah/2;
    out.heartGeo = {AX0:arena.x, AX1:arena.x+aw, AY0:arena.y, AY1:arena.y+ah, CX:ac.x, CY:ac.y, RX, RY};
    for(let dy=-RY; dy<RY; dy+=40){
      const m = Math.min(Math.abs(dy), Math.abs(dy+40)), hw = RX*Math.sqrt(Math.max(0, 1-(m/RY)*(m/RY))), y = ac.y+dy;
      const lw = (ac.x-hw)-arena.x, rw2 = (arena.x+aw)-(ac.x+hw);
      if(lw>=30) ob.push({x:arena.x, y, w:Math.round(lw), h:40, mazeWall:true});
      if(rw2>=30) ob.push({x:Math.round(ac.x+hw), y, w:Math.round(rw2), h:40, mazeWall:true});
    }
    out.bossPos = {x:ac.x+240, y:ac.y};
  } else if(pool){   // a great pool in the arena (blocked water; the boss swims in it)
    const cx = arena.x+Math.round(aw*0.45), RX = 350, RY = 290;   // (a boss only stirs within one screen of you, so the pool is small)
    out.pool = {cx, cy:ac.y, rx:RX, ry:RY};
    for(let dy=-RY; dy<RY; dy+=40){ const m = Math.min(Math.abs(dy), Math.abs(dy+40)), hw = RX*Math.sqrt(Math.max(0, 1-(m/RY)*(m/RY))); ob.push({x:Math.round(cx-hw), y:Math.round(ac.y+dy), w:Math.round(hw*2), h:42, isWater:true}); }
    out.bossPos = {x:cx, y:ac.y};
  } else out.bossPos = {x:arena.x+Math.round(aw*0.45), y:ac.y};
  out.exitPending = {x:arena.x+aw-130, y:ac.y, r:54};
  // packs: one or two in every chamber, a few more in the biggest
  const packs = BR_THEME_PACKS[kind];
  let n = 0;
  for(const r of rooms){
    const np = 1 + (rnd()<0.6 ? 1 : 0);
    for(let k=0;k<np;k++){
      const pk = packs[Math.floor(rnd()*packs.length)].slice();
      for(let q=0;q<Math.floor(Math.max(0,bf-20)/8) && pk.length<8;q++) pk.push(pk[pk.length-1]);   // deeper floors: bigger packs
      out.zones.push({rect:[r.x+90, r.x+r.w-90, r.y+90, r.y+r.h-90], packs:[pk], elite:(n++%4===3)});
    }
  }
  return out;
}
function ensureBreachQuest(p){
  if(p.breachContained && !getQuest(p,'br_purge')) addQuestOnce(p, 'br_purge', 'Purge the Breach', 'The breach is contained, not closed. Descend and cut down the demons before they escape.', 20);
}
function breachFloorCleared(g){
  const p = g.player, t = g.tower, bf = t.bf, boss = brBossKind(bf);
  t.cleared = true;
  t.exitDoor = t.exitPending ? {x:t.exitPending.x, y:t.exitPending.y, r:t.exitPending.r||38} : {x:t.w-70, y:Math.round(t.h/2), r:38};
  p.breachBest = Math.max(p.breachBest||0, bf);
  const q = getQuest(p,'br_purge'); if(q && q.status==='active') q.progress = Math.max(q.progress, Math.min(q.total, p.breachBest));
  if(boss){
    p.gold += 400*bf;
    for(let i=0;i<(bf===20?2:1)+Math.floor(Math.max(0,bf-20)/10);i++) forceAddToBag(p, classRewardItem(p, Math.max(p.level, g.depth), 'reward'));
    bagPulse();
    bossMsg(bf===20 ? 'THE BREACH IS PURGED' : BR_BOSS[bf] ? 'DEMON LORD SLAIN' : 'GUARDIAN SLAIN', bf===20 ? 'Floor 20 cleared. It will not stay quiet.' : BR_BOSS_NAME[boss]+' falls. A reward lies in your pack.', 4.6);
    t.clearPortal = {x:t.w-330, y:Math.round(t.h/2)-190, r:24, toTown:true};
    showMsg('A portal to Mistfall opens. The breach will remember how deep you went.', 3.4, '#9fd8ff');
  } else showMsg('The guardians are slain. The way down opens.', 2.8, '#9ad0ff');
  if(bf===20){
    p.breachClears = (p.breachClears||0)+1;
    if(q && q.status==='active'){ q.status='complete'; q.rewarded=true; q.progress=q.total; q.desc='You have purged all twenty floors of the breach. It can always be entered again.'; p.gold += 8000; gainXp(g, 20000); showMsg('Quest complete: Purge the Breach', 3.6, '#e8c44a'); }
  }
  updateQuestBadge(); saveGame();
}
function enterBreach(){
  const p = game.player; ensureBreachQuest(p); p.breachReached = true;
  const f = brCheckpoint(p);
  enterKeep(9, {bf:f, seed:(Date.now()%100000)});
  if(f>1) showMsg('The breach remembers you. Resuming at Floor '+f, 3.0, '#ff9a6a');
}
function spawnBreachBoss(g, kind, pos){
  const e = spawnBreachBossRaw(g, kind, pos);
  if(e){ e.brBoss = true; brScaleEnemy(e, (g.room && g.room.bf) || 0); }
  return e;
}
function spawnBreachBossRaw(g, kind, pos){
  let e;
  const lv = (g.player&&g.player.level)||1;
  if(kind==='fhcmd'){
    e = spawnEnemy(g, 'fhtemplar', pos); initFhCommander(e); e.bossName = BR_BOSS_NAME.fhcmd; e.hp = e.maxHp = Math.round(e.maxHp*1.5);
    return e;
  }
  if(kind==='wraithlord'){
    e = spawnWraithLord(g, pos); e.bossName = BR_BOSS_NAME.wraithlord; e.hp = e.maxHp = Math.round(e.maxHp*1.2);
    return e;
  }
  if(kind==='trex'){
    e = spawnEnemy(g, 'trex', pos);
    e.isLairBoss = true; e.bossName = BR_BOSS_NAME.trex; e.trex = true; e.trState = 'idle'; e.trT = 0; e.trCd = 1.6; e.trIdx = 0; e.trPt = null; e.trWoke = false;
    e.dmg *= 1.5 + Math.max(0, lv-44)*0.09; e.pctFloor = 0.13;
    return e;
  }
  if(kind==='gojira'){
    e = spawnEnemy(g, 'gojira', pos);
    e.isLairBoss = true; e.bossName = BR_BOSS_NAME.gojira; e.baseR = e.r; initGojira(e);
    e.dmg *= 2.0 + Math.max(0, lv-44)*0.11; e.pctFloor = 0.16;
    return e;
  }
  if(BR_THEME_KINDS[kind]) return spawnThemedBreachBoss(g, kind, pos);
  if(kind==='tyrant'){
    e = spawnEnemy(g, 'balrog', pos); initBalrog(e); e.isLairBoss = true; e.bossName = BR_BOSS_NAME.tyrant; e.baseR = e.r;
    e.hp = e.maxHp = Math.round(e.maxHp*2.6); e.dmg *= 1.1;
    return e;
  }
  e = spawnEnemy(g, 'demonboss', pos);
  const K = {houndlord:{r:34,hp:0.95,spd:175,arm:10}, cinderqueen:{r:28,hp:1.1,spd:105,arm:8}, warden:{r:44,hp:1.35,spd:86,arm:24}}[kind];
  e.dboss = kind; e.isLairBoss = true; e.bossName = BR_BOSS_NAME[kind];
  e.r = e.baseR = K.r; e.hp = e.maxHp = Math.round(e.maxHp*K.hp); e.speed = K.spd; e.armor = K.arm; e.baseSpeed = K.spd;
  e.aggroRange = 99999; e.leashRange = 99999; e.wanderRadius = 0;
  e.dbState = 'dormant'; e.dbT = 0; e.dbCd = 2; e.dbIdx = 0; e.dbPh = 0; e.dbEnr = false; e.wlZones = [];
  return e;
}
// v505: the themed bosses of floors 22+ -- each is the campaign boss, re-armed for the Breach (brScaleEnemy then deepens it floor by floor)
function spawnThemedBreachBoss(g, kind, pos){
  const room = g.room, A = room.themeArena || {x:pos.x-300, y:pos.y-300, w:600, h:600};
  const guard = (type, n)=>{ for(let i=0;i<n;i++){ const m = spawnEnemy(g, type, {x:clamp(pos.x+rand(-260,260), A.x+80, A.x+A.w-80), y:clamp(pos.y+rand(-260,260), A.y+80, A.y+A.h-80)}); if(m){ brScaleEnemy(m, room.bf); m.aggroRange = 900; } } };
  let e = null;
  if(kind==='minotaur'){
    e = spawnEnemy(g, 'bear', pos);
    e.minotaur = true; e.isLairBoss = true; e.bossName = BR_BOSS_NAME.minotaur; e.r = Math.round(e.r*1.5); e.baseR = e.r;
    e.hp = e.maxHp = Math.round(e.maxHp*4.2); e.dmg *= 1.5; e.armor = Math.min(e.armor||0, 6); e.speed *= 1.05;
    guard('skeletonbrute', 3);
  } else if(kind==='revenant'){
    e = spawnEnemy(g, 'skeletonbrute', pos); initRevenant(e);
    guard('skeletonbrute', 2);
  } else if(kind==='mastodon'){
    e = spawnEnemy(g, 'bear', pos);
    e.r = Math.round(e.r*MASTODON_R_MULT); e.hp = e.maxHp = Math.round(e.hp*MASTODON_HP_MULT); e.dmg = e.dmg*MASTODON_DMG_MULT*0.8; e.armor = (e.armor||0) + 6;
    e.isLairBoss = true; e.bossName = BR_BOSS_NAME.mastodon; e.mastodon = true; e.dmgType = 'normal'; e.dmgSplit = 'cold'; e.dmg *= 1.1;
    e.aggroRange = 520; e.leashRange = 1400; e.wanderRadius = 20;
    guard('frozenzombie', 4);
  } else if(kind==='leviathan' || kind==='kraken'){
    const P = room.themePool || {cx:pos.x, cy:pos.y, rx:480, ry:380};
    const cfg = {free:true, bounds:[P.cx-P.rx+90, P.cx+P.rx-90], y0:P.cy-P.ry+80, y1:P.cy+P.ry-80, cx:P.cx, cy:P.cy};
    if(kind==='kraken'){ e = spawnLeviathanBoss(g, {x:P.cx, y:P.cy-1}, cfg); e.bossName = BR_BOSS_NAME.kraken; }
    else {
      e = spawnEnemy(g, 'leviathan', {x:P.cx, y:P.cy-1}); e.cfg = cfg;
      e.pool = true; e.lvBoss = true; e.isLairBoss = true; e.bossName = BR_BOSS_NAME.leviathan;
      e.r = Math.round(LV_R*0.7); e.hp = Math.round(e.hp/3*LV_HP_MULT); e.maxHp = e.hp; e.dmg = e.dmg*LV_DMG_MULT; e.atkCdMax = 1.6; e.armor = 6;
      e.lvState = 'idle'; e.lvT = 0; e.lvCd = 2.0; e.lvIdx = 0; e.lvSide = -1; e.lvSpeed = 230; e.exposedT = 0; e.lvPt = null; e.lvSpoke = false;
    }
  } else if(kind==='colossus'){
    e = spawnEnemy(g, 'colossus', pos);
    e.isLairBoss = true; e.bossName = BR_BOSS_NAME.colossus; initColossus(e);
  }
  return e;
}
function demonBossSlain(g, e){
  for(const o of g.enemies) if(o!==e && o.noReward) o.hp = 0;
  shakeScreen(g, 8, 0.9);
}
function dbSummon(g, e, types, rad){
  for(let i=0;i<types.length;i++){
    const a = Math.PI*2*i/types.length + Math.random(), room = g.room;
    const pos = subFreeSpot(room, e.x+Math.cos(a)*rad-40, e.x+Math.cos(a)*rad+40, e.y+Math.sin(a)*rad-40, e.y+Math.sin(a)*rad+40, null, 20) || {x:e.x+Math.cos(a)*rad, y:e.y+Math.sin(a)*rad};
    const m = spawnEnemy(g, types[i], pos); if(!m) continue;
    if(g.tower && g.tower.kpArea===9) brScaleEnemy(m, g.tower.bf);
    m.aggroRange = 900; m.leashRange = 3000; m.noReward = true; m.wlMinion = true;
    g.particles.push({type:'burst', x:pos.x, y:pos.y, t:0.4, max:0.4, color:'#ff6a3a'});
  }
}
function dbAdds(kind){ return kind==='houndlord' ? ['hellhound','hellhound','hellhound'] : kind==='cinderqueen' ? ['cinderfiend','cinderfiend','imp','imp'] : ['imp','imp','imp','imp']; }
function updateDemonBoss(g, e, dt, target, d, isFT, chill, room){
  const p = g.player, kind = e.dboss, frac = e.hp/e.maxHp, F = e.dbEnr ? 0.8 : 1;
  const face = a=>{ e.facing = {x:Math.cos(a), y:Math.sin(a)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); };
  const toT = ()=>Math.atan2(target.y-e.y, target.x-e.x);
  e.moving = false; e.windT = 0;
  if(e.invulnT>0){ e.invulnT -= dt; if(e.hp<e.guardHp) e.hp = e.guardHp; }
  if(e.wlImmune){ e.hp = e.wlLockHp; e.invulnT = Math.max(e.invulnT, 0.25); e.guardHp = e.hp; }
  for(let i=e.wlZones.length-1;i>=0;i--){ const z = e.wlZones[i]; z.t -= dt; if(z.t<=0){ wlZoneResolve(g, e, z); e.wlZones.splice(i,1); } }
  e.x = clamp(e.x, 70, room.w-70); e.y = clamp(e.y, 70, room.h-70);
  const st = e.dbState;
  const stepTo = (tx,ty,mul)=>{ const a2 = steerAngleTo(e, tx, ty, room.obstacles), sp = e.speed*chill*(mul||1)*dt; e.x += Math.cos(a2)*sp; e.y += Math.sin(a2)*sp; e.moving = true; };
  const zone = (o)=>{ o.max = o.t; e.wlZones.push(o); };
  if(st==='dormant'){ if(d<760 || e.hp<e.maxHp){ e.dbState = 'intro'; e.dbT = 2.0; e.invulnT = 2.0; e.guardHp = e.hp; shakeScreen(g, 5, 0.6); } return; }
  if(st==='intro'){ e.dbT -= dt; face(toT()); if(e.dbT<=0){ e.dbState = 'idle'; e.dbCd = 1.2; } return; }
  if(e.dbPh<1 && frac<0.66){ e.dbPh = 1; dbSummon(g, e, dbAdds(kind), 200); showMsg(e.bossName+' calls its brood!', 2.4, '#ff9a6a'); shakeScreen(g, 5, 0.4); }
  if(e.dbPh<2 && frac<0.33){ e.dbPh = 2; e.dbEnr = true; e.speed = e.baseSpeed*1.2; dbSummon(g, e, dbAdds(kind), 210); bossMsg('ENRAGED', e.bossName, 2.6); shakeScreen(g, 7, 0.6); }
  if(st==='tele'){
    e.dbT -= dt; e.atkAnimT = 0.1; face(toT());
    if(e.dbT<=0){
      const act = e.dbAct;
      if(act==='pounce' || act==='charge'){
        const len = act==='pounce' ? 520 : 420;
        for(let i=1;i<=6;i++) g.particles.push({type:'burst', x:e.x+Math.cos(e.dbDir)*len*i/6, y:e.y+Math.sin(e.dbDir)*len*i/6, t:0.35, max:0.35, color:'#ff8a3a'});
        e.x = clamp(e.x+Math.cos(e.dbDir)*len, 70, room.w-70); e.y = clamp(e.y+Math.sin(e.dbDir)*len, 70, room.h-70);
      } else if(act==='fan'){
        const n = e.dbEnr ? 13 : 9, base = toT();
        for(let k=0;k<n;k++){ const a = base+(k/(n-1)-0.5)*1.2; g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(a)*280,vy:Math.sin(a)*280,r:9,dmg:e.dmg*0.6,from:'enemy',life:2.4,color:'#ff9a3a',srcEnemy:e,targetRef:target}); }
        shakeScreen(g, 3, 0.15);
      } else if(act==='blink'){
        const a = Math.random()*6.28, bx = target.x+Math.cos(a)*340, by = target.y+Math.sin(a)*340;
        const pos = subFreeSpot(room, bx-60, bx+60, by-60, by+60, null, 20); if(pos){ e.x = pos.x; e.y = pos.y; }
        g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#ff9a3a'});
      } else if(act==='summon'){ dbSummon(g, e, kind==='houndlord' ? ['hellhound','hellhound','hellhound'] : kind==='cinderqueen' ? ['cinderfiend','cinderfiend','cinderfiend'] : ['brimstonebrute','imp','imp'], 190); shakeScreen(g, 4, 0.3); }
      e.dbState = 'recover'; e.dbT = act==='pounce' ? 0.5 : 0.6*F; return;
    }
    return;
  }
  if(st==='recover'){ e.dbT -= dt; face(toT()); if(e.dbT<=0) e.dbState = 'idle'; return; }
  // idle
  face(toT());
  if(kind==='cinderqueen'){
    if(d<250) stepTo(e.x-(target.x-e.x), e.y-(target.y-e.y), 0.9); else if(d>400) stepTo(target.x, target.y, 1);
  } else if(d>e.r+target.r+70) stepTo(target.x, target.y, 1);
  e.atkCd -= dt;
  if(kind!=='cinderqueen' && d<e.r+target.r+60 && e.atkCd<=0){ e.atkCd = 1.3; wlHit(g, e, target, 0.45); e.atkAnimT = 0.25; g.particles.push({type:'burst', x:target.x, y:target.y, t:0.25, max:0.25, color:'#ff9a6a'}); }
  e.dbCd -= dt; if(e.dbCd>0) return;
  e.dbCd = rand(1.1,1.8)*F;
  const seqs = {houndlord:['pounce','bite','howl','fissure','pounce','bite'], cinderqueen:['fan','meteor','blink','summon','fan','meteor'], warden:['slam','lash','charge','slam','summon']};
  const mv = seqs[kind][e.dbIdx++ % seqs[kind].length], A = toT();
  const tele = (act,T)=>{ e.dbState = 'tele'; e.dbT = T; e.dbAct = act; };
  if(mv==='pounce'){ e.dbDir = A; const T = 0.8*F; zone({kind:'line', x:e.x, y:e.y, ang:A, len:520, r:50, t:T, mult:1.1}); tele('pounce', T); }
  else if(mv==='bite'){ const T = 0.5*F; zone({kind:'cone', x:e.x, y:e.y, ang:A, arc:1.7, r:150, t:T, mult:1.0}); zone({kind:'cone', x:e.x, y:e.y, ang:A, arc:1.7, r:150, t:T+0.45, mult:1.0}); tele(null, T+0.45); }
  else if(mv==='howl') tele('summon', 1.0);
  else if(mv==='fissure'){ const T = 1.0*F; for(let i=-1;i<=1;i++){ const a = A+i*0.5, rd = 180+Math.abs(i)*60; zone({kind:'circle', x:e.x+Math.cos(a)*rd, y:e.y+Math.sin(a)*rd, r:105, t:T+Math.abs(i)*0.15, mult:0.9, rupt:true, col:'255,100,50'}); } tele(null, T+0.3); }
  else if(mv==='fan') tele('fan', 0.8*F);
  else if(mv==='meteor'){ const T = 1.15*F; zone({kind:'circle', x:target.x, y:target.y, r:95, t:T, mult:0.9, rupt:true, col:'255,120,40'}); for(let i=0;i<4;i++){ const a = Math.random()*6.28, rd = rand(110,330); zone({kind:'circle', x:clamp(target.x+Math.cos(a)*rd,80,room.w-80), y:clamp(target.y+Math.sin(a)*rd,80,room.h-80), r:95, t:T+0.15+i*0.12, mult:0.9, rupt:true, col:'255,120,40'}); } tele(null, T+0.3); }
  else if(mv==='blink') tele('blink', 0.5);
  else if(mv==='summon') tele('summon', 1.1);
  else if(mv==='slam'){ const T = 1.2*F; zone({kind:'circle', x:e.x, y:e.y, r:230, t:T, mult:1.1, col:'255,110,60'}); if(e.dbEnr) zone({kind:'circle', x:e.x, y:e.y, r:340, t:T+0.5, mult:0.8, col:'255,90,40'}); tele(null, T+(e.dbEnr?0.5:0)); }
  else if(mv==='lash'){ const T = 0.9*F; zone({kind:'line', x:e.x, y:e.y, ang:A, len:500, r:70, t:T, mult:1.1}); tele(null, T); }
  else if(mv==='charge'){ e.dbDir = A; const T = 0.9*F; zone({kind:'line', x:e.x, y:e.y, ang:A, len:420, r:60, t:T, mult:1.1}); tele('charge', T); }
}
