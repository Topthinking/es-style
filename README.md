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
      "type": "attribute", //默认是 `class`， 当前配置样式选择器是元素属性
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
const watch = require('es-style/watch')
const webpack = require('webpack')
const webpackConfig = require('./webpack.dev.config')
const app = express()
const compiler = watch(webpack(webpackConfig), app)
```

## webpack - 发布

#### babel 配置
```json
{
  "plugins": [
    "es-style/babel",{
      "type": "attribute", //默认是 `class`， 当前配置样式选择器是元素属性
      "position":"external", //样式存放位置，inline内联（head头中），external外联（文件中），默认内联
      "write":true, //当前编译过程是否写文件(图片资源和css资源），原因是编译node端代码不需要写静态资源文件，加快编译过程,默认是true可写
      "imageOptions": {
        "fileSystem": "file", //图片资源存放文件类型，默认存放在内存中（memory），如果指定file，那么就存放到指定目录的硬盘上
        "path": "./dist",        
        "publicPath":"/",
        "dir":"images/",
        "limit": 5000
      }
    }
  ]
}
```
#### ☝️  建议
    
    发布的时候[position]使用外联(external)，开发的时候使用内联(inline)

    发布的时候[fileSystem]使用文本文件(file)，开发的时候使用内存文件(memory)

#### ⚠️ ️ 注意

    发布的时候，path和publicPath的配置和webpack的output里面的配置项一致

    css导出到文件中的目录是根据path来的，在path根目录下，文件名称是main.css


#### 🍡  雪碧图
  
    版本0.1.8后支持，如果需要雪碧图，那么在当前css文件的头部添加如下注释
    
    那么该css文件中的所有图片将集成到一张大图上，同时打包的图片会存放在目录为.es-style的文件中

    所有git要忽略.es-style目录

```css
/*sprite*/
```

## 项目引用
```jsx

//组件内生效 改变即触发热更新
import './style/es-style.scss'

//全局生效(!) 改变需刷新浏览器才能看到变化
import './style/common.scss!'

//可以使用<es-style/>来定位css的存放位置
export default () => (
  <div>
    <es-style/>
  </div>
)
//如果没有es-style标签，那么会从上往下按就近原则存放css的资源组件
```

## 注意

1. 引用`scss`需保证当前引用的js文件内存在`JSXElement`，否则会解析不到

2. 目前对于全局的`scss`暂时还没有去重处理，所以尽量只引用一份全局的样式文件

3. `es-style`不支持`happypack`,使用会导致图片资源丢失

4. `.gitignore`添加`.es-style`，忽略雪碧图生成的图片
