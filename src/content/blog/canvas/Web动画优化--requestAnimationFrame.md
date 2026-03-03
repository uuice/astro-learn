---
id: 1ef3b5cf-0201-6880-9695-c8862c624a56
title: Web动画优化--requestAnimationFrame
alias:
cover:
created_time: 2017-05-03 10:06:42
updated_time: 2017-05-03 10:06:42
categories:
  - canvas
tags:
excerpt: 什么是requestAnimationFramewindow.requestAnimationFrame（callback）方法告诉浏览器您希望执行动画，并请求在下一次重新绘制之前,浏览器调用指定的函数更新。 callback该方法作为参数，在重绘之前调用回调。注意：如果您要在下一次重新绘制时进行别
published: true
---

### 什么是requestAnimationFrame

`window.requestAnimationFrame（callback）`方法告诉浏览器您希望执行动画，并请求在下一次重新绘制之前,浏览器调用指定的函数更新。 `callback`该方法作为参数，在重绘之前调用回调。

> 注意：如果您要在下一次重新绘制时进行别的动画处理，则您的回调本身必须调用requestAnimationFrame（）。

<!-- more -->

### 例如：

```javascript
var i = 0
function step() {
  console.log(i++)
  window.requestAnimationFrame(step) //调用step自身
}
window.requestAnimationFrame(step)
```

此例中`step`方法中必须调用`requestAnimationFrame`，才能循环输出

### 优点

该方法通过在系统准备好绘制动画帧时调用该帧，从而为创建动画网页提供了一种更平滑更高效的方法。在此 API 之前，使用 `setTimeout` 和 `setInterval` 绘制的动画并没有为 Web 开发人员提供有效的方法来规划动画的图形计时器。这导致了动画过度绘制，浪费 CPU 周期以及消耗额外的电能等问题。而且，即使看不到网站，特别是当网站使用背景选项卡中的页面或浏览器已最小化时，动画都会频繁出现。

具体可以查看<a href="https://msdn.microsoft.com/library/hh920765(v=vs.85).aspx" target="_blank">MSDN</a>

### 使用方法

`requestAnimationFrame`的用法与`settimeout`很相似，只是不需要设置时间间隔而已。`requestAnimationFrame`使用一个回调函数作为参数，这个回调函数会在浏览器重绘之前调用。它返回一个整数，表示定时器的编号，这个值可以传递给`cancelAnimationFrame`用于取消这个函数的执行

对上面的方法进行修改

```javascript
var i = 0
var time
function step() {
  console.log(i++)
  time = window.requestAnimationFrame(step)
  if (i > 10) {
    cancelAnimationFrame(time) //取消动画
  }
}
time = window.requestAnimationFrame(step)
```

### 兼容性

在老的浏览器中，requestAnimationFrame的方法名是带浏览器前缀的。以下是张鑫旭为在各个浏览器中能统一的调用requestAnimationFrame做的处理。不支持requestAnimationFrame的用setTimeout来代替。

```javascript
/* requestAnimationFrame.js
 * by zhangxinxu 2013-09-30
 */
;(function () {
  var lastTime = 0
  var vendors = ['webkit', 'moz']
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame']
    window.cancelAnimationFrame =
      window[vendors[x] + 'CancelAnimationFrame'] || // Webkit中此取消方法的名字变了
      window[vendors[x] + 'CancelRequestAnimationFrame']
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback, element) {
      var currTime = new Date().getTime()
      var timeToCall = Math.max(0, 16.7 - (currTime - lastTime))
      var id = window.setTimeout(function () {
        callback(currTime + timeToCall)
      }, timeToCall)
      lastTime = currTime + timeToCall
      return id
    }
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id)
    }
  }
})()
```
