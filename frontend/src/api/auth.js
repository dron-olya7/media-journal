// src/api/auth.js (максимально упрощенная версия)
class ApiService {
  constructor() {
    this.baseURL = "http://localhost:3001/api";
  }

  // Проверка авторизации
  isAuthenticated() {
    return !!localStorage.getItem("access_token");
  }

  // Получение токена
  getAccessToken() {
    return localStorage.getItem("access_token");
  }

  // Сохранение токенов
  setTokens(accessToken, refreshToken) {
    if (accessToken) localStorage.setItem("access_token", accessToken);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("last_login", Date.now().toString());
  }

  // Очистка токенов
  clearTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("last_login");
  }

  // Универсальный метод запроса
  // В методе request в auth.js
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Добавляем токен
    const token = this.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      // console.log("Используем токен:", token.substring(0, 20) + "...");
    } else {
      // console.log("Токен не найден");
    }

    // console.log(`${options.method || "GET"} ${url}`);
    // console.log("Заголовки:", headers);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      // console.log(`Response: ${response.status} ${response.statusText}`);

      const data = await response.json();
      // console.log("Response data:", data);

      if (!response.ok) {
        // Обработка 403 ошибки (недействительный токен)
        if (response.status === 403 && data.error?.includes("токен")) {
          // console.log("Токен недействителен, очищаем...");
          this.clearTokens();

          // Редирект на логин если не на странице логина
          if (!window.location.pathname.includes("/login")) {
            setTimeout(() => {
              window.location.href = "/login";
            }, 1000);
          }
        }
        throw data;
      }

      return data;
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);
      throw error;
    }
  }

  // Регистрация
  async register(userData) {
    try {
      // console.log("Регистрация:", userData.username);

      const data = await this.request("/auth/register", {
        method: "POST",
        body: userData,
      });

      // console.log("Registration successful:", data);

      // Сохраняем токены если есть
      if (data.access_token) {
        this.setTokens(data.access_token, data.refresh_token);
      }

      // Сохраняем информацию о пользователе
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        localStorage.setItem(
          "user",
          JSON.stringify({
            username: userData.username,
            email: userData.email,
          }),
        );
      }

      return data;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  }

  // Вход
  async login(credentials) {
    try {
      // console.log("Вход:", credentials.username);

      const data = await this.request("/auth/login", {
        method: "POST",
        body: credentials,
      });

      // console.log("Login successful:", data);

      // Сохраняем токены если есть
      if (data.access_token) {
        this.setTokens(data.access_token, data.refresh_token);
      }

      // Сохраняем информацию о пользователе
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        localStorage.setItem(
          "user",
          JSON.stringify({
            username: credentials.username,
          }),
        );
      }

      return data;
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw error;
    }
  }

  // Выход
  async logout() {
    try {
      // console.log("Выход");
      await this.request("/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.warn("⚠️ Logout error (ignoring):", error);
    } finally {
      this.clearTokens();
      // console.log("Session cleared");
    }
  }

  // Получение данных
  async getItems() {
    try {
      // console.log("Загрузка данных...");
      const data = await this.request("/items");
      // console.log(`Loaded ${data.length || 0} items`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Failed to load items:", error);
      throw error;
    }
  }

  // Добавление записи
  async addItem(item) {
    try {
      console.log("➕ Добавление:", item.title);
      const data = await this.request("/items", {
        method: "POST",
        body: item,
      });
      // console.log("Item added");
      return data;
    } catch (error) {
      console.error("Failed to add item:", error);
      throw error;
    }
  }

  // Обновление записи
  async updateItem(id, item) {
    try {
      // console.log("Обновление записи ID:", id);
      // console.log("Данные для обновления:", item);

      // Убедимся что ID есть
      if (!id) {
        throw new Error("ID записи обязателен для обновления");
      }

      const response = await this.request(`/items/${id}`, {
        method: "PUT",
        body: item,
      });

      // console.log("Обновление успешно");
      return response;
    } catch (error) {
      console.error("Ошибка обновления:", error);
      throw error;
    }
  }

  // Удаление записи
  async deleteItem(id) {
    try {
      // console.log(`Удаление: ${id}`);
      const data = await this.request(`/items/${id}`, {
        method: "DELETE",
      });
      // console.log("Item deleted");
      return data;
    } catch (error) {
      console.error("Failed to delete item:", error);
      throw error;
    }
  }

  // Статистика
  async getStats() {
    try {
      // console.log("Статистика...");
      const data = await this.request("/stats");
      // console.log("Stats loaded:", data);
      return data;
    } catch (error) {
      console.error("Failed to load stats:", error);
      throw error;
    }
  }

  // Проверка сервера
  async checkHealth() {
    try {
      // console.log("Проверка сервера...");
      const response = await fetch(`${this.baseURL}/health`);
      const isOk = response.status === 200;
      // console.log(`Server ${isOk ? "is up" : "is down"}`);
      return isOk;
    } catch (error) {
      console.error("Server check failed:", error);
      return false;
    }
  }

  // Демо данные
  async setupDemo() {
    try {
      // console.log("Настройка демо данных...");
      const data = await this.request("/demo/setup", {
        method: "POST",
      });
      // console.log("Demo data setup:", data.message);
      return data;
    } catch (error) {
      console.error("Demo setup failed:", error);
      throw error;
    }
  }
}

export default new ApiService();
