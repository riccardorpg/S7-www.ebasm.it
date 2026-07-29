CNVS.Instagram = function() {
	var __core = SEMICOLON.Core;
	var __modules = SEMICOLON.Modules;

	var _loadedHandlers = new WeakMap();

	var _get = function(element, loader, limit, fetchAlert) {
		var alert = document.createElement('div');
		alert.className = 'alert alert-warning instagram-widget-alert text-center';
		element.insertAdjacentElement('beforebegin', alert);

		var spinner = document.createElement('div');
		spinner.className = 'spinner-grow spinner-grow-sm me-2';
		spinner.setAttribute('role', 'status');
		var hidden = document.createElement('span');
		hidden.className = 'visually-hidden';
		hidden.textContent = 'Loading...';
		spinner.appendChild(hidden);
		alert.appendChild(spinner);
		alert.appendChild(document.createTextNode(' ' + fetchAlert));

		fetch(loader).then( function(response) {
			if( !response.ok ) throw new Error('HTTP ' + response.status);
			return response.json();
		}).then( function(images) {
			alert.remove();
			if( !Array.isArray(images) || images.length === 0 ) return;

			var count = Math.min(images.length, limit);
			for( var i = 0; i < count; i++ ) {
				var photo = images[i];
				if( !photo ) continue;
				var thumb = photo.media_type === 'VIDEO' ? photo.thumbnail_url : photo.media_url;
				if( !thumb || !photo.permalink ) continue;

				var a = document.createElement('a');
				a.className = 'grid-item';
				a.setAttribute('href', photo.permalink);
				a.setAttribute('target', '_blank');
				a.setAttribute('rel', 'noopener noreferrer');
				var img = document.createElement('img');
				img.setAttribute('src', thumb);
				img.setAttribute('alt', 'Image');
				a.appendChild(img);
				element.appendChild(a);
			}

			element.classList.remove('customjs');
			__core.imagesLoaded(element);

			var prevHandler = _loadedHandlers.get(element);
			if( prevHandler ) {
				element.removeEventListener('CanvasImagesLoaded', prevHandler);
			}
			var onLoaded = function() {
				__modules.masonryThumbs();
				__modules.lightbox();
			};
			element.addEventListener('CanvasImagesLoaded', onLoaded, { once: true });
			_loadedHandlers.set(element, onLoaded);
		}).catch( function(err) {
			console.log(err);
			alert.classList.remove('alert-warning');
			alert.classList.add('alert-danger');
			alert.textContent = 'Could not fetch Photos from Instagram API. Please try again later.';
		});
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.initFunction({ class: 'has-plugin-instagram', event: 'pluginInstagramReady' });

			selector = __core.getSelector( selector, false, false );
			if( selector.length < 1 ) return true;

			selector.forEach( function(element) {
				if( !__core.markOnce(element, 'cnvsInstagramLoaded') ) return;

				var elLimit = Math.min(Number(element.getAttribute('data-count')) || 12, 12);
				var elLoader = element.getAttribute('data-loader') || 'include/instagram/instagram.php';
				var elFetch = element.getAttribute('data-fetch-message') || 'Fetching Photos from Instagram...';

				_get(element, elLoader, elLimit, elFetch);
			});
		}
	};
}();
