CNVS.PortfolioAjax = function() {
	var __core = SEMICOLON.Core;

	var _transitionHandler = null;
	var _closeHandler = null;

	var _newNextPrev = function(portPostId) {
		var portNext = _getNext(portPostId);
		var portPrev = _getPrev(portPostId);
		var portNav = document.getElementById('portfolio-navigation');
		if( !portNav ) return;

		var closeBtn = document.getElementById('close-portfolio');

		if( !document.getElementById('prev-portfolio') && portPrev ) {
			var prevPortItem = document.createElement('a');
			prevPortItem.setAttribute('href', '#');
			prevPortItem.setAttribute('id', 'prev-portfolio');
			prevPortItem.setAttribute('data-id', portPrev);
			prevPortItem.innerHTML = '<i class="bi-arrow-left"></i>';
			portNav.insertBefore(prevPortItem, closeBtn);
		}

		if( !document.getElementById('next-portfolio') && portNext ) {
			var nextPortItem = document.createElement('a');
			nextPortItem.setAttribute('href', '#');
			nextPortItem.setAttribute('id', 'next-portfolio');
			nextPortItem.setAttribute('data-id', portNext);
			nextPortItem.innerHTML = '<i class="bi-arrow-right"></i>';
			portNav.insertBefore(nextPortItem, closeBtn);
		}
	};

	var _load = function(portPostId, prevPostPortId, getIt) {
		if( !getIt ) getIt = false;
		if( getIt !== false ) return;

		var srcEl = document.getElementById(portPostId);
		if( !srcEl ) return;

		var portNext = _getNext(portPostId);
		var portPrev = _getPrev(portPostId);

		_close();
		__core.getVars.elBody.classList.add('portfolio-ajax-loading');
		var portfolioDataLoader = srcEl.getAttribute('data-loader');
		if( !portfolioDataLoader ) return;

		fetch(portfolioDataLoader).then( function(response) {
			if( !response.ok ) throw new Error('HTTP ' + response.status);
			return response.text();
		}).then( function(html) {
			var container = __core.getVars.portfolioAjax.container;
			if( !container ) return;
			container.innerHTML = html;

			var nextPortfolio = document.getElementById('next-portfolio'),
				prevPortfolio = document.getElementById('prev-portfolio');

			nextPortfolio?.classList.add('d-none');
			prevPortfolio?.classList.add('d-none');

			if( portNext ) {
				nextPortfolio?.setAttribute('data-id', portNext);
				nextPortfolio?.classList.remove('d-none');
			}
			if( portPrev ) {
				prevPortfolio?.setAttribute('data-id', portPrev);
				prevPortfolio?.classList.remove('d-none');
			}

			_initAjax(portPostId);
			_open();

			__core.getVars.portfolioAjax.items?.forEach( function(item) {
				item.classList.remove('portfolio-active');
			});

			document.getElementById(portPostId)?.classList.add('portfolio-active');
		}).catch( function(error) {
			console.warn('Something went wrong.', error);
			__core.getVars.elBody.classList.remove('portfolio-ajax-loading');
		});
	};

	var _close = function() {
		var wrapper = __core.getVars.portfolioAjax.wrapper;
		if( !wrapper || wrapper.offsetHeight <= 32 ) return;

		__core.getVars.elBody.classList.remove('portfolio-ajax-loading');
		wrapper.classList.remove('portfolio-ajax-opened');

		var single = wrapper.querySelector('#portfolio-ajax-single');
		if( single ) {
			if( _transitionHandler ) {
				single.removeEventListener('transitionend', _transitionHandler);
			}
			_transitionHandler = function() {
				single.remove();
				_transitionHandler = null;
			};
			single.addEventListener('transitionend', _transitionHandler, { once: true });
		}

		__core.getVars.portfolioAjax.items?.forEach( function(item) {
			item.classList.remove('portfolio-active');
		});
	};

	var _open = function() {
		var container = __core.getVars.portfolioAjax.container;
		if( !container ) return;
		_display();
	};

	var _display = function() {
		var portfolioAjax = __core.getVars.portfolioAjax;
		if( !portfolioAjax.container || !portfolioAjax.wrapper ) return;
		portfolioAjax.container.style.display = 'block';
		portfolioAjax.wrapper.classList.add('portfolio-ajax-opened');
		__core.getVars.elBody.classList.remove('portfolio-ajax-loading');
		setTimeout( function() {
			__core.runContainerModules(portfolioAjax.wrapper);
			__core.scrollTo((portfolioAjax.wrapperOffset - __core.getVars.topScrollOffset - 60), false, false);
		}, 500);
	};

	var _getNext = function(portPostId) {
		var el = document.getElementById(portPostId);
		if( !el ) return false;
		var next = el.nextElementSibling;
		return next ? next.getAttribute('id') : false;
	};

	var _getPrev = function(portPostId) {
		var el = document.getElementById(portPostId);
		if( !el ) return false;
		var prev = el.previousElementSibling;
		return prev ? prev.getAttribute('id') : false;
	};

	var _initAjax = function(portPostId) {
		__core.getVars.portfolioAjax.prevItem = document.getElementById(portPostId);

		_newNextPrev(portPostId);

		document.querySelectorAll('#next-portfolio, #prev-portfolio').forEach( function(el) {
			var handler = function(e) {
				e.preventDefault();
				_close();
				var nextId = el.getAttribute('data-id');
				if( !nextId ) return;
				document.getElementById(nextId)?.classList.add('portfolio-active');
				_load(nextId, __core.getVars.portfolioAjax.prevItem);
			};
			__core.rebind(el, 'click', handler, 'portfolioajax.nav');
		});

		var closeBtn = document.getElementById('close-portfolio');
		if( closeBtn ) {
			if( _closeHandler ) closeBtn.removeEventListener('click', _closeHandler);
			_closeHandler = function(e) {
				e.preventDefault();
				_close();
			};
			closeBtn.addEventListener('click', _closeHandler);
		}
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.initFunction({ class: 'has-plugin-ajaxportfolio', event: 'pluginAjaxPortfolioReady' });

			selector = __core.getSelector( selector, false );
			if( selector.length < 1 ) return true;

			var wrapper = document.getElementById('portfolio-ajax-wrap');
			__core.getVars.portfolioAjax.items         = selector[0].querySelectorAll('.portfolio-item');
			__core.getVars.portfolioAjax.wrapper       = wrapper;
			__core.getVars.portfolioAjax.wrapperOffset = wrapper ? __core.offset(wrapper).top : 0;
			__core.getVars.portfolioAjax.container     = document.getElementById('portfolio-ajax-container');
			__core.getVars.portfolioAjax.loader        = document.getElementById('portfolio-ajax-loader');
			__core.getVars.portfolioAjax.prevItem      = '';

			selector[0].querySelectorAll('.portfolio-ajax-trigger').forEach( function(el) {
				if( !el.querySelector('i:nth-child(2)') ) {
					el.insertAdjacentHTML('beforeend', '<i class="bi-arrow-repeat icon-spin"></i>');
				}

				var handler = function(e) {
					e.preventDefault();
					var portItem = e.target.closest('.portfolio-item');
					if( !portItem ) return;
					var portPostId = portItem.getAttribute('id');
					if( !portPostId ) return;
					if( !portItem.classList.contains('portfolio-active') ) {
						_load(portPostId, __core.getVars.portfolioAjax.prevItem);
					}
				};
				__core.rebind(el, 'click', handler, 'portfolioajax.trigger');
			});
		}
	};
}();
