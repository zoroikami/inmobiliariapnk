<?php
/**
 * ============================================================
 *  INMOBILIARIA PNK — API de Usuarios (usuarios.php)
 * ============================================================
 */

session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

// Validar que el usuario esté logeado y sea administrador
if (!isset($_SESSION['user']) || $_SESSION['user']['rol'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Se requieren privilegios de Administrador.']);
    exit;
}

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Función de validación de contraseñas robustas
function validatePasswordStrength($password) {
    return preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/', $password);
}

// ── GET: Obtener usuario(s) ──────────────────────────────────
if ($method === 'GET') {
    $id = isset($_GET['id']) ? $_GET['id'] : '';

    if (!empty($id)) {
        // Obtener usuario específico (excluyendo password)
        $stmt = $db->prepare("SELECT id, nombre, rut, email, telefono, fechaNacimiento, sexo, rol, estado, fechaCreacion FROM usuarios WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $user = $stmt->fetch();

        if ($user) {
            echo json_encode(['success' => true, 'usuario' => $user]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado.']);
        }
    } else {
        // Listar todos los usuarios
        $users = $db->query("SELECT id, nombre, rut, email, telefono, fechaNacimiento, sexo, rol, estado, fechaCreacion FROM usuarios ORDER BY nombre ASC")->fetchAll();
        echo json_encode(['success' => true, 'usuarios' => $users]);
    }
    exit;
}

// Leer entrada JSON
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

// ── POST: Crear un nuevo usuario ─────────────────────────────
if ($method === 'POST') {
    $nombre = isset($input['nombre']) ? trim($input['nombre']) : '';
    $rut = isset($input['rut']) ? trim($input['rut']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $telefono = isset($input['telefono']) ? trim($input['telefono']) : '';
    $fechaNacimiento = isset($input['fechaNacimiento']) ? trim($input['fechaNacimiento']) : '';
    $sexo = isset($input['sexo']) ? trim($input['sexo']) : '';
    $rol = isset($input['rol']) ? trim($input['rol']) : '';
    $password = isset($input['password']) ? $input['password'] : '';
    $activo = isset($input['activo']) ? (bool)$input['activo'] : true;

    if (empty($nombre) || empty($rut) || empty($email) || empty($rol) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Completa todos los campos obligatorios (nombre, RUT, email, rol, contraseña).']);
        exit;
    }

    // Validar contraseña robusta
    if (!validatePasswordStrength($password)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'La contraseña debe tener al menos 8 caracteres y contener una letra mayúscula, una minúscula, un número y un carácter especial.'
        ]);
        exit;
    }

    // Email único
    $stmt = $db->prepare("SELECT COUNT(*) FROM usuarios WHERE LOWER(email) = LOWER(:email)");
    $stmt->execute(['email' => $email]);
    if ($stmt->fetchColumn() > 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ya existe un usuario con ese correo electrónico.']);
        exit;
    }

    $id = 'usr_' . uniqid();
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Configurar estado
    if ($activo) {
        $estado = ($rol === 'gestor') ? 'habilitado' : 'activo';
    } else {
        $estado = 'deshabilitado';
    }

    $stmt = $db->prepare("INSERT INTO usuarios (id, nombre, rut, email, telefono, fechaNacimiento, sexo, rol, estado, password, fechaCreacion) VALUES (:id, :nombre, :rut, :email, :telefono, :fechaNacimiento, :sexo, :rol, :estado, :password, :fechaCreacion)");
    $stmt->execute([
        'id' => $id,
        'nombre' => $nombre,
        'rut' => $rut,
        'email' => $email,
        'telefono' => $telefono,
        'fechaNacimiento' => $fechaNacimiento,
        'sexo' => $sexo,
        'rol' => $rol,
        'estado' => $estado,
        'password' => $hashedPassword,
        'fechaCreacion' => date('Y-m-d')
    ]);

    echo json_encode(['success' => true, 'message' => 'Usuario creado exitosamente.']);
    exit;
}

// ── PUT: Editar usuario ──────────────────────────────────────
if ($method === 'PUT') {
    $id = isset($_GET['id']) ? $_GET['id'] : '';
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de usuario requerido para actualizar.']);
        exit;
    }

    $nombre = isset($input['nombre']) ? trim($input['nombre']) : '';
    $rut = isset($input['rut']) ? trim($input['rut']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $telefono = isset($input['telefono']) ? trim($input['telefono']) : '';
    $fechaNacimiento = isset($input['fechaNacimiento']) ? trim($input['fechaNacimiento']) : '';
    $sexo = isset($input['sexo']) ? trim($input['sexo']) : '';
    $rol = isset($input['rol']) ? trim($input['rol']) : '';
    $password = isset($input['password']) ? $input['password'] : '';
    $activo = isset($input['activo']) ? (bool)$input['activo'] : true;

    // Verificar existencia del usuario
    $stmt = $db->prepare("SELECT * FROM usuarios WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $user = $stmt->fetch();
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado.']);
        exit;
    }

    // Validaciones básicas
    if (empty($nombre) || empty($rut) || empty($email) || empty($rol)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Nombre, RUT, email y rol son obligatorios.']);
        exit;
    }

    // Si se proporciona una contraseña, validarla
    $passwordSql = "";
    $params = [
        'id' => $id,
        'nombre' => $nombre,
        'rut' => $rut,
        'email' => $email,
        'telefono' => $telefono,
        'fechaNacimiento' => $fechaNacimiento,
        'sexo' => $sexo,
        'rol' => $rol
    ];

    if (!empty($password)) {
        if (!validatePasswordStrength($password)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'La contraseña debe tener al menos 8 caracteres y contener una letra mayúscula, una minúscula, un número y un carácter especial.'
            ]);
            exit;
        }
        $passwordSql = ", password = :password";
        $params['password'] = password_hash($password, PASSWORD_DEFAULT);
    }

    // Configurar estado
    if ($activo) {
        // No sobreescribir el estado 'pendiente' si el administrador no lo cambia a activo expresamente
        if ($user['estado'] === 'deshabilitado') {
            $estado = ($rol === 'gestor') ? 'habilitado' : 'activo';
        } else {
            $estado = $user['estado'];
        }
    } else {
        $estado = 'deshabilitado';
    }
    $params['estado'] = $estado;

    $stmt = $db->prepare("UPDATE usuarios SET nombre = :nombre, rut = :rut, email = :email, telefono = :telefono, fechaNacimiento = :fechaNacimiento, sexo = :sexo, rol = :rol, estado = :estado {$passwordSql} WHERE id = :id");
    $stmt->execute($params);

    echo json_encode(['success' => true, 'message' => 'Usuario actualizado correctamente.']);
    exit;
}

// ── DELETE: Eliminar usuario ─────────────────────────────────
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : '';
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de usuario requerido.']);
        exit;
    }

    if ($id === 'usr_admin_001') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No se puede eliminar ni deshabilitar al Administrador principal del sistema.']);
        exit;
    }

    if ($action === 'disable') {
        // Deshabilitar
        $stmt = $db->prepare("UPDATE usuarios SET estado = 'deshabilitado' WHERE id = :id");
        $stmt->execute(['id' => $id]);
        echo json_encode(['success' => true, 'message' => 'Usuario deshabilitado correctamente.']);
    } elseif ($action === 'enable') {
        // Habilitar
        $stmt = $db->prepare("SELECT rol FROM usuarios WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $rol = $stmt->fetchColumn();
        
        $estado = ($rol === 'gestor') ? 'habilitado' : 'activo';
        $stmt = $db->prepare("UPDATE usuarios SET estado = :estado WHERE id = :id");
        $stmt->execute(['estado' => $estado, 'id' => $id]);
        echo json_encode(['success' => true, 'message' => 'Usuario habilitado correctamente.']);
    } else {
        // Eliminar físicamente
        $stmt = $db->prepare("DELETE FROM usuarios WHERE id = :id");
        $stmt->execute(['id' => $id]);
        echo json_encode(['success' => true, 'message' => 'Usuario eliminado permanentemente de la base de datos.']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
exit;
