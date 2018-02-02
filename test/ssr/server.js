const express = require('express')
const { join } = require('path')
const React = require('react')
const { renderToStaticMarkup, renderToString } = require('react-dom/server')
const { flushToHTML } = require('es-style/server')
const app = express()
const App = require('./dist/src').default

app.use(express.static(join(__dirname,'./dist')))

app.use((req, res) => { 
	const html = renderToStaticMarkup(React.createElement(App))
	const style = flushToHTML()
	res.send(`
		<head>${style}</head>
		<div id="root">
			${html}
		</div>
	`)
})

app.listen(3000, () => { 
	console.log(`> http://localhost:3000`)
})
