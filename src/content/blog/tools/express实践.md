---
id: 1ef3b5db-fc15-6310-b8d7-128489aa72d6
title: express实践
alias:
cover:
created_time: 2017-04-29 20:52:30
updated_time: 2017-04-29 20:52:30
categories:
  - nodejs
tags:
excerpt: Node.js 7.0发布之前，写一篇关于express的文章项目创建使用express-generator使用npm install express-generator -g代码修改自动重启使用nodemonnodemon ./bin/www全局设置//加载配置项global.Config = r
published: true
---

Node.js 7.0发布之前，写一篇关于express的文章

#### 项目创建

使用express-generator

- 使用npm install express-generator -g

#### 代码修改自动重启

使用nodemon

- nodemon ./bin/www

#### 全局设置

<!-- more -->

```js
//加载配置项
global.Config = require(path.resolve(Root, './config/config'))
//通用方法(设置为全局对象，方便调用)
global.F = require(path.resolve(Root, './common/funcs'))
//socket事件方法
global.Socket = require(path.resolve(Root, './socket/socket'))
//加载所有的数据库model
global.M = {}
//model存储路径 （暂时不支持二级目录）
var modelsPath = path.resolve(Root, 'models')
fs.readdirSync(modelsPath).forEach(function (name) {
  if (path.extname(name) !== '') {
    name = path.basename(name, '.js')
    M[name] = require(path.resolve(modelsPath, name))
  }
})
```

使用co、Promise（bluebird）进行异步处理

定义通用方法run实行Promise,并抛出错误

```js
let run = (fn, next) => {
  co(fn).catch((err) => {
    next(err)
  })
}
```

#### 通用方法列表 (大部分抄袭thinkjs)

```js
module.exports = {
  run: run,
  promisify: promisify,
  camelCase: camelCase,
  defer: defer,
  Class: Class,
  extend: extend,
  isClass: isClass,
  isBoolean: isBoolean,
  isNumber: isNumber,
  isObject: isObject,
  isString: isString,
  isArray: isArray,
  isFunction: isFunction,
  isDate: util.isDate,
  isRegExp: util.isRegExp,
  isError: util.isError,
  isIP: net.isIP,
  isIP4: net.isIPv4,
  isIP6: net.isIPv6,
  isFile: isFile,
  isFileAsync: isFileAsync,
  isDir: isDir,
  isDirAsync: isDirAsync,
  isNumberString: isNumberString,
  isPromise: isPromise,
  isWritable: isWritable,
  isBuffer: isBuffer,
  isTrueEmpty: isTrueEmpty,
  isEmpty: isEmpty,
  clone: clone,
  mkdir: mkdir,
  rmdir: rmdir,
  md5: md5,
  chmod: chmod,
  getFiles: getFiles,
  escapeHtml: escapeHtml,
  datetime: datetime,
  getDateTime: getDateTime,
  randomString: randomString,
}
```

#### 数据库操作（mysql）

简单的数据库查询，没有封装sql（懒）

```js
var mysql = require('mysql')
var Promise = require('bluebird')
var dbConfig = Config.db

var pool = mysql.createPool(dbConfig)

//使用连接池
let query = (sql) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      connection.query(sql, function (err, result) {
        return err ? reject(err) : resolve(result)
      })
      connection.release()
    })
  })
}

let insert = (table, data) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      connection.query(
        'INSERT INTO {table} SET ?',
        data,
        function (err, result) {
          return err ? reject(err) : resolve(result.insertId)
        }
      )
      connection.release()
    })
  })
}

//普通连接
let queryTest = (sql) => {
  var connection = mysql.createConnection(dbConfig)
  return new Promise((resolve, reject) => {
    connection.connect()
    connection.query(sql, (err, rows, fields) => {
      return err ? reject(err) : resolve(rows)
    })
    connection.end()
  })
}

module.exports = {
  query: query,
  queryTest: queryTest,
}
```

数据库连接测试代码 (使用了上面定义的run方法)

````js
router.get('/', function (req, res, next) {
  // 数据库操作测试
  F.run(function* () {
    var result = yield Db.query('SELECT * FROM fruitscities limit 5')
    var result = yield Db.query('SELECT * FROM fruitscities limit 5')
    req.session.admin = '111111111'
    console.log(req.session.admin)
    res.render('index', { title: 'Express```' })
  }, next)
})

router.get('/test', function (req, res, next) {
  console.log(req.baseUrl)
  console.log(req.route)
  console.log(req.path)
  // 数据库操作测试
  F.run(function* () {
    var result = yield Db.query('SELECT * FROM fruitscities limit 5')
    var result = yield Db.query('SELECT * FROM fruitscities limit 5')
    console.log(req.session.admin)
  }, next)
})
````

#### 使用nunjucks模板引擎

```js
//模板引擎
var nunjucks = require('nunjucks')
// 模板引擎设置
var env = new nunjucks.configure(path.join(__dirname, 'views'), {
  // 设置模板文件的目录，为views
  autoescape: true,
  watch: true,
  express: app,
})
app.set('view engine', 'html')
```

#### 使用nunjucks模板标签（用于cms，文章，新闻展示等）

```js
//标签测试
var tags = require(path.resolve(Root, './common/tags'))

//绑定标签
env.addExtension('tagtest', new tags.tagtest())
common / tags.js中的代码

var tags
var nunjucks = require('nunjucks')
tags = {
  tagtest: function () {
    //tag标签测试
    this.tags = ['tagtest']
    this.parse = function (parser, nodes, lexer) {
      let tok = parser.nextToken()
      var args = parser.parseSignature(null, true)
      parser.advanceAfterBlockEnd(tok.value)
      let body = parser.parseUntilBlocks('endtagtest') // 结束标签
      parser.advanceAfterBlockEnd()
      //return new nodes.CallExtension(this, 'run', args);
      return new nodes.CallExtensionAsync(this, 'run', args, [body]) //异步调用
    }
    this.run = function (context, args, body, callback) {
      console.log(JSON.stringify(args)) //前台返回参数
      var data = [
        {
          id: 1,
          city: '北京',
          parent: 0,
          spelling: 'BeiJing',
          abbr: 'BJ',
          short: 'B',
        },
        {
          id: 2,
          city: '上海',
          parent: 0,
          spelling: 'ShangHai',
          abbr: 'SH',
          short: 'S',
        },
        {
          id: 3,
          city: '天津',
          parent: 0,
          spelling: 'TianJin',
          abbr: 'TJ',
          short: 'T',
        },
        {
          id: 4,
          city: '重庆',
          parent: 0,
          spelling: 'ZhongQing',
          abbr: 'ZQ',
          short: 'Z',
        },
        {
          id: 5,
          city: '黑龙江',
          parent: 0,
          spelling: 'HeiLongJiang',
          abbr: 'HLJ',
          short: 'H',
        },
      ]
      context.ctx['list'] = data //返回参数
      let result = new nunjucks.runtime.SafeString(body())
      return callback(null, result)
    }
  },
}

module.exports = tags
```

#### 页面中使用

```js
{% tagtest list="key1=1,key2=2,key3=3,key4=4" %}

  {% for val in list %}


    {{ val.id }}:{{ val.city}}


  {% endfor %}

{% endtagtest %}


{% tagtest key1=1,key2=2,key3=3,key4=4 %}

  {% for val in list %}


    {{ val.id }}:{{ val.city}}


  {% endfor %}

{% endtagtest %}
```

#### 使用log4js进行日志记录

记录access日志

```js
app.use(log4js.connectLogger(log4js.getLogger('log_access'), { level: 'INFO' }))
```

配置文件 (配置可以根据需求修改)

```js
module.exports = {
  db: {
    host: '',
    user: '',
    password: '',
    database: '',
  },
  cookieSession: {
    name: 'session_uuice',
    keys: ['key1', 'key2'],
    secret: 'ksjf493248kjkj',
  },
  log4js: {
    appenders: [
      {
        type: 'console',
        category: 'console',
      },
      {
        category: 'log_file',
        type: 'file',
        filename: './logs/log_file/file.log',
        maxLogSize: 104800,
        backups: 100,
      },
      {
        category: 'log_date',
        type: 'dateFile',
        filename: './logs/log_date/date',
        alwaysIncludePattern: true,
        pattern: '-yyyy-MM-dd-hh.log',
      },
      {
        category: 'log_access',
        type: 'dateFile',
        filename: './logs/log_access/date',
        alwaysIncludePattern: true,
        pattern: '-yyyy-MM-dd-hh.log',
      },
    ],
    replaceConsole: true,
    levels: {
      log_file: 'ALL',
      console: 'ALL',
      log_date: 'ALL',
    },
  },
}
```

其他记录日志代码

```js
console.log('log_start start!')

var LogFile = log4js.getLogger('log_file')

LogFile.trace('This is a Log4js-Test')
LogFile.debug('We Write Logs with log4js')
LogFile.info('You can find logs-files in the log-dir')
LogFile.warn('log-dir is a configuration-item in the log4js.json')
LogFile.error("In This Test log-dir is : './logs/log_test/'")

console.log('log_start end!')

var log_date = log4js.getLogger('log_date')

log_date.trace('This is a Log4js-Test')
log_date.debug('We Write Logs with log4js')
log_date.info('You can find logs-files in the log-dir')
log_date.warn('log-dir is a configuration-item in the log4js.json')
log_date.error("In This Test log-dir is : './logs/log_test/'")

console.log('log_date end!')
```

#### socket通讯

使用socket.io
在项目bin/www中添加

```js
//添加socket.io支持
var io = require('socket.io')(server)
io.on('connection', function (socket) {
  Socket(socket, io) //这里的Socket，就是app.js定义的全局变量
})
```

在app.js中添加事件逻辑

```js
//socket事件方法
global.Socket = require(path.resolve(Root, './socket/socket'))
```

错误处理
Promise中的报错

```js
let run = (fn, next) => {
  co(fn).catch((err) => {
    next(err)
  })
}
```

其他报错

```js
// 将404交给错误处理中间件
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// 错误处理

//开发环境报错，显示错误堆栈
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    if (req.xhr) {
      res.json({
        status: err.status,
        message: err.message,
        error: err.stack,
      })
    } else {
      res.render('error', {
        status: err.status,
        message: err.message,
        error: err,
      })
    }
  })
}

//生产环境报错，不展示错误堆栈
app.use(function (err, req, res, next) {
  res.status(err.status || 500)
  if (req.xhr) {
    res.json({
      status: err.status,
      message: err.message,
      error: {},
    })
  } else {
    res.render('error', {
      status: err.status,
      message: err.message,
      error: {},
    })
  }
})
```

#### 其他

待补充
