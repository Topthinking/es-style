# es-style &middot; [![NPM version](https://img.shields.io/npm/v/es-style.svg)](https://www.npmjs.com/package/es-style)

## 说明

`es-style`服务于`react`项目，它是针对服务端渲染时的静态资源处理方案,同时也适用于单页面应用

`es-style`serve`react`project, it is on the server when rendering the static resource processing scheme, 

at the same time can also be applied to single page application

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
## webpack - 开发

babel 配置
```json
{
  "plugins": [
    "es-style/babel",{
      "imageOptions": {
        "dir":"images/",
        "limit": 5000
      }
    }
  ]
}
```

开发环境需配合express来搭建服务，具体配置参考`test/spa/server/index.js`

如果不配置的话，会导致图片资源访问不了
```js
const webpack = require('webpack')
const webpackConfig = require('./webpack.dev.config')
const app = express()
const compiler = watch(webpack(webpackConfig), app)
```

## webpack - 发布

babel 配置
```json
{
  "plugins": [
    "es-style/babel",{
      "imageOptions": {
        "path": "./dist",        
        "publicPath":"/",
        "dir":"images/",
        "limit": 5000
      }
    }
  ]
}
```
⚠️ 发布的时候，`path`和`publicPath`的配置和`webpack`的`output`里面的配置项一致


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
