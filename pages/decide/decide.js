// pages/decide/decide.js
const store = require('../../utils/storage.js');

const QUESTIONS = [
  {
    q: '我现在是不是必须要用？家里有没有同类？有没有替代品？',
    options: ['现在就需要', '不急，能用别的代替']
  },
  {
    q: '如果不打折、不搞活动，原价我还愿意买吗？',
    options: ['原价也想买', '就是为了优惠才动心']
  },
  {
    q: '未来半年，我大概会用它几次？',
    options: ['每周都用', '偶尔用用', '买了大概率吃灰']
  },
  {
    q: '这笔钱拿去别的地方，会不会价值更高？',
    options: ['花在这最值', '存起来或花别处更好']
  }
];

Page({
  data: {
    id: '',
    action: 'buy',       // buy | skip
    item: null,
    questions: QUESTIONS,
    answers: [null, null, null, null]
  },

  onLoad(q) {
    const item = store.getById(q.id);
    if (!item) { wx.navigateBack(); return; }
    this.setData({ id: q.id, action: q.action || 'buy', item });
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
    store.update(this.data.id, { state: 'bought' });
    wx.showToast({ title: '记下来了', icon: 'none' });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/index/index' });
    }, 800);
  },

  cancel() { wx.navigateBack(); }
});
