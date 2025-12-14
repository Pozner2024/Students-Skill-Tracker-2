import { API_CONFIG } from "../config/api.js";
import apiClient from "./apiClient.js";

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
      const data = await apiClient.publicRequest(this.endpoints.REGISTER, {
        method: "POST",
        body: { email, password },
        context: "AuthService.register",
      });

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
      const data = await apiClient.publicRequest(this.endpoints.LOGIN, {
        method: "POST",
        body: { email, password },
        context: "AuthService.login",
      });

      // Сохраняем токен
      this.setToken(data.access_token);

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

      const data = await apiClient.get(API_CONFIG.ENDPOINTS.USERS.PROFILE, {
        context: "AuthService.getCurrentUser",
        handleErrors: false,
      });

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

      const data = await apiClient.put(
        API_CONFIG.ENDPOINTS.USERS.PROFILE,
        { fullName, groupNumber },
        {
          context: "AuthService.updateProfile",
          handleErrors: false,
        }
      );

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

      const data = await apiClient.get(API_CONFIG.ENDPOINTS.TEST_RESULTS.GET, {
        context: "AuthService.getTestResults",
        handleErrors: false,
      });

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

      const data = await apiClient.post(
        API_CONFIG.ENDPOINTS.TEST_RESULTS.SAVE,
        testResultData,
        {
          context: "AuthService.saveTestResult",
          handleErrors: false,
        }
      );

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

  async uploadFile(file) {
    try {
      const token = this.getToken();

      if (!token) {
        return {
          success: false,
          error: "Пользователь не авторизован",
        };
      }

      const formData = new FormData();
      formData.append("file", file);

      const data = await apiClient.uploadFile(
        API_CONFIG.ENDPOINTS.UPLOAD.UPLOAD,
        formData,
        {
          context: "AuthService.uploadFile",
          handleErrors: false,
        }
      );

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Получение списка файлов пользователя
  async getUserFiles() {
    try {
      const token = this.getToken();

      if (!token) {
        return {
          success: false,
          error: "Пользователь не авторизован",
        };
      }

      const data = await apiClient.get(API_CONFIG.ENDPOINTS.UPLOAD.FILES, {
        context: "AuthService.getUserFiles",
        handleErrors: false,
      });

      return {
        success: true,
        files: data.files || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        files: [],
      };
    }
  }

  // Удаление файла
  async deleteFile(key) {
    try {
      const token = this.getToken();

      if (!token) {
        return {
          success: false,
          error: "Пользователь не авторизован",
        };
      }

      // Кодируем ключ для URL
      const encodedKey = encodeURIComponent(key);
      const endpoint = `${API_CONFIG.ENDPOINTS.UPLOAD.DELETE}/${encodedKey}`;

      const data = await apiClient.delete(endpoint, {
        context: "AuthService.deleteFile",
        handleErrors: false,
      });

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Получение URL для скачивания файла
  async getDownloadUrl(key) {
    try {
      const token = this.getToken();

      if (!token) {
        return {
          success: false,
          error: "Пользователь не авторизован",
        };
      }

      // Кодируем ключ для URL
      const encodedKey = encodeURIComponent(key);
      const endpoint = `${API_CONFIG.ENDPOINTS.UPLOAD.DOWNLOAD}/${encodedKey}`;

      const data = await apiClient.get(endpoint, {
        context: "AuthService.getDownloadUrl",
        handleErrors: false,
      });

      return {
        success: true,
        url: data.url,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Получение файлов студента (для админа)
  async getStudentFiles(studentId) {
    try {
      const token = this.getToken();

      if (!token) {
        return {
          success: false,
          error: "Пользователь не авторизован",
        };
      }

      const data = await apiClient.get(`/admin/students/${studentId}/files`, {
        context: "AuthService.getStudentFiles",
        handleErrors: false,
      });

      return {
        success: true,
        files: data.files || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        files: [],
      };
    }
  }

  // Удаление файла студента (для админа)
  async deleteStudentFile(key) {
    try {
      const token = this.getToken();

      if (!token) {
        return {
          success: false,
          error: "Пользователь не авторизован",
        };
      }

      // Кодируем ключ для URL
      const encodedKey = encodeURIComponent(key);
      const endpoint = `/admin/files/${encodedKey}`;

      const data = await apiClient.delete(endpoint, {
        context: "AuthService.deleteStudentFile",
        handleErrors: false,
      });

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Получение URL для скачивания файла студента (для админа)
  async getStudentFileDownloadUrl(key) {
    try {
      const token = this.getToken();

      if (!token) {
        return {
          success: false,
          error: "Пользователь не авторизован",
        };
      }

      // Кодируем ключ для URL
      const encodedKey = encodeURIComponent(key);
      const endpoint = `/admin/files/${encodedKey}/download`;

      const data = await apiClient.get(endpoint, {
        context: "AuthService.getStudentFileDownloadUrl",
        handleErrors: false,
      });

      return {
        success: true,
        url: data.url,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Удаление пользователя (для админа)
  async deleteUser(userId) {
    try {
      const token = this.getToken();

      if (!token) {
        return {
          success: false,
          error: "Пользователь не авторизован",
        };
      }

      const data = await apiClient.delete(`/admin/users/${userId}`, {
        context: "AuthService.deleteUser",
        handleErrors: false,
      });

      return {
        success: true,
        message: data.message || "Пользователь успешно удален",
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
