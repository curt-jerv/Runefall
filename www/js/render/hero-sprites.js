// v569: pre-rendered hero sprites (test). The Ranger is a Quaternius CC0 model (Modular Character Outfits - Fantasy,
// Universal Base Characters, Universal Animation Library) posed and lit in Blender, rendered from the game's 2:1 iso camera
// in 8 directions. Sheets live in assets/sprites/<cls>/<anim>.webp: one row per direction (row d faces world angle d*45deg),
// one column per frame; meta.json gives the frame size and the feet anchor. Settings > Graphics '3D Ranger (test)' turns it off.
const HERO_SPRITE_SCALE = 0.6;   // sprite pixels -> world units at p.r 16
const HERO_SPRITE_ANIMS = { idle:{fps:8, loop:true}, run:{period:0.66, loop:true}, shoot:{loop:false}, death:{dur:1.1, loop:false} };
const HERO_SPRITES = {};
function heroSpriteSet(cls){
  if(HERO_SPRITES[cls]!==undefined) return HERO_SPRITES[cls];
  const set = HERO_SPRITES[cls] = { meta:null, img:{}, ready:false };
  const base = 'assets/sprites/'+cls+'/';
  fetch(base+'meta.json').then(r=>r.ok ? r.json() : null).then(meta=>{
    if(!meta) return;
    set.meta = meta; let left = Object.keys(meta.anims).length;
    for(const k of Object.keys(meta.anims)){
      const im = new Image(); im.onload = ()=>{ if(--left===0) set.ready = true; }; im.src = base+k+'.webp'; set.img[k] = im;
    }
  }).catch(()=>{});
  return set;
}
function heroSpritesOn(cls){ return cls==='ranger' && !(typeof settings!=='undefined' && settings && settings.heroSprites===false); }
function heroSpriteDir(p){
  const f = p.facing || {x:0, y:1};
  return ((Math.round(Math.atan2(f.y||0, f.x||0)/(Math.PI/4)) % 8) + 8) % 8;
}
function heroSpriteFrame(p, meta){
  const g = game, n = meta.anims, clock = (g && g.clock) || 0;
  if(g && g.over && p===g.player){
    const now = performance.now()/1000;   // the world stops on the death screen, so this runs on real time
    if(p._sprDeathT0==null) p._sprDeathT0 = now;
    const k = Math.min(1, (now - p._sprDeathT0)/HERO_SPRITE_ANIMS.death.dur);
    return ['death', Math.min(n.death-1, Math.floor(k*n.death))];
  }
  p._sprDeathT0 = null;
  const atk = Math.max(p.atkAnimT||0, p.castAnimT||0);
  if(atk>0){
    const mx = Math.max(0.05, (p.atkAnimT>0 ? p.atkAnimMax : 0.3) || 0.3);
    return ['shoot', Math.min(n.shoot-1, Math.floor(clamp(1 - atk/mx, 0, 0.999)*n.shoot))];
  }
  if(p.moving || p.dodging) return ['run', Math.floor(((p.animT||0) % HERO_SPRITE_ANIMS.run.period)/HERO_SPRITE_ANIMS.run.period*n.run) % n.run];
  return ['idle', Math.floor(clock*HERO_SPRITE_ANIMS.idle.fps) % n.idle];
}
// draws the hero from its sheet; false when the sprites are off or not loaded yet (the drawn rig is used then)
function heroSpriteDraw(p){
  if(!heroSpritesOn(p.cls) || !game) return false;
  if(p!==game.player && Object.getPrototypeOf(p)!==game.player) return false;   // the player and its Mirage only
  const set = heroSpriteSet(p.cls);
  if(!set.ready) return false;
  const m = set.meta, [anim, fr] = heroSpriteFrame(p, m), im = set.img[anim], d = heroSpriteDir(p);
  const iso = toIso(p.x, p.y), k = HERO_SPRITE_SCALE*(p.r||16)/16;
  let alpha = 1;
  if(p.dodging) alpha = 0.5; else if(p.hitFlash>0) alpha = 0.55+Math.sin(p.hitFlash*40)*0.2; else if(p.vanishT>0) alpha = 0.3;
  if(p.mirageAlpha) alpha = p.mirageAlpha;
  if(anim!=='death') drawShadow(iso.x, iso.y, 15*k/HERO_SPRITE_SCALE, 7*k/HERO_SPRITE_SCALE);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.drawImage(im, fr*m.w, d*m.h, m.w, m.h, iso.x - m.ax*k, iso.y - m.ay*k, m.w*k, m.h*k);
  ctx.restore();
  return true;
}
const _drawRangerRig = drawRanger;
drawRanger = function(p){ if(heroSpriteDraw(p)) return; _drawRangerRig(p); };
