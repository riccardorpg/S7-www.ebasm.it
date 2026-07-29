if( typeof jQuery !== 'undefined' ) {
	var $ = jQuery.noConflict();
}

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	( global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.SEMICOLON = factory() );
} (this, (function() {

	// USE STRICT
	"use strict";

	function applyJQueryCompat($) {
		if( !$ || $.__cnvsCompat ) return;
		$.__cnvsCompat = true;
		if( typeof $.isFunction !== 'function' ) {
			$.isFunction = function(x) { return typeof x === 'function'; };
		}
		if( typeof $.isArray !== 'function' ) {
			$.isArray = Array.isArray;
		}
		if( typeof $.parseJSON !== 'function' ) {
			$.parseJSON = function(s) { return JSON.parse(s); };
		}
		if( typeof $.proxy !== 'function' ) {
			$.proxy = function(fn, ctx) {
				if( typeof ctx === 'string' ) { var tmp = fn[ctx]; ctx = fn; fn = tmp; }
				if( typeof fn !== 'function' ) return undefined;
				var args = Array.prototype.slice.call(arguments, 2);
				return function() { return fn.apply(ctx, args.concat(Array.prototype.slice.call(arguments))); };
			};
		}
		if( typeof $.trim !== 'function' ) {
			$.trim = function(s) { return s == null ? '' : String(s).trim(); };
		}
		if( typeof $.holdReady !== 'function' ) {
			$.holdReady = function() {};
		}
		if( typeof $.unique !== 'function' && typeof $.uniqueSort === 'function' ) {
			$.unique = $.uniqueSort;
		}
		if( typeof $.now !== 'function' ) {
			$.now = Date.now;
		}
		if( typeof $.camelCase !== 'function' ) {
			$.camelCase = function(s) {
				return String(s).replace(/^-ms-/, 'ms-').replace(/-([a-z])/g, function(_, c) { return c.toUpperCase(); });
			};
		}
		if( typeof $.nodeName !== 'function' ) {
			$.nodeName = function(el, name) { return el && el.nodeName && el.nodeName.toLowerCase() === String(name).toLowerCase(); };
		}
		if( typeof $.type !== 'function' ) {
			$.type = function(obj) {
				if( obj == null ) return obj + '';
				return typeof obj === 'object' || typeof obj === 'function'
					? Object.prototype.toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
					: typeof obj;
			};
		}
	}

	var options = {
		pageTransition: false,
		cursor: false,
		tips: false,
		headerSticky: true,
		headerMobileSticky: false,
		menuBreakpoint: 992,
		pageMenuBreakpoint: 992,
		gmapAPI: '',
		scrollOffset: 60,
		scrollExternalLinks: true,
		smoothScroll: false,
		jsFolder: 'js/',
		cssFolder: 'css/',
	};

	if( typeof cnvsOptions !== 'undefined' ) {
		options = Object.assign({}, options, cnvsOptions);
	}

	var vars = {
		baseEl: document,
		elRoot: document.documentElement,
		elHead: document.head,
		elBody: document.body,
		viewport: {
			width: 0,
			height: 0,
		},
		hash: window.location.hash,
		hashScroll: 0,
		topScrollOffset: 0,
		elWrapper: document.getElementById('wrapper'),
		elHeader: document.getElementById('header'),
		headerClasses: '',
		elHeaderWrap: document.getElementById('header-wrap'),
		headerWrapClasses: '',
		headerHeight: 0,
		headerOffset: 0,
		headerWrapHeight: 0,
		headerWrapOffset: 0,
		elPrimaryMenus: document.querySelectorAll('.primary-menu'),
		elPrimaryMenuTriggers: document.querySelectorAll('.primary-menu-trigger'),
		elPageMenu: document.getElementById('page-menu'),
		pageMenuOffset: 0,
		elSlider: document.getElementById('slider'),
		elFooter: document.getElementById('footer'),
		elAppMenu: document.querySelector('.app-menu'),
		portfolioAjax: {},
		sliderParallax: {
			el: document.querySelector('.slider-parallax'),
			caption: document.querySelector('.slider-parallax .slider-caption'),
			inner: document.querySelector('.slider-inner'),
			offset: 0,
		},
		get menuBreakpoint() {
			return this.elBody.getAttribute('data-menu-breakpoint') || options.menuBreakpoint;
		},
		get pageMenuBreakpoint() {
			return this.elBody.getAttribute('data-pagemenu-breakpoint') || options.pageMenuBreakpoint;
		},
		get customCursor() {
			var value = this.elBody.getAttribute('data-custom-cursor') || options.cursor;
			return value == 'true' || value === true ? true : false;
		},
		get pageTransition() {
			var value = this.elBody.classList.contains('page-transition') || options.pageTransition;
			return value == 'true' || value === true ? true : false;
		},
		get tips() {
			var value = this.elBody.getAttribute('data-tips') || options.tips;
			return value == 'true' || value === true ? true : false;
		},
		get smoothScroll() {
			var value = this.elBody.getAttribute('data-smooth-scroll') || options.smoothScroll;
			return value == 'true' || value === true ? true : false;
		},
		get isRTL() {
			return this.elRoot.getAttribute('dir') == 'rtl' ? true : false;
		},
		scrollPos: {
			x: 0,
			y: 0,
		},
		$jq: typeof jQuery !== "undefined" ? jQuery.noConflict() : '',
		resizers: {},
		recalls: {},
		events: {},
		modules: {},
		fn: {},
		required: {
			jQuery: {
				plugin: 'jquery',
				fn: function(){
					if( typeof jQuery === 'undefined' ) return false;
					applyJQueryCompat(jQuery);
					return true;
				},
				file: options.jsFolder+'jquery.js',
				id: 'canvas-jquery',
			}
		},
		fnInit: function() {
			DocumentOnReady.init();
			DocumentOnLoad.init();
			DocumentOnResize.init();
		}
	};

	var Core = function() {
		return {
			getOptions: options,
			getVars: vars,

			run: function(obj) {
				Object.values(obj).forEach( function(fn) {
					if( typeof fn === 'function' ) fn.call();
				});
			},

			runBase: function() {
				Core.run(Base);
			},

			runModules: function() {
				Core.run(Modules);
			},

			runContainerModules: function(parent) {
				if( typeof parent === 'undefined' ) {
					return false;
				}

				Core.getVars.baseEl = parent;
				Core.runModules();
				Core.getVars.baseEl = document;
			},

			breakpoints: function() {
				var viewWidth = Core.viewport().width;

				var breakpoint = {
					xxl: {
						enter: 1400,
						exit: 99999
					},
					xl: {
						enter: 1200,
						exit: 1399
					},
					lg: {
						enter: 992,
						exit: 1199.98
					},
					md: {
						enter: 768,
						exit: 991.98
					},
					sm: {
						enter: 576,
						exit: 767.98
					},
					xs: {
						enter: 0,
						exit: 575.98
					}
				};

				var previous = '';

				Object.keys( breakpoint ).forEach( function(key) {
					if ( (viewWidth > breakpoint[key].enter) && (viewWidth <= breakpoint[key].exit) ) {
						vars.elBody.classList.add( 'device-'+key );
					} else {
						vars.elBody.classList.remove( 'device-'+key );
						if( previous != '' ) {
							vars.elBody.classList.remove( 'device-down-'+previous );
						}
					}

					if ( viewWidth <= breakpoint[key].exit ) {
						if( previous != '' ) {
							vars.elBody.classList.add( 'device-down-'+previous );
						}
					}

					previous = key;

					if ( viewWidth > breakpoint[key].enter ) {
						vars.elBody.classList.add( 'device-up-'+key );
						return;
					} else {
						vars.elBody.classList.remove( 'device-up-'+key );
					}
				});
			},

			colorScheme: function() {
				if( vars.elBody.classList.contains('adaptive-color-scheme') ) {
					window.matchMedia('(prefers-color-scheme: dark)').matches ? vars.elBody.classList.add( 'dark' ) : vars.elBody.classList.remove('dark');
				}

				var bodyColorScheme = Core.cookie.get('__cnvs_body_color_scheme');

				if( bodyColorScheme && bodyColorScheme != '' ) {
					bodyColorScheme.split(" ").includes('dark') ? vars.elBody.classList.add( 'dark' ) : vars.elBody.classList.remove( 'dark' );
				}
			},

			addEvent: function(el, event, args = {}) {
				if( typeof el === "undefined" || typeof event === "undefined" ) {
					return;
				}

				var createEvent = new CustomEvent( event, {
					detail: args
				});

				el.dispatchEvent( createEvent );
				vars.events[event] = true;
			},

			scrollEnd: function(callback, refresh = 199) {
				if (!callback || typeof callback !== 'function') return;
				window.addEventListener('scroll', Core.debounce(callback, refresh), { passive: true });
			},

			viewport: function() {
				var viewport = {
					width: window.innerWidth || vars.elRoot.clientWidth,
					height: window.innerHeight || vars.elRoot.clientHeight
				};

				vars.viewport = viewport;

				document.documentElement.style.setProperty('--cnvs-viewport-width', viewport.width);
				document.documentElement.style.setProperty('--cnvs-viewport-height', viewport.height);
				document.documentElement.style.setProperty('--cnvs-body-height', vars.elBody.clientHeight);

				return viewport;
			},

			isElement: function(selector) {
				if (typeof selector === 'object' && selector !== null) {
					return true;
				}

				if (selector instanceof Element || selector instanceof HTMLElement) {
					return true;
				}

				if (typeof selector.jquery !== 'undefined') {
					selector = selector[0];
				}

				if (typeof selector.nodeType !== 'undefined') {
					return true;
				}

				return false;
			},

			getSelector: function(selector, jquery=true, customjs=true) {
				if(jquery) {
					if( Core.getVars.baseEl !== document ) {
						selector = jQuery(Core.getVars.baseEl).find(selector);
					} else {
						selector = jQuery(selector);
					}

					if( customjs ) {
						if( typeof customjs == 'string' ) {
							selector = selector.filter(':not('+ customjs +')');
						} else {
							selector = selector.filter(':not(.customjs)');
						}
					}
				} else {
					if( Core.isElement(selector) ) {
						selector = selector;
					} else {
						if( customjs ) {
							if( typeof customjs == 'string' ) {
								selector = Core.getVars.baseEl.querySelectorAll(selector+':not('+customjs+')');
							} else {
								selector = Core.getVars.baseEl.querySelectorAll(selector+':not(.customjs)');
							}
						} else {
							selector = Core.getVars.baseEl.querySelectorAll(selector);
						}
					}
				}

				return selector;
			},

			onResize: function(callback, refresh = 333) {
				if (!callback || typeof callback !== 'function') return;
				window.addEventListener('resize', Core.debounce(callback, refresh));
			},

			imagesLoaded: function(el) {
				var imgs = el.getElementsByTagName('img') || document.images,
					len = imgs.length,
					counter = 0;

				if(len < 1) {
					Core.addEvent(el, 'CanvasImagesLoaded');
				}

				var incrementCounter = async function() {
					counter++;
					if(counter === len) {
						Core.addEvent(el, 'CanvasImagesLoaded');
					}
				};

				[].forEach.call( imgs, function( img ) {
					if(img.complete) {
						incrementCounter();
					} else {
						img.addEventListener('load', incrementCounter, false);
					}
				});
			},

			contains: function(classes, selector) {
				var classArray = classes.split(" ");
				var hasClass = false;

				classArray.forEach( function(classTxt) {
					if( vars.elBody.classList.contains(classTxt) ) {
						hasClass = true;
					}
				});

				return hasClass;
			},

			has: function(nodeList, selector) {
				return [].slice.call(nodeList).filter( function(e) {
					return e.querySelector(selector);
				});
			},

			filtered: function(nodeList, selector) {
				return [].slice.call(nodeList).filter( function(e) {
					return e.matches(selector);
				});
			},

			parents: function(elem, selector) {
				var parents = [];

				for ( ; elem && elem !== document; elem = elem.parentNode ) {
					if (selector) {
						if (elem.matches(selector)) {
							parents.push(elem);
						}
						continue;
					}
					parents.push(elem);
				}

				return parents;
			},

			siblings: function(elem, nodes = false) {
				if( nodes ) {
					return [].slice.call(nodes).filter( function(sibling) {
						return sibling !== elem;
					});
				} else {
					return [].slice.call(elem.parentNode.children).filter( function(sibling) {
						return sibling !== elem;
					});
				}
			},

			getNext: function(elem, selector) {
				var nextElem = elem.nextElementSibling;

				if( !selector ) {
					return nextElem;
				}

				if( nextElem && nextElem.matches(selector) ) {
					return nextElem;
				}

				return null;
			},

			offset: function(el) {
				var rect = el.getBoundingClientRect(),
					scrollLeft = window.scrollX || document.documentElement.scrollLeft,
					scrollTop = window.scrollY || document.documentElement.scrollTop;

				return {top: rect.top + scrollTop, left: rect.left + scrollLeft};
			},

			isHidden: function(el) {
				return (el.offsetParent === null);
			},

			toNumber: function(value, fallback) {
				var n = parseFloat(value);
				return isFinite(n) ? n : fallback;
			},

			toBool: function(value, fallback) {
				if( value === undefined || value === null || value === '' ) return fallback;
				var v = String(value).toLowerCase();
				if( v === 'true' || v === '1' ) return true;
				if( v === 'false' || v === '0' ) return false;
				return fallback;
			},

			escapeHTML: function(str) {
				return String(str)
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/"/g, '&quot;')
					.replace(/'/g, '&#39;');
			},

			markOnce: function(el, name) {
				if( !el || el.dataset[name] === '1' ) return false;
				el.dataset[name] = '1';
				return true;
			},

			debounce: function(fn, wait) {
				var timer;
				return function() {
					var ctx = this, args = arguments;
					clearTimeout(timer);
					timer = setTimeout(function() { fn.apply(ctx, args); }, wait);
				};
			},

			intersect: function(elements, options, onEnter, onLeave) {
				if( typeof IntersectionObserver === 'undefined' || !elements ) return null;
				var oneShot = !onLeave;
				var observer = new IntersectionObserver(function(entries) {
					entries.forEach(function(entry) {
						if( entry.isIntersecting ) {
							onEnter(entry.target, entry, observer);
							if( oneShot ) observer.unobserve(entry.target);
						} else if( onLeave ) {
							onLeave(entry.target, entry, observer);
						}
					});
				}, options || {});
				if( elements instanceof Element ) {
					observer.observe(elements);
				} else {
					Array.prototype.forEach.call(elements, function(el) {
						if( el instanceof Element ) observer.observe(el);
					});
				}
				return observer;
			},

			rebind: (function() {
				var registries = {};
				return function(el, eventName, handler, registryKey) {
					if( !el || !eventName || typeof handler !== 'function' ) return;
					registryKey = registryKey || eventName;
					if( !registries[registryKey] ) registries[registryKey] = new WeakMap();
					var registry = registries[registryKey];
					var prev = registry.get(el);
					if( prev ) el.removeEventListener(eventName, prev);
					el.addEventListener(eventName, handler);
					registry.set(el, handler);
				};
			})(),

			requirePlugin: function(opts) {
				if( opts.file ) {
					Core.loadJS({ file: opts.file, id: opts.id, jsFolder: true });
				}
				return Core.isFuncTrue(opts.check).then(function(cond) {
					if( !cond ) return false;
					if( opts.class || opts.event ) {
						Core.initFunction({ class: opts.class, event: opts.event });
					}
					return true;
				});
			},

			classesFn: function(func, classes, selector) {
				var classArray = classes.split(" ");
				classArray.forEach( function(classTxt) {
					if( func == 'add' ) {
						selector.classList.add(classTxt);
					} else if( func == 'toggle' ) {
						selector.classList.toggle(classTxt);
					} else {
						selector.classList.remove(classTxt);
					}
				});
			},

			cookie: function() {
				return {
					set: function(name, value, daysToExpire) {
						var date = new Date();
						date.setTime(date.getTime() + (daysToExpire * 24 * 60 * 60 * 1000));
						var expires = "expires=" + date.toUTCString();
						document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
					},

					get: function(name) {
						var cookies = document.cookie.split(";");
						var prefix = name + "=";
						for( let i = 0; i < cookies.length; i++ ) {
							var cookie = cookies[i].trim();
							if( cookie.startsWith(prefix) ) {
								try { return decodeURIComponent(cookie.substring(prefix.length)); }
								catch(e) { return cookie.substring(prefix.length); }
							}
						}
						return null;
					},

					remove: function(name) {
						document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
					}
				};
			}(),

			scrollTo: function(offset = 0, speed = 1250, easing, behavior = 'smooth') {
				if( easing && (typeof jQuery !== 'undefined' && typeof jQuery.easing["easeOutQuad"] !== 'undefined') ) {
					jQuery('body,html').stop(true).animate({
						'scrollTop': Number(offset)
					}, Number( speed ), easing );
				} else {
					var smoothScroll = 'scrollBehavior' in document.documentElement.style;

					if( typeof window.scroll === 'function' && smoothScroll ) {
						window.scroll({
							top: Number(offset),
							behavior: behavior
						});
					} else {
						var body = Core.getVars.elBody;
						var rootEl = Core.getVars.elRoot;

						body.scrollIntoView();
						rootEl.scrollIntoView();

						var scrollToTop = function() {
							if (body.scrollTop > Number(offset) || rootEl.scrollTop > Number(offset)) {
								body.scrollTop -= 20;
								rootEl.scrollTop -= 20;
								setTimeout(scrollToTop, 10);
							}
						};

						scrollToTop();
					}
				}
			},

			smoothScroll: function() {
				new initSmoothScrollfunction(document,90,5);

				function initSmoothScrollfunction(target, speed, smooth) {
					if (target === document)
						target = (document.scrollingElement
							  || document.documentElement
							  || document.body.parentNode
							  || document.body); // cross browser support for document scrolling

					var moving = false;
					var pos = target.scrollTop;
					var frame = target === document.body
							  && document.documentElement
							  ? document.documentElement
							  : target; // safari is the new IE

					target.addEventListener('mousewheel', scrolled, { passive: false });
					target.addEventListener('DOMMouseScroll', scrolled, { passive: false });

					function scrolled(e) {
						e.preventDefault(); // disable default scrolling

						var delta = normalizeWheelDelta(e);

						pos += -delta * speed;
						pos = Math.max(0, Math.min(pos, target.scrollHeight - frame.clientHeight)); // limit scrolling

						if (!moving) update();
					}

					function normalizeWheelDelta(e){
						if(e.detail){
							if(e.wheelDelta)
								return e.wheelDelta/e.detail/40 * (e.detail>0 ? 1 : -1); // Opera
							else
								return -e.detail/3; // Firefox
						}else
							return e.wheelDelta/120; // IE,Safari,Chrome
					};

					function update() {
						moving = true;

						var delta = (pos - target.scrollTop) / smooth;

						target.scrollTop += delta;

						if (Math.abs(delta) > 0.5)
							window.requestAnimationFrame(update);
						else
							moving = false;
					}
				}
			},

			loadCSS: function(params) {
				var file = params.file;
				var htmlID = params.id || false;
				var cssFolder = params.cssFolder || false;

				if( !file ) {
					return false;
				}

				if( htmlID && document.getElementById(htmlID) ) {
					return false;
				}

				var htmlStyle = document.createElement('link');

				htmlStyle.id = htmlID;
				htmlStyle.href = cssFolder ? options.cssFolder+file : file;
				htmlStyle.rel = 'stylesheet';
				htmlStyle.type = 'text/css';

				vars.elHead.appendChild(htmlStyle);
				return true;
			},

			loadJS: function(params) {
				var file = params.file;
				var htmlID = params.id || false;
				var type = params.type || false;
				var callback = params.callback;
				var async = params.async || true;
				var defer = params.defer || true;
				var jsFolder = params.jsFolder || false;

				if( !file ) {
					return false;
				}

				if( htmlID && document.getElementById(htmlID) ) {
					return false;
				}

				var htmlScript = document.createElement('script');

				if ( typeof callback !== 'undefined' ) {
					if( typeof callback != 'function' ) {
						throw new Error('Not a valid callback!');
					} else {
						htmlScript.onload = callback;
					}
				}

				htmlScript.id = htmlID;
				htmlScript.src = jsFolder ? options.jsFolder+file : file;
				if( type ) {
					htmlScript.type = type;
				}
				htmlScript.async = async ? true : false;
				htmlScript.defer = defer ? true : false;

				vars.elBody.appendChild(htmlScript);
				return true;
			},

			isFuncTrue: async function(fn) {
				if( 'function' !== typeof fn ) {
					return false;
				}

				var counter = 0;

				return new Promise( function(resolve, reject) {
					if(fn()) {
						resolve(true);
					} else {
						var int = setInterval( function() {
							if(fn()) {
								clearInterval( int );
								resolve(true);
							} else {
								if( counter > 30 ) {
									clearInterval( int );
									reject(true);
								}
							}
							counter++;
						}, 333);
					}
				}).catch( function(error) {
					console.log('Function does not exist: ' + fn);
				});
			},

			initFunction: function(params) {
				vars.elBody.classList.add(params.class);
				Core.addEvent(window, params.event);
				vars.events[params.event] = true;
			},

			topScrollOffset: function() {
				var headerHeight = 0;
				var pageMenuOffset = vars.elPageMenu?.querySelector('#page-menu-wrap')?.offsetHeight || 0;

				if( vars.elBody.classList.contains('is-expanded-menu') ) {
					if( vars.elHeader?.classList.contains('sticky-header') ) {
						headerHeight = vars.elHeaderWrap.offsetHeight;
					}

					if( vars.elPageMenu?.classList.contains('dots-menu') || !vars.elPageMenu?.classList.contains('sticky-page-menu') ) {
						pageMenuOffset = 0;
					}
				}

				Core.getVars.topScrollOffset = headerHeight + pageMenuOffset + options.scrollOffset;
			},
		};
	}();

	var Base = function() {
		return {
			init: function() {
				Mobile.any() && vars.elBody.classList.add('device-touch');
			},

			menuBreakpoint: function() {
				if( Core.getVars.menuBreakpoint <= Core.viewport().width ) {
					vars.elBody.classList.add( 'is-expanded-menu' );
				} else {
					vars.elBody.classList.remove( 'is-expanded-menu' );
				}

				if( vars.elPageMenu ) {
					if( typeof Core.getVars.pageMenuBreakpoint === 'undefined' ) {
						Core.getVars.pageMenuBreakpoint = Core.getVars.menuBreakpoint;
					}

					if( Core.getVars.pageMenuBreakpoint <= Core.viewport().width ) {
						vars.elBody.classList.add( 'is-expanded-pagemenu' );
					} else {
						vars.elBody.classList.remove( 'is-expanded-pagemenu' );
					}
				}
			},

			goToTop: function() {
				CNVS.GoToTop.init('#gotoTop');
			},

			stickFooterOnSmall: function() {
				CNVS.StickFooterOnSmall && CNVS.StickFooterOnSmall.init('#footer');
			},

			logo: function() {
				CNVS.Logo.init('#logo');
			},

			headers: function() {
				Core.getVars.headerClasses = vars.elHeader?.className || '';
				Core.getVars.headerWrapClasses = vars.elHeaderWrap?.className || '';
				CNVS.Headers.init('#header');
			},

			menus: function() {
				CNVS.Menus.init('#header');
			},

			pageMenu: function() {
				CNVS.PageMenu && CNVS.PageMenu.init('#page-menu');
			},

			sliderDimensions: function() {
				CNVS.SliderDimensions && CNVS.SliderDimensions.init('.slider-element');
			},

			sliderMenuClass: function() {
				CNVS.SliderMenuClass && CNVS.SliderMenuClass.init('.transparent-header + .swiper_wrapper,.swiper_wrapper + .transparent-header,.transparent-header + .revslider-wrap,.revslider-wrap + .transparent-header');
			},

			topSearch: function() {
				CNVS.TopSearch.init('#top-search-trigger');
			},

			topCart: function() {
				CNVS.TopCart.init('#top-cart');
			},

			sidePanel: function() {
				CNVS.SidePanel && CNVS.SidePanel.init('#side-panel');
			},

			adaptiveColorScheme: function() {
				CNVS.AdaptiveColorScheme && CNVS.AdaptiveColorScheme.init('.adaptive-color-scheme');
			},

			portfolioAjax: function() {
				CNVS.PortfolioAjax && CNVS.PortfolioAjax.init('.portfolio-ajax');
			},

			cursor: function() {
				if( vars.customCursor ) {
					CNVS.Cursor && CNVS.Cursor.init('body');
				}
			},

			setBSTheme: function() {
				if( vars.elBody.classList.contains('dark') ) {
					document.querySelector('html').setAttribute('data-bs-theme', 'dark');
				} else {
					document.querySelector('html').removeAttribute('data-bs-theme');
					document.querySelectorAll('.dark')?.forEach( function(el) {
						el.setAttribute('data-bs-theme', 'dark');
					});
				}

				vars.elBody.querySelectorAll('.not-dark')?.forEach( function(el) {
					el.setAttribute('data-bs-theme', 'light');
				});
			}
		}
	}();

	var Modules = function() {
		return {
			bootstrap: function() {
				if( document.querySelector('[data-bs-toggle], [data-bs-target], [data-bs-spy], [data-bs-dismiss], [data-bs-ride], [data-bs-parent], [data-bs-slide], [data-bs-slide-to]') ) {
					CNVS.Bootstrap && CNVS.Bootstrap.init('body');
				}
			},

			resizeVideos: function(element) {
				CNVS.ResizeVideos && CNVS.ResizeVideos.init(element ? element : 'iframe[src*="youtube"],iframe[src*="vimeo"],iframe[src*="dailymotion"],iframe[src*="maps.google.com"],iframe[src*="google.com/maps"]');
			},

			pageTransition: function() {
				if( vars.pageTransition ) {
					CNVS.PageTransition && CNVS.PageTransition.init('body');
				}
			},

			lazyLoad: function(element) {
				CNVS.LazyLoad && CNVS.LazyLoad.init(element ? element : '.lazy:not(.lazy-loaded)');
			},

			dataClasses: function() {
				CNVS.DataClasses && CNVS.DataClasses.init('[data-class]');
			},

			dataHeights: function() {
				CNVS.DataHeights && CNVS.DataHeights.init('[data-height-xxl],[data-height-xl],[data-height-lg],[data-height-md],[data-height-sm],[data-height-xs]');
			},

			lightbox: function(element) {
				CNVS.Lightbox && CNVS.Lightbox.init(element ? element : '[data-lightbox]');
			},

			modal: function(element) {
				CNVS.Modal && CNVS.Modal.init(element ? element : '.modal-on-load');
			},

			animations: function(element) {
				CNVS.Animations && CNVS.Animations.init(element ? element : '[data-animate]');
			},

			hoverAnimations: function(element) {
				CNVS.HoverAnimations && CNVS.HoverAnimations.init(element ? element : '[data-hover-animate]');
			},

			gridInit: function(element) {
				CNVS.Grid && CNVS.Grid.init(element ? element : '.grid-container');
			},

			filterInit: function(element) {
				CNVS.Filter && CNVS.Filter.init(element ? element : '.grid-filter,.custom-filter');
			},

			canvasSlider: function(element) {
				CNVS.CanvasSlider && CNVS.CanvasSlider.init(element ? element : '.swiper_wrapper');
			},

			sliderParallax: function() {
				CNVS.SliderParallax && CNVS.SliderParallax.init('.slider-parallax');
			},

			flexSlider: function(element) {
				CNVS.FlexSlider && CNVS.FlexSlider.init(element ? element : '.fslider');
			},

			html5Video: function(element) {
				CNVS.FullVideo && CNVS.FullVideo.init(element ? element : '.video-wrap');
			},

			youtubeBgVideo: function(element) {
				CNVS.YoutubeBG && CNVS.YoutubeBG.init(element ? element : '.yt-bg-player');
			},

			toggle: function(element) {
				CNVS.Toggle && CNVS.Toggle.init(element ? element : '.toggle');
			},

			accordion: function(element) {
				CNVS.Accordion && CNVS.Accordion.init(element ? element : '.accordion');
			},

			counter: function(element) {
				CNVS.Counter && CNVS.Counter.init(element ? element : '.counter');
			},

			countdown: function(element) {
				CNVS.Countdown && CNVS.Countdown.init(element ? element : '.countdown');
			},

			gmap: function(element) {
				CNVS.GoogleMaps && CNVS.GoogleMaps.init(element ? element : '.gmap');
			},

			roundedSkills: function(element) {
				CNVS.RoundedSkills && CNVS.RoundedSkills.init(element ? element : '.rounded-skill');
			},

			progress: function(element) {
				CNVS.Progress && CNVS.Progress.init(element ? element : '.skill-progress');
			},

			twitterFeed: function(element) {
				CNVS.Twitter && CNVS.Twitter.init(element ? element : '.twitter-feed');
			},

			flickrFeed: function(element) {
				CNVS.Flickr && CNVS.Flickr.init(element ? element : '.flickr-feed');
			},

			instagram: function(element) {
				CNVS.Instagram && CNVS.Instagram.init(element ? element : '.instagram-photos');
			},

			// Dribbble Pending

			navTree: function(element) {
				CNVS.NavTree && CNVS.NavTree.init(element ? element : '.nav-tree');
			},

			carousel: function(element) {
				CNVS.Carousel && CNVS.Carousel.init(element ? element : '.carousel-widget');
			},

			masonryThumbs: function(element) {
				CNVS.MasonryThumbs && CNVS.MasonryThumbs.init(element ? element : '.masonry-thumbs');
			},

			notifications: function(element) {
				CNVS.Notifications && CNVS.Notifications.init(element ? element : false);
			},

			textRotator: function(element) {
				CNVS.TextRotator && CNVS.TextRotator.init(element ? element : '.text-rotater');
			},

			onePage: function(element) {
				CNVS.OnePage && CNVS.OnePage.init(element ? element : '[data-scrollto],.one-page-menu');
			},

			ajaxForm: function(element) {
				CNVS.AjaxForm && CNVS.AjaxForm.init(element ? element : '.form-widget');
			},

			subscribe: function(element) {
				CNVS.Subscribe && CNVS.Subscribe.init(element ? element : '.subscribe-widget');
			},

			conditional: function(element) {
				CNVS.Conditional && CNVS.Conditional.init(element ? element : '.form-group[data-condition],.form-group[data-conditions]');
			},

			shapeDivider: function(element) {
				CNVS.ShapeDivider && CNVS.ShapeDivider.init(element ? element : '.shape-divider');
			},

			stickySidebar: function(element) {
				CNVS.StickySidebar && CNVS.StickySidebar.init(element ? element : '.sticky-sidebar-wrap');
			},

			cookies: function(element) {
				CNVS.Cookies && CNVS.Cookies.init(element ? element : '.gdpr-settings,[data-cookies]');
			},

			quantity: function(element) {
				CNVS.Quantity && CNVS.Quantity.init(element ? element : '.quantity');
			},

			readmore: function(element) {
				CNVS.ReadMore && CNVS.ReadMore.init(element ? element : '[data-readmore]');
			},

			pricingSwitcher: function(element) {
				CNVS.PricingSwitcher && CNVS.PricingSwitcher.init(element ? element : '.pricing-tenure-switcher');
			},

			ajaxTrigger: function(element) {
				CNVS.AjaxTrigger && CNVS.AjaxTrigger.init(element ? element : '[data-ajax-loader]');
			},

			videoFacade: function(element) {
				CNVS.VideoFacade && CNVS.VideoFacade.init(element ? element : '.video-facade');
			},

			schemeToggle: function(element) {
				CNVS.SchemeToggle && CNVS.SchemeToggle.init(element ? element : '.body-scheme-toggle');
			},

			clipboardCopy: function(element) {
				CNVS.Clipboard && CNVS.Clipboard.init(element ? element : '.clipboard-copy');
			},

			codeHighlight: function(element) {
				CNVS.CodeHighlight && CNVS.CodeHighlight.init(element ? element : '.code-highlight');
			},

			tips: function() {
				if( vars.tips ) {
					CNVS.Tips && CNVS.Tips.init('body');
				}
			},

			textSplitter: function(element) {
				CNVS.TextSplitter && CNVS.TextSplitter.init(element ? element : '.text-splitter');
			},

			mediaActions: function(element) {
				CNVS.MediaActions && CNVS.MediaActions.init(element ? element : '.media-wrap');
			},

			viewportDetect: function(element) {
				CNVS.ViewportDetect && CNVS.ViewportDetect.init(element ? element : '.viewport-detect');
			},

			scrollDetect: function(element) {
				CNVS.ScrollDetect && CNVS.ScrollDetect.init(element ? element : '.scroll-detect');
			},

			fontSizer: function(element) {
				CNVS.FontSizer && CNVS.FontSizer.init(element ? element : '.font-sizer');
			},

			hover3D: function(element) {
				CNVS.Hover3D && CNVS.Hover3D.init(element ? element : '.hover-3d');
			},

			buttons: function(element) {
				CNVS.Buttons && CNVS.Buttons.init(element ? element : '.button-text-effect');
			},

			bsComponents: function(element) {
				CNVS.BSComponents && CNVS.BSComponents.init(element ? element : '[data-bs-toggle="tooltip"],[data-bs-toggle="popover"],[data-bs-toggle="tab"],[data-bs-toggle="pill"],.style-msg');
			}
		};
	}();

	var Mobile = function() {
		return {
			Android: function()  {
				return navigator.userAgent.match(/Android/i);
			},
			BlackBerry: function()  {
				return navigator.userAgent.match(/BlackBerry/i);
			},
			iOS: function()  {
				return navigator.userAgent.match(/iPhone|iPad|iPod/i);
			},
			Opera: function()  {
				return navigator.userAgent.match(/Opera Mini/i);
			},
			Windows: function()  {
				return navigator.userAgent.match(/IEMobile/i);
			},
			any: function()  {
				return (Mobile.Android() || Mobile.BlackBerry() || Mobile.iOS() || Mobile.Opera() || Mobile.Windows());
			}
		}
	}();

	// Add your Custom JS Codes here
	var Custom = function() {
		return {
			onReady: function() {
				// Add JS Codes here to Run on Document Ready
			},

			onLoad: function() {
				// Add JS Codes here to Run on Window Load
			},

			onResize: function() {
				// Add JS Codes here to Run on Window Resize
			}
		}
	}();

	var DocumentOnResize = function() {
		return {
			init: function() {
				Core.viewport();
				Core.breakpoints();
				Base.menuBreakpoint();

				Core.run(vars.resizers);

				Custom.onResize();
				Core.addEvent( window, 'cnvsResize' );
			}
		};
	}();

	var DocumentOnReady = function() {
		return {
			init: function() {
				Core.breakpoints();
				Core.colorScheme();
				Core.runBase();
				Core.runModules();
				Core.topScrollOffset();

				if( vars.smoothScroll ) {
					new Core.smoothScroll();
				}

				DocumentOnReady.windowscroll();

				Custom.onReady();
			},

			windowscroll: function() {
				Core.scrollEnd( function() {
					Base.pageMenu();
				});
			}
		};
	}();

	var DocumentOnLoad = function() {
		return {
			init: function() {
				Custom.onLoad();
			}
		};
	}();

	document.addEventListener( 'DOMContentLoaded', function() {
		DocumentOnReady.init();
	});

	window.addEventListener('load', function() {
		DocumentOnLoad.init();
	});

	window.addEventListener('resize', Core.debounce(function() {
		DocumentOnResize.init();
	}, 250));

	var canvas_umd = {
		Core,
		Base,
		Modules,
		Mobile,
		Custom,
	};

	return canvas_umd;
})));

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	( global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.CNVS = factory() );
} (this, (function() {
	// USE STRICT
	"use strict";

	/**
	 * --------------------------------------------------------------------------
	 * DO NOT DELETE!! Start (Required)
	 * --------------------------------------------------------------------------
	 */
	if( typeof SEMICOLON === 'undefined' || !SEMICOLON.Core || !SEMICOLON.Base || !SEMICOLON.Modules || !SEMICOLON.Mobile ) {
		return false;
	}

	var __core = SEMICOLON.Core;
	var __base = SEMICOLON.Base;
	var __modules = SEMICOLON.Modules;
	var __mobile = SEMICOLON.Mobile;
	// DO NOT DELETE!! End

	return {
		/**
		 * --------------------------------------------------------------------------
		 * Logo Functions Start (Required)
		 * --------------------------------------------------------------------------
		 */
		Logo: function() {
			var _styleId = 'cnvs-logo-variant-styles';

			return {
				init: function(selector) {
					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ) return true;

					var head = __core.getVars.elHead;
					var logoEl = selector[0];
					var rules = [];

					if( logoEl.querySelector('.logo-dark') ) {
						rules.push(
							'.dark #header-wrap:not(.not-dark) #logo [class^="logo-"], .dark .header-row:not(.not-dark) #logo [class^="logo-"] { display: none; }',
							'.dark #header-wrap:not(.not-dark) #logo .logo-dark, .dark .header-row:not(.not-dark) #logo .logo-dark { display: flex; }'
						);
					}

					if( logoEl.querySelector('.logo-sticky') ) {
						rules.push(
							'.sticky-header #logo [class^="logo-"] { display: none !important; }',
							'.sticky-header #logo .logo-sticky { display: flex !important; }'
						);
					}

					if( logoEl.querySelector('.logo-sticky-shrink') ) {
						rules.push(
							'.sticky-header-shrink #logo [class^="logo-"] { display: none; }',
							'.sticky-header-shrink #logo .logo-sticky-shrink { display: flex; }'
						);
					}

					if( logoEl.querySelector('.logo-mobile') ) {
						rules.push(
							'body:not(.is-expanded-menu) #logo [class^="logo-"] { display: none; }',
							'body:not(.is-expanded-menu) #logo .logo-mobile { display: flex; }'
						);
					}

					if( rules.length === 0 ) return;

					var existing = document.getElementById(_styleId);
					if( existing ) existing.remove();

					var style = document.createElement('style');
					style.id = _styleId;
					style.textContent = rules.join('\n');
					head.appendChild(style);
				}
			};
		}(),
		// Logo Functions End

		/**
		 * --------------------------------------------------------------------------
		 * GoToTop Functions Start (Required)
		 * --------------------------------------------------------------------------
		 */
		GoToTop: function() {
			var _state = {
				element: null,
				speed: 700,
				easing: null,
				mobile: false,
				offset: 450,
				isActive: false,
				rafPending: false,
				clickHandler: null,
				scrollHandler: null,
			};

			var _evalMobileDisabled = function() {
				if( _state.mobile ) return false;
				var body = __core.getVars.elBody.classList;
				return body.contains('device-xs') || body.contains('device-sm') || body.contains('device-md');
			};

			var _update = function() {
				_state.rafPending = false;

				if( _evalMobileDisabled() ) {
					if( _state.isActive ) {
						__core.getVars.elBody.classList.remove('gototop-active');
						_state.isActive = false;
					}
					return;
				}

				var shouldBeActive = window.scrollY > _state.offset;
				if( shouldBeActive === _state.isActive ) return;
				_state.isActive = shouldBeActive;

				if( shouldBeActive ) {
					__core.getVars.elBody.classList.add('gototop-active');
				} else {
					__core.getVars.elBody.classList.remove('gototop-active');
				}
			};

			var _requestUpdate = function() {
				if( _state.rafPending ) return;
				_state.rafPending = true;
				window.requestAnimationFrame(_update);
			};

			return {
				init: function(selector) {
					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ) return true;

					var el = selector[0];
					_state.element = el;
					_state.speed = Number(el.getAttribute('data-speed')) || 700;
					_state.easing = el.getAttribute('data-easing');
					_state.mobile = el.getAttribute('data-mobile') === 'true';
					_state.offset = Number(el.getAttribute('data-offset')) || 450;

					if( _state.clickHandler ) {
						el.removeEventListener('click', _state.clickHandler);
					}
					_state.clickHandler = function(e) {
						e.preventDefault();
						__core.scrollTo(0, _state.speed, _state.easing);
					};
					el.addEventListener('click', _state.clickHandler);

					if( !_state.scrollHandler ) {
						_state.scrollHandler = _requestUpdate;
						window.addEventListener('scroll', _state.scrollHandler, { passive: true });
					}

					_update();
				}
			};
		}(),
		// GoToTop Functions End

		/**
		 * --------------------------------------------------------------------------
		 * StickFooterOnSmall Functions Start
		 * --------------------------------------------------------------------------
		 */
		StickFooterOnSmall: function() {
			return {
				init: function(selector) {
					selector = __core.getSelector( selector, false );
					if( !selector || selector.length < 1 ){
						return true;
					}

					var elFooter  = __core.getVars.elFooter,
						elWrapper = __core.getVars.elWrapper,
						elBody    = __core.getVars.elBody,
						elAppMenu = __core.getVars.elAppMenu;

					if( !elFooter || !elWrapper || !elBody ) return true;

					elFooter.style.marginTop = '';

					var windowH = __core.viewport().height,
						wrapperH = elWrapper.offsetHeight;

					if( !elBody.classList.contains('sticky-footer') && elWrapper.contains( elFooter ) ) {
						if( windowH > wrapperH ) {
							elFooter.style.marginTop = (windowH - wrapperH) + 'px';
						}
					}

					if( elAppMenu ) {
						var rect = elAppMenu.getBoundingClientRect();
						if( (windowH - (rect.top + rect.height)) === 0 ) {
							elFooter.style.marginBottom = elAppMenu.offsetHeight + 'px';
						}
					}

					__core.getVars.resizers.stickfooter = function() {
						__base.stickFooterOnSmall();
					};
				}
			};
		}(),
		// StickFooterOnSmall Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Header Functions Start (Required)
		 * --------------------------------------------------------------------------
		 */
		Headers: function() {
			var _state = {
				isSticky: false,
				isShrunk: false,
				menuClassApplied: null,
				rafPending: false,
				resizeTimer: null,
			};

			var _offset = function() {
				var elHeader = __core.getVars.elHeader;
				var elHeaderInc = document.querySelector('.include-header');

				__core.getVars.headerOffset = elHeader.offsetTop;
				if( __core.getVars.elHeader?.classList.contains('floating-header') || elHeaderInc?.classList.contains('include-topbar') ) {
					__core.getVars.headerOffset = __core.offset(elHeader).top;
				}
				__core.getVars.elHeaderWrap?.classList.add('position-absolute');
				__core.getVars.headerWrapOffset = __core.getVars.headerOffset + __core.getVars.elHeaderWrap?.offsetTop;
				__core.getVars.elHeaderWrap?.classList.remove('position-absolute');

				if( elHeader.hasAttribute('data-sticky-offset') ) {
					var headerDefinedOffset = elHeader.getAttribute('data-sticky-offset');
					if( headerDefinedOffset == 'full' ) {
						__core.getVars.headerWrapOffset = __core.viewport().height;
						var headerOffsetNegative = elHeader.getAttribute('data-sticky-offset-negative');
						if( typeof headerOffsetNegative !== 'undefined' && headerOffsetNegative !== null ) {
							if( headerOffsetNegative == 'auto' ) {
								__core.getVars.headerWrapOffset = __core.getVars.headerWrapOffset - elHeader.offsetHeight - 1;
							} else {
								__core.getVars.headerWrapOffset = __core.getVars.headerWrapOffset - Number(headerOffsetNegative) - 1;
							}
						}
					} else {
						__core.getVars.headerWrapOffset = Number(headerDefinedOffset);
					}
				}
			};

			var _applyMenuClass = function(type) {
				if( _state.menuClassApplied === type ) return;

				var newClassesArray = '';

				if( type === 'responsive' ) {
					if( __core.getVars.elBody.classList.contains('is-expanded-menu') ) return;
					if( __core.getVars.mobileHeaderClasses ) {
						newClassesArray = __core.getVars.mobileHeaderClasses.split(/ +/);
					}
				} else {
					if( !__core.getVars.elHeader.classList.contains('sticky-header') ) return;
					if( __core.getVars.stickyHeaderClasses ) {
						newClassesArray = __core.getVars.stickyHeaderClasses.split(/ +/);
					}
				}

				_state.menuClassApplied = type;

				if( !newClassesArray.length ) {
					__base.setBSTheme();
					return;
				}

				var elHeader = __core.getVars.elHeader;
				var elHeaderWrap = __core.getVars.elHeaderWrap;

				for( var i = 0, len = newClassesArray.length; i < len; i++ ) {
					var cls = newClassesArray[i];
					if( cls === 'not-dark' ) {
						elHeader.classList.remove('dark');
						if( elHeaderWrap && !elHeaderWrap.classList.contains('not-dark') ) {
							elHeaderWrap.classList.add('not-dark');
						}
					} else if( cls === 'dark' ) {
						elHeaderWrap?.classList.remove('not-dark', 'force-not-dark');
						if( !elHeader.classList.contains(cls) ) {
							elHeader.classList.add(cls);
						}
					} else if( !elHeader.classList.contains(cls) ) {
						elHeader.classList.add(cls);
					}
				}

				__base.setBSTheme();
			};

			var _enterSticky = function() {
				if( _state.isSticky ) return;
				_state.isSticky = true;
				__core.getVars.elHeader.classList.add('sticky-header');
				_applyMenuClass('sticky');
			};

			var _resetHeader = function() {
				_state.isSticky = false;
				_state.isShrunk = false;

				__core.getVars.elHeader.className = __core.getVars.headerClasses;
				__core.getVars.elHeader.classList.remove('sticky-header', 'sticky-header-shrink');

				if( __core.getVars.elHeaderWrap ) {
					__core.getVars.elHeaderWrap.className = __core.getVars.headerWrapClasses;
				}
				if( !__core.getVars.elHeaderWrap?.classList.contains('force-not-dark') ) {
					__core.getVars.elHeaderWrap?.classList.remove('not-dark');
				}

				_state.menuClassApplied = null;
				__base.sliderMenuClass();
			};

			var _exitSticky = function() {
				if( !_state.isSticky && _state.menuClassApplied !== 'sticky' ) return;
				_resetHeader();

				if( __core.getVars.mobileSticky == 'true' ) {
					_applyMenuClass('responsive');
				}
			};

			var _setShrunk = function(shouldShrink) {
				if( _state.isShrunk === shouldShrink ) return;
				_state.isShrunk = shouldShrink;
				if( shouldShrink ) {
					__core.getVars.elHeader.classList.add('sticky-header-shrink');
				} else {
					__core.getVars.elHeader.classList.remove('sticky-header-shrink');
				}
			};

			var _stickyUpdate = function() {
				_state.rafPending = false;

				if( !__core.getVars.elBody.classList.contains('is-expanded-menu') && __core.getVars.mobileSticky != 'true' ) {
					return;
				}

				var stickyOffset = __core.getVars.headerWrapOffset;
				var scrollY = window.scrollY;

				if( scrollY > stickyOffset ) {
					if( __core.getVars.elBody.classList.contains('side-header') ) return;

					_enterSticky();

					if( __core.getVars.elBody.classList.contains('is-expanded-menu')
						&& __core.getVars.stickyShrink == 'true'
						&& !__core.getVars.elHeader.classList.contains('no-sticky') ) {
						_setShrunk( (scrollY - stickyOffset) > Number(__core.getVars.stickyShrinkOffset) );
					}
				} else {
					_exitSticky();
				}
			};

			var _requestSticky = function() {
				if( _state.rafPending ) return;
				_state.rafPending = true;
				window.requestAnimationFrame(_stickyUpdate);
			};

			var _includeHeader = function() {
				var elHeaderInc = document.querySelector('.include-header');
				var elHeader = __core.getVars.elHeader;
				__core.getVars.headerHeight = elHeader.offsetHeight;

				if( !elHeaderInc ) return true;

				elHeaderInc.style.marginTop = '';

				if( !__core.getVars.elBody.classList.contains('is-expanded-menu') && !elHeader.classList.contains('transparent-header-responsive') ) {
					return true;
				}

				if( elHeader.classList.contains('floating-header') || elHeaderInc.classList.contains('include-topbar') ) {
					__core.getVars.headerHeight = elHeader.offsetHeight + __core.offset(elHeader).top;
				}

				elHeaderInc.style.marginTop = (__core.getVars.headerHeight * -1) + 'px';
				__modules.sliderParallax();
			};

			var _sideHeader = function() {
				var headerTrigger = document.getElementById("header-trigger");
				if( headerTrigger ) {
					headerTrigger.onclick = function(e) {
						e.preventDefault();
						__core.getVars.elBody.classList.contains('open-header') && __core.getVars.elBody.classList.toggle("side-header-open");
					};
				}
			};

			return {
				init: function(selector) {
					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ) return true;

					var elHeader = __core.getVars.elHeader;
					var isSticky = !elHeader.classList.contains('no-sticky');
					var headerWrapClone = elHeader.querySelector('.header-wrap-clone');

					__core.getVars.stickyHeaderClasses = elHeader.getAttribute('data-sticky-class');
					__core.getVars.mobileHeaderClasses = elHeader.getAttribute('data-responsive-class');
					__core.getVars.stickyShrink = elHeader.getAttribute('data-sticky-shrink') || 'true';
					__core.getVars.stickyShrinkOffset = elHeader.getAttribute('data-sticky-shrink-offset') || 300;
					__core.getVars.mobileSticky = elHeader.getAttribute('data-mobile-sticky') || 'false';
					__core.getVars.headerHeight = elHeader.offsetHeight;

					if( !headerWrapClone ) {
						headerWrapClone = document.createElement('div');
						headerWrapClone.classList = 'header-wrap-clone';
						__core.getVars.elHeaderWrap?.parentNode.insertBefore( headerWrapClone, __core.getVars.elHeaderWrap?.nextSibling);
					}

					if( isSticky ) {
						var initSticky = function() {
							_offset();
							_stickyUpdate();
						};
						if( document.readyState === 'complete' ) {
							window.requestAnimationFrame(initSticky);
						} else {
							window.addEventListener('load', function() {
								window.requestAnimationFrame(initSticky);
							}, { once: true });
						}

						window.addEventListener('scroll', _requestSticky, { passive: true });
					}

					_applyMenuClass('responsive');
					_includeHeader();
					_sideHeader();

					__core.getVars.resizers.headers = function() {
						clearTimeout(_state.resizeTimer);
						_state.resizeTimer = setTimeout( function() {
							_resetHeader();
							if( isSticky ) {
								_offset();
								_stickyUpdate();
							}
							_applyMenuClass('responsive');
							_includeHeader();
						}, 150);
					};
				}
			};
		}(),
		// Header Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Menu Functions Start (Required)
		 * --------------------------------------------------------------------------
		 */
		Menus: function() {
			var _docClickHandler = null;

			var _init = function() {
				__core.getVars.headerWrapHeight = __core.getVars.elHeaderWrap?.offsetHeight;

				var onClickMenus = [].slice.call(__core.getVars.elPrimaryMenus).filter( function(elem) {
					return elem.matches('.on-click');
				});

				var onClickTopMenus = document.querySelectorAll('.top-links.on-click');

				var onClickMenuCurrent = [];

				onClickMenus.forEach( function(pMenu) {
					onClickMenuCurrent.push(pMenu.querySelector('.current'));
				});

				var onClickTopMenuCurrent = [];

				onClickTopMenus.forEach( function(topMenu) {
					onClickTopMenuCurrent.push(topMenu.querySelector('.current'));
				});

				if( _docClickHandler ) {
					document.removeEventListener('click', _docClickHandler, false);
				}
				_docClickHandler = function(e) {
					if( !e.target.closest('.primary-menu-trigger') && !e.target.closest('.primary-menu') ) {
						_reset();
						_functions();
					}

					if ( !e.target.closest('.primary-menu.on-click') ) {
						onClickMenus.forEach( function(pMenu) {
							pMenu.querySelectorAll('.menu-item').forEach( function(item) {
								item.classList.remove('current');
							});
						});

						onClickMenuCurrent?.forEach( function(current) {
							current?.classList.add('current');
						});
					}

					if ( !e.target.closest('.top-links.on-click') ) {
						onClickTopMenus.forEach( function(topMenu) {
							topMenu.querySelectorAll('.top-links-sub-menu,.top-links-section').forEach( function(item) {
								item.classList.remove('d-block');
							});
						});

						onClickTopMenus.forEach( function(topMenu) {
							topMenu.querySelectorAll('.top-links-item').forEach( function(item) {
								item.classList.remove('current');
							});
						});

						onClickTopMenuCurrent?.forEach( function(current) {
							current?.classList.add('current');
						});
					}
				};
				document.addEventListener('click', _docClickHandler, false);

				document.querySelectorAll( '.menu-item' ).forEach(function(el) {
					if( el.querySelectorAll('.sub-menu-container').length > 0 ) {
						el.classList.add('sub-menu');
					}

					if( !el.classList.contains('mega-menu-title') && el.querySelectorAll('.sub-menu-container').length > 0 && el.querySelectorAll('.sub-menu-trigger').length < 1 ) {
						var subMenuTrigger = document.createElement('button');
						subMenuTrigger.classList = 'sub-menu-trigger fa-solid fa-chevron-right';
						subMenuTrigger.innerHTML = '<span class="visually-hidden">Open Sub-Menu</span>';
						el.append( subMenuTrigger );
					}
				});
			};

			var _reset = function() {
				var body = __core.getVars.elBody,
					subMenusSel = '.mega-menu-content, .sub-menu-container',
					menuItemSel = '.menu-item';

				document.querySelectorAll('.primary-menu-trigger').forEach( function(el) {
					el.classList.remove('primary-menu-trigger-active');
				});

				__core.getVars.elPrimaryMenus.forEach( function(el) {
					if( !body.classList.contains('is-expanded-menu') ) {
						el.querySelector('.menu-container')?.classList.remove('d-block');
					} else {
						el.querySelector('.menu-container')?.classList.remove('d-block', 'd-none');

						el.querySelectorAll(subMenusSel)?.forEach( function(item) {
							item.classList.remove('d-none');
						});

						document.querySelectorAll('.menu-container:not(.mobile-primary-menu)').forEach( function(el) {
							el.style.display = '';
						});

						__core.getVars.elPrimaryMenus.forEach( function(el) {
							el.querySelectorAll('.mobile-primary-menu')?.forEach( function(elem) {
								elem.classList.remove('d-block');
							});
						});
					}

					el.querySelectorAll(subMenusSel)?.forEach( function(item) {
						item.classList.remove('d-block');
					});

					el.classList.remove('primary-menu-active');

					var classes = body.className.split(" ").filter( function(classText) {
						return !classText.startsWith('primary-menu-open');
					});

					body.className = classes.join(" ").trim();
				});
			};

			var _withIcon = function() {
				document.querySelectorAll('.mega-menu-content, .sub-menu-container').forEach( function(subMenu) {
					subMenu.querySelectorAll('.menu-item').forEach( function(item) {
						var link = item.querySelector('.menu-link');
						link?.querySelector('i') && link.querySelector('span')?.classList.add('menu-subtitle-icon-offset');
					});
				});
			};

			var _arrows = function() {
				var addArrow = function(menuItemDiv) {
					if( menuItemDiv && !menuItemDiv.querySelector('.sub-menu-indicator') ) {
						var arrow = document.createElement("i");
						arrow.classList.add('sub-menu-indicator');

						var customArrow = menuItemDiv.closest('.primary-menu')?.getAttribute('data-arrow-class') || 'fa-solid fa-caret-down';
						customArrow && customArrow.split(" ").forEach( function(className) {
							arrow.classList.add(className);
						});

						menuItemDiv.append(arrow);
					}
				};

				// Arrows for Top Links Items
				document.querySelectorAll( '.top-links-item' ).forEach( function(menuItem) {
					var menuItemDiv = menuItem.querySelector(':scope > a');
					menuItem.querySelector(':scope > .top-links-sub-menu, :scope > .top-links-section') && addArrow( menuItemDiv );
				});

				// Arrows for Primary Menu Items
				document.querySelectorAll( '.menu-item' ).forEach( function(menuItem) {
					var menuItemDiv = menuItem.querySelector(':scope > .menu-link > div');
					( !menuItem.classList.contains('mega-menu-title') && menuItem.querySelector(':scope > .sub-menu-container, :scope > .mega-menu-content') ) && addArrow( menuItemDiv );
				});

				// Arrows for Page Menu Items
				document.querySelectorAll( '.page-menu-item' ).forEach( function(menuItem) {
					var menuItemDiv = menuItem.querySelector(':scope > a > div');
					menuItem.querySelector(':scope > .page-menu-sub-menu') && addArrow( menuItemDiv );
				});
			};

			var _invert = function(subMenuEl) {
				var subMenus = subMenuEl || document.querySelectorAll( '.mega-menu-content, .sub-menu-container, .top-links-section' );

				// if( !__core.getVars.elBody.classList.contains('is-expanded-menu') ) {
				// 	return false;
				// }

				if( subMenus.length < 1 ) {
					return false;
				}

				var primaryMenus;

				subMenus.forEach( function(el) {
					primaryMenus = el.closest('.header-row')?.querySelectorAll('.primary-menu');
					el.classList.remove('menu-pos-invert');
					var elChildren = el.querySelectorAll(':scope > *');

					elChildren.forEach( function(elChild) {
						elChild.style.display = 'block';
					});
					el.style.display = 'block';

					var viewportOffset = el.getBoundingClientRect();

					if( el.closest('.mega-menu-small') ) {
						var outside = __core.viewport().width - (viewportOffset.left + viewportOffset.width);
						if( outside < 0 ) {
							el.style.left = outside + 'px';
						}
					}

					if( __core.getVars.elBody.classList.contains('rtl') ) {
						if( viewportOffset.left < 0 ) {
							el.classList.add('menu-pos-invert');
						}
					}

					if( __core.viewport().width - (viewportOffset.left + viewportOffset.width) < 0 ) {
						el.classList.add('menu-pos-invert');
					}
				});

				subMenus.forEach( function(el) {
					var elChildren = el.querySelectorAll(':scope > *');
					elChildren.forEach( function(elChild) {
						elChild.style.display = '';
					});
					el.style.display = '';
				});

				primaryMenus?.forEach( function(pMenu){
					pMenu.classList.add('primary-menu-init');
				});
			};

			var _getMenuHoverDelay = function() {
				const fallback = 666;

				let raw = getComputedStyle(__core.getVars.elHeader).getPropertyValue('--cnvs-primary-menu-submenu-display-speed');

				if (!raw) return fallback;

				raw = raw.trim().toLowerCase();

				const match = raw.match(/[\d.]+/);
				if (!match) return fallback;

				const value = parseFloat(match[0]);

				if (raw.includes('ms')) return value;
				if (raw.includes('s')) return value * 1000;

				return value;
			};

			var _hover = function() {
				if( !__core.getVars.elBody.classList.contains('is-expanded-menu') ) {
					return true;
				}

				var menuHoverDelay = _getMenuHoverDelay();

				[].slice.call(__core.getVars.elPrimaryMenus).filter( function(elem) {
					return !elem.matches('.on-click');
				}).forEach( function(pMenu) {
					pMenu.querySelectorAll('.sub-menu').forEach( function(item){
						var _t;

						item.addEventListener('mouseenter', function() {
							clearTimeout(_t);
							item.classList.add('menu-item-hover');
							_invert(item.querySelectorAll('.mega-menu-content, .sub-menu-container'));
						});

						item.addEventListener('mouseleave', function() {
							_t = setTimeout( function(){
								item.classList.remove('menu-item-hover');
							}, Number(menuHoverDelay));
						});
					});
				});
			};

			var _functions = function() {
				var subMenusSel = '.mega-menu-content, .sub-menu-container',
					menuItemSel = '.menu-item',
					subMenuSel = '.sub-menu',
					subMenuTriggerSel = '.sub-menu-trigger',
					body = __core.getVars.elBody.classList;

				var triggersBtn = document.querySelectorAll( subMenuTriggerSel );
				var triggerLinks = new Array;

				triggersBtn.forEach( function(el) {
					var triggerLink = el.closest('.menu-item').querySelector('.menu-link[href^="#"]');
					if( triggerLink ) {
						triggerLinks.push(triggerLink);
					}
				});

				var triggers = [].slice.call(triggersBtn).concat([].slice.call(triggerLinks));

				document.querySelectorAll(subMenuTriggerSel).forEach( function(el) {
					el.classList.remove('icon-rotate-90')
				});

				/**
				 * Mobile Menu Functionality
				 */
				if( !body.contains('is-expanded-menu') ) {
					// Reset Menus to their Closed State
					__core.getVars.elPrimaryMenus.forEach( function(el) {
						el.querySelectorAll(subMenusSel).forEach( function(elem) {
							elem.classList.add('d-none');
							body.remove("primary-menu-open");
						})
					});

					triggers.forEach( function(trigger) {
						trigger.onclick = function(e) {
							e.preventDefault();

							var triggerEl = trigger;

							if( !trigger.classList.contains('sub-menu-trigger') ) {
								triggerEl = trigger.closest(menuItemSel).querySelector(':scope > ' + subMenuTriggerSel);
							}

							__core.siblings(triggerEl.closest(menuItemSel)).forEach( function(item) {
								item.querySelectorAll(subMenusSel).forEach( function(item) {
									item.classList.add('d-none');
								});
							});

							if( triggerEl.closest('.mega-menu-content') ) {
								var parentSubMenuContainers = [];

								__core.parents(triggerEl, menuItemSel).forEach( function(item) {
									parentSubMenuContainers.push(item.querySelector(':scope > ' + subMenusSel));
								});

								[].slice.call(triggerEl.closest('.mega-menu-content').querySelectorAll(subMenusSel)).filter( function(item) {
									return !parentSubMenuContainers.includes(item);
								}).forEach( function(item) {
									item.classList.add('d-none');
								});
							}

							_triggerState(triggerEl, menuItemSel, subMenusSel, subMenuTriggerSel, 'd-none');
						};
					});
				}

				/**
				 * On-Click Menu Functionality
				 */
				if( body.contains('is-expanded-menu') ) {
					if( body.contains('side-header') || body.contains('overlay-menu') ) {
						__core.getVars.elPrimaryMenus.forEach( function(pMenu) {
							pMenu.classList.add('on-click');
							pMenu.querySelectorAll(subMenuTriggerSel).forEach( function(item) {
								item.style.zIndex = '-1';
							});
						});
					}

					[].slice.call(__core.getVars.elPrimaryMenus).filter( function(elem) {
						return elem.matches('.on-click');
					}).forEach( function(pMenu) {
						var menuItemSubs = __core.has( pMenu.querySelectorAll(menuItemSel), subMenuTriggerSel );

						menuItemSubs.forEach( function(el) {
							var triggerEl = el.querySelector(':scope > .menu-link');

							triggerEl.onclick = function(e) {
								e.preventDefault();

								__core.siblings(triggerEl.closest(menuItemSel)).forEach( function(item) {
									item.querySelectorAll(subMenusSel).forEach( function(item) {
										item.classList.remove('d-block');
									});
								});

								if( triggerEl.closest('.mega-menu-content') ) {
									var parentSubMenuContainers = [];

									__core.parents(triggerEl, menuItemSel).forEach( function(item) {
										parentSubMenuContainers.push(item.querySelector(':scope > ' + subMenusSel));
									});

									[].slice.call(triggerEl.closest('.mega-menu-content').querySelectorAll(subMenusSel)).filter( function(item) {
										return !parentSubMenuContainers.includes(item);
									}).forEach( function(item) {
										item.classList.remove('d-block');
									});
								}

								_triggerState(triggerEl, menuItemSel, subMenusSel, subMenuTriggerSel, 'd-block');
							};
						});
					});
				}

				/**
				 * Top-Links On-Click Functionality
				 */
				document.querySelectorAll('.top-links').forEach( function(item) {
					if( item.classList.contains('on-click') || !body.contains('device-up-lg') ) {
						item.querySelectorAll('.top-links-item').forEach( function(menuItem) {
							if( menuItem.querySelectorAll('.top-links-sub-menu,.top-links-section').length > 0 ) {
								var triggerEl = menuItem.querySelector(':scope > a');

								triggerEl.onclick = function(e) {
									e.preventDefault();

									__core.siblings(menuItem).forEach( function(item) {
										item.querySelectorAll('.top-links-sub-menu, .top-links-section').forEach( function(item) {
											item.classList.remove('d-block');
										});
									});
									menuItem.querySelector(':scope > .top-links-sub-menu, :scope > .top-links-section').classList.toggle('d-block');
									__core.siblings(menuItem).forEach( function(item) {
										item.classList.remove('current');
									});
									menuItem.classList.toggle('current');
								};
							}
						})
					}
				});

				_invert( document.querySelectorAll('.top-links-section') );

			};

			var _triggerState = function(triggerEl, menuItemSel, subMenusSel, subMenuTriggerSel, classCheck) {
				triggerEl.closest('.menu-container').querySelectorAll(subMenuTriggerSel).forEach( function(el) {
					el.classList.remove('icon-rotate-90');
				});

				var triggerredSubMenus = triggerEl.closest(menuItemSel).querySelector( ':scope > ' + subMenusSel );
				var childSubMenus = triggerEl.closest(menuItemSel).querySelectorAll( subMenusSel );

				if( classCheck == 'd-none' ) {
					if( triggerredSubMenus.classList.contains('d-none') ) {
						triggerredSubMenus.classList.remove('d-none');
					} else {
						childSubMenus.forEach( function(item) {
							item.classList.add('d-none');
						});
					}
				} else {
					if( triggerredSubMenus.classList.contains('d-block') ) {
						childSubMenus.forEach( function(item) {
							item.classList.remove('d-block');
						});
					} else {
						triggerredSubMenus.classList.add('d-block');
					}
				}

				_current(triggerEl, menuItemSel, subMenusSel, subMenuTriggerSel);
			}

			var _current = function(triggerEl, menuItemSel, subMenusSel, subMenuTriggerSel) {
				[].slice.call(triggerEl.closest('.menu-container').querySelectorAll(menuItemSel)).forEach( function(item) {
					item.classList.remove('current');
				});

				var setCurrent = function(item, menuItemSel, subMenusSel) {
					if( !__core.isHidden(item.closest(menuItemSel).querySelector(':scope > ' + subMenusSel)) ) {
						item.closest(menuItemSel).classList.add('current');
						item.closest(menuItemSel).querySelector(':scope > ' + subMenuTriggerSel)?.classList.add('icon-rotate-90');
					} else {
						item.closest(menuItemSel).classList.remove('current');
						item.closest(menuItemSel).querySelector(':scope > ' + subMenuTriggerSel)?.classList.remove('icon-rotate-90');
					}
				};

				setCurrent(triggerEl, menuItemSel, subMenusSel, subMenuTriggerSel);
				__core.parents(triggerEl, menuItemSel).forEach( function(item) {
					setCurrent(item, menuItemSel, subMenusSel, subMenuTriggerSel);
				});
			};

			var _trigger = function() {
				var body = __core.getVars.elBody.classList;

				document.querySelectorAll('.primary-menu-trigger').forEach( function(menuTrigger) {
					menuTrigger.onclick = function(e) {
						e.preventDefault();

						var elTarget = menuTrigger.getAttribute( 'data-target' ) || '*';

						if( __core.filtered( __core.getVars.elPrimaryMenus, elTarget ).length < 1 ) {
							return;
						}

						if( !body.contains('is-expanded-menu') ) {
							__core.getVars.elPrimaryMenus.forEach( function(el) {
								if( el.querySelectorAll('.mobile-primary-menu').length > 0 ) {
									el.matches(elTarget) && el.querySelectorAll('.mobile-primary-menu').forEach( function(elem) {
										elem.classList.toggle('d-block');
									});
								} else {
									el.matches(elTarget) && el.querySelectorAll('.menu-container').forEach( function(elem) {
										elem.classList.toggle('d-block');
									});
								}
							});
						}

						menuTrigger.classList.toggle('primary-menu-trigger-active');
						__core.getVars.elPrimaryMenus.forEach( function(elem) {
							elem.matches(elTarget) && elem.classList.toggle('primary-menu-active');
						});

						body.toggle('primary-menu-open');

						if( elTarget != '*' ) {
							body.toggle('primary-menu-open-' + elTarget.replace(/[^a-zA-Z0-9-]/g, ""));
						} else {
							body.toggle('primary-menu-open-all');
						}
					};
				});
			};

			var _fullWidth = function() {
				var body = __core.getVars.elBody.classList;

				if( !body.contains('is-expanded-menu') ) {
					document.querySelectorAll('.mega-menu-content, .top-search-form').forEach( function(el) {
						el.style.width = '';
					});
					return true;
				}

				var headerWidth = document.querySelector('.mega-menu:not(.mega-menu-full):not(.mega-menu-small) .mega-menu-content')?.closest('.header-row').offsetWidth;

				if( __core.getVars.elHeader.querySelectorAll('.container-fullwidth').length > 0 ) {
					document.querySelectorAll('.mega-menu:not(.mega-menu-full):not(.mega-menu-small) .mega-menu-content').forEach( function(el) {
						el.style.width = headerWidth + 'px';
					});
				}

				document.querySelectorAll('.mega-menu:not(.mega-menu-full):not(.mega-menu-small) .mega-menu-content, .top-search-form').forEach( function(el) {
					el.style.width = headerWidth + 'px';
				});

				if( __core.getVars.elHeader.classList.contains('full-header') ) {
					document.querySelectorAll('.mega-menu:not(.mega-menu-full):not(.mega-menu-small) .mega-menu-content').forEach( function(el) {
						el.style.width = headerWidth + 'px';
					});
				}

				if( __core.getVars.elHeader.classList.contains('floating-header') ) {
					var floatingHeaderPadding = getComputedStyle(document.querySelector('#header')).getPropertyValue('--cnvs-header-floating-padding');
					document.querySelectorAll('.mega-menu:not(.mega-menu-full):not(.mega-menu-small) .mega-menu-content').forEach( function(el) {
						el.style.width = (headerWidth + (Number(floatingHeaderPadding.split('px')[0]) *2)) + 'px';
					});
				}
			};

			return {
				init: function(selector) {
					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ){
						return true;
					}

					_init();
					_reset();
					_withIcon();
					_arrows();
					_invert();
					_hover();
					_functions();
					_trigger();
					_fullWidth();

					var windowWidth = __core.viewport().width;
					__core.getVars.resizers.menus = function() {
						if( windowWidth != __core.viewport().width ) {
							__base.menus();
						}
					};

					__core.getVars.recalls.menureset = function() {
						_reset();
						_functions();
					};
				}
			};
		}(),
		// Menu Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Page-Menu Functions Start
		 * --------------------------------------------------------------------------
		 */
		PageMenu: function() {
			var _state = {
				scrollHandler: null,
				docClickHandler: null,
				isSticky: false,
				rafPending: false,
				resizeTimer: null,
			};

			var _applySticky = function(shouldStick) {
				var pageMenu = __core.getVars.elPageMenu;
				if( !pageMenu ) return;
				if( shouldStick === _state.isSticky ) return;
				_state.isSticky = shouldStick;
				if( shouldStick ) {
					pageMenu.classList.add('sticky-page-menu');
				} else {
					pageMenu.classList.remove('sticky-page-menu');
				}
			};

			var _stickyUpdate = function() {
				_state.rafPending = false;
				var pageMenu = __core.getVars.elPageMenu;
				if( !pageMenu ) return;
				var offset = __core.getVars.pageMenuOffset || 0;
				if( window.scrollY > offset ) {
					var bodyClasses = __core.getVars.elBody.classList;
					if( bodyClasses.contains('device-up-lg') ) {
						_applySticky(true);
					} else {
						_applySticky(pageMenu.getAttribute('data-mobile-sticky') === 'true');
					}
				} else {
					_applySticky(false);
				}
			};

			var _requestSticky = function() {
				if( _state.rafPending ) return;
				_state.rafPending = true;
				window.requestAnimationFrame(_stickyUpdate);
			};

			var _updateBreakpointClass = function() {
				var body = __core.getVars.elBody;
				if( !__core.getVars.elPageMenu ) return;
				var raw = body.getAttribute('data-pagemenu-breakpoint') || __core.getVars.menuBreakpoint;
				var bp = Number(raw) || 992;
				if( bp <= __core.viewport().width ) {
					body.classList.add('is-expanded-pagemenu');
				} else {
					body.classList.remove('is-expanded-pagemenu');
				}
			};

			return {
				init: function(selector) {
					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ) return true;

					var pageMenu = __core.getVars.elPageMenu;
					if( !pageMenu ) return true;

					_updateBreakpointClass();

					var pageMenuWrap = pageMenu.querySelector('#page-menu-wrap');
					if( !pageMenuWrap ) return true;

					var pageMenuClone = pageMenu.querySelector('.page-menu-wrap-clone');
					if( !pageMenuClone ) {
						pageMenuClone = document.createElement('div');
						pageMenuClone.className = 'page-menu-wrap-clone';
						pageMenuWrap.parentNode.insertBefore(pageMenuClone, pageMenuWrap.nextSibling);
					}

					pageMenuClone.style.height = pageMenuWrap.offsetHeight + 'px';

					var trigger = pageMenu.querySelector('#page-menu-trigger');
					if( trigger ) {
						trigger.addEventListener('click', function(e) {
							e.preventDefault();
							__core.getVars.elBody.classList.remove('top-search-open');
							pageMenu.classList.toggle('page-menu-open');
						});
					}

					var nav = pageMenu.querySelector('nav');
					if( nav ) {
						nav.addEventListener('click', function() {
							__core.getVars.elBody.classList.remove('top-search-open');
							var topCart = document.getElementById('top-cart');
							topCart?.classList.remove('top-cart-open');
						});
					}

					if( _state.docClickHandler ) {
						document.removeEventListener('click', _state.docClickHandler, false);
					}
					_state.docClickHandler = function(e) {
						if( !e.target.closest('#page-menu') ) {
							pageMenu.classList.remove('page-menu-open');
						}
					};
					document.addEventListener('click', _state.docClickHandler, false);

					if( pageMenu.classList.contains('no-sticky') || pageMenu.classList.contains('dots-menu') ) {
						return true;
					}

					var headerHeight;
					var elHeader = __core.getVars.elHeader;
					if( elHeader.getAttribute('data-sticky-shrink') === 'false' ) {
						headerHeight = parseFloat(getComputedStyle(elHeader).getPropertyValue('--cnvs-header-height')) || 0;
					} else if( elHeader.classList.contains('no-sticky') || ( !__core.getVars.elBody.classList.contains('is-expanded-menu') && __core.getVars.mobileSticky !== 'true' ) ) {
						headerHeight = 0;
					} else {
						headerHeight = parseFloat(getComputedStyle(elHeader).getPropertyValue('--cnvs-header-height-shrink')) || 0;
					}

					pageMenu.style.setProperty('--cnvs-page-submenu-sticky-offset', headerHeight + 'px');

					var computeAndApply = function() {
						__core.getVars.pageMenuOffset = __core.offset(pageMenu).top - headerHeight;
						_stickyUpdate();
					};

					if( document.readyState === 'complete' ) {
						window.requestAnimationFrame(computeAndApply);
					} else {
						window.addEventListener('load', function() {
							window.requestAnimationFrame(computeAndApply);
						}, { once: true });
					}

					if( _state.scrollHandler ) {
						window.removeEventListener('scroll', _state.scrollHandler);
					}
					_state.scrollHandler = _requestSticky;
					window.addEventListener('scroll', _state.scrollHandler, { passive: true });

					__core.getVars.resizers.pagemenu = function() {
						clearTimeout(_state.resizeTimer);
						_state.resizeTimer = setTimeout( function() {
							_updateBreakpointClass();
							__core.getVars.pageMenuOffset = __core.offset(pageMenu).top - headerHeight;
							_stickyUpdate();
						}, 150);
					};
				}
			};
		}(),
		// Page-Menu Functions End

		/**
		 * --------------------------------------------------------------------------
		 * SliderDimension Functions Start (Required if using Sliders)
		 * --------------------------------------------------------------------------
		 */
		SliderDimensions: function() {
			return {
				init: function(selector) {
					selector = __core.getSelector( selector, false );
					if( !selector || selector.length < 1 ){
						return true;
					}

					var slider = document.querySelector('.slider-element');
					if( !slider ) return true;

					var sliderParallaxEl = document.querySelector('.slider-parallax'),
						body             = __core.getVars.elBody,
						parallaxElHeight = sliderParallaxEl ? sliderParallaxEl.offsetHeight : 0,
						parallaxElWidth  = sliderParallaxEl ? sliderParallaxEl.offsetWidth : 0,
						slInner          = sliderParallaxEl ? sliderParallaxEl.querySelector('.slider-inner') : null,
						slSwiperW        = slider.querySelector('.swiper-wrapper'),
						slSwiperS        = slider.querySelector('.swiper-slide'),
						slFlexHeight     = slider.classList.contains('h-auto') || slider.classList.contains('min-vh-0');

					if( body.classList.contains('device-up-lg') ) {
						setTimeout(function() {
							if( slInner ) {
								slInner.style.height = parallaxElHeight + 'px';
							}
							if( slFlexHeight ) {
								var innerEl = slider.querySelector('.slider-inner');
								var firstChild = innerEl ? innerEl.querySelector('*') : null;
								if( firstChild ) {
									parallaxElHeight = firstChild.offsetHeight;
									slider.style.height = parallaxElHeight + 'px';
									if( slInner ) {
										slInner.style.height = parallaxElHeight + 'px';
									}
								}
							}
						}, 500);

						if( slFlexHeight && slSwiperS && slSwiperW ) {
							var slSwiperFC = slSwiperS.querySelector('*');
							if( slSwiperFC && (slSwiperFC.classList.contains('container') || slSwiperFC.classList.contains('container-fluid')) ) {
								slSwiperFC = slSwiperFC.querySelector('*');
							}
							if( slSwiperFC && slSwiperFC.offsetHeight > slSwiperW.offsetHeight ) {
								slSwiperW.style.height = 'auto';
							}
						}

						if( body.classList.contains('side-header') && slInner ) {
							slInner.style.width = parallaxElWidth + 'px';
						}

						if( !body.classList.contains('stretched') ) {
							parallaxElWidth = __core.getVars.elWrapper.offsetWidth;
							if( slInner ) {
								slInner.style.width = parallaxElWidth + 'px';
							}
						}
					} else {
						if( slSwiperW ) {
							slSwiperW.style.height = '';
						}

						if( sliderParallaxEl ) {
							sliderParallaxEl.style.height = '';
						}

						if( slInner ) {
							slInner.style.width = '';
							slInner.style.height = '';
						}
					}

					__core.getVars.resizers.sliderdimensions = function() {
						__base.sliderDimensions();
					};
				}
			};
		}(),
		// SliderDimension Functions End

		/**
		 * --------------------------------------------------------------------------
		 * SliderMenuClass Functions Start (Required if using Sliders with Transparent Headers)
		 * --------------------------------------------------------------------------
		 */
		SliderMenuClass: function() {
			var _retryTimer;

			var _shouldRun = function() {
				var elHeader = __core.getVars.elHeader;
				var elBody = __core.getVars.elBody;
				if( !elHeader || !elBody ) return false;
				if( elHeader.classList.contains('ignore-slider') ) return false;
				if( elBody.classList.contains('is-expanded-menu') ) return true;
				if( elHeader.classList.contains('transparent-header-responsive') && !elBody.classList.contains('primary-menu-open') ) return true;
				return false;
			};

			var _swiper = function() {
				if( !_shouldRun() ) return;
				var slider = __core.getVars.elSlider;
				if( !slider ) return;
				_schemeChanger(slider.querySelector('.swiper-slide-active'), 'swiper');
			};

			var _revolution = function() {
				if( !_shouldRun() ) return;
				var slider = __core.getVars.elSlider;
				if( !slider ) return;
				_schemeChanger(slider.querySelector('.active-revslide'), 'revslider');
			};

			var _hasDarkInOldClasses = function() {
				var classes = __core.getVars.headerClasses;
				if( !classes ) return false;
				if( typeof classes === 'string' ) return classes.split(/\s+/).indexOf('dark') !== -1;
				if( typeof classes.length === 'number' ) {
					for( var i = 0; i < classes.length; i++ ) {
						if( classes[i] === 'dark' ) return true;
					}
				}
				return false;
			};

			var _schemeChanger = function(activeSlide, slider) {
				if( !activeSlide ) {
					_retryTimer = setTimeout( function() {
						if( slider === 'revslider' ) {
							_revolution();
						} else {
							_swiper();
						}
					}, 500);
					return;
				}

				clearTimeout(_retryTimer);

				var elHeader = __core.getVars.elHeader;
				var elBody = __core.getVars.elBody;
				var elHeaderWrap = __core.getVars.elHeaderWrap;
				if( !elHeader || !elBody ) return;

				var transparentHeader = document.querySelector('#header.transparent-header:not(.sticky-header,.semi-transparent,.floating-header)');
				var transparentHeaderAny = document.querySelector('#header.transparent-header:not(.semi-transparent,.floating-header)');
				var stickyTransparent = document.querySelector('#header.transparent-header.sticky-header,#header.transparent-header.semi-transparent.sticky-header,#header.transparent-header.floating-header.sticky-header');

				if( activeSlide.classList.contains('dark') ){
					if( transparentHeader ) {
						transparentHeader.classList.add('dark');
					}

					if( !_hasDarkInOldClasses() && stickyTransparent ) {
						stickyTransparent.classList.remove('dark');
					}

					if( elHeaderWrap ) elHeaderWrap.classList.remove('not-dark');
				} else {
					if( elBody.classList.contains('dark') ) {
						activeSlide.classList.add('not-dark');
						if( transparentHeaderAny ) transparentHeaderAny.classList.remove('dark');
						var headerWrap = transparentHeader ? transparentHeader.querySelector('#header-wrap') : null;
						if( headerWrap ) headerWrap.classList.add('not-dark');
					} else {
						if( transparentHeaderAny ) transparentHeaderAny.classList.remove('dark');
						if( elHeaderWrap ) elHeaderWrap.classList.remove('not-dark');
					}
				}

				if( elHeader.classList.contains('sticky-header') ) {
					__base.headers();
				}
			};

			return {
				init: function(selector) {
					selector = __core.getSelector( selector, false );
					if( !selector || selector.length < 1 ){
						return true;
					}

					var elBody = __core.getVars.elBody;
					var elHeader = __core.getVars.elHeader;
					if( !elBody || !elHeader ) return true;
					if( !elBody.classList.contains('is-expanded-menu') && !elHeader.classList.contains('transparent-header-responsive') ) {
						return true;
					}

					_swiper();
					_revolution();
					__base.setBSTheme();

					__core.getVars.resizers.slidermenuclass = function() {
						__base.sliderMenuClass();
					};
				}
			};
		}(),
		// SliderMenuClass Functions End

		/**
		 * --------------------------------------------------------------------------
		 * TopSearch Functions Start (Required)
		 * --------------------------------------------------------------------------
		 */
		TopSearch: function() {
			var _outsideHandler = null;
			var _topSearchParent = null;
			var _timeout = null;

			return {
				init: function(selector) {
					selector = __core.getSelector( selector, false );
					if( !selector || selector.length < 1 ){
						return true;
					}

					var searchForm = document.querySelector('.top-search-form');
					if( !searchForm ) return true;

					var headerRow = searchForm.closest('.header-row');
					if( headerRow ) headerRow.classList.add('top-search-parent');

					_topSearchParent = document.querySelector('.top-search-parent');

					var trigger = selector[0];

					if( __core.markOnce(trigger, 'cnvsTopsearchBound') ) {
						trigger.addEventListener('click', function(e) {
							e.stopPropagation();
							e.preventDefault();

							clearTimeout(_timeout);

							var elBody = __core.getVars.elBody;
							if( !elBody ) return;

							elBody.classList.toggle('top-search-open');

							var topCart = document.getElementById('top-cart');
							if( topCart ) topCart.classList.remove('top-cart-open');

							if( __core.getVars.recalls && typeof __core.getVars.recalls.menureset === 'function' ) {
								__core.getVars.recalls.menureset();
							}

							var isOpen = elBody.classList.contains('top-search-open');
							if( isOpen ) {
								if( _topSearchParent ) _topSearchParent.classList.add('position-relative');
							} else {
								_timeout = setTimeout( function() {
									if( _topSearchParent ) _topSearchParent.classList.remove('position-relative');
								}, 500);
							}

							elBody.classList.remove('primary-menu-open');
							if( __core.getVars.elPageMenu ) __core.getVars.elPageMenu.classList.remove('page-menu-open');

							if( isOpen ) {
								var input = searchForm.querySelector('input');
								if( input ) input.focus();
							}
						});
					}

					if( !_outsideHandler ) {
						_outsideHandler = function(e) {
							var elBody = __core.getVars.elBody;
							if( !elBody || !elBody.classList.contains('top-search-open') ) return;
							if( !e.target.closest('.top-search-form') ) {
								elBody.classList.remove('top-search-open');
								_timeout = setTimeout( function() {
									if( _topSearchParent ) _topSearchParent.classList.remove('position-relative');
								}, 500);
							}
						};
						document.addEventListener('click', _outsideHandler, false);
					}
				}
			};
		}(),
		// TopSearch Functions End

		/**
		 * --------------------------------------------------------------------------
		 * TopCart Functions Start (Required)
		 * --------------------------------------------------------------------------
		 */
		TopCart: function() {
			var _outsideHandler = null;
			var _topCartEl = null;

			return {
				init: function(selector) {
					selector = __core.getSelector( selector, false );
					if( !selector || selector.length < 1 ){
						return true;
					}

					var trigger = document.getElementById('top-cart-trigger');
					if( !trigger ) return false;

					_topCartEl = selector[0];

					if( __core.markOnce(trigger, 'cnvsTopcartBound') ) {
						trigger.addEventListener('click', function(e) {
							e.stopPropagation();
							e.preventDefault();
							if( _topCartEl ) _topCartEl.classList.toggle('top-cart-open');
						});
					}

					if( !_outsideHandler ) {
						_outsideHandler = function(e) {
							if( !_topCartEl || !_topCartEl.classList.contains('top-cart-open') ) return;
							if( !e.target.closest('#top-cart') ) {
								_topCartEl.classList.remove('top-cart-open');
							}
						};
						document.addEventListener('click', _outsideHandler, false);
					}
				}
			};
		}(),
		// TopCart Functions End

		/**
		 * --------------------------------------------------------------------------
		 * SidePanel Functions Start
		 * --------------------------------------------------------------------------
		 */
		SidePanel: function() {
			var _state = {
				initialized: false,
				isOpen: false,
				panelEl: null,
				lastTrigger: null,
			};

			var _focusableSelector = 'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

			var _getFocusable = function() {
				if( !_state.panelEl ) return [];
				return Array.prototype.filter.call(
					_state.panelEl.querySelectorAll(_focusableSelector),
					function(el) { return !el.hasAttribute('disabled') && el.offsetParent !== null; }
				);
			};

			var _syncAria = function() {
				if( _state.panelEl ) {
					_state.panelEl.setAttribute('aria-hidden', _state.isOpen ? 'false' : 'true');
				}
				document.querySelectorAll('.side-panel-trigger').forEach(function(el) {
					el.setAttribute('aria-expanded', _state.isOpen ? 'true' : 'false');
				});
			};

			var _open = function(triggerEl) {
				if( _state.isOpen ) return;
				_state.isOpen = true;
				_state.lastTrigger = triggerEl || document.activeElement;

				var body = __core.getVars.elBody.classList;
				body.add('side-panel-open');
				if( body.contains('device-touch') && body.contains('side-push-panel') ) {
					body.add('ohidden');
				}

				_syncAria();

				var focusable = _getFocusable();
				if( focusable.length ) {
					focusable[0].focus();
				} else if( _state.panelEl ) {
					if( !_state.panelEl.hasAttribute('tabindex') ) {
						_state.panelEl.setAttribute('tabindex', '-1');
					}
					_state.panelEl.focus();
				}
			};

			var _close = function() {
				if( !_state.isOpen ) return;
				_state.isOpen = false;

				var body = __core.getVars.elBody.classList;
				body.remove('side-panel-open');
				if( body.contains('device-touch') && body.contains('side-push-panel') ) {
					body.remove('ohidden');
				}

				_syncAria();

				if( _state.lastTrigger && typeof _state.lastTrigger.focus === 'function' ) {
					_state.lastTrigger.focus();
				}
				_state.lastTrigger = null;
			};

			var _onDocumentClick = function(e) {
				if( !_state.isOpen ) return;
				if( e.target.closest('#side-panel') || e.target.closest('.side-panel-trigger') ) return;
				_close();
			};

			var _onKeyDown = function(e) {
				if( !_state.isOpen ) return;
				if( e.key === 'Escape' || e.keyCode === 27 ) {
					e.preventDefault();
					_close();
					return;
				}
				if( e.key === 'Tab' || e.keyCode === 9 ) {
					var focusable = _getFocusable();
					if( !focusable.length ) return;
					var first = focusable[0];
					var last = focusable[focusable.length - 1];
					if( e.shiftKey && document.activeElement === first ) {
						e.preventDefault();
						last.focus();
					} else if( !e.shiftKey && document.activeElement === last ) {
						e.preventDefault();
						first.focus();
					}
				}
			};

			var _onTriggerClick = function(e) {
				e.preventDefault();
				if( _state.isOpen ) {
					_close();
				} else {
					_open(e.currentTarget);
				}
			};

			return {
				init: function(selector) {
					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ) return true;

					_state.panelEl = document.getElementById('side-panel');

					document.querySelectorAll('.side-panel-trigger').forEach(function(el) {
						el.removeEventListener('click', _onTriggerClick);
						el.addEventListener('click', _onTriggerClick);
						if( !el.hasAttribute('aria-controls') && _state.panelEl && _state.panelEl.id ) {
							el.setAttribute('aria-controls', _state.panelEl.id);
						}
					});

					_syncAria();

					if( _state.initialized ) return;
					_state.initialized = true;

					document.addEventListener('click', _onDocumentClick, false);
					document.addEventListener('keydown', _onKeyDown, false);
				}
			};
		}(),
		// SidePanel Functions End

		/**
		 * --------------------------------------------------------------------------
		 * AdaptiveColorScheme Functions Start
		 * --------------------------------------------------------------------------
		 */
		AdaptiveColorScheme: function() {
			var _state = {
				mq: null,
				changeHandler: null,
				adaptiveEl: null,
				lightClass: null,
				darkClass: null,
			};

			var _applyScheme = function(isDark) {
				if( isDark ) {
					__core.getVars.elBody.classList.add('dark');
				} else {
					__core.getVars.elBody.classList.remove('dark');
				}

				if( _state.adaptiveEl && __core.getVars.elBody.contains(_state.adaptiveEl) ) {
					if( isDark ) {
						if( _state.lightClass ) _state.adaptiveEl.classList.remove(_state.lightClass);
						if( _state.darkClass ) _state.adaptiveEl.classList.add(_state.darkClass);
					} else {
						if( _state.darkClass ) _state.adaptiveEl.classList.remove(_state.darkClass);
						if( _state.lightClass ) _state.adaptiveEl.classList.add(_state.lightClass);
					}
				}

				__base.setBSTheme();
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ) return true;

					__core.initFunction({ class: 'has-plugin-adaptivecolorscheme', event: 'pluginAdaptiveColorSchemeReady' });

					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ) return true;

					_state.adaptiveEl = document.querySelector('[data-adaptive-light-class],[data-adaptive-dark-class]');

					if( _state.adaptiveEl && __core.getVars.elBody.contains(_state.adaptiveEl) ) {
						_state.lightClass = _state.adaptiveEl.getAttribute('data-adaptive-light-class');
						_state.darkClass = _state.adaptiveEl.getAttribute('data-adaptive-dark-class');
					}

					if( !window.matchMedia ) return;

					if( !_state.mq ) {
						_state.mq = window.matchMedia('(prefers-color-scheme: dark)');
					}

					_applyScheme(_state.mq.matches);

					if( _state.changeHandler ) {
						_state.mq.removeEventListener('change', _state.changeHandler);
					}
					_state.changeHandler = function(e) {
						_applyScheme(e.matches);
					};
					_state.mq.addEventListener('change', _state.changeHandler);
				}
			};
		}(),
		// AdaptiveColorScheme Functions End

		/**
		 * --------------------------------------------------------------------------
		 * PortfolioAjax Functions Start
		 * --------------------------------------------------------------------------
		 */
		PortfolioAjax: function() {
			var _transitionHandler = null;
			var _closeHandler = null;

			var _newNextPrev = function(portPostId) {
				var portNext = _getNext(portPostId);
				var portPrev = _getPrev(portPostId);
				var portNav = document.getElementById('portfolio-navigation');
				if( !portNav ) return;

				var closeBtn = document.getElementById('close-portfolio');

				if( !document.getElementById('prev-portfolio') && portPrev ) {
					var prevPortItem = document.createElement('a');
					prevPortItem.setAttribute('href', '#');
					prevPortItem.setAttribute('id', 'prev-portfolio');
					prevPortItem.setAttribute('data-id', portPrev);
					prevPortItem.innerHTML = '<i class="bi-arrow-left"></i>';
					portNav.insertBefore(prevPortItem, closeBtn);
				}

				if( !document.getElementById('next-portfolio') && portNext ) {
					var nextPortItem = document.createElement('a');
					nextPortItem.setAttribute('href', '#');
					nextPortItem.setAttribute('id', 'next-portfolio');
					nextPortItem.setAttribute('data-id', portNext);
					nextPortItem.innerHTML = '<i class="bi-arrow-right"></i>';
					portNav.insertBefore(nextPortItem, closeBtn);
				}
			};

			var _load = function(portPostId, prevPostPortId, getIt) {
				if( !getIt ) getIt = false;
				if( getIt !== false ) return;

				var srcEl = document.getElementById(portPostId);
				if( !srcEl ) return;

				var portNext = _getNext(portPostId);
				var portPrev = _getPrev(portPostId);

				_close();
				__core.getVars.elBody.classList.add('portfolio-ajax-loading');
				var portfolioDataLoader = srcEl.getAttribute('data-loader');
				if( !portfolioDataLoader ) return;

				fetch(portfolioDataLoader).then( function(response) {
					if( !response.ok ) throw new Error('HTTP ' + response.status);
					return response.text();
				}).then( function(html) {
					var container = __core.getVars.portfolioAjax.container;
					if( !container ) return;
					container.innerHTML = html;

					var nextPortfolio = document.getElementById('next-portfolio'),
						prevPortfolio = document.getElementById('prev-portfolio');

					nextPortfolio?.classList.add('d-none');
					prevPortfolio?.classList.add('d-none');

					if( portNext ) {
						nextPortfolio?.setAttribute('data-id', portNext);
						nextPortfolio?.classList.remove('d-none');
					}
					if( portPrev ) {
						prevPortfolio?.setAttribute('data-id', portPrev);
						prevPortfolio?.classList.remove('d-none');
					}

					_initAjax(portPostId);
					_open();

					__core.getVars.portfolioAjax.items?.forEach( function(item) {
						item.classList.remove('portfolio-active');
					});

					document.getElementById(portPostId)?.classList.add('portfolio-active');
				}).catch( function(error) {
					console.warn('Something went wrong.', error);
					__core.getVars.elBody.classList.remove('portfolio-ajax-loading');
				});
			};

			var _close = function() {
				var wrapper = __core.getVars.portfolioAjax.wrapper;
				if( !wrapper || wrapper.offsetHeight <= 32 ) return;

				__core.getVars.elBody.classList.remove('portfolio-ajax-loading');
				wrapper.classList.remove('portfolio-ajax-opened');

				var single = wrapper.querySelector('#portfolio-ajax-single');
				if( single ) {
					if( _transitionHandler ) {
						single.removeEventListener('transitionend', _transitionHandler);
					}
					_transitionHandler = function() {
						single.remove();
						_transitionHandler = null;
					};
					single.addEventListener('transitionend', _transitionHandler, { once: true });
				}

				__core.getVars.portfolioAjax.items?.forEach( function(item) {
					item.classList.remove('portfolio-active');
				});
			};

			var _open = function() {
				var container = __core.getVars.portfolioAjax.container;
				if( !container ) return;
				_display();
			};

			var _display = function() {
				var portfolioAjax = __core.getVars.portfolioAjax;
				if( !portfolioAjax.container || !portfolioAjax.wrapper ) return;
				portfolioAjax.container.style.display = 'block';
				portfolioAjax.wrapper.classList.add('portfolio-ajax-opened');
				__core.getVars.elBody.classList.remove('portfolio-ajax-loading');
				setTimeout( function() {
					__core.runContainerModules(portfolioAjax.wrapper);
					__core.scrollTo((portfolioAjax.wrapperOffset - __core.getVars.topScrollOffset - 60), false, false);
				}, 500);
			};

			var _getNext = function(portPostId) {
				var el = document.getElementById(portPostId);
				if( !el ) return false;
				var next = el.nextElementSibling;
				return next ? next.getAttribute('id') : false;
			};

			var _getPrev = function(portPostId) {
				var el = document.getElementById(portPostId);
				if( !el ) return false;
				var prev = el.previousElementSibling;
				return prev ? prev.getAttribute('id') : false;
			};

			var _initAjax = function(portPostId) {
				__core.getVars.portfolioAjax.prevItem = document.getElementById(portPostId);

				_newNextPrev(portPostId);

				document.querySelectorAll('#next-portfolio, #prev-portfolio').forEach( function(el) {
					var handler = function(e) {
						e.preventDefault();
						_close();
						var nextId = el.getAttribute('data-id');
						if( !nextId ) return;
						document.getElementById(nextId)?.classList.add('portfolio-active');
						_load(nextId, __core.getVars.portfolioAjax.prevItem);
					};
					__core.rebind(el, 'click', handler, 'portfolioajax.nav');
				});

				var closeBtn = document.getElementById('close-portfolio');
				if( closeBtn ) {
					if( _closeHandler ) closeBtn.removeEventListener('click', _closeHandler);
					_closeHandler = function(e) {
						e.preventDefault();
						_close();
					};
					closeBtn.addEventListener('click', _closeHandler);
				}
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-ajaxportfolio', event: 'pluginAjaxPortfolioReady' });

					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ) return true;

					var wrapper = document.getElementById('portfolio-ajax-wrap');
					__core.getVars.portfolioAjax.items         = selector[0].querySelectorAll('.portfolio-item');
					__core.getVars.portfolioAjax.wrapper       = wrapper;
					__core.getVars.portfolioAjax.wrapperOffset = wrapper ? __core.offset(wrapper).top : 0;
					__core.getVars.portfolioAjax.container     = document.getElementById('portfolio-ajax-container');
					__core.getVars.portfolioAjax.loader        = document.getElementById('portfolio-ajax-loader');
					__core.getVars.portfolioAjax.prevItem      = '';

					selector[0].querySelectorAll('.portfolio-ajax-trigger').forEach( function(el) {
						if( !el.querySelector('i:nth-child(2)') ) {
							el.insertAdjacentHTML('beforeend', '<i class="bi-arrow-repeat icon-spin"></i>');
						}

						var handler = function(e) {
							e.preventDefault();
							var portItem = e.target.closest('.portfolio-item');
							if( !portItem ) return;
							var portPostId = portItem.getAttribute('id');
							if( !portPostId ) return;
							if( !portItem.classList.contains('portfolio-active') ) {
								_load(portPostId, __core.getVars.portfolioAjax.prevItem);
							}
						};
						__core.rebind(el, 'click', handler, 'portfolioajax.trigger');
					});
				}
			};
		}(),
		// PortfolioAjax Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Cursor Functions Start
		 * --------------------------------------------------------------------------
		 */
		Cursor: function() {
			var _state = {
				initialized: false,
				cursor: null,
				rafPending: false,
				pendingX: 0,
				pendingY: 0,
				mouseMoveHandler: null,
				actionEnterHandler: null,
				actionLeaveHandler: null,
				disableEnterHandler: null,
				disableLeaveHandler: null,
			};

			var _addCursorEl = function(className, parent) {
				var el = document.createElement('div');
				el.classList.add(className);
				parent.prepend(el);
				return el;
			};

			var _onMouseMoveRaf = function() {
				_state.rafPending = false;
				if( !_state.cursor ) return;
				_state.cursor.style.transform = 'translate3d(' + _state.pendingX + 'px,' + _state.pendingY + 'px,0)';
			};

			return {
				init: function(selector) {
					__core.initFunction({ class: 'has-plugin-cursor', event: 'pluginCursorReady' });

					var hasFinePointer = !window.matchMedia || window.matchMedia('(pointer: fine)').matches;
					if( !hasFinePointer ) return;

					var cursor = document.querySelector('.cnvs-cursor');
					if( !cursor ) {
						cursor = _addCursorEl('cnvs-cursor', __core.getVars.elWrapper);
					}
					if( !cursor.querySelector('.cnvs-cursor-follower') ) {
						_addCursorEl('cnvs-cursor-follower', cursor);
					}
					if( !cursor.querySelector('.cnvs-cursor-dot') ) {
						_addCursorEl('cnvs-cursor-dot', cursor);
					}
					_state.cursor = cursor;

					if( _state.initialized ) return;
					_state.initialized = true;

					_state.mouseMoveHandler = function(event) {
						_state.pendingX = event.clientX;
						_state.pendingY = event.clientY;
						if( _state.rafPending ) return;
						_state.rafPending = true;
						window.requestAnimationFrame(_onMouseMoveRaf);
					};
					document.addEventListener('mousemove', _state.mouseMoveHandler, { passive: true });

					_state.actionEnterHandler = function(e) {
						if( e.target.closest('a,button') && !e.target.closest('.cursor-disable') ) {
							cursor.classList.add('cnvs-cursor-action');
						}
					};
					_state.actionLeaveHandler = function(e) {
						if( e.target.closest('a,button') ) {
							cursor.classList.remove('cnvs-cursor-action');
						}
					};
					document.addEventListener('mouseover', _state.actionEnterHandler);
					document.addEventListener('mouseout', _state.actionLeaveHandler);

					_state.disableEnterHandler = function(e) {
						if( e.target.closest('.cursor-disable') ) {
							cursor.classList.add('cnvs-cursor-disabled');
						}
					};
					_state.disableLeaveHandler = function(e) {
						if( e.target.closest('.cursor-disable') ) {
							cursor.classList.remove('cnvs-cursor-disabled');
						}
					};
					document.addEventListener('mouseover', _state.disableEnterHandler);
					document.addEventListener('mouseout', _state.disableLeaveHandler);
				}
			};
		}(),
		// Cursor Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Bootstrap Functions Start
		 * --------------------------------------------------------------------------
		 */
		Bootstrap: function() {
			return {
				init: function(selector) {
					__core.requirePlugin({
						check: function() { return typeof bootstrap !== 'undefined'; },
						class: 'has-plugin-bootstrap',
						event: 'pluginBootstrapReady'
					});
				}
			};
		}(),
		// Bootstrap Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Easing Functions Start
		 * --------------------------------------------------------------------------
		 */
		Easing: function() {
			return {
				init: function(selector) {
					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && typeof jQuery.easing['easeOutQuad'] !== 'undefined'; },
						class: 'has-plugin-easing',
						event: 'pluginEasingReady'
					});
				}
			};
		}(),
		// Easing Functions End

		/**
		 * --------------------------------------------------------------------------
		 * ResizeVideos Functions Start
		 * --------------------------------------------------------------------------
		 */
		ResizeVideos: function() {
			var _wrapVideo = function(iframe) {
				if( !iframe || iframe.dataset.cnvsFluidWrapped === '1' ) return;
				if( iframe.closest('.ratio') || iframe.closest('.fluid-width-video-wrapper') ) {
					iframe.dataset.cnvsFluidWrapped = '1';
					return;
				}
				if( iframe.classList.contains('no-fv') || iframe.closest('.no-fv') ) return;

				var widthAttr = parseFloat(iframe.getAttribute('width'));
				var heightAttr = parseFloat(iframe.getAttribute('height'));
				var width = isFinite(widthAttr) && widthAttr > 0 ? widthAttr : (iframe.clientWidth || 16);
				var height = isFinite(heightAttr) && heightAttr > 0 ? heightAttr : (iframe.clientHeight || 9);
				if( !width || !height ) { width = 16; height = 9; }

				var wrapper = document.createElement('div');
				wrapper.className = 'ratio fluid-width-video-wrapper';
				wrapper.style.setProperty('--bs-aspect-ratio', (height / width * 100) + '%');

				iframe.parentNode.insertBefore(wrapper, iframe);
				wrapper.appendChild(iframe);

				iframe.removeAttribute('width');
				iframe.removeAttribute('height');

				iframe.dataset.cnvsFluidWrapped = '1';
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-fitvids', event: 'pluginFitVidsReady' });

					selector = __core.getSelector(selector, false);
					if( selector instanceof Element ) selector = [selector];
					if( !selector || selector.length < 1 ) return true;

					Array.prototype.forEach.call(selector, _wrapVideo);
				}
			};
		}(),
		// ResizeVideos Functions End

		/**
		 * --------------------------------------------------------------------------
		 * PageTransition Functions Start
		 * --------------------------------------------------------------------------
		 */
		PageTransition: function() {
			var _loaderTemplates = {
				'2':  '<div class="css3-spinner-flipper"></div>',
				'3':  '<div class="css3-spinner-double-bounce1"></div><div class="css3-spinner-double-bounce2"></div>',
				'4':  '<div class="css3-spinner-rect1"></div><div class="css3-spinner-rect2"></div><div class="css3-spinner-rect3"></div><div class="css3-spinner-rect4"></div><div class="css3-spinner-rect5"></div>',
				'5':  '<div class="css3-spinner-cube1"></div><div class="css3-spinner-cube2"></div>',
				'6':  '<div class="css3-spinner-scaler"></div>',
				'7':  '<div class="css3-spinner-grid-pulse"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>',
				'8':  '<div class="css3-spinner-clip-rotate"><div></div></div>',
				'9':  '<div class="css3-spinner-ball-rotate"><div></div><div></div><div></div></div>',
				'10': '<div class="css3-spinner-zig-zag"><div></div><div></div></div>',
				'11': '<div class="css3-spinner-triangle-path"><div></div><div></div><div></div></div>',
				'12': '<div class="css3-spinner-ball-scale-multiple"><div></div><div></div><div></div></div>',
				'13': '<div class="css3-spinner-ball-pulse-sync"><div></div><div></div><div></div></div>',
				'14': '<div class="css3-spinner-scale-ripple"><div></div><div></div><div></div></div>',
			};

			var _defaultLoader = '<div class="css3-spinner-bounce1"></div><div class="css3-spinner-bounce2"></div><div class="css3-spinner-bounce3"></div>';

			var _sanitizeColorValue = function(v) {
				if( !v ) return '';
				return String(v).replace(/[";{}<>]/g, '');
			};

			return {
				init: function(selector) {
					var body = __core.getVars.elBody;

					__core.initFunction({ class: 'has-plugin-pagetransition', event: 'pluginPageTransitionReady' });

					if( body.classList.contains('no-transition') ) return true;
					if( !body.classList.contains('page-transition') ) body.classList.add('page-transition');

					window.addEventListener('pageshow', function(event) {
						if( event.persisted ) window.location.reload();
					});

					var elAnimIn      = body.getAttribute('data-animation-in') || 'fadeIn';
					var elSpeedIn     = Number(body.getAttribute('data-speed-in')) || 1000;
					var elTimeoutRaw  = body.getAttribute('data-loader-timeout');
					var elTimeout     = elTimeoutRaw ? Number(elTimeoutRaw) : null;
					var elLoader      = body.getAttribute('data-loader');
					var elLoaderColor = body.getAttribute('data-loader-color');
					var elLoaderHtml  = body.getAttribute('data-loader-html');

					var elLoaderCSSVar = '';
					if( elLoaderColor ) {
						var colorValue = elLoaderColor === 'theme' ? 'var(--cnvs-themecolor)' : _sanitizeColorValue(elLoaderColor);
						elLoaderCSSVar = ' style="--cnvs-loader-color:' + colorValue + ';"';
					}

					var innerLoader = elLoaderHtml || _loaderTemplates[elLoader] || _defaultLoader;
					var finalLoaderHtml = '<div class="css3-spinner"' + elLoaderCSSVar + '>' + innerLoader + '</div>';

					if( elAnimIn === 'fadeIn' ) {
						__core.getVars.elWrapper.classList.add('op-1');
					} else {
						__core.getVars.elWrapper.classList.add('not-animated');
					}

					var pageTransition = document.querySelector('.page-transition-wrap');
					if( !pageTransition ) {
						var divPT = document.createElement('div');
						divPT.className = 'page-transition-wrap';
						divPT.innerHTML = finalLoaderHtml;
						body.prepend(divPT);
						pageTransition = divPT;
					}

					if( elSpeedIn ) {
						__core.getVars.elWrapper.style.setProperty('--cnvs-animate-duration', elSpeedIn + 'ms');
						if( elAnimIn === 'fadeIn' ) {
							pageTransition.style.setProperty('--cnvs-animate-duration', elSpeedIn + 'ms');
						}
					}

					var ended = false;
					var failsafeTimer = null;

					var endPageTransition = function() {
						if( ended ) return;
						ended = true;
						clearTimeout(failsafeTimer);

						elAnimIn.split(/\s+/).filter(Boolean).forEach( function(_class) {
							pageTransition.classList.remove(_class);
						});
						pageTransition.classList.add('fadeOut', 'animated');

						var removePageTransition = function() {
							if( pageTransition.parentNode ) pageTransition.remove();
							if( elAnimIn !== 'fadeIn' ) {
								__core.getVars.elWrapper.classList.remove('not-animated');
								(elAnimIn + ' animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
									__core.getVars.elWrapper.classList.add(_class);
								});
							}
						};

						var displayContent = function() {
							body.classList.remove('page-transition');
							setTimeout( function() {
								(elAnimIn + ' animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
									__core.getVars.elWrapper.classList.remove(_class);
								});
							}, 333);
							setTimeout( function() {
								__core.getVars.elWrapper.style.removeProperty('--cnvs-animate-duration');
							}, 666);
						};

						pageTransition.addEventListener('transitionend', removePageTransition, { once: true });
						pageTransition.addEventListener('animationend', removePageTransition, { once: true });
						__core.getVars.elWrapper.addEventListener('transitionend', displayContent, { once: true });
						__core.getVars.elWrapper.addEventListener('animationend', displayContent, { once: true });
					};

					if( document.readyState === 'complete' ) {
						endPageTransition();
					} else {
						window.addEventListener('load', endPageTransition, { once: true });
					}

					if( elTimeout !== null && isFinite(elTimeout) ) {
						setTimeout(endPageTransition, elTimeout);
					}

					failsafeTimer = setTimeout( function() {
						endPageTransition();
						if( pageTransition && pageTransition.parentNode ) {
							pageTransition.remove();
						}
						body.classList.remove('page-transition');
					}, Math.max(elSpeedIn * 3, 8000));
				}
			};
		}(),
		// PageTransition Functions End

		/**
		 * --------------------------------------------------------------------------
		 * LazyLoad Functions Start
		 * --------------------------------------------------------------------------
		 */
		LazyLoad: function() {
			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof LazyLoad !== 'undefined'; },
						class: 'has-plugin-lazyload',
						event: 'pluginlazyLoadReady'
					}).then( function(ready) {
						if( !ready ) return;

						if( window.lazyLoadInstance && typeof window.lazyLoadInstance.destroy === 'function' ) {
							window.lazyLoadInstance.destroy();
						}

						window.lazyLoadInstance = new LazyLoad({
							threshold: 0,
							elements_selector: '.lazy:not(.lazy-loaded)',
							class_loading: 'lazy-loading',
							class_loaded: 'lazy-loaded',
							class_error: 'lazy-error',
							callback_loaded: function(el) {
								__core.addEvent( window, 'lazyLoadLoaded' );
								if( el.parentNode && el.parentNode.getAttribute('data-lazy-container') === 'true' ) {
									__core.runContainerModules( el.parentNode );
								}
							}
						});
					});
				}
			};
		}(),
		// LazyLoad Functions End

		/**
		 * --------------------------------------------------------------------------
		 * DataClasses Functions Start
		 * --------------------------------------------------------------------------
		 */
		DataClasses: function() {
			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-dataclasses', event: 'pluginDataClassesReady' });

					selector = __core.getSelector( selector, false, false );
					if( selector.length < 1 ) return true;

					selector.forEach( function(el) {
						var raw = el.getAttribute('data-class');
						if( !raw ) return;

						var classes = raw.split(/\s+/).filter(Boolean);
						classes.forEach( function(_class) {
							var parts = _class.split(':');
							if( parts.length < 2 || !parts[1] ) return;

							var deviceKey = parts[0];
							var targetClass = parts[1];
							var bodyClass = deviceKey === 'dark' ? 'dark' : 'device-' + deviceKey;

							if( __core.getVars.elBody.classList.contains(bodyClass) ) {
								el.classList.add(targetClass);
							} else {
								el.classList.remove(targetClass);
							}
						});
					});

					__core.getVars.resizers.dataClasses = __core.debounce(function() {
						__modules.dataClasses();
					}, 200);
				}
			};
		}(),
		// DataClasses Functions End

		/**
		 * --------------------------------------------------------------------------
		 * DataHeights Functions Start
		 * --------------------------------------------------------------------------
		 */
		DataHeights: function() {
			var _bpOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];

			var _currentBreakpoint = function() {
				var body = __core.getVars.elBody.classList;
				for( var i = 0; i < _bpOrder.length; i++ ) {
					if( body.contains('device-' + _bpOrder[i]) ) return _bpOrder[i];
				}
				return null;
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-dataheights', event: 'pluginDataHeightsReady' });

					selector = __core.getSelector( selector, false, false );
					if( selector.length < 1 ) return true;

					var bp = _currentBreakpoint();

					selector.forEach( function(el) {
						var h = {
							xs: el.getAttribute('data-height-xs') || 'auto',
						};
						h.sm = el.getAttribute('data-height-sm') || h.xs;
						h.md = el.getAttribute('data-height-md') || h.sm;
						h.lg = el.getAttribute('data-height-lg') || h.md;
						h.xl = el.getAttribute('data-height-xl') || h.lg;
						h.xxl = el.getAttribute('data-height-xxl') || h.xl;

						var elHeight = bp ? h[bp] : null;
						if( !elHeight ) return;

						if( /^-?\d+(\.\d+)?$/.test(String(elHeight)) ) {
							el.style.height = elHeight + 'px';
						} else {
							el.style.height = elHeight;
						}
					});

					__core.getVars.resizers.dataHeights = __core.debounce(function() {
						__modules.dataHeights();
					}, 150);
				}
			};
		}(),
		// DataHeights Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Lightbox Functions Start
		 * --------------------------------------------------------------------------
		 */
		Lightbox: function() {
			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && jQuery().magnificPopup; },
						class: 'has-plugin-lightbox',
						event: 'pluginLightboxReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( selector.length < 1 ) return;

						var closeButtonIcon = '<i class="bi-x-lg"></i>';

						var $body = jQuery('body');

						selector.each( function(){
							var element = jQuery(this);
							var rawEl = element[0];
							if( !__core.markOnce(rawEl, 'cnvsLightboxInit') ) return;

							var elType = element.attr('data-lightbox'),
								elCloseButton = element.attr('data-close-button') === 'inside',
								elDisableUnder = Number(element.attr('data-disable-under')) || 600,
								elFixedContent = element.attr('data-content-position') === 'fixed',
								elZoom = element.attr('data-zoom') === 'true';

							if( elType == 'image' ) {
								var settings = {
									type: 'image',
									tLoading: '',
									closeOnContentClick: true,
									closeBtnInside: elCloseButton,
									fixedContentPos: true,
									mainClass: 'mfp-no-margins mfp-fade',
									image: {
										verticalFit: true
									},
									closeIcon: closeButtonIcon,
								};

								if( elZoom ) {
									settings.zoom = {
										enabled: true,
										duration: 300,
										easing: 'ease-in-out',
										opener: function(openerElement) {
											return openerElement.is('img') ? openerElement : openerElement.find('img');
										}
									};
								}

								element.magnificPopup(settings);
							}

							if( elType == 'gallery' ) {
								if( element.find('a[data-lightbox="gallery-item"]').parent('.clone').hasClass('clone') ) {
									element.find('a[data-lightbox="gallery-item"]').parent('.clone').find('a[data-lightbox="gallery-item"]').attr('data-lightbox','');
								}

								if( element.find('a[data-lightbox="gallery-item"]').parents('.cloned').hasClass('cloned') ) {
									element.find('a[data-lightbox="gallery-item"]').parents('.cloned').find('a[data-lightbox="gallery-item"]').attr('data-lightbox','');
								}

								element.magnificPopup({
									delegate: element.hasClass('grid-container-filterable') ? 'a.grid-lightbox-filtered[data-lightbox="gallery-item"]' : 'a[data-lightbox="gallery-item"]',
									type: 'image',
									tLoading: '',
									closeOnContentClick: true,
									closeBtnInside: elCloseButton,
									fixedContentPos: true,
									mainClass: 'mfp-no-margins mfp-fade', // class to remove default margin from left and right side
									image: {
										verticalFit: true
									},
									gallery: {
										enabled: true,
										navigateByImgClick: true,
										preload: [0,1] // Will preload 0 - before current, and 1 after the current image
									},
									closeIcon: closeButtonIcon,
								});
							}

							if( elType == 'iframe' ) {
								element.magnificPopup({
									disableOn: elDisableUnder,
									type: 'iframe',
									tLoading: '',
									removalDelay: 160,
									preloader: false,
									closeBtnInside: elCloseButton,
									fixedContentPos: elFixedContent,
									closeIcon: closeButtonIcon,
								});
							}

							if( elType == 'inline' ) {
								element.magnificPopup({
									type: 'inline',
									tLoading: '',
									mainClass: 'mfp-no-margins mfp-fade',
									closeBtnInside: elCloseButton,
									fixedContentPos: true,
									overflowY: 'scroll',
									closeIcon: closeButtonIcon,
								});
							}

							if( elType == 'ajax' ) {
								element.magnificPopup({
									type: 'ajax',
									tLoading: '',
									closeBtnInside: elCloseButton,
									autoFocusLast: false,
									closeIcon: closeButtonIcon,
									callbacks: {
										ajaxContentAdded: function(mfpResponse) {
											__core.runContainerModules( document.querySelector('.mfp-content') );
										},
										open: function() {
											$body.addClass('ohidden');
										},
										close: function() {
											$body.removeClass('ohidden');
										}
									}
								});
							}

							if( elType == 'ajax-gallery' ) {
								element.magnificPopup({
									delegate: 'a[data-lightbox="ajax-gallery-item"]',
									type: 'ajax',
									tLoading: '',
									closeBtnInside: elCloseButton,
									closeIcon: closeButtonIcon,
									autoFocusLast: false,
									gallery: {
										enabled: true,
										preload: 0,
										navigateByImgClick: false
									},
									callbacks: {
										ajaxContentAdded: function(mfpResponse) {
											__core.runContainerModules( document.querySelector('.mfp-content') );
										},
										open: function() {
											$body.addClass('ohidden');
										},
										close: function() {
											$body.removeClass('ohidden');
										}
									}
								});
							}

							element.off('mfpOpen.cnvs').on('mfpOpen.cnvs', function(){
								var instance = jQuery.magnificPopup.instance;
								if( !instance ) return;

								var lightboxItem = instance.currItem?.el || instance.st?.el || element;
								var $item = jQuery(lightboxItem);
								var lightboxClass = $item.attr('data-lightbox-class');
								var lightboxBgClass = $item.attr('data-lightbox-bg-class');

								if( lightboxClass && instance.container ) {
									jQuery(instance.container).addClass(lightboxClass);
								}

								if( lightboxBgClass && instance.bgOverlay ) {
									jQuery(instance.bgOverlay).addClass(lightboxBgClass);
								}
							});
						});
					});
				}
			};
		}(),
		// Lightbox Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Modal Functions Start
		 * --------------------------------------------------------------------------
		 */
		Modal: function() {
			var _closeMagnific = function() {
				var mfp = typeof jQuery !== 'undefined' && jQuery.magnificPopup;
				if( !mfp ) return;
				if( mfp.instance && typeof mfp.instance.close === 'function' ) {
					mfp.instance.close();
				} else if( typeof mfp.close === 'function' ) {
					mfp.close();
				}
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && jQuery().magnificPopup; },
						class: 'has-plugin-modal',
						event: 'pluginModalReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( selector.length < 1 ) return;

						var closeButtonIcon = '<i class="bi-x-lg"></i>';

						selector.each( function(){
							var element = jQuery(this);
							var elTarget = element.attr('data-target');
							if( !elTarget || elTarget.charAt(0) !== '#' ) return;

							var elTargetId = elTarget.slice(1);
							var elTargetValue = '__cnvs_' + elTargetId;
							var elDelay = Number(element.attr('data-delay')) || 500;
							var elTimeoutRaw = element.attr('data-timeout');
							var elTimeout = elTimeoutRaw ? Number(elTimeoutRaw) : null;
							var elAnimateIn = element.attr('data-animate-in') || '';
							var elAnimateOut = element.attr('data-animate-out') || '';
							var elBgClick = element.attr('data-bg-click') !== 'false';
							var elCloseBtn = element.attr('data-close-btn') !== 'false';
							var elCookies = element.attr('data-cookies');
							var elCookiePath = element.attr('data-cookie-path');
							var elCookieExp = element.attr('data-cookie-expire');

							if( elCookies === 'false' ) {
								__core.cookie.remove(elTargetValue);
							}

							if( elCookies === 'true' ) {
								var elementCookie = __core.cookie.get(elTargetValue);
								if( typeof elementCookie !== 'undefined' && elementCookie === '0' ) return;
							}

							var totalDelay = elDelay + 500;

							setTimeout(function() {
								jQuery.magnificPopup.open({
									items: { src: elTarget },
									type: 'inline',
									mainClass: 'mfp-no-margins mfp-fade',
									closeBtnInside: false,
									fixedContentPos: true,
									closeOnBgClick: elBgClick,
									showCloseBtn: elCloseBtn,
									removalDelay: 500,
									closeIcon: closeButtonIcon,
									callbacks: {
										open: function() {
											if( elAnimateIn ) {
												jQuery(elTarget).addClass(elAnimateIn + ' animated');
											}
										},
										beforeClose: function() {
											if( elAnimateOut ) {
												var $target = jQuery(elTarget);
												if( elAnimateIn ) $target.removeClass(elAnimateIn);
												$target.addClass(elAnimateOut);
											}
										},
										afterClose: function() {
											if( elAnimateIn || elAnimateOut ) {
												jQuery(elTarget).removeClass(elAnimateIn + ' ' + elAnimateOut + ' animated');
											}
										}
									}
								}, 0);
							}, totalDelay);

							var scopedClose = document.querySelector(elTarget + ' .modal-cookies-close')
								|| document.querySelector('.modal-cookies-close');
							if( scopedClose ) {
								scopedClose.addEventListener('click', function(e) {
									e.preventDefault();
									_closeMagnific();
									if( elCookies === 'true' ) {
										var cookieOps = {};
										if( elCookieExp ) cookieOps.expires = Number(elCookieExp);
										if( elCookiePath ) cookieOps.path = elCookiePath;
										__core.cookie.set(elTargetValue, '0', cookieOps);
									}
								});
							}

							if( elTimeout !== null && isFinite(elTimeout) ) {
								setTimeout(function() {
									_closeMagnific();
								}, totalDelay + elTimeout);
							}
						});
					});
				}
			};
		}(),
		// Modal Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Animations Functions Start
		 * --------------------------------------------------------------------------
		 */
		Animations: function() {
			var _observer = null;

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-animations', event: 'pluginAnimationsReady' });

					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ){
						return true;
					}

					var SELECTOR = '[data-animate]';
					var ANIMATE_CLASS_NAME = 'animated';

					var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

					var isAnimated = function(element) {
						return element.classList.contains(ANIMATE_CLASS_NAME);
					};

					if( _observer ) {
						_observer.disconnect();
						_observer = null;
					}

					if( prefersReducedMotion ) {
						document.querySelectorAll(SELECTOR).forEach( function(element) {
							var elAnimation = element.getAttribute('data-animate');
							if( elAnimation ) {
								elAnimation.split(/\s+/).filter(Boolean).forEach( function(item) {
									element.classList.add(item);
								});
							}
							element.classList.add(ANIMATE_CLASS_NAME);
						});
						return;
					}

					_observer = new IntersectionObserver(
						function(entries, observer) {
							entries.forEach( function(entry) {
								var element = entry.target;

								if( element.closest('.fslider.no-thumbs-animate') || element.closest('.swiper-slide') ) {
									observer.unobserve(element);
									return;
								}

								var elAnimation = element.getAttribute('data-animate');
								if( !elAnimation ) {
									observer.unobserve(element);
									return;
								}

								var elAnimations = elAnimation.split(/\s+/).filter(Boolean);
								if( elAnimations.length === 0 ) {
									observer.unobserve(element);
									return;
								}

								var elAnimOut = element.getAttribute('data-animate-out');
								var elAnimDelay = element.getAttribute('data-delay');
								var elAnimDelayOut = element.getAttribute('data-delay-out');
								var elAnimDelayTime = elAnimDelay ? Number(elAnimDelay) + 500 : 500;
								var elAnimDelayOutTime = ( elAnimOut && elAnimDelayOut )
									? Number(elAnimDelayOut) + elAnimDelayTime
									: elAnimDelayTime + 3000;

								if( !element.classList.contains(ANIMATE_CLASS_NAME) ) {
									element.classList.add('not-animated');
									if( entry.intersectionRatio > 0 ) {
										setTimeout( function() {
											element.classList.remove('not-animated');
											elAnimations.forEach( function(item) {
												element.classList.add(item);
											});
											element.classList.add(ANIMATE_CLASS_NAME);
										}, elAnimDelayTime);

										if( elAnimOut ) {
											setTimeout( function() {
												elAnimations.forEach( function(item) {
													element.classList.remove(item);
												});
												elAnimOut.split(/\s+/).filter(Boolean).forEach( function(item) {
													element.classList.add(item);
												});
											}, elAnimDelayOutTime);
										}
									}
								}

								if( !element.classList.contains('not-animated') ) {
									observer.unobserve(element);
								}
							});
						}
					);

					var elements = [].filter.call(document.querySelectorAll(SELECTOR), function(element) {
						return !isAnimated(element);
					});

					elements.forEach( function(element) {
						_observer.observe(element);
					});
				}
			};
		}(),
		// Animations Functions End

		/**
		 * --------------------------------------------------------------------------
		 * HoverAnimations Functions Start
		 * --------------------------------------------------------------------------
		 */
		HoverAnimations: function() {
			var _bindings = new WeakMap();

			var _showOverlay = function(state) {
				clearTimeout(state.hideTimer);

				state.showTimer = setTimeout( function() {
					state.element.classList.add('not-animated');

					(state.elAnimateOut + ' not-animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
						state.element.classList.remove(_class);
					});

					(state.elAnimate + ' animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
						state.element.classList.add(_class);
					});
				}, state.elDelayT);
			};

			var _hideOverlay = function(state) {
				state.element.classList.add('not-animated');

				(state.elAnimate + ' not-animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
					state.element.classList.remove(_class);
				});

				(state.elAnimateOut + ' animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
					state.element.classList.add(_class);
				});

				if( state.elReset === 'true' ) {
					state.hideTimer = setTimeout( function() {
						(state.elAnimateOut + ' animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
							state.element.classList.remove(_class);
						});
						state.element.classList.add('not-animated');
					}, Number(state.elSpeed));
				}

				clearTimeout(state.showTimer);
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-hoveranimation', event: 'pluginHoverAnimationReady' });

					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ) return true;

					selector.forEach( function(element) {
						var elAnimate    = element.getAttribute('data-hover-animate');
						if( !elAnimate ) return;

						var elAnimateOut = element.getAttribute('data-hover-animate-out') || 'fadeOut';
						var elSpeed      = element.getAttribute('data-hover-speed') || 600;
						var elDelay      = element.getAttribute('data-hover-delay');
						var elParentAttr = element.getAttribute('data-hover-parent');
						var elReset      = element.getAttribute('data-hover-reset') || 'false';
						var elMobile     = element.getAttribute('data-hover-mobile') || 'true';

						if( elMobile !== 'true' ) {
							var requiredClass = elMobile === 'false' ? 'device-up-lg' : 'device-up-' + elMobile;
							if( !__core.getVars.elBody.classList.contains(requiredClass) ) return;
						}

						element.classList.add('not-animated');

						var elParent;
						if( !elParentAttr ) {
							elParent = element.closest('.bg-overlay') || element;
						} else if( elParentAttr === 'self' ) {
							elParent = element;
						} else {
							elParent = element.closest(elParentAttr);
						}
						if( !elParent ) return;

						if( elSpeed ) {
							element.style.animationDuration = Number(elSpeed) + 'ms';
						}

						var prev = _bindings.get(element);
						if( prev ) {
							if( prev.parent && prev.enter ) prev.parent.removeEventListener('mouseenter', prev.enter);
							if( prev.parent && prev.leave ) prev.parent.removeEventListener('mouseleave', prev.leave);
							clearTimeout(prev.state.showTimer);
							clearTimeout(prev.state.hideTimer);
						}

						var state = {
							element: element,
							elAnimate: elAnimate,
							elAnimateOut: elAnimateOut,
							elSpeed: elSpeed,
							elDelayT: elDelay ? Number(elDelay) : 0,
							elReset: elReset,
							showTimer: null,
							hideTimer: null,
						};

						var enterHandler = function() { _showOverlay(state); };
						var leaveHandler = function() { _hideOverlay(state); };
						elParent.addEventListener('mouseenter', enterHandler, false);
						elParent.addEventListener('mouseleave', leaveHandler, false);

						_bindings.set(element, { parent: elParent, enter: enterHandler, leave: leaveHandler, state: state });
					});
				}
			};
		}(),
		// HoverAnimations Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Grid Functions Start
		 * --------------------------------------------------------------------------
		 */
		Grid: function() {
			var _bindings = new WeakMap();

			var _reLayout = function(el) {
				el.filter('.has-init-isotope').isotope('layout');
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && typeof Isotope !== 'undefined'; },
						class: 'has-plugin-isotope',
						event: 'pluginIsotopeReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( selector.length < 1 ) return;

						selector.each( function() {
							var element = jQuery(this);
							var rawEl = element[0];

							var prev = _bindings.get(rawEl);
							if( prev ) {
								if( prev.lazyHandler ) window.removeEventListener('lazyLoadLoaded', prev.lazyHandler);
								if( prev.loadHandler ) window.removeEventListener('load', prev.loadHandler);
								if( prev.pollInterval ) clearInterval(prev.pollInterval);
							}

							var elTransition = element.attr('data-transition') || '0.65s',
								elLayoutMode = element.attr('data-layout') || 'masonry',
								elStagger    = Number(element.attr('data-stagger')) || 0,
								elBase       = element.attr('data-basewidth') || '.portfolio-item:not(.wide):eq(0)',
								elOriginLeft = !__core.getVars.isRTL;

							_reLayout(element);

							var commonOpts = {
								layoutMode: elLayoutMode,
								isOriginLeft: elOriginLeft,
								transitionDuration: elTransition,
								stagger: elStagger,
								percentPosition: true,
							};

							if( element.hasClass('portfolio') || element.hasClass('post-timeline') ){
								commonOpts.masonry = { columnWidth: element.find(elBase)[0] };
							}

							element.filter(':not(.has-init-isotope)').isotope(commonOpts);

							if( element.data('isotope') ) {
								element.addClass('has-init-isotope');
							}

							var pollInterval = setInterval( function() {
								var total = element.find('.lazy').length;
								if( total === 0 || element.find('.lazy.lazy-loaded').length === total ) {
									setTimeout( function() { _reLayout(element); }, 666);
									clearInterval(pollInterval);
								}
							}, 1000);

							setTimeout( function() { clearInterval(pollInterval); }, 30000);

							var lazyHandler = function() { _reLayout(element); };
							var loadHandler = function() { _reLayout(element); };
							window.addEventListener('lazyLoadLoaded', lazyHandler);
							window.addEventListener('load', loadHandler);

							_bindings.set(rawEl, {
								lazyHandler: lazyHandler,
								loadHandler: loadHandler,
								pollInterval: pollInterval,
							});
						});

						__core.getVars.resizers.isotope = function() {
							selector.each( function() { _reLayout(jQuery(this)); });
						};
					});
				}
			};
		}(),
		// Grid Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Filter Functions Start
		 * --------------------------------------------------------------------------
		 */
		Filter: function() {
			var _escapeAttr = function(val) {
				if( !val ) return '';
				if( typeof CSS !== 'undefined' && CSS.escape ) return CSS.escape(val);
				return String(val).replace(/(["\\])/g, '\\$1');
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && typeof Isotope !== 'undefined'; },
						class: 'has-plugin-isotope-filter',
						event: 'pluginGridFilterReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( selector.length < 1 ) return;

						selector.each( function() {
							var element = jQuery(this);
							var elCon = element.attr('data-container');
							var elActClass = element.attr('data-active-class') || 'activeFilter';
							var elDefFilter = element.attr('data-default');
							var $container = jQuery(elCon);

							if( !$container.hasClass('grid-container') ) return;

							element.find('a').off('click.filter').on('click.filter', function(){
								var filterValue = jQuery(this).attr('data-filter');
								if( !filterValue ) return false;
								element.find('li').removeClass(elActClass);
								jQuery(this).parent('li').addClass(elActClass);
								$container.isotope({ filter: filterValue });
								return false;
							});

							if( elDefFilter ) {
								element.find('li').removeClass(elActClass);
								var defaultSel = '[data-filter="' + _escapeAttr(elDefFilter) + '"]';
								element.find(defaultSel).parent('li').addClass(elActClass);
								$container.isotope({ filter: elDefFilter });
							}

							$container.off('arrangeComplete.filter layoutComplete.filter')
								.on('arrangeComplete.filter layoutComplete.filter', function(_event, filteredItems) {
									$container.addClass('grid-container-filterable');
									if( $container.attr('data-lightbox') === 'gallery' ) {
										$container.find('[data-lightbox]').removeClass('grid-lightbox-filtered');
										filteredItems.forEach( function(item) {
											jQuery(item.element).find('[data-lightbox]').addClass('grid-lightbox-filtered');
										});
									}
									__modules.lightbox();
								});
						});

						jQuery('.grid-shuffle').off('click.filter').on('click.filter', function(){
							var element = jQuery(this);
							var elCon = element.attr('data-container');
							var $container = jQuery(elCon);
							if( !$container.hasClass('grid-container') ) return false;
							$container.isotope('shuffle');
						});
					});
				}
			};
		}(),
		// Filter Functions End

		/**
		 * --------------------------------------------------------------------------
		 * CanvasSlider Functions Start
		 * --------------------------------------------------------------------------
		 */
		CanvasSlider: function() {
			var _applyAnimation = function(el, baseDelay) {
				var toAnimateDelay = el.getAttribute('data-delay');
				var toAnimateDelayTime = toAnimateDelay ? Number(toAnimateDelay) + baseDelay : baseDelay;

				if( el.classList.contains('animated') ) return;
				el.classList.add('not-animated');

				var elementAnimation = el.getAttribute('data-animate');
				if( !elementAnimation ) return;

				setTimeout( function() {
					el.classList.remove('not-animated');
					(elementAnimation + ' animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
						el.classList.add(_class);
					});
				}, toAnimateDelayTime);
			};

			var _resetNonActiveAnimations = function(element) {
				element.querySelectorAll('[data-animate]').forEach( function(el) {
					var slide = el.closest('.swiper-slide');
					if( slide && slide.classList.contains('swiper-slide-active') ) return;
					var elementAnimation = el.getAttribute('data-animate');
					if( elementAnimation ) {
						(elementAnimation + ' animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
							el.classList.remove(_class);
						});
					}
					el.classList.add('not-animated');
				});
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof Swiper !== 'undefined'; },
						class: 'has-plugin-swiper',
						event: 'pluginSwiperReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector, false );
						if( selector.length < 1 ) return;

						selector.forEach( function(element) {
							if( !element.classList.contains('swiper_wrapper') ) return;
							if( element.querySelectorAll('.swiper-slide').length < 1 ) return;

							var swiperParent = element.querySelector('.swiper-parent');
							if( !swiperParent ) return;

							if( swiperParent.swiper && typeof swiperParent.swiper.destroy === 'function' ) {
								swiperParent.swiper.destroy(true, true);
							}

							var elDirection = element.getAttribute('data-direction') || 'horizontal',
								elSpeed = element.getAttribute('data-speed') || 300,
								elAutoPlayRaw = element.getAttribute('data-autoplay'),
								elAutoPlayDisableOnInteraction = element.getAttribute('data-autoplay-disable-on-interaction'),
								elPauseOnHover = element.getAttribute('data-hover') === 'true',
								elLoop = element.getAttribute('data-loop') === 'true',
								elStart = element.getAttribute('data-start') || 1,
								elEffect = element.getAttribute('data-effect') || 'slide',
								elGrabCursor = element.getAttribute('data-grab') !== 'false',
								elParallax = element.getAttribute('data-parallax') === 'true',
								elAutoHeight = element.getAttribute('data-autoheight') === 'true',
								slideNumberTotal = element.querySelector('.slide-number-total'),
								slideNumberCurrent = element.querySelector('.slide-number-current'),
								elVideoAutoPlay = element.getAttribute('data-video-autoplay') !== 'false';

							var disableOnInteraction = elAutoPlayDisableOnInteraction === 'false' ? false : true;
							var autoplayConfig = elAutoPlayRaw
								? { delay: Number(elAutoPlayRaw), pauseOnMouseEnter: elPauseOnHover, disableOnInteraction: disableOnInteraction }
								: false;

							var realSlides = element.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)');
							elStart = elStart == 'random'
								? Math.floor( Math.random() * realSlides.length )
								: Number( elStart ) - 1;

							var elPagination = element.querySelector('.swiper-pagination');
							var elementNavNext = element.querySelector('.slider-arrow-right');
							var elementNavPrev = element.querySelector('.slider-arrow-left');
							var elementScollBar = element.querySelector('.swiper-scrollbar');

							var hasJQ = function() { return typeof jQuery !== 'undefined'; };

							var playActiveYTVideo = function() {
								if( !hasJQ() ) return;
								var active = element.querySelector('.swiper-slide-active .yt-bg-player.mb_YTPlayer:not(.customjs)');
								if( active ) {
									try { jQuery(active).YTPPlay(); } catch(e) {}
								}
							};

							var cnvsSwiper = new Swiper( swiperParent, {
								direction: elDirection,
								speed: Number( elSpeed ),
								autoplay: autoplayConfig,
								loop: elLoop,
								initialSlide: elStart,
								effect: elEffect,
								parallax: elParallax,
								slidesPerView: 1,
								grabCursor: elGrabCursor,
								autoHeight: elAutoHeight,
								pagination: elPagination ? { el: elPagination, clickable: true } : false,
								navigation: (elementNavPrev || elementNavNext) ? { prevEl: elementNavPrev, nextEl: elementNavNext } : false,
								scrollbar: elementScollBar ? { el: elementScollBar } : false,
								on: {
									afterInit: function(swiper) {
										__base.sliderDimensions();

										if( element.querySelectorAll('.yt-bg-player').length > 0 ) {
											element.querySelectorAll('.yt-bg-player').forEach( function(el) {
												el.setAttribute('data-autoplay', 'false');
												el.classList.remove('customjs');
											});

											__modules.youtubeBgVideo();

											if( hasJQ() ) {
												var activeYTVideo = jQuery(element).find('.swiper-slide-active .yt-bg-player:not(.customjs)');
												activeYTVideo.on('YTPReady', function() {
													setTimeout( function() {
														activeYTVideo.filter('.mb_YTPlayer').YTPPlay();
													}, 1200);
												});
											}
										}

										element.querySelectorAll('.swiper-slide-active [data-animate]').forEach( function(el) {
											_applyAnimation(el, 750);
										});

										_resetNonActiveAnimations(element);

										if( elAutoHeight ) {
											setTimeout( function() {
												swiper.updateAutoHeight(300);
											}, 1000);
										}
									},
									transitionStart: function() {
										_resetNonActiveAnimations(element);
										__base.sliderMenuClass();
									},
									transitionEnd: function(swiper) {
										if( slideNumberCurrent ) {
											var active = element.querySelector('.swiper-slide.swiper-slide-active');
											if( elLoop && active ) {
												slideNumberCurrent.innerHTML = Number( active.getAttribute('data-swiper-slide-index') ) + 1;
											} else {
												slideNumberCurrent.innerHTML = swiper.activeIndex + 1;
											}
										}

										element.querySelectorAll('.swiper-slide').forEach( function(slide) {
											var video = slide.querySelector('video');
											if( video && elVideoAutoPlay ) {
												video.pause();
											}
											if( hasJQ() ) {
												var ytActive = slide.querySelector('.yt-bg-player.mb_YTPlayer:not(.customjs)');
												if( ytActive ) {
													try { jQuery(ytActive).YTPPause(); } catch(e) {}
												}
											}
										});

										element.querySelectorAll('.swiper-slide:not(.swiper-slide-active)').forEach( function(slide) {
											var video = slide.querySelector('video');
											if( video && video.currentTime !== 0 ) {
												video.currentTime = 0;
											}
											if( hasJQ() ) {
												var ytPlayer = slide.querySelector('.yt-bg-player.mb_YTPlayer:not(.customjs)');
												if( ytPlayer ) {
													try { jQuery(ytPlayer).YTPSeekTo( ytPlayer.getAttribute('data-start') ); } catch(e) {}
												}
											}
										});

										var activeSlide = element.querySelector('.swiper-slide.swiper-slide-active');
										if( activeSlide && elVideoAutoPlay ) {
											var activeVideo = activeSlide.querySelector('video');
											if( activeVideo ) activeVideo.play();
											playActiveYTVideo();
										}

										element.querySelectorAll('.swiper-slide.swiper-slide-active [data-animate]').forEach( function(el) {
											_applyAnimation(el, 300);
										});
									}
								}
							});

							if( slideNumberCurrent ) {
								if( elLoop ) {
									slideNumberCurrent.innerHTML = cnvsSwiper.realIndex + 1;
								} else {
									slideNumberCurrent.innerHTML = cnvsSwiper.activeIndex + 1;
								}
							}

							if( slideNumberTotal ) {
								slideNumberTotal.innerHTML = realSlides.length;
							}
						});
					});
				}
			};
		}(),
		// CanvasSlider Functions End

		/**
		 * --------------------------------------------------------------------------
		 * SliderParallax Functions Start
		 * --------------------------------------------------------------------------
		 */
		SliderParallax: function() {
			var _settings;
			var _cache = {
				height: 0,
				hasInner: false,
				fadeEls: null,
				lastTransformEl: 0,
				lastTransformCaption: 0,
				lastVisible: null,
				rafPending: false,
			};

			var _measureHeight = function() {
				if( _settings && _settings.sliderPx && _settings.sliderPx.el ) {
					_cache.height = _settings.sliderPx.el.offsetHeight;
				}
			};

			var _setParallax = function(yPos, el, lastKey) {
				if( !el ) return;
				if( _cache[lastKey] === yPos ) return;
				_cache[lastKey] = yPos;
				el.style.transform = 'translate3d(0,' + yPos + 'px,0)';
			};

			var _setVisibility = function(visible) {
				if( _cache.lastVisible === visible ) return;
				_cache.lastVisible = visible;
				if( visible ) {
					_settings.classes.add('slider-parallax-visible');
					_settings.classes.remove('slider-parallax-invisible');
				} else {
					_settings.classes.add('slider-parallax-invisible');
					_settings.classes.remove('slider-parallax-visible');
				}
			};

			var _update = function() {
				_cache.rafPending = false;

				if( !_settings || !_settings.sliderPx.el ) return;

				var sliderPx = _settings.sliderPx;
				var scrollY = window.scrollY;
				_settings.scrollPos.y = scrollY;

				var isExpandedMenu = _settings.body.classList.contains('is-expanded-menu');

				if( isExpandedMenu && !_settings.isMobile ) {
					var inViewport = ( _cache.height + sliderPx.offset + 50 ) > scrollY;

					if( inViewport ) {
						_setVisibility(true);

						if( scrollY > sliderPx.offset ) {
							var delta = scrollY - sliderPx.offset;
							var t1, t2, targetEl;

							if( _cache.hasInner ) {
								t1 = delta * -0.4;
								t2 = delta * -0.15;
								targetEl = sliderPx.inner;
							} else {
								t1 = delta / 1.5;
								t2 = delta / 7;
								targetEl = sliderPx.el;
							}

							_setParallax(t1, targetEl, 'lastTransformEl');
							_setParallax(t2, sliderPx.caption, 'lastTransformCaption');
						} else {
							_setParallax(0, _cache.hasInner ? sliderPx.inner : sliderPx.el, 'lastTransformEl');
							_setParallax(0, sliderPx.caption, 'lastTransformCaption');
						}
					} else {
						_setVisibility(false);
					}
				} else {
					_setParallax(0, _cache.hasInner ? sliderPx.inner : sliderPx.el, 'lastTransformEl');
					_setParallax(0, sliderPx.caption, 'lastTransformCaption');
					_setVisibility(true);
				}

				if( _cache.fadeEls && _cache.fadeEls.length ) {
					if( isExpandedMenu && !_settings.isMobile ) {
						if( _cache.lastVisible ) {
							var headerEl = _settings.header;
							var headerOffset = ( (headerEl && headerEl.classList.contains('transparent-header')) || _settings.body.classList.contains('side-header') ) ? 100 : 0;
							var opacity = 1 - ( ( ( scrollY - headerOffset ) * 1.85 ) / _cache.height );
							if( opacity < 0 ) opacity = 0;
							else if( opacity > 1 ) opacity = 1;

							for( var i = 0, len = _cache.fadeEls.length; i < len; i++ ) {
								_cache.fadeEls[i].style.opacity = opacity;
							}
						}
					} else {
						for( var j = 0, jlen = _cache.fadeEls.length; j < jlen; j++ ) {
							_cache.fadeEls[j].style.opacity = 1;
						}
					}
				}
			};

			var _requestUpdate = function() {
				if( _cache.rafPending ) return;
				_cache.rafPending = true;
				window.requestAnimationFrame(_update);
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof fastdom !== 'undefined'; }
					}).then( function(ready) {
						if( !ready ) return;

						_settings = {
							sliderPx: __core.getVars.sliderParallax,
							body: __core.getVars.elBody,
							header: __core.getVars.elHeader,
							scrollPos: __core.getVars.scrollPos,
							isMobile: __mobile.any(),
							get classes() {
								return this.sliderPx.el.classList;
							},
						};

						if( !_settings.sliderPx.el ) return;

						_cache.hasInner = !!_settings.sliderPx.el.querySelector('.slider-inner');
						_cache.fadeEls = _settings.sliderPx.el.querySelectorAll(
							'.slider-arrow-left,.slider-arrow-right,.slider-caption,.slider-element-fade'
						);
						_measureHeight();

						var initTarget = _cache.hasInner ? _settings.sliderPx.inner : _settings.sliderPx.el;
						_setParallax(0, initTarget, 'lastTransformEl');
						_setParallax(0, _settings.sliderPx.caption, 'lastTransformCaption');

						window.addEventListener('scroll', _requestUpdate, { passive: true });

						__core.getVars.resizers.sliderparallax = function() {
							_measureHeight();
							_requestUpdate();
						};
					});
				}
			};
		}(),
		// SliderParallax Functions End

		/**
		 * --------------------------------------------------------------------------
		 * FlexSlider Functions Start
		 * --------------------------------------------------------------------------
		 */
		FlexSlider: function() {
			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && jQuery().flexslider; },
						class: 'has-plugin-flexslider',
						event: 'pluginFlexSliderReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( selector.length < 1 ) return;

						selector.each(function() {
							var element = jQuery(this);
							var $flex = element.find('.flexslider');
							if( $flex.data('flexslider') ) {
								return;
							}

							var elAnimation  = element.attr('data-animation') || 'slide',
								elEasing     = element.attr('data-easing') || 'swing',
								elDirection  = element.attr('data-direction') || 'horizontal',
								elReverse    = element.attr('data-reverse') === 'true',
								elSlideshow  = element.attr('data-slideshow') !== 'false',
								elPause      = Number(element.attr('data-pause')) || 5000,
								elSpeed      = Number(element.attr('data-speed')) || 600,
								elVideo      = element.attr('data-video') === 'true',
								elPagiRaw    = element.attr('data-pagi'),
								elArrows     = element.attr('data-arrows') !== 'false',
								elArrowLeft  = element.attr('data-arrow-left') || 'uil uil-angle-left-b',
								elArrowRight = element.attr('data-arrow-right') || 'uil uil-angle-right-b',
								elThumbs     = element.attr('data-thumbs') === 'true',
								elHover      = element.attr('data-hover') !== 'false',
								elSheight    = element.attr('data-smooth-height') !== 'false',
								elTouch      = element.attr('data-touch') !== 'false',
								elUseCSS     = elEasing === 'swing';

							var elPagi = elPagiRaw === 'false' ? false : true;
							if( elThumbs ) elPagi = 'thumbnails';
							if( elDirection === 'vertical' ) elSheight = false;

							$flex.flexslider({
								selector: '.slider-wrap > .slide',
								animation: elAnimation,
								easing: elEasing,
								direction: elDirection,
								reverse: elReverse,
								slideshow: elSlideshow,
								slideshowSpeed: elPause,
								animationSpeed: elSpeed,
								pauseOnHover: elHover,
								video: elVideo,
								controlNav: elPagi,
								directionNav: elArrows,
								smoothHeight: elSheight,
								useCSS: elUseCSS,
								touch: elTouch,
								start: function( slider ){
									__modules.animations();
									__modules.lightbox();

									$flex.find('.flex-prev').html('<i class="' + elArrowLeft + '"></i>');
									$flex.find('.flex-next').html('<i class="' + elArrowRight + '"></i>');

									setTimeout( function(){
										var $iso = slider.parents('.grid-container.has-init-isotope');
										if( $iso.length > 0 ) $iso.isotope('layout');
									}, 1200);

									if( typeof skrollrInstance !== 'undefined' ) {
										skrollrInstance.refresh();
									}
								},
								after: function( slider ){
									var $iso = slider.parents('.grid-container.has-init-isotope');
									if( $iso.length > 0 && !slider.hasClass('flexslider-grid-relayout') ) {
										$iso.isotope('layout');
										slider.addClass('flexslider-grid-relayout');
									}
									jQuery('.menu-item:visible').find('.flexslider .slide').resize();
								}
							});
						});
					});
				}
			};
		}(),
		// FlexSlider Functions End

		/**
		 * --------------------------------------------------------------------------
		 * FullVideo Functions Start
		 * --------------------------------------------------------------------------
		 */
		FullVideo: function() {
			var _state = new WeakMap();
			var _observer = null;
			var _reducedMotionMQ = null;
			var _supportsObjectFit = (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('object-fit', 'cover'));

			var _parseRatio = function(str) {
				if( !str ) return [16, 9];
				var parts = String(str).split(/[\/:x]/);
				var w = Number(parts[0]);
				var h = Number(parts[1]);
				if( !w || !h || !isFinite(w) || !isFinite(h) ) return [16, 9];
				return [w, h];
			};

			var _ensureAutoplayAttrs = function(video) {
				if( !video.hasAttribute('muted') ) {
					video.setAttribute('muted', '');
					video.muted = true;
				}
				if( !video.hasAttribute('playsinline') ) video.setAttribute('playsinline', '');
				if( !video.hasAttribute('webkit-playsinline') ) video.setAttribute('webkit-playsinline', '');
			};

			var _applyCoverCSS = function(video) {
				video.style.position = video.style.position || 'absolute';
				video.style.top = '0';
				video.style.left = '0';
				video.style.width = '100%';
				video.style.height = '100%';
				video.style.objectFit = 'cover';
			};

			var _applyJSLayout = function(element, state) {
				var video = state.video;
				var divWidth = element.offsetWidth;
				var divHeight = element.offsetHeight;
				if( divWidth === 0 || divHeight === 0 ) return;

				var ratioW = state.ratio[0];
				var ratioH = state.ratio[1];

				var elWidth = (ratioW * divHeight) / ratioH;
				var elHeight = divHeight;

				if( elWidth < divWidth ) {
					elWidth = divWidth;
					elHeight = (ratioH * divWidth) / ratioW;
				}

				video.style.width = elWidth + 'px';
				video.style.height = elHeight + 'px';
				video.style.left = (elWidth > divWidth ? -((elWidth - divWidth) / 2) : 0) + 'px';
				video.style.top = (elHeight > divHeight ? -((elHeight - divHeight) / 2) : 0) + 'px';
			};

			var _layout = function(element, state) {
				if( !state || !state.video ) return;
				if( _supportsObjectFit ) {
					_applyCoverCSS(state.video);
				} else {
					_applyJSLayout(element, state);
				}
			};

			var _syncPlaceholder = function(element, state) {
				var isMobile = SEMICOLON.Mobile && SEMICOLON.Mobile.any();
				var allowPlaceholder = !element.classList.contains('no-placeholder');

				if( isMobile && allowPlaceholder ) {
					if( state.placeholderEl ) return;
					var src = state.video.getAttribute('poster') || state.video.getAttribute('data-poster');
					if( !src ) return;
					var ph = document.createElement('div');
					ph.className = 'video-placeholder';
					ph.style.backgroundImage = 'url(' + src + ')';
					element.appendChild(ph);
					state.placeholderEl = ph;
					state.video.classList.add('d-none');
					try { state.video.pause(); } catch(e) {}
				} else {
					if( !state.placeholderEl ) return;
					state.placeholderEl.remove();
					state.placeholderEl = null;
					state.video.classList.remove('d-none');
					try { state.video.play(); } catch(e) {}
				}
			};

			var _applyReducedMotion = function(state) {
				if( !_reducedMotionMQ || !_reducedMotionMQ.matches ) return;
				try { state.video.pause(); } catch(e) {}
			};

			var _initElement = function(element) {
				if( _state.has(element) ) return;
				var video = element.querySelector('video');
				if( !video ) return;

				_ensureAutoplayAttrs(video);

				var state = {
					video: video,
					ratio: _parseRatio(element.getAttribute('data-ratio')),
					placeholderEl: null,
				};
				_state.set(element, state);

				var onReady = function() {
					_layout(element, state);
					video.removeEventListener('loadedmetadata', onReady);
				};
				if( video.readyState >= 1 ) {
					_layout(element, state);
				} else {
					video.addEventListener('loadedmetadata', onReady);
				}

				_syncPlaceholder(element, state);
				_applyReducedMotion(state);

				if( _observer ) _observer.observe(element);
			};

			var _handleMotionChange = function(list) {
				list.forEach(function(el) {
					var state = _state.get(el);
					if( state ) _applyReducedMotion(state);
				});
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ) return true;

					__core.initFunction({ class: 'has-plugin-html5video', event: 'pluginHtml5VideoReady' });

					selector = __core.getSelector(selector, false, false);
					if( selector.length < 1 ) return true;

					if( !_observer && 'ResizeObserver' in window ) {
						_observer = new ResizeObserver(function(entries) {
							for( var i = 0, len = entries.length; i < len; i++ ) {
								var el = entries[i].target;
								var state = _state.get(el);
								if( state ) _layout(el, state);
							}
						});
					}

					if( !_reducedMotionMQ && window.matchMedia ) {
						_reducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
						_reducedMotionMQ.addEventListener('change', function() {
							_handleMotionChange(selector);
						});
					}

					selector.forEach(_initElement);

					__core.getVars.resizers.html5video = function() {
						selector.forEach(function(el) {
							var state = _state.get(el);
							if( !state ) return;
							_layout(el, state);
							_syncPlaceholder(el, state);
						});
					};
				}
			};
		}(),
		// FullVideo Functions End

		/**
		 * --------------------------------------------------------------------------
		 * YoutubeBG Functions Start
		 * --------------------------------------------------------------------------
		 */
		YoutubeBG: function() {
			var _counter = 0;

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && jQuery().YTPlayer; },
						class: 'has-plugin-youtubebg',
						event: 'pluginYoutubeBgVideoReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector, true, '.mb_YTPlayer,.customjs' );
						if( !selector || selector.length < 1 ) return;

						selector.each( function(){
							var element = jQuery(this);
							var raw = element[0];
							if( !raw ) return;

							var elVideo = element.attr('data-video');
							if( !elVideo ) return;

							if( !__core.markOnce(raw, 'cnvsYoutubebgInit') ) return;

							var elContainer = element.attr('data-container') || 'parent';
							if( elContainer === 'parent' ) {
								var parent = element.parent();
								var parentEl = parent[0];
								if( parentEl ) {
									var existingId = parent.attr('id');
									if( existingId ) {
										elContainer = '#' + existingId;
									} else {
										var ytPid = 'yt-bg-player-parent-' + (++_counter) + '-' + Date.now().toString(36);
										parent.attr('id', ytPid);
										elContainer = '#' + ytPid;
									}
								}
							}

							element.YTPlayer({
								videoURL:          elVideo,
								mute:              __core.toBool(element.attr('data-mute'), true),
								ratio:             element.attr('data-ratio') || '16/9',
								quality:           element.attr('data-quality') || 'hd720',
								opacity:           __core.toNumber(element.attr('data-opacity'), 1),
								containment:       elContainer,
								optimizeDisplay:   __core.toBool(element.attr('data-optimize'), true),
								loop:              __core.toBool(element.attr('data-loop'), true),
								vol:               __core.toNumber(element.attr('data-volume'), 50),
								startAt:           __core.toNumber(element.attr('data-start'), 0),
								stopAt:            __core.toNumber(element.attr('data-stop'), 0),
								autoPlay:          __core.toBool(element.attr('data-autoplay'), true),
								realfullscreen:    __core.toBool(element.attr('data-fullscreen'), false),
								showYTLogo:        false,
								showControls:      __core.toBool(element.attr('data-controls'), false),
								coverImage:        element.attr('data-coverimage') || '',
								stopMovieOnBlur:   __core.toBool(element.attr('data-pauseonblur'), true),
								playOnlyIfVisible: __core.toBool(element.attr('data-playifvisible'), false)
							});
						});
					});
				}
			};
		}(),
		// YoutubeBG Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Toggle Functions Start
		 * --------------------------------------------------------------------------
		 */
		Toggle: function() {
			var _parseSpeed = function(raw) {
				if( !raw ) return 300;
				var n = Number(raw);
				if( isFinite(n) && n >= 0 ) return n;
				return raw;
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined'; },
						class: 'has-plugin-toggles',
						event: 'pluginTogglesReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( selector.length < 1 ) return;

						selector.each( function(){
							var element = jQuery(this),
								elSpeed = _parseSpeed(element.attr('data-speed')),
								elState = element.attr('data-state');

							if( elState != 'open' ){
								element.children('.toggle-content').hide();
							} else {
								element.addClass('toggle-active').children('.toggle-content').slideDown( elSpeed );
							}

							element.children('.toggle-header').off('click.toggle').on('click.toggle', function(){
								element.toggleClass('toggle-active').children('.toggle-content').stop(true, true).slideToggle( elSpeed );
								return true;
							});
						});
					});
				}
			};
		}(),
		// Toggle Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Accordion Functions Start
		 * --------------------------------------------------------------------------
		 */
		Accordion: function() {
			var _escapeHashId = function(hash) {
				if( !hash || hash.charAt(0) !== '#' ) return '';
				var id = hash.slice(1);
				if( !id ) return '';
				if( typeof CSS !== 'undefined' && CSS.escape ) {
					return '#' + CSS.escape(id);
				}
				return '#' + id.replace(/([^\w-])/g, '\\$1');
			};

			var _classList = function(str) {
				return String(str || '').trim().split(/\s+/).filter(Boolean);
			};

			var _parseSpeed = function(raw) {
				if( !raw ) return 'normal';
				var n = Number(raw);
				if( isFinite(n) && n >= 0 ) return n;
				return raw;
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ) return true;

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined'; },
						class: 'has-plugin-accordions',
						event: 'pluginAccordionsReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( selector.length < 1 ) return;

						selector.each( function(){
							var element = jQuery(this);
							var elState = element.attr('data-state');
							var elActive = Number(element.attr('data-active') || 1) - 1;
							var elActiveClasses = _classList('accordion-active ' + (element.attr('data-active-class') || ''));
							var elCollapsible = element.attr('data-collapsible') === 'true';
							var elSpeed = _parseSpeed(element.attr('data-speed'));
							var $headers = element.find('.accordion-header');

							var hashSel = _escapeHashId(location.hash);
							if( hashSel ) {
								var $byHash = $headers.filter(hashSel);
								if( $byHash.length ) {
									elActive = $headers.index($byHash);
								}
							}

							element.find('.accordion-content').hide();

							if( elState !== 'closed' && elActive >= 0 && $headers.length ) {
								$headers.eq(elActive).addClass(elActiveClasses.join(' ')).next().show();
							}

							$headers.off('click.accordion').on('click.accordion', function(){
								var $clickTarget = jQuery(this);

								if( $clickTarget.next().is(':hidden') ) {
									$headers.each(function() {
										var $h = jQuery(this);
										for( var i = 0; i < elActiveClasses.length; i++ ) {
											$h.removeClass(elActiveClasses[i]);
										}
									});
									$headers.next().slideUp(elSpeed);

									for( var i = 0; i < elActiveClasses.length; i++ ) {
										$clickTarget.addClass(elActiveClasses[i]);
									}

									$clickTarget.next().stop(true, true).slideDown(elSpeed, function(){
										if( ( jQuery('body').hasClass('device-sm') || jQuery('body').hasClass('device-xs') ) && element.hasClass('scroll-on-open') ) {
											__core.scrollTo((__core.offset($clickTarget).top - __core.getVars.topScrollOffset - 40), 800, 'easeOutQuad');
										}
										__core.runContainerModules( $clickTarget.next()[0] );
									});
								} else if( elCollapsible ) {
									for( var j = 0; j < elActiveClasses.length; j++ ) {
										$clickTarget.removeClass(elActiveClasses[j]);
									}
									$clickTarget.next().stop(true, true).slideUp(elSpeed);
								}

								return false;
							});
						});
					});
				}
			};
		}(),
		// Accordion Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Counter Functions Start
		 * --------------------------------------------------------------------------
		 */
		Counter: function() {
			var _prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			var _easeOutQuad = function(t) { return t * (2 - t); };

			var _animate = function(span) {
				if( span.dataset.cnvsCounterDone === '1' ) return;

				var from     = Number(span.getAttribute('data-from')) || 0;
				var to       = Number(span.getAttribute('data-to')) || 0;
				var duration = Number(span.getAttribute('data-speed')) || 1000;
				var decimals = Number(span.getAttribute('data-decimals')) || 0;
				var useComma = span.getAttribute('data-comma') === 'true';
				var sep      = span.getAttribute('data-sep') || ',';
				var places   = Number(span.getAttribute('data-places')) || 3;

				var regExp = useComma ? new RegExp('\\B(?=(\\d{' + places + '})+(?!\\d))', 'g') : null;
				var format = function(value) {
					var str = value.toFixed(decimals);
					if( regExp ) str = str.replace(regExp, sep);
					return str;
				};

				if( _prefersReducedMotion || duration <= 0 ) {
					span.textContent = format(to);
					span.dataset.cnvsCounterDone = '1';
					return;
				}

				var start = null;
				var step = function(timestamp) {
					if( !start ) start = timestamp;
					var progress = Math.min((timestamp - start) / duration, 1);
					var current = from + (to - from) * _easeOutQuad(progress);
					span.textContent = format(current);
					if( progress < 1 ) {
						window.requestAnimationFrame(step);
					} else {
						span.textContent = format(to);
						span.dataset.cnvsCounterDone = '1';
					}
				};
				window.requestAnimationFrame(step);
			};

			var _runElement = function(element) {
				element.querySelectorAll('span[data-to]').forEach(_animate);
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-counter', event: 'pluginCounterReady' });

					selector = __core.getSelector(selector, false);
					if( selector instanceof Element ) selector = [selector];
					if( !selector || selector.length < 1 ) return true;

					Array.prototype.forEach.call(selector, function(element) {
						if( element.classList.contains('counter-instant') ) {
							_runElement(element);
							return;
						}

						if( element.closest('.skill-progress') ) return;

						if( !__core.markOnce(element, 'cnvsCounterObserved') ) return;

						__core.intersect(element, { rootMargin: '0px 0px 50px' }, function(target) {
							_runElement(target);
						});
					});
				}
			};
		}(),
		// Counter Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Countdown Functions Start
		 * --------------------------------------------------------------------------
		 */
		Countdown: function() {
			var _pad = function(n) { return n < 10 ? '0' + n : String(n); };

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && typeof moment !== 'undefined' && jQuery().countdown; },
						class: 'has-plugin-countdown',
						event: 'pluginCountdownReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( selector.length < 1 ) return;

						selector.each( function(){
							var element = jQuery(this),
								elFormat  = element.attr('data-format') || 'dHMS',
								elSince   = element.attr('data-since') === 'true',
								elYear    = element.attr('data-year'),
								elMonth   = element.attr('data-month'),
								elDay     = element.attr('data-day'),
								elHour    = element.attr('data-hour'),
								elMin     = element.attr('data-minute'),
								elSec     = element.attr('data-second'),
								elRedirect = element.attr('data-redirect') || false;

							try { element.countdown('destroy'); } catch(e) {}

							var setDate;

							if( elYear ) {
								var monthNum = Number(elMonth);
								var dayNum = Number(elDay);
								var parts = [elYear];
								parts.push( (elMonth && monthNum >= 1 && monthNum <= 12) ? _pad(monthNum) : '01' );
								parts.push( (elDay && dayNum >= 1 && dayNum <= 31) ? _pad(dayNum) : '01' );
								setDate = new Date( moment(parts.join('-')) );
								if( isNaN(setDate.getTime()) ) {
									setDate = new Date();
								}
							} else {
								setDate = new Date();
							}

							var hourNum = Number(elHour);
							if( elHour && hourNum >= 0 && hourNum < 25 ) {
								setDate.setHours( setDate.getHours() + hourNum );
							}

							var minNum = Number(elMin);
							if( elMin && minNum >= 0 && minNum < 60 ) {
								setDate.setMinutes( setDate.getMinutes() + minNum );
							}

							var secNum = Number(elSec);
							if( elSec && secNum >= 0 && secNum < 60 ) {
								setDate.setSeconds( setDate.getSeconds() + secNum );
							}

							if( elSince ) {
								element.countdown({
									since: setDate,
									format: elFormat,
									expiryUrl: elRedirect,
								});
							} else {
								element.countdown({
									until: setDate,
									format: elFormat,
									expiryUrl: elRedirect,
								});
							}
						});
					});
				}
			};
		}(),
		// Countdown Functions End

		/**
		 * --------------------------------------------------------------------------
		 * GoogleMaps Functions Start
		 * --------------------------------------------------------------------------
		 */
		GoogleMaps: function() {
			var _parseAttr = function(raw, attrName) {
				if( !raw ) return null;
				try { return JSON.parse(raw); } catch(e) {}
				try {
					console.warn('Canvas GoogleMaps: "' + attrName + '" is not valid JSON — falling back to JS-literal evaluation. Migrate to JSON for CSP compliance.');
					return Function('return ' + raw)();
				} catch(e) {
					console.error('Canvas GoogleMaps: failed to parse "' + attrName + '":', e);
					return null;
				}
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					if( !__core.getOptions.gmapAPI ) {
						console.warn('No API Key defined for Google Maps! Please set an API Key in js/functions.js File!');
						__core.getSelector( selector, false ).forEach( function(el) {
							if( el.dataset.cnvsGmapError === '1' ) return;
							el.dataset.cnvsGmapError = '1';
							var notice = document.createElement('div');
							notice.className = 'alert alert-warning text-center mb-0 h-100 d-flex align-items-center justify-content-center';
							notice.innerHTML = '<div><strong>Google Maps API Key Missing</strong><br><small>Set <code>gmapAPI</code> in <code>js/functions.js</code> or <code>cnvsOptions</code>.</small></div>';
							el.innerHTML = '';
							el.appendChild(notice);
						});
						return true;
					}

					__core.loadJS({ file: 'https://maps.google.com/maps/api/js?key=' + __core.getOptions.gmapAPI + '&callback=SEMICOLON.Modules.gmap', id: 'canvas-gmapapi-js' });

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && typeof google !== 'undefined' && jQuery().gMap; },
						class: 'has-plugin-gmap',
						event: 'pluginGmapReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( selector.length < 1 ) return;

						selector.each( function() {
							var element = jQuery(this);
							var rawEl = element[0];
							if( rawEl.dataset.cnvsGmapInit === '1' ) return;

							var elLat       = element.attr('data-latitude');
							var elLon       = element.attr('data-longitude');
							var elAdd       = element.attr('data-address');
							var elCon       = element.attr('data-content');
							var elScroll    = element.attr('data-scrollwheel') !== 'false';
							var elType      = element.attr('data-maptype') || 'ROADMAP';
							var elZoom      = Number(element.attr('data-zoom')) || 12;
							var elStylesRaw = element.attr('data-styles');
							var elMarkersRaw = element.attr('data-markers');
							var elIconRaw   = element.attr('data-icon');

							var elConPan      = element.attr('data-control-pan') === 'true';
							var elConZoom     = element.attr('data-control-zoom') === 'true';
							var elConMapT     = element.attr('data-control-maptype') === 'true';
							var elConScale    = element.attr('data-control-scale') === 'true';
							var elConStreetV  = element.attr('data-control-streetview') === 'true';
							var elConOverview = element.attr('data-control-overview') === 'true';

							if( elAdd ) {
								elLat = elLon = false;
							} else if( !elLat && !elLon ) {
								console.log('Google Map co-ordinates not entered.');
								return;
							}

							var elStyles = elStylesRaw ? _parseAttr(elStylesRaw, 'data-styles') : null;

							var elMarkers;
							if( elMarkersRaw ) {
								elMarkers = _parseAttr(elMarkersRaw, 'data-markers') || [];
							} else if( elAdd ) {
								elMarkers = [{ address: elAdd, html: elCon || elAdd }];
							} else {
								elMarkers = [{ latitude: elLat, longitude: elLon, html: elCon || false }];
							}

							var elIcon = elIconRaw ? _parseAttr(elIconRaw, 'data-icon') : null;
							if( !elIcon ) {
								elIcon = {
									image: 'https://www.google.com/mapfiles/marker.png',
									shadow: 'https://www.google.com/mapfiles/shadow50.png',
									iconsize: [20, 34],
									shadowsize: [37, 34],
									iconanchor: [9, 34],
									shadowanchor: [19, 34]
								};
							}

							element.gMap({
								controls: {
									panControl: elConPan,
									zoomControl: elConZoom,
									mapTypeControl: elConMapT,
									scaleControl: elConScale,
									streetViewControl: elConStreetV,
									overviewMapControl: elConOverview
								},
								scrollwheel: elScroll,
								maptype: elType,
								markers: elMarkers,
								icon: elIcon,
								latitude: elLat,
								longitude: elLon,
								address: elAdd,
								zoom: elZoom,
								styles: elStyles
							});

							rawEl.dataset.cnvsGmapInit = '1';
						});
					});
				}
			};
		}(),
		// GoogleMaps Functions End

		/**
		 * --------------------------------------------------------------------------
		 * RoundedSkills Functions Start
		 * --------------------------------------------------------------------------
		 */
		RoundedSkills: function() {
			var _run = function($element, properties) {
				$element.easyPieChart({
					size: properties.size,
					animate: properties.speed,
					scaleColor: false,
					trackColor: properties.trackcolor,
					lineWidth: properties.width,
					lineCap: properties.cap,
					barColor: properties.color
				});
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && jQuery().easyPieChart; },
						class: 'has-plugin-piechart',
						event: 'pluginRoundedSkillReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( !selector || selector.length < 1 ) return;

						selector.each(function(){
							var $element = jQuery(this);
							var element = $element[0];
							if( !__core.markOnce(element, 'cnvsRoundedskillInit') ) return;

							var size       = __core.toNumber($element.attr('data-size'), 140),
								speed      = __core.toNumber($element.attr('data-speed'), 2000),
								width      = __core.toNumber($element.attr('data-width'), 4),
								color      = $element.attr('data-color') || '#0093BF',
								trackColor = $element.attr('data-trackcolor') || 'rgba(0,0,0,0.04)',
								cap        = $element.attr('data-cap') || 'square';

							var properties = {
								size: size,
								speed: speed,
								width: width,
								color: color,
								trackcolor: trackColor,
								cap: cap
							};

							$element.css({ 'width': size + 'px', 'height': size + 'px', 'line-height': size + 'px' });

							if( jQuery('body').hasClass('device-up-lg') ){
								$element.css({ opacity: 0 });
								__core.intersect(element, { rootMargin: '0px 0px 50px' }, function() {
									if( $element.hasClass('skills-animated') ) return;
									setTimeout( function(){ $element.css({ opacity: 1 }); }, 100);
									_run($element, properties);
									$element.addClass('skills-animated');
								});
							} else {
								_run($element, properties);
								$element.addClass('skills-animated');
							}
						});
					});
				}
			};
		}(),
		// RoundedSkills Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Progress Functions Start
		 * --------------------------------------------------------------------------
		 */
		Progress: function() {
			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-progress', event: 'pluginProgressReady' });

					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ){
						return true;
					}

					selector.forEach( function(element) {
						var elValue	= element.getAttribute('data-percent') || 90,
							elSpeed	= element.getAttribute('data-speed') || 1200,
							elBar = element.querySelector('.skill-progress-percent');

						if( !elBar ) return;

						if( !__core.markOnce(elBar, 'cnvsProgressObserved') ) return;

						elSpeed = Number(elSpeed) + 'ms';

						elBar.style.setProperty( '--cnvs-progress-speed', elSpeed );

						__core.intersect(elBar, { rootMargin: '0px 0px 50px' }, function() {
							if( elBar.classList.contains('skill-animated') ) return;
							var counterEl = element.querySelector('.counter');
							if( counterEl ) __modules.counter(counterEl);
							if( element.classList.contains('skill-progress-vertical') ) {
								elBar.style.height = elValue + '%';
							} else {
								elBar.style.width = elValue + '%';
							}
							elBar.classList.add('skill-animated');
						});
					});
				}
			};
		}(),
		// Progress Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Twitter Functions Start
		 * --------------------------------------------------------------------------
		 */
		Twitter: function() {
			var _linkify = function(text) {
				return __core.escapeHTML(text)
					.replace(/((https?|s?ftp|ssh):\/\/[^"\s<>]*[^.,;'">:\s<>\)\]\!])/g, function(url) {
						return '<a href="' + url + '" target="_blank" rel="noopener">' + url + '</a>';
					})
					.replace(/\B@([_a-z0-9]+)/ig, function(reply) {
						var handle = reply.substring(1);
						return reply.charAt(0) + '<a href="https://twitter.com/' + handle + '" target="_blank" rel="noopener">' + handle + '</a>';
					});
			};

			var _build = function(tweet, element, username) {
				var elFontClass = element.getAttribute('data-font-class') || 'font-body';
				var status = _linkify(tweet.text || '');
				var idStr = encodeURIComponent(tweet.id_str || '');
				var safeUser = encodeURIComponent(username);
				var time = _time(tweet.created_at);

				if( element.classList.contains('fslider') ) {
					var sliderWrap = element.querySelector('.slider-wrap');
					if( !sliderWrap ) return;
					var slide = document.createElement('div');
					slide.className = 'slide';
					slide.innerHTML = '<p class="mb-3 ' + elFontClass + '">' + status + '</p><small class="d-block"><a href="https://twitter.com/' + safeUser + '/statuses/' + idStr + '" target="_blank" rel="noopener">' + time + '</a></small>';
					sliderWrap.append(slide);
				} else {
					element.insertAdjacentHTML('beforeend', '<li><i class="fa-brands fa-x-twitter"></i><div><span>' + status + '</span><small><a href="https://twitter.com/' + safeUser + '/statuses/' + idStr + '" target="_blank" rel="noopener">' + time + '</a></small></div></li>');
				}
			};

			var _time = function(time_value) {
				var parsed_date = new Date(time_value);
				var relative_to = new Date();
				var delta = parseInt((relative_to.getTime() - parsed_date) / 1000);
				delta = delta + (relative_to.getTimezoneOffset() * 60);

				if (delta < 60) return 'less than a minute ago';
				if (delta < 120) return 'about a minute ago';
				if (delta < (60*60)) return (parseInt(delta / 60)).toString() + ' minutes ago';
				if (delta < (120*60)) return 'about an hour ago';
				if (delta < (24*60*60)) return 'about ' + (parseInt(delta / 3600)).toString() + ' hours ago';
				if (delta < (48*60*60)) return '1 day ago';
				return (parseInt(delta / 86400)).toString() + ' days ago';
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-twitter', event: 'pluginTwitterFeedReady' });

					selector = __core.getSelector( selector, false, false );
					if( !selector || selector.length < 1 ){
						return true;
					}

					selector.forEach( function(element) {
						if( !__core.markOnce(element, 'cnvsTwitterInit') ) return;

						var elUser   = element.getAttribute('data-username') || 'twitter',
							elCount  = __core.toNumber(element.getAttribute('data-count'), 3),
							elLoader = element.getAttribute('data-loader') || 'include/twitter/tweets.php',
							elFetch  = element.getAttribute('data-fetch-message') || 'Fetching Tweets from Twitter...';

						var alertEl = element.querySelector('.twitter-widget-alert');
						if( !alertEl ) {
							alertEl = document.createElement('div');
							alertEl.className = 'alert alert-warning twitter-widget-alert text-center';
							alertEl.innerHTML = '<div class="spinner-grow spinner-grow-sm me-2" role="status"><span class="visually-hidden">Loading...</span></div> ' + __core.escapeHTML(elFetch);
							element.prepend(alertEl);
						}

						var showError = function(message) {
							if( !alertEl ) return;
							alertEl.classList.remove('alert-warning');
							alertEl.classList.add('alert-danger');
							alertEl.textContent = message;
						};

						fetch( elLoader + '?username=' + encodeURIComponent(elUser) ).then( function(response) {
							if( !response.ok ) throw new Error('HTTP ' + response.status);
							var contentType = response.headers.get('content-type') || '';
							if( contentType.indexOf('json') === -1 ) {
								return response.text().then( function() {
									throw new Error('Twitter backend did not return JSON (check ' + elLoader + ' — likely a PHP error page or missing API credentials)');
								});
							}
							return response.json();
						}).then( function(tweets) {
							if( !Array.isArray(tweets) ) {
								showError('Twitter API returned an unexpected response.');
								return;
							}
							if( tweets.length === 0 ) {
								showError('No tweets found.');
								return;
							}

							alertEl.remove();
							alertEl = null;

							var limit = Math.min(tweets.length, elCount);
							for( var i = 0; i < limit; i++ ) {
								_build(tweets[i], element, elUser);
							}

							if( element.classList.contains('fslider') ) {
								var attempts = 0;
								var timer = setInterval( function() {
									attempts++;
									if( element.querySelectorAll('.slide').length > 1 ) {
										element.classList.remove('customjs');
										setTimeout( function() {
											__modules.flexSlider();
											jQuery(element).find( '.flexslider .slide' ).resize();
										}, 500);
										clearInterval(timer);
									} else if( attempts >= 10 ) {
										clearInterval(timer);
									}
								}, 1000);
							}
						}).catch( function(err) {
							console.warn('Canvas Twitter:', err && err.message ? err.message : err);
							showError('Could not fetch Tweets from Twitter API. Please try again later.');
						});
					});
				}
			};
		}(),
		// Twitter Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Flickr Functions Start
		 * --------------------------------------------------------------------------
		 */
		Flickr: function() {
			var _loadedHandlers = new WeakMap();

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && jQuery().jflickrfeed; },
						class: 'has-plugin-flickr',
						event: 'pluginFlickrFeedReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector, true, false );
						if( selector.length < 1 ) return;

						selector.each(function() {
							var element = jQuery(this);
							var rawEl = element[0];

							if( rawEl.dataset.cnvsFlickrLoaded === '1' ) return;

							var elID = element.attr('data-id');
							if( !elID ) return;

							var elCount = Number(element.attr('data-count')) || 9;
							var elType = element.attr('data-type');
							var elTypeGet = elType === 'group' ? 'groups_pool.gne' : 'photos_public.gne';

							var prevHandler = _loadedHandlers.get(rawEl);
							if( prevHandler ) {
								rawEl.removeEventListener('CanvasImagesLoaded', prevHandler);
							}

							element.jflickrfeed({
								feedapi: elTypeGet,
								limit: elCount,
								qstrings: { id: elID },
								itemTemplate: '<a class="grid-item" href="{{image_b}}" title="{{title}}" data-lightbox="gallery-item">'
									+ '<img src="{{image_s}}" alt="{{title}}" />'
									+ '</a>'
							}, function() {
								rawEl.dataset.cnvsFlickrLoaded = '1';
								element.removeClass('customjs');
								__core.imagesLoaded(rawEl);
								__modules.lightbox();

								var onLoaded = function() {
									__modules.gridInit();
									__modules.masonryThumbs();
								};
								rawEl.addEventListener('CanvasImagesLoaded', onLoaded, { once: true });
								_loadedHandlers.set(rawEl, onLoaded);
							});
						});
					});
				}
			};
		}(),
		// Flickr Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Instagram Functions Start
		 * --------------------------------------------------------------------------
		 */
		Instagram: function() {
			var _loadedHandlers = new WeakMap();

			var _get = function(element, loader, limit, fetchAlert) {
				var alert = document.createElement('div');
				alert.className = 'alert alert-warning instagram-widget-alert text-center';
				element.insertAdjacentElement('beforebegin', alert);

				var spinner = document.createElement('div');
				spinner.className = 'spinner-grow spinner-grow-sm me-2';
				spinner.setAttribute('role', 'status');
				var hidden = document.createElement('span');
				hidden.className = 'visually-hidden';
				hidden.textContent = 'Loading...';
				spinner.appendChild(hidden);
				alert.appendChild(spinner);
				alert.appendChild(document.createTextNode(' ' + fetchAlert));

				fetch(loader).then( function(response) {
					if( !response.ok ) throw new Error('HTTP ' + response.status);
					return response.json();
				}).then( function(images) {
					alert.remove();
					if( !Array.isArray(images) || images.length === 0 ) return;

					var count = Math.min(images.length, limit);
					for( var i = 0; i < count; i++ ) {
						var photo = images[i];
						if( !photo ) continue;
						var thumb = photo.media_type === 'VIDEO' ? photo.thumbnail_url : photo.media_url;
						if( !thumb || !photo.permalink ) continue;

						var a = document.createElement('a');
						a.className = 'grid-item';
						a.setAttribute('href', photo.permalink);
						a.setAttribute('target', '_blank');
						a.setAttribute('rel', 'noopener noreferrer');
						var img = document.createElement('img');
						img.setAttribute('src', thumb);
						img.setAttribute('alt', 'Image');
						a.appendChild(img);
						element.appendChild(a);
					}

					element.classList.remove('customjs');
					__core.imagesLoaded(element);

					var prevHandler = _loadedHandlers.get(element);
					if( prevHandler ) {
						element.removeEventListener('CanvasImagesLoaded', prevHandler);
					}
					var onLoaded = function() {
						__modules.masonryThumbs();
						__modules.lightbox();
					};
					element.addEventListener('CanvasImagesLoaded', onLoaded, { once: true });
					_loadedHandlers.set(element, onLoaded);
				}).catch( function(err) {
					console.log(err);
					alert.classList.remove('alert-warning');
					alert.classList.add('alert-danger');
					alert.textContent = 'Could not fetch Photos from Instagram API. Please try again later.';
				});
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-instagram', event: 'pluginInstagramReady' });

					selector = __core.getSelector( selector, false, false );
					if( selector.length < 1 ) return true;

					selector.forEach( function(element) {
						if( !__core.markOnce(element, 'cnvsInstagramLoaded') ) return;

						var elLimit = Math.min(Number(element.getAttribute('data-count')) || 12, 12);
						var elLoader = element.getAttribute('data-loader') || 'include/instagram/instagram.php';
						var elFetch = element.getAttribute('data-fetch-message') || 'Fetching Photos from Instagram...';

						_get(element, elLoader, elLimit, elFetch);
					});
				}
			};
		}(),
		// Instagram Functions End

		/**
		 * --------------------------------------------------------------------------
		 * NavTree Functions Start
		 * --------------------------------------------------------------------------
		 */
		NavTree: function() {
			var _parseSpeed = function(raw) {
				if( !raw ) return 250;
				var n = Number(raw);
				if( isFinite(n) && n >= 0 ) return n;
				return raw;
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined'; },
						class: 'has-plugin-navtree',
						event: 'pluginNavTreeReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( selector.length < 1 ) return;

						selector.each( function(){
							var element = jQuery(this),
								elSpeed = _parseSpeed(element.attr('data-speed')),
								elEasing = element.attr('data-easing') || 'swing',
								elHoverDelay = Number(element.attr('data-hover-delay')) || 250,
								elArrow = element.attr('data-arrow-class') || 'fa-solid fa-angle-right';

							element.find( 'ul li:has(ul)' ).addClass('sub-menu');
							element.find( 'ul li:has(ul) > a' ).filter(':not(:has(.sub-menu-indicator))').append( '<i class="sub-menu-indicator '+ elArrow +'"></i>' );

							if( element.hasClass('on-hover') ){
								element.find( 'ul li:has(ul):not(.active)' )
									.off('mouseenter.navtree mouseleave.navtree')
									.on('mouseenter.navtree', function(){
										jQuery(this).children('ul').stop(true, true).slideDown( elSpeed, elEasing);
									})
									.on('mouseleave.navtree', function(){
										jQuery(this).children('ul').stop(true, true).delay(elHoverDelay).slideUp( elSpeed, elEasing);
									});
							} else {
								element.find( 'ul li:has(ul) > a' ).off( 'click.navtree' ).on( 'click.navtree', function(){
									var childElement = jQuery(this);

									element.find( 'ul li' ).not(childElement.parents()).removeClass('active');

									childElement.parent().children('ul').stop(true, true).slideToggle( elSpeed, elEasing, function(){
										jQuery(this).find('ul').hide();
										jQuery(this).find('li.active').removeClass('active');
									});

									element.find( 'ul li > ul' ).not(childElement.parent().children('ul')).not(childElement.parents('ul')).stop(true, true).slideUp( elSpeed, elEasing );
									childElement.parent('li:has(ul)').toggleClass('active');

									return true;
								});
							}
						});
					});
				}
			};
		}(),
		// NavTree Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Carousel Functions Start
		 * --------------------------------------------------------------------------
		 */
		Carousel: function() {
			var _lazyHandlers = new WeakMap();

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && jQuery().owlCarousel; },
						class: 'has-plugin-carousel',
						event: 'pluginCarouselReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( selector.length < 1 ) return;

						selector.each( function(){
							var element = jQuery(this);
							var rawEl = element[0];

							var prevHandler = _lazyHandlers.get(rawEl);
							if( prevHandler ) {
								jQuery(window).off('lazyLoadLoaded', prevHandler);
							}

							if( element.data('owl.carousel') ) {
								element.trigger('destroy.owl.carousel');
							}

							var elItems = element.attr('data-items') || 4,
								elItemsXs = element.attr('data-items-xs') || Number(elItems),
								elItemsSm = element.attr('data-items-sm') || Number(elItemsXs),
								elItemsMd = element.attr('data-items-md') || Number(elItemsSm),
								elItemsLg = element.attr('data-items-lg') || Number(elItemsMd),
								elItemsXl = element.attr('data-items-xl') || Number(elItemsLg),
								elItemsXxl = element.attr('data-items-xxl') || Number(elItemsXl),
								elLoop = element.attr('data-loop') === 'true',
								elAutoPlayRaw = element.attr('data-autoplay'),
								elSpeed = Number(element.attr('data-speed')) || 250,
								elAnimateIn = element.attr('data-animate-in') || false,
								elAnimateOut = element.attr('data-animate-out') || false,
								elAutoWidth = element.attr('data-auto-width') === 'true',
								elNav = element.attr('data-nav') !== 'false',
								elNavPrev = element.attr('data-nav-prev') || '<i class="uil uil-angle-left-b"></i>',
								elNavNext = element.attr('data-nav-next') || '<i class="uil uil-angle-right-b"></i>',
								elPagi = element.attr('data-pagi') !== 'false',
								elMargin = Number(element.attr('data-margin')) || 20,
								elStage = Number(element.attr('data-stage-padding')) || 0,
								elMerge = element.attr('data-merge') === 'true',
								elStart = Number(element.attr('data-start')) || 0,
								elRewind = element.attr('data-rewind') === 'true',
								elSlideByRaw = element.attr('data-slideby') || 1,
								elCenter = element.attr('data-center') === 'true',
								elLazy = element.attr('data-lazyload') === 'true',
								elVideo = element.attr('data-video') === 'true',
								elRTL = element.attr('data-rtl') === 'true' || jQuery('body').hasClass('rtl');

							var elSlideBy = elSlideByRaw == 'page' ? 'page' : Number(elSlideByRaw);

							var elAutoPlay = false,
								elAutoPlayTime = 5000,
								elAutoPlayHoverP = false;
							if( elAutoPlayRaw ) {
								elAutoPlay = true;
								elAutoPlayTime = Number(elAutoPlayRaw);
								elAutoPlayHoverP = true;
							}

							var carousel = element.owlCarousel({
								margin: elMargin,
								loop: elLoop,
								stagePadding: elStage,
								merge: elMerge,
								startPosition: elStart,
								rewind: elRewind,
								slideBy: elSlideBy,
								center: elCenter,
								lazyLoad: elLazy,
								autoWidth: elAutoWidth,
								nav: elNav,
								navText: [elNavPrev, elNavNext],
								autoplay: elAutoPlay,
								autoplayTimeout: elAutoPlayTime,
								autoplayHoverPause: elAutoPlayHoverP,
								dots: elPagi,
								smartSpeed: elSpeed,
								fluidSpeed: elSpeed,
								video: elVideo,
								animateIn: elAnimateIn,
								animateOut: elAnimateOut,
								rtl: elRTL,
								responsive: {
									0: { items: Number(elItemsXs) },
									576: { items: Number(elItemsSm) },
									768: { items: Number(elItemsMd) },
									992: { items: Number(elItemsLg) },
									1200: { items: Number(elItemsXl) },
									1400: { items: Number(elItemsXxl) }
								},
								onInitialized: function(){
									var sliderEl = element.parents('.slider-element')[0];
									if( sliderEl ) {
										__base.sliderDimensions(sliderEl);
									}
									__core.runContainerModules(rawEl);

									if( element.find('.owl-dot').length > 0 ) {
										element.addClass('with-carousel-dots');
									}
								}
							});

							var lazyHandler = function() {
								if( element.find('.lazy').length === element.find('.lazy.lazy-loaded').length ) {
									if( typeof lazyLoadInstance !== 'undefined' && lazyLoadInstance ) {
										try { lazyLoadInstance.update(); } catch(e) {}
									}
									setTimeout( function() {
										carousel.trigger('refresh.owl.carousel');
									}, 500);
								}
							};
							jQuery(window).on('lazyLoadLoaded', lazyHandler);
							_lazyHandlers.set(rawEl, lazyHandler);
						});
					});
				}
			};
		}(),
		// Carousel Functions End

		/**
		 * --------------------------------------------------------------------------
		 * MasonryThumbs Functions Start
		 * --------------------------------------------------------------------------
		 */
		MasonryThumbs: function() {
			var _transitionHandlers = new WeakMap();

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && typeof Isotope !== 'undefined'; },
						class: 'has-plugin-masonrythumbs',
						event: 'pluginMasonryThumbsReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( selector.length < 1 ) return;

						selector.each( function() {
							var element = jQuery(this);
							var rawEl = element[0];
							var elChildren = element.children();
							var elBig = element.attr('data-big');

							if( elChildren.length < 1 ) return;

							elChildren.removeClass('grid-item-big').css({ width: '' });

							var firstElementWidth = parseFloat(getComputedStyle(elChildren.eq(0)[0]).width) || 0;

							if( element.filter('.has-init-isotope').length > 0 ) {
								element.isotope({
									masonry: { columnWidth: firstElementWidth }
								});
							}

							if( elBig ) {
								elBig.split(',').forEach( function(n) {
									var idx = Number(n) - 1;
									if( idx >= 0 ) elChildren.eq(idx).addClass('grid-item-big');
								});
							}

							setTimeout( function() {
								element.find('.grid-item-big').css({ width: (firstElementWidth * 2) + 'px' });
							}, 500);

							setTimeout( function() {
								element.filter('.has-init-isotope').isotope('layout');
							}, 1000);

							var prev = _transitionHandlers.get(rawEl);
							if( prev ) rawEl.removeEventListener('transitionend', prev);
							var onTransition = function() { __modules.readmore(); };
							rawEl.addEventListener('transitionend', onTransition);
							_transitionHandlers.set(rawEl, onTransition);
						});

						__core.getVars.resizers.masonryThumbs = __core.debounce(function() {
							__modules.masonryThumbs();
						}, 150);
					});
				}
			};
		}(),
		// MasonryThumbs Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Notifications Functions Start
		 * --------------------------------------------------------------------------
		 */
		Notifications: function() {
			var _typeClass = {
				primary: 'text-white bg-primary border-0',
				warning: 'text-dark bg-warning border-0',
				error:   'text-white bg-danger border-0',
				success: 'text-white bg-success border-0',
				info:    'bg-info text-dark border-0',
				dark:    'text-white bg-dark border-0',
			};

			var _posClass = {
				'top-left':      'top-0 start-0',
				'top-center':    'top-0 start-50 translate-middle-x',
				'top-right':     'top-0 end-0',
				'middle-left':   'top-50 start-0 translate-middle-y',
				'middle-center': 'top-50 start-50 translate-middle',
				'middle-right':  'top-50 end-0 translate-middle-y',
				'bottom-left':   'bottom-0 start-0',
				'bottom-center': 'bottom-0 start-50 translate-middle-x',
				'bottom-right':  'bottom-0 end-0',
			};

			var _uid = 0;
			var _nextId = function() {
				_uid++;
				return 'toast-' + Date.now().toString(36) + '-' + _uid;
			};

			var _buildToast = function(id, msg, typeClasses, posClasses, showClose, closeColorClass) {
				var wrap = document.createElement('div');
				wrap.className = 'position-fixed ' + posClasses + ' p-3';
				wrap.style.zIndex = '999999';

				var toast = document.createElement('div');
				toast.id = id;
				toast.className = 'toast p-2 hide ' + typeClasses;
				toast.setAttribute('role', 'alert');
				toast.setAttribute('aria-live', 'assertive');
				toast.setAttribute('aria-atomic', 'true');

				var flex = document.createElement('div');
				flex.className = 'd-flex';

				var body = document.createElement('div');
				body.className = 'toast-body';
				body.innerHTML = msg;
				flex.appendChild(body);

				if( showClose ) {
					var btn = document.createElement('button');
					btn.type = 'button';
					btn.className = 'btn-close ' + closeColorClass + ' btn-sm me-2 mt-2 ms-auto';
					btn.setAttribute('data-bs-dismiss', 'toast');
					btn.setAttribute('aria-label', 'Close');
					flex.appendChild(btn);
				}

				toast.appendChild(flex);
				wrap.appendChild(toast);
				return wrap;
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && typeof bootstrap !== 'undefined'; },
						class: 'has-plugin-notify',
						event: 'pluginNotifyReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( selector.length < 1 ) return;

						var element = selector;
						var elPosition = element.attr('data-notify-position') || 'top-right';
						var elType     = element.attr('data-notify-type');
						var elMsg      = element.attr('data-notify-msg') || 'Please set a message!';
						var elTimeout  = Number(element.attr('data-notify-timeout')) || 5000;
						var elClose    = element.attr('data-notify-close') !== 'false';
						var elAutoHide = element.attr('data-notify-autohide') !== 'false';
						var elTrigger  = element.attr('data-notify-trigger') || 'self';
						var elTarget   = element.attr('data-notify-target');

						if( elTarget && jQuery(elTarget).length > 0 && elTrigger === 'self' ) {
							var existingToastEl = jQuery(elTarget).get(0);
							var existingInstance = bootstrap.Toast.getOrCreateInstance(existingToastEl);
							existingInstance.hide();

							existingToastEl.addEventListener('hidden.bs.toast', function() {
								CNVS.Notifications.init(selector);
							}, { once: true });
							return;
						}

						var typeClasses = _typeClass[elType] || '';
						var posClasses  = _posClass[elPosition] || _posClass['top-right'];
						var closeColorClass = (elType === 'info' || elType === 'warning' || !elType) ? '' : 'btn-close-white';

						var elId = _nextId();

						if( elTrigger === 'self' && !elTarget ) {
							var wrap = _buildToast(elId, elMsg, typeClasses, posClasses, elClose, closeColorClass);
							document.body.appendChild(wrap);
							element.attr('data-notify-target', '#' + elId);
						}

						var toastSelector = element.attr('data-notify-target');
						if( !toastSelector ) return;
						var toastEl = document.querySelector(toastSelector);
						if( !toastEl ) return;

						document.querySelectorAll('.toast').forEach( function(existingToast) {
							if( existingToast !== toastEl ) {
								bootstrap.Toast.getOrCreateInstance(existingToast).hide();
							}
						});

						var toast = new bootstrap.Toast(toastEl, {
							delay: elTimeout,
							autohide: elAutoHide,
						});
						toast.show();

						if( elTrigger === 'self' ) {
							toastEl.addEventListener('hidden.bs.toast', function() {
								if( toastEl.parentNode ) toastEl.parentNode.remove();
								element.get(0)?.removeAttribute('data-notify-target');
							}, { once: true });
						}
					});
				}
			};
		}(),
		// Notifications Functions End

		/**
		 * --------------------------------------------------------------------------
		 * TextRotator Functions Start
		 * --------------------------------------------------------------------------
		 */
		TextRotator: function() {
			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && jQuery().Morphext && typeof Typed !== 'undefined'; },
						class: 'has-plugin-textrotator',
						event: 'pluginTextRotatorReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( !selector || selector.length < 1 ) return;

						selector.each( function(){
							var element = jQuery(this);
							var raw = element[0];
							if( !raw ) return;

							var elRotator = element.find('.t-rotate');
							if( !elRotator.length ) return;

							if( !__core.markOnce(raw, 'cnvsTextrotatorInit') ) return;

							var elTyped     = element.attr('data-typed') === 'true',
								elAnimation = element.attr('data-rotate') || 'fade',
								elSep       = element.attr('data-separator') || ',';

							if( elTyped ) {
								var rotatorEl = elRotator[0];
								if( !rotatorEl ) return;

								var rawText = elRotator.html() || '';
								var elTexts = rawText.split( elSep );

								var elLoop      = element.attr('data-loop') !== 'false',
									elShuffle   = element.attr('data-shuffle') === 'true',
									elCur       = element.attr('data-cursor') !== 'false',
									typeSpeed   = __core.toNumber(element.attr('data-speed'), 50),
									backSpeed   = __core.toNumber(element.attr('data-backspeed'), 30),
									backDelay   = __core.toNumber(element.attr('data-backdelay'), 500);

								elRotator.html('').addClass('plugin-typed-init');

								new Typed( rotatorEl, {
									strings: elTexts,
									typeSpeed: typeSpeed,
									loop: elLoop,
									shuffle: elShuffle,
									showCursor: elCur,
									backSpeed: backSpeed,
									backDelay: backDelay
								});
							} else {
								elRotator.Morphext({
									animation: elAnimation,
									separator: elSep,
									speed: __core.toNumber(element.attr('data-speed'), 1200)
								});
							}
						});
					});
				}
			};
		}(),
		// TextRotator Functions End

		/**
		 * --------------------------------------------------------------------------
		 * OnePage Functions Start
		 * --------------------------------------------------------------------------
		 */
		OnePage: function() {
			var _rafPending = false;
			var _lastActive = null;

			var _init = function() {
				_hash();

				if( __core.getVars.elLinkScrolls ) {
					__core.getVars.elLinkScrolls.forEach( function(el) {
						_getSettings( el, 'scrollTo' );

						el.onclick = function(e) {
							e.preventDefault();

							_scroller( el, 'scrollTo', true );
						};
					});
				}

				if( __core.getVars.elOnePageMenus ) {
					__core.getVars.elOnePageMenus.forEach( function(onePageMenu) {
						__core.getVars.elOnePageActiveClass = onePageMenu.getAttribute('data-active-class') || 'current';
						__core.getVars.elOnePageParentSelector = onePageMenu.getAttribute('data-parent') || 'li';
						__core.getVars.elOnePageActiveOnClick = onePageMenu.getAttribute('data-onclick-active') || 'false';

						onePageMenu.querySelectorAll('[data-href]').forEach( function(el) {
							_getSettings( el, 'onePage' );

							el.onclick = function(e) {
								e.preventDefault();

								_scroller( el, 'onePage', true );
							};
						});
					});
				}
			};

			var _hash = function() {
				if( __core.getOptions.scrollExternalLinks != true ) {
					return false;
				}

				if( document.querySelector('a[data-href="'+ __core.getVars.hash +'"]') || document.querySelector('a[data-scrollto="'+ __core.getVars.hash +'"]') ) {
					var onBeforeUnload = function() {
						__core.scrollTo(0, 0, false, 'auto');
					};
					window.addEventListener('beforeunload', onBeforeUnload, { once: true });

					__core.scrollTo(0, 0, false, 'auto');

					var section = document.querySelector(__core.getVars.hash);

					if( section ) {
						var int = setInterval( function() {
							var settings = section.getAttribute('data-onepage-settings') && JSON.parse( section.getAttribute('data-onepage-settings') );

							if( settings ) {
								if( __core.getVars.hashScroll != 1 ) {
									_scroll(section, settings, 0);
								}

								__core.getVars.hashScroll = 1;
								clearInterval(int);
							}
						}, 250);
					}
				}
			};

			var _getSection = function(el, type) {
				var anchor;

				if( type == 'scrollTo' ) {
					anchor = el.getAttribute('data-scrollto');
				} else {
					anchor = el.getAttribute('data-href');
				}

				var section;
				try {
					section = document.querySelector( anchor );
				} catch(e) {
					section = null;
				}

				return section;
			};

			var _getSettings = function(el, type) {
				var section = _getSection(el, type);

				if( !section ) {
					return false;
				}

				section.removeAttribute('data-onepage-settings');

				var settings = _settings( section, el );

				setTimeout( function() {
					if( !section.hasAttribute('data-onepage-settings') && settings ) {
						section.setAttribute( 'data-onepage-settings', JSON.stringify( settings ) );
					}

					__core.getVars.pageSectionEls = document.querySelectorAll('[data-onepage-settings]');
				}, 1000);
			};

			var _scroller = function(el, type, clicker = false) {
				var section = _getSection(el, type);

				if( !section ) {
					return false;
				}

				var sectionId = section.getAttribute('id'),
					settings;

				if( clicker == true ) {
					settings = _settings(section, el, false);
				} else {
					settings = JSON.parse(section.getAttribute('data-onepage-settings'));
				}

				if( type != 'scrollTo' && __core.getVars.elOnePageActiveOnClick == 'true' ) {
					var parentMenu = el.closest('.one-page-menu');

					if( parentMenu ) {
						parentMenu.querySelectorAll(__core.getVars.elOnePageParentSelector).forEach( function(p) {
							p.classList.remove( __core.getVars.elOnePageActiveClass );
						});

						parentMenu.querySelector('a[data-href="#' + sectionId + '"]')?.closest(__core.getVars.elOnePageParentSelector)?.classList.add( __core.getVars.elOnePageActiveClass );
					}
				}

				if( !__core.getVars.elBody.classList.contains('is-expanded-menu') || __core.getVars.elBody.classList.contains('overlay-menu') ) {
					__core.getVars.recalls.menureset();
				}

				_scroll(section, settings, 250);
			};

			var _scroll = function(section, settings, timeout) {
				setTimeout( function() {
					if( !settings || typeof settings !== 'object' ) {
						return false;
					}

					var sectionOffset = __core.offset(section).top;

					__core.scrollTo((sectionOffset - Number(settings.offset)), settings.speed, settings.easing);
				}, Number(timeout));
			};

			var _position = function() {
				_rafPending = false;

				var current = _current();
				if( current === _lastActive ) return;
				_lastActive = current;

				__core.getVars.elOnePageMenus && __core.getVars.elOnePageMenus.forEach( function(el) {
					el.querySelectorAll('[data-href]').forEach( function(item) {
						item.closest(__core.getVars.elOnePageParentSelector)?.classList.remove( __core.getVars.elOnePageActiveClass );
					});
				});

				if( !current ) return;

				__core.getVars.elOnePageMenus && __core.getVars.elOnePageMenus.forEach( function(el) {
					el.querySelector('[data-href="#' + current + '"]')?.closest(__core.getVars.elOnePageParentSelector)?.classList.add( __core.getVars.elOnePageActiveClass );
				});
			};

			var _requestPosition = function() {
				if( _rafPending ) return;
				_rafPending = true;
				window.requestAnimationFrame(_position);
			};

			var _current = function() {
				var currentOnePageSection = null;

				if( typeof __core.getVars.pageSectionEls === 'undefined' ) {
					return null;
				}

				__core.getVars.pageSectionEls.forEach( function(el) {
					var settings = el.getAttribute('data-onepage-settings') && JSON.parse( el.getAttribute('data-onepage-settings') );

					if( settings ) {
						var h = __core.offset(el).top - settings.offset - 5,
							y = window.scrollY;

						if( ( y >= h ) && ( y < h + el.offsetHeight ) && el.getAttribute('id') != currentOnePageSection && el.getAttribute('id') ) {
							currentOnePageSection = el.getAttribute('id');
						}
					}
				});

				return currentOnePageSection;
			};

			var _settings = function(section, element, json=true) {
				var body = __core.getVars.elBody.classList;

				if( typeof section === 'undefined' || !element ) {
					return null;
				}

				if( section.hasAttribute('data-onepage-settings') && json ) {
					return null;
				}

				var defaults = {
					offset: __core.getVars.topScrollOffset,
					speed: 1250,
					easing: false
				};

				var settings = {},
					parentSettings = {},
					parent = element.closest( '.one-page-menu' );

				parentSettings.offset = parent?.getAttribute( 'data-offset' ) || defaults.offset;
				parentSettings.speed = parent?.getAttribute( 'data-speed' ) || defaults.speed;
				parentSettings.easing = parent?.getAttribute( 'data-easing' ) || defaults.easing;

				var elementSettings = {
					offset: element.getAttribute( 'data-offset' ) || parentSettings.offset,
					speed: element.getAttribute( 'data-speed' ) || parentSettings.speed,
					easing: element.getAttribute( 'data-easing' ) || parentSettings.easing,
				};

				var elOffsetXXL = element.getAttribute( 'data-offset-xxl' ),
					elOffsetXL = element.getAttribute( 'data-offset-xl' ),
					elOffsetLG = element.getAttribute( 'data-offset-lg' ),
					elOffsetMD = element.getAttribute( 'data-offset-md' ),
					elOffsetSM = element.getAttribute( 'data-offset-sm' ),
					elOffsetXS = element.getAttribute( 'data-offset-xs' );

				if( !elOffsetXS ) elOffsetXS = Number(elementSettings.offset);
				if( !elOffsetSM ) elOffsetSM = Number(elOffsetXS);
				if( !elOffsetMD ) elOffsetMD = Number(elOffsetSM);
				if( !elOffsetLG ) elOffsetLG = Number(elOffsetMD);
				if( !elOffsetXL ) elOffsetXL = Number(elOffsetLG);
				if( !elOffsetXXL ) elOffsetXXL = Number(elOffsetXL);

				if( body.contains('device-xs') ) elementSettings.offset = elOffsetXS;
				else if( body.contains('device-sm') ) elementSettings.offset = elOffsetSM;
				else if( body.contains('device-md') ) elementSettings.offset = elOffsetMD;
				else if( body.contains('device-lg') ) elementSettings.offset = elOffsetLG;
				else if( body.contains('device-xl') ) elementSettings.offset = elOffsetXL;
				else if( body.contains('device-xxl') ) elementSettings.offset = elOffsetXXL;

				settings.offset = Number(elementSettings.offset);
				settings.speed = Number(elementSettings.speed);
				settings.easing = elementSettings.easing;

				return settings;
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-onepage', event: 'pluginOnePageReady' });

					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ){
						return true;
					}

					var scrollToLinks = __core.filtered( selector, '[data-scrollto]' ),
						onePageLinks = __core.filtered( selector, '.one-page-menu' );

					if( scrollToLinks.length > 0 ) {
						__core.getVars.elLinkScrolls = scrollToLinks;
					}

					if( onePageLinks.length > 0 ) {
						__core.getVars.elOnePageMenus = onePageLinks;
					}

					_init();
					_position();

					window.addEventListener('scroll', _requestPosition, { passive: true });

					__core.getVars.resizers.onepage = function() {
						_init();
						_position();
					};
				}
			};
		}(),
		// OnePage Functions End

		/**
		 * --------------------------------------------------------------------------
		 * AjaxForm Functions Start
		 * --------------------------------------------------------------------------
		 */
		AjaxForm: function() {
			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && jQuery().validate && jQuery().ajaxSubmit; },
						class: 'has-plugin-form',
						event: 'pluginFormReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( selector.length < 1 ) return;

						selector.each( function(){
							var element = jQuery(this),
								$body = jQuery('body'),
								elFormId = element.find('form').attr('id'),
								elAlert = element.attr('data-alert-type') || 'notify',
								elLoader = element.attr('data-loader'),
								elResult = element.find('.form-result'),
								elRedirect = element.attr('data-redirect'),
								elTimeout = Number(element.attr('data-timeout')) || 30000,
								defaultBtn, defaultBtnText, alertType;

							if( elFormId ) {
								$body.addClass( elFormId + '-ready' );
							}

							element.find('form').validate({
								errorPlacement: function(error, elementItem) {
									if( elementItem.parents('.form-group').length > 0 ) {
										error.appendTo( elementItem.parents('.form-group') );
									} else {
										error.insertAfter( elementItem );
									}
								},
								focusCleanup: true,
								submitHandler: function(form) {
									if( element.hasClass( 'custom-submit' ) ) {
										jQuery(form).submit();
										return true;
									}

									elResult.hide();

									if( elLoader == 'button' ) {
										defaultBtn = jQuery(form).find('button');
										defaultBtnText = defaultBtn.html();

										defaultBtn.html('<i class="bi-arrow-repeat icon-spin m-0"></i>');
									} else {
										jQuery(form).find('.form-process').fadeIn();
									}

									if( elFormId ) {
										$body.removeClass( elFormId + '-ready ' + elFormId + '-complete ' + elFormId + '-success ' + elFormId + '-error' ).addClass( elFormId + '-processing' );
									}

									var restoreLoader = function() {
										if( elLoader == 'button' ) {
											if( defaultBtn && typeof defaultBtnText !== 'undefined' ) {
												defaultBtn.html( defaultBtnText );
											}
										} else {
											jQuery(form).find('.form-process').fadeOut();
										}
									};

									var resetRecaptcha = function() {
										if( jQuery(form).find('.g-recaptcha').children('div').length > 0 && typeof grecaptcha !== 'undefined' ) {
											try { grecaptcha.reset(); } catch(e) {}
										}
									};

									jQuery(form).ajaxSubmit({
										target: elResult,
										dataType: 'json',
										timeout: elTimeout,
										success: function(data) {
											restoreLoader();

											if( data.alert != 'error' && elRedirect ){
												window.location.replace( elRedirect );
												return true;
											}

											if( elAlert == 'inline' ) {
												alertType = data.alert == 'error' ? 'alert-danger' : 'alert-success';
												elResult.removeClass( 'alert-danger alert-success' ).addClass( 'alert ' + alertType ).html( data.message ).slideDown( 400 );
											} else if( elAlert == 'notify' ) {
												elResult.attr( 'data-notify-type', data.alert ).attr( 'data-notify-msg', data.message ).html('');
												__modules.notifications(elResult);
											}

											if( data.alert != 'error' ) {
												jQuery(form).resetForm();
												jQuery(form).find('.btn-group > .btn').removeClass('active');

												var tmce = window.tinymce || window.tinyMCE;
												if( tmce && tmce.activeEditor && !tmce.activeEditor.isHidden() ){
													tmce.activeEditor.setContent('');
												}

												var rangeSlider = jQuery(form).find('.input-range-slider');
												if( rangeSlider.length > 0 ) {
													rangeSlider.each( function(){
														var range = jQuery(this).data('ionRangeSlider');
														if( range ) range.reset();
													});
												}

												var ratings = jQuery(form).find('.input-rating');
												if( ratings.length > 0 ) {
													ratings.each( function(){
														jQuery(this).rating('reset');
													});
												}

												var selectPicker = jQuery(form).find('.selectpicker');
												if( selectPicker.length > 0 ) {
													selectPicker.each( function(){
														jQuery(this).selectpicker('val', '');
														jQuery(this).selectpicker('deselectAll');
													});
												}

												jQuery(form).find('.input-select2,select[data-selectsplitter-firstselect-selector]').change();

												jQuery(form).trigger( 'formSubmitSuccess', data );
												if( elFormId ) {
													$body.removeClass( elFormId + '-error' ).addClass( elFormId + '-success' );
												}
											} else {
												jQuery(form).trigger( 'formSubmitError', data );
												if( elFormId ) {
													$body.removeClass( elFormId + '-success' ).addClass( elFormId + '-error' );
												}
											}

											if( elFormId ) {
												$body.removeClass( elFormId + '-processing' ).addClass( elFormId + '-complete' );
											}

											resetRecaptcha();
										},
										error: function(xhr, status) {
											restoreLoader();

											var errorMsg = status === 'timeout'
												? 'The request timed out. Please try again.'
												: 'A network error occurred. Please try again.';

											if( elAlert == 'inline' ) {
												elResult.removeClass( 'alert-danger alert-success' ).addClass( 'alert alert-danger' ).html( errorMsg ).slideDown( 400 );
											} else if( elAlert == 'notify' ) {
												elResult.attr( 'data-notify-type', 'error' ).attr( 'data-notify-msg', errorMsg ).html('');
												__modules.notifications(elResult);
											}

											jQuery(form).trigger( 'formSubmitError', { alert: 'error', message: errorMsg, status: status, xhr: xhr } );

											if( elFormId ) {
												$body.removeClass( elFormId + '-success' ).addClass( elFormId + '-error' );
												$body.removeClass( elFormId + '-processing' ).addClass( elFormId + '-complete' );
											}

											resetRecaptcha();
										}
									});
								}
							});

						});
					});
				}
			};
		}(),
		// AjaxForm Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Subscribe Functions Start
		 * --------------------------------------------------------------------------
		 */
		Subscribe: function() {
			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && jQuery().validate && jQuery().ajaxSubmit; },
						class: 'has-plugin-form',
						event: 'pluginFormReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( !selector || selector.length < 1 ) return;

						selector.each( function(){
							var element = jQuery(this);
							var raw = element[0];
							if( !raw ) return;

							var $form = element.find('form');
							if( !$form.length ) return;

							if( !__core.markOnce(raw, 'cnvsSubscribeInit') ) return;

							var elAlert    = element.attr('data-alert-type'),
								elLoader   = element.attr('data-loader'),
								elResult   = element.find('.widget-subscribe-form-result'),
								elRedirect = element.attr('data-redirect');

							$form.validate({
								submitHandler: function(form) {
									var $f = jQuery(form);
									var defButton, defButtonText;

									if( elResult.length ) elResult.hide();

									if( elLoader === 'button' ) {
										defButton = $f.find('button');
										defButtonText = defButton.html();
										defButton.html('<i class="bi-arrow-repeat icon-spin nomargin"></i>');
									} else {
										$f.find('.bi-envelope-plus').removeClass('bi-envelope-plus').addClass('bi-arrow-repeat icon-spin');
									}

									var restoreLoader = function() {
										if( elLoader === 'button' ) {
											if( defButton ) defButton.html( defButtonText );
										} else {
											$f.find('.bi-arrow-repeat').removeClass('bi-arrow-repeat icon-spin').addClass('bi-envelope-plus');
										}
									};

									$f.ajaxSubmit({
										target: elResult,
										dataType: 'json',
										resetForm: true,
										success: function(data) {
											restoreLoader();

											data = data || {};
											var alertKind = data.alert || 'success';
											var message = data.message || '';

											if( alertKind !== 'error' && elRedirect ){
												window.location.replace( elRedirect );
												return true;
											}

											if( elAlert === 'inline' ) {
												var alertType = alertKind === 'error' ? 'alert-danger' : 'alert-success';
												elResult.addClass( 'alert ' + alertType ).html( message ).slideDown( 400 );
											} else {
												elResult.attr( 'data-notify-type', alertKind ).attr( 'data-notify-msg', message ).html('');
												__modules.notifications(elResult);
											}
										},
										error: function() {
											restoreLoader();
											if( !elResult.length ) return;

											if( elAlert === 'inline' ) {
												elResult.removeClass('alert-success').addClass('alert alert-danger').html('Something went wrong. Please try again.').slideDown( 400 );
											} else {
												elResult.attr( 'data-notify-type', 'error' ).attr( 'data-notify-msg', 'Something went wrong. Please try again.' ).html('');
												__modules.notifications(elResult);
											}
										}
									});
								}
							});
						});
					});
				}
			};
		}(),
		// Subscribe Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Conditional Functions Start
		 * --------------------------------------------------------------------------
		 */
		Conditional: function() {
			var _bindings = new WeakMap();

			var _escapeAttr = function(val) {
				return String(val).replace(/(["'\\\]\\[])/g, '\\$1');
			};

			var _eval = function(field, value, conditions, check, target) {
				if( !field || !conditions ) return false;

				var fulfilled = false;

				if( check == 'validate' ) {
					if( value ) {
						fulfilled = target && target.getAttribute('aria-invalid') === 'false';
					}
				} else {
					switch( conditions.operator ) {
						case '==': fulfilled = value == conditions.value; break;
						case '!=': fulfilled = value != conditions.value; break;
						case '>':  fulfilled = value > conditions.value; break;
						case '<':  fulfilled = value < conditions.value; break;
						case '<=': fulfilled = value <= conditions.value; break;
						case '>=': fulfilled = value >= conditions.value; break;
						case 'in': fulfilled = conditions.value && conditions.value.includes(value); break;
						default:   fulfilled = false;
					}
				}

				if( fulfilled ) {
					field.classList.add('condition-fulfilled');
				} else {
					field.classList.remove('condition-fulfilled');
				}

				field.querySelectorAll('input,select,textarea,button').forEach( function(el) {
					el.disabled = !fulfilled;
				});
			};

			var _readValue = function(target) {
				if( target.type === 'checkbox' ) return target.checked ? target.value : 0;
				if( target.type === 'radio' )    return target.checked ? target.value : '';
				return target.value;
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-conditional', event: 'pluginConditionalReady' });

					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ) return true;

					selector.forEach( function(field) {
						var condition = field.getAttribute('data-condition') || '==';
						var conditionTarget = field.getAttribute('data-condition-target');
						var conditionValue = field.getAttribute('data-condition-value');
						var conditionCheck = field.getAttribute('data-condition-check') || 'value';

						if( !conditionTarget ) return;

						var target;
						try {
							target = document.querySelector('[id*="' + _escapeAttr(conditionTarget) + '"]');
						} catch(e) {
							target = null;
						}
						if( !target ) return;

						var prev = _bindings.get(field);
						if( prev ) {
							if( prev.target && prev.eventType && prev.listener ) {
								prev.target.removeEventListener(prev.eventType, prev.listener);
							}
							if( prev.observer ) {
								prev.observer.disconnect();
							}
						}

						var conditions = {
							operator: condition,
							field: conditionTarget,
							value: conditionValue,
						};

						var targetType = target.type;
						var targetTag = target.tagName.toLowerCase();
						var eventType = (targetType === 'checkbox' || targetTag === 'select' || targetType === 'radio') ? 'change' : 'input';

						_eval(field, _readValue(target), conditions, conditionCheck, target);

						var listener = function() {
							_eval(field, _readValue(target), conditions, conditionCheck, target);
						};
						target.addEventListener(eventType, listener);

						var observer = null;
						if( conditionCheck === 'validate' ) {
							observer = new MutationObserver( function() {
								_eval(field, _readValue(target), conditions, conditionCheck, target);
							});
							observer.observe(target, {
								attributes: true,
								characterData: true,
								childList: true,
								subtree: true,
								attributeOldValue: true,
								characterDataOldValue: true,
							});
						}

						_bindings.set(field, { target: target, eventType: eventType, listener: listener, observer: observer });
					});
				}
			};
		}(),
		// Conditional Functions End

		/**
		 * --------------------------------------------------------------------------
		 * ShapeDivider Functions Start
		 * --------------------------------------------------------------------------
		 */
		ShapeDivider: function() {
			var _counter = 0;

			var _sanitizeFill = function(value) {
				if( !value ) return '';
				return String(value).replace(/[;{}<>]/g, '').trim();
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-shapedivider', event: 'pluginShapeDividerReady' });

					selector = __core.getSelector( selector, false );
					if( !selector || selector.length < 1 ){
						return true;
					}

					selector.forEach( function(element) {
						if( element.classList.contains('shape-divider-complete') ) {
							return;
						}

						var elShape = element.getAttribute('data-shape') || 'valley',
							elWidth = __core.toNumber(element.getAttribute('data-width'), 100),
							elHeight = __core.toNumber(element.getAttribute('data-height'), 100),
							elFill = _sanitizeFill(element.getAttribute('data-fill')),
							elOut = element.getAttribute('data-outside') || 'false',
							elPos = element.getAttribute('data-position') || 'top',
							elId = 'shape-divider-' + (++_counter) + '-' + Date.now().toString(36),
							shape = '',
							outside = '';

						if( elWidth < 100 ) elWidth = 100;

						var width = 'width: calc( ' + elWidth + '% + 1.5px );';
						var height = 'height: ' + elHeight + 'px;';
						var fill = elFill ? 'fill: ' + elFill + ';' : '';

						if( elOut === 'true' ) {
							var offsetEdge = elPos === 'bottom' ? 'bottom' : 'top';
							outside = '#' + elId + '.shape-divider { ' + offsetEdge + ': -' + (elHeight - 1) + 'px; } ';
						}

						var css = outside + '#' + elId + '.shape-divider svg { ' + width + height + ' }';
						if( fill ) css += ' #' + elId + '.shape-divider .shape-divider-fill { ' + fill + ' }';

						var style = document.createElement('style');
						style.appendChild(document.createTextNode(css));
						__core.getVars.elHead.appendChild(style);

						element.setAttribute( 'id', elId );

						switch(elShape){
							case 'valley':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 355" preserveAspectRatio="none"><defs><style>.b{opacity:.5}.c{opacity:.3}</style></defs><path fill="none" d="M999.45 0H0v165.72l379.95 132.46L999.45 0z"></path><path class="b shape-divider-fill" d="M379.95 298.18l28.47 9.92L1000 118.75V0h-.55l-619.5 298.18zM492.04 337.25L1000 252.63V118.75L408.42 308.1l83.62 29.15z"></path><path class="b shape-divider-fill" d="M492.04 337.25L1000 252.63V118.75L408.42 308.1l83.62 29.15z"></path><path class="shape-divider-fill" d="M530.01 350.49l20.22 4.51H1000V252.63l-507.96 84.62 37.97 13.24z"></path><path class="b shape-divider-fill" d="M530.01 350.49l20.22 4.51H1000V252.63l-507.96 84.62 37.97 13.24z"></path><path class="b shape-divider-fill" d="M530.01 350.49l20.22 4.51H1000V252.63l-507.96 84.62 37.97 13.24z"></path><path class="shape-divider-fill" d="M542.94 355h7.29l-20.22-4.51 12.93 4.51z"></path><path class="b shape-divider-fill" d="M542.94 355h7.29l-20.22-4.51 12.93 4.51z"></path><path class="c shape-divider-fill" d="M542.94 355h7.29l-20.22-4.51 12.93 4.51z"></path><path class="b shape-divider-fill" d="M542.94 355h7.29l-20.22-4.51 12.93 4.51z"></path><path class="c shape-divider-fill" d="M379.95 298.18L0 165.72v66.59l353.18 78.75 26.77-12.88z"></path><path class="c shape-divider-fill" d="M353.18 311.06L0 232.31v71.86l288.42 38.06 64.76-31.17z"></path><path class="c shape-divider-fill" d="M353.18 311.06L0 232.31v71.86l288.42 38.06 64.76-31.17z"></path><path class="b shape-divider-fill" d="M380.28 317.11l28.14-9.01-28.47-9.92-26.77 12.88 27.1 6.05z"></path><path class="c shape-divider-fill" d="M380.28 317.11l28.14-9.01-28.47-9.92-26.77 12.88 27.1 6.05z"></path><path class="b shape-divider-fill" d="M479.79 339.29l12.25-2.04-83.62-29.15-28.14 9.01 99.51 22.18z"></path><path class="b shape-divider-fill" d="M479.79 339.29l12.25-2.04-83.62-29.15-28.14 9.01 99.51 22.18z"></path><path class="c shape-divider-fill" d="M479.79 339.29l12.25-2.04-83.62-29.15-28.14 9.01 99.51 22.18z"></path><path class="shape-divider-fill" d="M530.01 350.49l-37.97-13.24-12.25 2.04 50.22 11.2z"></path><path class="b shape-divider-fill" d="M530.01 350.49l-37.97-13.24-12.25 2.04 50.22 11.2z"></path><path class="b shape-divider-fill" d="M530.01 350.49l-37.97-13.24-12.25 2.04 50.22 11.2z"></path><path class="c shape-divider-fill" d="M530.01 350.49l-37.97-13.24-12.25 2.04 50.22 11.2zM288.42 342.23l9.46 1.25 82.4-26.37-27.1-6.05-64.76 31.17z"></path><path class="b shape-divider-fill" d="M288.42 342.23l9.46 1.25 82.4-26.37-27.1-6.05-64.76 31.17z"></path><path class="c shape-divider-fill" d="M288.42 342.23l9.46 1.25 82.4-26.37-27.1-6.05-64.76 31.17z"></path><path class="b shape-divider-fill" d="M380.28 317.11l-82.4 26.37 87.3 11.52h.34l94.27-15.71-99.51-22.18z"></path><path class="c shape-divider-fill" d="M380.28 317.11l-82.4 26.37 87.3 11.52h.34l94.27-15.71-99.51-22.18z"></path><path class="b shape-divider-fill" d="M380.28 317.11l-82.4 26.37 87.3 11.52h.34l94.27-15.71-99.51-22.18z"></path><path class="c shape-divider-fill" d="M380.28 317.11l-82.4 26.37 87.3 11.52h.34l94.27-15.71-99.51-22.18z"></path><path class="shape-divider-fill" d="M479.79 339.29L385.52 355h157.42l-12.93-4.51-50.22-11.2z"></path><path class="b shape-divider-fill" d="M479.79 339.29L385.52 355h157.42l-12.93-4.51-50.22-11.2z"></path><path class="c shape-divider-fill" d="M479.79 339.29L385.52 355h157.42l-12.93-4.51-50.22-11.2z"></path><path class="b shape-divider-fill" d="M479.79 339.29L385.52 355h157.42l-12.93-4.51-50.22-11.2z"></path><path class="c shape-divider-fill" d="M479.79 339.29L385.52 355h157.42l-12.93-4.51-50.22-11.2z"></path><path class="shape-divider-fill" d="M288.42 342.23L0 304.17V355h385.18l-87.3-11.52-9.46-1.25z"></path></svg>';
								break;

							case 'valley-2':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" d="M194,99c186.7,0.7,305-78.3,306-97.2c1,18.9,119.3,97.9,306,97.2c114.3-0.3,194,0.3,194,0.3s0-91.7,0-100c0,0,0,0,0-0 L0,0v99.3C0,99.3,79.7,98.7,194,99z"></path></svg>';
								break;

							case 'valley-3':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M1280 0L640 70 0 0v140l640-70 640 70V0z" opacity="0.5"></path><path class="shape-divider-fill" d="M1280 0H0l640 70 640-70z"></path></svg>';
								break;

							case 'mountain':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" d="M500,98.9L0,6.1V0h1000v6.1L500,98.9z"></path></svg>';
								break;

							case 'mountain-2':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M640 140L1280 0H0z" opacity="0.5"/><path class="shape-divider-fill" d="M640 98l640-98H0z"/></svg>';
								break;

							case 'mountain-3':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 491.58" preserveAspectRatio="none"><g style="isolation:isolate"><path class="shape-divider-fill" d="M1000 479.4v-87.96L500 0 0 391.46v87.96l500-335.94 500 335.92z" opacity="0.12" mix-blend-mode="overlay"/><path class="shape-divider-fill" d="M1000 487.31v-7.91L500 143.48 0 479.42v7.91l500-297.96 500 297.94z" opacity="0.25" mix-blend-mode="overlay"/><path class="shape-divider-fill" d="M1000 487.31L500 189.37 0 487.33v4.25h1000v-4.27z"/></g></svg>';
								break;

							case 'mountain-4':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" d="M738,99l262-93V0H0v5.6L738,99z"></path></svg>';
								break;

							case 'mountain-5':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M978.81 122.25L0 0h1280l-262.1 116.26a73.29 73.29 0 0 1-39.09 5.99z" opacity="0.5"></path><path class="shape-divider-fill" d="M983.19 95.23L0 0h1280l-266 91.52a72.58 72.58 0 0 1-30.81 3.71z"></path></svg>';
								break;

							case 'mountains':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" opacity="0.33" d="M473,67.3c-203.9,88.3-263.1-34-320.3,0C66,119.1,0,59.7,0,59.7V0h1000v59.7 c0,0-62.1,26.1-94.9,29.3c-32.8,3.3-62.8-12.3-75.8-22.1C806,49.6,745.3,8.7,694.9,4.7S492.4,59,473,67.3z"></path><path class="shape-divider-fill" opacity="0.66" d="M734,67.3c-45.5,0-77.2-23.2-129.1-39.1c-28.6-8.7-150.3-10.1-254,39.1 s-91.7-34.4-149.2,0C115.7,118.3,0,39.8,0,39.8V0h1000v36.5c0,0-28.2-18.5-92.1-18.5C810.2,18.1,775.7,67.3,734,67.3z"></path><path class="shape-divider-fill" d="M766.1,28.9c-200-57.5-266,65.5-395.1,19.5C242,1.8,242,5.4,184.8,20.6C128,35.8,132.3,44.9,89.9,52.5C28.6,63.7,0,0,0,0 h1000c0,0-9.9,40.9-83.6,48.1S829.6,47,766.1,28.9z"></path></svg>';
								break;

							case 'mountains-2':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 247" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0 200.92v.26l.75-.77-.75.51z"></path><path class="shape-divider-fill" d="M279.29 208.39c0-4.49 74.71-29.88 74.71-29.88l61.71 61.26L550 153.1l134.14 88.17L874.28 50 1000 178.51v-.33L874.28 0 684.14 191.27 550 103.1l-134.29 86.67L354 128.51s-74.71 25.39-74.71 29.88S144.23 52.08 144.23 52.08L.75 200.41l143.48-98.33s135.06 110.8 135.06 106.31z" opacity="0.25" isolation="isolate"></path><path class="shape-divider-fill" d="M1000 178.51L874.28 50 684.14 241.27 550 153.1l-134.29 86.67L354 178.51s-74.71 25.39-74.71 29.88-135.06-106.31-135.06-106.31L.75 200.41l-.75.77V247h1000z"></path><path class="shape-divider-fill" d="M1000 178.51L874.28 50 684.14 241.27 550 153.1l-134.29 86.67L354 178.51s-74.71 25.39-74.71 29.88-135.06-106.31-135.06-106.31L.75 200.41l-.75.77V247h1000z" opacity="0.25" isolation="isolate"></path></svg>';
								break;

							case 'mountains-3':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" d="M761.9,44.1L643.1,27.2L333.8,98L0,3.8V0l1000,0v3.9"></path></svg>';
								break;

							case 'mountains-4':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0 90.72l140-28.28 315.52 24.14L796.48 65.8 1140 104.89l140-14.17V0H0v90.72z" opacity="0.5"></path><path class="shape-divider-fill" d="M0 0v47.44L170 0l626.48 94.89L1110 87.11l170-39.67V0H0z"></path></svg>';
								break;

							case 'plataeu':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M1280 0l-131.81 111.68c-16.47 14-35.47 21-54.71 20.17L173 94a76.85 76.85 0 0 1-36.79-11.46L0 0z"></path></svg>';
								break;

							case 'plataeu-2':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M1093.48 131.85L173 94a76.85 76.85 0 0 1-36.79-11.46L0 0h1280l-131.81 111.68c-16.47 13.96-35.47 20.96-54.71 20.17z" opacity="0.5"></path><path class="shape-divider-fill" d="M1094.44 119L172.7 68.72a74.54 74.54 0 0 1-25.19-5.95L0 0h1280l-133.85 102c-15.84 12.09-33.7 17.95-51.71 17z"></path></svg>';
								break;

							case 'hills':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M156.258 127.903l86.363-18.654 78.684 13.079L411.441 99.4l94.454 10.303L582.82 93.8l82.664 18.728 76.961-11.39L816.109 71.4l97.602 9.849L997.383 50.4l66.285 14.694 70.793-24.494h79.863L1280 0H0v122.138l60.613 9.965z"/></svg>';
								break;

							case 'hills-2':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M1214.323 66.051h-79.863l-70.793 18.224-66.285-10.933-83.672 22.953-97.601-7.328-73.664 22.125-76.961 8.475-82.664-13.934-76.926 11.832-94.453-7.666-90.137 17.059-78.684-9.731-86.363 13.879-95.644 3.125L0 126.717V0h1280l-.001 35.844z" opacity="0.5"></path><path class="shape-divider-fill" d="M0 0h1280v.006l-70.676 36.578-74.863 4.641-70.793 23.334-66.285-11.678-83.672 29.618-97.602-7.07-63.664 21.421-76.961 12.649-91.664-20.798-77.926 17.66-94.453-7.574-90.137 21.595-78.683-9.884-86.363 16.074-95.645 6.211L0 127.905z"></path></svg>';
								break;

							case 'hills-3':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M156 35.51l95.46 34.84 120.04.24 71.5 33.35 90.09-3.91L640 137.65l102.39-37.17 85.55 10.65 88.11-7.19L992 65.28l73.21 5.31 66.79-22.1 77-.42L1280 0H0l64.8 38.69 91.2-3.18z"/></svg>';
								break;

							case 'hills-4':
								shape = '<svg viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M156 35.41l95.46 34.73 120.04.25 71.5 33.24 90.09-3.89L640 137.25l102.39-37.06 85.55 10.61 88.11-7.17L992 65.08l73.21 5.31L1132 48.35l77-.42L1280 0H0l64.8 38.57 91.2-3.16z" opacity="0.5"/><path class="shape-divider-fill" d="M156 28.32l95.46 27.79 120.04.2L443 82.9l90.09-3.11L640 109.8l102.39-29.65 85.55 8.49 88.11-5.74L992 52.07l73.21 4.24L1132 38.68l77-.34L1280 0H0l64.8 30.86 91.2-2.54z"/></svg>';
								break;

							case 'cloud':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 283.5 27.8" preserveAspectRatio="xMidYMax slice"><path class="shape-divider-fill" d="M0 0v6.7c1.9-.8 4.7-1.4 8.5-1 9.5 1.1 11.1 6 11.1 6s2.1-.7 4.3-.2c2.1.5 2.8 2.6 2.8 2.6s.2-.5 1.4-.7c1.2-.2 1.7.2 1.7.2s0-2.1 1.9-2.8c1.9-.7 3.6.7 3.6.7s.7-2.9 3.1-4.1 4.7 0 4.7 0 1.2-.5 2.4 0 1.7 1.4 1.7 1.4h1.4c.7 0 1.2.7 1.2.7s.8-1.8 4-2.2c3.5-.4 5.3 2.4 6.2 4.4.4-.4 1-.7 1.8-.9 2.8-.7 4 .7 4 .7s1.7-5 11.1-6c9.5-1.1 12.3 3.9 12.3 3.9s1.2-4.8 5.7-5.7c4.5-.9 6.8 1.8 6.8 1.8s.6-.6 1.5-.9c.9-.2 1.9-.2 1.9-.2s5.2-6.4 12.6-3.3c7.3 3.1 4.7 9 4.7 9s1.9-.9 4 0 2.8 2.4 2.8 2.4 1.9-1.2 4.5-1.2 4.3 1.2 4.3 1.2.2-1 1.4-1.7 2.1-.7 2.1-.7-.5-3.1 2.1-5.5 5.7-1.4 5.7-1.4 1.5-2.3 4.2-1.1c2.7 1.2 1.7 5.2 1.7 5.2s.3-.1 1.3.5c.5.4.8.8.9 1.1.5-1.4 2.4-5.8 8.4-4 7.1 2.1 3.5 8.9 3.5 8.9s.8-.4 2 0 1.1 1.1 1.1 1.1 1.1-1.1 2.3-1.1 2.1.5 2.1.5 1.9-3.6 6.2-1.2 1.9 6.4 1.9 6.4 2.6-2.4 7.4 0c3.4 1.7 3.9 4.9 3.9 4.9s3.3-6.9 10.4-7.9 11.5 2.6 11.5 2.6.8 0 1.2.2c.4.2.9.9.9.9s4.4-3.1 8.3.2c1.9 1.7 1.5 5 1.5 5s.3-1.1 1.6-1.4c1.3-.3 2.3.2 2.3.2s-.1-1.2.5-1.9 1.9-.9 1.9-.9-4.7-9.3 4.4-13.4c5.6-2.5 9.2.9 9.2.9s5-6.2 15.9-6.2 16.1 8.1 16.1 8.1.7-.2 1.6-.4V0H0z"></path></svg>';
								break;

							case 'cloud-2':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 86" preserveAspectRatio="xMidYMid slice"><path class="shape-divider-fill" d="M1280 0H0v65.2c6.8 0 13.5.9 20.1 2.6 14-21.8 43.1-28 64.8-14 5.6 3.6 10.3 8.3 14 13.9 7.3-1.2 14.8-.6 21.8 1.6 2.1-37.3 34.1-65.8 71.4-63.7 24.3 1.4 46 15.7 56.8 37.6 19-17.6 48.6-16.5 66.3 2.4C323 54 327.4 65 327.7 76.5c.4.2.8.4 1.2.7 3.3 1.9 6.3 4.2 8.9 6.9 15.9-23.8 46.1-33.4 72.8-23.3 11.6-31.9 46.9-48.3 78.8-36.6 9.1 3.3 17.2 8.7 23.8 15.7 6.7-6.6 16.7-8.4 25.4-4.8 29.3-37.4 83.3-44 120.7-14.8 14 11 24.3 26.1 29.4 43.1 4.7.6 9.3 1.8 13.6 3.8 7.8-24.7 34.2-38.3 58.9-30.5 14.4 4.6 25.6 15.7 30.3 30 14.2 1.2 27.7 6.9 38.5 16.2 11.1-35.7 49-55.7 84.7-44.7 14.1 4.4 26.4 13.3 35 25.3 12-5.7 26.1-5.5 37.9.6 3.9-11.6 15.5-18.9 27.7-17.5.2-.3.3-.6.5-.9 23.3-41.4 75.8-56 117.2-32.6 14.1 7.9 25.6 19.7 33.3 33.8 28.8-23.8 71.5-19.8 95.3 9 2.6 3.1 4.9 6.5 6.9 10 3.8-.5 7.6-.8 11.4-.8L1280 0z"/></svg>';
								break;

							case 'cloud-3':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 86" preserveAspectRatio="xMidYMid slice"><path class="shape-divider-fill" d="M833.9 27.5c-5.8 3.2-11 7.3-15.5 12.2-7.1-6.9-17.5-8.8-26.6-5-30.6-39.2-87.3-46.1-126.5-15.5-1.4 1.1-2.8 2.2-4.1 3.4C674.4 33.4 684 48 688.8 64.3c4.7.6 9.3 1.8 13.6 3.8 7.8-24.7 34.2-38.3 58.9-30.5 14.4 4.6 25.6 15.7 30.3 30 14.2 1.2 27.7 6.9 38.5 16.2C840.6 49.6 876 29.5 910.8 38c-20.4-20.3-51.8-24.6-76.9-10.5zM384 43.9c-9 5-16.7 11.9-22.7 20.3 15.4-7.8 33.3-8.7 49.4-2.6 3.7-10.1 9.9-19.1 18.1-26-15.4-2.3-31.2.6-44.8 8.3zm560.2 13.6c2 2.2 3.9 4.5 5.7 6.9 5.6-2.6 11.6-4 17.8-4.1-7.6-2.4-15.6-3.3-23.5-2.8zM178.7 7c29-4.2 57.3 10.8 70.3 37 8.9-8.3 20.7-12.8 32.9-12.5C256.4 1.8 214.7-8.1 178.7 7zm146.5 56.3c1.5 4.5 2.4 9.2 2.5 14 .4.2.8.4 1.2.7 3.3 1.9 6.3 4.2 8.9 6.9 5.8-8.7 13.7-15.7 22.9-20.5-11.1-5.2-23.9-5.6-35.5-1.1zM33.5 54.9c21.6-14.4 50.7-8.5 65 13 .1.2.2.3.3.5 7.3-1.2 14.8-.6 21.8 1.6.6-10.3 3.5-20.4 8.6-29.4.3-.6.7-1.2 1.1-1.8-32.1-17.2-71.9-10.6-96.8 16.1zm1228.9 2.7c2.3 2.9 4.4 5.9 6.2 9.1 3.8-.5 7.6-.8 11.4-.8V48.3c-6.4 1.8-12.4 5-17.6 9.3zM1127.3 11c1.9.9 3.7 1.8 5.6 2.8 14.2 7.9 25.8 19.7 33.5 34 13.9-11.4 31.7-16.9 49.6-15.3-20.5-27.7-57.8-36.8-88.7-21.5z" opacity="0.5"/><path class="shape-divider-fill" d="M0 0v66c6.8 0 13.5.9 20.1 2.6 3.5-5.4 8.1-10.1 13.4-13.6 24.9-26.8 64.7-33.4 96.8-16 10.5-17.4 28.2-29.1 48.3-32 36.1-15.1 77.7-5.2 103.2 24.5 19.7.4 37.1 13.1 43.4 31.8 11.5-4.5 24.4-4.2 35.6 1.1l.4-.2c15.4-21.4 41.5-32.4 67.6-28.6 25-21 62.1-18.8 84.4 5.1 6.7-6.6 16.7-8.4 25.4-4.8 29.2-37.4 83.3-44.1 120.7-14.8l1.8 1.5c37.3-32.9 94.3-29.3 127.2 8 1.2 1.3 2.3 2.7 3.4 4.1 9.1-3.8 19.5-1.9 26.6 5 24.3-26 65-27.3 91-3.1.5.5 1 .9 1.5 1.4 12.8 3.1 24.4 9.9 33.4 19.5 7.9-.5 15.9.4 23.5 2.8 7-.1 13.9 1.5 20.1 4.7 3.9-11.6 15.5-18.9 27.7-17.5.2-.3.3-.6.5-.9 22.1-39.2 70.7-54.7 111.4-35.6 30.8-15.3 68.2-6.2 88.6 21.5 18.3 1.7 35 10.8 46.5 25.1 5.2-4.3 11.1-7.4 17.6-9.3V0H0z"/></svg>';
								break;

							case 'wave':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" d="M421.9,6.5c22.6-2.5,51.5,0.4,75.5,5.3c23.6,4.9,70.9,23.5,100.5,35.7c75.8,32.2,133.7,44.5,192.6,49.7c23.6,2.1,48.7,3.5,103.4-2.5c54.7-6,106.2-25.6,106.2-25.6V0H0v30.3c0,0,72,32.6,158.4,30.5c39.2-0.7,92.8-6.7,134-22.4c21.2-8.1,52.2-18.2,79.7-24.2C399.3,7.9,411.6,7.5,421.9,6.5z"></path></svg>';
								break;

							case 'wave-2':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 283.5 27.8" preserveAspectRatio="none"><path class="shape-divider-fill" d="M283.5,9.7c0,0-7.3,4.3-14,4.6c-6.8,0.3-12.6,0-20.9-1.5c-11.3-2-33.1-10.1-44.7-5.7	s-12.1,4.6-18,7.4c-6.6,3.2-20,9.6-36.6,9.3C131.6,23.5,99.5,7.2,86.3,8c-1.4,0.1-6.6,0.8-10.5,2c-3.8,1.2-9.4,3.8-17,4.7 c-3.2,0.4-8.3,1.1-14.2,0.9c-1.5-0.1-6.3-0.4-12-1.6c-5.7-1.2-11-3.1-15.8-3.7C6.5,9.2,0,10.8,0,10.8V0h283.5V9.7z M260.8,11.3 c-0.7-1-2-0.4-4.3-0.4c-2.3,0-6.1-1.2-5.8-1.1c0.3,0.1,3.1,1.5,6,1.9C259.7,12.2,261.4,12.3,260.8,11.3z M242.4,8.6 c0,0-2.4-0.2-5.6-0.9c-3.2-0.8-10.3-2.8-15.1-3.5c-8.2-1.1-15.8,0-15.1,0.1c0.8,0.1,9.6-0.6,17.6,1.1c3.3,0.7,9.3,2.2,12.4,2.7	C239.9,8.7,242.4,8.6,242.4,8.6z M185.2,8.5c1.7-0.7-13.3,4.7-18.5,6.1c-2.1,0.6-6.2,1.6-10,2c-3.9,0.4-8.9,0.4-8.8,0.5	c0,0.2,5.8,0.8,11.2,0c5.4-0.8,5.2-1.1,7.6-1.6C170.5,14.7,183.5,9.2,185.2,8.5z M199.1,6.9c0.2,0-0.8-0.4-4.8,1.1 c-4,1.5-6.7,3.5-6.9,3.7c-0.2,0.1,3.5-1.8,6.6-3C197,7.5,199,6.9,199.1,6.9z M283,6c-0.1,0.1-1.9,1.1-4.8,2.5s-6.9,2.8-6.7,2.7	c0.2,0,3.5-0.6,7.4-2.5C282.8,6.8,283.1,5.9,283,6z M31.3,11.6c0.1-0.2-1.9-0.2-4.5-1.2s-5.4-1.6-7.8-2C15,7.6,7.3,8.5,7.7,8.6	C8,8.7,15.9,8.3,20.2,9.3c2.2,0.5,2.4,0.5,5.7,1.6S31.2,11.9,31.3,11.6z M73,9.2c0.4-0.1,3.5-1.6,8.4-2.6c4.9-1.1,8.9-0.5,8.9-0.8 c0-0.3-1-0.9-6.2-0.3S72.6,9.3,73,9.2z M71.6,6.7C71.8,6.8,75,5.4,77.3,5c2.3-0.3,1.9-0.5,1.9-0.6c0-0.1-1.1-0.2-2.7,0.2	C74.8,5.1,71.4,6.6,71.6,6.7z M93.6,4.4c0.1,0.2,3.5,0.8,5.6,1.8c2.1,1,1.8,0.6,1.9,0.5c0.1-0.1-0.8-0.8-2.4-1.3	C97.1,4.8,93.5,4.2,93.6,4.4z M65.4,11.1c-0.1,0.3,0.3,0.5,1.9-0.2s2.6-1.3,2.2-1.2s-0.9,0.4-2.5,0.8C65.3,10.9,65.5,10.8,65.4,11.1 z M34.5,12.4c-0.2,0,2.1,0.8,3.3,0.9c1.2,0.1,2,0.1,2-0.2c0-0.3-0.1-0.5-1.6-0.4C36.6,12.8,34.7,12.4,34.5,12.4z M152.2,21.1 c-0.1,0.1-2.4-0.3-7.5-0.3c-5,0-13.6-2.4-17.2-3.5c-3.6-1.1,10,3.9,16.5,4.1C150.5,21.6,152.3,21,152.2,21.1z"></path><path class="shape-divider-fill" d="M269.6,18c-0.1-0.1-4.6,0.3-7.2,0c-7.3-0.7-17-3.2-16.6-2.9c0.4,0.3,13.7,3.1,17,3.3	C267.7,18.8,269.7,18,269.6,18z"></path><path class="shape-divider-fill" d="M227.4,9.8c-0.2-0.1-4.5-1-9.5-1.2c-5-0.2-12.7,0.6-12.3,0.5c0.3-0.1,5.9-1.8,13.3-1.2	S227.6,9.9,227.4,9.8z"></path><path class="shape-divider-fill" d="M204.5,13.4c-0.1-0.1,2-1,3.2-1.1c1.2-0.1,2,0,2,0.3c0,0.3-0.1,0.5-1.6,0.4	C206.4,12.9,204.6,13.5,204.5,13.4z"></path><path class="shape-divider-fill" d="M201,10.6c0-0.1-4.4,1.2-6.3,2.2c-1.9,0.9-6.2,3.1-6.1,3.1c0.1,0.1,4.2-1.6,6.3-2.6	S201,10.7,201,10.6z"></path><path class="shape-divider-fill" d="M154.5,26.7c-0.1-0.1-4.6,0.3-7.2,0c-7.3-0.7-17-3.2-16.6-2.9c0.4,0.3,13.7,3.1,17,3.3	C152.6,27.5,154.6,26.8,154.5,26.7z"></path><path class="shape-divider-fill" d="M41.9,19.3c0,0,1.2-0.3,2.9-0.1c1.7,0.2,5.8,0.9,8.2,0.7c4.2-0.4,7.4-2.7,7-2.6	c-0.4,0-4.3,2.2-8.6,1.9c-1.8-0.1-5.1-0.5-6.7-0.4S41.9,19.3,41.9,19.3z"></path><path class="shape-divider-fill" d="M75.5,12.6c0.2,0.1,2-0.8,4.3-1.1c2.3-0.2,2.1-0.3,2.1-0.5c0-0.1-1.8-0.4-3.4,0	C76.9,11.5,75.3,12.5,75.5,12.6z"></path><path class="shape-divider-fill" d="M15.6,13.2c0-0.1,4.3,0,6.7,0.5c2.4,0.5,5,1.9,5,2c0,0.1-2.7-0.8-5.1-1.4	C19.9,13.7,15.7,13.3,15.6,13.2z"></path></svg>';
								break;

							case 'wave-3':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1047.1 3.7" preserveAspectRatio="xMidYMin slice"><path class="shape-divider-fill" d="M1047.1,0C557,0,8.9,0,0,0v1.6c0,0,0.6-1.5,2.7-0.3C3.9,2,6.1,4.1,8.3,3.5c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3C13.8,2,16,4.1,18.2,3.5c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3C23.6,2,25.9,4.1,28,3.5c0.9-0.2,1.5-1.9,1.5-1.9	c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3C63,2,65.3,4.1,67.4,3.5	C68.3,3.3,69,1.6,69,1.6s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3	C82.7,2,85,4.1,87.1,3.5c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3C92.6,2,94.8,4.1,97,3.5c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9	c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9c0,0,0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2	c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.7-0.3	c1.2,0.7,3.5,2.8,5.6,2.2c0.9-0.2,1.5-1.9,1.5-1.9s0.6-1.5,2.6-0.4V0z M2.5,1.2C2.5,1.2,2.5,1.2,2.5,1.2C2.5,1.2,2.5,1.2,2.5,1.2z M2.7,1.4c0.1,0,0.1,0.1,0.1,0.1C2.8,1.4,2.8,1.4,2.7,1.4z"></path></svg>';
								break;

							case 'wave-4':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0 51.76c36.21-2.25 77.57-3.58 126.42-3.58 320 0 320 57 640 57 271.15 0 312.58-40.91 513.58-53.4V0H0z" opacity="0.3"></path><path class="shape-divider-fill" d="M0 24.31c43.46-5.69 94.56-9.25 158.42-9.25 320 0 320 89.24 640 89.24 256.13 0 307.28-57.16 481.58-80V0H0z" opacity="0.5"></path><path class="shape-divider-fill" d="M0 0v3.4C28.2 1.6 59.4.59 94.42.59c320 0 320 84.3 640 84.3 285 0 316.17-66.85 545.58-81.49V0z"></path></svg>';
								break;

							case 'wave-5':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0 0v100c20 17.3 40 29.51 80 29.51 51.79 0 74.69-48.57 151.75-48.57 73.72 0 91 54.88 191.56 54.88C543.95 135.8 554 14 665.69 14c109.46 0 98.85 87 188.2 87 70.37 0 69.81-33.73 115.6-33.73 55.85 0 62 39.62 115.6 39.62 58.08 0 57.52-46.59 115-46.59 39.8 0 60 22.48 79.89 39.69V0z"></path></svg>';
								break;

							case 'wave-6':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M504.854,80.066c7.812,0,14.893,0.318,21.41,0.879 c-25.925,22.475-56.093,40.852-102.946,40.852c-20.779,0-37.996-2.349-52.898-6.07C413.517,107.295,434.056,80.066,504.854,80.066z M775.938,51.947c19.145,18.596,39.097,35.051,77.956,35.051c46.907,0,62.299-14.986,80.912-24.98 c-21.357-15.783-46.804-28.348-85.489-28.348C816.829,33.671,794.233,41.411,775.938,51.947z" opacity="0.3"></path><path class="shape-divider-fill" d="M1200.112,46.292c39.804,0,59.986,22.479,79.888,39.69v16.805 c-19.903-10.835-40.084-21.777-79.888-21.777c-72.014,0-78.715,43.559-147.964,43.559c-56.84,0-81.247-35.876-117.342-62.552 c9.309-4.998,19.423-8.749,34.69-8.749c55.846,0,61.99,39.617,115.602,39.617C1143.177,92.887,1142.618,46.292,1200.112,46.292z M80.011,115.488c-40.006,0-60.008-12.206-80.011-29.506v16.806c20.003,10.891,40.005,21.782,80.011,21.782 c80.004,0,78.597-30.407,137.669-30.407c55.971,0,62.526,24.026,126.337,24.026c9.858,0,18.509-0.916,26.404-2.461 c-57.186-14.278-80.177-48.808-138.66-48.808C154.698,66.919,131.801,115.488,80.011,115.488z M526.265,80.945 c56.848,4.902,70.056,28.726,137.193,28.726c54.001,0,73.43-35.237,112.48-57.724C751.06,27.782,727.548,0,665.691,0 C597.381,0,567.086,45.555,526.265,80.945z" opacity="0.5"></path><path class="shape-divider-fill" d="M0,0v85.982c20.003,17.3,40.005,29.506,80.011,29.506c51.791,0,74.688-48.569,151.751-48.569 c58.482,0,81.473,34.531,138.66,48.808c43.096-8.432,63.634-35.662,134.433-35.662c7.812,0,14.893,0.318,21.41,0.879 C567.086,45.555,597.381,0,665.691,0c61.856,0,85.369,27.782,110.246,51.947c18.295-10.536,40.891-18.276,73.378-18.276 c38.685,0,64.132,12.564,85.489,28.348c9.309-4.998,19.423-8.749,34.69-8.749c55.846,0,61.99,39.617,115.602,39.617 c58.08,0,57.521-46.595,115.015-46.595c39.804,0,59.986,22.479,79.888,39.69V0H0z"></path></svg>';
								break;

							case 'slant':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0,6V0h1000v100L0,6z"></path></svg>';
								break;

							case 'slant-2':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2600 131.1" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0 0L2600 0 2600 69.1 0 0z"></path><path class="shape-divider-fill" opacity="0.5" d="M0 0L2600 0 2600 69.1 0 69.1z"></path><path class="shape-divider-fill" opacity="0.25" d="M2600 0L0 0 0 130.1 2600 69.1z"></path></svg>';
								break;

							case 'slant-3':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M1280 140V0H0l1280 140z" opacity="0.5"></path><path class="shape-divider-fill" d="M1280 98V0H0l1280 98z"></path></svg>';
								break;

							case 'rounded':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" d="M1000,4.3V0H0v4.3C0.9,23.1,126.7,99.2,500,100S1000,22.7,1000,4.3z"></path></svg>';
								break;

							case 'rounded-2':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0,0c0,0,0,6,0,6.7c0,18,240.2,93.6,615.2,92.6C989.8,98.5,1000,25,1000,6.7c0-0.7,0-6.7,0-6.7H0z"></path></svg>';
								break;

							case 'rounded-3':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0 0s573.08 140 1280 140V0z"></path></svg>';
								break;

							case 'rounded-4':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0 0v60s573.09 80 1280 80V0z" opacity="0.3"></path><path class="shape-divider-fill" d="M0 0v30s573.09 110 1280 110V0z" opacity="0.5"></path><path class="shape-divider-fill" d="M0 0s573.09 140 1280 140V0z"></path></svg>';
								break;

							case 'rounded-5':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 140" preserveAspectRatio="none"><path class="shape-divider-fill" d="M0 0v.48C18.62 9.38 297.81 140 639.5 140 993.24 140 1280 0 1280 0z" opacity="0.3"></path><path class="shape-divider-fill" d="M0 .6c14 8.28 176.54 99.8 555.45 119.14C952.41 140 1280 0 1280 0H0z" opacity="0.5"></path><path class="shape-divider-fill" d="M726.29 101.2C1126.36 79.92 1281 0 1281 0H1c.05 0 325.25 122.48 725.29 101.2z"></path></svg>';
								break;

							case 'triangle':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 10" preserveAspectRatio="none"><path class="shape-divider-fill" d="M350,10L340,0h20L350,10z"></path></svg>';
								break;

							case 'drops':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 283.5 27.8" preserveAspectRatio="xMidYMax slice"><path class="shape-divider-fill" d="M0 0v1.4c.6.7 1.1 1.4 1.4 2 2 3.8 2.2 6.6 1.8 10.8-.3 3.3-2.4 9.4 0 12.3 1.7 2 3.7 1.4 4.6-.9 1.4-3.8-.7-8.2-.6-12 .1-3.7 3.2-5.5 6.9-4.9 4 .6 4.8 4 4.9 7.4.1 1.8-1.1 7 0 8.5.6.8 1.6 1.2 2.4.5 1.4-1.1.1-5.4.1-6.9.1-3.7.3-8.6 4.1-10.5 5-2.5 6.2 1.6 5.4 5.6-.4 1.7-1 9.2 2.9 6.3 1.5-1.1.7-3.5.5-4.9-.4-2.4-.4-4.3 1-6.5.9-1.4 2.4-3.1 4.2-3 2.4.1 2.7 2.2 4 3.7 1.5 1.8 1.8 2.2 3 .1 1.1-1.9 1.2-2.8 3.6-3.3 1.3-.3 4.8-1.4 5.9-.5 1.5 1.1.6 2.8.4 4.3-.2 1.1-.6 4 1.8 3.4 1.7-.4-.3-4.1.6-5.6 1.3-2.2 5.8-1.4 7 .5 1.3 2.1.5 5.8.1 8.1s-1.2 5-.6 7.4c1.3 5.1 4.4.9 4.3-2.4-.1-4.4-2-8.8-.5-13 .9-2.4 4.6-6.6 7.7-4.5 2.7 1.8.5 7.8.2 10.3-.2 1.7-.8 4.6.2 6.2.9 1.4 2 1.5 2.6-.3.5-1.5-.9-4.5-1-6.1-.2-1.7-.4-3.7.2-5.4 1.8-5.6 3.5 2.4 6.3.6 1.4-.9 4.3-9.4 6.1-3.1.6 2.2-1.3 7.8.7 8.9 4.2 2.3 1.5-7.1 2.2-8 3.1-4 4.7 3.8 6.1 4.1 3.1.7 2.8-7.9 8.1-4.5 1.7 1.1 2.9 3.3 3.2 5.2.4 2.2-1 4.5-.6 6.6 1 4.3 4.4 1.5 4.4-1.7 0-2.7-3-8.3 1.4-9.1 4.4-.9 7.3 3.5 7.8 6.9.3 2-1.5 10.9 1.3 11.3 4.1.6-3.2-15.7 4.8-15.8 4.7-.1 2.8 4.1 3.9 6.6 1 2.4 2.1 1 2.3-.8.3-1.9-.9-3.2 1.3-4.3 5.9-2.9 5.9 5.4 5.5 8.5-.3 2-1.7 8.4 2 8.1 6.9-.5-2.8-16.9 4.8-18.7 4.7-1.2 6.1 3.6 6.3 7.1.1 1.7-1.2 8.1.6 9.1 3.5 2 1.9-7 2-8.4.2-4 1.2-9.6 6.4-9.8 4.7-.2 3.2 4.6 2.7 7.5-.4 2.2 1.3 8.6 3.8 4.4 1.1-1.9-.3-4.1-.3-6 0-1.7.4-3.2 1.3-4.6 1-1.6 2.9-3.5 5.1-2.9 2.5.6 2.3 4.1 4.1 4.9 1.9.8 1.6-.9 2.3-2.1 1.2-2.1 2.1-2.1 4.4-2.4 1.4-.2 3.6-1.5 4.9-.5 2.3 1.7-.7 4.4.1 6.5.6 1.5 2.1 1.7 2.8.3.7-1.4-1.1-3.4-.3-4.8 1.4-2.5 6.2-1.2 7.2 1 2.3 4.8-3.3 12-.2 16.3 3 4.1 3.9-2.8 3.8-4.8-.4-4.3-2.1-8.9 0-13.1 1.3-2.5 5.9-5.7 7.9-2.4 2 3.2-1.3 9.8-.8 13.4.5 4.4 3.5 3.3 2.7-.8-.4-1.9-2.4-10 .6-11.1 3.7-1.4 2.8 7.2 6.5.4 2.2-4.1 4.9-3.1 5.2 1.2.1 1.5-.6 3.1-.4 4.6.2 1.9 1.8 3.7 3.3 1.3 1-1.6-2.6-10.4 2.9-7.3 2.6 1.5 1.6 6.5 4.8 2.7 1.3-1.5 1.7-3.6 4-3.7 2.2-.1 4 2.3 4.8 4.1 1.3 2.9-1.5 8.4.9 10.3 4.2 3.3 3-5.5 2.7-6.9-.6-3.9 1-7.2 5.5-5 4.1 2.1 4.3 7.7 4.1 11.6 0 .8-.6 9.5 2.5 5.2 1.2-1.7-.1-7.7.1-9.6.3-2.9 1.2-5.5 4.3-6.2 4.5-1 7.7 1.5 7.4 5.8-.2 3.5-1.8 7.7-.5 11.1 1 2.7 3.6 2.8 5 .2 1.6-3.1 0-8.3-.4-11.6-.4-4.2-.2-7 1.8-10.8 0 0-.1.1-.1.2-.2.4-.3.7-.4.8v.1c-.1.2-.1.2 0 0v-.1l.4-.8c0-.1.1-.1.1-.2.2-.4.5-.8.8-1.2V0H0zM282.7 3.4z"></path></svg>';
								break;

							case 'cliff':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 279.24" preserveAspectRatio="none"><path class="shape-divider-fill" d="M1000 0S331.54-4.18 0 279.24h1000z" opacity="0.25"></path><path class="shape-divider-fill" d="M1000 279.24s-339.56-44.3-522.95-109.6S132.86 23.76 0 25.15v254.09z"></path></svg>';
								break;

							case 'zigzag':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 5.8" preserveAspectRatio="none"><path class="shape-divider-fill" d="M5.4.4l5.4 5.3L16.5.4l5.4 5.3L27.5.4 33 5.7 38.6.4l5.5 5.4h.1L49.9.4l5.4 5.3L60.9.4l5.5 5.3L72 .4l5.5 5.3L83.1.4l5.4 5.3L94.1.4l5.5 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.4 5.3L161 .4l5.4 5.3L172 .4l5.5 5.3 5.6-5.3 5.4 5.3 5.7-5.3 5.4 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.5 5.3L261 .4l5.4 5.3L272 .4l5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.7-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.7-5.3 5.4 5.4h.2l5.6-5.4 5.5 5.3L361 .4l5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.7-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.6-5.4 5.5 5.3L461 .4l5.5 5.3 5.6-5.3 5.4 5.3 5.7-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1L550 .4l5.4 5.3L561 .4l5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.4 5.3 5.7-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2L650 .4l5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2L750 .4l5.5 5.3 5.6-5.3 5.4 5.3 5.7-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.7-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.4h.2L850 .4l5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.4 5.3 5.7-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.7-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.4 5.3 5.7-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.7-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.7-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.7-5.3 5.4 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.6-5.4 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.7-5.3 5.4 5.4h.2l5.6-5.4 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.7-5.4 5.4 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.5 5.4h.1l5.6-5.4 5.5 5.3 5.6-5.3 5.5 5.3 5.6-5.3 5.4 5.3 5.7-5.3 5.4 5.3 5.6-5.3 5.5 5.4V0H-.2v5.8z"></path></svg>';
								break;

							case 'illusion':
								shape = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 283.5 19.6" preserveAspectRatio="none"><path class="shape-divider-fill" opacity="0.33" d="M0 0L0 18.8 141.8 4.1 283.5 18.8 283.5 0z"></path><path class="shape-divider-fill" opacity="0.33" d="M0 0L0 12.6 141.8 4 283.5 12.6 283.5 0z"></path><path class="shape-divider-fill" opacity="0.33" d="M0 0L0 6.4 141.8 4 283.5 6.4 283.5 0z"></path><path class="shape-divider-fill" d="M0 0L0 1.2 141.8 4 283.5 1.2 283.5 0z"></path></svg>';
								break;

							default:
								shape = '';
								break;
						}

						element.innerHTML = shape;

						var svg = element.querySelector('svg');
						if( svg ) {
							svg.classList.add('op-ts');
							setTimeout( function() {
								svg.classList.add('op-1');
							}, 500);
						}

						element.classList.add('shape-divider-complete');
					});
				}
			};
		}(),
		// ShapeDivider Functions End

		/**
		 * --------------------------------------------------------------------------
		 * StickySidebar Functions Start
		 * --------------------------------------------------------------------------
		 */
		StickySidebar: function() {
			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof jQuery !== 'undefined' && jQuery().scwStickySidebar; },
						class: 'has-plugin-stickysidebar',
						event: 'pluginStickySidebarReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector );
						if( !selector || selector.length < 1 ) return;

						selector.each( function(){
							var element = jQuery(this);
							var raw = element[0];
							if( !__core.markOnce(raw, 'cnvsStickysidebarInit') ) return;

							var elTop    = __core.toNumber(element.attr('data-offset-top'), 110),
								elBottom = __core.toNumber(element.attr('data-offset-bottom'), 50);

							element.scwStickySidebar({
								additionalMarginTop: elTop,
								additionalMarginBottom: elBottom
							});
						});
					});
				}
			};
		}(),
		// StickySidebar Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Cookies Functions Start
		 * --------------------------------------------------------------------------
		 */
		Cookies: function() {
			var _resetPage = function(btn) {
				if( !btn.closest('#gdpr-preferences') ) return false;
				setTimeout( function() {
					window.location.reload();
				}, 500);
			};

			var _hideCookieBar = function(cookieBar, elDirection, elSize) {
				if( !cookieBar ) return;
				cookieBar.style[elDirection] = elSize + 'px';
				cookieBar.style.opacity = 0;

				var onEnd = function() {
					cookieBar.style.display = 'none';
					cookieBar.style.pointerEvents = 'none';
					cookieBar.removeEventListener('transitionend', onEnd);
				};
				cookieBar.addEventListener('transitionend', onEnd);
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-cookie', event: 'pluginCookieReady' });

					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ) return true;

					var cookieBar = document.querySelector('.gdpr-settings');
					var elSettings = document.querySelector('.gdpr-cookie-settings');
					if( !cookieBar && !elSettings ) return true;

					var elExpire = cookieBar?.getAttribute('data-expire') || 30;
					var elDelay = cookieBar?.getAttribute('data-delay') || 1500;
					var elPersist = cookieBar?.getAttribute('data-persistent');
					var elDirection = 'bottom';
					var elHeight = (cookieBar?.offsetHeight || 0) + 100;
					var elWidth = (cookieBar?.offsetWidth || 0) + 100;
					var elSize;
					var elSwitches = elSettings?.querySelectorAll('[data-cookie-name]');

					if( elPersist == 'true' ) {
						__core.cookie.set('__cnvs_cookies_accept', '');
						__core.cookie.remove('__cnvs_cookies_decline');
					}

					if( cookieBar ) {
						if( cookieBar.classList.contains('gdpr-settings-sm') && cookieBar.classList.contains('gdpr-settings-right') ) {
							elDirection = 'right';
						} else if( cookieBar.classList.contains('gdpr-settings-sm') ) {
							elDirection = 'left';
						}

						if( elDirection === 'left' ) {
							elSize = -elWidth;
							cookieBar.style.right = 'auto';
							cookieBar.style.marginLeft = '1rem';
						} else if( elDirection === 'right' ) {
							elSize = -elWidth;
							cookieBar.style.left = 'auto';
							cookieBar.style.marginRight = '1rem';
						} else {
							elSize = -elHeight;
						}

						cookieBar.style[elDirection] = elSize + 'px';

						if( __core.cookie.get('__cnvs_cookies_accept') != '1' ) {
							setTimeout( function() {
								cookieBar.style.display = 'block';
								cookieBar.style.pointerEvents = 'auto';
								cookieBar.style[elDirection] = 0;
								cookieBar.style.opacity = 1;
							}, Number(elDelay));
						}
					}

					var setAcceptance = function(accept) {
						__core.cookie.set('__cnvs_cookies_accept', accept ? '1' : '0', elExpire);
						__core.cookie.set('__cnvs_cookies_decline', accept ? '0' : '1', elExpire);
					};

					document.querySelectorAll('.gdpr-accept').forEach( function(btn) {
						btn.addEventListener('click', function(e) {
							e.preventDefault();
							_hideCookieBar(cookieBar, elDirection, elSize);
							setAcceptance(true);
							_resetPage(btn);
						});
					});

					document.querySelectorAll('.gdpr-decline').forEach( function(btn) {
						btn.addEventListener('click', function(e) {
							e.preventDefault();
							_hideCookieBar(cookieBar, elDirection, elSize);
							setAcceptance(false);
							_resetPage(btn);
						});
					});

					var acceptCookies = __core.cookie.get('__cnvs_cookies_accept');
					var declineCookies = __core.cookie.get('__cnvs_cookies_decline');
					var cookiesAllowed = acceptCookies !== '0' && declineCookies !== '1';

					elSwitches?.forEach( function(el) {
						var elCookie = '__cnvs_gdpr_' + el.getAttribute('data-cookie-name');
						var getCookie = __core.cookie.get(elCookie);
						el.checked = (getCookie === '1' && cookiesAllowed);
					});

					document.querySelectorAll('.gdpr-save-cookies').forEach( function(btn) {
						btn.addEventListener('click', function(e) {
							e.preventDefault();

							setAcceptance(true);

							elSwitches?.forEach( function(el) {
								var elCookie = '__cnvs_gdpr_' + el.getAttribute('data-cookie-name');
								if( el.checked ) {
									__core.cookie.set(elCookie, '1', elExpire);
								} else {
									__core.cookie.remove(elCookie, '');
								}
							});

							if( elSettings && elSettings.closest('.mfp-content') && typeof jQuery !== 'undefined' && jQuery.magnificPopup ) {
								jQuery.magnificPopup.close();
							}

							_resetPage(btn);
						});
					});

					document.querySelectorAll('.gdpr-container').forEach( function(element) {
						if( element.dataset.cnvsGdprProcessed === '1' ) return;

						var elCookie = '__cnvs_gdpr_' + element.getAttribute('data-cookie-name');
						var elContent = element.getAttribute('data-cookie-content');
						var elContentAjax = element.getAttribute('data-cookie-content-ajax');
						var getCookie = __core.cookie.get(elCookie);
						var allowed = (getCookie === '1' && cookiesAllowed);

						if( allowed ) {
							element.classList.add('gdpr-content-active');
							element.dataset.cnvsGdprProcessed = '1';

							if( elContentAjax ) {
								fetch(elContentAjax).then( function(response) {
									if( !response.ok ) throw new Error('HTTP ' + response.status);
									return response.text();
								}).then( function(html) {
									var domParser = new DOMParser();
									var parsedHTML = domParser.parseFromString(html, 'text/html');
									element.insertAdjacentHTML('beforeend', parsedHTML.body.innerHTML);
									__core.runContainerModules(element);
								}).catch( function(err) {
									console.log(err);
								});
							} else {
								if( elContent ) {
									element.insertAdjacentHTML('beforeend', elContent);
								}
								__core.runContainerModules(element);
							}
						} else {
							element.classList.add('gdpr-content-blocked');
						}
					});
				}
			};
		}(),
		// Cookies Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Quantity Functions Start
		 * --------------------------------------------------------------------------
		 */
		Quantity: function() {
			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-quantity', event: 'pluginQuantityReady' });

					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ) return true;

					selector.forEach( function(element) {
						var plus  = element.querySelector('.plus');
						var minus = element.querySelector('.minus');
						var input = element.querySelector('.qty');
						if( !plus || !minus || !input ) return;

						var fireChange = function() {
							input.dispatchEvent(new Event('change', { bubbles: true }));
						};

						var plusHandler = function(e) {
							e.preventDefault();

							var value = input.value;
							var step = Number(input.getAttribute('step')) || 1;
							var maxAttr = input.getAttribute('max');
							var max = maxAttr !== null ? Number(maxAttr) : null;
							var intRegex = /^\d+$/;

							if( max !== null && isFinite(max) && Number(value) >= max ) {
								return;
							}

							if( intRegex.test(value) ) {
								input.value = Number(value) + step;
							} else {
								input.value = step;
							}

							fireChange();
						};
						__core.rebind(plus, 'click', plusHandler, 'quantity.plus');

						var minusHandler = function(e) {
							e.preventDefault();

							var value = input.value;
							var step = Number(input.getAttribute('step')) || 1;
							var minAttr = input.getAttribute('min');
							var min = minAttr !== null ? Number(minAttr) : NaN;
							if( !isFinite(min) || min < 0 ) min = 1;
							var intRegex = /^\d+$/;

							if( intRegex.test(value) ) {
								if( Number(value) > min ) {
									input.value = Number(value) - step;
								}
							} else {
								input.value = step;
							}

							fireChange();
						};
						__core.rebind(minus, 'click', minusHandler, 'quantity.minus');
					});
				}
			};
		}(),
		// Quantity Functions End

		/**
		 * --------------------------------------------------------------------------
		 * ReadMore Functions Start
		 * --------------------------------------------------------------------------
		 */
		ReadMore: function() {
			var _HEXtoRGBA = function(hex, op) {
				if( /^#([A-Fa-f0-9]{3}){1,2}$/.test(hex) ){
					var c = hex.substring(1).split('');
					if( c.length === 3 ) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
					c = '0x' + c.join('');
					return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + op + ')';
				}
				return 'rgba(255,255,255,' + op + ')';
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-readmore', event: 'pluginReadMoreReady' });

					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ) return true;

					selector.forEach( function(element) {
						var elSize     = element.getAttribute('data-readmore-size') || '10rem',
							elSpeed    = Number(element.getAttribute('data-readmore-speed')) || 500,
							elScrollUp = element.getAttribute('data-readmore-scrollup') === 'true',
							elTrigger  = element.getAttribute('data-readmore-trigger') || '.read-more-trigger',
							elTriggerO = element.getAttribute('data-readmore-trigger-open') || 'Read More',
							elTriggerC = element.getAttribute('data-readmore-trigger-close') || 'Read Less';

						element.style.height = '';
						element.classList.remove('read-more-wrap-open');

						var elHeight = element.offsetHeight;
						var elTriggerElement = element.querySelector(elTrigger);
						if( !elTriggerElement ) return;

						elTriggerElement.classList.remove('d-none');
						var elHeightN = elHeight + elTriggerElement.offsetHeight;

						elTriggerElement.innerHTML = elTriggerO;

						element.classList.add('read-more-wrap');
						element.style.height = elSize;
						element.style.transitionDuration = elSpeed + 'ms';

						var elMask = element.querySelector('.read-more-mask');
						if( !elMask ) {
							elMask = document.createElement('div');
							elMask.className = 'read-more-mask';
							element.appendChild(elMask);
						}

						var elMaskD     = element.getAttribute('data-readmore-mask') !== 'false',
							elMaskColor = element.getAttribute('data-readmore-maskcolor') || '#FFF',
							elMaskSize  = element.getAttribute('data-readmore-masksize') || '100%';

						if( elMaskD ) {
							elMask.style.height = elMaskSize;
							elMask.style.backgroundImage = 'linear-gradient(' + _HEXtoRGBA(elMaskColor, 0) + ', ' + _HEXtoRGBA(elMaskColor, 1) + ')';
							elMask.classList.remove('d-none');
							elMask.classList.add('op-ts', 'op-1');
						} else {
							elMask.classList.add('d-none');
						}

						var clickHandler = function(e) {
							e.preventDefault();

							if( element.classList.contains('read-more-wrap-open') ) {
								element.style.height = elSize;
								element.classList.remove('read-more-wrap-open');
								elTriggerElement.innerHTML = elTriggerO;
								setTimeout( function() {
									if( elScrollUp ) {
										__core.scrollTo((element.offsetTop - __core.getVars.topScrollOffset), false, false);
									}
								}, elSpeed);
								if( elMaskD ) {
									elMask.classList.remove('op-0');
									elMask.classList.add('op-ts', 'op-1');
								}
							} else {
								if( elTriggerC === 'false' ) {
									elTriggerElement.classList.add('d-none');
								}
								element.style.height = elHeightN + 'px';
								element.style.overflow = '';
								element.classList.add('read-more-wrap-open');
								elTriggerElement.innerHTML = elTriggerC;
								if( elMaskD ) {
									elMask.classList.remove('op-1');
									elMask.classList.add('op-0');
								}
							}
						};

						__core.rebind(elTriggerElement, 'click', clickHandler, 'readmore.trigger');
					});

					__core.getVars.resizers.readmore = __core.debounce(function() {
						__modules.readmore();
					}, 200);
				}
			};
		}(),
		// ReadMore Functions End

		/**
		 * --------------------------------------------------------------------------
		 * PricingSwitcher Functions Start
		 * --------------------------------------------------------------------------
		 */
		PricingSwitcher: function() {
			var _tokens = function(str) {
				return String(str || '').split(/\s+/).filter(Boolean);
			};

			var _switcher = function(check, switcher, pricing, defClass, actClass, state) {
				var value;

				if( check.type === 'checkbox' ) {
					state.value = check.checked;
				} else if( check.type === 'radio' ) {
					if( check.checked ) state.value = check.value;
				} else {
					state.value = check.value;
				}

				value = state.value;

				var defTokens = _tokens(defClass);
				var actTokens = _tokens(actClass);

				switcher.querySelectorAll('.pts-switch').forEach( function(elem) {
					actTokens.forEach( function(_class) { elem.classList.remove(_class); });
					defTokens.forEach( function(_class) { elem.classList.add(_class); });
				});

				pricing?.querySelectorAll('.pts-content').forEach( function(elem) {
					elem.classList.add('d-none');
				});

				if( check.type === 'checkbox' ) {
					value = value ? 'true' : 'false';
				}

				var activeSwitch = switcher.querySelector('.pts-' + value);
				if( activeSwitch ) {
					defTokens.forEach( function(_class) { activeSwitch.classList.remove(_class); });
					actTokens.forEach( function(_class) { activeSwitch.classList.add(_class); });
				}

				pricing?.querySelectorAll('.pts-content-' + value).forEach( function(el) {
					el.classList.remove('d-none');
				});
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-pricing-switcher', event: 'pluginPricingSwitcherReady' });

					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ) return true;

					selector.forEach( function(element) {
						var containerSel = element.getAttribute('data-container');
						var elPricing = null;
						if( containerSel ) {
							try { elPricing = document.querySelector(containerSel); } catch(e) { elPricing = null; }
						}
						if( !elPricing ) return;

						var elCheck = element.querySelectorAll('[type="checkbox"], [type="radio"], select');
						var elDefClass = element.getAttribute('data-default-class') || 'text-muted op-05';
						var elActClass = element.getAttribute('data-active-class') || 'fw-bold';
						var state = { value: undefined };

						elCheck.forEach( function(el) {
							_switcher(el, element, elPricing, elDefClass, elActClass, state);

							var handler = function() {
								_switcher(el, element, elPricing, elDefClass, elActClass, state);
							};
							__core.rebind(el, 'change', handler, 'pricingswitcher.input');
						});
					});
				}
			};
		}(),
		// PricingSwitcher Functions End

		/**
		 * --------------------------------------------------------------------------
		 * AjaxTrigger Functions Start
		 * --------------------------------------------------------------------------
		 */
		AjaxTrigger: function() {
			var _inFlight = new WeakSet();

			var _safeJSONParse = function(raw) {
				if( !raw ) return null;
				try { return JSON.parse(raw); } catch(e) { return null; }
			};

			var _load = function(params) {
				if( _inFlight.has(params.trigger) ) return;
				_inFlight.add(params.trigger);

				if( params.triggerDisable == 'true' && params.trigger ) {
					params.trigger.setAttribute('aria-disabled', 'true');
					params.trigger.classList.add('disabled');
				}

				fetch(params.loader).then( function(response) {
					if( !response.ok ) {
						throw new Error('HTTP ' + response.status + ' ' + response.statusText);
					}
					return response.text();
				}).then( function(html) {
					_scripts(params.loadCSS, params.loadJS);

					var domParser = new DOMParser();
					var parsedHTML = domParser.parseFromString(html, 'text/html');

					if( !params.container ) {
						_inFlight.delete(params.trigger);
						return;
					}

					if( params.contentPlacement == 'append' ) {
						params.container.insertAdjacentHTML('beforeend', parsedHTML.body.innerHTML);
					} else {
						params.container.insertAdjacentHTML('afterbegin', parsedHTML.body.innerHTML);
					}

					if( params.triggerHide == 'true' && params.trigger ) {
						params.trigger.classList.add('d-none');
					}

					__core.runContainerModules(params.container);
					__core.viewport();

					if( params.triggerDisable == 'true' && params.trigger ) {
						params.trigger.addEventListener('click', function(e) {
							e.stopPropagation();
							e.preventDefault();
						}, true);
					}

					_inFlight.delete(params.trigger);
				}).catch( function(err) {
					_inFlight.delete(params.trigger);

					if( params.triggerDisable == 'true' && params.trigger ) {
						params.trigger.removeAttribute('aria-disabled');
						params.trigger.classList.remove('disabled');
					}

					if( params.container ) {
						var errorDIV = document.createElement('div');
						errorDIV.classList.add('d-inline-block', 'text-danger', 'me-3');
						errorDIV.innerText = 'Content Cannot be Loaded: ' + (err && err.message ? err.message : String(err));
						params.container.prepend(errorDIV);
					}
				});
			};

			var _scripts = function(loadCSS, loadJS) {
				var cssList = _safeJSONParse(loadCSS);
				if( Array.isArray(cssList) ) {
					cssList.forEach( function(css) { __core.loadCSS(css); });
				}
				var jsList = _safeJSONParse(loadJS);
				if( Array.isArray(jsList) ) {
					jsList.forEach( function(js) { __core.loadJS(js); });
				}
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-ajaxtrigger', event: 'pluginAjaxTriggerReady' });

					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ){
						return true;
					}

					selector.forEach( function(el) {
						var params = {
							trigger: el,
							loader: el.getAttribute('data-ajax-loader'),
							triggerType: el.getAttribute('data-ajax-trigger-type') || 'click',
							loadDelay: el.getAttribute('data-ajax-load-delay') || 2222,
							container: document.querySelector( el.getAttribute('data-ajax-container') ),
							contentPlacement: el.getAttribute('data-ajax-insertion') || 'append',
							triggerHide: el.getAttribute('data-ajax-trigger-hide') || 'true',
							triggerDisable: el.getAttribute('data-ajax-trigger-disable') || 'true',
							loadCSS: el.getAttribute('data-ajax-loadcss') || false,
							loadJS: el.getAttribute('data-ajax-loadjs') || false,
						};

						if( !params.loader ) return;

						if( params.triggerType == 'load' ) {
							setTimeout( function() { _load(params); }, Number(params.loadDelay));
						} else {
							var clickHandler = function(e) {
								e.preventDefault();
								_load(params);
							};
							el.addEventListener('click', clickHandler);
						}
					});
				}
			};
		}(),
		// AjaxTrigger Functions End

		/**
		 * --------------------------------------------------------------------------
		 * VideoFacade Functions Start
		 * --------------------------------------------------------------------------
		 */
		VideoFacade: function() {
			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-videofacade', event: 'pluginVideoFacadeReady' });

					selector = __core.getSelector( selector, false );
					if( !selector || selector.length < 1 ) return true;

					selector.forEach( function(element) {
						if( !__core.markOnce(element, 'cnvsVideofacadeBound') ) return;

						element.addEventListener('click', function(e) {
							e.preventDefault();

							var videoContent = element.getAttribute('data-video-html');
							if( !videoContent ) return;

							var videoRatio = element.getAttribute('data-video-ratio') || 'ratio ratio-16x9',
								videoPreviewEl = element.querySelector('.video-facade-preview'),
								videoContentEl = element.querySelector('.video-facade-content');

							if( !videoContentEl ) return;
							if( !__core.markOnce(element, 'cnvsVideofacadeLoaded') ) return;

							if( videoPreviewEl ) videoPreviewEl.classList.add('d-none');

							videoContentEl.insertAdjacentHTML('beforeend', videoContent);

							videoRatio.split(/\s+/).filter(Boolean).forEach( function(ratioClass) {
								videoContentEl.classList.add(ratioClass);
							});
						});
					});
				}
			};
		}(),
		// VideoFacade Functions End

		/**
		 * --------------------------------------------------------------------------
		 * SchemeToggler Functions Start
		 * --------------------------------------------------------------------------
		 */
		SchemeToggle: function() {
			var _handlers = new WeakMap();

			var _toggle = function(element, sibling = false, action = false, skipSideEffects = false) {
				var bodyClassToggle = element.getAttribute('data-bodyclass-toggle') || 'dark';
				var classAdd = element.getAttribute('data-add-class') || 'scheme-toggler-active';
				var classRemove = element.getAttribute('data-remove-class') || 'scheme-toggler-active';
				var htmlAdd = element.getAttribute('data-add-html');
				var htmlRemove = element.getAttribute('data-remove-html');
				var toggleType = element.getAttribute('data-type') || 'trigger';
				var remember = element.getAttribute('data-remember') === 'true';
				var bodyHasClass = __core.contains(bodyClassToggle, __core.getVars.elBody);

				if( bodyHasClass ) {
					__core.classesFn('add', classAdd, element);
					__core.classesFn('remove', classRemove, element);
					element.classList.add('body-state-toggled');

					if( remember && action ) {
						__core.cookie.set('__cnvs_body_color_scheme', 'dark', 7);
					}

					if( toggleType === 'checkbox' && sibling ) {
						var checkOn = element.querySelector('input[type=checkbox]');
						if( checkOn ) checkOn.checked = true;
					} else if( htmlAdd ) {
						element.innerHTML = htmlAdd;
					}
				} else {
					__core.classesFn('add', classRemove, element);
					__core.classesFn('remove', classAdd, element);
					element.classList.remove('body-state-toggled');

					if( remember && action ) {
						__core.cookie.remove('__cnvs_body_color_scheme');
					}

					if( toggleType === 'checkbox' && sibling ) {
						var checkOff = element.querySelector('input[type=checkbox]');
						if( checkOff ) checkOff.checked = false;
					} else if( htmlRemove ) {
						element.innerHTML = htmlRemove;
					}
				}

				if( !skipSideEffects ) {
					__base.setBSTheme();
					__modules.dataClasses();
				}
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ) return true;

					__core.initFunction({ class: 'has-plugin-schemetoggler', event: 'pluginSchemeTogglerReady' });

					selector = __core.getSelector(selector, false);
					if( selector.length < 1 ) return false;

					selector.forEach(function(element, idx) {
						var bodyClassToggle = element.getAttribute('data-bodyclass-toggle') || 'dark';
						var toggleType = element.getAttribute('data-type') || 'trigger';

						_toggle(element, false, false, idx < selector.length - 1);

						var prev = _handlers.get(element);
						if( prev ) {
							if( prev.target && prev.eventName ) {
								prev.target.removeEventListener(prev.eventName, prev.fn);
							}
						}

						var onActivate = function() {
							__core.classesFn('toggle', bodyClassToggle, __core.getVars.elBody);
							_toggle(element, false, true);
							__core.siblings(element, selector).forEach(function(el) {
								_toggle(el, true);
							});
						};

						if( toggleType === 'checkbox' ) {
							var checkEl = element.querySelector('input[type=checkbox]');
							if( !checkEl ) return;
							var changeFn = function() { onActivate(); };
							checkEl.addEventListener('change', changeFn);
							_handlers.set(element, { target: checkEl, eventName: 'change', fn: changeFn });
						} else {
							var clickFn = function(e) {
								e.preventDefault();
								onActivate();
							};
							element.addEventListener('click', clickFn);
							_handlers.set(element, { target: element, eventName: 'click', fn: clickFn });
						}
					});
				}
			};
		}(),
		// SchemeToggler Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Clipboard Functions Start
		 * --------------------------------------------------------------------------
		 */
		Clipboard: function() {
			var _instances = new WeakMap();

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof ClipboardJS !== 'undefined'; },
						class: 'has-plugin-clipboard',
						event: 'pluginClipboardReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector, false );
						if( selector.length < 1 ) return;

						selector.forEach( function(el) {
							var trigger = el.querySelector('button');
							if( !trigger ) return;

							var prev = _instances.get(trigger);
							if( prev && typeof prev.destroy === 'function' ) {
								prev.destroy();
							}

							var triggerText = trigger.innerHTML;
							var copiedText = trigger.getAttribute('data-copied') || 'Copied';
							var errorText = trigger.getAttribute('data-copy-error') || 'Copy failed';
							var copiedTimeout = Number(trigger.getAttribute('data-copied-timeout')) || 5000;
							var resetTimer = null;

							var clipboard = new ClipboardJS(trigger, {
								target: function(content) {
									var wrap = content.closest('.clipboard-copy');
									return wrap ? wrap.querySelector('code') : null;
								}
							});

							var showFeedback = function(text) {
								trigger.innerHTML = text;
								trigger.disabled = true;
								if( resetTimer ) clearTimeout(resetTimer);
								resetTimer = setTimeout( function() {
									trigger.innerHTML = triggerText;
									trigger.disabled = false;
									resetTimer = null;
								}, copiedTimeout);
							};

							clipboard.on('success', function() { showFeedback(copiedText); });
							clipboard.on('error', function() { showFeedback(errorText); });

							_instances.set(trigger, clipboard);
						});
					});
				}
			};
		}(),
		// Clipboard Functions End

		/**
		 * --------------------------------------------------------------------------
		 * CodeHighlight Functions Start
		 * --------------------------------------------------------------------------
		 */
		CodeHighlight: function() {
			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.loadCSS({ file: 'components/prism.css', id: 'canvas-prism-css', cssFolder: true });

					__core.requirePlugin({
						check: function() { return typeof Prism !== 'undefined'; },
						class: 'has-plugin-codehighlight',
						event: 'pluginCodeHighlightReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector, false );
						if( selector.length < 1 ) return;

						selector.forEach( function(el) {
							var codeEl = el.querySelector('code');
							if( !codeEl ) return;
							if( codeEl.dataset.cnvsHighlighted === 'true' ) return;
							Prism.highlightElement(codeEl);
							codeEl.dataset.cnvsHighlighted = 'true';
						});
					});
				}
			};
		}(),
		// CodeHighlight Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Tips Functions Start
		 * --------------------------------------------------------------------------
		 */
		Tips: function() {
			var TIPS_HTML = '<div class="position-fixed bottom-0 end-0 p-3 text-start" style="z-index: 699;"><div id="cnvs-tips-element" data-notify-trigger="custom" data-notify-target="#cnvs-tips-element" data-notify-timeout="7777" class="toast hide p-3" role="alert" aria-live="assertive" aria-atomic="true" style="--bs-toast-max-width:400px;--bs-toast-bg: rgba(var(--bs-body-bg-rgb),.925);"><div class="toast-header bg-transparent border-0 mb-0 align-items-center pb-1"><h5 id="cnvs-tips-element-title" class="me-auto fs-6 fw-semibold mb-0"></h5><button type="button" class="btn-close me-1" data-bs-dismiss="toast" aria-label="Close"></button></div><div id="cnvs-tips-element-content" class="toast-body small pt-1"></div><a href="#" id="cnvs-tips-element-disable" class="text-muted text-decoration-underline op-06 h-op-08 px-2 pb-2 ms-1 mt-1 d-inline-block" data-cookies="true" style="font-size:.75rem;text-underline-offset:3px;">Disable Random Tips</a></div></div>';

			return {
				init: function(selector) {
					__core.requirePlugin({
						check: function() { return typeof bootstrap !== 'undefined'; }
					}).then( function(ready) {
						if( !ready ) return;

						if( typeof cnvsTips === 'undefined' || !cnvsTips || cnvsTips.length < 1 ) {
							return false;
						}

						if( __core.cookie.get('__cnvs_tips_cookies') === 'hide' ) {
							return false;
						}

						var elBody = __core.getVars.elBody;
						var elWrapper = __core.getVars.elWrapper;
						if( !elBody || !elWrapper ) return false;

						if( elBody.classList.contains('init-plugin-tips') ) {
							return false;
						}

						__core.initFunction({ class: 'has-plugin-tips', event: 'pluginTipsReady' });

						var randomIndex = Math.floor(Math.random() * cnvsTips.length);
						var randomTip = cnvsTips[randomIndex];
						if( !randomTip ) return false;

						var tipsEl = document.getElementById('cnvs-tips-element');
						if( !tipsEl ) {
							elWrapper.insertAdjacentHTML('beforeend', TIPS_HTML);
							tipsEl = document.getElementById('cnvs-tips-element');
							if( !tipsEl ) return false;
						}

						var tipsTitle = document.getElementById('cnvs-tips-element-title');
						var tipsContent = document.getElementById('cnvs-tips-element-content');
						var tipsDisable = document.getElementById('cnvs-tips-element-disable');
						var tipsEnable = document.getElementById('cnvs-tips-element-enable');

						if( tipsTitle ) tipsTitle.innerHTML = randomTip.title || '';
						if( tipsContent ) tipsContent.innerHTML = randomTip.content || '';

						if( __core.markOnce(tipsDisable, 'cnvsTipsBound') ) {
							tipsDisable.addEventListener('click', function(e) {
								e.preventDefault();
								var tipsToast = bootstrap.Toast.getOrCreateInstance(tipsEl);
								tipsToast.hide();
								__core.cookie.set('__cnvs_tips_cookies', 'hide', 1);
							});
						}

						if( __core.markOnce(tipsEnable, 'cnvsTipsBound') ) {
							tipsEnable.addEventListener('click', function(e) {
								e.preventDefault();
								__core.cookie.remove('__cnvs_tips_cookies');
								window.location.reload();
							});
						}

						elBody.classList.add('init-plugin-tips');
						setTimeout(function(){
							__modules.notifications(tipsEl);
						}, Math.floor(Math.random() * 5000));
					});
				}
			};
		}(),
		// Tips Functions End

		/**
		 * --------------------------------------------------------------------------
		 * TextSplitter Functions Start
		 * --------------------------------------------------------------------------
		 */
		TextSplitter: function() {
			var _getText = function(element) {
				return element.textContent || element.innerText || '';
			};

			var _joiner = function(arr, tag, glue) {
				return arr.map( function(chunk) {
					return '<' + tag + '>' + __core.escapeHTML(chunk) + '</' + tag + '>';
				}).join(glue);
			};

			var _words = function(element, tag) {
				var words = _getText(element).split(/\s+/).filter(Boolean);
				return _joiner(words, tag, ' ');
			};

			var _letters = function(element, tag) {
				var letters = Array.from(_getText(element));
				return _joiner(letters, tag, '');
			};

			var _splitter = function(el, type) {
				var tag = 'span';
				el.innerHTML = type === 'letter' ? _letters(el, tag) : _words(el, tag);

				el.querySelectorAll('span').forEach( function(elem, index) {
					elem.style.setProperty('--cnvs-split-index', index + 1);
				});
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					selector = __core.getSelector( selector, false );
					if( !selector || selector.length < 1 ){
						return true;
					}

					selector.forEach( function(el) {
						if( !__core.markOnce(el, 'cnvsTextsplitterInit') ) return;

						var type = el.getAttribute('data-split-type') || 'word';
						_splitter(el, type);
					});
				}
			};
		}(),
		// TextSplitter Functions End

		/**
		 * --------------------------------------------------------------------------
		 * MediaActions Functions Start
		 * --------------------------------------------------------------------------
		 */
		MediaActions: function() {
			var _bindings = new WeakMap();
			var _pauseEv = ['ended', 'error', 'pause', 'seeking', 'waiting'];
			var _playEv  = ['play', 'playing'];

			var _updateVolumeState = function(mediaEl, mediaWrap) {
				if( !mediaWrap ) return;
				if( mediaEl.volume < 0.1 || mediaEl.muted ) {
					mediaWrap.classList.add('media-is-muted');
				} else {
					mediaWrap.classList.remove('media-is-muted');
				}
			};

			var _formatTime = function(duration) {
				if( !isFinite(duration) ) return '0:00';
				var minutes = Math.floor(duration / 60);
				var seconds = Math.floor(duration % 60);
				return minutes + ':' + (seconds < 10 ? '0' + seconds : seconds);
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-mediaactions', event: 'pluginMediaActionsReady' });

					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ) return true;

					selector.forEach( function(mediaWrap) {
						var mediaEl = mediaWrap.querySelector('video,audio');
						if( !mediaEl ) return;

						var mediaTrigger  = mediaWrap.querySelector('.media-trigger-playback');
						var volumeTrigger = mediaWrap.querySelector('.media-trigger-volume');
						var mediaDuration = mediaWrap.querySelector('.media-duration');

						var prev = _bindings.get(mediaEl);
						if( prev ) {
							prev.pauseHandlers.forEach( function(h, i) { mediaEl.removeEventListener(_pauseEv[i], h); });
							prev.playHandlers.forEach( function(h, i) { mediaEl.removeEventListener(_playEv[i], h); });
							mediaEl.removeEventListener('timeupdate', prev.timeHandler);
							mediaEl.removeEventListener('volumechange', prev.volHandler);
							mediaEl.removeEventListener('loadedmetadata', prev.metaHandler);
							if( prev.playClick ) prev.playClick.target.removeEventListener('click', prev.playClick.fn);
							if( prev.volClick )  prev.volClick.target.removeEventListener('click', prev.volClick.fn);
						}

						var pauseHandlers = _pauseEv.map( function(evName) {
							var h = function(){
								mediaWrap.classList.remove('media-is-playing');
								_updateVolumeState(mediaEl, mediaWrap);
							};
							mediaEl.addEventListener(evName, h);
							return h;
						});

						var playHandlers = _playEv.map( function(evName) {
							var h = function(){
								mediaWrap.classList.add('media-is-playing');
								_updateVolumeState(mediaEl, mediaWrap);
							};
							mediaEl.addEventListener(evName, h);
							return h;
						});

						var timeHandler = function(){
							if( mediaDuration ) {
								mediaDuration.textContent = _formatTime(mediaEl.currentTime);
							}
						};
						mediaEl.addEventListener('timeupdate', timeHandler);

						var volHandler = function(){ _updateVolumeState(mediaEl, mediaWrap); };
						mediaEl.addEventListener('volumechange', volHandler);

						var metaHandler = function(){
							if( mediaDuration ) {
								mediaDuration.textContent = _formatTime(mediaEl.duration);
							}
						};
						mediaEl.addEventListener('loadedmetadata', metaHandler);
						if( mediaEl.readyState >= 1 ) metaHandler();

						var playClick = null;
						if( mediaTrigger ) {
							var pFn = function(e) {
								e.preventDefault();
								if( mediaEl.paused ) { mediaEl.play(); } else { mediaEl.pause(); }
							};
							mediaTrigger.addEventListener('click', pFn);
							playClick = { target: mediaTrigger, fn: pFn };
						}

						var volClick = null;
						if( volumeTrigger ) {
							var vFn = function(e) {
								e.preventDefault();
								mediaEl.muted = !mediaEl.muted;
							};
							volumeTrigger.addEventListener('click', vFn);
							volClick = { target: volumeTrigger, fn: vFn };
						}

						_bindings.set(mediaEl, {
							pauseHandlers: pauseHandlers,
							playHandlers: playHandlers,
							timeHandler: timeHandler,
							volHandler: volHandler,
							metaHandler: metaHandler,
							playClick: playClick,
							volClick: volClick,
						});
					});
				}
			};
		}(),
		// MediaActions Functions End

		/**
		 * --------------------------------------------------------------------------
		 * ViewportDetect Functions Start
		 * --------------------------------------------------------------------------
		 */
		ViewportDetect: function() {
			var _splitClasses = function(value) {
				return (value || '').split(/\s+/).filter(Boolean);
			};

			var _setBSTheme = function(target) {
				if( !target ) return;
				if( target.classList.contains('dark') ) {
					target.setAttribute('data-bs-theme', 'dark');
				} else {
					target.removeAttribute('data-bs-theme');
				}
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-viewportdetect', event: 'pluginViewportDetectReady' });

					selector = __core.getSelector( selector, false );
					if( !selector || selector.length < 1 ){
						return true;
					}

					selector.forEach( function(el) {
						if( !__core.markOnce(el, 'cnvsViewportdetectInit') ) return;

						var elDelay        = __core.toNumber(el.getAttribute('data-delay'), 0);
						var elClass        = _splitClasses(el.getAttribute('data-viewport-class'));
						var elClassOut     = _splitClasses(el.getAttribute('data-viewport-class-out'));
						var elClassTargetA = el.getAttribute('data-viewport-class-target');
						var elThreshold    = __core.toNumber(el.getAttribute('data-viewport-threshold'), 0);
						var elRootMargin   = el.getAttribute('data-viewport-rootmargin') || '0px';

						var hasDark = elClass.indexOf('dark') !== -1 || elClassOut.indexOf('dark') !== -1;

						var resolvedTarget = elClassTargetA ? document.querySelector(elClassTargetA) : null;

						try {
							__core.intersect(el, { threshold: elThreshold, rootMargin: elRootMargin },
								function(elTarget) {
									var classTarget = resolvedTarget || elTarget;
									setTimeout( function() {
										elTarget.classList.add('is-in-viewport');
										elClass.forEach( function(c) { classTarget.classList.add(c); });
										elClassOut.forEach( function(c) { classTarget.classList.remove(c); });
										if( hasDark ) _setBSTheme(classTarget);
									}, elDelay);
								},
								function(elTarget) {
									var classTarget = resolvedTarget || elTarget;
									elTarget.classList.remove('is-in-viewport');
									elClass.forEach( function(c) { classTarget.classList.remove(c); });
									elClassOut.forEach( function(c) { classTarget.classList.add(c); });
									if( hasDark ) _setBSTheme(classTarget);
								}
							);
						} catch(e) {
							console.warn('ViewportDetect: invalid IntersectionObserver options', e);
						}
					});
				}
			};
		}(),
		// ViewportDetect Functions End

		/**
		 * --------------------------------------------------------------------------
		 * ScrollDetect Functions Start
		 * --------------------------------------------------------------------------
		 */
		ScrollDetect: function() {
			var _detects = [];
			var _resizeObserver = null;
			var _scrollBound = false;
			var _scrollTicking = false;
			var _currentSelector = null;

			var _percent = function(params) {
				fastdom.measure( function(){
					var percent = 0, ratio = 0, start = 0, end = 0;
					var position = window.scrollY;

					if( position >= params.start && position <= params.end ) {
						var startViewScroll = position - params.start;
						var offsetScroll = position - params.offset;
						percent = (startViewScroll / params.range.full) * 100;
						start = (startViewScroll / params.range.start);

						if( position > (params.start + params.height) && position < params.offset ) {
							start = 1;
							end = 0;
						} else if( position >= params.offset ) {
							start = 1;
							end = (offsetScroll / params.range.end);
						} else {
							end = 0;
						}

						ratio = start - end;
					} else if( position > params.end ) {
						percent = 100;
						ratio = 0;
						start = end = 1;
					} else {
						percent = ratio = start = end = 0;
					}

					params.elem.classList.toggle('scroll-detect-inview', ratio > 0);
					params.elem.classList.toggle('scroll-detect-inview-start', start > 0 && start < 1);
					params.elem.classList.toggle('scroll-detect-inview-end', end > 0 && end < 1);

					params.elem.style.setProperty('--cnvs-scroll-percent', percent);
					params.elem.style.setProperty('--cnvs-scroll-ratio', ratio);
					params.elem.style.setProperty('--cnvs-scroll-start', start);
					params.elem.style.setProperty('--cnvs-scroll-end', end);
				});
			};

			var _handle = function() {
				_detects.forEach(_percent);
			};

			var _onScroll = function() {
				if( _scrollTicking ) return;
				_scrollTicking = true;
				window.requestAnimationFrame( function(){
					fastdom.mutate(_handle);
					_scrollTicking = false;
				});
			};

			var _initParams = function(selector) {
				_detects = [];

				selector.forEach( function(elem) {
					var elemWidth     = elem.offsetWidth,
						elemHeight    = elem.offsetHeight,
						elemOffset    = __core.offset(elem).top,
						viewportHeight = __core.getVars.viewport.height,
						includeWidth  = elem.getAttribute('data-include-width'),
						includeHeight = elem.getAttribute('data-include-height'),
						includeOffset = elem.getAttribute('data-include-offset'),
						scrollOffset  = elem.getAttribute('data-scroll-offset'),
						parallaxRatio = elem.getAttribute('data-parallax-ratio');

					if( scrollOffset ) {
						var parts = scrollOffset.split('%');
						if( parts.length > 1 ) {
							var pct = parseFloat(parts[0]);
							if( isFinite(pct) ) elemOffset += (viewportHeight * pct * 0.01);
						} else if( parts[0] ) {
							var px = parseFloat(parts[0]);
							if( isFinite(px) ) elemOffset += px;
						}
					}

					var scrollStart = elemOffset - viewportHeight,
						scrollEnd = elemOffset + elemHeight,
						scrollRange = scrollEnd - scrollStart;

					var params = {
						elem: elem,
						start: scrollStart,
						end: scrollEnd,
						range: { start: elemHeight, end: elemHeight, full: scrollRange },
						width: elemWidth,
						height: elemHeight,
						offset: elemOffset
					};

					if( includeWidth === 'true' || (elem.classList.contains('parallax') && elem.getAttribute('data-parallax-direction') === 'horizontal') ) {
						elem.style.setProperty('--cnvs-scroll-width', params.width);
					}

					if( includeHeight === 'true' || (elem.classList.contains('parallax') && elem.getAttribute('data-parallax-direction') !== 'horizontal') ) {
						elem.style.setProperty('--cnvs-scroll-height', params.height);
					}

					if( includeOffset === 'true' ) {
						elem.style.setProperty('--cnvs-scroll-offset', params.offset);
					}

					if( parallaxRatio !== null && parallaxRatio !== '' ) {
						var ratioNum = parseFloat(parallaxRatio);
						if( isFinite(ratioNum) ) elem.style.setProperty('--cnvs-parallax-ratio', ratioNum);
					}

					_percent(params);
					_detects.push(params);

					if( _resizeObserver && __core.markOnce(elem, 'cnvsScrolldetectObserved') ) {
						_resizeObserver.observe(elem);
					}
				});
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof fastdom !== 'undefined'; },
						class: 'has-plugin-scrolldetect',
						event: 'pluginScrollDetectReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector, false );
						if( !selector || selector.length < 1 ) return;

						_currentSelector = selector;

						if( !_resizeObserver ) {
							var debouncedReinit = __core.debounce(function() {
								if( _currentSelector ) _initParams(_currentSelector);
							}, 333);
							_resizeObserver = new ResizeObserver(debouncedReinit);
							_resizeObserver.observe(document.documentElement);
						}

						_initParams(selector);
						_handle();

						if( !_scrollBound ) {
							window.addEventListener('scroll', _onScroll, { passive: true });
							_scrollBound = true;
						}
					});
				}
			};
		}(),
		// ScrollDetect Functions End

		/**
		 * --------------------------------------------------------------------------
		 * FontSizer Functions Start
		 * --------------------------------------------------------------------------
		 */
		FontSizer: function() {
			var _escapeSel = function(val) {
				if( !val ) return '';
				if( typeof CSS !== 'undefined' && CSS.escape ) {
					if( val.charAt(0) === '#' ) return '#' + CSS.escape(val.slice(1));
					if( val.charAt(0) === '.' ) return '.' + CSS.escape(val.slice(1));
				}
				return val;
			};

			var _currentFontSize = function(el) {
				return parseFloat(getComputedStyle(el).fontSize) || 0;
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-fontsizer', event: 'pluginFontSizerReady' });

					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ) return true;

					selector.forEach( function(elem) {
						var targetAttr = elem.getAttribute('data-target');
						if( !targetAttr ) return;

						var targetEl;
						try { targetEl = document.querySelector(_escapeSel(targetAttr)); } catch(e) { targetEl = null; }
						if( !targetEl ) return;

						var step = Number(elem.getAttribute('data-step')) || 10;
						var min  = Number(elem.getAttribute('data-min')) || 12;
						var max  = Number(elem.getAttribute('data-max')) || 24;
						var defaultSize = _currentFontSize(targetEl);
						var increment = defaultSize * step * 0.01;

						var defaultBtn = elem.querySelector('.font-size-default');
						var minusBtn   = elem.querySelector('.font-size-minus');
						var plusBtn    = elem.querySelector('.font-size-plus');

						if( defaultBtn ) {
							defaultBtn.addEventListener('click', function(e) {
								e.preventDefault();
								targetEl.style.fontSize = defaultSize + 'px';
							});
						}

						if( minusBtn ) {
							minusBtn.addEventListener('click', function(e) {
								e.preventDefault();
								var newSize = _currentFontSize(targetEl) - increment;
								if( newSize >= min ) targetEl.style.fontSize = newSize + 'px';
							});
						}

						if( plusBtn ) {
							plusBtn.addEventListener('click', function(e) {
								e.preventDefault();
								var newSize = _currentFontSize(targetEl) + increment;
								if( newSize <= max ) targetEl.style.fontSize = newSize + 'px';
							});
						}
					});
				}
			};
		}(),
		// FontSizer Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Hover3D Functions Start
		 * --------------------------------------------------------------------------
		 */
		Hover3D: function() {
			var _bindings = new WeakMap();

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-hover3d', event: 'pluginHover3DReady' });

					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ) return true;

					var hasFinePointer = !window.matchMedia || window.matchMedia('(pointer: fine)').matches;
					if( !hasFinePointer ) return;

					selector.forEach( function(el) {
						var prev = _bindings.get(el);
						if( prev ) {
							el.removeEventListener('mousemove', prev.move);
							el.removeEventListener('mouseleave', prev.leave);
							el.removeEventListener('mousedown', prev.down);
							el.removeEventListener('mouseup', prev.up);
							if( prev.state.rafId !== null ) cancelAnimationFrame(prev.state.rafId);
						}

						var state = { pendingX: 0, pendingY: 0, rafId: null };

						var cancelPending = function() {
							if( state.rafId !== null ) {
								cancelAnimationFrame(state.rafId);
								state.rafId = null;
							}
						};

						var apply = function() {
							state.rafId = null;
							var width  = el.clientWidth;
							var height = el.clientHeight;
							if( !width || !height ) return;
							var yRotation =  20 * ((state.pendingX - width  / 2) / width);
							var xRotation = -20 * ((state.pendingY - height / 2) / height);
							el.style.transform = 'perspective(500px) scale(1.1) rotateX(' + xRotation + 'deg) rotateY(' + yRotation + 'deg) rotateZ(0)';
						};

						var moveHandler = function(e) {
							state.pendingX = typeof e.offsetX === 'number' ? e.offsetX : e.layerX;
							state.pendingY = typeof e.offsetY === 'number' ? e.offsetY : e.layerY;
							if( state.rafId !== null ) return;
							state.rafId = window.requestAnimationFrame(apply);
						};
						var leaveHandler = function() {
							cancelPending();
							el.style.transform = 'perspective(500px) scale(1) rotateX(0) rotateY(0) rotateZ(0)';
						};
						var downHandler = function() {
							cancelPending();
							el.style.transform = 'perspective(500px) scale(0.9) rotateX(0) rotateY(0) rotateZ(0)';
						};
						var upHandler = function() {
							cancelPending();
							el.style.transform = 'perspective(500px) scale(1.1) rotateX(0) rotateY(0) rotateZ(0)';
						};

						el.addEventListener('mousemove', moveHandler, { passive: true });
						el.addEventListener('mouseleave', leaveHandler);
						el.addEventListener('mousedown', downHandler);
						el.addEventListener('mouseup', upHandler);

						_bindings.set(el, { move: moveHandler, leave: leaveHandler, down: downHandler, up: upHandler, state: state });
					});
				}
			};
		}(),
		// Hover3D Functions End

		/**
		 * --------------------------------------------------------------------------
		 * Buttons Functions Start
		 * --------------------------------------------------------------------------
		 */
		Buttons: function() {
			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.initFunction({ class: 'has-plugin-buttons', event: 'pluginButtonsReady' });

					selector = __core.getSelector( selector, false );
					if( selector.length < 1 ){
						return true;
					}

					selector.forEach( function(el){
						if( el.querySelector(':scope > .button-inner') ) return;

						var text = el.innerHTML;
						el.innerHTML = '';

						var inner = document.createElement('div');
						inner.classList.add('button-inner');

						var span = document.createElement('span');
						span.innerHTML = text;

						inner.append(span);

						var span2 = span.cloneNode(true);
						span.after(span2);

						el.append(inner);
					});
				}
			};
		}(),
		// Buttons Functions End

		/**
		 * --------------------------------------------------------------------------
		 * BSComponents Functions Start
		 * --------------------------------------------------------------------------
		 */
		BSComponents: function() {
			var _shownHandlers = new WeakMap();
			var _closeHandlers = new WeakMap();

			var _escapeAttr = function(val) {
				if( !val ) return '';
				if( typeof CSS !== 'undefined' && CSS.escape ) return CSS.escape(val);
				return val.replace(/([^\w-])/g, '\\$1');
			};

			return {
				init: function(selector) {
					if( __core.getSelector(selector, false, false).length < 1 ){
						return true;
					}

					__core.requirePlugin({
						check: function() { return typeof bootstrap !== 'undefined'; },
						class: 'has-plugin-bscomponents',
						event: 'pluginBsComponentsReady'
					}).then( function(ready) {
						if( !ready ) return;

						selector = __core.getSelector( selector, false );
						if( selector.length < 1 ) return;

						__core.getVars.baseEl.querySelectorAll('[data-bs-toggle="tooltip"]').forEach( function(el) {
							bootstrap.Tooltip.getOrCreateInstance(el, { container: 'body' });
						});

						__core.getVars.baseEl.querySelectorAll('[data-bs-toggle="popover"]').forEach( function(el) {
							bootstrap.Popover.getOrCreateInstance(el, { container: 'body' });
						});

						var tabs = document.querySelectorAll('[data-bs-toggle="tab"],[data-bs-toggle="pill"]');

						var tabTargetShow = function(target) {
							if( !target ) return;
							var tabTrigger = bootstrap.Tab.getOrCreateInstance(target);
							tabTrigger.show();
							var hash = __core.getVars.hash;
							if( hash ) {
								var sel = '[data-bs-target="' + _escapeAttr(hash) + '"]';
								if( document.querySelector(sel) ) {
									setTimeout( function(){
										__core.scrollTo((__core.offset(target).top - __core.getVars.topScrollOffset - 20), 0, false, 'smooth');
									}, 1000);
								}
							}
						};

						document.querySelectorAll('.canvas-tabs').forEach( function(el) {
							var activeTab = el.getAttribute('data-active');
							if( activeTab ) {
								activeTab = Number(activeTab) - 1;
								tabTargetShow(el.querySelectorAll('[data-bs-target]')[activeTab]);
							}
						});

						document.querySelectorAll('.tab-hover').forEach( function(el) {
							el.querySelectorAll('[data-bs-target]').forEach( function(tab) {
								var prev = _shownHandlers.get(tab);
								if( prev && prev.hover ) {
									tab.removeEventListener('mouseenter', prev.hover);
								}
								var hoverFn = function() { tabTargetShow(tab); };
								tab.addEventListener('mouseenter', hoverFn);
								_shownHandlers.set(tab, Object.assign({}, prev || {}, { hover: hoverFn }));
							});
						});

						if( __core.getVars.hash ) {
							var hashSel = '[data-bs-target="' + _escapeAttr(__core.getVars.hash) + '"]';
							var hashTarget = document.querySelector(hashSel);
							if( hashTarget ) tabTargetShow(hashTarget);
						}

						tabs.forEach( function(el) {
							var prev = _shownHandlers.get(el);
							if( prev && prev.shown ) {
								el.removeEventListener('shown.bs.tab', prev.shown);
							}
							var shownFn = function() {
								if( el.classList.contains('container-modules-loaded') ) return;
								var tabContentSel = el.getAttribute('data-bs-target') || el.getAttribute('href');
								if( !tabContentSel ) return;
								var tabContentEl;
								try { tabContentEl = document.querySelector(tabContentSel); } catch(e) { tabContentEl = null; }
								if( !tabContentEl ) return;

								__core.runContainerModules(tabContentEl);

								tabContentEl.querySelectorAll('.flexslider').forEach( function(flex) {
									setTimeout( function() {
										if( typeof jQuery !== 'undefined' ) {
											jQuery(flex).find('.slide').resize();
										}
									}, 500);
								});

								el.classList.add('container-modules-loaded');
							};
							el.addEventListener('shown.bs.tab', shownFn);
							_shownHandlers.set(el, Object.assign({}, prev || {}, { shown: shownFn }));
						});

						document.querySelectorAll('.style-msg .btn-close').forEach( function(el) {
							var prev = _closeHandlers.get(el);
							if( prev ) el.removeEventListener('click', prev);
							var closeFn = function(e) {
								e.preventDefault();
								el.closest('.style-msg')?.classList.add('d-none');
							};
							el.addEventListener('click', closeFn);
							_closeHandlers.set(el, closeFn);
						});
					});
				}
			};
		}(),
		// BSComponents Functions End
	};
})));
