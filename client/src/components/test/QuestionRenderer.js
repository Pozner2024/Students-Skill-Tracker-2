// Модуль для рендеринга различных типов вопросов
// (например, выбор из нескольких вариантов, заполнение пропусков, сортировка
// и сопоставление) и для привязки обработчиков ответов.

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

function escapeAttributeValue(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMultipleChoice(question, index, answerManager) {
  const savedAnswer = answerManager.getAnswer(index);

  if (!question.options || !Array.isArray(question.options)) {
    return "<p>Ошибка: варианты ответов не найдены</p>";
  }

  return question.options
    .map((optionRaw) => {
      const option = formatUnits(optionRaw);
      const rawValue = escapeAttributeValue(optionRaw);
      const isChecked = savedAnswer === optionRaw || savedAnswer === option;
      return `
        <label>
          <input type="radio" name="answer_${index}" value="${rawValue}" ${
        isChecked ? "checked" : ""
      } />
          ${option}
        </label><br/>
      `;
    })
    .join("");
}

function renderFillInTheBlank(question, index, answerManager) {
  const savedAnswers = answerManager.getAnswer(index) || [];
  let answerIndex = 0;

  if (!question.question) {
    return "<p>Ошибка: текст вопроса не найден</p>";
  }

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
        ${prefix ? `${prefix} ` : ""}
        <input
          type="text"
          name="answer_${index}_${answerIndex - 1}"
          value="${savedText}"
          placeholder="Введите Ваш ответ"
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

function renderOrdering(question, index, answerManager) {
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

function renderMatching(question, index, answerManager) {
  const savedAnswer = answerManager.getAnswer(index) || {};

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

function renderQuestionHTML(question, index, imagePath, answerManager) {
  if (!question) {
    return "<p>Ошибка: вопрос не найден</p>";
  }

  let questionHTML = "";

  if (question.questionDescription) {
    const formattedDescription = formatUnits(question.questionDescription);
    questionHTML += `<p>${formattedDescription}</p>`;
  }

  if (question.type !== "fill_in_the_blank") {
    const formattedQuestion = formatUnits(question.question);
    questionHTML += `<p>${formattedQuestion}</p>`;
  }

  let imageHTML = "";
  // Проверяем, что imagePath валиден (не null, не пустая строка, и является валидным URL)
  if (
    imagePath &&
    typeof imagePath === "string" &&
    imagePath.trim() !== "" &&
    (imagePath.startsWith("http://") ||
      imagePath.startsWith("https://") ||
      imagePath.startsWith("data:"))
  ) {
    // Экранируем URL для безопасности
    const escapedImagePath = imagePath.replace(/"/g, "&quot;");
    // Используем data-src вместо src, чтобы отложить загрузку до активации элемента
    imageHTML = `
      <div class="question-image">
        <img data-src="${escapedImagePath}" alt="" 
             loading="lazy"
             referrerpolicy="no-referrer"
             onerror="try{this.style.display='none';}catch(e){} this.onerror=function(){try{this.style.display='none';}catch(e){} return false;}; this.onload=null;" 
             onload="this.onerror=null;" />
      </div>
    `;
  }

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

  const additionalClass =
    question.type === "matching"
      ? "matching-only"
      : question.type === "ordering"
      ? "ordering-only"
      : "general-question";

  return `
    <div class="question ${additionalClass}" data-question-index="${index}">
      <div class="question-navigation">
        <button id="prevButton" class="nav-button">
          <svg width="24" height="24" viewBox="0 0 24 24"
     xmlns="http://www.w3.org/2000/svg">
  <path d="M11 5L4 12L11 19V13.5H21V10.5H11V5Z"
        fill="currentColor"/>
</svg>
        </button>
        <button id="nextButton" class="nav-button">
          <span>Далее</span>
          <svg width="24" height="24" viewBox="0 0 24 24"
     xmlns="http://www.w3.org/2000/svg">
  <path d="M13 5L20 12L13 19V13.5H3V10.5H13V5Z"
        fill="currentColor"/>
</svg>
        </button>
      </div>
      <div class="question-content">
        <div class="question-text">
          ${questionHTML}
        </div>
        ${imageHTML}
      </div>
    </div>
  `;
}

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

function saveOrderingAnswer(orderingList, questionIndex, answerManager) {
  const newOrder = Array.from(orderingList.children).map((item) =>
    item.textContent.trim()
  );
  const hasOrder = newOrder.length > 0 && newOrder.some((item) => item);
  answerManager.saveAnswer(questionIndex, hasOrder ? newOrder : null);
}

function addAnswerHandlers(container, questionIndex, answerManager) {
  container
    .querySelectorAll(`input[name="answer_${questionIndex}"]`)
    .forEach((input) => {
      input.addEventListener("change", (event) => {
        answerManager.saveAnswer(questionIndex, event.target.value || null);
      });
    });

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

  const isMobile = window.innerWidth < 768 || "ontouchstart" in window;
  container
    .querySelectorAll(`select[name^="answer_${questionIndex}_"]`)
    .forEach((select) => {
      let fullTextDisplay = null;
      if (isMobile) {
        fullTextDisplay = document.createElement("div");
        fullTextDisplay.className = "matching-option-full-text";
        select.parentElement.appendChild(fullTextDisplay);

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

  const orderingList = container.querySelector(`#ordering_${questionIndex}`);

  if (orderingList) {
    let draggedItem = null;
    const isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0;

    if (!isTouchDevice) {
      orderingList.addEventListener("dragstart", (event) => {
        if (event.target.classList.contains("draggable-item")) {
          draggedItem = event.target;
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", event.target.dataset.index);
          draggedItem.classList.add("dragging");
        }
      });

      orderingList.addEventListener("dragover", (event) => {
        event.preventDefault();
        const afterElement = getDragAfterElement(orderingList, event.clientY);
        if (afterElement == null) {
          orderingList.appendChild(draggedItem);
        } else {
          orderingList.insertBefore(draggedItem, afterElement);
        }
      });

      orderingList.addEventListener("drop", (event) => {
        event.preventDefault();
        if (draggedItem) {
          draggedItem.classList.remove("dragging");
          draggedItem = null;
          saveOrderingAnswer(orderingList, questionIndex, answerManager);
        }
      });
    } else {
      let activePointerId = null;
      let dragStartTimer = null;
      let dragStartX = 0;
      let dragStartY = 0;
      let isDragActive = false;
      let dragOverItem = null;
      const dragStartDelayMs = 350;
      const dragCancelThreshold = 8;

      const clearDragOver = () => {
        if (dragOverItem) {
          dragOverItem.classList.remove("drag-over");
          dragOverItem = null;
        }
      };

      const resetPointerDrag = (shouldSave) => {
        if (dragStartTimer) {
          window.clearTimeout(dragStartTimer);
          dragStartTimer = null;
        }
        clearDragOver();
        if (draggedItem) {
          draggedItem.classList.remove("dragging");
        }
        if (shouldSave && draggedItem && isDragActive) {
          saveOrderingAnswer(orderingList, questionIndex, answerManager);
        }
        draggedItem = null;
        activePointerId = null;
        isDragActive = false;
      };

      orderingList.addEventListener("pointerdown", (event) => {
        const target = event.target;
        if (!target.classList.contains("draggable-item")) return;

        draggedItem = target;
        activePointerId = event.pointerId;
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        isDragActive = false;

        dragStartTimer = window.setTimeout(() => {
          if (!draggedItem) return;
          isDragActive = true;
          draggedItem.classList.add("dragging");
          draggedItem.setPointerCapture(activePointerId);
        }, dragStartDelayMs);
      });

      orderingList.addEventListener("pointermove", (event) => {
        if (!draggedItem || event.pointerId !== activePointerId) return;
        if (!isDragActive) {
          const deltaX = Math.abs(event.clientX - dragStartX);
          const deltaY = Math.abs(event.clientY - dragStartY);
          if (deltaX + deltaY > dragCancelThreshold) {
            resetPointerDrag(false);
          }
          return;
        }

        event.preventDefault();

        const afterElement = getDragAfterElement(orderingList, event.clientY);
        if (afterElement == null) {
          orderingList.appendChild(draggedItem);
          clearDragOver();
        } else if (afterElement !== draggedItem) {
          if (dragOverItem !== afterElement) {
            clearDragOver();
            dragOverItem = afterElement;
            dragOverItem.classList.add("drag-over");
          }
          orderingList.insertBefore(draggedItem, afterElement);
        }
      });

      const finishPointerDrag = () => resetPointerDrag(true);
      const cancelPointerDrag = () => resetPointerDrag(false);

      orderingList.addEventListener("pointerup", finishPointerDrag);
      orderingList.addEventListener("pointercancel", cancelPointerDrag);
    }
  }
}

export default {
  renderQuestionHTML,
  addAnswerHandlers,
  formatUnits,
};
