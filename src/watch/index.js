import esFs from './fs'
import fs from 'fs'
import chokidar from 'chokidar'

export default () => { 
	let map = esFs.readFileSync("/es-style/babel/style.json", "utf-8");
  map = JSON.parse(map)
  const keys = Object.keys(map)
  if (keys.length) {
    chokidar.watch(keys,{ ignored: /node_modules/ }).on('all', (event, path) => {
      if (event === 'change') { 
        const _path = map[path]
        _path.map(item => fs.utimes(item, new Date(), new Date(), () => { }))                
      }
    })
  }
}
