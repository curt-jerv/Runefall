// ---- v564 Mystic defenses: Storm Ward (Djinn) and Mana Shield (Elementalist) ----
let wantStormWard = false, wantManaShield = false;
// Storm Ward: a ring of wind for a few seconds; every melee blow, arrow or spell from a monster may be turned aside (like evasion)
const STORM_WARD_CD = 16;
function stormWardDur(r){ r = Math.max(1, r||1); return 6 + 4*(Math.min(10,r)-1)/9; }
function stormWardChance(r){ r = Math.max(1, r||1); return Math.min(0.5, 0.20 + 0.20*(Math.min(10,r)-1)/9 + 0.01*Math.max(0, r-10)); }   // v565: 20% -> 40% (was 25% -> 50%)
// Mana Shield: while on, part of every hit is paid from mana instead of life (after Ice Armor has soaked what it can)
const MANA_SHIELD_CD = 1;
function manaShieldPct(r){ r = Math.max(1, r||1); return Math.min(0.75, 0.30 + 0.30*(Math.min(10,r)-1)/9 + 0.015*Math.max(0, r-10)); }
function manaShieldCostPer(r){ r = Math.max(1, r||1); return Math.max(0.6, 1.5 - 0.5*(Math.min(10,r)-1)/9 - 0.02*Math.max(0, r-10)); }   // mana per point of damage taken
// Stormstrider (the old Thunderstep): after a dodge your mana flows faster for a while
const STORMSTRIDER_REGEN_T = 4;

function stormWardEvade(g, p, srcEnemy){
  if(!(p.stormWardT>0) || !srcEnemy) return false;
  if(Math.random() >= stormWardChance(effectiveRank(p,'stormWard')||1)) return false;
  showMsg('Deflected!', 0.5); try{ sfxPlay('miss', 0.8); }catch(e){}
  g.particles.push({type:'burst', x:p.x, y:p.y-14, t:0.25, max:0.25, color:'#d8f4ff'});
  return true;
}
// returns the damage left for life after the mana pays its share
function manaShieldSoak(g, p, dmg){
  if(!p.manaShieldOn || !(dmg>0) || !(p.mp>0)) return dmg;
  const r = effectiveRank(p,'manaShield')||1, per = manaShieldCostPer(r);
  const take = Math.min(dmg*manaShieldPct(r), p.mp/per);
  p.mp = Math.max(0, p.mp - take*per);
  if(Math.random()<0.5) g.particles.push({type:'burst', x:p.x, y:p.y-18, t:0.2, max:0.2, color:'#7ea8ff'});
  if(p.mp < 1){ p.manaShieldOn = false; showMsg('Mana Shield broken', 0.8); }
  return Math.max(0, Math.round(dmg - take));
}
function mysticDefenseTick(g, p, dt){
  if(wantStormWard){
    wantStormWard = false;
    const r = effectiveRank(p,'stormWard')||0;
    if(r>0 && !(p.stormWardCd>0) && resourceAffordable(p,'stormWard')){
      spendResource(p,'stormWard');
      p.stormWardT = skDur(p, stormWardDur(r)); p.stormWardMax = p.stormWardT;
      p.stormWardCdMax = applyCdr(p, STORM_WARD_CD); p.stormWardCd = p.stormWardCdMax;
      showMsg('Storm Ward!', 0.8); try{ sfxPlay('wind', 0.9); }catch(e){}
      g.particles.push({type:'ring', x:p.x, y:p.y, t:0.5, max:0.5, r:70, color:'#d8f4ff'});
    } else if(r>0 && !(p.stormWardCd>0)) noResourceMsg(p);
  }
  if(p.stormWardT>0) p.stormWardT = Math.max(0, p.stormWardT - dt);
  if(p.stormWardCd>0) p.stormWardCd = Math.max(0, p.stormWardCd - dt);
  if(wantManaShield){
    wantManaShield = false;
    const r = effectiveRank(p,'manaShield')||0;
    if(r>0 && p.manaShieldOn){ p.manaShieldOn = false; showMsg('Mana Shield down', 0.8); }
    else if(r>0 && !(p.manaShieldCd>0) && resourceAffordable(p,'manaShield')){
      spendResource(p,'manaShield'); p.manaShieldOn = true;
      p.manaShieldCdMax = MANA_SHIELD_CD; p.manaShieldCd = MANA_SHIELD_CD;
      showMsg('Mana Shield!', 0.8); try{ sfxPlay('ward', 0.9); }catch(e){}
      g.particles.push({type:'ring', x:p.x, y:p.y, t:0.5, max:0.5, r:60, color:'#7ea8ff'});
    } else if(r>0 && !(p.manaShieldCd>0)) noResourceMsg(p);
  }
  if(p.manaShieldCd>0) p.manaShieldCd = Math.max(0, p.manaShieldCd - dt);
  if(p.manaShieldOn && !((effectiveRank(p,'manaShield')||0)>0)) p.manaShieldOn = false;
}
// a swirl of wind arcs and leaves around the hero
function drawStormWardAura(p, iso, s){
  const t = p.animT||0, k = p.stormWardMax ? clamp(p.stormWardT/p.stormWardMax, 0, 1) : 1;
  const fade = k<0.2 ? 0.5+0.5*Math.sin(t*20) : 1;
  ctx.save(); ctx.lineCap = 'round';
  for(let i=0;i<5;i++){
    const a = t*3.2 + i*1.2566, rx = 30*s, ry = 15*s, cy = iso.y - 8*s - (i%3)*9*s;
    ctx.globalAlpha = (0.35 + 0.15*Math.sin(t*5+i)) * fade;
    ctx.strokeStyle = i%2 ? '#e6f6ff' : '#a9d8f0'; ctx.lineWidth = 2*s;
    ctx.beginPath(); ctx.ellipse(iso.x, cy, rx, ry, 0, a, a+1.4); ctx.stroke();
  }
  ctx.globalAlpha = 0.8*fade; ctx.fillStyle = '#d8f4ff';
  for(let i=0;i<3;i++){ const a = -t*4 + i*2.094; ctx.beginPath(); ctx.arc(iso.x + Math.cos(a)*30*s, iso.y - 14*s + Math.sin(a)*15*s, 1.8*s, 0, 7); ctx.fill(); }
  ctx.restore();
}
// a thin shimmering blue sphere
function drawManaShieldAura(p, iso, s){
  const t = p.animT||0;
  ctx.save();
  ctx.globalAlpha = 0.5 + 0.1*Math.sin(t*3);
  const gr = ctx.createRadialGradient(iso.x, iso.y-22*s, 6*s, iso.x, iso.y-22*s, 30*s);
  gr.addColorStop(0, 'rgba(90,130,255,0)'); gr.addColorStop(0.75, 'rgba(90,130,255,0.18)'); gr.addColorStop(1, 'rgba(140,175,255,0.6)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(iso.x, iso.y-22*s, 25*s, 32*s, 0, 0, 7); ctx.fill();
  ctx.globalAlpha = 0.8; ctx.strokeStyle = '#a9c0ff'; ctx.lineWidth = 2*s;
  ctx.beginPath(); ctx.ellipse(iso.x, iso.y-22*s, 25*s, 32*s, 0, t*1.5, t*1.5+2.4); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(iso.x, iso.y-22*s, 25*s, 32*s, 0, t*1.5+3.14, t*1.5+4.4); ctx.stroke();
  ctx.restore();
}
