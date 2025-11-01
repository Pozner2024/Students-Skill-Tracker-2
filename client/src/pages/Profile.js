import Page from "../common/Page.js";
import authService from "../utils/authService.js";

class ProfilePage extends Page {
  constructor() {
    super({
      id: "profile",
      title: "Добро пожаловать в Ваш личный кабинет",
      content: "",
      metaTitle: "Личный кабинет",
    });
    this.instanceId = Math.random().toString(36).substr(2, 9);
  }

  // Метод для отображения информации о пользователе
  async displayUserInfo() {
    try {
      const result = await authService.getCurrentUser();

      if (result.success) {
        // Редирект админа теперь выполняется в роутере до рендера

        // Получаем результаты тестов
        const testResults = await authService.getTestResults();

        // Проверяем, заполнены ли данные пользователя
        const hasUserData = result.user.fullName && result.user.groupNumber;

        return `
          <div class="profile-container">
            ${
              !hasUserData
                ? `
              <form id="profile-form" class="profile-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="fullName">Фамилия и Имя:</label>
                    <input type="text" id="fullName" name="fullName" placeholder="Введите ваши фамилию и имя" value="${
                      result.user.fullName || ""
                    }">
                  </div>
                  <div class="form-group">
                    <label for="groupNumber">Номер группы:</label>
                    <input type="text" id="groupNumber" name="groupNumber" placeholder="Введите номер группы" value="${
                      result.user.groupNumber || ""
                    }">
                  </div>
                </div>
                <div class="form-actions">
                  <button type="submit" id="save-btn" class="save-btn">Сохранить</button>
                </div>
              </form>
            `
                : ""
            }
            ${this.renderUserData(result.user)}
            ${this.renderTestResults(testResults)}
          </div>
        `;
      } else {
        return `
          <div class="profile-container">
            <h2>Ошибка загрузки данных</h2>
            <p>Не удалось загрузить информацию о пользователе: ${result.error}</p>
          </div>
        `;
      }
    } catch (error) {
      return `
        <div class="profile-container">
          <h2>Ошибка</h2>
          <p>Произошла ошибка при загрузке данных: ${error.message}</p>
        </div>
      `;
    }
  }

  // Метод для экранирования HTML
  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Метод для отображения данных пользователя
  renderUserData(user) {
    if (!user.fullName && !user.groupNumber) {
      return "";
    }

    return `
      <div class="user-data-section">
        <h3>Ваши данные:</h3>
        <div class="user-data">
          <div class="data-item">
            <span class="data-label">Email:</span>
            <span class="data-value">${user.email}</span>
          </div>
          ${
            user.fullName
              ? `
            <div class="data-item editable-item" data-field="fullName">
              <span class="data-label">Фамилия и Имя:</span>
              <span class="data-value editable-field" contenteditable="false" data-field="fullName" data-original="${this.escapeHtml(
                user.fullName
              )}">${this.escapeHtml(user.fullName)}</span>
              <button class="edit-btn" data-field="fullName">Редактировать</button>
              <button class="save-btn-field" data-field="fullName" style="display: none;">Сохранить</button>
              <button class="cancel-btn-field" data-field="fullName" style="display: none;">Отмена</button>
            </div>
          `
              : ""
          }
          ${
            user.groupNumber
              ? `
            <div class="data-item editable-item" data-field="groupNumber">
              <span class="data-label">Номер группы:</span>
              <span class="data-value editable-field" contenteditable="false" data-field="groupNumber" data-original="${this.escapeHtml(
                user.groupNumber
              )}">${this.escapeHtml(user.groupNumber)}</span>
              <button class="edit-btn" data-field="groupNumber">Редактировать</button>
              <button class="save-btn-field" data-field="groupNumber" style="display: none;">Сохранить</button>
              <button class="cancel-btn-field" data-field="groupNumber" style="display: none;">Отмена</button>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  // Метод для получения названия теста по коду
  getTestTitle(testCode) {
    const testTitles = {
      test1_1: "Организация снабжения (вариант 1)",
      test1_2: "Организация снабжения (вариант 2)",
      test2_1: "Подготовка сырья к производству (вариант 1)",
      test2_2: "Подготовка сырья к производству (вариант 2)",
      test3_1: "Полуфабрикаты для мучных кондитерских изделий (вариант 1)",
      test3_2: "Полуфабрикаты для мучных кондитерских изделий (вариант 2)",
      test4_1: "Дрожжевое тесто и изделия из него (вариант 1)",
      test4_2: "Дрожжевое тесто и изделия из него (вариант 2)",
      test5_1: "Бездрожжевое тесто и изделия из него (вариант 1)",
      test5_2: "Бездрожжевое тесто и изделия из него (вариант 2)",
      test6_1: "Отделочные полуфабрикаты для пирожных и тортов (вариант 1)",
      test6_2: "Отделочные полуфабрикаты для пирожных и тортов (вариант 2)",
      test7_1: "Приготовление пирожных (вариант 1)",
      test7_2: "Приготовление пирожных (вариант 2)",
      test8_1: "Приготовление тортов (вариант 1)",
      test8_2: "Приготовление тортов (вариант 2)",
      test9_1: "Приготовление десертов (вариант 1)",
      test9_2: "Приготовление десертов (вариант 2)",
      test10_1: "Приготовление национальных кондитерских изделий (вариант 1)",
      test10_2: "Приготовление национальных кондитерских изделий (вариант 2)",
    };

    return testTitles[testCode] || testCode;
  }

  // Метод для отображения результатов тестов
  renderTestResults(testResults) {
    if (!testResults.success) {
      return `
        <div class="test-results-section">
          <h3>Ваши результаты</h3>
          <div class="no-results">
            <p>Ошибка загрузки результатов: ${testResults.error}</p>
          </div>
        </div>
      `;
    }

    if (!testResults.results || testResults.results.length === 0) {
      return `
        <div class="test-results-section">
          <h3>Ваши результаты</h3>
          <div class="no-results">
            <p>Нет пройденных тестов</p>
          </div>
        </div>
      `;
    }

    const resultsHtml = testResults.results
      .map(
        (result) => `
      <div class="test-result-item">
        <div class="result-header">
          <span class="test-title">Вы прошли тест: ${this.getTestTitle(
            result.test_code
          )}</span>
          <span class="test-date">${new Date(
            result.completed_at
          ).toLocaleDateString("ru-RU")}</span>
        </div>
        <div class="result-score">
          <span class="score">Оценка: ${result.grade ?? "-"}</span>
        </div>
      </div>
    `
      )
      .join("");

    return `
      <div class="test-results-section">
        <h3>Ваши результаты</h3>
        <div class="test-results-list">
          ${resultsHtml}
        </div>
      </div>
    `;
  }

  // Метод для обработки формы профиля
  handleProfileForm() {
    const profileForm = document.getElementById("profile-form");

    if (profileForm) {
      profileForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const groupNumber = document.getElementById("groupNumber").value.trim();

        // Показываем индикатор загрузки
        const saveBtn = document.getElementById("save-btn");
        const originalText = saveBtn.textContent;
        saveBtn.textContent = "Сохранение...";
        saveBtn.disabled = true;

        try {
          const result = await authService.updateProfile(fullName, groupNumber);

          if (result.success) {
            alert("Данные успешно сохранены!");

            // Перезагружаем страницу, чтобы скрыть форму и показать данные
            window.location.reload();
          } else {
            alert("Ошибка при сохранении: " + result.error);
          }
        } catch (error) {
          alert("Ошибка при сохранении: " + error.message);
        } finally {
          // Восстанавливаем кнопку только если не было успешного сохранения
          if (saveBtn) {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
          }
        }
      });
    }
  }

  // Метод для рендеринга страницы
  async renderPage() {
    const userInfo = await this.displayUserInfo();
    return `
      <main id="${this.id}" class="profile">
        <h1>${this.title}</h1>
        <section>
          ${userInfo}
        </section>
      </main>
    `;
  }

  // Метод для обработки редактирования полей
  handleEditableFields() {
    const container = document.querySelector(".user-data-section");
    if (!container) {
      return;
    }

    // Проверяем, были ли уже добавлены обработчики (чтобы не добавлять их повторно)
    if (container.dataset.editableHandlers === "true") {
      return;
    }

    // Помечаем, что обработчики добавлены
    container.dataset.editableHandlers = "true";

    // Обработчик кнопки "Редактировать"
    container.addEventListener("click", (e) => {
      if (e.target.classList.contains("edit-btn")) {
        const field = e.target.dataset.field;
        const editableField = container.querySelector(
          `.editable-field[data-field="${field}"]`
        );
        const saveBtn = container.querySelector(
          `.save-btn-field[data-field="${field}"]`
        );
        const cancelBtn = container.querySelector(
          `.cancel-btn-field[data-field="${field}"]`
        );
        const editBtn = e.target;

        if (editableField) {
          // Активируем редактирование
          editableField.contentEditable = "true";
          editableField.classList.add("editing");
          editBtn.style.display = "none";
          saveBtn.style.display = "inline-block";
          cancelBtn.style.display = "inline-block";
          editableField.focus();

          // Выделяем весь текст для удобства редактирования
          const range = document.createRange();
          range.selectNodeContents(editableField);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    });

    // Обработчик кнопки "Сохранить"
    container.addEventListener("click", async (e) => {
      if (e.target.classList.contains("save-btn-field")) {
        const field = e.target.dataset.field;
        const editableField = container.querySelector(
          `.editable-field[data-field="${field}"]`
        );
        const saveBtn = e.target;
        const cancelBtn = container.querySelector(
          `.cancel-btn-field[data-field="${field}"]`
        );
        const editBtn = container.querySelector(
          `.edit-btn[data-field="${field}"]`
        );

        if (editableField) {
          const newValue = editableField.textContent.trim();
          const originalValue = editableField.dataset.original;

          // Проверяем, изменилось ли значение
          if (newValue === originalValue) {
            // Значение не изменилось, просто отменяем редактирование
            editableField.contentEditable = "false";
            editableField.classList.remove("editing");
            saveBtn.style.display = "none";
            cancelBtn.style.display = "none";
            editBtn.style.display = "inline-block";
            return;
          }

          // Валидация
          if (!newValue) {
            alert(
              `${
                field === "fullName" ? "Фамилия и Имя" : "Номер группы"
              } не может быть пустым`
            );
            editableField.textContent = originalValue;
            return;
          }

          // Показываем индикатор загрузки
          const originalText = saveBtn.textContent;
          saveBtn.textContent = "Сохранение...";
          saveBtn.disabled = true;
          cancelBtn.disabled = true;

          try {
            // Получаем текущие значения для всех полей
            const currentUser = await authService.getCurrentUser();
            if (!currentUser.success) {
              throw new Error(
                "Не удалось загрузить текущие данные пользователя"
              );
            }

            // Подготавливаем данные для обновления
            const updateData = {
              fullName:
                field === "fullName"
                  ? newValue
                  : currentUser.user.fullName || "",
              groupNumber:
                field === "groupNumber"
                  ? newValue
                  : currentUser.user.groupNumber || "",
            };

            const result = await authService.updateProfile(
              updateData.fullName,
              updateData.groupNumber
            );

            if (result.success) {
              // Обновляем original значение
              editableField.dataset.original = newValue;
              editableField.contentEditable = "false";
              editableField.classList.remove("editing");
              saveBtn.style.display = "none";
              cancelBtn.style.display = "none";
              editBtn.style.display = "inline-block";
              alert("Данные успешно сохранены!");
            } else {
              alert("Ошибка при сохранении: " + result.error);
              editableField.textContent = originalValue;
            }
          } catch (error) {
            alert("Ошибка при сохранении: " + error.message);
            editableField.textContent = originalValue;
          } finally {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
            cancelBtn.disabled = false;
          }
        }
      }
    });

    // Обработчик кнопки "Отмена"
    container.addEventListener("click", (e) => {
      if (e.target.classList.contains("cancel-btn-field")) {
        const field = e.target.dataset.field;
        const editableField = container.querySelector(
          `.editable-field[data-field="${field}"]`
        );
        const saveBtn = container.querySelector(
          `.save-btn-field[data-field="${field}"]`
        );
        const cancelBtn = e.target;
        const editBtn = container.querySelector(
          `.edit-btn[data-field="${field}"]`
        );

        if (editableField) {
          // Возвращаем исходное значение
          editableField.textContent = editableField.dataset.original;
          editableField.contentEditable = "false";
          editableField.classList.remove("editing");
          saveBtn.style.display = "none";
          cancelBtn.style.display = "none";
          editBtn.style.display = "inline-block";
        }
      }
    });
  }

  // Метод для инициализации страницы (вызывается после рендеринга)
  init() {
    // Обрабатываем форму после рендеринга с небольшой задержкой
    setTimeout(() => {
      this.handleProfileForm(); // Устанавливаем обработчик формы профиля
      this.handleEditableFields(); // Устанавливаем обработчики редактируемых полей
    }, 10);
  }
}

export default ProfilePage;
