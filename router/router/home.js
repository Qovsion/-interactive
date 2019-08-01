// 处理前台的接口

// 1. 加载express
const express = require('express');
// 2. 创建路由对象
const router = express.Router();
// 3. 将接口挂载到路由对象上
require.cache = null;
let cate = require('../db/cate.json');
let art = require('../db/article.json');
let admin = require('../db/admin.json');
const TAFFY = require('taffy');
let a = TAFFY(art);
let c = TAFFY(cate);
let b = TAFFY(admin);

// 测试方法
router.get('/test', (req, res) => {
    // console.log(c());
    // console.log(c);
    res.json(a().join(c, ['cateid', '==', 'id']).select('id', 'title'));
});

router.get('/search');

// 返回首页模板
// router.get('/index.html', (req, res) => {
router.get('/', (req, res) => {
    res.sendFile(rootPath + '/view/home/index.html');
});

// 返回列表页模板
router.get('/list.html', (req, res) => {
    res.sendFile(rootPath + '/view/home/list.html');
});

// 返回详情页模板
router.get('/detail.html', (req, res) => {
    res.sendFile(rootPath + '/view/home/detail.html');
});

// 评论：获取当前文章的评论（前台）； 
// 评论：获取最新评论（前台）；
// 评论：添加评论（前台）；

// 获取分类
router.get('/getCategory', (req, res) => {
    res.json(cate);
});

/**
 * 分页查询文章，默认每页数据5条，可更改
 * cateid -- 分类id，默认null，null表示不考虑分类
 * keywords -- 模糊查询的内容，即查询标题中包含有搜索关键字的文章，默认null，表示没有条件
 * state -- 文章的状态，默认为已发布
 * pageNum -- 每页显示几条数据，默认5
 * page -- 分页页码，默认1
 */
router.get('/getArticlesWithPage', (req, res) => {
    let cateid = req.query.cateid || null;
    let keywords = req.query.keywords || null;
    let state = req.query.state || '已发布';
    let page = req.query.page || 1;
    let pageNum = req.query.pageNum || 5;
    
    // 设置查询条件
    let condition = {state: state};
    if (cateid) {
        condition.cateid = Number.parseInt(cateid); // 这里是一个坑，必须是数字
    }
    // console.log(condition);
    if (keywords) {
        condition.title = {'like': keywords}
    }

    // 计算查询的起始位置
    let count = a(condition).count(); // 符合条件的总记录数
    let start = (page - 1) * pageNum + 1; // 查询起始位置
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
            item.catename = c({id: item.cateid}).select('name')[0];
            item.nickname = b({id: item.adminid}).select('nickname')[0];
        });
        result.code = 200;
        result.message = '请求数据成功';
        result.page = page;
        result.pageTotal = pageTotal;
        result.data = data;
    }

    res.json(result);
});

// 获取文章
/**
 * bad 焦点关注
 * good 焦点图
 * click 热门排行
 * id 最新发布
 * 
 */
router.get('/getArticles', (req, res) => {
    let flag = req.query.flag || 'click';
    if (flag == 'click' || flag == 'good' || flag == 'bad' || flag == 'id') {
        let num = req.query.num || 5;
        // 根据条件查询到符合条件的数据
        let data = art
        .sort((a, b) => {
            return b[flag] - a[flag];
        })
        .slice(0, num);
        // 遍历，为每篇文章添加分类名称和作者昵称
        data.forEach(item => {
            item.catename = c({id: item.cateid}).select('name')[0];
            item.nickname = b({id: item.adminid}).select('nickname')[0];
        });
        res.json({
            code: 200,
            data: data
            });
    } else {
        res.json({ code: 201, message: '请求参数错误' });
    }

});

/**
 * 根据分类id获取文章
 * cateid -- 分类id
 */
router.get('/getArticlesByCateId', (req, res) => {
    let cateid = req.query.cateid || null;
    if (cateid) {
        res.json(
            {
                code: 200,
                message: '请求数据成功',
                category: cate.find(item => {
                    return item.id == cateid
                }),
                data: art.filter(item => {
                    return item.cateid == cateid
                })
            }
        );
    } else {
        res.json({ code: 201, message: '请求参数错误' });
    }
});

/**
 * 根据文章id获取一篇文章
 * id -- 文章id
 */
router.get('/getArticleById', (req, res) => {
    let id = req.query.id || null;
    if (id) {
        let data = art.find(item => {
            return item.id == id;
        });
        res.json({
            code: 200,
            message: '请求数据成功',
            category: cate.find(item => {
                return item.id == data.cateid;
            }),
            data: data
        });
    } else {
        res.json({ code: 201, message: '请求参数错误' });
    }
});

/**
 * 上一篇下一篇
 * id -- 当前文章id
 */
router.get('/adjacent', (req, res) => {
    let id = req.query.id || null;
    if (id) {
        res.json({
            code: 200,
            message: '请求数据成功',
            data: {
                prev: art.sort((a, b) => {
                    return b.id - a.id;
                }).find(item => {
                    return item.id < id;
                }),
                next: art.sort((a, b) => {
                    return a.id - b.id;
                }).find(item => {
                    return item.id > id;
                })
            }
        });
    } else {
        res.json({ code: 201, message: '请求参数错误' });
    }
});

// 4. 导出路由对象
module.exports = router;
// 5. app.js 中，加载路由模块，并注册成中间件