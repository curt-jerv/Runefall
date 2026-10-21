// ---------- music ----------
function MB(){ const c = AUD.ctx; const g = c.createGain(); g.gain.value = 0.0001; g.connect(AUD.music); return g; }
function mSend(node, amt){ const s = AUD.ctx.createGain(); s.gain.value = amt; node.connect(s); s.connect(AUD.revMIn); }
// sustained pad: detuned saws through a low-pass, slow attack/release
function mPad(bus, t, notes, dur, vol, lp, send){
  const c = AUD.ctx;
  notes.forEach(m=>{
    [-7,0,8].forEach(dt=>{
      const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt;
      f.type = 'lowpass'; f.frequency.value = lp||700; f.Q.value = 0.5;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol/3, t+dur*0.4); g.gain.linearRampToValueAtTime(0.0001, t+dur);
      o.connect(f); f.connect(g); g.connect(bus); if(send) mSend(g, send); o.start(t); o.stop(t+dur+0.1);
    });
  });
}
function mBell(bus, t, m, vol, dec){
  const f = mtof(m), c = AUD.ctx; dec = dec||3;
  [[1,1],[2.76,0.28],[5.4,0.1]].forEach(([r,a])=>{ const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f*r; aEnv(g, t, 0.004, dec/(r>1?r*0.6:1), vol*a); o.connect(g); g.connect(bus); mSend(g, 0.8); o.start(t); o.stop(t+dec+0.1); });
}
function mPluck(bus, t, m, vol, send){
  const c = AUD.ctx, f = mtof(m);
  const o = c.createOscillator(), o2 = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain(), g2 = c.createGain();
  o.type = 'triangle'; o.frequency.value = f; o2.type = 'sawtooth'; o2.frequency.value = f;
  fl.type = 'lowpass'; fl.frequency.setValueAtTime(3200, t); fl.frequency.exponentialRampToValueAtTime(700, t+0.25); fl.Q.value = 1.2;
  aEnv(g, t, 0.003, 0.7, vol); aEnv(g2, t, 0.003, 0.28, vol*0.35);
  o.connect(g); g.connect(bus); o2.connect(fl); fl.connect(g2); g2.connect(bus);
  if(send){ mSend(g, send); }
  o.start(t); o2.start(t); o.stop(t+0.8); o2.stop(t+0.35);
  // pick noise
  const s = c.createBufferSource(); s.buffer = AUD.noise; const bf = c.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = Math.min(5000, f*5); bf.Q.value = 1.5; const ng = c.createGain(); aEnv(ng, t, 0.001, 0.04, vol*0.5); s.connect(bf); bf.connect(ng); ng.connect(bus); s.start(t, Math.random()*2); s.stop(t+0.06);
}
function mFlute(bus, t, m, dur, vol){
  const c = AUD.ctx, o = c.createOscillator(), l = c.createOscillator(), lg = c.createGain(), g = c.createGain();
  o.type = 'sine'; o.frequency.value = mtof(m); l.frequency.value = 5; lg.gain.value = mtof(m)*0.008; l.connect(lg); lg.connect(o.frequency);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t+dur*0.35); g.gain.linearRampToValueAtTime(0.0001, t+dur);
  o.connect(g); g.connect(bus); mSend(g, 0.7); o.start(t); l.start(t); o.stop(t+dur+0.1); l.stop(t+dur+0.1);
  // breath
  N('bandpass', mtof(m)*2, mtof(m)*2, 3, dur, vol*0.12, {att:dur*0.3, bus, send:0.4}, t);
}
function mDrum(bus, t, f, vol, dur){ V('sine', f*1.6, f*0.55, dur||0.4, vol, {bus, send:0.3, att:0.003}, t); N('lowpass', 500, 120, 0.7, (dur||0.4)*0.6, vol*0.45, {bus, send:0.2}, t); }
// continuous layers (wind, rumble); returns a stop() function
function mLoopNoise(bus, buf, ftype, f, q, vol, lfoHz, lfoDepth){
  const c = AUD.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = buf; s.loop = true; fl.type = ftype; fl.frequency.value = f; fl.Q.value = q; g.gain.value = vol;
  const nodes = [s]; s.connect(fl); fl.connect(g); g.connect(bus);
  if(lfoHz){ const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = lfoHz; lg.gain.value = lfoDepth; l.connect(lg); lg.connect(fl.frequency); l.start(); nodes.push(l); }
  s.start(0, Math.random()*2); return ()=>{ nodes.forEach(n=>{ try{ n.stop(); }catch(e){} }); };
}
function mDrone(bus, m, vol, lp, type){
  const c = AUD.ctx, o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
  o.type = type||'sawtooth'; o2.type = 'sine'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m-12); o.detune.value = 5; f.type = 'lowpass'; f.frequency.value = lp||220; g.gain.value = vol;
  const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 0.06; lg.gain.value = vol*0.4; l.connect(lg); lg.connect(g.gain);
  o.connect(f); f.connect(g); o2.connect(g); g.connect(bus); o.start(); o2.start(); l.start();
  return ()=>{ [o,o2,l].forEach(n=>{ try{ n.stop(); }catch(e){} }); };
}
const pick = a => a[Math.floor(Math.random()*a.length)];
const MOODS = {
  d2world(){ return MOODS.forest(); }, d2dungeon(){ return MOODS.cave(); }, d2boss(){ return MOODS.fire(); }, wraithlord(){ return MOODS.fire(); }, d2tower(){ return MOODS.crypt(); },   // v468 fallbacks until the recordings decode
  // Mistfall: wistful acoustic plucks over a soft minor pad
  town(){
    const chords = [[57,60,64],[53,57,60],[48,55,60],[55,59,62]], arp = [0,1,2,1,2,1,0,2];
    return { stepDur:0.55,
      start(bus){ return [mLoopNoise(bus, AUD.noise, 'bandpass', 380, 0.6, 0.012, 0.05, 160)]; },
      step(n,t,bus){ const ci = Math.floor(n/16)%4, ch = chords[ci];
        if(n%16===0) mPad(bus, t, ch.map(x=>x), 9, 0.07, 650, 0.5);
        if(n%16===0) mPluck(bus, t, ch[0]-12, 0.10, 0.35);
        const k = arp[n%8]; if(n%2===0 || Math.random()<0.2) mPluck(bus, t, ch[k]+12, 0.045+Math.random()*0.02, 0.5);
        if(n%16===8 && Math.random()<0.7) mPluck(bus, t, ch[2]+24, 0.04, 0.6); } };
  },
  // The Tavern: a lively D-dorian lute jig (6/8) with drum and a murmuring crowd
  tavern(){
    const A = [62,64,65, 69,67,65, 64,65,67, 72,69,67, 65,67,69, 74,72,69, 67,65,64, 62,0,62];
    const B = [69,0,69, 72,69,67, 65,67,65, 64,62,64, 65,69,72, 74,72,69, 67,64,65, 62,0,0];
    const rootsA = [38,36,41,38], rootsB = [45,38,41,43];
    const form = [A,A,B,A];
    return { stepDur:0.19,
      start(bus){ return [mLoopNoise(bus, AUD.noise, 'bandpass', 520, 0.5, 0.025, 0.31, 180), mLoopNoise(bus, AUD.noise, 'bandpass', 1100, 0.7, 0.012, 0.17, 300)]; },
      step(n,t,bus){
        const sec = Math.floor(n/24)%4, ph = form[sec], pos = n%24, bar = Math.floor(pos/6), bp = pos%6, roots = (ph===B ? rootsB : rootsA);
        const mel = ph[pos];
        if(mel){ mPluck(bus, t, mel + (sec===3 ? 12 : 0), 0.15 + (bp===0?0.04:0), 0.18);
          if(bp===0 && Math.random()<0.5) mPluck(bus, t+0.015, mel-12, 0.07, 0.15);
          if(Math.random()<0.07) mPluck(bus, t-0.05, mel+2, 0.06, 0.1); }
        if(bp===0){ mPluck(bus, t, roots[bar], 0.2, 0.15); mDrum(bus, t, 110, 0.32, 0.25); }
        if(bp===3){ mPluck(bus, t, roots[bar]+7, 0.13, 0.15); mPluck(bus, t, roots[bar]+19, 0.07, 0.15); mDrum(bus, t, 160, 0.14, 0.18); }
        if(bp===1||bp===2||bp===4||bp===5){ N('highpass', 5500, 5500, 0.8, 0.03, 0.035, {bus}, t); }
        if(n%48===0 && Math.random()<0.5) V('triangle', 2000, 2000, 0.45, 0.025, {bus, send:0.5}, t+0.05); } };
  },
  // dark forest / marsh: deep D drone, tolling bells, wind
  forest(){
    const chords = [[50,53,57],[46,50,53],[43,46,50],[45,49,52]], sc = [62,65,67,69,70,72,74];
    return { stepDur:1.0,
      start(bus){ return [mDrone(bus, 38, 0.10, 240), mLoopNoise(bus, AUD.noise, 'bandpass', 420, 0.5, 0.05, 0.07, 260)]; },
      step(n,t,bus){ if(n%14===0) mPad(bus, t, chords[Math.floor(n/14)%4], 13, 0.085, 560, 0.6);
        if(Math.random()<0.2) mBell(bus, t, pick(sc), 0.06, 4); if(n%29===13) mFlute(bus, t, pick(sc)-12, 3.2, 0.035); } };
  },
  // caves / dungeons: sub rumble, drips, dissonant pads, groans
  cave(){
    return { stepDur:0.8,
      start(bus){ return [mLoopNoise(bus, AUD.brown, 'lowpass', 120, 0.7, 0.55, 0.05, 40), mDrone(bus, 33, 0.06, 160)]; },
      step(n,t,bus){ if(Math.random()<0.28){ const f = 900+Math.random()*1600; V('sine', f, f*0.8, 0.12, 0.05, {bus, send:0.9, att:0.002}, t); }
        if(n%22===0) mPad(bus, t, [40,46,52], 16, 0.07, 380, 0.7);
        if(n%37===17) V('sawtooth', 72, 52, 4.5, 0.07, {bus, lp:210, att:1.5, send:0.5}, t);
        if(n%31===5) mBell(bus, t, pick([52,58,63]), 0.04, 5); } };
  },
  // crypts / ruins / towers: choir-like pad, a slow funeral bell
  crypt(){
    const chords = [[48,51,55],[44,48,51],[41,44,48],[43,46,50]];
    return { stepDur:1.2,
      start(bus){ return [mDrone(bus, 36, 0.08, 200), mLoopNoise(bus, AUD.noise, 'highpass', 2600, 0.5, 0.008, 0.04, 800)]; },
      step(n,t,bus){ if(n%9===0){ const ch = chords[Math.floor(n/9)%4]; mPad(bus, t, ch.concat([ch[0]+12, ch[2]+12]), 12, 0.08, 520, 0.8); }
        if(n%9===3) mBell(bus, t, 48, 0.12, 7); if(n%9===6 && Math.random()<0.5) mBell(bus, t, 55, 0.05, 6);
        if(Math.random()<0.1) mBell(bus, t, pick([72,75,77,79]), 0.03, 4); } };
  },
  // v492: the Shadow Keep halls -- low dissonant drone, tolling bells, a slow tritone pad that never quite resolves
  keep(){
    const chords = [[38,44,50],[37,43,49],[35,41,47],[36,42,47]];
    return { stepDur:1.6,
      start(bus){ return [mDrone(bus, 26, 0.12, 180), mDrone(bus, 38, 0.05, 90), mLoopNoise(bus, AUD.brown, 'lowpass', 160, 0.7, 0.45, 0.06, 40)]; },
      step(n,t,bus){ if(n%8===0){ const ch = chords[Math.floor(n/8)%4]; mPad(bus, t, ch.concat([ch[0]+12]), 14, 0.07, 300, 0.9); }
        if(n%8===4) mBell(bus, t, 35, 0.16, 9); if(n%8===6 && Math.random()<0.6) mBell(bus, t, 41, 0.07, 8);
        if(Math.random()<0.08) mBell(bus, t, pick([62,63,66]), 0.025, 5); } };
  },
  // icy peaks: cold wind, glassy shimmer
  snow(){
    const sc = [69,72,74,76,79,81];
    return { stepDur:1.0,
      start(bus){ return [mLoopNoise(bus, AUD.noise, 'bandpass', 600, 0.4, 0.09, 0.09, 380), mDrone(bus, 33, 0.07, 190)]; },
      step(n,t,bus){ if(n%12===0) mPad(bus, t, [57,64,69,72], 14, 0.06, 900, 0.9);
        if(Math.random()<0.24) mBell(bus, t, pick(sc), 0.05, 4.5); if(n%23===9) mFlute(bus, t, pick(sc)-12, 4, 0.03); } };
  },
  // fire canyons: low war drums, brooding Phrygian drone, ember crackle
  fire(){
    return { stepDur:0.62,
      start(bus){ return [mDrone(bus, 28, 0.13, 260), mLoopNoise(bus, AUD.brown, 'lowpass', 140, 0.7, 0.5, 0.07, 50)]; },
      step(n,t,bus){ if(n%8===0) mDrum(bus, t, 62, 0.4, 0.6); if(n%8===4) mDrum(bus, t, 78, 0.22, 0.5); if(n%16===12) mDrum(bus, t, 70, 0.14, 0.4);
        if(Math.random()<0.35) N('highpass', 3500+Math.random()*3000, 3500, 0.8, 0.02, 0.05, {bus}, t);
        if(n%32===0) V('sawtooth', 41, 44, 5, 0.1, {bus, lp:300, att:2, send:0.4}, t);
        if(n%32===16) mPad(bus, t, [40,41,47], 14, 0.07, 450, 0.6); } };
  },
  // open plains / valley: a thin, lonely flute over a soft minor pad
  plains(){
    const chords = [[57,60,64],[53,57,60],[55,59,62],[52,57,60]], sc = [69,72,74,76,79];
    return { stepDur:0.75,
      start(bus){ return [mLoopNoise(bus, AUD.noise, 'bandpass', 480, 0.5, 0.035, 0.08, 200), mDrone(bus, 33, 0.05, 200)]; },
      step(n,t,bus){ if(n%16===0) mPad(bus, t, chords[Math.floor(n/16)%4], 12, 0.07, 700, 0.6);
        if(n%8===2 && Math.random()<0.7) mFlute(bus, t, pick(sc), 2.4, 0.04); if(n%4===0 && Math.random()<0.4) mPluck(bus, t, pick(sc)-12, 0.05, 0.5); } };
  }
};
// v402: every zone outside Mistfall gets a slow, mournful bowed-string melody on top of its ambience.
// Each zone has its own key and its own little phrases ([midi, beats] pairs), with long silences between them.
function mBow(bus, t, m, dur, vol){
  const c = AUD.ctx, f = mtof(m);
  [[ 'sawtooth', 0, 1 ], ['sawtooth', 9, 0.6], ['sine', -1200, 0.8]].forEach(([ty,dt,a])=>{
    const o = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
    o.type = ty; o.frequency.value = f; o.detune.value = dt;
    l.frequency.value = 4.6; lg.gain.value = 7; l.connect(lg); lg.connect(o.detune);
    fl.type = 'lowpass'; fl.frequency.setValueAtTime(380, t); fl.frequency.linearRampToValueAtTime(1150, t+dur*0.45); fl.frequency.linearRampToValueAtTime(420, t+dur); fl.Q.value = 0.8;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol*a*0.5, t+Math.min(0.7,dur*0.3)); g.gain.setValueAtTime(vol*a*0.5, t+dur*0.7); g.gain.linearRampToValueAtTime(0.0001, t+dur+0.5);
    o.connect(fl); fl.connect(g); g.connect(bus); mSend(g, 0.9); o.start(t); l.start(t); o.stop(t+dur+0.7); l.stop(t+dur+0.7);
  });
}
const MOOD_MELODY = {
  forest: { beat:1.7, vol:0.075, gap:[5,10], phr:[ [[62,1],[65,1],[64,1],[62,3]], [[57,1.5],[62,1],[65,1],[69,3.5]], [[67,1],[65,1],[64,1],[62,1],[57,4]] ] },          // D minor, sombre
  plains: { beat:1.9, vol:0.065, gap:[6,11], phr:[ [[69,1.5],[72,1],[71,1],[67,3]], [[64,1],[67,1],[69,2],[67,1],[64,3]], [[72,1],[71,1],[69,1],[67,1],[64,1],[62,4]] ] },    // A minor, lonely and wide
  snow:   { beat:2.0, vol:0.06,  gap:[6,12], phr:[ [[76,1],[74,1],[71,2],[67,3]], [[64,1.5],[67,1],[71,1],[69,3.5]], [[71,1],[69,1],[67,1],[64,4]] ] },                      // E minor, cold and high
  fire:   { beat:1.5, vol:0.085, gap:[4,8],  phr:[ [[50,1],[51,1],[50,1],[46,3]], [[57,1],[58,1],[57,1],[55,1],[51,3]], [[50,1.5],[53,1],[51,1],[50,3.5]] ] },               // D phrygian, heavy
  cave:   { beat:2.2, vol:0.07,  gap:[7,13], phr:[ [[45,1],[46,1],[45,1],[43,4]], [[50,1.5],[49,1],[45,4]] ] },                                                           // low, sparse
  crypt:  { beat:2.0, vol:0.07,  gap:[5,10], phr:[ [[60,1],[58,1],[56,1],[55,3]], [[63,1],[62,1],[60,1],[58,1],[55,4]], [[67,1.5],[65,1],[63,1],[62,3.5]] ] }                  // C minor, funereal
};
Object.keys(MOOD_MELODY).forEach(name=>{
  const base = MOODS[name], M = MOOD_MELODY[name];
  MOODS[name] = function(){
    const mood = base(), step0 = mood.step; let next = 0, last = -1;
    mood.step = function(n, t, bus){
      step0(n, t, bus);
      if(t < next) return;
      let i; do{ i = Math.floor(Math.random()*M.phr.length); }while(M.phr.length>1 && i===last); last = i;
      let tt = t + 0.2;
      M.phr[i].forEach(([m,b])=>{ const d = b*M.beat; mBow(bus, tt, m, d, M.vol); tt += d; });
      next = tt + M.gap[0] + Math.random()*(M.gap[1]-M.gap[0]);
    };
    return mood;
  };
});
const SCENE_MOOD_V468 = { forest:'d2world', blackmarsh:'d2world', sunlitplains:'d2world', rivervalley:'d2world', mountainpass:'d2world', icyzone:'d2world', frosthold:'d2world', redridge:'d2world', redcrater:'d2world', highlands:'d2world', cursedcemetery:'d2world', lakesideruins:'d2world',
  bearcave:'d2dungeon', spiderlair:'d2dungeon', minotaurcave:'d2dungeon', dungeon:'d2dungeon', raptorlair:'d2dungeon', darkcrypt:'d2dungeon', ancientruins:'d2dungeon', lighthouse:'d2dungeon' };
const SCENE_MOOD = { town:'town', tavern:'tavern', forest:'forest', blackmarsh:'forest', bearcave:'cave', spiderlair:'cave', minotaurcave:'cave', dungeon:'cave', raptorlair:'fire', redridge:'fire', redcrater:'fire',
                     mountainpass:'snow', icyzone:'snow', frosthold:'snow', sunlitplains:'plains', rivervalley:'plains', darkcrypt:'crypt', cursedcemetery:'crypt', ancientruins:'crypt', lakesideruins:'crypt' };
function towerMusicHere(g){
  const t = g.tower, r = g.room; if(!t) return false;
  if(t.deep || (r && (r.deep || r.hell))) return false;
  const sz = t.subzone;
  if(sz==='sunken' || sz==='temple' || sz==='pool') return false;
  if(sz==='keep') return (t.kpArea||1) < 7;   // the castle halls, not the Hold or the Breach below
  return true;   // Lighthouse floors, the Forgotten Tower, Frosthold Tower, Redridge watchtowers, Highward
}
function audMoodFor(g){
  let name = 'town';
  if(g && g.started && g.scene){ name = SCENE_MOOD[g.scene] || 'crypt'; if(g.scene==='lighthouse') name = (g.tower && g.tower.deep) ? 'cave' : 'crypt'; if(g.over) name = 'crypt';
    // v468: the generated themes -- wilds, deep places, and a boss theme while a boss bar is up
    if(SCENE_MOOD_V468[g.scene]) name = SCENE_MOOD_V468[g.scene];
    if(g.scene==='lighthouse' && towerMusicHere(g)) name = 'd2tower';
    if(g.scene==='lighthouse' && g.tower && g.tower.subzone==='keep' && (g.tower.kpArea||1)<7) name = 'keep';   // v492: the Shadow Keep's own dark theme
    if(!g.over && window.__bossBarBottom > 0 && g.scene!=='town' && g.scene!=='tavern') name = 'd2boss';
    if(name==='d2boss' && g.scene==='lighthouse' && g.tower && g.tower.subzone==='keep' && g.tower.kpArea===7 && g.enemies.some(e=>e.wlord && e.hp>0)) name = 'wraithlord'; }   // v507: the Demon Hold's Wraith Lord
  if(name!==AUD.moodName) audSetMood(name);
  return name;
}
function audSetMood(name){
  if(!AUD.ok || !MOODS[name]) return; const c = AUD.ctx, now = c.currentTime;
  const oldBus = AUD.moodBus, oldStop = AUD.moodStop;
  if(oldBus){ oldBus.gain.cancelScheduledValues(now); oldBus.gain.setValueAtTime(oldBus.gain.value, now); oldBus.gain.linearRampToValueAtTime(0.0001, now+4.5); setTimeout(()=>{ try{ (oldStop||[]).forEach(f=>f()); oldBus.disconnect(); }catch(e){} }, 5200); }
  const bus = MB(); const mood = (AUD.mus && AUD.mus[name]) ? musLoopMood(name) : MOODS[name]();
  // v492: boss music comes in fast and loud; everything else keeps the slow v472 fade-in
  const boss = name==='d2boss' || name==='wraithlord', peak = boss ? 1.7 : 1;
  bus.gain.setValueAtTime(0.0001, now);
  if(boss) bus.gain.setTargetAtTime(peak, now+0.05, 0.35); else bus.gain.setTargetAtTime(1, now+(oldBus?1.5:0.5), 3.6);   // v472: slow fade-in (about 11s to full)
  AUD.moodName = name; AUD.mood = mood; AUD.moodBus = bus; AUD.n = 0; AUD.nextT = now+0.15;
  try{ AUD.moodStop = mood.start ? mood.start(bus) : []; }catch(e){ AUD.moodStop = []; }
}
function audPump(){
  if(!AUD.ok || AUD.ctx.state!=='running' || !AUD.mood) return;
  const c = AUD.ctx, now = c.currentTime;
  try{
    let guard = 0;
    while(AUD.nextT < now+0.7 && guard++<64){ AUD.mood.step(AUD.n++, AUD.nextT, AUD.moodBus); AUD.nextT += AUD.mood.stepDur; }
    if(AUD.nextT < now-1) AUD.nextT = now+0.1;
    // war drums that swell in when monsters close in (not in the safe places)
    if(AUD.tension>0.35 && AUD.moodName!=='town' && AUD.moodName!=='tavern'){
      if(!AUD.drumT || AUD.drumT < now-1) AUD.drumT = now+0.1; let gd = 0;
      while(AUD.drumT < now+0.7 && gd++<8){ const k = (AUD.drumN = (AUD.drumN||0)+1); const vol = 0.3*clamp01((AUD.tension-0.2)/0.8); mDrum(AUD.music, AUD.drumT, k%4===1?58:70, k%4===1?vol*1.2:vol*0.6, 0.5); if(k%4===3) mDrum(AUD.music, AUD.drumT+0.2, 66, vol*0.4, 0.4); AUD.drumT += 0.43; }
    }
  }catch(e){}
}

