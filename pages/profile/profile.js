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

  // 选微信头像
  onChooseAvatar(e) {
    const tempPath = e.detail.avatarUrl;
    if (!tempPath) return;
    // 临时文件路径会被微信清理，转存到本地持久目录
    wx.getFileSystemManager().saveFile({
      tempFilePath: tempPath,
      success: (res) => {
        this.setData({ avatar: res.savedFilePath });
      },
      fail: () => {
        // 兜底：直接用临时路径（至少本次会话能用）
        this.setData({ avatar: tempPath });
      }
    });
  },

  // 从相册选
  chooseFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        wx.getFileSystemManager().saveFile({
          tempFilePath: tempPath,
          success: (r) => this.setData({ avatar: r.savedFilePath }),
          fail: () => this.setData({ avatar: tempPath })
        });
      }
    });
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  pickGender(e) {
    const g = e.currentTarget.dataset.g;
    this.setData({ gender: g, presets: PRESETS[g] || PRESETS.other });
  },

  pickPreset(e) {
    this.setData({ nickname: e.currentTarget.dataset.name });
  },

  onSave() {
    const nickname = (this.data.nickname || '').trim().slice(0, 20);
    if (!nickname) {
      wx.showToast({ title: '先选个昵称吧', icon: 'none' });
      return;
    }
    store.saveProfile({
      avatar: this.data.avatar,
      nickname,
      gender: this.data.gender
    });
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 600);
  },

  onClear() {
    wx.showModal({
      title: '清空头像和昵称？',
      content: '会恢复成默认状态',
      success: (res) => {
        if (res.confirm) {
          store.saveProfile({ avatar: '', nickname: '', gender: '' });
          this.setData({ avatar: '', nickname: '', gender: '', presets: PRESETS.other });
        }
      }
    });
  }
});
