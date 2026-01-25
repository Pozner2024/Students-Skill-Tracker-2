import background from "../assets/background.jpg"; // Импортируем фон

export default class BasicModal {
  constructor({
    id = "basicModal",
    customClass = "modal-overlay",
    buttonText = "Закрыть",
    buttonAction = null,
  }) {
    this.id = id;
    this.customClass = customClass;
    this.buttonText = buttonText;
    this.buttonAction = buttonAction || this.closeModal.bind(this);

    this.modalElement = null;
    this.modalBody = null;
    this.closeButton = null;
    this.actionButton = null;

    this.boundClose = this.closeModal.bind(this);
    this.boundOverlayClick = this.handleOverlayClick.bind(this);
  }

  render() {
    return `
      <div id="${this.id}" class="${this.customClass}">
        <div class="modal-content">
          <button id="${this.id}-closeModal" class="close-button">×</button>
          <div class="modal-body"></div>
          <button id="${this.id}-actionButton" class="btn btn-primary action-button">${this.buttonText}</button> <!-- Кнопка внизу окна -->
        </div>
      </div>
    `;
  }

  showModal(content) {
    // Проверяем, существует ли модальное окно в DOM
    let existingModal = document.getElementById(this.id);

    // Если модальное окно не существует в DOM или ссылка потеряна, создаем его
    if (!existingModal || !this.modalElement) {
      // Если элемент существует в DOM, но ссылка потеряна, обновляем ссылку
      if (existingModal) {
        this.modalElement = existingModal;
      } else {
        // Создаем новое модальное окно
        document.body.insertAdjacentHTML("beforeend", this.render());
        this.modalElement = document.getElementById(this.id);
      }

      // Инициализируем элементы модального окна
      this.modalBody = this.modalElement?.querySelector(".modal-body") || null;
      this.closeButton = this.modalElement?.querySelector(
        `#${this.id}-closeModal`
      );
      this.actionButton = this.modalElement?.querySelector(
        `#${this.id}-actionButton`
      );

      // Устанавливаем фон через JavaScript. Пришлось вынести фон из CSS в JS, т.к. при деплое,
      // в первом случае (через CSS) он не отображался
      const modalContent = this.modalElement?.querySelector(".modal-content");
      if (modalContent) {
        modalContent.style.backgroundImage = `url(${background})`;
        modalContent.style.backgroundSize = "cover";
        modalContent.style.backgroundPosition = "center";
        modalContent.style.backgroundRepeat = "no-repeat";
      }

      if (this.closeButton) {
        this.closeButton.onclick = this.boundClose;
      }

      if (this.actionButton) {
        this.actionButton.onclick = this.buttonAction;
      }

      if (this.modalElement) {
        this.modalElement.onclick = (event) => {
          if (event.target === this.modalElement) {
            this.boundOverlayClick(event);
          }
        };
      }
    } else {
      this.modalElement = existingModal;
      this.modalBody = this.modalElement?.querySelector(".modal-body") || null;
      this.closeButton = this.modalElement?.querySelector(
        `#${this.id}-closeModal`
      );
      this.actionButton = this.modalElement?.querySelector(
        `#${this.id}-actionButton`
      );

      if (this.closeButton) {
        this.closeButton.onclick = this.boundClose;
      }

      if (this.actionButton) {
        this.actionButton.onclick = this.buttonAction;
      }

      if (this.modalElement) {
        this.modalElement.onclick = (event) => {
          if (event.target === this.modalElement) {
            this.boundOverlayClick(event);
          }
        };
      }
    }

    if (this.modalBody) {
      this.modalBody.innerHTML = content;
    }

    if (this.modalElement) {
      this.modalElement.style.display = "flex";
    }

    document.body.style.overflow = "hidden";
  }

  closeModal() {
    const modal = document.getElementById(this.id);
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  }

  handleOverlayClick(event) {
    if (event.target === this.modalElement) {
      this.closeModal();
    }
  }
}
