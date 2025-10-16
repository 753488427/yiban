const express = require('express');
const db = require('../config/db');
const router = express.Router();

// 获取用户收藏列表
router.post('/list', (req, res) => {
    const { userid } = req.body;
    
    if (!userid) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "用户ID不能为空"
        });
    }
    
    const sql = `
        SELECT 
            f.userid,
            f.goods_id,
            g.image as goodsImage,
            g.title as goodsTitle,
            g.price as goodsPrice,
            g.status as goodsStatus,
            u.image as userImage,
            u.username as userName
        FROM favorites f
        LEFT JOIN goods g ON f.goods_id = g.goods_id
        LEFT JOIN user u ON g.userid = u.userid
        WHERE f.userid = ?
        ORDER BY f.goods_id DESC
    `;
    
    db.query(sql, [userid], (err, result) => {
        if (err) {
            res.send({
                code: 500,
                success: "失败",
                msg: "获取收藏列表失败",
                err: err.message
            });
        } else {
            res.send({
                code: 200,
                success: "成功",
                msg: "获取收藏列表成功",
                result: result
            });
        }
    });
});

// 添加收藏
router.post('/add', (req, res) => {
    const { userid, goods_id } = req.body;
    
    if (!userid || !goods_id) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "用户ID和商品ID不能为空"
        });
    }
    
    // 先检查是否已经收藏
    const checkSql = 'SELECT * FROM favorites WHERE userid = ? AND goods_id = ?';
    db.query(checkSql, [userid, goods_id], (err, result) => {
        if (err) {
            return res.send({
                code: 500,
                success: "失败",
                msg: "检查收藏状态失败",
                err: err.message
            });
        }
        
        if (result.length > 0) {
            return res.send({
                code: 400,
                success: "失败",
                msg: "已经收藏过该商品"
            });
        }
        
        // 添加收藏
        const insertSql = 'INSERT INTO favorites (userid, goods_id) VALUES (?, ?)';
        db.query(insertSql, [userid, goods_id], (err, result) => {
            if (err) {
                res.send({
                    code: 500,
                    success: "失败",
                    msg: "添加收藏失败",
                    err: err.message
                });
            } else {
                // 收藏成功后，重新计算并更新goods表的views字段
                const updateGoodsSql = `
                    UPDATE goods 
                    SET views = (
                        SELECT COUNT(*) 
                        FROM favorites 
                        WHERE goods_id = ?
                    ) 
                    WHERE goods_id = ?
                `;
                db.query(updateGoodsSql, [goods_id, goods_id], (updateErr, updateResult) => {
                    if (updateErr) {
                        console.error('更新商品收藏数失败:', updateErr);
                        // 即使更新失败也返回成功，因为收藏记录已经添加
                    }
                    
                    res.send({
                        code: 200,
                        success: "成功",
                        msg: "收藏成功",
                        result: { success: true }
                    });
                });
            }
        });
    });
});

// 取消收藏
router.post('/remove', (req, res) => {
    const { userid, goods_id } = req.body;
    
    if (!userid || !goods_id) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "用户ID和商品ID不能为空"
        });
    }
    
    const sql = 'DELETE FROM favorites WHERE userid = ? AND goods_id = ?';
    db.query(sql, [userid, goods_id], (err, result) => {
        if (err) {
            res.send({
                code: 500,
                success: "失败",
                msg: "取消收藏失败",
                err: err.message
            });
        } else if (result.affectedRows === 0) {
            res.send({
                code: 400,
                success: "失败",
                msg: "该商品未收藏"
            });
        } else {
            // 取消收藏成功后，重新计算并更新goods表的views字段
            const updateGoodsSql = `
                UPDATE goods 
                SET views = (
                    SELECT COUNT(*) 
                    FROM favorites 
                    WHERE goods_id = ?
                ) 
                WHERE goods_id = ?
            `;
            db.query(updateGoodsSql, [goods_id, goods_id], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error('更新商品收藏数失败:', updateErr);
                    // 即使更新失败也返回成功，因为收藏记录已经删除
                }
                
                res.send({
                    code: 200,
                    success: "成功",
                    msg: "取消收藏成功"
                });
            });
        }
    });
});

// 检查收藏状态
router.post('/check', (req, res) => {
    const { userid, goods_id } = req.body;
    
    if (!userid || !goods_id) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "用户ID和商品ID不能为空"
        });
    }
    
    const sql = 'SELECT * FROM favorites WHERE userid = ? AND goods_id = ?';
    db.query(sql, [userid, goods_id], (err, result) => {
        if (err) {
            res.send({
                code: 500,
                success: "失败",
                msg: "检查收藏状态失败",
                err: err.message
            });
        } else {
            res.send({
                code: 200,
                success: "成功",
                msg: "获取收藏状态成功",
                result: {
                    isFavorited: result.length > 0
                }
            });
        }
    });
});

module.exports = router;