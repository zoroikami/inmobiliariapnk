<?php
/**
 * ============================================================
 *  INMOBILIARIA PNK — API de Mensajes (mensajes.php)
 * ============================================================
 */

session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Inicia sesión para usar el chat.']);
    exit;
}

$db = getDB();
$sessionUser = $_SESSION['user'];
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// ── GET: Obtener conversaciones o mensajes ───────────────────
if ($method === 'GET') {
    if ($action === 'conversations') {
        // Obtener la lista de usuarios con los que el usuario activo ha interactuado
        // Buscamos remitentes o destinatarios distintos a él
        $myId = $sessionUser['id'];
        
        $sql = "SELECT DISTINCT 
                    CASE WHEN remitenteId = :myId THEN destinatarioId ELSE remitenteId END as userId
                FROM mensajes 
                WHERE remitenteId = :myId OR destinatarioId = :myId";
        
        $stmt = $db->prepare($sql);
        $stmt->execute(['myId' => $myId]);
        $userIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $conversations = [];
        
        foreach ($userIds as $uId) {
            // Obtener los datos del otro usuario
            $stmtUser = $db->prepare("SELECT id, nombre, email, rol FROM usuarios WHERE id = :uId");
            $stmtUser->execute(['uId' => $uId]);
            $otherUser = $stmtUser->fetch();
            
            if (!$otherUser) continue;

            // Obtener el último mensaje de la conversación
            $stmtMsg = $db->prepare("SELECT * FROM mensajes 
                                     WHERE (remitenteId = :myId AND destinatarioId = :uId) 
                                        OR (remitenteId = :uId AND destinatarioId = :myId)
                                     ORDER BY fecha DESC LIMIT 1");
            $stmtMsg->execute(['myId' => $myId, 'uId' => $uId]);
            $lastMsg = $stmtMsg->fetch();

            // Calcular mensajes no leídos
            $stmtUnread = $db->prepare("SELECT COUNT(*) FROM mensajes 
                                        WHERE remitenteId = :uId AND destinatarioId = :myId AND leido = 0");
            $stmtUnread->execute(['myId' => $myId, 'uId' => $uId]);
            $unreadCount = $stmtUnread->fetchColumn();

            $conversations[] = [
                'user' => $otherUser,
                'lastMessage' => $lastMsg ? $lastMsg['mensaje'] : '',
                'fecha' => $lastMsg ? $lastMsg['fecha'] : '',
                'unread' => $unreadCount
            ];
        }

        // Ordenar conversaciones por la fecha del último mensaje descendente
        usort($conversations, function($a, $b) {
            return strcmp($b['fecha'], $a['fecha']);
        });

        echo json_encode(['success' => true, 'conversaciones' => $conversations]);
        exit;

    } elseif ($action === 'users') {
        // Obtener todos los usuarios no deshabilitados (para iniciar nueva conversación)
        $myId = $sessionUser['id'];
        $stmtUsers = $db->prepare("SELECT id, nombre, email, rol, estado FROM usuarios WHERE estado != 'deshabilitado' AND id != :myId ORDER BY nombre ASC");
        $stmtUsers->execute(['myId' => $myId]);
        $users = $stmtUsers->fetchAll();
        echo json_encode(['success' => true, 'usuarios' => $users]);
        exit;

    } elseif ($action === 'messages') {
        $otherId = isset($_GET['with']) ? $_GET['with'] : '';
        if (empty($otherId)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Especifica con qué usuario quieres chatear (?with=...).']);
            exit;
        }

        $myId = $sessionUser['id'];

        // Marcar mensajes recibidos del otro usuario como leídos
        $stmtUpdate = $db->prepare("UPDATE mensajes SET leido = 1 WHERE remitenteId = :otherId AND destinatarioId = :myId");
        $stmtUpdate->execute(['otherId' => $otherId, 'myId' => $myId]);

        // Cargar hilo de mensajes
        $stmtMsg = $db->prepare("SELECT * FROM mensajes 
                                 WHERE (remitenteId = :myId AND destinatarioId = :otherId) 
                                    OR (remitenteId = :otherId AND destinatarioId = :myId)
                                 ORDER BY fecha ASC");
        $stmtMsg->execute(['myId' => $myId, 'otherId' => $otherId]);
        $messages = $stmtMsg->fetchAll();

        echo json_encode(['success' => true, 'mensajes' => $messages]);
        exit;
    }
}

// ── POST: Enviar mensaje ─────────────────────────────────────
if ($method === 'POST' && $action === 'send') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    $destinatarioId = isset($input['destinatarioId']) ? trim($input['destinatarioId']) : '';
    $mensaje = isset($input['mensaje']) ? trim($input['mensaje']) : '';

    if (empty($destinatarioId) || empty($mensaje)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Especifica destinatario y mensaje.']);
        exit;
    }

    $myId = $sessionUser['id'];
    $id = 'msg_' . uniqid();
    $fecha = date('Y-m-d\TH:i:s\Z'); // Formato ISO 8601 UTC

    $stmt = $db->prepare("INSERT INTO mensajes (id, remitenteId, destinatarioId, mensaje, fecha, leido) VALUES (:id, :myId, :destinatarioId, :mensaje, :fecha, 0)");
    $stmt->execute([
        'id' => $id,
        'myId' => $myId,
        'destinatarioId' => $destinatarioId,
        'mensaje' => $mensaje,
        'fecha' => $fecha
    ]);

    echo json_encode(['success' => true, 'message' => 'Mensaje enviado correctamente.']);
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Petición no válida.']);
exit;
