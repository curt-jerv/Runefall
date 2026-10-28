// ---------------- v557: tiered item art (bag, stash, vendors, paper doll) ----------------
// Every piece of gear has three looks. The tier follows the same item-level steps as the hero's worn look
// (lookFromItem in render/heroes.js), so a helm or body armor in the bag is drawn exactly as the character wears it.
// Tier 1 is plain, tier 2 is finer metal and trim, tier 3 is gilded with a glow. The rarity colour (it.color) always
// shows on a gem, band or trim, as before. Shields use the hero's four shield looks (heroShieldTier).
function itemArtTier(it){ return typeof lookFromItem==='function' ? Math.max(1, lookFromItem(it)) : (it.tier||1); }
function itemArtShieldTier(it){
  let b = it.bracket;
  if(b===undefined) b = it.ilvl ? baseBracketIdx(it.ilvl) : (it.tier ? [0,2,4][Math.min(3,it.tier)-1] : 0);
  return b<=0 ? 0 : b===1 ? 1 : b<=3 ? 2 : 3;
}
const IA_GOLD = '#d8b04a', IA_GOLD_D = '#7a5a14', IA_STEEL = '#cfd8e2', IA_STEEL_D = '#5c6878';
// a soft glow behind tier-3 pieces, in the rarity colour
function iaGlow(cx, cy, rx, ry, col){ return '<defs><radialGradient id="glw"><stop offset="0" stop-color="'+col+'" stop-opacity=".55"/><stop offset="1" stop-color="'+col+'" stop-opacity="0"/></radialGradient></defs><ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="url(#glw)"/>'; }
function iaGrad(id, stops, x1, y1, x2, y2){ return '<defs><linearGradient id="'+id+'" x1="'+(x1||0)+'" y1="'+(y1||0)+'" x2="'+(x2==null?1:x2)+'" y2="'+(y2==null?1:y2)+'">'+stops.map((c,i)=>'<stop offset="'+(i/(stops.length-1))+'" stop-color="'+c+'"/>').join('')+'</linearGradient></defs>'; }
function iaRad(id, stops){ return '<defs><radialGradient id="'+id+'" cx=".38" cy=".32" r=".75">'+stops.map((c,i)=>'<stop offset="'+(i/(stops.length-1))+'" stop-color="'+c+'"/>').join('')+'</radialGradient></defs>'; }
function iaSpark(x, y, r, col){ return '<path d="M'+x+' '+(y-r)+'L'+(x+r*0.28)+' '+(y-r*0.28)+'L'+(x+r)+' '+y+'L'+(x+r*0.28)+' '+(y+r*0.28)+'L'+x+' '+(y+r)+'L'+(x-r*0.28)+' '+(y+r*0.28)+'L'+(x-r)+' '+y+'L'+(x-r*0.28)+' '+(y-r*0.28)+'Z" fill="'+(col||'#fff')+'" fill-opacity=".9"/>'; }

// ---- helms: drawn as the hero wears them (heroes.js drawWarrior / drawRanger / drawMystic) ----
function iaHelm(it, T, acc){
  const m = it.material || 'plate';
  if(m==='plate'){
    if(T===1){   // iron skullcap with a nose bar, rivets and a chinstrap
      return iaRad('cap',['#aab0ba','#6e7480','#3e434e'])+
        '<path d="M5 26 A15 15 0 0 1 35 26 Z" fill="url(#cap)" stroke="#23272f" stroke-width="1.4"/>'+
        '<rect x="4.5" y="23.5" width="31" height="3.4" fill="#4a4f5a"/>'+
        '<rect x="18.6" y="25" width="2.8" height="10" fill="#8a909c" stroke="#23272f" stroke-width=".6"/>'+
        [10.5,20,29.5].map((x,i)=>'<circle cx="'+x+'" cy="'+(i===1?16.5:19.5)+'" r="1.2" fill="#b8b2a0"/>').join('')+
        '<path d="M7 27 L10.5 37 M33 27 L29.5 37" stroke="#3a2818" stroke-width="1.4"/><rect x="8.6" y="35" width="3.6" height="2.4" rx=".6" fill="'+acc+'"/>';
    }
    // tier 2/3: the swept-back winged helm with cheek plates, nose guard, ridge and a tall red crest
    const g3 = T>=3, trim = IA_GOLD;
    const wing = (s)=>'<path d="M'+(20+s*12)+' 23 Q'+(20+s*19)+' 20 '+(20+s*19.5)+' 6 Q'+(20+s*15)+' 13 '+(20+s*13)+' 15 Z" fill="'+(g3?'url(#gw)':'#aab3c4')+'" stroke="#262c38" stroke-width=".9"/>'+
      '<path d="M'+(20+s*12.6)+' 21.6 Q'+(20+s*17.6)+' 18.6 '+(20+s*18.6)+' 8.6" fill="none" stroke="'+trim+'" stroke-width="'+(g3?1.4:.9)+'"/>';
    return (g3 ? iaGlow(20,22,19,17,acc)+iaGrad('gw',['#fff4c8','#d8b04a','#8a6420'],0,0,1,1) : '')+
      iaRad('hm',['#e6ebf3','#98a3b6','#566073'])+
      wing(-1)+wing(1)+
      '<path d="M7.5 25 A12.5 12.5 0 0 1 32.5 25 L32.5 26 L7.5 26 Z" fill="url(#hm)" stroke="#2c3340" stroke-width="1.4"/>'+
      '<path d="M7.6 26 L10.2 26 L10.8 34 L8 32.5 Z M32.4 26 L29.8 26 L29.2 34 L32 32.5 Z" fill="#7c869a" stroke="#2c3340" stroke-width=".8"/>'+
      '<rect x="7.4" y="23.6" width="25.2" height="2.6" fill="#8a94a8"/><rect x="7.4" y="22.6" width="25.2" height="1.4" fill="'+trim+'"/>'+
      '<rect x="18.6" y="24.6" width="2.8" height="9" fill="#aab3c4" stroke="#2c3340" stroke-width=".6"/>'+
      '<path d="M17.6 15 Q20 9 22.4 15 L22.4 23 L17.6 23 Z" fill="'+(g3?'url(#gw)':'#c3cad8')+'" stroke="#262c38" stroke-width=".9"/>'+
      '<path d="M18 13.6 Q15.5 0 24 2.6 Q31 5 30.5 15 Q27 8.6 21.5 13 Z" fill="#b02a2a" stroke="#4a1414" stroke-width=".8"/>'+
      '<path d="M11 18 A10 10 0 0 1 18 13.4" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2"/>'+
      '<circle cx="20" cy="23.3" r="'+(g3?1.9:1.3)+'" fill="'+acc+'" stroke="'+IA_GOLD_D+'" stroke-width=".5"/>'+
      (g3 ? iaSpark(31,5,2.4) : '');
  }
  if(m==='leather'){
    if(T===1){   // a plain brown cap with a short brim
      return '<path d="M7 25 A13 13 0 0 1 33 25 Z" fill="#5a4a30" stroke="#241a0f" stroke-width="1.2"/>'+
        '<ellipse cx="22.4" cy="25.6" rx="15.6" ry="3.6" fill="#46382a" stroke="#241a0f" stroke-width="1"/>'+
        '<path d="M8.4 21.5 H31.6" stroke="'+acc+'" stroke-width="1.6"/><path d="M20 12.2 V20.6" stroke="#3a2c1c" stroke-width=".8" stroke-dasharray="1.4 1.2"/>';
    }
    // tier 2/3: the deep green ranger's hood with a red feather (tier 3: gold-stitched rim and a long green feather)
    const g3 = T>=3;
    return (g3 ? iaGlow(20,22,18,17,acc) : '')+iaGrad('hd',['#3a4a30','#1a2414'],0,0,0,1)+
      (g3 ? '<path d="M27 15 Q38 0 39 15 Q33 9 27.5 17 Z" fill="#2f8a4a" stroke="#14301c" stroke-width=".6"/>' : '')+
      '<path d="M8 33 Q5.5 8 20 6 Q34.5 8 32 33 Q27 21 20 21 Q13 21 8 33 Z" fill="url(#hd)" stroke="#0e1409" stroke-width="1.2"/>'+
      '<path d="M11.5 31 Q15 23.6 20 23.4 Q25 23.6 28.5 31 Q24 28.4 20 28.4 Q16 28.4 11.5 31 Z" fill="#0c120a" opacity=".85"/>'+
      '<path d="M27 15.4 Q35 5.6 36 17.4 Q31 12 27.4 17.6 Z" fill="#b8423a" stroke="#4a1410" stroke-width=".6"/>'+
      (g3 ? '<path d="M8 33 Q5.5 8 20 6 Q34.5 8 32 33" fill="none" stroke="'+IA_GOLD+'" stroke-width="1.1"/>' : '')+
      '<ellipse cx="20" cy="34.4" rx="8" ry="2.6" fill="#6a4a2a" stroke="#1a1208" stroke-width=".8"/>'+
      '<circle cx="20" cy="34.4" r="1.4" fill="'+acc+'"/>';
  }
  // robe
  if(T===1){   // a plain cloth cowl
    return '<path d="M7.6 35 Q5 9 20 5 Q35 9 32.4 35 Q27.4 21 20 20.6 Q12.6 21 7.6 35 Z" fill="#5a5a7a" stroke="#26263c" stroke-width="1.2"/>'+
      '<path d="M11.4 33 Q15 24 20 23.6 Q25 24 28.6 33 Q24 30 20 30 Q16 30 11.4 33 Z" fill="#14121e" opacity=".85"/>'+
      '<path d="M20 5.4 V20" stroke="#3e3e5a" stroke-width=".8"/><path d="M9 34.6 H31" stroke="'+acc+'" stroke-width="1.6"/>';
  }
  if(T===2){   // the adept's circlet: a purple band set with a glowing gem
    return iaGlow(20,15,9,9,acc)+
      '<ellipse cx="20" cy="22" rx="14" ry="7.6" fill="none" stroke="#3a1f52" stroke-width="4.6"/>'+
      '<ellipse cx="20" cy="22" rx="14" ry="7.6" fill="none" stroke="#6a3a8a" stroke-width="2.6"/>'+
      '<path d="M8 19.4 Q20 13 32 19.4" fill="none" stroke="'+IA_GOLD+'" stroke-width=".9"/>'+
      '<path d="M20 9.6 L24 15.4 L20 20.4 L16 15.4 Z" fill="'+acc+'" stroke="'+IA_GOLD+'" stroke-width="1"/><path d="M18.4 13.6 L20 11.6 L21.2 13.4" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".8"/>';
  }
  // tier 3: the archmage's tall pointed hat with a gold band and a star
  return iaGlow(20,22,19,17,acc)+iaGrad('ht',['#4a2080','#3a1860','#22104a'],0,0,1,1)+
    '<ellipse cx="20" cy="31" rx="18" ry="5" fill="#2e1450" stroke="#160a28" stroke-width="1"/>'+
    '<path d="M7.6 30.4 Q13.6 24 17.6 9 Q25 -1 36 1.6 Q27.4 8 32.4 30.4 Q20 26.4 7.6 30.4 Z" fill="url(#ht)" stroke="#160a28" stroke-width="1"/>'+
    '<path d="M8.4 29 Q20 25.2 31.6 29 L31.8 26.6 Q20 22.8 8.6 26.6 Z" fill="'+IA_GOLD+'" stroke="'+IA_GOLD_D+'" stroke-width=".6"/>'+
    '<circle cx="20" cy="26.6" r="1.6" fill="'+acc+'"/>'+iaSpark(22.4,15.6,3.6,acc)+iaSpark(30,6.4,1.6);
}

// ---- body armor: drawn as the hero wears it ----
function iaArmor(it, T, acc){
  const m = it.material || 'plate';
  // shared torso outline (shoulders, body, hem) in a 40x60 box
  const torso = 'M9 12 Q20 8 31 12 L32 50 Q20 54 8 50 Z';
  if(m==='plate'){
    if(T===1){   // padded leather jerkin: quilted rows, a cross strap with iron studs, a belt with a brass buckle
      return iaGrad('jk',['#7a5a38','#5a4026','#33241a'])+
        '<ellipse cx="7.6" cy="15" rx="6.4" ry="5.2" fill="#5a4026" stroke="#1f150c" stroke-width="1"/><ellipse cx="32.4" cy="15" rx="6.4" ry="5.2" fill="#5a4026" stroke="#1f150c" stroke-width="1"/>'+
        '<path d="'+torso+'" fill="url(#jk)" stroke="#1f150c" stroke-width="1.4"/>'+
        [18,23,28,33,38,43].map(y=>'<path d="M9.4 '+y+' H30.6" stroke="#140c06" stroke-opacity=".5" stroke-width=".8"/>').join('')+
        '<path d="M10 13 L30 41" stroke="#2e2014" stroke-width="3"/>'+
        [[14,19],[26,19],[14,29],[26,29],[17,38],[23,38]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="1.1" fill="#b8b2a0"/>').join('')+
        '<ellipse cx="20" cy="10.4" rx="7" ry="2.8" fill="#6a4a2c" stroke="#33261a" stroke-width=".9"/>'+
        '<rect x="8" y="42" width="24" height="4" fill="#2e2014"/><rect x="17.4" y="41.4" width="5.2" height="5.2" fill="#b8923a" stroke="#3a2a12" stroke-width=".6"/><rect x="19" y="43" width="2" height="2" fill="'+acc+'"/>';
    }
    // tier 2: steel breastplate with a gorget, round pauldrons and crossed leather harness; tier 3: gold trim, double pauldrons, a red cape
    const g3 = T>=3;
    const pd = (x)=>(g3 ? '<ellipse cx="'+x+'" cy="14" rx="7.6" ry="6.4" fill="url(#pd)" stroke="'+IA_GOLD+'" stroke-width="1.2"/><ellipse cx="'+x+'" cy="18" rx="6.2" ry="5" fill="url(#pd)" stroke="#272d3a" stroke-width=".9"/>' : '<ellipse cx="'+x+'" cy="14.6" rx="7" ry="5.8" fill="url(#pd)" stroke="#272d3a" stroke-width="1"/>')+'<circle cx="'+x+'" cy="13.4" r="1.3" fill="#c9d0dc"/>';
    return (g3 ? iaGlow(20,30,20,28,acc)+'<path d="M8 12 Q3 40 2 58 L38 58 Q37 40 32 12 Z" fill="#8a1c2c" stroke="#3a0f1c" stroke-width="1"/>' : '')+
      iaGrad('bp',['#eef2f8','#a6b0c0','#5a6475'])+iaRad('pd',['#eef2f8','#cfd6e2','#5a6475'])+
      '<path d="'+torso+'" fill="url(#bp)" stroke="#2c3340" stroke-width="1.5"/>'+
      '<path d="M12 14 L12 46" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>'+
      '<path d="M10 14 L30 41 M30 14 L10 41" stroke="#4a3220" stroke-width="2.8"/>'+
      '<circle cx="20" cy="27.4" r="2.4" fill="#b8923a" stroke="#3a2a12" stroke-width=".8"/><circle cx="20" cy="27.4" r="1.1" fill="'+acc+'"/>'+
      '<ellipse cx="20" cy="10" rx="8.4" ry="3.6" fill="#8a94a8" stroke="#2c3340" stroke-width="1"/>'+
      pd(7.4)+pd(32.6)+
      '<rect x="8" y="42" width="24" height="4" fill="#4a3220"/><rect x="17.4" y="41.4" width="5.2" height="5.2" fill="#b8923a"/>'+
      (g3 ? '<path d="'+torso+'" fill="none" stroke="'+IA_GOLD+'" stroke-width="1.3"/><path d="M8.4 46 L31.6 46 L32.6 53 L20 57 L7.4 53 Z" fill="none" stroke="'+IA_GOLD+'" stroke-width="1.2"/>'+
        '<path d="M20 16 L23 20.6 L20 25 L17 20.6 Z" fill="'+IA_GOLD+'" stroke="'+IA_GOLD_D+'" stroke-width=".6"/>'+iaSpark(31,23,2.2) : '');
  }
  if(m==='leather'){
    // laced leather jerkin with a baldric, a studded belt and a hip pouch (tier 2: studs; tier 3: green mantle, gold clasp)
    const g3 = T>=3, mant = g3 ? '#3f6e46' : '#4a4a34';
    return (g3 ? iaGlow(20,30,20,28,acc) : '')+iaGrad('lt',['#8a6a44','#5f4a2e','#3a2c1a'])+
      '<path d="'+torso+'" fill="url(#lt)" stroke="#24190f" stroke-width="1.2"/>'+
      '<path d="M12.6 14 L12.6 46" stroke="#fff0d2" stroke-opacity=".18" stroke-width="1.6"/>'+
      [17,23,29,35].map(y=>'<path d="M17 '+y+' L23 '+(y+4)+' M23 '+y+' L17 '+(y+4)+'" stroke="#2a1e10" stroke-width="1"/>').join('')+
      '<path d="M10 12 L29 46" stroke="#4a3420" stroke-width="4"/><path d="M10 12 L29 46" stroke="#2a1e10" stroke-width=".8"/>'+
      '<circle cx="'+(g3?18.2:18.2)+'" cy="28" r="'+(g3?2.6:1.8)+'" fill="'+(g3?IA_GOLD:'#b8923a')+'" stroke="#3a2a12" stroke-width=".6"/>'+
      '<ellipse cx="'+(g3?9:9.6)+'" cy="12.6" rx="'+(g3?7.6:6)+'" ry="'+(g3?4.6:3.6)+'" fill="'+mant+'" transform="rotate(16 9 12.6)"/><ellipse cx="'+(g3?31:30.4)+'" cy="12.6" rx="'+(g3?7.6:6)+'" ry="'+(g3?4.6:3.6)+'" fill="'+mant+'" transform="rotate(-16 31 12.6)"/>'+
      (T>=2 ? [[12,17],[28,17],[12,29],[28,29],[12,39],[28,39]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="1.1" fill="#9a8a62"/>').join('') : '')+
      '<rect x="8.4" y="44" width="23.2" height="4.4" fill="#2a1e10"/><rect x="17.6" y="43.4" width="4.8" height="5.6" fill="#b8923a"/>'+
      '<rect x="24.6" y="46" width="6.6" height="7.6" rx="2" fill="#5a4228" stroke="#1c140c" stroke-width=".8"/><rect x="25.6" y="47" width="4.6" height="2" fill="'+acc+'"/>'+
      (g3 ? '<path d="'+torso+'" fill="none" stroke="'+IA_GOLD+'" stroke-width="1"/>'+iaSpark(31,22,2.2) : '');
  }
  // robes: slate (tier 1), deep purple with spell-lit runes (tier 2), bright purple with gold hem and sparks (tier 3)
  const RB = [['#505070','#26263c'],['#3a1f52','#170c22'],['#4a2470','#1c0c30']][T-1];
  const RT = [['#6a6a8c','#464668','#26263c'],['#6a3a8a','#4a2568','#2a1440'],['#8a4aba','#5a2c88','#2e1250']][T-1];
  const robe = 'M9 11 Q20 7 31 11 L33 24 Q36 44 37 58 L3 58 Q4 44 7 24 Z';
  return (T>=3 ? iaGlow(20,32,20,28,acc) : '')+iaGrad('rb',RT)+
    '<path d="'+robe+'" fill="url(#rb)" stroke="#1a0e28" stroke-width="1.1"/>'+
    '<path d="M3 58 Q4 44 7 24 L11 26 Q10 44 9 58 Z" fill="'+RB[1]+'" opacity=".55"/><path d="M37 58 Q36 44 33 24 L29 26 Q30 44 31 58 Z" fill="'+RB[1]+'" opacity=".55"/>'+
    '<path d="M15.6 10 L24.4 10 L22 26 L18 26 Z" fill="'+(T>=2?'#3a7a4a':'#d8ccae')+'"/>'+
    '<ellipse cx="9" cy="12.4" rx="6.6" ry="4.2" fill="'+RB[0]+'" transform="rotate(14 9 12.4)"/><ellipse cx="31" cy="12.4" rx="6.6" ry="4.2" fill="'+RB[0]+'" transform="rotate(-14 31 12.4)"/>'+
    '<path d="M7.6 30 H32.4" stroke="'+(T>=2?'#c9a24a':'#7a5a32')+'" stroke-width="2"/><path d="M21 30 L23.4 44 L21 44 L19.4 30 Z" fill="#c9a24a"/>'+
    (T>=2 ? '<path d="M20 33 V54 M17 38 H23 M17.8 44 H22.2 M18.4 50 H21.6" stroke="'+acc+'" stroke-width="1.1" stroke-opacity=".9"/><path d="M3.4 57 H36.6" stroke="'+acc+'" stroke-width="1.2" stroke-opacity=".8"/>'
           : '<path d="M3.6 56.6 H36.4" stroke="'+acc+'" stroke-width="1.6"/>')+
    (T>=3 ? '<path d="M3.6 55 H36.4" stroke="'+IA_GOLD+'" stroke-width="1.8"/>'+iaSpark(5,30,1.8,acc)+iaSpark(35,24,1.6,acc)+iaSpark(32,44,1.4) : '');
}

// ---- weapons ----
function iaSword1h(T, acc){   // 20x60
  if(T===1) return '<polygon points="10,4 12.6,9 12.4,38 7.6,38 7.4,9" fill="#a8b0b8" stroke="#545c66" stroke-width=".8"/><path d="M10 9 V37" stroke="#545c66" stroke-width=".7"/>'+
    '<rect x="4" y="38" width="12" height="3" rx="1" fill="#6e6e72" stroke="#33343a" stroke-width=".6"/><rect x="8.5" y="41" width="3" height="11" rx="1" fill="#6a4628"/>'+
    '<path d="M8.5 43.4 l3 1.2 M8.5 46.6 l3 1.2 M8.5 49.8 l3 1.2" stroke="#3a2614" stroke-width=".6"/><circle cx="10" cy="54.4" r="2.6" fill="#6e6e72" stroke="#33343a" stroke-width=".6"/><circle cx="10" cy="39.5" r="1" fill="'+acc+'"/>';
  const g3 = T>=3;
  return (g3 ? iaGlow(10,24,10,26,acc) : '')+iaGrad('sb',['#ffffff','#cfd8e2','#7e8a9a'],0,0,1,0)+
    '<polygon points="10,1 13.4,8 13,37 7,37 6.6,8" fill="url(#sb)" stroke="'+(g3?IA_GOLD_D:'#56606e')+'" stroke-width=".8"/>'+
    '<path d="M10 6 V35" stroke="#6f7b8a" stroke-width="1.4"/>'+
    (g3 ? '<path d="M10 9 l1.4 2.4 -1.4 2.4 -1.4 -2.4z M10 17 l1.4 2.4 -1.4 2.4 -1.4 -2.4z M10 25 l1.4 2.4 -1.4 2.4 -1.4 -2.4z" fill="'+acc+'" fill-opacity=".9"/><path d="M7 8 V36 M13 8 V36" stroke="'+acc+'" stroke-opacity=".55" stroke-width=".7"/>' : '')+
    (g3 ? '<path d="M1 37 Q3 33.4 7 36 H13 Q17 33.4 19 37 Q16 38.4 13 40 H7 Q4 38.4 1 37 Z" fill="'+IA_GOLD+'" stroke="'+IA_GOLD_D+'" stroke-width=".7"/>'
        : '<rect x="2.6" y="37" width="14.8" height="3.4" rx="1.6" fill="'+IA_GOLD+'" stroke="'+IA_GOLD_D+'" stroke-width=".7"/>')+
    '<rect x="8.4" y="40.4" width="3.2" height="11" rx="1" fill="#3a2418"/><path d="M8.4 42.6 l3.2 1.6 M8.4 46 l3.2 1.6 M8.4 49.4 l3.2 1.6" stroke="'+(g3?IA_GOLD:'#8a6a44')+'" stroke-width=".7"/>'+
    '<circle cx="10" cy="54.4" r="'+(g3?3.4:2.8)+'" fill="'+IA_GOLD+'" stroke="'+IA_GOLD_D+'" stroke-width=".7"/><circle cx="10" cy="54.4" r="'+(g3?1.8:1.2)+'" fill="'+acc+'"/>'+
    '<circle cx="10" cy="38.6" r="1.3" fill="'+acc+'"/>'+(g3 ? iaSpark(12.6,4,2.2) : '');
}
function iaSword2h(T, acc){   // 40x80
  if(T===1) return '<polygon points="20,4 25,12 24.4,52 15.6,52 15,12" fill="#a0a8b0" stroke="#4e565f" stroke-width="1.1"/><path d="M20 10 V50" stroke="#4e565f" stroke-width="1"/>'+
    '<rect x="7" y="52" width="26" height="4" rx="1.4" fill="#6a6a6e" stroke="#33343a" stroke-width=".8"/><rect x="17.6" y="56" width="4.8" height="15" rx="1.4" fill="#5a3a20"/>'+
    '<path d="M17.6 58.6l4.8 2.2M17.6 62.6l4.8 2.2M17.6 66.6l4.8 2.2" stroke="#2e1e10" stroke-width=".8"/><circle cx="20" cy="74.4" r="3.6" fill="#6a6a6e" stroke="#33343a" stroke-width=".8"/><circle cx="20" cy="54" r="1.4" fill="'+acc+'"/>';
  const g3 = T>=3, bw = g3 ? 7 : 6;
  return (g3 ? iaGlow(20,34,20,36,acc) : '')+iaGrad('gb',['#ffffff','#cfd8e2','#6f7b8a'],0,0,1,0)+
    '<polygon points="20,0 '+(20+bw+1.5)+',9 '+(20+bw)+',50 '+(20-bw)+',50 '+(20-bw-1.5)+',9" fill="url(#gb)" stroke="'+(g3?IA_GOLD_D:'#56606e')+'" stroke-width="1.1"/>'+
    '<polygon points="20,5 '+(20+bw*0.38)+',11 '+(20+bw*0.38)+',47 '+(20-bw*0.38)+',47 '+(20-bw*0.38)+',11" fill="#6f7b8a" fill-opacity=".55"/>'+
    (g3 ? [14,22,30,38].map(y=>'<path d="M20 '+y+' l2 3.2 -2 3.2 -2 -3.2z" fill="'+acc+'"/>').join('')+'<path d="M'+(20-bw)+' 12 V48 M'+(20+bw)+' 12 V48" stroke="'+acc+'" stroke-opacity=".6" stroke-width="1"/>' : '')+
    (g3 ? '<path d="M1 54 Q4 44 14 49 H26 Q36 44 39 54 Q32 54 26 55.4 H14 Q8 54 1 54 Z" fill="'+IA_GOLD+'" stroke="'+IA_GOLD_D+'" stroke-width=".9"/>'
        : '<path d="M4 56 Q7 50 14 50.4 H26 Q33 50 36 56 Q31 55 26 55 H14 Q9 55 4 56Z" fill="'+IA_GOLD+'" stroke="'+IA_GOLD_D+'" stroke-width=".9"/>')+
    '<rect x="17.6" y="55.6" width="4.8" height="15" rx="1.4" fill="#3a2418"/><path d="M17.6 58l4.8 2.4M17.6 62l4.8 2.4M17.6 66l4.8 2.4" stroke="'+(g3?IA_GOLD:'#8a6a44')+'" stroke-width=".9"/>'+
    '<circle cx="20" cy="75" r="'+(g3?5:4.4)+'" fill="'+IA_GOLD+'" stroke="'+IA_GOLD_D+'" stroke-width="1"/><circle cx="20" cy="75" r="'+(g3?2.6:1.9)+'" fill="'+acc+'"/>'+
    '<circle cx="20" cy="52.6" r="1.8" fill="'+acc+'"/>'+(g3 ? iaSpark(25,5,3) : '');
}
function iaBow(T, acc){   // 40x60
  if(T===1) return '<path d="M28 4 C10 16 10 44 28 56" fill="none" stroke="#7a5230" stroke-width="3" stroke-linecap="round"/>'+
    '<line x1="28" y1="4" x2="28" y2="56" stroke="#d9cfae" stroke-width=".8"/><rect x="10.6" y="26" width="3.4" height="8" rx="1" fill="'+acc+'"/>'+
    '<line x1="13" y1="30" x2="34" y2="30" stroke="#b8a882" stroke-width="1.1"/><polygon points="34,30 30,28 30,32" fill="#8a909a"/>';
  const g3 = T>=3, limb = g3 ? 'url(#bl)' : '#5a3a20';
  return (g3 ? iaGlow(20,30,20,30,acc)+iaGrad('bl',['#f0d27a','#b8862e','#6a4a14'],0,0,1,1) : '')+
    '<path d="M31 3 Q20 6 17 14 C11 22 11 38 17 46 Q20 54 31 57" fill="none" stroke="'+limb+'" stroke-width="3.6" stroke-linecap="round"/>'+
    '<path d="M31 3 Q20 6 17 14 C11 22 11 38 17 46 Q20 54 31 57" fill="none" stroke="'+(g3?'#fff4c8':'#a87444')+'" stroke-width=".9" stroke-linecap="round"/>'+
    '<path d="M31 3 l3 -2 M31 57 l3 2" stroke="'+(g3?IA_GOLD:'#e8e2d0')+'" stroke-width="2" stroke-linecap="round"/>'+
    '<line x1="32" y1="3" x2="32" y2="57" stroke="'+(g3?acc:'#e8e2d0')+'" stroke-width="'+(g3?1.1:.8)+'" stroke-opacity="'+(g3?.95:1)+'"/>'+
    '<rect x="10" y="24" width="4.4" height="12" rx="1.4" fill="#3a2418"/><path d="M10 26.4h4.4M10 29.2h4.4M10 32h4.4" stroke="'+acc+'" stroke-width="1"/>'+
    '<line x1="14" y1="30" x2="37" y2="30" stroke="#d9cfae" stroke-width="1.2"/><polygon points="38,30 33,27.4 33,32.6" fill="'+(g3?IA_GOLD:IA_STEEL)+'"/><path d="M16 30l-3-3M16 30l-3 3M18.4 30l-3-3M18.4 30l-3 3" stroke="'+acc+'" stroke-width="1"/>'+
    (g3 ? iaSpark(14,12,2.2)+iaSpark(14,48,1.8,acc) : '');
}
function iaStaff(it, T, acc){   // 40x80
  const sc = ({fire:'#ff7a3d', ice:'#7ad0ff', lightning:'#e6e35a', soul:'#a06ad0'})[it.spell] || acc;
  if(T===1) return '<path d="M13 77 Q15 50 20 36 Q24 24 26 14" fill="none" stroke="#6a4626" stroke-width="3.4" stroke-linecap="round"/>'+
    '<path d="M13 77 Q15 50 20 36 Q24 24 26 14" fill="none" stroke="#9a7044" stroke-width="1" stroke-linecap="round"/>'+
    '<path d="M22 13 Q20 6 26 5 M30 13 Q33 8 28 5" fill="none" stroke="#6a4626" stroke-width="2" stroke-linecap="round"/>'+
    '<circle cx="27" cy="10" r="4" fill="'+sc+'" stroke="#2a1a0c" stroke-width=".8"/><circle cx="25.6" cy="8.8" r="1.2" fill="#fff" fill-opacity=".6"/>'+
    '<rect x="15" y="50" width="5" height="3" rx="1" fill="'+acc+'" transform="rotate(10 17 51)"/>';
  const g3 = T>=3;
  return iaRad('orb',['#ffffff',sc,sc])+(g3 ? iaGlow(28,13,14,14,sc) : iaGlow(28,13,9,9,sc))+
    '<line x1="12" y1="77" x2="26" y2="20" stroke="'+(g3?'#3a2418':'#7a5230')+'" stroke-width="3.6" stroke-linecap="round"/>'+
    '<line x1="12" y1="77" x2="26" y2="20" stroke="'+(g3?IA_GOLD:'#a87444')+'" stroke-width="'+(g3?.8:1)+'" stroke-dasharray="'+(g3?'3 3':'none')+'" stroke-linecap="round"/>'+
    (g3 ? '<path d="M16 26 Q14 8 26 2 Q40 4 40 18 Q36 8 28 7 Q19 9 16 26 Z" fill="'+IA_GOLD+'" stroke="'+IA_GOLD_D+'" stroke-width=".8"/>'+
           '<path d="M18 23 Q22 30 30 24" fill="none" stroke="'+IA_GOLD+'" stroke-width="1.6"/>'
        : '<path d="M19 19 C17 8 24 3 30 6 M35 19 C38 10 34 5 29 6" fill="none" stroke="'+IA_GOLD+'" stroke-width="2" stroke-linecap="round"/>')+
    '<circle cx="28" cy="14" r="'+(g3?7.4:6)+'" fill="url(#orb)" stroke="#fff" stroke-opacity=".6" stroke-width=".8"/><circle cx="25.6" cy="11.4" r="1.9" fill="#fff" fill-opacity=".75"/>'+
    '<rect x="14.4" y="'+(g3?50:52)+'" width="6.4" height="3.2" rx="1" fill="'+acc+'" transform="rotate(14 17.6 53)"/>'+
    (g3 ? '<rect x="13.2" y="58" width="5.6" height="2.6" rx="1" fill="'+IA_GOLD+'" transform="rotate(14 16 59)"/>'+iaSpark(37,26,2.4,sc)+iaSpark(18,4,1.8,sc)+iaSpark(9,40,1.6,sc) : '');
}
// shields follow the four hero shield looks: buckler, iron-rimmed heater, steel-and-crimson heater, gilded knight's shield
function iaShield(it, acc){   // 40x60
  const t = itemArtShieldTier(it);
  const heater = (k)=>{ const w = 16*k, top = 30-26*k, bot = 30+27*k; return 'M20 '+top+' L'+(20+w)+' '+(top+5*k)+' V'+(30+2*k)+' C'+(20+w)+' '+(30+15*k)+' '+(20+w*0.5)+' '+(bot-3*k)+' 20 '+bot+' C'+(20-w*0.5)+' '+(bot-3*k)+' '+(20-w)+' '+(30+15*k)+' '+(20-w)+' '+(30+2*k)+' V'+(top+5*k)+' Z'; };
  if(t===0) return iaRad('bk',['#9a7246','#4e331a'])+'<ellipse cx="20" cy="30" rx="17" ry="20" fill="url(#bk)" stroke="#2e1e0e" stroke-width="1.6"/>'+
    '<path d="M12 14 V46 M20 10 V50 M28 14 V46" stroke="#28180a" stroke-opacity=".5" stroke-width=".8"/>'+
    '<circle cx="20" cy="30" r="4.4" fill="#7a7e86" stroke="#2c2e34" stroke-width=".9"/><circle cx="20" cy="30" r="1.6" fill="'+acc+'"/>';
  if(t===1) return iaGrad('ws',['#8e6a40','#4a3018'])+'<path d="'+heater(1)+'" fill="url(#ws)"/>'+
    '<path d="M13.6 8 V44 M26.4 8 V44" stroke="#28180a" stroke-opacity=".5" stroke-width=".8"/>'+
    '<path d="'+heater(1)+'" fill="none" stroke="#5c616b" stroke-width="2.8"/><path d="'+heater(1)+'" fill="none" stroke="#1c1e24" stroke-width=".7"/>'+
    [[9,8],[31,8],[9,32],[31,32]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="1.1" fill="#9aa0aa"/>').join('')+
    '<circle cx="20" cy="28" r="4" fill="#8a909a" stroke="#2c2e34" stroke-width=".9"/><circle cx="20" cy="28" r="1.5" fill="'+acc+'"/>';
  if(t===2) return iaGrad('rim',['#f0f4fa','#98a3b6','#4c5464'])+iaGrad('fld',['#b83247','#6a1624'],0,0,0,1)+
    '<path d="'+heater(1)+'" fill="url(#rim)" stroke="#1c2029" stroke-width="1.5"/><path d="'+heater(0.74)+'" fill="url(#fld)"/>'+
    '<path d="M20 12 V46 M12 22.6 H28" stroke="#e0b84e" stroke-width="2.2" stroke-linecap="round"/>'+
    '<circle cx="20" cy="28.6" r="3.6" fill="#e0b84e" stroke="#7a5a1a" stroke-width=".9"/><circle cx="20" cy="28.6" r="1.5" fill="'+acc+'"/>';
  return iaGlow(20,30,21,30,acc)+iaGrad('rim',['#ffffff','#b4bfd0','#56607a'])+iaGrad('fld',['#9a1a30','#3e0812'],0,0,0,1)+
    '<path d="'+heater(1)+'" fill="url(#rim)" stroke="'+IA_GOLD+'" stroke-width="1.8"/><path d="'+heater(0.74)+'" fill="url(#fld)" stroke="'+IA_GOLD+'" stroke-width="1"/>'+
    '<path d="M20 11 L22.4 20 L31 22.6 L22.4 25.2 L20 46 L17.6 25.2 L9 22.6 L17.6 20 Z" fill="#e8c45a" stroke="#6a4a12" stroke-width=".7"/>'+
    '<circle cx="20" cy="22.6" r="3.4" fill="#2a5ab8" stroke="'+IA_GOLD+'" stroke-width="1"/><circle cx="20" cy="22.6" r="1.4" fill="'+acc+'"/>'+iaSpark(30,10,2.4);
}

// ---- small pieces: plain at tier 1, finer at tier 2, gilded at tier 3 ----
function iaGloves(it, T, acc){   // 40x40
  const mat = {plate:['#9aa4b2','#3c4452'], leather:['#7a5432','#2e1e10'], robe:['#5a4a7a','#241a38']}[it.material] || (T===1 ? ['#7a5a3a','#2e2012'] : ['#9aa4b2','#3c4452']);
  const g3 = T>=3, m = T===1 ? ['#7a5a3a','#2e2012'] : mat;
  return (g3 ? iaGlow(20,22,18,18,acc) : '')+
    '<rect x="9" y="15" width="22" height="16" rx="4" fill="'+m[0]+'" stroke="'+m[1]+'" stroke-width="1"/>'+
    [0,1,2,3].map(i=>'<rect x="'+(9+i*5.6)+'" y="'+(5+(i===1||i===2?-1:1))+'" width="4.6" height="'+(13+(i===1||i===2?1:0))+'" rx="2.2" fill="'+m[0]+'" stroke="'+m[1]+'" stroke-width=".9"/>').join('')+
    '<path d="M9 21 Q3 19 4 13 Q6 11 9 16" fill="'+m[0]+'" stroke="'+m[1]+'" stroke-width=".9"/>'+
    (T>=2 ? [0,1,2,3].map(i=>'<path d="M'+(9.6+i*5.6)+' '+(11+(i===1||i===2?-1:1))+' h3.4" stroke="'+m[1]+'" stroke-width=".8"/>').join('')+'<path d="M12 21 Q20 25 28 21" fill="none" stroke="'+m[1]+'" stroke-width=".9"/>' : '')+
    '<rect x="'+(T===1?9:7)+'" y="31" width="'+(T===1?22:26)+'" height="'+(T===1?5:7)+'" rx="2" fill="'+(g3?IA_GOLD:T===2?m[1]:'#5a4026')+'" stroke="'+(g3?IA_GOLD_D:'#1a1410')+'" stroke-width=".9"/>'+
    '<circle cx="20" cy="'+(T===1?33.5:34.5)+'" r="'+(g3?2.2:1.6)+'" fill="'+acc+'"/>'+(g3 ? iaSpark(31,8,2) : '');
}
function iaBoots(it, T, acc){   // 40x40
  const mat = {plate:['#9aa4b2','#3c4452'], leather:['#6a4a2a','#24180c'], robe:['#4a3a62','#1e1430']}[it.material] || ['#9aa4b2','#3c4452'];
  const g3 = T>=3, m = T===1 ? ['#6a4a2a','#24180c'] : mat;
  return (g3 ? iaGlow(20,22,19,17,acc) : '')+
    '<path d="M12 4 H25 V22 L35 27 Q37 29 37 33 V36 H6 V22 Z" fill="'+m[0]+'" stroke="'+m[1]+'" stroke-width="1.2"/>'+
    '<rect x="6" y="33" width="31" height="3.4" fill="'+m[1]+'"/>'+
    (T===1 ? '<path d="M14 12h9M14 17h9" stroke="'+m[1]+'" stroke-width=".9"/><rect x="11" y="4" width="15" height="4" fill="'+acc+'" stroke="'+m[1]+'" stroke-width=".8"/>'
           : '<rect x="10" y="3" width="17" height="6" rx="1.6" fill="'+(g3?IA_GOLD:m[1])+'" stroke="'+(g3?IA_GOLD_D:'#120c08')+'" stroke-width=".8"/><circle cx="18.5" cy="6" r="1.6" fill="'+acc+'"/>'+
             '<path d="M12 14 h13 M12 19 h13" stroke="'+m[1]+'" stroke-width="1"/><path d="M25 22 L35 27" stroke="'+(g3?IA_GOLD:'#fff')+'" stroke-opacity="'+(g3?1:.3)+'" stroke-width="1.2"/>'+
             '<path d="M26 30 Q30 27 34 30" fill="none" stroke="'+m[1]+'" stroke-width=".9"/>')+
    (g3 ? iaSpark(8,8,2) : '');
}
function iaBelt(it, T, acc){   // 40x20
  if(T===1) return '<rect x="1" y="6" width="38" height="8" rx="1.5" fill="#7a5432" stroke="#3a2614" stroke-width="1"/><path d="M1 8.2h38M1 11.8h38" stroke="#5a3a1e" stroke-width=".6"/>'+
    '<rect x="16" y="4.5" width="8" height="11" rx="1.6" fill="#8a8a8e" stroke="#3a3a3e" stroke-width=".8"/><rect x="18.6" y="7.6" width="2.8" height="4.8" fill="'+acc+'"/>';
  if(T===2) return '<rect x="1" y="5" width="38" height="10" rx="2" fill="#4a3220" stroke="#24180c" stroke-width="1"/>'+
    [3,8,29,34].map(x=>'<rect x="'+x+'" y="6" width="4" height="8" rx="1" fill="'+IA_STEEL+'" stroke="#44505e" stroke-width=".5"/>').join('')+
    '<rect x="15" y="3" width="10" height="14" rx="2" fill="'+IA_GOLD+'" stroke="'+IA_GOLD_D+'" stroke-width=".8"/><rect x="18" y="6.6" width="4" height="6.8" fill="'+acc+'"/>';
  return iaGlow(20,10,20,10,acc)+'<rect x="1" y="5" width="38" height="10" rx="2" fill="#3a2414" stroke="'+IA_GOLD_D+'" stroke-width="1"/>'+
    [2,7.4,12.8,24.4,29.8,35.2].map(x=>'<rect x="'+x+'" y="5.6" width="4.4" height="8.8" rx="1.2" fill="'+IA_GOLD+'" stroke="'+IA_GOLD_D+'" stroke-width=".5"/>').join('')+
    '<path d="M14 2 H26 L28 10 L26 18 H14 L12 10 Z" fill="'+IA_GOLD+'" stroke="'+IA_GOLD_D+'" stroke-width=".9"/><path d="M20 4.6 L23.6 10 L20 15.4 L16.4 10 Z" fill="'+acc+'" stroke="#fff" stroke-opacity=".6" stroke-width=".6"/>'+iaSpark(34,4,1.8);
}
function iaRing(it, T, acc){   // 20x20
  const bn = it.baseName || '', gem = ART_GEM[bn], gc = (gem===undefined || gem===null) ? acc : gem;
  if(T===1) return '<circle cx="10" cy="12.4" r="6" fill="none" stroke="#8b97a6" stroke-width="3.2"/><path d="M5 9.6l2 1M15 9.6l-2 1" stroke="#cfd8e2" stroke-width=".8"/><circle cx="10" cy="6.4" r="1.6" fill="'+acc+'"/>';
  if(T===2) return '<circle cx="10" cy="12.6" r="6.2" fill="none" stroke="'+IA_GOLD+'" stroke-width="2.4"/><circle cx="10" cy="12.6" r="6.2" fill="none" stroke="#fff4c8" stroke-opacity=".5" stroke-width=".6"/>'+
    '<path d="M6.8 4.6 L10 1.6 L13.2 4.6 L10 8.2 Z" fill="'+gc+'" stroke="#fff" stroke-opacity=".7" stroke-width=".6"/><circle cx="10" cy="11" r=".9" fill="'+acc+'"/>';
  return iaGlow(10,10,10,10,acc)+'<circle cx="10" cy="12.8" r="6" fill="none" stroke="'+IA_GOLD+'" stroke-width="2.8"/><path d="M4.4 12 Q10 17 15.6 12" fill="none" stroke="#fff4c8" stroke-width=".7"/>'+
    '<path d="M5.6 6 L8 3 L12 3 L14.4 6 L10 10.4 Z" fill="'+gc+'" stroke="'+IA_GOLD+'" stroke-width=".9"/><path d="M8 3 L10 6 L12 3 M5.6 6 H14.4" stroke="#fff" stroke-opacity=".6" stroke-width=".5" fill="none"/>'+
    '<circle cx="4.6" cy="14" r="1" fill="'+acc+'"/><circle cx="15.4" cy="14" r="1" fill="'+acc+'"/>'+iaSpark(15.6,2.6,1.8);
}
function iaAmulet(it, T, acc){   // 20x20
  const bn = it.baseName || '', gc = ART_GEM[bn] || acc;
  if(T===1) return '<path d="M3 1 Q10 12 17 1" fill="none" stroke="#7a5a32" stroke-width="1.1"/><path d="M10 9 L13.4 14 L10 19 L6.6 14 Z" fill="#d8ccae" stroke="#5a4a32" stroke-width=".8"/><circle cx="10" cy="14" r="1.6" fill="'+acc+'"/>';
  if(T===2) return '<path d="M3 1 Q10 14 17 1" fill="none" stroke="'+IA_GOLD+'" stroke-width="1.2" stroke-dasharray="1.2 .8"/>'+
    '<circle cx="10" cy="13.4" r="5" fill="'+gc+'" stroke="'+IA_GOLD+'" stroke-width="1.6"/><circle cx="8.6" cy="11.8" r="1.2" fill="#fff" fill-opacity=".6"/><circle cx="10" cy="13.4" r="1.4" fill="'+acc+'"/>';
  return iaGlow(10,13,10,9,acc)+'<path d="M2 1 Q10 15 18 1" fill="none" stroke="'+IA_GOLD+'" stroke-width="1.4" stroke-dasharray="1.4 .7"/>'+
    '<g stroke="'+IA_GOLD+'" stroke-width="1">'+[0,1,2,3,4,5,6,7].map(i=>{ const a=i*Math.PI/4; return '<line x1="'+(10+Math.cos(a)*5.4).toFixed(1)+'" y1="'+(13.4+Math.sin(a)*5.4).toFixed(1)+'" x2="'+(10+Math.cos(a)*8).toFixed(1)+'" y2="'+(13.4+Math.sin(a)*8).toFixed(1)+'"/>'; }).join('')+'</g>'+
    '<circle cx="10" cy="13.4" r="5" fill="'+gc+'" stroke="'+IA_GOLD+'" stroke-width="1.6"/><path d="M10 10 L12 13.4 L10 16.8 L8 13.4 Z" fill="'+acc+'"/><circle cx="8.4" cy="11.6" r="1.1" fill="#fff" fill-opacity=".7"/>';
}
// the whole picture for one piece of gear, or null when it is not gear
function tierArtSvg(it){
  const st = it.slotType; if(!st) return null;
  const T = itemArtTier(it), acc = it.color || '#c9b6ff';
  let g = null;
  if(st==='helm') g = iaHelm(it, T, acc);
  else if(st==='armor') g = iaArmor(it, T, acc);
  else if(st==='weapon1h') g = iaSword1h(T, acc);
  else if(st==='weapon2h') g = iaSword2h(T, acc);
  else if(st==='bow') g = iaBow(T, acc);
  else if(st==='staff') g = iaStaff(it, T, acc);
  else if(st==='shield') g = iaShield(it, acc);
  else if(st==='gloves') g = iaGloves(it, T, acc);
  else if(st==='boots') g = iaBoots(it, T, acc);
  else if(st==='belt') g = iaBelt(it, T, acc);
  else if(st==='ring') g = iaRing(it, T, acc);
  else if(st==='amulet') g = iaAmulet(it, T, acc);
  if(!g) return null;
  const [w,h] = itemShape(it);
  return uniqSvgIds('<svg class="bagArt" viewBox="0 0 '+(w*20)+' '+(h*20)+'" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">'+g+'</svg>');
}
