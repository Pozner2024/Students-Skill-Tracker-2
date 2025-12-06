/**
 * Централизованный обработчик ошибок
 * Обеспечивает единообразную обработку ошибок во всем приложении
 */

import authService from "./authService.js";

class ErrorHandler {
  constructor() {
    this.errorMessages = {
      // Сетевые ошибки
      network: "Проблема с подключением к серверу. Проверьте интернет-соединение.",
      timeout: "Превышено время ожидания ответа от сервера.",
      fetch: "Ошибка при выполнении запроса к серверу.",
      
      // Ошибки авторизации
      unauthorized: "Вы не авторизованы. Пожалуйста, войдите в систему.",
      forbidden: "У вас нет доступа к этому ресурсу.",
      tokenExpired: "Ваша сессия истекла. Пожалуйста, войдите снова.",
      
      // Ошибки валидации
      validation: "Проверьте правильность введенных данных.",
      email: "Введите корректный email адрес.",
      password: "Пароль должен содержать 6 символов.",
      
      // Ошибки сервера
      server: "Ошибка на сервере. Попробуйте позже.",
      notFound: "Запрашиваемый ресурс не найден.",
      conflict: "Конфликт данных. Возможно, запись уже существует.",
      
      // Общие ошибки
      unknown: "Произошла неизвестная ошибка. Попробуйте еще раз.",
      loading: "Ошибка при загрузке данных.",
      saving: "Ошибка при сохранении данных.",
    };

    // Типы уведомлений
    this.alertTypes = {
      ERROR: "danger",
      WARNING: "warning",
      INFO: "info",
      SUCCESS: "success",
    };
  }

  /**
   * Определяет тип ошибки и возвращает понятное сообщение
   * @param {Error|string|object} error - Ошибка для обработки
   * @param {string} context - Контекст, в котором произошла ошибка
   * @returns {string} Понятное сообщение об ошибке
   */
  getErrorMessage(error, context = "") {
    // Если передан объект с полем error или message
    if (typeof error === "object" && error !== null) {
      if (error.error) {
        return this.getErrorMessage(error.error, context);
      }
      if (error.message) {
        return error.message;
      }
    }

    // Если передан объект с полем success: false
    if (error && typeof error === "object" && error.success === false) {
      return error.error || error.message || this.errorMessages.unknown;
    }

    // Если передана строка
    if (typeof error === "string") {
      return error;
    }

    // Если передан Error объект
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Проверяем сетевые ошибки
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

      // Проверяем ошибки авторизации
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

      // Проверяем ошибки валидации
      if (
        message.includes("validation") ||
        message.includes("validate") ||
        message.includes("валидац")
      ) {
        return this.errorMessages.validation;
      }

      // Проверяем ошибки сервера
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

      // Возвращаем оригинальное сообщение, если оно понятное
      if (error.message && error.message.length < 200) {
        return error.message;
      }
    }

    // Возвращаем сообщение по умолчанию
    return context
      ? `${this.errorMessages.unknown} (${context})`
      : this.errorMessages.unknown;
  }

  /**
   * Проверяет, является ли ошибка ошибкой авторизации
   * @param {Error|object} error - Ошибка для проверки
   * @returns {boolean}
   */
  isAuthError(error) {
    if (!error) return false;

    const message =
      (error.message || error.error || "").toLowerCase() ||
      (typeof error === "string" ? error : "").toLowerCase();

    return (
      message.includes("unauthorized") ||
      message.includes("401") ||
      message.includes("токен") ||
      message.includes("сессия") ||
      message.includes("авторизац")
    );
  }

  /**
   * Обрабатывает ошибку авторизации (редирект на логин)
   */
  handleAuthError() {
    console.warn("Ошибка авторизации. Перенаправление на страницу входа.");
    authService.logout();
  }

  /**
   * Показывает уведомление пользователю
   * @param {string} message - Сообщение для отображения
   * @param {string} type - Тип уведомления (danger, warning, info, success)
   * @param {object} options - Дополнительные опции
   */
  showNotification(message, type = this.alertTypes.ERROR, options = {}) {
    const {
      duration = 5000,
      position = "top-center",
      dismissible = true,
      container = null,
    } = options;

    // Удаляем предыдущие уведомления, если нужно
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

    // Создаем контейнер для уведомления
    const alertContainer = document.createElement("div");
    alertContainer.className = "error-handler-alert-container";
    
    // Позиционирование
    const positionClasses = {
      "top-center": "position-fixed top-0 start-50 translate-middle-x mt-3",
      "top-right": "position-fixed top-0 end-0 mt-3 me-3",
      "top-left": "position-fixed top-0 start-0 mt-3 ms-3",
      "bottom-center": "position-fixed bottom-0 start-50 translate-middle-x mb-3",
    };
    
    alertContainer.className += ` ${positionClasses[position] || positionClasses["top-center"]}`;
    alertContainer.style.zIndex = "9999";

    // Создаем уведомление
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} ${dismissible ? "alert-dismissible fade show" : ""}`;
    alertDiv.setAttribute("role", "alert");
    
    const closeButton = dismissible
      ? '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>'
      : "";
    
    alertDiv.innerHTML = `${message}${closeButton}`;

    alertContainer.appendChild(alertDiv);

    // Вставляем в указанный контейнер или в body
    const targetContainer = container || document.body;
    targetContainer.appendChild(alertContainer);

    // Автоматически скрываем через указанное время
    if (duration > 0) {
      setTimeout(() => {
        if (alertContainer.parentNode) {
          try {
            // Пытаемся использовать Bootstrap Alert API
            if (window.bootstrap && window.bootstrap.Alert) {
              const bsAlert = new window.bootstrap.Alert(alertDiv);
              bsAlert.close();
            } else {
              // Fallback: просто скрываем через CSS
              alertDiv.classList.remove("show");
              alertDiv.classList.add("fade");
            }
            // Удаляем элемент после анимации
            setTimeout(() => {
              if (alertContainer.parentNode) {
                alertContainer.remove();
              }
            }, 300);
          } catch (e) {
            // Если что-то пошло не так, просто удаляем элемент
            if (alertContainer.parentNode) {
              alertContainer.remove();
            }
          }
        }
      }, duration);
    }

    return alertContainer;
  }

  /**
   * Основной метод обработки ошибок
   * @param {Error|string|object} error - Ошибка для обработки
   * @param {string} context - Контекст, в котором произошла ошибка
   * @param {object} options - Дополнительные опции
   */
  handle(error, context = "", options = {}) {
    // Логируем ошибку в консоль
    console.error(`[ErrorHandler${context ? ` - ${context}` : ""}]`, error);

    // Получаем понятное сообщение об ошибке
    const errorMessage = this.getErrorMessage(error, context);

    // Проверяем, является ли это ошибкой авторизации
    if (this.isAuthError(error)) {
      this.handleAuthError();
      // Показываем уведомление перед редиректом
      this.showNotification(
        this.errorMessages.tokenExpired,
        this.alertTypes.WARNING,
        { duration: 3000, ...options }
      );
      return;
    }

    // Определяем тип уведомления
    const notificationType =
      options.type ||
      (this.isAuthError(error)
        ? this.alertTypes.WARNING
        : this.alertTypes.ERROR);

    // Показываем уведомление пользователю
    this.showNotification(errorMessage, notificationType, options);

    // Если нужно, можно добавить логирование на сервер
    if (options.logToServer) {
      this.logToServer(error, context);
    }
  }

  /**
   * Обрабатывает ошибку без показа уведомления (только логирование)
   * @param {Error|string|object} error - Ошибка для обработки
   * @param {string} context - Контекст, в котором произошла ошибка
   */
  log(error, context = "") {
    console.error(`[ErrorHandler${context ? ` - ${context}` : ""}]`, error);
  }

  /**
   * Показывает успешное уведомление
   * @param {string} message - Сообщение
   * @param {object} options - Дополнительные опции
   */
  showSuccess(message, options = {}) {
    this.showNotification(message, this.alertTypes.SUCCESS, options);
  }

  /**
   * Показывает информационное уведомление
   * @param {string} message - Сообщение
   * @param {object} options - Дополнительные опции
   */
  showInfo(message, options = {}) {
    this.showNotification(message, this.alertTypes.INFO, options);
  }

  /**
   * Показывает предупреждение
   * @param {string} message - Сообщение
   * @param {object} options - Дополнительные опции
   */
  showWarning(message, options = {}) {
    this.showNotification(message, this.alertTypes.WARNING, options);
  }

  /**
   * Обрабатывает ошибку API запроса
   * @param {Response} response - Response объект от fetch
   * @param {string} context - Контекст запроса
   * @returns {Promise<object>} Объект с информацией об ошибке
   */
  async handleApiError(response, context = "") {
    let errorData = {};
    
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() };
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

  /**
   * Обертка для async функций с автоматической обработкой ошибок
   * @param {Function} asyncFn - Асинхронная функция
   * @param {string} context - Контекст выполнения
   * @param {object} options - Опции обработки ошибок
   * @returns {Promise} Промис с результатом выполнения функции
   */
  async wrapAsync(asyncFn, context = "", options = {}) {
    try {
      return await asyncFn();
    } catch (error) {
      this.handle(error, context, options);
      throw error; // Пробрасываем ошибку дальше, если нужно
    }
  }

  /**
   * Логирование ошибки на сервер (опционально)
   * @param {Error|object} error - Ошибка для логирования
   * @param {string} context - Контекст ошибки
   */
  async logToServer(error, context = "") {
    // Здесь можно добавить отправку ошибок на сервер для мониторинга
    // Например, в Sentry или другую систему логирования
    try {
      // Пример отправки на сервер (раскомментировать при необходимости)
      /*
      await fetch('/api/logs/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: error.message || String(error),
          context,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
      */
    } catch (e) {
      console.error("Failed to log error to server:", e);
    }
  }
}

// Создаем единственный экземпляр обработчика ошибок
const errorHandler = new ErrorHandler();

export default errorHandler;

