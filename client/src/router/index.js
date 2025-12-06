/**
 * Улучшенный роутер
 * Использует конфигурацию маршрутов и middleware
 */

import authService from "../services/authService.js";
import errorHandler from "../services/errorHandler.js";
import {
  routes,
  getRoute,
  authMiddleware,
  adminRedirectMiddleware,
  specialRouteMiddleware,
} from "./routerConfig.js";

/**
 * Функция выхода пользователя
 */
const logoutUser = () => {
  authService.logout();
};

/**
 * Обновление активной ссылки в меню
 */
const setActiveLink = (path = "/") => {
  const links = document.querySelectorAll(".menu-link");
  links.forEach((link) => {
    link.classList.toggle("active", path === link.getAttribute("href"));
  });
};

/**
 * Получение текущего пути из URL
 */
const getCurrentPath = () => {
  let path = window.location.pathname || "/";
  return path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
};

/**
 * Применение middleware для маршрута
 */
const applyMiddleware = async (path, component, user = null) => {
  // Проверка авторизации
  const isAuthenticated = authService.isAuthenticated();
  const authResult = await authMiddleware(path, isAuthenticated);
  if (authResult) {
    return authResult;
  }

  // Проверка прав администратора
  if (user) {
    const adminResult = await adminRedirectMiddleware(path, user);
    if (adminResult) {
      return adminResult;
    }
  }

  // Специальная обработка маршрутов
  const specialResult = specialRouteMiddleware(path, component);
  if (specialResult) {
    return specialResult;
  }

  return null;
};

/**
 * Рендеринг компонента с обработкой ошибок
 */
const renderComponent = async (component, root, initialPath) => {
  document.title = component.metaTitle || "Default Title";

  // Специальная обработка для страницы логина
  if (
    component.renderPage &&
    typeof component.renderPage === "function" &&
    component.renderPage.toString().includes("renderLoginPage")
  ) {
    component.renderPage();
    return;
  }

  // Специальная обработка для главной страницы
  if (component.constructor.name === "HomePage") {
    await component.renderPage();
    return;
  }

  // Специальная обработка для TestPage
  if (component.constructor.name === "TestPage") {
    component.renderPage("Данные загружаются...", "Данные загружаются...");
    if (component.init && typeof component.init === "function") {
      setTimeout(() => {
        component.init();
      }, 100);
    }
    return;
  }

  // Обычная обработка для остальных страниц
  try {
    const pageContent = await component.renderPage();

    // Проверяем, не изменился ли маршрут во время рендеринга
    if (window.location.pathname !== initialPath) {
      return;
    }

    if (pageContent) {
      root.innerHTML = pageContent;
    } else {
      console.warn(
        "renderPage() вернул пустой контент для компонента:",
        component.constructor.name
      );
    }

    // Инициализация компонента
    if (component.init && typeof component.init === "function") {
      if (component.constructor.name === "AdminPage") {
        // Асинхронная инициализация для AdminPage
        component.init().catch((error) => {
          errorHandler.handle(error, "AdminPage.init");
        });
      } else {
        component.init();
      }
    }
  } catch (error) {
    errorHandler.handle(error, `renderPage.${component.constructor.name}`);
    const errorMessage = errorHandler.getErrorMessage(
      error,
      "Рендеринг страницы"
    );
    root.innerHTML = `
      <main class="container my-4">
        <h1 class="text-center mb-4">Ошибка</h1>
        <section>
          <div class="alert alert-danger" role="alert">
            <h4 class="alert-heading">Ошибка загрузки страницы</h4>
            <p>${errorMessage}</p>
            <hr>
            <button onclick="window.location.reload()" class="btn btn-primary">
              Обновить страницу
            </button>
          </div>
        </section>
      </main>
    `;
  }
};

/**
 * Основная функция роутера
 */
const Router = async (container = "content") => {
  const root = document.getElementById(container);
  if (!root) {
    return;
  }

  let path = getCurrentPath();

  // Обработка выхода
  if (path === "/logout") {
    logoutUser();
    return;
  }

  // Получаем конфигурацию маршрута
  const routeConfig = getRoute(path);
  let component = routeConfig.component;

  // Устанавливаем metaTitle из конфигурации маршрута, если компонент его не имеет
  if (routeConfig.metaTitle && !component.metaTitle) {
    component.metaTitle = routeConfig.metaTitle;
  }

  // Получаем данные пользователя для middleware
  let user = null;
  if (authService.isAuthenticated()) {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser?.success) {
        user = currentUser.user;
      }
    } catch (e) {
      errorHandler.log(e, "Router.getCurrentUser");
    }
  }

  // Применяем middleware
  const middlewareResult = await applyMiddleware(path, component, user);
  if (middlewareResult) {
    if (middlewareResult.redirect) {
      window.history.pushState({}, "", middlewareResult.redirect);
      path = middlewareResult.redirect;
    }
    if (middlewareResult.component) {
      component = middlewareResult.component;
      // Устанавливаем metaTitle для компонента из middleware, если нужно
      if (routeConfig.metaTitle && !component.metaTitle) {
        component.metaTitle = routeConfig.metaTitle;
      }
    }
  }

  // Рендерим компонент
  const initialPath = window.location.pathname;
  await renderComponent(component, root, initialPath);

  // Обновляем активные ссылки в меню
  setActiveLink(path);
};

// Инициализация роутера при загрузке страницы
window.addEventListener("load", async () => await Router());

// Перерисовка контента при изменении истории
window.addEventListener("popstate", async () => await Router());

// Функция для перенаправления после успешного входа
export const loginAndRedirect = async () => {
  window.history.pushState({}, "", "/");
  await Router();
};

export default Router;
