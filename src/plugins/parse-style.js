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

	_plugins.push(require('postcss-combine-duplicated-selectors')({ removeDuplicatedProperties: true }))
	_plugins.push(require('autoprefixer'))

	return new Promise(async (resolve, reject) => {
		try {
			let result,
				globalStyle = state.styles.global.join(''),
				jsxStyle = state.styles.jsx.join(''),
				styleId = globalStyle === '' && jsxStyle === '' ? 0 : hashString(globalStyle + jsxStyle)				

			if (globalStyle != '') {
				globalStyle = await postcss(_plugins).process(globalStyle, { from: undefined })

				if (globalStyle.css != '') {
					globalStyle = await postcss([
						postcssImages({
							reference,
							imageOptions
						}),
						require('cssnano')
					]).process(globalStyle.css, { from: undefined })
				}
			}

			if (jsxStyle != '') {
				jsxStyle = await postcss(_plugins).process(jsxStyle, { from: undefined })

				if (jsxStyle.css != '') {
					jsxStyle = await postcss([
						postcssSelector({ styleId }),
						postcssImages({
							reference,
							imageOptions
						}),
						require('cssnano')
					]).process(jsxStyle.css, { from: undefined })
				}
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