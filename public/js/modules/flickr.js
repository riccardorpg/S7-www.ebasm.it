CNVS.Flickr = function() {
	var __core = SEMICOLON.Core;
	var __modules = SEMICOLON.Modules;

	var _loadedHandlers = new WeakMap();

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.requirePlugin({
				file: 'plugins.flickrfeed.js',
				id: 'canvas-flickrfeed-js',
				check: function() { return typeof jQuery !== 'undefined' && jQuery().jflickrfeed; },
				class: 'has-plugin-flickr',
				event: 'pluginFlickrFeedReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector, true, false );
				if( selector.length < 1 ) return;

				selector.each(function() {
					var element = jQuery(this);
					var rawEl = element[0];

					if( rawEl.dataset.cnvsFlickrLoaded === '1' ) return;

					var elID = element.attr('data-id');
					if( !elID ) return;

					var elCount = Number(element.attr('data-count')) || 9;
					var elType = element.attr('data-type');
					var elTypeGet = elType === 'group' ? 'groups_pool.gne' : 'photos_public.gne';

					var prevHandler = _loadedHandlers.get(rawEl);
					if( prevHandler ) {
						rawEl.removeEventListener('CanvasImagesLoaded', prevHandler);
					}

					element.jflickrfeed({
						feedapi: elTypeGet,
						limit: elCount,
						qstrings: { id: elID },
						itemTemplate: '<a class="grid-item" href="{{image_b}}" title="{{title}}" data-lightbox="gallery-item">'
							+ '<img src="{{image_s}}" alt="{{title}}" />'
							+ '</a>'
					}, function() {
						rawEl.dataset.cnvsFlickrLoaded = '1';
						element.removeClass('customjs');
						__core.imagesLoaded(rawEl);
						__modules.lightbox();

						var onLoaded = function() {
							__modules.gridInit();
							__modules.masonryThumbs();
						};
						rawEl.addEventListener('CanvasImagesLoaded', onLoaded, { once: true });
						_loadedHandlers.set(rawEl, onLoaded);
					});
				});
			});
		}
	};
}();
