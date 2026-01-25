import { API_CONFIG } from "../config/api.js";
import apiClient from "./apiClient.js";

const createUserService = (auth) => ({
  async getCurrentUser() {
    return auth.runWithAuth(async () => {
      const data = await apiClient.get(API_CONFIG.ENDPOINTS.USERS.PROFILE, {
        context: "AuthService.getCurrentUser",
        handleErrors: false,
      });

      return {
        success: true,
        user: data,
      };
    });
  },

  async updateProfile(fullName, groupNumber) {
    return auth.runWithAuth(async () => {
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
    });
  },

  async getTestResults() {
    return auth.runWithAuth(
      async () => {
        const data = await apiClient.get(
          API_CONFIG.ENDPOINTS.TEST_RESULTS.GET,
          {
            context: "AuthService.getTestResults",
            handleErrors: false,
          }
        );

        return {
          success: true,
          results: data.results || [],
        };
      },
      { results: [] }
    );
  },

  async saveTestResult(testResultData) {
    return auth.runWithAuth(async () => {
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
    });
  },

  async uploadFile(file) {
    return auth.runWithAuth(async () => {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const data = await apiClient.uploadFile(
          API_CONFIG.ENDPOINTS.UPLOAD.UPLOAD,
          formData,
          {
            context: "AuthService.uploadFile",
            handleErrors: false,
          }
        );

        // Проверяем, что сервер вернул успешный ответ
        if (data && data.success !== false) {
          return {
            success: true,
            data: data.data || data,
          };
        } else {
          // Если сервер вернул success: false или ошибку
          return {
            success: false,
            error: data.message || data.error || "Ошибка при загрузке файла",
          };
        }
      } catch (error) {
        // Если произошла ошибка при запросе
        console.error("Upload file error:", error);
        throw error; // Пробрасываем ошибку, чтобы runWithAuth мог её обработать
      }
    });
  },

  async getUserFiles() {
    return auth.runWithAuth(
      async () => {
        try {
          const data = await apiClient.get(API_CONFIG.ENDPOINTS.UPLOAD.FILES, {
            context: "AuthService.getUserFiles",
            handleErrors: false,
          });

          // Проверяем, что сервер вернул успешный ответ
          if (data && (data.success !== false)) {
            return {
              success: true,
              files: data.files || [],
            };
          } else {
            // Если сервер вернул success: false или ошибку
            console.warn("Сервер вернул ошибку при получении файлов:", data);
            return {
              success: false,
              error: data.message || data.error || "Ошибка при получении списка файлов",
              files: [],
            };
          }
        } catch (error) {
          console.error("Ошибка при запросе списка файлов:", error);
          throw error; // Пробрасываем ошибку, чтобы runWithAuth мог её обработать
        }
      },
      { success: false, files: [], error: "Пользователь не авторизован" }
    );
  },

  async deleteFile(key) {
    return auth.runWithAuth(async () => {
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
    });
  },

  async getDownloadUrl(key) {
    return auth.runWithAuth(async () => {
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
    });
  },

  async getStudentFiles(studentId) {
    return auth.runWithAuth(
      async () => {
        const data = await apiClient.get(`/admin/students/${studentId}/files`, {
          context: "AuthService.getStudentFiles",
          handleErrors: false,
        });

        return {
          success: true,
          files: data.files || [],
        };
      },
      { files: [] }
    );
  },

  async deleteStudentFile(key) {
    return auth.runWithAuth(async () => {
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
    });
  },

  async getStudentFileDownloadUrl(key) {
    return auth.runWithAuth(async () => {
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
    });
  },

  async deleteUser(userId) {
    return auth.runWithAuth(async () => {
      const data = await apiClient.delete(`/admin/users/${userId}`, {
        context: "AuthService.deleteUser",
        handleErrors: false,
      });

      return {
        success: true,
        message: data.message || "Пользователь успешно удален",
      };
    });
  },
});

export default createUserService;

