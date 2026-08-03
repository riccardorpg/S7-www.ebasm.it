CNVS.Twitter = function() {
	var __core = SEMICOLON.Core;
	var __modules = SEMICOLON.Modules;

	var _linkify = function(text) {
		return __core.escapeHTML(text)
			.replace(/((https?|s?ftp|ssh):\/\/[^"\s<>]*[^.,;'">:\s<>\)\]\!])/g, function(url) {
				return '<a href="' + url + '" target="_blank" rel="noopener">' + url + '</a>';
			})
			.replace(/\B@([_a-z0-9]+)/ig, function(reply) {
				var handle = reply.substring(1);
				return reply.charAt(0) + '<a href="https://twitter.com/' + handle + '" target="_blank" rel="noopener">' + handle + '</a>';
			});
	};

	var _build = function(tweet, element, username) {
		var elFontClass = element.getAttribute('data-font-class') || 'font-body';
		var status = _linkify(tweet.text || '');
		var idStr = encodeURIComponent(tweet.id_str || '');
		var safeUser = encodeURIComponent(username);
		var time = _time(tweet.created_at);

		if( element.classList.contains('fslider') ) {
			var sliderWrap = element.querySelector('.slider-wrap');
			if( !sliderWrap ) return;
			var slide = document.createElement('div');
			slide.className = 'slide';
			slide.innerHTML = '<p class="mb-3 ' + elFontClass + '">' + status + '</p><small class="d-block"><a href="https://twitter.com/' + safeUser + '/statuses/' + idStr + '" target="_blank" rel="noopener">' + time + '</a></small>';
			sliderWrap.append(slide);
		} else {
			element.insertAdjacentHTML('beforeend', '<li><i class="fa-brands fa-x-twitter"></i><div><span>' + status + '</span><small><a href="https://twitter.com/' + safeUser + '/statuses/' + idStr + '" target="_blank" rel="noopener">' + time + '</a></small></div></li>');
		}
	};

	var _time = function(time_value) {
		var parsed_date = new Date(time_value);
		var relative_to = new Date();
		var delta = parseInt((relative_to.getTime() - parsed_date) / 1000);
		delta = delta + (relative_to.getTimezoneOffset() * 60);

		if (delta < 60) return 'less than a minute ago';
		if (delta < 120) return 'about a minute ago';
		if (delta < (60*60)) return (parseInt(delta / 60)).toString() + ' minutes ago';
		if (delta < (120*60)) return 'about an hour ago';
		if (delta < (24*60*60)) return 'about ' + (parseInt(delta / 3600)).toString() + ' hours ago';
		if (delta < (48*60*60)) return '1 day ago';
		return (parseInt(delta / 86400)).toString() + ' days ago';
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.initFunction({ class: 'has-plugin-twitter', event: 'pluginTwitterFeedReady' });

			selector = __core.getSelector( selector, false, false );
			if( !selector || selector.length < 1 ){
				return true;
			}

			selector.forEach( function(element) {
				if( !__core.markOnce(element, 'cnvsTwitterInit') ) return;

				var elUser   = element.getAttribute('data-username') || 'twitter',
					elCount  = __core.toNumber(element.getAttribute('data-count'), 3),
					elLoader = element.getAttribute('data-loader') || 'include/twitter/tweets.php',
					elFetch  = element.getAttribute('data-fetch-message') || 'Fetching Tweets from Twitter...';

				var alertEl = element.querySelector('.twitter-widget-alert');
				if( !alertEl ) {
					alertEl = document.createElement('div');
					alertEl.className = 'alert alert-warning twitter-widget-alert text-center';
					alertEl.innerHTML = '<div class="spinner-grow spinner-grow-sm me-2" role="status"><span class="visually-hidden">Loading...</span></div> ' + __core.escapeHTML(elFetch);
					element.prepend(alertEl);
				}

				var showError = function(message) {
					if( !alertEl ) return;
					alertEl.classList.remove('alert-warning');
					alertEl.classList.add('alert-danger');
					alertEl.textContent = message;
				};

				fetch( elLoader + '?username=' + encodeURIComponent(elUser) ).then( function(response) {
					if( !response.ok ) throw new Error('HTTP ' + response.status);
					var contentType = response.headers.get('content-type') || '';
					if( contentType.indexOf('json') === -1 ) {
						return response.text().then( function() {
							throw new Error('Twitter backend did not return JSON (check ' + elLoader + ' — likely a PHP error page or missing API credentials)');
						});
					}
					return response.json();
				}).then( function(tweets) {
					if( !Array.isArray(tweets) ) {
						showError('Twitter API returned an unexpected response.');
						return;
					}
					if( tweets.length === 0 ) {
						showError('No tweets found.');
						return;
					}

					alertEl.remove();
					alertEl = null;

					var limit = Math.min(tweets.length, elCount);
					for( var i = 0; i < limit; i++ ) {
						_build(tweets[i], element, elUser);
					}

					if( element.classList.contains('fslider') ) {
						var attempts = 0;
						var timer = setInterval( function() {
							attempts++;
							if( element.querySelectorAll('.slide').length > 1 ) {
								element.classList.remove('customjs');
								setTimeout( function() {
									__modules.flexSlider();
									jQuery(element).find( '.flexslider .slide' ).resize();
								}, 500);
								clearInterval(timer);
							} else if( attempts >= 10 ) {
								clearInterval(timer);
							}
						}, 1000);
					}
				}).catch( function(err) {
					console.warn('Canvas Twitter:', err && err.message ? err.message : err);
					showError('Could not fetch Tweets from Twitter API. Please try again later.');
				});
			});
		}
	};
}();
