"""Clean up remaining cyan sparkle pixels around the drop."""
from PIL import Image
src = r"E:\itsme\NoBuy\images\logo.png"
im = Image.open(src).convert("RGBA")
px = im.load()
w, h = im.size
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if a == 0:
            continue
        # Remove any remaining cyan / light blue sparkle pixels
        if b > r + 30 and g > r + 10 and b > 120:
            px[x, y] = (r, g, b, 0)
im.save(src, "PNG")
print("cleaned")
