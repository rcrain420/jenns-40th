#!/usr/bin/env python3
"""Build PWA icons from Aaron's official square tournament artwork."""

from collections import deque
from pathlib import Path

from PIL import Image

SRC = Path("public/brand/official-app-icon.png")
OUT_PUBLIC = Path("public/icons")
OUT_APP = Path("src/app")
NAVY = (22, 53, 79)  # --navy / #16354f
# Android maskable safe zone is the inner ~80%. Top script + stars sit near the
# edge of the source, so pad extra with navy (same as the art border).
MASKABLE_PAD = 0.20


def fill_corner_voids(im: Image.Image, fill: tuple[int, int, int] = NAVY) -> Image.Image:
    """Replace near-black rounded-corner padding with navy so OS masks stay clean."""
    rgb = im.convert("RGB")
    pixels = rgb.load()
    w, h = rgb.size
    seen: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque([(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)])
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or x < 0 or y < 0 or x >= w or y >= h:
            continue
        r, g, b = pixels[x, y]
        near_black = r <= 18 and g <= 18 and b <= 22
        near_white = r >= 245 and g >= 245 and b >= 245
        if not near_black and not near_white:
            continue
        seen.add((x, y))
        pixels[x, y] = fill
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return rgb


def fit(im: Image.Image, size: int) -> Image.Image:
    return im.resize((size, size), Image.Resampling.LANCZOS)


def maskable(im: Image.Image, size: int, pad_ratio: float = MASKABLE_PAD) -> Image.Image:
    canvas = Image.new("RGB", (size, size), NAVY)
    inner = int(size * (1 - 2 * pad_ratio))
    art = fit(im, inner)
    origin = (size - inner) // 2
    canvas.paste(art, (origin, origin))
    return canvas


def main() -> None:
    art = fill_corner_voids(Image.open(SRC))
    OUT_PUBLIC.mkdir(parents=True, exist_ok=True)

    fit(art, 192).save(OUT_PUBLIC / "icon-192.png", "PNG")
    fit(art, 512).save(OUT_PUBLIC / "icon-512.png", "PNG")
    maskable(art, 512).save(OUT_PUBLIC / "icon-512-maskable.png", "PNG")
    fit(art, 180).save(OUT_PUBLIC / "apple-touch-icon.png", "PNG")
    fit(art, 32).save(OUT_PUBLIC / "icon-32.png", "PNG")

    # Next.js decodes app/favicon.ico as ICO-wrapped PNG and requires RGBA.
    ico_16 = fit(art, 16).convert("RGBA")
    ico_32 = fit(art, 32).convert("RGBA")
    ico_32.save(
        OUT_APP / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32)],
        append_images=[ico_16],
    )
    ico_32.save(
        Path("public/favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32)],
        append_images=[ico_16],
    )

    fit(art, 192).save(OUT_APP / "icon.png", "PNG")
    fit(art, 180).save(OUT_APP / "apple-icon.png", "PNG")
    print("wrote", sorted(p.name for p in OUT_PUBLIC.iterdir()))


if __name__ == "__main__":
    main()
