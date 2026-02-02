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
      return {
        success: false,
        error: error.message,
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

