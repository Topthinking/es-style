import postcss from 'postcss';
import { STYLE_DATA_ES } from '../utils/constant';

export default postcss.plugin('postcss-selector', (options = {}) => {
  let uniqueInfo = `.${STYLE_DATA_ES}-${options.styleId}`;
  if (options.styleType === 'attribute') {
    uniqueInfo = `[data-${STYLE_DATA_ES}-${options.styleId}]`;
  }

  return (root) => {
    root.walkRules((rule) => {
      //忽略keyframs内的过渡选择器
      if (rule.parent.type === 'atrule') {
        if (rule.parent.name === 'keyframes') {
          return;
        }
      }

      //格式化选择器，存在伪类
      if (/:(:)?/.test(rule.selector)) {
        // 判断是否是a,b这样的选择器
        const selectors = rule.selector.split(',');

        selectors.map((item, index) => {
          //存在伪类,针对最后一个进行处理
          const _selector = item.split(' ');

          let _last = _selector[_selector.length - 1];
          const _match = _last.match(/(:(:)?.*)/);

          if (_match !== null) {
            //最后一个选择器是伪类
            _last = _last.replace(_match[0], `${uniqueInfo}${_match[0]}`);

            _selector[_selector.length - 1] = _last;

            item = _selector.join(' ');
          } else {
            item = item + uniqueInfo;
          }
          selectors[index] = item;
        });

        rule.selector = selectors.join(',');
        return;
      }

      rule.selector = rule.selector + uniqueInfo;
    });
  };
});
