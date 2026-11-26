# -*- coding: utf-8 -*-
import io
p = r"E:\itsme\NoBuy\pages\mine\mine.wxss"
s = io.open(p, encoding="utf-8").read()
pairs = [
(".rec-title {\n  font-size: 24rpx; color: var(--ink-2); font-weight: 600;\n  padding-bottom: 24rpx\n}",
 ".rec-title {\n  font-size: 26rpx; color: var(--ink); font-weight: 700;\n  padding: 0 0 20rpx 16rpx; border-left: 6rpx solid var(--accent);\n  line-height: 1.2; margin-left: 0; letter-spacing: 1rpx;\n}"),
(".ach-metric-num {\n  font-size: 40rpx; font-weight: 700; color: var(--ink); line-height: 1.2;",
 ".ach-metric-num {\n  font-size: 48rpx; font-weight: 600; color: var(--ink); line-height: 1.2;\n  font-family: \"Songti SC\", \"Noto Serif CJK SC\", \"Times New Roman\", serif;"),
(".ach-more-text { flex: 1; font-size: 28rpx; color: var(--accent-deep); font-weight: 600; }",
 ".ach-more-text { flex: 1; font-size: 28rpx; color: var(--ink); font-weight: 600; }"),
]
for old, new in pairs:
    assert old in s, old[:30]
    s = s.replace(old, new)
io.open(p, "w", encoding="utf-8").write(s)
print("mine polish ok")
