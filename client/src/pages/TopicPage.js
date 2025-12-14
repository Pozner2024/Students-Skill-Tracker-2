import Page from "../common/Page.js";
import apiClient from "../services/apiClient.js";
import errorHandler from "../services/errorHandler.js";
import API_CONFIG from "../config/api.js";

// Страница отображения конкретной темы: получает ID темы из URL,
// загружает список тем с сервера и устанавливает название темы в заголовок страницы
class TopicPage extends Page {
  constructor() {
    super({
      id: "topic",
      title: "Тема",
      content: `
        <div class="topic-page">
          <p class="placeholder-note">Содержание темы будет добавлено позже.</p>
        </div>
      `,
      metaTitle: "Тема",
    });
  }

  async resolveTopicTitle() {
    const params = new URLSearchParams(window.location.search);
    const topicId = params.get("topicId");
    if (!topicId) return "Темы";

    try {
      const data = await apiClient.publicRequest(API_CONFIG.ENDPOINTS.TOPICS, {
        method: "GET",
        context: "TopicPage.resolveTopicTitle",
      });

      if (data?.success && Array.isArray(data.topics)) {
        const topic = data.topics.find(
          (item) => String(item.id) === String(topicId)
        );

        if (topic?.name) {
          return topic.name;
        }
      }
    } catch (error) {
      errorHandler.handle(error, "TopicPage.resolveTopicTitle");
    }

    return "Тема";
  }

  async renderPage() {
    const topicTitle = await this.resolveTopicTitle();
    this.title = topicTitle;
    this.metaTitle = topicTitle;
    return this.render();
  }
}

export default TopicPage;
