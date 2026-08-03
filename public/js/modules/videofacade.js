CNVS.VideoFacade = function() {
	var __core = SEMICOLON.Core;

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.initFunction({ class: 'has-plugin-videofacade', event: 'pluginVideoFacadeReady' });

			selector = __core.getSelector( selector, false );
			if( !selector || selector.length < 1 ) return true;

			selector.forEach( function(element) {
				if( !__core.markOnce(element, 'cnvsVideofacadeBound') ) return;

				element.addEventListener('click', function(e) {
					e.preventDefault();

					var videoContent = element.getAttribute('data-video-html');
					if( !videoContent ) return;

					var videoRatio = element.getAttribute('data-video-ratio') || 'ratio ratio-16x9',
						videoPreviewEl = element.querySelector('.video-facade-preview'),
						videoContentEl = element.querySelector('.video-facade-content');

					if( !videoContentEl ) return;
					if( !__core.markOnce(element, 'cnvsVideofacadeLoaded') ) return;

					if( videoPreviewEl ) videoPreviewEl.classList.add('d-none');

					videoContentEl.insertAdjacentHTML('beforeend', videoContent);

					videoRatio.split(/\s+/).filter(Boolean).forEach( function(ratioClass) {
						videoContentEl.classList.add(ratioClass);
					});
				});
			});
		}
	};
}();
