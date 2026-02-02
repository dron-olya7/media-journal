// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginPage from '../views/LoginPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Простая проверка авторизации
router.beforeEach((to, from, next) => {
  console.log(`🔀 Навигация: ${from.path} → ${to.path}`)
  
  const isAuthenticated = !!localStorage.getItem('access_token')
  
  // Если пытаемся зайти на главную без авторизации
  if (to.path === '/' && !isAuthenticated) {
    console.log('❌ Нет доступа к главной, редирект на /login')
    next('/login')
    return
  }
  
  // Если пытаемся зайти на /login уже авторизованным
  if (to.path === '/login' && isAuthenticated) {
    console.log('⚠️ Уже авторизован, редирект на /')
    next('/')
    return
  }
  
  console.log('✅ Разрешаем переход')
  next()
})

export default router