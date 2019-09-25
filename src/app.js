const cheerio = require('cheerio')
const axios = require('axios')
const schedule = require('node-schedule')

const baseUrl = 'http://zjddjt.com/product'

/**
 * 爬取产品展示信息
 * @returns {Promise<{data: null, ok: number}|{data: Array, ok: number}>}
 */
async function getProductDisplayInfo() {
	const r = await axios.get(`${baseUrl}/class/index.php?page=1`)

	if (!r || r.status !== 200) {
		// TODO handle failure
		return {ok: 0, data: null}
	}

	let $ = cheerio.load(r.data)
	// 获取总页数
	let maxPage = getUrlParam($('.pagess a').attr('href'), 'page')
	// 存储详情页 url 待爬取
	let urls = []
	let result = []

	$('.imgBox a').each((index, ele) => {
		let $ele = $(ele)
		let url = $ele.attr('href')
			.replace('../../product', baseUrl)

		urls.push(url)
	})

	console.log('total page:', maxPage)

	// 递归获取所有详情 url
	urls = urls.concat(await getAllUrls(2, maxPage))

	for (url of urls) {
		let detail = await getDetail(url)
		result.push(detail)
	}

	return {
		ok: 1,
		data: result
	}
}

/**
 * 递归获取所有url
 */
async function getAllUrls(currPage, maxPage) {
	if (currPage > maxPage) {
		return []
	}

	const r = await axios.get(`${baseUrl}/class/index.php?page=${currPage}`)
	let $ = cheerio.load(r.data)
	let urls = []

	$('.imgBox a').each((index, ele) => {
		let $ele = $(ele)
		let url = $ele.attr('href')
			.replace('../../product', baseUrl)

		urls.push(url)
	})

	return urls.concat(await getAllUrls(currPage + 1, maxPage))
}

/**
 * 具体URL获取详情
 */
async function getDetail(url) {
	let r = await axios.get(url)
	let $ = cheerio.load(r.data)

	console.log(`analysis ${url} ...`)

	let name = $('.product-name h1').text()

	let img = $('.product-preview img').attr('src')
		.replace('../../product', baseUrl)

	let area = $('.breadcrumbs').text()
		.replace(/\s+/g,'')
		.split('>')[3]

	let desc = []

	$('.product-desc-item-content .qhd-content p').each((index, ele) => {
		let $ele = $(ele)
		desc.push($ele.text().trim().replace('\n', ''))
	})

	return {name, img, area, desc}
}

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

// executed every 2 hours
let rule = new schedule.RecurrenceRule()
rule.hour = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23]
rule.minute = 0

// prod env
// schedule.scheduleJob(rule, () => {
// 	getProductDisplayInfo()
// 		.then(r => {
// 			r.ok ?
// 				console.log(r.data)
// 				:
// 				console.log('NO DATA!')
// 		})
// 		.catch(e => console.error(e.message))
// })

getProductDisplayInfo()
	.then(r => {
		r.ok ?
			console.log(JSON.stringify(r.data, null, 2))
			:
			console.log('NO DATA!')
	})
	.catch(e => console.error(e))
