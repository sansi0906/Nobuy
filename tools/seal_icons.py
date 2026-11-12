"""印章底纹后处理：裁到内容 -> 正方形居中 -> 从中心泛填印面 -> 缩到 256 -> 压缩。"""
import os
from PIL import Image, ImageDraw

SRC_DIR = os.path.join(r"E:\itsme\NoBuy", "images", "raw")
OUT_DIR = os.path.join(r"E:\itsme\NoBuy", "images")
TARGET = 256


def fill_hole(im, fill):
    """把与中心连通的透明区域填成 fill 色。"""
    cx, cy = im.width // 2, im.height // 2
    solid = im.getchannel("A").convert("L").point(lambda v: 255 if v >= 20 else 0)
    if solid.getpixel((cx, cy)) != 0:
        # 中心不透明，说明没有中空，直接返回
        return im
    region = solid.copy()
    ImageDraw.floodfill(region, (cx, cy), 128, thresh=0)
    hole_mask = region.point(lambda v: 255 if v == 128 else 0)
    if hole_mask.getbbox() is None:
        return im
    paint = Image.new("RGBA", im.size, fill)
    return Image.composite(paint, im, hole_mask)


def process(src, dst, fill):
    im = Image.open(src).convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    if bbox:
        im = im.crop(bbox)

    side = max(im.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2))

    canvas = fill_hole(canvas, fill)

    canvas = canvas.resize((TARGET, TARGET), Image.LANCZOS)
    canvas.save(dst, "PNG", optimize=True)
    print(dst, "->", canvas.size, os.path.getsize(dst), "bytes")


process(os.path.join(SRC_DIR, "seal_off_raw.png"), os.path.join(OUT_DIR, "seal_off.png"), (249, 245, 238, 255))
process(os.path.join(SRC_DIR, "seal_on_raw.png"), os.path.join(OUT_DIR, "seal_on.png"), (196, 118, 70, 255))
