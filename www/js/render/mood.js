// Region darkening: the south of Sunlit Plains fades to dusk toward the Cursed Cemetery,
// the east of Lakeside Ruins fades to swamp murk toward the Black Marsh, and the marsh
// itself stays gloomy (darker toward the Forgotten Tower).
// ---- v470 mood pass: colour grading, ground grime, soft outlines, light falloff and film grain ----
// Everything here is screen-space and cheap: a few full-screen fills per frame plus two small cached textures.
// Settings > Graphics can switch the grade (Atmosphere) and the grain off for slow phones.
// desat: share of colour pulled out (0-1) | mul: multiply tint (darkens + colours) | vig: edge darkness around the player
// grime: ground dirt strength | crush: how much the brightest whites are pulled down
const MOOD_PROFILES = {
  _default:      {desat:0.30, mul:'rgb(226,216,204)', vig:0.42, grime:0.30},
  town:          {desat:0.22, mul:'rgb(232,220,208)', vig:0.40, grime:0.30},
  tavern:        {desat:0.18, mul:'rgb(240,222,200)', vig:0.38, grime:0.22},
  forest:        {desat:0.30, mul:'rgb(208,214,200)', vig:0.48, grime:0.34},
  sunlitplains:  {desat:0.42, mul:'rgb(214,196,170)', vig:0.46, grime:0.42, crush:0.10},
  rivervalley:   {desat:0.40, mul:'rgb(206,204,182)', vig:0.44, grime:0.40, crush:0.08},
  lakesideruins: {desat:0.36, mul:'rgb(204,206,196)', vig:0.44, grime:0.36},
  blackmarsh:    {desat:0.30, mul:'rgb(196,206,184)', vig:0.50, grime:0.34},
  cursedcemetery:{desat:0.30, mul:'rgb(206,204,220)', vig:0.52, grime:0.34},
  darkcrypt:     {desat:0.22, mul:'rgb(226,214,198)', vig:0.0,  grime:0.30},
  ancientruins:  {desat:0.26, mul:'rgb(222,212,196)', vig:0.0,  grime:0.30},
  dungeon:       {desat:0.24, mul:'rgb(226,210,192)', vig:0.0,  grime:0.30},
  spiderlair:    {desat:0.28, mul:'rgb(214,214,204)', vig:0.0,  grime:0.30},
  bearcave:      {desat:0.28, mul:'rgb(222,212,196)', vig:0.0,  grime:0.30},
  minotaurcave:  {desat:0.26, mul:'rgb(226,210,194)', vig:0.0,  grime:0.30},
  raptorlair:    {desat:0.24, mul:'rgb(230,208,188)', vig:0.0,  grime:0.30},
  lighthouse:    {desat:0.26, mul:'rgb(224,214,202)', vig:0.30, grime:0.30},
  mountainpass:  {desat:0.38, mul:'rgb(196,200,206)', vig:0.46, grime:0.34, crush:0.16},
  icyzone:       {desat:0.38, mul:'rgb(184,190,200)', vig:0.48, grime:0.30, crush:0.30},
  frosthold:     {desat:0.40, mul:'rgb(178,186,198)', vig:0.50, grime:0.34, crush:0.34},
  highlands:     {desat:0.38, mul:'rgb(200,202,204)', vig:0.44, grime:0.36, crush:0.14},
  redridge:      {desat:0.34, mul:'rgb(206,186,168)', vig:0.48, grime:0.40, crush:0.16},
  redcrater:     {desat:0.26, mul:'rgb(222,196,180)', vig:0.48, grime:0.36},
};
function moodProfile(g){
  const pr = MOOD_PROFILES[g.scene] || MOOD_PROFILES._default;
  if(g.scene==='lighthouse' && g.room){
    if(g.room.hell || g.room.deep) return {desat:0.20, mul:'rgb(232,206,190)', vig:0.0, grime:0.30};
    if(g.room.subzone==='pool') return MOOD_PROFILES.blackmarsh;
    if(g.room.subzone==='keep' && kpOutdoor(g)) return {desat:0.36, mul:'rgb(196,198,210)', vig:0.50, grime:0.34};
  }
  if(g.scene==='mountainpass' && g.mtn && g.mtn.isCliff) return {desat:0.34, mul:'rgb(198,202,214)', vig:0.50, grime:0.34};
  return pr;
}
const MOOD_DBG = {};
function moodOn(){ return !settings || settings.atmos!==false; }
function grainOn(){ return !settings || settings.grain!==false; }
function moodLow(){ return !!(settings && settings.atmos==='low'); }

// a tileable dirt texture (blotches, speckles, hairline cracks) laid over the ground. It is built already squashed
// to the iso ground plane (2:1) and drawn with a plain integer offset, so painting it is a straight blend, no resampling.
let moodGrimeCanvas = null, moodGrimePattern = null;
const GRIME_TW = 512, GRIME_TH = 256;
function moodGrime(){
  if(moodGrimeCanvas) return moodGrimeCanvas;
  const TW = GRIME_TW, TH = GRIME_TH, c = document.createElement('canvas'); c.width = TW; c.height = TH;
  const x = c.getContext('2d'), img = x.createImageData(TW, TH), d = img.data;
  let s = 9173; const rnd = ()=>{ s = (s*16807) % 2147483647; return s/2147483647; };
  const oct = [[4,0.42],[8,0.26],[16,0.17],[32,0.10],[64,0.05]].map(([n,w])=>{ const a = new Float32Array(n*n); for(let i=0;i<a.length;i++) a[i] = rnd(); return {n, w, a}; });
  const sm = (t)=>t*t*(3-2*t);
  for(let py=0; py<TH; py++) for(let px=0; px<TW; px++){
    let v = 0;
    for(const o of oct){
      const n = o.n, fx = px/TW*n, fy = py/TH*n, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = sm(fx-x0), ty = sm(fy-y0);
      const a = o.a, i00 = (y0%n)*n + (x0%n), i10 = (y0%n)*n + ((x0+1)%n), i01 = ((y0+1)%n)*n + (x0%n), i11 = ((y0+1)%n)*n + ((x0+1)%n);
      const top = a[i00]+(a[i10]-a[i00])*tx, bot = a[i01]+(a[i11]-a[i01])*tx;
      v += (top+(bot-top)*ty)*o.w;
    }
    let k = Math.min(1, Math.max(0, (0.5-v)*1.9+0.5));   // 0 = clean, 1 = grimy
    let al = 0.08 + 0.55*k*k;
    if(rnd() < 0.035) al = Math.min(1, al + 0.25 + rnd()*0.2);
    const i = (py*TW+px)*4; d[i] = 30; d[i+1] = 22; d[i+2] = 14; d[i+3] = Math.round(255*al);
  }
  x.putImageData(img, 0, 0);
  x.lineCap = 'round';
  for(let k=0;k<16;k++){
    let cx = rnd()*TW, cy = rnd()*TH, a = rnd()*6.283;
    x.strokeStyle = 'rgba(24,16,10,'+(0.30+rnd()*0.3)+')'; x.lineWidth = 0.7+rnd()*0.8;
    const pts = [[cx,cy]];
    for(let j=0;j<6+rnd()*8;j++){ a += (rnd()-0.5)*1.2; cx += Math.cos(a)*(6+rnd()*10); cy += Math.sin(a)*(3+rnd()*5); pts.push([cx,cy]); }
    for(const ox of [-TW,0,TW]) for(const oy of [-TH,0,TH]){ x.beginPath(); pts.forEach(([u,w],j)=>j ? x.lineTo(u+ox,w+oy) : x.moveTo(u+ox,w+oy)); x.stroke(); }
  }
  for(let k=0;k<30;k++){
    const px = rnd()*TW, py = rnd()*TH, r = 1+rnd()*2.2;
    x.fillStyle = 'rgba(24,16,10,0.5)'; x.beginPath(); x.ellipse(px, py+r*0.4, r*1.4, r*0.8, 0, 0, 7); x.fill();
    x.fillStyle = 'rgba(210,196,170,0.35)'; x.beginPath(); x.ellipse(px-r*0.2, py-r*0.2, r*0.8, r*0.45, 0, 0, 7); x.fill();
  }
  moodGrimeCanvas = c;
  return c;
}
// called right after the floor is painted (before props and characters) -- dirties the ground only
function drawGroundGrime(g, cam){
  if(!moodOn() || moodLow()) return;
  const pr = moodProfile(g); if(!(pr.grime>0) || MOOD_DBG.noGrime) return;
  if(!moodGrimePattern) moodGrimePattern = ctx.createPattern(moodGrime(), 'repeat');
  const pat = moodGrimePattern;
  // anchored to the world (whole device pixels, so the tile is never resampled)
  const ox = -Math.round(cam.x*DPR) % GRIME_TW, oy = -Math.round(cam.y*DPR) % GRIME_TH;
  ctx.save(); ctx.setTransform(1,0,0,1,ox,oy);
  ctx.globalAlpha = Math.min(1, pr.grime*1.6);
  ctx.fillStyle = pat; ctx.fillRect(-ox, -oy, canvas.width, canvas.height);
  ctx.restore();
}
// colour grade + light falloff around the player, applied after the world and characters but BEFORE spells,
// projectiles and damage numbers, so magic still burns bright against the muted world
// v473: the grade is applied by the browser's compositor instead of being painted into the canvas each frame.
// Blend-mode fills (saturation / multiply / soft-light) force the GPU to copy the whole frame for every pass,
// which is what slowed phones down. A CSS filter on the canvas plus a plain alpha vignette and a sliding grain
// layer cost almost nothing by comparison. Spells and numbers are graded too now, but stay bright enough to read.
let moodCssKey = '';
const moodVigEl = document.getElementById('moodVig'), moodGrainEl = document.getElementById('moodGrain');
function moodFilterFor(pr){
  const m = pr._rgb || (pr._rgb = pr.mul.match(/\d+/g).map(Number));
  const lum = (m[0]*0.3 + m[1]*0.59 + m[2]*0.11)/255, warm = Math.max(0, (m[0]-m[2])/255);
  const sat = Math.max(0.35, 1 - pr.desat*1.15), bri = Math.max(0.55, lum - (pr.crush||0)*0.35);
  return 'saturate('+sat.toFixed(2)+') sepia('+Math.min(0.45, warm*1.3).toFixed(2)+') brightness('+bri.toFixed(2)+') contrast(1.12)';
}
function applyMoodCss(g){
  const on = !!(g && g.started) && moodOn() && !MOOD_DBG.noCss;
  const pr = on ? moodProfile(g) : null;
  const key = on ? (g.scene+'|'+(g.room&&g.room.subzone||'')+'|'+(pr.mul)+'|'+pr.desat+'|'+pr.vig+'|'+grainOn()) : 'off|'+grainOn()+'|'+!!(g&&g.started);
  if(key===moodCssKey) return; moodCssKey = key;
  if(!on){ canvas.style.filter = ''; if(moodVigEl) moodVigEl.style.display = 'none'; if(moodGrainEl) moodGrainEl.style.display = (g && g.started && grainOn()) ? 'block' : 'none'; return; }
  canvas.style.filter = moodFilterFor(pr);
  if(moodVigEl){
    if(pr.vig>0){
      const m = pr._rgb, t = 'rgba('+Math.round(m[0]*0.05)+','+Math.round(m[1]*0.04)+','+Math.round(m[2]*0.04)+',';
      moodVigEl.style.background = 'radial-gradient(ellipse 75% 70% at 50% 47%, '+t+'0) 38%, '+t+(pr.vig*0.5).toFixed(2)+') 72%, '+t+Math.min(0.85,pr.vig*1.15).toFixed(2)+') 100%)';
      moodVigEl.style.display = 'block';
    } else moodVigEl.style.display = 'none';
  }
  if(moodGrainEl) moodGrainEl.style.display = grainOn() ? 'block' : 'none';
}
// the grain texture is made once and handed to the overlay as an image; CSS slides it around in jumps
(function makeGrainTile(){
  try{
    const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'), img = x.createImageData(N, N), d = img.data;
    for(let i=0;i<N*N;i++){ if(Math.random() < 0.30){ const lt = Math.random() < 0.5, v = lt ? 235 : 10; d[i*4] = d[i*4+1] = d[i*4+2] = v; d[i*4+3] = Math.round((lt ? 7 : 16) + Math.random()*(lt ? 10 : 16)); } }
    x.putImageData(img, 0, 0);
    if(moodGrainEl) moodGrainEl.style.backgroundImage = 'url('+c.toDataURL('image/png')+')';
  }catch(e){}
})();
function drawMoodGrade(g){ applyMoodCss(g); }
function drawFilmGrain(g){}
// soft outlines: while the world is drawn, near-black outline strokes are made translucent so shapes read as
// shaded forms instead of cartoon cut-outs (detail lines in mid and light colours are untouched)
const MOOD_STROKE_CACHE = new Map();
let moodSoftStroke = false;
(function hookStrokeStyle(){
  try{
    const proto = CanvasRenderingContext2D.prototype, desc = Object.getOwnPropertyDescriptor(proto, 'strokeStyle');
    if(!desc || !desc.set) return;
    const parse = (v)=>{
      let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
      if(m){ let h = m[1]; if(h.length===3) h = h.split('').map(q=>q+q).join(''); return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16), 1]; }
      m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(v);
      if(m) return [+m[1], +m[2], +m[3], m[4]!=null ? +m[4] : 1];
      return null;
    };
    const soften = (v)=>{
      let out = MOOD_STROKE_CACHE.get(v);
      if(out!==undefined) return out;
      out = v;
      const c = parse(v);
      if(c){ const L = (0.299*c[0] + 0.587*c[1] + 0.114*c[2])/255; if(L < 0.16) out = 'rgba('+c[0]+','+c[1]+','+c[2]+','+(c[3]*0.6).toFixed(3)+')'; }
      if(MOOD_STROKE_CACHE.size < 4000) MOOD_STROKE_CACHE.set(v, out);
      return out;
    };
    Object.defineProperty(proto, 'strokeStyle', {
      configurable:true,
      get(){ return desc.get.call(this); },
      set(v){ this._rawStroke = v; desc.set.call(this, (moodSoftStroke && typeof v==='string') ? soften(v) : v); }
    });
    // text outlines keep their full strength (labels must stay legible)
    const st = proto.strokeText;
    proto.strokeText = function(){
      if(!moodSoftStroke || this._rawStroke==null) return st.apply(this, arguments);
      const cur = desc.get.call(this); desc.set.call(this, this._rawStroke);
      try{ return st.apply(this, arguments); } finally { desc.set.call(this, cur); }
    };
  }catch(e){}
})();
function drawRegionDarkening(g){
  const p = g.player;
  let a = 0, col = '8,6,26';
  const sm = (v)=>{ v = clamp(v,0,1); return v*v*(3-2*v); };
  if(g.scene==='sunlitplains'){ a = 0.2 + sm((p.y-SUN_H*0.42)/(SUN_H*0.5))*0.38; col='64,28,14'; }
  else if(g.scene==='lakesideruins'){ a = 0.30 + sm((p.x-LAKE_W*0.6)/(LAKE_W*0.38))*0.26; col='10,12,8'; drawGrittyGrade(g); }
  else if(g.scene==='blackmarsh'){ a = 0.44 + 0.14*clamp(p.x/BM_W,0,1); col='4,22,12'; }
  else if(g.scene==='highlands'){ a = 0.2; col='26,34,48'; }
  else if(g.scene==='lighthouse' && g.room && g.room.subzone==='pool'){ a = 0.52; col='4,22,12'; }
  else if(g.scene==='forest'){   // v229: a little lighter, and brighter again toward the Sunlit Plains exit (south)
    const fh = (g.forest && g.forest.h) || 3800;
    a = 0.32 * (1 - 0.8*sm((p.y - fh*0.5)/(fh*0.46))); col='2,8,14';
  }
  else if(g.scene==='rivervalley'){ a = 0.07*(1 - sm((p.y-150)/1100)); col='2,8,14'; }   // v233: continues the Forest's brightening south gate into open daylight
  else if(g.scene==='town'){ a = 0.32; col='12,10,34'; }      // v193: Mistfall's dusk
  if(a < 0.005) return;
  ctx.save();
  ctx.fillStyle = 'rgba('+col+','+a.toFixed(3)+')'; ctx.fillRect(0,0,W,H);
  // darker toward the screen edges so the light seems to close in
  const vg = ctx.createRadialGradient(W/2,H/2,H*0.22, W/2,H/2,Math.hypot(W,H)*0.55);
  vg.addColorStop(0,'rgba('+col+',0)'); vg.addColorStop(1,'rgba('+col+','+Math.min(0.6,a*0.9).toFixed(3)+')');
  ctx.fillStyle = vg; ctx.fillRect(0,0,W,H);
  ctx.restore();
  if(g.scene==='forest'){ drawAmbientMist(g, 0.10*Math.max(0.25, a/0.32), '150,190,190'); }   // v199: fireflies removed
  else if(g.scene==='sunlitplains') drawSunsetGlow(g);
  else if(g.scene==='highlands') drawHighlandsAtmos(g);
  else if(g.scene==='town'){ drawAmbientMist(g, 0.17, '190,200,228'); drawTownGlows(g); }
}
// v456: Sunlit Plains at sundown -- warm colour grade, a low amber sun off to the west (the lighthouse side) with long rays
function drawSunsetGrade(g){
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  const gr = ctx.createLinearGradient(0,0,W,H);
  gr.addColorStop(0,'rgb(255,214,160)'); gr.addColorStop(0.55,'rgb(236,190,160)'); gr.addColorStop(1,'rgb(170,150,180)');
  ctx.fillStyle = gr; ctx.fillRect(0,0,W,H); ctx.restore();
}
function drawSunsetGlow(g){
  const p = g.player, t = g.clock||0, near = 1 - clamp(p.x/SUN_W,0,1);   // brighter toward the lighthouse
  // west in this projection is up-left on screen
  const sx = -W*0.06, sy = -H*0.18, R = H*1.05;
  ctx.save();
  const wash = ctx.createLinearGradient(0,0,W,H); wash.addColorStop(0,'rgba(255,150,60,0.16)'); wash.addColorStop(1,'rgba(120,50,90,0.14)');
  ctx.fillStyle = wash; ctx.fillRect(0,0,W,H);   // warm evening grade (plain alpha fill, mobile-friendly)
  ctx.globalCompositeOperation = 'lighter';
  const rg = ctx.createRadialGradient(sx,sy,10, sx,sy,R);
  rg.addColorStop(0,'rgba(255,170,70,'+(0.5+0.2*near).toFixed(3)+')'); rg.addColorStop(0.35,'rgba(255,120,40,'+(0.2+0.1*near).toFixed(3)+')'); rg.addColorStop(1,'rgba(255,90,30,0)');
  ctx.fillStyle = rg; ctx.fillRect(0,0,Math.min(W,sx+R),Math.min(H,sy+R));
  for(let i=0;i<3;i++){
    const a0 = 0.3 + i*0.18 + Math.sin(t*0.15+i)*0.02, L = Math.hypot(W,H)*0.9, wdt = 0.03 + (i%2)*0.015;
    const al = (0.05 + 0.03*Math.sin(t*0.4+i*1.7)) * (0.7+0.5*near);
    const lg = ctx.createLinearGradient(sx,sy, sx+Math.cos(a0)*L, sy+Math.sin(a0)*L);
    lg.addColorStop(0,'rgba(255,190,110,'+al.toFixed(3)+')'); lg.addColorStop(1,'rgba(255,150,60,0)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx+Math.cos(a0-wdt)*L, sy+Math.sin(a0-wdt)*L); ctx.lineTo(sx+Math.cos(a0+wdt)*L, sy+Math.sin(a0+wdt)*L); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
// v456: Lakeside Ruins -- drained, grimy colour (a Diablo II-ish grade)
function drawGrittyGrade(g){
  ctx.save();
  ctx.fillStyle = 'rgba(74,66,52,0.24)'; ctx.fillRect(0,0,W,H);   // one cheap brown wash (no blend modes: mobile-friendly)
  ctx.restore();
}
// drifting screen-space mist banks
function drawAmbientMist(g, a, col){
  const t = g.clock||0; ctx.save();
  for(let i=0;i<8;i++){
    const S = Math.max(W,H), x = ((i*233*S/W + t*(5+i*1.7)) % (S+560)) - 280 - (S-W)/2, y = H/2 + S*(0.08+0.115*i-0.5) + Math.sin(t*0.17+i*1.3)*22;   // v452: spread over the long side so landscape isn't mistier than portrait
    const gr = ctx.createRadialGradient(x,y,8,x,y,290);
    gr.addColorStop(0,'rgba('+col+','+a+')'); gr.addColorStop(1,'rgba('+col+',0)');
    ctx.fillStyle = gr; ctx.fillRect(x-290,y-290,580,580);
  }
  ctx.restore();
}
function drawFireflies(g){
  const t = g.clock||0; ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for(let i=0;i<26;i++){
    const x = ((i*157.3 + Math.sin(t*0.3+i)*60 + t*(4+(i%4))) % (W+80)) - 40, y = (i*91.7 + Math.cos(t*0.25+i*1.7)*50) % H;
    const pl = 0.5+0.5*Math.sin(t*1.7+i*2.3);
    const gr = ctx.createRadialGradient(x,y,0,x,y,9); gr.addColorStop(0,'rgba(210,255,150,'+(0.75*pl)+')'); gr.addColorStop(1,'rgba(210,255,150,0)');
    ctx.fillStyle = gr; ctx.fillRect(x-9,y-9,18,18);
  }
  ctx.restore();
}
// warm lantern / forge / fire glows over Mistfall's dusk
function drawTownGlows(g){
  const T = g.town, cam = g.camera, t = g.clock||0; if(!T) return;
  const glow = (wx,wy,r,c,a0,lift)=>{
    const a = a0*0.2;   // v194: town glow effect reduced by 80%
    r *= 0.5;   // v197: glow radius halved
    const io = toIso(wx,wy), sx = io.x-cam.x, sy = io.y-cam.y-(lift||20);
    if(sx<-r || sx>W+r || sy<-r || sy>H+r) return;
    const fl = 0.85+0.15*Math.sin(t*7+wx*0.1)*Math.sin(t*3.1+wy*0.1);
    const gr = ctx.createRadialGradient(sx,sy,4,sx,sy,r*fl);
    gr.addColorStop(0,'rgba('+c+','+(a*fl)+')'); gr.addColorStop(1,'rgba('+c+',0)');
    ctx.fillStyle = gr; ctx.fillRect(sx-r,sy-r,r*2,r*2);
  };
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if(T.bonfire) glow(T.bonfire.x, T.bonfire.y, 260, '255,150,60', 0.55, 20);
  if(T.blacksmith) glow(T.blacksmith.x, T.blacksmith.y, 170, '255,120,40', 0.4, 26);
  if(T.tavern) glow(T.tavern.x+T.tavern.w/2, T.tavern.y+T.tavern.h, 200, '255,190,100', 0.4, 30);
  if(T.runeforge && g.player.runeforgeUnlocked) glow(T.runeforge.x, T.runeforge.y, 150, '150,110,255', 0.4, 26);
  if(T.waypoint) glow(T.waypoint.x, T.waypoint.y, 160, '110,190,255', 0.35, 30);
  if(T.props) for(const pr of T.props) if(pr.k==='lantern') glow(pr.x+6, pr.y, 130, '255,190,100', 0.7, 50);
  if(T.boat && tavernIsOpen(g.player)) glow(T.boat.x+20, T.boat.y, 130, '255,190,100', 0.6, 40);
  ctx.restore();
}

