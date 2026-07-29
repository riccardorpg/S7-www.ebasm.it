CNVS.TextSplitter = function() {
	var __core = SEMICOLON.Core;

	var _getText = function(element) {
		return element.textContent || element.innerText || '';
	};

	var _joiner = function(arr, tag, glue) {
		return arr.map( function(chunk) {
			return '<' + tag + '>' + __core.escapeHTML(chunk) + '</' + tag + '>';
		}).join(glue);
	};

	var _words = function(element, tag) {
		var words = _getText(element).split(/\s+/).filter(Boolean);
		return _joiner(words, tag, ' ');
	};

	var _letters = function(element, tag) {
		var letters = Array.from(_getText(element));
		return _joiner(letters, tag, '');
	};

	var _splitter = function(el, type) {
		var tag = 'span';
		el.innerHTML = type === 'letter' ? _letters(el, tag) : _words(el, tag);

		el.querySelectorAll('span').forEach( function(elem, index) {
			elem.style.setProperty('--cnvs-split-index', index + 1);
		});
	};

	return {
		init: function(selector) {
			if( __core.getSelector(selector, false, false).length < 1 ){
				return true;
			}

			selector = __core.getSelector( selector, false );
			if( !selector || selector.length < 1 ){
				return true;
			}

			selector.forEach( function(el) {
				if( !__core.markOnce(el, 'cnvsTextsplitterInit') ) return;

				var type = el.getAttribute('data-split-type') || 'word';
				_splitter(el, type);
			});
		}
	};
}();
