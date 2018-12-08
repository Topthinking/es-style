import postcss from 'postcss';
import sass from 'node-sass';
import path from 'path';
import CleanCSS from 'clean-css';
import fs from 'fs-extra';
import DefaultHashString from 'string-hash';

import { hashString } from '../utils';
import postcssSelector from '../plugins/postcss-selector';
import postcssImages from '../plugins/postcss-images';
import postcssFont from '../plugins/postcss-font';
import { dev } from '../utils';

//存储全局的样式的hashString，保证唯一性
let StoreGlobalStyle = [];

//通过node-sass解析并获取style字符串
export const content = (givenPath) =>
  sass.renderSync({ file: givenPath }).css.toString();

//postcss批量处理
const handlePostcss = (styles, plugins, isGlobal) => {
  return new Promise(async (resolve, reject) => {
    if (styles.length) {
      try {
        const style = await Promise.all(
          styles.map(async (item, index) => {
            //解析css样式
            const { css } = await postcss(plugins).process(item.css, {
              from: item.from,
            });
            //压缩css文件
            const output = new CleanCSS({}).minify(css);
            if (isGlobal && !dev()) {
              const globalId = DefaultHashString(output.styles);
              // 筛选出重复的全局样式引用
              if (StoreGlobalStyle.indexOf(globalId) === -1) {
                StoreGlobalStyle.push(globalId);
                return output.styles;
              } else {
                return '';
              }
            } else {
              return output.styles;
            }
          }),
        );
        resolve(style.join(''));
      } catch (error) {
        reject(error);
      }
    } else {
      resolve('');
    }
  });
};

//将css字符串经过postcss插件进行二次操作
export const ParseStyle = (plugins, state, config) => {
  let reference = state && state.file && state.file.opts.filename;
  let imageOptions = state && state.opts && state.opts.imageOptions;
  let fontOptions = state && state.opts && state.opts.fontOptions;
  let publicPath = (state && state.opts && state.opts.publicPath) || '/';
  let publicEntry = (state && state.opts && state.opts.publicEntry) || './dist';
  const write = (state && state.opts && state.opts.write) || false;

  if (!write) {
    // 不可写，即编译服务端代码，记录sock
  }

  if (typeof imageOptions === 'undefined') {
    imageOptions = {};
  }

  if (typeof fontOptions === 'undefined') {
    fontOptions = {};
  }

  if (config.limit) {
    imageOptions.limit = config.limit;
  }

  plugins = [
    ...plugins,
    postcssImages({
      write,
      imageOptions,
      publicEntry,
      publicPath,
    }),
    postcssFont({
      reference,
      write,
      fontOptions,
      publicEntry,
      publicPath,
    }),
  ];

  return new Promise(async (resolve, reject) => {
    try {
      //存储class选择器
      global['es-style-class'] = [];

      let _jsxStyle = '';
      state.styles.jsx.map((item) => {
        _jsxStyle += item.css;
      });

      let globalStyle = await handlePostcss(state.styles.global, plugins, true);
      let jsxStyle = await handlePostcss(state.styles.jsx, plugins, false);
      let styleId = 0;

      if (jsxStyle) {
        const HashJsx = DefaultHashString(_jsxStyle);
        styleId = hashString(HashJsx, global['es-style-class']);
      }

      if (styleId) {
        //拼接css-modules
        const { css } = await postcss([
          postcssSelector({ styleId, styleType: state.styleType }),
        ]).process(jsxStyle, { from: undefined });
        jsxStyle = css;
      }

      resolve({
        global: globalStyle,
        jsx: jsxStyle,
        styleId,
      });
    } catch (err) {
      reject(err);
    }
  });
};
