CNVS.Cursor = function() {
	var __core = SEMICOLON.Core;

	var _state = {
		initialized: false,
		cursor: null,
		rafPending: false,
		pendingX: 0,
		pendingY: 0,
		mouseMoveHandler: null,
		actionEnterHandler: null,
		actionLeaveHandler: null,
		disableEnterHandler: null,
		disableLeaveHandler: null,
	};

	var _addCursorEl = function(className, parent) {
		var el = document.createElement('div');
		el.classList.add(className);
		parent.prepend(el);
		return el;
	};

	var _onMouseMoveRaf = function() {
		_state.rafPending = false;
		if( !_state.cursor ) return;
		_state.cursor.style.transform = 'translate3d(' + _state.pendingX + 'px,' + _state.pendingY + 'px,0)';
	};

	return {
		init: function(selector) {
			__core.initFunction({ class: 'has-plugin-cursor', event: 'pluginCursorReady' });

			var hasFinePointer = !window.matchMedia || window.matchMedia('(pointer: fine)').matches;
			if( !hasFinePointer ) return;

			var cursor = document.querySelector('.cnvs-cursor');
			if( !cursor ) {
				cursor = _addCursorEl('cnvs-cursor', __core.getVars.elWrapper);
			}
			if( !cursor.querySelector('.cnvs-cursor-follower') ) {
				_addCursorEl('cnvs-cursor-follower', cursor);
			}
			if( !cursor.querySelector('.cnvs-cursor-dot') ) {
				_addCursorEl('cnvs-cursor-dot', cursor);
			}
			_state.cursor = cursor;

			if( _state.initialized ) return;
			_state.initialized = true;

			_state.mouseMoveHandler = function(event) {
				_state.pendingX = event.clientX;
				_state.pendingY = event.clientY;
				if( _state.rafPending ) return;
				_state.rafPending = true;
				window.requestAnimationFrame(_onMouseMoveRaf);
			};
			document.addEventListener('mousemove', _state.mouseMoveHandler, { passive: true });

			_state.actionEnterHandler = function(e) {
				if( e.target.closest('a,button') && !e.target.closest('.cursor-disable') ) {
					cursor.classList.add('cnvs-cursor-action');
				}
			};
			_state.actionLeaveHandler = function(e) {
				if( e.target.closest('a,button') ) {
					cursor.classList.remove('cnvs-cursor-action');
				}
			};
			document.addEventListener('mouseover', _state.actionEnterHandler);
			document.addEventListener('mouseout', _state.actionLeaveHandler);

			_state.disableEnterHandler = function(e) {
				if( e.target.closest('.cursor-disable') ) {
					cursor.classList.add('cnvs-cursor-disabled');
				}
			};
			_state.disableLeaveHandler = function(e) {
				if( e.target.closest('.cursor-disable') ) {
					cursor.classList.remove('cnvs-cursor-disabled');
				}
			};
			document.addEventListener('mouseover', _state.disableEnterHandler);
			document.addEventListener('mouseout', _state.disableLeaveHandler);
		}
	};
}();
