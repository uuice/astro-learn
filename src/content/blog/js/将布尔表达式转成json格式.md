---
id: 1ef3b5a2-b387-6370-adf2-057eb14ae353
title: 将布尔表达式转成json格式
alias:
cover:
created_time: 2022-11-18 17:53:10
updated_time: 2022-11-18 17:53:10
categories:
  - javascript
tags:
excerpt: 简单的词法分析和推栈的应用
published: true
---

### 完整代码

```javascript
const str = '(((((1 & 2) | 3) & 4 & 5) | 6) & 7) | 8'

const operate = ['&', '|'] // 操作符
const divide = ['(', ')'] // 分隔符

// 字符串去除空格转数组 进行词法分析
function translate(str) {
  let arr = str.replace(/ /gi, '').split('')
  let arrTranslate = []
  arr.forEach((itm, idx) => {
    if (operate.indexOf(itm) > -1) {
      // 操作
      arrTranslate.push({
        index: idx,
        type: 'operate',
        value: itm,
      })
    } else if (divide.indexOf(itm) > -1) {
      // 括号分隔符
      arrTranslate.push({
        index: idx,
        type: 'divide',
        value: itm,
      })
    } else {
      // 数字等符号
      arrTranslate.push({
        index: idx,
        type: 'token',
        value: itm,
      })
    }
  })

  return getResultByStack(arrTranslate)
}

function getResultByStack(arrTranslate) {
  // 通过栈分组 先匹配第一个括号 作为第一层的逻辑
  let obj = {
    operate: '',
    tokenList: [],
    children: [],
  }
  let stack = []
  arrTranslate.forEach((item) => {
    if (item.value === '(') {
      stack.push(item)
    }
    if (item.value === ')') {
      stack.push(item)
      // 判断当前分组是否完备 即 （）成对匹配
      if (checkStack(stack)) {
        // 递归匹配子集
        let child = getResultByStack(stack.slice(1, -1))
        obj.children.push(child)
        // 清空栈
        stack = []
      }
    }
    if (item.type === 'operate') {
      if (stack.length === 0) {
        // 如果栈为空 则为当前分组的 操作符
        obj.operate = item.value
      } else {
        // 不为空则是子分组的 操作符
        stack.push(item)
      }
    }

    if (item.type === 'token') {
      if (stack.length === 0) {
        // 如果栈为空 则属于当前分组的 token 列表
        obj.tokenList.push(item)
      } else {
        // 不为空则是子分组的 token 列表
        stack.push(item)
      }
    }
  })
  return obj
}

// 判断栈分组是否完备
function checkStack(stack) {
  let leftCount = stack.filter((itm) => itm.value === '(').length
  let rightCount = stack.filter((itm) => itm.value === ')').length
  return leftCount === rightCount
}

console.log(JSON.stringify(translate(str)))
```

### 结果

```json
{
  "operate": "|",
  "tokenList": [
    {
      "index": 24,
      "type": "token",
      "value": "8"
    }
  ],
  "children": [
    {
      "operate": "&",
      "tokenList": [
        {
          "index": 21,
          "type": "token",
          "value": "7"
        }
      ],
      "children": [
        {
          "operate": "|",
          "tokenList": [
            {
              "index": 18,
              "type": "token",
              "value": "6"
            }
          ],
          "children": [
            {
              "operate": "&",
              "tokenList": [
                {
                  "index": 13,
                  "type": "token",
                  "value": "4"
                },
                {
                  "index": 15,
                  "type": "token",
                  "value": "5"
                }
              ],
              "children": [
                {
                  "operate": "|",
                  "tokenList": [
                    {
                      "index": 10,
                      "type": "token",
                      "value": "3"
                    }
                  ],
                  "children": [
                    {
                      "operate": "&",
                      "tokenList": [
                        {
                          "index": 5,
                          "type": "token",
                          "value": "1"
                        },
                        {
                          "index": 7,
                          "type": "token",
                          "value": "2"
                        }
                      ],
                      "children": []
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```
