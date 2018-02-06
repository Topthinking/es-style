const React = require('react')
const ReactDOMServer = require('react-dom/server')
const { flushToHTML } = require('../../../server')

module.exports = (res, app) => { 
	const html = ReactDOMServer.renderToStaticMarkup(React.createElement(app))
  const style = flushToHTML()

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>测试 hmr</title>
      ${style}
    </head>
    <body>
      <div id="root">${html}</div>
      <script src="/main.js" type="text/javascript"></script>
    </body>
    </html>
  `)
}