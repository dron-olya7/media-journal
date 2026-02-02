<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <!-- Логотип -->
        <div class="logo-section">
          <h1>🎬 MediaJournal</h1>
          <p class="subtitle">Твой личный трекер фильмов, книг и сериалов</p>
        </div>

        <!-- Переключение форм -->
        <div class="form-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'login' }"
            @click="activeTab = 'login'"
          >
            Вход
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'register' }"
            @click="activeTab = 'register'"
          >
            Регистрация
          </button>
        </div>

        <!-- Форма входа -->
        <form
          v-if="activeTab === 'login'"
          @submit.prevent="handleLogin"
          class="login-form"
        >
          <div class="form-group">
            <label for="login-username">Имя пользователя</label>
            <input
              type="text"
              id="login-username"
              v-model="loginForm.username"
              placeholder="Введите имя пользователя"
              required
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label for="login-password">Пароль</label>
            <input
              type="password"
              id="login-password"
              v-model="loginForm.password"
              placeholder="Введите пароль"
              required
              :disabled="loading"
            />
          </div>

          <div v-if="loginError" class="error-message">⚠️ {{ loginError }}</div>

          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="loading" class="btn-spinner"></span>
            <span v-else>Войти</span>
          </button>

          <div class="form-footer">
            <a
              href="#"
              class="forgot-link"
              @click.prevent="showForgotPassword = true"
            >
              Забыли пароль?
            </a>
          </div>
        </form>

        <!-- Форма регистрации -->
        <form
          v-if="activeTab === 'register'"
          @submit.prevent="handleRegister"
          class="login-form"
        >
          <div class="form-group">
            <label for="register-username">Имя пользователя</label>
            <input
              type="text"
              id="register-username"
              v-model="registerForm.username"
              placeholder="Придумайте имя пользователя"
              required
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label for="register-email">Email (необязательно)</label>
            <input
              type="email"
              id="register-email"
              v-model="registerForm.email"
              placeholder="email@example.com"
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label for="register-password">Пароль</label>
            <input
              type="password"
              id="register-password"
              v-model="registerForm.password"
              placeholder="Придумайте пароль"
              required
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label for="register-confirm">Подтвердите пароль</label>
            <input
              type="password"
              id="register-confirm"
              v-model="registerForm.confirmPassword"
              placeholder="Повторите пароль"
              required
              :disabled="loading"
            />
          </div>

          <div v-if="registerError" class="error-message">
            ⚠️ {{ registerError }}
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="loading" class="btn-spinner"></span>
            <span v-else>Зарегистрироваться</span>
          </button>
        </form>

        <!-- Преимущества -->
        <div class="features">
          <h3>🎯 Что вы получаете:</h3>
          <ul>
            <li>📝 Отслеживайте просмотренные фильмы</li>
            <li>📚 Ведите список прочитанных книг</li>
            <li>📺 Следите за сериалами</li>
            <li>⭐ Ставьте оценки и пишите отзывы</li>
            <li>📊 Анализируйте свою активность</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Уведомление -->
    <NotificationPopup
      v-if="notification.visible"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      @close="hideNotification"
    />

    <!-- Восстановление пароля -->
    <div
      v-if="showForgotPassword"
      class="modal-overlay"
      @click.self="showForgotPassword = false"
    >
      <div class="modal">
        <h3>🔐 Восстановление пароля</h3>
        <p>Для восстановления пароля обратитесь к администратору системы.</p>
        <button class="modal-btn" @click="showForgotPassword = false">
          Закрыть
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from "@/api/auth";
import NotificationPopup from "@/components/NotificationPopup.vue";

export default {
  name: "LoginPage",
  components: {
    NotificationPopup,
  },
  data() {
    return {
      activeTab: "login",
      loading: false,
      loginForm: {
        username: "",
        password: "",
      },
      registerForm: {
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      },
      loginError: "",
      registerError: "",
      showForgotPassword: false,
      notification: {
        visible: false,
        type: "success",
        title: "",
        message: "",
      },
    };
  },
  created() {
    // Если уже авторизован, переходим на главную
    if (this.isAuthenticated) {
      this.$router.push("/");
    }
  },
  computed: {
    isAuthenticated() {
      return !!localStorage.getItem("access_token");
    },
  },
  methods: {
    async handleLogin() {
      // Валидация
      if (!this.loginForm.username.trim() || !this.loginForm.password.trim()) {
        this.loginError = "Заполните все поля";
        return;
      }

      this.loading = true;
      this.loginError = "";

      try {
        // console.log("Попытка входа:", this.loginForm.username);

        const response = await api.login({
          username: this.loginForm.username,
          password: this.loginForm.password,
        });

        // console.log("Успешный вход:", response);

        // ОТЛАДКА: Проверяем что сохранено
        //console.log(
        //  "Токен сохранен?",
        //  localStorage.getItem("access_token") ? "Да" : "Нет",
        //);
        //console.log(
        // "Пользователь сохранен?",
        //  localStorage.getItem("user") ? "Да" : "Нет",
        //);

        this.showNotification(
          "success",
          "Вход выполнен",
          `Добро пожаловать, ${response.user?.username || "пользователь"}!`,
        );

        // Ждем немного чтобы токен точно сохранился
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Пробуем перейти на главную РАЗНЫМИ способами:

        // Способ 1: Через router.push()
        //console.log("Пытаемся перейти через router.push()...");
        try {
          await this.$router.push("/");
          //console.log("router.push() успешен!");
        } catch (routerError) {
          console.error("router.push() не сработал:", routerError);

          // Способ 2: Через window.location (принудительно)
          //console.log("Пробуем через window.location...");
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        }
      } catch (error) {
        console.error("Ошибка входа:", error);

        let errorMessage = "Ошибка входа. Проверьте данные.";

        if (error.error) {
          errorMessage = error.error;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }

        this.loginError = errorMessage;
        this.showNotification("error", "Ошибка", errorMessage);
      } finally {
        this.loading = false;
      }
    },

    async handleRegister() {
      // Валидация
      if (!this.registerForm.username.trim()) {
        this.registerError = "Введите имя пользователя";
        return;
      }

      if (!this.registerForm.password) {
        this.registerError = "Введите пароль";
        return;
      }

      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        this.registerError = "Пароли не совпадают";
        return;
      }

      if (this.registerForm.password.length < 6) {
        this.registerError = "Пароль должен быть не менее 6 символов";
        return;
      }

      this.loading = true;
      this.registerError = "";

      try {
        const userData = {
          username: this.registerForm.username,
          password: this.registerForm.password,
        };

        if (this.registerForm.email) {
          userData.email = this.registerForm.email;
        }

        // console.log("Данные для регистрации:", userData);

        // Регистрируем пользователя
        const response = await api.register(userData);

        // console.log("Успешная регистрация:", response);

        // ПОСЛЕ УСПЕШНОЙ РЕГИСТРАЦИИ
        this.showNotification(
          "success",
          "Регистрация успешна",
          `Аккант ${this.registerForm.username} создан!`,
        );

        // Проверяем, сохранен ли токен
        const token = localStorage.getItem("access_token");
        // console.log("Токен сохранен:", token ? "Да" : "Нет");
        //console.log("Данные пользователя:", localStorage.getItem("user"));

        // ОТЛАДКА: Проверяем аутентификацию
        // console.log("Проверка isAuthenticated():", api.isAuthenticated());

        // Ждем немного для применения токена
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Пробуем перейти на главную несколькими способами
        // console.log("Пытаемся перейти на главную...");

        // Способ 1: Через роутер
        try {
          await this.$router.push("/");
          // console.log("Переход через router.push успешен");
        } catch (routerError) {
          console.warn("Router.push не сработал:", routerError);

          // Способ 2: Через window.location
          // console.log("Пробуем через window.location...");
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Полная ошибка регистрации:", error);

        let errorMessage = "Ошибка регистрации";

        if (error.error) {
          errorMessage = error.error;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === "string") {
          errorMessage = error;
        }

        this.registerError = errorMessage;
        this.showNotification("error", "Ошибка", errorMessage);
      } finally {
        this.loading = false;
      }
    },

    showNotification(type, title, message) {
      this.notification = {
        visible: true,
        type,
        title,
        message,
      };

      // Автоматически скрываем успешные уведомления
      if (type === "success") {
        setTimeout(() => {
          this.hideNotification();
        }, 5000);
      }
    },

    hideNotification() {
      this.notification.visible = false;
    },
  },
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 500px;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.logo-section {
  text-align: center;
  margin-bottom: 30px;
}

.logo-section h1 {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10px;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
}

.form-tabs {
  display: flex;
  margin-bottom: 30px;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #f0f0f0;
}

.tab-btn {
  flex: 1;
  padding: 15px;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tab-btn:hover:not(.active) {
  background: #f8f9fa;
}

.login-form {
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.error-message {
  background: #fff5f5;
  border: 1px solid #fed7d7;
  color: #c53030;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
}

.submit-btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.form-footer {
  text-align: center;
  margin-top: 20px;
}

.forgot-link {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.forgot-link:hover {
  color: #764ba2;
  text-decoration: underline;
}

.features {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-top: 30px;
}

.features h3 {
  margin-bottom: 15px;
  color: #333;
}

.features ul {
  list-style: none;
  padding: 0;
}

.features li {
  padding: 5px 0;
  color: #666;
  display: flex;
  align-items: center;
}

.features li:before {
  content: "✓";
  color: #4caf50;
  margin-right: 10px;
  font-weight: bold;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.modal h3 {
  margin-bottom: 15px;
  color: #333;
}

.modal p {
  color: #666;
  margin-bottom: 20px;
}

.modal-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.modal-btn:hover {
  background: #5a67d8;
}

@media (max-width: 768px) {
  .login-card {
    padding: 20px;
  }

  .logo-section h1 {
    font-size: 2rem;
  }
}
</style>
