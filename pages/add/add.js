// pages/add/add.js
const store = require('../../utils/storage.js');

Page({
  data: {
    name: '',
    price: '',
    remark: '',
    durations: store.DURATIONS,
    selected: 1,
    dirty: false
  },

  onLoad() {
    const p = store.getProfile();
    if (typeof p.defaultDuration === 'number') {
      this.setData({ selected: p.defaultDuration });
    }
  },

  onNameInput(e) { this.setData({ name: e.detail.value, dirty: true }); },
  onPriceInput(e) { this.setData({ price: e.detail.value, dirty: true }); },
  onRemarkInput(e) { this.setData({ remark: e.detail.value, dirty: true }); },
  pickDuration(e) { this.setData({ selected: Number(e.currentTarget.id), dirty: true }); },

  onCancel() {
    if (!this.data.dirty) { wx.navigateBack(); return; }
    wx.showModal({
      title: '放弃这次记录？', content: '已填的内容不会被保存',
      confirmText: '放弃', cancelText: '继续编辑',
      success: (res) => { if (res.confirm) wx.navigateBack(); }
    });
  },

  onSave() {
    const name = (this.data.name || '').trim();
    if (!name) { wx.showToast({ title: '先写个名字吧', icon: 'none' }); return; }
    if (name.length > 30) { wx.showToast({ title: '名字别超过 30 字', icon: 'none' }); return; }
    const remark = (this.data.remark || '').trim().slice(0, 100);
    const price = Number(this.data.price);
    const hours = this.data.durations[this.data.selected].hours;
    const now = Date.now();

    store.add({
      id: store.createId(),
      name,
      price: price > 0 ? price : 0,
      remark,
      state: 'cooling',
      createTime: now,
      endTime: now + hours * 3600000
    });

    wx.showToast({ title: '已记下，冷静一下再决定', icon: 'none' });
    setTimeout(() => wx.navigateBack(), 600);
  }
});
