# -*- coding: utf-8 -*-
import io
p = r"E:\itsme\NoBuy\pages\decide\decide.wxss"
s = io.open(p, encoding="utf-8").read()
import re
lines = s.split("\n")
for i, ln in enumerate(lines):
    if ln.strip().startswith(".btn-buy"):
        lines[i] = ".btn-buy  { background: var(--card); color: var(--ink); font-weight: 600; border: 2rpx solid var(--n-200); }"
s = "\n".join(lines)
io.open(p, "w", encoding="utf-8").write(s)
print([l for l in s.split("\n") if "btn-" in l])
