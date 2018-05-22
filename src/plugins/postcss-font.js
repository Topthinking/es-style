import postcss from 'postcss'
import request from 'request'
import fs from 'fs-extra'
import requireResolve from 'require-resolve'
import md5 from 'md5'
import { resolve, basename, join } from 'path'
import memoryFs, { get } from '../watch/fs'

const getAllUrls =  (root) => { 
	let fontUrls = []

	return new Promise((resolve, reject) => {
		
		root.walkAtRules(rule => { 
			if (rule.name === 'font-face') {
				rule.walkDecls(decl => {
					if (decl.prop === 'src') {
						const match = decl.value.match(/url\((['|"|h|\/|.])([^)]*)\)/g)
						if (match) {
							match.map(item => {
								const url = item.match(/\((([^)]*))\)/)[1].replace(/'|"/g, '').split('#').shift().split('?').shift();
								fontUrls.push(url)
							})
						}
					}
				})
			}	
		})

		resolve(fontUrls)
	})	
}

const fetchSource = (root, fontUrls, tmp) => {
	return Promise.all(fontUrls.map(url => {
		if (/^http(s)?:|^\/\//.test(url)) {
			const filename = url.split('/').pop().split('#').shift().split('?').shift() //文件名称
			const tmpfile = join(tmp, filename)
			return new Promise((resolve, reject) => {
				if (!fs.existsSync(tmpfile)) {
					request
						.get(url)
						.on('error', function (err) {
							console.error(`请求地址【'${url}' 】的资源没有找到`);
							if (/production|test/.test(process.env.NODE_ENV)) {
								process.exit(1)
							}
						})
						.on('response', (response) => {
							const ret = {}
							ret[url] = tmpfile
							resolve(ret)
						}).pipe(fs.createWriteStream(tmpfile))
				} else { 
					const ret = {}
					ret[url] = tmpfile
					resolve(ret)
				}
			})
		}else { 
			const ret = {}
			ret[url] = url	
			return ret
		}
	})).then((data) => {
		if (data.length) {
			let urls = {}
			data.map(item => {
				urls = { ...urls, ...item }
			})
			return urls
		} else { 
			return null
		}
	})
}

const handle = (root, urls, { reference, publicPath, path, fileSystem, write, fontOptions } = {}) => {
	if (urls) { 
		fontOptions.path = fontOptions.path || 'dist/fonts'

		const watchData = get()
		
		if (Object.keys(watchData).length) { 
			path = watchData.path
			publicPath = watchData.publicPath
		}
		
		root.walkAtRules(rule => { 
			if (rule.name === 'font-face') {
				rule.walkDecls(decl => {
					if (decl.prop === 'src') {
						const match = decl.value.match(/url\((['|"|h|\/|.])([^)]*)\)/g)
						if (match) {
							match.map(item => {
								const url = item.match(/\((([^)]*))\)/)[1].replace(/'|"/g, '').split('#').shift().split('?').shift();
								
								let new_src = '', src = '';
								//获取所有真实的地址
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
								} else { 
									//临时文件夹文件地址
									src = urls[url]
								}

								const stat = fs.statSync(src)						
								const filename = basename(src)

								let _filename = filename.split('.')
								let ext = _filename.pop()
								_filename = _filename.join('.')

								//重命名文件名称
								_filename = _filename + '_' + md5(item).substr(0, 7) + '.' + ext
								
								//file 文本文件类型
								//memory 内存文件类型
								if (fileSystem === 'file') {					
									new_src = [publicPath, fontOptions.path, _filename].join("")
									if (write) {
										//如果当前可写，那么就将图片资源输出
										fs.copySync(src, join(path, fontOptions.path, _filename))
									}	
								}
								
								if (fileSystem === 'memory') {
									const new_dir = join('/static', fontOptions.path)
									
									if (!memoryFs.existsSync(new_dir)) {
										memoryFs.mkdirpSync(new_dir)
									}
									
									new_src = join(new_dir, _filename)

									if (/^\./.test(url)) {
										memoryFs.writeFileSync(new_src, fs.readFileSync(src))
									} else {
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
	return Promise.resolve([])
}

export default postcss.plugin('postcss-font', (options) => {
	//临时目录
	const tmp = join(process.cwd(), '.es-style-fonts')
	if (!fs.existsSync(tmp)) {
		fs.mkdirSync(tmp)
	}

	return root => { 
		return getAllUrls(root)
			.then((fontUrls) => fetchSource(root, fontUrls, tmp))	
			.then((data) => handle(root, data, options))
			.catch((err) => {
				console.error(`postcss-font: An error occurred while processing files - ${err.message}`);
				console.error(err.stack);
				throw err;
			});
	}
})