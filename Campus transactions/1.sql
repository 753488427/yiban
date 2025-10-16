-- 消息系统数据库表设计
-- 基于现有user表的消息系统设计

-- ============================================
-- 可选：删除现有表（如果需要重新创建）
-- ============================================
-- DROP TABLE IF EXISTS messages;
-- DROP TABLE IF EXISTS conversations;

-- ============================================
-- 或者：检查表是否存在，不存在才创建
-- ============================================

-- 1. 创建消息会话表 (conversations) - 如果不存在
CREATE TABLE IF NOT EXISTS conversations (
    conversation_id INT PRIMARY KEY AUTO_INCREMENT,
    user1_id INT NOT NULL,                    -- 用户1ID (较小的用户ID)
    user2_id INT NOT NULL,                    -- 用户2ID (较大的用户ID)
    last_message_id INT,                      -- 最后一条消息ID
    last_message_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 最后消息时间
    user1_unread_count INT DEFAULT 0,        -- 用户1未读消息数
    user2_unread_count INT DEFAULT 0,        -- 用户2未读消息数
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user1_id) REFERENCES user(userid),
    FOREIGN KEY (user2_id) REFERENCES user(userid),
    UNIQUE KEY unique_conversation (user1_id, user2_id),
    CHECK (user1_id < user2_id)              -- 确保user1_id总是小于user2_id
);

-- 2. 创建消息表 (messages) - 如果不存在
CREATE TABLE IF NOT EXISTS messages (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,             -- 会话ID
    sender_id INT NOT NULL,                   -- 发送者ID
    receiver_id INT NOT NULL,                 -- 接收者ID
    message_type ENUM('text', 'image', 'file') DEFAULT 'text',  -- 消息类型
    content TEXT,                             -- 消息内容
    image_url VARCHAR(255),                   -- 图片URL（如果是图片消息）
    file_url VARCHAR(255),                    -- 文件URL（如果是文件消息）
    is_read BOOLEAN DEFAULT FALSE,            -- 是否已读
    read_at TIMESTAMP NULL,                   -- 读取时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id),
    FOREIGN KEY (sender_id) REFERENCES user(userid),
    FOREIGN KEY (receiver_id) REFERENCES user(userid),
    INDEX idx_conversation_time (conversation_id, created_at),
    INDEX idx_receiver_unread (receiver_id, is_read)
);

-- 3. 插入会话测试数据（如果不存在）
-- 会话1: 用户1和用户2的对话
INSERT IGNORE INTO conversations (user1_id, user2_id, last_message_time, user1_unread_count, user2_unread_count) 
VALUES (1, 2, '2024-01-15 10:30:00', 0, 2);

-- 会话2: 用户1和用户3的对话
INSERT IGNORE INTO conversations (user1_id, user2_id, last_message_time, user1_unread_count, user2_unread_count) 
VALUES (1, 3, '2024-01-15 09:15:00', 1, 0);

-- 会话3: 用户2和用户3的对话
INSERT IGNORE INTO conversations (user1_id, user2_id, last_message_time, user1_unread_count, user2_unread_count) 
VALUES (2, 3, '2024-01-14 16:45:00', 0, 0);

-- 会话4: 用户1和用户4的对话
INSERT IGNORE INTO conversations (user1_id, user2_id, last_message_time, user1_unread_count, user2_unread_count) 
VALUES (1, 4, '2024-01-13 14:20:00', 3, 0);

-- 4. 插入消息测试数据（如果不存在）
-- 会话1的消息 (用户1和用户2)
INSERT IGNORE INTO messages (conversation_id, sender_id, receiver_id, message_type, content, is_read, created_at) VALUES
(1, 1, 2, 'text', '你好，请问这个二手教材还在吗？', TRUE, '2024-01-15 10:00:00'),
(1, 2, 1, 'text', '在的，九成新，原价80，现在50出', TRUE, '2024-01-15 10:05:00'),
(1, 1, 2, 'text', '可以看看实物吗？', TRUE, '2024-01-15 10:10:00'),
(1, 2, 1, 'text', '当然可以，我在图书馆三楼', FALSE, '2024-01-15 10:25:00'),
(1, 2, 1, 'text', '什么时候方便过来看看？', FALSE, '2024-01-15 10:30:00');

-- 会话2的消息 (用户1和用户3)
INSERT IGNORE INTO messages (conversation_id, sender_id, receiver_id, message_type, content, is_read, created_at) VALUES
(2, 3, 1, 'text', '你的笔记本电脑配置怎么样？', TRUE, '2024-01-15 09:00:00'),
(2, 1, 3, 'text', 'i5处理器，8G内存，256G固态硬盘', TRUE, '2024-01-15 09:05:00'),
(2, 3, 1, 'text', '价格多少？', TRUE, '2024-01-15 09:10:00'),
(2, 1, 3, 'text', '2800，买了一年多，很少用', FALSE, '2024-01-15 09:15:00');

-- 会话3的消息 (用户2和用户3)
INSERT IGNORE INTO messages (conversation_id, sender_id, receiver_id, message_type, content, is_read, created_at) VALUES
(3, 2, 3, 'text', '你的运动鞋是什么牌子的？', TRUE, '2024-01-14 16:30:00'),
(3, 3, 2, 'text', '耐克的，42码，基本没怎么穿', TRUE, '2024-01-14 16:35:00'),
(3, 2, 3, 'text', '好的，谢谢', TRUE, '2024-01-14 16:45:00');

-- 会话4的消息 (用户1和用户4)
INSERT IGNORE INTO messages (conversation_id, sender_id, receiver_id, message_type, content, is_read, created_at) VALUES
(4, 4, 1, 'text', '你好，看到你发的台灯信息', TRUE, '2024-01-13 14:00:00'),
(4, 1, 4, 'text', '是的，护眼台灯，用了半年', TRUE, '2024-01-13 14:05:00'),
(4, 4, 1, 'text', '多少钱？', TRUE, '2024-01-13 14:10:00'),
(4, 1, 4, 'text', '原价150，现在80', FALSE, '2024-01-13 14:15:00'),
(4, 4, 1, 'text', '可以便宜点吗？', FALSE, '2024-01-13 14:18:00'),
(4, 4, 1, 'text', '70怎么样？', FALSE, '2024-01-13 14:20:00');

-- 5. 更新会话表的最后消息ID
UPDATE conversations SET last_message_id = 5 WHERE conversation_id = 1;
UPDATE conversations SET last_message_id = 8 WHERE conversation_id = 2;
UPDATE conversations SET last_message_id = 11 WHERE conversation_id = 3;
UPDATE conversations SET last_message_id = 16 WHERE conversation_id = 4;

-- 6. 创建索引优化查询性能
CREATE INDEX idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX idx_conversations_last_time ON conversations(last_message_time);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read);

-- ============================================
-- 以下是常用查询语句，可以用来测试数据
-- ============================================

-- 查看所有会话
SELECT 
    c.conversation_id,
    c.user1_id,
    c.user2_id,
    c.last_message_time,
    c.user1_unread_count,
    c.user2_unread_count,
    u1.username as user1_name,
    u2.username as user2_name
FROM conversations c
LEFT JOIN user u1 ON c.user1_id = u1.userid
LEFT JOIN user u2 ON c.user2_id = u2.userid
ORDER BY c.last_message_time DESC;

-- 查看用户1的会话列表（带最后消息）
SELECT 
    c.conversation_id,
    c.last_message_time,
    CASE 
        WHEN c.user1_id = 1 THEN c.user2_unread_count 
        ELSE c.user1_unread_count 
    END as unread_count,
    CASE 
        WHEN c.user1_id = 1 THEN u2.username 
        ELSE u1.username 
    END as other_user_name,
    CASE 
        WHEN c.user1_id = 1 THEN u2.image 
        ELSE u1.image 
    END as other_user_avatar,
    CASE 
        WHEN c.user1_id = 1 THEN c.user2_id 
        ELSE c.user1_id 
    END as other_user_id,
    m.content as last_message_content,
    m.message_type as last_message_type
FROM conversations c
LEFT JOIN user u1 ON c.user1_id = u1.userid
LEFT JOIN user u2 ON c.user2_id = u2.userid
LEFT JOIN messages m ON c.last_message_id = m.message_id
WHERE c.user1_id = 1 OR c.user2_id = 1
ORDER BY c.last_message_time DESC;

-- 查看指定会话的所有消息
SELECT 
    m.message_id,
    m.sender_id,
    m.receiver_id,
    m.message_type,
    m.content,
    m.is_read,
    m.created_at,
    u.username as sender_name,
    u.image as sender_avatar
FROM messages m
LEFT JOIN user u ON m.sender_id = u.userid
WHERE m.conversation_id = 1
ORDER BY m.created_at ASC;

-- 查看用户的未读消息统计
SELECT 
    COUNT(*) as total_unread_messages,
    COUNT(DISTINCT conversation_id) as unread_conversations
FROM messages 
WHERE receiver_id = 1 AND is_read = FALSE;

-- 标记指定会话中接收到的消息为已读
-- UPDATE messages 
-- SET is_read = TRUE, read_at = NOW()
-- WHERE conversation_id = 1 AND receiver_id = 1 AND is_read = FALSE;

-- 重置未读计数
-- UPDATE conversations 
-- SET 
--     user1_unread_count = CASE WHEN user1_id = 1 THEN 0 ELSE user1_unread_count END,
--     user2_unread_count = CASE WHEN user2_id = 1 THEN 0 ELSE user2_unread_count END
-- WHERE conversation_id = 1;

-- ============================================
-- 创建或获取会话的正确方法
-- ============================================

-- 方法1: 查找现有会话 (需要考虑用户ID的顺序)
-- SELECT conversation_id 
-- FROM conversations 
-- WHERE (user1_id = LEAST(?, ?) AND user2_id = GREATEST(?, ?));

-- 方法2: 如果不存在，创建新会话 (确保user1_id < user2_id)
-- INSERT INTO conversations (user1_id, user2_id)
-- VALUES (LEAST(?, ?), GREATEST(?, ?));

-- 注意：在应用程序中插入会话时，需要确保user1_id总是小于user2_id
-- 例如在Node.js中：
-- const smallerId = Math.min(userId1, userId2);
-- const largerId = Math.max(userId1, userId2);
-- INSERT INTO conversations (user1_id, user2_id) VALUES (smallerId, largerId);