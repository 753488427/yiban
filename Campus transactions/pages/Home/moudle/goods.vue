<template>
	<view class="goods-container">
		<!-- 瀑布流商品列表 -->
		<view class="product-waterfall">
			<view class="product-column">
				<view class="product-card" v-for="(item, index) in leftProducts" :key="'left-' + index" @click="goToProductDetail(item)">
					<view class="image-container">
						<image 
							class="product-image" 
							:src="getImageUrl(item.image)" 
							mode="aspectFill"
							:lazy-load="true"
							@error="handleImageError"
						></image>
					</view>
					<view class="product-info">
						<text class="product-title">{{item.title}}</text>
						<view class="product-meta">
							<text class="product-price">¥{{item.price}}</text>
							<text class="product-likes">❤️ {{item.likes}}</text>
						</view>
						<view class="product-footer">
							<text class="product-status" :class="{'status-selling': item.status === '在售'}">{{item.status}}</text>
							<text class="product-time">{{formatTime(item.time)}}</text>
						</view>
						<view class="product-label" v-if="item.label">{{item.label}}</view>
					</view>
				</view>
			</view>
			
			<view class="product-column">
				<view class="product-card" v-for="(item, index) in rightProducts" :key="'right-' + index" @click="goToProductDetail(item)">
					<view class="image-container">
						<image 
							class="product-image" 
							:src="getImageUrl(item.image)" 
							mode="aspectFill"
							:lazy-load="true"
							@error="handleImageError"
						></image>
					</view>
					<view class="product-info">
						<text class="product-title">{{item.title}}</text>
						<view class="product-meta">
							<text class="product-price">¥{{item.price}}</text>
							<text class="product-likes">❤️ {{item.likes}}</text>
						</view>
						<view class="product-footer">
							<text class="product-status" :class="{'status-selling': item.status === '在售'}">{{item.status}}</text>
							<text class="product-time">{{formatTime(item.time)}}</text>
						</view>
						<view class="product-label" v-if="item.label">{{item.label}}</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 加载状态 -->
		<view class="loading" v-if="loading">
			<text>加载中...</text>
		</view>
		
		<!-- 无数据状态 -->
		<view class="no-data" v-if="!loading && productList.length === 0">
			<image src="/static/暂无 (1).png" class="no-data-icon"></image>
			<text class="no-data-text">暂无商品</text>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	
	export default {
		props: {
			selectedCategory: {
				type: String,
				default: 'all'
			}
		},
		
		data() {
			return {
				productList: [],
				allProductList: [], // 存储所有商品数据
				loading: false
			}
		},
		
		computed: {
			// 左列商品
			leftProducts() {
				return this.productList.filter((item, index) => index % 2 === 0);
			},
			// 右列商品
			rightProducts() {
				return this.productList.filter((item, index) => index % 2 === 1);
			}
		},
		
		mounted() {
			this.getGoodsList();
		},
		
		methods: {
			// 获取商品列表
			async getGoodsList() {
				this.loading = true;
				try {
					const response = await request.post('/goods/');
					if (response.success === '成功' && response.result) {
						// 过滤掉状态为"下架"的商品
						const filteredResult = response.result.filter(item => item.status !== '下架');
						
						this.allProductList = filteredResult.map(item => ({
							id: item.goods_id,
							title: item.title,
							content: item.content,
							price: item.price,
							image: item.image, // 保持原始路径，在渲染时处理
							likes: item.likes || 0,
							views: item.views || 0,
							status: item.status || '在售',
							time: item.time,
							label: item.label,
							// 额外的字段
							classify: item.classify,
							address: item.address,
							userid: item.userid
						}));
						
						// 初始显示所有商品
						this.productList = [...this.allProductList];
						console.log('商品列表数据（已过滤下架商品）:', this.allProductList);
					}
				} catch (error) {
					console.error('获取商品列表失败:', error);
					uni.showToast({
						title: '获取商品失败',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},
			
			// 跳转到商品详情
			goToProductDetail(item) {
				uni.navigateTo({ 
					url: '/pages/Home/function/goods_detail?id=' + item.id 
				});
			},
			
			// 根据分类筛选商品
			filterByCategory(category) {
				if (category === 'all') {
					this.productList = [...this.allProductList];
				} else {
					this.productList = this.allProductList.filter(item => item.classify === category);
				}
				console.log(`筛选分类: ${category}, 结果数量: ${this.productList.length}`);
			},
			
			// 获取图片URL
			getImageUrl(imagePath) {
				if (!imagePath) {
					return '/static/暂无 (1).png'; // 默认占位图
				}
				
				// 如果已经是完整的URL，直接返回
				if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
					return imagePath;
				}
				
				// 如果是相对路径，拼接服务器地址
				if (imagePath.startsWith('uploads/')) {
					return `${request.baseUrl}/${imagePath}`;
				}
				
				// 如果是其他格式，也尝试拼接
				return `${request.baseUrl}/${imagePath}`;
			},
			
			// 处理图片加载错误
			handleImageError(e) {
				console.log('图片加载失败:', e);
				// 可以在这里设置默认图片
				e.target.src = '/static/暂无 (1).png';
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
.goods-container {
	padding: 20rpx 20rpx 50rpx;
	width: 100%;
	box-sizing: border-box;
}

/* 瀑布流布局 */
.product-waterfall {
	display: flex;
	gap: 15rpx;
	width: 100%;
	box-sizing: border-box;
}

.product-column {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	width: calc(50% - 7.5rpx);
	box-sizing: border-box;
}

.product-card {
	background: white;
	border-radius: 16rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
	transition: transform 0.3s ease;
}

.product-card:active {
	transform: scale(0.98);
}

.image-container {
	position: relative;
	overflow: hidden;
	border-radius: 16rpx 16rpx 0 0;
	background: #f5f5f5;
}

.product-image {
	width: 100%;
	height: 300rpx;
	object-fit: cover;
	transition: transform 0.3s ease, opacity 0.3s ease;
	display: block;
}

.product-card:active .product-image {
	transform: scale(1.05);
}

.product-info {
	padding: 20rpx;
}

.product-title {
	font-size: 28rpx;
	color: #333;
	line-height: 1.4;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	margin-bottom: 15rpx;
}

.product-meta {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 15rpx;
}

.product-price {
	font-size: 32rpx;
	color: #ff6b6b;
	font-weight: bold;
}

.product-likes {
	font-size: 24rpx;
	color: #999;
}

.product-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 10rpx;
}

.product-status {
	font-size: 22rpx;
	color: #999;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
	background: #f5f5f5;
}

.product-status.status-selling {
	color: #52c41a;
	background: #f6ffed;
}

.product-time {
	font-size: 22rpx;
	color: #ccc;
}

.product-label {
	font-size: 20rpx;
	color: #667eea;
	background: #f0f2ff;
	padding: 4rpx 8rpx;
	border-radius: 8rpx;
	align-self: flex-start;
}

/* 优化的随机高度效果 - 更适合不同比例的图片 */
.product-column:nth-child(1) .product-card:nth-child(1) .product-image { height: 240rpx; }
.product-column:nth-child(1) .product-card:nth-child(2) .product-image { height: 320rpx; }
.product-column:nth-child(1) .product-card:nth-child(3) .product-image { height: 280rpx; }
.product-column:nth-child(1) .product-card:nth-child(4) .product-image { height: 360rpx; }
.product-column:nth-child(1) .product-card:nth-child(5) .product-image { height: 220rpx; }
.product-column:nth-child(1) .product-card:nth-child(6) .product-image { height: 340rpx; }
.product-column:nth-child(1) .product-card:nth-child(7) .product-image { height: 260rpx; }
.product-column:nth-child(1) .product-card:nth-child(8) .product-image { height: 300rpx; }
.product-column:nth-child(1) .product-card:nth-child(9) .product-image { height: 380rpx; }
.product-column:nth-child(1) .product-card:nth-child(10) .product-image { height: 240rpx; }

.product-column:nth-child(2) .product-card:nth-child(1) .product-image { height: 300rpx; }
.product-column:nth-child(2) .product-card:nth-child(2) .product-image { height: 250rpx; }
.product-column:nth-child(2) .product-card:nth-child(3) .product-image { height: 340rpx; }
.product-column:nth-child(2) .product-card:nth-child(4) .product-image { height: 280rpx; }
.product-column:nth-child(2) .product-card:nth-child(5) .product-image { height: 320rpx; }
.product-column:nth-child(2) .product-card:nth-child(6) .product-image { height: 220rpx; }
.product-column:nth-child(2) .product-card:nth-child(7) .product-image { height: 360rpx; }
.product-column:nth-child(2) .product-card:nth-child(8) .product-image { height: 240rpx; }
.product-column:nth-child(2) .product-card:nth-child(9) .product-image { height: 300rpx; }
.product-column:nth-child(2) .product-card:nth-child(10) .product-image { height: 280rpx; }

/* 加载状态 */
.loading {
	text-align: center;
	padding: 50rpx 0;
	color: #999;
	font-size: 28rpx;
}

/* 无数据状态 */
.no-data {
	text-align: center;
	padding: 100rpx 0;
}

.no-data-icon {
	width: 150rpx;
	height: 150rpx;
	margin-bottom: 30rpx;
	opacity: 0.3;
}

.no-data-text {
	display: block;
	font-size: 28rpx;
	color: #999;
}
</style>