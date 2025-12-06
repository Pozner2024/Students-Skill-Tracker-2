/**
 * Централизованный API клиент
 * Устраняет дублирование кода для fetch запросов
 * Автоматически добавляет заголовки авторизации и обрабатывает ошибки
 */

import { API_CONFIG } from "../config/api.js";
import authService from "./authService.js";
import errorHandler from "./errorHandler.js";

class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  /**
   * Получает заголовки для запроса
   * @param {object} customHeaders - Дополнительные заголовки
   * @param {boolean} includeAuth - Включать ли заголовок авторизации
   * @returns {object} Объект с заголовками
   */
  getHeaders(customHeaders = {}, includeAuth = true) {
    const headers = { ...this.defaultHeaders };

    // Добавляем заголовок авторизации, если нужно
    if (includeAuth) {
      const token = authService.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    // Если передан FormData, не устанавливаем Content-Type
    // Браузер сам установит правильный Content-Type с boundary
    if (customHeaders.body instanceof FormData) {
      delete headers["Content-Type"];
    }

    // Объединяем с пользовательскими заголовками
    return { ...headers, ...customHeaders };
  }

  /**
   * Формирует URL с query параметрами
   * @param {string} endpoint - Endpoint
   * @param {object} params - Query параметры
   * @returns {string} Полный URL
   */
  buildURL(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);

    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.append(key, params[key]);
      }
    });

    return url.toString();
  }

  /**
   * Обрабатывает ответ от сервера
   * @param {Response} response - Response объект
   * @param {string} context - Контекст запроса для логирования
   * @param {boolean} handleErrors - Обрабатывать ли ошибки автоматически
   * @returns {Promise<any>} Распарсенные данные
   */
  async handleResponse(response, context = "", handleErrors = true) {
    // Проверяем статус ответа
    if (!response.ok) {
      if (handleErrors) {
        await errorHandler.handleApiError(response, context);
      }

      // Пытаемся получить сообщение об ошибке
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
      } catch (e) {
        // Игнорируем ошибки парсинга
      }

      throw new Error(errorMessage);
    }

    // Парсим ответ
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else if (contentType && contentType.includes("text/")) {
      return await response.text();
    } else {
      // Для бинарных данных (файлы, изображения)
      return await response.blob();
    }
  }

  /**
   * Базовый метод для выполнения запросов
   * @param {string} endpoint - Endpoint (например, "/users/profile")
   * @param {object} options - Опции запроса
   * @param {string} options.method - HTTP метод (GET, POST, PUT, DELETE и т.д.)
   * @param {object} options.body - Тело запроса (будет сериализовано в JSON, если не FormData)
   * @param {object} options.headers - Дополнительные заголовки
   * @param {object} options.params - Query параметры
   * @param {boolean} options.includeAuth - Включать ли заголовок авторизации (по умолчанию true)
   * @param {boolean} options.handleErrors - Обрабатывать ли ошибки автоматически (по умолчанию true)
   * @param {string} options.context - Контекст для логирования ошибок
   * @returns {Promise<any>} Результат запроса
   */
  async request(endpoint, options = {}) {
    const {
      method = "GET",
      body = null,
      headers: customHeaders = {},
      params = {},
      includeAuth = true,
      handleErrors = true,
      context = endpoint,
    } = options;

    try {
      // Формируем URL
      const url = this.buildURL(endpoint, params);

      // Подготавливаем тело запроса
      let requestBody = body;
      if (body && !(body instanceof FormData) && typeof body === "object") {
        requestBody = JSON.stringify(body);
      }

      // Получаем заголовки
      const headers = this.getHeaders(customHeaders, includeAuth);

      // Выполняем запрос
      const response = await fetch(url, {
        method,
        headers,
        body: requestBody,
      });

      // Обрабатываем ответ
      // Всегда парсим ответ, но обработку ошибок делаем в зависимости от флага
      return await this.handleResponse(response, context, handleErrors);
    } catch (error) {
      // Обрабатываем сетевые ошибки и другие исключения
      if (handleErrors) {
        errorHandler.handle(error, context);
      }
      throw error;
    }
  }

  /**
   * GET запрос
   * @param {string} endpoint - Endpoint
   * @param {object} options - Опции запроса
   * @returns {Promise<any>} Результат запроса
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "GET",
    });
  }

  /**
   * POST запрос
   * @param {string} endpoint - Endpoint
   * @param {object} body - Тело запроса
   * @param {object} options - Опции запроса
   * @returns {Promise<any>} Результат запроса
   */
  async post(endpoint, body = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body,
    });
  }

  /**
   * PUT запрос
   * @param {string} endpoint - Endpoint
   * @param {object} body - Тело запроса
   * @param {object} options - Опции запроса
   * @returns {Promise<any>} Результат запроса
   */
  async put(endpoint, body = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body,
    });
  }

  /**
   * PATCH запрос
   * @param {string} endpoint - Endpoint
   * @param {object} body - Тело запроса
   * @param {object} options - Опции запроса
   * @returns {Promise<any>} Результат запроса
   */
  async patch(endpoint, body = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PATCH",
      body,
    });
  }

  /**
   * DELETE запрос
   * @param {string} endpoint - Endpoint
   * @param {object} options - Опции запроса
   * @returns {Promise<any>} Результат запроса
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "DELETE",
    });
  }

  /**
   * Загрузка файла (POST с FormData)
   * @param {string} endpoint - Endpoint
   * @param {FormData} formData - FormData с файлом
   * @param {object} options - Опции запроса
   * @returns {Promise<any>} Результат запроса
   */
  async uploadFile(endpoint, formData, options = {}) {
    return this.post(endpoint, formData, {
      ...options,
      headers: {
        // Не устанавливаем Content-Type для FormData
        // Браузер сам установит правильный заголовок с boundary
      },
    });
  }

  /**
   * Запрос без авторизации (для публичных endpoints)
   * @param {string} endpoint - Endpoint
   * @param {object} options - Опции запроса
   * @returns {Promise<any>} Результат запроса
   */
  async publicRequest(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      includeAuth: false,
    });
  }
}

// Создаем единственный экземпляр API клиента
const apiClient = new ApiClient();

export default apiClient;

