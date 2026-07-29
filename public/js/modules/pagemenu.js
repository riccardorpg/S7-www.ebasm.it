CNVS.PageMenu = function() {
	var __core = SEMICOLON.Core;

	var _state = {
		scrollHandler: null,
		docClickHandler: null,
		isSticky: false,
		rafPending: false,
		resizeTimer: null,
	};

	var _applySticky = function(shouldStick) {
		var pageMenu = __core.getVars.elPageMenu;
		if( !pageMenu ) return;
		if( shouldStick === _state.isSticky ) return;
		_state.isSticky = shouldStick;
		if( shouldStick ) {
			pageMenu.classList.add('sticky-page-menu');
		} else {
			pageMenu.classList.remove('sticky-page-menu');
		}
	};

	var _stickyUpdate = function() {
		_state.rafPending = false;
		var pageMenu = __core.getVars.elPageMenu;
		if( !pageMenu ) return;
		var offset = __core.getVars.pageMenuOffset || 0;
		if( window.scrollY > offset ) {
			var bodyClasses = __core.getVars.elBody.classList;
			if( bodyClasses.contains('device-up-lg') ) {
				_applySticky(true);
			} else {
				_applySticky(pageMenu.getAttribute('data-mobile-sticky') === 'true');
			}
		} else {
			_applySticky(false);
		}
	};

	var _requestSticky = function() {
		if( _state.rafPending ) return;
		_state.rafPending = true;
		window.requestAnimationFrame(_stickyUpdate);
	};

	var _updateBreakpointClass = function() {
		var body = __core.getVars.elBody;
		if( !__core.getVars.elPageMenu ) return;
		var raw = body.getAttribute('data-pagemenu-breakpoint') || __core.getVars.menuBreakpoint;
		var bp = Number(raw) || 992;
		if( bp <= __core.viewport().width ) {
			body.classList.add('is-expanded-pagemenu');
		} else {
			body.classList.remove('is-expanded-pagemenu');
		}
	};

	return {
		init: function(selector) {
			selector = __core.getSelector( selector, false );
			if( selector.length < 1 ) return true;

			var pageMenu = __core.getVars.elPageMenu;
			if( !pageMenu ) return true;

			_updateBreakpointClass();

			var pageMenuWrap = pageMenu.querySelector('#page-menu-wrap');
			if( !pageMenuWrap ) return true;

			var pageMenuClone = pageMenu.querySelector('.page-menu-wrap-clone');
			if( !pageMenuClone ) {
				pageMenuClone = document.createElement('div');
				pageMenuClone.className = 'page-menu-wrap-clone';
				pageMenuWrap.parentNode.insertBefore(pageMenuClone, pageMenuWrap.nextSibling);
			}

			pageMenuClone.style.height = pageMenuWrap.offsetHeight + 'px';

			var trigger = pageMenu.querySelector('#page-menu-trigger');
			if( trigger ) {
				trigger.addEventListener('click', function(e) {
					e.preventDefault();
					__core.getVars.elBody.classList.remove('top-search-open');
					pageMenu.classList.toggle('page-menu-open');
				});
			}

			var nav = pageMenu.querySelector('nav');
			if( nav ) {
				nav.addEventListener('click', function() {
					__core.getVars.elBody.classList.remove('top-search-open');
					var topCart = document.getElementById('top-cart');
					topCart?.classList.remove('top-cart-open');
				});
			}

			if( _state.docClickHandler ) {
				document.removeEventListener('click', _state.docClickHandler, false);
			}
			_state.docClickHandler = function(e) {
				if( !e.target.closest('#page-menu') ) {
					pageMenu.classList.remove('page-menu-open');
				}
			};
			document.addEventListener('click', _state.docClickHandler, false);

			if( pageMenu.classList.contains('no-sticky') || pageMenu.classList.contains('dots-menu') ) {
				return true;
			}

			var headerHeight;
			var elHeader = __core.getVars.elHeader;
			if( elHeader.getAttribute('data-sticky-shrink') === 'false' ) {
				headerHeight = parseFloat(getComputedStyle(elHeader).getPropertyValue('--cnvs-header-height')) || 0;
			} else if( elHeader.classList.contains('no-sticky') || ( !__core.getVars.elBody.classList.contains('is-expanded-menu') && __core.getVars.mobileSticky !== 'true' ) ) {
				headerHeight = 0;
			} else {
				headerHeight = parseFloat(getComputedStyle(elHeader).getPropertyValue('--cnvs-header-height-shrink')) || 0;
			}

			pageMenu.style.setProperty('--cnvs-page-submenu-sticky-offset', headerHeight + 'px');

			var computeAndApply = function() {
				__core.getVars.pageMenuOffset = __core.offset(pageMenu).top - headerHeight;
				_stickyUpdate();
			};

			if( document.readyState === 'complete' ) {
				window.requestAnimationFrame(computeAndApply);
			} else {
				window.addEventListener('load', function() {
					window.requestAnimationFrame(computeAndApply);
				}, { once: true });
			}

			if( _state.scrollHandler ) {
				window.removeEventListener('scroll', _state.scrollHandler);
			}
			_state.scrollHandler = _requestSticky;
			window.addEventListener('scroll', _state.scrollHandler, { passive: true });

			__core.getVars.resizers.pagemenu = function() {
				clearTimeout(_state.resizeTimer);
				_state.resizeTimer = setTimeout( function() {
					_updateBreakpointClass();
					__core.getVars.pageMenuOffset = __core.offset(pageMenu).top - headerHeight;
					_stickyUpdate();
				}, 150);
			};
		}
	};
}();
