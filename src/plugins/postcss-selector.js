import * as postcss from 'postcss'
import { 
	STYLE_DATA_ES
} from '../utils/constant'

export default postcss.plugin('postcss-selector', (options = {}) => {
	return root => {
		root.walkRules(rule => {  
			//格式化选择器
			if (/:(:)?/.test(rule.selector)) {
				//存在伪类,针对最后一个进行处理
				const _selector = rule.selector.split(" ")
				
				let _last = _selector[_selector.length - 1]
				const _match = _last.match(/(:(:)?.*)/)

				if (_match !== null) {
					//最后一个选择器是伪类
					_last = _last.replace(_match[0], `.${STYLE_DATA_ES}-${options.styleId}${_match[0]}`)
					
					_selector[_selector.length - 1] = _last

					rule.selector = _selector.join(" ")

				} else { 
					rule.selector = rule.selector + `.${STYLE_DATA_ES}-${options.styleId}`
				}
			} else {
				rule.selector = rule.selector + `.${STYLE_DATA_ES}-${options.styleId}`
			}	
		})
	}
})
