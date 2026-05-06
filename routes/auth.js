const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const {
  getUser,
  createUser,
  updateLastLogin,
  logAction
} = require('../db/database');

// ==================== REGISTRO ====================
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validaciones
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'El usuario debe tener al menos 3 caracteres'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await getUser(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El usuario ya existe'
      });
    }

    // Crear usuario
    const newUser = await createUser(
      username,
      email,
      password,
      req.clientIP,
      req.geoData
    );

    // Iniciar sesión automáticamente
    req.session.user = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      isAdmin: false
    };

    res.status(201).json({
      success: true,
      message: 'Registro exitoso. ¡Bienvenido!',
      user: req.session.user
    });

  } catch (error) {
    console.error('Error en registro:', error);
    await logAction('REGISTER_ERROR', error.message, { ip: req.clientIP });
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario'
    });
  }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña requeridos'
      });
    }

    const user = await getUser(username);
    if (!user) {
      await logAction('LOGIN_FAILED', `Intento de login con usuario inexistente: ${username}`, { ip: req.clientIP });
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      });
    }

    // Verificar estado del usuario
    if (user.status === 'banned' || user.status === 'suspended') {
      await logAction('LOGIN_BLOCKED', `Usuario ${username} intenta iniciar sesión pero está ${user.status}`, { ip: req.clientIP });
      return res.status(403).json({
        success: false,
        message: `Tu cuenta está ${user.status}. Contacta a un administrador.`
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await logAction('LOGIN_FAILED', `Login fallido para usuario ${username}`, { ip: req.clientIP });
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos'
      });
    }

    // Actualizar último login
    await updateLastLogin(user.id, req.clientIP, req.geoData);

    // Crear sesión
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin
    };

    res.json({
      success: true,
      message: '¡Inicio de sesión exitoso!',
      user: req.session.user
    });

  } catch (error) {
    console.error('Error en login:', error);
    await logAction('LOGIN_ERROR', error.message, { ip: req.clientIP });
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión'
    });
  }
});

// ==================== LOGOUT ====================
router.post('/logout', (req, res) => {
  const username = req.session.user?.username;
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error al cerrar sesión'
      });
    }
    logAction('LOGOUT', `Usuario ${username} cerró sesión`, { ip: req.clientIP });
    res.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });
  });
});

// ==================== OBTENER USUARIO ACTUAL ====================
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      success: true,
      user: req.session.user
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'No hay usuario autenticado'
    });
  }
});

module.exports = router;
