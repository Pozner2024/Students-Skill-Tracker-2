// Главная страница приложения, отображающая каталог доступных тем для тестирования
import Page from "../../common/Page.js";
import Topics from "../../components/topics/Topics.js";
import "../../components/ui/CubeLoader";

class HomePage extends Page {
  constructor() {
    super({
      id: "home",
      title: "Каталог тем",
      content: "",
      metaTitle: "Главная страница",
    });

    this.manualRender = true;
    this.topicsComponent = new Topics();
  }

  cleanDynamicContent() {
    const root = document.getElementById("root");
    if (root) {
      root
        .querySelectorAll(".rectangles-container")
        .forEach((el) => el.remove());
    }
  }

  async renderPage() {
    const contentElement = document.getElementById("content");
    if (!contentElement) {
      return "";
    }

    let loaderTimeout = null;
    let loaderShown = false;
    loaderTimeout = setTimeout(() => {
      loaderShown = true;
      window.loader.show();
    }, 200);

    try {
      await this.topicsComponent.loadTopics();

      const topicsContent = this.topicsComponent.render();

      const mainContent = `
        <main id="${this.id}" class="container my-4">
          <h1 class="text-center mb-4">${this.title}</h1>
          <section>${topicsContent}</section>
        </main>
      `;

      this.cleanDynamicContent();

      contentElement.innerHTML = mainContent;

      await new Promise((resolve) => requestAnimationFrame(resolve));

      this.topicsComponent.addEventListeners();
    } catch (error) {
      console.error("Ошибка при загрузке тем:", error);
      const errorMessage =
        error.message ||
        "Не удалось загрузить тесты. Пожалуйста, обновите страницу.";
      this.renderErrorView(contentElement, errorMessage);
    } finally {
      if (loaderTimeout) {
        clearTimeout(loaderTimeout);
        loaderTimeout = null;
      }
      if (loaderShown) {
        window.loader.hide();
      }
    }

    return "";
  }

  renderErrorView(container, errorMessage) {
    container.innerHTML = "";

    const main = document.createElement("main");
    main.id = this.id;
    main.className = "container my-4";

    const titleEl = document.createElement("h1");
    titleEl.className = "text-center mb-4";
    titleEl.textContent = this.title;

    const section = document.createElement("section");

    const alert = document.createElement("div");
    alert.className = "alert alert-danger";
    alert.setAttribute("role", "alert");

    const heading = document.createElement("h4");
    heading.className = "alert-heading";
    heading.textContent = "Ошибка загрузки тестов";

    const message = document.createElement("p");
    message.textContent = errorMessage;

    const hr = document.createElement("hr");

    const button = document.createElement("button");
    button.className = "btn btn-primary";
    button.textContent = "Повторить загрузку";
    button.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = "Обновление...";
      await this.renderPage();
    });

    alert.append(heading, message, hr, button);
    section.appendChild(alert);
    main.append(titleEl, section);
    container.appendChild(main);
  }
}

export default HomePage;
