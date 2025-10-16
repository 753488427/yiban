<template>
	<view class="reply-comments-container">
		<view class="reply-header">
			<text class="reply-title">回复 ({{replyList.length}})</text>
		</view>
		
		<view class="reply-list" v-if="replyList.length > 0">
			<view class="reply-item" v-for="(item, index) in replyList" :key="index">
				<view class="reply-user">
					<image class="user-avatar" :src="getAvatarUrl(item.avatar)" mode="aspectFill" @error="handleAvatarError"></image>
					<view class="user-info">
						<text class="user-name">{{item.username}}</text>
						<text class="reply-time">{{formatTime(item.reply_time)}}</text>
					</view>
				</view>
				
				<text class="reply-content">{{item.reply_content}}</text>
				
				<view class="reply-images" v-if="item.reply_image">
					<image 
						class="reply-image" 
						:src="getImageUrl(item.reply_image)" 
						mode="aspectFill"
						@click="previewImage(getImageUrl(item.reply_image))"
						@error="handleImageError"
					></image>
				</view>
				
				<view class="reply-actions">
					<view class="action-btn" @click="likeReply(index)">
						<text class="action-icon" :class="{'liked': item.isLiked}">👍</text>
						<text class="action-text">{{item.likes}}</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 加载状态 -->
		<view class="loading" v-else-if="loading">
			<text>加载回复中...</text>
		</view>
		
		<!-- 无回复状态 -->
		<view class="no-replies" v-else>
			<image src="/static/暂无 (1).png" class="no-replies-icon"></image>
			<text class="no-replies-text">暂无回复</text>
		</view>
		
		<!-- 回复输入框 -->
		<view class="reply-input-container" v-if="showReplyInput && currentUser">
			<view class="reply-input-header">
				<text class="reply-input-title">添加回复</text>
				<text class="reply-input-close" @click="hideReplyInput">✕</text>
			</view>
			
			<view class="reply-input-content">
				<textarea 
					class="reply-textarea" 
					v-model="replyContent" 
					placeholder="请输入回复内容..."
					:maxlength="500"
					auto-height
				></textarea>
				
				<!-- 图片上传区域 -->
				<view class="reply-image-section">
					<view class="reply-image-upload" @click="chooseImage" v-if="!replyImage">
						<text class="upload-icon">📷</text>
						<text class="upload-text">添加图片</text>
					</view>
					
					<!-- 已选择的图片预览 -->
					<view class="reply-image-preview" v-if="replyImage">
						<image 
							class="preview-image" 
							:src="replyImage" 
							mode="aspectFill"
							@click="previewReplyImage"
						></image>
						<view class="image-delete" @click="deleteReplyImage">✕</view>
					</view>
				</view>
				
				<view class="reply-input-actions">
					<view class="reply-char-count">{{replyContent.length}}/500</view>
					<view class="reply-btn-group">
						<button class="reply-btn cancel-btn" @click="hideReplyInput">取消</button>
						<button class="reply-btn submit-btn" @click="submitReply" :disabled="(!replyContent.trim() && !replyImage) || submitting">
							{{submitting ? '提交中...' : '发布'}}
						</button>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	import userUtil from '@/utils/user.js';
	import GoodsOperation from './operation.js';
	
	export default {
		props: {
			commentId: {
				type: [String, Number],
				required: true
			},
			userId: {
				type: [String, Number],
				default: null
			},
			showAllReplies: {
				type: Boolean,
				default: true // 默认显示所有回复，而不仅仅是当前用户的回复
			}
		},
		
		data() {
			return {
				replyList: [],
				loading: false,
				currentUser: null,
				showReplyInput: false,
				replyContent: '',
				replyImage: '', // 回复图片路径
				submitting: false
			}
		},
		
		mounted() {
			this.getCurrentUser();
			this.getReplyList();
		},
		
		watch: {
			commentId: {
				handler() {
					this.getReplyList();
				},
				immediate: true
			},
			userId: {
				handler() {
					this.getReplyList();
				}
			}
		},
		
		methods: {
			// 获取当前登录用户信息
			getCurrentUser() {
				this.currentUser = userUtil.getUserInfo();
			},
			
			// 获取回复列表
			async getReplyList() {
				if (!this.commentId) return;
				
				this.loading = true;
				try {
					const requestData = {
						comment_id: this.commentId
					};
					
					// 根据showAllReplies属性决定是否只获取当前用户的回复
					if (!this.showAllReplies && this.userId) {
						requestData.userid = this.userId;
					}
					// 如果showAllReplies为true，则不传userid，获取所有回复
					
					const response = await request.post('/reply', requestData);
					
					if (response.success === '成功' && response.result) {
						this.replyList = response.result.map(item => ({
							id: item.reply_id,
							userid: item.userid,
							comment_id: item.comment_id,
							reply_content: item.reply_content,
							reply_image: item.reply_image,
							reply_time: item.reply_time,
							username: item.username || `用户${item.userid}`, // 使用API返回的用户名
							avatar: item.user_image || `c${((item.userid % 9) + 1)}.png`, // 使用API返回的用户头像
							likes: Math.floor(Math.random() * 10) + 1, // 随机生成点赞数
							isLiked: false
						}));
					} else {
						this.replyList = [];
					}
				} catch (error) {
					console.error('获取回复失败:', error);
					this.replyList = [];
					uni.showToast({
						title: '获取回复失败',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
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
			
			// 预览图片（通用方法）
			previewImage(current, urls = []) {
				uni.previewImage({
					current: current,
					urls: urls.length > 0 ? urls : [current]
				});
			},
			
			// 点赞回复
			likeReply(index) {
				const reply = this.replyList[index];
				if (reply.isLiked) {
					reply.likes--;
					reply.isLiked = false;
				} else {
					reply.likes++;
					reply.isLiked = true;
				}
			},
			
			// 获取图片URL（通用方法）
			getImageUrl(imagePath, isAvatar = false) {
				if (!imagePath) {
					return isAvatar ? '/static/c1.png' : '/static/暂无 (1).png';
				}
				
				// 如果已经是完整的URL，直接返回
				if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
					return imagePath;
				}
				
				// 如果是uploads路径（服务器上传的文件）
				if (imagePath.startsWith('uploads/')) {
					return GoodsOperation.getImageUrl(imagePath);
				}
				
				// 默认处理
				return isAvatar ? `/static/${imagePath}` : GoodsOperation.getImageUrl(imagePath);
			},
			
			// 获取头像URL
			getAvatarUrl(avatarPath) {
				return this.getImageUrl(avatarPath, true);
			},
			
			// 处理图片加载错误（通用方法）
			handleImageError(e, isAvatar = false) {
				console.log(`${isAvatar ? '头像' : '图片'}加载失败:`, e);
				e.target.src = isAvatar ? '/static/c1.png' : '/static/暂无 (1).png';
			},
			
			// 处理头像加载错误
			handleAvatarError(e) {
				this.handleImageError(e, true);
			},
			
			// 刷新回复列表（供外部调用）
			refresh() {
				this.getReplyList();
			},
			
			// 显示回复输入框（供外部调用）
			showReplyInputBox() {
				if (!this.currentUser || !this.currentUser.userid) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				
				this.showReplyInput = true;
				this.replyContent = '';
			},
			
			// 隐藏回复输入框
			hideReplyInput() {
				this.showReplyInput = false;
				this.replyContent = '';
				this.replyImage = '';
			},
			
			// 选择图片
			chooseImage() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						const tempFilePath = res.tempFilePaths[0];
						this.replyImage = tempFilePath;
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
			
			// 预览回复图片
			previewReplyImage() {
				if (this.replyImage) {
					this.previewImage(this.replyImage);
				}
			},
			
			// 删除回复图片
			deleteReplyImage() {
				this.replyImage = '';
			},
			
			// 上传图片到服务器
			async uploadImage(imagePath) {
				return new Promise((resolve, reject) => {
					uni.uploadFile({
						url: `${request.baseUrl}/reply/upload-image`,
						filePath: imagePath,
						name: 'image',
						formData: {
							userid: this.currentUser.userid
						},
						success: (res) => {
							try {
								const data = JSON.parse(res.data);
								if (data.success === '成功') {
									resolve(data.imagePath);
								} else {
									reject(new Error(data.msg || '上传失败'));
								}
							} catch (error) {
								reject(new Error('解析响应失败'));
							}
						},
						fail: (error) => {
							reject(new Error('上传请求失败'));
						}
					});
				});
			},
			
			// 提交回复
			async submitReply() {
				if (!this.replyContent.trim() && !this.replyImage) {
					uni.showToast({
						title: '请输入回复内容或选择图片',
						icon: 'none'
					});
					return;
				}
				
				if (!this.currentUser || !this.currentUser.userid) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				
				this.submitting = true;
				try {
					let replyImagePath = null;
					
					// 如果有选择图片，先上传图片
					if (this.replyImage) {
						try {
							replyImagePath = await this.uploadImage(this.replyImage);
						} catch (error) {
							console.error('图片上传失败:', error);
							uni.showToast({
								title: '图片上传失败',
								icon: 'none'
							});
							this.submitting = false;
							return;
						}
					}
					
					const requestData = {
						userid: this.currentUser.userid,
						comment_id: this.commentId,
						reply_content: this.replyContent.trim() || '', // 允许空内容但有图片
						reply_image: replyImagePath
					};
					
					const response = await request.post('/reply/add', requestData);
					
					if (response.success === '成功') {
						uni.showToast({
							title: '回复成功',
							icon: 'success'
						});
						
						// 隐藏输入框
						this.hideReplyInput();
						
						// 刷新回复列表
						await this.getReplyList();
						
						// 通知父组件回复成功
						this.$emit('reply-success');
					} else {
						throw new Error(response.msg || '回复失败');
					}
				} catch (error) {
					console.error('提交回复失败:', error);
					uni.showToast({
						title: error.message || '回复失败，请重试',
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
.reply-comments-container {
	background: #f8f9fa;
	border-radius: 12rpx;
	margin-top: 20rpx;
}

.reply-header {
	padding: 20rpx 30rpx;
	border-bottom: 1rpx solid #e9ecef;
}

.reply-title {
	font-size: 24rpx;
	color: #666;
	font-weight: bold;
}

.reply-list {
	padding: 0 30rpx;
}

.reply-item {
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.reply-item:last-child {
	border-bottom: none;
}

.reply-user {
	display: flex;
	align-items: center;
	margin-bottom: 15rpx;
}

.user-avatar {
	width: 50rpx;
	height: 50rpx;
	border-radius: 25rpx;
	margin-right: 15rpx;
}

.user-info {
	flex: 1;
}

.user-name {
	font-size: 24rpx;
	color: #333;
	font-weight: bold;
	display: block;
	margin-bottom: 4rpx;
}

.reply-time {
	font-size: 20rpx;
	color: #999;
}

.reply-content {
	font-size: 24rpx;
	color: #333;
	line-height: 1.6;
	margin-bottom: 15rpx;
	display: block;
}

.reply-images {
	margin-bottom: 15rpx;
}

.reply-image {
	width: 100rpx;
	height: 100rpx;
	border-radius: 8rpx;
}

.reply-actions {
	display: flex;
	gap: 30rpx;
}

.action-btn {
	display: flex;
	align-items: center;
	gap: 6rpx;
}

.action-icon {
	font-size: 20rpx;
	color: #999;
}

.action-icon.liked {
	color: #667eea;
}

.action-text {
	font-size: 20rpx;
	color: #999;
}

/* 加载和空状态 */
.loading,
.no-replies {
	text-align: center;
	padding: 60rpx 0;
	color: #999;
	font-size: 24rpx;
}

.no-replies-icon {
	width: 80rpx;
	height: 80rpx;
	margin-bottom: 15rpx;
	opacity: 0.3;
}

.no-replies-text {
	display: block;
}

/* 回复输入框样式 */
.reply-input-container {
	background: white;
	border-radius: 12rpx;
	margin-top: 20rpx;
	border: 1rpx solid #e9ecef;
}

.reply-input-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.reply-input-title {
	font-size: 26rpx;
	color: #333;
	font-weight: bold;
}

.reply-input-close {
	font-size: 30rpx;
	color: #999;
	padding: 10rpx;
}

.reply-input-content {
	padding: 30rpx;
}

.reply-textarea {
	width: 100%;
	min-height: 120rpx;
	padding: 20rpx;
	border: 1rpx solid #e9ecef;
	border-radius: 8rpx;
	font-size: 26rpx;
	color: #333;
	background: #fafafa;
	box-sizing: border-box;
}

.reply-textarea:focus {
	border-color: #667eea;
	background: white;
}

.reply-input-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 20rpx;
}

.reply-char-count {
	font-size: 22rpx;
	color: #999;
}

.reply-btn-group {
	display: flex;
	gap: 20rpx;
}

.reply-btn {
	padding: 16rpx 32rpx;
	border-radius: 6rpx;
	font-size: 24rpx;
	border: none;
	cursor: pointer;
}

.cancel-btn {
	background: #f8f9fa;
	color: #666;
}

.submit-btn {
	background: #667eea;
	color: white;
}

.submit-btn:disabled {
	background: #ccc;
	color: #999;
}

/* 图片上传区域样式 */
.reply-image-section {
	margin-top: 20rpx;
}

.reply-image-upload {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 120rpx;
	height: 120rpx;
	border: 2rpx dashed #ddd;
	border-radius: 8rpx;
	background: #fafafa;
	cursor: pointer;
}


.upload-icon {
	font-size: 40rpx;
	color: #999;
	margin-bottom: 8rpx;
}

.upload-text {
	font-size: 20rpx;
	color: #999;
}

.reply-image-preview {
	position: relative;
	width: 120rpx;
	height: 120rpx;
}

.preview-image {
	width: 100%;
	height: 100%;
	border-radius: 8rpx;
}

.image-delete {
	position: absolute;
	top: -8rpx;
	right: -8rpx;
	width: 32rpx;
	height: 32rpx;
	background: #ff4757;
	color: white;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 20rpx;
	cursor: pointer;
}
</style>