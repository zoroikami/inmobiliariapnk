/**
 * ============================================================
 *  INMOBILIARIA PNK — Centro de Notificaciones
 *  Sistema persistente de notificaciones con campana y panel
 * ============================================================
 */

(function () {
    'use strict';

    var STORAGE_KEY = 'pnk_notificaciones';

    // ── Helpers ───────────────────────────────────────────────
    function getNotifications() {
        try {
            var data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function saveNotifications(notifs) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
    }

    // ── Agregar notificación ──────────────────────────────────
    function addNotification(tipo, mensaje, userId) {
        var notifs = getNotifications();
        var notif = {
            id: 'notif_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5),
            tipo: tipo,
            mensaje: mensaje,
            fecha: new Date().toISOString(),
            leida: false,
            userId: userId || 'all'
        };
        notifs.unshift(notif); // Más recientes primero
        // Limitar a 50 notificaciones
        if (notifs.length > 50) notifs = notifs.slice(0, 50);
        saveNotifications(notifs);
        updateBadge();
        return notif;
    }

    // ── Obtener no leídas ────────────────────────────────────
    function getUnreadCount(userId) {
        var notifs = getNotifications();
        return notifs.filter(function (n) {
            return !n.leida && (n.userId === 'all' || n.userId === userId);
        }).length;
    }

    function getUserNotifications(userId) {
        var notifs = getNotifications();
        return notifs.filter(function (n) {
            return n.userId === 'all' || n.userId === userId;
        });
    }

    // ── Marcar como leída ────────────────────────────────────
    function markAsRead(notifId) {
        var notifs = getNotifications();
        for (var i = 0; i < notifs.length; i++) {
            if (notifs[i].id === notifId) {
                notifs[i].leida = true;
                break;
            }
        }
        saveNotifications(notifs);
        updateBadge();
    }

    function markAllAsRead(userId) {
        var notifs = getNotifications();
        notifs.forEach(function (n) {
            if (n.userId === 'all' || n.userId === userId) {
                n.leida = true;
            }
        });
        saveNotifications(notifs);
        updateBadge();
        renderPanel();
    }

    // ── Ícono por tipo ───────────────────────────────────────
    function getNotifIcon(tipo) {
        var icons = {
            'nueva_propiedad': { icon: 'fa-building', color: '#10b981' },
            'cambio_estado': { icon: 'fa-exchange-alt', color: '#f59e0b' },
            'gestor_pendiente': { icon: 'fa-user-clock', color: '#3b82f6' },
            'visita_agendada': { icon: 'fa-calendar-check', color: '#8b5cf6' },
            'mensaje_nuevo': { icon: 'fa-comment-dots', color: '#ec4899' },
            'usuario_nuevo': { icon: 'fa-user-plus', color: '#06b6d4' },
            'sistema': { icon: 'fa-info-circle', color: '#6b7280' }
        };
        return icons[tipo] || icons['sistema'];
    }

    // ── Formatear tiempo relativo ────────────────────────────
    function timeAgo(dateStr) {
        var now = new Date();
        var then = new Date(dateStr);
        var diff = Math.floor((now - then) / 1000);

        if (diff < 60) return 'Ahora';
        if (diff < 3600) return Math.floor(diff / 60) + ' min';
        if (diff < 86400) return Math.floor(diff / 3600) + ' h';
        if (diff < 604800) return Math.floor(diff / 86400) + ' d';
        return then.toLocaleDateString('es-CL');
    }

    // ── Actualizar badge ─────────────────────────────────────
    function updateBadge() {
        var session = window.PNK && PNK.getSession ? PNK.getSession() : null;
        var userId = session ? session.id : null;
        var count = userId ? getUnreadCount(userId) : 0;

        var badges = document.querySelectorAll('.notif-badge');
        badges.forEach(function (badge) {
            if (count > 0) {
                badge.textContent = count > 9 ? '9+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    // ── Renderizar panel ─────────────────────────────────────
    function renderPanel() {
        var panel = document.getElementById('notifPanel');
        var list = document.getElementById('notifList');
        if (!panel || !list) return;

        var session = window.PNK && PNK.getSession ? PNK.getSession() : null;
        var userId = session ? session.id : null;
        if (!userId) return;

        var notifs = getUserNotifications(userId).slice(0, 15);

        if (notifs.length === 0) {
            list.innerHTML = '<div class="notif-empty">' +
                '<i class="fas fa-bell-slash"></i>' +
                '<p>No tienes notificaciones</p>' +
                '</div>';
            return;
        }

        var html = '';
        notifs.forEach(function (n) {
            var iconData = getNotifIcon(n.tipo);
            var unreadClass = n.leida ? '' : ' notif-unread';

            html += '<div class="notif-item' + unreadClass + '" data-id="' + n.id + '">';
            html += '<div class="notif-icon" style="background:' + iconData.color + '20;color:' + iconData.color + '">';
            html += '<i class="fas ' + iconData.icon + '"></i>';
            html += '</div>';
            html += '<div class="notif-content">';
            html += '<p class="notif-message">' + n.mensaje + '</p>';
            html += '<span class="notif-time">' + timeAgo(n.fecha) + '</span>';
            html += '</div>';
            html += '</div>';
        });
        list.innerHTML = html;

        // Click para marcar como leída
        list.querySelectorAll('.notif-item').forEach(function (item) {
            item.addEventListener('click', function () {
                var id = item.getAttribute('data-id');
                markAsRead(id);
                item.classList.remove('notif-unread');
            });
        });
    }

    // ── Toggle panel ─────────────────────────────────────────
    function togglePanel() {
        var panel = document.getElementById('notifPanel');
        if (!panel) return;

        var isOpen = panel.classList.contains('notif-panel-open');
        if (isOpen) {
            panel.classList.remove('notif-panel-open');
        } else {
            renderPanel();
            panel.classList.add('notif-panel-open');
        }
    }

    // ── Cerrar panel al hacer click fuera ────────────────────
    document.addEventListener('click', function (e) {
        var panel = document.getElementById('notifPanel');
        var bell = document.querySelector('.notif-bell-btn');
        if (panel && bell && !panel.contains(e.target) && !bell.contains(e.target)) {
            panel.classList.remove('notif-panel-open');
        }
    });

    // ── Inyectar estilos ─────────────────────────────────────
    var styles = document.createElement('style');
    styles.textContent = '\
        .notif-wrapper { position: relative; } \
        .notif-bell-btn { \
            width: 42px; height: 42px; border-radius: 12px; \
            border: 1px solid #e2e8f0; background: transparent; \
            cursor: pointer; display: flex; align-items: center; \
            justify-content: center; font-size: 1.15rem; \
            color: #6b7280; transition: all 0.3s ease; position: relative; \
        } \
        .notif-bell-btn:hover { \
            background: rgba(16, 185, 129, 0.1); border-color: #10b981; color: #10b981; \
        } \
        [data-theme="dark"] .notif-bell-btn { \
            border-color: #334155; color: #94a3b8; \
        } \
        [data-theme="dark"] .notif-bell-btn:hover { \
            background: rgba(52, 211, 153, 0.15); border-color: #34d399; color: #34d399; \
        } \
        .notif-badge { \
            position: absolute; top: -4px; right: -4px; \
            min-width: 18px; height: 18px; border-radius: 9px; \
            background: #ef4444; color: white; font-size: 0.65rem; \
            font-weight: 700; display: none; align-items: center; \
            justify-content: center; padding: 0 4px; \
            animation: notifPulse 2s infinite; \
        } \
        @keyframes notifPulse { \
            0%, 100% { transform: scale(1); } \
            50% { transform: scale(1.1); } \
        } \
        .notif-panel { \
            position: absolute; top: calc(100% + 10px); right: 0; \
            width: 360px; max-height: 480px; \
            background: #fff; border-radius: 16px; \
            box-shadow: 0 20px 60px rgba(0,0,0,0.15); \
            z-index: 9999; opacity: 0; visibility: hidden; \
            transform: translateY(-10px); \
            transition: all 0.25s ease; \
            overflow: hidden; \
        } \
        .notif-panel-open { \
            opacity: 1; visibility: visible; transform: translateY(0); \
        } \
        [data-theme="dark"] .notif-panel { \
            background: #1e293b; \
            box-shadow: 0 20px 60px rgba(0,0,0,0.4); \
        } \
        .notif-header { \
            padding: 16px 20px; border-bottom: 1px solid #f1f5f9; \
            display: flex; justify-content: space-between; align-items: center; \
        } \
        [data-theme="dark"] .notif-header { border-color: #334155; } \
        .notif-header h6 { margin: 0; font-weight: 700; font-size: 0.95rem; } \
        [data-theme="dark"] .notif-header h6 { color: #e2e8f0; } \
        .notif-mark-all { \
            background: none; border: none; color: #10b981; \
            font-size: 0.8rem; font-weight: 600; cursor: pointer; \
        } \
        .notif-mark-all:hover { text-decoration: underline; } \
        .notif-list { max-height: 380px; overflow-y: auto; } \
        .notif-item { \
            display: flex; gap: 12px; padding: 14px 20px; \
            border-bottom: 1px solid #f8fafc; cursor: pointer; \
            transition: background 0.2s; \
        } \
        .notif-item:hover { background: #f8fafc; } \
        [data-theme="dark"] .notif-item { border-color: #1e293b; } \
        [data-theme="dark"] .notif-item:hover { background: #334155; } \
        .notif-unread { background: #f0fdf4; } \
        [data-theme="dark"] .notif-unread { background: rgba(52,211,153,0.08); } \
        .notif-icon { \
            width: 36px; height: 36px; border-radius: 10px; \
            display: flex; align-items: center; justify-content: center; \
            font-size: 0.85rem; flex-shrink: 0; \
        } \
        .notif-content { flex: 1; min-width: 0; } \
        .notif-message { \
            margin: 0; font-size: 0.85rem; line-height: 1.4; \
            color: #374151; \
        } \
        [data-theme="dark"] .notif-message { color: #cbd5e1; } \
        .notif-time { font-size: 0.7rem; color: #9ca3af; } \
        .notif-empty { \
            padding: 40px 20px; text-align: center; color: #9ca3af; \
        } \
        .notif-empty i { font-size: 2rem; margin-bottom: 10px; display: block; } \
        .notif-empty p { margin: 0; font-size: 0.85rem; } \
    ';
    document.head.appendChild(styles);

    // ── Setup al cargar DOM ──────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        // Buscar botones de campana
        var bells = document.querySelectorAll('.notif-bell-btn');
        bells.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                togglePanel();
            });
        });

        // Botón "marcar todas como leídas"
        var markAllBtn = document.getElementById('notifMarkAll');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', function () {
                var session = window.PNK && PNK.getSession ? PNK.getSession() : null;
                if (session) markAllAsRead(session.id);
            });
        }

        // Inicializar badge
        updateBadge();

        // Generar notificaciones de demostración si no existen
        var notifs = getNotifications();
        if (notifs.length === 0) {
            seedNotifications();
        }
    });

    // ── Datos semilla de notificaciones ──────────────────────
    function seedNotifications() {
        var seeds = [
            { tipo: 'nueva_propiedad', mensaje: 'Se publicó "Casa Condominio Serena Golf - Premium" en el catálogo.', userId: 'all', hoursAgo: 2 },
            { tipo: 'cambio_estado', mensaje: 'La propiedad "Depto Amoblado Av. del Mar" cambió a estado Arrendado.', userId: 'usr_gestor_001', hoursAgo: 5 },
            { tipo: 'gestor_pendiente', mensaje: 'Nuevo gestor pendiente de aprobación: Carlos Muñoz.', userId: 'usr_admin_001', hoursAgo: 8 },
            { tipo: 'usuario_nuevo', mensaje: 'Se registró un nuevo propietario: Ana María.', userId: 'usr_admin_001', hoursAgo: 24 },
            { tipo: 'sistema', mensaje: 'Bienvenido a Inmobiliaria PNK. Explora las nuevas funcionalidades del sistema.', userId: 'all', hoursAgo: 48 }
        ];

        var notifs = [];
        seeds.forEach(function (s) {
            var date = new Date();
            date.setHours(date.getHours() - s.hoursAgo);
            notifs.push({
                id: 'notif_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5),
                tipo: s.tipo,
                mensaje: s.mensaje,
                fecha: date.toISOString(),
                leida: s.hoursAgo > 24,
                userId: s.userId
            });
        });

        saveNotifications(notifs);
        updateBadge();
    }

    // ── API Pública ──────────────────────────────────────────
    window.PNK = window.PNK || {};
    PNK.notify = {
        add: addNotification,
        getUnread: getUnreadCount,
        getUserNotifs: getUserNotifications,
        markRead: markAsRead,
        markAllRead: markAllAsRead,
        refresh: updateBadge
    };

})();
