// Этот код определяет класс QuestionModalпредназначен для отображения
//  вопросов по определенной теме в модальном окне.

import BasicModal from "../../common/BasicModal.js";

export default class QuestionModal extends BasicModal {
  constructor() {
    super({
      id: "questionModal",
      customClass: "modal-overlay question-modal",
      buttonText: "Закрыть",
      buttonAction: () => {
        this.closeModal();
      },
    });
  }

  showQuestionInfo(topic) {
    const name = topic?.name || "Неизвестная тема";
    const questions = topic?.questions || [];

    const questionsHTML =
      questions.length > 0
        ? `<ol>${questions
            .map((question) => `<li>${question}</li>`)
            .join("")}</ol>`
        : "<p>Нет доступных вопросов для этой темы.</p>";

    const content = `
      <h2 class="mb-3">Тема: ${name}</h2>
      <h3 class="mb-3">Контрольные вопросы:</h3>
      ${questionsHTML}
    `;

    this.showModal(content);
  }
}
