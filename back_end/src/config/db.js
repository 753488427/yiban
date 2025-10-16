const mysql = require('mysql');

// 数据库连接配置
const dbConfig = {
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '123456',
    database: 'yiban'
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 封装数据库查询方法
const query = (sql, params, callback) => {
    pool.getConnection((err, connection) => {
        if (err) {
            callback(err, null);
            return;
        }
        connection.query(sql, params, (error, results) => {
            connection.release();
            callback(error, results);
        });
    });
};

module.exports = {
    query
};