import authService from "../../services/authService.js";
import { escapeHtml } from "./helpers.js";
import { showBootstrapAlert } from "./alerts.js";

export function renderUserData(user) {
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
              <span class="data-value editable-field" contenteditable="false" data-field="fullName" data-original="${escapeHtml(
                user.fullName
              )}">${escapeHtml(user.fullName)}</span>
              <button class="edit-btn" data-field="fullName">Редактировать</button>
              <button class="save-btn-field hidden" data-field="fullName">Сохранить</button>
              <button class="cancel-btn-field hidden" data-field="fullName">Отмена</button>
            </div>
          `
              : ""
          }
          ${
            user.groupNumber
              ? `
            <div class="data-item editable-item" data-field="groupNumber">
              <span class="data-label">Номер группы:</span>
              <span class="data-value editable-field" contenteditable="false" data-field="groupNumber" data-original="${escapeHtml(
                user.groupNumber
              )}">${escapeHtml(user.groupNumber)}</span>
              <button class="edit-btn" data-field="groupNumber">Редактировать</button>
              <button class="save-btn-field hidden" data-field="groupNumber">Сохранить</button>
              <button class="cancel-btn-field hidden" data-field="groupNumber">Отмена</button>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
}

export function handleEditableFields() {
  const container = document.querySelector(".user-data-section");
  if (!container) {
    return;
  }

  if (container.dataset.editableHandlers === "true") {
    return;
  }

  container.dataset.editableHandlers = "true";

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
        editableField.contentEditable = "true";
        editableField.classList.add("editing");
        editBtn.classList.add("hidden");
        saveBtn.classList.remove("hidden");
        saveBtn.classList.add("show-inline-block");
        cancelBtn.classList.remove("hidden");
        cancelBtn.classList.add("show-inline-block");
        editableField.focus();

        const range = document.createRange();
        range.selectNodeContents(editableField);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  });

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
        const groupPattern = /^(?:\d-\d{2}|\d{2}-\d{2})$/;

        if (newValue === originalValue) {
          editableField.contentEditable = "false";
          editableField.classList.remove("editing");
          saveBtn.classList.add("hidden");
          saveBtn.classList.remove("show-inline-block");
          cancelBtn.classList.add("hidden");
          cancelBtn.classList.remove("show-inline-block");
          editBtn.classList.remove("hidden");
          editBtn.classList.add("show-inline-block");
          return;
        }

        if (!newValue) {
          showBootstrapAlert(
            `${field === "fullName" ? "Фамилия и Имя" : "Номер группы"} не может быть пустым`,
            "warning"
          );
          editableField.textContent = originalValue;
          return;
        }

        if (
          field === "groupNumber" &&
          newValue &&
          !groupPattern.test(newValue)
        ) {
          showBootstrapAlert(
            "Номер группы должен быть в формате X-XX или XX-XX",
            "warning"
          );
          return;
        }

        const originalText = saveBtn.textContent;
        saveBtn.textContent = "Сохранение...";
        saveBtn.disabled = true;
        cancelBtn.disabled = true;

        try {
          const currentUser = await authService.getCurrentUser();
          if (!currentUser.success) {
            throw new Error("Не удалось загрузить текущие данные пользователя");
          }

          const updateData = {
            fullName:
              field === "fullName" ? newValue : currentUser.user.fullName || "",
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
            editableField.dataset.original = newValue;
            editableField.contentEditable = "false";
            editableField.classList.remove("editing");
            saveBtn.classList.add("hidden");
            saveBtn.classList.remove("show-inline-block");
            cancelBtn.classList.add("hidden");
            cancelBtn.classList.remove("show-inline-block");
            editBtn.classList.remove("hidden");
            editBtn.classList.add("show-inline-block");
            showBootstrapAlert("Данные успешно сохранены!", "success");
          } else {
            showBootstrapAlert(
              "Ошибка при сохранении: " + result.error,
              "danger"
            );
            editableField.textContent = originalValue;
          }
        } catch (error) {
          showBootstrapAlert(
            "Ошибка при сохранении: " + error.message,
            "danger"
          );
          editableField.textContent = originalValue;
        } finally {
          saveBtn.textContent = originalText;
          saveBtn.disabled = false;
          cancelBtn.disabled = false;
        }
      }
    }
  });

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
        editableField.textContent = editableField.dataset.original;
        editableField.contentEditable = "false";
        editableField.classList.remove("editing");
        saveBtn.classList.add("hidden");
        saveBtn.classList.remove("show-inline-block");
        cancelBtn.classList.add("hidden");
        cancelBtn.classList.remove("show-inline-block");
        editBtn.classList.remove("hidden");
        editBtn.classList.add("show-inline-block");
      }
    }
  });
}

