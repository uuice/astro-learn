---
id: 1ef3b5e7-6a16-6cf0-bda8-629a71b2a5d5
title: “被污染”的 canvas
alias:
cover:
created_time: 2018-04-18 21:23:37
updated_time: 2018-04-18 21:23:37
categories:
  - canvas
tags:
excerpt: 什么是“被污染”的 canvas?尽管不通过 CORS 就可以在画布中使用图片，但是这会污染画布。一旦画布被污染，你就无法读取其数据。例如，你不能再使用画布的 toBlob(), toDataURL() 或 getImageData() 方法，调用它们会抛出安全错误。这种机制可以避免未经许可拉取远程
published: true
---

### 什么是“被污染”的 canvas?

尽管不通过 CORS 就可以在画布中使用图片，但是这会污染画布。一旦画布被污染，你就无法读取其数据。例如，你不能再使用画布的 `toBlob()`, `toDataURL()` 或 `getImageData()` 方法，调用它们会抛出安全错误。

这种机制可以避免未经许可拉取远程网站信息而导致的用户隐私泄露。

<!-- more -->

### 如何在canvas中使用跨越图片

HTML 规范中图片有一个 crossorigin 属性，结合合适的 CORS 响应头，就可以实现在画布中使用跨域 元素的图像。

设置 Access-Control-Allow-Origin 为 "\*"

### 例如通过url获取base64图片，代码如下

```javascript
getImgBase64 (path, callback) {
	let img = new Image()
	img.crossOrigin = 'anonymous'
	img.onload = function () {
		let canvas = document.createElement('canvas')
		let ctx = canvas.getContext('2d')
		// 获取图片宽高
		let imgWidth = img.width
		let imgHeight = img.height
		// 设置画布宽高与图片宽高相同
		canvas.width = imgWidth
		canvas.height = imgHeight
		// 绘制图片
		ctx.drawImage(img, 0, 0, imgWidth, imgHeight)

		// 图片展示的 data URI
		let dataUrl = canvas.toDataURL('image/jpeg')
		callback(dataUrl)
	}

	img.onerror = function () {
	}
	img.src = path
}
```

回调处理

```javascript
getImgBase64(imgUrl, function (base64) {
  console.log(base64)
})
```
