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

// 配置multer用于商品图片上传
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
        fileSize: 5 * 1024 * 1024, // 限制文件大小为5MB
        files: 9 // 最多9张图片
    }
});

// 获取所有商品列表
router.post('/', (req, res) => {
    const sql = 'select * from goods';
    db.query(sql, [], (err, result) => {
        if (err) {
            res.send({
                success: "失败",
                msg: "false",
                err: err.message
            });
        } else {
            res.send({
                success: "成功",
                msg: "true",
                result: result
            });
        }
    });
});


// 根据用户ID查询发布的商品
router.post('/user_goods', (req, res) => {
    const { userid } = req.body;
    
    if (!userid) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "用户ID不能为空"
        });
    }
    
    const sql = 'SELECT * FROM goods WHERE userid = ? ORDER BY goods_id DESC';
    db.query(sql, [userid], (err, result) => {
        if (err) {
            res.send({
                code: 500,
                success: "失败",
                msg: "查询用户商品失败",
                err: err.message
            });
        } else {
            res.send({
                code: 200,
                success: "成功",
                msg: "查询用户商品成功",
                result: result
            });
        }
    });
});

// 商品上传接口
router.post('/upload', upload.array('images', 9), (req, res) => {
    const { title, price, content, classify, address, userid } = req.body;
    
    // 处理上传的图片
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
        imageUrls = req.files.map(file => `uploads/${file.filename}`);
    }
    
    // 生成随机标签
    const generateRandomLabel = () => {
        const labels = [
            '卖家信用良好', '回复超快', '百分百好评', '特价', '卖家很懒', '优质', '好评'
        ];
        return labels[Math.floor(Math.random() * labels.length)];
    };
    
    // 构建插入数据
    const insertData = {
        userid,
        address,
        classify,
        title,
        content: content || '', // 商品内容描述
        price: parseFloat(price) || 0,
        image: imageUrls[0] || null, // 主图
        imageone: imageUrls[1] || null, // 第二张图片
        label: generateRandomLabel(), // 随机生成标签
        likes: 0, // 初始点赞数
        views: 0, // 初始浏览数
        status: '在售', // 默认在售状态
        time: new Date() // 当前时间
    };
    
    // 构建SQL语句
    const fields = Object.keys(insertData);
    const values = Object.values(insertData);
    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT INTO goods (${fields.join(', ')}) VALUES (${placeholders})`;
    
    // 执行插入
    db.query(sql, values, (err, result) => {
        if (err) {
            res.send({
                success: "失败",
                msg: "上传失败",
                err: err.message
            });
        } else {
            res.send({
                success: "成功",
                msg: "上传成功",
                result: result
            });
        }
    });
});

// 数据同步接口 - 修复goods表中的likes和views统计
router.post('/sync_counts', (req, res) => {
    // 同步点赞数
    const syncLikesSql = `
        UPDATE goods g 
        SET likes = (
            SELECT COUNT(*) 
            FROM likes l 
            WHERE l.goods_id = g.goods_id
        )
    `;
    
    // 同步收藏数
    const syncViewsSql = `
        UPDATE goods g 
        SET views = (
            SELECT COUNT(*) 
            FROM favorites f 
            WHERE f.goods_id = g.goods_id
        )
    `;
    
    // 执行同步
    db.query(syncLikesSql, [], (err1, result1) => {
        if (err1) {
            return res.send({
                code: 500,
                success: "失败",
                msg: "同步点赞数失败",
                err: err1.message
            });
        }
        
        db.query(syncViewsSql, [], (err2, result2) => {
            if (err2) {
                return res.send({
                    code: 500,
                    success: "失败",
                    msg: "同步收藏数失败",
                    err: err2.message
                });
            }
            
            res.send({
                code: 200,
                success: "成功",
                msg: "数据同步完成",
                result: {
                    likes_updated: result1.affectedRows,
                    views_updated: result2.affectedRows
                }
            });
        });
    });
});


// 修改商品状态接口
router.post('/update_status', (req, res) => {
    const { goods_id, status } = req.body;
    
    // 验证参数
    if (!goods_id || !status) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "商品ID和状态不能为空"
        });
    }
    
    // 验证状态值
    const validStatuses = ['在售', '下架', '已售', '已售出'];
    if (!validStatuses.includes(status)) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "无效的状态值"
        });
    }
    
    // 更新商品状态
    const sql = 'UPDATE goods SET status = ? WHERE goods_id = ?';
    db.query(sql, [status, goods_id], (err, result) => {
        if (err) {
            return res.send({
                code: 500,
                success: "失败",
                msg: "更新商品状态失败",
                err: err.message
            });
        }
        
        if (result.affectedRows === 0) {
            return res.send({
                code: 404,
                success: "失败",
                msg: "商品不存在"
            });
        }
        
        res.send({
            code: 200,
            success: "成功",
            msg: "商品状态更新成功",
            result: {
                goods_id: goods_id,
                status: status,
                affected_rows: result.affectedRows
            }
        });
    });
});

// 修改商品信息接口
router.post('/update', upload.array('images', 9), (req, res) => {
    const { goods_id, title, price, content, classify, address } = req.body;
    
    // 验证必需参数
    if (!goods_id) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "商品ID不能为空"
        });
    }
    
    // 处理上传的图片
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
        imageUrls = req.files.map(file => `uploads/${file.filename}`);
    }
    
    // 构建更新数据对象
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (price !== undefined) updateData.price = parseFloat(price) || 0;
    if (content !== undefined) updateData.content = content;
    if (classify !== undefined) updateData.classify = classify;
    if (address !== undefined) updateData.address = address;
    
    // 如果有新图片，更新图片字段
    if (imageUrls.length > 0) {
        updateData.image = imageUrls[0]; // 主图
        if (imageUrls[1]) {
            updateData.imageone = imageUrls[1]; // 第二张图片
        }
    }
    
    // 如果没有要更新的数据
    if (Object.keys(updateData).length === 0) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "没有要更新的数据"
        });
    }
    
    // 构建SQL语句
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const sql = `UPDATE goods SET ${setClause} WHERE goods_id = ?`;
    
    // 执行更新
    db.query(sql, [...values, goods_id], (err, result) => {
        if (err) {
            return res.send({
                code: 500,
                success: "失败",
                msg: "更新商品信息失败",
                err: err.message
            });
        }
        
        if (result.affectedRows === 0) {
            return res.send({
                code: 404,
                success: "失败",
                msg: "商品不存在"
            });
        }
        
        res.send({
            code: 200,
            success: "成功",
            msg: "商品信息更新成功",
            result: {
                goods_id: goods_id,
                updated_fields: updateData,
                affected_rows: result.affectedRows
            }
        });
    });
});

// 根据商品ID获取单个商品详情
router.post('/detail', (req, res) => {
    const { goods_id } = req.body;
    
    if (!goods_id) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "商品ID不能为空"
        });
    }
    
    // 联表查询商品详情和用户信息
    const sql = `
        SELECT 
            g.*,
            u.username,
            u.image as user_image
        FROM goods g
        LEFT JOIN user u ON g.userid = u.userid
        WHERE g.goods_id = ?
    `;
    
    db.query(sql, [goods_id], (err, result) => {
        if (err) {
            return res.send({
                code: 500,
                success: "失败",
                msg: "获取商品详情失败",
                err: err.message
            });
        }
        
        if (result.length === 0) {
            return res.send({
                code: 404,
                success: "失败",
                msg: "商品不存在"
            });
        }
        
        res.send({
            code: 200,
            success: "成功",
            msg: "获取商品详情成功",
            result: result[0]
        });
    });
});

// 根据用户ID获取卖家信息和商品列表
router.post('/seller_info', (req, res) => {
    const { userid } = req.body;
    
    if (!userid) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "用户ID不能为空"
        });
    }
    
    // 首先获取用户基本信息
    const userSql = 'SELECT userid, username, image, phone FROM user WHERE userid = ?';
    
    db.query(userSql, [userid], (userErr, userResult) => {
        if (userErr) {
            return res.send({
                code: 500,
                success: "失败",
                msg: "获取用户信息失败",
                err: userErr.message
            });
        }
        
        if (userResult.length === 0) {
            return res.send({
                code: 404,
                success: "失败",
                msg: "用户不存在"
            });
        }
        
        const userInfo = userResult[0];
        
        // 获取该用户发布的商品列表
        const goodsSql = `
            SELECT 
                goods_id, title, price, content, image, imageone, 
                status, likes, views, time, label, classify, address
            FROM goods 
            WHERE userid = ? 
            ORDER BY time DESC
        `;
        
        db.query(goodsSql, [userid], (goodsErr, goodsResult) => {
            if (goodsErr) {
                return res.send({
                    code: 500,
                    success: "失败",
                    msg: "获取商品列表失败",
                    err: goodsErr.message
                });
            }
            
            // 统计信息
            const totalGoods = goodsResult.length;
            const onSaleGoods = goodsResult.filter(item => item.status === '在售').length;
            const soldGoods = goodsResult.filter(item => item.status === '已售' || item.status === '已售出').length;
            const totalLikes = goodsResult.reduce((sum, item) => sum + (parseInt(item.likes) || 0), 0);
            const totalViews = goodsResult.reduce((sum, item) => sum + (parseInt(item.views) || 0), 0);
            
            res.send({
                code: 200,
                success: "成功",
                msg: "获取卖家信息成功",
                result: {
                    userInfo: {
                        userid: userInfo.userid,
                        username: userInfo.username,
                        avatar: userInfo.image,
                        phone: userInfo.phone
                    },
                    statistics: {
                        totalGoods: totalGoods,
                        onSaleGoods: onSaleGoods,
                        soldGoods: soldGoods,
                        totalLikes: totalLikes,
                        totalViews: totalViews
                    },
                    goodsList: goodsResult
                }
            });
        });
    });
});

module.exports = router;
