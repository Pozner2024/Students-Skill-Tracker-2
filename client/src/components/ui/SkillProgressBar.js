// // Класс SkillProgressBar отвечает за отображение прогресса пользователя по итогам тестирования.
// // Он создает графические полоски прогресса (процент отвеченных вопросов, набранные баллы,
// // оценка) и добавляет анимацию и конфетти.

import confetti from "canvas-confetti";

class SkillProgressBar {
  constructor(answeredPercentage, userScore, userGrade, testTopic) {
    this.answeredPercentage = answeredPercentage;
    this.userScore = userScore;
    this.userGrade = userGrade;
    this.testTopic = testTopic;
  }

  createScaleMarkup(totalDivisions, maxValue) {
    let scaleMarkup = "";
    for (let i = 0; i <= totalDivisions; i++) {
      const label = Math.round((i * maxValue) / totalDivisions);
      scaleMarkup += `<span class="scale-label">${label}</span>`;
    }
    return `<div class="scale-container">${scaleMarkup}</div>`;
  }

  createProgressBarMarkup(
    label,
    value,
    maxValue,
    totalDivisions,
    showPercentage = false
  ) {
    const scaleMarkup = this.createScaleMarkup(totalDivisions, maxValue);
    const displayValue = showPercentage ? `${Math.round(value)}%` : value;

    return `
      <div class="progress-container">
        <p>${label}: <span class="value-label">${displayValue}</span>${
      showPercentage ? "" : ` / ${maxValue}`
    }</p>
        ${scaleMarkup}
        <div class="progress-bar">
          <div class="progress-fill" data-target="${
            (value / maxValue) * 100
          }%"></div>
        </div>
      </div>
    `;
  }

  render(rootId) {
    const rootContainer = document.getElementById(rootId);

    const headerDiv = `
      <div class="header-container">
        <h2>Итоги тестирования по теме: ${this.testTopic}</h2>
      </div>
    `;

    const questionsBar = this.createProgressBarMarkup(
      "Количество отвеченных вопросов",
      this.answeredPercentage,
      100,
      10,
      true
    );
    const scoreBar = this.createProgressBarMarkup(
      "Количество набранных баллов",
      this.userScore,
      100,
      10
    );
    const gradeBar = this.createProgressBarMarkup(
      "Ваша оценка",
      this.userGrade,
      10,
      10
    );

    rootContainer.innerHTML = headerDiv + questionsBar + scoreBar + gradeBar;

    setTimeout(() => this.animateProgressBars(), 100);
  }

  animateProgressBars() {
    const progressFills = document.querySelectorAll(".progress-fill");
    let totalAnimationTime = 0;

    progressFills.forEach((fill, index) => {
      const targetWidth = fill.getAttribute("data-target");

      setTimeout(() => {
        fill.style.width = targetWidth;
        fill.classList.add("complete");
      }, index * 1000);

      totalAnimationTime += 1000;
    });

    if (this.userGrade > 5) {
      setTimeout(() => this.runConfetti(), totalAnimationTime + 1000);
    }
  }

  runConfetti() {
    const confettiSettings = {
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: ["#00ff00", "#0000ff", "#c0c0c0"],
      shapes: ["circle", "square"],
      scalar: 1.5,
    };

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        confetti(confettiSettings);
      }, i * 500);
    }
  }
}

export default SkillProgressBar;
