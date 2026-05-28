# 🚀 Guía de Despliegue en AWS EC2 (Servidor Web Dinámico PHP + SQLite)

Esta guía describe paso a paso cómo desplegar la aplicación **Inmobiliaria PNK** en una instancia de **AWS EC2 (Elastic Compute Cloud)**. 

Dado que la aplicación ha sido migrada a un **backend dinámico en PHP con persistencia en base de datos SQLite**, **no es posible hospedarla en AWS S3** (el cual solo admite sitios web estáticos HTML/JS sin soporte para procesamiento de servidor ni bases de datos).

---

## 📋 Requisitos Previos
1. Una cuenta de AWS activa.
2. Un par de claves SSH (`.pem`) creado en la consola de AWS.
3. El código fuente de **Inmobiliaria PNK** subido a un repositorio Git (ej: GitHub, GitLab, CodeCommit).

---

## 🛠️ Paso 1: Lanzar la Instancia EC2

1. Inicia sesión en la consola de **AWS Console** y dirígete al servicio **EC2**.
2. Haz clic en **Launch Instance** (Lanzar instancia).
3. **Nombre**: Asigna un nombre descriptivo, por ejemplo: `Inmobiliaria-PNK-Server`.
4. **Sistema Operativo (AMI)**: Selecciona **Ubuntu Server 24.04 LTS** (Apto para la Capa Gratuita / Free Tier).
5. **Tipo de Instancia**: Selecciona `t2.micro` (o `t3.micro`, según tu región para mantenerte en la capa gratuita).
6. **Key pair**: Selecciona tu archivo de claves `.pem` para poder conectarte por SSH.
7. **Configuración de Red (Security Group)**:
   * Crea un nuevo Security Group.
   * Marca las casillas para:
     * **Allow SSH traffic from**: Anywhere (o tu IP personal para máxima seguridad).
     * **Allow HTTPS traffic from the internet**.
     * **Allow HTTP traffic from the internet**.

Haz clic en **Launch Instance** para iniciar la creación del servidor.

---

## 🔑 Paso 2: Conectarse al Servidor por SSH

Una vez que la instancia cambie a estado *Running* (En ejecución), copia su **IP pública**. Abre una terminal en tu computadora local y ejecuta:

```bash
# Otorga permisos de lectura mínimos a tu clave privada (solo en Linux/macOS)
chmod 400 mi-clave-aws.pem

# Conéctate usando SSH
ssh -i "mi-clave-aws.pem" ubuntu@TU_IP_PUBLICA_EC2
```

---

## 📦 Paso 3: Instalar Apache, PHP y SQLite

Una vez dentro de la terminal de tu instancia EC2, ejecuta los siguientes comandos para actualizar el sistema e instalar el servidor web Apache, PHP 8.x y el soporte nativo para base de datos SQLite:

```bash
# Actualizar los paquetes del sistema
sudo apt update && sudo apt upgrade -y

# Instalar Apache, PHP, Git y extensiones requeridas para SQLite y JSON
sudo apt install apache2 php libapache2-mod-php php-sqlite3 php-json php-mbstring git -y

# Habilitar el módulo de reescritura de Apache (útil para URLs limpias)
sudo a2enmod rewrite

# Reiniciar Apache para aplicar los cambios
sudo systemctl restart apache2
```

---

## 📂 Paso 4: Clonar la Aplicación Inmobiliaria PNK

Para desplegar tu código, limpiaremos la carpeta raíz por defecto de Apache (`/var/www/html`) y clonaremos el repositorio de tu proyecto en ella:

```bash
# Eliminar el index por defecto de Apache
sudo rm -rf /var/www/html/*

# Clonar el proyecto directamente en /var/www/html/
# Nota: Reemplaza la URL con la de tu propio repositorio de Git
sudo git clone https://github.com/TU_USUARIO/inmobiliariapnk.git /var/www/html/
```

---

## 🔒 Paso 5: Configurar Permisos de Escritura (Crucial para SQLite)

SQLite almacena la base de datos completa en un archivo plano dentro de la carpeta `php/inmobiliaria.db`. Para que PHP pueda escribir nuevos usuarios, visitas y mensajes de chat en ese archivo, **el servidor de Apache debe poseer permisos de escritura sobre ese directorio**:

```bash
# Cambiar el propietario de la carpeta del proyecto a www-data (el usuario de Apache)
sudo chown -R www-data:www-data /var/www/html

# Conceder permisos de lectura y escritura correctos al proyecto y carpeta php
sudo chmod -R 775 /var/www/html
sudo chmod -R 775 /var/www/html/php
```

---

## ⚙️ Paso 6: Ajustar Configuración de Apache (Opcional)

Para asegurarte de que Apache permita el uso de archivos `.htaccess` (en caso de que quieras configurar redirecciones seguras HTTPS):

1. Abre el archivo de configuración por defecto de Apache:
   ```bash
   sudo nano /etc/apache2/sites-available/000-default.conf
   ```
2. Añade el siguiente bloque de configuración dentro de `<VirtualHost *:80>`:
   ```apache
   <Directory /var/www/html>
       Options Indexes FollowSymLinks
       AllowOverride All
       Require all granted
   </Directory>
   ```
3. Guarda los cambios presionando `Ctrl+O`, presiona `Enter` para confirmar, y sal usando `Ctrl+X`.
4. Reinicia el servidor web Apache:
   ```bash
   sudo systemctl restart apache2
   ```

---

## 🛡️ Paso 7: Configurar SSL (HTTPS gratuito con Let's Encrypt)

Es de suma importancia cifrar el tráfico del sitio para que las credenciales no viajen en texto plano:

```bash
# Instalar Certbot de Let's Encrypt para Apache
sudo apt install certbot python3-certbot-apache -y

# Obtener e instalar el certificado SSL de forma automática
# Nota: Debes tener un dominio apuntando a la IP pública de tu instancia EC2
sudo certbot --apache -d tu-dominio.com -d www.tu-dominio.com
```

Certbot se encargará de configurar la renovación automática del certificado cada 90 días de forma transparente.

---

## 🎉 Paso 8: Verificación Final

1. Abre tu navegador web e ingresa la **IP Pública** de tu servidor EC2 (o tu nombre de dominio configurado en el paso anterior): `http://TU_IP_PUBLICA_EC2`
2. **Autoinicialización**: Al cargar por primera vez cualquier vista de la web, el backend dinámico de PHP creará el archivo `php/inmobiliaria.db` de forma automática, creará las tablas y sembrará todos los usuarios y propiedades de prueba.
3. Prueba a registrar un usuario con contraseña débil (debería ser bloqueado en cliente y servidor).
4. Regístrate con una clave robusta (debería guardarse exitosamente en la base de datos SQLite encriptada con `bcrypt`).
5. Inicia sesión, agenda una visita y envía un mensaje de chat para comprobar la persistencia de datos 100% activa en tu servidor en la nube.
