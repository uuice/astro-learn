---
id: 1ef3b5e4-51b0-6ce0-b727-e8921436fadf
title: 短 URL 系统设计
alias:
cover:
created_time: 2017-04-29 20:52:14
updated_time: 2017-04-29 20:52:14
categories:
  - notes
tags:
excerpt: 原理通过发号策略，给每一个过来的长地址，发一个号即可，小型系统直接用mysql的自增索引就搞定了。如果是大型应用，可以考虑各种分布式key-value系统做发号器。不停的自增就行了。实现方式将长连接保存到数据库，获得自增ID，将自增ID转化为62进制，拼接到链接后面通过访问短连接获取到62进制字符串
published: true
---

### 原理

通过发号策略，给每一个过来的长地址，发一个号即可，小型系统直接用mysql的自增索引就搞定了。如果是大型应用，可以考虑各种分布式key-value系统做发号器。不停的自增就行了。

<!-- more -->

### 实现方式

- 将长连接保存到数据库，获得自增ID，将自增ID转化为62进制，拼接到链接后面
- 通过访问短连接获取到62进制字符串，转化为10进制，通过查询获得长链接进行跳转

### 这里有几个问题

- 1、62进制如何用数据库或者KV存储来做

这个问题就不展开了，自行解决

- 2、如何保证同一个长地址，每次转出来都是一样的短地址

上面的发号原理中，是不判断长地址是否已经转过的。同一个长地址，产生多条短地址记录，这明显是浪费空间的。
目前没有好的解决方法

### 3、跳转用301还是302

301是永久重定向，302是临时重定向。短地址一经生成就不会变化，所以用301是符合http语义的。同时对服务器压力也会有一定减少。

但是如果使用了301，我们就无法统计到短地址被点击的次数了。而这个点击次数是一个非常有意思的大数据分析数据源。能够分析出的东西非常非常多。

对于搜索引擎SEO优化来说301跳转更合适

10进制62进制互转 （php实现）

这里用了php手册中的一个方法，支持任意进制的转换
点击跳转到php手册

```php
<?php
function convBase($numberInput, $fromBaseInput, $toBaseInput)
{
    if ($fromBaseInput==$toBaseInput) return $numberInput;
    $fromBase = str_split($fromBaseInput,1);
    $toBase = str_split($toBaseInput,1);
    $number = str_split($numberInput,1);
    $fromLen=strlen($fromBaseInput);
    $toLen=strlen($toBaseInput);
    $numberLen=strlen($numberInput);
    $retval='';
    if ($toBaseInput == '0123456789')
    {
        $retval=0;
        for ($i = 1;$i <= $numberLen; $i++)
            $retval = bcadd($retval, bcmul(array_search($number[$i-1], $fromBase),bcpow($fromLen,$numberLen-$i)));
        return $retval;
    }
    if ($fromBaseInput != '0123456789')
        $base10=convBase($numberInput, $fromBaseInput, '0123456789');
    else
        $base10 = $numberInput;
    if ($base10<strlen($toBaseInput))
        return $toBase[$base10];
    while($base10 != '0')
    {
        $retval = $toBase[bcmod($base10,$toLen)].$retval;
        $base10 = bcdiv($base10,$toLen,0);
    }
    return $retval;
}
?>
```

### 用法：

- 1、十进制转62进制

```php
<?php
echo convBase('1234567890987654321','0123456789','0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
?>
```

- 2、62进制转十进制

```php
<?php
echo convBase('1tckI2JJZDz','0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ','0123456789');
?>
```

这只是一个基本的思路，对于一般的使用也够了

<!-- 测试缓存失效机制 -->
