CNVS.PricingSwitcher = function() {
	var __core = SEMICOLON.Core;

	var _tokens = function(str) {
		return String(str || '').split(/\s+/).filter(Boolean);
	};

	var _switcher = function(check, switcher, pricing, defClass, actClass, state) {
		var value;

		if( check.type === 'checkbox' ) {
			state.value = check.checked;
		} else if( check.type === 'radio' ) {
			if( check.checked ) state.value = check.value;
		} else {
			state.value = check.value;
		}

		value = state.value;

		var defTokens = _tokens(defClass);
		var actTokens = _tokens(actClass);

		switcher.querySelectorAll('.pts-switch').forEach( function(elem) {
			actTokens.forEach( function(_class) { elem.classList.remove(_class); });
			defTokens.forEach( function(_class) { elem.classList.add(_class); });
		});

		pricing?.querySelectorAll('.pts-content').forEach( function(elem) {
			elem.classList.add('d-none');
		});

		if( check.type === 'checkbox' ) {
			value = value ? 'true' : 'false';
		}

		var activeSwitch = switcher.querySelector('.pts-' + value);
		if( activeSwitch ) {
			defTokens.forEach( function(_class) { activeSwitch.classList.remove(_class); });
			actTokens.forEach( function(_class) { activeSwitch.classList.add(_class); });
		}

		pricing?.querySelectorAll('.pts-content-' + value).forEach( function(el) {
			el.classList.remove('d-none');
		});
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.initFunction({ class: 'has-plugin-pricing-switcher', event: 'pluginPricingSwitcherReady' });

			selector = __core.getSelector( selector, false );
			if( selector.length < 1 ) return true;

			selector.forEach( function(element) {
				var containerSel = element.getAttribute('data-container');
				var elPricing = null;
				if( containerSel ) {
					try { elPricing = document.querySelector(containerSel); } catch(e) { elPricing = null; }
				}
				if( !elPricing ) return;

				var elCheck = element.querySelectorAll('[type="checkbox"], [type="radio"], select');
				var elDefClass = element.getAttribute('data-default-class') || 'text-muted op-05';
				var elActClass = element.getAttribute('data-active-class') || 'fw-bold';
				var state = { value: undefined };

				elCheck.forEach( function(el) {
					_switcher(el, element, elPricing, elDefClass, elActClass, state);

					var handler = function() {
						_switcher(el, element, elPricing, elDefClass, elActClass, state);
					};
					__core.rebind(el, 'change', handler, 'pricingswitcher.input');
				});
			});
		}
	};
}();
