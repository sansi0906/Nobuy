# tools/make_tab_icons.py
# 生成 3 个 tabBar 图标：常态描边浅灰 / 选中实心深灰蓝，81x81 透明 PNG
# 用 4 倍尺寸绘制后缩放，边缘更平滑
from PIL import Image, ImageDraw

SIZE = 81
SCALE = 4
S = SIZE * SCALE

NORMAL = (152, 163, 171)   # #98A3AB 未选中：浅
ACTIVE = (71, 90, 105)     # #475A69 选中：深，实心


def new_canvas():
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def draw_list(d, color, solid):
    """首页：清单 —— 三条横线，左侧三个小圆点"""
    if solid:
        left, right = int(20 * SCALE), int(63 * SCALE)
        for y in [22, 40, 58]:
            yy = int(y * SCALE)
            r = int(4.2 * SCALE)
            d.ellipse([left - r, yy - r, left + r, yy + r], fill=color)
            d.rounded_rectangle([left + int(12 * SCALE), yy - int(3.4 * SCALE),
                                 right, yy + int(3.4 * SCALE)], radius=int(3.4 * SCALE), fill=color)
        return
    w = int(3.2 * SCALE)
    left, right = int(18 * SCALE), int(64 * SCALE)
    for y in [22, 40, 58]:
        yy = int(y * SCALE)
        d.ellipse([left, yy - int(3.4 * SCALE), left + int(6.8 * SCALE), yy + int(3.4 * SCALE)], fill=color)
        d.line([left + int(12 * SCALE), yy, right, yy], fill=color, width=w)


def draw_trash(d, color, solid):
    """回收站：桶盖 + 桶身"""
    if solid:
        # 桶身：上宽下窄的实心梯形
        d.polygon([(int(21 * SCALE), int(26 * SCALE)), (int(60 * SCALE), int(26 * SCALE)),
                   (int(55 * SCALE), int(64 * SCALE)), (int(26 * SCALE), int(64 * SCALE))], fill=color)
        # 桶盖
        d.rounded_rectangle([int(17 * SCALE), int(19 * SCALE), int(64 * SCALE), int(24 * SCALE)],
                            radius=int(2.5 * SCALE), fill=color)
        # 提手
        d.rounded_rectangle([int(33 * SCALE), int(13 * SCALE), int(48 * SCALE), int(18 * SCALE)],
                            radius=int(2.5 * SCALE), fill=color)
        return
    w = int(3.4 * SCALE)
    left, right = int(20 * SCALE), int(61 * SCALE)
    d.line([int(22 * SCALE), int(26 * SCALE), int(26 * SCALE), int(64 * SCALE)], fill=color, width=w)
    d.line([int(59 * SCALE), int(26 * SCALE), int(55 * SCALE), int(64 * SCALE)], fill=color, width=w)
    d.line([int(26 * SCALE), int(64 * SCALE), int(55 * SCALE), int(64 * SCALE)], fill=color, width=w)
    d.line([int(17 * SCALE), int(21 * SCALE), int(64 * SCALE), int(21 * SCALE)], fill=color, width=w)
    d.line([int(33 * SCALE), int(14 * SCALE), int(48 * SCALE), int(14 * SCALE)], fill=color, width=w)
    d.line([int(33 * SCALE), int(15 * SCALE), int(33 * SCALE), int(20 * SCALE)], fill=color, width=w)
    d.line([int(48 * SCALE), int(15 * SCALE), int(48 * SCALE), int(20 * SCALE)], fill=color, width=w)


def draw_mine(d, color, solid):
    """我的：头 + 肩"""
    cx = S // 2
    head_r = int(12 * SCALE)
    head_cy = int(29 * SCALE)
    if solid:
        d.ellipse([cx - head_r, head_cy - head_r, cx + head_r, head_cy + head_r], fill=color)
        d.pieslice([cx - int(22 * SCALE), int(45 * SCALE), cx + int(22 * SCALE), int(89 * SCALE)],
                   start=180, end=360, fill=color)
        return
    w = int(3.4 * SCALE)
    d.ellipse([cx - head_r, head_cy - head_r, cx + head_r, head_cy + head_r], outline=color, width=w)
    d.arc([cx - int(22 * SCALE), int(48 * SCALE), cx + int(22 * SCALE), int(92 * SCALE)],
          start=180, end=360, fill=color, width=w)


ICONS = {
    'tab_home': draw_list,
    'tab_trash': draw_trash,
    'tab_mine': draw_mine,
}


def main():
    for name, fn in ICONS.items():
        for suffix, color, solid in (('', NORMAL, False), ('_on', ACTIVE, True)):
            img, d = new_canvas()
            fn(d, color, solid)
            out = img.resize((SIZE, SIZE), Image.LANCZOS)
            path = 'images/%s%s.png' % (name, suffix)
            out.save(path, 'PNG', optimize=True)
            print('written', path)


if __name__ == '__main__':
    main()
