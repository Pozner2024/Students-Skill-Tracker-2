import Section from "../../common/Section";
import logo from "../../assets/logo_vgik.png";
import "../ui/CubeLoader";

export default class Header extends Section {
  constructor() {
    super({ id: "header", customClass: "site-header" });
    this.handleWindowLoad = this.handleWindowLoad.bind(this);
    this.handleLogoClick = this.handleLogoClick.bind(this);
    this.isLoadListenerAttached = false;
    this.logoElement = null;
  }

  render() {
    return `
      <section id="${this.id}" class="${this.id} ${this.customClass}">
        <div class="container-fluid">
          <div class="header-content d-flex align-items-center justify-content-between">
            <a href="/" class="logo-link text-decoration-none flex-shrink-0">
              <img src="${logo}" alt="Логотип" class="logo img-fluid" id="logo" />
            </a>
            <h1 class="text-end flex-grow-1 ms-3">
              <span class="header-title-line header-title-main">Кондитер-Pro</span>
              <span class="header-title-line">Контроль и оценка компетенций обучающихся</span>
              <span class="header-title-line">по учебному предмету "Специальная технология"</span>
            </h1>
          </div>
        </div>
      </section>
    `;
  }

  afterRender() {
    this.removeListeners();

    
    if (document.readyState === 'loading') {
      window.loader.show();
      window.addEventListener("load", this.handleWindowLoad, { once: true });
      this.isLoadListenerAttached = true;
    } else {
      
    }

    this.logoElement = document.querySelector(".logo-link");

    if (this.logoElement) {
      this.logoElement.addEventListener("click", this.handleLogoClick);
    }
  }

  handleWindowLoad() {
    window.loader.hide();
    this.isLoadListenerAttached = false;
  }

  async handleLogoClick(event) {
    event.preventDefault();

    const currentPath = window.location.pathname;
    if (currentPath !== "/") {
      window.history.pushState({}, "", "/");

      const Router = (await import("../../router/index.js")).default;
      await Router("content");
    }
  }

  removeListeners() {
    if (this.isLoadListenerAttached) {
      window.removeEventListener("load", this.handleWindowLoad);
      this.isLoadListenerAttached = false;
    }

    if (this.logoElement) {
      this.logoElement.removeEventListener("click", this.handleLogoClick);
      this.logoElement = null;
    }
  }
}
