CNVS.Logo = function() {
	var __core = SEMICOLON.Core;

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
}();
