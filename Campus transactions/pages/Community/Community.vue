<template>
	<view class="community-container">
		<!-- 分类标签 -->
		<view class="category-tabs">
			<scroll-view class="tabs-scroll" scroll-x="true" show-scrollbar="false">
				<view class="tab-item" 
					v-for="(item, index) in categoryList" 
					:key="index"
					:class="{'active': activeCategory === item.id}"
					@click="switchCategory(item.id)">
					<text class="tab-text">{{item.icon}} {{item.name}}</text>
				</view>
			</scroll-view>
		</view>
		
		<!-- 社区动态列表 -->
		<scroll-view class="post-list" scroll-y="true" @scrolltolower="loadMore">
			<!-- 加载状态 -->
			<view class="loading" v-if="loading">
				<text>加载中...</text>
			</view>
			
			<view class="post-item" v-for="(post, index) in postList" :key="post.community_id" @click="goToPostDetail(post)">
				<!-- 用户信息 -->
				<view class="post-header">
					<image 
						class="user-avatar" 
						:src="getUserAvatar(post)" 
						mode="aspectFill"
						@error="handleAvatarError"
						@click.stop="goToUserProfile(post.userid)">
					</image>
					<view class="user-info" @click.stop="goToUserProfile(post.userid)">
						<text class="username">{{post.username || '匿名用户'}}</text>
						<text class="post-time">{{formatTime(post.time)}}</text>
					</view>
					<view class="post-tag">{{getClassifyIcon(post.classify)}}{{post.classify}}</view>
				</view>
				
				<!-- 动态内容 -->
				<view class="post-content">
					<text class="post-text">{{post.content}}</text>
					<view class="post-images" v-if="getPostImages(post).length > 0">
						<image 
							class="post-image" 
							v-for="(img, imgIndex) in getPostImages(post)" 
							:key="imgIndex"
							:src="getImageUrl(img)" 
							mode="aspectFill"
							@click.stop="previewImage(getPostImages(post).map(image => getImageUrl(image)), imgIndex)"
							@error="handleImageError">
						</image>
					</view>
				</view>
				
				<!-- 互动区域 -->
				<view class="post-actions">
					<view class="action-item" @click.stop="toggleLike(post)">
						<text class="action-icon" :class="{'liked': post.isLiked}">{{post.isLiked ? '❤️' : '🤍'}}</text>
						<text class="action-text">{{post.likes || 0}}</text>
					</view>
					<view class="action-item" @click.stop="showComments(post)">
						<text class="action-icon">💬</text>
						<text class="action-text">{{post.comments || 0}}</text>
					</view>
					<view class="action-item" @click.stop="sharePost(post)">
						<text class="action-icon">📤</text>
						<text class="action-text">分享</text>
					</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view class="empty-state" v-if="!loading && postList.length === 0">
				<image src="/static/暂无 (1).png" class="empty-icon"></image>
				<br>
				<text class="empty-text">暂无社区动态</text>
			</view>
			
			<!-- 加载更多 -->
			<view class="load-more" v-if="hasMore && postList.length > 0">
				<text class="load-text">加载更多...</text>
			</view>
			<view class="no-more" v-else-if="postList.length > 0">
				<text class="no-more-text">没有更多内容了</text>
			</view>
		</scroll-view>
		
		<!-- 右下角固定上传按钮 -->
		<view class="publish-btn" @click="publish">
			<uni-icons type="plus" size="20" color="#fff"></uni-icons>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	
	export default {
		data() {
			return {
				activeCategory: 'all',
				hasMore: true,
				loading: false,
				postList: [],
				allPostList: [], // 存储所有动态数据，用于前端筛选
				
				// 分类列表
				categoryList: [
					{ id: 'all', name: '全部', icon: '🌟' },
					{ id: '教材', name: '教材', icon: '📚' },
					{ id: '数码', name: '数码', icon: '💻' },
					{ id: '服饰', name: '服饰', icon: '👕' },
					{ id: '生活', name: '生活', icon: '🏠' },
					{ id: '运动', name: '运动', icon: '⚽' },
					{ id: '其他', name: '其他', icon: '🎁' }
				]
			}
		},
		
		mounted() {
			this.loadCommunityData();
		},
		
		// 页面显示时重新加载数据（从发布页面返回时）
		onShow() {
			// 如果是从其他页面返回，重新加载数据
			if (this.allPostList.length > 0) {
				this.loadCommunityData();
			}
		},
		
		methods: {
			// 加载社区数据
			async loadCommunityData() {
				this.loading = true;
				try {
					// 先获取社区数据
					const communityResponse = await request.post('/community');
					
					if (communityResponse.success === '成功' && communityResponse.result) {
						// 为每个动态获取回复数量
						const processedData = await Promise.all(
							communityResponse.result.map(async (item) => {
								try {
									// 为每个动态查询回复数量
									const respondResponse = await request.post('/respond', {
										community_id: item.community_id
									});
									
									const commentCount = (respondResponse.success === '成功' && respondResponse.result) 
										? respondResponse.result.length 
										: 0;
									
									console.log(`动态ID ${item.community_id} 的回复数量: ${commentCount}`);
									
									return {
										...item,
										likes: Math.floor(Math.random() * 50) + 1, // 随机生成点赞数
										comments: commentCount, // 使用真实回复数量
										isLiked: false
									};
								} catch (error) {
									console.error(`获取动态 ${item.community_id} 回复数量失败:`, error);
									return {
										...item,
										likes: Math.floor(Math.random() * 50) + 1,
										comments: 0,
										isLiked: false
									};
								}
							})
						);
						
						// 存储所有数据
						this.allPostList = processedData;
						
						// 根据当前选中的分类筛选显示数据
						this.filterPostsByCategory(this.activeCategory);
					} else {
						this.postList = [];
						this.allPostList = [];
					}
				} catch (error) {
					console.error('加载社区数据失败:', error);
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},
			
			// 切换分类
			switchCategory(categoryId) {
				if (this.activeCategory === categoryId) return; // 如果点击的是当前分类，不做处理
				
				this.activeCategory = categoryId;
				// 根据分类筛选数据
				this.filterPostsByCategory(categoryId);
				
				// 显示切换提示
				const categoryName = this.categoryList.find(item => item.id === categoryId)?.name || categoryId;
			},
			
			// 根据分类筛选动态
			filterPostsByCategory(categoryId) {
				if (categoryId === 'all') {
					// 显示所有动态
					this.postList = [...this.allPostList];
				} else {
					// 根据分类字段筛选动态
					this.postList = this.allPostList.filter(post => post.classify === categoryId);
				}
				
				// 如果没有数据，显示相应提示
				if (this.postList.length === 0 && this.allPostList.length > 0) {
					console.log(`当前分类 "${categoryId}" 没有相关动态`);
				}
			},
			
			// 跳转动态详情
			goToPostDetail(post) {
				uni.navigateTo({
					url: `/pages/Community/funtion/respond_detail?postId=${post.community_id}&userId=${post.userid}&username=${encodeURIComponent(post.username || '匿名用户')}`
				});
			},
			
			// 跳转到用户页面
			goToUserProfile(userid) {
				if (!userid) {
					uni.showToast({
						title: '用户信息不存在',
						icon: 'none'
					});
					return;
				}
				
				uni.navigateTo({
					url: `/pages/Home/function/user?userId=${userid}`
				});
			},
			publish(){
				uni.navigateTo({
					url:'/pages/Community/funtion/publish'
				})
			},
			
			// 预览图片
			previewImage(images, current) {
				uni.previewImage({
					urls: images,
					current: current
				});
			},
			
			// 点赞/取消点赞
			toggleLike(post) {
				post.isLiked = !post.isLiked;
				if (post.isLiked) {
					post.likes++;
					uni.showToast({ title: '点赞成功', icon: 'success' });
				} else {
					post.likes--;
					uni.showToast({ title: '取消点赞', icon: 'none' });
				}
			},
			
			// 显示评论
			showComments(post) {
				uni.navigateTo({
					url: `/pages/Community/funtion/respond_detail?postId=${post.community_id}&userId=${post.userid}&username=${encodeURIComponent(post.username || '匿名用户')}`
				})
			},
			
			// 分享动态
			sharePost(post) {
				uni.showToast({ title: '分享功能开发中', icon: 'none' });
			},
			
			// 加载更多
			loadMore() {
				if (!this.hasMore) return;
				
				setTimeout(() => {
					// 模拟加载更多数据
					this.hasMore = false;
					uni.showToast({ title: '没有更多数据了', icon: 'none' });
				}, 1000);
			},
			
			// 获取用户头像
			getUserAvatar(post) {
				// 如果有用户头像，使用接口返回的头像
				if (post.image) {
					return this.getImageUrl(post.image);
				}
				
				// 如果没有头像，根据用户ID生成默认头像
				const avatarIndex = (post.userid % 9) + 1;
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
				
				// 如果已经是完整的URL，直接返回
				if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
					return imagePath;
				}
				
				// 如果是uploads路径，拼接服务器地址
				if (imagePath.startsWith('uploads/')) {
					return `${request.baseUrl}/${imagePath}`;
				}
				
				// 默认处理
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
				// 使用默认头像
				e.target.src = '/static/c1.png';
			},
			
			// 跳转到上传页面
			goToUpload() {
				uni.showToast({
					title: '跳转到发布页面',
					icon: 'none'
				});
			}
		}
	}
</script>

<style>
.community-container {
	background-color: #f5f7fa;
	min-height: 100vh;
}

/* 分类标签 */
.category-tabs {
	background: white;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #eee;
}

.tabs-scroll {
	white-space: nowrap;
}

.tab-item {
	display: inline-block;
	padding: 16rpx 30rpx;
	margin: 0 10rpx;
	border-radius: 40rpx;
	background: #f8f9ff;
	transition: all 0.3s ease;
}

.tab-item.active {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.tab-text {
	font-size: 26rpx;
	color: #666;
}

.tab-item.active .tab-text {
	color: white;
	font-weight: 500;
}

/* 动态列表 */
.post-list {
	flex: 1;
	padding: 20rpx 30rpx;
}

.post-item {
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);
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
	cursor: pointer;
	transition: transform 0.2s ease;
}

.user-avatar:active {
	transform: scale(0.95);
}

.user-info {
	flex: 1;
	cursor: pointer;
	transition: opacity 0.2s ease;
}

.user-info:active {
	opacity: 0.7;
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

/* 单张图片时放大 */
.post-images:has(.post-image:only-child) .post-image {
	width: 300rpx;
	height: 300rpx;
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

/* 加载状态 */
.loading {
	text-align: center;
	padding: 60rpx 0;
	color: #666;
	font-size: 28rpx;
}

/* 空状态 */
.empty-state {
	text-align: center;
	padding: 100rpx 0;
}

.empty-icon {
	width: 200rpx;
	height: 200rpx;
	margin-bottom: 30rpx;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}

/* 加载更多 */
.load-more, .no-more {
	text-align: center;
	padding: 40rpx 0;
}

.load-text, .no-more-text {
	font-size: 24rpx;
	color: #999;
}

.publish-btn {
    position: fixed;
    right: 20px;
    bottom: 80px;
    width: 50px;
    height: 50px;
    background: #d4237a;
    border-radius: 25px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
    box-shadow: 0 4px 12px rgba(212, 35, 122, 0.3);
}
</style>
