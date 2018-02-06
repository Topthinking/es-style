const del = require('del')
const { resolve } = require('path')

del(resolve(__dirname, './dist'), { force: true })
del(resolve(__dirname, './static'), { force: true })
