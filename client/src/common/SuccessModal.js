import background from "../assets/background.jpg";

export default class SuccessModal {
  constructor({
    id = "successModal",
    customClass = "modal-overlay",
    title = "Успешно!",
    message = "Операция выполнена успешно",
    buttonText = "Понятно",
    buttonAction = null,
  }) {
    this.id = id;
    this.customClass = customClass;
    this.title = title;
    this.message = message;
    this.buttonText = buttonText;
    this.buttonAction = buttonAction || this.closeModal.bind(this);
  }

  // Метод для рендеринга модального окна
  render() {
    return `
      <div id="${this.id}" class="${this.customClass}">
        <div class="modal-content success-modal-content">
          <button id="${this.id}-closeModal" class="close-button">×</button>
          <div class="success-icon">✓</div>
          <h3 class="success-title">${this.title}</h3>
          <div class="modal-body success-modal-body">
            <p class="success-message">${this.message}</p>
          </div>
          <button id="${this.id}-actionButton" class="action-button success-action-button">${this.buttonText}</button>
        </div>
      </div>
    `;
  }

  // Метод для отображения модального окна
  showModal() {
    // Проверяем, есть ли уже модальное окно в DOM
    if (!document.getElementById(this.id)) {
      document.body.insertAdjacentHTML("beforeend", this.render());
    }

    // Устанавливаем фон через JavaScript
    const modalContent = document.querySelector(`#${this.id} .modal-content`);
    if (modalContent) {
      modalContent.style.backgroundImage = `url(${background})`;
      modalContent.style.backgroundSize = "cover";
      modalContent.style.backgroundPosition = "center";
      modalContent.style.backgroundRepeat = "no-repeat";
    }

    // Делаем модальное окно видимым
    document.getElementById(this.id).style.display = "flex";

    // Блокируем прокрутку страницы
    document.body.style.overflow = "hidden";

    // Добавляем обработчик для кнопки закрытия крестика
    document
      .getElementById(`${this.id}-closeModal`)
      .addEventListener("click", () => {
        this.closeModal();
      });

    // Добавляем обработчик для кнопки действия
    document
      .getElementById(`${this.id}-actionButton`)
      .addEventListener("click", this.buttonAction);

    // Закрытие при клике вне модального окна
    document.getElementById(this.id).addEventListener("click", (event) => {
      if (event.target === document.getElementById(this.id)) {
        this.closeModal();
      }
    });
  }

  // Метод для закрытия модального окна
  closeModal() {
    const modal = document.getElementById(this.id);
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
      // Удаляем модальное окно из DOM
      modal.remove();
    }
  }
}
