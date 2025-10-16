<template>
	<view class="me-goods-container">
		<!-- 加载状态 -->
		<view class="loading" v-if="loading">
			<text>加载中...</text>
		</view>

		<!-- 商品列表 -->
		<view class="goods-list" v-else-if="goodsList.length > 0">
			<view 
				class="goods-item" 
				v-for="item in goodsList" 
				:key="item.goods_id"
				@click="goToGoodsDetail(item.goods_id)"
			>
				<!-- 商品图片 -->
				<image 
					class="goods-image" 
					:src="getImageUrl(item.image)" 
					mode="aspectFill"
					@error="handleImageError"
				></image>
				
				<!-- 商品信息 -->
				<view class="goods-info">
					<text class="goods-title">{{ item.title }}</text>
					<text class="goods-price">¥{{ item.price }}</text>
					<view class="goods-meta">
						<text class="goods-status" :class="getStatusClass(item.status)">
							{{ item.status }}
						</text>
					</view>
				</view>

				<!-- 管理按钮 -->
				<view class="manage-btn" @click.stop="manageGoods(item)">
					<text class="manage-icon">⚙️</text>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<view class="empty-icon">📦</view>
			<text class="empty-text">暂无发布商品</text>
			<text class="empty-tip">去发布你的第一个商品吧~</text>
			<button class="publish-btn" @click="goToPublish">发布商品</button>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	import userUtil from '@/utils/user.js';
	import GoodsOperation from '../../Home/moudle/operation.js';

	export default {
		data() {
			return {
				goodsList: [],
				loading: true,
				userid: null
			}
		},
		onLoad() {
			this.initPage();
		},
		onShow() {
			// 每次显示页面时刷新列表
			this.loadGoodsList();
		},
		methods: {
			// 初始化页面
			initPage() {
				const userInfo = userUtil.getUserInfo();
				if (!userInfo) {
					uni.showModal({
						title: '提示',
						content: '请先登录',
						confirmText: '去登录',
						success: (res) => {
							if (res.confirm) {
								uni.navigateTo({
									url: '/pages/Me/user/login'
								});
							} else {
								uni.navigateBack();
							}
						}
					});
					return;
				}
				this.userid = userInfo.userid;
				this.loadGoodsList();
			},

			// 加载商品列表
			loadGoodsList() {
				if (!this.userid) return;
				
				this.loading = true;
				request.post('/goods/user_goods', {
					userid: this.userid
				}).then(res => {
					this.loading = false;
					if (res.code === 200) {
						this.goodsList = res.result || [];
					} else {
						this.showToast(res.msg || '获取商品列表失败');
					}
				}).catch(err => {
					this.loading = false;
					this.showToast('网络错误，请重试');
				});
			},

			// 跳转到商品详情
			goToGoodsDetail(goods_id) {
				uni.navigateTo({
					url: `/pages/Home/function/goods_detail?id=${goods_id}`
				});
			},

			// 管理商品
			manageGoods(item) {
				const actions = ['编辑商品', '删除商品'];
				if (item.status === '在售') {
					actions.unshift('下架商品');
				} else if (item.status === '下架') {
					actions.unshift('上架商品');
				}

				uni.showActionSheet({
					itemList: actions,
					success: (res) => {
						const action = actions[res.tapIndex];
						switch(action) {
							case '上架商品':
							case '下架商品':
								this.toggleGoodsStatus(item);
								break;
							case '编辑商品':
								this.editGoods(item);
								break;
							case '删除商品':
								this.deleteGoods(item);
								break;
						}
					}
				});
			},

			// 切换商品状态
			async toggleGoodsStatus(item) {
				const newStatus = item.status === '在售' ? '下架' : '在售';
				const action = item.status === '在售' ? '下架' : '上架';
				
				uni.showModal({
					title: `确认${action}`,
					content: `确定要${action}这个商品吗？`,
					success: async (res) => {
						if (res.confirm) {
							try {
								// 调用更新商品状态的接口
								const response = await request.post('/goods/update_status', {
									goods_id: item.goods_id,
									status: newStatus
								});
								
								console.log('更新状态响应:', response);
								
								if (response.code === 200) {
									// 更新本地数据
									item.status = newStatus;
									this.showToast(`${action}成功`, 'success');
								} else {
									this.showToast(response.msg || `${action}失败`, 'none');
								}
							} catch (error) {
								console.error('更新商品状态失败:', error);
								this.showToast(`${action}失败，请重试`, 'none');
							}
						}
					}
				});
			},

			// 编辑商品
			editGoods(item) {
				uni.navigateTo({
					url: `/pages/Me/Edit/product?id=${item.goods_id}`
				});
			},

			// 删除商品
			deleteGoods(item) {
				uni.showModal({
					title: '确认删除',
					content: '删除后无法恢复，确定要删除这个商品吗？',
					success: (res) => {
						if (res.confirm) {
							// 这里应该调用删除商品的接口
							this.showToast('删除成功', 'success');
							// 从列表中移除
							this.goodsList = this.goodsList.filter(goods => goods.goods_id !== item.goods_id);
						}
					}
				});
			},

			// 跳转到发布页面
			goToPublish() {
				uni.switchTab({
					url: '/pages/Release/Release'
				});
			},

			// 获取状态样式类名
			getStatusClass(status) {
				switch(status) {
					case '在售':
						return 'status-available';
					case '已售':
					case '已售出':
						return 'status-sold';
					case '下架':
						return 'status-offline';
					default:
						return 'status-default';
				}
			},

			// 获取图片URL
			getImageUrl(imagePath) {
				return GoodsOperation.getImageUrl(imagePath);
			},

			// 图片加载失败处理
			handleImageError(e) {
				console.log('图片加载失败:', e);
				e.target.src = '/static/logo.png';
			},

			// 显示提示
			showToast(title, icon = 'none') {
				uni.showToast({ title, icon });
			}
		}
	}
</script>

<style>
.me-goods-container {
	background-color: #f5f5f5;
	min-height: 100vh;
}

/* 加载状态 */
.loading {
	padding: 100rpx 0;
	text-align: center;
	color: #999;
}

/* 商品列表 */
.goods-list {
	padding: 20rpx;
}

.goods-item {
	background-color: white;
	border-radius: 12rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	position: relative;
}

/* 商品图片 */
.goods-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: 8rpx;
	margin-right: 20rpx;
	flex-shrink: 0;
}

/* 商品信息 */
.goods-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	margin-right: 80rpx;
}

.goods-title {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
	margin-bottom: 8rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.goods-price {
	font-size: 32rpx;
	color: #ff6b6b;
	font-weight: 600;
	margin-bottom: 8rpx;
}

.goods-meta {
	display: flex;
	align-items: center;
}

.goods-status {
	font-size: 22rpx;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
	color: white;
}

.status-available {
	background-color: #28a745;
}

.status-sold {
	background-color: #6c757d;
}

.status-offline {
	background-color: #ffc107;
	color: #333;
}

.status-default {
	background-color: #007bff;
}

/* 管理按钮 */
.manage-btn {
	position: absolute;
	top: 50%;
	right: 15rpx;
	transform: translateY(-50%);
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(255, 255, 255, 0.9);
	border-radius: 30rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.manage-icon {
	font-size: 32rpx;
}

/* 空状态 */
.empty-state {
	padding: 150rpx 50rpx;
	text-align: center;
}

.empty-icon {
	font-size: 120rpx;
	margin-bottom: 30rpx;
}

.empty-text {
	font-size: 32rpx;
	color: #666;
	margin-bottom: 15rpx;
	display: block;
}

.empty-tip {
	font-size: 26rpx;
	color: #999;
	margin-bottom: 50rpx;
	display: block;
}

.publish-btn {
	background-color: #007bff;
	color: white;
	border: none;
	border-radius: 25rpx;
	padding: 20rpx 60rpx;
	font-size: 28rpx;
}
</style>
