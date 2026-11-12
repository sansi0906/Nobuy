"""把 UI设计/firstsoft.png 做成小程序可用的透明底 logo。

firstsoft.png 是深蓝底的橙色水滴吉祥物，直接放进圆形头像/空态会带一块深蓝方块。
这里按"蓝色通道明显高于红绿"的规则剔除底图与科技光圈，保留水滴本体，
再按水滴外轮廓裁紧、缩放导出。
"""
from PIL import Image, ImageFilter

SRC = r"E:\itsme\UI设计\firstsoft.png"
OUT = r"E:\itsme\NoBuy\images\logo.png"
SIZE = 300  # 导出边长（页面里用 rpx 缩放，留足清晰度）

img = Image.open(SRC).convert("RGB")
w, h = img.size
px = img.load()

mask = Image.new("L", (w, h), 0)
mp = mask.load()
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        # 蓝色明显主导 => 底图 / 光圈 / 青色光晕；青绿（g、b 同时远高于 r）=> 底座投影
        if b - max(r, g) < 12 and not (g - r > 60 and b - r > 60):
            mp[x, y] = 255

bbox = mask.getbbox()
mask = mask.crop(bbox)
rgb = img.crop(bbox)

# 1px 羽化，避免锯齿
mask = mask.filter(ImageFilter.GaussianBlur(1))

side = max(mask.size)
canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
offset = ((side - mask.size[0]) // 2, (side - mask.size[1]) // 2)
rgb2 = Image.new("RGB", (side, side), (255, 255, 255))
rgb2.paste(rgb, offset)
mask2 = Image.new("L", (side, side), 0)
mask2.paste(mask, offset)

out = rgb2.convert("RGBA")
out.putalpha(mask2)
out = out.resize((SIZE, SIZE), Image.LANCZOS)
out.save(OUT, "PNG", optimize=True)
print("written", OUT, out.size, "裁切区域", bbox)
