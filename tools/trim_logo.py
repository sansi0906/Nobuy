"""Trim transparent borders and overwrite logo.png with the cut version."""
from PIL import Image

src = r"E:\itsme\NoBuy\images\logo_cut.png"
im = Image.open(src).convert("RGBA")
bbox = im.getbbox()
print("bbox:", bbox)
im2 = im.crop(bbox)
# Add a little padding
pad = 10
canvas = Image.new("RGBA", (im2.width + pad*2, im2.height + pad*2), (0,0,0,0))
canvas.paste(im2, (pad, pad), im2)
canvas.save(r"E:\itsme\NoBuy\images\logo.png", "PNG")
print("final size:", canvas.size)
