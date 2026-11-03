// pages/index/index.js
const store = require('../../utils/storage.js');

Page({
  data: {
    tab: 'cooling',
    tabs: [
      { key: 'cooling', label: '冷静中' },
      { key: 'skipped', label: '我没买' },
      { key: 'bought',  label: '我买了' }
    ],
    list: [],
    counts: { cooling: 0, skipped: 0, bought: 0 },
    pendingCount: 0,
    timer: null,
    profile: { nickname: '' },
    emptyTitle: ''
  },

  onShow() {
    this.refresh();
    this.setData({ profile: store.getProfile() });
    if (this.data.timer) clearInterval(this.data.timer);
    const timer = setInterval(() => this.refresh(), 30000);
    this.setData({ timer });
  },
  onHide() { if (this.data.timer) clearInterval(this.data.timer); },
  onUnload() { if (this.data.timer) clearInterval(this.data.timer); },
  onPullDownRefresh() { this.refresh(); wx.stopPullDownRefresh(); },

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
    this.refresh();
  },

  refresh() {
    const now = Date.now();
    const all = store.getAll();

    const counts = { cooling: 0, skipped: 0, bought: 0 };
    let pendingCount = 0;
    all.forEach(it => {
      const s = it.state || 'cooling';
      if (counts[s] !== undefined) counts[s]++;
      if (s === 'cooling' && now > it.endTime) pendingCount++;
    });

    const list = all
      .filter(it => (it.state || 'cooling') === this.data.tab)
      .map(it => {
        const cd = store.formatCountdown(it.endTime, now);
        return Object.assign({}, it, {
          phase: cd.phase,
          countdownText: cd.text,
          createDate: store.formatDateTime(it.createTime).slice(5, 10)
        });
      });

    if (this.data.tab === 'cooling') {
      list.sort((a, b) => {
        const ae = a.phase === 'expired' ? 0 : 1;
        const be = b.phase === 'expired' ? 0 : 1;
        if (ae !== be) return ae - be;
        return a.endTime - b.endTime;
      });
    } else {
      list.sort((a, b) => b.createTime - a.createTime);
    }

    const emptyTitles = {
      cooling: '还没有在冷静中的东西',
      skipped: '还没有忍住的东西',
      bought:  '还没有买过的东西'
    };

    this.setData({ list, counts, pendingCount, emptyTitle: emptyTitles[this.data.tab] });
  },

  goAdd() { wx.navigateTo({ url: '/pages/add/add' }); },
  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  }
});
