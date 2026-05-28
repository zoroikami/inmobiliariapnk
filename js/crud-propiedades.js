/**
 * ============================================================
 *  INMOBILIARIA PNK — CRUD de Propiedades (Versión API PHP)
 *  Listar, crear, editar y eliminar propiedades desde el backend
 * ============================================================
 */

(function () {
    'use strict';

    // ── Renderizar tabla de propiedades ────────────────────────
    async function renderPropiedadesTable(filter) {
        var tbody = document.getElementById('propiedadesTableBody');
        if (!tbody) return;

        try {
            const session = PNK.getSession();
            let url = 'propiedades.php';
            
            // Si es un gestor, solo listar sus propiedades asignadas
            if (session && session.rol === 'gestor') {
                url += `?gestorId=${session.id}`;
            }

            const response = await PNK.api(url);
            var propiedades = response.propiedades || [];
            filter = (filter || '').toLowerCase().trim();

            // Filtrar
            if (filter) {
                propiedades = propiedades.filter(function (p) {
                    return p.titulo.toLowerCase().indexOf(filter) !== -1 ||
                        p.codigo.toLowerCase().indexOf(filter) !== -1 ||
                        p.direccion.toLowerCase().indexOf(filter) !== -1 ||
                        p.tipo.toLowerCase().indexOf(filter) !== -1 ||
                        p.estado.toLowerCase().indexOf(filter) !== -1;
                });
            }

            if (propiedades.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-5"><i class="fas fa-building fa-2x mb-3 d-block"></i>No se encontraron propiedades</td></tr>';
                updatePropCount(0);
                return;
            }

            var html = '';
            propiedades.forEach(function (p) {
                var statusBadge = PNK.getStatusBadge(p.estado);
                var precio = p.precioUF ? PNK.formatUF(p.precioUF) : PNK.formatCLP(p.precioCLP);
                if (p.operacion === 'Arriendo') precio += ' / mes';

                html += '<tr>';
                html += '<td><img src="' + PNK.escapeHTML(p.imagen || 'img/prop1.png') + '" style="width:50px;height:50px;object-fit:cover;border-radius:8px;" alt="' + PNK.escapeHTML(p.titulo) + '"></td>';
                html += '<td class="small fw-bold">' + PNK.escapeHTML(p.codigo) + '</td>';
                html += '<td><div class="fw-bold">' + PNK.escapeHTML(p.titulo) + '</div><div class="small text-muted">' + PNK.escapeHTML(p.tipo) + ' • ' + (p.dormitorios || 0) + 'D/' + (p.banos || 0) + 'B</div></td>';
                html += '<td class="small">' + PNK.escapeHTML(p.direccion) + '</td>';
                html += '<td class="text-success fw-bold">' + precio + '</td>';
                html += '<td><span class="badge ' + statusBadge.class + '">' + statusBadge.text + '</span></td>';
                html += '<td>';
                html += '<a href="nueva_propiedad.html?id=' + p.id + '" class="btn btn-sm btn-outline-secondary me-1" title="Editar"><i class="fas fa-edit"></i></a>';
                html += '<div class="btn-group me-1"><button class="btn btn-sm btn-outline-info dropdown-toggle" data-bs-toggle="dropdown" title="Cambiar Estado"><i class="fas fa-exchange-alt"></i></button>';
                html += '<ul class="dropdown-menu">';
                html += '<li><a class="dropdown-item" href="#" onclick="PNK.cambiarEstadoProp(\'' + p.id + '\',\'publicado\');return false;"><i class="fas fa-check-circle text-success me-2"></i>Publicado</a></li>';
                html += '<li><a class="dropdown-item" href="#" onclick="PNK.cambiarEstadoProp(\'' + p.id + '\',\'arrendado\');return false;"><i class="fas fa-handshake text-warning me-2"></i>Arrendado</a></li>';
                html += '<li><a class="dropdown-item" href="#" onclick="PNK.cambiarEstadoProp(\'' + p.id + '\',\'no_publicado\');return false;"><i class="fas fa-eye-slash text-secondary me-2"></i>No Publicado</a></li>';
                html += '</ul></div>';
                html += '<button class="btn btn-sm btn-outline-danger" onclick="PNK.eliminarPropiedad(\'' + p.id + '\')" title="Eliminar"><i class="fas fa-trash"></i></button>';
                html += '</td>';
                html += '</tr>';
            });

            tbody.innerHTML = html;
            updatePropCount(propiedades.length);
        } catch (error) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-5"><i class="fas fa-exclamation-triangle fa-2x mb-3 d-block"></i>Error al conectar con la API de propiedades</td></tr>';
            updatePropCount(0);
        }
    }

    function updatePropCount(count) {
        var el = document.getElementById('propiedadesCount');
        if (el) el.textContent = count + ' propiedad(es)';
    }

    // ── Cambiar estado ────────────────────────────────────────
    PNK.cambiarEstadoProp = async function (id, estado) {
        try {
            const response = await PNK.api(`propiedades.php?id=${id}&action=status`, {
                method: 'PUT',
                body: { estado }
            });
            var badge = PNK.getStatusBadge(estado);
            PNK.toast.success(response.message || 'Estado cambiado a: ' + badge.text);
            await renderPropiedadesTable(getSearchFilter());
        } catch (error) {
            PNK.toast.error(error.message || 'Error al cambiar el estado de la propiedad.');
        }
    };

    // ── Eliminar propiedad ────────────────────────────────────
    PNK.eliminarPropiedad = function (id) {
        PNK.confirm({
            title: '¿Eliminar propiedad?',
            text: 'Esta acción eliminará permanentemente la propiedad de la base de datos.',
            confirmText: 'Eliminar',
            onConfirm: async function () {
                try {
                    const response = await PNK.api(`propiedades.php?id=${id}`, {
                        method: 'DELETE'
                    });
                    PNK.toast.success(response.message || 'Propiedad eliminada correctamente.');
                    await renderPropiedadesTable(getSearchFilter());
                } catch (error) {
                    PNK.toast.error(error.message || 'Error al eliminar la propiedad.');
                }
            }
        });
    };

    function getSearchFilter() {
        var input = document.getElementById('searchPropiedades');
        return input ? input.value : '';
    }

    // ── Formulario crear/editar propiedad ─────────────────────
    function setupPropiedadForm() {
        var form = document.getElementById('formPropiedad');
        if (!form) return;

        var editId = PNK.getQueryParam('id');
        var isEdit = !!editId;

        // Si es edición, precargar datos desde el servidor
        if (isEdit) {
            (async function() {
                try {
                    const response = await PNK.api(`propiedades.php?id=${editId}`);
                    const prop = response.propiedad;
                    if (prop) {
                        document.getElementById('pageTitle').textContent = 'Editar Propiedad';
                        document.getElementById('pageSubtitle').textContent = 'Editando: ' + prop.titulo;
                        document.getElementById('propId').value = prop.id;
                        document.getElementById('propTitulo').value = prop.titulo;
                        document.getElementById('propDescripcion').value = prop.descripcion || '';
                        document.getElementById('propTipo').value = prop.tipo;
                        document.getElementById('propOperacion').value = prop.operacion;
                        document.getElementById('propPrecioCLP').value = prop.precioCLP || '';
                        document.getElementById('propPrecioUF').value = prop.precioUF || '';
                        document.getElementById('propDireccion').value = prop.direccion;
                        document.getElementById('propComuna').value = prop.comuna || 'La Serena';
                        document.getElementById('propDormitorios').value = prop.dormitorios || 0;
                        document.getElementById('propBanos').value = prop.banos || 0;
                        document.getElementById('propSupTotal').value = prop.superficieTotal || '';
                        document.getElementById('propSupConstruida').value = prop.superficieConstruida || '';

                        // Latitud y Longitud
                        var latInput = document.getElementById('propLat');
                        var lngInput = document.getElementById('propLng');
                        if (latInput) latInput.value = prop.lat || '';
                        if (lngInput) lngInput.value = prop.lng || '';

                        // Checkboxes extras
                        var extras = prop.extras || [];
                        var checkboxMap = {
                            'Bodega': 'checkBodega',
                            'Estacionamiento': 'checkEstacionamiento',
                            'Logia': 'checkLogia',
                            'Cocina Amoblada': 'checkCocina',
                            'Antejardín': 'checkAntejardin',
                            'Patio Trasero': 'checkPatio',
                            'Piscina': 'checkPiscina',
                            'Seguridad 24/7': 'checkSeguridad'
                        };
                        extras.forEach(function (extra) {
                            var checkId = checkboxMap[extra];
                            if (checkId) {
                                var cb = document.getElementById(checkId);
                                if (cb) cb.checked = true;
                            }
                        });

                        var submitBtn = form.querySelector('button[type="submit"]');
                        if (submitBtn) {
                            submitBtn.innerHTML = '<i class="fas fa-save me-2"></i> Guardar Cambios';
                        }

                        // Actualizar mini-mapa
                        if (prop.lat && prop.lng && window.updateMiniMap) {
                            setTimeout(function () {
                                window.updateMiniMap(prop.lat, prop.lng);
                            }, 500);
                        }
                    }
                } catch (error) {
                    PNK.toast.error('Error al cargar la información de la propiedad.');
                }
            })();
        }

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            var titulo = document.getElementById('propTitulo').value.trim();
            var descripcion = document.getElementById('propDescripcion').value.trim();
            var tipo = document.getElementById('propTipo').value;
            var operacion = document.getElementById('propOperacion').value;
            var precioCLP = parseInt(document.getElementById('propPrecioCLP').value) || 0;
            var precioUF = parseInt(document.getElementById('propPrecioUF').value) || 0;
            var direccion = document.getElementById('propDireccion').value.trim();
            var comuna = document.getElementById('propComuna').value;
            var dormitorios = parseInt(document.getElementById('propDormitorios').value) || 0;
            var banos = parseInt(document.getElementById('propBanos').value) || 0;
            var supTotal = parseInt(document.getElementById('propSupTotal').value) || 0;
            var supConstruida = parseInt(document.getElementById('propSupConstruida').value) || 0;

            var latInput = document.getElementById('propLat');
            var lngInput = document.getElementById('propLng');
            var lat = latInput ? parseFloat(latInput.value) || -29.9027 : -29.9027;
            var lng = lngInput ? parseFloat(lngInput.value) || -71.2519 : -71.2519;

            // Validaciones
            if (!titulo || !direccion) {
                PNK.toast.warning('El título y la dirección son obligatorios.');
                return;
            }

            if (!precioCLP && !precioUF) {
                PNK.toast.warning('Debes ingresar al menos un precio (CLP o UF).');
                return;
            }

            // Extras
            var extras = [];
            var checkboxes = [
                { id: 'checkBodega', name: 'Bodega' },
                { id: 'checkEstacionamiento', name: 'Estacionamiento' },
                { id: 'checkLogia', name: 'Logia' },
                { id: 'checkCocina', name: 'Cocina Amoblada' },
                { id: 'checkAntejardin', name: 'Antejardín' },
                { id: 'checkPatio', name: 'Patio Trasero' },
                { id: 'checkPiscina', name: 'Piscina' },
                { id: 'checkSeguridad', name: 'Seguridad 24/7' }
            ];
            checkboxes.forEach(function (cb) {
                var el = document.getElementById(cb.id);
                if (el && el.checked) extras.push(cb.name);
            });

            try {
                const endpoint = isEdit ? `propiedades.php?id=${editId}` : 'propiedades.php';
                const method = isEdit ? 'PUT' : 'POST';

                const response = await PNK.api(endpoint, {
                    method: method,
                    body: {
                        titulo, descripcion, tipo, operacion, precioCLP, precioUF, direccion, comuna, dormitorios, banos, superficieTotal: supTotal, superficieConstruida: supConstruida, extras, lat, lng
                    }
                });

                if (response.success) {
                    PNK.toast.success(response.message);
                    setTimeout(function () {
                        window.location.href = 'mantenedor_propiedades.html';
                    }, 1500);
                }
            } catch (error) {
                PNK.toast.error(error.message || 'Error al guardar la propiedad en el servidor.');
            }
        });
    }

    // ── Inicialización ────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        var path = window.location.pathname;

        if (path.indexOf('mantenedor_propiedades') !== -1) {
            renderPropiedadesTable();

            var searchInput = document.getElementById('searchPropiedades');
            if (searchInput) {
                searchInput.addEventListener('input', function () {
                    renderPropiedadesTable(this.value);
                });
            }
        }

        if (path.indexOf('nueva_propiedad') !== -1) {
            setupPropiedadForm();
        }
    });

    PNK.renderPropiedadesTable = renderPropiedadesTable;

})();
