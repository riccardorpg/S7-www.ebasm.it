CNVS.BSComponents = function() {
	var __core = SEMICOLON.Core;

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
				file: 'plugins.bootstrap.js',
				id: 'canvas-bootstrap-js',
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
}();
