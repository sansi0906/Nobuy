# -*- coding: utf-8 -*-
"""v1.2.4 第 1 步：设计 token / logo / tabBar 图标 / 成果卡配色。"""
import io, math, os
from PIL import Image, ImageDraw

ROOT = r"E:\itsme\NoBuy"
IMG = os.path.join(ROOT, "images")

ORANGE = (204, 94, 58, 255)
INK2 = (93, 107, 116, 255)

SS = 4


def drop_poly(size):
    """水滴轮廓：顶点 + 两条切线（与圆相切，接点处光滑）+ 底部圆弧。"""
    s = float(size)
    cx = 0.5 * s
    ay = 0.11 * s
    cy = 0.615 * s
    r = 0.295 * s
    al = math.asin(min(1.0, r / (cy - ay)))
    pts = [(cx, ay),
           (cx + r * math.sin(al), cy - r * math.cos(al))]
    f0, f1 = al - math.pi / 2, 1.5 * math.pi - al
    for i in range(49):
        f = f0 + (f1 - f0) * i / 48
        pts.append((cx + r * math.cos(f), cy + r * math.sin(f)))
    pts.append((cx - r * math.sin(al), cy - r * math.cos(al)))
    return pts


def make_logo(px=512):
    big = px * SS
    im = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.polygon(drop_poly(big), fill=ORANGE)
    s = float(big)
    cy = 0.615 * s
    bw, bh, gap = 0.082 * s, 0.255 * s, 0.088 * s
    x0 = 0.5 * s - gap / 2 - bw
    for i in range(2):
        d.rounded_rectangle((x0 + i * (bw + gap), cy - bh / 2,
                             x0 + i * (bw + gap) + bw, cy + bh / 2),
                            radius=0.024 * s, fill=(255, 255, 255, 255))
    return im.resize((px, px), Image.LANCZOS)


def canvas(px):
    big = px * SS
    im = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im), float(big)


def icon_home(color):
    im, d, s = canvas(81)
    d.rounded_rectangle((s * 0.24, s * 0.24, s * 0.76, s * 0.76), radius=s * 0.06,
                        outline=color, width=int(s * 0.055))
    for i in range(3):
        y = s * (0.38 + i * 0.13)
        d.line((s * 0.36, y, s * (0.64 - (0.08 if i == 2 else 0)), y), fill=color, width=int(s * 0.05))
    return im.resize((81, 81), Image.LANCZOS)


def icon_trash(color):
    im, d, s = canvas(81)
    w = int(s * 0.055)
    d.line((s * 0.24, s * 0.30, s * 0.76, s * 0.30), fill=color, width=w)
    d.line((s * 0.38, s * 0.22, s * 0.62, s * 0.22), fill=color, width=w)
    d.polygon([(s * 0.30, s * 0.34), (s * 0.70, s * 0.34), (s * 0.63, s * 0.78), (s * 0.37, s * 0.78)],
              outline=color, width=w)
    for i in range(2):
        x = s * (0.44 + i * 0.12)
        d.line((x, s * 0.44, x, s * 0.68), fill=color, width=int(s * 0.045))
    return im.resize((81, 81), Image.LANCZOS)


def icon_mine(color):
    im, d, s = canvas(81)
    w = int(s * 0.055)
    d.ellipse((s * 0.33, s * 0.20, s * 0.67, s * 0.54), outline=color, width=w)
    d.arc((s * 0.22, s * 0.52, s * 0.78, s * 0.92), 200, 340, fill=color, width=w)
    return im.resize((81, 81), Image.LANCZOS)


def save(im, name):
    path = os.path.join(IMG, name)
    im.save(path, "PNG", optimize=True)
    return name, os.path.getsize(path)


def main():
    outs = []
    outs.append(save(make_logo(512), "logo.png"))
    for name, fn in (("tab_home", icon_home), ("tab_trash", icon_trash), ("tab_mine", icon_mine)):
        outs.append(save(fn(INK2), name + ".png"))
        outs.append(save(fn(ORANGE), name + "_on.png"))
    for n, sz in outs:
        print(n, sz)


if __name__ == "__main__":
    main()
