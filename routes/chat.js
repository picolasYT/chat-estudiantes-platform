const express = require('express');
const router = express.Router();
const {
  saveMessage,
  getMessages,
  getAllUsers,
  getUserById,
  createReport,
  logAction
} = require('../db/database');

// ==================== MENSAJES ====================

// Enviar mensaje
router.post('/messages/send', async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.session.user.id;

    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Receptor y contenido requeridos'
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'El mensaje es demasiado largo (máximo 5000 caracteres)'
      });
    }

    const receiver = await getUserById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Usuario receptor no encontrado'
      });
    }

    const message = await saveMessage(senderId, receiverId, content, {
      senderIP: req.clientIP
    });

    await logAction('MESSAGE_SENT', `${req.session.user.username} envió mensaje a ${receiver.username}`, {
      senderId,
      receiverId,
      messageId: message.id
    });

    res.status(201).json({
      success: true,
      message: 'Mensaje enviado',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar mensaje'
    });
  }
});

// Obtener mensajes
router.get('/messages', async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const messages = await getMessages(req.session.user.id, parseInt(limit));

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mensajes'
    });
  }
});

// ==================== USUARIOS ====================

// Listar usuarios para chatear
router.get('/users', async (req, res) => {
  try {
    const allUsers = await getAllUsers();
    const users = allUsers
      .filter(u => u.id !== req.session.user.id && u.status === 'active')
      .map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        status: u.status
      }));

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios'
    });
  }
});

// ==================== REPORTES ====================

// Reportar usuario
router.post('/reports', async (req, res) => {
  try {
    const { reportedUserId, reportType, reason } = req.body;

    if (!reportedUserId || !reportType || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    if (!['spam', 'harassment', 'inappropriate', 'other'].includes(reportType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de reporte no válido'
      });
    }

    if (reason.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'La razón del reporte debe tener al menos 10 caracteres'
      });
    }

    const report = await createReport(
      reportedUserId,
      reportType,
      reason,
      req.clientIP
    );

    await logAction('USER_REPORTED', `${req.session.user.username} reportó a usuario ${reportedUserId}`, {
      reporterId: req.session.user.id,
      reportedUserId,
      reportType,
      reportId: report.id
    });

    res.status(201).json({
      success: true,
      message: 'Reporte enviado. Los administradores lo revisarán pronto.',
      data: report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear reporte'
    });
  }
});

module.exports = router;
