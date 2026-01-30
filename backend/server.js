const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Database = require('./database');

const app = express();
const db = new Database();
const JWT_SECRET = 'your-secret-key-change-this-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Неверный токен' });
    }
    req.user = user;
    next();
  });
};

// ==================== ПУБЛИЧНЫЕ РОУТЫ ====================

// Проверка сервера
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Сервер с авторизацией работает' });
});

// Регистрация
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
  }

  db.registerUser(username, email, password, (err, user) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Регистрация успешна',
      user,
      token
    });
  });
});

// Авторизация
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  db.loginUser(username, password, (err, user) => {
    if (err) {
      return res.status(401).json({ error: err.message });
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Авторизация успешна',
      user,
      token
    });
  });
});

// Проверка токена
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  db.getUserById(req.user.id, (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ user });
  });
});

// ==================== ЗАЩИЩЕННЫЕ РОУТЫ ====================

// Получить записи пользователя
app.get('/api/items', authenticateToken, (req, res) => {
  db.getUserItems(req.user.id, (err, items) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(items);
  });
});

// Добавить запись
app.post('/api/items', authenticateToken, (req, res) => {
  const item = req.body;
  
  if (!item.id) {
    item.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
  
  db.addUserItem(req.user.id, item, (err, newItem) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    newItem.genres = JSON.parse(newItem.genres || '[]');
    res.status(201).json(newItem);
  });
});

// Обновить запись
app.put('/api/items/:id', authenticateToken, (req, res) => {
  db.updateUserItem(req.user.id, req.params.id, req.body, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ success: true, message: 'Запись обновлена' });
  });
});

// Удалить запись
app.delete('/api/items/:id', authenticateToken, (req, res) => {
  db.deleteUserItem(req.user.id, req.params.id, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ success: true, message: 'Запись удалена' });
  });
});

// Статистика пользователя
app.get('/api/stats', authenticateToken, (req, res) => {
  db.getUserStats(req.user.id, (err, stats) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json(stats || { total: 0, movies: 0, books: 0, series: 0 });
  });
});

// Профиль пользователя
app.get('/api/user/profile', authenticateToken, (req, res) => {
  db.getUserById(req.user.id, (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.getUserStats(req.user.id, (err, stats) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        user,
        stats: stats || { total: 0, movies: 0, books: 0, series: 0 }
      });
    });
  });
});

// ==================== АДМИН РОУТЫ ====================

// Получить всех пользователей (админ)
app.get('/api/admin/users', authenticateToken, (req, res) => {
  // Проверяем, является ли пользователь админом
  if (req.user.username !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }
  
  db.getAllUsers((err, users) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(users);
  });
});

// Получить все записи (админ)
app.get('/api/admin/items', authenticateToken, (req, res) => {
  if (req.user.username !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }
  
  db.getAllItemsAdmin((err, items) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const parsedItems = items.map(item => ({
      ...item,
      genres: JSON.parse(item.genres || '[]')
    }));
    
    res.json(parsedItems);
  });
});

// ==================== ЗАПУСК СЕРВЕРА ====================

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Сервер с авторизацией запущен: http://localhost:${PORT}`);
  console.log(`📁 База данных: ${db.dbPath}`);
  console.log(`🔐 JWT секрет: ${JWT_SECRET}`);
});