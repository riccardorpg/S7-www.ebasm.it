CNVS.Quantity = function() {
	var __core = SEMICOLON.Core;

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.initFunction({ class: 'has-plugin-quantity', event: 'pluginQuantityReady' });

			selector = __core.getSelector( selector, false );
			if( selector.length < 1 ) return true;

			selector.forEach( function(element) {
				var plus  = element.querySelector('.plus');
				var minus = element.querySelector('.minus');
				var input = element.querySelector('.qty');
				if( !plus || !minus || !input ) return;

				var fireChange = function() {
					input.dispatchEvent(new Event('change', { bubbles: true }));
				};

				var plusHandler = function(e) {
					e.preventDefault();

					var value = input.value;
					var step = Number(input.getAttribute('step')) || 1;
					var maxAttr = input.getAttribute('max');
					var max = maxAttr !== null ? Number(maxAttr) : null;
					var intRegex = /^\d+$/;

					if( max !== null && isFinite(max) && Number(value) >= max ) {
						return;
					}

					if( intRegex.test(value) ) {
						input.value = Number(value) + step;
					} else {
						input.value = step;
					}

					fireChange();
				};
				__core.rebind(plus, 'click', plusHandler, 'quantity.plus');

				var minusHandler = function(e) {
					e.preventDefault();

					var value = input.value;
					var step = Number(input.getAttribute('step')) || 1;
					var minAttr = input.getAttribute('min');
					var min = minAttr !== null ? Number(minAttr) : NaN;
					if( !isFinite(min) || min < 0 ) min = 1;
					var intRegex = /^\d+$/;

					if( intRegex.test(value) ) {
						if( Number(value) > min ) {
							input.value = Number(value) - step;
						}
					} else {
						input.value = step;
					}

					fireChange();
				};
				__core.rebind(minus, 'click', minusHandler, 'quantity.minus');
			});
		}
	};
}();
