// В этом классе TopicsRenderer создается HTML-разметка для отображения списка тем.
// Класс загружает данные из API и формирует для каждой темы карточку с кнопками,
// позволяющими пользователю взаимодействовать с конкретной темой (запускать тесты,
// просматривать темы проектов и контрольные вопросы)

import API_CONFIG from "../../config/api.js";
import apiClient from "../../services/apiClient.js";
import errorHandler from "../../services/errorHandler.js";

// Явно импортируем картинки, чтобы сохранить нужный порядок:
// pic1 — для первой карточки, pic2 — для второй и т.д.
import pic1 from "../../assets/pic/pic1.jpg";
import pic2 from "../../assets/pic/pic2.jpg";
import pic3 from "../../assets/pic/pic3.jpg";
import pic4 from "../../assets/pic/pic4.jpg";
import pic5 from "../../assets/pic/pic5.jpg";
import pic6 from "../../assets/pic/pic6.jpg";
import pic7 from "../../assets/pic/pic7.jpg";
import pic8 from "../../assets/pic/pic8.jpg";
import pic9 from "../../assets/pic/pic9jpg.jpg";
import pic10 from "../../assets/pic/pic10.jpg";
import pic11 from "../../assets/pic/pic11.jpg";
import pic12 from "../../assets/pic/pic12.jpg";

const pictures = [
  pic1,
  pic2,
  pic3,
  pic4,
  pic5,
  pic6,
  pic7,
  pic8,
  pic9,
  pic10,
  pic11,
  pic12,
];

export default class TopicsRenderer {
  constructor() {
    this.topics = [];
  }

  async loadTopics() {
    try {
      const data = await apiClient.publicRequest(API_CONFIG.ENDPOINTS.TOPICS, {
        method: "GET",
        context: "TopicsRenderer.loadTopics",
      });

      if (data.success && data.topics) {
        this.topics = data.topics;
        console.log(`Загружено тем: ${this.topics.length}`);
        return this.topics;
      } else {
        throw new Error(
          "Неверный формат ответа от сервера: отсутствует success или topics"
        );
      }
    } catch (error) {
      errorHandler.handle(error, "TopicsRenderer.loadTopics");
      this.topics = [];
      throw error;
    }
  }

  renderRectangles() {
    let rectanglesHTML = "";

    if (
      !this.topics ||
      !Array.isArray(this.topics) ||
      this.topics.length === 0
    ) {
      return "";
    }

    this.topics.forEach((topic, index) => {
      const topicName = topic?.name || "Тема неизвестна";
      const projectName = topic?.project?.name || "Проект не определен";
      const projectDescription =
        topic?.project?.description || "Описание проекта отсутствует";

      const topicId = topic?.id || index + 1;

      const pictureIndex = index % pictures.length;
      const selectedPicture = pictures[pictureIndex];

      rectanglesHTML += `
        <div class="col-12 col-sm-6 col-md-4 col-lg-4 mb-4">
          <div class="card h-100 rectangle card-hover-effect card-appear" style="animation-delay: ${
            index * 0.1
          }s;">
            <img src="${selectedPicture}" alt="Изображение темы" class="card-img-top rectangle-image">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">
                <a href="/topic?topicId=${topicId}" class="card-title-link">Тема: ${topicName}</a>
              </h5>
              <div class="buttons-container mt-auto">
                <a href="/test-page?variant=1&testCode=test${topicId}_1&title=${encodeURIComponent(topicName)}" class="btn btn-primary mb-2 test-btn w-100">Выполнить тест. Вариант 1</a>
                <a href="/test-page?variant=2&testCode=test${topicId}_2&title=${encodeURIComponent(topicName)}" class="btn btn-primary mb-2 test-btn w-100">Выполнить тест. Вариант 2</a>
                <button class="btn btn-success mb-2 project-info-btn w-100" data-project-index="${index}">Узнать тему проекта</button>
                <button class="btn btn-info control-question-btn w-100" data-question-index="${index}">Контрольные вопросы</button>
              </div>
            </div>
          </div>
        </div>`;
    });

    return rectanglesHTML;
  }
}
