---
id: 1ef3b5ae-4c0c-69f0-aa92-08c2005ee788
title: Linux npm -g 全局安装的命令找不到
alias:
cover:
created_time: 2022-08-26 10:19:04
updated_time: 2022-08-26 10:19:04
categories:
  - linux
  - nodejs
tags:
excerpt: 在Linux 上通过npm -g全局安装 pm2、yarn、pnpm 等命令找不到的解决方法修改 ~/.bash_profile vim ~/.bash_profile新增环境变量export PATH=$(npm prefix -g)/bin:$PATH在宝塔面板中export PATH=$PAT
published: true
---

在Linux 上通过`npm -g`全局安装 pm2、yarn、pnpm 等命令找不到的解决方法

<!-- more -->

## 修改 ~/.bash_profile

```
 vim ~/.bash_profile
```

## 新增环境变量

```
export PATH=$(npm prefix -g)/bin:$PATH
```

### 使用宝塔面板的服务器

```
export PATH=$PATH://usr/lib/node_modules/corepack/shims:$PATH
export PATH=$(npm prefix -g)/bin:$PATH
```

## 生效

```
source ~/.bash_profile
```
