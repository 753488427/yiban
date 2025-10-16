<template>
	<view class="page-container">
		<AddressManager 
			:userid="userid" 
			@addressLoaded="onAddressLoaded"
			@addressAdded="onAddressAdded"
			@addressUpdated="onAddressUpdated"
			@addressDeleted="onAddressDeleted"
			ref="addressManager"
		/>
	</view>
</template>

<script>
	import AddressManager from '../moudle/address.vue';
	import userUtil from '@/utils/user.js';

	export default {
		components: {
			AddressManager
		},
		data() {
			return {
				userid: null
			}
		},
		onLoad() {
			this.initPage();
		},
		onShow() {
			// 每次显示页面时刷新地址列表
			if (this.$refs.addressManager) {
				this.$refs.addressManager.refresh();
			}
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
			},

			// 地址加载完成回调
			onAddressLoaded(addressList) {
				console.log('地址列表加载完成:', addressList.length);
			},

			// 地址添加成功回调
			onAddressAdded(result) {
				console.log('地址添加成功:', result);
			},

			// 地址更新成功回调
			onAddressUpdated(data) {
				console.log('地址更新成功:', data);
			},

			// 地址删除成功回调
			onAddressDeleted(address_id) {
				console.log('地址删除成功:', address_id);
			}
		}
	}
</script>

<style>
.page-container {
	width: 100%;
	height: 100vh;
}
</style>
