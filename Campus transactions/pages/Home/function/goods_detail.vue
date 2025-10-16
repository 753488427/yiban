<template>
	<view class="detail-container">
		<!-- 统一内容区域 -->
		<view class="content-section">
			<!-- 卖家信息 -->
			<view class="seller-area" v-if="goodsDetail.username">
				<view class="seller-card" @click="goToSellerPage">
					<image 
						class="seller-avatar" 
						:src="getImageUrl(goodsDetail.user_image)" 
						mode="aspectFill"
						@error="handleAvatarError"
					></image>
					<view class="seller-info">
						<text class="seller-name">{{goodsDetail.username}}</text>
						<text class="seller-desc">该用户很懒，什么都没有留下</text>
						<view class="seller-tags">
							<text class="seller-label" v-if="goodsDetail.label">{{goodsDetail.label}}</text>
							<text class="seller-time">{{formatTime(goodsDetail.time)}}</text>
						</view>
					</view>
					<view class="seller-arrow">
						<text class="arrow-icon">></text>
					</view>
				</view>
			</view>
			
			<!-- 分割线 -->
			<view class="divider"></view>
			
			<!-- 商品价格信息 -->
			<view class="price-area">
				<view class="price-info">
					<text class="price">¥{{goodsDetail.price}}</text>
					<br>
					<text class="title">{{goodsDetail.title}}</text>
					<view class="status-info">
						<text class="status-tag" :class="{'selling': goodsDetail.status === '在售', 'sold': goodsDetail.status === '已购'}">{{goodsDetail.status}}</text>
					</view>
				</view>
				<view class="action-buttons">
					<!-- 喜欢按钮 -->
					<view class="action-btn" @click="toggleLike">
						<image 
							class="action-icon" 
							:src="isLiked ? '/static/喜欢1.png' : '/static/喜欢.png'"
							mode="aspectFit"
						></image>
						<text class="action-text" :class="{'active': isLiked}">{{goodsDetail.likes}}</text>
					</view>
					
					<!-- 收藏按钮 (使用views字段) -->
					<view class="action-btn" @click="toggleCollect">
						<image 
							class="action-icon" 
							:src="isCollected ? '/static/收藏 -已收藏-copy (2).png' : '/static/收藏 -已收藏-copy (1).png'"
							mode="aspectFit"
						></image>
						<text class="action-text" :class="{'active': isCollected}">{{goodsDetail.views}}</text>
					</view>
				</view>
			</view>
			
			<!-- 分割线 -->
			<view class="divider"></view>
			
			<!-- 商品描述 -->
			<view class="description-area">
				<view class="section-title">商品描述</view>
				<text class="description">{{goodsDetail.content || '暂无描述'}}</text>
			</view>
			
			<!-- 分割线 -->
			<view class="divider"></view>
			
			<!-- 商品图片 -->
			<view class="image-area">
				<swiper class="image-swiper" :indicator-dots="true" indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#667eea">
					<swiper-item>
						<image class="detail-image" :src="getImageUrl(goodsDetail.image)" mode="aspectFill" @error="handleImageError"></image>
					</swiper-item>
					<swiper-item v-if="goodsDetail.imageone">
						<image class="detail-image" :src="getImageUrl(goodsDetail.imageone)" mode="aspectFill" @error="handleImageError"></image>
					</swiper-item>
				</swiper>
			</view>
		</view>
		
		<!-- 用户评论 -->
		<comment :goods-id="goodsDetail.id" v-if="goodsDetail.id"></comment>
		
		<!-- 底部操作栏 -->
		<view class="bottom-bar">
			<view class="contact-btn" @click="contactSeller" v-if="goodsDetail.status !== '已购'">
				<text class="btn-text">联系卖家</text>
			</view>
			<view class="buy-btn" @click="buyNow" v-if="goodsDetail.status === '在售'">
				<text class="btn-text">立即购买</text>
			</view>
			<view class="sold-btn" v-if="goodsDetail.status === '已购'">
				<text class="btn-text">已售出</text>
			</view>
			<view class="unavailable-btn" v-if="goodsDetail.status !== '在售' && goodsDetail.status !== '已购'">
				<text class="btn-text">暂不可购买</text>
			</view>
		</view>
		
		<!-- 加载状态 -->
		<view class="loading" v-if="loading">
			<text>加载中...</text>
		</view>
		
		<!-- 商品不存在 -->
		<view class="not-found" v-if="!loading && !goodsDetail.id">
			<image src="/static/暂无 (1).png" class="not-found-icon"></image>
			<text class="not-found-text">商品不存在或已下架</text>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	import comment from './comment.vue';
	import GoodsOperation from '../moudle/operation.js';
	
	export default {
		components: {
			comment
		},
		data() {
			return {
				goodsId: '',
				goodsDetail: {},
				loading: false,
				isLiked: false, // 是否已点赞
				isCollected: false, // 是否已收藏
				userid: '' // 当前用户ID
			}
		},
		
		onLoad(options) {
			if (options.id) {
				this.goodsId = options.id;
				this.getUserInfo();
				this.getGoodsDetail();
			}
		},
		
		onShow() {
			// 页面显示时的逻辑
		},
		
		methods: {
			// 获取用户信息
			getUserInfo() {
				const userInfo = GoodsOperation.getUserInfo();
				console.log('获取到的用户信息:', userInfo);
				if (userInfo && userInfo.userid) {
					this.userid = userInfo.userid;
					console.log('设置用户ID:', this.userid);
				} else {
					console.log('未找到用户信息或用户ID');
				}
			},

			// 获取商品详情
			async getGoodsDetail() {
				this.loading = true;
				try {
					const goodsDetail = await GoodsOperation.getGoodsDetail(this.goodsId);
					
					if (goodsDetail) {
						this.goodsDetail = goodsDetail;
						console.log('商品详情数据:', this.goodsDetail);
						console.log('用户名:', this.goodsDetail.username);
						console.log('用户头像:', this.goodsDetail.user_image);
						
						// 获取商品详情后，检查点赞和收藏状态
						if (this.userid) {
							this.checkLikeStatus();
							this.checkCollectStatus();
						}
					} else {
						console.log('未找到商品详情');
					}
				} catch (error) {
					console.error('获取商品详情失败:', error);
					uni.showToast({
						title: '获取商品详情失败',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},
			
			// 刷新商品数据（仅更新计数，不显示loading）
			async refreshGoodsData() {
				try {
					const countData = await GoodsOperation.refreshGoodsCount(this.goodsId);
					if (countData) {
						this.goodsDetail.likes = countData.likes;
						this.goodsDetail.views = countData.views;
					}
				} catch (error) {
					console.error('刷新商品数据失败:', error);
				}
			},
			
			// 检查点赞状态
			async checkLikeStatus() {
				this.isLiked = await GoodsOperation.checkLikeStatus(this.userid, this.goodsId);
			},
			
			// 检查收藏状态
			async checkCollectStatus() {
				this.isCollected = await GoodsOperation.checkCollectStatus(this.userid, this.goodsId);
			},
			
			// 跳转到卖家页面
			goToSellerPage() {
				if (this.goodsDetail.userid) {
					uni.navigateTo({
						url: `/pages/Home/function/user?userId=${this.goodsDetail.userid}`
					});
				} else {
					uni.showToast({
						title: '卖家信息不完整',
						icon: 'none'
					});
				}
			},

			// 联系卖家
			async contactSeller() {
				// 检查用户是否登录
				if (!this.userid) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				
				// 检查是否是自己的商品
				if (this.userid == this.goodsDetail.userid) {
					uni.showToast({
						title: '不能联系自己',
						icon: 'none'
					});
					return;
				}
				
				// 检查卖家信息是否完整
				if (!this.goodsDetail.userid) {
					uni.showToast({
						title: '卖家信息不完整：用户ID缺失',
						icon: 'none'
					});
					return;
				}
				
				if (!this.goodsDetail.username) {
					uni.showToast({
						title: '卖家信息不完整：用户名缺失',
						icon: 'none'
					});
					return;
				}
				
				try {
					// 查找是否已存在会话
					const response = await request.get(`/news/conversations/${this.userid}`);
					
					let existingConversationId = null;
					if (response.success === '成功' && response.result) {
						// 查找与该卖家的现有会话
						const existingConversation = response.result.find(conv => 
							conv.other_user_id == this.goodsDetail.userid
						);
						if (existingConversation) {
							existingConversationId = existingConversation.conversation_id;
						}
					}
					
					// 准备商品信息
					const productInfo = {
						id: this.goodsDetail.id,
						title: this.goodsDetail.title,
						price: this.goodsDetail.price,
						image: this.goodsDetail.image,
						status: this.goodsDetail.status
					};
					
					// 跳转到聊天详情页面，携带商品信息
					const sellerAvatar = this.getImageUrl(this.goodsDetail.user_image);
					const conversationId = existingConversationId || 'new';
					
					uni.navigateTo({
						url: `/pages/message/detail?conversationId=${conversationId}&userId=${this.goodsDetail.userid}&username=${encodeURIComponent(this.goodsDetail.username)}&avatar=${encodeURIComponent(sellerAvatar)}&productInfo=${encodeURIComponent(JSON.stringify(productInfo))}`
					});
					
				} catch (error) {
					console.error('联系卖家失败:', error);
					// 即使查找会话失败，也可以创建新会话
					const sellerAvatar = this.getImageUrl(this.goodsDetail.user_image);
					const productInfo = {
						id: this.goodsDetail.id,
						title: this.goodsDetail.title,
						price: this.goodsDetail.price,
						image: this.goodsDetail.image,
						status: this.goodsDetail.status
					};
					
					uni.navigateTo({
						url: `/pages/message/detail?conversationId=new&userId=${this.goodsDetail.userid}&username=${encodeURIComponent(this.goodsDetail.username)}&avatar=${encodeURIComponent(sellerAvatar)}&productInfo=${encodeURIComponent(JSON.stringify(productInfo))}`
					});
				}
			},
			
			// 立即购买
			buyNow() {
				// 检查用户是否登录
				if (!this.userid) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				
				// 检查是否是自己的商品
				if (this.userid == this.goodsDetail.userid) {
					uni.showToast({
						title: '不能购买自己的商品',
						icon: 'none'
					});
					return;
				}
				
				// 检查商品状态
				if (this.goodsDetail.status === '已购') {
					uni.showToast({
						title: '该商品已被购买',
						icon: 'none'
					});
					return;
				}
				
				if (this.goodsDetail.status !== '在售') {
					uni.showToast({
						title: '商品已下架或不可购买',
						icon: 'none'
					});
					return;
				}
				
				// 准备商品信息并跳转到结算页面
				const goodsInfo = {
					id: this.goodsDetail.id,
					title: this.goodsDetail.title,
					price: this.goodsDetail.price,
					image: this.goodsDetail.image,
					classify: this.goodsDetail.classify,
					sellerId: this.goodsDetail.userid,
					sellerName: this.goodsDetail.username
				};
				
				uni.navigateTo({
					url: `/pages/Home/function/billing?goodsInfo=${encodeURIComponent(JSON.stringify(goodsInfo))}`
				});
			},
			
			// 切换喜欢状态
			async toggleLike() {
				const result = await GoodsOperation.toggleLike(this.userid, this.goodsId, this.isLiked);
				
				if (result.success) {
					this.isLiked = result.newStatus;
					// 重新获取商品数据以确保计数准确
					await this.refreshGoodsData();
				}
			},
			
			// 切换收藏状态
			async toggleCollect() {
				const result = await GoodsOperation.toggleCollect(this.userid, this.goodsId, this.isCollected);
				
				if (result.success) {
					this.isCollected = result.newStatus;
					// 重新获取商品数据以确保计数准确
					await this.refreshGoodsData();
				}
			},
			
			// 获取图片URL
			getImageUrl(imagePath) {
				return GoodsOperation.getImageUrl(imagePath);
			},
			
			// 处理图片加载错误
			handleImageError(e) {
				console.log('图片加载失败:', e);
				// 设置默认图片
				e.target.src = '/static/logo.png';
			},
			
			// 处理头像加载错误
			handleAvatarError(e) {
				console.log('头像加载失败:', e);
				// 设置默认头像
				e.target.src = '/static/c1.png';
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
.detail-container {
	background-color: #f5f7fa;
	min-height: 100vh;
	padding-bottom: 120rpx;
}

/* 统一内容区域 */
.content-section {
	background: white;
	margin-bottom: 20rpx;
}

/* 分割线 */
.divider {
	height: 1rpx;
	background-color: #f0f0f0;
	margin: 0 30rpx;
}

/* 卖家信息区域 */
.seller-area {
	padding: 30rpx;
}

.seller-card {
	display: flex;
	align-items: center;
}

.seller-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 40rpx;
	margin-right: 24rpx;
	background-color: #e9ecef;
	border: 3rpx solid #fff;
	box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
}

.seller-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.seller-name {
	font-size: 28rpx;
	color: #333;
	font-weight: 600;
}

.seller-desc {
	font-size: 22rpx;
	color: #666;
}

.seller-tags {
	display: flex;
	gap: 12rpx;
	align-items: center;
	margin-top: 8rpx;
}

.seller-label {
	font-size: 20rpx;
	color: #667eea;
	background: #f0f2ff;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
}

.seller-time {
	font-size: 20rpx;
	color: #999;
}

/* 商品价格信息 */
.price-area {
	padding: 30rpx;
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
}

.price-info {
	flex: 1;
}

.status-info {
	margin-top: 12rpx;
}

/* 商品描述区域 */
.description-area {
	padding: 30rpx;
}

/* 商品图片区域 */
.image-area {
	padding: 30rpx 30rpx 0;
}

.image-swiper {
	height: 750rpx;
	margin-top: 20rpx;
}

.detail-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
	background-color: #f5f5f5;
}

/* 图片加载失败时的样式 */
.detail-image[src="/static/logo.png"] {
	opacity: 0.8;
	background-color: #f0f0f0;
}

.price {
	font-size: 48rpx;
	color: #ff6b6b;
	font-weight: bold;
}

.action-buttons {
	display: flex;
	align-items: center;
	gap: 30rpx;
}

.action-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	padding: 10rpx;
	border-radius: 12rpx;
	transition: all 0.3s ease;
}

.action-btn:active {
	transform: scale(0.95);
	background-color: rgba(0, 0, 0, 0.05);
}

.action-icon {
	width: 36rpx;
	height: 36rpx;
	transition: transform 0.3s ease;
}

.action-btn:active .action-icon {
	transform: scale(1.1);
}

.action-text {
	font-size: 22rpx;
	color: #666;
	transition: color 0.3s ease;
}

.action-text.active {
	color: #ff6b6b;
	font-weight: bold;
}

.title {
	font-size: 32rpx;
	color: #333;
	line-height: 1.5;
	margin: 12rpx 0;
	font-weight: bold;
}

.status-tag {
	font-size: 22rpx;
	color: #999;
	padding: 8rpx 16rpx;
	border-radius: 16rpx;
	background: #f5f5f5;
}

.status-tag.selling {
	color: #52c41a;
	background: #f6ffed;
}

.status-tag.sold {
	color: #999;
	background: #f0f0f0;
}

.section-title {
	font-size: 28rpx;
	color: #333;
	font-weight: bold;
	margin-bottom: 20rpx;
}

.description {
	font-size: 26rpx;
	color: #666;
	line-height: 1.6;
}

/* 底部操作栏 */
.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: white;
	padding: 20rpx 30rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	border-top: 1rpx solid #eee;
	display: flex;
	gap: 20rpx;
}

.contact-btn {
	flex: 1;
	height: 80rpx;
	background: #f8f9fa;
	border-radius: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.buy-btn {
	flex: 1;
	height: 80rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.contact-btn .btn-text {
	color: #333;
	font-size: 28rpx;
	font-weight: bold;
}

.buy-btn .btn-text {
	color: white;
	font-size: 28rpx;
	font-weight: bold;
}

.sold-btn {
	flex: 1;
	height: 80rpx;
	background: #999;
	border-radius: 40rpx;
	display: flex;
	align-items: center;
	margin-bottom: 1px;
	justify-content: center;
}

.sold-btn .btn-text {
	color: white;
	font-size: 28rpx;
	font-weight: bold;
}

.unavailable-btn {
	flex: 1;
	height: 80rpx;
	background: #ccc;
	border-radius: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.unavailable-btn .btn-text {
	color: white;
	font-size: 28rpx;
	font-weight: bold;
}

/* 加载状态 */
.loading {
	text-align: center;
	padding: 200rpx 0;
	color: #999;
	font-size: 28rpx;
}

/* 商品不存在 */
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
</style>
