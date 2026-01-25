// Модуль для управления индикатором загрузки (кубик)
// Использует БЭМ-подход с классом активности

const loaderActiveClass = 'cube-loader-container_active';

function loaderOn() {
  const loader = document.querySelector('.cube-loader-container');
  loader?.classList.add(loaderActiveClass);
}

function loaderOff() {
  const loader = document.querySelector('.cube-loader-container');
  loader?.classList.remove(loaderActiveClass);
}

window.loader = {
  show: loaderOn,
  hide: loaderOff
};
