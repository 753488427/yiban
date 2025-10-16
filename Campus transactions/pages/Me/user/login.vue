<template>
	<view class="login-container">
		<!-- 背景装饰 -->
		<view class="bg-decoration">
			<view class="circle circle-1"></view>
			<view class="circle circle-2"></view>
			<view class="circle circle-3"></view>
		</view>
		
		<!-- 顶部区域 -->
		<view class="login-header">
			<view class="logo-container">
				<image class="logo" src="/static/转校.png" mode="aspectFit"></image>
			</view>
			<text class="title">易校</text>
			<text class="subtitle">校园二手交易平台</text>
		</view>
		
		<!-- 登录卡片 -->
		<view class="login-card">
			<!-- 切换标签 -->
			<view class="login-tabs">
				<view :class="['tab-item', activeTab === 'account' ? 'active' : '']" @click="switchTab('account')">
					<text class="tab-text">密码登录</text>
				</view>
				<view :class="['tab-item', activeTab === 'code' ? 'active' : '']" @click="switchTab('code')">
					<text class="tab-text">验证码登录</text>
				</view>
				<view class="tab-indicator" :class="activeTab"></view>
			</view>
			
			<!-- 账号密码登录 -->
			<view class="login-form" v-if="activeTab === 'account'">
				<view class="input-group">
					<view class="input-wrapper">
						<view class="input-icon">👤</view>
						<input class="input" type="text" v-model="accountForm.account" placeholder="请输入账号/手机号" />
					</view>
				</view>
				<view class="input-group">
					<view class="input-wrapper">
						<view class="input-icon">🔒</view>
						<input class="input" type="password" v-model="accountForm.password" placeholder="请输入密码" password />
					</view>
				</view>
				<button class="login-btn" @click="loginByAccount">
					<text class="btn-text">登录</text>
				</button>
			</view>
			
			<!-- 验证码登录 -->
			<view class="login-form" v-if="activeTab === 'code'">
				<view class="input-group">
					<view class="input-wrapper">
						<view class="input-icon">📱</view>
						<input class="input" type="number" v-model="codeForm.phone" placeholder="请输入手机号" maxlength="11" />
					</view>
				</view>
				<view class="input-group">
					<view class="input-wrapper code-wrapper">
						<view class="input-icon">🔢</view>
						<input class="input code-input" type="number" v-model="codeForm.code" placeholder="请输入验证码" maxlength="6" />
						<view class="code-btn" @click="getVerificationCode" :class="{ disabled: codeBtnDisabled }">
							<text class="code-btn-text">{{codeBtnText}}</text>
						</view>
					</view>
				</view>
				<button class="login-btn" @click="loginByCode">
					<text class="btn-text">登录</text>
				</button>
			</view>
			
			<!-- 底部链接 -->
			<view class="register-link">
				<text class="register-text">还没有账号？</text>
				<text class="link" @click="goToRegister">立即注册</text>
			</view>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	import userUtil from '@/utils/user.js';

	export default {
		data() {
			return {
				activeTab: 'account', // 默认显示账号密码登录
				accountForm: {
					account: '',
					password: ''
				},
				codeForm: {
					phone: '',
					code: ''
				},
				codeBtnText: '获取验证码',
				codeBtnDisabled: false,
				countdown: 60,
				timer: null
			}
		},
		methods: {
			// 切换登录方式
			switchTab(tab) {
				this.activeTab = tab;
			},
			
			// 显示提示信息
			showToast(title, type = 'none') {
				uni.showToast({ title, icon: type });
			},
			
			// 登录成功处理
			handleLoginSuccess(res) {
				this.showToast('登录成功', 'success');
				userUtil.saveUserInfo(res.result[0]);
				
				setTimeout(() => {
					uni.switchTab({ url: '/pages/Home/Home' });
				}, 1500);
			},
			
			// 登录失败处理
			handleLoginFail(res, errorType = '登录') {
				this.showToast(res.msg || `${errorType}失败`);
			},
			
			// 验证手机号
			validatePhone(phone, showError = true) {
				if (!phone) {
					showError && this.showToast('请输入手机号');
					return false;
				}
				if (!this.isPhoneNumber(phone)) {
					showError && this.showToast('请输入正确的手机号');
					return false;
				}
				return true;
			},
			
			// 账号密码登录
			loginByAccount() {
				if (!this.accountForm.account) {
					return this.showToast('请输入账号');
				}
				if (!this.accountForm.password) {
					return this.showToast('请输入密码');
				}
				
				const isPhone = this.isPhoneNumber(this.accountForm.account);
				request.post('/auth/login', {
					phone: isPhone ? this.accountForm.account : '',
					account: !isPhone ? this.accountForm.account : '',
					password: this.accountForm.password
				}).then(res => {
					res.code === 200 ? this.handleLoginSuccess(res) : this.handleLoginFail(res);
				}).catch(err => {
					console.error('登录失败:', err);
				});
			},
			
			// 获取验证码
			getVerificationCode() {
				if (this.codeBtnDisabled || !this.validatePhone(this.codeForm.phone)) return;
				
				request.post('/auth/sendVerificationCode', {
					phone: this.codeForm.phone
				}).then(res => {
					if (res.code === 200) {
						this.showToast('验证码已发送', 'success');
						this.startCountdown();
						if (res.devCode) this.codeForm.code = res.devCode;
					} else {
						this.handleLoginFail(res, '验证码发送');
					}
				}).catch(err => {
					console.error('获取验证码失败:', err);
				});
			},
			
			// 验证码登录
			loginByCode() {
				if (!this.validatePhone(this.codeForm.phone)) return;
				if (!this.codeForm.code) {
					return this.showToast('请输入验证码');
				}
				
				request.post('/auth/loginByCode', {
					phone: this.codeForm.phone,
					code: this.codeForm.code
				}).then(res => {
					res.code === 200 ? this.handleLoginSuccess(res) : this.handleLoginFail(res);
				}).catch(err => {
					console.error('验证码登录失败:', err);
				});
			},
			
			// 开始倒计时
			startCountdown() {
				this.codeBtnDisabled = true;
				this.countdown = 60;
				this.codeBtnText = `${this.countdown}秒后重新获取`;
				
				this.timer = setInterval(() => {
					this.countdown--;
					this.codeBtnText = `${this.countdown}秒后重新获取`;
					
					if (this.countdown <= 0) {
						clearInterval(this.timer);
						this.codeBtnDisabled = false;
						this.codeBtnText = '获取验证码';
					}
				}, 1000);
			},
			
			// 跳转到注册页面
			goToRegister() {
				uni.navigateTo({ url: '/pages/Me/user/reg' });
			},
			
			// 验证手机号格式
			isPhoneNumber(phone) {
				return /^1[3-9]\d{9}$/.test(phone);
			}
		},
		// 组件销毁时清除定时器
		beforeDestroy() {
			if (this.timer) {
				clearInterval(this.timer);
			}
		}
	}
</script>

<style>
/* 页面容器 */
.login-container {
	min-height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	position: relative;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	padding: 0;
}

/* 背景装饰 */
.bg-decoration {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 0;
}

.circle {
	position: absolute;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.1);
	backdrop-filter: blur(10rpx);
}

.circle-1 {
	width: 200rpx;
	height: 200rpx;
	top: 10%;
	right: -50rpx;
	animation: float 6s ease-in-out infinite;
}

.circle-2 {
	width: 150rpx;
	height: 150rpx;
	top: 60%;
	left: -30rpx;
	animation: float 8s ease-in-out infinite reverse;
}

.circle-3 {
	width: 100rpx;
	height: 100rpx;
	top: 30%;
	left: 20%;
	animation: float 10s ease-in-out infinite;
}

@keyframes float {
	0%, 100% { transform: translateY(0px) rotate(0deg); }
	50% { transform: translateY(-20px) rotate(180deg); }
}

/* 顶部区域 */
.login-header {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 120rpx 40rpx 60rpx;
	position: relative;
	z-index: 1;
}

.logo-container {
	width: 150rpx;
	height: 150rpx;
	background: rgba(255, 255, 255, 0.2);
	border-radius: 30rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 30rpx;
	backdrop-filter: blur(20rpx);
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.logo {
	width: 130rpx;
	height: 130rpx;
}

.title {
	font-size: 56rpx;
	font-weight: 700;
	color: #fff;
	margin-bottom: 10rpx;
	text-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.2);
}

.subtitle {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.8);
	font-weight: 300;
}

/* 登录卡片 */
.login-card {
	flex: 1;
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(20rpx);
	border-radius: 40rpx 40rpx 0 0;
	padding: 60rpx 40rpx 40rpx;
	position: relative;
	z-index: 1;
	box-shadow: 0 -10rpx 40rpx rgba(0, 0, 0, 0.1);
}

/* 切换标签 */
.login-tabs {
	display: flex;
	position: relative;
	background: #f8f9fa;
	border-radius: 16rpx;
	padding: 8rpx;
	margin-bottom: 50rpx;
}

.tab-item {
	flex: 1;
	text-align: center;
	padding: 20rpx 0;
	position: relative;
	z-index: 2;
	transition: all 0.3s ease;
}

.tab-text {
	font-size: 30rpx;
	font-weight: 500;
	color: #666;
	transition: color 0.3s ease;
}

.tab-item.active .tab-text {
	color: #667eea;
	font-weight: 600;
}

.tab-indicator {
	position: absolute;
	top: 8rpx;
	bottom: 8rpx;
	width: calc(50% - 8rpx);
	background: #fff;
	border-radius: 12rpx;
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.15);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	z-index: 1;
}

.tab-indicator.account {
	left: 8rpx;
}

.tab-indicator.code {
	left: calc(50% + 0rpx);
}

/* 表单样式 */
.login-form {
	margin-top: 20rpx;
}

.input-group {
	margin-bottom: 40rpx;
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
	width: 50rpx;
	height: 50rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	margin-left: 20rpx;
	color: #999;
}

.input {
	flex: 1;
	height: 100rpx;
	padding: 0 20rpx;
	font-size: 30rpx;
	color: #333;
	background: transparent;
	border: none;
}

.input::placeholder {
	color: #999;
}

/* 验证码输入特殊样式 */
.code-wrapper {
	padding-right: 0;
}

.code-input {
	padding-right: 20rpx;
}

.code-btn {
	height: 100rpx;
	padding: 0 30rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #fff;
	font-size: 26rpx;
	font-weight: 500;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;
	cursor: pointer;
}

.code-btn:active {
	transform: scale(0.98);
}

.code-btn.disabled {
	background: #ddd;
	color: #999;
	cursor: not-allowed;
}

.code-btn.disabled:active {
	transform: none;
}

.code-btn-text {
	font-size: 26rpx;
}

/* 登录按钮 */
.login-btn {
	width: 100%;
	height: 100rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 50rpx;
	border: none;
	margin-top: 40rpx;
	box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.3);
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
}

.login-btn::before {
	content: '';
	position: absolute;
	top: 0;
	left: -100%;
	width: 100%;
	height: 100%;
	background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
	transition: left 0.5s;
}

.login-btn:active::before {
	left: 100%;
}

.login-btn:active {
	transform: translateY(2rpx);
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.btn-text {
	font-size: 32rpx;
	font-weight: 600;
	color: #fff;
	text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.2);
}

/* 注册链接 */
.register-link {
	text-align: center;
	margin-top: 50rpx;
	padding-bottom: 40rpx;
}

.register-text {
	font-size: 28rpx;
	color: #666;
}

.link {
	font-size: 28rpx;
	color: #667eea;
	font-weight: 600;
	margin-left: 10rpx;
}

.link:active {
	opacity: 0.7;
}

/* 响应式适配 */
@media screen and (max-width: 750rpx) {
	.login-header {
		padding: 100rpx 30rpx 40rpx;
	}
	
	.login-card {
		padding: 50rpx 30rpx 30rpx;
	}
	
	.title {
		font-size: 48rpx;
	}
}
</style>
