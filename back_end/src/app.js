const express = require('express');
const cors = require('cors');
const path = require('path');

// 导入路由模块
const authRoutes = require('./routes/auth');    //用户接口
const addressRoutes = require('./routes/address');   //用户地址接口i
const messageRoutes = require('./routes/message');   //用户回复消息接口
const goodsRoutes = require('./routes/goods');    //用户商品接口
const bannerRoutes = require('./routes/banner');   //用户轮播图接口
const classifyRoutes = require('./routes/classify');    //用户分类接口
const searchRoutes = require('./routes/search');   //用户搜索接口
const commentsRoutes = require('./routes/comments');   //用户评论接口
const favoritesRoutes = require('./routes/favorites');  //用户收藏接口
const replyRoutes = require('./routes/reply');    //用户回复评论接口
const likesRoutes = require('./routes/likes');   //用户喜欢接口
const communityRoutes = require('./routes/community');   //用户社区接口
const newsRoutes = require('./routes/news');   //用户消息接口
const respondRoutes = require('./routes/respond');   //用户回复社区接口
const ordersRoutes = require('./routes/orders');   //用户订单接口

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../public')));

// 错误处理中间件
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: "失败",
            msg: "请求数据格式错误，请确保发送正确的JSON格式",
            error: err.message
        });
    }
    next();
});

// 路由配置
app.use('/auth', authRoutes);
app.use('/address', addressRoutes);
app.use('/message',messageRoutes);
app.use('/goods',goodsRoutes);
app.use('/banner',bannerRoutes);
app.use('/classify',classifyRoutes);
app.use('/search',searchRoutes);
app.use('/comments',commentsRoutes);
app.use('/favorites',favoritesRoutes);
app.use('/reply',replyRoutes);
app.use('/likes',likesRoutes);
app.use('/community',communityRoutes);
app.use('/news',newsRoutes);
app.use('/respond',respondRoutes);
app.use('/orders',ordersRoutes);

// 全局错误处理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: "失败",
        msg: "服务器内部错误",
        error: err.message
    });
});

// 启动服务器，测试
const PORT = process.env.PORT || 8082;
app.listen(PORT, () => {
    console.log(`服务器已启动，监听端口 ${PORT}`);
});

module.exports = app;