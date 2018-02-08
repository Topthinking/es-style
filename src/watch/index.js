import memoryFs, { set } from './fs'
import systemFs from 'fs'
import chokidar from 'chokidar'

const watch = () => {     
  if (memoryFs.existsSync("/es-style/watch.json")) {
    let map = memoryFs.readFileSync("/es-style/watch.json", "utf-8")  
    map = JSON.parse(map)
    const keys = Object.keys(map)
    if (keys.length) {
      chokidar.watch(keys, { ignored: /node_modules/ }).on('all', (event, path) => {        
        if (event === 'change') {
          const _path = map[path]
          _path.map(item => systemFs.utimes(item, new Date(), new Date(), () => { }))
        }
      })
    }
  }
}

let isWatch = false

module.exports = (compiler, app = null) => {

  if (isWatch) return 
  
  isWatch = true

  const { path, publicPath } = compiler.options.output
  set({ path, publicPath })  

  if (app != null && typeof app.use != 'undefined') {
    app.use((req, res, next) => {      
      if (/^\/static\//.test(req.url)) {
        if (memoryFs.existsSync(req.url)) {
          res.status(200).attachment(req.url).send(memoryFs.readFileSync(req.url))
          return 
        }
      }
      next()
    })
  }  

  compiler.plugin('done', () => {    
    watch()
  })

  return compiler
}
