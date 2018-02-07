import React from 'react'

export default (props) => (
	<html>
		<head>
			<title>测试 hmr</title>
			{props.style}			
    </head>
    <body>
			<div id="root" dangerouslySetInnerHTML={{ __html: props.html }} />			
      <script src="/main.js" type="text/javascript"></script>
    </body>
	</html>
)