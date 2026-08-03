CNVS.SidePanel = function() {
	var __core = SEMICOLON.Core;

	var _state = {
		initialized: false,
		isOpen: false,
		panelEl: null,
		lastTrigger: null,
	};

	var _focusableSelector = 'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

	var _getFocusable = function() {
		if( !_state.panelEl ) return [];
		return Array.prototype.filter.call(
			_state.panelEl.querySelectorAll(_focusableSelector),
			function(el) { return !el.hasAttribute('disabled') && el.offsetParent !== null; }
		);
	};

	var _syncAria = function() {
		if( _state.panelEl ) {
			_state.panelEl.setAttribute('aria-hidden', _state.isOpen ? 'false' : 'true');
		}
		document.querySelectorAll('.side-panel-trigger').forEach(function(el) {
			el.setAttribute('aria-expanded', _state.isOpen ? 'true' : 'false');
		});
	};

	var _open = function(triggerEl) {
		if( _state.isOpen ) return;
		_state.isOpen = true;
		_state.lastTrigger = triggerEl || document.activeElement;

		var body = __core.getVars.elBody.classList;
		body.add('side-panel-open');
		if( body.contains('device-touch') && body.contains('side-push-panel') ) {
			body.add('ohidden');
		}

		_syncAria();

		var focusable = _getFocusable();
		if( focusable.length ) {
			focusable[0].focus();
		} else if( _state.panelEl ) {
			if( !_state.panelEl.hasAttribute('tabindex') ) {
				_state.panelEl.setAttribute('tabindex', '-1');
			}
			_state.panelEl.focus();
		}
	};

	var _close = function() {
		if( !_state.isOpen ) return;
		_state.isOpen = false;

		var body = __core.getVars.elBody.classList;
		body.remove('side-panel-open');
		if( body.contains('device-touch') && body.contains('side-push-panel') ) {
			body.remove('ohidden');
		}

		_syncAria();

		if( _state.lastTrigger && typeof _state.lastTrigger.focus === 'function' ) {
			_state.lastTrigger.focus();
		}
		_state.lastTrigger = null;
	};

	var _onDocumentClick = function(e) {
		if( !_state.isOpen ) return;
		if( e.target.closest('#side-panel') || e.target.closest('.side-panel-trigger') ) return;
		_close();
	};

	var _onKeyDown = function(e) {
		if( !_state.isOpen ) return;
		if( e.key === 'Escape' || e.keyCode === 27 ) {
			e.preventDefault();
			_close();
			return;
		}
		if( e.key === 'Tab' || e.keyCode === 9 ) {
			var focusable = _getFocusable();
			if( !focusable.length ) return;
			var first = focusable[0];
			var last = focusable[focusable.length - 1];
			if( e.shiftKey && document.activeElement === first ) {
				e.preventDefault();
				last.focus();
			} else if( !e.shiftKey && document.activeElement === last ) {
				e.preventDefault();
				first.focus();
			}
		}
	};

	var _onTriggerClick = function(e) {
		e.preventDefault();
		if( _state.isOpen ) {
			_close();
		} else {
			_open(e.currentTarget);
		}
	};

	return {
		init: function(selector) {
			selector = __core.getSelector( selector, false );
			if( selector.length < 1 ) return true;

			_state.panelEl = document.getElementById('side-panel');

			document.querySelectorAll('.side-panel-trigger').forEach(function(el) {
				el.removeEventListener('click', _onTriggerClick);
				el.addEventListener('click', _onTriggerClick);
				if( !el.hasAttribute('aria-controls') && _state.panelEl && _state.panelEl.id ) {
					el.setAttribute('aria-controls', _state.panelEl.id);
				}
			});

			_syncAria();

			if( _state.initialized ) return;
			_state.initialized = true;

			document.addEventListener('click', _onDocumentClick, false);
			document.addEventListener('keydown', _onKeyDown, false);
		}
	};
}();
