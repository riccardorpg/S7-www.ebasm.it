CNVS.MediaActions = function() {
	var __core = SEMICOLON.Core;

	var _bindings = new WeakMap();
	var _pauseEv = ['ended', 'error', 'pause', 'seeking', 'waiting'];
	var _playEv  = ['play', 'playing'];

	var _updateVolumeState = function(mediaEl, mediaWrap) {
		if( !mediaWrap ) return;
		if( mediaEl.volume < 0.1 || mediaEl.muted ) {
			mediaWrap.classList.add('media-is-muted');
		} else {
			mediaWrap.classList.remove('media-is-muted');
		}
	};

	var _formatTime = function(duration) {
		if( !isFinite(duration) ) return '0:00';
		var minutes = Math.floor(duration / 60);
		var seconds = Math.floor(duration % 60);
		return minutes + ':' + (seconds < 10 ? '0' + seconds : seconds);
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.initFunction({ class: 'has-plugin-mediaactions', event: 'pluginMediaActionsReady' });

			selector = __core.getSelector( selector, false );
			if( selector.length < 1 ) return true;

			selector.forEach( function(mediaWrap) {
				var mediaEl = mediaWrap.querySelector('video,audio');
				if( !mediaEl ) return;

				var mediaTrigger  = mediaWrap.querySelector('.media-trigger-playback');
				var volumeTrigger = mediaWrap.querySelector('.media-trigger-volume');
				var mediaDuration = mediaWrap.querySelector('.media-duration');

				var prev = _bindings.get(mediaEl);
				if( prev ) {
					prev.pauseHandlers.forEach( function(h, i) { mediaEl.removeEventListener(_pauseEv[i], h); });
					prev.playHandlers.forEach( function(h, i) { mediaEl.removeEventListener(_playEv[i], h); });
					mediaEl.removeEventListener('timeupdate', prev.timeHandler);
					mediaEl.removeEventListener('volumechange', prev.volHandler);
					mediaEl.removeEventListener('loadedmetadata', prev.metaHandler);
					if( prev.playClick ) prev.playClick.target.removeEventListener('click', prev.playClick.fn);
					if( prev.volClick )  prev.volClick.target.removeEventListener('click', prev.volClick.fn);
				}

				var pauseHandlers = _pauseEv.map( function(evName) {
					var h = function(){
						mediaWrap.classList.remove('media-is-playing');
						_updateVolumeState(mediaEl, mediaWrap);
					};
					mediaEl.addEventListener(evName, h);
					return h;
				});

				var playHandlers = _playEv.map( function(evName) {
					var h = function(){
						mediaWrap.classList.add('media-is-playing');
						_updateVolumeState(mediaEl, mediaWrap);
					};
					mediaEl.addEventListener(evName, h);
					return h;
				});

				var timeHandler = function(){
					if( mediaDuration ) {
						mediaDuration.textContent = _formatTime(mediaEl.currentTime);
					}
				};
				mediaEl.addEventListener('timeupdate', timeHandler);

				var volHandler = function(){ _updateVolumeState(mediaEl, mediaWrap); };
				mediaEl.addEventListener('volumechange', volHandler);

				var metaHandler = function(){
					if( mediaDuration ) {
						mediaDuration.textContent = _formatTime(mediaEl.duration);
					}
				};
				mediaEl.addEventListener('loadedmetadata', metaHandler);
				if( mediaEl.readyState >= 1 ) metaHandler();

				var playClick = null;
				if( mediaTrigger ) {
					var pFn = function(e) {
						e.preventDefault();
						if( mediaEl.paused ) { mediaEl.play(); } else { mediaEl.pause(); }
					};
					mediaTrigger.addEventListener('click', pFn);
					playClick = { target: mediaTrigger, fn: pFn };
				}

				var volClick = null;
				if( volumeTrigger ) {
					var vFn = function(e) {
						e.preventDefault();
						mediaEl.muted = !mediaEl.muted;
					};
					volumeTrigger.addEventListener('click', vFn);
					volClick = { target: volumeTrigger, fn: vFn };
				}

				_bindings.set(mediaEl, {
					pauseHandlers: pauseHandlers,
					playHandlers: playHandlers,
					timeHandler: timeHandler,
					volHandler: volHandler,
					metaHandler: metaHandler,
					playClick: playClick,
					volClick: volClick,
				});
			});
		}
	};
}();
