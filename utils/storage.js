// utils/storage.js —— 纯本地存储层
const KEY = 'wishList';

function getAll() { return wx.getStorageSync(KEY) || []; }
function getById(id) { return getAll().find(it => it.id === id); }

function add(item) {
  const list = getAll();
  list.push(item);
  wx.setStorageSync(KEY, list);
}
function update(id, patch) {
  const list = getAll();
  const idx = list.findIndex(it => it.id === id);
  if (idx >= 0) {
    list[idx] = Object.assign({}, list[idx], patch);
    wx.setStorageSync(KEY, list);
  }
}
function trash(id) { update(id, { state: 'trashed', trashedAt: Date.now() }); }
function destroy(id) {
  wx.setStorageSync(KEY, getAll().filter(it => it.id !== id));
}
function clearAll() { wx.setStorageSync(KEY, []); }

function getByState(state) {
  return getAll().filter(it => (it.state || 'cooling') === state);
}
function getTrashed() { return getAll().filter(it => it.state === 'trashed'); }

// 统计：忍住件数、已买件数、忍住的总金额
function getStats() {
  const all = getAll();
  let skipped = 0, bought = 0, saved = 0;
  all.forEach(it => {
    const s = it.state || 'cooling';
    if (s === 'skipped') {
      skipped++;
      if (it.price) saved += Number(it.price);
    } else if (s === 'bought') {
      bought++;
    }
  });
  return { skipped, bought, saved, total: all.length };
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
  wx.setStorageSync(PROFILE_KEY, next);
  return next;
}

module.exports = {
  getAll, getById, add, update, trash, destroy, clearAll,
  getByState, getTrashed, getStats,
  createId, DURATIONS,
  formatCountdown, formatDateTime,
  getProfile, saveProfile
};
