// pages/mine/mine.js
const store = require('../../utils/storage.js');

Page({
  data: {
    profile: { avatar: '', nickname: '', gender: '', defaultDuration: 1 },
    stats: { skipped: 0, bought: 0, saved: 0, total: 0 },
    savedText: '0',
    streak: { current: 0, longest: 0 },
    achievements: [],
    unlockedCount: 0,
    totalAchievements: 0,
    qrVisible: false
  },

  onShow() {
    const achievements = store.getAchievements();
    const stats = store.getStats();
    this.setData({
      profile: store.getProfile(),
      stats,
      savedText: store.formatMoney(stats.saved),
      streak: store.getStreak(),
      achievements,
      unlockedCount: achievements.filter(a => a.unlocked).length,
      totalAchievements: achievements.length
    });
  },

  goAchievements() {    wx.navigateTo({ url: '/pages/achievements/achievements' });
  },

  goEditProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  // 备份/恢复这期不上线，能力留在 storage 里，入口先不暴露
  clearAll() {
    wx.showModal({
      title: '清空所有数据？',
      content: '包括冷静中、没买、已买、回收站，全部删光，不可恢复',
      confirmText: '全部清空',
      confirmColor: '#C4382F',
      success: (res) => {
        if (res.confirm) {
          wx.showModal({
            title: '再确认一次', content: '真的要清空吗？',
            confirmText: '清空', confirmColor: '#C4382F',
            success: (r2) => {
              if (r2.confirm) {
                const ok = store.clearAll();
                if (!ok) {
                  wx.showToast({ title: '清空失败，请重试', icon: 'none' });
                  return;
                }
                const stats = store.getStats();
                this.setData({ stats, savedText: store.formatMoney(0) });
                wx.showToast({ title: '已清空', icon: 'none' });
              }
            }
          });
        }
      }
    });
  },

  goAbout() { wx.navigateTo({ url: '/pages/about/about' }); },

  // ---- 小程序码弹层 ----
  showQr() { this.setData({ qrVisible: true }); },
  hideQr() { this.setData({ qrVisible: false }); },
  noop() {},
  previewQr() {
    wx.previewImage({ urls: ['/images/miniprogram_qr.png'] });
  }
});
