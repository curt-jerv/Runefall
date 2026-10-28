// Export the HTML game's design data to JSON for the Godot rebuild.
// Run from the Runefall repo root:  (cd www && http-server -p 8090 &)  then  node godot/tools/export-data.js godot/data
// Needs Playwright + Chromium. Every table is read from the running game, so the numbers are exactly what the HTML version plays with.
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PW || 'playwright');
const OUT = process.argv[2] || 'godot/data';
(async()=>{
  const b = await chromium.launch(process.env.CHROME ? {executablePath:process.env.CHROME} : {});
  const pg = await b.newPage(); const errs = []; pg.on('pageerror', e=>errs.push(String(e)));
  await pg.goto('http://localhost:8090/index.html'); await pg.waitForFunction(()=>window.__test && window.__test.getGame, null, {timeout:20000});
  const src = {};
  for(const f of fs.readdirSync('www/js', {recursive:true})) if(String(f).endsWith('.js')) src[f] = fs.readFileSync(path.join('www/js', String(f)), 'utf8');
  const allSrc = Object.values(src).join('\n');
  const numConsts = [...new Set([...allSrc.matchAll(/^(?:const|let) ([A-Z][A-Z0-9_]{2,})\s*=\s*-?[0-9.]+\s*[;,]/gm)].map(m=>m[1]))];
  const monTypes = [...new Set([...src['core/game-state.js'].matchAll(/type===?'([a-zA-Z_]+)'/g)].map(m=>m[1]))];
  const data = await pg.evaluate(({numConsts, monTypes})=>{
    const G = (n)=>{ try{ return (0,eval)(n); }catch(e){ return undefined; } };   // global lexical lookup
    // plain-data copy: functions become their source text, DOM/cycles are dropped
    const plain = (v, depth=0, seen=new WeakSet())=>{
      if(v==null || typeof v==='number' || typeof v==='string' || typeof v==='boolean') return v;
      if(typeof v==='function') return {__fn: String(v).slice(0, 600)};
      if(depth>8 || typeof v!=='object' || seen.has(v) || (typeof Node!=='undefined' && v instanceof Node)) return null;
      seen.add(v);
      if(Array.isArray(v)) return v.map(x=>plain(x, depth+1, seen));
      const o = {}; for(const k of Object.keys(v)) o[k] = plain(v[k], depth+1, seen); return o;
    };
    const pick = (names)=>{ const o = {}; for(const n of names){ const v = G(n); if(v!==undefined) o[n] = plain(v); } return o; };
    const out = {};
    // ---------- numbers & formulas ----------
    const consts = {}; for(const n of numConsts){ const v = G(n); if(typeof v==='number') consts[n] = v; }
    const L = [...Array(80)].map((_,i)=>i+1);
    out.progression = { constants: consts,
      xp_for_level: L.map(l=>G('xpForLevel')(l)),
      par_life: L.map(l=>G('parLife')(l)), par_hit: L.map(l=>Math.round(G('parHit')(l)*10)/10),
      monster_std_life: L.map(l=>Math.round(G('monStdLife')(l))), monster_std_damage: L.map(l=>Math.round(G('monStdDmg')(l)*10)/10),
      attr_main_at_level: L.map(l=>G('attrMainAtLevel')(l)),
      formulas: Object.fromEntries(['xpForLevel','parLife','parHit','monStdLife','monStdDmg','monsterLevel','hitLevelFactor','attrBase','attrMainAtLevel','itemAttrReq','resCost','recalcStats','playerDamage','evasionChance','dexEvasionTapered','dexEvasionPct','manaShieldSoak','stormWardChance','manaShieldPct','xpForKill'].map(n=>[n, G(n) ? String(G(n)).slice(0, 4000) : null]).filter(e=>e[1])) };
    // ---------- skills ----------
    const trees = Object.assign({}, G('SKILL_TREES')||{}, G('RANGER_SKILL_TREES')||{}, G('MYSTIC_SKILL_TREES')||{});
    const tips = G('SKILL_TIPS')||{}, tipsEval = {};
    for(const id of Object.keys(tips)){ const t = tips[id], e = {};
      for(const k of ['desc','fx','per','x','cost']) if(t[k]!=null) e[k] = typeof t[k]==='function' ? '(computed)' : t[k];
      if(t.cd) e.cooldown_by_rank = L.slice(0,10).map(r=>{ try{ return typeof t.cd==='function' ? t.cd(r) : t.cd; }catch(x){ return null; } });
      if(t.stats) e.stats = t.stats.map(([lab, f])=>({label:lab, by_rank: L.slice(0,10).map(r=>{ try{ return f(r); }catch(x){ return null; } })}));
      tipsEval[id] = e; }
    const resCost = G('resCost'), costs = {};
    if(resCost){ const p = {cls:'mystic', level:30, skills:{}}; for(const id of Object.keys(G('RESOURCE_SKILLS')||{})){ costs[id] = L.slice(0,10).map(r=>{ try{ p.skills[id]=r; return Math.round(resCost(p, id)*10)/10; }catch(x){ return null; } }); } }
    const wd = G('SKILL_WD')||{}, wdRank = {};
    for(const id of Object.keys(wd)){ try{ wdRank[id] = L.slice(0,10).map(r=>G('swd')(id, r)); }catch(e){} }
    out.skills = Object.assign({ trees: plain(trees), tips: tipsEval, resource_cost_by_rank: costs, weapon_damage_pct_by_rank: wdRank },
      pick(['SKILL_WD','SKILL_WD_TUNE','RESOURCE_SKILLS','SKILL_ROW_LEVEL_REQ','CAST_FX_SKILLS','STAFF_SPELL_INFO','SKILL_TREE_CLASS_GROUP','RESOURCE_NAME','EVASION_SKILL_PCT','IRON_SKIN_DEFENSE_PCT_BY_RANK','IRON_SKIN_DR_BY_RANK','IRON_SKIN_RESIST_BY_RANK','MASTERY_LEVEL_REQ','FOLLOWER_FORMATION_ANGLES']));
    // ---------- items ----------
    out.items = pick(['ITEM_CATEGORIES','ITEM_CAT_WEIGHT','ITEM_BASE_NAME','ITEM_SHAPE','ITEM_TIER_BASE_RANGE','ITEM_TIER_LEVEL_BRACKETS','ITEM_TIER_MULT','ITEM_TIER_ROLL_RANGE','ARMOR_BASE_NAMES','ARMOR_MATERIALS','ARMOR_MATERIAL_WEIGHT','ARMOR_SLOT_WEIGHT','ARMOR_TIER_NAME','ARMOR_AFFIX_KEYS','ARMOR_ACCESS_MATRIX','MATERIAL_ARMOR_BASE','MATERIAL_BASE_NAME','MATERIAL_CLASS_NAME','MATERIAL_FOR_CLASS','MATERIAL_WEIGHT_CLASS','BOW_TIER_NAME','BELT_TIER_NAME','SHIELD_TIER_NAME','RING_VARIANTS','AMULET_VARIANTS','BELT_VARIANTS','RARITY','RARITY_ARMOR_MULT','RARE_ADJ','RARE_NOUN','RARE_MOD_COUNT_BY_TIER','RARE_STAT_CAP_BY_TIER','EQUIP_AFFIXES','EQUIP_SLOTS','AFFIX_WEIGHT','AFFIX_FAMILY','AFFIX_GROUP_ORDER','FAMILY_CAP','PCT_AFFIX_ROLL','FLAT_DMG_KEYS','FLAT_ELEM_WEAPON','IMPLICIT_BY_CAT','IMPLICIT_FORMULA','FIXED_IMPLICIT_KEY','INNATE_STAT','MOD_TIER_REQ','BASE_BRACKETS','BASE_REQ_BY_BRACKET','BASE_REQ_BY_TIER','BASE_TYPE_NAMES','ATTR_KEYS','ATTR_NAME','ATTR_MAT_PREF','CLASS_MAIN_ATTR','REQ_ATTR_BY_MATERIAL','REQ_ATTR_BY_SLOT','POTION_DEFS','POTION_KINDS','PART_DEFS','PART_DROPS','PART_CHANCE','PART_TIER_PCT','SIG_DROPS','SIG_CHANCE','RUNE_NAMES','RUNE_IDS','RECIPE_BY_KEY','GAMBLER_CATEGORIES','SELL_BASE','SELL2_BASE','MF_GF_SLOTS','BOOT_MS_RANGE','MOVE_SPEED_TIER_MAX','DMG_TYPE_COLOR']);
    // a few hundred real rolled items so the Godot loot code can be checked against the HTML game
    const samples = [];
    const mk = G('makeItem') || G('rollItem') || G('generateItem');
    if(mk){ for(const lvl of [5,15,30,45,60]) for(let i=0;i<60;i++){ try{ const it = mk(lvl); if(it) samples.push(plain(it)); }catch(e){ break; } } }
    out.items.sample_rolls = samples;
    // ---------- monsters ----------
    window.__test.startGame(null, 'warrior'); if(window.__enter && window.__enter.enterForest) window.__enter.enterForest();
    const g = window.__test.getGame(), spawn = G('spawnEnemy'), mons = {};
    for(const lv of [10, 30, 60]){
      for(const t of monTypes){
        try{
          g.depth = lv; g.player.level = lv; g.enemies.length = 0;
          spawn(g, t, {x:400, y:400});
          const e = g.enemies[g.enemies.length-1]; if(!e || e.type!==t) continue;
          const m = mons[t] = mons[t] || {type:t, by_level:{}};
          m.by_level[lv] = {life:Math.round(e.maxHp), damage:Math.round((e.dmg||0)*10)/10, speed:Math.round(e.speed||0), radius:e.r, attack_cd:e.atkCdMax, armor:e.armor||0,
            ranged:!!(e.ranged||e.archer||e.caster), dmg_type:e.dmgType||null, dmg_split:e.dmgSplit||null, boss:!!e.boss, elite:!!e.elite, xp:e.xp||null, name:e.name||null};
        }catch(err){}
      }
    }
    out.monsters = Object.assign({ types: mons }, pick(['ENEMY_DMG_TYPE','ENEMY_DMG_SPLIT','ENEMY_RESIST_TYPES','ELITE_PRE','ELITE_MID','ELITE_TITLE','DENSIFY_TUNE','FOREST_ENEMY_TYPES','FOREST_PACK_TEMPLATES','LAKE_PACK_TEMPLATES','CEM_PACK_TEMPLATES','MOUNTAIN_PASS_PACK_TEMPLATES','RV_NORTH_PACKS','RV_SOUTH_PACKS','ICY_PACKS','FH_PACKS','RR_PACKS','BR_PACKS','BR_THEME_PACKS','BR_TIER_PACKS','BR_BOSS','BR_BOSS_NAME','BR_BOSS_POOL','KP_TYPES','CLF_TYPES','CLF_PACK','RUINS_MONSTERS_BY_FLOOR','MORALE_TYPES','PROT_NAME','PROT_HP_MULT','HEART_DEF','MST_AVA_PHASES','FHT_CHAMP_MODS','HUNTER_NAMES','HUNT_TROPHY']));
    // ---------- world ----------
    out.world = pick(['ROAD_EV_ZONES','ROAD_EV_LABELS','OW_POI_ZONES','OW_SHRINES','ICY_ZONE_DEFS','KP_NAMES','KP_LORE','DEEP_NAMES','RRT_NAMES','RRT_CLUES','BR_THEME_LIST','BR_THEME_KINDS','SCENE_MOOD','MOOD_PROFILES','SECTION_SCENES','OUTSIDE_SIDES','INTERACT_LABELS','FHD_INFO','HIDDEN_SECRETS_DESC','RV227_TEXT','RV266_TEXT','RV267_TEXT','RV268_TEXT','RV269_TEXT','RV454_TEXT','TOWN_TIPS','WM_EDGES','WM_NODES','WM_REGIONS','WAYPOINTS','WAYPOINT_LIST']);
    // every zone the game can enter: its scene id, monster level (depth), size and shown name
    const zones = []; const ent = window.__enter || {};
    for(const fn of Object.keys(ent)){
      try{ g.enemies.length = 0; ent[fn](); const r = g.room || {};
        const nameEl = document.getElementById('regionName') || document.querySelector('#topWrap .regionName');
        zones.push({enter:fn, scene:g.scene, subzone:g.subzone||null, level:g.depth, w:r.w, h:r.h, monsters:g.enemies.length, name:(nameEl && nameEl.textContent) || null});
      }catch(e){ zones.push({enter:fn, error:String(e).slice(0,120)}); }
    }
    out.world.zones = zones;
    out.quests = pick(['QUEST_BRIDGE','QUEST_COLOSSUS','QUEST_FIND_HUNTERS','QUEST_GRAVEROBBERS','QUEST_HAMMER','QUEST_HIDDEN_SECRETS','QUEST_KRAKEN','QUEST_LEVIATHAN','QUEST_LIGHT_THE_WAY','QUEST_MASTODON','QUEST_MINOTAUR','QUEST_WRAITH','HUNTER_QUESTS','HUNTER_RESCUE_HINT','BOSS_RECIPE_BOSSES']);
    out.audio = pick(['SND_BANK','SND_BANK2','MUS_BANK','VOICE_BANK','MUS_VOL','SKILL_SND','SFX_TH']);
    return out;
  }, {numConsts, monTypes});
  fs.mkdirSync(OUT, {recursive:true});
  for(const [k, v] of Object.entries(data)) fs.writeFileSync(path.join(OUT, k+'.json'), JSON.stringify(v, null, 1));
  console.log(Object.entries(data).map(([k,v])=>k+':'+JSON.stringify(v).length).join(' '), 'monster types', Object.keys(data.monsters.types).length, '/', monTypes.length, 'errors', errs.slice(0,3));
  await b.close();
})();
