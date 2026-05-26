/**
 * ============================================================
 *  INMOBILIARIA PNK — Sistema de Notificaciones con SweetAlert2
 *  Wrapper sobre Swal para toasts, alertas y confirmaciones
 * ============================================================
 */

(function () {
    'use strict';

    // ── Verificar que SweetAlert2 está cargado ────────────────
    function checkSwal() {
        if (typeof Swal === 'undefined') {
            console.warn('SweetAlert2 no está cargado. Usando fallback.');
            return false;
        }
        return true;
    }

    // ── Toast (notificación esquina superior) ─────────────────
    var Toast = null;
    function getToast() {
        if (!Toast && checkSwal()) {
            Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true,
                didOpen: function (toast) {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            });
        }
        return Toast;
    }

    // ── Mostrar toast ─────────────────────────────────────────
    function showToast(icon, message) {
        var t = getToast();
        if (t) {
            t.fire({ icon: icon, title: message });
        } else {
            alert(message);
        }
    }

    // ── Alerta grande (centro de pantalla) ────────────────────
    function showAlert(options) {
        if (!checkSwal()) {
            alert(options.title + '\n' + (options.text || ''));
            return;
        }

        Swal.fire({
            icon: options.icon || 'info',
            title: options.title || '',
            text: options.text || '',
            confirmButtonText: options.confirmText || 'Aceptar',
            confirmButtonColor: '#10b981',
            customClass: {
                popup: 'pnk-swal-popup',
                title: 'pnk-swal-title',
                confirmButton: 'pnk-swal-btn'
            }
        });
    }

    // ── Modal de confirmación ─────────────────────────────────
    function showConfirm(options) {
        if (!checkSwal()) {
            if (confirm(options.title + '\n' + (options.text || ''))) {
                if (options.onConfirm) options.onConfirm();
            }
            return;
        }

        Swal.fire({
            title: options.title || '¿Estás seguro?',
            text: options.text || 'Esta acción no se puede deshacer.',
            icon: options.icon || 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: options.confirmText || 'Sí, eliminar',
            cancelButtonText: options.cancelText || 'Cancelar',
            reverseButtons: true,
            customClass: {
                popup: 'pnk-swal-popup',
                title: 'pnk-swal-title'
            }
        }).then(function (result) {
            if (result.isConfirmed) {
                if (options.onConfirm) options.onConfirm();
            }
        });
    }

    // ── Alerta de éxito con redirect ──────────────────────────
    function showSuccessAndRedirect(message, url, delay) {
        if (!checkSwal()) {
            alert(message);
            setTimeout(function () { window.location.href = url; }, delay || 1500);
            return;
        }

        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: message,
            showConfirmButton: false,
            timer: delay || 2000,
            timerProgressBar: true,
            confirmButtonColor: '#10b981',
            customClass: {
                popup: 'pnk-swal-popup'
            }
        }).then(function () {
            window.location.href = url;
        });
    }

    // ── Alerta de error de validación ─────────────────────────
    function showValidationError(title, html) {
        if (!checkSwal()) {
            alert(title + '\n' + html);
            return;
        }

        Swal.fire({
            icon: 'error',
            title: title || 'Error de validación',
            html: html || '',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#ef4444',
            customClass: {
                popup: 'pnk-swal-popup'
            }
        });
    }

    // ── Alerta de información ─────────────────────────────────
    function showInfo(title, text) {
        if (!checkSwal()) {
            alert(title + '\n' + (text || ''));
            return;
        }

        Swal.fire({
            icon: 'info',
            title: title,
            text: text,
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#3b82f6',
            customClass: {
                popup: 'pnk-swal-popup'
            }
        });
    }

    // ── Inyectar estilos personalizados para SweetAlert2 ──────
    var styles = document.createElement('style');
    styles.textContent = `
        .pnk-swal-popup {
            font-family: 'Inter', sans-serif !important;
            border-radius: 20px !important;
            padding: 2rem !important;
        }
        .pnk-swal-title {
            font-weight: 700 !important;
            font-size: 1.3rem !important;
        }
        .pnk-swal-btn {
            border-radius: 50px !important;
            padding: 10px 28px !important;
            font-weight: 700 !important;
        }
        .swal2-confirm {
            border-radius: 50px !important;
            font-weight: 700 !important;
            font-family: 'Inter', sans-serif !important;
        }
        .swal2-cancel {
            border-radius: 50px !important;
            font-weight: 700 !important;
            font-family: 'Inter', sans-serif !important;
        }
        .swal2-toast {
            font-family: 'Inter', sans-serif !important;
        }
    `;
    document.head.appendChild(styles);

    // ── API Pública ───────────────────────────────────────────
    window.PNK = window.PNK || {};
    PNK.toast = {
        success: function (msg) { showToast('success', msg); },
        error: function (msg) { showToast('error', msg); },
        warning: function (msg) { showToast('warning', msg); },
        info: function (msg) { showToast('info', msg); }
    };
    PNK.confirm = showConfirm;
    PNK.alert = showAlert;
    PNK.successRedirect = showSuccessAndRedirect;
    PNK.validationError = showValidationError;
    PNK.info = showInfo;

})();
