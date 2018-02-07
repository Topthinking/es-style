import MemoryFileSystem from 'memory-fs'
const fs = new MemoryFileSystem()
fs.mkdirpSync('/es-style')
fs.mkdirpSync('/static')

export default fs

let params = {}

export const set = (opts = {}) => { 
	params = Object.assign(params, opts)	
}

export const get = () => params
