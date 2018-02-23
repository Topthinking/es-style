const React = require('react')
const ReactDOMServer = require('react-dom/server')
import Document from './document'
import flush from '../../../server'

module.exports = (res, app) => { 
  
  const _html = ReactDOMServer.renderToStaticMarkup(React.createElement(app))
  const style = flush()

  const html = ReactDOMServer.renderToString(<Document
    html={_html}
    style={style}
  />)

  res.send(`<!DOCTYPE html>${html}`)    
}