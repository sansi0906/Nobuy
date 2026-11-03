// pages/trash/trash.js
const store = require('../../utils/storage.js');

Page({
  data: { list: [] },
  onShow() { this.refresh(); },
  refresh() {
    const list = store.getTrashed()
      .map(it => Object.assign({}, it, { trashedAtText: store.formatDateTime(it.trashedAt) }))
      .sort((a, b) => b.trashedAt - a.trashedAt);
    this.setData({ list });
  },
  restore(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '还原这条想法？', content: '会回到冷静中，重新开始算 3 天',
      success: (res) => {
        if (res.confirm) {
          const now = Date.now();
          store.update(id, { state: 'cooling', endTime: now + 3 * 86400000 });
          this.refresh();
          wx.showToast({ title: '已还原', icon: 'none' });
        }
      }
    });
  },
  destroy(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '彻底删除？', content: '删了就找不回来了',
      confirmText: '彻底删除', confirmColor: '#B06A5E',
      success: (res) => {
        if (res.confirm) { store.destroy(id); this.refresh(); }
      }
    });
  }
});
