import { API_CONFIG } from "../config/api.js";

class AuthService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.endpoints = API_CONFIG.ENDPOINTS.AUTH;
  }

  // Сохранение токена в localStorage
  setToken(token) {
    localStorage.setItem("auth_token", token);
  }

  // Получение токена из localStorage
  getToken() {
    return localStorage.getItem("auth_token");
  }

  // Удаление токена из localStorage
  removeToken() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_password"); // Также удаляем сохраненный пароль
  }

  // Получение сохраненного пароля
  getSavedPassword() {
    return localStorage.getItem("user_password");
  }

  // Проверка, авторизован ли пользователь
  isAuthenticated() {
    return !!this.getToken();
  }

  // Получение заголовков для запросов
  getAuthHeaders() {
    const token = this.getToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Регистрация пользователя
  async register(email, password) {
    try {
      const response = await fetch(
        `${this.baseURL}${this.endpoints.REGISTER}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ошибка при регистрации");
      }

      // НЕ сохраняем токен - пользователь должен войти отдельно
      // this.setToken(data.access_token);

      return {
        success: true,
        user: data.user,
        message: "Вы успешно зарегистрировались, а теперь войдите в систему",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Вход в систему
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}${this.endpoints.LOGIN}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ошибка при входе");
      }

      // Сохраняем токен и пароль
      this.setToken(data.access_token);

      // Сохраняем пароль для отображения в профиле (только для демонстрации)
      // В реальном приложении это не рекомендуется по соображениям безопасности
      localStorage.setItem("user_password", password);

      return {
        success: true,
        user: data.user,
        token: data.access_token,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Выход из системы
  logout() {
    this.removeToken();
    window.location.href = "/login";
  }

  // Валидация данных
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return "Введите корректный email адрес";
    }
    return null;
  }

  validatePassword(password) {
    if (!password || password.length !== 6) {
      return "Пароль должен содержать ровно 6 символов";
    }
    return null;
  }

  // Общая валидация
  validateInput(email, password) {
    const emailError = this.validateEmail(email);
    const passwordError = this.validatePassword(password);

    if (emailError || passwordError) {
      return emailError || passwordError;
    }

    return null;
  }

  // Получение информации о текущем пользователе
  async getCurrentUser() {
    try {
      const token = this.getToken();

      if (!token) {
        return {
          success: false,
          error: "Пользователь не авторизован",
        };
      }

      const headers = this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}${this.endpoints.PROFILE}`, {
        method: "GET",
        headers: headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Ошибка при получении данных пользователя"
        );
      }

      return {
        success: true,
        user: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Обновление профиля пользователя
  async updateProfile(fullName, groupNumber) {
    try {
      const token = this.getToken();

      if (!token) {
        return {
          success: false,
          error: "Пользователь не авторизован",
        };
      }

      const headers = this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}${this.endpoints.PROFILE}`, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify({ fullName, groupNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ошибка при обновлении профиля");
      }

      return {
        success: true,
        user: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Получение результатов тестов пользователя
  async getTestResults() {
    try {
      const token = this.getToken();

      if (!token) {
        return {
          success: false,
          error: "Пользователь не авторизован",
        };
      }

      const headers = this.getAuthHeaders();

      const response = await fetch(
        `${this.baseURL}${this.endpoints.TEST_RESULTS}`,
        {
          method: "GET",
          headers: headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Ошибка при получении результатов тестов"
        );
      }

      return {
        success: true,
        results: data.results || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        results: [],
      };
    }
  }

  // Сохранение результата теста
  async saveTestResult(testResultData) {
    try {
      const token = this.getToken();

      if (!token) {
        return {
          success: false,
          error: "Пользователь не авторизован",
        };
      }

      const headers = this.getAuthHeaders();

      const response = await fetch(
        `${this.baseURL}${this.endpoints.SAVE_TEST_RESULT}`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify(testResultData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Ошибка при сохранении результата теста"
        );
      }

      return {
        success: true,
        result: data.result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Создаем единственный экземпляр сервиса
const authService = new AuthService();

export default authService;
