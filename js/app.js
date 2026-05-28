/**
 * ============================================================
 *  INMOBILIARIA PNK — Inicialización de la Aplicación
 *  Carga datos semilla en localStorage (solo la primera vez)
 * ============================================================
 */

(function () {
    'use strict';

    // ── Datos Semilla: Usuarios ───────────────────────────────
    var SEED_USUARIOS = [
        {
            id: 'usr_admin_001',
            nombre: 'Administrador Sistema',
            rut: 'System',
            email: 'admin@pnk.cl',
            telefono: '-',
            fechaNacimiento: '',
            sexo: '',
            rol: 'admin',
            estado: 'sistema',
            password: 'admin123',
            fechaCreacion: '2026-01-01'
        },
        {
            id: 'usr_gestor_001',
            nombre: 'Pedro Soto',
            rut: '12.345.678-9',
            email: 'pedro.s@pnk.cl',
            telefono: '+56 9 8765 4321',
            fechaNacimiento: '1990-05-15',
            sexo: 'M',
            rol: 'gestor',
            estado: 'habilitado',
            password: 'gestor123',
            fechaCreacion: '2026-03-10'
        },
        {
            id: 'usr_prop_001',
            nombre: 'Ana María',
            rut: '10.456.789-0',
            email: 'ana.m@gmail.com',
            telefono: '+56 9 6543 2109',
            fechaNacimiento: '1985-11-22',
            sexo: 'F',
            rol: 'propietario',
            estado: 'activo',
            password: 'prop123',
            fechaCreacion: '2026-02-20'
        },
        {
            id: 'usr_cli_001',
            nombre: 'Diego Valdivia',
            rut: '15.678.901-2',
            email: 'diego.v@gmail.com',
            telefono: '+56 9 7654 3210',
            fechaNacimiento: '1993-08-25',
            sexo: 'M',
            rol: 'cliente',
            estado: 'activo',
            password: 'user123',
            fechaCreacion: '2026-04-10'
        }
    ];

    // ── Datos Semilla: Propiedades ─────────────────────────────
    // Coordenadas reales de La Serena y alrededores
    var SEED_PROPIEDADES = [
        {
            id: 'prop_001',
            codigo: 'PNK-001',
            titulo: 'Depto Condominio Distrito Verde - Entrega Inmediata',
            descripcion: 'Departamento nuevo en condominio Distrito Verde, entrega inmediata. Excelentes terminaciones, piso flotante, cocina equipada con encimera y campana. Condominio con áreas verdes, estacionamiento de visitas, sala multiuso y juegos infantiles. Cercano a supermercados, colegios y transporte público.',
            tipo: 'Departamento',
            operacion: 'Venta',
            precioCLP: 81000000,
            precioUF: 2443,
            direccion: 'Emilio Apey 409, La Serena',
            comuna: 'La Serena',
            region: 'Coquimbo',
            dormitorios: 2,
            banos: 1,
            superficieTotal: 52,
            superficieConstruida: 46,
            extras: ['Estacionamiento', 'Bodega'],
            imagen: 'https://icpacifico.cl/wp-content/uploads/2024/02/fachada-Distrito-Verde-1.jpg',
            estado: 'publicado',
            lat: -29.9079,
            lng: -71.2462,
            gestorId: 'usr_gestor_001',
            propietarioId: 'usr_prop_001',
            fechaCreacion: '2026-04-01',
            categoria: 'depto'
        },
        {
            id: 'prop_002',
            codigo: 'PNK-002',
            titulo: 'Depto Condominio Palmaris - Venta en Blanco',
            descripcion: 'Proyecto nuevo Palmaris en sector Av. Pacífico. Departamento de 2 dormitorios con terraza, estacionamiento incluido. Piscina comunitaria, quinchos y salón de eventos. Ideal para inversión con alta rentabilidad de arriendo. Subsidio DS1 aplicable.',
            tipo: 'Departamento',
            operacion: 'Venta',
            precioCLP: 86000000,
            precioUF: 2600,
            direccion: 'Av. Pacífico 3114, La Serena',
            comuna: 'La Serena',
            region: 'Coquimbo',
            dormitorios: 2,
            banos: 2,
            superficieTotal: 58,
            superficieConstruida: 51,
            extras: ['Estacionamiento', 'Piscina', 'Bodega'],
            imagen: 'https://icpacifico.cl/wp-content/uploads/2025/08/banner-palmaris-2.jpg',
            estado: 'publicado',
            lat: -29.9233,
            lng: -71.2755,
            gestorId: 'usr_gestor_001',
            propietarioId: 'usr_prop_001',
            fechaCreacion: '2026-04-05',
            categoria: 'depto'
        },
        {
            id: 'prop_003',
            codigo: 'PNK-003',
            titulo: 'Depto Pacific Blue - Vista al Mar',
            descripcion: 'Espectacular departamento en edificio Pacific Blue con vista directa al océano Pacífico. Piso 8 con balcón panorámico. Terminaciones de lujo: porcelanato, griferías de diseño, closets empotrados. Edificio con piscina temperada, gimnasio equipado, sala de cine y conserje 24/7.',
            tipo: 'Departamento',
            operacion: 'Venta',
            precioCLP: 145000000,
            precioUF: 4372,
            direccion: 'Emilio Apey 500, Sector Av. del Mar, La Serena',
            comuna: 'La Serena',
            region: 'Coquimbo',
            dormitorios: 3,
            banos: 2,
            superficieTotal: 82,
            superficieConstruida: 74,
            extras: ['Estacionamiento', 'Piscina', 'Seguridad 24/7', 'Bodega'],
            imagen: 'https://icpacifico.cl/wp-content/uploads/2026/05/almar-banner-pc.jpg',
            estado: 'publicado',
            lat: -29.9085,
            lng: -71.2470,
            gestorId: 'usr_gestor_001',
            propietarioId: 'usr_prop_001',
            fechaCreacion: '2026-04-10',
            categoria: 'depto'
        },
        {
            id: 'prop_004',
            codigo: 'PNK-004',
            titulo: 'Depto Playa Serena - Primera Línea de Playa',
            descripcion: 'Departamento premium en Edificio Playa Serena, primera línea de Avenida del Mar. 3 dormitorios, 2 baños, living-comedor con vista frontal al mar. Cocina equipada con isla central. Terraza de 12m². Edificio con sala de eventos, piscina infinita en azotea y estacionamiento subterráneo.',
            tipo: 'Departamento',
            operacion: 'Venta',
            precioCLP: 156000000,
            precioUF: 4698,
            direccion: 'Av. del Mar 3500, La Serena',
            comuna: 'La Serena',
            region: 'Coquimbo',
            dormitorios: 3,
            banos: 2,
            superficieTotal: 95,
            superficieConstruida: 83,
            extras: ['Estacionamiento', 'Piscina', 'Seguridad 24/7', 'Bodega', 'Logia'],
            imagen: 'https://icpacifico.cl/wp-content/uploads/2026/04/banner-img-editable_DESTOP-copia-19.jpg',
            estado: 'publicado',
            lat: -29.9230,
            lng: -71.2725,
            gestorId: 'usr_gestor_001',
            propietarioId: 'usr_prop_001',
            fechaCreacion: '2026-04-12',
            categoria: 'depto'
        },
        {
            id: 'prop_005',
            codigo: 'PNK-005',
            titulo: 'Casa en Sector San Joaquín - 4 Dormitorios',
            descripcion: 'Amplia casa en sector residencial San Joaquín, uno de los barrios más buscados de La Serena. Living-comedor con salida a terraza, cocina amoblada, 4 dormitorios (1 en suite), patio trasero con quincho y estacionamiento para 2 vehículos. Cerca de colegios, supermercado Jumbo y acceso rápido a Ruta 5.',
            tipo: 'Casa',
            operacion: 'Venta',
            precioCLP: 182000000,
            precioUF: 5490,
            direccion: 'Av. Guillermo Ulriksen 1830, San Joaquín, La Serena',
            comuna: 'La Serena',
            region: 'Coquimbo',
            dormitorios: 4,
            banos: 3,
            superficieTotal: 220,
            superficieConstruida: 145,
            extras: ['Estacionamiento', 'Antejardín', 'Patio Trasero', 'Cocina Amoblada'],
            imagen: 'https://ppartnersgroupstorage.blob.core.windows.net/crm-files/PP-5d3a390e0ff0a92e6136bcb502f1209f_1775148663324_image_22jpg.jpg',
            estado: 'publicado',
            lat: -29.9200,
            lng: -71.2600,
            gestorId: 'usr_gestor_001',
            propietarioId: 'usr_prop_001',
            fechaCreacion: '2026-04-15',
            categoria: 'casa'
        },
        {
            id: 'prop_006',
            codigo: 'PNK-006',
            titulo: 'Casa Peñuelas - Arriendo Mensual',
            descripcion: 'Casa en arriendo en sector Peñuelas, Coquimbo. 3 dormitorios, 2 baños, estacionamiento techado. Patio trasero amplio con césped. Barrio consolidado, cercano a colegios, plazas y a 10 minutos de Playa La Herradura. Disponible inmediatamente.',
            tipo: 'Casa',
            operacion: 'Arriendo',
            precioCLP: 680000,
            precioUF: 21,
            direccion: 'Sector Peñuelas, Coquimbo',
            comuna: 'Coquimbo',
            region: 'Coquimbo',
            dormitorios: 3,
            banos: 2,
            superficieTotal: 130,
            superficieConstruida: 95,
            extras: ['Estacionamiento', 'Patio Trasero', 'Antejardín'],
            imagen: 'https://ppartnersgroupstorage.blob.core.windows.net/crm-files/PP-583b28405bff126cecef8f6fbf74a9ef_1775148663322_image_15jpg.jpg',
            estado: 'publicado',
            lat: -29.9485,
            lng: -71.2905,
            gestorId: 'usr_gestor_001',
            propietarioId: 'usr_prop_001',
            fechaCreacion: '2026-04-18',
            categoria: 'casa'
        },
        {
            id: 'prop_007',
            codigo: 'PNK-007',
            titulo: 'Depto Amoblado Av. del Mar - Arriendo Temporada',
            descripcion: 'Departamento completamente amoblado y equipado frente a Playa Cuatro Esquinas. 2 dormitorios, vista al mar, WiFi, TV smart, cocina full equipo. Ideal para arriendo vacacional o estadía temporal. Disponible por día, semana o mes. Condominio con piscina y quincho.',
            tipo: 'Departamento',
            operacion: 'Arriendo Temporada',
            precioCLP: 55000,
            precioUF: 0,
            direccion: 'Av. del Mar 5800, Cuatro Esquinas, La Serena',
            comuna: 'La Serena',
            region: 'Coquimbo',
            dormitorios: 2,
            banos: 1,
            superficieTotal: 55,
            superficieConstruida: 48,
            extras: ['Piscina', 'Cocina Amoblada', 'Estacionamiento'],
            imagen: 'https://icpacifico.cl/wp-content/uploads/2025/09/back-palm6.jpg',
            estado: 'arrendado',
            lat: -29.9249,
            lng: -71.2786,
            gestorId: 'usr_gestor_001',
            propietarioId: 'usr_prop_001',
            fechaCreacion: '2026-04-20',
            categoria: 'depto'
        },
        {
            id: 'prop_008',
            codigo: 'PNK-008',
            titulo: 'Terreno Urbano - Tierras Blancas',
            descripcion: 'Sitio urbano de 450m² con factibilidad de agua, luz y alcantarillado. Terreno plano, regular, orientación norte. Sector en pleno desarrollo con nuevos proyectos habitacionales. Ideal para construir vivienda con subsidio o proyecto de inversión. Escritura al día.',
            tipo: 'Terreno / Sitio',
            operacion: 'Venta',
            precioCLP: 42000000,
            precioUF: 1265,
            direccion: 'Sector Tierras Blancas, Coquimbo',
            comuna: 'Coquimbo',
            region: 'Coquimbo',
            dormitorios: 0,
            banos: 0,
            superficieTotal: 450,
            superficieConstruida: 0,
            extras: [],
            imagen: 'https://ppartnersgroupstorage.blob.core.windows.net/crm-files/PP-770b2594bc2909782807967aab96320e_1778702804786_screenshot-2026-05-13-160345png.jpg',
            estado: 'publicado',
            lat: -29.9653,
            lng: -71.2554,
            gestorId: 'usr_gestor_001',
            propietarioId: 'usr_prop_001',
            fechaCreacion: '2026-04-22',
            categoria: 'terreno'
        },
        {
            id: 'prop_009',
            codigo: 'PNK-009',
            titulo: 'Local Comercial Centro La Serena',
            descripcion: 'Local comercial de 85m² en pleno centro de La Serena, calle Balmaceda a pasos de la Plaza de Armas. Alta circulación peatonal. Ideal para retail, oficina profesional o gastronomía. Cuenta con baño privado, bodega interior y vitrina a la calle.',
            tipo: 'Local Comercial',
            operacion: 'Arriendo',
            precioCLP: 950000,
            precioUF: 29,
            direccion: 'Balmaceda 460, Centro, La Serena',
            comuna: 'La Serena',
            region: 'Coquimbo',
            dormitorios: 0,
            banos: 1,
            superficieTotal: 85,
            superficieConstruida: 85,
            extras: ['Bodega', 'Seguridad 24/7'],
            imagen: 'https://ppartnersgroupstorage.blob.core.windows.net/crm-files/PP-813989972acc92a9b675d27f1431cae2_1775148663320_image_6jpg.jpg',
            estado: 'publicado',
            lat: -29.9048,
            lng: -71.2530,
            gestorId: 'usr_gestor_001',
            propietarioId: 'usr_prop_001',
            fechaCreacion: '2026-04-25',
            categoria: 'comercial'
        },
        {
            id: 'prop_010',
            codigo: 'PNK-010',
            titulo: 'Casa Condominio Serena Golf - Premium',
            descripcion: 'Exclusiva casa en condominio cerrado Serena Golf Club. 5 dormitorios, 4 baños, suite principal con walking closet y tina de hidromasaje. Living doble altura, cocina gourmet con isla. Jardín de 200m² con piscina privada y quincho. Vista a la cancha de golf. Portería 24/7.',
            tipo: 'Casa',
            operacion: 'Venta',
            precioCLP: 430000000,
            precioUF: 12970,
            direccion: 'Condominio Serena Golf, Av. La Cantera, La Serena',
            comuna: 'La Serena',
            region: 'Coquimbo',
            dormitorios: 5,
            banos: 4,
            superficieTotal: 450,
            superficieConstruida: 280,
            extras: ['Piscina', 'Estacionamiento', 'Seguridad 24/7', 'Patio Trasero', 'Antejardín', 'Cocina Amoblada'],
            imagen: 'https://ppartnersgroupstorage.blob.core.windows.net/crm-files/PP-252bf6cfd8f791857f7ee448688c80da_1775148663321_image_9jpg.jpg',
            estado: 'publicado',
            lat: -29.8438,
            lng: -71.2771,
            gestorId: 'usr_gestor_001',
            propietarioId: 'usr_prop_001',
            fechaCreacion: '2026-04-28',
            categoria: 'casa'
        }
    ];

    // ── Función de inicialización ─────────────────────────────
    var DATA_VERSION = '8.0'; // v8: soporte para usuario normal (cliente) y validación flexible
    function initApp() {
        var currentVersion = localStorage.getItem('pnk_data_version');
        // Cargar datos semilla si es primera vez O si la versión cambió
        if (!localStorage.getItem(PNK.KEYS.INITIALIZED) || currentVersion !== DATA_VERSION) {
            PNK.setData(PNK.KEYS.USUARIOS, SEED_USUARIOS);
            PNK.setData(PNK.KEYS.PROPIEDADES, SEED_PROPIEDADES);
            localStorage.setItem(PNK.KEYS.INITIALIZED, 'true');
            localStorage.setItem('pnk_data_version', DATA_VERSION);
            console.log('🏠 Inmobiliaria PNK — Datos v' + DATA_VERSION + ' cargados (propiedades reales Región de Coquimbo)');
        }
    }

    // ── Ejecutar al cargar la página ──────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }

    // Exponer datos semilla para referencia
    PNK.SEED = {
        usuarios: SEED_USUARIOS,
        propiedades: SEED_PROPIEDADES
    };

})();
