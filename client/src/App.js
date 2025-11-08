import Router from "./router";
import authService from "./utils/authService.js";
import Header from "./components/Header";
import Menu from "./components/Menu";
import Footer from "./components/Footer";

import "./normalize.css";
import "./App.css";
import "./common/Modal.css";
import "./pages/TestPage.css";
import "./common/CubeLoader.css";
import "./components/SkillProgressBar.css";
import "./pages/LoginPage.css";
import "./pages/Profile.css";
import "./pages/Criteria.css";

const App = (root) => {
  // Обозначаем id контейнера для отрисовки страниц
  const containerId = "content";

  // Создаем экземпляры компонентов Header, Menu, Footer
  const headerComponent = new Header();
  const menuComponent = new Menu();
  const footerComponent = new Footer();

  // Отрисовываем статические компоненты (Header, Menu, Footer) и контейнер для страниц
  root.insertAdjacentHTML(
    "beforeend",
    `
    ${headerComponent.render()}   <!-- Отображаем Header -->
    ${menuComponent.render()}     <!-- Отображаем Menu -->
    <section id="${containerId}" class="content"></section>
    ${footerComponent.render()}   <!-- Отображаем Footer -->
    `
  );

  // Инициализируем роутер при первой загрузке
  Router(containerId);

  // Обработка навигации через popstate (переход по ссылкам назад/вперед)
  window.addEventListener("popstate", () => Router(containerId));

  // Перехватываем все клики по ссылкам меню для работы с роутером
  document.body.addEventListener("click", async (event) => {
    const el = event.target;
    if (el.classList.contains("menu__link")) {
      event.preventDefault(); // Отменяем переход по ссылке

      // Обновляем URL через history.pushState
      let href = el.getAttribute("href");

      // Если админ кликает на профиль, перенаправляем сразу в /admin (без промежуточного /profile)
      try {
        if (href === "/profile" && authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          if (
            currentUser?.success &&
            (currentUser.user?.role === "admin" ||
              currentUser.user?.email === "teacher@gmail.com")
          ) {
            href = "/admin";
          }
        }
      } catch (e) {
        // Menu admin redirect check failed
      }

      window.history.pushState({}, "", href); // Обновляем URL без перезагрузки страницы

      // Обновляем контент страницы, вызывая роутер с контейнером
      Router(containerId);
    }
  });
}; // Закрываем функцию App

export default App;
