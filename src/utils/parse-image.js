import fs from 'fs-extra'
import memoryFs, { get } from '../watch/fs'
import mime from 'mime'
import requireResolve from 'require-resolve'
import md5 from 'md5'
import { resolve, basename, join } from 'path'
import { isObject } from './'

export default (url, reference, imageOptions) => {

	const watchData = get()

	let {
		limit = null,
		dir = '',
		path = join(process.cwd(), 'dist'),
		publicPath = '/'
	} = imageOptions
	
	if (Object.keys(watchData).length) { 
		path = watchData.path
		publicPath = watchData.publicPath
	}

	let new_src = url
	// http:// https:// // 
	if (!/^http(s)?:|^\/\//.test(url)) {							
		const mod = requireResolve(url, resolve(reference))
		if (!mod || !mod.src) {
			console.error(`Path '${url}' could not be found for '${reference}'`);
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
			const filename = basename(src)
			let _filename = filename.split('.')
			let ext = _filename.pop() 
			_filename = _filename.join('.')
			//文件名称
			_filename = _filename + '_' + md5(data).substr(0,7) + '.' + ext

			if (process.env.NODE_ENV !== 'production') {
				//开发
				const new_dir = join('/static', dir)
				
				if (!memoryFs.existsSync(new_dir)) { 
					memoryFs.mkdirpSync(new_dir)
				}
				new_src = join(new_dir, _filename)

				memoryFs.writeFileSync(new_src, data)	

			} else { 
				//发布
				new_src = [publicPath, dir, _filename].join("")
				fs.copySync(src, join(path, dir, _filename))
			}							
		}
	}	

	return new_src
}