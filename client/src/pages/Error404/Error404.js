import Page from "../../common/Page.js";

class Error404Page extends Page {
  constructor() {
    super({
      id: "error-404",
      title: "Ошибка 404",
      content:
        '<p>Страница не найдена, попробуйте вернуться на <a href="/">главную</a>.</p>',
      metaTitle: "Ошибка 404",
    });
  }

  cleanDynamicContent() {
    const root = document.getElementById("root");
    if (root) {
      root
        .querySelectorAll(".rectangles-container")
        .forEach((el) => el.remove());
    }
  }

  renderPage() {
    this.cleanDynamicContent();
    return this.render();
  }
}

export default Error404Page;

