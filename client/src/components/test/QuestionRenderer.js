// Модуль для рендеринга различных типов вопросов
// (например, выбор из нескольких вариантов, заполнение пропусков, сортировка
// и сопоставление) и для привязки обработчиков ответов.

// Форматирует единицы измерения, не давая им отрываться от числа
function formatUnits(text) {
  if (!text) return text;
  return text.replace(/(\d)\s*(%|°\s*[CС]|см\b)/gi, (match, digit, unit) => {
    if (unit === "%") return `${digit}&nbsp;%`;
    if (unit.includes("°")) {
      const symbol = /[Сс]/.test(unit) ? "°С" : "°C";
      return `${digit}&nbsp;${symbol}`;
    }
    if (unit.includes("см")) return `${digit}&nbsp;см`;
    return match;
  });
}

// Рендерит вопрос с множественным выбором
function renderMultipleChoice(question, index, answerManager) {
  const savedAnswer = answerManager.getAnswer(index);

  // Проверяем, что question.options существует и является массивом
  if (!question.options || !Array.isArray(question.options)) {
    return "<p>Ошибка: варианты ответов не найдены</p>";
  }

  return question.options
    .map((optionRaw) => {
      const option = formatUnits(optionRaw);
      return `
        <label>
          <input type="radio" name="answer_${index}" value="${option}" ${
        savedAnswer === option ? "checked" : ""
      } />
          ${option}
        </label><br/>
      `;
    })
    .join("");
}

// Рендерит вопрос с заполнением пропусков
function renderFillInTheBlank(question, index, answerManager) {
  const savedAnswers = answerManager.getAnswer(index) || [];
  let answerIndex = 0;

  // Проверяем, что question.question существует
  if (!question.question) {
    return "<p>Ошибка: текст вопроса не найден</p>";
  }

  // Заменяем все "___" (с optional номером "1) ", "2) " и т.д.,
  // а также со знаками препинания и единицами измерения после)
  // так, чтобы номер, поле ввода и запятая/двоеточие/единица измерения
  // всегда держались вместе и не переносились
  const formattedQuestion = formatUnits(question.question);
  let questionHTML = formattedQuestion.replace(
    /(\d+\)\s*)?___\s*([,;:.]|%|°\s*[CС]|см\b)?/g,
    (match, p1, p2) => {
      const savedText = savedAnswers[answerIndex] || "";
      answerIndex++;

      const prefix = p1 ? p1.trim() : "";
      const punctuation = p2 || "";

      return `
      <span class="question-part">
        ${
          prefix ? `${prefix} ` : ""
        } <!-- Добавляем цифру только если она есть -->
        <input
          type="text"
          name="answer_${index}_${answerIndex - 1}"
          value="${savedText}"
          placeholder="Введите ваш ответ"
        />
        ${punctuation}
      </span>
    `;
    }
  );

  answerManager.saveAnswer(
    index,
    savedAnswers.length > 0 ? savedAnswers : null
  );

  return `<p>${questionHTML}</p>`;
}

// Рендерит вопрос с сортировкой
function renderOrdering(question, index, answerManager) {
  // Проверяем, что question.sequence существует
  if (!question.sequence || !Array.isArray(question.sequence)) {
    return "<p>Ошибка: последовательность для сортировки не найдена</p>";
  }

  const savedOrder = answerManager.getAnswer(index) || question.sequence;
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

// Рендерит вопрос с сопоставлением
function renderMatching(question, index, answerManager) {
  const savedAnswer = answerManager.getAnswer(index) || {};

  // Проверяем, что question.right_column и question.left_column существуют
  if (
    !question.right_column ||
    !Array.isArray(question.right_column) ||
    !question.left_column ||
    !Array.isArray(question.left_column)
  ) {
    return "<p>Ошибка: колонки для сопоставления не найдены</p>";
  }

  const rightColumnOptions = question.right_column
    .map((item) => `<option value="${item}" title="${item}">${item}</option>`)
    .join("");

  const matchingItems = question.left_column
    .map((item, i) => {
      const selectedMatch = savedAnswer[item] || "";
      let optionsHTML = selectedMatch
        ? rightColumnOptions.replace(
            `value="${selectedMatch}"`,
            `value="${selectedMatch}" selected`
          )
        : '<option value="">Выберите соответствие</option>' +
          rightColumnOptions;
      return `
              <li>
                  <label>${item}</label>
                  <select name="answer_${index}_${i}">
                      ${optionsHTML}
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

// Рендерит HTML для вопроса
function renderQuestionHTML(question, index, imagePath, answerManager) {
  // Проверяем, что question существует
  if (!question) {
    return "<p>Ошибка: вопрос не найден</p>";
  }

  let questionHTML = "";

  // Добавляем описание вопроса, если оно существует
  if (question.questionDescription) {
    const formattedDescription = formatUnits(question.questionDescription);
    questionHTML += `<p>${formattedDescription}</p>`;
  }

  // Добавляем основной текст вопроса (для типов, кроме "fill in the blank")
  if (question.type !== "fill_in_the_blank") {
    const formattedQuestion = formatUnits(question.question);
    questionHTML += `<p>${formattedQuestion}</p>`;
  }

  // Добавляем изображение, если путь существует
  let imageHTML = "";
  if (imagePath && imagePath.trim() !== "") {
    imageHTML = `
      <div class="question-image">
        <img src="${imagePath}" alt="Изображение для вопроса ${index + 1}" 
             onerror="this.style.display='none';" />
      </div>
    `;
  }

  // Рендеринг в зависимости от типа вопроса
  switch (question.type) {
    case "multiple_choice":
      questionHTML += renderMultipleChoice(question, index, answerManager);
      break;
    case "fill_in_the_blank":
      questionHTML += renderFillInTheBlank(question, index, answerManager);
      break;
    case "ordering":
      questionHTML += renderOrdering(question, index, answerManager);
      break;
    case "matching":
      questionHTML += renderMatching(question, index, answerManager);
      break;
    default:
      questionHTML += "<p>Неизвестный тип вопроса</p>";
  }

  // Определяем классы для контейнера вопроса
  const additionalClass =
    question.type === "matching"
      ? "matching-only"
      : question.type === "ordering"
      ? "ordering-only"
      : "general-question";

  return `
    <div class="question ${additionalClass}">
      ${imageHTML}  <!-- Вставляем изображение справа от вопроса -->
      <div class="question-text">
        ${questionHTML}
      </div>
    </div>
  `;
}

// Вспомогательная функция для нахождения элемента, перед которым будет вставлен перемещаемый элемент
function getDragAfterElement(container, y) {
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

// Добавляет обработчики событий для ответов
function addAnswerHandlers(container, questionIndex, answerManager) {
  // Обработчики для multiple_choice вопросов
  container
    .querySelectorAll(`input[name="answer_${questionIndex}"]`)
    .forEach((input) => {
      input.addEventListener("change", (event) => {
        answerManager.saveAnswer(questionIndex, event.target.value || null);
      });
    });

  // Обработчики для fill_in_the_blank вопросов
  container
    .querySelectorAll(`input[type="text"][name^="answer_${questionIndex}"]`)
    .forEach((input, blankIndex) => {
      input.addEventListener("input", (event) => {
        let savedAnswers = answerManager.getAnswer(questionIndex) || [];
        savedAnswers[blankIndex] = event.target.value || null;
        answerManager.saveAnswer(
          questionIndex,
          savedAnswers.some((answer) => answer) ? savedAnswers : null
        );
      });
    });

  // Обработчики для matching вопросов
  const isMobile = window.innerWidth < 768 || "ontouchstart" in window;
  container
    .querySelectorAll(`select[name^="answer_${questionIndex}_"]`)
    .forEach((select) => {
      // Для мобильных устройств добавляем элемент для отображения полного текста выбранного option
      let fullTextDisplay = null;
      if (isMobile) {
        fullTextDisplay = document.createElement("div");
        fullTextDisplay.className = "matching-option-full-text";
        select.parentElement.appendChild(fullTextDisplay);

        // Показываем полный текст, если уже есть выбранный вариант
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption && selectedOption.value) {
          fullTextDisplay.textContent = selectedOption.textContent;
          fullTextDisplay.style.display = "block";
        }
      }

      select.addEventListener("change", (event) => {
        let savedMatches = answerManager.getAnswer(questionIndex) || {};
        const selectedValue = event.target.value || null;
        const leftColumnText =
          event.target.parentElement.querySelector("label").textContent;
        savedMatches[leftColumnText] = selectedValue;
        const hasMatches = Object.values(savedMatches).some((value) => value);
        answerManager.saveAnswer(
          questionIndex,
          hasMatches ? savedMatches : null
        );

        // На мобильных устройствах показываем полный текст выбранного option
        if (isMobile && fullTextDisplay) {
          const selectedOption =
            event.target.options[event.target.selectedIndex];
          if (selectedOption && selectedOption.value) {
            fullTextDisplay.textContent = selectedOption.textContent;
            fullTextDisplay.style.display = "block";
          } else {
            fullTextDisplay.style.display = "none";
          }
        }
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
      const afterElement = getDragAfterElement(orderingList, event.clientY);
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
        answerManager.saveAnswer(questionIndex, hasOrder ? newOrder : null);
      }
    });
  }
}

// Экспортируем функции как объект для удобства использования
export default {
  renderQuestionHTML,
  addAnswerHandlers,
  formatUnits,
};
