/* Generatore barcode Code 128 (set B, client-side, nessuna dipendenza).
   Uso: renderBarcode128('CODICE', document.getElementById('svg'), {height:60});
   Ogni simbolo = 11 moduli (pattern a 6 elementi bar/space); lo Stop = 13 moduli. */
(function (global) {
    // Pattern larghezze moduli per ciascun valore (0-106), alternati barra/spazio a partire da barra.
    var PATTERNS = [
        '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
        '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
        '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
        '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
        '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
        '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
        '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
        '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
        '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
        '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
        '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112',
        '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
        '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412',
        '211214', '211232', '2331112'
    ];
    var START_B = 104;
    var STOP = 106;

    function renderBarcode128(text, svg, opts) {
        opts = opts || {};
        var moduleW = opts.moduleW || 2; // larghezza modulo base (px)
        var height = opts.height || 60;
        var margin = opts.margin || 10;

        // Solo ASCII stampabile (32-126); i caratteri fuori range vengono scartati.
        var clean = String(text).replace(/[^\x20-\x7E]/g, '');

        // Valori simboli set B: valore = ASCII - 32.
        var values = [START_B];
        for (var i = 0; i < clean.length; i++) {
            values.push(clean.charCodeAt(i) - 32);
        }

        // Checksum: (start + Σ valore_i * posizione_i) mod 103.
        var sum = START_B;
        for (var k = 1; k < values.length; k++) {
            sum += values[k] * k;
        }
        values.push(sum % 103);
        values.push(STOP);

        var x = margin;
        var rects = '';
        for (var v = 0; v < values.length; v++) {
            var pat = PATTERNS[values[v]];
            for (var j = 0; j < pat.length; j++) {
                var w = parseInt(pat[j], 10) * moduleW;
                if (j % 2 === 0) { // elemento pari = barra
                    rects += '<rect x="' + x + '" y="' + margin + '" width="' + w + '" height="' + height + '"/>';
                }
                x += w;
            }
        }

        var totalW = x + margin;
        var totalH = height + 2 * margin;
        svg.setAttribute('viewBox', '0 0 ' + totalW + ' ' + totalH);
        svg.setAttribute('width', totalW);
        svg.setAttribute('height', totalH);
        svg.innerHTML = '<rect x="0" y="0" width="' + totalW + '" height="' + totalH + '" fill="#ffffff"/>' +
            '<g fill="#000000">' + rects + '</g>';
    }

    global.renderBarcode128 = renderBarcode128;
})(window);
