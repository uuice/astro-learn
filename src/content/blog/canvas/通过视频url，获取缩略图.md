---
id: 1ef3b5e1-c89c-6410-866c-c03a58533afa
title: 通过视频url，获取缩略图
alias:
cover:
created_time: 2019-06-20 14:22:06
updated_time: 2019-06-20 14:22:06
categories:
  - canvas
tags:
excerpt: 通过视频url，获取缩略图  getVideoImg (url) {      let _this = this      // 创建视频对象      let video = document.createElement(&#39;video&#39;)      video.src = url      video.
published: true
---

### 通过视频url，获取缩略图

<!-- more -->

```javascript
    getVideoImg (url) {
      let _this = this
      // 创建视频对象
      let video = document.createElement('video')
      video.src = url
      video.width = 503
      video.height = 295
      video.setAttribute('crossOrigin', 'Anonymous')
      video.autoplay = true
      // video.play() // 开始播放
      video.addEventListener('loadeddata', () => {
        setTimeout(() => {
          let canvas = document.createElement('canvas')
          canvas.width = 503
          canvas.height = 503
          let ctx = canvas.getContext('2d')
          let imgHeight = video.videoHeight
          let imgWidth = video.videoWidth
          // canvas.width = imgWidth
          // canvas.height = imgHeight
          ctx.drawImage(video, 0, 0, imgWidth, imgHeight, 0, 0, video.width, video.width)
          let img = canvas.toDataURL('image/png')
          // img 为图片信息
          _this.$set(_this.imgList, url, img)
        }, 10)
      }, false)
    },
```
