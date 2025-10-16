<template>
	<view class="container">
		<view class="form">
			<view class="form-item">
				<text>当前手机号</text>
				<input 
					v-model="currentPhone"
					disabled
					placeholder="当前绑定的手机号"
				/>
			</view>
			
			<view class="form-item">
				<text>新手机号</text>
				<input 
					v-model="newPhone"
					type="number"
					placeholder="请输入新手机号"
				/>
			</view>
			
			<view class="form-item">
				<text>验证码</text>
				<view class="code-input">
					<input 
						v-model="verificationCode"
						type="number"
						placeholder="请输入验证码"
					/>
					<button 
						class="code-btn" 
						@click="sendCode"
						:disabled="!canSendCode || countdown > 0"
					>
						{{countdown > 0 ? `${countdown}s` : '获取验证码'}}
					</button>
				</view>
			</view>
		</view>
		
		<view class="buttons">
			<button @click="goBack">取消</button>
			<button @click="changePhone" :disabled="submitting">
				{{submitting ? '换绑中...' : '确认换绑'}}
			</button>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	import userUtil from '@/utils/user.js';
	
	export default {
		data() {
			return {
				currentPhone: '',
				newPhone: '',
				verificationCode: '',
				submitting: false,
				countdown: 0,
				currentUser: null
			}
		},
		
		computed: {
			canSendCode() {
				return this.newPhone && /^1[3-9]\d{9}$/.test(this.newPhone);
			}
		},
		
		mounted() {
			this.getCurrentUser();
		},
		
		methods: {
			// 获取当前用户信息
			getCurrentUser() {
				this.currentUser = userUtil.getUserInfo();
				if (!this.currentUser || !this.currentUser.userid) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					uni.navigateBack();
					return;
				}
				this.currentPhone = this.currentUser.phone || '未绑定';
			},
			
			// 发送验证码
			async sendCode() {
				if (!this.canSendCode) {
					uni.showToast({
						title: '请输入正确的手机号',
						icon: 'none'
					});
					return;
				}
				
				try {
					const response = await request.post('/auth/sendVerificationCode', {
						phone: this.newPhone
					});
					
					if (response.code === 200) {
						uni.showToast({
							title: '验证码已发送',
							icon: 'success'
						});
						
						// 开始倒计时
						this.countdown = 60;
						const timer = setInterval(() => {
							this.countdown--;
							if (this.countdown <= 0) {
								clearInterval(timer);
							}
						}, 1000);
						
						// 开发环境显示验证码
						if (response.devCode) {
							console.log('验证码:', response.devCode);
						}
					} else {
						uni.showToast({
							title: response.msg || '发送失败',
							icon: 'none'
						});
					}
				} catch (error) {
					uni.showToast({
						title: '发送失败',
						icon: 'none'
					});
				}
			},
			
			// 换绑手机号
			async changePhone() {
				// 简单验证
				if (!this.newPhone || !this.verificationCode) {
					uni.showToast({
						title: '请填写完整信息',
						icon: 'none'
					});
					return;
				}
				
				if (!this.canSendCode) {
					uni.showToast({
						title: '请输入正确的手机号',
						icon: 'none'
					});
					return;
				}
				
				this.submitting = true;
				try {
					const response = await request.post('/auth/updatePhone', {
						userid: this.currentUser.userid.toString(),
						newPhone: this.newPhone,
						verificationCode: this.verificationCode
					});
					
					if (response.success === '成功' || response.code === 200) {
						uni.showToast({
							title: '换绑成功',
							icon: 'success'
						});
						
						// 更新本地用户信息
						userUtil.updateUserInfo({ phone: this.newPhone });
						this.currentUser.phone = this.newPhone;
						
						setTimeout(() => {
							uni.navigateBack();
						}, 1500);
					} else {
						uni.showToast({
							title: response.msg || '换绑失败',
							icon: 'none'
						});
					}
				} catch (error) {
					uni.showToast({
						title: '换绑失败',
						icon: 'none'
					});
				} finally {
					this.submitting = false;
				}
			},
			
			// 返回上一页
			goBack() {
				uni.navigateBack();
			}
		}
	}
</script>

<style>
.container {
	padding: 20px;
}

.form {
	width: 95%;
	margin-bottom: 30px;
}

.form-item {
	margin-bottom: 20px;
}

.form-item text {
	display: block;
	margin-bottom: 8px;
	font-size: 16px;
}

.form-item input {
	width: 100%;
	height: 40px;
	padding: 0 10px;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 16px;
}

.form-item input:disabled {
	background: #f5f5f5;
	color: #999;
}

.code-input {
	display: flex;
	gap: 10px;
}

.code-input input {
	flex: 1;
}

.code-btn {
	width: 100px;
	height: 40px;
	background: #007aff;
	color: white;
	border: none;
	border-radius: 4px;
	font-size: 14px;
}

.code-btn:disabled {
	background: #ccc;
	color: #999;
}

.buttons {
	display: flex;
	gap: 10px;
}

.buttons button {
	flex: 1;
	height: 40px;
	border: none;
	border-radius: 4px;
	font-size: 16px;
}

.buttons button:first-child {
	background: #f5f5f5;
	color: #666;
}

.buttons button:last-child {
	background: #007aff;
	color: white;
}

.buttons button:disabled {
	background: #ccc;
	color: #999;
}
</style>
