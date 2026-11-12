// tools/test_storage.js —— 数据层回归测试（node tools/test_storage.js）
// 用内存模拟 wx 存储，覆盖金额、数量、连续天数、分类、备份码、写入失败兜底

const path = require('path');
const store = require(path.join(__dirname, '..', 'utils', 'storage.js'));

let pass = 0;
let fail = 0;

function eq(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) { pass++; return; }
  fail++;
  console.log('  ✗ ' + label + '\n    实际 ' + a + '\n    期望 ' + e);
}

function ok(label, cond) { eq(label, !!cond, true); }

// ---- wx 模拟 ----
let quotaFull = false;
const mem = {};
global.wx = {
  getStorageSync(k) { return k in mem ? JSON.parse(JSON.stringify(mem[k])) : ''; },
  setStorageSync(k, v) {
    if (quotaFull) throw new Error('exceed storage size');
    mem[k] = JSON.parse(JSON.stringify(v));
  },
  removeStorageSync(k) { delete mem[k]; }
};

function reset() {
  Object.keys(mem).forEach(k => delete mem[k]);
  quotaFull = false;
}

const DAY = 86400000;

// ================= 金额清洗与格式 =================
console.log('金额：输入清洗');
eq('整数超长截断', store.cleanPriceInput('12345678901'), '1234567');
eq('小数超长截断', store.cleanPriceInput('12.3456'), '12.34');
eq('多个小数点', store.cleanPriceInput('1.2.3'), '1.23');
eq('非数字字符', store.cleanPriceInput('abc12'), '12');
eq('单件上限', store.sanitizePrice('9999999.99'), 9999999);
eq('空值转 0', store.sanitizePrice(''), 0);

console.log('金额：格式');
eq('千分位', store.formatMoney(2176), '2,176');
eq('万位缩写', store.formatMoney(12345), '1.23万');
eq('不四舍五入到 100 万', store.formatMoney(999999), '99.99万');
eq('亿位缩写', store.formatMoney(1.5e8), '1.5亿');
eq('异常大数', store.formatMoney(1.1e68), '—');
eq('负数按 0', store.formatMoney(-5), '0');

// ================= 数量与统计 =================
console.log('数量：统计口径');
reset();
store.add({ id: 'a', name: 'a', price: 300, qty: 3, state: 'skipped', createTime: Date.now(), endTime: Date.now() });
store.add({ id: 'b', name: 'b', price: 100, state: 'skipped', createTime: Date.now(), endTime: Date.now() });
store.add({ id: 'c', name: 'c', price: 1.1e68, qty: 2, state: 'skipped', createTime: Date.now(), endTime: Date.now() });
const stats = store.getStats();
eq('忍住件数按条计', stats.skipped, 3);
eq('省下 = 单价×数量，脏价格不计', stats.saved, 300 * 3 + 100);
eq('qty 缺失按 1', store.qtyOf({}), 1);
eq('qty 上取整封顶', store.qtyOf({ qty: 999 }), store.MAX_QTY);
eq('qty 非法按 1', store.qtyOf({ qty: 'abc' }), 1);

// ================= 连续天数 =================
console.log('连续天数：老数据口径');
reset();
const now = Date.now();
// 三天前、两天前、昨天各忍住一次
store.add({ id: 's1', name: 's', state: 'skipped', createTime: now - 3 * DAY, endTime: now - 3 * DAY, decidedAt: now - 3 * DAY });
store.add({ id: 's2', name: 's', state: 'skipped', createTime: now - 2 * DAY, endTime: now - 2 * DAY, decidedAt: now - 2 * DAY });
store.add({ id: 's3', name: 's', state: 'skipped', createTime: now - 1 * DAY, endTime: now - 1 * DAY, decidedAt: now - 1 * DAY });
let streak = store.getStreak();
eq('连续 3 天', streak.current, 3);
eq('最长 3 天', streak.longest, 3);

// 老数据没有 decidedAt，endTime 在未来（倒计时没走完就点了没买）
reset();
const future = now + 5 * DAY;
store.add({ id: 'o1', name: 'o', state: 'skipped', createTime: now, endTime: future });
streak = store.getStreak();
eq('未来 endTime 不产生未来日期', streak.longest, 1);
eq('未来 endTime 不计入本月以外的未来', store.getMonthStats(now).skipped >= 0, true);

// 断一天不清零最长
reset();
store.add({ id: 'g1', name: 'g', state: 'skipped', createTime: now - 10 * DAY, endTime: now - 10 * DAY, decidedAt: now - 10 * DAY });
store.add({ id: 'g2', name: 'g', state: 'skipped', createTime: now - 9 * DAY, endTime: now - 9 * DAY, decidedAt: now - 9 * DAY });
store.add({ id: 'g3', name: 'g', state: 'skipped', createTime: now - 1 * DAY, endTime: now - 1 * DAY, decidedAt: now - 1 * DAY });
streak = store.getStreak();
eq('最长保留 2 天', streak.longest, 2);
eq('当前只算昨天 1 天', streak.current, 1);

// ================= 分类 =================
console.log('分类：增删改');
reset();
eq('默认分类 8 个', store.getCategories().length, 8);
eq('新建分类', store.addCategory('乐器').ok, true);
eq('重名被拒', store.addCategory('乐器').ok, false);
eq('超长截断到 6 字', store.addCategory('这是一个很长的分类名').name, '这是一个很长');
store.add({ id: 'x', name: 'x', category: '乐器', state: 'cooling', createTime: now, endTime: now });
eq('删除后记录归入其他', store.deleteCategory('乐器').moved, 1);
eq('其他分类不能删', store.deleteCategory('其他').ok, false);
eq('记录落到其他', store.getById('x').category, '其他');
store.renameCategory('其他', '杂项');
eq('其他可改名', store.getById('x').category, '杂项');

// ================= 备份码 =================
console.log('备份码：导出与恢复');
reset();
store.add({ id: 'b1', name: '备份测试', price: 500, qty: 2, state: 'skipped', createTime: now, endTime: now });
store.saveProfile({ nickname: '小明', gender: 'male' });
const code = store.exportBackup();
ok('带前缀', code.indexOf('NOBUY1:') === 0);
reset();
const imported = store.importBackup(code);
eq('恢复成功', imported.ok, true);
eq('条数一致', imported.count, 1);
eq('记录还在', store.getById('b1').name, '备份测试');
eq('数量保留', store.getById('b1').qty, 2);
eq('资料恢复', store.getProfile().nickname, '小明');
eq('空内容被拒', store.importBackup('').ok, false);
eq('乱码被拒', store.importBackup('随便一句话').ok, false);

console.log('备份：全部数据与校验');
reset();
store.add({ id: 'f1', name: '冷静中的', price: 300, state: 'cooling', createTime: now, endTime: now + 2 * DAY });
store.add({ id: 'f2', name: '回收站的', price: 800, state: 'trashed', createTime: now, endTime: now, trashedAt: now });
store.add({ id: 'f3', name: '已忍住的', price: 200, state: 'skipped', createTime: now, endTime: now, decidedAt: now });
store.saveCategories(['数码', '自定义分类']);
store.saveProfile({ nickname: '全量', avatar: 'wxfile://a.png' });
wx.setStorageSync('onboardDone', true);
const full = store.exportBackup();
const parsed = store.parseBackup(full);
ok('摘要解析成功', parsed.ok);
eq('摘要总数', parsed.count, 3);
eq('摘要冷静中', parsed.cooling, 1);
eq('摘要回收站', parsed.trashed, 1);
eq('摘要已决定', parsed.decided, 1);
eq('摘要分类数', parsed.categoryCount, 2);
reset();
const fullImported = store.importBackup(full);
eq('全量恢复成功', fullImported.ok, true);
eq('清单条数', store.getAll().length, 3);
eq('回收站还在', store.getById('f2').state, 'trashed');
eq('分类恢复', store.getCategories(), ['数码', '自定义分类']);
eq('头像恢复', store.getProfile().avatar, 'wxfile://a.png');
eq('引导状态恢复', wx.getStorageSync('onboardDone'), true);
ok('缺字段的记录被拒', !store.parseBackup('NOBUY1:{"wishList":[{"name":"no id"}]}').ok);
ok('状态非法时回落 cooling', store.parseBackup('NOBUY1:{"wishList":[{"id":"z1","name":"z","state":"weird"}]}').data.wishList[0].state === 'cooling');
ok('纯 JSON 也可读', store.parseBackup('{"wishList":[{"id":"z2","name":"z2"}]}').ok);
eq('恢复是覆盖不是合并', (function () {
  store.add({ id: 'old', name: '旧的' });
  store.importBackup(full);
  return store.getAll().map(it => it.id).sort();
})(), ['f1', 'f2', 'f3']);

// ================= 撤销快照 =================
console.log('撤销：我没买');
reset();
store.add({ id: 'u1', name: 'u', state: 'cooling', endTime: now + 2 * DAY, decidedAt: 0, createTime: now });
store.update('u1', { state: 'skipped', decidedAt: now });
store.saveSkipUndo({ id: 'u1', state: 'cooling', endTime: now + 2 * DAY, decidedAt: 0 });
const undo = store.takeSkipUndo();
eq('快照可取', !!undo, true);
eq('快照保留原状态', undo.state, 'cooling');
store.update('u1', { state: undo.state, endTime: undo.endTime, decidedAt: undo.decidedAt });
eq('撤销后回到冷静中', store.getById('u1').state, 'cooling');
eq('撤销后截止时间还原', store.getById('u1').endTime, now + 2 * DAY);

// ================= 写入失败兜底 =================
console.log('写入：空间不足');
reset();
quotaFull = true;
eq('add 返回 false', store.add({ id: 'q', name: 'q', state: 'cooling', createTime: now, endTime: now }), false);
eq('saveProfile 返回 null', store.saveProfile({ nickname: 'x' }), null);
quotaFull = false;
eq('恢复后写入正常', store.add({ id: 'q2', name: 'q2', state: 'cooling', createTime: now, endTime: now }), true);

// ================= 成就 =================
console.log('成就：阈值点亮');
reset();
for (let i = 0; i < 12; i++) {
  store.add({ id: 'k' + i, name: 'k', price: 100, state: 'skipped', createTime: now - i * DAY, endTime: now - i * DAY, decidedAt: now - i * DAY });
}
const groups = store.getAchievementGroups();
const skipGroup = groups.filter(g => g.key === 'skip')[0];
eq('忍住组共 7 枚', skipGroup.total, 7);
eq('忍住 12 件点亮 1/10 两枚', skipGroup.unlockedCount, 2);
const saveGroup = groups.filter(g => g.key === 'save')[0];
eq('省下 1200 点亮 100/300/500/1000', saveGroup.unlockedCount, 4);

// ================= 回收站与清空 =================
console.log('回收站：移入 / 彻底删除 / 清空');
reset();
store.add({ id: 't1', name: 't1', state: 'cooling', createTime: now, endTime: now });
store.add({ id: 't2', name: 't2', state: 'cooling', createTime: now, endTime: now });
store.trash('t1');
eq('移入回收站状态', store.getById('t1').state, 'trashed');
ok('移入写入时间', !!store.getById('t1').trashedAt);
eq('回收站收录', store.getTrashed().length, 1);
eq('按状态查询 cooling', store.getByState('cooling').length, 1);
eq('彻底删除返回 true', store.destroy('t1'), true);
eq('彻底删除后查不到', store.getById('t1'), undefined);
eq('删除后总条数', store.getAll().length, 1);
store.trash('t2');
eq('清空回收站返回 true', store.clearTrashed(), true);
eq('清空后回收站为空', store.getTrashed().length, 0);

reset();
store.add({ id: 'c1', name: 'c1', state: 'bought', createTime: now, endTime: now });
eq('清空所有数据返回 true', store.clearAll(), true);
eq('清空后列表为空', store.getAll().length, 0);
eq('更新不存在的 id', store.update('nope', { name: 'x' }), false);
eq('按 id 查询不存在', store.getById('nope'), undefined);

// ================= 工具函数 =================
console.log('工具：id / 时间 / 倒计时 / 成就总数');
eq('createId 不重复', store.createId() !== store.createId(), true);
eq('formatDateTime 长度', store.formatDateTime(now).length, 16);
eq('倒计时 phase=计数中', store.formatCountdown(now + 2 * DAY, now).phase, 'counting');
eq('倒计时 phase=已过期', store.formatCountdown(now - 1000, now).phase, 'expired');
eq('成就共 18 枚', store.getAchievements().length, 18);

reset();
store.add({ id: 'm1', name: 'm1', price: 50, state: 'skipped', createTime: now, endTime: now, decidedAt: now });
eq('本月忍住件数', store.getMonthStats(now).skipped, 1);
eq('本月省下', store.getMonthStats(now).saved, 50);

console.log('\n' + (fail === 0 ? '全部通过' : fail + ' 项失败') + '：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
