const fs = require('fs');
const path = require('path');
const express = require('express');
const moment = require('moment');

const router = express.Router();

require.cache = null;
let cate = require('../db/cate.json');
// let cate = fs.readFileSync(rootPath + '/db/cate.json', 'utf-8');
let art = require('../db/article.json');
let admin = require('../db/admin.json');
let comment = require('../db/comments.json');
require.cache = null;
const TAFFY = require('taffy');
let a = TAFFY(art);
let c = TAFFY(cate);
let b = TAFFY(admin);
let d = TAFFY(comment);
// 显示后台首页的接口
router.get('/admin/index.html', (req, res) => {
    res.sendFile(rootPath + '/view/admin/index.html');
});

// 显示后台登录页的接口
router.get('/admin/login.html', (req, res) => {
    res.sendFile(rootPath + '/view/admin/login.html');
});

router.get('/admin/main_count.html', (req, res) => {
    res.sendFile(rootPath + '/view/admin/main_count.html');
});

router.get('/admin/article_category.html', (req, res) => {
    res.sendFile(rootPath + '/view/admin/article_category.html');
});

router.get('/admin/article_edit.html', (req, res) => {
    res.sendFile(rootPath + '/view/admin/article_edit.html');
});

router.get('/admin/article_list.html', (req, res) => {
    res.sendFile(rootPath + '/view/admin/article_list.html');
});

router.get('/admin/article_release.html', (req, res) => {
    res.sendFile(rootPath + '/view/admin/article_release.html');
});

router.get('/admin/comment_list.html', (req, res) => {
    res.sendFile(rootPath + '/view/admin/comment_list.html');
});

router.get('/admin/user.html', (req, res) => {
    res.sendFile(rootPath + '/view/admin/user.html');
});
// article_update
router.get('/admin/article_update.html', (req, res) => {
    res.sendFile(rootPath + '/view/admin/article_update.html');
});
// 显示接口结束，非常 low

//////////////////////////////////////////////// 后台首页：获取总文章数量

//////////////////////////////////////////////// 后台首页：获取日新增文章数量

//////////////////////////////////////////////// 后台首页：获取评论总数量

//////////////////////////////////////////////// 后台首页：获取日新增评论数


//////////////////////////////////////////////// 文章管理：查询文章（同前台）；
/**
 * 分页查询文章，默认每页数据5条，可更改
 * cateid -- 分类id，默认null，null表示不考虑分类
 * keywords -- 模糊查询的内容，即查询标题中包含有搜索关键字的文章，默认null，表示没有条件
 * state -- 文章的状态，默认为已发布
 * pageNum -- 每页显示几条数据，默认5
 * page -- 分页页码，默认1
 */
router.get('/admin/getArticlesWithPage', (req, res) => {
    let cateid = req.query.cateid || null;
    let keywords = req.query.keywords || null;
    let state = req.query.state || '已发布';
    let page = req.query.page || 1;
    let pageNum = req.query.pageNum || 5;

    // 设置查询条件
    let condition = { state: state };
    if (cateid) {
        condition.cateid = Number.parseInt(cateid); // 这里是一个坑，必须是数字
    }
    // console.log(condition);
    if (keywords) {
        condition.title = { 'like': keywords }
    }

    // 计算查询的起始位置
    let count = a(condition).count(); // 符合条件的总记录数
    let start = (page - 1) * pageNum; // 查询起始位置
    let pageTotal = Math.ceil(count / pageNum); // 总页数

    let data = a(condition).start(start).limit(pageNum).get();

    // 如果没查到数据，说明根据该条件查不到数据，可能的原因 1、没有这样的关键字；2、没有这样的分类；3、没有这样的状态；4、没这么多页数据
    // 设置初始数据
    let result = {
        code: 201,
        message: `不好意思，没数据呦，看看参数是不是错啦，要不就是没那么多页。不是这些问题，那就是没数据喽`,
        page: 0,
        pageTotal: 0,
        data: []
    }
    // 如果data.length > 0 说明查到数据了，重置result的属性，并添加作者和分类名称
    if (data.length > 0) {
        data.forEach(item => {
            item.catename = c({ id: { '==': item.cateid } }).select('name')[0];
            item.nickname = b({ id: { '==': item.adminid } }).select('nickname')[0];
        });
        result.code = 200;
        result.message = '请求数据成功';
        result.page = page;
        result.pageTotal = pageTotal;
        result.data = data;
    }

    res.json(result);
});

//////////////////////////////////////////////// 文章管理：添加文章；
const multer = require('multer');
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'upload/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
let upload = multer({ storage: storage })
router.post('/admin/addArticle', upload.single('file'), (req, res) => {
    //1. 接收表单数据
    let data = req.body;
    data.id = a().max('id') + 1;
    data.file = '\\' + req.file.path;
    data.adminid = req.session.userInfo.id;
    data.cmt = null;
    data.click = parseInt(Math.random() * 3000);
    data.good = parseInt(Math.random() * 1000);
    data.bad = parseInt(Math.random() * 200);

    // 添加
    a.insert(data);
    // res.json(a().get());
    fs.writeFile(rootPath + '/db/article.json', JSON.stringify(a().get()), (err) => {
        if (err) {
            res.json({ code: 201, message: '添加失败，查看你的db/article.json是不是只读的' });
        } else {
            res.json({ code: 200, message: '添加文章成功' });
        }
    })
});

//////////////////////////////////////////////// 文章管理：根据id查询一篇文章
router.get('/admin/getArticleById', (req, res) => {
    let id = req.query.id || null;
    if (id) {
        let data = art.find(item => {
            return item.id == id;
        });
        res.json({
            code: 200,
            message: '请求数据成功',
            data: data,
            category: cate
        });
    } else {
        res.json({ code: 201, message: '请求参数错误' });
    }
});
//////////////////////////////////////////////// 文章管理：修改文章；
router.post('/admin/updateArticle', upload.single('file'), (req, res) => {
    //1. 接收表单数据
    let data = {
        title: req.body.title,
        desc: req.body.desc,
        text: req.body.text,
        cateid: req.body.cateid,
        state: req.body.state
    };
    let catename = c({id: parseInt(data.cateid)}).select('name')[0];
    // console.log(c({id: parseInt(data.cateid)}).select('name'));
    data.catename = catename;
    // data.id = a().max('id') + 1;
    // console.log(req.file); // 没有图片得到undefined
    if (req.file) {
        data.file = '\\' + req.file.path;
    }
    // data.adminid = req.session.userInfo.id;
    // data.cmt = null;
    // data.click = parseInt(Math.random() * 3000);
    // data.good = parseInt(Math.random() * 1000);
    // data.bad = parseInt(Math.random() * 200);

    a({ id: parseInt(req.body.id) }).update(data);
    // res.json(a().get());
    fs.writeFile(rootPath + '/db/article.json', JSON.stringify(a().get()), (err) => {
        if (err) {
            res.json({ code: 201, message: '修改失败，查看你的db/article.json是不是只读的' });
        } else {
            res.json({ code: 200, message: '修改文章成功' });
        }
    })
});
//////////////////////////////////////////////// 文章管理：删除文章；
router.get('/admin/deleteArticle', (req, res) => {
    let id = req.query.id;
    // 获取表单提交的分类名称和分类别名
    let num = a({ id: parseInt(id) }).remove();
    if (num > 0) {
        fs.writeFile(rootPath + '/db/article.json', JSON.stringify(a().get()), (err) => {
            if (err) {
                // console.log(err);
                res.json({ code: 201, message: '删除失败，查看你的db/article.json是不是只读的' });
            } else {
                res.json({ code: 200, message: '删除文章成功' });
            }
        })
    } else {
        res.json({ code: 201, message: '无效的参数' })
    }
    // res.json(c().get())
});
//////////////////////////////////////////////// 文章管理：图片异步上传；
router.post('/user/submit-image', upload.single('file'), (req, res) => {
    res.json({ location: req.file.path });
});

//////////////////////////////////////////////// 分类管理：获取分类（同前台）；
// 获取分类
router.get('/admin/getCategory', (req, res) => {
    res.json(cate);
});
//////////////////////////////////////////////// 分类管理：添加分类；
router.post('/admin/addCategory', (req, res) => {
    // 获取表单提交的分类名称和分类别名
    let data = req.body;
    data.id = c().max('id') + 1;
    data.addtime = moment().format('YYYY-MM-DD');
    c.insert(data);
    // res.json(c().get())
    fs.writeFile(rootPath + '/db/cate.json', JSON.stringify(c().get()), (err) => {
        if (err) {
            // console.log(err);
            res.json({ code: 201, message: '添加失败，查看你的db/cate.json是不是只读的' });
        } else {
            res.json({ code: 200, message: '添加分类成功' });
        }
    })
});
//////////////////////////////////////////////// 分类管理：修改分类；
router.post('/admin/updateCategory', (req, res) => {
    // 获取表单提交的分类名称和分类别名
    c({ id: parseInt(req.body.id) }).update({ name: req.body.name, icon: req.body.icon });

    // res.json(c().get())
    fs.writeFile(rootPath + '/db/cate.json', JSON.stringify(c().get()), (err) => {
        if (err) {
            // console.log(err);
            res.json({ code: 201, message: '修改失败，查看你的db/cate.json是不是只读的' });
        } else {
            res.json({ code: 200, message: '修改分类成功' });
        }
    })
});
//////////////////////////////////////////////// 分类管理：删除分类；
router.get('/admin/deleteCategory', (req, res) => {
    let id = req.query.id;
    // 获取表单提交的分类名称和分类别名
    let num = c({ id: parseInt(id) }).remove();
    if (num > 0) {
        fs.writeFile(rootPath + '/db/cate.json', JSON.stringify(c().get()), (err) => {
            if (err) {
                // console.log(err);
                res.json({ code: 201, message: '删除失败，查看你的db/cate.json是不是只读的' });
            } else {
                res.json({ code: 200, message: '删除分类成功' });
            }
        })
    } else {
        res.json({ code: 201, message: '无效的参数' })
    }
    // res.json(c().get())
});
//////////////////////////////////////////////// 登录：登录接口；
router.post('/admin/checkLogin', (req, res) => {
    const email = req.body.email;
    const passwd = req.body.pwd;

    let data1 = b({ email: email, pwd: passwd }).get();
    let data2 = b({ tel: { '==': email }, pwd: passwd }).get();
    if (data1.length <= 0 && data2.length <= 0) {
        res.json({ code: 201, message: '登录失败' })

    } else {
        // 登录成功，记录session
        req.session.isLogin = true;
        req.session.userInfo = data1.length <= 0 ? data2[0] : data1[0];

        res.json({ code: 200, message: "登录成功" });
    }

});
//////////////////////////////////////////////// 登录：退出接口；
router.get('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.json({ code: 201, message: "退出失败" });
        }
        res.json({ code: 200, message: "退出成功" });
    });
});
//////////////////////////////////////////////// 登录：注册接口；
//////////////////////////////////////////////// 登录：修改管理员信息接口


//////////////////////////////////////////////// 评论：获取一篇文章的评论
router.get('/getCommentsByArticleId', (req, res) => {
    let articleid = req.query.articleid;
    let aa = d({ articleid: { '==': articleid }, state: '已批准' })
    res.json({
        count: aa.count(),
        data: aa.get()
    });
});

//////////////////////////////////////////////// 评论：添加评论
router.post('/addComment', (req, res) => {
    let data = req.body;
    data.id = d().max('id') + 1;
    data.addtime = moment().format('YYYY-MM-DD HH:mm:ss');
    data.state = '待审核';
    d.insert(data);
    // res.json(d().get())
    fs.writeFile(rootPath + '/db/comments.json', JSON.stringify(d().get()), (err) => {
        if (err) {
            // console.log(err);
            res.json({ code: 201, message: '添加失败，查看你的db/comments.json是不是只读的' });
        } else {
            res.json({ code: 200, message: '发布成功，待管理员审核后，即可显示' });
        }
    })
});

//////////////////////////////////////////////// 评论：获取所有评论并分页；
router.get('/admin/getComments', (req, res) => {
    let keywords = req.query.keywords || null;
    let state = req.query.state || null;
    let page = req.query.page || 1;
    let pageNum = req.query.pageNum || 5;

    // 设置查询条件
    // let condition = { state: state };
    let condition = {};
    // console.log(condition);
    if (keywords) {
        condition.content = { 'like': keywords }
    }
    if (state) {
        condition.state = state;
    }

    // 计算查询的起始位置
    let count = d(condition).count(); // 符合条件的总记录数
    let start = (page - 1) * pageNum + 1; // 查询起始位置
    let pageTotal = Math.ceil(count / pageNum); // 总页数

    let data = d(condition).start(start).limit(pageNum).get();

    // 如果没查到数据，说明根据该条件查不到数据，可能的原因 1、没有这样的关键字；2、没有这样的分类；3、没有这样的状态；4、没这么多页数据
    // 设置初始数据
    let result = {
        code: 201,
        message: `不好意思，没数据呦，看看参数是不是错啦，要不就是没那么多页。不是这些问题，那就是没数据喽`,
        page: 0,
        pageTotal: 0,
        data: []
    }
    // 如果data.length > 0 说明查到数据了，重置result的属性，并添加作者和分类名称
    if (data.length > 0) {
        data.forEach(item => {
            item.title = a({ id: { '==': item.articleid } }).select('title')[0];
        });
        result.code = 200;
        result.message = '请求数据成功';
        result.page = page;
        result.pageTotal = pageTotal;
        result.data = data;
    }

    res.json(result);
});
//////////////////////////////////////////////// 评论：处理评论；
router.get('/admin/dealComment', (req, res) => {
    let state = req.query.state;
    let id = req.query.id;
    if (state == '删除') {
        let num = d({ id: parseInt(id) }).remove();
        if (num > 0) {
            fs.writeFile(rootPath + '/db/comments.json', JSON.stringify(d().get()), (err) => {
                if (err) {
                    // console.log(err);
                    res.json({ code: 201, message: '删除失败，查看你的db/comments.json是不是只读的' });
                } else {
                    res.json({ code: 200, message: '删除成功' });
                }
            })
        } else {
            res.json({ code: 201, message: '无效的id' })
        }
    } else if (state == '批准' || state == '拒绝') {
        // 获取表单提交的分类名称和分类别名
        d({ id: parseInt(id) }).update({ state: '已' + state });

        // res.json(c().get())
        fs.writeFile(rootPath + '/db/comments.json', JSON.stringify(d().get()), (err) => {
            if (err) {
                // console.log(err);
                res.json({ code: 201, message: '设置失败，查看你的db/comments.json是不是只读的' });
            } else {
                res.json({ code: 200, message: '设置成功，已将状态设置为“已' + state + "”" });
            }
        })
    }
});

//////////////////////////////////////////////////////////// 获取最新评论
router.get('/getCommentsByAddtime', (req, res) => {
    let num = req.query.num || 5;
    let data = d({state: '已批准'}).order('id desc').start(1).limit(num).get();
    // console.log(data);
    res.json(data)
});


module.exports = router;