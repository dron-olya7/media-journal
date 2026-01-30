<template>
  <div id="app">
    <!-- Навигация -->
    <nav class="nav" v-if="isAuthenticated">
      <router-link to="/">🏠 Моя коллекция</router-link>
      <router-link to="/about">ℹ️ О проекте</router-link>
      <div class="user-info">
        <span>👤 {{ currentUser?.username }}</span>
        <button @click="logout" class="btn-logout">Выйти</button>
      </div>
    </nav>
    
    <!-- Страницы для авторизованных -->
    <div v-if="isAuthenticated">
      <router-view />
    </div>
    
    <!-- Страницы для неавторизованных -->
    <div v-else>
      <router-view v-if="$route.meta.requiresAuth === false" />
      <LoginPage v-else />
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import LoginPage from './views/LoginPage.vue';

export default {
  name: 'App',
  components: {
    LoginPage
  },
  computed: {
    ...mapState(['isAuthenticated', 'currentUser'])
  },
  methods: {
    ...mapActions(['logout'])
  },
  created() {
    // При загрузке приложения проверяем токен
    this.$store.dispatch('checkAuth');
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.nav {
  padding: 20px;
  text-align: center;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.nav a {
  margin: 0 15px;
  text-decoration: none;
  color: #2c3e50;
  font-weight: bold;
}

.nav a.router-link-exact-active {
  color: #42b983;
}
</style>
