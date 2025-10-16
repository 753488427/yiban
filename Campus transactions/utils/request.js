// 基础请求地址
const BASE_URL = 'http://192.168.91.1:8082';

/**
 * 封装请求方法
 * @param {String} url 请求地址
 * @param {String} method 请求方法
 * @param {Object} data 请求数据
 * @param {Object} header 请求头
 * @returns {Promise} 请求Promise
 */
const request = (url, method = 'GET', data = {}, header = {}) => {
	return new Promise((resolve, reject) => {
		uni.request({
			url: BASE_URL + url,
			method,
			data,
			header: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				...header
			},
			success: (res) => {
				if (res.statusCode === 200) {
					resolve(res.data);
				} else {
					uni.showToast({
						title: res.data.message || '请求失败',
						icon: 'none'
					});
					reject(res.data);
				}
			},
			fail: (err) => {
				uni.showToast({
					title: '网络请求失败',
					icon: 'none'
				});
				reject(err);
			}
		});
	});
};

// 导出请求方法
export default {
	// GET请求
	get: (url, data = {}, header = {}) => {
		return request(url, 'GET', data, header);
	},
	
	// POST请求
	post: (url, data = {}, header = {}) => {
		return request(url, 'POST', data, header);
	},
	
	// PUT请求
	put: (url, data = {}, header = {}) => {
		return request(url, 'PUT', data, header);
	},
	
	// DELETE请求
	delete: (url, data = {}, header = {}) => {
		return request(url, 'DELETE', data, header);
	},
	
	// 基础URL
	baseUrl: BASE_URL
};
