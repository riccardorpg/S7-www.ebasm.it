CNVS.ScrollDetect = function() {
	var __core = SEMICOLON.Core;

	var _detects = [];
	var _resizeObserver = null;
	var _scrollBound = false;
	var _scrollTicking = false;
	var _currentSelector = null;

	var _percent = function(params) {
		fastdom.measure( function(){
			var percent = 0, ratio = 0, start = 0, end = 0;
			var position = window.scrollY;

			if( position >= params.start && position <= params.end ) {
				var startViewScroll = position - params.start;
				var offsetScroll = position - params.offset;
				percent = (startViewScroll / params.range.full) * 100;
				start = (startViewScroll / params.range.start);

				if( position > (params.start + params.height) && position < params.offset ) {
					start = 1;
					end = 0;
				} else if( position >= params.offset ) {
					start = 1;
					end = (offsetScroll / params.range.end);
				} else {
					end = 0;
				}

				ratio = start - end;
			} else if( position > params.end ) {
				percent = 100;
				ratio = 0;
				start = end = 1;
			} else {
				percent = ratio = start = end = 0;
			}

			params.elem.classList.toggle('scroll-detect-inview', ratio > 0);
			params.elem.classList.toggle('scroll-detect-inview-start', start > 0 && start < 1);
			params.elem.classList.toggle('scroll-detect-inview-end', end > 0 && end < 1);

			params.elem.style.setProperty('--cnvs-scroll-percent', percent);
			params.elem.style.setProperty('--cnvs-scroll-ratio', ratio);
			params.elem.style.setProperty('--cnvs-scroll-start', start);
			params.elem.style.setProperty('--cnvs-scroll-end', end);
		});
	};

	var _handle = function() {
		_detects.forEach(_percent);
	};

	var _onScroll = function() {
		if( _scrollTicking ) return;
		_scrollTicking = true;
		window.requestAnimationFrame( function(){
			fastdom.mutate(_handle);
			_scrollTicking = false;
		});
	};

	var _initParams = function(selector) {
		_detects = [];

		selector.forEach( function(elem) {
			var elemWidth     = elem.offsetWidth,
				elemHeight    = elem.offsetHeight,
				elemOffset    = __core.offset(elem).top,
				viewportHeight = __core.getVars.viewport.height,
				includeWidth  = elem.getAttribute('data-include-width'),
				includeHeight = elem.getAttribute('data-include-height'),
				includeOffset = elem.getAttribute('data-include-offset'),
				scrollOffset  = elem.getAttribute('data-scroll-offset'),
				parallaxRatio = elem.getAttribute('data-parallax-ratio');

			if( scrollOffset ) {
				var parts = scrollOffset.split('%');
				if( parts.length > 1 ) {
					var pct = parseFloat(parts[0]);
					if( isFinite(pct) ) elemOffset += (viewportHeight * pct * 0.01);
				} else if( parts[0] ) {
					var px = parseFloat(parts[0]);
					if( isFinite(px) ) elemOffset += px;
				}
			}

			var scrollStart = elemOffset - viewportHeight,
				scrollEnd = elemOffset + elemHeight,
				scrollRange = scrollEnd - scrollStart;

			var params = {
				elem: elem,
				start: scrollStart,
				end: scrollEnd,
				range: { start: elemHeight, end: elemHeight, full: scrollRange },
				width: elemWidth,
				height: elemHeight,
				offset: elemOffset
			};

			if( includeWidth === 'true' || (elem.classList.contains('parallax') && elem.getAttribute('data-parallax-direction') === 'horizontal') ) {
				elem.style.setProperty('--cnvs-scroll-width', params.width);
			}

			if( includeHeight === 'true' || (elem.classList.contains('parallax') && elem.getAttribute('data-parallax-direction') !== 'horizontal') ) {
				elem.style.setProperty('--cnvs-scroll-height', params.height);
			}

			if( includeOffset === 'true' ) {
				elem.style.setProperty('--cnvs-scroll-offset', params.offset);
			}

			if( parallaxRatio !== null && parallaxRatio !== '' ) {
				var ratioNum = parseFloat(parallaxRatio);
				if( isFinite(ratioNum) ) elem.style.setProperty('--cnvs-parallax-ratio', ratioNum);
			}

			_percent(params);
			_detects.push(params);

			if( _resizeObserver && __core.markOnce(elem, 'cnvsScrolldetectObserved') ) {
				_resizeObserver.observe(elem);
			}
		});
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.requirePlugin({
				file: 'plugins.fastdom.js',
				id: 'canvas-fastdom-js',
				check: function() { return typeof fastdom !== 'undefined'; },
				class: 'has-plugin-scrolldetect',
				event: 'pluginScrollDetectReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector, false );
				if( !selector || selector.length < 1 ) return;

				_currentSelector = selector;

				if( !_resizeObserver ) {
					var debouncedReinit = __core.debounce(function() {
						if( _currentSelector ) _initParams(_currentSelector);
					}, 333);
					_resizeObserver = new ResizeObserver(debouncedReinit);
					_resizeObserver.observe(document.documentElement);
				}

				_initParams(selector);
				_handle();

				if( !_scrollBound ) {
					window.addEventListener('scroll', _onScroll, { passive: true });
					_scrollBound = true;
				}
			});
		}
	};
}();
