CNVS.Lightbox = function() {
	var __core = SEMICOLON.Core;

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.requirePlugin({
				file: 'plugins.lightbox.js',
				id: 'canvas-lightbox-js',
				check: function() { return typeof jQuery !== 'undefined' && jQuery().magnificPopup; },
				class: 'has-plugin-lightbox',
				event: 'pluginLightboxReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector );
				if( selector.length < 1 ) return;

				var closeButtonIcon = '<i class="bi-x-lg"></i>';

				var $body = jQuery('body');

				selector.each( function(){
					var element = jQuery(this);
					var rawEl = element[0];
					if( !__core.markOnce(rawEl, 'cnvsLightboxInit') ) return;

					var elType = element.attr('data-lightbox'),
						elCloseButton = element.attr('data-close-button') === 'inside',
						elDisableUnder = Number(element.attr('data-disable-under')) || 600,
						elFixedContent = element.attr('data-content-position') === 'fixed',
						elZoom = element.attr('data-zoom') === 'true';

					if( elType == 'image' ) {
						var settings = {
							type: 'image',
							tLoading: '',
							closeOnContentClick: true,
							closeBtnInside: elCloseButton,
							fixedContentPos: true,
							mainClass: 'mfp-no-margins mfp-fade',
							image: {
								verticalFit: true
							},
							closeIcon: closeButtonIcon,
						};

						if( elZoom ) {
							settings.zoom = {
								enabled: true,
								duration: 300,
								easing: 'ease-in-out',
								opener: function(openerElement) {
									return openerElement.is('img') ? openerElement : openerElement.find('img');
								}
							};
						}

						element.magnificPopup(settings);
					}

					if( elType == 'gallery' ) {
						if( element.find('a[data-lightbox="gallery-item"]').parent('.clone').hasClass('clone') ) {
							element.find('a[data-lightbox="gallery-item"]').parent('.clone').find('a[data-lightbox="gallery-item"]').attr('data-lightbox','');
						}

						if( element.find('a[data-lightbox="gallery-item"]').parents('.cloned').hasClass('cloned') ) {
							element.find('a[data-lightbox="gallery-item"]').parents('.cloned').find('a[data-lightbox="gallery-item"]').attr('data-lightbox','');
						}

						element.magnificPopup({
							delegate: element.hasClass('grid-container-filterable') ? 'a.grid-lightbox-filtered[data-lightbox="gallery-item"]' : 'a[data-lightbox="gallery-item"]',
							type: 'image',
							tLoading: '',
							closeOnContentClick: true,
							closeBtnInside: elCloseButton,
							fixedContentPos: true,
							mainClass: 'mfp-no-margins mfp-fade', // class to remove default margin from left and right side
							image: {
								verticalFit: true
							},
							gallery: {
								enabled: true,
								navigateByImgClick: true,
								preload: [0,1] // Will preload 0 - before current, and 1 after the current image
							},
							closeIcon: closeButtonIcon,
						});
					}

					if( elType == 'iframe' ) {
						element.magnificPopup({
							disableOn: elDisableUnder,
							type: 'iframe',
							tLoading: '',
							removalDelay: 160,
							preloader: false,
							closeBtnInside: elCloseButton,
							fixedContentPos: elFixedContent,
							closeIcon: closeButtonIcon,
						});
					}

					if( elType == 'inline' ) {
						element.magnificPopup({
							type: 'inline',
							tLoading: '',
							mainClass: 'mfp-no-margins mfp-fade',
							closeBtnInside: elCloseButton,
							fixedContentPos: true,
							overflowY: 'scroll',
							closeIcon: closeButtonIcon,
						});
					}

					if( elType == 'ajax' ) {
						element.magnificPopup({
							type: 'ajax',
							tLoading: '',
							closeBtnInside: elCloseButton,
							autoFocusLast: false,
							closeIcon: closeButtonIcon,
							callbacks: {
								ajaxContentAdded: function(mfpResponse) {
									__core.runContainerModules( document.querySelector('.mfp-content') );
								},
								open: function() {
									$body.addClass('ohidden');
								},
								close: function() {
									$body.removeClass('ohidden');
								}
							}
						});
					}

					if( elType == 'ajax-gallery' ) {
						element.magnificPopup({
							delegate: 'a[data-lightbox="ajax-gallery-item"]',
							type: 'ajax',
							tLoading: '',
							closeBtnInside: elCloseButton,
							closeIcon: closeButtonIcon,
							autoFocusLast: false,
							gallery: {
								enabled: true,
								preload: 0,
								navigateByImgClick: false
							},
							callbacks: {
								ajaxContentAdded: function(mfpResponse) {
									__core.runContainerModules( document.querySelector('.mfp-content') );
								},
								open: function() {
									$body.addClass('ohidden');
								},
								close: function() {
									$body.removeClass('ohidden');
								}
							}
						});
					}

					element.off('mfpOpen.cnvs').on('mfpOpen.cnvs', function(){
						var instance = jQuery.magnificPopup.instance;
						if( !instance ) return;

						var lightboxItem = instance.currItem?.el || instance.st?.el || element;
						var $item = jQuery(lightboxItem);
						var lightboxClass = $item.attr('data-lightbox-class');
						var lightboxBgClass = $item.attr('data-lightbox-bg-class');

						if( lightboxClass && instance.container ) {
							jQuery(instance.container).addClass(lightboxClass);
						}

						if( lightboxBgClass && instance.bgOverlay ) {
							jQuery(instance.bgOverlay).addClass(lightboxBgClass);
						}
					});
				});
			});
		}
	};
}();
