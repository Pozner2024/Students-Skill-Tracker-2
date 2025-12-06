import Page from "../common/Page.js";
import Topics from "../components/topics/Topics.js"; // Импорт компонента Topics

class HomePage extends Page {
  constructor() {
    super({
      id: "home",
      title: "Каталог тем", // Заголовок на странице
      content: "",
      metaTitle: "Главная страница", // Мета-заголовок
    });

    this.topicsComponent = new Topics(); // Создаем экземпляр Topics
  }

  // Метод для очистки динамического контента
  cleanDynamicContent() {
    const root = document.getElementById("root");
    if (root) {
      root
        .querySelectorAll(".rectangles-container")
        .forEach((el) => el.remove());
    }
  }

  // Метод для рендеринга страницы
  async renderPage() {
    // Находим элемент, куда нужно вставить контент
    const contentElement = document.getElementById("content");
    if (!contentElement) {
      return "";
    }

    try {
      // Загружаем темы заранее, чтобы избежать задержек
      await this.topicsComponent.loadTopics();

      // Рендерим Topics компонент
      const topicsContent = this.topicsComponent.render();

      // Рендерим основную структуру через метод родительского класса Page
      // Вставляем контент Topics сразу в структуру страницы
      const mainContent = `
        <main id="${this.id}" class="container my-4">
          <h1 class="text-center mb-4">${this.title}</h1>
          <section>${topicsContent}</section>
        </main>
      `;

      // Очищаем динамическую часть только после подготовки нового контента
      this.cleanDynamicContent();

      // Вставляем весь контент сразу, чтобы избежать множественных перерисовок
      contentElement.innerHTML = mainContent;

      // Используем requestAnimationFrame для плавного обновления DOM
      await new Promise((resolve) => requestAnimationFrame(resolve));

      // Добавляем обработчики событий после рендеринга
      this.topicsComponent.addEventListeners();
    } catch (error) {
      console.error("Ошибка при загрузке тем:", error);
      // Отображаем сообщение об ошибке пользователю
      const errorMessage =
        error.message ||
        "Не удалось загрузить тесты. Пожалуйста, обновите страницу.";
      contentElement.innerHTML = `
        <main id="${this.id}" class="container my-4">
          <h1 class="text-center mb-4">${this.title}</h1>
          <section>
            <div class="alert alert-danger" role="alert">
              <h4 class="alert-heading">Ошибка загрузки тестов</h4>
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

    return "";
  }
}

export default HomePage;
