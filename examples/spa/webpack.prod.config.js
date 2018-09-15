const { resolve, join } = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const EsStyleBabelPlugin = require('../../babel');
const EsStyleWebpackPlugin = require('../../src/webpack-plugin/index');

module.exports = {
  entry: {
    index: join(__dirname, './src/index.js'),
  },
  output: {
    path: resolve(__dirname, './dist'),
    publicPath: './',
    filename: '[hash:5].js',
    chunkFilename: '[chunkhash:5].js',
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /\/node_modules\//,
        options: {
          presets: ['es2015', 'react', 'stage-0'],
          plugins: [
            [
              EsStyleBabelPlugin,
              {
                fileSystem: 'file',
                publicPath: './',
                imageOptions: {
                  path: 'images/',
                  limit: 50,
                },
              },
            ],
          ],
        },
      },
    ],
  },
  plugins: [
    new EsStyleWebpackPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true,
    }),
  ],
};
