CNVS.ResizeVideos = function() {
	var __core = SEMICOLON.Core;

	var _wrapVideo = function(iframe) {
		if( !iframe || iframe.dataset.cnvsFluidWrapped === '1' ) return;
		if( iframe.closest('.ratio') || iframe.closest('.fluid-width-video-wrapper') ) {
			iframe.dataset.cnvsFluidWrapped = '1';
			return;
		}
		if( iframe.classList.contains('no-fv') || iframe.closest('.no-fv') ) return;

		var widthAttr = parseFloat(iframe.getAttribute('width'));
		var heightAttr = parseFloat(iframe.getAttribute('height'));
		var width = isFinite(widthAttr) && widthAttr > 0 ? widthAttr : (iframe.clientWidth || 16);
		var height = isFinite(heightAttr) && heightAttr > 0 ? heightAttr : (iframe.clientHeight || 9);
		if( !width || !height ) { width = 16; height = 9; }

		var wrapper = document.createElement('div');
		wrapper.className = 'ratio fluid-width-video-wrapper';
		wrapper.style.setProperty('--bs-aspect-ratio', (height / width * 100) + '%');

		iframe.parentNode.insertBefore(wrapper, iframe);
		wrapper.appendChild(iframe);

		iframe.removeAttribute('width');
		iframe.removeAttribute('height');

		iframe.dataset.cnvsFluidWrapped = '1';
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.initFunction({ class: 'has-plugin-fitvids', event: 'pluginFitVidsReady' });

			selector = __core.getSelector(selector, false);
			if( selector instanceof Element ) selector = [selector];
			if( !selector || selector.length < 1 ) return true;

			Array.prototype.forEach.call(selector, _wrapVideo);
		}
	};
}();
