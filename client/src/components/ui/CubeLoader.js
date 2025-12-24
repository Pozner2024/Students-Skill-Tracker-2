// Модуль для управления индикатором загрузки (кубик)
// Использует замыкание для хранения состояния контейнера

function createCubeLoader() {
  let loaderContainer = null;

  return {
    show() {
      if (loaderContainer) return;

      loaderContainer = document.createElement("div");
      loaderContainer.className = "cube-loader-container";

      loaderContainer.innerHTML = `
        <div class="content">
          <div class="cube"></div>
        </div>
      `;

      document.body.appendChild(loaderContainer);
    },

    hide() {
      if (loaderContainer) {
        document.body.removeChild(loaderContainer);
        loaderContainer = null;
      }
    },
  };
}

export default createCubeLoader;
