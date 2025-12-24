// Этот класс AnswerHandlers управляет обработкой событий для ответов пользователя
// в различных типах вопросов, таких как выбор одного варианта (radio), текстовые
// ответы, выбор из списка (select), а также вопросы с перетаскиванием. Он использует
// объект answerManager для сохранения ответов и реализует логику для каждого типа вопроса

class AnswerHandlers {
  constructor(answerManager) {
    this.answerManager = answerManager;
  }

  addHandlers(container, questionIndex) {
    container.addEventListener("input", (event) => {
      const target = event.target;
      const type = target.type;

      if (
        type === "radio" &&
        target.name.startsWith(`answer_${questionIndex}`) &&
        target.checked
      ) {
        this.answerManager.saveAnswer(questionIndex, target.value);
      }

      if (
        type === "text" &&
        target.name.startsWith(`answer_${questionIndex}`)
      ) {
        const currentAnswers = Array.from(
          this.answerManager.getAnswer(questionIndex) || []
        );
        const answerIndex = parseInt(target.name.split("_").pop(), 10);

        currentAnswers[answerIndex] = target.value;

        this.answerManager.saveAnswer(questionIndex, currentAnswers);
      }
    });

    container.addEventListener("change", (event) => {
      const target = event.target;

      if (
        target.tagName === "SELECT" &&
        target.name.startsWith(`answer_${questionIndex}`)
      ) {
        const leftItem =
          target.parentElement.querySelector("label").textContent;
        const selectedValue = target.value;
        const currentAnswer =
          { ...this.answerManager.getAnswer(questionIndex) } || {};
        currentAnswer[leftItem] = selectedValue;
        this.answerManager.saveAnswer(questionIndex, currentAnswer);
      }
    });

    const orderingList = container.querySelector(`#ordering_${questionIndex}`);
    if (orderingList) {
      let draggedItemIndex = null;

      orderingList.addEventListener("dragstart", (e) => {
        if (e.target.classList.contains("draggable-item")) {
          draggedItemIndex = e.target.dataset.index;
        }
      });

      orderingList.addEventListener("dragover", (e) => e.preventDefault());

      orderingList.addEventListener("drop", (e) => {
        e.preventDefault();
        if (e.target.classList.contains("draggable-item")) {
          const droppedItemIndex = e.target.dataset.index;
          const savedOrder = Array.from(
            orderingList.querySelectorAll(".draggable-item")
          ).map((el) => el.textContent);

          [savedOrder[draggedItemIndex], savedOrder[droppedItemIndex]] = [
            savedOrder[droppedItemIndex],
            savedOrder[draggedItemIndex],
          ];

          this.answerManager.saveAnswer(questionIndex, savedOrder);
          this.updateOrderingList(orderingList, savedOrder);
        }
      });
    }
  }

  updateOrderingList(orderingList, items) {
    orderingList.innerHTML = items
      .map(
        (item, i) => `
            <li class="draggable-item" draggable="true" data-index="${i}">
              ${item}
            </li>
          `
      )
      .join("");
  }
}

export default AnswerHandlers;
