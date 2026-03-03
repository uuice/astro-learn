---
id: 1ef3b59b-0a4e-6760-9d78-69ba27cbd20e
title: 通过takeUntil取消订阅可观察对象
alias:
cover:
created_time: 2023-03-01 10:46:32
updated_time: 2023-03-01 10:46:32
categories:
  - javascript
tags:
  - Rxjs
  - Angular
excerpt: Angular 中的单例 Service通过@NgModule()装饰器来声明一个service时， 会与整个应用的生命周期保持一致， 属于单利service （单例模式）。Angular 中的非单例 Service通过@Component()装饰器来声明一个service时，会成为一个非单例的se
published: true
---

### Angular 中的单例 Service / Angular singleton Service

通过`@NgModule()`装饰器来声明一个service时， 会与整个应用的生命周期保持一致， 属于单例service （单例模式）。

<!-- more -->

### Angular 中的非单例 Service / Non-singleton Service in Angular

通过`@Component()`装饰器来声明一个service时，会成为一个非单例的service， 生命周期与component 一致， 当Angular销毁组件实例时，Angular将同时销毁与之绑定的service实例。

非单例service 拥有ngOnDestroy()生命周期， 因此可以通过创建一个非单例的service来取消订阅可观察对象。

### 创建DestroyService / Create DestroyService

```javascript
import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class DestroyService extends Subject<void> implements OnDestroy {
  ngOnDestroy(): void {
    this.next();
    this.complete();
  }
}

```

### 使用方法 / How to use

```javascript
@Component({
  providers: [DestroyService]
})

constructor( private destroy$: DestroyService ) {}

some$.pipe( takeUntil(this.destroy$)).subscribe(...)
```

### 可能的问题 / Memory Leaks

当有多个操作符时，应该始终保证takeUntil是序列中的最后一个操作符， 不然会有内存泄漏的可能。

To avoid problems with memory leaks, the general rule is that takeUntil should be the last operator in the sequence
