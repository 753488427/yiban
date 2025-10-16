<template>
	<view class="likes-container">
		
		<!-- 喜欢列表 -->
		<view class="likes-list" v-if="likesList.length > 0">
			<view class="likes-item" v-for="(item, index) in likesList" :key="item.likes_id">
				<view class="item-content" @click="goToDetail(item.goods_id)">
					<image class="goods-image" :src="getImageUrl(item.image)" mode="aspectFill" @error="handleImageError"></image>
					<view class="goods-info">
						<text class="goods-title">{{item.title}}</text>
						<view class="goods-meta">
							<view class="price-status">
								<text class="goods-price">¥{{item.price}}</text>
								<text class="goods-status" :class="{'selling': item.status === '在售'}">{{item.status}}</text>
							</view>
						</view>
					</view>
				</view>
				<view class="action-btn" @click="removeLike(index, item.goods_id)">
					<image class="unlike-icon" src="/static/喜欢1.png" mode="aspectFit"></image>
				</view>
			</view>
		</view>
		
		<!-- 加载状态 -->
		<view class="loading" v-else-if="loading">
			<text>加载中...</text>
		</view>
		
		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<image src="/static/暂无 (1).png" class="empty-icon"></image>
			<text class="empty-text">还没有喜欢的商品</text>
			<text class="empty-tip">去首页看看有什么好东西吧~</text>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	import GoodsOperation from '../../Home/moudle/operation.js';
	
	export default {
		data() {
			return {
				likesList: [],
				loading: false,
				userid: ''
			}
		},
		
		onLoad() {
			this.getUserInfo();
			this.getLikesList();
		},
		
		onShow() {
			// 页面显示时刷新列表
			this.getLikesList();
		},
		
		methods: {
			// 获取用户信息
			getUserInfo() {
				const userInfo = GoodsOperation.getUserInfo();
				if (userInfo && userInfo.userid) {
					this.userid = userInfo.userid;
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
			
			// 获取喜欢列表
			async getLikesList() {
				if (!this.userid) return;
				
				this.loading = true;
				try {
					const response = await request.post('/likes/user_likes', {
						userid: this.userid
					});
					
					console.log('喜欢列表响应:', response);
					
					if (response.code === 200 && response.result) {
						this.likesList = response.result;
					} else {
						console.error('获取喜欢列表失败:', response.msg);
					}
				} catch (error) {
					console.error('获取喜欢列表异常:', error);
					uni.showToast({
						title: '获取列表失败',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},
			
			// 取消喜欢
			async removeLike(index, goodsId) {
				uni.showModal({
					title: '确认操作',
					content: '确定要取消喜欢这个商品吗？',
					success: async (res) => {
						if (res.confirm) {
							try {
								const result = await GoodsOperation.toggleLike(this.userid, goodsId, true);
								
								if (result.success) {
									// 从列表中移除该项
									this.likesList.splice(index, 1);
									uni.showToast({
										title: '已取消喜欢',
										icon: 'success'
									});
								}
							} catch (error) {
								console.error('取消喜欢失败:', error);
								uni.showToast({
									title: '操作失败',
									icon: 'none'
								});
							}
						}
					}
				});
			},
			
			// 跳转到商品详情
			goToDetail(goodsId) {
				uni.navigateTo({
					url: `/pages/Home/function/goods_detail?id=${goodsId}`
				});
			},
			
			// 获取图片URL
			getImageUrl(imagePath) {
				return GoodsOperation.getImageUrl(imagePath);
			},
			
			// 处理图片加载错误
			handleImageError(e) {
				console.log('图片加载失败:', e);
				e.target.src = '/static/暂无 (1).png';
			}
		}
	}
</script>

<style>
.likes-container {
	background-color: #f5f7fa;
	min-height: 100vh;
}


/* 喜欢列表 */
.likes-list {
	padding: 20rpx;
}

.likes-item {
	background: white;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	padding: 20rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.item-content {
	flex: 1;
	display: flex;
	align-items: center;
}

.goods-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: 12rpx;
	margin-right: 20rpx;
	background-color: #f5f5f5;
}

.goods-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	height: 130rpx;
}

.goods-title {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
	line-height: 1.4;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	overflow: hidden;
	margin-bottom: 10rpx;
}

.goods-meta {
	display: flex;
	align-items: flex-start;
}

.price-status {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.goods-price {
	font-size: 32rpx;
	color: #ff6b6b;
	font-weight: bold;
}

.goods-status {
	font-size: 22rpx;
	color: #999;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
	background: #f5f5f5;
}

.goods-status.selling {
	color: #52c41a;
	background: #f6ffed;
}

.action-btn {
	padding: 10rpx;
	margin-left: 20rpx;
}

.unlike-icon {
	width: 48rpx;
	height: 48rpx;
	transition: transform 0.2s ease;
}

.action-btn:active .unlike-icon {
	transform: scale(0.9);
}

/* 加载状态 */
.loading {
	text-align: center;
	padding: 200rpx 0;
	color: #999;
	font-size: 28rpx;
}

/* 空状态 */
.empty-state {
	text-align: center;
	padding: 200rpx 40rpx;
}

.empty-icon {
	width: 200rpx;
	height: 200rpx;
	margin-bottom: 40rpx;
	opacity: 0.3;
}

.empty-text {
	display: block;
	font-size: 32rpx;
	color: #666;
	margin-bottom: 20rpx;
}

.empty-tip {
	display: block;
	font-size: 26rpx;
	color: #999;
}

/* 点击效果 */
.likes-item:active {
	transform: scale(0.98);
	transition: transform 0.1s ease;
}
</style>