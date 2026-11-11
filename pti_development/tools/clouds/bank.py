"""
Procedural renderer for the drifting cloud banks in the Home page cloud passage.

Each bank is a horizontally seamless strip: solid white along the top (it melts into the cream page
above), breaking up lower down into torn, wispy clumps that hang over the sky, with holes of blue
showing through. Density is domain-warped fBm made with FFT noise (periodic, so the strip tiles with
no seam); shading is a soft optical-depth march toward the sun, so thick folds go blue-grey and thin
wisps glow white.

    python tools/clouds/bank.py            # all banks
    python tools/clouds/bank.py 0          # just the first

Output: public/images/clouds/bank-<n>.webp
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, map_coordinates, shift as nd_shift

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'images', 'clouds')


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def spectral(rng, H, W, beta, fmin=1.0):
    """periodic 1/f^beta noise (tiles in both axes), zero mean, unit std"""
    fy = np.fft.fftfreq(H)[:, None] * H
    fx = np.fft.rfftfreq(W)[None, :] * W
    f = np.sqrt(fx ** 2 + (fy * W / H) ** 2)
    f[0, 0] = 1
    amp = 1 / np.maximum(f, fmin) ** (beta / 2 + 0.5)
    amp[0, 0] = 0
    ph = rng.standard_normal((H, W // 2 + 1)) + 1j * rng.standard_normal((H, W // 2 + 1))
    n = np.fft.irfft2(ph * amp, s=(H, W)).astype(np.float32)
    return (n - n.mean()) / n.std()


def bank(seed, W=3200, H=1100, reach=0.62, holes=1.0):
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    v = yy / H

    # domain warp: streaky, torn shapes instead of round blobs
    wx = spectral(rng, H, W, 2.6, 2) * 60
    wy = spectral(rng, H, W, 2.6, 2) * 40
    base_n = spectral(rng, H, W, 2.1, 2)
    n = map_coordinates(base_n, [yy + wy, xx + wx], order=1, mode='grid-wrap')
    fine = spectral(rng, H, W, 1.2, 20)
    fine = map_coordinates(fine, [yy + wy * 0.5, xx + wx * 0.5], order=1, mode='grid-wrap')

    # how far the bank hangs down varies along x: big clumps reaching low, gaps staying high
    col = spectral(rng, 64, W, 3.2, 2)[0]
    col = (col - col.min()) / (col.max() - col.min())
    hang = reach * (0.55 + 0.6 * col)[None, :]
    body = smooth(hang + 0.12, hang - 0.42, v)          # 1 at the top, 0 below the hanging edge

    D = body * 1.3 + n * 0.40 * holes + fine * 0.09 * smooth(0.0, 0.5, body) - 0.6
    D += smooth(0.35, 0.0, v) * 0.9                      # always solid along the very top
    D = np.clip(D, 0, None)
    D *= smooth(0.04, 0.22, gaussian_filter(D, 14, mode=['nearest', 'wrap']))   # drop stray specks: only clumps survive
    D *= smooth(0.99, 0.86, v)                                         # nothing reaches the strip's bottom edge
    D = gaussian_filter(D, 0.9, mode=['nearest', 'wrap'])

    alpha = 1 - np.exp(-D * 4.2)

    # light from the upper left: optical depth marched toward the sun on a half-res grid
    s = 2
    Ds = D[::s, ::s]
    tau = np.zeros_like(Ds)
    for k in range(1, 33):
        tau += nd_shift(Ds, (k * 4.5, k * 2.2), order=1, mode='grid-wrap')
    tau = np.kron(tau, np.ones((s, s), np.float32))[:H, :W] * 4.5 / s
    tau = gaussian_filter(tau, 5, mode=['nearest', 'wrap'])
    sun = np.exp(-tau * 0.02)
    thick = gaussian_filter(D, 14, mode=['nearest', 'wrap'])
    light = 0.36 + 0.64 * sun - 0.10 * np.clip(thick - 0.8, 0, 1)
    light += smooth(0.6, 0.0, D) * 0.18                    # thin wisps glow
    light = np.clip(light + smooth(0.3, 0.0, v) * 0.25, 0, 1)  # top stays bright, meets the cream page

    white = np.array([1.0, 0.995, 0.985], np.float32)
    shade = np.array([0.66, 0.73, 0.82], np.float32)
    t = light[..., None] ** 1.3
    col_rgb = shade + (white - shade) * t

    rgba = np.dstack([np.clip(col_rgb, 0, 1), np.clip(alpha, 0, 1)])
    return Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA')


VARIANTS = [
    (5, 0.70, 1.0),     # mid
    (17, 0.62, 1.1),    # front: more torn
    (41, 0.78, 0.95),   # back: deepest, most solid
]

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    only = [int(a) for a in sys.argv[1:]] or range(len(VARIANTS))
    for i in only:
        seed, reach, holes = VARIANTS[i]
        img = bank(seed, reach=reach, holes=holes)
        img = img.resize((2400, int(img.height * 2400 / img.width)), Image.LANCZOS)
        p = os.path.join(OUT, f'bank-{i + 1}.webp')
        img.save(p, 'WEBP', quality=88, method=6)
        print(p, img.size)
