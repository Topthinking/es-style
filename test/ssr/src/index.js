import React from 'react'
import './index.scss'
import Home from './home'

export default () => (
	<div>
		<h1 className="name yoyoyo">hello world</h1>
		<Ims/>	
	</div>
)

class Ims extends React.Component { 
	render() { 
		return (
			<Home />
		)
	}
}


