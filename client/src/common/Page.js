export default class Page {
  constructor({ id, title, content = "", metaTitle = title }) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.metaTitle = metaTitle;
  }

  // Метод для рендеринга страницы
  render(className = "container") {
    document.title = this.metaTitle; // Устанавливаем мета-заголовок страницы
    return `
      <main id="${this.id}" class="${className}">
        <h1>${this.title}</h1>
        <section>${this.content}</section> <!-- Отображение контента страницы -->
      </main>
    `;
  }
}
