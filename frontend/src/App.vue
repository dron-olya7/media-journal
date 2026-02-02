<template>
  <div id="app">
    <!-- Простая навигация -->
    <div v-if="$route.path !== '/login'" class="nav-wrapper">
      <nav class="nav">
        <div class="nav-container">
          <div class="nav-left">
            <span class="nav-user" v-if="currentUser">
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="20" cy="20" r="20" fill="white" fill-opacity="0.5"/>
<g clip-path="url(#clip0_0_1)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8.05759 27.2493C7.93965 27.5914 8.00552 27.9707 8.23077 28.2544C10.9338 31.6554 15.2911 33.875 20.2083 33.875C25.1256 33.875 29.4829 31.6554 32.1859 28.2544C32.4111 27.9707 32.476 27.5914 32.3591 27.2493C30.725 22.4839 25.9097 19 20.2083 19C14.507 19 9.69171 22.4839 8.05759 27.2493ZM10.2761 27.3884C11.8071 23.7143 15.6874 21.125 20.2083 21.125C24.7293 21.125 28.6095 23.7143 30.1406 27.3884C27.7967 30.0532 24.215 31.75 20.2083 31.75C16.2016 31.75 12.62 30.0532 10.2761 27.3884Z" fill="white"/>
<path d="M19.5 17C22.5376 17 25 14.5376 25 11.5C25 8.46243 22.5376 6 19.5 6C16.4624 6 14 8.46243 14 11.5C14 14.5376 16.4624 17 19.5 17Z" stroke="white" stroke-width="2"/>
</g>
<defs>
<clipPath id="clip0_0_1">
<rect width="25" height="29" fill="white" transform="translate(8 5)"/>
</clipPath>
</defs>
</svg>
{{ currentUser.username }}
            </span>
          </div>
          <div class="nav-right">
            <button @click="logout" class="nav-logout" title="Выйти">
              Выйти
            </button>
          </div>
        </div>
      </nav>
    </div>

    <!-- Основной контент -->
    <router-view />
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      currentUser: null,
    };
  },
  created() {
    this.loadUser();
  },
  watch: {
    $route() {
      this.loadUser();
    },
  },
  methods: {
    loadUser() {
      const userStr = localStorage.getItem("user");
      this.currentUser = userStr ? JSON.parse(userStr) : null;
      // console.log("Загружен пользователь:", this.currentUser);
    },

    logout() {
      if (confirm("Вы уверены, что хотите выйти?")) {
        // Очищаем localStorage
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");

        // Переходим на страницу входа
        this.$router.push("/login");

        // Обновляем страницу
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Обертка для навигации */
.nav-wrapper {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* Сама навигация */
.nav {
  padding: 15px 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.nav-container {
  display: flex;
  gap: 15px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
  transition: opacity 0.3s;
}

.nav-logo:hover {
  opacity: 0.8;
}

.nav-user {
  padding: 0 13px 0 0;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 8px;
    color: white;
}

.nav-logout {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-logout:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(0px);
}

/* Адаптивность */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 15px;
  }

  .nav {
    padding: 12px 0;
    flex-direction: column;
    gap: 10px;
  }

  .nav-left,
  .nav-right {
    width: 100%;
    justify-content: center;
  }

  .nav-user {
    font-size: 0.8rem;
  }
}
</style>
