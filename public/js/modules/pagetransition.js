CNVS.PageTransition = function() {
	var __core = SEMICOLON.Core;

	var _loaderTemplates = {
		'2':  '<div class="css3-spinner-flipper"></div>',
		'3':  '<div class="css3-spinner-double-bounce1"></div><div class="css3-spinner-double-bounce2"></div>',
		'4':  '<div class="css3-spinner-rect1"></div><div class="css3-spinner-rect2"></div><div class="css3-spinner-rect3"></div><div class="css3-spinner-rect4"></div><div class="css3-spinner-rect5"></div>',
		'5':  '<div class="css3-spinner-cube1"></div><div class="css3-spinner-cube2"></div>',
		'6':  '<div class="css3-spinner-scaler"></div>',
		'7':  '<div class="css3-spinner-grid-pulse"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>',
		'8':  '<div class="css3-spinner-clip-rotate"><div></div></div>',
		'9':  '<div class="css3-spinner-ball-rotate"><div></div><div></div><div></div></div>',
		'10': '<div class="css3-spinner-zig-zag"><div></div><div></div></div>',
		'11': '<div class="css3-spinner-triangle-path"><div></div><div></div><div></div></div>',
		'12': '<div class="css3-spinner-ball-scale-multiple"><div></div><div></div><div></div></div>',
		'13': '<div class="css3-spinner-ball-pulse-sync"><div></div><div></div><div></div></div>',
		'14': '<div class="css3-spinner-scale-ripple"><div></div><div></div><div></div></div>',
	};

	var _defaultLoader = '<div class="css3-spinner-bounce1"></div><div class="css3-spinner-bounce2"></div><div class="css3-spinner-bounce3"></div>';

	var _sanitizeColorValue = function(v) {
		if( !v ) return '';
		return String(v).replace(/[";{}<>]/g, '');
	};

	return {
		init: function(selector) {
			var body = __core.getVars.elBody;

			__core.initFunction({ class: 'has-plugin-pagetransition', event: 'pluginPageTransitionReady' });

			if( body.classList.contains('no-transition') ) return true;
			if( !body.classList.contains('page-transition') ) body.classList.add('page-transition');

			window.addEventListener('pageshow', function(event) {
				if( event.persisted ) window.location.reload();
			});

			var elAnimIn      = body.getAttribute('data-animation-in') || 'fadeIn';
			var elSpeedIn     = Number(body.getAttribute('data-speed-in')) || 1000;
			var elTimeoutRaw  = body.getAttribute('data-loader-timeout');
			var elTimeout     = elTimeoutRaw ? Number(elTimeoutRaw) : null;
			var elLoader      = body.getAttribute('data-loader');
			var elLoaderColor = body.getAttribute('data-loader-color');
			var elLoaderHtml  = body.getAttribute('data-loader-html');

			var elLoaderCSSVar = '';
			if( elLoaderColor ) {
				var colorValue = elLoaderColor === 'theme' ? 'var(--cnvs-themecolor)' : _sanitizeColorValue(elLoaderColor);
				elLoaderCSSVar = ' style="--cnvs-loader-color:' + colorValue + ';"';
			}

			var innerLoader = elLoaderHtml || _loaderTemplates[elLoader] || _defaultLoader;
			var finalLoaderHtml = '<div class="css3-spinner"' + elLoaderCSSVar + '>' + innerLoader + '</div>';

			if( elAnimIn === 'fadeIn' ) {
				__core.getVars.elWrapper.classList.add('op-1');
			} else {
				__core.getVars.elWrapper.classList.add('not-animated');
			}

			var pageTransition = document.querySelector('.page-transition-wrap');
			if( !pageTransition ) {
				var divPT = document.createElement('div');
				divPT.className = 'page-transition-wrap';
				divPT.innerHTML = finalLoaderHtml;
				body.prepend(divPT);
				pageTransition = divPT;
			}

			if( elSpeedIn ) {
				__core.getVars.elWrapper.style.setProperty('--cnvs-animate-duration', elSpeedIn + 'ms');
				if( elAnimIn === 'fadeIn' ) {
					pageTransition.style.setProperty('--cnvs-animate-duration', elSpeedIn + 'ms');
				}
			}

			var ended = false;
			var failsafeTimer = null;

			var endPageTransition = function() {
				if( ended ) return;
				ended = true;
				clearTimeout(failsafeTimer);

				elAnimIn.split(/\s+/).filter(Boolean).forEach( function(_class) {
					pageTransition.classList.remove(_class);
				});
				pageTransition.classList.add('fadeOut', 'animated');

				var removePageTransition = function() {
					if( pageTransition.parentNode ) pageTransition.remove();
					if( elAnimIn !== 'fadeIn' ) {
						__core.getVars.elWrapper.classList.remove('not-animated');
						(elAnimIn + ' animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
							__core.getVars.elWrapper.classList.add(_class);
						});
					}
				};

				var displayContent = function() {
					body.classList.remove('page-transition');
					setTimeout( function() {
						(elAnimIn + ' animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
							__core.getVars.elWrapper.classList.remove(_class);
						});
					}, 333);
					setTimeout( function() {
						__core.getVars.elWrapper.style.removeProperty('--cnvs-animate-duration');
					}, 666);
				};

				pageTransition.addEventListener('transitionend', removePageTransition, { once: true });
				pageTransition.addEventListener('animationend', removePageTransition, { once: true });
				__core.getVars.elWrapper.addEventListener('transitionend', displayContent, { once: true });
				__core.getVars.elWrapper.addEventListener('animationend', displayContent, { once: true });
			};

			if( document.readyState === 'complete' ) {
				endPageTransition();
			} else {
				window.addEventListener('load', endPageTransition, { once: true });
			}

			if( elTimeout !== null && isFinite(elTimeout) ) {
				setTimeout(endPageTransition, elTimeout);
			}

			failsafeTimer = setTimeout( function() {
				endPageTransition();
				if( pageTransition && pageTransition.parentNode ) {
					pageTransition.remove();
				}
				body.classList.remove('page-transition');
			}, Math.max(elSpeedIn * 3, 8000));
		}
	};
}();
