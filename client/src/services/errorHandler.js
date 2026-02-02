/**
 * Централизованный обработчик ошибок
 * Обеспечивает единообразную обработку ошибок во всем приложении
 */

import authCore from "./authCore.js";

class ErrorHandler {
  constructor() {
    this.errorMessages = {
      network:
        "Проблема с подключением к серверу. Проверьте интернет-соединение.",
      timeout: "Превышено время ожидания ответа от сервера.",
      fetch: "Ошибка при выполнении запроса к серверу.",

      unauthorized: "Вы не авторизованы. Пожалуйста, войдите в систему.",
      forbidden: "У вас нет доступа к этому ресурсу.",
      tokenExpired: "Ваша сессия истекла. Пожалуйста, войдите снова.",

      validation: "Проверьте правильность введенных данных.",
      email: "Введите корректный email адрес.",
      password: "Пароль должен содержать 6 символов.",

      server: "Ошибка на сервере. Попробуйте позже.",
      notFound: "Запрашиваемый ресурс не найден.",
      conflict: "Конфликт данных. Возможно, запись уже существует.",

      unknown: "Произошла неизвестная ошибка. Попробуйте еще раз.",
      loading: "Ошибка при загрузке данных.",
      saving: "Ошибка при сохранении данных.",
    };

    this.alertTypes = {
      ERROR: "danger",
      WARNING: "warning",
      INFO: "info",
      SUCCESS: "success",
    };
  }

  getErrorMessage(error, context = "") {
    if (typeof error === "object" && error !== null) {
      if (error.error) {
        return this.getErrorMessage(error.error, context);
      }
      if (error.message) {
        return error.message;
      }
    }

    if (error && typeof error === "object" && error.success === false) {
      return error.error || error.message || this.errorMessages.unknown;
    }

    if (typeof error === "string") {
      return error;
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (
        message.includes("network") ||
        message.includes("fetch") ||
        message.includes("failed to fetch")
      ) {
        return this.errorMessages.network;
      }

      if (message.includes("timeout")) {
        return this.errorMessages.timeout;
      }

      if (
        message.includes("unauthorized") ||
        message.includes("401") ||
        message.includes("токен") ||
        message.includes("сессия")
      ) {
        return this.errorMessages.tokenExpired;
      }

      if (
        message.includes("forbidden") ||
        message.includes("403") ||
        message.includes("доступ")
      ) {
        return this.errorMessages.forbidden;
      }

      if (
        message.includes("validation") ||
        message.includes("validate") ||
        message.includes("валидац")
      ) {
        return this.errorMessages.validation;
      }

      if (
        message.includes("500") ||
        message.includes("internal server error")
      ) {
        return this.errorMessages.server;
      }

      if (
        message.includes("404") ||
        message.includes("not found") ||
        message.includes("не найден")
      ) {
        return this.errorMessages.notFound;
      }

      if (
        message.includes("409") ||
        message.includes("conflict") ||
        message.includes("конфликт")
      ) {
        return this.errorMessages.conflict;
      }

      if (error.message && error.message.length < 200) {
        return error.message;
      }
    }

    return context
      ? `${this.errorMessages.unknown} (${context})`
      : this.errorMessages.unknown;
  }

  isAuthError(error) {
    if (!error) return false;

    const rawMessage =
      error.message || error.error || (typeof error === "string" ? error : "");
    const message = String(rawMessage || "").toLowerCase();

    return (
      message.includes("unauthorized") ||
      message.includes("401") ||
      message.includes("токен") ||
      message.includes("сессия") ||
      message.includes("авторизац")
    );
  }

  handleAuthError() {
    console.warn("Ошибка авторизации. Перенаправление на страницу входа.");
    authCore.logout();
  }

  showNotification(message, type = this.alertTypes.ERROR, options = {}) {
    const {
      duration = 5000,
      position = "top-center",
      dismissible = true,
      container = null,
    } = options;

    if (options.removePrevious !== false) {
      const existingAlerts = document.querySelectorAll(
        ".error-handler-alert-container"
      );
      existingAlerts.forEach((alert) => {
        if (alert.parentNode) {
          alert.remove();
        }
      });
    }

    const alertContainer = document.createElement("div");
    alertContainer.className = "error-handler-alert-container";

    const positionClasses = {
      "top-center": "position-fixed top-0 start-50 translate-middle-x mt-3",
      "top-right": "position-fixed top-0 end-0 mt-3 me-3",
      "top-left": "position-fixed top-0 start-0 mt-3 ms-3",
      "bottom-center":
        "position-fixed bottom-0 start-50 translate-middle-x mb-3",
    };

    alertContainer.className += ` ${
      positionClasses[position] || positionClasses["top-center"]
    } error-handler-alert-z-index`;

    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} ${
      dismissible ? "alert-dismissible fade show" : ""
    }`;
    alertDiv.setAttribute("role", "alert");

    const closeButton = dismissible
      ? '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'
      : "";

    alertDiv.innerHTML = `${message}${closeButton}`;

    alertContainer.appendChild(alertDiv);

    const targetContainer = container || document.body;
    targetContainer.appendChild(alertContainer);

    if (duration > 0) {
      setTimeout(() => {
        if (alertContainer.parentNode) {
          try {
            if (window.bootstrap && window.bootstrap.Alert) {
              const bsAlert = new window.bootstrap.Alert(alertDiv);
              bsAlert.close();
            } else {
              alertDiv.classList.remove("show");
              alertDiv.classList.add("fade");
            }
            setTimeout(() => {
              if (alertContainer.parentNode) {
                alertContainer.remove();
              }
            }, 300);
          } catch (e) {
            if (alertContainer.parentNode) {
              alertContainer.remove();
            }
          }
        }
      }, duration);
    }

    return alertContainer;
  }

  handle(error, context = "", options = {}) {
    console.error(`[ErrorHandler${context ? ` - ${context}` : ""}]`, error);

    const errorMessage = this.getErrorMessage(error, context);

    if (this.isAuthError(error)) {
      this.handleAuthError();
      this.showNotification(
        this.errorMessages.tokenExpired,
        this.alertTypes.WARNING,
        { duration: 3000, ...options }
      );
      return;
    }

    const notificationType =
      options.type ||
      (this.isAuthError(error)
        ? this.alertTypes.WARNING
        : this.alertTypes.ERROR);

    this.showNotification(errorMessage, notificationType, options);

    if (options.logToServer) {
      this.logToServer(error, context);
    }
  }

  log(error, context = "") {
    console.error(`[ErrorHandler${context ? ` - ${context}` : ""}]`, error);
  }

  showSuccess(message, options = {}) {
    this.showNotification(message, this.alertTypes.SUCCESS, options);
  }

  showInfo(message, options = {}) {
    this.showNotification(message, this.alertTypes.INFO, options);
  }

  showWarning(message, options = {}) {
    this.showNotification(message, this.alertTypes.WARNING, options);
  }

  async handleApiError(response, context = "") {
    let errorData = {};

    try {
      const contentType = response.headers.get("content-type") || "";
      // Клонируем response для чтения
      const clonedResponse = response.clone();
      
      if (contentType.includes("application/json")) {
        try {
          errorData = await clonedResponse.json();
        } catch (jsonError) {
          // Если не удалось распарсить как JSON, пробуем как текст
          const text = await clonedResponse.text();
          // Проверяем, не является ли это multipart данными
          if (text && !text.startsWith("------") && !text.includes("multipart/form-data")) {
            try {
              errorData = JSON.parse(text);
            } catch (parseError) {
              errorData = { message: text.substring(0, 200) };
            }
          } else {
            errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
          }
        }
      } else if (contentType.includes("multipart/")) {
        // Для multipart не пытаемся парсить
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      } else {
        const text = await clonedResponse.text();
        // Проверяем, не является ли это multipart данными
        if (text && !text.startsWith("------") && !text.includes("multipart/form-data")) {
          errorData = { message: text.substring(0, 200) };
        } else {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
      }
    } catch (e) {
      errorData = {
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const error = {
      message: errorData.message || `Ошибка ${response.status}`,
      status: response.status,
      statusText: response.statusText,
      data: errorData,
    };

    this.handle(error, context);
    return error;
  }

  async wrapAsync(asyncFn, context = "", options = {}) {
    try {
      return await asyncFn();
    } catch (error) {
      this.handle(error, context, options);
      throw error;
    }
  }

  async logToServer(error, context = "") {
    try {
    } catch (e) {
      console.error("Failed to log error to server:", e);
    }
  }
}

const errorHandler = new ErrorHandler();

export default errorHandler;
