# -*- coding: utf-8 -*-
import io
p = r"E:\itsme\NoBuy\pages\mine\mine.wxss"
s = io.open(p, encoding="utf-8").read()

pairs = [
(".stat-num {\n  font-size: 40rpx; font-weight: 700; color: var(--ink);\n}",
 ".stat-num {\n  font-size: 52rpx; font-weight: 600; color: var(--ink);\n  font-family: \"Songti SC\", \"Noto Serif CJK SC\", \"Times New Roman\", serif;\n  line-height: 1.2;\n}"),
(".stat-money { color: var(--accent-deep); }",
 ".stat-money { color: var(--accent-deep); }\n.stat-unit { font-size: 22rpx; color: var(--ink-3); margin-left: 6rpx; }"),
(".stats {\n  display: flex; align-items: center;\n  padding: 12rpx 0 24rpx\n}",
 ".stats {\n  display: flex; align-items: center;\n  padding: 20rpx 0 28rpx\n}"),
]
for old, new in pairs:
    assert old in s, old[:30]
    s = s.replace(old, new)
io.open(p, "w", encoding="utf-8").write(s)
print("mine.wxss patched")
