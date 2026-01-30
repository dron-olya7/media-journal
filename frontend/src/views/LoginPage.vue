<template>
  <div class="login-page">
    <div class="login-container">
      <h1>🎬 MediaJournal</h1>
      
      <div class="auth-tabs">
        <button 
          :class="{ active: activeTab === 'login' }"
          @click="activeTab = 'login'"
        >
          Вход
        </button>
        <button 
          :class="{ active: activeTab === 'register' }"
          @click="activeTab = 'register'"
        >
          Регистрация
        </button>
      </div>

      <!-- Форма входа -->
      <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label>Имя пользователя или Email</label>
          <input 
            type="text" 
            v-model="loginForm.username"
            placeholder="username или email"
            required
          >
        </div>
        
        <div class="form-group">
          <label>Пароль</label>
          <input 
            type="password" 
            v-model="loginForm.password"
            placeholder="Пароль"
            required
            autocomplete="current-password"
          >
        </div>

        <button type="submit" class="btn-auth" :disabled="loading">
          <span v-if="loading">⏳</span>
          <span v-else>Войти</span>
        </button>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>

      <!-- Форма регистрации -->
      <form v-if="activeTab === 'register'" @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label>Имя пользователя</label>
          <input 
            type="text" 
            v-model="registerForm.username"
            placeholder="username"
            required
          >
        </div>
        
        <div class="form-group">
          <label>Email</label>
          <input 
            type="email" 
            v-model="registerForm.email"
            placeholder="email@example.com"
            required
          >
        </div>
        
        <div class="form-group">
          <label>Пароль</label>
          <input 
            type="password" 
            v-model="registerForm.password"
            placeholder="Минимум 6 символов"
            required
            autocomplete="new-password"
          >
        </div>
        
        <div class="form-group">
          <label>Повторите пароль</label>
          <input 
            type="password" 
            v-model="registerForm.confirmPassword"
            placeholder="Повторите пароль"
            required
            autocomplete="new-password"
          >
        </div>

        <button type="submit" class="btn-auth" :disabled="loading">
          <span v-if="loading">⏳</span>
          <span v-else>Зарегистрироваться</span>
        </button>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'LoginPage',
  data() {
    return {
      activeTab: 'login',
      loading: false,
      error: '',
      loginForm: {
        username: '',
        password: ''
      },
      registerForm: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      }
    }
  },
  methods: {
    ...mapActions(['login', 'register']),
    
    async handleLogin() {
      if (!this.loginForm.username || !this.loginForm.password) {
        this.error = 'Заполните все поля';
        return;
      }
      
      this.loading = true;
      this.error = '';
      
      try {
        await this.login(this.loginForm);
        this.$router.push('/');
      } catch (err) {
        this.error = err.message || 'Ошибка авторизации';
      } finally {
        this.loading = false;
      }
    },
    
    async handleRegister() {
      const { username, email, password, confirmPassword } = this.registerForm;
      
      if (!username || !email || !password || !confirmPassword) {
        this.error = 'Заполните все поля';
        return;
      }
      
      if (password !== confirmPassword) {
        this.error = 'Пароли не совпадают';
        return;
      }
      
      if (password.length < 6) {
        this.error = 'Пароль должен быть минимум 6 символов';
        return;
      }
      
      this.loading = true;
      this.error = '';
      
      try {
        await this.register(this.registerForm);
        this.activeTab = 'login';
        this.error = 'Регистрация успешна! Теперь войдите в систему';
      } catch (err) {
        this.error = err.message || 'Ошибка регистрации';
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-container {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.auth-tabs {
  display: flex;
  margin-bottom: 30px;
  border-bottom: 2px solid #eee;
}

.auth-tabs button {
  flex: 1;
  padding: 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  position: relative;
}

.auth-tabs button.active {
  color: #667eea;
  font-weight: bold;
}

.auth-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #667eea;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-group input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-auth {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-auth:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-auth:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  background: #ffebee;
  color: #d32f2f;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}
</style>