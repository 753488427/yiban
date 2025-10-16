const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../public/uploads/');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名：时间戳 + 随机数 + 原扩展名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'respond_' + uniqueSuffix + ext);
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


//获取社区回复评论接口
router.post('/', (req, res) => {
    const { community_id } = req.body;
    
    let sql = `
        SELECT 
            r.*,
            u.username,
            u.image as user_image
        FROM respond r
        LEFT JOIN user u ON r.userid = u.userid
    `;
    
    const params = [];
    
    // 如果传入了community_id，只查询该动态的回复
    if (community_id) {
        sql += ` WHERE r.community_id = ?`;
        params.push(community_id);
    }
    
    sql += ` ORDER BY r.time DESC`;
    
    db.query(sql, params, (err, result) => {
        if (err) {
            res.send({
                success: "失败",
                msg: "查询失败",
                err: err.message
            });
        } else {
            res.send({
                success: "成功",
                msg: "查询成功",
                result: result || []
            })
        }
    })
})

// 添加回复评论接口
router.post('/add', upload.single('image'), (req, res) => {
    const { userid, community_id, respond_content } = req.body;
    
    // 验证必填字段
    if (!userid || !community_id || !respond_content) {
        return res.send({
            success: "失败",
            msg: "用户ID、动态ID和回复内容不能为空",
            code: 400
        });
    }
    
    // 处理图片路径
    let respond_image = null;
    if (req.file) {
        respond_image = `uploads/${req.file.filename}`;
    }
    
    const sql = `
        INSERT INTO respond (userid, community_id, respond_content, respond_image, time)
        VALUES (?, ?, ?, ?, NOW())
    `;
    
    db.query(sql, [userid, community_id, respond_content, respond_image], (err, result) => {
        if (err) {
            console.error('添加回复失败:', err);
            res.send({
                success: "失败",
                msg: "添加回复失败",
                err: err.message,
                code: 500
            });
        } else {
            res.send({
                success: "成功",
                msg: "回复添加成功",
                result: {
                    respond_id: result.insertId,
                    userid: userid,
                    community_id: community_id,
                    respond_content: respond_content,
                    respond_image: respond_image,
                    time: new Date()
                },
                code: 200
            });
        }
    });
});

module.exports = router;