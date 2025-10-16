<template>
	<view class="settings-container">
		<!-- 账户设置 -->
		<view class="settings-section">
			<view class="section-title">账户设置</view>
			<view class="settings-item" @click="changePassword">
				<view class="item-left">
					<text class="item-icon">🔐</text>
					<text class="item-text">修改密码</text>
				</view>
				<text class="item-arrow">></text>
			</view>
			<view class="settings-item" @click="bindPhone">
				<view class="item-left">
					<text class="item-icon">📱</text>
					<text class="item-text">绑定手机</text>
				</view>
				<view class="item-right">
					<text class="item-value">{{ userInfo.phone || '未绑定' }}</text>
					<text class="item-arrow">></text>
				</view>
			</view>
		</view>

		<!-- 通知设置 -->
		<view class="settings-section">
			<view class="section-title">通知设置</view>
			<view class="settings-item">
				<view class="item-left">
					<text class="item-icon">🔔</text>
					<text class="item-text">消息通知</text>
				</view>
				<switch :checked="notificationSettings.message" @change="toggleNotification('message')" />
			</view>
			<view class="settings-item">
				<view class="item-left">
					<text class="item-icon">📢</text>
					<text class="item-text">系统公告</text>
				</view>
				<switch :checked="notificationSettings.system" @change="toggleNotification('system')" />
			</view>
			<view class="settings-item">
				<view class="item-left">
					<text class="item-icon">💰</text>
					<text class="item-text">交易提醒</text>
				</view>
				<switch :checked="notificationSettings.trade" @change="toggleNotification('trade')" />
			</view>
		</view>


		<!-- 应用设置 -->
		<view class="settings-section">
			<view class="section-title">应用设置</view>
			<view class="settings-item" @click="clearCache">
				<view class="item-left">
					<text class="item-icon">🗑️</text>
					<text class="item-text">清除缓存</text>
				</view>
				<view class="item-right">
					<text class="item-value">{{ cacheSize }}</text>
					<text class="item-arrow">></text>
				</view>
			</view>
			<view class="settings-item" @click="checkUpdate">
				<view class="item-left">
					<text class="item-icon">⬆️</text>
					<text class="item-text">检查更新</text>
				</view>
				<view class="item-right">
					<text class="item-value">v1.0.0</text>
					<text class="item-arrow">></text>
				</view>
			</view>
			<view class="settings-item" @click="feedback">
				<view class="item-left">
					<text class="item-icon">💬</text>
					<text class="item-text">意见反馈</text>
				</view>
				<text class="item-arrow">></text>
			</view>
		</view>

		<!-- 关于 -->
		<view class="settings-section">
			<view class="section-title">关于</view>
			<view class="settings-item" @click="userAgreement">
				<view class="item-left">
					<text class="item-icon">📄</text>
					<text class="item-text">用户协议</text>
				</view>
				<text class="item-arrow">></text>
			</view>
			<view class="settings-item" @click="privacyPolicy">
				<view class="item-left">
					<text class="item-icon">🔒</text>
					<text class="item-text">隐私政策</text>
				</view>
				<text class="item-arrow">></text>
			</view>
			<view class="settings-item" @click="aboutUs">
				<view class="item-left">
					<text class="item-icon">ℹ️</text>
					<text class="item-text">关于我们</text>
				</view>
				<text class="item-arrow">></text>
			</view>
		</view>

		<!-- 退出登录 -->
		<view class="logout-section">
			<button class="logout-btn" @click="logout">退出登录</button>
		</view>
	</view>
</template>

<script>
	import GoodsOperation from '../../Home/moudle/operation.js';

	export default {
		data() {
			return {
				userInfo: {},
				cacheSize: '12.5MB',
				// 通知设置
				notificationSettings: {
					message: true,
					system: true,
					trade: true
				}
			}
		},

		onLoad() {
			this.loadUserInfo();
			this.loadSettings();
		},

		methods: {
			// 加载用户信息
			loadUserInfo() {
				this.userInfo = GoodsOperation.getUserInfo() || {};
			},

			// 加载设置
			loadSettings() {
				// 从本地存储加载设置
				const notifications = uni.getStorageSync('notificationSettings');
				if (notifications) {
					this.notificationSettings = { ...this.notificationSettings, ...notifications };
				}
			},

			// 保存设置到本地
			saveSettings() {
				uni.setStorageSync('notificationSettings', this.notificationSettings);
			},

			// 切换通知设置
			toggleNotification(type) {
				this.notificationSettings[type] = !this.notificationSettings[type];
				this.saveSettings();
				
				uni.showToast({
					title: this.notificationSettings[type] ? '已开启' : '已关闭',
					icon: 'success',
					duration: 1000
				});
			},


			// 修改密码
			changePassword() {
				uni.navigateTo({
					url:'/pages/Me/Edit/Change_Password'
				})
			},

			// 绑定手机
			bindPhone() {
				uni.navigateTo({
					url:'/pages/Me/Edit/change_phone'
				})
			},

			// 清除缓存
			clearCache() {
				uni.showModal({
					title: '清除缓存',
					content: '确定要清除应用缓存吗？',
					success: (res) => {
						if (res.confirm) {
							// 清除缓存逻辑
							uni.clearStorageSync();
							this.cacheSize = '0MB';
							
							uni.showToast({
								title: '缓存已清除',
								icon: 'success'
							});
						}
					}
				});
			},

			// 检查更新
			checkUpdate() {
				uni.showLoading({
					title: '检查中...'
				});
				
				setTimeout(() => {
					uni.hideLoading();
					uni.showToast({
						title: '已是最新版本',
						icon: 'success'
					});
				}, 2000);
			},

			// 意见反馈
			feedback() {
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				});
			},

			// 用户协议
			userAgreement() {
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				});
			},

			// 隐私政策
			privacyPolicy() {
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				});
			},

			// 关于我们
			aboutUs() {
				uni.showModal({
					title: '关于我们',
					content: '校园二手交易平台 v1.0.0\n\n一个专为校园用户打造的二手商品交易平台，让闲置物品重新焕发价值。',
					showCancel: false,
					confirmText: '知道了'
				});
			},

			// 退出登录
			logout() {
				uni.showModal({
					title: '确认退出',
					content: '确定要退出登录吗？',
					success: (res) => {
						if (res.confirm) {
							// 清除用户信息
							uni.removeStorageSync('userInfo');
							
							uni.showToast({
								title: '已退出登录',
								icon: 'success'
							});
							
							// 跳转到登录页或返回上一页
							setTimeout(() => {
								uni.reLaunch({
									url: '/pages/Me/user/login'
								});
							}, 1500);
						}
					}
				});
			}
		}
	}
</script>

<style>
.settings-container {
	background-color: #f5f7fa;
	min-height: 100vh;
	padding: 20rpx;
}

/* 设置分组 */
.settings-section {
	background: white;
	border-radius: 16rpx;
	margin-bottom: 30rpx;
	overflow: hidden;
}

.section-title {
	font-size: 26rpx;
	color: #666;
	padding: 30rpx 30rpx 20rpx;
	font-weight: 500;
}

/* 设置项 */
.settings-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	border-bottom: 1rpx solid #f5f5f5;
	transition: background-color 0.2s ease;
}

.settings-item:last-child {
	border-bottom: none;
}

.settings-item:active {
	background-color: #f8f9fa;
}

.item-left {
	display: flex;
	align-items: center;
	flex: 1;
}

.item-icon {
	font-size: 32rpx;
	margin-right: 20rpx;
	width: 40rpx;
	text-align: center;
}

.item-text {
	font-size: 28rpx;
	color: #333;
}

.item-right {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.item-value {
	font-size: 26rpx;
	color: #999;
}

.item-arrow {
	font-size: 24rpx;
	color: #ccc;
}

/* 开关样式 */
switch {
	transform: scale(0.8);
}

/* 退出登录 */
.logout-section {
	padding: 40rpx 0;
}

.logout-btn {
	background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
	color: white;
	border: none;
	border-radius: 16rpx;
	height: 88rpx;
	font-size: 28rpx;
	font-weight: 500;
	margin: 0 20rpx;
	box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
}

.logout-btn:active {
	transform: scale(0.98);
	box-shadow: 0 2rpx 8rpx rgba(255, 107, 107, 0.4);
}

/* 响应式优化 */
@media (max-width: 750rpx) {
	.settings-container {
		padding: 10rpx;
	}
	
	.settings-item {
		padding: 25rpx 20rpx;
	}
	
	.item-text {
		font-size: 26rpx;
	}
}
</style>