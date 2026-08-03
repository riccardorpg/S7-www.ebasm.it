CNVS.ReadMore = function() {
	var __core = SEMICOLON.Core;
	var __modules = SEMICOLON.Modules;

	var _HEXtoRGBA = function(hex, op) {
		if( /^#([A-Fa-f0-9]{3}){1,2}$/.test(hex) ){
			var c = hex.substring(1).split('');
			if( c.length === 3 ) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
			c = '0x' + c.join('');
			return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + op + ')';
		}
		return 'rgba(255,255,255,' + op + ')';
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.initFunction({ class: 'has-plugin-readmore', event: 'pluginReadMoreReady' });

			selector = __core.getSelector( selector, false );
			if( selector.length < 1 ) return true;

			selector.forEach( function(element) {
				var elSize     = element.getAttribute('data-readmore-size') || '10rem',
					elSpeed    = Number(element.getAttribute('data-readmore-speed')) || 500,
					elScrollUp = element.getAttribute('data-readmore-scrollup') === 'true',
					elTrigger  = element.getAttribute('data-readmore-trigger') || '.read-more-trigger',
					elTriggerO = element.getAttribute('data-readmore-trigger-open') || 'Read More',
					elTriggerC = element.getAttribute('data-readmore-trigger-close') || 'Read Less';

				element.style.height = '';
				element.classList.remove('read-more-wrap-open');

				var elHeight = element.offsetHeight;
				var elTriggerElement = element.querySelector(elTrigger);
				if( !elTriggerElement ) return;

				elTriggerElement.classList.remove('d-none');
				var elHeightN = elHeight + elTriggerElement.offsetHeight;

				elTriggerElement.innerHTML = elTriggerO;

				element.classList.add('read-more-wrap');
				element.style.height = elSize;
				element.style.transitionDuration = elSpeed + 'ms';

				var elMask = element.querySelector('.read-more-mask');
				if( !elMask ) {
					elMask = document.createElement('div');
					elMask.className = 'read-more-mask';
					element.appendChild(elMask);
				}

				var elMaskD     = element.getAttribute('data-readmore-mask') !== 'false',
					elMaskColor = element.getAttribute('data-readmore-maskcolor') || '#FFF',
					elMaskSize  = element.getAttribute('data-readmore-masksize') || '100%';

				if( elMaskD ) {
					elMask.style.height = elMaskSize;
					elMask.style.backgroundImage = 'linear-gradient(' + _HEXtoRGBA(elMaskColor, 0) + ', ' + _HEXtoRGBA(elMaskColor, 1) + ')';
					elMask.classList.remove('d-none');
					elMask.classList.add('op-ts', 'op-1');
				} else {
					elMask.classList.add('d-none');
				}

				var clickHandler = function(e) {
					e.preventDefault();

					if( element.classList.contains('read-more-wrap-open') ) {
						element.style.height = elSize;
						element.classList.remove('read-more-wrap-open');
						elTriggerElement.innerHTML = elTriggerO;
						setTimeout( function() {
							if( elScrollUp ) {
								__core.scrollTo((element.offsetTop - __core.getVars.topScrollOffset), false, false);
							}
						}, elSpeed);
						if( elMaskD ) {
							elMask.classList.remove('op-0');
							elMask.classList.add('op-ts', 'op-1');
						}
					} else {
						if( elTriggerC === 'false' ) {
							elTriggerElement.classList.add('d-none');
						}
						element.style.height = elHeightN + 'px';
						element.style.overflow = '';
						element.classList.add('read-more-wrap-open');
						elTriggerElement.innerHTML = elTriggerC;
						if( elMaskD ) {
							elMask.classList.remove('op-1');
							elMask.classList.add('op-0');
						}
					}
				};

				__core.rebind(elTriggerElement, 'click', clickHandler, 'readmore.trigger');
			});

			__core.getVars.resizers.readmore = __core.debounce(function() {
				__modules.readmore();
			}, 200);
		}
	};
}();
