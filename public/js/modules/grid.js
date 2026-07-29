CNVS.Grid = function() {
	var __core = SEMICOLON.Core;

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
				file: 'plugins.isotope.js',
				id: 'canvas-isotope-js',
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
}();
