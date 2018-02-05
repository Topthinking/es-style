import * as postcss from 'postcss'
import { resolve, basename, join } from 'path'
import mime from 'mime'
import fs from 'fs-extra'
import requireResolve from 'require-resolve'

export default postcss.plugin('postcss-images', (options = {}) => {
	const reference = options.reference
	const { limit = null ,name, path, publicPath } = options.imageOptions
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
						let new_src = url
						// http:// https:// // 
						if (!/^http(s)?:|^\/\//.test(url)) {							
							const mod = requireResolve(url, resolve(reference))
							if (!mod || !mod.src) {
								throw new Error(`Path '${url}' could not be found for '${reference}'`);
							}
							const src = mod.src
							const stat = fs.statSync(src)
							const data = fs.readFileSync(src)							

							if (limit != null && stat.size < limit) {
								//转成base64
								const mimetype = mime.getType(src)								
								new_src = `data:${mimetype || ''};base64,${data.toString('base64')}`
							} else {
								//拷贝图片到输出目录
								/**
								 * /user/a
								 * /user/a/dist
								 * imageName.ext
								 */
								new_src = join(publicPath,name.replace('[name]',basename(src)))
								fs.copySync(src, join(path, new_src))								
							}
						}	

						decl.value = decl.value.replace(url,new_src)						
					}
				})							
		})
	}
})
