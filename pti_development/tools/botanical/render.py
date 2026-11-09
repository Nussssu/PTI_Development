"""
Procedural renderer for PTI's original botanical artwork:
Krishnachura (Delonix regia, the flame tree of Dhaka) blossoms, buds,
feathery bipinnate leaves and woody branches, rendered as high-resolution
transparent PNG/WebP sprites for the landing page.

    python tools/botanical/render.py            # renders everything
    python tools/botanical/render.py preview    # quick single flower test

Output: public/images/botanical/
"""
import math
import os
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'images', 'botanical')
LIGHT = math.radians(-135)  # light from the top-left


def hexc(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def mix(a, b, t):
    t = np.asarray(t, np.float32)[..., None]
    return a * (1 - t) + b * t


class Canvas:
    """Premultiplied RGBA float canvas with a world offset."""

    def __init__(self, w, h, ox=0, oy=0):
        self.w, self.h, self.ox, self.oy = int(w), int(h), int(ox), int(oy)
        self.rgb = np.zeros((self.h, self.w, 3), np.float32)
        self.a = np.zeros((self.h, self.w), np.float32)

    def region(self, x0, y0, w, h):
        x0, y0, w, h = int(round(x0)), int(round(y0)), int(w), int(h)
        lx, ly = x0 - self.ox, y0 - self.oy
        sx0, sy0 = max(0, -lx), max(0, -ly)
        dx0, dy0 = max(0, lx), max(0, ly)
        cw = min(w - sx0, self.w - dx0)
        ch = min(h - sy0, self.h - dy0)
        if cw <= 0 or ch <= 0:
            return None
        return (slice(sy0, sy0 + ch), slice(sx0, sx0 + cw)), (slice(dy0, dy0 + ch), slice(dx0, dx0 + cw))

    def put(self, x0, y0, rgb, a):
        """Composite straight-colour rgb with coverage a at world (x0, y0)."""
        r = self.region(x0, y0, a.shape[1], a.shape[0])
        if r is None:
            return
        s, d = r
        aa = a[s][..., None]
        self.rgb[d] = rgb[s] * aa + self.rgb[d] * (1 - aa)
        self.a[d] = a[s] + self.a[d] * (1 - a[s])

    def shade(self, x0, y0, a, strength=0.35, blur=4, dx=5, dy=7):
        """Darken existing content with a soft shadow of coverage a."""
        pad = int(blur * 3)
        sa = np.pad(a, pad)
        sa = gaussian_filter(sa, blur) * strength
        r = self.region(x0 - pad + dx, y0 - pad + dy, sa.shape[1], sa.shape[0])
        if r is None:
            return
        s, d = r
        self.rgb[d] *= (1 - sa[s])[..., None]

    def composite(self, other, shadow=None):
        if shadow:
            self.shade(other.ox, other.oy, other.a, **shadow)
        r = self.region(other.ox, other.oy, other.w, other.h)
        if r is None:
            return
        s, d = r
        oa = other.a[s]
        self.rgb[d] = other.rgb[s] + self.rgb[d] * (1 - oa[..., None])
        self.a[d] = oa + self.a[d] * (1 - oa)

    def image(self):
        a = np.clip(self.a, 0, 1)
        rgb = np.where(a[..., None] > 1e-4, self.rgb / np.maximum(a[..., None], 1e-4), 0)
        arr = np.dstack([np.clip(rgb, 0, 1), a])
        return Image.fromarray((arr * 255 + 0.5).astype(np.uint8), 'RGBA')


class Noise:
    def __init__(self, rng, size=512):
        n = rng.standard_normal((size, size)).astype(np.float32)
        self.f = gaussian_filter(n, 2.2, mode='wrap')
        self.f /= np.abs(self.f).max()
        self.c = gaussian_filter(n, 9, mode='wrap')
        self.c /= np.abs(self.c).max()
        self.size = size

    def at(self, X, Y, coarse=False):
        f = self.c if coarse else self.f
        return f[(Y.astype(np.int32)) % self.size, (X.astype(np.int32)) % self.size]


# ---------------------------------------------------------------- primitives
def grid(cx, cy, R):
    x0, y0 = int(math.floor(cx - R)), int(math.floor(cy - R))
    n = int(2 * R) + 2
    X, Y = np.meshgrid(np.arange(x0, x0 + n) + 0.5, np.arange(y0, y0 + n) + 0.5)
    return x0, y0, X, Y


PALETTE = {
    'red_base': hexc('#F6A53A'), 'red_mid': hexc('#E8361F'), 'red': hexc('#D6231B'),
    'red_deep': hexc('#9E1016'), 'cream': hexc('#FBF0D6'), 'cream_y': hexc('#F5D46A'),
    'leaf_hi': hexc('#9CC255'), 'leaf': hexc('#5E9634'), 'leaf_lo': hexc('#2F5F22'),
    'leaf_y': hexc('#C7C35A'), 'bark_hi': hexc('#8A6A52'), 'bark': hexc('#5A4232'), 'bark_lo': hexc('#33241B'),
    'sepal': hexc('#7E8F3A'), 'sepal_r': hexc('#B03A22'), 'anther': hexc('#6E3A1E'),
}


def petal(cv, nz, rng, cx, cy, ang, L, W, kind='red', fore=1.0, curl=0.0):
    """Spoon-shaped Delonix petal: narrow claw, broad ruffled blade."""
    x0, y0, X, Y = grid(cx, cy, L * 1.08 + 4)
    dx, dy = X - cx, Y - cy
    u = (dx * math.cos(ang) + dy * math.sin(ang)) / fore
    v = -dx * math.sin(ang) + dy * math.cos(ang)
    t = u / L
    blade = np.sqrt(np.clip(1 - ((t - 0.6) / 0.42) ** 2, 0, 1))
    w = W * (0.07 + 0.93 * smooth(0.12, 0.6, t)) * blade
    a2 = np.arctan2(v, (t - 0.55) * L + 1e-3)
    ph = rng.uniform(0, 6.28, 3)
    ruff = 1 + smooth(0.35, 0.75, t) * (0.055 * np.sin(7 * a2 + ph[0]) + 0.035 * np.sin(17 * a2 + ph[1]) + 0.02 * np.sin(31 * a2 + ph[2]))
    w = w * ruff
    cov = np.clip(w - np.abs(v) + 0.5, 0, 1) * np.clip(u + 0.5, 0, 1) * (t < 1.05)
    if cov.max() <= 0:
        return
    # thin, slightly translucent petal margin reads as tissue rather than plastic
    edge = np.clip((w - np.abs(v)) / max(1.5, W * 0.06), 0, 1)
    cov = cov * (0.82 + 0.18 * edge)
    vn = np.clip(v / np.maximum(w, 1e-3), -1, 1)
    P = PALETTE
    if kind == 'red':
        col = mix(P['red_base'], P['red_mid'], smooth(0.05, 0.38, t))
        col = mix(col, P['red'], smooth(0.35, 0.8, t))
        col = mix(col, P['red_deep'], 0.55 * np.abs(vn) ** 5 + 0.25 * smooth(0.9, 1.02, t))
        wob = 0.6 * nz.at(X * 0.7, Y * 0.7, True)
        vein = np.cos(vn * math.pi * 5.5 + 0.35 * np.sin(t * 8) + wob) ** 6
        col *= (1 - 0.07 * vein * smooth(0.18, 0.55, t))[..., None]
        col = mix(col, hexc('#FF8A3C'), 0.18 * (1 - smooth(0.0, 0.5, t)))
    else:  # the speckled standard petal
        col = mix(P['cream_y'], P['cream'], smooth(0.05, 0.35, t))
        streak = np.cos(vn * math.pi * 8.5) ** 10 * smooth(0.12, 0.3, t) * (1 - smooth(0.55, 0.8, t))
        spots = (nz.at(X * 3.1, Y * 3.1) > 0.55) * smooth(0.2, 0.5, t) * (1 - smooth(0.7, 0.9, t))
        rim = smooth(0.45, 0.85, np.abs(vn)) * smooth(0.35, 0.6, t) + smooth(0.72, 0.95, t)
        col = mix(col, P['red'], np.clip(1.1 * streak + 0.9 * spots + 1.0 * rim + 0.25, 0, 1))
        col = mix(col, P['red_deep'], 0.3 * np.abs(vn) ** 6)
    # cupped lighting + crinkle + texture
    lit = 0.9 + 0.16 * math.cos(ang - LIGHT) * (1 - np.abs(vn)) - 0.1 * vn * math.sin(ang - LIGHT)
    crinkle = 1 + 0.05 * np.sin(t * L / max(W, 1) * 9 + vn * 4 + ph[0]) * smooth(0.3, 0.7, t)
    tex = 1 + 0.06 * nz.at(X, Y) + 0.05 * nz.at(X, Y, True)
    if curl:
        lit = lit + curl * smooth(0.8, 1.0, t) * 0.25
    col = col * (lit * crinkle * tex)[..., None]
    sub = Canvas(X.shape[1], X.shape[0], x0, y0)
    sub.put(x0, y0, np.clip(col, 0, 1.1), cov.astype(np.float32))
    cv.composite(sub, shadow=dict(strength=0.28, blur=max(2, L * 0.05), dx=L * 0.04, dy=L * 0.06))


def disc_stroke(cv, pts, r0, r1, c_hi, c, c_lo, shade_dir=LIGHT, shadow=None):
    """Tapered tube along a polyline with cylindrical shading."""
    pts = np.asarray(pts, np.float32)
    xs, ys = pts[:, 0], pts[:, 1]
    rmax = max(r0, r1)
    x0, y0 = int(xs.min() - rmax - 3), int(ys.min() - rmax - 3)
    x1, y1 = int(xs.max() + rmax + 3), int(ys.max() + rmax + 3)
    X, Y = np.meshgrid(np.arange(x0, x1) + 0.5, np.arange(y0, y1) + 0.5)
    best = np.full(X.shape, 1e9, np.float32)
    side = np.zeros(X.shape, np.float32)
    rad = np.zeros(X.shape, np.float32)
    n = len(pts)
    for i in range(n - 1):
        ax, ay = pts[i]
        bx, by = pts[i + 1]
        ex, ey = bx - ax, by - ay
        ll = ex * ex + ey * ey + 1e-6
        tt = np.clip(((X - ax) * ex + (Y - ay) * ey) / ll, 0, 1)
        px, py = ax + tt * ex, ay + tt * ey
        d = np.hypot(X - px, Y - py)
        r = r0 + (r1 - r0) * (i + tt) / (n - 1)
        dd = d - r
        m = dd < best
        best = np.where(m, dd, best)
        nx, ny = -ey / math.sqrt(ll), ex / math.sqrt(ll)
        s = ((X - px) * nx + (Y - py) * ny) / np.maximum(r, 0.5)
        side = np.where(m, s, side)
        rad = np.where(m, r, rad)
    cov = np.clip(-best + 0.5, 0, 1).astype(np.float32)
    s = np.clip(side, -1, 1)
    col = mix(c, c_hi, np.clip(-s, 0, 1) ** 1.4)
    col = mix(col, c_lo, np.clip(s, 0, 1) ** 1.2)
    sub = Canvas(X.shape[1], X.shape[0], x0, y0)
    sub.put(x0, y0, col, cov)
    cv.composite(sub, shadow=shadow)


def bezier(p0, p1, p2, p3, n=24):
    t = np.linspace(0, 1, n)[:, None]
    p0, p1, p2, p3 = map(lambda p: np.array(p, np.float32), (p0, p1, p2, p3))
    return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3


def ellipse(cv, nz, cx, cy, a, b, ang, hi, c, lo, alpha=1.0):
    x0, y0, X, Y = grid(cx, cy, a + 2)
    dx, dy = X - cx, Y - cy
    u = dx * math.cos(ang) + dy * math.sin(ang)
    v = -dx * math.sin(ang) + dy * math.cos(ang)
    # oblong leaflet with slightly pointed ends
    vv = v / b
    uu = u / a
    rr = np.sqrt(uu ** 2 + vv ** 2 * (1 + 0.25 * uu ** 2))
    cov = np.clip((1 - rr) * min(a, b) + 0.5, 0, 1).astype(np.float32) * alpha
    if cov.max() <= 0:
        return
    lit = math.cos(ang + math.pi / 2 - LIGHT)
    s = np.clip(vv * (1 if lit > 0 else -1), -1, 1)
    col = mix(c, hi, np.clip(-s, 0, 1))
    col = mix(col, lo, np.clip(s, 0, 1) ** 0.8 * 0.9)
    mid = np.exp(-(vv * 6) ** 2) * (np.abs(uu) < 0.9)
    col = mix(col, hi * 1.08, mid * 0.35)
    col *= (1 + 0.05 * nz.at(X, Y))[..., None]
    cv.put(x0, y0, np.clip(col, 0, 1), cov)


# ---------------------------------------------------------------- organs
def leaf(cv, nz, rng, bx, by, ang, L, droop=0.35, scale=1.0, tone=1.0, shadow=True):
    """Bipinnate Krishnachura leaf: rachis -> pinnae -> tiny leaflets."""
    R = L * 1.25
    sub = Canvas(2 * R, 2 * R, bx - R, by - R)
    P = PALETTE
    shift = rng.uniform(-0.06, 0.06)
    hi = np.clip(P['leaf_hi'] * tone + shift, 0, 1)
    c = np.clip(P['leaf'] * tone + shift * 0.6, 0, 1)
    lo = np.clip(P['leaf_lo'] * tone, 0, 1)
    ca, sa = math.cos(ang), math.sin(ang)
    # rachis droops under gravity
    end = (bx + ca * L, by + sa * L + droop * L * 0.6)
    rach = bezier((bx, by), (bx + ca * L * 0.4, by + sa * L * 0.4), (bx + ca * L * 0.8, by + sa * L * 0.8 + droop * L * 0.25), end, 30)
    npin = int(rng.integers(9, 14))
    for i in range(npin):
        f = 0.12 + 0.86 * i / (npin - 1)
        k = min(len(rach) - 2, int(f * (len(rach) - 1)))
        px, py = rach[k]
        tx, ty = rach[k + 1] - rach[k]
        tang = math.atan2(ty, tx)
        plen = L * 0.34 * (1 - 0.55 * f) * (0.8 + 0.4 * math.sin(math.pi * min(1, f * 1.4)))
        for side in (-1, 1):
            pa = tang + side * math.radians(rng.uniform(52, 72))
            pts = bezier((px, py), (px + math.cos(pa) * plen * 0.4, py + math.sin(pa) * plen * 0.4),
                         (px + math.cos(pa) * plen * 0.8, py + math.sin(pa) * plen * 0.8 + plen * droop * 0.3),
                         (px + math.cos(pa) * plen, py + math.sin(pa) * plen + plen * droop * 0.45), 14)
            nleaf = int(rng.integers(14, 20))
            for j in range(nleaf):
                g = (j + 0.6) / nleaf
                q = min(len(pts) - 2, int(g * (len(pts) - 1)))
                lx, ly = pts[q]
                dx2, dy2 = pts[q + 1] - pts[q]
                la = math.atan2(dy2, dx2)
                size = plen * 0.085 * (1 - 0.45 * g) * scale * rng.uniform(0.85, 1.1)
                for s2 in (-1, 1):
                    aa = la + s2 * math.radians(rng.uniform(55, 80)) + rng.uniform(-0.15, 0.15)
                    off = size * 0.85
                    yel = rng.random() < 0.025
                    ellipse(sub, nz, lx + math.cos(aa) * off, ly + math.sin(aa) * off, size, size * 0.38, aa,
                            P['leaf_y'] if yel else hi, c * (0.92 + 0.16 * rng.random()), lo)
            disc_stroke(sub, pts, 1.1 * scale, 0.5 * scale, hi, c, lo)
    disc_stroke(sub, rach, 2.2 * scale, 0.8 * scale, P['leaf_hi'], P['leaf'], P['leaf_lo'])
    cv.composite(sub, shadow=dict(strength=0.32, blur=6, dx=6, dy=10) if shadow else None)


def flower(cv, nz, rng, cx, cy, S, rot, fore=1.0):
    P = PALETTE
    # sepals peek out between petals
    for k in range(5):
        a = rot + k * 2 * math.pi / 5 + 0.3
        petal(cv, nz, rng, cx, cy, a, S * 0.52, S * 0.13, kind='red', fore=fore)
    angs = [rot + math.radians(d + rng.uniform(-9, 9)) for d in (0, 74, 214, 288)]
    std = rot + math.radians(144 + rng.uniform(-8, 8))
    order = sorted([(a, 'red') for a in angs] + [(std, 'std')], key=lambda p: math.sin(p[0]))
    for a, kind in order:
        L = S * (0.9 if kind == 'std' else rng.uniform(0.94, 1.06))
        petal(cv, nz, rng, cx, cy, a, L, S * (0.5 if kind == 'std' else rng.uniform(0.44, 0.5)), kind=kind,
              fore=fore * (0.8 if kind == 'std' else rng.uniform(0.88, 1.0)), curl=rng.uniform(0, 0.4))
    # stamens arc outward, away from the standard petal
    base = std + math.pi
    sx, sy = cx, cy
    for k in range(10):
        a = base + math.radians(rng.uniform(-34, 34))
        L = S * rng.uniform(0.8, 1.15)
        bend = rng.uniform(-0.4, 0.4)
        pts = bezier((sx, sy), (sx + math.cos(a) * L * 0.35, sy + math.sin(a) * L * 0.35),
                     (sx + math.cos(a + bend) * L * 0.75, sy + math.sin(a + bend) * L * 0.75 - L * 0.12),
                     (sx + math.cos(a + bend * 1.3) * L, sy + math.sin(a + bend * 1.3) * L - L * 0.2), 12)
        disc_stroke(cv, pts, S * 0.022, S * 0.014, hexc('#F06A3A'), hexc('#C8261C'), hexc('#7E1012'),
                    shadow=dict(strength=0.25, blur=2, dx=2, dy=3))
        ex, ey = pts[-1]
        ellipse(cv, nz, ex, ey, S * 0.06, S * 0.03, a + bend * 1.3, hexc('#C9A24A'), P['anther'], hexc('#3A1E10'))
    ellipse(cv, nz, cx, cy, S * 0.1, S * 0.09, rot, hexc('#E7D27A'), hexc('#B4A03A'), hexc('#6E5A1A'))


def bud(cv, nz, rng, cx, cy, S, ang):
    ellipse(cv, nz, cx, cy, S * 0.34, S * 0.2, ang, hexc('#A8B456'), hexc('#7D8B36'), hexc('#3F4A1A'))
    for k in range(4):
        a = ang + rng.uniform(-0.25, 0.25)
        ellipse(cv, nz, cx + math.cos(a) * S * 0.08 * (k - 1.5), cy + math.sin(a) * S * 0.08 * (k - 1.5),
                S * 0.3, S * 0.05, a, hexc('#D2553A'), hexc('#9A2A1E'), hexc('#5A1410'), alpha=0.55)


def cluster(cv, nz, rng, cx, cy, S, n, spread=1.0, up=0.0, tilt=0.0):
    """Corymb of blossoms with buds and short pedicels."""
    items = []
    for i in range(n):
        r = math.sqrt(rng.random()) * S * 1.6 * spread
        a = rng.uniform(0, 2 * math.pi)
        x = cx + math.cos(a) * r * 1.25
        y = cy + math.sin(a) * r * 0.75 - up * S
        size = S * rng.uniform(0.62, 1.0) * (1 - 0.25 * r / (S * 1.6 * spread + 1))
        items.append(('f', x, y, size, rng.uniform(0, 2 * math.pi), rng.uniform(0.72, 1.0)))
    for i in range(int(n * 0.8)):
        a = rng.uniform(-math.pi, 0) + tilt
        r = S * rng.uniform(1.4, 2.3) * spread
        items.append(('b', cx + math.cos(a) * r * 1.2, cy + math.sin(a) * r * 0.8, S * rng.uniform(0.35, 0.55), a, 1))
    # pedicels first
    hub = (cx + rng.uniform(-0.2, 0.2) * S, cy + S * 0.55)
    for kind, x, y, s, a, f in items:
        mx, my = (hub[0] + x) / 2 + rng.uniform(-0.3, 0.3) * S, (hub[1] + y) / 2 + S * 0.25
        pts = bezier(hub, (mx, my), (x, y + s * 0.35), (x, y), 10)
        disc_stroke(cv, pts, 2.4, 1.3, hexc('#A3963E'), hexc('#76672A'), hexc('#3E3014'))
    items.sort(key=lambda it: (it[0] == 'f', it[2]))
    for kind, x, y, s, a, f in items:
        if kind == 'b':
            bud(cv, nz, rng, x, y, s, a)
        else:
            flower(cv, nz, rng, x, y, s, a, fore=f)


def branch(cv, rng, pts, r0, r1, shadow=True):
    P = PALETTE
    disc_stroke(cv, pts, r0, r1, P['bark_hi'], P['bark'], P['bark_lo'],
                shadow=dict(strength=0.3, blur=8, dx=8, dy=12) if shadow else None)


def finish(cv, path, w=None):
    # soften the procedural crispness slightly, like a lens would
    cv.rgb = gaussian_filter(cv.rgb, (0.55, 0.55, 0))
    cv.a = gaussian_filter(cv.a, 0.55)
    img = cv.image()
    box = img.getbbox()
    if box:
        img = img.crop((max(0, box[0] - 8), max(0, box[1] - 8), min(img.width, box[2] + 8), min(img.height, box[3] + 8)))
    if w:
        img = img.resize((w, int(img.height * w / img.width)), Image.LANCZOS)
    img.save(path + '.webp', 'WEBP', quality=90, method=6)
    img.save(path + '.png', optimize=True)
    print('saved', path, img.size)


# ---------------------------------------------------------------- compositions
def spray_along(cv, nz, rng, path, leaves=10, clusters=(), leaf_len=(260, 420), droop=0.4, tone=1.0, side=1):
    n = len(path)
    for i in range(leaves):
        k = int(rng.uniform(0.1, 0.98) * (n - 1))
        x, y = path[k]
        tx, ty = path[min(n - 1, k + 1)] - path[max(0, k - 1)]
        ta = math.atan2(ty, tx)
        a = ta + side * rng.choice([-1, 1]) * math.radians(rng.uniform(25, 70))
        leaf(cv, nz, rng, x, y, a, rng.uniform(*leaf_len), droop=droop, tone=tone * rng.uniform(0.9, 1.08))


def comp_corner(seed, W=2400, H=1900):
    """Branch reaching in from the top-left, heavy with blossoms."""
    rng = np.random.default_rng(seed)
    nz = Noise(rng)
    cv = Canvas(W, H)
    main = bezier((-80, 140), (600, 60), (1200, 260), (1900, 760), 60)
    sub1 = bezier((700, 140), (900, 380), (980, 640), (900, 1050), 40)
    sub2 = bezier((1250, 330), (1450, 300), (1700, 380), (2150, 330), 40)
    spray_along(cv, nz, rng, main, 6, leaf_len=(300, 460), tone=0.74)
    branch(cv, rng, main, 34, 9)
    branch(cv, rng, sub1, 16, 6)
    branch(cv, rng, sub2, 14, 5)
    spray_along(cv, nz, rng, sub1, 4, leaf_len=(240, 380))
    spray_along(cv, nz, rng, sub2, 4, leaf_len=(240, 360))
    spray_along(cv, nz, rng, main, 4, leaf_len=(260, 400))
    for (x, y, s, n) in [(520, 280, 96, 7), (1180, 420, 104, 9), (2120, 340, 112, 10), (1500, 600, 120, 11),
                         (900, 1060, 124, 12), (1880, 820, 132, 13), (300, 210, 84, 5)]:
        cluster(cv, nz, rng, x, y, s, n, spread=0.85)
    spray_along(cv, nz, rng, main[30:], 2, leaf_len=(200, 300), tone=1.08)
    return cv


def comp_rise(seed, W=2200, H=2000):
    """Bush rising from the bottom-right edge."""
    rng = np.random.default_rng(seed)
    nz = Noise(rng)
    cv = Canvas(W, H)
    stems = [bezier((W + 60, H + 40), (1700, 1500), (1300, 1100), (900, 700), 50),
             bezier((W - 200, H + 40), (1800, 1300), (1700, 900), (1500, 420), 50),
             bezier((W + 40, H - 300), (1900, 1200), (1600, 1200), (1150, 1250), 40)]
    for s in stems:
        spray_along(cv, nz, rng, s, 5, leaf_len=(260, 420), droop=0.3, tone=0.74, side=-1)
    for i, s in enumerate(stems):
        branch(cv, rng, s, 26 - i * 6, 7)
    for s in stems:
        spray_along(cv, nz, rng, s, 3, leaf_len=(240, 380), droop=0.3, side=-1)
    for (x, y, sz, n) in [(900, 690, 124, 12), (1500, 420, 116, 11), (1150, 1240, 128, 12), (1380, 900, 112, 10),
                          (1820, 760, 104, 9), (1900, 1350, 120, 10), (1600, 1650, 130, 10)]:
        cluster(cv, nz, rng, x, y, sz, n, up=0.3, spread=0.85)
    return cv


def comp_spray(seed, W=1500, H=1300):
    """A lighter single spray for mid-page accents."""
    rng = np.random.default_rng(seed)
    nz = Noise(rng)
    cv = Canvas(W, H)
    s = bezier((-40, 900), (300, 820), (700, 600), (1150, 420), 40)
    spray_along(cv, nz, rng, s, 6, leaf_len=(240, 380), tone=0.82)
    branch(cv, rng, s, 16, 5)
    spray_along(cv, nz, rng, s, 6, leaf_len=(220, 360))
    cluster(cv, nz, rng, 1160, 420, 112, 11, spread=0.85)
    cluster(cv, nz, rng, 640, 640, 96, 7, spread=0.85)
    return cv


def comp_bloom(seed, W=900, H=800):
    """Dense close-up blossom cluster (foreground, gets depth blur in CSS)."""
    rng = np.random.default_rng(seed)
    nz = Noise(rng)
    cv = Canvas(W, H)
    for _ in range(4):
        leaf(cv, nz, rng, W * 0.5, H * 0.62, rng.uniform(0, 2 * math.pi), rng.uniform(260, 360), tone=0.85)
    cluster(cv, nz, rng, W * 0.5, H * 0.5, 120, 9, spread=0.9)
    return cv


def petals(seed):
    rng = np.random.default_rng(seed)
    nz = Noise(rng)
    for i in range(6):
        cv = Canvas(260, 260)
        petal(cv, nz, rng, 130 - 105 * math.cos(0.5), 130 - 105 * math.sin(0.5) * 0.3, rng.uniform(-0.3, 0.3),
              200, 120, kind='std' if i == 5 else 'red', fore=rng.uniform(0.6, 1.0), curl=0.3)
        img = cv.image()
        bbox = img.getbbox()
        img = img.crop(bbox)
        img.save(os.path.join(OUT, f'petal-{i + 1}.png'), optimize=True)


def cloud(seed, W=1800, H=900):
    """Soft cumulus bank: fractal noise shaped by a domed envelope, lit from above."""
    rng = np.random.default_rng(seed)
    dens = np.zeros((H, W), np.float32)
    for octave, (sigma, amp) in enumerate([(90, 1.0), (40, 0.55), (16, 0.3), (6, 0.16), (2.5, 0.08)]):
        n = rng.standard_normal((H, W)).astype(np.float32)
        n = gaussian_filter(n, sigma, mode='wrap')
        dens += amp * n / (np.abs(n).max() + 1e-6)
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    # several overlapping puffs make a natural silhouette
    env = np.zeros_like(dens)
    for _ in range(9):
        cx, cy = rng.uniform(0.12, 0.88) * W, rng.uniform(0.42, 0.7) * H
        rx, ry = rng.uniform(0.12, 0.3) * W, rng.uniform(0.18, 0.34) * H
        env = np.maximum(env, 1 - ((X - cx) / rx) ** 2 - ((Y - cy) / ry) ** 2)
    env *= smooth(0.0, 0.25, 1 - Y / H)  # flat-ish base
    d = np.clip(env * 1.3 + dens * 0.7 - 0.25, 0, None)
    a = smooth(0.02, 0.55, d)
    # lighting: brighter tops, cool grey undersides
    light = np.clip(1 - 0.9 * gaussian_filter(np.roll(d, 18, axis=0) - d, 10), 0, 1.3)
    shade = mix(hexc('#AEB9C8'), hexc('#FFFFFF'), np.clip(light * 0.75 + (1 - Y / H) * 0.35, 0, 1))
    cv = Canvas(W, H)
    cv.put(0, 0, shade, a.astype(np.float32))
    return cv


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    if len(sys.argv) > 1 and sys.argv[1] == 'clouds':
        for i, s in enumerate((5, 9, 17)):
            finish(cloud(s), os.path.join(OUT, f'cloud-{i + 1}'), 1600)
        sys.exit()
    if len(sys.argv) > 1 and sys.argv[1] == 'preview':
        rng = np.random.default_rng(3)
        nz = Noise(rng)
        cv = Canvas(900, 700)
        leaf(cv, nz, rng, 120, 420, -0.3, 420)
        cluster(cv, nz, rng, 520, 330, 110, 6)
        finish(cv, os.path.join(OUT, '_preview'))
        sys.exit()
    finish(comp_corner(11), os.path.join(OUT, 'krishnachura-corner'), 2000)
    finish(comp_rise(23), os.path.join(OUT, 'krishnachura-rise'), 1800)
    finish(comp_spray(37), os.path.join(OUT, 'krishnachura-spray'), 1300)
    finish(comp_bloom(41), os.path.join(OUT, 'krishnachura-bloom'), 900)
    petals(53)
