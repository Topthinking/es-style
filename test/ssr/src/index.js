import React from 'react'
import './common.scss!'
import './index.scss'

import bg from '../images/1.jpg'

import svg from './a.svg'

import bgSvg from '../images/1.svg'

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
		const icon = 'web_album_ic_lock'
		return (
			<section>
				<A />
				<B />
				<div className='svgIcon'>
					<svg className={`icon icon-${icon}`} height={'14'} width={'14'}>
						<use xlinkHref={`${svg}#icon-${icon}`} />
					</svg>
				</div>
				<svg className={`icon icon-${icon}`} height={'214'} width={'214'}>
					<use xlinkHref={`${svg}#icon-${icon}`} />
					</svg>
				<img src={bgSvg}/>
				<h1 onClick={this.change}>{this.state.name}</h1>
				<img src={bg} className="name"/>
				<a className={true ? 'name' : 's'}>123</a>
			</section>
		)	
	}
}


