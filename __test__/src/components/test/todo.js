import React, { Component, PropTypes } from 'react'

export default class AddTodoView extends Component {

	state = {
		text:''
	}

  render() {
    return (
      <header className="header">
				<h1>{this.state.text}</h1>
        <input
          className="new-todo"
					type="text"
          onKeyUp={e => this.handleClick(e)}
          placeholder="input todo item"
          ref='input' />
      </header>
    )
  }

	handleClick(e) {
		const node = this.refs.input;
		const text = node.value.trim();
		
		this.setState({
			text:node.value
		})
    // if (e.keyCode === 13) {
    //   const node = this.refs.input;
    //   const text = node.value.trim();
		// 	text && this.props.onAddClick(text);			
    //   //node.value = '';
    // }
  }
}