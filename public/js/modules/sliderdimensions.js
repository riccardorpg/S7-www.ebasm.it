CNVS.SliderDimensions = function() {
	var __core = SEMICOLON.Core;
	var __base = SEMICOLON.Base;

	return {
		init: function(selector) {
			selector = __core.getSelector( selector, false );
			if( !selector || selector.length < 1 ){
				return true;
			}

			var slider = document.querySelector('.slider-element');
			if( !slider ) return true;

			var sliderParallaxEl = document.querySelector('.slider-parallax'),
				body             = __core.getVars.elBody,
				parallaxElHeight = sliderParallaxEl ? sliderParallaxEl.offsetHeight : 0,
				parallaxElWidth  = sliderParallaxEl ? sliderParallaxEl.offsetWidth : 0,
				slInner          = sliderParallaxEl ? sliderParallaxEl.querySelector('.slider-inner') : null,
				slSwiperW        = slider.querySelector('.swiper-wrapper'),
				slSwiperS        = slider.querySelector('.swiper-slide'),
				slFlexHeight     = slider.classList.contains('h-auto') || slider.classList.contains('min-vh-0');

			if( body.classList.contains('device-up-lg') ) {
				setTimeout(function() {
					if( slInner ) {
						slInner.style.height = parallaxElHeight + 'px';
					}
					if( slFlexHeight ) {
						var innerEl = slider.querySelector('.slider-inner');
						var firstChild = innerEl ? innerEl.querySelector('*') : null;
						if( firstChild ) {
							parallaxElHeight = firstChild.offsetHeight;
							slider.style.height = parallaxElHeight + 'px';
							if( slInner ) {
								slInner.style.height = parallaxElHeight + 'px';
							}
						}
					}
				}, 500);

				if( slFlexHeight && slSwiperS && slSwiperW ) {
					var slSwiperFC = slSwiperS.querySelector('*');
					if( slSwiperFC && (slSwiperFC.classList.contains('container') || slSwiperFC.classList.contains('container-fluid')) ) {
						slSwiperFC = slSwiperFC.querySelector('*');
					}
					if( slSwiperFC && slSwiperFC.offsetHeight > slSwiperW.offsetHeight ) {
						slSwiperW.style.height = 'auto';
					}
				}

				if( body.classList.contains('side-header') && slInner ) {
					slInner.style.width = parallaxElWidth + 'px';
				}

				if( !body.classList.contains('stretched') ) {
					parallaxElWidth = __core.getVars.elWrapper.offsetWidth;
					if( slInner ) {
						slInner.style.width = parallaxElWidth + 'px';
					}
				}
			} else {
				if( slSwiperW ) {
					slSwiperW.style.height = '';
				}

				if( sliderParallaxEl ) {
					sliderParallaxEl.style.height = '';
				}

				if( slInner ) {
					slInner.style.width = '';
					slInner.style.height = '';
				}
			}

			__core.getVars.resizers.sliderdimensions = function() {
				__base.sliderDimensions();
			};
		}
	};
}();
