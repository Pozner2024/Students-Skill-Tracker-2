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

      const response = await fetch(
        `${this.baseURL}${API_CONFIG.ENDPOINTS.USERS.PROFILE}`,
        {
          method: "GET",
          headers: headers,
        }
      );

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

      const response = await fetch(
        `${this.baseURL}${API_CONFIG.ENDPOINTS.USERS.PROFILE}`,
        {
          method: "PUT",
          headers: headers,
          body: JSON.stringify({ fullName, groupNumber }),
        }
      );

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
        `${this.baseURL}${API_CONFIG.ENDPOINTS.TEST_RESULTS.GET}`,
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
        `${this.baseURL}${API_CONFIG.ENDPOINTS.TEST_RESULTS.SAVE}`,
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

  // Загрузка файла
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

      const response = await fetch(
        `${this.baseURL}${API_CONFIG.ENDPOINTS.UPLOAD.UPLOAD}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ошибка при загрузке файла");
      }

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

      const headers = this.getAuthHeaders();

      const response = await fetch(
        `${this.baseURL}${API_CONFIG.ENDPOINTS.UPLOAD.FILES}`,
        {
          method: "GET",
          headers: headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ошибка при получении списка файлов");
      }

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

      const headers = this.getAuthHeaders();

      // Кодируем ключ для URL
      const encodedKey = encodeURIComponent(key);

      const response = await fetch(
        `${this.baseURL}${API_CONFIG.ENDPOINTS.UPLOAD.DELETE}/${encodedKey}`,
        {
          method: "DELETE",
          headers: headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ошибка при удалении файла");
      }

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

      const headers = this.getAuthHeaders();

      // Кодируем ключ для URL
      const encodedKey = encodeURIComponent(key);

      const response = await fetch(
        `${this.baseURL}${API_CONFIG.ENDPOINTS.UPLOAD.DOWNLOAD}/${encodedKey}`,
        {
          method: "GET",
          headers: headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ошибка при получении ссылки на файл");
      }

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

      const headers = this.getAuthHeaders();

      const response = await fetch(
        `${this.baseURL}/admin/students/${studentId}/files`,
        {
          method: "GET",
          headers: headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ошибка при получении файлов студента");
      }

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

      const headers = this.getAuthHeaders();

      // Кодируем ключ для URL
      const encodedKey = encodeURIComponent(key);
      const url = `${this.baseURL}/admin/files/${encodedKey}`;
      
      console.log("Delete request URL:", url);
      console.log("Delete request key:", key);

      const response = await fetch(url, {
        method: "DELETE",
        headers: headers,
      });

      console.log("Delete response status:", response.status);

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Если ответ не JSON, читаем как текст
        const text = await response.text();
        console.error("Delete response is not JSON:", text);
        throw new Error(`Ошибка сервера: ${response.status} ${text}`);
      }

      if (!response.ok) {
        console.error("Delete failed:", data);
        throw new Error(data.message || data.error || "Ошибка при удалении файла");
      }

      console.log("Delete success:", data);
      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error("Delete error:", error);
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

      const headers = this.getAuthHeaders();

      // Кодируем ключ для URL
      const encodedKey = encodeURIComponent(key);

      const response = await fetch(
        `${this.baseURL}/admin/files/${encodedKey}/download`,
        {
          method: "GET",
          headers: headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ошибка при получении ссылки на файл");
      }

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
}

// Создаем единственный экземпляр сервиса
const authService = new AuthService();

export default authService;
