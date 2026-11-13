"""Regenerates the site's organic textures (run: python3 scripts/make-textures.py).
paper-grain.webp tileable paper fibre, laid over paper grounds with multiply.
leak-1..3.webp   light leaks on black (left, right, top edge), laid over photos or dark grounds
                 with mix-blend-mode: screen.
leak-N-wash.webp the same leaks with transparency, for paper grounds at low opacity.
Seeded, so the files are identical on every run."""
import numpy as np
from PIL import Image, ImageFilter
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "textures"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)

def blur_wrap(a, r):
    """Gaussian blur in the frequency domain: it wraps at the edges, so the tile repeats without a seam."""
    fy = np.fft.fftfreq(a.shape[0])[:, None]
    fx = np.fft.fftfreq(a.shape[1])[None, :]
    k = np.exp(-2 * (np.pi * r) ** 2 * (fx ** 2 + fy ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(a) * k))

def norm(a):
    return (a - a.min()) / (a.max() - a.min() + 1e-9)

# ---- paper: fine tooth + soft mottling + a few long fibres ----
N = 512
tooth = blur_wrap(rng.normal(0, 1, (N, N)), 0.6)
mottle = blur_wrap(rng.normal(0, 1, (N, N)), 14)
fib = np.zeros((N, N), np.float32)
for _ in range(260):
    x, y = rng.integers(0, N, 2)
    ang = rng.uniform(0, np.pi)
    ln = rng.integers(14, 70)
    bend = rng.normal(0, 0.012)
    for s in range(ln):
        ang += bend
        fib[int(y + np.sin(ang) * s) % N, int(x + np.cos(ang) * s) % N] += rng.uniform(0.4, 1)
fib = blur_wrap(fib, 0.7)
g = 0.68 * norm(tooth) + 0.14 * norm(mottle) + 0.18 * (1 - norm(fib))
g = norm(g)
# near-white, warm, low contrast: multiply-blend darkens paper by at most ~7%
v = 255 - (1 - g) * 20
rgb = np.stack([v, v - (1 - g) * 1.5, v - (1 - g) * 4], -1).clip(0, 255).astype(np.uint8)
Image.fromarray(rgb, "RGB").save(OUT / "paper-grain.webp", quality=88)

# ---- light leaks: warm burns from a film edge, on black ----
def leak(seed, w=1600, h=1000, side="left"):
    r = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    img = np.zeros((h, w, 3), np.float32)
    cols = [(1.0, 0.36, 0.10), (1.0, 0.55, 0.16), (1.0, 0.78, 0.42), (0.95, 0.22, 0.08)]
    for i in range(7):
        cx = r.uniform(-0.15, 0.25) * w if side == "left" else r.uniform(0.75, 1.15) * w
        if side == "top":
            cx = r.uniform(0.1, 0.9) * w
        cy = r.uniform(-0.1, 0.25) * h if side == "top" else r.uniform(-0.1, 1.1) * h
        sx, sy = r.uniform(0.10, 0.34) * w, r.uniform(0.18, 0.6) * h
        if side == "top":
            sx, sy = sy * 1.6, sx * 0.6
        ang = r.uniform(-0.5, 0.5)
        dx, dy = xx - cx, yy - cy
        u = dx * np.cos(ang) + dy * np.sin(ang)
        vv = -dx * np.sin(ang) + dy * np.cos(ang)
        blob = np.exp(-((u / sx) ** 2 + (vv / sy) ** 2) * 1.6) * r.uniform(0.35, 0.9)
        c = cols[r.integers(0, len(cols))]
        for k in range(3):
            img[..., k] += blob * c[k]
    # uneven burn: multiply by slow noise so the edge is ragged, never a clean gradient
    slow = np.asarray(Image.fromarray(r.normal(0, 1, (h // 40, w // 40)).astype(np.float32), "F")
                      .resize((w, h), Image.BICUBIC))
    img *= (0.72 + 0.28 * norm(slow))[..., None]
    # a hot core that clips toward pale honey, like overexposed film
    hot = img.max(-1, keepdims=True)
    img = img + np.clip(hot - 0.85, 0, 1) * np.array([0.5, 0.6, 0.55])
    img = np.clip(img, 0, 1) ** 0.9
    # film grain so it never bands
    img += r.normal(0, 0.012, img.shape)
    out = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), "RGB").filter(ImageFilter.GaussianBlur(3))
    return out

def wash(im):
    """The same leak as a transparent wash (alpha = brightness), for paper grounds at low opacity."""
    a = np.asarray(im).astype(np.float32) / 255
    al = a.max(-1, keepdims=True)
    rgb = np.where(al > 0.004, a / np.maximum(al, 0.004), 0)
    return Image.fromarray((np.concatenate([rgb, al], -1).clip(0, 1) * 255).astype(np.uint8), "RGBA")

for n, (seed, side) in enumerate([(11, "left"), (23, "right"), (37, "top")], 1):
    im = leak(seed, side=side)
    im.save(OUT / f"leak-{n}.webp", quality=82)
    wash(im).resize((800, 500), Image.LANCZOS).save(OUT / f"leak-{n}-wash.webp", quality=70)
# ---------------------------------------------------------------- prints (draft v0.3)
# Grainy prints of long-exposure landscapes: the grounds of boxes that hold no photograph
# (empty categories, the closing box). No subject, only colour dragged across the frame, then print grain.
def aniso(a, sx, sy):
    """Gaussian blur with separate x and y radii, wrapping, via FFT."""
    h, w = a.shape
    fy = np.fft.fftfreq(h)[:, None]; fx = np.fft.fftfreq(w)[None, :]
    k = np.exp(-2 * (np.pi ** 2) * ((sx * fx) ** 2 + (sy * fy) ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(a) * k))

def ramp(t, stops):
    """Map 0..1 through colour stops [(pos, (r, g, b)), ...]."""
    t = np.clip(t, 0, 1); pos = [s[0] for s in stops]
    return np.stack([np.interp(t, pos, [s[1][c] / 255 for s in stops]) for c in range(3)], -1)

def finish(img, r, grain=0.055):
    h, w, _ = img.shape
    g = r.normal(0, 1, (h, w)); g = 0.75 * g + 0.25 * aniso(r.normal(0, 1, (h, w)), 1.2, 1.2) * 3
    img = img + (g * grain)[..., None] * (0.6 + 0.8 * (1 - img.mean(-1, keepdims=True)))
    return Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), "RGB")

def field(r, h, w, sx, sy):
    return norm(aniso(r.normal(0, 1, (h, w)), sx, sy))

PW, PH = 900, 1125
yy, xx = np.mgrid[0:PH, 0:PW]; v = yy / PH; u = xx / PW

def print_dusk(r):      # pale sky, an orange sun dragged out of focus, dark ground
    sun = np.exp(-(((u - 0.56) / 0.42) ** 2 + ((v - 0.60) / 0.26) ** 2))
    base = ramp(v, [(0, (236, 234, 231)), (0.30, (226, 220, 214)), (0.52, (190, 128, 88)), (0.78, (96, 44, 28)), (1, (38, 20, 18))])
    glow = ramp(sun, [(0, (0, 0, 0)), (1, (232, 132, 52))])
    return finish(np.clip(base * (1 - 0.75 * sun[..., None]) + glow * 0.95, 0, 1), r, 0.06)

def print_foliage(r):   # trees from a moving window
    t = 0.55 * field(r, PH, PW, 130, 16) + 0.3 * field(r, PH, PW, 60, 7) + 0.15 * field(r, PH, PW, 200, 60)
    t = np.clip((norm(t) - 0.5) * 1.7 + 0.46, 0, 1)
    return finish(ramp(t, [(0, (20, 36, 12)), (0.4, (44, 76, 24)), (0.65, (104, 138, 40)), (0.88, (168, 196, 84)), (1, (214, 226, 150))]), r, 0.055)

def print_water(r):     # light on shallow water
    a = field(r, PH, PW, 90, 34); b = field(r, PH, PW, 34, 80)
    c = np.clip(1 - np.abs(norm(a + 0.7 * b) - 0.5) * 4.2, 0, 1) ** 3
    c = aniso(c, 5, 5)
    base = ramp(norm(aniso(r.normal(0, 1, (PH, PW)), 200, 200)), [(0, (124, 192, 206)), (1, (158, 214, 224))])
    return finish(np.clip(base + c[..., None] * 0.3, 0, 1), r, 0.045)

def print_meadow(r):    # leaves in front of the lens
    t = norm(field(r, PH, PW, 120, 120) + 0.35 * field(r, PH, PW, 55, 55))
    t = np.clip((t - 0.5) * 1.5 + 0.42, 0, 1)
    return finish(ramp(t, [(0, (26, 56, 28)), (0.5, (52, 100, 42)), (0.8, (118, 160, 54)), (1, (186, 212, 92))]), r, 0.05)

# The wall light (draft v0.3): the orange long exposure from the moodboard, remade on white so it can sit behind
# the pages. drafts/v2/light.js moves it; no subject, only warm light blooming from the lower right.
def print_glow(r, w=1200, h=900):
    y, x = np.mgrid[0:h, 0:w]; u = x / w; v = y / h
    f = lambda sx, sy: norm(aniso(r.normal(0, 1, (h, w)), sx, sy))
    bloom = np.exp(-(((u - 0.74) / 0.50) ** 2 + ((v - 0.80) / 0.46) ** 2))
    second = 0.45 * np.exp(-(((u - 0.18) / 0.30) ** 2 + ((v - 0.95) / 0.30) ** 2))
    t = np.clip((bloom + second) * (0.62 + 0.75 * f(150, 110)) + 0.16 * (f(60, 40) - 0.5), 0, 1)
    img = ramp(t, [(0, (253, 253, 252)), (0.22, (253, 240, 224)), (0.48, (250, 204, 158)), (0.74, (246, 150, 84)), (1, (240, 104, 44))])
    g = r.normal(0, 1, (h, w)) * 0.022
    return Image.fromarray((np.clip(img + g[..., None], 0, 1) * 255).astype(np.uint8), "RGB")
print_glow(np.random.default_rng(113)).save(OUT / "print-glow.webp", quality=80)

for name, fn, seed in [("dusk", print_dusk, 101), ("foliage", print_foliage, 103), ("water", print_water, 107), ("meadow", print_meadow, 109)]:
    fn(np.random.default_rng(seed)).save(OUT / f"print-{name}.webp", quality=78)
print("wrote", sorted(p.name for p in OUT.iterdir()))
