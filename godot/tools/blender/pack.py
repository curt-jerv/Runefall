# Pack rendered frames into one webp sheet per animation (rows = 8 directions, cols = frames).
# Each animation is cropped to its own box (smaller sheets = less phone memory); meta gives each one's size and feet anchor.
import sys, glob, json
from PIL import Image, ImageFilter, ImageEnhance
SRC, OUT = sys.argv[1], sys.argv[2]
ANIMS = [('idle','Idle_Loop'),('run','Jog_Fwd_Loop'),('shoot','Pistol_Shoot'),('death','Death01'),('roll','Roll')]
FR = 192; AX, AY = FR/2, FR/2 + 0.78*0.8660254*FR/2.6   # pixel of the character's feet (blender origin)
def bright(im):
    a = im.getchannel('A'); rgb = ImageEnhance.Brightness(im.convert('RGB')).enhance(1.22); rgb = ImageEnhance.Contrast(rgb).enhance(1.06); rgb.putalpha(a); return rgb
def outline(im):
    # thin dark rim so the figure sits in the game's inked look
    a = im.getchannel('A'); grown = a.filter(ImageFilter.MaxFilter(3))
    ink = Image.new('RGBA', im.size, (12,9,6,0)); ink.putalpha(grown.point(lambda v: int(v*0.75)))
    ink.alpha_composite(im); return ink
meta = {'anims':{}}; total = 0
for key, name in ANIMS:
    n = len(glob.glob(f'{SRC}/{name}_d0_*.png'))
    if not n: continue
    rows = [[Image.open(f'{SRC}/{name}_d{d}_{k:02d}.png').convert('RGBA') for k in range(n)] for d in range(8)]
    box = [FR, FR, 0, 0]
    for row in rows:
        for im in row:
            b = im.getchannel('A').point(lambda a: 255 if a>8 else 0).getbbox()
            if b: box = [min(box[0],b[0]), min(box[1],b[1]), max(box[2],b[2]), max(box[3],b[3])]
    box = [max(0,box[0]-2), max(0,box[1]-2), min(FR,box[2]+2), min(FR,box[3]+2)]
    W, H = box[2]-box[0], box[3]-box[1]
    S = Image.new('RGBA', (W*n, H*8), (0,0,0,0))
    for d,row in enumerate(rows):
        for k,im in enumerate(row): S.alpha_composite(outline(bright(im.crop(box))), (k*W, d*H))
    S.save(f'{OUT}/{key}.webp', 'WEBP', quality=88, method=6)
    meta['anims'][key] = {'n':n, 'w':W, 'h':H, 'ax':round(AX-box[0],2), 'ay':round(AY-box[1],2)}
    total += W*n*H*8
json.dump(meta, open(f'{OUT}/meta.json','w')); print(meta, 'decoded MB', round(total*4/1e6,1))
