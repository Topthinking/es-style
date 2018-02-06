const { resolve, join } = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
	entry: [
		'react-hot-loader/patch',
		'webpack-hot-middleware/client?path=/webpack-hmr&timeout=2000&quiet=true&reload=true&overlay=false',
		join(__dirname, '../src/index.js')
	],
	output: {
		path: resolve(__dirname, '../static'),
		publicPath:'/',
		filename:'[name].js'
	},
	module: {
		rules: [
			{
				test: /.js$/,
				loader: 'babel-loader',
				exclude: /\/node_modules\//,
				options: {
					presets: ["es2015", "react", "stage-0"]				
				}
			},
			{
				test: /.scss$/,
				loader: 'style-loader!css-loader!sass-loader',
				exclude: /\/node_modules\//,
			},
			{
				test: /.jpg$/,
				loader: 'url-loader?limit=5000',
				exclude: /\/node_modules\//,
			}
		]
	},
	plugins: [
		new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
		new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true
    })
	]
}