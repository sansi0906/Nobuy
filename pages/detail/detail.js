const theme = require('../../utils/theme.js');
// pages/detail/detail.js
const store = require('../../utils/storage.js');
const card = require('../../utils/card.js');

const ADD_DAYS = 3;
const DAY_MS = 86400000;

function dateText(ts) {
  const d = new Date(ts);
  const pad = n => (n < 10 ? '0' + n : '' + n);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

Page(theme.mixin({
  data: {
    id: '', item: null,
    phase: 'counting', countdownText: '',
    createTimeText: '', endTimeText: '',
    editing: false, nameDraft: '', remarkDraft: '',
    priceDraft: '', qtyDraft: 1, categoryDraft: '',
    extendDays: 0, extendPreview: '',
    categories: [],
    priceText: '', qtyText: '',
    timer: null,
    cardVisible: false, cardPath: '', cardReady: false
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
    if (!name) { wx.showToast({ title: '先写个名字吧', icon: 'none' }); return; }
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
    const decidedAt = Date.now();
    store.update(item.id, { state: 'skipped', decidedAt });
    const title = savedMoney > 0
      ? '又忍住一件 · 省下 ¥' + store.formatMoney(savedMoney)
      : '又忍住一件，好样的';
    wx.showToast({ title, icon: 'none', duration: 1200 });
    this.load();
    // 判定成功后弹成果卡：先给 toast 一点时间，再盖出预览
    this.pendingCard = this.cardOptsFromItem(Object.assign({}, item, { decidedAt }));
    this.fromDecide = true;
    setTimeout(() => { this.openCard(); }, 600);
  },

  // ---- 成果卡 ----
  // 金额拆成整数与小数两段：整数 168 号字，小数 96 号字（报价单式排版）
  moneyParts(v) {
    const text = store.formatMoney(v);
    if (/万|亿|—/.test(text)) return { whole: text, dec: '' };
    const i = text.indexOf('.');
    return i >= 0 ? { whole: text.slice(0, i), dec: text.slice(i) } : { whole: text, dec: '' };
  },

  cardOptsFromItem(item) {
    const savedMoney = store.validPrice(item.price) * store.qtyOf(item);
    const decidedAt = item.decidedAt || Date.now();
    const days = Math.max(1, Math.ceil((decidedAt - (item.createTime || decidedAt)) / DAY_MS));
    const parts = this.moneyParts(savedMoney);
    return {
      hasMoney: savedMoney > 0,
      moneyWhole: parts.whole,
      moneyDec: parts.dec,
      dateText: dateText(decidedAt).replace(/-/g, '.'),
      qtyText: store.qtyOf(item) + ' 件',
      daysText: days + ' 天',
      category: item.category || store.FALLBACK_CATEGORY,
      itemName: item.name,
      qrPath: '/images/miniprogram_qr_pad.png',
      logoPath: '/images/logo.png'
    };
  },

  openCard() {
    if (this.data.cardReady) {
      this.setData({ cardVisible: true });
      return;
    }
    const opt = this.pendingCard || (this.data.item ? this.cardOptsFromItem(this.data.item) : null);
    if (!opt) return;
    this.setData({ cardVisible: true, cardPath: '', cardReady: false });
    card.renderCard(this, 'cardCanvas', opt)
      .then(path => { this.setData({ cardPath: path, cardReady: true }); })
      .catch(() => {
        this.setData({ cardVisible: false, cardReady: false });
        wx.showToast({ title: '卡片生成失败，稍后再试', icon: 'none' });
      });
  },

  closeCard() {
    this.setData({ cardVisible: false });
    if (this.fromDecide) {
      this.fromDecide = false;
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  shareCard() {
    const path = this.data.cardPath;
    if (!path) return;
    if (typeof wx.showShareImageMenu !== 'function') {
      wx.showToast({ title: '这个微信版本还不能分享图片', icon: 'none' });
      return;
    }
    wx.showShareImageMenu({
      path,
      fail: err => {
        const msg = (err && err.errMsg) || '';
        if (/cancel/i.test(msg)) return;
        if (/permission|deny|auth/i.test(msg)) {
          wx.showToast({ title: '微信没有相册权限，开启后再试', icon: 'none' });
          return;
        }
        wx.showToast({ title: '分享没有完成，稍后再试', icon: 'none' });
      }
    });
  },

  // 详情页常驻入口：已判定「我没买」的记录随时可以再发一次
  makeCard() {
    this.pendingCard = null;
    this.setData({ cardReady: false, cardPath: '' });
    this.openCard();
  },

  decideBuy() {
    const qty = store.qtyOf(this.data.item);
    const total = store.validPrice(this.data.item.price) * qty;
    const go = () => wx.navigateTo({ url: '/pages/decide/decide?id=' + this.data.id + '&action=buy' });
    // 大额记录误点一次就记成「买了」，加一道确认
    if (total >= 500) {
      wx.showModal({
        title: '这条 ¥' + store.formatMoney(total) + '，确定买了？',
        content: '确认后进四个问题，帮你看清这次购买',
        confirmText: '确认买了',
        success: (res) => { if (res.confirm) go(); }
      });
      return;
    }
    go();
  },

  // 点卡片本身不关闭，只拦冒泡
  stopProp() {},

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
}));
