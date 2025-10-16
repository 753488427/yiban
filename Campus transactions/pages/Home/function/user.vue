<template>
	<view class="user-container">
		<!-- 卖家信息卡片 -->
		<view class="user-info-card" v-if="userInfo.userid">
			<view class="user-header">
				<image 
					class="user-avatar" 
					:src="getImageUrl(userInfo.avatar)" 
					mode="aspectFill"
					@error="handleAvatarError"
				></image>
				<view class="user-details">
					<text class="username">{{userInfo.username || `用户${userInfo.userid}`}}</text>
					<text class="user-phone" v-if="userInfo.phone">电话: {{userInfo.phone}}</text>
					<text class="user-id">ID: {{userInfo.userid}}</text>
				</view>
				
				<!-- 联系按钮 -->
				<view class="contact-seller-btn" @click="contactSeller" v-if="!isCurrentUser">
					<text>联系</text>
				</view>
			</view>
			
			<!-- 统计信息 -->
			<view class="statistics">
				<view class="stat-item">
					<text class="stat-number">{{statistics.totalGoods}}</text>
					<text class="stat-label">发布商品</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{statistics.onSaleGoods}}</text>
					<text class="stat-label">在售</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{statistics.soldGoods}}</text>
					<text class="stat-label">已售</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{statistics.totalLikes}}</text>
					<text class="stat-label">获赞</text>
				</view>
				<view class="stat-item">
					<text class="stat-number">{{statistics.totalViews}}</text>
					<text class="stat-label">收藏</text>
				</view>
			</view>
		</view>

		<!-- 商品列表 -->
		<view class="goods-section">
			<view class="section-header">
				<text class="section-title">发布的商品</text>
				<text class="goods-count">({{goodsList.length}})</text>
			</view>
			
			<!-- 商品网格 -->
			<view class="goods-grid" v-if="goodsList.length > 0">
				<view 
					class="goods-item" 
					v-for="item in goodsList" 
					:key="item.goods_id"
					@click="goToDetail(item.goods_id)"
				>
					<image 
						class="goods-image" 
						:src="getImageUrl(item.image)" 
						mode="aspectFill"
						@error="handleImageError"
					></image>
					<view class="goods-info">
						<text class="goods-title">{{item.title}}</text>
						<text class="goods-price">¥{{item.price}}</text>
						<view class="goods-meta">
							<text class="goods-status" :class="{'selling': item.status === '在售'}">
								{{item.status}}
							</text>
							<view class="goods-stats">
								<text class="stat">❤️ {{item.likes || 0}}</text>
								<text class="stat">⭐ {{item.views || 0}}</text>
							</view>
						</view>
						<text class="goods-time">{{formatTime(item.time)}}</text>
					</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view class="empty-state" v-else>
				<image src="/static/暂无 (1).png" class="empty-icon"></image>
				<text class="empty-text">该用户还没有发布商品</text>
			</view>
		</view>

		<!-- 加载状态 -->
		<view class="loading" v-if="loading">
			<text>加载中...</text>
		</view>

		<!-- 用户不存在 -->
		<view class="not-found" v-if="!loading && !userInfo.userid">
			<image src="/static/暂无 (1).png" class="not-found-icon"></image>
			<text class="not-found-text">用户不存在</text>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	import GoodsOperation from '../moudle/operation.js';

	export default {
		data() {
			return {
				userId: '',
				loading: true,
				userInfo: {},
				statistics: {
					totalGoods: 0,
					onSaleGoods: 0,
					soldGoods: 0,
					totalLikes: 0,
					totalViews: 0
				},
				goodsList: [],
				currentUserId: '' // 当前登录用户ID
			}
		},
		
		computed: {
			// 判断是否是当前用户自己
			isCurrentUser() {
				return this.currentUserId && this.currentUserId == this.userId;
			}
		},

		onLoad(options) {
			if (options.userId) {
				this.userId = options.userId;
				
				// 获取当前登录用户信息
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo && userInfo.userid) {
					this.currentUserId = userInfo.userid;
				}
				
				this.loadSellerInfo();
			} else {
				uni.showToast({
					title: '用户ID不能为空',
					icon: 'none'
				});
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
			}
		},

		methods: {
			// 加载卖家信息
			async loadSellerInfo() {
				this.loading = true;
				try {
					const response = await request.post('/goods/seller_info', {
						userid: this.userId
					});

					console.log('卖家信息响应:', response);

					if (response.code === 200 && response.result) {
						const { userInfo, statistics, goodsList } = response.result;
						
						this.userInfo = userInfo;
						this.statistics = statistics;
						this.goodsList = goodsList;
						
						console.log('卖家信息:', this.userInfo);
						console.log('统计信息:', this.statistics);
						console.log('商品列表:', this.goodsList);
					} else {
						uni.showToast({
							title: response.msg || '获取卖家信息失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('加载卖家信息失败:', error);
					uni.showToast({
						title: '加载失败，请重试',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},

			// 跳转到商品详情
			goToDetail(goodsId) {
				uni.navigateTo({
					url: `/pages/Home/function/goods_detail?id=${goodsId}`
				});
			},

			// 获取图片URL
			getImageUrl(imagePath) {
				return GoodsOperation.getImageUrl(imagePath);
			},

			// 处理头像加载错误
			handleAvatarError(e) {
				console.log('头像加载失败:', e);
				e.target.src = '/static/c1.png';
			},

			// 处理商品图片加载错误
			handleImageError(e) {
				console.log('商品图片加载失败:', e);
				e.target.src = '/static/logo.png';
			},

			// 联系卖家
			async contactSeller() {
				// 检查用户是否登录
				if (!this.currentUserId) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				
				// 检查卖家信息是否完整
				if (!this.userInfo.userid) {
					uni.showToast({
						title: '用户信息不完整',
						icon: 'none'
					});
					return;
				}
				
				try {
					// 查找是否已存在会话
					const response = await request.get(`/news/conversations/${this.currentUserId}`);
					
					let existingConversationId = null;
					if (response.success === '成功' && response.result) {
						// 查找与该用户的现有会话
						const existingConversation = response.result.find(conv => 
							conv.other_user_id == this.userInfo.userid
						);
						if (existingConversation) {
							existingConversationId = existingConversation.conversation_id;
						}
					}
					
					// 跳转到聊天详情页面
					const userAvatar = this.getImageUrl(this.userInfo.avatar);
					const conversationId = existingConversationId || 'new';
					const username = this.userInfo.username || `用户${this.userInfo.userid}`;
					
					uni.navigateTo({
						url: `/pages/message/detail?conversationId=${conversationId}&userId=${this.userInfo.userid}&username=${encodeURIComponent(username)}&avatar=${encodeURIComponent(userAvatar)}`
					});
					
				} catch (error) {
					console.error('联系用户失败:', error);
					// 即使查找会话失败，也可以创建新会话
					const userAvatar = this.getImageUrl(this.userInfo.avatar);
					const username = this.userInfo.username || `用户${this.userInfo.userid}`;
					
					uni.navigateTo({
						url: `/pages/message/detail?conversationId=new&userId=${this.userInfo.userid}&username=${encodeURIComponent(username)}&avatar=${encodeURIComponent(userAvatar)}`
					});
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
			}
		}
	}
</script>

<style>
.user-container {
	background-color: #f5f7fa;
	min-height: 100vh;
	padding: 20rpx;
}

/* 卖家信息卡片 */
.user-info-card {
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.user-header {
	display: flex;
	align-items: center;
	margin-bottom: 30rpx;
}

.user-avatar {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50rpx;
	margin-right: 30rpx;
	background-color: #e9ecef;
	border: 4rpx solid #fff;
	box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
}

.user-details {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.username {
	font-size: 32rpx;
	color: #333;
	font-weight: 600;
}

.user-phone {
	font-size: 24rpx;
	color: #666;
}

.user-id {
	font-size: 22rpx;
	color: #999;
}

/* 联系按钮 */
.contact-seller-btn {
	padding: 12rpx 24rpx;
	background: #667eea;
	color: white;
	border-radius: 20rpx;
	font-size: 24rpx;
	text-align: center;
	margin-left: 20rpx;
}

/* 统计信息 */
.statistics {
	display: flex;
	justify-content: space-around;
	padding: 20rpx 0;
	border-top: 1rpx solid #f0f0f0;
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
}

.stat-number {
	font-size: 28rpx;
	color: #333;
	font-weight: 600;
}

.stat-label {
	font-size: 22rpx;
	color: #666;
}

/* 商品列表区域 */
.goods-section {
	background: white;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.section-header {
	display: flex;
	align-items: center;
	margin-bottom: 30rpx;
}

.section-title {
	font-size: 28rpx;
	color: #333;
	font-weight: 600;
}

.goods-count {
	font-size: 24rpx;
	color: #666;
	margin-left: 10rpx;
}

/* 商品网格 */
.goods-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
}

.goods-item {
	background: #f8f9fa;
	border-radius: 16rpx;
	overflow: hidden;
	transition: transform 0.2s ease;
}

.goods-item:active {
	transform: scale(0.98);
}

.goods-image {
	width: 100%;
	height: 280rpx;
	background-color: #e9ecef;
}

.goods-info {
	padding: 20rpx;
}

.goods-title {
	font-size: 24rpx;
	color: #333;
	font-weight: 500;
	line-height: 1.4;
	margin-bottom: 8rpx;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	overflow: hidden;
}

.goods-price {
	font-size: 26rpx;
	color: #ff6b6b;
	font-weight: 600;
	margin-bottom: 12rpx;
}

.goods-meta {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8rpx;
}

.goods-status {
	font-size: 20rpx;
	color: #999;
	padding: 4rpx 8rpx;
	border-radius: 8rpx;
	background: #f0f0f0;
}

.goods-status.selling {
	color: #52c41a;
	background: #f6ffed;
}

.goods-stats {
	display: flex;
	gap: 12rpx;
}

.stat {
	font-size: 20rpx;
	color: #666;
}

.goods-time {
	font-size: 20rpx;
	color: #999;
}

/* 空状态 */
.empty-state {
	text-align: center;
	padding: 100rpx 0;
}

.empty-icon {
	width: 120rpx;
	height: 120rpx;
	margin-bottom: 20rpx;
	opacity: 0.3;
}

.empty-text {
	font-size: 24rpx;
	color: #999;
}

/* 加载状态 */
.loading {
	text-align: center;
	padding: 200rpx 0;
	color: #999;
	font-size: 28rpx;
}

/* 用户不存在 */
.not-found {
	text-align: center;
	padding: 200rpx 0;
}

.not-found-icon {
	width: 200rpx;
	height: 200rpx;
	margin-bottom: 30rpx;
	opacity: 0.3;
}

.not-found-text {
	display: block;
	font-size: 28rpx;
	color: #999;
}

/* 响应式优化 */
@media (max-width: 750rpx) {
	.goods-grid {
		grid-template-columns: repeat(2, 1fr);
		gap: 15rpx;
	}
	
	.goods-image {
		height: 240rpx;
	}
}
</style>