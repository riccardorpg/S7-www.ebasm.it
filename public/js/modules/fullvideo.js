CNVS.FullVideo = function() {
	var __core = SEMICOLON.Core;

	var _state = new WeakMap();
	var _observer = null;
	var _reducedMotionMQ = null;
	var _supportsObjectFit = (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('object-fit', 'cover'));

	var _parseRatio = function(str) {
		if( !str ) return [16, 9];
		var parts = String(str).split(/[\/:x]/);
		var w = Number(parts[0]);
		var h = Number(parts[1]);
		if( !w || !h || !isFinite(w) || !isFinite(h) ) return [16, 9];
		return [w, h];
	};

	var _ensureAutoplayAttrs = function(video) {
		if( !video.hasAttribute('muted') ) {
			video.setAttribute('muted', '');
			video.muted = true;
		}
		if( !video.hasAttribute('playsinline') ) video.setAttribute('playsinline', '');
		if( !video.hasAttribute('webkit-playsinline') ) video.setAttribute('webkit-playsinline', '');
	};

	var _applyCoverCSS = function(video) {
		video.style.position = video.style.position || 'absolute';
		video.style.top = '0';
		video.style.left = '0';
		video.style.width = '100%';
		video.style.height = '100%';
		video.style.objectFit = 'cover';
	};

	var _applyJSLayout = function(element, state) {
		var video = state.video;
		var divWidth = element.offsetWidth;
		var divHeight = element.offsetHeight;
		if( divWidth === 0 || divHeight === 0 ) return;

		var ratioW = state.ratio[0];
		var ratioH = state.ratio[1];

		var elWidth = (ratioW * divHeight) / ratioH;
		var elHeight = divHeight;

		if( elWidth < divWidth ) {
			elWidth = divWidth;
			elHeight = (ratioH * divWidth) / ratioW;
		}

		video.style.width = elWidth + 'px';
		video.style.height = elHeight + 'px';
		video.style.left = (elWidth > divWidth ? -((elWidth - divWidth) / 2) : 0) + 'px';
		video.style.top = (elHeight > divHeight ? -((elHeight - divHeight) / 2) : 0) + 'px';
	};

	var _layout = function(element, state) {
		if( !state || !state.video ) return;
		if( _supportsObjectFit ) {
			_applyCoverCSS(state.video);
		} else {
			_applyJSLayout(element, state);
		}
	};

	var _syncPlaceholder = function(element, state) {
		var isMobile = SEMICOLON.Mobile && SEMICOLON.Mobile.any();
		var allowPlaceholder = !element.classList.contains('no-placeholder');

		if( isMobile && allowPlaceholder ) {
			if( state.placeholderEl ) return;
			var src = state.video.getAttribute('poster') || state.video.getAttribute('data-poster');
			if( !src ) return;
			var ph = document.createElement('div');
			ph.className = 'video-placeholder';
			ph.style.backgroundImage = 'url(' + src + ')';
			element.appendChild(ph);
			state.placeholderEl = ph;
			state.video.classList.add('d-none');
			try { state.video.pause(); } catch(e) {}
		} else {
			if( !state.placeholderEl ) return;
			state.placeholderEl.remove();
			state.placeholderEl = null;
			state.video.classList.remove('d-none');
			try { state.video.play(); } catch(e) {}
		}
	};

	var _applyReducedMotion = function(state) {
		if( !_reducedMotionMQ || !_reducedMotionMQ.matches ) return;
		try { state.video.pause(); } catch(e) {}
	};

	var _initElement = function(element) {
		if( _state.has(element) ) return;
		var video = element.querySelector('video');
		if( !video ) return;

		_ensureAutoplayAttrs(video);

		var state = {
			video: video,
			ratio: _parseRatio(element.getAttribute('data-ratio')),
			placeholderEl: null,
		};
		_state.set(element, state);

		var onReady = function() {
			_layout(element, state);
			video.removeEventListener('loadedmetadata', onReady);
		};
		if( video.readyState >= 1 ) {
			_layout(element, state);
		} else {
			video.addEventListener('loadedmetadata', onReady);
		}

		_syncPlaceholder(element, state);
		_applyReducedMotion(state);

		if( _observer ) _observer.observe(element);
	};

	var _handleMotionChange = function(list) {
		list.forEach(function(el) {
			var state = _state.get(el);
			if( state ) _applyReducedMotion(state);
		});
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ) return true;

			__core.initFunction({ class: 'has-plugin-html5video', event: 'pluginHtml5VideoReady' });

			selector = __core.getSelector(selector, false, false);
			if( selector.length < 1 ) return true;

			if( !_observer && 'ResizeObserver' in window ) {
				_observer = new ResizeObserver(function(entries) {
					for( var i = 0, len = entries.length; i < len; i++ ) {
						var el = entries[i].target;
						var state = _state.get(el);
						if( state ) _layout(el, state);
					}
				});
			}

			if( !_reducedMotionMQ && window.matchMedia ) {
				_reducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
				_reducedMotionMQ.addEventListener('change', function() {
					_handleMotionChange(selector);
				});
			}

			selector.forEach(_initElement);

			__core.getVars.resizers.html5video = function() {
				selector.forEach(function(el) {
					var state = _state.get(el);
					if( !state ) return;
					_layout(el, state);
					_syncPlaceholder(el, state);
				});
			};
		}
	};
}();
