const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 内存存储验证码（生产环境建议使用Redis）
const verificationCodes = new Map();

// 确保uploads目录存在
const uploadDir = path.join(__dirname, '../../public/uploads/');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer用于文件上传
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
        fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
    }
});

// 获取所有用户（调试用）
router.post('/', (req, res) => {
    const sql = 'SELECT * FROM user';
    db.query(sql, [], (err, result) => {
        if (err) {
            res.send({
                code: 500,
                success: "失败",
                msg: "查询失败",
                err: err.message
            });
        } else {
            res.send({
                code: 200,
                success: "成功",
                msg: "查询成功",
                result: result
            });
        }
    });
});

// 生成6位随机验证码
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 验证手机号格式
function isValidPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
}


//条件登录
router.post('/login', (req, res) => {
    let sql = '';
    let params = [];
    
    // 支持account或phone登录
    if (req.body.account) {
        sql = 'SELECT * FROM user WHERE account=? AND password=?';
        params = [req.body.account, req.body.password];
    } else if (req.body.phone) {
        sql = 'SELECT * FROM user WHERE phone=? AND password=?';
        params = [req.body.phone, req.body.password];
    } else {
        return res.send({
            code: 400,
            success: "失败",
            msg: "请提供账号(account)或手机号(phone)"
        });
    }
    
    db.query(sql, params, (err, result) => {
        if (err) {
            res.send({
                code: 500,
                success: "失败",
                msg: "false",
                err: err.message
            });
        } else if (result.length === 0) {
            res.send({
                code: 400,
                success: "失败",
                msg: "账号或密码错误"
            });
        } else {
            res.send({
                code: 200,
                success: "成功",
                msg: "登录成功",
                result: result
            });
        }
    });
});

// 用户注册接口
router.post('/register', upload.single('image'), (req, res) => {
    const { username, account, password, phone, sex, identity } = req.body;
    
    // 构建插入数据
    const insertData = { username, account, password, phone };
    
    // 添加可选字段
    if (sex) insertData.sex = sex;
    if (identity) insertData.identity = identity;
    if (req.file) insertData.image = `uploads/${req.file.filename}`;
    
    // 构建SQL语句
    const fields = Object.keys(insertData);
    const values = Object.values(insertData);
    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT INTO user (${fields.join(', ')}) VALUES (${placeholders})`;
    
    db.query(sql, values, (err, result) => {
        if (err) {
            res.send({
                code: 500,
                success: "失败",
                msg: "注册失败",
                err: err.message
            });
        } else {
            res.send({
                code: 200,
                success: "成功",
                msg: "注册成功",
                result: {
                    userid: result.insertId,
                    ...insertData
                }
            });
        }
    });
});


// 修改用户信息接口
router.post('/updateUserInfo', upload.single('image'), (req, res) => {
    const { userid, account, password, username, sex, phone, identity } = req.body;
    
    if (!userid) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "用户ID不能为空"
        });
    }
    
    // 构建更新字段
    const updateFields = [];
    const updateValues = [];
    
    if (account) {
        updateFields.push('account = ?');
        updateValues.push(account);
    }
    if (password) {
        updateFields.push('password = ?');
        updateValues.push(password);
    }
    if (username) {
        updateFields.push('username = ?');
        updateValues.push(username);
    }
    if (sex) {
        updateFields.push('sex = ?');
        updateValues.push(sex);
    }
    if (phone) {
        updateFields.push('phone = ?');
        updateValues.push(phone);
    }
    if (identity) {
        updateFields.push('identity = ?');
        updateValues.push(identity);
    }
    if (req.file) {
        updateFields.push('image = ?');
        updateValues.push(`uploads/${req.file.filename}`);
    }
    
    if (updateFields.length === 0) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "没有要更新的字段"
        });
    }
    
    updateValues.push(userid);
    const sql = `UPDATE user SET ${updateFields.join(', ')} WHERE userid = ?`;
    
    db.query(sql, updateValues, (err, result) => {
        if (err) {
            res.send({
                code: 500,
                success: "失败",
                msg: "更新失败",
                err: err.message
            });
        } else if (result.affectedRows === 0) {
            res.send({
                code: 400,
                success: "失败",
                msg: "用户不存在"
            });
        } else {
            res.send({
                code: 200,
                success: "成功",
                msg: "用户信息更新成功",
                result: result
            });
        }
    });
});

// 发送验证码接口
router.post('/sendVerificationCode', (req, res) => {
    const { phone } = req.body;
    
    // 验证手机号格式
    if (!phone || !isValidPhone(phone)) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "请输入正确的手机号"
        });
    }
    
    // 生成验证码
    const code = generateVerificationCode();
    
    // 存储验证码，设置5分钟过期
    const expireTime = Date.now() + 5 * 60 * 1000; // 5分钟后过期
    verificationCodes.set(phone, {
        code: code,
        expireTime: expireTime,
        createTime: Date.now()
    });
    
    // 这里应该调用短信服务发送验证码
    // 暂时在控制台打印验证码用于调试
    console.log(`发送验证码到 ${phone}: ${code}`);
    
    res.send({
        code: 200,
        success: "成功",
        msg: "验证码发送成功",
        devCode: code // 开发环境返回验证码，生产环境应该移除
    });
});

// 验证码登录接口
router.post('/loginByCode', (req, res) => {
    const { phone, code } = req.body;
    
    // 验证参数
    if (!phone || !isValidPhone(phone)) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "请输入正确的手机号"
        });
    }
    
    if (!code) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "请输入验证码"
        });
    }
    
    // 获取存储的验证码
    const storedCodeData = verificationCodes.get(phone);
    
    if (!storedCodeData) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "验证码不存在或已过期，请重新获取"
        });
    }
    
    // 检查验证码是否过期
    if (Date.now() > storedCodeData.expireTime) {
        verificationCodes.delete(phone);
        return res.send({
            code: 400,
            success: "失败",
            msg: "验证码已过期，请重新获取"
        });
    }
    
    // 验证验证码
    if (storedCodeData.code !== code) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "验证码错误"
        });
    }
    
    // 验证码正确，删除已使用的验证码
    verificationCodes.delete(phone);
    
    // 查询用户是否存在
    const sql = 'SELECT * FROM user WHERE phone=?';
    db.query(sql, [phone], (err, result) => {
        if (err) {
            return res.send({
                code: 500,
                success: "失败",
                msg: "数据库查询失败",
                err: err.message
            });
        }
        
        if (result.length === 0) {
            // 用户不存在，自动注册
            const insertSql = 'INSERT INTO user (phone, account) VALUES (?, ?)';
            const newAccount = `user_${phone}`;
            
            db.query(insertSql, [phone, newAccount], (insertErr, insertResult) => {
                if (insertErr) {
                    return res.send({
                        code: 500,
                        success: "失败",
                        msg: "用户注册失败",
                        err: insertErr.message
                    });
                }
                
                // 返回新注册的用户信息
                res.send({
                    code: 200,
                    success: "成功",
                    msg: "登录成功（新用户已自动注册）",
                    result: [{
                        id: insertResult.insertId,
                        phone: phone,
                        account: newAccount,
                        isNewUser: true
                    }]
                });
            });
        } else {
            // 用户存在，直接登录
            res.send({
                code: 200,
                success: "成功",
                msg: "登录成功",
                result: result
            });
        }
    });
});

// 清理过期验证码的定时任务
setInterval(() => {
    const now = Date.now();
    for (const [phone, codeData] of verificationCodes.entries()) {
        if (now > codeData.expireTime) {
            verificationCodes.delete(phone);
            console.log(`清理过期验证码: ${phone}`);
        }
    }
}, 60 * 1000); // 每分钟清理一次


//修改密码接口
// 简易修改密码接口
router.post('/updatePassword', (req, res) => {
    const { userid, oldPassword, newPassword } = req.body;
    
    // 基本参数检查
    if (!userid || !oldPassword || !newPassword) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "请提供用户ID、旧密码和新密码"
        });
    }
    
    // 直接更新密码（不验证旧密码）
    const sql = 'UPDATE user SET password = ? WHERE userid = ? AND password = ?';
    db.query(sql, [newPassword, userid, oldPassword], (err, result) => {
        if (err) {
            return res.send({
                code: 500,
                success: "失败",
                msg: "更新密码失败",
                err: err.message
            });
        }
        
        if (result.affectedRows === 0) {
            return res.send({
                code: 400,
                success: "失败",
                msg: "用户不存在或旧密码错误"
            });
        }
        
        res.send({
            code: 200,
            success: "成功",
            msg: "密码修改成功"
        });
    });
});

// 简化更换手机号接口
router.post('/updatePhone', (req, res) => {
    const { userid, newPhone } = req.body;
    
    // 基本参数检查
    if (!userid || !newPhone) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "请提供用户ID和新手机号"
        });
    }
    
    // 验证手机号格式
    if (!isValidPhone(newPhone)) {
        return res.send({
            code: 400,
            success: "失败",
            msg: "请输入正确的手机号格式"
        });
    }
    
    // 直接更新手机号（简化版本，不验证验证码）
    const sql = 'UPDATE user SET phone = ? WHERE userid = ?';
    db.query(sql, [newPhone, userid], (err, result) => {
        if (err) {
            return res.send({
                code: 500,
                success: "失败",
                msg: "更新手机号失败",
                err: err.message
            });
        }
        
        if (result.affectedRows === 0) {
            return res.send({
                code: 400,
                success: "失败",
                msg: "用户不存在"
            });
        }
        
        res.send({
            code: 200,
            success: "成功",
            msg: "手机号更换成功"
        });
    });
});

module.exports = router;
