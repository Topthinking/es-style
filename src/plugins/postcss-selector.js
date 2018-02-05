import * as postcss from 'postcss'
import { 
	STYLE_DATA_ES
} from '../utils/constant'

export default postcss.plugin('postcss-selector', (options = {}) => {
	return root => {
		root.walkRules(rule => {  
				//格式化选择器
				rule.selector = rule.selector + `[${STYLE_DATA_ES}="${options.styleId}"]`								
		})
	}
})
