CNVS.StickySidebar = function() {
	var __core = SEMICOLON.Core;

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.requirePlugin({
				file: 'plugins.stickysidebar.js',
				id: 'canvas-stickysidebar-js',
				check: function() { return typeof jQuery !== 'undefined' && jQuery().scwStickySidebar; },
				class: 'has-plugin-stickysidebar',
				event: 'pluginStickySidebarReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector );
				if( !selector || selector.length < 1 ) return;

				selector.each( function(){
					var element = jQuery(this);
					var raw = element[0];
					if( !__core.markOnce(raw, 'cnvsStickysidebarInit') ) return;

					var elTop    = __core.toNumber(element.attr('data-offset-top'), 110),
						elBottom = __core.toNumber(element.attr('data-offset-bottom'), 50);

					element.scwStickySidebar({
						additionalMarginTop: elTop,
						additionalMarginBottom: elBottom
					});
				});
			});
		}
	};
}();
