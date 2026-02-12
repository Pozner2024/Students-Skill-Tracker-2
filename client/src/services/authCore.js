class AuthCore {
  async runWithAuth(action, errorDefaults = {}) {
    const token = this.getToken();

    if (!token) {
      return {
        success: false,
        error: "Пользователь не авторизован",
        ...errorDefaults,
      };
    }

    try {
      return await action(token);
    } catch (error) {
      const errorMessage = error?.message || "";
      if (this.isAuthErrorMessage(errorMessage)) {
        // Снимаем токен, чтобы роутер снова запросил авторизацию
        this.removeToken();
      }

      return {
        success: false,
        error: errorMessage,
        ...errorDefaults,
      };
    }
  }

  setToken(token) {
    if (!token || token === "undefined" || token === "null") {
      this.removeToken();
      return;
    }

    localStorage.setItem("auth_token", token);
  }

  getToken() {
    return localStorage.getItem("auth_token");
  }

  removeToken() {
    localStorage.removeItem("auth_token");
  }

  isAuthenticated() {
    const token = this.getToken();
    return !!token && token !== "undefined" && token !== "null";
  }

  logout() {
    this.removeToken();
    window.location.href = "/login";
  }

  isAuthErrorMessage(message) {
    const normalized = String(message || "").toLowerCase();
    return (
      normalized.includes("unauthorized") ||
      normalized.includes("401") ||
      normalized.includes("токен") ||
      normalized.includes("сессия") ||
      normalized.includes("авторизац")
    );
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return "Введите корректный email адрес";
    }
    return null;
  }

  validatePassword(password) {
    if (!password) {
      return "Введите пароль";
    }
    return null;
  }

  validateInput(email, password) {
    const emailError = this.validateEmail(email);
    const passwordError = this.validatePassword(password);

    if (emailError || passwordError) {
      return emailError || passwordError;
    }

    return null;
  }
}

const authCore = new AuthCore();

export default authCore;

