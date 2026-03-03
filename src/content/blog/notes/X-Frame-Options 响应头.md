---
id: 1ef3b5be-561c-6f70-a98e-1d4fbfc5d1c2
title: X-Frame-Options 响应头
alias:
cover:
created_time: 2017-06-06 16:00:14
updated_time: 2017-06-06 16:00:14
categories:
  - notes
  - http
tags:
excerpt: 做了一个页面，需要加载一个带分页列表，原本代码中没有ajax分页组件，所以就直接用iframe加载了一个页面进来，结果发现页面无法加载。控制台提示：Refused to display ‘XXXX’ in a frame because it set ‘X-Frame-Options’ to ‘de
published: true
---

做了一个页面，需要加载一个带分页列表，原本代码中没有ajax分页组件，所以就直接用iframe加载了一个页面进来，结果发现页面无法加载。控制台提示：Refused to display 'XXXX' in a frame because it set 'X-Frame-Options' to 'deny'. 查询了MDN，具体原因如下(MDN上摘录)

<!-- more -->

### X-Frame-Options是什么？

X-Frame-Options HTTP 响应头是用来给浏览器指示允许一个页面可否在 `<frame>`, `<iframe>` 或者 `<object>` 中展现的标记。网站可以使用此功能，来确保自己网站的内容没有被嵌到别人的网站中去，也从而避免了点击劫持 (clickjacking) 的攻击。

### 使用X-Frame-Options

X-Frame-Options 有三个值:

- DENY
  表示该页面不允许在 frame 中展示，即便是在相同域名的页面中嵌套也不允许。
- SAMEORIGIN
  表示该页面可以在相同域名页面的 frame 中展示。
- ALLOW-FROM uri
  表示该页面可以在指定来源的 frame 中展示。
  换一句话说，如果设置为 DENY，不光在别人的网站 frame 嵌入时会无法加载，在同域名页面中同样会无法加载。另一方面，如果设置为 SAMEORIGIN，那么页面就可以在同域名页面的 frame 中嵌套。

### 服务器配置

- 配置 Apache
  配置 Apache 在所有页面上发送 X-Frame-Options 响应头，需要把下面这行添加到 'site' 的配置中:

```
Header always append X-Frame-Options SAMEORIGIN
```

### 配置 nginx

- 配置 nginx
  发送 X-Frame-Options 响应头，把下面这行添加到 'http', 'server' 或者 'location' 的配置中:

```
add_header X-Frame-Options SAMEORIGIN;
```

### 配置 IIS

- 配置 IIS

发送 X-Frame-Options 响应头，添加下面的配置到 Web.config 文件中:

```
<system.webServer>
  ...

  <httpProtocol>
    <customHeaders>
      <add name="X-Frame-Options" value="SAMEORIGIN" />
    </customHeaders>
  </httpProtocol>

  ...
</system.webServer>
```

### 其他

可以直接通过meta标签来设置，不需要放在http头部请求中了。

```
<meta http-equiv="X-Frame-Options" content="deny">
```
