import Page from "../../common/Page.js";

class ContactsPage extends Page {
  constructor() {
    super({
      id: "contacts",
      title: "Контакты",
      content: `
        <div class="table-responsive">
          <table class="table table-bordered contact-table">
            <tbody>
              <tr>
                <td>
                  <p><strong>Учреждение образования:</strong> <span class="block">"Витебский государственный индустриальный колледж"</span></p>
                  <p><strong>Адрес:</strong></p>
                  <p>210038, г. Витебск, <span class="block">ул. Терешковой, 20 </span></p>
                  <p><strong>E-mail:</strong> <a href="mailto:mail@vgik.by">mail@vgik.by</a></p>
                </td>
                <td>
                  <p><strong>Время работы:</strong></p>
                  <p>ПН. – ПТ., 8:00 - 17:00</p>
                  <p><strong>Приёмная директора:</strong></p>
                  <p>Телефон/Факс: <a href="tel:+80212672029">+80 212 67 20 29</a></p>
                  <p><strong>Приёмная комиссия:</strong></p>
                  <p>Телефон: <a href="tel:+375292407898">+375 29 240 78 98</a></p>
                  <p><strong>Учебная часть:</strong></p>
                  <p>Телефон: <a href="tel:+80212673215">+80 212 67 32 15</a></p>
                </td>
              </tr>
              <!-- Горизонтальная линия -->
              <tr>
                <td colspan="2" class="horizontal-line"></td>
              </tr>
            </tbody>
          </table>
        </div>
      `,
      metaTitle: "Контакты",
    });
  }

  renderPage() {
    return this.render("container my-4 contacts");
  }
}

export default ContactsPage;

