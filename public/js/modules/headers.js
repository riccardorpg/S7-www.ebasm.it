CNVS.Headers = function() {
	var __core = SEMICOLON.Core;
	var __base = SEMICOLON.Base;
	var __modules = SEMICOLON.Modules;

	var _state = {
		isSticky: false,
		isShrunk: false,
		menuClassApplied: null,
		rafPending: false,
		resizeTimer: null,
	};

	var _offset = function() {
		var elHeader = __core.getVars.elHeader;
		var elHeaderInc = document.querySelector('.include-header');

		__core.getVars.headerOffset = elHeader.offsetTop;
		if( __core.getVars.elHeader?.classList.contains('floating-header') || elHeaderInc?.classList.contains('include-topbar') ) {
			__core.getVars.headerOffset = __core.offset(elHeader).top;
		}
		__core.getVars.elHeaderWrap?.classList.add('position-absolute');
		__core.getVars.headerWrapOffset = __core.getVars.headerOffset + __core.getVars.elHeaderWrap?.offsetTop;
		__core.getVars.elHeaderWrap?.classList.remove('position-absolute');

		if( elHeader.hasAttribute('data-sticky-offset') ) {
			var headerDefinedOffset = elHeader.getAttribute('data-sticky-offset');
			if( headerDefinedOffset == 'full' ) {
				__core.getVars.headerWrapOffset = __core.viewport().height;
				var headerOffsetNegative = elHeader.getAttribute('data-sticky-offset-negative');
				if( typeof headerOffsetNegative !== 'undefined' && headerOffsetNegative !== null ) {
					if( headerOffsetNegative == 'auto' ) {
						__core.getVars.headerWrapOffset = __core.getVars.headerWrapOffset - elHeader.offsetHeight - 1;
					} else {
						__core.getVars.headerWrapOffset = __core.getVars.headerWrapOffset - Number(headerOffsetNegative) - 1;
					}
				}
			} else {
				__core.getVars.headerWrapOffset = Number(headerDefinedOffset);
			}
		}
	};

	var _applyMenuClass = function(type) {
		if( _state.menuClassApplied === type ) return;

		var newClassesArray = '';

		if( type === 'responsive' ) {
			if( __core.getVars.elBody.classList.contains('is-expanded-menu') ) return;
			if( __core.getVars.mobileHeaderClasses ) {
				newClassesArray = __core.getVars.mobileHeaderClasses.split(/ +/);
			}
		} else {
			if( !__core.getVars.elHeader.classList.contains('sticky-header') ) return;
			if( __core.getVars.stickyHeaderClasses ) {
				newClassesArray = __core.getVars.stickyHeaderClasses.split(/ +/);
			}
		}

		_state.menuClassApplied = type;

		if( !newClassesArray.length ) {
			__base.setBSTheme();
			return;
		}

		var elHeader = __core.getVars.elHeader;
		var elHeaderWrap = __core.getVars.elHeaderWrap;

		for( var i = 0, len = newClassesArray.length; i < len; i++ ) {
			var cls = newClassesArray[i];
			if( cls === 'not-dark' ) {
				elHeader.classList.remove('dark');
				if( elHeaderWrap && !elHeaderWrap.classList.contains('not-dark') ) {
					elHeaderWrap.classList.add('not-dark');
				}
			} else if( cls === 'dark' ) {
				elHeaderWrap?.classList.remove('not-dark', 'force-not-dark');
				if( !elHeader.classList.contains(cls) ) {
					elHeader.classList.add(cls);
				}
			} else if( !elHeader.classList.contains(cls) ) {
				elHeader.classList.add(cls);
			}
		}

		__base.setBSTheme();
	};

	var _enterSticky = function() {
		if( _state.isSticky ) return;
		_state.isSticky = true;
		__core.getVars.elHeader.classList.add('sticky-header');
		_applyMenuClass('sticky');
	};

	var _resetHeader = function() {
		_state.isSticky = false;
		_state.isShrunk = false;

		__core.getVars.elHeader.className = __core.getVars.headerClasses;
		__core.getVars.elHeader.classList.remove('sticky-header', 'sticky-header-shrink');

		if( __core.getVars.elHeaderWrap ) {
			__core.getVars.elHeaderWrap.className = __core.getVars.headerWrapClasses;
		}
		if( !__core.getVars.elHeaderWrap?.classList.contains('force-not-dark') ) {
			__core.getVars.elHeaderWrap?.classList.remove('not-dark');
		}

		_state.menuClassApplied = null;
		__base.sliderMenuClass();
	};

	var _exitSticky = function() {
		if( !_state.isSticky && _state.menuClassApplied !== 'sticky' ) return;
		_resetHeader();

		if( __core.getVars.mobileSticky == 'true' ) {
			_applyMenuClass('responsive');
		}
	};

	var _setShrunk = function(shouldShrink) {
		if( _state.isShrunk === shouldShrink ) return;
		_state.isShrunk = shouldShrink;
		if( shouldShrink ) {
			__core.getVars.elHeader.classList.add('sticky-header-shrink');
		} else {
			__core.getVars.elHeader.classList.remove('sticky-header-shrink');
		}
	};

	var _stickyUpdate = function() {
		_state.rafPending = false;

		if( !__core.getVars.elBody.classList.contains('is-expanded-menu') && __core.getVars.mobileSticky != 'true' ) {
			return;
		}

		var stickyOffset = __core.getVars.headerWrapOffset;
		var scrollY = window.scrollY;

		if( scrollY > stickyOffset ) {
			if( __core.getVars.elBody.classList.contains('side-header') ) return;

			_enterSticky();

			if( __core.getVars.elBody.classList.contains('is-expanded-menu')
				&& __core.getVars.stickyShrink == 'true'
				&& !__core.getVars.elHeader.classList.contains('no-sticky') ) {
				_setShrunk( (scrollY - stickyOffset) > Number(__core.getVars.stickyShrinkOffset) );
			}
		} else {
			_exitSticky();
		}
	};

	var _requestSticky = function() {
		if( _state.rafPending ) return;
		_state.rafPending = true;
		window.requestAnimationFrame(_stickyUpdate);
	};

	var _includeHeader = function() {
		var elHeaderInc = document.querySelector('.include-header');
		var elHeader = __core.getVars.elHeader;
		__core.getVars.headerHeight = elHeader.offsetHeight;

		if( !elHeaderInc ) return true;

		elHeaderInc.style.marginTop = '';

		if( !__core.getVars.elBody.classList.contains('is-expanded-menu') && !elHeader.classList.contains('transparent-header-responsive') ) {
			return true;
		}

		if( elHeader.classList.contains('floating-header') || elHeaderInc.classList.contains('include-topbar') ) {
			__core.getVars.headerHeight = elHeader.offsetHeight + __core.offset(elHeader).top;
		}

		elHeaderInc.style.marginTop = (__core.getVars.headerHeight * -1) + 'px';
		__modules.sliderParallax();
	};

	var _sideHeader = function() {
		var headerTrigger = document.getElementById("header-trigger");
		if( headerTrigger ) {
			headerTrigger.onclick = function(e) {
				e.preventDefault();
				__core.getVars.elBody.classList.contains('open-header') && __core.getVars.elBody.classList.toggle("side-header-open");
			};
		}
	};

	return {
		init: function(selector) {
			selector = __core.getSelector( selector, false );
			if( selector.length < 1 ) return true;

			var elHeader = __core.getVars.elHeader;
			var isSticky = !elHeader.classList.contains('no-sticky');
			var headerWrapClone = elHeader.querySelector('.header-wrap-clone');

			__core.getVars.stickyHeaderClasses = elHeader.getAttribute('data-sticky-class');
			__core.getVars.mobileHeaderClasses = elHeader.getAttribute('data-responsive-class');
			__core.getVars.stickyShrink = elHeader.getAttribute('data-sticky-shrink') || 'true';
			__core.getVars.stickyShrinkOffset = elHeader.getAttribute('data-sticky-shrink-offset') || 300;
			__core.getVars.mobileSticky = elHeader.getAttribute('data-mobile-sticky') || 'false';
			__core.getVars.headerHeight = elHeader.offsetHeight;

			if( !headerWrapClone ) {
				headerWrapClone = document.createElement('div');
				headerWrapClone.classList = 'header-wrap-clone';
				__core.getVars.elHeaderWrap?.parentNode.insertBefore( headerWrapClone, __core.getVars.elHeaderWrap?.nextSibling);
			}

			if( isSticky ) {
				var initSticky = function() {
					_offset();
					_stickyUpdate();
				};
				if( document.readyState === 'complete' ) {
					window.requestAnimationFrame(initSticky);
				} else {
					window.addEventListener('load', function() {
						window.requestAnimationFrame(initSticky);
					}, { once: true });
				}

				window.addEventListener('scroll', _requestSticky, { passive: true });
			}

			_applyMenuClass('responsive');
			_includeHeader();
			_sideHeader();

			__core.getVars.resizers.headers = function() {
				clearTimeout(_state.resizeTimer);
				_state.resizeTimer = setTimeout( function() {
					_resetHeader();
					if( isSticky ) {
						_offset();
						_stickyUpdate();
					}
					_applyMenuClass('responsive');
					_includeHeader();
				}, 150);
			};
		}
	};
}();
