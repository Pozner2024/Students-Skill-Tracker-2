// Класс Pagination расширяет BasicPagination и добавляет функционал для отслеживания и
// визуализации посещенных страниц. Каждая посещенная кнопка отмечается классом "visited",
//  а текущая активная страница – классом "active".

import BasicPagination from "../common/BasicPagination";

class Pagination extends BasicPagination {
  constructor(totalPages, containerId) {
    super(totalPages, containerId);
    this.visitedButtons = new Set(); // Отслеживание посещённых кнопок
  }

  changePage(pageIndex) {
    super.changePage(pageIndex);
    this.markAsVisited(pageIndex); // Помечаем текущую страницу как посещённую
    this.updateVisitedButtons(); // Обновляем стили для посещённых кнопок
  }

  updateVisitedButtons() {
    Array.from(document.querySelectorAll(".page-button")).forEach(
      (button, index) => {
        if (this.visitedButtons.has(index)) {
          button.classList.add("visited"); // Добавляем класс для посещённой кнопки
        } else {
          button.classList.remove("visited");
        }
        if (index === this.currentPage) {
          button.classList.add("active"); // Активная кнопка
        } else {
          button.classList.remove("active");
        }
      }
    );
  }

  markAsVisited(index) {
    this.visitedButtons.add(index); // Добавляем индекс в посещённые
    this.updateVisitedButtons(); // Обновляем стили кнопок
  }
}

export default Pagination;
