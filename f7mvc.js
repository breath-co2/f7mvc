define(function() {

    Framework7.prototype.plugins.f7mvc = function (app, p_params) {
        // 设置成false则禁用插件
        if (false === p_params)return;

        var params = {
            viewLocalCache: false,
            precompileTemplates: true,
            dataControllerUrlKey: 'controller_url',
            dataViewUrlKey: 'view_url',
            dataViewContentKey: 'view',
            dataTemplateIdKey: 'template_id',
            dataIgnoreViewCacheKey: 'cache_ignore',
            viewCachePrefix: 'f7mvc_view_',
            controllerPath: '/assets/controllers/',
            viewPath: '/assets/views/',
            errorMsgView: '页面执行错误，请联系管理员',
            errorMsgLoadView: '加载视图失败，请重试',
            errorMsgLoadJs: '加载JS控制器错误',
            errorMsgTemplateId: '指定的模板ID不存在，请联系管理员'
        };

        for (var param in p_params) {
            params[param] = p_params[param];
        }

        var pageInitCallback = {};
        var currentData = {};
        var $$ = Dom7;

        var extContent = false;
        var ext = function(content) {
            app.router._load(app.getCurrentView(), {
                content: content,
                reload: true
            });
        };

        $$('a[data-pre-tpl]').on('click', function(e) {
            var templateId = $$(this).data('pre-tpl');
            var self = this;
            if (Template7.templates[templateId])
            {
                e.stopPropagation();
                e.preventDefault();

                var myView = app.getCurrentView();

                myView.router.load({
                    content : Template7.templates[templateId]($$(self).dataset())
                });


                var url = $$(self).attr('href');
                $$.ajax({
                    method: 'get',
                    url: url,
                    success: function (rs, status, xhr) {
                        process(myView, rs, url, function(content) {
                            if (extContent)
                            {
                                ext(content);
                            }
                            else
                            {
                                extContent = content;
                            }
                        });
                    },
                    error: function (xhr) {
                        app.alert(params.errorMsgLoadView, function () {
                            mainView.router.back();
                        });
                        console.error(xhr);

                        get_count++;
                        run();
                    }
                });
            }
            else if (self._temp_pre_loading)
            {
                self._temp_pre_loading = null;
                delete self._temp_pre_loading;
            }
        });

        var process = function (view, content, url, next) {
            if (typeof content === 'string' && (content.substr(0, 1) === '{' || content.substr(0, 1) === '[')) {
                var data;
                try {
                    data = JSON.parse(content);
                } catch (e) {}

                if (!data)
                {
                    return content;
                }

                currentData[url] = data;

                var get_count = 0;
                var controllerUrl = data[params.dataControllerUrlKey];          //控制器URL
                var viewUrl = data[params.dataViewUrlKey];                      //视图URL
                var viewContent = data[params.dataViewContentKey];              //视图内容
                var viewIgnoreCache = data[params.dataIgnoreViewCacheKey];      //是否忽略缓存
                var templateId = data[params.dataTemplateIdKey];                //模板ID

                // 当资源都加载完毕会除非next方法
                var run = function () {
                    var v7page = app.params.template7Pages;

                    if (controllerUrl && viewUrl) {
                        if (get_count === 2) {
                            app.params.template7Pages = false;      // 当设置 template7Page = true 时会有bug，这样可以解决这个问题
                            next(content);
                            app.params.template7Page = v7page;
                        }
                    }
                    else
                    {
                        app.params.template7Pages = false;
                        next(content);
                        app.params.template7Page = v7page;
                    }
                };

                if (templateId)
                {
                    if (!Template7.templates[templateId])
                    {
                        app.alert(params.errorMsgTemplateId);
                        console.error('can not found template id:', templateId);
                        return null;
                    }

                    // 调用模板处理
                    content = Template7.templates[templateId](data);

                    if (viewUrl) {
                        data[dataViewUrlKey] = null;
                        delete data[dataViewUrlKey];
                    }

                    if (!controllerUrl) {
                        // 如果也没有JS控制器，则直接返回处理后的内容
                        next(content);
                        return null;
                    }
                }
                else if (viewContent) {
                    if (viewUrl) {
                        // viewContent 和 viewUrl 同时存在则只取 viewContent 并且 把 viewUrl 删除，避免脚本异常
                        data[dataViewUrlKey] = null;
                        delete data[dataViewUrlKey];
                    }

                    content = viewContent;
                    var t7 = Template7.compile(viewContent);
                    content = t7(data);

                    if (!controllerUrl) {
                        // 如果也没有JS控制器，则直接返回处理后的内容

                        next(content);
                        return null;
                    }
                }
                else if (viewUrl) {
                    var viewCache = false;
                    if (params.viewLocalCache && !viewIgnoreCache)viewCache = localStorage.getItem(params.viewCachePrefix + viewUrl);
                    if (!viewCache) {
                        $$.ajax({
                            method: 'get',
                            url: params.viewPath + viewUrl,
                            success: function (rs, status, xhr) {
                                try {
                                    if (params.viewLocalCache)localStorage.setItem(params.viewCachePrefix + viewUrl, rs);

                                    if (params.precompileTemplates) {
                                        var template = Template7.compile(rs);
                                        content = template(data);
                                    }
                                    else
                                    {
                                        content = rs;
                                    }

                                    get_count++;
                                    run();
                                }
                                catch (e) {
                                    app.alert(params.errorMsgView);
                                    console.error(e);
                                }
                            },
                            error: function (xhr) {
                                app.alert(params.errorMsgLoadView, function () {
                                    mainView.router.back();
                                });
                                console.error(xhr);

                                get_count++;
                                run();
                            }
                        });
                    }
                    else
                    {
                        if (params.precompileTemplates) {
                            var template = Template7.compile(viewCache);
                            content = template(data);
                        }
                        else
                        {
                            content = viewCache;
                        }
                        viewCache = null;
                        get_count++;
                        run();
                    }
                }

                if (controllerUrl) {
                    require([params.controllerPath + controllerUrl], function (ctl) {
                        if (typeof ctl === 'function') {
                            pageInitCallback[url] = ctl;
                        }
                        get_count++;
                        run();
                    }, function (err) {
                        var failedId = err.requireModules && err.requireModules[0];
                        requirejs.undef(failedId);

                        app.alert(params.errorMsgLoadJs);
                        console.error(err);

                        get_count++;
                        run();
                    });
                }
            }
            else {
                return content;
            }
        };


        return {
            hooks: {
                pageInit: function(page) {
                    if (pageInitCallback[page.url]) {
                        pageInitCallback[page.url](page, currentData[page.url], app);

                        // 释放内存
                        currentData[page.url] = null;
                        delete currentData[page.url];
                    }
                },
                pageBeforeAnimation: function(page) {
                    extContent = false;
                },
                pageAfterAnimation: function(page) {
                    if (extContent)
                    {
                        ext(extContent);
                    }
                    else
                    {
                        extContent = true;
                    }
                },
                routerPreprocess: process
            }
        };
    };
});