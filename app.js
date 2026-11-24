// app.js
const theme = require('./utils/theme.js');

App({
  onLaunch() {
    // 纯本地存储，不登录、不联网、不索取用户信息
    theme.applyNav();
    // 系统深浅色变化时，已打开的页面跟着换（仅「跟随系统」档会真的变）
    if (typeof wx.onThemeChange === 'function') {
      wx.onThemeChange(() => { theme.refreshPages(); });
    }
  },
  onShow() {
    theme.refreshPages();
  },
  globalData: {}
})
