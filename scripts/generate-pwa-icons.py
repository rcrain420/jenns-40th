#!/usr/bin/env python3
"""Build PWA icons from the existing tournament poster (not a new brand)."""

from pathlib import Path

from PIL import Image

SRC = Path("public/brand/hero-tournament-v2.png")
OUT_PUBLIC = Path("public/icons")
OUT_APP = Path("src/app")
PARCHMENT = (246, 236, 214)  # --paper


def square_from_poster(im: Image.Image) -> Image.Image:
    """Right-weighted square so the title treatment stays in frame."""
    w, h = im.size
    side = min(w, h)
    left = max(0, w - side - int(w * 0.04))
    return im.crop((left, 0, left + side, side))


def fit(im: Image.Image, size: int) -> Image.Image:
    return im.resize((size, size), Image.Resampling.LANCZOS)


def maskable(im: Image.Image, size: int, pad_ratio: float = 0.12) -> Image.Image:
    """Keep artwork inside the Android maskable safe zone."""
    canvas = Image.new("RGB", (size, size), PARCHMENT)
    inner = int(size * (1 - 2 * pad_ratio))
    art = fit(im, inner)
    origin = (size - inner) // 2
    canvas.paste(art, (origin, origin))
    return canvas


def main() -> None:
    poster = Image.open(SRC).convert("RGB")
    art = square_from_poster(poster)
    OUT_PUBLIC.mkdir(parents=True, exist_ok=True)

    fit(art, 192).save(OUT_PUBLIC / "icon-192.png", "PNG")
    fit(art, 512).save(OUT_PUBLIC / "icon-512.png", "PNG")
    maskable(art, 512).save(OUT_PUBLIC / "icon-512-maskable.png", "PNG")
    fit(art, 180).save(OUT_PUBLIC / "apple-touch-icon.png", "PNG")

    fit(art, 192).save(OUT_APP / "icon.png", "PNG")
    fit(art, 180).save(OUT_APP / "apple-icon.png", "PNG")
    print("wrote", list(OUT_PUBLIC.iterdir()))


if __name__ == "__main__":
    main()
