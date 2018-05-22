import postcss from 'postcss'
import request from 'request'
import fs from 'fs-extra'
import requireResolve from 'require-resolve'
import md5 from 'md5'
import { resolve, basename, join } from 'path'
import memoryFs, { get } from '../watch/fs'

export default postcss.plugin('postcss-font', ({
	reference,
	publicPath,
	path,
	fileSystem,
	write,
	fontOptions
} = {}) => {
	
	fontOptions.path = fontOptions.path || 'dist/fonts'

	const watchData = get()
	
	if (Object.keys(watchData).length) { 
		path = watchData.path
		publicPath = watchData.publicPath
	}

	return root => { 
		root.walkAtRules(rule => { 
			if (rule.name === 'font-face') {
				rule.walkDecls(decl => {
					if (decl.prop === 'src') {
						const match = decl.value.match(/url\((['|"|h|\/|.])([^)]*)\)/g)
						if (match) {
							match.map(item => {
								const url = item.match(/\((([^)]*))\)/)[1].replace(/'|"/g, '').split('#').shift().split('?').shift();
								
								let new_src = '', src = '', filename = url.split('/').pop(), ext = url.split('/').pop().split('.').pop();

								//新的文件名称
								filename = filename.split('.').shift() + '_' + md5(item).substr(0, 7) + '.' + ext

								let fontDir = join(path, fontOptions.path)
								let realPath = join(fontDir, filename)

								if (!fs.existsSync(fontDir)) {
									fs.mkdirpSync(fontDir)
								}

								//获取真实的本地资源地址
								if (/^\./.test(url)) {
									//本地文件
									const mod = requireResolve(url, resolve(reference))
									if (!mod || !mod.src) {
										console.error(`Path '${url}' could not be found for '${reference}'`);
										if (/production|test/.test(process.env.NODE_ENV)) {
											process.exit(1)
										}
										new_src = `/error.eot?error=Path-${url}-could-not-be-found-for-${reference}`
									} else {
										//解析到的全路径
										src = mod.src
									}																		
								}

								//获取新地址
								//file 文本文件类型									
								if (fileSystem === 'file') {	
									// http://cdn.com/dist/fonts/font-name.svg
									new_src = [publicPath, fontOptions.path, filename].join("")									
								}
								
								//memory 内存文件类型
								if (fileSystem === 'memory') {
									const new_dir = join('/static', fontOptions.path)									
									if (!memoryFs.existsSync(new_dir)) {
										memoryFs.mkdirpSync(new_dir)
									}									
									new_src = join(new_dir, filename)
								}

								//写文件
								if (/^\./.test(url)) {
									//本地文件转移

									if (fileSystem === 'file' && write) {
										fs.copySync(src, realPath)
									}

									if (fileSystem === 'memory') { 
										memoryFs.writeFileSync(new_src, fs.readFileSync(src))
									}

								} else { 
									//远程下载文件

									if (fileSystem === 'file' && write) {
										request.get(url).pipe(fs.createWriteStream(realPath))
									}

									if (fileSystem === 'memory') { 
										request.get(url).pipe(memoryFs.createWriteStream(new_src))
									}
								}

								decl.value = decl.value.replace(url, new_src)								
							})
						}
					}
				})
			}	
		})
	}
})