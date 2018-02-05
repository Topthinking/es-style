import { loopWhile } from 'deasync'
import { content, parse } from './parse-style'
import { isObject, shouldBeParse, hashString } from '../utils'

import { 
	STYLE_COMPONENT,
	STYLE_DATA_ES,
	STYLE_COMPONENT_CSS,
	STYLE_COMPONENT_STYLEID
} from '../utils/constant'

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
			//检测import内容,同时通过sass获取style内容
			ImportDeclaration(path, state) {
				let givenPath = path.node.source.value
				let reference = state && state.file && state.file.opts.filename
				let extensions = state && state.opts && state.opts.extensions
				let sassOptions = state && state.opts && state.opts.sassOptions

				if (typeof state.styles === 'undefined') {
					state.styles = []
					state.styleMap = {}
				}

				//全局的引用 './common.scss!'	
				let globalStyle = false
				if (/!$/.test(givenPath)) { 
					globalStyle = true
					givenPath = givenPath.replace(/!$/,'')
				}

				if (shouldBeParse(givenPath, extensions)) {
					if (path.node.specifiers.length > 1) {
						throw new Error(`Destructuring inlined import is not allowed. Check the import statement for '${givenPath}'`);
					}

					if (!isObject(sassOptions)) { 
						sassOptions = {}
					}

					const css = content(givenPath, reference, sassOptions)
					state.styles.push(css)
					path.remove()
				}
			},			
			//生成jsx的style对象，同时这里会转译样式资源
			JSXElement(path, state) {
				if (state.hasJSXStyle) {
					return
				}
				let plugins = state && state.opts && state.opts.plugins
				if (typeof plugins === 'undefined') {
					plugins = []
				}
				let css,styleId
				let wait = true
				parse(plugins, state).then(result => {
					css = result.css
					styleId = result.styleId
					wait = false
				}).catch(err => {
					css = err
				})

				if (css instanceof Error) {
					throw css
				}

				loopWhile(() => wait)
				state.hasJSXStyle = true
				state.styleId = styleId

				if (state.styles.length) {
					const attributes = [
						t.jSXAttribute(
							t.jSXIdentifier(STYLE_COMPONENT_CSS),
							t.jSXExpressionContainer(t.stringLiteral(css))
						),
						t.jSXAttribute(
							t.jSXIdentifier(STYLE_COMPONENT_STYLEID),
							t.jSXExpressionContainer(t.stringLiteral(styleId))
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
				//拿到当前的JSX对象的访问路径
        const el = path.node;
				const attrs = el.attributes
				const styleId = state.styleId

				let isExist = false
        //获取对象属性
        if(attrs.length){
          attrs.map(item=>{
              if(item.name.name === STYLE_DATA_ES){
								//直接修改属性
								item.value = t.StringLiteral(styleId)	
								isExist = true
              }
          })
				}

				if (!isExist) { 
					path.node.attributes.push(t.JSXAttribute(
						t.JSXIdentifier(STYLE_DATA_ES),
						t.StringLiteral(styleId)
					)) 
				}
			}
		}
	}
}

