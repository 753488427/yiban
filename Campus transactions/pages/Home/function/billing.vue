<template>
	<view class="billing-container">
		
		<!-- 收货地址 -->
		<view class="address-section">
			<view class="section-title">
				<uni-icons type="location" size="18" color="#333"></uni-icons>
				<text class="title-text">收货地址</text>
			</view>
			
			<view class="address-card" v-if="selectedAddress" @click="selectAddress">
				<view class="address-info">
					<view class="address-header">
						<text class="receiver-name">{{selectedAddress.username}}</text>
						<text class="receiver-phone">{{selectedAddress.phone}}</text>
					</view>
					<text class="address-detail">{{selectedAddress.area}} {{selectedAddress.area_one}}</text>
				</view>
				<view class="address-arrow">
					<uni-icons type="right" size="16" color="#999"></uni-icons>
				</view>
			</view>
			
			<view class="no-address" v-else @click="selectAddress">
				<uni-icons type="plus" size="20" color="#999"></uni-icons>
				<text class="no-address-text">请选择收货地址</text>
			</view>
		</view>
		
		<!-- 商品信息 -->
		<view class="goods-section">
			<view class="section-title">
				<uni-icons type="shop" size="18" color="#333"></uni-icons>
				<text class="title-text">商品信息</text>
			</view>
			
			<view class="goods-card">
				<image 
					class="goods-image" 
					:src="getImageUrl(goodsInfo.image)" 
					mode="aspectFill"
					@error="handleImageError">
				</image>
				<view class="goods-details">
					<text class="goods-title">{{goodsInfo.title}}</text>
					<text class="goods-classify">{{getClassifyIcon(goodsInfo.classify)}} {{goodsInfo.classify}}</text>
					<view class="price-info">
						<text class="goods-price">¥{{goodsInfo.price}}</text>
						<text class="goods-quantity">x1</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 订单金额 -->
		<view class="amount-section">
			<view class="amount-row">
				<text class="amount-label">商品金额</text>
				<text class="amount-value">¥{{goodsInfo.price}}</text>
			</view>
			<view class="amount-row">
				<text class="amount-label">运费</text>
				<text class="amount-value">¥0.00</text>
			</view>
			<view class="amount-row total">
				<text class="amount-label">实付款</text>
				<text class="amount-value total-price">¥{{goodsInfo.price}}</text>
			</view>
		</view>
		
		<!-- 底部操作栏 -->
		<view class="bottom-bar">
			<view class="total-info">
				<text class="total-label">实付：</text>
				<text class="total-amount">¥{{goodsInfo.price}}</text>
			</view>
			<view class="submit-btn" :class="{'disabled': !canSubmit}" @click="submitOrder">
				<text class="submit-text">提交订单</text>
			</view>
		</view>
		
		<!-- 加载遮罩 -->
		<view class="loading-mask" v-if="submitting">
			<view class="loading-content">
				<uni-load-more status="loading" :content-text="loadingText"></uni-load-more>
			</view>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	
	export default {
		data() {
			return {
				goodsInfo: {},
				selectedAddress: null,
				addressList: [],
				currentUser: null,
				submitting: false,
				loadingText: {
					contentdown: '提交中...',
					contentrefresh: '提交中...',
					contentnomore: '提交完成'
				}
			}
		},
		
		computed: {
			canSubmit() {
				return this.selectedAddress && this.goodsInfo.id && !this.submitting;
			}
		},
		
		onLoad(options) {
			if (options.goodsInfo) {
				this.goodsInfo = JSON.parse(decodeURIComponent(options.goodsInfo));
				console.log('商品信息:', this.goodsInfo);
			}
			
			this.getCurrentUser();
			this.loadAddressList();
		},
		
		methods: {
			// 获取当前用户信息
			getCurrentUser() {
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo) {
					this.currentUser = userInfo;
				} else {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					setTimeout(() => {
						uni.navigateBack();
					}, 1500);
				}
			},
			
			// 返回上一页
			goBack() {
				uni.navigateBack();
			},
			
			// 加载地址列表
			async loadAddressList() {
				if (!this.currentUser || !this.currentUser.userid) {
					return;
				}
				
				try {
					const response = await request.post('/address', {
						userid: this.currentUser.userid
					});
					
					if (response.success === '成功' && response.result) {
						this.addressList = response.result;
						// 如果有地址，默认选择第一个
						if (this.addressList.length > 0) {
							this.selectedAddress = this.addressList[0];
						}
					}
				} catch (error) {
					console.error('加载地址列表失败:', error);
				}
			},
			
			// 选择地址
			selectAddress() {
				if (this.addressList.length === 0) {
					uni.showToast({
						title: '请先添加收货地址',
						icon: 'none'
					});
					return;
				}
				
				// 显示地址选择器
				const addressNames = this.addressList.map(addr => 
					`${addr.username} ${addr.phone} ${addr.area} ${addr.area_one}`
				);
				
				uni.showActionSheet({
					itemList: addressNames,
					success: (res) => {
						this.selectedAddress = this.addressList[res.tapIndex];
					}
				});
			},
			
			// 提交订单
			async submitOrder() {
				if (!this.canSubmit) return;
				
				this.submitting = true;
				
				try {
					const orderData = {
						userid: this.currentUser.userid,
						goods_id: this.goodsInfo.id,
						address_id: this.selectedAddress.address_id,
						status: '已购'
					};
					
					console.log('提交订单数据:', orderData);
					
					const response = await request.post('/orders/add', orderData);
					
					if (response.success === '成功') {
						uni.showToast({
							title: '订单提交成功',
							icon: 'success'
						});
						
						// 延迟跳转到订单页面
						setTimeout(() => {
							uni.redirectTo({
								url: '/pages/Me/funtion/me_orders'
							});
						}, 1500);
					} else {
						uni.showToast({
							title: response.msg || '订单提交失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('提交订单失败:', error);
					uni.showToast({
						title: '提交订单失败',
						icon: 'none'
					});
				} finally {
					this.submitting = false;
				}
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
			
			// 获取图片URL
			getImageUrl(imagePath) {
				if (!imagePath) return '/static/logo.png';
				
				if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
					return imagePath;
				}
				
				if (imagePath.startsWith('uploads/')) {
					return `${request.baseUrl}/${imagePath}`;
				}
				
				return imagePath;
			},
			
			// 处理图片加载错误
			handleImageError(e) {
				console.log('商品图片加载失败:', e);
				e.target.src = '/static/logo.png';
			}
		}
	}
</script>

<style>
.billing-container {
	background-color: #f5f7fa;
	min-height: 100vh;
	padding-bottom: 120rpx;
}

/* 通用区域样式 */
.address-section, .goods-section, .amount-section {
	background: white;
	margin-bottom: 20rpx;
	padding: 30rpx;
}

.section-title {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.title-text {
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
	margin-left: 8rpx;
}

/* 收货地址 */
.address-card {
	display: flex;
	align-items: center;
	padding: 20rpx;
	background: #f8f9ff;
	border-radius: 12rpx;
	border: 1rpx solid #e6f0ff;
}

.address-info {
	flex: 1;
}

.address-header {
	display: flex;
	align-items: center;
	margin-bottom: 8rpx;
}

.receiver-name {
	font-size: 28rpx;
	font-weight: 500;
	color: #333;
	margin-right: 20rpx;
}

.receiver-phone {
	font-size: 24rpx;
	color: #666;
}

.address-detail {
	font-size: 26rpx;
	color: #666;
	line-height: 1.4;
}

.address-arrow {
	margin-left: 20rpx;
}

.no-address {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40rpx;
	background: #fafafa;
	border-radius: 12rpx;
	border: 2rpx dashed #ddd;
}

.no-address-text {
	font-size: 26rpx;
	color: #999;
	margin-left: 10rpx;
}

/* 商品信息 */
.goods-card {
	display: flex;
	align-items: center;
	padding: 20rpx;
	background: #fafafa;
	border-radius: 12rpx;
}

.goods-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: 12rpx;
	margin-right: 20rpx;
	flex-shrink: 0;
}

.goods-details {
	flex: 1;
}

.goods-title {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
	display: block;
	margin-bottom: 10rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.goods-classify {
	font-size: 24rpx;
	color: #666;
	display: block;
	margin-bottom: 15rpx;
}

.price-info {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.goods-price {
	font-size: 32rpx;
	color: #ff6b6b;
	font-weight: 600;
}

.goods-quantity {
	font-size: 24rpx;
	color: #999;
}

/* 订单金额 */
.amount-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 15rpx 0;
}

.amount-row.total {
	border-top: 1rpx solid #f0f0f0;
	margin-top: 10rpx;
	padding-top: 20rpx;
}

.amount-label {
	font-size: 26rpx;
	color: #666;
}

.amount-row.total .amount-label {
	font-size: 28rpx;
	color: #333;
	font-weight: 600;
}

.amount-value {
	font-size: 26rpx;
	color: #333;
}

.total-price {
	font-size: 32rpx;
	color: #ff6b6b;
	font-weight: 600;
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
	align-items: center;
	justify-content: space-between;
}

.total-info {
	flex: 1;
}

.total-label {
	font-size: 24rpx;
	color: #666;
}

.total-amount {
	font-size: 32rpx;
	color: #ff6b6b;
	font-weight: 600;
	margin-left: 10rpx;
}

.submit-btn {
	width: 200rpx;
	height: 70rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 35rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: opacity 0.3s ease;
}

.submit-btn.disabled {
	opacity: 0.5;
}

.submit-text {
	color: white;
	font-size: 28rpx;
	font-weight: 600;
}

/* 加载遮罩 */
.loading-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.3);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
}

.loading-content {
	background: white;
	padding: 40rpx;
	border-radius: 12rpx;
}
</style>
