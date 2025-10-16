<script>
	export default {
		onLaunch: function() {
			console.warn('当前组件仅支持 uni_modules 目录结构 ，请升级 HBuilderX 到 3.1.0 版本以上！')
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import '@/uni_modules/uni-scss/index.scss';
	/* #ifndef APP-NVUE */
	@import '@/static/customicons.css';
	// 设置整个项目的背景色
	page {
		background-color: #f5f5f5;
	}

	/* #endif */
	.example-info {
		font-size: 14px;
		color: #333;
		padding: 10px;
	}
	
	/* 发布按钮样式 - 让发布按钮变大突出 */
	/* #ifndef APP-NVUE */
	::v-deep .uni-tabbar__item:nth-child(4) {
		position: relative;
		top: -12px;
	}
	
	::v-deep .uni-tabbar__item:nth-child(4) .uni-tabbar__icon {
		width: 50px !important;
		height: 50px !important;
		border-radius: 25px;
		background: linear-gradient(45deg, #ff6b6b, #ffa500);
		padding: 8px;
		box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
		transform: scale(1.1);
	}
	
	::v-deep .uni-tabbar__item:nth-child(4) .uni-tabbar__icon img {
		filter: brightness(0) invert(1);
	}
	
	::v-deep .uni-tabbar__item:nth-child(4) .uni-tabbar__bd {
		color: #ff6b6b !important;
		font-weight: bold;
		font-size: 11px;
	}
	/* #endif */
</style>
