<template>
	<view class="publishing-container">
		<!-- 内容区域 -->
		<view class="content-area">
			<!-- 商品标题 -->
			<view class="title-section">
				<input 
					class="title-input" 
					v-model="title"
					placeholder="给你的宝贝起个好听的名字吧~"
					maxlength="50"
				/>
			</view>

			<!-- 图片上传区域 -->
			<view class="image-upload-section">
				<view class="image-upload-area" @click="chooseImage">
					<view class="upload-placeholder" v-if="imageList.length === 0">
						<text class="upload-icon">+</text>
						<text class="upload-text">添加优质</text>
						<text class="upload-subtext">首图更吸引人~</text>
					</view>
					<!-- 已上传的图片 -->
					<view class="image-list" v-if="imageList.length > 0">
						<view class="image-item" v-for="(image, index) in imageList" :key="index">
							<image :src="image" class="uploaded-image" mode="aspectFill"></image>
							<view class="delete-image" @click.stop="deleteImage(index)">
								<text class="delete-icon">✕</text>
							</view>
						</view>
						<!-- 添加更多图片 -->
						<view class="add-more-image" v-if="imageList.length < 9" @click="chooseImage">
							<text class="add-icon">+</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 商品描述区域 -->
			<view class="description-section">
				<textarea 
					class="description-input" 
					v-model="description"
					placeholder="描述一下宝贝的品牌型号、货品来源..."
					maxlength="500"
					:show-count="true"
				></textarea>
				
				<!-- AI帮你写 -->
				<view class="ai-helper" @click="useAIHelper">
					<view class="ai-icon">🤖</view>
					<text class="ai-text">AI帮你写</text>
				</view>
			</view>

			<!-- 商品分类 -->
			<view class="classify-section" @click="selectClassify">
				<view class="classify-icon">🏷️</view>
				<view class="classify-content">
					<text class="classify-text">{{ selectedClassify || '选择分类' }}</text>
					<text class="classify-arrow">▶</text>
				</view>
			</view>

			<!-- 地址输入 -->
			<view class="address-section">
				<view class="address-icon">📍</view>
				<input 
					class="address-input" 
					v-model="address"
					placeholder="请输入详细地址"
					maxlength="100"
				/>
			</view>

		<!-- 价格设置 -->
		<view class="price-section" @click="setPrice">
			<view class="price-header">
				<view class="price-label">价格</view>
				<view class="price-tip">设置合理价格更容易成交</view>
			</view>
			<view class="price-display">
				<text class="price-symbol">¥</text>
				<text class="price-value" :class="{ 'placeholder': !price }">
					{{ price || '0.00' }}
				</text>
			</view>
		</view>

			<!-- 发货方式 -->
			<view class="shipping-section" @click="setShipping">
				<view class="shipping-label">发货方式</view>
				<view class="shipping-content">
					<text class="shipping-text">{{ shippingMethod || '包邮' }}</text>
					<text class="shipping-arrow">▶</text>
				</view>
			</view>
		</view>

		<!-- 底部发布按钮 -->
		<view class="bottom-publish-area">
			<view class="publish-btn" @click="publishGoods">发布</view>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js'
	
	export default {
		data() {
			return {
				title: '', // 商品标题
				imageList: [], // 上传的图片列表
				description: '', // 商品描述
				selectedClassify: '', // 选中的分类
				address: '', // 地址
				price: '', // 价格
				shippingMethod: '包邮', // 发货方式
				userid: '' // 用户ID
			}
		},
		onLoad() {
			// 获取用户信息
			this.getUserInfo();
		},
		methods: {
			// 获取用户信息
			getUserInfo() {
				// 从本地存储获取用户信息
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo && userInfo.userid) {
					this.userid = userInfo.userid;
				} else {
					// 如果没有用户信息，跳转到登录页面
					uni.showModal({
						title: '提示',
						content: '请先登录',
						success: (res) => {
							if (res.confirm) {
								uni.navigateTo({
									url: '/pages/login/login'
								});
							}
						}
					});
				}
			},

			// 选择图片
			chooseImage() {
				const that = this;
				uni.chooseImage({
					count: 9 - this.imageList.length,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: function(res) {
						that.imageList = that.imageList.concat(res.tempFilePaths);
					}
				});
			},

			// 删除图片
			deleteImage(index) {
				this.imageList.splice(index, 1);
			},

			// AI帮你写
			useAIHelper() {
				uni.showToast({
					title: 'AI写作功能开发中',
					icon: 'none'
				});
			},

			// 选择分类
			selectClassify() {
				uni.showActionSheet({
					itemList: ['数码产品', '生活用品', '娱乐休闲', '服装配饰', '教材书籍', '跑腿配送'],
					success: (res) => {
						const classifies = ['数码产品', '生活用品', '娱乐休闲', '服装配饰', '教材书籍', '跑腿配送'];
						this.selectedClassify = classifies[res.tapIndex];
					}
				});
			},

			// 设置价格
			setPrice() {
				uni.showModal({
					title: '设置价格',
					editable: true,
					placeholderText: '请输入价格',
					success: (res) => {
						if (res.confirm && res.content) {
							const price = parseFloat(res.content);
							if (!isNaN(price) && price >= 0) {
								this.price = price.toFixed(2);
							} else {
								uni.showToast({
									title: '请输入有效价格',
									icon: 'none'
								});
							}
						}
					}
				});
			},

			// 设置发货方式
			setShipping() {
				uni.showActionSheet({
					itemList: ['包邮', '买家承担运费', '同城自取'],
					success: (res) => {
						const methods = ['包邮', '买家承担运费', '同城自取'];
						this.shippingMethod = methods[res.tapIndex];
					}
				});
			},

			// 发布商品
			async publishGoods() {
				// 表单验证
				if (!this.title.trim()) {
					uni.showToast({
						title: '请填写商品标题',
						icon: 'none'
					});
					return;
				}

				if (this.imageList.length === 0) {
					uni.showToast({
						title: '请至少上传一张图片',
						icon: 'none'
					});
					return;
				}

				if (!this.description.trim()) {
					uni.showToast({
						title: '请填写商品描述',
						icon: 'none'
					});
					return;
				}

				if (!this.selectedClassify) {
					uni.showToast({
						title: '请选择商品分类',
						icon: 'none'
					});
					return;
				}

				if (!this.address.trim()) {
					uni.showToast({
						title: '请填写地址',
						icon: 'none'
					});
					return;
				}

				if (!this.price) {
					uni.showToast({
						title: '请设置商品价格',
						icon: 'none'
					});
					return;
				}

				if (!this.userid) {
					uni.showToast({
						title: '用户信息获取失败，请重新登录',
						icon: 'none'
					});
					return;
				}

				uni.showLoading({
					title: '发布中...'
				});

				try {
					// 上传商品到后端
					await this.uploadGoods();
				} catch (error) {
					console.error('发布失败:', error);
					uni.hideLoading();
					uni.showToast({
						title: '发布失败，请重试',
						icon: 'none'
					});
				}
			},

			// 上传商品到后端
			async uploadGoods() {
				return new Promise((resolve, reject) => {
					// 创建FormData
					const formData = {
						title: this.title,
						price: this.price,
						content: this.description,
						classify: this.selectedClassify,
						address: this.address,
						userid: this.userid
					};

					// 上传文件
					uni.uploadFile({
						url: request.baseUrl + '/goods/upload',
						files: this.imageList.map((imagePath, index) => ({
							name: 'images',
							uri: imagePath
						})),
						formData: formData,
						success: (res) => {
							uni.hideLoading();
							const data = JSON.parse(res.data);
							
							if (data.success === '成功') {
								uni.showToast({
									title: '发布成功！',
									icon: 'success'
								});
								
								setTimeout(() => {
									uni.navigateBack();
								}, 1500);
								resolve(data);
							} else {
								uni.showToast({
									title: data.msg || '发布失败',
									icon: 'none'
								});
								reject(new Error(data.msg));
							}
						},
						fail: (error) => {
							uni.hideLoading();
							console.error('上传失败:', error);
							uni.showToast({
								title: '网络错误，请重试',
								icon: 'none'
							});
							reject(error);
						}
					});
				});
			}
		}
	}
</script>

<style scoped>
.publishing-container {
	min-height: 100vh;
	background-color: #F5F5F5;
	padding-bottom: 120rpx; /* 为底部按钮留出空间 */
}

/* 内容区域 */
.content-area {
	padding: 30rpx;
}

/* 商品标题 */
.title-section {
	background-color: #FFFFFF;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
}

.title-input {
	width: 100%;
	font-size: 28rpx;
	color: #333;
	border: none;
	outline: none;
}

/* 图片上传区域 */
.image-upload-section {
	background-color: #FFFFFF;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
}

.image-upload-area {
	min-height: 300rpx;
}

.upload-placeholder {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 300rpx;
	border: 2rpx dashed #D0D0D0;
	border-radius: 12rpx;
	background-color: #FAFAFA;
}

.upload-icon {
	font-size: 60rpx;
	color: #999;
	margin-bottom: 20rpx;
}

.upload-text {
	font-size: 28rpx;
	color: #666;
	margin-bottom: 8rpx;
}

.upload-subtext {
	font-size: 24rpx;
	color: #999;
}

.image-list {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
}

.image-item {
	position: relative;
	width: 200rpx;
	height: 200rpx;
}

.uploaded-image {
	width: 100%;
	height: 100%;
	border-radius: 12rpx;
}

.delete-image {
	position: absolute;
	top: -10rpx;
	right: -10rpx;
	width: 40rpx;
	height: 40rpx;
	background-color: #FF4444;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.delete-icon {
	color: #FFFFFF;
	font-size: 24rpx;
}

.add-more-image {
	width: 200rpx;
	height: 200rpx;
	border: 2rpx dashed #D0D0D0;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #FAFAFA;
}

.add-icon {
	font-size: 60rpx;
	color: #999;
}

/* 商品描述区域 */
.description-section {
	background-color: #FFFFFF;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	position: relative;
}

.description-input {
	width: 100%;
	min-height: 200rpx;
	font-size: 28rpx;
	line-height: 1.6;
	color: #333;
	background-color: transparent;
	border: none;
	outline: none;
	resize: none;
}

.ai-helper {
	position: absolute;
	bottom: 20rpx;
	left: 30rpx;
	display: flex;
	align-items: center;
	padding: 12rpx 20rpx;
	background: linear-gradient(135deg, #FF6B9D 0%, #C44EFF 100%);
	border-radius: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(196, 78, 255, 0.3);
}

.ai-icon {
	font-size: 24rpx;
	margin-right: 8rpx;
}

.ai-text {
	font-size: 24rpx;
	color: #FFFFFF;
	font-weight: bold;
}

/* 商品分类 */
.classify-section {
	display: flex;
	align-items: center;
	background-color: #FFFFFF;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
}

.classify-icon {
	font-size: 32rpx;
	margin-right: 20rpx;
}

.classify-content {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.classify-text {
	font-size: 28rpx;
	color: #333;
}

.classify-arrow {
	font-size: 24rpx;
	color: #999;
}

/* 地址输入 */
.address-section {
	display: flex;
	align-items: center;
	background-color: #FFFFFF;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
}

.address-icon {
	font-size: 32rpx;
	margin-right: 20rpx;
}

.address-input {
	flex: 1;
	font-size: 28rpx;
	color: #333;
	border: none;
	outline: none;
}

/* 价格设置 */
.price-section {
	background-color: #FFFFFF;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.price-header {
	margin-bottom: 20rpx;
}

.price-label {
	font-size: 30rpx;
	color: #333;
	font-weight: bold;
	margin-bottom: 8rpx;
}

.price-tip {
	font-size: 24rpx;
	color: #999;
	line-height: 1.4;
}

.price-display {
	display: flex;
	align-items: baseline;
	padding: 20rpx 0;
	border-top: 1rpx solid #F0F0F0;
}

.price-symbol {
	font-size: 40rpx;
	color: #FF4444;
	font-weight: bold;
	margin-right: 8rpx;
}

.price-value {
	font-size: 48rpx;
	color: #FF4444;
	font-weight: bold;
	letter-spacing: 1rpx;
}

.price-value.placeholder {
	color: #CCCCCC;
	font-size: 36rpx;
}

/* 发货方式 */
.shipping-section {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background-color: #FFFFFF;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
}

.shipping-label {
	font-size: 28rpx;
	color: #333;
	font-weight: bold;
}

.shipping-content {
	display: flex;
	align-items: center;
}

.shipping-text {
	font-size: 28rpx;
	color: #666;
	margin-right: 20rpx;
}

.shipping-arrow {
	font-size: 24rpx;
	color: #999;
}

/* 底部发布按钮区域 */
.bottom-publish-area {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #FFFFFF;
	padding: 20rpx 30rpx 40rpx;
	border-top: 1rpx solid #E5E5E5;
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.publish-btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
	color: #333;
	font-size: 32rpx;
	font-weight: bold;
	border-radius: 44rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 6rpx 20rpx rgba(255, 165, 0, 0.4);
	transition: all 0.3s ease;
}

.publish-btn:active {
	transform: scale(0.98);
	box-shadow: 0 4rpx 15rpx rgba(255, 165, 0, 0.3);
}

/* 点击效果 */
.image-upload-area, .ai-helper, .classify-section, .price-section, .shipping-section {
	transition: all 0.2s ease;
}

.image-upload-area:active, .ai-helper:active, .classify-section:active, 
.price-section:active, .shipping-section:active {
	transform: scale(0.98);
	opacity: 0.8;
}
</style>
