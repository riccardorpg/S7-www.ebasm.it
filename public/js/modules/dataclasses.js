CNVS.DataClasses = function() {
	var __core = SEMICOLON.Core;
	var __modules = SEMICOLON.Modules;

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.initFunction({ class: 'has-plugin-dataclasses', event: 'pluginDataClassesReady' });

			selector = __core.getSelector( selector, false, false );
			if( selector.length < 1 ) return true;

			selector.forEach( function(el) {
				var raw = el.getAttribute('data-class');
				if( !raw ) return;

				var classes = raw.split(/\s+/).filter(Boolean);
				classes.forEach( function(_class) {
					var parts = _class.split(':');
					if( parts.length < 2 || !parts[1] ) return;

					var deviceKey = parts[0];
					var targetClass = parts[1];
					var bodyClass = deviceKey === 'dark' ? 'dark' : 'device-' + deviceKey;

					if( __core.getVars.elBody.classList.contains(bodyClass) ) {
						el.classList.add(targetClass);
					} else {
						el.classList.remove(targetClass);
					}
				});
			});

			__core.getVars.resizers.dataClasses = __core.debounce(function() {
				__modules.dataClasses();
			}, 200);
		}
	};
}();
