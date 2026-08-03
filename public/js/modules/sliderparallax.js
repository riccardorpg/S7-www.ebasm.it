CNVS.SliderParallax = function() {
	var __core = SEMICOLON.Core;
	var __mobile = SEMICOLON.Mobile;

	var _settings;
	var _cache = {
		height: 0,
		hasInner: false,
		fadeEls: null,
		lastTransformEl: 0,
		lastTransformCaption: 0,
		lastVisible: null,
		rafPending: false,
	};

	var _measureHeight = function() {
		if( _settings && _settings.sliderPx && _settings.sliderPx.el ) {
			_cache.height = _settings.sliderPx.el.offsetHeight;
		}
	};

	var _setParallax = function(yPos, el, lastKey) {
		if( !el ) return;
		if( _cache[lastKey] === yPos ) return;
		_cache[lastKey] = yPos;
		el.style.transform = 'translate3d(0,' + yPos + 'px,0)';
	};

	var _setVisibility = function(visible) {
		if( _cache.lastVisible === visible ) return;
		_cache.lastVisible = visible;
		if( visible ) {
			_settings.classes.add('slider-parallax-visible');
			_settings.classes.remove('slider-parallax-invisible');
		} else {
			_settings.classes.add('slider-parallax-invisible');
			_settings.classes.remove('slider-parallax-visible');
		}
	};

	var _update = function() {
		_cache.rafPending = false;

		if( !_settings || !_settings.sliderPx.el ) return;

		var sliderPx = _settings.sliderPx;
		var scrollY = window.scrollY;
		_settings.scrollPos.y = scrollY;

		var isExpandedMenu = _settings.body.classList.contains('is-expanded-menu');

		if( isExpandedMenu && !_settings.isMobile ) {
			var inViewport = ( _cache.height + sliderPx.offset + 50 ) > scrollY;

			if( inViewport ) {
				_setVisibility(true);

				if( scrollY > sliderPx.offset ) {
					var delta = scrollY - sliderPx.offset;
					var t1, t2, targetEl;

					if( _cache.hasInner ) {
						t1 = delta * -0.4;
						t2 = delta * -0.15;
						targetEl = sliderPx.inner;
					} else {
						t1 = delta / 1.5;
						t2 = delta / 7;
						targetEl = sliderPx.el;
					}

					_setParallax(t1, targetEl, 'lastTransformEl');
					_setParallax(t2, sliderPx.caption, 'lastTransformCaption');
				} else {
					_setParallax(0, _cache.hasInner ? sliderPx.inner : sliderPx.el, 'lastTransformEl');
					_setParallax(0, sliderPx.caption, 'lastTransformCaption');
				}
			} else {
				_setVisibility(false);
			}
		} else {
			_setParallax(0, _cache.hasInner ? sliderPx.inner : sliderPx.el, 'lastTransformEl');
			_setParallax(0, sliderPx.caption, 'lastTransformCaption');
			_setVisibility(true);
		}

		if( _cache.fadeEls && _cache.fadeEls.length ) {
			if( isExpandedMenu && !_settings.isMobile ) {
				if( _cache.lastVisible ) {
					var headerEl = _settings.header;
					var headerOffset = ( (headerEl && headerEl.classList.contains('transparent-header')) || _settings.body.classList.contains('side-header') ) ? 100 : 0;
					var opacity = 1 - ( ( ( scrollY - headerOffset ) * 1.85 ) / _cache.height );
					if( opacity < 0 ) opacity = 0;
					else if( opacity > 1 ) opacity = 1;

					for( var i = 0, len = _cache.fadeEls.length; i < len; i++ ) {
						_cache.fadeEls[i].style.opacity = opacity;
					}
				}
			} else {
				for( var j = 0, jlen = _cache.fadeEls.length; j < jlen; j++ ) {
					_cache.fadeEls[j].style.opacity = 1;
				}
			}
		}
	};

	var _requestUpdate = function() {
		if( _cache.rafPending ) return;
		_cache.rafPending = true;
		window.requestAnimationFrame(_update);
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.requirePlugin({
				file: 'plugins.fastdom.js',
				id: 'canvas-fastdom-js',
				check: function() { return typeof fastdom !== 'undefined'; }
			}).then( function(ready) {
				if( !ready ) return;

				_settings = {
					sliderPx: __core.getVars.sliderParallax,
					body: __core.getVars.elBody,
					header: __core.getVars.elHeader,
					scrollPos: __core.getVars.scrollPos,
					isMobile: __mobile.any(),
					get classes() {
						return this.sliderPx.el.classList;
					},
				};

				if( !_settings.sliderPx.el ) return;

				_cache.hasInner = !!_settings.sliderPx.el.querySelector('.slider-inner');
				_cache.fadeEls = _settings.sliderPx.el.querySelectorAll(
					'.slider-arrow-left,.slider-arrow-right,.slider-caption,.slider-element-fade'
				);
				_measureHeight();

				var initTarget = _cache.hasInner ? _settings.sliderPx.inner : _settings.sliderPx.el;
				_setParallax(0, initTarget, 'lastTransformEl');
				_setParallax(0, _settings.sliderPx.caption, 'lastTransformCaption');

				window.addEventListener('scroll', _requestUpdate, { passive: true });

				__core.getVars.resizers.sliderparallax = function() {
					_measureHeight();
					_requestUpdate();
				};
			});
		}
	};
}();
