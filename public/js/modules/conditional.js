CNVS.Conditional = function() {
	var __core = SEMICOLON.Core;

	var _bindings = new WeakMap();

	var _escapeAttr = function(val) {
		return String(val).replace(/(["'\\\]\\[])/g, '\\$1');
	};

	var _eval = function(field, value, conditions, check, target) {
		if( !field || !conditions ) return false;

		var fulfilled = false;

		if( check == 'validate' ) {
			if( value ) {
				fulfilled = target && target.getAttribute('aria-invalid') === 'false';
			}
		} else {
			switch( conditions.operator ) {
				case '==': fulfilled = value == conditions.value; break;
				case '!=': fulfilled = value != conditions.value; break;
				case '>':  fulfilled = value > conditions.value; break;
				case '<':  fulfilled = value < conditions.value; break;
				case '<=': fulfilled = value <= conditions.value; break;
				case '>=': fulfilled = value >= conditions.value; break;
				case 'in': fulfilled = conditions.value && conditions.value.includes(value); break;
				default:   fulfilled = false;
			}
		}

		if( fulfilled ) {
			field.classList.add('condition-fulfilled');
		} else {
			field.classList.remove('condition-fulfilled');
		}

		field.querySelectorAll('input,select,textarea,button').forEach( function(el) {
			el.disabled = !fulfilled;
		});
	};

	var _readValue = function(target) {
		if( target.type === 'checkbox' ) return target.checked ? target.value : 0;
		if( target.type === 'radio' )    return target.checked ? target.value : '';
		return target.value;
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.initFunction({ class: 'has-plugin-conditional', event: 'pluginConditionalReady' });

			selector = __core.getSelector( selector, false );
			if( selector.length < 1 ) return true;

			selector.forEach( function(field) {
				var condition = field.getAttribute('data-condition') || '==';
				var conditionTarget = field.getAttribute('data-condition-target');
				var conditionValue = field.getAttribute('data-condition-value');
				var conditionCheck = field.getAttribute('data-condition-check') || 'value';

				if( !conditionTarget ) return;

				var target;
				try {
					target = document.querySelector('[id*="' + _escapeAttr(conditionTarget) + '"]');
				} catch(e) {
					target = null;
				}
				if( !target ) return;

				var prev = _bindings.get(field);
				if( prev ) {
					if( prev.target && prev.eventType && prev.listener ) {
						prev.target.removeEventListener(prev.eventType, prev.listener);
					}
					if( prev.observer ) {
						prev.observer.disconnect();
					}
				}

				var conditions = {
					operator: condition,
					field: conditionTarget,
					value: conditionValue,
				};

				var targetType = target.type;
				var targetTag = target.tagName.toLowerCase();
				var eventType = (targetType === 'checkbox' || targetTag === 'select' || targetType === 'radio') ? 'change' : 'input';

				_eval(field, _readValue(target), conditions, conditionCheck, target);

				var listener = function() {
					_eval(field, _readValue(target), conditions, conditionCheck, target);
				};
				target.addEventListener(eventType, listener);

				var observer = null;
				if( conditionCheck === 'validate' ) {
					observer = new MutationObserver( function() {
						_eval(field, _readValue(target), conditions, conditionCheck, target);
					});
					observer.observe(target, {
						attributes: true,
						characterData: true,
						childList: true,
						subtree: true,
						attributeOldValue: true,
						characterDataOldValue: true,
					});
				}

				_bindings.set(field, { target: target, eventType: eventType, listener: listener, observer: observer });
			});
		}
	};
}();
