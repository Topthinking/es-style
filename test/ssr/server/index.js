const path = require('path')
const express = require('express')
const webpack = require('webpack')
const webpackWeb = require('./webpack.web')
const webpackNode = require('./webpack.node')
const render = require('./render')
import watch from '../../../watch'

function clearConsole() {
  process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H');
}

const port = 8080
const app = express()
const compiler = watch(webpack(webpackWeb),app)

const _compiler = webpack(webpackNode)
_compiler.run(() => { })

_compiler.watch({
  aggregateTimeout: 20
},() => { })

_compiler.plugin('invalid', () => {
  if (process.stdout.isTTY) {
    clearConsole();
  }
  console.log('Compiling...')
})


_compiler.plugin('done', () => {
  if (process.stdout.isTTY) {
    clearConsole();
  }
  console.log('Compiled successfully!')
})


const devMiddleware = require('webpack-dev-middleware')((compiler), {
  publicPath: webpackWeb.output.publicPath,
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

app.use(require('connect-history-api-fallback')())
app.use(devMiddleware)
app.use(hotMiddleware)

app.use((req, res) => { 
  const RootPageEntry = path.join(process.cwd(), 'dist/src')
  const data = require(RootPageEntry).default
  delete require.cache[require.resolve(RootPageEntry)]
  render(res,data)
})

console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {  
  console.log('> Listening at ' + 'http://localhost:' + port + '\n')
})

app.listen(port)
