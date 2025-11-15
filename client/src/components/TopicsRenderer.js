// В этом классе TopicsRenderer создается HTML-разметка для отображения списка тем.
// Класс загружает данные из API и формирует для каждой темы карточку с кнопками,
// позволяющими пользователю взаимодействовать с конкретной темой (запускать тесты,
// просматривать темы проектов и контрольные вопросы)

import API_CONFIG from "../config/api.js";
import pic1 from "../assets/pic/pic1.jpg";

export default class TopicsRenderer {
  constructor() {
    this.topics = []; // Темы загружаются из API
  }

  async loadTopics() {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TOPICS}`;
      console.log("Загрузка тем из:", url);

      const response = await fetch(url);

      if (!response.ok) {
        // Пытаемся получить детали ошибки из ответа
        let errorDetails = null;
        let errorMessage = `Ошибка загрузки тестов (HTTP ${response.status})`;
        try {
          errorDetails = await response.json();
          if (errorDetails.message) {
            errorMessage = errorDetails.message;
          } else if (errorDetails.error) {
            errorMessage = errorDetails.error;
          }
        } catch (e) {
          // Если не удалось распарсить JSON, используем текст
          try {
            const text = await response.text();
            if (text) {
              errorMessage = text;
            }
          } catch (textError) {
            // Игнорируем ошибку парсинга текста
          }
        }

        const error = new Error(errorMessage);
        error.details = errorDetails;
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      console.log("Получены данные тем:", data);

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
      console.error("Ошибка при загрузке тем:", error);

      // Выводим детали ошибки, если они есть
      if (error instanceof Error && error.details) {
        console.error("Детали ошибки от сервера:", error.details);
        if (error.details.details) {
          console.error("Подробности:", error.details.details);
          if (error.details.details.hint) {
            console.error("Подсказка:", error.details.details.hint);
          }
        }
      }

      // Если это ошибка сети (например, сервер не запущен)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Не удалось подключиться к серверу. Убедитесь, что сервер запущен."
        );
      }

      // Пробрасываем ошибку дальше, чтобы её мог обработать вызывающий код
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
      // Если тем нет, возвращаем пустой контейнер
      return "";
    }

    this.topics.forEach((topic, index) => {
      const topicName = topic?.name || "Тема неизвестна";
      const projectName = topic?.project?.name || "Проект не определен";
      const projectDescription =
        topic?.project?.description || "Описание проекта отсутствует";

      // Используем topic.id вместо index + 1 для правильной идентификации темы
      const topicId = topic?.id || index + 1;

      // Формируем HTML для прямоугольников с ссылками на тесты
      rectanglesHTML += `
        <div class="rectangle" style="animation-delay: ${index * 0.1}s;">
          <img src="${pic1}" alt="Изображение темы" class="rectangle-image">
          <p>Тема: ${topicName}</p>
          <div class="buttons-container">
            <a href="/test-page?variant=1&topicId=${topicId}" class="btn test-btn">Выполнить тест. Вариант 1</a>
            <a href="/test-page?variant=2&topicId=${topicId}" class="btn test-btn">Выполнить тест. Вариант 2</a>
            <button class="btn project-info-btn" data-project-index="${index}">Узнать тему проекта</button>
            <button class="btn control-question-btn" data-question-index="${index}">Контрольные вопросы</button>
          </div>
        </div>`;
    });

    return rectanglesHTML;
  }
}
