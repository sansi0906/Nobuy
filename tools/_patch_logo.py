# -*- coding: utf-8 -*-
import io
p = r"E:\itsme\NoBuy\tools\v124_assets.py"
s = io.open(p, encoding="utf-8").read()
start = s.index("def drop_poly(size):")
end = s.index("def make_logo(")
new = '''def drop_poly(size):
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


'''
io.open(p, "w", encoding="utf-8").write(s[:start] + new + s[end:])
print("ok")
