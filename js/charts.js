/**
 * ============================================================
 *  INMOBILIARIA PNK — Reportes y Gráficos (Chart.js)
 *  Gráficos estadísticos para el dashboard de administración
 * ============================================================
 */

(function () {
    'use strict';

    // Colores del branding PNK
    var COLORS = {
        green: '#10b981',
        greenLight: '#34d399',
        gold: '#f59e0b',
        goldLight: '#fbbf24',
        blue: '#3b82f6',
        blueLight: '#60a5fa',
        purple: '#8b5cf6',
        pink: '#ec4899',
        red: '#ef4444',
        gray: '#6b7280',
        teal: '#14b8a6',
        orange: '#f97316'
    };

    var CHART_PALETTE = [
        COLORS.green, COLORS.blue, COLORS.gold, COLORS.purple,
        COLORS.pink, COLORS.teal, COLORS.orange, COLORS.red
    ];

    // ── Helpers ───────────────────────────────────────────────
    function isDark() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    function gridColor() {
        return isDark() ? 'rgba(148, 163, 184, 0.15)' : 'rgba(0, 0, 0, 0.06)';
    }

    function textColor() {
        return isDark() ? '#94a3b8' : '#6b7280';
    }

    function bgColor(hex, alpha) {
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }

    // ── Defaults globales ────────────────────────────────────
    function setChartDefaults() {
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.color = textColor();
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.padding = 16;
    }

    // ── Chart 1: Dona — Propiedades por Tipo ─────────────────
    function createChartByType(propiedades) {
        var ctx = document.getElementById('chartByType');
        if (!ctx) return;

        var counts = {};
        propiedades.forEach(function (p) {
            var tipo = p.tipo || 'Otro';
            counts[tipo] = (counts[tipo] || 0) + 1;
        });

        var labels = Object.keys(counts);
        var data = Object.values(counts);

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: CHART_PALETTE.slice(0, labels.length),
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 12, font: { size: 11 } }
                    }
                }
            }
        });
    }

    // ── Chart 2: Barras — Propiedades por Comuna ────────────
    function createChartByCommune(propiedades) {
        var ctx = document.getElementById('chartByCommune');
        if (!ctx) return;

        var counts = {};
        propiedades.forEach(function (p) {
            var comuna = p.comuna || 'Desconocida';
            counts[comuna] = (counts[comuna] || 0) + 1;
        });

        var labels = Object.keys(counts);
        var data = Object.values(counts);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Propiedades',
                    data: data,
                    backgroundColor: labels.map(function (_, i) {
                        return bgColor(CHART_PALETTE[i % CHART_PALETTE.length], 0.75);
                    }),
                    borderColor: labels.map(function (_, i) {
                        return CHART_PALETTE[i % CHART_PALETTE.length];
                    }),
                    borderWidth: 2,
                    borderRadius: 8,
                    maxBarThickness: 60
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor() }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor() },
                        ticks: { color: textColor(), stepSize: 1 }
                    }
                }
            }
        });
    }

    // ── Chart 3: Barras Horizontales — Por Estado ────────────
    function createChartByStatus(propiedades) {
        var ctx = document.getElementById('chartByStatus');
        if (!ctx) return;

        var statusLabels = {
            'publicado': 'Publicados',
            'arrendado': 'Arrendados',
            'no_publicado': 'No Publicados'
        };

        var counts = {};
        propiedades.forEach(function (p) {
            var estado = p.estado || 'no_publicado';
            counts[estado] = (counts[estado] || 0) + 1;
        });

        var statusColors = {
            'publicado': COLORS.green,
            'arrendado': COLORS.gold,
            'no_publicado': COLORS.gray
        };

        var labels = Object.keys(counts).map(function (k) { return statusLabels[k] || k; });
        var data = Object.values(counts);
        var colors = Object.keys(counts).map(function (k) { return statusColors[k] || COLORS.gray; });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Propiedades',
                    data: data,
                    backgroundColor: colors.map(function (c) { return bgColor(c, 0.75); }),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 8,
                    maxBarThickness: 40
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: gridColor() },
                        ticks: { color: textColor(), stepSize: 1 }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: textColor(), font: { weight: '600' } }
                    }
                }
            }
        });
    }

    // ── Chart 4: Línea — Precio Promedio por Tipo ────────────
    function createChartAvgPrice(propiedades) {
        var ctx = document.getElementById('chartAvgPrice');
        if (!ctx) return;

        var grouped = {};
        propiedades.forEach(function (p) {
            var tipo = p.tipo || 'Otro';
            if (!grouped[tipo]) grouped[tipo] = [];
            if (p.precioUF > 0) grouped[tipo].push(p.precioUF);
        });

        var labels = Object.keys(grouped);
        var avgData = labels.map(function (tipo) {
            var arr = grouped[tipo];
            if (arr.length === 0) return 0;
            var sum = arr.reduce(function (a, b) { return a + b; }, 0);
            return Math.round(sum / arr.length);
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Precio Promedio (UF)',
                    data: avgData,
                    borderColor: COLORS.green,
                    backgroundColor: bgColor(COLORS.green, 0.1),
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: COLORS.green,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { font: { size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                return 'UF ' + ctx.parsed.y.toLocaleString('es-CL');
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor() }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor() },
                        ticks: {
                            color: textColor(),
                            callback: function (val) { return 'UF ' + val.toLocaleString('es-CL'); }
                        }
                    }
                }
            }
        });
    }

    // ── Inicialización ───────────────────────────────────────
    function initCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js no está cargado.');
            return;
        }

        setChartDefaults();

        var propiedades = PNK.getData(PNK.KEYS.PROPIEDADES);

        createChartByType(propiedades);
        createChartByCommune(propiedades);
        createChartByStatus(propiedades);
        createChartAvgPrice(propiedades);
    }

    // ── Ejecutar ─────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', initCharts);

})();
