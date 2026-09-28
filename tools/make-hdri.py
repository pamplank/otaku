#!/usr/bin/env python3
"""Generate the two equirectangular HDRIs the installations use for image-based
lighting and reflections: a bright, even mall / hotel-lobby interior (day) and a
warmer, dimmer one with downlights and shopfront glow (night). Written as
Radiance RGBE (.hdr) into public/assets/env/. No external downloads.
Run: python3 tools/make-hdri.py"""
import math, struct, os

W, H = 512, 256
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'env')


def rgbe(r, g, b):
    v = max(r, g, b)
    if v < 1e-32:
        return b'\0\0\0\0'
    m, e = math.frexp(v)
    s = m * 256.0 / v
    return bytes((int(r * s), int(g * s), int(b * s), e + 128))


def smooth(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def lobby(night):
    rows = []
    for j in range(H):
        el = math.pi / 2 - (j + 0.5) / H * math.pi          # elevation, +up
        row = bytearray()
        for i in range(W):
            az = (i + 0.5) / W * 2 * math.pi                 # azimuth
            d = (math.cos(el) * math.sin(az), math.sin(el), math.cos(el) * math.cos(az))
            if night:
                ceil = (0.10, 0.08, 0.06); wall = (0.13, 0.10, 0.08); floor = (0.05, 0.045, 0.04)
            else:
                ceil = (1.25, 1.22, 1.18); wall = (0.85, 0.80, 0.72); floor = (0.40, 0.38, 0.35)
            # base: floor → walls → ceiling
            if el < 0:
                t = smooth(-0.35, 0.0, el)
                c = [floor[k] + (wall[k] * 0.6 - floor[k]) * t for k in range(3)]
            else:
                t = smooth(0.12, 0.55, el)
                c = [wall[k] + (ceil[k] - wall[k]) * t for k in range(3)]
            if el > 0.35:
                # ceiling light panels (day) / downlights (night) on a grid, seen in perspective
                px, pz = d[0] / d[1], d[2] / d[1]
                gx, gz = (px * 1.6) % 1.0, (pz * 1.6) % 1.0
                if night:
                    r = math.hypot(gx - 0.5, gz - 0.5)
                    if r < 0.11:
                        k = 28.0 * (1 - r / 0.11) ** 0.5
                        c = [c[0] + k, c[1] + k * 0.78, c[2] + k * 0.52]
                else:
                    if abs(gx - 0.5) < 0.30 and abs(gz - 0.5) < 0.12:
                        c = [c[0] + 9.0, c[1] + 9.2, c[2] + 9.5]
            if not night and el > 1.25:
                c = [c[0] + 5.0, c[1] + 5.3, c[2] + 5.8]      # central skylight
            if 0.05 < el < 0.42:
                # glazing / shopfront band around the room
                band = (math.sin(az * 6) > 0.15)
                if band:
                    if night:
                        hue = int(az / (2 * math.pi) * 6) % 3
                        glow = [(2.2, 1.5, 0.9), (2.0, 0.9, 1.4), (0.9, 1.7, 1.9)][hue]
                        c = [c[k] + glow[k] * 0.9 for k in range(3)]
                    else:
                        c = [c[0] + 3.2, c[1] + 3.5, c[2] + 4.0]
            row += b''.join(rgbe(*c) for _ in [0])
        rows.append(bytes(row))
    return rows


def write(name, rows):
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, name), 'wb') as f:
        f.write(b'#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n')
        f.write(f'-Y {H} +X {W}\n'.encode())
        for r in rows:
            f.write(r)


if __name__ == '__main__':
    write('lobby-day.hdr', lobby(False))
    write('lobby-night.hdr', lobby(True))
    print('wrote', OUT)
