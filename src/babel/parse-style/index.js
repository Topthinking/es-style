import postcss from 'postcss'
import path from 'path'
import sass from 'node-sass'
import { hashString } from '../../utils'

import postcssSelector from '../../plugins/postcss-selector'
import postcssImages from '../../plugins/postcss-images'

//node-sass获取style
export const content = (givenPath, sassOptions) => sass.renderSync({
	file: givenPath,
	...sassOptions
}).css.toString()

//postcss plugins
export const parse = (plugins, state) => {
	const _plugins = []
	let reference = state && state.file && state.file.opts.filename
	let imageOptions = state && state.opts && state.opts.imageOptions
	
	if (typeof imageOptions === 'undefined') { 
		imageOptions = {}
	}

	_plugins.push(require('postcss-combine-duplicated-selectors')({ removeDuplicatedProperties: true }))
	_plugins.push(require('autoprefixer'))

	return new Promise(async (resolve, reject) => {
		try {
			let result,styleId = 0
			//将sass编译后的源码进行兼容处理，去重处理，压缩处理
			result = await postcss(_plugins).process(state.styles.join(''), { from: undefined })

			if (result.css != '') {
				//获取当前的hash值
				styleId = hashString(result.css)

				//添加自定义插件处理器
				result = await postcss([
					postcssSelector({ styleId }),
					postcssImages({
						reference,
						imageOptions
					}),
					require('cssnano')
				]).process(result.css, { from: undefined })
			}
			resolve({
				css: result.css,
				styleId
			})
				
		} catch (err) { 
			reject(err)
		}	
	})
}

const combinePlugin = (_plugins,plugins) => { 
	if (plugins.length) {
		plugins.map(item => {
			if (typeof item === 'string') {
				let _require = require(item)

				if (_require.default) {
					_require = _require.default
				}

				_plugins.push(_require)

			} else if (Array.isArray(item)) {
				let _require = item[0]
				if (typeof _require === 'string') {
					_require = require(_require)

					if (_require.default) {
						_require = _require.default
					}
				}

				if (typeof item[1] != 'undefined' && Object.prototype.toString.call(item[1]) === '[object Object]') {
					_require = _require(item[1])
				}

				_plugins.push(_require)


			} else {
				_plugins.push(item)
			}
		})
	}
	return _plugins
}