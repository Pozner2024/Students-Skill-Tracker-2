import background from "../assets/background.jpg"; // Импортируем фон

export default class BasicTestModal {
  constructor({
    id = "basicTestModal",
    customClass = "modal-overlay",
    variant = 1, // Добавляем вариант теста (1 или 2)
    topic = "Тема неизвестна", // Добавляем название темы для теста
    buttonText = "Начать тест", // Меняем текст кнопки
    buttonAction = null, // Действие по умолчанию будет перенаправление
  }) {
    this.id = id;
    this.customClass = customClass;
    this.variant = variant; // Вариант теста
    this.topic = topic; // Тема теста
    this.buttonText = buttonText;
    this.buttonAction = buttonAction || this.redirectToTestPage.bind(this); // Действие по умолчанию — перенаправить на страницу теста
  }

  // Метод для рендеринга модального окна
  render() {
    return `
      <div id="${this.id}" class="${this.customClass}">
        <div class="modal-content">
          <button id="${this.id}-closeModal" class="close-button">×</button>
          <div class="modal-body"></div>
          <button id="${this.id}-actionButton" class="action-button">${this.buttonText}</button> <!-- Кнопка внизу окна -->
        </div>
      </div>
    `;
  }

  // Метод для отображения модального окна с контентом
  showModal(content) {
    // Проверяем, есть ли уже модальное окно в DOM
    if (!document.getElementById(this.id)) {
      document.body.insertAdjacentHTML("beforeend", this.render());
    }

    // Устанавливаем фон через JavaScript. Пришлось вынести фон из CSS в JS, т.к. при деплое,
    // в первом случае (через СSS, он не отображался на Netlify
    const modalContent = document.querySelector(`#${this.id} .modal-content`);
    if (modalContent) {
      modalContent.style.backgroundImage = `url(${background})`;
      modalContent.style.backgroundSize = "cover";
      modalContent.style.backgroundPosition = "center";
      modalContent.style.backgroundRepeat = "no-repeat";
    }

    // Заполняем контейнер модального окна динамическим контентом
    document.querySelector(`#${this.id} .modal-body`).innerHTML = content;

    // Делаем модальное окно видимым
    document.getElementById(this.id).style.display = "flex";

    // Блокируем прокрутку страницы
    document.body.style.overflow = "hidden";

    // Добавляем обработчик для кнопки закрытия (крестик)
    document
      .getElementById(`${this.id}-closeModal`)
      .addEventListener("click", () => {
        this.closeModal();
      });

    // Добавляем обработчик для кнопки действия (например, "Начать тест")
    document
      .getElementById(`${this.id}-actionButton`)
      .addEventListener("click", this.buttonAction);
  }

  // Метод для закрытия модального окна
  closeModal() {
    const modal = document.getElementById(this.id);
    if (modal) {
      modal.style.display = "none"; // Скрываем модальное окно
      document.body.style.overflow = "auto"; // Восстанавливаем прокрутку страницы
    }
  }

  // Метод для перенаправления на страницу теста
  redirectToTestPage() {
    const testPageUrl = `/test?variant=${
      this.variant
    }&topic=${encodeURIComponent(this.topic)}`;
    window.location.href = testPageUrl; // Перенаправляем пользователя на страницу теста
  }
}
