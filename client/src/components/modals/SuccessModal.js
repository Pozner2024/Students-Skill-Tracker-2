import background from "../../assets/background.jpg";

export default class SuccessModal {
  constructor({
    id = "successModal",
    customClass = "modal-overlay",
    title = "Успешно!",
    message = "Операция выполнена успешно",
    buttonText = "Понятно",
    buttonAction = null,
    onClose = null,
  }) {
    this.id = id;
    this.customClass = customClass;
    this.title = title;
    this.message = message;
    this.buttonText = buttonText;
    this.buttonAction = buttonAction || this.closeModal.bind(this);
    this.onClose = onClose;
  }

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

  showModal() {
    if (!document.getElementById(this.id)) {
      document.body.insertAdjacentHTML("beforeend", this.render());
    }

    const modalContent = document.querySelector(`#${this.id} .modal-content`);
    if (modalContent) {
      modalContent.style.backgroundImage = `url(${background})`;
      modalContent.style.backgroundSize = "cover";
      modalContent.style.backgroundPosition = "center";
      modalContent.style.backgroundRepeat = "no-repeat";
    }

    document.getElementById(this.id).style.display = "flex";

    document.body.style.overflow = "hidden";

    document
      .getElementById(`${this.id}-closeModal`)
      .addEventListener("click", () => {
        this.closeModal();
      });

    document
      .getElementById(`${this.id}-actionButton`)
      .addEventListener("click", this.buttonAction);

    document.getElementById(this.id).addEventListener("click", (event) => {
      if (event.target === document.getElementById(this.id)) {
        this.closeModal();
      }
    });
  }

  closeModal() {
    const modal = document.getElementById(this.id);
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
      modal.remove();
    }

    if (typeof this.onClose === "function") {
      this.onClose();
    }
  }
}

