CNVS.GoToTop = function() {
	var __core = SEMICOLON.Core;

	var _state = {
		element: null,
		speed: 700,
		easing: null,
		mobile: false,
		offset: 450,
		isActive: false,
		rafPending: false,
		clickHandler: null,
		scrollHandler: null,
	};

	var _evalMobileDisabled = function() {
		if( _state.mobile ) return false;
		var body = __core.getVars.elBody.classList;
		return body.contains('device-xs') || body.contains('device-sm') || body.contains('device-md');
	};

	var _update = function() {
		_state.rafPending = false;

		if( _evalMobileDisabled() ) {
			if( _state.isActive ) {
				__core.getVars.elBody.classList.remove('gototop-active');
				_state.isActive = false;
			}
			return;
		}

		var shouldBeActive = window.scrollY > _state.offset;
		if( shouldBeActive === _state.isActive ) return;
		_state.isActive = shouldBeActive;

		if( shouldBeActive ) {
			__core.getVars.elBody.classList.add('gototop-active');
		} else {
			__core.getVars.elBody.classList.remove('gototop-active');
		}
	};

	var _requestUpdate = function() {
		if( _state.rafPending ) return;
		_state.rafPending = true;
		window.requestAnimationFrame(_update);
	};

	return {
		init: function(selector) {
			selector = __core.getSelector( selector, false );
			if( selector.length < 1 ) return true;

			var el = selector[0];
			_state.element = el;
			_state.speed = Number(el.getAttribute('data-speed')) || 700;
			_state.easing = el.getAttribute('data-easing');
			_state.mobile = el.getAttribute('data-mobile') === 'true';
			_state.offset = Number(el.getAttribute('data-offset')) || 450;

			if( _state.clickHandler ) {
				el.removeEventListener('click', _state.clickHandler);
			}
			_state.clickHandler = function(e) {
				e.preventDefault();
				__core.scrollTo(0, _state.speed, _state.easing);
			};
			el.addEventListener('click', _state.clickHandler);

			if( !_state.scrollHandler ) {
				_state.scrollHandler = _requestUpdate;
				window.addEventListener('scroll', _state.scrollHandler, { passive: true });
			}

			_update();
		}
	};
}();
