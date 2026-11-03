// pages/detail/detail.js
const store = require('../../utils/storage.js');

Page({
  data: {
    id: '', item: null,
    phase: 'counting', countdownText: '',
    createTimeText: '', endTimeText: '',
    editing: false, nameDraft: '', remarkDraft: '',
    timer: null
  },

  onLoad(q) { this.setData({ id: q.id || '' }); },
  onShow() {
    this.load();
    if (this.data.timer) clearInterval(this.data.timer);
    const timer = setInterval(() => this.load(), 30000);
    this.setData({ timer });
  },
  onHide() { if (this.data.timer) clearInterval(this.data.timer); },
  onUnload() { if (this.data.timer) clearInterval(this.data.timer); },

  load() {
    const item = store.getById(this.data.id);
    if (!item) {
      wx.showToast({ title: '这条记录不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    const cd = store.formatCountdown(item.endTime);
    this.setData({
      item, phase: cd.phase, countdownText: cd.text,
      createTimeText: store.formatDateTime(item.createTime),
      endTimeText: store.formatDateTime(item.endTime)
    });
  },

  startEdit() {
    this.setData({ editing: true, nameDraft: this.data.item.name, remarkDraft: this.data.item.remark || '' });
  },
  cancelEdit() { this.setData({ editing: false }); },
  onNameInput(e) { this.setData({ nameDraft: e.detail.value }); },
  onRemarkInput(e) { this.setData({ remarkDraft: e.detail.value }); },
  saveEdit() {
    const name = (this.data.nameDraft || '').trim();
    if (!name) { wx.showToast({ title: '名字不能为空', icon: 'none' }); return; }
    store.update(this.data.id, { name, remark: (this.data.remarkDraft || '').trim().slice(0, 100) });
    this.setData({ editing: false });
    this.load();
    wx.showToast({ title: '已保存', icon: 'none' });
  },

  extend() {
    wx.showModal({
      title: '延长冷静期 3 天？', content: '在原截止时间上再加 3 天', confirmText: '延长',
      success: (res) => {
        if (res.confirm) {
          store.update(this.data.id, { endTime: this.data.item.endTime + 3 * 86400000 });
          this.load();
        }
      }
    });
  },

  decideNo() {
    store.update(this.data.id, { state: 'skipped' });
    wx.showToast({ title: '又忍住一件，好样的', icon: 'none' });
    setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 800);
  },
  decideBuy() {
    wx.navigateTo({ url: '/pages/decide/decide?id=' + this.data.id + '&action=buy' });
  },

  restoreToCooling() {
    wx.showModal({
      title: '恢复到冷静中？',
      content: '截止时间会从现在重新算 3 天',
      success: (res) => {
        if (res.confirm) {
          const now = Date.now();
          store.update(this.data.id, { state: 'cooling', endTime: now + 3 * 86400000 });
          this.load();
        }
      }
    });
  },

  onTrash() {
    wx.showModal({
      title: '移到回收站？', content: '之后还能在回收站里还原', confirmText: '移过去',
      success: (res) => {
        if (res.confirm) {
          store.trash(this.data.id);
          wx.showToast({ title: '已移到回收站', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 600);
        }
      }
    });
  },

  back() { wx.navigateBack(); }
});
