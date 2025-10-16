const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 获取用户订单列表（三表联查）
router.post('/', (req, res) => { 
    const { userid } = req.body;
    
    let sql = `
        SELECT 
            o.order_id,
            o.userid,
            o.goods_id,
            o.address_id,
            o.status,
            o.time,
            u.username as buyer_username,
            u.image as buyer_image,
            g.title as goods_title,
            g.image as goods_image,
            g.price as goods_price,
            g.classify as goods_classify,
            g.userid as seller_id,
            seller.username as seller_username,
            seller.image as seller_image,
            a.username as address_username,
            a.phone as address_phone,
            a.area as address_area,
            a.area_one as address_detail
        FROM orders o
        LEFT JOIN user u ON o.userid = u.userid
        LEFT JOIN goods g ON o.goods_id = g.goods_id
        LEFT JOIN user seller ON g.userid = seller.userid
        LEFT JOIN address a ON o.address_id = a.address_id
    `;
    
    const params = [];
    
    // 如果传入了userid，只查询该用户的订单
    if (userid) {
        sql += ` WHERE o.userid = ?`;
        params.push(userid);
    }
    
    sql += ` ORDER BY o.time DESC`;
    
    db.query(sql, params, (err, result) => {
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
    })
});

// 添加订单接口
router.post('/add', (req, res) => {
    const { userid, goods_id, address_id, status } = req.body;
    
    // 验证必填字段
    if (!userid || !goods_id || !address_id) {
        return res.send({
            success: "失败",
            msg: "缺少必要参数",
            err: "userid, goods_id, address_id 不能为空"
        });
    }
    
    // 插入订单数据
    const sql = `
        INSERT INTO orders (userid, goods_id, address_id, status, time) 
        VALUES (?, ?, ?, ?, NOW())
    `;
    
    const orderStatus = status || '已购'; // 默认状态为已购
    const params = [userid, goods_id, address_id, orderStatus];
    
    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('添加订单失败:', err);
            res.send({
                success: "失败",
                msg: "添加订单失败",
                err: err.message
            });
        } else {
            // 订单创建成功后，更新商品状态为"已购"
            const updateGoodsSql = 'UPDATE goods SET status = ? WHERE goods_id = ?';
            db.query(updateGoodsSql, ['已购', goods_id], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error('更新商品状态失败:', updateErr);
                    // 即使更新商品状态失败，订单仍然创建成功，只记录错误
                }
                
                // 返回新创建的订单ID
                res.send({
                    success: "成功",
                    msg: "订单创建成功",
                    result: {
                        order_id: result.insertId,
                        userid: userid,
                        goods_id: goods_id,
                        address_id: address_id,
                        status: orderStatus,
                        goods_status_updated: updateErr ? false : true
                    }
                });
            });
        }
    });
});

// 更新订单状态接口
router.post('/update', (req, res) => {
    const { order_id, status } = req.body;
    
    if (!order_id || !status) {
        return res.send({
            success: "失败",
            msg: "缺少必要参数",
            err: "order_id 和 status 不能为空"
        });
    }
    
    const sql = 'UPDATE orders SET status = ? WHERE order_id = ?';
    
    db.query(sql, [status, order_id], (err, result) => {
        if (err) {
            console.error('更新订单状态失败:', err);
            res.send({
                success: "失败",
                msg: "更新订单状态失败",
                err: err.message
            });
        } else if (result.affectedRows === 0) {
            res.send({
                success: "失败",
                msg: "订单不存在",
                err: "未找到指定的订单"
            });
        } else {
            res.send({
                success: "成功",
                msg: "订单状态更新成功",
                result: {
                    order_id: order_id,
                    status: status
                }
            });
        }
    });
});

// 删除订单接口
router.post('/delete', (req, res) => {
    const { order_id, userid } = req.body;
    
    if (!order_id || !userid) {
        return res.send({
            success: "失败",
            msg: "缺少必要参数",
            err: "order_id 和 userid 不能为空"
        });
    }
    
    // 只允许用户删除自己的订单
    const sql = 'DELETE FROM orders WHERE order_id = ? AND userid = ?';
    
    db.query(sql, [order_id, userid], (err, result) => {
        if (err) {
            console.error('删除订单失败:', err);
            res.send({
                success: "失败",
                msg: "删除订单失败",
                err: err.message
            });
        } else if (result.affectedRows === 0) {
            res.send({
                success: "失败",
                msg: "订单不存在或无权限删除",
                err: "未找到指定的订单或无权限"
            });
        } else {
            res.send({
                success: "成功",
                msg: "订单删除成功",
                result: {
                    order_id: order_id
                }
            });
        }
    });
});

module.exports = router;