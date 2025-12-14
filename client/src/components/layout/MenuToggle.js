class MenuToggle {
  constructor(navbarCollapseId, root = "#menu") {
    this.root = typeof root === "string" ? document.querySelector(root) : root;

    if (!this.root) {
      console.warn("MenuToggle: root не найден:", root);
      return;
    }

    this.navbarCollapse = this.root.querySelector(`#${navbarCollapseId}`);
    this.navbarToggler = this.root.querySelector(".navbar-toggler");
    this.navbarCloseBtn = this.root.querySelector(".navbar-close-btn");

    if (!this.navbarCollapse || !this.navbarToggler || !this.navbarCloseBtn) {
      console.warn("MenuToggle: необходимые элементы не найдены в root");
      return;
    }

    this._bsCollapse = null;

    this.handleShow = this.handleShow.bind(this);
    this.handleHidden = this.handleHidden.bind(this);
    this.handleResize = this.handleResize.bind(this);

    this.init();
  }

  isMobile() {
    return window.innerWidth <= 991;
  }

  init() {
    if (window.bootstrap && window.bootstrap.Collapse) {
      try {
        this._bsCollapse =
          window.bootstrap.Collapse.getInstance(this.navbarCollapse) ||
          new window.bootstrap.Collapse(this.navbarCollapse, { toggle: false });
      } catch (e) {
        this._bsCollapse = null;
      }
    }

    this.navbarToggler.style.display = "";
    this.navbarCloseBtn.style.display = "none";

    this.navbarCollapse.addEventListener("show.bs.collapse", this.handleShow);
    this.navbarCollapse.addEventListener(
      "hidden.bs.collapse",
      this.handleHidden
    );

    window.addEventListener("resize", this.handleResize);

    this.syncState();
  }

  isOpen() {
    return this.navbarCollapse.classList.contains("show");
  }

  open() {
    if (this._bsCollapse) this._bsCollapse.show();
    else {
      this.navbarCollapse.classList.add("show");
      this.syncState();
    }
  }

  close() {
    if (!this.isOpen()) return;
    if (this._bsCollapse) this._bsCollapse.hide();
    else {
      this.navbarCollapse.classList.remove("show");
      this.syncState();
    }
  }

  toggle() {
    this.isOpen() ? this.close() : this.open();
  }

  handleShow() {
    if (this.isMobile()) {
      this.navbarToggler.style.display = "none";
      this.navbarCloseBtn.style.display = "flex";
    } else {
      this.resetDesktopState();
    }
  }

  handleHidden() {
    if (this.isMobile()) {
      this.navbarToggler.style.display = "block";
      this.navbarCloseBtn.style.display = "none";
    } else {
      this.resetDesktopState();
    }
  }

  handleResize() {
    if (this.isMobile()) {
      this.syncState();
    } else {
      this.resetDesktopState();
    }
  }

  syncState() {
    if (!this.isMobile()) {
      this.resetDesktopState();
      return;
    }

    if (this.isOpen()) {
      this.navbarToggler.style.display = "none";
      this.navbarCloseBtn.style.display = "flex";
    } else {
      this.navbarToggler.style.display = "block";
      this.navbarCloseBtn.style.display = "none";
    }
  }

  resetDesktopState() {
    this.navbarToggler.style.display = "";
    this.navbarCloseBtn.style.display = "";
  }

  destroy() {
    if (this.navbarCollapse) {
      this.navbarCollapse.removeEventListener(
        "show.bs.collapse",
        this.handleShow
      );
      this.navbarCollapse.removeEventListener(
        "hidden.bs.collapse",
        this.handleHidden
      );
    }
    window.removeEventListener("resize", this.handleResize);

    this._bsCollapse = null;
    this.root = null;
    this.navbarCollapse = null;
    this.navbarToggler = null;
    this.navbarCloseBtn = null;
  }
}

export default MenuToggle;
