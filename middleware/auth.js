const { getUser } = require('../db/database');

const ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({
    success: false,
    message: 'No autenticado. Por favor inicia sesión.'
  });
};

const ensureAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.isAdmin) {
    return next();
  }
  res.status(403).json({
    success: false,
    message: 'Acceso denegado. Solo administradores.'
  });
};

const optionalAuth = (req, res, next) => {
  next();
};

module.exports = {
  ensureAuthenticated,
  ensureAdmin,
  optionalAuth
};
