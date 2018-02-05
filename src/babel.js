import * as t from 'babel-types'
import postcss from 'postcss'
import sass from 'node-sass'
import path from 'path'
import requireResolve from 'require-resolve'
import { loopWhile } from 'deasync'
import _hashString from 'string-hash'

const STYLE_COMPONENT = "_ESStyle"
const hashString = str => String(_hashString(str))

export default ({ types: t }) => {
	return {
		visitor: {
			//全局import es-style
			Program(path) {
				if (path.scope.hasBinding(STYLE_COMPONENT)) {
					return
				}

				const importDeclaration = t.importDeclaration(
					[t.importDefaultSpecifier(t.identifier(STYLE_COMPONENT))],
					t.stringLiteral('es-style')
				)

				path.node.body.unshift(importDeclaration)
			},
			//检测import内容
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
			//变量创建时保存变量，主要放在className里面引用了变量
			VariableDeclaration(path, state) { 
				if (typeof state.VariableValues === 'undefined') { 
					state.VariableValues = {}
				}
				path.node.declarations.map(item=>{
					state.VariableValues[item.id.name] = item.init
				})
			},
			//变量修改时，修改变量
			ExpressionStatement(path, state) { 
				if (typeof state.VariableValues === 'undefined') { 
					state.VariableValues = {}
				}
				const expression = path.node.expression
				if(t.isAssignmentExpression(expression)){
					state.VariableValues[expression.left.name] = expression.right
				}
			},
			//生成jsx的style对象
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
						),
						t.jSXAttribute(
							t.jSXIdentifier('styleId'),
							t.jSXExpressionContainer(t.stringLiteral(hashString(css)))
						),
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
			//根据styleMap修改className，这里需要考虑多种情况
			JSXOpeningElement(path, state) {
				const el = path.node;
				const attrs = el.attributes
				if (attrs.length) {
					attrs.map(item => {
						//确认当前解析的jsx属性是className
						if (t.isJSXAttribute(item) &&
								t.isJSXIdentifier(item.name) &&
								(item.name.name === 'className' || item.name.name === 'id')
							) {							
							HandleClassNameContent(item.value, state)						
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

//判断是否import引入了需要解析的后缀
const shouldBeInlined = (path, ext) => {
	const accept = (typeof ext === 'string') ? [ext] : (ext || extensions)

	for (const extension of accept) {
		if (path.endsWith(extension)) {
			return true
		}
	}

	return false
}

//node-sass获取style
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

//postcss plugins
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

	_plugins.push(require('postcss-combine-duplicated-selectors')({removeDuplicatedProperties: true}))

	return new Promise((resolve, reject) => {
		postcss(_plugins)
			.process(state.styles.join(''), { from: undefined })
			.then(({ css }) => {
				resolve(css)
			})
	})
}

//开始处理className引用的内容,需要对value值进行判断
/**
 * 1.StringLiteral
 * 2.JSXExpressionContainer
 *   ConditionalExpression className={true ? 'name' : 'abc'} 三元引用
 * 	 Identifier className={name} 变量
 *   StringLiteral   className={"name"} 字符串
 */
const HandleClassNameContent = (attrValue, state) => { 
	if (t.isStringLiteral(attrValue)) {								
		//字符串
		replaceClassNameStringValues(attrValue, state.styleMap)

	} else if (t.isConditionalExpression(attrValue)) {
		//三元表达式
		HandleConditionalExpression(attrValue, state)

	}else if(t.isIdentifier(attrValue)){
		//变量
		const _path = state.VariableValues[attrValue.name]		
		if (_path) { 
			HandleClassNameContent(_path, state)				
		}
	} else if (t.isBinaryExpression(attrValue)) { 
		//左右判断表达式
		const left = attrValue.left
		const right = attrValue.right
		HandleClassNameContent(left, state)
		HandleClassNameContent(right, state)	
		
	} else if (t.isLogicalExpression(attrValue)) { 
		//逻辑表达式
		const left = attrValue.left
		const right = attrValue.right
		HandleClassNameContent(left, state)
		HandleClassNameContent(right, state)	

	} else if (t.isConditionalExpression(attrValue)) {
		//三元表达式
		HandleConditionalExpression(attrValue, state)
		
	} else if (t.isTemplateLiteral(attrValue)) {
		//模板
		const expressions = attrValue.expressions
		if (expressions.length) { 
			expressions.map(item => HandleClassNameContent(item, state))								
		}

		const quasis = attrValue.quasis
		if (quasis.length) { 
			quasis.map(item => { 
				if (t.isTemplateElement(item)) { 
					const value = item.value.raw.replace(/\s/g, '')
					if (value !== '') { 
						item.value.raw = item.value.cooked = replaceTplString(value, state.styleMap) + " "
					}
				}
			})
		}

	}else if (t.isJSXExpressionContainer(attrValue)) { 
		//{}引用
		const expression = attrValue.expression

		if (t.isConditionalExpression(expression)) {
			//三元表达式
			HandleConditionalExpression(expression, state)
			
		} else if (t.isIdentifier(expression)) {
			//变量
			HandleClassNameContent(expression, state)
		
		} else if (t.isStringLiteral(expression)) {
			//字符串
			HandleClassNameContent(expression, state)
			
		} else if (t.isTemplateLiteral(expression)) {
			//模板
			HandleClassNameContent(expression, state)

		}
	}
}

//执行替换className里面的值的工作
const replaceClassNameStringValues = (original, styleMap) => {
	original.value = replaceTplString(original.value, styleMap)
}

//替换操作
const replaceTplString = (value, styleMap) => value.split(" ").map(item => styleMap.hasOwnProperty(item) ? styleMap[item] : item).join(" ")

//处理三元嵌套表达式的className的映射
const HandleConditionalExpression = (expression, state) => { 
	const test = expression.test//三元第一个参数
	const consequent = expression.consequent//三元第二个参数
	const alternate = expression.alternate//三元第三个参数
	
	HandleClassNameContent(test, state)
	HandleClassNameContent(consequent, state)	
	HandleClassNameContent(alternate, state)
}