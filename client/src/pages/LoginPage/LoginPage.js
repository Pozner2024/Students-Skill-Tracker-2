import "../../components/ui/CubeLoader";
import SuccessModal from "../../components/modals/SuccessModal";
import authService from "../../services/authService";
import errorHandler from "../../services/errorHandler.js";
import logo from "../../assets/logo_vgik.png";
import background from "../../assets/background.jpg";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export function renderLoginPage() {
  const root = document.getElementById("root");
  document.title = "StudentSkillTracker";
  root.classList.add("login-page");

  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="page-background">
      <div class="main-container">
        <div class="text-section">
          <img src="${logo}" alt="Логотип УО ВГИК" class="logo">
          <h1>Кондитер-Pro. Контроль и оценка компетенций обучающихся по учебному предмету "Специальная технология".</h1>
          <p>Специальность: "Обслуживание и изготовление продукции в общественном питании". Квалификация: "Кондитер 4 разряда".</p>
        </div>
        <div class="login-wrapper">
          <div class="form-box">
            <h2>Вход</h2>
            <form id="login-form">
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input type="email" class="form-control" id="email" placeholder="Введите Ваш email" required>
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Пароль</label>
                <div class="password-input-wrapper position-relative">
                  <input type="password" class="form-control" id="password" placeholder="******" required>
                  <button type="button" id="password-toggle" class="btn btn-link password-toggle-btn position-absolute top-50 end-0 translate-middle-y" aria-label="Показать пароль">
                    <svg class="eye-icon eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                    <svg class="eye-icon eye-open hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
              </div>
              <button type="button" id="login-btn" class="btn btn-primary w-100 mb-2">Войти</button>
              <button type="button" id="register-btn" class="btn btn-success w-100">Зарегистрироваться</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  const pageBackground = document.querySelector(".page-background");
  pageBackground.style.backgroundImage = `url(${background})`;
  pageBackground.style.backgroundSize = "cover";
  pageBackground.style.backgroundPosition = "center";
  pageBackground.style.backgroundRepeat = "no-repeat";

  document
    .getElementById("login-btn")
    .addEventListener("click", handleLogin);
  document
    .getElementById("register-btn")
    .addEventListener("click", handleRegister);

  document
    .getElementById("password-toggle")
    .addEventListener("click", togglePasswordVisibility);

}

function showBootstrapAlert(message, type = "info") {
  const alertTypes = {
    info: "info",
    success: "success",
    warning: "warning",
    danger: "danger",
    error: "danger",
  };

  errorHandler.showNotification(message, alertTypes[type] || "info", {
    duration: 5000,
  });
}

async function handleLogin() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const validationError = authService.validateInput(email, password);
  if (validationError) {
    showBootstrapAlert(validationError, "danger");
    return;
  }

  window.loader.show();

  try {
    const result = await authService.login(email, password);
    window.loader.hide();

    if (result.success) {
      window.location.href = "/";
    } else {
      errorHandler.handle(result, "LoginPage.handleLogin");
    }
  } catch (error) {
    window.loader.hide();
    errorHandler.handle(error, "LoginPage.handleLogin");
  }
}

async function handleRegister() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const validationError = authService.validateInput(email, password);
  if (validationError) {
    showBootstrapAlert(validationError, "danger");
    return;
  }

  window.loader.show();

  try {
    const result = await authService.register(email, password);

    if (result.success) {
      const token = authService.getToken();
      const hasValidToken =
        token && token !== "undefined" && token !== "null";

      if (!hasValidToken) {
        authService.removeToken();
        const loginResult = await authService.login(email, password);
        if (!loginResult.success) {
          window.loader.hide();
          errorHandler.handle(loginResult, "LoginPage.handleRegister.login");
          return;
        }
      }

      if (!authService.isAuthenticated()) {
        window.loader.hide();
        showBootstrapAlert(
          "Не удалось сохранить токен авторизации. Попробуйте войти вручную.",
          "danger"
        );
        return;
      }

      window.loader.hide();
      let hasRedirected = false;
      const redirectToApp = () => {
        if (hasRedirected) return;
        hasRedirected = true;
        window.location.href = "/";
      };

      const successModal = new SuccessModal({
        id: "registrationSuccessModal",
        title: "Регистрация прошла успешно!",
        message: "Сейчас вы будете перенаправлены в приложение",
        buttonText: "Перейти",
        buttonAction: () => {
          successModal.closeModal();
          redirectToApp();
        },
        onClose: redirectToApp,
      });

      successModal.showModal();
      setTimeout(redirectToApp, 800);
    } else {
      window.loader.hide();
      errorHandler.handle(result, "LoginPage.handleRegister");
    }
  } catch (error) {
    window.loader.hide();
    errorHandler.handle(error, "LoginPage.handleRegister");
  }
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById("password");
  const toggleBtn = document.getElementById("password-toggle");
  const eyeClosed = toggleBtn.querySelector(".eye-closed");
  const eyeOpen = toggleBtn.querySelector(".eye-open");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eyeClosed.classList.add("hidden");
    eyeOpen.classList.remove("hidden");
    toggleBtn.setAttribute("aria-label", "Скрыть пароль");
  } else {
    passwordInput.type = "password";
    eyeClosed.classList.remove("hidden");
    eyeOpen.classList.add("hidden");
    toggleBtn.setAttribute("aria-label", "Показать пароль");
  }
}

