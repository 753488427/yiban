<template>
	<view class="me-container">
		<!-- 用户信息头部 -->
		<view class="user-header" v-if="userInfo">
			<view class="avatar-section">
				<image class="avatar" :src="getImageUrl(userInfo.image)" mode="aspectFill"></image>
			</view>
			<view class="user-info">
				<text class="username">{{ userInfo.username || '未设置昵称' }}</text>
				<view class="user-details">
					<text class="user-identity">{{ userInfo.Identity || '普通用户' }}</text>
					<text class="user-phone">{{ formatPhone(userInfo.phone) }}</text>
				</view>
			</view>
			<view class="edit-btn" @click="editProfile">
				<text class="edit-text">编辑</text>
			</view>
		</view>

		<!-- 未登录状态 -->
		<view class="login-prompt" v-if="!userInfo">
			<view class="avatar-placeholder" @click="goToLogin">👤</view>
			<text class="prompt-text">点击头像登录</text>
		</view>

		<!-- 功能菜单 -->
		<view class="menu-section">
			<view class="menu-item" @click="goToMyGoods">
				<view class="menu-icon">📦</view>
				<text class="menu-text">我的商品</text>
				<text class="menu-arrow">></text>
			</view>
			<view class="menu-item" @click="goToMyOrders">
				<view class="menu-icon">📋</view>
				<text class="menu-text">我的订单</text>
				<text class="menu-arrow">></text>
			</view>
			<view class="menu-item" @click="goToLikes">
				<view class="menu-icon">❤️</view>
				<text class="menu-text">我的喜欢</text>
				<text class="menu-arrow">></text>
			</view>
			<view class="menu-item" @click="goToMyFavorites">
				<view class="menu-icon">⭐</view>
				<text class="menu-text">我的收藏</text>
				<text class="menu-arrow">></text>
			</view>
			<view class="menu-item" @click="goToAddress">
				<view class="menu-icon">📍</view>
				<text class="menu-text">收货地址</text>
				<text class="menu-arrow">></text>
			</view>
		</view>

		<!-- 设置菜单 -->
		<view class="menu-section">
			<view class="menu-item" @click="goToSettings">
				<view class="menu-icon">⚙️</view>
				<text class="menu-text">设置</text>
				<text class="menu-arrow">></text>
			</view>
			<view class="menu-item" @click="goToAbout">
				<view class="menu-icon">ℹ️</view>
				<text class="menu-text">关于我们</text>
				<text class="menu-arrow">></text>
			</view>
		</view>

		<!-- 退出登录按钮 -->
		<view class="logout-section" v-if="userInfo">
			<button class="logout-btn" @click="logout">退出登录</button>
		</view>
	</view>
</template>

<script>
	import userUtil from '@/utils/user.js';
	import request from '@/utils/request.js';

	export default {
		data() {
			return {
				userInfo: null
			}
		},
		onShow() {
			// 每次页面显示时刷新用户信息
			this.loadUserInfo();
		},
		methods: {
			// 加载用户信息
			loadUserInfo() {
				this.userInfo = userUtil.getUserInfo();
				console.log('当前用户信息:', this.userInfo);
			},

			// 格式化手机号显示
			formatPhone(phone) {
				if (!phone) return '';
				return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
			},

			// 获取图片URL
			getImageUrl(imagePath) {
				if (!imagePath) return '/static/logo.png';
				// 如果是临时文件路径，直接返回
				if (imagePath.startsWith('file://') || imagePath.startsWith('blob:') || imagePath.startsWith('http')) {
					return imagePath;
				}
				// 如果是完整路径（以uploads/开头），拼接完整URL
				if (imagePath.startsWith('uploads/')) {
					return `${request.baseUrl}/${imagePath}`;
				}
				// 如果只是文件名，拼接完整URL
				return `${request.baseUrl}/uploads/${imagePath}`;
			},

			// 跳转到登录页面
			goToLogin() {
				uni.navigateTo({
					url: '/pages/Me/user/login'
				});
			},

			// 编辑个人资料
			editProfile() {
				uni.navigateTo({
					url:'/pages/Me/funtion/me_revise'
				})
			},

			// 我的商品
			goToMyGoods() {
				uni.navigateTo({
					url:'/pages/Me/funtion/me_goods'
				})
			},

			// 我的订单
			goToMyOrders() {
				uni.navigateTo({
					url:'/pages/Me/funtion/me_orders'
				})
			},
			goToLikes(){
				uni.navigateTo({
					url:'/pages/Me/funtion/me_likes'
				})
			},
			// 我的收藏
			goToMyFavorites() {
				uni.navigateTo({
					url:'/pages/Me/funtion/favorites'
				})
			},

			// 收货地址
			goToAddress() {
				uni.navigateTo({
					url:'/pages/Me/funtion/me_address'
				})
			},

			// 设置
			goToSettings() {
				uni.navigateTo({
					url: '/pages/Me/funtion/set'
				});
			},

			// 关于我们
			goToAbout() {
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				});
			},

			// 检查登录状态
			checkLogin() {
				if (!userUtil.isLoggedIn()) {
					uni.showModal({
						title: '提示',
						content: '请先登录',
						confirmText: '去登录',
						success: (res) => {
							if (res.confirm) {
								this.goToLogin();
							}
						}
					});
					return false;
				}
				return true;
			},

			// 退出登录
			logout() {
				uni.showModal({
					title: '确认退出',
					content: '确定要退出登录吗？',
					success: (res) => {
						if (res.confirm) {
							// 清除用户信息
							userUtil.clearUserInfo();
							// 刷新页面状态
							this.loadUserInfo();
							// 提示退出成功
							uni.showToast({
								title: '已退出登录',
								icon: 'success'
							});
						}
					}
				});
			}
		}
	}
</script>

<style>
.me-container {
	background-color: #f5f5f5;
	min-height: 100vh;
}

/* 用户信息头部 */
.user-header {
	background-color: white;
	padding: 40rpx 30rpx;
	display: flex;
	align-items: center;
	border-bottom: 1rpx solid #f0f0f0;
}

.avatar-section {
	margin-right: 30rpx;
}

.avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 60rpx;
	border: 2rpx solid #e9ecef;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.user-info {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.username {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 12rpx;
}

.user-details {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.user-identity {
	font-size: 24rpx;
	color: #666;
	background-color: #f8f9fa;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
	align-self: flex-start;
}

.user-phone {
	font-size: 24rpx;
	color: #999;
}

.edit-btn {
	padding: 12rpx 24rpx;
	border: 1rpx solid #ddd;
	border-radius: 20rpx;
	background-color: #f8f9fa;
	transition: all 0.2s ease;
}

.edit-btn:active {
	background-color: #e9ecef;
	transform: scale(0.95);
}

.edit-text {
	font-size: 26rpx;
	color: #666;
}

/* 未登录状态 */
.login-prompt {
	background-color: #f8f9fa;
	padding: 80rpx 30rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
}

.avatar-placeholder {
	width: 100rpx;
	height: 100rpx;
	background-color: #e9ecef;
	border-radius: 50rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 50rpx;
	margin-bottom: 30rpx;
	color: #6c757d;
	cursor: pointer;
	transition: all 0.2s ease;
}

.avatar-placeholder:active {
	background-color: #dee2e6;
	transform: scale(0.95);
}

.prompt-text {
	font-size: 26rpx;
	color: #6c757d;
}

/* 功能菜单 */
.menu-section {
	background-color: white;
	margin: 20rpx 0;
}

.menu-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1px solid #f0f0f0;
}

.menu-item:last-child {
	border-bottom: none;
}

.menu-icon {
	font-size: 36rpx;
	margin-right: 20rpx;
	width: 50rpx;
	text-align: center;
}

.menu-text {
	flex: 1;
	font-size: 30rpx;
	color: #333;
}

.menu-arrow {
	font-size: 28rpx;
	color: #ccc;
}

/* 退出登录 */
.logout-section {
	padding: 30rpx;
}

.logout-btn {
	background-color: #ff6b6b;
	color: white;
	border-radius: 25rpx;
	height: 80rpx;
	line-height: 80rpx;
	font-size: 30rpx;
}
</style>
