import TestQuestion from "../components/test/TestQuestion";
import Pagination from "../components/ui/Pagination";
import createCubeLoader from "../components/ui/CubeLoader";
import background from "../assets/background1.jpg";

// Страница прохождения теста: инициализирует компоненты вопросов и пагинации,
// управляет навигацией между вопросами и обработкой ответов пользователя
class TestPage {
  constructor({
    id = "test-page",
    content = "Данные загружаются...",
    metaTitle = "Данные загружаются...",
  } = {}) {
    this.id = id;
    this.content = content;
    this.metaTitle = metaTitle;
    this.testQuestion = null;
    this.pagination = null;
    this.loader = createCubeLoader();
  }

  renderPageStructure(
    title = "Данные загружаются...",
    variant = "Данные загружаются..."
  ) {
    document.title = this.metaTitle;

    return `
      <main id="${this.id}" class="container my-4">
        <div class="test-page-styles">
          <div class="test-info">
            <h2>${title}</h2>
            <p>Вариант: ${variant}</p>
          </div>
          <div id="indicator-panel" class="indicator-panel"></div>
          <div id="questions-panel" class="questions-panel"></div>
          <div class="navigation-panel">
            <button id="prevButton" class="nav-button">Назад</button>
            <button id="nextButton" class="nav-button">Вперед</button>
            <button id="finishButton" class="nav-button finish-button">Завершить тест и показать результаты теста</button>
          </div>
        </div>
      </main>
    `;
  }

  renderLoadingPage() {
    const contentElement = document.getElementById("content");
    if (contentElement) {
      contentElement.innerHTML = this.renderPageStructure();
    }
  }

  renderPage(title, variant) {
    const contentElement = document.getElementById("content");
    this.metaTitle = title;
    document.title = this.metaTitle;
    if (contentElement) {
      contentElement.innerHTML = this.renderPageStructure(title, variant);

      const testPageStyles = contentElement.querySelector(".test-page-styles");
      if (testPageStyles) {
        testPageStyles.style.backgroundImage = `url(${background})`;
        testPageStyles.style.backgroundSize = "cover";
        testPageStyles.style.backgroundPosition = "center";
        testPageStyles.style.backgroundRepeat = "no-repeat";
      }
    }
  }

  async init() {
    this.loader.show();

    try {
      this.renderLoadingPage();

      await new Promise((resolve) => setTimeout(resolve, 100));

      this.testQuestion = new TestQuestion("questions-panel");
      await this.testQuestion.initialize();

      const title = this.testQuestion.testInstance?.testTitle || "Тест";
      const variant = this.testQuestion.testInstance?.variant || "1";

      this.renderPage(title, variant);

      await new Promise((resolve) => setTimeout(resolve, 100));

      if (this.testQuestion.navigator && this.testQuestion.testInstance) {
        const totalQuestions = this.testQuestion.getTotalQuestions();

        if (totalQuestions > 0) {
          this.pagination = new Pagination(totalQuestions, "indicator-panel");

          this.pagination.onPageChange = (pageIndex) => {
            this.testQuestion.navigator.navigateToQuestion(pageIndex, true);
          };

          this.testQuestion.renderCurrentQuestion(
            this.testQuestion.navigator.currentQuestionIndex
          );
          this.pagination.changePage(
            this.testQuestion.navigator.currentQuestionIndex
          );

          const prevButton = document.getElementById("prevButton");
          const nextButton = document.getElementById("nextButton");
          const finishButton = document.getElementById("finishButton");

          if (prevButton) {
            prevButton.onclick = () => {
              this.testQuestion.showPreviousQuestion();
              this.pagination.changePage(
                this.testQuestion.navigator.currentQuestionIndex
              );
            };
          }

          if (nextButton) {
            nextButton.onclick = () => {
              this.testQuestion.showNextQuestion();
              this.pagination.changePage(
                this.testQuestion.navigator.currentQuestionIndex
              );
            };
          }

          if (finishButton) {
            finishButton.onclick = () => {
              this.testQuestion.submitAllAnswers();
            };
          }
        }
      }
    } catch (error) {
    } finally {
      this.loader.hide();
    }
  }
}

export default TestPage;

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("/test")) {
    const testPage = new TestPage({
      metaTitle: "Данные загружаются...",
    });
    testPage.init();
  }
});
