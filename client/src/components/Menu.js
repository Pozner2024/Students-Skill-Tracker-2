import Section from "../common/Section";
import { MENU_ITEMS } from "../constants/constants.js"; // Импортируем константы

export default class Menu extends Section {
  constructor() {
    super({ id: "menu", customClass: "site-menu" });
  }

  render() {
    // Создаем HTML-код для пунктов меню на основе константы MENU_ITEMS
    const menuItemsHTML = MENU_ITEMS.map(
      (item) => `
      <li><a href="${item.url}" class="menu__link">${item.title}</a></li>
    `
    ).join("");

    return `
      <section id="${this.id}" class="${this.id} ${this.customClass}">
        <nav>
          <ul>
            ${menuItemsHTML} <!-- Вставляем сгенерированные пункты меню -->
          </ul>
        </nav>
      </section>
    `;
  }
}
