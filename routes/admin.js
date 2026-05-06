const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserStatus,
  getReports,
  resolveReport,
  getLogs,
  logAction
} = require('../db/database');

// ==================== USUARIOS ====================

// Obtener todos los usuarios
router.get('/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({
      success: true,
      data: users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
        createdIP: u.createdIP,
        createdLocation: u.createdLocation,
        lastLogin: u.lastLogin,
        lastLoginIP: u.lastLoginIP,
        lastLoginLocation: u.lastLoginLocation,
        status: u.status,
        reportCount: u.reportCount
      }))
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios'
    });
  }
});

// Obtener usuario por ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        createdIP: user.createdIP,
        createdLocation: user.createdLocation,
        lastLogin: user.lastLogin,
        lastLoginIP: user.lastLoginIP,
        lastLoginLocation: user.lastLoginLocation,
        status: user.status,
        reportCount: user.reportCount
      }
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario'
    });
  }
});

// Cambiar estado de usuario
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const updatedUser = await updateUserStatus(req.params.id, status);
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await logAction('ADMIN_USER_STATUS_CHANGE', `Admin ${req.session.user.username} cambió estado de ${updatedUser.username} a ${status}`, {
      adminId: req.session.user.id,
      userId: req.params.id
    });

    res.json({
      success: true,
      message: `Usuario ${status === 'banned' ? 'baneado' : status === 'suspended' ? 'suspendido' : 'activado'} correctamente`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado'
    });
  }
});

// Eliminar usuario
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await deleteUser(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await logAction('ADMIN_USER_DELETED', `Admin ${req.session.user.username} eliminó usuario ${user.username}`, {
      adminId: req.session.user.id,
      deletedUserId: req.params.id
    });

    res.json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario'
    });
  }
});

// ==================== REPORTES ====================

// Obtener todos los reportes
router.get('/reports', async (req, res) => {
  try {
    const reports = await getReports();
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reportes'
    });
  }
});

// Resolver reporte
router.patch('/reports/:id/resolve', async (req, res) => {
  try {
    const { resolution } = req.body;

    if (!resolution) {
      return res.status(400).json({
        success: false,
        message: 'Resolución requerida'
      });
    }

    const report = await resolveReport(req.params.id, resolution);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    await logAction('ADMIN_REPORT_RESOLVED', `Admin ${req.session.user.username} resolvió reporte ${req.params.id}`, {
      adminId: req.session.user.id,
      reportId: req.params.id,
      resolution
    });

    res.json({
      success: true,
      message: 'Reporte resuelto correctamente',
      data: report
    });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resolver reporte'
    });
  }
});

// ==================== LOGS ====================

// Obtener logs
router.get('/logs', async (req, res) => {
  try {
    const limit = req.query.limit || 100;
    const logs = await getLogs(parseInt(limit));
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener logs'
    });
  }
});

module.exports = router;
