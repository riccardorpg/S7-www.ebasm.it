CNVS.YoutubeBG = function() {
	var __core = SEMICOLON.Core;

	var _counter = 0;

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.requirePlugin({
				file: 'plugins.youtube.js',
				id: 'canvas-youtube-js',
				check: function() { return typeof jQuery !== 'undefined' && jQuery().YTPlayer; },
				class: 'has-plugin-youtubebg',
				event: 'pluginYoutubeBgVideoReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector, true, '.mb_YTPlayer,.customjs' );
				if( !selector || selector.length < 1 ) return;

				selector.each( function(){
					var element = jQuery(this);
					var raw = element[0];
					if( !raw ) return;

					var elVideo = element.attr('data-video');
					if( !elVideo ) return;

					if( !__core.markOnce(raw, 'cnvsYoutubebgInit') ) return;

					var elContainer = element.attr('data-container') || 'parent';
					if( elContainer === 'parent' ) {
						var parent = element.parent();
						var parentEl = parent[0];
						if( parentEl ) {
							var existingId = parent.attr('id');
							if( existingId ) {
								elContainer = '#' + existingId;
							} else {
								var ytPid = 'yt-bg-player-parent-' + (++_counter) + '-' + Date.now().toString(36);
								parent.attr('id', ytPid);
								elContainer = '#' + ytPid;
							}
						}
					}

					element.YTPlayer({
						videoURL:          elVideo,
						mute:              __core.toBool(element.attr('data-mute'), true),
						ratio:             element.attr('data-ratio') || '16/9',
						quality:           element.attr('data-quality') || 'hd720',
						opacity:           __core.toNumber(element.attr('data-opacity'), 1),
						containment:       elContainer,
						optimizeDisplay:   __core.toBool(element.attr('data-optimize'), true),
						loop:              __core.toBool(element.attr('data-loop'), true),
						vol:               __core.toNumber(element.attr('data-volume'), 50),
						startAt:           __core.toNumber(element.attr('data-start'), 0),
						stopAt:            __core.toNumber(element.attr('data-stop'), 0),
						autoPlay:          __core.toBool(element.attr('data-autoplay'), true),
						realfullscreen:    __core.toBool(element.attr('data-fullscreen'), false),
						showYTLogo:        false,
						showControls:      __core.toBool(element.attr('data-controls'), false),
						coverImage:        element.attr('data-coverimage') || '',
						stopMovieOnBlur:   __core.toBool(element.attr('data-pauseonblur'), true),
						playOnlyIfVisible: __core.toBool(element.attr('data-playifvisible'), false)
					});
				});
			});
		}
	};
}();
