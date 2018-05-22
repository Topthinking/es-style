import postcss from 'postcss'
import parseImage from '../utils/parse-image'

export default postcss.plugin('postcss-images', ({
	path,
	imageOptions,
	write,
	publicPath,
	fileSystem
} = {}) => {
	return root => {
		root.walkRules(rule => {  
			rule.walkDecls(decl => {
				//查询css的value是否存在url(<地址>)
				const _match = decl.value.match(/url\(['|"|.][^)]*\)/g)
				if (_match) {
					//匹配到数组形式
					_match.map(item => { 
						const _item = item.match(/url\((['|"|.])([^)]*)\)/)
						if (_item) {
							let url = _item[2]
							if (_item[1] === '.') {
								url = '.' + url
							} else { 
								url = url.substr(0, url.length - 1)								
							}
							const itemValue = item.replace(url, parseImage({
								url,
								reference: root.source.input.file,
								write,
								imageOptions, 
								path,
								publicPath,
								fileSystem
							}))								
							decl.value = decl.value.replace(item, itemValue)							
						}	
					})																				
				}
			})							
		})
	}
})
