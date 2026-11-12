// pages/profile/profile.js
const store = require('../../utils/storage.js');

const PRESETS = {
  male:   ['省钱大王', '攒钱小哥', '极简先生', '不买烈士', '抠门大仙'],
  female: ['省钱小妮', '攒钱小能手', '极简少女', '不买小公主', '抠门小当家'],
  other:  ['冷静消费者', '攒钱达人', '极简主义者', '不买闲人', '佛系攒钱人']
};

Page({
  data: {
    avatar: '',
    nickname: '',
    gender: '',        // '' | 'male' | 'female' | 'other'
    presets: PRESETS.other,
    genders: [
      { key: 'male',   label: '男生' },
      { key: 'female', label: '女生' },
      { key: 'other',  label: '不设' }
    ]
  },

  onLoad() {
    const p = store.getProfile();
    this.setData({
      avatar: p.avatar || '',
      nickname: p.nickname || '',
      gender: p.gender || '',
      presets: PRESETS[p.gender] || PRESETS.other
    });
  },

  // 选微信头像（chooseAvatar 里本身就有「从相册选择」这一项）
  onChooseAvatar(e) {
    const tempPath = e.detail.avatarUrl;
    if (!tempPath) return;
    this.persistAvatar(tempPath);
  },

  // 临时路径会被清理，转存到本地持久目录；同时删掉上一张，避免文件越攒越多
  persistAvatar(tempPath) {
    const prev = this.data.avatar;
    wx.getFileSystemManager().saveFile({
      tempFilePath: tempPath,
      success: (res) => {
        this.setData({ avatar: res.savedFilePath });
        this.removeOldAvatar(prev, res.savedFilePath);
      },
      fail: () => this.setData({ avatar: tempPath })
    });
  },

  removeOldAvatar(oldPath, newPath) {
    if (!oldPath || oldPath === newPath) return;
    // 只清理我们自己转存过的文件，临时路径不碰
    try {
      wx.getFileSystemManager().unlink({
        filePath: oldPath,
        fail: () => {}
      });
    } catch (e) { /* 文件不存在就算了 */ }
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  onClearNickname() {
    this.setData({ nickname: '' });
  },

  pickGender(e) {
    const g = e.currentTarget.dataset.g;
    this.setData({ gender: g, presets: PRESETS[g] || PRESETS.other });
  },

  pickPreset(e) {
    this.setData({ nickname: e.currentTarget.dataset.name });
  },

  onSave() {
    // 昵称可以留空：首页会显示「暂无昵称」，只换头像的用户不该被挡住
    const nickname = (this.data.nickname || '').trim().slice(0, 20);
    const saved = store.saveProfile({
      avatar: this.data.avatar,
      nickname,
      gender: this.data.gender
    });
    if (!saved) {
      wx.showToast({ title: '保存失败，手机本地空间可能不足', icon: 'none' });
      return;
    }
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 600);
  }
});
