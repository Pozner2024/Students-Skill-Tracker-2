// Класс Page используется для создания и рендеринга страниц в SPA-приложении.
// Конструктор принимает объект с параметрами страницы (id, title, content).
// Метод render() формирует HTML строки, которые затем вставляются в корневой
// контейнер приложения. При рендере автоматически устанавливается document.title.
// Параметр className позволяет управлять CSS-классами корневого <main>.

export default class Page {
  constructor({ id, title, content = "", metaTitle = title }) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.metaTitle = metaTitle;
  }

  render(className = "container my-4") {
    document.title = this.metaTitle;
    return `
      <main id="${this.id}" class="${className}">
        <h1>${this.title}</h1>
        <section>${this.content}</section> <!-- Отображение контента страницы -->
      </main>
    `;
  }
}
