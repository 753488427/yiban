<template>
	<view class="release-container">
		<!-- 顶部标题区域 -->
		<view class="header-section">
			<view class="main-title">来校园 搞点钱！</view>
			<view class="sub-title">让闲置物品重新焕发价值</view>
		</view>

		<!-- 主要功能卡片区域 -->
		<view class="main-cards">
			<!-- 发闲置卡片 -->
			<view class="card yellow-card" @click="goToPublish">
				<view class="card-content">
					<view class="card-title">发闲置 </view>
					<view class="card-desc">30s发布宝贝，轻松赚零花钱</view>
				</view>
				<view class="card-icon">
					<text class="icon">📦</text>
				</view>
			</view>

			<!-- AI发布卡片 -->
			<view class="card gradient-card" @click="goToAIPublish">
				<view class="card-content">
					<view class="card-title">AI发布 </view>
					<view class="card-desc">AI帮写卖更快</view>
				</view>
				<view class="card-icon">
					<text class="icon">✨</text>
				</view>
			</view>
		</view>

		<!-- 一键转卖 -->
		<view class="single-card" @click="goToTransfer">
			<view class="card-left">
				<view class="card-title">一键转卖 </view>
				<view class="card-desc">淘宝转卖换钱</view>
			</view>
		</view>

		<!-- 功能模块区域 -->
		<view class="function-cards">
			<view class="function-item" @click="goToRecycle">
				<view class="function-icon">📱</view>
				<view class="function-content">
					<view class="function-title">极速回收 </view>
					<view class="function-desc">可上门 当面质检秒到账</view>
				</view>
			</view>

			<view class="function-item" @click="goToShowcase">
				<view class="function-icon">📸</view>
				<view class="function-content">
					<view class="function-title">晒好物 </view>
					<view class="function-desc">只晒不卖的宝贝</view>
				</view>
			</view>
		</view>

		<!-- 底部副业卡片 -->
		<view class="bottom-card green-card" @click="goToSideJob">
			<view class="card-content">
				<view class="card-title">搞副业 ></view>
				<view class="card-desc">闲置时间能换钱</view>
			</view>
			<view class="card-mascot">
				<text class="mascot">🐸</text>
			</view>
		</view>

	</view>
</template>

<script>
	export default {
		data() {
			return {
				
			}
		},
		methods: {
			// 跳转到发布商品页面
			goToPublish() {
				uni.navigateTo({
					url: '/pages/Release/publishing'
				});
			},
			
			// AI发布功能
			goToAIPublish() {
				uni.showToast({
					title: 'AI发布功能开发中',
					icon: 'none'
				});
			},
			
			// 一键转卖
			goToTransfer() {
				uni.showToast({
					title: '一键转卖功能开发中',
					icon: 'none'
				});
			},
			
			// 极速回收
			goToRecycle() {
				uni.showToast({
					title: '极速回收功能开发中',
					icon: 'none'
				});
			},
			
			// 晒好物
			goToShowcase() {
				uni.showToast({
					title: '晒好物功能开发中',
					icon: 'none'
				});
			},
			
			// 搞副业
			goToSideJob() {
				uni.showToast({
					title: '副业功能开发中',
					icon: 'none'
				});
			},
			
		}
	}
</script>

<style scoped>
.release-container {
	min-height: 100vh;
	background: linear-gradient(180deg, #FFF9E6 0%, #F5F5F5 50%, #FFFFFF 100%);
	padding: 40rpx 30rpx 30rpx;
}

/* 顶部标题区域 */
.header-section {
	text-align: center;
	margin-bottom: 60rpx;
}

.main-title {
	font-size: 48rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 16rpx;
}

.sub-title {
	font-size: 28rpx;
	color: #666;
	background: #FFE066;
	display: inline-block;
	padding: 8rpx 20rpx;
	border-radius: 20rpx;
}

/* 主要功能卡片 */
.main-cards {
	display: flex;
	gap: 20rpx;
	margin-bottom: 30rpx;
}

.card {
	flex: 1;
	height: 200rpx;
	border-radius: 24rpx;
	padding: 30rpx;
	position: relative;
	overflow: hidden;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.yellow-card {
	background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
}

.gradient-card {
	background: linear-gradient(135deg, #FF6B9D 0%, #C44EFF 50%, #8B5FFF 100%);
}

.card-content {
	position: relative;
	z-index: 2;
}

.card-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #FFFFFF;
	margin-bottom: 12rpx;
}

.card-desc {
	font-size: 24rpx;
	color: #FFFFFF;
	opacity: 0.9;
}

.card-icon {
	position: absolute;
	right: 20rpx;
	top: 60%;
	transform: translateY(-50%);
	font-size: 60rpx;
}

/* 一键转卖 */
.single-card {
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.card-left .card-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 8rpx;
}

.card-left .card-desc {
	font-size: 24rpx;
	color: #666;
}

/* 功能模块 */
.function-cards {
	display: flex;
	gap: 20rpx;
	margin-bottom: 30rpx;
}

.function-item {
	flex: 1;
	background: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx 20rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.function-icon {
	font-size: 48rpx;
	margin-right: 20rpx;
}

.function-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 8rpx;
}

.function-desc {
	font-size: 22rpx;
	color: #666;
	line-height: 1.4;
}

/* 底部副业卡片 */
.bottom-card {
	background: linear-gradient(135deg, #7ED321 0%, #4CAF50 100%);
	border-radius: 24rpx;
	padding: 30rpx;
	position: relative;
	margin-bottom: 40rpx;
	box-shadow: 0 8rpx 24rpx rgba(126, 211, 33, 0.3);
}

.card-mascot {
	position: absolute;
	right: 30rpx;
	bottom: 20rpx;
	font-size: 80rpx;
}

.mascot {
	display: block;
	transform: rotate(-10deg);
}


/* 点击效果 */
.card, .single-card, .function-item {
	transition: all 0.2s ease;
}

.card:active, .single-card:active, .function-item:active {
	transform: scale(0.98);
	opacity: 0.8;
}

/* 响应式设计 */
@media screen and (max-width: 750rpx) {
	.main-cards {
		flex-direction: column;
	}
	
	.function-cards {
		flex-direction: column;
	}
	
	.function-item {
		justify-content: flex-start;
	}
}
</style>
