process.env.NODE_ENV = 'production';

const webpack = require('webpack');
const config = require('./webpack.prod.config');

const compiler = webpack(config);

compiler.hooks.invalid.tap('invalid', () => {
  if (process.stdout.isTTY) {
    clearConsole();
  }
  console.log('Compiling...');
});

compiler.hooks.done.tap('done', () => {
  if (process.stdout.isTTY) {
    clearConsole();
  }
  console.log('Compiled successfully!');
});

compiler.run();
