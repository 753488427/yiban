const express = require('express');
const router = express.Router();
const db = require('../config/db');


// 获取轮播图
router.post('/', (req, res) => {
    const sql = 'select * from banner'
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
                msg: "查询成功",
                result: result
            });
        }
    })
});

module.exports = router;