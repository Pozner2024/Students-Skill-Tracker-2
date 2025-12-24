// // Этот класс TestQuestion управляет процессом тестирования, включая загрузку теста, рендеринг вопросов,
// // управление ответами, оценку результатов и отображение прогресса.

import TestLoader from "./TestLoader";
import createAnswerManager from "./AnswerManager";
import questionRenderer from "./QuestionRenderer";
import QuestionNavigator from "./QuestionNavigator";
import ScoreCalculator from "./ScoreCalculator";
import SkillProgressBar from "../ui/SkillProgressBar";
import CloudImageLoader from "../ui/CloudImageLoader";

class TestQuestion {
  constructor(containerId) {
    this.containerId = containerId;
    this.testLoader = TestLoader.getInstance();
    this.testInstance = null;
    this.answerManager = createAnswerManager();
    this.navigator = null;
    this.scoreCalculator = null;
    this.imageLoader = null;
    this.topicName = null;
  }

  async initialize() {
    try {
      const params = this.testLoader.getParamsFromURL();
      
      // Загружаем данные теста и инициализируем загрузчик изображений параллельно
      const { testCode, variant } = params || {};

      let actualTopicId = null;
      if (testCode) {
        const match = testCode.match(/test(\d+)_/);
        if (match) {
          actualTopicId = parseInt(match[1], 10);
          console.log(
            `TestQuestion: Извлечен topicId ${actualTopicId} из testCode ${testCode}`
          );
        }
      }

      if (!actualTopicId) {
        console.warn(
          `TestQuestion: topicId не определен, используем значение по умолчанию 1`
        );
        actualTopicId = 1;
      }

      // Инициализируем загрузчик изображений (но не загружаем сразу)
      this.imageLoader = new CloudImageLoader(actualTopicId, variant);

      // Загружаем данные теста (блокирующая операция)
      const testResult = await this.testLoader.fetchTestData(params);

      if (!testResult || !Array.isArray(testResult.data.questions)) {
        return;
      }

      this.topicName = testResult.topicName;
      this.testInstance = testResult.data;

      // Начинаем загрузку изображений в фоне (не блокируем инициализацию)
      this.imageLoader.loadImages().catch((error) => {
        console.warn("TestQuestion: Ошибка при загрузке изображений:", error);
      });

      if (!this.testInstance || !Array.isArray(this.testInstance.questions)) {
        return;
      }

      this.scoreCalculator = new ScoreCalculator(this.testInstance);

      this.navigator = new QuestionNavigator(
        this.testInstance.questions.length,
        (index) => this.renderCurrentQuestion(index),
        () => this.submitAllAnswers()
      );

      if (!this.navigator) {
        return;
      }

      this.renderCurrentQuestion(this.navigator.currentQuestionIndex);
    } catch (error) {
      console.error("TestQuestion: Ошибка при инициализации:", error);
    }
  }

  getTotalQuestions() {
    return this.navigator ? this.navigator.getTotalQuestions() : 0;
  }

  async renderCurrentQuestion(index) {
    const container = document.getElementById(this.containerId);
    if (!container) {
      return;
    }

    if (!this.testInstance || !this.testInstance.questions) {
      return;
    }

    const questions = this.testInstance.questions;
    if (index < 0 || index >= questions.length) {
      return;
    }

    const question = questions[index];
    if (!question) {
      return;
    }

    let imagePath = null;
    if (this.imageLoader) {
      const questionNumber = index + 1;
      imagePath = await this.imageLoader.getImagePath(questionNumber);
      if (imagePath) {
        console.log(
          `TestQuestion: Найдено изображение для вопроса ${questionNumber}:`,
          imagePath
        );
      } else {
        console.log(
          `TestQuestion: Изображение для вопроса ${questionNumber} не найдено`
        );
      }
    } else {
      console.warn(
        `TestQuestion: imageLoader не инициализирован для вопроса ${index + 1}`
      );
    }

    container.innerHTML =
      `<h3>Вопрос ${index + 1} из ${questions.length}</h3>` +
      questionRenderer.renderQuestionHTML(
        questions[index],
        index,
        imagePath,
        this.answerManager
      );

    questionRenderer.addAnswerHandlers(container, index, this.answerManager);

    setTimeout(() => {
      const questionElement = container.querySelector(".question");
      if (questionElement) {
        questionElement.classList.remove("fade-in-up");
        void questionElement.offsetHeight;
        requestAnimationFrame(() => {
          questionElement.classList.add("fade-in-up");
        });
      }
    }, 50);

    this.navigator.updatePagination();
  }

  showNextQuestion() {
    if (this.navigator) {
      this.navigator.showNextQuestion();
    }
  }

  showPreviousQuestion() {
    if (this.navigator) {
      this.navigator.showPreviousQuestion();
    }
  }

  async submitAllAnswers() {
    let userAnswers = this.answerManager.getAllAnswers();
    if (typeof userAnswers === "object" && !Array.isArray(userAnswers)) {
      userAnswers = Object.values(userAnswers);
    }

    if (!Array.isArray(userAnswers)) {
      return;
    }

    const totalScore = this.scoreCalculator.calculateTotalScore(userAnswers);
    const answeredPercentage =
      this.scoreCalculator.getAnsweredPercentage(userAnswers);

    await this.saveTestResult(totalScore, answeredPercentage);

    const contentContainer = document.getElementById("content");
    if (!contentContainer) {
      return;
    }

    const skillProgressBar = new SkillProgressBar(
      answeredPercentage,
      totalScore,
      this.scoreCalculator.getGrade(
        totalScore,
        this.testInstance.questions.length
      ),
      this.topicName
    );
    skillProgressBar.render("content");
  }

  async saveTestResult(totalScore, answeredPercentage) {
    try {
      const testCode = this.testInstance.testCode || "unknown";
      const variant = this.testInstance.variant || 1;
      const totalQuestions = this.testInstance.questions.length;
      const maxPoints = this.scoreCalculator.getMaxScore();
      const percentage =
        maxPoints > 0 ? Math.round((totalScore / maxPoints) * 100) : 0;

      const grade = this.scoreCalculator.getGrade(totalScore, totalQuestions);

      const testResultData = {
        testCode: testCode,
        variant: variant,
        score: totalScore,
        totalQuestions: totalQuestions,
        maxPoints: maxPoints,
        percentage: percentage,
        grade: grade,
        answersDetails: this.scoreCalculator?.lastDetails || [],
      };

      const { default: authService } = await import(
        "../../services/authService.js"
      );

      await authService.saveTestResult(testResultData);
    } catch (error) {}
  }
}

export default TestQuestion;
