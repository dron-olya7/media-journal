const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

class Database {
  constructor() {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.dbPath = path.join(dataDir, 'media-journal.db');
    this.db = new sqlite3.Database(this.dbPath);
    this.initDatabase();
  }

  initDatabase() {
    this.db.serialize(() => {
      // Таблица пользователей
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Таблица медиа-записей с user_id
      this.db.run(`
        CREATE TABLE IF NOT EXISTS media_items (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          year INTEGER,
          rating INTEGER DEFAULT 0,
          status TEXT,
          genres TEXT,
          poster TEXT,
          review TEXT,
          date_added TEXT,
          date_modified TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      console.log('✅ База данных с пользователями готова');
    });
  }

  // ==================== МЕТОДЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ====================

  // Регистрация
  registerUser(username, email, password, callback) {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        callback(err);
        return;
      }
      
      const sql = `
        INSERT INTO users (username, email, password_hash)
        VALUES (?, ?, ?)
      `;
      
      this.db.run(sql, [username, email, hash], function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            callback(new Error('Пользователь уже существует'));
          } else {
            callback(err);
          }
          return;
        }
        
        callback(null, {
          id: this.lastID,
          username,
          email
        });
      });
    });
  }

  // Авторизация
  loginUser(username, password, callback) {
    const sql = 'SELECT * FROM users WHERE username = ? OR email = ?';
    
    this.db.get(sql, [username, username], (err, user) => {
      if (err) {
        callback(err);
        return;
      }
      
      if (!user) {
        callback(new Error('Пользователь не найден'));
        return;
      }
      
      bcrypt.compare(password, user.password_hash, (err, result) => {
        if (err || !result) {
          callback(new Error('Неверный пароль'));
          return;
        }
        
        delete user.password_hash;
        callback(null, user);
      });
    });
  }

  // Получить пользователя по ID
  getUserById(id, callback) {
    this.db.get(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [id],
      callback
    );
  }

  // Проверить, существует ли пользователь
  checkUserExists(username, email, callback) {
    this.db.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email],
      callback
    );
  }

  // ==================== МЕТОДЫ ДЛЯ МЕДИА ====================

  // Получить записи пользователя
  getUserItems(userId, callback) {
    this.db.all(
      'SELECT * FROM media_items WHERE user_id = ? ORDER BY date_added DESC',
      [userId],
      (err, items) => {
        if (err) {
          callback(err);
          return;
        }
        
        // Парсим JSON поля genres
        const parsedItems = items.map(item => ({
          ...item,
          genres: JSON.parse(item.genres || '[]')
        }));
        
        callback(null, parsedItems);
      }
    );
  }

  // Добавить запись пользователя
  addUserItem(userId, item, callback) {
    const sql = `
      INSERT INTO media_items 
      (id, user_id, type, title, year, rating, status, genres, poster, review, date_added, date_modified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const now = new Date().toISOString();
    const params = [
      item.id,
      userId,
      item.type || 'movie',
      item.title,
      item.year || new Date().getFullYear(),
      item.rating || 0,
      item.status || 'planned',
      JSON.stringify(item.genres || []),
      item.poster || '',
      item.review || '',
      now,
      now
    ];

    this.db.run(sql, params, function(err) {
      callback(err, { id: this.lastID, ...item });
    });
  }

  // Обновить запись пользователя
  updateUserItem(userId, id, item, callback) {
    const sql = `
      UPDATE media_items SET
      type = ?, title = ?, year = ?, rating = ?, status = ?,
      genres = ?, poster = ?, review = ?, date_modified = ?
      WHERE id = ? AND user_id = ?
    `;
    
    const params = [
      item.type,
      item.title,
      item.year,
      item.rating,
      item.status,
      JSON.stringify(item.genres || []),
      item.poster,
      item.review,
      new Date().toISOString(),
      id,
      userId
    ];

    this.db.run(sql, params, function(err) {
      if (this.changes === 0) {
        callback(new Error('Запись не найдена или у вас нет прав'));
      } else {
        callback(err);
      }
    });
  }

  // Удалить запись пользователя
  deleteUserItem(userId, id, callback) {
    this.db.run(
      'DELETE FROM media_items WHERE id = ? AND user_id = ?',
      [id, userId],
      function(err) {
        if (this.changes === 0) {
          callback(new Error('Запись не найдена или у вас нет прав'));
        } else {
          callback(err);
        }
      }
    );
  }

  // Статистика пользователя
  getUserStats(userId, callback) {
    this.db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN type = 'movie' THEN 1 ELSE 0 END) as movies,
        SUM(CASE WHEN type = 'book' THEN 1 ELSE 0 END) as books,
        SUM(CASE WHEN type = 'series' THEN 1 ELSE 0 END) as series
      FROM media_items 
      WHERE user_id = ?
    `, [userId], callback);
  }

  // ==================== АДМИН МЕТОДЫ ====================

  // Получить всех пользователей (только для админа)
  getAllUsers(callback) {
    this.db.all(
      'SELECT id, username, email, created_at FROM users ORDER BY created_at DESC',
      callback
    );
  }

  // Получить все записи (только для админа)
  getAllItemsAdmin(callback) {
    this.db.all(`
      SELECT m.*, u.username 
      FROM media_items m
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY m.date_added DESC
    `, callback);
  }

  // Закрыть соединение
  close() {
    this.db.close();
  }
}

module.exports = Database;