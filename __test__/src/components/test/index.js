import React from 'react'
import AddTodo from './todo'

export default class App extends React.Component { 
	render() { 
		const { params } = this.props
		return (
			<section className="todoapp">
				<div className="main">
					<AddTodo {...this.props}/>
				</div>	
			</section>
		)
	}
}

