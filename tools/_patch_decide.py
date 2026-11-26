# -*- coding: utf-8 -*-
import io

# ---- detail：我没买 = 橙实心（推荐动作），我买了 = 描边
p = r"E:\itsme\NoBuy\pages\detail\detail.wxss"
s = io.open(p, encoding="utf-8").read()
old = (".btn-buy  { background: var(--accent); color: #FFFFFF; font-weight: 700; border: none; }\n"
       ".btn-buy:active { background: var(--accent-deep); }\n"
       ".btn-nope {\n  background: var(--card); color: var(--ink); font-weight: 600;\n  border: 2rpx solid var(--n-200);\n}\n"
       ".btn-nope:active { background: var(--n-25); }")
new = (".btn-nope {\n  background: var(--accent); color: #FFFFFF; font-weight: 700;\n  border: none;\n}\n"
       ".btn-nope:active { background: var(--accent-deep); }\n"
       ".btn-buy {\n  background: var(--card); color: var(--ink); font-weight: 600;\n  border: 2rpx solid var(--n-200);\n}\n"
       ".btn-buy:active { background: var(--n-25); }")
assert old in s
s = s.replace(old, new)
io.open(p, "w", encoding="utf-8").write(s)

# ---- decide
p = r"E:\itsme\NoBuy\pages\decide\decide.wxss"
s = io.open(p, encoding="utf-8").read()
pairs = [
(".head-price {\n  margin-top: 8rpx; font-size: 28rpx; color: var(--accent-deep); font-weight: 600;\n}",
 ".head-price {\n  margin-top: 10rpx; font-size: 44rpx; color: var(--ink); font-weight: 600;\n  font-family: \"Songti SC\", \"Noto Serif CJK SC\", \"Times New Roman\", serif;\n}"),
(".head-name {\n  font-size: 32rpx; font-weight: 700; color: var(--ink);\n}",
 ".head-name {\n  font-size: 36rpx; font-weight: 700; color: var(--ink);\n}"),
(".card {\n  background: var(--n-0); border-radius: 24rpx; padding: 32rpx;\n  margin-bottom: 24rpx\n}",
 ".card {\n  background: var(--card); border: 1rpx solid var(--line);\n  border-radius: 24rpx; padding: 32rpx;\n  margin-bottom: 24rpx\n}"),
(".btn-buy  { background: var(--done-bg),  color: var(--done-text); font-weight: 600; border: 1rpx solid var(--s-done-line); }",
 ".btn-buy  { background: var(--card); color: var(--ink); font-weight: 600; border: 2rpx solid var(--n-200); }"),
(".btn-nope { background: var(--n-0); color: var(--ink-2); font-weight: 600; border: 1rpx solid var(--n-100); }",
 ".btn-nope { background: var(--accent); color: #FFFFFF; font-weight: 700; border: none; }\n.btn-nope:active { background: var(--accent-deep); }"),
]
for old, new in pairs:
    if old in s:
        s = s.replace(old, new)
    else:
        print("skip:", old[:24])
io.open(p, "w", encoding="utf-8").write(s)
print("detail + decide patched")
