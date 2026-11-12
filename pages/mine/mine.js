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
  },

  // ---- 临时调试入口：长按页脚版本号，写入/清除演示数据 ----
  // 上线前删掉这个方法、footer 的 bindlongpress 和 tools/demo_wishlist.json
  seedDemo() {
    const list = wx.getStorageSync('wishList') || [];
    const hasDemo = list.some((it) => String(it.id || '').indexOf('demo_') === 0);
    wx.showActionSheet({
      itemList: [hasDemo ? '清除演示数据' : '写入演示数据（1 条已过期）'],
      success: (res) => {
        if (res.tapIndex !== 0) return;
        this.applyDemo(!hasDemo);
      }
    });
  },

  applyDemo(write) {
    const now = Date.now();
    const day = 86400000;
    let list = wx.getStorageSync('wishList') || [];

    if (!write) {
      list = list.filter((it) => String(it.id || '').indexOf('demo_') !== 0);
      wx.setStorageSync('wishList', list);
      this.onShow();
      wx.showToast({ title: '演示数据已清除', icon: 'none' });
      return;
    }

    const demo = [
      {
        id: 'demo_expired_1', name: '双飞燕键鼠套装', price: 148.88, qty: 1,
        remark: '京东，工作需要', category: '数码', state: 'cooling',
        createTime: now - 3 * day, endTime: now - 3 * 3600000
      },
      {
        id: 'demo_counting_2', name: '降噪耳机', price: 699, qty: 1,
        remark: '通勤路上太吵', category: '数码', state: 'cooling',
        createTime: now - day, endTime: now + 2 * day + 5 * 3600000
      }
    ];
    list = list.concat(demo);
    wx.setStorageSync('wishList', list);
    this.onShow();
    wx.showToast({ title: '已写入 2 条演示数据', icon: 'none' });
  }
});
