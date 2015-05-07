# Framework7 MVC 插件

实现如下功能：

* 超链接返回一个json数据，并且在里面包含view和js的路径，然后插件会自动加载view和js进行解析后显示
* 支持预加载一个临时框架的同时载入页面，可以达到优化使用体验

需要requireJS的支持

## 使用方法

将本插件文件放在 lib/f7mvc.js 目录（也可以自定义其它目录）

app.js 文件如下写：

```js
define(['lib/f7mvc'], function() {
    var $$ = Dom7;

    var myApp = new Framework7({
        f7mvc: {
            viewLocalCache: true,
            controllerPath: '/assets/controllers/',
            viewPath: '/assets/views/'
        }
    });
    
    
    // loading功能
    (function() {
        var s;
        $$(document).on('ajaxStart', function (e) {
            s = setTimeout(function() {
                myApp.showIndicator();
            }, 200);
        });
        $$(document).on('ajaxComplete', function () {
            if (s) {
                clearTimeout(s);
                s = null;
            }
            myApp.hideIndicator();
        });
    })();
    
    return myApp;
);
```

页面中超链接代码例子

```html
<a href="test.json">测试</a>
<a href="test.json" data-pre-tpl="testTemplate">测试带预加载模板</a>



<!-- 下面是模板，可放在</body>前 -->
<script type="text/template7" id="testTemplate">
    <div class="navbar">
        <div class="navbar-inner bg-white">
            <div class="left"><a href="#" class="back link"> <i class="icon icon-back"></i></a></div>
            <div class="center sliding"></div>
            <div class="right">
                <a href="#" class="link icon-only open-panel"> <i class="icon icon-bars"></i></a>
            </div>
        </div>
    </div>

    <div class="page">
    loading...
    </div>
</script>
```


test.json 文件输出内容

```json
{
    "test":"abc",
    "view_url":"test.tpl",
    "controller_url":"test.js"
}
```

test.tpl 可以是一个Template7的HTML代码。test.js代码如下：

```js
define(function() {
    console.log('test.controller.js loaded');

    return function (page, data, app) {
        console.log('test controller run.');
        console.log('server data', data);
        console.log(app);
    }
});
```



参数

key                 | 默认值                  | 说明
--------------------|------------------------|-----------------------
viewLocalCache      | false                  | 是否开启本地视图缓存功能
precompileTemplates | true                   | 自动解析模板（Template7）
dataControllerUrlKey | controller_url        | 数据中控制器的key名称
dataViewUrlKey       | view_url              | 数据中视图的key名称
dataViewContentKey   | view                  | 数据中视图HTML内容key
dataTemplateIdKey    | template_id           | 数据中模板ID的key
dataIgnoreViewCacheKey | cache_ignore        | 数据中定义忽略缓存的key
viewCachePrefix        | f7mvc_view_         | 视图本地缓存前缀
controllerPath         | /assets/controllers/   | 控制器URL路径
viewPath               | /assets/views/         | 视图URL路径
errorMsgView           | 页面执行错误，请联系管理员  | 页面执行错误信息
errorMsgLoadView       | 加载视图失败，请重试       | 页面视图加载失败信息
errorMsgLoadJs         | 加载JS控制器错误          | JS控制器加载错误的提示
errorMsgTemplateId     | 指定的模板ID不存在，请联系管理员  | 模板不存在的提示



