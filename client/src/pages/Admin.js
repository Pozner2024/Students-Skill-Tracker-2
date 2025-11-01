import Page from "../common/Page.js";
import authService from "../utils/authService.js";
import API_CONFIG from "../config/api.js";

class AdminPage extends Page {
  constructor() {
    super({
      id: "admin",
      content: "Загрузка...",
      metaTitle: "Кабинет администратора",
    });
  }

  async fetchResults() {
    const url = `${API_CONFIG.BASE_URL}/admin/results`;
    const res = await fetch(url, { headers: authService.getAuthHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Ошибка загрузки данных администратора");
    }
    return res.json();
  }

  renderGroupsTable(groups) {
    if (!groups || groups.length === 0) {
      return `<p>Нет данных по группам.</p>`;
    }
    return groups
      .map(
        (g) => `
        <h3>Группа ${g.groupNumber}</h3>
        <table class="criteria-table" style="color:#000">
          <thead>
            <tr>
              <th>Фамилия Имя, e-mail</th>
              <th style="width:85%">Тема теста, вариант и итоги тестирования</th>
              <th style="width:15%; white-space:nowrap">Дата</th>
            </tr>
          </thead>
          <tbody>
            ${g.students
              .map(
                (s) => `
                <tr>
                  <td>${(s.fullName || "").trim()}${
                  s.email ? `, ${s.email}` : ""
                }</td>
                  <td style="width:85%">
                    <div style="font-weight:600; margin-bottom:6px;">${(() => {
                      const title = this.getTestTitle(s.test_code) || "-";
                      const needVariant =
                        typeof s.variant === "number" &&
                        !/вариант/i.test(title);
                      return `${title}${
                        needVariant ? `, вариант ${s.variant}` : ""
                      }`;
                    })()}</div>
                    ${this.formatAnswers(s.answers_details)}
                    <div style="margin-top:8px; font-weight:600;">Итог: ${
                      typeof s.score === "number" &&
                      (typeof s.max_points === "number" ||
                        typeof s.total_questions === "number")
                        ? `${s.score} баллов из ${
                            typeof s.max_points === "number"
                              ? s.max_points
                              : this.getMaxPointsByCount(s.total_questions) ??
                                s.total_questions
                          }`
                        : "-"
                    }${s.grade ? `, Оценка: ${s.grade}` : ""}</div>
                  </td>
                  <td style="width:15%; white-space:nowrap">${
                    s.completed_at
                      ? new Date(s.completed_at).toLocaleDateString("ru-RU")
                      : "-"
                  }</td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>
      `
      )
      .join("");
  }

  renderNoGroupTable(noGroup) {
    if (!noGroup || noGroup.length === 0) {
      return `<p>Нет пользователей без указанной группы.</p>`;
    }
    return `
      <h3>Пользователи без указанной группы</h3>
      <table class="criteria-table" style="color:#000">
        <thead>
          <tr>
            <th>Фамилия Имя, e-mail</th>
            <th style="width:85%">Тема теста, вариант и итоги тестирования</th>
            <th style="width:15%; white-space:nowrap">Дата</th>
          </tr>
        </thead>
        <tbody>
          ${noGroup
            .map(
              (s) => `
              <tr>
                <td>${(s.fullName || "").trim()}${
                s.email ? `, ${s.email}` : ""
              }</td>
                <td style="width:85%">
                  <div style="font-weight:600; margin-bottom:6px;">${(() => {
                    const title = this.getTestTitle(s.test_code) || "-";
                    const needVariant =
                      typeof s.variant === "number" && !/вариант/i.test(title);
                    return `${title}${
                      needVariant ? `, вариант ${s.variant}` : ""
                    }`;
                  })()}</div>
                  ${this.formatAnswers(s.answers_details)}
                  <div style="margin-top:8px; font-weight:600;">Итог: ${
                    typeof s.score === "number" &&
                    (typeof s.max_points === "number" ||
                      typeof s.total_questions === "number")
                      ? `${s.score} баллов из ${
                          typeof s.max_points === "number"
                            ? s.max_points
                            : this.getMaxPointsByCount(s.total_questions) ??
                              s.total_questions
                        }`
                      : "-"
                  }${s.grade ? `, Оценка: ${s.grade}` : ""}</div>
                </td>
                <td style="width:15%; white-space:nowrap">${
                  s.completed_at
                    ? new Date(s.completed_at).toLocaleDateString("ru-RU")
                    : "-"
                }</td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
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
    return `<div style="max-width:420px; white-space:normal; line-height:1.3">${lines.join(
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

  async renderPage() {
    // Возвращаем разметку; данные подтянутся в init()
    return `
      <main id="admin" class="container">
        <h1>Кабинет преподавателя</h1>
        <section>
          <div class="test-results-section">
            <div class="loading-placeholder">Загрузка...</div>
          </div>
        </section>
      </main>
    `;
  }

  async init() {
    const container = document.querySelector("#admin .test-results-section");
    if (!container) return;
    try {
      const data = await this.fetchResults();
      const groupsHtml = this.renderGroupsTable(data.groups);
      const noGroupHtml = this.renderNoGroupTable(data.noGroup);
      container.innerHTML = `${groupsHtml}<hr />${noGroupHtml}`;
    } catch (e) {
      container.innerHTML = `<div class="no-results"><p>${e.message}</p></div>`;
    }
  }
}

export default AdminPage;
