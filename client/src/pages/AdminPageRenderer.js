/**
 * Класс для рендеринга компонентов админ-панели */
export default class AdminPageRenderer {
  escape(text) {
    if (text === null || text === undefined) return "";
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  getTestTitle(test) {
    return test?.test_title || test?.test_code || "";
  }

  getMaxPointsByCount(count) {
    return count === 10 || count === 15 ? 100 : null;
  }

  formatDate(dateString, includeTime = true) {
    if (!dateString) return "-";
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...(includeTime && { hour: "2-digit", minute: "2-digit" }),
    };
    return new Date(dateString).toLocaleDateString("ru-RU", options);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  formatValue(value) {
    if (typeof value === "object") return JSON.stringify(value);
    if (Array.isArray(value)) return value.join(", ");
    return value ?? "";
  }

  formatAnswers(details) {
    if (!Array.isArray(details) || details.length === 0) return "-";
    const lines = details.map((d) => {
      const type = d.type || "";
      const q = d.questionNumber || "";
      const user = this.formatValue(d.userAnswer);
      const correct = this.formatValue(d.correct);
      const right = d.isCorrect ? "true" : "false";
      const score = d.score ?? 0;
      return `Вопрос ${q} (${type}):<br/>Ответ пользователя: ${this.escape(
        user
      )}<br/>Правильные ответы: ${this.escape(
        correct
      )}<br/>Верно: ${right}, Начисленные баллы: ${score}`;
    });
    return `<div class="answers-details">${lines.join("<br/><br/>")}</div>`;
  }

  renderStudentTests(tests) {
    if (!tests || tests.length === 0) {
      return `<p class="no-tests-message">Нет пройденных тестов.</p>`;
    }
    return `
      <div class="student-tests-list">
        ${tests
          .map(
            (test) => `
          <div class="test-result-item">
            <div class="test-header">
              <div class="test-title">
                ${(() => {
                  const title = this.getTestTitle(test) || "-";
                  const needVariant =
                    typeof test.variant === "number" && !/вариант/i.test(title);
                  return `${title}${
                    needVariant ? `, вариант ${test.variant}` : ""
                  }`;
                })()}
              </div>
              <div class="test-date">
                Дата: ${this.formatDate(test.completed_at)}
              </div>
            </div>
            <div class="test-details">
              ${this.formatAnswers(test.answers_details)}
              <div class="test-summary">
                Итог: ${this.formatTestSummary(test)}${
              test.grade ? `, Оценка: ${test.grade}` : ""
            }
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  formatTestSummary(test) {
    if (
      typeof test.score !== "number" ||
      (typeof test.max_points !== "number" &&
        typeof test.total_questions !== "number")
    ) {
      return "-";
    }
    const maxPoints =
      test.max_points ??
      this.getMaxPointsByCount(test.total_questions) ??
      test.total_questions;
    return `${test.score} баллов из ${maxPoints}`;
  }

  renderStudentFiles(files, studentId) {
    if (!files || files.length === 0) {
      return `
        <div class="student-files-section">
          <h4 class="files-section-title">Загруженные файлы</h4>
          <p class="no-files-message">Нет загруженных файлов</p>
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
            <span class="file-date-admin">${this.formatDate(
              file.lastModified,
              false
            )}</span>
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
        <h4 class="files-section-title files-section-title-with-border">Загруженные файлы (${files.length})</h4>
        <div class="files-list-admin">
          ${filesHtml}
        </div>
      </div>
    `;
  }

  renderStudentItem(student, studentIndex) {
    const hasFiles = student.files && student.files.length > 0;
    return `
      <div class="accordion-item" data-student-id="${student.id}">
        <div class="accordion-header" aria-expanded="false">
          <span class="student-number">${studentIndex + 1}.</span>
          <span class="student-name">${(student.fullName || "").trim()}${
      student.email ? `, ${student.email}` : ""
    }</span>
          <div class="header-right-group">
            <span class="tests-count">Тестов: ${
              student.tests?.length || 0
            }</span>
            <span class="files-indicator ${
              hasFiles ? "" : "no-files"
            }" data-student-id="${student.id}">
              ${
                hasFiles
                  ? `📁 Файлов: ${student.files.length}`
                  : "📁 Нет файлов"
              }
            </span>
            <button class="delete-user-btn" type="button" 
                    data-user-id="${student.id}" 
                    data-user-name="${this.escape(
                      (student.fullName || "").trim()
                    )}"
                    title="Удалить пользователя">
              Удалить
            </button>
            <span class="accordion-icon">▼</span>
          </div>
        </div>
        <div class="accordion-content">
          ${this.renderStudentTests(student.tests || [])}
          ${this.renderStudentFiles(student.files || [], student.id)}
        </div>
      </div>
    `;
  }

  renderGroupsTable(groups) {
    if (!groups || groups.length === 0) {
      return `<p>Нет данных по группам.</p>`;
    }
    return groups
      .map(
        (g) => `
        <h3>Группа ${g.groupNumber}</h3>
        <div class="admin-accordion">
          ${g.students
            .map((s, studentIndex) => this.renderStudentItem(s, studentIndex))
            .join("")}
        </div>
      `
      )
      .join("");
  }

  renderNoGroupTable(noGroup) {
    if (!noGroup || noGroup.length === 0) {
      return `<p class="no-group-message">Нет пользователей без указанной группы.</p>`;
    }
    return `
      <h3>Пользователи без указанной группы</h3>
      <div class="admin-accordion">
        ${noGroup
          .map((s, studentIndex) => this.renderStudentItem(s, studentIndex))
          .join("")}
      </div>
    `;
  }
}
