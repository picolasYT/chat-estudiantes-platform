#!/usr/bin/env node

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const geoip = require('geoip-lite');

// Importar rutas
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const { ensureAuthenticated, ensureAdmin } = require('./middleware/auth');
const { initializeDatabase } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// ==================== CONFIGURACIÓN DE SEGURIDAD ====================
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiter global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas solicitudes, intenta más tarde'
});
app.use(limiter);

// Rate limiter más estricto para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Demasiados intentos de login, intenta en 15 minutos'
});

// ==================== MIDDLEWARE ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu-clave-super-secreta-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Middleware para capturar IP y geolocalización
app.use((req, res, next) => {
  req.clientIP = req.ip || req.connection.remoteAddress;
  req.geoData = geoip.lookup(req.clientIP);
  next();
});

// ==================== RUTAS ====================

// Rutas de autenticación con rate limiter en login
app.use('/api/auth', (req, res, next) => {
  if (req.path === '/login' && req.method === 'POST') {
    loginLimiter(req, res, next);
  } else {
    next();
  }
}, authRoutes);

// Rutas del admin (requieren autenticación y ser admin)
app.use('/api/admin', ensureAuthenticated, ensureAdmin, adminRoutes);

// Rutas del chat (requieren autenticación)
app.use('/api/chat', ensureAuthenticated, chatRoutes);

// ==================== RUTAS ESTÁTICAS ====================

// Panel de control principal
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});

app.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/admin', ensureAuthenticated, ensureAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ==================== MANEJO DE ERRORES ====================

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// ==================== INICIALIZACIÓN ====================

async function startServer() {
  try {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   CHAT ESTUDIANTES - Plataforma v1.0      ║');
    console.log('║   Creado por: Nico                        ║');
    console.log('║   Para: 7mo Grado                         ║');
    console.log('╚════════════════════════════════════════════╝\n');

    // Inicializar base de datos
    console.log('📦 Inicializando base de datos...');
    await initializeDatabase();
    console.log('✅ Base de datos lista\n');

    // Iniciar servidor
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Servidor ejecutándose en http://${HOST}:${PORT}`);
      console.log(`🌍 Acceso desde: http://localhost:${PORT}`);
      console.log(`\n📊 Paneles disponibles:`);
      console.log(`   - Login/Registro: http://localhost:${PORT}/`);
      console.log(`   - Chat: http://localhost:${PORT}/dashboard`);
      console.log(`   - Admin Panel: http://localhost:${PORT}/admin`);
      console.log(`\n💾 Base de datos JSON en: ./db/data/`);
      console.log(`📝 Logs en: ./logs/`);
      console.log(`\n⏱️  ${new Date().toLocaleString()}\n`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();

// Manejo de señales para cerrar gracefully
process.on('SIGINT', () => {
  console.log('\n\n📴 Apagando servidor...');
  process.exit(0);
});
