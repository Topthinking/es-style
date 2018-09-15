const { resolve, join } = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const EsStyleBabelPlugin = require('../../../babel');
const EsStyleWebpackPlugin = require('../../../src/webpack-plugin/index.js');

module.exports = {
  entry: [
    'react-hot-loader/patch',
    'webpack-hot-middleware/client?path=/webpack-hmr&timeout=2000&quiet=true&reload=true&overlay=false',
    join(__dirname, '../src/index.js'),
  ],
  output: {
    path: resolve(__dirname, '../dist'),
    publicPath: '/',
    filename: '[name].js',
  },
  mode: 'none',
  module: {
    rules: [
      {
        test: /\.bundle\.js$/,
        loader: 'bundle-loader',
      },
      {
        test: /.js$/,
        loader: 'babel-loader',
        exclude: /\/node_modules\//,
        options: {
          presets: ['es2015', 'react', 'stage-0'],
          plugins: [
            EsStyleBabelPlugin,
            [
              require.resolve('babel-plugin-module-resolver'),
              {
                alias: {
                  'es-style': require.resolve('../../../'),
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
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: join(__dirname, '../index.html'),
      inject: true,
    }),
  ],
};
