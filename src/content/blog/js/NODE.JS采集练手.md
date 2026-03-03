---
id: 1ef3b5c3-e152-6d60-94dd-7da5eda79cf5
title: NODE.JS采集练手
alias:
cover:
created_time: 2017-05-03 14:05:43
updated_time: 2017-05-03 14:05:43
categories:
  - nodejs
tags:
excerpt: 使用类库request发送请求获取网页内容co执行Generator函数cheerio解析html，和jQuery一样通过选择器获取node-xlsx生成excel文档代码如下&quot;use strict&quot;;const request = require(&#39;request&#3
published: true
---

### 使用类库

- request
  发送请求获取网页内容
- co
  执行Generator函数
- cheerio
  解析html，和jQuery一样通过选择器获取
- node-xlsx
  生成excel文档

<!-- more -->

代码如下

```javascript
'use strict'
const request = require('request')
const co = require('co')
const cheerio = require('cheerio')
const xlsx = require('node-xlsx')
const fs = require('fs')
let base = 'https://aso100.com/app/rank/appid/1188599882/country/cn'
let base_url = 'https://aso100.com/app/rank/appid/1188599882/country/'
let urls = []
let dataArray = []

//通过url，获取网页内容
let getUrl = (url) => {
  return new Promise((resolve, reject) => {
    request(url, function (err, response, body) {
      if (err) {
        return reject(err)
      }
      return err ? reject(err) : resolve(body)
    })
  })
}

//通过url获取需要的字段内容，并存入dataArray
let getDetail = function* (url) {
  let data = yield getUrl(url)
  let $ = cheerio.load(data)
  let title = $('.appinfo-title').text()
  let name = $('.appinfo-country .name').text()
  console.log(title + name)

  dataArray.push([title, name])
}

//休眠函数，避免速度太快
let sleep = (t) => {
  return new Promise((resolve, reject) => {
    setTimeout(function () {
      resolve()
    }, t)
  })
}

//获取base目录中所有需要采集的url地址，并执行采集，最后导出excel
let getUrlArray = function* () {
  let html = yield getUrl(base)
  let $ = cheerio.load(html)
  let ele = $('.select-container').find('a')
  ele.each(function () {
    if ($(this).attr('data-country')) {
      urls.push(base_url + $(this).attr('data-country'))
    }
  })

  //获取内容
  for (let i = 0; i < urls.length; i++) {
    yield sleep(20000)
    yield getDetail(urls[i])
  }

  //导出excel
  let buffer = xlsx.build([{ name: 'mySheetName', data: dataArray }])
  fs.writeFileSync('test.csv', buffer, 'binary')
}

//通过co执行Generator
let run = (fn) => {
  co(fn).catch((err) => {
    console.log(err)
  })
}

//开始采集
run(getUrlArray())
```
