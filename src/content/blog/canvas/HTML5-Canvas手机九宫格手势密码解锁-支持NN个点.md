---
id: 1ef3b5cb-5325-6760-803d-418bab754735
title: HTML5 Canvas手机九宫格手势密码解锁 ，支持N*N个点
alias:
cover:
created_time: 2018-03-10 11:22:03
updated_time: 2018-03-10 11:22:03
categories:
  - canvas
tags:
excerpt: 对于canvas不熟悉的可以查看 MDN 上的canvas教程在开始之前，先介绍一个数学知识，怎么判断一个点是否在圆内通过判断一个点到圆心的距离是否大于半径。例如：半径是R  如O(x,y)点圆心，任意一点P（x1,y1） （x-x1）*(x-x1)+(y-y1)*(y-y1)&gt;R*R 那么在
published: true
---

> 对于canvas不熟悉的可以查看 MDN 上的<a href="https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/Tutorial" target="_blank">canvas教程</a>

在开始之前，先介绍一个数学知识，怎么判断一个点是否在圆内
通过判断一个点到圆心的距离是否大于半径。
例如：半径是R 如O(x,y)点圆心，任意一点P（x1,y1） `（x-x1）*(x-x1)+(y-y1)*(y-y1)>R*R` 那么在圆外 反之在圆内

<!-- more -->

### 准备及布局设置

本例引入了jQuery，写成了jQuery插件的形式，真实使用的时候，可以去掉jQuery，用原生的js写。

jQuery插件的写法

```javascript
;(function ($) {
  $.fn.locked = function (settings) {
    settings = $.extend({}, defaultSettings, settings)
  }
})(jQuery)

$(function () {
  $('#canvas').locked({
    n: 4,
  })
})
```

默认配置
jQuery插件调用时传入的配置会覆盖defaultSettings
其中`document.body.offsetWidth`获取的是网页可见区域宽，没特殊需要可以不改

```javascript
//两个变量记录，所有的点以及选中的点
var pointArr = [] //点数组
var pointActiveArr = [] //已激活点数组

//默认配置
var defaultSettings = {
  r: 25, //大圆半径
  sr: 8, //小圆半径，小圆既选中状态，内部的小圆
  w: document.body.offsetWidth, //canvas宽度
  h: document.body.offsetWidth, //canvas高度
  n: 3, //数量n*n
  pointColor: '#ff0000', //选中状态点线颜色
  pointDefault: '#686868', //默认点颜色
}
```

获取到canvas对象，并根据设备`dpi`对settings配置进行修改

> 根据`dpi`处理，主要是为了防止手机端访问的时候，canvas变模糊

```javascript
var canvas = $(this)[0] //jQuery对象转成js对象
var ctx = canvas.getContext('2d')

//防止手机端canvas模糊，计算dpi
var dpi = getPixelRatio(ctx)
settings.r *= dpi
settings.sr *= dpi
settings.w *= dpi
settings.h *= dpi

//设置canvas宽度高度
canvas.width = settings.w
canvas.height = settings.h
```

获取`dpi`的方式

```javascript
//获取dpi
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

创建N\*N个点并将x,y点的坐标记录到pointArr数组中，点的位置根据canvas宽高平均分配

```javascript
pointArr = creatPoint()

//创建n*n个点
function creatPoint() {
  var points = []
  for (var row = 0; row < settings.n; row++) {
    for (var col = 0; col < settings.n; col++) {
      points.push({
        x: (settings.w / (settings.n + 1)) * (col + 1),
        y: (settings.h / (settings.n + 1)) * (row + 1),
      })
    }
  }
  return points
}
```

添加事件监听

```javascript
//事件监听
canvas.addEventListener(
  'touchstart',
  function (e) {
    touch(e)
  },
  false
)
canvas.addEventListener(
  'touchmove',
  function (e) {
    touch(e)
  },
  false
)
canvas.addEventListener(
  'touchend',
  function (e) {
    touch(e)
  },
  false
)
```

touch函数统一处理滑动事件

```javascript
//事件监听处理
function touch(e) {
  var e = e || window.event
  console.log(e.type)
  switch (e.type) {
    case 'touchstart':
      isSelect(e.touches[0])
      break
    case 'touchend':
      draw()
      alert('密码结果是：' + pointActiveArr.join('-'))
      pointActiveArr = []
      break
    case 'touchmove':
      isSelect(e.touches[0])
      draw(e.touches[0])
      e.preventDefault()
      break
  }
}
```

滑动开始和滑动过程中通过isSelect判断当前的点是否进入了某个圆内，如果进入了某个圆且这个点没有添加到pointActiveArr数组中，则添加。

```javascript
//判断是否在圆内
//通过数学计算来判断
function isSelect(touche) {
  //遍历所有点，查看当前位置是否在圆内
  for (var i = 0; i < pointArr.length; i++) {
    var point = pointArr[i]
    var x_diff = Math.abs(point.x - touche.pageX * dpi)
    var y_diff = Math.abs(point.y - touche.pageY * dpi)

    //如果 (x_diff*x_diff + y_diff*y_diff) > settings.r*settings.r  则在圆外
    if (x_diff * x_diff + y_diff * y_diff < settings.r * settings.r) {
      if (pointActiveArr.indexOf(i) < 0) {
        pointActiveArr.push(i)
      }
      break
    }
  }
}
```

滑动结束以后输出当前pointActiveArr中的内容，作为密码进行判断，具体判断的逻辑可以自己实现

接下来就是最主要的，绘制canvas，先上代码

```javascript
//绘制canvas
function draw(touch) {
  ctx.clearRect(0, 0, settings.w, settings.h)
  //绘制n*n个圈
  for (var i = 0; i < pointArr.length; i++) {
    var point = pointArr[i]
    ctx.fillStyle = settings.pointDefault
    ctx.beginPath()
    ctx.arc(point.x, point.y, settings.r, 0, Math.PI * 2, true)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(point.x, point.y, settings.r - 6, 0, Math.PI * 2, true)
    ctx.closePath()
    ctx.fill()

    //如果当前点已被选中，这中间添加一个小的圆
    if (pointActiveArr.indexOf(i) >= 0) {
      ctx.fillStyle = settings.pointColor
      ctx.beginPath()
      ctx.arc(point.x, point.y, settings.sr, 0, Math.PI * 2, true)
      ctx.closePath()
      ctx.fill()
    }
  }

  //如果有传当前移动位置，则添加和最后一个选中点的连线
  if (touch != null) {
    var lastPoint = pointArr[pointActiveArr[pointActiveArr.length - 1]]
    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(touch.pageX * dpi, touch.pageY * dpi)
    ctx.stroke()
    ctx.closePath()
  }

  //绘制选中的线
  if (pointActiveArr.length > 0) {
    ctx.beginPath()
    for (var i = 0; i < pointActiveArr.length; i++) {
      var index = pointActiveArr[i]
      ctx.lineTo(pointArr[index].x, pointArr[index].y)
    }
    ctx.lineWidth = 10
    ctx.strokeStyle = settings.pointColor
    ctx.stroke()
    ctx.closePath()
  }
}
```

绘制的时候先画了我们`pointArr`中定义的点，画`N*N`个圆。如果当前点在`pointActiveArr`中存在，则在圆内部画一个小圆。
根据`pointActiveArr`，在相邻的两个点中间，画直线。
`touch`传入的是当前滑动到的位置，将其与 `pointActiveArr`中的最后一个相连。

到此位置基本的功能就实现完了。

### 本例可以做一些进一步的优化

- 可以去除jQuery，用原生js来，因为页面本身引入了jQuery，就直接拿来用了
- canvas底部的N\*N的点不需要每次都重绘，可以用两个canvas进行叠加
- 本例只是实现了绘制的部分，并没有进行具体的解锁逻辑处理。

  可以将密码保存到 localStorage 里，页面打开的时候从本地读取密码，如果没有设置就让用户设置密码，具体的密码规则自己定制。

- 没有添加密码错误/正确的样式，可以在配置中添加相应的颜色，再绘制canvas的时候选择对象的颜色。
