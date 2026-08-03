CNVS.AdaptiveColorScheme = function() {
	var __core = SEMICOLON.Core;
	var __base = SEMICOLON.Base;

	var _state = {
		mq: null,
		changeHandler: null,
		adaptiveEl: null,
		lightClass: null,
		darkClass: null,
	};

	var _applyScheme = function(isDark) {
		if( isDark ) {
			__core.getVars.elBody.classList.add('dark');
		} else {
			__core.getVars.elBody.classList.remove('dark');
		}

		if( _state.adaptiveEl && __core.getVars.elBody.contains(_state.adaptiveEl) ) {
			if( isDark ) {
				if( _state.lightClass ) _state.adaptiveEl.classList.remove(_state.lightClass);
				if( _state.darkClass ) _state.adaptiveEl.classList.add(_state.darkClass);
			} else {
				if( _state.darkClass ) _state.adaptiveEl.classList.remove(_state.darkClass);
				if( _state.lightClass ) _state.adaptiveEl.classList.add(_state.lightClass);
			}
		}

		__base.setBSTheme();
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ) return true;

			__core.initFunction({ class: 'has-plugin-adaptivecolorscheme', event: 'pluginAdaptiveColorSchemeReady' });

			selector = __core.getSelector( selector, false );
			if( selector.length < 1 ) return true;

			_state.adaptiveEl = document.querySelector('[data-adaptive-light-class],[data-adaptive-dark-class]');

			if( _state.adaptiveEl && __core.getVars.elBody.contains(_state.adaptiveEl) ) {
				_state.lightClass = _state.adaptiveEl.getAttribute('data-adaptive-light-class');
				_state.darkClass = _state.adaptiveEl.getAttribute('data-adaptive-dark-class');
			}

			if( !window.matchMedia ) return;

			if( !_state.mq ) {
				_state.mq = window.matchMedia('(prefers-color-scheme: dark)');
			}

			_applyScheme(_state.mq.matches);

			if( _state.changeHandler ) {
				_state.mq.removeEventListener('change', _state.changeHandler);
			}
			_state.changeHandler = function(e) {
				_applyScheme(e.matches);
			};
			_state.mq.addEventListener('change', _state.changeHandler);
		}
	};
}();
