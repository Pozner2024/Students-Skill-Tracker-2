// Рендерит верхнее меню: собирает пункты из MENU_ITEMS, управляет
// мобильным burger/collapse через MenuToggle или клики по close-btn

import Section from "../../common/Section";
import { MENU_ITEMS } from "../../constants/constants.js";
import MenuToggle from "./MenuToggle.js";
import logo from "../../assets/logo_vgik.png";

export default class Menu extends Section {
  constructor() {
    super({ id: "menu", customClass: "site-menu" });
    this.menuToggle = null;
    this.root = null;
    this.navbarCollapse = null;
    this.menuLogoLink = null;
    this.menuLinks = null;

    this.handleLogoClick = this.handleLogoClick.bind(this);
    this.handleLinkClick = this.handleLinkClick.bind(this);
    this.handleEscape = this.handleEscape.bind(this);
  }

  render() {
    const menuItemsHTML = MENU_ITEMS.map(
      (item) => `
        <li class="nav-item">
          <a href="${item.url}" class="nav-link menu-link">${item.title}</a>
        </li>
      `
    ).join("");

    return `
      <section id="${this.id}" class="${this.id} ${this.customClass}">
        <nav class="navbar navbar-expand-lg" aria-label="Главная навигация">
          <div class="container-fluid">
            <a href="/" class="menu-logo-link text-decoration-none" aria-label="На главную">
              <img src="${logo}" alt="Логотип" class="menu-logo img-fluid" />
            </a>

            <button
              class="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Открыть меню"
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
                aria-label="Закрыть меню"
              >
                <span class="navbar-close-icon">×</span>
              </button>

              <ul class="navbar-nav mx-auto">
                ${menuItemsHTML}
              </ul>
            </div>
          </div>
        </nav>
      </section>
    `;
  }

  afterRender() {
    this.root = document.getElementById(this.id);
    if (!this.root) return;

    this.removeListeners();

    this.navbarCollapse = this.root.querySelector("#navbarNav");
    this.menuLogoLink = this.root.querySelector(".menu-logo-link");
    this.menuLinks = Array.from(this.root.querySelectorAll(".menu-link"));

    try {
      this.menuToggle = new MenuToggle("navbarNav");
    } catch (err) {
      this.menuToggle = null;
    }

    if (this.menuLogoLink) {
      this.menuLogoLink.addEventListener("click", this.handleLogoClick);
    }

    if (this.menuLinks && this.menuLinks.length) {
      this.menuLinks.forEach((link) =>
        link.addEventListener("click", this.handleLinkClick)
      );
    }

    document.addEventListener("keydown", this.handleEscape);
  }

  async handleLogoClick(event) {
    event.preventDefault();
    this.closeMenu();

    const currentPath = window.location.pathname;
    if (currentPath !== "/") {
      window.history.pushState({}, "", "/");
      const Router = (await import("../../router/index.js")).default;
      await Router("content");
    }
  }

  async handleLinkClick(event) {
    const anchor = event.currentTarget;
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    const target = anchor.getAttribute("target");
    if (!href || href.startsWith("http") || target === "_blank") {
      return;
    }

    event.preventDefault();
    this.closeMenu();

    if (window.location.pathname !== href) {
      window.history.pushState({}, "", href);
      const Router = (await import("../../router/index.js")).default;
      await Router("content");
    }
  }

  handleEscape(event) {
    if (event.key === "Escape" || event.key === "Esc") {
      if (
        this.navbarCollapse &&
        this.navbarCollapse.classList.contains("show") &&
        window.innerWidth <= 991
      ) {
        this.closeMenu();
      }
    }
  }

  closeMenu() {
    if (!this.navbarCollapse || window.innerWidth > 991) return;
    if (!this.navbarCollapse.classList.contains("show")) return;

    const closeBtn = this.root?.querySelector(".navbar-close-btn");
    if (closeBtn) {
      closeBtn.click();
      return;
    }

    this.navbarCollapse.classList.remove("show");
  }

  removeListeners() {
    if (this.menuLogoLink) {
      this.menuLogoLink.removeEventListener("click", this.handleLogoClick);
    }

    if (this.menuLinks && this.menuLinks.length) {
      this.menuLinks.forEach((link) =>
        link.removeEventListener("click", this.handleLinkClick)
      );
    }

    document.removeEventListener("keydown", this.handleEscape);
  }

  destroy() {
    this.removeListeners();

    if (this.menuToggle && typeof this.menuToggle.destroy === "function") {
      try {
        this.menuToggle.destroy();
      } catch (err) {}
    }

    this.root = null;
    this.navbarCollapse = null;
    this.menuLogoLink = null;
    this.menuLinks = null;
    this.menuToggle = null;
  }
}
