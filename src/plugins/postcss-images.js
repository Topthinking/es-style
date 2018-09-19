import postcss from 'postcss';
import parseImage from '../utils/parse-image';

export default postcss.plugin(
  'postcss-images',
  ({ publicEntry, imageOptions, write, publicPath } = {}) => {
    return (root) => {
      root.walkRules((rule) => {
        // 记录class选择器，主要用来生成随机的class时防止冲突
        //忽略keyframs内的过渡选择器
        if (rule.parent.type !== 'atrule' && rule.parent.name !== 'keyframes') {
          rule.selector.split(',').map((item) => {
            item.split(' ').map((item) => {
              item.split('.').map((item) => {
                if (item !== '' && !/[:|#]/.test(item)) {
                  item = item.replace(/[>|+]/, '');
                  if (global['es-style-class'].indexOf(item) === -1) {
                    global['es-style-class'].push(item);
                  }
                }
              });
            });
          });
        }

        rule.walkDecls((decl) => {
          //查询css的value是否存在url(<地址>)
          const _match = decl.value.match(/url\(['|"|.][^)]*\)/g);
          if (_match) {
            //匹配到数组形式
            _match.map((item) => {
              const _item = item.match(/url\((['|"|.])([^)]*)\)/);
              if (_item) {
                let url = _item[2];
                if (_item[1] === '.') {
                  url = '.' + url;
                } else {
                  url = url.substr(0, url.length - 1);
                }
                try {
                  const itemValue = item.replace(
                    url,
                    parseImage({
                      url,
                      reference: root.source.input.file,
                      write,
                      imageOptions,
                      publicEntry,
                      publicPath,
                    }),
                  );
                  decl.value = decl.value.replace(item, itemValue);
                } catch (err) {
                  throw err;
                }
              }
            });
          }
        });
      });
    };
  },
);
