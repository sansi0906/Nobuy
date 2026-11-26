# -*- coding: utf-8 -*-
import io
p = r"E:\itsme\NoBuy\CHANGELOG.md"
s = io.open(p, encoding="utf-8").read()
anchor = "**未做（本轮明确延后）**"
add = """**兼容性收口**

- `theme.json` 深浅两套一起换：浅色导航/背景 `#EEF1F3`、tab 未选中 `#5D6B74`、选中 `#CC5E3A`；深色导航/背景 `#1A2126`、tab 底 `#202931`、tab 字 `#8C9AA4`（对深底 5.1:1）、选中 `#DE7B4F`（4.96:1）。此前深色仍是旧的 `#141A1E` 与白底 tabBar。
- tabBar 图标是静态 PNG，改不了随主题变色，所以未选中色从 `#5D6B74` 退到中间灰 `#6C7A83`：白底 4.4:1、深底 3.3:1，浅深两边都看得见。
- 新增 `--on-accent` 令牌（浅色 `#FFFFFF` / 深色 `#10161A`）：橙底上的字在深色模式会自动转深字，避免 `#FFFFFF` 落在 `#DE7B4F` 上只有 2.98:1。首页 FAB、详情/决策的橙实心按钮都改用该令牌。
- 图片总量 76.6KB（限制 200KB），tab 图标 81×81、单张 ≤2.9KB。
- 已知限制（未改）：页面里的 `gap` 需要 iOS 14.5+ / XWeb 才有 flex 间距，更老的客户端按钮会贴着；`utils/card.js` 用 `async/await`（依赖 `es6: true` 编译）；成果卡用 `canvas type="2d"`，需基础库 2.9+；`project.config.json` 的 `libVersion` 仍是 `trial`，发版前建议钉到正式版本并在真机各测一遍。

"""
assert anchor in s
s = s.replace(anchor, add + anchor, 1)
io.open(p, "w", encoding="utf-8").write(s)
print("changelog compat section added")
