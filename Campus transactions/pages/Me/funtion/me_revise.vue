<template>
	<view class="container">
		
		<!-- 表单内容 -->
		<view class="form-container">
			<!-- 头像上传 -->
			<view class="avatar-section">
				<view class="avatar-wrapper" @click="chooseAvatar">
					<image v-if="userInfo.image" :src="getImageUrl(userInfo.image)" class="avatar" mode="aspectFill"></image>
					<view v-else class="avatar-placeholder">
						<uni-icons type="camera-filled" size="24" color="#ccc"></uni-icons>
					</view>
					<view class="avatar-overlay">
						<uni-icons type="camera" size="16" color="#fff"></uni-icons>
					</view>
				</view>
				<text class="avatar-tip">点击更换头像</text>
			</view>
			
			<!-- 表单组 -->
			<view class="form-group">
				<!-- 用户名 -->
				<view class="input-item">
					<text class="input-label">用户名</text>
					<input v-model="userInfo.username" class="input-field" placeholder="请输入用户名" />
				</view>
				
				<!-- 账号 -->
				<view class="input-item">
					<text class="input-label">账号</text>
					<input v-model="userInfo.account" class="input-field" placeholder="请输入账号" />
				</view>
				
				<!-- 手机号 -->
				<view class="input-item">
					<text class="input-label">手机号</text>
					<input v-model="userInfo.phone" class="input-field" placeholder="请输入手机号" type="number" />
				</view>
				
				<!-- 性别 -->
				<view class="input-item">
					<text class="input-label">性别</text>
					<input v-model="userInfo.sex" class="input-field" placeholder="请输入性别" />
				</view>
				
				<!-- 身份 -->
				<view class="input-item">
					<text class="input-label">身份</text>
					<input v-model="userInfo.Identity" class="input-field" placeholder="请输入身份" />
				</view>
				
				<!-- 密码 -->
				<view class="input-item">
					<text class="input-label">新密码</text>
					<input v-model="userInfo.password" class="input-field" placeholder="不修改请留空" :type="showPassword ? 'text' : 'password'" />
					<view class="password-toggle" @click="togglePassword">
						<uni-icons :type="showPassword ? 'eye-slash' : 'eye'" size="18" color="#999"></uni-icons>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 操作按钮 -->
		<view class="action-container">
			<button class="primary-btn" @click="saveUserInfo" :loading="loading">
				{{ loading ? '保存中...' : '保存' }}
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
				userInfo: {
					userid: '',
					username: '',
					account: '',
					phone: '',
					sex: '',
					identity: '',
					password: '',
					image: ''
				},
				loading: false,
				avatarFile: null,
				showPassword: false
			}
		},
		onLoad() {
			this.loadUserInfo();
		},
		methods: {
			// 加载用户信息
			loadUserInfo() {
				const currentUser = userUtil.getUserInfo();
				if (currentUser) {
					this.userInfo = { ...currentUser };
				}
			},
			
			// 选择头像
			chooseAvatar() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						const tempFilePath = res.tempFilePaths[0];
						this.userInfo.image = tempFilePath;
						this.avatarFile = tempFilePath;
					},
					fail: (err) => {
						uni.showToast({
							title: '选择图片失败',
							icon: 'none'
						});
					}
				});
			},
			
			// 获取图片URL
			getImageUrl(imagePath) {
				if (!imagePath) return '';
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
			
			
			// 保存用户信息
			async saveUserInfo() {
				if (this.loading) return;
				
				// 表单验证
				if (!this.userInfo.username.trim()) {
					uni.showToast({
						title: '请输入用户名',
						icon: 'none'
					});
					return;
				}
				
				if (!this.userInfo.account.trim()) {
					uni.showToast({
						title: '请输入账号',
						icon: 'none'
					});
					return;
				}
				
				if (this.userInfo.phone && !/^1[3-9]\d{9}$/.test(this.userInfo.phone)) {
					uni.showToast({
						title: '请输入正确的手机号',
						icon: 'none'
					});
					return;
				}
				
				this.loading = true;
				
				try {
					// 如果有新头像，先上传
					if (this.avatarFile) {
						await this.uploadUserInfo();
					} else {
						await this.updateUserInfo();
					}
				} catch (error) {
					console.error('保存失败:', error);
					uni.showToast({
						title: '保存失败',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},
			
			// 上传用户信息（包含文件）
			uploadUserInfo() {
				return new Promise((resolve, reject) => {
					const formData = {
						userid: this.userInfo.userid,
						username: this.userInfo.username,
						account: this.userInfo.account,
						phone: this.userInfo.phone,
						sex: this.userInfo.sex,
						identity: this.userInfo.identity
					};
					
					// 如果有密码，添加到表单数据
					if (this.userInfo.password) {
						formData.password = this.userInfo.password;
					}
					
					uni.uploadFile({
						url: `${request.baseUrl}/auth/updateUserInfo`,
						filePath: this.avatarFile,
						name: 'image',
						formData: formData,
						success: (res) => {
							const data = JSON.parse(res.data);
							if (data.code === 200) {
								this.handleUpdateSuccess();
								resolve(data);
							} else {
								uni.showToast({
									title: data.msg || '更新失败',
									icon: 'none'
								});
								reject(data);
							}
						},
						fail: (err) => {
							uni.showToast({
								title: '网络请求失败',
								icon: 'none'
							});
							reject(err);
						}
					});
				});
			},
			
			// 更新用户信息（不包含文件）
			async updateUserInfo() {
				const updateData = {
					userid: this.userInfo.userid,
					username: this.userInfo.username,
					account: this.userInfo.account,
					phone: this.userInfo.phone,
					sex: this.userInfo.sex,
					identity: this.userInfo.identity
				};
				
				// 如果有密码，添加到更新数据
				if (this.userInfo.password) {
					updateData.password = this.userInfo.password;
				}
				
				const result = await request.post('/auth/updateUserInfo', updateData);
				if (result.code === 200) {
					this.handleUpdateSuccess();
				} else {
					uni.showToast({
						title: result.msg || '更新失败',
						icon: 'none'
					});
				}
			},
			
			// 处理更新成功
			handleUpdateSuccess() {
				// 更新本地存储的用户信息
				const updatedInfo = { ...this.userInfo };
				if (this.userInfo.password) {
					delete updatedInfo.password; // 不在本地存储密码
				}
				userUtil.updateUserInfo(updatedInfo);
				
				uni.showToast({
					title: '保存成功',
					icon: 'success'
				});
				
				setTimeout(() => {
					this.goBack();
				}, 1500);
			},
			
			// 切换密码显示状态
			togglePassword() {
				this.showPassword = !this.showPassword;
			},
			
			// 返回上一页
			goBack() {
				uni.navigateBack();
			}
		}
	}
</script>

<style scoped>
	.container {
		background-color: #f8f9fa;
		min-height: 100vh;
		padding-bottom: 120rpx;
	}
	
	
	/* 表单容器 */
	.form-container {
		padding: 0 30rpx;
	}
	
	/* 头像区域 */
	.avatar-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 60rpx;
	}
	
	.avatar-wrapper {
		position: relative;
		width: 160rpx;
		height: 160rpx;
		margin-bottom: 20rpx;
	}
	
	.avatar {
		width: 100%;
		height: 100%;
		border-radius: 80rpx;
		background-color: #fff;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
	}
	
	.avatar-placeholder {
		width: 100%;
		height: 100%;
		border-radius: 80rpx;
		background-color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
	}
	
	.avatar-overlay {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 48rpx;
		height: 48rpx;
		background-color: #007AFF;
		border-radius: 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2rpx 8rpx rgba(0, 122, 255, 0.3);
	}
	
	.avatar-tip {
		font-size: 26rpx;
		color: #666;
		margin-top: 10rpx;
	}
	
	/* 表单组 */
	.form-group {
		background-color: #fff;
		border-radius: 16rpx;
		overflow: hidden;
		box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
	}
	
	/* 输入项 */
	.input-item {
		padding: 32rpx 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
		display: flex;
		align-items: center;
		min-height: 80rpx;
		position: relative;
	}
	
	.input-item:last-child {
		border-bottom: none;
	}
	
	.input-label {
		font-size: 30rpx;
		color: #333;
		width: 140rpx;
		flex-shrink: 0;
		font-weight: 500;
	}
	
	.input-field {
		flex: 1;
		font-size: 30rpx;
		color: #333;
		text-align: right;
		background: transparent;
		padding-right: 60rpx;
	}
	
	.input-field::placeholder {
		color: #999;
		font-size: 28rpx;
	}
	
	/* 密码切换按钮 */
	.password-toggle {
		position: absolute;
		right: 30rpx;
		width: 40rpx;
		height: 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}
	
	
	/* 操作按钮 */
	.action-container {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 30rpx;
		background-color: #fff;
		border-top: 1rpx solid #f0f0f0;
		box-shadow: 0 -2rpx 16rpx rgba(0, 0, 0, 0.04);
	}
	
	.primary-btn {
		width: 100%;
		height: 88rpx;
		background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
		color: #fff;
		border: none;
		border-radius: 44rpx;
		font-size: 32rpx;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 20rpx rgba(0, 122, 255, 0.3);
		transition: all 0.3s ease;
	}
	
	.primary-btn:active {
		transform: translateY(2rpx);
		box-shadow: 0 2rpx 10rpx rgba(0, 122, 255, 0.2);
	}
	
	.primary-btn[loading] {
		opacity: 0.7;
		transform: none;
	}
	
	/* 响应式优化 */
	@media (max-width: 750rpx) {
		.avatar-wrapper {
			width: 140rpx;
			height: 140rpx;
		}
		
		.avatar-overlay {
			width: 44rpx;
			height: 44rpx;
			border-radius: 22rpx;
		}
	}
</style>
