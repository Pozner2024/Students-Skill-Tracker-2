import Section from "../../common/Section";
import logo from "../../assets/logo_vgik.png";
import CubeLoader from "../ui/CubeLoader";

export default class Header extends Section {
  constructor() {
    super({ id: "header", customClass: "site-header" });
    this.cubeLoader = new CubeLoader(); // Создаем экземпляр CubeLoader
  }

  render() {
    return `
      <section id="${this.id}" class="${this.id} ${this.customClass}">
        <div class="container-fluid">
          <div class="header-content d-flex align-items-center justify-content-between">
            <a href="/" class="logo-link text-decoration-none flex-shrink-0">
              <img src="${logo}" alt="Логотип" class="logo img-fluid" id="logo" />
            </a>
            <h1 class="mb-0 text-end flex-grow-1 ms-3">Кондитер-Pro. Система контроля и оценки компетенций обучающихся по учебному предмету "Специальная технология"</h1>
          </div>
        </div>
      </section>
    `;
  }

  afterRender() {
    // Показываем лоадер сразу после рендеринга
    this.cubeLoader.show();

    // Ждем загрузку страницы и скрываем лоадер
    window.addEventListener("load", () => {
      this.cubeLoader.hide();
    });

    const logoElement = document.querySelector(".logo-link");

    if (logoElement) {
      logoElement.addEventListener("click", async (event) => {
        event.preventDefault();

        // Используем роутер вместо полной перезагрузки страницы
        const currentPath = window.location.pathname;
        if (currentPath !== "/") {
          window.history.pushState({}, "", "/");
          // Импортируем роутер динамически, чтобы избежать циклических зависимостей
          const Router = (await import("../../router/index.js")).default;
          await Router("content");
        }
      });
    }
  }
}
