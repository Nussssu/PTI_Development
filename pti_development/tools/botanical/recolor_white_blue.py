"""Recolour the concept flowers to the white + soft-blue palette (reference: white/blue bougainvillea concept page).

usage: python recolor_white_blue.py <in.webp> <out.webp>
lilac/purple petals -> white (kept shaded, faint green-white tint); periwinkle/blue petals -> soft sky blue.
Leaves, stems, yellow flower eyes and the alpha channel are left alone.
"""
import sys
import numpy as np
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
alpha = np.asarray(im)[..., 3]
hsv = np.asarray(im.convert('RGB').convert('HSV')).astype(np.float32) / 255.0
h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]

def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

petal = ss(0.52, 0.58, h) * (1 - ss(0.90, 0.95, h)) * ss(0.08, 0.2, s)      # blue..purple hues, clearly coloured
blue = 1 - ss(0.675, 0.72, h)                                               # periwinkle/blue stays blue, lilac goes white
# blue petals: soft sky blue, lighter
bh, bs, bv = np.full_like(h, 0.6), np.clip(s * 0.55 + 0.1, 0, 0.6), np.clip(0.22 + v * 0.8, 0, 1)
# white petals: keep (and deepen) the shading so each petal reads against the cream wall, neutral cool tint;
# the deepest purples become a pale lavender, like the few lilac sprays in the reference
lav = ss(0.79, 0.83, h)
wh = 0.6 * (1 - lav) + 0.72 * lav
ws = 0.045 * (1 - lav) + 0.16 * lav
wv = np.clip(0.36 + v * 0.66, 0, 1)
nh = bh * blue + wh * (1 - blue)
ns = bs * blue + ws * (1 - blue)
nv = bv * blue + wv * (1 - blue)
out = np.stack([h * (1 - petal) + nh * petal, s * (1 - petal) + ns * petal, v * (1 - petal) + nv * petal], -1)
rgb = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8), 'HSV').convert('RGB')
res = np.dstack([np.asarray(rgb), alpha])
Image.fromarray(res, 'RGBA').save(dst, quality=94, method=6)
print('saved', dst)
