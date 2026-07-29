CNVS.Bootstrap = function() {
	var __core = SEMICOLON.Core;

	return {
		init: function(selector) {
			__core.requirePlugin({
				file: 'plugins.bootstrap.js',
				id: 'canvas-bootstrap-js',
				check: function() { return typeof bootstrap !== 'undefined'; },
				class: 'has-plugin-bootstrap',
				event: 'pluginBootstrapReady'
			});
		}
	};
}();
