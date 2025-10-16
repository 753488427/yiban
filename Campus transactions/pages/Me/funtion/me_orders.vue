<template>
	<view class="orders-container">
		<!-- 订单列表 -->
		<scroll-view class="order-list" scroll-y="true" @scrolltolower="loadMore">
			<!-- 加载状态 -->
			<view class="loading" v-if="loading">
				<text>加载中...</text>
			</view>
			
			<!-- 订单项 -->
			<view class="order-item" v-for="(order, index) in orderList" :key="order.order_id">
				<!-- 订单头部 -->
				<view class="order-header">
					<view class="order-info">
						<text class="order-id">订单号: {{order.order_id}}</text>
						<text class="order-time">{{formatTime(order.time)}}</text>
					</view>
					<view class="order-status" :class="getStatusClass(order.status)">
						<text class="status-text">{{order.status}}</text>
					</view>
				</view>
				
				<!-- 商品信息 -->
				<view class="goods-info" @click="goToGoodsDetail(order.goods_id)">
					<image 
						class="goods-image" 
						:src="getImageUrl(order.goods_image)" 
						mode="aspectFill"
						@error="handleImageError">
					</image>
					<view class="goods-details">
						<text class="goods-title">{{order.goods_title || '商品标题'}}</text>
						<text class="goods-classify">{{getClassifyIcon(order.goods_classify)}} {{order.goods_classify}}</text>
						<text class="goods-price">¥{{order.goods_price || '0.00'}}</text>
					</view>
				</view>
				
				<!-- 订单操作 -->
				<view class="order-actions">
					<view class="action-btn" @click="contactSeller(order)" v-if="order.status !== '已完成'">
						<text class="action-text">联系卖家</text>
					</view>
					<view class="action-btn primary" @click="confirmOrder(order)" v-if="order.status === '已购'">
						<text class="action-text">确认收货</text>
					</view>
					<view class="action-btn" @click="deleteOrder(order)" v-if="order.status === '已完成' || order.status === '已取消'">
						<text class="action-text">删除订单</text>
					</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view class="empty-state" v-if="!loading && orderList.length === 0">
				<image src="/static/暂无 (1).png" class="empty-icon"></image>
				<br>
				<text class="empty-text">暂无订单</text>
			</view>
			
			<!-- 加载更多 -->
			<view class="load-more" v-if="hasMore && orderList.length > 0">
				<text class="load-text">加载更多...</text>
			</view>
			<view class="no-more" v-else-if="orderList.length > 0">
				<text class="no-more-text">没有更多订单了</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	
	export default {
		data() {
			return {
				loading: false,
				hasMore: true,
				orderList: [],
				currentUser: null
			}
		},
		
		onLoad() {
			this.getCurrentUser();
			this.loadOrderList();
		},
		
		// 页面显示时重新加载数据
		onShow() {
			if (this.orderList.length > 0) {
				this.loadOrderList();
			}
		},
		
		methods: {
			// 获取当前用户信息
			getCurrentUser() {
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo) {
					this.currentUser = userInfo;
				} else {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					setTimeout(() => {
						uni.navigateBack();
					}, 1500);
				}
			},
			
			// 加载订单列表
			async loadOrderList() {
				if (!this.currentUser || !this.currentUser.userid) {
					return;
				}
				
				this.loading = true;
				try {
					const response = await request.post('/orders', {
						userid: this.currentUser.userid
					});
					
					console.log('订单列表响应:', response);
					
					if (response.success === '成功' && response.result) {
						this.orderList = response.result;
					} else {
						this.orderList = [];
						console.log('获取订单列表失败:', response.msg);
					}
				} catch (error) {
					console.error('加载订单列表失败:', error);
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},
			
			// 跳转到商品详情
			goToGoodsDetail(goodsId) {
				if (!goodsId) return;
				
				uni.navigateTo({
					url: `/pages/Home/function/goods_detail?id=${goodsId}`
				});
			},
			
			// 联系卖家
			async contactSeller(order) {
				// 检查用户是否登录
				if (!this.currentUser || !this.currentUser.userid) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				
				// 检查卖家信息是否完整
				if (!order.seller_id || !order.seller_username) {
					uni.showToast({
						title: '卖家信息不完整',
						icon: 'none'
					});
					return;
				}
				
				// 检查是否是自己的商品（不能联系自己）
				if (this.currentUser.userid == order.seller_id) {
					uni.showToast({
						title: '不能联系自己',
						icon: 'none'
					});
					return;
				}
				
				try {
					// 查找是否已存在会话
					const response = await request.get(`/news/conversations/${this.currentUser.userid}`);
					
					let existingConversationId = null;
					if (response.success === '成功' && response.result) {
						// 查找与该卖家的现有会话
						const existingConversation = response.result.find(conv => 
							conv.other_user_id == order.seller_id
						);
						if (existingConversation) {
							existingConversationId = existingConversation.conversation_id;
						}
					}
					
					// 准备商品信息
					const productInfo = {
						id: order.goods_id,
						title: order.goods_title,
						price: order.goods_price,
						image: order.goods_image,
						status: order.status
					};
					
					// 获取卖家头像URL
					const sellerAvatar = this.getUserAvatar(order.seller_image);
					const conversationId = existingConversationId || 'new';
					
					// 跳转到聊天详情页面，携带商品信息
					uni.navigateTo({
						url: `/pages/message/detail?conversationId=${conversationId}&userId=${order.seller_id}&username=${encodeURIComponent(order.seller_username)}&avatar=${encodeURIComponent(sellerAvatar)}&productInfo=${encodeURIComponent(JSON.stringify(productInfo))}`
					});
					
				} catch (error) {
					console.error('联系卖家失败:', error);
					// 即使查找会话失败，也可以创建新会话
					const sellerAvatar = this.getUserAvatar(order.seller_image);
					const productInfo = {
						id: order.goods_id,
						title: order.goods_title,
						price: order.goods_price,
						image: order.goods_image,
						status: order.status
					};
					
					uni.navigateTo({
						url: `/pages/message/detail?conversationId=new&userId=${order.seller_id}&username=${encodeURIComponent(order.seller_username)}&avatar=${encodeURIComponent(sellerAvatar)}&productInfo=${encodeURIComponent(JSON.stringify(productInfo))}`
					});
				}
			},
			
			// 确认收货
			async confirmOrder(order) {
				uni.showModal({
					title: '确认收货',
					content: '确认已收到商品吗？收货后可以对商品进行评价。',
					success: async (res) => {
						if (res.confirm) {
							try {
								const response = await request.post('/orders/update', {
									order_id: order.order_id,
									status: '已完成'
								});
								
								if (response.success === '成功') {
									// 更新订单状态
									order.status = '已完成';
									
									// 跳转到评价页面
									uni.showModal({
										title: '收货成功',
										content: '是否要对此商品进行评价？',
										success: (modalRes) => {
											if (modalRes.confirm) {
												// 跳转到评价页面，传递订单和商品信息
												const orderInfo = {
													order_id: order.order_id,
													goods_id: order.goods_id,
													goods_title: order.goods_title,
													goods_image: order.goods_image,
													goods_price: order.goods_price,
													goods_classify: order.goods_classify
												};
												
												uni.navigateTo({
													url: `/pages/Me/funtion/me_appraise?orderInfo=${encodeURIComponent(JSON.stringify(orderInfo))}`
												});
											} else {
												uni.showToast({
													title: '确认收货成功',
													icon: 'success'
												});
											}
										}
									});
								} else {
									uni.showToast({
										title: response.msg || '确认收货失败',
										icon: 'none'
									});
								}
							} catch (error) {
								console.error('确认收货失败:', error);
								uni.showToast({
									title: '确认收货失败',
									icon: 'none'
								});
							}
						}
					}
				});
			},
			
			// 删除订单
			async deleteOrder(order) {
				uni.showModal({
					title: '删除订单',
					content: '确定要删除这个订单吗？',
					success: async (res) => {
						if (res.confirm) {
							try {
								const response = await request.post('/orders/delete', {
									order_id: order.order_id,
									userid: this.currentUser.userid
								});
								
								if (response.success === '成功') {
									// 从列表中移除订单
									const index = this.orderList.findIndex(item => item.order_id === order.order_id);
									if (index !== -1) {
										this.orderList.splice(index, 1);
									}
									uni.showToast({
										title: '删除成功',
										icon: 'success'
									});
								} else {
									uni.showToast({
										title: response.msg || '删除失败',
										icon: 'none'
									});
								}
							} catch (error) {
								console.error('删除订单失败:', error);
								uni.showToast({
									title: '删除失败',
									icon: 'none'
								});
							}
						}
					}
				});
			},
			
			// 加载更多
			loadMore() {
				if (!this.hasMore) return;
				
				setTimeout(() => {
					this.hasMore = false;
					uni.showToast({ title: '没有更多订单了', icon: 'none' });
				}, 1000);
			},
			
			// 获取状态样式类
			getStatusClass(status) {
				const classMap = {
					'已购': 'status-purchased',
					'已发货': 'status-shipped',
					'已完成': 'status-completed',
					'已取消': 'status-cancelled'
				};
				return classMap[status] || 'status-default';
			},
			
			// 获取分类图标
			getClassifyIcon(classify) {
				const iconMap = {
					'教材': '📚',
					'数码': '💻',
					'服饰': '👕',
					'生活': '🏠',
					'运动': '⚽',
					'其他': '🎁'
				};
				return iconMap[classify] || '🎁';
			},
			
			// 获取图片URL
			getImageUrl(imagePath) {
				if (!imagePath) return '/static/logo.png';
				
				// 如果已经是完整的URL，直接返回
				if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
					return imagePath;
				}
				
				// 如果是uploads路径，拼接服务器地址
				if (imagePath.startsWith('uploads/')) {
					return `${request.baseUrl}/${imagePath}`;
				}
				
				// 默认处理
				return imagePath;
			},
			
			// 格式化时间
			formatTime(timeStr) {
				if (!timeStr) return '';
				
				const time = new Date(timeStr);
				const now = new Date();
				const diff = now - time;
				
				const minutes = Math.floor(diff / (1000 * 60));
				const hours = Math.floor(diff / (1000 * 60 * 60));
				const days = Math.floor(diff / (1000 * 60 * 60 * 24));
				
				if (minutes < 60) {
					return minutes <= 0 ? '刚刚' : `${minutes}分钟前`;
				} else if (hours < 24) {
					return `${hours}小时前`;
				} else if (days < 7) {
					return `${days}天前`;
				} else {
					return time.toLocaleDateString();
				}
			},
			
			// 处理图片加载错误
			handleImageError(e) {
				console.log('商品图片加载失败:', e);
				e.target.src = '/static/logo.png';
			},
			
			// 获取用户头像
			getUserAvatar(avatarPath) {
				if (!avatarPath) {
					const avatarIndex = Math.floor(Math.random() * 9) + 1;
					return `/static/c${avatarIndex}.png`;
				}
				
				if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
					return avatarPath;
				}
				
				if (avatarPath.startsWith('uploads/')) {
					return `${request.baseUrl}/${avatarPath}`;
				}
				
				return avatarPath;
			}
		}
	}
</script>

<style>
.orders-container {
	background-color: #f5f7fa;
	min-height: 100vh;
}

/* 订单列表 */
.order-list {
	flex: 1;
	padding: 20rpx -10rpx;
}

.order-item {
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);
}

/* 订单头部 */
.order-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
	padding-bottom: 20rpx;
	border-bottom: 1rpx solid #f5f5f5;
}

.order-info {
	flex: 1;
}

.order-id {
	font-size: 26rpx;
	color: #333;
	font-weight: 500;
	display: block;
	margin-bottom: 8rpx;
}

.order-time {
	font-size: 22rpx;
	color: #999;
	display: block;
}

.order-status {
	padding: 8rpx 16rpx;
	border-radius: 20rpx;
	font-size: 22rpx;
}

.status-text {
	font-weight: 500;
}

.status-purchased {
	background: #fff3cd;
	color: #856404;
}

.status-shipped {
	background: #d1ecf1;
	color: #0c5460;
}

.status-completed {
	background: #d4edda;
	color: #155724;
}

.status-cancelled {
	background: #f8d7da;
	color: #721c24;
}

.status-default {
	background: #f8f9fa;
	color: #6c757d;
}

/* 商品信息 */
.goods-info {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
	padding: 20rpx;
	background: #fafafa;
	border-radius: 12rpx;
}

.goods-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: 12rpx;
	margin-right: 20rpx;
	flex-shrink: 0;
}

.goods-details {
	flex: 1;
}

.goods-title {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
	display: block;
	margin-bottom: 10rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.goods-classify {
	font-size: 24rpx;
	color: #666;
	display: block;
	margin-bottom: 10rpx;
}

.goods-price {
	font-size: 32rpx;
	color: #ff6b6b;
	font-weight: 600;
	display: block;
}

/* 订单操作 */
.order-actions {
	display: flex;
	justify-content: flex-end;
	gap: 20rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid #f5f5f5;
}

.action-btn {
	padding: 12rpx 24rpx;
	border: 1rpx solid #ddd;
	border-radius: 20rpx;
	background: white;
	transition: all 0.3s ease;
}

.action-btn.primary {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-color: #667eea;
}

.action-text {
	font-size: 24rpx;
	color: #666;
}

.action-btn.primary .action-text {
	color: white;
}

.action-btn:active {
	transform: scale(0.95);
}

/* 加载状态 */
.loading {
	text-align: center;
	padding: 60rpx 0;
	color: #666;
	font-size: 28rpx;
}

/* 空状态 */
.empty-state {
	text-align: center;
	padding: 100rpx 0;
}

.empty-icon {
	width: 200rpx;
	height: 200rpx;
	margin-bottom: 30rpx;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}

/* 加载更多 */
.load-more, .no-more {
	text-align: center;
	padding: 40rpx 0;
}

.load-text, .no-more-text {
	font-size: 24rpx;
	color: #999;
}
</style>
