import React from 'react'
import ReactDOM from 'react-dom'
import './index.scss'
import Home from './home'

const App = () => (
	<div>
		<h1 className="name yoyoyo">hello world</h1>
		<Ims className="myName" />	
	</div>
)

class Ims extends React.Component { 
	render() { 
		return (
			<Home />
		)
	}
}

ReactDOM.render(
	<App />	
	,document.getElementById("root")
)
