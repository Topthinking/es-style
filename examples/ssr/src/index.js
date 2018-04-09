import React from 'react'
import { Helmet } from "react-helmet"
import './common.scss!'
import './index.scss'

import bg from '../images/1.jpg'
import Home from '../components/home'
import svg from './a.svg'

import bgSvg from '../images/1.svg'

const A = () => (
	<B />
)

const B = () => (
	<span className="name">hello world
		<Helmet>
			<title>My Title123</title>
		</Helmet>
	</span>
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
			<section className="section" data-v>			
				<Helmet>
					<meta charSet="utf-8" />
					<title>My Title</title>
				</Helmet>
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
				<a className={`${true ? 'name' : 's'} box`}>123</a>				
				<es-style />
				<Home className="hello"/>
			</section>
		)	
	}
}


