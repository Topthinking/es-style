import { loopWhile } from 'deasync'
import * as t from 'babel-types'
import { resolve } from 'path'
import requireResolve from 'require-resolve'
import { isObject, shouldBeParseStyle, shouldBeParseImage, hashString } from '../utils'
import parseImage from "../utils/parse-image"
import fs from '../watch/fs'
import { content, parse } from '../plugins/parse-style'

import { 
	STYLE_COMPONENT,
	STYLE_DATA_ES,
	STYLE_COMPONENT_CSS,
	STYLE_COMPONENT_STYLEID
} from '../utils/constant'

const concat = (a, b) => t.binaryExpression('+', a, b)

export default ({ types: t }) => {
	return {
		visitor: {
			//全局import es-style
			Program: {
				enter(path, state) {
					//插入import ‘es-style‘
					if (path.scope.hasBinding(STYLE_COMPONENT)) {
						return
					}

					path.node.body.unshift(t.importDeclaration(
						[t.importDefaultSpecifier(t.identifier(STYLE_COMPONENT))],
						t.stringLiteral('es-style')
					))
					
					path.traverse({
						JSXOpeningElement(path) {
							if (path.node.name.name === 'es-style' || path.node.name.name === 'es.style') { 
								state.hasEsStyleElement = true								
							}
						}
					})
					
				},
				exit(path, state) {
					//写信息到内存文件中
					let map = state.styleSourceMap
					if (fs.existsSync('/es-style/watch.json')) {
						map = fs.readFileSync('/es-style/watch.json', 'utf-8')
						map = JSON.parse(map)
						map = Object.assign(map, state.styleSourceMap)
					}
					fs.writeFileSync('/es-style/watch.json', JSON.stringify(map))
				}
			},
			//检测import内容,同时通过sass获取style内容
			ImportDeclaration(path, state) {
				let givenPath = path.node.source.value
				let reference = state && state.file && state.file.opts.filename
				let imageOptions = state && state.opts && state.opts.imageOptions
				let type = state && state.opts && state.opts.type	
				
				state.styleType = 'class'
				if (['class', 'attribute'].indexOf(type) !== -1) { 
					state.styleType = type
				}

				if (typeof state.styles === 'undefined') {
					state.styles = {
						global: [],
						jsx: []
					}
				}
				
				if (typeof state.styleSourceMap === 'undefined') {
					state.styleSourceMap = {}
				}

				//全局的引用 './common.scss!'	
				let globalStyle = false
				if (/!$/.test(givenPath)) {
					globalStyle = true
					givenPath = givenPath.replace(/!$/, '')
				}

				//引用样式
				if (shouldBeParseStyle(givenPath)) {
					path.node.specifiers = []

					const mod = requireResolve(givenPath, resolve(reference))

					if (!mod || !mod.src) {
						throw new Error(`Path '${givenPath}' could not be found for '${reference}'`);
					}

					givenPath = mod.src

					if (typeof state.styleSourceMap[givenPath] === 'undefined') {
						state.styleSourceMap[givenPath] = [reference]
					} else {
						if (state.styleSourceMap[givenPath].indexOf(reference) !== -1) {
							state.styleSourceMap[givenPath].push(reference)
						}
					}

					const css = content(givenPath, reference)
					if (globalStyle) {
						state.styles.global.push(css)
					} else {
						state.styles.jsx.push(css)
					}
					path.remove()
				}

				//引用图片
				if (shouldBeParseImage(givenPath)) {
					if (path.node.specifiers.length === 1 && t.isImportDefaultSpecifier(path.node.specifiers[0])) {
						
						if (typeof imageOptions === 'undefined') {
							imageOptions = {}
						}
						
						const id = path.node.specifiers[0].local.name
						const content = parseImage(givenPath, reference, imageOptions)
						const variable = t.variableDeclarator(t.identifier(id), t.stringLiteral(content))
						
						path.replaceWith({
							type: 'VariableDeclaration',
							kind: 'const',
							declarations: [variable],
							leadingComments: [
								{
									type: 'CommentBlock',
									value: `es-style '${givenPath}' `
								}
							]
						})
					}
				}
			},
			//生成jsx的style对象，同时插入转译的样式资源
			JSXElement(path, state) {				
				if (!state.hasParseStyle) {
					let plugins = state && state.opts && state.opts.plugins
					if (typeof plugins === 'undefined') {
						plugins = []
					}
					let css, styleId
					let wait = true
					parse(plugins, state).then(result => {
						css = result.global + result.jsx
						styleId = result.styleId
						wait = false
					}).catch(err => {
						css = err
					})

					if (css instanceof Error) {
						throw css
					}

					loopWhile(() => wait)

					state.hasParseStyle = true
					state.styleId = styleId
					state.css = css
				}

				//JSXElement是一个对象
				if (t.isJSXMemberExpression(path.node.openingElement.name)) { 
					return
				}

				const name = path.node.openingElement.name.name
				
				if (
					name &&
					name !== STYLE_COMPONENT && 
					name.charAt(0) !== name.charAt(0).toUpperCase() &&
					name !== 'style'
				) {					
					if (name === 'es-style' || name === 'es.style') {
						if (state.hasEsStyle) {
							path.remove()
							return
						}	
						//存在es-style标签，则替换标签
						if (state.hasEsStyleElement) {
							state.hasEsStyle = true
							if ((state.styles.global.length || state.styles.jsx.length) && state.css !== '') {
								const attributes = [
									t.jSXAttribute(
										t.jSXIdentifier(STYLE_COMPONENT_CSS),
										t.jSXExpressionContainer(t.stringLiteral(state.css))
									)
								]

								if (state.styleId !== 0) {
									attributes.push(
										t.jSXAttribute(
											t.jSXIdentifier(STYLE_COMPONENT_STYLEID),
											t.jSXExpressionContainer(t.stringLiteral(state.styleId))
										)
									)
								}

								path.replaceWith(
									t.jSXElement(
										t.jSXOpeningElement(t.jSXIdentifier(STYLE_COMPONENT), attributes, true),
										null,
										[]
									)
								)
							}
						}	
					} else {
						if (state.hasJsxStyle) {
							return
						}
						
						//不存在es-style标签，就添加元素
						if (!state.hasEsStyleElement) {
							state.hasJsxStyle = true
		
							if ((state.styles.global.length || state.styles.jsx.length) && state.css !== '') {
								const attributes = [
									t.jSXAttribute(
										t.jSXIdentifier(STYLE_COMPONENT_CSS),
										t.jSXExpressionContainer(t.stringLiteral(state.css))
									)
								]
		
								if (state.styleId !== 0) {
									attributes.push(
										t.jSXAttribute(
											t.jSXIdentifier(STYLE_COMPONENT_STYLEID),
											t.jSXExpressionContainer(t.stringLiteral(state.styleId))
										)
									)
								}

								state.stylePath = t.jSXElement(
									t.jSXOpeningElement(t.jSXIdentifier(STYLE_COMPONENT), attributes, true),
									null,
									[]
								)
		
								path.node.children.push(state.stylePath)
							}
						}	
					}
				}
			},
			JSXOpeningElement(path, state) {

				//拿到当前的JSX对象的访问路径
				const el = path.node;
				const attrs = el.attributes
				const styleId = state.styleId
				let hasClassName = false

				if (attrs.length) {					
					attrs.map(item => { 
						if (item.name.name === 'className') { 
							hasClassName = true
						}
					})
				}


				//JSXElement是一个对象
				if (t.isJSXMemberExpression(path.node.name) && !hasClassName) { 
					return
				}

				if (path.node.name.name.charAt(0) == path.node.name.name.charAt(0).toUpperCase() && !hasClassName) { 
					return 
				}			

				if (state.styleType === 'class') {
					let isExist = false
					//获取对象属性,添加className
					if (attrs.length) {
						attrs.map(item => {
							if (
								t.isJSXAttribute(item) &&
								t.isJSXIdentifier(item.name) &&
								item.name.name === 'className' &&
								styleId !== 0
							) {
								//值为{}
								if (t.isJSXExpressionContainer(item.value)) {
									item.value = t.JSXExpressionContainer(
										concat(t.StringLiteral(STYLE_DATA_ES + '-' + styleId + ' '), item.value.expression)
									)
								}

								//值是字符串
								if (t.isStringLiteral(item.value)) {
									item.value = t.JSXExpressionContainer(
										concat(t.StringLiteral(STYLE_DATA_ES + '-' + styleId + ' '), item.value)
									)
								}
							
								isExist = true
							}
						})
					}

					if (!isExist && styleId !== 0) {
						path.node.attributes.push(t.JSXAttribute(
							t.JSXIdentifier('className'),
							t.StringLiteral(STYLE_DATA_ES + '-' + styleId)
						))
					}
				} else {
					if (styleId !== 0) {
						path.node.attributes.push(t.JSXAttribute(
							t.JSXIdentifier(`data-${STYLE_DATA_ES}-${styleId}`),
							t.StringLiteral('')
						))
					}
				}	
			}
		}
	}
}

