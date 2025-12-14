// Этот код создает класс ProjectModal используется для отображения информации о проекте в модальном окне.

import BasicModal from "../../common/BasicModal.js";

export default class ProjectModal extends BasicModal {
  constructor() {
    super({
      id: "projectModal",
      customClass: "modal-overlay project-modal",
      buttonText: "Закрыть",
      buttonAction: () => {
        this.closeModal();
      },
    });
  }

  showProjectInfo(project) {
    const projectName = project?.name || "Неизвестная тема проекта";
    const projectDescription =
      project?.description || "Описание проекта отсутствует.";

    const content = `
      <h2 class="mb-3">Тема проекта: ${projectName}</h2>
      <p class="mb-0">${projectDescription}</p>
    `;

    this.showModal(content);
  }
}
