<?php
/**
 * ============================================================
 *  INMOBILIARIA PNK — Conexión y Autoinstalación de SQLite
 * ============================================================
 */

define('DB_PATH', __DIR__ . '/inmobiliaria.db');

function getDB() {
    static $db = null;
    if ($db === null) {
        try {
            $db = new PDO('sqlite:' . DB_PATH);
            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Habilitar claves foráneas
            $db->exec('PRAGMA foreign_keys = ON;');
            
            // Inicializar base de datos si no existen las tablas
            initDatabase($db);
        } catch (PDOException $e) {
            header('Content-Type: application/json; charset=utf-8');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al conectar con la base de datos: ' . $e->getMessage()
            ]);
            exit;
        }
    }
    return $db;
}

function initDatabase($db) {
    // 1. Crear tabla de Usuarios
    $db->exec("CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        rut TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        telefono TEXT,
        fechaNacimiento TEXT,
        sexo TEXT,
        rol TEXT NOT NULL,
        estado TEXT NOT NULL,
        password TEXT NOT NULL,
        fechaCreacion TEXT,
        nPropiedad TEXT
    )");

    // 2. Crear tabla de Propiedades
    $db->exec("CREATE TABLE IF NOT EXISTS propiedades (
        id TEXT PRIMARY KEY,
        codigo TEXT NOT NULL,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        tipo TEXT,
        operacion TEXT,
        precioCLP INTEGER,
        precioUF INTEGER,
        direccion TEXT,
        comuna TEXT,
        region TEXT,
        dormitorios INTEGER,
        banos INTEGER,
        superficieTotal INTEGER,
        superficieConstruida INTEGER,
        extras TEXT, -- Guardado como JSON string
        imagen TEXT,
        estado TEXT,
        lat REAL,
        lng REAL,
        gestorId TEXT,
        propietarioId TEXT,
        fechaCreacion TEXT,
        categoria TEXT
    )");

    // 3. Crear tabla de Mensajes (Chat)
    $db->exec("CREATE TABLE IF NOT EXISTS mensajes (
        id TEXT PRIMARY KEY,
        remitenteId TEXT NOT NULL,
        destinatarioId TEXT NOT NULL,
        mensaje TEXT NOT NULL,
        fecha TEXT NOT NULL,
        leido INTEGER DEFAULT 0
    )");

    // 4. Crear tabla de Visitas (Agenda)
    $db->exec("CREATE TABLE IF NOT EXISTS visitas (
        id TEXT PRIMARY KEY,
        propiedadId TEXT NOT NULL,
        gestorId TEXT NOT NULL,
        propietarioId TEXT NOT NULL,
        fecha TEXT NOT NULL,
        hora TEXT NOT NULL,
        estado TEXT NOT NULL,
        notas TEXT
    )");

    // Verificar si ya hay usuarios; si está vacío, sembrar semillas iniciales
    $count = $db->query("SELECT COUNT(*) FROM usuarios")->fetchColumn();
    if ($count == 0) {
        seedDatabase($db);
    }
}

function seedDatabase($db) {
    // ── Sembrar Usuarios (Cifrando contraseñas de demostración) ──
    $usuarios = [
        [
            'id' => 'usr_admin_001',
            'nombre' => 'Administrador Sistema',
            'rut' => 'System',
            'email' => 'admin@pnk.cl',
            'telefono' => '-',
            'fechaNacimiento' => '',
            'sexo' => '',
            'rol' => 'admin',
            'estado' => 'sistema',
            'password' => password_hash('admin123', PASSWORD_DEFAULT),
            'fechaCreacion' => '2026-01-01',
            'nPropiedad' => null
        ],
        [
            'id' => 'usr_gestor_001',
            'nombre' => 'Pedro Soto',
            'rut' => '12.345.678-9',
            'email' => 'pedro.s@pnk.cl',
            'telefono' => '+56 9 8765 4321',
            'fechaNacimiento' => '1990-05-15',
            'sexo' => 'M',
            'rol' => 'gestor',
            'estado' => 'habilitado',
            'password' => password_hash('gestor123', PASSWORD_DEFAULT),
            'fechaCreacion' => '2026-03-10',
            'nPropiedad' => null
        ],
        [
            'id' => 'usr_prop_001',
            'nombre' => 'Ana María',
            'rut' => '10.456.789-0',
            'email' => 'ana.m@gmail.com',
            'telefono' => '+56 9 6543 2109',
            'fechaNacimiento' => '1985-11-22',
            'sexo' => 'F',
            'rol' => 'propietario',
            'estado' => 'activo',
            'password' => password_hash('prop123', PASSWORD_DEFAULT),
            'fechaCreacion' => '2026-02-20',
            'nPropiedad' => '1234-56'
        ],
        [
            'id' => 'usr_cli_001',
            'nombre' => 'Diego Valdivia',
            'rut' => '15.678.901-2',
            'email' => 'diego.v@gmail.com',
            'telefono' => '+56 9 7654 3210',
            'fechaNacimiento' => '1993-08-25',
            'sexo' => 'M',
            'rol' => 'cliente',
            'estado' => 'activo',
            'password' => password_hash('user123', PASSWORD_DEFAULT),
            'fechaCreacion' => '2026-04-10',
            'nPropiedad' => null
        ]
    ];

    $stmt = $db->prepare("INSERT INTO usuarios (id, nombre, rut, email, telefono, fechaNacimiento, sexo, rol, estado, password, fechaCreacion, nPropiedad) VALUES (:id, :nombre, :rut, :email, :telefono, :fechaNacimiento, :sexo, :rol, :estado, :password, :fechaCreacion, :nPropiedad)");
    foreach ($usuarios as $u) {
        $stmt->execute($u);
    }

    // ── Sembrar Propiedades ──
    $propiedades = [
        [
            'id' => 'prop_001',
            'codigo' => 'PNK-001',
            'titulo' => 'Depto Condominio Distrito Verde - Entrega Inmediata',
            'descripcion' => 'Departamento nuevo en condominio Distrito Verde, entrega inmediata. Excelentes terminaciones, piso flotante, cocina equipada con encimera y campana. Condominio con áreas verdes, estacionamiento de visitas, sala multiuso y juegos infantiles. Cercano a supermercados, colegios y transporte público.',
            'tipo' => 'Departamento',
            'operacion' => 'Venta',
            'precioCLP' => 81000000,
            'precioUF' => 2443,
            'direccion' => 'Emilio Apey 409, La Serena',
            'comuna' => 'La Serena',
            'region' => 'Coquimbo',
            'dormitorios' => 2,
            'banos' => 1,
            'superficieTotal' => 52,
            'superficieConstruida' => 46,
            'extras' => json_encode(['Estacionamiento', 'Bodega']),
            'imagen' => 'https://icpacifico.cl/wp-content/uploads/2024/02/fachada-Distrito-Verde-1.jpg',
            'estado' => 'publicado',
            'lat' => -29.9079,
            'lng' => -71.2462,
            'gestorId' => 'usr_gestor_001',
            'propietarioId' => 'usr_prop_001',
            'fechaCreacion' => '2026-04-01',
            'categoria' => 'depto'
        ],
        [
            'id' => 'prop_002',
            'codigo' => 'PNK-002',
            'titulo' => 'Depto Condominio Palmaris - Venta en Blanco',
            'descripcion' => 'Proyecto nuevo Palmaris en sector Av. Pacífico. Departamento de 2 dormitorios con terraza, estacionamiento incluido. Piscina comunitaria, quinchos y salón de eventos. Ideal para inversión con alta rentabilidad de arriendo. Subsidio DS1 aplicable.',
            'tipo' => 'Departamento',
            'operacion' => 'Venta',
            'precioCLP' => 86000000,
            'precioUF' => 2600,
            'direccion' => 'Av. Pacífico 3114, La Serena',
            'comuna' => 'La Serena',
            'region' => 'Coquimbo',
            'dormitorios' => 2,
            'banos' => 2,
            'superficieTotal' => 58,
            'superficieConstruida' => 51,
            'extras' => json_encode(['Estacionamiento', 'Piscina', 'Bodega']),
            'imagen' => 'https://icpacifico.cl/wp-content/uploads/2025/08/banner-palmaris-2.jpg',
            'estado' => 'publicado',
            'lat' => -29.9233,
            'lng' => -71.2755,
            'gestorId' => 'usr_gestor_001',
            'propietarioId' => 'usr_prop_001',
            'fechaCreacion' => '2026-04-05',
            'categoria' => 'depto'
        ],
        [
            'id' => 'prop_003',
            'codigo' => 'PNK-003',
            'titulo' => 'Depto Pacific Blue - Vista al Mar',
            'descripcion' => 'Espectacular departamento en edificio Pacific Blue con vista directa al océano Pacífico. Piso 8 con balcón panorámico. Terminaciones de lujo: porcelanato, griferías de diseño, closets empotrados. Edificio con piscina temperada, gimnasio equipado, sala de cine y conserje 24/7.',
            'tipo' => 'Departamento',
            'operacion' => 'Venta',
            'precioCLP' => 145000000,
            'precioUF' => 4372,
            'direccion' => 'Emilio Apey 500, Sector Av. del Mar, La Serena',
            'comuna' => 'La Serena',
            'region' => 'Coquimbo',
            'dormitorios' => 3,
            'banos' => 2,
            'superficieTotal' => 82,
            'superficieConstruida' => 74,
            'extras' => json_encode(['Estacionamiento', 'Piscina', 'Seguridad 24/7', 'Bodega']),
            'imagen' => 'https://icpacifico.cl/wp-content/uploads/2026/05/almar-banner-pc.jpg',
            'estado' => 'publicado',
            'lat' => -29.9085,
            'lng' => -71.2470,
            'gestorId' => 'usr_gestor_001',
            'propietarioId' => 'usr_prop_001',
            'fechaCreacion' => '2026-04-10',
            'categoria' => 'depto'
        ],
        [
            'id' => 'prop_004',
            'codigo' => 'PNK-004',
            'titulo' => 'Depto Playa Serena - Primera Línea de Playa',
            'descripcion' => 'Departamento premium en Edificio Playa Serena, primera línea de Avenida del Mar. 3 dormitorios, 2 baños, living-comedor con vista frontal al mar. Cocina equipada con isla central. Terraza de 12m². Edificio con sala de eventos, piscina infinita en azotea y estacionamiento subterráneo.',
            'tipo' => 'Departamento',
            'operacion' => 'Venta',
            'precioCLP' => 156000000,
            'precioUF' => 4698,
            'direccion' => 'Av. del Mar 3500, La Serena',
            'comuna' => 'La Serena',
            'region' => 'Coquimbo',
            'dormitorios' => 3,
            'banos' => 2,
            'superficieTotal' => 95,
            'superficieConstruida' => 83,
            'extras' => json_encode(['Estacionamiento', 'Piscina', 'Seguridad 24/7', 'Bodega', 'Logia']),
            'imagen' => 'https://icpacifico.cl/wp-content/uploads/2026/04/banner-img-editable_DESTOP-copia-19.jpg',
            'estado' => 'publicado',
            'lat' => -29.9230,
            'lng' => -71.2725,
            'gestorId' => 'usr_gestor_001',
            'propietarioId' => 'usr_prop_001',
            'fechaCreacion' => '2026-04-12',
            'categoria' => 'depto'
        ],
        [
            'id' => 'prop_005',
            'codigo' => 'PNK-005',
            'titulo' => 'Casa en Sector San Joaquín - 4 Dormitorios',
            'descripcion' => 'Amplia casa en sector residencial San Joaquín, uno de los barrios más buscados de La Serena. Living-comedor con salida a terraza, cocina amoblada, 4 dormitorios (1 en suite), patio trasero con quincho y estacionamiento para 2 vehículos. Cerca de colegios, supermercado Jumbo y acceso rápido a Ruta 5.',
            'tipo' => 'Casa',
            'operacion' => 'Venta',
            'precioCLP' => 182000000,
            'precioUF' => 5490,
            'direccion' => 'Av. Guillermo Ulriksen 1830, San Joaquín, La Serena',
            'comuna' => 'La Serena',
            'region' => 'Coquimbo',
            'dormitorios' => 4,
            'banos' => 3,
            'superficieTotal' => 220,
            'superficieConstruida' => 145,
            'extras' => json_encode(['Estacionamiento', 'Antejardín', 'Patio Trasero', 'Cocina Amoblada']),
            'imagen' => 'https://ppartnersgroupstorage.blob.core.windows.net/crm-files/PP-5d3a390e0ff0a92e6136bcb502f1209f_1775148663324_image_22jpg.jpg',
            'estado' => 'publicado',
            'lat' => -29.9200,
            'lng' => -71.2600,
            'gestorId' => 'usr_gestor_001',
            'propietarioId' => 'usr_prop_001',
            'fechaCreacion' => '2026-04-15',
            'categoria' => 'casa'
        ],
        [
            'id' => 'prop_006',
            'codigo' => 'PNK-006',
            'titulo' => 'Casa Peñuelas - Arriendo Mensual',
            'descripcion' => 'Casa en arriendo en sector Peñuelas, Coquimbo. 3 dormitorios, 2 baños, estacionamiento techado. Patio trasero amplio con césped. Barrio consolidado, cercano a colegios, plazas y a 10 minutos de Playa La Herradura. Disponible inmediatamente.',
            'tipo' => 'Casa',
            'operacion' => 'Arriendo',
            'precioCLP' => 680000,
            'precioUF' => 21,
            'direccion' => 'Sector Peñuelas, Coquimbo',
            'comuna' => 'Coquimbo',
            'region' => 'Coquimbo',
            'dormitorios' => 3,
            'banos' => 2,
            'superficieTotal' => 130,
            'superficieConstruida' => 95,
            'extras' => json_encode(['Estacionamiento', 'Patio Trasero', 'Antejardín']),
            'imagen' => 'https://ppartnersgroupstorage.blob.core.windows.net/crm-files/PP-583b28405bff126cecef8f6fbf74a9ef_1775148663322_image_15jpg.jpg',
            'estado' => 'publicado',
            'lat' => -29.9485,
            'lng' => -71.2905,
            'gestorId' => 'usr_gestor_001',
            'propietarioId' => 'usr_prop_001',
            'fechaCreacion' => '2026-04-18',
            'categoria' => 'casa'
        ],
        [
            'id' => 'prop_007',
            'codigo' => 'PNK-007',
            'titulo' => 'Depto Amoblado Av. del Mar - Arriendo Temporada',
            'descripcion' => 'Departamento completamente amoblado y equipado frente a Playa Cuatro Esquinas. 2 dormitorios, vista al mar, WiFi, TV smart, cocina full equipo. Ideal para arriendo vacacional o estadía temporal. Disponible por día, semana o mes. Condominio con piscina y quincho.',
            'tipo' => 'Departamento',
            'operacion' => 'Arriendo Temporada',
            'precioCLP' => 55000,
            'precioUF' => 0,
            'direccion' => 'Av. del Mar 5800, Cuatro Esquinas, La Serena',
            'comuna' => 'La Serena',
            'region' => 'Coquimbo',
            'dormitorios' => 2,
            'banos' => 1,
            'superficieTotal' => 55,
            'superficieConstruida' => 48,
            'extras' => json_encode(['Piscina', 'Cocina Amoblada', 'Estacionamiento']),
            'imagen' => 'https://icpacifico.cl/wp-content/uploads/2025/09/back-palm6.jpg',
            'estado' => 'arrendado',
            'lat' => -29.9249,
            'lng' => -71.2786,
            'gestorId' => 'usr_gestor_001',
            'propietarioId' => 'usr_prop_001',
            'fechaCreacion' => '2026-04-20',
            'categoria' => 'depto'
        ],
        [
            'id' => 'prop_008',
            'codigo' => 'PNK-008',
            'titulo' => 'Terreno Urbano - Tierras Blancas',
            'descripcion' => 'Sitio urbano de 450m² con factibilidad de agua, luz y alcantarillado. Terreno plano, regular, orientación norte. Sector en pleno desarrollo con nuevos proyectos habitacionales. Ideal para construir vivienda con subsidio o proyecto de inversión. Escritura al día.',
            'tipo' => 'Terreno / Sitio',
            'operacion' => 'Venta',
            'precioCLP' => 42000000,
            'precioUF' => 1265,
            'direccion' => 'Sector Tierras Blancas, Coquimbo',
            'comuna' => 'Coquimbo',
            'region' => 'Coquimbo',
            'dormitorios' => 0,
            'banos' => 0,
            'superficieTotal' => 450,
            'superficieConstruida' => 0,
            'extras' => json_encode([]),
            'imagen' => 'https://ppartnersgroupstorage.blob.core.windows.net/crm-files/PP-770b2594bc2909782807967aab96320e_1778702804786_screenshot-2026-05-13-160345png.jpg',
            'estado' => 'publicado',
            'lat' => -29.9653,
            'lng' => -71.2554,
            'gestorId' => 'usr_gestor_001',
            'propietarioId' => 'usr_prop_001',
            'fechaCreacion' => '2026-04-22',
            'categoria' => 'terreno'
        ],
        [
            'id' => 'prop_009',
            'codigo' => 'PNK-009',
            'titulo' => 'Local Comercial Centro La Serena',
            'descripcion' => 'Local comercial de 85m² en pleno centro de La Serena, calle Balmaceda a pasos de la Plaza de Armas. Alta circulación peatonal. Ideal para retail, oficina profesional o gastronomía. Cuenta con baño privado, bodega interior y vitrina a la calle.',
            'tipo' => 'Local Comercial',
            'operacion' => 'Arriendo',
            'precioCLP' => 950000,
            'precioUF' => 29,
            'direccion' => 'Balmaceda 460, Centro, La Serena',
            'comuna' => 'La Serena',
            'region' => 'Coquimbo',
            'dormitorios' => 0,
            'banos' => 1,
            'superficieTotal' => 85,
            'superficieConstruida' => 85,
            'extras' => json_encode(['Bodega', 'Seguridad 24/7']),
            'imagen' => 'https://ppartnersgroupstorage.blob.core.windows.net/crm-files/PP-813989972acc92a9b675d27f1431cae2_1775148663320_image_6jpg.jpg',
            'estado' => 'publicado',
            'lat' => -29.9048,
            'lng' => -71.2530,
            'gestorId' => 'usr_gestor_001',
            'propietarioId' => 'usr_prop_001',
            'fechaCreacion' => '2026-04-25',
            'categoria' => 'comercial'
        ],
        [
            'id' => 'prop_010',
            'codigo' => 'PNK-010',
            'titulo' => 'Casa Condominio Serena Golf - Premium',
            'descripcion' => 'Exclusiva casa en condominio cerrado Serena Golf Club. 5 dormitorios, 4 baños, suite principal con walking closet y tina de hidromasaje. Living doble altura, cocina gourmet con isla. Jardín de 200m² con piscina privada y quincho. Vista a la cancha de golf. Portería 24/7.',
            'tipo' => 'Casa',
            'operacion' => 'Venta',
            'precioCLP' => 430000000,
            'precioUF' => 12970,
            'direccion' => 'Condominio Serena Golf, Av. La Cantera, La Serena',
            'comuna' => 'La Serena',
            'region' => 'Coquimbo',
            'dormitorios' => 5,
            'banos' => 4,
            'superficieTotal' => 450,
            'superficieConstruida' => 280,
            'extras' => json_encode(['Piscina', 'Estacionamiento', 'Seguridad 24/7', 'Patio Trasero', 'Antejardín', 'Cocina Amoblada']),
            'imagen' => 'https://ppartnersgroupstorage.blob.core.windows.net/crm-files/PP-252bf6cfd8f791857f7ee448688c80da_1775148663321_image_9jpg.jpg',
            'estado' => 'publicado',
            'lat' => -29.8438,
            'lng' => -71.2771,
            'gestorId' => 'usr_gestor_001',
            'propietarioId' => 'usr_prop_001',
            'fechaCreacion' => '2026-04-28',
            'categoria' => 'casa'
        ]
    ];

    $stmt = $db->prepare("INSERT INTO propiedades (id, codigo, titulo, descripcion, tipo, operacion, precioCLP, precioUF, direccion, comuna, region, dormitorios, banos, superficieTotal, superficieConstruida, extras, imagen, estado, lat, lng, gestorId, propietarioId, fechaCreacion, categoria) VALUES (:id, :codigo, :titulo, :descripcion, :tipo, :operacion, :precioCLP, :precioUF, :direccion, :comuna, :region, :dormitorios, :banos, :superficieTotal, :superficieConstruida, :extras, :imagen, :estado, :lat, :lng, :gestorId, :propietarioId, :fechaCreacion, :categoria)");
    foreach ($propiedades as $p) {
        $stmt->execute($p);
    }

    // ── Sembrar Mensajes Semilla ──
    $mensajes = [
        [
            'id' => 'msg_001',
            'remitenteId' => 'usr_prop_001',
            'destinatarioId' => 'usr_gestor_001',
            'mensaje' => 'Hola Pedro, ¿cómo va la publicación de mi depto en Distrito Verde?',
            'fecha' => '2026-05-20T10:15:00Z',
            'leido' => 1
        ],
        [
            'id' => 'msg_002',
            'remitenteId' => 'usr_gestor_001',
            'destinatarioId' => 'usr_prop_001',
            'mensaje' => 'Hola Ana María, va excelente! Ya tenemos dos personas interesadas y agendando visitas para esta semana.',
            'fecha' => '2026-05-20T10:22:00Z',
            'leido' => 1
        ]
    ];

    $stmt = $db->prepare("INSERT INTO mensajes (id, remitenteId, destinatarioId, mensaje, fecha, leido) VALUES (:id, :remitenteId, :destinatarioId, :mensaje, :fecha, :leido)");
    foreach ($mensajes as $m) {
        $stmt->execute($m);
    }

    // ── Sembrar Visitas Semilla ──
    $visitas = [
        [
            'id' => 'vis_001',
            'propiedadId' => 'prop_001',
            'gestorId' => 'usr_gestor_001',
            'propietarioId' => 'usr_prop_001',
            'fecha' => '2026-05-28',
            'hora' => '10:30',
            'estado' => 'confirmada',
            'notas' => 'Cliente muy interesado en comprar con subsidio.'
        ],
        [
            'id' => 'vis_002',
            'propiedadId' => 'prop_002',
            'gestorId' => 'usr_gestor_001',
            'propietarioId' => 'usr_prop_001',
            'fecha' => '2026-05-29',
            'hora' => '15:00',
            'estado' => 'pendiente',
            'notas' => 'Visita piloto en blanco.'
        ]
    ];

    $stmt = $db->prepare("INSERT INTO visitas (id, propiedadId, gestorId, propietarioId, fecha, hora, estado, notas) VALUES (:id, :propiedadId, :gestorId, :propietarioId, :fecha, :hora, :estado, :notas)");
    foreach ($visitas as $v) {
        $stmt->execute($v);
    }
}
