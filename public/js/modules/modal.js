CNVS.Modal = function() {
	var __core = SEMICOLON.Core;

	var _closeMagnific = function() {
		var mfp = typeof jQuery !== 'undefined' && jQuery.magnificPopup;
		if( !mfp ) return;
		if( mfp.instance && typeof mfp.instance.close === 'function' ) {
			mfp.instance.close();
		} else if( typeof mfp.close === 'function' ) {
			mfp.close();
		}
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.requirePlugin({
				file: 'plugins.lightbox.js',
				id: 'canvas-lightbox-js',
				check: function() { return typeof jQuery !== 'undefined' && jQuery().magnificPopup; },
				class: 'has-plugin-modal',
				event: 'pluginModalReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector );
				if( selector.length < 1 ) return;

				var closeButtonIcon = '<i class="bi-x-lg"></i>';

				selector.each( function(){
					var element = jQuery(this);
					var elTarget = element.attr('data-target');
					if( !elTarget || elTarget.charAt(0) !== '#' ) return;

					var elTargetId = elTarget.slice(1);
					var elTargetValue = '__cnvs_' + elTargetId;
					var elDelay = Number(element.attr('data-delay')) || 500;
					var elTimeoutRaw = element.attr('data-timeout');
					var elTimeout = elTimeoutRaw ? Number(elTimeoutRaw) : null;
					var elAnimateIn = element.attr('data-animate-in') || '';
					var elAnimateOut = element.attr('data-animate-out') || '';
					var elBgClick = element.attr('data-bg-click') !== 'false';
					var elCloseBtn = element.attr('data-close-btn') !== 'false';
					var elCookies = element.attr('data-cookies');
					var elCookiePath = element.attr('data-cookie-path');
					var elCookieExp = element.attr('data-cookie-expire');

					if( elCookies === 'false' ) {
						__core.cookie.remove(elTargetValue);
					}

					if( elCookies === 'true' ) {
						var elementCookie = __core.cookie.get(elTargetValue);
						if( typeof elementCookie !== 'undefined' && elementCookie === '0' ) return;
					}

					var totalDelay = elDelay + 500;

					setTimeout(function() {
						jQuery.magnificPopup.open({
							items: { src: elTarget },
							type: 'inline',
							mainClass: 'mfp-no-margins mfp-fade',
							closeBtnInside: false,
							fixedContentPos: true,
							closeOnBgClick: elBgClick,
							showCloseBtn: elCloseBtn,
							removalDelay: 500,
							closeIcon: closeButtonIcon,
							callbacks: {
								open: function() {
									if( elAnimateIn ) {
										jQuery(elTarget).addClass(elAnimateIn + ' animated');
									}
								},
								beforeClose: function() {
									if( elAnimateOut ) {
										var $target = jQuery(elTarget);
										if( elAnimateIn ) $target.removeClass(elAnimateIn);
										$target.addClass(elAnimateOut);
									}
								},
								afterClose: function() {
									if( elAnimateIn || elAnimateOut ) {
										jQuery(elTarget).removeClass(elAnimateIn + ' ' + elAnimateOut + ' animated');
									}
								}
							}
						}, 0);
					}, totalDelay);

					var scopedClose = document.querySelector(elTarget + ' .modal-cookies-close')
						|| document.querySelector('.modal-cookies-close');
					if( scopedClose ) {
						scopedClose.addEventListener('click', function(e) {
							e.preventDefault();
							_closeMagnific();
							if( elCookies === 'true' ) {
								var cookieOps = {};
								if( elCookieExp ) cookieOps.expires = Number(elCookieExp);
								if( elCookiePath ) cookieOps.path = elCookiePath;
								__core.cookie.set(elTargetValue, '0', cookieOps);
							}
						});
					}

					if( elTimeout !== null && isFinite(elTimeout) ) {
						setTimeout(function() {
							_closeMagnific();
						}, totalDelay + elTimeout);
					}
				});
			});
		}
	};
}();
