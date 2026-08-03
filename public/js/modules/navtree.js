CNVS.NavTree = function() {
	var __core = SEMICOLON.Core;

	var _parseSpeed = function(raw) {
		if( !raw ) return 250;
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
				class: 'has-plugin-navtree',
				event: 'pluginNavTreeReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector );
				if( selector.length < 1 ) return;

				selector.each( function(){
					var element = jQuery(this),
						elSpeed = _parseSpeed(element.attr('data-speed')),
						elEasing = element.attr('data-easing') || 'swing',
						elHoverDelay = Number(element.attr('data-hover-delay')) || 250,
						elArrow = element.attr('data-arrow-class') || 'fa-solid fa-angle-right';

					element.find( 'ul li:has(ul)' ).addClass('sub-menu');
					element.find( 'ul li:has(ul) > a' ).filter(':not(:has(.sub-menu-indicator))').append( '<i class="sub-menu-indicator '+ elArrow +'"></i>' );

					if( element.hasClass('on-hover') ){
						element.find( 'ul li:has(ul):not(.active)' )
							.off('mouseenter.navtree mouseleave.navtree')
							.on('mouseenter.navtree', function(){
								jQuery(this).children('ul').stop(true, true).slideDown( elSpeed, elEasing);
							})
							.on('mouseleave.navtree', function(){
								jQuery(this).children('ul').stop(true, true).delay(elHoverDelay).slideUp( elSpeed, elEasing);
							});
					} else {
						element.find( 'ul li:has(ul) > a' ).off( 'click.navtree' ).on( 'click.navtree', function(){
							var childElement = jQuery(this);

							element.find( 'ul li' ).not(childElement.parents()).removeClass('active');

							childElement.parent().children('ul').stop(true, true).slideToggle( elSpeed, elEasing, function(){
								jQuery(this).find('ul').hide();
								jQuery(this).find('li.active').removeClass('active');
							});

							element.find( 'ul li > ul' ).not(childElement.parent().children('ul')).not(childElement.parents('ul')).stop(true, true).slideUp( elSpeed, elEasing );
							childElement.parent('li:has(ul)').toggleClass('active');

							return true;
						});
					}
				});
			});
		}
	};
}();
