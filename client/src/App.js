import Router from "./router/index.js";
import Header from "./components/layout/Header";
import Menu from "./components/layout/Menu";
import Footer from "./components/layout/Footer";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./normalize.css";
import "./App.css"; /* Импортирует все модули стилей */
import "./common/Modal.css";
import "./pages/TestPage.css";
import "./components/ui/CubeLoader.css";
import "./components/ui/SkillProgressBar.css";
import "./pages/LoginPage.css";
import "./pages/Profile/Profile.css";
import "./pages/Criteria.css";
import "./pages/Contacts.css";
import "./pages/About.css";
import "./pages/Home.css";
import "./pages/Admin.css";
import "./pages/TopicPage.css";

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

  // Вызываем afterRender для компонентов после вставки в DOM
  // Используем setTimeout для гарантии, что DOM готов
  setTimeout(() => {
    if (
      headerComponent.afterRender &&
      typeof headerComponent.afterRender === "function"
    ) {
      headerComponent.afterRender();
    }
    if (
      menuComponent.afterRender &&
      typeof menuComponent.afterRender === "function"
    ) {
      menuComponent.afterRender();
    }
  }, 0);

  // Инициализируем роутер при первой загрузке
  Router(containerId);

  // Обработка навигации через popstate (переход по ссылкам назад/вперед)
  window.addEventListener("popstate", () => Router(containerId));

  // Перехватываем все клики по ссылкам меню для работы с роутером
  document.body.addEventListener("click", (event) => {
    // Проверяем, что клик произошел на ссылке меню или внутри неё
    const menuLink = event.target.closest(".menu-link");
    if (menuLink) {
      event.preventDefault(); // Отменяем переход по ссылке

      // Закрываем меню при клике на ссылку (на мобильных устройствах)
      // Используем небольшую задержку для гарантии, что Bootstrap обработал клик
      setTimeout(() => {
        menuComponent.closeMenu();
      }, 10);

      // Обновляем URL через history.pushState
      const href = menuLink.getAttribute("href");

      window.history.pushState({}, "", href); // Обновляем URL без перезагрузки страницы

      // Обновляем контент страницы, вызывая роутер с контейнером
      Router(containerId);
    }
  });
}; // Закрываем функцию App

export default App;
