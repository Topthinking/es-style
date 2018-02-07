const { resolve, join } = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
	entry: join(__dirname, './src/index.js'),
	output: {
		path: resolve(__dirname, './dist'),
		publicPath:'./',
		filename:'[name].js'
	},
	module: {
		rules: [
			{
				test: /.js$/,
				loader: 'babel-loader',
				exclude: /\/node_modules\//,
				options: {
					presets: ["es2015", "react", "stage-0"],
					plugins: [
						[							
							require('../../babel').default,{
								"imageOptions": {
									'path': resolve(__dirname, './dist'),
									'publicPath':'./',
									'dir':'images/',
									'limit': 5000
								}
							}
						],
						[
							require.resolve('babel-plugin-module-resolver'),
							{
									alias: {
										'es-style': require.resolve('../../')									
									}
							}
						]
					]
				}
			}
		]
	},
	plugins: [
		new webpack.NoEmitOnErrorsPlugin(),
    new webpack.optimize.UglifyJsPlugin({
			compress: {
				warnings: false
			},
			beautify:false,
			comments:false
		}),
		new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true
    })
	]
}