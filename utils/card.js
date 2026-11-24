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
  ink: '#22282C',
  ink2: '#6B767E',
  ink3: '#9FAAB2',
  line: '#DFE5E9',
  bg: '#FFFFFF'
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
  ctx.fillStyle = COLORS.ink3;
  ctx.font = '400 28px ' + FONT;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(opt.dateText || '', RIGHT, 158);

  // 眉标
  ctx.fillStyle = COLORS.ink3;
  ctx.font = '400 34px ' + FONT;
  drawSpaced(ctx, '忍住了', PAD, 430, 14);

  // 主数字：整数与小数分级（报价单式细节）
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if (opt.hasMoney) {
    let x = PAD;
    ctx.fillStyle = COLORS.ink;
    ctx.font = '600 168px ' + FONT;
    ctx.fillText('¥' + (opt.moneyWhole || '0'), x, 610);
    x += ctx.measureText('¥' + (opt.moneyWhole || '0')).width;
    if (opt.moneyDec) {
      ctx.font = '600 96px ' + FONT;
      ctx.fillText(opt.moneyDec, x - 4, 610);
    }
  } else {
    ctx.fillStyle = COLORS.ink;
    ctx.font = '600 120px ' + FONT;
    ctx.fillText('没买 挺好', PAD, 592);
  }

  // 细线
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, 750);
  ctx.lineTo(RIGHT, 750);
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
    ctx.fillText(c.value, c.x, 862);
    ctx.fillStyle = COLORS.ink3;
    ctx.font = '400 24px ' + FONT;
    ctx.fillText(c.label, c.x, 910);
  });

  // 记录名（有才画）
  if (opt.itemName) {
    ctx.fillStyle = COLORS.ink2;
    ctx.font = '400 32px ' + FONT;
    let name = opt.itemName;
    if (name.length > 16) name = name.slice(0, 15) + '…';
    ctx.fillText('— ' + name, PAD, 1030);
  }

  // 底部：一句 + 品牌
  ctx.fillStyle = COLORS.ink2;
  ctx.font = '400 30px ' + FONT;
  ctx.fillText('想买的东西，先放 3 天再说', PAD, 1225);

  ctx.fillStyle = COLORS.ink3;
  ctx.font = '400 26px ' + FONT;
  ctx.fillText('NoBuy · 本地存储版', PAD, 1295);
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
