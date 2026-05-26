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
    PNK.logout = function () {
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

        form.addEventListener('submit', function (e) {
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

            // Buscar usuario
            var usuarios = PNK.getData(PNK.KEYS.USUARIOS);
            var user = null;
            for (var i = 0; i < usuarios.length; i++) {
                if (usuarios[i].email.toLowerCase() === email.toLowerCase()) {
                    user = usuarios[i];
                    break;
                }
            }

            if (!user) {
                PNK.toast.error('No existe una cuenta con ese correo.');
                return;
            }

            if (user.password !== password) {
                PNK.toast.error('Contraseña incorrecta.');
                return;
            }

            // Verificar que el usuario esté activo
            if (user.estado === 'deshabilitado') {
                PNK.toast.error('Tu cuenta está deshabilitada. Contacta al administrador.');
                return;
            }

            if (user.estado === 'pendiente') {
                PNK.toast.warning('Tu cuenta aún está pendiente de aprobación.');
                return;
            }

            // Crear sesión
            var sessionData = {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol
            };
            PNK.setSession(sessionData);

            PNK.toast.success('¡Bienvenido, ' + user.nombre + '!');

            // Redirigir según rol
            setTimeout(function () {
                switch (user.rol) {
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
    }

    function registrarUsuario(form, rol) {
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
                'El RUT ingresado <strong>' + PNK.escapeHTML(rut) + '</strong> no es válido.<br><br>' +
                'Verifica el formato (ej: 12.345.678-9) y que el dígito verificador sea correcto.'
            );
            return;
        }

        // Verificar email duplicado
        var usuarios = PNK.getData(PNK.KEYS.USUARIOS);
        for (var i = 0; i < usuarios.length; i++) {
            if (usuarios[i].email.toLowerCase() === email.toLowerCase()) {
                PNK.toast.error('Ya existe una cuenta con ese correo.');
                return;
            }
        }

        // Crear usuario
        var newUser = {
            id: PNK.generateId(),
            nombre: nombre,
            rut: rut,
            email: email,
            telefono: telefono,
            fechaNacimiento: fechaNacimiento,
            sexo: sexo,
            rol: rol,
            estado: rol === 'gestor' ? 'pendiente' : 'activo',
            password: password,
            fechaCreacion: new Date().toISOString().split('T')[0]
        };

        // Propietario: campo extra
        if (rol === 'propietario') {
            var nPropiedad = form.querySelector('[name="nPropiedad"]');
            if (nPropiedad) newUser.nPropiedad = nPropiedad.value.trim();
        }

        usuarios.push(newUser);
        PNK.setData(PNK.KEYS.USUARIOS, usuarios);

        if (rol === 'gestor') {
            PNK.toast.success('Solicitud enviada. Un administrador habilitará tu cuenta.');
        } else {
            PNK.toast.success('¡Cuenta creada exitosamente! Ya puedes iniciar sesión.');
        }

        setTimeout(function () {
            window.location.href = 'login.html';
        }, 2000);
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

    // ── Inicialización según página actual ────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        var path = window.location.pathname;

        if (path.indexOf('login.html') !== -1) {
            setupLoginPage();
        } else if (path.indexOf('registro.html') !== -1) {
            setupRegistroPage();
        } else if (path.indexOf('recuperar.html') !== -1) {
            setupRecuperarPage();
        }
    });

})();
