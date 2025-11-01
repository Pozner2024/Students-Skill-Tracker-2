import Section from "../common/Section";
import logo from "../assets/logo_vgik.png";
import CubeLoader from "../common/CubeLoader";

export default class Header extends Section {
  constructor() {
    super({ id: "header", customClass: "site-header" });
    this.cubeLoader = new CubeLoader(); // Создаем экземпляр CubeLoader
  }

  render() {
    return `
      <section id="${this.id}" class="${this.id} ${this.customClass}">
        <a href="/" id="logo-link">
          <img src="${logo}" alt="Логотип" class="logo" id="logo" />
        </a>
        <h1>Система контроля и оценки компетенций обучающихся по учебному предмету "Специальная технология"</h1>
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

    const logoElement = document.getElementById("logo-link");

    if (logoElement) {
      logoElement.addEventListener("click", (event) => {
        event.preventDefault();
        this.cubeLoader.show(); // Показываем лоадер при клике на логотип
        window.location.href = "/";
      });
    }
  }
}
