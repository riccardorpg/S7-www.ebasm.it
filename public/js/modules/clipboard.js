CNVS.Clipboard = function() {
	var __core = SEMICOLON.Core;

	var _instances = new WeakMap();

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.requirePlugin({
				file: 'plugins.clipboard.js',
				id: 'canvas-clipboard-js',
				check: function() { return typeof ClipboardJS !== 'undefined'; },
				class: 'has-plugin-clipboard',
				event: 'pluginClipboardReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector, false );
				if( selector.length < 1 ) return;

				selector.forEach( function(el) {
					var trigger = el.querySelector('button');
					if( !trigger ) return;

					var prev = _instances.get(trigger);
					if( prev && typeof prev.destroy === 'function' ) {
						prev.destroy();
					}

					var triggerText = trigger.innerHTML;
					var copiedText = trigger.getAttribute('data-copied') || 'Copied';
					var errorText = trigger.getAttribute('data-copy-error') || 'Copy failed';
					var copiedTimeout = Number(trigger.getAttribute('data-copied-timeout')) || 5000;
					var resetTimer = null;

					var clipboard = new ClipboardJS(trigger, {
						target: function(content) {
							var wrap = content.closest('.clipboard-copy');
							return wrap ? wrap.querySelector('code') : null;
						}
					});

					var showFeedback = function(text) {
						trigger.innerHTML = text;
						trigger.disabled = true;
						if( resetTimer ) clearTimeout(resetTimer);
						resetTimer = setTimeout( function() {
							trigger.innerHTML = triggerText;
							trigger.disabled = false;
							resetTimer = null;
						}, copiedTimeout);
					};

					clipboard.on('success', function() { showFeedback(copiedText); });
					clipboard.on('error', function() { showFeedback(errorText); });

					_instances.set(trigger, clipboard);
				});
			});
		}
	};
}();
