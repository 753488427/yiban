const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保uploads目录存在
const uploadDir = path.join(__dirname, '../../public/uploads/');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer用于回复图片上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名：字段名-时间戳-随机数.扩展名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // 只允许图片文件
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
    }
});

//查询回复的评论
router.post('/',(req,res)=>{
    let sql, params;
    
    // 如果提供了userid，则只查询该用户的回复
    if (req.body.userid) {
        sql = `
            SELECT r.*, u.username, u.image as user_image 
            FROM reply r 
            LEFT JOIN user u ON r.userid = u.userid 
            WHERE r.comment_id = ? AND r.userid = ?
            ORDER BY r.reply_time DESC
        `;
        params = [req.body.comment_id, req.body.userid];
    } else {
        // 如果没有提供userid，则查询该评论下的所有回复
        sql = `
            SELECT r.*, u.username, u.image as user_image 
            FROM reply r 
            LEFT JOIN user u ON r.userid = u.userid 
            WHERE r.comment_id = ?
            ORDER BY r.reply_time DESC
        `;
        params = [req.body.comment_id];
    }
    
    db.query(sql, params, (err, result) => {
        if(err){
            res.send({
                success:"失败",
                msg:"查询失败",
                code:500,
                err: err.message
            })
        }else{
            res.send({
                success:"成功",
                msg:"查询成功",
                result:result,
                code:200
            })
        }
    })
})

// 添加回复评论
router.post('/add', (req, res) => {
    const { userid, comment_id, reply_content, reply_image } = req.body;
    
    // 验证必填字段
    if (!userid || !comment_id || !reply_content) {
        return res.send({
            success: "失败",
            msg: "用户ID、评论ID和回复内容不能为空",
            code: 400
        });
    }
    
    const sql = `
        INSERT INTO reply (userid, comment_id, reply_content, reply_image, reply_time) 
        VALUES (?, ?, ?, ?, NOW())
    `;
    
    const params = [userid, comment_id, reply_content, reply_image || null];
    
    db.query(sql, params, (err, result) => {
        if (err) {
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
                    reply_id: result.insertId,
                    userid: userid,
                    comment_id: comment_id,
                    reply_content: reply_content,
                    reply_image: reply_image,
                    reply_time: new Date().toISOString()
                },
                code: 200
            });
        }
    });
});

// 回复图片上传接口
router.post('/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.send({
                success: "失败",
                msg: "没有上传文件",
                code: 400
            });
        }

        const imagePath = `uploads/${req.file.filename}`;
        
        res.send({
            success: "成功",
            msg: "图片上传成功",
            imagePath: imagePath,
            code: 200
        });
    } catch (error) {
        res.send({
            success: "失败",
            msg: "图片上传失败",
            err: error.message,
            code: 500
        });
    }
});

module.exports = router;