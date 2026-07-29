CNVS.SliderMenuClass = function() {
	var __core = SEMICOLON.Core;
	var __base = SEMICOLON.Base;

	var _retryTimer;

	var _shouldRun = function() {
		var elHeader = __core.getVars.elHeader;
		var elBody = __core.getVars.elBody;
		if( !elHeader || !elBody ) return false;
		if( elHeader.classList.contains('ignore-slider') ) return false;
		if( elBody.classList.contains('is-expanded-menu') ) return true;
		if( elHeader.classList.contains('transparent-header-responsive') && !elBody.classList.contains('primary-menu-open') ) return true;
		return false;
	};

	var _swiper = function() {
		if( !_shouldRun() ) return;
		var slider = __core.getVars.elSlider;
		if( !slider ) return;
		_schemeChanger(slider.querySelector('.swiper-slide-active'), 'swiper');
	};

	var _revolution = function() {
		if( !_shouldRun() ) return;
		var slider = __core.getVars.elSlider;
		if( !slider ) return;
		_schemeChanger(slider.querySelector('.active-revslide'), 'revslider');
	};

	var _hasDarkInOldClasses = function() {
		var classes = __core.getVars.headerClasses;
		if( !classes ) return false;
		if( typeof classes === 'string' ) return classes.split(/\s+/).indexOf('dark') !== -1;
		if( typeof classes.length === 'number' ) {
			for( var i = 0; i < classes.length; i++ ) {
				if( classes[i] === 'dark' ) return true;
			}
		}
		return false;
	};

	var _schemeChanger = function(activeSlide, slider) {
		if( !activeSlide ) {
			_retryTimer = setTimeout( function() {
				if( slider === 'revslider' ) {
					_revolution();
				} else {
					_swiper();
				}
			}, 500);
			return;
		}

		clearTimeout(_retryTimer);

		var elHeader = __core.getVars.elHeader;
		var elBody = __core.getVars.elBody;
		var elHeaderWrap = __core.getVars.elHeaderWrap;
		if( !elHeader || !elBody ) return;

		var transparentHeader = document.querySelector('#header.transparent-header:not(.sticky-header,.semi-transparent,.floating-header)');
		var transparentHeaderAny = document.querySelector('#header.transparent-header:not(.semi-transparent,.floating-header)');
		var stickyTransparent = document.querySelector('#header.transparent-header.sticky-header,#header.transparent-header.semi-transparent.sticky-header,#header.transparent-header.floating-header.sticky-header');

		if( activeSlide.classList.contains('dark') ){
			if( transparentHeader ) {
				transparentHeader.classList.add('dark');
			}

			if( !_hasDarkInOldClasses() && stickyTransparent ) {
				stickyTransparent.classList.remove('dark');
			}

			if( elHeaderWrap ) elHeaderWrap.classList.remove('not-dark');
		} else {
			if( elBody.classList.contains('dark') ) {
				activeSlide.classList.add('not-dark');
				if( transparentHeaderAny ) transparentHeaderAny.classList.remove('dark');
				var headerWrap = transparentHeader ? transparentHeader.querySelector('#header-wrap') : null;
				if( headerWrap ) headerWrap.classList.add('not-dark');
			} else {
				if( transparentHeaderAny ) transparentHeaderAny.classList.remove('dark');
				if( elHeaderWrap ) elHeaderWrap.classList.remove('not-dark');
			}
		}

		if( elHeader.classList.contains('sticky-header') ) {
			__base.headers();
		}
	};

	return {
		init: function(selector) {
			selector = __core.getSelector( selector, false );
			if( !selector || selector.length < 1 ){
				return true;
			}

			var elBody = __core.getVars.elBody;
			var elHeader = __core.getVars.elHeader;
			if( !elBody || !elHeader ) return true;
			if( !elBody.classList.contains('is-expanded-menu') && !elHeader.classList.contains('transparent-header-responsive') ) {
				return true;
			}

			_swiper();
			_revolution();
			__base.setBSTheme();

			__core.getVars.resizers.slidermenuclass = function() {
				__base.sliderMenuClass();
			};
		}
	};
}();
