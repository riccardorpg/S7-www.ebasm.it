CNVS.StickFooterOnSmall = function() {
	var __core = SEMICOLON.Core;
	var __base = SEMICOLON.Base;

	return {
		init: function(selector) {
			selector = __core.getSelector( selector, false );
			if( !selector || selector.length < 1 ){
				return true;
			}

			var elFooter  = __core.getVars.elFooter,
				elWrapper = __core.getVars.elWrapper,
				elBody    = __core.getVars.elBody,
				elAppMenu = __core.getVars.elAppMenu;

			if( !elFooter || !elWrapper || !elBody ) return true;

			elFooter.style.marginTop = '';

			var windowH = __core.viewport().height,
				wrapperH = elWrapper.offsetHeight;

			if( !elBody.classList.contains('sticky-footer') && elWrapper.contains( elFooter ) ) {
				if( windowH > wrapperH ) {
					elFooter.style.marginTop = (windowH - wrapperH) + 'px';
				}
			}

			if( elAppMenu ) {
				var rect = elAppMenu.getBoundingClientRect();
				if( (windowH - (rect.top + rect.height)) === 0 ) {
					elFooter.style.marginBottom = elAppMenu.offsetHeight + 'px';
				}
			}

			__core.getVars.resizers.stickfooter = function() {
				__base.stickFooterOnSmall();
			};
		}
	};
}();
