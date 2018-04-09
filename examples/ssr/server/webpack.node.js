const { resolve, join } = require('path')

module.exports = {
	entry: join(__dirname,'../src/index.js'),
	output: {
		path: resolve(__dirname, '../dist'),
		filename:'[name].js'
	},
	module: {
		rules: [
			{
				test: /.js$/,
				loader: 'emit-file-loader',
				exclude: /\/node_modules\//,
				include:[process.cwd()],
				options: {
					name:'[path][name].[ext]'
				}
			},
			{
				test: /.js$/,
				loader: 'babel-loader',
				exclude: /\/node_modules\//,
				options: {
					presets: ["es2015", "react", "stage-0"],
					plugins: [
						[							
							require('../../../babel').default, {
								"position": "external",							
								"imageOptions": {
									'publicPath': '/',
									'dir':'images',
									'limit': 50
								}
							}
						],
						[
							require.resolve('babel-plugin-module-resolver'),
							{
									alias: {
										'es-style': require.resolve('../../../'),
										'es-style/server': require.resolve('../../../server')										
									}
							}
						]
					]
				}
			}			
		]
	},
	resolveLoader: {
		modules: [
			'node_modules',
			join(__dirname, 'loaders')
		]
	}
}