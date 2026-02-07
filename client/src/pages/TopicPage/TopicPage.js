import Page from "../../common/Page.js";
import apiClient from "../../services/apiClient.js";
import errorHandler from "../../services/errorHandler.js";
import API_CONFIG from "../../config/api.js";
import { renderContent } from "./contentRenderer.js";
import { extractTextFromContent } from "./contentExtractor.js";
import CKEditorComponent from "../../components/editors/CKEditorComponent.js";
import authService from "../../services/authService.js";
import "../../components/ui/CubeLoader";
import "./TopicPage.css";

// Страница отображения конкретной темы: получает ID темы из URL,
// загружает данные темы с сервера и отображает содержание темы
class TopicPage extends Page {
  constructor() {
    super({
      id: "topic",
      title: "Тема",
      content: `
        <div class="topic-page">
          <div class="topic-loading">Загрузка темы...</div>
        </div>
      `,
      metaTitle: "Тема",
    });
    this.editor = null;
    this.currentTopic = null;
    this.isEditMode = false;
    this.currentUser = null;
    this.editButtonHtml = "";
  }

  async loadTopicData(topicId) {
    try {
      const data = await apiClient.publicRequest(
        `${API_CONFIG.ENDPOINTS.TOPICS}/${topicId}`,
        {
          method: "GET",
          context: "TopicPage.loadTopicData",
        }
      );

      if (data?.success && data.topic) {
        return data.topic;
      }
      return null;
    } catch (error) {
      errorHandler.handle(error, "TopicPage.loadTopicData");
      return null;
    }
  }

  async checkUserRole() {
    try {
      if (authService.isAuthenticated()) {
        const userData = await authService.getCurrentUser();
        this.currentUser = userData?.user || null;
        return this.currentUser?.role === "admin";
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async saveTopicContent(topicId, content) {
    try {
      const response = await apiClient.put(
        `${API_CONFIG.ENDPOINTS.TOPICS}/${topicId}/content`,
        { content },
        {
          context: "TopicPage.saveTopicContent",
          handleErrors: false,
        }
      );

      if (response?.success) {
        return {
          success: true,
          message: response.message || "Контент успешно сохранен",
        };
      }
      return { success: false, message: "Ошибка при сохранении" };
    } catch (error) {
      errorHandler.handle(error, "TopicPage.saveTopicContent");
      return {
        success: false,
        message: error.message || "Ошибка при сохранении",
      };
    }
  }

  async initEditor(topic) {
    try {
      // Уничтожаем предыдущий редактор, если он существует
      if (this.editor) {
        await this.editor.destroy();
        this.editor = null;
      }

      const editorContainer = document.getElementById("topic-editor-container");
      if (!editorContainer) {
        return;
      }

      // Извлекаем текст из контента топика
      const textContent = extractTextFromContent(topic.content) || "";

      // Инициализируем редактор
      this.editor = new CKEditorComponent("topic-editor-container", {
        initialData: textContent,
        readOnly: false,
        placeholder: "Введите содержание темы...",
      });

      await this.editor.init();
    } catch (error) {
      errorHandler.handle(error, "TopicPage.initEditor");
    }
  }

  async handleEditClick() {
    this.isEditMode = true;
    const pageContent = await this.renderPage();

    // Обновляем DOM напрямую
    const root = document.getElementById("content");
    if (root) {
      root.innerHTML = pageContent;
      // Прикрепляем обработчики после обновления DOM
      this.attachEventListeners();
      // Инициализируем редактор
      if (this.currentTopic) {
        setTimeout(async () => {
          await this.initEditor(this.currentTopic);
          this.attachEventListeners();
        }, 100);
      }
    }
  }

  async handleCancelClick() {
    this.isEditMode = false;
    if (this.editor) {
      await this.editor.destroy();
      this.editor = null;
    }
    const pageContent = await this.renderPage();

    // Обновляем DOM напрямую
    const root = document.getElementById("content");
    if (root) {
      root.innerHTML = pageContent;
      // Прикрепляем обработчики после обновления DOM
      this.attachEventListeners();
    }
  }

  async handleSaveClick() {
    if (!this.editor || !this.currentTopic) {
      return;
    }

    try {
      const editorData = this.editor.getData();
      const topicId = this.currentTopic.id;

      // Показываем индикатор загрузки
      const saveButton = document.getElementById("topic-save-btn");
      if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Сохранение...";
      }

      const result = await this.saveTopicContent(topicId, editorData);

      if (result.success) {
        // Обновляем данные топика
        this.currentTopic.content = editorData;
        this.isEditMode = false;
        if (this.editor) {
          await this.editor.destroy();
          this.editor = null;
        }
        const pageContent = await this.renderPage();

        // Обновляем DOM напрямую
        const root = document.getElementById("content");
        if (root) {
          root.innerHTML = pageContent;
          this.attachEventListeners();
        }
        alert("Контент успешно сохранен!");
      } else {
        alert(`Ошибка: ${result.message}`);
        if (saveButton) {
          saveButton.disabled = false;
          saveButton.textContent = "Сохранить";
        }
      }
    } catch (error) {
      errorHandler.handle(error, "TopicPage.handleSaveClick");
      alert("Произошла ошибка при сохранении");
      const saveButton = document.getElementById("topic-save-btn");
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = "Сохранить";
      }
    }
  }

  attachEventListeners() {
    const editButton = document.getElementById("topic-edit-btn");
    const cancelButton = document.getElementById("topic-cancel-btn");
    const saveButton = document.getElementById("topic-save-btn");

    if (editButton) {
      editButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleEditClick();
      });
    }

    if (cancelButton) {
      cancelButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleCancelClick();
      });
    }

    if (saveButton) {
      saveButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleSaveClick();
      });
    }
  }

  /**
   * Метод init вызывается роутером после вставки HTML в DOM
   */
  init() {
    // Прикрепляем обработчики событий после того, как DOM обновлен
    this.attachEventListeners();

    // Если мы в режиме редактирования, инициализируем редактор
    if (this.isEditMode && this.currentTopic) {
      setTimeout(async () => {
        await this.initEditor(this.currentTopic);
        // Повторно прикрепляем обработчики после инициализации редактора
        this.attachEventListeners();
      }, 100);
    }
  }

  async renderPage() {
    const params = new URLSearchParams(window.location.search);
    const topicId = params.get("topicId");

    if (!topicId) {
      this.title = "Темы";
      this.metaTitle = "Темы";
      this.editButtonHtml = "";
      this.content = `
        <div class="topic-page">
          <p class="error-note">ID темы не указан.</p>
        </div>
      `;
      window.loader.hide();
      return this.render();
    }

    window.loader.show();
    try {
      const topic = await this.loadTopicData(topicId);

      if (topic) {
        this.currentTopic = topic;
        this.title = topic.name || "Тема";
        this.metaTitle = topic.name || "Тема";

        // Проверяем роль пользователя
        const isAdmin = await this.checkUserRole();

        if (this.isEditMode && isAdmin) {
          // Режим редактирования
          const textContent = extractTextFromContent(topic.content) || "";
          this.editButtonHtml = `
            <div class="topic-actions">
              <button id="topic-save-btn" class="btn btn-primary">Сохранить</button>
              <button id="topic-cancel-btn" class="btn btn-secondary">Отмена</button>
            </div>
          `;
          this.content = `
            <div class="topic-page edit-mode">
              <div id="topic-editor-container" class="topic-editor-container"></div>
            </div>
          `;
        } else {
          // Режим просмотра
          const renderedContent = renderContent(topic);
          // Сохраняем HTML кнопки редактирования для использования в render()
          if (isAdmin) {
            this.editButtonHtml = `
              <div class="topic-actions topic-actions--edit">
                <button id="topic-edit-btn" class="btn btn-primary">Редактировать</button>
              </div>
            `;
          } else {
            this.editButtonHtml = "";
          }
          this.content = `
            <div class="topic-page">
              ${renderedContent}
            </div>
          `;
        }
      } else {
        this.title = "Тема";
        this.metaTitle = "Тема";
        this.editButtonHtml = "";
        this.content = `
          <div class="topic-page">
            <p class="error-note">Не удалось загрузить тему.</p>
          </div>
        `;
      }

      const renderedHTML = this.render();

      // Обработчики событий будут прикреплены в методе init(),
      // который вызывается роутером после вставки HTML в DOM
      return renderedHTML;
    } catch (error) {
      errorHandler.handle(error, "TopicPage.renderPage");
      this.title = "Тема";
      this.metaTitle = "Тема";
      this.editButtonHtml = "";
      this.content = `
        <div class="topic-page">
          <p class="error-note">Ошибка при загрузке темы.</p>
        </div>
      `;
      return this.render();
    } finally {
      window.loader.hide();
    }
  }

  render(className = "container my-4") {
    document.title = this.metaTitle;
    return `
      <main id="${this.id}" class="${className}">
        <div class="topic-page-header">
          <h1>${this.title}</h1>
          ${this.editButtonHtml || ""}
        </div>
        <section>${this.content}</section>
      </main>
    `;
  }
}

export default TopicPage;
