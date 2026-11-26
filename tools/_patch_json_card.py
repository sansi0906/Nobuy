# -*- coding: utf-8 -*-
import io

p = r"E:\itsme\NoBuy\app.json"
s = io.open(p, encoding="utf-8").read()
s = s.replace("#EFF1F2", "#EEF1F3")
s = s.replace('"color": "#98A3AB"', '"color": "#5D6B74"')
s = s.replace('"selectedColor": "#475A69"', '"selectedColor": "#CC5E3A"')
io.open(p, "w", encoding="utf-8").write(s)

p = r"E:\itsme\NoBuy\utils\card.js"
s = io.open(p, encoding="utf-8").read()
pairs = [
    ("ink: '#22282C'", "ink: '#1B2329'"),
    ("ink2: '#6B767E'", "ink2: '#5D6B74'"),
    ("ink3: '#9FAAB2'", "ink3: '#93A1AA'"),
    ("line: '#DFE5E9'", "line: '#DDE4E9'"),
    ("bg: '#FFFFFF'", "bg: '#F4F7F9'"),
]
for old, new in pairs:
    assert old in s, old
    s = s.replace(old, new, 1)

# 金额改品牌橙：两处 fillText('¥'...) 与无金额文案前设置 fillStyle
s = s.replace("""    let x = PAD;
    ctx.fillStyle = COLORS.ink;""", """    let x = PAD;
    ctx.fillStyle = COLORS.brand;""")
s = s.replace("""  ctx.fillStyle = COLORS.ink;
  ctx.font = '600 168px '""", """  ctx.fillStyle = COLORS.brand;
  ctx.font = '600 168px '""", 1)
s = s.replace("  bg: '#F4F7F9'", "  bg: '#F4F7F9',\n  brand: '#CC5E3A'")
io.open(p, "w", encoding="utf-8").write(s)
print("app.json + card.js patched")
