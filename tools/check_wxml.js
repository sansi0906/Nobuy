// tools/check_wxml.js —— 粗查 WXML 标签闭合是否平衡（node tools/check_wxml.js）
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'pages');
const SELF_CLOSING = new Set(['input', 'image', 'textarea', 'icon', 'progress', 'switch', 'slider', 'canvas', 'map', 'video', 'audio', 'web-view', 'camera', 'live-player', 'live-pusher']);

function check(file) {
  const src = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const re = /<\/?([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g;
  const stack = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    const [raw, tag, attrs, selfClose] = m;
    if (raw[1] === '/') {
      // 这些标签允许 <image …></image> 写法，未入栈，直接忽略闭合
      if (SELF_CLOSING.has(tag)) continue;
      const top = stack.pop();
      if (top !== tag) {
        return '第 ' + (src.slice(0, m.index).split('\n').length) + ' 行：</' + tag + '> 与 <' + top + '> 不匹配';
      }
      continue;
    }
    if (selfClose === '/' || SELF_CLOSING.has(tag)) continue;
    stack.push(tag);
  }
  if (stack.length) return '未闭合：' + stack.join(', ');
  return null;
}

let bad = 0;
function walk(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(d => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    if (!d.name.endsWith('.wxml')) return;
    const err = check(p);
    if (err) { bad++; console.log('✗ ' + p.replace(ROOT, 'pages') + ' → ' + err); }
  });
}
walk(ROOT);
console.log(bad === 0 ? '所有 WXML 标签闭合正常' : bad + ' 个文件有问题');
process.exit(bad === 0 ? 0 : 1);
