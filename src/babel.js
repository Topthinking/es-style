import postcss from 'postcss'
import sass from 'node-sass'
import path from 'path'
import requireResolve from 'require-resolve'
import { loopWhile } from 'deasync'

import { STYLE_COMPONENT } from './constants'

export default ({ types: t }) => {
	return {
		visitor: {
			Program(path) {
				if (path.scope.hasBinding(STYLE_COMPONENT)) {
					return
				}

				const importDeclaration = t.importDeclaration(
					[t.importDefaultSpecifier(t.identifier(STYLE_COMPONENT))],
					t.stringLiteral('styled-jsx/style')
				)

				path.node.body.unshift(importDeclaration)
			},
			ImportDeclaration(path, state) {
				let givenPath = path.node.source.value
				let reference = state && state.file && state.file.opts.filename
				let extensions = state && state.opts && state.opts.extensions
				let sassOptions = state && state.opts && state.opts.sassOptions

				if (typeof state.styles === 'undefined') {
					state.styles = []
					state.styleMap = {}
				}

				if (shouldBeInlined(givenPath, extensions)) {
					if (path.node.specifiers.length > 1) {
						throw new Error(`Destructuring inlined import is not allowed. Check the import statement for '${givenPath}'`);
					}

					if (typeof sassOptions === 'undefined' || Object.prototype.toString.call(sassOptions) !== '[object Object]') {
						sassOptions = {}
					}

					const css = getContents(givenPath, reference, sassOptions)
					state.styles.push(css)
					path.remove()
				}


			},
			JSXElement(path, state) {
				if (state.hasJSXStyle) {
					return
				}
				let plugins = state && state.opts && state.opts.plugins
				if (typeof plugins === 'undefined') {
					plugins = []
				}
				let css
				let wait = true
				postcssHandle(plugins, state).then(result => {
					css = result
					wait = false
				})
					.catch(err => {
						css = err
					})

				if (css instanceof Error) {
					throw css
				}

				loopWhile(() => wait)
				state.hasJSXStyle = true

				if (state.styles.length) {
					const attributes = [
						t.jSXAttribute(
							t.jSXIdentifier('css'),
							t.jSXExpressionContainer(t.stringLiteral(css))
						)
					]
					path.node.children.push(
						t.jSXElement(
							t.jSXOpeningElement(t.jSXIdentifier(STYLE_COMPONENT), attributes, true),
							null,
							[]
						)
					)
				}
			},
			JSXOpeningElement(path, state) {
				const el = path.node;
				const attrs = el.attributes
				if (attrs.length) {
					attrs.map(item => {
						if (item.name.name === 'className') {
							//直接修改属性
							item.value.value = item.value.value.split(" ").map(item => state.styleMap.hasOwnProperty(item) ? state.styleMap[item] : item).join(" ")
						}
					})
				}
			}
		}
	}
}

const extensions = [
	'.raw',
	'.text',
	'.graphql',
]

const shouldBeInlined = (path, ext) => {
	const accept = (typeof ext === 'string') ? [ext] : (ext || extensions)

	for (const extension of accept) {
		if (path.endsWith(extension)) {
			return true
		}
	}

	return false
}

const getContents = (givenPath, reference, sassOptions) => {
	if (!reference) {
		throw new Error('"reference" argument must be specified');
	}

	const mod = requireResolve(givenPath, path.resolve(reference))

	if (!mod || !mod.src) {
		throw new Error(`Path '${givenPath}' could not be found for '${reference}'`);
	}

	return sass.renderSync({
		file: mod.src,
		...sassOptions
	}).css.toString()

}

const postcssHandle = (plugins, state) => {
	const _plugins = []
	const getJSON = (cssFileName, json, outputFileName) => {
		state.styleMap = Object.assign(state.styleMap, json)
	}

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
					if (item[1].hasOwnProperty('awardCssModules')) {
						delete item[1].awardCssModules
						item[1].getJSON = getJSON
					}
					_require = _require(item[1])
				}

				_plugins.push(_require)


			} else {
				_plugins.push(item)
			}
		})
	}

	return new Promise((resolve, reject) => {
		postcss(_plugins)
			.process(state.styles.join(''), { from: undefined })
			.then(({ css }) => {
				resolve(css)
			})
	})
}
