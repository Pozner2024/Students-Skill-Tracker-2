function getTestTitle(test) {
  if (test && test.test_title) {
    return test.test_title;
  }
  if (test && test.test_code) {
    return test.test_code;
  }
  if (typeof test === "string") {
    return test;
  }
  return "";
}

export function renderTestResults(testResults) {
  if (!testResults.success) {
    return `
        <div class="test-results-section">
          <h3>Ваши результаты</h3>
          <div class="alert alert-warning" role="alert">
            Ошибка загрузки результатов: ${testResults.error}
          </div>
        </div>
      `;
  }

  if (!testResults.results || testResults.results.length === 0) {
    return `
        <div class="test-results-section">
          <h3>Ваши результаты</h3>
          <div class="alert alert-info" role="alert">
            Нет пройденных тестов
          </div>
        </div>
      `;
  }

  const resultsHtml = testResults.results
    .map(
      (result) => `
      <div class="test-result-item">
        <div class="result-header">
          <span class="test-title">Вы прошли тест: ${getTestTitle(result)}</span>
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

