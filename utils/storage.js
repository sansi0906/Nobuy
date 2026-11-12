// utils/storage.js —— 纯本地存储层
const KEY = 'wishList';

// 所有写入都走这里：本地空间不足时 setStorageSync 会抛异常，
// 统一兜住并返回 false，让调用方给出提示，而不是静默丢数据。
function write(key, value) {
  try {
    wx.setStorageSync(key, value);
    return true;
  } catch (e) {
    return false;
  }
}

function getAll() { return wx.getStorageSync(KEY) || []; }
function getById(id) { return getAll().find(it => it.id === id); }

function add(item) {
  const list = getAll();
  list.push(item);
  return write(KEY, list);
}
function update(id, patch) {
  const list = getAll();
  const idx = list.findIndex(it => it.id === id);
  if (idx < 0) return false;
  list[idx] = Object.assign({}, list[idx], patch);
  return write(KEY, list);
}
function trash(id) { update(id, { state: 'trashed', trashedAt: Date.now() }); }
function destroy(id) {
  return write(KEY, getAll().filter(it => it.id !== id));
}
function clearAll() { return write(KEY, []); }

function getByState(state) {
  return getAll().filter(it => (it.state || 'cooling') === state);
}
function getTrashed() { return getAll().filter(it => it.state === 'trashed'); }
function clearTrashed() {
  return write(KEY, getAll().filter(it => it.state !== 'trashed'));
}

// 统计：忍住件数、已买件数、忍住的总金额
function getStats() {
  const all = getAll();
  let skipped = 0, bought = 0, saved = 0;
  all.forEach(it => {
    const s = it.state || 'cooling';
    if (s === 'skipped') {
      skipped++;
      saved += validPrice(it.price) * qtyOf(it);
    } else if (s === 'bought') {
      bought++;
    }
  });
  return { skipped, bought, saved, total: all.length };
}

// ---- 数量：默认 1 件，允许 1~99 ----
const MAX_QTY = 99;
function qtyOf(it) {
  const n = parseInt(it && it.qty, 10);
  if (!isFinite(n) || n < 1) return 1;
  return n > MAX_QTY ? MAX_QTY : n;
}
function sanitizeQty(raw) {
  const n = parseInt(raw, 10);
  if (!isFinite(n) || n < 1) return 1;
  return n > MAX_QTY ? MAX_QTY : n;
}

// ---- 金额：输入清洗与展示格式 ----
const MAX_PRICE = 9999999;   // 单件价格上限：约一千万

// 输入框实时清洗：只留数字和一个小数点，整数最多 7 位，小数最多 2 位
function cleanPriceInput(raw) {
  let s = String(raw == null ? '' : raw).replace(/[^\d.]/g, '');
  const dot = s.indexOf('.');
  if (dot >= 0) {
    s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '');
  }
  const parts = s.split('.');
  const int = (parts[0] || '').slice(0, 7);
  if (parts.length === 1) return int;
  return int + '.' + parts[1].slice(0, 2);
}

// 转成可入库的数字；非法或超上限的按上限截断
function sanitizePrice(raw) {
  const n = Number(cleanPriceInput(raw));
  if (!isFinite(n) || n <= 0) return 0;
  return Math.min(n, MAX_PRICE);
}

// 统计时只认这个范围内的价格，历史脏数据直接忽略
function validPrice(v) {
  const n = Number(v);
  if (!isFinite(n) || n <= 0 || n > MAX_PRICE) return 0;
  return n;
}

// 展示：万 / 亿 缩写，万以下带千分位；离谱的历史脏值不硬算
function formatMoney(v) {
  const n = Number(v);
  if (!isFinite(n) || n <= 0) return '0';
  if (n > 1e9) return '—';          // 十亿以上视为异常数据，不展示
  if (n >= 100000000) return trimNum(n / 100000000) + '亿';
  if (n >= 10000) return trimNum(n / 10000) + '万';
  const int = Math.floor(n);
  const dec = Math.round((n - int) * 100);
  const intText = String(int).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec > 0 ? intText + '.' + (dec < 10 ? '0' + dec : dec) : intText;
}

// 缩写时向下取两位，避免 99.99 万被显示成 100 万
function trimNum(n) {
  return String(Math.floor(n * 100) / 100);
}

function createId() {
  return Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

const DURATIONS = [
  { label: '24 小时', hours: 24 },
  { label: '3 天',    hours: 72 },
  { label: '7 天',    hours: 168 },
  { label: '15 天',   hours: 360 }
];

function formatCountdown(endTime, now) {
  now = now || Date.now();
  const diff = endTime - now;
  if (diff <= 0) {
    const d = Math.floor(-diff / 86400000);
    return {
      phase: 'expired',
      text: d > 0 ? '冷静期已过 ' + d + ' 天' : '冷静期已过'
    };
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const text = d > 0 ? '还剩 ' + d + ' 天 ' + h + ' 小时' : '还剩 ' + h + ' 小时';
  return { phase: 'counting', text };
}

function formatDateTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = n => (n < 10 ? '0' + n : '' + n);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

// ---- 分类 ----
const CATEGORY_KEY = 'categories';
const DEFAULT_CATEGORIES = ['数码', '服饰', '家居', '美妆', '食品', '书籍', '出行', '其他'];
const FALLBACK_CATEGORY = '其他';
const MAX_CATEGORIES = 20;
const MAX_CATEGORY_NAME = 6;

function getCategories() {
  const saved = wx.getStorageSync(CATEGORY_KEY);
  if (Array.isArray(saved) && saved.length > 0) return saved.slice();
  return DEFAULT_CATEGORIES.slice();
}

function saveCategories(list) {
  write(CATEGORY_KEY, list);
  return list;
}

function addCategory(rawName) {
  const name = String(rawName || '').trim().slice(0, MAX_CATEGORY_NAME);
  if (!name) return { ok: false, reason: 'empty' };
  const list = getCategories();
  if (list.indexOf(name) >= 0) return { ok: false, reason: 'exists' };
  if (list.length >= MAX_CATEGORIES) return { ok: false, reason: 'full' };
  list.push(name);
  saveCategories(list);
  return { ok: true, name };
}

function renameCategory(oldName, rawNew) {
  const newName = String(rawNew || '').trim().slice(0, MAX_CATEGORY_NAME);
  if (!newName) return { ok: false, reason: 'empty' };
  if (newName === oldName) return { ok: true, name: newName };
  const list = getCategories();
  if (list.indexOf(oldName) < 0) return { ok: false, reason: 'missing' };
  if (list.indexOf(newName) >= 0) return { ok: false, reason: 'exists' };
  saveCategories(list.map(n => (n === oldName ? newName : n)));
  const all = getAll();
  let changed = false;
  all.forEach(it => {
    if ((it.category || FALLBACK_CATEGORY) === oldName) { it.category = newName; changed = true; }
  });
  if (changed) write(KEY, all);
  return { ok: true, name: newName };
}

function deleteCategory(name) {
  if (!name || name === FALLBACK_CATEGORY) return { ok: false, reason: 'fallback' };
  const list = getCategories();
  if (list.indexOf(name) < 0) return { ok: false, reason: 'missing' };
  saveCategories(list.filter(n => n !== name));
  const all = getAll();
  let moved = 0;
  all.forEach(it => {
    if ((it.category || FALLBACK_CATEGORY) === name) { it.category = FALLBACK_CATEGORY; moved++; }
  });
  if (moved > 0) write(KEY, all);
  return { ok: true, moved };
}

function countByCategory(name) {
  return getAll().filter(it =>
    (it.state || 'cooling') !== 'trashed' && (it.category || FALLBACK_CATEGORY) === name
  ).length;
}

// ---- 连续天数与成就 ----
const DAY_MS = 86400000;

function dayKey(ts) {
  const d = new Date(ts);
  const pad = n => (n < 10 ? '0' + n : '' + n);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function dayNum(key) {
  const p = key.split('-').map(Number);
  return Math.round(new Date(p[0], p[1] - 1, p[2]).getTime() / DAY_MS);
}

// 决策时间：新数据用 decidedAt，老数据退化用 endTime / createTime
// 老数据若 endTime 还在未来（倒计时未走完就点了「我没买」），
// 不能把它算到未来某一天，退回 createTime。
function decidedTs(it) {
  const now = Date.now();
  const ts = it.decidedAt || it.endTime || it.createTime || 0;
  if (ts > now) return it.createTime || ts;
  return ts;
}

// 连续忍住：按“我没买”的决策日期算，断一天不清零最长记录
function getStreak() {
  const days = {};
  getAll().forEach(it => {
    if (it.state !== 'skipped') return;
    const ts = decidedTs(it);
    if (ts) days[dayNum(dayKey(ts))] = true;
  });

  const sorted = Object.keys(days).map(Number).sort((a, b) => a - b);
  let longest = 0, run = 0, prev = null;
  sorted.forEach(n => {
    run = (prev !== null && n === prev + 1) ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = n;
  });

  const today = dayNum(dayKey(Date.now()));
  let current = 0;
  let cursor = days[today] ? today : (days[today - 1] ? today - 1 : null);
  while (cursor !== null && days[cursor]) { current++; cursor--; }
  if (current > longest) longest = current;
  return { current, longest };
}

// 本月战绩
function getMonthStats(now) {
  now = now || Date.now();
  const d = new Date(now);
  const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  let skipped = 0, saved = 0;
  getAll().forEach(it => {
    if (it.state !== 'skipped') return;
    if (decidedTs(it) < start) return;
    skipped++;
    saved += validPrice(it.price) * qtyOf(it);
  });
  return { skipped, saved };
}

// 三个维度：忍住件数 / 省下金额 / 最长连续天数
// glyph 是印在印章里的字，用来区分维度
const ACHIEVEMENT_GROUPS = [
  { key: 'skip',   name: '忍住', glyph: '忍', unit: '件', coinPrefix: '',  targets: [1, 10, 20, 30, 50, 100, 200] },
  { key: 'save',   name: '省下', glyph: '省', unit: '元', coinPrefix: '',  targets: [100, 300, 500, 1000, 2000] },
  { key: 'streak', name: '坚持', glyph: '恒', unit: '天', coinPrefix: '',  targets: [7, 14, 21, 28, 60, 90] }
];


const METRIC_OF = { skip: 'skipped', save: 'saved', streak: 'streak' };

function buildAchievements() {
  const stats = getStats();
  const streak = getStreak();
  const values = { skipped: stats.skipped, saved: Math.round(stats.saved), streak: streak.longest };

  return ACHIEVEMENT_GROUPS.map(group => {
    const value = values[METRIC_OF[group.key]] || 0;
    const items = group.targets.map(target => {
      const unlocked = value >= target;
      return {
        id: group.key + '_' + target,
        name: group.name + ' ' + target + ' ' + group.unit,
        desc: group.key === 'streak'
          ? '连续 ' + target + ' 天都有忍住'
          : '累计' + group.name + ' ' + target + ' ' + group.unit,
        coinText: group.coinPrefix + target,
        compact: String(target).length >= 4,
        // 按字符数分档字号，避免 3、4 位数挤到印章外圈
        numClass: String(target).length >= 4 ? 'seal-num-4'
          : (String(target).length === 3 ? 'seal-num-3' : 'seal-num-2'),
        glyph: group.glyph,
        unitText: group.unit,
        unlocked,
        percent: Math.max(0, Math.min(100, Math.round((value / target) * 100))),
        progressText: unlocked ? '' : (value + '/' + target)
      };
    });
    // 全部印章常驻展示，灰色代表未点亮
    const display = items;

    return {
      key: group.key,
      name: group.name,
      glyph: group.glyph,
      unit: group.unit,
      items,
      display,
      unlockedCount: items.filter(i => i.unlocked).length,
      lockedCount: items.filter(i => !i.unlocked).length,
      total: items.length
    };
  });
}

function getAchievementGroups() {
  return buildAchievements();
}

function getAchievements() {
  return buildAchievements().reduce((acc, g) => acc.concat(g.items), []);
}

// ---- 用户本地资料 & 默认偏好 ----
const PROFILE_KEY = 'userProfile';
function getProfile() {
  return wx.getStorageSync(PROFILE_KEY) || {
    avatar: '', nickname: '', gender: '',
    defaultDuration: 1   // 默认选中 3 天
  };
}
function saveProfile(patch) {
  const next = Object.assign({}, getProfile(), patch);
  const ok = write(PROFILE_KEY, next);
  return ok ? next : null;
}

// ---- 撤销：刚刚记为「我没买」的快照 ----
const UNDO_KEY = 'lastSkipUndo';
const UNDO_TTL = 10 * 60 * 1000;   // 10 分钟内可撤销

function saveSkipUndo(snapshot) {
  write(UNDO_KEY, Object.assign({}, snapshot, { at: Date.now() }));
}
function takeSkipUndo() {
  let data = null;
  try { data = wx.getStorageSync(UNDO_KEY); } catch (e) { data = null; }
  if (!data || !data.id || !data.at) return null;
  if (Date.now() - data.at > UNDO_TTL) { clearSkipUndo(); return null; }
  return data;
}
function clearSkipUndo() {
  try { wx.removeStorageSync(UNDO_KEY); } catch (e) { /* 忽略 */ }
}

// ---- 备份码：纯本地文本，复制到剪贴板即可保存 ----
const BACKUP_PREFIX = 'NOBUY1:';

function exportBackup() {
  const payload = {
    v: 1,
    at: Date.now(),
    wishList: getAll(),
    categories: getCategories(),
    profile: getProfile()
  };
  return BACKUP_PREFIX + JSON.stringify(payload);
}

function importBackup(text) {
  const raw = String(text || '').trim();
  if (!raw) return { ok: false, reason: 'empty' };
  const body = raw.indexOf(BACKUP_PREFIX) === 0 ? raw.slice(BACKUP_PREFIX.length) : raw;
  let data;
  try { data = JSON.parse(body); } catch (e) { return { ok: false, reason: 'format' }; }
  if (!data || !Array.isArray(data.wishList)) return { ok: false, reason: 'format' };
  if (!write(KEY, data.wishList)) return { ok: false, reason: 'quota' };
  if (Array.isArray(data.categories) && data.categories.length > 0) {
    write(CATEGORY_KEY, data.categories.slice(0, MAX_CATEGORIES));
  }
  if (data.profile && typeof data.profile === 'object') {
    write(PROFILE_KEY, Object.assign({}, getProfile(), data.profile));
  }
  return { ok: true, count: data.wishList.length };
}

module.exports = {
  getAll, getById, add, update, trash, destroy, clearAll,
  getByState, getTrashed, getStats, clearTrashed,
  createId, DURATIONS,
  formatCountdown, formatDateTime,
  getProfile, saveProfile,
  saveSkipUndo, takeSkipUndo, clearSkipUndo,
  exportBackup, importBackup,
  getCategories, saveCategories, addCategory, renameCategory, deleteCategory, countByCategory,
  DEFAULT_CATEGORIES, FALLBACK_CATEGORY, MAX_CATEGORY_NAME, MAX_CATEGORIES,
  getStreak, getMonthStats, getAchievements, getAchievementGroups, ACHIEVEMENT_GROUPS,
  MAX_PRICE, MAX_QTY, qtyOf, sanitizeQty,
  cleanPriceInput, sanitizePrice, validPrice, formatMoney
};
