<template>
  <div class="home">
    <header class="header">
      <h1>🎬 MediaJournal</h1>
      <p class="subtitle">Твой личный трекер фильмов, книг и сериалов</p>
    </header>

    <div class="collection">
      <!-- Панель управления сортировкой и фильтрацией -->
      <div class="controls-panel">
        <h2>Моя коллекция ({{ filteredItems.length }}/{{ items.length }})</h2>

        <div class="filters">
          <!-- Поиск -->
          <div class="search-box">
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Поиск по названию..."
              class="search-input"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="clear-search"
            >
              ✕
            </button>
          </div>

          <!-- Фильтры -->
          <div class="filter-group">
            <label>Тип:</label>
            <div class="filter-buttons">
              <button
                v-for="type in filterTypes"
                :key="type.value"
                :class="{ active: filters.type === type.value }"
                @click="toggleFilter('type', type.value)"
              >
                {{ type.icon }} {{ type.label }}
              </button>
              <button
                :class="{ active: filters.type === 'all' }"
                @click="toggleFilter('type', 'all')"
              >
                Все
              </button>
            </div>
          </div>

          <div class="filter-group">
            <label>Статус:</label>
            <div class="filter-buttons">
              <button
                v-for="status in filterStatuses"
                :key="status.value"
                :class="{ active: filters.status === status.value }"
                @click="toggleFilter('status', status.value)"
              >
                {{ status.label }}
              </button>
              <button
                :class="{ active: filters.status === 'all' }"
                @click="toggleFilter('status', 'all')"
              >
                Все
              </button>
            </div>
          </div>

          <!-- Сортировка -->
          <div class="sort-group">
            <label>Сортировка:</label>
            <select v-model="sortBy" class="sort-select">
              <option value="date_added">По дате добавления (новые)</option>
              <option value="date_added_asc">
                По дате добавления (старые)
              </option>
              <option value="title">По названию (А-Я)</option>
              <option value="title_desc">По названию (Я-А)</option>
              <option value="year">По году (новые)</option>
              <option value="year_asc">По году (старые)</option>
              <option value="rating">По рейтингу (высокий)</option>
              <option value="rating_asc">По рейтингу (низкий)</option>
            </select>

            <button
              @click="toggleSortOrder"
              class="sort-order-btn"
              :title="sortAscending ? 'По возрастанию' : 'По убыванию'"
            >
              {{ sortAscending ? "⇧" : "⇩" }}
            </button>
          </div>

          <!-- Сброс фильтров -->
          <button
            @click="resetFilters"
            class="reset-filters-btn"
            v-if="hasActiveFilters"
          >
            Сбросить фильтры
          </button>
        </div>

        <!-- Активные фильтры -->
        <div class="active-filters" v-if="hasActiveFilters">
          <span class="active-filters-label">Активные фильтры:</span>
          <span v-if="filters.type !== 'all'" class="filter-tag">
            {{ getFilterTypeLabel(filters.type) }}
            <button @click="toggleFilter('type', 'all')">×</button>
          </span>
          <span v-if="filters.status !== 'all'" class="filter-tag">
            {{ getFilterStatusLabel(filters.status) }}
            <button @click="toggleFilter('status', 'all')">×</button>
          </span>
          <span v-if="searchQuery" class="filter-tag">
            Поиск: "{{ searchQuery }}"
            <button @click="searchQuery = ''">×</button>
          </span>
        </div>
      </div>

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

      <!-- Нет результатов -->
      <div v-else-if="filteredItems.length === 0" class="no-results">
        <div class="no-results-icon"></div>
        <h3>Ничего не найдено</h3>
        <p>Попробуйте изменить параметры поиска или фильтры</p>
        <button class="btn-reset-filters" @click="resetFilters">
          Сбросить фильтры
        </button>
      </div>

      <!-- Карточки -->
      <div v-else class="cards-grid">
        <MediaCard
          v-for="item in paginatedItems"
          :key="item.id"
          :item="item"
          @edit="editMedia"
          @delete="showDeleteConfirmation"
        />
      </div>

      <!-- Пагинация -->
      <div class="pagination" v-if="filteredItems.length > itemsPerPage">
        <button
          @click="prevPage"
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          ◀
        </button>

        <span class="page-info">
          Страница {{ currentPage }} из {{ totalPages }}
        </span>

        <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          ▶
        </button>

        <select v-model="itemsPerPage" class="page-size-select">
          <option value="10">10 на странице</option>
          <option value="20">20 на странице</option>
          <option value="50">50 на странице</option>
          <option value="100">100 на странице</option>
        </select>
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
      icon=""
      confirmText="Удалить"
      cancelText="Отмена"
      danger
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- Кнопка добавления -->
    <button
      class="add-btn"
      @click="showAddForm = true"
      title="Добавить новую запись"
    >
      +
    </button>
  </div>
</template>

<script>
import MediaCard from "@/components/media/MediaCard.vue";
import AddMediaForm from "@/components/media/AddMediaForm.vue";
import NotificationPopup from "@/components/NotificationPopup.vue";
import ConfirmationPopup from "@/components/ConfirmationPopup.vue";
import api from "@/api/auth";

export default {
  name: "HomeView",
  components: {
    MediaCard,
    AddMediaForm,
    NotificationPopup,
    ConfirmationPopup,
  },
  data() {
    return {
      loading: false,
      items: [],
      showAddForm: false,
      editingItem: null,
      isConnected: true,

      // Фильтры и сортировка
      searchQuery: "",
      filters: {
        type: "all",
        status: "all",
      },
      sortBy: "date_added",
      sortAscending: false,

      // Пагинация
      currentPage: 1,
      itemsPerPage: 20,

      // Данные для фильтров
      filterTypes: [
        { value: "movie", label: "Фильмы", icon: "" },
        { value: "book", label: "Книги", icon: "" },
        { value: "series", label: "Сериалы", icon: "" },
      ],
      filterStatuses: [
        { value: "watched", label: "Просмотрено" },
        { value: "reading", label: "Читаю" },
        { value: "planned", label: "В планах" },
        { value: "completed", label: "Прочитано" },
      ],

      stats: {
        total: 0,
        movies: 0,
        books: 0,
        series: 0,
      },

      notification: {
        visible: false,
        type: "success",
        title: "",
        message: "",
      },

      showDeleteConfirm: false,
      itemToDelete: null,
      deleteConfirmDetails: null,
    };
  },

  computed: {
    deleteConfirmMessage() {
      return "Вы уверены, что хотите удалить эту запись?";
    },

    isAuthenticated() {
      return api.isAuthenticated();
    },

    // Отфильтрованные элементы
    filteredItems() {
      return this.items.filter((item) => {
        // Поиск по названию
        if (
          this.searchQuery &&
          !item.title.toLowerCase().includes(this.searchQuery.toLowerCase())
        ) {
          return false;
        }

        // Фильтр по типу
        if (this.filters.type !== "all" && item.type !== this.filters.type) {
          return false;
        }

        // Фильтр по статусу
        if (
          this.filters.status !== "all" &&
          item.status !== this.filters.status
        ) {
          return false;
        }

        return true;
      });
    },

    // Отсортированные элементы
    sortedItems() {
      const items = [...this.filteredItems];

      switch (this.sortBy) {
        case "date_added":
          return items.sort((a, b) => {
            const dateA = new Date(a.date_added || 0);
            const dateB = new Date(b.date_added || 0);
            return this.sortAscending ? dateA - dateB : dateB - dateA;
          });

        case "date_added_asc":
          return items.sort((a, b) => {
            const dateA = new Date(a.date_added || 0);
            const dateB = new Date(b.date_added || 0);
            return dateA - dateB;
          });

        case "title":
          return items.sort((a, b) => {
            const titleA = a.title.toLowerCase();
            const titleB = b.title.toLowerCase();
            return this.sortAscending
              ? titleB.localeCompare(titleA)
              : titleA.localeCompare(titleB);
          });

        case "title_desc":
          return items.sort((a, b) => {
            const titleA = a.title.toLowerCase();
            const titleB = b.title.toLowerCase();
            return titleB.localeCompare(titleA);
          });

        case "year":
          return items.sort((a, b) => {
            const yearA = a.year || 0;
            const yearB = b.year || 0;
            return this.sortAscending ? yearA - yearB : yearB - yearA;
          });

        case "year_asc":
          return items.sort((a, b) => {
            const yearA = a.year || 0;
            const yearB = b.year || 0;
            return yearA - yearB;
          });

        case "rating":
          return items.sort((a, b) => {
            const ratingA = a.rating || 0;
            const ratingB = b.rating || 0;
            return this.sortAscending ? ratingA - ratingB : ratingB - ratingA;
          });

        case "rating_asc":
          return items.sort((a, b) => {
            const ratingA = a.rating || 0;
            const ratingB = b.rating || 0;
            return ratingA - ratingB;
          });

        default:
          return items;
      }
    },

    // Пагинированные элементы
    paginatedItems() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.sortedItems.slice(start, end);
    },

    // Пагинация
    totalPages() {
      return Math.ceil(this.filteredItems.length / this.itemsPerPage);
    },

    // Есть ли активные фильтры
    hasActiveFilters() {
      return (
        this.searchQuery ||
        this.filters.type !== "all" ||
        this.filters.status !== "all"
      );
    },
  },

  watch: {
    searchQuery() {
      this.currentPage = 1;
    },
    filters: {
      handler() {
        this.currentPage = 1;
      },
      deep: true,
    },
    itemsPerPage() {
      this.currentPage = 1;
    },
  },

  async created() {
    await this.checkConnection();
    if (this.isConnected) {
      await this.loadData();
    }
  },

  methods: {
    async checkConnection() {
      try {
        this.isConnected = await api.checkHealth();
        if (!this.isConnected) {
          this.showNotification(
            "error",
            "Ошибка соединения",
            "Не удалось подключиться к серверу",
          );
        }
      } catch (error) {
        this.isConnected = false;
        this.showNotification(
          "error",
          "Ошибка соединения",
          "Не удалось подключиться к серверу",
        );
      }
    },

    async loadData() {
      this.loading = true;
      try {
        // console.log("Загрузка данных...");
        this.items = await api.getItems();

        // Проверьте первые записи
        if (this.items.length > 0) {
          // console.log("Первая запись:", this.items[0]);
          // console.log("ID первой записи:", this.items[0].id);
        }

        await this.loadStats();
      } catch (error) {
        console.error("❌ Ошибка загрузки:", error);
      } finally {
        this.loading = false;
      }
    },

    async loadStats() {
      try {
        const data = await api.getStats();
        this.stats = {
          total: data.total || 0,
          movies: data.movies || 0,
          books: data.books || 0,
          series: data.series || 0,
        };
      } catch (error) {
        console.error("Ошибка статистики:", error);
      }
    },

    async addNewMedia(newMedia) {
      try {
        // console.log("Добавление новой записи:", newMedia);

        // Проверяем обязательные поля
        if (!newMedia.title || newMedia.title.trim() === "") {
          this.showNotification(
            "error",
            "Ошибка валидации",
            "Название обязательно для заполнения",
          );
          return;
        }

        const addedItem = await api.addItem(newMedia);
        // console.log("Запись добавлена:", addedItem);

        await this.loadData();

        this.showNotification(
          "success",
          "Успешно!",
          `"${newMedia.title}" добавлен в вашу коллекцию`,
        );

        this.showAddForm = false;
      } catch (error) {
        console.error("Ошибка добавления:", error);

        if (
          error.message?.includes("Сессия истекла") ||
          error.message?.includes("401") ||
          error.error?.includes("токен")
        ) {
          this.showNotification(
            "warning",
            "Сессия истекла",
            "Пожалуйста, войдите снова",
          );
          setTimeout(() => {
            this.logout();
          }, 2000);
          return;
        }

        this.showNotification(
          "error",
          "Ошибка",
          error.message || "Не удалось сохранить запись",
        );
      }
    },

    editMedia(item) {
      // console.log("Редактирование записи:", item);
      // console.log("ID записи:", item.id);
      // console.log("Все данные:", JSON.parse(JSON.stringify(item))); // убираем Proxy

      // Копируем данные, убедившись что ID есть
      const itemCopy = {
        ...item,
        id: item.id || "",
      };

      this.editingItem = itemCopy;
    },

    async updateMedia(updatedData) {
      // ОСТАНОВИТЬ если это событие
      if (updatedData instanceof Event || updatedData.type === "submit") {
        console.error("❌ Получен SubmitEvent вместо данных");
        return;
      }

      try {
        // console.log("Данные для обновления:", updatedData);

        // Получаем ID из editingItem если его нет в updatedData
        const itemId =
          updatedData.id || (this.editingItem && this.editingItem.id);

        if (!itemId) {
          console.error("❌ Нет ID для обновления");
          this.showNotification(
            "error",
            "Ошибка",
            "Не удалось определить ID записи",
          );
          return;
        }

        // Готовим данные для отправки
        const dataToSend = {
          title: updatedData.title?.trim() || "",
          type: updatedData.type || "movie",
          year: updatedData.year || null,
          rating: updatedData.rating || 0,
          status: updatedData.status || "planned",
          genres: updatedData.genres || [],
          poster: updatedData.poster || "",
          review: updatedData.review || "",
        };

        // console.log("Отправка на сервер ID:", itemId);
        // console.log("Данные:", dataToSend);

        const response = await api.updateItem(itemId, dataToSend);

        // console.log("Ответ сервера:", response);

        await this.loadData();

        this.showNotification(
          "success",
          "Обновлено!",
          `"${dataToSend.title}" обновлен`,
        );

        this.cancelEdit();
      } catch (error) {
        console.error("Ошибка обновления:", error);
        this.showNotification(
          "error",
          "Ошибка",
          error.message || "Не удалось обновить запись",
        );
      }
    },

    cancelEdit() {
      this.editingItem = null;
    },

    // Фильтрация и сортировка
    toggleFilter(filterName, value) {
      this.filters[filterName] =
        this.filters[filterName] === value ? "all" : value;
    },

    toggleSortOrder() {
      this.sortAscending = !this.sortAscending;
    },

    resetFilters() {
      this.searchQuery = "";
      this.filters = {
        type: "all",
        status: "all",
      };
      this.sortBy = "date_added";
      this.sortAscending = false;
      this.currentPage = 1;
    },

    getFilterTypeLabel(type) {
      const found = this.filterTypes.find((t) => t.value === type);
      return found ? `${found.icon} ${found.label}` : type;
    },

    getFilterStatusLabel(status) {
      const found = this.filterStatuses.find((s) => s.value === status);
      return found ? found.label : status;
    },

    // Пагинация
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },

    showDeleteConfirmation(item) {
      this.itemToDelete = item.id;
      this.deleteConfirmDetails = {
        label: "Запись",
        value: item.title,
      };
      this.showDeleteConfirm = true;
    },

    async confirmDelete() {
      const item = this.items.find((item) => item.id === this.itemToDelete);
      if (item) {
        try {
          // console.log("Удаление записи:", item.title);
          await api.deleteItem(this.itemToDelete);
          // console.log("Запись удалена");

          await this.loadData();
          this.showNotification(
            "success",
            "Удалено!",
            `"${item.title}" удален из вашей коллекции`,
          );
        } catch (error) {
          console.error("Ошибка удаления:", error);

          if (
            error.message?.includes("Сессия истекла") ||
            error.message?.includes("401") ||
            error.error?.includes("токен")
          ) {
            this.showNotification(
              "warning",
              "Сессия истекла",
              "Пожалуйста, войдите снова",
            );
            setTimeout(() => {
              this.logout();
            }, 2000);
            return;
          }

          this.showNotification(
            "error",
            "Ошибка",
            error.message || "Не удалось удалить запись",
          );
        }
      }
      this.cancelDelete();
    },

    cancelDelete() {
      this.showDeleteConfirm = false;
      this.itemToDelete = null;
      this.deleteConfirmDetails = null;
    },

    async exportData() {
      try {
        const items = await api.getItems();

        const data = {
          version: "1.0",
          exportedAt: new Date().toISOString(),
          totalItems: items.length,
          items: items,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `media-journal-backup-${new Date().toISOString().split("T")[0]}.json`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.showNotification(
          "success",
          "Экспорт",
          `Данные экспортированы (${items.length} записей)`,
        );
      } catch (error) {
        console.error("Ошибка экспорта:", error);
        this.showNotification(
          "error",
          "Ошибка",
          "Не удалось экспортировать данные",
        );
      }
    },

    async logout() {
      try {
        // Подтверждение выхода
        if (!confirm("Вы уверены, что хотите выйти из аккаунта?")) {
          return;
        }

        // console.log("Выход из аккаунта...");

        // Отправляем запрос на сервер
        await api.logout();

        // console.log("Успешный выход");

        // Показываем уведомление
        this.showNotification(
          "success",
          "До свидания!",
          "Вы успешно вышли из системы",
        );

        // Задержка перед переходом
        setTimeout(() => {
          this.$router.push("/login");
        }, 1500);
      } catch (error) {
        console.error("Ошибка при выходе:", error);

        // Все равно очищаем локальные данные
        api.clearTokens();

        // Перенаправляем на логин
        this.$router.push("/login");
      }
    },

    handleFormError(errorMessage) {
      this.showNotification("error", "Ошибка формы", errorMessage);
    },

    showNotification(type, title, message) {
      this.notification = {
        visible: true,
        type,
        title,
        message,
      };

      if (type === "success" || type === "info") {
        setTimeout(() => {
          this.hideNotification();
        }, 5000);
      }
    },

    hideNotification() {
      this.notification.visible = false;
    },
  },
};
</script>

<style scoped>
/* Стили остаются такими же как в вашем исходном коде */
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px 80px 20px;
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

.db-btn.reload:hover:not(:disabled) {
  background: #5a6268;
}

.db-btn.export {
  background: #28a745;
  color: white;
}

.db-btn.export:hover:not(:disabled) {
  background: #218838;
}

.db-btn.stats {
  background: #ffc107;
  color: #212529;
}

.db-btn.stats:hover:not(:disabled) {
  background: #e0a800;
}

.db-btn.logout {
  background: #dc3545;
  color: white;
}

.db-btn.logout:hover:not(:disabled) {
  background: #c82333;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.db-stat.connected {
  color: #28a745;
}

.db-stat.disconnected {
  color: #dc3545;
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
  to {
    transform: rotate(360deg);
  }
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

/* Стили для фильтров и сортировки */
.controls-panel {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.search-box {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.clear-search {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  font-size: 20px;
}

.filter-group,
.sort-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-group label,
.sort-group label {
  font-weight: 500;
  min-width: 60px;
}

.filter-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.filter-buttons button {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-buttons button:hover{
    background: #e5e5e5;
}

.filter-buttons button.active {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.sort-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.sort-select:hover{
  background: #e5e5e5;
}

.sort-order-btn {
  padding: 0px 10px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 23px;
  height: 35px;
}

.sort-order-btn:hover{
  background: #e5e5e5;
}

.reset-filters-btn {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  align-self: flex-start;
}

.active-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ddd;
}

.active-filters-label {
  font-weight: 500;
}

.filter-tag {
  background: #e3f2fd;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.filter-tag button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
}

.no-results-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.no-results h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #495057;
}

.no-results p {
  color: #6c757d;
  margin-bottom: 25px;
}

.btn-reset-filters {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.pagination-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.page-size-select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}
</style>
