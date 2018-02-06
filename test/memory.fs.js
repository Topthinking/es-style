var MemoryFileSystem = require("memory-fs");
var fs = new MemoryFileSystem();
const a = fs.readFileSync("/es-style/babel/style.json","utf-8");
console.log(a)