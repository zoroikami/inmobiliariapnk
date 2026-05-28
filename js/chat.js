/**
 * ============================================================
 *  INMOBILIARIA PNK — Chat / Mensajería (Refactorizado a API)
 *  Sistema de mensajes entre gestores y propietarios
 * ============================================================
 */

(function () {
    'use strict';

    var activeConversation = null;
    var refreshIntervalId = null;

    // ── Formato hora del mensaje ────────────────────────────
    function formatMsgTime(dateStr) {
        var d = new Date(dateStr);
        var now = new Date();
        var diffDays = Math.floor((now - d) / 86400000);

        var time = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        if (diffDays === 0) return time;
        if (diffDays === 1) return 'Ayer ' + time;
        return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }) + ' ' + time;
    }

    function formatConvTime(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        var now = new Date();
        var diffDays = Math.floor((now - d) / 86400000);
        if (diffDays === 0) return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        if (diffDays === 1) return 'Ayer';
        return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
    }

    // ── Obtener y renderizar conversaciones ────────────────────────────
    async function loadConversations() {
        var list = document.getElementById('chatConvList');
        if (!list) return;

        var session = PNK.getSession();
        if (!session) return;

        try {
            const data = await PNK.api('mensajes.php?action=conversations');
            if (!data.success || !data.conversaciones) {
                list.innerHTML = '<div class="chat-empty"><i class="fas fa-comments"></i><p>No hay conversaciones</p></div>';
                return;
            }

            var convs = data.conversaciones;
            if (convs.length === 0) {
                list.innerHTML = '<div class="chat-empty"><i class="fas fa-comments"></i><p>No hay conversaciones</p></div>';
                return;
            }

            var html = '';
            convs.forEach(function (c) {
                var user = c.user;
                var initials = PNK.getInitials(user.nombre);
                var avatarColor = PNK.getAvatarColor(user.rol);
                var activeClass = activeConversation === user.id ? ' active' : '';
                var lastMsg = PNK.truncate(c.lastMessage, 35);

                html += '<div class="chat-conv-item' + activeClass + '" data-user="' + user.id + '">';
                html += '<div class="chat-conv-avatar" style="background:' + avatarColor + '">' + initials + '</div>';
                html += '<div class="chat-conv-info">';
                html += '<p class="chat-conv-name">' + PNK.escapeHTML(user.nombre) + '</p>';
                html += '<p class="chat-conv-last">' + PNK.escapeHTML(lastMsg) + '</p>';
                html += '</div>';
                html += '<div class="chat-conv-meta">';
                html += '<span class="chat-conv-time">' + formatConvTime(c.fecha) + '</span>';
                if (c.unread > 0) html += '<span class="chat-conv-unread">' + c.unread + '</span>';
                html += '</div>';
                html += '</div>';
            });
            list.innerHTML = html;

            // Click handler
            list.querySelectorAll('.chat-conv-item').forEach(function (item) {
                item.addEventListener('click', function () {
                    var newActive = item.getAttribute('data-user');
                    if (activeConversation !== newActive) {
                        activeConversation = newActive;
                        // Quitar active de los demás
                        list.querySelectorAll('.chat-conv-item').forEach(function (el) {
                            el.classList.remove('active');
                        });
                        item.classList.add('active');
                        
                        loadMessages();

                        // Mobile: show messages
                        var layout = document.querySelector('.chat-layout');
                        if (layout) layout.classList.add('chat-showing-messages');
                    }
                });
            });
        } catch (error) {
            console.error('Error cargando conversaciones:', error);
            list.innerHTML = '<div class="chat-empty text-danger"><i class="fas fa-exclamation-circle"></i><p>Error de conexión</p></div>';
        }
    }

    // ── Obtener y renderizar mensajes ──────────────────────────────────
    async function loadMessages() {
        var body = document.getElementById('chatMsgBody');
        var header = document.getElementById('chatMsgHeader');
        var inputArea = document.getElementById('chatInputArea');
        if (!body) return;

        var session = PNK.getSession();
        if (!session || !activeConversation) {
            body.innerHTML = '<div class="chat-empty"><i class="fas fa-paper-plane"></i><p>Selecciona una conversación</p></div>';
            if (header) header.style.display = 'none';
            if (inputArea) inputArea.style.display = 'none';
            return;
        }

        if (header) header.style.display = 'flex';
        if (inputArea) inputArea.style.display = 'flex';

        try {
            const data = await PNK.api(`mensajes.php?action=messages&with=${activeConversation}`);
            if (!data.success || !data.mensajes) {
                body.innerHTML = '<div class="chat-empty text-danger"><i class="fas fa-exclamation-circle"></i><p>Error cargando mensajes</p></div>';
                return;
            }

            // Obtener info de la conversación seleccionada
            // La buscamos entre las conversaciones ya cargadas o la consultamos
            var headerName = document.getElementById('chatHeaderName');
            var headerRole = document.getElementById('chatHeaderRole');
            
            // Intentar rellenar header con los datos del remitente
            // El backend retorna mensajes, podemos obtener los datos del remitente/destinatario que no es el usuario
            var otherUser = null;
            
            // Buscar en la lista de opciones para obtener detalles del nombre del contacto
            var activeConvEl = document.querySelector(`.chat-conv-item[data-user="${activeConversation}"]`);
            if (activeConvEl) {
                var nameText = activeConvEl.querySelector('.chat-conv-name').textContent;
                if (headerName) headerName.textContent = nameText;
            }

            var msgs = data.mensajes;

            // Render
            var html = '';
            if (msgs.length === 0) {
                html = '<div class="chat-empty"><i class="fas fa-comments"></i><p>Comienza la conversación enviando un mensaje.</p></div>';
            } else {
                msgs.forEach(function (m) {
                    var isSent = m.remitenteId === session.id;
                    var cls = isSent ? 'chat-msg-sent' : 'chat-msg-received';

                    html += '<div class="chat-msg ' + cls + '">';
                    html += '<div class="chat-bubble">' + PNK.escapeHTML(m.mensaje) + '</div>';
                    html += '<span class="chat-msg-time">' + formatMsgTime(m.fecha) + '</span>';
                    html += '</div>';
                });
            }

            // Para evitar scroll jumps molestos si el usuario subió el scroll,
            // scroll al fondo sólo si ya estaba cerca o si es la primera carga.
            var isAtBottom = (body.scrollHeight - body.scrollTop - body.clientHeight) < 100;
            var wasEmpty = body.innerHTML === '' || body.querySelector('.chat-empty');

            body.innerHTML = html;

            if (isAtBottom || wasEmpty) {
                body.scrollTop = body.scrollHeight;
            }
        } catch (error) {
            console.error('Error cargando mensajes:', error);
        }
    }

    // ── Enviar mensaje ───────────────────────────────────────
    async function sendMessage() {
        var input = document.getElementById('chatInput');
        if (!input) return;

        var text = input.value.trim();
        if (!text || !activeConversation) return;

        var session = PNK.getSession();
        if (!session) return;

        // Deshabilitar temporalmente para evitar doble envío
        input.disabled = true;

        try {
            const data = await PNK.api('mensajes.php?action=send', {
                method: 'POST',
                body: {
                    destinatarioId: activeConversation,
                    mensaje: text
                }
            });

            if (data.success) {
                input.value = '';
                await loadMessages();
                await loadConversations();
            }
        } catch (error) {
            PNK.toast.error(error.message || 'No se pudo enviar el mensaje.');
        } finally {
            input.disabled = false;
            input.focus();
        }
    }

    // ── Nueva conversación ────────────────────────────────────
    async function newConversation() {
        var session = PNK.getSession();
        if (!session) return;

        try {
            // Obtener usuarios elegibles del backend
            const data = await PNK.api('mensajes.php?action=users');
            if (!data.success || !data.usuarios) {
                PNK.toast.error('No se pudo obtener la lista de usuarios.');
                return;
            }

            var available = data.usuarios;
            if (available.length === 0) {
                PNK.toast.info('No hay otros usuarios disponibles para chatear.');
                return;
            }

            // Construir opciones para el select
            var roleLabels = {
                'admin': '🛡️ Admin',
                'gestor': '📋 Gestor',
                'propietario': '🏠 Propietario',
                'cliente': '👤 Cliente'
            };

            var optionsHtml = '<div style="text-align:left;max-height:300px;overflow-y:auto;">';
            available.forEach(function (u) {
                var initials = PNK.getInitials(u.nombre);
                var avatarColor = PNK.getAvatarColor(u.rol);
                var roleLabel = roleLabels[u.rol] || u.rol;

                optionsHtml += '<div class="swal-user-option" data-uid="' + u.id + '" style="display:flex;align-items:center;gap:12px;padding:10px 14px;cursor:pointer;border-radius:12px;margin-bottom:4px;transition:background 0.2s;"';
                optionsHtml += ' onmouseover="this.style.background=\'#f0fdf4\'" onmouseout="this.style.background=\'transparent\'">';
                optionsHtml += '<div style="width:40px;height:40px;border-radius:10px;background:' + avatarColor + ';color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;">' + initials + '</div>';
                optionsHtml += '<div style="flex:1;min-width:0;">';
                optionsHtml += '<div style="font-weight:600;font-size:0.9rem;">' + PNK.escapeHTML(u.nombre) + '</div>';
                optionsHtml += '<div style="font-size:0.75rem;color:#6b7280;">' + roleLabel + ' · ' + PNK.escapeHTML(u.email) + '</div>';
                optionsHtml += '</div>';
                optionsHtml += '</div>';
            });
            optionsHtml += '</div>';

            Swal.fire({
                title: '<i class="fas fa-pen-to-square" style="color:#10b981"></i> Nueva Conversación',
                html: '<p style="color:#6b7280;font-size:0.85rem;margin-bottom:16px;">Selecciona un usuario para enviarle un mensaje:</p>' + optionsHtml,
                showConfirmButton: false,
                showCloseButton: true,
                width: 420,
                customClass: { popup: 'rounded-4' },
                didOpen: function (popup) {
                    var items = popup.querySelectorAll('.swal-user-option');
                    items.forEach(function (item) {
                        item.addEventListener('click', function () {
                            var uid = item.getAttribute('data-uid');
                            Swal.close();
                            activeConversation = uid;
                            
                            // Forzar render del header con nombre del usuario seleccionado
                            var headerName = document.getElementById('chatHeaderName');
                            var headerRole = document.getElementById('chatHeaderRole');
                            var selUser = available.find(u => u.id === uid);
                            if (selUser) {
                                if (headerName) headerName.textContent = selUser.nombre;
                                if (headerRole) headerRole.textContent = roleLabels[selUser.rol] || selUser.rol;
                            }

                            loadConversations();
                            loadMessages();

                            // Mobile: show messages
                            var layout = document.querySelector('.chat-layout');
                            if (layout) layout.classList.add('chat-showing-messages');

                            // Focus input
                            setTimeout(function () {
                                var input = document.getElementById('chatInput');
                                if (input) input.focus();
                            }, 300);
                        });
                    });
                }
            });
        } catch (error) {
            PNK.toast.error('Error al iniciar nueva conversación: ' + error.message);
        }
    }

    // ── Init ─────────────────────────────────────────────────
    function initChat() {
        var session = PNK.getSession();
        if (!session) return;

        loadConversations();

        // En caso de que se pase un ?with=userId en la URL para iniciar conversación directamente
        var withUserId = PNK.getQueryParam('with');
        if (withUserId) {
            activeConversation = withUserId;
            loadMessages();
            var layout = document.querySelector('.chat-layout');
            if (layout) layout.classList.add('chat-showing-messages');
        }

        // Send button
        var sendBtn = document.getElementById('chatSendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', sendMessage);
        }

        // Enter key
        var input = document.getElementById('chatInput');
        if (input) {
            input.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }

        // Mobile back button
        var backBtn = document.getElementById('chatBackBtn');
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                var layout = document.querySelector('.chat-layout');
                if (layout) layout.classList.remove('chat-showing-messages');
            });
        }

        // New conversation button
        var newConvBtn = document.getElementById('btnNewConv');
        if (newConvBtn) {
            newConvBtn.addEventListener('click', newConversation);
        }

        // Configurar un intervalo periódico para refrescar el chat (cada 5 segundos)
        refreshIntervalId = setInterval(function () {
            loadConversations();
            if (activeConversation) {
                loadMessages();
            }
        }, 5000);
    }

    document.addEventListener('DOMContentLoaded', initChat);

    // Limpieza al descargar la página
    window.addEventListener('beforeunload', function () {
        if (refreshIntervalId) {
            clearInterval(refreshIntervalId);
        }
    });

    // ── API Pública ──────────────────────────────────────────
    window.PNK = window.PNK || {};
    PNK.chat = {
        send: sendMessage,
        refresh: function () { loadConversations(); if (activeConversation) { loadMessages(); } }
    };

})();
