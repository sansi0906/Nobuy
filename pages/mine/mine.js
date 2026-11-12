// pages/mine/mine.js
const store = require('../../utils/storage.js');

Page({
  data: {
    profile: { avatar: '', nickname: '', gender: '', defaultDuration: 1 },
    stats: { skipped: 0, bought: 0, saved: 0, total: 0 },
    savedText: '0',
    streak: { current: 0, longest: 0 },
    achievements: [],
    unlockedCount: 0,
    totalAchievements: 0,
    qrVisible: false,
    sheetVisible: false,
    sheetMode: 'export',
    sheetTitle: '',
    sheetSub: '',
    sheetOptions: []
  },

  onShow() {
    const achievements = store.getAchievements();
    const stats = store.getStats();
    this.setData({
      profile: store.getProfile(),
      stats,
      savedText: store.formatMoney(stats.saved),
      streak: store.getStreak(),
      achievements,
      unlockedCount: achievements.filter(a => a.unlocked).length,
      totalAchievements: achievements.length
    });
  },

  goAchievements() {    wx.navigateTo({ url: '/pages/achievements/achievements' });
  },

  goEditProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  // ---- 备份与恢复 ----
  // 入口用页内自绘选择层，而不是 wx.showActionSheet：
  // shareFileMessage / chooseMessageFile 要求「用户点击直接触发」，
  // 经过 actionSheet 回调这一层有被判定为非 tap 的风险，这里每个选项都是真 bindtap。
  exportBackup() { this.openSheet('export'); },
  importBackup() { this.openSheet('import'); },

  openSheet(mode) {
    const isExport = mode === 'export';
    this.setData({
      sheetVisible: true,
      sheetMode: mode,
      sheetTitle: isExport ? '导出备份' : '导入备份',
      sheetSub: isExport
        ? '文件更正式，适合换手机；备份码更保险，转发失败时用它'
        : '两份内容一样，文件是从聊天记录里挑，备份码是从剪贴板里读',
      sheetOptions: isExport
        ? [
            { key: 'file', label: '转发备份文件', desc: '生成一份 JSON，发到微信聊天里存着' },
            { key: 'code', label: '复制备份码', desc: '一段文本，粘到备忘录或文件传输助手' }
          ]
        : [
            { key: 'file', label: '从聊天记录选择文件', desc: '选之前转发出去的那份 JSON' },
            { key: 'code', label: '读取剪贴板里的备份码', desc: '先复制备份码，再点这里' }
          ]
    });
  },

  hideSheet() { this.setData({ sheetVisible: false }); },

  onSheetTap(e) {
    const key = e.currentTarget.dataset.key;
    const mode = this.data.sheetMode;
    this.setData({ sheetVisible: false });
    if (mode === 'export') {
      if (key === 'file') this.shareBackupFile();
      else this.copyBackupCode();
    } else {
      if (key === 'file') this.importFromFile();
      else this.importFromClipboard();
    }
  },

  shareBackupFile() {
    // 文件里放纯 JSON（去掉 NOBUY1: 前缀），用别的工具打开也是一份合法 json
    const text = store.exportBackup().replace('NOBUY1:', '');
    const stamp = this.stampText();
    const fileName = `nobuy-backup-${stamp}.json`;
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
    try {
      wx.getFileSystemManager().writeFileSync(filePath, text, 'utf8');
    } catch (e) {
      wx.showToast({ title: '生成文件失败，改用备份码', icon: 'none' });
      this.copyBackupCode();
      return;
    }
    if (typeof wx.shareFileMessage !== 'function') {
      wx.showToast({ title: '当前微信版本不支持转发，改用备份码', icon: 'none' });
      this.copyBackupCode();
      return;
    }
    wx.shareFileMessage({
      filePath,
      fileName,
      success: () => wx.showToast({ title: '已发送', icon: 'none' }),
      fail: () => {
        wx.showModal({
          title: '文件转发没有成功',
          content: '可以改用备份码：复制后存到备忘录或发给自己，恢复时再粘回来。',
          confirmText: '用备份码',
          success: (r) => { if (r.confirm) this.copyBackupCode(); }
        });
      }
    });
  },

  copyBackupCode() {
    wx.setClipboardData({
      data: store.exportBackup(),
      success: () => {
        wx.showModal({
          title: '备份码已复制',
          content: '粘到备忘录、微信文件传输助手或邮箱里存着。恢复时在「导入备份」里读取剪贴板即可。',
          showCancel: false,
          confirmText: '知道了'
        });
      }
    });
  },

  // 导入：从聊天记录选文件，或直接读剪贴板里的备份码

  importFromFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json', 'txt'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        let text = '';
        try {
          text = wx.getFileSystemManager().readFileSync(file.path, 'utf8');
        } catch (e) {
          wx.showToast({ title: '读取文件失败', icon: 'none' });
          return;
        }
        this.confirmImport(text);
      }
    });
  },

  importFromClipboard() {
    wx.getClipboardData({
      success: (res) => this.confirmImport(res.data),
      fail: () => wx.showToast({ title: '读不到剪贴板，先复制备份码', icon: 'none' })
    });
  },

  // 先解析出摘要给用户看，再决定是否覆盖
  confirmImport(text) {
    const parsed = store.parseBackup(text);
    if (!parsed.ok) {
      const msg = parsed.reason === 'empty'
        ? '剪贴板里没有内容。先用「导出备份」复制一份备份码，再回来恢复。'
        : parsed.reason === 'items'
          ? '这份数据里有记录缺字段，可能来自更早的版本，无法恢复。'
          : '这不是有效的备份内容，或文件已在传输中被改坏。';
      wx.showModal({ title: '备份无法识别', content: msg, showCancel: false, confirmText: '知道了' });
      return;
    }
    const when = parsed.at ? store.formatDateTime(parsed.at) : '未知时间';
    const detail = `备份时间：${when}\n共 ${parsed.count} 条记录（冷静中 ${parsed.cooling}、已决定 ${parsed.decided}、回收站 ${parsed.trashed}），分类 ${parsed.categoryCount} 个。`;
    wx.showModal({
      title: '恢复这份备份？',
      content: `${detail}\n\n恢复会覆盖当前全部数据，覆盖后找不回来。`,
      confirmText: '覆盖恢复',
      confirmColor: '#C4382F',
      success: (r) => {
        if (!r.confirm) return;
        const result = store.importBackup(text);
        if (!result.ok) {
          wx.showToast({ title: result.reason === 'quota' ? '本地空间不足，恢复失败' : '恢复失败', icon: 'none' });
          return;
        }
        this.onShow();
        wx.showModal({
          title: '已恢复',
          content: `共 ${result.count} 条记录已写回本地。`,
          showCancel: false,
          confirmText: '知道了'
        });
      }
    });
  },

  stampText() {
    const d = new Date();
    const p = (n) => (n < 10 ? '0' + n : String(n));
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  },

  clearAll() {
    wx.showModal({
      title: '清空所有数据？',
      content: '包括冷静中、没买、已买、回收站，全部删光，不可恢复',
      confirmText: '全部清空',
      confirmColor: '#C4382F',
      success: (res) => {
        if (res.confirm) {
          wx.showModal({
            title: '再确认一次', content: '真的要清空吗？',
            confirmText: '清空', confirmColor: '#C4382F',
            success: (r2) => {
              if (r2.confirm) {
                const ok = store.clearAll();
                if (!ok) {
                  wx.showToast({ title: '清空失败，请重试', icon: 'none' });
                  return;
                }
                const stats = store.getStats();
                this.setData({ stats, savedText: store.formatMoney(0) });
                wx.showToast({ title: '已清空', icon: 'none' });
              }
            }
          });
        }
      }
    });
  },

  goAbout() { wx.navigateTo({ url: '/pages/about/about' }); },

  // ---- 小程序码弹层 ----
  showQr() { this.setData({ qrVisible: true }); },
  hideQr() { this.setData({ qrVisible: false }); },
  noop() {},
  previewQr() {
    wx.previewImage({ urls: ['/images/miniprogram_qr.png'] });
  }
});
