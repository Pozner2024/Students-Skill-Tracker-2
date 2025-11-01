// Этот класс QuestionRenderer предназначен для рендеринга различных типов вопросов
// (например, выбор из нескольких вариантов, заполнение пропусков, сортировка
// и сопоставление) и для привязки обработчиков ответов. Он управляет отображением
// вопросов и обработкой взаимодействия пользователя с ними.

class QuestionRenderer {
  constructor(answerManager) {
    this.answerManager = answerManager;
  }

  renderQuestionHTML(question, index, imagePath) {
    // Проверяем, что question существует
    if (!question) {
      return "<p>Ошибка: вопрос не найден</p>";
    }

    let questionHTML = "";

    // Добавляем описание вопроса, если оно существует
    if (question.questionDescription) {
      questionHTML += `<p>${question.questionDescription}</p>`;
    }

    // Добавляем основной текст вопроса (для типов, кроме "fill in the blank")
    if (question.type !== "fill_in_the_blank") {
      questionHTML += `<p>${question.question}</p>`;
    }

    // Добавляем изображение, если путь существует
    let imageHTML = "";
    if (imagePath) {
      imageHTML = `
        <div class="question-image">
          <img src="${imagePath}" alt="Изображение для вопроса ${index + 1}" />
        </div>
      `;
    }

    // Рендеринг в зависимости от типа вопроса
    switch (question.type) {
      case "multiple_choice":
        questionHTML += this.renderMultipleChoice(question, index);
        break;
      case "fill_in_the_blank":
        questionHTML += this.renderFillInTheBlank(question, index);
        break;
      case "ordering":
        questionHTML += this.renderOrdering(question, index);
        break;
      case "matching":
        questionHTML += this.renderMatching(question, index);
        break;
      default:
        questionHTML += "<p>Неизвестный тип вопроса</p>";
    }

    // Определяем классы для контейнера вопроса
    let additionalClass = "";
    if (question.type === "matching") {
      additionalClass = "matching-only";
    } else if (question.type === "ordering") {
      additionalClass = "ordering-only";
    } else {
      additionalClass = "general-question";
    }

    return `
      <div class="question ${additionalClass}">
        ${imageHTML}  <!-- Вставляем изображение справа от вопроса -->
        <div class="question-text">
          ${questionHTML}
        </div>
      </div>
    `;
  }

  renderMultipleChoice(question, index) {
    const savedAnswer = this.answerManager.getAnswer(index);

    // Проверяем, что question.options существует и является массивом
    if (!question.options || !Array.isArray(question.options)) {
      return "<p>Ошибка: варианты ответов не найдены</p>";
    }

    return question.options
      .map(
        (option) => `
          <label>
            <input type="radio" name="answer_${index}" value="${option}" ${
          savedAnswer === option ? "checked" : ""
        } />
            ${option}
          </label><br/>
        `
      )
      .join("");
  }

  renderFillInTheBlank(question, index) {
    const savedAnswers = this.answerManager.getAnswer(index) || [];
    let answerIndex = 0;

    // Проверяем, что question.question существует
    if (!question.question) {
      return "<p>Ошибка: текст вопроса не найден</p>";
    }

    let questionHTML = question.question.replace(
      /(\d+\)\s*)?___/g,
      (match, p1) => {
        const savedText = savedAnswers[answerIndex] || "";
        answerIndex++;

        return `
        <span class="question-part">
          ${p1 ? p1 : ""} <!-- Добавляем цифру только если она есть -->
          <input type="text" name="answer_${index}_${
          answerIndex - 1
        }" value="${savedText}" placeholder="Введите ваш ответ" />
        </span>
      `;
      }
    );

    this.answerManager.saveAnswer(
      index,
      savedAnswers.length > 0 ? savedAnswers : null
    );

    return `<p>${questionHTML}</p>`;
  }

  renderOrdering(question, index) {
    // Проверяем, что question.sequence существует
    if (!question.sequence || !Array.isArray(question.sequence)) {
      return "<p>Ошибка: последовательность для сортировки не найдена</p>";
    }

    const savedOrder = this.answerManager.getAnswer(index) || question.sequence;
    const listItems = savedOrder
      .map(
        (item, i) => `
          <li class="draggable-item" draggable="true" data-index="${i}">
            ${item}
          </li>
        `
      )
      .join("");

    return `
      <ul class="ordering-list" id="ordering_${index}">
        ${listItems}
      </ul>
    `;
  }

  renderMatching(question, index) {
    const savedAnswer = this.answerManager.getAnswer(index) || {};

    // Проверяем, что question.right_column и question.left_column существуют
    if (!question.right_column || !Array.isArray(question.right_column)) {
      return "<p>Ошибка: правая колонка для сопоставления не найдена</p>";
    }

    if (!question.left_column || !Array.isArray(question.left_column)) {
      return "<p>Ошибка: левая колонка для сопоставления не найдена</p>";
    }

    const rightColumnOptions = question.right_column
      .map((item) => `<option value="${item}">${item}</option>`)
      .join("");

    const matchingItems = question.left_column
      .map((item, i) => {
        const selectedMatch = savedAnswer[item] || "";
        return `
                <li>
                    <label>${item}</label>
                    <select name="answer_${index}_${i}">
                        ${
                          selectedMatch
                            ? ""
                            : '<option value="">Выберите соответствие</option>'
                        }
                        ${rightColumnOptions.replace(
                          `value="${selectedMatch}"`,
                          `value="${selectedMatch}" selected`
                        )}
                    </select>
                </li>
            `;
      })
      .join("");

    return `
        <div class="matching-question">
            <ul class="matching-items">${matchingItems}</ul>
        </div>
    `;
  }

  addAnswerHandlers(container, questionIndex) {
    // Обработчики для multiple_choice вопросов
    container
      .querySelectorAll(`input[name="answer_${questionIndex}"]`)
      .forEach((input) => {
        input.addEventListener("change", (event) => {
          this.answerManager.saveAnswer(
            questionIndex,
            event.target.value || null
          );
        });
      });

    // Обработчики для fill_in_the_blank вопросов
    container
      .querySelectorAll(`input[type="text"][name^="answer_${questionIndex}"]`)
      .forEach((input, blankIndex) => {
        input.addEventListener("input", (event) => {
          let savedAnswers = this.answerManager.getAnswer(questionIndex) || [];
          savedAnswers[blankIndex] = event.target.value || null;
          this.answerManager.saveAnswer(
            questionIndex,
            savedAnswers.some((answer) => answer) ? savedAnswers : null
          );
        });
      });

    // Обработчики для matching вопросов
    container
      .querySelectorAll(`select[name^="answer_${questionIndex}_"]`)
      .forEach((select, matchIndex) => {
        select.addEventListener("change", (event) => {
          let savedMatches = this.answerManager.getAnswer(questionIndex) || {};
          const selectedValue = event.target.value || null;
          const leftColumnText =
            event.target.parentElement.querySelector("label").textContent;
          savedMatches[leftColumnText] = selectedValue;
          const hasMatches = Object.values(savedMatches).some((value) => value);
          this.answerManager.saveAnswer(
            questionIndex,
            hasMatches ? savedMatches : null
          );
        });
      });

    // Обработчики для ordering вопросов с делегированием
    const orderingList = container.querySelector(`#ordering_${questionIndex}`);

    if (orderingList) {
      let draggedItem = null;

      // Обработчик для dragstart
      orderingList.addEventListener("dragstart", (event) => {
        if (event.target.classList.contains("draggable-item")) {
          draggedItem = event.target;
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", event.target.dataset.index);
          draggedItem.classList.add("dragging");
        }
      });

      // Обработчик для dragover
      orderingList.addEventListener("dragover", (event) => {
        event.preventDefault();
        const afterElement = this.getDragAfterElement(
          orderingList,
          event.clientY
        );
        if (afterElement == null) {
          orderingList.appendChild(draggedItem);
        } else {
          orderingList.insertBefore(draggedItem, afterElement);
        }
      });

      // Обработчик для drop
      orderingList.addEventListener("drop", (event) => {
        event.preventDefault();
        if (draggedItem) {
          draggedItem.classList.remove("dragging");
          draggedItem = null;

          // Обновление порядка и сохранение результата
          const newOrder = Array.from(orderingList.children).map((item) =>
            item.textContent.trim()
          );
          const hasOrder = newOrder.length > 0 && newOrder.some((item) => item);
          this.answerManager.saveAnswer(
            questionIndex,
            hasOrder ? newOrder : null
          );
        }
      });
    }
  }

  // Вспомогательная функция для нахождения элемента, перед которым будет вставлен перемещаемый элемент
  getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll(".draggable-item:not(.dragging)"),
    ];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }
}

export default QuestionRenderer;
