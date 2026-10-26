// ---------- Update ----------
let lastT = 0;
// =====================================================================================================
// v381 AUDIO: everything is synthesised with the Web Audio API (no files). Sound effects are short noise/tone voices;
// music is generated per area (dark ambient, Diablo 2 style) with a lively lute jig for the Tavern.
// An "audio director" (audioFrame) watches the game state each frame and plays sounds -- so most events need no per-site hook.
// =====================================================================================================
const AUD = { ctx:null, ok:false, failed:false, voices:0, last:{}, tension:0, lastElem:{kind:null,t:-9}, lastTrig:{id:null,t:-9},
              mood:null, moodName:null, moodStop:null, moodBus:null, nextT:0, n:0, drumT:0, pumpId:0, pos:{x:0,y:0}, seen:null };
const mtof = m => 440*Math.pow(2,(m-69)/12);
const clamp01 = x => x<0?0:x>1?1:x;
function audSetting(k, d){ const v = settings && settings[k]; return (typeof v==='number') ? v : d; }
function audApplyVolumes(){
  if(!AUD.ok) return; const t = AUD.ctx.currentTime;
  AUD.master.gain.setTargetAtTime(audSetting('volume',0.8), t, 0.05);
  AUD.sfx.gain.setTargetAtTime(0.7*audSetting('sfxVol',0), t, 0.05);
  AUD.music.gain.setTargetAtTime(0.95*audSetting('musicVol',0), t, 0.05);
}
function audInit(){
  if(AUD.failed) return;
  if(AUD.ok){ if(AUD.ctx.state==='suspended') AUD.ctx.resume(); return; }
  try{
    const AC = window.AudioContext || window.webkitAudioContext; if(!AC){ AUD.failed = true; return; }
    const c = AUD.ctx = new AC();
    AUD.master = c.createGain(); AUD.sfx = c.createGain(); AUD.music = c.createGain();
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 18; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.2;
    AUD.analyser = c.createAnalyser(); AUD.analyser.fftSize = 1024;
    AUD.sfx.connect(AUD.master); AUD.music.connect(AUD.master); AUD.master.connect(comp); comp.connect(c.destination); comp.connect(AUD.analyser);
    // white + brown noise
    const sr = c.sampleRate, len = sr*3;
    AUD.noise = c.createBuffer(1, len, sr); const nd = AUD.noise.getChannelData(0); for(let i=0;i<len;i++) nd[i] = Math.random()*2-1;
    AUD.brown = c.createBuffer(1, len, sr); const bd = AUD.brown.getChannelData(0); let last = 0; for(let i=0;i<len;i++){ last = (last + 0.02*(Math.random()*2-1))/1.02; bd[i] = last*3.5; }
    // reverb impulse (shared), one convolver for music and a lighter one for effects
    const rl = Math.floor(sr*2.6), ir = c.createBuffer(2, rl, sr);
    for(let ch=0;ch<2;ch++){ const d = ir.getChannelData(ch); let lp = 0; for(let i=0;i<rl;i++){ const k = i/rl; lp += (Math.random()*2-1-lp)*(0.55-0.45*k); d[i] = lp*Math.pow(1-k,2.4)*1.6; } }
    AUD.revM = c.createConvolver(); AUD.revM.buffer = ir; AUD.revMIn = c.createGain(); AUD.revMIn.connect(AUD.revM); AUD.revM.connect(AUD.music);
    AUD.revS = c.createConvolver(); AUD.revS.buffer = ir; AUD.revSIn = c.createGain(); AUD.revSIn.gain.value = 0.7; AUD.revSIn.connect(AUD.revS); AUD.revS.connect(AUD.sfx);
    AUD.ok = true; audApplyVolumes(); try{ sndLoadBank(); }catch(e){}
    AUD.pumpId = setInterval(audPump, 110);
    audWrapTriggers();
  }catch(e){ AUD.failed = true; AUD.ok = false; }
}
['pointerdown','touchend','keydown','mousedown'].forEach(ev=>document.addEventListener(ev, audInit, true));
document.addEventListener('visibilitychange', ()=>{ if(!AUD.ok) return; if(document.hidden) AUD.ctx.suspend(); else AUD.ctx.resume(); });

// ---------- voice helpers ----------
function aEnv(g, t, att, dur, vol){ g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002,vol), t+Math.max(0.001,att)); g.gain.exponentialRampToValueAtTime(0.0001, t+Math.max(att+0.01,dur)); }
// tone voice: type, start freq, end freq, duration, volume. o: {att, bus, send, lp, lpEnd, detune, t}
function V(type, f0, f1, dur, vol, o, t){
  const c = AUD.ctx; o = o || {}; t = t==null ? c.currentTime : t;
  const os = c.createOscillator(), g = c.createGain(); os.type = type;
  os.frequency.setValueAtTime(Math.max(10,f0), t); if(f1 && f1!==f0) os.frequency.exponentialRampToValueAtTime(Math.max(10,f1), t+dur);
  if(o.detune) os.detune.value = o.detune;
  aEnv(g, t, o.att||0.004, dur, vol);
  let node = os;
  if(o.lp){ const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(o.lp, t); if(o.lpEnd) f.frequency.exponentialRampToValueAtTime(o.lpEnd, t+dur); f.Q.value = o.q||0.7; os.connect(f); node = f; }
  node.connect(g); const bus = o.bus || AUD.sfx; g.connect(bus);
  if(o.send){ const s = c.createGain(); s.gain.value = o.send; g.connect(s); s.connect(o.rev || (bus===AUD.sfx ? AUD.revSIn : AUD.revMIn)); }
  os.start(t); os.stop(t+dur+0.06); audVoice(t+dur+0.06);
}
// noise voice: filter type, start/end freq, q, duration, volume. o: {att, bus, send, brown, t}
function N(ftype, f0, f1, q, dur, vol, o, t){
  const c = AUD.ctx; o = o || {}; t = t==null ? c.currentTime : t;
  const s = c.createBufferSource(); s.buffer = o.brown ? AUD.brown : AUD.noise; s.loop = true;
  const f = c.createBiquadFilter(); f.type = ftype; f.Q.value = q||0.8; f.frequency.setValueAtTime(Math.max(20,f0), t); if(f1 && f1!==f0) f.frequency.exponentialRampToValueAtTime(Math.max(20,f1), t+dur);
  const g = c.createGain(); aEnv(g, t, o.att||0.004, dur, vol);
  s.connect(f); f.connect(g); const bus = o.bus || AUD.sfx; g.connect(bus);
  if(o.send){ const sg = c.createGain(); sg.gain.value = o.send; g.connect(sg); sg.connect(bus===AUD.sfx ? AUD.revSIn : AUD.revMIn); }
  s.start(t, Math.random()*2); s.stop(t+dur+0.06); audVoice(t+dur+0.06);
}

// ---------- sound effects ----------
const SFX_TH = { hitFlesh:0.05, hitBone:0.05, hitStone:0.05, hitMetal:0.05, hitCrit:0.08, swing:0.06, step:0.12, hurt:0.12, enemySwing:0.09, enemyShot:0.1, coin:0.05, bow:0.05, deathSmall:0.05, deathBeast:0.06, deathBone:0.06, deathBig:0.2, ui:0.03, fire:0.08, ice:0.08, bolt:0.08, arcane:0.08, poison:0.1 };
const SFX = {
  // --- melee / physical ---
  swing(t,v,r){ N('bandpass', 380*r, 1100*r, 0.7, 0.2, 0.34*v, {att:0.07}, t); N('lowpass', 900, 250, 0.6, 0.18, 0.18*v, {att:0.05, brown:true}, t); },
  spin(t,v,r){ N('bandpass', 400, 1600, 1.2, 0.55, 0.28*v, {att:0.12}, t); V('sine', 120*r, 200*r, 0.5, 0.1*v, null, t); },
  // --- ranged ---
  blaster(t,v,r,k){ k=k||1; V('sawtooth', 520*r*k, 70*r, 0.16, 0.2*v, {lp:1800, lpEnd:260, att:0.002}, t); V('sine', 150*r, 50, 0.14, 0.32*v, null, t); N('bandpass', 1600*k, 350, 1.1, 0.12, 0.22*v, {att:0.002}, t); N('lowpass', 700, 150, 0.7, 0.2, 0.14*v, {send:0.12}, t); },
  bow(t,v,r){ SFX.blaster(t,v,r,1.1); },
  bowHeavy(t,v,r){ SFX.blaster(t,v*1.1,r*0.85,0.8); },
  knife(t,v,r){ N('highpass', 2500*r, 5000, 0.8, 0.12, 0.22*v, {att:0.01}, t); V('triangle', 1800*r, 2600, 0.1, 0.05*v, null, t); },
  // --- spells ---
  fire(t,v,r){ SFX.blaster(t,v,r,0.9); },
  fireHit(t,v,r){ N('lowpass', 1400, 120, 0.7, 0.4, 0.7*v, {send:0.3}, t); V('sine', 100, 34, 0.45, 0.75*v, null, t); },
  ice(t,v,r){ SFX.blaster(t,v,r*1.05,1.3); },
  iceHit(t,v,r){ N('highpass', 3200, 6000, 0.8, 0.13, 0.5*v, null, t); V('triangle', 2400*r, 1500, 0.2, 0.15*v, {send:0.35}, t); V('sine', 120*r, 60, 0.12, 0.35*v, null, t); },
  bolt(t,v,r){ SFX.blaster(t,v,r,1.2); },
  boltHit(t,v,r){ N('highpass', 3000, 3000, 0.7, 0.07, 0.55*v, null, t); V('square', 90, 50, 0.16, 0.2*v, {lp:500}, t); V('sine', 140*r, 60, 0.1, 0.4*v, null, t); },
  arcane(t,v,r){ SFX.blaster(t,v,r*1.1,1); },
  // v497 Soul Sap: a soft breath-in on the cast, and a wet slurp as the soul is pulled out of each enemy it hits
  drain(t,v,r){ N('bandpass', 300, 900, 1.4, 0.3, 0.12*v, {att:0.12, brown:true}, t); V('sine', 120*r, 200*r, 0.28, 0.1*v, {att:0.1, send:0.3}, t); },
  drainHit(t,v,r){ N('bandpass', 600, 2400, 3.2, 0.3, 0.24*v, {att:0.02, brown:true, send:0.25}, t); V('sine', 170*r, 560*r, 0.3, 0.2*v, {att:0.03, send:0.35}, t); V('sine', 75*r, 42, 0.16, 0.34*v, null, t); V('triangle', 340*r, 220*r, 0.1, 0.09*v, {att:0.01}, t+0.1); },
  arcaneHit(t,v,r){ V('sine', 880*r, 440*r, 0.25, 0.2*v, {send:0.35}, t); V('sine', 130*r, 60, 0.12, 0.4*v, null, t); N('bandpass', 2500, 800, 1, 0.1, 0.2*v, null, t); },
  curse(t,v,r){ SFX.blaster(t,v,r*0.8,0.8); },
  poison(t,v,r){ SFX.blaster(t,v*0.9,r*0.95,0.9); },
  explode(t,v,r){ N('lowpass', 2200, 90, 0.7, 0.8, 0.9*v, {send:0.35}, t); V('sine', 90, 28, 0.7, 0.9*v, null, t); N('highpass', 2500, 800, 0.6, 0.25, 0.25*v, null, t); },
  summon(t,v,r){ V('sawtooth', 70*r, 140*r, 0.8, 0.14*v, {lp:500, lpEnd:1200, att:0.3, send:0.4}, t); V('sine', 523*r, 523*r, 0.9, 0.09*v, {att:0.25, send:0.5}, t+0.1); V('sine', 784*r, 784*r, 0.9, 0.07*v, {att:0.25, send:0.5}, t+0.2); },
  thunder(t,v,r){ N('lowpass', 420, 50, 2.8, 0.9, 0.55*v, {att:0.08, brown:true, send:0.4}, t); N('lowpass', 1400, 160, 0.5, 0.6, 0.3*v, {att:0.01, brown:true}, t+0.05); V('sine', 55, 30, 2.2, 0.35*v, null, t); },
  wind(t,v,r){ N('bandpass', 300, 1400, 0.9, 0.9, 0.35*v, {att:0.25, send:0.2}, t); },
  shout(t,v,r){ V('sawtooth', 130*r, 105*r, 0.45, 0.22*v, {lp:900, lpEnd:350, att:0.04, send:0.2}, t); V('sawtooth', 195*r, 160*r, 0.45, 0.1*v, {lp:900, lpEnd:350, att:0.04}, t); N('bandpass', 700, 400, 1.5, 0.35, 0.18*v, {att:0.05}, t); },
  howl(t,v,r){ V('sawtooth', 300*r, 520*r, 0.6, 0.12*v, {lp:1200, att:0.15, send:0.4}, t); V('sawtooth', 520*r, 330*r, 0.7, 0.1*v, {lp:1200, att:0.05, send:0.4}, t+0.5); },
  whoosh(t,v,r){ N('bandpass', 400, 2200, 0.8, 0.25, 0.28*v, {att:0.06}, t); },
  smoke(t,v,r){ N('lowpass', 2000, 300, 0.6, 0.5, 0.3*v, {att:0.03, send:0.2}, t); },
  portal(t,v,r){ N('bandpass', 200, 1800, 1.2, 0.9, 0.3*v, {att:0.25, send:0.4}, t); V('sine', 220, 660, 0.9, 0.12*v, {att:0.3, send:0.5}, t); },
  // --- creature sounds ---
  enemySwing(t,v,r){ N('bandpass', 350*r, 1000*r, 0.9, 0.16, 0.15*v, {att:0.05}, t); },
  // --- player / interface ---
  step(t,v,r){ N('bandpass', 250*r, 160, 1.1, 0.07, 0.16*v, null, t); },
  dodge(t,v,r){ N('bandpass', 900, 350, 0.8, 0.2, 0.22*v, {att:0.04}, t); },
  coin(t,v,r){ N('highpass', 5000, 5000, 0.8, 0.025, 0.28*v, {att:0.001}, t); V('sine', 3100*r, 3000*r, 0.09, 0.1*v, {att:0.001}, t); V('sine', 4350*r, 4250*r, 0.07, 0.07*v, {att:0.001}, t+0.045); V('sine', 3700*r, 3600*r, 0.12, 0.06*v, {att:0.001}, t+0.07); },
  chest(t,v,r){ V('sawtooth', 90*r, 60, 0.4, 0.14*v, {lp:500, send:0.2}, t); N('bandpass', 900, 500, 1.5, 0.4, 0.15*v, {att:0.05}, t); SFX.lootRare(t+0.25, v, r); },
  levelUp(t,v,r){ N('bandpass', 180, 1500, 0.7, 1.1, 0.5*v, {att:0.55, send:0.35}, t); N('bandpass', 1400, 300, 0.8, 0.8, 0.22*v, {att:0.05, send:0.3}, t+0.55); V('sine', 55, 90, 1.2, 0.35*v, {att:0.4, send:0.2}, t); },
  banner(t,v,r){ V('sine', 98, 92, 2.4, 0.5*v, {att:0.01, send:0.3}, t); V('triangle', 392, 370, 2.2, 0.1*v, {att:0.01, send:0.5}, t); V('sine', 263, 255, 2.0, 0.08*v, {att:0.01, send:0.5}, t); N('lowpass', 500, 120, 0.7, 0.9, 0.2*v, {att:0.05, send:0.3}, t); },
  bossRoar(t,v,r){ V('sawtooth', 90, 45, 1.3, 0.3*v, {lp:700, lpEnd:150, att:0.08, send:0.3}, t); V('sawtooth', 135, 70, 1.2, 0.2*v, {lp:600, lpEnd:150, att:0.08}, t); N('lowpass', 900, 150, 0.8, 1.0, 0.35*v, {att:0.1}, t); },
  // v492: a slow funeral toll and a falling tone (no more clinking metal)
  playerDeath(t,v,r){ V('sine', 110*r, 110*r, 3.2, 0.32*v, {att:0.01, send:0.6}, t); V('sine', 165*r, 165*r, 3.0, 0.14*v, {att:0.01, send:0.6}, t); V('sawtooth', 180*r, 38*r, 2.6, 0.16*v, {lp:500, lpEnd:70, att:0.05, send:0.5}, t); thump(t, v*0.8, 70*r, 0.6, 1.4); },
  // v492: rising breath back into the world on respawn
  respawn(t,v,r){ V('sine', 150*r, 480*r, 1.1, 0.16*v, {att:0.35, send:0.5}, t); V('sine', 300*r, 720*r, 1.0, 0.07*v, {att:0.4}, t); N('bandpass', 500, 1400, 1.2, 1.0, 0.1*v, {att:0.5}, t); },
  // v492: lightning arc -- a crackling electric zap with a quick glide
  arc(t,v,r){ V('sawtooth', 1400*r, 260*r, 0.18, 0.12*v, {lp:3000, lpEnd:600, att:0.002}, t); N('highpass', 2600, 2600, 0.8, 0.06, 0.25*v, {att:0.001}, t); N('bandpass', 900*r, 400, 2, 0.12, 0.22*v, {att:0.001}, t); for(let k=1;k<4;k++) N('highpass', 2200+k*500, 2200+k*500, 0.9, 0.025, 0.12*v, {att:0.001}, t+k*0.035); },
  transition(t,v,r){ N('lowpass', 1800, 300, 0.7, 0.7, 0.3*v, {att:0.15, send:0.3}, t); V('sine', 110, 70, 0.6, 0.3*v, {att:0.05}, t); }
};
// ---- (v396) gritty, low-end replacements for the old arcade blips: noise-based thumps, cracks and rings instead of pitched sine "boops" ----
const thump = (t,v,f,len,vol)=>{ N('lowpass', f, Math.max(40,f*0.28), 0.8, len, vol*v, {brown:true, att:0.002}, t); };
const crack = (t,v,f,len,vol)=>{ N('highpass', f, f, 0.8, len, vol*v, {att:0.001}, t); };
const ring = (t,v,fs,len,vol,r)=>{ fs.forEach((f,i)=>N('bandpass', f*r, f*r*0.97, 14, len*(1-i*0.12), vol*v, {att:0.001, send:0.12}, t)); };
Object.assign(SFX, {
  hitFlesh(t,v,r){ thump(t,v,420*r,0.16,1.5); N('bandpass', 900*r, 260, 0.8, 0.1, 0.55*v, {att:0.002}, t); crack(t,v,2600,0.03,0.1); },
  hitCrit(t,v,r){ thump(t,v,380*r,0.24,1.9); N('bandpass', 1100*r, 220, 0.8, 0.14, 0.7*v, {att:0.002}, t); crack(t,v,3200,0.06,0.28); ring(t,v,[1900,2700],0.22,0.35,r); },
  hitBone(t,v,r){ crack(t,v,2000+Math.random()*600,0.05,0.7); N('bandpass', 1600*r, 700, 1.5, 0.06, 0.6*v, {att:0.001}, t); thump(t,v,300*r,0.12,1.0); crack(t,v,3000,0.03,0.4); },
  hitStone(t,v,r){ thump(t,v,260*r,0.3,2.0); N('bandpass', 600*r, 200, 1, 0.14, 0.7*v, {att:0.002}, t); crack(t,v,3200,0.04,0.2); },
  hitMetal(t,v,r){ crack(t,v,3000,0.04,0.5); ring(t,v,[1750,2650,3500],0.28,0.45,r); thump(t,v,300*r,0.1,0.9); },
  hitArrow(t,v,r){ N('bandpass', 700*r, 300, 1.2, 0.07, 0.6*v, {att:0.001}, t); thump(t,v,350*r,0.1,1.0); crack(t,v,3500,0.02,0.15); },
  bash(t,v,r){ thump(t,v,300*r,0.28,2.1); N('bandpass', 1000*r, 250, 0.8, 0.12, 0.6*v, {att:0.002}, t); ring(t,v,[1500,2300],0.2,0.25,r); },
  clang(t,v,r){ crack(t,v,3000,0.04,0.5); ring(t,v,[1250,1900,2800],0.45,0.5,r); thump(t,v,260*r,0.1,0.7); },
  thud(t,v,r){ thump(t,v,200*r,0.38,2.3); N('lowpass', 500, 90, 0.7, 0.22, 0.35*v, {att:0.003}, t); },
  hurt(t,v,r){ thump(t,v,380*r,0.18,1.4); N('bandpass', 700*r, 220, 1, 0.16, 0.45*v, {att:0.004}, t); V('sawtooth', 150*r, 90*r, 0.16, 0.07*v, {lp:500, lpEnd:200}, t); },
  enemyShot(t,v,r){ SFX.blaster(t,v*0.45,r*1.1,0.9); },
  deathSmall(t,v,r){ thump(t,v,300*r,0.3,1.3); V('sawtooth', 260*r, 90*r, 0.3, 0.09*v, {lp:700, lpEnd:200}, t); N('bandpass', 600, 200, 1, 0.2, 0.3*v, {att:0.01}, t); },
  deathBeast(t,v,r){ thump(t,v,240*r,0.5,1.8); V('sawtooth', 170*r, 55*r, 0.5, 0.14*v, {lp:600, lpEnd:150}, t); N('lowpass', 700, 120, 0.7, 0.3, 0.3*v, {att:0.01}, t); },
  deathBone(t,v,r){ for(let i=0;i<6;i++){ const tt=t+i*0.045+Math.random()*0.03; crack(tt,v*(1-i*0.08),2000+Math.random()*1800,0.04,0.55); N('bandpass', (500+Math.random()*500)*r, 250, 1.5, 0.05, 0.3*v, null, tt); } thump(t,v,260*r,0.2,0.9); },
  deathBig(t,v,r){ thump(t,v,170*r,1.0,2.4); V('sawtooth', 110*r, 36*r, 1.0, 0.18*v, {lp:500, lpEnd:100, send:0.25}, t); N('lowpass', 800, 90, 0.7, 0.7, 0.45*v, {att:0.02, send:0.3}, t); crack(t+0.02,v,2500,0.12,0.15); },
  potion(t,v,r){ for(let i=0;i<3;i++){ const tt=t+i*0.11; N('bandpass', (280+i*40)*r, (520+i*60)*r, 4, 0.1, 0.5*v, {att:0.01, send:0.1}, tt); } },
  pickup(t,v,r){ N('bandpass', 900*r, 400, 1.2, 0.08, 0.35*v, {att:0.005}, t); thump(t,v,350*r,0.07,0.5); },
  lootDrop(t,v,r){ thump(t,v,320*r,0.1,0.5); ring(t,v,[2600],0.1,0.15,r); },
  lootRare(t,v,r){ ring(t,v,[1500,2250,3100],0.9,0.45,r); N('bandpass', 250, 900, 0.8, 0.5, 0.25*v, {att:0.25, send:0.3}, t); },
  ui(t,v,r){ crack(t,v,2800,0.02,0.22); thump(t,v,500*r,0.04,0.25); },
  mark(t,v,r){ crack(t,v,3500,0.025,0.25); ring(t,v,[2400],0.1,0.15,r); },
  trap(t,v,r){ crack(t,v,2500,0.05,0.5); ring(t,v,[1200,1800],0.14,0.3,r); thump(t,v,300*r,0.08,0.6); },
  heal(t,v,r){ N('bandpass', 300, 1100, 1.2, 0.7, 0.3*v, {att:0.3, send:0.4}, t); V('sine', 98*r, 110*r, 0.8, 0.12*v, {att:0.3, send:0.3}, t); },
  holy(t,v,r){ N('bandpass', 400, 1800, 1.5, 0.8, 0.25*v, {att:0.3, send:0.5}, t); ring(t,v,[1000,1500],0.9,0.18,r); V('sine', 130*r, 130*r, 0.9, 0.12*v, {att:0.3, send:0.4}, t); },
  questAccept(t,v,r){ ring(t,v,[800,1200],1.1,0.35,r); V('sine', 73, 73, 1.2, 0.2*v, {att:0.1, send:0.3}, t); },
  questDone(t,v,r){ ring(t,v,[1000,1500,2200],1.4,0.4,r); V('sine', 98, 98, 1.4, 0.2*v, {att:0.1, send:0.3}, t); }
});
// v448: recorded foley from Kenney's "RPG Audio" pack (CC0, kenney.nl), embedded as ogg. A mapped event plays a random
// variant of its recording; anything unmapped (or a phone that can't decode ogg) falls back to the synth sound above.
const SND_BANK = {"footstep00":"audio/sfx/footstep00.ogg","footstep01":"audio/sfx/footstep01.ogg","footstep02":"audio/sfx/footstep02.ogg","footstep03":"audio/sfx/footstep03.ogg","footstep04":"audio/sfx/footstep04.ogg","footstep05":"audio/sfx/footstep05.ogg","footstep06":"audio/sfx/footstep06.ogg","footstep07":"audio/sfx/footstep07.ogg","footstep08":"audio/sfx/footstep08.ogg","footstep09":"audio/sfx/footstep09.ogg","handleCoins":"audio/sfx/handleCoins.ogg","handleCoins2":"audio/sfx/handleCoins2.ogg","handleSmallLeather":"audio/sfx/handleSmallLeather.ogg","handleSmallLeather2":"audio/sfx/handleSmallLeather2.ogg","cloth1":"audio/sfx/cloth1.ogg","cloth2":"audio/sfx/cloth2.ogg","cloth3":"audio/sfx/cloth3.ogg","dropLeather":"audio/sfx/dropLeather.ogg","metalLatch":"audio/sfx/metalLatch.ogg","creak1":"audio/sfx/creak1.ogg","creak2":"audio/sfx/creak2.ogg","beltHandle1":"audio/sfx/beltHandle1.ogg","beltHandle2":"audio/sfx/beltHandle2.ogg","clothBelt":"audio/sfx/clothBelt.ogg","clothBelt2":"audio/sfx/clothBelt2.ogg","drawKnife1":"audio/sfx/drawKnife1.ogg","drawKnife2":"audio/sfx/drawKnife2.ogg","drawKnife3":"audio/sfx/drawKnife3.ogg","bookOpen":"audio/sfx/bookOpen.ogg","bookFlip1":"audio/sfx/bookFlip1.ogg","bookClose":"audio/sfx/bookClose.ogg"};
// v450: recorded music loops, baked to loop seamlessly -- Mistfall: "ambient music" (giangallegos, freesound #812170);
// Tavern: "Medieval Fantasy RPG Loop" (Sonically_Sound, freesound #649132). Until they decode (or if a device can't), the generated music plays.
const MUS_BANK = {"tavern":"audio/music/tavern.ogg","town":"audio/music/town.ogg"};
// v468: original Runefall themes, generated for the game -- the wilds, the deep places, and the bosses
Object.assign(MUS_BANK, {"d2world":"audio/music/d2world.ogg", "d2dungeon":"audio/music/d2dungeon.ogg", "d2boss":"audio/music/d2boss.ogg"});
// v480: the towers and high halls get their own theme (Lighthouse, Forgotten and Frosthold towers, the Redridge watchtowers, Highward, the Shadow Keep halls)
Object.assign(MUS_BANK, {"d2tower":"audio/music/d2tower.ogg"});
// v507: the Wraith Lord's fight in the Demon Hold has its own recorded theme
Object.assign(MUS_BANK, {"wraithlord":"audio/music/wraithlord.ogg"});
const MUS_VOL = { town:1, tavern:1, d2world:0.24, d2dungeon:0.24, d2boss:0.5, d2tower:0.24, wraithlord:0.66 }, MUS_LEN = { d2tower:8388608/44100, tavern:1411200/44100, town:2275056/44100, d2world:8388608/44100, d2dungeon:3704400/44100, d2boss:3256615/44100 };
AUD.mus = {};
function musLoopMood(name){
  return { stepDur:1, step(){}, start(bus){
    const c = AUD.ctx, src = c.createBufferSource(), g = c.createGain();
    src.buffer = AUD.mus[name]; src.loop = true; src.loopStart = 0; src.loopEnd = Math.min(src.buffer.duration, MUS_LEN[name]||src.buffer.duration);   // skip the decoder's end padding so the loop is seamless
    g.gain.value = (MUS_VOL[name]!=null ? MUS_VOL[name] : 1);   // v473: this line used to sit inside the comment above, so no track's volume was ever applied
    src.connect(g); g.connect(bus); src.start();
    return [()=>{ try{ src.stop(); }catch(e){} }];
  } };
}
const SND_MAP = {
  step:{f:['footstep00','footstep01','footstep02','footstep03','footstep04','footstep05','footstep06','footstep07','footstep08','footstep09'], v:0.3},
  coin:{f:['handleCoins','handleCoins2'], v:0.75},
  pickup:{f:['handleSmallLeather','handleSmallLeather2','cloth2','cloth3'], v:1.1},
  lootDrop:{f:['dropLeather'], v:0.3},
  equip:{f:['beltHandle1','beltHandle2','clothBelt','clothBelt2'], v:0.9},
  equipWeapon:{f:['drawKnife1','drawKnife2','drawKnife3'], v:1.6},
  bagOpen:{f:['cloth1','handleSmallLeather'], v:0.8},
  bookOpen:{f:['bookOpen','bookFlip1'], v:0.8},
  bookClose:{f:['bookClose'], v:0.45},
  stashOpen:{seq:[['metalLatch',0,0.55],['creak2',0.12,0.55]]},
  chest:{seq:[['metalLatch',0,0.55],['creak1',0.1,0.6]], then:'lootRare', thenAt:0.3}
};
// v451: combat, creature, magic and item recordings from two CC0 OpenGameArt packs -- "RPG Sound Pack" (artisticdude) and
// "80 CC0 RPG SFX" (rubberduck). Loudness-matched and embedded as ogg. 'layer' entries play on top of the synth sound instead of replacing it.
const SND_BANK2 = {"r_swing":"audio/sfx/r_swing.ogg","r_swing2":"audio/sfx/r_swing2.ogg","r_swing3":"audio/sfx/r_swing3.ogg","r_magic1":"audio/sfx/r_magic1.ogg","r_sword_unsheathe":"audio/sfx/r_sword_unsheathe.ogg","r_sword_unsheathe2":"audio/sfx/r_sword_unsheathe2.ogg","r_sword_unsheathe3":"audio/sfx/r_sword_unsheathe3.ogg","r_sword_unsheathe4":"audio/sfx/r_sword_unsheathe4.ogg","r_sword_unsheathe5":"audio/sfx/r_sword_unsheathe5.ogg","r_interface1":"audio/sfx/r_interface1.ogg","r_door":"audio/sfx/r_door.ogg","r_burp":"audio/sfx/r_burp.ogg","r_bubble":"audio/sfx/r_bubble.ogg","r_bubble2":"audio/sfx/r_bubble2.ogg","r_bubble3":"audio/sfx/r_bubble3.ogg","r_bottle":"audio/sfx/r_bottle.ogg","r_chainmail1":"audio/sfx/r_chainmail1.ogg","r_chainmail2":"audio/sfx/r_chainmail2.ogg","r_armor_light":"audio/sfx/r_armor_light.ogg","r_cloth_heavy":"audio/sfx/r_cloth_heavy.ogg","r_beads":"audio/sfx/r_beads.ogg","r_bite_small":"audio/sfx/r_bite_small.ogg","r_bite_small2":"audio/sfx/r_bite_small2.ogg","r_bite_small3":"audio/sfx/r_bite_small3.ogg","r_wolfman":"audio/sfx/r_wolfman.ogg","r_ogre1":"audio/sfx/r_ogre1.ogg","r_ogre2":"audio/sfx/r_ogre2.ogg","r_ogre3":"audio/sfx/r_ogre3.ogg","r_ogre4":"audio/sfx/r_ogre4.ogg","r_ogre5":"audio/sfx/r_ogre5.ogg","r_giant1":"audio/sfx/r_giant1.ogg","r_giant2":"audio/sfx/r_giant2.ogg","r_giant3":"audio/sfx/r_giant3.ogg","r_giant4":"audio/sfx/r_giant4.ogg","r_giant5":"audio/sfx/r_giant5.ogg","r_mnstr1":"audio/sfx/r_mnstr1.ogg","r_mnstr3":"audio/sfx/r_mnstr3.ogg","r_mnstr5":"audio/sfx/r_mnstr5.ogg","r_mnstr7":"audio/sfx/r_mnstr7.ogg","r_mnstr9":"audio/sfx/r_mnstr9.ogg","r_mnstr11":"audio/sfx/r_mnstr11.ogg","r_mnstr13":"audio/sfx/r_mnstr13.ogg","r_mnstr15":"audio/sfx/r_mnstr15.ogg","r_slime1":"audio/sfx/r_slime1.ogg","r_slime2":"audio/sfx/r_slime2.ogg","r_slime5":"audio/sfx/r_slime5.ogg","r_slime6":"audio/sfx/r_slime6.ogg","r_slime10":"audio/sfx/r_slime10.ogg","r_shade1":"audio/sfx/r_shade1.ogg","r_shade2":"audio/sfx/r_shade2.ogg","r_shade3":"audio/sfx/r_shade3.ogg","r_shade4":"audio/sfx/r_shade4.ogg","r_shade14":"audio/sfx/r_shade14.ogg","r_shade15":"audio/sfx/r_shade15.ogg","r_blade_01":"audio/sfx/r_blade_01.ogg","r_blade_02":"audio/sfx/r_blade_02.ogg","r_blade_03":"audio/sfx/r_blade_03.ogg","r_metal_01":"audio/sfx/r_metal_01.ogg","r_metal_02":"audio/sfx/r_metal_02.ogg","r_metal_03":"audio/sfx/r_metal_03.ogg","r_wood_01":"audio/sfx/r_wood_01.ogg","r_wood_02":"audio/sfx/r_wood_02.ogg","r_wood_03":"audio/sfx/r_wood_03.ogg","r_stones_04":"audio/sfx/r_stones_04.ogg","r_item_stone_02":"audio/sfx/r_item_stone_02.ogg","r_item_stone_03":"audio/sfx/r_item_stone_03.ogg","r_item_stone_04":"audio/sfx/r_item_stone_04.ogg","r_creature_die_01":"audio/sfx/r_creature_die_01.ogg","r_creature_hurt_01":"audio/sfx/r_creature_hurt_01.ogg","r_creature_hurt_02":"audio/sfx/r_creature_hurt_02.ogg","r_creature_misc_05":"audio/sfx/r_creature_misc_05.ogg","r_creature_misc_06":"audio/sfx/r_creature_misc_06.ogg","r_creature_monster_01":"audio/sfx/r_creature_monster_01.ogg","r_creature_monster_02":"audio/sfx/r_creature_monster_02.ogg","r_creature_roar_01":"audio/sfx/r_creature_roar_01.ogg","r_creature_roar_02":"audio/sfx/r_creature_roar_02.ogg","r_creature_roar_03":"audio/sfx/r_creature_roar_03.ogg","r_creature_slime_01":"audio/sfx/r_creature_slime_01.ogg","r_creature_slime_02":"audio/sfx/r_creature_slime_02.ogg","r_creature_slime_03":"audio/sfx/r_creature_slime_03.ogg","r_creature_slime_04":"audio/sfx/r_creature_slime_04.ogg","r_item_gem_01":"audio/sfx/r_item_gem_01.ogg","r_item_gem_02":"audio/sfx/r_item_gem_02.ogg","r_item_gem_03":"audio/sfx/r_item_gem_03.ogg","r_item_gem_04":"audio/sfx/r_item_gem_04.ogg","r_spell_01":"audio/sfx/r_spell_01.ogg","r_spell_02":"audio/sfx/r_spell_02.ogg","r_spell_fire_01":"audio/sfx/r_spell_fire_01.ogg","r_spell_fire_07":"audio/sfx/r_spell_fire_07.ogg"};
Object.assign(SND_BANK, SND_BANK2);
SND_MAP.equipWeapon = {f:['r_sword_unsheathe','r_sword_unsheathe2','r_sword_unsheathe3','r_sword_unsheathe4','r_sword_unsheathe5'], v:0.6};
Object.assign(SND_MAP, {"swing":{"f":["r_swing","r_swing2","r_swing3"],"v":0.55},"hitFlesh":{"f":["r_blade_01","r_blade_02","r_blade_03"],"v":0.45,"layer":1},"hitCrit":{"f":["r_blade_02","r_blade_03"],"v":0.7,"layer":1},"hitMetal":{"f":["r_metal_01","r_metal_02","r_metal_03"],"v":0.45,"layer":1},"hitBone":{"f":["r_wood_01","r_wood_02","r_wood_03"],"v":0.5,"layer":1},"hitStone":{"f":["r_stones_04","r_item_stone_02","r_item_stone_03","r_item_stone_04"],"v":0.5,"layer":1},"enemyBite":{"f":["r_bite_small","r_bite_small2","r_bite_small3"],"v":0.45},"deathSmall":{"f":["r_creature_die_01"],"v":0.5,"layer":1},"deathBeast":{"f":["r_mnstr1","r_mnstr3","r_mnstr5","r_mnstr7","r_mnstr9","r_mnstr11","r_mnstr13","r_mnstr15","r_wolfman","r_ogre1","r_ogre3","r_ogre5"],"v":0.6,"layer":1},"deathBig":{"f":["r_giant1","r_giant2","r_giant3","r_giant4","r_giant5"],"v":0.8,"layer":1},"deathSlime":{"f":["r_slime1","r_slime2","r_slime5","r_slime6","r_slime10","r_creature_slime_01","r_creature_slime_02","r_creature_slime_03","r_creature_slime_04"],"v":0.6},"deathShade":{"f":["r_shade1","r_shade2","r_shade3","r_shade4","r_shade14","r_shade15"],"v":0.55},"bossRoar":{"f":["r_creature_roar_01","r_creature_roar_02","r_creature_roar_03","r_ogre2","r_ogre4"],"v":0.9},"fire":{"f":["r_spell_fire_01","r_spell_fire_07"],"v":0.45,"layer":1},"summon":{"f":["r_magic1"],"v":0.6,"layer":1},"portal":{"f":["r_spell_01","r_spell_02"],"v":0.55,"layer":1},"levelUp":{"f":["r_magic1"],"v":0.7,"layer":1},"lootRare":{"f":["r_item_gem_01","r_item_gem_02","r_item_gem_03","r_item_gem_04"],"v":0.6,"layer":1},"potion":{"f":["r_bubble","r_bubble2","r_bubble3","r_bottle"],"v":0.7},"burp":{"f":["r_burp"],"v":0.6},"door":{"f":["r_door"],"v":0.6},"equipArmor":{"f":["r_chainmail1","r_chainmail2","r_armor_light","r_cloth_heavy"],"v":0.7},"equipJewel":{"f":["r_beads","r_item_gem_01","r_item_gem_03"],"v":0.6}});
// v456: new recordings -- arrow thunks (Kenney), armour clanks when a monster hits you and a ringing fall for your death (RPG Sound Pack)
Object.assign(SND_BANK, {"r_metal_small1":"audio/sfx/r_metal_small1.ogg","r_metal_small2":"audio/sfx/r_metal_small2.ogg","r_metal_small3":"audio/sfx/r_metal_small3.ogg","r_metal_ringing":"audio/sfx/r_metal_ringing.ogg","k_chop":"audio/sfx/k_chop.ogg","k_knifeSlice":"audio/sfx/k_knifeSlice.ogg","k_knifeSlice2":"audio/sfx/k_knifeSlice2.ogg","r_wood_04":"audio/sfx/r_wood_04.ogg"});
SND_MAP.arrowHit = {f:['k_chop','k_knifeSlice','k_knifeSlice2'], v:0.7};
SND_MAP.hurt = {f:['r_metal_small1','r_metal_small2','r_metal_small3'], v:0.75};
SND_MAP.hurtCloth = {f:['cloth1','cloth2','cloth3','r_cloth_heavy'], v:0.8};   // v492: mystic and ranger wear cloth/leather, not plate
// v535: "RPG Foley" recordings, cut into single sounds and loudness-matched: weapon swishes, crunchy bone impacts, metal clanks,
// blade stabs (crits), sword draws, chains, cloth, doors, gurgles, munching (zombies/ghouls), quaff + swallow (potion) and rolls (dodge)
Object.assign(SND_BANK, {"f_swish1":"audio/sfx/f_swish1.ogg","f_swish2":"audio/sfx/f_swish2.ogg","f_crunch1":"audio/sfx/f_crunch1.ogg","f_crunch2":"audio/sfx/f_crunch2.ogg","f_crunch3":"audio/sfx/f_crunch3.ogg","f_crunch4":"audio/sfx/f_crunch4.ogg","f_crunch5":"audio/sfx/f_crunch5.ogg","f_crunch6":"audio/sfx/f_crunch6.ogg","f_clank1":"audio/sfx/f_clank1.ogg","f_clank2":"audio/sfx/f_clank2.ogg","f_clank3":"audio/sfx/f_clank3.ogg","f_clank4":"audio/sfx/f_clank4.ogg","f_clank5":"audio/sfx/f_clank5.ogg","f_clank6":"audio/sfx/f_clank6.ogg","f_clank7":"audio/sfx/f_clank7.ogg","f_clank8":"audio/sfx/f_clank8.ogg","f_shlunk1":"audio/sfx/f_shlunk1.ogg","f_shlunk2":"audio/sfx/f_shlunk2.ogg","f_shlunk3":"audio/sfx/f_shlunk3.ogg","f_shlunk4":"audio/sfx/f_shlunk4.ogg","f_shlunk5":"audio/sfx/f_shlunk5.ogg","f_shlunk6":"audio/sfx/f_shlunk6.ogg","f_slide1":"audio/sfx/f_slide1.ogg","f_slide2":"audio/sfx/f_slide2.ogg","f_slide3":"audio/sfx/f_slide3.ogg","f_slide4":"audio/sfx/f_slide4.ogg","f_bash":"audio/sfx/f_bash.ogg","f_clankHi":"audio/sfx/f_clankHi.ogg","f_chain1":"audio/sfx/f_chain1.ogg","f_chain2":"audio/sfx/f_chain2.ogg","f_chain3":"audio/sfx/f_chain3.ogg","f_chain4":"audio/sfx/f_chain4.ogg","f_cloth1":"audio/sfx/f_cloth1.ogg","f_cloth2":"audio/sfx/f_cloth2.ogg","f_cloth3":"audio/sfx/f_cloth3.ogg","f_cloth4":"audio/sfx/f_cloth4.ogg","f_cloth5":"audio/sfx/f_cloth5.ogg","f_cloth6":"audio/sfx/f_cloth6.ogg","f_door1":"audio/sfx/f_door1.ogg","f_door2":"audio/sfx/f_door2.ogg","f_door3":"audio/sfx/f_door3.ogg","f_door4":"audio/sfx/f_door4.ogg","f_gurgleLo1":"audio/sfx/f_gurgleLo1.ogg","f_gurgleLo2":"audio/sfx/f_gurgleLo2.ogg","f_gurgle1":"audio/sfx/f_gurgle1.ogg","f_gurgle2":"audio/sfx/f_gurgle2.ogg","f_munch1":"audio/sfx/f_munch1.ogg","f_munch2":"audio/sfx/f_munch2.ogg","f_munch3":"audio/sfx/f_munch3.ogg","f_munch4":"audio/sfx/f_munch4.ogg","f_munch5":"audio/sfx/f_munch5.ogg","f_munch6":"audio/sfx/f_munch6.ogg","f_quaff":"audio/sfx/f_quaff.ogg","f_swallow":"audio/sfx/f_swallow.ogg","f_roll1":"audio/sfx/f_roll1.ogg","f_roll2":"audio/sfx/f_roll2.ogg","f_roll3":"audio/sfx/f_roll3.ogg"});
SND_MAP.swing.f.push('f_swish1','f_swish2');
SND_MAP.hitBone = {f:["f_crunch1", "f_crunch2", "f_crunch3", "f_crunch4", "f_crunch5", "f_crunch6"], v:0.55, layer:1};
SND_MAP.hitMetal.f.push(...["f_clank1", "f_clank2", "f_clank3", "f_clank4", "f_clank5", "f_clank6", "f_clank7", "f_clank8"]);
SND_MAP.hitCrit = {f:['r_blade_02','r_blade_03',...["f_shlunk1", "f_shlunk2", "f_shlunk3", "f_shlunk4", "f_shlunk5", "f_shlunk6"]], v:0.6, layer:1};
SND_MAP.deathBone = {f:["f_crunch1", "f_crunch2", "f_crunch3", "f_crunch4", "f_crunch5", "f_crunch6"], v:0.7, layer:1};
SND_MAP.deathSlime.f.push('f_gurgleLo1','f_gurgleLo2');
SND_MAP.enemyMunch = {f:["f_munch1", "f_munch2", "f_munch3", "f_munch4", "f_munch5", "f_munch6"], v:0.5};
SND_MAP.bash = {f:['f_bash'], v:0.7, layer:1};
SND_MAP.clang = {f:['f_clankHi','f_clank2','f_clank8'], v:0.55, layer:1};
// v539: explicit defensive-contact events so successful blocks/parries do not feel silent.
SND_MAP.shieldBlock = {f:['f_clank1','f_clank2','f_clank3','f_clank4','f_clank5','f_clank6'], v:0.62};
SND_MAP.parry = {f:['f_clankHi','f_clank1','f_clank2'], v:0.68};
SND_MAP.poison = {f:['f_gurgle1','f_gurgle2'], v:0.5, layer:1};
// v539: use a clean airy swish for dodges; the old roll samples ended in a hard, footstep-like clatter.
SND_MAP.dodge = {f:['f_swish1','f_swish2'], v:0.42};
// v539: make potion drinking read as a clear gulp, not just bottle handling.
SND_MAP.potion = {seq:[['f_quaff',0,0.52],['f_swallow',0.26,0.82],['f_swallow',0.48,0.68]]};
// Boss health globes are consumed instantly, but get a distinct double-gulp so they feel like a restorative pickup.
SND_MAP.globeDrink = {seq:[['f_swallow',0,0.82],['f_swallow',0.2,0.7]]};
SND_MAP.door.f.push(...["f_door1", "f_door2", "f_door3", "f_door4"]);
SND_MAP.equipWeapon.f.push(...["f_slide1", "f_slide2", "f_slide3", "f_slide4"]);
SND_MAP.equipArmor.f.push('f_chain1','f_chain2');
SND_MAP.hurtCloth.f.push(...["f_cloth1", "f_cloth2", "f_cloth3", "f_cloth4", "f_cloth5", "f_cloth6"]);
// v474: damage-over-time is a soft, low seep (a muffled hiss with a faint pulse) instead of a sharp click
SFX.dotTick = function(t,v,r){ N('lowpass', 760*r, 320*r, 0.7, 0.24, 0.05*v, {att:0.05, brown:true}, t); V('sine', 150*r, 105*r, 0.2, 0.03*v, {att:0.03}, t); };
const SND_TH = { dotTick:0.75, arrowHit:0.05, equip:0.1, equipWeapon:0.1, equipArmor:0.1, equipJewel:0.1, bagOpen:0.2, bookOpen:0.2, bookClose:0.2, stashOpen:0.3, fire:0.3, portal:0.5, summon:0.5, door:0.4, burp:1, enemyBite:0.09, enemyMunch:0.12, deathSlime:0.06, deathShade:0.08, potion:0.2 };
AUD.buf = {};
function sndLoadBank(){
  if(AUD.bankLoading) return; AUD.bankLoading = true;
  for(const k in SND_BANK) sndFetch(SND_BANK[k], b=>{ if(b) AUD.buf[k] = b; });
  for(const k in MUS_BANK) sndFetch(MUS_BANK[k], b=>{ if(b && !AUD.mus[k]){ AUD.mus[k] = b; if(AUD.moodName===k) AUD.moodName = null; } });   // swap in the recording if we're already there
}
// v488: sounds and music are real files under www/audio/ (they used to be base64 text inside index.html)
function sndFetch(url, done){
  try{
    fetch(url).then(r=>r.ok ? r.arrayBuffer() : Promise.reject(r.status)).then(buf=>{
      const pr = AUD.ctx.decodeAudioData(buf, done, ()=>{});
      if(pr && pr.then) pr.then(done).catch(()=>{});
    }).catch(()=>{});
  }catch(e){}
}
function sndPlayBuf(k, t, vol, rate){
  const b = AUD.buf[k]; if(!b) return false;
  const c = AUD.ctx, src = c.createBufferSource(), g = c.createGain();
  src.buffer = b; src.playbackRate.value = rate||1; g.gain.value = vol;
  src.connect(g); g.connect(AUD.sfx); src.start(t); audVoice(t + b.duration/(rate||1));
  return true;
}
function sndPlayMapped(name, now, v, r){
  const m = SND_MAP[name]; if(!m) return false;
  if(m.seq){
    if(!m.seq.every(x=>AUD.buf[x[0]])) return false;
    for(const x of m.seq) sndPlayBuf(x[0], now+x[1], x[2]*v, r);
    if(m.then && SFX[m.then]) SFX[m.then](now+(m.thenAt||0), v, r);
    return true;
  }
  const ok = m.f.filter(k=>AUD.buf[k]); if(!ok.length) return false;
  sndPlayBuf(ok[Math.floor(Math.random()*ok.length)], now, (m.v||1)*v, r);
  return !m.layer;   // layered sounds also let the synth version play underneath
}
SFX.deathSlime = SFX.deathSmall; SFX.deathShade = SFX.deathSmall; SFX.enemyBite = SFX.enemySwing; SFX.enemyMunch = SFX.enemySwing; SFX.equipArmor = SFX.equip || null; SFX.equipJewel = null;
// v523: the voice cap now counts by each voice's scheduled end time. It used to be a counter that went up on start and
// down in 'onended' -- under a heavy frame load some 'ended' events were lost, the counter crept past the cap and every
// combat sound stayed silent for the rest of the session.
function audVoice(end){ (AUD.vEnds || (AUD.vEnds = [])).push(end); }
function audVoiceCount(now){ const v = AUD.vEnds || (AUD.vEnds = []); if(v.length > 24){ let j = 0; for(let i=0;i<v.length;i++) if(v[i] > now) v[j++] = v[i]; v.length = j; } AUD.voices = v.length; return v.length; }
function sfxPlay(name, vol){
  if(!AUD.ok || AUD.ctx.state!=='running') return; const fn = SFX[name]; if(!fn && !SND_MAP[name]) return;
  const now = AUD.ctx.currentTime; if(now-(AUD.last[name]||-9) < (SFX_TH[name]||SND_TH[name]||0.04)) return;
  if(audVoiceCount(now)>46) return; const v = vol==null ? 1 : vol; if(v<0.03) return;
  AUD.last[name] = now;
  const r = 0.94+Math.random()*0.12;
  try{ if(!sndPlayMapped(name, now, v, r) && fn) fn(now, v, r); }catch(e){}
}
// loudness by distance from the player (world units): full inside ~250, gone by ~1100
function audNear(x, y){ const d = Math.hypot(x-AUD.pos.x, y-AUD.pos.y); return d<250 ? 1 : clamp01(1-(d-250)/850); }

// ---------- skill -> sound mapping ----------
const SKILL_SND = {
  strike:'swing', reave:'swing', shieldBash:'bash', shieldThrow:'clang', guardian:'summon', whirlwind:'spin', battlecry:'shout', leap:'thud', smite:'holy', vengeance:'holy', banner:'shout',
  consecrate:'holy', judgment:'holy', bulwark:'clang', mirrorSteel:'clang', seismicSlam:'thud', seismicAnchor:'thud', bloodrage:'shout', assault:'swing', commander:'shout', rally:'shout', shadowStep:'whoosh', vanish:'smoke',
  rapidShot:'bow', splinterShot:'bow', multiShot:'bow', explosiveShot:'bowHeavy', cripplingShot:'bow', stunShot:'bow', aimedShot:'bowHeavy', rainOfArrows:'bowHeavy', packTactics:'howl', beastFury:'howl', huntersMark:'mark', poisonTrap:'trap', frostTrap:'trap', explosiveTrap:'trap',
  fieldDress:'heal', survivalFieldDress:'heal', recall:'portal',
  nova:'arcane', tornado:'wind', hurricane:'wind', fireball:'fire', iceBolt:'ice', iceArmor:'ice', pyroTorrent:'fire', meteor:'fire', stormcall:'bolt', raiseDead:'summon', blizzard:'ice', immolate:'fire', flameVortex:'fire', permafrost:'ice',
  fear:'curse', soulFire:'curse', soulSap:'drain', lightningArc:'arc', deathBolt:'curse', soulGate:'summon', plague:'poison'
};
const SND_ELEM = { drain:'drain', arc:'bolt', fire:'fire', ice:'ice', bolt:'bolt', arcane:'arcane', curse:'arcane', poison:'poison', explode:'fire' };
const ATK_SHARED = { explosiveShot:1, splinterShot:1, multiShot:1, reave:1, strike:1, shieldBash:1, smite:1, vengeance:1, cripplingShot:1, stunShot:1, fireball:1, iceBolt:1, lightningArc:1, soulSap:1, deathBolt:1 };
function audWrapTriggers(){
  try{ for(const k in ACTIVE_SKILL_REGISTRY){ const en = ACTIVE_SKILL_REGISTRY[k]; if(en._audW) continue; en._audW = true; const o = en.trigger; en.trigger = function(){ AUD.lastTrig = {id:k, t:performance.now()}; return o.apply(this, arguments); }; } }catch(e){}
}
function audCast(id){
  const snd = SKILL_SND[id]; if(!snd) return;
  sfxPlay(snd, snd==='swing' ? 0.9 : 1);
  if(SND_ELEM[snd]) AUD.lastElem = {kind:SND_ELEM[snd], t:performance.now()};
}

// ---------- the audio director: watches the game each frame ----------
function audioFrame(dt){
  if(!AUD.ok) return; const g = game; audMoodFor(g);
  // v523: an audio context the system paused (interrupted / suspended under load) is woken up again while the game is visible
  if(AUD.ctx.state!=='running' && AUD.ctx.state!=='closed' && !document.hidden){ const tn = performance.now(); if(tn - (AUD.resumeT||0) > 1500){ AUD.resumeT = tn; try{ AUD.ctx.resume().catch(()=>{}); }catch(e){} } }
  if(!g || !g.started || !g.player || AUD.ctx.state!=='running'){ AUD.seen = null; return; }
  const p = g.player, now = performance.now();
  AUD.pos.x = p.x; AUD.pos.y = p.y;
  const st = AUD.st || (AUD.st = {});
  // room change: reset trackers and play a soft transition
  if(st.room !== g.room){ const had = !!st.room; st.room = g.room; st.prevEn = []; st.prevLoot = []; st.projSeen = new WeakSet(); st.lootSeen = new WeakSet(); st.hp = p.hp; st.gold = p.gold; st.level = p.level; st.atkCd = p.atkCd; st.cds = {}; if(had && g.scene!=='town' && st.scene!==g.scene) sfxPlay('transition', 0.8); st.scene = g.scene; return; }
  // --- enemies: hits and deaths ---
  const en = g.enemies || [], cur = new Set(); let tens = 0, bossNear = false, hitCount = 0;
  const elem = (now - AUD.lastElem.t < 700) ? AUD.lastElem.kind : null;
  for(let i=0;i<en.length;i++){
    const e = en[i]; cur.add(e);
    if(e.hp>0){
      if(e._ah===undefined) e._ah = e.hp;
      else if(e.hp < e._ah-0.01){
        const drop = e._ah-e.hp; e._ah = e.hp;
        const dot = (e.burnT>0||e.poisonT>0||e.bleedT>0||e.shockT>0||e.chillT>0) && drop < e.maxHp*0.04;
        if(dot){ const nr0 = audNear(e.x, e.y); if(nr0>0.1) sfxPlay('dotTick', nr0); }   // v456: a soft tick instead of a hit sound
        if(!dot && hitCount<3){
          hitCount++; const nr = audNear(e.x, e.y), big = drop > e.maxHp*0.18;
          if(nr>0.05){
            if(elem==='fire') sfxPlay('fireHit', nr); else if(elem==='ice') sfxPlay('iceHit', nr); else if(elem==='bolt') sfxPlay('boltHit', nr); else if(elem==='drain') sfxPlay('drainHit', nr); else if(elem==='arcane'||elem==='poison') sfxPlay('arcaneHit', nr);
            else if(e._arrowT && (g.clock||0) - e._arrowT < 0.1) sfxPlay('arrowHit', nr);   // v456
            else sfxPlay(audHitKind(e, big), nr);
          }
        }
      } else if(e.hp > e._ah) e._ah = e.hp;
      if(e.atkAnimT>0 && !(e._aa>0)){ const nr = audNear(e.x,e.y); if(nr>0.1) sfxPlay(/archer|mage|cultist|turret|sentry|bat/.test(e.type)?'enemyShot':/zombie|ghoul|risendead/.test(e.type)?'enemyMunch':/spider|beetle|crawler|wolf|hound|raptor|snake|anaconda|alligator|rat|boar|toad/.test(e.type)?'enemyBite':'enemySwing', nr); }
      e._aa = e.atkAnimT;
      const d = Math.hypot(e.x-p.x, e.y-p.y);
      if((e.aggroed||e.engaged||d<320) && d<520 && !e.noReward && e.speed!==0) tens += (e.isBoss||e.isLairBoss||e.elite||e.magic) ? 1.5 : 0.5;
      if((e.isBoss||e.isLairBoss) && d<700) bossNear = true;
    }
  }
  // deaths = enemies that were present last frame and are gone now (same room), close enough to matter
  let deaths = 0;
  for(const e of st.prevEn){ if(!cur.has(e) && e._ah!==undefined && deaths<3){ const nr = audNear(e.x,e.y); if(nr>0.08){ deaths++; const k = audDeathKind(e); sfxPlay(k, nr); if(k==='deathBig' && (e.isBoss||e.isLairBoss)) sfxPlay('bossRoar', 0.8); } } }
  st.prevEn = en.slice();
  AUD.tension += ((bossNear ? 1 : clamp01(tens/3)) - AUD.tension) * Math.min(1, dt*0.7);
  // --- player: hurt, level, gold, dodge, steps ---
  const pDot = (p.burnT>0||p.poisonT>0||p.bleedT>0||p.selfBurnT>0||p._burnT>0) && (st.hp - p.hp) < p.maxHp*0.03;   // v452: no grunt on every ailment tick
  if(p.hp < st.hp - 0.5 && p.hp>0 && !pDot) sfxPlay(p.cls==='warrior' ? 'hurt' : 'hurtCloth', clamp01(0.5 + (st.hp-p.hp)/Math.max(1,p.maxHp)*3));
  if(g.over && !st.dead){ st.dead = true; sfxPlay('playerDeath', 1); } if(!g.over) st.dead = false;
  st.hp = p.hp;
  if(p.level > st.level){ sfxPlay('levelUp', 1); } st.level = p.level;
  if(p.gold > st.gold) sfxPlay('coin', 0.8); else if(p.gold < st.gold - 0.5) sfxPlay('coin', 0.6); st.gold = p.gold;
  if(p.dodging && !st.dodging) sfxPlay('dodge', 1); st.dodging = !!p.dodging;
  if(st.scene && st.scene!==g.scene && (g.scene==='tavern' || st.scene==='tavern')) sfxPlay('door', 1); st.scene = g.scene;
  st.stepT = (st.stepT||0) - dt;
  if(p.moving && !p.dodging && g.scene!=='town'){ if(st.stepT<=0){ sfxPlay('step', 1); st.stepT = 0.34; } } else if(g.scene==='town' && p.moving){ if(st.stepT<=0){ sfxPlay('step', 0.8); st.stepT = 0.34; } }
  // --- skills / basic attacks: a rise in a cooldown means the skill just fired ---
  const trig = (now - AUD.lastTrig.t < 450) ? AUD.lastTrig.id : null;
  let firedShared = false;
  if(p.atkCd > st.atkCd + 0.04){ firedShared = true; if(trig && ATK_SHARED[trig]) audCast(trig); else if(trig && !SKILL_SND[trig]) sfxPlay('swing', 0.9); else audCast(p.cls==='ranger' ? 'rapidShot' : p.cls==='mystic' ? 'soulSap' : 'strike'); }
  st.atkCd = p.atkCd;
  try{
    for(const k in ACTIVE_SKILL_REGISTRY){
      if(ATK_SHARED[k]) continue; const c = ACTIVE_SKILL_REGISTRY[k].getCd(p); if(!c) continue;
      const cur2 = c.cur||0, prev = st.cds[k]; st.cds[k] = cur2;
      if(prev!==undefined && cur2 > prev + 0.25 && prev < 0.12) audCast(k);
    }
  }catch(e){}
  // --- projectiles: arrows from the player, shots from enemies ---
  const pr = g.projectiles || []; let enShots = 0;
  for(let i=0;i<pr.length;i++){ const b = pr[i]; if(st.projSeen.has(b)) continue; st.projSeen.add(b);
    if(b.from==='enemy' && enShots<1 && audNear(b.x,b.y)>0.15){ enShots++; sfxPlay('enemyShot', audNear(b.x,b.y)); }
  }
  // --- loot: new drops shimmer, pick-ups chime ---
  const loot = g.loot || []; const lc = new Set();
  for(let i=0;i<loot.length;i++){ const l = loot[i]; lc.add(l);
    if(!st.lootSeen.has(l)){ st.lootSeen.add(l); if(!l.playerDropped && l.type==='item' && l.item){ const r = l.item.rarity; if(r==='rare'||r==='unique'||r==='set'||r==='reward'||r==='legendary') sfxPlay('lootRare', 0.9); else if(r==='magic') sfxPlay('lootDrop', 0.7); } }
  }
  for(const l of st.prevLoot){ if(!lc.has(l) && Math.hypot(l.x-p.x,l.y-p.y)<130){ if(l.type==='item') sfxPlay('pickup', 1); else if(l.type==='potion') sfxPlay('globeDrink', 0.9); } }
  st.prevLoot = loot.slice();
  if(g.chest){ if(g.chest.opened && !st.chestOpen){ sfxPlay('chest', 1); } st.chestOpen = !!g.chest.opened; } else st.chestOpen = false;
}
function audHitKind(e, big){
  const t = e.type||'';
  if(big) return 'hitCrit';
  if(/skeleton|bone|wraith|lich/.test(t)) return 'hitBone';
  if(/golem|colossus|poisonwalker|construct|crawler|beetle|tortuga|armordon/.test(t)) return 'hitStone';
  if(/bandit|fh|gear|templar|cultist|shield/.test(t)) return 'hitMetal';
  return 'hitFlesh';
}
function audDeathKind(e){
  const t = e.type||'';
  // v538: named bosses keep their heavy death; humanoids must not inherit beast deaths just because their hitbox is large.
  if(e.isBoss||e.isLairBoss||/troll|trex|gojira|balrog|colossus|golem|mastodon|leviathan/.test(t)) return 'deathBig';
  if(/wraith|ghost|shade|spirit|ghoul|risendead|zombie|vampire|lich/.test(t)) return 'deathShade';
  if(/slime|ooze|toad|leech|plant|bog/.test(t)) return 'deathSlime';
  if(/skeleton|bone/.test(t)) return 'deathBone';
  if(/dwarf|bandit|templar|cultist|shield|human|raider|guard|knight|mercenary|graverobber|archer|warrior|soldier|rogue|assassin|brigand|barbarian|outlaw|hunter|squire|brute/.test(t)) return 'deathSmall';
  if(e.r>=26 || /bear|boar|wolf|alligator|raptor|hound/.test(t)) return 'deathBig';
  if(e.r>=16) return 'deathBeast';
  return 'deathSmall';
}
// interface clicks
document.addEventListener('pointerdown', ev=>{ try{ const t = ev.target; if(t && t.closest && t.closest('button,.plaque,.toggleRow,.closeBtn,.skillChoice,.invSlot,.shopItem,.tabBtn')) sfxPlay('ui', 1); }catch(e){} }, true);

