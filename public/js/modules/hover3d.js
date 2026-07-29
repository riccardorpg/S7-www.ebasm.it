CNVS.Hover3D = function() {
	var __core = SEMICOLON.Core;

	var _bindings = new WeakMap();

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.initFunction({ class: 'has-plugin-hover3d', event: 'pluginHover3DReady' });

			selector = __core.getSelector( selector, false );
			if( selector.length < 1 ) return true;

			var hasFinePointer = !window.matchMedia || window.matchMedia('(pointer: fine)').matches;
			if( !hasFinePointer ) return;

			selector.forEach( function(el) {
				var prev = _bindings.get(el);
				if( prev ) {
					el.removeEventListener('mousemove', prev.move);
					el.removeEventListener('mouseleave', prev.leave);
					el.removeEventListener('mousedown', prev.down);
					el.removeEventListener('mouseup', prev.up);
					if( prev.state.rafId !== null ) cancelAnimationFrame(prev.state.rafId);
				}

				var state = { pendingX: 0, pendingY: 0, rafId: null };

				var cancelPending = function() {
					if( state.rafId !== null ) {
						cancelAnimationFrame(state.rafId);
						state.rafId = null;
					}
				};

				var apply = function() {
					state.rafId = null;
					var width  = el.clientWidth;
					var height = el.clientHeight;
					if( !width || !height ) return;
					var yRotation =  20 * ((state.pendingX - width  / 2) / width);
					var xRotation = -20 * ((state.pendingY - height / 2) / height);
					el.style.transform = 'perspective(500px) scale(1.1) rotateX(' + xRotation + 'deg) rotateY(' + yRotation + 'deg) rotateZ(0)';
				};

				var moveHandler = function(e) {
					state.pendingX = typeof e.offsetX === 'number' ? e.offsetX : e.layerX;
					state.pendingY = typeof e.offsetY === 'number' ? e.offsetY : e.layerY;
					if( state.rafId !== null ) return;
					state.rafId = window.requestAnimationFrame(apply);
				};
				var leaveHandler = function() {
					cancelPending();
					el.style.transform = 'perspective(500px) scale(1) rotateX(0) rotateY(0) rotateZ(0)';
				};
				var downHandler = function() {
					cancelPending();
					el.style.transform = 'perspective(500px) scale(0.9) rotateX(0) rotateY(0) rotateZ(0)';
				};
				var upHandler = function() {
					cancelPending();
					el.style.transform = 'perspective(500px) scale(1.1) rotateX(0) rotateY(0) rotateZ(0)';
				};

				el.addEventListener('mousemove', moveHandler, { passive: true });
				el.addEventListener('mouseleave', leaveHandler);
				el.addEventListener('mousedown', downHandler);
				el.addEventListener('mouseup', upHandler);

				_bindings.set(el, { move: moveHandler, leave: leaveHandler, down: downHandler, up: upHandler, state: state });
			});
		}
	};
}();
