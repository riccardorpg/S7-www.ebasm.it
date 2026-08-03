CNVS.GoogleMaps = function() {
	var __core = SEMICOLON.Core;

	var _parseAttr = function(raw, attrName) {
		if( !raw ) return null;
		try { return JSON.parse(raw); } catch(e) {}
		try {
			console.warn('Canvas GoogleMaps: "' + attrName + '" is not valid JSON — falling back to JS-literal evaluation. Migrate to JSON for CSP compliance.');
			return Function('return ' + raw)();
		} catch(e) {
			console.error('Canvas GoogleMaps: failed to parse "' + attrName + '":', e);
			return null;
		}
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			if( !__core.getOptions.gmapAPI ) {
				console.warn('No API Key defined for Google Maps! Please set an API Key in js/functions.js File!');
				__core.getSelector( selector, false ).forEach( function(el) {
					if( el.dataset.cnvsGmapError === '1' ) return;
					el.dataset.cnvsGmapError = '1';
					var notice = document.createElement('div');
					notice.className = 'alert alert-warning text-center mb-0 h-100 d-flex align-items-center justify-content-center';
					notice.innerHTML = '<div><strong>Google Maps API Key Missing</strong><br><small>Set <code>gmapAPI</code> in <code>js/functions.js</code> or <code>cnvsOptions</code>.</small></div>';
					el.innerHTML = '';
					el.appendChild(notice);
				});
				return true;
			}

			__core.loadJS({ file: 'https://maps.google.com/maps/api/js?key=' + __core.getOptions.gmapAPI + '&callback=SEMICOLON.Modules.gmap', id: 'canvas-gmapapi-js' });

			__core.requirePlugin({
				file: 'plugins.gmap.js',
				id: 'canvas-gmap-js',
				check: function() { return typeof jQuery !== 'undefined' && typeof google !== 'undefined' && jQuery().gMap; },
				class: 'has-plugin-gmap',
				event: 'pluginGmapReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector );
				if( selector.length < 1 ) return;

				selector.each( function() {
					var element = jQuery(this);
					var rawEl = element[0];
					if( rawEl.dataset.cnvsGmapInit === '1' ) return;

					var elLat       = element.attr('data-latitude');
					var elLon       = element.attr('data-longitude');
					var elAdd       = element.attr('data-address');
					var elCon       = element.attr('data-content');
					var elScroll    = element.attr('data-scrollwheel') !== 'false';
					var elType      = element.attr('data-maptype') || 'ROADMAP';
					var elZoom      = Number(element.attr('data-zoom')) || 12;
					var elStylesRaw = element.attr('data-styles');
					var elMarkersRaw = element.attr('data-markers');
					var elIconRaw   = element.attr('data-icon');

					var elConPan      = element.attr('data-control-pan') === 'true';
					var elConZoom     = element.attr('data-control-zoom') === 'true';
					var elConMapT     = element.attr('data-control-maptype') === 'true';
					var elConScale    = element.attr('data-control-scale') === 'true';
					var elConStreetV  = element.attr('data-control-streetview') === 'true';
					var elConOverview = element.attr('data-control-overview') === 'true';

					if( elAdd ) {
						elLat = elLon = false;
					} else if( !elLat && !elLon ) {
						console.log('Google Map co-ordinates not entered.');
						return;
					}

					var elStyles = elStylesRaw ? _parseAttr(elStylesRaw, 'data-styles') : null;

					var elMarkers;
					if( elMarkersRaw ) {
						elMarkers = _parseAttr(elMarkersRaw, 'data-markers') || [];
					} else if( elAdd ) {
						elMarkers = [{ address: elAdd, html: elCon || elAdd }];
					} else {
						elMarkers = [{ latitude: elLat, longitude: elLon, html: elCon || false }];
					}

					var elIcon = elIconRaw ? _parseAttr(elIconRaw, 'data-icon') : null;
					if( !elIcon ) {
						elIcon = {
							image: 'https://www.google.com/mapfiles/marker.png',
							shadow: 'https://www.google.com/mapfiles/shadow50.png',
							iconsize: [20, 34],
							shadowsize: [37, 34],
							iconanchor: [9, 34],
							shadowanchor: [19, 34]
						};
					}

					element.gMap({
						controls: {
							panControl: elConPan,
							zoomControl: elConZoom,
							mapTypeControl: elConMapT,
							scaleControl: elConScale,
							streetViewControl: elConStreetV,
							overviewMapControl: elConOverview
						},
						scrollwheel: elScroll,
						maptype: elType,
						markers: elMarkers,
						icon: elIcon,
						latitude: elLat,
						longitude: elLon,
						address: elAdd,
						zoom: elZoom,
						styles: elStyles
					});

					rawEl.dataset.cnvsGmapInit = '1';
				});
			});
		}
	};
}();
