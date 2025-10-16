<template>
	<view class="detail-container">
		<!-- 动态详情 -->
		<view class="post-detail" v-if="postDetail">
			<!-- 用户信息 -->
			<view class="post-header">
				<image 
					class="user-avatar" 
					:src="getUserAvatar(postDetail)" 
					mode="aspectFill"
					@error="handleAvatarError"
					@click="goToUserProfile(postDetail.userid)">
				</image>
				<view class="user-info" @click="goToUserProfile(postDetail.userid)">
					<text class="username">{{postDetail.username || '匿名用户'}}</text>
					<text class="post-time">{{formatTime(postDetail.time)}}</text>
				</view>
				<view class="post-tag">{{getClassifyIcon(postDetail.classify)}}{{postDetail.classify}}</view>
			</view>
			
			<!-- 动态内容 -->
			<view class="post-content">
				<text class="post-text">{{postDetail.content}}</text>
				<view class="post-images" v-if="getPostImages(postDetail).length > 0">
					<image 
						class="post-image" 
						v-for="(img, imgIndex) in getPostImages(postDetail)" 
						:key="imgIndex"
						:src="getImageUrl(img)" 
						mode="aspectFill"
						@click="previewImage(getPostImages(postDetail).map(image => getImageUrl(image)), imgIndex)"
						@error="handleImageError">
					</image>
				</view>
			</view>
			
			<!-- 互动区域 -->
			<view class="post-actions">
				<view class="action-item" @click="toggleLike">
					<text class="action-icon" :class="{'liked': isLiked}">{{isLiked ? '❤️' : '🤍'}}</text>
					<text class="action-text">{{likeCount}}</text>
				</view>
				<view class="action-item">
					<text class="action-icon">💬</text>
					<text class="action-text">{{respondList.length}}</text>
				</view>
				<view class="action-item" @click="sharePost">
					<text class="action-icon">📤</text>
					<text class="action-text">分享</text>
				</view>
			</view>
		</view>
		
		<!-- 回复列表 -->
		<view class="respond-section">
			<view class="section-title">
				<text class="title-text">回复 ({{respondList.length}})</text>
			</view>
			
			<!-- 回复列表 -->
			<view class="respond-list" v-if="respondList.length > 0">
				<view class="respond-item" v-for="(item, index) in respondList" :key="index">
					<image 
						class="respond-avatar" 
						:src="getUserAvatar(item)" 
						mode="aspectFill"
						@error="handleAvatarError">
					</image>
					<view class="respond-content">
						<view class="respond-header">
							<text class="respond-username">{{item.username || '匿名用户'}}</text>
							<text class="respond-time">{{formatTime(item.time)}}</text>
						</view>
						<text class="respond-text">{{item.respond_content}}</text>
						<br>
						<!-- 回复图片 -->
						<image 
							v-if="item.respond_image" 
							class="respond-image" 
							:src="getImageUrl(item.respond_image)" 
							mode="aspectFill"
							@click="previewImage([getImageUrl(item.respond_image)], 0)"
							@error="handleImageError">
						</image>
					</view>
				</view>
			</view>
			
			<!-- 无回复状态 -->
			<view class="no-responds" v-else-if="!loading">
				<image src="/static/暂无 (1).png" class="no-responds-icon"></image>
				<br>
				<text class="no-responds-text">暂无回复</text>
			</view>
			
			<!-- 加载状态 -->
			<view class="loading" v-if="loading">
				<text>加载中...</text>
			</view>
		</view>
		
		<!-- 回复输入框 -->
		<view class="reply-input-area">
			<view class="input-wrapper">
				<input 
					class="reply-input" 
					v-model="replyContent"
					placeholder="写下你的回复..."
					maxlength="200">
				<view class="image-btn" @click="chooseImage">
					<uni-icons type="image" size="24" color="#666"></uni-icons>
				</view>
			</view>
			<view class="reply-btn" :class="{'active': canReply}" @click="submitReply">
				<text class="reply-text">发送</text>
			</view>
		</view>
		
		<!-- 选中的图片预览 -->
		<view class="selected-image-preview" v-if="selectedImage">
			<image class="preview-image" :src="selectedImage" mode="aspectFill"></image>
			<view class="remove-image" @click="removeSelectedImage">
				<text class="remove-text">×</text>
			</view>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	
	export default {
		data() {
			return {
				postId: '',
				userId: '',
				username: '',
				postDetail: null,
				respondList: [],
				loading: false,
				replyContent: '',
				selectedImage: '',
				selectedImagePath: '',
				isLiked: false,
				likeCount: 0,
				currentUser: null
			}
		},
		
		computed: {
			canReply() {
				return this.replyContent.trim().length > 0;
			}
		},
		
		onLoad(options) {
			this.postId = options.postId;
			this.userId = options.userId;
			this.username = decodeURIComponent(options.username || '');
			
			// 获取当前用户信息
			this.getCurrentUser();
			
			// 加载动态详情和回复数据
			this.loadPostDetail();
			this.loadRespondList();
		},
		
		methods: {
			// 获取当前用户信息
			getCurrentUser() {
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo) {
					this.currentUser = userInfo;
				}
			},
			
			// 加载动态详情
			async loadPostDetail() {
				try {
					// 从社区接口获取动态详情
					const response = await request.post('/community');
					
					if (response.success === '成功' && response.result) {
						// 找到对应的动态
						const post = response.result.find(item => item.community_id == this.postId);
						if (post) {
							this.postDetail = post;
							this.likeCount = Math.floor(Math.random() * 50) + 1; // 随机生成点赞数
							this.isLiked = false;
						}
					}
				} catch (error) {
					console.error('加载动态详情失败:', error);
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					});
				}
			},
			
			// 加载回复列表
			async loadRespondList() {
				this.loading = true;
				try {
					const response = await request.post('/respond', {
						community_id: this.postId
					});
					
					
					if (response.success === '成功') {
						this.respondList = response.result || [];
						console.log('当前动态的回复列表:', this.respondList);
					} else {
						this.respondList = [];
						console.log('接口返回失败:', response.msg);
					}
				} catch (error) {
					console.error('加载回复失败:', error);
					this.respondList = [];
					uni.showToast({
						title: '加载回复失败',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},
			
			// 提交回复
			async submitReply() {
				if (!this.canReply) return;
				
				// 检查用户是否登录
				if (!this.currentUser || !this.currentUser.userid) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				
				const content = this.replyContent.trim();
				
				uni.showLoading({
					title: '发送中...',
					mask: true
				});
				
				try {
					let response;
					
					// 如果有选中的图片，使用上传接口
					if (this.selectedImagePath) {
						response = await uni.uploadFile({
							url: `${request.baseUrl}/respond/add`,
							filePath: this.selectedImagePath,
							name: 'image',
							formData: {
								userid: this.currentUser.userid,
								community_id: this.postId,
								respond_content: content
							}
						});
						
						const data = JSON.parse(response.data);
						response = data;
					} else {
						// 没有图片，直接发送文字
						response = await request.post('/respond/add', {
							userid: this.currentUser.userid,
							community_id: this.postId,
							respond_content: content
						});
					}
					
					uni.hideLoading();
					
					if (response.success === '成功') {
						// 清空输入
						this.replyContent = '';
						this.selectedImage = '';
						this.selectedImagePath = '';
						
						// 重新加载回复列表
						await this.loadRespondList();
						
						uni.showToast({
							title: '回复成功',
							icon: 'success'
						});
					} else {
						uni.showToast({
							title: response.msg || '回复失败',
							icon: 'none'
						});
					}
				} catch (error) {
					uni.hideLoading();
					console.error('回复失败:', error);
					uni.showToast({
						title: '回复失败',
						icon: 'none'
					});
				}
			},
			
			// 点赞/取消点赞
			toggleLike() {
				this.isLiked = !this.isLiked;
				if (this.isLiked) {
					this.likeCount++;
					uni.showToast({ title: '点赞成功', icon: 'success' });
				} else {
					this.likeCount--;
					uni.showToast({ title: '取消点赞', icon: 'none' });
				}
			},
			
			// 分享动态
			sharePost() {
				uni.showToast({ title: '分享功能开发中', icon: 'none' });
			},
			
			// 跳转到用户页面
			goToUserProfile(userid) {
				if (!userid) return;
				
				uni.navigateTo({
					url: `/pages/Home/function/user?userId=${userid}`
				});
			},
			
			// 预览图片
			previewImage(images, current) {
				uni.previewImage({
					urls: images,
					current: current
				});
			},
			
			// 获取用户头像
			getUserAvatar(user) {
				if (!user) {
					return '/static/c1.png';
				}
				
				if (user.user_image) {
					return this.getImageUrl(user.user_image);
				}
				if (user.image) {
					return this.getImageUrl(user.image);
				}
				
				// 使用默认头像
				const avatarIndex = (user.user_id || user.userid || 1) % 9 + 1;
				return `/static/c${avatarIndex}.png`;
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
			
			// 获取动态图片列表
			getPostImages(post) {
				const images = [];
				if (post.community_image) images.push(post.community_image);
				return images;
			},
			
			// 获取图片URL
			getImageUrl(imagePath) {
				if (!imagePath) return '';
				
				if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
					return imagePath;
				}
				
				if (imagePath.startsWith('uploads/')) {
					return `${request.baseUrl}/${imagePath}`;
				}
				
				return imagePath;
			},
			
			// 格式化时间
			formatTime(timeStr) {
				if (!timeStr) return '';
				
				const time = new Date(timeStr);
				const now = new Date();
				const diff = now - time;
				
				const minutes = Math.floor(diff / (1000 * 60));
				const hours = Math.floor(diff / (1000 * 60 * 60));
				const days = Math.floor(diff / (1000 * 60 * 60 * 24));
				
				if (minutes < 60) {
					return minutes <= 0 ? '刚刚' : `${minutes}分钟前`;
				} else if (hours < 24) {
					return `${hours}小时前`;
				} else if (days < 7) {
					return `${days}天前`;
				} else {
					return time.toLocaleDateString();
				}
			},
			
			// 处理图片加载错误
			handleImageError(e) {
				console.log('图片加载失败:', e);
				e.target.src = '/static/暂无 (1).png';
			},
			
			// 处理头像加载错误
			handleAvatarError(e) {
				console.log('头像加载失败:', e);
				e.target.src = '/static/c1.png';
			},
			
			// 选择图片
			chooseImage() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						const filePath = res.tempFilePaths[0];
						this.selectedImagePath = filePath;
						this.selectedImage = filePath;
					},
					fail: (err) => {
						if (err.errMsg !== 'chooseImage:fail cancel') {
							uni.showToast({
								title: '选择图片失败',
								icon: 'none'
							});
						}
					}
				});
			},
			
			// 移除选中的图片
			removeSelectedImage() {
				this.selectedImage = '';
				this.selectedImagePath = '';
			}
		}
	}
</script>

<style>
.detail-container {
	background-color: #f5f7fa;
	min-height: 100vh;
	padding-bottom: 120rpx;
}

/* 动态详情 */
.post-detail {
	background: white;
	margin-bottom: 20rpx;
	padding: 30rpx;
}

/* 动态头部 */
.post-header {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.user-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	margin-right: 20rpx;
}

.user-info {
	flex: 1;
}

.username {
	font-size: 28rpx;
	font-weight: 500;
	color: #333;
	display: block;
	margin-bottom: 8rpx;
}

.post-time {
	font-size: 22rpx;
	color: #999;
	display: block;
}

.post-tag {
	background: #f0f8ff;
	color: #667eea;
	padding: 8rpx 16rpx;
	border-radius: 20rpx;
	font-size: 22rpx;
}

/* 动态内容 */
.post-content {
	margin-bottom: 20rpx;
}

.post-text {
	font-size: 28rpx;
	color: #333;
	line-height: 1.6;
	display: block;
	margin-bottom: 20rpx;
}

.post-images {
	display: flex;
	flex-wrap: wrap;
	gap: 10rpx;
}

.post-image {
	width: 200rpx;
	height: 200rpx;
	border-radius: 12rpx;
	flex-shrink: 0;
}

/* 互动区域 */
.post-actions {
	display: flex;
	justify-content: space-around;
	padding-top: 20rpx;
	border-top: 1rpx solid #f5f5f5;
}

.action-item {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 10rpx 20rpx;
	border-radius: 20rpx;
	transition: background-color 0.3s ease;
}

.action-item:active {
	background-color: #f8f9ff;
}

.action-icon {
	font-size: 32rpx;
}

.action-icon.liked {
	animation: heartBeat 0.6s ease-in-out;
}

@keyframes heartBeat {
	0% { transform: scale(1); }
	50% { transform: scale(1.2); }
	100% { transform: scale(1); }
}

.action-text {
	font-size: 24rpx;
	color: #666;
}

/* 回复区域 */
.respond-section {
	background: white;
	margin-bottom: 20rpx;
}

.section-title {
	padding: 30rpx 30rpx 20rpx;
	border-bottom: 1rpx solid #f5f5f5;
}

.title-text {
	font-size: 28rpx;
	font-weight: 500;
	color: #333;
}

/* 回复列表 */
.respond-list {
	padding: 0 30rpx;
}

.respond-item {
	display: flex;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f8f8f8;
}

.respond-item:last-child {
	border-bottom: none;
}

.respond-avatar {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	margin-right: 20rpx;
	flex-shrink: 0;
}

.respond-content {
	flex: 1;
}

.respond-header {
	display: flex;
	align-items: center;
	margin-bottom: 8rpx;
}

.respond-username {
	font-size: 24rpx;
	color: #666;
	margin-right: 20rpx;
}

.respond-time {
	font-size: 22rpx;
	color: #999;
}

.respond-text {
	font-size: 26rpx;
	color: #333;
	line-height: 1.5;
	margin-bottom: 10rpx;
}

.respond-image {
	width: 200rpx;
	height: 200rpx;
	border-radius: 8rpx;
	margin-top: 10rpx;
}

/* 无回复状态 */
.no-responds {
	text-align: center;
	padding: 60rpx 30rpx;
}

.no-responds-icon {
	width: 120rpx;
	height: 120rpx;
	margin-bottom: 20rpx;
	opacity: 0.3;
}

.no-responds-text {
	font-size: 24rpx;
	color: #999;
}

/* 加载状态 */
.loading {
	text-align: center;
	padding: 40rpx 0;
	color: #666;
	font-size: 24rpx;
}

/* 回复输入框 */
.reply-input-area {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: white;
	padding: 20rpx 30rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	border-top: 1rpx solid #eee;
	display: flex;
	align-items: center;
	gap: 20rpx;
	margin-bottom: 5px;
}

.input-wrapper {
	flex: 1;
	display: flex;
	align-items: center;
	background: #f8f9fa;
	border-radius: 35rpx;
	padding-right: 16rpx;
}

.reply-input {
	flex: 1;
	height: 70rpx;
	padding: 0 24rpx;
	font-size: 26rpx;
	color: #333;
	background: transparent;
	border: none;
}

.image-btn {
	width: 40rpx;
	height: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 8rpx;
	background: #fff;
}

.reply-btn {
	width: 120rpx;
	height: 70rpx;
	background: #ccc;
	border-radius: 35rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background-color 0.3s ease;
}

.reply-btn.active {
	background: #667eea;
}

.reply-text {
	font-size: 26rpx;
	color: white;
	font-weight: 500;
}

/* 选中图片预览 */
.selected-image-preview {
	position: fixed;
	bottom: 120rpx;
	left: 30rpx;
	right: 30rpx;
	background: white;
	border-radius: 12rpx;
	padding: 20rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	z-index: 1000;
}

.preview-image {
	width: 100%;
	height: 200rpx;
	border-radius: 8rpx;
}

.remove-image {
	position: absolute;
	top: 10rpx;
	right: 10rpx;
	width: 40rpx;
	height: 40rpx;
	background: rgba(0, 0, 0, 0.6);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.remove-text {
	color: white;
	font-size: 24rpx;
	font-weight: bold;
}
</style>
