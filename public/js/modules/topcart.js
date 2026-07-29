CNVS.TopCart = function() {
	var __core = SEMICOLON.Core;

	var _outsideHandler = null;
	var _topCartEl = null;

	return {
		init: function(selector) {
			selector = __core.getSelector( selector, false );
			if( !selector || selector.length < 1 ){
				return true;
			}

			var trigger = document.getElementById('top-cart-trigger');
			if( !trigger ) return false;

			_topCartEl = selector[0];

			if( __core.markOnce(trigger, 'cnvsTopcartBound') ) {
				trigger.addEventListener('click', function(e) {
					e.stopPropagation();
					e.preventDefault();
					if( _topCartEl ) _topCartEl.classList.toggle('top-cart-open');
				});
			}

			if( !_outsideHandler ) {
				_outsideHandler = function(e) {
					if( !_topCartEl || !_topCartEl.classList.contains('top-cart-open') ) return;
					if( !e.target.closest('#top-cart') ) {
						_topCartEl.classList.remove('top-cart-open');
					}
				};
				document.addEventListener('click', _outsideHandler, false);
			}
		}
	};
}();
