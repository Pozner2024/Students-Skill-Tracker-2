import { API_CONFIG } from "../config/api.js";
import apiClient from "./apiClient.js";

const extractToken = (data) =>
  data?.access_token ||
  data?.accessToken ||
  data?.token ||
  data?.data?.access_token ||
  data?.data?.accessToken ||
  data?.data?.token ||
  null;

const extractUser = (data) => data?.user || data?.data?.user || null;

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

      const token = extractToken(data);
      auth.setToken(token);

      return {
        success: true,
        user: extractUser(data),
        token,
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

      const token = extractToken(data);
      if (!token) {
        throw new Error("Токен авторизации не получен");
      }

      auth.setToken(token);

      return {
        success: true,
        user: extractUser(data),
        token,
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

