// CloudImageLoader - загружает изображения из Yandex Cloud Object Storage через API
import API_CONFIG from "../../config/api.js";
import apiClient from "../../services/apiClient.js";
import errorHandler from "../../services/errorHandler.js";

class CloudImageLoader {
  constructor(topicId, variant) {
    this.topicId = topicId;
    this.variant = variant;
    this.images = {};
    this.loading = false;
    this.loaded = false;
  }

  // Метод для загрузки всех изображений для темы и варианта
  async loadImages() {
    if (this.loading || this.loaded) {
      return this.images;
    }

    this.loading = true;

    try {
      const endpoint = `${API_CONFIG.ENDPOINTS.IMAGES}/${this.topicId}/${this.variant}`;
      const fullUrl = `${API_CONFIG.BASE_URL}${endpoint}`;
      console.log(`CloudImageLoader: Запрос изображений: ${fullUrl}`);
      
      const data = await apiClient.publicRequest(
        endpoint,
        {
          method: "GET",
          context: "CloudImageLoader.loadImages",
          handleErrors: false, // Обрабатываем ошибки вручную
        }
      );

      console.log(`CloudImageLoader: Получен ответ от сервера:`, data);

      // Проверяем формат ответа от сервера
      if (data && data.success && data.images) {
        this.images = data.images;
        this.loaded = true;
        console.log(`CloudImageLoader: Загружено ${Object.keys(this.images).length} изображений для темы ${this.topicId}, вариант ${this.variant}`);
        console.log(`CloudImageLoader: Ключи изображений:`, Object.keys(this.images));
      } else if (data && data.images) {
        // Если success отсутствует, но images есть (на случай изменения формата API)
        this.images = data.images;
        this.loaded = true;
        console.log(`CloudImageLoader: Загружено ${Object.keys(this.images).length} изображений (без success флага)`);
        console.log(`CloudImageLoader: Ключи изображений:`, Object.keys(this.images));
      } else {
        console.warn(`CloudImageLoader: Нет изображений для темы ${this.topicId}, вариант ${this.variant}`);
        console.warn(`CloudImageLoader: Полученные данные:`, data);
        this.images = {};
        this.loaded = true; // Помечаем как загруженное, чтобы не повторять запрос
      }
    } catch (error) {
      console.error(`CloudImageLoader: Ошибка при загрузке изображений для темы ${this.topicId}, вариант ${this.variant}:`, error);
      console.error(`CloudImageLoader: Детали ошибки:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      errorHandler.log(error, "CloudImageLoader.loadImages");
      this.images = {};
      this.loaded = true; // Помечаем как загруженное, чтобы не повторять запрос при ошибке
    } finally {
      this.loading = false;
    }

    return this.images;
  }

  // Метод для получения URL изображения по номеру вопроса
  async getImagePath(questionNumber) {
    // Если изображения еще не загружены, загружаем их
    if (!this.loaded && !this.loading) {
      await this.loadImages();
    }

    // Пробуем найти изображение по номеру вопроса
    // Номера могут быть как строками, так и числами
    const imageUrl = this.images[questionNumber] || 
                     this.images[String(questionNumber)] || 
                     this.images[Number(questionNumber)] || 
                     null;
    
    if (!imageUrl && Object.keys(this.images).length > 0) {
      console.warn(`CloudImageLoader: Изображение для вопроса ${questionNumber} не найдено. Доступные номера:`, Object.keys(this.images));
    }
    
    return imageUrl;
  }

  // Метод для получения URL изображения синхронно (если уже загружено)
  getImagePathSync(questionNumber) {
    // Пробуем найти изображение по номеру вопроса
    // Номера могут быть как строками, так и числами
    return this.images[questionNumber] || 
           this.images[String(questionNumber)] || 
           this.images[Number(questionNumber)] || 
           null;
  }

  // Метод для проверки, загружены ли изображения
  isLoaded() {
    return this.loaded;
  }

  // Метод для получения всех загруженных изображений
  getAllImages() {
    return this.images;
  }

  // Метод для получения количества загруженных изображений
  getLoadedImagesCount() {
    return Object.keys(this.images).length;
  }

  // Метод для проверки, загружено ли конкретное изображение
  hasImage(questionNumber) {
    return this.images.hasOwnProperty(questionNumber);
  }
}

export default CloudImageLoader;

