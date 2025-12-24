// Этот код загружает данные теста из API сервера на основе параметров,
// переданных в URL. Используя параметры URL (код теста и вариант теста),
// код обращается к API и, если данные найдены, возвращает их для дальнейшего использования в приложении.

import { API_CONFIG } from "../../config/api.js";
import apiClient from "../../services/apiClient.js";

class TestLoader {
  constructor() {
    this.apiBaseUrl = API_CONFIG.BASE_URL;
    this.testTitle = "";
    this.isInitialized = false;
  }

  static getInstance() {
    if (!TestLoader.instance) {
      TestLoader.instance = new TestLoader();
    }
    return TestLoader.instance;
  }

  resetState() {
    this.isInitialized = false;
    this.dataReceived = false;
  }

  getParamsFromURL() {
    const params = new URLSearchParams(window.location.search);

    const testCode = params.get("testCode");
    const title = params.get("title");

    this.testTitle = title || "Тест";
    const variant = parseInt(params.get("variant")) || 1;

    if (testCode) {
      return { testCode, variant };
    }

    return null;
  }

  async fetchTestData(params) {
    if (!params || !params.testCode) {
      return null;
    }

    const { testCode, variant } = params;
    if (!testCode || isNaN(variant)) {
      return null;
    }

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
          includeAuth: false,
          context: "TestLoader.fetchTestData",
        }
      );

      if (!this.dataReceived) {
        this.dataReceived = true;
      }

      if (testData) {
        let questions = [];
        try {
          if (typeof testData.questions === "string") {
            questions = JSON.parse(testData.questions);
          } else if (typeof testData.questions === "object") {
            questions = testData.questions;
          }

          if (questions.questions && Array.isArray(questions.questions)) {
            questions = questions.questions;
          }
        } catch (error) {
          return null;
        }

        const formattedData = {
          testCode,
          testTitle: testData.testTitle,
          variant: testData.variant,
          questions: questions,
        };

        return {
          data: formattedData,
          topicName: this.testTitle,
        };
      } else {
        return null;
      }
    } catch (error) {
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

