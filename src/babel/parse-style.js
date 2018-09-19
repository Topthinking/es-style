import postcss from 'postcss';
import sass from 'node-sass';
import CleanCSS from 'clean-css';
import { hashString } from '../utils';

import postcssSelector from '../plugins/postcss-selector';
import postcssImages from '../plugins/postcss-images';
import postcssFont from '../plugins/postcss-font';

//通过node-sass解析并获取style字符串
export const content = (givenPath) =>
  sass.renderSync({ file: givenPath }).css.toString();

//postcss批量处理
const handlePostcss = (styles, plugins) => {
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
            return output.styles;
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

      let globalStyle = await handlePostcss(state.styles.global, plugins);
      let jsxStyle = await handlePostcss(state.styles.jsx, plugins);

      let styleId =
        jsxStyle === ''
          ? 0
          : hashString(jsxStyle + reference, global['es-style-class']);

      if (styleId !== 0) {
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
