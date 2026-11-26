# -*- coding: utf-8 -*-
import io
p = r"E:\itsme\NoBuy\pages\about\about.wxss"
s = io.open(p, encoding="utf-8").read()
pairs = [
(".logo {\n  width: 144rpx;\n  height: 160rpx;\n}",
 ".logo {\n  width: 144rpx;\n  height: 144rpx;\n}"),
(".name {\n  margin-top: 24rpx;\n  font-size: 32rpx; font-weight: 700;",
 ".name {\n  margin-top: 24rpx;\n  font-size: 34rpx; font-weight: 700;"),
(".slogan {\n  margin-top: 8rpx;\n  font-size: 24rpx; color: var(--ink-2);\n}",
 ".slogan {\n  margin-top: 10rpx;\n  font-size: 22rpx; color: var(--ink-3); letter-spacing: 1rpx;\n}"),
(".sec-title {\n  font-size: 24rpx; font-weight: 600; color: var(--ink-2);\n  letter-spacing: 1rpx;\n  margin-bottom: 16rpx;\n}",
 ".sec-title {\n  font-size: 26rpx; font-weight: 700; color: var(--ink);\n  letter-spacing: 1rpx;\n  margin-bottom: 16rpx;\n  padding-left: 16rpx; border-left: 6rpx solid var(--accent);\n  line-height: 1.2;\n}"),
(".sec-body {\n  font-size: 24rpx; color: var(--ink);\n  line-height: 1.8;\n  margin-bottom: 16rpx;\n}",
 ".sec-body {\n  font-size: 26rpx; color: var(--ink);\n  line-height: 1.75;\n  margin-bottom: 16rpx;\n}"),
(".item-text {\n  flex: 1;\n  font-size: 24rpx; color: var(--ink);\n  line-height: 1.7;\n}",
 ".item-text {\n  flex: 1;\n  font-size: 26rpx; color: var(--ink);\n  line-height: 1.7;\n}"),
(".item-no {\n  width: 48rpx; flex-shrink: 0;\n  font-size: 24rpx; color: var(--ink-3);\n  letter-spacing: 1rpx;\n}",
 ".item-no {\n  width: 48rpx; flex-shrink: 0;\n  font-size: 22rpx; color: var(--accent);\n  letter-spacing: 1rpx; font-weight: 600;\n  font-variant-numeric: tabular-nums;\n}"),
(".row-label {\n  font-size: 24rpx; color: var(--ink-2);\n}",
 ".row-label {\n  font-size: 26rpx; color: var(--ink-2);\n}"),
(".row-value {\n  font-size: 24rpx; color: var(--ink);\n}",
 ".row-value {\n  font-size: 26rpx; color: var(--ink); font-variant-numeric: tabular-nums;\n}"),
]
for old, new in pairs:
    assert old in s, old[:30]
    s = s.replace(old, new)
io.open(p, "w", encoding="utf-8").write(s)
print("about patched")
