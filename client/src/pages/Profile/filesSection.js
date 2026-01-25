import authService from "../../services/authService.js";
import { escapeHtml, formatFileSize } from "./helpers.js";
import {
  showBootstrapAlert,
  showErrorMessage,
  showSuccessMessage,
} from "./alerts.js";

export async function renderFilesSection() {
  try {
    const filesResult = await authService.getUserFiles();
    const files = filesResult && filesResult.success ? filesResult.files : [];

    return `
        <div class="files-section">
          <h3>Мои файлы</h3>
          <div class="upload-area">
            <input type="file" id="file-input" class="file-input" accept="image/*,application/pdf,.doc,.docx,.txt,.docs,.xls,.xlsx,.ppt,.pptx" />
            <label for="file-input" class="upload-btn">
              <span class="upload-icon">📁</span>
              <span class="upload-text">Выберите файл для загрузки</span>
            </label>
            <div class="upload-info">
              <small>Максимальный размер: 10 MB. Разрешенные форматы: изображения, PDF, документы Word (.doc, .docx, .docs), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx), текстовые файлы (.txt)</small>
            </div>
          </div>
          ${renderFilesList(files)}
        </div>
      `;
  } catch (error) {
    console.error("Ошибка при рендеринге секции файлов:", error);
    return `
        <div class="files-section">
          <h3>Мои файлы</h3>
          <div class="alert alert-danger" role="alert">Ошибка загрузки списка файлов: ${error.message || "Неизвестная ошибка"}</div>
        </div>
      `;
  }
}

export function renderFilesList(files) {
  if (!files || files.length === 0) {
    return `
        <div class="files-list empty">
          <p>Нет загруженных файлов</p>
        </div>
      `;
  }

  const filesHtml = files
    .map(
      (file) => `
      <div class="file-item" data-key="${escapeHtml(file.key)}">
        <div class="file-info">
          <span class="file-name">${escapeHtml(file.fileName)}</span>
          <span class="file-size">${formatFileSize(file.size)}</span>
          <span class="file-date">${new Date(
            file.lastModified
          ).toLocaleDateString("ru-RU")}</span>
        </div>
        <div class="file-actions">
          <a href="#" class="file-download" data-key="${escapeHtml(
            file.key
          )}" title="Скачать">⬇️</a>
          <button type="button" class="file-delete" data-key="${escapeHtml(
            file.key
          )}" title="Удалить">🗑️</button>
        </div>
      </div>
    `
    )
    .join("");

  return `
      <div class="files-list">
        ${filesHtml}
      </div>
    `;
}

export function handleFileUpload() {
  const fileInput = document.getElementById("file-input");
  if (!fileInput) return;

  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const uploadBtn = document.querySelector(".upload-btn");
    const originalText = uploadBtn?.querySelector(".upload-text")?.textContent;
    if (uploadBtn) {
      uploadBtn.disabled = true;
      const uploadText = uploadBtn.querySelector(".upload-text");
      if (uploadText) {
        uploadText.textContent = "Загрузка...";
      }
    }

    try {
      const result = await authService.uploadFile(file);

      if (result && result.success) {
        showSuccessMessage("Файл успешно загружен!");
        await refreshFilesList();
      } else {
        const errorMsg = result?.error || "Неизвестная ошибка";
        console.error("Ошибка загрузки файла:", errorMsg);
        showErrorMessage("Ошибка при загрузке файла: " + errorMsg);
      }
    } catch (error) {
      console.error("Исключение при загрузке файла:", error);
      showErrorMessage("Ошибка при загрузке файла: " + (error.message || "Неизвестная ошибка"));
    } finally {
      if (uploadBtn) {
        uploadBtn.disabled = false;
        const uploadText = uploadBtn.querySelector(".upload-text");
        if (uploadText && originalText) {
          uploadText.textContent = originalText;
        }
      }
      fileInput.value = "";
    }
  });
}

export async function refreshFilesList() {
  try {
    const filesResult = await authService.getUserFiles();
    const files = filesResult && filesResult.success ? filesResult.files : [];

    const filesListContainer = document.querySelector(".files-list");
    const filesSection = document.querySelector(".files-section");

    if (filesListContainer && filesSection) {
      filesListContainer.outerHTML = renderFilesList(files);
      // Обработчики событий уже установлены через делегирование в handleFileDelete(),
      // поэтому переинициализация не требуется
    } else {
      console.warn("Контейнеры файлов не найдены:", { filesListContainer, filesSection });
    }
  } catch (error) {
    console.error("Ошибка при обновлении списка файлов:", error);
  }
}

export function handleFileDelete() {
  const profileContainer = document.querySelector("#profile");
  if (!profileContainer) {
    console.warn("Profile container not found");
    return;
  }

  if (profileContainer.dataset.fileHandlers === "true") {
    return;
  }

  profileContainer.dataset.fileHandlers = "true";

  profileContainer.addEventListener("click", async (e) => {
    const downloadLink = e.target.closest(".file-download");
    if (downloadLink) {
      e.preventDefault();
      e.stopPropagation();

      const key = downloadLink.dataset.key;
      if (!key) return;

      const fileItem = downloadLink.closest(".file-item");
      const fileNameElement = fileItem?.querySelector(".file-name");
      const fileName =
        fileNameElement?.textContent || key.split("/").pop() || "download";

      const originalText = downloadLink.textContent;
      downloadLink.textContent = "⏳";

      try {
        const result = await authService.getDownloadUrl(key);
        if (result.success && result.url) {
          try {
            const response = await fetch(result.url, {
              method: "GET",
              mode: "cors",
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();

            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = fileName;
            link.classList.add("hidden");
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
              document.body.removeChild(link);
              window.URL.revokeObjectURL(blobUrl);
            }, 100);
          } catch (fetchError) {
            console.warn("Fetch failed, trying direct link:", fetchError);
            const link = document.createElement("a");
            link.href = result.url;
            link.download = fileName;
            link.classList.add("hidden");
            document.body.appendChild(link);
            link.click();
            setTimeout(() => document.body.removeChild(link), 100);
          }
        } else {
          showBootstrapAlert(
            "Ошибка при получении ссылки на файл: " +
              (result.error || "Неизвестная ошибка"),
            "danger"
          );
        }
      } catch (error) {
        console.error("Download error:", error);
        showBootstrapAlert(
          "Ошибка при скачивании файла: " +
            (error.message || "Неизвестная ошибка"),
          "danger"
        );
      } finally {
        downloadLink.textContent = originalText;
      }
      return;
    }

    const deleteBtn = e.target.closest(".file-delete");
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();

      const key = deleteBtn.dataset.key;
      if (!key) {
        console.error("File key not found in delete button");
        return;
      }

      if (!confirm("Вы уверены, что хотите удалить этот файл?")) {
        return;
      }

      deleteBtn.disabled = true;
      const originalText = deleteBtn.textContent;
      deleteBtn.textContent = "⏳";

      try {
        const result = await authService.deleteFile(key);

        if (result.success) {
          showSuccessMessage("Файл успешно удален!");
          await refreshFilesList();
        } else {
          showErrorMessage(
            "Ошибка при удалении файла: " +
              (result.error || "Неизвестная ошибка")
          );
          deleteBtn.disabled = false;
          deleteBtn.textContent = originalText;
        }
      } catch (error) {
        console.error("Error deleting file:", error);
        showErrorMessage(
          "Ошибка при удалении файла: " +
            (error.message || "Неизвестная ошибка")
        );
        deleteBtn.disabled = false;
        deleteBtn.textContent = originalText;
      }
    }
  });
}

