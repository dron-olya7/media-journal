<template>
  <div class="media-card">
    <!-- Постер/обложка -->
    <div class="poster-container">
      <img
        v-if="item.poster"
        :src="item.poster"
        :alt="item.title"
        class="poster"
      />
      <div v-else class="default-poster" :class="item.type">
        <span class="default-text">{{ item.title.charAt(0) }}</span>
      </div>

      <!-- Рейтинг на постере -->
      <div class="poster-rating">
        {{ item.rating }}/10
      </div>
    </div>

    <!-- Содержимое карточки -->
    <div class="card-content">
      <div class="card-header">
        <div class="type-badge" :class="item.type">
          {{ typeEmoji }}
        </div>
        <h3 class="title">{{ item.title }}</h3>
      </div>

      <div class="year" v-if="item.year">{{ item.year }} год</div>

      <div class="genres">
        <span v-for="(genre, index) in item.genres"
              :key="index"
              class="genre">
          {{ genre }}
        </span>
      </div>

      <div class="status" :class="item.status">
        {{ statusText }}
      </div>
      
      <!-- Даты -->
      <div class="dates">
        <div v-if="item.date_added" class="date-added">
          📅 {{ formatDate(item.date_added) }}
        </div>
        <div v-if="item.date_modified" class="date-modified">
          ✏️ {{ formatDate(item.date_modified) }}
        </div>
      </div>

      <!-- КНОПКИ УПРАВЛЕНИЯ -->
      <div class="card-actions">
        <button class="btn-edit" @click="$emit('edit', item)">
          ✏️ Редактировать
        </button>
        <button class="btn-delete" @click="$emit('delete', item)">
          🗑️ Удалить
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MediaCard',
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  computed: {
    typeEmoji() {
      switch(this.item.type) {
        case 'movie': return '🎬'
        case 'book': return '📚'
        case 'series': return '📺'
        default: return '📌'
      }
    },
    statusText() {
      switch(this.item.status) {
        case 'watched': return 'Просмотрено'
        case 'reading': return 'Читаю'
        case 'planned': return 'В планах'
        case 'completed': return 'Прочитано'
        default: return this.item.status
      }
    }
  },
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.media-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.media-card:hover {
  transform: translateY(-5px);
}

.poster-container {
  position: relative;
  height: 200px;
  overflow: hidden;
  flex-shrink: 0;
}

.poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-poster {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: white;
}

.default-poster.movie {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.default-poster.book {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.default-poster.series {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.default-text {
  font-size: 60px;
  font-weight: bold;
  opacity: 0.8;
}

.poster-rating {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 14px;
}

.card-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.type-badge {
  font-size: 20px;
  flex-shrink: 0;
}

.title {
  margin: 0;
  font-size: 18px;
  color: #333;
  line-height: 1.3;
}

.year {
  color: #666;
  margin-bottom: 8px;
  font-size: 14px;
}

.genres {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.genre {
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: #555;
}

.status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 12px;
  align-self: flex-start;
}

.status.watched {
  background: #e8f5e9;
  color: #2e7d32;
}

.status.reading {
  background: #e3f2fd;
  color: #1565c0;
}

.status.planned {
  background: #fff3e0;
  color: #ef6c00;
}

.status.completed {
  background: #f3e5f5;
  color: #7b1fa2;
}

.dates {
  margin-top: auto;
  font-size: 11px;
  color: #888;
}

.date-added,
.date-modified {
  margin-bottom: 2px;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 15px;
}

.btn-edit,
.btn-delete {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-edit {
  background: #e3f2fd;
  color: #1976d2;
}

.btn-edit:hover {
  background: #bbdefb;
}

.btn-delete {
  background: #ffebee;
  color: #d32f2f;
}

.btn-delete:hover {
  background: #ffcdd2;
}
</style>