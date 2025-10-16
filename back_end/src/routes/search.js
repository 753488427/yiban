const express = require('express');
const router = express.Router();
const db = require('../config/db');


//商品搜索
router.post('/', (req, res) => { 
    const sql = 'select * from goods where title like ?';
    db.query(sql, ['%'+req.body.title+'%'], (err, result) => { 
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
                result: result,
            })
        }
    })
})

module.exports = router;