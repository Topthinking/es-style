import postcss from 'postcss'
import path from 'path'
import sass from 'node-sass'
import { hashString } from '../utils'

import postcssSelector from '../plugins/postcss-selector'
import postcssImages from '../plugins/postcss-images'
import postcssSprites from '../plugins/postcss-sprites'

//通过node-sass解析并获取style字符串
export const content = (givenPath) => sass.renderSync({ file: givenPath }).css.toString()

//处理雪碧图
const handleStyleSprites = (styles) => { 
	return new Promise(async (resolve, reject) => {
		const style = []
		if (styles.length) {
			styles.map(async (item, index) => {
				const { css } = await postcss([postcssSprites({
					spritePath: '.es-style'
				})]).process(item.css, { from: item.from })
				style.push(css)				
				if (index === styles.length - 1) {
					resolve(style.join(''))
				}
			})
		} else { 
			resolve(style.join(''))
		}
	})
}

//将css字符串经过postcss插件进行二次操作
export const parse = (plugins, state) => {
	const _plugins = []
	let reference = state && state.file && state.file.opts.filename
	let imageOptions = state && state.opts && state.opts.imageOptions
	const write = state && state.opts && state.opts.write || true

	if (typeof imageOptions === 'undefined') { 
		imageOptions = {}
	}

	_plugins.push(
		require('autoprefixer')({
			"browsers": "last 4 version"
		})			
	)
	
	const _nextPlugins = [		
		postcssImages({
			reference,
			imageOptions,
			write
		}),
		require('cssnano')({
			autoprefixer: false,
			reduceIdents: false,
			zindex: false,
			minifyGradients: false
		})
	]		

	return new Promise(async (resolve, reject) => {
		try {
			let globalStyle = await handleStyleSprites(state.styles.global),
					jsxStyle = await handleStyleSprites(state.styles.jsx),
					styleId = globalStyle === '' && jsxStyle === '' ? 0 : hashString(globalStyle + jsxStyle)
				
			const globalPlugins = [
				..._plugins,
				..._nextPlugins
			]
			
			const jsxPlugins = [
				..._plugins,
				postcssSelector({ styleId, styleType: state.styleType }),
				..._nextPlugins
			]
		
			if (globalStyle != '') {
				globalStyle = await postcss(globalPlugins).process(globalStyle, { from: undefined })
			}

			if (jsxStyle != '') {
				jsxStyle = await postcss(jsxPlugins).process(jsxStyle, { from: undefined })
			}	
			resolve({
				global: globalStyle !== '' ? globalStyle.css : '',
				jsx: jsxStyle !== '' ? jsxStyle.css : '',
				styleId
			})
				
		} catch (err) { 
			reject(err)
		}	
	})
}