import _hashString from 'string-hash'

export const isObject = (obj) => { 
	if (typeof obj !== 'undefined' && Object.prototype.toString.call(obj) === '[object Object]') {
		return true
	}
	return false
}

//判断是否import引入了需要解析的后缀
export const shouldBeParseStyle = (path) => {
	const accept = [
		'.scss',
		'.sass',
		'.css'
	]

	for (const extension of accept) {
		if (path.endsWith(extension)) {
			return true
		}
	}

	return false
}

//判断是否import引入了需要解析的后缀
export const shouldBeParseImage = (path) => {
	const accept = [
		'.png',
		'.jpg',
		'.gif',
		'.jpeg',
		'.svg'
	]

	for (const extension of accept) {
		if (path.endsWith(extension)) {
			return true
		}
	}

	return false
}

export const hashString = str => String(_hashString(str))
