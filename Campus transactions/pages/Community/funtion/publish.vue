<template>
	<view class="publish-container">
		<!-- 导航栏 -->
		<uni-nav-bar left-icon="back" title="发布动态" @clickLeft="goBack" 
			:border="false" background-color="#fff" color="#333">
			<template v-slot:right>
				<view class="publish-btn" @click="publishPost" :class="{'disabled': !canPublish}">
					<text class="publish-text">发布</text>
				</view>
			</template>
		</uni-nav-bar>
		
		<view class="content">
			<!-- 分类选择 -->
			<view class="category-section">
				<text class="section-title">选择分类</text>
				<scroll-view class="category-scroll" scroll-x="true" show-scrollbar="false">
					<view class="category-item" 
						v-for="(item, index) in categoryList" 
						:key="index"
						:class="{'active': selectedCategory === item.id}"
						@click="selectCategory(item.id)">
						<text class="category-text">{{item.icon}} {{item.name}}</text>
					</view>
				</scroll-view>
			</view>
			
			<!-- 内容输入 -->
			<view class="content-section">
				<textarea 
					class="content-input" 
					v-model="postContent"
					placeholder="分享你的校园生活..."
					:maxlength="500"
					auto-height
					:show-confirm-bar="false">
				</textarea>
				<view class="char-count">{{postContent.length}}/500</view>
			</view>
			
			<!-- 图片上传 -->
			<view class="image-section">
				<text class="section-title">添加图片 (最多1张)</text>
				<view class="image-list">
					<view class="image-item" v-if="imageList.length > 0">
						<image class="preview-image" :src="imageList[0].url" mode="aspectFill"></image>
						<view class="delete-btn" @click="removeImage(0)">
							<uni-icons type="close" size="16" color="#fff"></uni-icons>
						</view>
					</view>
					<view class="add-image-btn" v-if="imageList.length === 0" @click="chooseImage">
						<uni-icons type="camera" size="32" color="#999"></uni-icons>
						<text class="add-text">添加图片</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 加载遮罩 -->
		<uni-load-more v-if="publishing" status="loading" :content-text="loadingText"></uni-load-more>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	
	export default {
		data() {
			return {
				selectedCategory: '',
				postContent: '',
				imageList: [],
				publishing: false,
				loadingText: {
					contentdown: '上传中...',
					contentrefresh: '上传中...',
					contentnomore: '上传完成'
				},
				
				// 分类列表
				categoryList: [
					{ id: '教材', name: '教材', icon: '📚' },
					{ id: '数码', name: '数码', icon: '💻' },
					{ id: '服饰', name: '服饰', icon: '👕' },
					{ id: '生活', name: '生活', icon: '🏠' },
					{ id: '运动', name: '运动', icon: '⚽' },
					{ id: '其他', name: '其他', icon: '🎁' }
				]
			}
		},
		
		computed: {
			canPublish() {
				return this.selectedCategory && this.postContent.trim().length > 0 && !this.publishing;
			}
		},
		
		methods: {
			// 返回上一页
			goBack() {
				if (this.postContent.trim() || this.imageList.length > 0) {
					uni.showModal({
						title: '提示',
						content: '内容尚未发布，确定要离开吗？',
						success: (res) => {
							if (res.confirm) {
								uni.navigateBack();
							}
						}
					});
				} else {
					uni.navigateBack();
				}
			},
			
			// 选择分类
			selectCategory(categoryId) {
				this.selectedCategory = categoryId;
			},
			
			// 选择图片
			chooseImage() {
				uni.chooseImage({
					count: 1, // 只允许选择1张图片
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						// 清空现有图片，只保留新选择的图片
						this.imageList = [{
							url: res.tempFilePaths[0],
							path: res.tempFilePaths[0]
						}];
					},
					fail: (err) => {
						console.error('选择图片失败:', err);
						uni.showToast({
							title: '选择图片失败',
							icon: 'none'
						});
					}
				});
			},
			
			// 删除图片
			removeImage(index) {
				this.imageList.splice(index, 1);
			},
			
			// 发布动态
			async publishPost() {
				if (!this.canPublish) return;
				
				this.publishing = true;
				
				try {
					// 获取用户信息
					const userInfo = uni.getStorageSync('userInfo');
					if (!userInfo || !userInfo.userid) {
						uni.showToast({
							title: '请先登录',
							icon: 'none'
						});
						this.publishing = false;
						return;
					}
					
					// 如果有图片，使用上传文件接口
					if (this.imageList.length > 0) {
						await this.publishWithImages(userInfo);
					} else {
						// 没有图片，直接发布文字
						await this.publishTextOnly(userInfo);
					}
					
				} catch (error) {
					console.error('发布失败:', error);
					uni.showToast({
						title: '发布失败',
						icon: 'none'
					});
				} finally {
					this.publishing = false;
				}
			},
			
			// 发布纯文字动态
			async publishTextOnly(userInfo) {
				const response = await request.post('/community/publish', {
					userid: userInfo.userid,
					content: this.postContent.trim(),
					classify: this.selectedCategory
				});
				
				if (response.success === '成功') {
					uni.showToast({
						title: '发布成功',
						icon: 'success'
					});
					setTimeout(() => {
						uni.navigateBack();
					}, 1500);
				} else {
					uni.showToast({
						title: response.msg || '发布失败',
						icon: 'none'
					});
				}
			},
			
			// 发布带图片的动态
			async publishWithImages(userInfo) {
				return new Promise((resolve, reject) => {
					// 使用第一张图片作为上传文件
					const image = this.imageList[0];
					
					// 准备表单数据
					const formData = {
						userid: userInfo.userid,
						content: this.postContent.trim(),
						classify: this.selectedCategory
					};
					
					uni.uploadFile({
						url: `${request.baseUrl}/community/publish`,
						filePath: image.path,
						name: 'images',
						formData: formData,
						success: (res) => {
							try {
								const data = JSON.parse(res.data);
								if (data.success === '成功') {
									uni.showToast({
										title: '发布成功',
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
							} catch (error) {
								console.error('解析响应失败:', error);
								uni.showToast({
									title: '发布失败',
									icon: 'none'
								});
								reject(error);
							}
						},
						fail: (error) => {
							console.error('上传失败:', error);
							uni.showToast({
								title: '上传失败',
								icon: 'none'
							});
							reject(error);
						}
					});
				});
			},
			
			// 上传单张图片（已废弃，保留以防需要）
			uploadImageOld(filePath) {
				return new Promise((resolve, reject) => {
					uni.uploadFile({
						url: `${request.baseUrl}/community/publish`,
						filePath: filePath,
						name: 'images',
						formData: {
							userid: uni.getStorageSync('userInfo')?.userid,
							content: this.postContent.trim(),
							classify: this.selectedCategory
						},
						success: (res) => {
							try {
								const data = JSON.parse(res.data);
								if (data.success === '成功') {
									resolve(data.result);
								} else {
									reject(new Error(data.msg));
								}
							} catch (error) {
								reject(error);
							}
						},
						fail: (error) => {
							reject(error);
						}
					});
				});
			}
		}
	}
</script>

<style scoped>
.publish-container {
	background-color: #f5f7fa;
	min-height: 100vh;
}

/* 发布按钮 */
.publish-btn {
	padding: 8rpx 24rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 20rpx;
	transition: opacity 0.3s ease;
}

.publish-btn.disabled {
	opacity: 0.5;
}

.publish-text {
	color: white;
	font-size: 28rpx;
	font-weight: 500;
}

/* 内容区域 */
.content {
	padding: 30rpx;
}

/* 分类选择 */
.category-section {
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 20rpx;
	display: block;
}

.category-scroll {
	white-space: nowrap;
}

.category-item {
	display: inline-block;
	padding: 16rpx 30rpx;
	margin-right: 20rpx;
	border-radius: 40rpx;
	background: #f8f9ff;
	border: 2rpx solid transparent;
	transition: all 0.3s ease;
}

.category-item.active {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-color: #667eea;
}

.category-text {
	font-size: 26rpx;
	color: #666;
}

.category-item.active .category-text {
	color: white;
	font-weight: 500;
}

/* 内容输入 */
.content-section {
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	position: relative;
}

.content-input {
	width: 100%;
	min-height: 200rpx;
	font-size: 30rpx;
	color: #333;
	line-height: 1.6;
	border: none;
	outline: none;
	resize: none;
}

.char-count {
	position: absolute;
	bottom: 20rpx;
	right: 30rpx;
	font-size: 24rpx;
	color: #999;
}

/* 图片上传 */
.image-section {
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
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

.preview-image {
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
	background: rgba(0, 0, 0, 0.6);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.add-image-btn {
	width: 200rpx;
	height: 200rpx;
	border: 2rpx dashed #ddd;
	border-radius: 12rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: #fafafa;
}

.add-text {
	font-size: 24rpx;
	color: #999;
	margin-top: 10rpx;
}
</style>