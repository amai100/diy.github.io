# -*- coding: utf-8 -*-
"""Generate optimized site images from the original source assets."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SRC_LOGO = ROOT / "index_files" / "logo.png"
SRC_WORK = ROOT / "works_files" / "ppqfqj.jpg"
OUT = ROOT / "assets" / "img"
OUT_WORK = OUT / "works"
OUT.mkdir(parents=True, exist_ok=True)
OUT_WORK.mkdir(parents=True, exist_ok=True)

DARK = (6, 10, 18)
CYAN = (56, 189, 248)
ORANGE = (255, 107, 26)
MUTED = (150, 170, 194)

FONT_CN = "C:/Windows/Fonts/msyhbd.ttc"
FONT_CN_REG = "C:/Windows/Fonts/msyh.ttc"
FONT_MONO = "C:/Windows/Fonts/consola.ttf"
FONT_MONO_BOLD = "C:/Windows/Fonts/consolab.ttf"


def rounded_icon(src: Image.Image, size: int, bg=None) -> Image.Image:
    """Square icon with the circular artwork centered."""
    canvas = Image.new("RGBA", (size, size), (bg or (0, 0, 0, 0)))
    inner = int(size * 0.92)
    art = src.resize((inner, inner), Image.LANCZOS)
    canvas.alpha_composite(art, ((size - inner) // 2, (size - inner) // 2))
    return canvas


def main() -> None:
    logo = Image.open(SRC_LOGO).convert("RGBA")

    # Hero logo, generous quality.
    hero = logo.resize((760, 760), Image.LANCZOS)
    hero.save(OUT / "logo.webp", "WEBP", quality=90, method=6)
    hero.resize((640, 640), Image.LANCZOS).save(
        OUT / "logo-640.webp", "WEBP", quality=90, method=6
    )

    # PWA / touch icons: opaque dark background looks right on every launcher.
    for size, name in [(512, "logo-512.png"), (192, "logo-192.png"), (96, "logo-96.png")]:
        rounded_icon(logo, size, DARK).convert("RGB").save(OUT / name, optimize=True)
    rounded_icon(logo, 180, DARK).convert("RGB").save(
        OUT / "apple-touch-icon.png", optimize=True
    )
    rounded_icon(logo, 64, DARK).convert("RGB").save(
        OUT / "favicon-64.png", optimize=True
    )
    rounded_icon(logo, 32, DARK).convert("RGB").save(
        OUT / "favicon-32.png", optimize=True
    )

    # Static support images copied from the old site.
    Image.open(ROOT / "index_files" / "shequn.png").save(
        OUT / "community-qr.png", optimize=True
    )
    (OUT / "beian.png").write_bytes((ROOT / "index_files" / "beian.png").read_bytes())

    # Work-in-progress photo: crop the monitor, lift contrast a little.
    work = Image.open(SRC_WORK).convert("RGB")
    work = work.crop((18, 58, 1160, 760))
    work = ImageEnhance.Contrast(work).enhance(1.08)
    work = ImageEnhance.Color(work).enhance(1.05)
    work = work.resize((1100, int(1100 * work.height / work.width)), Image.LANCZOS)
    work.save(OUT_WORK / "pingpong-panel.webp", "WEBP", quality=84, method=6)

    # Open Graph cover.
    W, H = 1200, 630
    og = Image.new("RGB", (W, H), DARK)
    draw = ImageDraw.Draw(og, "RGBA")

    # grid
    for x in range(0, W, 40):
        draw.line((x, 0, x, H), fill=(56, 189, 248, 16), width=1)
    for y in range(0, H, 40):
        draw.line((0, y, W, y), fill=(56, 189, 248, 16), width=1)

    # glows
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    g.ellipse((770, 40, 1210, 480), fill=(37, 99, 235, 80))
    g.ellipse((-160, 400, 380, 780), fill=(255, 107, 26, 36))
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    og = Image.alpha_composite(og.convert("RGBA"), glow).convert("RGB")
    draw = ImageDraw.Draw(og, "RGBA")

    # logo
    art = logo.resize((360, 360), Image.LANCZOS)
    mask = Image.new("L", (360, 360), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 359, 359), fill=255)
    og.paste(art, (780, 131), mask)
    draw.ellipse((760, 111, 1160, 511), outline=(56, 189, 248, 90), width=2)
    draw.ellipse((740, 91, 1180, 531), outline=(56, 189, 248, 35), width=1)
    draw.arc((700, 51, 1220, 571), 200, 340, fill=(255, 107, 26, 200), width=3)

    # text
    f_mono = ImageFont.truetype(FONT_MONO, 22)
    f_title = ImageFont.truetype(FONT_CN, 76)
    f_sub = ImageFont.truetype(FONT_CN_REG, 32)
    f_small = ImageFont.truetype(FONT_MONO, 20)

    draw.text((70, 132), "ROBOTICS  ·  MAKER  ·  WORKSHOP", font=f_mono, fill=CYAN)
    draw.rectangle((70, 172, 140, 176), fill=ORANGE)
    draw.text((66, 208), "DIY 机器人工房", font=f_title, fill=(238, 246, 255))
    draw.text(
        (70, 318), "机器人设计 / 制作 / 编程", font=f_sub, fill=(176, 196, 218)
    )
    draw.text(
        (70, 386),
        "把想法，做成会动的机器。",
        font=ImageFont.truetype(FONT_CN_REG, 30),
        fill=(120, 200, 235),
    )

    draw.line((70, 500, 1130, 500), fill=(56, 189, 248, 45), width=1)
    draw.text((70, 526), "diyjqrgf.bbroot.com", font=f_mono, fill=(230, 240, 255))
    draw.text((70, 556), "BILIBILI / XIAOHONGSHU / DOUYIN / CSDN", font=f_small, fill=MUTED)
    draw.text((1010, 556), "EST. DIY", font=f_small, fill=ORANGE)

    # corner marks
    for cx, cy, dx, dy in [(40, 40, 1, 1), (1160, 40, -1, 1), (40, 590, 1, -1), (1160, 590, -1, -1)]:
        draw.line((cx, cy, cx + 18 * dx, cy), fill=(56, 189, 248, 160), width=2)
        draw.line((cx, cy, cx, cy + 18 * dy), fill=(56, 189, 248, 160), width=2)

    og.save(OUT / "og-cover.jpg", "JPEG", quality=88, optimize=True, progressive=True)

    # Report
    for p in sorted(OUT.rglob("*")):
        if p.is_file():
            print(f"{p.relative_to(ROOT)}  {p.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
