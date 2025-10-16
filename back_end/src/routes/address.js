const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 获取所有用户地址
router.post('/', (req, res) => {
    const sql = 'select * from address where userid=?';
    db.query(sql, [req.body.userid], (err, result) => {
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

// 添加地址
router.post('/add', (req, res) => {
    const { userid, username, phone, area, area_one } = req.body;
    
    if (!userid || !username || !phone || !area || !area_one) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "所有字段都不能为空"
        });
    }
    
    const sql = 'INSERT INTO address (userid, username, phone, area, area_one) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [userid, username, phone, area, area_one], (err, result) => {
        if (err) {
            res.send({
                code: 500,
                success: "失败",
                msg: "添加地址失败",
                err: err.message
            });
        } else {
            res.send({
                code: 200,
                success: "成功",
                msg: "添加地址成功",
                result: { address_id: result.insertId }
            });
        }
    });
});

// 修改地址
router.post('/update', (req, res) => {
    const { address_id, username, phone, area, area_one } = req.body;
    
    if (!address_id || !username || !phone || !area || !area_one) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "所有字段都不能为空"
        });
    }
    
    const sql = 'UPDATE address SET username=?, phone=?, area=?, area_one=? WHERE address_id=?';
    db.query(sql, [username, phone, area, area_one, address_id], (err, result) => {
        if (err) {
            res.send({
                code: 500,
                success: "失败",
                msg: "修改地址失败",
                err: err.message
            });
        } else if (result.affectedRows === 0) {
            res.send({
                code: 404,
                success: "失败",
                msg: "地址不存在"
            });
        } else {
            res.send({
                code: 200,
                success: "成功",
                msg: "修改地址成功"
            });
        }
    });
});

// 删除地址
router.post('/delete', (req, res) => {
    const { address_id } = req.body;
    
    if (!address_id) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "地址ID不能为空"
        });
    }
    
    const sql = 'DELETE FROM address WHERE address_id=?';
    db.query(sql, [address_id], (err, result) => {
        if (err) {
            res.send({
                code: 500,
                success: "失败",
                msg: "删除地址失败",
                err: err.message
            });
        } else if (result.affectedRows === 0) {
            res.send({
                code: 404,
                success: "失败",
                msg: "地址不存在"
            });
        } else {
            res.send({
                code: 200,
                success: "成功",
                msg: "删除地址成功"
            });
        }
    });
});

module.exports = router;