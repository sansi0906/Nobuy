"""视觉规范落地脚本：把 pages/*.wxss 里散落的字号 / 圆角 / 间距 / 色值 / 阴影
统一收敛到 app.wxss 定义的 token。可重复运行（幂等：已是 token 的不再改）。

用法：python tools/design_pass.py
"""
import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / "pages"

# 字号 → 6 档（印章内数字 21/26/32 属于图形例外，保留）
FONT = {
    "19": "21", "20": "22", "21": "22", "23": "24", "25": "24", "26": "24",
    "27": "28", "30": "28", "34": "32", "36": "32", "38": "40", "44": "40",
    "46": "40", "72": "56",
}
# 圆角 → 8 / 16 / 24 / 999
RADIUS = {"12": "16", "14": "16", "28": "24"}
# 间距 → 8 的倍数
SPACE = {
    "2": "4", "3": "4", "4": "4", "6": "8", "10": "12", "13": "16", "14": "16",
    "18": "16", "20": "24", "22": "24", "26": "24", "28": "24", "30": "32",
    "34": "32", "36": "32", "40": "32", "44": "48", "56": "48", "60": "64",
}
# 硬编码色 → 语义 token（按长度优先匹配，避免 #FFF 吃掉 #FFFFFF）
COLOR = {
    "#FFFFFF": "var(--n-0)", "#FFF": "var(--n-0)", "#fff": "var(--n-0)",
    "#F8FAFC": "var(--n-25)", "#F4F7FA": "var(--n-25)", "#EAF0F6": "var(--n-25)",
    "#E8EDF2": "var(--n-25)", "#E6EDF4": "var(--n-25)",
    "#E9EFF5": "var(--n-100)", "#DAE3EC": "var(--n-50)", "#D9E3EC": "var(--n-50)",
    "#CFE0EE": "var(--a-100)", "#D8E5F1": "var(--a-100)", "#D5E4F2": "var(--a-100)",
    "#CADDEE": "var(--a-100)", "#DDE9F5": "var(--a-50)", "#4E7FA8": "var(--a-600)",
    "#2F5779": "var(--a-700)", "#56636E": "var(--n-600)", "#7E8C99": "var(--n-600)",
    "#AAB6C2": "var(--n-400)", "#E2EBD8": "var(--s-done-bg)", "#55744C": "var(--s-done)",
    "#D3E0C6": "var(--s-done-line)", "#FDF2F1": "var(--s-danger-soft)",
    "#E9C6C1": "var(--s-danger-line)", "#FBEAE8": "var(--s-danger-soft)",
    "#A82A22": "var(--s-danger-press)", "#6A4A12": "var(--s-gold-deep)",
    "#A87C2A": "var(--s-gold)",
}
SHADOW = {
    "0 20rpx 60rpx rgba(28,44,60,0.18)": "var(--sh-2)",
    "0 8rpx 24rpx rgba(78,127,168,0.35)": "var(--sh-2)",
    "0 2rpx 8rpx rgba(60,90,120,0.08)": "var(--sh-1)",
    "0 2rpx 12rpx rgba(60,90,120,0.06)": "var(--sh-1)",
}
# 一个渐变自造了两支蓝，收成一支
GRADIENT = {
    "linear-gradient(90deg, #6F9CC4, var(--a-600))": "linear-gradient(90deg, var(--a-600), var(--a-700))",
    "linear-gradient(90deg, #6F9CC4,#4E7FA8)": "linear-gradient(90deg, var(--a-600), var(--a-700))",
}


def sub_size(css, prop, table, unit="rpx"):
    def repl(m):
        v = m.group(2)
        return f"{m.group(1)}: {table.get(v, v)}{unit};"
    return re.sub(rf"({prop}):\s*(\d+){unit};", repl, css)


def sub_spacing(css):
    def repl(m):
        prop, values = m.group(1), m.group(2)
        mapped = re.sub(r"(\d+)rpx", lambda x: f"{SPACE.get(x.group(1), x.group(1))}rpx", values)
        return f"{prop}: {mapped};"
    return re.sub(r"((?:padding|margin)(?:-(?:top|right|bottom|left))?):\s*([^;]+);", repl, css)


def sub_shadow(css):
    def norm(v):
        return re.sub(r"\s*,\s*", ",", v.strip())

    def repl(m):
        v = m.group(1).strip()
        for k, tok in SHADOW.items():
            if norm(v) == norm(k):
                return f"box-shadow: {tok};"
        return f"box-shadow: {v};"
    return re.sub(r"box-shadow:\s*([^;]+);", repl, css)


def process(css):
    for k, v in COLOR.items():
        css = css.replace(k, v)
    for k, v in GRADIENT.items():
        css = css.replace(k, v)
    css = sub_shadow(css)
    css = sub_size(css, "font-size", FONT)
    css = sub_size(css, "border-radius", RADIUS)
    css = sub_spacing(css)
    return css


def main():
    changed = 0
    for f in sorted(PAGES.rglob("*.wxss")):
        src = f.read_text(encoding="utf-8")
        out = process(src)
        if out != src:
            f.write_text(out, encoding="utf-8")
            changed += 1
            print("更新", f.relative_to(ROOT))
    print(f"\n共 {changed} 个样式文件已收敛")


if __name__ == "__main__":
    main()
