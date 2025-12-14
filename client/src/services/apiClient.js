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

  getHeaders(customHeaders = {}, includeAuth = true) {
    const headers = { ...this.defaultHeaders };

    if (includeAuth) {
      const token = authService.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    if (customHeaders.body instanceof FormData) {
      delete headers["Content-Type"];
    }

    return { ...headers, ...customHeaders };
  }

  buildURL(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);

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
      } catch (e) {}

      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else if (contentType && contentType.includes("text/")) {
      return await response.text();
    } else {
      return await response.blob();
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
    } = options;

    try {
      const url = this.buildURL(endpoint, params);

      let requestBody = body;
      if (body && !(body instanceof FormData) && typeof body === "object") {
        requestBody = JSON.stringify(body);
      }

      const headers = this.getHeaders(customHeaders, includeAuth);

      const response = await fetch(url, {
        method,
        headers,
        body: requestBody,
      });

      return await this.handleResponse(response, context, handleErrors);
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
