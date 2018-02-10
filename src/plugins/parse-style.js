import postcss from 'postcss'
import path from 'path'
import sass from 'node-sass'
import { hashString } from '../utils'

import postcssSelector from './postcss-selector'
import postcssImages from './postcss-images'

//node-sass获取style
export const content = (givenPath) => sass.renderSync({ file: givenPath }).css.toString()

//postcss plugins
export const parse = (plugins, state) => {
	const _plugins = []
	let reference = state && state.file && state.file.opts.filename
	let imageOptions = state && state.opts && state.opts.imageOptions
	
	if (typeof imageOptions === 'undefined') { 
		imageOptions = {}
	}

	_plugins.push(
		require('autoprefixer')({
			"browsers": [
				"ie >= 8",
				"iOS >= 8",
				"Firefox >= 20",
				"Android > 4.4"
			]
		})			
	)
	
	const _nextPlugins = [
		postcssImages({
			reference,
			imageOptions
		}),
		require('cssnano')({
			reduceIdents: false,
			zindex: false
		})
	]	

	return new Promise(async (resolve, reject) => {
		try {
			let result,
				globalStyle = state.styles.global.join(''),
				jsxStyle = state.styles.jsx.join(''),
				styleId = globalStyle === '' && jsxStyle === '' ? 0 : hashString(globalStyle + jsxStyle)
				
			const globalPlugins = [
				..._plugins,
				..._nextPlugins
			]
			
			const jsxPlugins = [
				..._plugins,
				postcssSelector({ styleId }),
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