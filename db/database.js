const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

// ==================== INICIALIZACIÓN ====================

const initializeDatabase = async () => {
  try {
    // Crear directorio de datos si no existe
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Crear archivos si no existen
    await ensureFileExists(USERS_FILE, {
      admins: [
        {
          id: uuidv4(),
          username: 'admin',
          email: 'admin@chat-estudiantes.local',
          password: await bcrypt.hash('admin123', 10),
          isAdmin: true,
          createdAt: new Date().toISOString(),
          lastLogin: null,
          status: 'active'
        }
      ],
      users: []
    });

    await ensureFileExists(MESSAGES_FILE, {
      messages: []
    });

    await ensureFileExists(LOGS_FILE, {
      logs: []
    });

    await ensureFileExists(REPORTS_FILE, {
      reports: []
    });

    console.log('✅ Database files initialized');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

const ensureFileExists = async (filePath, defaultData) => {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
  }
};

// ==================== USUARIOS ====================

const getUser = async (username) => {
  try {
    const data = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
    const allUsers = [...data.admins, ...data.users];
    return allUsers.find(u => u.username === username);
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

const getUserById = async (id) => {
  try {
    const data = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
    const allUsers = [...data.admins, ...data.users];
    return allUsers.find(u => u.id === id);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
};

const createUser = async (username, email, password, creationIP, geoData = null) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      isAdmin: false,
      createdAt: new Date().toISOString(),
      createdIP: creationIP,
      createdLocation: geoData ? `${geoData.city}, ${geoData.country}` : 'Desconocida',
      lastLogin: null,
      lastLoginIP: null,
      lastLoginLocation: null,
      status: 'active',
      reportCount: 0
    };

    const data = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
    data.users.push(newUser);
    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));

    // Log la creación
    await logAction('USER_CREATED', `Usuario ${username} creado desde IP ${creationIP}`, { userId: newUser.id });

    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

const updateLastLogin = async (userId, lastLoginIP, geoData = null) => {
  try {
    const data = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
    
    const user = [...data.admins, ...data.users].find(u => u.id === userId);
    if (!user) return null;

    user.lastLogin = new Date().toISOString();
    user.lastLoginIP = lastLoginIP;
    user.lastLoginLocation = geoData ? `${geoData.city}, ${geoData.country}` : 'Desconocida';

    // Guardar cambios
    if (data.admins.find(u => u.id === userId)) {
      data.admins = data.admins.map(u => u.id === userId ? user : u);
    } else {
      data.users = data.users.map(u => u.id === userId ? user : u);
    }

    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));

    await logAction('LOGIN_SUCCESS', `${user.username} inició sesión desde ${lastLoginIP}`, { userId });

    return user;
  } catch (error) {
    console.error('Error updating last login:', error);
    throw error;
  }
};

const getAllUsers = async () => {
  try {
    const data = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
    return [...data.admins, ...data.users].map(u => ({
      ...u,
      password: undefined // No retornar contraseña
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

const deleteUser = async (userId) => {
  try {
    const data = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
    
    const user = [...data.admins, ...data.users].find(u => u.id === userId);
    if (!user) return null;

    data.users = data.users.filter(u => u.id !== userId);
    data.admins = data.admins.filter(u => u.id !== userId);

    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));

    await logAction('USER_DELETED', `Usuario ${user.username} (${userId}) fue eliminado`, { userId });

    return user;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

const updateUserStatus = async (userId, status) => {
  try {
    const data = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
    
    let user = [...data.admins, ...data.users].find(u => u.id === userId);
    if (!user) return null;

    user.status = status;

    if (data.admins.find(u => u.id === userId)) {
      data.admins = data.admins.map(u => u.id === userId ? user : u);
    } else {
      data.users = data.users.map(u => u.id === userId ? user : u);
    }

    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));

    await logAction('USER_STATUS_CHANGED', `Estado del usuario ${user.username} cambió a ${status}`, { userId });

    return user;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

// ==================== MENSAJES ====================

const saveMessage = async (senderId, receiverId, content, metadata = {}) => {
  try {
    const message = {
      id: uuidv4(),
      senderId,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
      read: false,
      ...metadata
    };

    const data = JSON.parse(await fs.readFile(MESSAGES_FILE, 'utf-8'));
    data.messages.push(message);
    await fs.writeFile(MESSAGES_FILE, JSON.stringify(data, null, 2));

    return message;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

const getMessages = async (userId, limit = 50) => {
  try {
    const data = JSON.parse(await fs.readFile(MESSAGES_FILE, 'utf-8'));
    return data.messages
      .filter(m => m.senderId === userId || m.receiverId === userId)
      .slice(-limit);
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

// ==================== REPORTES ====================

const createReport = async (reportedUserId, reportType, reason, reporterIP) => {
  try {
    const report = {
      id: uuidv4(),
      reportedUserId,
      reportType,
      reason,
      reporterIP,
      status: 'pendiente',
      createdAt: new Date().toISOString(),
      resolvedAt: null
    };

    const data = JSON.parse(await fs.readFile(REPORTS_FILE, 'utf-8'));
    data.reports.push(report);
    await fs.writeFile(REPORTS_FILE, JSON.stringify(data, null, 2));

    // Incrementar contador de reportes del usuario
    const userData = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
    let user = [...userData.admins, ...userData.users].find(u => u.id === reportedUserId);
    if (user) {
      user.reportCount = (user.reportCount || 0) + 1;
      if (userData.admins.find(u => u.id === reportedUserId)) {
        userData.admins = userData.admins.map(u => u.id === reportedUserId ? user : u);
      } else {
        userData.users = userData.users.map(u => u.id === reportedUserId ? user : u);
      }
      await fs.writeFile(USERS_FILE, JSON.stringify(userData, null, 2));
    }

    await logAction('REPORT_CREATED', `Usuario reportado: ${reportedUserId}. Razón: ${reason}`, { reportId: report.id });

    return report;
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};

const getReports = async () => {
  try {
    const data = JSON.parse(await fs.readFile(REPORTS_FILE, 'utf-8'));
    return data.reports;
  } catch (error) {
    console.error('Error getting reports:', error);
    return [];
  }
};

const resolveReport = async (reportId, resolution) => {
  try {
    const data = JSON.parse(await fs.readFile(REPORTS_FILE, 'utf-8'));
    const report = data.reports.find(r => r.id === reportId);
    
    if (report) {
      report.status = 'resuelto';
      report.resolvedAt = new Date().toISOString();
      report.resolution = resolution;
      
      await fs.writeFile(REPORTS_FILE, JSON.stringify(data, null, 2));
      await logAction('REPORT_RESOLVED', `Reporte ${reportId} resuelto: ${resolution}`, { reportId });
    }
    
    return report;
  } catch (error) {
    console.error('Error resolving report:', error);
    throw error;
  }
};

// ==================== LOGS ====================

const logAction = async (action, description, metadata = {}) => {
  try {
    const logEntry = {
      id: uuidv4(),
      action,
      description,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    const data = JSON.parse(await fs.readFile(LOGS_FILE, 'utf-8'));
    data.logs.push(logEntry);
    
    // Mantener solo los últimos 10,000 logs para no saturar
    if (data.logs.length > 10000) {
      data.logs = data.logs.slice(-10000);
    }
    
    await fs.writeFile(LOGS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error logging action:', error);
  }
};

const getLogs = async (limit = 100) => {
  try {
    const data = JSON.parse(await fs.readFile(LOGS_FILE, 'utf-8'));
    return data.logs.slice(-limit);
  } catch (error) {
    console.error('Error getting logs:', error);
    return [];
  }
};

module.exports = {
  initializeDatabase,
  getUser,
  getUserById,
  createUser,
  updateLastLogin,
  getAllUsers,
  deleteUser,
  updateUserStatus,
  saveMessage,
  getMessages,
  createReport,
  getReports,
  resolveReport,
  logAction,
  getLogs
};
