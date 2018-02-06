// npm publish
const path = require('path')
const del = require('del')
const child_process = require('child_process');

const clean = async () => {
	await del(path.join(__dirname, 'publish'), { force: true })
}


const copy = async (from, to) => {
	await child_process.spawn('cp', ['-r', from, to])
}

const main = async () => {
	await clean()
	await child_process.spawn('mkdir', ['publish'])
	await copy('./dist', './publish/dist')

	await copy('./babel.js', './publish')
	await copy('./watch.js', './publish')
	await copy('./server.js', './publish')
	await copy('./index.js', './publish')

	await copy('./README.md', './publish')
	await copy('./License', './publish')
	await copy('./package.json', './publish')
}

module.exports = main()
