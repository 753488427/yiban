-- 更新消息表以支持商品卡片消息
-- 1. 修改message_type枚举，添加'product'类型
ALTER TABLE messages MODIFY COLUMN message_type ENUM('text', 'image', 'file', 'product') DEFAULT 'text';

-- 2. 添加product_info字段用于存储商品信息
ALTER TABLE messages ADD COLUMN product_info TEXT COMMENT '商品信息JSON字符串（当message_type为product时使用）';

-- 3. 插入一些测试商品消息数据
INSERT INTO messages (conversation_id, sender_id, receiver_id, message_type, content, product_info, is_read, created_at) VALUES
(1, 1, 2, 'product', '[商品] 二手数学教材', '{"id": 1, "title": "高等数学教材", "price": "50", "image": "uploads/math_book.jpg", "status": "在售"}', FALSE, '2024-01-15 11:00:00'),
(2, 3, 1, 'product', '[商品] 笔记本电脑', '{"id": 2, "title": "联想ThinkPad笔记本", "price": "2800", "image": "uploads/laptop.jpg", "status": "在售"}', FALSE, '2024-01-15 10:00:00');
