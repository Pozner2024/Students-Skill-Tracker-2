import CubeLoader from "../common/CubeLoader";
import SuccessModal from "../common/SuccessModal";
import authService from "../utils/authService";
import logo from "../assets/logo_vgik.png";
import background from "../assets/background.jpg"; // Импортируем фон

// Функция для рендеринга страницы логина
export function renderLoginPage() {
  const root = document.getElementById("root");
  document.title = "StudentSkillTracker";
  root.classList.add("login-page");

  if (!root) {
    return;
  }

  // Вставляем HTML для формы входа/регистрации
  root.innerHTML = `
    <div class="page-background">
      <div class="main-container">
        <div class="text-section">
          <img src="${logo}" alt="Логотип УО ВГИК" class="logo">
          <h1>Система контроля и оценки компетенций обучающихся по учебному предмету "Специальная технология".</h1>
          <p>Специальность: "Обслуживание и изготовление продукции в общественном питании". Квалификация: "Кондитер 4 разряда".</p>
        </div>
        <div class="login-wrapper">
          <div class="form-box">
            <h2>Вход</h2>
            <div class="input-group">
              <label for="email">Email</label>
              <input type="email" id="email" placeholder="Введите Ваш email" required>
            </div>
            <div class="input-group">
              <label for="password">Пароль</label>
              <div class="password-input-wrapper">
                <input type="password" id="password" placeholder="******" required>
                <button type="button" id="password-toggle" class="password-toggle-btn" aria-label="Показать пароль">
                  <svg class="eye-icon eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                  <svg class="eye-icon eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              <div class="password-strength-indicator" id="password-indicator">
                <span class="indicator-text">Ровно 6 символов:</span>
                <div class="stars-container">
                  <span class="star">★</span>
                  <span class="star">★</span>
                  <span class="star">★</span>
                  <span class="star">★</span>
                  <span class="star">★</span>
                  <span class="star">★</span>
                </div>
              </div>
            </div>
            <button id="login-btn" class="submit-btn">Войти</button>
            <button id="register-btn" class="submit-btn register-btn">Зарегистрироваться</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Устанавливаем фон через JavaScript. Пришлось вынести фон из CSS в JS, т.к. при деплое,
  // в первом случае (через СSS, он не отображался на Netlify
  const pageBackground = document.querySelector(".page-background");
  pageBackground.style.backgroundImage = `url(${background})`; // Устанавливаем фон
  pageBackground.style.backgroundSize = "cover";
  pageBackground.style.backgroundPosition = "center";
  pageBackground.style.backgroundRepeat = "no-repeat";

  // Создаем экземпляр лоадера
  const loader = new CubeLoader();

  // Обработчики для кнопок
  document
    .getElementById("login-btn")
    .addEventListener("click", () => handleLogin(loader)); // Передаем loader
  document
    .getElementById("register-btn")
    .addEventListener("click", () => handleRegister(loader)); // Передаем loader

  // Обработчик для переключателя видимости пароля
  document
    .getElementById("password-toggle")
    .addEventListener("click", togglePasswordVisibility);

  // Обработчик для обновления индикатора пароля
  document
    .getElementById("password")
    .addEventListener("input", updatePasswordIndicator);
}

// Функция для обработки логина
async function handleLogin(loader) {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const validationError = authService.validateInput(email, password);
  if (validationError) {
    alert(validationError);
    return;
  }

  loader.show(); // Показываем лоадер во время выполнения запроса

  try {
    const result = await authService.login(email, password);
    loader.hide(); // Скрываем лоадер после завершения запроса

    if (result.success) {
      window.location.href = "/";
    } else {
      alert("Ошибка при входе: " + result.error);
    }
  } catch (error) {
    loader.hide(); // Скрываем лоадер в случае ошибки
    alert("Ошибка при входе: " + error.message);
  }
}

// Функция для регистрации пользователя
async function handleRegister(loader) {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const validationError = authService.validateInput(email, password);
  if (validationError) {
    alert(validationError);
    return;
  }

  loader.show(); // Показываем лоадер во время выполнения запроса

  try {
    const result = await authService.register(email, password);
    loader.hide(); // Скрываем лоадер после завершения

    if (result.success) {
      // Очищаем форму после успешной регистрации
      document.getElementById("email").value = "";
      document.getElementById("password").value = "";

      // Показываем красивое модальное окно успеха
      const successModal = new SuccessModal({
        id: "registrationSuccessModal",
        title: "Регистрация успешна!",
        message: "Вы успешно зарегистрировались, теперь войдите в приложение",
        buttonText: "Понятно",
      });

      successModal.showModal();

      // НЕ перенаправляем на главную страницу - пользователь должен войти
    } else {
      alert("Ошибка при регистрации: " + result.error);
    }
  } catch (error) {
    loader.hide(); // Скрываем лоадер в случае ошибки
    alert("Ошибка при регистрации: " + error.message);
  }
}

// Функция для переключения видимости пароля
function togglePasswordVisibility() {
  const passwordInput = document.getElementById("password");
  const toggleBtn = document.getElementById("password-toggle");
  const eyeClosed = toggleBtn.querySelector(".eye-closed");
  const eyeOpen = toggleBtn.querySelector(".eye-open");

  if (passwordInput.type === "password") {
    // Показываем пароль
    passwordInput.type = "text";
    eyeClosed.style.display = "none";
    eyeOpen.style.display = "block";
    toggleBtn.setAttribute("aria-label", "Скрыть пароль");
  } else {
    // Скрываем пароль
    passwordInput.type = "password";
    eyeClosed.style.display = "block";
    eyeOpen.style.display = "none";
    toggleBtn.setAttribute("aria-label", "Показать пароль");
  }
}

// Функция для обновления индикатора пароля
function updatePasswordIndicator() {
  const passwordInput = document.getElementById("password");
  const indicator = document.getElementById("password-indicator");
  const stars = indicator.querySelectorAll(".star");
  const indicatorText = indicator.querySelector(".indicator-text");

  const passwordLength = passwordInput.value.length;
  const minLength = 6;
  const maxLength = 6; // Максимальная длина пароля

  // Проверяем, не превышает ли пароль максимальную длину
  if (passwordLength > maxLength) {
    // Обрезаем пароль до максимальной длины
    passwordInput.value = passwordInput.value.substring(0, maxLength);

    // Показываем сообщение об ошибке
    alert("Пароль должен содержать ровно 6 символов");

    // Возвращаемся к функции с обрезанным паролем
    return updatePasswordIndicator();
  }

  // Показываем индикатор только если пользователь начал вводить пароль
  if (passwordLength > 0) {
    indicator.style.display = "flex";

    // Обновляем звездочки
    stars.forEach((star, index) => {
      if (index < passwordLength) {
        star.classList.add("filled");
        star.classList.remove("empty");
      } else {
        star.classList.add("empty");
        star.classList.remove("filled");
      }
    });

    // Обновляем текст
    if (passwordLength < minLength) {
      const remaining = minLength - passwordLength;
      indicatorText.textContent = `Осталось ${remaining} символов:`;
      indicator.classList.remove("complete");
      indicator.classList.add("incomplete");
    } else {
      indicatorText.textContent = "Пароль готов!";
      indicator.classList.remove("incomplete");
      indicator.classList.add("complete");
    }
  } else {
    // Скрываем индикатор если поле пустое
    indicator.style.display = "none";
  }
}
