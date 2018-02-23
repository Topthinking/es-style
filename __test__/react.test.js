import React from 'react'
import Adapter from 'enzyme-adapter-react-16';
import Enzyme,{ shallow } from 'enzyme'
import CheckboxWithLabel from './src/react.dom'

Enzyme.configure({ adapter: new Adapter() })


test('测试dom点击', () => { 
	const checkbox = shallow(<CheckboxWithLabel labelOn="On" labelOff="Off" />)
	expect(checkbox.text()).toEqual('Off')
	checkbox.find('input').simulate('change')
	expect(checkbox.text()).toEqual('On')
})