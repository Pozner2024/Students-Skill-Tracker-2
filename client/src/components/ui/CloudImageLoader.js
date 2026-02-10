// CloudImageLoader - загружает изображения из Yandex Cloud Object Storage через API
import API_CONFIG from "../../config/api.js";
import apiClient from "../../services/apiClient.js";
import errorHandler from "../../services/errorHandler.js";

class CloudImageLoader {
  constructor(topicId, variant) {
    this.topicId = topicId;
    this.variant = variant;
    this.maxQuestions = null;
    this.images = {};
    this.loading = false;
    this.loaded = false;
    this.loadingPromise = null;
  }

  setMaxQuestions(maxQuestions) {
    if (!Number.isFinite(maxQuestions) || maxQuestions <= 0) {
      return;
    }
    this.maxQuestions = Math.floor(maxQuestions);
  }

  async loadImages(maxQuestions = null) {
    if (Number.isFinite(maxQuestions) && maxQuestions > 0) {
      this.setMaxQuestions(maxQuestions);
    }

    if (this.loaded) {
      return this.images;
    }

    if (this.loading && this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loading = true;
    this.loadingPromise = (async () => {
      try {
        const endpoint = `${API_CONFIG.ENDPOINTS.IMAGES}/${this.topicId}/${this.variant}`;
        const fullUrl = `${API_CONFIG.BASE_URL}${endpoint}`;

        const params =
          Number.isFinite(this.maxQuestions) && this.maxQuestions > 0
            ? { maxQuestions: this.maxQuestions }
            : {};

        const data = await apiClient.publicRequest(endpoint, {
          method: "GET",
          params,
          context: "CloudImageLoader.loadImages",
          handleErrors: false,
        });

        if (data && data.success && data.images) {
          this.images = data.images;
          this.loaded = true;
        } else if (data && data.images) {
          this.images = data.images;
          this.loaded = true;
        } else {
          this.images = {};
          this.loaded = true;
        }
      } catch (error) {
        errorHandler.log(error, "CloudImageLoader.loadImages");
        this.images = {};
        this.loaded = true;
      } finally {
        this.loading = false;
        this.loadingPromise = null;
      }

      return this.images;
    })();

    return this.loadingPromise;
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
