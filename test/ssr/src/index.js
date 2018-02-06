import React from 'react'
import './common.scss!'
import './index.scss!'

import bg from '../images/1.jpg'

export default class App extends React.Component {
	
	state = {
		name: 'hello world'
	}

	change = () => { 
		this.setState({
			name:Math.random()
		})
	}

	render() {
		return (
			<section>
				<h1 onClick={this.change}>{this.state.name}</h1>
				<img src={bg} />
				<a>123</a>
			</section>
		)	
	}
}
