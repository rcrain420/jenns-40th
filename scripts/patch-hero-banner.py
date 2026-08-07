"""Replace UNOFFICIAL FISHING TOURNAMENT ribbon text on bay-bash-hero.png."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "brand" / "bay-bash-hero.png"


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    arr = np.array(im)
    h, w = arr.shape[:2]

    # Locate banner: dark navy band with white lettering, right half
    hits: list[tuple[int, int, int, int]] = []
    for y in range(int(h * 0.35), int(h * 0.75)):
        row = arr[y, w // 2 :]
        dark = (row[:, 0] < 55) & (row[:, 1] < 90) & (row[:, 2] < 120)
        light = (row[:, 0] > 190) & (row[:, 1] > 190) & (row[:, 2] > 190)
        if dark.sum() > 60 and light.sum() > 8:
            xs_d = np.where(dark)[0] + w // 2
            hits.append((y, int(xs_d.min()), int(xs_d.max()), int(light.sum())))

    if not hits:
        raise SystemExit("Could not locate navy banner")

    ys = [t[0] for t in hits]
    x0 = min(t[1] for t in hits) - 8
    x1 = max(t[2] for t in hits) + 8
    y0 = min(ys) - 4
    y1 = max(ys) + 4

    # Tighten to contiguous band around densest white-text rows
    best = max(hits, key=lambda t: t[3])
    band_rows = [t for t in hits if abs(t[0] - best[0]) < 28]
    y0 = min(t[0] for t in band_rows) - 6
    y1 = max(t[0] for t in band_rows) + 6
    x0 = min(t[1] for t in band_rows) - 10
    x1 = max(t[2] for t in band_rows) + 10

    print(f"banner box: ({x0},{y0})-({x1},{y1}) size={w}x{h}")

    # Sample navy fill color from left of banner interior
    sample = arr[y0 + (y1 - y0) // 2, x0 + 12]
    navy = tuple(int(c) for c in sample)
    print("navy", navy)

    draw = ImageDraw.Draw(im)
    # Cover old lettering (keep ribbon edge notches by not painting far corners hard)
    pad_y = 2
    draw.rectangle([x0 + 6, y0 + pad_y, x1 - 6, y1 - pad_y], fill=navy)

    text = "OFFICIAL-ISH FISHING TOURNAMENT"
    # Prefer a condensed bold face if available
    font = None
    for candidate in [
        r"C:\Windows\Fonts\arialbd.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\impact.ttf",
    ]:
        try:
            font = ImageFont.truetype(candidate, size=max(14, (y1 - y0) - 10))
            break
        except OSError:
            continue
    if font is None:
        font = ImageFont.load_default()

    # Fit text to ribbon width
    box_w = (x1 - x0) - 28
    size = (y1 - y0) - 8
    while size >= 10:
        try:
            font = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", size=size)
        except OSError:
            font = ImageFont.load_default()
            break
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        if tw <= box_w:
            break
        size -= 1

    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = x0 + ((x1 - x0) - tw) // 2 - bbox[0]
    ty = y0 + ((y1 - y0) - th) // 2 - bbox[1]
    draw.text((tx, ty), text, fill=(248, 245, 238), font=font)

    im.save(SRC, optimize=True)
    print("saved", SRC)


if __name__ == "__main__":
    main()
