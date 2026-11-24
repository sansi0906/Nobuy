// utils/theme.js
// 外观只有两态：跟随系统（auto） / 始终浅色（light）。
// 做法：页面根节点挂 theme-light 时，把浅色 token 重新盖在 @media 深色之上
// （class 选择器优先级高于 page 元素选择器），页面里所有 var() 自动回浅。
// 导航栏用 theme.json 跟系统走，这里再显式 setNavigationBarColor，保证"始终浅色"时导航栏也是浅的。

const KEY = 'themeMode';

function getMode() {
  try {
    return wx.getStorageSync(KEY) === 'light' ? 'light' : 'auto';
  } catch (e) {
    return 'auto';
  }
}

function systemTheme() {
  try {
    const info = wx.getSystemInfoSync();
    return info && info.theme === 'dark' ? 'dark' : 'light';
  } catch (e) {
    return 'light';
  }
}

// 最终落到哪套 token
function resolve() {
  return getMode() === 'light' ? 'light' : systemTheme();
}

function themeClass() {
  return 'theme-' + resolve();
}

function modeLabel() {
  return getMode() === 'light' ? '始终浅色' : '跟随系统';
}

// 导航栏 / 上拉背景跟随当前解析结果
function applyNav() {
  const dark = resolve() === 'dark';
  const bg = dark ? '#141A1E' : '#EFF1F2';
  try {
    wx.setNavigationBarColor({
      frontColor: dark ? '#ffffff' : '#000000',
      backgroundColor: bg,
      animation: { duration: 0 },
      fail() {}
    });
  } catch (e) { /* 忽略：个别基础库不支持 */ }
  if (typeof wx.setBackgroundColor === 'function') {
    try {
      wx.setBackgroundColor({
        backgroundColor: bg,
        backgroundColorTop: bg,
        backgroundColorBottom: bg,
        fail() {}
      });
    } catch (e) { /* 忽略 */ }
  }
}

function setMode(mode) {
  const m = mode === 'light' ? 'light' : 'auto';
  try { wx.setStorageSync(KEY, m); } catch (e) { /* 忽略 */ }
  applyNav();
  return m;
}

// 给 Page() 用：自动带上 themeClass，并在 onLoad/onShow 时刷新
function mixin(opts) {
  const o = Object.assign({}, opts);
  const origLoad = opts.onLoad;
  const origShow = opts.onShow;
  o.onLoad = function (q) {
    this.setData({ themeClass: themeClass(), themeModeLabel: modeLabel() });
    applyNav();
    if (origLoad) origLoad.call(this, q);
  };
  o.onShow = function () {
    this.setData({ themeClass: themeClass(), themeModeLabel: modeLabel() });
    applyNav();
    if (origShow) origShow.call(this);
  };
  o.data = Object.assign({}, opts.data, {
    themeClass: themeClass(),
    themeModeLabel: modeLabel()
  });
  return o;
}

// 系统主题变化时同步已打开的页面
function refreshPages() {
  applyNav();
  if (typeof getCurrentPages !== 'function') return;
  getCurrentPages().forEach(p => {
    if (p && typeof p.setData === 'function') {
      p.setData({ themeClass: themeClass(), themeModeLabel: modeLabel() });
    }
  });
}

module.exports = {
  getMode,
  setMode,
  modeLabel,
  themeClass,
  resolve,
  applyNav,
  mixin,
  refreshPages
};
