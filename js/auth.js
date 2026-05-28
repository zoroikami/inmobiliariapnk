/**
 * ============================================================
 *  INMOBILIARIA PNK — Módulo de Autenticación
 *  Login, registro, sesión, protección de rutas, logout
 * ============================================================
 */

(function () {
    'use strict';

    // ── Protección de rutas ───────────────────────────────────
    PNK.protectRoute = function (allowedRoles) {
        var session = PNK.getSession();
        if (!session) {
            window.location.href = 'login.html';
            return null;
        }
        if (allowedRoles && allowedRoles.indexOf(session.rol) === -1) {
            PNK.toast.error('No tienes permisos para acceder a esta página.');
            setTimeout(function () {
                window.location.href = 'login.html';
            }, 1500);
            return null;
        }
        return session;
    };

    // ── Mostrar nombre del usuario en topbar ──────────────────
    PNK.showUserInfo = function () {
        var session = PNK.getSession();
        if (!session) return;

        // Buscar el elemento del topbar que muestra el nombre
        var nameEl = document.querySelector('.topbar .text-dark.fw-bold');
        if (nameEl) {
            nameEl.textContent = session.nombre.toUpperCase();
        }

        // Actualizar sidebar profile
        var profileName = document.querySelector('.sidebar .profile h3');
        var profileEmail = document.querySelector('.sidebar .profile p');
        if (profileName) profileName.textContent = session.nombre;
        if (profileEmail) profileEmail.textContent = session.email;
    };

    // ── Logout ────────────────────────────────────────────────
    PNK.logout = async function () {
        try {
            await PNK.api('auth.php?action=logout');
        } catch (e) {}
        PNK.clearSession();
        window.location.href = 'login.html';
    };

    // ── Setup logout buttons ──────────────────────────────────
    PNK.setupLogout = function () {
        var logoutBtns = document.querySelectorAll('a[href="login.html"]');
        logoutBtns.forEach(function (btn) {
            // Solo los botones de cerrar sesión (sidebar o topbar)
            if (btn.textContent.indexOf('Cerrar') !== -1 || btn.innerHTML.indexOf('sign-out') !== -1) {
                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    PNK.logout();
                });
                btn.href = '#';
            }
        });
    };

    // ── Login ─────────────────────────────────────────────────
    function setupLoginPage() {
        var form = document.getElementById('loginForm');
        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            var email = document.getElementById('loginEmail').value.trim();
            var password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                PNK.toast.warning('Completa todos los campos.');
                return;
            }

            if (!PNK.validateEmail(email)) {
                PNK.toast.error('El correo electrónico no es válido.');
                return;
            }

            try {
                const response = await PNK.api('auth.php?action=login', {
                    method: 'POST',
                    body: { email, password }
                });

                if (response.success) {
                    PNK.setSession(response.user);
                    PNK.toast.success(response.message);

                    // Redirigir según rol
                    setTimeout(function () {
                        switch (response.user.rol) {
                            case 'admin':
                                window.location.href = 'dashboard_admin.html';
                                break;
                            case 'gestor':
                                window.location.href = 'dashboard_gestor.html';
                                break;
                            case 'propietario':
                                window.location.href = 'dashboard_propietario.html';
                                break;
                            default:
                                window.location.href = 'index.html';
                        }
                    }, 1000);
                }
            } catch (error) {
                PNK.toast.error(error.message || 'Credenciales incorrectas o error de servidor.');
            }
        });

        // Toggle password visibility
        var toggleBtn = document.getElementById('togglePassword');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function () {
                var input = document.getElementById('loginPassword');
                var icon = toggleBtn.querySelector('i');
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        }
    }

    // ── Registro ──────────────────────────────────────────────
    function setupRegistroPage() {
        // Form Propietario
        var formProp = document.getElementById('formPropietario');
        if (formProp) {
            formProp.addEventListener('submit', function (e) {
                e.preventDefault();
                registrarUsuario(formProp, 'propietario');
            });
        }

        // Form Gestor
        var formGestor = document.getElementById('formGestor');
        if (formGestor) {
            formGestor.addEventListener('submit', function (e) {
                e.preventDefault();
                registrarUsuario(formGestor, 'gestor');
            });
        }

        // Form Cliente
        var formCliente = document.getElementById('formCliente');
        if (formCliente) {
            formCliente.addEventListener('submit', function (e) {
                e.preventDefault();
                registrarUsuario(formCliente, 'cliente');
            });
        }
    }

    async function registrarUsuario(form, rol) {
        var nombre = form.querySelector('[name="nombre"]').value.trim();
        var rut = form.querySelector('[name="rut"]').value.trim();
        var fechaNacimiento = form.querySelector('[name="fechaNacimiento"]').value;
        var sexo = form.querySelector('[name="sexo"]').value;
        var email = form.querySelector('[name="email"]').value.trim();
        var telefono = form.querySelector('[name="telefono"]').value.trim();
        var password = form.querySelector('[name="password"]').value;

        // Validaciones
        if (!nombre || !rut || !email || !password) {
            PNK.toast.warning('Completa todos los campos obligatorios.');
            return;
        }

        if (!PNK.validateEmail(email)) {
            PNK.toast.error('El correo electrónico no es válido.');
            return;
        }

        // Validar formato y dígito verificador del RUT
        if (!PNK.validateRUT(rut)) {
            PNK.validationError(
                'RUT Inválido',
                'El RUT ingresado no es válido.<br><br>' +
                'Verifica el formato (ej: 12.345.678-9).'
            );
            return;
        }

        // Validar fortaleza de la contraseña
        if (!PNK.validatePasswordStrength(password)) {
            PNK.validationError(
                'Contraseña Débil',
                'La contraseña debe cumplir con los siguientes requisitos mínimos:<br><br>' +
                '<ul class="text-start" style="font-size:0.9rem; margin-left: 20px;">' +
                '<li>Al menos <strong>8 caracteres</strong> de longitud.</li>' +
                '<li>Al menos <strong>una letra mayúscula</strong> (A-Z).</li>' +
                '<li>Al menos <strong>una letra minúscula</strong> (a-z).</li>' +
                '<li>Al menos <strong>un número</strong> (0-9).</li>' +
                '<li>Al menos <strong>un carácter especial</strong> (ej. @, $, !, %, *, ? o &).</li>' +
                '</ul>'
            );
            return;
        }

        var nPropiedad = null;
        if (rol === 'propietario') {
            var nProp = form.querySelector('[name="nPropiedad"]');
            if (nProp) nPropiedad = nProp.value.trim();
        }

        try {
            const response = await PNK.api('auth.php?action=register', {
                method: 'POST',
                body: {
                    nombre, rut, fechaNacimiento, sexo, email, telefono, password, rol, nPropiedad
                }
            });

            if (response.success) {
                PNK.toast.success(response.message);
                setTimeout(function () {
                    window.location.href = 'login.html';
                }, 2000);
            }
        } catch (error) {
            PNK.toast.error(error.message || 'Error al registrar la cuenta.');
        }
    }

    // ── Recuperar contraseña (simulación) ─────────────────────
    function setupRecuperarPage() {
        var form = document.querySelector('#recuperarForm');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = form.querySelector('[name="email"]').value.trim();

            if (!email || !PNK.validateEmail(email)) {
                PNK.toast.error('Ingresa un correo electrónico válido.');
                return;
            }

            // Simulación
            PNK.toast.info('Se han enviado las instrucciones a ' + email + ' (simulación).');
            setTimeout(function () {
                window.location.href = 'login.html';
            }, 3000);
        });
    }

    // ── Configurar navbar dinámico ─────────────────────────────
    PNK.setupNavbar = function () {
        var session = PNK.getSession();
        if (!session) return;

        var navbarNav = document.querySelector('.navbar-nav');
        if (navbarNav) {
            // Quitar link de unirte
            var unirteLink = navbarNav.querySelector('a[href="registro.html"]');
            if (unirteLink) {
                unirteLink.parentElement.remove();
            }

            // Reemplazar botón Iniciar Sesión
            var loginBtn = navbarNav.querySelector('a[href="login.html"]');
            if (loginBtn) {
                var li = loginBtn.parentElement;
                
                var portalUrl = '#';
                var showPortal = false;
                if (session.rol === 'admin') { portalUrl = 'dashboard_admin.html'; showPortal = true; }
                else if (session.rol === 'gestor') { portalUrl = 'dashboard_gestor.html'; showPortal = true; }
                else if (session.rol === 'propietario') { portalUrl = 'dashboard_propietario.html'; showPortal = true; }

                var portalHtml = showPortal ? '<a class="btn btn-outline-success btn-sm rounded-pill fw-bold me-2 px-3 animate__animated animate__fadeIn" href="' + portalUrl + '"><i class="fas fa-user-shield me-1"></i> Mi Portal</a>' : '';

                li.innerHTML = '<div class="d-flex align-items-center gap-2 animate__animated animate__fadeIn">' +
                    portalHtml +
                    '<span class="fw-bold text-success me-2 small"><i class="fas fa-user me-1"></i> ' + PNK.escapeHTML(session.nombre.split(' ')[0]) + '</span>' +
                    '<button class="btn btn-danger btn-sm rounded-pill fw-bold px-3" id="navLogoutBtn" title="Cerrar Sesión"><i class="fas fa-sign-out-alt"></i></button>' +
                    '</div>';

                var logoutBtn = document.getElementById('navLogoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        PNK.logout();
                    });
                }
            }
        }
    };

    // ── Inicialización según página actual ────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        var path = window.location.pathname;

        // Configurar navbar dinámico si existe
        PNK.setupNavbar();

        if (path.indexOf('login.html') !== -1) {
            setupLoginPage();
        } else if (path.indexOf('registro.html') !== -1) {
            setupRegistroPage();
        } else if (path.indexOf('recuperar.html') !== -1) {
            setupRecuperarPage();
        }
    });

})();
