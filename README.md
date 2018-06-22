# es-style &middot; [![NPM version](https://img.shields.io/npm/v/es-style.svg)](https://www.npmjs.com/package/es-style)

## 说明

`es-style`是基于`postcss`的转译功能，同时服务于`react`项目，它是针对服务端渲染时的静态资源处理方案，同时也适用于单页面应用

## 体验

```shell
npm install
```

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
    "es-style/babel",
    {
      "type": "attribute", //默认是 `class`， 当前配置样式选择器是元素属性
      "imageOptions": {
        "path": "images/", //图片资源存放的目录
        "limit": 5000
      }
    }
  ]
}
```

开发环境需配合 express 来搭建服务，具体配置参考`examples/spa/server/index.js`

如果不配置的话，会导致图片资源访问不了

```js
const { ExpressWatch } = require('es-style/watch');
const webpack = require('webpack');
const webpackConfig = require('./webpack.dev.config');
const app = express();
const compiler = ExpressWatch(webpack(webpackConfig), app, () => {
  //compiler.plugin('done',callback)
  //这里主要编写上面钩子方法的回调实现，因为watch方法中集成了done的使用，防止出现冲突
});
```

## webpack - 发布

#### babel 配置

```json
{
  "plugins": [
    "es-style/babel",
    {
      "type": "attribute", //默认是 `class`， 当前配置样式选择器是元素属性
      "position": "external", //样式存放位置，inline内联（head头中），external外联（文件中），默认内联
      "write": true, //当前编译过程是否写文件(图片资源和css资源），原因是编译node端代码不需要写静态资源文件，加快编译过程,默认是true可写
      "publicPath": "/", //公共资源前缀，一般用来设置cdn地址
      "fileSystem": "file", //资源存放文件类型，默认存放在内存中（memory），如果指定file，那么就存放到指定目录的硬盘上
      "path": "./dist", //资源存放的路径目录
      "imageOptions": {
        "path": "images/", //图片资源存放的目录
        "limit": 5000
      },
      "fontOptions": {
        "path": "fonts/" //字体资源存放的目录
      }
    }
  ]
}
```

#### ☝️ 建议

    发布的时候[position]使用外联(external)，开发的时候使用内联(inline)

    发布的时候[fileSystem]使用文本文件(file)，开发的时候使用内存文件(memory)

#### ⚠️ ️ 注意

    发布的时候，path和publicPath的配置和webpack的output里面的配置项一致

    css导出到文件中的目录是根据path来的，在path根目录下，文件名称是main.css

#### 🍡 雪碧图

    如果需要雪碧图，那么在当前css文件的头部添加如下注释，则该css文件中的所有图片将集成到一张大图上  

    不支持svg合并，由于svg-sprite使用到PhantomJS，文件较大，去掉了

    如果需要，可以在项目中自行开发 🙂

```css
/*sprite*/
```

#### 💀 报错处理

    如果是在启动服务时报错，这个时候修改好错误是没有办法继续运行服务，需要同时保存下引用该样式的js文件，这很重要，否则需要重启服务，浪费时间

    如果服务以及运行，这个时候报错，只需修改错误，服务即可自动实现热更新

## 项目引用

```jsx
//组件内生效 改变即触发热更新
import './style/es-style.scss';

//全局生效(!) 改变需刷新浏览器才能看到变化
import './style/common.scss!';

//可以使用<es-style/>来定位css的存放位置
export default () => (
  <div>
    <es-style />
  </div>
);
//如果没有es-style标签，那么会按JSXElement从上往下按就近原则存放css的资源组件
//指定es-style标签，就是指定当前js引用的样式资源存放的位置，这里的存放不是<style>这种形式，而是将解析后的样式已props形式进行存放
```

## 配置文件 .es-style

在项目根目录创建`.es-style`文件，配置内容如下

`plugins` 表示`postcss`插件，⚠️ 下面两个插件暂时不要使用 `cssnano` 和 `postcss-modules`

因为 es-style 已经实现这样的功能，还有雪碧图已经内置了`postcss-sprites`和`autoprefixer`插件，可用对其进行参数配置

如果有报错，请 ISSUE

```json
{
  "plugins": [
    [
      "postcss-sprites",
      {
        "spritePath": ".es-sprites"
      }
    ],
    [
      "autoprefixer",
      {
        "browsers": "last 4 version"
      }
    ],
    ["postcss-plugin-px2rem", {}]
  ],
  "limit": 50 //允许 <=50 字节的图片文件转换成base64
}
```

## 注意

1.  引用`scss`需保证当前引用的 js 文件内存在`JSXElement`，否则会解析不到

2.  目前对于全局的`scss`无法做到去重，因为 babel 解析是根据一个个文件做的，所以尽量只引用一份全局的样式文件

3.  开发环境不推荐使用`happypack`插件来编译,会导致图片资源丢失,由于使用的是内存文件系统，使用它会导致在每个打开的线程中创建文件，产生不可控的影响

4.  `.gitignore`添加上面配置文件的`.es-sprites`，忽略雪碧图生成的图片，默认是`.es-sprites`

5.  配置文件`.es-style`中的 plugin，执行顺序从上往下，重复的 plugin 会被`忽略`，一直执行到最后

### License

MIT
