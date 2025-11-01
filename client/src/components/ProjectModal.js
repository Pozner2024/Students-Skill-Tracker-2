// Этот код создает класс ProjectModal используется для отображения информации о проекте в модальном окне.

import BasicModal from "../common/BasicModal.js"; // Импортируем базовый класс модального окна

export default class ProjectModal extends BasicModal {
  constructor() {
    // Вызываем конструктор родительского класса BasicModal с нужными параметрами
    super({
      id: "projectModal", // Уникальный id для модального окна
      customClass: "modal-overlay project-modal", // Класс для стилизации модального окна
      buttonText: "Закрыть", // Текст кнопки
      buttonAction: () => {
        this.closeModal(); // По умолчанию закрывает модальное окно
      },
    });
  }

  // Метод для отображения информации о проекте
  showProjectInfo(project) {
    // Проверка существования переданных данных о проекте
    const projectName = project?.name || "Неизвестная тема проекта";
    const projectDescription =
      project?.description || "Описание проекта отсутствует.";

    // Контент для модального окна
    const content = `
      <h2>Тема проекта: ${projectName}</h2>
      <p>${projectDescription}</p>
    `;

    // Используем метод showModal из BasicModal для отображения модального окна с контентом
    this.showModal(content);
  }
}
