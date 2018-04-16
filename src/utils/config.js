import findUp from 'find-up'
import fs from 'fs-extra'

const cache = new Map()

const defaultConfig = {
	plugins: [],
	imageLimit: null
}

export default ({
	dir = process.cwd(),
	refresh = false
} = {}) => {	
  //强制刷新获取最新的配置信息，一般是开发环境使用
  if (refresh) {
    return loadConfig(dir,refresh)
  }

	if (!cache.has(dir)) {
    cache.set(dir, loadConfig(dir,refresh))
  }
  return cache.get(dir)
}

const loadConfig = (dir,refresh) => {
  const path = findUp.sync('.es-style', {
    cwd: dir
  })

  let userConfig = {}

  if (path && path.length) {
		userConfig = JSON.parse(fs.readFileSync(path, 'utf-8'))
  }

  return withDefaults(userConfig)
}

const withDefaults = (config) => {
  return Object.assign({}, defaultConfig, config)
}
