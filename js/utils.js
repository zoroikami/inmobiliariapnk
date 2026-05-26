/**
 * ============================================================
 *  INMOBILIARIA PNK — Módulo de Utilidades
 *  Funciones compartidas: validación, formateo, localStorage
 * ============================================================
 */

const PNK = window.PNK || {};

// ── Keys de localStorage ──────────────────────────────────────
PNK.KEYS = {
    USUARIOS: 'pnk_usuarios',
    PROPIEDADES: 'pnk_propiedades',
    SESION: 'pnk_sesion',
    INITIALIZED: 'pnk_initialized'
};

// ── Helpers de localStorage ───────────────────────────────────
PNK.getData = function (key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error leyendo localStorage:', e);
        return [];
    }
};

PNK.setData = function (key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('Error escribiendo localStorage:', e);
        return false;
    }
};

PNK.getSession = function () {
    try {
        const data = sessionStorage.getItem(PNK.KEYS.SESION);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
};

PNK.setSession = function (user) {
    sessionStorage.setItem(PNK.KEYS.SESION, JSON.stringify(user));
};

PNK.clearSession = function () {
    sessionStorage.removeItem(PNK.KEYS.SESION);
};

// ── Generador de IDs ──────────────────────────────────────────
PNK.generateId = function () {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
};

// ── Generador de código de propiedad ──────────────────────────
PNK.generatePropertyCode = function () {
    const props = PNK.getData(PNK.KEYS.PROPIEDADES);
    const num = props.length + 1;
    return 'PNK-' + String(num).padStart(3, '0');
};

// ── Validación de RUT chileno ─────────────────────────────────
PNK.validateRUT = function (rut) {
    if (!rut || typeof rut !== 'string') return false;

    // Limpiar formato
    const clean = rut.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
    if (clean.length < 2) return false;

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const expectedDV = 11 - (sum % 11);
    let dvCalc;
    if (expectedDV === 11) dvCalc = '0';
    else if (expectedDV === 10) dvCalc = 'K';
    else dvCalc = String(expectedDV);

    return dv === dvCalc;
};

// ── Formateo de RUT ───────────────────────────────────────────
PNK.formatRUT = function (rut) {
    if (!rut) return '';
    const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length < 2) return clean;
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return formatted + '-' + dv;
};

// ── Validación de email ───────────────────────────────────────
PNK.validateEmail = function (email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// ── Validación de teléfono chileno ────────────────────────────
PNK.validatePhone = function (phone) {
    const clean = phone.replace(/[\s\-\(\)]/g, '');
    return /^(\+?56)?9\d{8}$/.test(clean);
};

// ── Formateo de precios ───────────────────────────────────────
PNK.formatCLP = function (amount) {
    if (!amount && amount !== 0) return '-';
    return '$' + Number(amount).toLocaleString('es-CL');
};

PNK.formatUF = function (amount) {
    if (!amount && amount !== 0) return '-';
    return 'UF ' + Number(amount).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// ── Generación de iniciales para avatar ───────────────────────
PNK.getInitials = function (name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ── Color de avatar basado en rol ─────────────────────────────
PNK.getAvatarColor = function (role) {
    const colors = {
        'admin': '#6366f1',
        'gestor': '#10b981',
        'propietario': '#f59e0b'
    };
    return colors[role] || '#6b7280';
};

// ── Badge de estado ───────────────────────────────────────────
PNK.getStatusBadge = function (status) {
    const badges = {
        'activo': { class: 'bg-success', text: 'Activo' },
        'habilitado': { class: 'bg-success', text: 'Habilitado' },
        'deshabilitado': { class: 'bg-danger', text: 'Deshabilitado' },
        'pendiente': { class: 'bg-warning text-dark', text: 'Pendiente' },
        'sistema': { class: 'bg-success', text: 'Sistema' },
        'publicado': { class: 'bg-success', text: 'Publicado' },
        'arrendado': { class: 'bg-warning text-dark', text: 'Arrendado' },
        'no_publicado': { class: 'bg-secondary', text: 'No Publicado' }
    };
    return badges[status] || { class: 'bg-secondary', text: status };
};

// ── Badge de rol ──────────────────────────────────────────────
PNK.getRoleBadge = function (role) {
    const badges = {
        'admin': { class: 'bg-primary text-white', text: 'Administrador' },
        'gestor': { class: 'bg-light text-dark border', text: 'Gestor Free' },
        'propietario': { class: 'bg-light text-dark border', text: 'Propietario' }
    };
    return badges[role] || { class: 'bg-secondary', text: role };
};

// ── Formateo de fecha ─────────────────────────────────────────
PNK.formatDate = function (dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ── Query params helper ───────────────────────────────────────
PNK.getQueryParam = function (name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
};

// ── Escapar HTML ──────────────────────────────────────────────
PNK.escapeHTML = function (str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

// ── Truncar texto ─────────────────────────────────────────────
PNK.truncate = function (str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
};

// Exponer globalmente
window.PNK = PNK;
