<template>
  <div class="modal-overlay" v-if="show" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ editMode ? "✏️ Редактировать" : "Добавить в коллекцию" }}</h2>
        <button class="close-btn" @click="close">×</button>
      </div>

      <form @submit.prevent="submitForm" class="form">
        <!-- Тип медиа -->
        <div class="form-group">
          <label>Что {{ editMode ? "редактируем" : "добавляем" }}?</label>
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
        <div class="form-group required">
          <label for="title">Название *</label>
          <input
            type="text"
            id="title"
            v-model="formData.title"
            placeholder="Например: Интерстеллар"
            required
            @input="validateTitle"
            :class="{ 'error-border': titleError }"
          />
          <small v-if="titleError" class="error-text">{{ titleError }}</small>
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
            :max="currentYear"
            @input="validateYear"
            :class="{ 'error-border': yearError }"
          />
          <small v-if="yearError" class="error-text">{{ yearError }}</small>
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
            Выбрано: {{ formData.genres.join(", ") }}
          </div>
          <small v-if="genresError" class="error-text">{{ genresError }}</small>
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
            :class="{ 'error-border': urlError }"
          />
          <small class="hint">Можно оставить пустым</small>
          <small v-if="urlError" class="error-text">{{ urlError }}</small>
        </div>

        <!-- Отзыв -->
        <div class="form-group">
          <label for="review">Твои впечатления</label>
          <textarea
            id="review"
            v-model="formData.review"
            placeholder="Что понравилось, что нет..."
            rows="3"
            maxlength="500"
          ></textarea>
          <small class="hint">{{ formData.review.length }}/500 символов</small>
        </div>

        <!-- Кнопки -->
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="close">
            Отмена
          </button>
          <button type="submit" class="btn-submit" :disabled="!isFormValid">
            {{ editMode ? "💾 Обновить" : "💾 Сохранить" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: "AddMediaForm",
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    editMode: {
      type: Boolean,
      default: false,
    },
    initialData: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      formData: {
        type: "movie",
        title: "",
        year: new Date().getFullYear(),
        rating: 7,
        status: "watched",
        genres: [],
        poster: "",
        review: "",
      },
      posterUrl: "",

      // Ошибки валидации
      titleError: "",
      yearError: "",
      genresError: "",
      urlError: "",

      currentYear: new Date().getFullYear(),

      types: [
        { value: "movie", label: "Фильм", icon: "🎬" },
        { value: "book", label: "Книга", icon: "📚" },
        { value: "series", label: "Сериал", icon: "📺" },
      ],
      statuses: [
        { value: "watched", label: "Просмотрено" },
        { value: "reading", label: "Читаю" },
        { value: "planned", label: "В планах" },
        { value: "completed", label: "Прочитано" },
      ],
      popularGenres: [
        "фантастика",
        "драма",
        "комедия",
        "боевик",
        "триллер",
        "романтика",
        "ужасы",
        "детектив",
        "фэнтези",
        "аниме",
        "биография",
        "история",
        "документальный",
        "мультфильм",
        "антиутопия",
        "классика",
        "научная литература",
        "поэзия",
      ],
    };
  },
  computed: {
    isFormValid() {
      // Проверяем, что нет ошибок и обязательные поля заполнены
      const hasNoErrors =
        !this.titleError &&
        !this.yearError &&
        !this.genresError &&
        !this.urlError;
      const hasRequiredFields =
        this.formData.title.trim() !== "" && this.formData.type !== "";

      return hasNoErrors && hasRequiredFields;
    },
  },
  watch: {
    initialData: {
      handler(newData) {
        if (newData) {
          // console.log("Получены данные для редактирования:", newData);
          // console.log("ID в initialData:", newData.id);

          this.formData = {
            type: newData.type || "movie",
            title: newData.title || "",
            year: newData.year || new Date().getFullYear(),
            rating: newData.rating || 7,
            status: newData.status || "watched",
            genres: newData.genres || [],
            poster: newData.poster || "",
            review: newData.review || "",
          };
          this.posterUrl = newData.poster || "";

          // ВАЖНО: Сохраняем ID отдельно
          this.editingId = newData.id || "";
        }
      },
      immediate: true,
      deep: true,
    },
  },
  methods: {
    close() {
      this.$emit("close");
      this.resetForm();
    },

    submitForm() {
      // ОСТАНОВИТЬ событие по умолчанию
      event?.preventDefault?.();

      // Валидация формы
      if (!this.validateForm()) {
        return;
      }

      if (this.posterUrl) {
        this.formData.poster = this.posterUrl;
      }

      // Готовим данные для отправки
      const dataToSend = {
        ...this.formData,
      };

      // ВАЖНО: Добавляем ID если редактируем
      if (this.editMode && this.initialData && this.initialData.id) {
        dataToSend.id = this.initialData.id;
      }

      // console.log("Данные из формы:", dataToSend);
      // console.log("ID в данных:", dataToSend.id);
      // console.log("initialData:", this.initialData);

      // Эмитим данные
      this.$emit("submit", dataToSend);

      if (!this.editMode) {
        this.resetForm();
      }
    },

    validateForm() {
      // Вызываем все методы валидации
      this.validateTitle();
      this.validateYear();
      this.validateGenres();
      this.validateUrl();

      // Проверяем обязательные поля
      if (!this.formData.title || this.formData.title.trim() === "") {
        this.titleError = "Название обязательно для заполнения";
        return false;
      }

      if (!this.formData.type) {
        this.$emit("error", "Тип медиа обязателен");
        return false;
      }

      // Проверяем наличие ошибок валидации
      if (
        this.titleError ||
        this.yearError ||
        this.genresError ||
        this.urlError
      ) {
        return false;
      }

      return true;
    },

    validateTitle() {
      const title = this.formData.title.trim();
      if (!title) {
        this.titleError = "Название обязательно";
        return false;
      } else if (title.length > 200) {
        this.titleError = "Слишком длинное название (макс. 200 символов)";
        return false;
      } else {
        this.titleError = "";
        return true;
      }
    },

    validateYear() {
      const year = this.formData.year;
      if (!year || year === "") {
        this.yearError = "";
        return true;
      }

      const yearNum = parseInt(year);
      if (isNaN(yearNum)) {
        this.yearError = "Введите корректный год";
        return false;
      }

      if (yearNum < 1900) {
        this.yearError = "Год не может быть меньше 1900";
        return false;
      } else if (yearNum > this.currentYear) {
        this.yearError = `Год не может быть больше ${this.currentYear}`;
        return false;
      } else {
        this.yearError = "";
        return true;
      }
    },

    validateGenres() {
      if (this.formData.genres.length > 5) {
        this.genresError = "Можно выбрать не более 5 жанров";
        return false;
      } else {
        this.genresError = "";
        return true;
      }
    },

    validateUrl() {
      const url = this.posterUrl;
      if (!url || url.trim() === "") {
        this.urlError = "";
        return true;
      }

      try {
        // Проверяем, что это валидный URL
        const urlObj = new URL(url);

        // Проверяем протокол (должен быть http или https)
        if (!["http:", "https:"].includes(urlObj.protocol)) {
          this.urlError = "URL должен начинаться с http:// или https://";
          return false;
        }

        this.urlError = "";
        return true;
      } catch (error) {
        this.urlError = "Некорректный URL";
        return false;
      }
    },

    resetForm() {
      this.formData = {
        type: "movie",
        title: "",
        year: new Date().getFullYear(),
        rating: 7,
        status: "watched",
        genres: [],
        poster: "",
        review: "",
      };
      this.posterUrl = "";
      this.titleError = "";
      this.yearError = "";
      this.genresError = "";
      this.urlError = "";
    },

    toggleGenre(genre) {
      const index = this.formData.genres.indexOf(genre);
      if (index > -1) {
        this.formData.genres.splice(index, 1);
      } else {
        if (this.formData.genres.length < 5) {
          this.formData.genres.push(genre);
        } else {
          this.genresError = "Можно выбрать не больше 5 жанров";
          // Убираем сообщение через 3 секунды
          setTimeout(() => {
            if (this.genresError === "Можно выбрать не больше 5 жанров") {
              this.genresError = "";
            }
          }, 3000);
        }
      }
      this.validateGenres();
    },

    handleUrlChange() {
      this.validateUrl();
      // Обновляем поле poster только если URL валидный
      if (this.posterUrl && !this.urlError) {
        this.formData.poster = this.posterUrl;
      }
    },

    showError(message) {
      // Эмитим ошибку родительскому компоненту
      this.$emit("error", message);

      // Показываем уведомление в форме
      this.titleError = message;
    },
  },
};
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
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
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

.form-group.required label::after {
  content: " *";
  color: #f44336;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4caf50;
}

.form-group input.error-border,
.form-group textarea.error-border {
  border-color: #f44336;
  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.1);
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
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.type-selector button:hover,
.status-selector button:hover,
.genres-selector button:hover {
  border-color: #4caf50;
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
  transition: all 0.2s;
}

.rating-stars button.active {
  background: #ffc107;
  color: white;
  border-color: #ffc107;
}

.rating-stars button:hover {
  border-color: #ffc107;
}

.rating-value {
  margin-top: 8px;
  font-weight: bold;
  color: #333;
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
  transition: all 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-submit {
  background: #4caf50;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #45a049;
}

.btn-submit:disabled {
  background: #cccccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #888;
}

.error-text {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #f44336;
}
</style>
