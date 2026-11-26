# -*- coding: utf-8 -*-
import io

# ---------- WXML ----------
p = r"E:\itsme\NoBuy\pages\achievements\achievements.wxml"
s = io.open(p, encoding="utf-8").read()
old = """      <view wx:for="{{item.display}}" wx:for-item="b" wx:key="id"
            class="seal {{b.unlocked ? 'seal-on' : 'seal-off'}}">
        <view class="seal-body">
          <image class="seal-img" src="{{b.unlocked ? '/images/seal_on.png' : '/images/seal_off.png'}}" mode="aspectFit"></image>
          <text class="seal-num {{b.numClass}}">{{b.coinText}}</text>
        </view>
        <text class="seal-unit">{{b.unitText}}</text>
        <text class="seal-state" wx:if="{{b.progressText}}">{{b.progressText}}</text>
      </view>"""
new = """      <view wx:for="{{item.display}}" wx:for-item="b" wx:key="id"
            class="seal {{b.unlocked ? 'seal-on' : 'seal-off'}}">
        <!-- 插画位：18 枚手绘补齐后把这行 src 换成 badge 图（id 即 b.id） -->
        <image class="seal-img" src="{{b.unlocked ? '/images/seal_on.png' : '/images/seal_off.png'}}" mode="aspectFit"></image>
        <text class="seal-label">{{b.coinText}}<text class="seal-unit">{{b.unitText}}</text></text>
        <text class="seal-state" wx:if="{{b.progressText}}">{{b.progressText}}</text>
      </view>"""
assert old in s
s = s.replace(old, new)
io.open(p, "w", encoding="utf-8").write(s)

# ---------- WXSS ----------
p = r"E:\itsme\NoBuy\pages\achievements\achievements.wxss"
s = io.open(p, encoding="utf-8").read()

old = """/* 印章网格 */
.coin-grid { display: flex; flex-wrap: wrap; }
.seal {
  width: 33.333%;
  box-sizing: border-box;
  padding: 24rpx 8rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.seal-body {
  position: relative;
  width: 116rpx;
  height: 116rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.seal-img {
  position: absolute;
  left: 0; top: 0;
  width: 116rpx;
  height: 116rpx;
}
.seal-num {
  position: relative;
  font-weight: 600;
  line-height: 1;
  color: var(--seal-ink-off);
  z-index: 2;
  font-variant-numeric: tabular-nums;
}
.seal-num-2 { font-size: 32rpx; letter-spacing: 0.5rpx; }
.seal-num-3 { font-size: 24rpx; letter-spacing: 0rpx; }
.seal-num-4 { font-size: 22rpx; letter-spacing: 0rpx; }
.seal-on .seal-num { color: var(--seal-ink-on); }

.seal-unit {
  margin-top: 12rpx;
  font-size: 22rpx; color: var(--ink-2);
}
.seal-off .seal-unit { color: var(--ink-3); }

.seal-state {
  margin-top: 4rpx;
  font-size: 22rpx; color: var(--n-400);
  letter-spacing: 0.5rpx;
}"""

new = """/* 成就格：一枚图 + 一行标签 */
.coin-grid { display: flex; flex-wrap: wrap; padding-top: 8rpx }
.seal {
  width: 33.333%;
  box-sizing: border-box;
  padding: 20rpx 8rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.seal-img {
  width: 128rpx;
  height: 128rpx;
}
.seal-off .seal-img { opacity: 0.4 }

.seal-label {
  margin-top: 12rpx;
  font-size: 26rpx; font-weight: 600; color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.seal-off .seal-label { color: var(--ink-3); font-weight: 400 }
.seal-unit {
  font-size: 20rpx; font-weight: 400; color: var(--ink-2);
  margin-left: 4rpx;
}
.seal-off .seal-unit { color: var(--ink-3) }
.seal-state {
  margin-top: 4rpx;
  font-size: 20rpx; color: var(--n-400);
  letter-spacing: 0.5rpx;
}"""
assert old in s
s = s.replace(old, new)
io.open(p, "w", encoding="utf-8").write(s)
print("achievements restructured")
