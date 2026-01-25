// Роутер приложения: управляет маршрутизацией, применяет middleware
// для проверки авторизации и прав доступа, рендерит соответствующие компоненты страниц
import authService from "../services/authService.js";
import errorHandler from "../services/errorHandler.js";
import {
  routes,
  getRoute,
  authMiddleware,
  adminRedirectMiddleware,
  specialRouteMiddleware,
} from "./routerConfig.js";

const logoutUser = () => {
  authService.logout();
};

const setActiveLink = (path = "/") => {
  const links = document.querySelectorAll(".menu-link");
  links.forEach((link) => {
    link.classList.toggle("active", path === link.getAttribute("href"));
  });
};

const getCurrentPath = () => {
  const path = window.location.pathname || "/";
  return path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
};

const applyMiddleware = async (path, component, user = null) => {
  const isAuthenticated = authService.isAuthenticated();
  const authResult = await authMiddleware(path, isAuthenticated);
  if (authResult) {
    return authResult;
  }

  if (user) {
    const adminResult = await adminRedirectMiddleware(path, user);
    if (adminResult) {
      return adminResult;
    }
  }

  const specialResult = specialRouteMiddleware(path, component);
  if (specialResult) {
    return specialResult;
  }

  return null;
};

const renderComponent = async (component, root, initialPath) => {
  document.title = component.metaTitle || "Default Title";

  if (
    component.manualRender &&
    component.renderPage &&
    typeof component.renderPage === "function"
  ) {
    component.renderPage();
    return;
  }

  if (component.constructor.name === "HomePage") {
    await component.renderPage();
    return;
  }

  if (component.constructor.name === "TestPage") {
    component.renderPage("Данные загружаются...", "Данные загружаются...");
    if (component.init && typeof component.init === "function") {
      setTimeout(() => {
        component.init();
      }, 100);
    }
    return;
  }

  try {
    const pageContent = await component.renderPage();

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

    if (component.init && typeof component.init === "function") {
      if (component.constructor.name === "AdminPage") {
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

const Router = async (container = "content") => {
  const root = document.getElementById(container);
  if (!root) {
    return;
  }

  let path = getCurrentPath();

  if (path === "/logout") {
    logoutUser();
    return;
  }

  const routeConfig = getRoute(path);
  let component = routeConfig.component;

  if (routeConfig.metaTitle && !component.metaTitle) {
    component.metaTitle = routeConfig.metaTitle;
  }

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

  const middlewareResult = await applyMiddleware(path, component, user);
  if (middlewareResult) {
    if (middlewareResult.redirect) {
      window.history.pushState({}, "", middlewareResult.redirect);
      path = middlewareResult.redirect;
    }
    if (middlewareResult.component) {
      component = middlewareResult.component;
      if (routeConfig.metaTitle && !component.metaTitle) {
        component.metaTitle = routeConfig.metaTitle;
      }
    }
  }

  const initialPath = window.location.pathname;
  await renderComponent(component, root, initialPath);

  setActiveLink(path);
};

window.addEventListener("load", Router);

window.addEventListener("popstate", Router);

export const loginAndRedirect = async () => {
  window.history.pushState({}, "", "/");
  await Router();
};

export default Router;
