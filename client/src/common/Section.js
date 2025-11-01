export default class Section {
  constructor({ id, customClass }) {
    this.id = id;
    this.customClass = customClass;
  }

  render() {
    return `<section id="${this.id}" class="${this.id} ${
      this.customClass || ""
    }"></section>`;
  }
}
