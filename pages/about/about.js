// pages/about/about.js
const theme = require('../../utils/theme.js');
const { VERSION } = require('../../utils/version.js');

Page(theme.mixin({
  data: {
    versionText: VERSION
  },

  onLoad() {
    let version = '';
    try {
      const info = wx.getAccountInfoSync();
      const mp = (info && info.miniProgram) || {};
      version = mp.version || '';
    } catch (e) {}
    // 体验版/开发版里 getAccountInfoSync 的 version 常为空，回落到本地版本号
    this.setData({ versionText: version || VERSION });
  }
}));
