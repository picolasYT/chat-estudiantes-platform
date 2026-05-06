# 💬 Chat Estudiantes Platform

> Plataforma de mensajería moderna para estudiantes de 7mo grado

**Creado por:** Nico  
**Versión:** 1.0.0  
**Licencia:** MIT

---

## 🚀 Características

✅ **Autenticación Segura**
- Registro e inicio de sesión
- Contraseñas encriptadas con bcryptjs
- Control de sesiones

✅ **Sistema de Mensajería**
- Chat en tiempo real entre usuarios
- Historial de mensajes
- Interfaz moderna y responsive

✅ **Panel Administrativo**
- Gestión de usuarios
- Monitoreo de IPs y ubicaciones
- Sistema de reportes
- Logs de seguridad
- Suspensión y baneo de usuarios

✅ **Seguridad**
- Rate limiting en login
- Protección CORS
- Helmet.js para headers seguros
- Captura de IP y geolocalización
- System de reportes de usuarios

✅ **Base de Datos JSON**
- Sin dependencias de bases de datos externas
- Fácil de usar y mantener
- Almacenamiento local de archivos

---

## 📦 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/picolasYT/chat-estudiantes-platform.git
cd chat-estudiantes-platform
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

Edita `.env` con tus configuraciones:
```env
SESSION_SECRET=tu-clave-super-secreta
NODE_ENV=development
PORT=3000
HOST=localhost
```

### 4. Iniciar el servidor
```bash
npm start
```

¡El servidor estará corriendo en `http://localhost:3000`!

---

## 🎮 Uso

### Cuentas por Defecto

**Admin:**
- Usuario: `admin`
- Contraseña: `admin123`

### Paneles Disponibles

| Panel | URL | Descripción |
|-------|-----|-------------|
| Login/Registro | `/` | Autenticación de usuarios |
| Chat | `/dashboard` | Panel de mensajería |
| Admin | `/admin` | Panel administrativo (solo admins) |

---

## 📁 Estructura del Proyecto

```
chat-estudiantes-platform/
├── server.js                 # Archivo principal para arrancar
├── package.json              # Dependencias
├── .env.example              # Variables de entorno
├── middleware/
│   └── auth.js              # Middleware de autenticación
├── routes/
│   ├── auth.js              # Rutas de autenticación
│   ├── chat.js              # Rutas de mensajes
│   └── admin.js             # Rutas administrativas
├── db/
│   ├── database.js          # Lógica de base de datos
│   └── data/                # Archivos JSON
│       ├── users.json       # Usuarios registrados
│       ├── messages.json    # Mensajes
│       ├── reports.json     # Reportes
│       └── logs.json        # Logs de actividad
├── public/
│   ├── login.html           # Página de login/registro
│   ├── dashboard.html       # Panel de chat
│   └── admin.html           # Panel administrativo
└── logs/                     # Logs de la aplicación
```

---

## 🔐 Características de Seguridad

1. **Contraseñas Encriptadas**: Todas las contraseñas se almacenan hasheadas
2. **Rate Limiting**: Protección contra ataques de fuerza bruta
3. **IP Tracking**: Se registra la IP de creación y últimos logins
4. **Geolocalización**: Se intenta obtener ubicación aproximada
5. **Reportes de Usuarios**: Sistema para reportar comportamiento inapropiado
6. **Logs Completos**: Toda actividad importante se registra
7. **Control de Usuarios**: Admin puede suspender o banear usuarios

---

## 📊 Panel Administrativo

El panel admin incluye:

### 👥 Gestión de Usuarios
- Ver todos los usuarios
- Información de IP y ubicación
- Historial de login
- Cambiar estado (activo, suspendido, baneado)
- Eliminar usuarios
- Ver cantidad de reportes por usuario

### 📢 Reportes
- Ver reportes de usuarios
- Tipos: spam, harassment, inappropriate, other
- Marcar como resuelto
- Nota de resolución

### 📝 Logs
- Historial de todas las acciones
- Timestamps precisos
- Información de usuario e IP

---

## 🛠️ Desarrollo

### Modo desarrollo con auto-reload
```bash
npm run dev
```

### Variables de entorno útiles
```env
NODE_ENV=development    # Modo desarrollo
PORT=3000              # Puerto del servidor
HOST=localhost         # Host
CORS_ORIGIN=*          # CORS permisivo
```

---

## 📝 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Chat
- `POST /api/chat/messages/send` - Enviar mensaje
- `GET /api/chat/messages` - Obtener mensajes
- `GET /api/chat/users` - Listar usuarios disponibles
- `POST /api/chat/reports` - Reportar usuario

### Admin
- `GET /api/admin/users` - Listar todos los usuarios
- `GET /api/admin/users/:id` - Obtener usuario por ID
- `PATCH /api/admin/users/:id/status` - Cambiar estado
- `DELETE /api/admin/users/:id` - Eliminar usuario
- `GET /api/admin/reports` - Listar reportes
- `PATCH /api/admin/reports/:id/resolve` - Resolver reporte
- `GET /api/admin/logs` - Obtener logs

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios principales, abre un issue primero para discutir los cambios propuestos.

---

## ⚠️ Notas de Seguridad

⚠️ **IMPORTANTE PARA PRODUCCIÓN:**
- Cambiar `SESSION_SECRET` a una cadena aleatoria fuerte
- Cambiar contraseña admin por defecto
- Usar HTTPS en producción
- Configurar `NODE_ENV=production`
- Implementar autenticación más robusta
- Considerar una base de datos real (MongoDB, PostgreSQL, etc.)
- Implementar CAPTCHA en login/registro

---

## 📧 Contacto

Creado con ❤️ por **Nico** para estudiantes de 7mo grado.

---

## 📄 Licencia

MIT License - Ver LICENSE para más detalles
