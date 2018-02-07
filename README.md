# es-style &middot; [![NPM version](https://img.shields.io/npm/v/es-style.svg)](https://www.npmjs.com/package/es-style)

## 说明

版本`0.0.12`为当前稳定版本

`es-style`是针对服务端渲染时的静态资源处理方案

`es-style` is on the server when rendering the static resource processing scheme

## 体验

```shell
npm run ssr
```

or
```shell
npm run spa
```

## 安装

```shell
npm install es-style --save
```

or

```shell
yarn add es-style
```

## babel 配置
```json
{
  "plugins": [
    "es-style/babel",{
      "imageOptions": {
        "publicPath": "/",
        "dir":"images/",
        "limit": 5000
      }
    }
  ]
}
```

## 配置参数

图片资源默认是放在根目录下的`static`文件夹

`imageOptions` 图片解析参数

`publicPath`图片地址前缀

`dir`存放路径

`limit`小于这个值(字节byte)将存储为base64


## webpack配置
```js
import watch from 'es-style/watch'
complier.plugin('done', () => {  
  watch()
})
```

## 项目引用
```js

//组件内生效 改变即触发热更新
import './style/es-style.scss'

//全局生效(!) 改变需刷新浏览器才能看到变化
import './style/common.scss!'
```

## 注意

1. 引用`scss`需保证当前引用的js文件内存在`JSXElement`，否则会解析不到

2. 目前对于全局的`scss`暂时还没有去重处理，所以尽量只引用一份全局的样式文件
