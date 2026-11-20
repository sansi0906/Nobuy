// pages/about/about.js
const { VERSION } = require('../../utils/version.js');

Page({
  data: {
    versionText: VERSION,
    envText: '正式版'
  },

  onLoad() {
    let version = '';
    let env = 'release';
    try {
      const info = wx.getAccountInfoSync();
      const mp = (info && info.miniProgram) || {};
      version = mp.version || '';
      env = mp.envVersion || 'release';
    } catch (e) {}
    const envMap = { develop: '开发版', trial: '体验版', release: '正式版' };
    this.setData({
      versionText: version || VERSION,
      envText: envMap[env] || '正式版'
    });
  }
});
