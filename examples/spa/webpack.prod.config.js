const { resolve, join } = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const EsStyleBabelPlugin = require('../../babel');
const EsStyleWebpackPlugin = require('../../src/webpack-plugin/index');

module.exports = {
  entry: join(__dirname, './src/index.js'),
  output: {
    path: resolve(__dirname, './dist'),
    publicPath: './',
    filename: '[name].js',
    chunkFilename: '[chunkhash:5].js',
  },
  optimization: {
    runtimeChunk: {
      name: 'manifest',
    },
  },
  mode: 'none',
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
    new ManifestPlugin(),
    new EsStyleWebpackPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true,
    }),
  ],
  resolveLoader: {
    modules: ['node_modules', join(__dirname, 'loaders')],
  },
};
