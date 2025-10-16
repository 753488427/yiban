<template>
	<view class="comment-container">
		<view class="comment-header">
			<text class="comment-title">评价 ({{commentList.length}})</text>
		</view>
		
		<view class="comment-list" v-if="commentList.length > 0">
			<view class="comment-item" v-for="(item, index) in commentList" :key="index">
				<view class="comment-user">
					<image class="user-avatar" :src="getAvatarUrl(item.avatar)" mode="aspectFill" @error="handleAvatarError" @click="goToUserPage(item.userid)"></image>
					<view class="user-info" @click="goToUserPage(item.userid)">
						<text class="user-name">{{item.username}}</text>
						<view class="comment-rating">
							<text class="star" v-for="star in 5" :key="star" :class="{'active': star <= item.rating}">⭐</text>
							<text class="rating-text">{{item.rating}}.0</text>
						</view>
					</view>
					<text class="comment-time">{{formatTime(item.time)}}</text>
				</view>
				
				<text class="comment-content">{{item.content}}</text>
				
				<view class="comment-images" v-if="item.images && item.images.length > 0">
					<image 
						class="comment-image" 
						v-for="(img, imgIndex) in item.images" 
						:key="imgIndex"
						:src="getImageUrl(img)" 
						mode="aspectFill"
						@click="previewImage(getImageUrl(img), item.images.map(image => getImageUrl(image)))"
						@error="handleImageError"
					></image>
				</view>
				
				<view class="comment-actions">
					<view class="action-btn" @click="likeComment(index)">
						<text class="action-icon" :class="{'liked': item.isLiked}">👍</text>
						<text class="action-text">{{item.likes}}</text>
					</view>
					<view class="action-btn" @click="toggleReply(index)">
						<text class="action-icon">💬</text>
						<text class="action-text">{{item.showReply ? '收起' : '回复'}}</text>
					</view>
					<!-- 查看回复按钮 (当有回复时显示) -->
					<view class="action-btn" @click="toggleReplies(index)" v-if="item.replyCount > 0">
						<text class="action-icon">👁️</text>
						<text class="action-text">{{item.showReplies ? '隐藏' : `查看${item.replyCount}条回复`}}</text>
					</view>
				</view>
				
				<!-- 回复输入框 -->
				<view class="reply-input-section" v-if="item.showReply">
					<view class="reply-input-wrapper">
						<textarea 
							class="reply-input"
							v-model="item.replyContent"
							:placeholder="`回复 ${item.username}...`"
							maxlength="200"
							:show-confirm-bar="false">
						</textarea>
						
						<!-- 回复图片预览 -->
						<view class="reply-image-preview" v-if="item.replyImage">
							<image class="preview-image" :src="item.replyImage" mode="aspectFill"></image>
							<view class="remove-image-btn" @click="removeReplyImage(index)">×</view>
						</view>
						
						<view class="reply-actions">
							<view class="reply-tools">
								<view class="image-btn" @click="selectReplyImage(index)">
									<text class="tool-icon">📷</text>
								</view>
								<text class="char-count">{{(item.replyContent || '').length}}/200</text>
							</view>
							<view class="reply-btns">
								<view class="cancel-btn" @click="cancelReply(index)">取消</view>
								<view class="send-btn" @click="sendReply(index)" :class="{ disabled: !(item.replyContent && item.replyContent.trim()) }">发送</view>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 回复列表 -->
				<view class="replies-section" v-if="item.showReplies && item.replies && item.replies.length > 0">
					<view class="reply-item" v-for="(reply, replyIndex) in item.replies" :key="replyIndex">
						<image class="reply-avatar" :src="getAvatarUrl(reply.avatar)" mode="aspectFill" @click="goToUserPage(reply.userid)"></image>
						<view class="reply-content">
							<text class="reply-user" @click="goToUserPage(reply.userid)">{{reply.username}}</text>
							<text class="reply-text">{{reply.content}}</text>
							<!-- 回复图片 -->
							<view class="reply-image-container" v-if="reply.image">
								<image 
									class="reply-image" 
									:src="getImageUrl(reply.image)" 
									mode="aspectFill"
									@click="previewImage(getImageUrl(reply.image), [getImageUrl(reply.image)])"
									@error="handleImageError">
								</image>
							</view>
							<text class="reply-time">{{formatTime(reply.time)}}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 加载状态 -->
		<view class="loading" v-else-if="loading">
			<text>加载评论中...</text>
		</view>
		
		<!-- 无评论状态 -->
		<view class="no-comments" v-else>
			<image src="/static/暂无 (1).png" class="no-comments-icon"></image>
			<text class="no-comments-text">暂无评价</text>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	import userUtil from '@/utils/user.js';
	import GoodsOperation from '../moudle/operation.js';
	
	export default {
		
		props: {
			goodsId: {
				type: [String, Number],
				required: true
			}
		},
		
		data() {
			return {
				commentList: [],
				loading: false,
				currentUser: null
			}
		},
		
		mounted() {
			this.getCurrentUser();
			this.getCommentList();
		},
		
		watch: {
			goodsId: {
				handler() {
					this.getCommentList();
				},
				immediate: true
			}
		},
		
		methods: {
			// 获取当前登录用户信息
			getCurrentUser() {
				this.currentUser = userUtil.getUserInfo();
			},
			
			// 获取评论列表
			async getCommentList() {
				if (!this.goodsId) return;
				
				this.loading = true;
				try {
					// 获取该商品的所有评论，不限制用户
					const requestData = {
						goods_id: this.goodsId
					};
					
					// 不需要限制用户ID，获取所有用户对该商品的评论
					
					const response = await request.post('/comments/', requestData);
					
					if (response.success === '成功' && response.result) {
						this.commentList = await Promise.all(response.result.map(async (item) => {
							// 获取该评论的回复数据
							const replies = await this.getRepliesForComment(item.comment_id);
							
							return {
								id: item.comment_id,
								userid: item.userid, // 评论用户ID
								username: item.username || `用户${item.userid}`, // 使用API返回的用户名
								avatar: item.user_image || `c${((item.userid % 9) + 1)}.png`, // 保存原始路径，在渲染时处理
								rating: 5, // API没有评分字段，默认5星
								content: item.content,
								time: item.time,
								likes: Math.floor(Math.random() * 20) + 1, // 随机生成点赞数
								isLiked: false,
								images: item.image ? [item.image] : [], // 保存原始路径，在渲染时处理
								replies: replies, // 使用真实的回复数据
								replyCount: replies.length, // 真实的回复数量
								showReply: false, // 是否显示回复输入框
								showReplies: false, // 是否显示回复列表
								replyContent: '', // 回复内容
								replyImage: null, // 回复图片
								replyImagePath: null // 回复图片路径（用于上传）
							};
						}));
					}
				} catch (error) {
					console.error('获取评论失败:', error);
					uni.showToast({
						title: '获取评论失败',
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
			
			// 预览图片
			previewImage(current, urls) {
				uni.previewImage({
					current: current,
					urls: urls
				});
			},
			
			// 点赞评论
			likeComment(index) {
				const comment = this.commentList[index];
				if (comment.isLiked) {
					comment.likes--;
					comment.isLiked = false;
				} else {
					comment.likes++;
					comment.isLiked = true;
				}
			},
			
			// 获取评论的回复数据
			async getRepliesForComment(commentId) {
				try {
					const response = await request.post('/reply/', {
						comment_id: commentId
					});
					
					if (response.success === '成功' && response.result) {
						return response.result.map(reply => ({
							id: reply.reply_id,
							userid: reply.userid, // 回复用户ID
							username: reply.username || `用户${reply.userid}`,
							avatar: reply.user_image || `c${((reply.userid % 9) + 1)}.png`,
							content: reply.reply_content,
							time: reply.reply_time,
							image: reply.reply_image
						}));
					}
					
					return [];
				} catch (error) {
					console.error('获取回复失败:', error);
					return [];
				}
			},
			
			// 切换回复输入框显示状态
			toggleReply(index) {
				// 检查用户是否已登录
				if (!this.currentUser || !this.currentUser.userid) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				
				const comment = this.commentList[index];
				comment.showReply = !comment.showReply;
				
				// 如果关闭回复框，清空内容
				if (!comment.showReply) {
					comment.replyContent = '';
				}
			},
			
			// 切换回复列表显示状态
			async toggleReplies(index) {
				const comment = this.commentList[index];
				comment.showReplies = !comment.showReplies;
				
				// 如果是展开回复列表，重新获取最新的回复数据
				if (comment.showReplies) {
					const latestReplies = await this.getRepliesForComment(comment.id);
					comment.replies = latestReplies;
					comment.replyCount = latestReplies.length;
				}
			},
			
			// 取消回复
			cancelReply(index) {
				const comment = this.commentList[index];
				comment.showReply = false;
				comment.replyContent = '';
				comment.replyImage = null;
				comment.replyImagePath = null;
			},
			
			// 选择回复图片
			selectReplyImage(index) {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						const comment = this.commentList[index];
						comment.replyImage = res.tempFilePaths[0];
						comment.replyImagePath = res.tempFilePaths[0];
					},
					fail: () => {
						uni.showToast({
							title: '选择图片失败',
							icon: 'none'
						});
					}
				});
			},
			
			// 移除回复图片
			removeReplyImage(index) {
				const comment = this.commentList[index];
				comment.replyImage = null;
				comment.replyImagePath = null;
			},
			
			// 发送回复
			async sendReply(index) {
				const comment = this.commentList[index];
				
				if (!comment.replyContent || !comment.replyContent.trim()) {
					uni.showToast({
						title: '请输入回复内容',
						icon: 'none'
					});
					return;
				}
				
				try {
					let replyImagePath = null;
					
					// 如果有图片，先上传图片
					if (comment.replyImagePath) {
						replyImagePath = await this.uploadReplyImage(comment.replyImagePath);
					}
					
					// 调用回复接口
					const response = await request.post('/reply/add', {
						comment_id: comment.id,
						reply_content: comment.replyContent.trim(),
						userid: this.currentUser.userid,
						reply_image: replyImagePath
					});
					
					if (response.success === '成功') {
						// 添加新回复到本地列表
						const newReply = {
							id: response.result.reply_id,
							username: this.currentUser.username || '我',
							avatar: this.currentUser.image || 'c1.png',
							content: comment.replyContent.trim(),
							time: response.result.reply_time || new Date().toISOString(),
							image: replyImagePath
						};
						
						comment.replies.unshift(newReply); // 添加到开头，因为接口按时间倒序
						comment.replyCount = comment.replies.length;
						comment.showReply = false;
						comment.replyContent = '';
						comment.replyImage = null;
						comment.replyImagePath = null;
						comment.showReplies = true; // 发送后自动展开回复列表
						
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
					console.error('发送回复失败:', error);
					uni.showToast({
						title: '发送失败',
						icon: 'none'
					});
				}
			},
			
			// 上传回复图片
			async uploadReplyImage(imagePath) {
				return new Promise((resolve, reject) => {
					uni.uploadFile({
						url: `${request.baseUrl}/reply/upload-image`,
						filePath: imagePath,
						name: 'image',
						success: (res) => {
							try {
								const data = JSON.parse(res.data);
								if (data.success === '成功') {
									resolve(data.imagePath);
								} else {
									console.error('图片上传失败:', data.msg);
									resolve(null);
								}
							} catch (error) {
								console.error('解析上传响应失败:', error);
								resolve(null);
							}
						},
						fail: (error) => {
							console.error('图片上传请求失败:', error);
							resolve(null);
						}
					});
				});
			},
			
			// 获取头像URL
			getAvatarUrl(avatarPath) {
				if (!avatarPath) {
					return '/static/c1.png'; // 默认头像
				}
				
				// 如果已经是完整的URL，直接返回
				if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
					return avatarPath;
				}
				
				// 如果是本地static路径，直接返回
				if (avatarPath.startsWith('/static/')) {
					return avatarPath;
				}
				
				// 如果是相对路径，拼接static路径
				if (avatarPath.startsWith('c') && avatarPath.endsWith('.png')) {
					return `/static/${avatarPath}`;
				}
				
				// 如果是uploads路径（服务器上传的头像）
				if (avatarPath.startsWith('uploads/')) {
					return GoodsOperation.getImageUrl(avatarPath);
				}
				
				// 默认处理
				return `/static/${avatarPath}`;
			},
			
			// 获取评论图片URL
			getImageUrl(imagePath) {
				return GoodsOperation.getImageUrl(imagePath);
			},
			
			// 处理头像加载错误
			handleAvatarError(e) {
				console.log('头像加载失败:', e);
				// 设置默认头像
				e.target.src = '/static/c1.png';
			},
			
			// 处理评论图片加载错误
			handleImageError(e) {
				console.log('评论图片加载失败:', e);
				// 设置默认图片
				e.target.src = '/static/暂无 (1).png';
			},
			
			// 跳转到用户页面
			goToUserPage(userid) {
				if (!userid) {
					uni.showToast({
						title: '用户信息不完整',
						icon: 'none'
					});
					return;
				}
				
				// 检查是否是当前用户自己
				if (this.currentUser && this.currentUser.userid == userid) {
					// 跳转到个人中心
					uni.switchTab({
						url: '/pages/Me/Me'
					});
				} else {
					// 跳转到用户详情页
					uni.navigateTo({
						url: `/pages/Home/function/user?userId=${userid}`
					});
				}
			}
		}
	}
</script>

<style>
.comment-container {
	background: white;
	margin-bottom: 20rpx;
}

.comment-header {
	padding: 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.comment-title {
	font-size: 28rpx;
	color: #333;
	font-weight: bold;
}

.comment-list {
	padding: 0 30rpx;
}

.comment-item {
	padding: 30rpx 0;
	border-bottom: 1rpx solid #f8f8f8;
}

.comment-item:last-child {
	border-bottom: none;
}

.comment-user {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.user-avatar {
	width: 60rpx;
	height: 60rpx;
	border-radius: 30rpx;
	margin-right: 20rpx;
}

.user-info {
	flex: 1;
}

.user-name {
	font-size: 26rpx;
	color: #333;
	font-weight: bold;
	display: block;
	margin-bottom: 8rpx;
}

.comment-rating {
	display: flex;
	align-items: center;
}

.star {
	font-size: 20rpx;
	color: #ddd;
	margin-right: 4rpx;
}

.star.active {
	color: #ffa500;
}

.rating-text {
	font-size: 22rpx;
	color: #666;
	margin-left: 10rpx;
}

.comment-time {
	font-size: 22rpx;
	color: #999;
}

.comment-content {
	font-size: 26rpx;
	color: #333;
	line-height: 1.6;
	margin-bottom: 20rpx;
}

.comment-images {
	display: flex;
	gap: 15rpx;
	margin-bottom: 20rpx;
	flex-wrap: wrap;
}

.comment-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: 8rpx;
}

.comment-actions {
	display: flex;
	gap: 40rpx;
}

.action-btn {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.action-icon {
	font-size: 24rpx;
	color: #999;
}

.action-icon.liked {
	color: #667eea;
}

.action-text {
	font-size: 22rpx;
	color: #999;
}

/* 回复输入区域 */
.reply-input-section {
	margin-top: 20rpx;
	padding: 20rpx;
	background: #f8f9fa;
	border-radius: 12rpx;
	border: 1rpx solid #e9ecef;
}

.reply-input-wrapper {
	display: flex;
	flex-direction: column;
	gap: 15rpx;
}

.reply-input {
	min-height: 80rpx;
	padding: 15rpx;
	background: white;
	border-radius: 8rpx;
	border: 1rpx solid #ddd;
	font-size: 26rpx;
	color: #333;
	line-height: 1.4;
}

.reply-input:focus {
	border-color: #667eea;
}

/* 回复图片预览 */
.reply-image-preview {
	position: relative;
	width: 120rpx;
	height: 120rpx;
	margin: 15rpx 0;
}

.preview-image {
	width: 100%;
	height: 100%;
	border-radius: 8rpx;
}

.remove-image-btn {
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
	font-weight: bold;
}

.reply-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.reply-tools {
	display: flex;
	align-items: center;
	gap: 15rpx;
}

.image-btn {
	width: 40rpx;
	height: 40rpx;
	background: #f0f2ff;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;
}

.image-btn:active {
	background: #e0e4ff;
	transform: scale(0.95);
}

.tool-icon {
	font-size: 20rpx;
}

.char-count {
	font-size: 20rpx;
	color: #999;
}

.reply-btns {
	display: flex;
	gap: 15rpx;
}

.cancel-btn, .send-btn {
	padding: 8rpx 20rpx;
	border-radius: 20rpx;
	font-size: 24rpx;
	text-align: center;
	transition: all 0.3s ease;
}

.cancel-btn {
	background: #f5f5f5;
	color: #666;
}

.cancel-btn:active {
	background: #e9ecef;
}

.send-btn {
	background: #667eea;
	color: white;
}

.send-btn:active {
	background: #5a6fd8;
	transform: scale(0.95);
}

.send-btn.disabled {
	background: #ccc;
	color: #999;
}

.send-btn.disabled:active {
	transform: none;
}

/* 回复列表区域 */
.replies-section {
	margin-top: 20rpx;
	padding: 20rpx;
	background: #f8f9fa;
	border-radius: 12rpx;
	border-left: 4rpx solid #667eea;
}

.reply-item {
	display: flex;
	align-items: flex-start;
	gap: 15rpx;
	padding: 15rpx 0;
	border-bottom: 1rpx solid #e9ecef;
}

.reply-item:last-child {
	border-bottom: none;
	padding-bottom: 0;
}

.reply-avatar {
	width: 40rpx;
	height: 40rpx;
	border-radius: 20rpx;
	flex-shrink: 0;
}

.reply-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 5rpx;
}

.reply-user {
	font-size: 22rpx;
	color: #667eea;
	font-weight: 500;
}

.reply-text {
	font-size: 24rpx;
	color: #333;
	line-height: 1.4;
}

.reply-time {
	font-size: 20rpx;
	color: #999;
}

/* 回复图片容器 */
.reply-image-container {
	margin: 10rpx 0;
}

.reply-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: 8rpx;
	border: 1rpx solid #e9ecef;
}

/* 加载状态 */
.loading {
	text-align: center;
	padding: 80rpx 0;
	color: #999;
	font-size: 26rpx;
}

.no-comments {
	text-align: center;
	padding: 100rpx 0;
}

.no-comments-icon {
	width: 120rpx;
	height: 120rpx;
	margin-bottom: 20rpx;
	opacity: 0.3;
}

.no-comments-text {
	display: block;
	font-size: 26rpx;
	color: #999;
}
</style>
