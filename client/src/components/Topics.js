// Класс Topics отображает раздел "Темы" на странице, используя TopicsRenderer для генерации HTML.
// Он добавляет обработчики событий для кнопок, которые открывают модальные окна с информацией о вопросах,
//  проектах и тестах, и управляет их рендерингом и взаимодействием.

import Section from "../common/Section";
import QuestionModal from "./QuestionModal.js";
import ProjectModal from "./ProjectModal.js";
import TestModal from "./TestModal.js";
import TopicsRenderer from "./TopicsRenderer.js";

export default class Topics extends Section {
  constructor() {
    super({ id: "topics-section", customClass: "topics-container" });
    this.renderer = new TopicsRenderer();
    this.topics = this.renderer.topics;
  }

  render() {
    return `
      <div id="${this.id}" class="${this.customClass}">
        <div class="rectangles-container">${this.renderer.renderRectangles()}</div>
      </div>
    `;
  }

  addEventListeners() {
    const contentContainer = document.getElementById("content");

    if (contentContainer) {
      contentContainer.addEventListener("click", (event) => {
        const target = event.target;

        switch (true) {
          case target.classList.contains("control-question-btn"): {
            const index = target.getAttribute("data-question-index");
            const topic = this.topics[index];

            if (topic) {
              const modal = new QuestionModal();
              modal.showQuestionInfo(topic);
            }
            break;
          }

          case target.classList.contains("project-info-btn"): {
            const index = target.getAttribute("data-project-index");
            const project = this.topics[index]?.project;

            if (project) {
              const modal = new ProjectModal();
              modal.showProjectInfo(project);
            }
            break;
          }

          case target.classList.contains("test-btn"): {
            const variant = new URL(target.href).searchParams.get("variant");
            const topicId = new URL(target.href).searchParams.get("topicId");

            if (variant && topicId) {
              event.preventDefault();

              const topic = this.topics[topicId - 1];

              const modal = new TestModal({ variant, topic });
              modal.showTestInfo();
            }
            break;
          }

          default:
            break;
        }
      });
    }
  }

  renderWithEvents() {
    const sectionElement = document.querySelector("#home section");

    const renderedContent = this.render();

    if (sectionElement) {
      sectionElement.innerHTML = renderedContent;

      this.addEventListeners();
    }

    // Возвращаем результат рендеринга
    return renderedContent;
  }
}
