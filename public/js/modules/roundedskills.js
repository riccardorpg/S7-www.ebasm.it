CNVS.RoundedSkills = function() {
	var __core = SEMICOLON.Core;

	var _run = function($element, properties) {
		$element.easyPieChart({
			size: properties.size,
			animate: properties.speed,
			scaleColor: false,
			trackColor: properties.trackcolor,
			lineWidth: properties.width,
			lineCap: properties.cap,
			barColor: properties.color
		});
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.requirePlugin({
				file: 'plugins.piechart.js',
				id: 'canvas-piechart-js',
				check: function() { return typeof jQuery !== 'undefined' && jQuery().easyPieChart; },
				class: 'has-plugin-piechart',
				event: 'pluginRoundedSkillReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector );
				if( !selector || selector.length < 1 ) return;

				selector.each(function(){
					var $element = jQuery(this);
					var element = $element[0];
					if( !__core.markOnce(element, 'cnvsRoundedskillInit') ) return;

					var size       = __core.toNumber($element.attr('data-size'), 140),
						speed      = __core.toNumber($element.attr('data-speed'), 2000),
						width      = __core.toNumber($element.attr('data-width'), 4),
						color      = $element.attr('data-color') || '#0093BF',
						trackColor = $element.attr('data-trackcolor') || 'rgba(0,0,0,0.04)',
						cap        = $element.attr('data-cap') || 'square';

					var properties = {
						size: size,
						speed: speed,
						width: width,
						color: color,
						trackcolor: trackColor,
						cap: cap
					};

					$element.css({ 'width': size + 'px', 'height': size + 'px', 'line-height': size + 'px' });

					if( jQuery('body').hasClass('device-up-lg') ){
						$element.css({ opacity: 0 });
						__core.intersect(element, { rootMargin: '0px 0px 50px' }, function() {
							if( $element.hasClass('skills-animated') ) return;
							setTimeout( function(){ $element.css({ opacity: 1 }); }, 100);
							_run($element, properties);
							$element.addClass('skills-animated');
						});
					} else {
						_run($element, properties);
						$element.addClass('skills-animated');
					}
				});
			});
		}
	};
}();
