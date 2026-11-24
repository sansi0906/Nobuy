const theme = require('../../utils/theme.js');
// pages/decide/decide.js
const store = require('../../utils/storage.js');

const QUESTIONS = [
  {
    q: '现在就必须用吗？家里有没有同类或替代？',
    options: ['现在就要用', '不急，能用别的代替']
  },
  {
    q: '不打折、没活动，原价还愿意买吗？',
    options: ['原价也愿意', '只为优惠心动']
  },
  {
    q: '接下来半年，大概会用几次？',
    options: ['经常用', '偶尔用', '多半吃灰']
  },
  {
    q: '这笔钱花在别处，是不是更值？',
    options: ['花在这更值', '存着或花别处更好']
  }
];

Page(theme.mixin({
  data: {
    id: '',
    action: 'buy',       // buy | skip
    item: null,
    qty: 1, totalText: '', hasTotal: false,
    priceText: '',
    questions: QUESTIONS,
    answers: [null, null, null, null]
  },

  onLoad(q) {
    const item = store.getById(q.id);
    if (!item) { wx.navigateBack(); return; }
    const qty = store.qtyOf(item);
    const total = store.validPrice(item.price) * qty;
    this.setData({
      id: q.id,
      action: q.action || 'buy',
      item,
      priceText: store.formatMoney(item.price),
      qty,
      totalText: total > 0 ? store.formatMoney(total) : '',
      hasTotal: total > 0 && qty > 1
    });
  },

  pick(e) {
    const idx = Number(e.currentTarget.dataset.q);
    const opt = Number(e.currentTarget.dataset.opt);
    const answers = this.data.answers.slice();
    answers[idx] = opt;
    this.setData({ answers });
  },

  allAnswered() {
    return this.data.answers.every(a => a !== null);
  },

  confirm() {
    store.update(this.data.id, { state: 'bought', decidedAt: Date.now() });
    wx.showToast({ title: '已记下这次购买', icon: 'none' });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/index/index' });
    }, 800);
  },

  cancel() { wx.navigateBack(); }
}));
