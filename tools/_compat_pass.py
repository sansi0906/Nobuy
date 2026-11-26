# -*- coding: utf-8 -*-
"""v1.2.4 兼容性收口：tab 图标双底可读、theme.json 深浅两套、主色按钮字色 token。"""
import io, json, os, sys
ROOT = r"E:\itsme\NoBuy"
sys.path.insert(0, os.path.join(ROOT, "tools"))
import v124_assets as A

# 未选中图标取中间灰：白底 4.4:1、深底 3.3:1，两边都够看
TAB_OFF = (108, 122, 131, 255)   # #6C7A83
TAB_ON = (204, 94, 58, 255)      # #CC5E3A

outs = []
for name, fn in (("tab_home", A.icon_home), ("tab_trash", A.icon_trash), ("tab_mine", A.icon_mine)):
    outs.append(A.save(fn(TAB_OFF), name + ".png"))
    outs.append(A.save(fn(TAB_ON), name + "_on.png"))
for n, sz in outs:
    print("icon", n, sz)

# ---- theme.json ----
p = os.path.join(ROOT, "theme.json")
data = {
    "light": {
        "navigationBarBackgroundColor": "#EEF1F3",
        "navigationBarTextStyle": "black",
        "backgroundColor": "#EEF1F3",
        "backgroundTextStyle": "dark",
        "tabBarColor": "#5D6B74",
        "tabBarSelectedColor": "#CC5E3A",
        "tabBarBackgroundColor": "#FFFFFF",
    },
    "dark": {
        "navigationBarBackgroundColor": "#1A2126",
        "navigationBarTextStyle": "white",
        "backgroundColor": "#1A2126",
        "backgroundTextStyle": "light",
        "tabBarColor": "#8C9AA4",
        "tabBarSelectedColor": "#DE7B4F",
        "tabBarBackgroundColor": "#202931",
    },
}
io.open(p, "w", encoding="utf-8").write(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
print("theme.json rewritten")

# ---- app.wxss: 主色上的字色随主题 ----
p = os.path.join(ROOT, "app.wxss")
s = io.open(p, encoding="utf-8").read()
assert "--on-accent" not in s
s = s.replace("--seal-ink-off", "--on-accent: #FFFFFF;\n    --seal-ink-off", 1)
s = s.replace("  .btn-primary { color: #10161A; }",
              "  .btn-primary { color: #10161A; }\n  .btn-nope, .fab, .btn-buy-solid { color: var(--on-accent); }", 1)
s = s.replace("    --s-gold-line: #4B3F24;",
              "    --s-gold-line: #4B3F24;\n\n    --on-accent: #10161A;", 1)
io.open(p, "w", encoding="utf-8").write(s)
print("app.wxss on-accent token added")

# 页面里橙实心按钮统一用 token
for page, old, new in [
    ("pages/detail/detail.wxss",
     ".btn-nope {\n  background: var(--accent); color: #FFFFFF; font-weight: 700;\n  border: none;\n}",
     ".btn-nope {\n  background: var(--accent); color: var(--on-accent); font-weight: 700;\n  border: none;\n}"),
    ("pages/decide/decide.wxss",
     ".btn-nope { background: var(--accent); color: #FFFFFF; font-weight: 700; border: none; }",
     ".btn-nope { background: var(--accent); color: var(--on-accent); font-weight: 700; border: none; }"),
]:
    fp = os.path.join(ROOT, page)
    t = io.open(fp, encoding="utf-8").read()
    assert old in t, page
    t = t.replace(old, new)
    io.open(fp, "w", encoding="utf-8").write(t)
    print("patched", page)

# FAB
fp = os.path.join(ROOT, "pages", "index", "index.wxss")
t = io.open(fp, encoding="utf-8").read()
t = t.replace("  background: var(--accent); color: #FFFFFF;\n", "  background: var(--accent); color: var(--on-accent);\n")
io.open(fp, "w", encoding="utf-8").write(t)
print("fab token ok")
