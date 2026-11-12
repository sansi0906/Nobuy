/**
 * tools/e2e.js —— 小程序界面级自动回归（miniprogram-automator）
 *
 * 前置：开发者工具 → 设置 → 安全设置 → 打开「服务端口」；工具保持打开。
 * 运行：node tools/e2e.js
 *
 * 本机适配：
 *   - 安装路径含中文，automator 自带 launch 起不来 CLI → 先用 cli.bat 开 9420 端口再连；
 *   - 断言以渲染结果（元素 + 文本）为准，不依赖 page.data 快照；
 *   - wx.showModal / showActionSheet / showToast 点不到，mock 成「记录标题」，
 *     用于断言「点了按钮确实弹了正确的框」；框确认后的写入由 test_storage.js 覆盖。
 */
const automator = require('miniprogram-automator');
const { execSync } = require('child_process');

const PROJECT_PATH = 'E:\\itsme\\NoBuy';
const IDE_DIR = 'D:\\微信web开发者工具';
const AUTO_PORT = 9420;

const DAY = 86400000;
const results = [];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log((ok ? '  PASS  ' : '  FAIL  ') + name + (detail ? '  —— ' + detail : ''));
}

function startIde() {
  const cmd = '.\\cli.bat auto --project "' + PROJECT_PATH + '" --auto-port ' + AUTO_PORT;
  execSync(cmd, { cwd: IDE_DIR, stdio: 'pipe', timeout: 120000 });
}

async function connectIde() {
  // 先试直连：IDE 已经开着 9420 端口时，不再重复拉起工具/新开窗口
  for (let i = 0; i < 3; i++) {
    try {
      return await automator.connect({ wsEndpoint: 'ws://127.0.0.1:' + AUTO_PORT });
    } catch (e) { /* 端口没开，往下走拉起流程 */ }
    await sleep(1500);
  }
  const cmd = '.\\cli.bat auto --project "' + PROJECT_PATH + '" --auto-port ' + AUTO_PORT;
  execSync(cmd, { cwd: IDE_DIR, stdio: 'pipe', timeout: 120000 });
  let lastErr;
  for (let i = 0; i < 5; i++) {
    try {
      return await automator.connect({ wsEndpoint: 'ws://127.0.0.1:' + AUTO_PORT });
    } catch (e) {
      lastErr = e;
      await sleep(3000);
    }
  }
  throw lastErr;
}

const TAB_PAGES = ['/pages/index/index', '/pages/trash/trash', '/pages/mine/mine'];

// 同一个 IDE 窗口里连续跑：能回退就 navigateBack，能切 tab 就 switchTab，
// 只有目标与当前完全相同时才重新加载，避免每条用例都重新 launch 一遍应用
async function ensureIndex(mp) {
  for (let i = 0; i < 9; i++) {
    const cur = await mp.currentPage();
    if (cur && cur.path === 'pages/index/index') return;
    try {
      await mp.navigateBack();
    } catch (e) {
      await mp.switchTab('/pages/index/index');
      await sleep(300);
      return;
    }
    await sleep(300);
  }
  await mp.switchTab('/pages/index/index');
  await sleep(300);
}

async function openPage(mp, url, selector) {
  const cur = await mp.currentPage();
  const curPath = '/' + ((cur && cur.path) || '');
  const basePath = url.split('?')[0];

  if (url === '/pages/index/index') {
    if (curPath !== url) await ensureIndex(mp);
  } else if (TAB_PAGES.indexOf(url) >= 0) {
    await mp.switchTab(url);
  } else if (curPath === basePath) {
    await mp.reLaunch(url);          // 同页不同记录：只能重载这一页
  } else {
    if (curPath !== '/pages/index/index') await ensureIndex(mp);
    await mp.navigateTo(url);
  }

  for (let i = 0; i < 30; i++) {
    const page = await mp.currentPage();
    if (page && page.path) {
      const el = selector ? await page.$(selector) : null;
      if (!selector || el) return page;
    }
    await sleep(250);
  }
  throw new Error('等待元素超时：' + selector);
}

async function waitEl(page, selector) {
  for (let i = 0; i < 25; i++) {
    const el = await page.$(selector);
    if (el) return el;
    await sleep(300);
  }
  throw new Error('元素未出现：' + selector);
}

async function textOf(el) {
  try { return (await el.text()) || ''; } catch (e) { return ''; }
}

async function textOfFirst(page, selector) {
  const el = await page.$(selector);
  return el ? await textOf(el) : '';
}

async function getList(mp) {
  return mp.callWxMethod('getStorageSync', 'wishList') || [];
}

async function getItem(mp, id) {
  return (await getList(mp)).filter((x) => x.id === id)[0] || {};
}

async function lastModal(mp) {
  return mp.callWxMethod('getStorageSync', 'e2e_modal');
}

async function lastToast(mp) {
  return mp.callWxMethod('getStorageSync', 'e2e_toast');
}

async function clearLogs(mp) {
  await mp.callWxMethod('removeStorageSync', 'e2e_modal');
  await mp.callWxMethod('removeStorageSync', 'e2e_toast');
  await mp.callWxMethod('removeStorageSync', 'e2e_sheet');
}

async function main() {
  console.log('启用开发者工具自动化端口…');
  startIde();
  console.log('连接端口 ' + AUTO_PORT + '…');
  const mp = await connectIde();

  await mp.mockWxMethod('showModal', function (opts) {
    try { wx.setStorageSync('e2e_modal', (opts && opts.title) || 'no-title'); } catch (e) { /* 忽略 */ }
    return {};
  });
  await mp.mockWxMethod('showToast', function (opts) {
    try { wx.setStorageSync('e2e_toast', (opts && opts.title) || 'no-title'); } catch (e) { /* 忽略 */ }
    return {};
  });
  await mp.mockWxMethod('showActionSheet', function (opts) {
    try { wx.setStorageSync('e2e_sheet', ((opts && opts.itemList) || []).join('|')); } catch (e) { /* 忽略 */ }
    return {};
  });

  const now = Date.now();
  await mp.callWxMethod('setStorageSync', 'wishList', [
    {
      id: 'e2e_expired', name: 'E2E 过期项', price: 148.88, qty: 1, remark: '自动化', category: '数码',
      state: 'cooling', createTime: now - 3 * DAY, endTime: now - 3 * 3600000
    },
    {
      id: 'e2e_counting', name: 'E2E 冷静中', price: 699, qty: 1, remark: '', category: '数码',
      state: 'cooling', createTime: now - DAY, endTime: now + 2 * DAY
    },
    {
      id: 'e2e_bought', name: 'E2E 已买项', price: 20, qty: 1, remark: '', category: '其他',
      state: 'bought', createTime: now - 2 * DAY, endTime: now - DAY, decidedAt: now - DAY
    },
    {
      id: 'e2e_skipped', name: 'E2E 忍住项', price: 100, qty: 1, remark: '', category: '其他',
      state: 'skipped', createTime: now - 3 * DAY, endTime: now - 2 * DAY, decidedAt: now - DAY
    },
    {
      id: 'e2e_trashed', name: 'E2E 回收站项', price: 88, qty: 1, remark: '', category: '数码',
      state: 'trashed', createTime: now - 2 * DAY, endTime: now - DAY, trashedAt: now
    }
  ]);
  await mp.callWxMethod('setStorageSync', 'onboardDone', 1);
  await mp.callWxMethod('setStorageSync', 'userProfile', {});
  await clearLogs(mp);

  // ---------------- 首页 ----------------
  try {
    const page = await openPage(mp, '/pages/index/index', '.pending');
    const pendingText = await textOf(await page.$('.pending-text'));
    record('首页-过期提醒条', /有 1 件/.test(pendingText), pendingText);

    const items = await page.$$('.item');
    record('首页-冷静中列表条数', items.length === 2, '条数=' + items.length);

    const firstName = await textOf(await page.$('.item .item-name'));
    record('首页-过期项置顶', firstName === 'E2E 过期项', '首条=' + firstName);

    const firstCd = await textOf(await page.$('.item .cd-value'));
    record('首页-倒计时显示已过期', /冷静期已过/.test(firstCd), firstCd);

    const seg = await page.$$('.seg-item');
    record('首页-三段 tab', seg.length === 3, 'tab=' + seg.length);

    // 切到「我买了」
    await seg[2].tap();
    await sleep(500);
    const boughtNames = await page.$$('.item');
    const boughtDate = await textOfFirst(page, '.item .item-date');
    record('首页-我买了 tab 文案', boughtNames.length === 1 && /没忍住/.test(boughtDate),
      '条数=' + boughtNames.length + ' 文案=' + boughtDate);

    // 切到「我没买」
    const seg2 = await page.$$('.seg-item');
    await seg2[1].tap();
    await sleep(500);
    const skipDate = await textOfFirst(page, '.item .item-date');
    record('首页-我没买 tab 文案', /忍住了/.test(skipDate), '文案=' + skipDate);

    // 切回冷静中
    const seg3 = await page.$$('.seg-item');
    await seg3[0].tap();
    await sleep(400);
  } catch (e) {
    record('首页-渲染', false, e.message);
  }

  // ---------------- 我的 ----------------
  try {
    const mine = await openPage(mp, '/pages/mine/mine', '.record-card');
    const meName = await textOf(await mine.$('.me-name'));
    record('我的-无昵称占位文案', meName === '点这里设置昵称和头像', meName);

    const stats = await mine.$$('.stat-num');
    record('我的-战绩数字', (await textOf(stats[0])) === '1' && (await textOf(stats[1])) === '1',
      '忍住=' + (await textOf(stats[0])) + ' 买了=' + (await textOf(stats[1])));

    const saved = await textOf(await mine.$('.ach-metric-money'));
    record('我的-累计省下', saved === '¥100', saved);

    const moreText = await textOf(await mine.$('.ach-more-text'));
    const moreCount = await textOf(await mine.$('.ach-more-count'));
    record('我的-战绩入口', moreText === '我的战绩' && /已解锁 \d+\/18/.test(moreCount),
      moreText + ' / ' + moreCount);

    await clearLogs(mp);
    const clearRow = await waitEl(mine, '.row-danger');
    await clearRow.tap();
    await sleep(600);
    record('我的-清空数据弹确认框', /清空所有数据/.test((await lastModal(mp)) || ''), await lastModal(mp));
  } catch (e) {
    record('我的-渲染', false, e.message);
  }

  // ---------------- 成就 ----------------
  try {
    const ach = await openPage(mp, '/pages/achievements/achievements', '.coin-grid');
    const seals = await ach.$$('.seal');
    record('成就-18 枚印章', seals.length === 18, '印章=' + seals.length);

    const groups = await ach.$$('.group');
    record('成就-三组维度', groups.length === 3, '分组=' + groups.length);

    const notes = await ach.$$('.group-note');
    record('成就-组说明文案', notes.length === 2, '说明=' + notes.length);

    const lit = await ach.$$('.seal-on');
    record('成就-按数据点亮', lit.length >= 1, '点亮=' + lit.length);

    const headNum = await textOf(await ach.$('.head-num'));
    record('成就-进度数字', /\d+\/18/.test(headNum), headNum);

    const foot = await ach.$('.foot');
    const sealTexts = [];
    for (const s of seals) sealTexts.push(await textOf(s));
    record('成就-无底部提示且不显示「已点亮」',
      foot === null && !sealTexts.join('|').includes('已点亮'),
      'foot=' + (foot ? '有' : '无') + ' 印章文本=' + sealTexts.length);
  } catch (e) {
    record('成就-渲染', false, e.message);
  }

  // ---------------- 关于 ----------------
  try {
    const about = await openPage(mp, '/pages/about/about', '.brand');
    const name = await textOf(await about.$('.name'));
    record('关于-品牌名', name === '是不是可以不买', name);

    const aboutTitles = await about.$$('.sec-title');
    record('关于-分节结构完整', aboutTitles.length === 4, '分节=' + aboutTitles.length);

    const bodies = await about.$$('.sec-body');
    const bodyText = [];
    for (const b of bodies) bodyText.push(await textOf(b));
    record('关于-隐私说明含本地与不采集', /本地缓存/.test(bodyText.join('')) && /不会上传/.test(bodyText.join('')),
      bodyText.join('').slice(0, 30) + '…');
    record('关于-不做的事口径', /不售卖任何商品/.test(bodyText.join('')) && /诱导分享/.test(bodyText.join('')),
      '条款=' + bodyText.length);

    const rows = await about.$$('.row');
    record('关于-版本与存储信息行', rows.length === 3, '行数=' + rows.length);
  } catch (e) {
    record('关于-渲染', false, e.message);
  }

  // ---------------- 我的：客服与小程序码 ----------------
  try {
    const mine2 = await openPage(mp, '/pages/mine/mine', '.row-tap');
    const contactRow = await mine2.$('.row-tap');
    const contactText = await textOf(contactRow);
    const hitBtn = await mine2.$('.row-hit');
    record('我的-联系客服入口', /联系客服/.test(contactText) && hitBtn !== null,
      contactText + ' / 热区=' + (hitBtn ? '有' : '无'));

    await clearLogs(mp);
    const qrRow = await waitEl(mine2, '.row-label');
    const qrRows = await mine2.$$('.row-label');
    let qrTap = null;
    for (const r of qrRows) {
      if (/小程序码/.test(await textOf(r))) qrTap = r;
    }
    if (!qrTap) throw new Error('未找到小程序码入口');
    await qrTap.tap();
    await sleep(500);
    const mask = await mine2.$('.qr-mask');
    record('我的-小程序码弹层', mask !== null, '弹层=' + (mask ? '显示' : '无'));
  } catch (e) {
    record('我的-客服与小程序码', false, e.message);
  }

  // ---------------- 个人资料 ----------------
  try {
    const profile = await openPage(mp, '/pages/profile/profile', '.field-input');
    const input = await profile.$('.field-input');
    await input.input('E2E 昵称');
    await sleep(400);
    await clearLogs(mp);
    await (await profile.$('.btn-block')).tap();
    await sleep(700);
    const saved = (await mp.callWxMethod('getStorageSync', 'userProfile')) || {};
    record('资料-昵称保存生效', saved.nickname === 'E2E 昵称', '昵称=' + saved.nickname);

    // 回到我的页应显示昵称与副标
    const mine = await openPage(mp, '/pages/mine/mine', '.me-name');
    const meName = await textOf(await mine.$('.me-name'));
    const meSub = await textOfFirst(mine, '.me-sub');
    record('我的-昵称与副标回显', meName === 'E2E 昵称' && meSub === '修改头像与昵称',
      meName + ' / ' + meSub);
  } catch (e) {
    record('资料-昵称保存生效', false, e.message);
  }

  // ---------------- 详情：冷静中渲染 ----------------
  try {
    const detail = await openPage(mp, '/pages/detail/detail?id=e2e_counting', '.btn-nope');
    const dName = await textOf(await detail.$('.d-name'));
    const nope = await textOf(await detail.$('.btn-nope'));
    const buy = await textOf(await detail.$('.btn-buy'));
    const cdText = await textOfFirst(detail, '.cd-text');
    record('详情-冷静中渲染', /E2E 冷静中/.test(dName) && nope === '我没买' && buy === '我买了',
      dName + ' / ' + nope + ' / ' + buy);
    record('详情-倒计时文案', /还剩/.test(cdText), cdText);

    const metaRows = await detail.$$('.meta-row');
    record('详情-信息卡三行', metaRows.length === 3, '行数=' + metaRows.length);
  } catch (e) {
    record('详情-冷静中渲染', false, e.message);
  }

  // ---------------- 详情：编辑 ----------------
  try {
    // 1) 改名保存
    const detail = await openPage(mp, '/pages/detail/detail?id=e2e_counting', '.edit-chip');
    await (await detail.$('.edit-chip')).tap();
    await sleep(500);
    const nameInput = await waitEl(detail, '.d-edit-name');
    await nameInput.input('E2E 改名');
    await sleep(300);
    await (await detail.$('.btn-primary')).tap();
    await sleep(700);
    record('详情-编辑改名保存', (await getItem(mp, 'e2e_counting')).name === 'E2E 改名',
      'name=' + (await getItem(mp, 'e2e_counting')).name);
  } catch (e) {
    record('详情-编辑改名保存', false, e.message);
  }

  try {
    // 2) 数量 +1
    const detail = await openPage(mp, '/pages/detail/detail?id=e2e_counting', '.edit-chip');
    await (await detail.$('.edit-chip')).tap();
    await sleep(500);
    const qtyBtns = await detail.$$('.qty-btn');
    await qtyBtns[qtyBtns.length - 1].tap();      // ＋
    await sleep(300);
    await (await detail.$('.btn-primary')).tap();
    await sleep(700);
    record('详情-编辑数量加一', (await getItem(mp, 'e2e_counting')).qty === 2,
      'qty=' + (await getItem(mp, 'e2e_counting')).qty);
  } catch (e) {
    record('详情-编辑数量加一', false, e.message);
  }

  try {
    // 3) 取消编辑不落库
    const detail = await openPage(mp, '/pages/detail/detail?id=e2e_counting', '.edit-chip');
    await (await detail.$('.edit-chip')).tap();
    await sleep(500);
    await (await waitEl(detail, '.d-edit-name')).input('不该保存的名字');
    await sleep(300);
    await (await detail.$('.btn-ghost')).tap();   // 取消
    await sleep(600);
    record('详情-取消编辑不落库', (await getItem(mp, 'e2e_counting')).name === 'E2E 改名',
      'name=' + (await getItem(mp, 'e2e_counting')).name);
  } catch (e) {
    record('详情-取消编辑不落库', false, e.message);
  }

  try {
    // 4) 空名保存被拦
    const detail = await openPage(mp, '/pages/detail/detail?id=e2e_counting', '.edit-chip');
    await (await detail.$('.edit-chip')).tap();
    await sleep(500);
    await clearLogs(mp);
    await (await waitEl(detail, '.d-edit-name')).input('   ');
    await sleep(300);
    await (await detail.$('.btn-primary')).tap();
    await sleep(700);
    record('详情-空名保存被拦', /名字不能为空/.test((await lastToast(mp)) || ''), await lastToast(mp));
  } catch (e) {
    record('详情-空名保存被拦', false, e.message);
  }

  // ---------------- 详情：+3 天 ----------------
  try {
    const detail = await openPage(mp, '/pages/detail/detail?id=e2e_counting', '.edit-chip');
    const before = (await getItem(mp, 'e2e_counting')).endTime;
    await (await detail.$('.edit-chip')).tap();
    await sleep(500);
    const pills = await detail.$$('.edit-cat');
    let plus3 = null;
    for (const el of pills) {
      if (/\+3\s*天/.test(await textOf(el))) { plus3 = el; break; }
    }
    if (!plus3) throw new Error('未找到 +3 天胶囊');
    await plus3.tap();
    await sleep(300);
    const tip = await textOf(await detail.$('.extend-tip'));
    record('详情-延长预览文案', /保存后截止/.test(tip), tip);
    await (await detail.$('.btn-primary')).tap();
    await sleep(700);
    const delta = Math.round(((await getItem(mp, 'e2e_counting')).endTime - before) / DAY);
    record('详情-延长 +3 天', delta === 3, '延长 ' + delta + ' 天');
  } catch (e) {
    record('详情-延长 +3 天', false, e.message);
  }

  // ---------------- 详情：决策 ----------------
  try {
    const detail = await openPage(mp, '/pages/detail/detail?id=e2e_expired', '.btn-nope');
    await clearLogs(mp);
    await (await detail.$('.btn-nope')).tap();
    await sleep(800);
    record('详情-我没买直接标记', (await getItem(mp, 'e2e_expired')).state === 'skipped',
      'state=' + (await getItem(mp, 'e2e_expired')).state);
    record('详情-我没买提示省钱', /又忍住一件/.test((await lastToast(mp)) || ''), await lastToast(mp));
  } catch (e) {
    record('详情-我没买直接标记', false, e.message);
  }

  try {
    const detail = await openPage(mp, '/pages/detail/detail?id=e2e_counting', '.btn-buy');
    await clearLogs(mp);
    await (await detail.$('.btn-buy')).tap();
    await sleep(700);
    const modal = (await lastModal(mp)) || '';
    const path = (await mp.currentPage()).path;
    record('详情-大额买触发二次确认', /确定买了/.test(modal), '弹窗=' + modal);
    record('详情-大额确认时不直接跳转', path === 'pages/detail/detail', '停留=' + path);
  } catch (e) {
    record('详情-大额买触发二次确认', false, e.message);
  }

  try {
    const detail = await openPage(mp, '/pages/detail/detail?id=e2e_bought', '.btn-block');
    await clearLogs(mp);
    await (await detail.$('.btn-block')).tap();
    await sleep(700);
    record('详情-恢复冷静中确认框', /恢复到冷静中/.test((await lastModal(mp)) || ''), await lastModal(mp));
    record('详情-已买只留一个主操作', (await detail.$$('.btn-block')).length === 1, '主按钮 1 个');
  } catch (e) {
    record('详情-恢复冷静中确认框', false, e.message);
  }

  // ---------------- 决策页 ----------------
  try {
    // 小额记录点「我买了」应直接进 decide（不弹窗）
    const list = await getList(mp);
    list.push({
      id: 'e2e_decide', name: 'E2E 决策项', price: 30, qty: 1, category: '其他',
      state: 'cooling', createTime: now - DAY, endTime: now - 3600000
    });
    await mp.callWxMethod('setStorageSync', 'wishList', list);

    const detail = await openPage(mp, '/pages/detail/detail?id=e2e_decide', '.btn-buy');
    await clearLogs(mp);
    await (await detail.$('.btn-buy')).tap();
    await sleep(900);
    const path = (await mp.currentPage()).path;
    record('详情-小额买直接进决策页', path === 'pages/decide/decide', '跳转=' + path);

    const decide = await mp.currentPage();
    const qs = await decide.$$('.card');
    record('决策页-四问渲染', qs.length >= 4, '卡片=' + qs.length);

    const tip = await textOf(await decide.$('.head-tip'));
    record('决策页-副标文案', tip === '买之前，先过一遍', tip);

    const opts = await decide.$$('.opt');
    // 4 问，每题 2-3 个选项：各选第一个
    const perQ = [0, 2, 5, 7];
    for (const i of perQ) {
      if (opts[i]) await opts[i].tap();
      await sleep(150);
    }
    const active = await decide.$$('.opt-active');
    record('决策页-选项可多选', active.length === 4, '已选=' + active.length);

    await (await decide.$('.btn-buy')).tap();
    await sleep(900);
    record('决策页-确认买了落库', (await getItem(mp, 'e2e_decide')).state === 'bought',
      'state=' + (await getItem(mp, 'e2e_decide')).state);
  } catch (e) {
    record('决策页-流程', false, e.message);
  }

  // ---------------- 新增页 ----------------
  try {
    const add = await openPage(mp, '/pages/add/add', '.field-input');
    const inputs = await add.$$('.field-input');
    await inputs[0].input('E2E 新增');
    await sleep(300);
    await clearLogs(mp);
    await (await add.$('.btn-primary')).tap();
    await sleep(900);
    const added = (await getList(mp)).filter((x) => x.name === 'E2E 新增')[0];
    const span = added ? Math.round((added.endTime - added.createTime) / DAY) : -1;
    record('新增-默认 3 天', !!added && span === 3, '冷静期 ' + span + ' 天');
    record('新增-保存提示', /已记下/.test((await lastToast(mp)) || ''), await lastToast(mp));
  } catch (e) {
    record('新增-默认 3 天', false, e.message);
  }

  try {
    const add = await openPage(mp, '/pages/add/add', '.field-input');
    const before = (await getList(mp)).length;
    await clearLogs(mp);
    await (await add.$('.btn-primary')).tap();
    await sleep(700);
    record('新增-空名被拦', /先写个名字/.test((await lastToast(mp)) || ''), await lastToast(mp));
    record('新增-空名不落库', (await getList(mp)).length === before, '条数=' + (await getList(mp)).length);
  } catch (e) {
    record('新增-空名被拦', false, e.message);
  }

  try {
    const add = await openPage(mp, '/pages/add/add', '.field-input');
    const inputs = await add.$$('.field-input');
    await inputs[0].input('E2E 24小时');
    await inputs[1].input('123456789');
    await sleep(300);
    // 选 24 小时
    const pills = await add.$$('.dur-pill');
    let hourPill = null;
    for (const el of pills) {
      if (/24\s*小时/.test(await textOf(el))) { hourPill = el; break; }
    }
    if (!hourPill) throw new Error('未找到 24小时选项');
    await hourPill.tap();
    await sleep(300);
    await (await add.$('.btn-primary')).tap();
    await sleep(900);
    const it = (await getList(mp)).filter((x) => x.name === 'E2E 24小时')[0];
    const hours = it ? Math.round((it.endTime - it.createTime) / 3600000) : -1;
    record('新增-选 24 小时生效', hours === 24, '冷静期 ' + hours + ' 小时');
    record('新增-价格超长截断', it && String(it.price).length <= 7, 'price=' + (it && it.price));
  } catch (e) {
    record('新增-选 24 小时生效', false, e.message);
  }

  // ---------------- 回收站 ----------------
  try {
    const trash = await openPage(mp, '/pages/trash/trash', '.item');
    const names = await trash.$$('.item-name');
    record('回收站-条目渲染', names.length === 1 && /E2E 回收站项/.test(await textOf(names[0])),
      '条数=' + names.length);

    record('回收站-双操作按钮',
      (await trash.$$('.btn-restore')).length === 1 && (await trash.$$('.btn-destroy')).length === 1,
      '还原/彻底删除各 1');

    await clearLogs(mp);
    await (await trash.$('.btn-restore')).tap();
    await sleep(600);
    record('回收站-还原确认框', /还原这条想法/.test((await lastModal(mp)) || ''), await lastModal(mp));

    await clearLogs(mp);
    await (await trash.$('.btn-destroy')).tap();
    await sleep(600);
    record('回收站-彻底删除确认框', /彻底删除/.test((await lastModal(mp)) || ''), await lastModal(mp));

    await clearLogs(mp);
    await (await trash.$('.clear-all')).tap();
    await sleep(600);
    record('回收站-清空确认框', /清空回收站/.test((await lastModal(mp)) || ''), await lastModal(mp));
  } catch (e) {
    record('回收站-渲染', false, e.message);
  }

  try {
    await mp.callWxMethod('setStorageSync', 'wishList', []);
    await mp.reLaunch('/pages/trash/trash');
    await sleep(1200);
    const trash = await mp.currentPage();
    const emptyTitle = await textOfFirst(trash, '.empty-title');
    record('回收站-空态文案', emptyTitle === '回收站是空的',
      'path=' + trash.path + ' 文案=' + emptyTitle);
  } catch (e) {
    record('回收站-空态文案', false, e.message);
  }

  // ---------------- 首页空态 + 首次引导 ----------------
  try {
    const page = await openPage(mp, '/pages/index/index', '.empty');
    const emptyTitle = await textOf(await page.$('.empty-title'));
    record('首页-空态标题', /还没有在冷静中的东西/.test(emptyTitle), emptyTitle);
    record('首页-空态只留一个新增入口',
      (await page.$$('.empty-btn')).length === 1 && (await page.$$('.fab')).length === 0,
      '空态按钮 1 / FAB 0');
  } catch (e) {
    record('首页-空态标题', false, e.message);
  }

  try {
    await mp.callWxMethod('removeStorageSync', 'onboardDone');
    await mp.reLaunch('/pages/index/index');
    await sleep(1200);
    const page = await mp.currentPage();
    const onboard = await page.$('.onboard-card');
    record('首页-首次引导出现', !!onboard, onboard ? '已显示' : '未显示');
    if (onboard) {
      await (await page.$('.onboard-btn')).tap();
      await sleep(600);
      const still = await page.$('.onboard-card');
      record('首页-引导可关闭', !still, still ? '仍显示' : '已关闭');
    }
  } catch (e) {
    record('首页-首次引导出现', false, e.message);
  }

  // 清场
  await mp.callWxMethod('removeStorageSync', 'wishList');
  await mp.callWxMethod('removeStorageSync', 'onboardDone');
  await clearLogs(mp);
  await mp.restoreWxMethod('showModal');
  await mp.restoreWxMethod('showToast');
  await mp.restoreWxMethod('showActionSheet');
  await mp.close();

  const passed = results.filter((r) => r.ok).length;
  console.log('\n' + passed + ' 通过 / ' + (results.length - passed) + ' 失败');
  if (passed !== results.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error('自动化失败：' + e.message);
  console.error('检查开发者工具「服务端口」是否开启（设置 → 安全设置）。');
  process.exitCode = 1;
});
