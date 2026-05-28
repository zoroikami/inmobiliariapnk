/**
 * ============================================================
 *  INMOBILIARIA PNK — CRUD de Usuarios (Versión API PHP)
 *  Listar, crear, editar, eliminar usuarios desde el backend
 * ============================================================
 */

(function () {
    'use strict';

    // ── Renderizar tabla de usuarios ──────────────────────────
    async function renderUsuariosTable(filter) {
        var tbody = document.getElementById('usuariosTableBody');
        if (!tbody) return;

        try {
            const response = await PNK.api('usuarios.php');
            var usuarios = response.usuarios || [];
            
            filter = (filter || '').toLowerCase().trim();

            // Filtrar
            if (filter) {
                usuarios = usuarios.filter(function (u) {
                    return u.nombre.toLowerCase().indexOf(filter) !== -1 ||
                        u.rut.toLowerCase().indexOf(filter) !== -1 ||
                        u.email.toLowerCase().indexOf(filter) !== -1 ||
                        u.rol.toLowerCase().indexOf(filter) !== -1;
                });
            }

            if (usuarios.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-5"><i class="fas fa-users-slash fa-2x mb-3 d-block"></i>No se encontraron usuarios</td></tr>';
                updateCount(0);
                return;
            }

            var html = '';
            usuarios.forEach(function (u) {
                var initials = PNK.getInitials(u.nombre);
                var avatarColor = PNK.getAvatarColor(u.rol);
                var roleBadge = PNK.getRoleBadge(u.rol);
                var statusBadge = PNK.getStatusBadge(u.estado);
                var isAdmin = u.id === 'usr_admin_001';

                html += '<tr class="' + (u.estado === 'deshabilitado' ? 'opacity-50' : '') + '">';
                html += '<td><div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style="width:36px;height:36px;font-size:0.75rem;background:' + avatarColor + '">' + PNK.escapeHTML(initials) + '</div></td>';
                html += '<td class="fw-bold">' + PNK.escapeHTML(u.nombre) + '</td>';
                html += '<td class="small">' + PNK.escapeHTML(u.rut) + '</td>';
                html += '<td>' + PNK.escapeHTML(u.email) + '</td>';
                html += '<td class="small">' + PNK.escapeHTML(u.telefono || '-') + '</td>';
                html += '<td><span class="badge ' + roleBadge.class + '">' + roleBadge.text + '</span></td>';
                html += '<td><span class="badge ' + statusBadge.class + '">' + statusBadge.text + '</span></td>';
                html += '<td>';
                if (!isAdmin) {
                    html += '<a href="nuevo_usuario.html?id=' + u.id + '" class="btn btn-sm btn-outline-secondary me-1" title="Editar"><i class="fas fa-edit"></i></a>';
                    if (u.estado === 'deshabilitado') {
                        html += '<button class="btn btn-sm btn-outline-success me-1" onclick="PNK.habilitarUsuario(\'' + u.id + '\')" title="Habilitar"><i class="fas fa-user-check"></i></button>';
                    } else if (u.estado === 'pendiente') {
                        html += '<button class="btn btn-sm btn-outline-success me-1" onclick="PNK.habilitarUsuario(\'' + u.id + '\')" title="Aprobar"><i class="fas fa-check"></i></button>';
                    } else {
                        html += '<button class="btn btn-sm btn-outline-warning me-1" onclick="PNK.deshabilitarUsuario(\'' + u.id + '\')" title="Deshabilitar"><i class="fas fa-user-slash"></i></button>';
                    }
                    html += '<button class="btn btn-sm btn-outline-danger" onclick="PNK.eliminarUsuario(\'' + u.id + '\')" title="Eliminar"><i class="fas fa-trash-alt"></i></button>';
                } else {
                    html += '<button class="btn btn-sm btn-outline-secondary me-1" disabled><i class="fas fa-edit"></i></button>';
                    html += '<button class="btn btn-sm btn-outline-danger" disabled title="No se puede eliminar"><i class="fas fa-trash-alt"></i></button>';
                }
                html += '</td>';
                html += '</tr>';
            });

            tbody.innerHTML = html;
            updateCount(usuarios.length);
        } catch (error) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger py-5"><i class="fas fa-exclamation-triangle fa-2x mb-3 d-block"></i>Error al conectar con la API de usuarios</td></tr>';
            updateCount(0);
        }
    }

    function updateCount(count) {
        var el = document.getElementById('usuariosCount');
        if (el) el.textContent = count + ' usuario(s)';
    }

    // ── Deshabilitar usuario ──────────────────────────────────
    PNK.deshabilitarUsuario = function (id) {
        PNK.confirm({
            title: '¿Deshabilitar usuario?',
            text: 'El usuario no podrá iniciar sesión mientras esté deshabilitado.',
            confirmText: 'Deshabilitar',
            onConfirm: async function () {
                try {
                    const response = await PNK.api(`usuarios.php?id=${id}&action=disable`, {
                        method: 'DELETE'
                    });
                    PNK.toast.success(response.message);
                    await renderUsuariosTable(getSearchFilter());
                } catch (error) {
                    PNK.toast.error(error.message || 'Error al deshabilitar usuario.');
                }
            }
        });
    };

    // ── Habilitar usuario ─────────────────────────────────────
    PNK.habilitarUsuario = async function (id) {
        try {
            const response = await PNK.api(`usuarios.php?id=${id}&action=enable`, {
                method: 'DELETE'
            });
            PNK.toast.success(response.message);
            await renderUsuariosTable(getSearchFilter());
        } catch (error) {
            PNK.toast.error(error.message || 'Error al habilitar usuario.');
        }
    };

    // ── Eliminar usuario ──────────────────────────────────────
    PNK.eliminarUsuario = function (id) {
        PNK.confirm({
            title: '¿Eliminar usuario?',
            text: 'Esta acción eliminará permanentemente el usuario de la base de datos del servidor.',
            confirmText: 'Eliminar',
            onConfirm: async function () {
                try {
                    const response = await PNK.api(`usuarios.php?id=${id}`, {
                        method: 'DELETE'
                    });
                    PNK.toast.success(response.message);
                    await renderUsuariosTable(getSearchFilter());
                } catch (error) {
                    PNK.toast.error(error.message || 'Error al eliminar usuario.');
                }
            }
        });
    };

    function getSearchFilter() {
        var input = document.getElementById('searchUsuarios');
        return input ? input.value : '';
    }

    // ── Formulario crear/editar usuario ───────────────────────
    function setupUsuarioForm() {
        var form = document.getElementById('formUsuario');
        if (!form) return;

        var editId = PNK.getQueryParam('id');
        var isEdit = !!editId;

        // Si es edición, precargar datos desde la API
        if (isEdit) {
            (async function() {
                try {
                    const response = await PNK.api(`usuarios.php?id=${editId}`);
                    const user = response.usuario;
                    if (user) {
                        document.getElementById('pageTitle').textContent = 'Editar Usuario';
                        document.getElementById('pageSubtitle').textContent = 'Modificar perfil de ' + user.nombre;
                        document.getElementById('userId').value = user.id;
                        document.getElementById('userName').value = user.nombre;
                        document.getElementById('userRut').value = user.rut;
                        document.getElementById('userEmail').value = user.email;
                        document.getElementById('userPhone').value = user.telefono || '';
                        document.getElementById('userBirthdate').value = user.fechaNacimiento || '';
                        document.getElementById('userSex').value = user.sexo || '';
                        document.getElementById('userRole').value = getRolSelectValue(user.rol);
                        document.getElementById('userPassword').placeholder = 'Dejar en blanco para no cambiar';
                        document.getElementById('statusSwitch').checked = user.estado !== 'deshabilitado';

                        var submitBtn = form.querySelector('button[type="submit"]');
                        if (submitBtn) {
                            submitBtn.innerHTML = '<i class="fas fa-save me-2"></i> Guardar Cambios';
                        }
                    }
                } catch (error) {
                    PNK.toast.error('Error al cargar la información del usuario.');
                }
            })();
        }

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            var nombre = document.getElementById('userName').value.trim();
            var rut = document.getElementById('userRut').value.trim();
            var email = document.getElementById('userEmail').value.trim();
            var telefono = document.getElementById('userPhone').value.trim();
            var fechaNacimiento = document.getElementById('userBirthdate').value;
            var sexo = document.getElementById('userSex').value;
            var rolSelect = document.getElementById('userRole').value;
            var password = document.getElementById('userPassword').value;
            var activo = document.getElementById('statusSwitch').checked;

            // Validaciones
            if (!nombre || !rut || !email) {
                PNK.toast.warning('Completa los campos obligatorios (nombre, RUT, email).');
                return;
            }

            if (!PNK.validateEmail(email)) {
                PNK.toast.error('El correo electrónico no es válido.');
                return;
            }

            // Validar formato del RUT chileno
            if (!PNK.validateRUT(rut)) {
                PNK.validationError(
                    'RUT Inválido',
                    'El RUT <strong>' + PNK.escapeHTML(rut) + '</strong> no es válido.<br>' +
                    'Formato esperado: 12.345.678-9'
                );
                return;
            }

            // Validar fortaleza de la contraseña
            if (!isEdit && !password) {
                PNK.toast.warning('Debes asignar una contraseña al nuevo usuario.');
                return;
            }

            if (password && !PNK.validatePasswordStrength(password)) {
                PNK.validationError(
                    'Contraseña Débil',
                    'La contraseña debe cumplir con los siguientes requisitos mínimos:<br><br>' +
                    '<ul class="text-start" style="font-size:0.9rem; margin-left:20px;">' +
                    '<li>Al menos <strong>8 caracteres</strong> de longitud.</li>' +
                    '<li>Al menos <strong>una letra mayúscula</strong> (A-Z).</li>' +
                    '<li>Al menos <strong>una letra minúscula</strong> (a-z).</li>' +
                    '<li>Al menos <strong>un número</strong> (0-9).</li>' +
                    '<li>Al menos <strong>un carácter especial</strong> (ej. @, $, !, %, *, ? o &).</li>' +
                    '</ul>'
                );
                return;
            }

            var rol = mapRolFromSelect(rolSelect);

            try {
                const endpoint = isEdit ? `usuarios.php?id=${editId}` : 'usuarios.php';
                const method = isEdit ? 'PUT' : 'POST';

                const response = await PNK.api(endpoint, {
                    method: method,
                    body: {
                        nombre, rut, email, telefono, fechaNacimiento, sexo, rol, password, activo
                    }
                });

                if (response.success) {
                    PNK.toast.success(response.message);
                    setTimeout(function () {
                        window.location.href = 'mantenedor_usuarios.html';
                    }, 1500);
                }
            } catch (error) {
                PNK.toast.error(error.message || 'Error al guardar el usuario en el servidor.');
            }
        });
    }

    function getRolSelectValue(rol) {
        var map = {
            'propietario': 'Dueño de Inmueble (Propietario)',
            'gestor': 'Gestor Inmobiliario Free',
            'cliente': 'Usuario Normal (Cliente)',
            'admin': 'Administrador'
        };
        return map[rol] || '';
    }

    function mapRolFromSelect(value) {
        if (value.indexOf('Propietario') !== -1 || value.indexOf('Dueño') !== -1) return 'propietario';
        if (value.indexOf('Gestor') !== -1) return 'gestor';
        if (value.indexOf('Cliente') !== -1 || value.indexOf('Normal') !== -1) return 'cliente';
        if (value.indexOf('Administrador') !== -1) return 'admin';
        return 'propietario';
    }

    // ── Inicialización ────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        var path = window.location.pathname;

        if (path.indexOf('mantenedor_usuarios') !== -1) {
            renderUsuariosTable();

            // Búsqueda en tiempo real
            var searchInput = document.getElementById('searchUsuarios');
            if (searchInput) {
                searchInput.addEventListener('input', function () {
                    renderUsuariosTable(this.value);
                });
            }
        }

        if (path.indexOf('nuevo_usuario') !== -1) {
            setupUsuarioForm();
        }
    });

    // Exponer render para uso externo
    PNK.renderUsuariosTable = renderUsuariosTable;

})();
