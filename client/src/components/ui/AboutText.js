import Section from "../../common/Section";

export default class AboutText extends Section {
  constructor() {
    super({ id: "about-text", customClass: "about" });
  }

  render() {
    return `<section id="${this.id}" class="${this.id} ${this.customClass}">
                  </section>`;
  }
}

