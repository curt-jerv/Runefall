const canvas = document.getElementById('game');
let ctx = canvas.getContext('2d');
try{ ['700 12px Cinzel','700 12px Alegreya','400 12px Alegreya','italic 400 12px Alegreya'].forEach(f=>document.fonts.load(f)); }catch(e){}   // v470: embedded fonts ready for canvas labels
let W, H, DPR;
// v487: Graphics quality. gfxLevel 2 High = 2x resolution + full glow, 1 Medium = 1.5x + half glow, 0 Low = 1x + no glow.
// "Auto" (the default) starts on Medium and steps down/up with the measured frame time (gfxAutoTune).
let gfxLevel = 1, glowMode = 1;
function gfxDpr(){ const cap = gfxLevel>=2 ? 2 : gfxLevel===1 ? 1.5 : 1; return Math.max(0.5, Math.floor(Math.min(window.devicePixelRatio||1, cap)*8)/8); }   // multiples of 1/8 keep 512px ground chunks on whole pixels
function resize(){
  DPR = gfxDpr();
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W*DPR); canvas.height = Math.round(H*DPR);
  canvas.style.width = W+'px'; canvas.style.height = H+'px';
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize', resize);
resize();
// v487: the main canvas scales every glow (shadowBlur) by the quality level, and reuses identical gradients instead of
// building new ones every frame. Gradients are recorded until assigned to fillStyle/strokeStyle, then looked up by
// their coordinates + colour stops (coordinates rounded to 1/4 px, which is invisible).
const GRAD_CACHE = new Map();
function GradRec(kind, args){ this.kind = kind; this.args = args; this.stops = []; this.real = null; }
GradRec.prototype.addColorStop = function(o, c){ this.stops.push(o, c); this.real = null; };
function perfPatchCtx(c){
  const P = CanvasRenderingContext2D.prototype;
  const sb = Object.getOwnPropertyDescriptor(P,'shadowBlur'), fs = Object.getOwnPropertyDescriptor(P,'fillStyle'), ss = Object.getOwnPropertyDescriptor(P,'strokeStyle');
  const mkL = P.createLinearGradient, mkR = P.createRadialGradient;
  const q = v=>Math.round(v*4)/4;
  const real = r=>{
    if(r.real) return r.real;
    const key = r.kind+r.args.join(',')+'|'+r.stops.join('|');
    let gr = GRAD_CACHE.get(key);
    if(!gr){
      gr = (r.kind==='L' ? mkL : mkR).apply(c, r.args);
      for(let i=0;i<r.stops.length;i+=2) gr.addColorStop(r.stops[i], r.stops[i+1]);
      if(GRAD_CACHE.size >= 1500) GRAD_CACHE.clear();
      GRAD_CACHE.set(key, gr);
    }
    return (r.real = gr);
  };
  c.createLinearGradient = function(x0,y0,x1,y1){ return new GradRec('L', [q(x0),q(y0),q(x1),q(y1)]); };
  c.createRadialGradient = function(x0,y0,r0,x1,y1,r1){ return new GradRec('R', [q(x0),q(y0),Math.max(0,q(r0)),q(x1),q(y1),Math.max(0,q(r1))]); };
  Object.defineProperty(c, 'fillStyle', {configurable:true, get(){ return fs.get.call(this); }, set(v){ fs.set.call(this, v instanceof GradRec ? real(v) : v); }});
  Object.defineProperty(c, 'strokeStyle', {configurable:true, get(){ return ss.get.call(this); }, set(v){ ss.set.call(this, v instanceof GradRec ? real(v) : v); }});
  Object.defineProperty(c, 'shadowBlur', {configurable:true, get(){ return sb.get.call(this); }, set(v){ let b = v; if(glowMode!==2){ b = glowMode===1 ? v*0.5 : 0; if(b<1.5) b = 0; } sb.set.call(this, b); }});
}
try{ perfPatchCtx(ctx); }catch(e){}

let best = 1;
try{ const b = localStorage.getItem('dc_best'); if(b) best = parseInt(b,10)||1; }catch(e){}
// v218: the start screen shows the total number of deaths across all characters
window.__rfDeathsTotal = function(){ try{ return parseInt(localStorage.getItem('rf_deaths')||'0',10)||0; }catch(e){ return 0; } };
function showTotalDeaths(){ /* v239: death counter removed from the title screen */ }
showTotalDeaths();

