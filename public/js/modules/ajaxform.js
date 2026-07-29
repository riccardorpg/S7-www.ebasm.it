CNVS.AjaxForm = function() {
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
				if( selector.length < 1 ) return;

				selector.each( function(){
					var element = jQuery(this),
						$body = jQuery('body'),
						elFormId = element.find('form').attr('id'),
						elAlert = element.attr('data-alert-type') || 'notify',
						elLoader = element.attr('data-loader'),
						elResult = element.find('.form-result'),
						elRedirect = element.attr('data-redirect'),
						elTimeout = Number(element.attr('data-timeout')) || 30000,
						defaultBtn, defaultBtnText, alertType;

					if( elFormId ) {
						$body.addClass( elFormId + '-ready' );
					}

					element.find('form').validate({
						errorPlacement: function(error, elementItem) {
							if( elementItem.parents('.form-group').length > 0 ) {
								error.appendTo( elementItem.parents('.form-group') );
							} else {
								error.insertAfter( elementItem );
							}
						},
						focusCleanup: true,
						submitHandler: function(form) {
							if( element.hasClass( 'custom-submit' ) ) {
								jQuery(form).submit();
								return true;
							}

							elResult.hide();

							if( elLoader == 'button' ) {
								defaultBtn = jQuery(form).find('button');
								defaultBtnText = defaultBtn.html();

								defaultBtn.html('<i class="bi-arrow-repeat icon-spin m-0"></i>');
							} else {
								jQuery(form).find('.form-process').fadeIn();
							}

							if( elFormId ) {
								$body.removeClass( elFormId + '-ready ' + elFormId + '-complete ' + elFormId + '-success ' + elFormId + '-error' ).addClass( elFormId + '-processing' );
							}

							var restoreLoader = function() {
								if( elLoader == 'button' ) {
									if( defaultBtn && typeof defaultBtnText !== 'undefined' ) {
										defaultBtn.html( defaultBtnText );
									}
								} else {
									jQuery(form).find('.form-process').fadeOut();
								}
							};

							var resetRecaptcha = function() {
								if( jQuery(form).find('.g-recaptcha').children('div').length > 0 && typeof grecaptcha !== 'undefined' ) {
									try { grecaptcha.reset(); } catch(e) {}
								}
							};

							jQuery(form).ajaxSubmit({
								target: elResult,
								dataType: 'json',
								timeout: elTimeout,
								success: function(data) {
									restoreLoader();

									if( data.alert != 'error' && elRedirect ){
										window.location.replace( elRedirect );
										return true;
									}

									if( elAlert == 'inline' ) {
										alertType = data.alert == 'error' ? 'alert-danger' : 'alert-success';
										elResult.removeClass( 'alert-danger alert-success' ).addClass( 'alert ' + alertType ).html( data.message ).slideDown( 400 );
									} else if( elAlert == 'notify' ) {
										elResult.attr( 'data-notify-type', data.alert ).attr( 'data-notify-msg', data.message ).html('');
										__modules.notifications(elResult);
									}

									if( data.alert != 'error' ) {
										jQuery(form).resetForm();
										jQuery(form).find('.btn-group > .btn').removeClass('active');

										var tmce = window.tinymce || window.tinyMCE;
										if( tmce && tmce.activeEditor && !tmce.activeEditor.isHidden() ){
											tmce.activeEditor.setContent('');
										}

										var rangeSlider = jQuery(form).find('.input-range-slider');
										if( rangeSlider.length > 0 ) {
											rangeSlider.each( function(){
												var range = jQuery(this).data('ionRangeSlider');
												if( range ) range.reset();
											});
										}

										var ratings = jQuery(form).find('.input-rating');
										if( ratings.length > 0 ) {
											ratings.each( function(){
												jQuery(this).rating('reset');
											});
										}

										var selectPicker = jQuery(form).find('.selectpicker');
										if( selectPicker.length > 0 ) {
											selectPicker.each( function(){
												jQuery(this).selectpicker('val', '');
												jQuery(this).selectpicker('deselectAll');
											});
										}

										jQuery(form).find('.input-select2,select[data-selectsplitter-firstselect-selector]').change();

										jQuery(form).trigger( 'formSubmitSuccess', data );
										if( elFormId ) {
											$body.removeClass( elFormId + '-error' ).addClass( elFormId + '-success' );
										}
									} else {
										jQuery(form).trigger( 'formSubmitError', data );
										if( elFormId ) {
											$body.removeClass( elFormId + '-success' ).addClass( elFormId + '-error' );
										}
									}

									if( elFormId ) {
										$body.removeClass( elFormId + '-processing' ).addClass( elFormId + '-complete' );
									}

									resetRecaptcha();
								},
								error: function(xhr, status) {
									restoreLoader();

									var errorMsg = status === 'timeout'
										? 'The request timed out. Please try again.'
										: 'A network error occurred. Please try again.';

									if( elAlert == 'inline' ) {
										elResult.removeClass( 'alert-danger alert-success' ).addClass( 'alert alert-danger' ).html( errorMsg ).slideDown( 400 );
									} else if( elAlert == 'notify' ) {
										elResult.attr( 'data-notify-type', 'error' ).attr( 'data-notify-msg', errorMsg ).html('');
										__modules.notifications(elResult);
									}

									jQuery(form).trigger( 'formSubmitError', { alert: 'error', message: errorMsg, status: status, xhr: xhr } );

									if( elFormId ) {
										$body.removeClass( elFormId + '-success' ).addClass( elFormId + '-error' );
										$body.removeClass( elFormId + '-processing' ).addClass( elFormId + '-complete' );
									}

									resetRecaptcha();
								}
							});
						}
					});

				});
			});
		}
	};
}();
