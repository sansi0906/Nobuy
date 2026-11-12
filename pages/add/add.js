// pages/add/add.js
const store = require('../../utils/storage.js');

Page({
  data: {
    name: '',
    price: '',
    qty: 1,
    remark: '',
    durations: store.DURATIONS,
    selected: 1,
    categories: [],
    category: store.FALLBACK_CATEGORY,
    dirty: false
  },

  onLoad() {
    const p = store.getProfile();
    const categories = store.getCategories();
    const fallback = store.FALLBACK_CATEGORY;
    this.setData({
      selected: typeof p.defaultDuration === 'number' ? p.defaultDuration : 1,
      categories,
      category: categories.indexOf(fallback) >= 0 ? fallback : (categories[0] || fallback)
    });
  },

  onNameInput(e) { this.setData({ name: e.detail.value, dirty: true }); },
  onPriceInput(e) {
    const clean = store.cleanPriceInput(e.detail.value);
    this.setData({ price: clean, dirty: true });
    return clean;
  },
  onRemarkInput(e) { this.setData({ remark: e.detail.value, dirty: true }); },
  minusQty() {
    const q = store.sanitizeQty(this.data.qty - 1);
    if (q === this.data.qty) return;
    this.setData({ qty: q, dirty: true });
  },
  plusQty() {
    if (this.data.qty >= store.MAX_QTY) {
      wx.showToast({ title: '一次最多 ' + store.MAX_QTY + ' 件', icon: 'none' });
      return;
    }
    this.setData({ qty: store.sanitizeQty(this.data.qty + 1), dirty: true });
  },
  pickDuration(e) { this.setData({ selected: Number(e.currentTarget.id), dirty: true }); },

  pickCategory(e) {
    this.setData({ category: e.currentTarget.dataset.name, dirty: true });
  },

  // 新建分类
  newCategory() {
    if (this.data.categories.length >= store.MAX_CATEGORIES) {
      wx.showToast({ title: '最多 ' + store.MAX_CATEGORIES + ' 个分类', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '新建分类',
      editable: true,
      placeholderText: '最多 ' + store.MAX_CATEGORY_NAME + ' 个字',
      success: (res) => {
        if (!res.confirm) return;
        const r = store.addCategory(res.content);
        if (!r.ok) {
          const msg = r.reason === 'exists' ? '已经有这个分类了'
            : r.reason === 'full' ? '分类数量到上限了'
            : '分类名不能为空';
          wx.showToast({ title: msg, icon: 'none' });
          return;
        }
        this.setData({ categories: store.getCategories(), category: r.name, dirty: true });
      }
    });
  },

  // 分类「管理」：先选一个分类，再决定改名还是删除
  manageAll() {
    const list = this.data.categories;
    wx.showActionSheet({
      itemList: list.map((n, i) => n + (n === store.FALLBACK_CATEGORY ? '（只能改名）' : '')),
      success: (res) => {
        const name = list[res.tapIndex];
        if (!name) return;
        this.manageCategory({ currentTarget: { dataset: { name } } });
      }
    });
  },

  // 长按分类：重命名 / 删除
  manageCategory(e) {
    const name = e.currentTarget.dataset.name;
    const isFallback = name === store.FALLBACK_CATEGORY;
    wx.showActionSheet({
      itemList: isFallback ? ['重命名'] : ['重命名', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) this.renameCategory(name);
        else if (res.tapIndex === 1) this.confirmDeleteCategory(name);
      }
    });
  },

  renameCategory(name) {
    wx.showModal({
      title: '重命名「' + name + '」',
      editable: true,
      placeholderText: '留空或取消则不修改',
      success: (res) => {
        if (!res.confirm) return;
        const input = String(res.content || '').trim();
        if (!input) return;   // 没输入就当作没改
        const r = store.renameCategory(name, input);
        if (!r.ok) {
          const msg = r.reason === 'exists' ? '已经有这个分类了' : '分类名不能为空';
          wx.showToast({ title: msg, icon: 'none' });
          return;
        }
        this.setData({
          categories: store.getCategories(),
          category: this.data.category === name ? r.name : this.data.category
        });
        wx.showToast({ title: '已重命名', icon: 'none' });
      }
    });
  },

  confirmDeleteCategory(name) {
    const count = store.countByCategory(name);
    const content = count > 0
      ? '该分类下有 ' + count + ' 条记录，删除后会归入「' + store.FALLBACK_CATEGORY + '」'
      : '删除后不能恢复';
    wx.showModal({
      title: '删除「' + name + '」？',
      content,
      confirmText: '删除',
      confirmColor: '#C4382F',
      success: (res) => {
        if (!res.confirm) return;
        const r = store.deleteCategory(name);
        if (!r.ok) {
          wx.showToast({ title: '这个分类不能删除', icon: 'none' });
          return;
        }
        this.setData({
          categories: store.getCategories(),
          category: this.data.category === name ? store.FALLBACK_CATEGORY : this.data.category
        });
        wx.showToast({ title: '已删除', icon: 'none' });
      }
    });
  },

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
    const price = store.sanitizePrice(this.data.price);
    const qty = store.sanitizeQty(this.data.qty);
    const hours = this.data.durations[this.data.selected].hours;
    const now = Date.now();

    const ok = store.add({
      id: store.createId(),
      name,
      price: price > 0 ? price : 0,
      qty,
      remark,
      category: this.data.category || store.FALLBACK_CATEGORY,
      state: 'cooling',
      createTime: now,
      endTime: now + hours * 3600000
    });

    if (!ok) {
      wx.showToast({ title: '保存失败，手机本地空间可能不足', icon: 'none' });
      return;
    }

    wx.showToast({ title: '已记下，冷静一下再决定', icon: 'none' });
    setTimeout(() => wx.navigateBack(), 600);
  }
});
