<template>
	<view class="container">
		
		<view class="form">
			<view class="form-item">
				<text>当前密码</text>
				<input 
					v-model="oldPassword"
					type="password"
					placeholder="请输入当前密码"
				/>
			</view>
			
			<view class="form-item">
				<text>新密码</text>
				<input 
					v-model="newPassword"
					type="password"
					placeholder="请输入新密码"
				/>
			</view>
			
			<view class="form-item">
				<text>确认新密码</text>
				<input 
					v-model="confirmPassword"
					type="password"
					placeholder="请再次输入新密码"
				/>
			</view>
		</view>
		
		<view class="buttons">
			<button @click="goBack">取消</button>
			<button @click="changePassword" :disabled="submitting">
				{{submitting ? '修改中...' : '确认修改'}}
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
				oldPassword: '',
				newPassword: '',
				confirmPassword: '',
				submitting: false,
				currentUser: null
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
				}
			},
			
			// 返回上一页
			goBack() {
				uni.navigateBack();
			},
			
			// 修改密码
			async changePassword() {
				// 简单验证
				if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
					uni.showToast({
						title: '请填写完整信息',
						icon: 'none'
					});
					return;
				}
				
				if (this.newPassword !== this.confirmPassword) {
					uni.showToast({
						title: '两次密码不一致',
						icon: 'none'
					});
					return;
				}
				
				this.submitting = true;
				try {
					const response = await request.post('/auth/updatePassword', {
						userid: this.currentUser.userid.toString(),
						oldPassword: this.oldPassword,
						newPassword: this.newPassword
					});
					
					if (response.success === '成功' || response.code === 200) {
						uni.showToast({
							title: '修改成功',
							icon: 'success'
						});
						setTimeout(() => {
							uni.navigateBack();
						}, 1500);
					} else {
						uni.showToast({
							title: response.msg || '修改失败',
							icon: 'none'
						});
					}
				} catch (error) {
					uni.showToast({
						title: '修改失败',
						icon: 'none'
					});
				} finally {
					this.submitting = false;
				}
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
