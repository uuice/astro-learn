---
id: 1ef3b5b7-e0bc-6ce0-ac15-c509070dad5f
title: 深入分析css中单位px和em,rem的区别
alias:
cover:
created_time: 2017-04-29 21:06:21
updated_time: 2017-04-29 21:06:21
categories:
  - css
tags:
excerpt: PX特点IE无法调整那些使用px作为单位的字体大小;EM特点em的值并不是固定的;em会继承父级元素的字体大小。比如父元素设置了1.2em,子元素也设置了1.2em 那么事实上子元素设置的是1.2*1.2 emrem特点rem是CSS3新增的一个相对单位(root em，根em)。这个单位与em有什
published: true
---

### PX特点

IE无法调整那些使用px作为单位的字体大小;

### EM特点

em的值并不是固定的;

em会继承父级元素的字体大小。

比如父元素设置了1.2em,子元素也设置了1.2em 那么事实上子元素设置的是1.2\*1.2 em

### rem特点

rem是CSS3新增的一个相对单位(root em，根em)。

<!-- more -->

- 这个单位与em有什么区别呢?

使用rem为元素设定字体大小时，仍然是相对大小，但相对的只是HTML根元素，比em容易计算。

- 使用rem的问题

IE8及更早版本不支持rem。对于不支持它的浏览器，应对方法也很简单，就是多写一个绝对单位的声明。这些浏览器会忽略用rem设定的字体大小。

### 个人建议

同时使用rem和px，使用px只是为了兼容ie6-ie8这些不支持rem的浏览器

具体实现

根元素设置62.5%

比如

```css
html {
  font-size: 62.5%; /* 10÷16=62.5% */
}
body {
  font-size: 12px;
  font-size: 1.2rem; /* 12÷10=1.2 */
}
p {
  font-size: 14px;
  font-size: 1.4rem;
}
```
