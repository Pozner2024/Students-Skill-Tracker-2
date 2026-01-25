// Конфигурация маршрутов приложения: определение всех маршрутов, middleware для проверки авторизации и прав доступа
import Home from "../pages/Home/Home.js";
import About from "../pages/About/About.js";
import Contacts from "../pages/Contacts/Contacts.js";
import CriteriaPage from "../pages/Criteria/Criteria.js";
import ProfilePage from "../pages/Profile/ProfilePage.js";
import AdminPage from "../pages/Admin/Admin.js";
import Error404 from "../pages/Error404/Error404.js";
import TestPage from "../pages/TestPage/TestPage.js";
import TopicPage from "../pages/TopicPage/TopicPage.js";
import { renderLoginPage } from "../pages/LoginPage/LoginPage.js";

export const authMiddleware = async (path, isAuthenticated) => {
  const publicRoutes = ["/login", "/about", "/contacts"];

  if (!isAuthenticated && !publicRoutes.includes(path)) {
    return {
      redirect: "/login",
      component: { renderPage: renderLoginPage, manualRender: true },
    };
  }

  if (isAuthenticated && path === "/login") {
    return {
      redirect: "/",
      component: new Home(),
    };
  }

  return null;
};

export const adminRedirectMiddleware = async (path, user) => {
  if (path === "/profile" && user?.role === "admin") {
    return {
      redirect: "/admin",
      component: new AdminPage(),
    };
  }

  return null;
};

export const specialRouteMiddleware = (path, component) => {
  if (component.constructor.name === "TestPage") {
    const urlParams = new URLSearchParams(window.location.search);
    const hasTestParams = urlParams.has("topicId") || urlParams.has("testCode");

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
  "/topic": {
    component: TopicPage,
    public: false,
    metaTitle: "Информация о теме",
  },
  "/login": {
    component: { renderPage: renderLoginPage, manualRender: true },
    public: true,
    metaTitle: "Вход",
  },
};

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

  return {
    component: new Error404(),
    public: false,
    metaTitle: "Страница не найдена",
  };
};
