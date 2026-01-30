import { createStore } from 'vuex'

const store = createStore({
  state() {
    return {
      isAuthenticated: false,
      currentUser: null,
      token: localStorage.getItem('token') || null
    }
  },
  
  mutations: {
    SET_AUTH(state, { user, token }) {
      state.isAuthenticated = true
      state.currentUser = user
      state.token = token
      if (token) {
        localStorage.setItem('token', token)
      }
    },
    
    CLEAR_AUTH(state) {
      state.isAuthenticated = false
      state.currentUser = null
      state.token = null
      localStorage.removeItem('token')
    },
    
    UPDATE_USER(state, user) {
      state.currentUser = user
    }
  },
  
  actions: {
    async login({ commit }, credentials) {
      try {
        // Замените на реальный API-вызов
        console.log('Логин с:', credentials)
        
        // Имитация ответа API
        const mockResponse = {
          user: {
            id: 1,
            username: credentials.username,
            email: 'user@example.com'
          },
          token: 'mock-jwt-token-12345'
        }
        
        await new Promise(resolve => setTimeout(resolve, 500)) // Имитация задержки
        
        commit('SET_AUTH', {
          user: mockResponse.user,
          token: mockResponse.token
        })
        
        return mockResponse
      } catch (error) {
        throw new Error('Ошибка авторизации')
      }
    },
    
    async register({ commit }, userData) {
      try {
        // Замените на реальный API-вызов
        console.log('Регистрация:', userData)
        
        // Имитация ответа API
        const mockResponse = {
          user: {
            id: 2,
            username: userData.username,
            email: userData.email
          },
          message: 'Регистрация успешна'
        }
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
        return mockResponse
      } catch (error) {
        throw new Error('Ошибка регистрации')
      }
    },
    
    logout({ commit }) {
      commit('CLEAR_AUTH')
    },
    
    checkAuth({ commit, state }) {
      if (state.token) {
        // Здесь можно проверить токен на сервере
        // Пока просто считаем, что если есть токен - пользователь авторизован
        const mockUser = {
          id: 1,
          username: 'demo_user',
          email: 'demo@example.com'
        }
        commit('SET_AUTH', { user: mockUser, token: state.token })
      }
    }
  },
  
  getters: {
    isAuthenticated: state => state.isAuthenticated,
    currentUser: state => state.currentUser,
    token: state => state.token
  }
})

export default store