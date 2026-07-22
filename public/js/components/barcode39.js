/* Generatore barcode Code 39 (client-side, nessuna dipendenza).
   Uso: renderBarcode39('CODICE', document.getElementById('svg'), {height:60});
   Ogni carattere = 9 elementi (bar,space,...), '1' = wide, '0' = narrow. */
(function (global) {
    var CODE39 = {
        '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
        '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
        '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
        'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
        'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
        'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
        'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
        'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
        'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
        '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
        '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100'
    };

    function renderBarcode39(text, svg, opts) {
        opts = opts || {};
        var narrow = opts.narrow || 2;
        var wide = opts.wide || 5;
        var height = opts.height || 60;
        var margin = opts.margin || 10;

        var clean = String(text).toUpperCase().replace(/[^0-9A-Z\-. $\/+%]/g, '');
        var seq = '*' + clean + '*';

        var x = margin;
        var rects = '';
        for (var i = 0; i < seq.length; i++) {
            var pat = CODE39[seq[i]];
            if (!pat) continue;
            for (var j = 0; j < 9; j++) {
                var w = (pat[j] === '1') ? wide : narrow;
                if (j % 2 === 0) { // elemento pari = barra
                    rects += '<rect x="' + x + '" y="' + margin + '" width="' + w + '" height="' + height + '"/>';
                }
                x += w;
            }
            x += narrow; // spazio inter-carattere (narrow)
        }
        var totalW = x - narrow + margin;
        var totalH = height + 2 * margin;
        svg.setAttribute('viewBox', '0 0 ' + totalW + ' ' + totalH);
        svg.setAttribute('width', totalW);
        svg.setAttribute('height', totalH);
        svg.innerHTML = '<rect x="0" y="0" width="' + totalW + '" height="' + totalH + '" fill="#ffffff"/>' +
            '<g fill="#000000">' + rects + '</g>';
    }

    global.renderBarcode39 = renderBarcode39;
})(window);
