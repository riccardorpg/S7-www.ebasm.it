CNVS.FlexSlider = function() {
	var __core = SEMICOLON.Core;
	var __modules = SEMICOLON.Modules;

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.requirePlugin({
				file: 'plugins.flexslider.js',
				id: 'canvas-flexslider-js',
				check: function() { return typeof jQuery !== 'undefined' && jQuery().flexslider; },
				class: 'has-plugin-flexslider',
				event: 'pluginFlexSliderReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector );
				if( selector.length < 1 ) return;

				selector.each(function() {
					var element = jQuery(this);
					var $flex = element.find('.flexslider');
					if( $flex.data('flexslider') ) {
						return;
					}

					var elAnimation  = element.attr('data-animation') || 'slide',
						elEasing     = element.attr('data-easing') || 'swing',
						elDirection  = element.attr('data-direction') || 'horizontal',
						elReverse    = element.attr('data-reverse') === 'true',
						elSlideshow  = element.attr('data-slideshow') !== 'false',
						elPause      = Number(element.attr('data-pause')) || 5000,
						elSpeed      = Number(element.attr('data-speed')) || 600,
						elVideo      = element.attr('data-video') === 'true',
						elPagiRaw    = element.attr('data-pagi'),
						elArrows     = element.attr('data-arrows') !== 'false',
						elArrowLeft  = element.attr('data-arrow-left') || 'uil uil-angle-left-b',
						elArrowRight = element.attr('data-arrow-right') || 'uil uil-angle-right-b',
						elThumbs     = element.attr('data-thumbs') === 'true',
						elHover      = element.attr('data-hover') !== 'false',
						elSheight    = element.attr('data-smooth-height') !== 'false',
						elTouch      = element.attr('data-touch') !== 'false',
						elUseCSS     = elEasing === 'swing';

					var elPagi = elPagiRaw === 'false' ? false : true;
					if( elThumbs ) elPagi = 'thumbnails';
					if( elDirection === 'vertical' ) elSheight = false;

					$flex.flexslider({
						selector: '.slider-wrap > .slide',
						animation: elAnimation,
						easing: elEasing,
						direction: elDirection,
						reverse: elReverse,
						slideshow: elSlideshow,
						slideshowSpeed: elPause,
						animationSpeed: elSpeed,
						pauseOnHover: elHover,
						video: elVideo,
						controlNav: elPagi,
						directionNav: elArrows,
						smoothHeight: elSheight,
						useCSS: elUseCSS,
						touch: elTouch,
						start: function( slider ){
							__modules.animations();
							__modules.lightbox();

							$flex.find('.flex-prev').html('<i class="' + elArrowLeft + '"></i>');
							$flex.find('.flex-next').html('<i class="' + elArrowRight + '"></i>');

							setTimeout( function(){
								var $iso = slider.parents('.grid-container.has-init-isotope');
								if( $iso.length > 0 ) $iso.isotope('layout');
							}, 1200);

							if( typeof skrollrInstance !== 'undefined' ) {
								skrollrInstance.refresh();
							}
						},
						after: function( slider ){
							var $iso = slider.parents('.grid-container.has-init-isotope');
							if( $iso.length > 0 && !slider.hasClass('flexslider-grid-relayout') ) {
								$iso.isotope('layout');
								slider.addClass('flexslider-grid-relayout');
							}
							jQuery('.menu-item:visible').find('.flexslider .slide').resize();
						}
					});
				});
			});
		}
	};
}();
