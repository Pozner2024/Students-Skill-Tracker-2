// // QuestionNavigator управляет навигацией по вопросам в тесте, интегрируясь с компонентом Pagination.
// //Он позволяет переключаться между вопросами, отслеживать текущий и посещенные вопросы,
// //а также обновлять пагинацию. Методы включают переход к следующему или предыдущему вопросу,
// //обновление текущего вопроса и синхронизацию состояния пагинации.

import Pagination from "../ui/Pagination";

class QuestionNavigator {
  constructor(totalQuestions, onNavigate, onFinish) {
    if (typeof totalQuestions !== "number" || totalQuestions <= 0) {
      return;
    }

    this.totalQuestions = totalQuestions;
    this.currentQuestionIndex = 0;

    try {
      this.pagination = new Pagination(totalQuestions, "indicator-panel");
    } catch (error) {}

    this.onNavigate = typeof onNavigate === "function" ? onNavigate : () => {};
    this.onFinish = typeof onFinish === "function" ? onFinish : () => {};

    if (this.pagination) {
      this.pagination.onPageChange = (pageIndex) => {
        if (pageIndex !== this.currentQuestionIndex) {
          this.navigateToQuestion(pageIndex, true);
        }
      };
    }

    const finishButton = document.getElementById("finishButton");
    if (finishButton) {
      finishButton.onclick = () => {
        this.onFinish();
      };
    }
  }

  getTotalQuestions() {
    return this.totalQuestions;
  }

  navigateToQuestion(index, fromPagination = false) {
    if (
      index >= 0 &&
      index < this.totalQuestions &&
      index !== this.currentQuestionIndex
    ) {
      const previousIndex = this.currentQuestionIndex;
      this.currentQuestionIndex = index;
      this.onNavigate(this.currentQuestionIndex, previousIndex);

      if (!fromPagination) {
        this.updatePagination();
      }
    }
  }

  showNextQuestion() {
    if (this.currentQuestionIndex < this.totalQuestions - 1) {
      this.navigateToQuestion(this.currentQuestionIndex + 1);
    }
  }

  showPreviousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.navigateToQuestion(this.currentQuestionIndex - 1);
    }
  }

  updatePagination() {
    if (this.pagination) {
      if (
        typeof this.pagination.changePage === "function" &&
        typeof this.pagination.markAsVisited === "function"
      ) {
        this.pagination.changePage(this.currentQuestionIndex);
        this.pagination.markAsVisited(this.currentQuestionIndex);
      }
    }
  }
}

export default QuestionNavigator;
