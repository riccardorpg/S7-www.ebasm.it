CNVS.Cookies = function() {
	var __core = SEMICOLON.Core;

	var _resetPage = function(btn) {
		if( !btn.closest('#gdpr-preferences') ) return false;
		setTimeout( function() {
			window.location.reload();
		}, 500);
	};

	var _hideCookieBar = function(cookieBar, elDirection, elSize) {
		if( !cookieBar ) return;
		cookieBar.style[elDirection] = elSize + 'px';
		cookieBar.style.opacity = 0;

		var onEnd = function() {
			cookieBar.style.display = 'none';
			cookieBar.style.pointerEvents = 'none';
			cookieBar.removeEventListener('transitionend', onEnd);
		};
		cookieBar.addEventListener('transitionend', onEnd);
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.initFunction({ class: 'has-plugin-cookie', event: 'pluginCookieReady' });

			selector = __core.getSelector( selector, false );
			if( selector.length < 1 ) return true;

			var cookieBar = document.querySelector('.gdpr-settings');
			var elSettings = document.querySelector('.gdpr-cookie-settings');
			if( !cookieBar && !elSettings ) return true;

			var elExpire = cookieBar?.getAttribute('data-expire') || 30;
			var elDelay = cookieBar?.getAttribute('data-delay') || 1500;
			var elPersist = cookieBar?.getAttribute('data-persistent');
			var elDirection = 'bottom';
			var elHeight = (cookieBar?.offsetHeight || 0) + 100;
			var elWidth = (cookieBar?.offsetWidth || 0) + 100;
			var elSize;
			var elSwitches = elSettings?.querySelectorAll('[data-cookie-name]');

			if( elPersist == 'true' ) {
				__core.cookie.set('__cnvs_cookies_accept', '');
				__core.cookie.remove('__cnvs_cookies_decline');
			}

			if( cookieBar ) {
				if( cookieBar.classList.contains('gdpr-settings-sm') && cookieBar.classList.contains('gdpr-settings-right') ) {
					elDirection = 'right';
				} else if( cookieBar.classList.contains('gdpr-settings-sm') ) {
					elDirection = 'left';
				}

				if( elDirection === 'left' ) {
					elSize = -elWidth;
					cookieBar.style.right = 'auto';
					cookieBar.style.marginLeft = '1rem';
				} else if( elDirection === 'right' ) {
					elSize = -elWidth;
					cookieBar.style.left = 'auto';
					cookieBar.style.marginRight = '1rem';
				} else {
					elSize = -elHeight;
				}

				cookieBar.style[elDirection] = elSize + 'px';

				if( __core.cookie.get('__cnvs_cookies_accept') != '1' ) {
					setTimeout( function() {
						cookieBar.style.display = 'block';
						cookieBar.style.pointerEvents = 'auto';
						cookieBar.style[elDirection] = 0;
						cookieBar.style.opacity = 1;
					}, Number(elDelay));
				}
			}

			var setAcceptance = function(accept) {
				__core.cookie.set('__cnvs_cookies_accept', accept ? '1' : '0', elExpire);
				__core.cookie.set('__cnvs_cookies_decline', accept ? '0' : '1', elExpire);
			};

			document.querySelectorAll('.gdpr-accept').forEach( function(btn) {
				btn.addEventListener('click', function(e) {
					e.preventDefault();
					_hideCookieBar(cookieBar, elDirection, elSize);
					setAcceptance(true);
					_resetPage(btn);
				});
			});

			document.querySelectorAll('.gdpr-decline').forEach( function(btn) {
				btn.addEventListener('click', function(e) {
					e.preventDefault();
					_hideCookieBar(cookieBar, elDirection, elSize);
					setAcceptance(false);
					_resetPage(btn);
				});
			});

			var acceptCookies = __core.cookie.get('__cnvs_cookies_accept');
			var declineCookies = __core.cookie.get('__cnvs_cookies_decline');
			var cookiesAllowed = acceptCookies !== '0' && declineCookies !== '1';

			elSwitches?.forEach( function(el) {
				var elCookie = '__cnvs_gdpr_' + el.getAttribute('data-cookie-name');
				var getCookie = __core.cookie.get(elCookie);
				el.checked = (getCookie === '1' && cookiesAllowed);
			});

			document.querySelectorAll('.gdpr-save-cookies').forEach( function(btn) {
				btn.addEventListener('click', function(e) {
					e.preventDefault();

					setAcceptance(true);

					elSwitches?.forEach( function(el) {
						var elCookie = '__cnvs_gdpr_' + el.getAttribute('data-cookie-name');
						if( el.checked ) {
							__core.cookie.set(elCookie, '1', elExpire);
						} else {
							__core.cookie.remove(elCookie, '');
						}
					});

					if( elSettings && elSettings.closest('.mfp-content') && typeof jQuery !== 'undefined' && jQuery.magnificPopup ) {
						jQuery.magnificPopup.close();
					}

					_resetPage(btn);
				});
			});

			document.querySelectorAll('.gdpr-container').forEach( function(element) {
				if( element.dataset.cnvsGdprProcessed === '1' ) return;

				var elCookie = '__cnvs_gdpr_' + element.getAttribute('data-cookie-name');
				var elContent = element.getAttribute('data-cookie-content');
				var elContentAjax = element.getAttribute('data-cookie-content-ajax');
				var getCookie = __core.cookie.get(elCookie);
				var allowed = (getCookie === '1' && cookiesAllowed);

				if( allowed ) {
					element.classList.add('gdpr-content-active');
					element.dataset.cnvsGdprProcessed = '1';

					if( elContentAjax ) {
						fetch(elContentAjax).then( function(response) {
							if( !response.ok ) throw new Error('HTTP ' + response.status);
							return response.text();
						}).then( function(html) {
							var domParser = new DOMParser();
							var parsedHTML = domParser.parseFromString(html, 'text/html');
							element.insertAdjacentHTML('beforeend', parsedHTML.body.innerHTML);
							__core.runContainerModules(element);
						}).catch( function(err) {
							console.log(err);
						});
					} else {
						if( elContent ) {
							element.insertAdjacentHTML('beforeend', elContent);
						}
						__core.runContainerModules(element);
					}
				} else {
					element.classList.add('gdpr-content-blocked');
				}
			});
		}
	};
}();
