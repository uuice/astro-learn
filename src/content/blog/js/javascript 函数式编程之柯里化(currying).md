---
id: 1ef3b5bb-0805-6d80-9432-553b597926f2
title: javascript 函数式编程之柯里化(currying)
alias:
cover:
created_time: 2018-03-14 14:45:46
updated_time: 2018-03-14 14:45:46
categories:
  - javascript
tags:
excerpt:
published: true
---

### 什么是柯里化

函数柯里化（curry）的定义很简单：传递给函数一部分参数来调用它，让它返回一个函数去处理剩下的参数。

<!-- more -->

### js中柯里化的基本实现

```javascript
// 柯里化通用实现
function currying(fn) {
  var slice = Array.prototype.slice
  var args = slice.call(arguments, 1)
  return function () {
    var innerArgs = slice.call(arguments)
    var finalArgs = args.concat(innerArgs)
    return fn.apply(null, finalArgs)
  }
}
```

### 通过柯里化实现阶乘的函数

```javascript
//乘积
function tailFactorial(total, n) {
  if (n == 1) return total
  return tailFactorial(n * total, n - 1)
}
const factorial = currying(tailFactorial, 1)
console.log(factorial(5)) //120
```

`tailFactorial`传入了两个参数，最后返回一个函数

### 上面的柯里化函数只能调用一次，下面对他进行改造可以调用多次

```javascript
function currying2(fn) {
  var _args = []
  return function cb() {
    if (arguments.length === 0) {
      return fn.apply(this, _args)
    }
    Array.prototype.push.apply(_args, arguments)
    return cb
  }
}
```

在这个函数中，我们定义了一个\_args变量，用于记录多次调用的参数，当最后一次调用没有传入参数时才最后处理

- 下面定义一个累加函数，在这个例子中我们可以看到柯里化的一个特性--延迟求值

```javascript
//逐步求值 (延迟执行)
function add() {
  var sum = 0,
    i,
    len
  for (i = 0, len = arguments.length; i < len; i++) {
    sum += arguments[i]
  }
  return sum
}
const addCurry = currying2(add)
console.log(addCurry(3)(3)(2)(1, 1, 1)())
```
