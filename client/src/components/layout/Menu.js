import Section from "../../common/Section";
import { MENU_ITEMS } from "../../constants/constants.js"; // Импортируем константы
import MenuToggle from "./MenuToggle.js";
import logo from "../../assets/logo_vgik.png";

export default class Menu extends Section {
  constructor() {
    super({ id: "menu", customClass: "site-menu" });
    this.menuToggle = null;
  }

  render() {
    // Создаем HTML-код для пунктов меню на основе константы MENU_ITEMS
    const menuItemsHTML = MENU_ITEMS.map(
      (item) => `
      <li class="nav-item">
        <a href="${item.url}" class="nav-link menu-link">${item.title}</a>
      </li>
    `
    ).join("");

    return `
      <section id="${this.id}" class="${this.id} ${this.customClass}">
        <nav class="navbar navbar-expand-lg">
          <div class="container-fluid">
            <a href="/" class="menu-logo-link text-decoration-none">
              <img src="${logo}" alt="Логотип" class="menu-logo img-fluid" />
            </a>
            <button
              class="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
              <button
                class="navbar-close-btn"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarNav"
                aria-controls="navbarNav"
                aria-expanded="true"
                aria-label="Close navigation"
              >
                <span class="navbar-close-icon">×</span>
              </button>
              <ul class="navbar-nav mx-auto">
                ${menuItemsHTML} <!-- Вставляем сгенерированные пункты меню -->
              </ul>
            </div>
          </div>
        </nav>
      </section>
    `;
  }

  afterRender() {
    // Инициализируем класс для переключения между бургер-меню и крестиком
    this.menuToggle = new MenuToggle("navbarNav");

    // Обработчик клика на логотип в меню
    const menuLogoLink = document.querySelector(".menu-logo-link");
    if (menuLogoLink) {
      menuLogoLink.addEventListener("click", async (event) => {
        event.preventDefault();
        // Закрываем меню при клике на логотип (на мобильных устройствах)
        this.closeMenu();
        const currentPath = window.location.pathname;
        if (currentPath !== "/") {
          window.history.pushState({}, "", "/");
          const Router = (await import("../../router/index.js")).default;
          await Router("content");
        }
      });
    }
  }

  // Метод для закрытия меню (для использования извне)
  closeMenu() {
    const navbarCollapse = document.getElementById("navbarNav");
    if (!navbarCollapse) {
      return;
    }

    // Проверяем, открыто ли меню (только на мобильных устройствах)
    if (window.innerWidth > 991) {
      return; // На десктопе меню всегда видно, закрывать не нужно
    }

    // Если меню не открыто, ничего не делаем
    if (!navbarCollapse.classList.contains("show")) {
      return;
    }

    // Пробуем использовать MenuToggle, если он инициализирован
    if (this.menuToggle && this.menuToggle.closeMenu) {
      this.menuToggle.closeMenu();
      return;
    }

    // Fallback: закрываем через Bootstrap API напрямую
    if (!window.bootstrap || !window.bootstrap.Collapse) {
      // Если Bootstrap не загружен, просто убираем класс show
      navbarCollapse.classList.remove("show");
      return;
    }

    const bsCollapse = window.bootstrap.Collapse.getInstance(navbarCollapse);
    if (bsCollapse) {
      bsCollapse.hide();
    } else {
      const collapse = new window.bootstrap.Collapse(navbarCollapse, {
        toggle: false,
      });
      collapse.hide();
    }
  }
}

