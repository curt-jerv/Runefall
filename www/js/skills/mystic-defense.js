// ---- Mystic defenses: Storm Ward (Djinn) and Mana Shield (Elementalist) -- v564, passives since v567 ----
// Storm Ward: winds always swirl around you, adding to your evasion chance (v568: it is part of evasionChance, under the same 60% cap)
function stormWardChance(r){ r = Math.max(1, r||1); return Math.min(0.25, 0.08 + 0.10*(Math.min(10,r)-1)/9 + 0.005*Math.max(0, r-10)); }   // v567: 8% -> 18% at rank 10
// Mana Shield: part of every hit is paid from mana instead of life (after Ice Armor has soaked what it can), while you have mana
function manaShieldPct(r){ r = Math.max(1, r||1); return Math.min(0.75, 0.30 + 0.30*(Math.min(10,r)-1)/9 + 0.015*Math.max(0, r-10)); }
function manaShieldCostPer(r){ r = Math.max(1, r||1); return Math.max(0.6, 1.5 - 0.5*(Math.min(10,r)-1)/9 - 0.02*Math.max(0, r-10)); }   // mana per point of damage taken
// Stormstrider (the old Thunderstep): after a dodge your mana flows faster for a while
const STORMSTRIDER_REGEN_T = 4;

// returns the damage left for life after the mana pays its share
function manaShieldSoak(g, p, dmg){
  const r = (p.cls==='mystic' && p.skills && effectiveRank(p,'manaShield')) || 0;
  if(r<=0 || !(dmg>0) || !(p.mp>=1)) return dmg;
  const per = manaShieldCostPer(r), take = Math.min(dmg*manaShieldPct(r), p.mp/per);
  p.mp = Math.max(0, p.mp - take*per);
  if(Math.random()<0.5) g.particles.push({type:'burst', x:p.x, y:p.y-18, t:0.2, max:0.2, color:'#7ea8ff'});
  return Math.max(0, Math.round(dmg - take));
}
