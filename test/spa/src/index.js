import React from 'react'
import ReactDOM from 'react-dom'
import App from './page'

if (process.env.NODE_ENV === 'production') {
	ReactDOM.render(
		<App />
		, document.getElementById("root")
	)
} else {
	const { AppContainer } = require('react-hot-loader')
	ReactDOM.render(
		<AppContainer>
			<App />
		</AppContainer>
		, document.getElementById("root")
	)

	if (module.hot) {
		module.hot.accept();
	}
}	
