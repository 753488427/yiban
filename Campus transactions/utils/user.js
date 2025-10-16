// 用户信息管理工具类
const USER_INFO_KEY = 'userInfo';

const userUtil = {
  // 保存用户信息到本地存储
  saveUserInfo(userInfo) {
    try {
      uni.setStorageSync(USER_INFO_KEY, userInfo);
    } catch (error) {
      console.error('保存用户信息失败:', error);
    }
  },

  // 获取用户信息
  getUserInfo() {
    try {
      return uni.getStorageSync(USER_INFO_KEY) || null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  },

  // 清除用户信息（退出登录时使用）
  clearUserInfo() {
    try {
      uni.removeStorageSync(USER_INFO_KEY);
    } catch (error) {
      console.error('清除用户信息失败:', error);
    }
  },

  // 检查用户是否已登录
  isLoggedIn() {
    const userInfo = this.getUserInfo();
    return !!(userInfo && userInfo.userid);
  },

  // 获取用户基本信息的便捷方法
  getUserId() {
    return this.getUserInfo()?.userid || null;
  },

  getUsername() {
    return this.getUserInfo()?.username || '';
  },

  getUserAvatar() {
    return this.getUserInfo()?.image || '';
  },

  // 更新用户信息（部分更新）
  updateUserInfo(newInfo) {
    const currentInfo = this.getUserInfo();
    if (currentInfo) {
      const updatedInfo = { ...currentInfo, ...newInfo };
      this.saveUserInfo(updatedInfo);
      return updatedInfo;
    }
    return null;
  }
};

export default userUtil;
