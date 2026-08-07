"""Reorder hero hierarchy: tournament title first, birthday in the ribbon."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "brand" / "bay-bash-hero.png"

NAVY = (22, 53, 79)
RED = (193, 54, 44)
CREAM = (248, 245, 238)

SCRIPT_FONT = Path(r"C:\Windows\Fonts\AlexBrush-Regular.ttf")
DISPLAY_FONT = Path(r"C:\Windows\Fonts\BarlowCondensed-Bold.ttf")
FALLBACK_DISPLAY = Path(r"C:\Windows\Fonts\ARIALNB.TTF")
FALLBACK_SCRIPT = Path(r"C:\Windows\Fonts\BRUSHSCI.TTF")


def load_font(path: Path, size: int, fallback: Path) -> ImageFont.ImageFont:
    for candidate in (path, fallback):
        try:
            return ImageFont.truetype(str(candidate), size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def locate_ribbon(arr: np.ndarray) -> tuple[int, int, int, int]:
    h, w = arr.shape[:2]
    hits: list[tuple[int, int, int, int]] = []
    for y in range(int(h * 0.35), int(h * 0.85)):
        row = arr[y, w // 2 :]
        dark = (row[:, 0] < 55) & (row[:, 1] < 90) & (row[:, 2] < 120)
        light = (row[:, 0] > 190) & (row[:, 1] > 190) & (row[:, 2] > 190)
        if dark.sum() > 60 and light.sum() > 8:
            xs = np.where(dark)[0] + w // 2
            hits.append((y, int(xs.min()), int(xs.max()), int(light.sum())))
    if not hits:
        raise SystemExit("Could not locate navy banner")
    best = max(hits, key=lambda t: t[3])
    band = [t for t in hits if abs(t[0] - best[0]) < 28]
    y0 = min(t[0] for t in band) - 6
    y1 = max(t[0] for t in band) + 6
    x0 = min(t[1] for t in band) - 10
    x1 = max(t[2] for t in band) + 10
    return x0, y0, x1, y1


def fit_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    font_path: Path,
    fallback: Path,
    max_width: int,
    max_size: int,
    min_size: int = 12,
) -> ImageFont.ImageFont:
    size = max_size
    while size >= min_size:
        font = load_font(font_path, size, fallback)
        bbox = draw.textbbox((0, 0), text, font=font)
        if bbox[2] - bbox[0] <= max_width:
            return font
        size -= 1
    return load_font(font_path, min_size, fallback)


def centered_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.ImageFont,
    cx: int,
    cy: int,
    fill: tuple[int, int, int],
) -> tuple[int, int, int, int]:
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = cx - tw // 2 - bbox[0]
    y = cy - th // 2 - bbox[1]
    draw.text((x, y), text, fill=fill, font=font)
    return x, y, x + tw, y + th


def draw_star(draw: ImageDraw.ImageDraw, cx: int, cy: int, r: int = 10) -> None:
    points = []
    for i in range(8):
        angle = -90 + i * 45
        rad = np.deg2rad(angle)
        radius = r if i % 2 == 0 else r * 0.38
        points.append((cx + radius * np.cos(rad), cy + radius * np.sin(rad)))
    draw.polygon(points, fill=NAVY)


def clone_parchment(im: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    """Cover a box by tiling a clean parchment strip from the right margin."""
    x0, y0, x1, y1 = box
    w, h = im.size
    # Clean source: far-right parchment column (mostly empty paper)
    src_x0 = min(w - 55, w - 1)
    src_x1 = w - 8
    src = im.crop((src_x0, y0, src_x1, y1))
    # Widen by mirroring/tiling
    tiles = []
    needed = x1 - x0
    while sum(t.size[0] for t in tiles) < needed + 40:
        tiles.append(src)
        tiles.append(src.transpose(Image.Transpose.FLIP_LEFT_RIGHT))
    strip = Image.new("RGB", (sum(t.size[0] for t in tiles), y1 - y0))
    ox = 0
    for t in tiles:
        strip.paste(t, (ox, 0))
        ox += t.size[0]
    patch = strip.crop((0, 0, needed, y1 - y0)).filter(
        ImageFilter.GaussianBlur(radius=0.8)
    )

    # Feather left edge into boat/paper blend
    mask = Image.new("L", (needed, y1 - y0), 255)
    feather = 28
    for x in range(feather):
        ImageDraw.Draw(mask).line(
            [(x, 0), (x, y1 - y0)],
            fill=int(255 * (x / feather)),
        )

    out = im.copy()
    out.paste(patch, (x0, y0), mask)
    return out


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    arr = np.array(im)
    h, w = arr.shape[:2]

    rx0, ry0, rx1, ry1 = locate_ribbon(arr)
    print(f"ribbon box: ({rx0},{ry0})-({rx1},{ry1}) size={w}x{h}")

    # Fully cover old title stack with cloned parchment
    cover = (int(w * 0.49), 90, w - 4, ry0 - 4)
    im = clone_parchment(im, cover)
    draw = ImageDraw.Draw(im)

    cx = int(w * 0.74)
    script = fit_text(
        draw,
        "Official-ish",
        SCRIPT_FONT,
        FALLBACK_SCRIPT,
        max_width=int(w * 0.40),
        max_size=84,
    )
    line1 = fit_text(
        draw,
        "FISHING",
        DISPLAY_FONT,
        FALLBACK_DISPLAY,
        max_width=int(w * 0.38),
        max_size=72,
    )
    line2 = fit_text(
        draw,
        "TOURNAMENT",
        DISPLAY_FONT,
        FALLBACK_DISPLAY,
        max_width=int(w * 0.40),
        max_size=64,
    )

    script_h = (
        draw.textbbox((0, 0), "Official-ish", font=script)[3]
        - draw.textbbox((0, 0), "Official-ish", font=script)[1]
    )
    l1_h = (
        draw.textbbox((0, 0), "FISHING", font=line1)[3]
        - draw.textbbox((0, 0), "FISHING", font=line1)[1]
    )
    l2_h = (
        draw.textbbox((0, 0), "TOURNAMENT", font=line2)[3]
        - draw.textbbox((0, 0), "TOURNAMENT", font=line2)[1]
    )

    stack_h = script_h + 10 + l1_h + 4 + l2_h
    stack_top = cover[1] + ((cover[3] - cover[1]) - stack_h) // 2

    script_cy = stack_top + script_h // 2
    xs1, _ys1, xs2, ys2 = centered_text(
        draw, "Official-ish", script, cx, script_cy, RED
    )
    draw_star(draw, xs1 - 20, script_cy, r=9)
    draw_star(draw, xs2 + 20, script_cy, r=9)

    fishing_cy = ys2 + 12 + l1_h // 2
    centered_text(draw, "FISHING", line1, cx, fishing_cy, NAVY)
    tournament_cy = fishing_cy + l1_h // 2 + 6 + l2_h // 2
    centered_text(draw, "TOURNAMENT", line2, cx, tournament_cy, NAVY)

    sample = np.array(im)[ry0 + (ry1 - ry0) // 2, rx0 + 12]
    navy = tuple(int(c) for c in sample)
    draw.rectangle([rx0 + 6, ry0 + 2, rx1 - 6, ry1 - 2], fill=navy)

    ribbon_text = "JENN'S 40TH BIRTHDAY BASH"
    ribbon_font = fit_text(
        draw,
        ribbon_text,
        DISPLAY_FONT,
        FALLBACK_DISPLAY,
        max_width=(rx1 - rx0) - 28,
        max_size=max(12, (ry1 - ry0) - 8),
        min_size=9,
    )
    centered_text(
        draw,
        ribbon_text,
        ribbon_font,
        (rx0 + rx1) // 2,
        (ry0 + ry1) // 2,
        CREAM,
    )

    im.save(SRC, optimize=True)
    print("saved", SRC)


if __name__ == "__main__":
    main()
