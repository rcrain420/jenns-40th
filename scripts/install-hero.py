from pathlib import Path

import numpy as np
from PIL import Image

src = Path(
    r"C:\Users\acrai\.cursor\projects\c-dev-Jenns-40th\assets"
    r"\c__Users_acrai_AppData_Roaming_Cursor_User_workspaceStorage_"
    r"c0594686ce172ce91f459b3c227eb041_images_ChatGPT_Image_Aug_7__2026__"
    r"12_46_21_AM-4b1a79ed-4387-4abd-8a64-8251f2676f65.png"
)
dst = Path(r"c:\dev\Jenns 40th\public\brand\bay-bash-hero.png")

im = Image.open(src).convert("RGB")
arr = np.array(im)
h, w = arr.shape[:2]

# Find end of baked-in navy nav bar
cut = 0
for y in range(0, min(180, h)):
    row = arr[y]
    dark = ((row[:, 0] < 40) & (row[:, 1] < 55) & (row[:, 2] < 90)).mean()
    if y > 25 and dark < 0.72:
        streak_ok = True
        for yy in range(y, min(y + 8, h)):
            r = arr[yy]
            d = ((r[:, 0] < 40) & (r[:, 1] < 55) & (r[:, 2] < 90)).mean()
            if d > 0.88:
                streak_ok = False
                break
        if streak_ok:
            cut = y
            break

print(f"size={w}x{h} cut={cut}")
hero = im.crop((0, cut, w, h))

hw, hh = hero.size
target = 16 / 9
ratio = hw / hh
if abs(ratio - target) > 0.08:
    if ratio > target:
        new_w = int(hh * target)
        left = (hw - new_w) // 2
        hero = hero.crop((left, 0, left + new_w, hh))
    else:
        new_h = int(hw / target)
        top = (hh - new_h) // 2
        hero = hero.crop((0, top, hw, top + new_h))

hero = hero.resize((1536, 864), Image.Resampling.LANCZOS)
hero.save(dst, optimize=True, quality=92)
print("saved", dst, hero.size)
