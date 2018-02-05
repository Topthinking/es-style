import * as postcss from 'postcss'
import { 
	STYLE_DATA_ES
} from '../utils/constant'

export default postcss.plugin('postcss-selector', (options = {}) => {
		// Work with options here
	return function(root) {
        // Transform CSS AST here
        root.walkRules(rule => {             
					rule.selector = rule.selector + `[${STYLE_DATA_ES}="${options.styleId}"]`					
					// Transform each rule here
					rule.walkDecls(decl => {
							// Transform each property declaration here
							//decl.prop = decl.prop.split('').reverse().join('');
					});
				
					rule.walkRules(rule => {
						rule.walkDecls(decl => {
							// Transform each property declaration here
							//decl.prop = decl.prop.split('').reverse().join('');
						});
					})
      });
    };
});
