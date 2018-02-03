import React from 'react'
import ReactDOM from 'react-dom'
import './index.scss'
import Home from './home'

let yoname = 'name'

yoname = 'yoyoyo'

let cname = true ? 'name' : 'yoyoyo'

let newName = 'yoyoyo'

const App = () => (
	<div>
		<h1 className={`name ${true ? newName : 'name'}`}>hello world {cname}</h1>
		<Ims className={true ? cname : ( true ? yoname : cname)} />	
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
