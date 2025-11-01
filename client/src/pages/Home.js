import Page from "../common/Page.js";
import Topics from "../components/Topics.js"; // Импорт компонента Topics

class HomePage extends Page {
  constructor() {
    super({
      id: "home",
      title: "Выберите формат проверки знаний", // Заголовок на странице
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
  renderPage() {
    this.cleanDynamicContent(); // Очищаем динамическую часть

    // Рендерим основную структуру через метод родительского класса Page
    const mainContent = this.render();

    // Находим элемент, куда нужно вставить контент
    const contentElement = document.getElementById("content");

    if (contentElement) {
      // Вставляем основной контент в элемент content
      contentElement.innerHTML = mainContent;

      // Далее ищем контейнер main и добавляем в него компонент Topics
      const mainContainer = document.querySelector("#home"); // Ищем элемент с id #home
      if (mainContainer) {
        // Вставляем отрендеренный компонент Topics внутрь секции в main
        const renderedTopics = this.topicsComponent.renderWithEvents();

        if (renderedTopics !== undefined) {
          mainContainer.querySelector("section").innerHTML = renderedTopics;
        }
      }
    }
    return "";
  }
}

export default HomePage;
