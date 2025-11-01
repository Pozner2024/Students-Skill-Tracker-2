//Основная логика: Класс TestModal наследует базовые функции от BasicTestModal, добавляя собственные свойства и методы.
// Конструктор создает модальное окно с кнопкой, запускающей тест.
// Метод showTestInfo() показывает информацию о текущем тесте, а startTest() перенаправляет на страницу теста с заданными параметрами.

import BasicTestModal from "../common/BasicTestModal.js";
export default class TestModal extends BasicTestModal {
  constructor({ variant = 1, topic = { name: "Тема не указана" }, time = 20 }) {
    // Вызовем конструктор родительского класса с уникальными параметрами
    super({
      id: "testModal",
      customClass: "modal-overlay test-modal",
      buttonText: "Начать тест",
      buttonAction: () => {
        this.startTest(); // Обработчик нажатия кнопки "Начать тест"
      },
    });

    this.variant = variant; // Вариант теста (1 или 2)
    this.topic = topic;
    this.time = time; // Время на выполнение теста (в минутах)
  }

  // Метод для отображения информации о тесте
  showTestInfo() {
    const content = `
      <h2>Тест по теме: ${this.topic.name || "Тема не указана"}</h2>
      <p>Вариант: ${this.variant}</p>
      <p>Время на выполнение: ${this.time} минут</p>
    `;

    // Открываем модальное окно с информацией о тесте
    this.showModal(content);
  }

  // Метод для начала теста, который перенаправляет на страницу теста
  startTest() {
    // Формируем testCode на основе topicId и variant
    const topicId = this.topic.id || 1;
    const testCode = `test${topicId}_${this.variant}`;

    const testUrl = `/test-page?variant=${
      this.variant
    }&testCode=${encodeURIComponent(testCode)}&title=${encodeURIComponent(
      this.topic.name
    )}`;

    if (window.location.href !== testUrl) {
      // Проверка, чтобы перенаправление не повторялось
      window.location.href = testUrl;
    }
  }
}
