CNVS.SchemeToggle = function() {
	var __core = SEMICOLON.Core;
	var __base = SEMICOLON.Base;
	var __modules = SEMICOLON.Modules;

	var _handlers = new WeakMap();

	var _toggle = function(element, sibling = false, action = false, skipSideEffects = false) {
		var bodyClassToggle = element.getAttribute('data-bodyclass-toggle') || 'dark';
		var classAdd = element.getAttribute('data-add-class') || 'scheme-toggler-active';
		var classRemove = element.getAttribute('data-remove-class') || 'scheme-toggler-active';
		var htmlAdd = element.getAttribute('data-add-html');
		var htmlRemove = element.getAttribute('data-remove-html');
		var toggleType = element.getAttribute('data-type') || 'trigger';
		var remember = element.getAttribute('data-remember') === 'true';
		var bodyHasClass = __core.contains(bodyClassToggle, __core.getVars.elBody);

		if( bodyHasClass ) {
			__core.classesFn('add', classAdd, element);
			__core.classesFn('remove', classRemove, element);
			element.classList.add('body-state-toggled');

			if( remember && action ) {
				__core.cookie.set('__cnvs_body_color_scheme', 'dark', 7);
			}

			if( toggleType === 'checkbox' && sibling ) {
				var checkOn = element.querySelector('input[type=checkbox]');
				if( checkOn ) checkOn.checked = true;
			} else if( htmlAdd ) {
				element.innerHTML = htmlAdd;
			}
		} else {
			__core.classesFn('add', classRemove, element);
			__core.classesFn('remove', classAdd, element);
			element.classList.remove('body-state-toggled');

			if( remember && action ) {
				__core.cookie.remove('__cnvs_body_color_scheme');
			}

			if( toggleType === 'checkbox' && sibling ) {
				var checkOff = element.querySelector('input[type=checkbox]');
				if( checkOff ) checkOff.checked = false;
			} else if( htmlRemove ) {
				element.innerHTML = htmlRemove;
			}
		}

		if( !skipSideEffects ) {
			__base.setBSTheme();
			__modules.dataClasses();
		}
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ) return true;

			__core.initFunction({ class: 'has-plugin-schemetoggler', event: 'pluginSchemeTogglerReady' });

			selector = __core.getSelector(selector, false);
			if( selector.length < 1 ) return false;

			selector.forEach(function(element, idx) {
				var bodyClassToggle = element.getAttribute('data-bodyclass-toggle') || 'dark';
				var toggleType = element.getAttribute('data-type') || 'trigger';

				_toggle(element, false, false, idx < selector.length - 1);

				var prev = _handlers.get(element);
				if( prev ) {
					if( prev.target && prev.eventName ) {
						prev.target.removeEventListener(prev.eventName, prev.fn);
					}
				}

				var onActivate = function() {
					__core.classesFn('toggle', bodyClassToggle, __core.getVars.elBody);
					_toggle(element, false, true);
					__core.siblings(element, selector).forEach(function(el) {
						_toggle(el, true);
					});
				};

				if( toggleType === 'checkbox' ) {
					var checkEl = element.querySelector('input[type=checkbox]');
					if( !checkEl ) return;
					var changeFn = function() { onActivate(); };
					checkEl.addEventListener('change', changeFn);
					_handlers.set(element, { target: checkEl, eventName: 'change', fn: changeFn });
				} else {
					var clickFn = function(e) {
						e.preventDefault();
						onActivate();
					};
					element.addEventListener('click', clickFn);
					_handlers.set(element, { target: element, eventName: 'click', fn: clickFn });
				}
			});
		}
	};
}();
