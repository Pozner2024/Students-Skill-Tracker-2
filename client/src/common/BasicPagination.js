//Этот код создает класс BasicPagination, который генерирует интерфейс пагинации с кнопками,
// количество которых определяется параметром totalPages. При создании объекта:
// Кнопки страниц отображаются в указанном контейнере (containerId).
// При нажатии на кнопку вызывается метод changePage, который обновляет текущую страницу и активирует соответствующую кнопку

class BasicPagination {
  constructor(totalPages, containerId) {
    this.totalPages = totalPages;
    this.currentPage = 0;
    this.container = document.getElementById(containerId);

    if (!this.container) {
      return;
    }

    this.onPageChange = null;
    this.renderPagination();
  }

  renderPagination() {
    if (!this.container) {
      return;
    }

    this.container.innerHTML = "";
    for (let i = 0; i < this.totalPages; i++) {
      const button = document.createElement("button");
      button.classList.add("page-button");
      button.textContent = i + 1;
      button.onclick = () => this.changePage(i);
      this.container.appendChild(button);
    }
  }

  changePage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= this.totalPages) return;

    this.currentPage = pageIndex;

    if (typeof this.onPageChange === "function") {
      this.onPageChange(pageIndex);
    }

    this.updateActiveButton();
  }

  updateActiveButton() {
    if (!this.container) {
      return;
    }

    const buttons = this.container.querySelectorAll(".page-button");
    buttons.forEach((button, index) => {
      button.classList.toggle("active", index === this.currentPage);
    });
  }
}

export default BasicPagination;
