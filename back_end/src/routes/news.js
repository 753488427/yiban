const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../public/uploads/');
console.log('上传目录路径:', uploadDir);



// 配置multer存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名：时间戳 + 随机数 + 原扩展名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'msg_' + uniqueSuffix + ext);
    }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('只允许上传图片文件'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制5MB
    }
});

// 获取用户的会话列表（消息列表）
router.get('/conversations/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    
    if (!userId) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "用户ID不能为空"
        });
    }

    const sql = `
        SELECT 
            c.conversation_id,
            c.last_message_time,
            CASE 
                WHEN c.user1_id = ? THEN c.user2_unread_count 
                ELSE c.user1_unread_count 
            END as unread_count,
            CASE 
                WHEN c.user1_id = ? THEN u2.username 
                ELSE u1.username 
            END as other_user_name,
            CASE 
                WHEN c.user1_id = ? THEN u2.image 
                ELSE u1.image 
            END as other_user_avatar,
            CASE 
                WHEN c.user1_id = ? THEN c.user2_id 
                ELSE c.user1_id 
            END as other_user_id,
            m.content as last_message_content,
            m.message_type as last_message_type,
            m.sender_id as last_message_sender_id,
            m.created_at as last_message_time_detail
        FROM conversations c
        LEFT JOIN user u1 ON c.user1_id = u1.userid
        LEFT JOIN user u2 ON c.user2_id = u2.userid
        LEFT JOIN messages m ON c.last_message_id = m.message_id
        WHERE c.user1_id = ? OR c.user2_id = ?
        ORDER BY c.last_message_time DESC
    `;

    db.query(sql, [userId, userId, userId, userId, userId, userId], (err, result) => {
        if (err) {
            console.error('查询会话列表失败:', err);
            res.send({
                code: 500,
                success: "失败",
                msg: "查询失败",
                err: err.message
            });
        } else {
            res.send({
                code: 200,
                success: "成功",
                result: result,
                total: result.length
            });
        }
    });
});

// 获取指定会话的消息记录
router.get('/messages/:conversationId', (req, res) => {
    const conversationId = parseInt(req.params.conversationId);
    const { page = 1, limit = 20, userId } = req.query;
    
    if (!conversationId) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "会话ID不能为空"
        });
    }

    const offset = (page - 1) * limit;
    
    const sql = `
        SELECT 
            m.message_id,
            m.sender_id,
            m.receiver_id,
            m.message_type,
            m.content,
            m.image_url,
            m.file_url,
            m.product_info,
            m.is_read,
            m.created_at,
            u.username as sender_name,
            u.image as sender_avatar
        FROM messages m
        LEFT JOIN user u ON m.sender_id = u.userid
        WHERE m.conversation_id = ?
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
    `;

    db.query(sql, [conversationId, parseInt(limit), offset], (err, result) => {
        if (err) {
            console.error('查询消息记录失败:', err);
            res.send({
                code: 500,
                success: "失败",
                msg: "查询失败",
                err: err.message
            });
        } else {
            res.send({
                code: 200,
                success: "成功",
                result: result.reverse(), // 反转数组，让最新消息在底部
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.length
            });
        }
    });
});

// 发送消息
router.post('/messages', (req, res) => {
    const { senderId, receiverId, messageType = 'text', content, imageUrl, fileUrl, productInfo } = req.body;
    
    if (!senderId || !receiverId || !content) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "发送者ID、接收者ID和消息内容不能为空"
        });
    }

    // 确保user1_id < user2_id
    const smallerId = Math.min(senderId, receiverId);
    const largerId = Math.max(senderId, receiverId);

    // 首先查找或创建会话
    const findConversationSql = `
        SELECT conversation_id FROM conversations 
        WHERE user1_id = ? AND user2_id = ?
    `;

    db.query(findConversationSql, [smallerId, largerId], (err, conversations) => {
        if (err) {
            console.error('查找会话失败:', err);
            return res.send({
                code: 500,
                success: "失败",
                msg: "查找会话失败",
                err: err.message
            });
        }

        let conversationId;

        if (conversations.length > 0) {
            // 会话已存在
            conversationId = conversations[0].conversation_id;
            insertMessage();
        } else {
            // 创建新会话
            const createConversationSql = `
                INSERT INTO conversations (user1_id, user2_id) 
                VALUES (?, ?)
            `;
            
            db.query(createConversationSql, [smallerId, largerId], (err, result) => {
                if (err) {
                    console.error('创建会话失败:', err);
                    return res.send({
                        code: 500,
                        success: "失败",
                        msg: "创建会话失败",
                        err: err.message
                    });
                }
                
                conversationId = result.insertId;
                insertMessage();
            });
        }

        function insertMessage() {
            // 插入消息
            const insertMessageSql = `
                INSERT INTO messages (conversation_id, sender_id, receiver_id, message_type, content, image_url, file_url, product_info)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const productInfoStr = messageType === 'product' ? productInfo : null;
            db.query(insertMessageSql, [conversationId, senderId, receiverId, messageType, content, imageUrl, fileUrl, productInfoStr], (err, result) => {
                if (err) {
                    console.error('插入消息失败:', err);
                    return res.send({
                        code: 500,
                        success: "失败",
                        msg: "发送消息失败",
                        err: err.message
                    });
                }

                const messageId = result.insertId;

                // 更新会话信息
                const updateConversationSql = `
                    UPDATE conversations 
                    SET 
                        last_message_id = ?,
                        last_message_time = NOW(),
                        user1_unread_count = CASE WHEN user1_id = ? THEN user1_unread_count ELSE user1_unread_count + 1 END,
                        user2_unread_count = CASE WHEN user2_id = ? THEN user2_unread_count ELSE user2_unread_count + 1 END
                    WHERE conversation_id = ?
                `;

                db.query(updateConversationSql, [messageId, senderId, senderId, conversationId], (err) => {
                    if (err) {
                        console.error('更新会话失败:', err);
                        return res.send({
                            code: 500,
                            success: "失败",
                            msg: "更新会话失败",
                            err: err.message
                        });
                    }

                    res.send({
                        code: 200,
                        success: "成功",
                        msg: "消息发送成功",
                        result: {
                            message_id: messageId,
                            conversation_id: conversationId
                        }
                    });
                });
            });
        }
    });
});

// 标记消息为已读
router.put('/conversations/:conversationId/read', (req, res) => {
    const conversationId = parseInt(req.params.conversationId);
    const { userId } = req.body;

    if (!conversationId || !userId) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "会话ID和用户ID不能为空"
        });
    }

    // 标记消息为已读
    const markReadSql = `
        UPDATE messages 
        SET is_read = TRUE, read_at = NOW()
        WHERE conversation_id = ? AND receiver_id = ? AND is_read = FALSE
    `;

    db.query(markReadSql, [conversationId, userId], (err) => {
        if (err) {
            console.error('标记消息已读失败:', err);
            return res.send({
                code: 500,
                success: "失败",
                msg: "标记已读失败",
                err: err.message
            });
        }

        // 重置未读计数
        const resetUnreadSql = `
            UPDATE conversations 
            SET 
                user1_unread_count = CASE WHEN user1_id = ? THEN 0 ELSE user1_unread_count END,
                user2_unread_count = CASE WHEN user2_id = ? THEN 0 ELSE user2_unread_count END
            WHERE conversation_id = ?
        `;

        db.query(resetUnreadSql, [userId, userId, conversationId], (err) => {
            if (err) {
                console.error('重置未读计数失败:', err);
                return res.send({
                    code: 500,
                    success: "失败",
                    msg: "重置未读计数失败",
                    err: err.message
                });
            }

            res.send({
                code: 200,
                success: "成功",
                msg: "标记已读成功"
            });
        });
    });
});

// 获取用户未读消息统计
router.get('/unread/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);

    if (!userId) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "用户ID不能为空"
        });
    }

    const sql = `
        SELECT 
            COUNT(*) as total_unread_messages,
            COUNT(DISTINCT conversation_id) as unread_conversations
        FROM messages 
        WHERE receiver_id = ? AND is_read = FALSE
    `;

    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error('查询未读消息统计失败:', err);
            res.send({
                code: 500,
                success: "失败",
                msg: "查询失败",
                err: err.message
            });
        } else {
            res.send({
                code: 200,
                success: "成功",
                result: result[0]
            });
        }
    });
});

// 删除会话
router.delete('/conversations/:conversationId', (req, res) => {
    const conversationId = parseInt(req.params.conversationId);
    const { userId } = req.body;

    if (!conversationId || !userId) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "会话ID和用户ID不能为空"
        });
    }

    // 验证用户是否有权限删除此会话
    const checkPermissionSql = `
        SELECT conversation_id FROM conversations 
        WHERE conversation_id = ? AND (user1_id = ? OR user2_id = ?)
    `;

    db.query(checkPermissionSql, [conversationId, userId, userId], (err, result) => {
        if (err) {
            console.error('验证权限失败:', err);
            return res.send({
                code: 500,
                success: "失败",
                msg: "验证权限失败",
                err: err.message
            });
        }

        if (result.length === 0) {
            return res.send({
                code: 403,
                success: "失败",
                msg: "无权限删除此会话"
            });
        }

        // 删除会话相关的消息
        const deleteMessagesSql = `DELETE FROM messages WHERE conversation_id = ?`;
        
        db.query(deleteMessagesSql, [conversationId], (err) => {
            if (err) {
                console.error('删除消息失败:', err);
                return res.send({
                    code: 500,
                    success: "失败",
                    msg: "删除消息失败",
                    err: err.message
                });
            }

            // 删除会话
            const deleteConversationSql = `DELETE FROM conversations WHERE conversation_id = ?`;
            
            db.query(deleteConversationSql, [conversationId], (err) => {
                if (err) {
                    console.error('删除会话失败:', err);
                    return res.send({
                        code: 500,
                        success: "失败",
                        msg: "删除会话失败",
                        err: err.message
                    });
                }

                res.send({
                    code: 200,
                    success: "成功",
                    msg: "会话删除成功"
                });
            });
        });
    });
});

// 上传图片接口
router.post('/upload-image', (req, res) => {
    // 使用multer中间件处理上传
    upload.single('image')(req, res, function (err) {
        if (err) {
            return res.send({
                code: 500,
                success: "失败",
                msg: err.message || "文件上传失败"
            });
        }

        try {
            if (!req.file) {
                return res.send({
                    code: 400,
                    success: "失败",
                    msg: "没有上传文件"
                });
            }


            // 构建图片URL路径
            const imageUrl = `uploads/${req.file.filename}`;
            
            res.send({
                code: 200,
                success: "成功",
                msg: "图片上传成功",
                result: {
                    image_url: imageUrl,
                    original_name: req.file.originalname,
                    file_size: req.file.size
                }
            });
        } catch (error) {
            console.error('图片上传处理失败:', error);
            res.send({
                code: 500,
                success: "失败",
                msg: "图片上传失败",
                error: error.message
            });
        }
    });
});

module.exports = router;