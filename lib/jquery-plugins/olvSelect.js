/**
 * @fileName:      select
 * @Author:        Oliver
 * @prefix:        olv
 * @createTime:    2015-08-27 13:35:27
 * @Description:   自定义下拉插件, olvSelect to $.fn
 * @updateTime:    2015-09-06 10:59:27
 * @version:       1.1.0
 */
/*
如何使用: 

	** 确定选择的元素是select标签

	$('select').olvSelect(); //默认, 没有 配置参数

	$('select').olvSelect({ // 可接受的配置, popdir, maxSelected 未做开发
		width:          '',  // 自定义宽度
		height:         '', // 自定义高度
		customClass:    '', // 自定义 class
		placeholder:    '', // 提示文字
		popdir:         'down', // left right up 弹出方向
		maxSelected:    0,
		zIndex:         9999,
		before: noop, // 初始化完成的回调
		open:   noop, // open 回调
		close:  noop, // close 回调
		change: noop  // change 回调
	});
	
	// 第一个参数可以是如下字符串
var arr = [
  {
	group: '组名称',
	option: [
	  {
		val: '组新增1',
		txt: '组新增1'
	  },
	  {
		val: '组新增2',
		txt: '组新增2'
	  }
	]
  },
  {
	val: '新增1',
	txt: '新增1'
  }
];
	
*/
;
(function ( factory ) {
	if ( typeof define === "function" && define.amd ) {
		define([ "jquery" ], factory);
	} else if ( typeof define === "function" && define.cmd ) {
		// seajs
		define(function ( require ) {
			// var $ = require('jquery');
			return factory( require('jquery') );
		});
	} else {
		module.exports = factory(jQuery);
	}
}(function ( $ ) {
	/*
	 select prop
	
	 'olvSelect-wrap': obj.wrap,
	 'olvSelect-optionBox': obj.optionBox,
	 'olvSelect-ops': ops,
	 'olvSelect-old': __this.val(),
	 'olvSelect-wrap': null,
	 'olvSelect-data': null
	
	 li prop -> olvSelct-value
	
	 val: val,
	 txt: txt,
	 selected: selected,
	 status: status
	
	 */
	 
	function noop () {
	};
	var doc = $(document), win = $(window), olvSelectGol = [];
	var pluginsName = 'olvselect', tName = 'select';
	var classMap = [
		'.olvSelect',
		'.olvSelect-wrap',
		'.olvSelect-placeholder',
		'li',
	];
	var evtNameMap = [
		'init',
		'open',
		'close',
		'destroy',
		'restart',
		'change'
	]
	var eventMap = {
		'init':      olvSelectInit
		, 'open':    olvSelectOpen
		, 'close':   olvSelectClose
		, 'destroy': olvSelectDestroy
		, 'restart': olvSelectRestart
		, 'change':  olvSelectChange
	}
	var propMap = [
		'raw', 'wrap', 'optionBox', 'ops', 'old', 'status', 'oldNode', 'destroyFn'
	]
	var golStrPlaceholder = '未选中任何选项'
	var evtReg = new RegExp('(' + evtNameMap.join('|') + ')');
	var defaultOps = {
		width:          '',  // 自定义宽度
		height:         '', // 自定义高度
		customClass:    '', // 自定义 class
		placeholder:    '', // 提示文字
		popdir:         '', // left right up 弹出方向, 强制方向
		maxSelected:    0,
		zIndex:         9999,
		before: noop, // 初始化完成的回调
		open:   noop, // open 回调
		close:  noop, // close 回调
		change: noop  // change 回调
	}
	var evtHand = {
		click: function ( o ) {
			return function ( e ) {
				var target = e.target
				var $target = $(e.target);
				var optionBox = createOptionBox()[0]
				if( !$target.hasClass('olvSelect') && 
					!$target.hasClass('olvSelect-wrap') && 
					!$target.hasClass('olvSelect-placeholder') && !$.contains(optionBox, target) ) {
					o.trigger(eventStrChange(evtNameMap[ 2 ]));
				}					
			}
		},
		scroll: function ( o ) {
			return function () {
				o.each(function () {
					setSize( $(this) )
				});
				o.trigger(eventStrChange(evtNameMap[ 2 ]));
			}
		},
		resize: function ( o ) {
			return function () {
				o.each(function () {
					setSize( $(this) )
				});				
			}
		}
	}
	function eventStrChange ( str ) {
		var evt = pluginsName + '.' + str;
		return evt
	}
	function propNameHandle ( str ) {
		var pre = pluginsName.substring(0,3);
		var last = pluginsName.substring(3);
		var name = pre + last.charAt(0).toUpperCase() + last.substring(1);

		return str ? name +'-'+ str : name;
	}
	function rfirstDel ( str ) {
		return str.substring(1);
	}
	// function createSelectMask () {
	// 	var olvSelectMask = $('#olvSelectMask');
	// 	if ( $('#olvSelectMask').length ) {
	// 		return olvSelectMask
	// 	}
	// 	var div = $('<div id="olvSelectMask" class="olvSelectMask"/>');
	// 	var oldDiv = $('#olvSelectMask');
	// 	if ( oldDiv[ 0 ] ) return oldDiv;
	// 	$('body').append(div);
	// 	return div;
	// }
	
	function getItem ( target ) {
		var item, parent;
		if ( target.length === 0 ) return;
		if ( target.hasClass( propNameHandle() ) ||
			target.hasClass( propNameHandle('wrap') ) ) {
			return target;
		}
		if ( target.hasClass( propNameHandle('placeholder') ) ) {
			return target.parent();
		}
		if ( target.is( classMap[ 3 ] ) ) {
			item = target;
		} else {
			parent = target.parent();
			while ( !parent.is( classMap[ 3 ] ) ) {
				parent = parent.parent();
			}
			item = parent
		}
		return item;
	}
	/**
	 * 创建根节点, 移动select到节点, 插入首个节点作为默认提示内容
	 * 如果 placeholder 有内容则显示 placeholder的文本
	 */
	function createBox ( select ) {
		var ops = select.prop( propNameHandle('ops') );
		var obj = {}
		var wrap = $('<div/>'),
		    placeholder = wrap.clone(),
		    parent = select.parent(),
		    wrapIng = false;
		if ( parent.hasClass( propNameHandle() ) || parent.hasClass( propNameHandle('wrap') ) ) {
			wrap = parent;
			placeholder = parent.find( '.'+propNameHandle('placeholder') );
			wrapIng = true;
		}
		if ( !wrapIng ) {
			wrap.addClass( propNameHandle() + ' ' + propNameHandle('wrap') + ' ' + ops.customClass)
				
			select.before(wrap).hide();
			wrap.append(select)
				.append(placeholder.addClass( propNameHandle('placeholder') ));
		}
		return wrap;
	}
	/**
	 * 创建 option box
	 */
	function createOptionBox () {
		var selectOptionBox = $('#olvSelect-option-box');
		if( !selectOptionBox.length ) {
			selectOptionBox = $('<div id="olvSelect-option-box" class="olvSelect-option-box"/>');
			$('body').append( selectOptionBox );
		}
		selectOptionBox.css({
			position: 'static'
		});
		return selectOptionBox;
	}
	/**
	 * 创建列表
	 * @param  jq 对象 select 元素
	 * @param  update 是否更新
	 */
	function createItem ( select, update ) {
		var selectOptionBox = createOptionBox();
		var obj = getProp( select );

		var placeholder = obj.wrap.find( '.'+propNameHandle('placeholder') )
			// ,
		    // optionBox = obj.wrap.find('.option-box');
		if ( !obj.wrap ) return;
		var options = select.find('option, optgroup');
		var multiple = !!select[ 0 ].multiple;
		var ul = obj.optionBox && obj.optionBox.length ? obj.optionBox : $('<ul class="option-box"/>').hide(),
		// var ul = optionBox && optionBox.length ? optionBox : $('<ul class="option-box"/>').hide(),
		    li = $('<li/>'),
		    iconBox = $('<span/>', {'class': 'item-icon'}).appendTo(li);

		var tmpObj = {};
		// 默认提示文字
		if ( obj.ops.placeholder ) {
			placeholder.text(obj.ops.placeholder)
		} else {
			select.find('option').each(function ( i, v ) {
				if ( v.selected ) {
					placeholder.text(v.text);
					return true;
				}
			});
		}
		if( update || obj.optionBox ) {
			ul.children().remove();
		}
		// if ( update || !obj.optionBox || obj.optionBox.length ) {
		// 	ul.children().remove();
		// }
		options.each(function () {
			var _this = $(this);
			var nLi = li.clone(true);
			var parent = _this.parent();
			var txt = '', val = '', sClass = '', selected = false, 
				ptStr, 
				status = '';
			if ( _this.is('option') ) {
				// 判断父级是否optgroup, 如果optgroup label为空的话则不再给 option 增加缩进
				// 如果 optgroup label 有内容, 会给 optgroup 子 option 增加 缩进样式
				
					ptStr = parent.prop('label');
					txt = this.text;
					val = this.value;
					selected = !!this.selected;
					if ( this.disabled ) {
						sClass = 'disabled';
						val = null;
						status = 'disabled';
					}
					if( parent.is('optgroup') && ptStr ) {
						sClass += ' item-optgroup-sub'
					}

			} else if ( _this.is('optgroup') ) {
				txt = _this.prop('label');
				sClass = 'item-optgroup';
			}
			sClass += ( selected ? ' selected' : '' );
			if ( !!txt ) {
				nLi.prop({
					'class':      sClass,
					'olvSelect-value': {
						val:      val,
						txt:      txt,
						selected: selected,
						status:   status
					}
				}).append(txt);
				nLi.appendTo(ul)
			}
		});
		ul.css({
			position: 'fixed'
		});
		tmpObj[ propNameHandle('optionBox') ] = ul;
		if ( !obj.optionBox || !obj.optionBox.length ) {
			// obj.wrap.append(ul);
			selectOptionBox.append(ul);
		}
		select.prop(tmpObj);
		setSize(select);
	}
	function setSize ( select ) {
		var obj = getProp( select ),
			optionBox = obj.optionBox,
			wrapWidth = obj.wrap.outerWidth(),
			wrapHeight = obj.wrap.outerHeight(),
			parseWidth = parseInt( obj.ops.width, 10 ),
			optionBoxHeight = optionBox.outerHeight();


		if( parseWidth && parseWidth <=  wrapWidth ) {
			optionBox.css({
				width:  obj.ops.width
			})
		} else {
			optionBox.css({
				width:  wrapWidth
			})
		}

		if( obj.ops.height ) {
			option.css({
				height: obj.ops.height
			});		
		} else {
			optionBox.css({
				height: optionBoxHeight
			});
		}	
	}
	/**
	 * 设置位置
	 * @param {[type]} obj [description]
	 */
	function setPos ( obj ) {
		var ops = obj.ops;
		// 列表, 列表盒子高度
		var optionBox = obj.optionBox,
			optionBoxHeight = optionBox.outerHeight();

		var scrollTop = doc.scrollTop(),
			scrollLeft = doc.scrollLeft(),
			pos = obj.wrap.offset(),
			wrapHeight = obj.wrap.outerHeight();

		var optionBoxBorT = parseInt(optionBox.css('border-top-width')), 
			optionBoxBorB = parseInt(optionBox.css('border-bottom-width'));
			borderTB = optionBoxBorT + optionBoxBorB
		var winW = win.width(),
			winH = win.height();

		var minT = Math.min( pos.top, scrollTop ),
			maxT = Math.max( pos.top, scrollTop )

		var minL = Math.min( pos.left, scrollLeft ),
			maxL = Math.max( pos.left, scrollLeft );

		var top = maxT - minT + borderTB + wrapHeight;
		var left = maxL - minL

		//计算顶部 底部尺寸
		var disT = pos.top - scrollTop, 
			disB = winH- disT - wrapHeight


		if ( disB <= disT ) {
			top = top - optionBoxHeight - wrapHeight - borderTB*2;
		}
		
		if( ops.popdir && ops.popdir == 'up' || ops.popdir == 'down' ) {
			if( ops.popdir == 'up' ) {
				top = (top - optionBoxHeight - wrapHeight)  - borderTB * 2
			} 
			// else {
			// 	top = maxT - minT + borderTB;
			// }
		}
		if( top <= 0 ) {
			top = 0;
		}
		optionBox.css({
			top: top,
			left: left
		});
	}
	function getProp ( select, attr ) {
		if( attr ) {
			return select.prop( propNameHandle( attr ) )
		}
		var o = {};
		$.each(propMap, function (i, v) {
			o[ v ] = select.prop( propNameHandle( v ) )
		});

		return o;
	}
	function setProp ( select, attr, val ) {
		if( attr && typeof attr === 'string' && val !== undefined ) {
			select.prop( propNameHandle( attr ), val);
			return select;
		}
		var o = {};
		$.each(attr, function (i, v) {
			o[ propNameHandle( i ) ] = v;
		});
		select.prop(o);

		return select;
	}
	function getVal ( $obj, bol ) {
		var o = $obj.prop( propNameHandle( 'value' ) )
		return !bol ? o.val : o;
	}
	function setVal ( $obj, oData ) {
		var o = {};
		o[ propNameHandle( 'value' ) ] = oData;
		$obj.prop( o );
	}
	function offEvent ( select, event ) {
		var obj = getProp(select);
		var destroyFn = obj.destroyFn
		obj.wrap.off('click');
		$.each(evtNameMap, function ( i, v ) {
			select.off(eventStrChange(v));
		});
		doc.off('click', destroyFn.click).off('scroll', destroyFn.scroll)
		win.off('resize', destroyFn.resize)
	}
	function setSelectData ( select, bol, val ) {
		select.find('option').each(function ( i, v ) {
			if ( v.value == val ) {
				v.selected = bol
			}
		});
	}
	/**
	 * 设置节点 data.value.selected
	 * @param $obj jq对象, 当前操作的列表
	 * @param select jq对象, 选择的 $('select')
	 */
	function setSelected ( select, $obj ) {
		var obj = getProp(select);
		var o = getVal($obj, 1),
		    bol = false,
		    val = o.val,
		    optionBox = obj.optionBox;
		var multiple = !!select[ 0 ].multiple;
		if ( multiple ) {
			if ( !o.selected ) {
				bol = true
			}
		} else {
			optionBox.find(classMap[ 3 ]).each(function () {
				var __this = $(this);
				var oData = getVal(__this, 1);
				oData = $.extend({}, oData, {selected: false});
				setVal(__this, oData)
			});
		}
		o = $.extend({}, o, {selected: multiple ? bol : true});
		setVal($obj, o);
		select.trigger( eventStrChange(evtNameMap[ 5 ]) );
	}
	function setOpen ( target ) {
		var obj = getProp( target );
		setClose()
		obj.raw.each(function (i, v) {
			var vThis = $(v);
			var pop = getProp(vThis, 'status');
			if( pop == 'open' ) {
				if( v !== target[0] ) {
					vThis.trigger( eventStrChange('close') );
				}
			}
		});
		
		setProp( target, 'status', 'open');
		obj.optionBox.show();
		setPos( obj );
		obj.wrap.addClass('select-open select-active');
	}
	
	function setClose ( target ) {

		olvSelectGol.each(function () {
			var _this = $(this),
				obj = getProp( _this );
			if( obj.status !== 'close' ) {
				obj.optionBox.hide();
				obj.wrap.removeClass('select-open select-active');
				setProp( _this, 'status', 'close');				
			}
		});
	}
	function add ( select, option ) {
		var optionNode = select.find('option')
		var tmpArr = [], 
			regStr,
			bool;
		var frag = document.createDocumentFragment(); // 创建文档碎片   

		optionNode.each(function ( idx, node ) {
			tmpArr.push(node.value);
		});

		regStr = new RegExp( '^(' + tmpArr.join('|') + ')$', 'i' );
		var handle = function ( arr, target ) {
			var newOption = document.createElement('option');
			var g = document.createElement('optgroup');
			var i = 0, len = arr.length, nOption;
			for( ; i < len; i++ ){
				if( arr[i].group ){
					g.label = arr[i].group;
					handle(arr[i].option, g);
					continue;
				}
				if( !$.isPlainObject( arr[ i ] ) || regStr.test( arr[ i ].val ) ){ 
					bool = true;
					continue;
				}
				nOption = newOption.cloneNode(false);
				nOption.innerHTML = arr[i].txt;
				nOption.value = arr[i].val
				if(target){
					target.appendChild(nOption)
					frag.appendChild(target)
				} else {
					frag.appendChild(nOption)
				}
			}
			return frag;
		}
		if ( !$.isArray( option ) ) return;
		frag = handle( option )

		if( !frag ||!frag.children || !frag.children.length  ) return;

		if ( bool ) {
			throw new Error('不合法数据');
		};

		select.append( frag );
		createItem(select, true);
		select.trigger(eventStrChange( evtNameMap[ 5 ] ));
	}
	function remove () {
	}
	/**
	 * 初始
	 */
	function olvSelectInit () {
		var _this = $(this)
		var obj = getProp( _this );


		var multiple = !!this.multiple,
		    disabled = this.disabled,
		    optionObj,
		    destroy = {
				click: evtHand.click(_this),
				scroll: evtHand.scroll(_this),
				resize: evtHand.resize(_this)
			};

		if( obj.status ){
			return
			// throw new Error('初始化已经完成, 不需要再次执行初始程序');
		}

		// tmpObj[ propNameHandle('destroyFn') ] = destroy
		obj.ops.before.call( _this );
		obj.wrap.on('click', function ( e ) {
			var __this = $(this);
			var target = getItem($(e.target));
			var obj = getProp( _this );
			// 判断是否 select 元素
			if ( $(e.target)[ 0 ] == _this[ 0 ] ||
				$(e.target).is('option') ||
				$(e.target).is('select') || $(e.target).is('optgroup') ) return;

			if ( target ) {
				// 判断是否点击在包装的根节点, 或者 placeholder 节点上, 如果为真的话则显示下啦节点
				if ( target.hasClass( propNameHandle() ) ||
					target.hasClass( propNameHandle('wrap') ) ) {
					if( obj.status === 'open' ) {
						_this.trigger(eventStrChange( 'close' ));
					} else if( obj.status === 'init' || obj.status === 'close' ) {
						_this.trigger(eventStrChange( 'open' ));
					}
				}
			}
		});
		obj.optionBox.on('click', function ( e ) {
			var __this = $(this);
			var target = getItem($(e.target));
			var obj = getProp( _this );
			// 判断是否 select 元素
			if ( $(e.target)[ 0 ] == _this[ 0 ] ||
				$(e.target).is('option') ||
				$(e.target).is('select') || $(e.target).is('optgroup') ) return;

			if ( target ) {
				// 判断是否点击在列表上
				if ( target.is('li') && !target.hasClass('item-optgroup') ) {
					optionObj = getVal(target, !0);
					if ( optionObj.status === 'disabled' ) return;
					setSelected(_this, target);
				}
				
			}
		});
		setProp(_this, 'status', 'init');
		setProp(_this, 'destroyFn', destroy);
		doc
			.on('click', destroy.click)
			.on('scroll', destroy.scroll);
		win.on('resize', destroy.resize);
	}
	/**
	 * open
	 */
	function olvSelectOpen () {
		if ( this.disabled ) return;
		var _this = $(this) 
		var obj = getProp( _this );
		if( obj.status === 'open' ) return;
		setOpen( _this );
		obj.ops.open.call( _this )
	}
	/**
	 * close
	 */
	function olvSelectClose () {
		var _this = $(this);
		var obj = getProp( _this );
		if( obj.status !== 'open' ) return;
		setClose( _this );
		obj.ops.close.call( _this )
	}
	/**
	 * destroy
	 */
	function olvSelectDestroy () {
		var _this = $(this);
		var obj = getProp( _this );
		var placeholder = obj.wrap.find( '.'+propNameHandle('placeholder') );
		var name = propNameHandle();

		offEvent( _this );
		obj.optionBox.remove();
		placeholder.remove();
		

		$.each(propMap, function (i, v) {
			_this.removeProp( propNameHandle(v) )
		});

		_this.unwrap().show();
	}
	/**
	 * restart
	 */
	function olvSelectRestart () {
		var _this = $(this),
			obj = getProp( _this ),
			multiple = !!_this[ 0 ].multiple,
			optionNode = _this.find('option, optgroup'),
			option,
			frag = document.createDocumentFragment();

		obj.optionBox.hide();
		obj.wrap.removeClass('select-open select-active');
		offEvent( _this );
		optionNode.remove();

		$.each(obj.oldNode, function (i, v) {
			var nNode = v.cloneNode(true);
			frag.appendChild(nNode);
		});

		_this.append(frag);

		option = _this.find('option');

		if( $.isArray( obj.old ) ) {
			$.each(obj.old, function (i, v) {
				option.each(function (idx, node) {
					if( v === node.value ) {
						node.selected = true;
					} else {
						node.selected = false;
					}
				});
			})
		}
		setProp(_this, 'status', '')
		_this.olvSelect( obj.ops )
	}

	/**
	 * updata
	 */
	function olvSelectChange () {
		var _this = $(this);
		var obj = getProp(_this),
		    item = obj.optionBox.find(classMap[ 3 ]).not('.item-optgroup'),
		    multiple = !!_this[ 0 ].multiple,
		    placeholder = obj.wrap.find( '.'+propNameHandle('placeholder') ),
		    val = '',
		    text = '',
		    bool = false,
		    prop,
		    tmpArr = [];

		item.removeClass('selected');
		if ( multiple ) {
			item.each(function ( i, v ) {
				var _t = $(v)
				prop = getVal(_t, 1);
				if ( prop.selected ) {
					_t.addClass('selected');
				}
				if ( prop.val !== null && prop.selected && prop.status !== 'disabled' ) {
					setSelectData(_this, true, prop.val);
					val += prop.val + ',';
					text += prop.txt + ',';
				} else {
					setSelectData(_this, false, prop.val);
				}
				
			});
		} else {
			item.each(function ( i, v ) {
				var _t = $(v)
				prop = getVal(_t, 1);
				if ( prop.selected  ) {
					_t.addClass('selected');
				}
				if ( prop.selected &&  _this.val() == prop.val ) {
					bool = true;
					setClose( _this );
					return false;
				}
				
				if ( prop.val !== null &&  prop.selected && prop.status !== 'disabled' ) {
					setSelectData(_this, true, prop.val);
					_this.trigger(eventStrChange(evtNameMap[ 2 ]));
					val = prop.val;
					text = prop.txt;
					return false;
				}
			});
		}
		if(!text) text = golStrPlaceholder;
		if( !bool ) {
			placeholder.html(text.replace(/\,$/, ''));
			obj.ops.change.call( _this );			
		}
	}
	
	$.extend($.fn, {
		olvSelect: function ( ops, str ) {
			if( olvSelectGol instanceof jQuery ) {
				olvSelectGol = olvSelectGol.add(this);
			} else {
				olvSelectGol = this;
			}
			
			var __this = this, 
				oldOps = ops, 
				ops = typeof ops === 'string' ? {} : ops, 
				newOptionNode;
				
			var selectOptionBox = createOptionBox();
			if ( typeof oldOps === 'string' && __this.prop( propNameHandle('wrap') ) &&
				( evtReg.test(oldOps) ) ) {
				__this.trigger(eventStrChange(oldOps));
				return __this;
			}
			if( typeof oldOps === 'string'  && __this.prop( propNameHandle('wrap')  ) && oldOps === 'add' && str ) {
				add( __this, str );
				return __this;
			}
			// if( typeof oldOps === 'string'  && __this.prop('olvSelect-wrap') && ops === 'remove' && str ) {
			// 	add( __this, add );
			// 	return;
			// }
			var ops = $.extend({}, defaultOps, ops);
			__this.each(function () {
				var _this = $(this),
					wrap,
					obj = getProp( _this ),
					tmpObj = {}, 
					nodeTmp = [];
				if( !obj.ops ) {
					_this.children().each(function (i, v) {
						var node = v.cloneNode(true);
						nodeTmp.push( node )
					});
					tmpObj[ propNameHandle('raw') ] = __this;
					tmpObj[ propNameHandle('old') ] = _this.val();
					tmpObj[ propNameHandle('ops') ] = ops;
					tmpObj[ propNameHandle('oldNode') ] = nodeTmp;
					_this.prop(tmpObj);
					wrap = createBox(_this);
					_this.prop(propNameHandle('wrap'), wrap);
				}
				createItem(_this);
			});
			$.each(evtNameMap, function ( i, v ) {
				__this.on(eventStrChange(v), eventMap[ v ]);
			});
			__this.trigger(eventStrChange(evtNameMap[ 0 ]));
			if ( typeof oldOps === 'string' &&
				( evtReg.test(oldOps) ) ) {
				__this.trigger(eventStrChange(oldOps));
			}
			return __this;
		}
	});
	return $;
}));

