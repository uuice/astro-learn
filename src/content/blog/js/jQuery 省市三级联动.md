---
id: 1ef3b5d9-1b23-6f70-9c72-cad688b0117d
title: jQuery 省市三级联动
alias:
cover:
created_time: 2017-04-29 20:58:13
updated_time: 2017-04-29 20:58:13
categories:
  - javascript
tags:
excerpt:
published: true
---

页面打开默认获取省信息,选择省以后，再获取市信息，点击市以后，再获取地区信息

<!-- more -->

```js
var regions = {
  state: $('#state'),
  city: $('#city'),
  district: $('#district'),
  init: function () {
    var _this = this
    _this.getState(_this.state, 1)
    _this.state.change(function () {
      var id = $(this).val()
      _this.city.find('option:gt(0)').remove()
      _this.district.find('option:gt(0)').remove()
      _this.getCity(_this.city, id)
    })

    _this.city.change(function () {
      var id = $(this).val()
      _this.district.find('option:gt(0)').remove()
      _this.getDistrict(_this.district, id)
    })
  },
  getState: function (elem, id, callback) {
    this.getJson(elem, id, callback)
  },
  getCity: function (elem, id, callback) {
    this.getJson(elem, id, callback)
  },
  getDistrict: function (elem, id, callback) {
    this.getJson(elem, id, callback)
  },
  render: function (elem, data, callback) {
    if (data.regions && !$.isEmptyObject(data.regions)) {
      elem.find('option:gt(0)').remove()
      $.each(data.regions, function (name, value) {
        elem.append(
          '<option value ="' + value.id + '">' + value.name + '</option>'
        )
      })
      if (callback && typeof callback == 'function') {
        callback()
      }
    }
  },
  getJson: function (elem, id, callback) {
    var _this = this
    $.ajax({
      type: 'post',
      url: system.url('address/get-regions'),
      data: {
        parent_id: id,
      },
      dataType: 'json',
      cache: false,
      success: function (resp) {
        if (resp.status) {
          _this.render(elem, resp.data, callback)
        }
      },
      error: function () {},
    })
  },
}
```

#### callback的作用

当获取信息时，需要渲染对应的省市信息
通过添加回调，可以依次获取省、市、地区信息

```js
regions.getState(regions.state, 1, function () {
  $('#state').val(_this.attr('data-state'))
  regions.getCity(regions.city, _this.attr('data-state'), function () {
    $('#city').val(_this.attr('data-city'))
    regions.getDistrict(regions.district, _this.attr('data-city'), function () {
      $('#district').val(_this.attr('data-district'))
    })
  })
})
```
