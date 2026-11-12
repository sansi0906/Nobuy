# tools/seal_gold.py —— 由灰印坯生成金色「点亮」印章
# 做法：拿 seal_off.png 的纸面与线条做亮度映射，换成金色渐变。
# 这样两张图的圆径、双外圈、虚线内圈完全一致，点亮时不会出现尺寸或位移跳变。
# 用法：python tools/seal_gold.py
from PIL import Image

SRC = 'images/seal_off.png'
OUT = 'images/seal_on.png'

CENT = (247, 219, 156)   # 中心亮金
EDGE = (206, 160, 74)    # 边缘暗金
PAPER = 0.955            # 原图纸面亮度基准
RADIUS = 120.0           # 外圈半径（256 画布下 240 直径）


def build():
    src = Image.open(SRC).convert('RGBA')
    w, h = src.size
    cx, cy = w / 2.0, h / 2.0
    px = src.load()

    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    op = out.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            t = min(1.0, dist / RADIUS)
            base = [CENT[i] + (EDGE[i] - CENT[i]) * (t ** 2.0) for i in range(3)]
            luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
            k = (min(1.0, luma / PAPER)) ** 2.2   # 纸面=1，线条自然压深
            op[x, y] = tuple(max(0, min(255, int(base[i] * k))) for i in range(3)) + (a,)

    out.save(OUT, 'PNG', optimize=True)
    print('built', OUT)


if __name__ == '__main__':
    build()
