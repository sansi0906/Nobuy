# tools/recolor_blue.py —— 把橙色系图片（Logo 水滴、点亮印章）色相转到冷静蓝
# 只对饱和度足够的暖色像素做色相旋转，灰色/白色不受影响
import colorsys
from PIL import Image

TARGET_BLUE_HUE = 210.0   # 目标色相（度）
ORANGE_MAX = 50.0         # 只处理 h ≤ 50 的暖色
MIN_SAT = 0.10


def shift(img):
    img = img.convert('RGBA')
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            hh, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            deg = hh * 360.0
            if s >= MIN_SAT and deg <= ORANGE_MAX:
                new_deg = TARGET_BLUE_HUE + (deg - 20.0) * 0.35   # 保留一点原始渐变差
                new_deg %= 360.0
                nr, ng, nb = colorsys.hsv_to_rgb(new_deg / 360.0, s, v)
                px[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
    return img


def main():
    for path in ['images/logo.png', 'images/seal_on.png']:
        img = Image.open(path)
        out = shift(img)
        out.save(path, 'PNG', optimize=True)
        print('recolored', path, out.size)


if __name__ == '__main__':
    main()
