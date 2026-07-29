CNVS.Filter = function() {
	var __core = SEMICOLON.Core;
	var __modules = SEMICOLON.Modules;

	var _escapeAttr = function(val) {
		if( !val ) return '';
		if( typeof CSS !== 'undefined' && CSS.escape ) return CSS.escape(val);
		return String(val).replace(/(["\\])/g, '\\$1');
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.requirePlugin({
				check: function() { return typeof jQuery !== 'undefined' && typeof Isotope !== 'undefined'; },
				class: 'has-plugin-isotope-filter',
				event: 'pluginGridFilterReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector );
				if( selector.length < 1 ) return;

				selector.each( function() {
					var element = jQuery(this);
					var elCon = element.attr('data-container');
					var elActClass = element.attr('data-active-class') || 'activeFilter';
					var elDefFilter = element.attr('data-default');
					var $container = jQuery(elCon);

					if( !$container.hasClass('grid-container') ) return;

					element.find('a').off('click.filter').on('click.filter', function(){
						var filterValue = jQuery(this).attr('data-filter');
						if( !filterValue ) return false;
						element.find('li').removeClass(elActClass);
						jQuery(this).parent('li').addClass(elActClass);
						$container.isotope({ filter: filterValue });
						return false;
					});

					if( elDefFilter ) {
						element.find('li').removeClass(elActClass);
						var defaultSel = '[data-filter="' + _escapeAttr(elDefFilter) + '"]';
						element.find(defaultSel).parent('li').addClass(elActClass);
						$container.isotope({ filter: elDefFilter });
					}

					$container.off('arrangeComplete.filter layoutComplete.filter')
						.on('arrangeComplete.filter layoutComplete.filter', function(_event, filteredItems) {
							$container.addClass('grid-container-filterable');
							if( $container.attr('data-lightbox') === 'gallery' ) {
								$container.find('[data-lightbox]').removeClass('grid-lightbox-filtered');
								filteredItems.forEach( function(item) {
									jQuery(item.element).find('[data-lightbox]').addClass('grid-lightbox-filtered');
								});
							}
							__modules.lightbox();
						});
				});

				jQuery('.grid-shuffle').off('click.filter').on('click.filter', function(){
					var element = jQuery(this);
					var elCon = element.attr('data-container');
					var $container = jQuery(elCon);
					if( !$container.hasClass('grid-container') ) return false;
					$container.isotope('shuffle');
				});
			});
		}
	};
}();
