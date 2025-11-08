import Page from "../common/Page.js";
import authService from "../utils/authService.js";

class ProfilePage extends Page {
  constructor() {
    super({
      id: "profile",
      title: "Добро пожаловать в Ваш личный кабинет",
      content: "",
      metaTitle: "Личный кабинет",
    });
    this.instanceId = Math.random().toString(36).substr(2, 9);
  }

  // Метод для отображения информации о пользователе
  async displayUserInfo() {
    try {
      const result = await authService.getCurrentUser();

      if (result.success) {
        // Редирект админа теперь выполняется в роутере до рендера

        // Получаем результаты тестов
        const testResults = await authService.getTestResults();

        // Проверяем, заполнены ли данные пользователя
        const hasUserData = result.user.fullName && result.user.groupNumber;

        return `
          <div class="profile-container">
            ${
              !hasUserData
                ? `
              <form id="profile-form" class="profile-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="fullName">Фамилия и Имя:</label>
                    <input type="text" id="fullName" name="fullName" placeholder="Введите ваши фамилию и имя" value="${
                      result.user.fullName || ""
                    }">
                  </div>
                  <div class="form-group">
                    <label for="groupNumber">Номер группы:</label>
                    <input type="text" id="groupNumber" name="groupNumber" placeholder="Введите номер группы" value="${
                      result.user.groupNumber || ""
                    }">
                  </div>
                </div>
                <div class="form-actions">
                  <button type="submit" id="save-btn" class="save-btn">Сохранить</button>
                </div>
              </form>
            `
                : ""
            }
            ${this.renderUserData(result.user)}
            ${await this.renderFilesSection()}
            ${this.renderTestResults(testResults)}
          </div>
        `;
      } else {
        return `
          <div class="profile-container">
            <h2>Ошибка загрузки данных</h2>
            <p>Не удалось загрузить информацию о пользователе: ${result.error}</p>
          </div>
        `;
      }
    } catch (error) {
      return `
        <div class="profile-container">
          <h2>Ошибка</h2>
          <p>Произошла ошибка при загрузке данных: ${error.message}</p>
        </div>
      `;
    }
  }

  // Метод для экранирования HTML
  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Метод для отображения данных пользователя
  renderUserData(user) {
    if (!user.fullName && !user.groupNumber) {
      return "";
    }

    return `
      <div class="user-data-section">
        <h3>Ваши данные:</h3>
        <div class="user-data">
          <div class="data-item">
            <span class="data-label">Email:</span>
            <span class="data-value">${user.email}</span>
          </div>
          ${
            user.fullName
              ? `
            <div class="data-item editable-item" data-field="fullName">
              <span class="data-label">Фамилия и Имя:</span>
              <span class="data-value editable-field" contenteditable="false" data-field="fullName" data-original="${this.escapeHtml(
                user.fullName
              )}">${this.escapeHtml(user.fullName)}</span>
              <button class="edit-btn" data-field="fullName">Редактировать</button>
              <button class="save-btn-field" data-field="fullName" style="display: none;">Сохранить</button>
              <button class="cancel-btn-field" data-field="fullName" style="display: none;">Отмена</button>
            </div>
          `
              : ""
          }
          ${
            user.groupNumber
              ? `
            <div class="data-item editable-item" data-field="groupNumber">
              <span class="data-label">Номер группы:</span>
              <span class="data-value editable-field" contenteditable="false" data-field="groupNumber" data-original="${this.escapeHtml(
                user.groupNumber
              )}">${this.escapeHtml(user.groupNumber)}</span>
              <button class="edit-btn" data-field="groupNumber">Редактировать</button>
              <button class="save-btn-field" data-field="groupNumber" style="display: none;">Сохранить</button>
              <button class="cancel-btn-field" data-field="groupNumber" style="display: none;">Отмена</button>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  // Метод для получения названия теста по коду
  getTestTitle(testCode) {
    const testTitles = {
      test1_1: "Организация снабжения (вариант 1)",
      test1_2: "Организация снабжения (вариант 2)",
      test2_1: "Подготовка сырья к производству (вариант 1)",
      test2_2: "Подготовка сырья к производству (вариант 2)",
      test3_1: "Полуфабрикаты для мучных кондитерских изделий (вариант 1)",
      test3_2: "Полуфабрикаты для мучных кондитерских изделий (вариант 2)",
      test4_1: "Дрожжевое тесто и изделия из него (вариант 1)",
      test4_2: "Дрожжевое тесто и изделия из него (вариант 2)",
      test5_1: "Бездрожжевое тесто и изделия из него (вариант 1)",
      test5_2: "Бездрожжевое тесто и изделия из него (вариант 2)",
      test6_1: "Отделочные полуфабрикаты для пирожных и тортов (вариант 1)",
      test6_2: "Отделочные полуфабрикаты для пирожных и тортов (вариант 2)",
      test7_1: "Приготовление пирожных (вариант 1)",
      test7_2: "Приготовление пирожных (вариант 2)",
      test8_1: "Приготовление тортов (вариант 1)",
      test8_2: "Приготовление тортов (вариант 2)",
      test9_1: "Приготовление десертов (вариант 1)",
      test9_2: "Приготовление десертов (вариант 2)",
      test10_1: "Приготовление национальных кондитерских изделий (вариант 1)",
      test10_2: "Приготовление национальных кондитерских изделий (вариант 2)",
    };

    return testTitles[testCode] || testCode;
  }

  // Метод для отображения секции загрузки файлов
  async renderFilesSection() {
    try {
      const filesResult = await authService.getUserFiles();
      const files = filesResult.success ? filesResult.files : [];

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
          ${this.renderFilesList(files)}
        </div>
      `;
    } catch (error) {
      return `
        <div class="files-section">
          <h3>Мои файлы</h3>
          <div class="error-message">Ошибка загрузки списка файлов: ${error.message}</div>
        </div>
      `;
    }
  }

  // Метод для отображения списка файлов
  renderFilesList(files) {
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
      <div class="file-item" data-key="${this.escapeHtml(file.key)}">
        <div class="file-info">
          <span class="file-name">${this.escapeHtml(file.fileName)}</span>
          <span class="file-size">${this.formatFileSize(file.size)}</span>
          <span class="file-date">${new Date(file.lastModified).toLocaleDateString("ru-RU")}</span>
        </div>
        <div class="file-actions">
          <a href="#" class="file-download" data-key="${this.escapeHtml(file.key)}" title="Скачать">⬇️</a>
          <button type="button" class="file-delete" data-key="${this.escapeHtml(file.key)}" title="Удалить">🗑️</button>
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

  // Метод для форматирования размера файла
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  }

  // Метод для обработки загрузки файлов
  handleFileUpload() {
    const fileInput = document.getElementById("file-input");
    if (!fileInput) return;

    fileInput.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // Показываем индикатор загрузки
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

        if (result.success) {
          // Показываем уведомление без alert
          this.showSuccessMessage("Файл успешно загружен!");
          
          // Обновляем список файлов без перезагрузки страницы
          await this.refreshFilesList();
        } else {
          this.showErrorMessage("Ошибка при загрузке файла: " + result.error);
        }
      } catch (error) {
        this.showErrorMessage("Ошибка при загрузке файла: " + error.message);
      } finally {
        // Восстанавливаем кнопку
        if (uploadBtn) {
          uploadBtn.disabled = false;
          const uploadText = uploadBtn.querySelector(".upload-text");
          if (uploadText && originalText) {
            uploadText.textContent = originalText;
          }
        }
        // Очищаем input
        fileInput.value = "";
      }
    });
  }

  // Метод для обновления списка файлов без перезагрузки страницы
  async refreshFilesList() {
    try {
      const filesResult = await authService.getUserFiles();
      const files = filesResult.success ? filesResult.files : [];
      
      // Находим контейнер со списком файлов
      const filesListContainer = document.querySelector(".files-list");
      const filesSection = document.querySelector(".files-section");
      
      if (filesListContainer && filesSection) {
        // Обновляем только список файлов
        filesListContainer.outerHTML = this.renderFilesList(files);
        
        // Обработчики уже работают через делегирование на #profile,
        // поэтому не нужно их переинициализировать
      }
    } catch (error) {
      console.error("Ошибка при обновлении списка файлов:", error);
    }
  }

  // Метод для показа сообщения об успехе
  showSuccessMessage(message) {
    // Удаляем предыдущие сообщения
    const existingMessage = document.querySelector(".upload-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    // Создаем новое сообщение
    const messageDiv = document.createElement("div");
    messageDiv.className = "upload-message success-message";
    messageDiv.style.cssText = "padding: 12px 16px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; margin: 10px 0; color: #155724;";
    messageDiv.textContent = message;

    // Вставляем сообщение перед списком файлов
    const filesSection = document.querySelector(".files-section");
    if (filesSection) {
      const filesList = filesSection.querySelector(".files-list");
      if (filesList) {
        filesSection.insertBefore(messageDiv, filesList);
      } else {
        filesSection.appendChild(messageDiv);
      }

      // Автоматически скрываем сообщение через 3 секунды
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.style.transition = "opacity 0.3s";
          messageDiv.style.opacity = "0";
          setTimeout(() => {
            if (messageDiv.parentNode) {
              messageDiv.remove();
            }
          }, 300);
        }
      }, 3000);
    }
  }

  // Метод для показа сообщения об ошибке
  showErrorMessage(message) {
    // Удаляем предыдущие сообщения
    const existingMessage = document.querySelector(".upload-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    // Создаем новое сообщение
    const messageDiv = document.createElement("div");
    messageDiv.className = "upload-message error-message";
    messageDiv.style.cssText = "padding: 12px 16px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; margin: 10px 0; color: #721c24;";
    messageDiv.textContent = message;

    // Вставляем сообщение перед списком файлов
    const filesSection = document.querySelector(".files-section");
    if (filesSection) {
      const filesList = filesSection.querySelector(".files-list");
      if (filesList) {
        filesSection.insertBefore(messageDiv, filesList);
      } else {
        filesSection.appendChild(messageDiv);
      }

      // Автоматически скрываем сообщение через 5 секунд
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.style.transition = "opacity 0.3s";
          messageDiv.style.opacity = "0";
          setTimeout(() => {
            if (messageDiv.parentNode) {
              messageDiv.remove();
            }
          }, 300);
        }
      }, 5000);
    }
  }

  // Метод для обработки удаления файлов
  handleFileDelete() {
    // Используем делегирование на более стабильном родительском элементе
    // Ищем контейнер профиля, который не пересоздается
    const profileContainer = document.querySelector("#profile");
    if (!profileContainer) {
      console.warn("Profile container not found");
      return;
    }

    // Проверяем, были ли уже добавлены обработчики
    if (profileContainer.dataset.fileHandlers === "true") {
      console.log("File handlers already added to profile");
      return;
    }

    profileContainer.dataset.fileHandlers = "true";
    console.log("Adding file event listeners to profile container");

    // Сохраняем ссылку на this для использования в обработчиках
    const self = this;

    // Используем делегирование событий на стабильном контейнере
    profileContainer.addEventListener("click", async (e) => {
      console.log("Click event in profile container:", e.target, e.target.classList);
      // Обработка скачивания файла
      const downloadLink = e.target.closest(".file-download");
      if (downloadLink) {
        e.preventDefault();
        e.stopPropagation();
        
        const key = downloadLink.dataset.key;
        if (!key) return;

        const fileItem = downloadLink.closest('.file-item');
        const fileNameElement = fileItem?.querySelector('.file-name');
        const fileName = fileNameElement?.textContent || key.split('/').pop() || 'download';

        const originalText = downloadLink.textContent;
        downloadLink.textContent = "⏳";

        try {
          const result = await authService.getDownloadUrl(key);
          if (result.success && result.url) {
            try {
              // Получаем файл через fetch как blob
              const response = await fetch(result.url, {
                method: 'GET',
                mode: 'cors',
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const blob = await response.blob();
              
              // Создаем blob URL и скачиваем файл
              const blobUrl = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = blobUrl;
              link.download = fileName;
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              
              // Удаляем ссылку и освобождаем blob URL после небольшой задержки
              setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
              }, 100);
            } catch (fetchError) {
              // Если fetch не работает, пробуем напрямую через ссылку
              console.warn('Fetch failed, trying direct link:', fetchError);
              const link = document.createElement('a');
              link.href = result.url;
              link.download = fileName;
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              setTimeout(() => document.body.removeChild(link), 100);
            }
          } else {
            alert("Ошибка при получении ссылки на файл: " + (result.error || 'Неизвестная ошибка'));
          }
        } catch (error) {
          console.error('Download error:', error);
          alert("Ошибка при скачивании файла: " + (error.message || 'Неизвестная ошибка'));
        } finally {
          downloadLink.textContent = originalText;
        }
        return;
      }

      // Обработка удаления файла
      const deleteBtn = e.target.closest(".file-delete");
      if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        
        const key = deleteBtn.dataset.key;
        if (!key) {
          console.error("File key not found in delete button");
          return;
        }

        // Подтверждение удаления
        if (!confirm("Вы уверены, что хотите удалить этот файл?")) {
          return;
        }

        // Показываем индикатор удаления
        deleteBtn.disabled = true;
        const originalText = deleteBtn.textContent;
        deleteBtn.textContent = "⏳";

        try {
          console.log("Deleting file with key:", key);
          const result = await authService.deleteFile(key);

          if (result.success) {
            // Показываем уведомление без alert
            self.showSuccessMessage("Файл успешно удален!");
            
            // Обновляем список файлов без перезагрузки страницы
            await self.refreshFilesList();
          } else {
            self.showErrorMessage("Ошибка при удалении файла: " + (result.error || "Неизвестная ошибка"));
            deleteBtn.disabled = false;
            deleteBtn.textContent = originalText;
          }
        } catch (error) {
          console.error("Error deleting file:", error);
          self.showErrorMessage("Ошибка при удалении файла: " + (error.message || "Неизвестная ошибка"));
          deleteBtn.disabled = false;
          deleteBtn.textContent = originalText;
        }
      }
    });
  }

  // Метод для отображения результатов тестов
  renderTestResults(testResults) {
    if (!testResults.success) {
      return `
        <div class="test-results-section">
          <h3>Ваши результаты</h3>
          <div class="no-results">
            <p>Ошибка загрузки результатов: ${testResults.error}</p>
          </div>
        </div>
      `;
    }

    if (!testResults.results || testResults.results.length === 0) {
      return `
        <div class="test-results-section">
          <h3>Ваши результаты</h3>
          <div class="no-results">
            <p>Нет пройденных тестов</p>
          </div>
        </div>
      `;
    }

    const resultsHtml = testResults.results
      .map(
        (result) => `
      <div class="test-result-item">
        <div class="result-header">
          <span class="test-title">Вы прошли тест: ${this.getTestTitle(
            result.test_code
          )}</span>
          <span class="test-date">${new Date(
            result.completed_at
          ).toLocaleDateString("ru-RU")}</span>
        </div>
        <div class="result-score">
          <span class="score">Оценка: ${result.grade ?? "-"}</span>
        </div>
      </div>
    `
      )
      .join("");

    return `
      <div class="test-results-section">
        <h3>Ваши результаты</h3>
        <div class="test-results-list">
          ${resultsHtml}
        </div>
      </div>
    `;
  }

  // Метод для обработки формы профиля
  handleProfileForm() {
    const profileForm = document.getElementById("profile-form");

    if (profileForm) {
      profileForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const groupNumber = document.getElementById("groupNumber").value.trim();

        // Показываем индикатор загрузки
        const saveBtn = document.getElementById("save-btn");
        const originalText = saveBtn.textContent;
        saveBtn.textContent = "Сохранение...";
        saveBtn.disabled = true;

        try {
          const result = await authService.updateProfile(fullName, groupNumber);

          if (result.success) {
            alert("Данные успешно сохранены!");

            // Перезагружаем страницу, чтобы скрыть форму и показать данные
            window.location.reload();
          } else {
            alert("Ошибка при сохранении: " + result.error);
          }
        } catch (error) {
          alert("Ошибка при сохранении: " + error.message);
        } finally {
          // Восстанавливаем кнопку только если не было успешного сохранения
          if (saveBtn) {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
          }
        }
      });
    }
  }

  // Метод для рендеринга страницы
  async renderPage() {
    try {
      const userInfo = await this.displayUserInfo();
      return `
        <main id="${this.id}" class="profile">
          <h1>${this.title}</h1>
          <section>
            ${userInfo}
          </section>
        </main>
      `;
    } catch (error) {
      console.error("Ошибка при рендеринге профиля:", error);
      const errorMessage = error.message || "Не удалось загрузить данные профиля. Пожалуйста, обновите страницу.";
      return `
        <main id="${this.id}" class="profile">
          <h1>${this.title}</h1>
          <section>
            <div class="profile-container">
              <div class="error-message" style="padding: 20px; background-color: #fee; border: 1px solid #fcc; border-radius: 4px; margin: 20px 0;">
                <h3>Ошибка загрузки профиля</h3>
                <p>${errorMessage}</p>
                <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                  Обновить страницу
                </button>
              </div>
            </div>
          </section>
        </main>
      `;
    }
  }

  // Метод для обработки редактирования полей
  handleEditableFields() {
    const container = document.querySelector(".user-data-section");
    if (!container) {
      return;
    }

    // Проверяем, были ли уже добавлены обработчики (чтобы не добавлять их повторно)
    if (container.dataset.editableHandlers === "true") {
      return;
    }

    // Помечаем, что обработчики добавлены
    container.dataset.editableHandlers = "true";

    // Обработчик кнопки "Редактировать"
    container.addEventListener("click", (e) => {
      if (e.target.classList.contains("edit-btn")) {
        const field = e.target.dataset.field;
        const editableField = container.querySelector(
          `.editable-field[data-field="${field}"]`
        );
        const saveBtn = container.querySelector(
          `.save-btn-field[data-field="${field}"]`
        );
        const cancelBtn = container.querySelector(
          `.cancel-btn-field[data-field="${field}"]`
        );
        const editBtn = e.target;

        if (editableField) {
          // Активируем редактирование
          editableField.contentEditable = "true";
          editableField.classList.add("editing");
          editBtn.style.display = "none";
          saveBtn.style.display = "inline-block";
          cancelBtn.style.display = "inline-block";
          editableField.focus();

          // Выделяем весь текст для удобства редактирования
          const range = document.createRange();
          range.selectNodeContents(editableField);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    });

    // Обработчик кнопки "Сохранить"
    container.addEventListener("click", async (e) => {
      if (e.target.classList.contains("save-btn-field")) {
        const field = e.target.dataset.field;
        const editableField = container.querySelector(
          `.editable-field[data-field="${field}"]`
        );
        const saveBtn = e.target;
        const cancelBtn = container.querySelector(
          `.cancel-btn-field[data-field="${field}"]`
        );
        const editBtn = container.querySelector(
          `.edit-btn[data-field="${field}"]`
        );

        if (editableField) {
          const newValue = editableField.textContent.trim();
          const originalValue = editableField.dataset.original;

          // Проверяем, изменилось ли значение
          if (newValue === originalValue) {
            // Значение не изменилось, просто отменяем редактирование
            editableField.contentEditable = "false";
            editableField.classList.remove("editing");
            saveBtn.style.display = "none";
            cancelBtn.style.display = "none";
            editBtn.style.display = "inline-block";
            return;
          }

          // Валидация
          if (!newValue) {
            alert(
              `${
                field === "fullName" ? "Фамилия и Имя" : "Номер группы"
              } не может быть пустым`
            );
            editableField.textContent = originalValue;
            return;
          }

          // Показываем индикатор загрузки
          const originalText = saveBtn.textContent;
          saveBtn.textContent = "Сохранение...";
          saveBtn.disabled = true;
          cancelBtn.disabled = true;

          try {
            // Получаем текущие значения для всех полей
            const currentUser = await authService.getCurrentUser();
            if (!currentUser.success) {
              throw new Error(
                "Не удалось загрузить текущие данные пользователя"
              );
            }

            // Подготавливаем данные для обновления
            const updateData = {
              fullName:
                field === "fullName"
                  ? newValue
                  : currentUser.user.fullName || "",
              groupNumber:
                field === "groupNumber"
                  ? newValue
                  : currentUser.user.groupNumber || "",
            };

            const result = await authService.updateProfile(
              updateData.fullName,
              updateData.groupNumber
            );

            if (result.success) {
              // Обновляем original значение
              editableField.dataset.original = newValue;
              editableField.contentEditable = "false";
              editableField.classList.remove("editing");
              saveBtn.style.display = "none";
              cancelBtn.style.display = "none";
              editBtn.style.display = "inline-block";
              alert("Данные успешно сохранены!");
            } else {
              alert("Ошибка при сохранении: " + result.error);
              editableField.textContent = originalValue;
            }
          } catch (error) {
            alert("Ошибка при сохранении: " + error.message);
            editableField.textContent = originalValue;
          } finally {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
            cancelBtn.disabled = false;
          }
        }
      }
    });

    // Обработчик кнопки "Отмена"
    container.addEventListener("click", (e) => {
      if (e.target.classList.contains("cancel-btn-field")) {
        const field = e.target.dataset.field;
        const editableField = container.querySelector(
          `.editable-field[data-field="${field}"]`
        );
        const saveBtn = container.querySelector(
          `.save-btn-field[data-field="${field}"]`
        );
        const cancelBtn = e.target;
        const editBtn = container.querySelector(
          `.edit-btn[data-field="${field}"]`
        );

        if (editableField) {
          // Возвращаем исходное значение
          editableField.textContent = editableField.dataset.original;
          editableField.contentEditable = "false";
          editableField.classList.remove("editing");
          saveBtn.style.display = "none";
          cancelBtn.style.display = "none";
          editBtn.style.display = "inline-block";
        }
      }
    });
  }

  // Метод для инициализации страницы (вызывается после рендеринга)
  init() {
    // Обрабатываем форму после рендеринга с небольшой задержкой
    setTimeout(() => {
      this.handleProfileForm(); // Устанавливаем обработчик формы профиля
      this.handleEditableFields(); // Устанавливаем обработчики редактируемых полей
      this.handleFileUpload(); // Устанавливаем обработчик загрузки файлов
      this.handleFileDelete(); // Устанавливаем обработчик удаления файлов
    }, 10);
  }
}

export default ProfilePage;
