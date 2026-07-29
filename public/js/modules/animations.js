CNVS.Animations = function() {
	var __core = SEMICOLON.Core;

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
}();
