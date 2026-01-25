import Page from "../../common/Page.js";

class CriteriaPage extends Page {
  constructor() {
    super({
      id: "criteria",
      title: "Оценочные критерии тестов",
      metaTitle: "Оценочные критерии",
    });

    this.content = this.generateCriteriaTables();
  }

  cleanDynamicContent() {
    const root = document.getElementById("root");
    if (root) {
      root.querySelectorAll(".criteria-container").forEach((el) => el.remove());
    }
  }

  generateCriteriaTables() {
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
      <div class="table-responsive">
        <table class="table table-bordered table-striped table-hover criteria-table">
          <thead class="table-dark">
            <tr>
              <th>№ вопроса</th>
              ${[...Array(10)].map((_, i) => `<th>${i + 1}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Количество баллов</strong></td>
              ${[8, 8, 8, 10, 10, 10, 10, 10, 10, 16]
                .map((score) => `<td>${score}</td>`)
                .join("")}
            </tr>
          </tbody>
        </table>
      </div>
    `;

    const gradeTable = `
      <div class="table-responsive">
        <table class="table table-bordered table-striped table-hover criteria-table small-table">
          <thead class="table-dark">
            <tr>
              <th>Количество баллов</th>
              <th class="grade-column">Оценка</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>1-20</td><td class="grade-column"><strong>1</strong></td></tr>
            <tr><td>21-40</td><td class="grade-column"><strong>2</strong></td></tr>
            <tr><td>41-50</td><td class="grade-column"><strong>3</strong></td></tr>
            <tr><td>51-60</td><td class="grade-column"><strong>4</strong></td></tr>
            <tr><td>61-70</td><td class="grade-column"><strong>5</strong></td></tr>
            <tr><td>71-80</td><td class="grade-column"><strong>6</strong></td></tr>
            <tr><td>81-85</td><td class="grade-column"><strong>7</strong></td></tr>
            <tr><td>86-90</td><td class="grade-column"><strong>8</strong></td></tr>
            <tr><td>91-95</td><td class="grade-column"><strong>9</strong></td></tr>
            <tr><td>96-100</td><td class="grade-column"><strong>10</strong></td></tr>
          </tbody>
        </table>
      </div>
    `;

    const secondScoreTable = `
      <div class="table-responsive">
        <table class="table table-bordered table-striped table-hover criteria-table">
          <thead class="table-dark">
            <tr>
              <th>№ вопроса</th>
              ${[...Array(15)].map((_, i) => `<th>${i + 1}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Количество баллов</strong></td>
              ${[4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 10, 12, 12]
                .map((score) => `<td>${score}</td>`)
                .join("")}
            </tr>
          </tbody>
        </table>
      </div>
    `;

    const secondGradeTable = `
      <div class="table-responsive">
        <table class="table table-bordered table-striped table-hover criteria-table small-table">
          <thead class="table-dark">
            <tr>
              <th>Количество баллов</th>
              <th class="grade-column">Оценка</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>1-20</td><td class="grade-column"><strong>1</strong></td></tr>
            <tr><td>21-40</td><td class="grade-column"><strong>2</strong></td></tr>
            <tr><td>41-50</td><td class="grade-column"><strong>3</strong></td></tr>
            <tr><td>51-60</td><td class="grade-column"><strong>4</strong></td></tr>
            <tr><td>61-70</td><td class="grade-column"><strong>5</strong></td></tr>
            <tr><td>71-80</td><td class="grade-column"><strong>6</strong></td></tr>
            <tr><td>81-85</td><td class="grade-column"><strong>7</strong></td></tr>
            <tr><td>86-90</td><td class="grade-column"><strong>8</strong></td></tr>
            <tr><td>91-95</td><td class="grade-column"><strong>9</strong></td></tr>
            <tr><td>96-100</td><td class="grade-column"><strong>10</strong></td></tr>
          </tbody>
        </table>
      </div>
    `;

    return `
      <div class="criteria-container">
        <div class="alert alert-info mb-4" role="alert">
          ${explanatoryText.replace(/<p>/g, '<p class="mb-2">')}
        </div>
        <h2 class="mb-3">Шкала определяющая максимальное количество баллов за каждое задание для теста с 10 вопросами</h2>
        ${scoreTable}
        <h2 class="mb-3 mt-4">Шкала перевода суммарного количества баллов для теста с 10 вопросами</h2>
        ${gradeTable}
        <h2 class="mb-3 mt-4">Шкала определяющая максимальное количество баллов за каждое задание для теста с 15 вопросами</h2>
        ${secondScoreTable}
        <h2 class="mb-3 mt-4">Шкала перевода суммарного количества баллов для теста с 15 вопросами</h2>
        ${secondGradeTable}
      </div>
    `;
  }

  renderPage() {
    this.cleanDynamicContent();
    return this.render();
  }
}

export default CriteriaPage;

