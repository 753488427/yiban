<template>
	<view class="appraise-container">
		<!-- 商品信息 -->
		<view class="goods-info">
			<image 
				class="goods-image" 
				:src="getImageUrl(orderInfo.goods_image)" 
				mode="aspectFill"
				@error="handleImageError">
			</image>
			<view class="goods-details">
				<text class="goods-title">{{orderInfo.goods_title}}</text>
				<text class="goods-classify">{{getClassifyIcon(orderInfo.goods_classify)}} {{orderInfo.goods_classify}}</text>
				<text class="goods-price">¥{{orderInfo.goods_price}}</text>
			</view>
		</view>
		
		<!-- 评价表单 -->
		<view class="appraise-form">
			<!-- 评分 -->
			<view class="rating-section">
				<text class="section-title">商品评分</text>
				<view class="rating-stars">
					<view 
						class="star" 
						v-for="(star, index) in 5" 
						:key="index"
						@click="setRating(index + 1)"
						:class="{ active: index < rating }">
						⭐
					</view>
				</view>
				<text class="rating-text">{{getRatingText(rating)}}</text>
			</view>
			
			<!-- 评价内容 -->
			<view class="content-section">
				<text class="section-title">评价内容</text>
				<textarea 
					class="content-input"
					v-model="content"
					placeholder="请分享您对这个商品的使用体验..."
					maxlength="500"
					:show-confirm-bar="false">
				</textarea>
				<text class="char-count">{{content.length}}/500</text>
			</view>
			
			<!-- 图片上传 -->
			<view class="image-section">
				<text class="section-title">上传图片（可选）</text>
				<view class="image-upload">
					<!-- 已上传的图片 -->
					<view class="image-item" v-for="(image, index) in uploadedImages" :key="index">
						<image class="uploaded-image" :src="image" mode="aspectFill"></image>
						<view class="delete-btn" @click="removeImage(index)">×</view>
					</view>
					
					<!-- 上传按钮 -->
					<view class="upload-btn" @click="selectImage" v-if="uploadedImages.length < 3">
						<text class="upload-icon">📷</text>
						<text class="upload-text">添加图片</text>
					</view>
				</view>
				<text class="upload-tip">最多可上传3张图片</text>
			</view>
			
			<!-- 提交按钮 -->
			<button class="submit-btn" @click="submitAppraise" :disabled="submitting">
				<text class="btn-text">{{submitting ? '提交中...' : '提交评价'}}</text>
			</button>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	
	export default {
		data() {
			return {
				orderInfo: {},
				currentUser: null,
				rating: 5,
				content: '',
				uploadedImages: [],
				submitting: false
			}
		},
		
		onLoad(options) {
			// 获取订单信息
			if (options.orderInfo) {
				try {
					this.orderInfo = JSON.parse(decodeURIComponent(options.orderInfo));
				} catch (error) {
					console.error('解析订单信息失败:', error);
					uni.showToast({
						title: '参数错误',
						icon: 'none'
					});
					setTimeout(() => {
						uni.navigateBack();
					}, 1500);
				}
			}
			
			// 获取当前用户信息
			this.getCurrentUser();
		},
		
		methods: {
			// 获取当前用户信息
			getCurrentUser() {
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo) {
					this.currentUser = userInfo;
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
			
			// 设置评分
			setRating(rating) {
				this.rating = rating;
			},
			
			// 获取评分文字
			getRatingText(rating) {
				const texts = ['', '很差', '较差', '一般', '满意', '非常满意'];
				return texts[rating] || '';
			},
			
			// 选择图片
			selectImage() {
				uni.chooseImage({
					count: 3 - this.uploadedImages.length,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						this.uploadedImages.push(...res.tempFilePaths);
					},
					fail: () => {
						uni.showToast({
							title: '选择图片失败',
							icon: 'none'
						});
					}
				});
			},
			
			// 移除图片
			removeImage(index) {
				this.uploadedImages.splice(index, 1);
			},
			
			// 提交评价
			async submitAppraise() {
				// 验证表单
				if (!this.content.trim()) {
					uni.showToast({
						title: '请输入评价内容',
						icon: 'none'
					});
					return;
				}
				
				if (!this.currentUser || !this.currentUser.userid) {
					uni.showToast({
						title: '用户信息错误',
						icon: 'none'
					});
					return;
				}
				
				this.submitting = true;
				
				try {
					if (this.uploadedImages.length > 0) {
						// 有图片，使用文件上传
						await this.submitWithImage();
					} else {
						// 无图片，使用普通POST请求
						await this.submitWithoutImage();
					}
				} catch (error) {
					console.error('提交评价失败:', error);
					uni.showToast({
						title: '提交失败',
						icon: 'none'
					});
				} finally {
					this.submitting = false;
				}
			},
			
			// 带图片提交
			async submitWithImage() {
				// 只上传第一张图片（根据接口设计）
				const imagePath = this.uploadedImages[0];
				
				return new Promise((resolve, reject) => {
					uni.uploadFile({
						url: `${request.baseUrl}/comments/add`,
						filePath: imagePath,
						name: 'image',
						formData: {
							userid: this.currentUser.userid,
							goods_id: this.orderInfo.goods_id,
							content: this.content.trim(),
							rating: this.rating
						},
						success: (res) => {
							try {
								const data = JSON.parse(res.data);
								if (data.code === 200) {
									this.handleSubmitSuccess();
									resolve(data);
								} else {
									uni.showToast({
										title: data.msg || '提交失败',
										icon: 'none'
									});
									reject(data);
								}
							} catch (error) {
								console.error('解析响应失败:', error);
								uni.showToast({
									title: '提交失败',
									icon: 'none'
								});
								reject(error);
							}
						},
						fail: (error) => {
							console.error('上传失败:', error);
							uni.showToast({
								title: '网络请求失败',
								icon: 'none'
							});
							reject(error);
						}
					});
				});
			},
			
			// 无图片提交
			async submitWithoutImage() {
				const response = await request.post('/comments/add', {
					userid: this.currentUser.userid,
					goods_id: this.orderInfo.goods_id,
					content: this.content.trim(),
					rating: this.rating
				});
				
				if (response.code === 200) {
					this.handleSubmitSuccess();
				} else {
					uni.showToast({
						title: response.msg || '提交失败',
						icon: 'none'
					});
				}
			},
			
			// 处理提交成功
			handleSubmitSuccess() {
				uni.showToast({
					title: '评价提交成功',
					icon: 'success'
				});
				
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
			},
			
			// 获取分类图标
			getClassifyIcon(classify) {
				const iconMap = {
					'教材': '📚',
					'数码': '💻',
					'服饰': '👕',
					'生活': '🏠',
					'运动': '⚽',
					'其他': '🎁'
				};
				return iconMap[classify] || '🎁';
			},
			
			// 获取图片URL
			getImageUrl(imagePath) {
				if (!imagePath) return '/static/logo.png';
				
				if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
					return imagePath;
				}
				
				if (imagePath.startsWith('uploads/')) {
					return `${request.baseUrl}/${imagePath}`;
				}
				
				return imagePath;
			},
			
			// 处理图片加载错误
			handleImageError(e) {
				console.log('商品图片加载失败:', e);
				e.target.src = '/static/logo.png';
			}
		}
	}
</script>

<style>
.appraise-container {
	background-color: #f5f7fa;
	min-height: 100vh;
	padding: 20rpx;
}

/* 商品信息 */
.goods-info {
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);
}

.goods-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: 12rpx;
	margin-right: 20rpx;
	flex-shrink: 0;
}

.goods-details {
	flex: 1;
}

.goods-title {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
	display: block;
	margin-bottom: 10rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.goods-classify {
	font-size: 24rpx;
	color: #666;
	display: block;
	margin-bottom: 10rpx;
}

.goods-price {
	font-size: 32rpx;
	color: #ff6b6b;
	font-weight: 600;
	display: block;
}

/* 评价表单 */
.appraise-form {
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);
}

.section-title {
	font-size: 30rpx;
	color: #333;
	font-weight: 600;
	display: block;
	margin-bottom: 20rpx;
}

/* 评分区域 */
.rating-section {
	margin-bottom: 40rpx;
}

.rating-stars {
	display: flex;
	align-items: center;
	margin-bottom: 10rpx;
}

.star {
	font-size: 50rpx;
	margin-right: 10rpx;
	opacity: 0.3;
	transition: all 0.3s ease;
}

.star.active {
	opacity: 1;
	transform: scale(1.1);
}

.rating-text {
	font-size: 26rpx;
	color: #666;
}

/* 内容区域 */
.content-section {
	margin-bottom: 40rpx;
}

.content-input {
	width: 100%;
	min-height: 200rpx;
	padding: 20rpx;
	border: 2rpx solid #f0f0f0;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: #333;
	background: #fafafa;
	box-sizing: border-box;
}

.content-input:focus {
	border-color: #667eea;
	background: #fff;
}

.char-count {
	font-size: 24rpx;
	color: #999;
	text-align: right;
	display: block;
	margin-top: 10rpx;
}

/* 图片上传区域 */
.image-section {
	margin-bottom: 40rpx;
}

.image-upload {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
}

.image-item {
	position: relative;
	width: 150rpx;
	height: 150rpx;
}

.uploaded-image {
	width: 100%;
	height: 100%;
	border-radius: 12rpx;
}

.delete-btn {
	position: absolute;
	top: -10rpx;
	right: -10rpx;
	width: 40rpx;
	height: 40rpx;
	background: #ff4757;
	color: white;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
	font-weight: bold;
}

.upload-btn {
	width: 150rpx;
	height: 150rpx;
	border: 2rpx dashed #ddd;
	border-radius: 12rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: #fafafa;
	transition: all 0.3s ease;
}

.upload-btn:active {
	transform: scale(0.95);
	border-color: #667eea;
}

.upload-icon {
	font-size: 40rpx;
	margin-bottom: 8rpx;
}

.upload-text {
	font-size: 22rpx;
	color: #666;
}

.upload-tip {
	font-size: 22rpx;
	color: #999;
	margin-top: 10rpx;
}

/* 提交按钮 */
.submit-btn {
	width: 100%;
	height: 90rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 45rpx;
	border: none;
	box-shadow: 0 6rpx 20rpx rgba(102, 126, 234, 0.3);
	transition: all 0.3s ease;
}

.submit-btn:active {
	transform: translateY(2rpx);
	box-shadow: 0 3rpx 12rpx rgba(102, 126, 234, 0.3);
}

.submit-btn[disabled] {
	background: #ccc;
	box-shadow: none;
}

.submit-btn[disabled]:active {
	transform: none;
}

.btn-text {
	font-size: 32rpx;
	font-weight: 600;
	color: #fff;
	text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.2);
}
</style>
