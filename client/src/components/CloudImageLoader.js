// CloudImageLoader - загружает изображения из Yandex Cloud Object Storage через API
import API_CONFIG from "../config/api.js";

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
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.IMAGES}/${this.topicId}/${this.variant}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, response: ${errorText}`
        );
      }

      const data = await response.json();

      if (data.success && data.images) {
        this.images = data.images;
        this.loaded = true;
      }
    } catch (error) {
      this.images = {};
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

    const imageUrl = this.images[questionNumber] || null;
    return imageUrl;
  }

  // Метод для получения URL изображения синхронно (если уже загружено)
  getImagePathSync(questionNumber) {
    return this.images[questionNumber] || null;
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
