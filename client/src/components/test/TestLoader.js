// Этот код загружает данные теста из API сервера на основе параметров,
// переданных в URL. Используя параметры URL (код теста и вариант теста),
// код обращается к API и, если данные найдены, возвращает их для дальнейшего использования в приложении.

import { API_CONFIG } from "../../config/api.js";
import apiClient from "../../services/apiClient.js";

class TestLoader {
  constructor() {
    // URL API сервера - можно настроить через переменные окружения
    this.apiBaseUrl = API_CONFIG.BASE_URL;
    this.testTitle = ""; // Свойство для хранения названия теста
    this.isInitialized = false; // Флаг для предотвращения повторной инициализации
  }

  // Паттерн Singleton для предотвращения создания множественных экземпляров
  static getInstance() {
    if (!TestLoader.instance) {
      TestLoader.instance = new TestLoader();
    }
    return TestLoader.instance;
  }

  // Метод для сброса состояния (полезно при перезагрузке данных)
  resetState() {
    this.isInitialized = false;
    this.dataReceived = false;
  }

  getParamsFromURL() {
    const params = new URLSearchParams(window.location.search);

    // Поддержка старого формата (topicId) для обратной совместимости
    const topicId = params.get("topicId");
    const testCode = params.get("testCode");
    const title = params.get("title");

    this.testTitle = title || "Тест";
    const variant = parseInt(params.get("variant")) || 1;

    // Если есть topicId, используем старую логику
    if (topicId) {
      const result = {
        topicId: parseInt(topicId),
        variant,
        useOldFormat: true,
      };
      return result;
    }

    // Если есть testCode, используем новую логику
    if (testCode) {
      const result = { testCode, variant, useOldFormat: false };
      return result;
    }

    // По умолчанию используем старый формат
    const defaultResult = { topicId: 1, variant, useOldFormat: true };
    return defaultResult;
  }

  async fetchTestData(params) {
    const { topicId, testCode, variant, useOldFormat } = params;

    if (useOldFormat) {
      // Старая логика для обратной совместимости
      return await this.fetchOldFormatData(topicId, variant);
    } else {
      // Новая логика для работы с БД
      return await this.fetchNewFormatData(testCode, variant);
    }
  }

  async fetchOldFormatData(topicId, variant) {
    // Здесь можно оставить старую логику или заглушку
    // Пока что возвращаем null, чтобы не ломать существующие страницы
    return null;
  }

  async fetchNewFormatData(testCode, variant) {
    if (!testCode || isNaN(variant)) {
      return null;
    }

    // Логируем только один раз при первом запросе
    if (!this.isInitialized) {
      this.isInitialized = true;
    }

    try {
      const testData = await apiClient.get(
        API_CONFIG.ENDPOINTS.TEST_BY_CODE,
        {
          params: {
            testCode: testCode,
            variant: variant,
          },
          includeAuth: false, // Публичный endpoint
          context: "TestLoader.fetchNewFormatData",
        }
      );

      // Логируем успешное получение данных только один раз
      if (!this.dataReceived) {
        this.dataReceived = true;
      }

      if (testData) {
        // Парсим JSON поле questions
        let questions = [];
        try {
          if (typeof testData.questions === "string") {
            questions = JSON.parse(testData.questions);
          } else if (typeof testData.questions === "object") {
            questions = testData.questions;
          }

          // Если questions содержит объект с массивом questions
          if (questions.questions && Array.isArray(questions.questions)) {
            questions = questions.questions;
          }
        } catch (error) {
          return null;
        }

        // Возвращаем данные в оригинальном формате без преобразования
        const formattedData = {
          testCode, // сохраняем код теста для последующего сохранения результата
          testTitle: testData.testTitle,
          variant: testData.variant,
          questions: questions, // Оставляем вопросы в оригинальном формате
        };

        return {
          data: formattedData,
          topicName: this.testTitle,
        };
      } else {
        return null;
      }
    } catch (error) {
      // Возвращаем объект с пустыми данными вместо null для предотвращения ошибок
      return {
        data: {
          testTitle: "Тест",
          variant: variant,
          questions: [],
        },
        topicName: "Тест",
      };
    }
  }
}

export default TestLoader;

