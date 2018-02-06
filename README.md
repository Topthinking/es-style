# es-style &middot; [![NPM version](https://img.shields.io/npm/v/es-style.svg)](https://www.npmjs.com/package/es-style)

## 说明

针对服务端渲染项目静态资源引用的处理，使用`es-style`便可以像单页面应用直接引用图片，样式等资源

Static resource reference for rendering of a service project, using `es-style` can like 

single-page applications direct reference pictures, style and other resources

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
      "sassOptions": {
          "includePaths": ["styles/"],
          "precision": 2
        },
        "imageOptions": {
          "publicPath": "/",
          "dir":"images/",
          "limit": 5000
        }
    }
  ]
}
```

## webpack配置
```js
import watch from 'es-style/watch'
complier.plugin('done', () => {  
  watch()
})
```
