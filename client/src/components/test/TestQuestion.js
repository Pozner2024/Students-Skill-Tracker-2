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
    this.onPaginationUpdate = null;
    this.currentQuestionElement = null;
    this.previousQuestionIndex = null;
    this.isTransitioning = false;
    this.errorHandlerAttached = false;
    
    // Устанавливаем глобальный обработчик ошибок для подавления ошибок загрузки изображений
    this.setupErrorHandler();
  }

  setupErrorHandler() {
    if (this.errorHandlerAttached) return;
    
    // Подавляем ошибки загрузки изображений, связанные с OpaqueResponseBlocking
    const originalError = window.console.error;
    const originalWarn = window.console.warn;
    
    window.console.error = function(...args) {
      const message = String(args.join(' ')).toLowerCase();
      // Пропускаем ошибки, связанные с блокировкой изображений
      if (message.includes('opaqueresponseblocking') || 
          message.includes('ns binding aborted') ||
          message.includes('failed to fetch') ||
          (message.includes('storage.yandexcloud.net') && (message.includes('img') || message.includes('.jpg')))) {
        return; // Не логируем эти ошибки
      }
      originalError.apply(console, args);
    };
    
    window.console.warn = function(...args) {
      const message = String(args.join(' ')).toLowerCase();
      // Пропускаем предупреждения, связанные с блокировкой изображений
      if (message.includes('opaqueresponseblocking') || 
          message.includes('resource is blocked') ||
          (message.includes('storage.yandexcloud.net') && (message.includes('img') || message.includes('.jpg')))) {
        return; // Не логируем эти предупреждения
      }
      originalWarn.apply(console, args);
    };
    
    // Также перехватываем глобальные ошибки
    const errorListener = (event) => {
      const message = String(event.message || event.error?.message || '').toLowerCase();
      const source = String(event.filename || event.source || '').toLowerCase();
      const target = String(event.target?.src || event.target?.href || '').toLowerCase();
      
      if (message.includes('opaqueresponseblocking') || 
          message.includes('ns binding aborted') ||
          message.includes('failed to fetch') ||
          message.includes('networkerror') ||
          (source.includes('storage.yandexcloud.net') && (source.includes('img') || source.includes('.jpg'))) ||
          (target.includes('storage.yandexcloud.net') && (target.includes('img') || target.includes('.jpg')))) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    };
    
    window.addEventListener('error', errorListener, true);
    window.addEventListener('unhandledrejection', (event) => {
      const reason = String(event.reason || '').toLowerCase();
      if (reason.includes('opaqueresponseblocking') || 
          reason.includes('ns binding aborted') ||
          reason.includes('storage.yandexcloud.net')) {
        event.preventDefault();
        return false;
      }
    }, true);
    
    this.errorHandlerAttached = true;
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
        (index, previousIndex) => {
          // Этот callback вызывается при навигации через пагинацию
          // Определяем направление на основе предыдущего индекса
          let direction = null;
          if (previousIndex !== null && previousIndex !== undefined) {
            if (index > previousIndex) {
              direction = "next";
            } else if (index < previousIndex) {
              direction = "prev";
            }
          }
          this.previousQuestionIndex = index;
          this.renderCurrentQuestion(index, direction);
        },
        () => this.submitAllAnswers()
      );

      if (!this.navigator) {
        return;
      }

      this.previousQuestionIndex = this.navigator.currentQuestionIndex;
      this.renderCurrentQuestion(this.navigator.currentQuestionIndex);
    } catch (error) {
      console.error("TestQuestion: Ошибка при инициализации:", error);
    }
  }

  getTotalQuestions() {
    return this.navigator ? this.navigator.getTotalQuestions() : 0;
  }

  // Загружает изображения для элемента (перемещает data-src в src)
  loadImagesForElement(element) {
    if (!element) return;
    
    const images = element.querySelectorAll("img[data-src]");
    images.forEach(img => {
      const dataSrc = img.getAttribute("data-src");
      if (dataSrc && !img.src) {
        // Проверяем, что элемент все еще в DOM и активен
        if (!element.parentNode || !element.classList.contains("center")) {
          // Элемент удален или не активен - не загружаем изображение
          img.removeAttribute("data-src");
          return;
        }
        
        // Устанавливаем обработчик ошибок перед загрузкой
        const errorHandler = function() {
          try {
            this.style.display = "none";
          } catch (e) {}
          this.onerror = function() {
            try {
              this.style.display = "none";
            } catch (e) {}
            return false;
          };
          this.onload = null;
          return false;
        };
        img.onerror = errorHandler;
        
        // Загружаем изображение только если элемент все еще активен
        requestAnimationFrame(() => {
          if (element.parentNode && element.classList.contains("center") && img.hasAttribute("data-src")) {
            img.src = dataSrc;
            img.removeAttribute("data-src");
          } else {
            // Элемент был удален или деактивирован - не загружаем
            img.removeAttribute("data-src");
            img.style.display = "none";
          }
        });
      }
    });
  }

  // Вспомогательная функция для остановки загрузки всех изображений в контейнере
  stopAllImageLoading(container, excludeElement = null) {
    if (!container) return;
    
    const allQuestions = container.querySelectorAll(".question");
    allQuestions.forEach(q => {
      if (q !== excludeElement) {
        const images = q.querySelectorAll("img");
        images.forEach(img => {
          // Устанавливаем обработчик ошибок, который ничего не делает
          // Это предотвращает логирование ошибок в консоль
          img.onerror = function() {
            try {
              this.style.display = "none";
            } catch (e) {}
            this.onerror = function() {
              try {
                this.style.display = "none";
              } catch (e) {}
              return false;
            };
            this.onload = null;
            return false; // Предотвращаем всплытие ошибки
          };
          
          // Если изображение еще не загружено (имеет data-src), просто удаляем атрибут
          if (img.hasAttribute("data-src")) {
            img.removeAttribute("data-src");
            img.style.display = "none";
          }
          // Останавливаем загрузку только если это не data URI
          else if (img.src && !img.src.startsWith("data:")) {
            // Сначала устанавливаем обработчик, потом меняем src
            img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
            img.srcset = "";
            img.style.display = "none";
          }
          img.onload = null;
          
          // Пытаемся отменить загрузку через removeAttribute
          try {
            if (img.hasAttribute("src") && !img.src.startsWith("data:")) {
              img.removeAttribute("src");
            }
            if (img.hasAttribute("srcset")) {
              img.removeAttribute("srcset");
            }
          } catch (e) {
            // Игнорируем ошибки
          }
        });
      }
    });
  }

  transition(oldCard, newCard, direction) {
    // direction = "next" | "prev"
    if (!oldCard || !newCard) {
      console.warn("TestQuestion.transition: oldCard or newCard is missing", { oldCard, newCard });
      this.isTransitioning = false;
      return;
    }

    // Проверяем, что oldCard все еще в DOM
    if (!oldCard.parentNode) {
      console.warn("TestQuestion.transition: oldCard is not in DOM");
      this.isTransitioning = false;
      return;
    }

    const container = document.getElementById(this.containerId);
    if (!container) {
      this.isTransitioning = false;
      return;
    }
    
    // Останавливаем загрузку всех изображений во ВСЕХ старых элементах в контейнере
    // Это важно, так как могут быть элементы, которые еще не удалены
    this.stopAllImageLoading(container, newCard);
    
    // Дополнительно: останавливаем загрузку изображений в старом элементе ДО начала анимации
    const oldImages = oldCard.querySelectorAll("img");
    oldImages.forEach(img => {
      // Удаляем data-src если есть
      if (img.hasAttribute("data-src")) {
        img.removeAttribute("data-src");
      }
      // Останавливаем загрузку
      if (img.src && !img.src.startsWith("data:")) {
        img.onerror = function() { return false; };
        img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        img.srcset = "";
        img.style.display = "none";
      }
    });

    // Убеждаемся, что старый вопрос в центре и очищаем все классы анимации
    oldCard.classList.remove("from-bottom", "from-top", "to-top", "to-bottom");
    oldCard.classList.add("center");

    if (direction === "next") {
      newCard.classList.add("from-bottom");
    } else {
      newCard.classList.add("from-top");
    }
    
    container.appendChild(newCard);

    // зафиксировать стартовые позиции
    newCard.getBoundingClientRect();

    // Анимируем уход старого вопроса
    if (direction === "next") {
      oldCard.classList.remove("center");
      oldCard.classList.add("to-top");
    } else {
      oldCard.classList.remove("center");
      oldCard.classList.add("to-bottom");
    }

    // Анимируем появление нового вопроса
    requestAnimationFrame(() => {
      newCard.classList.remove("from-bottom", "from-top");
      newCard.classList.add("center");
      
      // Загружаем изображения только когда элемент становится активным
      this.loadImagesForElement(newCard);
    });

    // Обновляем currentQuestionElement сразу, чтобы следующий переход работал правильно
    this.currentQuestionElement = newCard;

    // Отслеживаем завершение анимации обоих элементов
    let oldCardRemoved = false;
    let newCardArrived = false;
    
    const checkTransitionComplete = () => {
      if (oldCardRemoved && newCardArrived) {
        this.isTransitioning = false;
      }
    };

    oldCard.addEventListener("transitionend", (e) => {
      // Обрабатываем только завершение анимации transform для старой карточки
      // Это гарантирует, что элемент удалится только после полного завершения движения
      if (e.propertyName === "transform" && !oldCardRemoved) {
        oldCardRemoved = true;
        // Останавливаем загрузку всех изображений в старом элементе перед удалением
        if (oldCard.parentNode) {
          const images = oldCard.querySelectorAll("img");
          images.forEach(img => {
            // Удаляем data-src если есть
            if (img.hasAttribute("data-src")) {
              img.removeAttribute("data-src");
            }
            // Отменяем загрузку изображения, используя data URI
            if (img.src && !img.src.startsWith("data:")) {
              // Устанавливаем обработчик ошибок перед изменением
              img.onerror = function() { return false; };
              img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
            }
            img.srcset = "";
            img.onerror = function() { return false; };
            img.onload = null;
            img.style.display = "none";
            // Удаляем атрибуты
            try {
              img.removeAttribute("src");
              img.removeAttribute("srcset");
            } catch (e) {}
          });
          // Удаляем элемент только после завершения анимации transform
          oldCard.remove();
        }
        checkTransitionComplete();
      }
    }, { once: true });

    newCard.addEventListener("transitionend", (e) => {
      // Обрабатываем только завершение анимации transform для новой карточки
      // Это гарантирует, что мы учитываем полное завершение движения
      if (e.propertyName === "transform" && !newCardArrived) {
        newCardArrived = true;
        checkTransitionComplete();
      }
    }, { once: true });

    // Fallback: снимаем блокировку через максимальное время анимации (1.2 секунды для анимации вверх)
    setTimeout(() => {
      if (this.isTransitioning) {
        this.isTransitioning = false;
      }
      // Удаляем обработчики событий, если они еще не сработали
      if (oldCard.parentNode && !oldCardRemoved) {
        oldCard.remove();
      }
    }, 1200);
  }

  async renderCurrentQuestion(index, direction = null) {
    const container = document.getElementById(this.containerId);
    if (!container) {
      return;
    }

    // Сразу останавливаем загрузку всех изображений в старых элементах
    // Это предотвращает ошибки при переходе на вопросы без картинок
    // Делаем это синхронно, до любых асинхронных операций
    this.stopAllImageLoading(container);
    
    // Дополнительно: обрабатываем все изображения в контейнере, включая те, что могут быть вне .question
    const allImages = container.querySelectorAll("img");
    allImages.forEach(img => {
      // Если изображение еще загружается и не является data URI, останавливаем его
      if (img.src && !img.src.startsWith("data:")) {
        // Устанавливаем обработчик ошибок ДО изменения src, чтобы перехватить любые ошибки
        const suppressError = function() {
          this.style.display = "none";
          return false; // Подавляем ошибку
        };
        img.onerror = suppressError;
        img.onload = null;
        
        // Меняем src на data URI
        img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        img.srcset = "";
        img.style.display = "none";
        
        // Удаляем атрибуты, чтобы полностью остановить загрузку
        try {
          img.removeAttribute("src");
          img.removeAttribute("srcset");
          // Восстанавливаем data URI после удаления
          img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        } catch (e) {
          // Игнорируем ошибки
        }
      }
    });

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

    const questionHTML = questionRenderer.renderQuestionHTML(
      questions[index],
      index,
      imagePath,
      this.answerManager
    );

    // Сохраняем h3 элемент, если он существует
    let h3Element = container.querySelector("h3");
    if (!h3Element) {
      h3Element = document.createElement("h3");
      container.appendChild(h3Element);
    }
    h3Element.textContent = `Вопрос ${index + 1} из ${questions.length}`;

    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = questionHTML;
    const newCard = tempContainer.firstElementChild;

    // Получаем текущий элемент вопроса из DOM
    // Используем currentQuestionElement если он валиден, иначе ищем в DOM
    let oldCard = this.currentQuestionElement;
    
    // Проверяем, что oldCard все еще в DOM и является валидным элементом
    if (oldCard && (!oldCard.parentNode || !container.contains(oldCard))) {
      oldCard = null;
      this.currentQuestionElement = null;
    }
    
    // Если oldCard не найден, ищем в DOM
    // Важно: находим все элементы .question и берем тот, который еще не удаляется
    if (!oldCard) {
      const allQuestions = container.querySelectorAll(".question");
      // Берем элемент, который еще в DOM, не имеет классов анимации удаления,
      // и имеет класс center (активный) или не имеет классов анимации вообще
      for (let i = allQuestions.length - 1; i >= 0; i--) {
        const q = allQuestions[i];
        if (q.parentNode && 
            !q.classList.contains("to-top") && 
            !q.classList.contains("to-bottom") &&
            (q.classList.contains("center") || 
             (!q.classList.contains("from-bottom") && !q.classList.contains("from-top")))) {
          oldCard = q;
          break;
        }
      }
    }
    
    // Дополнительная проверка: если oldCard найден, но он в процессе удаления, игнорируем его
    if (oldCard && (oldCard.classList.contains("to-top") || oldCard.classList.contains("to-bottom"))) {
      oldCard = null;
    }
    
    // Если это первый рендер или нет направления, просто показываем вопрос
    if (!oldCard || !direction) {
      // Останавливаем загрузку всех изображений перед удалением старых элементов
      this.stopAllImageLoading(container, newCard);
      
      // Удаляем все старые вопросы из DOM
      const allOldQuestions = container.querySelectorAll(".question");
      allOldQuestions.forEach(q => q.remove());
      
      container.appendChild(newCard);
      // Для первого рендера добавляем анимацию появления снизу
      if (!oldCard) {
        newCard.classList.add("from-bottom");
        // Зафиксировать стартовую позицию
        newCard.getBoundingClientRect();
        // Анимируем появление
        requestAnimationFrame(() => {
          newCard.classList.remove("from-bottom");
          newCard.classList.add("center");
          // Загружаем изображения только когда элемент становится активным
          this.loadImagesForElement(newCard);
        });
      } else {
        newCard.classList.add("center");
        // Загружаем изображения сразу, так как элемент уже активен
        this.loadImagesForElement(newCard);
      }
      this.currentQuestionElement = newCard;
      this.isTransitioning = false;
    } else {
      // Используем анимацию перехода
      this.isTransitioning = true;
      this.transition(oldCard, newCard, direction);
    }

    questionRenderer.addAnswerHandlers(container, index, this.answerManager);

    this.navigator.updatePagination();
    this.attachNavigationHandlers();
  }

  setPaginationUpdateCallback(callback) {
    this.onPaginationUpdate = callback;
  }

  attachNavigationHandlers() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      return;
    }
    
    // Используем currentQuestionElement или ищем последний добавленный вопрос
    const questionElement = this.currentQuestionElement || container.querySelector(".question");
    if (!questionElement) {
      return;
    }

    const prevButton = questionElement.querySelector("#prevButton");
    const nextButton = questionElement.querySelector("#nextButton");

    if (prevButton) {
      prevButton.onclick = () => {
        this.showPreviousQuestion();
        if (this.onPaginationUpdate && typeof this.onPaginationUpdate === "function") {
          this.onPaginationUpdate(this.navigator.currentQuestionIndex);
        }
      };
    }

    if (nextButton) {
      nextButton.onclick = () => {
        this.showNextQuestion();
        if (this.onPaginationUpdate && typeof this.onPaginationUpdate === "function") {
          this.onPaginationUpdate(this.navigator.currentQuestionIndex);
        }
      };
    }
  }

  showNextQuestion() {
    if (this.isTransitioning) return; // Предотвращаем множественные клики
    if (this.navigator && this.navigator.currentQuestionIndex < this.navigator.totalQuestions - 1) {
      const oldIndex = this.navigator.currentQuestionIndex;
      this.navigator.showNextQuestion();
      // renderCurrentQuestion будет вызван через callback из navigator
    }
  }

  showPreviousQuestion() {
    if (this.isTransitioning) return; // Предотвращаем множественные клики
    if (this.navigator && this.navigator.currentQuestionIndex > 0) {
      const oldIndex = this.navigator.currentQuestionIndex;
      this.navigator.showPreviousQuestion();
      // renderCurrentQuestion будет вызван через callback из navigator
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
        answeredPercentage,
        this.testInstance.questions.length
      ),
      this.topicName
    );
    skillProgressBar.render("content");
  }

  async saveTestResult(totalScore, answeredPercentage) {
    try {
      const testCode = this.testInstance.testCode || "unknown";
      const variant = Number(this.testInstance.variant) || 1;
      const totalQuestions = this.testInstance.questions.length;
      const maxPoints = this.scoreCalculator.getMaxScore();
      const percentage =
        maxPoints > 0 ? Math.round((totalScore / maxPoints) * 100) : 0;

      const grade = this.scoreCalculator.getGrade(percentage, totalQuestions);

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
