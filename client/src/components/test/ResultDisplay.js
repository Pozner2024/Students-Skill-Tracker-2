// Этот класс ResultDisplay отвечает за отображение результатов теста и визуальное оформление
// с помощью анимации конфетти для успешного завершения теста.

import ScoreCalculator from "./ScoreCalculator.js";

class ResultDisplay {
  constructor(testInstance) {
    this.testInstance = testInstance;
    this.scoreCalculator = new ScoreCalculator(testInstance);
  }

  getGrade(totalScore, questionCount) {
    const gradingScale = {
      10: [
        [1, 20, 1],
        [21, 40, 2],
        [41, 50, 3],
        [51, 60, 4],
        [61, 70, 5],
        [71, 80, 6],
        [81, 85, 7],
        [86, 90, 8],
        [91, 95, 9],
        [96, 100, 10],
      ],
      15: [
        [1, 20, 1],
        [21, 40, 2],
        [41, 50, 3],
        [51, 60, 4],
        [61, 70, 5],
        [71, 80, 6],
        [81, 85, 7],
        [86, 90, 8],
        [91, 95, 9],
        [96, 100, 10],
      ],
    };
    return (
      gradingScale[questionCount].find(
        ([min, max]) => totalScore >= min && totalScore <= max
      )?.[2] || "Пройдите тест еще раз"
    );
  }

  displayResultsPage(totalScore) {
    const questionCount = this.testInstance.questions.length;
    const grade = this.getGrade(totalScore, questionCount);

    // Условие для отображения сообщения вместо оценки
    const gradeDisplay =
      totalScore === 0 ? "Пройдите, пожалуйста, тест еще раз" : grade;
  }
}

export default ResultDisplay;

