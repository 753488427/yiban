const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


//社区接口

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../../public/uploads');
        // 确保上传目录存在
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'community-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
    },
    fileFilter: function (req, file, cb) {
        // 只允许图片格式
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'), false);
        }
    }
});

router.post('/', (req, res) => {
    const sql = `
        SELECT c.*, u.username, u.image 
        FROM community c 
        LEFT JOIN user u ON c.userid = u.userid 
        ORDER BY c.time DESC
    `;
    
    db.query(sql, [], (err, result) => {
        if (err) {
            res.send({
                code: 500,
                success: "失败",
                msg: "查询失败",
                err: err.message
            });
        } else if (result) {
            res.send({
                code: 200,
                success: "成功",
                result: result
            })
        }
    })
})

// 发布社区动态接口 - 使用条件中间件
router.post('/publish', (req, res, next) => {
    // 检查是否有文件上传
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
        // 有文件上传，使用multer中间件
        upload.single('images')(req, res, (err) => {
            if (err) {
                return res.send({
                    code: 500,
                    success: "失败",
                    msg: "文件上传失败: " + err.message
                });
            }
            handleFileUpload(req, res);
        });
    } else {
        // 纯文字发布
        handleTextOnlyPublish(req, res);
    }
});

// 处理纯文字发布
function handleTextOnlyPublish(req, res) {
    const { userid, content, classify } = req.body;
    
    console.log('收到纯文字发布请求:', { userid, content, classify });
    
    // 验证必填字段
    if (!userid || !content || !classify) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "用户ID、内容和分类不能为空"
        });
    }

    // 插入数据库
    const sql = `
        INSERT INTO community (userid, content, classify, time) 
        VALUES (?, ?, ?, NOW())
    `;
    
    const values = [userid, content, classify];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('数据库插入失败:', err);
            res.send({
                code: 500,
                success: "失败",
                msg: "发布失败",
                err: err.message
            });
        } else {
            console.log('纯文字发布成功:', result.insertId);
            res.send({
                code: 200,
                success: "成功",
                msg: "发布成功",
                result: {
                    community_id: result.insertId
                }
            });
        }
    });
}

// 处理文件上传的函数
function handleFileUpload(req, res) {
    try {
        const { userid, content, classify } = req.body;
        
        // 验证必填字段
        if (!userid || !content || !classify) {
            return res.send({
                code: 400,
                success: "失败",
                msg: "用户ID、内容和分类不能为空"
            });
        }

        // 处理上传的图片 - 只保留第一张图片
        let imagePath = null;
        if (req.file) {
            // 只使用一张图片
            imagePath = `uploads/${req.file.filename}`;
        }

        // 插入数据库 - 只使用community_image字段
        const sql = `
            INSERT INTO community (userid, content, classify, time, community_image) 
            VALUES (?, ?, ?, NOW(), ?)
        `;
        
        const values = [
            userid,
            content,
            classify,
            imagePath
        ];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('数据库插入失败:', err);
                res.send({
                    code: 500,
                    success: "失败",
                    msg: "发布失败",
                    err: err.message
                });
            } else {
                res.send({
                    code: 200,
                    success: "成功",
                    msg: "发布成功",
                    result: {
                        community_id: result.insertId,
                        community_image: imagePath
                    }
                });
            }
        });

    } catch (error) {
        console.error('发布动态错误:', error);
        res.send({
            code: 500,
            success: "失败",
            msg: "服务器错误",
            err: error.message
        });
    }
}

// 发布带文件的社区动态接口
router.post('/publish-with-files', upload.single('images'), (req, res) => {
    handleFileUpload(req, res);
});

// 根据分类获取动态
router.post('/category', (req, res) => {
    const { classify } = req.body;
    
    if (!classify) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "分类参数不能为空"
        });
    }

    const sql = `
        SELECT c.*, u.username, u.image 
        FROM community c 
        LEFT JOIN user u ON c.userid = u.userid 
        WHERE c.classify = ?
        ORDER BY c.time DESC
    `;
    
    db.query(sql, [classify], (err, result) => {
        if (err) {
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
                result: result
            });
        }
    });
});

module.exports = router;