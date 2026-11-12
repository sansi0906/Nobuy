"""生成列表删除按钮用的白色垃圾桶图标（与 tabBar 垃圾桶同一套几何，保证图标风格统一）。

输出 images/trash_white.png，81×81 透明底，白色实心。
"""
from PIL import Image, ImageDraw

SIZE = 81
SCALE = 4
S = SIZE * SCALE

WHITE = (255, 255, 255, 255)


def main():
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # 桶身：与 tab 图标完全一致的梯形
    d.polygon([(int(21 * SCALE), int(26 * SCALE)), (int(60 * SCALE), int(26 * SCALE)),
               (int(55 * SCALE), int(64 * SCALE)), (int(26 * SCALE), int(64 * SCALE))], fill=WHITE)
    # 桶盖
    d.rounded_rectangle([int(17 * SCALE), int(19 * SCALE), int(64 * SCALE), int(24 * SCALE)],
                        radius=int(2.5 * SCALE), fill=WHITE)
    # 提手
    d.rounded_rectangle([int(33 * SCALE), int(13 * SCALE), int(48 * SCALE), int(18 * SCALE)],
                        radius=int(2.5 * SCALE), fill=WHITE)

    out = img.resize((SIZE, SIZE), Image.LANCZOS)
    out.save(r"E:\itsme\NoBuy\images\trash_white.png", "PNG", optimize=True)
    print("written images/trash_white.png")


if __name__ == '__main__':
    main()
