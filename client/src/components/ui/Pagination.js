// Класс Pagination расширяет BasicPagination и добавляет функционал для отслеживания и
// визуализации посещенных страниц. Каждая посещенная кнопка отмечается классом "visited",
//  а текущая активная страница – классом "active".

import BasicPagination from "../../common/BasicPagination";

class Pagination extends BasicPagination {
  constructor(totalPages, containerId) {
    super(totalPages, containerId);
    this.visitedButtons = new Set();
  }

  changePage(pageIndex) {
    super.changePage(pageIndex);
    this.markAsVisited(pageIndex);
    this.updateVisitedButtons();
  }

  updateVisitedButtons() {
    Array.from(document.querySelectorAll(".page-button")).forEach(
      (button, index) => {
        if (this.visitedButtons.has(index)) {
          button.classList.add("visited");
        } else {
          button.classList.remove("visited");
        }
        if (index === this.currentPage) {
          button.classList.add("active");
        } else {
          button.classList.remove("active");
        }
      }
    );
  }

  markAsVisited(index) {
    this.visitedButtons.add(index);
    this.updateVisitedButtons();
  }
}

export default Pagination;
