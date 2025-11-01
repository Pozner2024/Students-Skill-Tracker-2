import Page from "../common/Page.js";

class CriteriaPage extends Page {
  constructor() {
    super({
      id: "criteria", // Уникальный идентификатор страницы
      title: "Оценочные критерии тестов", // Заголовок страницы
      metaTitle: "Оценочные критерии", // Мета-заголовок для вкладки браузера
    });

    this.content = this.generateCriteriaTables();
  }

  // Метод для очистки динамического контента, если это потребуется
  cleanDynamicContent() {
    const root = document.getElementById("root");
    if (root) {
      root.querySelectorAll(".criteria-container").forEach((el) => el.remove());
    }
  }

  // Метод для динамической генерации всех таблиц
  generateCriteriaTables() {
    // Пояснительный текст перед таблицами
    const explanatoryText = `
      <div class="criteria-explanation">
        <p>Данные таблицы описывают систему оценивания тестов по количеству набранных баллов. В зависимости от числа вопросов в тесте (10 или 15), каждая таблица отображает максимальные баллы, которые можно получить за каждый вопрос, а также шкалу перевода общего числа баллов в итоговую оценку.</p>
        <p>- Первая таблица показывает распределение баллов для теста с 10 вопросами: каждому вопросу присвоен вес в баллах, который влияет на итоговую оценку.</p>
        <p>- Вторая таблица иллюстрирует, как сумма набранных баллов по тесту с 10 вопросами переводится в оценку по десятибалльной шкале.</p>
        <p>- Третья таблица описывает распределение баллов для теста с 15 вопросами, аналогично первой таблице, где каждый вопрос имеет свой вес.</p>
        <p>- Четвертая таблица аналогично второй показывает перевод суммы баллов теста с 15 вопросами в итоговую оценку.</p>
        <p>Это позволяет наглядно увидеть, сколько баллов можно получить за каждый вопрос и как это влияет на итоговый результат тестирования.</p>
      </div>
    `;

    const scoreTable = `
      <table class="criteria-table">
        <thead>
          <tr>
            <th>№ вопроса</th>
            ${[...Array(10)].map((_, i) => `<th>${i + 1}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Количество баллов</td>
            ${[8, 8, 8, 10, 10, 10, 10, 10, 10, 16]
              .map((score) => `<td>${score}</td>`)
              .join("")}
          </tr>
        </tbody>
      </table>
    `;

    const gradeTable = `
      <table class="criteria-table small-table">
        <thead>
          <tr>
            <th>Количество баллов</th>
            <th class="grade-column">Оценка</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>1-20</td><td class="grade-column">1</td></tr>
          <tr><td>21-40</td><td class="grade-column">2</td></tr>
          <tr><td>41-50</td><td class="grade-column">3</td></tr>
          <tr><td>51-60</td><td class="grade-column">4</td></tr>
          <tr><td>61-70</td><td class="grade-column">5</td></tr>
          <tr><td>71-80</td><td class="grade-column">6</td></tr>
          <tr><td>81-85</td><td class="grade-column">7</td></tr>
          <tr><td>86-90</td><td class="grade-column">8</td></tr>
          <tr><td>91-95</td><td class="grade-column">9</td></tr>
          <tr><td>96-100</td><td class="grade-column">10</td></tr>
        </tbody>
      </table>
    `;

    const secondScoreTable = `
      <table class="criteria-table">
        <thead>
          <tr>
            <th>№ вопроса</th>
            ${[...Array(15)].map((_, i) => `<th>${i + 1}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Количество баллов</td>
            ${[4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 10, 12, 12]
              .map((score) => `<td>${score}</td>`)
              .join("")}
          </tr>
        </tbody>
      </table>
    `;

    const secondGradeTable = `
      <table class="criteria-table small-table">
        <thead>
          <tr>
            <th>Количество баллов</th>
            <th class="grade-column">Оценка</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>1-20</td><td class="grade-column">1</td></tr>
          <tr><td>21-40</td><td class="grade-column">2</td></tr>
          <tr><td>41-50</td><td class="grade-column">3</td></tr>
          <tr><td>51-60</td><td class="grade-column">4</td></tr>
          <tr><td>61-70</td><td class="grade-column">5</td></tr>
          <tr><td>71-80</td><td class="grade-column">6</td></tr>
          <tr><td>81-85</td><td class="grade-column">7</td></tr>
          <tr><td>86-90</td><td class="grade-column">8</td></tr>
          <tr><td>91-95</td><td class="grade-column">9</td></tr>
          <tr><td>96-100</td><td class="grade-column">10</td></tr>
        </tbody>
      </table>
    `;

    // Возвращаем пояснительный текст и таблицы
    return `
      <div class="criteria-container">
        ${explanatoryText}
        <h2>Шкала определяющая максимальное количество баллов за каждое задание для теста с 10 вопросами</h2>
        ${scoreTable}
        <h2>Шкала перевода суммарного количества баллов для теста с 10 вопросами</h2>
        ${gradeTable}
        <h2>Шкала определяющая максимальное количество баллов за каждое задание для теста с 15 вопросами</h2>
        ${secondScoreTable}
        <h2>Шкала перевода суммарного количества баллов для теста с 15 вопросами</h2>
        ${secondGradeTable}
      </div>
    `;
  }

  // Метод для рендеринга страницы
  renderPage() {
    this.cleanDynamicContent(); // Очищаем динамическую часть перед рендерингом
    return this.render(); // Возвращаем HTML-код страницы
  }
}

export default CriteriaPage;
