import { loopWhile } from 'deasync';
import * as t from 'babel-types';
import del from 'del';
import { resolve, join } from 'path';
import requireResolve from 'require-resolve';
import hashString from 'string-hash';
import { isObject, shouldBeParseStyle, shouldBeParseImage } from '../utils';
import parseImage from '../utils/parse-image';
import fs from '../watch/fs';
import fsExtra from 'fs-extra';
import { content, ParseStyle } from './parse-style';
import postcssSprites from '../plugins/postcss-sprites';

import Config from '../utils/config';

import {
  STYLE_COMPONENT,
  STYLE_COMPONENT_CSS,
  STYLE_COMPONENT_STYLEID,
} from '../utils/constant';

const concat = (a, b) => t.binaryExpression('+', a, b);

const dev =
  process.env.NODE_ENV === 'development' ||
  typeof process.env.NODE_ENV === 'undefined';

//记录样式是否出现重复的引用，主要用来做css导出使用的
let styleIds = [],
  globalIds = [];

const styleElement = (state, t) => {
  const reference = state && state.file && state.file.opts.filename;
  if (
    (state.styles.global.length || state.styles.jsx.length) &&
    state.css !== ''
  ) {
    const attributes = [
      t.jSXAttribute(
        t.jSXIdentifier('file'),
        t.jSXExpressionContainer(
          t.stringLiteral(String(hashString(reference))),
        ),
      ),
    ];

    if (dev) {
      attributes.push(
        t.jSXAttribute(
          t.jSXIdentifier(STYLE_COMPONENT_CSS),
          t.jSXExpressionContainer(t.stringLiteral(state.css)),
        ),
        t.jSXAttribute(
          t.jSXIdentifier(STYLE_COMPONENT_STYLEID),
          t.jSXExpressionContainer(
            t.stringLiteral(String(state.styleId || state.globalId)),
          ),
        ),
        t.jSXAttribute(
          t.jSXIdentifier('production'),
          t.jSXExpressionContainer(
            t.BooleanLiteral(process.env.NODE_ENV === 'production'),
          ),
        ),
      );
    }

    return t.jSXElement(
      t.jSXOpeningElement(t.jSXIdentifier(STYLE_COMPONENT), attributes, true),
      null,
      [],
    );
  }

  return null;
};

const config = Config({
  refresh: !/production|test/.test(process.env.NODE_ENV),
});

let sprites = config.plugins
  .filter((item) => item[0] === 'postcss-sprites')
  .pop();

if (sprites) {
  const spritesOptions = sprites[1];
  if (spritesOptions.spritePath) {
    //删掉存放雪碧图的目录
    if (spritesOptions.spritePath === '.es-style') {
      throw new Error('spritePath 不能设置为 .es-style');
      process.exit();
    }
    del(join(process.cwd(), spritesOptions.spritePath), { force: true });
  }
}

const config_autoprefixer = config.plugins
  .filter((item) => item[0] === 'autoprefixer')
  .pop();
const config_postcssSprites = config.plugins
  .filter((item) => item[0] === 'postcss-sprites')
  .pop();

let autoprefixerOptions = {};
let postcssSpritesOptions = {};

if (config_autoprefixer) {
  autoprefixerOptions = config_autoprefixer[1];
}

if (config_postcssSprites) {
  postcssSpritesOptions = config_postcssSprites[1];
}

let plugins = [
  postcssSprites({
    spritePath: `.es-sprites`,
    hooks: {
      onSaveSpritesheet: (opts, { extension, image }) => {
        return join(
          opts.spritePath,
          ['sprite_' + hashString(image.toString()), extension].join('.'),
        );
      },
    },
    ...postcssSpritesOptions,
  }),
  require('autoprefixer')({
    browsers: 'last 4 version',
    ...autoprefixerOptions,
  }),
];

//过滤不需要进行处理的插件
const _plugins = config.plugins.filter(
  (item) =>
    ['cssnano', 'postcss-modules', 'postcss-sprites', 'autoprefixer'].indexOf(
      item[0],
    ) === -1,
);

//保存新的plugins,并且防止多次引用,
let _tmpPlugin = [];
_plugins.length &&
  _plugins.map(
    (item) =>
      _tmpPlugin.indexOf(item[0]) === -1 &&
      _tmpPlugin.push(item[0]) &&
      plugins.push(require(item[0])(item[1])),
  );
_tmpPlugin = [];

//第一次执行
let FirstExecuteStyle = true;

//存储样式
if (!global['es-style']) {
  global['es-style'] = {
    es: {}, // 存放css module
    style: '', // 存放公共css资源
    js: [], // 引用css的js资源
  };
}

module.exports = ({ types: t }) => {
  return {
    visitor: {
      //全局import es-style 和处理一些全局的变量
      Program: {
        enter(path, state) {
          const write = (state && state.opts && state.opts.write) || false;
          if (typeof state.styles === 'undefined') {
            state.styles = {
              global: [],
              jsx: [],
            };
            state.styleId = 0;
          }

          //插入import ‘es-style‘
          if (path.scope.hasBinding(STYLE_COMPONENT)) {
            return;
          }

          if (dev) {
            path.node.body.unshift(
              t.importDeclaration(
                [t.importDefaultSpecifier(t.identifier(STYLE_COMPONENT))],
                t.stringLiteral('es-style'),
              ),
            );
          } else if (!dev && !write) {
            // 当发布模式 且 资源不写到file中，那么将引入服务端组件
            path.node.body.unshift(
              t.importDeclaration(
                [t.importDefaultSpecifier(t.identifier(STYLE_COMPONENT))],
                t.stringLiteral('es-style/server'),
              ),
            );
          }

          path.traverse({
            JSXOpeningElement(path) {
              if (
                path.node.name.name === 'es-style' ||
                path.node.name.name === 'es.style'
              ) {
                state.hasEsStyleElement = true;
              }
            },
          });
        },
        exit(path, state) {
          if (
            state.styles.global.length === 0 &&
            state.styles.jsx.length === 0
          ) {
            return;
          }
          if (dev) {
            //写信息到内存文件中
            let map = state.styleSourceMap;

            if (fs.existsSync('/es-style/watch.json')) {
              map = fs.readFileSync('/es-style/watch.json', 'utf-8');
              map = JSON.parse(map);
              map = Object.assign(map, state.styleSourceMap);
            }

            fs.writeFileSync('/es-style/watch.json', JSON.stringify(map));
          }
        },
      },
      //检测import内容,同时通过sass获取style内容
      ImportDeclaration(path, state) {
        let givenPath = path.node.source.value;
        let reference = state && state.file && state.file.opts.filename;
        let imageOptions = state && state.opts && state.opts.imageOptions;
        let publicPath = (state && state.opts && state.opts.publicPath) || '/';
        let publicEntry =
          (state && state.opts && state.opts.publicEntry) || './dist';
        const write = (state && state.opts && state.opts.write) || false;

        if (typeof state.styleSourceMap === 'undefined') {
          state.styleSourceMap = {};
        }

        //全局的引用 './common.scss!'
        let globalStyle = false;
        if (/!$/.test(givenPath)) {
          globalStyle = true;
          givenPath = givenPath.replace(/!$/, '');
        }

        //引用样式
        if (shouldBeParseStyle(givenPath)) {
          path.node.specifiers = [];

          const mod = requireResolve(givenPath, resolve(reference));

          if (!mod || !mod.src) {
            throw new Error(
              `Path '${givenPath}' could not be found for '${reference}'`,
            );
          }

          givenPath = mod.src;

          let parse = true;
          if (typeof state.styleSourceMap[givenPath] === 'undefined') {
            state.styleSourceMap[givenPath] = [reference];
          } else {
            if (state.styleSourceMap[givenPath].indexOf(reference) === -1) {
              state.styleSourceMap[givenPath].push(reference);
            } else {
              parse = false;
              path.remove();
            }
          }

          if (parse) {
            const css = content(givenPath, reference);

            //需要做当前jsx的解析工作
            if (globalStyle) {
              state.styles.global.push({
                from: givenPath,
                css,
              });
            } else {
              state.styles.jsx.push({
                from: givenPath,
                css,
              });
            }
            path.remove();
          }
        }

        //引用图片
        if (shouldBeParseImage(givenPath)) {
          if (
            path.node.specifiers.length === 1 &&
            t.isImportDefaultSpecifier(path.node.specifiers[0])
          ) {
            if (typeof imageOptions === 'undefined') {
              imageOptions = {};
            }

            if (config.limit) {
              imageOptions.limit = config.limit;
            }

            const id = path.node.specifiers[0].local.name;
            try {
              const content = parseImage({
                url: givenPath,
                reference,
                write,
                imageOptions,
                publicEntry,
                publicPath,
              });

              const variable = t.variableDeclarator(
                t.identifier(id),
                t.stringLiteral(content),
              );

              path.replaceWith({
                type: 'VariableDeclaration',
                kind: 'const',
                declarations: [variable],
                leadingComments: [
                  {
                    type: 'CommentBlock',
                    value: `es-style '${givenPath}' `,
                  },
                ],
              });
            } catch (err) {
              throw err;
            }
          }
        }
      },
      //生成jsx的style对象，同时插入转译的样式资源
      JSXElement(path, state) {
        const write = (state && state.opts && state.opts.write) || false;
        if (
          !state.hasParseStyle &&
          (state.styles.global.length || state.styles.jsx.length)
        ) {
          let css = '',
            styleId,
            globalStyle = '',
            JsxStyle = '';
          let wait = true;
          ParseStyle(plugins, state, config)
            .then((result) => {
              globalStyle = result.global;
              JsxStyle = result.jsx;
              styleId = result.styleId;
              wait = false;
            })
            .catch((err) => {
              wait = false;
              css = err;
            });

          loopWhile(() => wait);

          if (css instanceof Error) {
            throw css;
          }

          state.hasParseStyle = true;

          state.styleId = styleId;
          state.globalId = globalStyle === '' ? '0' : hashString(globalStyle);

          const reference = state && state.file && state.file.opts.filename;

          if (styleIds.indexOf(state.styleId) === -1) {
            //没有重复的局部样式
            styleIds.push(state.styleId);
            css = css + JsxStyle;
            global['es-style']['es'][reference] = JsxStyle;
          }

          if (
            state.globalId !== 0 &&
            globalIds.indexOf(state.globalId) === -1
          ) {
            //没有重复的全局样式
            globalIds.push(state.globalId);
            css = css + globalStyle;
            global['es-style']['style'] += globalStyle;
          }

          if (css !== '') {
            global['es-style']['js'].push(reference);
          }

          state.css = globalStyle + JsxStyle;
        }

        //JSXElement是一个对象
        if (t.isJSXMemberExpression(path.node.openingElement.name)) {
          return;
        }

        const name = path.node.openingElement.name.name;

        //如果是内联形式写入css样式
        if (
          name &&
          name !== STYLE_COMPONENT &&
          name.charAt(0) !== name.charAt(0).toUpperCase() &&
          name !== 'style'
        ) {
          // 当发布模式，且资源写到file中时，直接删除标签
          if (!dev && write) {
            if (name === 'es-style' || name === 'es.style') {
              path.remove();
            }
            return;
          }

          if (name === 'es-style' || name === 'es.style') {
            if (state.hasEsStyle) {
              path.remove();
              return;
            }

            //存在es-style标签，则替换标签
            if (state.hasEsStyleElement) {
              state.hasEsStyle = true;
              const _style = styleElement(state, t);
              if (_style) {
                path.replaceWith(_style);
              } else {
                path.remove();
              }
            }
          } else {
            if (state.hasJsxStyle) {
              return;
            }

            //不存在es-style标签，就添加元素
            if (!state.hasEsStyleElement) {
              state.hasJsxStyle = true;
              const _style = styleElement(state, t);
              if (_style) {
                path.node.children.push(_style);
              }
            }
          }
        }
      },
      //给所有的jsx节点插入styleId来进行唯一性的区分
      JSXOpeningElement(path, state) {
        //拿到当前的JSX对象的访问路径
        const el = path.node;
        const attrs = el.attributes;
        const styleId = state.styleId;
        let hasClassName = false;

        if (styleId === 0) {
          return;
        }

        if (attrs.length) {
          attrs.map((item) => {
            if (
              t.isJSXAttribute(item) &&
              t.isJSXIdentifier(item.name) &&
              item.name.name === 'className'
            ) {
              hasClassName = true;
            }
          });
        }

        //JSXElement是一个对象
        if (t.isJSXMemberExpression(path.node.name) && !hasClassName) {
          return;
        }

        if (
          path.node.name.name.charAt(0) ==
            path.node.name.name.charAt(0).toUpperCase() &&
          !hasClassName
        ) {
          return;
        }
        let isExist = false;
        //获取对象属性,添加className
        if (attrs.length) {
          attrs.map((item) => {
            if (
              t.isJSXAttribute(item) &&
              t.isJSXIdentifier(item.name) &&
              item.name.name === 'className' &&
              styleId !== 0
            ) {
              //值为{}
              if (t.isJSXExpressionContainer(item.value)) {
                item.value = t.JSXExpressionContainer(
                  concat(item.value.expression, t.StringLiteral(' ' + styleId)),
                );
              }

              //值是字符串
              if (t.isStringLiteral(item.value)) {
                item.value = t.JSXExpressionContainer(
                  concat(item.value, t.StringLiteral(' ' + styleId)),
                );
              }

              isExist = true;
            }
          });
        }

        if (!isExist && styleId !== 0) {
          path.node.attributes.push(
            t.JSXAttribute(
              t.JSXIdentifier('className'),
              t.StringLiteral(styleId),
            ),
          );
        }
      },
    },
  };
};
