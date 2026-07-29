CNVS.Notifications = function() {
	var __core = SEMICOLON.Core;

	var _typeClass = {
		primary: 'text-white bg-primary border-0',
		warning: 'text-dark bg-warning border-0',
		error:   'text-white bg-danger border-0',
		success: 'text-white bg-success border-0',
		info:    'bg-info text-dark border-0',
		dark:    'text-white bg-dark border-0',
	};

	var _posClass = {
		'top-left':      'top-0 start-0',
		'top-center':    'top-0 start-50 translate-middle-x',
		'top-right':     'top-0 end-0',
		'middle-left':   'top-50 start-0 translate-middle-y',
		'middle-center': 'top-50 start-50 translate-middle',
		'middle-right':  'top-50 end-0 translate-middle-y',
		'bottom-left':   'bottom-0 start-0',
		'bottom-center': 'bottom-0 start-50 translate-middle-x',
		'bottom-right':  'bottom-0 end-0',
	};

	var _uid = 0;
	var _nextId = function() {
		_uid++;
		return 'toast-' + Date.now().toString(36) + '-' + _uid;
	};

	var _buildToast = function(id, msg, typeClasses, posClasses, showClose, closeColorClass) {
		var wrap = document.createElement('div');
		wrap.className = 'position-fixed ' + posClasses + ' p-3';
		wrap.style.zIndex = '999999';

		var toast = document.createElement('div');
		toast.id = id;
		toast.className = 'toast p-2 hide ' + typeClasses;
		toast.setAttribute('role', 'alert');
		toast.setAttribute('aria-live', 'assertive');
		toast.setAttribute('aria-atomic', 'true');

		var flex = document.createElement('div');
		flex.className = 'd-flex';

		var body = document.createElement('div');
		body.className = 'toast-body';
		body.innerHTML = msg;
		flex.appendChild(body);

		if( showClose ) {
			var btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'btn-close ' + closeColorClass + ' btn-sm me-2 mt-2 ms-auto';
			btn.setAttribute('data-bs-dismiss', 'toast');
			btn.setAttribute('aria-label', 'Close');
			flex.appendChild(btn);
		}

		toast.appendChild(flex);
		wrap.appendChild(toast);
		return wrap;
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			__core.requirePlugin({
				file: 'plugins.bootstrap.js',
				id: 'canvas-bootstrap-js',
				check: function() { return typeof jQuery !== 'undefined' && typeof bootstrap !== 'undefined'; },
				class: 'has-plugin-notify',
				event: 'pluginNotifyReady'
			}).then( function(ready) {
				if( !ready ) return;

				selector = __core.getSelector( selector );
				if( selector.length < 1 ) return;

				var element = selector;
				var elPosition = element.attr('data-notify-position') || 'top-right';
				var elType     = element.attr('data-notify-type');
				var elMsg      = element.attr('data-notify-msg') || 'Please set a message!';
				var elTimeout  = Number(element.attr('data-notify-timeout')) || 5000;
				var elClose    = element.attr('data-notify-close') !== 'false';
				var elAutoHide = element.attr('data-notify-autohide') !== 'false';
				var elTrigger  = element.attr('data-notify-trigger') || 'self';
				var elTarget   = element.attr('data-notify-target');

				if( elTarget && jQuery(elTarget).length > 0 && elTrigger === 'self' ) {
					var existingToastEl = jQuery(elTarget).get(0);
					var existingInstance = bootstrap.Toast.getOrCreateInstance(existingToastEl);
					existingInstance.hide();

					existingToastEl.addEventListener('hidden.bs.toast', function() {
						CNVS.Notifications.init(selector);
					}, { once: true });
					return;
				}

				var typeClasses = _typeClass[elType] || '';
				var posClasses  = _posClass[elPosition] || _posClass['top-right'];
				var closeColorClass = (elType === 'info' || elType === 'warning' || !elType) ? '' : 'btn-close-white';

				var elId = _nextId();

				if( elTrigger === 'self' && !elTarget ) {
					var wrap = _buildToast(elId, elMsg, typeClasses, posClasses, elClose, closeColorClass);
					document.body.appendChild(wrap);
					element.attr('data-notify-target', '#' + elId);
				}

				var toastSelector = element.attr('data-notify-target');
				if( !toastSelector ) return;
				var toastEl = document.querySelector(toastSelector);
				if( !toastEl ) return;

				document.querySelectorAll('.toast').forEach( function(existingToast) {
					if( existingToast !== toastEl ) {
						bootstrap.Toast.getOrCreateInstance(existingToast).hide();
					}
				});

				var toast = new bootstrap.Toast(toastEl, {
					delay: elTimeout,
					autohide: elAutoHide,
				});
				toast.show();

				if( elTrigger === 'self' ) {
					toastEl.addEventListener('hidden.bs.toast', function() {
						if( toastEl.parentNode ) toastEl.parentNode.remove();
						element.get(0)?.removeAttribute('data-notify-target');
					}, { once: true });
				}
			});
		}
	};
}();
