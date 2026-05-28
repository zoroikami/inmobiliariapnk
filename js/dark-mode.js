/**
 * ============================================================
 *  INMOBILIARIA PNK — Dark Mode Toggle
 *  Persiste preferencia en localStorage, detecta sistema
 * ============================================================
 */

(function () {
    'use strict';

    var STORAGE_KEY = 'pnk_theme';

    function getPreferredTheme() {
        var stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return stored;
        // Detectar preferencia del sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    function setTheme(theme) {
        // Agregar clase de transición temporalmente
        document.documentElement.classList.add('theme-transition');
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);

        // Remover transición después de completarse
        setTimeout(function () {
            document.documentElement.classList.remove('theme-transition');
        }, 400);

        // Actualizar todos los toggle buttons
        var toggles = document.querySelectorAll('.dark-mode-toggle');
        toggles.forEach(function (btn) {
            btn.setAttribute('title', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
        });
    }

    function toggleTheme() {
        var current = document.documentElement.getAttribute('data-theme') || 'light';
        setTheme(current === 'dark' ? 'light' : 'dark');
    }

    // Aplicar tema inmediatamente (antes de DOMContentLoaded para evitar flash)
    var initialTheme = getPreferredTheme();
    document.documentElement.setAttribute('data-theme', initialTheme);

    // Setup después de que el DOM cargue
    document.addEventListener('DOMContentLoaded', function () {
        // Buscar toggles existentes en la página
        var toggles = document.querySelectorAll('.dark-mode-toggle');
        toggles.forEach(function (btn) {
            btn.addEventListener('click', toggleTheme);
            btn.setAttribute('title', initialTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
        });
    });

    // Escuchar cambios de preferencia del sistema
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            // Solo aplicar si el usuario no ha elegido manualmente
            if (!localStorage.getItem(STORAGE_KEY)) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    // API pública
    window.PNK = window.PNK || {};
    PNK.darkMode = {
        toggle: toggleTheme,
        set: setTheme,
        get: function () { return document.documentElement.getAttribute('data-theme') || 'light'; }
    };

})();
