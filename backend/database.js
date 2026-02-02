const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

class Database {
  constructor() {
    const dataDir = path.join(__dirname, "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.dbPath = path.join(dataDir, "media-journal.db");
    this.db = new sqlite3.Database(this.dbPath);
    this.initDatabase();
  }

  initDatabase() {
    this.db.serialize(() => {
      // УДАЛЯЕМ старые таблицы если они есть
      this.db.run("DROP TABLE IF EXISTS media_items");
      this.db.run("DROP TABLE IF EXISTS users");

      console.log("🗑️ Старые таблицы удалены");

      // Таблица пользователей
      this.db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

      // Таблица медиа-записей с user_id - ИСПРАВЛЕННАЯ
      this.db.run(`
      CREATE TABLE media_items (
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

      console.log("✅ База данных пересоздана с правильной структурой");

      // Создаем тестового пользователя если база пуста
      this.db.get("SELECT COUNT(*) as count FROM users", (err, result) => {
        if (err) {
          console.error("Ошибка проверки пользователей:", err);
          return;
        }

        if (result.count === 0) {
          console.log("👤 Создаю тестового пользователя...");
          const bcrypt = require("bcryptjs");
          bcrypt.hash("password123", 10, (err, hash) => {
            if (err) {
              console.error("Ошибка хеширования:", err);
              return;
            }

            this.db.run(
              "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
              ["testuser", "test@example.com", hash],
              function (err) {
                if (err) {
                  console.error("Ошибка создания пользователя:", err);
                } else {
                  console.log(
                    "✅ Тестовый пользователь создан, ID:",
                    this.lastID,
                  );
                }
              },
            );
          });
        }
      });
    });
  }
  // ==================== МЕТОДЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ====================

  // Регистрация
  registerUser(username, email, password, callback) {
    console.log(`📝 Регистрация пользователя: ${username}`);

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.error("❌ Ошибка хеширования пароля:", err);
        callback(err);
        return;
      }

      const sql = `
        INSERT INTO users (username, email, password_hash)
        VALUES (?, ?, ?)
      `;

      console.log("📋 SQL для регистрации:", sql);

      this.db.run(sql, [username, email, hash], function (err) {
        if (err) {
          console.error("❌ Ошибка SQL при регистрации:", err);
          if (err.code === "SQLITE_CONSTRAINT") {
            callback(new Error("Пользователь уже существует"));
          } else {
            callback(err);
          }
          return;
        }

        console.log("✅ Пользователь зарегистрирован, ID:", this.lastID);
        callback(null, {
          id: this.lastID,
          username,
          email,
        });
      });
    });
  }

  // Авторизация
  loginUser(username, password, callback) {
    console.log(`🔐 Авторизация пользователя: ${username}`);

    const sql = "SELECT * FROM users WHERE username = ? OR email = ?";

    this.db.get(sql, [username, username], (err, user) => {
      if (err) {
        console.error("❌ Ошибка SQL при авторизации:", err);
        callback(err);
        return;
      }

      if (!user) {
        console.log("❌ Пользователь не найден:", username);
        callback(new Error("Пользователь не найден"));
        return;
      }

      console.log("👤 Пользователь найден, проверка пароля...");

      bcrypt.compare(password, user.password_hash, (err, result) => {
        if (err || !result) {
          console.log("❌ Неверный пароль для пользователя:", username);
          callback(new Error("Неверный пароль"));
          return;
        }

        delete user.password_hash;
        console.log("✅ Авторизация успешна для:", user.username);
        callback(null, user);
      });
    });
  }

  // Получить пользователя по ID
  getUserById(id, callback) {
    this.db.get(
      "SELECT id, username, email, created_at FROM users WHERE id = ?",
      [id],
      callback,
    );
  }

  // Проверить, существует ли пользователь
  checkUserExists(username, email, callback) {
    this.db.get(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email],
      callback,
    );
  }

  // ==================== МЕТОДЫ ДЛЯ МЕДИА ====================

  // Получить записи пользователя
  getUserItems(userId, callback) {
    console.log(`📦 Получение записей для пользователя ID: ${userId}`);

    this.db.all(
      "SELECT * FROM media_items WHERE user_id = ? ORDER BY date_added DESC",
      [userId],
      (err, items) => {
        if (err) {
          console.error("❌ Ошибка получения записей:", err);
          callback(err);
          return;
        }

        console.log(`✅ Найдено ${items.length} записей`);

        // Парсим JSON поля genres
        const parsedItems = items.map((item) => ({
          ...item,
          genres: JSON.parse(item.genres || "[]"),
        }));

        callback(null, parsedItems);
      },
    );
  }

  // Добавить запись пользователя - ИСПРАВЛЕННАЯ ВЕРСИЯ
  addUserItem(userId, item, callback) {
    console.log("📝 Добавление записи:");
    console.log("   👤 userId:", userId);
    console.log("   🎬 item:", JSON.stringify(item, null, 2));

    // Проверяем обязательные поля
    if (!item.id) {
      console.error("❌ Item ID is required");
      return callback(new Error("Item ID is required"));
    }

    if (!item.title) {
      console.error("❌ Item title is required");
      return callback(new Error("Item title is required"));
    }

    const sql = `
      INSERT INTO media_items 
      (id, user_id, type, title, year, rating, status, genres, poster, review, date_added, date_modified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const now = new Date().toISOString();
    const params = [
      item.id,
      userId,
      item.type || "movie",
      item.title,
      item.year || new Date().getFullYear(),
      item.rating || 0,
      item.status || "planned",
      JSON.stringify(item.genres || []),
      item.poster || "",
      item.review || "",
      now,
      now,
    ];

    console.log("📋 SQL параметры:", params);

    this.db.run(sql, params, function (err) {
      if (err) {
        console.error("❌ SQL ошибка в addUserItem:", err);
        console.error("❌ SQL statement:", sql);
        return callback(err);
      }

      console.log("✅ Запись успешно добавлена");
      console.log("📊 this.lastID:", this.lastID);
      console.log("📊 this.changes:", this.changes);

      // Возвращаем созданный элемент
      callback(null, {
        id: item.id,
        user_id: userId,
        type: item.type || "movie",
        title: item.title,
        year: item.year || new Date().getFullYear(),
        rating: item.rating || 0,
        status: item.status || "planned",
        genres: item.genres || [],
        poster: item.poster || "",
        review: item.review || "",
        date_added: now,
        date_modified: now,
      });
    });
  }

  // Обновить запись пользователя
  updateUserItem(userId, id, item, callback) {
    console.log(`✏️ Обновление записи ID: ${id} для пользователя: ${userId}`);

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
      userId,
    ];

    console.log("📋 Параметры обновления:", params);

    this.db.run(sql, params, function (err) {
      if (err) {
        console.error("❌ Ошибка обновления:", err);
        callback(err);
        return;
      }

      if (this.changes === 0) {
        console.log("❌ Запись не найдена или нет прав");
        callback(new Error("Запись не найдена или у вас нет прав"));
      } else {
        console.log(`✅ Запись обновлена, изменено строк: ${this.changes}`);
        callback(null);
      }
    });
  }

  // Удалить запись пользователя
  deleteUserItem(userId, id, callback) {
    console.log(`🗑️ Удаление записи ID: ${id} для пользователя: ${userId}`);

    this.db.run(
      "DELETE FROM media_items WHERE id = ? AND user_id = ?",
      [id, userId],
      function (err) {
        if (err) {
          console.error("❌ Ошибка удаления:", err);
          callback(err);
          return;
        }

        if (this.changes === 0) {
          console.log("❌ Запись не найдена или нет прав");
          callback(new Error("Запись не найдена или у вас нет прав"));
        } else {
          console.log(`✅ Запись удалена, удалено строк: ${this.changes}`);
          callback(null);
        }
      },
    );
  }

  // Статистика пользователя
  getUserStats(userId, callback) {
    console.log(`📊 Получение статистики для пользователя: ${userId}`);

    this.db.get(
      `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN type = 'movie' THEN 1 ELSE 0 END) as movies,
        SUM(CASE WHEN type = 'book' THEN 1 ELSE 0 END) as books,
        SUM(CASE WHEN type = 'series' THEN 1 ELSE 0 END) as series
      FROM media_items 
      WHERE user_id = ?
    `,
      [userId],
      (err, stats) => {
        if (err) {
          console.error("❌ Ошибка статистики:", err);
          callback(err);
          return;
        }

        console.log("✅ Статистика:", stats);
        callback(null, stats);
      },
    );
  }

  // ==================== АДМИН МЕТОДЫ ====================

  // Получить всех пользователей (только для админа)
  getAllUsers(callback) {
    this.db.all(
      "SELECT id, username, email, created_at FROM users ORDER BY created_at DESC",
      callback,
    );
  }

  // Получить все записи (только для админа)
  getAllItemsAdmin(callback) {
    this.db.all(
      `
      SELECT m.*, u.username 
      FROM media_items m
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY m.date_added DESC
    `,
      callback,
    );
  }

  // Закрыть соединение
  close() {
    this.db.close();
  }
}

module.exports = Database;
