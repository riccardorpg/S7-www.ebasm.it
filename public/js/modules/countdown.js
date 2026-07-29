CNVS.Countdown = function() {
	var __core = SEMICOLON.Core;

	var _pad = function(n) { return n < 10 ? '0' + n : String(n); };

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.loadJS({ file: 'plugins.countdown.js', id: 'canvas-countdown-js', jsFolder: true });
			__core.loadJS({ file: 'components/moment.js', id: 'canvas-moment-js', jsFolder: true });

			__core.requirePlugin({
				check: function() { return typeof jQuery !== 'undefined' && typeof moment !== 'undefined' && jQuery().countdown; },
				class: 'has-plugin-countdown',
				event: 'pluginCountdownReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector );
				if( selector.length < 1 ) return;

				selector.each( function(){
					var element = jQuery(this),
						elFormat  = element.attr('data-format') || 'dHMS',
						elSince   = element.attr('data-since') === 'true',
						elYear    = element.attr('data-year'),
						elMonth   = element.attr('data-month'),
						elDay     = element.attr('data-day'),
						elHour    = element.attr('data-hour'),
						elMin     = element.attr('data-minute'),
						elSec     = element.attr('data-second'),
						elRedirect = element.attr('data-redirect') || false;

					try { element.countdown('destroy'); } catch(e) {}

					var setDate;

					if( elYear ) {
						var monthNum = Number(elMonth);
						var dayNum = Number(elDay);
						var parts = [elYear];
						parts.push( (elMonth && monthNum >= 1 && monthNum <= 12) ? _pad(monthNum) : '01' );
						parts.push( (elDay && dayNum >= 1 && dayNum <= 31) ? _pad(dayNum) : '01' );
						setDate = new Date( moment(parts.join('-')) );
						if( isNaN(setDate.getTime()) ) {
							setDate = new Date();
						}
					} else {
						setDate = new Date();
					}

					var hourNum = Number(elHour);
					if( elHour && hourNum >= 0 && hourNum < 25 ) {
						setDate.setHours( setDate.getHours() + hourNum );
					}

					var minNum = Number(elMin);
					if( elMin && minNum >= 0 && minNum < 60 ) {
						setDate.setMinutes( setDate.getMinutes() + minNum );
					}

					var secNum = Number(elSec);
					if( elSec && secNum >= 0 && secNum < 60 ) {
						setDate.setSeconds( setDate.getSeconds() + secNum );
					}

					if( elSince ) {
						element.countdown({
							since: setDate,
							format: elFormat,
							expiryUrl: elRedirect,
						});
					} else {
						element.countdown({
							until: setDate,
							format: elFormat,
							expiryUrl: elRedirect,
						});
					}
				});
			});
		}
	};
}();
