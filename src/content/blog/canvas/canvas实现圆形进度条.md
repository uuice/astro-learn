---
id: 1ef3b5b1-f8de-63b0-8838-ac54a1c91482
title: canvas实现圆形进度条
alias:
cover:
created_time: 2017-04-29 22:16:42
updated_time: 2017-04-29 22:16:42
categories:
  - canvas
tags:
excerpt:
published: true
---

### 需要关注的几个点

- 弧形的圆角
  通过定义`ctx.lineCap = 'round';`来实现
- 避免移动端canvas模糊，需要先计算`dpi`来进行适配，通过`getPixelRatio`方法。也可以直接计算为2倍或3倍（偷懒的做法）
- 可以通过requestAnimationFrame来对canvas动画进行优化，本例未做处理。有兴趣的可以自行查看相关信息。

<!-- more -->

### 代码如下

html

```html
<div class="canvas_box">
  <canvas id="canvas" width="420" height="420" data-val="90"></canvas>
  <div id="canvas_text">
    <p class="s_title">预期年化利率</p>
    <p class="s_value">
      6<em>%</em>
      <i>+9%</i>
    </p>
  </div>
</div>
```

css

```css
.canvas_box {
  position: relative;
  display: block;
  width: 210px;
  height: 200px;
  margin: 15px auto 0;
  overflow: hidden;
}

.canvas_box #canvas,
.canvas_box #canvas_text {
  width: 210px;
  height: 210px;
  margin: 0 auto;
  position: relative;
  display: block;
}

.canvas_box #canvas_text {
  top: -210px;
}

.canvas_box #canvas_text .s_title {
  margin-top: 65px;
  color: #6b6d7c;
  text-align: center;
  font-size: 14px;
}

.canvas_box #canvas_text .s_value {
  margin-top: 20px;
  text-align: center;
  color: #ff5971;
  font-size: 40px;
  font-weight: 700;
  position: relative;
}

.canvas_box #canvas_text .s_value em {
  font-size: 14px;
  font-style: normal;
}

.canvas_box #canvas_text .s_value i {
  width: 42px;
  height: 22px;
  font-size: 12px;
  font-style: normal;
  position: absolute;
  top: -15px;
  left: 45%;
  margin-left: 35px;
  line-height: 18px;
  text-align: center;
  -webkit-background-size: 100% 100%;
  -moz-background-size: 100% 100%;
  -o-background-size: 100% 100%;
  background-size: 100% 100%;
  color: #7ac6f5;
}
```

js

```javascript
window.requestAnimationFrame =
  window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.msRequestAnimationFrame

function draw(degrees) {
  var canvas = document.getElementById('canvas')
  var ctx = canvas.getContext('2d')
  var dpi = getPixelRatio(ctx)
  canvas.width = 210 * dpi
  canvas.height = 210 * dpi

  ctx.beginPath()
  ctx.clearRect(0, 0, 210 * dpi, 210 * dpi)
  ctx.arc(105 * dpi, 105 * dpi, 90 * dpi, Math.PI * 0.75, Math.PI * 0.25, false)
  ctx.lineWidth = 8 * dpi
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'rgb(236,236,236)'
  ctx.stroke()

  if (degrees != 0.75) {
    ctx.beginPath()
    ctx.arc(
      105 * dpi,
      105 * dpi,
      90 * dpi,
      Math.PI * 0.75,
      Math.PI * degrees,
      false
    )
    ctx.lineWidth = 12 * dpi
    ctx.lineCap = 'round'
    ctx.strokeStyle = 'rgb(255,89,113)'
    ctx.stroke()
  }

  // ctx.beginPath();
  // ctx.font = "14px serif";
  // ctx.fillText("预期年化利率", 105, 65);
  // ctx.fillStyle = "#6b6d7c";
  // ctx.textAlign = "center";
}
;(function ($) {
  $(function () {
    var canvas = $('#canvas')
    var val = canvas.attr('data-val')
    var _val = 0
    var degrees = 0

    var t = setInterval(function () {
      degrees = 0.75 + (1.5 * _val) / 100
      draw(degrees)
      if (_val == val) {
        clearInterval(t)
      } else {
        _val++
        if (_val > val) {
          clearInterval(t)
        }
      }
    }, 10)
  })
})(jQuery)

function getPixelRatio(context) {
  var backingStore =
    context.backingStorePixelRatio ||
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio ||
    1

  return (window.devicePixelRatio || 1) / backingStore
}
```
