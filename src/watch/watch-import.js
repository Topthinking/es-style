import systemFs from 'fs-extra'
import requireResolve from 'require-resolve'
import path from 'path'

let importPaths = []

export const watchImport = (scss, fs, map, error) => {
	scss.map(item => { 
		const css = systemFs.readFileSync(item, 'utf-8')
		const matchs = css.match(/\@import(.*;)/g)
		if (matchs) { 
			matchs.map(match => { 
				match = match.replace(/@import|\s|'|"|;/g, '')

				if (!/\.scss|css|sass$/.test(match)) { 
					match = match + '.scss'
				}
				let noWatch = false
				//以../ 或者 ./开头的引用，即相对路径引用
				// ../style/mixin.scss
				if (/^\.+\//.test(match)) {					
					const mod = requireResolve(match, path.resolve(item))
					if (mod) {
						match = mod.src
					} else { 
						noWatch = true
						error[0] =  `无法解析文件${item}中的@import的引用，引用地址是【${match}】,请确认文件名称是否正确`
					}	
				} else { 
					//绝对路径引用
					match = path.join(process.cwd(), match)
					if (!systemFs.existsSync(match)) { 
						noWatch = true
						error[0] =  `无法解析文件${item}中的@import的引用，引用地址是【${match}】,请确认文件名称是否正确`
					}
				}

				if (!noWatch) { 					
					if (importPaths.indexOf(match) === -1) {
						map[match] = [item]
						importPaths.push(match)
					} else {
						if (map[match].indexOf(item) === -1) {
							map[match].push(item)
						}	
					}	
					watchImport([match], fs, map, error)					
				}
			})
		}
	})
}

export const clearPaths = () => importPaths = []