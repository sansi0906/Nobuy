# -*- coding: utf-8 -*-
import io
p = r"E:\itsme\NoBuy\app.wxss"
s = io.open(p, encoding="utf-8").read()

# 1) 保护只在「冷静状态」里使用的同名色，避免被 a-* 的替换误伤
s = s.replace("--s-cool-bg: #E7EDF1;", "--s-cool-bg: @@COOLBG@@;")
s = s.replace("--s-cool: #5F7688;", "--s-cool: @@COOLTXT@@;")
s = s.replace("--seal-ink-off: #6B767E;", "--seal-ink-off: @@SEALOFF@@;")

# 2) 浅色 token 换值（page 与 .theme-light 两处一起换）
pairs = [
    ("#F6F8F9", "#F4F7F9"),
    ("#EFF1F2", "#EEF1F3"),
    ("#DFE5E9", "#DDE4E9"),
    ("#C9D3D9", "#C6D2DA"),
    ("#9FAAB2", "#93A1AA"),
    ("#6B767E", "#5D6B74"),
    ("#22282C", "#1B2329"),
    ("#CBD9E1", "#F1D2C1"),
    ("#475A69", "#A0462D"),
]
for old, new in pairs:
    s = s.replace(old, new)

# a-50（原 #E7EDF1）与 a-600（原 #5F7688）在保护后已只剩强调色那两行
s = s.replace("--a-50: #E7EDF1;", "--a-50: #F7E5DA;")
s = s.replace("--a-600: #5F7688;", "--a-600: #CC5E3A;")

# 3) 深色 token：保持同一套语义，强调色提亮
dark_pairs = [
    ("#1B2227", "#1A2126"),
    ("#212A31", "#202931"),
    ("#141A1E", "#12181C"),
    ("#2C373E", "#2A353C"),
    ("#3A464D", "#38454E"),
    ("#7C8892", "#78868F"),
    ("#AAB6BE", "#A6B3BC"),
    ("#E8EDF0", "#E6EEF2"),
    ("--a-50: #22303A;", "--a-50: #3A2A22;"),
    ("--a-100: #2E414F;", "--a-100: #52362A;"),
    ("--a-600: #8FB0C6;", "--a-600: #DE7B4F;"),
    ("--a-700: #B7CEDD;", "--a-700: #EC9A73;"),
]
for old, new in dark_pairs:
    s = s.replace(old, new)

# 4) 还原被保护的值
s = s.replace("@@COOLBG@@", "#E7EDF1")
s = s.replace("@@COOLTXT@@", "#586E7E")
s = s.replace("@@SEALOFF@@", "#6B767E")

# 5) 按钮方肩 12rpx（只动 .btn）
s = s.replace("""  box-sizing: border-box;
  border-radius: var(--r-2);
  font-size: var(--t-body);""", """  box-sizing: border-box;
  border-radius: 12rpx;
  font-size: var(--t-body);""")

# 6) 数字衬线工具类
if ".num-serif" not in s:
    s = s.replace("/* ============ 深色模式 ============ */",
                  """/* 大数字与日期：衬线，做「账本/杂志」对比 */
.num-serif {
  font-family: "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", "Times New Roman", serif;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}

/* ============ 深色模式 ============ */""")

io.open(p, "w", encoding="utf-8").write(s)
print("app.wxss patched")
