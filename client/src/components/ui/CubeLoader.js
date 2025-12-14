// Модуль для управления индикатором загрузки (кубик)
// Использует замыкание для хранения состояния контейнера

function createCubeLoader() {
  let loaderContainer = null;

  return {
    // Показывает индикатор загрузки
    show() {
      if (loaderContainer) return;

      // Создаем контейнер для лоадера
      loaderContainer = document.createElement("div");
      loaderContainer.className = "cube-loader-container";

      // Вставляем HTML разметку в контейнер
      loaderContainer.innerHTML = `
        <div class="content">
          <div class="cube"></div>
        </div>
      `;

      // Добавляем контейнер в body
      document.body.appendChild(loaderContainer);
    },

    // Скрывает индикатор загрузки
    hide() {
      if (loaderContainer) {
        document.body.removeChild(loaderContainer);
        loaderContainer = null;
      }
    },
  };
}

export default createCubeLoader;
