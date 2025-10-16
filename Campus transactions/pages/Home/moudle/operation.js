import request from '@/utils/request.js';

/**
 * 商品操作工具类
 * 封装点赞、收藏等通用操作
 */
class GoodsOperation {
	
	/**
	 * 检查用户登录状态
	 * @returns {Object|null} 用户信息或null
	 */
	static getUserInfo() {
		const userInfo = uni.getStorageSync('userInfo');
		if (userInfo && userInfo.userid) {
			return userInfo;
		}
		return null;
	}
	
	/**
	 * 检查点赞状态
	 * @param {string|number} userid - 用户ID
	 * @param {string|number} goodsId - 商品ID
	 * @returns {Promise<boolean>} 是否已点赞
	 */
	static async checkLikeStatus(userid, goodsId) {
		try {
			const response = await request.post('/likes/check', {
				userid: userid,
				goods_id: goodsId
			});
			
			if (response.code === 200) {
				return response.result.isLiked;
			}
			return false;
		} catch (error) {
			console.error('检查点赞状态失败:', error);
			return false;
		}
	}
	
	/**
	 * 检查收藏状态
	 * @param {string|number} userid - 用户ID
	 * @param {string|number} goodsId - 商品ID
	 * @returns {Promise<boolean>} 是否已收藏
	 */
	static async checkCollectStatus(userid, goodsId) {
		try {
			const response = await request.post('/favorites/check', {
				userid: userid,
				goods_id: goodsId
			});
			
			if (response.code === 200) {
				return response.result.isFavorited;
			}
			return false;
		} catch (error) {
			console.error('检查收藏状态失败:', error);
			return false;
		}
	}
	
	/**
	 * 切换点赞状态
	 * @param {string|number} userid - 用户ID
	 * @param {string|number} goodsId - 商品ID
	 * @param {boolean} currentStatus - 当前点赞状态
	 * @returns {Promise<Object>} 操作结果 {success: boolean, newStatus: boolean, message: string}
	 */
	static async toggleLike(userid, goodsId, currentStatus) {
		// 检查登录状态
		if (!userid) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			return { success: false, newStatus: currentStatus, message: '请先登录' };
		}
		
		try {
			let response;
			let newStatus;
			let message;
			
			if (!currentStatus) {
				// 执行点赞操作
				console.log('发送点赞请求:', { userid, goods_id: goodsId });
				response = await request.post('/likes/add', {
					userid: userid,
					goods_id: goodsId
				});
				newStatus = true;
				message = '已点赞';
			} else {
				// 执行取消点赞操作
				console.log('发送取消点赞请求:', { userid, goods_id: goodsId });
				response = await request.post('/likes/remove', {
					userid: userid,
					goods_id: goodsId
				});
				newStatus = false;
				message = '已取消点赞';
			}
			
			console.log('点赞操作响应:', response);
			
			if (response.code === 200) {
				uni.showToast({
					title: message,
					icon: newStatus ? 'success' : 'none',
					duration: 1000
				});
				return { success: true, newStatus: newStatus, message: message };
			} else {
				throw new Error(response.msg || '操作失败');
			}
			
		} catch (error) {
			console.error('点赞操作失败:', error);
			uni.showToast({
				title: error.message || '操作失败，请重试',
				icon: 'none'
			});
			return { success: false, newStatus: currentStatus, message: error.message || '操作失败' };
		}
	}
	
	/**
	 * 切换收藏状态
	 * @param {string|number} userid - 用户ID
	 * @param {string|number} goodsId - 商品ID
	 * @param {boolean} currentStatus - 当前收藏状态
	 * @returns {Promise<Object>} 操作结果 {success: boolean, newStatus: boolean, message: string}
	 */
	static async toggleCollect(userid, goodsId, currentStatus) {
		// 检查登录状态
		if (!userid) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			return { success: false, newStatus: currentStatus, message: '请先登录' };
		}
		
		try {
			let response;
			let newStatus;
			let message;
			
			if (!currentStatus) {
				// 执行收藏操作
				console.log('发送收藏请求:', { userid, goods_id: goodsId });
				response = await request.post('/favorites/add', {
					userid: userid,
					goods_id: goodsId
				});
				newStatus = true;
				message = '已收藏';
			} else {
				// 执行取消收藏操作
				console.log('发送取消收藏请求:', { userid, goods_id: goodsId });
				response = await request.post('/favorites/remove', {
					userid: userid,
					goods_id: goodsId
				});
				newStatus = false;
				message = '已取消收藏';
			}
			
			console.log('收藏操作响应:', response);
			
			if (response.code === 200) {
				uni.showToast({
					title: message,
					icon: newStatus ? 'success' : 'none',
					duration: 1000
				});
				return { success: true, newStatus: newStatus, message: message };
			} else {
				throw new Error(response.msg || '操作失败');
			}
			
		} catch (error) {
			console.error('收藏操作失败:', error);
			uni.showToast({
				title: error.message || '操作失败，请重试',
				icon: 'none'
			});
			return { success: false, newStatus: currentStatus, message: error.message || '操作失败' };
		}
	}
	
	/**
	 * 获取商品详情数据
	 * @param {string|number} goodsId - 商品ID
	 * @returns {Promise<Object|null>} 商品详情数据
	 */
	static async getGoodsDetail(goodsId) {
		try {
			const response = await request.post('/goods/detail', {
				goods_id: goodsId
			});
			
			if (response.code === 200 && response.result) {
				const item = response.result;
				return {
					id: item.goods_id,
					title: item.title,
					content: item.content,
					price: item.price,
					image: item.image,
					imageone: item.imageone,
					likes: item.likes || 0,
					views: item.views || 0,
					status: item.status || '在售',
					time: item.time,
					label: item.label,
					userid: item.userid,
					address: item.address,
					classify: item.classify,
					username: item.username,        // 新增：用户名
					user_image: item.user_image     // 新增：用户头像
				};
			}
			return null;
		} catch (error) {
			console.error('获取商品详情失败:', error);
			throw error;
		}
	}
	
	/**
	 * 刷新商品计数数据（仅更新likes和views）
	 * @param {string|number} goodsId - 商品ID
	 * @returns {Promise<Object|null>} 更新后的计数数据 {likes, views}
	 */
	static async refreshGoodsCount(goodsId) {
		try {
			const response = await request.post('/goods/');
			
			if (response.success === '成功' && response.result && response.result.length > 0) {
				const targetItem = response.result.find(item => item.goods_id == goodsId);
				
				if (targetItem) {
					const countData = {
						likes: targetItem.likes || 0,
						views: targetItem.views || 0
					};
					console.log('刷新后的计数数据:', countData);
					return countData;
				}
			}
			return null;
		} catch (error) {
			console.error('刷新商品计数失败:', error);
			return null;
		}
	}
	
	/**
	 * 获取图片URL（处理本地图片路径）
	 * @param {string} imagePath - 图片路径
	 * @returns {string} 完整的图片URL
	 */
	static getImageUrl(imagePath) {
		if (!imagePath) {
			return '/static/logo.png'; // 默认占位图
		}
		
		// 如果已经是完整的URL，直接返回
		if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
			return imagePath;
		}
		
		// 如果是相对路径，拼接服务器地址
		if (imagePath.startsWith('uploads/')) {
			return `${request.baseUrl}/${imagePath}`;
		}
		
		// 如果是其他格式，也尝试拼接
		return `${request.baseUrl}/${imagePath}`;
	}
}

export default GoodsOperation;
