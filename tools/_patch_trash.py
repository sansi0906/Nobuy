# -*- coding: utf-8 -*-
import io
p = r"E:\itsme\NoBuy\pages\trash\trash.wxss"
s = io.open(p, encoding="utf-8").read()
pairs = [
(".item { margin-bottom: 24rpx }",
 ".item { margin-bottom: 20rpx }"),
(".item-price {\n  margin-top: 8rpx; font-size: 24rpx; font-weight: 600; color: var(--accent-deep);\n  white-space: nowrap;\n}",
 ".item-price {\n  margin-top: 8rpx; font-size: 28rpx; font-weight: 600; color: var(--accent-deep);\n  white-space: nowrap;\n  font-family: \"Songti SC\", \"Noto Serif CJK SC\", \"Times New Roman\", serif;\n}"),
(".actions .btn { flex: 1; padding: 16rpx 0; font-size: 24rpx; }",
 ".actions .btn { flex: 1; padding: 18rpx 0; font-size: 24rpx; }"),
(".btn-restore {\n  background: var(--accent-soft);\n  color: var(--accent-deep);\n}",
 ".btn-restore {\n  background: var(--accent-soft);\n  color: var(--accent-deep);\n  border: 1rpx solid var(--a-100);\n}"),
(".clear-all {\n  margin: 32rpx 0 24rpx; text-align: center;\n  font-size: 24rpx; font-weight: 600; color: var(--danger);\n  padding: 24rpx 0\n}",
 ".clear-all {\n  margin: 32rpx 0 24rpx; text-align: center;\n  font-size: 24rpx; color: var(--danger);\n  padding: 24rpx 0\n}"),
(".empty-logo { width: 160rpx; height: 180rpx; opacity: 0.5; }",
 ".empty-logo { width: 152rpx; height: 152rpx; opacity: 0.45; }"),
(".empty-title { margin-top: 24rpx; font-size: 28rpx; font-weight: 600; color: var(--ink); }",
 ".empty-title { margin-top: 28rpx; font-size: 30rpx; font-weight: 700; color: var(--ink); }"),
]
for old, new in pairs:
    assert old in s, old[:30]
    s = s.replace(old, new)
io.open(p, "w", encoding="utf-8").write(s)
print("trash patched")
