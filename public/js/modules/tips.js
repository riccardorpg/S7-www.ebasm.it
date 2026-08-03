CNVS.Tips = function() {
	var __core = SEMICOLON.Core;
	var __modules = SEMICOLON.Modules;

	var TIPS_HTML = '<div class="position-fixed bottom-0 end-0 p-3 text-start" style="z-index: 699;"><div id="cnvs-tips-element" data-notify-trigger="custom" data-notify-target="#cnvs-tips-element" data-notify-timeout="7777" class="toast hide p-3" role="alert" aria-live="assertive" aria-atomic="true" style="--bs-toast-max-width:400px;--bs-toast-bg: rgba(var(--bs-body-bg-rgb),.925);"><div class="toast-header bg-transparent border-0 mb-0 align-items-center pb-1"><h5 id="cnvs-tips-element-title" class="me-auto fs-6 fw-semibold mb-0"></h5><button type="button" class="btn-close me-1" data-bs-dismiss="toast" aria-label="Close"></button></div><div id="cnvs-tips-element-content" class="toast-body small pt-1"></div><a href="#" id="cnvs-tips-element-disable" class="text-muted text-decoration-underline op-06 h-op-08 px-2 pb-2 ms-1 mt-1 d-inline-block" data-cookies="true" style="font-size:.75rem;text-underline-offset:3px;">Disable Random Tips</a></div></div>';

	return {
		init: function(selector) {
			__core.requirePlugin({
				file: 'plugins.bootstrap.js',
				id: 'canvas-bootstrap-js',
				check: function() { return typeof bootstrap !== 'undefined'; }
			}).then( function(ready) {
				if( !ready ) return;

				if( typeof cnvsTips === 'undefined' || !cnvsTips || cnvsTips.length < 1 ) {
					return false;
				}

				if( __core.cookie.get('__cnvs_tips_cookies') === 'hide' ) {
					return false;
				}

				var elBody = __core.getVars.elBody;
				var elWrapper = __core.getVars.elWrapper;
				if( !elBody || !elWrapper ) return false;

				if( elBody.classList.contains('init-plugin-tips') ) {
					return false;
				}

				__core.initFunction({ class: 'has-plugin-tips', event: 'pluginTipsReady' });

				var randomIndex = Math.floor(Math.random() * cnvsTips.length);
				var randomTip = cnvsTips[randomIndex];
				if( !randomTip ) return false;

				var tipsEl = document.getElementById('cnvs-tips-element');
				if( !tipsEl ) {
					elWrapper.insertAdjacentHTML('beforeend', TIPS_HTML);
					tipsEl = document.getElementById('cnvs-tips-element');
					if( !tipsEl ) return false;
				}

				var tipsTitle = document.getElementById('cnvs-tips-element-title');
				var tipsContent = document.getElementById('cnvs-tips-element-content');
				var tipsDisable = document.getElementById('cnvs-tips-element-disable');
				var tipsEnable = document.getElementById('cnvs-tips-element-enable');

				if( tipsTitle ) tipsTitle.innerHTML = randomTip.title || '';
				if( tipsContent ) tipsContent.innerHTML = randomTip.content || '';

				if( __core.markOnce(tipsDisable, 'cnvsTipsBound') ) {
					tipsDisable.addEventListener('click', function(e) {
						e.preventDefault();
						var tipsToast = bootstrap.Toast.getOrCreateInstance(tipsEl);
						tipsToast.hide();
						__core.cookie.set('__cnvs_tips_cookies', 'hide', 1);
					});
				}

				if( __core.markOnce(tipsEnable, 'cnvsTipsBound') ) {
					tipsEnable.addEventListener('click', function(e) {
						e.preventDefault();
						__core.cookie.remove('__cnvs_tips_cookies');
						window.location.reload();
					});
				}

				elBody.classList.add('init-plugin-tips');
				setTimeout(function(){
					__modules.notifications(tipsEl);
				}, Math.floor(Math.random() * 5000));
			});
		}
	};
}();
