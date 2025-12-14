import background from "../assets/background.jpg";

export default class BasicTestModal {
  constructor({
    id = "basicTestModal",
    customClass = "modal-overlay",
    variant = 1,
    topic = "Тема неизвестна",
    buttonText = "Начать тест",
    buttonAction = null,
  }) {
    this.id = id;
    this.customClass = customClass;
    this.variant = variant;
    this.topic = topic;
    this.buttonText = buttonText;
    this.buttonAction = buttonAction || this.redirectToTestPage.bind(this);
  }

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

  showModal(content) {
    if (!document.getElementById(this.id)) {
      document.body.insertAdjacentHTML("beforeend", this.render());
    }

    // Устанавливаем фон через JavaScript. Пришлось вынести фон из CSS в JS, т.к. при деплое,
    // в первом случае (через CSS) он не отображался
    const modalContent = document.querySelector(`#${this.id} .modal-content`);
    if (modalContent) {
      modalContent.style.backgroundImage = `url(${background})`;
      modalContent.style.backgroundSize = "cover";
      modalContent.style.backgroundPosition = "center";
      modalContent.style.backgroundRepeat = "no-repeat";
    }

    document.querySelector(`#${this.id} .modal-body`).innerHTML = content;

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
  }

  closeModal() {
    const modal = document.getElementById(this.id);
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  }

  redirectToTestPage() {
    const testPageUrl = `/test?variant=${
      this.variant
    }&topic=${encodeURIComponent(this.topic)}`;
    window.location.href = testPageUrl;
  }
}
