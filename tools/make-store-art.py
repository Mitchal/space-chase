# Google Play art: the 1024x500 feature graphic, and phone screenshots cropped to Play's 2:1 limit.
# Usage: python tools/make-store-art.py [screenshot.png ...]   → store/feature-graphic.png, store/screenshot-N.png
# Needs Pillow. Screenshots: capture from a phone with  adb exec-out screencap -p > shot.png
import sys, math, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'store')
os.makedirs(OUT, exist_ok=True)
BG, SHIP, MISSILE, ROCK_EDGE, ROCK_FILL, WAVE = (11, 13, 18), (124, 242, 200), (255, 122, 89), (201, 162, 122), (31, 37, 51), (255, 77, 109)

def font(size, bold=True):
    for name in (['segoeuib.ttf', 'arialbd.ttf'] if bold else ['segoeui.ttf', 'arial.ttf']):
        try: return ImageFont.truetype(name, size)
        except OSError: pass
    return ImageFont.load_default()

def missile(d, x, y, a, s):
    pts = [(13, 0), (-9, 8), (-5, 0), (-9, -8)]
    d.polygon([(x + (px * math.cos(a) - py * math.sin(a)) * s, y + (px * math.sin(a) + py * math.cos(a)) * s) for px, py in pts], fill=MISSILE)

def feature_graphic():
    S = 2  # draw at 2x, then downsample: smooth edges
    w, h = 1024 * S, 500 * S
    img = Image.new('RGB', (w, h), BG)
    d = ImageDraw.Draw(img)
    for x in range(0, w, 40 * S): d.line([(x, 0), (x, h)], fill=(21, 26, 37), width=S)
    for y in range(0, h, 40 * S): d.line([(0, y), (w, y)], fill=(21, 26, 37), width=S)
    # The death wave on the left: a red gradient.
    for x in range(0, 150 * S):
        k = 1 - x / (150 * S)
        d.line([(x, 0), (x, h)], fill=tuple(int(BG[i] + (WAVE[i] - BG[i]) * k * 0.85) for i in range(3)))
    for cx, cy, r in [(250, 110, 46), (430, 400, 70), (560, 70, 30), (990, 470, 44)]:
        d.ellipse([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S], fill=ROCK_FILL, outline=ROCK_EDGE, width=3 * S)
    # Glow under the ship.
    glow = Image.new('RGB', (w, h), (0, 0, 0))
    ImageDraw.Draw(glow).ellipse([(540 - 34) * S, (260 - 34) * S, (540 + 34) * S, (260 + 34) * S], fill=SHIP)
    glow = glow.filter(ImageFilter.GaussianBlur(28 * S))
    img = Image.blend(img, Image.composite(glow, img, glow.convert('L')), 0.8)
    d = ImageDraw.Draw(img)
    d.ellipse([(540 - 16) * S, (260 - 16) * S, (540 + 16) * S, (260 + 16) * S], fill=SHIP)
    for x, y, a in [(470, 235, 0.25), (410, 300, -0.4), (350, 210, 0.15), (300, 320, -0.3)]:
        missile(d, x * S, y * S, a, 2.1 * S)
    d.text((650 * S, 112 * S), 'SPACE', font=font(92 * S), fill=(232, 236, 243))
    d.text((650 * S, 202 * S), 'CHASE', font=font(92 * S), fill=(232, 236, 243))
    d.text((656 * S, 318 * S), 'Lead the missiles. Outrun the wave.', font=font(21 * S, bold=False), fill=(170, 178, 196))
    d.text((656 * S, 350 * S), 'A new daily course every day.', font=font(21 * S, bold=False), fill=(185, 196, 255))
    img.resize((1024, 500), Image.LANCZOS).save(os.path.join(OUT, 'feature-graphic.png'))

# Play allows at most 2:1 for screenshots; phones are wider, so crop the middle.
def screenshot(path, n):
    im = Image.open(path).convert('RGB')
    w, h = im.size
    if w > 2 * h:
        cut = (w - 2 * h) // 2
        im = im.crop((cut, 0, cut + 2 * h, h))
    im.save(os.path.join(OUT, f'screenshot-{n}.png'))

feature_graphic()
for i, p in enumerate(sys.argv[1:], 1): screenshot(p, i)
print('store/: feature graphic' + (f' + {len(sys.argv) - 1} screenshots' if len(sys.argv) > 1 else ''))
