const express = require('express');
const router = express.Router();
const db = require('../config/db');

//商品分类
router.post('/', (req, res) => { 
    const sql = 'select * from classify';
    db.query(sql, [], (err, result) => { 
        if(err){
            res.send({
                success: "失败",
                msg: "false",
                err: err.message
            });
        }else if(result){
            res.send({
                success: "成功",
                msg: "true",
                result: result
            });
        }
    });
});

module.exports = router;