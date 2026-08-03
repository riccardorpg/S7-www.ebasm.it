CNVS.OnePage = function() {
	var __core = SEMICOLON.Core;

	var _rafPending = false;
	var _lastActive = null;

	var _init = function() {
		_hash();

		if( __core.getVars.elLinkScrolls ) {
			__core.getVars.elLinkScrolls.forEach( function(el) {
				_getSettings( el, 'scrollTo' );

				el.onclick = function(e) {
					e.preventDefault();

					_scroller( el, 'scrollTo', true );
				};
			});
		}

		if( __core.getVars.elOnePageMenus ) {
			__core.getVars.elOnePageMenus.forEach( function(onePageMenu) {
				__core.getVars.elOnePageActiveClass = onePageMenu.getAttribute('data-active-class') || 'current';
				__core.getVars.elOnePageParentSelector = onePageMenu.getAttribute('data-parent') || 'li';
				__core.getVars.elOnePageActiveOnClick = onePageMenu.getAttribute('data-onclick-active') || 'false';

				onePageMenu.querySelectorAll('[data-href]').forEach( function(el) {
					_getSettings( el, 'onePage' );

					el.onclick = function(e) {
						e.preventDefault();

						_scroller( el, 'onePage', true );
					};
				});
			});
		}
	};

	var _hash = function() {
		if( __core.getOptions.scrollExternalLinks != true ) {
			return false;
		}

		if( document.querySelector('a[data-href="'+ __core.getVars.hash +'"]') || document.querySelector('a[data-scrollto="'+ __core.getVars.hash +'"]') ) {
			var onBeforeUnload = function() {
				__core.scrollTo(0, 0, false, 'auto');
			};
			window.addEventListener('beforeunload', onBeforeUnload, { once: true });

			__core.scrollTo(0, 0, false, 'auto');

			var section = document.querySelector(__core.getVars.hash);

			if( section ) {
				var int = setInterval( function() {
					var settings = section.getAttribute('data-onepage-settings') && JSON.parse( section.getAttribute('data-onepage-settings') );

					if( settings ) {
						if( __core.getVars.hashScroll != 1 ) {
							_scroll(section, settings, 0);
						}

						__core.getVars.hashScroll = 1;
						clearInterval(int);
					}
				}, 250);
			}
		}
	};

	var _getSection = function(el, type) {
		var anchor;

		if( type == 'scrollTo' ) {
			anchor = el.getAttribute('data-scrollto');
		} else {
			anchor = el.getAttribute('data-href');
		}

		var section;
		try {
			section = document.querySelector( anchor );
		} catch(e) {
			section = null;
		}

		return section;
	};

	var _getSettings = function(el, type) {
		var section = _getSection(el, type);

		if( !section ) {
			return false;
		}

		section.removeAttribute('data-onepage-settings');

		var settings = _settings( section, el );

		setTimeout( function() {
			if( !section.hasAttribute('data-onepage-settings') && settings ) {
				section.setAttribute( 'data-onepage-settings', JSON.stringify( settings ) );
			}

			__core.getVars.pageSectionEls = document.querySelectorAll('[data-onepage-settings]');
		}, 1000);
	};

	var _scroller = function(el, type, clicker = false) {
		var section = _getSection(el, type);

		if( !section ) {
			return false;
		}

		var sectionId = section.getAttribute('id'),
			settings;

		if( clicker == true ) {
			settings = _settings(section, el, false);
		} else {
			settings = JSON.parse(section.getAttribute('data-onepage-settings'));
		}

		if( type != 'scrollTo' && __core.getVars.elOnePageActiveOnClick == 'true' ) {
			var parentMenu = el.closest('.one-page-menu');

			if( parentMenu ) {
				parentMenu.querySelectorAll(__core.getVars.elOnePageParentSelector).forEach( function(p) {
					p.classList.remove( __core.getVars.elOnePageActiveClass );
				});

				parentMenu.querySelector('a[data-href="#' + sectionId + '"]')?.closest(__core.getVars.elOnePageParentSelector)?.classList.add( __core.getVars.elOnePageActiveClass );
			}
		}

		if( !__core.getVars.elBody.classList.contains('is-expanded-menu') || __core.getVars.elBody.classList.contains('overlay-menu') ) {
			__core.getVars.recalls.menureset();
		}

		_scroll(section, settings, 250);
	};

	var _scroll = function(section, settings, timeout) {
		setTimeout( function() {
			if( !settings || typeof settings !== 'object' ) {
				return false;
			}

			var sectionOffset = __core.offset(section).top;

			__core.scrollTo((sectionOffset - Number(settings.offset)), settings.speed, settings.easing);
		}, Number(timeout));
	};

	var _position = function() {
		_rafPending = false;

		var current = _current();
		if( current === _lastActive ) return;
		_lastActive = current;

		__core.getVars.elOnePageMenus && __core.getVars.elOnePageMenus.forEach( function(el) {
			el.querySelectorAll('[data-href]').forEach( function(item) {
				item.closest(__core.getVars.elOnePageParentSelector)?.classList.remove( __core.getVars.elOnePageActiveClass );
			});
		});

		if( !current ) return;

		__core.getVars.elOnePageMenus && __core.getVars.elOnePageMenus.forEach( function(el) {
			el.querySelector('[data-href="#' + current + '"]')?.closest(__core.getVars.elOnePageParentSelector)?.classList.add( __core.getVars.elOnePageActiveClass );
		});
	};

	var _requestPosition = function() {
		if( _rafPending ) return;
		_rafPending = true;
		window.requestAnimationFrame(_position);
	};

	var _current = function() {
		var currentOnePageSection = null;

		if( typeof __core.getVars.pageSectionEls === 'undefined' ) {
			return null;
		}

		__core.getVars.pageSectionEls.forEach( function(el) {
			var settings = el.getAttribute('data-onepage-settings') && JSON.parse( el.getAttribute('data-onepage-settings') );

			if( settings ) {
				var h = __core.offset(el).top - settings.offset - 5,
					y = window.scrollY;

				if( ( y >= h ) && ( y < h + el.offsetHeight ) && el.getAttribute('id') != currentOnePageSection && el.getAttribute('id') ) {
					currentOnePageSection = el.getAttribute('id');
				}
			}
		});

		return currentOnePageSection;
	};

	var _settings = function(section, element, json=true) {
		var body = __core.getVars.elBody.classList;

		if( typeof section === 'undefined' || !element ) {
			return null;
		}

		if( section.hasAttribute('data-onepage-settings') && json ) {
			return null;
		}

		var defaults = {
			offset: __core.getVars.topScrollOffset,
			speed: 1250,
			easing: false
		};

		var settings = {},
			parentSettings = {},
			parent = element.closest( '.one-page-menu' );

		parentSettings.offset = parent?.getAttribute( 'data-offset' ) || defaults.offset;
		parentSettings.speed = parent?.getAttribute( 'data-speed' ) || defaults.speed;
		parentSettings.easing = parent?.getAttribute( 'data-easing' ) || defaults.easing;

		var elementSettings = {
			offset: element.getAttribute( 'data-offset' ) || parentSettings.offset,
			speed: element.getAttribute( 'data-speed' ) || parentSettings.speed,
			easing: element.getAttribute( 'data-easing' ) || parentSettings.easing,
		};

		var elOffsetXXL = element.getAttribute( 'data-offset-xxl' ),
			elOffsetXL = element.getAttribute( 'data-offset-xl' ),
			elOffsetLG = element.getAttribute( 'data-offset-lg' ),
			elOffsetMD = element.getAttribute( 'data-offset-md' ),
			elOffsetSM = element.getAttribute( 'data-offset-sm' ),
			elOffsetXS = element.getAttribute( 'data-offset-xs' );

		if( !elOffsetXS ) elOffsetXS = Number(elementSettings.offset);
		if( !elOffsetSM ) elOffsetSM = Number(elOffsetXS);
		if( !elOffsetMD ) elOffsetMD = Number(elOffsetSM);
		if( !elOffsetLG ) elOffsetLG = Number(elOffsetMD);
		if( !elOffsetXL ) elOffsetXL = Number(elOffsetLG);
		if( !elOffsetXXL ) elOffsetXXL = Number(elOffsetXL);

		if( body.contains('device-xs') ) elementSettings.offset = elOffsetXS;
		else if( body.contains('device-sm') ) elementSettings.offset = elOffsetSM;
		else if( body.contains('device-md') ) elementSettings.offset = elOffsetMD;
		else if( body.contains('device-lg') ) elementSettings.offset = elOffsetLG;
		else if( body.contains('device-xl') ) elementSettings.offset = elOffsetXL;
		else if( body.contains('device-xxl') ) elementSettings.offset = elOffsetXXL;

		settings.offset = Number(elementSettings.offset);
		settings.speed = Number(elementSettings.speed);
		settings.easing = elementSettings.easing;

		return settings;
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.initFunction({ class: 'has-plugin-onepage', event: 'pluginOnePageReady' });

			selector = __core.getSelector( selector, false );
			if( selector.length < 1 ){
				return true;
			}

			var scrollToLinks = __core.filtered( selector, '[data-scrollto]' ),
				onePageLinks = __core.filtered( selector, '.one-page-menu' );

			if( scrollToLinks.length > 0 ) {
				__core.getVars.elLinkScrolls = scrollToLinks;
			}

			if( onePageLinks.length > 0 ) {
				__core.getVars.elOnePageMenus = onePageLinks;
			}

			_init();
			_position();

			window.addEventListener('scroll', _requestPosition, { passive: true });

			__core.getVars.resizers.onepage = function() {
				_init();
				_position();
			};
		}
	};
}();
