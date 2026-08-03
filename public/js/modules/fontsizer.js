CNVS.FontSizer = function() {
	var __core = SEMICOLON.Core;

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
}();
