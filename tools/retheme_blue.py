# tools/retheme_blue.py —— 把全站暖米+陶土橙配色统一替换为冷静蓝
# 只改 .wxss，按精确色值映射，不做模糊匹配
import os
import io

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(ROOT)

MAP = {
    # 变量
    '#F4F0E8': '#EDF2F7',
    '#3A3530': '#23303C',
    '#9A9088': '#6E7D8A',
    '#C4BCB0': '#A8B4C0',
    '#EAE2D4': '#DEE7EF',
    '#E4EBEF': '#E2ECF7',
    '#5E7A8C': '#4A7098',
    '#E8EDE0': '#E9EEE4',
    '#6E8A64': '#6B8563',
    '#C97B4A': '#4E7FA8',
    '#A86238': '#375E82',
    '#F6E8DC': '#E3EDF6',
    '#B06A5E': '#A5665F',
    # 卡片/底/分隔
    '#E7E0D2': '#DAE3EC',
    '#F0EBE2': '#E9EFF5',
    '#F2EEE6': '#E6EDF4',
    '#F5F2EC': '#E9EFF5',
    '#F5F1E9': '#EAF0F6',
    '#F7F4EE': '#F4F7FA',
    '#FBF8F2': '#F8FAFC',
    '#EFEFEA': '#E8EDF2',
    '#5C5C54': '#4E5B67',
    '#6C6C64': '#56636E',
    '#D9D2C6': '#CFDAE4',
    '#E3CFC7': '#D6C6C3',
    '#E6D3BF': '#C9D8E6',
    '#EADFD2': '#D5E1EC',
    '#EFE1CF': '#D5E4F2',
    '#E7E1D6': '#D9E3EC',
    '#C8C0B4': '#B7C3CF',
    '#9E9382': '#8B98A4',
    '#BEB3A0': '#AAB6C2',
    '#DFA176': '#6F9CC4',
}

RANGES = [
    # 遮罩与阴影：偏暖的 rgb 全部往冷灰蓝挪
    ('rgba(48, 40, 32, 0.42)', 'rgba(24, 38, 52, 0.45)'),
    ('rgba(60, 44, 28, 0.18)', 'rgba(28, 44, 60, 0.18)'),
    ('rgba(120, 90, 60, 0.05)', 'rgba(60, 90, 120, 0.06)'),
    ('rgba(120,90,60,0.08)', 'rgba(60,90,120,0.08)'),
    ('rgba(201,123,74,0.35)', 'rgba(78,127,168,0.35)'),
    ('rgba(201, 123, 74, 0.3)', 'rgba(78, 127, 168, 0.3)'),
    ('rgba(120, 60, 25, 0.18)', 'rgba(30, 62, 92, 0.18)'),
]


def main():
    changed = 0
    for dirpath, _dirnames, filenames in os.walk(PROJECT):
        if 'node_modules' in dirpath:
            continue
        for fn in filenames:
            if not fn.endswith('.wxss'):
                continue
            p = os.path.join(dirpath, fn)
            with io.open(p, 'r', encoding='utf-8') as f:
                src = f.read()
            out = src
            for old, new in MAP.items():
                out = out.replace(old, new)
            for old, new in RANGES:
                out = out.replace(old, new)
            if out != src:
                with io.open(p, 'w', encoding='utf-8', newline='') as f:
                    f.write(out)
                changed += 1
                print('rethemed', os.path.relpath(p, PROJECT))
    print('files changed:', changed)


if __name__ == '__main__':
    main()
