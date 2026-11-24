const theme = require('../../utils/theme.js');
// pages/trash/trash.js
const store = require('../../utils/storage.js');

Page(theme.mixin({
  data: { list: [] },
  onShow() { this.refresh(); },
  refresh() {
    const list = store.getTrashed()
      .map(it => Object.assign({}, it, {
        trashedAtText: store.formatDateTime(it.trashedAt),
        priceText: store.formatMoney(it.price)
      }))
      .sort((a, b) => b.trashedAt - a.trashedAt);
    this.setData({ list });
  },
  restore(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '还原这条想法？', content: '会回到冷静中，冷静期重新算 3 天',
      success: (res) => {
        if (res.confirm) {
          const now = Date.now();
          store.update(id, { state: 'cooling', endTime: now + 3 * 86400000, decidedAt: 0 });
          this.refresh();
          wx.showToast({ title: '已还原', icon: 'none' });
        }
      }
    });
  },
  destroy(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '彻底删除？', content: '删掉后无法恢复',
      confirmText: '彻底删除', confirmColor: '#C4382F',
      success: (res) => {
        if (res.confirm) { store.destroy(id); this.refresh(); }
      }
    });
  },

  clearTrash() {
    if (this.data.list.length === 0) return;
    wx.showModal({
      title: '清空回收站？',
      content: this.data.list.length + ' 条记录将彻底删除，无法恢复',
      confirmText: '全部删除',
      confirmColor: '#C4382F',
      success: (res) => {
        if (!res.confirm) return;
        if (!store.clearTrashed()) {
          wx.showToast({ title: '删除失败，请重试', icon: 'none' });
          return;
        }
        this.refresh();
        wx.showToast({ title: '已清空', icon: 'none' });
      }
    });
  }
}));
