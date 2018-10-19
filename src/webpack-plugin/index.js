const webpack = require('webpack');
const path = require('path');
const hashString = require('string-hash');
const md5 = require('md5');
const pluginName = 'EsStyleWebpackPlugin';
const CleanCSS = require('clean-css');
const { dev } = require('../utils');
const { Template } = webpack;

const cleanStyle = (css) => {
  const output = new CleanCSS({}).minify(css);
  return output.styles;
};

var quickSort = function(arr) {
  if (arr.length <= 1) {
    return arr;
  }

  var pivotIndex = Math.floor(arr.length / 2);

  var pivot = arr.splice(pivotIndex, 1)[0];

  var left = [];

  var right = [];

  for (var i = 0; i < arr.length; i++) {
    if (parseInt(arr[i]) < parseInt(pivot)) {
      left.push(arr[i]);
    } else {
      right.push(arr[i]);
    }
  }

  return quickSort(left).concat([pivot], quickSort(right));
};

const license = `/*!\n* es-style\n* https://github.com/topthinking/es-style\n*\n* Released under MIT license. Copyright (c) 2018 GitHub Inc.\n*/`;

class Plugin {
  constructor(combine = false) {
    // 判断是否合并所有样式
    this.combine = combine;
  }

  apply(compiler) {
    // 记录每个chunk对应的css module
    let MyChunks = {};
    let CommonStyle = '';
    let CommonFile = '';
    let StyleFileName = '';
    // 记录公共的chunk css module
    let CommonChunkCssModule = [];
    // 记录公共样式的hash名字，通过hash名字排序拼接style
    let CommonFileHashName = {};
    if (dev()) {
      return;
    }

    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.afterChunks.tap(pluginName, (chunks) => {
        MyChunks = {};
        CommonStyle = '';
        StyleFileName = '';
        CommonChunkCssModule = [];
        CommonFileHashName = {};
        const moduleEntry = []; //每个chunk的入口文件，都是依赖的第一个文件
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
                if (CommonModule[_module]) {
                  if (CommonChunkCssModule.indexOf(_module) === -1) {
                    // 说明已经存在该module了,需要将该module存入公共的css module
                    // 剔除当前模块没有import样式
                    CommonChunkCssModule.push(_module);
                  }
                } else {
                  CommonModule[_module] = debugId;
                }
                _modules.push(_module);
              }
            });
          }
          MyChunks[debugId].modules = _modules;
        }

        //去除MyChunks里面 公共的module
        //同时提取每个chunk的样式
        for (let debugId in MyChunks) {
          const _modules = [];
          const item = MyChunks[debugId];
          let css = {};
          let cssKeys = [];
          if (global['es-style'] && global['es-style']['es'][item.entry]) {
            if (item.name === 'main') {
              // 把main入口的资源也提取到公共模块中
              CommonFileHashName[0] = global['es-style']['es'][item.entry];
            } else {
              const entryId = hashString(item.entry);
              cssKeys.push(entryId);
              css[entryId] = global['es-style']['es'][item.entry];
            }
          }
          if (item.modules.length) {
            item.modules.map((_module) => {
              // 剔除提取的公共模块
              if (CommonChunkCssModule.indexOf(_module) === -1) {
                // 剔除当前模块没有import样式
                if (global['es-style'] && global['es-style']['es'][_module]) {
                  /**
                   * 当前模块不在公共模块内
                   * 但是当前模块引用的样式被公共模块也引用了
                   * 后续该样式会被公共模块提取到全局样式库中
                   * 所以，该模块的样式不加入该模块中
                   */
                  const hashId =
                    global['es-style']['relation']['es']['file'][_module];
                  const relations =
                    global['es-style']['relation']['es']['hash'][hashId];
                  _modules.push(_module);

                  if (item.name === 'main') {
                    // 把main入口的资源也提取到公共模块中
                    let keys = [];
                    relations.map((item) => {
                      keys.push(hashString(item));
                    });
                    keys = Array.from(new Set(quickSort(keys)));

                    if (!CommonFileHashName[keys[0]]) {
                      CommonFileHashName[keys[0]] =
                        global['es-style']['es'][_module];
                    }
                  } else {
                    let isGlobal = false;
                    relations.map((item) => {
                      if (
                        CommonChunkCssModule.indexOf(item) !== -1 &&
                        item !== _module
                      ) {
                        isGlobal = true;
                      }
                    });
                    if (!isGlobal) {
                      // 如果不是全局，则吧样式放到当前的chunk下
                      const _moduleId = hashString(_module);
                      cssKeys.push(_moduleId);
                      css[_moduleId] = global['es-style']['es'][_module];
                    }
                  }
                }
              }
            });
          }

          // 排序cssKeys计算叠加
          cssKeys = Array.from(new Set(quickSort(cssKeys)));
          let ChunkStyle = '';

          cssKeys.map((key) => {
            ChunkStyle += css[key];
          });

          MyChunks[debugId]._modules = item.modules;
          MyChunks[debugId].modules = _modules;
          MyChunks[debugId].style = ChunkStyle;
        }

        // es
        CommonChunkCssModule.map((item) => {
          const hashId = global['es-style']['relation']['es']['file'][item];
          // hashId存在，同时不等于5381 5381=hashString('')
          if (hashId && hashId !== 5381) {
            const relations =
              global['es-style']['relation']['es']['hash'][hashId];

            let keys = [],
              _style = '';
            relations.map((item) => {
              keys.push(hashString(item));
              if (global['es-style']['es'][item]) {
                _style = global['es-style']['es'][item];
              }
            });
            keys = Array.from(new Set(quickSort(keys)));

            if (!CommonFileHashName[keys[0]] && _style) {
              CommonFileHashName[keys[0]] = _style;
            }
          }
        });

        // style
        let _CommonFileHashName = {};
        if (global['es-style'] && global['es-style']['style']) {
          // 获取全局的公共file名称
          const commonStyleReference = Object.keys(global['es-style']['style']);
          commonStyleReference.map((item) => {
            const hashId =
              global['es-style']['relation']['style']['file'][item];
            const relations =
              global['es-style']['relation']['style']['hash'][hashId];
            let keys = [],
              _style = '';
            relations.map((item) => {
              keys.push(hashString(item));
              if (global['es-style']['style'][item]) {
                _style = global['es-style']['style'][item];
              }
            });
            keys = Array.from(new Set(quickSort(keys)));
            if (!_CommonFileHashName[keys[0]] && _style) {
              _CommonFileHashName[keys[0]] = _style;
            }
          });
        }

        /**
         * 收集公共样式
         */
        // 提取全局的样式
        CommonStyle = '';
        const _CommonFileHashNameKeys = Array.from(
          new Set(quickSort(Object.keys(_CommonFileHashName))),
        );
        _CommonFileHashNameKeys.map((item) => {
          CommonStyle += _CommonFileHashName[item];
        });

        // 复用两个不同chunk的css-module需要提取
        const CommonFileHashNameKeys = Array.from(
          new Set(quickSort(Object.keys(CommonFileHashName))),
        );
        CommonFileHashNameKeys.map((item) => {
          CommonStyle += CommonFileHashName[item];
        });
      });

      // 添加chunkId
      compilation.hooks.afterOptimizeChunkIds.tap(pluginName, (chunks) => {
        const dir = process.cwd();
        chunks.map((item) => {
          if (MyChunks[item.debugId]) {
            MyChunks[item.debugId].id = item.id;
            let jsFile = MyChunks[item.debugId].entry;
            if (!global['es-style']['es'][jsFile]) {
              for (let i = 0; i < MyChunks[item.debugId]._modules.length; i++) {
                const module = MyChunks[item.debugId]._modules[i];
                // 当前模块在当前chunk下
                // 当前模块存在样式资源
                // 当前模块不在公共模块内
                if (
                  global['es-style']['es'][module] &&
                  CommonChunkCssModule.indexOf(module) === -1 &&
                  module.indexOf(dir) !== -1
                ) {
                  jsFile = module;
                  break;
                }
              }
            }
            MyChunks[item.debugId]['hash-bundle'] = hashString(jsFile);
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
          if (this.combine) {
            return source;
          }
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

      // 整理hash后的文件依赖
      compilation.hooks.additionalChunkAssets.tap(pluginName, (chunks) => {
        chunks.map((item) => {
          if (MyChunks[item.debugId]) {
            const stylesFiles = item.files.filter((file) =>
              /styles\//.test(file),
            );
            if (item.name === 'main' && stylesFiles.length) {
              // 存在样式资源，主要配合插件 mini-css-extract-plugin
              StyleFileName = stylesFiles[0];
            }

            const scriptsFiles = item.files.filter((file) =>
              /scripts\//.test(file),
            );
            if (scriptsFiles.length) {
              MyChunks[item.debugId].fileName = scriptsFiles[0]
                .split('/')
                .pop()
                .replace(/\.js$/, '.css');
            }
          }
        });
      });
    });

    compiler.hooks.emit.tapAsync(pluginName, (compilation, callback) => {
      let map = {};

      // 生成bundle文件
      const bundleLength = Object.keys(MyChunks).length;
      for (let debugId in MyChunks) {
        const item = MyChunks[debugId];
        const style = item.style;
        if (item.name === 'main') {
          // 入口文件，默认是main，所以不能修改默认入口
          map[item.name] = item.fileName.replace(/\.css/, '');
        } else {
          if (style !== '' && bundleLength > 1) {
            if (this.combine) {
              // 需要合并所有样式，就把当前chunk的样式加入到CommonStyle里面
              CommonStyle += style;
            } else {
              if (typeof item.name !== 'string') {
                map[item['hash-bundle']] = item.fileName;
              } else {
                map[item.name] = item.fileName;
              }
              const _style = license + cleanStyle(style);
              compilation.assets[
                'styles/' + (item.hashName || item.fileName)
              ] = {
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
      }

      // 生成公共样式文件
      if (CommonStyle !== '') {
        const _style = license + cleanStyle(CommonStyle);
        const _file = md5(_style).substr(0, 5) + '.css';
        map[0] = _file;
        compilation.assets['styles/' + _file] = {
          source() {
            return _style;
          },
          size() {
            return _style.length;
          },
        };
      }

      if (StyleFileName !== '') {
        map['main-style'] = StyleFileName.split('/').pop();
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
