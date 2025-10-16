<template>
	<view class="register-container">
		<!-- 注册卡片 -->
		<view class="register-card">
			<!-- 头像上传区域 -->
			<view class="avatar-section">
				<view class="avatar-container" @click="selectAvatar">
					<image v-if="avatarUrl" :src="avatarUrl" class="avatar-preview" mode="aspectFill"></image>
					<view v-else class="avatar-placeholder">
						<view class="avatar-icon">📷</view>
						<text class="avatar-text">上传头像</text>
					</view>
				</view>
			</view>
			
			<!-- 表单区域 -->
			<view class="register-form">
				<!-- 用户名 -->
				<view class="input-group">
					<view class="input-wrapper">
						<view class="input-icon">👤</view>
						<input class="input" type="text" v-model="formData.username" placeholder="请输入用户名" />
					</view>
				</view>
				
				<!-- 账号 -->
				<view class="input-group">
					<view class="input-wrapper">
						<view class="input-icon">🆔</view>
						<input class="input" type="text" v-model="formData.account" placeholder="请输入账号（用于登录）" />
					</view>
				</view>
				
				<!-- 手机号 -->
				<view class="input-group">
					<view class="input-wrapper">
						<view class="input-icon">📱</view>
						<input class="input" type="number" v-model="formData.phone" placeholder="请输入手机号" maxlength="11" />
					</view>
				</view>
				
				<!-- 密码 -->
				<view class="input-group">
					<view class="input-wrapper">
						<view class="input-icon">🔒</view>
						<input class="input" type="password" v-model="formData.password" placeholder="请输入密码（至少6位）" password />
					</view>
				</view>
				
				<!-- 确认密码 -->
				<view class="input-group">
					<view class="input-wrapper">
						<view class="input-icon">🔐</view>
						<input class="input" type="password" v-model="confirmPassword" placeholder="请确认密码" password />
					</view>
				</view>
				
				<!-- 用户身份 -->
				<view class="input-group">
					<view class="input-wrapper picker-wrapper">
						<view class="input-icon">🎓</view>
						<picker @change="onIdentityChange" :value="identityIndex" :range="identityOptions">
							<view class="picker-input">
								<text class="picker-text" :class="{ 'placeholder': identityIndex === -1 }">
									{{ identityOptions[identityIndex] || '请选择身份' }}
								</text>
								<text class="picker-arrow">▼</text>
							</view>
						</picker>
					</view>
				</view>
				
				<!-- 注册按钮 -->
				<button class="register-btn" @click="handleRegister" :disabled="registerLoading">
					<text class="btn-text">{{registerLoading ? '注册中...' : '立即注册'}}</text>
				</button>
			</view>
			
			<!-- 登录链接 -->
			<view class="login-link">
				<text class="login-text">已有账号？</text>
				<text class="link" @click="goToLogin">立即登录</text>
			</view>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	
	export default {
		data() {
			return {
				formData: {
					username: '',
					account: '',
					phone: '',
					password: '',
					identity: '',
					avatarFile: null
				},
				confirmPassword: '',
				avatarUrl: '',
				identityOptions: ['学生', '老师', '其他'],
				identityIndex: -1,
				registerLoading: false
			}
		},
		methods: {
			// 显示提示信息
			showToast(title, type = 'none') {
				uni.showToast({
					title,
					icon: type,
					duration: 2000
				});
			},
			
			// 选择头像
			selectAvatar() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						const tempFilePath = res.tempFilePaths[0];
						this.avatarUrl = tempFilePath;
						this.formData.avatarFile = tempFilePath;
					},
					fail: () => {
						this.showToast('选择图片失败');
					}
				});
			},
			
			// 验证手机号
			validatePhone(phone) {
				return /^1[3-9]\d{9}$/.test(phone);
			},
			
			// 身份选择改变
			onIdentityChange(e) {
				this.identityIndex = e.detail.value;
				this.formData.identity = this.identityOptions[this.identityIndex];
			},
			
			
			// 表单验证
			validateForm() {
				const { username, account, phone, password } = this.formData;
				
				if (!username) {
					this.showToast('请输入用户名');
					return false;
				}
				
				if (!account) {
					this.showToast('请输入账号');
					return false;
				}
				
				if (!phone) {
					this.showToast('请输入手机号');
					return false;
				}
				
				if (!this.validatePhone(phone)) {
					this.showToast('请输入正确的手机号');
					return false;
				}
				
				if (!password) {
					this.showToast('请输入密码');
					return false;
				}
				
				if (password.length < 6) {
					this.showToast('密码长度不能少于6位');
					return false;
				}
				
				if (password !== this.confirmPassword) {
					this.showToast('两次输入的密码不一致');
					return false;
				}
				
				return true;
			},
			
			// 处理注册
			async handleRegister() {
				if (this.registerLoading) return;
				
				// 表单验证
				if (!this.validateForm()) return;
				
				this.registerLoading = true;
				
				try {
					if (this.formData.avatarFile) {
						// 有头像，使用文件上传
						await this.registerWithAvatar();
					} else {
						// 无头像，使用普通POST请求
						await this.registerWithoutAvatar();
					}
				} catch (error) {
					console.error('注册失败:', error);
					this.showToast('注册失败');
				} finally {
					this.registerLoading = false;
				}
			},
			
			// 带头像注册
			registerWithAvatar() {
				return new Promise((resolve, reject) => {
					const formData = {
						username: this.formData.username,
						account: this.formData.account,
						password: this.formData.password,
						phone: this.formData.phone,
						identity: this.formData.identity
					};
					
					uni.uploadFile({
						url: `${request.baseUrl}/auth/register`,
						filePath: this.formData.avatarFile,
						name: 'image',
						formData: formData,
						success: (res) => {
							const data = JSON.parse(res.data);
							if (data.code === 200) {
								this.showToast('注册成功', 'success');
								setTimeout(() => {
									this.goToLogin();
								}, 1500);
								resolve(data);
							} else {
								this.showToast(data.msg || '注册失败');
								reject(data);
							}
						},
						fail: (err) => {
							this.showToast('网络请求失败');
							reject(err);
						}
					});
				});
			},
			
			// 无头像注册
			async registerWithoutAvatar() {
				const registerData = {
					username: this.formData.username,
					account: this.formData.account,
					password: this.formData.password,
					phone: this.formData.phone,
					identity: this.formData.identity
				};
				
				const result = await request.post('/auth/register', registerData);
				if (result.code === 200) {
					this.showToast('注册成功', 'success');
					setTimeout(() => {
						this.goToLogin();
					}, 1500);
				} else {
					this.showToast(result.msg || '注册失败');
				}
			},
			
			// 跳转到登录页面
			goToLogin() {
				uni.navigateTo({
					url: '/pages/Me/user/login'
				});
			}
		}
	}
</script>

<style>
/* 页面容器 */
.register-container {
	min-height: 100vh;
	background: #f5f5f5;
	padding: 0;
}

/* 注册卡片 */
.register-card {
	width: 100%;
	min-height: 100vh;
	background: #fff;
	border-radius: 0;
	padding: 50rpx 40rpx 40rpx;
	box-sizing: border-box;
}

/* 头像区域 */
.avatar-section {
	text-align: center;
	margin-bottom: 60rpx;
}

.avatar-container {
	display: inline-block;
	position: relative;
}

.avatar-preview {
	width: 140rpx;
	height: 140rpx;
	border-radius: 50%;
	border: 4rpx solid #667eea;
	box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.2);
}

.avatar-placeholder {
	width: 140rpx;
	height: 140rpx;
	border-radius: 50%;
	border: 3rpx dashed #ccc;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	transition: all 0.3s ease;
}

.avatar-placeholder:active {
	transform: scale(0.95);
	border-color: #667eea;
}

.avatar-icon {
	font-size: 40rpx;
	margin-bottom: 8rpx;
}

.avatar-text {
	font-size: 22rpx;
	color: #666;
	font-weight: 500;
}

/* 表单样式 */
.register-form {
	margin-top: 20rpx;
}

.input-group {
	margin-bottom: 32rpx;
}

.input-wrapper {
	position: relative;
	display: flex;
	align-items: center;
	background: #f8f9fa;
	border-radius: 16rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s ease;
	overflow: hidden;
}

.input-wrapper:focus-within {
	border-color: #667eea;
	background: #fff;
	box-shadow: 0 0 0 6rpx rgba(102, 126, 234, 0.1);
}

.input-icon {
	width: 45rpx;
	height: 45rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	margin-left: 18rpx;
	color: #999;
}

.input {
	flex: 1;
	height: 90rpx;
	padding: 0 18rpx;
	font-size: 28rpx;
	color: #333;
	background: transparent;
	border: none;
}

.input::placeholder {
	color: #999;
}

/* 选择器特殊样式 */
.picker-wrapper {
	padding-right: 0;
}

.picker-input {
	flex: 1;
	height: 90rpx;
	padding: 0 18rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: transparent;
	border: none;
}

.picker-text {
	flex: 1;
	color: #333;
	font-size: 28rpx;
}

.picker-text.placeholder {
	color: #999;
}

.picker-arrow {
	color: #999;
	font-size: 18rpx;
	margin-left: 10rpx;
	transition: transform 0.3s ease;
}

.picker-wrapper:focus-within .picker-arrow {
	transform: rotate(180deg);
}

/* 注册按钮 */
.register-btn {
	width: 100%;
	height: 90rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 45rpx;
	border: none;
	margin-top: 35rpx;
	box-shadow: 0 6rpx 20rpx rgba(102, 126, 234, 0.3);
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
}

.register-btn::before {
	content: '';
	position: absolute;
	top: 0;
	left: -100%;
	width: 100%;
	height: 100%;
	background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
	transition: left 0.5s;
}

.register-btn:active::before {
	left: 100%;
}

.register-btn:active {
	transform: translateY(2rpx);
	box-shadow: 0 3rpx 12rpx rgba(102, 126, 234, 0.3);
}

.register-btn[disabled] {
	background: #ccc;
	box-shadow: none;
	cursor: not-allowed;
}

.register-btn[disabled]:active {
	transform: none;
}

.register-btn[disabled]::before {
	display: none;
}

.btn-text {
	font-size: 30rpx;
	font-weight: 600;
	color: #fff;
	text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.2);
}

/* 登录链接 */
.login-link {
	text-align: center;
	margin-top: 40rpx;
	padding-bottom: 30rpx;
}

.login-text {
	font-size: 26rpx;
	color: #666;
}

.link {
	font-size: 26rpx;
	color: #667eea;
	font-weight: 600;
	margin-left: 8rpx;
}

.link:active {
	opacity: 0.7;
}

/* 响应式适配 */
@media screen and (max-width: 750rpx) {
	.register-card {
		padding: 40rpx 30rpx 30rpx;
	}
	
	.avatar-preview,
	.avatar-placeholder {
		width: 120rpx;
		height: 120rpx;
	}
}

/* 滚动优化 */
.register-container {
	overflow-y: auto;
	-webkit-overflow-scrolling: touch;
}
</style>
