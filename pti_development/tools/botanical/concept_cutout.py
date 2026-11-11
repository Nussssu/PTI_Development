"""Cut the two flower clusters out of the concept reference (cream wall) into transparent WebPs.

usage: python concept_cutout.py <reference.png> <out_dir>
- colour-to-alpha against the wall colour, so soft wall shadows stay as translucent shade
- concept-tl.webp: top-left cascade, anchored to the page's top-left corner
- concept-br.webp: bottom-right cluster + its mirror image, so the cluster is whole and can straddle two pages
"""
import sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
img = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
H, W, _ = img.shape
bg = np.median(np.concatenate([img[:40, 1000:1500].reshape(-1, 3), img[860:, 400:900].reshape(-1, 3)]), axis=0)

# object mask: petals and leaves are clearly coloured, stems and flower eyes are dark; the cream wall and its soft
# grey-lavender shadows are neither (the shadow is redrawn live in CSS so it moves with the flowers)
mx, mn = img.max(axis=2), img.min(axis=2)
chroma = mx - mn
lum = img @ np.array([0.299, 0.587, 0.114], np.float32)
def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)
a = np.maximum(ss(30, 52, chroma), ss(205, 165, lum))
# close pin-holes inside petals (highlights) with a small max/min filter
from PIL import ImageFilter
m = Image.fromarray((a * 255).astype(np.uint8))
m = m.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
a = np.asarray(m).astype(np.float32) / 255
rgb = img

def cut(x0, y0, x1, y1, clear=()):
    al = a.copy()
    for cx0, cy0, cx1, cy1 in clear:
        al[cy0:cy1, cx0:cx1] = 0
    return np.dstack([rgb, al * 255]).astype(np.uint8)[y0:y1, x0:x1]

text = (495, 240, 1185, 740)       # heading / paragraph / mark: never let a letter leak in
tl = cut(0, 0, 840, 660, [text])
Image.fromarray(tl, 'RGBA').save(f'{out}/concept-tl.webp', quality=94, method=6)

# bottom-right: the reference cuts the bush at the page edge; grow the missing half from a mirror image that is
# continuous at the seam but warped away from it (narrower, lower, its own colour mix), so it does not read as a copy
br = cut(1040, 500, W, H, [text, (1040, 500, 1190, 625)]).astype(np.float32)
bh, bw, _ = br.shape
wm = round(bw * 0.9)
u = np.arange(wm, dtype=np.float32)[None, :].repeat(bh, 0)            # 0 at the seam
y = np.arange(bh, dtype=np.float32)[:, None].repeat(wm, 1)
f = u / wm
xs = (bw - 1) - u * (1 + 0.42 * np.sqrt(f))                            # stretch fast off the seam: no mirror look, outer sprays reach less
sc = 1 - 0.2 * f ** 0.8                                                 # shrink toward the bottom edge
ys = (bh - 1) - ((bh - 1) - y) / sc + 6 * np.sin(u / 41) * f           # plus a gentle wave so stems differ
def sample(im, X, Y):
    X = np.clip(X, 0, im.shape[1] - 1.001); Y = np.clip(Y, -1, im.shape[0] - 1.001)
    out_ = Y < 0; Y = np.clip(Y, 0, None)
    x0, y0 = X.astype(int), Y.astype(int); fx, fy = (X - x0)[..., None], (Y - y0)[..., None]
    v = (im[y0, x0] * (1 - fx) * (1 - fy) + im[y0, x0 + 1] * fx * (1 - fy) + im[y0 + 1, x0] * (1 - fx) * fy + im[y0 + 1, x0 + 1] * fx * fy)
    v[out_] = 0
    return v
mir = sample(br, xs, ys)
# colour mix: some lilac clusters turn periwinkle (blotchy, growing away from the seam)
hsv = np.asarray(Image.fromarray(mir[..., :3].astype(np.uint8)).convert('HSV')).astype(np.float32)
blot = np.clip(f * 5 - 0.1, 0, 1) * (0.5 + 0.5 * np.sin(y / 33 + u / 47) * np.cos(u / 61 - y / 29))
purple = ((hsv[..., 0] > 150) & (hsv[..., 0] < 215) & (hsv[..., 1] > 40)).astype(np.float32)
hsv[..., 0] -= 16 * blot * purple
rgbm = np.asarray(Image.fromarray(hsv.clip(0, 255).astype(np.uint8), 'HSV').convert('RGB')).astype(np.float32)
mir[..., :3] = rgbm
whole = np.concatenate([br, mir], axis=1).clip(0, 255).astype(np.uint8)
Image.fromarray(whole, 'RGBA').save(f'{out}/concept-br.webp', quality=94, method=6)
print('tl', tl.shape, 'br', whole.shape, 'seam at x', bw)
