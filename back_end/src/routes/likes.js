const express = require('express');
const db = require('../config/db');
const router = express.Router();

// 添加点赞
router.post('/add', (req, res) => {
    const { userid, goods_id } = req.body;
    
    if (!userid || !goods_id) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "用户ID和商品ID不能为空"
        });
    }
    
    // 先检查是否已经点赞
    const checkSql = 'SELECT * FROM likes WHERE userid = ? AND goods_id = ?';
    db.query(checkSql, [userid, goods_id], (err, result) => {
        if (err) {
            return res.send({
                code: 500,
                success: "失败",
                msg: "检查点赞状态失败",
                err: err.message
            });
        }
        
        if (result.length > 0) {
            return res.send({
                code: 400,
                success: "失败",
                msg: "已经点赞过该商品"
            });
        }
        
        // 添加点赞记录
        const insertSql = 'INSERT INTO likes (userid, goods_id) VALUES (?, ?)';
        db.query(insertSql, [userid, goods_id], (err, result) => {
            if (err) {
                res.send({
                    code: 500,
                    success: "失败",
                    msg: "添加点赞失败",
                    err: err.message
                });
            } else {
                // 点赞成功后，重新计算并更新goods表的likes字段
                const updateGoodsSql = `
                    UPDATE goods 
                    SET likes = (
                        SELECT COUNT(*) 
                        FROM likes 
                        WHERE goods_id = ?
                    ) 
                    WHERE goods_id = ?
                `;
                db.query(updateGoodsSql, [goods_id, goods_id], (updateErr, updateResult) => {
                    if (updateErr) {
                        console.error('更新商品点赞数失败:', updateErr);
                        // 即使更新失败也返回成功，因为点赞记录已经添加
                    }
                    
                    res.send({
                        code: 200,
                        success: "成功",
                        msg: "点赞成功",
                        result: { success: true }
                    });
                });
            }
        });
    });
});

// 取消点赞
router.post('/remove', (req, res) => {
    const { userid, goods_id } = req.body;
    
    if (!userid || !goods_id) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "用户ID和商品ID不能为空"
        });
    }
    
    const sql = 'DELETE FROM likes WHERE userid = ? AND goods_id = ?';
    db.query(sql, [userid, goods_id], (err, result) => {
        if (err) {
            res.send({
                code: 500,
                success: "失败",
                msg: "取消点赞失败",
                err: err.message
            });
        } else if (result.affectedRows === 0) {
            res.send({
                code: 400,
                success: "失败",
                msg: "该商品未点赞"
            });
        } else {
            // 取消点赞成功后，重新计算并更新goods表的likes字段
            const updateGoodsSql = `
                UPDATE goods 
                SET likes = (
                    SELECT COUNT(*) 
                    FROM likes 
                    WHERE goods_id = ?
                ) 
                WHERE goods_id = ?
            `;
            db.query(updateGoodsSql, [goods_id, goods_id], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error('更新商品点赞数失败:', updateErr);
                    // 即使更新失败也返回成功，因为点赞记录已经删除
                }
                
                res.send({
                    code: 200,
                    success: "成功",
                    msg: "取消点赞成功"
                });
            });
        }
    });
});

// 检查点赞状态
router.post('/check', (req, res) => {
    const { userid, goods_id } = req.body;
    
    if (!userid || !goods_id) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "用户ID和商品ID不能为空"
        });
    }
    
    const sql = 'SELECT * FROM likes WHERE userid = ? AND goods_id = ?';
    db.query(sql, [userid, goods_id], (err, result) => {
        if (err) {
            res.send({
                code: 500,
                success: "失败",
                msg: "检查点赞状态失败",
                err: err.message
            });
        } else {
            res.send({
                code: 200,
                success: "成功",
                msg: "获取点赞状态成功",
                result: {
                    isLiked: result.length > 0
                }
            });
        }
    });
});

// 获取商品的所有点赞记录
router.post('/list', (req, res) => {
    const { goods_id } = req.body;
    
    if (!goods_id) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "商品ID不能为空"
        });
    }
    
    const sql = 'SELECT * FROM likes WHERE goods_id = ? ORDER BY likes_id DESC';
    db.query(sql, [goods_id], (err, result) => {
        if (err) {
            res.send({
                code: 500,
                success: "失败",
                msg: "获取点赞列表失败",
                err: err.message
            });
        } else {
            res.send({
                code: 200,
                success: "成功",
                msg: "获取点赞列表成功",
                result: result,
                count: result.length
            });
        }
    });
});

// 获取用户的所有点赞记录
router.post('/user_likes', (req, res) => {
    const { userid } = req.body;
    
    if (!userid) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "用户ID不能为空"
        });
    }
    
    const sql = `
        SELECT l.*, g.title, g.price, g.image, g.status 
        FROM likes l 
        LEFT JOIN goods g ON l.goods_id = g.goods_id 
        WHERE l.userid = ? 
        ORDER BY l.likes_id DESC
    `;
    db.query(sql, [userid], (err, result) => {
        if (err) {
            res.send({
                code: 500,
                success: "失败",
                msg: "获取用户点赞列表失败",
                err: err.message
            });
        } else {
            res.send({
                code: 200,
                success: "成功",
                msg: "获取用户点赞列表成功",
                result: result,
                count: result.length
            });
        }
    });
});

// 获取商品点赞数量
router.post('/count', (req, res) => {
    const { goods_id } = req.body;
    
    if (!goods_id) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "商品ID不能为空"
        });
    }
    
    const sql = 'SELECT COUNT(*) as like_count FROM likes WHERE goods_id = ?';
    db.query(sql, [goods_id], (err, result) => {
        if (err) {
            res.send({
                code: 500,
                success: "失败",
                msg: "获取点赞数量失败",
                err: err.message
            });
        } else {
            res.send({
                code: 200,
                success: "成功",
                msg: "获取点赞数量成功",
                result: {
                    goods_id: goods_id,
                    like_count: result[0].like_count
                }
            });
        }
    });
});

module.exports = router;