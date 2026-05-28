<?php
/**
 * ============================================================
 *  INMOBILIARIA PNK — API de Visitas (visitas.php)
 * ============================================================
 */

session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Inicia sesión para administrar visitas.']);
    exit;
}

$db = getDB();
$sessionUser = $_SESSION['user'];
$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Obtener visitas ─────────────────────────────────────
if ($method === 'GET') {
    $myId = $sessionUser['id'];
    $rol = $sessionUser['rol'];

    if ($rol === 'admin') {
        // Administrador ve todas
        $stmt = $db->query("SELECT v.*, p.titulo as propiedadTitulo, p.codigo as propiedadCodigo, p.direccion as propiedadDireccion FROM visitas v JOIN propiedades p ON v.propiedadId = p.id ORDER BY v.fecha ASC, v.hora ASC");
        $visitas = $stmt->fetchAll();
    } elseif ($rol === 'gestor') {
        // Gestor ve sus asignadas
        $stmt = $db->prepare("SELECT v.*, p.titulo as propiedadTitulo, p.codigo as propiedadCodigo, p.direccion as propiedadDireccion FROM visitas v JOIN propiedades p ON v.propiedadId = p.id WHERE v.gestorId = :myId ORDER BY v.fecha ASC, v.hora ASC");
        $stmt->execute(['myId' => $myId]);
        $visitas = $stmt->fetchAll();
    } else {
        // Propietario ve las suyas
        $stmt = $db->prepare("SELECT v.*, p.titulo as propiedadTitulo, p.codigo as propiedadCodigo, p.direccion as propiedadDireccion FROM visitas v JOIN propiedades p ON v.propiedadId = p.id WHERE v.propietarioId = :myId ORDER BY v.fecha ASC, v.hora ASC");
        $stmt->execute(['myId' => $myId]);
        $visitas = $stmt->fetchAll();
    }

    echo json_encode(['success' => true, 'visitas' => $visitas]);
    exit;
}

// Leer entrada JSON
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

// ── POST: Agendar una nueva visita ───────────────────────────
if ($method === 'POST') {
    $propiedadId = isset($input['propiedadId']) ? trim($input['propiedadId']) : '';
    $fecha = isset($input['fecha']) ? trim($input['fecha']) : '';
    $hora = isset($input['hora']) ? trim($input['hora']) : '';
    $notas = isset($input['notas']) ? trim($input['notas']) : '';

    if (empty($propiedadId) || empty($fecha) || empty($hora)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Especifica la propiedad, fecha y hora de la visita.']);
        exit;
    }

    // Validar rango de horas (09:00 - 19:00)
    if ($hora < '09:00' || $hora > '19:00') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'El horario de visitas debe ser entre las 09:00 y las 19:00.']);
        exit;
    }

    // Obtener datos del gestor y propietario de la propiedad
    $stmtProp = $db->prepare("SELECT * FROM propiedades WHERE id = :propId");
    $stmtProp->execute(['propId' => $propiedadId]);
    $prop = $stmtProp->fetch();

    if (!$prop) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'La propiedad seleccionada no existe.']);
        exit;
    }

    $gestorId = $prop['gestorId'];
    $propietarioId = $prop['propietarioId'];

    // Validar colisión de horarios (no agendar dos visitas a la misma hora en la misma propiedad)
    $stmtConflict = $db->prepare("SELECT COUNT(*) FROM visitas WHERE propiedadId = :propId AND fecha = :fecha AND hora = :hora AND estado != 'cancelada'");
    $stmtConflict->execute([
        'propId' => $propiedadId,
        'fecha' => $fecha,
        'hora' => $hora
    ]);

    if ($stmtConflict->fetchColumn() > 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ya existe una visita confirmada o pendiente para esta propiedad el mismo día a las ' . $hora . '. Por favor, selecciona otro horario.']);
        exit;
    }

    $id = 'vis_' . uniqid();

    $stmt = $db->prepare("INSERT INTO visitas (id, propiedadId, gestorId, propietarioId, fecha, hora, estado, notas) VALUES (:id, :propId, :gestorId, :propietarioId, :fecha, :hora, 'pendiente', :notas)");
    $stmt->execute([
        'id' => $id,
        'propId' => $propiedadId,
        'gestorId' => $gestorId,
        'propietarioId' => $propietarioId,
        'fecha' => $fecha,
        'hora' => $hora,
        'notas' => $notas
    ]);

    echo json_encode(['success' => true, 'message' => '¡Visita agendada exitosamente! Corresponde a la aprobación del Gestor.']);
    exit;
}

// ── PUT: Modificar estado de la visita ────────────────────────
if ($method === 'PUT') {
    $id = isset($_GET['id']) ? $_GET['id'] : '';
    $estado = isset($input['estado']) ? trim($input['estado']) : '';

    if (empty($id) || empty($estado)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de visita y nuevo estado son obligatorios.']);
        exit;
    }

    if (!in_array($estado, ['pendiente', 'confirmada', 'realizada', 'cancelada'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Estado de visita inválido.']);
        exit;
    }

    // Verificar existencia de la visita
    $stmt = $db->prepare("SELECT * FROM visitas WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $visita = $stmt->fetch();

    if (!$visita) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Visita no encontrada.']);
        exit;
    }

    // Propietario no puede confirmar, solo ver o cancelar. Gestores y admins pueden todo.
    if ($sessionUser['rol'] === 'propietario' && $estado === 'confirmada') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Los propietarios no pueden confirmar visitas, solo cancelarlas o visualizarlas.']);
        exit;
    }

    $stmt = $db->prepare("UPDATE visitas SET estado = :estado WHERE id = :id");
    $stmt->execute(['estado' => $estado, 'id' => $id]);

    echo json_encode(['success' => true, 'message' => 'El estado de la visita ha sido actualizado a ' . $estado . '.']);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
exit;
