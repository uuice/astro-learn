---
id: 1ef3b5ed-f869-6b00-8f14-0e29fe3fa024
title: javascript观察者模式的简单实现
alias:
cover:
created_time: 2018-03-14 15:15:33
updated_time: 2018-03-14 15:15:33
categories:
  - javascript
tags:
excerpt: 观察者模式当一个对象的状态发生改变，所有依赖于它的对象都将得到通知，也叫做发布-订阅模式基本的代码框架function PubSub() {    this.handlers = {};}PubSub.prototype = {
published: true
---

### 观察者模式

当一个对象的状态发生改变，所有依赖于它的对象都将得到通知，也叫做发布-订阅模式

<!-- more -->

### 基本的代码框架

```javascript
function PubSub() {
  this.handlers = {}
}
PubSub.prototype = {
  // 订阅事件
  on: function (eventType, handler) {},
  // 触发事件(发布事件)
  emit: function (eventType) {},
  // 删除订阅事件
  off: function (eventType, handler) {},
}
```

`this.handlers`保存了所有的事件名称和对应的操作

- 事件的绑定

```javascript
//订阅事件
var self = this
if (!(eventType in self.handlers)) {
  self.handlers[eventType] = []
}
self.handlers[eventType].push(handler)
return this
```

在绑定事件的时候先判断，当前事件名称是否已存在，如果不存在则创建事件名称的数组，再将事件加入

- 触发事件(发布事件)

```javascript
// 触发事件(发布事件)
var self = this
var handlerArgs = Array.prototype.slice.call(arguments, 1)
for (var i = 0; i < self.handlers[eventType].length; i++) {
  self.handlers[eventType][i].apply(self, handlerArgs)
}
return self
```

触发事件时，通过通过事件名称获取绑定在这个事件名上的所有事件，循环调用事件

- 事件删除

```javascript
var currentEvent = this.handlers[eventType]
var len = 0
if (currentEvent) {
  len = currentEvent.length
  for (var i = len - 1; i >= 0; i--) {
    if (currentEvent[i] === handler) {
      currentEvent.splice(i, 1)
    }
  }
}
return this
```

> 上面的代码中最后都有一个return this;是为了实现方法的链式操作

### 实例

```javascript
var pubsub = new PubSub()
var callback = function (data) {
  console.log(data)
}
//订阅事件A
pubsub
  .on('A', function (data) {
    console.log(1 + data)
  })
  .on('A', function (data) {
    console.log(2 + data)
  })
  .on('A', callback)
  .emit('A', '我是参数')
//控制台将输出
//1我是参数
//2我是参数
//我是参数
```

### 完整的代码

```javascript
function PubSub() {
  this.handlers = {}
}
PubSub.prototype = {
  // 订阅事件
  on: function (eventType, handler) {
    var self = this
    if (!(eventType in self.handlers)) {
      self.handlers[eventType] = []
    }
    self.handlers[eventType].push(handler)
    return this
  },
  // 触发事件(发布事件)
  emit: function (eventType) {
    var self = this
    var handlerArgs = Array.prototype.slice.call(arguments, 1)
    for (var i = 0; i < self.handlers[eventType].length; i++) {
      self.handlers[eventType][i].apply(self, handlerArgs)
    }
    return self
  },
  // 删除订阅事件
  off: function (eventType, handler) {
    var currentEvent = this.handlers[eventType]
    var len = 0
    if (currentEvent) {
      len = currentEvent.length
      for (var i = len - 1; i >= 0; i--) {
        if (currentEvent[i] === handler) {
          currentEvent.splice(i, 1)
        }
      }
    }
    return this
  },
}

var pubsub = new PubSub()
var callback = function (data) {
  console.log(data)
}
//订阅事件A
pubsub
  .on('A', function (data) {
    console.log(1 + data)
  })
  .on('A', function (data) {
    console.log(2 + data)
  })
  .on('A', callback)
  .emit('A', '我是参数')
```
