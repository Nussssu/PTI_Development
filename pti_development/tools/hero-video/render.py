"""
Render the Services-page hero background video from hero-scene@2x.webp.

A seamless loop: every motion (camera drift, sky flow, water ripple, light
particles, lamp glow) is periodic in LOOP seconds, so the last frame flows
straight back into the first.

Usage (from the project root):
    python tools/hero-video/render.py              # full render -> public/videos
    python tools/hero-video/render.py --preview 0 3.5 7   # stills to --out-dir

Needs numpy + Pillow and an ffmpeg with libvpx-vp9 (Playwright's bundled one works).
"""
import argparse
import glob
import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'public', 'images', 'hero-scene@2x.webp')

W, H = 1920, 1080
FPS = 30
LOOP = 14.0  # seconds
TAU = 2 * math.pi


def find_ffmpeg():
    for c in ('ffmpeg',):
        try:
            subprocess.run([c, '-version'], capture_output=True, check=True)
            return c
        except Exception:
            pass
    hits = sorted(glob.glob(os.path.expanduser('~/AppData/Local/ms-playwright/ffmpeg-*/ffmpeg-win64.exe')))
    if hits:
        return hits[-1]
    sys.exit('ffmpeg not found')


# ---------------------------------------------------------------- source + masks
img = Image.open(SRC).convert('RGB')
SW, SH = img.size
S = SW / 1672.0  # masks were measured on the 1672px version
src = np.asarray(img, dtype=np.float32)


def poly_mask(points, blur):
    m = Image.new('L', (SW, SH), 0)
    ImageDraw.Draw(m).polygon([(x * S, y * S) for x, y in points], fill=255)
    return np.asarray(m.filter(ImageFilter.GaussianBlur(blur * S)), dtype=np.float32) / 255


def sky_mask():
    r, g, b = src[..., 0], src[..., 1], src[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    yy = np.arange(SH)[:, None] / S
    # sky reads blue-ish or warm-peach; foliage is dark and green-leaning
    sky = ((b > g + 4) | ((r > g) & (lum > 120))) & (lum > 30) & (yy < 690)
    m = Image.fromarray((sky * 255).astype(np.uint8))
    m = m.filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(5))
    d = ImageDraw.Draw(m)
    # keep buildings rigid
    d.rectangle([725 * S, 120 * S, 940 * S, 820 * S], fill=0)       # tower
    d.rectangle([60 * S, 425 * S, 335 * S, 700 * S], fill=0)        # left block
    d.rectangle([920 * S, 600 * S, 1150 * S, 700 * S], fill=0)      # right low block
    m = np.asarray(m.filter(ImageFilter.GaussianBlur(10 * S)), dtype=np.float32) / 255
    # fade the effect out toward the horizon / treeline
    fade = np.clip((640 - yy) / 140, 0, 1)
    return m * fade


SKY = sky_mask()
POOL = poly_mask([(632, 813), (1062, 813), (1560, 941), (232, 941)], 3)
# reflections are brighter near the tower axis; this drives the sparkles
_r = src[..., 0] + src[..., 1] + src[..., 2]
SPARK = POOL * np.clip((_r - 420) / 260, 0, 1)

# warm lamps (small, very bright, warm pixels below the treeline)
yy_full = np.arange(SH)[:, None] / S
LAMP = ((src[..., 0] > 235) & (src[..., 1] > 200) & (yy_full > 640)).astype(np.float32)
LAMP = np.asarray(Image.fromarray((LAMP * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(9 * S)), dtype=np.float32) / 255
LAMP = np.clip(LAMP * 3, 0, 1)

# ---------------------------------------------------------------- particles
rng = np.random.default_rng(7)
N_P = 70
P_X = rng.uniform(0, W, N_P)
P_Y0 = rng.uniform(0, H, N_P)
P_LAPS = rng.integers(1, 3, N_P)              # whole wraps per loop -> seamless
P_SWAY = rng.uniform(6, 22, N_P)
P_PH = rng.uniform(0, TAU, N_P)
P_R = rng.uniform(1.2, 3.6, N_P)
P_A = rng.uniform(0.25, 0.75, N_P)
P_TW = rng.integers(1, 4, N_P)                # twinkle cycles per loop

gy, gx = np.mgrid[0:H, 0:W].astype(np.float32)


def bilinear(arr, x, y):
    h, w = arr.shape[:2]
    x = np.clip(x, 0, w - 1.001)
    y = np.clip(y, 0, h - 1.001)
    x0 = x.astype(np.int32)
    y0 = y.astype(np.int32)
    fx = (x - x0)[..., None] if arr.ndim == 3 else x - x0
    fy = (y - y0)[..., None] if arr.ndim == 3 else y - y0
    a = arr[y0, x0]
    b = arr[y0, x0 + 1]
    c = arr[y0 + 1, x0]
    d = arr[y0 + 1, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def frame(t):
    p = TAU * t / LOOP  # loop phase

    # camera: slow breathing push + lateral drift, all periodic
    zoom = 1.085 + 0.025 * math.sin(p)
    cx = SW / 2 + SW * 0.018 * math.sin(p + 0.6)
    cy = SH * 0.47 + SH * 0.010 * math.sin(2 * p)
    scale = (SW / W) / zoom
    sx = cx + (gx - W / 2) * scale
    sy = cy + (gy - H / 2) * scale

    xi = np.clip(sx, 0, SW - 1).astype(np.int32)
    yi = np.clip(sy, 0, SH - 1).astype(np.int32)
    sky = SKY[yi, xi]
    pool = POOL[yi, xi]

    # sky: layered, slowly travelling flow field -> clouds appear to roll
    u = sx / S
    v = sy / S
    dx_sky = (9 * np.sin(u * 0.0042 + v * 0.006 + p) +
              5 * np.sin(u * 0.011 - v * 0.004 + 2 * p + 1.3) +
              3 * np.sin(v * 0.019 + 3 * p + 0.4))
    dy_sky = (4 * np.sin(u * 0.0055 - v * 0.003 - p + 2.1) +
              2 * np.sin(u * 0.016 + 2 * p))

    # water: fine horizontal ripples that travel toward the camera
    dx_w = (2.2 * np.sin(v * 0.55 - 6 * p) + 1.2 * np.sin(v * 1.3 + u * 0.02 - 10 * p)) * (v - 790) / 150
    dy_w = 0.9 * np.sin(u * 0.05 + v * 0.3 - 4 * p)

    dx = (dx_sky * sky + dx_w * pool) * S
    dy = (dy_sky * sky + dy_w * pool) * S
    out = bilinear(src, sx + dx, sy + dy)

    # water sparkle: shimmering speckle riding on the bright reflections
    spark = SPARK[yi, xi]
    sh = np.sin(u * 0.9 + v * 2.1 - 8 * p) * np.sin(u * 0.37 - v * 1.7 + 6 * p)
    out += ((np.clip(sh, 0.55, 1) - 0.55) * 2.2 * spark)[..., None] * np.array([90, 110, 105], np.float32)

    # lamps breathe a little
    lamp = LAMP[yi, xi]
    out += lamp[..., None] * (0.5 + 0.5 * math.sin(2 * p + 1)) * np.array([38, 26, 8], np.float32)

    # golden floating particles (drawn at output res, wrap seamlessly)
    yy = (P_Y0 - (t / LOOP) * P_LAPS * (H + 80)) % (H + 80) - 40
    xx = P_X + P_SWAY * np.sin(p * P_LAPS + P_PH)
    tw = 0.55 + 0.45 * np.sin(p * P_TW + P_PH)
    glow = np.zeros((H, W), np.float32)
    for i in range(N_P):
        r = P_R[i] * 3.2
        x0, x1 = int(max(xx[i] - r * 3, 0)), int(min(xx[i] + r * 3, W))
        y0, y1 = int(max(yy[i] - r * 3, 0)), int(min(yy[i] + r * 3, H))
        if x0 >= x1 or y0 >= y1:
            continue
        lx = gx[y0:y1, x0:x1] - xx[i]
        ly = gy[y0:y1, x0:x1] - yy[i]
        d2 = (lx * lx + ly * ly) / (r * r)
        # fade out in the top fifth so they dissolve before wrapping
        edge = min(1.0, max(0.0, (yy[i] + 40) / (H * 0.25)))
        glow[y0:y1, x0:x1] += np.exp(-d2 * 2.2) * P_A[i] * tw[i] * edge
    out += np.minimum(glow, 1.4)[..., None] * np.array([255, 205, 140], np.float32)

    # subtle vignette + filmic grain (grain is seeded per frame index)
    return np.clip(out, 0, 255).astype(np.uint8)


VIG = None


def finish(rgb, idx):
    global VIG
    if VIG is None:
        nx = (gx - W / 2) / (W / 2)
        ny = (gy - H / 2) / (H / 2)
        VIG = (1 - 0.22 * np.clip(nx * nx * 0.6 + ny * ny * 0.8, 0, 1))[..., None]
    g = np.random.default_rng(idx).normal(0, 3.0, (H, W, 1)).astype(np.float32)
    return np.clip(rgb.astype(np.float32) * VIG + g, 0, 255).astype(np.uint8)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--preview', nargs='*', type=float)
    ap.add_argument('--out-dir', default=os.path.join(ROOT, 'public', 'videos'))
    a = ap.parse_args()
    os.makedirs(a.out_dir, exist_ok=True)

    if a.preview is not None:
        for t in a.preview or [0]:
            Image.fromarray(finish(frame(t), int(t * FPS))).save(os.path.join(a.out_dir, f'preview-{t:.2f}.jpg'), quality=88)
            print('preview', t)
        Image.fromarray((SKY * 255).astype(np.uint8)).resize((836, 470)).save(os.path.join(a.out_dir, 'mask-sky.png'))
        return

    ff = find_ffmpeg()
    n = int(LOOP * FPS)
    webm = os.path.join(a.out_dir, 'services-hero.webm')
    # Playwright's ffmpeg build has no pipe/rawvideo input, so frames are written as
    # near-lossless JPEGs into one concatenated .mjpeg file and read via image2pipe.
    tmp = os.path.join(a.out_dir, '_frames.mjpeg')
    with open(tmp, 'wb') as fh:
        for i in range(n):
            rgb = finish(frame(i / FPS), i)
            if i == 0:
                poster = Image.fromarray(rgb)
                poster.thumbnail((1600, 900))
                poster.save(os.path.join(a.out_dir, 'services-hero-poster.webp'), quality=72)
            Image.fromarray(rgb).save(fh, 'JPEG', quality=97, subsampling=0)
            if i % 30 == 0:
                print(f'frame {i}/{n}', flush=True)
    cmd = [ff, '-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg',
           '-framerate', str(FPS), '-i', tmp,
           '-an', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-row-mt', '1', '-deadline', 'good',
           '-cpu-used', '2', '-pix_fmt', 'yuv420p', webm]
    subprocess.run(cmd, check=True)
    os.remove(tmp)
    print('done', webm, os.path.getsize(webm) // 1024, 'KB')


if __name__ == '__main__':
    main()
