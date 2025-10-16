import request from '@/utils/request.js';

/**
 * Banner和导航相关的工具类
 */
class BannerService {
	
	/**
	 * 获取导航菜单数据
	 */
	static getNavList() {
		return [
			{ icon: '📚', name: '教材书籍', category: '教材书籍' },
			{ icon: '💻', name: '数码产品', category: '数码产品' },
			{ icon: '👕', name: '服装配饰', category: '服装配饰' },
			{ icon: '🏠', name: '生活用品', category: '生活用品' },
			{ icon: '🎮', name: '娱乐休闲', category: '娱乐休闲' },
			{ icon: '🚚', name: '跑腿配送', category: '跑腿配送' }
		];
	}
	
	/**
	 * 获取完整的导航列表（包含"全部"选项）
	 */
	static getAllNavList() {
		const allOption = { icon: '🏠', name: '全部', category: 'all' };
		return [allOption, ...this.getNavList()];
	}
	
	/**
	 * 获取轮播图数据
	 */
	static async getBannerList() {
		try {
			const response = await request.post('/banner/');
			if (response.code === 200 && response.result) {
				return response.result.map(item => ({
					id: item.id,
					image: item.banner_image
				}));
			}
			return [];
		} catch (error) {
			console.error('获取轮播图数据失败:', error);
			throw error;
		}
	}
	
	/**
	 * 根据分类获取区域标题
	 */
	static getSectionTitle(selectedCategory) {
		if (selectedCategory === 'all') {
			return '热门推荐';
		}
		const navList = this.getNavList();
		const currentNav = navList.find(item => item.category === selectedCategory);
		return currentNav ? currentNav.name : '热门推荐';
	}
	
	/**
	 * 查找导航项
	 */
	static findNavItem(category) {
		const allNavList = this.getAllNavList();
		return allNavList.find(item => item.category === category);
	}
}

export default BannerService;
