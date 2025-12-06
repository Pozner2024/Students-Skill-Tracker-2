import Page from "../common/Page.js";
import authService from "../services/authService.js";
import errorHandler from "../services/errorHandler.js";
import apiClient from "../services/apiClient.js";
import API_CONFIG from "../config/api.js";

// Функция для показа Bootstrap alert (использует errorHandler)
function showBootstrapAlert(message, type = "info") {
  const alertTypes = {
    info: "info",
    success: "success",
    warning: "warning",
    danger: "danger",
    error: "danger",
  };
  
  errorHandler.showNotification(
    message,
    alertTypes[type] || "info",
    { duration: 5000 }
  );
}

class AdminPage extends Page {
  constructor() {
    super({
      id: "admin",
      content: "Загрузка...",
      metaTitle: "Кабинет администратора",
    });
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

  renderGroupsTable(groups) {
    if (!groups || groups.length === 0) {
      return `<p>Нет данных по группам.</p>`;
    }
    return groups
      .map(
        (g, groupIndex) => `
        <h3>Группа ${g.groupNumber}</h3>
        <div class="admin-accordion">
          ${g.students
            .map(
              (s, studentIndex) => `
              <div class="accordion-item" data-student-id="${s.id}">
                <div class="accordion-header" 
                     onclick="this.classList.toggle('active');
                              this.nextElementSibling.classList.toggle('active');"
                     aria-expanded="false">
                  <span class="student-number">${studentIndex + 1}.</span>
                  <span class="student-name">${(s.fullName || "").trim()}${
                s.email ? `, ${s.email}` : ""
              }</span>
                  <div class="header-right-group">
                    <span class="tests-count">Тестов: ${
                      s.tests?.length || 0
                    }</span>
                    <span class="files-indicator ${
                      s.files && s.files.length > 0 ? "" : "no-files"
                    }" data-student-id="${s.id}">
                      ${
                        s.files && s.files.length > 0
                          ? `📁 Файлов: ${s.files.length}`
                          : "📁 Нет файлов"
                      }
                    </span>
                    <button class="delete-user-btn" type="button" 
                            data-user-id="${s.id}" 
                            data-user-name="${this.escape(
                              (s.fullName || "").trim()
                            )}"
                            title="Удалить пользователя">
                      Удалить
                    </button>
                    <span class="accordion-icon">▼</span>
                  </div>
                </div>
                <div class="accordion-content">
                  ${this.renderStudentTests(s.tests || [])}
                  ${this.renderStudentFiles(s.files || [], s.id)}
                </div>
              </div>
            `
            )
            .join("")}
        </div>
      `
      )
      .join("");
  }

  renderStudentTests(tests) {
    if (!tests || tests.length === 0) {
      return `<p style="padding: 1rem; color: #666;">Нет пройденных тестов.</p>`;
    }
    return `
      <div class="student-tests-list">
        ${tests
          .map(
            (test, index) => `
          <div class="test-result-item">
            <div class="test-header">
              <div style="font-weight:600; margin-bottom:6px;">
                ${(() => {
                  const title = this.getTestTitle(test.test_code) || "-";
                  const needVariant =
                    typeof test.variant === "number" && !/вариант/i.test(title);
                  return `${title}${
                    needVariant ? `, вариант ${test.variant}` : ""
                  }`;
                })()}
              </div>
              <div style="font-size:0.9em; color:#666; margin-bottom:8px;">
                Дата: ${
                  test.completed_at
                    ? new Date(test.completed_at).toLocaleDateString("ru-RU", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"
                }
              </div>
            </div>
            <div class="test-details">
              ${this.formatAnswers(test.answers_details)}
              <div style="margin-top:12px; font-weight:600; padding-top:12px; border-top:1px solid #ddd;">
                Итог: ${
                  typeof test.score === "number" &&
                  (typeof test.max_points === "number" ||
                    typeof test.total_questions === "number")
                    ? `${test.score} баллов из ${
                        typeof test.max_points === "number"
                          ? test.max_points
                          : this.getMaxPointsByCount(test.total_questions) ??
                            test.total_questions
                      }`
                    : "-"
                }${test.grade ? `, Оценка: ${test.grade}` : ""}
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  renderNoGroupTable(noGroup) {
    if (!noGroup || noGroup.length === 0) {
      return `<p>Нет пользователей без указанной группы.</p>`;
    }
    return `
      <h3>Пользователи без указанной группы</h3>
      <div class="admin-accordion">
        ${noGroup
          .map(
            (s, studentIndex) => `
            <div class="accordion-item" data-student-id="${s.id}">
              <div class="accordion-header" 
                   onclick="this.classList.toggle('active');
                            this.nextElementSibling.classList.toggle('active');"
                   aria-expanded="false">
                <span class="student-number">${studentIndex + 1}.</span>
                <span class="student-name">${(s.fullName || "").trim()}${
              s.email ? `, ${s.email}` : ""
            }</span>
                <div class="header-right-group">
                  <span class="tests-count">Тестов: ${
                    s.tests?.length || 0
                  }</span>
                  <span class="files-indicator ${
                    s.files && s.files.length > 0 ? "" : "no-files"
                  }" data-student-id="${s.id}">
                    ${
                      s.files && s.files.length > 0
                        ? `📁 Файлов: ${s.files.length}`
                        : "📁 Нет файлов"
                    }
                  </span>
                  <button class="delete-user-btn" type="button" 
                          data-user-id="${s.id}" 
                          data-user-name="${this.escape(
                            (s.fullName || "").trim()
                          )}"
                          title="Удалить пользователя">
                    Удалить
                  </button>
                  <span class="accordion-icon">▼</span>
                </div>
              </div>
              <div class="accordion-content">
                ${this.renderStudentTests(s.tests || [])}
                ${this.renderStudentFiles(s.files || [], s.id)}
              </div>
            </div>
          `
          )
          .join("")}
      </div>
    `;
  }

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
    return testTitles[testCode] || testCode || "";
  }

  formatAnswers(details) {
    if (!Array.isArray(details) || details.length === 0) return "-";
    const lines = details.map((d) => {
      const type = d.type || "";
      const q = d.questionNumber || "";
      const user =
        typeof d.userAnswer === "object"
          ? JSON.stringify(d.userAnswer)
          : Array.isArray(d.userAnswer)
          ? d.userAnswer.join(", ")
          : d.userAnswer ?? "";
      const correct =
        typeof d.correct === "object"
          ? JSON.stringify(d.correct)
          : Array.isArray(d.correct)
          ? d.correct.join(", ")
          : d.correct ?? "";
      const right = d.isCorrect ? "true" : "false";
      const score = d.score ?? 0;
      return `Вопрос ${q} (${type}):<br/>Ответ пользователя: ${this.escape(
        user
      )}<br/>Правильные ответы: ${this.escape(
        correct
      )}<br/>Верно: ${right}, Начисленные баллы: ${score}`;
    });
    return `<div style="width:min(100%,420px); white-space:normal; line-height:1.3">${lines.join(
      "<br/><br/>"
    )}</div>`;
  }

  escape(text) {
    if (text === null || text === undefined) return "";
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  getMaxPointsByCount(count) {
    if (count === 10) return 100;
    if (count === 15) return 100;
    return null;
  }

  renderStudentFiles(files, studentId) {
    if (!files || files.length === 0) {
      return `
        <div class="student-files-section">
          <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem; color: black;">Загруженные файлы</h4>
          <p style="padding: 0.5rem; color: black; font-style: italic;">Нет загруженных файлов</p>
        </div>
      `;
    }

    const filesHtml = files
      .map(
        (file) => `
        <div class="file-item-admin" data-key="${this.escape(file.key)}">
          <div class="file-info-admin">
            <span class="file-name-admin">${this.escape(file.fileName)}</span>
            <span class="file-size-admin">${this.formatFileSize(
              file.size
            )}</span>
            <span class="file-date-admin">${new Date(
              file.lastModified
            ).toLocaleDateString("ru-RU")}</span>
          </div>
          <div class="file-actions-admin">
            <button class="file-download-admin" data-key="${this.escape(
              file.key
            )}" title="Скачать">
              ⬇️ Скачать
            </button>
            <button type="button" class="file-delete-admin" data-key="${this.escape(
              file.key
            )}" title="Удалить">
              🗑️ Удалить
            </button>
          </div>
        </div>
      `
      )
      .join("");

    return `
      <div class="student-files-section">
        <h4 style="margin-top: 1.5rem; margin-bottom: 0.75rem; color: black; border-top: 1px solid #ddd; padding-top: 1rem;">Загруженные файлы (${files.length})</h4>
        <div class="files-list-admin">
          ${filesHtml}
        </div>
      </div>
    `;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  async renderPage() {
    // Возвращаем разметку; данные подтянутся в init()
    return `
      <main id="admin" class="container my-4">
        <h1>Кабинет преподавателя</h1>
        <section>
          <div class="test-results-section">
            <div class="loading-placeholder">Загрузка...</div>
          </div>
        </section>
      </main>
      <style>
        #admin h3 {
          color: black;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .admin-accordion {
          margin-bottom: 2rem;
        }
        .accordion-item {
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 0.5rem;
          background: #fff;
          overflow: hidden;
        }
        .accordion-header {
          width: 100%;
          padding: 1rem 1.5rem;
          background: #f8f9fa;
          border: none;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 1rem;
          transition: background-color 0.2s;
          box-sizing: border-box;
        }
        .accordion-header:hover {
          background: #e9ecef;
        }
        .accordion-header.active {
          background: #e7f3ff;
          border-bottom: 1px solid #ddd;
        }
        .student-number {
          margin-right: 0.75rem;
          font-weight: 600;
          color: #666;
          min-width: 2rem;
          text-align: right;
        }
        .student-name {
          flex: 1;
          font-weight: 600;
          color: #000;
          min-width: 0;
        }
        @media (min-width: 993px) {
          .student-name {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
        .header-right-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-left: auto;
          flex-shrink: 0;
        }
        .tests-count {
          margin-left: 0;
          padding: 0.5rem 0.75rem;
          background: #007bff;
          color: #fff;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
          min-width: 80px;
          text-align: center;
          display: inline-block;
          line-height: 1.2;
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .accordion-icon {
          margin-left: 1rem;
          transition: transform 0.3s;
          color: #666;
          flex-shrink: 0;
        }
        .accordion-header.active .accordion-icon {
          transform: rotate(180deg);
        }
        .accordion-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
        }
        .accordion-content.active {
          max-height: 5000px;
          transition: max-height 0.5s ease-in;
        }
        .student-tests-list {
          padding: 1rem 1.5rem;
        }
        .test-result-item {
          padding: 1rem;
          margin-bottom: 1rem;
          background: #f8f9fa;
          border-radius: 4px;
          border-left: 3px solid #007bff;
        }
        .test-result-item:last-child {
          margin-bottom: 0;
        }
        .test-header {
          margin-bottom: 0.75rem;
        }
        .test-details {
          color: #000;
        }
        .files-indicator {
          margin-left: 0;
          padding: 0.5rem 0.75rem;
          background: #28a745;
          color: #fff;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
          min-width: 80px;
          text-align: center;
          display: inline-block;
          line-height: 1.2;
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .files-indicator.no-files {
          background: #6c757d;
        }
        .student-files-section {
          margin-top: 1rem;
          padding-top: 1rem;
        }
        .files-list-admin {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .file-item-admin {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 4px;
          border-left: 3px solid #28a745;
        }
        .file-info-admin {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }
        .file-name-admin {
          font-weight: 600;
          color: #000;
        }
        .file-size-admin,
        .file-date-admin {
          font-size: 0.875rem;
          color: black;
        }
        .file-actions-admin {
          display: flex;
          gap: 0.5rem;
        }
        .file-download-admin,
        .file-delete-admin {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background-color 0.2s;
        }
        .file-download-admin {
          background: #007bff;
          color: #fff;
        }
        .file-download-admin:hover {
          background: #0056b3;
        }
        .file-delete-admin {
          background: #dc3545;
          color: #fff;
        }
        .file-delete-admin:hover {
          background: #c82333;
        }
        .file-download-admin:disabled,
        .file-delete-admin:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .delete-user-btn {
          margin-left: 0;
          padding: 0.5rem 0.75rem;
          background: #dc3545;
          color: #fff;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background-color 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
          min-width: 80px;
          text-align: center;
          line-height: 1.2;
          box-sizing: border-box;
        }
        .delete-user-btn:hover {
          background: #c82333;
        }
        .delete-user-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @media (width < 992px) {
          .accordion-header {
            flex-wrap: wrap;
            padding: 0.75rem 1rem;
          }
          .student-number {
            order: 1;
          }
          .student-name {
            width: 100%;
            margin-top: 0.5rem;
            order: 2;
            overflow: visible;
            text-overflow: clip;
            white-space: normal;
            word-break: break-word;
          }
          .header-right-group {
            width: 100%;
            margin-left: 0;
            margin-top: 0.5rem;
            order: 3;
            justify-content: flex-start;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .accordion-icon {
            margin-left: auto;
            order: 0;
          }
        }
        @media (width < 768px) {
          .tests-count,
          .files-indicator,
          .delete-user-btn {
            min-width: 70px;
            padding: 0.4rem 0.6rem;
            font-size: 0.8rem;
          }
          .accordion-header {
            padding: 0.75rem;
          }
        }
        @media (width < 576px) {
          .tests-count,
          .files-indicator,
          .delete-user-btn {
            min-width: 60px;
            padding: 0.35rem 0.5rem;
            font-size: 0.75rem;
          }
          .tests-count {
            min-width: auto;
            padding: 0.35rem 0.6rem;
          }
          .files-indicator {
            min-width: auto;
            padding: 0.35rem 0.6rem;
          }
        }
      </style>
    `;
  }

  async init() {
    const container = document.querySelector("#admin .test-results-section");
    if (!container) return;
    try {
      // Начинаем загрузку данных сразу
      const data = await this.fetchResults();

      // Рендерим данные без лишних логов для ускорения
      const groupsHtml = this.renderGroupsTable(data.groups);
      const noGroupHtml = this.renderNoGroupTable(data.noGroup);
      container.innerHTML = `${groupsHtml}<hr />${noGroupHtml}`;

      // Добавляем обработчики событий для файлов
      this.addFileEventListeners();
      // Добавляем обработчики событий для удаления пользователей
      this.addUserDeleteEventListeners();
    } catch (e) {
      console.error("Error loading admin data:", e);
      container.innerHTML = `<div class="no-results"><p>${e.message}</p></div>`;
    }
  }

  addFileEventListeners() {
    // Используем делегирование на более стабильном родительском элементе
    // Ищем контейнер админ-панели, который не пересоздается
    const adminContainer = document.querySelector("#admin");
    if (!adminContainer) {
      console.warn("Admin container not found");
      return;
    }

    // Проверяем, были ли уже добавлены обработчики
    if (adminContainer.dataset.fileHandlers === "true") {
      console.log("File handlers already added");
      return;
    }

    adminContainer.dataset.fileHandlers = "true";
    console.log("Adding file event listeners to admin container");

    // Сохраняем ссылку на this
    const self = this;

    // Обработчик для скачивания и удаления файлов через делегирование
    adminContainer.addEventListener("click", async (e) => {
      console.log(
        "Click event in admin container:",
        e.target,
        e.target.classList
      );

      // Сначала проверяем, не это ли кнопка удаления пользователя (чтобы не конфликтовать)
      const userDeleteBtn = e.target.closest(".delete-user-btn");
      if (userDeleteBtn) {
        // Это обрабатывается другим обработчиком
        return;
      }

      const downloadBtn = e.target.closest(".file-download-admin");
      if (downloadBtn) {
        e.preventDefault();
        e.stopPropagation();

        const key = downloadBtn.dataset.key;
        if (!key) return;

        downloadBtn.disabled = true;
        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = "⏳ Загрузка...";

        try {
          const result = await authService.getStudentFileDownloadUrl(key);
          if (result.success && result.url) {
            // Получаем имя файла из элемента
            const fileItem = downloadBtn.closest(".file-item-admin");
            const fileNameElement = fileItem?.querySelector(".file-name-admin");
            const fileName =
              fileNameElement?.textContent ||
              key.split("/").pop() ||
              "download";

            try {
              // Получаем файл через fetch как blob
              const response = await fetch(result.url, {
                method: "GET",
                mode: "cors",
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const blob = await response.blob();

              // Создаем blob URL и скачиваем файл
              const blobUrl = window.URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = blobUrl;
              link.download = fileName;
              link.style.display = "none";
              document.body.appendChild(link);
              link.click();

              // Удаляем ссылку и освобождаем blob URL после небольшой задержки
              setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
              }, 100);
            } catch (fetchError) {
              // Если fetch не работает, пробуем напрямую через ссылку
              console.warn("Fetch failed, trying direct link:", fetchError);
              const link = document.createElement("a");
              link.href = result.url;
              link.download = fileName;
              link.style.display = "none";
              document.body.appendChild(link);
              link.click();
              setTimeout(() => document.body.removeChild(link), 100);
            }
          } else {
            errorHandler.handle(result, "AdminPage.downloadFile.getUrl");
          }
        } catch (error) {
          errorHandler.handle(error, "AdminPage.downloadFile");
        } finally {
          downloadBtn.disabled = false;
          downloadBtn.textContent = originalText;
        }
        return;
      }

      // Обработчик для удаления файлов
      const deleteBtn = e.target.closest(".file-delete-admin");
      if (deleteBtn) {
        console.log("Delete button clicked:", deleteBtn);
        e.preventDefault();
        e.stopPropagation();

        const key = deleteBtn.dataset.key;
        console.log("Delete button key:", key);
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
          console.log("Deleting file with key:", key);
          const result = await authService.deleteStudentFile(key);
          console.log("Delete result:", result);

          if (result.success) {
            // Удаляем элемент из DOM
            const fileItem = deleteBtn.closest(".file-item-admin");
            if (fileItem) {
              fileItem.remove();

              // Обновляем индикатор файлов
              const studentId = fileItem
                .closest(".accordion-item")
                ?.querySelector(".files-indicator")?.dataset.studentId;
              if (studentId) {
                self.updateFilesIndicator(studentId);
              }
            }
            errorHandler.showSuccess("Файл успешно удален");
          } else {
            errorHandler.handle(result, "AdminPage.deleteFile");
            deleteBtn.disabled = false;
            deleteBtn.textContent = originalText;
          }
        } catch (error) {
          errorHandler.handle(error, "AdminPage.deleteFile");
          deleteBtn.disabled = false;
          deleteBtn.textContent = originalText;
        }
        return;
      }
    });
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
          indicator.style.background = "#28a745";
        } else {
          indicator.textContent = "📁 Нет файлов";
          indicator.classList.add("no-files");
          indicator.style.background = "#6c757d";
        }
      }
    } catch (error) {
      console.error("Ошибка при обновлении индикатора файлов:", error);
    }
  }

  addUserDeleteEventListeners() {
    const adminContainer = document.querySelector("#admin");
    if (!adminContainer) {
      console.warn("Admin container not found");
      return;
    }

    // Проверяем, были ли уже добавлены обработчики
    if (adminContainer.dataset.userDeleteHandlers === "true") {
      console.log("User delete handlers already added");
      return;
    }

    adminContainer.dataset.userDeleteHandlers = "true";
    console.log("Adding user delete event listeners to admin container");

    // Сохраняем ссылку на this
    const self = this;

    // Обработчик для удаления пользователей через делегирование
    adminContainer.addEventListener("click", async (e) => {
      console.log(
        "Click event in admin container:",
        e.target,
        e.target.classList
      );
      const deleteBtn = e.target.closest(".delete-user-btn");
      if (deleteBtn) {
        console.log("Delete button clicked:", deleteBtn);
        e.preventDefault();
        e.stopPropagation();

        const userId = deleteBtn.dataset.userId;
        const userName = deleteBtn.dataset.userName || "пользователя";

        console.log("User ID:", userId, "User name:", userName);

        if (!userId) {
          console.error("User ID not found in delete button");
          errorHandler.showWarning("Ошибка: ID пользователя не найден");
          return;
        }

        if (
          !confirm(
            `Вы уверены, что хотите удалить пользователя "${userName}"?\n\nЭто действие удалит:\n- Пользователя\n- Все его тесты\n- Все его файлы\n\nЭто действие нельзя отменить!`
          )
        ) {
          return;
        }

        deleteBtn.disabled = true;
        const originalText = deleteBtn.textContent;
        deleteBtn.textContent = "⏳";

        try {
          console.log("Deleting user with ID:", userId);
          const result = await authService.deleteUser(userId);
          console.log("Delete user result:", result);

          if (result.success) {
            // Удаляем элемент из DOM
            const accordionItem = deleteBtn.closest(".accordion-item");
            if (accordionItem) {
              accordionItem.remove();
              errorHandler.showSuccess("Пользователь успешно удален");
              // Перезагружаем страницу для обновления списка
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            }
          } else {
            errorHandler.handle(result, "AdminPage.deleteUser");
            deleteBtn.disabled = false;
            deleteBtn.textContent = originalText;
          }
        } catch (error) {
          errorHandler.handle(error, "AdminPage.deleteUser");
          deleteBtn.disabled = false;
          deleteBtn.textContent = originalText;
        }
        return;
      }
    });
  }
}

export default AdminPage;
