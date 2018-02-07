import MemoryFileSystem from 'memory-fs'
const fs = new MemoryFileSystem()
fs.mkdirpSync('/es-style')
export default fs