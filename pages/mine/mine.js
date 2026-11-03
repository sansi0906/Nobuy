// pages/mine/mine.js
const store = require('../../utils/storage.js');

Page({
  data: {
    profile: { avatar: '', nickname: '', gender: '', defaultDuration: 1 },
    stats: { skipped: 0, bought: 0, saved: 0, total: 0 }
  },

  onShow() {
    this.setData({
      profile: store.getProfile(),
      stats: store.getStats()
    });
  },

  goEditProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  clearAll() {
    wx.showModal({
      title: '清空所有数据？',
      content: '包括冷静中、没买、已买、回收站，全部删光，不可恢复',
      confirmText: '全部清空',
      confirmColor: '#B06A5E',
      success: (res) => {
        if (res.confirm) {
          wx.showModal({
            title: '再确认一次', content: '真的要清空吗？',
            confirmText: '清空', confirmColor: '#B06A5E',
            success: (r2) => {
              if (r2.confirm) {
                store.clearAll();
                this.setData({ stats: store.getStats() });
                wx.showToast({ title: '已清空', icon: 'none' });
              }
            }
          });
        }
      }
    });
  },

  goAbout() { wx.navigateTo({ url: '/pages/about/about' }); }
});
