;(function ( factory ) {
	if ( typeof define === "function" && define.amd ) {
		define([ 'jquery', 'mask' ], function ( $, mask ) {
			return factory($);
		});
	}
	else if ( typeof define === "function" && define.cmd ) {
		// seajs
		define(function ( require ) {
			var $ = require('jquery');
			require('mask');
			return factory($);
		});
	}
	else {
		factory(jQuery);
	}
}(
	function ( $ ) {
		var noop = function (){},
			elem = {
				root:      null,
				container: null,
				content:   null,
				bodyBox:   null,
				titleBox:  null,
				msgBox:    null,
				okBtn:     null,
				cancelBtn: null
			},
			defaultOps = {
				title:       '提示信息',
				msg:         '消息提示',
				type:        'alert',

				btnTxt:         {
					okTxt:     '确认',
					cancelTxt: '取消'
				},
				elem:        elem,
				customClass: {
					// 用户定义的 class
					userClass:        '',
					// 确认按钮 class
					okClass:          '',
					// 取消按钮 class
					cancelClass:      '',
					// css3 动画
					showAnimateClass: 'bounce-in',
					hideAnimateClass: 'bounce-out'
				},
				// 遮罩层附加的 class
				maskClass:   '',
				callBack:    {
					beforeInput: noop,
					okFn:     noop,
					cancelFn: noop
				}
			},
			btnBool = {
				cancelBool: false,
				okBool:     true
			},
			// 事件处理
			windowBoxHander = function ( obj ) {
				var tap = $.touch_EV.end_EV;
				show( obj );
				if ( obj.elem.okBtn ) {
					$(obj.elem.okBtn).one(tap, function ( e ) {
						e.stopPropagation();
						hide( obj, true );
					});
				}
				if ( obj.elem.cancelBtn ) {
					$(obj.elem.cancelBtn).one(tap, function ( e ) {
						e.stopPropagation();
						hide( obj, false );
					});
				}
			},
			// 创建根节点
			createRoot = function ( ops ) {
				var root  = document.getElementById('msgbox');
		
				var container, content;
				if ( !root ) {
					var tmpEle = document.createElement('div');
					//创建msgbox根节点
					root = tmpEle.cloneNode(false);
					root.id = 'msgbox';
					root.style.zIndex = 9999;
					root.className = 'ui-msgbox';
					//创建根容器
					container = tmpEle.cloneNode(false);
					container.className = 'msgbox-container'
					//创建内容容器
					content = tmpEle.cloneNode(false);
					content.className = 'msgbox-content';
					root.appendChild(container);
					container.appendChild(content);
					document.documentElement.appendChild(root);
				} else {
					container = $('.msgbox-container', root)[0];
					content = $('.msgbox-content', root)[0];
				}
				root.className = 'ui-msgbox';
				if( ops.customClass.userClass ) {
					$(root).addClass( ops.customClass.userClass );
				}
				elem.root      = root;
				elem.container = container;
				elem.content   = content;
				return elem;
			},
			// 创建字符节点
			createStrNode = function ( obj ) {
				var okBtnStr = '', 
					cancelBtnStr = '';

				if( btnBool.cancelBool ) {
					cancelBtnStr = '<button type="buttom" data-msgbox-btn="cancel" class="btn btn-sm btn-default' +
					 (obj.customClass.cancelClass && obj.customClass.cancelClass) + '">' +
					 obj.btnTxt.cancelTxt + '</button>';
				}
				if( btnBool.okBool ) {
					okBtnStr = 
						'<button type="buttom" data-msgbox-btn="ok" class="btn btn-sm btn-warning' +
							( obj && obj.customClass.okClass ) +'">' +
							'<span class="btn-txt">' + obj.btnTxt.okTxt + '</span>' +
							'<div class="loading-spinner-outer">' +
								'<div class="loading-spinner">' +
									'<span class="loading-top"></span>' +
									'<span class="loading-right"></span>' +
									'<span class="loading-bottom"></span>' +
									'<span class="loading-left"></span>' +
								'</div>' +
							'</div>' +
						'</button>';	
				}
				
				var str = 
					'<div class="msgbox-body">' +
					'<span class="inner-bg">' +
					'<span class="inner"><span class="inner2"></span></span></span>' +
					'<div class="msgbox-body-inner">' +
					'<div class="msgbox-title">' +
					'<span class="msg-title-txt">'+ obj.title +'</span>' +
					'</div>' +
					'<div class="msgbox-msg">' + obj.msg + '</div>' +
					'<div class="msgbox-buttons">' + cancelBtnStr + okBtnStr + '</div>' +
					'</div>' +
					'</div>';

				obj.elem.content.innerHTML = str;
				obj.elem.bodyBox = $('.msgbox-body', obj.elem.content)[0];
				obj.elem.titleBox = $('.msgbox-title', obj.elem.content)[0];
				obj.elem.msgBox = $('.msgbox-msg', obj.elem.content)[0];
				obj.elem.btnBox = $('.msgbox-buttons', obj.elem.content)[0];

				var button = obj.elem.btnBox.getElementsByTagName('button');

				for( var i = 0, len = button.length; i < len; i++ ) {
					var attr = button[ i ].getAttribute('data-msgbox-btn');
					if( attr ) {
						if( attr == 'ok' ) {
							obj.elem.okBtn = button[ i ];
						}
						if( attr == 'cancel' ) {
							obj.elem.cancelBtn = button[ i ];
						}
					}
				}
				delete obj.bool;
				return obj;					

			},
			// 显示
			show = function (obj, bool) {
				if( $(obj.elem.root).css('display') === 'none' ) {
					$.ui.mask(function () {
						obj.elem.root.style.display = 'block';
						obj.elem.content.style.height = obj.elem.titleBox.offsetHeight + obj.elem.msgBox.offsetHeight + obj.elem.btnBox.offsetHeight + 'px';

						if( obj.customClass.showAnimateClass ) {
							$(obj.elem.root).one($.animateEnd_EV, function (){
								$(obj.elem.root).removeClass(obj.customClass.showAnimateClass);
							});
							$(obj.elem.root).addClass(obj.customClass.showAnimateClass);
						}
					});
				}
				if( obj.callBack.beforeInput ) {
					obj.callBack.beforeInput.call( obj.elem );
				}
			},
			// 隐藏
			hide = function (obj, bool) {
				if( $(obj.elem.root).css('display') !== 'none' ) {
					if( obj.customClass.hideAnimateClass ) {
						$(obj.elem.root).addClass(obj.customClass.hideAnimateClass);
						if( $.cssPrefix.prefix ) {
							$(obj.elem.root).one($.animateEnd_EV, function (){
								obj.elem.root.style.display = 'none';
								$(obj.elem.root).removeClass(obj.customClass.hideAnimateClass);
								if( bool === true ) {
									$.ui.mask.hide(function () {
										obj.callBack.okFn.call( obj.elem );
									});
								} else if ( bool === false ) {
									$.ui.mask.hide(function () {
										obj.callBack.cancelFn.call( obj.elem );
									});
								} else {
									$.ui.mask.hide();
								}
							});							
						} else {
							obj.elem.root.style.display = 'none';
						}
					}
				} else {
					$.ui.mask.hide(function () {
						obj.elem.root.style.display = 'none';
						if( bool === true ) {
							obj.callBack.okFn.call( obj.elem );
						} else if ( bool === false ) {
							obj.callBack.cancelFn.call( obj.elem );
						} else {
							$.ui.mask.hide();
						}
					});
				}
			},
			containerEvt = function ( obj ) {
				var evStart = $.touch_EV.start_EV;
				var evEnd = $.touch_EV.end_EV;

				$(obj.elem.container).one(evStart, function ( e ) {
					if ( e.target == obj.elem.container ) {
						$(obj.elem.root).addClass('txt-select-off');
					}
				});
				$(obj.elem.container).on(evEnd, function ( e ) {
					$(obj.elem.root).removeClass('txt-select-off');
					// if ( e.target == obj.elem.container ) {
					// 	hide( obj );
					// 	if( obj.callBack.cancelFn ) {
					// 		obj.callBack.cancelFn.call( obj.elem );
					// 	}
					// }
				});
				var keyEventFn = function ( e ) {
					if( e.keyCode === 27 ) {
						$(obj.elem.root).removeClass('txt-select-off');
						hide( obj );
						obj.callBack.cancelFn.call( obj.elem );
						// keyEvent( true )
					}
				}

				$(window).one('keyup', keyEventFn);
				//var keyEvent = function ( arg ) {

					// var winTop = window.top;
					// var allIfr = winTop.document.getElementsByTagName('iframe');
					// var len = allIfr.length;
					// var i = 0;
					// if( arg ) {
					// 	if( len ) {
					// 		for( ; i < len; i++ ) {
					// 			__event._off( allIfr[ i ].contentWindow, 'keyup', keyEventFn);
					// 		}
					// 		__event._off( window, 'keyup', keyEventFn);
					// 	} else {
					// 		__event._off( window, 'keyup', keyEventFn);
					// 	}
					// } else {
					// 	if( len ) {
					// 		for( ; i < len; i++ ) {
					// 			__event._on( allIfr[ i ].contentWindow, 'keyup', keyEventFn);
					// 		}
					// 		__event._on( window, 'keyup', keyEventFn);
					// 	} else {
					// 		__event._on( window, 'keyup', keyEventFn);
					// 	}
					// }

				//}
				// keyEvent();

			},
			Dialog = function ( ops ) {
				return new DialogInstance(ops);
			},

			DialogInstance = function ( ops ) {
				this.ops = $.extend(true, {}, defaultOps, ops );
				this.init(this.ops);
			};

			Dialog.init = function ( ops ){
				ops.elem = createRoot( ops );
				if( ops.type == 'alert' ) {
					btnBool.cancelBool = false;
					btnBool.okBool = true;
				} else if ( ops.type == 'confirm' ) {
					btnBool.cancelBool = true;
					btnBool.okBool = true;
				}
				windowBoxHander( createStrNode( ops ) );
				containerEvt( ops );
			};
			Dialog.show = function (){};
			Dialog.hide = function (){};

		DialogInstance.prototype.init = Dialog.init;
		DialogInstance.prototype.hide = Dialog.hide;
		DialogInstance.prototype.show = Dialog.show;


		$.ui = $.ui || {};
		$.ui.dialog = Dialog
		// window.dialog = Dialog;
		return $;
	}
));