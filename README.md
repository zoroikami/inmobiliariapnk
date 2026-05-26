# 🏠 Inmobiliaria PNK

Sistema web de gestión inmobiliaria para la Región de Coquimbo, Chile.

## 🌐 Demo en Vivo
**[http://inmobiliariapnk-keoni.s3-website-us-east-1.amazonaws.com](http://inmobiliariapnk-keoni.s3-website-us-east-1.amazonaws.com)**

## 📋 Descripción
Plataforma inmobiliaria que permite la gestión de propiedades y usuarios con roles diferenciados (Administrador, Gestor y Propietario). Incluye mapa interactivo con Leaflet.js, CRUD completo, validación de RUT chileno y notificaciones con SweetAlert2.

## 🔑 Credenciales de Prueba

| Rol | Email | Password |
|---|---|---|
| Administrador | admin@pnk.cl | admin123 |
| Gestor | pedro.s@pnk.cl | gestor123 |
| Propietario | ana.m@gmail.com | prop123 |

## ✨ Funcionalidades
- ✅ Registro de propietarios y gestores
- ✅ Login con autenticación por roles
- ✅ Gestión de sesiones (sessionStorage)
- ✅ CRUD de usuarios (crear, editar, habilitar/deshabilitar, eliminar)
- ✅ CRUD de propiedades con imágenes reales
- ✅ Validación de RUT chileno (dígito verificador)
- ✅ Notificaciones con SweetAlert2
- ✅ Mapa interactivo con Leaflet.js (filtros, geolocalización)
- ✅ 10 propiedades reales de La Serena y Coquimbo
- ✅ Diseño responsive (Bootstrap 5 + CSS personalizado)
- ✅ Desplegado en AWS S3

## 🛠️ Tecnologías
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **UI Framework:** Bootstrap 5
- **Mapas:** Leaflet.js + OpenStreetMap
- **Notificaciones:** SweetAlert2
- **Persistencia:** localStorage
- **Hosting:** AWS S3 (Static Website Hosting)

## 📁 Estructura del Proyecto
```
inmobiliariapnk/
├── index.html                  # Página principal
├── login.html                  # Inicio de sesión
├── registro.html               # Registro de usuarios
├── recuperar.html              # Recuperación de contraseña
├── dashboard_admin.html        # Panel administrador
├── dashboard_gestor.html       # Panel gestor
├── dashboard_propietario.html  # Panel propietario
├── mantenedor_usuarios.html    # CRUD usuarios
├── mantenedor_propiedades.html # CRUD propiedades
├── nuevo_usuario.html          # Formulario nuevo usuario
├── nueva_propiedad.html        # Formulario nueva propiedad
├── mapa_interactivo.html       # Mapa con Leaflet.js
├── css/
│   ├── styles.css              # Estilos principales
│   ├── mapa.css                # Estilos del mapa
│   └── bootstrap.min.css       # Bootstrap 5
├── js/
│   ├── app.js                  # Datos semilla y inicialización
│   ├── auth.js                 # Autenticación y sesiones
│   ├── utils.js                # Utilidades y namespace PNK
│   ├── notifications.js        # Wrapper SweetAlert2
│   ├── crud-usuarios.js        # CRUD de usuarios
│   ├── crud-propiedades.js     # CRUD de propiedades
│   └── mapa.js                 # Lógica del mapa interactivo
└── img/                        # Imágenes del sitio
```

## 👨‍💻 Autor
**Keoni** — Proyecto Inmobiliaria PNK

## 📄 Licencia
Proyecto académico — Todos los derechos reservados.
