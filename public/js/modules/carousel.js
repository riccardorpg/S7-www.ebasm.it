CNVS.Carousel = function() {
	var __core = SEMICOLON.Core;
	var __base = SEMICOLON.Base;

	var _lazyHandlers = new WeakMap();

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.requirePlugin({
				file: 'plugins.carousel.js',
				id: 'canvas-carousel-js',
				check: function() { return typeof jQuery !== 'undefined' && jQuery().owlCarousel; },
				class: 'has-plugin-carousel',
				event: 'pluginCarouselReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector );
				if( selector.length < 1 ) return;

				selector.each( function(){
					var element = jQuery(this);
					var rawEl = element[0];

					var prevHandler = _lazyHandlers.get(rawEl);
					if( prevHandler ) {
						jQuery(window).off('lazyLoadLoaded', prevHandler);
					}

					if( element.data('owl.carousel') ) {
						element.trigger('destroy.owl.carousel');
					}

					var elItems = element.attr('data-items') || 4,
						elItemsXs = element.attr('data-items-xs') || Number(elItems),
						elItemsSm = element.attr('data-items-sm') || Number(elItemsXs),
						elItemsMd = element.attr('data-items-md') || Number(elItemsSm),
						elItemsLg = element.attr('data-items-lg') || Number(elItemsMd),
						elItemsXl = element.attr('data-items-xl') || Number(elItemsLg),
						elItemsXxl = element.attr('data-items-xxl') || Number(elItemsXl),
						elLoop = element.attr('data-loop') === 'true',
						elAutoPlayRaw = element.attr('data-autoplay'),
						elSpeed = Number(element.attr('data-speed')) || 250,
						elAnimateIn = element.attr('data-animate-in') || false,
						elAnimateOut = element.attr('data-animate-out') || false,
						elAutoWidth = element.attr('data-auto-width') === 'true',
						elNav = element.attr('data-nav') !== 'false',
						elNavPrev = element.attr('data-nav-prev') || '<i class="uil uil-angle-left-b"></i>',
						elNavNext = element.attr('data-nav-next') || '<i class="uil uil-angle-right-b"></i>',
						elPagi = element.attr('data-pagi') !== 'false',
						elMargin = Number(element.attr('data-margin')) || 20,
						elStage = Number(element.attr('data-stage-padding')) || 0,
						elMerge = element.attr('data-merge') === 'true',
						elStart = Number(element.attr('data-start')) || 0,
						elRewind = element.attr('data-rewind') === 'true',
						elSlideByRaw = element.attr('data-slideby') || 1,
						elCenter = element.attr('data-center') === 'true',
						elLazy = element.attr('data-lazyload') === 'true',
						elVideo = element.attr('data-video') === 'true',
						elRTL = element.attr('data-rtl') === 'true' || jQuery('body').hasClass('rtl');

					var elSlideBy = elSlideByRaw == 'page' ? 'page' : Number(elSlideByRaw);

					var elAutoPlay = false,
						elAutoPlayTime = 5000,
						elAutoPlayHoverP = false;
					if( elAutoPlayRaw ) {
						elAutoPlay = true;
						elAutoPlayTime = Number(elAutoPlayRaw);
						elAutoPlayHoverP = true;
					}

					var carousel = element.owlCarousel({
						margin: elMargin,
						loop: elLoop,
						stagePadding: elStage,
						merge: elMerge,
						startPosition: elStart,
						rewind: elRewind,
						slideBy: elSlideBy,
						center: elCenter,
						lazyLoad: elLazy,
						autoWidth: elAutoWidth,
						nav: elNav,
						navText: [elNavPrev, elNavNext],
						autoplay: elAutoPlay,
						autoplayTimeout: elAutoPlayTime,
						autoplayHoverPause: elAutoPlayHoverP,
						dots: elPagi,
						smartSpeed: elSpeed,
						fluidSpeed: elSpeed,
						video: elVideo,
						animateIn: elAnimateIn,
						animateOut: elAnimateOut,
						rtl: elRTL,
						responsive: {
							0: { items: Number(elItemsXs) },
							576: { items: Number(elItemsSm) },
							768: { items: Number(elItemsMd) },
							992: { items: Number(elItemsLg) },
							1200: { items: Number(elItemsXl) },
							1400: { items: Number(elItemsXxl) }
						},
						onInitialized: function(){
							var sliderEl = element.parents('.slider-element')[0];
							if( sliderEl ) {
								__base.sliderDimensions(sliderEl);
							}
							__core.runContainerModules(rawEl);

							if( element.find('.owl-dot').length > 0 ) {
								element.addClass('with-carousel-dots');
							}
						}
					});

					var lazyHandler = function() {
						if( element.find('.lazy').length === element.find('.lazy.lazy-loaded').length ) {
							if( typeof lazyLoadInstance !== 'undefined' && lazyLoadInstance ) {
								try { lazyLoadInstance.update(); } catch(e) {}
							}
							setTimeout( function() {
								carousel.trigger('refresh.owl.carousel');
							}, 500);
						}
					};
					jQuery(window).on('lazyLoadLoaded', lazyHandler);
					_lazyHandlers.set(rawEl, lazyHandler);
				});
			});
		}
	};
}();
