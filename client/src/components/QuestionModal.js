// Этот код определяет класс QuestionModalпредназначен для отображения вопросов по определенной теме в модальном окне.

import BasicModal from "../common/BasicModal.js";

export default class QuestionModal extends BasicModal {
  constructor() {
    // Вызываем конструктор родительского класса BasicModal с нужными параметрами
    super({
      id: "questionModal", // Уникальный id для модального окна
      customClass: "modal-overlay question-modal", // Класс для стилизации модального окна
      buttonText: "Закрыть", // Текст кнопки
      buttonAction: () => {
        this.closeModal(); // По умолчанию закрывает модальное окно
      },
    });
  }

  // Метод для отображения информации о вопросах по теме
  showQuestionInfo(topic) {
    // Проверка существования переданных данных о теме
    const name = topic?.name || "Неизвестная тема";
    const questions = topic?.questions || [];

    // Формируем HTML для нумерованного списка вопросов
    const questionsHTML =
      questions.length > 0
        ? `<ol>${questions
            .map((question) => `<li>${question}</li>`)
            .join("")}</ol>`
        : "<p>Нет доступных вопросов для этой темы.</p>";

    // Контент для модального окна
    const content = `
      <h2>Тема: ${name}</h2>
      <h3>Контрольные вопросы:</h3>
      ${questionsHTML}
    `;

    // Используем метод из BasicModal для отображения модального окна с контентом
    this.showModal(content);
  }
}
