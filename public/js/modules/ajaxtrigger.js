CNVS.AjaxTrigger = function() {
	var __core = SEMICOLON.Core;

	var _inFlight = new WeakSet();

	var _safeJSONParse = function(raw) {
		if( !raw ) return null;
		try { return JSON.parse(raw); } catch(e) { return null; }
	};

	var _load = function(params) {
		if( _inFlight.has(params.trigger) ) return;
		_inFlight.add(params.trigger);

		if( params.triggerDisable == 'true' && params.trigger ) {
			params.trigger.setAttribute('aria-disabled', 'true');
			params.trigger.classList.add('disabled');
		}

		fetch(params.loader).then( function(response) {
			if( !response.ok ) {
				throw new Error('HTTP ' + response.status + ' ' + response.statusText);
			}
			return response.text();
		}).then( function(html) {
			_scripts(params.loadCSS, params.loadJS);

			var domParser = new DOMParser();
			var parsedHTML = domParser.parseFromString(html, 'text/html');

			if( !params.container ) {
				_inFlight.delete(params.trigger);
				return;
			}

			if( params.contentPlacement == 'append' ) {
				params.container.insertAdjacentHTML('beforeend', parsedHTML.body.innerHTML);
			} else {
				params.container.insertAdjacentHTML('afterbegin', parsedHTML.body.innerHTML);
			}

			if( params.triggerHide == 'true' && params.trigger ) {
				params.trigger.classList.add('d-none');
			}

			__core.runContainerModules(params.container);
			__core.viewport();

			if( params.triggerDisable == 'true' && params.trigger ) {
				params.trigger.addEventListener('click', function(e) {
					e.stopPropagation();
					e.preventDefault();
				}, true);
			}

			_inFlight.delete(params.trigger);
		}).catch( function(err) {
			_inFlight.delete(params.trigger);

			if( params.triggerDisable == 'true' && params.trigger ) {
				params.trigger.removeAttribute('aria-disabled');
				params.trigger.classList.remove('disabled');
			}

			if( params.container ) {
				var errorDIV = document.createElement('div');
				errorDIV.classList.add('d-inline-block', 'text-danger', 'me-3');
				errorDIV.innerText = 'Content Cannot be Loaded: ' + (err && err.message ? err.message : String(err));
				params.container.prepend(errorDIV);
			}
		});
	};

	var _scripts = function(loadCSS, loadJS) {
		var cssList = _safeJSONParse(loadCSS);
		if( Array.isArray(cssList) ) {
			cssList.forEach( function(css) { __core.loadCSS(css); });
		}
		var jsList = _safeJSONParse(loadJS);
		if( Array.isArray(jsList) ) {
			jsList.forEach( function(js) { __core.loadJS(js); });
		}
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.initFunction({ class: 'has-plugin-ajaxtrigger', event: 'pluginAjaxTriggerReady' });

			selector = __core.getSelector( selector, false );
			if( selector.length < 1 ){
				return true;
			}

			selector.forEach( function(el) {
				var params = {
					trigger: el,
					loader: el.getAttribute('data-ajax-loader'),
					triggerType: el.getAttribute('data-ajax-trigger-type') || 'click',
					loadDelay: el.getAttribute('data-ajax-load-delay') || 2222,
					container: document.querySelector( el.getAttribute('data-ajax-container') ),
					contentPlacement: el.getAttribute('data-ajax-insertion') || 'append',
					triggerHide: el.getAttribute('data-ajax-trigger-hide') || 'true',
					triggerDisable: el.getAttribute('data-ajax-trigger-disable') || 'true',
					loadCSS: el.getAttribute('data-ajax-loadcss') || false,
					loadJS: el.getAttribute('data-ajax-loadjs') || false,
				};

				if( !params.loader ) return;

				if( params.triggerType == 'load' ) {
					setTimeout( function() { _load(params); }, Number(params.loadDelay));
				} else {
					var clickHandler = function(e) {
						e.preventDefault();
						_load(params);
					};
					el.addEventListener('click', clickHandler);
				}
			});
		}
	};
}();
