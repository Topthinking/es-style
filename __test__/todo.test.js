import React from 'react'
import Adapter from 'enzyme-adapter-react-16';
import Enzyme,{ shallow,mount } from 'enzyme'
import App from './src/components/test/todo'

Enzyme.configure({ adapter: new Adapter() })


const setup = () => {
  // 模拟 props
  const props = {
    // Jest 提供的mock 函数
    onAddClick: jest.fn()
  }

  // 通过 enzyme 提供的 shallow(浅渲染) 创建组件
  const wrapper = mount(<App {...props} />)
  return {
    props,
    wrapper
  }
}

test('测试', () => { 
	const { wrapper, props } = setup()

	const mockEvent = {
		keyCode: 13, // enter 事件
		target: {
			value: 'Test'
		}
	}

	expect(wrapper.find('.new-todo').length).toBe(1)

	wrapper.find('.new-todo').at(0).simulate('keyup', mockEvent)
	expect(wrapper.find('.new-todo').at(0).prop('placeholder')).toBe('input todo item')
	expect(wrapper.find('h1').at(0).text()).toBe('Test')
	//expect(props.onAddClick).toHaveBeenCalled()
})