// utils/card.js
// 「又忍住一件」成果卡：用 canvas 2d 画一张 1080×1440 的竖图，
// 交给 wx.showShareImageMenu 直接转发（不需要相册授权、不上传服务器）。
//
// 视觉是「大字克制」版：纯白底、大留白、金额是唯一的大数字。
// 所有尺寸写死在 1080×1440 的画布坐标系里，不做等比换算。

const W = 1080;
const H = 1440;

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

function centerText(ctx, text, x, y) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

async function paint(canvas, ctx, opt) {
  const cx = W / 2;
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  // 顶部：logo + 品牌名
  const logo = await loadImage(canvas, opt.logoPath || '/images/logo.png');
  if (logo) {
    const size = 132;
    ctx.drawImage(logo, cx - size / 2, 132, size, size);
  }
  ctx.fillStyle = COLORS.ink3;
  ctx.font = '400 30px ' + FONT;
  centerText(ctx, '是不是可以不买', cx, 320);

  // 主标题
  ctx.fillStyle = COLORS.ink;
  ctx.font = '600 76px ' + FONT;
  centerText(ctx, opt.title || '又忍住一件', cx, opt.hasMoney ? 700 : 760);

  // 金额
  if (opt.hasMoney) {
    ctx.fillStyle = COLORS.ink2;
    ctx.font = '400 34px ' + FONT;
    centerText(ctx, '省下', cx, 800);

    ctx.fillStyle = COLORS.ink;
    ctx.font = '600 150px ' + FONT;
    centerText(ctx, '¥' + opt.moneyText, cx, 930);

    // 细线，把金额和元信息隔开
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 200, 1040);
    ctx.lineTo(cx + 200, 1040);
    ctx.stroke();

    ctx.fillStyle = COLORS.ink2;
    ctx.font = '400 32px ' + FONT;
    centerText(ctx, opt.metaText, cx, 1110);
  } else {
    ctx.fillStyle = COLORS.ink2;
    ctx.font = '400 32px ' + FONT;
    centerText(ctx, opt.metaText, cx, 860);
  }

  // 底部一句
  ctx.fillStyle = COLORS.ink3;
  ctx.font = '400 30px ' + FONT;
  centerText(ctx, '想买的东西，先放 3 天再说', cx, 1268);
  ctx.font = '400 26px ' + FONT;
  centerText(ctx, 'NoBuy · 本地存储版', cx, 1330);
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
