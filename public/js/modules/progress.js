CNVS.Progress = function() {
	var __core = SEMICOLON.Core;
	var __modules = SEMICOLON.Modules;

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
}();
