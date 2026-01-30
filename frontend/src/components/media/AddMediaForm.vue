<template>
  <div class="modal-overlay" v-if="show" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ editMode ? '✏️ Редактировать' : 'Добавить в коллекцию' }}</h2>
        <button class="close-btn" @click="close">×</button>
      </div>

      <form @submit.prevent="submitForm" class="form">
        <!-- Тип медиа -->
        <div class="form-group">
          <label>Что {{ editMode ? 'редактируем' : 'добавляем' }}?</label>
          <div class="type-selector">
            <button
              type="button"
              v-for="type in types"
              :key="type.value"
              :class="{ active: formData.type === type.value }"
              @click="formData.type = type.value"
            >
              {{ type.icon }} {{ type.label }}
            </button>
          </div>
        </div>

        <!-- Название -->
        <div class="form-group">
          <label for="title">Название *</label>
          <input
            type="text"
            id="title"
            v-model="formData.title"
            placeholder="Например: Интерстеллар"
            required
          >
        </div>

        <!-- Год -->
        <div class="form-group">
          <label for="year">Год выпуска</label>
          <input
            type="number"
            id="year"
            v-model="formData.year"
            placeholder="2024"
            min="1900"
            :max="new Date().getFullYear()"
          >
        </div>

        <!-- Рейтинг -->
        <div class="form-group">
          <label>Оценка</label>
          <div class="rating-stars">
            <button
              type="button"
              v-for="star in 10"
              :key="star"
              :class="{ active: star <= formData.rating }"
              @click="formData.rating = star"
            >
              {{ star }}
            </button>
          </div>
          <div class="rating-value">{{ formData.rating }}/10</div>
        </div>

        <!-- Статус -->
        <div class="form-group">
          <label>Статус</label>
          <div class="status-selector">
            <button
              type="button"
              v-for="status in statuses"
              :key="status.value"
              :class="{ active: formData.status === status.value }"
              @click="formData.status = status.value"
            >
              {{ status.label }}
            </button>
          </div>
        </div>

        <!-- Жанры -->
        <div class="form-group">
          <label>Жанры</label>
          <div class="genres-selector">
            <button
              type="button"
              v-for="genre in popularGenres"
              :key="genre"
              :class="{ active: formData.genres.includes(genre) }"
              @click="toggleGenre(genre)"
            >
              {{ genre }}
            </button>
          </div>
          <div class="selected-genres" v-if="formData.genres.length">
            Выбрано: {{ formData.genres.join(', ') }}
          </div>
        </div>

        <!-- URL картинки -->
        <div class="form-group">
          <label for="poster-url">Ссылка на картинку</label>
          <input
            type="url"
            id="poster-url"
            v-model="posterUrl"
            placeholder="https://example.com/poster.jpg"
            @input="handleUrlChange"
          >
          <small class="hint">Можно оставить пустым</small>
        </div>

        <!-- Отзыв -->
        <div class="form-group">
          <label for="review">Твои впечатления</label>
          <textarea
            id="review"
            v-model="formData.review"
            placeholder="Что понравилось, что нет..."
            rows="3"
          ></textarea>
        </div>

        <!-- Кнопки -->
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="close">
            Отмена
          </button>
          <button type="submit" class="btn-submit">
            {{ editMode ? '💾 Обновить' : '💾 Сохранить' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AddMediaForm',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    editMode: {
      type: Boolean,
      default: false
    },
    initialData: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      formData: {
        type: 'movie',
        title: '',
        year: new Date().getFullYear(),
        rating: 7,
        status: 'watched',
        genres: [],
        poster: '',
        review: ''
      },
      posterUrl: '',
      
      types: [
        { value: 'movie', label: 'Фильм', icon: '🎬' },
        { value: 'book', label: 'Книга', icon: '📚' },
        { value: 'series', label: 'Сериал', icon: '📺' }
      ],
      statuses: [
        { value: 'watched', label: 'Просмотрено' },
        { value: 'reading', label: 'Читаю' },
        { value: 'planned', label: 'В планах' },
        { value: 'completed', label: 'Прочитано' }
      ],
      popularGenres: [
        'фантастика', 'драма', 'комедия', 'боевик', 'триллер',
        'романтика', 'ужасы', 'детектив', 'фэнтези', 'аниме',
        'биография', 'история', 'документальный', 'мультфильм',
        'антиутопия', 'классика', 'научная литература', 'поэзия'
      ]
    }
  },
  watch: {
    initialData: {
      handler(newData) {
        if (newData) {
          this.formData = { ...newData }
          this.posterUrl = newData.poster || ''
        }
      },
      immediate: true
    }
  },
  methods: {
    close() {
      this.$emit('close')
      this.resetForm()
    },

    submitForm() {
      if (!this.formData.title.trim()) {
        this.$emit('error', 'Введите название!')
        return
      }

      if (this.posterUrl) {
        this.formData.poster = this.posterUrl
      }

      this.$emit('submit', {
        ...this.formData,
        id: this.editMode && this.initialData ? this.initialData.id : null
      })

      this.resetForm()
    },

    resetForm() {
      this.formData = {
        type: 'movie',
        title: '',
        year: new Date().getFullYear(),
        rating: 7,
        status: 'watched',
        genres: [],
        poster: '',
        review: ''
      }
      this.posterUrl = ''
    },

    toggleGenre(genre) {
      const index = this.formData.genres.indexOf(genre)
      if (index > -1) {
        this.formData.genres.splice(index, 1)
      } else {
        if (this.formData.genres.length < 5) {
          this.formData.genres.push(genre)
        } else {
          this.$emit('error', 'Можно выбрать не больше 5 жанров')
        }
      }
    },

    handleUrlChange() {
      if (this.posterUrl) {
        this.formData.poster = this.posterUrl
      }
    }
  }
}
</script>

<style scoped>
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
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #666;
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

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.type-selector,
.status-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.type-selector button,
.status-selector button,
.genres-selector button {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.type-selector button.active,
.status-selector button.active,
.genres-selector button.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.rating-stars {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.rating-stars button {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.rating-stars button.active {
  background: #FFC107;
  color: white;
  border-color: #FFC107;
}

.rating-value {
  margin-top: 8px;
  font-weight: bold;
}

.genres-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.selected-genres {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-cancel,
.btn-submit {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-submit {
  background: #4CAF50;
  color: white;
}

.hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #888;
}
</style>