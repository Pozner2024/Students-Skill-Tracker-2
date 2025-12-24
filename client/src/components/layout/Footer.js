import Section from "../../common/Section";

export default class Footer extends Section {
  constructor() {
    super({ id: "footer", customClass: "site-footer" });
  }

  render() {
    return `<section id="${this.id}" class="${this.id} ${this.customClass}">
              <footer class="text-center py-3">© 2026 </footer>
            </section>`;
  }
}
