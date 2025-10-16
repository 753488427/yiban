<template>
	<view class="favorites-container">

		<!-- 加载状态 -->
		<view class="loading" v-if="loading">
			<text>加载中...</text>
		</view>

		<!-- 收藏列表 -->
		<view class="favorites-list" v-else-if="favoritesList.length > 0">
			<view 
				class="favorite-item" 
				v-for="item in favoritesList" 
				:key="item.goods_id"
				@click="goToGoodsDetail(item.goods_id)"
			>
				<!-- 商品图片 -->
				<image 
					class="goods-image" 
					:src="item.goodsImage" 
					mode="aspectFill"
					@error="handleImageError"
				></image>
				
				<!-- 商品信息 -->
				<view class="goods-info">
					<text class="goods-title">{{ item.goodsTitle }}</text>
					<text class="goods-price">¥{{ item.goodsPrice }}</text>
					<view class="goods-meta">
						<text class="goods-status" :class="getStatusClass(item.goodsStatus)">
							{{ item.goodsStatus }}
						</text>
					</view>
				</view>


				<!-- 取消收藏按钮 -->
				<view class="remove-btn" @click.stop="removeFavorite(item.goods_id)">
					<text class="remove-icon">❤️</text>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<view class="empty-icon">💔</view>
			<text class="empty-text">暂无收藏商品</text>
			<text class="empty-tip">去首页看看有什么好东西吧~</text>
			<button class="go-home-btn" @click="goToHome">去逛逛</button>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	import userUtil from '@/utils/user.js';

	export default {
		data() {
			return {
				favoritesList: [],
				loading: true,
				userid: null
			}
		},
		onLoad() {
			this.initPage();
		},
		onShow() {
			// 每次显示页面时刷新列表
			this.loadFavoritesList();
		},
		methods: {
			// 初始化页面
			initPage() {
				const userInfo = userUtil.getUserInfo();
				if (!userInfo) {
					uni.showModal({
						title: '提示',
						content: '请先登录',
						confirmText: '去登录',
						success: (res) => {
							if (res.confirm) {
								uni.navigateTo({
									url: '/pages/Me/user/login'
								});
							} else {
								uni.navigateBack();
							}
						}
					});
					return;
				}
				this.userid = userInfo.userid;
				this.loadFavoritesList();
			},

			// 加载收藏列表
			loadFavoritesList() {
				if (!this.userid) return;
				
				this.loading = true;
				request.post('/favorites/list', {
					userid: this.userid
				}).then(res => {
					this.loading = false;
					if (res.code === 200) {
						this.favoritesList = res.result || [];
					} else {
						this.showToast(res.msg || '获取收藏列表失败');
					}
				}).catch(err => {
					this.loading = false;
					this.showToast('网络错误，请重试');
				});
			},

			// 取消收藏
			removeFavorite(goods_id) {
				uni.showModal({
					title: '确认取消收藏',
					content: '确定要取消收藏这个商品吗？',
					success: (res) => {
						if (res.confirm) {
							this.doRemoveFavorite(goods_id);
						}
					}
				});
			},

			// 执行取消收藏
			doRemoveFavorite(goods_id) {
				request.post('/favorites/remove', {
					userid: this.userid,
					goods_id: goods_id
				}).then(res => {
					if (res.code === 200) {
						this.showToast('取消收藏成功', 'success');
						// 从列表中移除该项
						this.favoritesList = this.favoritesList.filter(item => item.goods_id !== goods_id);
					} else {
						this.showToast(res.msg || '取消收藏失败');
					}
				}).catch(err => {
					this.showToast('网络错误，请重试');
				});
			},

			// 跳转到商品详情
			goToGoodsDetail(goods_id) {
				uni.navigateTo({
					url: `/pages/Home/function/goods_detail?id=${goods_id}`
				});
			},

			// 跳转到首页
			goToHome() {
				uni.switchTab({
					url: '/pages/Home/Home'
				});
			},

			// 获取状态样式类名
			getStatusClass(status) {
				switch(status) {
					case '在售':
						return 'status-available';
					case '已售出':
						return 'status-sold';
					case '下架':
						return 'status-offline';
					default:
						return 'status-default';
				}
			},

			// 图片加载失败处理
			handleImageError(e) {
				e.target.src = '/static/logo.png';
			},


			// 显示提示
			showToast(title, icon = 'none') {
				uni.showToast({ title, icon });
			}
		}
	}
</script>

<style>
.favorites-container {
	background-color: #f5f5f5;
	min-height: 100vh;
}


/* 加载状态 */
.loading {
	padding: 100rpx 0;
	text-align: center;
	color: #999;
}

/* 收藏列表 */
.favorites-list {
	padding: 20rpx;
}

.favorite-item {
	background-color: white;
	border-radius: 12rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	position: relative;
}

/* 商品图片 */
.goods-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: 8rpx;
	margin-right: 20rpx;
	flex-shrink: 0;
}

/* 商品信息 */
.goods-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	margin-right: 80rpx;
}

.goods-title {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
	margin-bottom: 8rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.goods-price {
	font-size: 32rpx;
	color: #ff6b6b;
	font-weight: 600;
	margin-bottom: 8rpx;
}

.goods-meta {
	display: flex;
	align-items: center;
}

.goods-status {
	font-size: 22rpx;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
	color: white;
}

.status-available {
	background-color: #28a745;
}

.status-sold {
	background-color: #6c757d;
}

.status-offline {
	background-color: #ffc107;
	color: #333;
}

.status-default {
	background-color: #007bff;
}


/* 取消收藏按钮 */
.remove-btn {
	position: absolute;
	top: 50%;
	right: 15rpx;
	transform: translateY(-50%);
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(255, 255, 255, 0.9);
	border-radius: 30rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.remove-icon {
	font-size: 32rpx;
}

/* 空状态 */
.empty-state {
	padding: 150rpx 50rpx;
	text-align: center;
}

.empty-icon {
	font-size: 120rpx;
	margin-bottom: 30rpx;
}

.empty-text {
	font-size: 32rpx;
	color: #666;
	margin-bottom: 15rpx;
	display: block;
}

.empty-tip {
	font-size: 26rpx;
	color: #999;
	margin-bottom: 50rpx;
	display: block;
}

.go-home-btn {
	background-color: #007bff;
	color: white;
	border: none;
	border-radius: 25rpx;
	padding: 20rpx 60rpx;
	font-size: 28rpx;
}
</style>
