CNVS.Counter = function() {
	var __core = SEMICOLON.Core;

	var _prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var _easeOutQuad = function(t) { return t * (2 - t); };

	var _animate = function(span) {
		if( span.dataset.cnvsCounterDone === '1' ) return;

		var from     = Number(span.getAttribute('data-from')) || 0;
		var to       = Number(span.getAttribute('data-to')) || 0;
		var duration = Number(span.getAttribute('data-speed')) || 1000;
		var decimals = Number(span.getAttribute('data-decimals')) || 0;
		var useComma = span.getAttribute('data-comma') === 'true';
		var sep      = span.getAttribute('data-sep') || ',';
		var places   = Number(span.getAttribute('data-places')) || 3;

		var regExp = useComma ? new RegExp('\\B(?=(\\d{' + places + '})+(?!\\d))', 'g') : null;
		var format = function(value) {
			var str = value.toFixed(decimals);
			if( regExp ) str = str.replace(regExp, sep);
			return str;
		};

		if( _prefersReducedMotion || duration <= 0 ) {
			span.textContent = format(to);
			span.dataset.cnvsCounterDone = '1';
			return;
		}

		var start = null;
		var step = function(timestamp) {
			if( !start ) start = timestamp;
			var progress = Math.min((timestamp - start) / duration, 1);
			var current = from + (to - from) * _easeOutQuad(progress);
			span.textContent = format(current);
			if( progress < 1 ) {
				window.requestAnimationFrame(step);
			} else {
				span.textContent = format(to);
				span.dataset.cnvsCounterDone = '1';
			}
		};
		window.requestAnimationFrame(step);
	};

	var _runElement = function(element) {
		element.querySelectorAll('span[data-to]').forEach(_animate);
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.initFunction({ class: 'has-plugin-counter', event: 'pluginCounterReady' });

			selector = __core.getSelector(selector, false);
			if( selector instanceof Element ) selector = [selector];
			if( !selector || selector.length < 1 ) return true;

			Array.prototype.forEach.call(selector, function(element) {
				if( element.classList.contains('counter-instant') ) {
					_runElement(element);
					return;
				}

				if( element.closest('.skill-progress') ) return;

				if( !__core.markOnce(element, 'cnvsCounterObserved') ) return;

				__core.intersect(element, { rootMargin: '0px 0px 50px' }, function(target) {
					_runElement(target);
				});
			});
		}
	};
}();
