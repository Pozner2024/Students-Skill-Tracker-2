// // Этот класс TestQuestion управляет процессом тестирования, включая загрузку теста, рендеринг вопросов,
// // управление ответами, оценку результатов и отображение прогресса.

import TestLoader from "./TestLoader";
import AnswerManager from "./AnswerManager";
import QuestionRenderer from "./QuestionRenderer";
import QuestionNavigator from "./QuestionNavigator";
import ScoreCalculator from "./ScoreCalculator";
import ResultDisplay from "./ResultDisplay";
import SkillProgressBar from "../ui/SkillProgressBar";
import CloudImageLoader from "../ui/CloudImageLoader"; // Импортируем CloudImageLoader

class TestQuestion {
  constructor(containerId) {
    this.containerId = containerId;
    this.testLoader = TestLoader.getInstance(); // Используем Singleton паттерн
    this.testInstance = null;
    this.answerManager = new AnswerManager();
    this.questionRenderer = new QuestionRenderer(this.answerManager);
    this.navigator = null;
    this.scoreCalculator = null;
    this.resultDisplay = null;
    this.imageLoader = null; // Добавляем свойство для ImageLoader
    this.topicName = null; // Свойство для хранения названия темы
  }

  async initialize() {
    try {
      // Извлекаем параметры из URL
      const params = this.testLoader.getParamsFromURL();
      const testResult = await this.testLoader.fetchTestData(params);

      if (!testResult || !Array.isArray(testResult.data.questions)) {
        return;
      }

      this.topicName = testResult.topicName;
      this.testInstance = testResult.data;

      // Инициализируем ImageLoader после получения topicId и variant
      const { topicId, testCode, variant } = params;

      // Извлекаем topicId из testCode если он не определен напрямую
      let actualTopicId = topicId;
      if (!actualTopicId && testCode) {
        // testCode имеет формат "test1_1", извлекаем номер темы
        const match = testCode.match(/test(\d+)_/);
        if (match) {
          actualTopicId = parseInt(match[1], 10);
          console.log(
            `TestQuestion: Извлечен topicId ${actualTopicId} из testCode ${testCode}`
          );
        }
      }

      // Fallback: если topicId все еще не определен, используем значение по умолчанию
      if (!actualTopicId) {
        console.warn(
          `TestQuestion: topicId не определен, используем значение по умолчанию 1`
        );
        actualTopicId = 1;
      }

      console.log(
        `TestQuestion: Инициализация CloudImageLoader с topicId=${actualTopicId}, variant=${variant}`
      );
      this.imageLoader = new CloudImageLoader(actualTopicId, variant);

      // Предварительно загружаем все изображения для темы
      // Показываем индикатор загрузки
      const contentContainer = document.getElementById("content");
      if (contentContainer) {
        contentContainer.innerHTML =
          '<div class="loading-indicator">Загрузка изображений...</div>';
      }

      await this.imageLoader.loadImages();

      // Проверяем, сколько изображений загружено
      const imagesCount = this.imageLoader.getLoadedImagesCount();
      console.log(
        `TestQuestion: Загружено ${imagesCount} изображений для темы ${actualTopicId}, вариант ${variant}`
      );

      // Проверка на корректную загрузку testInstance и questions
      if (!this.testInstance || !Array.isArray(this.testInstance.questions)) {
        return;
      }

      // Инициализируем ScoreCalculator и ResultDisplay
      this.scoreCalculator = new ScoreCalculator(this.testInstance);
      this.resultDisplay = new ResultDisplay(this.testInstance);

      // Инициализируем QuestionNavigator с проверками
      this.navigator = new QuestionNavigator(
        this.testInstance.questions.length,
        (index) => this.renderCurrentQuestion(index),
        () => this.submitAllAnswers()
      );

      // Проверяем, что navigator инициализирован
      if (!this.navigator) {
        return;
      }

      // Рендерим первый вопрос
      this.renderCurrentQuestion(this.navigator.currentQuestionIndex);
    } catch (error) {
      // Ошибка при инициализации TestQuestion
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

    // Проверяем, что testInstance и questions существуют
    if (!this.testInstance || !this.testInstance.questions) {
      return;
    }

    const questions = this.testInstance.questions;
    if (index < 0 || index >= questions.length) {
      return;
    }

    // Проверяем, что вопрос существует
    const question = questions[index];
    if (!question) {
      return;
    }

    // Получаем изображение для текущего вопроса по его номеру
    let imagePath = null;
    if (this.imageLoader) {
      const questionNumber = index + 1; // Номер вопроса соответствует индексу + 1
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

    // Рендерим HTML для текущего вопроса, включая изображение (если оно есть)
    container.innerHTML =
      `<h3>Вопрос ${index + 1} из ${questions.length}</h3>` +
      this.questionRenderer.renderQuestionHTML(
        questions[index],
        index,
        imagePath
      ); // Передаем imagePath в renderQuestionHTML

    // Добавляем обработчики для ответов
    this.questionRenderer.addAnswerHandlers(container, index);

    // Добавляем CSS анимацию появления вопроса
    // Используем небольшую задержку для плавности
    setTimeout(() => {
      const questionElement = container.querySelector(".question");
      if (questionElement) {
        // Удаляем класс, если он был (для повторной анимации)
        questionElement.classList.remove("fade-in-up");
        // Принудительно перерисовываем для сброса анимации
        void questionElement.offsetHeight; // trigger reflow
        // Добавляем класс для CSS анимации
        requestAnimationFrame(() => {
          questionElement.classList.add("fade-in-up");
        });
      }
    }, 50);

    // Обновляем навигацию
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

    // Рассчитываем общий балл и процент завершенных ответов
    const totalScore = this.scoreCalculator.calculateTotalScore(userAnswers);
    const answeredPercentage =
      this.scoreCalculator.getAnsweredPercentage(userAnswers);

    // Сохраняем результат теста в базу данных
    await this.saveTestResult(totalScore, answeredPercentage);

    // Находим контейнер для отображения результата
    const contentContainer = document.getElementById("content");
    if (!contentContainer) {
      return;
    }

    // Отображаем страницу с результатами
    this.resultDisplay.displayResultsPage(totalScore);

    // Создаем и отображаем шкалу прогресса навыка
    const skillProgressBar = new SkillProgressBar(
      answeredPercentage,
      totalScore,
      this.resultDisplay.getGrade(
        totalScore,
        this.testInstance.questions.length
      ),
      this.topicName
    );
    skillProgressBar.render("content");
  }

  async saveTestResult(totalScore, answeredPercentage) {
    try {
      // Получаем информацию о тесте
      const testCode = this.testInstance.testCode || "unknown";
      const variant = this.testInstance.variant || 1;
      const totalQuestions = this.testInstance.questions.length;
      const maxPoints = this.scoreCalculator.getMaxScore();
      const percentage =
        maxPoints > 0 ? Math.round((totalScore / maxPoints) * 100) : 0;

      // Рассчитываем итоговую оценку (grade)
      const grade = this.resultDisplay.getGrade(totalScore, totalQuestions);

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

      // Импортируем authService динамически, чтобы избежать циклических зависимостей
      const { default: authService } = await import("../../services/authService.js");

      await authService.saveTestResult(testResultData);
    } catch (error) {
      // Ошибка при сохранении результата теста
    }
  }
}

export default TestQuestion;

