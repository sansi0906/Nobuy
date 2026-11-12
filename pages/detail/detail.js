// pages/detail/detail.js
const store = require('../../utils/storage.js');

const ADD_DAYS = 3;
const DAY_MS = 86400000;

Page({
  data: {
    id: '', item: null,
    phase: 'counting', countdownText: '',
    createTimeText: '', endTimeText: '',
    editing: false, nameDraft: '', remarkDraft: '',
    priceDraft: '', qtyDraft: 1, categoryDraft: '',
    extendDays: 0, extendPreview: '',
    categories: [],
    priceText: '', qtyText: '',
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
    const qty = store.qtyOf(item);
    this.setData({
      item: Object.assign({}, item, { category: item.category || store.FALLBACK_CATEGORY }),
      priceText: store.formatMoney(item.price),
      qtyText: qty + ' 件',
      phase: cd.phase, countdownText: cd.text,
      createTimeText: store.formatDateTime(item.createTime),
      endTimeText: store.formatDateTime(item.endTime)
    });
  },

  // ---- 编辑态 ----
  startEdit() {
    const item = this.data.item;
    this.setData({
      editing: true,
      nameDraft: item.name,
      remarkDraft: item.remark || '',
      priceDraft: item.price > 0 ? String(item.price) : '',
      qtyDraft: store.qtyOf(item),
      categoryDraft: item.category || store.FALLBACK_CATEGORY,
      categories: store.getCategories(),
      extendDays: 0,
      extendPreview: ''
    });
  },
  cancelEdit() { this.setData({ editing: false }); },

  // 冷静期按天顺延：在「原截止时间」和「现在」里取较晚的那个作为基准
  pickExtend(e) {
    const days = Number(e.currentTarget.dataset.d) || 0;
    if (!days) {
      this.setData({ extendDays: 0, extendPreview: '' });
      return;
    }
    const item = this.data.item;
    const base = Math.max(item.endTime || 0, Date.now());
    const next = base + days * DAY_MS;
    this.setData({ extendDays: days, extendPreview: store.formatDateTime(next) });
  },
  onNameInput(e) { this.setData({ nameDraft: e.detail.value }); },
  onRemarkInput(e) { this.setData({ remarkDraft: e.detail.value }); },
  onPriceInput(e) {
    const clean = store.cleanPriceInput(e.detail.value);
    this.setData({ priceDraft: clean });
    return clean;
  },
  pickCategory(e) { this.setData({ categoryDraft: e.currentTarget.dataset.name }); },
  minusQty() {
    const q = store.sanitizeQty(this.data.qtyDraft - 1);
    this.setData({ qtyDraft: q });
  },
  plusQty() {
    if (this.data.qtyDraft >= store.MAX_QTY) {
      wx.showToast({ title: '一次最多 ' + store.MAX_QTY + ' 件', icon: 'none' });
      return;
    }
    this.setData({ qtyDraft: store.sanitizeQty(this.data.qtyDraft + 1) });
  },

  saveEdit() {
    const name = (this.data.nameDraft || '').trim();
    if (!name) { wx.showToast({ title: '名字不能为空', icon: 'none' }); return; }
    const patch = {
      name,
      remark: (this.data.remarkDraft || '').trim().slice(0, 100),
      price: store.sanitizePrice(this.data.priceDraft),
      qty: store.sanitizeQty(this.data.qtyDraft),
      category: this.data.categoryDraft || store.FALLBACK_CATEGORY
    };
    if (this.data.extendDays > 0) {
      const base = Math.max(this.data.item.endTime || 0, Date.now());
      patch.endTime = base + this.data.extendDays * DAY_MS;
    }
    const ok = store.update(this.data.id, patch);
    if (!ok) { wx.showToast({ title: '保存失败，本地空间可能不足', icon: 'none' }); return; }
    this.setData({ editing: false, extendDays: 0, extendPreview: '' });
    this.load();
    wx.showToast({ title: '已保存', icon: 'none' });
  },

  decideNo() {
    const item = this.data.item;
    const savedMoney = store.validPrice(item.price) * store.qtyOf(item);
    store.update(item.id, { state: 'skipped', decidedAt: Date.now() });
    const title = savedMoney > 0
      ? '又忍住一件 · 省下 ¥' + store.formatMoney(savedMoney)
      : '又忍住一件，好样的';
    wx.showToast({ title, icon: 'none', duration: 1200 });
    setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 900);
  },

  decideBuy() {
    const qty = store.qtyOf(this.data.item);
    const total = store.validPrice(this.data.item.price) * qty;
    const go = () => wx.navigateTo({ url: '/pages/decide/decide?id=' + this.data.id + '&action=buy' });
    // 大额记录误点一次就记成「买了」，加一道确认
    if (total >= 500) {
      wx.showModal({
        title: '这条 ¥' + store.formatMoney(total) + '，确定买了？',
        content: '确认后会把你记成「我买了」，还可以点进去做 4 个反思问题',
        confirmText: '确认买了',
        success: (res) => { if (res.confirm) go(); }
      });
      return;
    }
    go();
  },

  restoreToCooling() {
    wx.showModal({
      title: '恢复到冷静中？',
      content: '截止时间会从现在重新算 ' + ADD_DAYS + ' 天',
      success: (res) => {
        if (res.confirm) {
          const now = Date.now();
          store.update(this.data.id, { state: 'cooling', endTime: now + ADD_DAYS * DAY_MS, decidedAt: 0 });
          this.load();
        }
      }
    });
  }
});
