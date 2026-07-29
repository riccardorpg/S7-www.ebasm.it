CNVS.MasonryThumbs = function() {
	var __core = SEMICOLON.Core;
	var __modules = SEMICOLON.Modules;

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
}();
