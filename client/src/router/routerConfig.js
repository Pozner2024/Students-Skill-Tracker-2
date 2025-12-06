/**
 * Конфигурация маршрутов
 * Централизованное определение всех маршрутов приложения
 */

import Home from "../pages/Home.js";
import About from "../pages/About.js";
import Contacts from "../pages/Contacts.js";
import CriteriaPage from "../pages/Criteria.js";
import ProfilePage from "../pages/Profile.js";
import AdminPage from "../pages/Admin.js";
import Error404 from "../pages/Error404.js";
import TestPage from "../pages/TestPage.js";
import { renderLoginPage } from "../pages/LoginPage.js";

/**
 * Middleware для проверки авторизации
 * @param {string} path - Путь маршрута
 * @param {boolean} isAuthenticated - Авторизован ли пользователь
 * @returns {object|null} Редирект или null
 */
export const authMiddleware = async (path, isAuthenticated) => {
  // Публичные маршруты (не требуют авторизации)
  const publicRoutes = ["/login", "/about", "/contacts"];

  // Если пользователь не авторизован и пытается попасть на защищенный маршрут
  if (!isAuthenticated && !publicRoutes.includes(path)) {
    return {
      redirect: "/login",
      component: { renderPage: () => renderLoginPage() },
    };
  }

  // Если пользователь авторизован и пытается попасть на страницу логина
  if (isAuthenticated && path === "/login") {
    return {
      redirect: "/",
      component: new Home(),
    };
  }

  return null;
};

/**
 * Middleware для проверки прав доступа (админ)
 * @param {string} path - Путь маршрута
 * @param {object} user - Данные пользователя
 * @returns {object|null} Редирект или null
 */
export const adminRedirectMiddleware = async (path, user) => {
  // Если пользователь админ и пытается попасть на /profile
  if (path === "/profile" && user?.role === "admin") {
    return {
      redirect: "/admin",
      component: new AdminPage(),
    };
  }

  return null;
};

/**
 * Middleware для специальной обработки маршрутов
 * @param {string} path - Путь маршрута
 * @param {object} component - Компонент маршрута
 * @returns {object|null} Модифицированный компонент или null
 */
export const specialRouteMiddleware = (path, component) => {
  // Специальная обработка для TestPage
  if (component.constructor.name === "TestPage") {
    const urlParams = new URLSearchParams(window.location.search);
    const hasTestParams =
      urlParams.has("topicId") || urlParams.has("testCode");

    if (!hasTestParams) {
      return {
        component: {
          renderPage: () => `
            <main id="test-page" class="container my-4">
              <h1 class="text-center mb-4">Выберите тест</h1>
              <section>
                <div class="alert alert-info" role="alert">
                  <p class="mb-0">Для прохождения теста необходимо выбрать его на главной странице.</p>
                  <hr>
                  <a href="/" class="btn btn-primary">Вернуться на главную</a>
                </div>
              </section>
            </main>
          `,
        },
      };
    }
  }

  return null;
};

/**
 * Конфигурация маршрутов
 */
export const routes = {
  "/": {
    component: Home,
    public: false,
    metaTitle: "Главная",
  },
  "/about": {
    component: About,
    public: true,
    metaTitle: "О проекте",
  },
  "/contacts": {
    component: Contacts,
    public: true,
    metaTitle: "Контакты",
  },
  "/criteria": {
    component: CriteriaPage,
    public: false,
    metaTitle: "Оценочные критерии",
  },
  "/profile": {
    component: ProfilePage,
    public: false,
    metaTitle: "Личный кабинет",
    middleware: [adminRedirectMiddleware],
  },
  "/admin": {
    component: AdminPage,
    public: false,
    metaTitle: "Кабинет администратора",
  },
  "/test-page": {
    component: TestPage,
    public: false,
    metaTitle: "Тест",
    middleware: [specialRouteMiddleware],
  },
  "/login": {
    component: { renderPage: () => renderLoginPage() },
    public: true,
    metaTitle: "Вход",
  },
};

/**
 * Получить компонент для маршрута
 * @param {string} path - Путь маршрута
 * @returns {object} Конфигурация маршрута или 404
 */
export const getRoute = (path) => {
  const route = routes[path];
  if (route) {
    return {
      ...route,
      component:
        typeof route.component === "function"
          ? new route.component()
          : route.component,
    };
  }

  // 404
  return {
    component: new Error404(),
    public: false,
    metaTitle: "Страница не найдена",
  };
};

