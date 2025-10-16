<template>
	<view class="home-container">
		<!-- 顶部搜索导航 -->
		<view class="search-header">
			<view class="search-bar" @click="goToMessage">
				<view class="search-icon">🔍</view>
				<input class="search-input" placeholder="搜索你想要的宝贝..." />
			</view>
		</view>
		
		<!-- 轮播图 -->
		<view class="carousel-section">
			<swiper class="carousel" :indicator-dots="true" :autoplay="true" :interval="3000" :duration="500" indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#667eea">
				<swiper-item v-for="(item, index) in carouselList" :key="index">
					<image class="carousel-image" :src="item.image" mode="aspectFill"></image>
				</swiper-item>
			</swiper>
		</view>
		
		<!-- 商品展示区域 -->
		<view class="product-section">
			<!-- 导航菜单 -->
			<scroll-view class="nav-menu" scroll-x="true" show-scrollbar="false">
				<view class="nav-container">
					<view 
						class="nav-item" 
						:class="{'nav-active': selectedCategory === item.category}" 
						v-for="item in allNavList" 
						:key="item.category"
						@click="goToCategory(item)"
					>
						<view class="nav-icon">{{item.icon}}</view>
						<text class="nav-text">{{item.name}}</text>
						<view class="nav-indicator" v-if="selectedCategory === item.category"></view>
					</view>
				</view>
			</scroll-view>
			
			<view class="section-header">
				<text class="section-title">🔥 {{getSectionTitle()}}</text>
				<text class="section-more">更多 ></text>
			</view>
			
			<!-- 引用goods组件 -->
			<goods ref="goodsComponent" :selected-category="selectedCategory"></goods>
		</view>
	</view>
</template>

<script>
	import goods from './moudle/goods.vue';
	import BannerService from './moudle/banner.js';
	
	export default {
		components: {
			goods
		},
		
		data() {
			return {
				carouselList: [],
				selectedCategory: 'all'
			}
		},
		
		computed: {
			// 完整的导航列表（包含"全部"选项）
			allNavList() {
				return BannerService.getAllNavList();
			}
		},
		
		onLoad() {
			this.getBannerList();
		},
		
		methods: {
			// 获取轮播图数据
			async getBannerList() {
				try {
					this.carouselList = await BannerService.getBannerList();
				} catch (error) {
					console.error('获取轮播图数据失败:', error);
					uni.showToast({
						title: '获取轮播图失败',
						icon: 'none'
					});
				}
			},
			
			// 跳转到搜索页面
			goToMessage() {
				uni.navigateTo({
					url: '/pages/Home/function/search'
				});
			},
			
			// 选择分类
			goToCategory(item) {
				this.selectedCategory = item.category;
				// 通知goods组件更新数据
				if (this.$refs.goodsComponent) {
					this.$refs.goodsComponent.filterByCategory(item.category);
				}
			},
			
			// 获取区域标题
			getSectionTitle() {
				return BannerService.getSectionTitle(this.selectedCategory);
			}
		}
	}
</script>

<style>
.home-container {
	background-color: #f5f7fa;
	min-height: 100vh;
}

/* 顶部搜索导航 */
.search-header {
	padding: 20rpx 30rpx 30rpx;
	padding-top: calc(20rpx + var(--status-bar-height, 0));
}

.search-bar {
	display: flex;
	align-items: center;
	padding: 0 30rpx;
	height: 80rpx;
	background: white;
	border-radius: 40rpx;
	box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
}

.search-icon {
	font-size: 32rpx;
	margin-right: 20rpx;
	color: #999;
}

.search-input {
	flex: 1;
	font-size: 28rpx;
	color: #333;
}

/* 轮播图 */
.carousel-section {
	margin: 20rpx 20rpx;
}

.carousel {
	height: 320rpx;
	border-radius: 20rpx;
	overflow: hidden;
}

.carousel-image {
	width: 100%;
	height: 100%;
}

/* 商品展示区域 */
.product-section {
	margin: 20rpx 20rpx 0;
	background: white;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
	overflow: hidden;
}

/* 导航菜单 */
.nav-menu {
	border-bottom: 1rpx solid #f0f0f0;
	background: white;
	white-space: nowrap;
}

.nav-container {
	display: flex;
	padding: 20rpx 0;
}

.nav-item {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 85rpx;
	padding: 15rpx 20rpx;
	margin: 0 10rpx;
	transition: all 0.3s ease;
	cursor: pointer;
}

.nav-item:first-child {
	margin-left: 30rpx;
}

.nav-item:last-child {
	margin-right: 30rpx;
}

.nav-item:active {
	transform: scale(0.95);
}

.nav-item.nav-active .nav-icon {
	transform: scale(1.1);
}

.nav-item.nav-active .nav-text {
	color: #667eea;
	font-weight: 600;
}

.nav-icon {
	font-size: 40rpx;
	margin-bottom: 8rpx;
	transition: transform 0.3s ease;
}

.nav-text {
	font-size: 24rpx;
	color: #333;
	transition: all 0.3s ease;
	white-space: nowrap;
}

/* 底部提示线 */
.nav-indicator {
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 40rpx;
	height: 4rpx;
	background: linear-gradient(90deg, #667eea, #764ba2);
	border-radius: 2rpx;
	animation: slideIn 0.3s ease;
}

@keyframes slideIn {
	from {
		width: 0;
		opacity: 0;
	}
	to {
		width: 40rpx;
		opacity: 1;
	}
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 30rpx;
	margin-bottom: 0;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.section-more {
	font-size: 26rpx;
	color: #667eea;
}
</style>
