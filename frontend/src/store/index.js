import { createStore } from 'vuex'
import api from '@/api/auth'

const store = createStore({
  state() {
    return {
      isAuthenticated: localStorage.getItem('token') !== null,
      currentUser: null,
      token: localStorage.getItem('token') || null
    }
  },
  
  mutations: {
    SET_AUTH(state, { user, token }) {
      state.isAuthenticated = true;
      state.currentUser = user;
      state.token = token;
      localStorage.setItem('token', token);
    },
    
    CLEAR_AUTH(state) {
      state.isAuthenticated = false;
      state.currentUser = null;
      state.token = null;
      localStorage.removeItem('token');
    }
  },
  
  actions: {
    async login({ commit }, credentials) {
      try {
        const data = await api.login(credentials);
        
        if (!data.success) {
          throw new Error(data.error || 'Ошибка авторизации');
        }
        
        commit('SET_AUTH', {
          user: data.user,
          token: data.token
        });
        
        return data;
      } catch (error) {
        throw error;
      }
    },
    
    async register({ commit }, userData) {
      try {
        const data = await api.register(userData);
        
        if (!data.success) {
          throw new Error(data.error || 'Ошибка регистрации');
        }
        
        return data;
      } catch (error) {
        throw error;
      }
    },
    
    logout({ commit }) {
      commit('CLEAR_AUTH');
    },
    
    async checkAuth({ commit, state }) {
      if (!state.token) return;
      
      try {
        const data = await api.verifyToken();
        
        if (data.user) {
          commit('SET_AUTH', {
            user: data.user,
            token: state.token
          });
        } else {
          commit('CLEAR_AUTH');
        }
      } catch (error) {
        commit('CLEAR_AUTH');
      }
    }
  },
  
  getters: {
    isAuthenticated: state => state.isAuthenticated,
    currentUser: state => state.currentUser,
    token: state => state.token
  }
});

export default store;