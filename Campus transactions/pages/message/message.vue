<template>
	<view class="message-container">
		<!-- 聊天列表 -->
		<view class="chat-section">
			<view class="section-header">
				<text class="section-title">最近聊天</text>
				<text class="clear-btn" @click="clearAllRead">全部已读</text>
			</view>
			
 			<scroll-view 
				class="chat-list" 
				scroll-y="true" 
				@scrolltolower="loadMoreChats"
				refresher-enabled="true"
				:refresher-triggered="refresherTriggered"
				@refresherrefresh="onRefresh"
				refresher-background="#f5f7fa">
				
				<view class="chat-item" 
					v-for="(chat, index) in chatList" 
					:key="chat.id" 
					@click="openChat(chat)"
					@longpress="showChatOptions(chat, index)">
					
					<!-- 用户头像 -->
					<view class="avatar-container">
						<image class="user-avatar" :src="chat.avatar" mode="aspectFill"></image>
						<view class="online-status" v-if="chat.isOnline"></view>
					</view>
					
					<!-- 聊天信息 -->
					<view class="chat-info">
						<view class="chat-header">
							<text class="username">{{chat.username}}</text>
							<text class="chat-time">{{formatTime(chat.lastTime)}}</text>
						</view>
						<view class="chat-content">
							<view class="message-preview">
								<text class="message-type" v-if="chat.lastMessage.type === 'image'">📷 </text>
								<text class="message-type" v-if="chat.lastMessage.type === 'product'">🛍️ </text>
								<text class="message-text" :class="{'unread': chat.unreadCount > 0}">
									{{getMessagePreview(chat.lastMessage)}}
								</text>
							</view>
							<view class="chat-status">
								<view class="unread-count" v-if="chat.unreadCount > 0">{{chat.unreadCount > 99 ? '99+' : chat.unreadCount}}</view>
								<view class="message-status" v-if="chat.lastMessage.isMine">
									<text class="status-icon" v-if="chat.lastMessage.status === 'sending'">⏳</text>
									<text class="status-icon" v-if="chat.lastMessage.status === 'sent'"></text>
									<text class="status-icon read" v-if="chat.lastMessage.status === 'read'"></text>
								</view>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 空状态 -->
				<view class="empty-state" v-if="chatList.length === 0 && !loading">
					<text class="empty-icon">💭</text>
					<text class="empty-text">暂无聊天记录</text>
					<text class="empty-desc">快去首页找找心仪的商品吧～</text>
				</view>
				
				<!-- 加载更多 -->
				<view class="load-more" v-if="hasMoreChats && chatList.length > 0">
					<text class="load-text">加载更多...</text>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
	import request from '@/utils/request.js';
	
	export default {
		data() {
			return {
				hasMoreChats: true,
				loading: false,
				refresherTriggered: false, // 下拉刷新状态
				
				// 聊天列表数据
				chatList: []
			}
		},
		
		mounted() {
			this.loadConversations();
		},
		
		// 页面显示时刷新数据
		onShow() {
			console.log('消息页面显示，刷新会话列表');
			this.loadConversations();
		},
		
		// 页面隐藏时的处理
		onHide() {
			// 可以在这里做一些清理工作
		},
		
		methods: {
			// 下拉刷新
			async onRefresh() {
				console.log('触发下拉刷新');
				this.refresherTriggered = true;
				
				try {
					await this.loadConversations();
					uni.showToast({
						title: '刷新成功',
						icon: 'success',
						duration: 1000
					});
				} catch (error) {
					console.error('刷新失败:', error);
					uni.showToast({
						title: '刷新失败',
						icon: 'none',
						duration: 1000
					});
				} finally {
					// 延迟关闭刷新状态，确保用户看到刷新动画
					setTimeout(() => {
						this.refresherTriggered = false;
					}, 500);
				}
			},
			
			// 加载会话列表
			async loadConversations() {
				// 如果不是下拉刷新，显示loading
				if (!this.refresherTriggered) {
					this.loading = true;
				}
				
				try {
					// 获取当前用户信息
					const userInfo = uni.getStorageSync('userInfo');
					if (!userInfo || !userInfo.userid) {
						if (!this.refresherTriggered) {
							uni.showToast({
								title: '请先登录',
								icon: 'none'
							});
						}
						return;
					}
					
					const response = await request.get(`/news/conversations/${userInfo.userid}`);
					
					if (response.success === '成功') {
						this.chatList = response.result.map(item => ({
							id: item.conversation_id,
							userId: item.other_user_id,
							username: item.other_user_name || '匿名用户',
							avatar: this.getUserAvatar(item.other_user_avatar),
							isOnline: Math.random() > 0.5, // 随机在线状态
							lastTime: new Date(item.last_message_time).getTime(),
							unreadCount: item.unread_count || 0,
							lastMessage: {
								type: item.last_message_type || 'text',
								content: item.last_message_content || '暂无消息',
								// 根据会话中的用户关系判断是否是我发送的消息
								isMine: this.isMyMessage(item, userInfo.userid),
								status: 'read'
							}
						}));
						
						console.log('会话列表加载成功，共', this.chatList.length, '个会话');
					} else {
						this.chatList = [];
						console.log('没有会话数据');
					}
				} catch (error) {
					console.error('加载会话列表失败:', error);
					if (!this.refresherTriggered) {
						uni.showToast({
							title: '加载失败',
							icon: 'none'
						});
					}
				} finally {
					if (!this.refresherTriggered) {
						this.loading = false;
					}
				}
			},
			
			// 判断消息是否是我发送的
			isMyMessage(conversationItem, currentUserId) {
				// 根据最后一条消息的发送者ID判断
				if (conversationItem.last_message_sender_id) {
					return conversationItem.last_message_sender_id == currentUserId;
				}
				// 如果没有发送者信息，默认返回false
				return false;
			},
			
			// 获取用户头像
			getUserAvatar(avatarPath) {
				if (!avatarPath) {
					// 如果没有头像，使用默认头像
					const avatarIndex = Math.floor(Math.random() * 9) + 1;
					return `/static/c${avatarIndex}.png`;
				}
				
				// 如果已经是完整的URL，直接返回
				if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
					return avatarPath;
				}
				
				// 如果是uploads路径，拼接服务器地址
				if (avatarPath.startsWith('uploads/')) {
					return `${request.baseUrl}/${avatarPath}`;
				}
				
				// 默认处理
				return avatarPath;
			},
			
			// 全部已读
			async clearAllRead() {
				try {
					const userInfo = uni.getStorageSync('userInfo');
					if (!userInfo || !userInfo.userid) return;
					
					// 标记所有会话为已读
					for (let chat of this.chatList) {
						if (chat.unreadCount > 0) {
							await request.put(`/news/conversations/${chat.id}/read`, {
								userId: userInfo.userid
							});
							chat.unreadCount = 0;
						}
					}
					
					uni.showToast({ title: '已全部标记为已读', icon: 'success' });
				} catch (error) {
					console.error('标记已读失败:', error);
					uni.showToast({
						title: '操作失败',
						icon: 'none'
					});
				}
			},
			
			// 打开聊天
			async openChat(chat) {
				try {
					// 标记为已读
					if (chat.unreadCount > 0) {
						const userInfo = uni.getStorageSync('userInfo');
						if (userInfo && userInfo.userid) {
							await request.put(`/news/conversations/${chat.id}/read`, {
								userId: userInfo.userid
							});
							chat.unreadCount = 0;
						}
					}
					
					// 跳转到聊天详情页面
					uni.navigateTo({ 
						url: `/pages/message/detail?conversationId=${chat.id}&userId=${chat.userId}&username=${encodeURIComponent(chat.username)}&avatar=${encodeURIComponent(chat.avatar)}` 
					});
				} catch (error) {
					console.error('打开聊天失败:', error);
					uni.showToast({
						title: '打开聊天失败',
						icon: 'none'
					});
				}
			},
			
			// 显示聊天选项
			async showChatOptions(chat, index) {
				uni.showActionSheet({
					itemList: ['标记为已读', '置顶聊天', '删除聊天'],
					success: async (res) => {
						if (res.tapIndex === 0) {
							// 标记为已读
							try {
								const userInfo = uni.getStorageSync('userInfo');
								if (userInfo && userInfo.userid) {
									await request.put(`/news/conversations/${chat.id}/read`, {
										userId: userInfo.userid
									});
									chat.unreadCount = 0;
									uni.showToast({ title: '已标记为已读', icon: 'success' });
								}
							} catch (error) {
								uni.showToast({ title: '操作失败', icon: 'none' });
							}
						} else if (res.tapIndex === 1) {
							// 置顶逻辑
							this.chatList.unshift(this.chatList.splice(index, 1)[0]);
							uni.showToast({ title: '已置顶', icon: 'success' });
						} else if (res.tapIndex === 2) {
							// 删除聊天
							uni.showModal({
								title: '确认删除',
								content: `确定要删除与${chat.username}的聊天记录吗？`,
								success: async (res) => {
									if (res.confirm) {
										try {
											const userInfo = uni.getStorageSync('userInfo');
											if (userInfo && userInfo.userid) {
												await request.delete(`/news/conversations/${chat.id}`, {
													userId: userInfo.userid
												});
												this.chatList.splice(index, 1);
												uni.showToast({ title: '已删除', icon: 'success' });
											}
										} catch (error) {
											uni.showToast({ title: '删除失败', icon: 'none' });
										}
									}
								}
							});
						}
					}
				});
			},
			
			// 格式化时间
			formatTime(timestamp) {
				const now = new Date().getTime();
				const diff = now - timestamp;
				
				if (diff < 60000) { // 1分钟内
					return '刚刚';
				} else if (diff < 3600000) { // 1小时内
					return Math.floor(diff / 60000) + '分钟前';
				} else if (diff < 86400000) { // 1天内
					return Math.floor(diff / 3600000) + '小时前';
				} else if (diff < 604800000) { // 1周内
					return Math.floor(diff / 86400000) + '天前';
				} else {
					const date = new Date(timestamp);
					return `${date.getMonth() + 1}/${date.getDate()}`;
				}
			},
			
			// 获取消息预览
			getMessagePreview(message) {
				switch (message.type) {
					case 'image':
						return '[图片]';
					case 'product':
						return '[商品分享]';
					default:
						return message.content;
				}
			},
			
			// 加载更多聊天
			loadMoreChats() {
				if (!this.hasMoreChats) return;
				
				setTimeout(() => {
					this.hasMoreChats = false;
					uni.showToast({ title: '没有更多聊天了', icon: 'none' });
				}, 1000);
			},
			
			// 清空所有聊天
			clearAllChats() {
				uni.showModal({
					title: '确认清空',
					content: '确定要清空所有聊天记录吗？此操作不可恢复。',
					success: (res) => {
						if (res.confirm) {
							this.chatList = [];
							uni.showToast({ title: '已清空', icon: 'success' });
						}
					}
				});
			},
			
			// 消息设置
			goToMessageSettings() {
				uni.showToast({ title: '消息设置功能开发中', icon: 'none' });
			}
		}
	}
</script>

<style>
.message-container {
	background-color: #f5f7fa;
	min-height: 100vh;
}

/* 聊天区域 */
.chat-section {
	padding: 30rpx;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.clear-btn {
	font-size: 26rpx;
	color: #667eea;
}

/* 聊天列表 */
.chat-list {
	background: white;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);
}

.chat-item {
	display: flex;
	align-items: center;
	padding: 25rpx 30rpx;
	border-bottom: 1rpx solid #f5f5f5;
	transition: background-color 0.3s ease;
}

.chat-item:last-child {
	border-bottom: none;
}

.chat-item:active {
	background-color: #f8f9ff;
}

/* 头像容器 */
.avatar-container {
	position: relative;
	margin-right: 20rpx;
}

.user-avatar {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
}

.online-status {
	position: absolute;
	bottom: 5rpx;
	right: 5rpx;
	width: 20rpx;
	height: 20rpx;
	background: #2ed573;
	border: 3rpx solid white;
	border-radius: 50%;
}

/* 聊天信息 */
.chat-info {
	flex: 1;
	min-width: 0;
}

.chat-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 10rpx;
}

.username {
	font-size: 28rpx;
	font-weight: 500;
	color: #333;
}

.chat-time {
	font-size: 22rpx;
	color: #999;
}

.chat-content {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.message-preview {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
}

.message-type {
	font-size: 24rpx;
	color: #999;
}

.message-text {
	font-size: 26rpx;
	color: #666;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.message-text.unread {
	color: #333;
	font-weight: 500;
}

.chat-status {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.unread-count {
	background: #ff4757;
	color: white;
	font-size: 20rpx;
	padding: 4rpx 10rpx;
	border-radius: 20rpx;
	min-width: 32rpx;
	text-align: center;
}

.message-status {
	display: flex;
	align-items: center;
}

.status-icon {
	font-size: 20rpx;
	color: #999;
}

.status-icon.read {
	color: #667eea;
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

/* 加载更多 */
.load-more {
	text-align: center;
	padding: 40rpx 0;
}

.load-text {
	font-size: 24rpx;
	color: #999;
}
</style>
