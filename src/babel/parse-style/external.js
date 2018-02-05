import * as t from 'babel-types'

const concat = (a, b) => t.binaryExpression('+', a, b)

export const concatClassName = (path,styleId) => { 
	if(t.isJSXExpressionContainer(path.value)){
		path.value = t.JSXExpressionContainer(
			concat(t.stringLiteral(styleId + " "),path.value.expression)
		)
	}
}