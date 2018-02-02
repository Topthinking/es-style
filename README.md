# es-style &middot; [![NPM version](https://img.shields.io/npm/v/es-style.svg)](https://www.npmjs.com/package/es-style)

在项目的组件中直接引用`scss`文件，之后插件会自动做样式的处理

包裹`postcss`的一个样式处理平台，所以插件完全适配`postcss`的所有插件

## 快速体验

```shell
npm install
npm run dev
npm run test_project
```

babel 配置
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

借鉴库

`babel-plugin-inline-import`

`styled-jsx`

`styled-jsx-postcss`
