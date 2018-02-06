import * as postcss from 'postcss'
import parseImage from '../utils/parse-image'

export default postcss.plugin('postcss-images', (options = {}) => {
	const reference = options.reference
	const imageOptions = options.imageOptions
	return root => {
		root.walkRules(rule => {  
			rule.walkDecls(decl => {
				//查询css的value是否存在url(<地址>)
				const _match = decl.value.match(/url\((['"]|[^'"])(.*)(['"]|[^'"])\)/)
				if(_match){
					let url = _match[2]
					if(_match[1] != _match[3]){
						url = _match[1] + _match[2] + _match[3]
					}					
					decl.value = decl.value.replace(url,parseImage(url, reference, imageOptions))						
				}
			})							
		})
	}
})
