/**
 * ============================================================
 *  INMOBILIARIA PNK — Agenda de Visitas (Refactorizado a API)
 *  CRUD de visitas con calendario y lista dinámica
 * ============================================================
 */

(function () {
    'use strict';

    // ── Estado actual del calendario e interfaz ───────────────
    var currentYear, currentMonth, currentFilter = 'todas';
    var cachedVisitas = []; // Caché local para hacer navegación instantánea

    function formatDateISO(d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    // ── Cargar Visitas desde la API ───────────────────────────
    async function loadVisitas() {
        try {
            const data = await PNK.api('visitas.php');
            if (data.success && data.visitas) {
                cachedVisitas = data.visitas;
                renderCalendar();
                renderVisitList();
            }
        } catch (error) {
            console.error('Error cargando visitas:', error);
            PNK.toast.error('No se pudo cargar la agenda de visitas.');
        }
    }

    // ── Renderizar Calendario ────────────────────────────────
    function renderCalendar() {
        var cal = document.getElementById('agendaCalendar');
        if (!cal) return;

        var monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        var dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        // Update month label
        var label = document.getElementById('calendarMonthLabel');
        if (label) label.textContent = monthNames[currentMonth] + ' ' + currentYear;

        // Build grid
        var html = '';
        dayNames.forEach(function (d) {
            html += '<div class="agenda-day-header">' + d + '</div>';
        });

        var firstDay = new Date(currentYear, currentMonth, 1);
        var lastDay = new Date(currentYear, currentMonth + 1, 0);
        var startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0

        var today = new Date();
        var todayStr = formatDateISO(today);

        // Days from previous month
        var prevLastDay = new Date(currentYear, currentMonth, 0).getDate();
        for (var i = startDay - 1; i >= 0; i--) {
            html += '<div class="agenda-day other-month"><div class="agenda-day-number">' + (prevLastDay - i) + '</div></div>';
        }

        // Days of current month
        for (var d = 1; d <= lastDay.getDate(); d++) {
            var dateStr = formatDateISO(new Date(currentYear, currentMonth, d));
            var isToday = dateStr === todayStr ? ' today' : '';

            var dayVisits = cachedVisitas.filter(function (v) { return v.fecha === dateStr; });
            var dots = '';
            dayVisits.forEach(function (v) {
                dots += '<span class="agenda-day-dot agenda-dot-' + v.estado + '" title="Visita ' + v.estado + '"></span>';
            });

            html += '<div class="agenda-day' + isToday + '" data-date="' + dateStr + '">';
            html += '<div class="agenda-day-number">' + d + '</div>';
            html += '<div class="agenda-dots-container">' + dots + '</div>';
            html += '</div>';
        }

        // Fill remaining days
        var totalCells = startDay + lastDay.getDate();
        var remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (var r = 1; r <= remaining; r++) {
            html += '<div class="agenda-day other-month"><div class="agenda-day-number">' + r + '</div></div>';
        }

        cal.innerHTML = html;
    }

    // ── Renderizar Lista de Visitas ──────────────────────────
    function renderVisitList() {
        var list = document.getElementById('visitList');
        if (!list) return;

        var session = PNK.getSession();
        if (!session) return;

        var myVisits = [...cachedVisitas];

        // Filter by status
        if (currentFilter !== 'todas') {
            myVisits = myVisits.filter(function (v) { return v.estado === currentFilter; });
        }

        // Sort by date (upcoming first)
        myVisits.sort(function (a, b) { 
            var cmp = a.fecha.localeCompare(b.fecha); 
            if (cmp !== 0) return cmp;
            return a.hora.localeCompare(b.hora);
        });

        if (myVisits.length === 0) {
            list.innerHTML = '<div class="agenda-empty"><i class="fas fa-calendar-times"></i><p>No hay visitas registradas</p></div>';
            return;
        }

        var html = '';
        myVisits.forEach(function (v) {
            var propTitle = v.propiedadTitulo || 'Propiedad';
            var propAddr = v.propiedadDireccion || '';

            var statusLabels = {
                'pendiente': 'Pendiente',
                'confirmada': 'Confirmada',
                'cancelada': 'Cancelar',
                'realizada': 'Realizada'
            };

            html += '<div class="visit-card visit-' + v.estado + ' animate__animated animate__fadeIn">';
            html += '<div class="d-flex justify-content-between align-items-start mb-2">';
            html += '<div>';
            html += '<span class="visit-time"><i class="fas fa-clock me-1"></i>' + v.hora + '</span>';
            html += '<span class="text-muted small ms-2">' + PNK.formatDate(v.fecha) + '</span>';
            html += '</div>';
            html += '<span class="visit-badge visit-badge-' + v.estado + '">' + (statusLabels[v.estado] || v.estado) + '</span>';
            html += '</div>';
            html += '<p class="visit-prop">' + PNK.escapeHTML(propTitle) + ' <small class="text-secondary">(' + v.propiedadCodigo + ')</small></p>';
            if (propAddr) html += '<p class="text-muted small mb-1"><i class="fas fa-map-marker-alt me-1"></i>' + PNK.escapeHTML(propAddr) + '</p>';
            if (v.notas) html += '<p class="text-muted small mb-2"><i class="fas fa-sticky-note me-1"></i>' + PNK.escapeHTML(v.notas) + '</p>';

            // Actions (only gestor/admin can modify)
            if (session.rol === 'gestor' || session.rol === 'admin') {
                html += '<div class="d-flex gap-2 mt-2">';
                if (v.estado === 'pendiente') {
                    html += '<button class="btn btn-sm btn-outline-success rounded-pill px-3" onclick="PNK.agenda.updateStatus(\'' + v.id + '\',\'confirmada\')"><i class="fas fa-check me-1"></i>Confirmar</button>';
                }
                if (v.estado !== 'cancelada' && v.estado !== 'realizada') {
                    html += '<button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="PNK.agenda.updateStatus(\'' + v.id + '\',\'cancelada\')"><i class="fas fa-times me-1"></i>Cancelar</button>';
                }
                if (v.estado === 'confirmada') {
                    html += '<button class="btn btn-sm btn-outline-primary rounded-pill px-3" onclick="PNK.agenda.updateStatus(\'' + v.id + '\',\'realizada\')"><i class="fas fa-check-double me-1"></i>Realizada</button>';
                }
                html += '</div>';
            } else if (session.rol === 'propietario') {
                // Propietarios pueden cancelar sus propias visitas si no han sido canceladas o realizadas
                if (v.estado !== 'cancelada' && v.estado !== 'realizada') {
                    html += '<div class="d-flex gap-2 mt-2">';
                    html += '<button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="PNK.agenda.updateStatus(\'' + v.id + '\',\'cancelada\')"><i class="fas fa-times me-1"></i>Cancelar</button>';
                    html += '</div>';
                }
            }

            html += '</div>';
        });
        list.innerHTML = html;
    }

    // ── Cambiar estado de visita ─────────────────────────────
    async function updateVisitStatus(visitId, newStatus) {
        try {
            const data = await PNK.api(`visitas.php?id=${visitId}`, {
                method: 'PUT',
                body: { estado: newStatus }
            });

            if (data.success) {
                PNK.toast.success(data.message);
                await loadVisitas();
            }
        } catch (error) {
            PNK.toast.error(error.message || 'No se pudo actualizar el estado de la visita.');
        }
    }

    // ── Agendar nueva visita ─────────────────────────────────
    async function agendarVisita() {
        var form = document.getElementById('formNuevaVisita');
        if (!form) return;

        var propId = document.getElementById('visitProp').value;
        var fecha = document.getElementById('visitFecha').value;
        var hora = document.getElementById('visitHora').value;
        var notas = document.getElementById('visitNotas').value.trim();

        if (!propId || !fecha || !hora) {
            PNK.toast.warning('Completa todos los campos obligatorios.');
            return;
        }

        // Validate time range
        var h = parseInt(hora.split(':')[0]);
        if (h < 9 || h >= 19) {
            PNK.toast.warning('Las visitas deben ser entre 09:00 y 19:00.');
            return;
        }

        try {
            const data = await PNK.api('visitas.php', {
                method: 'POST',
                body: {
                    propiedadId: propId,
                    fecha: fecha,
                    hora: hora,
                    notas: notas
                }
            });

            if (data.success) {
                PNK.toast.success(data.message);
                form.reset();
                // Reset min date to today
                var dateInput = document.getElementById('visitFecha');
                if (dateInput) {
                    dateInput.min = formatDateISO(new Date());
                }
                await loadVisitas();
            }
        } catch (error) {
            PNK.toast.error(error.message || 'No se pudo agendar la visita.');
        }
    }

    // ── Event Listeners & Carga Inicial ──────────────────────
    async function setupEventListeners() {
        // Calendar navigation
        var prevBtn = document.getElementById('calendarPrev');
        var nextBtn = document.getElementById('calendarNext');
        if (prevBtn) prevBtn.addEventListener('click', function () {
            currentMonth--;
            if (currentMonth < 0) { currentMonth = 11; currentYear--; }
            renderCalendar();
        });
        if (nextBtn) nextBtn.addEventListener('click', function () {
            currentMonth++;
            if (currentMonth > 11) { currentMonth = 0; currentYear++; }
            renderCalendar();
        });

        // Filter tabs
        var tabs = document.querySelectorAll('.agenda-filter-tab');
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                tabs.forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                currentFilter = tab.getAttribute('data-filter');
                renderVisitList();
            });
        });

        // New visit form
        var form = document.getElementById('formNuevaVisita');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                agendarVisita();
            });
        }

        // Populate property select dynamically from properties API
        var select = document.getElementById('visitProp');
        if (select) {
            var session = PNK.getSession();
            if (session) {
                try {
                    let url = 'propiedades.php';
                    if (session.rol === 'gestor') {
                        url += `?gestorId=${session.id}`;
                    } else if (session.rol === 'propietario') {
                        url += `?propietarioId=${session.id}`;
                    }
                    
                    const data = await PNK.api(url);
                    if (data.success && data.propiedades) {
                        select.innerHTML = '<option value="" disabled selected>Selecciona propiedad...</option>';
                        data.propiedades.forEach(function (p) {
                            var opt = document.createElement('option');
                            opt.value = p.id;
                            opt.textContent = p.codigo + ' - ' + p.titulo;
                            select.appendChild(opt);
                        });
                    }
                } catch (error) {
                    console.error('Error cargando propiedades para selección:', error);
                }
            }
        }

        // Set min date to today
        var dateInput = document.getElementById('visitFecha');
        if (dateInput) {
            dateInput.min = formatDateISO(new Date());
        }
    }

    // ── Inicialización ───────────────────────────────────────
    function initCalendar() {
        var now = new Date();
        currentYear = now.getFullYear();
        currentMonth = now.getMonth();
        setupEventListeners();
        loadVisitas();
    }

    document.addEventListener('DOMContentLoaded', initCalendar);

    // ── API Pública ──────────────────────────────────────────
    window.PNK = window.PNK || {};
    PNK.agenda = {
        updateStatus: updateVisitStatus,
        refresh: loadVisitas
    };

})();
