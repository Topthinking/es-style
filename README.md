# es-style &middot; [![NPM version](https://img.shields.io/npm/v/es-style.svg)](https://www.npmjs.com/package/es-style)

## 说明

在项目的组件中直接引用`scss`文件，之后插件会自动做样式的处理

包裹`postcss`的一个样式处理平台，所以插件完全适配`postcss`的所有插件

## 体验

在`test`目录下有两个项目，都可以进行测试体验，

  `ssr`项目可以直接使用,该项目是网站静态资源输出

  `spa`项目是用来开发`es-style`时使用的demo演示


## babel 配置
```json
{
  "plugins": [
    "es-style/babel",
    {
     "extensions": [
       ".scss"
     ],
     "sassOptions": {
        "includePaths": [
         "styles/"
        ],
        "precision": 2
      },
      "plugins": [
        [
         "postcss-cssnext",
          {
           "warnForDuplicates": false
          }
        ],
        [
          "postcss-modules",
          {
            "awardCssModules": true,
            "scopeBehaviour": "local",
            "generateScopedName": "[name]_[local]_[hash:base64:5]]"
          }
        ],
        "autoprefixer",
        "cssnano"
      ]
    }
  ]
}
```

## 感谢

`babel-plugin-inline-import` 实现加载方式

`styled-jsx` 👍 `es-style/server` === `styled-jsx/server`  🌍 [文档地址](https://github.com/zeit/styled-jsx)

`styled-jsx-postcss`  es-style的插件 === postcss的插件
