# -*- coding: utf-8 -*-
import io
p = r"E:\itsme\NoBuy\pages\detail\detail.wxss"
s = io.open(p, encoding="utf-8").read()

pairs = [
# 名称与金额：金额走衬线
(".d-name { margin-top: 24rpx; font-size: 40rpx; font-weight: 700; color: var(--ink); line-height: 1.3; }",
 ".d-name { margin-top: 24rpx; font-size: 44rpx; font-weight: 700; color: var(--ink); line-height: 1.3; letter-spacing: 0.5rpx; }"),
(".d-price { margin-top: 8rpx; font-size: 32rpx; font-weight: 600; color: var(--accent-deep); }",
 ".d-price {\n  margin-top: 10rpx; font-size: 44rpx; font-weight: 600; color: var(--ink);\n  font-family: \"Songti SC\", \"Noto Serif CJK SC\", \"Times New Roman\", serif;\n}"),
# 倒计时：白底 + 左侧橙条 + 大号衬线橙字
(".cd-row { margin-top: 32rpx; padding: 24rpx 24rpx; border-radius: 16rpx; }\n.cd-row-counting { background: var(--cooling-bg); }\n.cd-row-expired  { background: var(--accent-soft); }\n.cd-text { font-size: 28rpx; font-weight: 600; }\n.cd-row-counting .cd-text { color: var(--cooling-text); }\n.cd-row-expired  .cd-text { color: var(--accent-deep); }",
 ".cd-row {\n  margin-top: 32rpx; padding: 20rpx 0 8rpx 24rpx;\n  border-left: 6rpx solid var(--accent); border-radius: 0 12rpx 12rpx 0;\n  background: var(--n-25);\n}\n.cd-row-expired { border-left-color: var(--accent-deep); }\n.cd-text {\n  font-size: 44rpx; font-weight: 700; color: var(--accent);\n  font-family: \"Songti SC\", \"Noto Serif CJK SC\", \"Times New Roman\", serif;\n}\n.cd-row-expired .cd-text { color: var(--accent-deep); }"),
# 决定按钮：一描边一实心
(".btn-buy  { background: var(--s-done-bg); color: var(--s-done); font-weight: 600; border: 1rpx solid var(--s-done-line); }\n.btn-nope { background: var(--a-50); color: var(--a-700); font-weight: 600; border: 1rpx solid var(--a-100); }",
 ".btn-buy  { background: var(--accent); color: #FFFFFF; font-weight: 700; border: none; }\n.btn-buy:active { background: var(--accent-deep); }\n.btn-nope {\n  background: var(--card); color: var(--ink); font-weight: 600;\n  border: 2rpx solid var(--n-200);\n}\n.btn-nope:active { background: var(--n-25); }"),
(".card-mask {\n  position: fixed; left: 0; right: 0; top: 0; bottom: 0;\n  background: rgba(34, 40, 44, 0.42);",
 ".card-mask {\n  position: fixed; left: 0; right: 0; top: 0; bottom: 0;\n  background: rgba(16, 24, 29, 0.55);"),
]
for old, new in pairs:
    assert old in s, old[:40]
    s = s.replace(old, new)

io.open(p, "w", encoding="utf-8").write(s)
print("detail.wxss patched")
