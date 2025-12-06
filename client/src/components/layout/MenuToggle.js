// Класс для управления переключением между бургер-меню и крестиком
class MenuToggle {
  constructor(navbarCollapseId) {
    this.navbarCollapse = document.getElementById(navbarCollapseId);
    this.navbarToggler = document.querySelector("#menu .navbar-toggler");
    this.navbarCloseBtn = document.querySelector(
      "#menu .navbar-close-btn"
    );

    if (!this.navbarCollapse || !this.navbarToggler || !this.navbarCloseBtn) {
      console.warn("MenuToggle: не все элементы найдены");
      return;
    }

    this.init();
  }

  init() {
    // Скрываем крестик по умолчанию
    this.navbarCloseBtn.style.display = "none";

    // Сохраняем позицию скролла для восстановления
    this.scrollPosition = 0;

    // Функция для скрытия бургер-меню и показа крестика (только на мобильных)
    this.hideTogglerShowClose = () => {
      if (window.innerWidth <= 991) {
        if (this.navbarToggler) {
          this.navbarToggler.style.display = "none";
        }
        if (this.navbarCloseBtn) {
          this.navbarCloseBtn.style.display = "flex";
        }
      } else {
        // На десктопе всегда полагаемся на CSS: очищаем inline-стили
        this.resetDesktopState();
      }
      // Блокируем скролл body на мобильных устройствах
      this.lockBodyScroll();
    };

    // Функция для показа бургер-меню и скрытия крестика (только на мобильных)
    this.showTogglerHideClose = () => {
      if (window.innerWidth <= 991) {
        if (this.navbarToggler) {
          this.navbarToggler.style.display = "block";
        }
        if (this.navbarCloseBtn) {
          this.navbarCloseBtn.style.display = "none";
        }
      } else {
        // На десктопе восстанавливаем чистое состояние
        this.resetDesktopState();
      }
      // Разблокируем скролл body
      this.unlockBodyScroll();
    };

    // Обрабатываем начало открытия меню - переключаем иконки СРАЗУ, до анимации
    this.handleShowCollapse = () => {
      // Переключаем иконки сразу при начале открытия (до анимации)
      this.hideTogglerShowClose();
    };

    // Обрабатываем только финальные события Bootstrap для синхронизации состояния
    // shown.bs.collapse - меню полностью открыто (для синхронизации на случай программных изменений)
    this.handleShownCollapse = () => {
      // Убеждаемся, что иконки в правильном состоянии
      if (window.innerWidth <= 991) {
        this.hideTogglerShowClose();
      }
    };
    this.navbarCollapse.addEventListener(
      "shown.bs.collapse",
      this.handleShownCollapse
    );

    // Обрабатываем начало закрытия - скрываем крестик СРАЗУ, до анимации
    this.handleHideCollapse = () => {
      if (window.innerWidth <= 991) {
        // Скрываем крестик сразу при начале закрытия
        if (this.navbarCloseBtn) {
          this.navbarCloseBtn.style.display = "none";
        }
      }
    };

    // hidden.bs.collapse - меню полностью закрыто
    this.navbarCollapse.addEventListener(
      "hidden.bs.collapse",
      this.showTogglerHideClose
    );

    // Обрабатываем начало открытия - переключаем иконки ДО анимации
    this.navbarCollapse.addEventListener(
      "show.bs.collapse",
      this.handleShowCollapse
    );

    // Обрабатываем начало закрытия - скрываем крестик ДО анимации
    this.navbarCollapse.addEventListener(
      "hide.bs.collapse",
      this.handleHideCollapse
    );

    // Проверяем начальное состояние (на случай если меню уже открыто)
    this.updateIconsState();

    // Обработчик изменения размера окна: переключение между мобильным и десктопом
    this.handleResize = () => {
      if (window.innerWidth > 991) {
        // Десктоп: полностью очищаем inline-стили и скролл
        this.resetDesktopState();
      } else {
        // Мобильный: синхронизируем состояние иконок
        this.updateIconsState();
      }
    };
    window.addEventListener("resize", this.handleResize);

    // Используем MutationObserver только как fallback для программных изменений
    // с debounce для избежания множественных вызовов
    let observerTimeout;
    this.observer = new MutationObserver(() => {
      clearTimeout(observerTimeout);
      observerTimeout = setTimeout(() => {
        this.updateIconsState();
      }, 50); // debounce 50ms
    });

    this.observer.observe(this.navbarCollapse, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  // Метод для обновления состояния иконок на основе текущего состояния меню
  updateIconsState() {
    if (window.innerWidth > 991) {
      // На десктопе всё контролируется CSS
      this.resetDesktopState();
      return;
    }

    if (this.navbarCollapse.classList.contains("show")) {
      this.hideTogglerShowClose();
    } else {
      this.showTogglerHideClose();
    }
  }

  // Сброс состояния для десктопной версии (убираем inline-стили, разблокируем скролл)
  resetDesktopState() {
    this.unlockBodyScroll();
    if (this.navbarToggler) {
      this.navbarToggler.style.display = "";
    }
    if (this.navbarCloseBtn) {
      this.navbarCloseBtn.style.display = "";
    }
  }

  // Блокировка скролла body (только на мобильных устройствах)
  lockBodyScroll() {
    // Проверяем, что мы на мобильном устройстве
    if (window.innerWidth <= 991) {
      // Сохраняем текущую позицию скролла
      this.scrollPosition =
        window.pageYOffset || document.documentElement.scrollTop;

      // Блокируем скролл
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${this.scrollPosition}px`;
      document.body.style.width = "100%";
    }
  }

  // Разблокировка скролла body
  unlockBodyScroll() {
    // Восстанавливаем скролл
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";

    // Восстанавливаем позицию скролла
    if (this.scrollPosition !== undefined) {
      window.scrollTo(0, this.scrollPosition);
      this.scrollPosition = 0;
    }
  }

  // Метод для программного закрытия меню (для использования извне)
  closeMenu() {
    if (!this.navbarCollapse) {
      return;
    }

    // Проверяем, открыто ли меню
    if (!this.navbarCollapse.classList.contains("show")) {
      return;
    }

    // Проверяем, что мы на мобильном устройстве
    if (window.innerWidth > 991) {
      return; // На десктопе меню всегда видно
    }

    // Пробуем использовать Bootstrap API
    if (window.bootstrap && window.bootstrap.Collapse) {
      const bsCollapse = window.bootstrap.Collapse.getInstance(
        this.navbarCollapse
      );
      if (bsCollapse) {
        bsCollapse.hide();
        return;
      }

      // Если экземпляр не существует, создаем новый
      try {
        const collapse = new window.bootstrap.Collapse(this.navbarCollapse, {
          toggle: false,
        });
        collapse.hide();
        return;
      } catch (error) {
        console.warn("Ошибка при закрытии меню через Bootstrap:", error);
      }
    }

    // Fallback: закрываем вручную, убирая класс show
    this.navbarCollapse.classList.remove("show");
    this.showTogglerHideClose();
  }

  // Метод для очистки ресурсов
  destroy() {
    // Разблокируем скролл при уничтожении компонента
    this.unlockBodyScroll();

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.handleResize) {
      window.removeEventListener("resize", this.handleResize);
    }
    if (this.navbarCollapse) {
      // Удаляем обработчики событий Bootstrap
      if (this.handleShowCollapse) {
        this.navbarCollapse.removeEventListener(
          "show.bs.collapse",
          this.handleShowCollapse
        );
      }
      if (this.handleHideCollapse) {
        this.navbarCollapse.removeEventListener(
          "hide.bs.collapse",
          this.handleHideCollapse
        );
      }
      if (this.handleShownCollapse) {
        this.navbarCollapse.removeEventListener(
          "shown.bs.collapse",
          this.handleShownCollapse
        );
      }
      this.navbarCollapse.removeEventListener(
        "hidden.bs.collapse",
        this.showTogglerHideClose
      );
    }
  }
}

export default MenuToggle;

