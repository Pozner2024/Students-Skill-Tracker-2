/**
 * Модуль для отображения уведомлений (алертов) на странице профиля
 * Использует Bootstrap Alert компоненты для создания всплывающих сообщений
 */

export function showBootstrapAlert(message, type = "info") {
  const existingAlert = document.querySelector(".bootstrap-alert-container");
  if (existingAlert) {
    existingAlert.remove();
  }

  const alertContainer = document.createElement("div");
  alertContainer.className =
    "bootstrap-alert-container position-fixed top-0 start-50 translate-middle-x mt-3";
  alertContainer.classList.add("bootstrap-alert-container");

  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.setAttribute("role", "alert");
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  alertContainer.appendChild(alertDiv);
  document.body.appendChild(alertContainer);

  setTimeout(() => {
    if (alertContainer.parentNode) {
      if (window.bootstrap && window.bootstrap.Alert) {
        const bsAlert = new window.bootstrap.Alert(alertDiv);
        bsAlert.close();
        setTimeout(() => {
          if (alertContainer.parentNode) {
            alertContainer.remove();
          }
        }, 300);
      } else {
        alertContainer.remove();
      }
    }
  }, 5000);
}

export function showSuccessMessage(message) {
  const existingMessage = document.querySelector(".upload-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageDiv = document.createElement("div");
  messageDiv.className =
    "upload-message alert alert-success alert-dismissible fade show";
  messageDiv.setAttribute("role", "alert");
  messageDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

  const filesSection = document.querySelector(".files-section");
  if (filesSection) {
    const filesList = filesSection.querySelector(".files-list");
    if (filesList) {
      filesSection.insertBefore(messageDiv, filesList);
    } else {
      filesSection.appendChild(messageDiv);
    }

    setTimeout(() => {
      if (messageDiv.parentNode) {
        if (window.bootstrap && window.bootstrap.Alert) {
          const bsAlert = new window.bootstrap.Alert(messageDiv);
          bsAlert.close();
        } else {
          messageDiv.remove();
        }
      }
    }, 3000);
  }
}

export function showErrorMessage(message) {
  const existingMessage = document.querySelector(".upload-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageDiv = document.createElement("div");
  messageDiv.className =
    "upload-message alert alert-danger alert-dismissible fade show";
  messageDiv.setAttribute("role", "alert");
  messageDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

  const filesSection = document.querySelector(".files-section");
  if (filesSection) {
    const filesList = filesSection.querySelector(".files-list");
    if (filesList) {
      filesSection.insertBefore(messageDiv, filesList);
    } else {
      filesSection.appendChild(messageDiv);
    }

    setTimeout(() => {
      if (messageDiv.parentNode) {
        if (window.bootstrap && window.bootstrap.Alert) {
          const bsAlert = new window.bootstrap.Alert(messageDiv);
          bsAlert.close();
        } else {
          messageDiv.remove();
        }
      }
    }, 5000);
  }
}
