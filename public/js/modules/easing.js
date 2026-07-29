CNVS.Easing = function() {
	var __core = SEMICOLON.Core;

	return {
		init: function(selector) {
			__core.requirePlugin({
				file: 'plugins.easing.js',
				id: 'canvas-easing-js',
				check: function() { return typeof jQuery !== 'undefined' && typeof jQuery.easing['easeOutQuad'] !== 'undefined'; },
				class: 'has-plugin-easing',
				event: 'pluginEasingReady'
			});
		}
	};
}();
