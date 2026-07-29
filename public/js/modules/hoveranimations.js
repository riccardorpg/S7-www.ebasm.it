CNVS.HoverAnimations = function() {
	var __core = SEMICOLON.Core;

	var _bindings = new WeakMap();

	var _showOverlay = function(state) {
		clearTimeout(state.hideTimer);

		state.showTimer = setTimeout( function() {
			state.element.classList.add('not-animated');

			(state.elAnimateOut + ' not-animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
				state.element.classList.remove(_class);
			});

			(state.elAnimate + ' animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
				state.element.classList.add(_class);
			});
		}, state.elDelayT);
	};

	var _hideOverlay = function(state) {
		state.element.classList.add('not-animated');

		(state.elAnimate + ' not-animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
			state.element.classList.remove(_class);
		});

		(state.elAnimateOut + ' animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
			state.element.classList.add(_class);
		});

		if( state.elReset === 'true' ) {
			state.hideTimer = setTimeout( function() {
				(state.elAnimateOut + ' animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
					state.element.classList.remove(_class);
				});
				state.element.classList.add('not-animated');
			}, Number(state.elSpeed));
		}

		clearTimeout(state.showTimer);
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.initFunction({ class: 'has-plugin-hoveranimation', event: 'pluginHoverAnimationReady' });

			selector = __core.getSelector( selector, false );
			if( selector.length < 1 ) return true;

			selector.forEach( function(element) {
				var elAnimate    = element.getAttribute('data-hover-animate');
				if( !elAnimate ) return;

				var elAnimateOut = element.getAttribute('data-hover-animate-out') || 'fadeOut';
				var elSpeed      = element.getAttribute('data-hover-speed') || 600;
				var elDelay      = element.getAttribute('data-hover-delay');
				var elParentAttr = element.getAttribute('data-hover-parent');
				var elReset      = element.getAttribute('data-hover-reset') || 'false';
				var elMobile     = element.getAttribute('data-hover-mobile') || 'true';

				if( elMobile !== 'true' ) {
					var requiredClass = elMobile === 'false' ? 'device-up-lg' : 'device-up-' + elMobile;
					if( !__core.getVars.elBody.classList.contains(requiredClass) ) return;
				}

				element.classList.add('not-animated');

				var elParent;
				if( !elParentAttr ) {
					elParent = element.closest('.bg-overlay') || element;
				} else if( elParentAttr === 'self' ) {
					elParent = element;
				} else {
					elParent = element.closest(elParentAttr);
				}
				if( !elParent ) return;

				if( elSpeed ) {
					element.style.animationDuration = Number(elSpeed) + 'ms';
				}

				var prev = _bindings.get(element);
				if( prev ) {
					if( prev.parent && prev.enter ) prev.parent.removeEventListener('mouseenter', prev.enter);
					if( prev.parent && prev.leave ) prev.parent.removeEventListener('mouseleave', prev.leave);
					clearTimeout(prev.state.showTimer);
					clearTimeout(prev.state.hideTimer);
				}

				var state = {
					element: element,
					elAnimate: elAnimate,
					elAnimateOut: elAnimateOut,
					elSpeed: elSpeed,
					elDelayT: elDelay ? Number(elDelay) : 0,
					elReset: elReset,
					showTimer: null,
					hideTimer: null,
				};

				var enterHandler = function() { _showOverlay(state); };
				var leaveHandler = function() { _hideOverlay(state); };
				elParent.addEventListener('mouseenter', enterHandler, false);
				elParent.addEventListener('mouseleave', leaveHandler, false);

				_bindings.set(element, { parent: elParent, enter: enterHandler, leave: leaveHandler, state: state });
			});
		}
	};
}();
