CNVS.TopSearch = function() {
	var __core = SEMICOLON.Core;

	var _outsideHandler = null;
	var _topSearchParent = null;
	var _timeout = null;

	return {
		init: function(selector) {
			selector = __core.getSelector( selector, false );
			if( !selector || selector.length < 1 ){
				return true;
			}

			var searchForm = document.querySelector('.top-search-form');
			if( !searchForm ) return true;

			var headerRow = searchForm.closest('.header-row');
			if( headerRow ) headerRow.classList.add('top-search-parent');

			_topSearchParent = document.querySelector('.top-search-parent');

			var trigger = selector[0];

			if( __core.markOnce(trigger, 'cnvsTopsearchBound') ) {
				trigger.addEventListener('click', function(e) {
					e.stopPropagation();
					e.preventDefault();

					clearTimeout(_timeout);

					var elBody = __core.getVars.elBody;
					if( !elBody ) return;

					elBody.classList.toggle('top-search-open');

					var topCart = document.getElementById('top-cart');
					if( topCart ) topCart.classList.remove('top-cart-open');

					if( __core.getVars.recalls && typeof __core.getVars.recalls.menureset === 'function' ) {
						__core.getVars.recalls.menureset();
					}

					var isOpen = elBody.classList.contains('top-search-open');
					if( isOpen ) {
						if( _topSearchParent ) _topSearchParent.classList.add('position-relative');
					} else {
						_timeout = setTimeout( function() {
							if( _topSearchParent ) _topSearchParent.classList.remove('position-relative');
						}, 500);
					}

					elBody.classList.remove('primary-menu-open');
					if( __core.getVars.elPageMenu ) __core.getVars.elPageMenu.classList.remove('page-menu-open');

					if( isOpen ) {
						var input = searchForm.querySelector('input');
						if( input ) input.focus();
					}
				});
			}

			if( !_outsideHandler ) {
				_outsideHandler = function(e) {
					var elBody = __core.getVars.elBody;
					if( !elBody || !elBody.classList.contains('top-search-open') ) return;
					if( !e.target.closest('.top-search-form') ) {
						elBody.classList.remove('top-search-open');
						_timeout = setTimeout( function() {
							if( _topSearchParent ) _topSearchParent.classList.remove('position-relative');
						}, 500);
					}
				};
				document.addEventListener('click', _outsideHandler, false);
			}
		}
	};
}();
