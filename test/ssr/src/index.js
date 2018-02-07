import React from 'react'
import './common.scss!'
import './index.scss'

import bg from '../images/1.jpg'

const A = () => (
	<B />
)

const B = () => (
	<span className="name">hello world</span>
)

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
				<A />
				<B />
				<h1 onClick={this.change}>{this.state.name}</h1>
				<img src={bg} className="name"/>
				<a className={true ? 'name' : 's'}>123</a>
			</section>
		)	
	}
}


