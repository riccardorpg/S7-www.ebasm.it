CNVS.Subscribe = function() {
	var __core = SEMICOLON.Core;
	var __modules = SEMICOLON.Modules;

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.requirePlugin({
				file: 'plugins.form.js',
				id: 'canvas-form-js',
				check: function() { return typeof jQuery !== 'undefined' && jQuery().validate && jQuery().ajaxSubmit; },
				class: 'has-plugin-form',
				event: 'pluginFormReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector );
				if( !selector || selector.length < 1 ) return;

				selector.each( function(){
					var element = jQuery(this);
					var raw = element[0];
					if( !raw ) return;

					var $form = element.find('form');
					if( !$form.length ) return;

					if( !__core.markOnce(raw, 'cnvsSubscribeInit') ) return;

					var elAlert    = element.attr('data-alert-type'),
						elLoader   = element.attr('data-loader'),
						elResult   = element.find('.widget-subscribe-form-result'),
						elRedirect = element.attr('data-redirect');

					$form.validate({
						submitHandler: function(form) {
							var $f = jQuery(form);
							var defButton, defButtonText;

							if( elResult.length ) elResult.hide();

							if( elLoader === 'button' ) {
								defButton = $f.find('button');
								defButtonText = defButton.html();
								defButton.html('<i class="bi-arrow-repeat icon-spin nomargin"></i>');
							} else {
								$f.find('.bi-envelope-plus').removeClass('bi-envelope-plus').addClass('bi-arrow-repeat icon-spin');
							}

							var restoreLoader = function() {
								if( elLoader === 'button' ) {
									if( defButton ) defButton.html( defButtonText );
								} else {
									$f.find('.bi-arrow-repeat').removeClass('bi-arrow-repeat icon-spin').addClass('bi-envelope-plus');
								}
							};

							$f.ajaxSubmit({
								target: elResult,
								dataType: 'json',
								resetForm: true,
								success: function(data) {
									restoreLoader();

									data = data || {};
									var alertKind = data.alert || 'success';
									var message = data.message || '';

									if( alertKind !== 'error' && elRedirect ){
										window.location.replace( elRedirect );
										return true;
									}

									if( elAlert === 'inline' ) {
										var alertType = alertKind === 'error' ? 'alert-danger' : 'alert-success';
										elResult.addClass( 'alert ' + alertType ).html( message ).slideDown( 400 );
									} else {
										elResult.attr( 'data-notify-type', alertKind ).attr( 'data-notify-msg', message ).html('');
										__modules.notifications(elResult);
									}
								},
								error: function() {
									restoreLoader();
									if( !elResult.length ) return;

									if( elAlert === 'inline' ) {
										elResult.removeClass('alert-success').addClass('alert alert-danger').html('Something went wrong. Please try again.').slideDown( 400 );
									} else {
										elResult.attr( 'data-notify-type', 'error' ).attr( 'data-notify-msg', 'Something went wrong. Please try again.' ).html('');
										__modules.notifications(elResult);
									}
								}
							});
						}
					});
				});
			});
		}
	};
}();
