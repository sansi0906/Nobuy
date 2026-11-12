"""生成配色对比板：当前（暖纸 + 陶土橙）vs 三个冷静色候选。

每个方案画一条：迷你界面预览（底色 + 卡片 + 主文字 + 状态块 + 主按钮）
＋ 关键色块与色值，方便直接看差异。
"""
from PIL import Image, ImageDraw, ImageFont

FONT_PATH = r"C:\Windows\Fonts\msyh.ttc"
W, ROW_H, HEAD_H = 1230, 156, 62
PAD = 24

PALETTES = [
    ("当前：暖纸 + 陶土橙", {
        "bg": "#F3F1EC", "card": "#FFFFFF", "line": "#E6E1D8",
        "ink": "#241F1A", "accent": "#B4552D", "accent_soft": "#F7E9DE",
        "cool": "#7A6A57", "cool_bg": "#EFEAE1",
        "done": "#5E6F53", "done_bg": "#E7EDDE", "danger": "#C4382F",
    }),
    ("A 雾蓝灰", {
        "bg": "#EFF1F2", "card": "#FFFFFF", "line": "#DDE3E7",
        "ink": "#22282C", "accent": "#5F7688", "accent_soft": "#E7EDF1",
        "cool": "#5F7688", "cool_bg": "#E7EDF1",
        "done": "#5E7A6E", "done_bg": "#E6EEEA", "danger": "#C4382F",
    }),
    ("B 青灰", {
        "bg": "#EFF1F0", "card": "#FFFFFF", "line": "#DCE4E1",
        "ink": "#212B29", "accent": "#5C7671", "accent_soft": "#E5EDEB",
        "cool": "#5C7671", "cool_bg": "#E5EDEB",
        "done": "#66796A", "done_bg": "#E9EDE7", "danger": "#C4382F",
    }),
    ("C 中性冷灰", {
        "bg": "#F2F2F1", "card": "#FFFFFF", "line": "#E0E0DE",
        "ink": "#22221F", "accent": "#5F6468", "accent_soft": "#E9EAEA",
        "cool": "#5F6468", "cool_bg": "#E9EAEA",
        "done": "#6A7168", "done_bg": "#EBEDEA", "danger": "#C4382F",
    }),
]

CHIPS = [
    ("底", "bg"), ("卡", "card"), ("线", "line"), ("字", "ink"),
    ("强调", "accent"), ("强调浅", "accent_soft"),
    ("冷静", "cool"), ("冷静底", "cool_bg"),
    ("已决定", "done"), ("危险", "danger"),
]

height = HEAD_H + ROW_H * len(PALETTES) + PAD
img = Image.new("RGB", (W, height), "#FFFFFF")
d = ImageDraw.Draw(img)
f_title = ImageFont.truetype(FONT_PATH, 30)
f_name = ImageFont.truetype(FONT_PATH, 24)
f_small = ImageFont.truetype(FONT_PATH, 18)

d.text((PAD, 18), "NoBuy 配色候选（左侧为当前实色，右侧三选一）", font=f_title, fill="#241F1A")

for i, (name, c) in enumerate(PALETTES):
    top = HEAD_H + i * ROW_H
    # 行分隔
    d.line([(PAD, top), (W - PAD, top)], fill="#EDEDEA", width=1)
    d.text((PAD, top + 12), name, font=f_name, fill="#241F1A")

    # 迷你界面预览
    px, py, pw, ph = PAD, top + 48, 300, 92
    d.rectangle([px, py, px + pw, py + ph], fill=c["bg"])
    d.rounded_rectangle([px + 10, py + 10, px + pw - 10, py + ph - 10], radius=10, fill=c["card"])
    d.text((px + 26, py + 22), "双飞燕键鼠", font=f_small, fill=c["ink"])
    d.text((px + 26, py + 46), "冷静中", font=f_small, fill=c["cool"])
    d.rounded_rectangle([px + 84, py + 44, px + 132, py + 64], radius=5, fill=c["cool_bg"])
    d.text((px + 92, py + 46), "还剩 2 天", font=f_small, fill=c["cool"])
    d.rounded_rectangle([px + 210, py + 44, px + 274, py + 64], radius=5, fill=c["accent_soft"])
    d.text((px + 226, py + 46), "记录", font=f_small, fill=c["accent"])
    d.rounded_rectangle([px + 26, py + 70, px + 274, py + 84], radius=6, fill=c["accent"])

    # 色块条
    x = px + pw + 24
    chip_w, chip_h = 70, 52
    for label, key in CHIPS:
        d.rounded_rectangle([x, py, x + chip_w, py + chip_h], radius=6,
                           fill=c[key], outline="#DDDDDA", width=1)
        d.text((x, py + chip_h + 4), label, font=f_small, fill="#6E665C")
        d.text((x, py + chip_h + 24), c[key].upper(), font=f_small, fill="#8C857B")
        x += chip_w + 7

img.save(r"E:\itsme\UI设计\NoBuy-配色候选对比.png", "PNG", optimize=True)
print("ok")
