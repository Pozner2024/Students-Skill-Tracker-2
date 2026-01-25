import authService from "../../services/authService.js";
import { showBootstrapAlert } from "./alerts.js";

export function handleProfileForm() {
  const profileForm = document.getElementById("profile-form");

  if (profileForm) {
    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const fullName = document.getElementById("fullName").value.trim();
      const groupNumber = document.getElementById("groupNumber").value.trim();
      const groupPattern = /^(?:\d-\d{2}|\d{2}-\d{2})$/;

      if (groupNumber && !groupPattern.test(groupNumber)) {
        showBootstrapAlert(
          "Номер группы должен быть в формате X-XX или XX-XX",
          "warning"
        );
        return;
      }

      const saveBtn = document.getElementById("save-btn");
      const originalText = saveBtn.textContent;
      saveBtn.textContent = "Сохранение...";
      saveBtn.disabled = true;

      try {
        const result = await authService.updateProfile(fullName, groupNumber);

        if (result.success) {
          showBootstrapAlert("Данные успешно сохранены!", "success");
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          showBootstrapAlert(
            "Ошибка при сохранении: " + result.error,
            "danger"
          );
        }
      } catch (error) {
        showBootstrapAlert(
          "Ошибка при сохранении: " + error.message,
          "danger"
        );
      } finally {
        if (saveBtn) {
          saveBtn.textContent = originalText;
          saveBtn.disabled = false;
        }
      }
    });
  }
}

