CNVS.Toggle = function() {
	var __core = SEMICOLON.Core;

	var _parseSpeed = function(raw) {
		if( !raw ) return 300;
		var n = Number(raw);
		if( isFinite(n) && n >= 0 ) return n;
		return raw;
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.requirePlugin({
				check: function() { return typeof jQuery !== 'undefined'; },
				class: 'has-plugin-toggles',
				event: 'pluginTogglesReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector );
				if( selector.length < 1 ) return;

				selector.each( function(){
					var element = jQuery(this),
						elSpeed = _parseSpeed(element.attr('data-speed')),
						elState = element.attr('data-state');

					if( elState != 'open' ){
						element.children('.toggle-content').hide();
					} else {
						element.addClass('toggle-active').children('.toggle-content').slideDown( elSpeed );
					}

					element.children('.toggle-header').off('click.toggle').on('click.toggle', function(){
						element.toggleClass('toggle-active').children('.toggle-content').stop(true, true).slideToggle( elSpeed );
						return true;
					});
				});
			});
		}
	};
}();
