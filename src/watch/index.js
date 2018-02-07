import memoryFs from './fs'
import fs from 'fs'
import chokidar from 'chokidar'

export default () => { 
  if (memoryFs.existsSync("/es-style/watch.json")) {
    let map = memoryFs.readFileSync("/es-style/watch.json", "utf-8")
    map = JSON.parse(map)
    const keys = Object.keys(map)
    if (keys.length) {
      chokidar.watch(keys, { ignored: /node_modules/ }).on('all', (event, path) => {
        if (event === 'change') {
          const _path = map[path]
          _path.map(item => fs.utimes(item, new Date(), new Date(), () => { }))
        }
      })
    }
  }  
}
