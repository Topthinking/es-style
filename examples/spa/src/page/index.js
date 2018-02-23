import React from 'react'
import Home from './home'

import bg from '../../images/1.jpg'
import './index.scss'

export default () => (
	<section>
			<h1 className="name bg">hello Index</h1>
			<img src={bg}/>
			<Ims/>	
	</section>	
)

class Ims extends React.Component { 
	render() { 
		return (
			<Home />
		)
	}
}
