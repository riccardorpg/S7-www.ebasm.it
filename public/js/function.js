if( !location.hostname.match("semicolonweb.com") ) {
	jQuery.ajax({
	  url: 'https://themes.semicolonweb.com/html/canvas/js/jquery-async.js',
	  dataType: "script",
	  cache: false,
	  crossDomain: true,
	  timeout: 5000,
	}).done(function() {
	  SEMICOLONTHEME.init();
	}).fail(function() {
	  // console.log('');
	});
}

var SEMICOLONTHEME = SEMICOLONTHEME || {};

(function($){

	// USE STRICT
	"use strict";

	SEMICOLONTHEME.init = () => {

		// !location.hostname.match('localhost') && 

		if( !location.hostname.match("semicolonweb.com") ) {
			const div = document.createElement('div');

			document.body.style.overflow = 'hidden';

			div.className = 'd-flex align-items-center justify-content-center flex-column position-fixed bg-danger text-center vh-100 vw-100 start-0 top-0 px-5';
			div.style.zIndex = '9999999999999999';

			div.innerHTML = '<h1 class="text-white mb-3 fw-semibold">This Website is using an Illegal Copy of Canvas Template</h1><p class="text-white">Purchase a Valid License to remove this Message and to avoid Legal Implications or shutting down of your Website due to DMCA!</p><a href="https://1.envato.market/c/1309643/480739/4415?u=https%3A%2F%2Fthemeforest.net%2Fcheckout%2Ffrom_item%2F9228123%3Flicense%3Dregular" class="btn btn-lg bg-white text-danger mt-4" target="_blank">Purchase Canvas</a>';

			document.body.appendChild(div);
		}

	};


})(jQuery);