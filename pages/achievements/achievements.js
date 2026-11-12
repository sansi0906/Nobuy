// pages/achievements/achievements.js
const store = require('../../utils/storage.js');

Page({
  data: {
    groups: [],
    unlockedCount: 0,
    total: 0,
    headPercent: 0,
    streak: { current: 0, longest: 0 },
    savedText: '0'
  },

  onShow() {
    const groups = store.getAchievementGroups();
    const all = groups.reduce((acc, g) => acc.concat(g.items), []);
    const unlockedCount = all.filter(a => a.unlocked).length;
    this.setData({
      groups,
      unlockedCount,
      total: all.length,
      headPercent: all.length ? Math.round((unlockedCount / all.length) * 100) : 0,
      streak: store.getStreak(),
      savedText: store.formatMoney(store.getStats().saved)
    });
  }
});
