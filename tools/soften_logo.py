# tools/soften_logo.py —— 把 Logo 的高饱和蓝压到与界面强调色一致的低饱和雾蓝
import colorsys
from PIL import Image

TARGET_HUE = 210.0
MAX_SAT = 0.46
MAX_VAL = 0.80


def soften(path):
    img = Image.open(path).convert('RGBA')
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            hh, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            if s < 0.12:
                continue          # 白/灰/黑不动
            ns = min(s, MAX_SAT)
            nv = min(v, MAX_VAL)
            nr, ng, nb = colorsys.hsv_to_rgb(TARGET_HUE / 360.0, ns, nv)
            px[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
    img.save(path, 'PNG', optimize=True)
    print('softened', path)


if __name__ == '__main__':
    soften('images/logo.png')
