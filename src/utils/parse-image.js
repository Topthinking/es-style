import fs from 'fs-extra'
import mime from 'mime'
import requireResolve from 'require-resolve'
import md5 from 'md5'
import { resolve, basename, join } from 'path'

export default (url, reference, imageOptions) => {
	const { limit = null , dir = '', publicPath = '/' } = imageOptions
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
			
			new_src = join(publicPath, dir, _filename + '_' + md5(data).substr(0,7) + '.' + ext)
			
			fs.copySync(src, join(process.cwd(),'static', new_src))								
		}
	}	

	return new_src
}