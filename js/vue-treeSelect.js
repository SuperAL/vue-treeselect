    (function(Vue, treeSelect) {
        console.log(treeSelect);
        // 初始化页面中的 tooltip
        $('[data-toggle="tooltip"]').tooltip();

        // 注册子组件 —— 添加成员弹出框中的单个可点击对象
        Vue.component('child', {
            // 声明 props
            props: ['item', 'childlength'],
            data: function() {
                return {
                    expanded: false, // 是否展开
                    selected: this.item.selected,  // 是否选中，用于样式处理
                    childSelected: this.item.selected ? this.childlength : 0, // 子元素选中个数
                }
            },
            // Vue 组件初始化完成后执行 ready 函数
            ready: function() {
                var self = this;
                // 针对无子元素的元素，也就是真正选中并显示的元素，如果数据中 selected 属性为 true，则触发选择函数，初始化已选择元素的页面样式
                if (self.item.selected && !self.item.hasOwnProperty('child')) {
                    self.selected = false;
                    // 触发选择函数，以此触发一系列方法，包括子元素全选时父元素也改为选中状态
                    self.addChosen(self.item);
                    // 因此存在子节点的元素 selected 属性无需为 true，为 false 即可，因为该属性只与样式挂钩，而样式可由子节点是否为全选来触发
                }
            },
            // 计算属性
            computed: {
                // 是否显示 √
                showCheck: function() {
                    var isChecked = this.selected && (this.childSelected == this.childlength);
                    return isChecked;
                }
            },
            // 监测数据变化
            watch: {
                'selected': function(val, oldVal) {
                    this.item.selected = this.selected;
                    if (val) {
                        this.childSelected = this.childlength;
                    }
                },
                'childSelected': function(val, oldVal) {
                    if (val == this.childlength) {
                        this.selected = true;
                    } else {
                        this.selected = false;
                    }
                }
            },
            // prop,data 里的数据可以用在模板内
            template: '#child-template',
            // 子组件可调用方法
            methods: {
                // 展开
                expand: function() {
                    this.expanded = this.expanded ? false : true;
                },
                // 添加选中项
                addChosen: function(item) {                    

                    // 切换选中状态 
                    this.selected = this.selected ? false : true;
                    // 如果当前状态为 选中
                    if (this.selected) {
                        // 父元素的子元素选中数 +1
                        this.$dispatch('addChildSelected', item);
                        
                        // 当前元素如无子元素
                        if (this.childlength == 0) {
                            // 加入到选中数组中
                            this.$emit('addToChosen');
                        } else {
                        // 当前元素存在子元素
                            // 当前元素的子元素全变为选中状态
                            this.$broadcast('selectedTrue');
                            // 继续将 加入到选中数组 的事件传播到子组件中
                            this.$broadcast('addToChosen');
                        }
                    } else {
                    // 如果当前状态为 取消选中
                        // 子元素选中数清零
                        this.childSelected = 0;
                        // 父元素的子元素选中数 -1
                        this.$dispatch('reduceChildSelected', item);
                        // 当前元素如无子元素
                        if (this.childlength == 0) {
                            // 从选中数组中删除当前元素（子组件删除父组件中选中数组的数据）
                            this.$emit('delFromChosen');
                        } else {
                        // 当前元素存在子元素
                            // 当前元素的子元素全变为未选中状态
                            this.$broadcast('selectedFalse');
                            // 继续将 从选中数组中删除当前元素（子组件删除父组件中选中数组的数据） 的事件传播到子组件中
                            this.$broadcast('delFromChosen');
                        }
                    }

                    // 重新初始化 tooltip 插件
                    $(".tooltip.fade.top.in").remove();
                    this.$nextTick(function() {
                        $('[data-toggle="tooltip"]').tooltip(); // => 'updated'
                    })
                }
            },
            events: {
                // 子元素选中数 -1
                reduceChildSelected: function(thisItem) {
                    if (this.item == thisItem) {
                        return true;
                    }
                    var old = (this.childSelected == this.childlength);
                    this.childSelected -= 1;
                    if (this.childSelected < 0) {
                        this.childSelected = 0
                    }
                    if (old && (this.childSelected !== this.childlength)) {
                        return true;
                    } else {
                        return false;
                    }
                },
                // 子元素选中数 +1
                addChildSelected: function(thisItem) {
                    if (this.item == thisItem) {
                        return true;
                    }
                    var old = this.childSelected !== this.childlength;
                    this.childSelected += 1;
                    if (old && (this.childSelected == this.childlength)) {
                        return true;
                    } else {
                        return false;
                    }
                },
                // 变为选中状态
                selectedTrue: function() {
                    this.selected = true;
                    return true;
                },
                // 变为未选中状态
                selectedFalse: function() {
                    this.selected = false;
                    this.childSelected = 0;
                    return true;
                },
                // 加入到选中数组
                addToChosen: function() {
                    // 如果当前元素无子元素
                    if (this.childlength == 0) {
                        var index = this.$root.chosen.indexOf(this.item)
                        // 并且还不存在于选中数组中
                        if (index == -1) {
                            // 加入到选中数组中
                            this.$root.chosen.push(this.item);

                            // 重新初始化 tooltip 插件
                            $(".tooltip.fade.top.in").remove();
                            this.$nextTick(function() {
                                $('[data-toggle="tooltip"]').tooltip(); // => 'updated'
                            })
                        }
                    } else {
                        return true;
                    }
                },
                // 从选中数组中删除当前元素（子组件删除父组件中选中数组的数据）
                delFromChosen: function() {
                    // 如果当前元素无子元素
                    if (this.childlength == 0) {
                        this.$root.chosen.$remove(this.item);
                        
                        // 重新初始化 tooltip 插件
                        $(".tooltip.fade.top.in").remove();
                        this.$nextTick(function() {
                            $('[data-toggle="tooltip"]').tooltip(); // => 'updated'
                        })
                    } else {
                        return true;
                    }

                },
                // 从选中数组中删除当前元素（操作父组件中选中数组的数据，并将数据同步到子组件中）
                removeItem: function(item) {
                    if (item == this.item) {
                        this.addChosen(this.item);
                    } else {
                        return true;
                    }
                }
            }
        })

        // 循环初始化多个 树型选择控件
        for( var key in treeSelect ){
            console.log(treeSelect[key]);
            // 初始化父组件
            treeSelect[key]['vm'] = new Vue({
                el: '#'+treeSelect[key]['id'],
                data: {
                    data: [],
                    originData: [],
                    originDataSet: false,
                    searchData: [],
                    chosen: [],
                    keyword: ""
                },
                ready: function() {
                    var self = this;
                    // 使用 ajax 获取数据
                    $.ajax({
                        url: treeSelect[key]['reqUrl'],
                        method: 'GET',
                        dataType: 'json',
                        success: function(data) {
                            self.data = data.data;
                            console.log('Hooray!');
                        },
                        error: function(error) {
                            console.log(JSON.stringify(error));
                        }
                    });
                },
                watch: {
                    // 监测搜索栏的输入
                    "keyword": function(val, oldVal) {
                        if (!this.originDataSet) {
                            // 将当前数据存放起来，用于恢复搜索后的数据显示
                            this.originData = this.data;
                            this.originDataSet = true;
                        }
                        // 清空搜索数据
                        this.searchData = [];
                        // 搜索栏为空时
                        if (val == "") {
                            // 恢复搜索前的数据
                            this.data = this.originData;
                        // 搜索栏新增关键词时
                        } else if (val.length >= oldVal.length) {
                            // 在当前搜索数据中继续进行搜索
                            this.searchFor(this.data, val);
                            this.data = this.searchData;
                        // 搜索栏减少关键词时
                        } else {
                            // 在原始数据中进行搜索
                            this.searchFor(this.originData, val);
                            this.data = this.searchData;
                        }
                    },
                    "chosen": function(val, oldVal) {
                        var chosen = this.getChosenData();
                        treeSelect[key]['callback'](chosen);
                    }
                },
                methods: {
                    // 搜索
                    searchFor: function(theObject, keyword) {
                        keyword = keyword.toLowerCase();
                        var result = null;
                        if (theObject instanceof Array) {
                            for (var i = 0; i < theObject.length; i++) {
                                result = this.searchFor(theObject[i], keyword);
                                if (result) {
                                    break;
                                }
                            }
                        } else {
                            for (var prop in theObject) {
                                if (prop == 'name' || prop == 'pinyin' || prop == 'py') {
                                    if (theObject[prop].toLowerCase().indexOf(keyword) !== -1) {
                                        var index = this.searchData.indexOf(theObject);
                                        if (index == -1) {
                                            this.searchData.push(theObject);
                                        }

                                    }
                                }
                                if (theObject[prop] instanceof Object || theObject[prop] instanceof Array) {
                                    result = this.searchFor(theObject[prop], keyword);
                                    if (result) {
                                        break;
                                    }
                                }
                            }
                        }
                        return result;
                    },
                    // 删除选中项
                    removeItem: function(item) {
                        $(".tooltip.fade.top.in").remove();
                        this.$broadcast('removeItem', item);
                    },
                    // 获取选中数据
                    getChosenData: function() {
                        var chosenData = JSON.parse(JSON.stringify(this.$data.chosen));
                        return chosenData;
                    }
                }
            })

            var add = '#'+treeSelect[key]['id']+' .receiver-member-add';
            console.log(add);
            $(add).on('click', function(e){
                var popover = $(e.target).parents('.container').find('.popover');
                console.log('#'+treeSelect[key]['id']+' .popover');
                var height = $(this).height();
                var width = $(popover).width() / 2 - $(this).height() / 2;
                var offsetLeft = $(this).offset().left - $(this).closest('.wrap').offset().left;
                var offsetTop = $(this).offset().top - $(this).closest('.wrap').offset().top;
                $(popover).css({
                    "top": offsetTop + height,
                    "left": (offsetLeft - width) > 0 ? (offsetLeft - width) : 0,
                    "display": "block"
                }); 
                $(".filter-input").trigger('focus');
                e.stopPropagation();
            })
        }

        $(document).on('click', '.popover , .receiver-member', function(e) {
            e.stopPropagation();
        });
        $(document).on('click', function() {
            $('.popover').css({
                "display": "none"
            });
        })

    })(Vue, treeSelect)
