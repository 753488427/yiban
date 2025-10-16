<template>
	<view class="search-container">
		<!-- 搜索头部 -->
		<view class="search-header">
			<view class="search-bar">
				<view class="search-icon">🔍</view>
				<input 
					class="search-input" 
					v-model="searchKeyword" 
					placeholder="搜索你想要的宝贝..." 
					@input="onSearchInput"
					@confirm="handleSearch"
					confirm-type="search"
				/>
				<view class="cancel-btn" @click="goBack">取消</view>
			</view>
		</view>
		
		<!-- 搜索历史 -->
		<view class="search-history" v-if="!searchKeyword && searchHistory.length > 0">
			<view class="section-title">
				<text>搜索历史</text>
				<text class="clear-btn" @click="clearHistory">清空</text>
			</view>
			<view class="history-tags">
				<view 
					class="history-tag" 
					v-for="(item, index) in searchHistory" 
					:key="index"
					@click="searchFromHistory(item)"
				>
					{{item}}
				</view>
			</view>
		</view>
		
		<!-- 热门搜索 -->
		<view class="hot-search" v-if="!searchKeyword">
			<view class="section-title">
				<text>热门搜索</text>
			</view>
			<view class="hot-tags">
				<view 
					class="hot-tag" 
					v-for="(item, index) in hotSearchList" 
					:key="index"
					@click="searchFromHot(item)"
				>
					{{item}}
				</view>
			</view>
		</view>
		
		<!-- 搜索结果 -->
		<view class="search-results" v-if="searchKeyword">
			<!-- 加载状态 -->
			<view class="loading" v-if="loading">
				<text>搜索中...</text>
			</view>
			
			<!-- 搜索结果列表 -->
			<view class="results-list" v-else-if="searchResults.length > 0">
				<view class="result-item" v-for="(item, index) in searchResults" :key="index" @click="goToDetail(item)">
					<image class="result-image" :src="item.image || '/static/logo.png'" mode="aspectFill"></image>
					<view class="result-info">
						<text class="result-title">{{item.title}}</text>
						<text class="result-price">¥{{item.price}}</text>
						<text class="result-status" :class="{'status-selling': item.status === '在售'}">{{item.status}}</text>
						<view class="result-label" v-if="item.label">{{item.label}}</view>
					</view>
				</view>
			</view>
			
			<!-- 无搜索结果 -->
			<view class="no-results" v-else-if="!loading">
				<image src="/static/暂无 (1).png" mode="" class="no-results-icon" ></image>
				<text class="no-results-text">没有找到相关商品</text>
				<text class="no-results-tip">试试其他关键词吧</text>
			</view>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	
	export default {
		data() {
			return {
				searchKeyword: '',
				loading: false,
				searchResults: [],
				searchHistory: [],
				hotSearchList: [
					'iPhone', 'MacBook', '教材', '自行车', '台灯',
					'耳机', '键盘', '显示器', '书籍', '服装'
				]
			}
		},
		
		onLoad() {
			this.loadSearchHistory();
		},
		
		methods: {
			// 搜索输入处理
			onSearchInput(e) {
				this.searchKeyword = e.detail.value;
				// 实时搜索（可选，防抖处理）
				clearTimeout(this.searchTimer);
				if (this.searchKeyword.trim()) {
					this.searchTimer = setTimeout(() => {
						this.handleSearch();
					}, 500);
				} else {
					this.searchResults = [];
				}
			},
			
			// 执行搜索
			async handleSearch() {
				if (!this.searchKeyword.trim()) {
					return;
				}
				
				this.loading = true;
				try {
					const response = await request.post('/search/', {
						title: this.searchKeyword.trim()
					});
					
					if (response.success === '成功' && response.result) {
						// 映射API返回的数据格式到页面需要的格式
						this.searchResults = response.result.map(item => ({
							id: item.goods_id,
							title: item.title,
							price: item.price,
							image: item.image,
							status: item.status,
							label: item.label
						}));
						this.saveSearchHistory(this.searchKeyword.trim());
					} else {
						this.searchResults = [];
					}
				} catch (error) {
					console.error('搜索失败:', error);
					this.searchResults = [];
					uni.showToast({
						title: '搜索失败，请重试',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},
			
			// 从历史记录搜索
			searchFromHistory(keyword) {
				this.searchKeyword = keyword;
				this.handleSearch();
			},
			
			// 从热门搜索
			searchFromHot(keyword) {
				this.searchKeyword = keyword;
				this.handleSearch();
			},
			
			// 保存搜索历史
			saveSearchHistory(keyword) {
				// 移除重复项
				this.searchHistory = this.searchHistory.filter(item => item !== keyword);
				// 添加到开头
				this.searchHistory.unshift(keyword);
				// 限制历史记录数量
				if (this.searchHistory.length > 10) {
					this.searchHistory = this.searchHistory.slice(0, 10);
				}
				// 保存到本地存储
				uni.setStorageSync('searchHistory', this.searchHistory);
			},
			
			// 加载搜索历史
			loadSearchHistory() {
				try {
					const history = uni.getStorageSync('searchHistory');
					if (history && Array.isArray(history)) {
						this.searchHistory = history;
					}
				} catch (error) {
					console.error('加载搜索历史失败:', error);
				}
			},
			
			// 清空搜索历史
			clearHistory() {
				uni.showModal({
					title: '提示',
					content: '确定要清空搜索历史吗？',
					success: (res) => {
						if (res.confirm) {
							this.searchHistory = [];
							uni.removeStorageSync('searchHistory');
						}
					}
				});
			},
			
			// 跳转到商品详情
			goToDetail(item) {
				uni.navigateTo({
					url: `/pages/Bookshelf/detail?id=${item.id}`
				});
			},
			
			// 返回上一页
			goBack() {
				uni.navigateBack();
			}
		}
	}
</script>

<style>
.search-container {
	background-color: #f5f7fa;
	min-height: 100vh;
}

/* 搜索头部 */
.search-header {
	background: white;
	padding: 20rpx 30rpx;
	padding-top: calc(20rpx + var(--status-bar-height, 0));
	border-bottom: 1rpx solid #eee;
}

.search-bar {
	display: flex;
	align-items: center;
	height: 80rpx;
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
	background: #f8f9fa;
	padding: 0 20rpx;
	height: 60rpx;
	border-radius: 30rpx;
}

.cancel-btn {
	font-size: 28rpx;
	color: #667eea;
	margin-left: 20rpx;
	padding: 10rpx;
}

/* 区域标题 */
.section-title {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx;
	font-size: 28rpx;
	color: #333;
	font-weight: bold;
}

.clear-btn {
	font-size: 24rpx;
	color: #999;
	font-weight: normal;
}

/* 搜索历史 */
.search-history {
	background: white;
	margin-bottom: 20rpx;
}

.history-tags {
	padding: 0 30rpx 30rpx;
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
}

.history-tag {
	background: #f8f9fa;
	color: #666;
	padding: 15rpx 25rpx;
	border-radius: 30rpx;
	font-size: 26rpx;
}

/* 热门搜索 */
.hot-search {
	background: white;
	margin-bottom: 20rpx;
}

.hot-tags {
	padding: 0 30rpx 30rpx;
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
}

.hot-tag {
	background: linear-gradient(135deg, #ccc 0%, #ccc 0%);
	color: black;
	padding: 15rpx 25rpx;
	border-radius: 30rpx;
	font-size: 26rpx;
}

/* 搜索结果 */
.search-results {
	flex: 1;
}

.loading {
	text-align: center;
	padding: 100rpx 0;
	color: #999;
	font-size: 28rpx;
}

.results-list {
	background: white;
	margin: 0 30rpx;
	border-radius: 20rpx;
	overflow: hidden;
}

.result-item {
	display: flex;
	padding: 30rpx;
	border-bottom: 1rpx solid #f5f5f5;
}

.result-item:last-child {
	border-bottom: none;
}

.result-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: 12rpx;
	margin-right: 20rpx;
}

.result-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.result-title {
	font-size: 28rpx;
	color: #333;
	line-height: 1.4;
	font-weight: bold;
	margin-bottom: 8rpx;
}

.result-price {
	font-size: 32rpx;
	color: #ff6b6b;
	font-weight: bold;
	margin-bottom: 8rpx;
}

.result-status {
	font-size: 22rpx;
	color: #999;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
	background: #f5f5f5;
	margin-bottom: 8rpx;
}

.result-status.status-selling {
	color: #52c41a;
	background: #f6ffed;
}

.result-label {
	font-size: 20rpx;
	color: #667eea;
	background: #f0f2ff;
	padding: 4rpx 8rpx;
	border-radius: 8rpx;
	align-self: flex-start;
}

/* 无搜索结果 */
.no-results {
	text-align: center;
	padding: 150rpx 0;
}

.no-results-icon {
	width: 150px;
	height: 150px;
	margin-bottom: 30rpx;
	opacity: 0.3;
}

.no-results-text {
	display: block;
	font-size: 32rpx;
	color: #999;
	margin-bottom: 15rpx;
}

.no-results-tip {
	display: block;
	font-size: 26rpx;
	color: #ccc;
}
</style>
