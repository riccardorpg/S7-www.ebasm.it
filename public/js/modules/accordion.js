CNVS.Accordion = function() {
	var __core = SEMICOLON.Core;

	var _escapeHashId = function(hash) {
		if( !hash || hash.charAt(0) !== '#' ) return '';
		var id = hash.slice(1);
		if( !id ) return '';
		if( typeof CSS !== 'undefined' && CSS.escape ) {
			return '#' + CSS.escape(id);
		}
		return '#' + id.replace(/([^\w-])/g, '\\$1');
	};

	var _classList = function(str) {
		return String(str || '').trim().split(/\s+/).filter(Boolean);
	};

	var _parseSpeed = function(raw) {
		if( !raw ) return 'normal';
		var n = Number(raw);
		if( isFinite(n) && n >= 0 ) return n;
		return raw;
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ) return true;

			__core.requirePlugin({
				check: function() { return typeof jQuery !== 'undefined'; },
				class: 'has-plugin-accordions',
				event: 'pluginAccordionsReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector );
				if( selector.length < 1 ) return;

				selector.each( function(){
					var element = jQuery(this);
					var elState = element.attr('data-state');
					var elActive = Number(element.attr('data-active') || 1) - 1;
					var elActiveClasses = _classList('accordion-active ' + (element.attr('data-active-class') || ''));
					var elCollapsible = element.attr('data-collapsible') === 'true';
					var elSpeed = _parseSpeed(element.attr('data-speed'));
					var $headers = element.find('.accordion-header');

					var hashSel = _escapeHashId(location.hash);
					if( hashSel ) {
						var $byHash = $headers.filter(hashSel);
						if( $byHash.length ) {
							elActive = $headers.index($byHash);
						}
					}

					element.find('.accordion-content').hide();

					if( elState !== 'closed' && elActive >= 0 && $headers.length ) {
						$headers.eq(elActive).addClass(elActiveClasses.join(' ')).next().show();
					}

					$headers.off('click.accordion').on('click.accordion', function(){
						var $clickTarget = jQuery(this);

						if( $clickTarget.next().is(':hidden') ) {
							$headers.each(function() {
								var $h = jQuery(this);
								for( var i = 0; i < elActiveClasses.length; i++ ) {
									$h.removeClass(elActiveClasses[i]);
								}
							});
							$headers.next().slideUp(elSpeed);

							for( var i = 0; i < elActiveClasses.length; i++ ) {
								$clickTarget.addClass(elActiveClasses[i]);
							}

							$clickTarget.next().stop(true, true).slideDown(elSpeed, function(){
								if( ( jQuery('body').hasClass('device-sm') || jQuery('body').hasClass('device-xs') ) && element.hasClass('scroll-on-open') ) {
									__core.scrollTo((__core.offset($clickTarget).top - __core.getVars.topScrollOffset - 40), 800, 'easeOutQuad');
								}
								__core.runContainerModules( $clickTarget.next()[0] );
							});
						} else if( elCollapsible ) {
							for( var j = 0; j < elActiveClasses.length; j++ ) {
								$clickTarget.removeClass(elActiveClasses[j]);
							}
							$clickTarget.next().stop(true, true).slideUp(elSpeed);
						}

						return false;
					});
				});
			});
		}
	};
}();
