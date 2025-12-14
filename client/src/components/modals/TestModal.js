//Основная логика: Класс TestModal наследует базовые функции от BasicTestModal,
// добавляя собственные свойства и методы.
// Конструктор создает модальное окно с кнопкой, запускающей тест.
// Метод showTestInfo() показывает информацию о текущем тесте,
// а startTest() перенаправляет на страницу теста с заданными параметрами.

import BasicTestModal from "../../common/BasicTestModal.js";
export default class TestModal extends BasicTestModal {
  constructor({ variant = 1, topic = { name: "Тема не указана" }, time = 20 }) {
    super({
      id: "testModal",
      customClass: "modal-overlay test-modal",
      buttonText: "Начать тест",
      buttonAction: () => {
        this.startTest();
      },
    });

    this.variant = variant;
    this.topic = topic;
    this.time = time;
  }

  showTestInfo() {
    const content = `
      <h2>Тест по теме: ${this.topic.name || "Тема не указана"}</h2>
      <p>Вариант: ${this.variant}</p>
      <p>Время на выполнение: ${this.time} минут</p>
    `;

    this.showModal(content);
  }

  startTest() {
    const topicId = this.topic.id || 1;
    const testCode = `test${topicId}_${this.variant}`;

    const testUrl = `/test-page?variant=${
      this.variant
    }&testCode=${encodeURIComponent(testCode)}&title=${encodeURIComponent(
      this.topic.name
    )}`;

    if (window.location.href !== testUrl) {
      window.location.href = testUrl;
    }
  }
}
