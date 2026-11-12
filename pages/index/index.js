// pages/index/index.js
const store = require('../../utils/storage.js');

const ONBOARD_KEY = 'onboardDone';
// 每次进入小程序只弹一次过期提示，避免反复打扰
let expiredNoticeShown = false;

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
    profile: { nickname: '' },
    emptyTitle: '',
    streak: 0,
    monthSkipped: 0,
    monthSavedText: '0',
    showResultBar: false,
    showOnboard: false,
    listSig: '',
    timer: null
  },

  onShow() {
    this.checkOnboard();     // 先定引导层状态，避免和过期提示叠在一起
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
      .map(it => Object.assign({}, it, {
        phase: store.formatCountdown(it.endTime, now).phase,
        countdownText: store.formatCountdown(it.endTime, now).text,
        createDate: store.formatDateTime(it.createTime).slice(5, 10),
        category: it.category || store.FALLBACK_CATEGORY,
        priceText: store.formatMoney(it.price),
        qtyText: store.qtyOf(it)
      }));

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

    const streak = store.getStreak();
    const month = store.getMonthStats(now);
    const achievements = store.getAchievements();

    // 列表没变化时跳过 setData，30 秒一次的轮询不整表重绘
    const sig = this.data.tab + '|' + list.map(i => i.id + i.countdownText).join(',');
    // 最早到期的待决定项，「去看看」直接落到它的详情页
    const expiredItems = all
      .filter(it => (it.state || 'cooling') === 'cooling' && now > it.endTime)
      .sort((a, b) => a.endTime - b.endTime);
    const firstPendingId = expiredItems.length ? expiredItems[0].id : '';
    const payload = {
      counts, pendingCount, firstPendingId,
      emptyTitle: emptyTitles[this.data.tab],
      streak: streak.current,
      monthSkipped: month.skipped,
      monthSavedText: store.formatMoney(month.saved),
      showResultBar: streak.current > 0 || month.skipped > 0,
      unlockedCount: achievements.filter(a => a.unlocked).length,
      totalAch: achievements.length
    };
    if (sig !== this.data.listSig) {
      payload.list = list;
      payload.listSig = sig;
    }
    this.setData(payload);

    this.syncBadge(pendingCount);
    this.maybeNotifyExpired(pendingCount);
  },

  // tabBar 角标：有过期项时提示，做决定后自动消失
  syncBadge(pendingCount) {
    if (pendingCount > 0) {
      wx.setTabBarBadge({ index: 0, text: String(pendingCount), fail: () => {} });
    } else {
      wx.removeTabBarBadge({ index: 0, fail: () => {} });
    }
  },

  // 启动时强提示一次「有东西到期待决定」
  maybeNotifyExpired(pendingCount) {
    if (expiredNoticeShown || pendingCount <= 0) return;
    if (this.data.showOnboard) return;   // 引导层还在的时候不要叠弹窗
    expiredNoticeShown = true;
    wx.showModal({
      title: '有 ' + pendingCount + ' 件冷静期过了',
      content: '当时想买的东西，现在还想买吗？点开做决定就好。',
      confirmText: '去看看',
      cancelText: '待会儿',
      success: (res) => {
        if (res.confirm) this.goPending();
      }
    });
  },

  // 「去看看」：直接打开最早到期的那条；没有就退回冷静中列表
  goPending() {
    const id = this.data.firstPendingId;
    if (!id) {
      this.setData({ tab: 'cooling' });
      return;
    }
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  // ---- 首次引导 ----
  checkOnboard() {
    if (wx.getStorageSync(ONBOARD_KEY)) return;
    this.setData({ showOnboard: true });
  },
  closeOnboard() {
    try { wx.setStorageSync(ONBOARD_KEY, 1); } catch (e) { /* 忽略 */ }
    this.setData({ showOnboard: false });
  },

  goMine() { wx.switchTab({ url: '/pages/mine/mine' }); },
  noop() {},
  goAdd() {
    this.closeOnboard();
    wx.navigateTo({ url: '/pages/add/add' });
  },
  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },

  // 列表里的删除：先进回收站，可还原
  moveToTrash(e) {
    const id = e.currentTarget.dataset.id;
    const item = (this.data.list || []).filter((x) => x.id === id)[0];
    wx.showModal({
      title: '移到回收站？',
      content: (item ? '「' + item.name + '」' : '这条记录') + '会移到回收站，之后还能还原',
      confirmText: '移过去',
      confirmColor: '#C4382F',
      success: (res) => {
        if (!res.confirm) return;
        store.trash(id);
        wx.showToast({ title: '已移到回收站', icon: 'none' });
        this.refresh();
      }
    });
  }
});
