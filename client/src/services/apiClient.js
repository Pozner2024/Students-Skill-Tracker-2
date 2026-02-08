/**
 * Централизованный API клиент
 * Устраняет дублирование кода для fetch запросов
 * Автоматически добавляет заголовки авторизации и обрабатывает ошибки
 */

import { API_CONFIG } from "../config/api.js";
import authCore from "./authCore.js";
import errorHandler from "./errorHandler.js";

class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  async readResponseText(response) {
    const buffer = await response.arrayBuffer();
    return new TextDecoder("utf-8").decode(buffer);
  }

  getHeaders(customHeaders = {}, includeAuth = true, body = null) {
    const headers = { ...this.defaultHeaders };

    if (includeAuth) {
      const token = authCore.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    // Если тело запроса - FormData, удаляем Content-Type, чтобы браузер установил multipart/form-data
    if (body instanceof FormData) {
      delete headers["Content-Type"];
    }

    return { ...headers, ...customHeaders };
  }

  buildURL(endpoint, params = {}) {
    const baseOrigin = window.location.origin;
    const url = new URL(`${this.baseURL}${endpoint}`, baseOrigin);

    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.append(key, params[key]);
      }
    });

    return url.toString();
  }

  async handleResponse(response, context = "", handleErrors = true) {
    if (!response.ok) {
      if (handleErrors) {
        await errorHandler.handleApiError(response, context);
      }

      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const contentType = response.headers.get("content-type") || "";
        // Клонируем response для чтения, чтобы не "потреблять" тело
        const clonedResponse = response.clone();
        
        // Сначала читаем как текст, чтобы проверить содержимое
        const responseText = await this.readResponseText(clonedResponse);
        
        // Проверяем, не является ли это multipart данными (даже если Content-Type не указывает на это)
        if (responseText && (responseText.startsWith("------") || responseText.includes("multipart/form-data"))) {
          errorMessage = `Ошибка сервера: получен неверный формат ответа (multipart вместо JSON). Проверьте настройки сервера.`;
        } else if (contentType.includes("multipart/")) {
          errorMessage = `Ошибка сервера: получен неверный формат ответа (multipart вместо JSON)`;
        } else if (contentType.includes("application/json")) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (jsonError) {
            // Если не удалось распарсить как JSON
            errorMessage = responseText.substring(0, 200) || errorMessage;
          }
        } else if (contentType.includes("text/")) {
          errorMessage = responseText.substring(0, 200) || errorMessage;
        } else {
          // Если Content-Type не указан или неизвестен, пробуем распарсить как JSON
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (parseError) {
            // Если не JSON, используем текст
            errorMessage = responseText.substring(0, 200) || errorMessage;
          }
        }
      } catch (e) {
        // Если не удалось прочитать ответ, используем дефолтное сообщение
      }

      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type") || "";

    // Для успешных ответов сначала читаем как текст, чтобы проверить содержимое
    // Это позволяет обнаружить multipart даже если Content-Type не установлен правильно
    let responseText;
    try {
      responseText = await this.readResponseText(response);
    } catch (e) {
      throw new Error("Не удалось прочитать ответ сервера");
    }
    
    // Проверяем, не является ли это multipart данными (даже если Content-Type не указывает на это)
    // Проверяем по началу строки (boundary multipart начинается с -----)
    if (responseText && typeof responseText === 'string' && (responseText.trim().startsWith("------") || responseText.includes("multipart/form-data"))) {
      throw new Error(`Сервер вернул неожиданный формат ответа. Ожидался JSON, получен multipart. Проверьте настройки сервера.`);
    }
    
    // Теперь проверяем Content-Type
    if (contentType.includes("multipart/")) {
      throw new Error(`Сервер вернул неожиданный формат ответа. Ожидался JSON, получен multipart.`);
    } else if (contentType.includes("application/json") || !contentType) {
      // Если Content-Type JSON или не указан, пробуем распарсить как JSON
      try {
        return JSON.parse(responseText);
      } catch (e) {
        // Если не удалось распарсить, проверяем, не multipart ли это
        if (responseText && typeof responseText === 'string' && responseText.trim().startsWith("------")) {
          throw new Error(`Сервер вернул multipart данные вместо JSON.`);
        }
        throw new Error(`Неверный формат ответа сервера: ${responseText.substring(0, 100)}`);
      }
    } else if (contentType.includes("text/")) {
      return responseText;
    } else {
      // Для других типов возвращаем текст
      return responseText;
    }
  }

  async request(endpoint, options = {}) {
    const {
      method = "GET",
      body = null,
      headers: customHeaders = {},
      params = {},
      includeAuth = true,
      handleErrors = true,
      context = endpoint,
      timeout = 30000, // 30 секунд по умолчанию
    } = options;

    try {
      const url = this.buildURL(endpoint, params);

      let requestBody = body;
      if (body && !(body instanceof FormData) && typeof body === "object") {
        requestBody = JSON.stringify(body);
      }

      // Передаем body в getHeaders, чтобы правильно обработать FormData
      const headers = this.getHeaders(customHeaders, includeAuth, body);

      // Создаем контроллер для таймаута
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: requestBody,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return await this.handleResponse(response, context, handleErrors);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          throw new Error(`Превышено время ожидания ответа (${timeout}ms)`);
        }
        throw fetchError;
      }
    } catch (error) {
      if (handleErrors) {
        errorHandler.handle(error, context);
      }
      throw error;
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "GET",
    });
  }

  async post(endpoint, body = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body,
    });
  }

  async put(endpoint, body = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body,
    });
  }

  async patch(endpoint, body = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PATCH",
      body,
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "DELETE",
    });
  }

  async uploadFile(endpoint, formData, options = {}) {
    return this.post(endpoint, formData, {
      ...options,
    });
  }

  async publicRequest(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      includeAuth: false,
    });
  }
}

const apiClient = new ApiClient();

export default apiClient;
