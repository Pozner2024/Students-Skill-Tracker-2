import Page from "../../common/Page.js";
import authService from "../../services/authService.js";
import { showBootstrapAlert } from "./alerts.js";
import { renderUserData, handleEditableFields } from "./userDataSection.js";
import {
  renderFilesSection,
  handleFileUpload,
  handleFileDelete,
} from "./filesSection.js";
import { renderTestResults } from "./testResultsSection.js";
import { handleProfileForm } from "./profileForm.js";

class ProfilePage extends Page {
  constructor() {
    super({
      id: "profile",
      title: "Добро пожаловать в Ваш личный кабинет",
      content: "",
      metaTitle: "Личный кабинет",
    });
  }

  async displayUserInfo() {
    try {
      const result = await authService.getCurrentUser();

      if (!result.success) {
        return `
          <div class="profile-container">
            <div class="alert alert-danger" role="alert">
              <h4 class="alert-heading">Ошибка загрузки данных</h4>
              <p>Не удалось загрузить информацию о пользователе: ${result.error}</p>
            </div>
          </div>
        `;
      }

      const testResults = await authService.getTestResults();
      const hasUserData = result.user.fullName && result.user.groupNumber;

      return `
          <div class="profile-container">
            ${
              !hasUserData
                ? `
              <form id="profile-form" class="profile-form">
                <div class="row g-3">
                  <div class="col-md-8 col-lg-8">
                    <label for="fullName" class="form-label">Фамилия и Имя:</label>
                    <input type="text" class="form-control" id="fullName" name="fullName" placeholder="Введите ваши фамилию и имя" value="${
                      result.user.fullName || ""
                    }">
                  </div>
                  <div class="col-md-4 col-lg-4">
                    <label for="groupNumber" class="form-label">Номер группы:</label>
                    <input type="text" class="form-control" id="groupNumber" name="groupNumber" placeholder="Введите номер группы" value="${
                      result.user.groupNumber || ""
                    }">
                  </div>
                </div>
                <div class="mt-3 text-center">
                  <button type="submit" id="save-btn" class="btn btn-primary">Сохранить</button>
                </div>
              </form>
            `
                : ""
            }
            ${renderUserData(result.user)}
            ${await renderFilesSection()}
            ${renderTestResults(testResults)}
          </div>
        `;
    } catch (error) {
      return `
        <div class="profile-container">
          <div class="alert alert-danger" role="alert">
            <h4 class="alert-heading">Ошибка</h4>
            <p>Произошла ошибка при загрузке данных: ${error.message}</p>
          </div>
        </div>
      `;
    }
  }

  async renderPage() {
    try {
      const userInfo = await this.displayUserInfo();
      return `
        <main id="${this.id}" class="container my-4 profile">
          <h1>${this.title}</h1>
          <section>
            ${userInfo}
          </section>
        </main>
      `;
    } catch (error) {
      console.error("Ошибка при рендеринге профиля:", error);
      const errorMessage =
        error.message ||
        "Не удалось загрузить данные профиля. Пожалуйста, обновите страницу.";
      return `
        <main id="${this.id}" class="container my-4 profile">
          <h1>${this.title}</h1>
          <section>
            <div class="profile-container">
              <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Ошибка загрузки профиля</h4>
                <p>${errorMessage}</p>
                <hr>
                <button onclick="window.location.reload()" class="btn btn-primary">
                  Обновить страницу
                </button>
              </div>
            </div>
          </section>
        </main>
      `;
    }
  }

  init() {
    setTimeout(() => {
      handleProfileForm();
      handleEditableFields();
      handleFileUpload();
      handleFileDelete();
    }, 10);
  }
}

export default ProfilePage;

