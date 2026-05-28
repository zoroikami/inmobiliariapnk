<?php
/**
 * ============================================================
 *  INMOBILIARIA PNK — Endpoint de Autenticación (auth.php)
 * ============================================================
 */

session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

// Obtener la acción solicitada
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Validar fuerza de la contraseña (Min 8 chars, 1 Mayus, 1 Minus, 1 Num, 1 Especial)
function validatePasswordStrength($password) {
    return preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/', $password);
}

$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Leer el body JSON de la petición
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    if ($action === 'login') {
        $email = isset($input['email']) ? trim($input['email']) : '';
        $password = isset($input['password']) ? $input['password'] : '';

        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Completa todos los campos.']);
            exit;
        }

        // Buscar usuario por email
        $stmt = $db->prepare("SELECT * FROM usuarios WHERE LOWER(email) = LOWER(:email)");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'No existe una cuenta con ese correo.']);
            exit;
        }

        // Verificar contraseña
        if (!password_verify($password, $user['password'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta.']);
            exit;
        }

        // Verificar estado
        if ($user['estado'] === 'deshabilitado') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Tu cuenta está deshabilitada. Contacta al administrador.']);
            exit;
        }

        if ($user['estado'] === 'pendiente') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Tu cuenta aún está pendiente de aprobación.']);
            exit;
        }

        // Crear sesión en el servidor
        $sessionUser = [
            'id' => $user['id'],
            'nombre' => $user['nombre'],
            'email' => $user['email'],
            'rol' => $user['rol'],
            'rut' => $user['rut'],
            'telefono' => $user['telefono']
        ];
        $_SESSION['user'] = $sessionUser;

        echo json_encode([
            'success' => true,
            'message' => '¡Bienvenido, ' . $user['nombre'] . '!',
            'user' => $sessionUser
        ]);
        exit;

    } elseif ($action === 'register') {
        $nombre = isset($input['nombre']) ? trim($input['nombre']) : '';
        $rut = isset($input['rut']) ? trim($input['rut']) : '';
        $email = isset($input['email']) ? trim($input['email']) : '';
        $telefono = isset($input['telefono']) ? trim($input['telefono']) : '';
        $fechaNacimiento = isset($input['fechaNacimiento']) ? trim($input['fechaNacimiento']) : '';
        $sexo = isset($input['sexo']) ? trim($input['sexo']) : '';
        $rol = isset($input['rol']) ? trim($input['rol']) : 'cliente';
        $password = isset($input['password']) ? $input['password'] : '';
        $nPropiedad = isset($input['nPropiedad']) ? trim($input['nPropiedad']) : null;

        // Validaciones básicas
        if (empty($nombre) || empty($rut) || empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Completa todos los campos obligatorios.']);
            exit;
        }

        // Validar fortaleza de la contraseña
        if (!validatePasswordStrength($password)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'La contraseña debe tener al menos 8 caracteres y contener una letra mayúscula, una minúscula, un número y un carácter especial.'
            ]);
            exit;
        }

        // Verificar duplicados de email
        $stmt = $db->prepare("SELECT COUNT(*) FROM usuarios WHERE LOWER(email) = LOWER(:email)");
        $stmt->execute(['email' => $email]);
        if ($stmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ya existe una cuenta con ese correo.']);
            exit;
        }

        // Crear ID único
        $id = 'usr_' . uniqid();

        // Encriptar clave
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // Estado inicial (Para pruebas, gestor se crea habilitado)
        $estado = ($rol === 'gestor') ? 'habilitado' : 'activo';

        $stmt = $db->prepare("INSERT INTO usuarios (id, nombre, rut, email, telefono, fechaNacimiento, sexo, rol, estado, password, fechaCreacion, nPropiedad) VALUES (:id, :nombre, :rut, :email, :telefono, :fechaNacimiento, :sexo, :rol, :estado, :password, :fechaCreacion, :nPropiedad)");
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
            'fechaCreacion' => date('Y-m-d'),
            'nPropiedad' => $nPropiedad
        ]);

        echo json_encode([
            'success' => true,
            'message' => '¡Cuenta creada exitosamente! Ya puedes iniciar sesión.'
        ]);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'check') {
        if (isset($_SESSION['user'])) {
            echo json_encode([
                'success' => true,
                'loggedIn' => true,
                'user' => $_SESSION['user']
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'loggedIn' => false,
                'user' => null
            ]);
        }
        exit;
    } elseif ($action === 'logout') {
        unset($_SESSION['user']);
        session_destroy();
        echo json_encode([
            'success' => true,
            'message' => 'Sesión cerrada correctamente.'
        ]);
        exit;
    }
}

http_response_code(404);
echo json_encode(['success' => false, 'message' => 'Ruta no encontrada o método no soportado.']);
exit;
