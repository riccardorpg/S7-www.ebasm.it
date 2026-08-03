CNVS.CanvasSlider = function() {
	var __core = SEMICOLON.Core;
	var __base = SEMICOLON.Base;
	var __modules = SEMICOLON.Modules;

	var _applyAnimation = function(el, baseDelay) {
		var toAnimateDelay = el.getAttribute('data-delay');
		var toAnimateDelayTime = toAnimateDelay ? Number(toAnimateDelay) + baseDelay : baseDelay;

		if( el.classList.contains('animated') ) return;
		el.classList.add('not-animated');

		var elementAnimation = el.getAttribute('data-animate');
		if( !elementAnimation ) return;

		setTimeout( function() {
			el.classList.remove('not-animated');
			(elementAnimation + ' animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
				el.classList.add(_class);
			});
		}, toAnimateDelayTime);
	};

	var _resetNonActiveAnimations = function(element) {
		element.querySelectorAll('[data-animate]').forEach( function(el) {
			var slide = el.closest('.swiper-slide');
			if( slide && slide.classList.contains('swiper-slide-active') ) return;
			var elementAnimation = el.getAttribute('data-animate');
			if( elementAnimation ) {
				(elementAnimation + ' animated').split(/\s+/).filter(Boolean).forEach( function(_class) {
					el.classList.remove(_class);
				});
			}
			el.classList.add('not-animated');
		});
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.requirePlugin({
				file: 'plugins.swiper.js',
				id: 'canvas-swiper-js',
				check: function() { return typeof Swiper !== 'undefined'; },
				class: 'has-plugin-swiper',
				event: 'pluginSwiperReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector, false );
				if( selector.length < 1 ) return;

				selector.forEach( function(element) {
					if( !element.classList.contains('swiper_wrapper') ) return;
					if( element.querySelectorAll('.swiper-slide').length < 1 ) return;

					var swiperParent = element.querySelector('.swiper-parent');
					if( !swiperParent ) return;

					if( swiperParent.swiper && typeof swiperParent.swiper.destroy === 'function' ) {
						swiperParent.swiper.destroy(true, true);
					}

					var elDirection = element.getAttribute('data-direction') || 'horizontal',
						elSpeed = element.getAttribute('data-speed') || 300,
						elAutoPlayRaw = element.getAttribute('data-autoplay'),
						elAutoPlayDisableOnInteraction = element.getAttribute('data-autoplay-disable-on-interaction'),
						elPauseOnHover = element.getAttribute('data-hover') === 'true',
						elLoop = element.getAttribute('data-loop') === 'true',
						elStart = element.getAttribute('data-start') || 1,
						elEffect = element.getAttribute('data-effect') || 'slide',
						elGrabCursor = element.getAttribute('data-grab') !== 'false',
						elParallax = element.getAttribute('data-parallax') === 'true',
						elAutoHeight = element.getAttribute('data-autoheight') === 'true',
						slideNumberTotal = element.querySelector('.slide-number-total'),
						slideNumberCurrent = element.querySelector('.slide-number-current'),
						elVideoAutoPlay = element.getAttribute('data-video-autoplay') !== 'false';

					var disableOnInteraction = elAutoPlayDisableOnInteraction === 'false' ? false : true;
					var autoplayConfig = elAutoPlayRaw
						? { delay: Number(elAutoPlayRaw), pauseOnMouseEnter: elPauseOnHover, disableOnInteraction: disableOnInteraction }
						: false;

					var realSlides = element.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)');
					elStart = elStart == 'random'
						? Math.floor( Math.random() * realSlides.length )
						: Number( elStart ) - 1;

					var elPagination = element.querySelector('.swiper-pagination');
					var elementNavNext = element.querySelector('.slider-arrow-right');
					var elementNavPrev = element.querySelector('.slider-arrow-left');
					var elementScollBar = element.querySelector('.swiper-scrollbar');

					var hasJQ = function() { return typeof jQuery !== 'undefined'; };

					var playActiveYTVideo = function() {
						if( !hasJQ() ) return;
						var active = element.querySelector('.swiper-slide-active .yt-bg-player.mb_YTPlayer:not(.customjs)');
						if( active ) {
							try { jQuery(active).YTPPlay(); } catch(e) {}
						}
					};

					var cnvsSwiper = new Swiper( swiperParent, {
						direction: elDirection,
						speed: Number( elSpeed ),
						autoplay: autoplayConfig,
						loop: elLoop,
						initialSlide: elStart,
						effect: elEffect,
						parallax: elParallax,
						slidesPerView: 1,
						grabCursor: elGrabCursor,
						autoHeight: elAutoHeight,
						pagination: elPagination ? { el: elPagination, clickable: true } : false,
						navigation: (elementNavPrev || elementNavNext) ? { prevEl: elementNavPrev, nextEl: elementNavNext } : false,
						scrollbar: elementScollBar ? { el: elementScollBar } : false,
						on: {
							afterInit: function(swiper) {
								__base.sliderDimensions();

								if( element.querySelectorAll('.yt-bg-player').length > 0 ) {
									element.querySelectorAll('.yt-bg-player').forEach( function(el) {
										el.setAttribute('data-autoplay', 'false');
										el.classList.remove('customjs');
									});

									__modules.youtubeBgVideo();

									if( hasJQ() ) {
										var activeYTVideo = jQuery(element).find('.swiper-slide-active .yt-bg-player:not(.customjs)');
										activeYTVideo.on('YTPReady', function() {
											setTimeout( function() {
												activeYTVideo.filter('.mb_YTPlayer').YTPPlay();
											}, 1200);
										});
									}
								}

								element.querySelectorAll('.swiper-slide-active [data-animate]').forEach( function(el) {
									_applyAnimation(el, 750);
								});

								_resetNonActiveAnimations(element);

								if( elAutoHeight ) {
									setTimeout( function() {
										swiper.updateAutoHeight(300);
									}, 1000);
								}
							},
							transitionStart: function() {
								_resetNonActiveAnimations(element);
								__base.sliderMenuClass();
							},
							transitionEnd: function(swiper) {
								if( slideNumberCurrent ) {
									var active = element.querySelector('.swiper-slide.swiper-slide-active');
									if( elLoop && active ) {
										slideNumberCurrent.innerHTML = Number( active.getAttribute('data-swiper-slide-index') ) + 1;
									} else {
										slideNumberCurrent.innerHTML = swiper.activeIndex + 1;
									}
								}

								element.querySelectorAll('.swiper-slide').forEach( function(slide) {
									var video = slide.querySelector('video');
									if( video && elVideoAutoPlay ) {
										video.pause();
									}
									if( hasJQ() ) {
										var ytActive = slide.querySelector('.yt-bg-player.mb_YTPlayer:not(.customjs)');
										if( ytActive ) {
											try { jQuery(ytActive).YTPPause(); } catch(e) {}
										}
									}
								});

								element.querySelectorAll('.swiper-slide:not(.swiper-slide-active)').forEach( function(slide) {
									var video = slide.querySelector('video');
									if( video && video.currentTime !== 0 ) {
										video.currentTime = 0;
									}
									if( hasJQ() ) {
										var ytPlayer = slide.querySelector('.yt-bg-player.mb_YTPlayer:not(.customjs)');
										if( ytPlayer ) {
											try { jQuery(ytPlayer).YTPSeekTo( ytPlayer.getAttribute('data-start') ); } catch(e) {}
										}
									}
								});

								var activeSlide = element.querySelector('.swiper-slide.swiper-slide-active');
								if( activeSlide && elVideoAutoPlay ) {
									var activeVideo = activeSlide.querySelector('video');
									if( activeVideo ) activeVideo.play();
									playActiveYTVideo();
								}

								element.querySelectorAll('.swiper-slide.swiper-slide-active [data-animate]').forEach( function(el) {
									_applyAnimation(el, 300);
								});
							}
						}
					});

					if( slideNumberCurrent ) {
						if( elLoop ) {
							slideNumberCurrent.innerHTML = cnvsSwiper.realIndex + 1;
						} else {
							slideNumberCurrent.innerHTML = cnvsSwiper.activeIndex + 1;
						}
					}

					if( slideNumberTotal ) {
						slideNumberTotal.innerHTML = realSlides.length;
					}
				});
			});
		}
	};
}();
