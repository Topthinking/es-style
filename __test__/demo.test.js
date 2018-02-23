
import sum from './src'

test('加法计算1+2=3', () => { 
	expect(sum(1,2)).toBe(3)
})