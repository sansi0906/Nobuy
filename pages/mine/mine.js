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
    qrVisible: false
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
  // 直接由这一行的点击触发：shareFileMessage / chooseMessageFile 都要求
  // 「由用户点击直接触发」，中间不能再隔一层回调。
  exportBackup() { this.shareBackupFile(); },
  importBackup() { this.importFromFile(); },

  shareBackupFile() {
    // 文件里放纯 JSON（去掉 NOBUY1: 前缀），用别的工具打开也是一份合法 json
    const text = store.exportBackup().replace('NOBUY1:', '');
    const stamp = this.stampText();
    const fileName = `nobuy-backup-${stamp}.json`;
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
    try {
      wx.getFileSystemManager().writeFileSync(filePath, text, 'utf8');
    } catch (e) {
      wx.showToast({ title: '生成文件失败，请重试', icon: 'none' });
      return;
    }
    if (typeof wx.shareFileMessage !== 'function') {
      wx.showToast({ title: '这个微信版本还不能转发文件，升级后可用', icon: 'none' });
      return;
    }
    wx.shareFileMessage({
      filePath,
      fileName,
      // 成功不弹提示：微信在部分机型上"调起转发面板"就回调 success，
      // 用户此时取消也会先看到"已发送"，属于谎报，直接静默
      success: () => {},
      fail: (err) => {
        console.error('[shareFileMessage]', err);
        const raw = (err && err.errMsg) || '';
        if (raw.indexOf('cancel') >= 0) return;   // 用户在转发面板/选择器里取消，不打扰
        wx.showModal({
          title: '转发没有成功',
          content: '备份文件已经生成，但没能打开转发面板。可以重试一次，或换网络后再试。',
          showCancel: false,
          confirmText: '知道了'
        });
      }
    });
  },

  // 导入：从聊天记录里选之前转发出去的那份 JSON
  importFromFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        let text = '';
        try {
          text = wx.getFileSystemManager().readFileSync(file.path, 'utf8');
        } catch (e) {
          console.error('[readFileSync]', e);
          wx.showToast({ title: '这份文件读不出来，换一份再试', icon: 'none' });
          return;
        }
        this.confirmImport(text);
      },
      fail: (err) => {
        // 静默失败会让用户以为点了没反应，这里给中文说明；原始信息只进控制台
        console.error('[chooseMessageFile]', err);
        const raw = (err && err.errMsg) || '';
        if (raw.indexOf('cancel') >= 0) return;   // 用户主动取消，不打扰
        const declared = raw.indexOf('api scope is not declared') >= 0 || err.errno === 112;
        wx.showModal({
          title: declared ? '还差一步配置' : '没能打开聊天记录里的文件',
          content: declared
            ? '微信还没允许这个小程序读取「选中的文件」。需要在 mp 后台「设置 → 服务内容声明 → 用户隐私保护指引」里声明「选中的文件」并通过审核后再试。'
            : '文件没有被打开，可能是选择时取消了，或这份文件已经不在聊天记录里。可以退回去重新选一次。',
          showCancel: false,
          confirmText: '知道了'
        });
      }
    });
  },

  // 先解析出摘要给用户看，再决定是否覆盖
  confirmImport(text) {
    const parsed = store.parseBackup(text);
    if (!parsed.ok) {
      const msg = parsed.reason === 'empty'
        ? '这个文件是空的，换一份之前导出的备份再试。'
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
      content: '包括冷静中、没买、已买、回收站，以及分类、昵称头像，全部删光，不可恢复',
      confirmText: '全部清空',
      confirmColor: '#C4382F',
      success: (res) => {
        if (res.confirm) {
          wx.showModal({
            title: '清空前先备份？',
            content: '会删光清单、回收站、分类、昵称头像，删了找不回。想留一份，先点取消，回上一页点「导出备份」，导出完再回来清空。',
            confirmText: '直接清空', cancelText: '先去备份', confirmColor: '#C4382F',
            success: (r2) => {
              if (r2.confirm) {
                const ok = store.clearAll();
                if (!ok) {
                  wx.showToast({ title: '清空失败，请重试', icon: 'none' });
                  return;
                }
                // 与导入同一套刷新口径：连续天数、勋章进度都依赖 wishList，必须整体重算
                this.onShow();
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
