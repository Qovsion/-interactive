 // 排行榜数据添加
 function paihangbang(){
    $.get('/getArticles', function (res) {
        var str = template('paihang', {
            arr: res.data
        })
        $('.content_list').eq(0).append(str);
    })
 }

// 焦点关注
function guanzhu(){
    $.get('/getArticles', { flag: 'bad' }, function (res) {
        // console.log(res);
        var str = template('guanzhu', {
            arr: res.data
        })
        $('.content_list').eq(2).append(str);
    })
}

 // ajax导航栏获取数据 添加到页面
 function daohang(){
    $.get('/getCategory', function (res) {
        console.log(res);
        var str = template('moban', {
            arr: res
        })
        $('ul.left_menu').append(str);
        $('ul.level_two').append(str);
    })
 }
 function zixun(){
        // 最新资讯数据
        $.get('/getArticles', { flag: 'id' }, function (res) {
            var str = template('zuixin', {
                abc: res.data
            })
            $('.left_con').append(str);
        }, 'json')
 }
 

