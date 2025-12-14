// Страница администратора для управления пользователями, просмотра результатов тестирования и работы с файлами студентов
import Page from "../common/Page.js";
import authService from "../services/authService.js";
import errorHandler from "../services/errorHandler.js";
import apiClient from "../services/apiClient.js";
import createCubeLoader from "../components/ui/CubeLoader";
import AdminPageRenderer from "./AdminPageRenderer.js";

class AdminPage extends Page {
  constructor() {
    super({
      id: "admin",
      content: "Загрузка...",
      metaTitle: "Кабинет администратора",
    });

    this.loader = createCubeLoader();
    this.renderer = new AdminPageRenderer();
  }

  async fetchResults() {
    try {
      const data = await apiClient.get("/admin/results", {
        context: "AdminPage.fetchResults",
      });
      return data;
    } catch (error) {
      errorHandler.handle(error, "AdminPage.fetchResults");
      throw error;
    }
  }

  async renderPage() {
    return `
      <main id="admin" class="container my-4">
        <h1>Кабинет преподавателя</h1>
        <section>
          <div class="test-results-section"></div>
        </section>
      </main>
    `;
  }

  async init() {
    const container = document.querySelector("#admin .test-results-section");
    if (!container) return;

    this.loader?.show();
    try {
      const data = await this.fetchResults();

      const groupsHtml = this.renderer.renderGroupsTable(data.groups);
      const noGroupHtml = this.renderer.renderNoGroupTable(data.noGroup);
      container.innerHTML = `${groupsHtml}<hr />${noGroupHtml}`;

      this.setupEventListeners();
    } catch (e) {
      console.error("Error loading admin data:", e);
      container.innerHTML = `<div class="no-results"><p>${e.message}</p></div>`;
    } finally {
      this.loader?.hide();
    }
  }

  getAdminContainer() {
    return document.querySelector("#admin");
  }

  setupEventListeners() {
    const container = this.getAdminContainer();
    if (!container) {
      console.warn("Admin container not found");
      return;
    }

    if (container.dataset.handlersAdded === "true") {
      return;
    }
    container.dataset.handlersAdded = "true";

    const self = this;

    container.addEventListener("click", function (e) {
      const downloadBtn = e.target.closest(".file-download-admin");
      if (downloadBtn) {
        self.handleFileDownload(e);
        return;
      }

      const deleteBtn = e.target.closest(".file-delete-admin");
      if (deleteBtn) {
        self.handleFileDelete(e);
        return;
      }

      const userDeleteBtn = e.target.closest(".delete-user-btn");
      if (userDeleteBtn) {
        self.handleUserDelete(e);
        return;
      }

      self.handleAccordionToggle(e);
    });
  }

  async handleFileDownload(e) {
    const downloadBtn = e.target.closest(".file-download-admin");
    if (!downloadBtn) return false;

    e.preventDefault();
    e.stopPropagation();

    const key = downloadBtn.dataset.key;
    if (!key) return true;

    this.toggleButtonState(downloadBtn, true, "⏳ Загрузка...");

    try {
      const result = await authService.getStudentFileDownloadUrl(key);
      if (result.success && result.url) {
        const fileItem = downloadBtn.closest(".file-item-admin");
        const fileNameElement = fileItem?.querySelector(".file-name-admin");
        const fileName =
          fileNameElement?.textContent || key.split("/").pop() || "download";

        await this.downloadFile(result.url, fileName);
      } else {
        errorHandler.handle(result, "AdminPage.downloadFile.getUrl");
      }
    } catch (error) {
      errorHandler.handle(error, "AdminPage.downloadFile");
    } finally {
      this.toggleButtonState(downloadBtn, false);
    }
    return true;
  }

  async downloadFile(url, fileName) {
    try {
      const response = await fetch(url, { method: "GET", mode: "cors" });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (fetchError) {
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 100);
    }
  }

  async handleFileDelete(e) {
    const deleteBtn = e.target.closest(".file-delete-admin");
    if (!deleteBtn) return false;

    e.preventDefault();
    e.stopPropagation();

    const key = deleteBtn.dataset.key;
    if (!key || !confirm("Вы уверены, что хотите удалить этот файл?")) {
      return true;
    }

    const originalText = deleteBtn.textContent;
    this.toggleButtonState(deleteBtn, true, "⏳");

    try {
      const result = await authService.deleteStudentFile(key);
      if (result.success) {
        const fileItem = deleteBtn.closest(".file-item-admin");
        if (fileItem) {
          fileItem.remove();
          const studentId = fileItem
            .closest(".accordion-item")
            ?.querySelector(".files-indicator")?.dataset.studentId;
          if (studentId) {
            this.updateFilesIndicator(studentId);
          }
        }
        errorHandler.showSuccess("Файл успешно удален");
      } else {
        errorHandler.handle(result, "AdminPage.deleteFile");
        this.toggleButtonState(deleteBtn, false, originalText);
      }
    } catch (error) {
      errorHandler.handle(error, "AdminPage.deleteFile");
      this.toggleButtonState(deleteBtn, false, originalText);
    }
    return true;
  }

  async updateFilesIndicator(studentId) {
    try {
      const result = await authService.getStudentFiles(studentId);
      const indicator = document.querySelector(
        `.files-indicator[data-student-id="${studentId}"]`
      );
      if (indicator) {
        if (result.success && result.files && result.files.length > 0) {
          indicator.textContent = `📁 Файлов: ${result.files.length}`;
          indicator.classList.remove("no-files");
        } else {
          indicator.textContent = "📁 Нет файлов";
          indicator.classList.add("no-files");
        }
      }
    } catch (error) {
      console.error("Ошибка при обновлении индикатора файлов:", error);
    }
  }

  async handleUserDelete(e) {
    const deleteBtn = e.target.closest(".delete-user-btn");
    if (!deleteBtn) return false;

    e.preventDefault();
    e.stopPropagation();

    const userId = deleteBtn.dataset.userId;
    const userName = deleteBtn.dataset.userName || "пользователя";

    if (!userId) {
      errorHandler.showWarning("Ошибка: ID пользователя не найден");
      return true;
    }

    if (
      !confirm(
        `Вы уверены, что хотите удалить пользователя "${userName}"?\n\nЭто действие удалит:\n- Пользователя\n- Все его тесты\n- Все его файлы\n\nЭто действие нельзя отменить!`
      )
    ) {
      return true;
    }

    const originalText = deleteBtn.textContent;
    this.toggleButtonState(deleteBtn, true, "⏳");

    try {
      const result = await authService.deleteUser(userId);
      if (result.success) {
        const accordionItem = deleteBtn.closest(".accordion-item");
        if (accordionItem) {
          accordionItem.remove();
          errorHandler.showSuccess("Пользователь успешно удален");
          setTimeout(() => window.location.reload(), 1500);
        }
      } else {
        errorHandler.handle(result, "AdminPage.deleteUser");
        this.toggleButtonState(deleteBtn, false, originalText);
      }
    } catch (error) {
      errorHandler.handle(error, "AdminPage.deleteUser");
      this.toggleButtonState(deleteBtn, false, originalText);
    }
    return true;
  }

  handleAccordionToggle(e) {
    const header = e.target.closest(".accordion-header");
    if (!header) {
      return false;
    }

    const container = this.getAdminContainer();
    if (!container || !container.contains(header)) {
      return false;
    }

    const clickedButton = e.target.closest("button");
    if (clickedButton) {
      return false;
    }

    const accordionItem = header.closest(".accordion-item");
    if (!accordionItem) {
      return false;
    }

    const content = accordionItem.querySelector(".accordion-content");
    if (!content) {
      return false;
    }

    const isActive = header.classList.toggle("active");
    content.classList.toggle("active");
    header.setAttribute("aria-expanded", String(isActive));

    return true;
  }

  toggleButtonState(button, disabled, text = null) {
    button.disabled = disabled;
    if (text !== null) {
      button.textContent = text;
    }
  }
}

export default AdminPage;
