// backend/server.js (упрощенная версия без JWT)
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// Хранилище данных (временное, для демо)
const users = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    email: "admin@example.com",
    token: "demo-admin-token",
  },
];
const items = [];

// Генерация простого токена (без JWT)
function generateSimpleToken(username) {
  return `demo-token-${username}-${Date.now()}`;
}

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "Сервер работает нормально",
  });
});

// Регистрация (упрощенная)
app.post("/api/auth/register", (req, res) => {
  try {
    const { username, password, email } = req.body;

    console.log(`📝 Регистрация пользователя: ${username}`);

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Имя пользователя и пароль обязательны" });
    }

    // Проверяем, существует ли пользователь
    const existingUser = users.find((u) => u.username === username);
    if (existingUser) {
      return res.status(400).json({ error: "Пользователь уже существует" });
    }

    // Создаем нового пользователя
    const newUser = {
      id: users.length + 1,
      username,
      password, // В реальном приложении нужно хешировать пароль!
      email: email || null,
      token: generateSimpleToken(username),
    };

    users.push(newUser);

    console.log(`✅ Пользователь ${username} зарегистрирован`);

    // Возвращаем успешный ответ с токеном
    res.status(201).json({
      message: "Пользователь зарегистрирован",
      access_token: newUser.token, // Простой токен
      refresh_token: `refresh-${newUser.token}`,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("❌ Ошибка регистрации:", error);
    res.status(500).json({
      error: "Внутренняя ошибка сервера",
      details: error.message,
    });
  }
});

// Вход (упрощенная)
app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;

    console.log(`🔐 Попытка входа: ${username}`);

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Имя пользователя и пароль обязательны" });
    }

    // Ищем пользователя
    const user = users.find(
      (u) => u.username === username && u.password === password,
    );

    if (!user) {
      console.log(`❌ Неверные данные для пользователя: ${username}`);
      return res
        .status(401)
        .json({ error: "Неверное имя пользователя или пароль" });
    }

    console.log(`✅ Успешный вход: ${username}`);

    res.json({
      message: "Вход выполнен успешно",
      access_token: user.token,
      refresh_token: `refresh-${user.token}`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Ошибка входа:", error);
    res.status(500).json({
      error: "Внутренняя ошибка сервера",
      details: error.message,
    });
  }
});

// Простая проверка токена
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Токен отсутствует" });
  }

  // Ищем пользователя по токену
  const user = users.find((u) => u.token === token);

  if (!user) {
    return res.status(403).json({ error: "Недействительный токен" });
  }

  req.user = user;
  next();
}

// Обновление токена
app.post("/api/auth/refresh", (req, res) => {
  try {
    const { refresh_token } = req.body;

    console.log("🔄 Обновление токена...");

    if (!refresh_token) {
      return res.status(400).json({ error: "Refresh токен обязателен" });
    }

    // Простая проверка (в реальном приложении нужна более сложная логика)
    const tokenPart = refresh_token.replace("refresh-", "");
    const user = users.find((u) => u.token === tokenPart);

    if (!user) {
      return res.status(403).json({ error: "Недействительный refresh токен" });
    }

    // Генерируем новый токен
    user.token = generateSimpleToken(user.username);

    console.log(`✅ Токен обновлен для пользователя: ${user.username}`);

    res.json({
      access_token: user.token,
    });
  } catch (error) {
    console.error("❌ Ошибка обновления токена:", error);
    res.status(500).json({
      error: "Внутренняя ошибка сервера",
      details: error.message,
    });
  }
});

// Выход
app.post("/api/auth/logout", (req, res) => {
  console.log("🚪 Выход из системы...");
  // В реальном приложении здесь можно инвалидировать токен
  res.json({ message: "Выход выполнен успешно" });
});

// Получение всех записей
app.get("/api/items", authenticateToken, (req, res) => {
  const userItems = items.filter((item) => item.user_id === req.user.id);
  console.log(
    `📥 Запрос данных для пользователя ${req.user.username}: ${userItems.length} записей`,
  );
  res.json(userItems);
});

// Добавление записи
app.post("/api/items", authenticateToken, (req, res) => {
  try {
    const item = req.body;

    console.log(`➕ Добавление записи: ${item.title}`);

    if (!item.title || !item.type) {
      return res.status(400).json({ error: "Название и тип обязательны" });
    }

    // ВАЖНО: Генерируем уникальный ID
    const newItem = {
      id: Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9),
      ...item,
      user_id: req.user.id,
      date_added: new Date().toISOString(),
    };

    items.push(newItem);
    console.log(`✅ Запись добавлена. ID: ${newItem.id}`);
    res.status(201).json(newItem);
  } catch (error) {
    console.error("❌ Ошибка добавления:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// Обновление записи
app.put("/api/items/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log(`✏️ Обновление записи ${id}:`, updates);

    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      console.log(`❌ Запись ${id} не найдена`);
      return res.status(404).json({ error: "Запись не найдена" });
    }

    // Проверяем права доступа
    if (items[index].user_id !== req.user.id) {
      return res.status(403).json({ error: "Нет прав для редактирования" });
    }

    items[index] = { ...items[index], ...updates };
    console.log(`✅ Запись ${id} обновлена`);
    res.json(items[index]);
  } catch (error) {
    console.error("❌ Ошибка обновления:", error);
    res.status(500).json({
      error: "Внутренняя ошибка сервера",
      details: error.message,
    });
  }
});

// Удаление записи
app.delete("/api/items/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Удаление записи ${id}`);

    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Запись не найдена" });
    }

    // Проверяем права доступа
    if (items[index].user_id !== req.user.id) {
      return res.status(403).json({ error: "Нет прав для удаления" });
    }

    items.splice(index, 1);
    console.log(`✅ Запись ${id} удалена`);
    res.json({ message: "Запись удалена" });
  } catch (error) {
    console.error("❌ Ошибка удаления:", error);
    res.status(500).json({
      error: "Внутренняя ошибка сервера",
      details: error.message,
    });
  }
});

// Статистика
app.get("/api/stats", authenticateToken, (req, res) => {
  const userItems = items.filter((item) => item.user_id === req.user.id);

  const stats = {
    total: userItems.length,
    movies: userItems.filter((item) => item.type === "movie").length,
    books: userItems.filter((item) => item.type === "book").length,
    series: userItems.filter((item) => item.type === "series").length,
  };

  console.log(`📊 Статистика для ${req.user.username}: ${stats.total} записей`);
  res.json(stats);
});

// Демо данные для тестирования
app.post("/api/demo/setup", (req, res) => {
  // Добавляем тестовые данные
  const demoItems = [
    {
      id: "1",
      title: "Интерстеллар",
      type: "movie",
      year: 2014,
      rating: 9,
      status: "watched",
      genres: ["фантастика", "драма"],
      review: "Отличный фильм о космосе и времени",
      user_id: 1,
      date_added: new Date().toISOString(),
    },
    {
      id: "2",
      title: "1984",
      type: "book",
      year: 1949,
      rating: 8,
      status: "completed",
      genres: ["антиутопия", "классика"],
      review: "Классическая антиутопия",
      user_id: 1,
      date_added: new Date().toISOString(),
    },
  ];

  items.push(...demoItems);

  res.json({
    message: "Демо данные добавлены",
    items: demoItems,
  });
});

// Обработка ошибок 404
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API маршрут не найден" });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error("🔥 Необработанная ошибка:", err);
  res.status(500).json({
    error: "Внутренняя ошибка сервера",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📡 API доступен по адресу http://localhost:${PORT}/api`);
  console.log(`🌐 CORS разрешен для: http://localhost:5173`);
  console.log(`🎮 Демо пользователь: admin / admin123`);
  console.log(
    `🔗 Для добавления демо данных: POST http://localhost:${PORT}/api/demo/setup`,
  );
});
