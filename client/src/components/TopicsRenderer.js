// В этом классе TopicsRenderer создается HTML-разметка для отображения списка тем.
// Класс берет данные из массива TOPICS, который импортируется из файла констант,
// и формирует для каждой темы карточку с кнопками, позволяющими пользователю
// взаимодействовать с конкретной темой (запускать тесты, просматривать темы проектов и контрольные вопросы)

import { TOPICS } from "../constants/constants.js";

export default class TopicsRenderer {
  constructor() {
    this.topics = TOPICS; // Используем массив TOPICS из файла с константами
  }

  renderRectangles() {
    let rectanglesHTML = "";

    this.topics.forEach((topic, index) => {
      const topicName = topic?.name || "Тема неизвестна";
      const projectName = topic?.project?.name || "Проект не определен";
      const projectDescription =
        topic?.project?.description || "Описание проекта отсутствует";

      // Формируем HTML для прямоугольников с ссылками на тесты
      rectanglesHTML += `
        <div class="rectangle" style="animation-delay: ${index * 0.1}s;">
          <p>Тема: ${topicName}</p>
          <div class="buttons-container">
            <a href="/test-page?variant=1&topicId=${
              index + 1
            }" class="btn test-btn">Выполнить тест. Вариант 1</a>
            <a href="/test-page?variant=2&topicId=${
              index + 1
            }" class="btn test-btn">Выполнить тест. Вариант 2</a>
            <button class="btn project-info-btn" data-project-index="${index}">Узнать тему проекта</button>
            <button class="btn control-question-btn" data-question-index="${index}">Контрольные вопросы</button>
          </div>
        </div>`;
    });

    return rectanglesHTML;
  }
}
