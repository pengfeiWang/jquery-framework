/* ==============================
	js template
	{%=it.data%}
================================ */

;(function( global, factory ) {
	// if (typeof define === "function" && define.amd) {
	// 	define(["jquery"], factory);
	// } else if (typeof define === "function" && define.cmd) {
	// 	define(function(require) {
	// 		var $ = require('jquery');
	// 		factory($);
	// 	});
	// } else {
	// 	factory(jQuery);
	// }

	if ( typeof module === "object" && typeof module.exports === "object" ) {
		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get jQuery.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var jQuery = require("jquery")(window);
		// See ticket #14549 for more info.
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	}  else {
		factory( global );
	}

}(typeof global !== 'undefined' ? window : this, function( window,  noGlobal) {
	// function noop(){};
	
	// $.extend($.fn, {});

	// doT.js
	// 2011-2014, Laura Doktorova, https://github.com/olado/doT
	// Licensed under the MIT license.

	
		var t1 =  {
			evaluate:    /\{\{([\s\S]+?(\}?)+)\}\}/g,
			interpolate: /\{\{=([\s\S]+?)\}\}/g,
			encode:      /\{\{!([\s\S]+?)\}\}/g,
			use:         /\{\{#([\s\S]+?)\}\}/g,
			useParams:   /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
			define:      /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
			defineParams:/^\s*([\w$]+):([\s\S]+)/,
			conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
			iterate:     /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
			varname:	"it",
			strip:		true,
			append:		true,
			selfcontained: false,
			doNotSkipEncoded: false
		},
		t2 = {
			evaluate:    /\{\%([\s\S]+?(\}?)+)\%\}/g,
			interpolate: /\{\%=([\s\S]+?)\%\}/g,
			encode:      /\{\%!([\s\S]+?)\%\}/g,
			use:         /\{\%#([\s\S]+?)\%\}/g,
			useParams:   /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
			define:      /\{\%##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\%\}/g,
			defineParams:/^\s*([\w$]+):([\s\S]+)/,
			conditional: /\{\%\?(\?)?\s*([\s\S]*?)\s*\%\}/g,
			iterate:     /\{\%~\s*(?:\%\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\%\})/g,
			varname:	"it",
			strip:		true,
			append:		true,
			selfcontained: false,
			doNotSkipEncoded: false
		}
	


		"use strict";

		var doT = {
			version: "1.0.3",
			templateSettings: t2,
			template: undefined, //fn, compile template
			compile:  undefined  //fn, for express
		}, _globals;

		doT.encodeHTMLSource = function(doNotSkipEncoded) {
			var encodeHTMLRules = { "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': "&#34;", "'": "&#39;", "/": "&#47;" },
				matchHTML = doNotSkipEncoded ? /[&<>"'\/]/g : /&(?!#?\w+;)|<|>|"|'|\//g;

			var encodeHTMLRules = { "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': '&#34;', "'": '&#39;', "/": '&#47;' },
				matchHTML = /&(?!#?\w+;)|<|>|"|'|\//g;

			return function(code) {
				return code ? code.toString().replace(matchHTML, function(m) {return encodeHTMLRules[m] || m;}) : "";
			};
		};

		_globals = (function(){ return this || (0,eval)("this"); }());

		if (typeof module !== "undefined" && module.exports) {
			module.exports = function ( tmpl, data ) {
				if( tmpl && data ) {
					return doT.template(tmpl).apply(null, [data])
				}
			};
		} else if (typeof define === "function" && define.amd) {
			define(function(){
				return function ( tmpl, data ) {
					if( tmpl && data ) {
						return doT.template(tmpl).apply(null, [data])
					}
				}
			});
		} else if ( typeof define === "function" && define.cmd) {
			define(function (require, exports, module) {
				module.exports = function ( tmpl, data ) {
					if( tmpl && data ) {
						return doT.template(tmpl).apply(null, [data])
					}
				}
			});
		} else {
			_globals.doT = doT;
		}

		var startend = {
			append: { start: "'+(",      end: ")+'",      startencode: "'+encodeHTML(" },
			split:  { start: "';out+=(", end: ");out+='", startencode: "';out+=encodeHTML(" }
		}, skip = /$^/;

		function resolveDefs(c, block, def) {
			return ((typeof block === "string") ? block : block.toString())
			.replace(c.define || skip, function(m, code, assign, value) {
				if (code.indexOf("def.") === 0) {
					code = code.substring(4);
				}
				if (!(code in def)) {
					if (assign === ":") {
						if (c.defineParams) value.replace(c.defineParams, function(m, param, v) {
							def[code] = {arg: param, text: v};
						});
						if (!(code in def)) def[code]= value;
					} else {
						new Function("def", "def['"+code+"']=" + value)(def);
					}
				}
				return "";
			})
			.replace(c.use || skip, function(m, code) {
				if (c.useParams) code = code.replace(c.useParams, function(m, s, d, param) {
					if (def[d] && def[d].arg && param) {
						var rw = (d+":"+param).replace(/'|\\/g, "_");
						def.__exp = def.__exp || {};
						def.__exp[rw] = def[d].text.replace(new RegExp("(^|[^\\w$])" + def[d].arg + "([^\\w$])", "g"), "$1" + param + "$2");
						return s + "def.__exp['"+rw+"']";
					}
				});
				var v = new Function("def", "return " + code)(def);
				return v ? resolveDefs(c, v, def) : v;
			});
		}

		function unescape(code) {
			return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, " ");
		}

		doT.template = function(tmpl, c, def) {
			c = c || doT.templateSettings;
			var cse = c.append ? startend.append : startend.split, needhtmlencode, sid = 0, indv,
				str  = (c.use || c.define) ? resolveDefs(c, tmpl, def || {}) : tmpl;

			str = ("var out='" + (c.strip ? str.replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g," ")
						.replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g,""): str)
				.replace(/'|\\/g, "\\$&")
				.replace(c.interpolate || skip, function(m, code) {
					return cse.start + unescape(code) + cse.end;
				})
				.replace(c.encode || skip, function(m, code) {
					needhtmlencode = true;
					return cse.startencode + unescape(code) + cse.end;
				})
				.replace(c.conditional || skip, function(m, elsecase, code) {
					return elsecase ?
						(code ? "';}else if(" + unescape(code) + "){out+='" : "';}else{out+='") :
						(code ? "';if(" + unescape(code) + "){out+='" : "';}out+='");
				})
				.replace(c.iterate || skip, function(m, iterate, vname, iname) {
					if (!iterate) return "';} } out+='";
					sid+=1; indv=iname || "i"+sid; iterate=unescape(iterate);
					return "';var arr"+sid+"="+iterate+";if(arr"+sid+"){var "+vname+","+indv+"=-1,l"+sid+"=arr"+sid+".length-1;while("+indv+"<l"+sid+"){"
						+vname+"=arr"+sid+"["+indv+"+=1];out+='";
				})
				.replace(c.evaluate || skip, function(m, code) {
					return "';" + unescape(code) + "out+='";
				})
				+ "';return out;")
				.replace(/\n/g, "\\n").replace(/\t/g, '\\t').replace(/\r/g, "\\r")
				.replace(/(\s|;|\}|^|\{)out\+='';/g, '$1').replace(/\+''/g, "");
				//.replace(/(\s|;|\}|^|\{)out\+=''\+/g,'$1out+=');

			if (needhtmlencode) {
				if (!c.selfcontained && _globals && !_globals._encodeHTML) _globals._encodeHTML = doT.encodeHTMLSource(c.doNotSkipEncoded);
				str = "var encodeHTML = typeof _encodeHTML !== 'undefined' ? _encodeHTML : ("
					+ doT.encodeHTMLSource.toString() + "(" + (c.doNotSkipEncoded || '') + "));"
					+ str;
			}
			try {
				return new Function(c.varname, str);
			} catch (e) {
				if (typeof console !== "undefined") console.log("Could not create a template function: " + str);
				throw e;
			}
		};

		doT.compile = function(tmpl, def) {
			return doT.template(tmpl, null, def);
		};
	
}));

