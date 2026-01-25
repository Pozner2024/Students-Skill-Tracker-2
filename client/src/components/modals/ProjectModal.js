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
    const parseDescriptionPayload = (description) => {
      if (typeof description !== "string") return null;
      let parsed = null;
      try {
        parsed = JSON.parse(description);
      } catch (error) {
        parsed = null;
      }

      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch (error) {
          parsed = null;
        }
      }

      if (parsed && typeof parsed === "object") {
        return parsed;
      }

      if (description.includes("<h2>") || description.includes("<h3>")) {
        return { content: description };
      }

      return null;
    };

    const descriptionPayload = parseDescriptionPayload(project?.description);

    const projectName =
      project?.content?.projectTitle ||
      descriptionPayload?.projectTitle ||
      project?.name ||
      "Неизвестная тема проекта";
    const projectHtml =
      project?.content?.content ||
      project?.content?.html ||
      descriptionPayload?.content ||
      null;
    const projectDescription =
      project?.description || "Описание проекта отсутствует.";

    const content = projectHtml
      ? projectHtml
      : `
        <h2 class="mb-3">Тема проекта: ${projectName}</h2>
        <p class="mb-0">${projectDescription}</p>
      `;

    this.showModal(content);
  }
}
