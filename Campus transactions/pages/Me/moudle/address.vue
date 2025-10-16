<template>
	<view class="address-container">
		<!-- 加载状态 -->
		<view class="loading" v-if="loading">
			<text>加载中...</text>
		</view>

		<!-- 地址列表 -->
		<view class="address-list" v-else-if="addressList.length > 0">
			<view 
				class="address-item" 
				v-for="item in addressList" 
				:key="item.address_id"
			>
				<!-- 地址信息 -->
				<view class="address-info">
					<view class="address-header">
						<text class="contact-name">{{ item.username }}</text>
						<text class="contact-phone">{{ item.phone }}</text>
					</view>
					<view class="address-detail">
						<text class="address-area">{{ item.area }}</text>
						<text class="address-specific">{{ item.area_one }}</text>
					</view>
				</view>

				<!-- 操作按钮 -->
				<view class="address-actions">
					<view class="action-btn edit-btn" @click="editAddress(item)">
						<text class="action-text">编辑</text>
					</view>
					<view class="action-btn delete-btn" @click="deleteAddress(item)">
						<text class="action-text">删除</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty-state" v-else>
			<view class="empty-icon">📍</view>
			<text class="empty-text">暂无收货地址</text>
			<text class="empty-tip">添加收货地址，方便快速下单</text>
			<button class="add-btn" @click="addAddress">添加地址</button>
		</view>

		<!-- 添加地址按钮 -->
		<view class="add-address-btn" v-if="addressList.length > 0" @click="showAddressModal()">
			<text class="add-text">+ 添加新地址</text>
		</view>

		<!-- 地址编辑弹窗 -->
		<view class="modal-overlay" v-if="showModal" @click="closeModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">{{ isEdit ? '编辑地址' : '添加地址' }}</text>
					<view class="close-btn" @click="closeModal">×</view>
				</view>
				
				<view class="modal-body">
					<view class="form-item">
						<text class="form-label">收货人</text>
						<input class="form-input" v-model="formData.username" placeholder="请输入收货人姓名" />
					</view>
					
					<view class="form-item">
						<text class="form-label">手机号</text>
						<input class="form-input" v-model="formData.phone" placeholder="请输入手机号" type="number" maxlength="11" />
					</view>
					
					<view class="form-item">
						<text class="form-label">所在区域</text>
						<input class="form-input" v-model="formData.area" placeholder="请输入所在区域" />
					</view>
					
					<view class="form-item">
						<text class="form-label">详细地址</text>
						<textarea class="form-textarea" v-model="formData.area_one" placeholder="请输入详细地址"></textarea>
					</view>
				</view>
				
				<view class="modal-footer">
					<button class="cancel-btn" @click="closeModal">取消</button>
					<button class="confirm-btn" @click="saveAddress">{{ isEdit ? '保存' : '添加' }}</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	import userUtil from '@/utils/user.js';

	export default {
		name: 'AddressManager',
		props: {
			userid: {
				type: [String, Number],
				required: true
			}
		},
		data() {
			return {
				addressList: [],
				loading: true,
				showModal: false,
				isEdit: false,
				currentAddressId: null,
				formData: {
					username: '',
					phone: '',
					area: '',
					area_one: ''
				}
			}
		},
		mounted() {
			this.loadAddressList();
		},
		watch: {
			userid: {
				handler(newVal) {
					if (newVal) {
						this.loadAddressList();
					}
				},
				immediate: true
			}
		},
		methods: {
			// 加载地址列表
			loadAddressList() {
				if (!this.userid) return;
				
				this.loading = true;
				request.post('/address/', {
					userid: this.userid
				}).then(res => {
					this.loading = false;
					if (res.success === "成功") {
						this.addressList = res.result || [];
						this.$emit('addressLoaded', this.addressList);
					} else {
						this.showToast(res.msg || '获取地址列表失败');
					}
				}).catch(err => {
					this.loading = false;
					this.showToast('网络错误，请重试');
				});
			},

			// 显示添加地址弹窗
			showAddressModal(item = null) {
				this.isEdit = !!item;
				this.currentAddressId = item ? item.address_id : null;
				
				if (item) {
					// 编辑模式，填充表单数据
					this.formData = {
						username: item.username,
						phone: item.phone,
						area: item.area,
						area_one: item.area_one
					};
				} else {
					// 添加模式，清空表单数据
					this.formData = {
						username: '',
						phone: '',
						area: '',
						area_one: ''
					};
				}
				
				this.showModal = true;
			},

			// 添加地址（空状态按钮）
			addAddress() {
				this.showAddressModal();
			},

			// 编辑地址
			editAddress(item) {
				this.showAddressModal(item);
			},

			// 关闭弹窗
			closeModal() {
				this.showModal = false;
				this.isEdit = false;
				this.currentAddressId = null;
				this.formData = {
					username: '',
					phone: '',
					area: '',
					area_one: ''
				};
			},

			// 保存地址
			saveAddress() {
				// 表单验证
				if (!this.formData.username.trim()) {
					return this.showToast('请输入收货人姓名');
				}
				if (!this.formData.phone.trim()) {
					return this.showToast('请输入手机号');
				}
				if (!/^1[3-9]\d{9}$/.test(this.formData.phone)) {
					return this.showToast('请输入正确的手机号');
				}
				if (!this.formData.area.trim()) {
					return this.showToast('请输入所在区域');
				}
				if (!this.formData.area_one.trim()) {
					return this.showToast('请输入详细地址');
				}

				if (this.isEdit) {
					this.updateAddress();
				} else {
					this.addNewAddress();
				}
			},

			// 添加新地址
			addNewAddress() {
				const data = {
					userid: this.userid,
					...this.formData
				};

				request.post('/address/add', data).then(res => {
					if (res.code === 200) {
						this.showToast('添加成功', 'success');
						this.closeModal();
						this.loadAddressList();
						this.$emit('addressAdded', res.result);
					} else {
						this.showToast(res.msg || '添加失败');
					}
				}).catch(err => {
					this.showToast('网络错误，请重试');
				});
			},

			// 更新地址
			updateAddress() {
				const data = {
					address_id: this.currentAddressId,
					...this.formData
				};

				request.post('/address/update', data).then(res => {
					if (res.code === 200) {
						this.showToast('修改成功', 'success');
						this.closeModal();
						this.loadAddressList();
						this.$emit('addressUpdated', data);
					} else {
						this.showToast(res.msg || '修改失败');
					}
				}).catch(err => {
					this.showToast('网络错误，请重试');
				});
			},

			// 删除地址
			deleteAddress(item) {
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这个收货地址吗？',
					success: (res) => {
						if (res.confirm) {
							this.doDeleteAddress(item.address_id);
						}
					}
				});
			},

			// 执行删除地址
			doDeleteAddress(address_id) {
				request.post('/address/delete', { address_id }).then(res => {
					if (res.code === 200) {
						this.showToast('删除成功', 'success');
						this.loadAddressList();
						this.$emit('addressDeleted', address_id);
					} else {
						this.showToast(res.msg || '删除失败');
					}
				}).catch(err => {
					this.showToast('网络错误，请重试');
				});
			},

			// 刷新地址列表（供外部调用）
			refresh() {
				this.loadAddressList();
			},

			// 显示提示
			showToast(title, icon = 'none') {
				uni.showToast({ title, icon });
			}
		}
	}
</script>

<style scoped>
.address-container {
	background-color: #f5f5f5;
	min-height: 100vh;
	padding-bottom: 120rpx;
}

/* 加载状态 */
.loading {
	padding: 100rpx 0;
	text-align: center;
	color: #999;
}

/* 地址列表 */
.address-list {
	padding: 20rpx;
}

.address-item {
	background-color: white;
	border-radius: 12rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

/* 地址信息 */
.address-info {
	margin-bottom: 20rpx;
}

.address-header {
	display: flex;
	align-items: center;
	margin-bottom: 15rpx;
}

.contact-name {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
	margin-right: 20rpx;
}

.contact-phone {
	font-size: 28rpx;
	color: #666;
}

.address-detail {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.address-area {
	font-size: 26rpx;
	color: #999;
}

.address-specific {
	font-size: 28rpx;
	color: #333;
	line-height: 1.4;
}

/* 操作按钮 */
.address-actions {
	display: flex;
	gap: 20rpx;
}

.action-btn {
	flex: 1;
	height: 60rpx;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1rpx solid #ddd;
}

.edit-btn {
	background-color: #f8f9fa;
	border-color: #dee2e6;
}

.delete-btn {
	background-color: #fff5f5;
	border-color: #fed7d7;
}

.action-text {
	font-size: 26rpx;
	color: #666;
}

.delete-btn .action-text {
	color: #e53e3e;
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

.add-btn {
	background-color: #007bff;
	color: white;
	border: none;
	border-radius: 25rpx;
	padding: 20rpx 60rpx;
	font-size: 28rpx;
}

/* 添加地址按钮 */
.add-address-btn {
	position: fixed;
	bottom: 30rpx;
	left: 30rpx;
	right: 30rpx;
	height: 80rpx;
	background-color: #007bff;
	border-radius: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 12rpx rgba(0, 123, 255, 0.3);
}

.add-text {
	color: white;
	font-size: 30rpx;
	font-weight: 600;
}

/* 弹窗样式 */
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.modal-content {
	background-color: white;
	border-radius: 12rpx;
	width: 90%;
	max-width: 600rpx;
	max-height: 80vh;
	overflow: hidden;
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.close-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40rpx;
	color: #999;
	border-radius: 30rpx;
	background-color: #f5f5f5;
}

.modal-body {
	padding: 30rpx;
	max-height: 60vh;
	overflow-y: auto;
}

.form-item {
	margin-bottom: 30rpx;
}

.form-label {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 15rpx;
	font-weight: 500;
}

.form-input {
	width: 100%;
	height: 80rpx;
	border: 1rpx solid #ddd;
	border-radius: 8rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
	background-color: #fafafa;
}

.form-input:focus {
	border-color: #007bff;
	background-color: white;
}

.form-textarea {
	width: 100%;
	min-height: 120rpx;
	border: 1rpx solid #ddd;
	border-radius: 8rpx;
	padding: 20rpx;
	font-size: 28rpx;
	background-color: #fafafa;
	resize: none;
}

.form-textarea:focus {
	border-color: #007bff;
	background-color: white;
}

.modal-footer {
	display: flex;
	gap: 20rpx;
	padding: 30rpx;
	border-top: 1rpx solid #f0f0f0;
}

.cancel-btn {
	flex: 1;
	height: 80rpx;
	background-color: #f8f9fa;
	color: #666;
	border: 1rpx solid #dee2e6;
	border-radius: 8rpx;
	font-size: 28rpx;
}

.confirm-btn {
	flex: 1;
	height: 80rpx;
	background-color: #007bff;
	color: white;
	border: none;
	border-radius: 8rpx;
	font-size: 28rpx;
}
</style>