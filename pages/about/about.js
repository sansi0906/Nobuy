// pages/about/about.js
Page({
  data: {
    versionText: '1.0.0',
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
      versionText: version || '1.0.0',
      envText: envMap[env] || '正式版'
    });
  }
});
