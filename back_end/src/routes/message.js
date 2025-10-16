const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 消息列表
router.post('/', (req, res) => {
    const sql = 'select * from messages';
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


module.exports = router;