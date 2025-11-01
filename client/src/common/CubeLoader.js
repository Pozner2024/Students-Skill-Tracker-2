export default class CubeLoader {
  constructor() {
    this.loaderContainer = null;
  }

  show() {
    if (this.loaderContainer) return;

    // Создаем контейнер для лоадера
    this.loaderContainer = document.createElement("div");
    this.loaderContainer.className = "cube-loader-container"; // Основной контейнер для лоадера

    // Вставляем HTML разметку в контейнер с помощью строки
    this.loaderContainer.innerHTML = `
      <div class="content">
        <div class="cube"></div>
      </div>
    `;

    // Добавляем контейнер в body
    document.body.appendChild(this.loaderContainer);
  }

  hide() {
    if (this.loaderContainer) {
      document.body.removeChild(this.loaderContainer);
      this.loaderContainer = null;
    }
  }
}
