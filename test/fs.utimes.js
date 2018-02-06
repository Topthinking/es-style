const fs = require("fs")
const path = require('path')
fs.utimes(path.join(__dirname,'./ssr/src/index.js'), new Date(), new Date(), function (err) {
	if(err){
		console.log("修改时间失败")
		throw err;
	}
})