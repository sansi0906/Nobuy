"""Remove dark navy tech background from the NoBuy water-drop logo,
leaving only the orange drop character on a transparent canvas."""
from PIL import Image

src = r"E:\itsme\NoBuy\images\logo.png"
dst = r"E:\itsme\NoBuy\images\logo_cut.png"

im = Image.open(src).convert("RGBA")
px = im.load()
w, h = im.size

for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        # Dark navy background: strongly blue-shifted and dark
        is_navy = (b - r) > 25 and r < 90 and g < 120
        # Light blue glow rings / sparkles: blue-shifted but brighter
        is_glow = (b - r) > 40 and r < 160 and g < 180 and b > 120
        if is_navy or is_glow:
            px[x, y] = (r, g, b, 0)

im.save(dst, "PNG")
print("saved", dst)
