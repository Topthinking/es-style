const express = require('express')
const { join } = require('path')
const app = express()

app.use(express.static(join(__dirname,'./dist')))

app.use((req, res) => { 
	res.send(`
		<div id="root"></div>
		<script src=https://unpkg.com/stylis@latest/stylis.min.js></script>
		<script src="/main.js" type="text/javascript"></script>
	`)
})

app.listen(3000, () => { 
	console.log(`> http://localhost:3000`)
})
