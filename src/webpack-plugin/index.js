const webpack = require('webpack');
const hashString = require('string-hash');
const md5 = require('md5');
const pluginName = 'EsStyleWebpackPlugin';
const CleanCSS = require('clean-css');
const { Template } = webpack;

const cleanStyle = (css) => {
  const output = new CleanCSS({}).minify(css);
  return output.styles;
};

const license = `/*!\n* es-style\n* https://github.com/topthinking/es-style\n*\n* Released under MIT license. Copyright (c) 2018 GitHub Inc.\n*/`;

class Plugin {
  apply(compiler) {
    // 记录每个chunk对应的css module
    let MyChunks = {};
    let CommonStyle = '';
    let CommonFile = '';
    // 记录每个bundle对应的js资源
    let bundleChunkId = {};

    if (
      process.env.NODE_ENV === 'development' ||
      typeof process.env.NODE_ENV === 'undefined'
    ) {
      return;
    }

    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.afterChunks.tap(pluginName, (chunks) => {
        MyChunks = {};
        CommonStyle = '';
        const moduleEntry = []; //每个chunk的入口文件，都是依赖的第一个文件
        // 记录公共的chunk css module
        const CommonChunkCssModule = [];
        chunks.map((item) => {
          const modules = [];
          for (let module of item.modulesIterable) {
            if (module.resource && !/node_modules/.test(module.resource)) {
              // 当前模块存在样式
              modules.push(module.resource);
            }
          }
          // 获取第一个模块
          const entry = modules.shift();
          moduleEntry.push(entry);

          MyChunks[item.debugId] = {
            entry,
            modules,
            name: item.name,
          };
        });

        //去除重复的bundle依赖
        //同时可以提取公共依赖 >= 2
        const CommonModule = {};
        for (let debugId in MyChunks) {
          const _modules = [];
          const item = MyChunks[debugId];
          if (item.modules.length) {
            item.modules.map((_module, index) => {
              // 表示非入口的模块
              if (moduleEntry.indexOf(_module) === -1) {
                if (
                  CommonModule[_module] &&
                  CommonChunkCssModule.indexOf(_module) === -1
                ) {
                  // 说明已经存在该module了,需要将该module存入公共的css module
                  // 剔除当前模块没有import样式
                  if (
                    global['es-style'] &&
                    global['es-style']['es'][_module] &&
                    global['es-style']['es'][_module] !== ''
                  ) {
                    CommonChunkCssModule.push(_module);
                  }
                } else {
                  CommonModule[_module] = 1;
                }
                _modules.push(_module);
              }
            });
          }
          MyChunks[debugId].modules = _modules;
        }

        //去除MyChunks里面 公共的module
        for (let debugId in MyChunks) {
          const _modules = [];
          const item = MyChunks[debugId];
          let css = '';
          if (
            global['es-style'] &&
            global['es-style']['es'][item.entry] &&
            global['es-style']['es'][item.entry] !== ''
          ) {
            css += global['es-style']['es'][item.entry];
          }
          if (item.modules.length) {
            item.modules.map((_module) => {
              // 剔除提取的公共模块
              if (CommonChunkCssModule.indexOf(_module) === -1) {
                // 剔除当前模块没有import样式
                if (
                  global['es-style'] &&
                  global['es-style']['es'][_module] &&
                  global['es-style']['es'][_module] !== ''
                ) {
                  css += global['es-style']['es'][_module];
                  _modules.push(_module);
                }
              }
            });
          }
          MyChunks[debugId].modules = _modules;
          MyChunks[debugId].style = css;
        }

        // 生成公共的样式资源

        if (global['es-style'] && global['es-style']['style']) {
          CommonStyle += global['es-style']['style'];
        }

        CommonChunkCssModule.map((item) => {
          if (global['es-style'] && global['es-style']['es'][item]) {
            CommonStyle += global['es-style']['es'][item];
          }
        });
      });

      // 添加chunkId
      compilation.hooks.afterOptimizeChunkIds.tap(pluginName, (chunks) => {
        chunks.map((item) => {
          if (MyChunks[item.debugId]) {
            MyChunks[item.debugId].id = item.id;
            MyChunks[item.debugId]['hash-bundle'] = hashString(
              MyChunks[item.debugId].entry,
            );
          }
        });
      });

      // 插入请求样式资源模板
      const { mainTemplate } = compilation;

      mainTemplate.hooks.localVars.tap(pluginName, (source, chunk) => {
        if (Object.keys(MyChunks).length > 0) {
          return Template.asString([
            source,
            '',
            '// object to store loaded CSS chunks',
            'var installedCssChunks = {',
            Template.indent(
              chunk.ids.map((id) => `${JSON.stringify(id)}: 0`).join(',\n'),
            ),
            '}',
          ]);
        }

        return source;
      });

      mainTemplate.hooks.requireEnsure.tap(
        pluginName,
        (source, chunk, hash) => {
          const chunkMap = {};
          for (let debugId in MyChunks) {
            if (MyChunks[debugId].style) {
              chunkMap[MyChunks[debugId].id] = 1;
            }
          }
          if (Object.keys(chunkMap).length > 0) {
            return Template.asString([
              source,
              '',
              `// ${pluginName} CSS loading`,
              `var cssChunks = ${JSON.stringify(chunkMap)};`,
              `var jsonpString = jsonpScriptSrc.toString().replace('scripts','styles').replace(/return\\s(.*\\.p)/,'return _p');`,
              `var fn = new Function('_p','return ' + jsonpString);`,
              'if(installedCssChunks[chunkId]) promises.push(installedCssChunks[chunkId]);',
              'else if(installedCssChunks[chunkId] !== 0 && cssChunks[chunkId]) {',
              Template.indent([
                'promises.push(installedCssChunks[chunkId] = new Promise(function(resolve, reject) {',
                Template.indent([
                  `var fullhref = fn(${
                    mainTemplate.requireFn
                  }.p)(chunkId).replace(/\\.js$/,'.css');`,
                  `// 判断fullhref是否已经通过link加载`,
                  'var existingLinkTags = document.getElementsByTagName("link");',
                  'for(var i = 0; i < existingLinkTags.length; i++) {',
                  Template.indent([
                    'var tag = existingLinkTags[i];',
                    'if(tag.rel === "stylesheet" && tag.getAttribute("href") === fullhref) {',
                    Template.indent(['return resolve();']),
                    '}',
                  ]),
                  '}',
                  'var linkTag = document.createElement("link");',
                  'linkTag.rel = "stylesheet";',
                  'linkTag.type = "text/css";',
                  'linkTag.onload = resolve;',
                  'linkTag.onerror = function(event) {',
                  Template.indent([
                    'var request = event && event.target && event.target.src || fullhref;',
                    'var err = new Error("Loading CSS chunk " + chunkId + " failed.\\n(" + request + ")");',
                    'err.request = request;',
                    'reject(err);',
                  ]),
                  '};',
                  'linkTag.href = fullhref;',
                  'var head = document.getElementsByTagName("head")[0];',
                  'head.appendChild(linkTag);',
                ]),
                '}).then(function() {',
                Template.indent(['installedCssChunks[chunkId] = 0;']),
                '}));',
              ]),
              '}',
            ]);
          }
          return source;
        },
      );

      mainTemplate.hooks.startup.tap(pluginName, (source, chunk, hash) => {
        let linkSource = '',
          moreEntry = false;

        const chunks = Object.keys(MyChunks);
        const mainStyle = [];

        if (chunks.length === 1) {
          // 如果只有一个chunk，那么将与common合并
          CommonStyle += MyChunks[chunks[0]].style;
        } else {
          let entry = 0,
            style = '';
          // 再判断当前是否是多入口，如果是多入口，则分开，否则还是算一个
          for (let debugId in MyChunks) {
            if (
              typeof MyChunks[debugId].name === 'string' &&
              debugId === chunk.debugId
            ) {
              style = MyChunks[debugId].style;
              entry++;
            }
          }
          // 单入口，也将入口文件里面的样式放到common里面去
          if (entry === 1) {
            CommonStyle += style;
          } else if (entry > 1) {
            moreEntry = true;
          }
        }

        if (CommonStyle !== '') {
          CommonFile = md5(CommonStyle).substr(0, 5) + '.css';
          mainStyle.push(CommonFile);
        }

        if (moreEntry && MyChunks[chunk.debugId].style !== '') {
          MyChunks[chunk.debugId].hashName =
            md5(MyChunks[chunk.debugId].style).substr(0, 5) + '.css';
          mainStyle.push(MyChunks[chunk.debugId].hashName);
        }

        // 取出当前的主要入口chunk样式
        if (mainStyle.length) {
          linkSource = Template.asString([
            `function loadLink(name) {`,
            Template.indent([
              `return Promise.all(name.map(function(item){`,
              Template.indent([
                `return new Promise(function(resolve,reject){`,
                Template.indent([
                  `var fullhref = ${mainTemplate.requireFn}.p + item;`,
                  'var linkTag = document.createElement("link");',
                  'linkTag.rel = "stylesheet";',
                  'linkTag.type = "text/css";',
                  'linkTag.onload = resolve;',
                  'linkTag.onerror = function(event) {',
                  Template.indent([
                    'var request = event && event.target && event.target.src || fullhref;',
                    'var err = new Error("Loading CSS chunk "+ item +" failed.\\n(" + request + ")");',
                    'reject(err);',
                  ]),
                  '};',
                  'linkTag.href = fullhref;',
                  'var head = document.getElementsByTagName("head")[0];',
                  'head.appendChild(linkTag);',
                ]),
                '});',
              ]),
              '}));',
            ]),
            '};',
            `var loadStyle = ${JSON.stringify(mainStyle)};`,
            `loadLink(loadStyle).then(function(){resolve()}).catch(function(err){reject(err)});`,
          ]);
        } else {
          linkSource = Template.asString(['resolve();']);
        }
        return Template.asString([
          'return new Promise(function(resolve,reject){',
          Template.indent([linkSource]),
          '}).then(function(){',
          Template.indent([source]),
          '}).catch(function(err){',
          Template.indent(['console.error(err)']),
          '})',
        ]);
      });

      // 整理hash后的文件依赖
      compilation.hooks.additionalChunkAssets.tap(pluginName, (chunks) => {
        chunks.map((item) => {
          if (MyChunks[item.debugId]) {
            MyChunks[item.debugId].fileName = item.files[0]
              .split('/')
              .pop()
              .replace(/\.js$/, '.css');
          }
        });
      });
    });

    compiler.hooks.emit.tapAsync(pluginName, (compilation, callback) => {
      let map = {};
      // 生成公共样式文件
      if (CommonFile !== '') {
        map[0] = CommonFile;
        const _style = license + cleanStyle(CommonStyle);
        compilation.assets['styles/' + CommonFile] = {
          source() {
            return _style;
          },
          size() {
            return _style.length;
          },
        };
      }

      // 生成bundle文件
      if (Object.keys(MyChunks).length > 1) {
        for (let debugId in MyChunks) {
          const item = MyChunks[debugId];
          const style = item.style;
          if (style !== '') {
            if (typeof item.name !== 'string') {
              map[item['hash-bundle']] = item.fileName;
            } else {
              map[item.name] = item.fileName;
            }
            const _style = license + cleanStyle(style);
            compilation.assets['styles/' + (item.hashName || item.fileName)] = {
              source() {
                return _style;
              },
              size() {
                return _style.length;
              },
            };
          }
        }
      }

      // 生成提供服务器使用的css文件的map
      map = JSON.stringify(map);
      compilation.assets['map.json'] = {
        source() {
          return map;
        },
        size() {
          return map.length;
        },
      };
      callback();
    });
  }
}

module.exports = Plugin;
