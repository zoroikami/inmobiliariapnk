<?php
/**
 * ============================================================
 *  INMOBILIARIA PNK — API de Propiedades (propiedades.php)
 * ============================================================
 */

session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Listar o detallar propiedades ───────────────────────
if ($method === 'GET') {
    $id = isset($_GET['id']) ? $_GET['id'] : '';
    $gestorId = isset($_GET['gestorId']) ? $_GET['gestorId'] : '';
    $propietarioId = isset($_GET['propietarioId']) ? $_GET['propietarioId'] : '';
    $estado = isset($_GET['estado']) ? $_GET['estado'] : '';

    if (!empty($id)) {
        // Detalle de propiedad única
        $stmt = $db->prepare("SELECT * FROM propiedades WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $prop = $stmt->fetch();

        if ($prop) {
            $prop['extras'] = json_decode($prop['extras'], true);
            echo json_encode(['success' => true, 'propiedad' => $prop]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Propiedad no encontrada.']);
        }
    } else {
        // Listado de propiedades
        $sql = "SELECT * FROM propiedades WHERE 1=1";
        $params = [];

        if (!empty($gestorId)) {
            $sql .= " AND gestorId = :gestorId";
            $params['gestorId'] = $gestorId;
        }

        if (!empty($propietarioId)) {
            $sql .= " AND propietarioId = :propietarioId";
            $params['propietarioId'] = $propietarioId;
        }

        if (!empty($estado)) {
            $sql .= " AND estado = :estado";
            $params['estado'] = $estado;
        }

        $sql .= " ORDER BY fechaCreacion DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $props = $stmt->fetchAll();

        // Decodificar los extras de JSON a array nativo
        foreach ($props as &$p) {
            $p['extras'] = json_decode($p['extras'], true);
        }

        echo json_encode(['success' => true, 'propiedades' => $props]);
    }
    exit;
}

// Para operaciones de modificación, requerir estar logeado (Admin o Gestor)
if (!isset($_SESSION['user']) || !in_array($_SESSION['user']['rol'], ['admin', 'gestor'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Se requiere ser Administrador o Gestor Inmobiliario.']);
    exit;
}

$sessionUser = $_SESSION['user'];

// Leer entrada JSON
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

// ── POST: Crear una propiedad ────────────────────────────────
if ($method === 'POST') {
    $titulo = isset($input['titulo']) ? trim($input['titulo']) : '';
    $descripcion = isset($input['descripcion']) ? trim($input['descripcion']) : '';
    $tipo = isset($input['tipo']) ? trim($input['tipo']) : 'Departamento';
    $operacion = isset($input['operacion']) ? trim($input['operacion']) : 'Venta';
    $precioCLP = isset($input['precioCLP']) ? (int)$input['precioCLP'] : 0;
    $precioUF = isset($input['precioUF']) ? (int)$input['precioUF'] : 0;
    $direccion = isset($input['direccion']) ? trim($input['direccion']) : '';
    $comuna = isset($input['comuna']) ? trim($input['comuna']) : 'La Serena';
    $dormitorios = isset($input['dormitorios']) ? (int)$input['dormitorios'] : 0;
    $banos = isset($input['banos']) ? (int)$input['banos'] : 0;
    $supTotal = isset($input['superficieTotal']) ? (int)$input['superficieTotal'] : 0;
    $supConstruida = isset($input['superficieConstruida']) ? (int)$input['superficieConstruida'] : 0;
    $extras = isset($input['extras']) ? $input['extras'] : []; // Array
    $lat = isset($input['lat']) ? (float)$input['lat'] : -29.9027;
    $lng = isset($input['lng']) ? (float)$input['lng'] : -71.2519;

    if (empty($titulo) || empty($direccion)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'El título y la dirección son obligatorios.']);
        exit;
    }

    if (!$precioCLP && !$precioUF) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Debes ingresar al menos un precio (CLP o UF).']);
        exit;
    }

    // Generar código autoincrementable correlativo
    $totalProps = $db->query("SELECT COUNT(*) FROM propiedades")->fetchColumn();
    $codigo = 'PNK-' . str_pad($totalProps + 1, 3, '0', STR_PAD_LEFT);

    // Determinar categoría
    $categoria = 'casa';
    if (stripos($tipo, 'Departamento') !== false) $categoria = 'depto';
    elseif (stripos($tipo, 'Terreno') !== false) $categoria = 'terreno';
    elseif (stripos($tipo, 'Local') !== false || stripos($tipo, 'Oficina') !== false) $categoria = 'comercial';

    $id = 'prop_' . uniqid();

    $stmt = $db->prepare("INSERT INTO propiedades (id, codigo, titulo, descripcion, tipo, operacion, precioCLP, precioUF, direccion, comuna, region, dormitorios, banos, superficieTotal, superficieConstruida, extras, imagen, estado, lat, lng, gestorId, propietarioId, fechaCreacion, categoria) VALUES (:id, :codigo, :titulo, :descripcion, :tipo, :operacion, :precioCLP, :precioUF, :direccion, :comuna, :region, :dormitorios, :banos, :superficieTotal, :superficieConstruida, :extras, :imagen, :estado, :lat, :lng, :gestorId, :propietarioId, :fechaCreacion, :categoria)");
    
    $stmt->execute([
        'id' => $id,
        'codigo' => $codigo,
        'titulo' => $titulo,
        'descripcion' => $descripcion,
        'tipo' => $tipo,
        'operacion' => $operacion,
        'precioCLP' => $precioCLP,
        'precioUF' => $precioUF,
        'direccion' => $direccion,
        'comuna' => $comuna,
        'region' => 'Coquimbo',
        'dormitorios' => $dormitorios,
        'banos' => $banos,
        'superficieTotal' => $supTotal,
        'superficieConstruida' => $supConstruida,
        'extras' => json_encode($extras),
        'imagen' => 'img/prop1.png',
        'estado' => 'publicado',
        'lat' => $lat,
        'lng' => $lng,
        'gestorId' => $sessionUser['id'], // Asociar al gestor conectado
        'propietarioId' => 'usr_prop_001', // Asociar propietario de demostración por defecto
        'fechaCreacion' => date('Y-m-d'),
        'categoria' => $categoria
    ]);

    echo json_encode(['success' => true, 'message' => 'Propiedad creada correctamente.']);
    exit;
}

// ── PUT: Editar o cambiar estado de propiedad ────────────────
if ($method === 'PUT') {
    $id = isset($_GET['id']) ? $_GET['id'] : '';
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de propiedad requerido.']);
        exit;
    }

    // Verificar existencia y pertenencia
    $stmt = $db->prepare("SELECT * FROM propiedades WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $prop = $stmt->fetch();

    if (!$prop) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Propiedad no encontrada.']);
        exit;
    }

    // Un gestor solo puede editar sus propias propiedades; el administrador edita todas
    if ($sessionUser['rol'] !== 'admin' && $prop['gestorId'] !== $sessionUser['id']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Acceso denegado. No tienes permisos para editar esta propiedad.']);
        exit;
    }

    if ($action === 'status') {
        // Cambiar estado de forma rápida
        $estado = isset($input['estado']) ? trim($input['estado']) : '';
        if (!in_array($estado, ['publicado', 'arrendado', 'no_publicado'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Estado no válido.']);
            exit;
        }

        $stmt = $db->prepare("UPDATE propiedades SET estado = :estado WHERE id = :id");
        $stmt->execute(['estado' => $estado, 'id' => $id]);
        echo json_encode(['success' => true, 'message' => 'Estado de la propiedad actualizado.']);
        exit;
    } else {
        // Edición completa
        $titulo = isset($input['titulo']) ? trim($input['titulo']) : '';
        $descripcion = isset($input['descripcion']) ? trim($input['descripcion']) : '';
        $tipo = isset($input['tipo']) ? trim($input['tipo']) : '';
        $operacion = isset($input['operacion']) ? trim($input['operacion']) : '';
        $precioCLP = isset($input['precioCLP']) ? (int)$input['precioCLP'] : 0;
        $precioUF = isset($input['precioUF']) ? (int)$input['precioUF'] : 0;
        $direccion = isset($input['direccion']) ? trim($input['direccion']) : '';
        $comuna = isset($input['comuna']) ? trim($input['comuna']) : 'La Serena';
        $dormitorios = isset($input['dormitorios']) ? (int)$input['dormitorios'] : 0;
        $banos = isset($input['banos']) ? (int)$input['banos'] : 0;
        $supTotal = isset($input['superficieTotal']) ? (int)$input['superficieTotal'] : 0;
        $supConstruida = isset($input['superficieConstruida']) ? (int)$input['superficieConstruida'] : 0;
        $extras = isset($input['extras']) ? $input['extras'] : [];
        $lat = isset($input['lat']) ? (float)$input['lat'] : -29.9027;
        $lng = isset($input['lng']) ? (float)$input['lng'] : -71.2519;

        if (empty($titulo) || empty($direccion)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El título y la dirección son obligatorios.']);
            exit;
        }

        // Determinar categoría
        $categoria = 'casa';
        if (stripos($tipo, 'Departamento') !== false) $categoria = 'depto';
        elseif (stripos($tipo, 'Terreno') !== false) $categoria = 'terreno';
        elseif (stripos($tipo, 'Local') !== false || stripos($tipo, 'Oficina') !== false) $categoria = 'comercial';

        $stmt = $db->prepare("UPDATE propiedades SET titulo = :titulo, descripcion = :descripcion, tipo = :tipo, operacion = :operacion, precioCLP = :precioCLP, precioUF = :precioUF, direccion = :direccion, comuna = :comuna, dormitorios = :dormitorios, banos = :banos, superficieTotal = :supTotal, superficieConstruida = :supConstruida, extras = :extras, lat = :lat, lng = :lng, categoria = :categoria WHERE id = :id");
        
        $stmt->execute([
            'titulo' => $titulo,
            'descripcion' => $descripcion,
            'tipo' => $tipo,
            'operacion' => $operacion,
            'precioCLP' => $precioCLP,
            'precioUF' => $precioUF,
            'direccion' => $direccion,
            'comuna' => $comuna,
            'dormitorios' => $dormitorios,
            'banos' => $banos,
            'supTotal' => $supTotal,
            'supConstruida' => $supConstruida,
            'extras' => json_encode($extras),
            'lat' => $lat,
            'lng' => $lng,
            'categoria' => $categoria,
            'id' => $id
        ]);

        echo json_encode(['success' => true, 'message' => 'Propiedad actualizada correctamente.']);
        exit;
    }
}

// ── DELETE: Eliminar propiedad ───────────────────────────────
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : '';

    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de propiedad requerido.']);
        exit;
    }

    $stmt = $db->prepare("SELECT * FROM propiedades WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $prop = $stmt->fetch();

    if (!$prop) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Propiedad no encontrada.']);
        exit;
    }

    if ($sessionUser['rol'] !== 'admin' && $prop['gestorId'] !== $sessionUser['id']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Acceso denegado. No puedes eliminar esta propiedad.']);
        exit;
    }

    $stmt = $db->prepare("DELETE FROM propiedades WHERE id = :id");
    $stmt->execute(['id' => $id]);

    echo json_encode(['success' => true, 'message' => 'Propiedad eliminada correctamente de la base de datos.']);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
exit;
