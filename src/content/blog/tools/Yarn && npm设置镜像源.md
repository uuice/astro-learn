---
id: 1ef3b5dd-e4d9-6b40-b309-a07bac6c751a
title: Yarn &amp;&amp; npm设置镜像源
alias:
cover:
created_time: 2020-04-17 22:35:21
updated_time: 2020-04-17 22:35:21
categories:
  - nodejs
tags:
excerpt: 安装yarnnpm i -g yarnyarnyarn config set registry https://registry.npm.taobao.org --global  &amp;&amp; \yarn config set disturl https://npm.taobao.org/d
published: true
---

### 安装yarn

    npm i -g yarn

### yarn

    yarn config set registry https://registry.npm.taobao.org --global  && \
    yarn config set disturl https://npm.taobao.org/dist --global && \
    yarn config set sass_binary_site https://npm.taobao.org/mirrors/node-sass --global  && \
    yarn config set electron_mirror https://npm.taobao.org/mirrors/electron/ --global  && \
    yarn config set puppeteer_download_host https://npm.taobao.org/mirrors --global  && \
    yarn config set chromedriver_cdnurl https://npm.taobao.org/mirrors/chromedriver --global  && \
    yarn config set operadriver_cdnurl https://npm.taobao.org/mirrors/operadriver --global  && \
    yarn config set phantomjs_cdnurl https://npm.taobao.org/mirrors/phantomjs --global  && \
    yarn config set selenium_cdnurl https://npm.taobao.org/mirrors/selenium --global  && \
    yarn config set node_inspector_cdnurl https://npm.taobao.org/mirrors/node-inspector --global

### npm

    npm set registry https://registry.npm.taobao.org && \
    npm set disturl https://npm.taobao.org/dist && \
    npm set sass_binary_site https://npm.taobao.org/mirrors/node-sass && \
    npm set electron_mirror https://npm.taobao.org/mirrors/electron && \
    npm set puppeteer_download_host https://npm.taobao.org/mirrors && \
    npm set chromedriver_cdnurl https://npm.taobao.org/mirrors/chromedriver && \
    npm set operadriver_cdnurl https://npm.taobao.org/mirrors/operadriver && \
    npm set phantomjs_cdnurl https://npm.taobao.org/mirrors/phantomjs && \
    npm set selenium_cdnurl https://npm.taobao.org/mirrors/selenium && \
    npm set node_inspector_cdnurl https://npm.taobao.org/mirrors/node-inspector && \
    npm cache clean --force
