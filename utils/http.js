
/**
 * 根据 param 获取 url 中查询字符串值
 */
function getUrlParam(url, param) {
	const reg = new RegExp(`(^|&)${param}=([^&]*)`)
	const r = url.split('?')[1].match(reg)

	if ( r ) {
		return decodeURIComponent(r[2])
	}
}

module.exports = {
	getUrlParam
}
