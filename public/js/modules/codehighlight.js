CNVS.CodeHighlight = function() {
	var __core = SEMICOLON.Core;

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.loadCSS({ file: 'components/prism.css', id: 'canvas-prism-css', cssFolder: true });

			__core.requirePlugin({
				file: 'plugins.prism.js',
				id: 'canvas-prism-js',
				check: function() { return typeof Prism !== 'undefined'; },
				class: 'has-plugin-codehighlight',
				event: 'pluginCodeHighlightReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector, false );
				if( selector.length < 1 ) return;

				selector.forEach( function(el) {
					var codeEl = el.querySelector('code');
					if( !codeEl ) return;
					if( codeEl.dataset.cnvsHighlighted === 'true' ) return;
					Prism.highlightElement(codeEl);
					codeEl.dataset.cnvsHighlighted = 'true';
				});
			});
		}
	};
}();
