CNVS.TextRotator = function() {
	var __core = SEMICOLON.Core;

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.requirePlugin({
				file: 'plugins.textrotator.js',
				id: 'canvas-textrotator-js',
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
}();
