#!/usr/bin/env python3
"""Renders the two long, dark, melancholy loops used for the overworld (d2world) and the towers (d2tower).
Pure numpy + ffmpeg. Usage: python3 scripts/make-music.py  -> writes www/audio/music/d2world.ogg and d2tower.ogg
Each track is exactly 2**23 samples at 44.1 kHz (about 190 s) and loops seamlessly (notes and the reverb wrap around)."""
import numpy as np, wave, subprocess, os, sys

SR = 44100
N = 2 ** 23
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www', 'audio', 'music')
TAU = 2 * np.pi


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def add(buf, start, sig, pan=0.0):
    """mix a mono signal into a stereo buffer at `start` seconds, wrapping around the end"""
    i0 = int(start * SR) % N
    n = len(sig)
    gl, gr = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
    idx = (i0 + np.arange(n)) % N
    buf[0][idx] += sig * gl
    buf[1][idx] += sig * gr


def env(n, a, d_tau, release=0.05):
    t = np.arange(n) / SR
    e = np.minimum(1.0, t / max(a, 1e-4)) * np.exp(-t / d_tau)
    r = int(release * SR)
    if r < n:
        e[-r:] *= np.linspace(1, 0, r)
    return e


def pad_note(m, dur, vol, rng, harm=7, att=None, det=(-9, 0, 7)):
    """slow, detuned, filtered-ish string/organ pad"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    att = att if att is not None else dur * 0.38
    e = np.minimum(1.0, t / att) * np.minimum(1.0, (dur - t) / (dur * 0.45))
    e = np.clip(e, 0, 1) ** 1.3
    out = np.zeros(n)
    for dt in det:
        f = mtof(m) * 2 ** (dt / 1200.0)
        ph = rng.uniform(0, TAU)
        for h in range(1, harm + 1):
            out += np.sin(TAU * f * h * t + ph * h) / (h ** 1.6)
    return out * e * vol / len(det)


def bell(m, dur, vol):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    out = np.zeros(n)
    for r, a, dc in ((1, 1.0, 1.0), (2.01, 0.35, 0.6), (2.76, 0.22, 0.4), (4.07, 0.1, 0.25), (5.43, 0.05, 0.15)):
        out += a * np.sin(TAU * f * r * t) * np.exp(-t / (dur * 0.33 * dc))
    out *= np.minimum(1.0, t / 0.004)
    return out * vol


def piano(m, dur, vol):
    """soft felt-piano-ish pluck"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    out = np.zeros(n)
    for h in range(1, 8):
        out += np.sin(TAU * f * h * (1 + 0.0003 * h * h) * t) * np.exp(-t * (1.1 + 0.9 * h) / (dur * 0.45)) / (h ** 1.25)
    out *= np.minimum(1.0, t / 0.006)
    return out * vol


def flute(m, dur, vol, rng):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    vib = 1 + 0.006 * np.sin(TAU * 4.6 * t) * np.minimum(1.0, t / 0.9)
    ph = np.cumsum(f * vib) / SR * TAU
    out = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    breath = rng.standard_normal(n) * 0.04
    e = np.minimum(1.0, t / (dur * 0.3)) * np.clip((dur - t) / (dur * 0.5), 0, 1)
    return (out + breath) * e * vol


def sub_drone(m, vol, lfo_hz, phase):
    t = np.arange(N) / SR
    f = mtof(m)
    swell = 0.62 + 0.38 * np.sin(TAU * lfo_hz * t + phase)
    out = np.sin(TAU * f * t) + 0.35 * np.sin(TAU * f * 2 * t + 0.4) + 0.12 * np.sin(TAU * f * 3 * t)
    return out * swell * vol


def fft_filter(x, kind, f0, f1=None, order=2.0):
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1.0 / SR)
    if kind == 'lp':
        g = 1.0 / (1.0 + (fr / f0) ** (2 * order))
    elif kind == 'hp':
        g = 1.0 - 1.0 / (1.0 + (fr / f0) ** (2 * order))
    else:
        g = np.exp(-0.5 * (np.log((fr + 1e-3) / f0) / f1) ** 2)
    return np.fft.irfft(X * g, len(x))


def reverb(buf, rt60, wet, damp_hz, seed):
    """circular FFT convolution with a synthetic decaying-noise impulse, so the loop wraps cleanly"""
    rng = np.random.default_rng(seed)
    n_ir = int(rt60 * 1.15 * SR)
    out = []
    for ch in range(2):
        t = np.arange(n_ir) / SR
        ir = rng.standard_normal(n_ir) * np.exp(-t * 6.9 / rt60)
        ir[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
        irp = np.zeros(N)
        irp[:n_ir] = ir
        irp = fft_filter(irp, 'lp', damp_hz, order=1.0)
        irp /= np.sqrt(np.sum(irp ** 2)) + 1e-9
        X = np.fft.rfft(buf[ch]) * np.fft.rfft(irp)
        out.append(np.fft.irfft(X, N))
    return [buf[0] * (1 - wet) + out[0] * wet * 1.0, buf[1] * (1 - wet) + out[1] * wet * 1.0]


def chord(root, kind):
    ints = {'m': (0, 3, 7), 'M': (0, 4, 7), 'm7': (0, 3, 7, 10), 'M7': (0, 4, 7, 11), 'sus': (0, 5, 7), 'm9': (0, 3, 7, 14), '5': (0, 7, 12), 'dim': (0, 3, 6), 'M9': (0, 4, 7, 14)}[kind]
    return [root + i for i in ints]


def render(name, bars, prog, root_midi, scale, seed, cfg):
    rng = np.random.default_rng(seed)
    bar = N / SR / bars
    buf = [np.zeros(N), np.zeros(N)]
    dry_drone = np.zeros(N)
    # --- sub drones (slow swells)
    d1 = sub_drone(root_midi - 24, cfg['drone'], 1.0 / (bar * 6.5), 0.0)
    d2 = sub_drone(root_midi - 17, cfg['drone'] * 0.55, 1.0 / (bar * 9.0), 2.1)
    dry_drone += d1 + d2
    # --- pads, one chord per bar following the progression (repeated)
    for b in range(bars):
        root, kind = prog[b % len(prog)]
        notes = chord(root, kind)
        t0 = b * bar - bar * 0.12
        dur = bar * 1.35
        lowvol = cfg['pad']
        for i, m in enumerate(notes):
            add(buf, t0, pad_note(m, dur, lowvol * (1.0 if i else 1.15), rng), pan=rng.uniform(-0.45, 0.45))
        add(buf, t0, pad_note(notes[0] - 12, dur, lowvol * 0.9, rng, harm=5), pan=0.0)
        # section 'breath': thin the pads every fifth section
    # --- tolls / bells
    for b in range(0, bars, cfg['toll_every']):
        root, kind = prog[b % len(prog)]
        add(buf, b * bar + 0.05, bell(root - 12 + (0 if (b // cfg['toll_every']) % 2 == 0 else 7), 9.0, cfg['toll']), pan=rng.uniform(-0.3, 0.3))
    # --- piano / bell motif: sparse, quiet arpeggio notes from each chord
    for b in range(bars):
        if (b % cfg['motif_every']) not in cfg['motif_bars']:
            continue
        root, kind = prog[b % len(prog)]
        notes = chord(root, kind)
        seq = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[1] + 24, notes[2] + 12, notes[0] + 24]
        pat = rng.choice(len(seq), size=cfg['motif_notes'], replace=False)
        for k, pi in enumerate(sorted(pat)):
            at = b * bar + (0.6 + k * (bar * 0.82 / cfg['motif_notes'])) + rng.uniform(-0.05, 0.05)
            fn = piano if cfg['instrument'] == 'piano' else bell
            add(buf, at, fn(seq[pi], 6.0, cfg['motif'] * rng.uniform(0.7, 1.0)), pan=rng.uniform(-0.55, 0.55))
    # --- melody (flute/cello-ish), long notes with rests
    pos = 0
    cur = cfg['melody_start']
    for b in range(bars):
        if not (b % 8 in cfg['melody_bars']):
            continue
        t0 = b * bar + 0.8
        for k in range(cfg['melody_notes']):
            step = int(rng.choice([-2, -1, -1, 0, 1, 1, 2]))
            cur = int(np.clip(cur + step, 0, len(scale) - 1))
            m = scale[cur]
            dur = rng.choice(cfg['melody_dur']) * bar / 4.0
            add(buf, t0, flute(m, dur, cfg['melody'], rng), pan=-0.1)
            t0 += dur * rng.uniform(0.85, 1.05) + rng.choice([0.0, bar * 0.25, bar * 0.5])
    # --- wind (slow filtered noise)
    wind = rng.standard_normal(N)
    wind = fft_filter(wind, 'bp', cfg['wind_hz'], 0.45)
    lfo = 0.55 + 0.45 * np.sin(TAU * np.arange(N) / SR / (bar * 5.0) + 1.0)
    wind = wind * lfo
    wind *= cfg['wind'] / (np.std(wind) + 1e-9)
    # --- combine: drones + wind dry in the middle, everything through reverb
    for ch in range(2):
        buf[ch] += dry_drone * 0.9 + wind * (0.8 if ch == 0 else 1.0)
    buf = [fft_filter(buf[0], 'lp', cfg['lp'], order=1.0), fft_filter(buf[1], 'lp', cfg['lp'], order=1.0)]
    buf = reverb(buf, cfg['rt60'], cfg['wet'], 3200, seed + 7)
    buf = [fft_filter(buf[0], 'hp', 28, order=2.0), fft_filter(buf[1], 'hp', 28, order=2.0)]
    y = np.stack(buf, 1)
    # --- loudness: match the existing tracks (about -15 dBFS RMS, like the other tracks) with a soft limiter
    rms = np.sqrt(np.mean(y ** 2))
    y *= (10 ** (cfg['target_db'] / 20.0)) / rms
    y = np.tanh(y * 1.1) / 1.1
    pk = np.max(np.abs(y))
    if pk > 0.95:
        y *= 0.95 / pk
    wav = os.path.join('/tmp', name + '.wav')
    with wave.open(wav, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((y * 32767).astype('<i2').tobytes())
    out = os.path.join(OUT, name + '.ogg')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', wav, '-c:a', 'libvorbis', '-q:a', '2', out], check=True)
    print(name, 'rms dBFS', round(20 * np.log10(np.sqrt(np.mean(y ** 2))), 1), 'peak', round(float(np.max(np.abs(y))), 2), 'seconds', round(N / SR, 1), 'bytes', os.path.getsize(out))


def minor_scale(root, octs=(-12, 0, 12), mode=(0, 2, 3, 5, 7, 8, 10)):
    return sorted(root + o + i for o in octs for i in mode)


# ---------- overworld: D minor, ~50 bpm, wistful and desolate ----------
D = 62
world_prog = [(D, 'm'), (D - 4, 'M7'), (D + 5, 'm'), (D, 'm'),  # Dm | Bbmaj7 | Gm | Dm
              (D - 4, 'M'), (D + 3, 'M'), (D + 5, 'm7'), (D + 7, 'sus')]  # Bb | F | Gm7 | Asus
if __name__ == '__main__':
    which = sys.argv[1:] or ['d2world', 'd2tower']
    if 'd2world' in which:
        render('d2world', 40, world_prog, D, minor_scale(D, octs=(0, 12)), 20261022, dict(
            drone=0.5, pad=0.33, toll=0.2, toll_every=8, motif=0.2, motif_every=4, motif_bars=(0, 2), motif_notes=3, instrument='piano',
            melody=0.2, melody_start=7, melody_notes=3, melody_dur=[2, 3, 4], melody_bars=(2, 3, 6, 7), wind=0.035, wind_hz=520,
            lp=2600, rt60=5.2, wet=0.55, target_db=-15.0))
    # ---------- towers: C# minor, ~45 bpm, cold, hollow and slow ----------
    C = 61
    tower_prog = [(C, 'm'), (C - 4, 'M7'), (C + 5, 'm9'), (C, '5'),  # C#m | Amaj7 | F#m9 | C#5
                  (C + 1, 'M'), (C - 2, 'm'), (C + 5, 'm'), (C + 8, 'sus')]  # D | Bm | F#m | G#sus (the flat second keeps it uneasy)
    if 'd2tower' in which:
        render('d2tower', 36, tower_prog, C, minor_scale(C, octs=(0, 12), mode=(0, 1, 3, 5, 7, 8, 10)), 20261023, dict(
            drone=0.62, pad=0.3, toll=0.32, toll_every=4, motif=0.17, motif_every=4, motif_bars=(1, 3), motif_notes=2, instrument='bell',
            melody=0.15, melody_start=6, melody_notes=2, melody_dur=[3, 4, 6], melody_bars=(3, 7), wind=0.03, wind_hz=380,
            lp=2000, rt60=6.5, wet=0.62, target_db=-15.0))
