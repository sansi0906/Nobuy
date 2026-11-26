# -*- coding: utf-8 -*-
import io, os, re, json
ROOT = r"E:\itsme\NoBuy"

files = ["pages/add/add.wxss", "pages/decide/decide.wxss", "pages/detail/detail.wxss",
         "pages/profile/profile.wxss", "pages/trash/trash.wxss"]
rule = "\n\n/* 兼容老客户端：不用 flex 的 gap，改用相邻按钮外边距 */\n.btn + .btn { margin-left: 24rpx; }\n"

for rel in files:
    p = os.path.join(ROOT, rel)
    s = io.open(p, encoding="utf-8").read()
    n = len(re.findall(r"gap:\s*24rpx;\s*", s))
    s = re.sub(r"\s*gap:\s*24rpx;", "", s)
    if ".btn + .btn" not in s:
        s = s.rstrip() + rule
    io.open(p, "w", encoding="utf-8").write(s)
    print(rel, "removed gap:", n)

# app.wxss 里若有 gap 也一并清掉
p = os.path.join(ROOT, "app.wxss")
s = io.open(p, encoding="utf-8").read()
if re.search(r"gap:\s*\d", s):
    print("app.wxss still has gap")

# 基础库版本钉到正式版本
p = os.path.join(ROOT, "project.config.json")
s = io.open(p, encoding="utf-8").read()
s2 = s.replace('"libVersion": "trial"', '"libVersion": "2.32.3"')
assert s2 != s
io.open(p, "w", encoding="utf-8").write(s2)
print("libVersion -> 2.32.3")
