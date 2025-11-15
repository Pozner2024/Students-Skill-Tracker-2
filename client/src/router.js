// Импорты для работы с API
import authService from "./utils/authService.js";
import { renderLoginPage } from "./pages/LoginPage.js";

import Home from "./pages/Home.js";
import About from "./pages/About.js";
import Contacts from "./pages/Contacts.js";
import CriteriaPage from "./pages/Criteria.js";
import ProfilePage from "./pages/Profile.js";
import AdminPage from "./pages/Admin.js";
import Error404 from "./pages/Error404.js";
import TestPage from "./pages/TestPage.js";

// Функция для получения компонента по пути
const getComponentFromPath = (path) => {
  if (path === "/logout") {
    logoutUser();
    return null;
  }

  // Если пользователь не авторизован, проверяем доступ к маршруту
  if (!authService.isAuthenticated()) {
    // Разрешаем доступ только к странице логина и публичным страницам
    const publicRoutes = ["/login", "/about", "/contacts"];
    if (!publicRoutes.includes(path)) {
      // Перенаправляем на страницу логина
      window.history.pushState({}, "", "/login");
      return { renderPage: () => renderLoginPage() };
    }
  }

  // Если это страница логина и пользователь уже авторизован, перенаправляем на главную
  if (path === "/login" && authService.isAuthenticated()) {
    window.history.pushState({}, "", "/");
    return new Home();
  }

  let component;
  switch (path) {
    case "/":
      component = new Home();
      break;
    case "/about":
      component = new About();
      break;
    case "/contacts":
      component = new Contacts();
      break;
    case "/criteria":
      component = new CriteriaPage();
      break;
    case "/profile":
      component = new ProfilePage(); // Создаем новый экземпляр каждый раз
      break;
    case "/admin":
      component = new AdminPage();
      break;
    case "/test-page":
      component = new TestPage();
      break;
    case "/login":
      component = { renderPage: () => renderLoginPage() };
      break;
    default:
      component = new Error404();
  }

  return component;
};

// Защищенные маршруты (требуют аутентификации)
// Примечание: теперь логика работает через publicRoutes - все маршруты, кроме публичных, требуют авторизации
const protectedRoutes = ["/profile", "/test-page", "/criteria", "/admin"]; // Оставлено для документации

// Функция выхода пользователя
const logoutUser = () => {
  authService.logout();
};

// Функция перерисовки компонентов
const updateDOM = async (root, component) => {
  if (!root) {
    return;
  }

  // Захватываем исходный путь, чтобы обнаружить смену маршрута во время асинхронного рендера
  const initialPath = window.location.pathname;

  if (component) {
    document.title = component.metaTitle || "Default Title"; // Устанавливаем мета-заголовок страницы

    // Специальная обработка для страницы логина и главной страницы
    if (component.renderPage && typeof component.renderPage === "function") {
      if (component.renderPage.toString().includes("renderLoginPage")) {
        // Для страницы логина вызываем функцию напрямую
        component.renderPage();
      } else if (component.constructor.name === "HomePage") {
        // Для главной страницы вызываем renderPage() напрямую (она сама управляет DOM)
        // renderPage теперь асинхронный, нужно дождаться его выполнения
        await component.renderPage();
      } else if (component.constructor.name === "TestPage") {
        // Проверяем, есть ли параметры теста в URL
        const urlParams = new URLSearchParams(window.location.search);
        const hasTestParams =
          urlParams.has("topicId") || urlParams.has("testCode");

        if (!hasTestParams) {
          // Если нет параметров теста, показываем сообщение и перенаправляем
          root.innerHTML = `
            <main id="test-page" class="container">
              <h1>Выберите тест</h1>
              <section>
                <div class="test-message">
                  <p>Для прохождения теста необходимо выбрать его на главной странице.</p>
                  <a href="/" class="back-to-home-btn">Вернуться на главную</a>
                </div>
              </section>
            </main>
          `;
        } else {
          // Для тестовой страницы вызываем renderPage() с параметрами по умолчанию
          component.renderPage(
            "Данные загружаются...",
            "Данные загружаются..."
          );

          // Вызываем init() для инициализации теста с задержкой для готовности DOM
          if (component.init && typeof component.init === "function") {
            setTimeout(() => {
              component.init();
            }, 100);
          }
        }
      } else {
        // Для обычных страниц сначала рендерим контент, затем проверяем, не изменился ли маршрут
        try {
          const pageContent = await component.renderPage();

          // Если в процессе рендера произошла смена маршрута (например, редирект из профиля в админ), не перезаписываем DOM
          if (window.location.pathname !== initialPath) {
            return;
          }

          // Проверяем, что pageContent не пустой
          if (pageContent) {
            root.innerHTML = pageContent;
          } else {
            console.warn("renderPage() вернул пустой контент для компонента:", component.constructor.name);
          }

          // Вызываем init() если он есть (для инициализации обработчиков событий)
          if (component.init && typeof component.init === "function") {
            component.init();
          }
        } catch (error) {
          console.error("Ошибка при рендеринге страницы:", error);
          const errorMessage = error.message || "Произошла ошибка при загрузке страницы";
          root.innerHTML = `
            <main class="container">
              <h1>Ошибка</h1>
              <section>
                <div class="error-message" style="padding: 20px; background-color: #fee; border: 1px solid #fcc; border-radius: 4px; margin: 20px 0;">
                  <h3>Ошибка загрузки страницы</h3>
                  <p>${errorMessage}</p>
                  <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Обновить страницу
                  </button>
                </div>
              </section>
            </main>
          `;
        }
      }
    }
  }
};

// Обновление активной ссылки в меню
const setActiveLink = (path = "/") => {
  const links = document.querySelectorAll(".menu__link");
  links.forEach((link) => {
    link.classList.toggle("active", path === link.getAttribute("href"));
  });
};

// Функция получения текущего пути
const getCurrentPath = () => {
  let path = window.location.pathname || "/";
  return path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
};

// Функция для перенаправления после успешного входа
export const loginAndRedirect = async () => {
  window.history.pushState({}, "", "/"); // Обновляем URL для главной страницы
  await Router(); // Перерисовываем содержимое страницы
};

// Счетчик вызовов Router
let routerCallCount = 0;

// Функция инициализации роутера
const Router = async (container = "content") => {
  routerCallCount++;
  const root = document.getElementById(container);
  if (!root) {
    return;
  }

  // Функция для получения текущего пути из URL
  let path = getCurrentPath();

  // Ранний редирект: если идем в профиль, но пользователь админ — сразу в /admin
  try {
    if (path === "/profile" && authService.isAuthenticated()) {
      const currentUser = await authService.getCurrentUser();
      if (
        currentUser?.success &&
        (currentUser.user?.role === "admin" ||
          currentUser.user?.email === "teacher@gmail.com")
      ) {
        window.history.pushState({}, "", "/admin");
        path = "/admin";
      }
    }
  } catch (e) {
    // Router admin redirect check failed - продолжаем обычную обработку
    console.warn("Ошибка при проверке прав администратора:", e);
  }

  // Получаем соответствующий компонент
  const component = getComponentFromPath(path);
  await updateDOM(root, component); // Перерисовываем содержимое
  setActiveLink(path); // Обновляем активные ссылки в меню
};

// Инициализация роутера при загрузке страницы
window.addEventListener("load", async () => await Router());

// Перерисовка контента при изменении истории
window.addEventListener("popstate", async () => await Router());

export default Router;
