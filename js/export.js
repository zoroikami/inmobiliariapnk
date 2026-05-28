/**
 * ============================================================
 *  INMOBILIARIA PNK — Exportar datos (CSV y PDF)
 *  Genera archivos descargables desde las tablas
 * ============================================================
 */

(function () {
    'use strict';

    // ── Obtener fecha actual para nombre de archivo ──────────
    function getDateStr() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    // ── Exportar tabla a CSV ─────────────────────────────────
    function exportTableToCSV(tableSelector, filename) {
        var table = document.querySelector(tableSelector);
        if (!table) {
            PNK.toast.error('No se encontró la tabla para exportar.');
            return;
        }

        var csv = [];
        var rows = table.querySelectorAll('tr');

        rows.forEach(function (row) {
            var cols = row.querySelectorAll('th, td');
            var rowData = [];
            cols.forEach(function (col, index) {
                // Skip "Imagen" column (index 0 in propiedades) and "Avatar" (index 0 in usuarios)
                // and "Acciones" column (last)
                if (col.textContent.trim() === 'Acciones' || col.querySelector('.btn')) return;
                if (col.querySelector('img') || col.textContent.trim() === 'Imagen' || col.textContent.trim() === 'Avatar') return;

                var text = col.textContent.trim().replace(/"/g, '""');
                rowData.push('"' + text + '"');
            });
            if (rowData.length > 0) csv.push(rowData.join(','));
        });

        if (csv.length <= 1) {
            PNK.toast.warning('No hay datos para exportar.');
            return;
        }

        // BOM for UTF-8 support in Excel
        var bom = '\uFEFF';
        var blob = new Blob([bom + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, filename + '_' + getDateStr() + '.csv');

        PNK.toast.success('Archivo CSV descargado exitosamente.');
    }

    // ── Exportar a PDF (usando window.print con estilos) ────
    function exportTableToPDF(tableSelector, title) {
        var table = document.querySelector(tableSelector);
        if (!table) {
            PNK.toast.error('No se encontró la tabla para exportar.');
            return;
        }

        // Clone table and remove action buttons
        var clone = table.cloneNode(true);
        var actionCells = clone.querySelectorAll('td:last-child, th:last-child');
        actionCells.forEach(function (cell) {
            if (cell.textContent.trim() === 'Acciones' || cell.querySelector('.btn')) {
                cell.remove();
            }
        });

        // Remove image columns
        var allRows = clone.querySelectorAll('tr');
        allRows.forEach(function (row) {
            var firstCell = row.querySelector('th, td');
            if (firstCell && (firstCell.querySelector('img') || firstCell.textContent.trim() === 'Imagen' || firstCell.textContent.trim() === 'Avatar')) {
                firstCell.remove();
            }
        });

        // Open print window
        var printWindow = window.open('', '_blank', 'width=900,height=600');
        if (!printWindow) {
            PNK.toast.error('Permite ventanas emergentes para generar el PDF.');
            return;
        }

        printWindow.document.write('<!DOCTYPE html><html><head>');
        printWindow.document.write('<title>' + title + ' - Inmobiliaria PNK</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('body { font-family: "Inter", Arial, sans-serif; padding: 30px; color: #1f2937; }');
        printWindow.document.write('.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #10b981; padding-bottom: 15px; margin-bottom: 25px; }');
        printWindow.document.write('.header h1 { font-size: 1.3rem; margin: 0; color: #10b981; }');
        printWindow.document.write('.header p { font-size: 0.8rem; color: #6b7280; margin: 0; }');
        printWindow.document.write('table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }');
        printWindow.document.write('th { background: #1f2937; color: white; padding: 10px 12px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.5px; }');
        printWindow.document.write('td { padding: 9px 12px; border-bottom: 1px solid #e5e7eb; }');
        printWindow.document.write('tr:nth-child(even) { background: #f9fafb; }');
        printWindow.document.write('.footer { margin-top: 30px; text-align: center; font-size: 0.7rem; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 15px; }');
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="header">');
        printWindow.document.write('<div><h1>INMOBILIARIA PNK</h1><p>' + title + '</p></div>');
        printWindow.document.write('<p>Generado: ' + new Date().toLocaleDateString('es-CL') + ' ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) + '</p>');
        printWindow.document.write('</div>');
        printWindow.document.write(clone.outerHTML);
        printWindow.document.write('<div class="footer">&copy; 2026 Inmobiliaria PNK — Documento generado automáticamente</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        // Wait for content to load then print
        printWindow.onload = function () {
            printWindow.print();
        };

        PNK.toast.info('Ventana de impresión abierta. Puedes guardar como PDF.');
    }

    // ── Download Blob Helper ─────────────────────────────────
    function downloadBlob(blob, filename) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ── Inyectar estilos para botones de exportación ─────────
    var styles = document.createElement('style');
    styles.textContent = '\
        .export-btn-group { display: flex; gap: 8px; flex-wrap: wrap; } \
        .export-btn { \
            display: inline-flex; align-items: center; gap: 6px; \
            padding: 8px 16px; border-radius: 50px; \
            font-size: 0.8rem; font-weight: 600; \
            border: 1px solid #e2e8f0; background: white; \
            cursor: pointer; transition: all 0.2s; color: #6b7280; \
        } \
        .export-btn:hover { \
            border-color: #10b981; color: #10b981; background: #f0fdf4; \
        } \
        .export-btn i { font-size: 0.9rem; } \
        .export-btn-csv:hover { border-color: #10b981; color: #10b981; } \
        .export-btn-pdf:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; } \
        [data-theme="dark"] .export-btn { \
            background: #1e293b; border-color: #334155; color: #94a3b8; \
        } \
        [data-theme="dark"] .export-btn:hover { background: rgba(52, 211, 153, 0.1); } \
        [data-theme="dark"] .export-btn-pdf:hover { background: rgba(239, 68, 68, 0.1); } \
    ';
    document.head.appendChild(styles);

    // ── API Pública ──────────────────────────────────────────
    window.PNK = window.PNK || {};
    PNK.export = {
        toCSV: exportTableToCSV,
        toPDF: exportTableToPDF
    };

})();
