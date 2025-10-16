const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// 配置multer存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../public/uploads/'));
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名：comment_时间戳-随机数.扩展名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'comment_' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
    },
    fileFilter: function (req, file, cb) {
        // 只允许图片文件
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// 获取所有评论

router.post('/', (req, res) => { 
    const { userid, goods_id } = req.body;
    
    let sql = `
        SELECT 
            c.comment_id,
            c.userid,
            c.goods_id,
            c.content,
            c.image,
            c.time,
            u.username,
            u.image as user_image
        FROM comments c
        LEFT JOIN user u ON c.userid = u.userid
        WHERE 1=1
    `;
    
    const params = [];
    
    // 如果传入了userid，则只查询该用户的评论
    if (userid) {
        sql += ` AND c.userid = ?`;
        params.push(userid);
    }
    
    // 如果传入了goods_id，则只查询该商品的评论
    if (goods_id) {
        sql += ` AND c.goods_id = ?`;
        params.push(goods_id);
    }
    
    sql += ` ORDER BY c.time DESC`;
    
    db.query(sql, params, (err, result) => { 
        if(err){
            res.send({
                success: "失败",
                msg: "false",
                err: err.message
            });
        }else if(result){
            res.send({
                success: "成功",
                result: result
            })
        }
    })
});

// 增加评价接口
router.post('/add', upload.single('image'), (req, res) => {
    const { userid, goods_id, content } = req.body;
    
    // 验证必填字段
    if (!userid || !goods_id || !content) {
        return res.status(400).send({
            code: 400,
            success: "失败",
            msg: "用户ID、商品ID和评价内容不能为空"
        });
    }
    
    // 获取上传的图片路径（如果有）
    const imagePath = req.file ? `uploads/${req.file.filename}` : null;
    
    // 插入评价数据
    const sql = `
        INSERT INTO comments (userid, goods_id, content, image, time) 
        VALUES (?, ?, ?, ?, NOW())
    `;
    
    const params = [userid, goods_id, content, imagePath];
    
    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('添加评价失败:', err);
            res.status(500).send({
                code: 500,
                success: "失败",
                msg: "添加评价失败",
                error: err.message
            });
        } else {
            // 查询刚插入的评价详情（包含用户信息）
            const selectSql = `
                SELECT 
                    c.comment_id,
                    c.userid,
                    c.goods_id,
                    c.content,
                    c.image,
                    c.time,
                    u.username,
                    u.image as user_image
                FROM comments c
                LEFT JOIN user u ON c.userid = u.userid
                WHERE c.comment_id = ?
            `;
            
            db.query(selectSql, [result.insertId], (selectErr, selectResult) => {
                if (selectErr) {
                    console.error('查询评价详情失败:', selectErr);
                    res.status(500).send({
                        code: 500,
                        success: "失败",
                        msg: "评价添加成功，但获取详情失败"
                    });
                } else {
                    res.send({
                        code: 200,
                        success: "成功",
                        msg: "评价添加成功",
                        result: selectResult[0]
                    });
                }
            });
        }
    });
});

module.exports = router;