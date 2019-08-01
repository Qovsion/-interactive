require.cache = null;
// 1. 加载所需的全部模块
const express = require('express');
const bodyParser = require('body-parser');
const template = require('express-art-template');
const session = require('express-session');
// 2. 开启服务器
const app = express();
app.listen(4000, () => console.log('服务启动了'));

// 3. 配置（静态资源配置、模板引擎配置、session配置、body-parser配置）
// 3.1 静态资源配置(略)

// 前台的配置
// app.use(请求的url的开头, express.static(__dirname + ''));
app.use('/assets/', express.static(__dirname + '/view/home/assets'));
app.use('/uploads/', express.static(__dirname + '/view/home/uploads'));
// 后台的配置
app.use('/admin/*assets/', express.static(__dirname + '/view/admin/assets'));
// app.use('/admin/user/assets/', express.static(__dirname + '/view/admin/assets'));
// app.use('/admin/post/assets/', express.static(__dirname + '/view/admin/assets'));
// app.use('/admin/cate/assets/', express.static(__dirname + '/view/admin/assets'));

app.use('*/upload/', express.static(__dirname + '/upload'));

// 3.2 模板引擎配置
app.engine('html', template);
// 3.3 session配置
app.use(session({
    secret: 'asdf23fs',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }
}));
// 3.4 body-parser配置
app.use(bodyParser.urlencoded({ extended: false }));


// 定义项目根目录
global.rootPath = __dirname;

// 4. 加载路由文件，并将他们注册成中间件

// const home = require('./router/home'); // 省略后缀，默认加载home.js
// app.use(home);

app.use(require('./router/home'));
// 使用中间件，控制，只有登录才能访问后台页面

// app.use((req, res, next) => {
//     if (req.session.isLogin || req.url === '/admin/login.html' || req.url === '/admin/checkLogin') {
//         next();
//     } else {
//         res.send('<script>alert("请先登录"); location.href="/admin/login.html";</script>');
//         return;
//     }
// });


app.use(require('./router/admin'));
