// utils/card.js
// 「又忍住一件」成果卡：canvas 2d 画 1080×1440 竖图，
// 交给 wx.showShareImageMenu 直接转发（不需要相册授权、不上传服务器）。
//
// 版面是「杂志左对齐」：120 的安全边、960 的版心右界，信息按列对齐。
// 金额是唯一的大字，其余全是灰阶小字，字号比例 168 : 44 : 30 : 24。

const W = 1080;
const H = 1440;
const PAD = 120;
const RIGHT = W - PAD; // 960

const COLORS = {
  ink: '#1B2329',
  ink2: '#5D6B74',
  ink3: '#93A1AA',
  line: '#DDE4E9',
  bg: '#F4F7F9',
  brand: '#CC5E3A'
};

const FONT = '-apple-system, "PingFang SC", "Helvetica Neue", sans-serif';

function loadImage(canvas, src) {
  return new Promise(resolve => {
    if (!canvas || typeof canvas.createImage !== 'function') {
      resolve(null);
      return;
    }
    const img = canvas.createImage();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// 中文没有 letter-spacing 支持，逐字画来拉开字距
function drawSpaced(ctx, text, x, y, gap) {
  let cur = x;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (const ch of text) {
    ctx.fillText(ch, cur, y);
    cur += ctx.measureText(ch).width + gap;
  }
}

async function paint(canvas, ctx, opt) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  // 顶部：左 logo，右日期
  const logo = await loadImage(canvas, opt.logoPath || '/images/logo.png');
  if (logo) ctx.drawImage(logo, PAD, 100, 96, 96);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = COLORS.ink3;
  ctx.font = '400 28px ' + FONT;
  ctx.fillText(opt.dateText || '', RIGHT, 150);

  // 眉标
  ctx.fillStyle = COLORS.ink3;
  ctx.font = '400 34px ' + FONT;
  drawSpaced(ctx, '忍住了', PAD, 434, 14);

  // 主数字：整数与小数分级（报价单式细节）
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if (opt.hasMoney) {
    let x = PAD;
    ctx.fillStyle = COLORS.brand;
    ctx.font = '600 168px ' + FONT;
    ctx.fillText('¥' + (opt.moneyWhole || '0'), x, 616);
    x += ctx.measureText('¥' + (opt.moneyWhole || '0')).width;
    if (opt.moneyDec) {
      ctx.font = '600 96px ' + FONT;
      ctx.fillText(opt.moneyDec, x - 4, 616);
    }
  } else {
    ctx.fillStyle = COLORS.ink;
    ctx.font = '600 120px ' + FONT;
    ctx.fillText('没买 挺好', PAD, 596);
  }

  // 细线
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, 752);
  ctx.lineTo(RIGHT, 752);
  ctx.stroke();

  // 三列微信息：数值在上，标签在下（840 版心等分三列，列宽 280）
  const cols = [
    { x: PAD, value: opt.qtyText || '1 件', label: '件数' },
    { x: 400, value: opt.daysText || '1 天', label: '冷静了' },
    { x: 680, value: opt.category || '其他', label: '分类' }
  ];
  cols.forEach(c => {
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.ink;
    ctx.font = '500 44px ' + FONT;
    ctx.fillText(c.value, c.x, 864);
    ctx.fillStyle = COLORS.ink3;
    ctx.font = '400 24px ' + FONT;
    ctx.fillText(c.label, c.x, 912);
  });

  // 记录名（有才画）
  if (opt.itemName) {
    ctx.fillStyle = COLORS.ink2;
    ctx.font = '400 32px ' + FONT;
    let name = opt.itemName;
    if (name.length > 16) name = name.slice(0, 15) + '…';
    ctx.fillText('— ' + name, PAD, 1010);
  }

  // 底部：左边一句 + 品牌，右下角小程序码（带静区，扫得出来）
  ctx.fillStyle = COLORS.ink2;
  ctx.font = '400 30px ' + FONT;
  ctx.fillText('想买的东西，先放 3 天再说', PAD, 1190);

  ctx.fillStyle = COLORS.ink3;
  ctx.font = '400 26px ' + FONT;
  ctx.fillText('NoBuy', PAD, 1262);

  const qr = await loadImage(canvas, opt.qrPath || '/images/miniprogram_qr_pad.png');
  if (qr) {
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.ink3;
    ctx.font = '400 22px ' + FONT;
    ctx.fillText('微信扫码打开', RIGHT, 1054);
    ctx.drawImage(qr, RIGHT - 288, 1078, 288, 288);
  }
}

// 在页面里生成图片，resolve 出临时文件路径
function renderCard(page, canvasId, opt) {
  return new Promise((resolve, reject) => {
    const query = wx.createSelectorQuery().in(page);
    query.select('#' + canvasId).fields({ node: true, size: true }).exec(res => {
      const node = res && res[0] && res[0].node;
      if (!node) {
        reject(new Error('canvas-not-found'));
        return;
      }
      const ctx = node.getContext('2d');
      node.width = W;
      node.height = H;
      paint(node, ctx, opt)
        .then(() => {
          wx.canvasToTempFilePath({
            canvas: node,
            x: 0, y: 0, width: W, height: H,
            destWidth: W, destHeight: H,
            fileType: 'png',
            success: r => resolve(r.tempFilePath),
            fail: e => reject(e)
          });
        })
        .catch(reject);
    });
  });
}

module.exports = { renderCard, CARD_W: W, CARD_H: H };
