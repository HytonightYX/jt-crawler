const cheerio = require('cheerio')
const axios = require('axios')
const schedule = require('node-schedule')

const baseUrl = 'http://zjddjt.com/product'

/**
 * 爬取产品展示信息
 * @returns {Promise<{data: null, ok: number}|{data: Array, ok: number}>}
 */
async function getProductDisplayInfo() {
	const r = await axios.get(`${baseUrl}/class/`)

	console.log(r.status)

	if (!r || r.status !== 200) {
		// TODO handle failure
		return {ok: 0, data: null}
	}

	let $ = cheerio.load(r.data)
	let urls = []
	let result = []

	$('.imgBox a').each((index, ele) => {
		let $ele = $(ele)
		let url = $ele.attr('href')
			.replace('../../product', baseUrl)

		urls.push(url)
	})

	console.log(urls)

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
 * 具体URL获取详情
 * @param url
 * @return object {name, img, desc} 产品信息, 图片url, 详情描述
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
	.catch(e => console.error(e.message))
