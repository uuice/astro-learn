---
id: 1ef3b5a7-26a0-61a0-aeca-5e11b525f15e
title: 在Directive中获取组件DOM以及实例
alias:
cover:
created_time: 2022-06-29 10:37:52
updated_time: 2022-06-29 10:37:52
categories:
  - angular
tags:
  - angular
  - directive
excerpt: 在Directive中获取组件DOM以及实例
published: true
---

### 获取DOM

从 `@angular/core` 导入 `ElementRef`。`ElementRef` 的 `nativeElement `属性会提供对宿主 DOM 元素的直接访问权限。

<!-- more -->

```javascript
import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appTest]'
})
export class TestDirective {
  constructor(
    private el: ElementRef,
  ) {
    el.nativeElement.style.backgroundColor = 'yellow';
  }
}
```

### 获取组件实例

> 组件已知的情况下，在自定义指令中获取组件实例

直接在`constructor`中注入对应组件就可以

如下面代码，通过 `this.com` 就可以调用组件的属性和事件

```javascript
import { Directive } from '@angular/core';
import { comTest } from 'comTest';
@Directive({
  selector: '[appTest]'
})
export class TestDirective {
  constructor(
    private com: comTest
  ) {
    console.log(this.com)
  }
}

```
