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

  async loadImages() {
    if (this.loading || this.loaded) {
      return this.images;
    }

    this.loading = true;

    try {
      const endpoint = `${API_CONFIG.ENDPOINTS.IMAGES}/${this.topicId}/${this.variant}`;
      const fullUrl = `${API_CONFIG.BASE_URL}${endpoint}`;
      console.log(`CloudImageLoader: Запрос изображений: ${fullUrl}`);

      const data = await apiClient.publicRequest(endpoint, {
        method: "GET",
        context: "CloudImageLoader.loadImages",
        handleErrors: false,
      });

      console.log(`CloudImageLoader: Получен ответ от сервера:`, data);

      if (data && data.success && data.images) {
        this.images = data.images;
        this.loaded = true;
        console.log(
          `CloudImageLoader: Загружено ${
            Object.keys(this.images).length
          } изображений для темы ${this.topicId}, вариант ${this.variant}`
        );
        console.log(
          `CloudImageLoader: Ключи изображений:`,
          Object.keys(this.images)
        );
      } else if (data && data.images) {
        this.images = data.images;
        this.loaded = true;
        console.log(
          `CloudImageLoader: Загружено ${
            Object.keys(this.images).length
          } изображений (без success флага)`
        );
        console.log(
          `CloudImageLoader: Ключи изображений:`,
          Object.keys(this.images)
        );
      } else {
        console.warn(
          `CloudImageLoader: Нет изображений для темы ${this.topicId}, вариант ${this.variant}`
        );
        console.warn(`CloudImageLoader: Полученные данные:`, data);
        this.images = {};
        this.loaded = true;
      }
    } catch (error) {
      console.error(
        `CloudImageLoader: Ошибка при загрузке изображений для темы ${this.topicId}, вариант ${this.variant}:`,
        error
      );
      console.error(`CloudImageLoader: Детали ошибки:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      errorHandler.log(error, "CloudImageLoader.loadImages");
      this.images = {};
      this.loaded = true;
    } finally {
      this.loading = false;
    }

    return this.images;
  }

  async getImagePath(questionNumber) {
    // Если загрузка еще не началась, запускаем её
    if (!this.loaded && !this.loading) {
      await this.loadImages();
    }
    // Если загрузка уже идет, ждем её завершения
    else if (this.loading) {
      // Ждем завершения загрузки (максимум 10 секунд)
      const maxWait = 10000;
      const startTime = Date.now();
      while (this.loading && (Date.now() - startTime) < maxWait) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    const imageUrl =
      this.images[questionNumber] ||
      this.images[String(questionNumber)] ||
      this.images[Number(questionNumber)] ||
      null;

    if (!imageUrl && Object.keys(this.images).length > 0) {
      console.warn(
        `CloudImageLoader: Изображение для вопроса ${questionNumber} не найдено. Доступные номера:`,
        Object.keys(this.images)
      );
    }

    return imageUrl;
  }

  getImagePathSync(questionNumber) {
    return (
      this.images[questionNumber] ||
      this.images[String(questionNumber)] ||
      this.images[Number(questionNumber)] ||
      null
    );
  }

  isLoaded() {
    return this.loaded;
  }
  getAllImages() {
    return this.images;
  }

  getLoadedImagesCount() {
    return Object.keys(this.images).length;
  }
  hasImage(questionNumber) {
    return this.images.hasOwnProperty(questionNumber);
  }
}

export default CloudImageLoader;
