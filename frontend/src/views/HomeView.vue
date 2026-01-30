<template>
  <div class="home">
    <header class="header">
      <h1>🎬 MediaJournal</h1>
      <p class="subtitle">Твой личный трекер фильмов, книг и сериалов</p>
      
      <!-- Управление базой -->
      <div class="database-controls">
        <button class="db-btn reload" @click="loadData" :disabled="loading">
          <span v-if="loading" class="btn-spinner"></span>
          <span v-else>🔄</span> Обновить
        </button>
        <button class="db-btn export" @click="exportData" :disabled="items.length === 0">
          💾 Экспорт
        </button>
        <button class="db-btn stats" @click="loadStats" :disabled="loading">
          📊 Статистика
        </button>
      </div>
      
      <!-- Статус базы -->
      <div class="db-status" v-if="!loading">
        <span class="db-stat">🗄️ SQLite база: {{ stats.total }} записей</span>
        <span class="db-stat">🎬 {{ stats.movies }} фильмов</span>
        <span class="db-stat">📚 {{ stats.books }} книг</span>
        <span class="db-stat">📺 {{ stats.series }} сериалов</span>
        <span class="db-stat connected">🟢 Сервер подключен</span>
      </div>
    </header>

    <div class="collection">
      <h2>Моя коллекция ({{ items.length }})</h2>

      <!-- Загрузка -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Загрузка из SQLite базы...</p>
      </div>

      <!-- Пустая база -->
      <div v-else-if="items.length === 0" class="empty-db">
        <div class="empty-icon">📂</div>
        <h3>База данных пуста</h3>
        <p>Добавьте первую запись!</p>
        <button class="btn-add-first" @click="showAddForm = true">
          + Добавить первую запись
        </button>
      </div>

      <!-- Карточки -->
      <div v-else class="cards-grid">
        <MediaCard 
          v-for="item in items" 
          :key="item.id" 
          :item="item"
          @edit="editMedia"
          @delete="showDeleteConfirmation"
        />
      </div>
    </div>

    <!-- Форма добавления -->
    <AddMediaForm
      :show="showAddForm"
      @close="showAddForm = false"
      @submit="addNewMedia"
      @error="handleFormError"
    />

    <!-- Форма редактирования -->
    <AddMediaForm
      v-if="editingItem"
      :show="true"
      :editMode="true"
      :initialData="editingItem"
      @close="cancelEdit"
      @submit="updateMedia"
      @error="handleFormError"
    />

    <!-- Уведомления -->
    <NotificationPopup
      v-if="notification.visible"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      @close="hideNotification"
    />

    <!-- Подтверждение удаления -->
    <ConfirmationPopup
      :visible="showDeleteConfirm"
      title="Удаление записи"
      :message="deleteConfirmMessage"
      :details="deleteConfirmDetails"
      icon="🗑️"
      confirmText="Удалить"
      cancelText="Отмена"
      danger
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- Кнопка добавления -->
    <button class="add-btn" @click="showAddForm = true">+</button>
  </div>
</template>

<script>
import MediaCard from '@/components/media/MediaCard.vue'
import AddMediaForm from '@/components/media/AddMediaForm.vue'
import NotificationPopup from '@/components/NotificationPopup.vue'
import ConfirmationPopup from '@/components/ConfirmationPopup.vue'

export default {
  name: 'HomeView',
  components: {
    MediaCard,
    AddMediaForm,
    NotificationPopup,
    ConfirmationPopup
  },
  data() {
    return {
      loading: false,
      items: [],
      showAddForm: false,
      editingItem: null,
      
      stats: {
        total: 0,
        movies: 0,
        books: 0,
        series: 0
      },
      
      notification: {
        visible: false,
        type: 'success',
        title: '',
        message: ''
      },
      
      showDeleteConfirm: false,
      itemToDelete: null,
      deleteConfirmDetails: null
    }
  },
  
  computed: {
    deleteConfirmMessage() {
      return 'Вы уверены, что хотите удалить эту запись?'
    }
  },
  
  async created() {
    await this.loadData()
  },
  
  methods: {
    async loadData() {
      this.loading = true
      try {
        const response = await fetch('/api/items')
        if (response.ok) {
          this.items = await response.json()
          await this.loadStats()
          
          if (this.items.length > 0) {
            this.showNotification('success', 'База данных', `Загружено ${this.items.length} записей`)
          }
        } else {
          throw new Error('Ошибка сервера')
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки:', error)
        this.showNotification('error', 'Ошибка базы', 'Не удалось подключиться к SQLite')
      } finally {
        this.loading = false
      }
    },
    
    async loadStats() {
      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          this.stats = {
            total: data.total || 0,
            movies: data.movies || 0,
            books: data.books || 0,
            series: data.series || 0
          }
        }
      } catch (error) {
        console.error('Ошибка статистики:', error)
      }
    },
    
    async addNewMedia(newMedia) {
      try {
        const response = await fetch('/api/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...newMedia,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
          }),
        })
        
        if (response.ok) {
          await this.loadData()
          this.showNotification('success', 'Успешно!', `"${newMedia.title}" добавлен в SQLite базу`)
          this.showAddForm = false
        } else {
          throw new Error('Ошибка сервера')
        }
      } catch (error) {
        console.error('Ошибка добавления:', error)
        this.showNotification('error', 'Ошибка', 'Не удалось сохранить запись')
      }
    },
    
    editMedia(item) {
      this.editingItem = { ...item }
    },
    
    async updateMedia(updatedData) {
      try {
        const response = await fetch(`/api/items/${updatedData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedData),
        })
        
        if (response.ok) {
          await this.loadData()
          this.showNotification('success', 'Обновлено!', `"${updatedData.title}" обновлен в базе`)
          this.cancelEdit()
        } else {
          throw new Error('Ошибка сервера')
        }
      } catch (error) {
        console.error('Ошибка обновления:', error)
        this.showNotification('error', 'Ошибка', 'Не удалось обновить запись')
      }
    },
    
    cancelEdit() {
      this.editingItem = null
    },
    
    showDeleteConfirmation(item) {
      this.itemToDelete = item.id
      this.deleteConfirmDetails = {
        label: 'Запись',
        value: item.title
      }
      this.showDeleteConfirm = true
    },
    
    async confirmDelete() {
      const item = this.items.find(item => item.id === this.itemToDelete)
      if (item) {
        try {
          const response = await fetch(`/api/items/${this.itemToDelete}`, {
            method: 'DELETE'
          })
          
          if (response.ok) {
            await this.loadData()
            this.showNotification('success', 'Удалено!', `"${item.title}" удален из SQLite базы`)
          } else {
            throw new Error('Ошибка сервера')
          }
        } catch (error) {
          console.error('Ошибка удаления:', error)
          this.showNotification('error', 'Ошибка', 'Не удалось удалить запись')
        }
      }
      this.cancelDelete()
    },
    
    cancelDelete() {
      this.showDeleteConfirm = false
      this.itemToDelete = null
      this.deleteConfirmDetails = null
    },
    
    async exportData() {
      try {
        const response = await fetch('/api/items')
        if (response.ok) {
          const items = await response.json()
          
          const data = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            totalItems: items.length,
            items: items
          }
          
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `media-journal-backup-${new Date().toISOString().split('T')[0]}.json`
          link.click()
          window.URL.revokeObjectURL(url)
          
          this.showNotification('success', 'Экспорт', `Данные экспортированы (${items.length} записей)`)
        }
      } catch (error) {
        console.error('Ошибка экспорта:', error)
        this.showNotification('error', 'Ошибка', 'Не удалось экспортировать данные')
      }
    },
    
    handleFormError(errorMessage) {
      this.showNotification('error', 'Ошибка', errorMessage)
    },
    
    showNotification(type, title, message) {
      this.notification = {
        visible: true,
        type,
        title,
        message
      }
    },
    
    hideNotification() {
      this.notification.visible = false
    }
  }
}
</script>

<style scoped>
/* Стили HomeView - как в предыдущем сообщении */
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
}

.database-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 20px 0;
  flex-wrap: wrap;
}

.db-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.db-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.db-btn.reload {
  background: #6c757d;
  color: white;
}

.db-btn.export {
  background: #28a745;
  color: white;
}

.db-btn.stats {
  background: #ffc107;
  color: #212529;
}

.db-status {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-top: 15px;
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
  font-size: 14px;
}

.db-stat {
  background: white;
  padding: 6px 12px;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.db-stat.connected {
  color: #28a745;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 5px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.collection {
  margin-top: 30px;
}

.collection h2 {
  font-size: 1.8rem;
  margin-bottom: 25px;
  color: #343a40;
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.empty-db {
  text-align: center;
  padding: 60px 20px;
  background: #f8f9fa;
  border-radius: 15px;
  border: 2px dashed #dee2e6;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-db h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #495057;
}

.empty-db p {
  color: #6c757d;
  margin-bottom: 25px;
}

.btn-add-first {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-add-first:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  margin-top: 20px;
}

.add-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  font-size: 32px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.add-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
}

@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }
  
  .add-btn {
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    font-size: 28px;
  }
}
</style>