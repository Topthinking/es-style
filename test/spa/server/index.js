const path = require('path')
const express = require('express')
const webpack = require('webpack')
const MemoryFileSystem = require('memory-fs');
const webpackConfig = require('./webpack.dev.config')
const watch = require('../../../watch')

const port = 3000
const app = express()
const compiler = watch(webpack(webpackConfig), app)

function clearConsole() {
  process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H');
}

const devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  logLevel: 'error'
})

const hotMiddleware = require('webpack-hot-middleware')(compiler, {
  path: '/webpack-hmr',
  log: false,
  heartbeat: 2500
})

compiler.plugin('compilation', function (compilation) {
  compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
    hotMiddleware.publish({ action: 'reload' })
    cb()
  })
})

compiler.plugin('invalid', () => {
  if (process.stdout.isTTY) {
    clearConsole();
  }
  console.log('Compiling...')
})


compiler.plugin('done', () => {
  if (process.stdout.isTTY) {
    clearConsole();
  }    
  console.log('Compiled successfully!')
})

app.use(require('connect-history-api-fallback')())
app.use(devMiddleware)
app.use(hotMiddleware)

console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {
    console.log('> Listening at ' + 'http://localhost:' + port + '\n')
})

app.listen(port)
