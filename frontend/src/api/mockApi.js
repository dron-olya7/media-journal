// Временные моковые данные для тестирования
export const mockItems = [
  {
    id: 1,
    title: "Интерстеллар",
    type: "movie",
    category: "Фантастика",
    status: "Просмотрено",
    rating: 5,
    notes: "Отличный фильм о путешествиях во времени",
    createdAt: "2024-01-15"
  },
  {
    id: 2,
    title: "Игра Престолов",
    type: "series",
    category: "Фэнтези",
    status: "Смотрю",
    rating: 4,
    notes: "Интересный сериал, но последний сезон разочаровал",
    createdAt: "2024-01-10"
  },
  {
    id: 3,
    title: "1984",
    type: "book",
    category: "Антиутопия",
    status: "Прочитано",
    rating: 5,
    notes: "Классика, актуальна всегда",
    createdAt: "2024-01-05"
  }
];

export const mockApi = {
  // Имитация задержки сети
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Получить все элементы
  async getItems() {
    await this.delay(300);
    return {
      data: mockItems,
      message: "Данные загружены"
    };
  },
  
  // Добавить новый элемент
  async addItem(item) {
    await this.delay(300);
    const newItem = {
      ...item,
      id: Date.now(),
      createdAt: new Date().toISOString().split('T')[0]
    };
    mockItems.unshift(newItem);
    return {
      data: newItem,
      message: "Элемент добавлен"
    };
  },
  
  // Обновить элемент
  async updateItem(id, updates) {
    await this.delay(300);
    const index = mockItems.findIndex(item => item.id === id);
    if (index !== -1) {
      mockItems[index] = { ...mockItems[index], ...updates };
      return {
        data: mockItems[index],
        message: "Элемент обновлен"
      };
    }
    throw new Error("Элемент не найден");
  },
  
  // Удалить элемент
  async deleteItem(id) {
    await this.delay(300);
    const index = mockItems.findIndex(item => item.id === id);
    if (index !== -1) {
      mockItems.splice(index, 1);
      return {
        message: "Элемент удален"
      };
    }
    throw new Error("Элемент не найден");
  }
};