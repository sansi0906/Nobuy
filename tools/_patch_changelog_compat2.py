# -*- coding: utf-8 -*-
import io
p = r"E:\itsme\NoBuy\CHANGELOG.md"
s = io.open(p, encoding="utf-8").read()
old = "- 已知限制（未改）：页面里的 `gap` 需要 iOS 14.5+ / XWeb 才有 flex 间距，更老的客户端按钮会贴着；`utils/card.js` 用 `async/await`（依赖 `es6: true` 编译）；成果卡用 `canvas type=\"2d\"`，需基础库 2.9+；`project.config.json` 的 `libVersion` 仍是 `trial`，发版前建议钉到正式版本并在真机各测一遍。"
new = ("- 按钮间距不再用 flex 的 `gap`（老 iOS / 老 XWeb 不支持，会贴在一起），5 个页面统一改成相邻按钮外边距 `.btn + .btn { margin-left: 24rpx }`。\n"
       "- `project.config.json` 的 `libVersion` 从 `trial` 钉到 `2.32.3`，避免用 beta 基础库做开发与验收。\n"
       "- 仍存在的依赖：`utils/card.js` 用 `async/await`（靠 `es6: true` 编译）；成果卡用 `canvas type=\"2d\"`，需基础库 2.9+，更低版本只影响分享图、不影响主流程。")
assert old in s
s = s.replace(old, new)
io.open(p, "w", encoding="utf-8").write(s)
print("changelog updated")
