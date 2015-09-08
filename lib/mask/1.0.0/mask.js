/* 遮罩 */
/*
 // 显示遮罩
 $.ui.mask()

 $.ui.mask({
 // 显示文本
 msg: '数据加载中数据加载中数据加载中数据加载中数据加载中',
 // 显示 加载图标
 loading: true
 // 自动隐藏 单位毫秒 等待多少 时间后隐藏
 autoHide: 200
 // 自定义样式
 customClass: 'class1 class2'
 // 如果显示文本 或者 加载图标 宽高设定才生效
 width: '',
 height: '',
 // 显示的回调
 showCallBack: noop,
 // 隐藏的回调
 hideCallBack: noop
 })

 // 显示
 $.ui.mask.show(ops, callback)
 $.ui.mask.show(callback)
 // 隐藏
 mask.hide(ops, callback)
 mask.hide(callback)
 */
;
(function ( factory ) {
	if ( typeof define === "function" && define.amd ) {
		// requirejs
		define([ 'jquery' ], function ( $ ) {
			return factory($);
		});
	}
	else if ( typeof define === "function" && define.cmd ) {
		// seajs
		define(function ( require ) {
			var $ = require('jquery');
			// module.exports = 
			return factory( $ );
		});
	}
	else {
		factory(jQuery);
	}
}(
	function ( $ ) {
		'use strict';
		function noop () {
		}
		
		var defaultOps = {
			// 显示加载图标
			loading:      false,
			// 自动隐藏
			autoHide:     false,
			// 自定义样式, 附加到 mask 根节点
			customClass:  '',
			// 指定宽度
			width:        '',
			// 指定高度
			height:       '',
			// 提示文字
			msg:          '',
			// 控制显示隐藏
			status:       true,
			// 显示回调
			showCallBack: noop,
			// 隐藏毁掉
			hideCallBack: noop
		};
		var animateHide = function ( obj ) {
			var time_outer,
			    prefix,
			    time;
			if ( (obj.loading || obj.msg ) && obj.loadingElem && obj.autoHide ) {
				if ( $.browser.msie && $.browser.version <= 9 ) {
					time_outer = setTimeout(function () {
						var clientHeight = document.documentElement.clientHeight;
						$(obj.loadingElem).animate({
							top: -clientHeight + 'px'
						}, 200, 'linear', function () {
							clearTimeout(time_outer);
							obj.root.style.display = 'none';
							if( obj.status ) {
								obj.showCallBack(obj);
							} else {
								obj.hideCallBack(obj);
							}
						});
					}, time);
				} else {
					$(obj.loadingElem).one($.transEnd_EV, function ( e ) {
						clearTimeout(time_outer);
						obj.root.style.display = 'none';
						if( obj.status ) {
							obj.showCallBack(obj);
						} else {
							obj.hideCallBack(obj);
						}
					});
					time_outer = setTimeout(function () {
						$(obj.loadingElem).css({
							'transitionDuration':       '300ms',
							'transitionTimingFunction': 'linear',
							'transform':                'translateY(-100%)'
						});
					}, obj.autoHide);
				}
			}
			else {
				obj.root.style.display = 'none';
				if( obj.status ) {
					obj.showCallBack(obj);
				} else {
					obj.hideCallBack(obj);
				}
			}
		}
		var createOps = function ( ops, callback ) {
			var obj = {};
			if ( ops && callback ) {
				obj.showCallBack = callback;
			}
			if ( typeof ops == 'function' ) {
				obj.showCallBack = ops;
			} else {
				if ( ops === null ) {
					obj.loading = false;
				} else {
					switch ( typeof ops ) {
						case 'boolean':
						case 'string':
						case 'number':
						case 'undefined':
							obj.loading = false;
							break;
						case 'object':
							obj = ops;
							break;
					}
				}
			}
			return obj;
		}
		var show = function ( obj ) {

			var
				time_outer,
				bool_BoxSiszing = false,
				$maskInnerBody,
				$maskLoadingInner,
				$loadingSpinner,
				$loadingSpinnerOuter,
				$tmpNode,
				w = 0,
				h = 0,
				pad_left = 0,
				pad_right = 0,
				pad_top = 0,
				pad_bottom = 0,
				innerPT = 0,
				innerPR = 0,
				innerPB = 0,
				innerPL = 0,
				isS20 = function ( str ) {
					return /%/.test(str);
				};
			if ( typeof obj.autoHide === 'object' ) {
				obj.autoHide = 0;
			}
			if ( typeof obj.autoHide === 'string' ) {
				obj.autoHide = parseInt(obj.autoHide, 10);
			}
			if ( typeof obj.autoHide === 'boolean' ) {
				obj.autoHide = obj.autoHide === true ? 2000 : 0;
			}
			if ( typeof obj.autoHide == 'number' ) {
				obj.autoHide = obj.autoHide < 2000 ? 0 : 2000;
			}
			$(obj.root).css({'display': 'block'});
			if ( (obj.loading || obj.msg ) && obj.loadingElem ) {
				$(obj.loadingElem).css({'visibility': 'visible'});
				$maskInnerBody = $('.mask-inner-body', obj.loadingElem);
				$maskLoadingInner = $('.mask-loading-inner', obj.loadingElem);
				$loadingSpinnerOuter = $('.loading-spinner-outer', obj.loadingElem);
				$loadingSpinner = $('.loading-spinner', obj.loadingElem);
				pad_left = parseInt($maskLoadingInner.css('paddingLeft'), 10);
				pad_right = parseInt($maskLoadingInner.css('paddingRight'), 10);
				pad_top = parseInt($maskLoadingInner.css('paddingTop'), 10);
				pad_bottom = parseInt($maskLoadingInner.css('paddingBottom'), 10);
				innerPL = parseInt($maskInnerBody.css('paddingLeft'));
				innerPR = parseInt($maskInnerBody.css('paddingRight'));
				innerPT = parseInt($maskInnerBody.css('paddingTop'));
				innerPB = parseInt($maskInnerBody.css('paddingBottom'));
				if ( $maskLoadingInner.css('box-sizing') === 'border-box' ) {
					bool_BoxSiszing = true
				}



				// loading 图标固定, 直接获取即可;
				if ( obj.loading ) {
					h = $loadingSpinnerOuter.outerHeight();
				}
				if( obj.loading && !obj.msg ) {
					h = $loadingSpinner.height();
					w = $loadingSpinner.width();
				}

				// 文字容器不能直接获取尺寸, 需要内容填充后获取尺寸;
				if ( obj.msg ) {
					$tmpNode = $('<div/>');
					$tmpNode.css({position: 'absolute', left: '-99999px'});
					$tmpNode.html(obj.msg);
					$('body').append($tmpNode);
				
						w = Math.max($tmpNode.outerWidth(), 28);
						h += $tmpNode.outerHeight();
					$tmpNode.remove();
				}

				// ops 指定了宽	
				if ( obj.width ) {
					if ( isS20(obj.width) ) {
						w = obj.width;
					} else {
						w = parseInt(obj.width, 10);
					}
				}
				// ops 指定了高
				if ( obj.height ) {
					if ( isS20(obj.height) ) {
						h = obj.height;
					} else {
						h = parseInt(obj.height, 10);
					}
				}


				w += (innerPL + innerPR);
				h += (innerPT + innerPB);

				// 如果 box-sizing === 'border-box' 同时, 宽度非 %, 设置宽度时需要减去 padding
				if ( bool_BoxSiszing && !isS20(obj.height) ) {
					w = w + pad_left + pad_right;
					h = h + pad_top + pad_bottom;
				}

				$maskLoadingInner.css({width: w, height: h});
			}
			// obj.showCallBack(obj);
			if ( obj.autoHide ) {
				animateHide(obj);
			} else {
				obj.showCallBack(obj);
			}
		};
		var hide = function ( obj ) {
			animateHide(obj);
		};
		// 创建根节点
		var createRoot = function ( obj ) {
			var root = document.getElementById('ui-mask');
			var cls = obj.customClass.match(/\S+/g) || [];
			var len = cls.length;
			var tmp = {};
			if ( !root ) {
				root = document.createElement('div');
				root.id = 'ui-mask';
				root.className = 'ui-mask';
				document.documentElement.appendChild(root);
			} else {
				root.className = 'ui-mask';
				// root.classList.add('mask');
				// $(root).addClass('ui-mask');
			}
			if ( len ) {
				// for ( var i = 0; i < len; i++ ) {
				// 	console.log(cls[ i ])
				// }
				$(root).addClass( cls.join(' ') );
			}
			root.innerHTML = '';
			obj.root = root;
			return createLoading(obj);
		}
		// 创建字符串格式的元素节点
		var createLoading = function ( ops ) {
			var innerStr = '',
			    loading = '';
			if ( ops.loading ) {
				loading = '<div class="loading-spinner-outer">' +
				'<div class="loading-spinner">' +
				'<span class="loading-top"></span>' +
				'<span class="loading-right"></span>' +
				'<span class="loading-bottom"></span>' +
				'<span class="loading-left"></span>' +
				'</div>' +
				'</div>';
			}
			if ( ops.msg || ops.loading ) {
				innerStr =
					'<div class="mask-loading-inner">' +
					'<div class="mask-inner-body">' +
					loading +
					(ops.msg && '<div class="mask-tip-txt">' + ops.msg + '</div>') +
					'</div>' +
					'</div>';
			}
			var wrapper = [
				'<div class="mask-loading">'
				, '<div class="mask-loading-conatiner">'
				, innerStr
				, '</div>'
				, '</div>'
			].join('');
			
			ops.root.innerHTML = wrapper;
			ops.loadingElem = $('.mask-loading', ops.root)[ 0 ];
			return ops;
		}
		
		function Mask ( ops ) {
			return new MaskInstance( createOps(ops) );
		}
		
		// 初始化
		Mask.init = function ( ops ) {
			var obj = createRoot(ops);
			// 保存数据到节点
			$.data(obj.root, 'ui-mask', obj);
			if ( obj.status ) {
				show(obj);
			} else {
				hide(obj);
			}
		};
		Mask.hide = function ( ops, callback ) {
			var root = document.getElementById('ui-mask')
			var newOps = $.data(root, 'ui-mask', obj);
			var obj = {};
			if( newOps ) {
				newOps = $.extend(true, {}, newOps, ops);
			} else {
				newOps = ops;
			}
			var obj = createOps(newOps, callback);
			obj.status = false;
			Mask(obj);
		};
		Mask.show = function ( ops, callback ) {
			var root = document.getElementById('ui-mask')
			var newOps = $.data(root, 'ui-mask', obj);
			var obj = {};
			if( newOps ) {
				newOps = $.extend(true, {}, newOps, ops);
			} else {
				newOps = ops;
			}
			var obj = createOps(newOps, callback);
			obj.status = true;
			Mask(obj);
		};
		function MaskInstance ( ops ) {
			this.ops = $.extend({}, defaultOps, ops);
			this.init(this.ops);
		}
		
		MaskInstance.prototype.init = Mask.init;
		MaskInstance.prototype.hide = Mask.hide;
		MaskInstance.prototype.show = Mask.show;

		$.ui = $.ui || {};
		$.ui.mask = Mask
		// window.mask = Mask;
		return $;
	}
));