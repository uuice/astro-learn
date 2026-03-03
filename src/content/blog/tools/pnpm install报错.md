---
id: 1ef3b596-893a-6790-a593-1d07427d06eb
title: pnpm install报错
alias:
cover:
created_time: 2022-08-26 10:30:22
updated_time: 2022-08-26 10:30:22
categories:
  - nodejs
tags:
  - pnpm
excerpt: 在使用pnpm 安装依赖的时候有时候会出现lock文件损坏等情况解决方法安装重试失败， 可以先删除 pnpm本地store- 执行-  执行 rm -rf $(pnpm store path)-  重新安装目前个人碰到的几种失败情况， 都能解决， 以后碰到更多的情况再补充
published: true
---

在使用pnpm 安装依赖的时候有时候会出现lock文件损坏等情况

解决方法

pnpm install失败多次后， 可以删除 项目中的 `node_modules` 以及 `pnpm` 的本地store

- 执行 `rm -rf node_modules`
- 执行 `rm -rf $(pnpm store path)`
- 重试 `pnpm install`

目前个人碰到的几种失败情况， 都能解决， 以后碰到更多的情况再补充

<!-- more -->
