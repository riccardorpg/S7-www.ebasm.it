CNVS.ViewportDetect = function() {
	var __core = SEMICOLON.Core;

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
}();
