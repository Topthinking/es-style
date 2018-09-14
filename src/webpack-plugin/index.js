const webpack = require('webpack');
const hashString = require('string-hash');
const md5 = require('md5');
const pluginName = 'EsStyleWebpackPlugin';
const { Template } = webpack;

class Plugin {
  apply(compiler) {
    // 记录每个chunk对应的css module
    let MyChunks = {};
    // 记录公共的chunk css module
    let CommonChunkCssModule = [];
    // 记录每个bundle对应的js资源
    let bundleChunkId = {};

    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.afterChunks.tap(pluginName, (chunks) => {
        chunks.map((item) => {
          const module = [];
          for (let _module of item.modulesIterable) {
            if (!/node_modules/.test(_module.resource)) {
              // 当前模块存在样式
              if (
                global['es-style'] &&
                global['es-style']['es'][_module.resource] &&
                global['es-style']['es'][_module.resource] !== ''
              ) {
                module.push(_module.resource);
              }
            }
          }
          MyChunks[item.debugId] = module;
        });
      });

      // 获取chunk的依赖的模块的ast结构 对应 chunks
      compilation.hooks.afterOptimizeChunkIds.tap(pluginName, (chunks) => {
        const _chunks = {};
        const bundles = [];
        chunks.map((item) => {
          const modules = MyChunks[item.debugId] || [];
          // 收集bundle
          if (
            modules.length &&
            modules[0] &&
            /\.bundle\.(jsx|js|ts|tsx)$/.test(modules[0])
          ) {
            bundles.push(modules[0]);
            bundleChunkId[modules[0]] = item.id;
          }
          _chunks[item.id] = modules;
        });

        // 去除依赖bundle
        // 提取公共的css chunk >= 2
        const moduleChunk = {};
        for (let id in _chunks) {
          if (_chunks[id].length) {
            const modules = [];
            _chunks[id].map((item, index) => {
              if (index == 0 || bundles.indexOf(item) === -1) {
                if (moduleChunk[item]) {
                  CommonChunkCssModule.push(item);
                } else {
                  moduleChunk[item] = [id];
                }
                modules.push(item);
              }
            });
            _chunks[id] = modules;
          }
        }

        // 去掉公共的css chunk
        for (let id in _chunks) {
          if (_chunks[id].length) {
            const modules = [];
            _chunks[id].map((item) => {
              if (CommonChunkCssModule.indexOf(item) === -1) {
                modules.push(item);
              }
            });
            _chunks[id] = modules;
          }
        }

        MyChunks = _chunks;
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
          for (let chunkId in MyChunks) {
            if (MyChunks[chunkId].length) {
              chunkMap[parseInt(chunkId)] = 1;
            }
          }
          if (Object.keys(chunkMap).length > 0) {
            return Template.asString([
              source,
              '',
              `// ${pluginName} CSS loading`,
              `var cssChunks = ${JSON.stringify(chunkMap)};`,
              'if(installedCssChunks[chunkId]) promises.push(installedCssChunks[chunkId]);',
              'else if(installedCssChunks[chunkId] !== 0 && cssChunks[chunkId]) {',
              Template.indent([
                'promises.push(installedCssChunks[chunkId] = new Promise(function(resolve, reject) {',
                Template.indent([
                  `var fullhref = jsonpScriptSrc(chunkId).replace(/\\.js$/,'.css');`,
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
        const _MyChunks = [];
        const bundles = Object.keys(bundleChunkId);
        chunks.map((item) => {
          if (MyChunks[item.id]) {
            let existModule = '';
            let css = '';
            MyChunks[item.id].map((module) => {
              if (global['es-style'] && global['es-style']['es'][module]) {
                css += global['es-style']['es'][module];
              }
              if (bundles.indexOf(module) !== -1) {
                existModule = module;
              }
            });
            if (existModule !== '' && css !== '') {
              bundleChunkId[existModule] = item.files[0].replace(
                /\.js$/,
                '.css',
              );
            }
            _MyChunks.push({
              fileName: item.files[0].replace(/\.js$/, '.css'),
              style: css,
            });
          }
        });
        MyChunks = _MyChunks;

        let _bundleChunkId = {};
        for (let bundle in bundleChunkId) {
          _bundleChunkId[hashString(bundle)] = bundleChunkId[bundle];
        }

        bundleChunkId = _bundleChunkId;
      });
    });

    compiler.hooks.emit.tapAsync(pluginName, (compilation, callback) => {
      //生成公共的css文件
      let commonStyle = '';

      if (global['es-style'] && global['es-style']['style']) {
        commonStyle += global['es-style']['style'];
      }

      CommonChunkCssModule.map((item) => {
        if (global['es-style'] && global['es-style']['es'][item]) {
          commonStyle += global['es-style']['es'][item];
        }
      });

      const commonFile = md5(commonStyle).substr(0, 5) + '.css';

      bundleChunkId[0] = commonFile;

      compilation.assets[commonFile] = {
        source() {
          return commonStyle;
        },
        size() {
          return commonStyle.length;
        },
      };

      // 生成css文件
      MyChunks.map((item) => {
        if (item.style !== '') {
          compilation.assets[item.fileName] = {
            source() {
              return item.style;
            },
            size() {
              return item.style.length;
            },
          };
        }
      });

      // 生成提供服务器使用的css文件的map
      const map = JSON.stringify(bundleChunkId);
      compilation.assets['style.map.json'] = {
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
