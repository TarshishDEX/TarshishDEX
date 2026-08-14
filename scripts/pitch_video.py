#!/usr/bin/env python3
"""
Render the 3-minute TarshishDEX pitch video (motion graphics + neural VO + screenshots).

Pipeline:
  1. Read scene durations from .pitch-work/audio/manifest.json (pitch_tts.py).
  2. Rasterize the brand mark + wordmark from docs/tarshishdex-logo.svg.
  3. Render a 1920x1080 motion-graphics frame sequence (24 fps), weaving in real
     product/CI screenshots from docs/screenshots/.
  4. Assemble a master WAV (scene clips + 0.35s inter-scene pauses).
  5. Encode docs/videos/tarshishdex-pitch.mp4 with the static ffmpeg from imageio-ffmpeg.

Run:  /workspaces/Stellar-IndigoPay/.pitch-venv/bin/python scripts/pitch_video.py
"""

import json
import os
import subprocess
import wave

import cairosvg
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────
W, H = 1920, 1080
FPS = 24
GAP = 0.35

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(BASE, ".pitch-work")
AUDIO_DIR = os.path.join(WORK, "audio")
FRAME_DIR = os.path.join(WORK, "frames")
SHOT_DIR = os.path.join(BASE, "docs", "screenshots")
LOGO_SVG = os.path.join(BASE, "docs", "tarshishdex-logo.svg")
OUT = os.path.join(BASE, "docs", "videos", "tarshishdex-pitch.mp4")

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

BG_TOP = (11, 16, 28)       # #0b101c
BG_BOT = (14, 22, 42)       # deep navy
PRIMARY = (91, 160, 253)    # #5ba0fd
ACCENT = (34, 211, 238)     # #22d3ee
DEEP = (59, 130, 246)       # #3b82f6
GREEN = (46, 164, 79)       # #2ea44f
GREEN_LT = (74, 222, 128)   # #4ade80
WHITE = (255, 255, 255)
MUTED = (148, 163, 184)     # #94a3b8
DIM = (100, 116, 139)
CARD = (18, 26, 44)

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

_font_cache = {}


def F(size, bold=True):
    key = (size, bold)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)
    return _font_cache[key]


def lerp(a, b, t):
    return a + (b - a) * t


def clamp01(x):
    return 0.0 if x < 0 else (1.0 if x > 1 else x)


def ease_out(t):
    t = clamp01(t)
    return 1 - (1 - t) ** 3


def ease_in_out(t):
    t = clamp01(t)
    return t * t * (3 - 2 * t)


def seg(t, a, b):
    return clamp01((t - a) / (b - a))


def blend(c1, c2, a):
    return tuple(int(lerp(c1[i], c2[i], clamp01(a))) for i in range(3))


# ─────────────────────────────────────────────────────────────────────────────
# Background
# ─────────────────────────────────────────────────────────────────────────────
_yy = np.linspace(0.0, 1.0, H)[:, None, None]
_BASE = (np.array(BG_TOP)[None, None, :] * (1 - _yy)
         + np.array(BG_BOT)[None, None, :] * _yy)
_BASE = np.repeat(_BASE, W, axis=1)


def background(glow_cy=400.0, glow_strength=0.5):
    img = _BASE.copy()
    Y, X = np.mgrid[0:H, 0:W]
    d = np.sqrt((X - 960.0) ** 2 + (Y - glow_cy) ** 2)
    m = np.clip(1 - d / 900.0, 0, 1) ** 2 * glow_strength
    img += m[..., None] * np.array([30, 48, 84], dtype=float)
    return np.clip(img, 0, 255).astype(np.uint8)


_canvas_cache = {}


def new_canvas(glow_cy=400.0, glow_strength=0.5):
    key = (glow_cy, glow_strength)
    if key not in _canvas_cache:
        _canvas_cache[key] = Image.fromarray(background(glow_cy, glow_strength))
    return _canvas_cache[key].copy()


def draw_text(d, xy, text, size, fill, bold=True, anchor="mm"):
    d.text(xy, text, font=F(size, bold), fill=fill, anchor=anchor)


def draw_wordmark(d, cx, cy, size, alpha=1.0):
    """Draw the 'TarshishDEX' wordmark (Tarshish light, DEX cyan), centered."""
    f = F(size, True)
    w1 = d.textlength("Tarshish", font=f)
    w2 = d.textlength("DEX", font=f)
    x0 = cx - (w1 + w2) / 2.0
    c1 = blend(BG_TOP, (230, 236, 245), alpha)
    c2 = blend(BG_TOP, ACCENT, alpha)
    d.text((x0, cy), "Tarshish", font=f, fill=c1, anchor="lm")
    d.text((x0 + w1, cy), "DEX", font=f, fill=c2, anchor="lm")


# ─────────────────────────────────────────────────────────────────────────────
# Assets
# ─────────────────────────────────────────────────────────────────────────────
MARK_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <defs>
    <linearGradient id="td" x1="0" y1="0" x2="88" y2="88" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#5ba0fd"/><stop offset="100%" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="88" height="88" rx="24" fill="#0b101c" stroke="url(#td)" stroke-width="4"/>
  <path d="M27 27h42M48 27v42M48 69c12 0 18-6.6 18-15" stroke="url(#td)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>"""


def build_assets():
    os.makedirs(WORK, exist_ok=True)
    mark_path = os.path.join(WORK, "mark.png")
    logo_path = os.path.join(WORK, "logo.png")
    if not os.path.exists(mark_path):
        cairosvg.svg2png(bytestring=MARK_SVG.encode(), write_to=mark_path, output_width=640)
    if not os.path.exists(logo_path):
        cairosvg.svg2png(url=LOGO_SVG, write_to=logo_path, output_width=1400)
    return Image.open(mark_path).convert("RGBA"), Image.open(logo_path).convert("RGBA")


def paste_scaled(img, asset, cx, cy, size, alpha=255):
    w = int(size)
    h = int(asset.height * size / asset.width)
    a = asset.resize((w, h), Image.LANCZOS)
    if alpha < 255:
        a = a.copy()
        a.putalpha(int(alpha))
    img.paste(a, (cx - w // 2, cy - h // 2), a)


_shot_cache = {}


def load_shot(name):
    if name not in _shot_cache:
        p = os.path.join(SHOT_DIR, name)
        _shot_cache[name] = Image.open(p).convert("RGB") if os.path.exists(p) else None
    return _shot_cache[name]


def paste_shot(img, name, box, inner_margin=16, alpha=1.0):
    shot = load_shot(name)
    x0, y0, x1, y1 = box
    d = ImageDraw.Draw(img)
    d.rectangle([x0, y0, x1, y1], fill=(8, 12, 20), outline=DIM, width=2)
    if shot is None:
        return
    fit = shot.copy()
    fit.thumbnail((x1 - x0 - 2 * inner_margin, y1 - y0 - 2 * inner_margin), Image.LANCZOS)
    sx = x0 + ((x1 - x0) - fit.width) // 2
    sy = y0 + ((y1 - y0) - fit.height) // 2
    if alpha < 1.0:
        rgba = fit.convert("RGBA")
        rgba.putalpha(int(255 * alpha))
        img.paste(rgba, (sx, sy), rgba)
    else:
        img.paste(fit, (sx, sy))


# ─────────────────────────────────────────────────────────────────────────────
# Scenes
# ─────────────────────────────────────────────────────────────────────────────
def scene1(t, mark):
    img = new_canvas(glow_cy=380, glow_strength=0.7)
    d = ImageDraw.Draw(img)

    for i in range(3):
        ph = (t * 0.9 + i / 3) % 1.0
        r = 60 + ph * 480
        fade = 1 - ph
        col = blend(ACCENT, BG_TOP, 1 - fade * 0.8)
        d.ellipse([960 - r, 360 - r, 960 + r, 360 + r], outline=col, width=3)

    s = 200 + 80 * ease_out(seg(t, 0, 0.35))
    paste_scaled(img, mark, 960, 360, s)

    headline = "Trade without the blind spots."
    reveal = ease_out(seg(t, 0.35, 0.9))
    shown = headline[: int(len(headline) * reveal)]
    draw_text(d, (960, 620), shown, 58, WHITE, bold=True)

    a = int(255 * ease_out(seg(t, 0.78, 1.0)))
    draw_text(d, (960, 900), "Trade Stellar's native DEX — intelligently.", 34,
              blend(MUTED, WHITE, a / 255), bold=False)
    return img


def scene2(t):
    img = new_canvas(glow_cy=520, glow_strength=0.35)
    d = ImageDraw.Draw(img)

    # swap quote card with hidden output/impact/fee
    cx, cy, cw, ch = 960, 420, 640, 340
    d.rounded_rectangle([cx - cw // 2, cy - ch // 2, cx + cw // 2, cy + ch // 2],
                        radius=18, fill=CARD, outline=DIM, width=2)
    draw_text(d, (cx, cy - 120), "You pay:  100 XLM", 34, WHITE, bold=True)
    for i, label in enumerate(["You receive", "Price impact", "Fees"]):
        y = cy - 30 + i * 60
        draw_text(d, (cx - 190, y), label, 28, MUTED, bold=False, anchor="lm")
        d.rounded_rectangle([cx - 30, y - 16, cx + 200, y + 16], radius=6,
                            fill=blend(CARD, DIM, 0.4))
        draw_text(d, (cx + 85, y), "???", 28, DIM, bold=True)

    # bridge chain
    if t > 0.5:
        a = ease_out(seg(t, 0.5, 0.85))
        y = 760
        for i, lab in enumerate(["Asset", "Bridge", "Wrapped asset", "Risk"]):
            x = 380 + i * 380
            d.rounded_rectangle([x - 110, y - 34, x + 110, y + 34], radius=12,
                                fill=blend(BG_TOP, CARD, a), outline=DIM, width=2)
            draw_text(d, (x, y), lab, 26, blend(DIM, WHITE, a), bold=False)
            if i < 3:
                d.line([x + 112, y, x + 268, y], fill=DIM, width=3)

    a = int(255 * ease_out(seg(t, 0.15, 0.5)))
    draw_text(d, (960, 250), "The real cost of a trade stays hidden.", 38,
              blend(MUTED, WHITE, a / 255), bold=True)

    a2 = int(255 * ease_out(seg(t, 0.7, 1.0)))
    draw_text(d, (960, 900), "Traders deserve to see the outcome before they sign.",
              36, blend(MUTED, WHITE, a2 / 255), bold=True)
    return img


def scene3(t, mark):
    img = new_canvas(glow_cy=330, glow_strength=0.6)
    d = ImageDraw.Draw(img)

    a = ease_out(seg(t, 0, 0.3))
    if a > 0.05:
        paste_scaled(img, mark, 960, 210, int(130 * a), alpha=int(255 * a))
    draw_wordmark(d, 960, 330, 76, a)

    # quote → route → simulate → sign → submit pipeline
    steps = ["Quote", "Route", "Simulate", "Sign", "Submit"]
    y = 520
    xs = [300, 620, 940, 1260, 1580]
    for i, (x, lab) in enumerate(zip(xs, steps)):
        a2 = ease_out(seg(t, 0.25 + 0.08 * i, 0.55 + 0.08 * i))
        if a2 <= 0:
            continue
        col = GREEN if i == len(steps) - 1 else ACCENT
        d.rounded_rectangle([x - 90, y - 40, x + 90, y + 40], radius=12,
                            fill=blend(BG_TOP, CARD, a2), outline=col, width=2)
        draw_text(d, (x, y), lab, 26, blend(DIM, WHITE, a2), bold=True)
        if i < len(steps) - 1:
            d.line([x + 92, y, x + 218, y], fill=blend(DIM, ACCENT, a2), width=3)

    # contract chips
    chips = ["Trading prefs", "Market oracle", "Limit order"]
    y2 = 660
    for i, lab in enumerate(chips):
        x = 560 + i * 400
        a3 = ease_out(seg(t, 0.5 + 0.05 * i, 0.75 + 0.05 * i))
        if a3 <= 0:
            continue
        d.rounded_rectangle([x - 120, y2 - 30, x + 120, y2 + 30], radius=24,
                            fill=blend(BG_TOP, CARD, a3), outline=PRIMARY, width=2)
        draw_text(d, (x, y2), lab, 24, blend(DIM, WHITE, a3), bold=False)

    a4 = int(255 * ease_out(seg(t, 0.7, 1.0)))
    draw_text(d, (960, 900), "No bridges. No wrapped assets. No middlemen.", 36,
              blend(MUTED, WHITE, a4 / 255), bold=True)
    return img


SCENE4_SHOTS = [
    ("swap.png", "Swap", "Simulated quote before you sign"),
    ("markets.png", "Markets", "Live orderbook depth + pricing"),
    ("portfolio.png", "Portfolio", "Multi-account performance"),
    ("analytics.png", "Analytics", "Professional market charts"),
    ("assets.png", "Assets", "Discovery + issuer info"),
    ("orders.png", "Limit orders", "On-chain order registry"),
]


def scene4(t):
    img = new_canvas(glow_cy=460, glow_strength=0.5)
    d = ImageDraw.Draw(img)

    draw_text(d, (960, 90), "A professional trading terminal", 54, WHITE, bold=True)
    draw_text(d, (960, 152), "Simulate before you sign · route intelligently · trade on-chain", 30, MUTED)

    n = len(SCENE4_SHOTS)
    f = t * n
    idx = min(n - 1, int(f))
    local = f - idx
    name, title, sub = SCENE4_SHOTS[idx]
    a = ease_out(seg(local, 0.0, 0.18))

    bx0, by0, bx1, by1 = 240, 200, 1680, 940
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=16, fill=(8, 12, 20), outline=DIM, width=2)
    paste_shot(img, name, (bx0 + 12, by0 + 12, bx1 - 12, by1 - 88), inner_margin=12, alpha=a)

    cy0 = by1 - 88
    d.rectangle([bx0, cy0, bx1, by1], fill=(6, 9, 16))
    d.line([bx0, cy0, bx1, cy0], fill=PRIMARY, width=2)
    draw_text(d, (960, cy0 + 30), title, 30, WHITE, bold=True)
    draw_text(d, (960, cy0 + 62), sub, 22, MUTED, bold=False)
    return img


SCENE5_CARDS = [
    ("Trading prefs", "slippage · routing · allow-list", "100"),
    ("Market oracle", "price observation feed", "100"),
    ("Limit order", "expiry · execution tracking", "100"),
]


def scene5(t):
    img = new_canvas(glow_cy=560, glow_strength=0.5)
    d = ImageDraw.Draw(img)

    draw_text(d, (960, 90), "Three Soroban contracts", 54, WHITE, bold=True)

    cw, ch, gap = 560, 170, 24
    x0 = (W - 3 * cw - 2 * gap) // 2
    y0 = 200
    for i, (name, sub, codes) in enumerate(SCENE5_CARDS):
        x = x0 + i * (cw + gap)
        a = ease_out(seg(t, 0.03 * i, 0.25 + 0.03 * i))
        if a <= 0:
            continue
        d.rounded_rectangle([x, y0, x + cw, y0 + ch], radius=16, fill=blend(BG_TOP, CARD, a),
                            outline=ACCENT, width=2)
        draw_text(d, (x + cw // 2, y0 + 44), name, 34, WHITE, bold=True)
        draw_text(d, (x + cw // 2, y0 + 86), sub, 20, MUTED, bold=False)
        n = int(round(int(codes) * ease_out(seg(t, 0.18 + 0.04 * i, 0.7 + 0.04 * i))))
        draw_text(d, (x + cw // 2, y0 + 128), f"{n} error codes", 24, GREEN_LT, bold=True)

    sy0, sy1 = 410, 800
    for i, (box, shotname, lab) in enumerate(zip(
            [(170, sy0, 950, sy1), (970, sy0, 1750, sy1)],
            ["ci-pipeline.png", "test-output.png"],
            ["31 CI workflows", "2,083 tests · 99.77% coverage"])):
        x0b, y0b, x1b, y1b = box
        a = ease_out(seg(t, 0.3 + 0.1 * i, 0.55 + 0.1 * i))
        if a <= 0:
            continue
        paste_shot(img, shotname, box, inner_margin=12, alpha=a)
        draw_text(d, (x0b + (x1b - x0b) // 2, y1b + 26), lab, 24, WHITE, bold=True)

    a = ease_out(seg(t, 0.55, 0.9))
    draw_text(d, (960, 880), "300 error codes  ·  2,083 tests  ·  99.77% coverage  ·  37 gas benchmarks",
              34, blend(MUTED, WHITE, a), bold=True)

    if t > 0.78:
        a = ease_out(seg(t, 0.78, 0.95))
        draw_text(d, (960, 950), "Live on Stellar Testnet · production-grade",
                  30, blend(MUTED, GREEN_LT, a), bold=True)
    return img


SCENE6_SHOTS = [
    ("successful-testnet-transaction.png", "On-chain proof", "Real contract call — SUCCESS"),
    ("wallet-connected.png", "Wallet", "Freighter + StellarWalletsKit"),
    ("mobile-responsive.png", "Mobile", "Trade from any device"),
]


def scene6(t):
    img = new_canvas(glow_cy=420, glow_strength=0.6)
    d = ImageDraw.Draw(img)

    draw_text(d, (960, 110), "It isn't just code — it's shipped.", 54, WHITE, bold=True)

    n = len(SCENE6_SHOTS)
    f = t * n
    idx = min(n - 1, int(f))
    local = f - idx
    name, title, sub = SCENE6_SHOTS[idx]
    a = ease_out(seg(local, 0.0, 0.18))

    bx0, by0, bx1, by1 = 330, 220, 1590, 860
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=16, fill=(8, 12, 20), outline=DIM, width=2)
    paste_shot(img, name, (bx0 + 12, by0 + 12, bx1 - 12, by1 - 80), inner_margin=12, alpha=a)

    cy0 = by1 - 80
    d.rectangle([bx0, cy0, bx1, by1], fill=(6, 9, 16))
    d.line([bx0, cy0, bx1, cy0], fill=GREEN, width=2)
    draw_text(d, (960, cy0 + 28), title, 28, WHITE, bold=True)
    draw_text(d, (960, cy0 + 58), sub, 20, MUTED, bold=False)

    a2 = int(255 * ease_out(seg(t, 0.5, 0.9)))
    draw_text(d, (960, 950), "Deployed on Vercel · Live on Stellar Testnet · read-only developer API",
              28, blend(MUTED, GREEN_LT, a2 / 255), bold=True)
    return img


def scene7(t, mark):
    img = new_canvas(glow_cy=360, glow_strength=0.8)
    d = ImageDraw.Draw(img)

    ph = (t * 0.6) % 1.0
    r = 200 + ph * 360
    col = blend(ACCENT, BG_TOP, ph)
    d.ellipse([960 - r, 300 - r, 960 + r, 300 + r], outline=col, width=3)

    a = ease_out(seg(t, 0, 0.25))
    if a > 0.05:
        paste_scaled(img, mark, 960, 180, int(120 * a), alpha=int(255 * a))
    draw_wordmark(d, 960, 310, 84, a)

    draw_text(d, (960, 560), "Trade Stellar's native DEX.", 60, WHITE, bold=True)
    draw_text(d, (960, 650), "Intelligently.", 52, GREEN_LT, bold=True)

    a2 = ease_out(seg(t, 0.35, 0.8))
    draw_text(d, (960, 800), "tarshishdex.vercel.app", 36, blend(MUTED, WHITE, a2), bold=True)
    draw_text(d, (960, 860), "github.com/TarshishDEX/TarshishDEX", 28,
              blend(MUTED, WHITE, a2), bold=False)
    return img


SCENE_RENDERERS = {1: scene1, 2: scene2, 3: scene3, 4: scene4, 5: scene5, 6: scene6, 7: scene7}


# ─────────────────────────────────────────────────────────────────────────────
# Audio assembly
# ─────────────────────────────────────────────────────────────────────────────
def decode_wav(mp3_path, tmp_wav):
    subprocess.run([FFMPEG, "-y", "-i", mp3_path, "-ac", "1", "-ar", "44100",
                    "-f", "wav", tmp_wav], check=True, capture_output=True)
    with wave.open(tmp_wav, "rb") as w:
        n = w.getnframes()
        data = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
    return data


def build_master_audio(manifest, sr=44100):
    master = np.zeros(0, dtype=np.float32)
    for n in range(1, 8):
        if n > 1:
            master = np.concatenate([master, np.zeros(int(GAP * sr), dtype=np.float32)])
        segwav = decode_wav(manifest[str(n)]["file"], os.path.join(AUDIO_DIR, f"tmp_{n}.wav"))
        master = np.concatenate([master, segwav])
    out = os.path.join(WORK, "master.wav")
    pcm = (np.clip(master, -1, 1) * 32767).astype(np.int16)
    with wave.open(out, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    return out, len(master) / sr


# ─────────────────────────────────────────────────────────────────────────────
# Frame rendering + encode
# ─────────────────────────────────────────────────────────────────────────────
def render_scene_frame(n, t, mark, logo):
    r = SCENE_RENDERERS[n]
    if n in (1, 3, 7):
        return r(t, mark)
    return r(t)


def render_frames(manifest, mark, logo):
    os.makedirs(FRAME_DIR, exist_ok=True)
    idx = 0
    total = 0
    for n in range(1, 8):
        dur = manifest[str(n)]["duration"]
        nframes = max(1, int(round(dur * FPS)))
        if n > 1:
            for _ in range(int(round(GAP * FPS))):
                frame = render_scene_frame(n, 0.0, mark, logo)
                frame.save(os.path.join(FRAME_DIR, f"frame_{idx:06d}.jpg"), quality=90)
                idx += 1
        for k in range(nframes):
            t = k / max(1, nframes - 1)
            frame = render_scene_frame(n, t, mark, logo)
            frame.save(os.path.join(FRAME_DIR, f"frame_{idx:06d}.jpg"), quality=90)
            idx += 1
            total += 1
            if total % 250 == 0:
                print(f"  ...{total} frames rendered")
    print(f"  rendered {idx} frames total")
    return idx


def encode(master_wav):
    cmd = [FFMPEG, "-y", "-loglevel", "error",
           "-framerate", str(FPS),
           "-start_number", "0",
           "-i", os.path.join(FRAME_DIR, "frame_%06d.jpg"),
           "-i", master_wav,
           "-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "192k",
           "-shortest",
           "-movflags", "+faststart",
           OUT]
    subprocess.run(cmd, check=True)


def main():
    with open(os.path.join(AUDIO_DIR, "manifest.json")) as f:
        manifest = json.load(f)

    print("Building assets...")
    mark, logo = build_assets()

    print("Assembling master audio...")
    master_wav, total_dur = build_master_audio(manifest)
    print(f"  audio duration: {total_dur:.2f}s ({total_dur/60:.2f} min)")

    print("Rendering frames...")
    render_frames(manifest, mark, logo)

    print("Encoding MP4...")
    encode(master_wav)

    size = os.path.getsize(OUT)
    print(f"\n✅ Pitch video: {OUT} ({size/1024/1024:.1f} MB, ~{total_dur:.1f}s)")


if __name__ == "__main__":
    main()
