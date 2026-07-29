CNVS.DataHeights = function() {
	var __core = SEMICOLON.Core;
	var __modules = SEMICOLON.Modules;

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
}();
