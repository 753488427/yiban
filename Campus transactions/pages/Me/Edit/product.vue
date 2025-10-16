<template>
	<view class="edit-product-container">

		<!-- 表单内容 -->
		<view class="form-container" v-if="!loading">
			<!-- 商品图片 -->
			<view class="form-section">
				<view class="image-upload-area">
					<view class="image-list">
						<view class="image-item" v-for="(image, index) in imageList" :key="index">
							<image class="upload-image" :src="getImageUrl(image)" mode="aspectFill"></image>
							<view class="delete-btn" @click="removeImage(index)">×</view>
						</view>
						<view class="add-image-btn" @click="chooseImage" v-if="imageList.length < 9">
							<text class="add-icon">+</text>
							<text class="add-text">添加图片</text>
						</view>
					</view>
					<text class="image-tip">最多上传9张图片，建议尺寸750x750</text>
				</view>
			</view>

			<!-- 商品标题 -->
			<view class="form-section">
				<view class="section-title">商品标题</view>
				<input 
					class="form-input" 
					v-model="formData.title" 
					placeholder="请输入商品标题"
					maxlength="50"
				/>
			</view>

			<!-- 商品价格 -->
			<view class="form-section">
				<view class="section-title">商品价格</view>
				<view class="price-input-container">
					<text class="price-symbol">¥</text>
					<input 
						class="price-input" 
						v-model="formData.price" 
						placeholder="0.00"
						type="digit"
					/>
				</view>
			</view>

			<!-- 商品分类 -->
			<view class="form-section">
				<view class="section-title">商品分类</view>
				<picker 
					:value="classifyIndex" 
					:range="classifyList" 
					@change="onClassifyChange"
				>
					<view class="picker-input">
						<text class="picker-text" :class="{'placeholder': !formData.classify}">
							{{ formData.classify || '请选择商品分类' }}
						</text>
						<text class="picker-arrow">></text>
					</view>
				</picker>
			</view>

			<!-- 商品地址 -->
			<view class="form-section">
				<view class="section-title">商品地址</view>
				<input 
					class="form-input" 
					v-model="formData.address" 
					placeholder="请输入商品地址"
				/>
			</view>

			<!-- 商品描述 -->
			<view class="form-section">
				<view class="section-title">商品描述</view>
				<textarea 
					class="form-textarea" 
					v-model="formData.content" 
					placeholder="请详细描述商品的特点、使用情况等"
					maxlength="500"
				></textarea>
				<text class="char-count">{{ formData.content.length }}/500</text>
			</view>
		</view>

		<!-- 加载状态 -->
		<view class="loading-container" v-if="loading">
			<text class="loading-text">加载中...</text>
		</view>

		<!-- 保存按钮 -->
		<view class="bottom-save-area" v-if="!loading">
			<button class="save-product-btn" @click="saveProduct" :disabled="saving">
				{{ saving ? '保存中...' : '保存修改' }}
			</button>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	import GoodsOperation from '../../Home/moudle/operation.js';

	export default {
		data() {
			return {
				goodsId: '',
				loading: true,
				saving: false,
				imageList: [], // 图片列表
				formData: {
					title: '',
					price: '',
					content: '',
					classify: '',
					address: ''
				},
				classifyList: ['数码产品', '生活用品', '娱乐休闲', '服装配饰', '教材书籍', '跑腿配送'],
				classifyIndex: 0
			}
		},

		onLoad(options) {
			if (options.id) {
				this.goodsId = options.id;
				this.loadProductDetail();
			} else {
				uni.showToast({
					title: '商品ID不能为空',
					icon: 'none'
				});
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
			}
		},

		methods: {
			// 加载商品详情
			async loadProductDetail() {
				this.loading = true;
				try {
					const response = await request.post('/goods/detail', {
						goods_id: this.goodsId
					});

					console.log('商品详情响应:', response);

					if (response.code === 200 && response.result) {
						const product = response.result;
						
						// 填充表单数据
						this.formData = {
							title: product.title || '',
							price: product.price ? product.price.toString() : '',
							content: product.content || '',
							classify: product.classify || '',
							address: product.address || ''
						};

						// 处理图片
						this.imageList = [];
						if (product.image) {
							this.imageList.push(product.image);
						}
						if (product.imageone) {
							this.imageList.push(product.imageone);
						}

						// 设置分类索引
						if (product.classify) {
							const index = this.classifyList.indexOf(product.classify);
							this.classifyIndex = index >= 0 ? index : 0;
						}

					} else {
						uni.showToast({
							title: response.msg || '获取商品详情失败',
							icon: 'none'
						});
						setTimeout(() => {
							uni.navigateBack();
						}, 1500);
					}
				} catch (error) {
					console.error('加载商品详情失败:', error);
					uni.showToast({
						title: '加载失败，请重试',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},

			// 选择图片
			chooseImage() {
				const remainCount = 9 - this.imageList.length;
				uni.chooseImage({
					count: remainCount,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						this.imageList = this.imageList.concat(res.tempFilePaths);
					}
				});
			},

			// 删除图片
			removeImage(index) {
				this.imageList.splice(index, 1);
			},

			// 分类选择
			onClassifyChange(e) {
				this.classifyIndex = e.detail.value;
				this.formData.classify = this.classifyList[e.detail.value];
			},

			// 获取图片URL
			getImageUrl(imagePath) {
				return GoodsOperation.getImageUrl(imagePath);
			},

			// 返回
			goBack() {
				uni.navigateBack();
			},

			// 保存商品
			async saveProduct() {
				// 表单验证
				if (!this.formData.title.trim()) {
					uni.showToast({
						title: '请输入商品标题',
						icon: 'none'
					});
					return;
				}

				if (!this.formData.price || parseFloat(this.formData.price) <= 0) {
					uni.showToast({
						title: '请输入正确的价格',
						icon: 'none'
					});
					return;
				}

				if (!this.formData.classify) {
					uni.showToast({
						title: '请选择商品分类',
						icon: 'none'
					});
					return;
				}

				this.saving = true;

				try {
					// 上传商品信息
					const response = await this.uploadProduct();

					if (response.code === 200) {
						uni.showToast({
							title: '保存成功',
							icon: 'success'
						});
						setTimeout(() => {
							uni.navigateBack();
						}, 1500);
					} else {
						uni.showToast({
							title: response.msg || '保存失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('保存商品失败:', error);
					uni.showToast({
						title: '保存失败，请重试',
						icon: 'none'
					});
				} finally {
					this.saving = false;
				}
			},

			// 上传商品信息
			uploadProduct() {
				return new Promise((resolve, reject) => {
					// 准备上传的图片（只上传新选择的本地图片）
					const localImages = this.imageList.filter(img => img.startsWith('file://') || img.startsWith('blob:'));
					
					uni.uploadFile({
						url: `${request.baseUrl}/goods/update`,
						filePath: localImages[0] || '', // 如果没有新图片，传空字符串
						name: 'images',
						formData: {
							goods_id: this.goodsId,
							title: this.formData.title.trim(),
							price: this.formData.price,
							content: this.formData.content.trim(),
							classify: this.formData.classify,
							address: this.formData.address.trim()
						},
						success: (uploadRes) => {
							try {
								const response = JSON.parse(uploadRes.data);
								resolve(response);
							} catch (e) {
								reject(new Error('响应解析失败'));
							}
						},
						fail: (error) => {
							reject(error);
						}
					});
				});
			}
		}
	}
</script>

<style>
.edit-product-container {
	background-color: #f5f7fa;
	min-height: 100vh;
	padding-bottom: 120rpx;
}

/* 表单容器 */
.form-container {
	padding: 20rpx;
}

.form-section {
	background: white;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.section-title {
	font-size: 28rpx;
	color: #333;
	font-weight: bold;
	margin-bottom: 20rpx;
}

/* 图片上传 */
.image-upload-area {
	width: 100%;
}

.image-list {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
	margin-bottom: 20rpx;
}

.image-item {
	position: relative;
	width: 160rpx;
	height: 160rpx;
}

.upload-image {
	width: 100%;
	height: 100%;
	border-radius: 12rpx;
	object-fit: cover;
}

.delete-btn {
	position: absolute;
	top: -10rpx;
	right: -10rpx;
	width: 40rpx;
	height: 40rpx;
	background: #ff4757;
	color: white;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
}

.add-image-btn {
	width: 160rpx;
	height: 160rpx;
	border: 2rpx dashed #ddd;
	border-radius: 12rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: #fafafa;
}

.add-icon {
	font-size: 48rpx;
	color: #999;
	margin-bottom: 10rpx;
}

.add-text {
	font-size: 22rpx;
	color: #999;
}

.image-tip {
	font-size: 22rpx;
	color: #999;
}

/* 表单输入 */
.form-input {
	width: 94%;
	height: 80rpx;
	border: 1rpx solid #eee;
	border-radius: 12rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
	background: #fafafa;
}

.price-input-container {
	display: flex;
	align-items: center;
	border: 1rpx solid #eee;
	border-radius: 12rpx;
	background: #fafafa;
	padding: 0 20rpx;
	height: 80rpx;
}

.price-symbol {
	font-size: 28rpx;
	color: #333;
	margin-right: 10rpx;
}

.price-input {
	flex: 1;
	font-size: 28rpx;
	height: 100%;
}

.picker-input {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 80rpx;
	border: 1rpx solid #eee;
	border-radius: 12rpx;
	padding: 0 20rpx;
	background: #fafafa;
}

.picker-text {
	font-size: 28rpx;
	color: #333;
}

.picker-text.placeholder {
	color: #999;
}

.picker-arrow {
	font-size: 24rpx;
	color: #999;
}

.form-textarea {
	width: 100%;
	min-height: 200rpx;
	border: 1rpx solid #eee;
	border-radius: 12rpx;
	padding: 20rpx;
	font-size: 28rpx;
	background: #fafafa;
	line-height: 1.5;
}

.char-count {
	font-size: 22rpx;
	color: #999;
	text-align: right;
	margin-top: 10rpx;
}

/* 加载状态 */
.loading-container {
	padding: 200rpx 0;
	text-align: center;
}

.loading-text {
	font-size: 28rpx;
	color: #999;
}

/* 底部保存按钮 */
.bottom-save-area {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: white;
	padding: 20rpx 30rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	border-top: 1rpx solid #eee;
}

.save-product-btn {
	width: 100%;
	height: 80rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border: none;
	border-radius: 40rpx;
	font-size: 28rpx;
	font-weight: bold;
}

.save-product-btn[disabled] {
	background: #ccc;
}
</style>