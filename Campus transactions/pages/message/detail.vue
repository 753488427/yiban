<template>
	<view class="chat-container">
		<!-- 消息列表 -->
		<scroll-view 
			class="message-list" 
			scroll-y="true" 
			:scroll-top="scrollTop"
			@scrolltoupper="loadMoreMessages"
			:scroll-into-view="scrollIntoView"
			:enable-back-to-top="true"
			:scroll-with-animation="false"
			:enhanced="true"
			:bounces="false">
			
			<!-- 加载更多提示 -->
			<view class="load-more" v-if="hasMoreMessages && messageList.length > 0">
				<text class="load-text">加载更多消息...</text>
			</view>
			
			<!-- 消息项 -->
			<view 
				class="message-item" 
				v-for="(message, index) in messageList" 
				:key="message.message_id"
				:id="`msg-${message.message_id}`">
				
				<!-- 时间分割线 -->
				<view class="time-divider" v-if="shouldShowTime(message, index)">
					<text class="time-text">{{formatMessageTime(message.created_at)}}</text>
				</view>
				
				<!-- 消息气泡 -->
				<view class="message-wrapper" :class="{'is-mine': message.isMine}">
					<!-- 对方头像（左侧消息） -->
					<image 
						v-if="!message.isMine"
						class="message-avatar left-avatar" 
						:src="otherUser.avatar" 
						mode="aspectFill">
					</image>
					
					<!-- 消息内容区域 -->
					<view class="message-content">
						<!-- 消息气泡 -->
						<view class="message-bubble" :class="{'mine': message.isMine}">
							<!-- 文字消息 -->
							<text v-if="message.message_type === 'text'" class="message-text">{{message.content}}</text>
							
							<!-- 图片消息 -->
							<image 
								v-if="message.message_type === 'image'" 
								class="message-image" 
								:src="getImageUrl(message.image_url)" 
								mode="aspectFill"
								@click="previewImage(message.image_url)">
							</image>
							
							<!-- 商品卡片消息 -->
							<view v-if="message.message_type === 'product'" class="product-card" @click="goToProductDetail(message.product_info)">
								<image 
									class="product-image" 
									:src="getImageUrl(message.product_info.image)" 
									mode="aspectFill">
								</image>
								<view class="product-info">
									<text class="product-title">{{message.product_info.title}}</text>
									<text class="product-price">¥{{message.product_info.price}}</text>
									<text class="product-status" :class="{'selling': message.product_info.status === '在售'}">
										{{message.product_info.status}}
									</text>
								</view>
								<view class="product-arrow">
									<text class="arrow-text">></text>
								</view>
							</view>
						</view>
						
						<!-- 消息状态（外部显示） -->
						<view class="message-status-outer" v-if="message.isMine">
							<text class="status-text" v-if="message.status === 'sending'">发送中</text>
							<text class="status-text" v-if="message.status === 'sent'">已发送</text>
							<text class="status-text read" v-if="message.status === 'read'">已读</text>
						</view>
					</view>
					
					<!-- 我的头像（右侧消息） -->
					<image 
						v-if="message.isMine"
						class="message-avatar right-avatar" 
						:src="myAvatar" 
						mode="aspectFill">
					</image>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view class="empty-state" v-if="messageList.length === 0 && !loading">
				<text class="empty-icon">💬</text>
				<text class="empty-text">还没有消息</text>
				<text class="empty-desc">发送第一条消息开始聊天吧</text>
			</view>
			
			<!-- 底部占位，确保最后一条消息不被输入框遮挡 -->
			<view class="bottom-placeholder"></view>
		</scroll-view>
		
		<!-- 输入区域 -->
		<view class="input-area">
			<view class="input-wrapper">
				<view class="input-left">
					<view class="voice-btn" @click="toggleVoiceInput">
						<uni-icons type="mic" size="24" color="#666"></uni-icons>
					</view>
				</view>
				
				<input 
					class="message-input" 
					v-model="inputMessage"
					placeholder="想跟TA说点什么..."
					:focus="inputFocus"
					@confirm="sendMessage"
					confirm-type="send"
					maxlength="500">
				
				<view class="input-right">
					<view class="add-btn" @click="showAddMenu" v-if="!canSend">
						<uni-icons type="plus" size="24" color="#666"></uni-icons>
					</view>
					<view class="send-btn" :class="{'active': canSend}" @click="sendMessage" v-if="canSend">
						<text class="send-text">发送</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	import SendPicture from './function/send_picture.js';
	
	export default {
		data() {
			return {
				conversationId: '',
				otherUser: {
					id: '',
					username: '',
					avatar: '',
					isOnline: false
				},
				myAvatar: '',
				currentUserId: '',
				
				messageList: [],
				inputMessage: '',
				inputFocus: false,
				scrollTop: 0,
				scrollIntoView: '',
				hasMoreMessages: true,
				loading: false,
				page: 1,
				limit: 20
			}
		},
		
		computed: {
			canSend() {
				return this.inputMessage.trim().length > 0;
			}
		},
		
		onLoad(options) {
			// 获取页面参数
			this.conversationId = options.conversationId;
			this.otherUser.id = options.userId;
			this.otherUser.username = decodeURIComponent(options.username || '');
			this.otherUser.avatar = decodeURIComponent(options.avatar || '');
			this.otherUser.isOnline = Math.random() > 0.5; // 随机在线状态
			
			// 获取当前用户信息
			const userInfo = uni.getStorageSync('userInfo');
			if (userInfo) {
				this.currentUserId = userInfo.userid;
				this.myAvatar = this.getUserAvatar(userInfo.image);
			}
			
			// 如果有有效的conversationId，加载消息；否则等待用户发送第一条消息
			if (this.conversationId && this.conversationId !== 'undefined' && this.conversationId !== 'new') {
				this.loadMessages();
			} else {
				console.log('等待创建新会话或发送第一条消息');
				// 重置conversationId为空，等待发送消息时创建
				this.conversationId = '';
			}
			
			// 如果携带了商品信息，延迟检查并发送（确保消息加载完成后再判断）
			if (options.productInfo) {
				try {
					const productInfo = JSON.parse(decodeURIComponent(options.productInfo));
					console.log('接收到商品信息:', productInfo);
					
					// 延迟检查和发送，确保消息列表加载完成
					setTimeout(() => {
						this.checkAndSendProductCard(productInfo);
					}, 1000);
				} catch (error) {
					console.error('解析商品信息失败:', error);
				}
			}
		},
		
		methods: {
			// 加载消息列表
			async loadMessages(isLoadMore = false) {
				if (this.loading) return;
				
				this.loading = true;
				try {
					const response = await request.get(`/news/messages/${this.conversationId}`, {
						page: this.page,
						limit: this.limit,
						userId: this.currentUserId
					});
					
					if (response.success === '成功') {
						const newMessages = response.result.map(item => ({
							...item,
							isMine: item.sender_id == this.currentUserId,
							status: item.is_read ? 'read' : 'sent',
							// 如果是商品类型消息，解析商品信息
							product_info: item.message_type === 'product' && item.product_info ? 
								JSON.parse(item.product_info) : null
						}));
						
						// 这里不需要设置hasSharedProduct标记，因为我们使用更精确的商品ID检查
						
						if (isLoadMore) {
							this.messageList = [...newMessages, ...this.messageList];
						} else {
							this.messageList = newMessages;
							// 滚动到底部
							this.$nextTick(() => {
								this.scrollToBottom();
							});
						}
						
						this.hasMoreMessages = newMessages.length >= this.limit;
						if (this.hasMoreMessages) {
							this.page++;
						}
					}
				} catch (error) {
					console.error('加载消息失败:', error);
					uni.showToast({
						title: '加载消息失败',
						icon: 'none'
					});
				} finally {
					this.loading = false;
				}
			},
			
			// 加载更多消息
			loadMoreMessages() {
				if (this.hasMoreMessages && !this.loading) {
					this.loadMessages(true);
				}
			},
			
			// 发送消息
			async sendMessage() {
				if (!this.canSend) return;
				
				const content = this.inputMessage.trim();
				this.inputMessage = '';
				
				// 添加临时消息到列表
				const tempMessage = {
					message_id: Date.now(),
					content: content,
					message_type: 'text',
					isMine: true,
					status: 'sending',
					created_at: new Date().toISOString(),
					sender_name: '我'
				};
				
				this.messageList.push(tempMessage);
				this.scrollToBottom();
				
				try {
					const response = await request.post('/news/messages', {
						senderId: this.currentUserId,
						receiverId: this.otherUser.id,
						content: content,
						messageType: 'text'
					});
					
					if (response.success === '成功') {
						// 如果是新会话，更新conversationId
						if (!this.conversationId || this.conversationId === 'undefined') {
							this.conversationId = response.result.conversation_id;
							console.log('新会话创建成功，ID:', this.conversationId);
						}
						
						// 更新消息状态
						const index = this.messageList.findIndex(msg => msg.message_id === tempMessage.message_id);
						if (index !== -1) {
							this.messageList[index] = {
								...tempMessage,
								message_id: response.result.message_id,
								status: 'sent'
							};
						}
					} else {
						// 发送失败，移除临时消息
						const index = this.messageList.findIndex(msg => msg.message_id === tempMessage.message_id);
						if (index !== -1) {
							this.messageList.splice(index, 1);
						}
						uni.showToast({
							title: response.msg || '发送失败',
							icon: 'none'
						});
					}
				} catch (error) {
					console.error('发送消息失败:', error);
					// 发送失败，移除临时消息
					const index = this.messageList.findIndex(msg => msg.message_id === tempMessage.message_id);
					if (index !== -1) {
						this.messageList.splice(index, 1);
					}
					uni.showToast({
						title: '发送失败',
						icon: 'none'
					});
				}
			},
			
			// 发送商品卡片
			async sendProductCard(productInfo) {
				console.log('准备发送商品卡片:', productInfo);
				
				// 添加临时商品卡片消息到列表
				const tempMessage = {
					message_id: Date.now(),
					content: `[商品] ${productInfo.title}`,
					message_type: 'product',
					product_info: productInfo,
					isMine: true,
					status: 'sending',
					created_at: new Date().toISOString(),
					sender_name: '我'
				};
				
				this.messageList.push(tempMessage);
				this.scrollToBottom();
				
				try {
					const response = await request.post('/news/messages', {
						senderId: this.currentUserId,
						receiverId: this.otherUser.id,
						content: `[商品] ${productInfo.title}`,
						messageType: 'product',
						productInfo: JSON.stringify(productInfo)
					});
					
					if (response.success === '成功') {
						// 如果是新会话，更新conversationId
						if (!this.conversationId || this.conversationId === 'undefined') {
							this.conversationId = response.result.conversation_id;
							console.log('新会话创建成功，ID:', this.conversationId);
						}
						
						// 更新消息状态
						const index = this.messageList.findIndex(msg => msg.message_id === tempMessage.message_id);
						if (index !== -1) {
							this.messageList[index] = {
								...tempMessage,
								message_id: response.result.message_id,
								status: 'sent'
							};
						}
						
					} else {
						// 发送失败，移除临时消息
						const index = this.messageList.findIndex(msg => msg.message_id === tempMessage.message_id);
						if (index !== -1) {
							this.messageList.splice(index, 1);
						}
						console.error('发送商品卡片失败:', response.msg);
					}
				} catch (error) {
					console.error('发送商品卡片失败:', error);
					// 发送失败，移除临时消息
					const index = this.messageList.findIndex(msg => msg.message_id === tempMessage.message_id);
					if (index !== -1) {
						this.messageList.splice(index, 1);
					}
				}
			},
			
			// 选择并发送图片
			async chooseImage() {
				if (!this.currentUserId || !this.otherUser.id) {
					uni.showToast({
						title: '用户信息不完整',
						icon: 'none'
					});
					return;
				}

				try {
					const result = await SendPicture.chooseUploadAndSend({
						senderId: this.currentUserId,
						receiverId: this.otherUser.id,
						chooseOptions: {
							count: 1,
							sizeType: ['compressed'],
							sourceType: ['album', 'camera']
						}
					});

					if (result.success) {
						// 如果是新会话，更新conversationId
						if (!this.conversationId || this.conversationId === 'undefined') {
							this.conversationId = result.data.message.conversation_id;
							console.log('新会话创建成功，ID:', this.conversationId);
						}

						// 添加图片消息到列表
						const imageMessage = {
							message_id: result.data.message.message_id,
							content: '[图片]',
							message_type: 'image',
							image_url: result.data.upload.image_url,
							isMine: true,
							status: 'sent',
							created_at: new Date().toISOString(),
							sender_name: '我'
						};

						this.messageList.push(imageMessage);
						this.scrollToBottom();
					}
				} catch (error) {
					console.error('发送图片失败:', error);
				}
			},
			
			// 检查并发送商品卡片
			async checkAndSendProductCard(productInfo) {
				// 检查消息列表中是否已经有该商品的卡片消息
				const hasProductMessage = this.messageList.some(msg => {
					if (msg.message_type === 'product' && msg.isMine && msg.product_info) {
						return msg.product_info.id == productInfo.id;
					}
					return false;
				});

				if (hasProductMessage) {
					console.log('该商品信息已经发送过，跳过发送');
					return;
				}

				// 如果没有发送过，则发送商品卡片
				console.log('首次发送该商品信息');
				await this.sendProductCard(productInfo);
			},
			
			// 切换语音输入
			toggleVoiceInput() {
				uni.showToast({
					title: '语音输入功能开发中',
					icon: 'none'
				});
			},
			
			
			// 显示添加菜单
			showAddMenu() {
				uni.showActionSheet({
					itemList: ['相册', '拍摄', '位置', '名片'],
					success: async (res) => {
						if (res.tapIndex === 0) {
							// 从相册选择
							this.chooseImage();
						} else if (res.tapIndex === 1) {
							// 拍摄照片
							await this.takePhoto();
						} else {
							uni.showToast({
								title: '功能开发中',
								icon: 'none'
							});
						}
					}
				});
			},
			
			// 拍摄照片
			async takePhoto() {
				if (!this.currentUserId || !this.otherUser.id) {
					uni.showToast({
						title: '用户信息不完整',
						icon: 'none'
					});
					return;
				}

				try {
					const result = await SendPicture.chooseUploadAndSend({
						senderId: this.currentUserId,
						receiverId: this.otherUser.id,
						chooseOptions: {
							count: 1,
							sizeType: ['compressed'],
							sourceType: ['camera'] // 只允许拍摄
						}
					});

					if (result.success) {
						// 如果是新会话，更新conversationId
						if (!this.conversationId || this.conversationId === 'undefined') {
							this.conversationId = result.data.message.conversation_id;
							console.log('新会话创建成功，ID:', this.conversationId);
						}

						// 添加图片消息到列表
						const imageMessage = {
							message_id: result.data.message.message_id,
							content: '[图片]',
							message_type: 'image',
							image_url: result.data.upload.image_url,
							isMine: true,
							status: 'sent',
							created_at: new Date().toISOString(),
							sender_name: '我'
						};

						this.messageList.push(imageMessage);
						this.scrollToBottom();
					}
				} catch (error) {
					console.error('拍摄发送图片失败:', error);
				}
			},
			
			// 预览图片
			previewImage(imageUrl) {
				uni.previewImage({
					urls: [this.getImageUrl(imageUrl)],
					current: 0
				});
			},
			
			// 获取图片URL
			getImageUrl(imagePath) {
				if (!imagePath) return '';
				
				if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
					return imagePath;
				}
				
				if (imagePath.startsWith('uploads/')) {
					return `${request.baseUrl}/${imagePath}`;
				}
				
				return imagePath;
			},
			
			// 获取用户头像
			getUserAvatar(avatarPath) {
				if (!avatarPath) {
					const avatarIndex = Math.floor(Math.random() * 9) + 1;
					return `/static/c${avatarIndex}.png`;
				}
				
				if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
					return avatarPath;
				}
				
				if (avatarPath.startsWith('uploads/')) {
					return `${request.baseUrl}/${avatarPath}`;
				}
				
				return avatarPath;
			},
			
			// 滚动到底部
			scrollToBottom() {
				// 使用setTimeout确保DOM更新完成
				setTimeout(() => {
					if (this.messageList.length > 0) {
						const lastMessage = this.messageList[this.messageList.length - 1];
						this.scrollIntoView = `msg-${lastMessage.message_id}`;
						
						// 清除scrollIntoView，避免重复滚动
						setTimeout(() => {
							this.scrollIntoView = '';
						}, 100);
					}
				}, 50);
			},
			
			// 是否显示时间
			shouldShowTime(message, index) {
				if (index === 0) return true;
				
				const prevMessage = this.messageList[index - 1];
				const currentTime = new Date(message.created_at).getTime();
				const prevTime = new Date(prevMessage.created_at).getTime();
				
				// 如果时间间隔超过5分钟，显示时间
				return (currentTime - prevTime) > 5 * 60 * 1000;
			},
			
			// 格式化消息时间
			formatMessageTime(timeStr) {
				const time = new Date(timeStr);
				const now = new Date();
				const diff = now - time;
				
				if (diff < 24 * 60 * 60 * 1000) { // 今天
					return time.toLocaleTimeString('zh-CN', { 
						hour: '2-digit', 
						minute: '2-digit' 
					});
				} else if (diff < 2 * 24 * 60 * 60 * 1000) { // 昨天
					return '昨天 ' + time.toLocaleTimeString('zh-CN', { 
						hour: '2-digit', 
						minute: '2-digit' 
					});
				} else {
					return time.toLocaleDateString('zh-CN') + ' ' + time.toLocaleTimeString('zh-CN', { 
						hour: '2-digit', 
						minute: '2-digit' 
					});
				}
			},
			
			// 返回上一页
			goBack() {
				uni.navigateBack();
			},
			
			// 显示更多操作
			showMoreActions() {
				uni.showActionSheet({
					itemList: ['清空聊天记录', '举报用户'],
					success: (res) => {
						if (res.tapIndex === 0) {
							this.clearChatHistory();
						} else if (res.tapIndex === 1) {
							uni.showToast({ title: '举报功能开发中', icon: 'none' });
						}
					}
				});
			},
			
			// 清空聊天记录
			clearChatHistory() {
				uni.showModal({
					title: '确认清空',
					content: '确定要清空聊天记录吗？此操作不可恢复。',
					success: (res) => {
						if (res.confirm) {
							this.messageList = [];
							uni.showToast({ title: '已清空', icon: 'success' });
						}
					}
				});
			},
			
			// 跳转到商品详情
			goToProductDetail(productInfo) {
				if (productInfo && productInfo.id) {
					uni.navigateTo({
						url: `/pages/Home/function/goods_detail?id=${productInfo.id}`
					});
				}
			}
		}
	}
</script>

<style scoped>
.chat-container {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background-color: #ededed;
	position: relative;
}

/* 消息列表 */
.message-list {
	flex: 1;
	padding: 20rpx 20rpx 0; /* 移除底部padding，由bottom-placeholder处理 */
	overflow: hidden; /* 防止滚动条显示 */
	-webkit-overflow-scrolling: touch; /* iOS平滑滚动 */
}

.load-more {
	text-align: center;
	padding: 20rpx 0;
}

.load-text {
	font-size: 24rpx;
	color: #999;
}

/* 消息项 */
.message-item {
	margin-bottom: 20rpx;
	will-change: transform; /* 启用硬件加速 */
	transform: translateZ(0); /* 强制开启GPU加速 */
}

.time-divider {
	text-align: center;
	margin: 30rpx 0 20rpx;
}

.time-text {
	font-size: 22rpx;
	color: #999;
	background: rgba(0, 0, 0, 0.05);
	padding: 6rpx 16rpx;
	border-radius: 6rpx;
}

.message-wrapper {
	display: flex;
	align-items: flex-start;
	margin-bottom: 20rpx;
	padding: 0 10rpx; /* 添加左右内边距，确保头像不被裁切 */
	will-change: transform; /* 启用硬件加速 */
	transform: translateZ(0); /* 强制开启GPU加速 */
}

.message-wrapper.is-mine {
	justify-content: flex-end;
	padding-right: 50rpx; /* 右侧消息向左移动10px，即20rpx */
}

.message-wrapper:not(.is-mine) {
	justify-content: flex-start;
}

.message-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 10rpx;
	flex-shrink: 0;
	will-change: transform; /* 启用硬件加速 */
	transform: translateZ(0); /* 强制开启GPU加速 */
}

.left-avatar {
	margin-right: 20rpx;
}

.right-avatar {
	margin-left: 20rpx;
}

.message-content {
	display: flex;
	flex-direction: column;
	align-items: flex-end; /* 默认右对齐，适用于我的消息 */
	max-width: 60%;
}

.message-wrapper:not(.is-mine) .message-content {
	align-items: flex-start; /* 对方消息左对齐 */
}

.message-bubble {
	padding: 20rpx 24rpx;
	border-radius: 10rpx;
	position: relative;
	word-break: break-all;
	margin-bottom: 8rpx; /* 为外部状态留出空间 */
}

/* 对方消息气泡 */
.message-wrapper:not(.is-mine) .message-bubble {
	background: white;
	color: #333;
	border-top-left-radius: 4rpx;
}

/* 我的消息气泡 */
.message-wrapper.is-mine .message-bubble {
	background: white;
	color: #333;
	border-top-right-radius: 4rpx;
}

.message-text {
	font-size: 32rpx;
	line-height: 1.4;
}

.message-image {
	width: 300rpx;
	height: 300rpx;
	border-radius: 10rpx;
}

/* 商品卡片样式 */
.product-card {
	display: flex;
	align-items: center;
	background: #f8f9fa;
	border-radius: 12rpx;
	padding: 20rpx;
	min-width: 500rpx;
	max-width: 600rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.message-wrapper.is-mine .product-card {
	background: white;
}

.product-image {
	width: 100rpx;
	height: 100rpx;
	border-radius: 8rpx;
	margin-right: 20rpx;
	background-color: #e9ecef;
	flex-shrink: 0;
}

.product-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.product-title {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
	line-height: 1.3;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	overflow: hidden;
}

.product-price {
	font-size: 32rpx;
	color: #ff6b6b;
	font-weight: 600;
}

.product-status {
	font-size: 22rpx;
	color: #999;
	padding: 4rpx 8rpx;
	border-radius: 8rpx;
	background: #f0f0f0;
	align-self: flex-start;
}

.product-status.selling {
	color: #52c41a;
	background: #f6ffed;
}

.product-arrow {
	margin-left: 20rpx;
	display: flex;
	align-items: center;
}

.arrow-text {
	font-size: 24rpx;
	color: #999;
}

.message-status-outer {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	margin-top: 4rpx;
}

.message-wrapper:not(.is-mine) .message-status-outer {
	justify-content: flex-start;
}

.status-text {
	font-size: 20rpx;
	color: #999;
}

.status-text.read {
	color: #576b95;
}

/* 输入区域 */
.input-area {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: #f7f7f7;
	padding: 20rpx 30rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	border-top: 1rpx solid #d9d9d9;
	z-index: 999;
}

.input-wrapper {
	display: flex;
	align-items: center;
	background: white;
	border-radius: 10rpx;
	padding: 16rpx 20rpx;
	border: 1rpx solid #d9d9d9;
}

.input-left {
	display: flex;
	align-items: center;
	margin-right: 20rpx;
}

.voice-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 8rpx;
	background: #f5f5f5;
}

.message-input {
	flex: 1;
	font-size: 32rpx;
	color: #333;
	background: transparent;
	border: none;
	outline: none;
	min-height: 60rpx;
	line-height: 60rpx;
}

.input-right {
	display: flex;
	align-items: center;
	gap: 20rpx;
	margin-left: 20rpx;
}

.add-btn {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 8rpx;
	background: #f5f5f5;
}

.send-btn {
	padding: 12rpx 24rpx;
	background: #07c160;
	border-radius: 8rpx;
	min-width: 100rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.send-text {
	font-size: 28rpx;
	color: white;
	font-weight: 500;
}

/* 空状态 */
.empty-state {
	text-align: center;
	padding: 100rpx 50rpx;
}

.empty-icon {
	font-size: 80rpx;
	display: block;
	margin-bottom: 20rpx;
}

.empty-text {
	font-size: 28rpx;
	color: #666;
	display: block;
	margin-bottom: 10rpx;
}

.empty-desc {
	font-size: 24rpx;
	color: #999;
	display: block;
}

/* 底部占位符 */
.bottom-placeholder {
	height: 120rpx; /* 为输入区域留出空间 */
	width: 100%;
}
</style>