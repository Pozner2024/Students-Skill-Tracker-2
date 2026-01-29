import TestQuestion from "../../components/test/TestQuestion";
import Pagination from "../../components/ui/Pagination";
import "../../components/ui/CubeLoader";
import background from "../../assets/background1.jpg";

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
    this.manualRender = true;
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
            <h2>${title}: <span class="variant-text">Вариант ${variant}</span></h2>
          </div>
          <div id="indicator-panel" class="indicator-panel">
            <button id="finishButton" class="nav-button finish-button">Результаты</button>
          </div>
          <div id="questions-panel" class="questions-panel"></div>
          <div class="navigation-panel">
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

  renderPage(
    title = "Данные загружаются...",
    variant = "Данные загружаются..."
  ) {
    const contentElement = document.getElementById("content");
    const normalizedTitle = (title || "").replace(/^Тема:?\s*/i, "");
    this.metaTitle = `${normalizedTitle}: Вариант ${variant}`;
    document.title = this.metaTitle;
    if (contentElement) {
      contentElement.innerHTML = this.renderPageStructure(
        normalizedTitle,
        variant
      );

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
    window.loader.show();

    // Таймаут для всего процесса инициализации (60 секунд)
    const initTimeout = setTimeout(() => {
      console.error("TestPage: Превышено время инициализации");
      window.loader.hide();
    }, 60000);

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
          // Сохраняем кнопку "Результаты" перед созданием пагинации
          const indicatorPanel = document.getElementById("indicator-panel");
          const finishButton = indicatorPanel
            ? indicatorPanel.querySelector("#finishButton")
            : null;

          this.pagination = new Pagination(totalQuestions, "indicator-panel");

          // Восстанавливаем кнопку "Результаты" после создания пагинации
          if (finishButton && indicatorPanel) {
            const finishButtonElement = document.createElement("button");
            finishButtonElement.id = "finishButton";
            finishButtonElement.className = "nav-button finish-button";
            finishButtonElement.textContent = "Результаты";
            indicatorPanel.appendChild(finishButtonElement);
          }

          this.pagination.onPageChange = (pageIndex) => {
            this.testQuestion.navigator.navigateToQuestion(pageIndex, true);
          };

          // Устанавливаем callback для обновления pagination
          this.testQuestion.setPaginationUpdateCallback((index) => {
            this.pagination.changePage(index);
          });

          this.testQuestion.renderCurrentQuestion(
            this.testQuestion.navigator.currentQuestionIndex
          );
          this.pagination.changePage(
            this.testQuestion.navigator.currentQuestionIndex
          );

          const restoredFinishButton = document.getElementById("finishButton");
          if (restoredFinishButton) {
            restoredFinishButton.onclick = () => {
              this.testQuestion.submitAllAnswers();
            };
          }
        }
      }
    } catch (error) {
      console.error("TestPage: Ошибка при инициализации:", error);
    } finally {
      clearTimeout(initTimeout);
      window.loader.hide();
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
