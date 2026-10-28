"""Respawn sound for Runefall (made for the game, no outside licence).
A distant, low bell toll with a dark swell rising under it and a soft breath back into the world.
Pure numpy + ffmpeg.  python3 scripts/make-respawn.py  ->  www/audio/sfx/respawn_toll.ogg
"""
import numpy as np, wave, subprocess, os
SR = 44100
DUR = 3.2
n = int(SR*DUR); t = np.arange(n)/SR
rng = np.random.default_rng(7)
out = np.zeros((n, 2))

def bell(f0, start, amp, tau):
    # inharmonic church-bell partials (hum, prime, tierce, quint, nominal...)
    parts = [(0.5, 1.0, 1.6), (1.0, 0.8, 1.0), (1.183, 0.55, 0.8), (1.506, 0.35, 0.6), (2.0, 0.45, 0.55),
             (2.514, 0.22, 0.4), (2.662, 0.18, 0.35), (3.011, 0.15, 0.3), (4.166, 0.08, 0.2)]
    s = np.zeros(n); i0 = int(start*SR); tt = t[i0:] - start
    for ratio, a, d in parts:
        f = f0*ratio
        beat = 1 + 0.004*np.sin(2*np.pi*0.7*tt*ratio)          # slight shimmer between the bell's two sides
        s[i0:] += a*np.sin(2*np.pi*f*tt*beat) * np.exp(-tt/(tau*d))
    strike = np.exp(-tt/0.01) * rng.standard_normal(len(tt)) * 0.15   # the clapper's thud
    s[i0:] += strike
    return s*amp

# the toll: a low G (G3, so phone speakers still carry it), heard from far away; a fainter octave above for the ring
b = bell(196.0, 0.25, 0.55, 2.4) + bell(392.0, 0.25, 0.25, 1.2)
# dark swell: two low detuned saws filtered, rising in, a minor third apart
sw = np.zeros(n)
for f, a in [(98.0, 0.5), (98.6, 0.4), (116.5, 0.3)]:   # G2 with a minor third: dark, still audible on a phone
    ph = (f*t) % 1.0
    sw += a*(2*ph - 1)
k = np.exp(-np.linspace(0, 6, 400)); k /= k.sum()
sw = np.convolve(sw, k, mode='same')                           # soften the saws into a drone
sw *= np.clip(t/1.4, 0, 1)**2 * np.exp(-np.clip(t-1.6, 0, None)/0.9)
# breath back into the world: band-limited noise swelling then fading
br = rng.standard_normal(n)
br = np.convolve(br, np.ones(60)/60, mode='same') - np.convolve(br, np.ones(600)/600, mode='same')
br *= 0.5*np.exp(-((t-1.05)/0.45)**2)
mono = b + 0.35*sw + 0.25*br
# simple distance: low-pass + a cheap stereo hall (a few delayed, darker echoes)
lp = np.convolve(mono, np.ones(6)/6, mode='same')
for ch, offs in enumerate([(0.043, 0.071, 0.113, 0.167), (0.051, 0.083, 0.127, 0.181)]):
    wet = np.zeros(n)
    for j, d in enumerate(offs):
        di = int(d*SR); g = 0.32*(0.72**j)
        wet[di:] += g*np.convolve(lp, np.ones(12)/12, mode='same')[:n-di]
    out[:, ch] = lp + wet
fade = np.clip((DUR - t)/0.5, 0, 1); out *= fade[:, None]
out /= np.max(np.abs(out)) * 1.12
pcm = (out*32767).astype(np.int16)
os.makedirs('www/audio/sfx', exist_ok=True)
tmp = '/tmp/respawn_toll.wav'
with wave.open(tmp, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5', '-c:a', 'libvorbis', '-q:a', '5', 'www/audio/sfx/respawn_toll.ogg'], check=True)
print('wrote www/audio/sfx/respawn_toll.ogg', os.path.getsize('www/audio/sfx/respawn_toll.ogg'))
