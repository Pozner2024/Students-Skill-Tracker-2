import { API_CONFIG } from "../config/api.js";
import apiClient from "./apiClient.js";

const createAuthApi = (auth) => ({
  async register(email, password) {
    try {
      const data = await apiClient.publicRequest(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER,
        {
          method: "POST",
          body: { email, password },
          context: "AuthService.register",
        }
      );

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
  },

  async login(email, password) {
    try {
      const data = await apiClient.publicRequest(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        {
          method: "POST",
          body: { email, password },
          context: "AuthService.login",
        }
      );

      auth.setToken(data.access_token);

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
  },
});

export default createAuthApi;

